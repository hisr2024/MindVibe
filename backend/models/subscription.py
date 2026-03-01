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


class PaymentProvider(str, enum.Enum):
    """Payment provider used for a transaction."""

    STRIPE_CARD = "stripe_card"
    STRIPE_PAYPAL = "stripe_paypal"
    RAZORPAY_UPI = "razorpay_upi"
    FREE = "free"


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
    razorpay_plan_id_monthly: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )
    razorpay_plan_id_yearly: Mapped[str | None] = mapped_column(
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
    razorpay_subscription_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    razorpay_customer_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    payment_provider: Mapped[str] = mapped_column(
        String(32), default="stripe", index=True
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


class SubscriptionLinkStatus(str, enum.Enum):
    """Status of a Razorpay subscription link."""

    CREATED = "created"
    AUTHENTICATED = "authenticated"
    ACTIVE = "active"
    PENDING = "pending"
    HALTED = "halted"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    EXPIRED = "expired"


class SubscriptionLink(SoftDeleteMixin, Base):
    """Tracks Razorpay subscription links created by admins.

    Each record maps to a Razorpay subscription object that includes
    a shareable short_url for customer checkout. Admins create these
    links through the admin panel and share them with users.
    """

    __tablename__ = "subscription_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    razorpay_subscription_id: Mapped[str] = mapped_column(
        String(128), unique=True, index=True
    )
    razorpay_plan_id: Mapped[str] = mapped_column(String(128), index=True)
    plan_tier: Mapped[SubscriptionTier] = mapped_column(
        Enum(SubscriptionTier, native_enum=False, length=32), index=True
    )
    billing_period: Mapped[str] = mapped_column(String(16), default="monthly")
    short_url: Mapped[str] = mapped_column(String(512))
    status: Mapped[SubscriptionLinkStatus] = mapped_column(
        Enum(SubscriptionLinkStatus, native_enum=False, length=32),
        default=SubscriptionLinkStatus.CREATED,
        index=True,
    )
    total_count: Mapped[int] = mapped_column(Integer, default=0)
    start_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    expire_by: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    offer_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    addons_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_admin_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, index=True
    )
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
    payment_provider: Mapped[str] = mapped_column(
        String(32), default="stripe_card", index=True
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True, index=True
    )
    stripe_invoice_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    razorpay_payment_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True, index=True
    )
    razorpay_order_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    paypal_order_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True, index=True
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
