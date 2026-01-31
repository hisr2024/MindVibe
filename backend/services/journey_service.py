"""
Journey Service - Core business logic for Wisdom Journeys.

This service handles all journey-related operations with proper error handling,
caching, and database transactions.
"""

from __future__ import annotations

import datetime
import logging
import uuid
from typing import Any

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models import (
    JourneyTemplate,
    JourneyTemplateStep,
    UserJourney,
    UserJourneyStepState,
    UserJourneyStatus,
    User,
)

logger = logging.getLogger(__name__)


class JourneyServiceError(Exception):
    """Base exception for journey service errors."""

    def __init__(self, message: str, code: str = "JOURNEY_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class JourneyNotFoundError(JourneyServiceError):
    """Raised when a journey is not found."""

    def __init__(self, journey_id: str):
        super().__init__(f"Journey not found: {journey_id}", "JOURNEY_NOT_FOUND")


class TemplateNotFoundError(JourneyServiceError):
    """Raised when a journey template is not found."""

    def __init__(self, template_id: str):
        super().__init__(f"Template not found: {template_id}", "TEMPLATE_NOT_FOUND")


class JourneyLimitExceededError(JourneyServiceError):
    """Raised when user exceeds their journey limit."""

    def __init__(self, limit: int):
        super().__init__(
            f"You can only have {limit} active journeys at a time",
            "JOURNEY_LIMIT_EXCEEDED"
        )


class JourneyAlreadyStartedError(JourneyServiceError):
    """Raised when user tries to start a journey they already have active."""

    def __init__(self, template_slug: str):
        super().__init__(
            f"You already have an active journey for: {template_slug}",
            "JOURNEY_ALREADY_STARTED"
        )


class StepAlreadyCompletedError(JourneyServiceError):
    """Raised when user tries to complete a step that's already done."""

    def __init__(self, day_index: int):
        super().__init__(
            f"Day {day_index} is already completed",
            "STEP_ALREADY_COMPLETED"
        )


class JourneyService:
    """
    Service class for managing wisdom journeys.

    Provides methods for:
    - Fetching journey catalog
    - Starting/pausing/resuming/abandoning journeys
    - Completing journey steps
    - Getting journey progress
    """

    # Default journey limit for free users
    DEFAULT_JOURNEY_LIMIT = 1
    # Premium journey limit
    PREMIUM_JOURNEY_LIMIT = 5

    def __init__(self, session: AsyncSession):
        self.session = session

    # =========================================================================
    # CATALOG OPERATIONS
    # =========================================================================

    async def get_catalog(
        self,
        include_inactive: bool = False
    ) -> list[dict[str, Any]]:
        """
        Get all available journey templates.

        Args:
            include_inactive: Whether to include inactive templates (admin only)

        Returns:
            List of journey template dictionaries
        """
        try:
            query = select(JourneyTemplate).options(
                selectinload(JourneyTemplate.steps)
            )

            if not include_inactive:
                query = query.where(JourneyTemplate.is_active == True)

            query = query.order_by(
                JourneyTemplate.is_featured.desc(),
                JourneyTemplate.created_at.desc()
            )

            result = await self.session.execute(query)
            templates = result.scalars().all()

            return [self._template_to_dict(t) for t in templates]

        except Exception as e:
            logger.error(f"Error fetching journey catalog: {e}")
            raise JourneyServiceError(
                "Failed to fetch journey catalog",
                "CATALOG_FETCH_ERROR"
            )

    async def get_template_by_slug(self, slug: str) -> JourneyTemplate | None:
        """Get a journey template by its slug."""
        query = select(JourneyTemplate).where(
            JourneyTemplate.slug == slug,
            JourneyTemplate.is_active == True
        ).options(selectinload(JourneyTemplate.steps))

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_template_by_id(self, template_id: str) -> JourneyTemplate | None:
        """Get a journey template by its ID."""
        query = select(JourneyTemplate).where(
            JourneyTemplate.id == template_id
        ).options(selectinload(JourneyTemplate.steps))

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    # =========================================================================
    # USER JOURNEY OPERATIONS
    # =========================================================================

    async def get_active_journeys(
        self,
        user_id: str
    ) -> list[dict[str, Any]]:
        """
        Get all active journeys for a user.

        Args:
            user_id: The user's ID

        Returns:
            List of active journey dictionaries with progress info
        """
        try:
            query = select(UserJourney).where(
                UserJourney.user_id == user_id,
                UserJourney.status == UserJourneyStatus.ACTIVE.value,
                UserJourney.deleted_at.is_(None)
            ).options(
                selectinload(UserJourney.template),
                selectinload(UserJourney.step_states)
            ).order_by(UserJourney.created_at.desc())

            result = await self.session.execute(query)
            journeys = result.scalars().all()

            return [await self._journey_to_dict(j) for j in journeys]

        except Exception as e:
            logger.error(f"Error fetching active journeys for user {user_id}: {e}")
            raise JourneyServiceError(
                "Failed to fetch active journeys",
                "ACTIVE_JOURNEYS_FETCH_ERROR"
            )

    async def get_journey(
        self,
        journey_id: str,
        user_id: str
    ) -> dict[str, Any]:
        """
        Get a specific journey with full details.

        Args:
            journey_id: The journey ID
            user_id: The user's ID (for authorization)

        Returns:
            Journey dictionary with all details
        """
        journey = await self._get_user_journey(journey_id, user_id)
        return await self._journey_to_dict(journey, include_steps=True)

    async def start_journey(
        self,
        user_id: str,
        template_slug: str,
        personalization: dict[str, Any] | None = None,
        journey_limit: int | None = None
    ) -> dict[str, Any]:
        """
        Start a new journey for a user.

        Args:
            user_id: The user's ID
            template_slug: The template slug to start
            personalization: Optional personalization settings
            journey_limit: Maximum active journeys allowed (None = default)

        Returns:
            The newly created journey dictionary
        """
        try:
            # Get the template
            template = await self.get_template_by_slug(template_slug)
            if not template:
                raise TemplateNotFoundError(template_slug)

            # Check if user already has this journey active
            existing_query = select(UserJourney).where(
                UserJourney.user_id == user_id,
                UserJourney.journey_template_id == template.id,
                UserJourney.status == UserJourneyStatus.ACTIVE.value,
                UserJourney.deleted_at.is_(None)
            )
            existing_result = await self.session.execute(existing_query)
            if existing_result.scalar_one_or_none():
                raise JourneyAlreadyStartedError(template_slug)

            # Check journey limit
            limit = journey_limit or self.DEFAULT_JOURNEY_LIMIT
            active_count = await self._count_active_journeys(user_id)
            if active_count >= limit:
                raise JourneyLimitExceededError(limit)

            # Create the journey
            journey = UserJourney(
                id=str(uuid.uuid4()),
                user_id=user_id,
                journey_template_id=template.id,
                status=UserJourneyStatus.ACTIVE.value,
                current_day_index=1,
                personalization=personalization or {},
                started_at=datetime.datetime.now(datetime.UTC)
            )

            self.session.add(journey)
            await self.session.commit()
            await self.session.refresh(journey)

            # Load relationships
            query = select(UserJourney).where(
                UserJourney.id == journey.id
            ).options(
                selectinload(UserJourney.template).selectinload(JourneyTemplate.steps),
                selectinload(UserJourney.step_states)
            )
            result = await self.session.execute(query)
            journey = result.scalar_one()

            logger.info(f"User {user_id} started journey {journey.id} ({template_slug})")

            return await self._journey_to_dict(journey)

        except JourneyServiceError:
            raise
        except Exception as e:
            logger.error(f"Error starting journey for user {user_id}: {e}")
            await self.session.rollback()
            raise JourneyServiceError(
                "Failed to start journey",
                "JOURNEY_START_ERROR"
            )

    async def pause_journey(
        self,
        journey_id: str,
        user_id: str
    ) -> dict[str, Any]:
        """Pause a journey."""
        journey = await self._get_user_journey(journey_id, user_id)

        if journey.status != UserJourneyStatus.ACTIVE.value:
            raise JourneyServiceError(
                "Only active journeys can be paused",
                "INVALID_JOURNEY_STATE"
            )

        journey.status = UserJourneyStatus.PAUSED.value
        journey.paused_at = datetime.datetime.now(datetime.UTC)
        journey.updated_at = datetime.datetime.now(datetime.UTC)

        await self.session.commit()
        logger.info(f"User {user_id} paused journey {journey_id}")

        return await self._journey_to_dict(journey)

    async def resume_journey(
        self,
        journey_id: str,
        user_id: str
    ) -> dict[str, Any]:
        """Resume a paused journey."""
        journey = await self._get_user_journey(journey_id, user_id)

        if journey.status != UserJourneyStatus.PAUSED.value:
            raise JourneyServiceError(
                "Only paused journeys can be resumed",
                "INVALID_JOURNEY_STATE"
            )

        journey.status = UserJourneyStatus.ACTIVE.value
        journey.paused_at = None
        journey.updated_at = datetime.datetime.now(datetime.UTC)

        await self.session.commit()
        logger.info(f"User {user_id} resumed journey {journey_id}")

        return await self._journey_to_dict(journey)

    async def abandon_journey(
        self,
        journey_id: str,
        user_id: str
    ) -> dict[str, Any]:
        """Abandon a journey (soft delete)."""
        journey = await self._get_user_journey(journey_id, user_id)

        if journey.status == UserJourneyStatus.COMPLETED.value:
            raise JourneyServiceError(
                "Cannot abandon a completed journey",
                "INVALID_JOURNEY_STATE"
            )

        journey.status = UserJourneyStatus.ABANDONED.value
        journey.updated_at = datetime.datetime.now(datetime.UTC)

        await self.session.commit()
        logger.info(f"User {user_id} abandoned journey {journey_id}")

        return await self._journey_to_dict(journey)

    # =========================================================================
    # STEP OPERATIONS
    # =========================================================================

    async def get_today_step(
        self,
        journey_id: str,
        user_id: str
    ) -> dict[str, Any]:
        """
        Get today's step for a journey.

        Returns the current step content, or generates it if needed.
        """
        journey = await self._get_user_journey(journey_id, user_id)

        if journey.status != UserJourneyStatus.ACTIVE.value:
            raise JourneyServiceError(
                "Journey is not active",
                "JOURNEY_NOT_ACTIVE"
            )

        # Get or create step state for current day
        step_state = await self._get_or_create_step_state(
            journey,
            journey.current_day_index
        )

        # Get template step info
        template_step = None
        if journey.template and journey.template.steps:
            for step in journey.template.steps:
                if step.day_index == journey.current_day_index:
                    template_step = step
                    break

        return self._step_state_to_dict(step_state, template_step, journey.template)

    async def complete_step(
        self,
        journey_id: str,
        user_id: str,
        day_index: int,
        reflection: str | None = None,
        check_in_data: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """
        Mark a journey step as complete.

        Args:
            journey_id: The journey ID
            user_id: The user's ID
            day_index: The day index to complete
            reflection: Optional reflection text
            check_in_data: Optional check-in data (mood scale, etc.)

        Returns:
            Updated journey with progress
        """
        journey = await self._get_user_journey(journey_id, user_id)

        if journey.status != UserJourneyStatus.ACTIVE.value:
            raise JourneyServiceError(
                "Journey is not active",
                "JOURNEY_NOT_ACTIVE"
            )

        # Validate day index
        if day_index != journey.current_day_index:
            raise JourneyServiceError(
                f"You must complete day {journey.current_day_index} first",
                "INVALID_DAY_INDEX"
            )

        # Get step state
        step_state = await self._get_or_create_step_state(journey, day_index)

        if step_state.completed_at is not None:
            raise StepAlreadyCompletedError(day_index)

        # Update step state
        now = datetime.datetime.now(datetime.UTC)
        step_state.completed_at = now
        step_state.updated_at = now

        if reflection:
            # Store reflection (in production, this should be encrypted)
            step_state.reflection_encrypted = {
                "text": reflection,
                "encrypted": False  # TODO: Implement encryption
            }

        if check_in_data:
            step_state.check_in = check_in_data

        # Check if journey is complete
        total_days = journey.template.duration_days if journey.template else 14

        if day_index >= total_days:
            # Journey complete!
            journey.status = UserJourneyStatus.COMPLETED.value
            journey.completed_at = now
            logger.info(f"User {user_id} completed journey {journey_id}")
        else:
            # Advance to next day
            journey.current_day_index = day_index + 1

        journey.updated_at = now

        await self.session.commit()

        return await self._journey_to_dict(journey)

    async def get_today_agenda(
        self,
        user_id: str
    ) -> list[dict[str, Any]]:
        """
        Get today's agenda for all active journeys.

        Returns a list of today's steps across all active journeys.
        """
        active_journeys = await self.get_active_journeys(user_id)

        agenda = []
        for journey in active_journeys:
            try:
                step = await self.get_today_step(journey["id"], user_id)
                agenda.append({
                    "journey": journey,
                    "today_step": step
                })
            except Exception as e:
                logger.warning(f"Error getting today's step for journey {journey['id']}: {e}")
                # Include journey but mark step as unavailable
                agenda.append({
                    "journey": journey,
                    "today_step": None,
                    "error": str(e)
                })

        return agenda

    # =========================================================================
    # PRIVATE HELPERS
    # =========================================================================

    async def _get_user_journey(
        self,
        journey_id: str,
        user_id: str
    ) -> UserJourney:
        """Get a journey and verify ownership."""
        query = select(UserJourney).where(
            UserJourney.id == journey_id,
            UserJourney.deleted_at.is_(None)
        ).options(
            selectinload(UserJourney.template).selectinload(JourneyTemplate.steps),
            selectinload(UserJourney.step_states)
        )

        result = await self.session.execute(query)
        journey = result.scalar_one_or_none()

        if not journey:
            raise JourneyNotFoundError(journey_id)

        if journey.user_id != user_id:
            # Security: Don't reveal that the journey exists
            raise JourneyNotFoundError(journey_id)

        return journey

    async def _count_active_journeys(self, user_id: str) -> int:
        """Count user's active journeys."""
        query = select(func.count()).select_from(UserJourney).where(
            UserJourney.user_id == user_id,
            UserJourney.status == UserJourneyStatus.ACTIVE.value,
            UserJourney.deleted_at.is_(None)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def _get_or_create_step_state(
        self,
        journey: UserJourney,
        day_index: int
    ) -> UserJourneyStepState:
        """Get or create a step state for a specific day."""
        # Check if step state exists
        for state in journey.step_states:
            if state.day_index == day_index:
                return state

        # Create new step state
        step_state = UserJourneyStepState(
            id=str(uuid.uuid4()),
            user_journey_id=journey.id,
            day_index=day_index,
            delivered_at=datetime.datetime.now(datetime.UTC),
            verse_refs=[],
            kiaan_step_json=self._generate_step_content(journey, day_index)
        )

        self.session.add(step_state)
        await self.session.flush()

        return step_state

    def _generate_step_content(
        self,
        journey: UserJourney,
        day_index: int
    ) -> dict[str, Any]:
        """
        Generate step content for a day.

        In a full implementation, this would call KIAAN AI.
        For now, returns template-based content.
        """
        template_step = None
        if journey.template and journey.template.steps:
            for step in journey.template.steps:
                if step.day_index == day_index:
                    template_step = step
                    break

        if template_step:
            return {
                "step_title": template_step.step_title or f"Day {day_index}",
                "today_focus": journey.template.primary_enemy_tags[0] if journey.template.primary_enemy_tags else "general",
                "verse_refs": template_step.static_verse_refs or [],
                "teaching": template_step.teaching_hint or "Continue your journey of inner transformation.",
                "guided_reflection": [
                    template_step.reflection_prompt or "How do you feel today?",
                    "What challenges have you faced?",
                    "What insights have you gained?"
                ],
                "practice": {
                    "name": "Daily Reflection",
                    "instructions": [
                        "Find a quiet space",
                        "Take 5 deep breaths",
                        template_step.practice_prompt or "Reflect on today's teaching"
                    ],
                    "duration_minutes": 10
                },
                "micro_commitment": "Today, I commit to practicing awareness.",
                "check_in_prompt": {
                    "scale": "1-10",
                    "label": "How connected do you feel to your inner peace?"
                }
            }

        # Default content if no template step
        return {
            "step_title": f"Day {day_index}",
            "today_focus": "general",
            "verse_refs": [],
            "teaching": "Continue your journey toward inner peace.",
            "guided_reflection": [
                "How do you feel today?",
                "What are you grateful for?",
                "What is one thing you can do differently today?"
            ],
            "practice": {
                "name": "Daily Meditation",
                "instructions": [
                    "Find a quiet space",
                    "Close your eyes",
                    "Focus on your breath for 5 minutes"
                ],
                "duration_minutes": 5
            },
            "micro_commitment": "I commit to being present in this moment.",
            "check_in_prompt": {
                "scale": "1-10",
                "label": "How at peace do you feel right now?"
            }
        }

    def _template_to_dict(self, template: JourneyTemplate) -> dict[str, Any]:
        """Convert a template to a dictionary."""
        return {
            "id": template.id,
            "slug": template.slug,
            "title": template.title,
            "description": template.description,
            "duration_days": template.duration_days,
            "difficulty": template.difficulty,
            "difficulty_label": self._difficulty_to_label(template.difficulty),
            "primary_enemy_tags": template.primary_enemy_tags or [],
            "is_featured": template.is_featured,
            "is_free": template.is_free,
            "icon_name": template.icon_name,
            "color_theme": template.color_theme,
            "step_count": len(template.steps) if template.steps else template.duration_days
        }

    async def _journey_to_dict(
        self,
        journey: UserJourney,
        include_steps: bool = False
    ) -> dict[str, Any]:
        """Convert a journey to a dictionary."""
        total_days = journey.template.duration_days if journey.template else 14
        completed_days = len([
            s for s in journey.step_states
            if s.completed_at is not None
        ])
        progress = round((completed_days / total_days) * 100, 1) if total_days > 0 else 0

        result = {
            "id": journey.id,
            "status": journey.status,
            "current_day_index": journey.current_day_index,
            "total_days": total_days,
            "completed_days": completed_days,
            "progress": progress,
            "started_at": journey.started_at.isoformat() if journey.started_at else None,
            "completed_at": journey.completed_at.isoformat() if journey.completed_at else None,
            "paused_at": journey.paused_at.isoformat() if journey.paused_at else None,
            "personalization": journey.personalization or {},
            "template": self._template_to_dict(journey.template) if journey.template else None
        }

        if include_steps:
            result["steps"] = [
                self._step_state_to_dict(s, None, journey.template)
                for s in sorted(journey.step_states, key=lambda x: x.day_index)
            ]

        return result

    def _step_state_to_dict(
        self,
        step_state: UserJourneyStepState,
        template_step: JourneyTemplateStep | None,
        template: JourneyTemplate | None
    ) -> dict[str, Any]:
        """Convert a step state to a dictionary."""
        return {
            "id": step_state.id,
            "day_index": step_state.day_index,
            "is_completed": step_state.completed_at is not None,
            "completed_at": step_state.completed_at.isoformat() if step_state.completed_at else None,
            "delivered_at": step_state.delivered_at.isoformat() if step_state.delivered_at else None,
            "verse_refs": step_state.verse_refs or [],
            "content": step_state.kiaan_step_json,
            "check_in": step_state.check_in,
            "has_reflection": step_state.reflection_encrypted is not None,
            "template_info": {
                "step_title": template_step.step_title if template_step else None,
                "teaching_hint": template_step.teaching_hint if template_step else None,
            } if template_step else None
        }

    @staticmethod
    def _difficulty_to_label(difficulty: int) -> str:
        """Convert difficulty number to label."""
        labels = {
            1: "Beginner",
            2: "Easy",
            3: "Moderate",
            4: "Challenging",
            5: "Advanced"
        }
        return labels.get(difficulty, "Moderate")


# Factory function
def get_journey_service(session: AsyncSession) -> JourneyService:
    """Create a JourneyService instance."""
    return JourneyService(session)
