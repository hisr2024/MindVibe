"""
User Preference Learning Service - Behavioral Preference Learning

Learns user preferences from implicit and explicit signals:
- Which responses get positive ratings
- Audio playback patterns (skips, replays, completions)
- Time spent on different content
- Context-specific preferences

This enables KIAAN to personalize like Siri/Alexa without explicit configuration.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Tuple
from enum import Enum
import json

logger = logging.getLogger(__name__)


class SignalType(str, Enum):
    """Types of preference signals."""
    # Explicit signals
    RATING = "rating"  # User rating (1-5)
    FEEDBACK = "feedback"  # Explicit feedback text
    PREFERENCE_SET = "preference_set"  # User changed setting

    # Implicit signals
    COMPLETION = "completion"  # Listened to entire response
    SKIP = "skip"  # Skipped response
    REPLAY = "replay"  # Replayed response
    PAUSE = "pause"  # Paused response
    SPEED_CHANGE = "speed_change"  # Changed playback speed
    DWELL_TIME = "dwell_time"  # Time spent on content
    FOLLOW_UP = "follow_up"  # Asked follow-up question
    SESSION_LENGTH = "session_length"  # How long they stayed

    # Engagement signals
    RETURN_VISIT = "return_visit"  # Came back within 24h
    STREAK = "streak"  # Consecutive day usage
    SHARE = "share"  # Shared content
    SAVE = "save"  # Saved to reflections


class PreferenceCategory(str, Enum):
    """Categories of preferences."""
    VOICE = "voice"
    RESPONSE_STYLE = "response_style"
    CONTENT = "content"
    TIMING = "timing"
    INTERACTION = "interaction"


@dataclass
class PreferenceSignal:
    """A signal about user preference."""
    user_id: str
    signal_type: SignalType
    category: PreferenceCategory
    value: float  # Normalized -1 to 1 or 0 to 1
    context: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "signal_type": self.signal_type.value,
            "category": self.category.value,
            "value": self.value,
            "context": self.context,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class LearnedPreference:
    """A learned preference with confidence."""
    preference_key: str
    preferred_value: Any
    confidence: float  # 0-1
    signal_count: int
    last_updated: datetime = field(default_factory=datetime.utcnow)
    decay_rate: float = 0.95  # How fast preference fades

    def to_dict(self) -> Dict:
        return {
            "preference_key": self.preference_key,
            "preferred_value": self.preferred_value,
            "confidence": round(self.confidence, 3),
            "signal_count": self.signal_count,
            "last_updated": self.last_updated.isoformat(),
        }


class UserPreferenceLearningService:
    """
    Service for learning user preferences from behavior.

    Features:
    - Track implicit signals (skips, replays, completions)
    - Learn optimal settings per user
    - Context-aware preference learning
    - Preference decay over time
    - Confidence-based personalization
    """

    # Signal weights for learning
    SIGNAL_WEIGHTS = {
        SignalType.RATING: 1.0,  # Strongest signal
        SignalType.FEEDBACK: 0.9,
        SignalType.PREFERENCE_SET: 0.95,
        SignalType.COMPLETION: 0.3,
        SignalType.SKIP: -0.5,
        SignalType.REPLAY: 0.6,
        SignalType.PAUSE: 0.0,  # Neutral
        SignalType.SPEED_CHANGE: 0.2,
        SignalType.DWELL_TIME: 0.4,
        SignalType.FOLLOW_UP: 0.5,
        SignalType.SESSION_LENGTH: 0.3,
        SignalType.RETURN_VISIT: 0.4,
        SignalType.STREAK: 0.5,
        SignalType.SHARE: 0.7,
        SignalType.SAVE: 0.6,
    }

    # Learnable preferences with defaults
    LEARNABLE_PREFERENCES = {
        # Voice preferences
        "voice.speaking_rate": {"default": 0.95, "min": 0.7, "max": 1.2},
        "voice.pitch": {"default": 0.0, "min": -2.0, "max": 2.0},
        "voice.emotion_intensity": {"default": 1.0, "min": 0.5, "max": 1.5},

        # Response preferences
        "response.length": {"default": "medium", "options": ["short", "medium", "long"]},
        "response.formality": {"default": "warm", "options": ["formal", "warm", "casual"]},
        "response.verse_frequency": {"default": "moderate", "options": ["rare", "moderate", "frequent"]},

        # Content preferences
        "content.depth": {"default": "balanced", "options": ["surface", "balanced", "deep"]},
        "content.practical_vs_philosophical": {"default": 0.5, "min": 0.0, "max": 1.0},
        "content.preferred_topics": {"default": [], "type": "list"},

        # Timing preferences
        "timing.preferred_session_length": {"default": 10, "min": 2, "max": 30},
        "timing.notification_time": {"default": "morning", "options": ["morning", "afternoon", "evening"]},

        # Interaction preferences
        "interaction.auto_play_audio": {"default": True, "type": "boolean"},
        "interaction.show_verses": {"default": True, "type": "boolean"},
    }

    def __init__(self, redis_client=None):
        """Initialize preference learning service."""
        self.redis_client = redis_client
        self._user_signals: Dict[str, List[PreferenceSignal]] = {}
        self._user_preferences: Dict[str, Dict[str, LearnedPreference]] = {}

    async def record_signal(
        self,
        user_id: str,
        signal_type: SignalType,
        value: Optional[float] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Record a preference signal from user behavior.

        Args:
            user_id: User identifier
            signal_type: Type of signal
            value: Optional explicit value (e.g., rating 1-5)
            context: Additional context (e.g., what content, settings used)
        """
        # Normalize value
        if value is None:
            value = self.SIGNAL_WEIGHTS.get(signal_type, 0.0)
        elif signal_type == SignalType.RATING:
            # Normalize 1-5 to -1 to 1
            value = (value - 3) / 2

        # Determine category
        category = self._categorize_signal(signal_type, context)

        signal = PreferenceSignal(
            user_id=user_id,
            signal_type=signal_type,
            category=category,
            value=value,
            context=context or {}
        )

        # Store signal
        if user_id not in self._user_signals:
            self._user_signals[user_id] = []
        self._user_signals[user_id].append(signal)

        # Keep last 500 signals per user
        if len(self._user_signals[user_id]) > 500:
            self._user_signals[user_id] = self._user_signals[user_id][-500:]

        # Update learned preferences
        await self._update_preferences(user_id, signal)

        logger.debug(f"Recorded signal for {user_id}: {signal_type.value} = {value}")

    def _categorize_signal(
        self,
        signal_type: SignalType,
        context: Optional[Dict]
    ) -> PreferenceCategory:
        """Categorize a signal for preference learning."""
        voice_signals = {
            SignalType.SPEED_CHANGE,
            SignalType.SKIP,
            SignalType.REPLAY,
            SignalType.COMPLETION,
        }
        content_signals = {
            SignalType.FOLLOW_UP,
            SignalType.SAVE,
            SignalType.SHARE,
        }
        timing_signals = {
            SignalType.SESSION_LENGTH,
            SignalType.DWELL_TIME,
        }
        interaction_signals = {
            SignalType.PAUSE,
            SignalType.RETURN_VISIT,
            SignalType.STREAK,
        }

        if signal_type in voice_signals:
            return PreferenceCategory.VOICE
        elif signal_type in content_signals:
            return PreferenceCategory.CONTENT
        elif signal_type in timing_signals:
            return PreferenceCategory.TIMING
        elif signal_type in interaction_signals:
            return PreferenceCategory.INTERACTION
        else:
            return PreferenceCategory.RESPONSE_STYLE

    async def _update_preferences(
        self,
        user_id: str,
        signal: PreferenceSignal
    ) -> None:
        """Update learned preferences based on new signal."""
        if user_id not in self._user_preferences:
            self._user_preferences[user_id] = {}

        # Determine which preferences this signal affects
        affected_prefs = self._get_affected_preferences(signal)

        for pref_key, adjustment in affected_prefs.items():
            if pref_key not in self._user_preferences[user_id]:
                default = self.LEARNABLE_PREFERENCES.get(pref_key, {}).get("default")
                self._user_preferences[user_id][pref_key] = LearnedPreference(
                    preference_key=pref_key,
                    preferred_value=default,
                    confidence=0.0,
                    signal_count=0
                )

            pref = self._user_preferences[user_id][pref_key]

            # Update preference value
            weight = self.SIGNAL_WEIGHTS.get(signal.signal_type, 0.0)
            learning_rate = 0.1  # How fast to learn

            if isinstance(pref.preferred_value, (int, float)):
                # Numeric preference - adjust based on signal
                new_value = pref.preferred_value + adjustment * weight * learning_rate
                pref_config = self.LEARNABLE_PREFERENCES.get(pref_key, {})
                min_val = pref_config.get("min", float("-inf"))
                max_val = pref_config.get("max", float("inf"))
                pref.preferred_value = max(min_val, min(max_val, new_value))

            # Update confidence
            pref.signal_count += 1
            # Confidence grows with more signals, capped at 0.95
            pref.confidence = min(0.95, pref.signal_count / 50)
            pref.last_updated = datetime.utcnow()

    def _get_affected_preferences(
        self,
        signal: PreferenceSignal
    ) -> Dict[str, float]:
        """Get preferences affected by a signal and adjustment amount."""
        affected = {}

        # Voice signals
        if signal.signal_type == SignalType.SPEED_CHANGE:
            speed_delta = signal.context.get("speed_delta", 0)
            if speed_delta != 0:
                affected["voice.speaking_rate"] = speed_delta

        elif signal.signal_type == SignalType.SKIP:
            # User skipped - might want faster speech or shorter responses
            affected["voice.speaking_rate"] = 0.02  # Slightly faster
            affected["response.length"] = -0.1  # Slightly shorter

        elif signal.signal_type == SignalType.REPLAY:
            # User replayed - might want slower speech or more detail
            affected["voice.speaking_rate"] = -0.02  # Slightly slower
            affected["content.depth"] = 0.1  # More depth

        elif signal.signal_type == SignalType.COMPLETION:
            # User completed - current settings are good
            pass  # Reinforces current preferences via confidence

        # Content signals
        elif signal.signal_type == SignalType.FOLLOW_UP:
            affected["content.depth"] = 0.1  # Wants more depth

        elif signal.signal_type == SignalType.SAVE:
            # Saved content is valuable
            topic = signal.context.get("topic")
            if topic:
                affected[f"content.topic_affinity.{topic}"] = 0.2

        # Timing signals
        elif signal.signal_type == SignalType.SESSION_LENGTH:
            length = signal.context.get("length_minutes", 10)
            affected["timing.preferred_session_length"] = length * 0.1

        # Rating is universal
        elif signal.signal_type == SignalType.RATING:
            rating = signal.value  # Already normalized
            if rating > 0:
                # Positive rating - reinforce current settings
                for key in ["voice.speaking_rate", "response.length", "content.depth"]:
                    affected[key] = rating * 0.05
            else:
                # Negative rating - adjust away from current
                affected["response.length"] = rating * 0.1  # Adjust length

        return affected

    async def get_preferences(
        self,
        user_id: str,
        min_confidence: float = 0.3
    ) -> Dict[str, Any]:
        """
        Get learned preferences for a user.

        Args:
            user_id: User identifier
            min_confidence: Minimum confidence to include preference

        Returns:
            Dictionary of preference_key -> value
        """
        if user_id not in self._user_preferences:
            return {}

        result = {}
        for key, pref in self._user_preferences[user_id].items():
            # Apply decay
            age_days = (datetime.utcnow() - pref.last_updated).days
            decayed_confidence = pref.confidence * (pref.decay_rate ** age_days)

            if decayed_confidence >= min_confidence:
                result[key] = {
                    "value": pref.preferred_value,
                    "confidence": round(decayed_confidence, 3),
                    "signal_count": pref.signal_count,
                }

        return result

    async def get_preference_value(
        self,
        user_id: str,
        preference_key: str
    ) -> Tuple[Any, float]:
        """
        Get a specific preference value with confidence.

        Args:
            user_id: User identifier
            preference_key: Key like "voice.speaking_rate"

        Returns:
            Tuple of (value, confidence)
        """
        if user_id not in self._user_preferences:
            default = self.LEARNABLE_PREFERENCES.get(preference_key, {}).get("default")
            return default, 0.0

        if preference_key not in self._user_preferences[user_id]:
            default = self.LEARNABLE_PREFERENCES.get(preference_key, {}).get("default")
            return default, 0.0

        pref = self._user_preferences[user_id][preference_key]
        age_days = (datetime.utcnow() - pref.last_updated).days
        decayed_confidence = pref.confidence * (pref.decay_rate ** age_days)

        return pref.preferred_value, decayed_confidence

    async def apply_preferences_to_request(
        self,
        user_id: str,
        base_config: Dict[str, Any],
        min_confidence: float = 0.5
    ) -> Dict[str, Any]:
        """
        Apply learned preferences to a request configuration.

        Args:
            user_id: User identifier
            base_config: Base configuration to modify
            min_confidence: Minimum confidence to apply preference

        Returns:
            Modified configuration with learned preferences applied
        """
        config = base_config.copy()
        prefs = await self.get_preferences(user_id, min_confidence)

        # Apply voice preferences
        if "voice.speaking_rate" in prefs:
            config["speaking_rate"] = prefs["voice.speaking_rate"]["value"]
        if "voice.pitch" in prefs:
            config["pitch"] = prefs["voice.pitch"]["value"]
        if "voice.emotion_intensity" in prefs:
            config["emotion_intensity"] = prefs["voice.emotion_intensity"]["value"]

        # Apply response preferences
        if "response.length" in prefs:
            length_map = {"short": 150, "medium": 250, "long": 400}
            config["max_tokens"] = length_map.get(prefs["response.length"]["value"], 250)

        # Apply content preferences
        if "content.depth" in prefs:
            config["content_depth"] = prefs["content.depth"]["value"]

        return config

    async def get_user_insights(self, user_id: str) -> Dict[str, Any]:
        """
        Get insights about user preferences for dashboard.

        Args:
            user_id: User identifier

        Returns:
            Dictionary with preference insights
        """
        signals = self._user_signals.get(user_id, [])
        prefs = await self.get_preferences(user_id)

        # Calculate signal distribution
        signal_counts = {}
        for signal in signals:
            signal_counts[signal.signal_type.value] = signal_counts.get(signal.signal_type.value, 0) + 1

        # Calculate engagement metrics
        completions = signal_counts.get(SignalType.COMPLETION.value, 0)
        skips = signal_counts.get(SignalType.SKIP.value, 0)
        replays = signal_counts.get(SignalType.REPLAY.value, 0)

        total = completions + skips
        completion_rate = completions / max(1, total)

        return {
            "user_id": user_id,
            "total_signals": len(signals),
            "signal_distribution": signal_counts,
            "learned_preferences": prefs,
            "engagement": {
                "completion_rate": round(completion_rate, 3),
                "replay_count": replays,
                "skip_count": skips,
            },
            "preference_maturity": len([p for p in prefs.values() if p["confidence"] > 0.5]),
        }


# Singleton instance
_preference_service: Optional[UserPreferenceLearningService] = None


def get_preference_learning_service(redis_client=None) -> UserPreferenceLearningService:
    """Get singleton preference learning service."""
    global _preference_service
    if _preference_service is None:
        _preference_service = UserPreferenceLearningService(redis_client)
    return _preference_service
