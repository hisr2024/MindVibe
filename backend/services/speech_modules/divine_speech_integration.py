"""
Divine Speech Integration Layer

Connects the world-class speech module orchestrator with the existing
TTS service to provide KIAAN Divine Voice with the finest open-source
speech technologies from around the world.

This integration provides:
- Seamless fallback between providers
- Quality-based provider selection
- Divine voice optimization
- Voice learning integration
- Unified API for all speech operations

"Where ancient wisdom meets modern voice technology."
"""

import logging
import asyncio
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum

from .orchestrator import (
    SpeechModuleOrchestrator,
    get_speech_orchestrator,
)
from .models import (
    SpeechSynthesisRequest,
    SpeechSynthesisResult,
    SpeechRecognitionRequest,
    SpeechRecognitionResult,
    VoiceProfile,
    VoiceQuality,
    EmotionalProsody,
    EmotionCategory,
    SpeechProvider,
    SpeechRecognizer,
    DIVINE_VOICE_PROFILES,
    DIVINE_FEMALE_VOICES,
    DIVINE_MALE_VOICES,
    DIVINE_EMOTION_PROSODY,
    NaturalSpeechEnhancement,
    NATURAL_SPEECH_PRESETS,
    DivineVoiceGender,
)

logger = logging.getLogger(__name__)


class DivineVoiceMode(Enum):
    """Voice modes for divine conversation."""
    SERENE = "serene"           # Deep calm, meditation
    WISE = "wise"               # Teaching, guidance
    COMPASSIONATE = "compassionate"  # Emotional support
    MEDITATION = "meditation"   # Guided meditation
    CONVERSATION = "conversation"  # Natural dialogue
    VERSE_RECITATION = "verse_recitation"  # Gita verses


@dataclass
class DivineSynthesisConfig:
    """Configuration for divine speech synthesis."""
    mode: DivineVoiceMode = DivineVoiceMode.CONVERSATION
    emotion: str = "peace"
    intensity: float = 0.7
    language: str = "en"

    # Voice Gender Selection - NEW
    gender: str = "female"      # "female", "male", or "neutral"

    # Quality preferences
    quality_tier: VoiceQuality = VoiceQuality.DIVINE
    use_neural_voices: bool = True
    use_voice_cloning: bool = False
    reference_audio: Optional[bytes] = None

    # Prosody overrides
    speaking_rate: Optional[float] = None
    pitch: Optional[float] = None
    warmth: Optional[float] = None
    breathiness: Optional[float] = None

    # Natural Speech Enhancement - NEW
    natural_speech: bool = True         # Enable natural speech enhancements
    add_breath_sounds: bool = True      # Add natural breaths
    human_like_variation: bool = True   # Add micro-variations for human feel

    # Content markers
    content_type: str = "conversation"
    include_breathing: bool = True      # Changed default to True
    include_pauses: bool = True
    spiritual_emphasis: bool = True

    # User context
    user_id: Optional[str] = None
    session_id: Optional[str] = None


class DivineSpeechIntegration:
    """
    Integration layer for divine speech synthesis.

    Combines the world-class speech orchestrator with optimized
    settings for KIAAN's divine voice quality.
    """

    def __init__(self):
        """Initialize divine speech integration."""
        self._orchestrator: Optional[SpeechModuleOrchestrator] = None
        self._initialized = False

        # Voice profile cache
        self._voice_profiles: Dict[str, VoiceProfile] = {}

        # Quality metrics tracking
        self._synthesis_count = 0
        self._total_quality_score = 0.0
        self._provider_usage: Dict[str, int] = {}

        # Mode-specific configurations with gender support
        # Female voice profiles (default - nurturing divine mother)
        self._female_mode_configs: Dict[DivineVoiceMode, Dict[str, Any]] = {
            DivineVoiceMode.SERENE: {
                "voice_profile": "shakti_serene",
                "speaking_rate": 0.85,
                "pitch": -0.8,
                "warmth": 0.92,
                "breathiness": 0.25,
                "pause_multiplier": 1.4,
                "natural_preset": "divine_natural",
            },
            DivineVoiceMode.WISE: {
                "voice_profile": "saraswati_wise",
                "speaking_rate": 0.90,
                "pitch": -0.3,
                "warmth": 0.7,
                "breathiness": 0.12,
                "pause_multiplier": 1.25,
                "natural_preset": "divine_natural",
            },
            DivineVoiceMode.COMPASSIONATE: {
                "voice_profile": "lakshmi_compassionate",
                "speaking_rate": 0.87,
                "pitch": -0.2,
                "warmth": 0.95,
                "breathiness": 0.2,
                "pause_multiplier": 1.1,
                "natural_preset": "divine_natural",
            },
            DivineVoiceMode.MEDITATION: {
                "voice_profile": "parvati_meditation",
                "speaking_rate": 0.78,
                "pitch": -1.5,
                "warmth": 0.8,
                "breathiness": 0.45,
                "pause_multiplier": 2.0,
                "natural_preset": "meditation_natural",
            },
            DivineVoiceMode.CONVERSATION: {
                "voice_profile": "shakti_serene",
                "speaking_rate": 0.90,
                "pitch": -0.5,
                "warmth": 0.85,
                "breathiness": 0.15,
                "pause_multiplier": 1.0,
                "natural_preset": "conversation_natural",
            },
            DivineVoiceMode.VERSE_RECITATION: {
                "voice_profile": "saraswati_wise",
                "speaking_rate": 0.83,
                "pitch": -1.0,
                "warmth": 0.75,
                "breathiness": 0.2,
                "pause_multiplier": 1.6,
                "natural_preset": "divine_natural",
            },
        }

        # Male voice profiles (wise sage divine father)
        self._male_mode_configs: Dict[DivineVoiceMode, Dict[str, Any]] = {
            DivineVoiceMode.SERENE: {
                "voice_profile": "krishna_serene",
                "speaking_rate": 0.87,
                "pitch": -2.5,
                "warmth": 0.88,
                "breathiness": 0.15,
                "pause_multiplier": 1.35,
                "natural_preset": "divine_natural",
            },
            DivineVoiceMode.WISE: {
                "voice_profile": "vishnu_wise",
                "speaking_rate": 0.88,
                "pitch": -3.0,
                "warmth": 0.65,
                "breathiness": 0.1,
                "pause_multiplier": 1.4,
                "natural_preset": "divine_natural",
            },
            DivineVoiceMode.COMPASSIONATE: {
                "voice_profile": "shiva_compassionate",
                "speaking_rate": 0.85,
                "pitch": -2.8,
                "warmth": 0.9,
                "breathiness": 0.12,
                "pause_multiplier": 1.3,
                "natural_preset": "divine_natural",
            },
            DivineVoiceMode.MEDITATION: {
                "voice_profile": "brahma_meditation",
                "speaking_rate": 0.75,
                "pitch": -4.0,
                "warmth": 0.75,
                "breathiness": 0.3,
                "pause_multiplier": 2.2,
                "natural_preset": "meditation_natural",
            },
            DivineVoiceMode.CONVERSATION: {
                "voice_profile": "krishna_serene",
                "speaking_rate": 0.88,
                "pitch": -2.3,
                "warmth": 0.85,
                "breathiness": 0.12,
                "pause_multiplier": 1.0,
                "natural_preset": "conversation_natural",
            },
            DivineVoiceMode.VERSE_RECITATION: {
                "voice_profile": "vishnu_wise",
                "speaking_rate": 0.82,
                "pitch": -3.5,
                "warmth": 0.7,
                "breathiness": 0.18,
                "pause_multiplier": 1.7,
                "natural_preset": "divine_natural",
            },
        }

        # Default mode configs (backwards compatible, uses female)
        self._mode_configs = self._female_mode_configs

        logger.info("Divine Speech Integration initialized with natural voice enhancement")

    def _get_mode_config_for_gender(
        self,
        mode: DivineVoiceMode,
        gender: str = "female"
    ) -> Dict[str, Any]:
        """Get configuration for a voice mode with gender selection."""
        if gender.lower() == "male":
            configs = self._male_mode_configs
        else:
            configs = self._female_mode_configs

        return configs.get(mode, configs[DivineVoiceMode.CONVERSATION])

    async def initialize(self) -> bool:
        """
        Initialize the divine speech integration.

        Loads world-class providers and optimizes for divine voice.

        Returns:
            True if initialization successful
        """
        if self._initialized:
            return True

        try:
            # Get or create orchestrator
            self._orchestrator = get_speech_orchestrator()

            # Initialize orchestrator
            init_results = await self._orchestrator.initialize()

            # Log provider status
            available_providers = [
                name for name, success in init_results.items() if success
            ]
            logger.info(f"Divine Speech initialized with providers: {available_providers}")

            # Load divine voice profiles
            self._voice_profiles = DIVINE_VOICE_PROFILES.copy()

            self._initialized = True
            return True

        except Exception as e:
            logger.error(f"Failed to initialize Divine Speech: {e}")
            return False

    async def shutdown(self) -> None:
        """Clean shutdown of the integration."""
        if self._orchestrator:
            await self._orchestrator.shutdown()
        self._initialized = False

    def _get_mode_config(self, mode: DivineVoiceMode, gender: str = "female") -> Dict[str, Any]:
        """Get configuration for a voice mode with optional gender selection."""
        return self._get_mode_config_for_gender(mode, gender)

    def _build_prosody(
        self,
        config: DivineSynthesisConfig,
        mode_settings: Dict[str, Any]
    ) -> EmotionalProsody:
        """
        Build emotional prosody from config and mode settings.

        Combines user preferences with mode-specific optimizations.
        """
        # Get emotion category
        emotion_map = {
            "peace": EmotionCategory.SERENE,
            "compassion": EmotionCategory.COMPASSIONATE,
            "wisdom": EmotionCategory.WISE,
            "joy": EmotionCategory.JOYFUL,
            "solemnity": EmotionCategory.SOLEMN,
            "encouragement": EmotionCategory.ENCOURAGING,
            "neutral": EmotionCategory.NEUTRAL,
        }
        emotion = emotion_map.get(config.emotion, EmotionCategory.SERENE)

        # Build prosody with mode defaults and user overrides
        return EmotionalProsody(
            emotion=emotion,
            intensity=config.intensity,
            speaking_rate=config.speaking_rate or mode_settings["speaking_rate"],
            pitch=config.pitch or mode_settings["pitch"],
            warmth=config.warmth or mode_settings["warmth"],
            breathiness=config.breathiness or mode_settings["breathiness"],
            pause_frequency=mode_settings["pause_multiplier"],
            pause_duration=mode_settings["pause_multiplier"],
        )

    def _build_synthesis_request(
        self,
        text: str,
        config: DivineSynthesisConfig,
    ) -> SpeechSynthesisRequest:
        """Build synthesis request from config with gender and natural speech support."""
        # Get mode config with gender selection
        mode_settings = self._get_mode_config(config.mode, config.gender)
        prosody = self._build_prosody(config, mode_settings)

        # Get voice profile based on gender
        profile_id = mode_settings["voice_profile"]
        voice_profile = self._voice_profiles.get(profile_id)

        # Apply natural speech enhancement if enabled
        if config.natural_speech:
            natural_preset = mode_settings.get("natural_preset", "divine_natural")
            enhancement = NATURAL_SPEECH_PRESETS.get(natural_preset)
            if enhancement:
                # Apply natural variations to prosody
                prosody.rhythm_regularity = max(0.4, prosody.rhythm_regularity - enhancement.timing_variation)
                if enhancement.add_breath_sounds:
                    prosody.breathiness = min(0.5, prosody.breathiness + enhancement.breath_intensity * 0.3)

        return SpeechSynthesisRequest(
            text=text,
            language=config.language,
            voice_profile=voice_profile,
            quality_tier=config.quality_tier,
            prosody=prosody,
            emotion=config.emotion,
            emotion_intensity=config.intensity,
            use_ssml=True,
            normalize_audio=True,
            add_silence_padding=config.include_pauses,
            content_type=config.content_type,
            user_id=config.user_id,
            session_id=config.session_id,
            clone_voice=config.use_voice_cloning,
            reference_audio=config.reference_audio,
        )

    async def synthesize_divine(
        self,
        text: str,
        config: Optional[DivineSynthesisConfig] = None,
    ) -> SpeechSynthesisResult:
        """
        Synthesize speech with divine voice quality.

        Uses the world-class speech orchestrator to produce
        the highest quality voice synthesis for KIAAN.

        Args:
            text: Text to synthesize
            config: Optional synthesis configuration

        Returns:
            SpeechSynthesisResult with audio data
        """
        if not self._initialized:
            await self.initialize()

        if not text or not text.strip():
            return SpeechSynthesisResult(
                success=False,
                error_message="Empty text provided"
            )

        # Use default config if not provided
        if config is None:
            config = DivineSynthesisConfig()

        try:
            # Build synthesis request
            request = self._build_synthesis_request(text, config)

            # Use orchestrator for synthesis
            result = await self._orchestrator.synthesize(request)

            # Track metrics
            self._synthesis_count += 1
            if result.success:
                self._total_quality_score += result.quality_score
                provider_name = result.provider_used.value if result.provider_used else "unknown"
                self._provider_usage[provider_name] = self._provider_usage.get(provider_name, 0) + 1

            return result

        except Exception as e:
            logger.error(f"Divine synthesis failed: {e}")
            return SpeechSynthesisResult(
                success=False,
                error_message=str(e)
            )

    async def synthesize_conversation(
        self,
        text: str,
        emotion: str = "peace",
        language: str = "en",
        user_id: Optional[str] = None,
    ) -> SpeechSynthesisResult:
        """
        Synthesize conversational response with natural divine voice.

        Optimized for KIAAN chat responses.

        Args:
            text: Response text
            emotion: Emotional tone
            language: Language code
            user_id: Optional user identifier

        Returns:
            SpeechSynthesisResult
        """
        config = DivineSynthesisConfig(
            mode=DivineVoiceMode.CONVERSATION,
            emotion=emotion,
            language=language,
            user_id=user_id,
            content_type="conversation",
        )
        return await self.synthesize_divine(text, config)

    async def synthesize_meditation(
        self,
        script: str,
        language: str = "en",
        include_long_pauses: bool = True,
    ) -> SpeechSynthesisResult:
        """
        Synthesize guided meditation with deep calm voice.

        Uses the slowest, most serene voice settings.

        Args:
            script: Meditation script
            language: Language code
            include_long_pauses: Add extended pauses

        Returns:
            SpeechSynthesisResult
        """
        config = DivineSynthesisConfig(
            mode=DivineVoiceMode.MEDITATION,
            emotion="peace",
            intensity=0.9,
            language=language,
            include_breathing=True,
            include_pauses=include_long_pauses,
            content_type="meditation",
        )
        return await self.synthesize_divine(script, config)

    async def synthesize_verse(
        self,
        verse_text: str,
        language: str = "en",
        include_sanskrit: bool = False,
        sanskrit_text: Optional[str] = None,
    ) -> SpeechSynthesisResult:
        """
        Synthesize Gita verse with wisdom voice.

        Optimized for reverent, clear recitation.

        Args:
            verse_text: Verse translation
            language: Language code
            include_sanskrit: Include Sanskrit
            sanskrit_text: Sanskrit if including

        Returns:
            SpeechSynthesisResult
        """
        # Combine texts
        full_text = ""
        if include_sanskrit and sanskrit_text:
            full_text += f"{sanskrit_text}... "
        full_text += verse_text

        config = DivineSynthesisConfig(
            mode=DivineVoiceMode.VERSE_RECITATION,
            emotion="wisdom",
            intensity=0.7,
            language=language,
            spiritual_emphasis=True,
            content_type="verse",
        )
        return await self.synthesize_divine(full_text, config)

    async def synthesize_affirmation(
        self,
        affirmation: str,
        language: str = "en",
    ) -> SpeechSynthesisResult:
        """
        Synthesize personal affirmation with warm, encouraging voice.

        Args:
            affirmation: Affirmation text
            language: Language code

        Returns:
            SpeechSynthesisResult
        """
        config = DivineSynthesisConfig(
            mode=DivineVoiceMode.COMPASSIONATE,
            emotion="encouragement",
            intensity=0.8,
            language=language,
            include_breathing=True,
            content_type="affirmation",
        )
        return await self.synthesize_divine(affirmation, config)

    async def synthesize_emotional_support(
        self,
        text: str,
        detected_emotion: str,
        language: str = "en",
        user_id: Optional[str] = None,
    ) -> SpeechSynthesisResult:
        """
        Synthesize emotionally adaptive response.

        Adjusts voice based on user's emotional state.

        Args:
            text: Response text
            detected_emotion: User's detected emotion
            language: Language code
            user_id: Optional user ID

        Returns:
            SpeechSynthesisResult
        """
        # Map user emotion to appropriate voice mode and response emotion
        emotion_mapping = {
            "anxiety": ("compassion", DivineVoiceMode.SERENE, 0.9),
            "sadness": ("compassion", DivineVoiceMode.COMPASSIONATE, 0.85),
            "anger": ("peace", DivineVoiceMode.SERENE, 0.8),
            "fear": ("encouragement", DivineVoiceMode.COMPASSIONATE, 0.85),
            "grief": ("compassion", DivineVoiceMode.COMPASSIONATE, 0.9),
            "joy": ("joy", DivineVoiceMode.CONVERSATION, 0.7),
            "peace": ("peace", DivineVoiceMode.SERENE, 0.7),
            "curiosity": ("wisdom", DivineVoiceMode.WISE, 0.6),
        }

        response_emotion, mode, intensity = emotion_mapping.get(
            detected_emotion,
            ("compassion", DivineVoiceMode.COMPASSIONATE, 0.7)
        )

        config = DivineSynthesisConfig(
            mode=mode,
            emotion=response_emotion,
            intensity=intensity,
            language=language,
            user_id=user_id,
            content_type="emotional_support",
        )
        return await self.synthesize_divine(text, config)

    async def recognize_speech(
        self,
        audio_data: bytes,
        language: str = "en",
        user_id: Optional[str] = None,
    ) -> SpeechRecognitionResult:
        """
        Recognize speech from audio.

        Uses world-class STT providers for accurate transcription.

        Args:
            audio_data: Audio bytes
            language: Expected language
            user_id: Optional user ID

        Returns:
            SpeechRecognitionResult with transcript
        """
        if not self._initialized:
            await self.initialize()

        request = SpeechRecognitionRequest(
            audio_data=audio_data,
            language=language,
            enable_punctuation=True,
            enable_word_timestamps=True,
            user_id=user_id,
        )

        return await self._orchestrator.recognize(request)

    def get_quality_metrics(self) -> Dict[str, Any]:
        """Get quality metrics for the integration."""
        avg_quality = (
            self._total_quality_score / self._synthesis_count
            if self._synthesis_count > 0
            else 0.0
        )

        return {
            "total_syntheses": self._synthesis_count,
            "average_quality_score": avg_quality,
            "provider_usage": self._provider_usage,
            "initialized": self._initialized,
        }

    def get_available_modes(self) -> List[str]:
        """Get list of available voice modes."""
        return [mode.value for mode in DivineVoiceMode]

    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages."""
        if self._orchestrator:
            return self._orchestrator.get_supported_languages()
        return ["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa"]


# Singleton instance
_divine_speech: Optional[DivineSpeechIntegration] = None


def get_divine_speech_integration() -> DivineSpeechIntegration:
    """Get or create divine speech integration singleton."""
    global _divine_speech
    if _divine_speech is None:
        _divine_speech = DivineSpeechIntegration()
    return _divine_speech


async def synthesize_divine_voice(
    text: str,
    emotion: str = "peace",
    language: str = "en",
    mode: str = "conversation",
) -> SpeechSynthesisResult:
    """
    Convenience function for divine voice synthesis.

    Simple API for common synthesis needs.

    Args:
        text: Text to synthesize
        emotion: Emotional tone
        language: Language code
        mode: Voice mode (serene, wise, compassionate, meditation, conversation, verse_recitation)

    Returns:
        SpeechSynthesisResult
    """
    integration = get_divine_speech_integration()

    # Map mode string to enum
    mode_map = {
        "serene": DivineVoiceMode.SERENE,
        "wise": DivineVoiceMode.WISE,
        "compassionate": DivineVoiceMode.COMPASSIONATE,
        "meditation": DivineVoiceMode.MEDITATION,
        "conversation": DivineVoiceMode.CONVERSATION,
        "verse": DivineVoiceMode.VERSE_RECITATION,
    }
    voice_mode = mode_map.get(mode, DivineVoiceMode.CONVERSATION)

    config = DivineSynthesisConfig(
        mode=voice_mode,
        emotion=emotion,
        language=language,
    )

    return await integration.synthesize_divine(text, config)
