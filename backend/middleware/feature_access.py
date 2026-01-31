"""Feature access control middleware.

Provides decorators and dependencies for enforcing subscription-based access control:
- require_subscription() - Ensures user has active subscription
- require_kiaan_quota() - Enforces 10 question limit for free tier
- require_journal_access() - Blocks free tier from journal
- require_feature(feature_name) - Generic feature guard
- Developer bypass for app owners
"""

import logging
import os
from functools import wraps
from typing import Callable, Optional

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.deps import get_db
from backend.models import User, SubscriptionStatus
from backend.services.subscription_service import (
    get_user_subscription,
    get_or_create_free_subscription,
    check_kiaan_quota,
    check_journal_access,
    check_feature_access,
    check_wisdom_journeys_access,
    get_user_tier,
)

logger = logging.getLogger(__name__)

# Default developer emails with full access (for app owners)
# SECURITY: Do NOT hardcode personal emails here - use DEVELOPER_EMAILS env var instead
# These are only generic placeholder emails for documentation purposes
DEFAULT_DEVELOPER_EMAILS: set[str] = set()
# NOTE: All developer emails should be configured via DEVELOPER_EMAILS environment variable
# Example: DEVELOPER_EMAILS=dev@example.com,admin@example.com

# Additional developer emails from environment variable
# Format: comma-separated list of emails (e.g., DEVELOPER_EMAILS=dev1@example.com,dev2@example.com)
_env_developer_emails = set(
    email.strip().lower()
    for email in os.getenv("DEVELOPER_EMAILS", "").split(",")
    if email.strip()
)

# Combined developer emails (hardcoded + environment variable)
DEVELOPER_EMAILS = DEFAULT_DEVELOPER_EMAILS | _env_developer_emails


async def is_developer(db: AsyncSession, user_id: str) -> bool:
    """Check if user is a developer with full access.

    Developers are identified by:
    1. Email in DEVELOPER_EMAILS environment variable
    2. is_admin flag in user record

    This function checks both User.id and User.auth_uid to handle
    different authentication sources (JWT uses id, X-Auth-UID might use auth_uid).

    Returns:
        bool: True if user has developer access.
    """
    from sqlalchemy import or_

    try:
        logger.info(f"[is_developer] Checking developer status for user_id: {user_id}")
        logger.info(f"[is_developer] Developer emails configured: {DEVELOPER_EMAILS}")

        # Query by both id and auth_uid to handle different auth sources
        result = await db.execute(
            select(User).where(
                or_(User.id == user_id, User.auth_uid == user_id)
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"[is_developer] User NOT FOUND for id/auth_uid: {user_id}")
            return False

        logger.info(f"[is_developer] Found user: id={user.id}, email={user.email}, auth_uid={user.auth_uid}")

        # Check if email is in developer list (case-insensitive)
        if user.email:
            email_lower = user.email.lower()
            is_dev_email = email_lower in DEVELOPER_EMAILS
            logger.info(f"[is_developer] Email check: '{email_lower}' in {DEVELOPER_EMAILS} = {is_dev_email}")
            if is_dev_email:
                logger.info(f"Developer access granted for {user.email}")
                return True

        # Check if user is admin
        if hasattr(user, "is_admin") and user.is_admin:
            logger.info(f"Admin access granted for user {user_id}")
            return True

        logger.info(f"[is_developer] No developer/admin access for user {user_id}")
        return False

    except Exception as e:
        logger.warning(f"Error checking developer status: {e}", exc_info=True)
        return False


async def get_current_user_id(request: Request) -> str:
    """Extract user ID from the request.

    Supports multiple authentication methods:
    1. request.state.user_id - Set by auth middleware
    2. Authorization: Bearer <JWT> header
    3. X-Auth-UID header - Fallback for frontend compatibility

    Returns:
        str: The user ID (UUID format or legacy integer as string).
    """
    # Check if user_id is set in request state (from auth middleware)
    # Convert to string to ensure consistent type (supports both UUID and legacy int IDs)
    if hasattr(request.state, "user_id"):
        logger.debug(f"[auth] Found user_id in request.state: {request.state.user_id}")
        return str(request.state.user_id)

    # Check authorization header (primary method)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Import here to avoid circular imports
        from backend.security.jwt import decode_access_token
        try:
            token = auth_header.split(" ", 1)[1].strip()
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                logger.debug(f"[auth] Authenticated via Bearer token: {user_id}")
                return str(user_id)
        except Exception as e:
            logger.warning(f"[auth] Bearer token validation failed: {e}")
            # Fall through to try X-Auth-UID

    # Check X-Auth-UID header (fallback for frontend compatibility)
    x_auth_uid = request.headers.get("X-Auth-UID")
    if x_auth_uid:
        user_id = x_auth_uid.strip()
        if user_id and user_id not in ("undefined", "null", ""):
            logger.debug(f"[auth] Authenticated via X-Auth-UID header: {user_id}")
            return str(user_id)

    # Log the authentication failure for debugging
    logger.warning(
        f"[auth] Authentication failed - "
        f"Authorization header: {'present' if auth_header else 'missing'}, "
        f"X-Auth-UID: {'present' if x_auth_uid else 'missing'}"
    )

    # No valid authentication found - raise 401 Unauthorized
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )


class SubscriptionRequired:
    """Dependency that ensures user has an active subscription.

    Developers bypass subscription requirements.
    """

    async def __call__(
        self,
        request: Request,
        db: AsyncSession = Depends(get_db),
    ) -> str:
        """Check that user has an active subscription.

        Args:
            request: The FastAPI request.
            db: Database session.

        Returns:
            str: The user ID.

        Raises:
            HTTPException: If user doesn't have an active subscription.
        """
        user_id = await get_current_user_id(request)

        # Check for developer bypass - no subscription required
        if await is_developer(db, user_id):
            logger.info(f"Developer bypass: skipping subscription check for {user_id}")
            return user_id

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
    ) -> tuple[str, int, int]:
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

        # Check for developer bypass - gives unlimited KIAAN questions
        if await is_developer(db, user_id):
            logger.info(f"Developer bypass: granting unlimited KIAAN quota to {user_id}")
            return user_id, 0, -1  # -1 means unlimited

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
    Developers get free access.
    """

    async def __call__(
        self,
        request: Request,
        db: AsyncSession = Depends(get_db),
    ) -> str:
        """Check that user has journal access.

        Args:
            request: The FastAPI request.
            db: Database session.

        Returns:
            str: The user ID.

        Raises:
            HTTPException: If user doesn't have journal access.
        """
        user_id = await get_current_user_id(request)

        # Ensure user has a subscription
        await get_or_create_free_subscription(db, user_id)

        # Check for developer bypass - gives full journal access
        if await is_developer(db, user_id):
            logger.info(f"Developer bypass: granting journal access to {user_id}")
            return user_id

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


class WisdomJourneysAccessRequired:
    """Dependency that ensures user has Wisdom Journeys access.

    Checks both feature access and journey limits based on subscription tier:
    - DEVELOPER: Full unlimited access (bypasses all restrictions)
    - FREE: Trial access - 1 journey, limited to 3 days
    - BASIC: 1 active journey (full duration)
    - PREMIUM: Up to 5 active journeys
    - ENTERPRISE: Unlimited journeys
    """

    def __init__(self, check_limit: bool = False, requested_count: int = 1):
        """Initialize with optional limit checking.

        Args:
            check_limit: Whether to check against the journey limit.
            requested_count: Number of journeys being requested (for start endpoint).
        """
        self.check_limit = check_limit
        self.requested_count = requested_count

    async def __call__(
        self,
        request: Request,
        db: AsyncSession = Depends(get_db),
    ) -> tuple[str, int, int]:
        """Check that user has Wisdom Journeys access.

        Args:
            request: The FastAPI request.
            db: Database session.

        Returns:
            tuple: (user_id, active_count, journey_limit)

        Raises:
            HTTPException: If user doesn't have access or exceeds limit.
        """
        user_id = await get_current_user_id(request)

        # Ensure user has a subscription
        try:
            await get_or_create_free_subscription(db, user_id)
        except ValueError as e:
            # User not found in database
            logger.error(f"User not found when checking journey access: {e}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "user_not_found",
                    "message": "Your user account was not found. Please log out and sign in again.",
                },
            )

        # Check for developer bypass - gives full unlimited access
        if await is_developer(db, user_id):
            logger.info(f"Developer bypass: granting unlimited Wisdom Journeys access to {user_id}")
            return user_id, 0, -1  # -1 means unlimited

        # Check wisdom journeys access
        has_access, active_count, journey_limit = await check_wisdom_journeys_access(
            db, user_id
        )

        tier = await get_user_tier(db, user_id)

        if not has_access:
            # Provide tier-appropriate message
            if tier.value == "free":
                message = (
                    "Your free trial for Wisdom Journeys has ended or you've reached your trial limit. "
                    "Upgrade to continue your spiritual transformation journey."
                )
            else:
                message = (
                    "Wisdom Journeys is not available on your current plan. "
                    "Please upgrade to access this feature."
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "feature_not_available",
                    "feature": "wisdom_journeys",
                    "message": message,
                    "tier": tier.value,
                    "upgrade_url": "/pricing",
                    "upgrade_cta": "Unlock Wisdom Journeys",
                },
            )

        # Check limit if enabled
        if self.check_limit and journey_limit != -1:
            if active_count + self.requested_count > journey_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "journey_limit_reached",
                        "feature": "wisdom_journeys",
                        "message": f"You can have up to {journey_limit} active journey(s) on your {tier.value} plan. "
                                   f"You currently have {active_count}. Complete or abandon a journey to start a new one, "
                                   "or upgrade for more journeys.",
                        "tier": tier.value,
                        "active_count": active_count,
                        "journey_limit": journey_limit,
                        "upgrade_url": "/pricing",
                        "upgrade_cta": "Upgrade for More Journeys",
                    },
                )

        return user_id, active_count, journey_limit


class FeatureRequired:
    """Generic dependency for checking feature access.

    Developers get access to all features.
    """

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
    ) -> str:
        """Check that user has access to the specified feature.

        Args:
            request: The FastAPI request.
            db: Database session.

        Returns:
            str: The user ID.

        Raises:
            HTTPException: If user doesn't have access to the feature.
        """
        user_id = await get_current_user_id(request)

        # Ensure user has a subscription
        await get_or_create_free_subscription(db, user_id)

        # Check for developer bypass - gives access to all features
        if await is_developer(db, user_id):
            logger.info(f"Developer bypass: granting access to {self.feature_name} for {user_id}")
            return user_id

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
require_wisdom_journeys = WisdomJourneysAccessRequired()


def require_wisdom_journeys_with_limit(requested_count: int = 1) -> WisdomJourneysAccessRequired:
    """Factory function to create a wisdom journeys dependency with limit checking.

    Usage:
        @router.post("/start")
        async def start_journeys(
            payload: StartJourneysRequest,
            access: tuple = Depends(require_wisdom_journeys_with_limit(len(payload.journey_ids))),
        ):
            user_id, active_count, limit = access
            ...

    Args:
        requested_count: Number of journeys being requested.

    Returns:
        WisdomJourneysAccessRequired: A dependency that checks access and limits.
    """
    return WisdomJourneysAccessRequired(check_limit=True, requested_count=requested_count)


def require_feature(feature_name: str) -> FeatureRequired:
    """Factory function to create a feature access dependency.
    
    Usage:
        @router.get("/analytics")
        async def get_analytics(user_id: str = Depends(require_feature("advanced_analytics"))):
            ...
    
    Args:
        feature_name: The name of the feature to check.
        
    Returns:
        FeatureRequired: A dependency that checks for the specified feature.
    """
    return FeatureRequired(feature_name)
