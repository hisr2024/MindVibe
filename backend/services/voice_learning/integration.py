"""
Voice Learning Integration - Unified API for KIAAN Self-Improvement

This module provides a unified integration layer for all voice learning services,
enabling KIAAN to learn and improve like Siri/Alexa.

Usage:
    from backend.services.voice_learning.integration import voice_learning

    # Enhance a KIAAN response
    enhanced_response = await voice_learning.enhance_response(
        user_id=user_id,
        text="Your response text",
        emotion="anxiety",
        context="emotional_support"
    )

    # Record feedback
    await voice_learning.record_feedback(
        user_id=user_id,
        response_hash=response_hash,
        rating=4.5,
        feedback_type="rating"
    )
"""

import logging
import hashlib
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, List, Any, Tuple

from backend.services.voice_learning.sentiment_analysis import (
    get_sentiment_service,
    SentimentResult,
    EmotionCategory,
)
from backend.services.voice_learning.voice_fingerprint import (
    get_voice_fingerprint_service,
    VoiceFingerprint,
    VoiceProvider,
)
from backend.services.voice_learning.ab_testing import (
    get_ab_testing_service,
    ExperimentType,
    ExperimentStatus,
)
from backend.services.voice_learning.preference_learning import (
    get_preference_learning_service,
    SignalType,
    PreferenceCategory,
)
from backend.services.voice_learning.realtime_adaptation import (
    get_realtime_adaptation_service,
    AdaptiveProsody,
    AdaptedSegment,
)
from backend.services.voice_learning.intelligent_cache import (
    get_intelligent_cache_service,
    CacheEntry,
)
from backend.services.voice_learning.cross_session_context import (
    get_cross_session_context_service,
    UserMemory,
    MemoryType,
    MemoryPriority,
)
from backend.services.voice_learning.feedback_loop import (
    get_learning_feedback_service,
    FeedbackSignal,
    FeedbackType,
)

logger = logging.getLogger(__name__)


@dataclass
class EnhancedResponse:
    """Enhanced response with voice learning applied."""
    text: str
    ssml: str
    emotion: EmotionCategory
    prosody: AdaptiveProsody
    voice_config: Dict[str, Any]
    memories_used: List[str]
    experiment_variant: Optional[str]
    cache_hit: bool
    enhancements_applied: List[str]

    def to_dict(self) -> Dict:
        return {
            "text": self.text,
            "ssml": self.ssml,
            "emotion": self.emotion.value,
            "prosody": self.prosody.to_dict(),
            "voice_config": self.voice_config,
            "memories_used": self.memories_used,
            "experiment_variant": self.experiment_variant,
            "cache_hit": self.cache_hit,
            "enhancements_applied": self.enhancements_applied,
        }


@dataclass
class SessionState:
    """Current session state for voice learning."""
    user_id: str
    session_id: str
    current_emotion: EmotionCategory
    current_intensity: float
    messages_count: int
    active_memories: List[str]
    proactive_prompts: List[str]
    preferences_applied: Dict[str, Any]

    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "current_emotion": self.current_emotion.value,
            "current_intensity": self.current_intensity,
            "messages_count": self.messages_count,
            "active_memories": self.active_memories,
            "proactive_prompts": self.proactive_prompts,
            "preferences_applied": self.preferences_applied,
        }


class VoiceLearningIntegration:
    """
    Unified integration for all voice learning services.

    This class provides a high-level API for:
    - Enhancing KIAAN responses with voice learning
    - Recording user feedback for continuous improvement
    - Managing user preferences and memories
    - Running A/B experiments
    - Real-time prosody adaptation

    Features enabled:
    1. Sentiment Analysis - Detect emotions in text
    2. Voice Fingerprinting - Consistent voice per user
    3. A/B Testing - Response experimentation
    4. Preference Learning - Learn from user behavior
    5. Real-Time Adaptation - Dynamic prosody per sentence
    6. Intelligent Caching - Predictive response caching
    7. Cross-Session Memory - Remember user context
    8. Feedback Loop - RLHF-style improvements
    """

    def __init__(self):
        """Initialize all voice learning services."""
        self.sentiment = get_sentiment_service()
        self.fingerprint = get_voice_fingerprint_service()
        self.ab_testing = get_ab_testing_service()
        self.preferences = get_preference_learning_service()
        self.adaptation = get_realtime_adaptation_service()
        self.cache = get_intelligent_cache_service()
        self.context = get_cross_session_context_service()
        self.feedback = get_learning_feedback_service()

        # Session tracking
        self._active_sessions: Dict[str, SessionState] = {}

        logger.info("Voice Learning Integration initialized")

    # =========================================================================
    # SESSION MANAGEMENT
    # =========================================================================

    async def start_session(
        self,
        user_id: str,
        session_id: str,
        initial_mood: Optional[str] = None
    ) -> SessionState:
        """
        Start a new voice learning session for a user.

        Args:
            user_id: User identifier
            session_id: Session identifier
            initial_mood: Optional initial mood

        Returns:
            SessionState with active memories and proactive prompts
        """
        # Start context session
        session_context = await self.context.start_session(user_id, session_id)

        # Get proactive prompts based on memories
        proactive_prompts = await self.context.get_proactive_prompts(user_id)

        # Get user preferences
        preferences = await self.preferences.get_preferences(user_id, min_confidence=0.3)

        state = SessionState(
            user_id=user_id,
            session_id=session_id,
            current_emotion=EmotionCategory.NEUTRAL,
            current_intensity=0.5,
            messages_count=0,
            active_memories=[m.key for m in session_context.active_memories[:5]],
            proactive_prompts=[p["prompt"] for p in proactive_prompts[:3]],
            preferences_applied=preferences,
        )

        self._active_sessions[session_id] = state

        logger.info(f"Started voice learning session for user {user_id}")
        return state

    async def end_session(self, session_id: str) -> Dict[str, Any]:
        """
        End a voice learning session.

        Args:
            session_id: Session identifier

        Returns:
            Session summary
        """
        state = self._active_sessions.pop(session_id, None)
        if not state:
            return {"error": "Session not found"}

        # End context session
        await self.context.end_session(state.user_id, session_id)

        # Generate feedback analysis
        improvements = await self.feedback.analyze_feedback_patterns()

        return {
            "session_id": session_id,
            "user_id": state.user_id,
            "messages_count": state.messages_count,
            "final_emotion": state.current_emotion.value,
            "memories_used": len(state.active_memories),
            "improvements_identified": len(improvements),
        }

    # =========================================================================
    # RESPONSE ENHANCEMENT
    # =========================================================================

    async def enhance_response(
        self,
        user_id: str,
        text: str,
        context: str = "general",
        language: str = "en",
        session_id: Optional[str] = None,
    ) -> EnhancedResponse:
        """
        Enhance a KIAAN response with voice learning.

        This method applies all voice learning services:
        1. Analyzes text sentiment
        2. Gets user voice fingerprint
        3. Checks A/B experiments
        4. Applies learned preferences
        5. Generates adaptive prosody
        6. Checks intelligent cache
        7. Updates cross-session context

        Args:
            user_id: User identifier
            text: Response text to enhance
            context: Response context type
            language: Language code
            session_id: Optional session ID

        Returns:
            EnhancedResponse with all improvements applied
        """
        enhancements_applied = []

        # Step 1: Check intelligent cache
        text_hash = hashlib.md5(text.encode()).hexdigest()[:16]
        cached = await self.cache.get(text_hash)
        if cached:
            logger.debug(f"Cache hit for response: {text_hash}")
            enhancements_applied.append("cache_hit")
            # Still need to get voice config for this user
            fingerprint = await self.fingerprint.get_or_create_fingerprint(
                user_id=user_id,
                language=language,
                voice_type="friendly",
            )
            return EnhancedResponse(
                text=text,
                ssml=cached.get("ssml", text),
                emotion=EmotionCategory.NEUTRAL,
                prosody=AdaptiveProsody(),
                voice_config=fingerprint.to_config(),
                memories_used=[],
                experiment_variant=None,
                cache_hit=True,
                enhancements_applied=enhancements_applied,
            )

        # Step 2: Analyze sentiment
        sentiment = await self.sentiment.analyze(text, user_id)
        enhancements_applied.append("sentiment_analysis")

        # Step 3: Get voice fingerprint
        fingerprint = await self.fingerprint.get_or_create_fingerprint(
            user_id=user_id,
            language=language,
            voice_type="friendly",
        )
        enhancements_applied.append("voice_fingerprint")

        # Step 4: Check A/B experiments
        experiment_variant = None

        # Check voice settings experiment
        voice_experiment = await self.ab_testing.get_variant_for_user(
            user_id=user_id,
            experiment_type=ExperimentType.VOICE_SETTINGS,
            context=context,
            language=language,
        )
        if voice_experiment:
            experiment_variant = voice_experiment["variant_id"]
            # Apply experiment config
            fingerprint = await self._apply_experiment_config(
                fingerprint, voice_experiment["config"]
            )
            enhancements_applied.append("ab_experiment_voice")

        # Check emotion style experiment
        emotion_experiment = await self.ab_testing.get_variant_for_user(
            user_id=user_id,
            experiment_type=ExperimentType.EMOTION_STYLE,
            context=context,
            language=language,
        )
        if emotion_experiment:
            experiment_variant = emotion_experiment["variant_id"]
            enhancements_applied.append("ab_experiment_emotion")

        # Step 5: Apply learned preferences
        prefs_config = await self.preferences.apply_preferences_to_request(
            user_id=user_id,
            base_config=fingerprint.to_config(),
            min_confidence=0.5,
        )
        if prefs_config != fingerprint.to_config():
            fingerprint = await self._apply_preferences_to_fingerprint(
                fingerprint, prefs_config
            )
            enhancements_applied.append("learned_preferences")

        # Step 6: Generate adaptive prosody and SSML
        ssml = await self.adaptation.generate_adaptive_ssml(
            text=text,
            user_id=user_id,
            base_prosody=AdaptiveProsody(
                speaking_rate=fingerprint.speaking_rate,
                pitch=fingerprint.pitch,
            ),
        )
        enhancements_applied.append("adaptive_prosody")

        # Step 7: Get adapted segments for prosody info
        segments = await self.adaptation.adapt_text(text, user_id)
        prosody = segments[0].prosody if segments else AdaptiveProsody()

        # Step 8: Update cross-session context
        memories_used = []
        if session_id and user_id in self._active_sessions.get(session_id, SessionState(
            user_id="", session_id="", current_emotion=EmotionCategory.NEUTRAL,
            current_intensity=0.5, messages_count=0, active_memories=[],
            proactive_prompts=[], preferences_applied={}
        )).__dict__.values():
            # Extract memories from response text
            await self.context.add_interaction(
                user_id=user_id,
                session_id=session_id,
                user_message="",  # We don't have user message here
                assistant_response=text,
                emotion=sentiment.primary_emotion.value,
            )
            state = self._active_sessions.get(session_id)
            if state:
                memories_used = state.active_memories
                enhancements_applied.append("cross_session_context")

        # Step 9: Cache the enhanced response
        await self.cache.set(
            key=text_hash,
            content=text,
            audio_path=None,  # Will be set when audio is generated
            context=context,
            language=language,
            voice_type="friendly",
            is_verse=False,
            is_meditation=False,
            is_core_response=True,
            metadata={"ssml": ssml, "emotion": sentiment.primary_emotion.value},
        )

        logger.info(f"Enhanced response with {len(enhancements_applied)} improvements")

        return EnhancedResponse(
            text=text,
            ssml=ssml,
            emotion=sentiment.primary_emotion,
            prosody=prosody,
            voice_config=fingerprint.to_config(),
            memories_used=memories_used,
            experiment_variant=experiment_variant,
            cache_hit=False,
            enhancements_applied=enhancements_applied,
        )

    async def _apply_experiment_config(
        self,
        fingerprint: VoiceFingerprint,
        config: Dict[str, Any]
    ) -> VoiceFingerprint:
        """Apply A/B experiment config to voice fingerprint."""
        # Update fingerprint with experiment settings
        if "speaking_rate" in config:
            fingerprint.speaking_rate = config["speaking_rate"]
        if "pitch" in config:
            fingerprint.pitch = config["pitch"]
        if "emotion_intensity" in config:
            fingerprint.emotion_intensity_multiplier = config["emotion_intensity"]
        return fingerprint

    async def _apply_preferences_to_fingerprint(
        self,
        fingerprint: VoiceFingerprint,
        prefs_config: Dict[str, Any]
    ) -> VoiceFingerprint:
        """Apply learned preferences to voice fingerprint."""
        if "speaking_rate" in prefs_config:
            fingerprint.speaking_rate = prefs_config["speaking_rate"]
        if "pitch" in prefs_config:
            fingerprint.pitch = prefs_config["pitch"]
        if "emotion_intensity" in prefs_config:
            fingerprint.emotion_intensity_multiplier = prefs_config["emotion_intensity"]
        return fingerprint

    # =========================================================================
    # INPUT PROCESSING
    # =========================================================================

    async def process_user_input(
        self,
        user_id: str,
        text: str,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process user input for voice learning.

        Analyzes user input and updates session state.

        Args:
            user_id: User identifier
            text: User's input text
            session_id: Optional session ID

        Returns:
            Analysis results including emotion, trajectory, and memories
        """
        # Analyze sentiment
        sentiment = await self.sentiment.analyze(text, user_id)

        # Update emotional trajectory
        trajectory = await self.sentiment.update_trajectory(
            user_id=user_id,
            text=text,
            session_id=session_id,
        )

        # Get relevant memories
        relevant_memories = await self.context.get_user_memories(
            user_id=user_id,
            limit=5,
        )

        # Update session state if active
        if session_id and session_id in self._active_sessions:
            state = self._active_sessions[session_id]
            state.current_emotion = sentiment.primary_emotion
            state.current_intensity = sentiment.intensity
            state.messages_count += 1

        return {
            "emotion": sentiment.primary_emotion.value,
            "confidence": sentiment.confidence,
            "polarity": sentiment.polarity,
            "intensity": sentiment.intensity,
            "trajectory": trajectory.to_dict() if trajectory else None,
            "memories": [m.key for m in relevant_memories],
            "crisis_detected": trajectory.crisis_indicators if trajectory else False,
        }

    # =========================================================================
    # FEEDBACK COLLECTION
    # =========================================================================

    async def record_feedback(
        self,
        user_id: str,
        response_hash: Optional[str] = None,
        rating: Optional[float] = None,
        feedback_type: str = "rating",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Record user feedback for continuous improvement.

        Args:
            user_id: User identifier
            response_hash: Hash of the response being rated
            rating: Rating value (1-5 for ratings, 0/1 for thumbs)
            feedback_type: Type of feedback (rating, thumbs, skip, replay, etc.)
            metadata: Additional context

        Returns:
            Feedback recording result
        """
        # Map feedback type string to enum
        feedback_type_enum = FeedbackType.RATING
        signal_type_enum = SignalType.RATING

        if feedback_type == "thumbs":
            feedback_type_enum = FeedbackType.THUMBS
            signal_type_enum = SignalType.RATING
        elif feedback_type == "skip":
            feedback_type_enum = FeedbackType.SKIP
            signal_type_enum = SignalType.SKIP
        elif feedback_type == "replay":
            feedback_type_enum = FeedbackType.REPLAY
            signal_type_enum = SignalType.REPLAY
        elif feedback_type == "completion":
            feedback_type_enum = FeedbackType.COMPLETION
            signal_type_enum = SignalType.COMPLETION

        # Record to feedback service for RLHF
        await self.feedback.collect_feedback(
            user_id=user_id,
            feedback_type=feedback_type_enum,
            value=rating or 0.0,
            response_hash=response_hash,
            context=metadata.get("context", "general") if metadata else "general",
            metadata=metadata,
        )

        # Record to preference learning
        await self.preferences.record_signal(
            user_id=user_id,
            signal_type=signal_type_enum,
            value=rating,
            context=metadata,
        )

        # Record to A/B testing if part of experiment
        if metadata and "experiment_id" in metadata and "variant_id" in metadata:
            if rating:
                await self.ab_testing.record_rating(
                    user_id=user_id,
                    experiment_id=metadata["experiment_id"],
                    variant_id=metadata["variant_id"],
                    rating=rating,
                )
            if feedback_type == "completion":
                await self.ab_testing.record_conversion(
                    user_id=user_id,
                    experiment_id=metadata["experiment_id"],
                    variant_id=metadata["variant_id"],
                )

        return {
            "recorded": True,
            "feedback_type": feedback_type,
            "user_id": user_id,
            "response_hash": response_hash,
        }

    async def record_playback_event(
        self,
        user_id: str,
        event_type: str,
        content_hash: Optional[str] = None,
        duration_ms: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Record audio playback events for preference learning.

        Args:
            user_id: User identifier
            event_type: Event type (play, pause, skip, replay, complete)
            content_hash: Hash of the content
            duration_ms: Playback duration
            metadata: Additional context
        """
        # Map event to signal type
        signal_map = {
            "complete": SignalType.COMPLETION,
            "skip": SignalType.SKIP,
            "replay": SignalType.REPLAY,
            "pause": SignalType.PAUSE,
        }
        signal_type = signal_map.get(event_type, SignalType.COMPLETION)

        # Calculate value based on event
        value = 1.0 if event_type == "complete" else 0.0
        if event_type == "replay":
            value = 0.6  # Replay is positive
        elif event_type == "skip":
            value = -0.5  # Skip is negative

        await self.preferences.record_signal(
            user_id=user_id,
            signal_type=signal_type,
            value=value,
            context={"content_hash": content_hash, "duration_ms": duration_ms, **(metadata or {})},
        )

        # Log voice interaction
        fingerprint_id = await self.fingerprint._get_primary_fingerprint_id(user_id)
        if fingerprint_id:
            await self.fingerprint.log_interaction(
                user_id=user_id,
                fingerprint_id=fingerprint_id,
                interaction_type=event_type,
                value=value,
                context_type=metadata.get("context", "general") if metadata else "general",
                playback_duration_ms=duration_ms,
            )

    # =========================================================================
    # MEMORY MANAGEMENT
    # =========================================================================

    async def add_memory(
        self,
        user_id: str,
        memory_type: str,
        key: str,
        content: str,
        priority: str = "medium",
    ) -> Dict[str, Any]:
        """
        Add a memory for cross-session context.

        Args:
            user_id: User identifier
            memory_type: Type (emotional_state, topic, preference, etc.)
            key: Memory key
            content: Memory content
            priority: Priority level (critical, high, medium, low)

        Returns:
            Created memory info
        """
        memory_type_enum = MemoryType(memory_type)
        priority_enum = MemoryPriority(priority)

        memory = await self.context.add_memory(
            user_id=user_id,
            memory_type=memory_type_enum,
            key=key,
            content=content,
            priority=priority_enum,
        )

        return memory.to_dict()

    async def get_user_memories(
        self,
        user_id: str,
        memory_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Get user memories.

        Args:
            user_id: User identifier
            memory_type: Optional type filter
            limit: Maximum memories to return

        Returns:
            List of memories
        """
        memories = await self.context.get_user_memories(
            user_id=user_id,
            memory_type=MemoryType(memory_type) if memory_type else None,
            limit=limit,
        )
        return [m.to_dict() for m in memories]

    # =========================================================================
    # ANALYTICS AND INSIGHTS
    # =========================================================================

    async def get_user_insights(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive insights about a user's voice learning data.

        Args:
            user_id: User identifier

        Returns:
            Dictionary with insights from all services
        """
        # Get insights from each service
        preference_insights = await self.preferences.get_user_insights(user_id)
        emotional_progress = await self.context.get_emotional_progress(user_id)

        # Get feedback patterns
        global_improvements = await self.feedback.analyze_feedback_patterns()

        return {
            "user_id": user_id,
            "preferences": preference_insights,
            "emotional_progress": emotional_progress,
            "global_improvements": global_improvements[:5],  # Top 5 improvements
        }

    async def get_system_health(self) -> Dict[str, Any]:
        """
        Get health metrics for all voice learning services.

        Returns:
            Dictionary with service health metrics
        """
        # Get cache health
        cache_entry_count = len(self.cache._entries)
        cache_hit_rate = await self.cache.get_metrics()

        # Get experiment status
        active_experiments = await self.ab_testing.list_experiments(
            status=ExperimentStatus.RUNNING
        )

        # Get feedback model status
        reward_model = await self.feedback.get_reward_model()

        return {
            "cache": {
                "entries": cache_entry_count,
                "metrics": cache_hit_rate,
            },
            "experiments": {
                "active_count": len(active_experiments),
                "experiments": [e.name for e in active_experiments],
            },
            "feedback": {
                "reward_model_version": reward_model.version,
                "training_samples": reward_model.training_samples,
            },
            "services_active": {
                "sentiment": True,
                "fingerprint": True,
                "ab_testing": True,
                "preferences": True,
                "adaptation": True,
                "cache": True,
                "context": True,
                "feedback": True,
            },
        }


# Singleton instance
_voice_learning: Optional[VoiceLearningIntegration] = None


def get_voice_learning() -> VoiceLearningIntegration:
    """Get singleton voice learning integration."""
    global _voice_learning
    if _voice_learning is None:
        _voice_learning = VoiceLearningIntegration()
    return _voice_learning


# Convenience alias
voice_learning = get_voice_learning()


__all__ = [
    "VoiceLearningIntegration",
    "EnhancedResponse",
    "SessionState",
    "get_voice_learning",
    "voice_learning",
]
