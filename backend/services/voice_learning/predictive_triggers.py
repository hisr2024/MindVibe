"""
Predictive Anticipatory Assistance Engine for KIAAN Voice Assistant.

Analyzes user behavior patterns, emotional trajectories, journey progress,
and cross-session context to proactively generate contextually appropriate
greetings and suggestions. This enables KIAAN to feel anticipatory rather
than purely reactive -- greeting users with relevant suggestions based on
their habits, emotional state, and spiritual progress.

Trigger priority order:
  1. Time-based activity patterns (highest confidence)
  2. Emotional trajectory decline (urgent, compassionate check-in)
  3. Unfinished journey nudge (re-engagement)
  4. Context-aware follow-up (post-activity suggestions)
  5. Conversation continuity (cross-session memory recall)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Optional model imports -- degrade gracefully if models are unavailable.
# This allows the module to be imported even when the full model layer
# hasn't been installed (e.g. during lightweight testing).
# ---------------------------------------------------------------------------
try:
    from backend.models.voice import VoiceWakeWordEvent
except ImportError:
    VoiceWakeWordEvent = None  # type: ignore[assignment,misc]

try:
    from backend.models.mood import Mood
except ImportError:
    Mood = None  # type: ignore[assignment,misc]

try:
    from backend.models.journeys import (
        UserJourney,
        UserJourneyStepState,
        JourneyTemplate,
    )
except ImportError:
    UserJourney = None  # type: ignore[assignment,misc]
    UserJourneyStepState = None  # type: ignore[assignment,misc]
    JourneyTemplate = None  # type: ignore[assignment,misc]

try:
    from backend.services.voice_learning.cross_session_context import (
        CrossSessionContextService,
    )
except ImportError:
    CrossSessionContextService = None  # type: ignore[assignment,misc]

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class PredictiveAction:
    """A single anticipatory action that KIAAN can present to the user.

    Attributes:
        type: Category of the action. One of:
            - ``suggest_activity``  -- propose a timed activity (sadhana, meditation)
            - ``check_in``         -- compassionate emotional check-in
            - ``nudge``            -- gentle reminder about stalled journey
            - ``follow_up``        -- post-activity suggestion (e.g. journal)
            - ``conversation_continuity`` -- reference to last session topic
        message: The KIAAN greeting / suggestion text shown (or spoken) to the user.
        action: Optional frontend navigation target. Examples:
            ``navigate_to_sadhana``, ``mood_check``, ``resume_journey``,
            ``navigate_to_journal``.
        confidence: A float in [0, 1] indicating how confident the engine is
            that this action is appropriate right now.
        metadata: Arbitrary extra data the frontend may use (journey id, mood
            score, topic key, etc.).

    Example:
        >>> action = PredictiveAction(
        ...     type="suggest_activity",
        ...     message="You usually meditate around this time. Shall I start your Sadhana?",
        ...     action="navigate_to_sadhana",
        ...     confidence=0.85,
        ...     metadata={"preferred_hour": 7},
        ... )
    """

    type: str
    message: str
    action: str | None = None
    confidence: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Mood valence mapping -- maps Mood.score (integer 1-10) to a normalised
# valence float in [0, 1].  Scores <= 3 are considered low, 4-6 neutral,
# and 7+ positive.
# ---------------------------------------------------------------------------

_MOOD_VALENCE_SCALE = 10  # Maximum mood score value


def _score_to_valence(score: int) -> float:
    """Convert an integer mood score to a 0-1 valence float.

    Args:
        score: Integer mood score (typically 1-10).

    Returns:
        Normalised valence between 0.0 and 1.0.
    """
    clamped = max(1, min(score, _MOOD_VALENCE_SCALE))
    return clamped / _MOOD_VALENCE_SCALE


# ---------------------------------------------------------------------------
# PredictiveTriggers engine
# ---------------------------------------------------------------------------

class PredictiveTriggers:
    """Predictive Anticipatory Assistance engine.

    Examines multiple user signals -- time-based engagement patterns,
    emotional trajectory, journey progress, recent activity context, and
    cross-session memory -- and returns the single most relevant
    ``PredictiveAction`` (or ``None`` when no trigger fires).

    Triggers are evaluated in strict priority order so that the most
    urgent or highest-confidence action always wins.

    Usage:
        >>> engine = PredictiveTriggers()
        >>> action = await engine.check_triggers(user_id="u-123", db=session)
        >>> if action:
        ...     print(action.message)
    """

    # Minimum confidence thresholds per trigger type.  Actions below these
    # thresholds are discarded to avoid spamming the user with low-quality
    # suggestions.
    _MIN_CONFIDENCE = {
        "suggest_activity": 0.60,
        "check_in": 0.50,
        "nudge": 0.55,
        "follow_up": 0.70,
        "conversation_continuity": 0.40,
    }

    # Number of days of inactivity on a journey before we nudge.
    _JOURNEY_INACTIVITY_DAYS = 2

    def __init__(self) -> None:
        """Initialise the PredictiveTriggers engine with a module-level logger."""
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        self.logger.info("PredictiveTriggers engine initialised")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def check_triggers(
        self,
        user_id: str,
        db: AsyncSession,
        context: dict[str, Any] | None = None,
    ) -> PredictiveAction | None:
        """Evaluate all predictive triggers and return the best action.

        Triggers are checked in priority order:
          1. Time-based activity patterns
          2. Declining emotional trajectory
          3. Unfinished journey nudge
          4. Context-aware follow-up (requires *context* dict)
          5. Conversation continuity from cross-session memory

        The first trigger that fires with sufficient confidence is returned
        immediately -- lower-priority triggers are not evaluated.

        Args:
            user_id: The authenticated user's identifier.
            db: An active SQLAlchemy ``AsyncSession``.
            context: Optional dict with keys such as
                ``just_completed_emotional_reset`` or
                ``just_completed_journey_step`` that inform follow-up
                suggestions.

        Returns:
            A ``PredictiveAction`` if a trigger fires, otherwise ``None``.

        Example:
            >>> action = await engine.check_triggers(
            ...     user_id="u-42",
            ...     db=async_session,
            ...     context={"just_completed_emotional_reset": True},
            ... )
        """
        context = context or {}
        self.logger.debug("Checking predictive triggers for user %s", user_id)

        # --- 1. Time-based activity pattern ---
        action = await self._check_time_pattern(user_id, db)
        if action and action.confidence >= self._MIN_CONFIDENCE.get(action.type, 0.5):
            self.logger.info(
                "Time-pattern trigger fired for user %s (confidence=%.2f)",
                user_id,
                action.confidence,
            )
            return action

        # --- 2. Emotional trajectory ---
        action = await self._check_emotional_trajectory(user_id, db)
        if action and action.confidence >= self._MIN_CONFIDENCE.get(action.type, 0.5):
            self.logger.info(
                "Emotional-trajectory trigger fired for user %s (confidence=%.2f)",
                user_id,
                action.confidence,
            )
            return action

        # --- 3. Unfinished journey nudge ---
        action = await self._check_unfinished_journeys(user_id, db)
        if action and action.confidence >= self._MIN_CONFIDENCE.get(action.type, 0.5):
            self.logger.info(
                "Unfinished-journey trigger fired for user %s (confidence=%.2f)",
                user_id,
                action.confidence,
            )
            return action

        # --- 4. Context-aware follow-up ---
        action = self._check_context_followup(context)
        if action and action.confidence >= self._MIN_CONFIDENCE.get(action.type, 0.5):
            self.logger.info(
                "Context follow-up trigger fired for user %s (confidence=%.2f)",
                user_id,
                action.confidence,
            )
            return action

        # --- 5. Conversation continuity ---
        action = await self._check_conversation_continuity(user_id, db)
        if action and action.confidence >= self._MIN_CONFIDENCE.get(action.type, 0.5):
            self.logger.info(
                "Conversation-continuity trigger fired for user %s (confidence=%.2f)",
                user_id,
                action.confidence,
            )
            return action

        self.logger.debug("No predictive trigger fired for user %s", user_id)
        return None

    # ------------------------------------------------------------------
    # Data-fetching helpers
    # ------------------------------------------------------------------

    async def get_engagement_patterns(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> dict[str, Any]:
        """Query voice wake-word events to determine preferred activity hours.

        Analyses timestamps of ``VoiceWakeWordEvent`` rows for the user over
        the past 30 days and groups them by hour of day.

        Args:
            user_id: User identifier.
            db: Active async database session.

        Returns:
            A dict with key ``preferred_hours`` mapping activity names to a
            list of preferred hours (0-23).  Falls back to an empty dict on
            any database error.

        Example:
            >>> patterns = await engine.get_engagement_patterns("u-1", db)
            >>> patterns
            {"preferred_hours": {"voice_interaction": [7, 8, 21]}}
        """
        if VoiceWakeWordEvent is None:
            self.logger.debug("VoiceWakeWordEvent model not available; skipping")
            return {}

        try:
            since = datetime.now(timezone.utc) - timedelta(days=30)
            stmt = (
                select(
                    func.extract("hour", VoiceWakeWordEvent.created_at).label("hour"),
                    func.count().label("cnt"),
                )
                .where(
                    VoiceWakeWordEvent.user_id == user_id,
                    VoiceWakeWordEvent.created_at >= since,
                    VoiceWakeWordEvent.is_valid_activation.is_(True),
                )
                .group_by("hour")
                .order_by(func.count().desc())
            )
            result = await db.execute(stmt)
            rows = result.all()

            if not rows:
                return {}

            # Keep top hours (those with >= 30% of the max frequency).
            max_count = rows[0].cnt if rows else 0
            threshold = max(1, int(max_count * 0.3))
            preferred = [int(row.hour) for row in rows if row.cnt >= threshold]

            return {"preferred_hours": {"voice_interaction": sorted(preferred)}}

        except Exception:
            self.logger.exception(
                "Failed to fetch engagement patterns for user %s", user_id
            )
            return {}

    async def get_recent_moods(
        self,
        user_id: str,
        db: AsyncSession,
        days: int = 3,
    ) -> list[dict[str, Any]]:
        """Retrieve recent mood entries for the user.

        Args:
            user_id: User identifier.
            db: Active async database session.
            days: Number of past days to look back (default 3).

        Returns:
            A list of dicts with keys ``score``, ``valence``, and ``recorded_at``
            ordered from oldest to newest.  Returns an empty list on error.

        Example:
            >>> moods = await engine.get_recent_moods("u-1", db, days=3)
            >>> moods
            [{"score": 7, "valence": 0.7, "recorded_at": datetime(...)}, ...]
        """
        if Mood is None:
            self.logger.debug("Mood model not available; skipping")
            return []

        try:
            since = datetime.now(timezone.utc) - timedelta(days=days)
            stmt = (
                select(Mood)
                .where(Mood.user_id == user_id, Mood.at >= since)
                .order_by(Mood.at.asc())
            )
            result = await db.execute(stmt)
            rows = result.scalars().all()

            return [
                {
                    "score": row.score,
                    "valence": _score_to_valence(row.score),
                    "recorded_at": row.at,
                }
                for row in rows
            ]

        except Exception:
            self.logger.exception(
                "Failed to fetch recent moods for user %s", user_id
            )
            return []

    async def get_active_journeys(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> list[dict[str, Any]]:
        """Fetch active journeys for the user along with latest step state.

        Each returned dict contains:
          - ``journey_id``
          - ``current_day_index``
          - ``duration_days`` (from the linked template, or a fallback of 14)
          - ``title`` (template title or ``"your journey"``)
          - ``last_step_completed_at`` (datetime or None)

        Args:
            user_id: User identifier.
            db: Active async database session.

        Returns:
            List of active journey dicts.  Empty list on error.

        Example:
            >>> journeys = await engine.get_active_journeys("u-1", db)
            >>> journeys[0]["current_day_index"]
            5
        """
        if UserJourney is None:
            self.logger.debug("UserJourney model not available; skipping")
            return []

        try:
            stmt = (
                select(UserJourney)
                .where(
                    UserJourney.user_id == user_id,
                    UserJourney.status == "active",
                )
            )
            result = await db.execute(stmt)
            journeys = result.scalars().all()

            output: list[dict[str, Any]] = []
            for journey in journeys:
                # Determine duration from template if available.
                duration_days = 14  # sensible default
                title = "your journey"
                if JourneyTemplate is not None and journey.journey_template_id:
                    try:
                        tmpl_stmt = select(JourneyTemplate).where(
                            JourneyTemplate.id == journey.journey_template_id
                        )
                        tmpl_result = await db.execute(tmpl_stmt)
                        tmpl = tmpl_result.scalar_one_or_none()
                        if tmpl:
                            duration_days = getattr(tmpl, "duration_days", 14)
                            title = getattr(tmpl, "title", title)
                    except Exception:
                        self.logger.debug(
                            "Could not load template for journey %s", journey.id
                        )

                # Find most recent completed step.
                last_step_at: datetime | None = None
                if UserJourneyStepState is not None:
                    try:
                        step_stmt = (
                            select(func.max(UserJourneyStepState.completed_at))
                            .where(
                                UserJourneyStepState.user_journey_id == journey.id,
                                UserJourneyStepState.completed_at.is_not(None),
                            )
                        )
                        step_result = await db.execute(step_stmt)
                        last_step_at = step_result.scalar_one_or_none()
                    except Exception:
                        self.logger.debug(
                            "Could not fetch last step for journey %s", journey.id
                        )

                output.append(
                    {
                        "journey_id": journey.id,
                        "current_day_index": journey.current_day_index,
                        "duration_days": duration_days,
                        "title": title,
                        "last_step_completed_at": last_step_at,
                    }
                )

            return output

        except Exception:
            self.logger.exception(
                "Failed to fetch active journeys for user %s", user_id
            )
            return []

    # ------------------------------------------------------------------
    # Mood analysis
    # ------------------------------------------------------------------

    def _detect_declining_trend(self, moods: list[dict[str, Any]]) -> bool:
        """Determine whether recent mood entries show a declining trend.

        The check is deliberately simple: compare the average valence of the
        most recent day's entries with the average of entries older than one
        day.  A decline is detected when the recent average is meaningfully
        lower (by at least 0.1 on a 0-1 scale).

        Args:
            moods: List of mood dicts as returned by ``get_recent_moods``.

        Returns:
            ``True`` if a declining trend is detected, ``False`` otherwise.

        Example:
            >>> engine._detect_declining_trend([
            ...     {"valence": 0.8, "recorded_at": two_days_ago},
            ...     {"valence": 0.5, "recorded_at": today},
            ... ])
            True
        """
        if len(moods) < 2:
            return False

        now = datetime.now(timezone.utc)
        one_day_ago = now - timedelta(days=1)

        recent_valences: list[float] = []
        older_valences: list[float] = []

        for mood in moods:
            recorded = mood.get("recorded_at")
            valence = mood.get("valence", 0.5)
            if recorded is None:
                continue
            # Ensure timezone-aware comparison.
            if recorded.tzinfo is None:
                recorded = recorded.replace(tzinfo=timezone.utc)
            if recorded >= one_day_ago:
                recent_valences.append(valence)
            else:
                older_valences.append(valence)

        if not recent_valences or not older_valences:
            return False

        recent_avg = sum(recent_valences) / len(recent_valences)
        older_avg = sum(older_valences) / len(older_valences)

        # A drop of 0.1+ on a 0-1 scale is significant enough.
        decline_threshold = 0.1
        return (older_avg - recent_avg) >= decline_threshold

    # ------------------------------------------------------------------
    # Individual trigger checks
    # ------------------------------------------------------------------

    async def _check_time_pattern(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> PredictiveAction | None:
        """Trigger 1: suggest an activity if the current hour matches the user's
        preferred engagement hours.

        Returns:
            ``PredictiveAction`` of type ``suggest_activity`` or ``None``.
        """
        patterns = await self.get_engagement_patterns(user_id, db)
        preferred_hours = (
            patterns.get("preferred_hours", {}).get("voice_interaction", [])
        )
        if not preferred_hours:
            return None

        current_hour = datetime.now(timezone.utc).hour
        if current_hour not in preferred_hours:
            return None

        return PredictiveAction(
            type="suggest_activity",
            message=(
                "You usually meditate around this time. "
                "Shall I start your Sadhana?"
            ),
            action="navigate_to_sadhana",
            confidence=0.85,
            metadata={"preferred_hour": current_hour},
        )

    async def _check_emotional_trajectory(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> PredictiveAction | None:
        """Trigger 2: if mood has been declining over the past 3 days, perform
        a gentle compassionate check-in.

        Returns:
            ``PredictiveAction`` of type ``check_in`` or ``None``.
        """
        moods = await self.get_recent_moods(user_id, db, days=3)
        if not moods:
            return None

        if not self._detect_declining_trend(moods):
            return None

        latest_valence = moods[-1].get("valence", 0.5)
        # Higher confidence when the drop is steeper.
        confidence = min(0.95, 0.60 + (0.5 - latest_valence) * 0.5)

        return PredictiveAction(
            type="check_in",
            message=(
                "I've noticed things have been a bit heavy lately. "
                "How are you feeling today?"
            ),
            action="mood_check",
            confidence=confidence,
            metadata={
                "recent_valence": latest_valence,
                "mood_count": len(moods),
            },
        )

    async def _check_unfinished_journeys(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> PredictiveAction | None:
        """Trigger 3: nudge the user if they have an active journey with no
        step completion in the last N days.

        Returns:
            ``PredictiveAction`` of type ``nudge`` or ``None``.
        """
        journeys = await self.get_active_journeys(user_id, db)
        if not journeys:
            return None

        now = datetime.now(timezone.utc)
        threshold = now - timedelta(days=self._JOURNEY_INACTIVITY_DAYS)

        for journey in journeys:
            last_completed = journey.get("last_step_completed_at")

            # If we have no completion timestamp, fall back to comparing with
            # the journey start (implicitly before threshold).
            if last_completed is None or (
                last_completed.tzinfo is not None
                and last_completed < threshold
            ) or (
                last_completed.tzinfo is None
                and last_completed.replace(tzinfo=timezone.utc) < threshold
            ):
                day = journey.get("current_day_index", 1)
                total = journey.get("duration_days", 14)
                title = journey.get("title", "your journey")

                return PredictiveAction(
                    type="nudge",
                    message=(
                        f"You're on day {day} of {total} in \"{title}\". "
                        "Ready to continue?"
                    ),
                    action="resume_journey",
                    confidence=0.75,
                    metadata={
                        "journey_id": journey.get("journey_id"),
                        "current_day": day,
                        "total_days": total,
                    },
                )

        return None

    def _check_context_followup(
        self,
        context: dict[str, Any],
    ) -> PredictiveAction | None:
        """Trigger 4: suggest journaling after an emotional reset or journey step.

        Args:
            context: Dict provided by the caller with boolean flags indicating
                recent user activity.

        Returns:
            ``PredictiveAction`` of type ``follow_up`` or ``None``.
        """
        if not context:
            return None

        if context.get("just_completed_emotional_reset"):
            return PredictiveAction(
                type="follow_up",
                message=(
                    "That was a powerful reset. Would you like to capture "
                    "your thoughts in your journal while they're fresh?"
                ),
                action="navigate_to_journal",
                confidence=0.80,
                metadata={"trigger": "emotional_reset"},
            )

        if context.get("just_completed_journey_step"):
            return PredictiveAction(
                type="follow_up",
                message=(
                    "Great progress on your journey! Writing a short "
                    "reflection can deepen the insight. Want to journal?"
                ),
                action="navigate_to_journal",
                confidence=0.75,
                metadata={"trigger": "journey_step"},
            )

        return None

    async def _check_conversation_continuity(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> PredictiveAction | None:
        """Trigger 5: greet the user by referencing their last conversation topic.

        Relies on ``CrossSessionContextService`` to retrieve the most recent
        memory.  Falls back gracefully when the service is unavailable.

        Returns:
            ``PredictiveAction`` of type ``conversation_continuity`` or ``None``.
        """
        if CrossSessionContextService is None:
            self.logger.debug(
                "CrossSessionContextService not available; skipping continuity check"
            )
            return None

        try:
            service = CrossSessionContextService(db_session=db)
            summary = await service.get_user_summary(user_id)

            if not summary:
                return None

            # The summary dict may contain recent_topics or similar keys.
            recent_topics: list[str] = summary.get("recent_topics", [])
            if not recent_topics:
                # Fall back to looking at memories directly.
                recent_memories = summary.get("memories", [])
                if recent_memories and isinstance(recent_memories, list):
                    # Use the most recent memory's content as the topic.
                    last_memory = recent_memories[-1]
                    topic = (
                        last_memory.get("content", "")
                        if isinstance(last_memory, dict)
                        else str(last_memory)
                    )
                    if topic:
                        recent_topics = [topic]

            if not recent_topics:
                return None

            last_topic = recent_topics[-1]

            return PredictiveAction(
                type="conversation_continuity",
                message=(
                    f"Welcome back! Last time we talked about {last_topic}. "
                    "How's that going?"
                ),
                action=None,
                confidence=0.55,
                metadata={"last_topic": last_topic},
            )

        except Exception:
            self.logger.exception(
                "Failed to check conversation continuity for user %s", user_id
            )
            return None
