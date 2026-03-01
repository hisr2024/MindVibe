"""Pydantic schemas for subscription-related endpoints."""

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from backend.models import SubscriptionTier, SubscriptionStatus


class SubscriptionPlanOut(BaseModel):
    """Output schema for a subscription plan."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    tier: SubscriptionTier
    name: str
    description: str | None = None
    price_monthly: Decimal
    price_yearly: Decimal | None = None
    features: dict[str, Any]
    kiaan_questions_monthly: int
    encrypted_journal: bool
    data_retention_days: int


class SubscriptionPlanCreate(BaseModel):
    """Schema for creating a subscription plan (admin use)."""
    
    tier: SubscriptionTier
    name: str = Field(..., max_length=64)
    description: str | None = None
    price_monthly: Decimal = Field(ge=0)
    price_yearly: Decimal | None = Field(default=None, ge=0)
    stripe_price_id_monthly: str | None = None
    stripe_price_id_yearly: str | None = None
    features: dict[str, Any] = Field(default_factory=dict)
    kiaan_questions_monthly: int = Field(default=20, ge=-1)  # -1 = unlimited
    encrypted_journal: bool = False
    data_retention_days: int = Field(default=30, ge=1)


class UserSubscriptionOut(BaseModel):
    """Output schema for a user's subscription."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    plan: SubscriptionPlanOut
    status: SubscriptionStatus
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False
    canceled_at: datetime | None = None
    created_at: datetime
    is_developer: bool = False
    effective_tier: SubscriptionTier | None = None


class UsageStatsOut(BaseModel):
    """Output schema for usage statistics."""
    
    feature: str
    period_start: datetime
    period_end: datetime
    usage_count: int
    usage_limit: int
    remaining: int
    is_unlimited: bool


class CheckoutSessionCreate(BaseModel):
    """Input schema for creating a checkout session (Stripe or Razorpay)."""

    plan_tier: SubscriptionTier
    billing_period: str = Field(default="monthly", pattern="^(monthly|yearly)$")
    payment_method: str = Field(
        default="card",
        pattern="^(card|paypal|upi)$",
        description="Payment method: 'card' (Stripe), 'paypal' (Stripe), or 'upi' (Razorpay)",
    )
    currency: str = Field(
        default="usd",
        pattern="^(usd|eur|inr)$",
        description="Currency for the checkout session",
    )
    success_url: str | None = None
    cancel_url: str | None = None


class CheckoutSessionOut(BaseModel):
    """Output schema for a checkout session (provider-agnostic).

    When provider="stripe": checkout_url and session_id are populated.
    When provider="razorpay": order_id, razorpay_key_id, amount, etc. are populated.
    """

    provider: str = "stripe"

    # Stripe fields (present when provider="stripe")
    checkout_url: str | None = None
    session_id: str | None = None

    # Razorpay fields (present when provider="razorpay")
    order_id: str | None = None
    razorpay_key_id: str | None = None
    amount: int | None = None
    currency: str | None = None
    name: str | None = None
    description: str | None = None
    user_email: str | None = None


class RazorpayPaymentVerification(BaseModel):
    """Input schema for verifying a Razorpay payment after frontend checkout."""

    razorpay_order_id: str = Field(..., min_length=1, max_length=128)
    razorpay_payment_id: str = Field(..., min_length=1, max_length=128)
    razorpay_signature: str = Field(..., min_length=1, max_length=256)
    plan_tier: SubscriptionTier
    billing_period: str = Field(default="monthly", pattern="^(monthly|yearly)$")


class PaymentOut(BaseModel):
    """Output schema for a payment transaction record.

    Represents a single payment with provider details and status.
    Used in the payment history endpoint to display all transactions.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_provider: str
    amount: Decimal
    currency: str
    status: str
    description: str | None = None
    stripe_payment_intent_id: str | None = None
    stripe_invoice_id: str | None = None
    razorpay_payment_id: str | None = None
    razorpay_order_id: str | None = None
    paypal_order_id: str | None = None
    created_at: datetime


class PaymentHistoryOut(BaseModel):
    """Output schema for paginated payment history.

    Contains the list of payments plus metadata for pagination
    and summary statistics.
    """

    payments: list[PaymentOut]
    total: int
    page: int
    page_size: int
    has_more: bool


class WebhookEvent(BaseModel):
    """Schema for incoming Stripe webhook events."""

    type: str
    data: dict[str, Any]


class SubscriptionCancelRequest(BaseModel):
    """Input schema for canceling a subscription."""

    cancel_immediately: bool = False
    reason: str | None = None
