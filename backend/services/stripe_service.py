"""Stripe integration service for payment processing.

This service handles:
- Customer creation
- Checkout session creation
- Subscription management (create, cancel, update)
- Webhook signature verification
- Webhook event handlers

SECURITY: Never store credit card data directly. All payment data is handled by Stripe.
"""

import logging
import os
from datetime import datetime, UTC
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    User,
    SubscriptionPlan,
    UserSubscription,
    Payment,
    SubscriptionTier,
    SubscriptionStatus,
    PaymentStatus,
)
from backend.services.subscription_service import (
    get_user_subscription,
    get_plan_by_tier,
    upgrade_subscription,
    update_subscription_status,
)

logger = logging.getLogger(__name__)

# Stripe SDK import - optional for environments without Stripe
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    stripe = None  # type: ignore
    STRIPE_AVAILABLE = False
    logger.warning("Stripe SDK not installed. Payment features will be disabled.")


def _get_stripe_keys() -> tuple[str, str, str]:
    """Get Stripe API keys from environment variables."""
    return (
        os.getenv("STRIPE_SECRET_KEY", ""),
        os.getenv("STRIPE_PUBLISHABLE_KEY", ""),
        os.getenv("STRIPE_WEBHOOK_SECRET", ""),
    )


def is_stripe_configured() -> bool:
    """Check if Stripe is properly configured."""
    secret_key, _, _ = _get_stripe_keys()
    return STRIPE_AVAILABLE and bool(secret_key)


def _init_stripe() -> None:
    """Initialize Stripe with the secret key."""
    if not STRIPE_AVAILABLE:
        raise RuntimeError("Stripe SDK is not installed")
    
    secret_key, _, _ = _get_stripe_keys()
    if not secret_key:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured")
    
    stripe.api_key = secret_key


# =============================================================================
# Customer Management
# =============================================================================

async def create_stripe_customer(
    db: AsyncSession,
    user: User,
) -> Optional[str]:
    """Create a Stripe customer for a user.
    
    Args:
        db: Database session.
        user: The user to create a customer for.
        
    Returns:
        str: The Stripe customer ID, or None if creation failed.
    """
    if not is_stripe_configured():
        logger.warning("Stripe not configured. Skipping customer creation.")
        return None
    
    try:
        _init_stripe()
        
        customer = stripe.Customer.create(
            email=user.email,
            metadata={
                "user_id": str(user.id),
                "auth_uid": user.auth_uid,
            },
        )
        
        # Update the subscription with the customer ID
        subscription = await get_user_subscription(db, user.id)
        if subscription:
            subscription.stripe_customer_id = customer.id
            await db.commit()
        
        logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
        return customer.id
        
    except Exception as e:
        logger.error(f"Failed to create Stripe customer for user {user.id}: {e}")
        return None


async def get_or_create_stripe_customer(
    db: AsyncSession,
    user: User,
) -> Optional[str]:
    """Get existing Stripe customer ID or create a new one.
    
    Args:
        db: Database session.
        user: The user.
        
    Returns:
        str: The Stripe customer ID, or None.
    """
    subscription = await get_user_subscription(db, user.id)
    if subscription and subscription.stripe_customer_id:
        return subscription.stripe_customer_id
    
    return await create_stripe_customer(db, user)


# =============================================================================
# Checkout Session
# =============================================================================

async def create_checkout_session(
    db: AsyncSession,
    user: User,
    plan_tier: SubscriptionTier,
    billing_period: str = "monthly",
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None,
) -> Optional[dict[str, str]]:
    """Create a Stripe checkout session for subscription purchase.
    
    Args:
        db: Database session.
        user: The user purchasing the subscription.
        plan_tier: The subscription tier to purchase.
        billing_period: "monthly" or "yearly".
        success_url: URL to redirect on success.
        cancel_url: URL to redirect on cancel.
        
    Returns:
        dict with checkout_url and session_id, or None if creation failed.
    """
    if not is_stripe_configured():
        logger.warning("Stripe not configured. Cannot create checkout session.")
        return None
    
    # Get the plan
    plan = await get_plan_by_tier(db, plan_tier)
    if not plan:
        raise ValueError(f"Plan not found for tier: {plan_tier}")
    
    # Get the appropriate price ID
    price_id = (
        plan.stripe_price_id_yearly if billing_period == "yearly"
        else plan.stripe_price_id_monthly
    )
    
    if not price_id:
        raise ValueError(f"No Stripe price ID configured for {plan_tier} ({billing_period})")
    
    try:
        _init_stripe()
        
        # Get or create customer
        customer_id = await get_or_create_stripe_customer(db, user)
        
        # Default URLs - require FRONTEND_URL in production
        frontend_url = os.getenv("FRONTEND_URL")
        if not frontend_url:
            environment = os.getenv("ENVIRONMENT", "development")
            if environment == "production":
                raise ValueError("FRONTEND_URL environment variable is required in production")
            frontend_url = "http://localhost:3000"
            logger.warning("FRONTEND_URL not set, using localhost (development only)")
        if not success_url:
            success_url = f"{frontend_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
        if not cancel_url:
            cancel_url = f"{frontend_url}/subscription/cancel"
        
        # Create checkout session
        session_params: dict[str, Any] = {
            "mode": "subscription",
            "payment_method_types": ["card"],
            "line_items": [{"price": price_id, "quantity": 1}],
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {
                "user_id": str(user.id),
                "plan_tier": plan_tier.value,
                "billing_period": billing_period,
            },
        }
        
        if customer_id:
            session_params["customer"] = customer_id
        else:
            session_params["customer_email"] = user.email
        
        session = stripe.checkout.Session.create(**session_params)
        
        logger.info(
            f"Created checkout session {session.id} for user {user.id}, "
            f"plan {plan_tier}, period {billing_period}"
        )
        
        return {
            "checkout_url": session.url,
            "session_id": session.id,
        }
        
    except Exception as e:
        logger.error(f"Failed to create checkout session: {e}")
        raise


# =============================================================================
# Subscription Management
# =============================================================================

async def cancel_subscription(
    db: AsyncSession,
    user_id: str,
    cancel_immediately: bool = False,
) -> bool:
    """Cancel a user's subscription.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        cancel_immediately: If True, cancel now. If False, cancel at period end.
        
    Returns:
        bool: True if cancellation was successful.
    """
    subscription = await get_user_subscription(db, user_id)
    if not subscription:
        logger.warning(f"No subscription found for user {user_id}")
        return False
    
    # Cancel in Stripe if we have a subscription ID
    if is_stripe_configured() and subscription.stripe_subscription_id:
        try:
            _init_stripe()
            
            if cancel_immediately:
                stripe.Subscription.delete(subscription.stripe_subscription_id)
            else:
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=True,
                )
                
            logger.info(
                f"Canceled Stripe subscription {subscription.stripe_subscription_id} "
                f"for user {user_id} (immediate: {cancel_immediately})"
            )
        except Exception as e:
            logger.error(f"Failed to cancel Stripe subscription: {e}")
            # Continue with local cancellation even if Stripe fails
    
    # Update local subscription status
    if cancel_immediately:
        await update_subscription_status(db, user_id, SubscriptionStatus.CANCELED)
    else:
        await update_subscription_status(
            db, user_id, SubscriptionStatus.ACTIVE, cancel_at_period_end=True
        )
    
    return True


# =============================================================================
# Webhook Handling
# =============================================================================

def verify_webhook_signature(payload: bytes, signature: str) -> Optional[dict]:
    """Verify and parse a Stripe webhook event.
    
    Args:
        payload: The raw request body.
        signature: The Stripe-Signature header value.
        
    Returns:
        dict: The parsed event, or None if verification failed.
    """
    if not is_stripe_configured():
        logger.warning("Stripe not configured. Cannot verify webhook.")
        return None
    
    _, _, webhook_secret = _get_stripe_keys()
    if not webhook_secret:
        logger.warning("STRIPE_WEBHOOK_SECRET not configured")
        return None
    
    try:
        _init_stripe()
        event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
        return event
    except stripe.SignatureVerificationError as e:
        logger.error(f"Webhook signature verification failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Failed to parse webhook event: {e}")
        return None


async def handle_webhook_event(db: AsyncSession, event: dict) -> bool:
    """Handle a verified Stripe webhook event.
    
    Args:
        db: Database session.
        event: The parsed Stripe event.
        
    Returns:
        bool: True if the event was handled successfully.
    """
    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})
    
    logger.info(f"Processing webhook event: {event_type}")
    
    handlers = {
        "checkout.session.completed": _handle_checkout_completed,
        "customer.subscription.created": _handle_subscription_created,
        "customer.subscription.updated": _handle_subscription_updated,
        "customer.subscription.deleted": _handle_subscription_deleted,
        "invoice.payment_succeeded": _handle_payment_succeeded,
        "invoice.payment_failed": _handle_payment_failed,
    }
    
    handler = handlers.get(event_type)
    if handler:
        return await handler(db, data)
    
    logger.info(f"Unhandled webhook event type: {event_type}")
    return True


async def _handle_checkout_completed(db: AsyncSession, data: dict) -> bool:
    """Handle checkout.session.completed event."""
    metadata = data.get("metadata", {})
    user_id = metadata.get("user_id")
    plan_tier = metadata.get("plan_tier")
    
    if not user_id or not plan_tier:
        logger.warning("Checkout completed but missing user_id or plan_tier in metadata")
        return False
    
    # user_id is already a string from Stripe metadata (we store it as str(user.id) in checkout session)
    # No int() conversion needed since User.id is now String type in the database
    tier = SubscriptionTier(plan_tier)
    plan = await get_plan_by_tier(db, tier)
    
    if not plan:
        logger.error(f"Plan not found for tier: {tier}")
        return False
    
    # Update subscription
    await upgrade_subscription(
        db,
        user_id,
        plan.id,
        stripe_subscription_id=data.get("subscription"),
        stripe_customer_id=data.get("customer"),
    )
    
    logger.info(f"Checkout completed for user {user_id}, upgraded to {tier}")
    return True


async def _handle_subscription_created(db: AsyncSession, data: dict) -> bool:
    """Handle customer.subscription.created event."""
    # This is usually handled by checkout.session.completed
    logger.info(f"Subscription created: {data.get('id')}")
    return True


async def _handle_subscription_updated(db: AsyncSession, data: dict) -> bool:
    """Handle customer.subscription.updated event."""
    subscription_id = data.get("id")
    status = data.get("status")
    cancel_at_period_end = data.get("cancel_at_period_end", False)
    
    # Find the subscription by Stripe ID
    from sqlalchemy import select
    stmt = select(UserSubscription).where(
        UserSubscription.stripe_subscription_id == subscription_id
    )
    result = await db.execute(stmt)
    subscription = result.scalars().first()
    
    if not subscription:
        logger.warning(f"No local subscription found for Stripe subscription {subscription_id}")
        return True
    
    # Map Stripe status to our status
    status_map = {
        "active": SubscriptionStatus.ACTIVE,
        "past_due": SubscriptionStatus.PAST_DUE,
        "canceled": SubscriptionStatus.CANCELED,
        "trialing": SubscriptionStatus.TRIALING,
    }
    
    new_status = status_map.get(status, SubscriptionStatus.ACTIVE)
    await update_subscription_status(
        db, subscription.user_id, new_status, cancel_at_period_end
    )
    
    logger.info(f"Subscription {subscription_id} updated to status {status}")
    return True


async def _handle_subscription_deleted(db: AsyncSession, data: dict) -> bool:
    """Handle customer.subscription.deleted event."""
    subscription_id = data.get("id")
    
    from sqlalchemy import select
    stmt = select(UserSubscription).where(
        UserSubscription.stripe_subscription_id == subscription_id
    )
    result = await db.execute(stmt)
    subscription = result.scalars().first()
    
    if not subscription:
        logger.warning(f"No local subscription found for deleted Stripe subscription {subscription_id}")
        return True
    
    # Downgrade to free tier
    free_plan = await get_plan_by_tier(db, SubscriptionTier.FREE)
    if free_plan:
        await upgrade_subscription(db, subscription.user_id, free_plan.id)
    
    logger.info(f"Subscription {subscription_id} deleted, user downgraded to free tier")
    return True


async def _handle_payment_succeeded(db: AsyncSession, data: dict) -> bool:
    """Handle invoice.payment_succeeded event."""
    customer_id = data.get("customer")
    amount_paid = data.get("amount_paid", 0) / 100  # Stripe amounts are in cents
    invoice_id = data.get("id")
    payment_intent = data.get("payment_intent")
    
    # Find user by customer ID
    from sqlalchemy import select
    stmt = select(UserSubscription).where(
        UserSubscription.stripe_customer_id == customer_id
    )
    result = await db.execute(stmt)
    subscription = result.scalars().first()
    
    if not subscription:
        logger.warning(f"No subscription found for customer {customer_id}")
        return True
    
    # Record the payment
    payment = Payment(
        user_id=subscription.user_id,
        subscription_id=subscription.id,
        stripe_payment_intent_id=payment_intent,
        stripe_invoice_id=invoice_id,
        amount=Decimal(str(amount_paid)),
        currency="usd",
        status=PaymentStatus.SUCCEEDED,
        description=f"Subscription payment for {subscription.plan.tier.value if subscription.plan else 'unknown'} tier",
    )
    db.add(payment)
    await db.commit()
    
    logger.info(f"Payment succeeded: ${amount_paid} for user {subscription.user_id}")
    return True


async def _handle_payment_failed(db: AsyncSession, data: dict) -> bool:
    """Handle invoice.payment_failed event."""
    customer_id = data.get("customer")
    invoice_id = data.get("id")
    
    from sqlalchemy import select
    stmt = select(UserSubscription).where(
        UserSubscription.stripe_customer_id == customer_id
    )
    result = await db.execute(stmt)
    subscription = result.scalars().first()
    
    if not subscription:
        logger.warning(f"No subscription found for customer {customer_id}")
        return True
    
    # Update subscription status to past_due
    await update_subscription_status(db, subscription.user_id, SubscriptionStatus.PAST_DUE)
    
    # Record the failed payment
    payment = Payment(
        user_id=subscription.user_id,
        subscription_id=subscription.id,
        stripe_invoice_id=invoice_id,
        amount=Decimal("0"),
        currency="usd",
        status=PaymentStatus.FAILED,
        description="Failed subscription payment",
    )
    db.add(payment)
    await db.commit()
    
    logger.warning(f"Payment failed for user {subscription.user_id}")
    return True
