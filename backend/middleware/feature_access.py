"""Feature access control middleware.

Provides decorators and dependencies for enforcing subscription-based access control:
- require_subscription() - Ensures user has active subscription
- require_kiaan_quota() - Enforces 10 question limit for free tier
- require_journal_access() - Blocks free tier from journal
- require_feature(feature_name) - Generic feature guard
"""

import logging
from functools import wraps
from typing import Callable, Optional

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import User, SubscriptionStatus
from backend.services.subscription_service import (
    get_user_subscription,
    get_or_create_free_subscription,
    check_kiaan_quota,
    check_journal_access,
    check_feature_access,
    get_user_tier,
)

logger = logging.getLogger(__name__)


async def get_current_user_id(request: Request) -> int:
    """Extract user ID from the request.
    
    This should be replaced with your actual authentication logic.
    For now, it looks for user_id in request state or returns a test user.
    """
    # Check if user_id is set in request state (from auth middleware)
    if hasattr(request.state, "user_id"):
        return request.state.user_id
    
    # Check authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Import here to avoid circular imports
        from backend.security.jwt import decode_access_token
        try:
            token = auth_header.split(" ", 1)[1].strip()
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                return int(user_id)
        except Exception:
            pass
    
    # For development/testing, return a default user ID
    # In production, this should raise an authentication error
    return 1


class SubscriptionRequired:
    """Dependency that ensures user has an active subscription."""
    
    async def __call__(
        self,
        request: Request,
        db: AsyncSession = Depends(get_db),
    ) -> int:
        """Check that user has an active subscription.
        
        Args:
            request: The FastAPI request.
            db: Database session.
            
        Returns:
            int: The user ID.
            
        Raises:
            HTTPException: If user doesn't have an active subscription.
        """
        user_id = await get_current_user_id(request)
        
        # Get or create subscription (auto-assign free tier)
        subscription = await get_or_create_free_subscription(db, user_id)
        
        if subscription.status not in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error": "subscription_required",
                    "message": "An active subscription is required to access this feature.",
                    "subscription_status": subscription.status.value,
                },
            )
        
        return user_id


class KiaanQuotaRequired:
    """Dependency that enforces KIAAN question quota.
    
    Free tier users are limited to 10 questions per month.
    """
    
    async def __call__(
        self,
        request: Request,
        db: AsyncSession = Depends(get_db),
    ) -> tuple[int, int, int]:
        """Check that user has remaining KIAAN quota.
        
        Args:
            request: The FastAPI request.
            db: Database session.
            
        Returns:
            tuple: (user_id, usage_count, usage_limit)
            
        Raises:
            HTTPException: If user has exceeded their quota.
        """
        user_id = await get_current_user_id(request)
        
        # Ensure user has a subscription
        await get_or_create_free_subscription(db, user_id)
        
        # Check quota
        has_quota, usage_count, usage_limit = await check_kiaan_quota(db, user_id)
        
        if not has_quota:
            tier = await get_user_tier(db, user_id)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "quota_exceeded",
                    "message": f"You have reached your monthly limit of {usage_limit} KIAAN questions. "
                              "Upgrade your subscription for more questions.",
                    "usage_count": usage_count,
                    "usage_limit": usage_limit,
                    "tier": tier.value,
                    "upgrade_url": "/subscription/upgrade",
                },
            )
        
        return user_id, usage_count, usage_limit


class JournalAccessRequired:
    """Dependency that ensures user has journal access.
    
    Encrypted journal is only available to paid subscribers.
    """
    
    async def __call__(
        self,
        request: Request,
        db: AsyncSession = Depends(get_db),
    ) -> int:
        """Check that user has journal access.
        
        Args:
            request: The FastAPI request.
            db: Database session.
            
        Returns:
            int: The user ID.
            
        Raises:
            HTTPException: If user doesn't have journal access.
        """
        user_id = await get_current_user_id(request)
        
        # Ensure user has a subscription
        await get_or_create_free_subscription(db, user_id)
        
        # Check journal access
        has_access = await check_journal_access(db, user_id)
        
        if not has_access:
            tier = await get_user_tier(db, user_id)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "feature_not_available",
                    "feature": "encrypted_journal",
                    "message": "Encrypted journal is a premium feature. "
                              "Upgrade to Basic or higher to access your private journal.",
                    "tier": tier.value,
                    "upgrade_url": "/subscription/upgrade",
                },
            )
        
        return user_id


class FeatureRequired:
    """Generic dependency for checking feature access."""
    
    def __init__(self, feature_name: str):
        """Initialize with the feature name to check.
        
        Args:
            feature_name: The name of the feature to check access for.
        """
        self.feature_name = feature_name
    
    async def __call__(
        self,
        request: Request,
        db: AsyncSession = Depends(get_db),
    ) -> int:
        """Check that user has access to the specified feature.
        
        Args:
            request: The FastAPI request.
            db: Database session.
            
        Returns:
            int: The user ID.
            
        Raises:
            HTTPException: If user doesn't have access to the feature.
        """
        user_id = await get_current_user_id(request)
        
        # Ensure user has a subscription
        await get_or_create_free_subscription(db, user_id)
        
        # Check feature access
        has_access = await check_feature_access(db, user_id, self.feature_name)
        
        if not has_access:
            tier = await get_user_tier(db, user_id)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "feature_not_available",
                    "feature": self.feature_name,
                    "message": f"The '{self.feature_name}' feature is not available on your current plan. "
                              "Please upgrade to access this feature.",
                    "tier": tier.value,
                    "upgrade_url": "/subscription/upgrade",
                },
            )
        
        return user_id


# Pre-instantiated dependencies for common use cases
require_subscription = SubscriptionRequired()
require_kiaan_quota = KiaanQuotaRequired()
require_journal_access = JournalAccessRequired()


def require_feature(feature_name: str) -> FeatureRequired:
    """Factory function to create a feature access dependency.
    
    Usage:
        @router.get("/analytics")
        async def get_analytics(user_id: int = Depends(require_feature("advanced_analytics"))):
            ...
    
    Args:
        feature_name: The name of the feature to check.
        
    Returns:
        FeatureRequired: A dependency that checks for the specified feature.
    """
    return FeatureRequired(feature_name)
