"""
Whisper Provider - State-of-the-Art Speech Recognition

OpenAI's Whisper is the world's most capable automatic speech
recognition system, supporting:
- 99+ languages with high accuracy
- Robust to accents, background noise, technical language
- Translation to English
- Word-level timestamps

Origin: USA (OpenAI)
License: MIT

"Every whispered word of the soul is heard with perfect clarity."
"""

import logging
import asyncio
import time
from typing import Optional, List, Dict, Any
import io
import tempfile

from .base import (
    BaseSTTProvider,
    ProviderCapabilities,
    ProviderStatus,
)
from ..models import (
    SpeechRecognitionRequest,
    SpeechRecognitionResult,
    WordTimestamp,
    SpeechRecognizer,
    VoiceQuality,
)

logger = logging.getLogger(__name__)

# Try to import Whisper
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    logger.warning("OpenAI Whisper not available. Install with: pip install openai-whisper")

# Try faster-whisper for optimized inference
try:
    from faster_whisper import WhisperModel
    FASTER_WHISPER_AVAILABLE = True
except ImportError:
    FASTER_WHISPER_AVAILABLE = False

# Check for GPU
try:
    import torch
    GPU_AVAILABLE = torch.cuda.is_available()
except ImportError:
    GPU_AVAILABLE = False


class WhisperProvider(BaseSTTProvider):
    """
    OpenAI Whisper Provider for world-class speech recognition.

    Features:
    - 99+ language support
    - Robust to noise, accents, and domain-specific terminology
    - Word-level timestamps
    - Translation to English
    - Multiple model sizes for speed/accuracy tradeoff

    Model Sizes:
    - tiny: ~39M params, fastest, good for real-time
    - base: ~74M params, fast, good accuracy
    - small: ~244M params, balanced
    - medium: ~769M params, high accuracy
    - large: ~1550M params, highest accuracy

    Quality Tier: DIVINE (highest accuracy)
    Latency: 100-500ms (GPU), 500-2000ms (CPU) per second of audio
    """

    # Whisper model configurations
    MODEL_SIZES = {
        "tiny": {"params": "39M", "relative_speed": 32, "vram_gb": 1},
        "base": {"params": "74M", "relative_speed": 16, "vram_gb": 1},
        "small": {"params": "244M", "relative_speed": 6, "vram_gb": 2},
        "medium": {"params": "769M", "relative_speed": 2, "vram_gb": 5},
        "large": {"params": "1550M", "relative_speed": 1, "vram_gb": 10},
        "large-v2": {"params": "1550M", "relative_speed": 1, "vram_gb": 10},
        "large-v3": {"params": "1550M", "relative_speed": 1, "vram_gb": 10},
    }

    # Supported languages (partial list, Whisper supports 99+)
    SUPPORTED_LANGUAGES = [
        "en", "zh", "de", "es", "ru", "ko", "fr", "ja", "pt", "tr",
        "pl", "ca", "nl", "ar", "sv", "it", "id", "hi", "fi", "vi",
        "he", "uk", "el", "ms", "cs", "ro", "da", "hu", "ta", "no",
        "th", "ur", "hr", "bg", "lt", "la", "mi", "ml", "cy", "sk",
        "te", "fa", "lv", "bn", "sr", "az", "sl", "kn", "et", "mk",
        "br", "eu", "is", "hy", "ne", "mn", "bs", "kk", "sq", "sw",
        "gl", "mr", "pa", "si", "km", "sn", "yo", "so", "af", "oc",
        "ka", "be", "tg", "sd", "gu", "am", "yi", "lo", "uz", "fo",
        "ht", "ps", "tk", "nn", "mt", "sa", "lb", "my", "bo", "tl",
        "mg", "as", "tt", "haw", "ln", "ha", "ba", "jw", "su",
    ]

    # Spiritual vocabulary for improved recognition
    SPIRITUAL_VOCABULARY = [
        "dharma", "karma", "yoga", "atman", "brahman", "moksha",
        "nirvana", "prana", "chakra", "mantra", "namaste", "guru",
        "krishna", "arjuna", "gita", "bhagavad", "vedanta", "upanishad",
        "sanskrit", "meditation", "mindfulness", "enlightenment",
        "KIAAN", "MindVibe",
    ]

    def __init__(self, model_size: str = "base"):
        super().__init__(
            provider_id="whisper",
            provider_name="OpenAI Whisper"
        )

        self._model_size = model_size
        self._model = None
        self._use_faster_whisper = FASTER_WHISPER_AVAILABLE
        self._device = "cuda" if GPU_AVAILABLE else "cpu"
        self._compute_type = "float16" if GPU_AVAILABLE else "int8"

        self._capabilities = ProviderCapabilities(
            supports_synthesis=False,
            supports_recognition=True,
            supports_word_timestamps=True,
            supports_speaker_diarization=False,
            supported_languages=self.SUPPORTED_LANGUAGES,
            native_languages=["en"],  # Best for English
            max_quality_tier=VoiceQuality.DIVINE,
            typical_latency_ms=300 if GPU_AVAILABLE else 1000,
            requires_gpu=False,
            works_offline=True,
        )

    async def initialize(self) -> bool:
        """Initialize Whisper model."""
        if not WHISPER_AVAILABLE and not FASTER_WHISPER_AVAILABLE:
            logger.warning("No Whisper implementation available")
            self._health.status = ProviderStatus.UNAVAILABLE
            return False

        try:
            logger.info(f"Loading Whisper model: {self._model_size}...")

            if self._use_faster_whisper:
                # Use faster-whisper for optimized inference
                self._model = WhisperModel(
                    self._model_size,
                    device=self._device,
                    compute_type=self._compute_type
                )
                logger.info(f"Loaded faster-whisper on {self._device}")
            else:
                # Use standard whisper
                self._model = whisper.load_model(
                    self._model_size,
                    device=self._device
                )
                logger.info(f"Loaded whisper on {self._device}")

            self._initialized = True
            self._health.status = ProviderStatus.AVAILABLE
            return True

        except Exception as e:
            logger.error(f"Failed to initialize Whisper: {e}")
            self._health.status = ProviderStatus.ERROR
            self._health.error_message = str(e)
            return False

    async def shutdown(self) -> None:
        """Clean shutdown."""
        if self._model:
            del self._model
            self._model = None

        if GPU_AVAILABLE:
            import torch
            torch.cuda.empty_cache()

        self._initialized = False
        logger.info("Whisper provider shut down")

    def get_capabilities(self) -> ProviderCapabilities:
        return self._capabilities

    async def recognize(
        self,
        request: SpeechRecognitionRequest
    ) -> SpeechRecognitionResult:
        """Recognize speech using Whisper."""
        start_time = time.time()

        if not self._initialized or not self._model:
            return SpeechRecognitionResult(
                success=False,
                error_message="Whisper not initialized",
                provider_used=SpeechRecognizer.WHISPER,
            )

        try:
            # Save audio to temp file (Whisper needs file path)
            temp_file = tempfile.NamedTemporaryFile(
                suffix=f".{request.audio_format}",
                delete=False
            )
            temp_file.write(request.audio_data)
            temp_file.close()

            # Prepare options
            options = {
                "language": request.language if request.language != "auto" else None,
                "word_timestamps": request.enable_word_timestamps,
            }

            # Add vocabulary boost for spiritual terms
            if request.vocabulary_boost:
                options["initial_prompt"] = " ".join(
                    self.SPIRITUAL_VOCABULARY + request.vocabulary_boost
                )
            else:
                options["initial_prompt"] = " ".join(self.SPIRITUAL_VOCABULARY)

            # Run recognition
            loop = asyncio.get_event_loop()

            if self._use_faster_whisper:
                segments, info = await loop.run_in_executor(
                    None,
                    lambda: self._model.transcribe(
                        temp_file.name,
                        **options
                    )
                )
                # Process faster-whisper segments
                transcript, word_timestamps = self._process_faster_whisper_segments(
                    segments,
                    request.enable_word_timestamps
                )
                detected_language = info.language
            else:
                result = await loop.run_in_executor(
                    None,
                    lambda: self._model.transcribe(
                        temp_file.name,
                        **options
                    )
                )
                transcript = result["text"].strip()
                word_timestamps = self._extract_word_timestamps(result)
                detected_language = result.get("language", request.language)

            # Clean up temp file
            import os
            os.unlink(temp_file.name)

            recognition_time = int((time.time() - start_time) * 1000)
            self.record_request(True, recognition_time)

            return SpeechRecognitionResult(
                success=True,
                transcript=transcript,
                confidence=0.95,  # Whisper is highly accurate
                provider_used=SpeechRecognizer.WHISPER,
                word_timestamps=word_timestamps if request.enable_word_timestamps else [],
                recognition_time_ms=recognition_time,
                audio_duration_ms=self._estimate_audio_duration(request.audio_data),
                language_detected=detected_language,
            )

        except Exception as e:
            logger.error(f"Whisper recognition error: {e}")
            self.record_request(False, int((time.time() - start_time) * 1000))

            return SpeechRecognitionResult(
                success=False,
                error_message=str(e),
                provider_used=SpeechRecognizer.WHISPER,
            )

    def _process_faster_whisper_segments(
        self,
        segments,
        include_timestamps: bool
    ) -> tuple:
        """Process faster-whisper segments into transcript and timestamps."""
        transcript_parts = []
        word_timestamps = []

        for segment in segments:
            transcript_parts.append(segment.text)

            if include_timestamps and hasattr(segment, 'words'):
                for word in segment.words:
                    word_timestamps.append(WordTimestamp(
                        word=word.word,
                        start_time_ms=int(word.start * 1000),
                        end_time_ms=int(word.end * 1000),
                        confidence=word.probability if hasattr(word, 'probability') else 0.9
                    ))

        return " ".join(transcript_parts).strip(), word_timestamps

    def _extract_word_timestamps(self, result: Dict) -> List[WordTimestamp]:
        """Extract word timestamps from standard whisper result."""
        word_timestamps = []

        if "segments" not in result:
            return word_timestamps

        for segment in result["segments"]:
            if "words" not in segment:
                continue

            for word_data in segment["words"]:
                word_timestamps.append(WordTimestamp(
                    word=word_data.get("word", ""),
                    start_time_ms=int(word_data.get("start", 0) * 1000),
                    end_time_ms=int(word_data.get("end", 0) * 1000),
                    confidence=word_data.get("probability", 0.9)
                ))

        return word_timestamps

    def _estimate_audio_duration(self, audio_data: bytes) -> int:
        """Estimate audio duration in milliseconds."""
        # Rough estimate: 16000 samples/sec * 2 bytes/sample for 16-bit audio
        bytes_per_second = 32000
        return int(len(audio_data) / bytes_per_second * 1000)


# Singleton
_whisper_provider: Optional[WhisperProvider] = None


def get_whisper_provider(model_size: str = "base") -> WhisperProvider:
    """Get the Whisper provider instance."""
    global _whisper_provider
    if _whisper_provider is None:
        _whisper_provider = WhisperProvider(model_size)
    return _whisper_provider
