"""Compliance and GDPR models."""

from __future__ import annotations

import datetime
import enum

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class ConsentType(str, enum.Enum):
    """Types of consent."""

    PRIVACY_POLICY = "privacy_policy"
    TERMS_OF_SERVICE = "terms_of_service"
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    FUNCTIONAL_COOKIES = "functional_cookies"
    DATA_PROCESSING = "data_processing"


class DataExportStatus(str, enum.Enum):
    """Status of a data export request."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class DeletionRequestStatus(str, enum.Enum):
    """Status of an account deletion request."""

    PENDING = "pending"
    GRACE_PERIOD = "grace_period"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELED = "canceled"


class UserConsent(Base):
    """Tracks user consent preferences for GDPR compliance."""

    __tablename__ = "user_consents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    consent_type: Mapped[ConsentType] = mapped_column(
        Enum(ConsentType, native_enum=False, length=64), index=True
    )
    granted: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[str] = mapped_column(String(32), default="1.0")
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    granted_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    withdrawn_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class CookiePreference(Base):
    """Stores user cookie preferences."""

    __tablename__ = "cookie_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # For anonymous users
    anonymous_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    # Cookie categories
    necessary: Mapped[bool] = mapped_column(Boolean, default=True)  # Always required
    analytics: Mapped[bool] = mapped_column(Boolean, default=False)
    marketing: Mapped[bool] = mapped_column(Boolean, default=False)
    functional: Mapped[bool] = mapped_column(Boolean, default=False)
    # Metadata
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class DataExportRequest(Base):
    """Tracks GDPR data export requests."""

    __tablename__ = "data_export_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[DataExportStatus] = mapped_column(
        Enum(DataExportStatus, native_enum=False, length=32),
        default=DataExportStatus.PENDING,
        index=True,
    )
    format: Mapped[str] = mapped_column(String(16), default="json")  # json, csv, zip
    download_token: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True
    )
    download_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expires_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class DeletionRequest(Base):
    """Tracks account deletion requests with grace period."""

    __tablename__ = "deletion_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    status: Mapped[DeletionRequestStatus] = mapped_column(
        Enum(DeletionRequestStatus, native_enum=False, length=32),
        default=DeletionRequestStatus.PENDING,
        index=True,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Grace period (default 30 days)
    grace_period_days: Mapped[int] = mapped_column(Integer, default=30)
    grace_period_ends_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    # Notifications
    notification_sent_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    reminder_sent_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    # Completion
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    canceled_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class ComplianceAuditLog(Base):
    """Audit log for compliance-related actions (separate from admin audit logs)."""

    __tablename__ = "compliance_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(64), index=True)
    resource_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    severity: Mapped[str] = mapped_column(
        String(16), default="info"
    )  # info, warning, critical
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
