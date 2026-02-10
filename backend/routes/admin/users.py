"""Admin user management routes."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.middleware.rbac import (
    get_current_admin,
    AdminContext,
    PermissionChecker,
)
from backend.models import (
    AdminAuditAction,
    AdminPermission,
    User,
    UserProfile,
    UserSubscription,
    UsageTracking,
)
from backend.services.admin_auth_service import create_audit_log


router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


# =============================================================================
# Schemas
# =============================================================================

class UserSummary(BaseModel):
    """User summary for list view."""
    id: str
    email: Optional[str]
    auth_uid: str
    locale: str
    two_factor_enabled: bool
    is_suspended: bool
    created_at: datetime


class UserDetail(BaseModel):
    """Detailed user information."""
    id: str
    email: Optional[str]
    auth_uid: str
    locale: str
    two_factor_enabled: bool
    is_suspended: bool
    created_at: datetime
    # Profile
    full_name: Optional[str]
    # Subscription
    subscription_tier: Optional[str]
    subscription_status: Optional[str]
    subscription_started_at: Optional[datetime]
    # Usage
    kiaan_questions_used: int
    kiaan_questions_limit: int


class UserListOut(BaseModel):
    """Paginated user list response."""
    users: list[UserSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class SuspendUserIn(BaseModel):
    """Suspend user request."""
    reason: str


class SuspendUserOut(BaseModel):
    """Suspend user response."""
    user_id: str
    suspended: bool
    reason: str


class ReactivateUserOut(BaseModel):
    """Reactivate user response."""
    user_id: str
    reactivated: bool


# =============================================================================
# Helper Functions
# =============================================================================

def get_client_ip(request: Request) -> str | None:
    """Extract client IP from request headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def get_user_agent(request: Request) -> str | None:
    """Get user agent from request."""
    return request.headers.get("User-Agent")


# =============================================================================
# Routes
# =============================================================================

@router.get("", response_model=UserListOut)
async def list_users(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    suspended: Optional[bool] = None,
    has_subscription: Optional[bool] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|email)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.USERS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    List users with search, filter, and pagination.
    
    Permissions required: users:view
    """
    # Build query
    query = select(User).where(User.deleted_at.is_(None))
    count_query = select(func.count(User.id)).where(User.deleted_at.is_(None))
    
    # Search filter
    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.auth_uid.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Suspended filter (we use deleted_at as suspension indicator)
    # Note: In a real implementation, you might have a separate is_suspended field
    
    # Sorting
    order_col = User.created_at if sort_by == "created_at" else User.email
    if sort_order == "desc":
        query = query.order_by(order_col.desc())
    else:
        query = query.order_by(order_col.asc())
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Map to response
    user_summaries = [
        UserSummary(
            id=u.id,
            email=u.email,
            auth_uid=u.auth_uid,
            locale=u.locale,
            two_factor_enabled=u.two_factor_enabled,
            is_suspended=u.deleted_at is not None,
            created_at=u.created_at,
        )
        for u in users
    ]
    
    total_pages = (total + page_size - 1) // page_size
    
    return UserListOut(
        users=user_summaries,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    request: Request,
    user_id: str,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.USERS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed user information.
    
    Permissions required: users:view
    """
    # Get user (excluding soft-deleted users)
    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Get profile
    profile_stmt = select(UserProfile).where(UserProfile.user_id == user_id)
    profile_result = await db.execute(profile_stmt)
    profile = profile_result.scalars().first()
    
    # Get subscription
    sub_stmt = select(UserSubscription).where(UserSubscription.user_id == user_id)
    sub_result = await db.execute(sub_stmt)
    subscription = sub_result.scalars().first()
    
    # Get usage
    usage_stmt = select(UsageTracking).where(
        UsageTracking.user_id == user_id,
        UsageTracking.feature == "kiaan_questions",
    ).order_by(UsageTracking.period_start.desc()).limit(1)
    usage_result = await db.execute(usage_stmt)
    usage = usage_result.scalars().first()
    
    # Log view action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.USER_VIEWED,
        resource_type="user",
        resource_id=user_id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return UserDetail(
        id=user.id,
        email=user.email,
        auth_uid=user.auth_uid,
        locale=user.locale,
        two_factor_enabled=user.two_factor_enabled,
        is_suspended=user.deleted_at is not None,
        created_at=user.created_at,
        full_name=profile.full_name if profile else None,
        subscription_tier=subscription.plan.tier.value if subscription and subscription.plan else None,
        subscription_status=subscription.status.value if subscription else None,
        subscription_started_at=subscription.current_period_start if subscription else None,
        kiaan_questions_used=usage.usage_count if usage else 0,
        kiaan_questions_limit=usage.usage_limit if usage else 20,
    )


@router.post("/{user_id}/suspend", response_model=SuspendUserOut)
async def suspend_user(
    request: Request,
    user_id: str,
    payload: SuspendUserIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.USERS_SUSPEND)),
    db: AsyncSession = Depends(get_db),
):
    """
    Suspend a user account.
    
    Permissions required: users:suspend
    """
    # Get user
    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Soft delete (suspend) the user
    user.soft_delete()
    await db.commit()
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.USER_SUSPENDED,
        resource_type="user",
        resource_id=user_id,
        details={"reason": payload.reason},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return SuspendUserOut(
        user_id=user_id,
        suspended=True,
        reason=payload.reason,
    )


@router.post("/{user_id}/reactivate", response_model=ReactivateUserOut)
async def reactivate_user(
    request: Request,
    user_id: str,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.USERS_SUSPEND)),
    db: AsyncSession = Depends(get_db),
):
    """
    Reactivate a suspended user account.
    
    Permissions required: users:suspend
    """
    # Get user (including suspended)
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if user.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not suspended",
        )
    
    # Restore user
    user.restore()
    await db.commit()
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.USER_REACTIVATED,
        resource_type="user",
        resource_id=user_id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return ReactivateUserOut(
        user_id=user_id,
        reactivated=True,
    )
