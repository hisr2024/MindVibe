"""
Bark Provider - Generative Text-to-Audio

Suno AI's Bark generates incredibly realistic audio with:
- Natural speech with emotions, laughter, sighs
- Music and sound effects
- Multiple speakers and languages
- Non-verbal sounds (breathing, hesitation)

Origin: USA (Suno AI)
License: MIT

"The bark of the soul - raw, real, resonant."
"""

import logging
from typing import Optional
from .base import BaseTTSProvider, ProviderCapabilities, ProviderStatus
from ..models import (
    SpeechSynthesisRequest, SpeechSynthesisResult,
    SpeechProvider, VoiceQuality
)

logger = logging.getLogger(__name__)

try:
    from bark import SAMPLE_RATE, generate_audio, preload_models
    BARK_AVAILABLE = True
except ImportError:
    BARK_AVAILABLE = False


class BarkProvider(BaseTTSProvider):
    """Bark Provider for generative audio with natural sounds."""

    def __init__(self):
        super().__init__("bark", "Suno Bark")
        self._capabilities = ProviderCapabilities(
            supports_synthesis=True,
            supports_emotions=True,
            supports_voice_cloning=True,
            supported_languages=["en", "zh", "fr", "de", "hi", "it", "ja", "ko", "pl", "pt", "ru", "es", "tr"],
            max_quality_tier=VoiceQuality.DIVINE,
            typical_latency_ms=5000,
            requires_gpu=True,
            works_offline=True,
        )

    async def initialize(self) -> bool:
        if not BARK_AVAILABLE:
            self._health.status = ProviderStatus.UNAVAILABLE
            return False
        try:
            preload_models()
            self._initialized = True
            self._health.status = ProviderStatus.AVAILABLE
            return True
        except Exception as e:
            logger.error(f"Bark init error: {e}")
            self._health.status = ProviderStatus.ERROR
            return False

    async def shutdown(self) -> None:
        self._initialized = False

    def get_capabilities(self) -> ProviderCapabilities:
        return self._capabilities

    async def synthesize(self, request: SpeechSynthesisRequest) -> SpeechSynthesisResult:
        if not self._initialized:
            return SpeechSynthesisResult(success=False, error_message="Bark not initialized")
        try:
            audio_array = generate_audio(request.text)
            import numpy as np
            from scipy.io import wavfile
            import io
            audio_int16 = (audio_array * 32767).astype(np.int16)
            output = io.BytesIO()
            wavfile.write(output, SAMPLE_RATE, audio_int16)
            return SpeechSynthesisResult(
                success=True,
                audio_data=output.getvalue(),
                provider_used=SpeechProvider.BARK,
                quality_score=0.95
            )
        except Exception as e:
            return SpeechSynthesisResult(success=False, error_message=str(e))


_bark_provider: Optional[BarkProvider] = None

def get_bark_provider() -> BarkProvider:
    global _bark_provider
    if _bark_provider is None:
        _bark_provider = BarkProvider()
    return _bark_provider
