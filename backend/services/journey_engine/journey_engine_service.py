"""
Journey Engine Service - Multi-Journey Management & Enemy Progress Tracking.

This module provides:
1. Multi-journey management (users can run multiple journeys simultaneously)
2. Enemy progress tracking across all journeys
3. Journey lifecycle management (start, pause, resume, complete)
4. Daily step delivery and completion
5. Personalized recommendations

Usage:
    from backend.services.journey_engine import JourneyEngineService

    service = JourneyEngineService(db)

    # Start a new journey
    journey = await service.start_journey(
        user_id="user-123",
        template_id="template-456",
        personalization={"pace": "daily", "preferred_tone": "gentle"}
    )

    # Get today's step
    step = await service.get_current_step(journey_id=journey.id)

    # Complete a step
    await service.complete_step(
        journey_id=journey.id,
        day_index=1,
        reflection="My reflection...",
        check_in={"intensity": 7}
    )
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Optional, TypedDict

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models import (
    JourneyTemplate,
    JourneyTemplateStep,
    UserJourney,
    UserJourneyStepState,
    GitaVerse,
)
from backend.models.base import UserJourneyStatus

logger = logging.getLogger(__name__)


# =============================================================================
# TYPE DEFINITIONS
# =============================================================================


class JourneyPace(str, Enum):
    """Pace preference for journey steps."""
    DAILY = "daily"
    EVERY_OTHER_DAY = "every_other_day"
    WEEKLY = "weekly"


class JourneyTone(str, Enum):
    """Tone preference for KIAAN responses."""
    GENTLE = "gentle"
    DIRECT = "direct"
    INSPIRING = "inspiring"


class PersonalizationDict(TypedDict, total=False):
    """Type definition for personalization settings."""
    pace: str
    time_budget_minutes: int
    focus_tags: list[str]
    preferred_tone: str
    provider_preference: str


@dataclass
class JourneyStats:
    """Statistics for a user's journey."""
    journey_id: str
    template_slug: str
    title: str
    status: str
    current_day: int
    total_days: int
    progress_percentage: float
    days_completed: int
    started_at: datetime
    last_activity: datetime | None
    primary_enemies: list[str]
    streak_days: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "journey_id": self.journey_id,
            "template_slug": self.template_slug,
            "title": self.title,
            "status": self.status,
            "current_day": self.current_day,
            "total_days": self.total_days,
            "progress_percentage": self.progress_percentage,
            "days_completed": self.days_completed,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "primary_enemies": self.primary_enemies,
            "streak_days": self.streak_days,
        }


@dataclass
class EnemyProgress:
    """Progress against a single inner enemy."""
    enemy: str
    enemy_label: str
    journeys_started: int
    journeys_completed: int
    total_days_practiced: int
    current_streak: int
    best_streak: int
    last_practice: datetime | None
    mastery_level: int  # 0-100

    def to_dict(self) -> dict[str, Any]:
        return {
            "enemy": self.enemy,
            "enemy_label": self.enemy_label,
            "journeys_started": self.journeys_started,
            "journeys_completed": self.journeys_completed,
            "total_days_practiced": self.total_days_practiced,
            "current_streak": self.current_streak,
            "best_streak": self.best_streak,
            "last_practice": self.last_practice.isoformat() if self.last_practice else None,
            "mastery_level": self.mastery_level,
        }


@dataclass
class DailyStep:
    """A user's daily step content."""
    step_id: str
    journey_id: str
    day_index: int
    step_title: str
    teaching: str
    guided_reflection: list[str]
    practice: dict[str, Any]
    verse_refs: list[dict[str, int]]
    verses: list[dict[str, Any]]
    micro_commitment: str | None
    check_in_prompt: dict[str, str] | None
    safety_note: str | None
    is_completed: bool
    completed_at: datetime | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "step_id": self.step_id,
            "journey_id": self.journey_id,
            "day_index": self.day_index,
            "step_title": self.step_title,
            "teaching": self.teaching,
            "guided_reflection": self.guided_reflection,
            "practice": self.practice,
            "verse_refs": self.verse_refs,
            "verses": self.verses,
            "micro_commitment": self.micro_commitment,
            "check_in_prompt": self.check_in_prompt,
            "safety_note": self.safety_note,
            "is_completed": self.is_completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


@dataclass
class Dashboard:
    """User's journey dashboard."""
    active_journeys: list[JourneyStats]
    completed_journeys: int
    total_days_practiced: int
    current_streak: int
    enemy_progress: list[EnemyProgress]
    recommended_templates: list[dict[str, Any]]
    today_steps: list[DailyStep]

    def to_dict(self) -> dict[str, Any]:
        return {
            "active_journeys": [j.to_dict() for j in self.active_journeys],
            "completed_journeys": self.completed_journeys,
            "total_days_practiced": self.total_days_practiced,
            "current_streak": self.current_streak,
            "enemy_progress": [e.to_dict() for e in self.enemy_progress],
            "recommended_templates": self.recommended_templates,
            "today_steps": [s.to_dict() for s in self.today_steps],
        }


# =============================================================================
# ENEMY LABELS
# =============================================================================


ENEMY_LABELS = {
    "kama": "Desire (Kāma)",
    "krodha": "Anger (Krodha)",
    "lobha": "Greed (Lobha)",
    "moha": "Attachment (Moha)",
    "mada": "Ego (Mada)",
    "matsarya": "Envy (Mātsarya)",
    "mixed": "Combined Journey",
    "general": "General Wisdom",
}


# =============================================================================
# EXCEPTIONS
# =============================================================================


class JourneyEngineError(Exception):
    """Base exception for Journey Engine."""
    pass


class JourneyNotFoundError(JourneyEngineError):
    """Journey not found."""
    pass


class TemplateNotFoundError(JourneyEngineError):
    """Template not found."""
    pass


class JourneyAlreadyCompletedError(JourneyEngineError):
    """Journey is already completed."""
    pass


class StepNotAvailableError(JourneyEngineError):
    """Step not available (not yet unlocked or already completed)."""
    pass


class MaxActiveJourneysError(JourneyEngineError):
    """User has reached maximum active journeys."""
    pass


# =============================================================================
# JOURNEY ENGINE SERVICE
# =============================================================================


class JourneyEngineService:
    """
    Main service for journey management.

    Provides:
    - Journey lifecycle management
    - Step delivery and completion
    - Progress tracking
    - Personalization
    """

    MAX_ACTIVE_JOURNEYS = 5  # Maximum concurrent journeys per user

    def __init__(self, db: AsyncSession):
        self.db = db

    # -------------------------------------------------------------------------
    # TEMPLATE MANAGEMENT
    # -------------------------------------------------------------------------

    async def list_templates(
        self,
        enemy_filter: str | None = None,
        difficulty_max: int | None = None,
        free_only: bool = False,
        featured_only: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[JourneyTemplate], int]:
        """
        List available journey templates with filtering.

        Returns:
            Tuple of (templates, total_count)
        """
        query = select(JourneyTemplate).where(
            JourneyTemplate.is_active == True,
            JourneyTemplate.deleted_at.is_(None),
        )

        # Apply filters
        if enemy_filter:
            # Filter by primary enemy tag (JSON array contains)
            query = query.where(
                func.jsonb_exists(
                    JourneyTemplate.primary_enemy_tags,
                    enemy_filter.lower()
                )
            )

        if difficulty_max:
            query = query.where(JourneyTemplate.difficulty <= difficulty_max)

        if free_only:
            query = query.where(JourneyTemplate.is_free == True)

        if featured_only:
            query = query.where(JourneyTemplate.is_featured == True)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total_count = total_result.scalar() or 0

        # Apply pagination and ordering
        query = query.order_by(
            JourneyTemplate.is_featured.desc(),
            JourneyTemplate.created_at.desc(),
        ).offset(offset).limit(limit)

        result = await self.db.execute(query)
        templates = result.scalars().all()

        return list(templates), total_count

    async def get_template(self, template_id: str) -> JourneyTemplate:
        """Get a template by ID with its steps."""
        query = (
            select(JourneyTemplate)
            .options(selectinload(JourneyTemplate.steps))
            .where(
                JourneyTemplate.id == template_id,
                JourneyTemplate.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(query)
        template = result.scalar_one_or_none()

        if not template:
            raise TemplateNotFoundError(f"Template {template_id} not found")

        return template

    async def get_template_by_slug(self, slug: str) -> JourneyTemplate:
        """Get a template by slug with its steps."""
        query = (
            select(JourneyTemplate)
            .options(selectinload(JourneyTemplate.steps))
            .where(
                JourneyTemplate.slug == slug,
                JourneyTemplate.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(query)
        template = result.scalar_one_or_none()

        if not template:
            raise TemplateNotFoundError(f"Template with slug '{slug}' not found")

        return template

    # -------------------------------------------------------------------------
    # JOURNEY LIFECYCLE
    # -------------------------------------------------------------------------

    async def start_journey(
        self,
        user_id: str,
        template_id: str,
        personalization: PersonalizationDict | None = None,
    ) -> UserJourney:
        """
        Start a new journey for the user.

        Args:
            user_id: User identifier
            template_id: Template to start
            personalization: Optional personalization settings

        Returns:
            Created UserJourney

        Raises:
            MaxActiveJourneysError: If user has too many active journeys
            TemplateNotFoundError: If template doesn't exist
        """
        # Check active journey limit
        active_count = await self._count_active_journeys(user_id)
        logger.info(f"User {user_id} has {active_count} active journeys (max: {self.MAX_ACTIVE_JOURNEYS})")
        if active_count >= self.MAX_ACTIVE_JOURNEYS:
            raise MaxActiveJourneysError(
                f"You have {active_count} active journeys (maximum {self.MAX_ACTIVE_JOURNEYS} allowed). "
                "Please complete or abandon an existing journey first."
            )

        # Verify template exists
        template = await self.get_template(template_id)

        # Create journey
        journey = UserJourney(
            id=str(uuid.uuid4()),
            user_id=user_id,
            journey_template_id=template.id,
            status=UserJourneyStatus.ACTIVE,
            current_day_index=1,
            personalization=personalization or {},
            started_at=datetime.utcnow(),
        )

        self.db.add(journey)
        await self.db.flush()

        logger.info(
            f"User {user_id} started journey {journey.id} "
            f"(template: {template.slug})"
        )

        return journey

    async def pause_journey(self, user_id: str, journey_id: str) -> UserJourney:
        """Pause an active journey."""
        journey = await self._get_user_journey(user_id, journey_id)

        if journey.status != UserJourneyStatus.ACTIVE.value:
            raise JourneyEngineError(
                f"Cannot pause journey in '{journey.status}' status"
            )

        journey.status = UserJourneyStatus.PAUSED.value
        journey.paused_at = datetime.utcnow()

        await self.db.flush()
        logger.info(f"User {user_id} paused journey {journey_id}")

        return journey

    async def resume_journey(self, user_id: str, journey_id: str) -> UserJourney:
        """Resume a paused journey."""
        journey = await self._get_user_journey(user_id, journey_id)

        if journey.status != UserJourneyStatus.PAUSED.value:
            raise JourneyEngineError(
                f"Cannot resume journey in '{journey.status}' status"
            )

        journey.status = UserJourneyStatus.ACTIVE.value
        journey.paused_at = None

        await self.db.flush()
        logger.info(f"User {user_id} resumed journey {journey_id}")

        return journey

    async def abandon_journey(self, user_id: str, journey_id: str) -> UserJourney:
        """Mark a journey as abandoned."""
        journey = await self._get_user_journey(user_id, journey_id)

        if journey.status == UserJourneyStatus.COMPLETED.value:
            raise JourneyAlreadyCompletedError("Cannot abandon a completed journey")

        journey.status = UserJourneyStatus.ABANDONED.value

        await self.db.flush()
        logger.info(f"User {user_id} abandoned journey {journey_id}")

        return journey

    # -------------------------------------------------------------------------
    # STEP MANAGEMENT
    # -------------------------------------------------------------------------

    async def get_current_step(
        self,
        user_id: str,
        journey_id: str,
    ) -> DailyStep | None:
        """
        Get the current step for a journey.

        Returns None if journey is completed or paused.
        """
        journey = await self._get_user_journey(user_id, journey_id)

        if journey.status != UserJourneyStatus.ACTIVE.value:
            return None

        # Get or create step state
        step_state = await self._get_or_create_step_state(
            journey=journey,
            day_index=journey.current_day_index,
        )

        return await self._build_daily_step(journey, step_state)

    async def get_step(
        self,
        user_id: str,
        journey_id: str,
        day_index: int,
    ) -> DailyStep:
        """Get a specific step by day index."""
        journey = await self._get_user_journey(user_id, journey_id)

        # Validate day index
        template = await self.get_template(journey.journey_template_id)
        if day_index < 1 or day_index > template.duration_days:
            raise StepNotAvailableError(
                f"Invalid day index {day_index}. Journey has {template.duration_days} days."
            )

        # Only allow accessing current or past steps
        if day_index > journey.current_day_index:
            raise StepNotAvailableError(
                f"Day {day_index} is not yet unlocked. Current day: {journey.current_day_index}"
            )

        step_state = await self._get_or_create_step_state(journey, day_index)
        return await self._build_daily_step(journey, step_state)

    async def complete_step(
        self,
        user_id: str,
        journey_id: str,
        day_index: int,
        reflection: str | None = None,
        check_in: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Mark a step as complete and optionally save reflection.

        Args:
            user_id: User identifier
            journey_id: Journey identifier
            day_index: Day to complete
            reflection: User's reflection (will be encrypted)
            check_in: Check-in data (intensity, label, etc.)

        Returns:
            Dict with completion status and next step info
        """
        journey = await self._get_user_journey(user_id, journey_id)

        if journey.status != UserJourneyStatus.ACTIVE.value:
            raise JourneyEngineError(f"Journey is {journey.status}, cannot complete step")

        if day_index != journey.current_day_index:
            raise StepNotAvailableError(
                f"Can only complete current day ({journey.current_day_index}), not day {day_index}"
            )

        # Get step state
        step_state = await self._get_or_create_step_state(journey, day_index)

        if step_state.completed_at is not None:
            raise StepNotAvailableError(f"Day {day_index} is already completed")

        # Update step state
        step_state.completed_at = datetime.utcnow()

        if reflection:
            # Encrypt reflection (simplified - use proper encryption in production)
            step_state.reflection_encrypted = {
                "content": reflection,
                "encrypted_at": datetime.utcnow().isoformat(),
            }

        if check_in:
            step_state.check_in = {
                **check_in,
                "timestamp": datetime.utcnow().isoformat(),
            }

        # Check if journey is complete
        template = await self.get_template(journey.journey_template_id)
        is_journey_complete = day_index >= template.duration_days

        if is_journey_complete:
            journey.status = UserJourneyStatus.COMPLETED.value
            journey.completed_at = datetime.utcnow()
            logger.info(f"User {user_id} completed journey {journey_id}")
        else:
            # Advance to next day
            journey.current_day_index = day_index + 1

        await self.db.flush()

        return {
            "success": True,
            "day_completed": day_index,
            "journey_complete": is_journey_complete,
            "next_day": None if is_journey_complete else day_index + 1,
            "progress_percentage": (day_index / template.duration_days) * 100,
        }

    # -------------------------------------------------------------------------
    # USER JOURNEYS
    # -------------------------------------------------------------------------

    async def list_user_journeys(
        self,
        user_id: str,
        status_filter: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[JourneyStats], int]:
        """List user's journeys with statistics."""
        query = (
            select(UserJourney)
            .options(selectinload(UserJourney.template))
            .where(
                UserJourney.user_id == user_id,
                UserJourney.deleted_at.is_(None),
            )
        )

        if status_filter:
            query = query.where(UserJourney.status == status_filter.lower())

        # Count query
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total_count = total_result.scalar() or 0

        # Apply pagination
        query = query.order_by(UserJourney.created_at.desc()).offset(offset).limit(limit)

        result = await self.db.execute(query)
        journeys = result.scalars().all()

        # Build stats for each journey
        stats = []
        for journey in journeys:
            stat = await self._build_journey_stats(journey)
            stats.append(stat)

        return stats, total_count

    async def get_journey(self, user_id: str, journey_id: str) -> JourneyStats:
        """Get detailed stats for a specific journey."""
        journey = await self._get_user_journey(user_id, journey_id)
        return await self._build_journey_stats(journey)

    # -------------------------------------------------------------------------
    # DASHBOARD
    # -------------------------------------------------------------------------

    async def get_dashboard(self, user_id: str) -> Dashboard:
        """Get user's complete journey dashboard."""
        # Get active journeys
        active_journeys, _ = await self.list_user_journeys(
            user_id=user_id,
            status_filter="active",
            limit=self.MAX_ACTIVE_JOURNEYS,
        )

        # Count completed journeys
        completed_query = select(func.count()).where(
            UserJourney.user_id == user_id,
            UserJourney.status == UserJourneyStatus.COMPLETED.value,
            UserJourney.deleted_at.is_(None),
        )
        completed_result = await self.db.execute(completed_query)
        completed_count = completed_result.scalar() or 0

        # Calculate total days practiced
        days_query = select(func.count()).where(
            UserJourneyStepState.user_journey_id.in_(
                select(UserJourney.id).where(
                    UserJourney.user_id == user_id,
                    UserJourney.deleted_at.is_(None),
                )
            ),
            UserJourneyStepState.completed_at.isnot(None),
        )
        days_result = await self.db.execute(days_query)
        total_days = days_result.scalar() or 0

        # Get enemy progress
        enemy_progress = await self._get_enemy_progress(user_id)

        # Get today's steps for active journeys
        today_steps = []
        for journey_stat in active_journeys:
            step = await self.get_current_step(user_id, journey_stat.journey_id)
            if step:
                today_steps.append(step)

        # Get recommended templates
        recommendations = await self._get_recommendations(user_id, enemy_progress)

        # Calculate streak
        streak = await self._calculate_streak(user_id)

        return Dashboard(
            active_journeys=active_journeys,
            completed_journeys=completed_count,
            total_days_practiced=total_days,
            current_streak=streak,
            enemy_progress=enemy_progress,
            recommended_templates=recommendations,
            today_steps=today_steps,
        )

    # -------------------------------------------------------------------------
    # PRIVATE HELPERS
    # -------------------------------------------------------------------------

    async def _count_active_journeys(self, user_id: str) -> int:
        """Count user's active journeys."""
        query = select(func.count()).select_from(UserJourney).where(
            UserJourney.user_id == user_id,
            UserJourney.status == UserJourneyStatus.ACTIVE.value,
            UserJourney.deleted_at.is_(None),
        )
        result = await self.db.execute(query)
        count = result.scalar() or 0
        logger.info(f"Active journey count for user {user_id}: {count}")
        return count

    async def _get_user_journey(self, user_id: str, journey_id: str) -> UserJourney:
        """Get and validate user journey ownership."""
        query = (
            select(UserJourney)
            .options(selectinload(UserJourney.template))
            .where(
                UserJourney.id == journey_id,
                UserJourney.user_id == user_id,
                UserJourney.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(query)
        journey = result.scalar_one_or_none()

        if not journey:
            raise JourneyNotFoundError(f"Journey {journey_id} not found for user")

        return journey

    async def _get_or_create_step_state(
        self,
        journey: UserJourney,
        day_index: int,
    ) -> UserJourneyStepState:
        """Get existing step state or create new one with AI content."""
        query = select(UserJourneyStepState).where(
            UserJourneyStepState.user_journey_id == journey.id,
            UserJourneyStepState.day_index == day_index,
        )
        result = await self.db.execute(query)
        step_state = result.scalar_one_or_none()

        if step_state:
            return step_state

        # Create new step state
        template = await self.get_template(journey.journey_template_id)
        template_step = None
        for step in template.steps:
            if step.day_index == day_index:
                template_step = step
                break

        # Generate KIAAN content (placeholder - integrate with KIAAN service)
        kiaan_json = await self._generate_step_content(
            template=template,
            template_step=template_step,
            day_index=day_index,
            personalization=journey.personalization or {},
        )

        step_state = UserJourneyStepState(
            id=str(uuid.uuid4()),
            user_journey_id=journey.id,
            day_index=day_index,
            verse_refs=kiaan_json.get("verse_refs", []),
            kiaan_step_json=kiaan_json,
            delivered_at=datetime.utcnow(),
            provider_used="journey_engine",
            step_metadata={},
        )

        self.db.add(step_state)
        await self.db.flush()

        return step_state

    async def _generate_step_content(
        self,
        template: JourneyTemplate,
        template_step: JourneyTemplateStep | None,
        day_index: int,
        personalization: dict,
    ) -> dict[str, Any]:
        """
        Generate step content using template hints.

        In production, this integrates with KIAAN for AI generation.
        """
        # Use template step hints if available
        if template_step:
            verse_refs = template_step.static_verse_refs or []
            verse_selector = template_step.verse_selector or {}

            return {
                "step_title": template_step.step_title or f"Day {day_index}",
                "today_focus": (template.primary_enemy_tags or ["general"])[0],
                "verse_refs": verse_refs,
                "teaching": template_step.teaching_hint or "",
                "guided_reflection": [
                    template_step.reflection_prompt or "Reflect on today's teaching."
                ],
                "practice": {
                    "name": "Daily Practice",
                    "instructions": [
                        template_step.practice_prompt or "Take 5 minutes for mindful reflection."
                    ],
                    "duration_minutes": personalization.get("time_budget_minutes", 10),
                },
                "micro_commitment": "I commit to being mindful of this teaching today.",
                "check_in_prompt": {
                    "scale": "0-10",
                    "label": "How present do you feel with today's teaching?",
                },
                "safety_note": template_step.safety_notes,
            }

        # Fallback for missing template step
        return {
            "step_title": f"Day {day_index}",
            "today_focus": "general",
            "verse_refs": [],
            "teaching": "Continue your journey with mindfulness.",
            "guided_reflection": ["What insights arose today?"],
            "practice": {
                "name": "Reflection",
                "instructions": ["Spend 5 minutes in quiet reflection."],
                "duration_minutes": 5,
            },
            "micro_commitment": "I commit to mindful awareness today.",
            "check_in_prompt": {
                "scale": "0-10",
                "label": "How mindful were you today?",
            },
        }

    async def _build_daily_step(
        self,
        journey: UserJourney,
        step_state: UserJourneyStepState,
    ) -> DailyStep:
        """Build DailyStep from step state with verse content."""
        kiaan_json = step_state.kiaan_step_json or {}

        # Fetch actual verse content
        verses = []
        verse_refs = step_state.verse_refs or kiaan_json.get("verse_refs", [])
        for ref in verse_refs:
            if isinstance(ref, dict) and "chapter" in ref and "verse" in ref:
                verse = await self._get_verse(ref["chapter"], ref["verse"])
                if verse:
                    verses.append(verse)

        return DailyStep(
            step_id=step_state.id,
            journey_id=journey.id,
            day_index=step_state.day_index,
            step_title=kiaan_json.get("step_title", f"Day {step_state.day_index}"),
            teaching=kiaan_json.get("teaching", ""),
            guided_reflection=kiaan_json.get("guided_reflection", []),
            practice=kiaan_json.get("practice", {}),
            verse_refs=verse_refs,
            verses=verses,
            micro_commitment=kiaan_json.get("micro_commitment"),
            check_in_prompt=kiaan_json.get("check_in_prompt"),
            safety_note=kiaan_json.get("safety_note"),
            is_completed=step_state.completed_at is not None,
            completed_at=step_state.completed_at,
        )

    async def _get_verse(self, chapter: int, verse: int) -> dict[str, Any] | None:
        """Fetch verse content from database."""
        query = select(GitaVerse).where(
            GitaVerse.chapter == chapter,
            GitaVerse.verse == verse,
        )
        result = await self.db.execute(query)
        gita_verse = result.scalar_one_or_none()

        if not gita_verse:
            return None

        return {
            "chapter": gita_verse.chapter,
            "verse": gita_verse.verse,
            "sanskrit": gita_verse.sanskrit,
            "hindi": gita_verse.hindi,
            "english": gita_verse.english,
            "transliteration": gita_verse.transliteration,
            "theme": gita_verse.theme,
        }

    async def _build_journey_stats(self, journey: UserJourney) -> JourneyStats:
        """Build statistics for a journey."""
        template = journey.template

        # Count completed days
        completed_query = select(func.count()).where(
            UserJourneyStepState.user_journey_id == journey.id,
            UserJourneyStepState.completed_at.isnot(None),
        )
        completed_result = await self.db.execute(completed_query)
        days_completed = completed_result.scalar() or 0

        # Get last activity
        last_activity_query = (
            select(UserJourneyStepState.completed_at)
            .where(
                UserJourneyStepState.user_journey_id == journey.id,
                UserJourneyStepState.completed_at.isnot(None),
            )
            .order_by(UserJourneyStepState.completed_at.desc())
            .limit(1)
        )
        last_activity_result = await self.db.execute(last_activity_query)
        last_activity = last_activity_result.scalar_one_or_none()

        total_days = template.duration_days if template else 14
        progress = (days_completed / total_days) * 100 if total_days > 0 else 0

        return JourneyStats(
            journey_id=journey.id,
            template_slug=template.slug if template else "unknown",
            title=template.title if template else "Unknown Journey",
            status=journey.status,
            current_day=journey.current_day_index,
            total_days=total_days,
            progress_percentage=round(progress, 1),
            days_completed=days_completed,
            started_at=journey.started_at or journey.created_at,
            last_activity=last_activity,
            primary_enemies=template.primary_enemy_tags if template else [],
            streak_days=0,  # Calculate separately if needed
        )

    async def _get_enemy_progress(self, user_id: str) -> list[EnemyProgress]:
        """Calculate progress against each enemy."""
        enemies = ["kama", "krodha", "lobha", "moha", "mada", "matsarya"]
        progress_list = []

        for enemy in enemies:
            # Get journeys targeting this enemy
            # This is a simplified query - in production, use proper JSON containment
            journeys_query = (
                select(UserJourney)
                .join(JourneyTemplate)
                .where(
                    UserJourney.user_id == user_id,
                    UserJourney.deleted_at.is_(None),
                )
            )
            journeys_result = await self.db.execute(journeys_query)
            all_journeys = journeys_result.scalars().all()

            enemy_journeys = [
                j for j in all_journeys
                if j.template and enemy in (j.template.primary_enemy_tags or [])
            ]

            started = len(enemy_journeys)
            completed = len([
                j for j in enemy_journeys
                if j.status == UserJourneyStatus.COMPLETED.value
            ])

            # Count total practice days for this enemy
            total_days = 0
            for j in enemy_journeys:
                days_query = select(func.count()).where(
                    UserJourneyStepState.user_journey_id == j.id,
                    UserJourneyStepState.completed_at.isnot(None),
                )
                days_result = await self.db.execute(days_query)
                total_days += days_result.scalar() or 0

            # Calculate mastery level (simplified)
            mastery = min(100, (completed * 30) + (total_days * 2))

            progress_list.append(EnemyProgress(
                enemy=enemy,
                enemy_label=ENEMY_LABELS.get(enemy, enemy.title()),
                journeys_started=started,
                journeys_completed=completed,
                total_days_practiced=total_days,
                current_streak=0,
                best_streak=0,
                last_practice=None,
                mastery_level=mastery,
            ))

        return progress_list

    async def _calculate_streak(self, user_id: str) -> int:
        """Calculate user's current practice streak."""
        # Get completion dates in reverse order
        query = (
            select(func.date(UserJourneyStepState.completed_at))
            .join(UserJourney)
            .where(
                UserJourney.user_id == user_id,
                UserJourneyStepState.completed_at.isnot(None),
            )
            .distinct()
            .order_by(func.date(UserJourneyStepState.completed_at).desc())
            .limit(100)
        )
        result = await self.db.execute(query)
        dates = [row[0] for row in result.all()]

        if not dates:
            return 0

        # Check if practiced today or yesterday
        today = datetime.utcnow().date()
        if dates[0] < today - timedelta(days=1):
            return 0

        # Count consecutive days
        streak = 1
        for i in range(1, len(dates)):
            if dates[i-1] - dates[i] == timedelta(days=1):
                streak += 1
            else:
                break

        return streak

    async def _get_recommendations(
        self,
        user_id: str,
        enemy_progress: list[EnemyProgress],
    ) -> list[dict[str, Any]]:
        """Get recommended templates based on user's progress."""
        # Find enemies with lowest mastery
        sorted_progress = sorted(enemy_progress, key=lambda x: x.mastery_level)
        focus_enemies = [p.enemy for p in sorted_progress[:3]]

        recommendations = []
        for enemy in focus_enemies:
            # Get templates for this enemy
            templates, _ = await self.list_templates(
                enemy_filter=enemy,
                limit=2,
            )
            for t in templates:
                recommendations.append({
                    "template_id": t.id,
                    "slug": t.slug,
                    "title": t.title,
                    "enemy": enemy,
                    "enemy_label": ENEMY_LABELS.get(enemy, enemy.title()),
                    "duration_days": t.duration_days,
                    "difficulty": t.difficulty,
                    "reason": f"Focus on {ENEMY_LABELS.get(enemy, enemy)} to strengthen your practice",
                })

        return recommendations[:5]


# =============================================================================
# MULTI-JOURNEY MANAGER
# =============================================================================


class MultiJourneyManager:
    """
    Manages multiple concurrent journeys for a user.

    Provides:
    - Cross-journey progress tracking
    - Daily agenda compilation
    - Conflict resolution
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.engine = JourneyEngineService(db)

    async def get_daily_agenda(self, user_id: str) -> list[DailyStep]:
        """Get all steps due today across all active journeys."""
        stats, _ = await self.engine.list_user_journeys(
            user_id=user_id,
            status_filter="active",
        )

        agenda = []
        for journey_stat in stats:
            step = await self.engine.get_current_step(
                user_id=user_id,
                journey_id=journey_stat.journey_id,
            )
            if step and not step.is_completed:
                agenda.append(step)

        return agenda

    async def get_combined_progress(self, user_id: str) -> dict[str, Any]:
        """Get combined progress across all journeys."""
        dashboard = await self.engine.get_dashboard(user_id)

        return {
            "active_journeys": len(dashboard.active_journeys),
            "completed_journeys": dashboard.completed_journeys,
            "total_days_practiced": dashboard.total_days_practiced,
            "current_streak": dashboard.current_streak,
            "enemy_mastery": {
                ep.enemy: ep.mastery_level
                for ep in dashboard.enemy_progress
            },
        }


# =============================================================================
# ENEMY PROGRESS TRACKER
# =============================================================================


class EnemyProgressTracker:
    """
    Tracks and analyzes progress against the six inner enemies.

    Provides:
    - Per-enemy statistics
    - Mastery levels
    - Recommendations
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.engine = JourneyEngineService(db)

    async def get_radar_data(self, user_id: str) -> dict[str, int]:
        """
        Get radar chart data for enemy mastery visualization.

        Returns dict mapping enemy -> mastery level (0-100)
        """
        progress = await self.engine._get_enemy_progress(user_id)
        return {ep.enemy: ep.mastery_level for ep in progress}

    async def get_weakest_enemy(self, user_id: str) -> str | None:
        """Get the enemy with lowest mastery for recommendation."""
        progress = await self.engine._get_enemy_progress(user_id)
        if not progress:
            return None

        sorted_progress = sorted(progress, key=lambda x: x.mastery_level)
        return sorted_progress[0].enemy if sorted_progress else None

    async def get_enemy_details(self, user_id: str, enemy: str) -> EnemyProgress | None:
        """Get detailed progress for a specific enemy."""
        progress = await self.engine._get_enemy_progress(user_id)
        for ep in progress:
            if ep.enemy == enemy:
                return ep
        return None
