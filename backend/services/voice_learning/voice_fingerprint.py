"""
Voice Fingerprint Service - Consistent Voice Identity Per User

Provides voice fingerprinting and consistency features:
- Unique voice identity per user across sessions
- Voice preference learning from interactions
- Quality-based voice selection
- Provider failover with consistency

This ensures KIAAN maintains the same "voice personality" for each user,
similar to how Siri/Alexa maintain consistent voice identity.
"""

import logging
import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
from enum import Enum
import asyncio

logger = logging.getLogger(__name__)


class VoiceProvider(str, Enum):
    """Available TTS providers."""
    SARVAM = "sarvam"
    BHASHINI = "bhashini"
    ELEVENLABS = "elevenlabs"


@dataclass
class VoiceFingerprint:
    """
    Unique voice configuration for a user.

    This captures all settings needed to reproduce the exact same voice
    experience across sessions.
    """
    # Core identity
    user_id: str
    fingerprint_id: str  # Unique hash of voice configuration

    # Primary voice settings
    provider: VoiceProvider
    voice_name: str  # e.g., "en-US-Studio-O"
    language: str = "en"
    voice_type: str = "friendly"  # calm, wisdom, friendly

    # Prosody settings (learned/preferred)
    speaking_rate: float = 0.95
    pitch: float = 0.0
    volume: float = 1.0

    # Emotion adaptation settings
    emotion_adaptation_enabled: bool = True
    emotion_intensity_multiplier: float = 1.0

    # Quality metrics
    quality_score: float = 1.0  # 0-1, updated based on user feedback
    usage_count: int = 0
    last_used: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)

    # Backup voices (for failover)
    fallback_voices: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.fingerprint_id:
            self.fingerprint_id = self._generate_fingerprint_id()

    def _generate_fingerprint_id(self) -> str:
        """Generate unique fingerprint ID from voice settings."""
        content = f"{self.user_id}:{self.provider}:{self.voice_name}:{self.language}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def to_dict(self) -> Dict:
        """Convert to dictionary for storage/API."""
        return {
            "user_id": self.user_id,
            "fingerprint_id": self.fingerprint_id,
            "provider": self.provider.value,
            "voice_name": self.voice_name,
            "language": self.language,
            "voice_type": self.voice_type,
            "speaking_rate": self.speaking_rate,
            "pitch": self.pitch,
            "volume": self.volume,
            "emotion_adaptation_enabled": self.emotion_adaptation_enabled,
            "emotion_intensity_multiplier": self.emotion_intensity_multiplier,
            "quality_score": self.quality_score,
            "usage_count": self.usage_count,
            "last_used": self.last_used.isoformat(),
            "created_at": self.created_at.isoformat(),
            "fallback_voices": self.fallback_voices,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "VoiceFingerprint":
        """Create from dictionary."""
        return cls(
            user_id=data["user_id"],
            fingerprint_id=data.get("fingerprint_id", ""),
            provider=VoiceProvider(data.get("provider", "sarvam")),
            voice_name=data.get("voice_name", "anushka"),
            language=data.get("language", "en"),
            voice_type=data.get("voice_type", "friendly"),
            speaking_rate=data.get("speaking_rate", 0.95),
            pitch=data.get("pitch", 0.0),
            volume=data.get("volume", 1.0),
            emotion_adaptation_enabled=data.get("emotion_adaptation_enabled", True),
            emotion_intensity_multiplier=data.get("emotion_intensity_multiplier", 1.0),
            quality_score=data.get("quality_score", 1.0),
            usage_count=data.get("usage_count", 0),
            last_used=datetime.fromisoformat(data["last_used"]) if "last_used" in data else datetime.utcnow(),
            created_at=datetime.fromisoformat(data["created_at"]) if "created_at" in data else datetime.utcnow(),
            fallback_voices=data.get("fallback_voices", []),
        )


@dataclass
class UserVoiceProfile:
    """
    Complete voice profile for a user, including preferences and history.
    """
    user_id: str
    primary_fingerprint: Optional[VoiceFingerprint] = None
    language_fingerprints: Dict[str, VoiceFingerprint] = field(default_factory=dict)

    # Preference signals
    preferred_gender: str = "female"  # male, female, neutral
    preferred_accent: str = "neutral"
    preferred_speed: str = "normal"  # slow, normal, fast

    # Interaction history for learning
    voice_ratings: List[Tuple[str, float, datetime]] = field(default_factory=list)  # (fingerprint_id, rating, timestamp)
    voice_skips: List[Tuple[str, datetime]] = field(default_factory=list)  # (fingerprint_id, timestamp)
    voice_replays: List[Tuple[str, datetime]] = field(default_factory=list)  # (fingerprint_id, timestamp)

    # Context-based preferences
    context_preferences: Dict[str, str] = field(default_factory=dict)  # context -> fingerprint_id

    def get_fingerprint_for_language(self, language: str) -> Optional[VoiceFingerprint]:
        """Get fingerprint for specific language, or primary if not set."""
        return self.language_fingerprints.get(language, self.primary_fingerprint)

    def record_rating(self, fingerprint_id: str, rating: float) -> None:
        """Record a voice rating signal."""
        self.voice_ratings.append((fingerprint_id, rating, datetime.utcnow()))
        # Keep last 100 ratings
        if len(self.voice_ratings) > 100:
            self.voice_ratings = self.voice_ratings[-100:]

    def record_skip(self, fingerprint_id: str) -> None:
        """Record when user skips/stops audio."""
        self.voice_skips.append((fingerprint_id, datetime.utcnow()))
        if len(self.voice_skips) > 50:
            self.voice_skips = self.voice_skips[-50:]

    def record_replay(self, fingerprint_id: str) -> None:
        """Record when user replays audio."""
        self.voice_replays.append((fingerprint_id, datetime.utcnow()))
        if len(self.voice_replays) > 50:
            self.voice_replays = self.voice_replays[-50:]

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "user_id": self.user_id,
            "primary_fingerprint": self.primary_fingerprint.to_dict() if self.primary_fingerprint else None,
            "language_fingerprints": {
                lang: fp.to_dict() for lang, fp in self.language_fingerprints.items()
            },
            "preferred_gender": self.preferred_gender,
            "preferred_accent": self.preferred_accent,
            "preferred_speed": self.preferred_speed,
            "context_preferences": self.context_preferences,
        }


class VoiceFingerprintService:
    """
    Service for managing voice fingerprints and ensuring consistency.

    Features:
    - Create and store voice fingerprints per user
    - Ensure same voice across sessions
    - Learn from user interactions
    - Quality-based voice selection
    - Graceful failover with consistency
    """

    # Default voice configurations per language
    DEFAULT_VOICES = {
        "en": {
            "female": {
                "provider": VoiceProvider.GOOGLE_NEURAL2,
                "voice_name": "en-US-Neural2-F",
                "fallbacks": ["en-US-AvaNeural", "en-US-AriaNeural"]
            },
            "male": {
                "provider": VoiceProvider.GOOGLE_NEURAL2,
                "voice_name": "en-US-Neural2-D",
                "fallbacks": ["en-US-AndrewNeural", "en-US-GuyNeural"]
            }
        },
        "hi": {
            "female": {
                "provider": VoiceProvider.GOOGLE_NEURAL2,
                "voice_name": "hi-IN-Neural2-A",
                "fallbacks": ["hi-IN-SwaraNeural"]
            },
            "male": {
                "provider": VoiceProvider.GOOGLE_NEURAL2,
                "voice_name": "hi-IN-Neural2-B",
                "fallbacks": ["hi-IN-MadhurNeural"]
            }
        },
        "ta": {
            "female": {
                "provider": VoiceProvider.GOOGLE_NEURAL2,
                "voice_name": "ta-IN-Neural2-A",
                "fallbacks": ["ta-IN-PallaviNeural"]
            },
            "male": {
                "provider": VoiceProvider.GOOGLE_NEURAL2,
                "voice_name": "ta-IN-Neural2-B",
                "fallbacks": ["ta-IN-ValluvarNeural"]
            }
        },
    }

    # Speed presets
    SPEED_PRESETS = {
        "slow": 0.85,
        "normal": 0.95,
        "fast": 1.1
    }

    def __init__(self, redis_client=None, db_session=None):
        """
        Initialize voice fingerprint service.

        Args:
            redis_client: Redis client for caching
            db_session: Database session for persistence
        """
        self.redis_client = redis_client
        self.db_session = db_session
        self._user_profiles: Dict[str, UserVoiceProfile] = {}
        self._fingerprint_quality: Dict[str, float] = {}

    async def get_or_create_fingerprint(
        self,
        user_id: str,
        language: str = "en",
        voice_type: str = "friendly",
        preferred_gender: str = "female"
    ) -> VoiceFingerprint:
        """
        Get existing fingerprint for user or create new one.

        This is the main method to ensure voice consistency. Always call this
        to get the voice configuration for a user.

        Args:
            user_id: User identifier
            language: Language code
            voice_type: Voice type (calm, wisdom, friendly)
            preferred_gender: Preferred voice gender

        Returns:
            VoiceFingerprint for the user
        """
        # Try to get existing profile
        profile = await self._get_user_profile(user_id)

        if profile:
            # Check if we have fingerprint for this language
            fingerprint = profile.get_fingerprint_for_language(language)
            if fingerprint:
                fingerprint.usage_count += 1
                fingerprint.last_used = datetime.utcnow()
                await self._save_user_profile(profile)
                return fingerprint

        # Create new fingerprint
        fingerprint = await self._create_fingerprint(
            user_id=user_id,
            language=language,
            voice_type=voice_type,
            preferred_gender=preferred_gender
        )

        # Update or create profile
        if not profile:
            profile = UserVoiceProfile(user_id=user_id)

        profile.language_fingerprints[language] = fingerprint
        if profile.primary_fingerprint is None:
            profile.primary_fingerprint = fingerprint

        await self._save_user_profile(profile)

        return fingerprint

    async def _create_fingerprint(
        self,
        user_id: str,
        language: str,
        voice_type: str,
        preferred_gender: str
    ) -> VoiceFingerprint:
        """Create a new voice fingerprint."""
        # Get voice config for language and gender
        lang_voices = self.DEFAULT_VOICES.get(language, self.DEFAULT_VOICES["en"])
        voice_config = lang_voices.get(preferred_gender, lang_voices.get("female"))

        # Get speed based on voice type
        speed = {
            "calm": 0.90,
            "wisdom": 0.92,
            "friendly": 0.95
        }.get(voice_type, 0.95)

        # Get pitch based on voice type
        pitch = {
            "calm": -0.5,
            "wisdom": -0.3,
            "friendly": 0.2
        }.get(voice_type, 0.0)

        fingerprint = VoiceFingerprint(
            user_id=user_id,
            fingerprint_id="",  # Will be generated
            provider=voice_config["provider"],
            voice_name=voice_config["voice_name"],
            language=language,
            voice_type=voice_type,
            speaking_rate=speed,
            pitch=pitch,
            fallback_voices=voice_config.get("fallbacks", [])
        )

        logger.info(f"Created voice fingerprint for user {user_id}: {fingerprint.fingerprint_id}")
        return fingerprint

    async def _get_user_profile(self, user_id: str) -> Optional[UserVoiceProfile]:
        """Get user's voice profile from cache or storage."""
        # Check memory cache first
        if user_id in self._user_profiles:
            return self._user_profiles[user_id]

        # Try Redis cache
        if self.redis_client:
            try:
                cached = self.redis_client.get(f"voice_profile:{user_id}")
                if cached:
                    data = json.loads(cached)
                    profile = self._profile_from_dict(data)
                    self._user_profiles[user_id] = profile
                    return profile
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")

        # TODO: Load from database if needed

        return None

    async def _save_user_profile(self, profile: UserVoiceProfile) -> None:
        """Save user's voice profile to cache and storage."""
        # Update memory cache
        self._user_profiles[profile.user_id] = profile

        # Save to Redis
        if self.redis_client:
            try:
                data = profile.to_dict()
                self.redis_client.setex(
                    f"voice_profile:{profile.user_id}",
                    86400 * 30,  # 30 days
                    json.dumps(data)
                )
            except Exception as e:
                logger.warning(f"Redis save failed: {e}")

        # TODO: Save to database for persistence

    def _profile_from_dict(self, data: Dict) -> UserVoiceProfile:
        """Create UserVoiceProfile from dictionary."""
        profile = UserVoiceProfile(user_id=data["user_id"])

        if data.get("primary_fingerprint"):
            profile.primary_fingerprint = VoiceFingerprint.from_dict(data["primary_fingerprint"])

        for lang, fp_data in data.get("language_fingerprints", {}).items():
            profile.language_fingerprints[lang] = VoiceFingerprint.from_dict(fp_data)

        profile.preferred_gender = data.get("preferred_gender", "female")
        profile.preferred_accent = data.get("preferred_accent", "neutral")
        profile.preferred_speed = data.get("preferred_speed", "normal")
        profile.context_preferences = data.get("context_preferences", {})

        return profile

    async def record_voice_interaction(
        self,
        user_id: str,
        fingerprint_id: str,
        interaction_type: str,  # "rating", "skip", "replay", "complete"
        value: Optional[float] = None
    ) -> None:
        """
        Record user interaction with voice output.

        This is used to learn user preferences over time.

        Args:
            user_id: User identifier
            fingerprint_id: Fingerprint that was used
            interaction_type: Type of interaction
            value: Optional value (e.g., rating 1-5)
        """
        profile = await self._get_user_profile(user_id)
        if not profile:
            return

        if interaction_type == "rating" and value is not None:
            profile.record_rating(fingerprint_id, value)
            # Update quality score
            await self._update_quality_score(fingerprint_id, value)

        elif interaction_type == "skip":
            profile.record_skip(fingerprint_id)
            # Slight quality decrease for skips
            await self._update_quality_score(fingerprint_id, -0.1)

        elif interaction_type == "replay":
            profile.record_replay(fingerprint_id)
            # Replays indicate good quality
            await self._update_quality_score(fingerprint_id, 0.1)

        elif interaction_type == "complete":
            # Completion is positive signal
            await self._update_quality_score(fingerprint_id, 0.05)

        await self._save_user_profile(profile)

    async def _update_quality_score(self, fingerprint_id: str, delta: float) -> None:
        """Update quality score for a fingerprint."""
        current = self._fingerprint_quality.get(fingerprint_id, 1.0)
        new_score = max(0.0, min(1.0, current + delta * 0.1))  # Gradual changes
        self._fingerprint_quality[fingerprint_id] = new_score

    async def get_best_voice_for_context(
        self,
        user_id: str,
        context: str,
        language: str = "en"
    ) -> VoiceFingerprint:
        """
        Get the best voice for a specific context.

        Different contexts may prefer different voices:
        - "meditation": calm voice
        - "crisis": compassionate voice
        - "learning": clear wisdom voice
        - "casual": friendly voice

        Args:
            user_id: User identifier
            context: Context type
            language: Language code

        Returns:
            Best VoiceFingerprint for the context
        """
        profile = await self._get_user_profile(user_id)

        # Check if user has context preference
        if profile and context in profile.context_preferences:
            fp_id = profile.context_preferences[context]
            # Find the fingerprint
            for lang, fp in profile.language_fingerprints.items():
                if fp.fingerprint_id == fp_id and lang == language:
                    return fp

        # Map context to voice type
        context_voice_map = {
            "meditation": "calm",
            "crisis": "calm",
            "anxiety": "calm",
            "learning": "wisdom",
            "verse": "wisdom",
            "gita": "wisdom",
            "casual": "friendly",
            "greeting": "friendly",
            "general": "friendly",
        }

        voice_type = context_voice_map.get(context, "friendly")

        return await self.get_or_create_fingerprint(
            user_id=user_id,
            language=language,
            voice_type=voice_type,
            preferred_gender=profile.preferred_gender if profile else "female"
        )

    async def update_preference(
        self,
        user_id: str,
        preference_type: str,
        value: str
    ) -> None:
        """
        Update user's voice preference.

        Args:
            user_id: User identifier
            preference_type: Type of preference (gender, accent, speed)
            value: New preference value
        """
        profile = await self._get_user_profile(user_id)
        if not profile:
            profile = UserVoiceProfile(user_id=user_id)

        if preference_type == "gender":
            profile.preferred_gender = value
        elif preference_type == "accent":
            profile.preferred_accent = value
        elif preference_type == "speed":
            profile.preferred_speed = value
            # Update speaking rate in all fingerprints
            speed = self.SPEED_PRESETS.get(value, 0.95)
            for fp in profile.language_fingerprints.values():
                fp.speaking_rate = speed
            if profile.primary_fingerprint:
                profile.primary_fingerprint.speaking_rate = speed

        await self._save_user_profile(profile)

    def get_voice_settings(self, fingerprint: VoiceFingerprint) -> Dict:
        """
        Get TTS-ready voice settings from fingerprint.

        Returns:
            Dict with settings for TTS service
        """
        return {
            "voice_name": fingerprint.voice_name,
            "language": fingerprint.language,
            "voice_type": fingerprint.voice_type,
            "speed": fingerprint.speaking_rate,
            "pitch": fingerprint.pitch,
            "volume": fingerprint.volume,
            "provider": fingerprint.provider.value,
            "fallbacks": fingerprint.fallback_voices,
            "emotion_adaptation": fingerprint.emotion_adaptation_enabled,
            "emotion_intensity": fingerprint.emotion_intensity_multiplier,
        }


# Singleton instance
_fingerprint_service: Optional[VoiceFingerprintService] = None


def get_voice_fingerprint_service(
    redis_client=None,
    db_session=None
) -> VoiceFingerprintService:
    """Get singleton voice fingerprint service."""
    global _fingerprint_service
    if _fingerprint_service is None:
        _fingerprint_service = VoiceFingerprintService(redis_client, db_session)
    return _fingerprint_service
