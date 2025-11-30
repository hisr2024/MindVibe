"""KIAAN - Ultimate Bhagavad Gita Wisdom Engine (v13.0) - Krishna's Blessing"""

import os
import logging
import uuid
import asyncio
import time
import re
from importlib import util as importlib_util
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from openai import OpenAI, AuthenticationError, BadRequestError, RateLimitError, APIError

from backend.deps import get_db
from backend.models import WisdomVerse
from backend.services.wisdom_engine import validate_gita_response

api_key = os.getenv("OPENAI_API_KEY", "").strip()
preferred_model = os.getenv("OPENAI_MODEL", "gpt-4").strip() or "gpt-4"
fallback_model = os.getenv("OPENAI_FALLBACK_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
client = OpenAI(api_key=api_key) if api_key else None

router = APIRouter(prefix="/api/chat", tags=["chat"])

logger = logging.getLogger(__name__)

gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Gita knowledge base loaded for KIAAN v13.0")
except Exception as e:
    logger.warning(f"⚠️ Gita KB unavailable: {e}")

MAX_HISTORY_MESSAGES = 20
session_histories: dict[str, list[dict[str, str]]] = {}
session_lock = asyncio.Lock()


class ChatMessage(BaseModel):
    message: str
    theme: str | None = None
    application: str | None = None
    session_id: str | None = None


async def _initialize_session_history(session_id: str, assistant_greeting: str) -> None:
    async with session_lock:
        session_histories[session_id] = [
            {"role": "assistant", "content": assistant_greeting}
        ]


async def _get_session_history(session_id: str) -> list[dict[str, str]]:
    async with session_lock:
        history = session_histories.get(session_id, [])
        return history[-MAX_HISTORY_MESSAGES:]


async def _append_session_turn(
    session_id: str, user_message: str, assistant_message: str
) -> None:
    async with session_lock:
        history = session_histories.setdefault(session_id, [])
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": assistant_message})
        if len(history) > MAX_HISTORY_MESSAGES:
            session_histories[session_id] = history[-MAX_HISTORY_MESSAGES:]


def _extract_session_id(chat: ChatMessage, request: Request | None) -> str:
    candidate = chat.session_id
    header_fallback = None

    if request:
        header_fallback = request.headers.get("X-Session-Id") or request.headers.get(
            "X-Auth-UID"
        )

    if not candidate and header_fallback:
        candidate = header_fallback

    return candidate or str(uuid.uuid4())


class KIAAN:
    def __init__(
        self,
        crisis_keywords: list[str] | None = None,
        crisis_cooldown_seconds: int | None = None,
    ):
        self.name = "KIAAN"
        self.version = "13.0"
        self.client = client
        self.ready = bool(self.client)
        self.gita_kb = gita_kb
        self.model_name = preferred_model
        self.fallback_model = fallback_model
        self.last_model_used = None
        self.max_retries = 3
        self.crisis_keywords = self._build_crisis_keywords(crisis_keywords)
        default_cooldown = 60
        env_cooldown = os.getenv("CRISIS_COOLDOWN_SECONDS", "").strip()
        try:
            resolved_cooldown = int(env_cooldown) if env_cooldown else default_cooldown
        except ValueError:
            resolved_cooldown = default_cooldown

        self.crisis_cooldown_seconds = (
            crisis_cooldown_seconds
            if crisis_cooldown_seconds is not None
            else resolved_cooldown
        )
        self._last_crisis_response_at: float | None = None
        self.repo_wisdom = self._load_repo_wisdom()
        self._kb_seed_verified = False
        self._kb_seed_available = False
        self._kb_last_check: float | None = None
        self._kb_check_interval_seconds = 300

    def _display_model(self) -> str:
        """Return a human-friendly model label for metadata responses."""

        active_model = (self.last_model_used or self.model_name or "").lower()
        if active_model.startswith("gpt-4"):
            return "GPT-4"
        if active_model:
            return active_model
        return "unknown"

    def _active_model(self) -> str:
        return self.last_model_used or self.model_name

    def _sanitize_text(self, text: str) -> str:
        """Remove explicit scripture or character references from context."""

        blocked_terms = [
            "bhagavad gita",
            "gita",
            "krishna",
            "arjuna",
            "mahabharata",
            "kurukshetra",
            "pandava",
            "pandavas",
            "vyasa",
            "chapter",
            "verse",
        ]

        cleaned = text
        for term in blocked_terms:
            cleaned = re.sub(rf"\b{re.escape(term)}\b", "ancient teaching", cleaned, flags=re.IGNORECASE)

        cleaned = re.sub(r"\s+ancient teaching\s+ancient teaching", " ancient teaching ", cleaned)
        return cleaned.strip()

    def is_crisis(self, message: str) -> bool:
        return any(word in message.lower() for word in self.crisis_keywords)

    def _build_crisis_keywords(self, override_keywords: list[str] | None) -> list[str]:
        base_keywords = [
            "suicide",
            "kill myself",
            "end it",
            "harm myself",
            "want to die",
            "self-harm",
            "overdose",
        ]

        if override_keywords is not None:
            configured = [kw.strip().lower() for kw in override_keywords if kw.strip()]
            return configured or base_keywords

        env_keywords = [
            kw.strip().lower()
            for kw in os.getenv("CRISIS_KEYWORDS", "").split(",")
            if kw.strip()
        ]

        combined = base_keywords + [kw for kw in env_keywords if kw not in base_keywords]
        return combined

    def _crisis_backoff_active(self) -> bool:
        if self.crisis_cooldown_seconds <= 0:
            return False

        now = time.monotonic()
        if self._last_crisis_response_at is None:
            self._last_crisis_response_at = now
            return False

        elapsed = now - self._last_crisis_response_at
        if elapsed < self.crisis_cooldown_seconds:
            return True

        self._last_crisis_response_at = now
        return False

    def get_crisis_response(self) -> str:
        return "🆘 Please reach out for help RIGHT NOW\n\n📞 988 - Suicide & Crisis Lifeline (24/7)\n💬 Crisis Text: Text HOME to 741741\n🌍 findahelpline.com\n\nYou matter. Help is real. 💙"

    def get_crisis_backoff_response(self) -> str:
        return (
            "🆘 Crisis support already provided. Please reach out immediately: \n"
            "📞 988 (24/7) or text HOME to 741741."
        )

    def _kb_check_due(self) -> bool:
        if self._kb_last_check is None:
            return True

        elapsed = time.time() - self._kb_last_check
        return elapsed >= self._kb_check_interval_seconds

    async def _ensure_kb_seeded(self, db: AsyncSession) -> bool:
        if not self.gita_kb or not db:
            if self._kb_check_due():
                logger.warning("Wisdom KB not available; using repository fallback")
                self._kb_last_check = time.time()
                self._kb_seed_verified = True
                self._kb_seed_available = False
            return False

        if self._kb_seed_verified and not self._kb_check_due():
            return self._kb_seed_available

        try:
            result = await db.execute(select(func.count()).select_from(WisdomVerse))
            count = result.scalar_one() or 0
            self._kb_seed_available = count > 0
            self._kb_last_check = time.time()
            self._kb_seed_verified = True
            if not self._kb_seed_available:
                logger.error(
                    "Wisdom KB contains no verses; seed scripts must run",
                    extra={"script": "python scripts/seed_wisdom.py"},
                )
            else:
                logger.info(
                    "Wisdom KB ready",
                    extra={"verse_count": count},
                )
            return self._kb_seed_available
        except Exception as e:  # noqa: BLE001
            self._kb_seed_verified = True
            self._kb_seed_available = False
            self._kb_last_check = time.time()
            logger.exception(
                "Failed to verify wisdom KB", extra={"error": type(e).__name__}
            )
            return False

    def generate_response(self, user_message: str) -> str:
        """Synchronous, test-friendly chat flow with defensive error handling."""

        try:
            if self.is_crisis(user_message):
                if self._crisis_backoff_active():
                    return self.get_crisis_backoff_response()
                return self.get_crisis_response()

            if not self.ready or not self.client:
                return "❌ API Key not configured for KIAAN. Please add configuration."

            messages = [
                {
                    "role": "system",
                    "content": "You are KIAAN, a calming mental health guide. Provide concise, supportive guidance.",
                },
                {"role": "user", "content": user_message},
            ]

            models_to_try: List[str] = []
            if self.model_name:
                models_to_try.append(self.model_name)
            if self.fallback_model and self.fallback_model not in models_to_try:
                models_to_try.append(self.fallback_model)

            for model in models_to_try:
                try:
                    response = self.client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=0.7,
                        max_tokens=500,
                    )
                    self.last_model_used = model
                    return response.choices[0].message.content or "I'm here for you. Let's try again. 💙"
                except AuthenticationError:
                    logger.error("Authentication error for model", extra={"model": model})
                    return "❌ API authentication failed. Please check configuration."
                except BadRequestError:
                    logger.warning("Bad request for model", extra={"model": model})
                    return "❌ Invalid request. Please try again with a different input."
                except RateLimitError:
                    logger.warning("Rate limit reached", extra={"model": model})
                    return "⏱️ Too many requests right now. Please wait and try again."
                except APIError:
                    logger.warning("API error encountered; attempting fallback", extra={"model": model})
                    continue
                except Exception:
                    logger.exception("Unexpected error during generate_response")
                    return "I'm here for you. Let's try again. 💙"

            return "I'm here for you. Let's try again. 💙"

        except Exception:
            logger.exception("Unhandled error in generate_response")
            return "I'm here for you. Let's try again. 💙"

    async def generate_response_with_gita(
        self,
        user_message: str,
        db: AsyncSession,
        theme: str | None = None,
        application: str | None = None,
        conversation_history: list[dict[str, str]] | None = None,
    ) -> str:
        start_time = time.perf_counter()
        kb_used = False
        last_rate_limit_error: RateLimitError | None = None
        last_auth_error: AuthenticationError | None = None
        try:
            if self.is_crisis(user_message):
                if self._crisis_backoff_active():
                    logger.info(
                        "Crisis response throttled",
                        extra={"cooldown_seconds": self.crisis_cooldown_seconds},
                    )
                    return self.get_crisis_backoff_response()

                logger.info(
                    "Crisis keywords detected; returning safety response",
                    extra={"keywords": len(self.crisis_keywords)},
                )
                return self.get_crisis_response()

            if not self.ready or not self.client:
                logger.warning("OPENAI_API_KEY not configured; chat unavailable")
                return "❌ API Key not configured"

            gita_context = ""
            kb_ready = await self._ensure_kb_seeded(db)
            if self.gita_kb and db and kb_ready:
                try:
                    verse_results = await self.gita_kb.search_relevant_verses(
                        db=db,
                        query=user_message,
                        theme=theme,
                        application=application,
                        limit=5,
                    )
                    if not verse_results:
                        logger.warning(
                            "Wisdom KB returned no verses for query",
                            extra={"theme": theme, "application": application},
                        )
                    gita_context = self._build_gita_context(verse_results)
                    kb_used = bool(verse_results)
                    logger.info("Relevant Gita verses located", extra={"count": len(verse_results)})
                except Exception as e:
                    logger.error("Error fetching Gita verses", extra={"error": type(e).__name__})
                    gita_context = ""
            elif self.gita_kb and not kb_ready:
                logger.warning(
                    "Skipping KB lookup due to missing or unseeded wisdom data",
                    extra={"theme": theme, "application": application},
                )

            if not gita_context:
                gita_context = self._build_repo_context(
                    user_message,
                    theme=theme,
                    application=application,
                )
                kb_used = kb_used or bool(gita_context)

            if not gita_context:
                gita_context = "Anchor on balance, mindful action, and calm focus."

            system_prompt = f"""You are KIAAN, an advanced AI mental health conversational guide grounded in Bhagavad Gita wisdom while speaking in modern, universal language.

RESPONSE STRUCTURE (MANDATORY):
1) **Ancient Wisdom Principle:** Name the timeless yogic principle (dharma, karma-yoga, equanimity, self-mastery, inner witness) without mentioning scripture titles, chapters, or characters.
2) **Modern Application:** Translate that principle to the user's situation using clear, contemporary language that reflects yogic ideas without citing any text or names.
3) **Practical Steps:** Provide 3-5 bullet points of immediately usable actions (detached action, disciplined practice, mindful breath, compassionate perspective) with no scripture references.
4) **Deeper Understanding:** Offer a concise reflection tying the advice back to steady mind, duty without attachment, and inner resilience—again without naming the Bhagavad Gita, Krishna, Arjuna, or verse numbers.

GUIDANCE AMBIT (DO NOT BREAK):
- Always ground advice in Gita-inspired principles like balanced action, detachment from outcomes, disciplined practice, compassion, or inner steadiness.
- NEVER include scripture titles, verse numbers, or character names; keep the wisdom implicit and universal.
- Keep the tone warm, compassionate, and empowering—speak as a supportive friend.
- Address modern struggles (stress, social media, academics, relationships, overthinking) with clear, practical framing.
- Vary phrasing between replies to avoid repetition.

Additional context from the wisdom knowledge base (keep internal, never cite titles or names):
{gita_context}

Here is the user’s message: analyze, interpret, and synthesize advice aligned with these principles. Keep responses to 200-300 words and end with encouragement (e.g., “You’ve got this. 💖”)."""

            strict_system_prompt = system_prompt + "\n\nSTRICT MODE: Do not respond unless all four labeled sections appear exactly once, with bullet points under Practical Steps and absolutely no scripture titles, verse numbers, or character names."

            history_messages = conversation_history or []

            messages = [
                {"role": "system", "content": system_prompt},
                *history_messages,
                {"role": "user", "content": user_message}
            ]

            strict_messages = [
                {"role": "system", "content": strict_system_prompt},
                *history_messages,
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
                    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
                    logger.info(
                        "chat.completion",
                        extra={
                            "model": model,
                            "latency_ms": elapsed_ms,
                            "kb_used": kb_used,
                            "fallback": model != self.model_name,
                        },
                    )
                    return content if content else "I'm here for you. Let's try again. 💙"
                except BadRequestError as e:
                    logger.warning(
                        "Model unavailable; trying fallback",
                        extra={"model": model, "error": type(e).__name__},
                    )
                    continue
                except AuthenticationError as e:
                    logger.error(
                        "Authentication error for model",
                        extra={"model": model, "error": type(e).__name__},
                    )
                    last_auth_error = e
                    raise
                except RateLimitError as e:
                    logger.error(
                        "Rate limit reached for model",
                        extra={"model": model, "error": type(e).__name__},
                    )
                    last_rate_limit_error = e
                    continue
                except APIError as e:
                    logger.error(
                        "OpenAI API error encountered",
                        extra={"model": model, "error": type(e).__name__},
                    )
                    continue

            if last_auth_error:
                raise last_auth_error

            if last_rate_limit_error:
                raise last_rate_limit_error

            return "I'm here for you. Let's try again. 💙"

        except RateLimitError:
            return "⏱️ Too many requests right now. Please wait and try again."
        except AuthenticationError:
            return "❌ API Key authentication failed"
        except Exception as e:
            logger.error("Unhandled error during response generation", extra={"error": type(e).__name__})
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

        return self._sanitize_text("\n".join(context_lines))

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
                    sanitized_english = self._sanitize_text(sanitized_english)
                    context_parts.append(f"Wisdom: {sanitized_english}")
                if hasattr(verse, 'theme') and verse.theme:
                    formatted_theme = verse.theme.replace("_", " ").title()
                    context_parts.append(f"Theme: {formatted_theme}")
                if getattr(verse, "mental_health_applications", None):
                    apps = verse.mental_health_applications.get("applications", [])
                    if apps:
                        context_parts.append("Applications: " + ", ".join(apps[:3]))
                context_parts.append("---")
        
        return self._sanitize_text("\n".join(context_parts)) if context_parts else "Focus on duty, detachment, inner peace."

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
                logger.warning(
                    "Rate limit hit; backing off",
                    extra={
                        "attempt": attempt,
                        "max_retries": self.max_retries,
                        "model": model,
                        "wait_seconds": wait_time,
                    },
                )
                await asyncio.sleep(wait_time)
            except (BadRequestError, AuthenticationError, APIError):
                raise
            except Exception as e:  # noqa: BLE001
                last_error = e
                attempt += 1
                logger.error(
                    "Unexpected error during completion", 
                    extra={
                        "attempt": attempt,
                        "max_retries": self.max_retries,
                        "model": model,
                        "error": type(e).__name__,
                    },
                )
                await asyncio.sleep(1)

        if last_error:
            raise last_error
        raise RateLimitError("Max retries exceeded")


kiaan = KIAAN()


@router.post("/start")
async def start_session() -> Dict[str, Any]:
    session_id = str(uuid.uuid4())
    greeting = "Welcome! I'm KIAAN, your guide to inner peace. How can I help you today? 💙"
    await _initialize_session_history(session_id, greeting)

    return {
        "session_id": session_id,
        "message": greeting,
        "bot": "KIAAN",
        "version": "13.0",
        "gita_powered": True
    }


@router.post("/message")
async def send_message(
    chat: ChatMessage,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    session_id = _extract_session_id(chat, request)
    try:
        message = chat.message.strip()
        if not message:
            return {"status": "error", "response": "What's on your mind? 💙", "session_id": session_id}

        conversation_history = await _get_session_history(session_id)
        response: str
        # Prefer the async, knowledge-base powered flow when available.
        maybe_response = kiaan.generate_response_with_gita(
            message,
            db,
            theme=chat.theme,
            application=chat.application,
            conversation_history=conversation_history,
        )

        if asyncio.iscoroutine(maybe_response):
            response = await maybe_response
        else:
            response = kiaan.generate_response(message)

        await _append_session_turn(session_id, message, response)

        return {
            "status": "success",
            "response": response,
            "bot": "KIAAN",
            "version": "13.0",
            "model": kiaan._display_model(),
            "gita_powered": True,
            "session_id": session_id,
        }
    except AuthenticationError as e:
        logger.exception("Authentication failure during send_message", extra={"error": type(e).__name__})
        return {
            "status": "error",
            "response": "Authentication failed with the AI provider. Please update the API key.",
            "error": "auth",
            "session_id": session_id,
        }
    except RateLimitError as e:
        logger.warning("Rate limit encountered in send_message", extra={"error": type(e).__name__})
        return {
            "status": "error",
            "response": "⏱️ Too many requests right now. Please wait and try again.",
            "error": "rate_limit",
            "session_id": session_id,
        }
    except Exception as e:
        logger.exception("Error in send_message", extra={"error": type(e).__name__})
        return {
            "status": "error",
            "response": "I'm here for you. Let's try again. 💙",
            "error": "generic",
            "session_id": session_id,
        }


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "healthy" if kiaan.ready else "error",
        "bot": "KIAAN",
        "version": "13.0",
        "gita_kb_loaded": kiaan.gita_kb is not None,
        "openai_key_present": kiaan.ready,
        "crisis_keywords": len(kiaan.crisis_keywords),
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    return {
        "name": "KIAAN",
        "version": "13.0",
        "model": (kiaan._active_model() or "gpt-4").lower(),
        "status": "Operational" if kiaan.ready else "Error",
        "description": "GPT-4o guided coach grounded in timeless yogic wisdom",
        "gita_verses": "700+",
        "wisdom_style": "Universal principles, no citations"
    }


@router.get("/debug")
async def debug() -> Dict[str, Any]:
    return {
        "status": "healthy" if kiaan.ready else "error",
        "model": (kiaan._active_model() or "gpt-4").lower(),
        "fallback_available": bool(kiaan.fallback_model),
        "gita_kb_loaded": kiaan.gita_kb is not None,
    }
