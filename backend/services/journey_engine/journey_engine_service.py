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
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, TypedDict

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models import (
    JourneyTemplate,
    JourneyTemplateStep,
    UserJourney,
    UserJourneyStepState,
    GitaVerse,
)
from backend.models import UserJourneyStatus

logger = logging.getLogger(__name__)


# =============================================================================
# ENEMY-AWARE FALLBACK CONTENT
# =============================================================================
# When a journey template has no seeded JourneyTemplateStep rows for a given
# day (e.g. seed scripts haven't been run for a freshly added template), the
# old fallback emitted a single hard-coded line: "Continue your journey with
# mindfulness." That left the day page empty of teaching, verse refs, and any
# meaningful guidance — exactly the situation reported on Day 1 of the lobha
# "Open Hand" journey.
#
# This table is the safety net: it returns a coherent day of content keyed by
# the primary enemy tag. Each entry includes the canonical Bhagavad Gita verse
# ref for that enemy (so _build_daily_step can hydrate verses[] from the
# gita_verses table when present, and the routes-layer _step_to_response()
# helper can fall back to _ENEMY_SACRED for the flattened sanskrit fields
# when the table is unseeded). Content is drawn from the Gita and the
# established ENEMY_METADATA — nothing invented.

_ENEMY_TEACHING_FALLBACK: dict[str, dict[str, Any]] = {
    "kama": {
        "step_title": "Day {day} \u00b7 Naming Desire",
        "verse_ref": {"chapter": 3, "verse": 37},
        "teaching": (
            "Today, notice the wanting mind. Krishna names desire (k\u0101ma) as "
            "the great enemy in this world \u2014 not because wanting is sinful, but "
            "because it is insatiable. Each fulfillment births a new craving. Sit "
            "with one desire today and watch it rise, peak, and pass like a wave. "
            "You are the ocean, not the wave."
        ),
        "reflection": "Which craving is loudest in you right now \u2014 and what is it really asking for?",
        "practice_name": "Witness the Wanting",
        "practice_instructions": [
            "Sit quietly for five minutes.",
            "Let one desire arise without acting on it.",
            "Breathe with it. Notice its texture, its urgency, its origin.",
            "When it softens, return to the breath. That softening is freedom.",
        ],
    },
    "krodha": {
        "step_title": "Day {day} \u00b7 Cooling the Fire",
        "verse_ref": {"chapter": 2, "verse": 63},
        "teaching": (
            "Today, study your anger before it studies you. Krishna traces the chain: "
            "from craving \u2014 anger; from anger \u2014 delusion; from delusion \u2014 the "
            "loss of memory; from lost memory \u2014 the destruction of discrimination; "
            "and when discrimination is lost, one perishes. The pause between trigger "
            "and reaction is where wisdom lives. Today, find that pause once."
        ),
        "reflection": "Where did anger arise today, and what was the desire underneath it?",
        "practice_name": "The Sacred Pause",
        "practice_instructions": [
            "When irritation rises today, do not speak for 10 seconds.",
            "Take one slow breath. Then a second.",
            "Ask: what was I wanting that I did not get?",
            "Then respond from that knowing, not from the heat.",
        ],
    },
    "lobha": {
        "step_title": "Day {day} \u00b7 Opening the Hand",
        "verse_ref": {"chapter": 14, "verse": 17},
        "teaching": (
            "Today, examine the grasping hand. Krishna tells us greed (lobha) arises "
            "when the mode of passion grows \u2014 ceaseless activity, restlessness, the "
            "craving for more. The antidote is not poverty; it is generosity (d\u0101na). "
            "Give one thing freely today \u2014 a coin, an hour, a kind word \u2014 with no "
            "expectation of return. Notice how giving feels different from grasping."
        ),
        "reflection": "What do you hold too tightly, and what would it mean to open your hand?",
        "practice_name": "The Daily Giving",
        "practice_instructions": [
            "Choose one thing to give freely today.",
            "It can be material, time, attention, or kindness.",
            "Give it with full presence and no expectation of return.",
            "Afterward, notice the quality of the giving in your chest.",
        ],
    },
    "moha": {
        "step_title": "Day {day} \u00b7 Lifting the Veil",
        "verse_ref": {"chapter": 2, "verse": 52},
        "teaching": (
            "Today, look at the fog of attachment. Krishna promises that when your "
            "intellect crosses beyond the thicket of delusion (moha), you become "
            "indifferent to all that has been heard and all that is yet to be heard. "
            "Delusion is mistaking the temporary for the permanent \u2014 a relationship, "
            "a possession, an identity. Today, name one thing you cling to as if it "
            "were eternal, and let yourself feel its impermanence with tenderness."
        ),
        "reflection": "What are you holding as permanent that is, in truth, passing through?",
        "practice_name": "The Tender Letting",
        "practice_instructions": [
            "Name one attachment that causes you suffering.",
            "Sit with it for three minutes without trying to release it.",
            "Then, gently, acknowledge: this too is impermanent.",
            "Feel the freedom that lives just beneath the clinging.",
        ],
    },
    "mada": {
        "step_title": "Day {day} \u00b7 Dissolving the Ego",
        "verse_ref": {"chapter": 16, "verse": 4},
        "teaching": (
            "Today, watch the inflated self. Krishna lists hypocrisy, arrogance, "
            "self-conceit, anger, harshness and ignorance as the marks of the demoniac "
            "qualities. Pride (mada) is the inflation that forgets its true nature \u2014 "
            "it makes the wave believe it is greater than the ocean. Today, bow inwardly "
            "to one person you usually feel above. See yourself in them."
        ),
        "reflection": "Where did pride speak today, and what was it protecting?",
        "practice_name": "The Inner Bow",
        "practice_instructions": [
            "Choose one person you usually feel superior to.",
            "Sit quietly and bring them to mind.",
            "Inwardly bow to them. Acknowledge: we are the same Self.",
            "Carry that recognition into your next interaction.",
        ],
    },
    "matsarya": {
        "step_title": "Day {day} \u00b7 Celebrating Others",
        "verse_ref": {"chapter": 12, "verse": 13},
        "teaching": (
            "Today, watch the comparing mind. Krishna says: he who hates no creature, "
            "who is friendly and compassionate, free from attachment and egoism, "
            "balanced in pleasure and pain, and forgiving \u2014 he is dear to Me. "
            "Envy (m\u0101tsarya) is the inability to celebrate another's good. Its "
            "antidote is mudit\u0101 \u2014 sympathetic joy. Today, celebrate one person's "
            "success as if it were your own."
        ),
        "reflection": "Whose joy is hard for you to celebrate, and what would it cost to celebrate it anyway?",
        "practice_name": "Mudit\u0101 \u2014 Sympathetic Joy",
        "practice_instructions": [
            "Bring to mind one person whose recent success stings.",
            "Sit with the sting honestly for one minute.",
            "Then silently wish: may your joy increase, may your path open.",
            "Notice what shifts in your chest when you mean it.",
        ],
    },
}
# Alternate spelling that appears in some template tags.
_ENEMY_TEACHING_FALLBACK["matsara"] = _ENEMY_TEACHING_FALLBACK["matsarya"]


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

    # Active journey progress (Battleground per-journey display). 0 when
    # the user has no active journey for this enemy; otherwise the
    # rounded completion % (days_completed / duration_days * 100) of the
    # most-recent active journey targeting this enemy. Surfaced so the
    # Battleground radar + enemy cards can show the user exactly how far
    # into their current journey they are, not just the long-term
    # weighted mastery level.
    active_journey_progress_pct: int = 0
    active_journey_id: str | None = None
    active_journey_day: int = 0
    active_journey_total_days: int = 0

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
            "active_journey_progress_pct": self.active_journey_progress_pct,
            "active_journey_id": self.active_journey_id,
            "active_journey_day": self.active_journey_day,
            "active_journey_total_days": self.active_journey_total_days,
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
    available_to_complete: bool = True
    next_available_at: datetime | None = None

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
            "available_to_complete": self.available_to_complete,
            "next_available_at": self.next_available_at.isoformat() if self.next_available_at else None,
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
    # Authoritative active-journey count from the DB. Frontend must use this
    # for the "N/5" indicator instead of len(active_journeys), so the
    # dashboard count and the start-journey limit check can never disagree.
    active_count: int = 0
    max_active: int = 5

    def to_dict(self) -> dict[str, Any]:
        return {
            "active_journeys": [j.to_dict() for j in self.active_journeys],
            "completed_journeys": self.completed_journeys,
            "total_days_practiced": self.total_days_practiced,
            "current_streak": self.current_streak,
            "enemy_progress": [e.to_dict() for e in self.enemy_progress],
            "recommended_templates": self.recommended_templates,
            "today_steps": [s.to_dict() for s in self.today_steps],
            "active_count": self.active_count,
            "max_active": self.max_active,
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


class StepTimeGatedError(StepNotAvailableError):
    """Step is time-gated - user must wait for the next calendar day."""
    def __init__(self, message: str, next_available_at: datetime):
        super().__init__(message)
        self.next_available_at = next_available_at


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
        # Auto-cleanup orphaned journeys first (those with no valid template)
        cleaned = await self.cleanup_orphaned_journeys(user_id)
        if cleaned > 0:
            logger.info(f"Auto-cleaned {cleaned} orphaned journeys for user {user_id}")

        # Check active journey limit
        active_count = await self._count_active_journeys(user_id)
        logger.info(f"User {user_id} has {active_count} active journeys (max: {self.MAX_ACTIVE_JOURNEYS})")

        # If still at max after orphan cleanup, check if dashboard shows these journeys
        # If not (stuck state), force clear them automatically
        if active_count >= self.MAX_ACTIVE_JOURNEYS:
            # Get actual visible journeys from list query
            visible_journeys, _ = await self.list_user_journeys(
                user_id=user_id,
                status_filter="active",
                limit=self.MAX_ACTIVE_JOURNEYS,
            )

            # If count says max but list shows fewer, we have phantom journeys - auto-fix
            if len(visible_journeys) < active_count:
                logger.warning(
                    f"User {user_id} has phantom journeys: count={active_count}, visible={len(visible_journeys)}. Auto-fixing."
                )
                force_cleared = await self.force_clear_all_journeys(user_id)
                logger.info(f"Auto force-cleared {force_cleared} phantom journeys for user {user_id}")
                # Recount after fix
                active_count = await self._count_active_journeys(user_id)

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

        # Time-gate check: ensure pace interval has elapsed since last completion
        is_available, next_available_at = await self._check_time_gate(journey)
        if not is_available:
            raise StepTimeGatedError(
                "Come back tomorrow to continue your journey.",
                next_available_at=next_available_at,
            )

        # Update step state
        step_state.completed_at = datetime.utcnow()

        if reflection:
            from backend.services.chat_data_encryption import encrypt_chat_field
            step_state.reflection_encrypted = {
                "content": encrypt_chat_field(reflection),
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
        """Get user's complete journey dashboard.

        SELF-HEALING: cleans up orphaned journeys (active rows whose
        JourneyTemplate has been soft-deleted) before listing, so that
        ``_count_active_journeys`` and ``list_user_journeys`` always agree.
        Without this, users could see "0/5 active" on the dashboard while
        the start-journey endpoint reports "5 active — maximum reached",
        leaving them permanently trapped.
        """
        # STEP 1: Heal orphaned journeys before counting. Wrapped in
        # try/except so the dashboard never fails on cleanup errors.
        try:
            await self.cleanup_orphaned_journeys(user_id)
        except Exception as e:  # noqa: BLE001
            logger.error(
                f"[get_dashboard] cleanup_orphaned_journeys failed for user {user_id}: {e}"
            )

        # STEP 2: List active journeys (post-cleanup).
        active_journeys, _ = await self.list_user_journeys(
            user_id=user_id,
            status_filter="active",
            limit=self.MAX_ACTIVE_JOURNEYS,
        )

        # STEP 3: Authoritative DB count.
        active_count = await self._count_active_journeys(user_id)

        # STEP 4: Phantom recovery — if count > list after cleanup, force
        # clear so the user can never get permanently trapped.
        if active_count > len(active_journeys):
            logger.warning(
                f"[get_dashboard] PHANTOM DETECTED user={user_id}: "
                f"count={active_count} list_len={len(active_journeys)}. "
                f"Force-clearing all journeys for self-recovery."
            )
            try:
                await self.force_clear_all_journeys(user_id)
                active_journeys, _ = await self.list_user_journeys(
                    user_id=user_id,
                    status_filter="active",
                    limit=self.MAX_ACTIVE_JOURNEYS,
                )
                active_count = await self._count_active_journeys(user_id)
            except Exception as e:  # noqa: BLE001
                logger.error(
                    f"[get_dashboard] Phantom recovery failed user={user_id}: {e}"
                )
                # Last resort: trust the visible list so the frontend
                # never sees a divergent count.
                active_count = len(active_journeys)

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

        # RESILIENCE: each optional component is wrapped in its own
        # try/except so a single failure can no longer wipe the entire
        # dashboard. Previously an async-lazy-load exception in
        # ``_get_enemy_progress`` was propagating to the route handler,
        # which caught it and returned an all-zeros response — making
        # every started journey invisible to the user.
        try:
            enemy_progress = await self._get_enemy_progress(user_id)
        except Exception as e:  # noqa: BLE001
            logger.error(
                f"[get_dashboard] enemy_progress failed user={user_id}: {e}",
                exc_info=True,
            )
            enemy_progress = []

        today_steps = []
        for journey_stat in active_journeys:
            try:
                step = await self.get_current_step(user_id, journey_stat.journey_id)
                if step:
                    today_steps.append(step)
            except Exception as e:  # noqa: BLE001
                logger.error(
                    f"[get_dashboard] get_current_step failed "
                    f"user={user_id} journey={journey_stat.journey_id}: {e}",
                    exc_info=True,
                )

        try:
            recommendations = await self._get_recommendations(user_id, enemy_progress)
        except Exception as e:  # noqa: BLE001
            logger.error(
                f"[get_dashboard] recommendations failed user={user_id}: {e}",
                exc_info=True,
            )
            recommendations = []

        try:
            streak = await self._calculate_streak(user_id)
        except Exception as e:  # noqa: BLE001
            logger.error(
                f"[get_dashboard] streak calculation failed user={user_id}: {e}",
                exc_info=True,
            )
            streak = 0

        return Dashboard(
            active_journeys=active_journeys,
            completed_journeys=completed_count,
            total_days_practiced=total_days,
            current_streak=streak,
            enemy_progress=enemy_progress,
            recommended_templates=recommendations,
            today_steps=today_steps,
            active_count=active_count,
            max_active=self.MAX_ACTIVE_JOURNEYS,
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

    async def cleanup_orphaned_journeys(self, user_id: str) -> int:
        """
        Clean up orphaned journeys (those with no valid template).

        Returns count of journeys cleaned up.
        """
        # Find journeys with no valid template (orphaned)
        orphaned_query = (
            select(UserJourney)
            .outerjoin(JourneyTemplate, UserJourney.journey_template_id == JourneyTemplate.id)
            .where(
                UserJourney.user_id == user_id,
                UserJourney.deleted_at.is_(None),
                or_(
                    UserJourney.journey_template_id.is_(None),
                    JourneyTemplate.id.is_(None),
                    JourneyTemplate.deleted_at.isnot(None),
                )
            )
        )
        result = await self.db.execute(orphaned_query)
        orphaned_journeys = result.scalars().all()

        count = 0
        for journey in orphaned_journeys:
            journey.deleted_at = datetime.utcnow()
            journey.status = UserJourneyStatus.ABANDONED.value
            count += 1
            logger.info(f"Cleaned up orphaned journey {journey.id} for user {user_id}")

        if count > 0:
            await self.db.flush()
            logger.info(f"Cleaned up {count} orphaned journeys for user {user_id}")

        return count

    async def force_clear_all_journeys(self, user_id: str) -> int:
        """
        Force soft-delete ALL journeys for a user.

        Use this when user reports stuck state and needs a clean slate.
        """
        query = (
            select(UserJourney)
            .where(
                UserJourney.user_id == user_id,
                UserJourney.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(query)
        journeys = result.scalars().all()

        count = 0
        for journey in journeys:
            journey.deleted_at = datetime.utcnow()
            journey.status = UserJourneyStatus.ABANDONED.value
            count += 1

        if count > 0:
            await self.db.flush()
            logger.info(f"Force-cleared {count} journeys for user {user_id}")

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

    def _get_pace_interval_days(self, journey: UserJourney) -> int:
        """Map journey pace setting to number of calendar days between steps."""
        pace = (journey.personalization or {}).get("pace", "daily")
        pace_map = {
            "daily": 1,
            "every_other_day": 2,
            "weekly": 7,
        }
        return pace_map.get(pace, 1)

    async def _get_last_completed_step(
        self,
        journey: UserJourney,
    ) -> UserJourneyStepState | None:
        """Get the most recently completed step for a journey."""
        query = (
            select(UserJourneyStepState)
            .where(
                UserJourneyStepState.user_journey_id == journey.id,
                UserJourneyStepState.completed_at.isnot(None),
            )
            .order_by(UserJourneyStepState.completed_at.desc())
            .limit(1)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _check_time_gate(
        self,
        journey: UserJourney,
    ) -> tuple[bool, datetime | None]:
        """
        Check if the current step is available based on pace time-gating.

        Uses UTC calendar day boundaries: a step completed at 11:55 PM UTC
        allows the next step at 12:00 AM UTC (start of next calendar day).

        Returns:
            (is_available, next_available_at):
            - is_available: True if the user can complete the current step now
            - next_available_at: UTC datetime when step becomes available (None if now)
        """
        last_completed = await self._get_last_completed_step(journey)

        # First step or no prior completions - always available
        if last_completed is None:
            return (True, None)

        pace_days = self._get_pace_interval_days(journey)

        # Compute next available at: start of the UTC day that is pace_days after
        # the day the last step was completed.
        completed_date = last_completed.completed_at.date()
        next_available_date = completed_date + timedelta(days=pace_days)
        next_available_at = datetime(
            next_available_date.year,
            next_available_date.month,
            next_available_date.day,
        )

        now = datetime.utcnow()
        if now >= next_available_at:
            return (True, None)

        return (False, next_available_at)

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

        # Fallback for missing template step — coherent, enemy-aware content
        # so the user always sees a real teaching + verse + practice instead
        # of the old generic "Continue your journey with mindfulness." line.
        # Verse refs flow into _build_daily_step which hydrates them from the
        # gita_verses table; if that table is empty, the routes-layer
        # _step_to_response() helper falls back to _ENEMY_SACRED for the
        # flattened sanskrit fields. End result: the day page is never empty.
        primary_tag = (template.primary_enemy_tags or ["general"])[0]
        fallback = _ENEMY_TEACHING_FALLBACK.get(
            (primary_tag or "").lower()
        )
        if fallback:
            logger.info(
                "[_generate_step_content] template_step missing for "
                "template=%s day=%s — using enemy-aware fallback for %s",
                template.id, day_index, primary_tag,
            )
            return {
                "step_title": fallback["step_title"].format(day=day_index),
                "today_focus": primary_tag,
                "verse_refs": [fallback["verse_ref"]],
                "teaching": fallback["teaching"],
                "guided_reflection": [fallback["reflection"]],
                "practice": {
                    "name": fallback["practice_name"],
                    "instructions": fallback["practice_instructions"],
                    "duration_minutes": personalization.get("time_budget_minutes", 10),
                },
                "micro_commitment": "I will carry this teaching into my day.",
                "check_in_prompt": {
                    "scale": "0-10",
                    "label": "How present were you with today's practice?",
                },
                "safety_note": None,
            }

        # Last-resort fallback when even the enemy tag is unrecognised. Still
        # better than the old hardcoded line because it tells the user the
        # truth about the state of the content, instead of pretending.
        logger.warning(
            "[_generate_step_content] no fallback for enemy=%s "
            "template=%s day=%s",
            primary_tag, template.id, day_index,
        )
        return {
            "step_title": f"Day {day_index}",
            "today_focus": "general",
            "verse_refs": [],
            "teaching": (
                "Today's teaching is being prepared. Sit quietly for five "
                "minutes and bring awareness to whatever inner enemy is "
                "loudest in you right now. That noticing is itself the practice."
            ),
            "guided_reflection": ["What did you notice in yourself today?"],
            "practice": {
                "name": "Quiet Sitting",
                "instructions": ["Sit quietly for five minutes. Watch the breath."],
                "duration_minutes": 5,
            },
            "micro_commitment": "I commit to mindful awareness today.",
            "check_in_prompt": {
                "scale": "0-10",
                "label": "How mindful were you today?",
            },
            "safety_note": None,
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

        is_completed = step_state.completed_at is not None

        # Determine time-gate availability for incomplete steps
        if is_completed:
            available_to_complete = False
            next_available_at = None
        else:
            available_to_complete, next_available_at = await self._check_time_gate(journey)

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
            is_completed=is_completed,
            completed_at=step_state.completed_at,
            available_to_complete=available_to_complete,
            next_available_at=next_available_at,
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
        """Calculate progress against each enemy.

        BUGFIX: previously this built its own ``select(UserJourney).join(...)``
        query without ``selectinload(UserJourney.template)``, then accessed
        ``j.template.primary_enemy_tags`` inside a list comprehension. Async
        SQLAlchemy raises ``MissingGreenlet`` on implicit lazy loads, which
        propagated up to ``get_dashboard`` and was silently caught by the
        route handler, making the dashboard return ``active_count=0`` and
        an empty ``active_journeys`` list. Users saw "0/5 Active" with their
        started journeys invisible even though the rows existed in the DB.

        Fix: eager-load the template relationship AND batch the per-journey
        day-count query into a single GROUP BY instead of running N+1 queries
        inside the outer 6-enemy loop.
        """
        enemies = ["kama", "krodha", "lobha", "moha", "mada", "matsarya"]

        # Single query for all user journeys with template preloaded. Without
        # selectinload, ``j.template`` below would trigger an async lazy load
        # and raise MissingGreenlet in production.
        journeys_query = (
            select(UserJourney)
            .options(selectinload(UserJourney.template))
            .where(
                UserJourney.user_id == user_id,
                UserJourney.deleted_at.is_(None),
            )
        )
        journeys_result = await self.db.execute(journeys_query)
        all_journeys = journeys_result.scalars().all()

        # Single query for completed-step counts per journey (replaces the
        # N+1 COUNT inside the inner loop).
        journey_ids = [j.id for j in all_journeys]
        days_by_journey: dict[str, int] = {}
        if journey_ids:
            days_query = (
                select(
                    UserJourneyStepState.user_journey_id,
                    func.count(UserJourneyStepState.id),
                )
                .where(
                    UserJourneyStepState.user_journey_id.in_(journey_ids),
                    UserJourneyStepState.completed_at.isnot(None),
                )
                .group_by(UserJourneyStepState.user_journey_id)
            )
            days_result = await self.db.execute(days_query)
            days_by_journey = {row[0]: row[1] for row in days_result.all()}

        progress_list: list[EnemyProgress] = []
        for enemy in enemies:
            enemy_journeys = [
                j for j in all_journeys
                if j.template and enemy in (j.template.primary_enemy_tags or [])
            ]

            started = len(enemy_journeys)
            completed = len([
                j for j in enemy_journeys
                if j.status == UserJourneyStatus.COMPLETED.value
            ])
            total_days = sum(days_by_journey.get(j.id, 0) for j in enemy_journeys)

            # Calculate mastery level (simplified)
            mastery = min(100, (completed * 30) + (total_days * 2))

            # Active journey progress for the Battleground display.
            # Picks the most-recently-created active journey targeting
            # this enemy (users rarely run parallel journeys against the
            # same enemy; if they do we surface the newest one). The
            # progress % is computed from completed step states so it
            # matches the Journey detail page's progress bar exactly.
            active_for_enemy = [
                j for j in enemy_journeys
                if j.status == UserJourneyStatus.ACTIVE.value
            ]
            active_for_enemy.sort(
                key=lambda j: j.created_at or datetime.min,
                reverse=True,
            )
            active_journey_progress_pct = 0
            active_journey_id: str | None = None
            active_journey_day = 0
            active_journey_total_days = 0
            if active_for_enemy:
                active = active_for_enemy[0]
                total = (
                    active.template.duration_days
                    if active.template and active.template.duration_days
                    else 14
                )
                done = days_by_journey.get(active.id, 0)
                active_journey_progress_pct = (
                    min(100, round((done / total) * 100)) if total > 0 else 0
                )
                active_journey_id = active.id
                active_journey_day = active.current_day_index or 1
                active_journey_total_days = total

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
                active_journey_progress_pct=active_journey_progress_pct,
                active_journey_id=active_journey_id,
                active_journey_day=active_journey_day,
                active_journey_total_days=active_journey_total_days,
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
