"""Admin subscription management routes."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select
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
    Payment,
    PaymentStatus,
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionTier,
    UserSubscription,
)
from backend.services.admin_auth_service import create_audit_log


router = APIRouter(prefix="/api/admin/subscriptions", tags=["admin-subscriptions"])


# =============================================================================
# Schemas
# =============================================================================

class SubscriptionSummary(BaseModel):
    """Subscription summary for list view."""
    id: int
    user_id: str
    tier: str
    status: str
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    created_at: datetime


class SubscriptionListOut(BaseModel):
    """Paginated subscription list response."""
    subscriptions: list[SubscriptionSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class SubscriptionAnalyticsOut(BaseModel):
    """Subscription analytics dashboard data."""
    total_active: int
    total_by_tier: dict[str, int]
    total_by_status: dict[str, int]
    new_this_month: int
    churned_this_month: int
    churn_rate: float
    mrr: float  # Monthly recurring revenue


class ModifySubscriptionIn(BaseModel):
    """Modify subscription request."""
    new_tier: str
    reason: str


class ModifySubscriptionOut(BaseModel):
    """Modify subscription response."""
    subscription_id: int
    old_tier: str
    new_tier: str
    modified: bool


class PaymentSummary(BaseModel):
    """Payment summary."""
    id: int
    user_id: str
    amount: float
    currency: str
    status: str
    description: Optional[str]
    created_at: datetime


class PaymentListOut(BaseModel):
    """Paginated payment list response."""
    payments: list[PaymentSummary]
    total: int
    page: int
    page_size: int


class RefundPaymentIn(BaseModel):
    """Refund payment request."""
    reason: str


class RefundPaymentOut(BaseModel):
    """Refund payment response."""
    payment_id: int
    refunded: bool
    reason: str


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

@router.get("", response_model=SubscriptionListOut)
async def list_subscriptions(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tier: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.SUBSCRIPTIONS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    List subscriptions with filtering and pagination.
    
    Permissions required: subscriptions:view
    """
    # Build query
    query = select(UserSubscription).where(UserSubscription.deleted_at.is_(None))
    count_query = select(func.count(UserSubscription.id)).where(
        UserSubscription.deleted_at.is_(None)
    )
    
    # Tier filter
    if tier:
        tier_enum = SubscriptionTier(tier)
        plan_stmt = select(SubscriptionPlan.id).where(SubscriptionPlan.tier == tier_enum)
        plan_result = await db.execute(plan_stmt)
        plan_ids = [r for r in plan_result.scalars().all()]
        if plan_ids:
            query = query.where(UserSubscription.plan_id.in_(plan_ids))
            count_query = count_query.where(UserSubscription.plan_id.in_(plan_ids))
    
    # Status filter
    if status_filter:
        status_enum = SubscriptionStatus(status_filter)
        query = query.where(UserSubscription.status == status_enum)
        count_query = count_query.where(UserSubscription.status == status_enum)
    
    # Order by created_at desc
    query = query.order_by(UserSubscription.created_at.desc())
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    subscriptions = result.scalars().all()
    
    # Map to response
    subscription_summaries = []
    for sub in subscriptions:
        tier_value = sub.plan.tier.value if sub.plan else "unknown"
        subscription_summaries.append(
            SubscriptionSummary(
                id=sub.id,
                user_id=sub.user_id,
                tier=tier_value,
                status=sub.status.value,
                current_period_start=sub.current_period_start,
                current_period_end=sub.current_period_end,
                cancel_at_period_end=sub.cancel_at_period_end,
                created_at=sub.created_at,
            )
        )
    
    total_pages = (total + page_size - 1) // page_size
    
    return SubscriptionListOut(
        subscriptions=subscription_summaries,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/analytics", response_model=SubscriptionAnalyticsOut)
async def get_subscription_analytics(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.SUBSCRIPTIONS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get subscription analytics dashboard data.
    
    Permissions required: subscriptions:view
    """
    # Total active subscriptions
    active_count_stmt = select(func.count(UserSubscription.id)).where(
        UserSubscription.status == SubscriptionStatus.ACTIVE,
        UserSubscription.deleted_at.is_(None),
    )
    active_result = await db.execute(active_count_stmt)
    total_active = active_result.scalar() or 0
    
    # Count by tier
    tier_counts = {}
    for tier in SubscriptionTier:
        plan_stmt = select(SubscriptionPlan.id).where(SubscriptionPlan.tier == tier)
        plan_result = await db.execute(plan_stmt)
        plan_ids = [r for r in plan_result.scalars().all()]
        
        if plan_ids:
            count_stmt = select(func.count(UserSubscription.id)).where(
                UserSubscription.plan_id.in_(plan_ids),
                UserSubscription.status == SubscriptionStatus.ACTIVE,
                UserSubscription.deleted_at.is_(None),
            )
            count_result = await db.execute(count_stmt)
            tier_counts[tier.value] = count_result.scalar() or 0
        else:
            tier_counts[tier.value] = 0
    
    # Count by status
    status_counts = {}
    for status_enum in SubscriptionStatus:
        count_stmt = select(func.count(UserSubscription.id)).where(
            UserSubscription.status == status_enum,
            UserSubscription.deleted_at.is_(None),
        )
        count_result = await db.execute(count_stmt)
        status_counts[status_enum.value] = count_result.scalar() or 0
    
    # New subscriptions this month (simplified)
    from datetime import timedelta
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_stmt = select(func.count(UserSubscription.id)).where(
        UserSubscription.created_at >= month_start,
        UserSubscription.deleted_at.is_(None),
    )
    new_result = await db.execute(new_stmt)
    new_this_month = new_result.scalar() or 0
    
    # Churned this month
    churned_stmt = select(func.count(UserSubscription.id)).where(
        UserSubscription.canceled_at >= month_start,
        UserSubscription.deleted_at.is_(None),
    )
    churned_result = await db.execute(churned_stmt)
    churned_this_month = churned_result.scalar() or 0
    
    # Churn rate
    churn_rate = 0.0
    if total_active > 0:
        churn_rate = (churned_this_month / total_active) * 100
    
    # MRR calculation (simplified - sum of monthly prices for active subscriptions)
    mrr = 0.0
    mrr_stmt = select(SubscriptionPlan.price_monthly, func.count(UserSubscription.id)).join(
        UserSubscription, UserSubscription.plan_id == SubscriptionPlan.id
    ).where(
        UserSubscription.status == SubscriptionStatus.ACTIVE,
        UserSubscription.deleted_at.is_(None),
    ).group_by(SubscriptionPlan.price_monthly)
    
    mrr_result = await db.execute(mrr_stmt)
    for price, count in mrr_result.all():
        if price:
            mrr += float(price) * count
    
    return SubscriptionAnalyticsOut(
        total_active=total_active,
        total_by_tier=tier_counts,
        total_by_status=status_counts,
        new_this_month=new_this_month,
        churned_this_month=churned_this_month,
        churn_rate=round(churn_rate, 2),
        mrr=round(mrr, 2),
    )


@router.post("/{subscription_id}/modify", response_model=ModifySubscriptionOut)
async def modify_subscription(
    request: Request,
    subscription_id: int,
    payload: ModifySubscriptionIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.SUBSCRIPTIONS_MODIFY)),
    db: AsyncSession = Depends(get_db),
):
    """
    Modify a user's subscription tier.
    
    Permissions required: subscriptions:modify
    """
    # Get subscription
    stmt = select(UserSubscription).where(
        UserSubscription.id == subscription_id,
        UserSubscription.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    subscription = result.scalars().first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    
    old_tier = subscription.plan.tier.value if subscription.plan else "unknown"
    
    # Get new plan
    new_tier_enum = SubscriptionTier(payload.new_tier)
    new_plan_stmt = select(SubscriptionPlan).where(SubscriptionPlan.tier == new_tier_enum)
    new_plan_result = await db.execute(new_plan_stmt)
    new_plan = new_plan_result.scalars().first()
    
    if not new_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plan for tier '{payload.new_tier}' not found",
        )
    
    # Update subscription
    subscription.plan_id = new_plan.id
    await db.commit()
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.SUBSCRIPTION_MODIFIED,
        resource_type="subscription",
        resource_id=str(subscription_id),
        details={
            "old_tier": old_tier,
            "new_tier": payload.new_tier,
            "reason": payload.reason,
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return ModifySubscriptionOut(
        subscription_id=subscription_id,
        old_tier=old_tier,
        new_tier=payload.new_tier,
        modified=True,
    )


@router.get("/payments", response_model=PaymentListOut)
async def list_payments(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.SUBSCRIPTIONS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    List payments with filtering and pagination.
    
    Permissions required: subscriptions:view
    """
    # Build query
    query = select(Payment).where(Payment.deleted_at.is_(None))
    count_query = select(func.count(Payment.id)).where(Payment.deleted_at.is_(None))
    
    # Status filter
    if status_filter:
        status_enum = PaymentStatus(status_filter)
        query = query.where(Payment.status == status_enum)
        count_query = count_query.where(Payment.status == status_enum)
    
    # Order by created_at desc
    query = query.order_by(Payment.created_at.desc())
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    payments = result.scalars().all()
    
    # Map to response
    payment_summaries = [
        PaymentSummary(
            id=p.id,
            user_id=p.user_id,
            amount=float(p.amount),
            currency=p.currency,
            status=p.status.value,
            description=p.description,
            created_at=p.created_at,
        )
        for p in payments
    ]
    
    return PaymentListOut(
        payments=payment_summaries,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/payments/{payment_id}/refund", response_model=RefundPaymentOut)
async def refund_payment(
    request: Request,
    payment_id: int,
    payload: RefundPaymentIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.PAYMENTS_REFUND)),
    db: AsyncSession = Depends(get_db),
):
    """
    Refund a payment.
    
    Permissions required: payments:refund
    """
    # Get payment
    stmt = select(Payment).where(
        Payment.id == payment_id,
        Payment.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    payment = result.scalars().first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )
    
    if payment.status == PaymentStatus.REFUNDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already refunded",
        )
    
    if payment.status != PaymentStatus.SUCCEEDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only succeeded payments can be refunded",
        )
    
    # Update payment status
    payment.status = PaymentStatus.REFUNDED
    await db.commit()
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.PAYMENT_REFUNDED,
        resource_type="payment",
        resource_id=str(payment_id),
        details={
            "amount": float(payment.amount),
            "currency": payment.currency,
            "reason": payload.reason,
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return RefundPaymentOut(
        payment_id=payment_id,
        refunded=True,
        reason=payload.reason,
    )
