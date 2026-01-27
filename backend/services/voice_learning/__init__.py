"""
KIAAN Voice Learning System - Self-Improvement Infrastructure

This module provides the complete learning infrastructure for KIAAN Voice
to continuously improve and reach Siri/Alexa parity.

Core Components:
- SentimentAnalysisService: Transformer-based emotion detection
- VoiceFingerprintService: Consistent voice identity per user
- ABTestingService: Response experimentation framework
- UserPreferenceLearningService: Behavioral preference learning
- RealTimeAdaptationService: Dynamic prosody per sentence
- IntelligentCacheService: Frequency + predictive caching
- CrossSessionContextService: Conversation memory across sessions
- LearningFeedbackService: RLHF-style improvement loop

Advanced Components:
- VoiceAnalyticsDashboard: Real-time metrics and A/B test visualization
- ProactiveEngagementService: Time-pattern learning and proactive outreach
- OfflineSyncService: Offline learning with smart sync
- MultiModalEmotionService: Voice + text combined emotion detection
- VoicePersonalizationService: Per-user voice adaptation
- SpiritualMemoryService: Deep spiritual journey memory
- ConversationQualityService: Automatic response quality scoring
- VoiceInteractionPatternsService: User interaction pattern learning

Architecture:
    User Query → Sentiment Analysis → Context Enrichment → Response Generation
                                    ↓
                            Learning Layer
                                    ↓
    Voice Synthesis ← Preference Learning ← Feedback Collection
                                    ↓
                            Analytics & Optimization
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

# Advanced Services
from backend.services.voice_learning.analytics_dashboard import (
    VoiceAnalyticsDashboard,
    get_analytics_dashboard,
    DashboardSnapshot,
    ABTestResult,
    MetricType,
    TimeGranularity,
)
from backend.services.voice_learning.proactive_engagement import (
    ProactiveEngagementService,
    get_proactive_engagement_service,
    ProactiveMessage,
    EngagementTrigger,
    UserEngagementPattern,
)
from backend.services.voice_learning.offline_sync import (
    OfflineSyncService,
    get_offline_sync_service,
    SyncItem,
    SyncResult,
    SyncStatus,
    DataType,
)
from backend.services.voice_learning.multimodal_emotion import (
    MultiModalEmotionService,
    get_multimodal_emotion_service,
    MultiModalEmotionResult,
    VoiceAcousticFeatures,
    EmotionCategory,
    EmotionalTrajectory,
)
from backend.services.voice_learning.voice_personalization import (
    VoicePersonalizationService,
    get_voice_personalization_service,
    VoiceProfile,
    AdaptedVoiceSettings,
    VoicePersona,
)
from backend.services.voice_learning.spiritual_memory import (
    SpiritualMemoryService,
    get_spiritual_memory_service,
    SpiritualProfile,
    VerseResonance,
    SpiritualBreakthrough,
    GrowthDimension,
)
from backend.services.voice_learning.quality_scoring import (
    ConversationQualityService,
    get_quality_scoring_service,
    ConversationQuality,
    QualityDimension,
    QualityScore,
)
from backend.services.voice_learning.interaction_patterns import (
    VoiceInteractionPatternsService,
    get_interaction_patterns_service,
    InteractionPattern,
    ResponseLengthPreference,
    AttentionSpanProfile,
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
    # Analytics Dashboard
    "VoiceAnalyticsDashboard",
    "get_analytics_dashboard",
    "DashboardSnapshot",
    "ABTestResult",
    "MetricType",
    "TimeGranularity",
    # Proactive Engagement
    "ProactiveEngagementService",
    "get_proactive_engagement_service",
    "ProactiveMessage",
    "EngagementTrigger",
    "UserEngagementPattern",
    # Offline Sync
    "OfflineSyncService",
    "get_offline_sync_service",
    "SyncItem",
    "SyncResult",
    "SyncStatus",
    "DataType",
    # Multi-Modal Emotion
    "MultiModalEmotionService",
    "get_multimodal_emotion_service",
    "MultiModalEmotionResult",
    "VoiceAcousticFeatures",
    "EmotionCategory",
    "EmotionalTrajectory",
    # Voice Personalization
    "VoicePersonalizationService",
    "get_voice_personalization_service",
    "VoiceProfile",
    "AdaptedVoiceSettings",
    "VoicePersona",
    # Spiritual Memory
    "SpiritualMemoryService",
    "get_spiritual_memory_service",
    "SpiritualProfile",
    "VerseResonance",
    "SpiritualBreakthrough",
    "GrowthDimension",
    # Quality Scoring
    "ConversationQualityService",
    "get_quality_scoring_service",
    "ConversationQuality",
    "QualityDimension",
    "QualityScore",
    # Interaction Patterns
    "VoiceInteractionPatternsService",
    "get_interaction_patterns_service",
    "InteractionPattern",
    "ResponseLengthPreference",
    "AttentionSpanProfile",
]
