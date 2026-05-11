"""
MindVibe Text-to-Speech Service - Premium Voice Processing

Provides multilingual voice synthesis for Gita verses, KIAAN responses,
and meditation guidance across 17+ languages using premium voice providers.

Provider Fallback Chain:
  Indian Languages: Sarvam AI Bulbul -> ElevenLabs -> Edge TTS
  International Languages: ElevenLabs -> Sarvam AI (for Hindi/Indian English)

Features:
- ElevenLabs for studio-grade international voices
- Sarvam AI Bulbul for native Indian language pronunciation
- Edge TTS for free Microsoft Neural voices
- Emotion-adaptive voice modulation
- Multi-layer caching (Redis + Memory + Disk)
- Intelligent provider routing by language
"""

import hashlib
import logging
import re
import threading
import asyncio
from typing import Optional, Literal, Dict
from pathlib import Path
import os
import json

from backend.services.language_registry import normalize_language_code

logger = logging.getLogger(__name__)

VoiceType = Literal["calm", "wisdom", "friendly", "energetic", "soothing", "storytelling", "chanting"]


# ─── Cache versioning ──────────────────────────────────────────────────────
#
# Bumped manually whenever a code change alters how a given
# (text, voice_id) pair is rendered. Salted into ``_generate_cache_key``
# so the next request after deploy re-synthesizes instead of replaying
# stale audio. The cache TTL on ``/api/voice/synthesize`` responses is
# ``max-age=604800`` (7 days), so without versioning the user could hear
# the old (pre-fix) audio for a week after a mapping change.
#
# Increment history:
#   v1 — initial implementation
#   v2 — speaker mapping fixes (sarvam-meera, elevenlabs-lily added);
#        is_picker_voice extended premium tuning to non-divine voices.
TTS_CACHE_VERSION = 4
VoiceGender = Literal["male", "female", "neutral"]

# Emotion-to-prosody mapping for adaptive voice
EMOTION_PROSODY_MAP = {
    "joy": {"rate": 1.02, "pitch": 1.0, "volume": "medium", "emphasis": "moderate"},
    "sadness": {"rate": 0.90, "pitch": -1.0, "volume": "soft", "emphasis": "reduced"},
    "anxiety": {"rate": 0.88, "pitch": -0.5, "volume": "soft", "emphasis": "reduced"},
    "peace": {"rate": 0.92, "pitch": -0.3, "volume": "soft", "emphasis": "none"},
    "gratitude": {"rate": 0.96, "pitch": 0.5, "volume": "medium", "emphasis": "moderate"},
    "anger": {"rate": 0.94, "pitch": 0.2, "volume": "medium", "emphasis": "strong"},
    "fear": {"rate": 0.88, "pitch": 0.3, "volume": "soft", "emphasis": "reduced"},
    "hope": {"rate": 0.97, "pitch": 0.8, "volume": "medium", "emphasis": "moderate"},
    "love": {"rate": 0.93, "pitch": 0.3, "volume": "soft", "emphasis": "moderate"},
    "compassion": {"rate": 0.91, "pitch": -0.2, "volume": "soft", "emphasis": "moderate"},
    "curiosity": {"rate": 0.98, "pitch": 0.4, "volume": "medium", "emphasis": "moderate"},
    "confidence": {"rate": 0.95, "pitch": 0.0, "volume": "medium", "emphasis": "strong"},
    "serenity": {"rate": 0.90, "pitch": -0.4, "volume": "soft", "emphasis": "none"},
    "neutral": {"rate": 0.95, "pitch": 0.0, "volume": "medium", "emphasis": "none"},
}

# Sanskrit/Hindi spiritual terms that need emphasis
SPIRITUAL_TERMS = [
    "dharma", "karma", "yoga", "atman", "brahman", "moksha", "samsara",
    "nirvana", "prana", "chakra", "mantra", "om", "namaste", "guru",
    "krishna", "arjuna", "gita", "bhagavad", "vedanta", "upanishad",
    "sanskrit", "divine", "eternal", "consciousness", "enlightenment",
    "meditation", "mindfulness", "awareness", "presence", "wisdom",
]

# Voice type specific settings for natural speech prosody
# Inspired by the most natural-sounding voice assistants:
# - Siri's conversational warmth with natural breath pauses
# - Alexa's clear articulation and emotional expressiveness
# - Google Assistant's fluid multilingual pronunciation
VOICE_TYPE_SETTINGS: Dict[str, Dict[str, float]] = {
    "calm": {
        "speed": 0.92,
        "pitch": -0.8,
        "volume_gain": 0.0,
        "breath_pause_ms": 300,
        "sentence_pause_ms": 600,
        "warmth": 0.95,
    },
    "wisdom": {
        "speed": 0.94,
        "pitch": -0.3,
        "volume_gain": 0.5,
        "breath_pause_ms": 250,
        "sentence_pause_ms": 500,
        "warmth": 0.85,
    },
    "friendly": {
        "speed": 0.97,
        "pitch": 0.3,
        "volume_gain": 0.0,
        "breath_pause_ms": 150,
        "sentence_pause_ms": 350,
        "warmth": 0.92,
    },
    "energetic": {
        "speed": 1.02,
        "pitch": 0.5,
        "volume_gain": 0.2,
        "breath_pause_ms": 100,
        "sentence_pause_ms": 250,
        "warmth": 0.88,
    },
    "soothing": {
        "speed": 0.88,
        "pitch": -1.0,
        "volume_gain": -0.3,
        "breath_pause_ms": 400,
        "sentence_pause_ms": 800,
        "warmth": 0.98,
    },
    "storytelling": {
        "speed": 0.93,
        "pitch": 0.0,
        "volume_gain": 0.3,
        "breath_pause_ms": 200,
        "sentence_pause_ms": 450,
        "warmth": 0.90,
    },
    "chanting": {
        "speed": 0.82,
        "pitch": -2.0,
        "volume_gain": 0.0,
        "breath_pause_ms": 500,
        "sentence_pause_ms": 1000,
        "warmth": 0.96,
    },
}

# Natural speech enhancement: language-specific intonation curves
# Tuned per-language for the most natural prosody patterns
LANGUAGE_NATURALNESS_PROFILES: Dict[str, Dict[str, float]] = {
    "en": {"intonation_rise": 0.3, "sentence_fall": 0.5, "question_rise": 1.2, "emphasis_boost": 0.15},
    "hi": {"intonation_rise": 0.5, "sentence_fall": 0.4, "question_rise": 1.0, "emphasis_boost": 0.20},
    "ta": {"intonation_rise": 0.4, "sentence_fall": 0.3, "question_rise": 0.8, "emphasis_boost": 0.18},
    "te": {"intonation_rise": 0.4, "sentence_fall": 0.3, "question_rise": 0.9, "emphasis_boost": 0.18},
    "bn": {"intonation_rise": 0.5, "sentence_fall": 0.4, "question_rise": 1.0, "emphasis_boost": 0.20},
    "ja": {"intonation_rise": 0.2, "sentence_fall": 0.6, "question_rise": 1.5, "emphasis_boost": 0.10},
    "ko": {"intonation_rise": 0.3, "sentence_fall": 0.5, "question_rise": 1.3, "emphasis_boost": 0.12},
    "zh": {"intonation_rise": 0.1, "sentence_fall": 0.3, "question_rise": 0.5, "emphasis_boost": 0.08},
    "fr": {"intonation_rise": 0.4, "sentence_fall": 0.5, "question_rise": 1.4, "emphasis_boost": 0.15},
    "de": {"intonation_rise": 0.3, "sentence_fall": 0.6, "question_rise": 1.1, "emphasis_boost": 0.12},
    "es": {"intonation_rise": 0.5, "sentence_fall": 0.4, "question_rise": 1.3, "emphasis_boost": 0.18},
    "it": {"intonation_rise": 0.6, "sentence_fall": 0.4, "question_rise": 1.4, "emphasis_boost": 0.20},
    "pt": {"intonation_rise": 0.5, "sentence_fall": 0.4, "question_rise": 1.2, "emphasis_boost": 0.18},
    "ru": {"intonation_rise": 0.3, "sentence_fall": 0.5, "question_rise": 1.0, "emphasis_boost": 0.14},
    "ar": {"intonation_rise": 0.4, "sentence_fall": 0.5, "question_rise": 1.1, "emphasis_boost": 0.16},
    "tr": {"intonation_rise": 0.4, "sentence_fall": 0.4, "question_rise": 1.2, "emphasis_boost": 0.15},
    "th": {"intonation_rise": 0.2, "sentence_fall": 0.3, "question_rise": 0.6, "emphasis_boost": 0.10},
    "vi": {"intonation_rise": 0.2, "sentence_fall": 0.3, "question_rise": 0.5, "emphasis_boost": 0.08},
    "id": {"intonation_rise": 0.3, "sentence_fall": 0.4, "question_rise": 1.0, "emphasis_boost": 0.14},
    "nl": {"intonation_rise": 0.3, "sentence_fall": 0.5, "question_rise": 1.2, "emphasis_boost": 0.13},
    "pl": {"intonation_rise": 0.3, "sentence_fall": 0.5, "question_rise": 1.1, "emphasis_boost": 0.14},
    "sv": {"intonation_rise": 0.5, "sentence_fall": 0.6, "question_rise": 1.3, "emphasis_boost": 0.12},
    "sw": {"intonation_rise": 0.4, "sentence_fall": 0.4, "question_rise": 1.0, "emphasis_boost": 0.15},
    "sa": {"intonation_rise": 0.4, "sentence_fall": 0.3, "question_rise": 0.8, "emphasis_boost": 0.22},
}

# Supported languages across all premium providers
# Inspired by Siri (40+), Alexa (20+), Google Assistant (30+)
# KIAAN supports 29 languages with premium natural voices
SUPPORTED_LANGUAGES = [
    # Indian languages (Sarvam AI)
    "en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "sa", "od",
    # European languages (ElevenLabs)
    "es", "fr", "de", "pt", "it", "nl", "pl", "sv", "ru",
    # Asian languages (ElevenLabs)
    "ja", "zh", "ko", "th", "vi", "id",
    # Middle Eastern (ElevenLabs)
    "ar", "tr",
    # African (ElevenLabs)
    "sw",
]

# Indian languages where Sarvam AI excels
INDIAN_LANGUAGES = {
    "hi", "ta", "te", "bn", "kn", "ml", "mr", "gu", "pa", "sa", "en-IN",
}

# International languages where ElevenLabs excels
INTERNATIONAL_LANGUAGES = {
    "en", "es", "fr", "de", "pt", "it", "nl", "pl", "sv", "ru",
    "ja", "zh", "ko", "th", "vi", "id", "ar", "tr", "sw",
}


class OfflineAudioCache:
    """
    Cache for pre-generated audio on disk.
    Stores commonly used phrases for instant access.
    """

    def __init__(self, cache_dir: Optional[str] = None):
        self.cache_dir = Path(cache_dir or Path.home() / ".mindvibe" / "audio_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._index: Dict[str, str] = {}
        self._lock = threading.Lock()
        self._load_index()

    def _load_index(self) -> None:
        """Load cache index from disk."""
        with self._lock:
            index_file = self.cache_dir / "index.json"
            if index_file.exists():
                try:
                    with open(index_file, "r") as f:
                        self._index = json.load(f)
                except Exception as e:
                    logger.warning(f"Failed to load audio cache index: {e}")

    def _save_index(self) -> None:
        """Save cache index to disk using atomic write."""
        with self._lock:
            index_file = self.cache_dir / "index.json"
            tmp_path = str(index_file) + ".tmp"
            try:
                with open(tmp_path, "w") as f:
                    json.dump(self._index, f, indent=2)
                os.replace(tmp_path, index_file)
            except Exception as e:
                logger.warning(f"Failed to save cache index: {e}")
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    def _generate_key(self, text: str, language: str, voice_type: str, voice_id: Optional[str] = None) -> str:
        """Generate cache key using SHA-256."""
        content = f"{text}:{language}:{voice_type}:{voice_id or ''}"
        return hashlib.sha256(content.encode()).hexdigest()

    def get(self, text: str, language: str, voice_type: str, voice_id: Optional[str] = None) -> Optional[bytes]:
        """Get cached audio if available."""
        key = self._generate_key(text, language, voice_type, voice_id)
        if key not in self._index:
            return None

        audio_file = self.cache_dir / self._index[key]
        if not audio_file.exists():
            return None

        try:
            with open(audio_file, "rb") as f:
                return f.read()
        except Exception:
            return None

    def set(self, text: str, language: str, voice_type: str, audio: bytes, voice_id: Optional[str] = None) -> None:
        """Cache audio for future use."""
        key = self._generate_key(text, language, voice_type, voice_id)
        filename = f"{key}.mp3"
        audio_file = self.cache_dir / filename

        try:
            with open(audio_file, "wb") as f:
                f.write(audio)
            self._index[key] = filename
            self._save_index()
        except Exception as e:
            logger.warning(f"Failed to cache audio: {e}")

    def clear(self) -> None:
        """Clear all cached audio."""
        for filename in self._index.values():
            try:
                (self.cache_dir / filename).unlink(missing_ok=True)
            except Exception:
                pass
        self._index = {}
        self._save_index()


# Global cache
_offline_audio_cache: Optional[OfflineAudioCache] = None


def get_offline_audio_cache() -> OfflineAudioCache:
    """Get or create offline audio cache."""
    global _offline_audio_cache
    if _offline_audio_cache is None:
        _offline_audio_cache = OfflineAudioCache()
    return _offline_audio_cache


class TTSService:
    """
    Text-to-Speech service using ElevenLabs, Sarvam AI, and Edge TTS.

    Provider Fallback Chain:
    - Indian Languages: Sarvam AI -> ElevenLabs -> Edge TTS
    - International Languages: ElevenLabs -> Sarvam AI (if applicable)
    - All providers support emotion-adaptive synthesis
    """

    def __init__(self, redis_client=None):
        """
        Initialize TTS service with premium provider chain.

        Args:
            redis_client: Optional Redis client for caching
        """
        self.redis_client = redis_client
        self.memory_cache: Dict[str, bytes] = {}
        self.cache_ttl = 604800  # 1 week in seconds
        self.offline_cache = get_offline_audio_cache()

        # Check provider availability
        self._sarvam_available = False
        self._elevenlabs_available = False

        try:
            from backend.services.sarvam_tts_service import is_sarvam_available
            self._sarvam_available = is_sarvam_available()
        except ImportError:
            pass

        try:
            from backend.services.elevenlabs_tts_service import is_elevenlabs_available
            self._elevenlabs_available = is_elevenlabs_available()
        except ImportError:
            pass

        logger.info(
            f"TTS Providers: Sarvam={self._sarvam_available}, "
            f"ElevenLabs={self._elevenlabs_available}"
        )

    def _generate_cache_key(
        self,
        text: str,
        language: str,
        voice_type: VoiceType,
        speed: float = 0.9,
        voice_id: Optional[str] = None,
    ) -> str:
        """Generate unique cache key for audio.

        voice_id is included so that different KIAAN voice personas (e.g.
        divine-krishna vs divine-saraswati) get distinct cache entries —
        otherwise all voices for the same verse would collapse to the same
        cached audio and the player would only ever produce one voice.
        """
        # ``TTS_CACHE_VERSION`` is salted into the key so backend changes
        # that alter how a (text, voice_id) pair renders — speaker mapping
        # changes, tuning bumps, chain reorders — automatically invalidate
        # stale audio without manual Redis flush.
        content = (
            f"v{TTS_CACHE_VERSION}:{text}:{language}:{voice_type}:"
            f"{speed}:{voice_id or ''}"
        )
        return f"tts:{hashlib.sha256(content.encode()).hexdigest()}"

    def _get_cached_audio(self, cache_key: str) -> Optional[bytes]:
        """Retrieve audio from cache (Redis or memory)."""
        if self.redis_client:
            try:
                cached = self.redis_client.get(cache_key)
                if cached:
                    logger.info(f"Cache hit (Redis): {cache_key[:20]}...")
                    return cached
            except Exception as e:
                logger.warning(f"Redis cache read failed: {e}")

        if cache_key in self.memory_cache:
            logger.info(f"Cache hit (memory): {cache_key[:20]}...")
            return self.memory_cache[cache_key]

        return None

    def _cache_audio(self, cache_key: str, audio_bytes: bytes) -> None:
        """Store audio in cache."""
        if self.redis_client:
            try:
                self.redis_client.setex(cache_key, self.cache_ttl, audio_bytes)
            except Exception as e:
                logger.warning(f"Redis cache write failed: {e}")

        if len(self.memory_cache) > 100:
            oldest_key = next(iter(self.memory_cache))
            del self.memory_cache[oldest_key]

        self.memory_cache[cache_key] = audio_bytes

    def _is_indian_language(self, language: str) -> bool:
        """Check if language is an Indian language."""
        return language in INDIAN_LANGUAGES

    async def _synthesize_with_sarvam(
        self,
        text: str,
        language: str,
        voice_type: str,
        mood: str = "neutral",
        voice_id: str = "sarvam-aura",
    ) -> Optional[bytes]:
        """Synthesize using Sarvam AI Bulbul."""
        try:
            from backend.services.sarvam_tts_service import (
                synthesize_sarvam_tts,
                is_sarvam_available,
            )
            if not is_sarvam_available():
                return None

            return await synthesize_sarvam_tts(
                text=text,
                language=language,
                voice_id=voice_id,
                mood=mood,
            )
        except ImportError:
            return None
        except Exception as e:
            logger.warning(f"Sarvam synthesis failed: {e}")
            return None

    async def _synthesize_with_elevenlabs(
        self,
        text: str,
        language: str,
        voice_id: str = "elevenlabs-nova",
        mood: str = "neutral",
    ) -> Optional[bytes]:
        """Synthesize using ElevenLabs."""
        try:
            from backend.services.elevenlabs_tts_service import (
                synthesize_elevenlabs_tts,
                is_elevenlabs_available,
            )
            if not is_elevenlabs_available():
                return None

            return await synthesize_elevenlabs_tts(
                text=text,
                language=language,
                voice_id=voice_id,
                mood=mood,
            )
        except ImportError:
            return None
        except Exception as e:
            logger.warning(f"ElevenLabs synthesis failed: {e}")
            return None

    async def _synthesize_with_providers(
        self,
        text: str,
        language: str,
        voice_type: str = "friendly",
        mood: str = "neutral",
        voice_id: Optional[str] = None,
    ) -> Optional[bytes]:
        """
        Synthesize using the canonical provider fallback chain.

        Priority order (matches user's stated infrastructure plan):

           1. Sarvam AI (paid — primary, 11 Indic + Indian English)
           2. ElevenLabs (paid — premium fallback, 29+ languages)
           3. Microsoft Neural via Edge TTS (LAST resort — only when
              both paid providers are exhausted; free, no API key
              required, 50+ languages)
           4. Bhashini AI (FUTURE — pending Government of India
              approval; provider class wired for both REST + WSS but
              kept INACTIVE in the chain until approved by Bhashini
              programme). When approved, simply move the call out of
              the placeholder block below into Tier 3 and demote
              Microsoft Neural to Tier 4.

        The third tier (Microsoft Neural) exists strictly for emergency
        redundancy when the user's paid Sarvam + ElevenLabs quotas are
        spent or both providers are temporarily unavailable. It is NOT
        a regular production path — when you see Microsoft Neural in
        Render logs, treat it as a signal to top up paid quotas.

        Each tier's adapter is a no-op (returns None) when its env-var
        key is unset, so the chain naturally skips disabled tiers
        without explicit checks. Plus the per-adapter HTTP layer
        already classifies 429 (rate limit / quota) vs 401/403 (auth
        misconfig) vs 5xx (service outage) — see this method's
        post-loop summary for the consolidated tier-level failure mode.
        """
        # Map voice_type to voice_id if not provided
        if not voice_id:
            voice_id = {
                "calm": "sarvam-aura",
                "wisdom": "sarvam-rishi",
                "friendly": "sarvam-aura",
                "energetic": "sarvam-aura",
                "soothing": "sarvam-aura",
                "storytelling": "sarvam-rishi",
                "chanting": "sarvam-rishi",
            }.get(voice_type, "sarvam-aura")

        # Map voice_type → mood when caller didn't specify one. The
        # ElevenLabs/Sarvam adapters drive their stability/style/pace
        # tuning from ``mood``; passing ``neutral`` flattens divine
        # voices into a studio-flat reading. Resolve a richer mood
        # so divine voice settings actually produce divine audio.
        # Caller-supplied ``mood != "neutral"`` is preserved.
        if mood == "neutral":
            mood = {
                "calm": "peaceful",
                "wisdom": "peaceful",
                "friendly": "joyful",
                "energetic": "joyful",
                "soothing": "peaceful",
                "storytelling": "peaceful",
                "chanting": "peaceful",
            }.get(voice_type, "neutral")

        # Track per-tier outcome for the consolidated final-failure log.
        tier_outcomes: list[str] = []

        def _record(tier: str, outcome: str) -> None:
            tier_outcomes.append(f"{tier}={outcome}")

        # ── Direct-routing fast path: <provider>-<speaker> ──
        # New v3 voice IDs are bound to a specific (provider, speaker)
        # tuple — e.g. ``sarvam-anushka`` routes to Sarvam's API with
        # speaker_id=anushka, ``elevenlabs-aria`` routes to ElevenLabs
        # with voice_id=aria. Bypasses the legacy persona double-lookup
        # that was producing collisions (two persona ids defaulting to
        # the same speaker → identical audio).
        #
        # Recognized prefixes: ``sarvam-`` and ``elevenlabs-``. Anything
        # else (legacy ``divine-*``, bare ``meera``, etc.) falls through
        # to the canonical chain below.
        #
        # IMPORTANT (per founder directive 2026-05): when the user's
        # chosen paid provider is exhausted (quota / 429 / network), we
        # MUST NOT silently substitute the OTHER paid provider — that
        # would deliver a completely different voice character than the
        # one the user picked (e.g. Aria → some Sarvam Indic female).
        # Instead, on direct-route failure we jump STRAIGHT to
        # Microsoft Neural (Tier 3), which can render any text in any
        # supported language without speaker-identity collisions.
        direct_route_attempted = False
        if voice_id:
            primary_provider: Optional[str] = None
            if voice_id.startswith("sarvam-"):
                primary_provider = "sarvam"
            elif voice_id.startswith("elevenlabs-"):
                primary_provider = "elevenlabs"

            if primary_provider == "sarvam":
                direct_route_attempted = True
                try:
                    audio = await self._synthesize_with_sarvam(
                        text, language, voice_type, mood, voice_id
                    )
                    if audio:
                        _record("T1_sarvam_direct", "ok")
                        logger.info(
                            f"Sarvam direct-route success for {language} "
                            f"voice={voice_id} "
                            f"chain=[{', '.join(tier_outcomes)}]"
                        )
                        return audio
                    _record(
                        "T1_sarvam_direct",
                        "skipped_no_key"
                        if not self._sarvam_available
                        else "no_audio",
                    )
                except Exception as e:
                    _record("T1_sarvam_direct", f"err:{type(e).__name__}")
                    logger.warning(f"Sarvam direct-route raised: {e}")

            elif primary_provider == "elevenlabs":
                direct_route_attempted = True
                try:
                    audio = await self._synthesize_with_elevenlabs(
                        text, language, voice_id, mood
                    )
                    if audio:
                        _record("T1_elevenlabs_direct", "ok")
                        logger.info(
                            f"ElevenLabs direct-route success for {language} "
                            f"voice={voice_id} "
                            f"chain=[{', '.join(tier_outcomes)}]"
                        )
                        return audio
                    _record(
                        "T1_elevenlabs_direct",
                        "skipped_no_key"
                        if not self._elevenlabs_available
                        else "no_audio",
                    )
                except Exception as e:
                    _record(
                        "T1_elevenlabs_direct", f"err:{type(e).__name__}"
                    )
                    logger.warning(f"ElevenLabs direct-route raised: {e}")

        # ── Canonical paid chain (legacy voice IDs only) ─────────────
        # Skipped entirely when the user picked a v3 direct-route voice
        # — see ``direct_route_attempted`` block above. Routing the
        # ``sarvam-anushka`` request through ElevenLabs would deliver a
        # different person's voice and is treated as an error condition.
        if not direct_route_attempted:
            # ── Tier 1: Sarvam AI (paid primary) ──
            try:
                audio = await self._synthesize_with_sarvam(
                    text, language, voice_type, mood, voice_id
                )
                if audio:
                    _record("T1_sarvam", "ok")
                    logger.info(
                        f"Sarvam AI (Tier 1) synthesis success for {language} "
                        f"voice={voice_id} chain=[{', '.join(tier_outcomes)}]"
                    )
                    return audio
                _record(
                    "T1_sarvam",
                    "skipped_no_key" if not self._sarvam_available else "no_audio",
                )
            except Exception as e:
                _record("T1_sarvam", f"err:{type(e).__name__}")
                logger.warning(f"Sarvam Tier 1 raised: {e}")

            # ── Tier 2: ElevenLabs (paid fallback) ──
            try:
                audio = await self._synthesize_with_elevenlabs(
                    text, language, voice_id, mood
                )
                if audio:
                    _record("T2_elevenlabs", "ok")
                    logger.info(
                        f"ElevenLabs (Tier 2) synthesis success for {language} "
                        f"voice={voice_id} chain=[{', '.join(tier_outcomes)}]"
                    )
                    return audio
                _record(
                    "T2_elevenlabs",
                    "skipped_no_key" if not self._elevenlabs_available else "no_audio",
                )
            except Exception as e:
                _record("T2_elevenlabs", f"err:{type(e).__name__}")
                logger.warning(f"ElevenLabs Tier 2 raised: {e}")

        # ── Tier 3: Microsoft Neural via Edge TTS (LAST resort) ──
        # Only reached when Sarvam + ElevenLabs are BOTH
        # exhausted/unavailable. Free (no API key), studio-grade
        # quality, 50+ languages. NOT a regular production path —
        # seeing this in logs is a signal to top up paid quotas.
        try:
            from backend.services.edge_tts_service import (
                synthesize_edge_tts,
                is_edge_tts_available,
            )
            if is_edge_tts_available():
                audio = await synthesize_edge_tts(
                    text=text,
                    language=language,
                    voice_id=voice_id,
                    mood=mood,
                )
                if audio:
                    _record("T3_microsoft", "ok")
                    logger.warning(
                        f"Microsoft Neural / Edge TTS (Tier 3 LAST RESORT) "
                        f"used for {language} — paid providers exhausted. "
                        f"voice={voice_id} chain=[{', '.join(tier_outcomes)}]. "
                        f"Top up Sarvam/ElevenLabs quota."
                    )
                    return audio
                _record("T3_microsoft", "no_audio")
            else:
                _record("T3_microsoft", "skipped_module_missing")
        except ImportError:
            _record("T3_microsoft", "skipped_module_missing")
        except Exception as e:
            _record("T3_microsoft", f"err:{type(e).__name__}")
            logger.warning(f"Edge TTS Tier 3 raised: {e}")

        # ── Tier 4: Bhashini AI (FUTURE — awaiting approval) ─────────
        # The REST adapter (``bhashini_tts_service.py``) and WSS
        # provider (``backend/services/voice/bhashini_provider.py``) are
        # both fully implemented and ready, but Bhashini AI's
        # production-tier API access requires Government of India /
        # MeitY programme approval. Until that approval lands, this
        # tier stays INACTIVE — no call, no telemetry, just a clearly
        # marked placeholder so the next engineer knows the wiring
        # exists and only needs to be uncommented.
        #
        # When approval lands:
        #   1. Set BHASHINI_USER_ID + BHASHINI_API_KEY on Render.
        #   2. Move the active block out of this comment, ABOVE Tier 3
        #      (so Bhashini becomes the new Tier 3 and Microsoft Neural
        #      demotes to Tier 4 — the natural priority order: paid →
        #      sovereign-free → last-resort-free).
        #   3. Update the docstring above to reflect 4-tier active.
        #
        # Sample wiring (kept as a verified-buildable example, not
        # invoked):
        #     from backend.services.bhashini_tts_service import (
        #         synthesize_bhashini_tts, is_bhashini_available,
        #     )
        #     if is_bhashini_available():
        #         audio = await synthesize_bhashini_tts(
        #             text=text, language=language,
        #             voice_id=voice_id or "bhashini-devi", mood=mood,
        #         )
        _record("T4_bhashini", "deferred_pending_approval")

        logger.error(
            f"All TTS tiers failed for language={language} voice_id={voice_id}. "
            f"chain=[{', '.join(tier_outcomes)}]. "
            f"Configured: sarvam={self._sarvam_available} "
            f"elevenlabs={self._elevenlabs_available}"
        )
        return None

    def synthesize(
        self,
        text: str,
        language: str = "en",
        voice_type: VoiceType = "friendly",
        speed: Optional[float] = None,
        pitch: Optional[float] = None,
        voice_id: Optional[str] = None,
        mood: Optional[str] = None,
    ) -> Optional[bytes]:
        """
        Synthesize text to speech using premium providers.

        Fallback chain:
        - Indian: Sarvam AI -> ElevenLabs -> Edge TTS
        - International: ElevenLabs -> Sarvam AI

        Args:
            text: Text to synthesize
            language: Language code (en, hi, ta, etc.)
            voice_type: Voice persona (calm, wisdom, friendly)
            speed: Speaking rate (0.5 - 2.0), defaults to voice type optimal
            pitch: Voice pitch (-20.0 - 20.0), defaults to voice type optimal
            voice_id: Specific voice ID to use
            mood: Detected emotion for adaptive synthesis

        Returns:
            Audio bytes or None if synthesis fails
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for TTS")
            return None

        # Normalize language code (zh-CN → zh, en-IN → en)
        language = normalize_language_code(language)

        voice_settings = VOICE_TYPE_SETTINGS.get(voice_type, VOICE_TYPE_SETTINGS["friendly"])
        actual_speed = speed if speed is not None else voice_settings["speed"]

        # Check cache first
        cache_key = self._generate_cache_key(text, language, voice_type, actual_speed, voice_id)
        cached_audio = self._get_cached_audio(cache_key)
        if cached_audio:
            return cached_audio

        # Check offline disk cache
        offline_cached = self.offline_cache.get(text, language, voice_type, voice_id)
        if offline_cached:
            logger.info("Using offline cached audio")
            return offline_cached

        # Auto-detect mood if not provided
        if mood is None:
            mood = self._detect_emotion_from_text(text)

        # Synthesize using provider chain (async)
        audio = self._run_async_synthesis(text, language, voice_type, mood, voice_id)

        if audio:
            self._cache_audio(cache_key, audio)
            self.offline_cache.set(text, language, voice_type, audio, voice_id)
            return audio

        return None

    def _run_async_synthesis(
        self,
        text: str,
        language: str,
        voice_type: str,
        mood: str,
        voice_id: Optional[str],
    ) -> Optional[bytes]:
        """Run async synthesis in sync context."""
        try:
            loop = asyncio.get_running_loop()
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(
                    self._run_synthesis_in_new_loop,
                    text, language, voice_type, mood, voice_id
                )
                return future.result(timeout=30)
        except RuntimeError:
            return self._run_synthesis_in_new_loop(text, language, voice_type, mood, voice_id)

    def _run_synthesis_in_new_loop(
        self,
        text: str,
        language: str,
        voice_type: str,
        mood: str,
        voice_id: Optional[str],
    ) -> Optional[bytes]:
        """Run async synthesis in a new event loop."""
        loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(loop)
            return loop.run_until_complete(
                self._synthesize_with_providers(text, language, voice_type, mood, voice_id)
            )
        finally:
            loop.close()
            asyncio.set_event_loop(None)

    def _detect_emotion_from_text(self, text: str) -> str:
        """
        Detect emotion from text content for adaptive voice prosody.

        Uses multi-layer detection:
        1. Strong emotional phrases
        2. Weighted keyword scoring
        3. Context-aware fallback

        Args:
            text: Input text

        Returns:
            Detected emotion string
        """
        text_lower = text.lower()

        # Layer 1: Strong emotional phrases
        strong_indicators = {
            "anxiety": [
                "i'm so worried", "can't stop thinking", "feel anxious",
                "panic attack", "overwhelming", "can't breathe", "racing thoughts",
            ],
            "sadness": [
                "i feel sad", "i'm depressed", "feel empty", "feel alone",
                "nobody cares", "heartbroken", "feel hopeless",
            ],
            "joy": [
                "so happy", "feeling great", "wonderful day", "amazing news",
                "thrilled", "best day", "overjoyed",
            ],
            "peace": [
                "at peace", "feel calm", "inner peace", "found serenity",
                "letting go", "acceptance", "mindful", "centered",
            ],
            "anger": [
                "so angry", "makes me furious", "can't stand", "hate this",
                "infuriating", "fed up", "had enough",
            ],
            "hope": [
                "there's hope", "looking forward", "better tomorrow",
                "things will improve", "optimistic", "new beginning",
            ],
            "love": [
                "love you", "deeply care", "my heart", "soul connection",
                "unconditional", "cherish",
            ],
            "gratitude": [
                "thank you so much", "deeply grateful", "appreciate everything",
                "blessed to have", "thankful for",
            ],
            "fear": [
                "i'm scared", "terrified", "frightened", "fear of",
                "afraid of", "nightmare",
            ],
        }

        for emotion, phrases in strong_indicators.items():
            for phrase in phrases:
                if phrase in text_lower:
                    return emotion

        # Layer 2: Weighted keyword detection
        emotion_keywords = {
            "anxiety": {"anxious": 3, "worried": 2, "nervous": 2, "stressed": 3, "panic": 3},
            "sadness": {"sad": 3, "depressed": 3, "lonely": 2, "grief": 3, "crying": 3},
            "joy": {"happy": 3, "joy": 3, "grateful": 2, "wonderful": 2, "excited": 3},
            "peace": {"calm": 3, "peaceful": 3, "serene": 3, "tranquil": 3, "relaxed": 2},
            "anger": {"angry": 3, "frustrated": 2, "furious": 3, "rage": 3},
            "hope": {"hope": 3, "hopeful": 3, "optimistic": 3, "believe": 2},
            "love": {"love": 3, "caring": 2, "compassion": 2, "kindness": 2},
            "fear": {"afraid": 3, "terrified": 3, "frightened": 3},
        }

        emotion_scores = {}
        words = re.findall(r'\b\w+\b', text_lower)

        for emotion, keywords in emotion_keywords.items():
            score = sum(keywords.get(word, 0) for word in words)
            if score > 0:
                emotion_scores[emotion] = score

        if emotion_scores:
            best_emotion = max(emotion_scores, key=emotion_scores.get)
            if emotion_scores[best_emotion] >= 2:
                return best_emotion

        # Layer 3: Context-aware fallback
        spiritual_words = ['meditation', 'mindfulness', 'breath', 'dharma', 'karma', 'yoga']
        if any(word in text_lower for word in spiritual_words):
            return "peace"

        return "neutral"

    def synthesize_with_emotion(
        self,
        text: str,
        language: str = "en",
        voice_type: VoiceType = "friendly",
        emotion: Optional[str] = None,
        speed: Optional[float] = None,
        pitch: Optional[float] = None,
        add_emphasis: bool = True,
        breathing_simulation: bool = False,
    ) -> Optional[bytes]:
        """
        Synthesize text with emotion-aware prosody.

        Args:
            text: Text to synthesize
            language: Language code
            voice_type: Voice persona
            emotion: Emotion to convey (auto-detected if None)
            speed: Speaking rate override
            pitch: Pitch override
            add_emphasis: Add emphasis to spiritual terms
            breathing_simulation: Add breathing pauses

        Returns:
            Audio bytes
        """
        if not text or not text.strip():
            return None

        if emotion is None:
            emotion = self._detect_emotion_from_text(text)

        return self.synthesize(
            text=text,
            language=language,
            voice_type=voice_type,
            speed=speed,
            pitch=pitch,
            mood=emotion,
        )

    def synthesize_affirmation(
        self,
        affirmation: str,
        language: str = "en",
        include_breathing: bool = True,
    ) -> Optional[bytes]:
        """Synthesize an affirmation with calm, impactful delivery."""
        return self.synthesize(
            text=affirmation,
            language=language,
            voice_type="calm",
            speed=0.85,
            mood="peace",
        )

    def synthesize_guided_meditation(
        self,
        script: str,
        language: str = "en",
        include_long_pauses: bool = True,
    ) -> Optional[bytes]:
        """Synthesize guided meditation with calm prosody."""
        return self.synthesize(
            text=script,
            language=language,
            voice_type="calm",
            speed=0.80,
            mood="peace",
        )

    def synthesize_verse_with_context(
        self,
        verse_text: str,
        context_text: Optional[str] = None,
        language: str = "en",
        include_sanskrit: bool = False,
        sanskrit_text: Optional[str] = None,
    ) -> Optional[bytes]:
        """Synthesize a Gita verse with optional context and Sanskrit."""
        full_text = ""

        if include_sanskrit and sanskrit_text:
            full_text += f"{sanskrit_text}... "

        full_text += verse_text

        if context_text:
            full_text += f"... {context_text}"

        return self.synthesize(
            text=full_text,
            language=language,
            voice_type="wisdom",
            mood="peace",
        )

    def synthesize_verse(
        self,
        verse_text: str,
        language: str = "en",
        include_commentary: bool = False,
        commentary_text: Optional[str] = None
    ) -> Optional[bytes]:
        """Synthesize Gita verse with optional commentary."""
        full_text = verse_text

        if include_commentary and commentary_text:
            full_text = f"{verse_text}... {commentary_text}"

        return self.synthesize(
            text=full_text,
            language=language,
            voice_type="wisdom",
        )

    def synthesize_kiaan_message(
        self,
        message: str,
        language: str = "en"
    ) -> Optional[bytes]:
        """Synthesize KIAAN chatbot message with conversational tone."""
        return self.synthesize(
            text=message,
            language=language,
            voice_type="friendly",
        )

    def synthesize_meditation(
        self,
        meditation_script: str,
        language: str = "en"
    ) -> Optional[bytes]:
        """Synthesize meditation guidance with soothing voice."""
        return self.synthesize(
            text=meditation_script,
            language=language,
            voice_type="calm",
        )

    def synthesize_divine_ssml(
        self,
        ssml_text: str,
        language: str = "en",
        voice_type: VoiceType = "calm",
        speed: Optional[float] = None,
        pitch: Optional[float] = None
    ) -> Optional[bytes]:
        """
        Synthesize pre-formatted SSML for divine voice.

        Strips SSML tags and uses the premium provider chain
        since SSML is provider-specific.

        Args:
            ssml_text: Pre-formatted SSML text
            language: Language code
            voice_type: Voice persona
            speed: Speaking rate
            pitch: Voice pitch

        Returns:
            Audio bytes or None
        """
        if not ssml_text or not ssml_text.strip():
            return None

        # Strip SSML tags and use plain text with premium providers
        plain_text = self._strip_ssml_tags(ssml_text)

        voice_settings = VOICE_TYPE_SETTINGS.get(voice_type, VOICE_TYPE_SETTINGS["calm"])
        actual_speed = speed if speed is not None else voice_settings["speed"]

        if language == "sa":
            actual_speed = min(actual_speed, 0.90)

        return self.synthesize(
            text=plain_text,
            language=language,
            voice_type=voice_type,
            speed=actual_speed,
            pitch=pitch,
            mood="peace",
        )

    def _strip_ssml_tags(self, ssml_text: str) -> str:
        """Strip SSML tags from text."""
        text = re.sub(r'<[^>]+>', '', ssml_text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def synthesize_sanskrit_shloka(
        self,
        shloka_ssml: str,
        voice_type: VoiceType = "wisdom",
        speed: float = 0.88,
        pitch: float = -2.0
    ) -> Optional[bytes]:
        """Synthesize a Sanskrit shloka with proper pronunciation."""
        return self.synthesize_divine_ssml(
            ssml_text=shloka_ssml,
            language="sa",
            voice_type=voice_type,
            speed=speed,
            pitch=pitch,
        )

    def synthesize_vedic_chant(
        self,
        chant_ssml: str,
        repetitions: int = 1,
        voice_type: VoiceType = "calm",
        speed: float = 0.82,
        pitch: float = -3.0
    ) -> Optional[bytes]:
        """Synthesize a Vedic chant/mantra."""
        return self.synthesize_divine_ssml(
            ssml_text=chant_ssml,
            language="sa",
            voice_type=voice_type,
            speed=speed,
            pitch=pitch,
        )

    def get_supported_languages(self) -> list[str]:
        """Get list of supported language codes."""
        return list(SUPPORTED_LANGUAGES)

    def clear_cache(self) -> None:
        """Clear all cached audio."""
        self.memory_cache.clear()
        logger.info("Memory cache cleared")

        if self.redis_client:
            try:
                keys = self.redis_client.keys("tts:*")
                if keys:
                    self.redis_client.delete(*keys)
                logger.info(f"Cleared {len(keys)} keys from Redis cache")
            except Exception as e:
                logger.warning(f"Failed to clear Redis cache: {e}")


# Singleton instance with thread-safe initialization
_tts_service_instance: Optional[TTSService] = None
_tts_service_lock = threading.Lock()


def get_tts_service(redis_client=None) -> TTSService:
    """Get singleton TTS service instance."""
    global _tts_service_instance
    if _tts_service_instance is None:
        with _tts_service_lock:
            if _tts_service_instance is None:
                _tts_service_instance = TTSService(redis_client)
    return _tts_service_instance


def get_available_tts_providers() -> Dict[str, bool]:
    """Get status of all TTS providers."""
    sarvam_available = False
    elevenlabs_available = False

    try:
        from backend.services.sarvam_tts_service import is_sarvam_available
        sarvam_available = is_sarvam_available()
    except ImportError:
        pass

    try:
        from backend.services.elevenlabs_tts_service import is_elevenlabs_available
        elevenlabs_available = is_elevenlabs_available()
    except ImportError:
        pass

    return {
        "sarvam_ai_bulbul": sarvam_available,
        "elevenlabs": elevenlabs_available,
    }


# Voice quality tiers for provider comparison
PROVIDER_QUALITY_TIERS = {
    "elevenlabs": {
        "tier": "premium",
        "quality_score": 100,
        "naturalness": "studio-grade",
        "features": [
            "Most natural human-like voices",
            "29+ languages with native pronunciation",
            "Emotion-adaptive expressiveness",
            "Real-time streaming support",
        ],
        "latency_ms": 200,
    },
    "sarvam_ai_bulbul": {
        "tier": "premium",
        "quality_score": 95,
        "naturalness": "native-indian",
        "features": [
            "Bulbul v1 model",
            "Native Indian language pronunciation",
            "11 Indian languages + Indian English",
            "Emotion-adaptive pace/pitch/loudness",
            "Sanskrit via Hindi voice",
        ],
        "latency_ms": 250,
        "priority_languages": [
            "hi", "ta", "te", "bn", "kn", "ml", "mr", "gu", "pa", "od", "sa", "en-IN",
        ],
    },
}


def get_tts_provider_quality_info() -> Dict[str, any]:
    """Get detailed quality information about available TTS providers."""
    providers = get_available_tts_providers()

    active_provider = "unavailable"
    if providers.get("elevenlabs"):
        active_provider = "elevenlabs"
    elif providers.get("sarvam_ai_bulbul"):
        active_provider = "sarvam_ai_bulbul"
    return {
        "active_provider": active_provider,
        "sarvam_ai_available": providers.get("sarvam_ai_bulbul", False),
        "elevenlabs_available": providers.get("elevenlabs", False),
        "providers": {
            name: {
                **info,
                "available": providers.get(name, False),
            }
            for name, info in PROVIDER_QUALITY_TIERS.items()
        },
        "quality_tier": PROVIDER_QUALITY_TIERS.get(active_provider, {}).get("tier", "unavailable"),
        "quality_score": PROVIDER_QUALITY_TIERS.get(active_provider, {}).get("quality_score", 0),
    }


class TTSSynthesisError(Exception):
    """Custom exception for TTS synthesis failures."""

    def __init__(
        self,
        message: str,
        provider: str = "unknown",
        error_code: str = "TTS_FAILED",
        recoverable: bool = True,
        user_message: str = None
    ):
        self.message = message
        self.provider = provider
        self.error_code = error_code
        self.recoverable = recoverable
        self.user_message = user_message or "Voice synthesis is temporarily unavailable. Please try again."
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, any]:
        """Convert to dictionary for API response."""
        return {
            "error": self.error_code,
            "message": self.user_message,
            "provider": self.provider,
            "recoverable": self.recoverable,
            "technical_message": self.message,
        }


def get_tts_health_status() -> Dict[str, any]:
    """Get comprehensive health status of the TTS system."""
    providers = get_available_tts_providers()
    quality = get_tts_provider_quality_info()

    any_available = any(providers.values())

    if providers.get("sarvam_ai_bulbul") and providers.get("elevenlabs"):
        health = "healthy"
        status_message = "Premium voice quality available (Sarvam AI + ElevenLabs)"
    elif providers.get("sarvam_ai_bulbul") or providers.get("elevenlabs"):
        health = "healthy"
        status_message = "Premium voice quality available"
    else:
        health = "unavailable"
        status_message = "Voice synthesis providers not configured"

    return {
        "health": health,
        "status_message": status_message,
        "providers": providers,
        "quality": quality,
        "features": {
            "emotion_detection": True,
            "multi_language": True,
            "sarvam_indian_voices": providers.get("sarvam_ai_bulbul", False),
            "elevenlabs_premium": providers.get("elevenlabs", False),
        },
    }
