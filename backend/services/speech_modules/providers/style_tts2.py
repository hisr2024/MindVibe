"""
StyleTTS2 Provider - Expressive Style-Based TTS

StyleTTS2 achieves human-level naturalness through:
- Style diffusion for expressive synthesis
- Large-scale training on diverse styles
- Zero-shot style transfer
- Emotion and speaker control

Origin: Korea
License: MIT

"Style is the voice of the soul expressing its uniqueness."
"""

import logging
from typing import Optional
from .base import BaseTTSProvider, ProviderCapabilities, ProviderStatus
from ..models import SpeechSynthesisRequest, SpeechSynthesisResult, SpeechProvider, VoiceQuality

logger = logging.getLogger(__name__)

try:
    import styletts2
    STYLETTS2_AVAILABLE = True
except ImportError:
    STYLETTS2_AVAILABLE = False


class StyleTTS2Provider(BaseTTSProvider):
    """StyleTTS2 Provider for human-level expressive TTS."""

    def __init__(self):
        super().__init__("style_tts2", "StyleTTS2")
        self._capabilities = ProviderCapabilities(
            supports_synthesis=True,
            supports_emotions=True,
            supports_voice_cloning=True,
            supported_languages=["en"],
            max_quality_tier=VoiceQuality.DIVINE,
            typical_latency_ms=2000,
            requires_gpu=True,
            works_offline=True,
        )

    async def initialize(self) -> bool:
        if not STYLETTS2_AVAILABLE:
            self._health.status = ProviderStatus.UNAVAILABLE
            return False
        self._initialized = True
        self._health.status = ProviderStatus.AVAILABLE
        return True

    async def shutdown(self) -> None:
        self._initialized = False

    def get_capabilities(self) -> ProviderCapabilities:
        return self._capabilities

    async def synthesize(self, request: SpeechSynthesisRequest) -> SpeechSynthesisResult:
        return SpeechSynthesisResult(success=False, error_message="StyleTTS2 not fully implemented")


_style_tts2_provider: Optional[StyleTTS2Provider] = None

def get_style_tts2_provider() -> StyleTTS2Provider:
    global _style_tts2_provider
    if _style_tts2_provider is None:
        _style_tts2_provider = StyleTTS2Provider()
    return _style_tts2_provider
