"""
Backend models package.

This package contains all SQLAlchemy model definitions for the MindVibe backend.
Models are organized into domain-specific files and re-exported here for
convenient imports.
"""

# Base infrastructure
from backend.models.base import (
    Base,
    SoftDeleteMixin,
    SubscriptionTier,
)

# User & profile models
from backend.models.user import (
    User,
    UserProfile,
    Work,
    UserProgress,
)

# Authentication models
from backend.models.auth import (
    Session,
    RefreshToken,
)

# Achievement & gamification models
from backend.models.achievements import (
    AchievementCategory,
    AchievementRarity,
    UnlockableType,
    Achievement,
    UserAchievement,
    Unlockable,
    UserUnlockable,
)

# Mood models
from backend.models.mood import (
    Mood,
)

# Journal models
from backend.models.journal import (
    EncryptedBlob,
    JournalEntry,
    JournalTag,
    JournalEntryTag,
    JournalVersion,
    JournalSearchIndex,
)

# Wisdom & Gita models
from backend.models.wisdom import (
    ContentPack,
    WisdomVerse,
    GitaChapter,
    GitaSource,
    GitaVerse,
    GitaModernContext,
    GitaKeyword,
    GitaVerseKeyword,
    GitaVerseUsage,
)

# AI / KIAAN models
from backend.models.ai import (
    ContentSourceType,
    ValidationStatus,
    LearnedWisdom,
    UserQueryPattern,
    ContentSourceRegistry,
    KiaanUsageAnalytics,
    KiaanChatMessage,
    KiaanChatSession,
    AIProviderConfig,
)

# Journey models
from backend.models.journeys import (
    JourneyStatus,
    UserJourneyStatus,
    JourneyPace,
    JourneyTone,
    EnemyTag,
    PersonalJourneyStatus,
    WisdomJourney,
    JourneyStep,
    JourneyRecommendation,
    JourneyTemplate,
    JourneyTemplateStep,
    UserJourney,
    UserJourneyStepState,
    UserJourneyProgress,
    PersonalJourney,
)

# Voice models
from backend.models.voice import (
    VoiceGender,
    VoiceType,
    AudioQuality,
    VoiceEnhancementType,
    UserVoicePreferences,
    VoiceConversation,
    VoiceAnalytics,
    VoiceQualityMetrics,
    VoiceWakeWordEvent,
    VoiceEnhancementSession,
    VoiceDailyCheckin,
)

# Subscription models
from backend.models.subscription import (
    SubscriptionStatus,
    PaymentStatus,
    SubscriptionPlan,
    UserSubscription,
    UsageTracking,
    Payment,
)

# Admin models
from backend.models.admin import (
    AdminRole,
    AdminPermission,
    AdminAuditAction,
    ModerationStatus,
    AnnouncementType,
    ABTestStatus,
    ROLE_PERMISSIONS,
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
)

# Compliance & GDPR models
from backend.models.compliance import (
    ConsentType,
    DataExportStatus,
    DeletionRequestStatus,
    UserConsent,
    CookiePreference,
    DataExportRequest,
    DeletionRequest,
    ComplianceAuditLog,
)

# Chat models
from backend.models.chat import (
    ChatRoom,
    RoomParticipant,
    ChatMessage,
    ChatTranslation,
)

# Companion (KIAAN Best Friend) models
from backend.models.companion import (
    CompanionMood,
    ConversationPhase,
    CompanionSession,
    CompanionMessage,
    CompanionMemory,
    CompanionProfile,
)

# Emotional & analysis models
from backend.models.emotional import (
    EmotionalResetSession,
    UserEmotionalLog,
    UserDailyAnalysis,
    UserWeeklyReflection,
    UserAssessment,
    UserVerseBookmark,
)

# Indian wellness models
from backend.models.indian_wellness import (
    IndianDataSourceType,
    IndianContentCategory,
    IndianWisdomContent,
    YogaAsanaDB,
    PranayamaTechniqueDB,
    MeditationPracticeDB,
    AyurvedicPracticeDB,
    IndianSourceFetchLog,
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
    # Companion (KIAAN Best Friend) models
    "CompanionMood",
    "ConversationPhase",
    "CompanionSession",
    "CompanionMessage",
    "CompanionMemory",
    "CompanionProfile",
]
