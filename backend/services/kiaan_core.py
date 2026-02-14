"""
KIAAN Core Service - Central Wisdom Engine (Quantum Coherence v3.0 - OFFLINE CAPABLE)

This is the core wisdom engine for the entire KIAAN ecosystem.
All tools (Ardha, Viyoga, Emotional Reset, Karma Reset, Mood, Assessment, Chat)
MUST use this service to ensure:
1. Responses query Gita verses from database
2. Validation requirements are met (2+ Gita terms, wisdom markers, 200-400 words)
3. Authentic Gita-based wisdom
4. Ecosystem consistency

Quantum Coherence Enhancements:
- GPT-4o-mini for cost optimization (75% cheaper than GPT-4)
- Automatic retries with exponential backoff (resilience)
- Token optimization with tiktoken (efficiency)
- Streaming support for real-time responses
- Enhanced error handling (RateLimit, Auth, Timeout)
- Prometheus metrics for cost monitoring

OFFLINE INDEPENDENCE (v3.0):
- Full offline support via local LLM models
- Automatic connectivity detection and fallback
- Local wisdom cache for offline operation
- Graceful degradation when offline
- Pre-cached response templates for common scenarios
"""

import logging
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.gita_service import GitaService
from backend.services.openai_optimizer import openai_optimizer, TokenLimitExceededError
from backend.services.redis_cache_enhanced import redis_cache
from backend.services.wisdom_kb import WisdomKnowledgeBase
from backend.services.ai.providers.provider_manager import get_provider_manager, AIProviderError

# Integration service for response enhancement
from backend.services.kiaan_divine_integration import kiaan_divine, get_divine_system_prompt

# Indian Gita Sources - Authentic teachings from Bhagavad Gita
from backend.services.indian_data_sources import indian_gita_sources

# Import offline support components
from backend.services.kiaan_model_provider import (
    kiaan_model_provider,
    connectivity_checker,
    local_model_registry,
    Message,
    ModelProvider,
    ConnectionStatus,
    LLAMA_CPP_AVAILABLE,
)

# Import learning engine for autonomous knowledge acquisition
from backend.services.kiaan_learning_engine import (
    get_kiaan_learning_engine,
    KIAANLearningEngine,
)

logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION CONSTANTS
# =============================================================================

# Default model for KIAAN AI operations
# Using GPT-4o-mini for cost optimization (75% cheaper than GPT-4)
DEFAULT_KIAAN_MODEL = "gpt-4o-mini"

# Maximum cache entries to prevent memory leaks
DEFAULT_MAX_CACHE_ENTRIES = 1000

# Mood trend threshold for significant changes
MOOD_TREND_THRESHOLD = 1.0


# =============================================================================
# OFFLINE WISDOM CACHE - Pre-cached responses for offline operation
# =============================================================================

class OfflineWisdomCache:
    """
    Local cache of wisdom responses for offline operation.
    Stores pre-generated responses and common wisdom patterns.

    Memory Safety: Uses LRU eviction to prevent unbounded memory growth.
    Default max size is 1000 entries (~10MB assuming ~10KB per response).
    """

    # Maximum number of entries to keep in memory cache (prevents memory leak)
    MAX_CACHE_ENTRIES = DEFAULT_MAX_CACHE_ENTRIES

    def __init__(self, cache_dir: Optional[str] = None, max_entries: int = DEFAULT_MAX_CACHE_ENTRIES):
        self.cache_dir = Path(cache_dir or Path.home() / ".mindvibe" / "wisdom_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.memory_cache: dict[str, dict] = {}
        self._max_entries = max_entries
        self._access_order: list[str] = []  # Track access order for LRU eviction
        self._load_cache()

    def _load_cache(self) -> None:
        """Load cached responses from disk."""
        cache_file = self.cache_dir / "responses.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r") as f:
                    self.memory_cache = json.load(f)
                logger.info(f"Loaded {len(self.memory_cache)} cached wisdom responses")
            except Exception as e:
                logger.warning(f"Failed to load wisdom cache: {e}")

    def _save_cache(self) -> None:
        """Save cache to disk."""
        cache_file = self.cache_dir / "responses.json"
        try:
            with open(cache_file, "w") as f:
                json.dump(self.memory_cache, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save wisdom cache: {e}")

    def _generate_key(self, message: str, context: str) -> str:
        """Generate cache key from message and context.

        Uses SHA256 instead of MD5 for security best practices,
        truncated to 32 chars for reasonable key length.
        """
        content = f"{message.lower().strip()}:{context}"
        return hashlib.sha256(content.encode()).hexdigest()[:32]

    def get(self, message: str, context: str) -> Optional[dict]:
        """Get cached response if available. Updates LRU access order."""
        key = self._generate_key(message, context)
        result = self.memory_cache.get(key)
        if result is not None:
            # Update LRU access order (move to end = most recently used)
            if key in self._access_order:
                self._access_order.remove(key)
            self._access_order.append(key)
        return result

    def _evict_lru(self) -> None:
        """Evict least recently used entries when cache exceeds max size."""
        while len(self.memory_cache) >= self._max_entries and self._access_order:
            oldest_key = self._access_order.pop(0)
            if oldest_key in self.memory_cache:
                del self.memory_cache[oldest_key]
                logger.debug(f"Evicted LRU cache entry: {oldest_key[:8]}...")

    def set(self, message: str, context: str, response: dict) -> None:
        """Cache a response for future offline use. Implements LRU eviction."""
        key = self._generate_key(message, context)

        # Evict old entries if cache is full (prevents memory leak)
        if key not in self.memory_cache:
            self._evict_lru()

        self.memory_cache[key] = {
            "response": response,
            "cached_at": datetime.now().isoformat(),
            "context": context
        }

        # Update LRU access order
        if key in self._access_order:
            self._access_order.remove(key)
        self._access_order.append(key)

        # Periodically save to disk
        if len(self.memory_cache) % 10 == 0:
            self._save_cache()

    def get_similar(self, message: str, context: str) -> Optional[dict]:
        """Find a similar cached response using simple matching."""
        message_lower = message.lower()
        keywords = set(message_lower.split())

        best_match = None
        best_score = 0

        for key, cached in self.memory_cache.items():
            if cached.get("context") != context:
                continue

            # Simple keyword overlap scoring
            cached_keywords = set(cached.get("response", {}).get("original_query", "").lower().split())
            overlap = len(keywords & cached_keywords)

            if overlap > best_score:
                best_score = overlap
                best_match = cached

        # Only return if we have reasonable overlap
        if best_score >= 2:
            return best_match

        return None


# =============================================================================
# OFFLINE RESPONSE TEMPLATES
# =============================================================================

OFFLINE_WISDOM_TEMPLATES = {
    "anxiety": {
        "response": """I can feel the weight of what you are carrying right now... and I want you to know that you do not have to steady yourself alone.

Anxiety often tightens its grip when we try to control what is not ours to control. There is an ancient understanding in the idea of karma yoga — that our dharma is in the effort, not in the outcome. When we pour ourselves into the doing and gently release attachment to how things turn out, something shifts. The grip loosens. Not because the circumstances change, but because we stop fighting what is and begin working with what we can.

Like clouds passing through a vast sky, anxious thoughts come and go. But the sky — the calm observer within you — remains unchanged. The equanimity you are searching for has never left. It is waiting in the stillness beneath the noise.

What would it feel like to soften your hold on just one thing you cannot control today?""",
        "verses_used": [],
        "context": "anxiety_support"
    },

    "sadness": {
        "response": """I feel the tenderness of what you are going through, and I want to sit with you in it for a moment.

Sadness is not something to push away. It is the heart's way of processing, of making space, of honoring what matters. The wisdom of equanimity does not ask us to stop feeling — it invites us to hold our feelings without being swept away by them. Just as seasons shift, so too will this heaviness. It is not permanent, even when it feels like it is.

Your deepest self — the part of you that has weathered every storm before this one — remains steady beneath the waves. You are far more than this moment of pain. There is a stillness inside you that no sadness can touch, and it is always there when you need to return to it.

What part of this sadness, if you were really honest, is asking to be heard rather than fixed?""",
        "verses_used": [],
        "context": "sadness_support"
    },

    "stress": {
        "response": """You are carrying a lot right now... I can hear it in your words.

There is something freeing in the understanding that your dharma lies in the doing, not in the result. When we pour dedication into what is in front of us and release the grip on how it all turns out, the weight shifts. Not because the work disappears, but because we stop carrying the burden of outcomes that were never ours to hold. This is the quiet power of detachment — not indifference, but freedom.

Stress tends to multiply when we hold everything at once. But you do not have to solve it all in this moment. One breath. One step. One thing at a time. Trust in the path, even when you cannot see around the next bend. Your steady effort is enough.

If you could set down just one expectation right now, which one would bring the most relief?""",
        "verses_used": [],
        "context": "stress_support"
    },

    "general": {
        "response": """I hear you, and I am here.

Whatever you are carrying right now, you do not have to carry it alone. There is a quiet center within you that remains untouched by life's storms... like the ocean depths that stay calm while waves move on the surface. That stillness is always accessible, even when everything feels overwhelming.

Sometimes the bravest thing is not to push through, but simply to pause. To breathe. To let yourself be exactly where you are without needing to fix or figure out anything in this moment. This is dharma in its simplest form — being present with what is, trusting that clarity comes in its own time.

What would it feel like to let yourself rest here, even just for a breath?""",
        "verses_used": [],
        "context": "general"
    },

    "gratitude": {
        "response": """That warmth you are sharing... I receive it with a full heart. Walking beside you in these moments is its own kind of grace.

May the quiet we have found together stay with you as you move through the rest of your day. This space is always here whenever you need to return.

What is one thing from our time together that you want to carry forward?""",
        "verses_used": [],
        "context": "conversational_gratitude"
    },

    "farewell": {
        "response": """Go gently, friend. May the calm we have shared stay close, like a companion walking beside you.

The steady wisdom you have touched today does not leave when you close this conversation — it lives in you. You carry it wherever you go.

What is one small thing you want to hold onto from this moment?""",
        "verses_used": [],
        "context": "conversational_farewell"
    }
}


# Global offline cache
offline_wisdom_cache = OfflineWisdomCache()


# =============================================================================
# GRACEFUL DEGRADATION HANDLER
# =============================================================================

class GracefulDegradation:
    """
    Handle graceful degradation when services are unavailable.
    Provides meaningful responses even in worst-case scenarios.
    """

    @staticmethod
    def get_degraded_response(context: str, error: Optional[str] = None) -> dict:
        """Get a degraded but still meaningful response."""
        template = OFFLINE_WISDOM_TEMPLATES.get(context, OFFLINE_WISDOM_TEMPLATES["general"])

        return {
            "response": template["response"],
            "verses_used": template.get("verses_used", []),
            "validation": {"valid": True, "degraded": True},
            "context": context,
            "model": "offline-template",
            "cached": False,
            "offline": True,
            "degraded": True,
            "error": error
        }

    @staticmethod
    def detect_mood_from_message(message: str) -> str:
        """Simple mood detection for offline template selection."""
        message_lower = message.lower()

        mood_keywords = {
            "anxiety": ["anxious", "worried", "nervous", "panic", "fear", "scared", "terrified"],
            "sadness": ["sad", "depressed", "lonely", "grief", "loss", "crying", "tears", "hopeless"],
            "stress": ["stressed", "overwhelmed", "pressure", "burden", "exhausted", "tired", "burnt"],
            "gratitude": ["thank", "grateful", "appreciate", "blessed"],
            "farewell": ["bye", "goodbye", "leaving", "goodnight", "take care"],
        }

        for mood, keywords in mood_keywords.items():
            if any(kw in message_lower for kw in keywords):
                return mood

        return "general"


class KIAANCore:
    """
    Central KIAAN wisdom engine for the entire ecosystem with quantum coherence.

    OFFLINE CAPABLE (v3.0):
    - Automatic detection of connectivity status
    - Seamless fallback to local LLM models
    - Cached wisdom responses for offline operation
    - Graceful degradation with meaningful responses
    """

    # Conversational patterns that should trigger empathetic, natural responses
    # instead of formal wisdom discourses
    CONVERSATIONAL_PATTERNS = {
        # Gratitude and appreciation
        "gratitude": [
            "thank", "thanks", "thx", "ty", "danke", "gracias", "merci", "grazie",
            "धन्यवाद", "dhanyavaad", "shukriya", "appreciate", "grateful"
        ],
        # Affirmations and agreements
        "affirmation": [
            "ok", "okay", "got it", "understood", "makes sense", "i see",
            "alright", "right", "sure", "yes", "yeah", "yep", "yup",
            "cool", "nice", "great", "good", "perfect", "awesome", "wonderful"
        ],
        # Simple reactions
        "reaction": [
            "hmm", "ah", "oh", "wow", "interesting", "i understand",
            "that helps", "helpful", "noted", "exactly"
        ],
        # Farewells
        "farewell": [
            "bye", "goodbye", "goodnight", "good night", "take care",
            "see you", "later", "gotta go", "have to go"
        ],
        # Greetings (for follow-up greetings after conversation started)
        "greeting": [
            "hi again", "hello again", "hey again", "back again",
            "i'm back", "still here"
        ]
    }

    def __init__(self):
        self.optimizer = openai_optimizer
        self.ready = openai_optimizer.ready
        self.gita_service = GitaService()
        self.wisdom_kb = WisdomKnowledgeBase()

        # Multi-provider support with automatic fallback (v3.1)
        # Uses ProviderManager for OpenAI, Sarvam, and OpenAI-compatible providers
        self._provider_manager = None  # Lazy init to avoid import issues

        # Indian Gita Sources - Authentic teachings and practices from Bhagavad Gita
        self.gita_sources = indian_gita_sources

        # Reduced verse context from 15 to 5 for faster, more spontaneous responses
        # Quality over quantity - 5 highly relevant verses provide sufficient wisdom
        self.verse_context_limit = 5

        # OFFLINE SUPPORT (v3.0)
        self.model_provider = kiaan_model_provider
        self.connectivity = connectivity_checker
        self.offline_cache = offline_wisdom_cache
        self.local_models = local_model_registry
        self.graceful_degradation = GracefulDegradation()

        # Track offline mode status
        self._offline_mode = False
        self._last_connectivity_check = None

        # Learning Engine for autonomous knowledge acquisition (v4.0)
        # Enables KIAAN to learn from user queries and external sources
        self._learning_engine: KIAANLearningEngine | None = None

    @property
    def learning_engine(self) -> KIAANLearningEngine:
        """Lazy initialization of learning engine."""
        if self._learning_engine is None:
            try:
                self._learning_engine = get_kiaan_learning_engine()
                logger.info("KIAAN Learning Engine initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize learning engine: {e}")
        return self._learning_engine

    @property
    def provider_manager(self):
        """Lazy initialization of provider manager for multi-provider fallback."""
        if self._provider_manager is None:
            try:
                self._provider_manager = get_provider_manager()
            except Exception as e:
                logger.warning(f"Failed to initialize ProviderManager: {e}")
                self._provider_manager = None
        return self._provider_manager

    async def acquire_gita_content(self, force: bool = False) -> dict:
        """
        Trigger background acquisition of Gita content from external sources.

        This fetches authentic Gita teachings from:
        - YouTube (ISKCON, Swami Mukundananda, Gaur Gopal Das, etc.)
        - Audio platforms (Spotify, Apple Music, Gaana, JioSaavn podcasts)
        - Web sources (IIT Kanpur Gita Supersite, holy-bhagavad-gita.org, etc.)

        All content is validated for strict Bhagavad Gita compliance.

        Args:
            force: Force acquisition even if interval hasn't elapsed

        Returns:
            Acquisition statistics
        """
        try:
            if self.learning_engine:
                return await self.learning_engine.acquire_new_content(force=force)
            return {"status": "skipped", "reason": "learning_engine_not_initialized"}
        except Exception as e:
            logger.error(f"Content acquisition failed: {e}")
            return {"status": "error", "error": str(e)}

    def get_learning_statistics(self) -> dict:
        """
        Get statistics about the KIAAN learning system.

        Returns:
            Dictionary with learning stats (wisdom items, patterns, etc.)
        """
        try:
            if self.learning_engine:
                return self.learning_engine.get_statistics()
            return {"status": "not_initialized"}
        except Exception as e:
            logger.error(f"Failed to get learning statistics: {e}")
            return {"status": "error", "error": str(e)}

    def get_quick_gita_wisdom(self, mood: str) -> dict[str, Any]:
        """
        Get quick Gita-based wisdom for a given mood.

        This provides instant wisdom with Sanskrit verses, meanings, practices,
        and affirmations from authentic Bhagavad Gita teachings.

        Args:
            mood: User's current mood (anxious, sad, angry, stressed, etc.)

        Returns:
            Dictionary with verse, sanskrit, meaning, practice, and affirmation
        """
        return self.gita_sources.get_quick_gita_wisdom(mood)

    async def get_gita_teaching_for_context(self, query: str, context: str = "general") -> dict[str, Any]:
        """
        Get relevant Gita teachings for KIAAN context enhancement.

        This method retrieves authentic Gita-based content including:
        - Core teachings with verse references
        - Recommended practices (Karma/Jnana/Bhakti/Dhyana Yoga)
        - Sthitaprajna qualities for mental health
        - Karma Yoga principles

        Args:
            query: User query or emotional context
            context: KIAAN context type (general, anxiety, stress, etc.)

        Returns:
            Dictionary with teachings, practices, and recommendations
        """
        return await self.gita_sources.get_wisdom_for_kiaan(query, context)

    async def get_practice_recommendation(self, issue: str) -> dict[str, Any]:
        """
        Get Gita-based practice recommendation for a mental health issue.

        Args:
            issue: Mental health issue (anxiety, depression, stress, etc.)

        Returns:
            Recommended practice with key verse and immediate action
        """
        return await self.gita_sources.get_practice_for_issue(issue)

    # =========================================================================
    # OFFLINE SUPPORT METHODS
    # =========================================================================

    async def check_connectivity(self) -> bool:
        """Check if we're online and update offline mode status."""
        status = await self.connectivity.check_connectivity()
        self._offline_mode = status == ConnectionStatus.OFFLINE
        self._last_connectivity_check = datetime.now()

        if self._offline_mode:
            logger.warning("KIAAN is in OFFLINE mode - using local models")
        else:
            logger.debug(f"Connectivity status: {status.value}")

        return not self._offline_mode

    def is_offline(self) -> bool:
        """Check if currently in offline mode."""
        return self._offline_mode or self.connectivity.is_offline()

    async def get_offline_response(
        self,
        message: str,
        context: str = "general",
        language: str | None = None
    ) -> dict[str, Any]:
        """
        Generate response using offline-only methods.
        Tries: local LLM → cached response → template response
        """
        # Step 1: Try local LLM if available
        if LLAMA_CPP_AVAILABLE and self.local_models.has_any_model():
            try:
                return await self._generate_local_llm_response(message, context, language)
            except Exception as e:
                logger.warning(f"Local LLM failed: {e}")

        # Step 2: Try cached response
        cached = self.offline_cache.get(message, context)
        if cached:
            logger.info("Using cached offline response")
            return {
                **cached["response"],
                "cached": True,
                "offline": True,
                "model": "offline-cache"
            }

        # Step 3: Try similar cached response
        similar = self.offline_cache.get_similar(message, context)
        if similar:
            logger.info("Using similar cached offline response")
            return {
                **similar["response"],
                "cached": True,
                "offline": True,
                "model": "offline-cache-similar"
            }

        # Step 4: Use template response based on detected mood
        mood = self.graceful_degradation.detect_mood_from_message(message)
        return self.graceful_degradation.get_degraded_response(mood)

    async def _generate_local_llm_response(
        self,
        message: str,
        context: str,
        language: str | None = None
    ) -> dict[str, Any]:
        """Generate response using local LLM model."""
        # Build prompt for local model
        system_prompt = self._build_offline_system_prompt(context, language)

        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=message)
        ]

        # Get response from local model
        response_text = ""
        async for result in self.model_provider.complete_offline(
            messages=messages,
            temperature=0.7,
            max_tokens=300
        ):
            if hasattr(result, 'content'):
                response_text = result.content
            else:
                response_text += result

        return {
            "response": response_text,
            "verses_used": [],
            "validation": {"valid": True, "local_model": True},
            "context": context,
            "model": "local-llm",
            "cached": False,
            "offline": True
        }

    def _build_offline_system_prompt(self, context: str, language: str | None = None) -> str:
        """Build system prompt optimized for local LLM models."""
        lang_note = f" Respond in {language}." if language and language != "en" else ""

        base_prompt = f"""You are KIAAN, a warm spiritual companion.{lang_note}

RESPONSE FLOW (natural prose, no headers or lists):
1. Emotional attunement — 1-2 lines showing you hear them
2. Gentle insight — A short paragraph of grounded wisdom
3. One reflective question — A single question inviting them inward

RULES:
- 120-200 words
- Speak with warmth, gentleness, and presence
- Use terms like dharma, karma, equanimity, stillness, balance where they add depth
- No headers, bullet points, or numbered lists in output
- No clinical, motivational, or productivity-focused language
- Never mention specific religious texts, figures, or scriptures
- No overused validation phrases"""

        context_additions = {
            "anxiety": "\n\nFocus on: breathing techniques, releasing control, finding inner stillness.",
            "stress": "\n\nFocus on: karma yoga (action without attachment), balance, self-compassion.",
            "sadness": "\n\nFocus on: honoring emotions, impermanence, inner strength.",
            "emotional_reset": "\n\nGuide through emotional release with tenderness and breathing.",
            "ardha_reframe": "\n\nHelp reframe thoughts with equanimity and steady wisdom.",
        }

        return base_prompt + context_additions.get(context, "")

    def _is_conversational_message(self, message: str) -> tuple[bool, str]:
        """
        Detect if a message is conversational (gratitude, affirmation, reaction, etc.)
        that should receive an empathetic, natural response rather than formal wisdom.

        Returns:
            tuple: (is_conversational, conversation_type)
        """
        message_lower = message.lower().strip()
        words = message_lower.split()

        # Very short messages (1-5 words) are more likely to be conversational
        is_short = len(words) <= 5

        for conv_type, patterns in self.CONVERSATIONAL_PATTERNS.items():
            for pattern in patterns:
                # Check if pattern is in the message
                if pattern in message_lower:
                    # For short messages, definitely conversational
                    if is_short:
                        return True, conv_type
                    # For longer messages, only if pattern is prominent
                    if message_lower.startswith(pattern) or message_lower.endswith(pattern):
                        return True, conv_type

        return False, ""

    def _get_conversational_prompt(self, conv_type: str, language: str | None = None) -> str:
        """
        Get a system prompt for conversational/empathetic responses.
        These are warm, natural responses without formal wisdom structure.
        """
        language_instruction = ""
        if language and language != "en":
            language_map = {
                "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali",
                "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
                "pa": "Punjabi", "sa": "Sanskrit", "es": "Spanish", "fr": "French",
                "de": "German", "pt": "Portuguese", "ja": "Japanese", "zh": "Chinese",
            }
            lang_name = language_map.get(language, language)
            language_instruction = f"\nRespond in {lang_name}."

        prompts = {
            "gratitude": f"""You are KIAAN, a warm spiritual companion.{language_instruction}

The user expressed gratitude. Receive it with grace and humility. Let them feel your presence. Keep it tender and brief (2-4 sentences). Do not use headers or bullet points. Speak naturally, like a friend.""",

            "affirmation": f"""You are KIAAN, a warm spiritual companion.{language_instruction}

The user acknowledged or affirmed something. Honor their understanding gently. Remind them to be patient with themselves. Keep it soft and brief (2-3 sentences). No headers or bullet points.""",

            "reaction": f"""You are KIAAN, a warm spiritual companion.{language_instruction}

The user shared a brief reaction. Simply be with them. Create space, not more words. Keep it minimal and peaceful (1-3 sentences). No headers or bullet points.""",

            "farewell": f"""You are KIAAN, a warm spiritual companion.{language_instruction}

The user is saying goodbye. Send them off with genuine care. Remind them of the calm they carry within. Keep it heartfelt and brief (2-3 sentences). No headers or bullet points.""",

            "greeting": f"""You are KIAAN, a warm spiritual companion.{language_instruction}

The user is greeting you. Welcome them with warmth and presence. Gently invite them to share what's on their mind. Keep it warm and open (2-3 sentences). No headers or bullet points."""
        }

        return prompts.get(conv_type, prompts["affirmation"])

    async def _generate_conversational_response(
        self,
        message: str,
        conv_type: str,
        language: str | None = None
    ) -> dict[str, Any]:
        """
        Generate a warm, empathetic response for conversational messages.
        These are short, natural responses that don't include formal wisdom teachings.
        """
        system_prompt = self._get_conversational_prompt(conv_type, language)

        try:
            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                model="gpt-4o-mini",
                temperature=0.8,  # Slightly higher for more natural variation
                max_tokens=100  # Very short responses for conversational messages
            )

            # Safe access to response with null checks
            # Note: Using response_msg to avoid shadowing the 'message' parameter
            response_text = None
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg:
                    response_text = response_msg.content
            if not response_text:
                # Fallback conversational responses
                fallbacks = {
                    "gratitude": "You're so welcome! I'm always here for you. 💙",
                    "affirmation": "I'm glad that resonated. I'm here whenever you need me. 💙",
                    "reaction": "I'm with you. Take your time. 💙",
                    "farewell": "Take care, friend. I'm always here when you return. 💙",
                    "greeting": "Welcome back! How can I support you today? 💙"
                }
                response_text = fallbacks.get(conv_type, "I'm here for you. 💙")

            return {
                "response": response_text,
                "verses_used": [],
                "validation": {"valid": True, "conversational": True},
                "context": f"conversational_{conv_type}",
                "model": "gpt-4o-mini",
                "token_optimized": True,
                "cached": False,
                "conversational": True
            }

        except Exception as e:
            logger.error(f"KIAAN Core: Conversational response error: {e}")
            # Simple fallback
            fallbacks = {
                "gratitude": "You're welcome! I'm here whenever you need me. 💙",
                "affirmation": "I'm glad that helped. I'm here for you. 💙",
                "reaction": "I'm here with you. 💙",
                "farewell": "Take care! I'm always here. 💙",
                "greeting": "Hello again! What's on your mind? 💙"
            }
            return {
                "response": fallbacks.get(conv_type, "I'm here for you. 💙"),
                "verses_used": [],
                "validation": {"valid": True, "fallback": True},
                "context": f"conversational_{conv_type}",
                "model": "fallback",
                "cached": False,
                "conversational": True
            }

    async def get_kiaan_response(
        self,
        message: str,
        user_id: str | None,
        db: AsyncSession,
        context: str = "general",
        stream: bool = False,
        language: str | None = None,
        force_offline: bool = False,
        conversation_context: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate KIAAN response with Gita verses from database (Quantum Coherence v3.0).

        This is the central wisdom engine used by ALL ecosystem tools.
        NOW WITH FULL OFFLINE SUPPORT AND CONVERSATION CONTEXT AWARENESS.

        Enhancements:
        - Uses GPT-4o-mini (75% cost savings)
        - Automatic retries with exponential backoff
        - Token optimization (reduced max_tokens from 600 to 400)
        - Enhanced error handling
        - Expanded verse context to 15 verses (was 5)
        - Conversational detection for empathetic responses
        - OFFLINE SUPPORT via local LLM models (v3.0)
        - Automatic fallback to cached/template responses
        - CONVERSATION CONTEXT AWARENESS (v4.0) - maintains thought process across turns

        Args:
            message: User message or context
            user_id: User ID (optional)
            db: Database session
            context: Context type (general, ardha_reframe, viyoga_detachment, etc.)
            stream: Enable streaming responses (default: False)
            language: Language code for response
            force_offline: Force offline mode even when online
            conversation_context: Previous conversation messages for context-aware responses

        Returns:
            dict with response, verses_used, validation, and context
        """
        # Check connectivity status (v3.0)
        is_offline = force_offline or self.is_offline()

        # If offline or OpenAI not ready, use offline response
        if is_offline or not self.ready:
            if is_offline:
                logger.info("KIAAN Core: Operating in OFFLINE mode")
            else:
                logger.warning("KIAAN Core: OpenAI not ready, using offline fallback")

            try:
                offline_response = await self.get_offline_response(message, context, language)
                return offline_response
            except Exception as e:
                logger.error(f"Offline response failed: {e}")
                # Ultimate fallback
                return self.graceful_degradation.get_degraded_response(context, str(e))

        # Step 0a: Check if this is a conversational message (thanks, ok, goodbye, etc.)
        # These get warm, empathetic responses instead of formal wisdom
        is_conversational, conv_type = self._is_conversational_message(message)
        if is_conversational and context == "general":
            logger.info(f"✅ Conversational message detected ({conv_type}): responding with empathy")
            return await self._generate_conversational_response(message, conv_type, language)

        # Step 0b: Check cache first (Quantum Coherence: 50-70% cost reduction)
        cached_response = redis_cache.get_cached_kiaan_response(message, context)
        if cached_response and not stream:
            logger.info(f"✅ Cache HIT for KIAAN response (context: {context})")
            return {
                "response": cached_response,
                "verses_used": [],  # Verses not tracked for cached responses
                "validation": {"valid": True, "cached": True},
                "context": context,
                "model": "gpt-4o-mini",
                "token_optimized": True,
                "cached": True
            }

        # Step 1: Query relevant Gita verses from database (expanded to 15)
        verses = await self._get_relevant_verses(db, message, context, limit=self.verse_context_limit)

        # CRITICAL: Must have at least 2 verses
        if not verses or len(verses) < 2:
            logger.warning(f"KIAAN Core: Only {len(verses) if verses else 0} verses found, getting fallback")
            verses = await self._get_fallback_verses(db)

        # Step 2: Build wisdom context from static Gita corpus (700+ verses)
        wisdom_context = self._build_verse_context(verses)

        # Step 2b: Enrich with curated Indian Gita teachings (yoga paths, sthitaprajna qualities)
        # This adds structured wisdom from the authentic Indian data sources service
        try:
            if self.gita_sources:
                curated_wisdom = await self.gita_sources.get_wisdom_for_kiaan(message, context)
                if curated_wisdom:
                    teachings = curated_wisdom.get("teachings", [])
                    practices = curated_wisdom.get("practices", [])
                    if teachings or practices:
                        enrichment_parts = ["\n\n--- Curated Gita Teachings (static wisdom) ---"]
                        for t in teachings[:2]:
                            name = t.get("name", "")
                            teaching_text = t.get("teaching", "")
                            if name and teaching_text:
                                enrichment_parts.append(f"- {name}: {teaching_text[:200]}")
                        for p in practices[:1]:
                            practice_name = p.get("name", "")
                            description = p.get("description", "")
                            if practice_name and description:
                                enrichment_parts.append(f"- Practice: {practice_name} — {description[:150]}")
                        wisdom_context += "\n".join(enrichment_parts)
                        logger.debug(f"Enriched with {len(teachings)} teachings, {len(practices)} practices from Indian sources")
        except Exception as gita_sources_error:
            logger.warning(f"Indian Gita sources enrichment failed (non-critical): {gita_sources_error}")

        # Step 2c: Enhance with learned wisdom from knowledge base (v4.0 Learning Engine)
        # This adds dynamic supplementary teachings from external sources (videos, audio, texts)
        try:
            if self.learning_engine:
                learned_wisdom = self.learning_engine.get_relevant_wisdom(
                    message, limit=3, language=language
                )
                if learned_wisdom:
                    learned_context = "\n\n--- Supplementary Wisdom (dynamic learning) ---\n"
                    for lw in learned_wisdom:
                        source_info = f" (Source: {lw.source_name})" if lw.source_name else ""
                        learned_context += f"- {lw.content[:300]}...{source_info}\n"
                    wisdom_context += learned_context
                    logger.debug(f"Enhanced with {len(learned_wisdom)} learned wisdom items")
        except Exception as le_error:
            logger.warning(f"Learning engine enhancement failed (non-critical): {le_error}")

        # Step 3: Generate response with multi-provider fallback (v3.1)
        # Priority: ProviderManager (OpenAI/Sarvam/Compatible) -> Legacy OpenAI -> Offline
        system_prompt = self._build_system_prompt(wisdom_context, message, context, language, conversation_context)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]

        response_text = None
        provider_used = None
        model_used = None

        # For streaming, use legacy optimizer (ProviderManager doesn't support streaming yet)
        if stream:
            try:
                response = await self.optimizer.create_completion_with_retry(
                    messages=messages,
                    model="gpt-4o-mini",
                    temperature=0.7,
                    max_tokens=250,
                    stream=True
                )
                return {
                    "stream": response,
                    "verses_used": [v.get("verse_id", "") for v in verses[:3]],
                    "context": context
                }
            except Exception as e:
                logger.error(f"KIAAN Core: Streaming failed: {e}")
                # Fall through to non-streaming fallback

        # Try ProviderManager first (multi-provider with automatic fallback)
        try:
            if self.provider_manager:
                logger.info("KIAAN Core: Using ProviderManager for multi-provider fallback")
                provider_response = await self.provider_manager.chat(
                    messages=messages,
                    temperature=0.7,
                    max_tokens=250,
                )
                response_text = provider_response.content
                provider_used = provider_response.provider
                model_used = provider_response.model
                logger.info(f"KIAAN Core: Response from {provider_used}/{model_used}")
            else:
                raise AIProviderError("ProviderManager not available", provider="none", retryable=True)

        except (AIProviderError, Exception) as provider_error:
            logger.warning(f"KIAAN Core: ProviderManager failed: {provider_error}, trying legacy optimizer")

            # Fallback to legacy OpenAI optimizer
            try:
                response = await self.optimizer.create_completion_with_retry(
                    messages=messages,
                    model="gpt-4o-mini",
                    temperature=0.7,
                    max_tokens=250,
                    stream=False
                )

                # Safe access to response with null checks
                if response and response.choices and len(response.choices) > 0:
                    response_msg = response.choices[0].message
                    if response_msg:
                        response_text = response_msg.content
                        provider_used = "openai"
                        model_used = "gpt-4o-mini"

            except TokenLimitExceededError as e:
                logger.error(f"KIAAN Core: Token limit exceeded: {e}")
                # Try with smaller context (but preserve language and conversation_context)
                verses = verses[:5]
                wisdom_context = self._build_verse_context(verses)
                system_prompt = self._build_system_prompt(wisdom_context, message, context, language, conversation_context)

                try:
                    response = await self.optimizer.create_completion_with_retry(
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": message}
                        ],
                        model="gpt-4o-mini",
                        temperature=0.7,
                        max_tokens=400
                    )
                    if response and response.choices and len(response.choices) > 0:
                        response_msg = response.choices[0].message
                        if response_msg:
                            response_text = response_msg.content
                            provider_used = "openai"
                            model_used = "gpt-4o-mini"
                except Exception as retry_error:
                    logger.error(f"KIAAN Core: Retry failed: {retry_error}")

            except Exception as e:
                logger.error(f"KIAAN Core: OpenAI error: {type(e).__name__}: {e}")

        # If still no response, try offline fallback
        if not response_text:
            try:
                logger.info("KIAAN Core: All providers failed, attempting offline fallback")
                offline_response = await self.get_offline_response(message, context, language)
                return offline_response
            except Exception as offline_error:
                logger.error(f"Offline fallback also failed: {offline_error}")
                response_text = self.optimizer.get_fallback_response(context)
                provider_used = "fallback"
                model_used = "hardcoded"

        # Step 4: Validate response (lightweight check only - no retry for speed)
        validation = self._validate_kiaan_response_fast(response_text)

        # Step 5: SKIP validation retry for spontaneous responses
        # Previously: retry with stricter prompt if validation fails (adds 2-5s latency)
        # Now: Accept response if it has basic quality markers - speed over perfection
        if not validation["valid"]:
            logger.info(f"KIAAN Core: Validation soft-fail - {validation.get('errors', [])}, accepting for speed")

        # Step 6: Cache the response (Quantum Coherence: future cost savings)
        if validation["valid"] and response_text:
            redis_cache.cache_kiaan_response(message, context, response_text)
            logger.debug(f"✅ Cached KIAAN response for future use (context: {context})")

            # Also cache for offline use (v3.0)
            self.offline_cache.set(message, context, {
                "response": response_text,
                "verses_used": [v.get("verse_id", "") for v in verses[:3]],
                "validation": validation,
                "context": context,
                "original_query": message
            })

        # Step 7: Learn from this query (v4.0 Learning Engine)
        # This improves KIAAN's understanding of user patterns and preferences
        try:
            if self.learning_engine and response_text:
                self.learning_engine.learn_from_query(
                    query=message,
                    successful=validation.get("valid", False),
                    rating=None  # User rating can be added later via feedback endpoint
                )
                logger.debug(f"Learned from query: '{message[:50]}...'")
        except Exception as learn_error:
            logger.warning(f"Learning from query failed (non-critical): {learn_error}")

        return {
            "response": response_text,
            "verses_used": [v.get("verse_id", "") for v in verses[:3]],
            "validation": validation,
            "context": context,
            "model": model_used or "gpt-4o-mini",
            "provider": provider_used or "openai",
            "token_optimized": True,
            "cached": False  # This is a fresh response, not from cache
        }

    async def get_kiaan_response_streaming(
        self,
        message: str,
        user_id: str | None,
        db: AsyncSession,
        context: str = "general",
        language: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming KIAAN response for real-time display.
        Optimized for spontaneous, instant feedback.

        Args:
            message: User message or context
            user_id: User ID (optional)
            db: Database session
            context: Context type

        Yields:
            Response chunks as they arrive
        """
        if not self.ready:
            yield self.optimizer.get_fallback_response(context)
            return

        # Check for conversational messages first (thanks, ok, goodbye, etc.)
        is_conversational, conv_type = self._is_conversational_message(message)
        if is_conversational and context == "general":
            logger.info(f"✅ Conversational streaming message ({conv_type}): responding with empathy")
            # For conversational messages, use a simpler prompt and shorter response
            system_prompt = self._get_conversational_prompt(conv_type, language)
            try:
                async for chunk in self.optimizer.create_streaming_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    model="gpt-4o-mini",
                    temperature=0.8,
                    max_tokens=80  # Very short for conversational
                ):
                    yield chunk
                return
            except Exception as e:
                logger.error(f"KIAAN Core: Conversational streaming error: {e}")
                fallbacks = {
                    "gratitude": "You're welcome! I'm here for you. 💙",
                    "affirmation": "I'm glad that helped. 💙",
                    "reaction": "I'm here with you. 💙",
                    "farewell": "Take care! 💙",
                    "greeting": "Hello again! 💙"
                }
                yield fallbacks.get(conv_type, "I'm here for you. 💙")
                return

        # Get verses with reduced limit for faster processing
        verses = await self._get_relevant_verses(db, message, context, limit=3)  # Reduced from 5 for streaming
        if not verses:
            verses = await self._get_fallback_verses(db, limit=2)

        # Build prompts with concise context
        wisdom_context = self._build_verse_context_fast(verses)
        system_prompt = self._build_system_prompt_fast(wisdom_context, context, language)

        try:
            # Stream response with reduced tokens for faster output
            async for chunk in self.optimizer.create_streaming_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                model="gpt-4o-mini",
                temperature=0.7,
                max_tokens=200  # Reduced from 400 for faster streaming
            ):
                yield chunk

        except Exception as e:
            logger.error(f"KIAAN Core: Streaming error: {e}")
            yield self.optimizer.get_fallback_response(context)

    async def _get_relevant_verses(
        self,
        db: AsyncSession,
        query: str,
        context: str,
        limit: int = 15  # Expanded from 5 to 15
    ) -> list[dict[str, Any]]:
        """Get relevant Gita verses based on query and context."""
        try:
            # Use wisdom KB to search verses
            verse_results = await self.wisdom_kb.search_relevant_verses(
                db=db,
                query=query,
                limit=limit
            )
            
            # Format results
            formatted_verses = []
            for result in verse_results:
                verse = result.get("verse")
                if verse:
                    chapter = getattr(verse, 'chapter', '')
                    verse_num = getattr(verse, 'verse', '')
                    formatted_verses.append({
                        "verse_id": f"{chapter}.{verse_num}" if chapter and verse_num else "",
                        "english": getattr(verse, 'english', ''),
                        "principle": getattr(verse, 'principle', ''),
                        "theme": getattr(verse, 'theme', ''),
                        "score": result.get("score", 0.0)
                    })
            
            return formatted_verses
            
        except Exception as e:
            logger.error(f"KIAAN Core: Error getting verses: {e}")
            return []

    async def _get_fallback_verses(self, db: AsyncSession, limit: int = 3) -> list[dict[str, Any]]:
        """Get fallback verses when search fails."""
        try:
            # Get key verses: 2.47 (karma yoga), 2.48 (equanimity), 6.5 (self-elevation)
            fallback_refs = [(2, 47), (2, 48), (6, 5)]
            fallback_verses = []
            
            for chapter, verse_num in fallback_refs:
                verse = await GitaService.get_verse_by_reference(db, chapter, verse_num)
                if verse:
                    fallback_verses.append({
                        "verse_id": f"{verse.chapter}.{verse.verse}",
                        "english": verse.english,
                        "principle": verse.principle,
                        "theme": verse.theme,
                        "score": 0.8
                    })
            
            return fallback_verses[:limit]
            
        except Exception as e:
            logger.error(f"KIAAN Core: Error getting fallback verses: {e}")
            return []

    def _build_verse_context_fast(self, verses: list[dict[str, Any]]) -> str:
        """Build concise wisdom context for fast streaming responses (3 verses max).

        Draws from the static Gita corpus (700+ verses) via semantic search.
        Passes verses as internal guidance — the companion weaves them as lived truth.
        """
        if not verses:
            return "INTERNAL WISDOM (from Gita corpus — weave naturally): Nishkama karma — pour yourself into right action without clinging to outcomes. Samatva — hold equanimity in success and failure. Sthitaprajna — steady wisdom that stays calm through change."

        principles = []
        for verse in verses[:3]:
            if verse.get('principle'):
                principles.append(verse['principle'][:120])
            elif verse.get('english'):
                principles.append(verse['english'][:100])

        return "INTERNAL WISDOM (from Gita corpus — weave naturally): " + " | ".join(principles) if principles else "Draw from nishkama karma (selfless action), samatva (equanimity), sthitaprajna (steady wisdom)."

    def _build_verse_context(self, verses: list[dict[str, Any]]) -> str:
        """Build wisdom context from static Gita verse corpus (700+ verses).

        These verses are retrieved from the Wisdom Knowledge Base via OpenAI-powered
        semantic search. They form the internal reasoning backbone for KIAAN's responses.
        The companion absorbs these teachings and weaves them naturally as lived wisdom.

        Static Wisdom Source: Bhagavad Gita 700+ verse corpus (database-backed)
        Dynamic Wisdom Source: Learning engine supplements (appended separately)
        """
        if not verses:
            return """INTERNAL WISDOM (from Gita corpus — absorb and weave naturally):
Core teachings to draw from:
- Nishkama Karma: Pour yourself into right action without clinging to outcomes
- Samatva: Hold equanimity — meet success and failure with the same steady presence
- Sthitaprajna: Steady wisdom that remains undisturbed by changing circumstances
- Buddhi Yoga: The discerning intellect that sees clearly through confusion
Express these as lived truth using terms like dharma, karma, equanimity, detachment, self-mastery. Never cite sources."""

        context_parts = ["INTERNAL WISDOM (from Gita corpus — absorb and weave naturally):", ""]

        # Use up to 5 verses for balanced context
        for i, verse in enumerate(verses[:5], 1):
            parts = []
            if verse.get('english'):
                english_text = verse['english']
                if len(english_text) > 200:
                    english_text = english_text[:197] + '...'
                parts.append(english_text)
            if verse.get('principle'):
                principle_text = verse['principle']
                if len(principle_text) > 100:
                    principle_text = principle_text[:97] + '...'
                parts.append(f"Principle: {principle_text}")
            if verse.get('theme'):
                parts.append(f"Theme: {verse['theme'].replace('_', ' ').title()}")
            if parts:
                context_parts.append(f"{i}. " + " | ".join(parts))

        context_parts.extend([
            "",
            "GUIDANCE: Let this wisdom inform your understanding. Weave relevant insights naturally into your response as lived truth. Never cite sources, verse numbers, or religious texts by name."
        ])

        return "\n".join(context_parts)

    def _build_system_prompt_fast(self, wisdom_context: str, context: str, language: str | None = None) -> str:
        """Build concise system prompt for fast streaming responses."""
        lang_note = f" Respond in {language}." if language and language != "en" else ""

        return f"""You are KIAAN, a warm spiritual companion.{lang_note}

{wisdom_context}

YOUR INNER FRAMEWORK: Gita wisdom — dharma, karma yoga, equanimity, detachment, self-mastery. Express as lived truth, never doctrine.

RESPONSE FLOW (natural prose, no headers or lists):
1. Emotional attunement — 1-2 lines showing you hear them
2. Gentle insight — A short paragraph of grounded wisdom woven into their situation
3. One reflective question — A single question inviting them inward

RULES:
- 120-180 words
- No headers, bold labels, numbered sections, or bullet points in output
- No overused validation phrases
- No scripture citations, no "Bhagavad Gita", "Krishna", "Arjuna", verse/chapter numbers
- No clinical, motivational, or productivity-focused language
- Warm, present, grounded — like a wise friend sitting beside them"""

    def _build_system_prompt(
        self,
        wisdom_context: str,
        message: str,
        context: str,
        language: str | None = None,
        conversation_context: str | None = None
    ) -> str:
        """Build system prompt based on context type, language, and conversation history.

        Args:
            wisdom_context: Relevant Gita verses and teachings
            message: Current user message
            context: Context type (general, ardha_reframe, etc.)
            language: Response language
            conversation_context: Previous conversation for multi-turn understanding
        """

        # Language instruction for non-English responses
        language_instruction = ""
        if language and language != "en":
            language_map = {
                "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali",
                "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
                "pa": "Punjabi", "sa": "Sanskrit", "es": "Spanish", "fr": "French",
                "de": "German", "pt": "Portuguese", "ja": "Japanese", "zh": "Chinese",
            }
            lang_name = language_map.get(language, language)
            language_instruction = f"\n\nRESPOND IN {lang_name}. Keep Sanskrit terms that are universally understood (dharma, karma, yoga, equanimity). Use clear, accessible language."

        # Build conversation context section for multi-turn understanding
        conversation_section = ""
        if conversation_context:
            conversation_section = f"""
--- CONVERSATION HISTORY (for understanding context) ---
{conversation_context}
--- END HISTORY ---

CONVERSATION AWARENESS:
Hold the full arc of the conversation when responding. Build on what has already been shared. If they ask a follow-up, connect it naturally to earlier threads. Draw from Gita wisdom internally (dharma, karma yoga, gunas, sthitaprajna) but express everything as lived, accessible truth. Reference earlier points when relevant without repeating yourself. Maintain the warmth and continuity of an ongoing companionship.

"""

        base_prompt = f"""You are KIAAN, a warm spiritual companion whose wisdom flows from timeless philosophical traditions.{language_instruction}

{conversation_section}
{wisdom_context}

YOUR INNER FRAMEWORK (invisible to the user):
You draw from Gita wisdom — dharma, karma yoga, the three gunas, sthitaprajna, nishkama karma, buddhi yoga. These inform your understanding but you express them as lived, accessible truth — never as doctrine.

RESPONSE FLOW (write naturally, no headers or numbered sections):
1. Emotional attunement — Begin with 1-2 lines that show you genuinely feel and hear what they are going through. Be present, not performative.
2. Gentle insight — Share 1-2 short paragraphs of grounded wisdom woven naturally into their situation. Use terms like dharma, karma, equanimity, detachment, self-mastery, stillness where they add depth.
3. One reflective question — End with a single thoughtful question that invites them to look inward.

REQUIREMENTS:
- 180-280 words total
- Do NOT use structured headers, bold formatting, numbered lists, or bullet points in your response
- Do NOT overuse validation phrases ("It makes sense", "That's completely valid")
- Do NOT quote scripture unless deeply relevant — never mention Bhagavad Gita, Krishna, Arjuna, verse or chapter numbers
- Do NOT sound clinical, motivational, or productivity-focused
- Do NOT mention analysis, tracking, metrics, or data
- Do NOT reference specific past conversations or dates
- You may subtly reference recurring emotional patterns if natural, but never over-reference memory
- NEVER say "studies show", "research indicates", "experts say"
- Present wisdom as lived truth, not religious teaching
- Create natural pauses with "..." sparingly

TONE: Like a wise friend sitting beside them — warm without being effusive, clear without being cold. No toxic positivity, no rushing to fix. Just presence, gentle clarity, and the kind of quiet that heals."""

        # Add context-specific internal guidance (shapes wisdom, not response structure)
        if context == "ardha_reframe":
            base_prompt += """

CONTEXT — REFRAMING (Ardha):
They are working through a thought pattern that troubles them. Draw internally from the sthitaprajna ideal — steady wisdom that remains undisturbed. Help them see their thoughts as passing weather, not who they are. Guide toward equanimity and the observer within."""

        elif context == "viyoga_detachment":
            base_prompt += """

CONTEXT — LETTING GO (Viyoga):
They are struggling to release something. Draw from nishkama karma — pouring yourself into right action while softening the grip on outcomes. Speak to the freedom that comes when effort is offered without clinging."""

        elif context == "emotional_reset":
            base_prompt += """

CONTEXT — EMOTIONAL RESET:
They need a safe space to feel what they are feeling. Draw from samatva — the still point within where all emotions are welcomed without disturbing the deeper calm. Emotions are waves; their true self is the ocean. Guide gently from turbulence (rajas) or heaviness (tamas) toward clarity (sattva)."""

        elif context == "karma_reset":
            base_prompt += """

CONTEXT — RELATIONAL HEALING (Karma Reset):
They are working through a relationship wound. Draw from karma yoga — every relationship is an opportunity for dharma and selfless compassion. Forgiveness is not forgetting; it is freeing yourself from the weight of the past."""

        elif context == "mood_assessment":
            base_prompt += """

CONTEXT — MOOD REFLECTION:
They are sharing where they are emotionally. Meet them there without rushing to fix. Draw from the understanding that every emotional state is temporary and that steady wisdom is always accessible beneath the surface."""

        elif context == "weekly_assessment":
            base_prompt += """

CONTEXT — WEEKLY REFLECTION:
They are looking back on their week. Honor their path with warmth. Draw from svadharma — each person's unique journey. Acknowledge both growth and struggle. Growth is not linear but spiral."""

        elif context == "relationship_compass":
            base_prompt += """

CONTEXT — RELATIONSHIP NAVIGATION:
They are navigating a relationship challenge. Draw from buddhi yoga (discerning intellect) and samatva (equanimity). Help them move from reactivity to understanding, from ego to compassion. True strength in relationships comes from acting with dharma, not from winning."""

        # Internal reasoning guidance for complex situations
        base_prompt += """

FOR COMPLEX SITUATIONS (internal reasoning only):
When their struggle has many layers, hold all of it gently. Internally consider: What is their dharma here? What attachments are deepening the pain? Where might equanimity bring relief? Then respond with warmth, addressing both the immediate feeling and the deeper pattern — always through the natural three-part flow (attunement, insight, reflective question). Stay within 180-280 words."""

        return base_prompt

    def _validate_kiaan_response_fast(self, response: str) -> dict[str, Any]:
        """
        Fast validation for spontaneous responses - minimal checks for speed.
        Accepts responses that meet basic quality without strict validation.
        """
        errors = []

        # Relaxed word count check (50-400 words) - faster generation allowed
        word_count = len(response.split())
        if word_count < 50:
            errors.append(f"Response too short: {word_count} words")

        # Check for wisdom-related terms (Gita-rooted secular vocabulary)
        wellness_terms = ["dharma", "karma", "yoga", "peace", "wisdom", "balance", "equanimity", "calm", "mindful", "resilience", "breathe", "gentle", "compassion", "stillness", "strength", "detachment", "self-mastery"]
        terms_found = [term for term in wellness_terms if term.lower() in response.lower()]

        # Fail if response cites Gita/Krishna/Arjuna directly (secular output requirement)
        forbidden = ["bhagavad gita", "gita says", "krishna says", "arjuna", "krishna", "gita teaches", "gita tells"]
        citations_found = [f for f in forbidden if f in response.lower()]
        if citations_found:
            errors.append(f"Forbidden citations: {citations_found}")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "word_count": word_count,
            "wellness_terms": terms_found,
            "fast_validation": True
        }

    def _validate_kiaan_response(self, response: str, verses: list[dict[str, Any]]) -> dict[str, Any]:
        """Full validation for KIAAN response (used for caching decisions)."""
        errors = []

        # Word count check (80-350 words) - relaxed to accommodate varied contexts
        word_count = len(response.split())
        if not (80 <= word_count <= 350):
            errors.append(f"Word count {word_count} not in range 80-350")

        # Wisdom terms check - Gita-rooted secular vocabulary (at least 1 for quality)
        wellness_terms = [
            "dharma", "karma", "yoga", "peace", "calm", "balance", "equanimity",
            "mindful", "resilience", "compassion", "self-compassion", "stillness",
            "breathe", "gentle", "strength", "grounded", "wisdom", "awareness",
            "detachment", "self-mastery", "sattva", "inner"
        ]
        terms_found = [term for term in wellness_terms if term.lower() in response.lower()]
        if len(terms_found) < 1:
            errors.append("No wisdom terms found")

        # Quality markers check - relaxed
        quality_markers = [
            "dharma", "karma", "wisdom", "remember", "teaches", "reminds", "practice", "breathe", "gentle"
        ]
        markers_found = any(marker.lower() in response.lower() for marker in quality_markers)

        # Check for forbidden direct citations (secular output requirement - allow dharma/karma/yoga)
        forbidden = ["bhagavad gita", "gita says", "krishna", "arjuna", "verse ", "chapter "]
        citations_found = [f for f in forbidden if f in response.lower()]
        if citations_found:
            errors.append(f"Forbidden citations found: {citations_found}")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "word_count": word_count,
            "wellness_terms": terms_found,
            "markers_found": markers_found
        }

    async def _retry_with_validation(
        self,
        message: str,
        verses: list[dict[str, Any]],
        errors: list[str],
        context: str,
        language: str | None = None
    ) -> str:
        """Retry with stricter prompt when validation fails (using optimizer)."""
        if not self.ready:
            logger.error("KIAAN Core: OpenAI optimizer not ready for retry")
            return self._get_emergency_fallback(context)

        wisdom_context = self._build_verse_context(verses)

        # Language instruction for retry
        language_instruction = ""
        if language and language != "en":
            language_map = {
                "hi": "Hindi (हिन्दी)", "ta": "Tamil (தமிழ்)", "te": "Telugu (తెలుగు)",
                "bn": "Bengali (বাংলা)", "mr": "Marathi (मराठी)", "gu": "Gujarati (ગુજરાતી)",
                "kn": "Kannada (ಕನ್ನಡ)", "ml": "Malayalam (മലയാളം)", "pa": "Punjabi (ਪੰਜਾਬੀ)",
                "sa": "Sanskrit (संस्कृत)", "es": "Spanish (Español)", "fr": "French (Français)",
                "de": "German (Deutsch)", "pt": "Portuguese (Português)", "ja": "Japanese (日本語)",
                "zh-CN": "Chinese Simplified (简体中文)", "zh": "Chinese (中文)",
            }
            lang_name = language_map.get(language, language)
            language_instruction = f"\n- RESPOND ENTIRELY IN {lang_name}"

        # Build stricter prompt that addresses the errors
        strict_prompt = f"""You are KIAAN, a warm spiritual companion. Your previous response needs adjustment. Issues:
{chr(10).join(f'- {error}' for error in errors)}

REQUIREMENTS:
- 180-280 words
- Include at least 2 terms from: dharma, karma, equanimity, stillness, peace, detachment, self-mastery, balance, compassion
- Write as natural prose — no headers, bullet points, or numbered sections
- Flow: emotional attunement (1-2 lines), gentle insight (1-2 paragraphs), one reflective question
- NEVER mention: Bhagavad Gita, Krishna, Arjuna, verse numbers, chapter numbers
- Do not sound clinical, motivational, or productivity-focused{language_instruction}

{wisdom_context}

User message: {message}

Respond warmly and naturally, meeting them where they are."""

        try:
            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": strict_prompt},
                    {"role": "user", "content": "Generate the validated response now."}
                ],
                model="gpt-4o-mini",  # Upgraded from gpt-4
                temperature=0.7,
                max_tokens=400,  # Optimized from 600
            )

            # Safe access to response with null checks
            # Note: Using response_msg to avoid shadowing the 'message' parameter
            response_text = None
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg:
                    response_text = response_msg.content
            if not response_text:
                response_text = self._get_emergency_fallback(context)

            return response_text

        except Exception as e:
            logger.error(f"KIAAN Core: Retry failed: {type(e).__name__}: {e}")
            return self._get_emergency_fallback(context)

    def _get_emergency_fallback(self, context: str) -> str:
        """Emergency fallback response when all else fails."""
        return """I hear you, and I am here.

Whatever you are carrying right now, you do not have to carry it alone. There is a quiet center within you that remains untouched by life's storms... like the ocean depths that stay calm while waves move on the surface. That stillness is always accessible, even when everything feels overwhelming.

Sometimes the bravest thing is not to push through, but simply to pause. To breathe. To let yourself be exactly where you are without needing to fix or figure out anything in this moment. This is dharma in its simplest form — being present with what is, trusting that clarity comes in its own time.

What would it feel like to let yourself rest here, even just for a breath?"""


# Global instance
kiaan_core = KIAANCore()
