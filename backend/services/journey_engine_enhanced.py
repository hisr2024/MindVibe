"""
Enhanced Wisdom Journey Engine - Core orchestration for multi-journey support.

This engine provides:
- Multi-journey support (users can have multiple active journeys)
- Today's agenda across all active journeys
- Verse picker with exclusion of recent verses
- Step generation with caching (idempotent)
- Journey scheduling based on pace preferences
- Encrypted reflection storage for mental health data

Integrates with:
- GitaCorpusAdapter for verse access
- JourneyCoach for KIAAN AI step generation
- Multi-provider LLM layer

Security:
- Reflections encrypted at rest using Fernet (AES-256)
- Race condition protection with SELECT FOR UPDATE
- Idempotent operations
"""

import datetime
import logging
import os
import uuid
from typing import Any

# Optional encryption support - graceful fallback if cryptography not available
# Note: Import is deferred to avoid import-time crashes with broken cryptography library
Fernet = None
ENCRYPTION_AVAILABLE = False


def _try_import_fernet():
    """Try to import Fernet, returning None if unavailable."""
    global Fernet, ENCRYPTION_AVAILABLE
    try:
        from cryptography.fernet import Fernet as _Fernet
        Fernet = _Fernet
        ENCRYPTION_AVAILABLE = True
        return _Fernet
    except Exception:
        return None


# Attempt import (will silently fail if cryptography is unavailable)
_try_import_fernet()

from sqlalchemy import and_, or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import with_for_update

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


# =============================================================================
# ENCRYPTION HELPER
# =============================================================================


class ReflectionEncryption:
    """
    Handles encryption/decryption of user reflections.

    Uses Fernet symmetric encryption (AES-256-CBC with HMAC).
    Key is stored in environment variable for security.

    SECURITY: Mental health data MUST be encrypted in production.
    Set MINDVIBE_REFLECTION_KEY and MINDVIBE_REQUIRE_ENCRYPTION=true in production.
    """

    _instance: "ReflectionEncryption | None" = None
    _fernet: Fernet | None = None
    _require_encryption: bool = False

    def __new__(cls) -> "ReflectionEncryption":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        """Initialize Fernet cipher with key from environment."""
        # Check if encryption is required (MUST be true in production)
        self._require_encryption = os.environ.get(
            "MINDVIBE_REQUIRE_ENCRYPTION", ""
        ).lower() in ("true", "1", "yes")

        environment = os.environ.get("ENVIRONMENT", "development")
        is_production = environment.lower() in ("production", "prod")

        if not ENCRYPTION_AVAILABLE:
            error_msg = (
                "CRITICAL SECURITY ERROR: cryptography library not available. "
                "Mental health data CANNOT be stored without encryption. "
                "Install cryptography package: pip install cryptography"
            )
            if self._require_encryption or is_production:
                logger.critical(error_msg)
                raise RuntimeError(error_msg)
            logger.warning(error_msg)
            self._fernet = None
            return

        key = os.environ.get("MINDVIBE_REFLECTION_KEY")
        if key:
            try:
                self._fernet = Fernet(key.encode() if isinstance(key, str) else key)
                logger.info("✓ ReflectionEncryption initialized - mental health data will be encrypted")
            except Exception as e:
                error_msg = f"Failed to initialize encryption with provided key: {e}"
                if self._require_encryption or is_production:
                    logger.critical(error_msg)
                    raise RuntimeError(error_msg)
                logger.error(error_msg)
                self._fernet = None
        else:
            error_msg = (
                "SECURITY WARNING: MINDVIBE_REFLECTION_KEY not set. "
                "Mental health reflections will be stored UNENCRYPTED. "
                "This is a serious privacy risk. Set this environment variable!"
            )
            if self._require_encryption or is_production:
                logger.critical(f"CRITICAL: {error_msg}")
                raise RuntimeError(
                    f"Cannot start in production without encryption. {error_msg}"
                )
            logger.warning(f"⚠️  {error_msg}")
            self._fernet = None

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt reflection text.

        Returns encrypted string (base64 encoded).

        Raises:
            RuntimeError: If encryption is required but unavailable.
        """
        if not plaintext:
            return ""
        if self._fernet is None:
            if self._require_encryption:
                raise RuntimeError(
                    "Cannot store mental health data: encryption is required but unavailable. "
                    "Set MINDVIBE_REFLECTION_KEY environment variable."
                )
            # In development, allow unencrypted storage with warning
            logger.warning(
                "⚠️  Storing reflection WITHOUT encryption - development mode only"
            )
            return f"UNENCRYPTED:{plaintext}"
        try:
            encrypted = self._fernet.encrypt(plaintext.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            if self._require_encryption:
                raise RuntimeError(f"Encryption failed and is required: {e}")
            return f"UNENCRYPTED:{plaintext}"

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt reflection text.

        Returns decrypted string or original if decryption fails.
        """
        if not ciphertext:
            return ""
        # Handle unencrypted data
        if ciphertext.startswith("UNENCRYPTED:"):
            return ciphertext[12:]
        if self._fernet is None:
            logger.warning("Attempting to decrypt without encryption key")
            return ciphertext
        try:
            decrypted = self._fernet.decrypt(ciphertext.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return ciphertext

    @property
    def is_available(self) -> bool:
        """Check if encryption is available."""
        return self._fernet is not None


def get_reflection_encryption() -> ReflectionEncryption:
    """Get singleton encryption instance."""
    return ReflectionEncryption()


# =============================================================================
# JOURNEY SCHEDULER
# =============================================================================


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

        # Ensure started_at has timezone info for correct comparison
        if started_at.tzinfo is None:
            # Assume UTC for timezone-naive timestamps from DB
            started_at = started_at.replace(tzinfo=datetime.UTC)

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
        """
        Generate a high-quality fallback step when AI generation fails.

        Each enemy type has carefully crafted content based on Gita teachings.
        """
        # Rich fallback content per enemy type
        enemy_content = {
            "kama": {
                "label": "desire",
                "title": f"Day {day_index}: Understanding Desire",
                "teaching": (
                    "The Gita teaches that desire (kama) is neither good nor bad in itself - "
                    "it is the attachment to outcomes that creates suffering. Like fire that provides "
                    "warmth but can also burn, desire requires awareness and direction. Today, we "
                    "practice discerning between desires that align with our dharma and those that "
                    "lead us astray. The goal is not to eliminate desire but to channel it wisely."
                ),
                "reflections": [
                    "What desires have been occupying your mind lately?",
                    "Which of these desires align with your deeper values and purpose?",
                    "Can you find the stillness behind the wanting?",
                ],
                "practice": {
                    "name": "Desire Observation",
                    "instructions": [
                        "Sit quietly and bring to mind a current desire",
                        "Notice where you feel it in your body",
                        "Observe without judgment - just witness the sensation",
                        "Ask: 'What is the deeper need behind this want?'",
                        "Rest in the awareness that observes the desire",
                    ],
                    "duration_minutes": 10,
                },
                "commitment": "Today I will pause when a strong desire arises and ask what deeper need it represents.",
            },
            "krodha": {
                "label": "anger",
                "title": f"Day {day_index}: Transforming Anger",
                "teaching": (
                    "Krishna warns that anger clouds judgment and leads to delusion. Yet anger "
                    "itself carries important information - it often signals a boundary being crossed "
                    "or a value being violated. The practice is not to suppress anger but to understand "
                    "its message without being controlled by it. Today we work on creating space between "
                    "the trigger and our response, allowing wisdom to guide our actions."
                ),
                "reflections": [
                    "What situations have triggered anger in you recently?",
                    "What boundary or value was being challenged in those moments?",
                    "How might you honor that value without being consumed by anger?",
                ],
                "practice": {
                    "name": "STOP Practice for Anger",
                    "instructions": [
                        "S - Stop: When anger arises, pause physically",
                        "T - Take a breath: Three deep breaths, exhaling slowly",
                        "O - Observe: Notice the anger without judgment",
                        "P - Proceed: Choose your response consciously",
                        "Practice this mentally with a recent trigger",
                    ],
                    "duration_minutes": 10,
                },
                "commitment": "Today I will take three breaths before responding when I feel anger rising.",
            },
            "lobha": {
                "label": "greed",
                "title": f"Day {day_index}: Cultivating Contentment",
                "teaching": (
                    "The Gita speaks of santosha - contentment that comes from within rather than "
                    "from accumulation. Greed (lobha) arises from a sense of lack, a belief that we "
                    "are not enough as we are. Today we practice recognizing the abundance already "
                    "present in our lives. True wealth is measured not by what we possess but by "
                    "how little we need to feel complete."
                ),
                "reflections": [
                    "In what areas of life do you feel a sense of 'not enough'?",
                    "What blessings in your life often go unacknowledged?",
                    "How might contentment change your relationship with wanting more?",
                ],
                "practice": {
                    "name": "Gratitude Inventory",
                    "instructions": [
                        "Close your eyes and take a few centering breaths",
                        "Mentally scan through your day so far",
                        "Notice five things you can be grateful for",
                        "For each one, feel the gratitude in your heart",
                        "Rest in the feeling of abundance",
                    ],
                    "duration_minutes": 8,
                },
                "commitment": "Today I will notice one moment of 'wanting more' and pause to appreciate what I have.",
            },
            "moha": {
                "label": "attachment",
                "title": f"Day {day_index}: Seeing Through Illusion",
                "teaching": (
                    "Moha - delusion or attachment - is described in the Gita as the veil that "
                    "obscures our true nature. We become attached to roles, possessions, and outcomes, "
                    "forgetting the unchanging Self beneath all changes. Today we practice viveka - "
                    "discrimination between the eternal and the temporary. This is not about "
                    "abandoning life but about holding it more lightly."
                ),
                "reflections": [
                    "What attachments feel most difficult to release?",
                    "What would remain if these attachments were gone?",
                    "Can you find the part of you that exists beyond all attachments?",
                ],
                "practice": {
                    "name": "Witness Meditation",
                    "instructions": [
                        "Sit comfortably and close your eyes",
                        "Notice thoughts as they arise and pass",
                        "Ask: 'Who is aware of these thoughts?'",
                        "Rest in the awareness itself",
                        "Recognize: 'I am the witness, not the witnessed'",
                    ],
                    "duration_minutes": 12,
                },
                "commitment": "Today I will observe one attachment without identifying with it completely.",
            },
            "mada": {
                "label": "ego",
                "title": f"Day {day_index}: Dissolving the Small Self",
                "teaching": (
                    "Pride (mada) inflates the ego and separates us from others and from the Divine. "
                    "The Gita teaches that true humility is not self-deprecation but recognition of "
                    "our place in the larger whole. The ego is not an enemy to be destroyed but a "
                    "servant that has tried to become master. Today we practice returning the ego "
                    "to its proper place through service and surrender."
                ),
                "reflections": [
                    "Where does pride show up most strongly in your life?",
                    "What fear might be hiding beneath this pride?",
                    "How might genuine humility feel different from insecurity?",
                ],
                "practice": {
                    "name": "Seva Contemplation",
                    "instructions": [
                        "Reflect on someone you could help today",
                        "Plan one small act of service with no expectation of return",
                        "Notice any resistance or pride that arises",
                        "Offer the act mentally to something greater than yourself",
                        "Feel the lightness of ego-free giving",
                    ],
                    "duration_minutes": 10,
                },
                "commitment": "Today I will perform one act of kindness without seeking recognition.",
            },
            "matsarya": {
                "label": "envy",
                "title": f"Day {day_index}: Transforming Envy into Joy",
                "teaching": (
                    "Envy (matsarya) arises from comparison and the belief that another's gain is "
                    "our loss. The Gita teaches that each soul has its own dharma, its own path. "
                    "Mudita - sympathetic joy - is the antidote to envy. When we celebrate others' "
                    "success, we expand our capacity for happiness. Their joy becomes our joy. "
                    "Today we practice replacing comparison with celebration."
                ),
                "reflections": [
                    "Who do you find yourself comparing yourself to most often?",
                    "What do their achievements trigger in you?",
                    "How might celebrating their success feel in your body?",
                ],
                "practice": {
                    "name": "Mudita Practice",
                    "instructions": [
                        "Bring to mind someone whose success triggers envy",
                        "Mentally offer them sincere congratulations",
                        "Say: 'May your happiness increase'",
                        "Notice any resistance and breathe through it",
                        "Feel your heart expanding to include their joy",
                    ],
                    "duration_minutes": 10,
                },
                "commitment": "Today I will genuinely celebrate someone else's success as if it were my own.",
            },
        }

        # Get content for this enemy or use general fallback
        content = enemy_content.get(enemy_focus, {
            "label": "inner challenges",
            "title": f"Day {day_index}: Walking the Path",
            "teaching": (
                "The Gita reminds us that transformation is a gradual process requiring patience, "
                "practice, and self-compassion. Each step on this path, no matter how small, moves "
                "us closer to our true nature. Today we honor wherever we are in the journey, "
                "trusting that awareness itself is the beginning of change."
            ),
            "reflections": [
                "What inner challenge has been most present for you lately?",
                "What would freedom from this challenge feel like?",
                "What support do you need on this journey?",
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
            "commitment": "Today I will bring gentle awareness to my inner state.",
        })

        return {
            "step_title": content["title"],
            "today_focus": enemy_focus,
            "verse_refs": verse_refs,
            "teaching": content["teaching"],
            "guided_reflection": content["reflections"],
            "practice": content["practice"],
            "micro_commitment": content["commitment"],
            "check_in_prompt": {
                "scale": "0-10",
                "label": f"How present is {content['label']} in your experience today?",
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

        # Collect all verse refs first for bulk fetch (FIX N+1 query)
        all_verse_refs: list[VerseReference] = []
        step_states_map: dict[str, tuple[UserJourney, UserJourneyStepState, int]] = {}

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

            step_states_map[journey.id] = (journey, step_state, current_day)

            # Collect verse refs for bulk fetch
            if include_verse_text and step_state.verse_refs:
                all_verse_refs.extend(step_state.verse_refs)

        # PERFORMANCE FIX: Single bulk query for all verses across all journeys
        verse_texts_map: dict[str, dict[str, Any]] = {}
        if include_verse_text and all_verse_refs:
            verse_texts_map = await self._adapter.get_verses_bulk(db, all_verse_refs)

        # Build responses using cached verse data
        for journey_id, (journey, step_state, current_day) in step_states_map.items():
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

            # Resolve verse texts from bulk-fetched data
            if include_verse_text and step_state.verse_refs:
                verse_texts: list[dict[str, Any]] = []
                for ref in step_state.verse_refs:
                    cache_key = f"{ref['chapter']}:{ref['verse']}"
                    text = verse_texts_map.get(cache_key)
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

        IDEMPOTENCY: If user already has an active journey from the same template,
        returns the existing journey instead of creating a duplicate.

        Args:
            db: Database session
            user_id: User ID
            journey_template_ids: List of template IDs to start
            personalization: Optional personalization settings

        Returns:
            List of created/existing UserJourney instances
        """
        journeys: list[UserJourney] = []

        # IDEMPOTENCY FIX: Check for existing active journeys for these templates
        existing_result = await db.execute(
            select(UserJourney).where(
                and_(
                    UserJourney.user_id == user_id,
                    UserJourney.journey_template_id.in_(journey_template_ids),
                    UserJourney.status == UserJourneyStatus.ACTIVE,
                )
            )
        )
        existing_journeys = {j.journey_template_id: j for j in existing_result.scalars().all()}

        for template_id in journey_template_ids:
            # Check for existing active journey (idempotency)
            if template_id in existing_journeys:
                existing = existing_journeys[template_id]
                logger.info(
                    f"User {user_id} already has active journey {existing.id} "
                    f"for template {template_id} - returning existing"
                )
                journeys.append(existing)
                continue

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

        # Build response with correct progress calculation
        journey_data = []
        for j in journeys:
            total_days = j.template.duration_days if j.template else 14

            # FIX: Calculate progress based on COMPLETED steps, not current day index
            # This gives accurate progress even if user skips days
            completed_steps_result = await db.execute(
                select(func.count(UserJourneyStepState.id))
                .where(
                    and_(
                        UserJourneyStepState.user_journey_id == j.id,
                        UserJourneyStepState.completed_at.isnot(None),
                    )
                )
            )
            completed_steps = completed_steps_result.scalar() or 0
            progress_percentage = int((completed_steps / total_days) * 100) if total_days > 0 else 0

            journey_data.append({
                "id": j.id,
                "template_id": j.journey_template_id,
                "template_title": j.template.title if j.template else "Journey",
                "template_slug": j.template.slug if j.template else None,
                "status": j.status.value,
                "current_day_index": j.current_day_index,
                "total_days": total_days,
                "progress_percentage": min(progress_percentage, 100),  # Cap at 100%
                "completed_steps": completed_steps,
                "started_at": j.started_at.isoformat(),
                "personalization": j.personalization,
            })

        return journey_data

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

        Uses SELECT FOR UPDATE to prevent race conditions when two
        requests try to complete the same step simultaneously.

        Args:
            db: Database session
            user_journey_id: Journey ID
            day_index: Day index being completed
            check_in: Optional check-in data {"intensity": 0-10, "label": "..."}
            reflection_response: Optional reflection text

        Returns:
            Updated step state

        Raises:
            ValueError: If journey or step not found, or step already completed
        """
        # Get journey with FOR UPDATE lock to prevent race conditions
        result = await db.execute(
            select(UserJourney)
            .where(UserJourney.id == user_journey_id)
            .with_for_update()
        )
        journey = result.scalar_one_or_none()
        if not journey:
            raise ValueError(f"Journey {user_journey_id} not found")

        # Get step state with FOR UPDATE lock
        result = await db.execute(
            select(UserJourneyStepState)
            .where(
                and_(
                    UserJourneyStepState.user_journey_id == user_journey_id,
                    UserJourneyStepState.day_index == day_index,
                )
            )
            .with_for_update()
        )
        step_state = result.scalar_one_or_none()

        if not step_state:
            raise ValueError(f"Step {day_index} not found for journey {user_journey_id}")

        # Check if already completed (idempotency check)
        if step_state.completed_at is not None:
            logger.info(f"Step {day_index} already completed for journey {user_journey_id}")
            return {
                "step_state_id": step_state.id,
                "day_index": day_index,
                "completed": True,
                "check_in": step_state.check_in,
                "journey_completed": journey.status == UserJourneyStatus.COMPLETED,
                "already_completed": True,
            }

        # Update step state
        step_state.completed_at = datetime.datetime.now(datetime.UTC)

        if check_in:
            step_state.check_in = {
                **check_in,
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            }

        if reflection_response:
            # SECURITY FIX: Encrypt reflection before storing
            encryption = get_reflection_encryption()
            encrypted_content = encryption.encrypt(reflection_response)

            step_state.reflection_encrypted = {
                "content": encrypted_content,
                "encrypted": encryption.is_available,
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
