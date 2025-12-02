from __future__ import annotations
import datetime
import enum
import uuid
from decimal import Decimal
from sqlalchemy import Boolean, JSON, TIMESTAMP, ForeignKey, Integer, String, Text, func, Numeric, Enum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class SubscriptionTier(str, enum.Enum):
    """Subscription tier levels."""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    """Status of a user's subscription."""
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    EXPIRED = "expired"
    TRIALING = "trialing"


class PaymentStatus(str, enum.Enum):
    """Status of a payment."""
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"

class SoftDeleteMixin:
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, default=None
    )

    def soft_delete(self) -> None:
        self.deleted_at = datetime.datetime.now(datetime.UTC)

    def restore(self) -> None:
        self.deleted_at = None

    @classmethod
    def not_deleted(cls, query):
        return query.filter(cls.deleted_at.is_(None))

class Base(DeclarativeBase):
    pass

class User(SoftDeleteMixin, Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    auth_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(256), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=True)
    locale: Mapped[str] = mapped_column(String(8), default="en")
    two_factor_secret: Mapped[str | None] = mapped_column(
        String(64), nullable=True, default=None
    )
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class Work(SoftDeleteMixin, Base):
    __tablename__ = "works"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserProfile(SoftDeleteMixin, Base):
    __tablename__ = "user_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    full_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    base_experience: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

class Mood(SoftDeleteMixin, Base):
    __tablename__ = "moods"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[int] = mapped_column(Integer)
    tags: Mapped[dict | None] = mapped_column(JSON)
    note: Mapped[str | None] = mapped_column(Text)
    at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

class EncryptedBlob(SoftDeleteMixin, Base):
    __tablename__ = "journal_blobs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    blob_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

class ContentPack(SoftDeleteMixin, Base):
    __tablename__ = "content_packs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    locale: Mapped[str] = mapped_column(String(8), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

class WisdomVerse(SoftDeleteMixin, Base):
    __tablename__ = "wisdom_verses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    verse_id: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    chapter: Mapped[int] = mapped_column(Integer)
    verse_number: Mapped[int] = mapped_column(Integer)
    theme: Mapped[str] = mapped_column(String(128))
    english: Mapped[str] = mapped_column(Text)
    hindi: Mapped[str] = mapped_column(Text)
    sanskrit: Mapped[str] = mapped_column(Text)
    context: Mapped[str] = mapped_column(Text)
    mental_health_applications: Mapped[dict] = mapped_column(JSON)
    embedding: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Domain tagging for psychological categorization
    primary_domain: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    secondary_domains: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

class GitaChapter(Base):
    __tablename__ = "gita_chapters"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chapter_number: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    sanskrit_name: Mapped[str] = mapped_column(String(256))
    english_name: Mapped[str] = mapped_column(String(256))
    verse_count: Mapped[int] = mapped_column(Integer)
    themes: Mapped[list[str]] = mapped_column(JSON)
    mental_health_relevance: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

class GitaSource(Base):
    __tablename__ = "gita_sources"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    credibility_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

class GitaVerse(Base):
    __tablename__ = "gita_verses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chapter: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("gita_chapters.chapter_number", ondelete="CASCADE"),
        index=True,
    )
    verse: Mapped[int] = mapped_column(Integer, index=True)
    sanskrit: Mapped[str] = mapped_column(Text)
    transliteration: Mapped[str | None] = mapped_column(Text, nullable=True)
    hindi: Mapped[str] = mapped_column(Text)
    english: Mapped[str] = mapped_column(Text)
    word_meanings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    principle: Mapped[str] = mapped_column(String(256))
    theme: Mapped[str] = mapped_column(String(256), index=True)
    source_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("gita_sources.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

class GitaModernContext(Base):
    __tablename__ = "gita_modern_contexts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    verse_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_verses.id", ondelete="CASCADE"), index=True
    )
    application_area: Mapped[str] = mapped_column(String(256), index=True)
    description: Mapped[str] = mapped_column(Text)
    examples: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    mental_health_benefits: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

class GitaKeyword(Base):
    __tablename__ = "gita_keywords"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    keyword: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

class GitaVerseKeyword(Base):
    __tablename__ = "gita_verse_keywords"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    verse_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_verses.id", ondelete="CASCADE"), index=True
    )
    keyword_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_keywords.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

class Session(Base):
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_used_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    session_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("sessions.id", ondelete="CASCADE"), index=True
    )
    token_hash: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(timezone=True))
    rotated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    parent_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("refresh_tokens.id", ondelete="SET NULL"), nullable=True
    )
    reuse_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    rotated_to_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


# =============================================================================
# Subscription System Models
# =============================================================================

class SubscriptionPlan(Base):
    """Defines available subscription plans/tiers."""
    __tablename__ = "subscription_plans"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tier: Mapped[SubscriptionTier] = mapped_column(
        Enum(SubscriptionTier, native_enum=False, length=32), unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(64))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_monthly: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    price_yearly: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    stripe_price_id_monthly: Mapped[str | None] = mapped_column(String(128), nullable=True)
    stripe_price_id_yearly: Mapped[str | None] = mapped_column(String(128), nullable=True)
    features: Mapped[dict] = mapped_column(JSON, default=dict)
    kiaan_questions_monthly: Mapped[int] = mapped_column(Integer, default=10)
    encrypted_journal: Mapped[bool] = mapped_column(Boolean, default=False)
    data_retention_days: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserSubscription(SoftDeleteMixin, Base):
    """Tracks a user's active subscription."""
    __tablename__ = "user_subscriptions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    plan_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subscription_plans.id", ondelete="RESTRICT"), index=True
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, native_enum=False, length=32), default=SubscriptionStatus.ACTIVE, index=True
    )
    stripe_customer_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    current_period_start: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    current_period_end: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    canceled_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )
    
    # Relationships
    plan: Mapped["SubscriptionPlan"] = relationship("SubscriptionPlan", lazy="joined")


class UsageTracking(Base):
    """Tracks feature usage (e.g., KIAAN questions) per user per month."""
    __tablename__ = "usage_tracking"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    feature: Mapped[str] = mapped_column(String(64), index=True)  # e.g., "kiaan_questions"
    period_start: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), index=True
    )
    period_end: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(timezone=True))
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    usage_limit: Mapped[int] = mapped_column(Integer, default=10)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class Payment(SoftDeleteMixin, Base):
    """Records payment transactions."""
    __tablename__ = "payments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    subscription_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("user_subscriptions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True, index=True
    )
    stripe_invoice_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(3), default="usd")
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False, length=32), default=PaymentStatus.PENDING, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


# =============================================================================
# Enterprise Admin System Models
# =============================================================================

class AdminRole(str, enum.Enum):
    """Admin role levels with hierarchical permissions."""
    SUPER_ADMIN = "super_admin"  # Full system access
    ADMIN = "admin"  # Most admin capabilities
    MODERATOR = "moderator"  # Content moderation
    SUPPORT = "support"  # User support
    ANALYST = "analyst"  # Read-only analytics


class AdminPermission(str, enum.Enum):
    """Granular permissions for RBAC."""
    # User Management
    USERS_VIEW = "users:view"
    USERS_EDIT = "users:edit"
    USERS_SUSPEND = "users:suspend"
    USERS_DELETE = "users:delete"
    # Subscription Management
    SUBSCRIPTIONS_VIEW = "subscriptions:view"
    SUBSCRIPTIONS_MODIFY = "subscriptions:modify"
    PAYMENTS_REFUND = "payments:refund"
    # Content Moderation
    MODERATION_VIEW = "moderation:view"
    MODERATION_ACTION = "moderation:action"
    # Feature Flags
    FEATURE_FLAGS_VIEW = "feature_flags:view"
    FEATURE_FLAGS_MANAGE = "feature_flags:manage"
    # Announcements
    ANNOUNCEMENTS_VIEW = "announcements:view"
    ANNOUNCEMENTS_MANAGE = "announcements:manage"
    # A/B Tests
    AB_TESTS_VIEW = "ab_tests:view"
    AB_TESTS_MANAGE = "ab_tests:manage"
    # Audit Logs
    AUDIT_LOGS_VIEW = "audit_logs:view"
    # Data Export
    DATA_EXPORT = "data:export"
    # Admin Management
    ADMIN_MANAGE = "admin:manage"
    # KIAAN (Read-only)
    KIAAN_ANALYTICS_VIEW = "kiaan:analytics_view"


# Role to permission mapping
ROLE_PERMISSIONS: dict[AdminRole, list[AdminPermission]] = {
    AdminRole.SUPER_ADMIN: list(AdminPermission),  # All permissions
    AdminRole.ADMIN: [
        AdminPermission.USERS_VIEW,
        AdminPermission.USERS_EDIT,
        AdminPermission.USERS_SUSPEND,
        AdminPermission.SUBSCRIPTIONS_VIEW,
        AdminPermission.SUBSCRIPTIONS_MODIFY,
        AdminPermission.PAYMENTS_REFUND,
        AdminPermission.MODERATION_VIEW,
        AdminPermission.MODERATION_ACTION,
        AdminPermission.FEATURE_FLAGS_VIEW,
        AdminPermission.FEATURE_FLAGS_MANAGE,
        AdminPermission.ANNOUNCEMENTS_VIEW,
        AdminPermission.ANNOUNCEMENTS_MANAGE,
        AdminPermission.AB_TESTS_VIEW,
        AdminPermission.AB_TESTS_MANAGE,
        AdminPermission.AUDIT_LOGS_VIEW,
        AdminPermission.DATA_EXPORT,
        AdminPermission.KIAAN_ANALYTICS_VIEW,
    ],
    AdminRole.MODERATOR: [
        AdminPermission.USERS_VIEW,
        AdminPermission.MODERATION_VIEW,
        AdminPermission.MODERATION_ACTION,
        AdminPermission.ANNOUNCEMENTS_VIEW,
        AdminPermission.ANNOUNCEMENTS_MANAGE,
        AdminPermission.KIAAN_ANALYTICS_VIEW,
    ],
    AdminRole.SUPPORT: [
        AdminPermission.USERS_VIEW,
        AdminPermission.USERS_EDIT,
        AdminPermission.SUBSCRIPTIONS_VIEW,
        AdminPermission.MODERATION_VIEW,
        AdminPermission.KIAAN_ANALYTICS_VIEW,
    ],
    AdminRole.ANALYST: [
        AdminPermission.USERS_VIEW,
        AdminPermission.SUBSCRIPTIONS_VIEW,
        AdminPermission.AB_TESTS_VIEW,
        AdminPermission.AUDIT_LOGS_VIEW,
        AdminPermission.KIAAN_ANALYTICS_VIEW,
    ],
}


class AdminAuditAction(str, enum.Enum):
    """Types of admin audit log actions."""
    # Authentication
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"
    # User Management
    USER_VIEWED = "user_viewed"
    USER_SUSPENDED = "user_suspended"
    USER_REACTIVATED = "user_reactivated"
    USER_DELETED = "user_deleted"
    # Subscription Management
    SUBSCRIPTION_VIEWED = "subscription_viewed"
    SUBSCRIPTION_MODIFIED = "subscription_modified"
    PAYMENT_REFUNDED = "payment_refunded"
    # Moderation
    CONTENT_FLAGGED = "content_flagged"
    CONTENT_APPROVED = "content_approved"
    CONTENT_REJECTED = "content_rejected"
    # Feature Flags
    FEATURE_FLAG_CREATED = "feature_flag_created"
    FEATURE_FLAG_UPDATED = "feature_flag_updated"
    FEATURE_FLAG_DELETED = "feature_flag_deleted"
    # Announcements
    ANNOUNCEMENT_CREATED = "announcement_created"
    ANNOUNCEMENT_UPDATED = "announcement_updated"
    ANNOUNCEMENT_DELETED = "announcement_deleted"
    # A/B Tests
    AB_TEST_CREATED = "ab_test_created"
    AB_TEST_UPDATED = "ab_test_updated"
    AB_TEST_DELETED = "ab_test_deleted"
    # Data Export
    DATA_EXPORTED = "data_exported"
    # Admin Management
    ADMIN_CREATED = "admin_created"
    ADMIN_UPDATED = "admin_updated"
    ADMIN_DELETED = "admin_deleted"


class ModerationStatus(str, enum.Enum):
    """Status of flagged content moderation."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AnnouncementType(str, enum.Enum):
    """Type of announcement display."""
    BANNER = "banner"
    MODAL = "modal"
    TOAST = "toast"
    EMAIL = "email"


class ABTestStatus(str, enum.Enum):
    """Status of an A/B test."""
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class AdminUser(SoftDeleteMixin, Base):
    """Admin users with MFA and role-based access."""
    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(256))
    full_name: Mapped[str] = mapped_column(String(256))
    role: Mapped[AdminRole] = mapped_column(
        Enum(AdminRole, native_enum=False, length=32),
        default=AdminRole.SUPPORT,
        index=True
    )
    # MFA - Required for admin login
    mfa_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_backup_codes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # IP Whitelisting
    ip_whitelist: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_login_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class AdminPermissionAssignment(Base):
    """Additional permission assignments beyond role defaults."""
    __tablename__ = "admin_permission_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="CASCADE"), index=True
    )
    permission: Mapped[AdminPermission] = mapped_column(
        Enum(AdminPermission, native_enum=False, length=64)
    )
    granted: Mapped[bool] = mapped_column(Boolean, default=True)  # True=grant, False=revoke
    granted_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class AdminSession(Base):
    """Admin session tracking with expiration."""
    __tablename__ = "admin_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    admin_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="CASCADE"), index=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_activity_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(timezone=True))
    revoked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )


class AdminAuditLog(Base):
    """Immutable audit log for all admin actions."""
    __tablename__ = "admin_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"),
        nullable=True, index=True
    )
    action: Mapped[AdminAuditAction] = mapped_column(
        Enum(AdminAuditAction, native_enum=False, length=64), index=True
    )
    resource_type: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    resource_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


class FeatureFlag(SoftDeleteMixin, Base):
    """Feature flags for gradual rollout and targeting."""
    __tablename__ = "feature_flags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Toggle state
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    # Gradual rollout (0-100%)
    rollout_percentage: Mapped[int] = mapped_column(Integer, default=100)
    # Targeting rules
    target_tiers: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    target_user_ids: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Metadata
    created_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class Announcement(SoftDeleteMixin, Base):
    """System announcements with targeting and scheduling."""
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(256))
    content: Mapped[str] = mapped_column(Text)
    type: Mapped[AnnouncementType] = mapped_column(
        Enum(AnnouncementType, native_enum=False, length=32), default=AnnouncementType.BANNER
    )
    # Targeting
    target_tiers: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    target_user_ids: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Scheduling
    starts_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    ends_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Metadata
    created_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class ABTest(SoftDeleteMixin, Base):
    """A/B testing experiments."""
    __tablename__ = "ab_tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Variants configuration
    variants: Mapped[list[dict]] = mapped_column(JSON)  # [{name, weight}, ...]
    # Traffic allocation (0-100%)
    traffic_percentage: Mapped[int] = mapped_column(Integer, default=100)
    # Status
    status: Mapped[ABTestStatus] = mapped_column(
        Enum(ABTestStatus, native_enum=False, length=32),
        default=ABTestStatus.DRAFT,
        index=True
    )
    # Targeting
    target_tiers: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Schedule
    starts_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    ends_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    # Metadata
    created_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class ABTestAssignment(Base):
    """Tracks user assignments to A/B test variants."""
    __tablename__ = "ab_test_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ab_tests.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    variant: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class ABTestConversion(Base):
    """Tracks conversion events for A/B tests."""
    __tablename__ = "ab_test_conversions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ab_tests.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    variant: Mapped[str] = mapped_column(String(64))
    event_name: Mapped[str] = mapped_column(String(128), index=True)
    event_value: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class FlaggedContent(SoftDeleteMixin, Base):
    """Content moderation queue."""
    __tablename__ = "flagged_content"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    content_type: Mapped[str] = mapped_column(String(64), index=True)  # journal, feedback, etc.
    content_id: Mapped[str] = mapped_column(String(255), index=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    reason: Mapped[str] = mapped_column(String(256))
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Moderation
    status: Mapped[ModerationStatus] = mapped_column(
        Enum(ModerationStatus, native_enum=False, length=32),
        default=ModerationStatus.PENDING,
        index=True
    )
    moderated_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    moderated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    moderation_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Metadata
    flagged_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class KiaanUsageAnalytics(Base):
    """Aggregated KIAAN usage analytics (read-only for admin)."""
    __tablename__ = "kiaan_usage_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), index=True
    )
    # Aggregated counts (no personal data)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    unique_users: Mapped[int] = mapped_column(Integer, default=0)
    # Topic trends (aggregated, anonymized)
    topic_distribution: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Tier breakdown
    questions_by_tier: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Response metrics
    avg_response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    satisfaction_avg: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
