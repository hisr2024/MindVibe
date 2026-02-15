"""Divine Voice Orchestrator - Premium TTS System for KIAAN

Orchestrates Sarvam AI, Bhashini AI, and ElevenLabs TTS providers
to deliver world-class voice quality for KIAAN, with special handling
for Sanskrit pronunciation and Indian languages.

PROVIDERS:
1. Sarvam AI Bulbul - India's best for Sanskrit/Hindi (11 Indian languages)
2. Bhashini AI - Government of India platform (22 scheduled languages)
3. ElevenLabs - Studio-grade international voices
4. Browser Web Speech API - Always available fallback

Provider Priority:
  Indian Languages: Sarvam AI → Bhashini AI → ElevenLabs
  International:    ElevenLabs → Sarvam AI

Quality Ranking (1-10):
- Sarvam AI (Sanskrit/Hindi): 9.5
- Bhashini AI (Indian languages): 9.0
- ElevenLabs (International): 9.3
- Browser TTS: 5.0

The orchestrator automatically selects the best provider based on:
1. Language (Sanskrit/Hindi → Sarvam AI, Indian → Bhashini AI)
2. Availability (API key present)
3. Quality ranking
4. Fallback chain
"""

import os
import logging
from typing import Optional, Dict, List, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import base64
import hashlib
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class VoiceProvider(Enum):
    """Available TTS providers"""
    SARVAM_AI = "sarvam_ai"           # India's best for Sanskrit/Hindi
    BHASHINI_AI = "bhashini_ai"       # Government of India 22 languages
    ELEVENLABS = "elevenlabs"         # Studio-grade international voices
    BROWSER_TTS = "browser_tts"       # Browser fallback


class VoiceGender(Enum):
    """Voice gender options"""
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"


class VoiceStyle(Enum):
    """Voice style for different contexts"""
    DIVINE = "divine"           # Sacred, reverent
    CALM = "calm"               # Meditation, relaxation
    WISDOM = "wisdom"           # Teaching, verses
    FRIENDLY = "friendly"       # Conversational KIAAN
    CHANTING = "chanting"       # Mantra, shloka recitation


@dataclass
class VoiceConfig:
    """Configuration for a specific voice"""
    provider: VoiceProvider
    voice_id: str
    language: str
    gender: VoiceGender
    style: VoiceStyle
    quality_score: float  # 1-10
    speed: float = 1.0
    pitch: float = 0.0
    description: str = ""


@dataclass
class SynthesisResult:
    """Result of voice synthesis"""
    success: bool
    audio_data: Optional[bytes]
    audio_format: str
    provider_used: VoiceProvider
    quality_score: float
    latency_ms: float
    error: Optional[str] = None
    fallback_used: bool = False


# ============================================
# PROVIDER CONFIGURATIONS
# ============================================

# Sarvam AI Voices (Best for Sanskrit/Hindi/Indian languages)
SARVAM_VOICES = {
    "divine_female": VoiceConfig(
        provider=VoiceProvider.SARVAM_AI,
        voice_id="anushka",
        language="hi-IN",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.DIVINE,
        quality_score=9.5,
        speed=0.9,
        pitch=-1.0,
        description="Divine feminine voice for Sanskrit recitation"
    ),
    "wisdom_male": VoiceConfig(
        provider=VoiceProvider.SARVAM_AI,
        voice_id="abhilash",
        language="hi-IN",
        gender=VoiceGender.MALE,
        style=VoiceStyle.WISDOM,
        quality_score=9.5,
        speed=0.85,
        pitch=-2.0,
        description="Wise male voice for Gita teachings"
    ),
    "calm_female": VoiceConfig(
        provider=VoiceProvider.SARVAM_AI,
        voice_id="vidya",
        language="hi-IN",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.CALM,
        quality_score=9.5,
        speed=0.85,
        pitch=-1.5,
        description="Calm voice for meditation guidance"
    ),
}

# ElevenLabs Voices (Studio-grade for English/International)
ELEVENLABS_VOICES = {
    "divine_female_en": VoiceConfig(
        provider=VoiceProvider.ELEVENLABS,
        voice_id="EXAVITQu4vr4xnSDxMaL",  # Bella
        language="en-US",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.DIVINE,
        quality_score=9.3,
        speed=0.92,
        pitch=-1.0,
        description="Natural, warm female voice for divine speech"
    ),
    "wisdom_male_en": VoiceConfig(
        provider=VoiceProvider.ELEVENLABS,
        voice_id="onwK4e9ZLuTAKqWW03F9",  # Daniel
        language="en-US",
        gender=VoiceGender.MALE,
        style=VoiceStyle.WISDOM,
        quality_score=9.3,
        speed=0.9,
        pitch=-1.5,
        description="Authoritative, wise male voice"
    ),
    "calm_female_en": VoiceConfig(
        provider=VoiceProvider.ELEVENLABS,
        voice_id="jBpfAIEiAUkR2KqPSoCY",  # Emily
        language="en-US",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.CALM,
        quality_score=9.3,
        speed=0.88,
        pitch=-1.0,
        description="Calm, soothing voice for meditation"
    ),
    "friendly_female_en": VoiceConfig(
        provider=VoiceProvider.ELEVENLABS,
        voice_id="EXAVITQu4vr4xnSDxMaL",  # Bella
        language="en-US",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.FRIENDLY,
        quality_score=9.3,
        speed=0.95,
        pitch=0.5,
        description="Conversational, friendly voice"
    ),
}

# Bhashini AI Voices (Government of India - 22 Indian languages)
BHASHINI_VOICES = {
    "divine_female_hi": VoiceConfig(
        provider=VoiceProvider.BHASHINI_AI,
        voice_id="bhashini-devi",
        language="hi-IN",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.DIVINE,
        quality_score=9.0,
        speed=0.9,
        pitch=-1.0,
        description="Hindi female voice from Bhashini AI"
    ),
    "wisdom_male_hi": VoiceConfig(
        provider=VoiceProvider.BHASHINI_AI,
        voice_id="bhashini-arya",
        language="hi-IN",
        gender=VoiceGender.MALE,
        style=VoiceStyle.WISDOM,
        quality_score=9.0,
        speed=0.85,
        pitch=-2.0,
        description="Hindi male voice for wisdom teachings"
    ),
}


class DivineVoiceOrchestrator:
    """Orchestrates Sarvam AI, Bhashini AI, and ElevenLabs TTS providers.

    Features:
    - Automatic provider selection based on language and style
    - Quality-ranked fallback chain
    - Sanskrit pronunciation optimization
    - Audio caching for performance
    - Universal stop capability
    """

    def __init__(self):
        self._cache: Dict[str, Tuple[bytes, datetime]] = {}
        self._cache_ttl = timedelta(hours=24)
        self._max_cache_size = 100

        # Check which providers are available
        self._sarvam_available = bool(os.getenv("SARVAM_API_KEY", "").strip())
        self._bhashini_available = bool(
            os.getenv("BHASHINI_API_KEY", "").strip()
            and os.getenv("BHASHINI_USER_ID", "").strip()
        )
        self._elevenlabs_available = bool(os.getenv("ELEVENLABS_API_KEY", "").strip())

        # Active synthesis tracking for stop functionality
        self._active_synthesis: Dict[str, bool] = {}

        logger.info(
            f"Divine Voice Orchestrator initialized. "
            f"Sarvam: {self._sarvam_available}, "
            f"Bhashini: {self._bhashini_available}, "
            f"ElevenLabs: {self._elevenlabs_available}"
        )

    def _get_cache_key(self, text: str, voice_config: VoiceConfig) -> str:
        """Generate cache key for audio"""
        content = f"{text}:{voice_config.voice_id}:{voice_config.speed}:{voice_config.pitch}"
        return hashlib.md5(content.encode()).hexdigest()

    def _get_from_cache(self, cache_key: str) -> Optional[bytes]:
        """Get audio from cache if not expired"""
        if cache_key in self._cache:
            audio_data, timestamp = self._cache[cache_key]
            if datetime.now() - timestamp < self._cache_ttl:
                return audio_data
            else:
                del self._cache[cache_key]
        return None

    def _add_to_cache(self, cache_key: str, audio_data: bytes):
        """Add audio to cache with LRU eviction"""
        if len(self._cache) >= self._max_cache_size:
            oldest_key = min(self._cache.keys(),
                             key=lambda k: self._cache[k][1])
            del self._cache[oldest_key]

        self._cache[cache_key] = (audio_data, datetime.now())

    def get_best_voice_for_context(
        self,
        language: str,
        style: VoiceStyle,
        gender: VoiceGender = VoiceGender.FEMALE,
        is_sanskrit: bool = False
    ) -> VoiceConfig:
        """Select the best voice for the given context.

        Priority:
        1. Sanskrit/Hindi → Sarvam AI (if available)
        2. Indian languages → Bhashini AI (if available)
        3. English/International → ElevenLabs (if available)
        4. Fallback through the chain
        """
        # For Sanskrit or Hindi, prefer Sarvam AI
        if is_sanskrit or language in ["sa", "hi", "hi-IN", "sa-IN"]:
            if self._sarvam_available:
                for voice_key, voice in SARVAM_VOICES.items():
                    if voice.style == style or style == VoiceStyle.CHANTING:
                        return voice
                return SARVAM_VOICES["divine_female"]

            # Fallback to Bhashini for Hindi
            if self._bhashini_available:
                for voice_key, voice in BHASHINI_VOICES.items():
                    if voice.style == style:
                        return voice
                return BHASHINI_VOICES["divine_female_hi"]

        # For other Indian languages, prefer Bhashini AI
        indian_languages = {
            "ta", "te", "bn", "kn", "ml", "mr", "gu", "pa",
            "od", "as", "ne", "ur", "sd", "doi", "mai", "kok",
        }
        if language in indian_languages:
            if self._bhashini_available:
                return BHASHINI_VOICES["divine_female_hi"]
            if self._sarvam_available:
                return SARVAM_VOICES["divine_female"]

        # For English / International, use ElevenLabs
        if self._elevenlabs_available:
            candidates = []
            for voice_key, voice in ELEVENLABS_VOICES.items():
                if voice.style == style:
                    candidates.append((voice, voice.quality_score + 1.0))
                else:
                    candidates.append((voice, voice.quality_score))

            if candidates:
                candidates.sort(key=lambda x: x[1], reverse=True)
                return candidates[0][0]

        # Ultimate fallback: try Sarvam, then Bhashini
        if self._sarvam_available:
            return SARVAM_VOICES["divine_female"]
        if self._bhashini_available:
            return BHASHINI_VOICES["divine_female_hi"]

        # No providers available - return ElevenLabs config (will fail gracefully)
        return ELEVENLABS_VOICES["friendly_female_en"]

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        style: VoiceStyle = VoiceStyle.FRIENDLY,
        gender: VoiceGender = VoiceGender.FEMALE,
        is_sanskrit: bool = False,
        ssml: str = None,
        synthesis_id: str = None
    ) -> SynthesisResult:
        """Synthesize speech with automatic provider selection and fallback.

        Args:
            text: Text to synthesize
            language: Language code (en, hi, sa)
            style: Voice style
            gender: Voice gender preference
            is_sanskrit: Whether text contains Sanskrit
            ssml: Pre-formatted SSML (overrides text)
            synthesis_id: ID for tracking/stopping synthesis

        Returns:
            SynthesisResult with audio data and metadata
        """
        import time
        start_time = time.time()

        if synthesis_id is None:
            synthesis_id = hashlib.md5(f"{text}{time.time()}".encode()).hexdigest()[:8]

        self._active_synthesis[synthesis_id] = True

        try:
            voice_config = self.get_best_voice_for_context(
                language, style, gender, is_sanskrit
            )

            # Check cache
            cache_key = self._get_cache_key(ssml or text, voice_config)
            cached_audio = self._get_from_cache(cache_key)
            if cached_audio:
                logger.info("Using cached audio for synthesis")
                return SynthesisResult(
                    success=True,
                    audio_data=cached_audio,
                    audio_format="wav",
                    provider_used=voice_config.provider,
                    quality_score=voice_config.quality_score,
                    latency_ms=0,
                    fallback_used=False
                )

            # Check if stopped
            if not self._active_synthesis.get(synthesis_id, True):
                return SynthesisResult(
                    success=False,
                    audio_data=None,
                    audio_format="",
                    provider_used=voice_config.provider,
                    quality_score=0,
                    latency_ms=0,
                    error="Synthesis stopped by user"
                )

            # Try primary provider
            result = await self._synthesize_with_provider(
                ssml or text, voice_config, use_ssml=ssml is not None
            )

            if result.success:
                self._add_to_cache(cache_key, result.audio_data)
                result.latency_ms = (time.time() - start_time) * 1000
                return result

            # Fallback chain
            fallback_providers = self._get_fallback_chain(voice_config, language)
            for fallback_config in fallback_providers:
                if not self._active_synthesis.get(synthesis_id, True):
                    break

                logger.warning(f"Trying fallback provider: {fallback_config.provider}")
                result = await self._synthesize_with_provider(
                    ssml or text, fallback_config, use_ssml=ssml is not None
                )

                if result.success:
                    result.fallback_used = True
                    self._add_to_cache(cache_key, result.audio_data)
                    result.latency_ms = (time.time() - start_time) * 1000
                    return result

            return SynthesisResult(
                success=False,
                audio_data=None,
                audio_format="",
                provider_used=voice_config.provider,
                quality_score=0,
                latency_ms=(time.time() - start_time) * 1000,
                error="All TTS providers failed"
            )

        finally:
            self._active_synthesis.pop(synthesis_id, None)

    async def _synthesize_with_provider(
        self,
        text: str,
        voice_config: VoiceConfig,
        use_ssml: bool = False
    ) -> SynthesisResult:
        """Synthesize with a specific provider"""
        if voice_config.provider == VoiceProvider.SARVAM_AI:
            return await self._synthesize_sarvam(text, voice_config, use_ssml)
        elif voice_config.provider == VoiceProvider.BHASHINI_AI:
            return await self._synthesize_bhashini(text, voice_config)
        elif voice_config.provider == VoiceProvider.ELEVENLABS:
            return await self._synthesize_elevenlabs(text, voice_config)
        else:
            return SynthesisResult(
                success=False,
                audio_data=None,
                audio_format="",
                provider_used=voice_config.provider,
                quality_score=0,
                latency_ms=0,
                error=f"Provider {voice_config.provider} not implemented"
            )

    async def _synthesize_sarvam(
        self,
        text: str,
        voice_config: VoiceConfig,
        use_ssml: bool = False
    ) -> SynthesisResult:
        """Synthesize using Sarvam AI Bulbul API"""
        try:
            import httpx

            api_key = os.getenv("SARVAM_API_KEY", "").strip()
            if not api_key:
                return SynthesisResult(
                    success=False, audio_data=None, audio_format="",
                    provider_used=VoiceProvider.SARVAM_AI,
                    quality_score=0, latency_ms=0,
                    error="Sarvam API key not configured"
                )

            payload = {
                "input": text,
                "model": "bulbul:v2",
                "voice": voice_config.voice_id,
                "language_code": voice_config.language,
                "pitch": voice_config.pitch,
                "pace": voice_config.speed,
                "loudness": 1.0,
                "speech_sample_rate": 24000,
                "enable_preprocessing": True,
            }

            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    "https://api.sarvam.ai/v1/tts",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

                if response.status_code == 200:
                    data = response.json()
                    audio_base64 = data.get("audio_content", "")
                    audio_data = base64.b64decode(audio_base64)

                    return SynthesisResult(
                        success=True,
                        audio_data=audio_data,
                        audio_format="wav",
                        provider_used=VoiceProvider.SARVAM_AI,
                        quality_score=voice_config.quality_score,
                        latency_ms=0
                    )
                else:
                    logger.error(f"Sarvam API error: status={response.status_code}")
                    return SynthesisResult(
                        success=False, audio_data=None, audio_format="",
                        provider_used=VoiceProvider.SARVAM_AI,
                        quality_score=0, latency_ms=0,
                        error=f"Sarvam API error: {response.status_code}"
                    )

        except Exception as e:
            logger.error(f"Sarvam synthesis error: {e}")
            return SynthesisResult(
                success=False, audio_data=None, audio_format="",
                provider_used=VoiceProvider.SARVAM_AI,
                quality_score=0, latency_ms=0,
                error=str(e)
            )

    async def _synthesize_bhashini(
        self,
        text: str,
        voice_config: VoiceConfig,
    ) -> SynthesisResult:
        """Synthesize using Bhashini AI (Government of India platform)"""
        try:
            from backend.services.bhashini_tts_service import (
                synthesize_bhashini_tts,
                is_bhashini_available,
            )

            if not is_bhashini_available():
                return SynthesisResult(
                    success=False, audio_data=None, audio_format="",
                    provider_used=VoiceProvider.BHASHINI_AI,
                    quality_score=0, latency_ms=0,
                    error="Bhashini API not configured"
                )

            # Map language code (hi-IN → hi)
            lang = voice_config.language.split("-")[0]
            gender_str = "female" if voice_config.gender == VoiceGender.FEMALE else "male"

            audio_bytes = await synthesize_bhashini_tts(
                text=text,
                language=lang,
                voice_id=voice_config.voice_id,
                mood="neutral",
            )

            if audio_bytes and len(audio_bytes) > 100:
                return SynthesisResult(
                    success=True,
                    audio_data=audio_bytes,
                    audio_format="wav",
                    provider_used=VoiceProvider.BHASHINI_AI,
                    quality_score=voice_config.quality_score,
                    latency_ms=0
                )
            else:
                return SynthesisResult(
                    success=False, audio_data=None, audio_format="",
                    provider_used=VoiceProvider.BHASHINI_AI,
                    quality_score=0, latency_ms=0,
                    error="Bhashini returned empty audio"
                )

        except Exception as e:
            logger.error(f"Bhashini synthesis error: {e}")
            return SynthesisResult(
                success=False, audio_data=None, audio_format="",
                provider_used=VoiceProvider.BHASHINI_AI,
                quality_score=0, latency_ms=0,
                error=str(e)
            )

    async def _synthesize_elevenlabs(
        self,
        text: str,
        voice_config: VoiceConfig,
    ) -> SynthesisResult:
        """Synthesize using ElevenLabs API"""
        try:
            import httpx

            api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
            if not api_key:
                return SynthesisResult(
                    success=False, audio_data=None, audio_format="",
                    provider_used=VoiceProvider.ELEVENLABS,
                    quality_score=0, latency_ms=0,
                    error="ElevenLabs API key not configured"
                )

            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_config.voice_id}"

            payload = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.7,
                    "similarity_boost": 0.8,
                    "style": 0.5,
                    "use_speaker_boost": True,
                },
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    headers={
                        "xi-api-key": api_key,
                        "Content-Type": "application/json",
                        "Accept": "audio/mpeg",
                    },
                    json=payload,
                )

                if response.status_code == 200:
                    audio_data = response.content
                    if len(audio_data) > 100:
                        return SynthesisResult(
                            success=True,
                            audio_data=audio_data,
                            audio_format="mp3",
                            provider_used=VoiceProvider.ELEVENLABS,
                            quality_score=voice_config.quality_score,
                            latency_ms=0
                        )

                logger.error(f"ElevenLabs API error: status={response.status_code}")
                return SynthesisResult(
                    success=False, audio_data=None, audio_format="",
                    provider_used=VoiceProvider.ELEVENLABS,
                    quality_score=0, latency_ms=0,
                    error=f"ElevenLabs API error: {response.status_code}"
                )

        except Exception as e:
            logger.error(f"ElevenLabs synthesis error: {e}")
            return SynthesisResult(
                success=False, audio_data=None, audio_format="",
                provider_used=VoiceProvider.ELEVENLABS,
                quality_score=0, latency_ms=0,
                error=str(e)
            )

    def _get_fallback_chain(
        self,
        primary_config: VoiceConfig,
        language: str = "en",
    ) -> List[VoiceConfig]:
        """Get ordered list of fallback providers based on primary and language."""
        fallbacks = []

        indian_languages = {
            "sa", "hi", "ta", "te", "bn", "kn", "ml", "mr", "gu", "pa",
            "od", "as", "ne", "ur",
        }
        is_indian = language in indian_languages or language.startswith("hi") or language.startswith("sa")

        if primary_config.provider == VoiceProvider.SARVAM_AI:
            # Sarvam failed → try Bhashini → ElevenLabs
            if self._bhashini_available:
                fallbacks.append(BHASHINI_VOICES.get(
                    "divine_female_hi",
                    list(BHASHINI_VOICES.values())[0]
                ))
            if self._elevenlabs_available:
                fallbacks.append(ELEVENLABS_VOICES.get(
                    "friendly_female_en",
                    list(ELEVENLABS_VOICES.values())[0]
                ))

        elif primary_config.provider == VoiceProvider.BHASHINI_AI:
            # Bhashini failed → try Sarvam → ElevenLabs
            if self._sarvam_available:
                for voice in SARVAM_VOICES.values():
                    if voice.style == primary_config.style:
                        fallbacks.append(voice)
                        break
                if not fallbacks:
                    fallbacks.append(SARVAM_VOICES["divine_female"])
            if self._elevenlabs_available:
                fallbacks.append(ELEVENLABS_VOICES.get(
                    "friendly_female_en",
                    list(ELEVENLABS_VOICES.values())[0]
                ))

        elif primary_config.provider == VoiceProvider.ELEVENLABS:
            # ElevenLabs failed → try Sarvam (for Indian) → Bhashini
            if is_indian:
                if self._sarvam_available:
                    fallbacks.append(SARVAM_VOICES["divine_female"])
                if self._bhashini_available:
                    fallbacks.append(BHASHINI_VOICES["divine_female_hi"])
            else:
                if self._sarvam_available:
                    fallbacks.append(SARVAM_VOICES["divine_female"])

        return fallbacks

    def stop_synthesis(self, synthesis_id: str = None):
        """Stop active synthesis. If synthesis_id is None, stops ALL."""
        if synthesis_id:
            self._active_synthesis[synthesis_id] = False
        else:
            for sid in self._active_synthesis:
                self._active_synthesis[sid] = False
        logger.info(f"Stopped synthesis: {synthesis_id or 'ALL'}")

    def stop_all(self):
        """Stop all active voice operations"""
        self.stop_synthesis()
        self.clear_cache()
        logger.info("All voice operations stopped")

    def clear_cache(self):
        """Clear audio cache"""
        self._cache.clear()

    async def synthesize_sanskrit_shloka(
        self,
        shloka: str,
        chandas: str = "anuṣṭubh",
        with_meaning: bool = False,
        meaning_text: str = None
    ) -> SynthesisResult:
        """Synthesize a Sanskrit shloka with perfect pronunciation.

        Uses Sanskrit phonology for IPA conversion and optimal
        voice settings for sacred recitation.
        """
        ssml = None
        try:
            from services.sanskrit_phonology import sanskrit_ssml, CHANDAS_PATTERNS
            ssml = sanskrit_ssml.generate_shloka_ssml(
                shloka,
                chandas=chandas,
                speed=0.85,
                pitch="-2st",
                with_vedic_accents=True
            )
        except ImportError:
            logger.debug("Sanskrit phonology not available, using plain text")

        result = await self.synthesize(
            text=shloka,
            language="sa",
            style=VoiceStyle.CHANTING,
            is_sanskrit=True,
            ssml=ssml
        )

        if with_meaning and meaning_text and result.success:
            meaning_result = await self.synthesize(
                text=meaning_text,
                language="en",
                style=VoiceStyle.WISDOM
            )
            if meaning_result.success:
                pass  # Audio concatenation would go here

        return result

    async def synthesize_divine_response(
        self,
        text: str,
        language: str = "en",
        include_sanskrit_words: List[str] = None
    ) -> SynthesisResult:
        """Synthesize KIAAN's divine response with proper Sanskrit pronunciation."""
        ssml = None
        try:
            from services.sanskrit_phonology import (
                sanskrit_ssml, detect_sanskrit_words, COMMON_SANSKRIT_WORDS
            )
            if include_sanskrit_words is None:
                include_sanskrit_words = detect_sanskrit_words(text)

            if include_sanskrit_words:
                ssml = sanskrit_ssml.generate_divine_response_ssml(
                    text,
                    include_sanskrit_words=include_sanskrit_words,
                    speed=0.92,
                    pitch="-1st"
                )
        except ImportError:
            logger.debug("Sanskrit phonology not available, using plain text")

        if ssml:
            return await self.synthesize(
                text=text,
                language=language,
                style=VoiceStyle.FRIENDLY,
                ssml=ssml
            )
        else:
            return await self.synthesize(
                text=text,
                language=language,
                style=VoiceStyle.FRIENDLY
            )


# ============================================
# GLOBAL INSTANCE
# ============================================

divine_voice = DivineVoiceOrchestrator()


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================

async def synthesize_kiaan_response(
    text: str,
    language: str = "en"
) -> SynthesisResult:
    """Quick synthesis for KIAAN responses"""
    return await divine_voice.synthesize_divine_response(text, language)


async def synthesize_shloka(
    shloka: str,
    chandas: str = "anuṣṭubh"
) -> SynthesisResult:
    """Quick synthesis for Sanskrit shlokas"""
    return await divine_voice.synthesize_sanskrit_shloka(shloka, chandas)


def stop_all_voice():
    """Stop all voice operations globally"""
    divine_voice.stop_all()
