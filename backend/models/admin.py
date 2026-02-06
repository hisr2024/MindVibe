"""Admin system models: roles, permissions, audit logs, feature flags, A/B tests."""

from __future__ import annotations

import datetime
import enum
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


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
        index=True,
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
    granted: Mapped[bool] = mapped_column(
        Boolean, default=True
    )  # True=grant, False=revoke
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
        String(255),
        ForeignKey("admin_users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[AdminAuditAction] = mapped_column(
        Enum(AdminAuditAction, native_enum=False, length=64), index=True
    )
    resource_type: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    resource_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
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
        Enum(AnnouncementType, native_enum=False, length=32),
        default=AnnouncementType.BANNER,
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
        index=True,
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
    content_type: Mapped[str] = mapped_column(
        String(64), index=True
    )  # journal, feedback, etc.
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
        index=True,
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
