"""Subscription and payment models."""

from __future__ import annotations

import datetime
import enum
from decimal import Decimal

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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base, SoftDeleteMixin, SubscriptionTier


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
    stripe_price_id_monthly: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )
    stripe_price_id_yearly: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )
    features: Mapped[dict] = mapped_column(JSON, default=dict)
    kiaan_questions_monthly: Mapped[int] = mapped_column(Integer, default=20)
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
        Enum(SubscriptionStatus, native_enum=False, length=32),
        default=SubscriptionStatus.ACTIVE,
        index=True,
    )
    stripe_customer_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
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
    plan: Mapped[SubscriptionPlan] = relationship("SubscriptionPlan", lazy="joined")


class UsageTracking(Base):
    """Tracks feature usage (e.g., KIAAN questions) per user per month."""

    __tablename__ = "usage_tracking"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    feature: Mapped[str] = mapped_column(
        String(64), index=True
    )  # e.g., "kiaan_questions"
    period_start: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), index=True
    )
    period_end: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(timezone=True))
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    usage_limit: Mapped[int] = mapped_column(Integer, default=20)
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
        Integer,
        ForeignKey("user_subscriptions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True, index=True
    )
    stripe_invoice_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(3), default="usd")
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False, length=32),
        default=PaymentStatus.PENDING,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )
