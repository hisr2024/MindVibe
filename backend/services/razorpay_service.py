"""Razorpay integration service for UPI payment processing.

This service handles:
- Razorpay order creation for UPI payments
- Payment signature verification (HMAC-SHA256)
- Webhook signature verification and event handling
- Subscription cancellation via Razorpay API

SECURITY: Razorpay handles all payment data. We only store order IDs and payment IDs.
UPI is only available when currency is INR.
"""

import hashlib
import hmac
import logging
import os
from datetime import datetime, UTC
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    User,
    SubscriptionPlan,
    UserSubscription,
    Payment,
    SubscriptionTier,
    SubscriptionStatus,
    PaymentStatus,
    SubscriptionLink,
    SubscriptionLinkStatus,
)
from backend.services.subscription_service import (
    get_user_subscription,
    get_plan_by_tier,
    upgrade_subscription,
)

logger = logging.getLogger(__name__)

# Razorpay SDK import - optional for environments without Razorpay
try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    razorpay = None  # type: ignore
    RAZORPAY_AVAILABLE = False
    logger.warning("Razorpay SDK not installed. UPI payment features will be disabled.")


# =============================================================================
# Configuration
# =============================================================================

def _get_razorpay_keys() -> tuple[str, str, str]:
    """Get Razorpay API keys from environment variables."""
    return (
        os.getenv("RAZORPAY_KEY_ID", ""),
        os.getenv("RAZORPAY_KEY_SECRET", ""),
        os.getenv("RAZORPAY_WEBHOOK_SECRET", ""),
    )


def is_razorpay_configured() -> bool:
    """Check if Razorpay is properly configured."""
    key_id, key_secret, _ = _get_razorpay_keys()
    return RAZORPAY_AVAILABLE and bool(key_id) and bool(key_secret)


def _get_razorpay_client():
    """Get an initialized Razorpay client.

    Returns:
        razorpay.Client: Authenticated Razorpay client.

    Raises:
        RuntimeError: If Razorpay SDK is not installed or not configured.
    """
    if not RAZORPAY_AVAILABLE:
        raise RuntimeError("Razorpay SDK is not installed")

    key_id, key_secret, _ = _get_razorpay_keys()
    if not key_id or not key_secret:
        raise RuntimeError("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured")

    return razorpay.Client(auth=(key_id, key_secret))


def _get_razorpay_plan_id(tier: SubscriptionTier, billing_period: str) -> str:
    """Get the Razorpay plan ID for a given tier and billing period.

    Args:
        tier: The subscription tier.
        billing_period: "monthly" or "yearly".

    Returns:
        str: The Razorpay plan ID from environment variables.

    Raises:
        ValueError: If no plan ID is configured for the given tier/period.
    """
    tier_name = tier.value.upper()
    period_name = billing_period.upper()
    env_key = f"RAZORPAY_{tier_name}_{period_name}_PLAN_ID"
    plan_id = os.getenv(env_key, "")

    if not plan_id:
        raise ValueError(
            f"No Razorpay plan ID configured for {tier.value} ({billing_period}). "
            f"Set the {env_key} environment variable."
        )

    return plan_id


# =============================================================================
# Order Creation (for one-time + subscription initiation)
# =============================================================================

async def create_razorpay_order(
    db: AsyncSession,
    user: User,
    plan_tier: SubscriptionTier,
    billing_period: str = "monthly",
) -> dict[str, Any]:
    """Create a Razorpay order for UPI payment.

    Creates a one-time order that initiates the payment flow. After payment
    confirmation via webhook, the subscription is activated.

    Args:
        db: Database session.
        user: The user purchasing the subscription.
        plan_tier: The subscription tier to purchase.
        billing_period: "monthly" or "yearly".

    Returns:
        dict with order details for the frontend Razorpay SDK:
        - order_id: Razorpay order ID
        - razorpay_key_id: Public key for the frontend SDK
        - amount: Amount in paisa (INR smallest unit)
        - currency: "INR"
        - name: Display name for the checkout
        - description: Plan description
        - user_email: User's email for pre-fill

    Raises:
        ValueError: If plan not found or Razorpay plan not configured.
        RuntimeError: If Razorpay is not configured.
    """
    if not is_razorpay_configured():
        raise RuntimeError("Razorpay is not configured")

    plan = await get_plan_by_tier(db, plan_tier)
    if not plan:
        raise ValueError(f"Plan not found for tier: {plan_tier}")

    # Calculate INR price (use plan price directly if available)
    price_inr = _get_inr_price(plan, billing_period)

    client = _get_razorpay_client()

    order_data = {
        "amount": int(price_inr * 100),  # Amount in paisa
        "currency": "INR",
        "receipt": f"sub_{user.id}_{plan_tier.value}_{billing_period}",
        "notes": {
            "user_id": str(user.id),
            "plan_tier": plan_tier.value,
            "billing_period": billing_period,
        },
        "payment_capture": 1,  # Auto-capture payment
    }

    try:
        order = client.order.create(data=order_data)
    except Exception as e:
        logger.error(f"Failed to create Razorpay order: {e}")
        raise

    key_id, _, _ = _get_razorpay_keys()

    logger.info(
        f"Created Razorpay order {order['id']} for user {user.id}, "
        f"plan {plan_tier.value}, period {billing_period}, amount {price_inr} INR"
    )

    return {
        "order_id": order["id"],
        "razorpay_key_id": key_id,
        "amount": order["amount"],
        "currency": "INR",
        "name": "MindVibe",
        "description": f"{plan.name} - {billing_period} subscription",
        "user_email": user.email,
    }


def _get_inr_price(plan: SubscriptionPlan, billing_period: str) -> Decimal:
    """Convert USD plan price to INR with 25% discount.

    Plan prices are stored in USD. This function converts to INR using the
    same conversion logic as the frontend (useCurrency hook):
      INR = USD * 83 * (1 - 0.25)

    The result is rounded to the nearest whole rupee for clean Razorpay amounts.

    Args:
        plan: The subscription plan.
        billing_period: "monthly" or "yearly".

    Returns:
        Decimal: Price in INR (rounded to whole rupees).
    """
    INR_RATE = Decimal("83")
    INR_DISCOUNT = Decimal("0.25")

    usd_price = plan.price_monthly
    if billing_period == "yearly" and plan.price_yearly is not None:
        usd_price = plan.price_yearly

    inr_price = usd_price * INR_RATE * (Decimal("1") - INR_DISCOUNT)
    # Round to nearest whole rupee (Razorpay amounts must be in paisa, integer)
    return inr_price.quantize(Decimal("1"))


# =============================================================================
# Payment Verification
# =============================================================================

def verify_razorpay_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """Verify Razorpay payment signature after checkout.

    Razorpay sends a signature that is an HMAC-SHA256 digest of
    "order_id|payment_id" using the key secret. This is the critical
    security check to ensure the payment is authentic.

    Args:
        razorpay_order_id: The Razorpay order ID.
        razorpay_payment_id: The Razorpay payment ID.
        razorpay_signature: The signature from Razorpay.

    Returns:
        bool: True if the signature is valid.
    """
    _, key_secret, _ = _get_razorpay_keys()
    if not key_secret:
        logger.error("RAZORPAY_KEY_SECRET not configured for payment verification")
        return False

    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        key_secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected_signature, razorpay_signature)


async def activate_razorpay_subscription(
    db: AsyncSession,
    user_id: str,
    plan_tier: SubscriptionTier,
    billing_period: str,
    razorpay_payment_id: str,
    razorpay_order_id: str,
) -> bool:
    """Activate a subscription after successful Razorpay UPI payment.

    Called after payment verification succeeds. Creates a payment record
    and upgrades the user's subscription.

    This function is idempotent: if the payment has already been recorded
    (e.g., both frontend verification and webhook fired), the duplicate
    is detected and skipped gracefully.

    Args:
        db: Database session.
        user_id: The user's ID.
        plan_tier: The subscription tier purchased.
        billing_period: "monthly" or "yearly".
        razorpay_payment_id: Razorpay payment ID.
        razorpay_order_id: Razorpay order ID.

    Returns:
        bool: True if subscription was activated (or already active).
    """
    # Idempotency check: skip if this payment was already recorded.
    # Both the frontend /verify-razorpay-payment and the webhook can call
    # this function; the second caller should succeed without error.
    from sqlalchemy import select
    existing = await db.execute(
        select(Payment).where(Payment.razorpay_payment_id == razorpay_payment_id)
    )
    if existing.scalars().first():
        logger.info(
            f"Razorpay payment {razorpay_payment_id} already recorded for user {user_id}, "
            f"skipping duplicate activation"
        )
        return True

    plan = await get_plan_by_tier(db, plan_tier)
    if not plan:
        logger.error(f"Plan not found for tier: {plan_tier}")
        return False

    # Upgrade the subscription
    subscription = await upgrade_subscription(
        db,
        user_id,
        plan.id,
        razorpay_subscription_id=razorpay_payment_id,
        payment_provider="razorpay",
    )

    # Calculate the payment amount
    price_inr = _get_inr_price(plan, billing_period)

    # Record the payment
    payment = Payment(
        user_id=user_id,
        subscription_id=subscription.id,
        payment_provider="razorpay_upi",
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        amount=price_inr,
        currency="inr",
        status=PaymentStatus.SUCCEEDED,
        description=f"UPI payment for {plan_tier.value} tier ({billing_period})",
    )
    db.add(payment)
    await db.commit()

    logger.info(
        f"Activated Razorpay subscription for user {user_id}, "
        f"plan {plan_tier.value}, payment {razorpay_payment_id}"
    )
    return True


# =============================================================================
# Webhook Handling
# =============================================================================

def verify_razorpay_webhook(payload: bytes, signature: str) -> bool:
    """Verify Razorpay webhook signature.

    Razorpay signs webhook payloads with HMAC-SHA256 using the webhook secret.
    The signature is sent in the X-Razorpay-Signature header.

    Args:
        payload: The raw request body bytes.
        signature: The X-Razorpay-Signature header value.

    Returns:
        bool: True if the signature is valid.
    """
    _, _, webhook_secret = _get_razorpay_keys()
    if not webhook_secret:
        logger.error("RAZORPAY_WEBHOOK_SECRET not configured")
        return False

    expected = hmac.new(
        webhook_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


async def handle_razorpay_webhook_event(db: AsyncSession, event: dict) -> bool:
    """Handle a verified Razorpay webhook event.

    Args:
        db: Database session.
        event: The parsed Razorpay webhook event.

    Returns:
        bool: True if the event was handled successfully.
    """
    event_type = event.get("event", "")
    payload = event.get("payload", {})

    logger.info(f"Processing Razorpay webhook event: {event_type}")

    handlers = {
        "payment.captured": _handle_payment_captured,
        "payment.failed": _handle_payment_failed,
        "subscription.activated": _handle_subscription_activated,
        "subscription.charged": _handle_subscription_charged,
        "subscription.cancelled": _handle_subscription_cancelled,
    }

    handler = handlers.get(event_type)
    if handler:
        return await handler(db, payload)

    logger.info(f"Unhandled Razorpay webhook event type: {event_type}")
    return True


async def _handle_payment_captured(db: AsyncSession, payload: dict) -> bool:
    """Handle payment.captured event -- UPI payment successful.

    This fires when a payment is successfully captured. We use the notes
    attached to the payment to identify the user and plan.
    """
    payment_entity = payload.get("payment", {}).get("entity", {})
    notes = payment_entity.get("notes", {})

    user_id = notes.get("user_id")
    plan_tier_str = notes.get("plan_tier")
    billing_period = notes.get("billing_period", "monthly")

    if not user_id or not plan_tier_str:
        logger.warning("Razorpay payment captured but missing user_id or plan_tier in notes")
        return False

    razorpay_payment_id = payment_entity.get("id")
    razorpay_order_id = payment_entity.get("order_id")

    # Check if payment was already recorded (idempotency)
    from sqlalchemy import select
    existing = await db.execute(
        select(Payment).where(Payment.razorpay_payment_id == razorpay_payment_id)
    )
    if existing.scalars().first():
        logger.info(f"Razorpay payment {razorpay_payment_id} already recorded, skipping")
        return True

    tier = SubscriptionTier(plan_tier_str)
    success = await activate_razorpay_subscription(
        db, user_id, tier, billing_period,
        razorpay_payment_id, razorpay_order_id,
    )

    if success:
        logger.info(f"Razorpay payment captured for user {user_id}, upgraded to {tier.value}")
    return success


async def _handle_payment_failed(db: AsyncSession, payload: dict) -> bool:
    """Handle payment.failed event -- UPI payment failed."""
    payment_entity = payload.get("payment", {}).get("entity", {})
    notes = payment_entity.get("notes", {})

    user_id = notes.get("user_id")
    razorpay_payment_id = payment_entity.get("id")
    razorpay_order_id = payment_entity.get("order_id")

    if user_id:
        # Record the failed payment for audit trail
        # Convert paisa to rupees using Decimal to avoid float precision loss
        amount_paisa = payment_entity.get("amount", 0)
        amount_inr = Decimal(str(amount_paisa)) / Decimal("100")
        payment = Payment(
            user_id=user_id,
            payment_provider="razorpay_upi",
            razorpay_payment_id=razorpay_payment_id,
            razorpay_order_id=razorpay_order_id,
            amount=amount_inr,
            currency="inr",
            status=PaymentStatus.FAILED,
            description="Failed UPI payment",
        )
        db.add(payment)
        await db.commit()

    logger.warning(f"Razorpay payment failed for user {user_id}: {razorpay_payment_id}")
    return True


async def _handle_subscription_activated(db: AsyncSession, payload: dict) -> bool:
    """Handle subscription.activated event."""
    subscription_entity = payload.get("subscription", {}).get("entity", {})
    logger.info(f"Razorpay subscription activated: {subscription_entity.get('id')}")
    return True


async def _handle_subscription_charged(db: AsyncSession, payload: dict) -> bool:
    """Handle subscription.charged event -- recurring payment successful."""
    subscription_entity = payload.get("subscription", {}).get("entity", {})
    payment_entity = payload.get("payment", {}).get("entity", {})
    notes = subscription_entity.get("notes", {})

    user_id = notes.get("user_id")
    if not user_id:
        logger.warning("Razorpay subscription charged but missing user_id in notes")
        return True

    razorpay_payment_id = payment_entity.get("id") if payment_entity else None

    # Check idempotency
    if razorpay_payment_id:
        from sqlalchemy import select
        existing = await db.execute(
            select(Payment).where(Payment.razorpay_payment_id == razorpay_payment_id)
        )
        if existing.scalars().first():
            logger.info(f"Razorpay recurring payment {razorpay_payment_id} already recorded")
            return True

    amount_paisa = payment_entity.get("amount", 0) if payment_entity else 0
    amount = Decimal(str(amount_paisa)) / Decimal("100")

    subscription = await get_user_subscription(db, user_id)
    if subscription:
        payment = Payment(
            user_id=user_id,
            subscription_id=subscription.id,
            payment_provider="razorpay_upi",
            razorpay_payment_id=razorpay_payment_id,
            amount=amount,
            currency="inr",
            status=PaymentStatus.SUCCEEDED,
            description="Recurring UPI subscription payment",
        )
        db.add(payment)
        await db.commit()

    logger.info(f"Razorpay subscription charged for user {user_id}")
    return True


async def _handle_subscription_cancelled(db: AsyncSession, payload: dict) -> bool:
    """Handle subscription.cancelled event -- subscription canceled in Razorpay."""
    subscription_entity = payload.get("subscription", {}).get("entity", {})
    notes = subscription_entity.get("notes", {})
    razorpay_sub_id = subscription_entity.get("id")

    user_id = notes.get("user_id")
    if not user_id:
        # Try to find by Razorpay subscription ID
        from sqlalchemy import select
        stmt = select(UserSubscription).where(
            UserSubscription.razorpay_subscription_id == razorpay_sub_id
        )
        result = await db.execute(stmt)
        sub = result.scalars().first()
        if sub:
            user_id = sub.user_id

    if user_id:
        # Downgrade to free tier
        free_plan = await get_plan_by_tier(db, SubscriptionTier.FREE)
        if free_plan:
            await upgrade_subscription(db, user_id, free_plan.id, payment_provider="free")

        logger.info(f"Razorpay subscription {razorpay_sub_id} cancelled, user {user_id} downgraded")
    else:
        logger.warning(f"Razorpay subscription {razorpay_sub_id} cancelled but no user found")

    return True


# =============================================================================
# Subscription Management
# =============================================================================

# =============================================================================
# Subscription Link Creation (Razorpay Subscriptions API)
# =============================================================================

async def create_subscription_link(
    db: AsyncSession,
    plan_tier: SubscriptionTier,
    billing_period: str = "monthly",
    total_count: int = 0,
    start_at: int | None = None,
    expire_by: int | None = None,
    customer_name: str | None = None,
    customer_email: str | None = None,
    customer_phone: str | None = None,
    offer_id: str | None = None,
    addons: list[dict] | None = None,
    notes: dict | None = None,
    description: str | None = None,
    admin_id: int | None = None,
) -> dict[str, Any]:
    """Create a Razorpay subscription with a shareable payment link.

    Uses the Razorpay Subscriptions API to create a subscription object
    that includes a short_url customers can use to complete payment.
    The link is also persisted locally for admin tracking.

    Args:
        db: Database session.
        plan_tier: Which MindVibe tier to subscribe to.
        billing_period: "monthly" or "yearly".
        total_count: Number of billing cycles (0 = until cancelled).
        start_at: Unix timestamp for subscription start (None = immediate).
        expire_by: Unix timestamp when the link expires.
        customer_name: Pre-fill customer name on checkout.
        customer_email: Pre-fill customer email on checkout.
        customer_phone: Pre-fill customer phone on checkout.
        offer_id: Razorpay offer ID for discounts.
        addons: List of add-on items, each with name/amount/currency/description.
        notes: Key-value pairs attached to the subscription.
        description: Human-readable description for admin reference.
        admin_id: ID of the admin creating this link.

    Returns:
        dict with subscription link details including short_url.

    Raises:
        RuntimeError: If Razorpay is not configured.
        ValueError: If plan ID is not configured for the tier/period.
    """
    if not is_razorpay_configured():
        raise RuntimeError("Razorpay is not configured")

    razorpay_plan_id = _get_razorpay_plan_id(plan_tier, billing_period)
    client = _get_razorpay_client()

    # Build subscription creation payload
    subscription_data: dict[str, Any] = {
        "plan_id": razorpay_plan_id,
        "total_count": total_count if total_count > 0 else 6,
        "customer_notify": 1,
    }

    if start_at:
        subscription_data["start_at"] = start_at

    if expire_by:
        subscription_data["expire_by"] = expire_by

    # Add customer details for pre-filling checkout
    if customer_email or customer_phone or customer_name:
        customer_data: dict[str, str] = {}
        if customer_name:
            customer_data["name"] = customer_name
        if customer_email:
            customer_data["email"] = customer_email
        if customer_phone:
            customer_data["contact"] = customer_phone
        subscription_data["customer"] = customer_data

    # Add offer if provided
    if offer_id:
        subscription_data["offer_id"] = offer_id

    # Add add-ons: each add-on must have an item with name, amount, currency
    if addons:
        razorpay_addons = []
        for addon in addons:
            addon_item: dict[str, Any] = {
                "name": addon.get("name", "Add-on"),
                "amount": int(addon.get("amount", 0)),
                "currency": addon.get("currency", "INR"),
            }
            if addon.get("description"):
                addon_item["description"] = addon["description"]
            razorpay_addons.append({"item": addon_item})
        subscription_data["addons"] = razorpay_addons

    # Attach notes (plan_tier and billing_period always included)
    merged_notes = {
        "plan_tier": plan_tier.value,
        "billing_period": billing_period,
        "source": "admin_subscription_link",
    }
    if notes:
        merged_notes.update(notes)
    subscription_data["notes"] = merged_notes

    try:
        result = client.subscription.create(data=subscription_data)
    except Exception as e:
        logger.error(f"Failed to create Razorpay subscription link: {e}")
        raise

    short_url = result.get("short_url", "")
    razorpay_sub_id = result.get("id", "")

    # Persist locally for admin tracking
    from datetime import datetime, UTC
    link = SubscriptionLink(
        razorpay_subscription_id=razorpay_sub_id,
        razorpay_plan_id=razorpay_plan_id,
        plan_tier=plan_tier,
        billing_period=billing_period,
        short_url=short_url,
        status=SubscriptionLinkStatus(result.get("status", "created")),
        total_count=total_count if total_count > 0 else 6,
        start_at=datetime.fromtimestamp(start_at, tz=UTC) if start_at else None,
        expire_by=datetime.fromtimestamp(expire_by, tz=UTC) if expire_by else None,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        offer_id=offer_id,
        addons_json=addons,
        notes=merged_notes,
        description=description,
        created_by_admin_id=admin_id,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    logger.info(
        f"Created Razorpay subscription link {razorpay_sub_id} "
        f"for plan {plan_tier.value}/{billing_period}, short_url={short_url}"
    )

    return {
        "id": link.id,
        "razorpay_subscription_id": razorpay_sub_id,
        "razorpay_plan_id": razorpay_plan_id,
        "plan_tier": plan_tier.value,
        "billing_period": billing_period,
        "short_url": short_url,
        "status": result.get("status", "created"),
        "total_count": subscription_data["total_count"],
        "start_at": start_at,
        "expire_by": expire_by,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "offer_id": offer_id,
        "addons": addons,
        "description": description,
        "created_at": link.created_at.isoformat() if link.created_at else None,
    }


async def list_subscription_links(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    status_filter: str | None = None,
    tier_filter: str | None = None,
) -> dict[str, Any]:
    """List subscription links with optional filtering and pagination.

    Args:
        db: Database session.
        page: 1-indexed page number.
        page_size: Number of records per page.
        status_filter: Filter by link status (e.g. "created", "active").
        tier_filter: Filter by plan tier.

    Returns:
        dict with links list, total count, and pagination metadata.
    """
    from sqlalchemy import select, func

    query = select(SubscriptionLink).where(SubscriptionLink.deleted_at.is_(None))
    count_query = select(func.count(SubscriptionLink.id)).where(
        SubscriptionLink.deleted_at.is_(None)
    )

    if status_filter:
        status_enum = SubscriptionLinkStatus(status_filter)
        query = query.where(SubscriptionLink.status == status_enum)
        count_query = count_query.where(SubscriptionLink.status == status_enum)

    if tier_filter:
        tier_enum = SubscriptionTier(tier_filter)
        query = query.where(SubscriptionLink.plan_tier == tier_enum)
        count_query = count_query.where(SubscriptionLink.plan_tier == tier_enum)

    query = query.order_by(SubscriptionLink.created_at.desc())

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    links = result.scalars().all()

    return {
        "links": [
            {
                "id": link.id,
                "razorpay_subscription_id": link.razorpay_subscription_id,
                "plan_tier": link.plan_tier.value,
                "billing_period": link.billing_period,
                "short_url": link.short_url,
                "status": link.status.value,
                "total_count": link.total_count,
                "customer_name": link.customer_name,
                "customer_email": link.customer_email,
                "customer_phone": link.customer_phone,
                "offer_id": link.offer_id,
                "description": link.description,
                "created_at": link.created_at.isoformat() if link.created_at else None,
            }
            for link in links
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
    }


async def fetch_subscription_link_status(
    db: AsyncSession,
    link_id: int,
) -> dict[str, Any] | None:
    """Fetch a subscription link and refresh its status from Razorpay.

    Args:
        db: Database session.
        link_id: Local database ID of the subscription link.

    Returns:
        Updated link details, or None if not found.
    """
    from sqlalchemy import select

    stmt = select(SubscriptionLink).where(
        SubscriptionLink.id == link_id,
        SubscriptionLink.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    link = result.scalars().first()

    if not link:
        return None

    # Refresh status from Razorpay
    if is_razorpay_configured():
        try:
            client = _get_razorpay_client()
            rz_sub = client.subscription.fetch(link.razorpay_subscription_id)
            new_status = rz_sub.get("status", link.status.value)
            link.status = SubscriptionLinkStatus(new_status)
            await db.commit()
        except Exception as e:
            logger.warning(f"Could not refresh Razorpay subscription status: {e}")

    return {
        "id": link.id,
        "razorpay_subscription_id": link.razorpay_subscription_id,
        "razorpay_plan_id": link.razorpay_plan_id,
        "plan_tier": link.plan_tier.value,
        "billing_period": link.billing_period,
        "short_url": link.short_url,
        "status": link.status.value,
        "total_count": link.total_count,
        "start_at": link.start_at.isoformat() if link.start_at else None,
        "expire_by": link.expire_by.isoformat() if link.expire_by else None,
        "customer_name": link.customer_name,
        "customer_email": link.customer_email,
        "customer_phone": link.customer_phone,
        "offer_id": link.offer_id,
        "addons": link.addons_json,
        "notes": link.notes,
        "description": link.description,
        "created_at": link.created_at.isoformat() if link.created_at else None,
    }


async def cancel_subscription_link(
    db: AsyncSession,
    link_id: int,
) -> bool:
    """Cancel a subscription link (both in Razorpay and locally).

    Args:
        db: Database session.
        link_id: Local database ID of the subscription link.

    Returns:
        True if cancelled successfully.
    """
    from sqlalchemy import select

    stmt = select(SubscriptionLink).where(
        SubscriptionLink.id == link_id,
        SubscriptionLink.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    link = result.scalars().first()

    if not link:
        return False

    if link.status in (SubscriptionLinkStatus.CANCELLED, SubscriptionLinkStatus.COMPLETED):
        return True

    # Cancel in Razorpay
    if is_razorpay_configured():
        try:
            client = _get_razorpay_client()
            client.subscription.cancel(link.razorpay_subscription_id)
        except Exception as e:
            logger.error(f"Failed to cancel Razorpay subscription {link.razorpay_subscription_id}: {e}")
            return False

    link.status = SubscriptionLinkStatus.CANCELLED
    await db.commit()

    logger.info(f"Cancelled subscription link {link_id} (razorpay: {link.razorpay_subscription_id})")
    return True


# =============================================================================
# Subscription Management (existing)
# =============================================================================

async def cancel_razorpay_subscription(
    razorpay_subscription_id: str,
    cancel_immediately: bool = False,
) -> bool:
    """Cancel a Razorpay subscription.

    Args:
        razorpay_subscription_id: The Razorpay subscription ID.
        cancel_immediately: If True, cancel now. If False, cancel at cycle end.

    Returns:
        bool: True if cancellation was successful.
    """
    if not is_razorpay_configured():
        logger.warning("Razorpay not configured. Cannot cancel subscription.")
        return False

    try:
        client = _get_razorpay_client()

        if cancel_immediately:
            client.subscription.cancel(razorpay_subscription_id)
        else:
            client.subscription.cancel(
                razorpay_subscription_id,
                {"cancel_at_cycle_end": 1},
            )

        logger.info(
            f"Canceled Razorpay subscription {razorpay_subscription_id} "
            f"(immediate: {cancel_immediately})"
        )
        return True

    except Exception as e:
        logger.error(f"Failed to cancel Razorpay subscription {razorpay_subscription_id}: {e}")
        return False
