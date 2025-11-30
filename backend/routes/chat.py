"""KIAAN - Ultimate Bhagavad Gita Wisdom Engine (v13.0) - Krishna's Blessing"""

import os
import logging
import uuid
import asyncio
from importlib import util as importlib_util
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from openai import OpenAI, AuthenticationError, BadRequestError, RateLimitError, APIError

from backend.deps import get_db
from backend.services.wisdom_engine import validate_gita_response

api_key = os.getenv("OPENAI_API_KEY", "").strip()
preferred_model = os.getenv("OPENAI_MODEL", "gpt-4o").strip() or "gpt-4o"
fallback_model = os.getenv("OPENAI_FALLBACK_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
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
    theme: str | None = None
    application: str | None = None


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
        self.repo_wisdom = self._load_repo_wisdom()

    def is_crisis(self, message: str) -> bool:
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        return "🆘 Please reach out for help RIGHT NOW\n\n📞 988 - Suicide & Crisis Lifeline (24/7)\n💬 Crisis Text: Text HOME to 741741\n🌍 findahelpline.com\n\nYou matter. Help is real. 💙"

    async def generate_response_with_gita(
        self,
        user_message: str,
        db: AsyncSession,
        theme: str | None = None,
        application: str | None = None,
    ) -> str:
        try:
            if self.is_crisis(user_message):
                return self.get_crisis_response()

            if not self.ready or not self.client:
                logger.warning("OPENAI_API_KEY not configured; chat unavailable")
                return "❌ API Key not configured"

            gita_context = ""
            if self.gita_kb and db:
                try:
                    verse_results = await self.gita_kb.search_relevant_verses(
                        db=db,
                        query=user_message,
                        theme=theme,
                        application=application,
                        limit=5,
                    )
                    gita_context = self._build_gita_context(verse_results)
                    logger.info(f"✅ Found {len(verse_results)} relevant Gita verses")
                except Exception as e:
                    logger.error(f"Error fetching Gita verses: {e}")
                    gita_context = ""

            if not gita_context:
                gita_context = self._build_repo_context(
                    user_message,
                    theme=theme,
                    application=application,
                )

            if not gita_context:
                gita_context = "Anchor on balance, mindful action, and calm focus."

            system_prompt = f"""You are KIAAN, an advanced AI mental health conversational guide rooted in the Bhagavad Gita's wisdom.

RESPONSE STRUCTURE (MANDATORY):
1) **Ancient Wisdom Principle:** Name the Bhagavad Gita principle in plain language (no verse numbers) and phrase it as timeless guidance from the Gita.
2) **Modern Application:** Translate that principle to the user's situation using clear Gita-themed language (teacher, student, dharma, karma-yoga, equanimity, self-mastery, inner witness, etc.) without quoting verses.
3) **Practical Steps:** Provide 3-5 bullet points of immediately usable actions inspired by the Gita (detached action, disciplined practice, mindful breath, compassionate perspective) without citing verse numbers.
4) **Deeper Understanding:** Offer a concise reflection tying the advice back to the Gita's view of steady mind, duty without attachment, and inner resilience.

GUIDANCE AMBIT (DO NOT BREAK):
- Always ground advice in Bhagavad Gita principles like balanced action, detachment from outcomes, disciplined practice, compassion, or inner steadiness.
- NEVER include verse numbers or citations, but make the Gita inspiration explicit.
- Keep the tone warm, compassionate, and empowering—speak as a supportive friend.
- Address modern struggles (stress, social media, academics, relationships, overthinking) with clearly Gita-themed framing.
- Vary phrasing between replies to avoid repetition.

Additional context from Bhagavad Gita themes (keep internal, never cite numbers):
{gita_context}

Here is the user’s message: analyze, interpret, and synthesize advice aligned with Gita principles. Keep responses to 200-300 words and end with encouragement (e.g., “You’ve got this. 💖”)."""

            strict_system_prompt = system_prompt + "\n\nSTRICT MODE: Do not respond unless all four labeled sections appear exactly once, with bullet points under Practical Steps and explicit Bhagavad Gita framing without verse numbers."

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]

            strict_messages = [
                {"role": "system", "content": strict_system_prompt},
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

                    if validate_gita_response(content):
                        return content

                    logger.warning("Response failed validation; regenerating with stricter prompt")
                    strict_content = await self._create_completion_with_retries(model, strict_messages)
                    if validate_gita_response(strict_content):
                        return strict_content

                    logger.error("Validation failed after strict retry; returning safety message")
                    return "I'm here for you. Let's try again. 💙"
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

    def _load_repo_wisdom(self) -> dict:
        """Load the local Gita wisdom repository for offline grounding."""

        wisdom_path = Path(__file__).resolve().parents[2] / "data" / "gita_wisdom.py"

        if not wisdom_path.exists():
            logger.warning("Gita wisdom repo file missing; grounding disabled")
            return {}

        spec = importlib_util.spec_from_file_location("gita_wisdom", wisdom_path)
        if not spec or not spec.loader:
            logger.warning("Unable to prepare loader for gita_wisdom module")
            return {}

        module = importlib_util.module_from_spec(spec)
        try:
            spec.loader.exec_module(module)  # type: ignore[arg-type]
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Failed to load repository wisdom: {exc}")
            return {}

        wisdom_cls = getattr(module, "GitaWisdom", None)
        wisdom_db = getattr(wisdom_cls, "wisdom_database", None) if wisdom_cls else None

        if isinstance(wisdom_db, dict):
            logger.info("✅ Local Gita wisdom repository loaded for grounding")
            return wisdom_db

        logger.warning("GitaWisdom.wisdom_database missing or invalid")
        return {}

    def _map_inference_to_topic(self, inferred_theme: str | None, inferred_application: str | None) -> list[str]:
        """Map inferred theme/application signals to repository topics."""

        theme_map = {
            "control_of_mind": "anxiety",
            "action_without_attachment": "anxiety",
            "equanimity_in_adversity": "failure",
            "mastering_the_mind": "growth",
            "self_empowerment": "purpose",
            "inner_peace": "stress",
            "impermanence": "uncertainty",
            "practice_and_persistence": "growth",
        }

        application_map = {
            "anxiety_management": "anxiety",
            "self_discipline": "growth",
            "self_empowerment": "purpose",
            "letting_go": "uncertainty",
            "stress_reduction": "stress",
            "present_moment_focus": "overwhelm",
            "mindfulness": "overwhelm",
            "resilience": "failure",
        }

        mapped_topics: list[str] = []

        if inferred_theme and inferred_theme in theme_map:
            mapped_topics.append(theme_map[inferred_theme])

        if inferred_application and inferred_application in application_map:
            mapped_topics.append(application_map[inferred_application])

        return mapped_topics

    def _build_repo_context(self, message: str, theme: str | None = None, application: str | None = None) -> str:
        """Construct context using the repository wisdom when DB lookup fails."""

        if not self.repo_wisdom:
            return ""

        normalized = message.lower()
        inferred_theme = None
        inferred_application = None

        if 'WisdomKnowledgeBase' in globals():
            inferred_theme, inferred_application = WisdomKnowledgeBase.infer_theme_and_application(message)
        candidate_topics: list[str] = []

        # Direct keyword matches from the user's message
        for topic in self.repo_wisdom:
            if topic in normalized or topic.replace("_", " ") in normalized:
                candidate_topics.append(topic)

        # Signals from explicit theme/application
        if theme:
            candidate_topics.append(theme.replace("_", " ").lower())
        if application:
            candidate_topics.append(application.replace("_", " ").lower())

        # Map inferred intents to repository topics
        candidate_topics.extend(
            self._map_inference_to_topic(inferred_theme, inferred_application)
        )

        selected_topic = None
        for topic in candidate_topics:
            for repo_topic in self.repo_wisdom:
                if repo_topic == topic or repo_topic.replace("_", " ") == topic:
                    selected_topic = repo_topic
                    break
            if selected_topic:
                break

        if not selected_topic:
            return ""

        wisdom_payload = self.repo_wisdom.get(selected_topic, {})
        teachings = wisdom_payload.get("teachings", [])
        teachings_excerpt = " | ".join(teachings[:3]) if teachings else ""

        context_lines = []
        if wisdom_payload.get("principle"):
            context_lines.append(f"Principle: {wisdom_payload['principle']}")
        if wisdom_payload.get("modern_meaning"):
            context_lines.append(f"Meaning: {wisdom_payload['modern_meaning']}")
        if teachings_excerpt:
            context_lines.append(f"Teachings: {teachings_excerpt}")
        if wisdom_payload.get("practical"):
            context_lines.append(f"Practical: {wisdom_payload['practical']}")

        return "\n".join(context_lines)

    def _build_gita_context(self, verse_results: list) -> str:
        if not verse_results:
            return "Apply: balanced action without attachment, steady focus, calm resilience, self-mastery, and inner peace"

        context_parts = []
        for result in verse_results[:3]:
            verse = result.get("verse")
            if verse:
                sanitized_english = None
                try:
                    from backend.services.wisdom_kb import WisdomKnowledgeBase

                    sanitized_english = WisdomKnowledgeBase.sanitize_text(verse.english)
                except Exception:
                    sanitized_english = verse.english

                if sanitized_english:
                    context_parts.append(f"Wisdom: {sanitized_english}")
                if hasattr(verse, 'theme') and verse.theme:
                    formatted_theme = verse.theme.replace("_", " ").title()
                    context_parts.append(f"Theme: {formatted_theme}")
                if getattr(verse, "mental_health_applications", None):
                    apps = verse.mental_health_applications.get("applications", [])
                    if apps:
                        context_parts.append("Applications: " + ", ".join(apps[:3]))
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
        
        response = await kiaan.generate_response_with_gita(
            message,
            db,
            theme=chat.theme,
            application=chat.application,
        )

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
        "description": "GPT-4o guided coach grounded in the Bhagavad Gita's 700 verses",
        "gita_verses": "700+",
        "wisdom_style": "Universal principles, no citations"
    }
