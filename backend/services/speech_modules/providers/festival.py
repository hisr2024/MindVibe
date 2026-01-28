"""
Festival Provider - Academic TTS System

Festival is the venerable speech synthesis system from University of Edinburgh:
- Research-grade quality
- Extensive language support
- Rich feature set
- Strong academic foundation

Origin: UK (University of Edinburgh)
License: MIT-style

"The festival of voices, a celebration of academic excellence."
"""

import logging
import subprocess
from typing import Optional
from .base import BaseTTSProvider, ProviderCapabilities, ProviderStatus
from ..models import SpeechSynthesisRequest, SpeechSynthesisResult, SpeechProvider, VoiceQuality

logger = logging.getLogger(__name__)

try:
    subprocess.run(["festival", "--version"], capture_output=True, timeout=5)
    FESTIVAL_AVAILABLE = True
except (subprocess.SubprocessError, FileNotFoundError):
    FESTIVAL_AVAILABLE = False


class FestivalProvider(BaseTTSProvider):
    """Festival TTS Provider for research-grade synthesis."""

    def __init__(self):
        super().__init__("festival", "Festival TTS")
        self._capabilities = ProviderCapabilities(
            supports_synthesis=True,
            supported_languages=["en", "es", "it", "fi", "ru", "pl", "cy"],
            max_quality_tier=VoiceQuality.STANDARD,
            typical_latency_ms=500,
            requires_gpu=False,
            works_offline=True,
        )

    async def initialize(self) -> bool:
        if not FESTIVAL_AVAILABLE:
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
            return SpeechSynthesisResult(success=False, error_message="Festival not available")
        try:
            import asyncio
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(request.text)
                text_file = f.name
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                wav_file = f.name

            proc = await asyncio.create_subprocess_exec(
                "text2wave", text_file, "-o", wav_file,
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            await proc.communicate()

            with open(wav_file, 'rb') as f:
                audio_data = f.read()

            import os
            os.unlink(text_file)
            os.unlink(wav_file)

            return SpeechSynthesisResult(
                success=True, audio_data=audio_data,
                provider_used=SpeechProvider.FESTIVAL, quality_score=0.7
            )
        except Exception as e:
            return SpeechSynthesisResult(success=False, error_message=str(e))


_festival_provider: Optional[FestivalProvider] = None

def get_festival_provider() -> FestivalProvider:
    global _festival_provider
    if _festival_provider is None:
        _festival_provider = FestivalProvider()
    return _festival_provider
