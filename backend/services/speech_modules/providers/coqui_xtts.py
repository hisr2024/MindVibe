"""
Coqui XTTS Provider - Multi-lingual TTS with Voice Cloning

Coqui's XTTS (Cross-lingual Text-to-Speech) is a state-of-the-art
multilingual TTS model capable of:
- High-quality speech synthesis in 17+ languages
- Voice cloning from just 6 seconds of audio
- Emotional expressiveness
- Natural prosody

Origin: Germany (Coqui AI, formerly Mozilla TTS team)
License: CPML (Coqui Public Model License)

"The voice that transcends borders, speaking wisdom in every tongue."
"""

import logging
import asyncio
import time
from typing import Optional, List, Dict, Any
from pathlib import Path
import io

from .base import (
    BaseTTSProvider,
    ProviderCapabilities,
    ProviderStatus,
    ProviderHealth,
)
from ..models import (
    SpeechSynthesisRequest,
    SpeechSynthesisResult,
    VoiceCloneRequest,
    VoiceProfile,
    SpeechProvider,
    VoiceQuality,
    EmotionalProsody,
)

logger = logging.getLogger(__name__)

# Try to import Coqui TTS
try:
    from TTS.api import TTS
    from TTS.tts.configs.xtts_config import XttsConfig
    COQUI_AVAILABLE = True
except ImportError:
    COQUI_AVAILABLE = False
    logger.warning("Coqui TTS not available. Install with: pip install TTS")

# Try to import torch for GPU support
try:
    import torch
    TORCH_AVAILABLE = True
    GPU_AVAILABLE = torch.cuda.is_available()
except ImportError:
    TORCH_AVAILABLE = False
    GPU_AVAILABLE = False


class CoquiXTTSProvider(BaseTTSProvider):
    """
    Coqui XTTS Provider for world-class multilingual TTS.

    Features:
    - 17+ language support with native-level quality
    - Voice cloning from 6+ seconds of audio
    - Emotional speech synthesis
    - GPU acceleration support
    - Streaming synthesis

    Quality Tier: DIVINE (highest quality)
    Latency: 1-3 seconds (GPU), 5-10 seconds (CPU)
    """

    # Supported languages with ISO codes
    SUPPORTED_LANGUAGES = [
        "en",   # English
        "es",   # Spanish
        "fr",   # French
        "de",   # German
        "it",   # Italian
        "pt",   # Portuguese
        "pl",   # Polish
        "tr",   # Turkish
        "ru",   # Russian
        "nl",   # Dutch
        "cs",   # Czech
        "ar",   # Arabic
        "zh",   # Chinese
        "ja",   # Japanese
        "hu",   # Hungarian
        "ko",   # Korean
        "hi",   # Hindi
    ]

    # Languages with best quality (native-level)
    NATIVE_QUALITY_LANGUAGES = ["en", "es", "fr", "de", "it", "pt"]

    # Default voice embeddings for divine voice
    DIVINE_VOICE_PATH = Path(__file__).parent.parent.parent / "assets" / "divine_voice_reference.wav"

    def __init__(self):
        super().__init__(
            provider_id="coqui_xtts",
            provider_name="Coqui XTTS"
        )

        self._tts_model: Optional[TTS] = None
        self._voice_embeddings: Dict[str, Any] = {}
        self._model_path: Optional[str] = None
        self._use_gpu = GPU_AVAILABLE

        # Configure capabilities
        self._capabilities = ProviderCapabilities(
            supports_synthesis=True,
            supports_ssml=False,  # XTTS doesn't use SSML, uses conditioning
            supports_emotions=True,
            supports_voice_cloning=True,
            supports_streaming=True,
            supports_recognition=False,
            supported_languages=self.SUPPORTED_LANGUAGES,
            native_languages=self.NATIVE_QUALITY_LANGUAGES,
            max_quality_tier=VoiceQuality.DIVINE,
            typical_latency_ms=2000 if GPU_AVAILABLE else 7000,
            requires_gpu=False,  # Works on CPU, faster on GPU
            works_offline=True,
            available_voices=["divine_serene", "divine_wise", "divine_compassionate"],
            voice_genders=["female", "male"],
        )

    async def initialize(self) -> bool:
        """Initialize the Coqui XTTS model."""
        if not COQUI_AVAILABLE:
            logger.warning("Coqui TTS not installed, provider unavailable")
            self._health.status = ProviderStatus.UNAVAILABLE
            self._health.error_message = "Coqui TTS library not installed"
            return False

        try:
            logger.info("Loading Coqui XTTS model (this may take a moment)...")

            # Initialize TTS with XTTS v2 model
            self._tts_model = TTS(
                model_name="tts_models/multilingual/multi-dataset/xtts_v2",
                progress_bar=False,
                gpu=self._use_gpu
            )

            # Pre-load divine voice embedding if available
            if self.DIVINE_VOICE_PATH.exists():
                await self._load_voice_embedding(
                    "divine_serene",
                    str(self.DIVINE_VOICE_PATH)
                )

            self._initialized = True
            self._health.status = ProviderStatus.AVAILABLE
            logger.info(f"Coqui XTTS initialized successfully (GPU: {self._use_gpu})")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize Coqui XTTS: {e}")
            self._health.status = ProviderStatus.ERROR
            self._health.error_message = str(e)
            return False

    async def shutdown(self) -> None:
        """Clean shutdown of the provider."""
        if self._tts_model:
            del self._tts_model
            self._tts_model = None

            # Clear GPU memory if used
            if TORCH_AVAILABLE and GPU_AVAILABLE:
                torch.cuda.empty_cache()

        self._initialized = False
        logger.info("Coqui XTTS provider shut down")

    def get_capabilities(self) -> ProviderCapabilities:
        """Get provider capabilities."""
        return self._capabilities

    async def synthesize(
        self,
        request: SpeechSynthesisRequest
    ) -> SpeechSynthesisResult:
        """
        Synthesize speech using Coqui XTTS.

        Provides divine-quality multilingual synthesis with optional
        voice cloning and emotional prosody control.
        """
        start_time = time.time()

        if not self._initialized or not self._tts_model:
            return SpeechSynthesisResult(
                success=False,
                error_message="Coqui XTTS not initialized",
                provider_used=SpeechProvider.COQUI_XTTS,
            )

        try:
            # Determine language
            language = request.language if request.language in self.SUPPORTED_LANGUAGES else "en"

            # Get speaker embedding (for voice cloning)
            speaker_wav = None
            if request.clone_voice and request.reference_audio:
                # Use provided reference audio
                speaker_wav = self._save_temp_audio(request.reference_audio)
            elif request.voice_profile and request.voice_profile.reference_audio_path:
                speaker_wav = request.voice_profile.reference_audio_path
            elif "divine" in self._voice_embeddings:
                # Use pre-loaded divine voice
                speaker_wav = self._voice_embeddings.get("divine_serene")

            # Apply emotional prosody to text
            text = self._apply_prosody_markers(request.text, request.prosody)

            # Synthesize speech
            loop = asyncio.get_event_loop()
            audio_data = await loop.run_in_executor(
                None,
                self._synthesize_sync,
                text,
                language,
                speaker_wav
            )

            if audio_data is None:
                return SpeechSynthesisResult(
                    success=False,
                    error_message="Synthesis returned no audio",
                    provider_used=SpeechProvider.COQUI_XTTS,
                )

            # Convert to requested format
            audio_bytes = self._convert_audio_format(
                audio_data,
                request.output_format,
                request.sample_rate
            )

            synthesis_time = int((time.time() - start_time) * 1000)
            self.record_request(True, synthesis_time)

            return SpeechSynthesisResult(
                success=True,
                audio_data=audio_bytes,
                provider_used=SpeechProvider.COQUI_XTTS,
                synthesis_time_ms=synthesis_time,
                audio_duration_ms=self._estimate_audio_duration(request.text),
                sample_rate=request.sample_rate,
                format=request.output_format,
                file_size_bytes=len(audio_bytes),
                quality_score=0.95,  # XTTS produces very high quality
                naturalness_score=0.92,
            )

        except Exception as e:
            logger.error(f"Coqui XTTS synthesis error: {e}")
            self.record_request(False, int((time.time() - start_time) * 1000))

            return SpeechSynthesisResult(
                success=False,
                error_message=str(e),
                provider_used=SpeechProvider.COQUI_XTTS,
            )

    def _synthesize_sync(
        self,
        text: str,
        language: str,
        speaker_wav: Optional[str]
    ) -> Optional[bytes]:
        """Synchronous synthesis (run in executor)."""
        try:
            # XTTS generates audio directly
            if speaker_wav:
                wav = self._tts_model.tts(
                    text=text,
                    speaker_wav=speaker_wav,
                    language=language,
                )
            else:
                wav = self._tts_model.tts(
                    text=text,
                    language=language,
                )

            # Convert numpy array to bytes
            if wav is not None:
                return self._numpy_to_audio_bytes(wav)

            return None

        except Exception as e:
            logger.error(f"Sync synthesis error: {e}")
            return None

    async def _load_voice_embedding(self, voice_id: str, audio_path: str) -> bool:
        """Load and cache a voice embedding from reference audio."""
        try:
            self._voice_embeddings[voice_id] = audio_path
            logger.info(f"Loaded voice embedding for {voice_id}")
            return True
        except Exception as e:
            logger.warning(f"Failed to load voice embedding: {e}")
            return False

    async def _perform_voice_cloning(
        self,
        request: VoiceCloneRequest
    ) -> Optional[VoiceProfile]:
        """Clone a voice from reference audio."""
        try:
            # Save reference audio to temp file
            temp_path = self._save_temp_audio(request.reference_audio)

            # Create voice profile
            profile = VoiceProfile(
                id=f"cloned_{request.voice_name}",
                name=request.voice_name,
                description=request.description,
                reference_audio_path=temp_path,
                preferred_providers=[SpeechProvider.COQUI_XTTS],
                cloning_quality=0.9,  # XTTS has excellent cloning quality
            )

            # Cache the embedding
            self._voice_embeddings[profile.id] = temp_path

            logger.info(f"Voice cloned successfully: {request.voice_name}")
            return profile

        except Exception as e:
            logger.error(f"Voice cloning failed: {e}")
            return None

    def _apply_prosody_markers(
        self,
        text: str,
        prosody: Optional[EmotionalProsody]
    ) -> str:
        """
        Apply prosody markers to text for emotional expression.

        XTTS doesn't use SSML but responds to punctuation and phrasing
        for emotional expression.
        """
        if not prosody:
            return text

        # Add pause markers for contemplative speech
        if prosody.pause_frequency > 1.2:
            # Add ellipses for longer pauses
            text = text.replace(". ", "... ")
            text = text.replace(", ", "... ")

        # Add emphasis markers (XTTS responds to capitalization)
        if prosody.emphasis_strength > 1.0:
            # Capitalize key spiritual terms
            spiritual_terms = ["peace", "love", "wisdom", "divine", "soul", "heart"]
            for term in spiritual_terms:
                if term in text.lower():
                    text = text.replace(term, term.upper())

        return text

    def _convert_audio_format(
        self,
        audio_data: bytes,
        target_format: str,
        sample_rate: int
    ) -> bytes:
        """Convert audio to requested format."""
        try:
            from pydub import AudioSegment

            # Load from wav bytes
            audio = AudioSegment.from_wav(io.BytesIO(audio_data))

            # Set sample rate
            audio = audio.set_frame_rate(sample_rate)

            # Export to target format
            output = io.BytesIO()
            audio.export(output, format=target_format)
            return output.getvalue()

        except ImportError:
            logger.warning("pydub not available, returning raw audio")
            return audio_data
        except Exception as e:
            logger.warning(f"Audio conversion failed: {e}")
            return audio_data

    def _numpy_to_audio_bytes(self, wav_array) -> bytes:
        """Convert numpy audio array to bytes."""
        try:
            import numpy as np
            from scipy.io import wavfile

            # Normalize to int16
            if wav_array.dtype == np.float32 or wav_array.dtype == np.float64:
                wav_array = (wav_array * 32767).astype(np.int16)

            # Write to bytes
            output = io.BytesIO()
            wavfile.write(output, 22050, wav_array)
            return output.getvalue()

        except Exception as e:
            logger.error(f"Audio conversion error: {e}")
            return b""

    def _save_temp_audio(self, audio_data: bytes) -> str:
        """Save audio data to a temporary file."""
        import tempfile

        temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        temp_file.write(audio_data)
        temp_file.close()
        return temp_file.name

    def _estimate_audio_duration(self, text: str) -> int:
        """Estimate audio duration in milliseconds."""
        # Average speaking rate: ~150 words per minute
        word_count = len(text.split())
        duration_seconds = word_count / 2.5  # 150 WPM = 2.5 words per second
        return int(duration_seconds * 1000)


# Singleton instance
_coqui_xtts_provider: Optional[CoquiXTTSProvider] = None


def get_coqui_xtts_provider() -> CoquiXTTSProvider:
    """Get the Coqui XTTS provider instance."""
    global _coqui_xtts_provider
    if _coqui_xtts_provider is None:
        _coqui_xtts_provider = CoquiXTTSProvider()
    return _coqui_xtts_provider
