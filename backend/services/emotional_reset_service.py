"""
Emotional Reset Service (Quantum Coherence v2.0)

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

    async def assess_emotions(self, user_input: str) -> dict[str, Any]:
        """
        Generate emotional assessment based on user input (Step 2) with quantum coherence.

        Args:
            user_input: User's description of their emotions

        Returns:
            Assessment with insights and identified emotions
        """
        if not self.optimizer.ready:
            return self._get_fallback_assessment(user_input)

        try:
            prompt = f"""You are a compassionate wellness guide. A user shared: "{user_input}"

Provide a brief, empathetic assessment in 2-3 sentences that:
1. Validates their feelings
2. Identifies the core emotion(s) they're experiencing
3. Gently reframes the situation with hope

Keep it warm, conversational, and under 100 words. Do not use religious terms or citations.
End with 💙"""

            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": "You are a compassionate guide focused on emotional wellness."},
                    {"role": "user", "content": prompt}
                ],
                model="gpt-4o-mini",  # Upgraded from gpt-4
                temperature=0.7,
                max_tokens=150,  # Optimized from 200
            )

            # Safe null check for OpenAI response
            content = ""
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg and response_msg.content:
                    content = response_msg.content

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

        Args:
            emotions: List of emotions identified in assessment

        Returns:
            Guided visualization text
        """
        if not self.optimizer.ready:
            return self._get_fallback_visualization(emotions)

        try:
            emotion_text = ", ".join(emotions) if emotions else "your current feelings"

            prompt = f"""Create a brief, calming visualization for releasing: {emotion_text}

Write 3-4 sentences using nature metaphors (like a flowing stream, wind, or sunrise).
Be gentle, poetic, and hopeful. Do not use religious terms.
Keep it under 80 words. End with 💙"""

            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": "You are a gentle guide creating calming visualizations."},
                    {"role": "user", "content": prompt}
                ],
                model="gpt-4o-mini",  # Upgraded from gpt-4
                temperature=0.8,
                max_tokens=120,  # Optimized from 150
            )

            # Safe null check for OpenAI response
            content = None
            if response and response.choices and len(response.choices) > 0:
                message = response.choices[0].message
                if message:
                    content = message.content
            return content or self._get_fallback_visualization(emotions)

        except Exception as e:
            logger.error(f"OpenAI visualization error: {type(e).__name__}: {e}")
            return self._get_fallback_visualization(emotions)

    def _get_fallback_visualization(self, _emotions: list[str]) -> str:
        """Generate fallback visualization when AI is unavailable."""
        return """Imagine yourself standing by a peaceful stream. The water flows gently, carrying fallen leaves downstream.

One by one, place your worries on these leaves. Watch as the current lifts them, carries them away, and slowly dissolves them into the distance.

With each leaf that floats away, feel yourself becoming lighter. The stream continues to flow, endlessly patient, endlessly renewing. 💙"""

    async def generate_wisdom_insights(
        self, db: AsyncSession, assessment: dict[str, Any]
    ) -> list[dict[str, str]]:
        """
        Generate wisdom insights based on assessment (Step 5).
        Enhanced to use 5 verses and return top 3 insights.

        Args:
            db: Database session
            assessment: Assessment data from Step 2

        Returns:
            List of top 3 wisdom insights (no citations)
        """
        themes = assessment.get("themes", [])
        emotions = assessment.get("emotions", [])

        # Get specialized verses first using module-level mapping
        key_verse_results = []
        primary_emotion = emotions[0] if emotions else None

        if primary_emotion and primary_emotion in EMOTION_VERSE_MAPPING:
            for chapter, verse_num in EMOTION_VERSE_MAPPING[primary_emotion][:3]:
                try:
                    verse = await GitaService.get_verse_by_reference(db, chapter=chapter, verse=verse_num)
                    if verse:
                        key_verse_results.append({"verse": verse, "score": 0.9})
                except Exception as e:
                    logger.debug(f"Could not fetch verse {chapter}.{verse_num}: {e}")

        # Search for additional verses (increased from 3 to 5)
        search_query = " ".join(themes + emotions)
        verse_results = await self.wisdom_kb.search_relevant_verses(db=db, query=search_query, limit=5)

        # Combine and deduplicate
        all_verse_results = key_verse_results + verse_results
        seen_ids = set()
        unique_verses = []
        for result in all_verse_results:
            verse = result["verse"]
            verse_id = get_verse_identifier(verse)
            if verse_id and verse_id not in seen_ids:
                seen_ids.add(verse_id)
                unique_verses.append(result)

        insights = []
        if unique_verses:
            # Return top 3 insights (increased from 2)
            for result in unique_verses[:3]:
                verse = result["verse"]
                sanitized = self.wisdom_kb.sanitize_text(verse.english)
                if sanitized:
                    insights.append({
                        "wisdom": sanitized,
                        "application": self._create_application(verse, emotions),
                    })

        # Fallback if no verses found
        if not insights:
            insights = self._get_fallback_wisdom(emotions)

        return insights

    def _create_application(self, _verse: WisdomVerse, emotions: list[str]) -> str:
        """Create practical application of wisdom for the user."""
        applications = {
            "anxious": "When anxiety arises, remember that you can only control your actions, not outcomes.",
            "stressed": "In moments of pressure, find peace by focusing on the present task, not future worries.",
            "sad": "Sadness reminds us of what we value. Honor it, then gently return to the present.",
            "angry": "Channel your energy into constructive action rather than dwelling on what caused the upset.",
            "overwhelmed": "Break down your challenges into small, manageable steps. One breath at a time.",
        }

        primary_emotion = emotions[0] if emotions else "overwhelmed"
        return applications.get(primary_emotion, applications["overwhelmed"])

    def _get_fallback_wisdom(self, _emotions: list[str]) -> list[dict[str, str]]:
        """Generate fallback wisdom when verses not found."""
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
        self, emotions: list[str], themes: list[str]
    ) -> list[str]:
        """
        Generate personalized affirmations (Step 6) with quantum coherence.

        Args:
            emotions: List of identified emotions
            themes: List of identified themes

        Returns:
            List of 3-5 personalized affirmations
        """
        if not self.optimizer.ready:
            return self._get_fallback_affirmations(emotions)

        try:
            emotion_text = ", ".join(emotions) if emotions else "general wellbeing"
            theme_text = ", ".join(themes) if themes else "life challenges"

            prompt = f"""Create 4 personalized affirmations for someone experiencing: {emotion_text}
Related to: {theme_text}

Make them:
- Present tense ("I am" or "I choose")
- Empowering but realistic
- Warm and compassionate
- 10-20 words each

Do not use religious terms. Return only the 4 affirmations, each on a new line."""

            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": "You create personalized, empowering affirmations."},
                    {"role": "user", "content": prompt}
                ],
                model="gpt-4o-mini",  # Upgraded from gpt-4
                temperature=0.8,
                max_tokens=180,  # Optimized from 200
            )

            # Safe null check for OpenAI response
            content = ""
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg and response_msg.content:
                    content = response_msg.content
            affirmations = [
                line.strip().lstrip("•-1234567890. ")
                for line in content.strip().split("\n")
                if line.strip() and len(line.strip()) > 5
            ]

            return affirmations[:5] if affirmations else self._get_fallback_affirmations(emotions)

        except Exception as e:
            logger.error(f"OpenAI affirmations error: {type(e).__name__}: {e}")
            return self._get_fallback_affirmations(emotions)

    def _get_fallback_affirmations(self, emotions: list[str]) -> list[str]:
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
        }

        primary_emotion = emotions[0] if emotions else None
        if primary_emotion and primary_emotion in emotion_specific:
            affirmations = [emotion_specific[primary_emotion]] + base_affirmations[:3]
        else:
            affirmations = base_affirmations[:4]

        return affirmations

    def generate_session_summary(
        self,
        _emotions_input: str,
        assessment: dict[str, Any],
        affirmations: list[str],
    ) -> dict[str, Any]:
        """
        Generate completion summary (Step 7).

        Args:
            _emotions_input: User's initial input (kept for future use)
            assessment: Assessment data
            affirmations: Generated affirmations

        Returns:
            Summary data for completion
        """
        emotions = assessment.get("emotions", ["your emotions"])
        primary_emotion = emotions[0] if emotions else "your feelings"

        primary_affirmation = affirmations[0] if affirmations else "I am at peace."

        return {
            "summary": f"Today you courageously explored {primary_emotion}. You've taken meaningful steps toward emotional balance.",
            "key_insight": "Remember: your emotions are messengers, not masters. You have the power to acknowledge them and choose your response.",
            "affirmation_to_remember": primary_affirmation,
            "next_steps": [
                "Practice the breathing exercise whenever you feel unsettled",
                "Revisit your affirmations each morning",
                "Come back whenever you need a reset",
            ],
            "closing_message": "You've completed your emotional reset. Be gentle with yourself today. 💙",
        }

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

            # Validate input length
            if len(user_input) > 200:
                return {
                    "success": False,
                    "error": "input_too_long",
                    "message": "Please keep your response under 200 characters. 💙",
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

        elif current_step == 3:
            next_step = 4
            emotions = session.assessment_data.get("emotions", []) if session.assessment_data else []
            visualization = await self.create_release_visualization(emotions)
            response_data["visualization"] = visualization

        elif current_step == 4:
            next_step = 5
            assessment = session.assessment_data or {}
            wisdom = await self.generate_wisdom_insights(db, assessment)
            session.wisdom_verses = wisdom
            response_data["wisdom"] = wisdom

        elif current_step == 5:
            next_step = 6
            emotions = session.assessment_data.get("emotions", []) if session.assessment_data else []
            themes = session.assessment_data.get("themes", []) if session.assessment_data else []
            affirmations = await self.create_affirmations(emotions, themes)
            session.affirmations = affirmations
            response_data["affirmations"] = affirmations

        elif current_step == 6:
            next_step = 7
            summary = self.generate_session_summary(
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
        summary = self.generate_session_summary(
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
