"""Admin data export routes."""

import csv
import io
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
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
    SubscriptionPlan,
    User,
    UserProfile,
    UserSubscription,
)
from backend.services.admin_auth_service import create_audit_log


router = APIRouter(prefix="/api/admin/export", tags=["admin-export"])


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


async def generate_csv(data: list[dict], fieldnames: list[str]):
    """Generate CSV content from data."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in data:
        writer.writerow(row)
    return output.getvalue()


async def generate_json(data: list[dict]):
    """Generate JSON content from data."""
    return json.dumps(data, indent=2, default=str)


# =============================================================================
# Routes
# =============================================================================

@router.get("/users")
async def export_users(
    request: Request,
    format: str = Query("csv", regex="^(csv|json)$"),
    include_subscription: bool = True,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.DATA_EXPORT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Export users data in CSV or JSON format.
    
    Permissions required: data:export
    
    Note: Sensitive data like passwords are never exported.
    """
    # Query users
    stmt = select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    # Build export data
    export_data = []
    for user in users:
        user_data = {
            "id": user.id,
            "email": user.email,
            "auth_uid": user.auth_uid,
            "locale": user.locale,
            "two_factor_enabled": user.two_factor_enabled,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        
        if include_subscription:
            # Get subscription
            sub_stmt = select(UserSubscription).where(
                UserSubscription.user_id == user.id,
                UserSubscription.deleted_at.is_(None),
            )
            sub_result = await db.execute(sub_stmt)
            subscription = sub_result.scalars().first()
            
            if subscription and subscription.plan:
                user_data["subscription_tier"] = subscription.plan.tier.value
                user_data["subscription_status"] = subscription.status.value
            else:
                user_data["subscription_tier"] = None
                user_data["subscription_status"] = None
        
        export_data.append(user_data)
    
    # Log export
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.DATA_EXPORTED,
        resource_type="users",
        details={"format": format, "count": len(export_data)},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    # Generate response
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format == "csv":
        fieldnames = list(export_data[0].keys()) if export_data else ["id"]
        content = await generate_csv(export_data, fieldnames)
        return StreamingResponse(
            io.StringIO(content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="users_export_{timestamp}.csv"'
            },
        )
    else:
        content = await generate_json(export_data)
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="users_export_{timestamp}.json"'
            },
        )


@router.get("/subscriptions")
async def export_subscriptions(
    request: Request,
    format: str = Query("csv", regex="^(csv|json)$"),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.DATA_EXPORT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Export subscriptions data in CSV or JSON format.
    
    Permissions required: data:export
    """
    # Query subscriptions
    stmt = (
        select(UserSubscription)
        .where(UserSubscription.deleted_at.is_(None))
        .order_by(UserSubscription.created_at.desc())
    )
    result = await db.execute(stmt)
    subscriptions = result.scalars().all()
    
    # Build export data
    export_data = []
    for sub in subscriptions:
        sub_data = {
            "id": sub.id,
            "user_id": sub.user_id,
            "tier": sub.plan.tier.value if sub.plan else None,
            "status": sub.status.value,
            "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
            "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
            "cancel_at_period_end": sub.cancel_at_period_end,
            "canceled_at": sub.canceled_at.isoformat() if sub.canceled_at else None,
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
        }
        export_data.append(sub_data)
    
    # Log export
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.DATA_EXPORTED,
        resource_type="subscriptions",
        details={"format": format, "count": len(export_data)},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    # Generate response
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format == "csv":
        fieldnames = list(export_data[0].keys()) if export_data else ["id"]
        content = await generate_csv(export_data, fieldnames)
        return StreamingResponse(
            io.StringIO(content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="subscriptions_export_{timestamp}.csv"'
            },
        )
    else:
        content = await generate_json(export_data)
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="subscriptions_export_{timestamp}.json"'
            },
        )


@router.get("/payments")
async def export_payments(
    request: Request,
    format: str = Query("csv", regex="^(csv|json)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.DATA_EXPORT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Export payments data in CSV or JSON format.
    
    Permissions required: data:export
    """
    # Query payments
    stmt = (
        select(Payment)
        .where(Payment.deleted_at.is_(None))
        .order_by(Payment.created_at.desc())
    )
    
    if start_date:
        stmt = stmt.where(Payment.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Payment.created_at <= end_date)
    
    result = await db.execute(stmt)
    payments = result.scalars().all()
    
    # Build export data
    export_data = []
    for payment in payments:
        payment_data = {
            "id": payment.id,
            "user_id": payment.user_id,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "status": payment.status.value,
            "description": payment.description,
            "stripe_payment_intent_id": payment.stripe_payment_intent_id,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
        }
        export_data.append(payment_data)
    
    # Log export
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.DATA_EXPORTED,
        resource_type="payments",
        details={"format": format, "count": len(export_data)},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    # Generate response
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format == "csv":
        fieldnames = list(export_data[0].keys()) if export_data else ["id"]
        content = await generate_csv(export_data, fieldnames)
        return StreamingResponse(
            io.StringIO(content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="payments_export_{timestamp}.csv"'
            },
        )
    else:
        content = await generate_json(export_data)
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="payments_export_{timestamp}.json"'
            },
        )


@router.get("/analytics")
async def export_analytics(
    request: Request,
    format: str = Query("csv", regex="^(csv|json)$"),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.DATA_EXPORT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Export analytics data in CSV or JSON format.
    
    This exports aggregated, anonymized KIAAN usage analytics.
    No personal data or conversation content is included.
    
    Permissions required: data:export
    """
    from backend.models import KiaanUsageAnalytics
    
    # Query analytics
    stmt = (
        select(KiaanUsageAnalytics)
        .order_by(KiaanUsageAnalytics.date.desc())
        .limit(365)  # Last year
    )
    result = await db.execute(stmt)
    analytics = result.scalars().all()
    
    # Build export data
    export_data = []
    for entry in analytics:
        analytics_data = {
            "date": entry.date.isoformat() if entry.date else None,
            "total_questions": entry.total_questions,
            "unique_users": entry.unique_users,
            "topic_distribution": entry.topic_distribution,
            "questions_by_tier": entry.questions_by_tier,
            "avg_response_time_ms": entry.avg_response_time_ms,
            "satisfaction_avg": float(entry.satisfaction_avg) if entry.satisfaction_avg else None,
        }
        export_data.append(analytics_data)
    
    # Log export
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.DATA_EXPORTED,
        resource_type="analytics",
        details={"format": format, "count": len(export_data)},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    # Generate response
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format == "csv":
        # For CSV, flatten JSON fields
        flat_data = []
        for entry in export_data:
            flat_entry = {
                "date": entry["date"],
                "total_questions": entry["total_questions"],
                "unique_users": entry["unique_users"],
                "avg_response_time_ms": entry["avg_response_time_ms"],
                "satisfaction_avg": entry["satisfaction_avg"],
            }
            flat_data.append(flat_entry)
        
        fieldnames = list(flat_data[0].keys()) if flat_data else ["date"]
        content = await generate_csv(flat_data, fieldnames)
        return StreamingResponse(
            io.StringIO(content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="analytics_export_{timestamp}.csv"'
            },
        )
    else:
        content = await generate_json(export_data)
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="analytics_export_{timestamp}.json"'
            },
        )
