"""
KIAAN Voice Learning System - Self-Improvement Infrastructure

This module provides the complete learning infrastructure for KIAAN Voice
to continuously improve and reach Siri/Alexa parity.

Components:
- SentimentAnalysisService: Transformer-based emotion detection
- VoiceFingerprintService: Consistent voice identity per user
- ABTestingService: Response experimentation framework
- UserPreferenceLearningService: Behavioral preference learning
- RealTimeAdaptationService: Dynamic prosody per sentence
- IntelligentCacheService: Frequency + predictive caching
- CrossSessionContextService: Conversation memory across sessions
- LearningFeedbackService: RLHF-style improvement loop

Architecture:
    User Query → Sentiment Analysis → Context Enrichment → Response Generation
                                    ↓
                            Learning Layer
                                    ↓
    Voice Synthesis ← Preference Learning ← Feedback Collection
"""

from backend.services.voice_learning.sentiment_analysis import (
    SentimentAnalysisService,
    get_sentiment_service,
    SentimentResult,
    EmotionTrajectory,
)
from backend.services.voice_learning.voice_fingerprint import (
    VoiceFingerprintService,
    get_voice_fingerprint_service,
    VoiceFingerprint,
    UserVoiceProfile,
)
from backend.services.voice_learning.ab_testing import (
    ABTestingService,
    get_ab_testing_service,
    Experiment,
    Variant,
    ExperimentResult,
)
from backend.services.voice_learning.preference_learning import (
    UserPreferenceLearningService,
    get_preference_learning_service,
    LearnedPreference,
    PreferenceSignal,
)
from backend.services.voice_learning.realtime_adaptation import (
    RealTimeAdaptationService,
    get_realtime_adaptation_service,
    AdaptiveProsody,
    SentenceEmotion,
)
from backend.services.voice_learning.intelligent_cache import (
    IntelligentCacheService,
    get_intelligent_cache_service,
    CacheEntry,
    CachePrediction,
)
from backend.services.voice_learning.cross_session_context import (
    CrossSessionContextService,
    get_cross_session_context_service,
    SessionContext,
    UserMemory,
)
from backend.services.voice_learning.feedback_loop import (
    LearningFeedbackService,
    get_feedback_service,
    FeedbackSignal,
    ImprovementAction,
)
from backend.services.voice_learning.integration import (
    VoiceLearningIntegration,
    get_voice_learning,
    voice_learning,
    EnhancedResponse,
    SessionState,
)

__all__ = [
    # Sentiment Analysis
    "SentimentAnalysisService",
    "get_sentiment_service",
    "SentimentResult",
    "EmotionTrajectory",
    # Voice Fingerprint
    "VoiceFingerprintService",
    "get_voice_fingerprint_service",
    "VoiceFingerprint",
    "UserVoiceProfile",
    # A/B Testing
    "ABTestingService",
    "get_ab_testing_service",
    "Experiment",
    "Variant",
    "ExperimentResult",
    # Preference Learning
    "UserPreferenceLearningService",
    "get_preference_learning_service",
    "LearnedPreference",
    "PreferenceSignal",
    # Real-time Adaptation
    "RealTimeAdaptationService",
    "get_realtime_adaptation_service",
    "AdaptiveProsody",
    "SentenceEmotion",
    # Intelligent Cache
    "IntelligentCacheService",
    "get_intelligent_cache_service",
    "CacheEntry",
    "CachePrediction",
    # Cross-Session Context
    "CrossSessionContextService",
    "get_cross_session_context_service",
    "SessionContext",
    "UserMemory",
    # Feedback Loop
    "LearningFeedbackService",
    "get_feedback_service",
    "FeedbackSignal",
    "ImprovementAction",
    # Integration (Unified API)
    "VoiceLearningIntegration",
    "get_voice_learning",
    "voice_learning",
    "EnhancedResponse",
    "SessionState",
]
