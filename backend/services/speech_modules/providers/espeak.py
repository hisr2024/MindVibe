"""
eSpeak NG Provider - Compact Multilingual TTS

eSpeak NG is a compact open source TTS supporting:
- 100+ languages and accents
- Very small footprint
- Fast synthesis
- SSML support

Origin: UK (Jonathan Duddington)
License: GPL v3

"The whisper that spans a hundred tongues."
"""

import logging
import subprocess
from typing import Optional
from .base import BaseTTSProvider, ProviderCapabilities, ProviderStatus
from ..models import SpeechSynthesisRequest, SpeechSynthesisResult, SpeechProvider, VoiceQuality

logger = logging.getLogger(__name__)

# Check if espeak-ng is available
try:
    subprocess.run(["espeak-ng", "--version"], capture_output=True, check=True)
    ESPEAK_AVAILABLE = True
except (subprocess.SubprocessError, FileNotFoundError):
    ESPEAK_AVAILABLE = False


class EspeakProvider(BaseTTSProvider):
    """eSpeak NG Provider for ultra-lightweight TTS."""

    SUPPORTED_LANGUAGES = [
        "en", "en-us", "en-gb", "de", "es", "fr", "it", "pt", "ru",
        "zh", "ja", "ko", "hi", "ar", "bn", "ta", "te", "mr", "gu",
        "kn", "ml", "pa", "sa",  # Sanskrit for spiritual terms
    ]

    def __init__(self):
        super().__init__("espeak", "eSpeak NG")
        self._capabilities = ProviderCapabilities(
            supports_synthesis=True,
            supports_ssml=True,
            supported_languages=self.SUPPORTED_LANGUAGES,
            max_quality_tier=VoiceQuality.FAST,
            typical_latency_ms=20,
            requires_gpu=False,
            works_offline=True,
        )

    async def initialize(self) -> bool:
        if not ESPEAK_AVAILABLE:
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
        if not self._initialized:
            return SpeechSynthesisResult(success=False, error_message="eSpeak not available")
        try:
            import asyncio
            speed = int(request.prosody.speaking_rate * 175) if request.prosody else 175
            pitch = int(50 + (request.prosody.pitch * 5)) if request.prosody else 50

            proc = await asyncio.create_subprocess_exec(
                "espeak-ng", "-v", request.language, "-s", str(speed),
                "-p", str(pitch), "--stdout", request.text,
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            audio_data, _ = await proc.communicate()

            return SpeechSynthesisResult(
                success=True,
                audio_data=audio_data,
                provider_used=SpeechProvider.ESPEAK,
                quality_score=0.6,
            )
        except Exception as e:
            return SpeechSynthesisResult(success=False, error_message=str(e))


_espeak_provider: Optional[EspeakProvider] = None

def get_espeak_provider() -> EspeakProvider:
    global _espeak_provider
    if _espeak_provider is None:
        _espeak_provider = EspeakProvider()
    return _espeak_provider
