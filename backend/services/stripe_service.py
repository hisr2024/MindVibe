"""Stripe sandbox integration helpers."""
from __future__ import annotations

import secrets
from typing import Any

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.models import StripeCustomer, Subscription, SubscriptionEvent, SubscriptionPlan


class StripeGateway:
    """Small wrapper around stripe-python with a graceful sandbox fallback."""

    def __init__(self, api_key: str | None):
        self.enabled = bool(api_key)
        if self.enabled:
            stripe.api_key = api_key

    def create_customer(self, email: str | None, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.enabled:
            return {"id": f"test_cus_{secrets.token_hex(6)}"}
        return stripe.Customer.create(email=email, metadata=metadata or {})

    def create_subscription(self, customer_id: str, price_id: str | None) -> dict[str, Any]:
        if not self.enabled:
            return {
                "id": f"test_sub_{secrets.token_hex(6)}",
                "status": "trialing",
            }
        if not price_id:
            raise ValueError("Stripe price id is required when Stripe is enabled")
        return stripe.Subscription.create(customer=customer_id, items=[{"price": price_id}])


gateway = StripeGateway(settings.STRIPE_SECRET_KEY)


async def ensure_customer(
    db: AsyncSession, user_id: str, email: str | None
) -> StripeCustomer:
    existing = await db.execute(select(StripeCustomer).where(StripeCustomer.user_id == user_id))
    customer = existing.scalars().first()
    if customer:
        return customer

    created = gateway.create_customer(email=email, metadata={"user_id": user_id})
    customer = StripeCustomer(user_id=user_id, customer_id=created["id"], email=email)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


async def create_subscription(
    db: AsyncSession, user_id: str, plan_code: str, metadata: dict[str, Any] | None = None
) -> Subscription:
    plan_result = await db.execute(
        select(SubscriptionPlan).where(
            SubscriptionPlan.code == plan_code, SubscriptionPlan.active.is_(True)
        )
    )
    plan = plan_result.scalars().first()
    if not plan:
        raise ValueError(f"Subscription plan '{plan_code}' not found or inactive")

    customer = await ensure_customer(db, user_id=user_id, email=None)
    stripe_sub = gateway.create_subscription(customer.customer_id, plan.stripe_price_id)
    subscription = Subscription(
        user_id=user_id,
        plan_id=plan.id,
        status=stripe_sub.get("status", "active"),
        stripe_subscription_id=stripe_sub.get("id"),
        subscription_metadata=metadata or {},
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    return subscription


async def record_subscription_event(
    db: AsyncSession, subscription_id: int | None, event_type: str, payload: dict[str, Any]
) -> SubscriptionEvent:
    event = SubscriptionEvent(
        subscription_id=subscription_id,
        event_type=event_type,
        payload=payload,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


__all__ = [
    "gateway",
    "create_subscription",
    "ensure_customer",
    "record_subscription_event",
    "StripeGateway",
]
