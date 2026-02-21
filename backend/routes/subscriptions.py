"""API routes for subscription management.

Endpoints:
- GET /api/subscriptions/tiers - List available plans
- GET /api/subscriptions/current - Get user's current subscription
- POST /api/subscriptions/checkout - Create checkout session (Stripe or Razorpay)
- POST /api/subscriptions/cancel - Cancel subscription
- POST /api/subscriptions/webhook - Stripe webhook handler
- POST /api/subscriptions/webhook/razorpay - Razorpay webhook handler
- POST /api/subscriptions/verify-razorpay-payment - Verify Razorpay payment
- GET /api/subscriptions/usage - Get usage statistics
"""

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import User, SubscriptionTier
from backend.middleware.feature_access import (
    get_current_user_id,
    is_developer,
    require_subscription,
)
from backend.schemas.subscription import (
    SubscriptionPlanOut,
    UserSubscriptionOut,
    UsageStatsOut,
    CheckoutSessionCreate,
    CheckoutSessionOut,
    RazorpayPaymentVerification,
    SubscriptionCancelRequest,
)
from backend.schemas.cost_calculator import (
    CostCalculatorRequest,
    CostCalculatorResponse,
    TierCostBreakdownOut,
)
from backend.services.subscription_service import (
    get_all_plans,
    get_user_subscription,
    get_or_create_free_subscription,
    get_usage_stats,
)
from backend.services.subscription_cost_calculator import (
    calculate_subscription_costs,
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
    Developers (configured via DEVELOPER_EMAILS) get an effective tier of PREMIER
    with all features unlocked, regardless of their actual subscription record.

    Returns:
        UserSubscriptionOut: The user's current subscription details.
    """
    user_id = await get_current_user_id(request)

    # Auto-assign free tier if no subscription exists
    try:
        subscription = await get_or_create_free_subscription(db, user_id)
    except ValueError as e:
        logger.warning(f"User not found for subscription lookup: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "user_not_found",
                "message": "Your user account was not found. Please log out and sign in again.",
            },
        ) from None
    except Exception as e:
        logger.error(f"Failed to get/create subscription for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "subscription_error",
                "message": "Unable to load subscription. Please try again later.",
            },
        ) from None

    # Check if user is a developer — they get full premium access
    user_is_developer = await is_developer(db, user_id)

    # Build plan output — developers see PREMIER-level features
    if user_is_developer:
        from backend.config.feature_config import get_tier_features, get_kiaan_quota
        premier_features = get_tier_features(SubscriptionTier.PREMIER)
        plan_out = SubscriptionPlanOut(
            id=subscription.plan.id,
            tier=SubscriptionTier.PREMIER,
            name="Developer (All Access)",
            description="Full unlimited access for developers",
            price_monthly=subscription.plan.price_monthly,
            price_yearly=subscription.plan.price_yearly,
            features=premier_features,
            kiaan_questions_monthly=-1,
            encrypted_journal=True,
            data_retention_days=-1,
        )
    else:
        plan_out = SubscriptionPlanOut(
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
        )

    return UserSubscriptionOut(
        id=subscription.id,
        user_id=subscription.user_id,
        plan=plan_out,
        status=subscription.status,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        cancel_at_period_end=subscription.cancel_at_period_end,
        canceled_at=subscription.canceled_at,
        created_at=subscription.created_at,
        is_developer=user_is_developer,
        effective_tier=SubscriptionTier.PREMIER if user_is_developer else subscription.plan.tier,
    )


@router.post("/checkout", response_model=CheckoutSessionOut)
async def create_checkout(
    payload: CheckoutSessionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> CheckoutSessionOut:
    """Create a checkout session for purchasing a subscription.

    Routes to Stripe (card/paypal) or Razorpay (UPI) based on payment_method.

    Args:
        payload: The checkout session configuration including payment method.

    Returns:
        CheckoutSessionOut: Provider-agnostic checkout response.

    Raises:
        HTTPException: If payment provider is unavailable or checkout fails.
    """
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

    # Route to the appropriate payment provider
    if payload.payment_method == "upi":
        return await _create_razorpay_checkout(db, user, payload)
    else:
        return await _create_stripe_checkout(db, user, payload)


async def _create_stripe_checkout(
    db: AsyncSession, user: User, payload: CheckoutSessionCreate,
) -> CheckoutSessionOut:
    """Create Stripe checkout session (card or PayPal)."""
    if not is_stripe_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "payment_unavailable",
                "message": "Payment processing is not currently available. Please try again later.",
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
            payment_method=payload.payment_method,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create checkout session",
            )

        return CheckoutSessionOut(
            provider="stripe",
            checkout_url=result["checkout_url"],
            session_id=result["session_id"],
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stripe checkout creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session",
        )


async def _create_razorpay_checkout(
    db: AsyncSession, user: User, payload: CheckoutSessionCreate,
) -> CheckoutSessionOut:
    """Create Razorpay checkout for UPI payments (India, INR only)."""
    # UPI requires INR currency
    if payload.currency != "inr":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_currency",
                "message": "UPI is only available with INR currency.",
            },
        )

    from backend.services.razorpay_service import (
        create_razorpay_order,
        is_razorpay_configured,
    )

    if not is_razorpay_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "upi_unavailable",
                "message": "UPI payments are not currently available. Please try another payment method.",
            },
        )

    try:
        result = await create_razorpay_order(
            db, user, payload.plan_tier, payload.billing_period,
        )

        return CheckoutSessionOut(
            provider="razorpay",
            order_id=result["order_id"],
            razorpay_key_id=result["razorpay_key_id"],
            amount=result["amount"],
            currency=result["currency"],
            name=result["name"],
            description=result["description"],
            user_email=result.get("user_email"),
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Razorpay checkout creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create UPI checkout session",
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


@router.post("/webhook/razorpay")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Handle Razorpay webhook events for UPI payments.

    Razorpay sends webhook events when payment status changes. The signature
    is verified using HMAC-SHA256 to ensure the request is authentic.

    Returns:
        dict: Acknowledgment of the webhook.
    """
    from backend.services.razorpay_service import (
        verify_razorpay_webhook,
        handle_razorpay_webhook_event,
    )

    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Razorpay-Signature header",
        )

    if not verify_razorpay_webhook(payload, signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    event = json.loads(payload)

    try:
        await handle_razorpay_webhook_event(db, event)
    except Exception as e:
        logger.error(f"Razorpay webhook handling failed: {e}")
        # Return 200 to acknowledge receipt and prevent infinite retries

    return {"status": "received"}


@router.post("/verify-razorpay-payment")
async def verify_razorpay_payment_endpoint(
    payload: RazorpayPaymentVerification,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Verify Razorpay payment after frontend UPI checkout.

    The Razorpay JS SDK completes payment on the frontend, then sends
    the payment details here for server-side signature verification.
    On success, the subscription is activated immediately.

    This endpoint is idempotent -- the webhook will also handle activation
    as a fallback if the user closes the browser before this call completes.

    Args:
        payload: Razorpay payment details and signature.

    Returns:
        dict: Success confirmation with subscription status.
    """
    from backend.services.razorpay_service import (
        verify_razorpay_payment,
        activate_razorpay_subscription,
    )

    user_id = await get_current_user_id(request)

    # Verify the payment signature (HMAC-SHA256)
    is_valid = verify_razorpay_payment(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    )

    if not is_valid:
        logger.warning(f"Invalid Razorpay payment signature for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "verification_failed",
                "message": "Payment verification failed. Please contact support if you were charged.",
            },
        )

    # Activate the subscription
    success = await activate_razorpay_subscription(
        db,
        user_id,
        payload.plan_tier,
        payload.billing_period,
        payload.razorpay_payment_id,
        payload.razorpay_order_id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate subscription after payment verification",
        )

    return {
        "success": True,
        "message": "Payment verified and subscription activated successfully.",
        "provider": "razorpay",
    }


@router.get("/usage", response_model=UsageStatsOut)
async def get_current_usage(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UsageStatsOut:
    """Get the current user's usage statistics.

    Developers get unlimited usage reported regardless of actual tracking records.

    Returns:
        UsageStatsOut: Current usage for KIAAN questions.
    """
    user_id = await get_current_user_id(request)

    # Ensure user has a subscription
    await get_or_create_free_subscription(db, user_id)

    # Developers get unlimited usage
    if await is_developer(db, user_id):
        from datetime import datetime, timedelta, UTC
        now = datetime.now(UTC)
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            period_end = period_start.replace(year=now.year + 1, month=1)
        else:
            period_end = period_start.replace(month=now.month + 1)
        return UsageStatsOut(
            feature="kiaan_questions",
            period_start=period_start,
            period_end=period_end,
            usage_count=0,
            usage_limit=-1,
            remaining=-1,
            is_unlimited=True,
        )

    stats = await get_usage_stats(db, user_id, "kiaan_questions")

    return UsageStatsOut(**stats)


@router.post("/cost-calculator", response_model=CostCalculatorResponse)
async def subscription_cost_calculator(
    payload: CostCalculatorRequest | None = None,
) -> CostCalculatorResponse:
    """Calculate subscription costs based on OpenAI API usage with profit margins.

    Analyzes each tier's OpenAI token costs, infrastructure overhead, and
    target profit margins to produce a cost breakdown and suggested pricing.

    This endpoint does not require authentication - it serves as a
    pricing analysis tool for administrators.

    Args:
        payload: Optional parameters to customize the calculation.

    Returns:
        CostCalculatorResponse with per-tier breakdowns and summary.
    """
    params = payload or CostCalculatorRequest()

    result = calculate_subscription_costs(
        model=params.model,
        avg_prompt_tokens=params.avg_prompt_tokens,
        avg_completion_tokens=params.avg_completion_tokens,
        profit_margins=params.profit_margins,
        enterprise_estimated_questions=params.enterprise_estimated_questions,
    )

    return CostCalculatorResponse(
        model=result.model,
        avg_prompt_tokens=result.avg_prompt_tokens,
        avg_completion_tokens=result.avg_completion_tokens,
        cost_per_question=result.cost_per_question,
        tiers=[
            TierCostBreakdownOut(
                tier=t.tier,
                monthly_questions=t.monthly_questions,
                openai_cost_per_question=t.openai_cost_per_question,
                openai_cost_monthly=t.openai_cost_monthly,
                infrastructure_cost_monthly=t.infrastructure_cost_monthly,
                total_cost_monthly=t.total_cost_monthly,
                profit_margin_pct=t.profit_margin_pct,
                profit_amount_monthly=t.profit_amount_monthly,
                suggested_price_monthly=t.suggested_price_monthly,
                current_price_monthly=t.current_price_monthly,
                current_margin_pct=t.current_margin_pct,
                current_profit_monthly=t.current_profit_monthly,
                is_profitable=t.is_profitable,
            )
            for t in result.tiers
        ],
        summary=result.summary,
    )
