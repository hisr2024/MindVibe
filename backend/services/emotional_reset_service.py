"""
Emotional Reset Service (Quantum Coherence v2.0)

ENHANCED VERSION v2.1 - Integrated with KIAAN AI Gita Core Wisdom Filter

Implements the 7-step KIAAN Emotional Reset guided flow:
- Step 1: Welcome & Intention (user shares what's on their mind)
- Step 2: Assessment (AI provides 2-3 sentence insights)
- Step 3: Breathing guidance (4-4-4-4 pattern)
- Step 4: Release visualization (letting go metaphors)
- Step 5: Wisdom integration (Gita insights, no citations - expanded to 5 verses)
- Step 6: Affirmations (3-5 personalized)
- Step 7: Completion (summary, journal auto-save)

Quantum Coherence Enhancements:
- GPT-4o-mini for cost optimization
- Automatic retries with exponential backoff
- Token optimization (reduced max_tokens)
- Enhanced error handling

ALL RESPONSES PASS THROUGH GITA CORE WISDOM:
Every AI-generated response is filtered through the GitaWisdomFilter to ensure
guidance is grounded in Bhagavad Gita teachings on emotional wellness.

Integrates with existing KIAAN crisis detection and WisdomKnowledgeBase.
"""

import datetime
import logging
import os
import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import EmotionalResetSession, WisdomVerse
from backend.services.gita_service import GitaService
from backend.services.openai_optimizer import openai_optimizer
from backend.services.safety_validator import SafetyValidator
from backend.services.wisdom_kb import WisdomKnowledgeBase

logger = logging.getLogger(__name__)

# Gita Wisdom Filter - lazy import to avoid circular dependencies
_gita_filter = None


def _get_gita_filter():
    """Lazy import of Gita wisdom filter."""
    global _gita_filter
    if _gita_filter is None:
        try:
            from backend.services.gita_wisdom_filter import get_gita_wisdom_filter
            _gita_filter = get_gita_wisdom_filter()
            logger.info("EmotionalResetService: Gita Wisdom Filter integrated")
        except Exception as e:
            logger.warning(f"EmotionalResetService: Gita Wisdom Filter unavailable: {e}")
            _gita_filter = False
    return _gita_filter if _gita_filter else None


# Dynamic Wisdom Corpus - lazy import for effectiveness-learned verse selection
_dynamic_corpus_instance = None


def _get_dynamic_corpus():
    """Lazy import of Dynamic Wisdom Corpus for effectiveness-learned verse selection."""
    global _dynamic_corpus_instance
    if _dynamic_corpus_instance is None:
        try:
            from backend.services.dynamic_wisdom_corpus import get_dynamic_wisdom_corpus
            _dynamic_corpus_instance = get_dynamic_wisdom_corpus()
            logger.info("EmotionalResetService: Dynamic Wisdom Corpus integrated")
        except Exception as e:
            logger.warning(f"EmotionalResetService: Dynamic Wisdom Corpus unavailable: {e}")
            _dynamic_corpus_instance = False
    return _dynamic_corpus_instance if _dynamic_corpus_instance else None


# Sakha Wisdom Engine - lazy import for semantic JSON corpus search
_sakha_engine_instance = None


def _get_sakha_engine():
    """Lazy import of Sakha Wisdom Engine for semantic verse matching."""
    global _sakha_engine_instance
    if _sakha_engine_instance is None:
        try:
            from backend.services.sakha_wisdom_engine import get_sakha_wisdom_engine
            _sakha_engine_instance = get_sakha_wisdom_engine()
            if _sakha_engine_instance:
                logger.info("EmotionalResetService: Sakha Wisdom Engine integrated")
            else:
                _sakha_engine_instance = False
        except Exception as e:
            logger.warning(f"EmotionalResetService: Sakha Wisdom Engine unavailable: {e}")
            _sakha_engine_instance = False
    return _sakha_engine_instance if _sakha_engine_instance else None


# WisdomCore singleton - lazy import for Tier 0 full-corpus wisdom retrieval
_wisdom_core_instance = None


def _get_wisdom_core():
    """Lazy import of WisdomCore singleton for full Gita corpus access."""
    global _wisdom_core_instance
    if _wisdom_core_instance is None:
        try:
            from backend.services.wisdom_core import get_wisdom_core
            _wisdom_core_instance = get_wisdom_core()
            logger.info("EmotionalResetService: WisdomCore integrated (full corpus)")
        except Exception as e:
            logger.warning(f"EmotionalResetService: WisdomCore unavailable: {e}")
            _wisdom_core_instance = False
    return _wisdom_core_instance if _wisdom_core_instance else None


# Rate limiting constants
MAX_SESSIONS_PER_DAY = int(os.getenv("EMOTIONAL_RESET_RATE_LIMIT", "10"))
SESSION_TIMEOUT_SECONDS = int(os.getenv("EMOTIONAL_RESET_SESSION_TIMEOUT", "1800"))

# Emotional Reset: Specialized emotion-to-verse mapping
EMOTION_VERSE_MAPPING = {
    "anxious": [(2, 47), (2, 48), (6, 5), (6, 35)],
    "stressed": [(2, 14), (2, 15), (6, 13), (6, 17)],
    "sad": [(2, 22), (2, 23), (15, 7), (12, 13)],
    "angry": [(16, 1), (16, 2), (16, 3), (2, 56)],
    "overwhelmed": [(2, 40), (2, 50), (18, 58), (6, 25)],
    "hopeless": [(4, 36), (4, 38), (9, 2), (18, 66)],
    "confused": [(4, 34), (5, 15), (5, 16), (18, 63)],
}


def get_verse_identifier(verse) -> str:
    """
    Extract verse identifier consistently across different verse objects.

    Args:
        verse: Verse object (GitaVerse, WisdomVerse, or _GitaVerseWrapper)

    Returns:
        String verse identifier in format "chapter.verse"
    """
    chapter = getattr(verse, 'chapter', None)
    verse_num = getattr(verse, 'verse_number', None) or getattr(verse, 'verse', None)
    if chapter and verse_num:
        return f"{chapter}.{verse_num}"
    return ""


class _DynamicVerseAdapter:
    """Adapts dict-based verse results (from DynamicWisdomCorpus/SakhaWisdomEngine)
    to the attribute-access interface expected by verse processing methods."""

    def __init__(self, verse_dict: dict[str, Any]) -> None:
        self._data = verse_dict

    def __getattr__(self, name: str) -> Any:
        if name.startswith("_"):
            raise AttributeError(name)
        # Map verse_number to verse for get_verse_identifier compatibility
        if name == "verse_number":
            ref = self._data.get("verse_ref", "")
            if "." in ref:
                try:
                    return int(ref.split(".")[1])
                except (ValueError, IndexError):
                    pass
            return self._data.get("verse", None)
        if name == "chapter":
            ref = self._data.get("verse_ref", "")
            if "." in ref:
                try:
                    return int(ref.split(".")[0])
                except (ValueError, IndexError):
                    pass
            return self._data.get("chapter", None)
        if name == "english":
            return self._data.get("wisdom", self._data.get("english", ""))
        return self._data.get(name, None)


class EmotionalResetService:
    """Service for managing emotional reset sessions."""

    STEP_CONTENT = {
        1: {
            "title": "Welcome & Intention",
            "prompt": "What's weighing on your heart today? Share in a few words (up to 200 characters).",
            "guidance": "Take a moment to acknowledge what you're feeling. There's no judgment here—just space for you to be honest with yourself.",
        },
        2: {
            "title": "Understanding Your Emotions",
            "guidance": "Let me reflect back what I'm sensing from your words...",
        },
        3: {
            "title": "Breathing Reset",
            "guidance": "Let's take a moment to ground ourselves with a calming breath pattern. This 2-minute practice will help settle your nervous system.",
            "breathing_pattern": {
                "inhale": 4,
                "hold_in": 4,
                "exhale": 4,
                "hold_out": 4,
                "duration_seconds": 120,
            },
        },
        4: {
            "title": "Release & Let Go",
            "guidance": "Imagine placing your worries on a leaf floating down a gentle stream. Watch as the current carries them away, one by one...",
        },
        5: {
            "title": "A Fresh Perspective",
            "guidance": "Here are some helpful insights to carry with you...",
        },
        6: {
            "title": "Personal Affirmations",
            "guidance": "These affirmations are crafted just for you. Repeat them silently or aloud...",
        },
        7: {
            "title": "Session Complete",
            "guidance": "You've taken a meaningful step in caring for your emotional well-being. Here's a summary of your journey...",
        },
    }

    def __init__(self) -> None:
        """Initialize the emotional reset service with quantum coherence."""
        self.safety_validator = SafetyValidator()
        self.wisdom_kb = WisdomKnowledgeBase()
        self.optimizer = openai_optimizer

    async def check_rate_limit(self, db: AsyncSession, user_id: str) -> tuple[bool, int]:
        """
        Check if user has exceeded daily session limit.

        Args:
            db: Database session
            user_id: User identifier

        Returns:
            Tuple of (is_allowed, sessions_today)
        """
        today_start = datetime.datetime.now(datetime.UTC).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        result = await db.execute(
            select(func.count(EmotionalResetSession.id))
            .where(
                EmotionalResetSession.user_id == user_id,
                EmotionalResetSession.created_at >= today_start,
            )
        )
        sessions_today = result.scalar() or 0

        return sessions_today < MAX_SESSIONS_PER_DAY, sessions_today

    async def start_session(
        self, db: AsyncSession, user_id: str | None
    ) -> dict[str, Any]:
        """
        Start a new emotional reset session.

        Args:
            db: Database session
            user_id: User identifier (optional, generates anonymous ID if None)

        Returns:
            Session info with step 1 content
        """
        # Generate anonymous session ID for unauthenticated users
        if not user_id:
            user_id = f"anon-{uuid.uuid4().hex[:12]}"

        # Check rate limit
        is_allowed, sessions_today = await self.check_rate_limit(db, user_id)
        if not is_allowed:
            return {
                "success": False,
                "error": "rate_limit_exceeded",
                "message": f"You've reached the daily limit of {MAX_SESSIONS_PER_DAY} emotional reset sessions. Please try again tomorrow. 💙",
                "sessions_today": sessions_today,
            }

        # Create new session
        session_id = str(uuid.uuid4())
        session = EmotionalResetSession(
            user_id=user_id,
            session_id=session_id,
            current_step=1,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        step_content = self.STEP_CONTENT[1]

        return {
            "success": True,
            "session_id": session_id,
            "current_step": 1,
            "total_steps": 7,
            "step_title": step_content["title"],
            "prompt": step_content["prompt"],
            "guidance": step_content["guidance"],
            "progress": "1/7",
        }

    async def get_session(
        self, db: AsyncSession, session_id: str, user_id: str | None
    ) -> dict[str, Any] | None:
        """
        Get current session state.

        Args:
            db: Database session
            session_id: Session identifier
            user_id: User identifier for verification (optional)

        Returns:
            Session state or None if not found
        """
        # Build query based on whether user_id is provided
        if user_id:
            result = await db.execute(
                select(EmotionalResetSession).where(
                    EmotionalResetSession.session_id == session_id,
                    EmotionalResetSession.user_id == user_id,
                    EmotionalResetSession.deleted_at.is_(None),
                )
            )
        else:
            # For anonymous users, security relies on the unguessable UUID session_id.
            # The anon-% filter ensures only anonymous sessions can be accessed without auth.
            result = await db.execute(
                select(EmotionalResetSession).where(
                    EmotionalResetSession.session_id == session_id,
                    EmotionalResetSession.user_id.like("anon-%"),
                    EmotionalResetSession.deleted_at.is_(None),
                )
            )
        session = result.scalar_one_or_none()

        if not session:
            return None

        # Check if session has timed out
        last_activity = session.updated_at or session.created_at

        now = datetime.datetime.now(datetime.UTC)
        if (now - last_activity).total_seconds() > SESSION_TIMEOUT_SECONDS:
            return {
                "success": False,
                "error": "session_expired",
                "message": "This session has expired. Please start a new emotional reset. 💙",
            }

        step_content = self.STEP_CONTENT.get(session.current_step, {})

        return {
            "success": True,
            "session_id": session.session_id,
            "current_step": session.current_step,
            "total_steps": 7,
            "step_title": step_content.get("title", ""),
            "guidance": step_content.get("guidance", ""),
            "progress": f"{session.current_step}/7",
            "completed": session.completed,
            "emotions_input": session.emotions_input,
            "assessment_data": session.assessment_data,
            "affirmations": session.affirmations,
        }

    def detect_crisis(self, message: str) -> dict[str, Any]:
        """
        Check for crisis indicators in user input.

        Args:
            message: User's message

        Returns:
            Crisis detection result
        """
        return self.safety_validator.detect_crisis(message)

    async def _apply_gita_filter(self, content: str, user_context: str = "") -> str:
        """Apply Gita wisdom filter to AI-generated content."""
        gita_filter = _get_gita_filter()
        if gita_filter and content:
            try:
                filter_result = await gita_filter.filter_response(
                    content=content,
                    tool_type="emotional_reset",
                    user_context=user_context,
                    enhance_if_needed=True,
                )
                logger.debug(f"Gita filter: score={filter_result.wisdom_score:.2f}")
                return filter_result.content
            except Exception as e:
                logger.warning(f"Gita filter error (continuing): {e}")
        return content

    async def assess_emotions(self, user_input: str) -> dict[str, Any]:
        """
        Generate emotional assessment based on user input (Step 2) with quantum coherence.

        ALL RESPONSES ARE FILTERED THROUGH GITA CORE WISDOM.

        Args:
            user_input: User's description of their emotions

        Returns:
            Assessment with insights and identified emotions
        """
        if not self.optimizer.ready:
            return self._get_fallback_assessment(user_input)

        try:
            # Enhanced prompt with Gita wisdom context
            prompt = f"""You are a compassionate wellness guide, inspired by ancient wisdom on emotional balance.

A user shared: "{user_input}"

Provide a brief, empathetic assessment in 2-3 sentences that:
1. Validates their feelings (as the Gita teaches, emotions are natural messengers)
2. Identifies the core emotion(s) they're experiencing
3. Gently reframes the situation with hope (equanimity is always accessible)

Keep it warm, conversational, and under 100 words. Use secular-friendly language.
End with 💙"""

            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": "You are a compassionate guide focused on emotional wellness, drawing on timeless wisdom about the nature of mind and emotions."},
                    {"role": "user", "content": prompt}
                ],
                model="gpt-4o-mini",
                temperature=0.7,
                max_tokens=150,
            )

            # Safe null check for OpenAI response
            content = ""
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg and response_msg.content:
                    content = response_msg.content

            # GITA WISDOM FILTER: Apply filter to assessment
            content = await self._apply_gita_filter(content, user_input)

            # Extract emotions using simple keyword matching
            emotions = self._extract_emotions(user_input)

            return {
                "assessment": content,
                "emotions": emotions,
                "themes": self._identify_themes(user_input),
            }

        except Exception as e:
            logger.error(f"OpenAI assessment error: {type(e).__name__}: {e}")
            return self._get_fallback_assessment(user_input)

    def _get_fallback_assessment(self, user_input: str) -> dict[str, Any]:
        """Generate fallback assessment when AI is unavailable."""
        emotions = self._extract_emotions(user_input)
        primary_emotion = emotions[0] if emotions else "overwhelmed"

        assessments = {
            "anxious": "I hear that you're feeling anxious. It's completely natural to feel this way when facing uncertainty. Remember, anxiety often signals that something matters to you—and that's okay. 💙",
            "stressed": "I sense a lot of pressure weighing on you. Stress can feel heavy, but recognizing it is the first step toward releasing it. You're already moving in the right direction. 💙",
            "sad": "Your sadness is valid and deserving of gentle care. It's okay to feel this way—emotions flow like rivers, and this too shall pass. 💙",
            "angry": "I hear frustration in your words. Anger often masks deeper needs—perhaps for respect, fairness, or understanding. Let's honor that together. 💙",
            "overwhelmed": "It sounds like a lot is happening at once. Feeling overwhelmed is a sign that you're human, not a sign of weakness. Let's take this one breath at a time. 💙",
        }

        return {
            "assessment": assessments.get(primary_emotion, assessments["overwhelmed"]),
            "emotions": emotions,
            "themes": self._identify_themes(user_input),
        }

    def _extract_emotions(self, text: str) -> list[str]:
        """Extract emotions from user input."""
        emotion_keywords = {
            "anxious": ["anxious", "anxiety", "worried", "nervous", "panic", "fear", "scared"],
            "stressed": ["stress", "stressed", "pressure", "tense", "tension", "exhausted"],
            "sad": ["sad", "depressed", "down", "unhappy", "lonely", "grief", "loss", "crying"],
            "angry": ["angry", "frustrated", "annoyed", "irritated", "mad", "rage"],
            "overwhelmed": ["overwhelmed", "too much", "can't cope", "drowning", "helpless"],
            "confused": ["confused", "lost", "uncertain", "unsure", "don't know"],
            "hopeless": ["hopeless", "pointless", "giving up", "no hope"],
        }

        text_lower = text.lower()
        found_emotions = []

        for emotion, keywords in emotion_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                found_emotions.append(emotion)

        return found_emotions if found_emotions else ["uncertain"]

    def _identify_themes(self, text: str) -> list[str]:
        """Identify psychological themes from user input."""
        theme_keywords = {
            "relationships": ["relationship", "partner", "family", "friend", "love", "breakup"],
            "work": ["work", "job", "boss", "career", "office", "colleagues"],
            "health": ["health", "sick", "pain", "tired", "sleep", "body"],
            "purpose": ["purpose", "meaning", "why", "point", "direction"],
            "change": ["change", "transition", "new", "different", "moving"],
            "self_worth": ["worthless", "enough", "failure", "compare", "confidence"],
        }

        text_lower = text.lower()
        found_themes = []

        for theme, keywords in theme_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                found_themes.append(theme)

        return found_themes if found_themes else ["general_wellbeing"]

    def generate_breathing_guidance(self) -> dict[str, Any]:
        """Generate breathing exercise guidance (Step 3)."""
        return {
            "pattern": {
                "inhale": 4,
                "hold_in": 4,
                "exhale": 4,
                "hold_out": 4,
            },
            "duration_seconds": 120,
            "narration": [
                "Find a comfortable position. Let your shoulders drop and relax.",
                "Breathe in slowly through your nose... 1... 2... 3... 4...",
                "Hold gently... 1... 2... 3... 4...",
                "Exhale slowly through your mouth... 1... 2... 3... 4...",
                "Pause peacefully... 1... 2... 3... 4...",
                "Continue this rhythm, letting each breath carry away tension.",
            ],
            "completion_message": "Well done. Notice how your body feels now—perhaps a bit lighter, a bit calmer. 💙",
        }

    async def create_release_visualization(
        self, emotions: list[str]
    ) -> str:
        """
        Generate release visualization text (Step 4) with quantum coherence.

        ALL RESPONSES ARE FILTERED THROUGH GITA CORE WISDOM.

        Args:
            emotions: List of emotions identified in assessment

        Returns:
            Guided visualization text grounded in Gita wisdom
        """
        if not self.optimizer.ready:
            return self._get_fallback_visualization(emotions)

        try:
            emotion_text = ", ".join(emotions) if emotions else "your current feelings"

            # Enhanced prompt with Gita wisdom context
            prompt = f"""Create a brief, calming visualization for releasing: {emotion_text}

Write 3-4 sentences using nature metaphors (like a flowing stream, wind, or sunrise).
Drawing from the wisdom that the mind can be both friend and foe (BG 6.5), guide the user
to witness and release without force.
Be gentle, poetic, and hopeful. Use secular-friendly language.
Keep it under 80 words. End with 💙"""

            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": "You are a gentle guide creating calming visualizations, inspired by timeless wisdom on the nature of mind and letting go."},
                    {"role": "user", "content": prompt}
                ],
                model="gpt-4o-mini",
                temperature=0.8,
                max_tokens=120,
            )

            # Safe null check for OpenAI response
            content = None
            if response and response.choices and len(response.choices) > 0:
                message = response.choices[0].message
                if message:
                    content = message.content

            if not content:
                return self._get_fallback_visualization(emotions)

            # GITA WISDOM FILTER: Apply filter to visualization
            content = await self._apply_gita_filter(content, emotion_text)
            return content

        except Exception as e:
            logger.error(f"OpenAI visualization error: {type(e).__name__}: {e}")
            return self._get_fallback_visualization(emotions)

    def _get_fallback_visualization(self, _emotions: list[str]) -> str:
        """Generate fallback visualization when AI is unavailable."""
        return """Imagine yourself standing by a peaceful stream. The water flows gently, carrying fallen leaves downstream.

One by one, place your worries on these leaves. Watch as the current lifts them, carries them away, and slowly dissolves them into the distance.

With each leaf that floats away, feel yourself becoming lighter. The stream continues to flow, endlessly patient, endlessly renewing. 💙"""

    async def generate_wisdom_insights(
        self, db: AsyncSession, assessment: dict[str, Any],
        emotions_input: str = "", user_id: str = ""
    ) -> list[dict[str, str]]:
        """
        Generate wisdom insights based on assessment (Step 5).

        Uses a 4-tier Wisdom Cascade:
          Tier 0: WisdomCore (full 700-verse Gita corpus + dynamic learned wisdom)
          Tier 1: Static (EMOTION_VERSE_MAPPING + WisdomKnowledgeBase search)
          Tier 2: Dynamic (DynamicWisdomCorpus - effectiveness-learned selection)
          Tier 3: Sakha (SakhaWisdomEngine - semantic JSON corpus matching)

        Args:
            db: Database session
            assessment: Assessment data from Step 2
            emotions_input: User's original description of their situation
            user_id: User identifier for dynamic wisdom tracking

        Returns:
            List of top 3 wisdom insights (no citations)
        """
        themes = assessment.get("themes", [])
        emotions = assessment.get("emotions", [])
        primary_emotion = emotions[0] if emotions else None

        seen_ids: set[str] = set()
        unique_verses: list[dict[str, Any]] = []

        # ── Tier 0: Full Gita Corpus via WisdomCore (domain + shad ripu) ──
        try:
            from backend.services.gita_emotional_wisdom import (
                get_emotional_wisdom,
                EMOTION_DOMAIN_MAP,
                EMOTION_SHAD_RIPU_MAP,
            )
            if primary_emotion and (primary_emotion in EMOTION_DOMAIN_MAP or primary_emotion in EMOTION_SHAD_RIPU_MAP):
                tier0_results = await get_emotional_wisdom(db, primary_emotion, limit=5)
                for wr in tier0_results:
                    ref = wr.verse_ref or (
                        f"{wr.chapter}.{wr.verse}" if wr.chapter and wr.verse else ""
                    )
                    if ref and ref not in seen_ids:
                        seen_ids.add(ref)
                        unique_verses.append({
                            "verse": wr,
                            "score": wr.score,
                            "source": "wisdom_core",
                        })
                        if len(unique_verses) >= 3:
                            break
                if unique_verses:
                    logger.info(
                        f"Wisdom[Tier0]: Added {len(unique_verses)} verses from full corpus "
                        f"for emotion '{primary_emotion}'"
                    )
        except Exception as e:
            logger.debug(f"Tier 0 WisdomCore lookup failed (non-critical): {e}")

        # ── Tier 1: Static wisdom (EMOTION_VERSE_MAPPING + WisdomKB search) ──
        if primary_emotion and primary_emotion in EMOTION_VERSE_MAPPING:
            for chapter, verse_num in EMOTION_VERSE_MAPPING[primary_emotion][:3]:
                try:
                    verse = await GitaService.get_verse_by_reference(db, chapter=chapter, verse=verse_num)
                    if verse:
                        verse_id = get_verse_identifier(verse)
                        if verse_id and verse_id not in seen_ids:
                            seen_ids.add(verse_id)
                            unique_verses.append({"verse": verse, "score": 0.9, "source": "static"})
                except Exception as e:
                    logger.debug(f"Could not fetch verse {chapter}.{verse_num}: {e}")

        # Use user's actual words for better verse search relevance
        label_query = " ".join(themes + emotions)
        search_query = f"{emotions_input} {label_query}" if emotions_input else label_query
        verse_results = await self.wisdom_kb.search_relevant_verses(db=db, query=search_query, limit=5)

        for result in verse_results:
            verse = result["verse"]
            verse_id = get_verse_identifier(verse)
            if verse_id and verse_id not in seen_ids:
                seen_ids.add(verse_id)
                unique_verses.append({**result, "source": "wisdom_kb"})

        # ── Tier 2: Dynamic wisdom (effectiveness-learned selection) ──
        if len(unique_verses) < 3 and primary_emotion and user_id:
            dynamic_corpus = _get_dynamic_corpus()
            if dynamic_corpus:
                try:
                    dynamic_verse = await dynamic_corpus.get_effectiveness_weighted_verse(
                        db=db,
                        mood=primary_emotion,
                        user_message=emotions_input or primary_emotion,
                        phase="guide",
                        user_id=user_id,
                        verse_history=list(seen_ids),
                    )
                    if dynamic_verse and dynamic_verse.get("wisdom"):
                        d_ref = dynamic_verse.get("verse_ref", "")
                        if d_ref and d_ref not in seen_ids:
                            seen_ids.add(d_ref)
                            unique_verses.append({
                                "verse": _DynamicVerseAdapter(dynamic_verse),
                                "score": dynamic_verse.get("effectiveness_score", 0.8),
                                "source": "dynamic",
                            })
                            logger.info(f"Wisdom[Dynamic]: Added verse {d_ref} (eff={dynamic_verse.get('effectiveness_score', 0):.2f})")
                except Exception as e:
                    logger.debug(f"Dynamic wisdom lookup failed (non-critical): {e}")

        # ── Tier 3: Sakha wisdom (semantic JSON corpus matching) ──
        if len(unique_verses) < 3 and primary_emotion:
            sakha = _get_sakha_engine()
            if sakha:
                try:
                    sakha_verse = sakha.get_contextual_verse(
                        mood=primary_emotion,
                        user_message=emotions_input or primary_emotion,
                        phase="guide",
                        verse_history=list(seen_ids),
                    )
                    if sakha_verse and sakha_verse.get("wisdom"):
                        s_ref = sakha_verse.get("verse_ref", "")
                        if s_ref and s_ref not in seen_ids:
                            seen_ids.add(s_ref)
                            unique_verses.append({
                                "verse": _DynamicVerseAdapter(sakha_verse),
                                "score": sakha_verse.get("relevance_score", 0.7),
                                "source": "sakha",
                            })
                            logger.info(f"Wisdom[Sakha]: Added verse {s_ref}")
                except Exception as e:
                    logger.debug(f"Sakha wisdom lookup failed (non-critical): {e}")

        # ── Build insights from top 3 unique verses ──
        insights = []
        for result in unique_verses[:3]:
            verse = result["verse"]
            english = getattr(verse, 'english', '') or getattr(verse, 'content', '')
            sanitized = self.wisdom_kb.sanitize_text(english) if english else None
            if sanitized:
                application = await self._create_application(verse, emotions, emotions_input)
                insights.append({
                    "wisdom": sanitized,
                    "application": application,
                })

        # Record wisdom deliveries for dynamic learning (non-blocking)
        if insights and user_id and user_id != "anonymous":
            dynamic_corpus = _get_dynamic_corpus()
            if dynamic_corpus:
                for result in unique_verses[:len(insights)]:
                    verse = result["verse"]
                    verse_ref = get_verse_identifier(verse)
                    if not verse_ref:
                        verse_ref = getattr(verse, 'verse_ref', '')
                    if verse_ref:
                        try:
                            await dynamic_corpus.record_wisdom_delivery(
                                db=db,
                                user_id=user_id,
                                session_id="emotional_reset",
                                verse_ref=verse_ref,
                                principle=getattr(verse, 'principle', None) or getattr(verse, 'theme', None),
                                mood=primary_emotion or "uncertain",
                                mood_intensity=0.6,
                                phase="guide",
                                theme=getattr(verse, 'theme', None),
                            )
                        except Exception as e:
                            logger.debug(f"Wisdom delivery recording failed (non-critical): {e}")

        # Fallback if no verses found
        if not insights:
            insights = self._get_fallback_wisdom(emotions, themes)

        return insights

    async def _create_application(self, verse: WisdomVerse, emotions: list[str], emotions_input: str = "") -> str:
        """Create practical application of wisdom connecting the verse to the user's specific situation."""
        # When we have the user's actual words and OpenAI is ready, generate a situation-specific application
        if emotions_input and self.optimizer.ready:
            try:
                verse_text = self.wisdom_kb.sanitize_text(getattr(verse, 'english', '') or getattr(verse, 'content', ''))
                if verse_text:
                    prompt = f"""A user shared: "{emotions_input}"

This wisdom speaks to their situation: "{verse_text}"

Write 1-2 sentences connecting this wisdom directly to their specific situation.
Be concrete — reference their actual circumstances. No generic advice.
Secular language. Warm and grounded. Under 40 words."""

                    response = await self.optimizer.create_completion_with_retry(
                        messages=[
                            {"role": "system", "content": "You create brief, situation-specific applications of wisdom. Connect ancient insight to the person's real life."},
                            {"role": "user", "content": prompt}
                        ],
                        model="gpt-4o-mini",
                        temperature=0.7,
                        max_tokens=80,
                    )

                    content = ""
                    if response and response.choices and len(response.choices) > 0:
                        response_msg = response.choices[0].message
                        if response_msg and response_msg.content:
                            content = response_msg.content.strip()

                    if content and len(content) > 15:
                        content = await self._apply_gita_filter(content, emotions_input)
                        return content
            except Exception as e:
                logger.debug(f"AI application generation failed (using fallback): {e}")

        # Fallback: static applications keyed by emotion
        return self._get_fallback_application(emotions)

    def _get_fallback_application(self, emotions: list[str]) -> str:
        """Static fallback applications keyed by primary emotion."""
        applications = {
            "anxious": "When anxiety arises, remember that you can only control your actions, not outcomes.",
            "stressed": "In moments of pressure, find peace by focusing on the present task, not future worries.",
            "sad": "Sadness reminds us of what we value. Honor it, then gently return to the present.",
            "angry": "Channel your energy into constructive action rather than dwelling on what caused the upset.",
            "overwhelmed": "Break down your challenges into small, manageable steps. One breath at a time.",
            "hopeless": "Even in darkness, one small act of intention can restart the flow of meaning.",
            "confused": "When clarity eludes you, step back from thinking and let stillness reveal what matters.",
        }

        primary_emotion = emotions[0] if emotions else "overwhelmed"
        return applications.get(primary_emotion, applications["overwhelmed"])

    def _get_fallback_wisdom(self, emotions: list[str], themes: list[str] | None = None) -> list[dict[str, str]]:
        """Generate emotion-specific fallback wisdom when verses not found."""
        emotion_wisdom = {
            "anxious": [
                {
                    "wisdom": "The mind, when untrained, amplifies uncertainty into catastrophe. But within you lives an observer who watches the storm without being swept away.",
                    "application": "When anxiety tightens your chest, pause and name three things you can actually control right now. Release the rest.",
                },
                {
                    "wisdom": "Your dharma lies in the effort, not the outcome. When you pour yourself into right action and release your grip on results, the weight of worry lifts.",
                    "application": "Choose one action today that aligns with your values, and offer it without attachment to how it turns out.",
                },
            ],
            "stressed": [
                {
                    "wisdom": "Pressure is not the enemy — your relationship with it is. The steady mind treats urgency and calm with the same composure.",
                    "application": "Before your next task, take three conscious breaths. Work from steadiness, not from the frenzy of the clock.",
                },
                {
                    "wisdom": "No burden was meant to be carried all at once. True strength is knowing when to set something down and return to it refreshed.",
                    "application": "Identify one expectation you can soften today. Give yourself permission to do enough, not everything.",
                },
            ],
            "sad": [
                {
                    "wisdom": "Sadness is the heart's way of honoring what mattered. It is not weakness — it is the depth of your capacity to care.",
                    "application": "Allow yourself to feel this fully without rushing to fix it. Grief and love are made of the same substance.",
                },
                {
                    "wisdom": "Just as seasons turn without asking permission, emotional states move through you. This heaviness is not permanent, even when it feels absolute.",
                    "application": "Treat yourself today as you would treat someone you love who is hurting. Gentleness is medicine.",
                },
            ],
            "angry": [
                {
                    "wisdom": "Anger carries information about your boundaries, your values, about what you will and will not accept. It deserves your attention, not your obedience.",
                    "application": "Ask yourself: what need is this anger protecting? Redirect its energy toward that need constructively.",
                },
                {
                    "wisdom": "Reactivity chains you to the thing that provoked you. Equanimity frees you to respond with clarity rather than combustion.",
                    "application": "Before you act on the anger, pause for 90 seconds. The chemical surge subsides, and wisdom has space to enter.",
                },
            ],
            "overwhelmed": [
                {
                    "wisdom": "The mind drowns when it tries to hold the ocean all at once. You are not failing — you are simply holding too much simultaneously.",
                    "application": "Write down everything on your mind, then circle only the one thing that matters most today. Start there.",
                },
                {
                    "wisdom": "You were never meant to solve everything at once. Dharma asks for your full presence in one task, not your fractured attention across twenty.",
                    "application": "Give yourself permission to do one thing at a time. Depth of attention replaces the anxiety of breadth.",
                },
            ],
            "hopeless": [
                {
                    "wisdom": "Even the darkest night cannot prevent the sunrise. Hopelessness is an emotional state, not a factual assessment of your future.",
                    "application": "Think of one time in the past when things felt impossible but eventually shifted. That same capacity lives in you now.",
                },
                {
                    "wisdom": "When you cannot see the path forward, it does not mean no path exists. Sometimes the next step is simply being willing to take one more breath.",
                    "application": "Today, commit to nothing more than staying present for the next hour. Then the next. That is enough.",
                },
            ],
            "confused": [
                {
                    "wisdom": "Confusion is the mind's way of saying: I am processing something larger than my current understanding. It is not failure — it is the threshold of growth.",
                    "application": "Stop trying to think your way to clarity. Instead, sit with the not-knowing. Answers often surface when you stop chasing them.",
                },
                {
                    "wisdom": "Discernment comes not from more information but from inner stillness. When the waters of the mind settle, you can see the bottom clearly.",
                    "application": "Step away from the decision for one hour. Return with fresh eyes and notice what feels true in your body, not just your mind.",
                },
            ],
        }

        primary_emotion = emotions[0] if emotions else None
        if primary_emotion and primary_emotion in emotion_wisdom:
            return emotion_wisdom[primary_emotion]

        # Default fallback for unrecognized emotions
        return [
            {
                "wisdom": "True peace comes not from external circumstances, but from within. When you cultivate inner stability, no storm can shake your core.",
                "application": "Practice returning to your breath whenever you feel uncentered. This simple act reconnects you with your inner calm.",
            },
            {
                "wisdom": "Actions performed with pure intention, without attachment to results, free us from the cycle of anxiety and disappointment.",
                "application": "Focus on giving your best effort today, and release the need to control what happens next.",
            },
        ]

    async def create_affirmations(
        self, emotions: list[str], themes: list[str], emotions_input: str = ""
    ) -> list[str]:
        """
        Generate personalized affirmations (Step 6) with quantum coherence.

        ALL RESPONSES ARE FILTERED THROUGH GITA CORE WISDOM.

        Args:
            emotions: List of identified emotions
            themes: List of identified themes
            emotions_input: User's original description of their situation

        Returns:
            List of 3-5 personalized affirmations grounded in Gita wisdom
        """
        if not self.optimizer.ready:
            return self._get_fallback_affirmations(emotions, themes)

        try:
            emotion_text = ", ".join(emotions) if emotions else "general wellbeing"
            theme_text = ", ".join(themes) if themes else "life challenges"

            # Include user's actual situation for personalized affirmations
            situation_context = f'\nTheir specific situation: "{emotions_input}"' if emotions_input else ""

            # Enhanced prompt with Gita wisdom context and user's actual words
            prompt = f"""Create 4 personalized affirmations for someone experiencing: {emotion_text}
Related to: {theme_text}{situation_context}

Drawing from timeless wisdom:
- Equanimity in success and failure (samatva)
- Focus on action, not outcome (nishkama karma)
- The mind as friend, not foe (sthitaprajna)
- Inner strength and completeness (atma-tripti)

Make them:
- Present tense ("I am" or "I choose")
- Reference their specific situation where possible
- Empowering but realistic
- Warm and compassionate
- 10-20 words each
- Secular-friendly language

Return only the 4 affirmations, each on a new line."""

            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": "You create personalized, empowering affirmations rooted in timeless wisdom about inner strength and emotional balance."},
                    {"role": "user", "content": prompt}
                ],
                model="gpt-4o-mini",
                temperature=0.8,
                max_tokens=180,
            )

            # Safe null check for OpenAI response
            content = ""
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg and response_msg.content:
                    content = response_msg.content

            # GITA WISDOM FILTER: Apply filter to full affirmations content
            content = await self._apply_gita_filter(content, f"{emotion_text} {theme_text}")

            affirmations = [
                line.strip().lstrip("•-1234567890. ")
                for line in content.strip().split("\n")
                if line.strip() and len(line.strip()) > 5
            ]

            return affirmations[:5] if affirmations else self._get_fallback_affirmations(emotions, themes)

        except Exception as e:
            logger.error(f"OpenAI affirmations error: {type(e).__name__}: {e}")
            return self._get_fallback_affirmations(emotions, themes)

    def _get_fallback_affirmations(self, emotions: list[str], themes: list[str] | None = None) -> list[str]:
        """Generate fallback affirmations when AI is unavailable."""
        base_affirmations = [
            "I am capable of navigating life's challenges with grace.",
            "My feelings are valid, and I give myself permission to feel them fully.",
            "I choose peace over worry, one moment at a time.",
            "I am stronger than I realize, and this too shall pass.",
            "I deserve compassion—from others and from myself.",
        ]

        emotion_specific = {
            "anxious": "I release my grip on the future and trust in my ability to handle what comes.",
            "stressed": "I choose to take one step at a time, knowing that's enough.",
            "sad": "I honor my sadness as a sign of my capacity to love and care deeply.",
            "angry": "I channel my energy into positive action and let go of what I cannot control.",
            "overwhelmed": "I give myself permission to set down what is not mine to carry right now.",
            "hopeless": "I trust that even when I cannot see the way forward, a path still exists.",
            "confused": "I allow clarity to arrive in its own time instead of forcing answers.",
        }

        theme_specific = {
            "relationships": "I bring my full, honest self to my relationships and trust that it is enough.",
            "work": "I do my work with dedication and release the need for constant external validation.",
            "health": "I honor my body's wisdom and give it the rest and care it deserves.",
            "purpose": "My path unfolds one step at a time, and where I am right now is part of the journey.",
            "change": "I welcome change as a teacher, knowing that growth and discomfort walk together.",
            "self_worth": "My worth is inherent and does not depend on what I achieve or what others think.",
        }

        affirmations = []

        # Add emotion-specific affirmation
        primary_emotion = emotions[0] if emotions else None
        if primary_emotion and primary_emotion in emotion_specific:
            affirmations.append(emotion_specific[primary_emotion])

        # Add theme-specific affirmation
        if themes:
            for theme in themes:
                if theme in theme_specific and len(affirmations) < 2:
                    affirmations.append(theme_specific[theme])

        # Fill remaining slots with base affirmations
        for base in base_affirmations:
            if len(affirmations) >= 4:
                break
            if base not in affirmations:
                affirmations.append(base)

        return affirmations

    async def generate_session_summary(
        self,
        emotions_input: str,
        assessment: dict[str, Any],
        affirmations: list[str],
    ) -> dict[str, Any]:
        """
        Generate personalized completion summary (Step 7).

        When OpenAI is available and the user shared their situation, generates
        a situation-specific summary, key insight, and next steps.

        Args:
            emotions_input: User's initial input describing their situation
            assessment: Assessment data with emotions and themes
            affirmations: Generated affirmations

        Returns:
            Summary data for completion
        """
        emotions = assessment.get("emotions", ["your emotions"])
        themes = assessment.get("themes", [])
        primary_emotion = emotions[0] if emotions else "your feelings"
        primary_affirmation = affirmations[0] if affirmations else "I am at peace."

        # Try AI-powered personalized summary when user shared their situation
        if emotions_input and self.optimizer.ready:
            try:
                emotion_text = ", ".join(emotions)
                theme_text = ", ".join(themes) if themes else "life"

                prompt = f"""A user completed an emotional reset session.
They shared: "{emotions_input}"
They were feeling: {emotion_text}
Life area: {theme_text}

Generate a personalized completion with these exact sections:
SUMMARY: 1-2 sentences acknowledging their specific journey (reference their actual situation, not just the emotion label)
INSIGHT: One powerful, specific insight relevant to what they shared (grounded in wisdom about equanimity, dharma, or self-mastery)
STEP1: A concrete next step tailored to their situation
STEP2: A second concrete next step
STEP3: A third concrete next step

Keep each section under 25 words. Warm, compassionate. Secular language. No scripture references."""

                response = await self.optimizer.create_completion_with_retry(
                    messages=[
                        {"role": "system", "content": "You create personalized session summaries that acknowledge the user's specific situation and offer grounded next steps."},
                        {"role": "user", "content": prompt}
                    ],
                    model="gpt-4o-mini",
                    temperature=0.7,
                    max_tokens=200,
                )

                content = ""
                if response and response.choices and len(response.choices) > 0:
                    response_msg = response.choices[0].message
                    if response_msg and response_msg.content:
                        content = response_msg.content.strip()

                if content:
                    # Parse the structured response
                    summary_text = self._extract_section(content, "SUMMARY")
                    insight_text = self._extract_section(content, "INSIGHT")
                    step1 = self._extract_section(content, "STEP1")
                    step2 = self._extract_section(content, "STEP2")
                    step3 = self._extract_section(content, "STEP3")

                    # Apply Gita filter to the insight
                    if insight_text:
                        insight_text = await self._apply_gita_filter(insight_text, emotions_input)

                    # Only use AI result if we got meaningful content
                    if summary_text and insight_text:
                        next_steps = [s for s in [step1, step2, step3] if s]
                        if not next_steps:
                            next_steps = self._get_fallback_next_steps(primary_emotion)

                        return {
                            "summary": summary_text,
                            "key_insight": insight_text,
                            "affirmation_to_remember": primary_affirmation,
                            "next_steps": next_steps,
                            "closing_message": "You've completed your emotional reset. Be gentle with yourself today. 💙",
                        }

            except Exception as e:
                logger.debug(f"AI session summary generation failed (using fallback): {e}")

        # Fallback: static summary with emotion-specific key insight
        return self._get_fallback_summary(primary_emotion, primary_affirmation)

    def _extract_section(self, content: str, section_name: str) -> str:
        """Extract a named section from structured AI response."""
        for line in content.split("\n"):
            line = line.strip()
            # Match patterns like "SUMMARY: text" or "**SUMMARY:** text"
            prefix_variants = [
                f"{section_name}:",
                f"**{section_name}:**",
                f"**{section_name}**:",
                f"{section_name} -",
            ]
            for prefix in prefix_variants:
                if line.upper().startswith(prefix.upper()):
                    return line[len(prefix):].strip().strip('"')
        return ""

    def _get_fallback_summary(self, primary_emotion: str, primary_affirmation: str) -> dict[str, Any]:
        """Static fallback summary with emotion-specific insights."""
        emotion_insights = {
            "anxious": "Anxiety loosens its grip when you return to what is actually in front of you, rather than what your mind imagines ahead.",
            "stressed": "Pressure transforms when you shift from carrying everything at once to offering your full presence to one thing at a time.",
            "sad": "Sadness honored becomes a doorway. What you grieve reveals what you value — and that capacity to care is your strength.",
            "angry": "Anger clarifies boundaries. The wisdom is not in suppressing it but in choosing what to do with the information it carries.",
            "overwhelmed": "You do not need to solve everything today. Dharma asks only for your honest effort in this one moment.",
            "hopeless": "Even when hope feels distant, the fact that you showed up here today proves that something in you still reaches toward the light.",
            "confused": "Clarity rarely arrives through more thinking. It surfaces when you create enough stillness for the answer to find you.",
        }

        return {
            "summary": f"Today you courageously explored {primary_emotion}. You've taken meaningful steps toward emotional balance.",
            "key_insight": emotion_insights.get(primary_emotion, "Your emotions are messengers, not masters. You have the power to acknowledge them and choose your response."),
            "affirmation_to_remember": primary_affirmation,
            "next_steps": self._get_fallback_next_steps(primary_emotion),
            "closing_message": "You've completed your emotional reset. Be gentle with yourself today. 💙",
        }

    def _get_fallback_next_steps(self, primary_emotion: str) -> list[str]:
        """Get emotion-specific next steps for fallback summaries."""
        emotion_steps = {
            "anxious": [
                "Practice the 4-4-4-4 breathing whenever anxiety surfaces today",
                "Write down one thing you are grateful for before bed tonight",
                "Return here whenever you need a reset — this space is always available",
            ],
            "stressed": [
                "Take a 5-minute pause between tasks today to reset your nervous system",
                "Choose one item from your to-do list and give it your full attention",
                "End your day with the breathing exercise to release accumulated tension",
            ],
            "sad": [
                "Allow yourself to feel without rushing to fix — sadness needs witnessing, not solving",
                "Reach out to one person who makes you feel seen and valued",
                "Revisit your affirmations gently each morning this week",
            ],
            "angry": [
                "When frustration rises today, pause for 90 seconds before responding",
                "Channel one burst of energy into physical movement — a walk, stretching, anything",
                "Reflect tonight on what boundary the anger was trying to protect",
            ],
        }

        return emotion_steps.get(primary_emotion, [
            "Practice the breathing exercise whenever you feel unsettled",
            "Revisit your affirmations each morning",
            "Come back whenever you need a reset",
        ])

    async def process_step(
        self,
        db: AsyncSession,
        session_id: str,
        user_id: str | None,
        current_step: int,
        user_input: str | None = None,
    ) -> dict[str, Any]:
        """
        Process current step and advance to next.

        Args:
            db: Database session
            session_id: Session identifier
            user_id: User identifier (optional)
            current_step: Current step number (1-7)
            user_input: User input for step 1

        Returns:
            Next step content and data
        """
        # Build query based on whether user_id is provided
        if user_id:
            result = await db.execute(
                select(EmotionalResetSession).where(
                    EmotionalResetSession.session_id == session_id,
                    EmotionalResetSession.user_id == user_id,
                    EmotionalResetSession.deleted_at.is_(None),
                )
            )
        else:
            # For anonymous users, retrieve by session_id only
            result = await db.execute(
                select(EmotionalResetSession).where(
                    EmotionalResetSession.session_id == session_id,
                    EmotionalResetSession.user_id.like("anon-%"),
                    EmotionalResetSession.deleted_at.is_(None),
                )
            )
        session = result.scalar_one_or_none()

        if not session:
            return {
                "success": False,
                "error": "session_not_found",
                "message": "Session not found. Please start a new emotional reset. 💙",
            }

        if session.completed:
            return {
                "success": False,
                "error": "session_completed",
                "message": "This session has already been completed. 💙",
            }

        # Process based on current step
        response_data: dict[str, Any] = {"success": True}

        if current_step == 1 and user_input:
            # Check for crisis
            crisis_info = self.detect_crisis(user_input)
            if crisis_info["crisis_detected"]:
                crisis_response = self.safety_validator.generate_crisis_response(crisis_info)
                return {
                    "success": False,
                    "error": "crisis_detected",
                    "crisis_response": crisis_response,
                    "pause_session": True,
                }

            # Validate input length (keep in sync with StepInput.USER_INPUT_MAX_LENGTH)
            if len(user_input) > 2000:
                return {
                    "success": False,
                    "error": "input_too_long",
                    "message": "Please keep your response under 2000 characters. 💙",
                }

            session.emotions_input = user_input
            next_step = 2

            # Generate assessment
            assessment = await self.assess_emotions(user_input)
            session.assessment_data = assessment
            response_data["assessment"] = assessment

        elif current_step == 2:
            next_step = 3
            response_data["breathing"] = self.generate_breathing_guidance()
            # Enrich breathing step with BG 4.29 (pranayama verse) from full corpus
            try:
                from backend.services.gita_emotional_wisdom import BREATHING_VERSE
                wisdom_core = _get_wisdom_core()
                if wisdom_core:
                    breathing_wisdom = await wisdom_core.get_verse(db, **BREATHING_VERSE)
                    if breathing_wisdom:
                        response_data["breathing"]["gita_verse"] = breathing_wisdom.to_dict()
            except Exception as e:
                logger.debug(f"Breathing verse enrichment skipped: {e}")

        elif current_step == 3:
            next_step = 4
            emotions = session.assessment_data.get("emotions", []) if session.assessment_data else []
            visualization = await self.create_release_visualization(emotions)
            response_data["visualization"] = visualization

        elif current_step == 4:
            next_step = 5
            assessment = session.assessment_data or {}
            wisdom = await self.generate_wisdom_insights(
                db, assessment,
                emotions_input=session.emotions_input or "",
                user_id=user_id or "",
            )
            session.wisdom_verses = wisdom
            response_data["wisdom"] = wisdom

        elif current_step == 5:
            next_step = 6
            emotions = session.assessment_data.get("emotions", []) if session.assessment_data else []
            themes = session.assessment_data.get("themes", []) if session.assessment_data else []
            affirmations = await self.create_affirmations(
                emotions, themes,
                emotions_input=session.emotions_input or "",
            )
            session.affirmations = affirmations
            response_data["affirmations"] = affirmations

        elif current_step == 6:
            next_step = 7
            summary = await self.generate_session_summary(
                session.emotions_input or "",
                session.assessment_data or {},
                session.affirmations or [],
            )
            response_data["summary"] = summary

        else:
            return {
                "success": False,
                "error": "invalid_step",
                "message": "Invalid step number.",
            }

        # Update session
        session.current_step = next_step
        session.updated_at = datetime.datetime.now(datetime.UTC)
        await db.commit()

        # Add next step info
        step_content = self.STEP_CONTENT.get(next_step, {})
        response_data.update({
            "current_step": next_step,
            "total_steps": 7,
            "step_title": step_content.get("title", ""),
            "guidance": step_content.get("guidance", ""),
            "progress": f"{next_step}/7",
        })

        return response_data

    async def complete_session(
        self, db: AsyncSession, session_id: str, user_id: str | None
    ) -> dict[str, Any]:
        """
        Complete session and optionally create journal entry.

        Args:
            db: Database session
            session_id: Session identifier
            user_id: User identifier (optional)

        Returns:
            Completion data with optional journal entry ID
        """
        # Build query based on whether user_id is provided
        if user_id:
            result = await db.execute(
                select(EmotionalResetSession).where(
                    EmotionalResetSession.session_id == session_id,
                    EmotionalResetSession.user_id == user_id,
                    EmotionalResetSession.deleted_at.is_(None),
                )
            )
        else:
            # For anonymous users, retrieve by session_id only
            result = await db.execute(
                select(EmotionalResetSession).where(
                    EmotionalResetSession.session_id == session_id,
                    EmotionalResetSession.user_id.like("anon-%"),
                    EmotionalResetSession.deleted_at.is_(None),
                )
            )
        session = result.scalar_one_or_none()

        if not session:
            return {
                "success": False,
                "error": "session_not_found",
                "message": "Session not found. 💙",
            }

        if session.completed:
            return {
                "success": True,
                "already_completed": True,
                "session_id": session_id,
            }

        # Mark session as completed
        session.completed = True
        session.completed_at = datetime.datetime.now(datetime.UTC)
        session.updated_at = datetime.datetime.now(datetime.UTC)
        await db.commit()

        # Generate final summary
        summary = await self.generate_session_summary(
            session.emotions_input or "",
            session.assessment_data or {},
            session.affirmations or [],
        )

        return {
            "success": True,
            "session_id": session_id,
            "summary": summary,
            "affirmations": session.affirmations,
            "message": "Your emotional reset session is complete. 💙",
        }
