"""
Speech Module Orchestrator - Intelligent Provider Selection

The orchestrator is the brain of the speech module system,
intelligently selecting the best provider based on:
- Language requirements
- Quality preferences
- Latency constraints
- Provider availability
- User preferences
- Historical performance

It implements a multi-level fallback system to ensure
KIAAN always has a voice.

"The conductor of divine voices, orchestrating harmony."
"""

import logging
import asyncio
import time
import hashlib
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict
import json

from .models import (
    SpeechSynthesisRequest,
    SpeechSynthesisResult,
    SpeechRecognitionRequest,
    SpeechRecognitionResult,
    VoiceProfile,
    SpeechProvider,
    SpeechRecognizer,
    VoiceQuality,
    EmotionalProsody,
    DIVINE_VOICE_PROFILES,
    DIVINE_EMOTION_PROSODY,
)

from .providers.base import (
    BaseTTSProvider,
    BaseSTTProvider,
    ProviderRegistry,
    get_provider_registry,
)

logger = logging.getLogger(__name__)


@dataclass
class ProviderScore:
    """Scoring data for provider selection."""
    provider_id: str
    total_score: float
    quality_score: float
    speed_score: float
    reliability_score: float
    language_score: float
    cost_score: float
    reasons: List[str] = field(default_factory=list)


@dataclass
class SynthesisHistory:
    """Historical data for synthesis optimization."""
    provider_id: str
    language: str
    latency_ms: int
    quality_score: float
    success: bool
    timestamp: datetime = field(default_factory=datetime.utcnow)


class SpeechModuleOrchestrator:
    """
    Intelligent orchestrator for speech synthesis and recognition.

    Manages provider selection, fallback chains, caching, and
    performance optimization for the best possible voice experience.

    Features:
    - Multi-provider fallback with intelligent selection
    - Quality-based provider ranking
    - Latency-aware provider selection
    - Language-specific optimization
    - Adaptive learning from history
    - Divine voice profile management
    - Multi-level caching
    """

    # Provider priority by quality tier
    QUALITY_PRIORITY = {
        VoiceQuality.DIVINE: [
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.BARK,
            SpeechProvider.STYLE_TTS2,
        ],
        VoiceQuality.PREMIUM: [
            SpeechProvider.SILERO,
            SpeechProvider.COQUI_TTS,
            SpeechProvider.GOOGLE_CLOUD,
            SpeechProvider.EDGE_TTS,
        ],
        VoiceQuality.STANDARD: [
            SpeechProvider.PIPER,
            SpeechProvider.EDGE_TTS,
            SpeechProvider.MARY_TTS,
        ],
        VoiceQuality.FAST: [
            SpeechProvider.SILERO,
            SpeechProvider.PIPER,
            SpeechProvider.ESPEAK,
        ],
        VoiceQuality.OFFLINE: [
            SpeechProvider.PIPER,
            SpeechProvider.SILERO,
            SpeechProvider.ESPEAK,
            SpeechProvider.PYTTSX3,
        ],
    }

    # Language specialists
    LANGUAGE_SPECIALISTS = {
        "hi": [SpeechProvider.AI4BHARAT, SpeechProvider.VAKYANSH, SpeechProvider.SARVAM],
        "ta": [SpeechProvider.AI4BHARAT, SpeechProvider.VAKYANSH],
        "te": [SpeechProvider.AI4BHARAT, SpeechProvider.VAKYANSH],
        "bn": [SpeechProvider.AI4BHARAT],
        "mr": [SpeechProvider.AI4BHARAT],
        "gu": [SpeechProvider.AI4BHARAT],
        "kn": [SpeechProvider.AI4BHARAT],
        "ml": [SpeechProvider.AI4BHARAT],
        "pa": [SpeechProvider.AI4BHARAT],
        "ru": [SpeechProvider.SILERO],
        "zh": [SpeechProvider.PADDLE_SPEECH, SpeechProvider.COQUI_XTTS],
        "ja": [SpeechProvider.COQUI_XTTS, SpeechProvider.ESPNET],
        "ko": [SpeechProvider.COQUI_XTTS],
    }

    # STT provider priority
    STT_PRIORITY = [
        SpeechRecognizer.WHISPER,
        SpeechRecognizer.WHISPER_CPP,
        SpeechRecognizer.GOOGLE_STT,
        SpeechRecognizer.VOSK,
        SpeechRecognizer.DEEP_SPEECH,
    ]

    def __init__(self):
        self._registry = get_provider_registry()
        self._initialized = False

        # Caching
        self._audio_cache: Dict[str, bytes] = {}
        self._cache_max_size = 1000
        self._cache_ttl_hours = 24

        # Performance history
        self._synthesis_history: List[SynthesisHistory] = []
        self._provider_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "total_requests": 0,
            "successful_requests": 0,
            "total_latency_ms": 0,
            "avg_quality": 0.0,
        })

        # Divine voice profiles
        self._voice_profiles = DIVINE_VOICE_PROFILES.copy()

        logger.info("Speech Module Orchestrator initialized")

    async def initialize(self) -> Dict[str, bool]:
        """Initialize all registered providers."""
        logger.info("Initializing all speech providers...")

        # Register providers
        await self._register_all_providers()

        # Initialize all
        results = await self._registry.initialize_all()

        self._initialized = True
        logger.info(f"Provider initialization complete: {results}")

        return results

    async def _register_all_providers(self) -> None:
        """Register all available providers."""
        # TTS Providers
        from .providers.coqui_xtts import get_coqui_xtts_provider
        from .providers.silero import get_silero_provider
        from .providers.bark import get_bark_provider
        from .providers.piper import get_piper_provider
        from .providers.style_tts2 import get_style_tts2_provider
        from .providers.espeak import get_espeak_provider
        from .providers.festival import get_festival_provider

        # STT Providers
        from .providers.whisper import get_whisper_provider
        from .providers.vosk import get_vosk_provider

        # Register TTS
        self._registry.register_tts_provider(get_coqui_xtts_provider())
        self._registry.register_tts_provider(get_silero_provider())
        self._registry.register_tts_provider(get_bark_provider())
        self._registry.register_tts_provider(get_piper_provider())
        self._registry.register_tts_provider(get_style_tts2_provider())
        self._registry.register_tts_provider(get_espeak_provider())
        self._registry.register_tts_provider(get_festival_provider())

        # Register STT
        self._registry.register_stt_provider(get_whisper_provider())
        self._registry.register_stt_provider(get_vosk_provider())

    async def shutdown(self) -> None:
        """Shutdown all providers."""
        await self._registry.shutdown_all()
        self._initialized = False
        logger.info("Speech Module Orchestrator shut down")

    # =========================================================================
    # SYNTHESIS - Text to Speech
    # =========================================================================

    async def synthesize(
        self,
        request: SpeechSynthesisRequest
    ) -> SpeechSynthesisResult:
        """
        Synthesize speech using the best available provider.

        This method:
        1. Checks cache for existing audio
        2. Selects optimal provider(s) based on requirements
        3. Attempts synthesis with fallback chain
        4. Records performance data for future optimization
        5. Caches successful results
        """
        start_time = time.time()

        # Check cache
        cache_key = self._generate_cache_key(request)
        if request.use_cache and cache_key in self._audio_cache:
            logger.debug(f"Cache hit for synthesis request")
            return SpeechSynthesisResult(
                success=True,
                audio_data=self._audio_cache[cache_key],
                from_cache=True,
                cache_key=cache_key,
            )

        # Get optimal provider chain
        provider_chain = self._select_tts_providers(request)

        if not provider_chain:
            return SpeechSynthesisResult(
                success=False,
                error_message="No suitable TTS providers available",
            )

        # Try providers in order
        last_error = None
        providers_tried = []

        for provider_score in provider_chain:
            provider = self._registry.get_tts_provider(provider_score.provider_id)
            if not provider or not provider.is_available():
                continue

            providers_tried.append(SpeechProvider(provider_score.provider_id))

            try:
                result = await provider.synthesize(request)

                if result.success:
                    # Record success
                    self._record_synthesis_result(
                        provider_score.provider_id,
                        request.language,
                        result.synthesis_time_ms,
                        result.quality_score,
                        True
                    )

                    # Cache result
                    if request.use_cache and result.audio_data:
                        self._cache_audio(cache_key, result.audio_data)

                    result.fallback_used = len(providers_tried) > 1
                    result.providers_tried = providers_tried
                    result.cache_key = cache_key

                    total_time = int((time.time() - start_time) * 1000)
                    logger.info(
                        f"Synthesis successful with {provider_score.provider_id} "
                        f"in {total_time}ms"
                    )

                    return result

                last_error = result.error_message

            except Exception as e:
                logger.warning(f"Provider {provider_score.provider_id} failed: {e}")
                last_error = str(e)
                self._record_synthesis_result(
                    provider_score.provider_id,
                    request.language,
                    0,
                    0.0,
                    False
                )

        # All providers failed
        return SpeechSynthesisResult(
            success=False,
            error_message=f"All providers failed. Last error: {last_error}",
            providers_tried=providers_tried,
        )

    def _select_tts_providers(
        self,
        request: SpeechSynthesisRequest
    ) -> List[ProviderScore]:
        """Select and rank TTS providers for a request."""
        scores = []

        # Get available providers
        available = self._registry.get_available_tts_providers(
            language=request.language,
            quality=request.quality_tier
        )

        # If specific provider requested, prioritize it
        if request.preferred_provider:
            provider = self._registry.get_tts_provider(
                request.preferred_provider.value
            )
            if provider and provider.is_available():
                scores.append(ProviderScore(
                    provider_id=request.preferred_provider.value,
                    total_score=100.0,
                    quality_score=1.0,
                    speed_score=1.0,
                    reliability_score=1.0,
                    language_score=1.0,
                    cost_score=1.0,
                    reasons=["User preferred"]
                ))

        # Score each available provider
        for provider in available:
            score = self._score_tts_provider(provider, request)
            scores.append(score)

        # Add quality tier priorities
        tier_providers = self.QUALITY_PRIORITY.get(request.quality_tier, [])
        for i, provider_enum in enumerate(tier_providers):
            if not any(s.provider_id == provider_enum.value for s in scores):
                provider = self._registry.get_tts_provider(provider_enum.value)
                if provider and provider.is_available():
                    scores.append(ProviderScore(
                        provider_id=provider_enum.value,
                        total_score=80.0 - i * 5,  # Descending priority
                        quality_score=0.8,
                        speed_score=0.8,
                        reliability_score=0.8,
                        language_score=0.8,
                        cost_score=0.8,
                        reasons=[f"Quality tier priority #{i+1}"]
                    ))

        # Add language specialists
        lang_specialists = self.LANGUAGE_SPECIALISTS.get(request.language, [])
        for i, provider_enum in enumerate(lang_specialists):
            existing = next(
                (s for s in scores if s.provider_id == provider_enum.value),
                None
            )
            if existing:
                existing.total_score += 10  # Boost for language specialty
                existing.language_score = 1.0
                existing.reasons.append(f"Language specialist for {request.language}")
            else:
                provider = self._registry.get_tts_provider(provider_enum.value)
                if provider and provider.is_available():
                    scores.append(ProviderScore(
                        provider_id=provider_enum.value,
                        total_score=75.0 - i * 3,
                        quality_score=0.7,
                        speed_score=0.7,
                        reliability_score=0.7,
                        language_score=1.0,
                        cost_score=0.8,
                        reasons=[f"Language specialist for {request.language}"]
                    ))

        # Add fallback providers
        for provider_enum in request.fallback_providers:
            if not any(s.provider_id == provider_enum.value for s in scores):
                provider = self._registry.get_tts_provider(provider_enum.value)
                if provider and provider.is_available():
                    scores.append(ProviderScore(
                        provider_id=provider_enum.value,
                        total_score=50.0,
                        quality_score=0.5,
                        speed_score=0.5,
                        reliability_score=0.5,
                        language_score=0.5,
                        cost_score=0.5,
                        reasons=["Fallback provider"]
                    ))

        # Sort by total score
        scores.sort(key=lambda x: x.total_score, reverse=True)

        return scores[:5]  # Return top 5

    def _score_tts_provider(
        self,
        provider: BaseTTSProvider,
        request: SpeechSynthesisRequest
    ) -> ProviderScore:
        """Score a single TTS provider for a request."""
        caps = provider.get_capabilities()
        reasons = []

        # Quality score
        quality_score = 0.0
        if caps.max_quality_tier == request.quality_tier:
            quality_score = 1.0
            reasons.append("Matches quality tier")
        elif caps.max_quality_tier.value > request.quality_tier.value:
            quality_score = 0.9
            reasons.append("Exceeds quality tier")
        else:
            quality_score = 0.5

        # Speed score (inverse of latency)
        speed_score = max(0.1, 1.0 - (caps.typical_latency_ms / 5000))

        # Language score
        language_score = 0.0
        if request.language in caps.native_languages:
            language_score = 1.0
            reasons.append(f"Native support for {request.language}")
        elif request.language in caps.supported_languages:
            language_score = 0.7
        else:
            language_score = 0.0

        # Reliability from history
        stats = self._provider_stats.get(provider.provider_id, {})
        if stats.get("total_requests", 0) > 0:
            reliability_score = stats["successful_requests"] / stats["total_requests"]
        else:
            reliability_score = 0.8  # Default

        # Feature score
        feature_score = 0.5
        if request.clone_voice and caps.supports_voice_cloning:
            feature_score += 0.3
            reasons.append("Supports voice cloning")
        if request.prosody and request.prosody.emotion and caps.supports_emotions:
            feature_score += 0.2
            reasons.append("Supports emotions")

        # Calculate total
        total_score = (
            quality_score * 30 +
            speed_score * 20 +
            language_score * 25 +
            reliability_score * 15 +
            feature_score * 10
        )

        return ProviderScore(
            provider_id=provider.provider_id,
            total_score=total_score,
            quality_score=quality_score,
            speed_score=speed_score,
            reliability_score=reliability_score,
            language_score=language_score,
            cost_score=1.0,  # All open source = free
            reasons=reasons
        )

    # =========================================================================
    # RECOGNITION - Speech to Text
    # =========================================================================

    async def recognize(
        self,
        request: SpeechRecognitionRequest
    ) -> SpeechRecognitionResult:
        """
        Recognize speech using the best available provider.
        """
        # Get optimal provider chain
        provider_chain = self._select_stt_providers(request)

        if not provider_chain:
            return SpeechRecognitionResult(
                success=False,
                error_message="No suitable STT providers available",
            )

        # Try providers in order
        for provider_id in provider_chain:
            provider = self._registry.get_stt_provider(provider_id)
            if not provider or not provider.is_available():
                continue

            try:
                result = await provider.recognize(request)
                if result.success:
                    return result
            except Exception as e:
                logger.warning(f"STT provider {provider_id} failed: {e}")

        return SpeechRecognitionResult(
            success=False,
            error_message="All STT providers failed",
        )

    def _select_stt_providers(
        self,
        request: SpeechRecognitionRequest
    ) -> List[str]:
        """Select STT providers for a request."""
        providers = []

        # Preferred provider first
        if request.preferred_provider:
            providers.append(request.preferred_provider.value)

        # Add priority providers
        for recognizer in self.STT_PRIORITY:
            if recognizer.value not in providers:
                providers.append(recognizer.value)

        # Add fallbacks
        for recognizer in request.fallback_providers:
            if recognizer.value not in providers:
                providers.append(recognizer.value)

        return providers

    # =========================================================================
    # DIVINE VOICE HELPERS
    # =========================================================================

    async def synthesize_divine(
        self,
        text: str,
        emotion: str = "peace",
        language: str = "en",
        voice_profile_id: str = "kiaan_serene"
    ) -> SpeechSynthesisResult:
        """
        Synthesize with divine voice settings optimized for KIAAN.

        This is a convenience method that applies divine voice
        prosody and profile settings automatically.
        """
        # Get voice profile
        profile = self._voice_profiles.get(voice_profile_id)
        if not profile:
            profile = self._voice_profiles.get("kiaan_serene")

        # Get emotion prosody
        prosody = DIVINE_EMOTION_PROSODY.get(emotion, DIVINE_EMOTION_PROSODY["peace"])

        # Build request
        request = SpeechSynthesisRequest(
            text=text,
            language=language,
            voice_profile=profile,
            quality_tier=VoiceQuality.DIVINE,
            prosody=prosody,
            emotion=emotion,
            content_type="divine_conversation",
            use_cache=True,
        )

        # Use profile's preferred providers
        if profile and profile.preferred_providers:
            request.preferred_provider = profile.preferred_providers[0]
            request.fallback_providers = profile.preferred_providers[1:3]

        return await self.synthesize(request)

    # =========================================================================
    # CACHING
    # =========================================================================

    def _generate_cache_key(self, request: SpeechSynthesisRequest) -> str:
        """Generate a cache key for a synthesis request."""
        key_data = f"{request.text}|{request.language}|{request.quality_tier.value}"
        if request.prosody:
            key_data += f"|{request.prosody.speaking_rate}|{request.prosody.pitch}"
        if request.voice_profile:
            key_data += f"|{request.voice_profile.id}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def _cache_audio(self, key: str, audio: bytes) -> None:
        """Cache audio data."""
        if len(self._audio_cache) >= self._cache_max_size:
            # Remove oldest entries
            keys_to_remove = list(self._audio_cache.keys())[:100]
            for k in keys_to_remove:
                del self._audio_cache[k]

        self._audio_cache[key] = audio

    def clear_cache(self) -> None:
        """Clear the audio cache."""
        self._audio_cache.clear()
        logger.info("Audio cache cleared")

    # =========================================================================
    # PERFORMANCE TRACKING
    # =========================================================================

    def _record_synthesis_result(
        self,
        provider_id: str,
        language: str,
        latency_ms: int,
        quality_score: float,
        success: bool
    ) -> None:
        """Record synthesis result for optimization."""
        # Add to history
        self._synthesis_history.append(SynthesisHistory(
            provider_id=provider_id,
            language=language,
            latency_ms=latency_ms,
            quality_score=quality_score,
            success=success,
        ))

        # Keep history bounded
        if len(self._synthesis_history) > 10000:
            self._synthesis_history = self._synthesis_history[-5000:]

        # Update stats
        stats = self._provider_stats[provider_id]
        stats["total_requests"] += 1
        if success:
            stats["successful_requests"] += 1
            stats["total_latency_ms"] += latency_ms
            # Running average of quality
            n = stats["successful_requests"]
            stats["avg_quality"] = (
                (stats["avg_quality"] * (n - 1) + quality_score) / n
            )

    def get_provider_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get provider performance statistics."""
        return dict(self._provider_stats)

    def get_available_providers(self) -> Dict[str, List[str]]:
        """Get lists of available TTS and STT providers."""
        return {
            "tts": [
                p.provider_id
                for p in self._registry.get_available_tts_providers()
            ],
            "stt": [
                p.provider_id
                for p in self._registry.get_available_stt_providers()
            ],
        }


# Singleton instance
_orchestrator: Optional[SpeechModuleOrchestrator] = None


def get_speech_orchestrator() -> SpeechModuleOrchestrator:
    """Get the speech module orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = SpeechModuleOrchestrator()
    return _orchestrator
