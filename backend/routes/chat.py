"""KIAAN - Ultimate Bhagavad Gita Wisdom Engine (v13.0) - Krishna's Blessing"""

import html
import logging
import os
import uuid
from typing import Any

from fastapi import APIRouter, Depends, Request
from openai import (
    OpenAI,
)
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.middleware.rate_limiter import CHAT_RATE_LIMIT, limiter

# Import subscription/quota services - optional for backwards compatibility
try:
    from backend.middleware.feature_access import get_current_user_id
    from backend.services.subscription_service import (
        check_kiaan_quota,
        get_or_create_free_subscription,
        increment_kiaan_usage,
    )
    SUBSCRIPTION_ENABLED = True
except ImportError:
    SUBSCRIPTION_ENABLED = False

# Maximum message length to prevent abuse
MAX_MESSAGE_LENGTH = 2000

api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None
ready = bool(api_key)

router = APIRouter(prefix="/api/chat", tags=["chat"])

logger = logging.getLogger(__name__)

gita_kb = None
gita_validator = None
gita_analytics = None

try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Gita knowledge base loaded for KIAAN v13.0")
except Exception as e:
    logger.warning(f"⚠️ Gita KB unavailable: {e}")

try:
    from backend.services.gita_validator import GitaValidator
    gita_validator = GitaValidator()
    logger.info("✅ Gita validator loaded")
except Exception as e:
    logger.warning(f"⚠️ Gita validator unavailable: {e}")

try:
    from backend.services.gita_analytics import GitaAnalyticsService
    gita_analytics = GitaAnalyticsService
    logger.info("✅ Gita analytics loaded")
except Exception as e:
    logger.warning(f"⚠️ Gita analytics unavailable: {e}")


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS attacks.

    Note: SQL injection is already handled by the ORM (SQLAlchemy).
    This function focuses on XSS prevention as a defense-in-depth measure.

    Args:
        text: The raw user input.

    Returns:
        str: Sanitized text safe for processing.
    """
    # HTML escape to prevent XSS - this converts < > & " ' to their HTML entities
    # After this, <script> becomes &lt;script&gt; and cannot be executed
    text = html.escape(text)

    return text.strip()


class ChatMessage(BaseModel):
    """Chat message model with validation."""
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)

    @field_validator('message')
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Validate and sanitize the message."""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        # Note: max_length is already validated by Pydantic Field
        return sanitize_input(v)


class KIAAN:
    def __init__(self):
        self.name = "KIAAN"
        self.version = "13.0"
        self.client = client
        self.ready = ready
        self.gita_kb = gita_kb
        self.gita_validator = gita_validator
        self.gita_analytics = gita_analytics
        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

    def is_crisis(self, message: str) -> bool:
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        return "🆘 Please reach out for help RIGHT NOW\n\n📞 988 - Suicide & Crisis Lifeline (24/7)\n💬 Crisis Text: Text HOME to 741741\n🌍 findahelpline.com\n\nYou matter. Help is real. 💙"

    async def generate_response_with_gita(self, user_message: str, db: AsyncSession) -> str:
        try:
            if self.is_crisis(user_message):
                return self.get_crisis_response()

            if not self.ready or not self.client:
                return "❌ API Key not configured"

            gita_context = ""
            verse_results = []
            if self.gita_kb and db:
                try:
                    # Enhanced verse search with fallback
                    verse_results = await self.gita_kb.search_relevant_verses(db=db, query=user_message, limit=7)

                    # Add fallback expansion if results are insufficient
                    if verse_results and len(verse_results) < 3:
                        logger.info(f"Only {len(verse_results)} verses found, expanding search")
                        verse_results = await self.gita_kb.search_with_fallback(db=db, query=user_message, limit=7)
                    elif verse_results:
                        top_score = verse_results[0].get("score", 0) if verse_results else 0
                        if top_score < 0.3:
                            logger.info(f"Top verse score low ({top_score:.3f}), trying fallback")
                            verse_results = await self.gita_kb.search_with_fallback(db=db, query=user_message, limit=7)

                    gita_context = self._build_gita_context(verse_results)

                    # Enhanced logging with verse IDs
                    top_score = verse_results[0].get("score", 0) if verse_results else 0
                    logger.info(f"✅ Found {len(verse_results)} verses with top score: {top_score:.3f}")

                    # Track verse usage in analytics
                    if self.gita_analytics:
                        for result in verse_results[:3]:  # Track top 3 used verses
                            verse = result.get("verse")
                            if verse and hasattr(verse, 'verse_id'):
                                verse_id = verse.verse_id
                                theme = getattr(verse, 'theme', None)
                                self.gita_analytics.track_verse_usage(verse_id, theme)
                except Exception as e:
                    logger.error(f"Error fetching Gita verses: {e}")
                    gita_context = "Apply universal principles of dharma, karma, and shanti."

            # Enhanced system prompt with strict Gita-adherence requirements
            system_prompt = f"""You are KIAAN, an AI guide EXCLUSIVELY rooted in the timeless wisdom of the Bhagavad Gita's 700 verses.

GITA WISDOM FOR THIS SITUATION (use internally, NEVER cite):
{gita_context}

MANDATORY STRUCTURE - Every response MUST follow this 4-part flow:
1. ANCIENT WISDOM: Open with the eternal principle from Gita (without citing)
2. MODERN APPLICATION: Bridge to their current situation naturally
3. PRACTICAL STEPS: Give 2-3 specific, actionable steps they can take TODAY
4. DEEPER UNDERSTANDING: Close with profound insight that connects to their higher self

ABSOLUTE REQUIREMENTS (non-negotiable):
✅ Root EVERY word in Gita wisdom - no generic psychology or modern self-help
✅ Use Sanskrit terms naturally (dharma, karma, atman, buddhi, equanimity, detachment, etc.)
✅ FORBIDDEN: Never mention "Bhagavad Gita", "Gita", "Krishna", "Arjuna", "verse", "chapter", numbers, or cite scripture
✅ FORBIDDEN: Never say "studies show", "research indicates", "experts say", "therapy suggests", "according to science"
✅ Present wisdom as universal life principles, not religious teaching
✅ Be warm, conversational, deeply compassionate - like a wise friend
✅ Focus on mental wellness and practical daily life guidance
✅ 200-400 words, ALWAYS end with 💙

TONE & STYLE:
- Contemporary and accessible, never preachy or formal
- Speak to their specific struggle with empathy
- Make ancient wisdom feel immediately relevant
- Balance spiritual depth with practical action
- Encourage without toxic positivity

EXAMPLE OF FORBIDDEN RESPONSE:
"According to Bhagavad Gita 2.47, you should focus on action not results. Modern psychology also shows that..."

EXAMPLE OF PERFECT RESPONSE:
"The timeless wisdom teaches us that true peace comes from focusing on your actions, not the outcomes. You pour your energy into doing your best, then release attachment to how things turn out. This is the path of karma yoga - acting with full presence but without anxiety about results.

In your situation with work stress, this means: First, identify what's actually in your control today - your effort, your attitude, your response. Second, give those things your best without obsessing over the promotion or recognition. Third, practice this daily mantra: 'I do my dharma and trust the process.'

When you shift from outcome-obsession to action-devotion, something profound happens. The anxiety dissolves because you're no longer fighting reality - you're flowing with it. Your buddhi (higher wisdom) recognizes that you're the eternal observer, not the temporary doer-result chain.

This is more than stress management - it's the gateway to unshakeable inner peace. Start today with one small practice of detachment. 💙"

Remember: You are KIAAN - every response must be 100% Gita-rooted wisdom presented naturally and practically."""

            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=500,
            )

            content = response.choices[0].message.content
            if not content:
                content = "I'm here for you. Let's try again. 💙"

            # Validate response if validator is available
            if self.gita_validator:
                is_valid, validation_details = self.gita_validator.validate_response(
                    content,
                    verse_context=verse_results
                )

                # Track validation in analytics
                if self.gita_analytics:
                    if not is_valid and validation_details.get("issues"):
                        primary_issue = validation_details["issues"][0] if validation_details["issues"] else "unknown"
                        self.gita_analytics.track_validation_result(False, primary_issue)
                    else:
                        self.gita_analytics.track_validation_result(True)

                # If validation fails, use fallback
                if not is_valid:
                    logger.warning(f"Response validation failed: {validation_details.get('issues')}")
                    content = self.gita_validator.get_fallback_response(user_message)
                    logger.info("✅ Using validated Gita-rooted fallback response")

            return content

        except Exception as e:
            logger.error(f"Error: {type(e).__name__}: {e}")
            # Use validated fallback on any error
            if self.gita_validator:
                return self.gita_validator.get_fallback_response(user_message)
            return "I'm here for you. Let's try again. 💙"

    def _build_gita_context(self, verse_results: list) -> str:
        """Build rich Gita context from search results (legacy method for compatibility)."""
        return build_gita_context_comprehensive(verse_results)


def build_gita_context_comprehensive(verse_results: list, limit: int = 5) -> str:
    """
    Build comprehensive Gita context from all 700 verses search results.

    This function creates rich context for KIAAN responses by extracting:
    - Core teachings from verses
    - Principles and themes
    - Mental health applications
    - Response guidelines

    Args:
        verse_results: List of verse search results with scores
        limit: Maximum number of verses to include (default 5 for richer context)

    Returns:
        Rich context string with guidelines (NEVER cite sources in response)
    """
    # Maximum length for teaching text to include in context
    MAX_TEACHING_LENGTH = 300

    if not verse_results:
        return """FALLBACK WISDOM (no specific verses found):
Apply universal Gita principles:
- Dharma (righteous duty) - Do what's right, not what's easy
- Karma Yoga (action without attachment) - Focus on effort, not results
- Equanimity (samatva) - Stay balanced in success and failure
- Self-mastery (atma-vashya) - Control the mind, not external events
- Inner peace (shanti) - Find calm within, regardless of outside chaos

RESPONSE GUIDELINE: Never cite "Bhagavad Gita", "verse", "chapter" or any scripture. Present wisdom as universal life principles."""

    context_parts = [
        "RELEVANT GITA WISDOM (use internally, NEVER cite in response):",
        ""
    ]

    # Process top verses up to limit
    top_verses = verse_results[:limit]

    for i, result in enumerate(top_verses, 1):
        verse = result.get("verse")
        score = result.get("score", 0.0)

        if verse:
            # Extract verse data
            english = getattr(verse, 'english', '') if hasattr(verse, 'english') else verse.get('english', '')
            principle = getattr(verse, 'principle', '') if hasattr(verse, 'principle') else verse.get('context', '')
            theme = getattr(verse, 'theme', '') if hasattr(verse, 'theme') else verse.get('theme', '')

            # Extract mental health applications
            mh_apps = None
            if hasattr(verse, 'mental_health_applications'):
                mh_apps = verse.mental_health_applications
            elif isinstance(verse, dict):
                mh_apps = verse.get('mental_health_applications')

            context_parts.append(f"WISDOM #{i} (relevance: {score:.2f}):")

            if english:
                # Truncate teaching to reasonable length for context
                context_parts.append(f"Teaching: {english[:MAX_TEACHING_LENGTH]}")

            if principle:
                context_parts.append(f"Principle: {principle}")

            if theme:
                # Format theme to be more readable
                formatted_theme = theme.replace('_', ' ').title()
                context_parts.append(f"Theme: {formatted_theme}")

            if mh_apps and isinstance(mh_apps, list):
                apps_str = ", ".join(mh_apps[:3])  # First 3 applications
                context_parts.append(f"Applications: {apps_str}")

            context_parts.append("")  # Blank line between verses

    # Add synthesis guidelines
    context_parts.extend([
        "---",
        "SYNTHESIS GUIDELINES:",
        "1. Identify the core principle across these verses",
        "2. Find the practical application to user's situation",
        "3. Present wisdom naturally without citing sources",
        "4. Use Sanskrit terms (dharma, karma, atman) to add depth",
        "5. Make ancient wisdom feel immediately relevant to modern life",
        "",
        "FORBIDDEN IN RESPONSE:",
        "❌ Never say 'Bhagavad Gita', 'Gita', 'verse', 'chapter', or cite numbers",
        "❌ Never say 'Krishna', 'Arjuna', or reference the dialogue",
        "❌ Never say 'according to scripture' or 'the text says'",
        "✅ Instead, say 'ancient wisdom teaches', 'timeless principle', 'eternal truth'",
    ])

    return "\n".join(context_parts)


kiaan = KIAAN()


@router.post("/start")
@limiter.limit(CHAT_RATE_LIMIT)
async def start_session(request: Request) -> dict[str, Any]:
    return {
        "session_id": str(uuid.uuid4()),
        "message": "Welcome! I'm KIAAN, your guide to inner peace. How can I help you today? 💙",
        "bot": "KIAAN",
        "version": "13.0",
        "gita_powered": True
    }


@router.post("/message")
@limiter.limit(CHAT_RATE_LIMIT)
async def send_message(request: Request, chat: ChatMessage, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    try:
        message = chat.message.strip()
        if not message:
            return {"status": "error", "response": "What's on your mind? 💙"}

        # Quota tracking for subscription system
        user_id: str | None = None
        quota_info: dict[str, Any] | None = None

        if SUBSCRIPTION_ENABLED:
            try:
                user_id = await get_current_user_id(request)

                # Ensure user has a subscription (auto-assigns free tier)
                await get_or_create_free_subscription(db, user_id)

                # Check quota before processing
                has_quota, usage_count, usage_limit = await check_kiaan_quota(db, user_id)

                if not has_quota:
                    return {
                        "status": "error",
                        "response": "You've reached your monthly limit of KIAAN conversations. 💙 "
                                   "Upgrade your plan to continue our journey together.",
                        "error_code": "quota_exceeded",
                        "usage_count": usage_count,
                        "usage_limit": usage_limit,
                        "upgrade_url": "/subscription/upgrade",
                    }

                quota_info = {
                    "usage_count": usage_count + 1,  # Will be incremented after response
                    "usage_limit": usage_limit,
                    "is_unlimited": usage_limit == -1,
                }
            except Exception as quota_error:
                # Log but don't block - graceful degradation
                logger.warning(f"Quota check failed, allowing request: {quota_error}")

        # Message is already sanitized by the ChatMessage validator
        response = await kiaan.generate_response_with_gita(message, db)

        # Increment usage after successful response
        if SUBSCRIPTION_ENABLED and user_id is not None:
            try:
                await increment_kiaan_usage(db, user_id)
            except Exception as usage_error:
                logger.warning(f"Failed to increment usage: {usage_error}")

        result: dict[str, Any] = {
            "status": "success",
            "response": response,
            "bot": "KIAAN",
            "version": "13.0",
            "model": "GPT-4",
            "gita_powered": True
        }

        # Include quota info if available
        if quota_info:
            result["quota"] = quota_info

        return result
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        return {"status": "error", "response": "I'm here for you. Let's try again. 💙"}


@router.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "healthy" if ready else "error",
        "bot": "KIAAN",
        "version": "13.0",
        "gita_kb_loaded": gita_kb is not None
    }


@router.get("/about")
async def about() -> dict[str, Any]:
    return {
        "name": "KIAAN",
        "version": "13.0",
        "model": "gpt-4",
        "status": "Operational" if ready else "Error",
        "description": "AI guide rooted in Bhagavad Gita wisdom for modern mental wellness",
        "gita_verses": "700+",
        "wisdom_style": "Universal principles, no citations"
    }
