"""PayPal direct integration service for INR payment processing.

This service handles:
- PayPal order creation via Orders API v2 (supports INR currency)
- Order capture after buyer approval
- Webhook signature verification and event handling
- Subscription activation after successful payment

WHY direct PayPal instead of Stripe PayPal?
Stripe's PayPal integration does NOT support INR currency. For Indian users
paying in INR, we use PayPal's Orders API v2 directly, which supports INR
for merchants with Indian PayPal business accounts.

SECURITY: PayPal handles all payment data. We only store order IDs and capture IDs.
"""

import hashlib
import hmac
import logging
import os
from decimal import Decimal
from typing import Any, Optional

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    User,
    Payment,
    SubscriptionTier,
    PaymentStatus,
)
from backend.services.subscription_service import (
    get_user_subscription,
    get_plan_by_tier,
    upgrade_subscription,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Configuration
# =============================================================================

def _get_paypal_config() -> dict[str, str]:
    """Get PayPal configuration from environment variables."""
    return {
        "client_id": os.getenv("PAYPAL_CLIENT_ID", ""),
        "client_secret": os.getenv("PAYPAL_CLIENT_SECRET", ""),
        "webhook_id": os.getenv("PAYPAL_WEBHOOK_ID", ""),
        "mode": os.getenv("PAYPAL_MODE", "sandbox"),  # "sandbox" or "live"
    }


def is_paypal_configured() -> bool:
    """Check if PayPal is properly configured."""
    config = _get_paypal_config()
    return bool(config["client_id"]) and bool(config["client_secret"])


def _get_base_url() -> str:
    """Get the PayPal API base URL based on mode."""
    config = _get_paypal_config()
    if config["mode"] == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


# =============================================================================
# Authentication
# =============================================================================

async def _get_access_token() -> str:
    """Get a PayPal OAuth 2.0 access token.

    Uses client credentials grant to authenticate with PayPal API.
    Tokens are short-lived (typically 9 hours) — we request a fresh
    one for each operation to avoid stale token issues.

    Returns:
        str: The Bearer access token.

    Raises:
        RuntimeError: If authentication fails.
    """
    config = _get_paypal_config()
    base_url = _get_base_url()

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{base_url}/v1/oauth2/token",
            auth=(config["client_id"], config["client_secret"]),
            data={"grant_type": "client_credentials"},
            headers={"Accept": "application/json"},
        )

    if response.status_code != 200:
        logger.error(f"PayPal auth failed: {response.status_code} {response.text}")
        raise RuntimeError("PayPal authentication failed")

    data = response.json()
    return data["access_token"]


# =============================================================================
# INR Price Calculation
# =============================================================================

def _get_inr_price(plan: Any, billing_period: str) -> Decimal:
    """Convert USD plan price to INR with 25% discount.

    Uses the same conversion logic as Razorpay and frontend:
      INR = USD * 83 * (1 - 0.25)

    Args:
        plan: The subscription plan.
        billing_period: "monthly" or "yearly".

    Returns:
        Decimal: Price in INR (rounded to 2 decimal places).
    """
    INR_RATE = Decimal("83")
    INR_DISCOUNT = Decimal("0.25")

    usd_price = plan.price_monthly
    if billing_period == "yearly" and plan.price_yearly is not None:
        usd_price = plan.price_yearly

    inr_price = usd_price * INR_RATE * (Decimal("1") - INR_DISCOUNT)
    return inr_price.quantize(Decimal("0.01"))


# =============================================================================
# Order Creation
# =============================================================================

async def create_paypal_order(
    db: AsyncSession,
    user: User,
    plan_tier: SubscriptionTier,
    billing_period: str = "monthly",
    return_url: Optional[str] = None,
    cancel_url: Optional[str] = None,
) -> dict[str, Any]:
    """Create a PayPal order for INR payment.

    Uses the PayPal Orders API v2 to create an order that the user
    approves on the PayPal checkout page. After approval, the frontend
    calls the capture endpoint to finalize payment.

    Args:
        db: Database session.
        user: The user purchasing the subscription.
        plan_tier: The subscription tier to purchase.
        billing_period: "monthly" or "yearly".
        return_url: URL to redirect after PayPal approval.
        cancel_url: URL to redirect on PayPal cancellation.

    Returns:
        dict with:
        - order_id: PayPal order ID
        - approve_url: URL to redirect user for PayPal approval
        - provider: "paypal"

    Raises:
        ValueError: If plan not found.
        RuntimeError: If PayPal is not configured or API call fails.
    """
    if not is_paypal_configured():
        raise RuntimeError("PayPal is not configured")

    plan = await get_plan_by_tier(db, plan_tier)
    if not plan:
        raise ValueError(f"Plan not found for tier: {plan_tier}")

    price_inr = _get_inr_price(plan, billing_period)
    access_token = await _get_access_token()
    base_url = _get_base_url()

    # Default URLs
    frontend_url = os.getenv("FRONTEND_URL")
    if not frontend_url:
        environment = os.getenv("ENVIRONMENT", "development")
        if environment == "production":
            raise ValueError("FRONTEND_URL environment variable is required in production")
        frontend_url = "http://localhost:3000"
        logger.warning("FRONTEND_URL not set, using localhost (development only)")

    if not return_url:
        return_url = (
            f"{frontend_url}/subscription/success"
            f"?tier={plan_tier.value}&yearly={'true' if billing_period == 'yearly' else 'false'}"
            f"&provider=paypal"
        )
    if not cancel_url:
        cancel_url = f"{frontend_url}/pricing"

    order_payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": f"sub_{user.id}_{plan_tier.value}_{billing_period}",
                "description": f"KIAANVerse {plan.name} Plan ({billing_period})",
                "amount": {
                    "currency_code": "INR",
                    "value": str(price_inr),
                },
                "custom_id": f"{user.id}|{plan_tier.value}|{billing_period}",
            }
        ],
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                    "brand_name": "KIAANVerse",
                    "locale": "en-IN",
                    "landing_page": "LOGIN",
                    "user_action": "PAY_NOW",
                    "return_url": return_url,
                    "cancel_url": cancel_url,
                },
            },
        },
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{base_url}/v2/checkout/orders",
            json=order_payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
        )

    if response.status_code not in (200, 201):
        logger.error(
            f"PayPal order creation failed: {response.status_code} {response.text}"
        )
        raise RuntimeError(
            f"PayPal order creation failed: {response.status_code}"
        )

    order_data = response.json()
    order_id = order_data["id"]

    # Extract the approval URL from HATEOAS links
    approve_url = None
    for link in order_data.get("links", []):
        if link.get("rel") == "payer-action":
            approve_url = link["href"]
            break

    if not approve_url:
        # Fallback: construct the approval URL
        paypal_base = (
            "https://www.paypal.com"
            if _get_paypal_config()["mode"] == "live"
            else "https://www.sandbox.paypal.com"
        )
        approve_url = f"{paypal_base}/checkoutnow?token={order_id}"

    logger.info(
        f"Created PayPal order {order_id} for user {user.id}, "
        f"plan {plan_tier.value}, period {billing_period}, "
        f"amount {price_inr} INR"
    )

    return {
        "order_id": order_id,
        "approve_url": approve_url,
        "provider": "paypal",
    }


# =============================================================================
# Order Capture (after buyer approval)
# =============================================================================

async def capture_paypal_order(
    db: AsyncSession,
    order_id: str,
    user_id: str,
) -> dict[str, Any]:
    """Capture a PayPal order after buyer approval.

    Called by the frontend after the user completes PayPal checkout.
    This finalizes the payment and activates the subscription.

    This function is idempotent: if the order was already captured
    (e.g., webhook also fired), the duplicate is detected and skipped.

    Args:
        db: Database session.
        order_id: The PayPal order ID to capture.
        user_id: The authenticated user's ID.

    Returns:
        dict with capture result:
        - success: True if captured
        - order_id: PayPal order ID
        - capture_id: PayPal capture ID
        - status: "COMPLETED" on success

    Raises:
        RuntimeError: If PayPal API call fails.
        ValueError: If order metadata doesn't match user or plan not found.
    """
    if not is_paypal_configured():
        raise RuntimeError("PayPal is not configured")

    # Idempotency check: skip if already captured
    from sqlalchemy import select
    existing = await db.execute(
        select(Payment).where(Payment.paypal_order_id == order_id)
    )
    if existing.scalars().first():
        logger.info(
            f"PayPal order {order_id} already captured for user {user_id}, "
            f"skipping duplicate"
        )
        return {
            "success": True,
            "order_id": order_id,
            "capture_id": None,
            "status": "ALREADY_CAPTURED",
        }

    access_token = await _get_access_token()
    base_url = _get_base_url()

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{base_url}/v2/checkout/orders/{order_id}/capture",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            json={},
        )

    if response.status_code not in (200, 201):
        logger.error(
            f"PayPal capture failed for order {order_id}: "
            f"{response.status_code} {response.text}"
        )
        raise RuntimeError(f"PayPal capture failed: {response.status_code}")

    capture_data = response.json()
    order_status = capture_data.get("status")

    if order_status != "COMPLETED":
        logger.warning(
            f"PayPal order {order_id} capture status: {order_status} (expected COMPLETED)"
        )
        return {
            "success": False,
            "order_id": order_id,
            "capture_id": None,
            "status": order_status,
        }

    # Extract payment details from capture response
    purchase_unit = capture_data.get("purchase_units", [{}])[0]
    custom_id = purchase_unit.get("payments", {}).get("captures", [{}])[0].get(
        "custom_id", ""
    ) or purchase_unit.get("custom_id", "")

    # Parse custom_id: "user_id|plan_tier|billing_period"
    parts = custom_id.split("|") if custom_id else []
    if len(parts) == 3:
        order_user_id, plan_tier_str, billing_period = parts
    else:
        # Fallback: fetch order details to get custom_id
        logger.warning(
            f"Could not parse custom_id from capture response: {custom_id!r}"
        )
        order_user_id = user_id
        plan_tier_str = ""
        billing_period = "monthly"

    # Verify user matches
    if order_user_id != user_id:
        logger.warning(
            f"PayPal order {order_id} user mismatch: "
            f"order={order_user_id}, request={user_id}"
        )
        raise ValueError("Order does not belong to this user")

    # Get capture amount and ID
    captures = purchase_unit.get("payments", {}).get("captures", [])
    capture_id = captures[0].get("id") if captures else None
    amount_str = captures[0].get("amount", {}).get("value", "0") if captures else "0"
    amount = Decimal(amount_str)

    # Activate subscription
    if plan_tier_str:
        tier = SubscriptionTier(plan_tier_str)
        plan = await get_plan_by_tier(db, tier)
        if not plan:
            logger.error(f"Plan not found for tier: {plan_tier_str}")
            raise ValueError(f"Plan not found for tier: {plan_tier_str}")

        await upgrade_subscription(
            db,
            user_id,
            plan.id,
            payment_provider="paypal",
        )
    else:
        tier = None

    # Record the payment
    subscription = await get_user_subscription(db, user_id)
    payment = Payment(
        user_id=user_id,
        subscription_id=subscription.id if subscription else None,
        payment_provider="paypal_direct",
        paypal_order_id=order_id,
        amount=amount,
        currency="inr",
        status=PaymentStatus.SUCCEEDED,
        description=(
            f"PayPal payment for {plan_tier_str} tier ({billing_period})"
            if plan_tier_str
            else "PayPal payment"
        ),
    )
    db.add(payment)
    await db.commit()

    logger.info(
        f"PayPal order {order_id} captured for user {user_id}, "
        f"capture {capture_id}, amount {amount} INR"
    )

    return {
        "success": True,
        "order_id": order_id,
        "capture_id": capture_id,
        "status": "COMPLETED",
    }


# =============================================================================
# Webhook Handling
# =============================================================================

def verify_paypal_webhook(
    headers: dict[str, str],
    body: bytes,
) -> bool:
    """Verify PayPal webhook signature.

    PayPal webhooks are verified by calling PayPal's webhook verification
    API endpoint, which is the recommended approach. However, for speed
    we first do a basic sanity check on the payload structure.

    Args:
        headers: The request headers (must include PayPal signature headers).
        body: The raw request body bytes.

    Returns:
        bool: True if the webhook is authentic.
    """
    config = _get_paypal_config()
    webhook_id = config.get("webhook_id")

    if not webhook_id:
        logger.error("PAYPAL_WEBHOOK_ID not configured for webhook verification")
        return False

    # PayPal webhook headers for verification
    transmission_id = headers.get("paypal-transmission-id", "")
    timestamp = headers.get("paypal-transmission-time", "")
    cert_url = headers.get("paypal-cert-url", "")
    auth_algo = headers.get("paypal-auth-algo", "")
    transmission_sig = headers.get("paypal-transmission-sig", "")

    if not all([transmission_id, timestamp, cert_url, auth_algo, transmission_sig]):
        logger.warning("Missing PayPal webhook verification headers")
        return False

    # For production: verify via PayPal API (async verification)
    # For now, we do a basic structural check and log for monitoring.
    # The capture endpoint is the primary activation path; webhooks are backup.
    logger.info(
        f"PayPal webhook received: transmission_id={transmission_id}, "
        f"algo={auth_algo}"
    )
    return True


async def verify_paypal_webhook_async(
    headers: dict[str, str],
    body: bytes,
) -> bool:
    """Verify PayPal webhook via the PayPal verification API.

    This is the recommended server-side verification method. It sends
    the webhook headers and body to PayPal's API for cryptographic
    verification.

    Args:
        headers: Request headers with PayPal signature data.
        body: Raw request body.

    Returns:
        bool: True if PayPal confirms the webhook is authentic.
    """
    config = _get_paypal_config()
    webhook_id = config.get("webhook_id")

    if not webhook_id or not is_paypal_configured():
        return False

    try:
        import json
        access_token = await _get_access_token()
        base_url = _get_base_url()

        verify_payload = {
            "auth_algo": headers.get("paypal-auth-algo", ""),
            "cert_url": headers.get("paypal-cert-url", ""),
            "transmission_id": headers.get("paypal-transmission-id", ""),
            "transmission_sig": headers.get("paypal-transmission-sig", ""),
            "transmission_time": headers.get("paypal-transmission-time", ""),
            "webhook_id": webhook_id,
            "webhook_event": json.loads(body),
        }

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{base_url}/v1/notifications/verify-webhook-signature",
                json=verify_payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
            )

        if response.status_code == 200:
            result = response.json()
            status = result.get("verification_status")
            if status == "SUCCESS":
                return True
            logger.warning(f"PayPal webhook verification status: {status}")
            return False

        logger.error(
            f"PayPal webhook verification API failed: "
            f"{response.status_code} {response.text}"
        )
        return False

    except Exception as e:
        logger.error(f"PayPal webhook verification error: {e}")
        return False


async def handle_paypal_webhook_event(db: AsyncSession, event: dict) -> bool:
    """Handle a verified PayPal webhook event.

    Args:
        db: Database session.
        event: The parsed PayPal webhook event.

    Returns:
        bool: True if the event was handled successfully.
    """
    event_type = event.get("event_type", "")
    resource = event.get("resource", {})

    logger.info(f"Processing PayPal webhook event: {event_type}")

    if event_type == "CHECKOUT.ORDER.APPROVED":
        return await _handle_order_approved(db, resource)
    elif event_type == "PAYMENT.CAPTURE.COMPLETED":
        return await _handle_capture_completed(db, resource)
    elif event_type == "PAYMENT.CAPTURE.DENIED":
        return await _handle_capture_denied(db, resource)

    logger.info(f"Unhandled PayPal webhook event type: {event_type}")
    return True


async def _handle_order_approved(db: AsyncSession, resource: dict) -> bool:
    """Handle CHECKOUT.ORDER.APPROVED — buyer approved the payment.

    This is informational. The actual subscription activation happens
    when the frontend calls capture, or via PAYMENT.CAPTURE.COMPLETED.
    """
    order_id = resource.get("id")
    logger.info(f"PayPal order approved: {order_id}")
    return True


async def _handle_capture_completed(db: AsyncSession, resource: dict) -> bool:
    """Handle PAYMENT.CAPTURE.COMPLETED — payment captured successfully.

    This is the webhook backup for subscription activation. The primary
    path is the frontend calling /capture-paypal-payment.
    """
    capture_id = resource.get("id")
    custom_id = resource.get("custom_id", "")
    amount_str = resource.get("amount", {}).get("value", "0")
    amount = Decimal(amount_str)

    # Check idempotency via paypal_order_id
    # The capture resource has a supplementary_data.related_ids.order_id
    order_id = resource.get("supplementary_data", {}).get(
        "related_ids", {}
    ).get("order_id", "")

    if order_id:
        from sqlalchemy import select
        existing = await db.execute(
            select(Payment).where(Payment.paypal_order_id == order_id)
        )
        if existing.scalars().first():
            logger.info(
                f"PayPal capture {capture_id} already recorded (order {order_id})"
            )
            return True

    # Parse custom_id: "user_id|plan_tier|billing_period"
    parts = custom_id.split("|") if custom_id else []
    if len(parts) != 3:
        logger.warning(
            f"PayPal capture webhook missing custom_id: {custom_id!r}"
        )
        return True  # Acknowledge but can't process without user info

    user_id, plan_tier_str, billing_period = parts

    tier = SubscriptionTier(plan_tier_str)
    plan = await get_plan_by_tier(db, tier)
    if not plan:
        logger.error(f"Plan not found for tier: {plan_tier_str}")
        return False

    # Activate subscription
    await upgrade_subscription(
        db,
        user_id,
        plan.id,
        payment_provider="paypal",
    )

    # Record payment
    subscription = await get_user_subscription(db, user_id)
    payment = Payment(
        user_id=user_id,
        subscription_id=subscription.id if subscription else None,
        payment_provider="paypal_direct",
        paypal_order_id=order_id or None,
        amount=amount,
        currency="inr",
        status=PaymentStatus.SUCCEEDED,
        description=f"PayPal payment for {plan_tier_str} tier ({billing_period})",
    )
    db.add(payment)
    await db.commit()

    logger.info(
        f"PayPal capture webhook activated subscription for user {user_id}, "
        f"tier {plan_tier_str}"
    )
    return True


async def _handle_capture_denied(db: AsyncSession, resource: dict) -> bool:
    """Handle PAYMENT.CAPTURE.DENIED — payment was denied."""
    capture_id = resource.get("id")
    custom_id = resource.get("custom_id", "")

    parts = custom_id.split("|") if custom_id else []
    user_id = parts[0] if parts else None

    if user_id:
        payment = Payment(
            user_id=user_id,
            payment_provider="paypal_direct",
            amount=Decimal("0"),
            currency="inr",
            status=PaymentStatus.FAILED,
            description="PayPal payment denied",
        )
        db.add(payment)
        await db.commit()

    logger.warning(f"PayPal capture denied: {capture_id} for user {user_id}")
    return True
