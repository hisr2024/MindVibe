"""API routes for subscription management.

Endpoints:
- GET /api/subscriptions/tiers - List available plans
- GET /api/subscriptions/current - Get user's current subscription
- POST /api/subscriptions/checkout - Create Stripe checkout session
- POST /api/subscriptions/cancel - Cancel subscription
- POST /api/subscriptions/webhook - Stripe webhook handler
- GET /api/subscriptions/usage - Get usage statistics
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import User, SubscriptionTier
from backend.middleware.feature_access import (
    get_current_user_id,
    require_subscription,
)
from backend.schemas.subscription import (
    SubscriptionPlanOut,
    UserSubscriptionOut,
    UsageStatsOut,
    CheckoutSessionCreate,
    CheckoutSessionOut,
    SubscriptionCancelRequest,
)
from backend.services.subscription_service import (
    get_all_plans,
    get_user_subscription,
    get_or_create_free_subscription,
    get_usage_stats,
)
from backend.services.stripe_service import (
    create_checkout_session,
    cancel_subscription,
    verify_webhook_signature,
    handle_webhook_event,
    is_stripe_configured,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@router.get("/tiers", response_model=list[SubscriptionPlanOut])
async def list_subscription_tiers(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """List all available subscription tiers/plans.
    
    Returns:
        list: Available subscription plans with their features and pricing.
    """
    plans = await get_all_plans(db)
    return [
        SubscriptionPlanOut(
            id=plan.id,
            tier=plan.tier,
            name=plan.name,
            description=plan.description,
            price_monthly=plan.price_monthly,
            price_yearly=plan.price_yearly,
            features=plan.features,
            kiaan_questions_monthly=plan.kiaan_questions_monthly,
            encrypted_journal=plan.encrypted_journal,
            data_retention_days=plan.data_retention_days,
        )
        for plan in plans
    ]


@router.get("/current", response_model=UserSubscriptionOut | None)
async def get_current_subscription(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserSubscriptionOut | None:
    """Get the current user's subscription.
    
    If the user doesn't have a subscription, one will be created with the free tier.
    
    Returns:
        UserSubscriptionOut: The user's current subscription details.
    """
    user_id = await get_current_user_id(request)
    
    # Auto-assign free tier if no subscription exists
    subscription = await get_or_create_free_subscription(db, user_id)
    
    return UserSubscriptionOut(
        id=subscription.id,
        user_id=subscription.user_id,
        plan=SubscriptionPlanOut(
            id=subscription.plan.id,
            tier=subscription.plan.tier,
            name=subscription.plan.name,
            description=subscription.plan.description,
            price_monthly=subscription.plan.price_monthly,
            price_yearly=subscription.plan.price_yearly,
            features=subscription.plan.features,
            kiaan_questions_monthly=subscription.plan.kiaan_questions_monthly,
            encrypted_journal=subscription.plan.encrypted_journal,
            data_retention_days=subscription.plan.data_retention_days,
        ),
        status=subscription.status,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        cancel_at_period_end=subscription.cancel_at_period_end,
        canceled_at=subscription.canceled_at,
        created_at=subscription.created_at,
    )


@router.post("/checkout", response_model=CheckoutSessionOut)
async def create_checkout(
    payload: CheckoutSessionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> CheckoutSessionOut:
    """Create a Stripe checkout session for purchasing a subscription.
    
    Args:
        payload: The checkout session configuration.
        
    Returns:
        CheckoutSessionOut: The checkout session URL and ID.
        
    Raises:
        HTTPException: If Stripe is not configured or checkout creation fails.
    """
    if not is_stripe_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "payment_unavailable",
                "message": "Payment processing is not currently available. Please try again later.",
            },
        )
    
    user_id = await get_current_user_id(request)
    
    # Get user from database
    from sqlalchemy import select
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Cannot checkout for free tier
    if payload.plan_tier == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_plan",
                "message": "Cannot purchase the free tier. It is automatically assigned.",
            },
        )
    
    try:
        result = await create_checkout_session(
            db,
            user,
            payload.plan_tier,
            payload.billing_period,
            payload.success_url,
            payload.cancel_url,
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create checkout session",
            )
        
        return CheckoutSessionOut(
            checkout_url=result["checkout_url"],
            session_id=result["session_id"],
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Checkout creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session",
        )


@router.post("/cancel")
async def cancel_user_subscription(
    payload: SubscriptionCancelRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Cancel the current user's subscription.
    
    Args:
        payload: Cancel request options.
        
    Returns:
        dict: Confirmation of cancellation.
    """
    user_id = await get_current_user_id(request)
    
    subscription = await get_user_subscription(db, user_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found",
        )
    
    # Cannot cancel free tier
    if subscription.plan and subscription.plan.tier == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "cannot_cancel_free",
                "message": "The free tier cannot be canceled.",
            },
        )
    
    success = await cancel_subscription(
        db, user_id, payload.cancel_immediately
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription",
        )
    
    return {
        "success": True,
        "message": (
            "Your subscription has been canceled immediately."
            if payload.cancel_immediately
            else "Your subscription will be canceled at the end of the current billing period."
        ),
        "cancel_immediately": payload.cancel_immediately,
    }


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Handle Stripe webhook events.
    
    This endpoint receives webhook events from Stripe and processes them.
    The signature is verified to ensure the request is authentic.
    
    Returns:
        dict: Acknowledgment of the webhook.
    """
    # Get the raw payload
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header",
        )
    
    # Verify and parse the event
    event = verify_webhook_signature(payload, signature)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )
    
    # Handle the event
    try:
        await handle_webhook_event(db, event)
    except Exception as e:
        logger.error(f"Webhook handling failed: {e}")
        # Return 200 anyway to acknowledge receipt
        # Stripe will retry on errors, we don't want infinite retries
    
    return {"status": "received"}


@router.get("/usage", response_model=UsageStatsOut)
async def get_current_usage(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UsageStatsOut:
    """Get the current user's usage statistics.
    
    Returns:
        UsageStatsOut: Current usage for KIAAN questions.
    """
    user_id = await get_current_user_id(request)
    
    # Ensure user has a subscription
    await get_or_create_free_subscription(db, user_id)
    
    stats = await get_usage_stats(db, user_id, "kiaan_questions")
    
    return UsageStatsOut(**stats)
