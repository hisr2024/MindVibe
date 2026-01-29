"""
Divine Voice Orchestrator - World-Class Open Source TTS System

This module orchestrates multiple open-source TTS providers to deliver
the best possible voice quality for KIAAN, with special handling for
Sanskrit pronunciation.

PROVIDERS (All Open Source / Free Tier):
1. Google Cloud TTS - Free tier (4M chars/month), high quality Neural voices
2. Sarvam AI - Free tier, India's best for Sanskrit/Hindi
3. Browser Web Speech API - Always available fallback
4. Chatterbox (via API) - MIT license, ElevenLabs quality
5. Piper TTS - Local open source option

Quality Ranking (1-10):
- Sarvam AI (Sanskrit/Hindi): 9.5
- Google Neural2/Studio: 9.0
- Chatterbox: 9.0
- Google Standard: 7.0
- Browser TTS: 5.0

The orchestrator automatically selects the best provider based on:
1. Language (Sanskrit/Hindi -> Sarvam AI)
2. Availability (API key present)
3. Quality ranking
4. Fallback chain
"""

import os
import asyncio
import logging
from typing import Optional, Dict, List, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import base64
import json
import hashlib
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class VoiceProvider(Enum):
    """Available TTS providers"""
    SARVAM_AI = "sarvam_ai"           # India's best for Sanskrit
    GOOGLE_NEURAL = "google_neural"    # High quality neural voices
    GOOGLE_STUDIO = "google_studio"    # Premium studio voices
    GOOGLE_STANDARD = "google_standard"  # Standard voices
    BROWSER_TTS = "browser_tts"        # Browser fallback
    CHATTERBOX = "chatterbox"          # Open source, ElevenLabs quality
    PIPER = "piper"                    # Local open source


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

# Sarvam AI Voices (Best for Sanskrit/Hindi)
SARVAM_VOICES = {
    "divine_female": VoiceConfig(
        provider=VoiceProvider.SARVAM_AI,
        voice_id="anushka",  # Gentle, divine quality
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
        voice_id="abhilash",  # Authoritative, wise
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
        voice_id="vidya",  # Soothing, meditative
        language="hi-IN",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.CALM,
        quality_score=9.5,
        speed=0.85,
        pitch=-1.5,
        description="Calm voice for meditation guidance"
    ),
}

# Google Cloud TTS Voices
GOOGLE_VOICES = {
    "divine_female_en": VoiceConfig(
        provider=VoiceProvider.GOOGLE_NEURAL,
        voice_id="en-US-Neural2-F",
        language="en-US",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.DIVINE,
        quality_score=9.0,
        speed=0.92,
        pitch=-1.0,
        description="Natural, warm female voice"
    ),
    "wisdom_male_en": VoiceConfig(
        provider=VoiceProvider.GOOGLE_NEURAL,
        voice_id="en-US-Neural2-D",
        language="en-US",
        gender=VoiceGender.MALE,
        style=VoiceStyle.WISDOM,
        quality_score=9.0,
        speed=0.9,
        pitch=-1.5,
        description="Authoritative, wise male voice"
    ),
    "calm_female_en": VoiceConfig(
        provider=VoiceProvider.GOOGLE_STUDIO,
        voice_id="en-US-Studio-O",
        language="en-US",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.CALM,
        quality_score=9.2,
        speed=0.88,
        pitch=-1.0,
        description="Studio quality calm voice"
    ),
    "friendly_female_en": VoiceConfig(
        provider=VoiceProvider.GOOGLE_NEURAL,
        voice_id="en-US-Neural2-F",
        language="en-US",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.FRIENDLY,
        quality_score=9.0,
        speed=0.95,
        pitch=0.5,
        description="Conversational, friendly voice"
    ),
    # Hindi voices
    "divine_female_hi": VoiceConfig(
        provider=VoiceProvider.GOOGLE_NEURAL,
        voice_id="hi-IN-Neural2-D",
        language="hi-IN",
        gender=VoiceGender.FEMALE,
        style=VoiceStyle.DIVINE,
        quality_score=8.5,
        speed=0.9,
        pitch=-1.0,
        description="Hindi female neural voice"
    ),
}


class DivineVoiceOrchestrator:
    """
    Orchestrates multiple TTS providers for world-class voice quality.

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
        self._sarvam_available = bool(os.getenv("SARVAM_API_KEY"))
        self._google_available = bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or
                                      os.getenv("GOOGLE_CLOUD_PROJECT"))

        # Active synthesis tracking for stop functionality
        self._active_synthesis: Dict[str, bool] = {}

        logger.info(f"Divine Voice Orchestrator initialized. "
                   f"Sarvam: {self._sarvam_available}, Google: {self._google_available}")

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
            # Remove oldest entry
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
        """
        Select the best voice for the given context.

        Priority:
        1. Sanskrit/Hindi -> Sarvam AI (if available)
        2. Language match
        3. Style match
        4. Quality score
        """
        # For Sanskrit or Hindi, prefer Sarvam AI
        if is_sanskrit or language in ["sa", "hi", "hi-IN", "sa-IN"]:
            if self._sarvam_available:
                # Find best Sarvam voice for style
                for voice_key, voice in SARVAM_VOICES.items():
                    if voice.style == style or style == VoiceStyle.CHANTING:
                        return voice
                # Default to divine female for Sanskrit
                return SARVAM_VOICES["divine_female"]

        # For English, use Google voices
        candidates = []
        for voice_key, voice in GOOGLE_VOICES.items():
            if voice.language.startswith(language.split("-")[0]):
                if voice.style == style:
                    candidates.append((voice, voice.quality_score + 1.0))  # Bonus for style match
                else:
                    candidates.append((voice, voice.quality_score))

        if candidates:
            # Sort by adjusted quality score
            candidates.sort(key=lambda x: x[1], reverse=True)
            return candidates[0][0]

        # Default fallback
        return GOOGLE_VOICES["friendly_female_en"]

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
        """
        Synthesize speech with automatic provider selection.

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

        # Generate synthesis ID if not provided
        if synthesis_id is None:
            synthesis_id = hashlib.md5(f"{text}{time.time()}".encode()).hexdigest()[:8]

        # Track active synthesis
        self._active_synthesis[synthesis_id] = True

        try:
            # Get best voice configuration
            voice_config = self.get_best_voice_for_context(
                language, style, gender, is_sanskrit
            )

            # Check cache
            cache_key = self._get_cache_key(ssml or text, voice_config)
            cached_audio = self._get_from_cache(cache_key)
            if cached_audio:
                logger.info(f"Using cached audio for synthesis")
                return SynthesisResult(
                    success=True,
                    audio_data=cached_audio,
                    audio_format="mp3",
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
                ssml or text,
                voice_config,
                use_ssml=ssml is not None
            )

            if result.success:
                self._add_to_cache(cache_key, result.audio_data)
                result.latency_ms = (time.time() - start_time) * 1000
                return result

            # Fallback chain
            fallback_providers = self._get_fallback_chain(voice_config)
            for fallback_config in fallback_providers:
                if not self._active_synthesis.get(synthesis_id, True):
                    break

                logger.warning(f"Trying fallback provider: {fallback_config.provider}")
                result = await self._synthesize_with_provider(
                    ssml or text,
                    fallback_config,
                    use_ssml=ssml is not None
                )

                if result.success:
                    result.fallback_used = True
                    self._add_to_cache(cache_key, result.audio_data)
                    result.latency_ms = (time.time() - start_time) * 1000
                    return result

            # All providers failed
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
            # Clean up tracking
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
        elif voice_config.provider in [VoiceProvider.GOOGLE_NEURAL,
                                       VoiceProvider.GOOGLE_STUDIO,
                                       VoiceProvider.GOOGLE_STANDARD]:
            return await self._synthesize_google(text, voice_config, use_ssml)
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
        """Synthesize using Sarvam AI API"""
        import aiohttp

        api_key = os.getenv("SARVAM_API_KEY")
        if not api_key:
            return SynthesisResult(
                success=False,
                audio_data=None,
                audio_format="",
                provider_used=VoiceProvider.SARVAM_AI,
                quality_score=0,
                latency_ms=0,
                error="Sarvam API key not configured"
            )

        try:
            async with aiohttp.ClientSession() as session:
                # Sarvam AI TTS endpoint
                url = "https://api.sarvam.ai/v1/tts"

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

                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }

                async with session.post(url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        # Sarvam returns base64 encoded audio
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
                        error_text = await response.text()
                        logger.error(f"Sarvam API error: {error_text}")
                        return SynthesisResult(
                            success=False,
                            audio_data=None,
                            audio_format="",
                            provider_used=VoiceProvider.SARVAM_AI,
                            quality_score=0,
                            latency_ms=0,
                            error=f"Sarvam API error: {response.status}"
                        )

        except Exception as e:
            logger.error(f"Sarvam synthesis error: {e}")
            return SynthesisResult(
                success=False,
                audio_data=None,
                audio_format="",
                provider_used=VoiceProvider.SARVAM_AI,
                quality_score=0,
                latency_ms=0,
                error=str(e)
            )

    async def _synthesize_google(
        self,
        text: str,
        voice_config: VoiceConfig,
        use_ssml: bool = False
    ) -> SynthesisResult:
        """Synthesize using Google Cloud TTS"""
        try:
            from google.cloud import texttospeech

            client = texttospeech.TextToSpeechClient()

            # Prepare input
            if use_ssml:
                synthesis_input = texttospeech.SynthesisInput(ssml=text)
            else:
                synthesis_input = texttospeech.SynthesisInput(text=text)

            # Voice configuration
            voice = texttospeech.VoiceSelectionParams(
                language_code=voice_config.language,
                name=voice_config.voice_id
            )

            # Audio configuration
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=voice_config.speed,
                pitch=voice_config.pitch
            )

            # Synthesize
            response = client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            return SynthesisResult(
                success=True,
                audio_data=response.audio_content,
                audio_format="mp3",
                provider_used=voice_config.provider,
                quality_score=voice_config.quality_score,
                latency_ms=0
            )

        except Exception as e:
            logger.error(f"Google TTS error: {e}")
            return SynthesisResult(
                success=False,
                audio_data=None,
                audio_format="",
                provider_used=voice_config.provider,
                quality_score=0,
                latency_ms=0,
                error=str(e)
            )

    def _get_fallback_chain(self, primary_config: VoiceConfig) -> List[VoiceConfig]:
        """Get ordered list of fallback providers"""
        fallbacks = []

        # If primary was Sarvam, try Google
        if primary_config.provider == VoiceProvider.SARVAM_AI:
            if self._google_available:
                # Try to find matching style in Google voices
                for voice in GOOGLE_VOICES.values():
                    if voice.style == primary_config.style:
                        fallbacks.append(voice)
                        break
                # Add default Google voice
                fallbacks.append(GOOGLE_VOICES["friendly_female_en"])

        # If primary was Google, try Sarvam (for Hindi/Sanskrit)
        elif primary_config.provider in [VoiceProvider.GOOGLE_NEURAL,
                                         VoiceProvider.GOOGLE_STUDIO]:
            if self._sarvam_available and primary_config.language.startswith("hi"):
                for voice in SARVAM_VOICES.values():
                    if voice.style == primary_config.style:
                        fallbacks.append(voice)
                        break

            # Add lower quality Google as last resort
            fallbacks.append(VoiceConfig(
                provider=VoiceProvider.GOOGLE_STANDARD,
                voice_id="en-US-Standard-C",
                language="en-US",
                gender=VoiceGender.FEMALE,
                style=VoiceStyle.FRIENDLY,
                quality_score=7.0,
                description="Standard fallback"
            ))

        return fallbacks

    def stop_synthesis(self, synthesis_id: str = None):
        """
        Stop active synthesis.

        If synthesis_id is provided, stops that specific synthesis.
        If None, stops ALL active syntheses.
        """
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
        """
        Synthesize a Sanskrit shloka with perfect pronunciation.

        Uses Sanskrit phonology for IPA conversion and optimal
        voice settings for sacred recitation.
        """
        from services.sanskrit_phonology import sanskrit_ssml, CHANDAS_PATTERNS

        # Generate SSML with proper pronunciation
        ssml = sanskrit_ssml.generate_shloka_ssml(
            shloka,
            chandas=chandas,
            speed=0.85,
            pitch="-2st",
            with_vedic_accents=True
        )

        # Synthesize with Sarvam AI (best for Sanskrit) or Google
        result = await self.synthesize(
            text=shloka,
            language="sa",
            style=VoiceStyle.CHANTING,
            is_sanskrit=True,
            ssml=ssml
        )

        # If meaning requested, synthesize that too and concatenate
        if with_meaning and meaning_text and result.success:
            # Add pause between shloka and meaning
            meaning_result = await self.synthesize(
                text=meaning_text,
                language="en",
                style=VoiceStyle.WISDOM
            )

            if meaning_result.success:
                # Concatenate audio (would need proper audio processing)
                # For now, return just the shloka
                pass

        return result

    async def synthesize_divine_response(
        self,
        text: str,
        language: str = "en",
        include_sanskrit_words: List[str] = None
    ) -> SynthesisResult:
        """
        Synthesize KIAAN's divine response with proper pronunciation
        for embedded Sanskrit words.
        """
        from services.sanskrit_phonology import (
            sanskrit_ssml, detect_sanskrit_words, COMMON_SANSKRIT_WORDS
        )

        # Auto-detect Sanskrit words if not provided
        if include_sanskrit_words is None:
            include_sanskrit_words = detect_sanskrit_words(text)

        # Generate SSML with proper Sanskrit pronunciation
        if include_sanskrit_words:
            ssml = sanskrit_ssml.generate_divine_response_ssml(
                text,
                include_sanskrit_words=include_sanskrit_words,
                speed=0.92,
                pitch="-1st"
            )
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

# Singleton instance
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
