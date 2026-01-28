"""
Base Speech Provider Classes

Abstract base classes that define the interface for all speech providers.
This ensures consistent behavior and easy provider swapping.

"A strong foundation allows divine voices to flourish."
"""

import logging
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum

from ..models import (
    SpeechSynthesisRequest,
    SpeechSynthesisResult,
    SpeechRecognitionRequest,
    SpeechRecognitionResult,
    VoiceCloneRequest,
    VoiceProfile,
    SpeechQualityMetrics,
    SpeechProvider,
    SpeechRecognizer,
    VoiceQuality,
)

logger = logging.getLogger(__name__)


class ProviderStatus(Enum):
    """Provider availability status."""
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    DEGRADED = "degraded"
    INITIALIZING = "initializing"
    ERROR = "error"


@dataclass
class ProviderCapabilities:
    """Capabilities of a speech provider."""
    # Synthesis capabilities
    supports_synthesis: bool = False
    supports_ssml: bool = False
    supports_emotions: bool = False
    supports_voice_cloning: bool = False
    supports_streaming: bool = False

    # Recognition capabilities
    supports_recognition: bool = False
    supports_word_timestamps: bool = False
    supports_speaker_diarization: bool = False

    # Language support
    supported_languages: List[str] = field(default_factory=list)
    native_languages: List[str] = field(default_factory=list)  # Best quality

    # Quality metrics
    max_quality_tier: VoiceQuality = VoiceQuality.STANDARD
    typical_latency_ms: int = 1000
    requires_gpu: bool = False
    works_offline: bool = False

    # Voice options
    available_voices: List[str] = field(default_factory=list)
    voice_genders: List[str] = field(default_factory=lambda: ["female", "male"])


@dataclass
class ProviderHealth:
    """Health status of a provider."""
    status: ProviderStatus = ProviderStatus.UNAVAILABLE
    last_check: Optional[str] = None
    error_message: Optional[str] = None
    latency_ms: Optional[int] = None
    success_rate: float = 0.0
    total_requests: int = 0
    failed_requests: int = 0


class BaseSpeechProvider(ABC):
    """
    Abstract base class for all speech providers.

    Provides common infrastructure for initialization, health checks,
    and capability reporting.
    """

    def __init__(self, provider_id: str, provider_name: str):
        self.provider_id = provider_id
        self.provider_name = provider_name
        self._initialized = False
        self._health = ProviderHealth()
        self._capabilities = ProviderCapabilities()
        self._config: Dict[str, Any] = {}

        logger.info(f"Initializing speech provider: {provider_name}")

    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize the provider (load models, connect to services).

        Returns:
            True if initialization successful
        """
        pass

    @abstractmethod
    async def shutdown(self) -> None:
        """Clean shutdown of the provider."""
        pass

    @abstractmethod
    def get_capabilities(self) -> ProviderCapabilities:
        """Get provider capabilities."""
        pass

    async def health_check(self) -> ProviderHealth:
        """
        Perform health check on the provider.

        Returns:
            Current health status
        """
        try:
            # Try a simple operation to verify provider is working
            is_healthy = await self._perform_health_check()

            if is_healthy:
                self._health.status = ProviderStatus.AVAILABLE
                self._health.error_message = None
            else:
                self._health.status = ProviderStatus.DEGRADED

        except Exception as e:
            self._health.status = ProviderStatus.ERROR
            self._health.error_message = str(e)
            logger.warning(f"Health check failed for {self.provider_name}: {e}")

        return self._health

    async def _perform_health_check(self) -> bool:
        """Override in subclasses to perform actual health check."""
        return self._initialized

    def is_available(self) -> bool:
        """Check if provider is available for use."""
        return (
            self._initialized and
            self._health.status in [ProviderStatus.AVAILABLE, ProviderStatus.DEGRADED]
        )

    def supports_language(self, language: str) -> bool:
        """Check if provider supports a specific language."""
        return language in self._capabilities.supported_languages

    def get_quality_for_language(self, language: str) -> VoiceQuality:
        """Get the quality tier available for a specific language."""
        if language in self._capabilities.native_languages:
            return self._capabilities.max_quality_tier
        elif language in self._capabilities.supported_languages:
            return VoiceQuality.STANDARD
        else:
            return VoiceQuality.OFFLINE

    def record_request(self, success: bool, latency_ms: int) -> None:
        """Record a request for statistics."""
        self._health.total_requests += 1
        if not success:
            self._health.failed_requests += 1

        # Update success rate
        if self._health.total_requests > 0:
            self._health.success_rate = (
                (self._health.total_requests - self._health.failed_requests) /
                self._health.total_requests
            )

        # Update latency (exponential moving average)
        if self._health.latency_ms is None:
            self._health.latency_ms = latency_ms
        else:
            self._health.latency_ms = int(0.9 * self._health.latency_ms + 0.1 * latency_ms)


class BaseTTSProvider(BaseSpeechProvider):
    """
    Base class for Text-to-Speech providers.

    Provides the interface for speech synthesis operations.
    """

    def __init__(self, provider_id: str, provider_name: str):
        super().__init__(provider_id, provider_name)
        self._voice_cache: Dict[str, VoiceProfile] = {}

    @abstractmethod
    async def synthesize(
        self,
        request: SpeechSynthesisRequest
    ) -> SpeechSynthesisResult:
        """
        Synthesize speech from text.

        Args:
            request: Synthesis request with text and options

        Returns:
            Synthesis result with audio data
        """
        pass

    async def synthesize_with_ssml(
        self,
        ssml: str,
        request: SpeechSynthesisRequest
    ) -> SpeechSynthesisResult:
        """
        Synthesize speech from SSML.

        Default implementation strips SSML and uses plain text.
        Override in providers that support SSML.
        """
        import re
        plain_text = re.sub(r'<[^>]+>', '', ssml)
        request.text = plain_text
        return await self.synthesize(request)

    async def clone_voice(
        self,
        request: VoiceCloneRequest
    ) -> Optional[VoiceProfile]:
        """
        Clone a voice from reference audio.

        Returns None if voice cloning is not supported.
        """
        if not self._capabilities.supports_voice_cloning:
            logger.warning(f"{self.provider_name} does not support voice cloning")
            return None

        return await self._perform_voice_cloning(request)

    async def _perform_voice_cloning(
        self,
        request: VoiceCloneRequest
    ) -> Optional[VoiceProfile]:
        """Override in providers that support voice cloning."""
        return None

    def get_available_voices(self, language: str = "en") -> List[str]:
        """Get list of available voices for a language."""
        return self._capabilities.available_voices

    async def get_voice_preview(
        self,
        voice_id: str,
        text: str = "Namaste. I am KIAAN, your guide to inner peace."
    ) -> Optional[bytes]:
        """Get a preview audio sample for a voice."""
        request = SpeechSynthesisRequest(
            text=text,
            language="en",
            use_cache=True,
        )
        result = await self.synthesize(request)
        return result.audio_data if result.success else None


class BaseSTTProvider(BaseSpeechProvider):
    """
    Base class for Speech-to-Text providers.

    Provides the interface for speech recognition operations.
    """

    def __init__(self, provider_id: str, provider_name: str):
        super().__init__(provider_id, provider_name)

    @abstractmethod
    async def recognize(
        self,
        request: SpeechRecognitionRequest
    ) -> SpeechRecognitionResult:
        """
        Recognize speech from audio.

        Args:
            request: Recognition request with audio data

        Returns:
            Recognition result with transcript
        """
        pass

    async def recognize_stream(
        self,
        audio_stream,
        request: SpeechRecognitionRequest
    ):
        """
        Recognize speech from streaming audio.

        Yields partial transcripts as audio is processed.
        """
        if not self._capabilities.supports_streaming:
            logger.warning(f"{self.provider_name} does not support streaming")
            return

        async for partial in self._perform_streaming_recognition(audio_stream, request):
            yield partial

    async def _perform_streaming_recognition(self, audio_stream, request):
        """Override in providers that support streaming recognition."""
        yield SpeechRecognitionResult(
            success=False,
            error_message="Streaming not supported"
        )

    def get_supported_audio_formats(self) -> List[str]:
        """Get list of supported audio formats."""
        return ["wav", "mp3", "ogg", "flac"]


# ============================================================================
# Provider Registry
# ============================================================================

class ProviderRegistry:
    """
    Registry for managing speech providers.

    Provides centralized access to all registered providers
    and handles provider selection based on requirements.
    """

    def __init__(self):
        self._tts_providers: Dict[str, BaseTTSProvider] = {}
        self._stt_providers: Dict[str, BaseSTTProvider] = {}
        self._initialized = False

    def register_tts_provider(self, provider: BaseTTSProvider) -> None:
        """Register a TTS provider."""
        self._tts_providers[provider.provider_id] = provider
        logger.info(f"Registered TTS provider: {provider.provider_name}")

    def register_stt_provider(self, provider: BaseSTTProvider) -> None:
        """Register an STT provider."""
        self._stt_providers[provider.provider_id] = provider
        logger.info(f"Registered STT provider: {provider.provider_name}")

    def get_tts_provider(self, provider_id: str) -> Optional[BaseTTSProvider]:
        """Get a TTS provider by ID."""
        return self._tts_providers.get(provider_id)

    def get_stt_provider(self, provider_id: str) -> Optional[BaseSTTProvider]:
        """Get an STT provider by ID."""
        return self._stt_providers.get(provider_id)

    def get_available_tts_providers(
        self,
        language: Optional[str] = None,
        quality: Optional[VoiceQuality] = None
    ) -> List[BaseTTSProvider]:
        """Get list of available TTS providers matching criteria."""
        available = []

        for provider in self._tts_providers.values():
            if not provider.is_available():
                continue

            if language and not provider.supports_language(language):
                continue

            if quality:
                caps = provider.get_capabilities()
                if caps.max_quality_tier.value < quality.value:
                    continue

            available.append(provider)

        return available

    def get_available_stt_providers(
        self,
        language: Optional[str] = None
    ) -> List[BaseSTTProvider]:
        """Get list of available STT providers matching criteria."""
        available = []

        for provider in self._stt_providers.values():
            if not provider.is_available():
                continue

            if language and not provider.supports_language(language):
                continue

            available.append(provider)

        return available

    async def initialize_all(self) -> Dict[str, bool]:
        """Initialize all registered providers."""
        results = {}

        for provider_id, provider in self._tts_providers.items():
            try:
                results[f"tts_{provider_id}"] = await provider.initialize()
            except Exception as e:
                logger.error(f"Failed to initialize TTS provider {provider_id}: {e}")
                results[f"tts_{provider_id}"] = False

        for provider_id, provider in self._stt_providers.items():
            try:
                results[f"stt_{provider_id}"] = await provider.initialize()
            except Exception as e:
                logger.error(f"Failed to initialize STT provider {provider_id}: {e}")
                results[f"stt_{provider_id}"] = False

        self._initialized = True
        return results

    async def shutdown_all(self) -> None:
        """Shutdown all providers."""
        for provider in self._tts_providers.values():
            try:
                await provider.shutdown()
            except Exception as e:
                logger.warning(f"Error shutting down provider {provider.provider_id}: {e}")

        for provider in self._stt_providers.values():
            try:
                await provider.shutdown()
            except Exception as e:
                logger.warning(f"Error shutting down provider {provider.provider_id}: {e}")


# Global registry instance
_provider_registry: Optional[ProviderRegistry] = None


def get_provider_registry() -> ProviderRegistry:
    """Get the global provider registry."""
    global _provider_registry
    if _provider_registry is None:
        _provider_registry = ProviderRegistry()
    return _provider_registry
