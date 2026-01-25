"""Subscription service for managing user subscriptions and usage tracking.

This service handles:
- Auto-assigning free tier to new users
- Feature access checking
- Quota enforcement (10 KIAAN questions for free tier)
- Usage tracking and statistics
"""

import logging
from datetime import datetime, timedelta, UTC
from typing import Optional

from sqlalchemy import select, and_, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    User,
    SubscriptionPlan,
    UserSubscription,
    UsageTracking,
    SubscriptionTier,
    SubscriptionStatus,
)
from backend.config.feature_config import get_tier_features, get_kiaan_quota, get_wisdom_journeys_limit

logger = logging.getLogger(__name__)


async def get_user_subscription(db: AsyncSession, user_id: str) -> Optional[UserSubscription]:
    """Get a user's current subscription.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        
    Returns:
        UserSubscription or None if not found.
    """
    stmt = (
        select(UserSubscription)
        .where(
            and_(
                UserSubscription.user_id == user_id,
                UserSubscription.deleted_at.is_(None),
            )
        )
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_or_create_free_subscription(
    db: AsyncSession, user_id: str
) -> UserSubscription:
    """Get existing subscription or create a free tier subscription for a user.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        
    Returns:
        UserSubscription: The user's subscription (existing or newly created).
    """
    # Check for existing subscription
    subscription = await get_user_subscription(db, user_id)
    if subscription:
        return subscription
    
    # Get the free plan
    free_plan = await get_plan_by_tier(db, SubscriptionTier.FREE)
    if not free_plan:
        raise ValueError("Free subscription plan not found. Run seed script first.")
    
    # Create subscription for the user
    now = datetime.now(UTC)
    subscription = UserSubscription(
        user_id=user_id,
        plan_id=free_plan.id,
        status=SubscriptionStatus.ACTIVE,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),  # Free tier renews monthly
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    
    logger.info(f"Created free tier subscription for user {user_id}")
    return subscription


async def get_plan_by_tier(
    db: AsyncSession, tier: SubscriptionTier
) -> Optional[SubscriptionPlan]:
    """Get a subscription plan by its tier.
    
    Args:
        db: Database session.
        tier: The subscription tier.
        
    Returns:
        SubscriptionPlan or None if not found.
    """
    stmt = select(SubscriptionPlan).where(
        and_(
            SubscriptionPlan.tier == tier,
            SubscriptionPlan.is_active == True,  # noqa: E712
        )
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_all_plans(db: AsyncSession) -> list[SubscriptionPlan]:
    """Get all active subscription plans.
    
    Args:
        db: Database session.
        
    Returns:
        List of active subscription plans.
    """
    stmt = select(SubscriptionPlan).where(SubscriptionPlan.is_active == True)  # noqa: E712
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_user_tier(db: AsyncSession, user_id: str) -> SubscriptionTier:
    """Get the subscription tier for a user.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        
    Returns:
        SubscriptionTier: The user's current tier (FREE if no subscription).
    """
    subscription = await get_user_subscription(db, user_id)
    if not subscription or subscription.status != SubscriptionStatus.ACTIVE:
        return SubscriptionTier.FREE
    
    if subscription.plan:
        return subscription.plan.tier
    
    return SubscriptionTier.FREE


async def check_feature_access(
    db: AsyncSession, user_id: str, feature: str
) -> bool:
    """Check if a user has access to a specific feature.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        feature: The feature name to check.
        
    Returns:
        bool: True if the user has access to the feature.
    """
    tier = await get_user_tier(db, user_id)
    features = get_tier_features(tier)
    return features.get(feature, False)


async def check_journal_access(db: AsyncSession, user_id: str) -> bool:
    """Check if a user has access to the encrypted journal.

    Args:
        db: Database session.
        user_id: The user's ID.

    Returns:
        bool: True if the user has journal access (subscribers only).
    """
    return await check_feature_access(db, user_id, "encrypted_journal")


async def check_wisdom_journeys_access(
    db: AsyncSession, user_id: str
) -> tuple[bool, int, int]:
    """Check if a user has access to Wisdom Journeys and their current usage.

    Args:
        db: Database session.
        user_id: The user's ID.

    Returns:
        tuple: (has_access, active_journey_count, journey_limit)
            - has_access: True if the user can access Wisdom Journeys
            - active_journey_count: Number of currently active journeys
            - journey_limit: Maximum allowed (-1 = unlimited, 0 = no access)
    """
    tier = await get_user_tier(db, user_id)
    journey_limit = get_wisdom_journeys_limit(tier)

    # No access for free tier (limit = 0)
    if journey_limit == 0:
        return False, 0, 0

    # Count active journeys for this user
    try:
        from backend.models import UserJourney, UserJourneyStatus

        stmt = select(UserJourney).where(
            and_(
                UserJourney.user_id == user_id,
                UserJourney.status == UserJourneyStatus.ACTIVE,
            )
        )
        result = await db.execute(stmt)
        active_journeys = list(result.scalars().all())
        active_count = len(active_journeys)
    except Exception as e:
        logger.warning(f"Failed to count active journeys: {e}")
        active_count = 0

    return True, active_count, journey_limit


async def get_wisdom_journeys_stats(db: AsyncSession, user_id: str) -> dict:
    """Get Wisdom Journeys statistics for a user.

    Args:
        db: Database session.
        user_id: The user's ID.

    Returns:
        dict: Journey statistics including access, limits, and usage.
    """
    has_access, active_count, journey_limit = await check_wisdom_journeys_access(
        db, user_id
    )
    tier = await get_user_tier(db, user_id)

    return {
        "feature": "wisdom_journeys",
        "has_access": has_access,
        "tier": tier.value,
        "active_journeys": active_count,
        "journey_limit": journey_limit,
        "remaining": -1 if journey_limit == -1 else max(0, journey_limit - active_count),
        "is_unlimited": journey_limit == -1,
        "can_start_more": has_access and (journey_limit == -1 or active_count < journey_limit),
    }


# =============================================================================
# Usage Tracking
# =============================================================================

def _get_current_period() -> tuple[datetime, datetime]:
    """Get the current billing period (start of month to start of next month)."""
    now = datetime.now(UTC)
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Calculate next month
    if now.month == 12:
        period_end = period_start.replace(year=now.year + 1, month=1)
    else:
        period_end = period_start.replace(month=now.month + 1)
    
    return period_start, period_end


async def get_or_create_usage_record(
    db: AsyncSession, user_id: str, feature: str
) -> UsageTracking:
    """Get or create a usage tracking record for the current period.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        feature: The feature being tracked.
        
    Returns:
        UsageTracking: The usage tracking record.
    """
    period_start, period_end = _get_current_period()
    
    stmt = select(UsageTracking).where(
        and_(
            UsageTracking.user_id == user_id,
            UsageTracking.feature == feature,
            UsageTracking.period_start == period_start,
        )
    )
    result = await db.execute(stmt)
    usage = result.scalars().first()
    
    if usage:
        return usage
    
    # Get user's tier to determine the limit
    tier = await get_user_tier(db, user_id)
    limit = get_kiaan_quota(tier) if feature == "kiaan_questions" else 0
    
    usage = UsageTracking(
        user_id=user_id,
        feature=feature,
        period_start=period_start,
        period_end=period_end,
        usage_count=0,
        usage_limit=limit,
    )
    db.add(usage)
    await db.commit()
    await db.refresh(usage)
    
    return usage


async def check_kiaan_quota(db: AsyncSession, user_id: str) -> tuple[bool, int, int]:
    """Check if a user has remaining KIAAN questions quota.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        
    Returns:
        tuple: (has_quota, usage_count, usage_limit)
            - has_quota: True if the user can ask more questions
            - usage_count: Current usage count
            - usage_limit: Maximum allowed (-1 = unlimited)
    """
    tier = await get_user_tier(db, user_id)
    limit = get_kiaan_quota(tier)
    
    # Unlimited quota for paid tiers
    if limit == -1:
        return True, 0, -1
    
    usage = await get_or_create_usage_record(db, user_id, "kiaan_questions")
    has_quota = usage.usage_count < usage.usage_limit
    
    return has_quota, usage.usage_count, usage.usage_limit


async def increment_kiaan_usage(db: AsyncSession, user_id: str) -> UsageTracking:
    """Increment the KIAAN questions usage count for a user.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        
    Returns:
        UsageTracking: The updated usage record.
    """
    usage = await get_or_create_usage_record(db, user_id, "kiaan_questions")
    usage.usage_count += 1
    usage.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(usage)
    
    logger.info(
        f"User {user_id} KIAAN usage: {usage.usage_count}/{usage.usage_limit}"
    )
    return usage


async def get_usage_stats(
    db: AsyncSession, user_id: str, feature: str = "kiaan_questions"
) -> dict:
    """Get usage statistics for a user.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        feature: The feature to get stats for.
        
    Returns:
        dict: Usage statistics.
    """
    usage = await get_or_create_usage_record(db, user_id, feature)
    is_unlimited = usage.usage_limit == -1
    
    return {
        "feature": feature,
        "period_start": usage.period_start,
        "period_end": usage.period_end,
        "usage_count": usage.usage_count,
        "usage_limit": usage.usage_limit,
        "remaining": -1 if is_unlimited else max(0, usage.usage_limit - usage.usage_count),
        "is_unlimited": is_unlimited,
    }


async def update_subscription_status(
    db: AsyncSession,
    user_id: str,
    status: SubscriptionStatus,
    cancel_at_period_end: bool = False,
) -> Optional[UserSubscription]:
    """Update a user's subscription status.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        status: The new subscription status.
        cancel_at_period_end: Whether to cancel at period end.
        
    Returns:
        Updated UserSubscription or None.
    """
    subscription = await get_user_subscription(db, user_id)
    if not subscription:
        return None
    
    subscription.status = status
    subscription.cancel_at_period_end = cancel_at_period_end
    if status == SubscriptionStatus.CANCELED:
        subscription.canceled_at = datetime.now(UTC)
    
    subscription.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(subscription)
    
    logger.info(f"Updated subscription status for user {user_id} to {status}")
    return subscription


async def upgrade_subscription(
    db: AsyncSession,
    user_id: str,
    new_plan_id: int,
    stripe_subscription_id: Optional[str] = None,
    stripe_customer_id: Optional[str] = None,
) -> UserSubscription:
    """Upgrade or change a user's subscription plan.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        new_plan_id: The new plan's ID.
        stripe_subscription_id: Optional Stripe subscription ID.
        stripe_customer_id: Optional Stripe customer ID.
        
    Returns:
        Updated UserSubscription.
    """
    subscription = await get_user_subscription(db, user_id)
    now = datetime.now(UTC)
    
    if subscription:
        # Update existing subscription
        subscription.plan_id = new_plan_id
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.current_period_start = now
        subscription.current_period_end = now + timedelta(days=30)
        subscription.cancel_at_period_end = False
        subscription.canceled_at = None
        if stripe_subscription_id:
            subscription.stripe_subscription_id = stripe_subscription_id
        if stripe_customer_id:
            subscription.stripe_customer_id = stripe_customer_id
        subscription.updated_at = now
    else:
        # Create new subscription
        subscription = UserSubscription(
            user_id=user_id,
            plan_id=new_plan_id,
            status=SubscriptionStatus.ACTIVE,
            stripe_subscription_id=stripe_subscription_id,
            stripe_customer_id=stripe_customer_id,
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
        )
        db.add(subscription)
    
    await db.commit()
    await db.refresh(subscription)
    
    # Update usage tracking limits for the new tier
    await _update_usage_limits(db, user_id, subscription.plan_id)
    
    logger.info(f"Upgraded subscription for user {user_id} to plan {new_plan_id}")
    return subscription


async def _update_usage_limits(
    db: AsyncSession, user_id: str, plan_id: int
) -> None:
    """Update usage tracking limits when a user's plan changes.
    
    Args:
        db: Database session.
        user_id: The user's ID.
        plan_id: The new plan's ID.
    """
    # Get the new plan
    stmt = select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
    result = await db.execute(stmt)
    plan = result.scalars().first()
    
    if not plan:
        return
    
    # Update KIAAN questions limit
    period_start, _ = _get_current_period()
    await db.execute(
        update(UsageTracking)
        .where(
            and_(
                UsageTracking.user_id == user_id,
                UsageTracking.feature == "kiaan_questions",
                UsageTracking.period_start == period_start,
            )
        )
        .values(usage_limit=plan.kiaan_questions_monthly)
    )
    await db.commit()
