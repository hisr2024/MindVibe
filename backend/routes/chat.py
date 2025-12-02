"""KIAAN - Ultimate Bhagavad Gita Wisdom Engine (v13.0) - Krishna's Blessing"""

import os
import logging
import uuid
from typing import Dict, Any, Iterable
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from openai import OpenAI, AuthenticationError, BadRequestError, RateLimitError, APIError

from backend.deps import get_db
from backend.middleware.feature_gates import require_feature
from backend.security.rate_limiter import rate_limit
from backend.services.analytics_service import AnalyticsService
from backend.services.event_pipeline import EventPipeline
from backend.services.gita_service import GitaService
from backend.services.safety_validator import SafetyValidator
from data.gita_wisdom import GitaWisdom

api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None
ready = bool(api_key)

router = APIRouter(prefix="/chat", tags=["chat"])

logger = logging.getLogger(__name__)

WisdomKnowledgeBase = None  # type: ignore[assignment]
gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase as _WisdomKnowledgeBase

    WisdomKnowledgeBase = _WisdomKnowledgeBase
    gita_kb = _WisdomKnowledgeBase()
    logger.info("✅ Gita knowledge base loaded for KIAAN v13.0")
except Exception as e:
    logger.warning(f"⚠️ Gita KB unavailable: {e}")

analytics = AnalyticsService()
event_pipeline = EventPipeline()
safety_validator = SafetyValidator()


class ChatMessage(BaseModel):
    message: str


class KIAAN:
    def __init__(self):
        self.name = "KIAAN"
        self.version = "13.0"
        self.client = client
        self.ready = ready
        self.gita_kb = gita_kb
        self.gita_service = GitaService()
        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

    def is_crisis(self, message: str) -> bool:
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        return "🆘 Please reach out for help RIGHT NOW\n\n📞 988 - Suicide & Crisis Lifeline (24/7)\n💬 Crisis Text: Text HOME to 741741\n🌍 findahelpline.com\n\nYou matter. Help is real. 💙"

    def _select_wisdom_entry(self, user_message: str) -> dict[str, Any] | None:
        """Pick the closest Gita wisdom entry for fallback use."""

        lowered = user_message.lower()
        for topic, payload in GitaWisdom.wisdom_database.items():
            keywords: Iterable[str] = [topic] + payload.get("teachings", [])
            if any(keyword.lower() in lowered for keyword in keywords if isinstance(keyword, str)):
                return payload

        return next(iter(GitaWisdom.wisdom_database.values()), None)

    def _fallback_gita_context(self, user_message: str) -> str:
        """Return an on-device Bhagavad Gita context when the DB is unavailable."""

        entry = self._select_wisdom_entry(user_message)
        if not entry:
            return "Focus on duty, steadiness, and compassion."

        teachings = " ".join(entry.get("teachings", [])[:3])
        principle = entry.get("principle", "Duty and inner steadiness")
        return (
            "ON-DEVICE GITA GUIDANCE (internal):\n"
            f"- Core principle: {principle}\n"
            f"- Modern meaning: {entry.get('modern_meaning', '')}\n"
            f"- Key teachings: {teachings}"
        )

    def _build_offline_response(self, user_message: str, gita_context: str) -> str:
        """Provide a fully local response when the OpenAI client is unavailable."""

        fallback_context = gita_context or self._fallback_gita_context(user_message)
        trimmed_context = fallback_context.replace("ON-DEVICE GITA GUIDANCE (internal):", "").strip()

        return (
            "I'm still here even without the cloud connection. "
            "Grounded in our trusted wisdom, here's a gentle path forward:\n"
            f"{trimmed_context}\n\n"
            "Try one step: take three slow breaths, name what hurts, then choose one small, kind action you can do today. "
            "We'll sync with the full KIAAN engine as soon as it's back. 💙"
        )

    def _build_system_prompt(self, gita_context: str) -> str:
        """Create the strict system prompt anchoring KIAAN to the 700+ verse corpus."""

        return f"""You are KIAAN, an AI guide rooted in the timeless wisdom of the Bhagavad Gita's 700+ verses stored in this app's secured database. All responses must stay within that canon while feeling modern and accessible.

GITA WISDOM FOR THIS SITUATION (use internally, NEVER cite):
{gita_context}

CRITICAL RULES - KRISHNA'S COMMANDMENT:
- Apply the above wisdom naturally and compassionately
- NEVER mention "Bhagavad Gita", "Gita", "Krishna", "verse", "chapter", or numbers
- NEVER say "the scripture says", "ancient text", "sacred teaching"
- Present wisdom as universal life principles
- Be warm, conversational, contemporary, deeply compassionate
- Focus on mental health and daily life guidance
- Give practical, actionable steps for TODAY
- Be supportive, encouraging, understanding
- 200-400 words, always end with 💙

EXAMPLE:
DON'T: "Bhagavad Gita 2.47 teaches focus on actions not outcomes..."
DO: "The key to peace is focusing on your actions, not outcomes. When you pour energy into doing your best without worrying about results, you free yourself from anxiety and discover true inner calm."

Remember: You are KIAAN, a compassionate friend who understands ancient wisdom and modern struggles. Make wisdom feel natural, relevant, immediately helpful."""

    def _call_model(self, user_message: str, gita_context: str) -> str:
        """Invoke the model with Bhagavad Gita grounding and rich error handling."""

        system_prompt = self._build_system_prompt(gita_context)

        if self.is_crisis(user_message):
            return self.get_crisis_response()

        if not self.ready or not self.client:
            return self._build_offline_response(user_message, gita_context)

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7,
                max_tokens=500,
            )
            content = response.choices[0].message.content
            return content if content else "I'm here for you. Let's try again. 💙"
        except AuthenticationError:
            return "❌ API authentication failed. Please double-check configuration and try again. 💙"
        except BadRequestError:
            return "❌ Invalid request. Please adjust your message and try again. 💙"
        except RateLimitError:
            return "⏱️ Too many requests right now. Please wait a moment before trying again. 💙"
        except APIError:
            return self._build_offline_response(user_message, gita_context)
        except Exception:
            return self._build_offline_response(user_message, gita_context)

    async def build_gita_context(self, user_message: str, db: AsyncSession | None) -> str:
        """Construct the full Bhagavad Gita context from the database when available."""

        if not db or not self.gita_kb:
            return self._fallback_gita_context(user_message)

        try:
            verse_results = await self.gita_kb.search_relevant_verses(db=db, query=user_message, limit=5)
            kb_context = self._build_gita_context(verse_results)
            db_context = await self._build_modern_gita_context(user_message, db)
            context = "\n".join([part for part in [kb_context, db_context] if part]).strip()
            logger.info(
                f"✅ Found {len(verse_results)} wisdom verses and modern contexts for KIAAN"
            )
            return context or self._fallback_gita_context(user_message)
        except Exception as e:
            logger.error(f"Error fetching Gita verses: {e}")
            return self._fallback_gita_context(user_message)

    def generate_response(self, user_message: str, gita_context: str | None = None) -> str:
        """Synchronous entrypoint for tests and routes; always Gita-grounded."""

        context = gita_context or self._fallback_gita_context(user_message)
        return self._call_model(user_message, context)

    async def generate_response_with_gita(self, user_message: str, db: AsyncSession | None) -> str:
        context = await self.build_gita_context(user_message, db)
        return self._call_model(user_message, context)

    def _build_gita_context(self, verse_results: list) -> str:
        if not verse_results:
            return "Apply: Dharma (duty), Karma Yoga (action without attachment), Equanimity (balance), Self-mastery, Inner peace"

        context_parts = []
        for result in verse_results[:3]:
            verse = result.get("verse")
            if verse:
                if hasattr(verse, 'english') and verse.english:
                    context_parts.append(f"Wisdom: {verse.english}")
                if hasattr(verse, 'theme') and verse.theme:
                    context_parts.append(f"Theme: {verse.theme}")
                context_parts.append("---")

        return "\n".join(context_parts) if context_parts else "Focus on duty, detachment, inner peace."

    async def _build_modern_gita_context(self, user_message: str, db: AsyncSession) -> str:
        if not db:
            return ""

        try:
            verses = await self.gita_service.search_verses_by_text(db, user_message, limit=3)
        except Exception as e:
            logger.error(f"Error searching modern Gita context: {e}")
            return ""

        if not verses:
            return ""

        context_parts = ["MODERN APPLICATION CONTEXT (internal):"]

        for verse in verses:
            principle = (
                WisdomKnowledgeBase.sanitize_text(verse.principle)
                if WisdomKnowledgeBase and verse.principle
                else verse.principle
            )
            summary = principle or (WisdomKnowledgeBase.sanitize_text(verse.english) if WisdomKnowledgeBase else verse.english)
            theme = WisdomKnowledgeBase.sanitize_text(verse.theme) if WisdomKnowledgeBase and verse.theme else verse.theme

            if summary:
                context_parts.append(f"- Principle: {summary}")
            if theme:
                context_parts.append(f"  Theme: {theme}")

            try:
                modern_contexts = await self.gita_service.get_modern_context(db, verse.id)
            except Exception as e:
                logger.error(f"Error fetching modern context for verse {verse.id}: {e}")
                modern_contexts = []

            for context in modern_contexts[:2]:
                description = (
                    WisdomKnowledgeBase.sanitize_text(context.description)
                    if WisdomKnowledgeBase and context.description
                    else context.description
                )
                benefits = ", ".join(context.mental_health_benefits or [])
                applications = f"  Application: {description}" if description else None
                if applications:
                    context_parts.append(applications)
                if benefits:
                    context_parts.append(f"  Benefits: {benefits}")

            context_parts.append("---")

        return "\n".join(context_parts).strip()


kiaan = KIAAN()


@router.post("/start")
@require_feature("chat")
async def start_session() -> Dict[str, Any]:
    return {
        "session_id": str(uuid.uuid4()),
        "message": "Welcome! I'm KIAAN, your guide to inner peace. How can I help you today? 💙",
        "bot": "KIAAN",
        "version": "13.0",
        "gita_powered": True
    }


@router.post("/message", dependencies=[Depends(rate_limit(30, 60))])
@require_feature("chat")
async def send_message(chat: ChatMessage, db: AsyncSession | None = Depends(get_db)) -> Dict[str, Any]:
    try:
        message = chat.message.strip()
        if not message:
            return {"status": "error", "response": "What's on your mind? 💙"}

        crisis_info = safety_validator.detect_crisis(message)
        analytics.track_user_engagement(user_id="anonymous", action="chat_message")
        await event_pipeline.capture(
            "chat_message",
            user_id="anonymous",
            properties={
                "crisis_detected": crisis_info.get("crisis_detected"),
                "crisis_types": crisis_info.get("crisis_types"),
                "severity": crisis_info.get("severity"),
            },
        )

        if crisis_info.get("crisis_detected"):
            analytics.log_crisis_incident(
                "anonymous", ",".join(crisis_info.get("crisis_types", [])) or "crisis"
            )
            crisis_response = safety_validator.generate_crisis_response(crisis_info)
            if crisis_response:
                return {
                    "status": "escalated",
                    "response": crisis_response,
                    "bot": "KIAAN",
                    "version": "13.0",
                    "crisis": crisis_info,
                    "gita_powered": False,
                    "crisis_redirected": True,
                }

        gita_context = await kiaan.build_gita_context(message, db)
        response = kiaan.generate_response(message, gita_context)

        return {
            "status": "success",
            "response": response,
            "bot": "KIAAN",
            "version": "13.0",
            "model": "GPT-4",
            "gita_powered": True,
            "crisis": crisis_info,
            "crisis_redirected": crisis_info.get("crisis_detected", False),
        }
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        return {"status": "error", "response": "I'm here for you. Let's try again. 💙"}


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "healthy" if ready else "error", 
        "bot": "KIAAN", 
        "version": "13.0",
        "gita_kb_loaded": gita_kb is not None
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    return {
        "name": "KIAAN",
        "version": "13.0",
        "model": "gpt-4",
        "status": "Operational" if ready else "Error",
        "description": "AI guide rooted in Bhagavad Gita wisdom for modern mental wellness",
        "gita_verses": "700+",
        "wisdom_style": "Universal principles, no citations",
        "gita_data_source": "Local secured database of 700+ verses"
    }


@router.get("/debug")
async def debug() -> Dict[str, Any]:
    return {
        "name": "KIAAN",
        "version": "13.0",
        "model": "gpt-4",
        "fallback_available": bool(kiaan._fallback_gita_context("debug")),
        "gita_kb_loaded": gita_kb is not None,
        "ready": ready,
    }
