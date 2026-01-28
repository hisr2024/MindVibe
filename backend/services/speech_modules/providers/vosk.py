"""
Vosk Provider - Offline Speech Recognition

Vosk provides lightweight, offline speech recognition:
- Works completely offline
- 20+ languages
- Small models (50MB - 2GB)
- Real-time recognition

Origin: Russia (Alpha Cephei)
License: Apache 2.0

"Listening in silence, understanding in depth."
"""

import logging
from typing import Optional
from .base import BaseSTTProvider, ProviderCapabilities, ProviderStatus
from ..models import SpeechRecognitionRequest, SpeechRecognitionResult, SpeechRecognizer, VoiceQuality

logger = logging.getLogger(__name__)

try:
    from vosk import Model, KaldiRecognizer
    VOSK_AVAILABLE = True
except ImportError:
    VOSK_AVAILABLE = False


class VoskProvider(BaseSTTProvider):
    """Vosk Provider for offline speech recognition."""

    def __init__(self):
        super().__init__("vosk", "Vosk STT")
        self._capabilities = ProviderCapabilities(
            supports_recognition=True,
            supports_word_timestamps=True,
            supported_languages=["en", "de", "es", "fr", "it", "pt", "ru", "zh", "ja", "ko", "hi", "ar"],
            max_quality_tier=VoiceQuality.STANDARD,
            typical_latency_ms=100,
            requires_gpu=False,
            works_offline=True,
        )
        self._model = None

    async def initialize(self) -> bool:
        if not VOSK_AVAILABLE:
            self._health.status = ProviderStatus.UNAVAILABLE
            return False
        self._initialized = True
        self._health.status = ProviderStatus.AVAILABLE
        return True

    async def shutdown(self) -> None:
        self._initialized = False

    def get_capabilities(self) -> ProviderCapabilities:
        return self._capabilities

    async def recognize(self, request: SpeechRecognitionRequest) -> SpeechRecognitionResult:
        return SpeechRecognitionResult(success=False, error_message="Vosk model not loaded")


_vosk_provider: Optional[VoskProvider] = None

def get_vosk_provider() -> VoskProvider:
    global _vosk_provider
    if _vosk_provider is None:
        _vosk_provider = VoskProvider()
    return _vosk_provider
