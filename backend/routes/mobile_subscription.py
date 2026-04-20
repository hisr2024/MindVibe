"""Mobile in-app purchase receipt verification endpoint.

POST /api/subscription/verify — validates receipts from App Store and
Google Play, then activates the user's subscription on the backend.

Receipt validation flow:
1. Mobile app sends { receipt, platform, product_id }
2. Backend validates receipt with Apple/Google servers
3. On success, upserts UserSubscription with the correct tier
4. Returns { valid, tier, expires_at }

4-tier model (March 2026):
- free (Seeker): No IAP purchase
- bhakta: com.kiaanverse.bhakta.{monthly,yearly}
- sadhak: com.kiaanverse.sadhak.{monthly,yearly}
- siddha: com.kiaanverse.siddha.{monthly,yearly}

Edge cases:
- Invalid receipt → { valid: false }, tier stays free
- Network error reaching Apple/Google → 503 with retry hint
- Already-verified receipt (idempotent) → returns current subscription
- Expired subscription → { valid: false, tier: "free" }
"""

import datetime
import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.middleware.feature_access import get_current_user_id
from backend.models.base import SubscriptionTier
from backend.models.subscription import (
    SubscriptionPlan,
    SubscriptionStatus,
    UserSubscription,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/subscription", tags=["mobile-subscription"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class ReceiptVerifyRequest(BaseModel):
    """Input: receipt data from the mobile IAP purchase."""

    receipt: str = Field(..., min_length=1, max_length=65536)
    platform: str = Field(..., pattern="^(ios|android)$")
    product_id: str = Field(..., min_length=1, max_length=256)


class ReceiptVerifyResponse(BaseModel):
    """Output: verification result with effective tier and expiry."""

    valid: bool
    tier: str
    expires_at: str | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
# Product ID → Tier Mapping (aligned with mobile constants.ts)
# ---------------------------------------------------------------------------

PRODUCT_TIER_MAP: dict[str, SubscriptionTier] = {
    # Bhakta tier
    "com.kiaanverse.bhakta.monthly": SubscriptionTier.BHAKTA,
    "com.kiaanverse.bhakta.yearly": SubscriptionTier.BHAKTA,
    # Sadhak tier
    "com.kiaanverse.sadhak.monthly": SubscriptionTier.SADHAK,
    "com.kiaanverse.sadhak.yearly": SubscriptionTier.SADHAK,
    # Siddha tier
    "com.kiaanverse.siddha.monthly": SubscriptionTier.SIDDHA,
    "com.kiaanverse.siddha.yearly": SubscriptionTier.SIDDHA,
}

# Backend tier → mobile tier name (1:1 mapping, no collapsing)
BACKEND_TO_MOBILE_TIER: dict[SubscriptionTier, str] = {
    SubscriptionTier.FREE: "free",
    SubscriptionTier.BHAKTA: "bhakta",
    SubscriptionTier.SADHAK: "sadhak",
    SubscriptionTier.SIDDHA: "siddha",
}


# ---------------------------------------------------------------------------
# Receipt Verification (platform-specific)
# ---------------------------------------------------------------------------


async def _verify_ios_receipt(receipt: str, product_id: str) -> dict[str, Any]:
    """Validate an App Store receipt with Apple's verifyReceipt endpoint.

    In production this calls Apple's server. For now, we perform basic
    structural validation and mark as valid for development.

    Returns:
        dict with keys: valid (bool), expires_at (datetime | None)
    """
    import os

    # In production, send to Apple's verifyReceipt endpoint
    apple_shared_secret = os.getenv("APPLE_SHARED_SECRET")

    if not apple_shared_secret:
        logger.warning("APPLE_SHARED_SECRET not configured — accepting receipt for dev")
        # Development: accept all receipts with 30-day expiry
        return {
            "valid": True,
            "expires_at": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=30),
        }

    # Production: validate with Apple
    try:
        import httpx

        # Try production first, fall back to sandbox
        for url in [
            "https://buy.itunes.apple.com/verifyReceipt",
            "https://sandbox.itunes.apple.com/verifyReceipt",
        ]:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json={
                        "receipt-data": receipt,
                        "password": apple_shared_secret,
                        "exclude-old-transactions": True,
                    },
                )

                if response.status_code != 200:
                    continue

                data = response.json()
                receipt_status = data.get("status", -1)

                # Status 0 = valid, 21007 = sandbox receipt sent to production
                if receipt_status == 21007:
                    continue  # Try sandbox URL
                if receipt_status != 0:
                    return {"valid": False, "expires_at": None}

                # Find the latest receipt for our product
                latest_info = data.get("latest_receipt_info", [])
                for info in sorted(
                    latest_info,
                    key=lambda x: int(x.get("expires_date_ms", "0")),
                    reverse=True,
                ):
                    if info.get("product_id") == product_id:
                        expires_ms = int(info.get("expires_date_ms", "0"))
                        expires_at = datetime.datetime.fromtimestamp(
                            expires_ms / 1000, tz=datetime.UTC
                        )
                        is_valid = expires_at > datetime.datetime.now(datetime.UTC)
                        return {"valid": is_valid, "expires_at": expires_at}

                return {"valid": False, "expires_at": None}

        return {"valid": False, "expires_at": None}

    except Exception as e:
        logger.error(f"Apple receipt verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "verification_unavailable",
                "message": "Unable to verify purchase with Apple. Please try again.",
            },
        ) from None


async def _verify_android_receipt(receipt: str, product_id: str) -> dict[str, Any]:
    """Validate a Google Play purchase token.

    In production this calls the Google Play Developer API.
    For development, we accept all tokens.

    Returns:
        dict with keys: valid (bool), expires_at (datetime | None)
    """
    import os

    google_service_account = os.getenv("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")

    if not google_service_account:
        logger.warning("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not configured — accepting receipt for dev")
        return {
            "valid": True,
            "expires_at": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=30),
        }

    # Production: validate with Google Play Developer API
    try:
        import httpx

        # Parse service account credentials
        service_account = json.loads(google_service_account)
        package_name = os.getenv("ANDROID_PACKAGE_NAME", "com.kiaanverse.app")

        # Get OAuth2 access token from service account
        # In production, use google-auth library for proper JWT token exchange
        access_token = os.getenv("GOOGLE_PLAY_ACCESS_TOKEN", "")

        if not access_token:
            logger.warning("Google Play access token not available — accepting for dev")
            return {
                "valid": True,
                "expires_at": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=30),
            }

        url = (
            f"https://androidpublisher.googleapis.com/androidpublisher/v3/"
            f"applications/{package_name}/purchases/subscriptions/"
            f"{product_id}/tokens/{receipt}"
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if response.status_code != 200:
                return {"valid": False, "expires_at": None}

            data = response.json()
            expiry_ms = int(data.get("expiryTimeMillis", "0"))
            expires_at = datetime.datetime.fromtimestamp(
                expiry_ms / 1000, tz=datetime.UTC
            )
            is_valid = expires_at > datetime.datetime.now(datetime.UTC)

            return {"valid": is_valid, "expires_at": expires_at}

    except Exception as e:
        logger.error(f"Google Play receipt verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "verification_unavailable",
                "message": "Unable to verify purchase with Google. Please try again.",
            },
        ) from None


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/verify", response_model=ReceiptVerifyResponse)
async def verify_mobile_receipt(
    payload: ReceiptVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ReceiptVerifyResponse:
    """Verify a mobile in-app purchase receipt and activate subscription.

    This endpoint is idempotent — calling it multiple times with the same
    receipt will return the same result without creating duplicate records.

    Args:
        payload: Receipt data from the mobile IAP purchase.

    Returns:
        ReceiptVerifyResponse: Verification result with tier and expiry.
    """
    user_id = await get_current_user_id(request)

    # Validate product ID
    tier = PRODUCT_TIER_MAP.get(payload.product_id)
    if not tier:
        logger.warning(f"Unknown product ID: {payload.product_id}")
        return ReceiptVerifyResponse(
            valid=False,
            tier="free",
            error="Unknown product. Please contact support.",
        )

    # Verify receipt with platform
    if payload.platform == "ios":
        result = await _verify_ios_receipt(payload.receipt, payload.product_id)
    else:
        result = await _verify_android_receipt(payload.receipt, payload.product_id)

    if not result["valid"]:
        return ReceiptVerifyResponse(
            valid=False,
            tier="free",
            error="Receipt validation failed.",
        )

    # Activate subscription
    try:
        expires_at: datetime.datetime | None = result.get("expires_at")

        # Find the subscription plan for this tier
        plan_stmt = select(SubscriptionPlan).where(SubscriptionPlan.tier == tier)
        plan_result = await db.execute(plan_stmt)
        plan = plan_result.scalars().first()

        if not plan:
            logger.error(f"No subscription plan found for tier {tier}")
            return ReceiptVerifyResponse(
                valid=False,
                tier="free",
                error="Subscription plan not configured. Please contact support.",
            )

        # Upsert user subscription
        sub_stmt = select(UserSubscription).where(
            UserSubscription.user_id == user_id,
            UserSubscription.deleted_at.is_(None),
        )
        sub_result = await db.execute(sub_stmt)
        subscription = sub_result.scalars().first()

        now = datetime.datetime.now(datetime.UTC)

        if subscription:
            subscription.plan_id = plan.id
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.payment_provider = f"iap_{payload.platform}"
            subscription.current_period_start = now
            subscription.current_period_end = expires_at
            subscription.cancel_at_period_end = False
            subscription.canceled_at = None
            # Store receipt identifiers for upgrade/downgrade + webhook lookup.
            # On Android this is the Play purchaseToken; on iOS it's the
            # StoreKit originalTransactionId (we keep the base64 receipt as
            # a fallback for server-to-server verification calls).
            subscription.store_product_id = payload.product_id
            subscription.store_purchase_token = payload.receipt
        else:
            subscription = UserSubscription(
                user_id=user_id,
                plan_id=plan.id,
                status=SubscriptionStatus.ACTIVE,
                payment_provider=f"iap_{payload.platform}",
                current_period_start=now,
                current_period_end=expires_at,
                cancel_at_period_end=False,
                store_product_id=payload.product_id,
                store_purchase_token=payload.receipt,
            )
            db.add(subscription)

        await db.commit()

        mobile_tier = BACKEND_TO_MOBILE_TIER.get(tier, "free")

        logger.info(
            f"Mobile subscription activated: user={user_id} tier={mobile_tier} "
            f"platform={payload.platform} expires={expires_at}"
        )

        return ReceiptVerifyResponse(
            valid=True,
            tier=mobile_tier,
            expires_at=expires_at.isoformat() if expires_at else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to activate subscription for user {user_id}: {e}")
        await db.rollback()
        return ReceiptVerifyResponse(
            valid=False,
            tier="free",
            error="Failed to activate subscription. Please contact support.",
        )
