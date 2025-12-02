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
    kiaan_questions_monthly: int = Field(default=10, ge=-1)  # -1 = unlimited
    encrypted_journal: bool = False
    data_retention_days: int = Field(default=30, ge=1)


class UserSubscriptionOut(BaseModel):
    """Output schema for a user's subscription."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    plan: SubscriptionPlanOut
    status: SubscriptionStatus
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False
    canceled_at: datetime | None = None
    created_at: datetime


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
    """Input schema for creating a Stripe checkout session."""
    
    plan_tier: SubscriptionTier
    billing_period: str = Field(default="monthly", pattern="^(monthly|yearly)$")
    success_url: str | None = None
    cancel_url: str | None = None


class CheckoutSessionOut(BaseModel):
    """Output schema for a Stripe checkout session."""
    
    checkout_url: str
    session_id: str


class WebhookEvent(BaseModel):
    """Schema for incoming Stripe webhook events."""
    
    type: str
    data: dict[str, Any]


class SubscriptionCancelRequest(BaseModel):
    """Input schema for canceling a subscription."""
    
    cancel_immediately: bool = False
    reason: str | None = None
