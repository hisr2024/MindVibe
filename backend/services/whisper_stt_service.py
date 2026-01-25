"""
KIAAN Whisper Speech-to-Text Service - Offline Speech Recognition

Provides speech-to-text capabilities for KIAAN voice interactions.
Supports both cloud (OpenAI Whisper API) and local (faster-whisper) inference.

Features:
- OpenAI Whisper API for cloud-based transcription (highest accuracy)
- faster-whisper for local/offline transcription (no internet required)
- Automatic language detection
- Multiple audio format support (WAV, MP3, M4A, WebM, etc.)
- Streaming transcription for long audio
- Confidence scoring
- Voice Activity Detection (VAD) for efficiency

OFFLINE INDEPENDENCE:
- Full offline support via faster-whisper
- Automatic model download from HuggingFace
- Model size options: tiny, base, small, medium, large
- CPU and GPU inference support
"""

import asyncio
import logging
import os
import tempfile
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, AsyncGenerator, Optional, Union
import hashlib

logger = logging.getLogger(__name__)

# Optional imports for speech recognition
try:
    from faster_whisper import WhisperModel
    FASTER_WHISPER_AVAILABLE = True
except ImportError:
    FASTER_WHISPER_AVAILABLE = False
    logger.info("faster-whisper not installed. Local STT unavailable.")

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.info("openai not installed. Cloud STT unavailable.")

try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except ImportError:
    SOUNDFILE_AVAILABLE = False

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False


class WhisperModelSize(str, Enum):
    """Available Whisper model sizes."""
    TINY = "tiny"
    BASE = "base"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large-v3"


class STTProvider(str, Enum):
    """STT provider types."""
    OPENAI = "openai"
    LOCAL = "local"
    AUTO = "auto"


@dataclass
class TranscriptionResult:
    """Result from speech transcription."""
    text: str
    language: str
    confidence: float
    duration_seconds: float
    provider: STTProvider
    segments: list[dict] = None

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "language": self.language,
            "confidence": self.confidence,
            "duration_seconds": self.duration_seconds,
            "provider": self.provider.value,
            "segments": self.segments or []
        }


class LocalWhisperManager:
    """
    Manages local Whisper model for offline speech recognition.
    Downloads and caches models automatically.
    """

    def __init__(
        self,
        model_size: str = "base",
        device: str = "auto",
        compute_type: str = "int8",
        model_path: Optional[str] = None
    ):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.model_path = Path(model_path or Path.home() / ".mindvibe" / "models" / "whisper")
        self.model_path.mkdir(parents=True, exist_ok=True)

        self._model: Optional[Any] = None
        self._initialized = False

    def _ensure_initialized(self) -> bool:
        """Initialize Whisper model on first use."""
        if self._initialized:
            return self._model is not None

        if not FASTER_WHISPER_AVAILABLE:
            logger.warning("faster-whisper not available for local STT")
            self._initialized = True
            return False

        try:
            # Determine device
            if self.device == "auto":
                try:
                    import torch
                    device = "cuda" if torch.cuda.is_available() else "cpu"
                except ImportError:
                    device = "cpu"
            else:
                device = self.device

            # Adjust compute type for CPU
            compute_type = self.compute_type
            if device == "cpu" and compute_type not in ["int8", "float32"]:
                compute_type = "int8"

            logger.info(f"Loading Whisper model: {self.model_size} on {device} ({compute_type})")

            self._model = WhisperModel(
                self.model_size,
                device=device,
                compute_type=compute_type,
                download_root=str(self.model_path)
            )

            logger.info(f"Whisper model loaded successfully: {self.model_size}")
            self._initialized = True
            return True

        except Exception as e:
            logger.error(f"Failed to initialize Whisper model: {e}")
            self._initialized = True
            return False

    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Optional[TranscriptionResult]:
        """
        Transcribe audio file using local Whisper model.

        Args:
            audio_path: Path to audio file
            language: Language code (None for auto-detect)
            task: "transcribe" or "translate"

        Returns:
            TranscriptionResult or None if failed
        """
        if not self._ensure_initialized():
            return None

        try:
            segments, info = self._model.transcribe(
                audio_path,
                language=language,
                task=task,
                beam_size=5,
                vad_filter=True,
                vad_parameters=dict(
                    min_silence_duration_ms=500,
                    speech_pad_ms=200
                )
            )

            # Collect segments
            segment_list = []
            full_text = []
            total_confidence = 0
            segment_count = 0

            for segment in segments:
                segment_list.append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip(),
                    "confidence": segment.avg_logprob
                })
                full_text.append(segment.text.strip())
                total_confidence += segment.avg_logprob
                segment_count += 1

            avg_confidence = total_confidence / segment_count if segment_count > 0 else 0
            # Convert log probability to 0-1 scale
            confidence = min(1.0, max(0.0, 1.0 + avg_confidence / 5))

            return TranscriptionResult(
                text=" ".join(full_text),
                language=info.language,
                confidence=confidence,
                duration_seconds=info.duration,
                provider=STTProvider.LOCAL,
                segments=segment_list
            )

        except Exception as e:
            logger.error(f"Local transcription failed: {e}")
            return None

    def is_available(self) -> bool:
        """Check if local Whisper is available."""
        return FASTER_WHISPER_AVAILABLE

    def get_model_info(self) -> dict:
        """Get information about loaded model."""
        return {
            "available": self.is_available(),
            "initialized": self._initialized and self._model is not None,
            "model_size": self.model_size,
            "device": self.device,
            "compute_type": self.compute_type
        }


class WhisperSTTService:
    """
    Speech-to-Text service with cloud and offline support.

    Provides automatic fallback between providers:
    1. OpenAI Whisper API (cloud, highest accuracy)
    2. faster-whisper (local, offline capable)
    """

    def __init__(
        self,
        provider: str = "auto",
        model_size: str = "base",
        openai_api_key: Optional[str] = None
    ):
        self.provider = STTProvider(provider)
        self.model_size = model_size
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")

        # Initialize local Whisper manager
        self.local_whisper = LocalWhisperManager(
            model_size=model_size,
            device=os.getenv("WHISPER_DEVICE", "auto"),
            compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8")
        )

        # OpenAI client for cloud transcription
        self._openai_client = None
        if OPENAI_AVAILABLE and self.openai_api_key:
            try:
                self._openai_client = openai.OpenAI(api_key=self.openai_api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")

    async def transcribe(
        self,
        audio_data: Union[bytes, str, Path],
        language: Optional[str] = None,
        force_local: bool = False
    ) -> TranscriptionResult:
        """
        Transcribe audio to text.

        Args:
            audio_data: Audio bytes, file path, or Path object
            language: Language code (None for auto-detect)
            force_local: Force local transcription even when cloud is available

        Returns:
            TranscriptionResult with transcribed text
        """
        # Convert audio data to file path if needed
        audio_path = await self._prepare_audio(audio_data)

        try:
            if force_local or self.provider == STTProvider.LOCAL:
                # Use local only
                result = self._transcribe_local(audio_path, language)
                if result:
                    return result
                raise Exception("Local transcription failed")

            if self.provider == STTProvider.OPENAI:
                # Use cloud only
                result = await self._transcribe_openai(audio_path, language)
                if result:
                    return result
                raise Exception("OpenAI transcription failed")

            # Auto mode: try cloud first, then local
            if self._openai_client:
                try:
                    result = await self._transcribe_openai(audio_path, language)
                    if result:
                        return result
                except Exception as e:
                    logger.warning(f"Cloud transcription failed, trying local: {e}")

            # Fallback to local
            result = self._transcribe_local(audio_path, language)
            if result:
                return result

            raise Exception("All transcription providers failed")

        finally:
            # Clean up temp file if we created one
            if isinstance(audio_data, bytes):
                try:
                    os.unlink(audio_path)
                except Exception:
                    pass

    async def _prepare_audio(self, audio_data: Union[bytes, str, Path]) -> str:
        """Prepare audio data for transcription."""
        if isinstance(audio_data, (str, Path)):
            return str(audio_data)

        # Save bytes to temp file
        suffix = ".wav"  # Default format
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(audio_data)
            return f.name

    async def _transcribe_openai(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> Optional[TranscriptionResult]:
        """Transcribe using OpenAI Whisper API."""
        if not self._openai_client:
            return None

        try:
            with open(audio_path, "rb") as audio_file:
                # Call OpenAI API
                response = self._openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json"
                )

            return TranscriptionResult(
                text=response.text,
                language=response.language or language or "unknown",
                confidence=0.95,  # OpenAI doesn't provide confidence
                duration_seconds=response.duration or 0,
                provider=STTProvider.OPENAI,
                segments=[
                    {
                        "start": s.get("start", 0),
                        "end": s.get("end", 0),
                        "text": s.get("text", "")
                    }
                    for s in (response.segments or [])
                ]
            )

        except Exception as e:
            logger.error(f"OpenAI transcription failed: {e}")
            return None

    def _transcribe_local(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> Optional[TranscriptionResult]:
        """Transcribe using local Whisper model."""
        return self.local_whisper.transcribe(audio_path, language)

    def is_available(self) -> bool:
        """Check if any STT provider is available."""
        return bool(self._openai_client) or self.local_whisper.is_available()

    def is_offline_available(self) -> bool:
        """Check if offline STT is available."""
        return self.local_whisper.is_available()

    def get_status(self) -> dict:
        """Get status of all STT providers."""
        return {
            "provider": self.provider.value,
            "openai_available": bool(self._openai_client),
            "local_available": self.local_whisper.is_available(),
            "local_model": self.local_whisper.get_model_info(),
            "offline_capable": self.is_offline_available()
        }


# =============================================================================
# AUDIO PROCESSING UTILITIES
# =============================================================================

class AudioProcessor:
    """
    Audio processing utilities for STT.
    Handles format conversion, normalization, and VAD.
    """

    @staticmethod
    def convert_to_wav(
        audio_data: bytes,
        source_format: str = "webm"
    ) -> Optional[bytes]:
        """Convert audio to WAV format for processing."""
        if not PYDUB_AVAILABLE:
            logger.warning("pydub not available for audio conversion")
            return None

        try:
            # Load audio
            audio = AudioSegment.from_file(
                BytesIO(audio_data),
                format=source_format
            )

            # Convert to mono, 16kHz (optimal for Whisper)
            audio = audio.set_channels(1)
            audio = audio.set_frame_rate(16000)

            # Export as WAV
            output = BytesIO()
            audio.export(output, format="wav")
            return output.getvalue()

        except Exception as e:
            logger.error(f"Audio conversion failed: {e}")
            return None

    @staticmethod
    def get_audio_duration(audio_path: str) -> float:
        """Get duration of audio file in seconds."""
        if not SOUNDFILE_AVAILABLE:
            return 0.0

        try:
            info = sf.info(audio_path)
            return info.duration
        except Exception:
            return 0.0

    @staticmethod
    def normalize_audio(audio_data: bytes) -> bytes:
        """Normalize audio volume."""
        if not PYDUB_AVAILABLE:
            return audio_data

        try:
            from io import BytesIO
            audio = AudioSegment.from_file(BytesIO(audio_data))

            # Normalize to -20 dBFS
            change_in_dBFS = -20.0 - audio.dBFS
            normalized = audio.apply_gain(change_in_dBFS)

            output = BytesIO()
            normalized.export(output, format="wav")
            return output.getvalue()

        except Exception as e:
            logger.warning(f"Audio normalization failed: {e}")
            return audio_data


# Import BytesIO for AudioProcessor
from io import BytesIO

# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

_stt_service: Optional[WhisperSTTService] = None


def get_stt_service() -> WhisperSTTService:
    """Get singleton STT service instance."""
    global _stt_service
    if _stt_service is None:
        _stt_service = WhisperSTTService(
            provider=os.getenv("STT_PROVIDER", "auto"),
            model_size=os.getenv("WHISPER_MODEL_SIZE", "base")
        )
    return _stt_service


def is_stt_available() -> bool:
    """Check if STT is available."""
    service = get_stt_service()
    return service.is_available()


def is_offline_stt_available() -> bool:
    """Check if offline STT is available."""
    return FASTER_WHISPER_AVAILABLE


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "WhisperSTTService",
    "WhisperModelSize",
    "STTProvider",
    "TranscriptionResult",
    "LocalWhisperManager",
    "AudioProcessor",
    "get_stt_service",
    "is_stt_available",
    "is_offline_stt_available",
    "FASTER_WHISPER_AVAILABLE",
    "OPENAI_AVAILABLE",
]
