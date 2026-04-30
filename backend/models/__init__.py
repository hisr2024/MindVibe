"""
Backend models package.

This package contains all SQLAlchemy model definitions for the MindVibe backend.
Models are organized into domain-specific files and re-exported here for
convenient imports.
"""

# Base infrastructure
# Achievement & gamification models
from backend.models.achievements import (
    Achievement,
    AchievementCategory,
    AchievementRarity,
    Unlockable,
    UnlockableType,
    UserAchievement,
    UserUnlockable,
)

# Admin models
from backend.models.admin import (
    ROLE_PERMISSIONS,
    ABTest,
    ABTestAssignment,
    ABTestConversion,
    ABTestStatus,
    AdminAuditAction,
    AdminAuditLog,
    AdminPermission,
    AdminPermissionAssignment,
    AdminRole,
    AdminSession,
    AdminUser,
    Announcement,
    AnnouncementType,
    FeatureFlag,
    FlaggedContent,
    ModerationStatus,
)

# AI / KIAAN models
from backend.models.ai import (
    AIProviderConfig,
    ContentSourceRegistry,
    ContentSourceType,
    KiaanChatMessage,
    KiaanChatSession,
    KiaanUsageAnalytics,
    LearnedWisdom,
    UserQueryPattern,
    ValidationStatus,
)

# Authentication models
from backend.models.auth import (
    EmailVerificationToken,
    PasswordResetToken,
    RefreshToken,
    Session,
)
from backend.models.base import (
    Base,
    SoftDeleteMixin,
    SubscriptionTier,
)

# Chat models
from backend.models.chat import (
    ChatMessage,
    ChatRoom,
    ChatTranslation,
    RoomParticipant,
)

# Companion (KIAAN Best Friend) models
from backend.models.companion import (
    CompanionMemory,
    CompanionMessage,
    CompanionMood,
    CompanionProfile,
    CompanionSession,
    ConversationPhase,
)

# Compliance & GDPR models
from backend.models.compliance import (
    ComplianceAuditLog,
    ConsentType,
    CookiePreference,
    DataExportRequest,
    DataExportStatus,
    DeletionRequest,
    DeletionRequestStatus,
    UserConsent,
)

# Emotional & analysis models
from backend.models.emotional import (
    EmotionalResetSession,
    UserAssessment,
    UserDailyAnalysis,
    UserEmotionalLog,
    UserVerseBookmark,
    UserWeeklyReflection,
)

# Feedback models
from backend.models.feedback import (
    FeedbackRating,
    FeedbackSummaryCache,
)

# Indian wellness models
from backend.models.indian_wellness import (
    AyurvedicPracticeDB,
    IndianContentCategory,
    IndianDataSourceType,
    IndianSourceFetchLog,
    IndianWisdomContent,
    MeditationPracticeDB,
    PranayamaTechniqueDB,
    YogaAsanaDB,
)

# Journal models
from backend.models.journal import (
    EncryptedBlob,
    JournalEntry,
    JournalEntryTag,
    JournalSearchIndex,
    JournalTag,
    JournalVersion,
)

# Journey models
from backend.models.journeys import (
    EnemyTag,
    JourneyPace,
    JourneyRecommendation,
    JourneyStatus,
    JourneyStep,
    JourneyTemplate,
    JourneyTemplateStep,
    JourneyTone,
    PersonalJourney,
    PersonalJourneyStatus,
    UserJourney,
    UserJourneyProgress,
    UserJourneyStatus,
    UserJourneyStepState,
    WisdomJourney,
)

# KarmaLytix models
from backend.models.karmalytix import (
    KarmaLytixReport,
    KarmaPattern,
    KarmaScore,
)

# Mood models
from backend.models.mood import (
    Mood,
)

# Notification models
from backend.models.notification import (
    Notification,
    NotificationChannel,
    NotificationPreference,
    NotificationStatus,
    NotificationTemplate,
    PushSubscription,
)

# Unified privacy request audit trail (GDPR v1 API)
from backend.models.privacy import (
    PrivacyRequest,
)

# KIAAN Self-Sufficiency models
from backend.models.self_sufficiency import (
    CompositionTemplate,
    ConversationFlowSnapshot,
    VerseApplicationEdge,
    WisdomAtom,
)

# Subscription models
from backend.models.subscription import (
    Payment,
    PaymentProvider,
    PaymentStatus,
    SubscriptionLink,
    SubscriptionLinkStatus,
    SubscriptionPlan,
    SubscriptionStatus,
    UsageTracking,
    UserSubscription,
)

# Team & collaboration models
from backend.models.team import (
    TEAM_ROLE_PERMISSIONS,
    InvitationStatus,
    Team,
    TeamAuditLog,
    TeamInvitation,
    TeamMember,
    TeamPermission,
    TeamRole,
)

# User & profile models
from backend.models.user import (
    User,
    UserProfile,
    UserProgress,
    UserSettings,
    Work,
)

# Voice models
from backend.models.voice import (
    AudioQuality,
    UserVoicePreferences,
    VoiceAnalytics,
    VoiceConversation,
    VoiceDailyCheckin,
    VoiceEnhancementSession,
    VoiceEnhancementType,
    VoiceGender,
    VoiceQualityMetrics,
    VoiceType,
    VoiceWakeWordEvent,
)

# WebAuthn (biometric) models
from backend.models.webauthn import (
    WebAuthnCredential,
)

# Wisdom & Gita models
from backend.models.wisdom import (
    ContentPack,
    GitaChapter,
    GitaKeyword,
    GitaModernContext,
    GitaPracticalWisdom,
    GitaSource,
    GitaVerse,
    GitaVerseKeyword,
    GitaVerseUsage,
    WisdomEffectiveness,
    WisdomVerse,
)

__all__ = [
    # Enums
    "SubscriptionTier",
    "SubscriptionStatus",
    "PaymentStatus",
    "PaymentProvider",
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
    "UserSettings",
    "Session",
    "RefreshToken",
    "PasswordResetToken",
    "EmailVerificationToken",
    "WebAuthnCredential",
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
    "GitaPracticalWisdom",
    "GitaKeyword",
    "GitaVerseKeyword",
    "GitaVerseUsage",
    "WisdomEffectiveness",
    # KIAAN Learning System models
    "ContentSourceType",
    "ValidationStatus",
    "LearnedWisdom",
    "UserQueryPattern",
    "ContentSourceRegistry",
    # Subscription models
    "SubscriptionLinkStatus",
    "SubscriptionPlan",
    "UserSubscription",
    "UsageTracking",
    "Payment",
    "SubscriptionLink",
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
    "PrivacyRequest",
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
    # KIAAN Self-Sufficiency models
    "WisdomAtom",
    "VerseApplicationEdge",
    "ConversationFlowSnapshot",
    "CompositionTemplate",
    # Personal Journey
    "PersonalJourney",
    # Companion (KIAAN Best Friend) models
    "CompanionMood",
    "ConversationPhase",
    "CompanionSession",
    "CompanionMessage",
    "CompanionMemory",
    "CompanionProfile",
    # Feedback models
    "FeedbackRating",
    "FeedbackSummaryCache",
    # Notification models
    "NotificationChannel",
    "NotificationStatus",
    "PushSubscription",
    "NotificationTemplate",
    "Notification",
    "NotificationPreference",
    # Team & collaboration models
    "TeamRole",
    "TeamPermission",
    "InvitationStatus",
    "TEAM_ROLE_PERMISSIONS",
    "Team",
    "TeamMember",
    "TeamInvitation",
    "TeamAuditLog",
    # KarmaLytix models
    "KarmaLytixReport",
    "KarmaPattern",
    "KarmaScore",
]
