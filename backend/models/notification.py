"""Notification models: push notification subscriptions and delivery tracking.

Supports FCM (Firebase Cloud Messaging) and Web Push.
Tracks delivery state so we can retry failed notifications
and measure engagement.
"""

from __future__ import annotations

import datetime
import enum
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


class NotificationChannel(str, enum.Enum):
    """Delivery channel for the notification."""

    PUSH = "push"
    EMAIL = "email"
    IN_APP = "in_app"


class NotificationStatus(str, enum.Enum):
    """Lifecycle state of a notification."""

    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"


class PushSubscription(Base):
    """A user's registered push notification endpoint.

    Each device/browser gets its own subscription. Users can have
    multiple subscriptions (phone + laptop + tablet).
    """

    __tablename__ = "push_subscriptions"

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    # FCM registration token or Web Push endpoint URL
    endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    # Web Push auth keys (p256dh + auth), stored as JSON
    keys: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Device identification for managing multiple subscriptions
    device_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Active flag — set to False when endpoint becomes invalid
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_used_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )


class NotificationTemplate(Base):
    """Reusable notification templates for common triggers.

    Examples: daily check-in reminder, journey step reminder,
    streak encouragement, etc.
    """

    __tablename__ = "notification_templates"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title_template: Mapped[str] = mapped_column(String(256))
    body_template: Mapped[str] = mapped_column(Text)
    # Default icon and action URL
    icon: Mapped[str | None] = mapped_column(String(256), nullable=True)
    action_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Channel preference
    channel: Mapped[str] = mapped_column(
        String(20), default=NotificationChannel.PUSH.value
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class Notification(SoftDeleteMixin, Base):
    """Individual notification sent to a user.

    Tracks the full lifecycle: created → sent → delivered → read.
    Soft-deleted so we never lose engagement data.
    """

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    template_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("notification_templates.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Rendered content (after template variable substitution)
    title: Mapped[str] = mapped_column(String(256))
    body: Mapped[str] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(String(256), nullable=True)
    action_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Delivery tracking
    channel: Mapped[str] = mapped_column(
        String(20), default=NotificationChannel.PUSH.value
    )
    status: Mapped[str] = mapped_column(
        String(20), default=NotificationStatus.PENDING.value, index=True
    )
    # Timestamps for lifecycle tracking
    scheduled_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    sent_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    delivered_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    read_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    failed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Retry tracking
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class NotificationPreference(Base):
    """Per-user notification preferences.

    Users can opt in/out of specific notification types.
    """

    __tablename__ = "notification_preferences"

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    # Global toggle
    push_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    # Per-category toggles
    daily_checkin_reminder: Mapped[bool] = mapped_column(Boolean, default=True)
    journey_step_reminder: Mapped[bool] = mapped_column(Boolean, default=True)
    streak_encouragement: Mapped[bool] = mapped_column(Boolean, default=True)
    weekly_reflection: Mapped[bool] = mapped_column(Boolean, default=True)
    community_activity: Mapped[bool] = mapped_column(Boolean, default=False)
    # Quiet hours (UTC)
    quiet_hours_start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quiet_hours_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
