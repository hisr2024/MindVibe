"""
Silero Models Provider - Fast, Efficient TTS

Silero is a Russian-origin open source project providing:
- Ultra-fast synthesis (10x faster than real-time on CPU)
- High-quality voices for multiple languages
- Lightweight models (< 100MB)
- Excellent for real-time applications

Origin: Russia (Silero Team)
License: Apache 2.0

"Swift as thought, clear as crystal - the voice of instant wisdom."
"""

import logging
import asyncio
import time
from typing import Optional, List, Dict, Any
import io

from .base import (
    BaseTTSProvider,
    ProviderCapabilities,
    ProviderStatus,
)
from ..models import (
    SpeechSynthesisRequest,
    SpeechSynthesisResult,
    SpeechProvider,
    VoiceQuality,
    EmotionalProsody,
)

logger = logging.getLogger(__name__)

# Try to import Silero
try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not available. Silero requires torch.")


class SileroProvider(BaseTTSProvider):
    """
    Silero TTS Provider for ultra-fast speech synthesis.

    Features:
    - 10x faster than real-time on CPU
    - Multiple language support (en, de, es, fr, ru, and more)
    - Small model size (< 100MB per language)
    - SSML support for prosody control
    - Perfect for real-time voice interaction

    Quality Tier: PREMIUM (high quality, very fast)
    Latency: 50-200ms (CPU), 20-50ms (GPU)
    """

    # Silero model configurations
    SILERO_MODELS = {
        "en": {
            "model": "v3_en",
            "speakers": ["en_0", "en_1", "en_2", "en_3", "en_4",
                        "en_5", "en_6", "en_7", "en_8", "en_9",
                        "en_10", "en_11", "en_12", "en_13", "en_14",
                        "en_15", "en_16", "en_17", "en_18", "en_19",
                        "en_20", "en_21", "en_22", "en_23", "en_24",
                        "en_25", "en_26", "en_27", "en_28", "en_29",
                        "en_30", "en_31", "en_32", "en_33", "en_34",
                        "en_35", "en_36", "en_37", "en_38", "en_39",
                        "en_40", "en_41", "en_42", "en_43", "en_44",
                        "en_45", "en_46", "en_47", "en_48", "en_49",
                        "en_50", "en_51", "en_52", "en_53", "en_54",
                        "en_55", "en_56", "en_57", "en_58", "en_59",
                        "en_60", "en_61", "en_62", "en_63", "en_64",
                        "en_65", "en_66", "en_67", "en_68", "en_69",
                        "en_70", "en_71", "en_72", "en_73", "en_74",
                        "en_75", "en_76", "en_77", "en_78", "en_79",
                        "en_80", "en_81", "en_82", "en_83", "en_84",
                        "en_85", "en_86", "en_87", "en_88", "en_89",
                        "en_90", "en_91", "en_92", "en_93", "en_94",
                        "en_95", "en_96", "en_97", "en_98", "en_99",
                        "en_100", "en_101", "en_102", "en_103", "en_104",
                        "en_105", "en_106", "en_107", "en_108", "en_109",
                        "en_110", "en_111", "en_112", "en_113", "en_114",
                        "en_115", "en_116", "en_117"],
            "female_speakers": ["en_0", "en_5", "en_10", "en_15", "en_20",
                               "en_25", "en_30", "en_35", "en_40", "en_45"],
            "calm_speakers": ["en_21", "en_45", "en_72", "en_91"],  # Best for divine voice
        },
        "de": {"model": "v3_de", "speakers": ["eva_k", "friedrich", "karlsson", "bernd_ungerer"]},
        "es": {"model": "v3_es", "speakers": ["es_0", "es_1", "es_2"]},
        "fr": {"model": "v3_fr", "speakers": ["fr_0", "fr_1", "fr_2"]},
        "ru": {"model": "v3_1_ru", "speakers": ["aidar", "baya", "kseniya", "xenia", "eugene", "random"]},
        "ua": {"model": "v3_ua", "speakers": ["mykyta", "random"]},
        "uz": {"model": "v3_uz", "speakers": ["dilnavoz"]},
        "tt": {"model": "v3_tt", "speakers": ["dilyara"]},
        "ba": {"model": "v3_ba", "speakers": ["aigul"]},
        "kz": {"model": "v3_kz", "speakers": ["isseke", "raya", "amina"]},
        "indic": {"model": "v3_indic", "speakers": ["tamil_female", "telugu_female",
                                                     "kannada_female", "malayalam_female",
                                                     "hindi_female", "hindi_male",
                                                     "bengali_female", "bengali_male",
                                                     "marathi_female", "marathi_male",
                                                     "gujarati_female", "gujarati_male"]},
    }

    SUPPORTED_LANGUAGES = list(SILERO_MODELS.keys()) + [
        "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu"  # Indic variants
    ]

    # Divine voice speaker selections (calm, serene voices)
    DIVINE_SPEAKERS = {
        "en": "en_21",      # Calm female voice
        "ru": "xenia",      # Gentle female voice
        "de": "eva_k",      # Warm female voice
        "es": "es_0",       # Serene female voice
        "fr": "fr_0",       # Soft female voice
        "hi": "hindi_female",  # Indian female voice
    }

    def __init__(self):
        super().__init__(
            provider_id="silero",
            provider_name="Silero TTS"
        )

        self._models: Dict[str, Any] = {}
        self._device = "cpu"

        self._capabilities = ProviderCapabilities(
            supports_synthesis=True,
            supports_ssml=True,
            supports_emotions=True,
            supports_voice_cloning=False,
            supports_streaming=False,
            supports_recognition=False,
            supported_languages=self.SUPPORTED_LANGUAGES,
            native_languages=["en", "ru", "de"],  # Best quality
            max_quality_tier=VoiceQuality.PREMIUM,
            typical_latency_ms=100,
            requires_gpu=False,
            works_offline=True,
            available_voices=self._get_all_speakers(),
            voice_genders=["female", "male"],
        )

    def _get_all_speakers(self) -> List[str]:
        """Get all available speakers across all languages."""
        speakers = []
        for lang_config in self.SILERO_MODELS.values():
            speakers.extend(lang_config.get("speakers", []))
        return speakers

    async def initialize(self) -> bool:
        """Initialize Silero models."""
        if not TORCH_AVAILABLE:
            logger.warning("PyTorch not available, Silero unavailable")
            self._health.status = ProviderStatus.UNAVAILABLE
            return False

        try:
            # Set device
            self._device = "cuda" if torch.cuda.is_available() else "cpu"

            # Pre-load English model (most commonly used)
            await self._load_model("en")

            self._initialized = True
            self._health.status = ProviderStatus.AVAILABLE
            logger.info(f"Silero TTS initialized on {self._device}")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize Silero: {e}")
            self._health.status = ProviderStatus.ERROR
            self._health.error_message = str(e)
            return False

    async def _load_model(self, language: str) -> bool:
        """Load a Silero model for a specific language."""
        if language in self._models:
            return True

        # Map to base language for indic languages
        base_lang = language
        if language in ["hi", "ta", "te", "kn", "ml", "bn", "mr", "gu"]:
            base_lang = "indic"

        if base_lang not in self.SILERO_MODELS:
            logger.warning(f"No Silero model for language: {language}")
            return False

        try:
            model_config = self.SILERO_MODELS[base_lang]
            model_id = f'silero_tts:model={model_config["model"]}'

            # Load model from torch hub
            model, _ = torch.hub.load(
                repo_or_dir='snakers4/silero-models',
                model='silero_tts',
                language=base_lang.split('_')[0] if '_' in base_lang else base_lang,
                speaker=model_config["model"]
            )

            model.to(self._device)
            self._models[base_lang] = {
                "model": model,
                "config": model_config
            }

            logger.info(f"Loaded Silero model for {base_lang}")
            return True

        except Exception as e:
            logger.error(f"Failed to load Silero model for {language}: {e}")
            return False

    async def shutdown(self) -> None:
        """Clean shutdown."""
        self._models.clear()
        if TORCH_AVAILABLE and torch.cuda.is_available():
            torch.cuda.empty_cache()
        self._initialized = False
        logger.info("Silero provider shut down")

    def get_capabilities(self) -> ProviderCapabilities:
        return self._capabilities

    async def synthesize(
        self,
        request: SpeechSynthesisRequest
    ) -> SpeechSynthesisResult:
        """Synthesize speech using Silero TTS."""
        start_time = time.time()

        if not self._initialized:
            return SpeechSynthesisResult(
                success=False,
                error_message="Silero not initialized",
                provider_used=SpeechProvider.SILERO,
            )

        try:
            # Determine language and load model if needed
            language = request.language
            base_lang = language
            if language in ["hi", "ta", "te", "kn", "ml", "bn", "mr", "gu"]:
                base_lang = "indic"

            if base_lang not in self._models:
                loaded = await self._load_model(base_lang)
                if not loaded:
                    return SpeechSynthesisResult(
                        success=False,
                        error_message=f"No model available for {language}",
                        provider_used=SpeechProvider.SILERO,
                    )

            model_data = self._models[base_lang]
            model = model_data["model"]
            config = model_data["config"]

            # Select speaker
            speaker = self._select_speaker(language, request.prosody, config)

            # Apply prosody to get speaking rate
            speaking_rate = self._calculate_speaking_rate(request.prosody)

            # Generate SSML if needed
            text = request.text
            if request.use_ssml:
                text = self._apply_ssml_prosody(text, request.prosody)

            # Synthesize
            loop = asyncio.get_event_loop()
            audio = await loop.run_in_executor(
                None,
                lambda: model.apply_tts(
                    text=text,
                    speaker=speaker,
                    sample_rate=request.sample_rate,
                    put_accent=True,
                    put_yo=True
                )
            )

            # Convert to bytes
            audio_bytes = self._tensor_to_audio_bytes(audio, request.sample_rate)

            synthesis_time = int((time.time() - start_time) * 1000)
            self.record_request(True, synthesis_time)

            return SpeechSynthesisResult(
                success=True,
                audio_data=audio_bytes,
                provider_used=SpeechProvider.SILERO,
                synthesis_time_ms=synthesis_time,
                audio_duration_ms=int(len(audio) / request.sample_rate * 1000),
                sample_rate=request.sample_rate,
                format="wav",
                file_size_bytes=len(audio_bytes),
                quality_score=0.88,
                naturalness_score=0.85,
                voice_id_used=speaker,
            )

        except Exception as e:
            logger.error(f"Silero synthesis error: {e}")
            self.record_request(False, int((time.time() - start_time) * 1000))

            return SpeechSynthesisResult(
                success=False,
                error_message=str(e),
                provider_used=SpeechProvider.SILERO,
            )

    def _select_speaker(
        self,
        language: str,
        prosody: Optional[EmotionalProsody],
        config: Dict
    ) -> str:
        """Select the best speaker for the given language and prosody."""
        # Use divine speaker if available
        if language in self.DIVINE_SPEAKERS:
            return self.DIVINE_SPEAKERS[language]

        # Select from calm speakers if prosody indicates calmness
        if prosody and prosody.emotion.value in ["serene", "compassionate", "gentle"]:
            calm_speakers = config.get("calm_speakers", [])
            if calm_speakers:
                return calm_speakers[0]

        # Default to first speaker
        speakers = config.get("speakers", ["en_0"])
        return speakers[0]

    def _calculate_speaking_rate(self, prosody: Optional[EmotionalProsody]) -> float:
        """Calculate speaking rate from prosody settings."""
        if not prosody:
            return 1.0

        # Silero uses 0.5-2.0 range
        return max(0.5, min(2.0, prosody.speaking_rate))

    def _apply_ssml_prosody(
        self,
        text: str,
        prosody: Optional[EmotionalProsody]
    ) -> str:
        """Apply SSML prosody tags to text."""
        if not prosody:
            return text

        # Silero supports basic SSML
        ssml_parts = []

        # Add pauses for emphasis
        if prosody.pause_frequency > 1.2:
            # Add breaks after sentences
            text = text.replace(". ", ".<break time='500ms'/> ")
            text = text.replace("? ", "?<break time='400ms'/> ")

        return text

    def _tensor_to_audio_bytes(self, audio_tensor, sample_rate: int) -> bytes:
        """Convert audio tensor to bytes."""
        try:
            import numpy as np
            from scipy.io import wavfile

            # Convert to numpy
            if hasattr(audio_tensor, 'numpy'):
                audio_np = audio_tensor.numpy()
            else:
                audio_np = np.array(audio_tensor)

            # Normalize and convert to int16
            if audio_np.max() > 1.0:
                audio_np = audio_np / 32768.0
            audio_np = (audio_np * 32767).astype(np.int16)

            # Write to bytes
            output = io.BytesIO()
            wavfile.write(output, sample_rate, audio_np)
            return output.getvalue()

        except Exception as e:
            logger.error(f"Audio conversion error: {e}")
            return b""


# Singleton
_silero_provider: Optional[SileroProvider] = None


def get_silero_provider() -> SileroProvider:
    """Get the Silero provider instance."""
    global _silero_provider
    if _silero_provider is None:
        _silero_provider = SileroProvider()
    return _silero_provider
