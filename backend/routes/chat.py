"""KIAAN - Ultimate Bhagavad Gita Wisdom Engine (v13.0) - Krishna's Blessing"""

import os
import logging
import uuid
import asyncio
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from openai import OpenAI, AuthenticationError, BadRequestError, RateLimitError, APIError

from backend.deps import get_db

api_key = os.getenv("OPENAI_API_KEY", "").strip()
preferred_model = os.getenv("OPENAI_MODEL", "gpt-4").strip() or "gpt-4"
fallback_model = os.getenv("OPENAI_FALLBACK_MODEL", "gpt-3.5-turbo").strip() or "gpt-3.5-turbo"
client = OpenAI(api_key=api_key) if api_key else None
ready = bool(api_key)

router = APIRouter(prefix="/api/chat", tags=["chat"])

logger = logging.getLogger(__name__)

gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Gita knowledge base loaded for KIAAN v13.0")
except Exception as e:
    logger.warning(f"⚠️ Gita KB unavailable: {e}")


class ChatMessage(BaseModel):
    message: str


class KIAAN:
    def __init__(self):
        self.name = "KIAAN"
        self.version = "13.0"
        self.client = client
        self.ready = ready
        self.gita_kb = gita_kb
        self.model_name = preferred_model
        self.fallback_model = fallback_model
        self.last_model_used = None
        self.max_retries = 3
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
                logger.warning("OPENAI_API_KEY not configured; chat unavailable")
                return "❌ API Key not configured"

            gita_context = ""
            if self.gita_kb and db:
                try:
                    verse_results = await self.gita_kb.search_relevant_verses(db=db, query=user_message, limit=5)
                    gita_context = self._build_gita_context(verse_results)
                    logger.info(f"✅ Found {len(verse_results)} relevant Gita verses")
                except Exception as e:
                    logger.error(f"Error fetching Gita verses: {e}")
                    gita_context = "Apply universal principles of dharma, karma, and shanti."

            system_prompt = f"""You are KIAAN, an AI guide rooted in the timeless wisdom of the Bhagavad Gita's 700 verses.

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

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]

            models_to_try: List[str] = []
            if self.model_name:
                models_to_try.append(self.model_name)
            if self.fallback_model and self.fallback_model not in models_to_try:
                models_to_try.append(self.fallback_model)

            for model in models_to_try:
                try:
                    content = await self._create_completion_with_retries(model, messages)
                    self.last_model_used = model
                    logger.info("KIAAN response generated")
                    return content if content else "I'm here for you. Let's try again. 💙"
                except BadRequestError as e:
                    logger.warning(f"Model {model} not available, trying fallback. Details: {e}")
                    continue
                except AuthenticationError as e:
                    logger.error(f"Authentication error for model {model}: {e}")
                    return "❌ API Key authentication failed"
                except RateLimitError as e:
                    logger.error(f"Rate limit reached for model {model}: {e}")
                    continue
                except APIError as e:
                    logger.error(f"OpenAI API error for model {model}: {e}")
                    continue

            return "I'm here for you. Let's try again. 💙"

        except Exception as e:
            logger.error(f"Error: {type(e).__name__}: {e}")
            return "I'm here for you. Let's try again. 💙"

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

    async def _create_completion_with_retries(self, model: str, messages: list) -> str:
        attempt = 0
        last_error = None

        while attempt < self.max_retries:
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=500,
                )
                return response.choices[0].message.content
            except RateLimitError as e:
                last_error = e
                attempt += 1
                wait_time = min(2 ** attempt, 8)
                logger.warning(f"Rate limit hit on attempt {attempt}/{self.max_retries} for {model}. Retrying in {wait_time}s")
                await asyncio.sleep(wait_time)
            except (BadRequestError, AuthenticationError, APIError):
                raise
            except Exception as e:  # noqa: BLE001
                last_error = e
                attempt += 1
                logger.error(f"Unexpected error on attempt {attempt}/{self.max_retries} for {model}: {e}")
                await asyncio.sleep(1)

        if last_error:
            raise last_error
        raise RateLimitError("Max retries exceeded")


kiaan = KIAAN()


@router.post("/start")
async def start_session() -> Dict[str, Any]:
    return {
        "session_id": str(uuid.uuid4()),
        "message": "Welcome! I'm KIAAN, your guide to inner peace. How can I help you today? 💙",
        "bot": "KIAAN",
        "version": "13.0",
        "gita_powered": True
    }


@router.post("/message")
async def send_message(chat: ChatMessage, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    try:
        message = chat.message.strip()
        if not message:
            return {"status": "error", "response": "What's on your mind? 💙"}
        
        response = await kiaan.generate_response_with_gita(message, db)

        return {
            "status": "success",
            "response": response,
            "bot": "KIAAN",
            "version": "13.0",
            "model": kiaan.last_model_used or kiaan.model_name,
            "gita_powered": True
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
        "model": kiaan.last_model_used or kiaan.model_name,
        "status": "Operational" if ready else "Error",
        "description": "AI guide rooted in Bhagavad Gita wisdom for modern mental wellness",
        "gita_verses": "700+",
        "wisdom_style": "Universal principles, no citations"
    }