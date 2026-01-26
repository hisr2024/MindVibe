"""
Enhanced Wisdom Journey Engine - Core orchestration for multi-journey support.

This engine provides:
- Multi-journey support (users can have multiple active journeys)
- Today's agenda across all active journeys
- Verse picker with exclusion of recent verses
- Step generation with caching (idempotent)
- Journey scheduling based on pace preferences

Integrates with:
- GitaCorpusAdapter for verse access
- JourneyCoach for KIAAN AI step generation
- Multi-provider LLM layer
"""

import datetime
import logging
import uuid
from typing import Any

from sqlalchemy import and_, or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    JourneyTemplate,
    JourneyTemplateStep,
    UserJourney,
    UserJourneyStepState,
    UserJourneyStatus,
    GitaVerse,
)
from backend.services.gita_corpus_adapter import (
    GitaCorpusAdapter,
    get_gita_corpus_adapter,
    VerseReference,
    VerseText,
)
from backend.services.journey_coach import (
    JourneyCoach,
    get_journey_coach,
)

logger = logging.getLogger(__name__)


class JourneyScheduler:
    """
    Determines the current day_index for user journeys based on pace.

    Supports:
    - daily: one step per calendar day
    - every_other_day: one step every 2 days
    - weekly: one step per week
    """

    @staticmethod
    def calculate_day_index(
        started_at: datetime.datetime,
        pace: str = "daily",
        completed_days: int = 0,
    ) -> int:
        """
        Calculate the current day index based on start date and pace.

        Args:
            started_at: When the journey was started
            pace: Pace preference (daily|every_other_day|weekly)
            completed_days: Number of days already completed

        Returns:
            Current day index (1-based)
        """
        now = datetime.datetime.now(datetime.UTC)
        elapsed = now - started_at

        if pace == "daily":
            elapsed_days = elapsed.days
        elif pace == "every_other_day":
            elapsed_days = elapsed.days // 2
        elif pace == "weekly":
            elapsed_days = elapsed.days // 7
        else:
            elapsed_days = elapsed.days

        # Day index is at least 1, and at most elapsed_days + 1
        return max(1, min(elapsed_days + 1, completed_days + 1))

    @staticmethod
    def is_step_available(
        user_journey: UserJourney,
        day_index: int,
    ) -> bool:
        """
        Check if a step is available to be delivered.

        Args:
            user_journey: The user journey instance
            day_index: Day to check

        Returns:
            True if step can be delivered
        """
        if user_journey.status != UserJourneyStatus.ACTIVE:
            return False

        pace = user_journey.personalization.get("pace", "daily") if user_journey.personalization else "daily"
        started_at = user_journey.started_at

        current_day = JourneyScheduler.calculate_day_index(
            started_at, pace, user_journey.current_day_index - 1
        )

        return day_index <= current_day


class VersePicker:
    """
    Selects verses for journey steps from the full 700+ verse corpus.

    Features:
    - Prefers static_verse_refs if defined in template
    - Uses chapter recommendations based on enemy focus
    - Falls back to tag-based search from full corpus
    - Excludes recently used verses (configurable window)
    """

    def __init__(self) -> None:
        self._adapter: GitaCorpusAdapter = get_gita_corpus_adapter()

    async def pick_verses(
        self,
        db: AsyncSession,
        template_step: JourneyTemplateStep | None,
        enemy_tags: list[str],
        user_journey_id: str,
        avoid_recent: int = 20,
        max_verses: int = 3,
    ) -> list[VerseReference]:
        """
        Pick verses for a journey step from the 700+ verse Gita corpus.

        Args:
            db: Database session
            template_step: Optional template step with verse_selector
            enemy_tags: Enemy tags to filter by
            user_journey_id: User journey ID for exclusion lookup
            avoid_recent: Number of recent verses to exclude
            max_verses: Maximum verses to return

        Returns:
            List of verse references from across all 18 chapters
        """
        # 1. Check for static verse refs in template
        if template_step and template_step.static_verse_refs:
            refs = template_step.static_verse_refs
            if isinstance(refs, list) and refs:
                return [{"chapter": r["chapter"], "verse": r["verse"]} for r in refs[:max_verses]]

        # 2. Get recently used verses for this journey
        exclude_refs = await self._get_recent_verses(db, user_journey_id, avoid_recent)

        # 3. Get verse selector config from template
        selector = {}
        if template_step and template_step.verse_selector:
            selector = template_step.verse_selector

        tags = selector.get("tags", []) or enemy_tags
        limit = min(selector.get("max_verses", max_verses), max_verses)

        # 4. Get chapters - prefer template-specified, fallback to enemy-recommended
        primary_enemy = enemy_tags[0] if enemy_tags else "mixed"
        selector_chapters = selector.get("chapters", [])
        if selector_chapters:
            # Use template-specified chapters (from 700+ verse corpus)
            recommended_chapters = selector_chapters
        else:
            # Use enemy-based recommendations across all 18 chapters
            recommended_chapters = self._adapter.get_recommended_chapters(primary_enemy)

        # 5. Search for verses by tags across recommended chapters (full 700+ corpus)
        results = await self._adapter.search_by_tags(
            db=db,
            tags=tags,
            limit=limit,
            exclude_refs=exclude_refs,
            chapters=recommended_chapters,
        )

        # 6. If not enough results, broaden search to all chapters
        if len(results) < limit:
            additional = await self._adapter.search_by_tags(
                db=db,
                tags=tags,
                limit=limit - len(results),
                exclude_refs=exclude_refs + [{"chapter": r["chapter"], "verse": r["verse"]} for r in results],
                chapters=None,  # Search all chapters
            )
            results.extend(additional)

        return [{"chapter": r["chapter"], "verse": r["verse"]} for r in results]

    async def _get_recent_verses(
        self,
        db: AsyncSession,
        user_journey_id: str,
        limit: int,
    ) -> list[VerseReference]:
        """Get recently used verses for exclusion."""
        try:
            result = await db.execute(
                select(UserJourneyStepState.verse_refs)
                .where(
                    and_(
                        UserJourneyStepState.user_journey_id == user_journey_id,
                        UserJourneyStepState.verse_refs.isnot(None),
                    )
                )
                .order_by(UserJourneyStepState.day_index.desc())
                .limit(limit)
            )

            rows = result.scalars().all()
            recent: list[VerseReference] = []

            for verse_refs in rows:
                if isinstance(verse_refs, list):
                    for ref in verse_refs:
                        if isinstance(ref, dict) and "chapter" in ref and "verse" in ref:
                            recent.append({"chapter": ref["chapter"], "verse": ref["verse"]})

            return recent

        except Exception as e:
            logger.error(f"Error getting recent verses: {e}")
            return []


class StepGenerator:
    """
    Generates step content using KIAAN AI.

    Features:
    - Idempotent: same day_index returns cached state
    - Stores provider tracking info
    - Handles safety responses
    """

    def __init__(self) -> None:
        self._coach: JourneyCoach = get_journey_coach()
        self._verse_picker = VersePicker()
        self._adapter: GitaCorpusAdapter = get_gita_corpus_adapter()

    async def generate_or_get_step(
        self,
        db: AsyncSession,
        user_journey: UserJourney,
        day_index: int,
        user_reflection: str | None = None,
    ) -> UserJourneyStepState:
        """
        Generate or retrieve cached step for a day.

        This method is idempotent - calling it multiple times with
        the same day_index returns the cached step if already generated.

        Args:
            db: Database session
            user_journey: User journey instance
            day_index: Day index to generate for
            user_reflection: Optional user reflection (for safety check)

        Returns:
            UserJourneyStepState with generated content
        """
        # 1. Check for existing step state
        existing = await self._get_existing_step(db, user_journey.id, day_index)
        if existing and existing.kiaan_step_json:
            logger.info(f"Returning cached step for journey {user_journey.id} day {day_index}")
            return existing

        # 2. Get template and template step
        template = user_journey.template
        template_step = None

        if template:
            result = await db.execute(
                select(JourneyTemplateStep).where(
                    and_(
                        JourneyTemplateStep.journey_template_id == template.id,
                        JourneyTemplateStep.day_index == day_index,
                    )
                )
            )
            template_step = result.scalar_one_or_none()

        # 3. Pick verses
        enemy_tags = template.primary_enemy_tags if template else ["general"]
        verse_refs = await self._verse_picker.pick_verses(
            db=db,
            template_step=template_step,
            enemy_tags=enemy_tags,
            user_journey_id=user_journey.id,
            avoid_recent=20,
            max_verses=3,
        )

        # 4. Get personalization preferences
        personalization = user_journey.personalization or {}
        tone = personalization.get("preferred_tone", "gentle")
        provider_preference = personalization.get("provider_preference", "auto")

        # 5. Generate step content
        teaching_hint = template_step.teaching_hint if template_step else None
        enemy_focus = enemy_tags[0] if enemy_tags else "mixed"

        try:
            step_json, provider_used, model_used = await self._coach.generate_step(
                verse_refs=verse_refs,
                enemy_focus=enemy_focus,
                day_index=day_index,
                teaching_hint=teaching_hint,
                tone=tone,
                provider_preference=provider_preference,
                user_reflection=user_reflection,
            )
        except Exception as e:
            logger.error(f"Step generation failed: {e}")
            step_json = self._get_fallback_step(enemy_focus, day_index, verse_refs)
            provider_used = "fallback"
            model_used = "none"

        # 6. Create or update step state
        if existing:
            existing.verse_refs = verse_refs
            existing.kiaan_step_json = step_json
            existing.provider_used = provider_used
            existing.model_used = model_used
            existing.delivered_at = datetime.datetime.now(datetime.UTC)
            await db.commit()
            await db.refresh(existing)
            return existing
        else:
            step_state = UserJourneyStepState(
                id=str(uuid.uuid4()),
                user_journey_id=user_journey.id,
                day_index=day_index,
                verse_refs=verse_refs,
                kiaan_step_json=step_json,
                provider_used=provider_used,
                model_used=model_used,
                delivered_at=datetime.datetime.now(datetime.UTC),
            )
            db.add(step_state)
            await db.commit()
            await db.refresh(step_state)
            return step_state

    async def _get_existing_step(
        self,
        db: AsyncSession,
        user_journey_id: str,
        day_index: int,
    ) -> UserJourneyStepState | None:
        """Get existing step state if any."""
        result = await db.execute(
            select(UserJourneyStepState).where(
                and_(
                    UserJourneyStepState.user_journey_id == user_journey_id,
                    UserJourneyStepState.day_index == day_index,
                )
            )
        )
        return result.scalar_one_or_none()

    def _get_fallback_step(
        self,
        enemy_focus: str,
        day_index: int,
        verse_refs: list[VerseReference],
    ) -> dict[str, Any]:
        """Generate a fallback step when AI generation fails."""
        enemy_labels = {
            "kama": "desire",
            "krodha": "anger",
            "lobha": "greed",
            "moha": "attachment",
            "mada": "ego",
            "matsarya": "envy",
            "mixed": "inner challenges",
        }

        label = enemy_labels.get(enemy_focus, "inner challenges")

        return {
            "step_title": f"Day {day_index}: Finding Balance",
            "today_focus": enemy_focus,
            "verse_refs": verse_refs,
            "teaching": (
                f"Today we focus on working with {label} through ancient wisdom. "
                "Take time to read the verses provided and reflect on how they apply to your life. "
                "Remember that change comes gradually through consistent practice. "
                "Be patient and compassionate with yourself as you walk this path."
            ),
            "guided_reflection": [
                f"How has {label} shown up in your life recently?",
                "What would life look like if you found more balance in this area?",
                "What one small step could you take today?",
            ],
            "practice": {
                "name": "Mindful Breathing",
                "instructions": [
                    "Find a comfortable seated position",
                    "Close your eyes and take 5 deep breaths",
                    "With each exhale, release tension and resistance",
                    "Sit quietly for 5 minutes, observing your thoughts",
                ],
                "duration_minutes": 5,
            },
            "micro_commitment": f"Today I will notice when {label} arises and pause before reacting.",
            "check_in_prompt": {
                "scale": "0-10",
                "label": f"How intense is your {label} feeling today?",
            },
        }


class TodayAgenda:
    """
    Aggregates today's steps across all active journeys.

    Features:
    - Returns steps for all active journeys
    - Optionally recommends priority step based on check-in intensity
    - Includes resolved verse text for display
    """

    def __init__(self) -> None:
        self._step_generator = StepGenerator()
        self._scheduler = JourneyScheduler()
        self._adapter: GitaCorpusAdapter = get_gita_corpus_adapter()

    async def get_today_agenda(
        self,
        db: AsyncSession,
        user_id: str,
        include_verse_text: bool = True,
    ) -> dict[str, Any]:
        """
        Get today's agenda across all active journeys.

        Args:
            db: Database session
            user_id: User ID
            include_verse_text: Whether to resolve verse text

        Returns:
            Dict with steps list and optional priority recommendation
        """
        # 1. Get all active journeys
        result = await db.execute(
            select(UserJourney)
            .where(
                and_(
                    UserJourney.user_id == user_id,
                    UserJourney.status == UserJourneyStatus.ACTIVE,
                )
            )
            .order_by(UserJourney.started_at.desc())
        )
        active_journeys = list(result.scalars().all())

        if not active_journeys:
            return {
                "steps": [],
                "priority_step": None,
                "message": "No active journeys. Start a journey to begin your wisdom path.",
            }

        # 2. Get today's step for each journey
        steps: list[dict[str, Any]] = []
        highest_intensity = -1
        priority_step: dict[str, Any] | None = None

        for journey in active_journeys:
            pace = journey.personalization.get("pace", "daily") if journey.personalization else "daily"
            current_day = self._scheduler.calculate_day_index(
                journey.started_at, pace, journey.current_day_index - 1
            )

            # Generate or get cached step
            step_state = await self._step_generator.generate_or_get_step(
                db=db,
                user_journey=journey,
                day_index=current_day,
            )

            # Build step response
            step_data = {
                "user_journey_id": journey.id,
                "journey_title": journey.template.title if journey.template else "Wisdom Journey",
                "day_index": current_day,
                "total_days": journey.template.duration_days if journey.template else 14,
                "step_state_id": step_state.id,
                "kiaan_step": step_state.kiaan_step_json,
                "completed": step_state.completed_at is not None,
                "verse_refs": step_state.verse_refs,
            }

            # Resolve verse text if requested
            if include_verse_text and step_state.verse_refs:
                verse_texts: list[dict[str, Any]] = []
                for ref in step_state.verse_refs:
                    text = await self._adapter.get_verse_text(db, ref["chapter"], ref["verse"])
                    if text:
                        verse_texts.append({
                            "chapter": ref["chapter"],
                            "verse": ref["verse"],
                            **text,
                        })
                step_data["verse_texts"] = verse_texts

            steps.append(step_data)

            # Check for priority (based on last check-in intensity)
            if step_state.check_in:
                intensity = step_state.check_in.get("intensity", 0)
                if intensity > highest_intensity:
                    highest_intensity = intensity
                    priority_step = step_data

        return {
            "steps": steps,
            "priority_step": priority_step,
            "active_journey_count": len(active_journeys),
        }


class EnhancedJourneyEngine:
    """
    Main entry point for the enhanced Wisdom Journey system.

    Orchestrates:
    - Journey template catalog
    - Multi-journey management
    - Today's agenda
    - Step generation and completion
    """

    def __init__(self) -> None:
        self._scheduler = JourneyScheduler()
        self._verse_picker = VersePicker()
        self._step_generator = StepGenerator()
        self._today_agenda = TodayAgenda()
        self._adapter: GitaCorpusAdapter = get_gita_corpus_adapter()

        logger.info("EnhancedJourneyEngine initialized")

    async def get_catalog(
        self,
        db: AsyncSession,
    ) -> list[dict[str, Any]]:
        """Get all active journey templates from 700+ verse corpus."""
        result = await db.execute(
            select(JourneyTemplate)
            .where(JourneyTemplate.is_active == True)
            .order_by(JourneyTemplate.is_featured.desc(), JourneyTemplate.title)
        )
        templates = list(result.scalars().all())
        logger.info(f"Found {len(templates)} active journey templates in database")

        return [
            {
                "id": t.id,
                "slug": t.slug,
                "title": t.title,
                "description": t.description,
                "primary_enemy_tags": t.primary_enemy_tags,
                "duration_days": t.duration_days,
                "difficulty": t.difficulty,
                "is_featured": t.is_featured,
                "icon_name": t.icon_name,
                "color_theme": t.color_theme,
            }
            for t in templates
        ]

    async def start_journeys(
        self,
        db: AsyncSession,
        user_id: str,
        journey_template_ids: list[str],
        personalization: dict[str, Any] | None = None,
    ) -> list[UserJourney]:
        """
        Start one or more journeys for a user.

        Args:
            db: Database session
            user_id: User ID
            journey_template_ids: List of template IDs to start
            personalization: Optional personalization settings

        Returns:
            List of created UserJourney instances
        """
        journeys: list[UserJourney] = []

        for template_id in journey_template_ids:
            # Verify template exists and is active
            template = await db.get(JourneyTemplate, template_id)
            if not template or not template.is_active:
                logger.warning(f"Template {template_id} not found or inactive")
                continue

            # Create user journey
            journey = UserJourney(
                id=str(uuid.uuid4()),
                user_id=user_id,
                journey_template_id=template_id,
                status=UserJourneyStatus.ACTIVE,
                current_day_index=1,
                personalization=personalization or {},
            )
            db.add(journey)
            journeys.append(journey)

            logger.info(f"Started journey {journey.id} (template: {template.slug}) for user {user_id}")

        await db.commit()

        for j in journeys:
            await db.refresh(j)

        return journeys

    async def get_active_journeys(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> list[dict[str, Any]]:
        """Get all active journeys for a user."""
        result = await db.execute(
            select(UserJourney)
            .where(
                and_(
                    UserJourney.user_id == user_id,
                    UserJourney.status == UserJourneyStatus.ACTIVE,
                )
            )
            .order_by(UserJourney.started_at.desc())
        )
        journeys = list(result.scalars().all())

        return [
            {
                "id": j.id,
                "template_id": j.journey_template_id,
                "template_title": j.template.title if j.template else "Journey",
                "template_slug": j.template.slug if j.template else None,
                "status": j.status.value,
                "current_day_index": j.current_day_index,
                "total_days": j.template.duration_days if j.template else 14,
                "progress_percentage": int((j.current_day_index / (j.template.duration_days if j.template else 14)) * 100),
                "started_at": j.started_at.isoformat(),
                "personalization": j.personalization,
            }
            for j in journeys
        ]

    async def get_today_steps(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> dict[str, Any]:
        """Get today's steps across all active journeys."""
        return await self._today_agenda.get_today_agenda(db, user_id)

    async def get_journey_step(
        self,
        db: AsyncSession,
        user_journey_id: str,
        day_index: int | None = None,
    ) -> dict[str, Any] | None:
        """
        Get a specific step for a journey.

        If day_index is None, returns the current day's step.
        """
        journey = await db.get(UserJourney, user_journey_id)
        if not journey:
            return None

        target_day = day_index or journey.current_day_index

        step_state = await self._step_generator.generate_or_get_step(
            db=db,
            user_journey=journey,
            day_index=target_day,
        )

        # Resolve verse texts
        verse_texts = []
        for ref in step_state.verse_refs:
            text = await self._adapter.get_verse_text(db, ref["chapter"], ref["verse"])
            if text:
                verse_texts.append({
                    "chapter": ref["chapter"],
                    "verse": ref["verse"],
                    **text,
                })

        return {
            "step_state_id": step_state.id,
            "user_journey_id": user_journey_id,
            "day_index": target_day,
            "kiaan_step": step_state.kiaan_step_json,
            "verse_refs": step_state.verse_refs,
            "verse_texts": verse_texts,
            "completed": step_state.completed_at is not None,
            "check_in": step_state.check_in,
            "provider_used": step_state.provider_used,
            "model_used": step_state.model_used,
        }

    async def complete_step(
        self,
        db: AsyncSession,
        user_journey_id: str,
        day_index: int,
        check_in: dict[str, Any] | None = None,
        reflection_response: str | None = None,
    ) -> dict[str, Any]:
        """
        Mark a step as complete with check-in and reflection.

        Args:
            db: Database session
            user_journey_id: Journey ID
            day_index: Day index being completed
            check_in: Optional check-in data {"intensity": 0-10, "label": "..."}
            reflection_response: Optional reflection text

        Returns:
            Updated step state
        """
        # Get journey
        journey = await db.get(UserJourney, user_journey_id)
        if not journey:
            raise ValueError(f"Journey {user_journey_id} not found")

        # Get or create step state
        result = await db.execute(
            select(UserJourneyStepState).where(
                and_(
                    UserJourneyStepState.user_journey_id == user_journey_id,
                    UserJourneyStepState.day_index == day_index,
                )
            )
        )
        step_state = result.scalar_one_or_none()

        if not step_state:
            raise ValueError(f"Step {day_index} not found for journey {user_journey_id}")

        # Update step state
        step_state.completed_at = datetime.datetime.now(datetime.UTC)

        if check_in:
            step_state.check_in = {
                **check_in,
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            }

        if reflection_response:
            # Store encrypted reflection reference
            # In production, this would link to the journal encryption system
            step_state.reflection_encrypted = {
                "content": reflection_response,  # Should be encrypted
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            }

        # Update journey progress
        template = journey.template
        total_days = template.duration_days if template else 14

        if day_index >= journey.current_day_index:
            journey.current_day_index = day_index + 1

        if journey.current_day_index > total_days:
            journey.status = UserJourneyStatus.COMPLETED
            journey.completed_at = datetime.datetime.now(datetime.UTC)
            logger.info(f"Journey {user_journey_id} completed")

        await db.commit()
        await db.refresh(step_state)

        return {
            "step_state_id": step_state.id,
            "day_index": day_index,
            "completed": True,
            "check_in": step_state.check_in,
            "journey_completed": journey.status == UserJourneyStatus.COMPLETED,
        }

    async def pause_journey(
        self,
        db: AsyncSession,
        user_journey_id: str,
    ) -> UserJourney:
        """Pause a journey."""
        journey = await db.get(UserJourney, user_journey_id)
        if not journey:
            raise ValueError(f"Journey {user_journey_id} not found")

        journey.status = UserJourneyStatus.PAUSED
        journey.paused_at = datetime.datetime.now(datetime.UTC)

        await db.commit()
        await db.refresh(journey)
        return journey

    async def resume_journey(
        self,
        db: AsyncSession,
        user_journey_id: str,
    ) -> UserJourney:
        """Resume a paused journey."""
        journey = await db.get(UserJourney, user_journey_id)
        if not journey:
            raise ValueError(f"Journey {user_journey_id} not found")

        if journey.status != UserJourneyStatus.PAUSED:
            raise ValueError(f"Journey {user_journey_id} is not paused")

        journey.status = UserJourneyStatus.ACTIVE
        journey.paused_at = None

        await db.commit()
        await db.refresh(journey)
        return journey

    async def abandon_journey(
        self,
        db: AsyncSession,
        user_journey_id: str,
    ) -> UserJourney:
        """Abandon a journey."""
        journey = await db.get(UserJourney, user_journey_id)
        if not journey:
            raise ValueError(f"Journey {user_journey_id} not found")

        journey.status = UserJourneyStatus.ABANDONED

        await db.commit()
        await db.refresh(journey)
        return journey

    async def get_journey_history(
        self,
        db: AsyncSession,
        user_journey_id: str,
    ) -> list[dict[str, Any]]:
        """Get all steps history for a journey."""
        result = await db.execute(
            select(UserJourneyStepState)
            .where(UserJourneyStepState.user_journey_id == user_journey_id)
            .order_by(UserJourneyStepState.day_index)
        )
        steps = list(result.scalars().all())

        return [
            {
                "day_index": s.day_index,
                "delivered_at": s.delivered_at.isoformat() if s.delivered_at else None,
                "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                "check_in": s.check_in,
                "verse_refs": s.verse_refs,
                "provider_used": s.provider_used,
            }
            for s in steps
        ]


# Singleton instance
_engine_instance: EnhancedJourneyEngine | None = None


def get_journey_engine() -> EnhancedJourneyEngine:
    """Get the singleton EnhancedJourneyEngine instance."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = EnhancedJourneyEngine()
    return _engine_instance


# Convenience export
journey_engine = get_journey_engine()
