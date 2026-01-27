"""
Personalized Voice Adaptation Service

Adapts KIAAN's voice characteristics based on individual user preferences:
- Speaking pace adjustment
- Pitch adjustments for accessibility
- Regional accent preferences
- Energy level matching
- Emotional tone calibration

Features:
- Per-user voice profiles
- Automatic preference learning
- A/B tested voice variations
- Accessibility accommodations
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import asyncio
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class VoiceCharacteristic(Enum):
    """Voice characteristics that can be personalized."""
    SPEAKING_RATE = "speaking_rate"
    PITCH = "pitch"
    PITCH_RANGE = "pitch_range"
    VOLUME = "volume"
    PAUSE_DURATION = "pause_duration"
    EMPHASIS_STRENGTH = "emphasis_strength"
    WARMTH = "warmth"
    ENERGY = "energy"


class AccentPreference(Enum):
    """Regional accent preferences."""
    NEUTRAL = "neutral"
    AMERICAN = "american"
    BRITISH = "british"
    INDIAN = "indian"
    AUSTRALIAN = "australian"


class VoicePersona(Enum):
    """Pre-defined voice personas."""
    CALM_GUIDE = "calm_guide"           # Slow, warm, measured
    ENERGETIC_COACH = "energetic_coach" # Fast, enthusiastic
    WISE_MENTOR = "wise_mentor"         # Slow, deep, thoughtful
    FRIENDLY_COMPANION = "friendly"      # Moderate, warm, conversational
    MEDITATION_GUIDE = "meditation"      # Very slow, soft, peaceful


@dataclass
class VoiceProfile:
    """Complete voice profile for a user."""
    user_id: str
    speaking_rate: float = 1.0  # 0.5 - 2.0, 1.0 = normal
    pitch_adjustment: float = 0.0  # -12 to +12 semitones
    volume_adjustment: float = 0.0  # -10 to +10 dB
    pause_multiplier: float = 1.0  # 0.5 - 2.0
    emphasis_level: float = 1.0  # 0.5 - 1.5
    warmth_level: float = 1.0  # 0.5 - 1.5
    energy_level: float = 1.0  # 0.5 - 1.5
    accent_preference: AccentPreference = AccentPreference.NEUTRAL
    preferred_persona: Optional[VoicePersona] = None
    accessibility_mode: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class VoiceAdaptation:
    """A single voice adaptation to apply."""
    characteristic: VoiceCharacteristic
    value: float
    reason: str
    confidence: float


@dataclass
class AdaptedVoiceSettings:
    """Complete set of adapted voice settings for TTS."""
    speaking_rate: str  # "slow", "medium", "fast" or specific rate
    pitch: str  # SSML pitch value
    volume: str  # SSML volume value
    voice_name: str  # Google TTS voice name
    language_code: str
    ssml_prosody: Dict[str, str]
    effects: List[str]


class VoicePersonalizationService:
    """
    Service for personalizing KIAAN's voice output.

    Learns and adapts voice characteristics based on user preferences,
    feedback, and contextual factors like emotional state and content type.
    """

    def __init__(self):
        self._user_profiles: Dict[str, VoiceProfile] = {}
        self._adaptation_history: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._persona_settings: Dict[VoicePersona, Dict[str, float]] = {}
        self._initialized = False

        # Voice name mappings for different personas and accents
        self._voice_mappings = {
            AccentPreference.NEUTRAL: {
                "male": "en-US-Neural2-D",
                "female": "en-US-Neural2-F",
            },
            AccentPreference.INDIAN: {
                "male": "en-IN-Neural2-B",
                "female": "en-IN-Neural2-A",
            },
            AccentPreference.BRITISH: {
                "male": "en-GB-Neural2-B",
                "female": "en-GB-Neural2-A",
            },
        }

        # Initialize persona settings
        self._initialize_personas()

        logger.info("VoicePersonalizationService initialized")

    def _initialize_personas(self) -> None:
        """Initialize preset persona configurations."""
        self._persona_settings = {
            VoicePersona.CALM_GUIDE: {
                "speaking_rate": 0.85,
                "pitch_adjustment": -2,
                "volume_adjustment": -2,
                "pause_multiplier": 1.3,
                "emphasis_level": 0.8,
                "warmth_level": 1.3,
                "energy_level": 0.7,
            },
            VoicePersona.ENERGETIC_COACH: {
                "speaking_rate": 1.15,
                "pitch_adjustment": 2,
                "volume_adjustment": 2,
                "pause_multiplier": 0.8,
                "emphasis_level": 1.3,
                "warmth_level": 1.1,
                "energy_level": 1.4,
            },
            VoicePersona.WISE_MENTOR: {
                "speaking_rate": 0.8,
                "pitch_adjustment": -4,
                "volume_adjustment": 0,
                "pause_multiplier": 1.5,
                "emphasis_level": 0.9,
                "warmth_level": 1.2,
                "energy_level": 0.6,
            },
            VoicePersona.FRIENDLY_COMPANION: {
                "speaking_rate": 1.0,
                "pitch_adjustment": 0,
                "volume_adjustment": 0,
                "pause_multiplier": 1.0,
                "emphasis_level": 1.0,
                "warmth_level": 1.2,
                "energy_level": 1.0,
            },
            VoicePersona.MEDITATION_GUIDE: {
                "speaking_rate": 0.7,
                "pitch_adjustment": -3,
                "volume_adjustment": -4,
                "pause_multiplier": 2.0,
                "emphasis_level": 0.6,
                "warmth_level": 1.4,
                "energy_level": 0.5,
            },
        }

    async def initialize(self) -> None:
        """Initialize the service."""
        if self._initialized:
            return
        self._initialized = True
        logger.info("VoicePersonalizationService initialized")

    # ==================== Profile Management ====================

    def get_or_create_profile(self, user_id: str) -> VoiceProfile:
        """Get existing profile or create a new one."""
        if user_id not in self._user_profiles:
            self._user_profiles[user_id] = VoiceProfile(user_id=user_id)
            logger.info(f"Created new voice profile for user {user_id}")

        return self._user_profiles[user_id]

    def update_profile(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> VoiceProfile:
        """Update user's voice profile."""
        profile = self.get_or_create_profile(user_id)

        valid_fields = {
            "speaking_rate", "pitch_adjustment", "volume_adjustment",
            "pause_multiplier", "emphasis_level", "warmth_level",
            "energy_level", "accent_preference", "preferred_persona",
            "accessibility_mode"
        }

        for key, value in updates.items():
            if key in valid_fields:
                if key == "accent_preference" and isinstance(value, str):
                    value = AccentPreference(value)
                elif key == "preferred_persona" and isinstance(value, str):
                    value = VoicePersona(value)

                setattr(profile, key, value)

        profile.updated_at = datetime.utcnow()

        # Record in history
        self._adaptation_history[user_id].append({
            "type": "manual_update",
            "updates": updates,
            "timestamp": datetime.utcnow()
        })

        return profile

    def apply_persona(self, user_id: str, persona: VoicePersona) -> VoiceProfile:
        """Apply a preset persona to user's profile."""
        profile = self.get_or_create_profile(user_id)
        settings = self._persona_settings.get(persona, {})

        for key, value in settings.items():
            setattr(profile, key, value)

        profile.preferred_persona = persona
        profile.updated_at = datetime.utcnow()

        return profile

    # ==================== Adaptive Learning ====================

    def learn_from_feedback(
        self,
        user_id: str,
        feedback_type: str,
        context: Dict[str, Any]
    ) -> List[VoiceAdaptation]:
        """
        Learn voice preferences from user feedback.

        Args:
            user_id: User identifier
            feedback_type: Type of feedback ("too_fast", "too_slow", "too_loud", etc.)
            context: Additional context about the feedback
        """
        profile = self.get_or_create_profile(user_id)
        adaptations = []

        # Learning rate - how much to adjust per feedback
        learning_rate = 0.1

        feedback_adaptations = {
            "too_fast": (VoiceCharacteristic.SPEAKING_RATE, -learning_rate),
            "too_slow": (VoiceCharacteristic.SPEAKING_RATE, learning_rate),
            "too_loud": (VoiceCharacteristic.VOLUME, -learning_rate * 2),
            "too_quiet": (VoiceCharacteristic.VOLUME, learning_rate * 2),
            "too_high_pitch": (VoiceCharacteristic.PITCH, -learning_rate * 3),
            "too_low_pitch": (VoiceCharacteristic.PITCH, learning_rate * 3),
            "need_more_pauses": (VoiceCharacteristic.PAUSE_DURATION, learning_rate),
            "too_many_pauses": (VoiceCharacteristic.PAUSE_DURATION, -learning_rate),
            "too_monotone": (VoiceCharacteristic.EMPHASIS_STRENGTH, learning_rate),
            "too_dramatic": (VoiceCharacteristic.EMPHASIS_STRENGTH, -learning_rate),
        }

        if feedback_type in feedback_adaptations:
            characteristic, delta = feedback_adaptations[feedback_type]

            # Apply adaptation with bounds checking
            if characteristic == VoiceCharacteristic.SPEAKING_RATE:
                profile.speaking_rate = max(0.5, min(2.0, profile.speaking_rate + delta))
            elif characteristic == VoiceCharacteristic.VOLUME:
                profile.volume_adjustment = max(-10, min(10, profile.volume_adjustment + delta))
            elif characteristic == VoiceCharacteristic.PITCH:
                profile.pitch_adjustment = max(-12, min(12, profile.pitch_adjustment + delta))
            elif characteristic == VoiceCharacteristic.PAUSE_DURATION:
                profile.pause_multiplier = max(0.5, min(2.0, profile.pause_multiplier + delta))
            elif characteristic == VoiceCharacteristic.EMPHASIS_STRENGTH:
                profile.emphasis_level = max(0.5, min(1.5, profile.emphasis_level + delta))

            adaptations.append(VoiceAdaptation(
                characteristic=characteristic,
                value=delta,
                reason=f"User feedback: {feedback_type}",
                confidence=0.8
            ))

        profile.updated_at = datetime.utcnow()

        # Record adaptation
        self._adaptation_history[user_id].append({
            "type": "feedback_adaptation",
            "feedback_type": feedback_type,
            "adaptations": [
                {"characteristic": a.characteristic.value, "value": a.value}
                for a in adaptations
            ],
            "timestamp": datetime.utcnow()
        })

        return adaptations

    def adapt_to_emotion(
        self,
        user_id: str,
        emotion: str,
        intensity: float
    ) -> List[VoiceAdaptation]:
        """
        Adapt voice based on detected user emotion.

        For example, if user is anxious, speak more slowly and calmly.
        """
        adaptations = []

        # Emotion-based voice adaptations
        emotion_adaptations = {
            "anxiety": {
                VoiceCharacteristic.SPEAKING_RATE: -0.15,
                VoiceCharacteristic.VOLUME: -0.1,
                VoiceCharacteristic.WARMTH: 0.2,
                VoiceCharacteristic.PAUSE_DURATION: 0.2,
            },
            "sadness": {
                VoiceCharacteristic.WARMTH: 0.3,
                VoiceCharacteristic.ENERGY: -0.2,
                VoiceCharacteristic.PAUSE_DURATION: 0.15,
            },
            "anger": {
                VoiceCharacteristic.SPEAKING_RATE: -0.1,
                VoiceCharacteristic.WARMTH: 0.2,
                VoiceCharacteristic.ENERGY: -0.15,
            },
            "joy": {
                VoiceCharacteristic.ENERGY: 0.15,
                VoiceCharacteristic.WARMTH: 0.1,
            },
            "serenity": {
                # Maintain calm state
                VoiceCharacteristic.SPEAKING_RATE: -0.05,
                VoiceCharacteristic.WARMTH: 0.1,
            },
        }

        if emotion in emotion_adaptations:
            for characteristic, base_delta in emotion_adaptations[emotion].items():
                # Scale by intensity
                delta = base_delta * intensity

                adaptations.append(VoiceAdaptation(
                    characteristic=characteristic,
                    value=delta,
                    reason=f"Emotion adaptation for {emotion}",
                    confidence=intensity
                ))

        return adaptations

    def adapt_to_content(
        self,
        content_type: str,
        content_length: int
    ) -> List[VoiceAdaptation]:
        """
        Adapt voice based on content type and length.

        For example, meditation content should be slower than informational.
        """
        adaptations = []

        content_adaptations = {
            "meditation": {
                VoiceCharacteristic.SPEAKING_RATE: -0.3,
                VoiceCharacteristic.VOLUME: -0.2,
                VoiceCharacteristic.PAUSE_DURATION: 0.5,
                VoiceCharacteristic.ENERGY: -0.3,
            },
            "verse": {
                VoiceCharacteristic.SPEAKING_RATE: -0.15,
                VoiceCharacteristic.EMPHASIS_STRENGTH: 0.2,
                VoiceCharacteristic.PAUSE_DURATION: 0.2,
            },
            "insight": {
                VoiceCharacteristic.WARMTH: 0.1,
                VoiceCharacteristic.EMPHASIS_STRENGTH: 0.1,
            },
            "greeting": {
                VoiceCharacteristic.WARMTH: 0.2,
                VoiceCharacteristic.ENERGY: 0.1,
            },
            "long_response": {
                # For long content, slightly faster to maintain engagement
                VoiceCharacteristic.SPEAKING_RATE: 0.05,
                VoiceCharacteristic.PAUSE_DURATION: -0.1,
            },
        }

        if content_type in content_adaptations:
            for characteristic, delta in content_adaptations[content_type].items():
                adaptations.append(VoiceAdaptation(
                    characteristic=characteristic,
                    value=delta,
                    reason=f"Content type: {content_type}",
                    confidence=0.7
                ))

        # Adjust for content length
        if content_length > 500:  # Long content
            for char, delta in content_adaptations.get("long_response", {}).items():
                adaptations.append(VoiceAdaptation(
                    characteristic=char,
                    value=delta,
                    reason="Long content adjustment",
                    confidence=0.5
                ))

        return adaptations

    # ==================== Voice Settings Generation ====================

    def generate_voice_settings(
        self,
        user_id: str,
        context_adaptations: Optional[List[VoiceAdaptation]] = None,
        gender_preference: str = "female"
    ) -> AdaptedVoiceSettings:
        """
        Generate complete voice settings for TTS.

        Combines user profile with context-specific adaptations.
        """
        profile = self.get_or_create_profile(user_id)

        # Start with profile settings
        rate = profile.speaking_rate
        pitch = profile.pitch_adjustment
        volume = profile.volume_adjustment
        pause = profile.pause_multiplier
        emphasis = profile.emphasis_level
        warmth = profile.warmth_level
        energy = profile.energy_level

        # Apply context adaptations
        if context_adaptations:
            for adaptation in context_adaptations:
                if adaptation.characteristic == VoiceCharacteristic.SPEAKING_RATE:
                    rate += adaptation.value
                elif adaptation.characteristic == VoiceCharacteristic.PITCH:
                    pitch += adaptation.value
                elif adaptation.characteristic == VoiceCharacteristic.VOLUME:
                    volume += adaptation.value
                elif adaptation.characteristic == VoiceCharacteristic.PAUSE_DURATION:
                    pause += adaptation.value
                elif adaptation.characteristic == VoiceCharacteristic.EMPHASIS_STRENGTH:
                    emphasis += adaptation.value
                elif adaptation.characteristic == VoiceCharacteristic.WARMTH:
                    warmth += adaptation.value
                elif adaptation.characteristic == VoiceCharacteristic.ENERGY:
                    energy += adaptation.value

        # Clamp values to valid ranges
        rate = max(0.5, min(2.0, rate))
        pitch = max(-12, min(12, pitch))
        volume = max(-10, min(10, volume))
        pause = max(0.5, min(2.0, pause))

        # Convert to SSML values
        rate_str = self._rate_to_ssml(rate)
        pitch_str = self._pitch_to_ssml(pitch)
        volume_str = self._volume_to_ssml(volume)

        # Select voice based on accent and gender
        voice_name = self._select_voice(profile.accent_preference, gender_preference)

        # Build effects list
        effects = []
        if profile.accessibility_mode:
            effects.append("enhanced_clarity")
        if warmth > 1.2:
            effects.append("warm_filter")
        if energy < 0.7:
            effects.append("calm_filter")

        return AdaptedVoiceSettings(
            speaking_rate=rate_str,
            pitch=pitch_str,
            volume=volume_str,
            voice_name=voice_name,
            language_code="en-US" if profile.accent_preference != AccentPreference.INDIAN else "en-IN",
            ssml_prosody={
                "rate": rate_str,
                "pitch": pitch_str,
                "volume": volume_str,
            },
            effects=effects
        )

    def _rate_to_ssml(self, rate: float) -> str:
        """Convert rate multiplier to SSML value."""
        if rate < 0.7:
            return "x-slow"
        elif rate < 0.9:
            return "slow"
        elif rate < 1.1:
            return "medium"
        elif rate < 1.3:
            return "fast"
        else:
            return "x-fast"

    def _pitch_to_ssml(self, semitones: float) -> str:
        """Convert pitch adjustment to SSML value."""
        if semitones == 0:
            return "medium"
        elif semitones > 0:
            return f"+{semitones:.0f}st"
        else:
            return f"{semitones:.0f}st"

    def _volume_to_ssml(self, db: float) -> str:
        """Convert volume adjustment to SSML value."""
        if db < -6:
            return "x-soft"
        elif db < -2:
            return "soft"
        elif db < 2:
            return "medium"
        elif db < 6:
            return "loud"
        else:
            return "x-loud"

    def _select_voice(
        self,
        accent: AccentPreference,
        gender: str
    ) -> str:
        """Select appropriate voice based on preferences."""
        accent_voices = self._voice_mappings.get(
            accent,
            self._voice_mappings[AccentPreference.NEUTRAL]
        )

        return accent_voices.get(gender, accent_voices.get("female"))

    # ==================== Analytics ====================

    def get_profile_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics about user's voice preferences."""
        history = self._adaptation_history.get(user_id, [])
        profile = self.get_or_create_profile(user_id)

        # Analyze adaptation history
        feedback_counts = defaultdict(int)
        for entry in history:
            if entry.get("type") == "feedback_adaptation":
                feedback_counts[entry.get("feedback_type", "unknown")] += 1

        return {
            "profile_age_days": (datetime.utcnow() - profile.created_at).days,
            "total_adaptations": len(history),
            "feedback_breakdown": dict(feedback_counts),
            "current_settings": {
                "speaking_rate": profile.speaking_rate,
                "pitch_adjustment": profile.pitch_adjustment,
                "volume_adjustment": profile.volume_adjustment,
                "preferred_persona": profile.preferred_persona.value if profile.preferred_persona else None,
                "accent_preference": profile.accent_preference.value,
            },
            "deviations_from_default": {
                "speaking_rate": profile.speaking_rate - 1.0,
                "pitch": profile.pitch_adjustment,
                "volume": profile.volume_adjustment,
            }
        }


# Singleton instance
_personalization_instance: Optional[VoicePersonalizationService] = None


def get_voice_personalization_service() -> VoicePersonalizationService:
    """Get the singleton voice personalization service instance."""
    global _personalization_instance
    if _personalization_instance is None:
        _personalization_instance = VoicePersonalizationService()
    return _personalization_instance
