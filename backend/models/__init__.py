"""
Backend models package.

This package contains all SQLAlchemy model definitions for the MindVibe backend.
All models are defined in base.py and re-exported here for convenient imports.
"""

# Re-export everything from base.py so that imports like
# `from backend.models import Base` continue to work
from backend.models.base import (
    # Enums
    SubscriptionTier,
    SubscriptionStatus,
    PaymentStatus,
    AchievementCategory,
    AchievementRarity,
    UnlockableType,
    AdminRole,
    AdminPermission,
    AdminAuditAction,
    ModerationStatus,
    AnnouncementType,
    ABTestStatus,
    ConsentType,
    DataExportStatus,
    DeletionRequestStatus,
    VoiceGender,
    VoiceType,
    AudioQuality,
    VoiceEnhancementType,
    IndianDataSourceType,
    IndianContentCategory,
    EnemyTag,
    UserJourneyStatus,
    JourneyPace,
    JourneyTone,
    JourneyStatus,
    PersonalJourneyStatus,
    # Mixins
    SoftDeleteMixin,
    # Base class
    Base,
    # Role permissions mapping
    ROLE_PERMISSIONS,
    # User & Auth models
    User,
    UserProfile,
    Session,
    RefreshToken,
    # Achievement & Gamification models
    Achievement,
    UserAchievement,
    Unlockable,
    UserUnlockable,
    UserProgress,
    # Work models
    Work,
    # Mood models
    Mood,
    # Journal models
    EncryptedBlob,
    JournalEntry,
    JournalTag,
    JournalEntryTag,
    JournalVersion,
    JournalSearchIndex,
    # Content models
    ContentPack,
    # Wisdom & Gita models
    WisdomVerse,
    GitaChapter,
    GitaSource,
    GitaVerse,
    GitaModernContext,
    GitaKeyword,
    GitaVerseKeyword,
    GitaVerseUsage,
    # KIAAN Learning System models
    ContentSourceType,
    ValidationStatus,
    LearnedWisdom,
    UserQueryPattern,
    ContentSourceRegistry,
    # Subscription models
    SubscriptionPlan,
    UserSubscription,
    UsageTracking,
    Payment,
    # Admin models
    AdminUser,
    AdminPermissionAssignment,
    AdminSession,
    AdminAuditLog,
    FeatureFlag,
    Announcement,
    ABTest,
    ABTestAssignment,
    ABTestConversion,
    FlaggedContent,
    # KIAAN Analytics
    KiaanUsageAnalytics,
    # Compliance & GDPR models
    UserConsent,
    CookiePreference,
    DataExportRequest,
    DeletionRequest,
    ComplianceAuditLog,
    # Chat models
    ChatRoom,
    RoomParticipant,
    ChatMessage,
    ChatTranslation,
    # Emotional & Analysis models
    EmotionalResetSession,
    UserEmotionalLog,
    UserDailyAnalysis,
    UserWeeklyReflection,
    UserAssessment,
    # User Journey & Progress models
    UserVerseBookmark,
    UserJourneyProgress,
    # Wisdom Journey models
    WisdomJourney,
    JourneyStep,
    JourneyRecommendation,
    # Voice models
    UserVoicePreferences,
    VoiceConversation,
    VoiceAnalytics,
    VoiceQualityMetrics,
    VoiceWakeWordEvent,
    VoiceEnhancementSession,
    VoiceDailyCheckin,
    # Indian Wisdom models
    IndianWisdomContent,
    YogaAsanaDB,
    PranayamaTechniqueDB,
    MeditationPracticeDB,
    AyurvedicPracticeDB,
    IndianSourceFetchLog,
    # Journey Template models
    JourneyTemplate,
    JourneyTemplateStep,
    UserJourney,
    UserJourneyStepState,
    # AI Provider models
    AIProviderConfig,
    # KIAAN Chat models
    KiaanChatMessage,
    KiaanChatSession,
    # Personal Journey
    PersonalJourney,
)

__all__ = [
    # Enums
    "SubscriptionTier",
    "SubscriptionStatus",
    "PaymentStatus",
    "AchievementCategory",
    "AchievementRarity",
    "UnlockableType",
    "AdminRole",
    "AdminPermission",
    "AdminAuditAction",
    "ModerationStatus",
    "AnnouncementType",
    "ABTestStatus",
    "ConsentType",
    "DataExportStatus",
    "DeletionRequestStatus",
    "VoiceGender",
    "VoiceType",
    "AudioQuality",
    "VoiceEnhancementType",
    "IndianDataSourceType",
    "IndianContentCategory",
    "EnemyTag",
    "UserJourneyStatus",
    "JourneyPace",
    "JourneyTone",
    "JourneyStatus",
    "PersonalJourneyStatus",
    # Mixins
    "SoftDeleteMixin",
    # Base class
    "Base",
    # Role permissions mapping
    "ROLE_PERMISSIONS",
    # User & Auth models
    "User",
    "UserProfile",
    "Session",
    "RefreshToken",
    # Achievement & Gamification models
    "Achievement",
    "UserAchievement",
    "Unlockable",
    "UserUnlockable",
    "UserProgress",
    # Work models
    "Work",
    # Mood models
    "Mood",
    # Journal models
    "EncryptedBlob",
    "JournalEntry",
    "JournalTag",
    "JournalEntryTag",
    "JournalVersion",
    "JournalSearchIndex",
    # Content models
    "ContentPack",
    # Wisdom & Gita models
    "WisdomVerse",
    "GitaChapter",
    "GitaSource",
    "GitaVerse",
    "GitaModernContext",
    "GitaKeyword",
    "GitaVerseKeyword",
    "GitaVerseUsage",
    # KIAAN Learning System models
    "ContentSourceType",
    "ValidationStatus",
    "LearnedWisdom",
    "UserQueryPattern",
    "ContentSourceRegistry",
    # Subscription models
    "SubscriptionPlan",
    "UserSubscription",
    "UsageTracking",
    "Payment",
    # Admin models
    "AdminUser",
    "AdminPermissionAssignment",
    "AdminSession",
    "AdminAuditLog",
    "FeatureFlag",
    "Announcement",
    "ABTest",
    "ABTestAssignment",
    "ABTestConversion",
    "FlaggedContent",
    # KIAAN Analytics
    "KiaanUsageAnalytics",
    # Compliance & GDPR models
    "UserConsent",
    "CookiePreference",
    "DataExportRequest",
    "DeletionRequest",
    "ComplianceAuditLog",
    # Chat models
    "ChatRoom",
    "RoomParticipant",
    "ChatMessage",
    "ChatTranslation",
    # Emotional & Analysis models
    "EmotionalResetSession",
    "UserEmotionalLog",
    "UserDailyAnalysis",
    "UserWeeklyReflection",
    "UserAssessment",
    # User Journey & Progress models
    "UserVerseBookmark",
    "UserJourneyProgress",
    # Wisdom Journey models
    "WisdomJourney",
    "JourneyStep",
    "JourneyRecommendation",
    # Voice models
    "UserVoicePreferences",
    "VoiceConversation",
    "VoiceAnalytics",
    "VoiceQualityMetrics",
    "VoiceWakeWordEvent",
    "VoiceEnhancementSession",
    "VoiceDailyCheckin",
    # Indian Wisdom models
    "IndianWisdomContent",
    "YogaAsanaDB",
    "PranayamaTechniqueDB",
    "MeditationPracticeDB",
    "AyurvedicPracticeDB",
    "IndianSourceFetchLog",
    # Journey Template models
    "JourneyTemplate",
    "JourneyTemplateStep",
    "UserJourney",
    "UserJourneyStepState",
    # AI Provider models
    "AIProviderConfig",
    # KIAAN Chat models
    "KiaanChatMessage",
    "KiaanChatSession",
    # Personal Journey
    "PersonalJourney",
]
