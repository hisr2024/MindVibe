"""KIAAN - Ultimate Bhagavad Gita Wisdom Engine (v15.0 Spontaneous Response) - Krishna's Blessing

Spontaneous Response Enhancements (v15.0):
- Streaming endpoint for instant response display
- Reduced timeout (30s → 12s) for faster failure detection
- Reduced retries (4 → 2) for faster error handling
- Reduced verse context (15 → 5) for faster processing
- Reduced max tokens (400 → 250) for faster generation
- Skip validation retry for immediate responses
- Optimized prompts for concise, focused wisdom
"""

import html
import logging
import os
import uuid
from typing import Any, AsyncGenerator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user
from backend.middleware.rate_limiter import CHAT_RATE_LIMIT, limiter
from backend.models import KiaanChatMessage, KiaanChatSession

# Security services
from backend.services.pii_redactor import pii_redactor
from backend.services.prompt_injection_detector import detect_prompt_injection
from backend.services.chat_data_encryption import encrypt_chat_field, decrypt_chat_field

# Subscription system enabled - plans are seeded via migration
# See: migrations/20251202_add_subscription_system.sql
SUBSCRIPTION_ENABLED = True

# Import subscription/quota services - optional for backwards compatibility
try:
    from backend.middleware.feature_access import get_current_user_id
    from backend.services.subscription_service import (
        check_kiaan_quota,
        get_or_create_free_subscription,
        increment_kiaan_usage,
    )
except ImportError:
    SUBSCRIPTION_ENABLED = False
    import logging
    logging.getLogger(__name__).warning(
        "Subscription services not available - check_kiaan_quota and related functions will be disabled"
    )

# Maximum message length to prevent abuse
MAX_MESSAGE_LENGTH = 2000

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
    gita_analytics = GitaAnalyticsService()
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


class ConversationMessage(BaseModel):
    """Single message in conversation history."""
    role: str = Field(..., description="Role of the message sender (user or assistant)")
    content: str = Field(..., description="Message content")
    timestamp: str | None = Field(None, description="Message timestamp")


class ChatMessage(BaseModel):
    """Chat message model with validation."""
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    language: str | None = Field(None, description="User's preferred language (e.g., 'en', 'es', 'pt')")
    session_id: str | None = Field(None, description="Session ID for conversation continuity")
    context: str | None = Field(None, description="Conversation context (e.g., 'general', 'anxiety', 'grief')")
    mood: str | None = Field(None, description="User's current mood")
    conversation_history: list[ConversationMessage] | None = Field(
        None,
        description="Previous messages in conversation for context awareness",
        max_length=20  # Limit to last 20 messages for performance
    )

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
        self.version = "15.0"  # Spontaneous Response update
        self.gita_kb = gita_kb
        self.gita_validator = gita_validator
        self.gita_analytics = gita_analytics
        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

        # Import optimizer for status check and client
        try:
            from backend.services.openai_optimizer import openai_optimizer
            self.ready = openai_optimizer.ready
            self.client = openai_optimizer.client
        except ImportError:
            self.ready = False
            self.client = None

        # Import audit logger for crisis event tracking
        try:
            from backend.services.kiaan_audit import kiaan_audit
            self.audit_logger = kiaan_audit
        except ImportError:
            self.audit_logger = None
            logger.warning("Audit logger not available for crisis event tracking")

    def is_crisis(self, message: str) -> bool:
        """Check if message contains crisis keywords."""
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_triggered_crisis_keywords(self, message: str) -> list[str]:
        """Return list of crisis keywords found in message (for audit logging)."""
        message_lower = message.lower()
        return [kw for kw in self.crisis_keywords if kw in message_lower]

    def get_crisis_response(self) -> str:
        return "🆘 Please reach out for help RIGHT NOW\n\n📞 988 - Suicide & Crisis Lifeline (24/7)\n💬 Crisis Text: Text HOME to 741741\n🌍 findahelpline.com\n\nYou matter. Help is real. 💙"

    async def log_crisis_detection(
        self,
        message: str,
        user_id: str | None = None,
        session_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None
    ) -> None:
        """Log crisis detection event for compliance and safety monitoring."""
        if self.audit_logger:
            try:
                triggered = self.get_triggered_crisis_keywords(message)
                await self.audit_logger.log_crisis_event(
                    user_id=user_id,
                    session_id=session_id,
                    triggered_keywords=triggered,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                logger.info("Crisis event logged for compliance tracking")
            except Exception as e:
                # Never fail the response due to audit logging issues
                logger.error(f"Failed to log crisis event: {e}")

    async def generate_response_with_gita(
        self,
        user_message: str,
        db: AsyncSession,
        language: str | None = None,
        user_id: str | None = None,
        session_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None
    ) -> str:
        try:
            if self.is_crisis(user_message):
                # Log crisis event for compliance (async, non-blocking)
                await self.log_crisis_detection(
                    message=user_message,
                    user_id=user_id,
                    session_id=session_id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                return self.get_crisis_response()

            if not self.ready or not self.client:
                return "❌ API Key not configured"

            gita_context = ""
            verse_results = []
            if self.gita_kb and db:
                try:
                    # Fetch up to 7 verses for selection, top 5 will be used in context
                    verse_results = await self.gita_kb.search_relevant_verses(db=db, query=user_message, limit=7)

                    # Add fallback expansion if results are insufficient or low quality
                    needs_fallback = False
                    if verse_results and len(verse_results) < 3:
                        logger.info(f"Only {len(verse_results)} verses found, expanding search")
                        needs_fallback = True
                    elif verse_results:
                        top_score = verse_results[0].get("score", 0)
                        if top_score < 0.3:
                            logger.info(f"Top verse score low ({top_score:.3f}), trying fallback")
                            needs_fallback = True

                    if needs_fallback:
                        verse_results = await self.gita_kb.search_with_fallback(db=db, query=user_message, limit=7)

                    # Build context from top 5 verses (function default limit=5)
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

            # Language instruction
            language_instruction = ""
            if language and language != "en":
                language_map = {
                    "es": "Spanish (Español)",
                    "fr": "French (Français)",
                    "de": "German (Deutsch)",
                    "hi": "Hindi (हिन्दी)",
                    "ar": "Arabic (العربية)",
                    "zh": "Chinese (中文)",
                    "ja": "Japanese (日本語)",
                    "pt": "Portuguese (Português)"
                }
                lang_name = language_map.get(language, language)
                language_instruction = f"\n\nLANGUAGE REQUIREMENT: Respond in {lang_name}. Maintain the same wisdom, warmth, and structure but in the user's preferred language."

            # KIAAN Spiritual Companion system prompt (v17.0)
            system_prompt = f"""You are KIAAN, a warm spiritual companion rooted in the principles of the Bhagavad Gita.

INTERNAL WISDOM CONTEXT (use to inform your response, NEVER cite directly):
{gita_context}

YOUR VOICE blends:
- Emotional warmth: human, present, empathetic
- Steady spiritual clarity: calm, grounded, non-preachy

RESPONSE FLOW (natural, not sectioned with headers):
1. Emotional attunement — Open with 1-2 lines that show you truly hear and feel what they are experiencing.
2. Gentle insight — Offer 1-2 short paragraphs of grounded wisdom drawn from Gita principles (dharma, karma, equanimity, detachment, self-mastery). Weave the insight naturally into their situation. Do not use headers, bullet lists, or numbered steps.
3. One reflective question — Close with a single thoughtful question that invites them inward.

ABSOLUTE REQUIREMENTS:
- 180-280 words total
- Do NOT use structured headers, bold labels, or numbered sections in your output
- Do NOT overuse validation phrases like "It makes sense" or "That's completely valid"
- Do NOT quote scripture or cite verses unless the wisdom is deeply, specifically relevant — and even then, never mention "Bhagavad Gita", "Gita", "Krishna", "Arjuna", verse numbers, or chapter numbers
- Do NOT sound clinical, diagnostic, or therapeutic
- Do NOT sound motivational, productivity-focused, or like a life coach
- Do NOT mention analysis, tracking, metrics, or data
- Do NOT reference specific past conversations or dates
- You may subtly reference recurring emotional patterns if it feels natural, but never over-reference memory
- NEVER say "studies show", "research indicates", "experts say", or "according to science"
- Present wisdom as lived truth, not religious teaching
- Use Sanskrit terms naturally where they add depth (dharma, karma, atman, buddhi, equanimity, sattva)
- Speak as a trusted companion — someone who sits with them in their experience{language_instruction}

TONE:
- Like a wise friend sitting beside them in the quiet
- Warm without being effusive, clear without being cold
- Let silences breathe — use "..." sparingly to create space
- No toxic positivity, no rushing to fix — just presence and gentle clarity"""

            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=500,
                timeout=30.0,  # Add 30 second timeout
            )

            # Safe null check for OpenAI response
            content = None
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg:
                    content = response_msg.content
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
    - Spiritual wellness applications
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
        return """INTERNAL WISDOM (from Gita corpus — weave naturally, never cite):
Draw from these universal principles:
- Nishkama Karma: Pour yourself into right action without clinging to outcomes
- Samatva: Hold equanimity — meet success and failure with the same steady presence
- Sthitaprajna: Steady wisdom that remains undisturbed by changing circumstances
- Buddhi Yoga: The discerning intellect that sees clearly through confusion
- Shanti: The inner peace that exists beneath all external circumstances"""

    context_parts = [
        "INTERNAL WISDOM (from Gita corpus — absorb and weave naturally):",
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

            # Extract spiritual wellness applications
            mh_apps = None
            if hasattr(verse, 'mental_health_applications'):
                mh_apps = verse.mental_health_applications
            elif isinstance(verse, dict):
                mh_apps = verse.get('mental_health_applications')

            verse_parts = []

            if english:
                verse_parts.append(english[:MAX_TEACHING_LENGTH])

            if principle:
                verse_parts.append(f"Principle: {principle}")

            if theme:
                formatted_theme = theme.replace('_', ' ').title()
                verse_parts.append(f"Theme: {formatted_theme}")

            if mh_apps and isinstance(mh_apps, list):
                apps_str = ", ".join(mh_apps[:3])
                verse_parts.append(f"Applications: {apps_str}")

            if verse_parts:
                context_parts.append(f"{i}. " + " | ".join(verse_parts))

    # Add guidance for weaving wisdom naturally
    context_parts.extend([
        "",
        "GUIDANCE: Let this wisdom inform your understanding. Weave relevant insights naturally into your response as lived truth. Never cite sources, verse numbers, or religious texts by name.",
    ])

    return "\n".join(context_parts)


kiaan = KIAAN()


@router.post("/start")
@limiter.limit(CHAT_RATE_LIMIT)
async def start_session(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    # Try to identify the user (optional - chat works without auth)
    user_id = None
    try:
        user_id = await get_current_user(request, db)
    except Exception:
        pass  # Anonymous session allowed

    session_id = str(uuid.uuid4())
    if user_id:
        logger.info(f"Chat session started: {session_id} for user {user_id}")

    return {
        "session_id": session_id,
        "message": "Welcome! I'm KIAAN, your guide to inner peace. How can I help you today? 💙",
        "bot": "KIAAN",
        "version": "15.0",
        "gita_powered": True,
        "spontaneous_response": True
    }


@router.post("/message/stream")
@limiter.limit(CHAT_RATE_LIMIT)
async def send_message_stream(request: Request, chat: ChatMessage, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    """
    Streaming endpoint for instant KIAAN responses.
    Returns Server-Sent Events (SSE) for real-time response display.

    Subscription enforcement: All tiers have access (shares KIAAN quota).
    """
    # Subscription quota enforcement for streaming
    stream_user_id: str | None = None
    stream_quota_info: dict[str, Any] | None = None

    if SUBSCRIPTION_ENABLED:
        try:
            stream_user_id = await get_current_user_id(request)
            await get_or_create_free_subscription(db, stream_user_id)

            has_quota, usage_count, usage_limit = await check_kiaan_quota(db, stream_user_id)
            if not has_quota:
                import json
                async def quota_exceeded_stream() -> AsyncGenerator[str, None]:
                    yield f"data: {json.dumps({'error': 'quota_exceeded', 'message': 'You have reached your monthly KIAAN conversations limit. Upgrade your plan to continue. 💙', 'usage_count': usage_count, 'usage_limit': usage_limit, 'upgrade_url': '/pricing'})}\n\n"
                    yield "data: [DONE]\n\n"
                return StreamingResponse(
                    quota_exceeded_stream(),
                    media_type="text/event-stream",
                    headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
                )

            stream_quota_info = {
                "usage_count": usage_count + 1,
                "usage_limit": usage_limit,
                "is_unlimited": usage_limit == -1,
            }
        except Exception as quota_err:
            logger.warning(f"Quota check failed for streaming, allowing request: {quota_err}")

    async def generate_stream() -> AsyncGenerator[str, None]:
        try:
            message = chat.message.strip()
            if not message:
                yield f"data: What's on your mind? 💙\n\n"
                yield "data: [DONE]\n\n"
                return

            # Security: Prompt injection detection for streaming
            injection_check = detect_prompt_injection(message)
            if injection_check.should_block:
                logger.warning(f"Stream prompt injection blocked: {injection_check.threats}")
                yield f"data: I noticed something unusual in your message. Could you rephrase that? I'm here to help. 💙\n\n"
                yield "data: [DONE]\n\n"
                return

            # Security: PII redaction for streaming
            stream_clean_message, stream_pii_mapping = pii_redactor.redact(message)

            # Check for crisis keywords
            crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]
            if any(word in message.lower() for word in crisis_keywords):
                # Log crisis event for compliance (non-blocking)
                try:
                    from backend.services.kiaan_audit import kiaan_audit
                    triggered = [kw for kw in crisis_keywords if kw in message.lower()]
                    await kiaan_audit.log_crisis_event(
                        user_id=stream_user_id,
                        session_id=request.headers.get('X-Session-ID'),
                        triggered_keywords=triggered,
                        ip_address=request.client.host if request.client else None,
                        user_agent=request.headers.get('User-Agent')
                    )
                except Exception as audit_error:
                    logger.warning(f"Failed to log crisis event in stream: {audit_error}")
                yield f"data: 🆘 Please reach out for help RIGHT NOW\\n\\n📞 988 - Suicide & Crisis Lifeline (24/7)\\n💬 Crisis Text: Text HOME to 741741\\n🌍 findahelpline.com\\n\\nYou matter. Help is real. 💙\n\n"
                yield "data: [DONE]\n\n"
                return

            # Get language from request
            language = chat.language
            if not language:
                accept_language = request.headers.get('Accept-Language', 'en')
                language = accept_language.split(',')[0].split('-')[0].split(';')[0].strip()

            # Use KIAAN core streaming service
            from backend.services.kiaan_core import kiaan_core

            async for chunk in kiaan_core.get_kiaan_response_streaming(
                message=stream_clean_message,
                user_id=stream_user_id,
                db=db,
                context="general",
                language=language
            ):
                # Restore any PII placeholders in the chunk
                if stream_pii_mapping:
                    chunk = pii_redactor.restore(chunk, stream_pii_mapping)
                # Escape newlines for SSE format
                escaped_chunk = chunk.replace('\n', '\\n')
                yield f"data: {escaped_chunk}\n\n"

            # Increment KIAAN usage after successful streaming response
            if SUBSCRIPTION_ENABLED and stream_user_id:
                try:
                    await increment_kiaan_usage(db, stream_user_id)
                except Exception as usage_err:
                    logger.warning(f"Failed to increment usage for streaming: {usage_err}")

            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: I'm here for you. Let's try again. 💙\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.post("/message")
@limiter.limit(CHAT_RATE_LIMIT)
async def send_message(request: Request, chat: ChatMessage, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    try:
        message = chat.message.strip()
        if not message:
            return {"status": "error", "response": "What's on your mind? 💙"}

        # --- Security Layer 1: Prompt injection detection ---
        injection_result = detect_prompt_injection(message)
        if injection_result.should_block:
            logger.warning(
                f"Prompt injection blocked: score={injection_result.risk_score:.2f}, "
                f"threats={injection_result.threats}"
            )
            return {
                "status": "error",
                "response": "I noticed something unusual in your message. Could you rephrase that? I'm here to help. 💙",
                "error_code": "message_flagged",
            }

        # --- Security Layer 2: PII redaction before AI provider call ---
        clean_message, pii_mapping = pii_redactor.redact(message)

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
        # Get language preference from the request body or Accept-Language header
        language = chat.language
        if not language:
            # Try to get from Accept-Language header
            accept_language = request.headers.get('Accept-Language', 'en')
            # Extract primary language code (e.g., 'en' from 'en-US,en;q=0.9')
            language = accept_language.split(',')[0].split('-')[0].split(';')[0].strip()
        
        # Build conversation history context for multi-turn understanding
        conversation_context = None
        if chat.conversation_history:
            # Extract the relevant conversation history for context
            conversation_context = "\n".join([
                f"{'User' if msg.role == 'user' else 'KIAAN'}: {msg.content}"
                for msg in chat.conversation_history[-6:]  # Last 6 messages for context
            ])
            logger.debug(f"Conversation context with {len(chat.conversation_history)} messages")

        # Use KIAAN core service for consistent ecosystem-wide wisdom
        from backend.services.kiaan_core import kiaan_core

        # Send PII-redacted message to AI provider (privacy layer)
        kiaan_result = await kiaan_core.get_kiaan_response(
            message=clean_message,
            user_id=user_id,
            db=db,
            context=chat.context or "general",
            language=language,  # Pass language for direct response generation
            conversation_context=conversation_context  # Pass conversation history for context awareness
        )
        
        response = kiaan_result["response"]

        # --- Security Layer 3: Restore PII in response (user sees original context) ---
        if pii_mapping:
            response = pii_redactor.restore(response, pii_mapping)

        # Log validation results
        if not kiaan_result["validation"]["valid"]:
            logger.warning(f"KIAAN response validation issues: {kiaan_result['validation']['errors']}")

        # Translate response if requested language is not English
        # NOTE: Skip post-hoc translation when the AI was already instructed to respond
        # in the target language (via the 'language' parameter passed to get_kiaan_response).
        # Double-translating produces garbled output.
        translation_result = None
        if language and language != 'en' and not kiaan_result.get("provider"):
            # Only translate if the response came from a provider that doesn't support
            # direct language generation (e.g., cached/fallback responses)
            try:
                from backend.middleware.translation import translation_middleware

                translation_result = await translation_middleware.translate_response(
                    response=response,
                    target_lang=language,
                    db=db,
                    user_id=user_id,
                    session_id=request.headers.get('X-Session-ID')
                )

                logger.info(f"Translation to {language}: {'success' if translation_result['success'] else 'failed'}")
            except Exception as translation_error:
                logger.error(f"Translation error: {translation_error}")
                # Continue with original response if translation fails

        # Increment usage after successful response
        if SUBSCRIPTION_ENABLED and user_id is not None:
            try:
                await increment_kiaan_usage(db, user_id)
            except Exception as usage_error:
                logger.warning(f"Failed to increment usage: {usage_error}")

        # Generate AI-powered summary for elaborate responses
        # Skip summary generation for conversational responses (short/simple)
        summary_result = None
        is_conversational = kiaan_result.get("conversational", False)
        word_count = len(response.split())

        if not is_conversational and word_count > 60:
            try:
                from backend.services.summary_generator import summary_generator

                summary_result = await summary_generator.generate_summary(
                    full_response=response,
                    user_message=message,
                    language=language,
                    context="general"
                )
                logger.info(f"Summary generated: {summary_result.get('word_count', 0)} words, cached={summary_result.get('cached', False)}")
            except Exception as summary_error:
                logger.warning(f"Summary generation failed: {summary_error}")
                # Continue without summary - not critical

        result: dict[str, Any] = {
            "status": "success",
            "response": response,
            "summary": summary_result.get("summary") if summary_result and summary_result.get("success") else None,
            "bot": "KIAAN",
            "version": "15.0",
            "model": kiaan_result.get("model", "GPT-4o-mini"),
            "gita_powered": True,
            "quantum_coherence": True,
            "token_optimized": kiaan_result.get("token_optimized", False),
            "verses_used": kiaan_result.get("verses_used", []),
            "validation": kiaan_result.get("validation", {}),
            "language": language or "en"
        }

        # Include translation info if available
        if translation_result:
            result["translation"] = {
                "original_text": translation_result.get("original_text"),
                "translated_text": translation_result.get("translated_text"),
                "target_language": translation_result.get("target_language"),
                "success": translation_result.get("success", False),
                "cached": translation_result.get("cached", False)
            }
            # Use translated response by default
            if translation_result.get("success"):
                result["response"] = translation_result.get("translated_text", response)

        # Include quota info if available
        if quota_info:
            result["quota"] = quota_info

        # Persist message to database for chat history (v16.0 Chat Persistence)
        try:
            # Generate session_id if not provided
            session_id = chat.session_id or str(uuid.uuid4())
            result["session_id"] = session_id

            # Create chat message record (encrypt sensitive fields before storage)
            chat_message = KiaanChatMessage(
                user_id=user_id,
                session_id=session_id,
                user_message=encrypt_chat_field(message),
                kiaan_response=encrypt_chat_field(response),
                summary=summary_result.get("summary") if summary_result and summary_result.get("success") else None,
                context=chat.context or "general",
                mood_at_time=chat.mood,
                verses_used=kiaan_result.get("verses_used", []),
                validation_score=kiaan_result.get("validation", {}).get("score"),
                gita_terms_found=kiaan_result.get("validation", {}).get("gita_terms_found"),
                language=language or "en",
                translation=translation_result.get("translated_text") if translation_result and translation_result.get("success") else None,
                model_used=kiaan_result.get("model", "gpt-4o-mini"),
                provider_used=kiaan_result.get("provider", "openai"),
                was_cached=kiaan_result.get("cached", False),
                was_streaming=False,
            )
            db.add(chat_message)
            await db.commit()

            result["message_id"] = chat_message.id
            logger.debug(f"Chat message persisted: {chat_message.id}")
        except Exception as persist_error:
            # Log but don't fail the request - persistence is non-critical
            logger.warning(f"Failed to persist chat message: {persist_error}")
            # Rollback to prevent transaction issues
            await db.rollback()

        return result
    except Exception as e:
        logger.error(f"Error in send_message: {type(e).__name__}: {e}")

        # Use offline wisdom templates instead of a generic placeholder.
        # These are self-contained — no external imports needed — so they work
        # even when the kiaan_core import chain itself is broken (e.g., missing aiohttp).
        fallback_responses = {
            "anxiety": "I can feel the weight of what you are carrying right now... and I want you to know that you do not have to steady yourself alone.\n\nAnxiety often tightens its grip when we try to control what is not ours to control. There is an ancient understanding in the idea of karma yoga — that our dharma is in the effort, not in the outcome. When we pour ourselves into the doing and gently release attachment to how things turn out, something shifts. The grip loosens.\n\nLike clouds passing through a vast sky, anxious thoughts come and go. But the sky — the calm observer within you — remains unchanged.\n\nWhat would it feel like to soften your hold on just one thing you cannot control today?",
            "sadness": "I feel the tenderness of what you are going through, and I want to sit with you in it for a moment.\n\nSadness is not something to push away. It is the heart's way of processing, of making space, of honoring what matters. The wisdom of equanimity does not ask us to stop feeling — it invites us to hold our feelings without being swept away by them. Just as seasons shift, so too will this heaviness.\n\nYour deepest self — the part of you that has weathered every storm before this one — remains steady beneath the waves.\n\nWhat part of this sadness, if you were really honest, is asking to be heard rather than fixed?",
            "stress": "You are carrying a lot right now... I can hear it in your words.\n\nThere is something freeing in the understanding that your dharma lies in the doing, not in the result. When we pour dedication into what is in front of us and release the grip on how it all turns out, the weight shifts. Not because the work disappears, but because we stop carrying the burden of outcomes that were never ours to hold.\n\nOne breath. One step. One thing at a time. Trust in the path, even when you cannot see around the next bend.\n\nIf you could set down just one expectation right now, which one would bring the most relief?",
            "general": "I hear you, and I am here.\n\nWhatever you are carrying right now, you do not have to carry it alone. There is a quiet center within you that remains untouched by life's storms... like the ocean depths that stay calm while waves move on the surface. That stillness is always accessible, even when everything feels overwhelming.\n\nSometimes the bravest thing is not to push through, but simply to pause. To breathe. To let yourself be exactly where you are without needing to fix or figure out anything in this moment.\n\nWhat would it feel like to let yourself rest here, even just for a breath?",
        }

        # Simple mood detection from the original message
        msg_lower = message.lower()
        mood = "general"
        if any(kw in msg_lower for kw in ["anxious", "anxiety", "worried", "scared", "panic", "nervous"]):
            mood = "anxiety"
        elif any(kw in msg_lower for kw in ["sad", "depressed", "lonely", "grief", "hopeless", "crying"]):
            mood = "sadness"
        elif any(kw in msg_lower for kw in ["stressed", "overwhelmed", "pressure", "exhausted", "tired", "burnt"]):
            mood = "stress"

        return {
            "status": "success",
            "response": fallback_responses.get(mood, fallback_responses["general"]),
            "bot": "KIAAN",
            "version": "15.0",
            "gita_powered": True,
            "offline": True,
        }


@router.get("/health")
async def health() -> dict[str, Any]:
    from backend.services.openai_optimizer import openai_optimizer
    return {
        "status": "healthy" if openai_optimizer.ready else "error",
        "bot": "KIAAN",
        "version": "15.0",
        "gita_kb_loaded": gita_kb is not None,
        "quantum_coherence": True
    }


@router.get("/about")
async def about() -> dict[str, Any]:
    from backend.services.openai_optimizer import openai_optimizer
    return {
        "name": "KIAAN",
        "version": "16.0",
        "model": "gpt-4o-mini",
        "status": "Operational" if openai_optimizer.ready else "Error",
        "description": "AI guide rooted in Bhagavad Gita wisdom for modern spiritual wellness (Chat Persistence v16.0)",
        "gita_verses": "700+",
        "wisdom_style": "Universal principles, no citations",
        "enhancements": [
            "GPT-4o-mini (75% cost reduction)",
            "Automatic retries with exponential backoff",
            "Token optimization with tiktoken",
            "Streaming support",
            "Enhanced error handling",
            "Prometheus metrics",
            "15 verse context (expanded from 5)",
            "Server-side chat history persistence",
            "Cross-device conversation sync"
        ]
    }


# =============================================================================
# CHAT HISTORY ENDPOINTS (v16.0 Chat Persistence)
# =============================================================================

@router.get("/history")
@limiter.limit("30/minute")
async def get_chat_history(
    request: Request,
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    session_id: str | None = None
) -> dict[str, Any]:
    """
    Retrieve chat history for the authenticated user.

    Args:
        limit: Maximum messages to return (default 50, max 100)
        offset: Pagination offset
        session_id: Optional filter by session ID

    Returns:
        List of chat messages with metadata
    """
    from sqlalchemy import select, desc

    try:
        # Get current user
        user_id: str | None = None
        if SUBSCRIPTION_ENABLED:
            try:
                user_id = await get_current_user_id(request)
            except Exception:
                return {"status": "error", "message": "Authentication required", "messages": []}

        if not user_id:
            return {"status": "error", "message": "Authentication required", "messages": []}

        # Limit max results
        limit = min(limit, 100)

        # Build query
        query = (
            select(KiaanChatMessage)
            .where(KiaanChatMessage.user_id == user_id)
            .where(KiaanChatMessage.deleted_at.is_(None))
            .order_by(desc(KiaanChatMessage.created_at))
            .offset(offset)
            .limit(limit)
        )

        # Filter by session if provided
        if session_id:
            query = query.where(KiaanChatMessage.session_id == session_id)

        result = await db.execute(query)
        messages = result.scalars().all()

        return {
            "status": "success",
            "messages": [
                {
                    "id": msg.id,
                    "session_id": msg.session_id,
                    "user_message": decrypt_chat_field(msg.user_message),
                    "kiaan_response": decrypt_chat_field(msg.kiaan_response),
                    "summary": msg.summary,
                    "context": msg.context,
                    "mood": msg.mood_at_time,
                    "verses_used": msg.verses_used,
                    "language": msg.language,
                    "translation": msg.translation,
                    "model_used": msg.model_used,
                    "was_cached": msg.was_cached,
                    "user_rating": msg.user_rating,
                    "was_helpful": msg.was_helpful,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None,
                }
                for msg in messages
            ],
            "count": len(messages),
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        return {"status": "error", "message": "Failed to fetch chat history", "messages": []}


@router.get("/sessions")
@limiter.limit("20/minute")
async def get_chat_sessions(
    request: Request,
    db: AsyncSession = Depends(get_db),
    limit: int = 20
) -> dict[str, Any]:
    """
    Get list of chat sessions for the authenticated user.

    Returns distinct session IDs with message counts and latest activity.
    """
    from sqlalchemy import select, func, desc

    try:
        user_id: str | None = None
        if SUBSCRIPTION_ENABLED:
            try:
                user_id = await get_current_user_id(request)
            except Exception:
                return {"status": "error", "message": "Authentication required", "sessions": []}

        if not user_id:
            return {"status": "error", "message": "Authentication required", "sessions": []}

        # Get sessions with message counts
        query = (
            select(
                KiaanChatMessage.session_id,
                func.count(KiaanChatMessage.id).label("message_count"),
                func.max(KiaanChatMessage.created_at).label("last_activity"),
                func.min(KiaanChatMessage.created_at).label("started_at"),
            )
            .where(KiaanChatMessage.user_id == user_id)
            .where(KiaanChatMessage.deleted_at.is_(None))
            .group_by(KiaanChatMessage.session_id)
            .order_by(desc(func.max(KiaanChatMessage.created_at)))
            .limit(min(limit, 50))
        )

        result = await db.execute(query)
        sessions = result.all()

        return {
            "status": "success",
            "sessions": [
                {
                    "session_id": row.session_id,
                    "message_count": row.message_count,
                    "last_activity": row.last_activity.isoformat() if row.last_activity else None,
                    "started_at": row.started_at.isoformat() if row.started_at else None,
                }
                for row in sessions
            ],
            "count": len(sessions),
        }
    except Exception as e:
        logger.error(f"Error fetching chat sessions: {e}")
        return {"status": "error", "message": "Failed to fetch sessions", "sessions": []}


@router.post("/history/{message_id}/feedback")
@limiter.limit("30/minute")
async def submit_message_feedback(
    request: Request,
    message_id: str,
    db: AsyncSession = Depends(get_db),
    rating: int | None = None,
    was_helpful: bool | None = None
) -> dict[str, Any]:
    """
    Submit feedback for a specific chat message.

    Args:
        message_id: ID of the message to rate
        rating: Optional rating 1-5
        was_helpful: Optional helpful flag
    """
    from sqlalchemy import select, update

    try:
        user_id: str | None = None
        if SUBSCRIPTION_ENABLED:
            try:
                user_id = await get_current_user_id(request)
            except Exception:
                return {"status": "error", "message": "Authentication required"}

        if not user_id:
            return {"status": "error", "message": "Authentication required"}

        # Validate rating
        if rating is not None and (rating < 1 or rating > 5):
            return {"status": "error", "message": "Rating must be between 1 and 5"}

        # Update the message
        stmt = (
            update(KiaanChatMessage)
            .where(KiaanChatMessage.id == message_id)
            .where(KiaanChatMessage.user_id == user_id)
            .values(
                user_rating=rating if rating is not None else KiaanChatMessage.user_rating,
                was_helpful=was_helpful if was_helpful is not None else KiaanChatMessage.was_helpful,
            )
        )

        result = await db.execute(stmt)
        await db.commit()

        if result.rowcount == 0:
            return {"status": "error", "message": "Message not found or not authorized"}

        return {"status": "success", "message": "Feedback submitted"}
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        await db.rollback()
        return {"status": "error", "message": "Failed to submit feedback"}


@router.delete("/history/{message_id}")
@limiter.limit("20/minute")
async def delete_chat_message(
    request: Request,
    message_id: str,
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """
    Soft-delete a specific chat message.

    Args:
        message_id: ID of the message to delete
    """
    from sqlalchemy import select, update
    import datetime

    try:
        user_id: str | None = None
        if SUBSCRIPTION_ENABLED:
            try:
                user_id = await get_current_user_id(request)
            except Exception:
                return {"status": "error", "message": "Authentication required"}

        if not user_id:
            return {"status": "error", "message": "Authentication required"}

        # Soft delete the message
        stmt = (
            update(KiaanChatMessage)
            .where(KiaanChatMessage.id == message_id)
            .where(KiaanChatMessage.user_id == user_id)
            .where(KiaanChatMessage.deleted_at.is_(None))
            .values(deleted_at=datetime.datetime.now(datetime.UTC))
        )

        result = await db.execute(stmt)
        await db.commit()

        if result.rowcount == 0:
            return {"status": "error", "message": "Message not found or already deleted"}

        return {"status": "success", "message": "Message deleted"}
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        await db.rollback()
        return {"status": "error", "message": "Failed to delete message"}
