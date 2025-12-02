"""Admin audit logs routes."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
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
    AdminAuditLog,
    AdminPermission,
    AdminUser,
)


router = APIRouter(prefix="/api/admin/audit-logs", tags=["admin-audit-logs"])


# =============================================================================
# Schemas
# =============================================================================

class AuditLogEntry(BaseModel):
    """Audit log entry."""
    id: int
    admin_id: Optional[str]
    admin_email: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[dict]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime


class AuditLogListOut(BaseModel):
    """Audit log list response."""
    logs: list[AuditLogEntry]
    total: int
    page: int
    page_size: int
    total_pages: int


class AuditLogStatsOut(BaseModel):
    """Audit log statistics."""
    total_logs: int
    logs_today: int
    logs_this_week: int
    top_actions: dict[str, int]
    top_admins: dict[str, int]


# =============================================================================
# Routes
# =============================================================================

@router.get("", response_model=AuditLogListOut)
async def list_audit_logs(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    admin_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AUDIT_LOGS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    List audit logs with filtering and pagination.
    
    Permissions required: audit_logs:view
    """
    # Build query
    query = select(AdminAuditLog)
    count_query = select(func.count(AdminAuditLog.id))
    
    # Filters
    if action:
        action_enum = AdminAuditAction(action)
        query = query.where(AdminAuditLog.action == action_enum)
        count_query = count_query.where(AdminAuditLog.action == action_enum)
    
    if admin_id:
        query = query.where(AdminAuditLog.admin_id == admin_id)
        count_query = count_query.where(AdminAuditLog.admin_id == admin_id)
    
    if resource_type:
        query = query.where(AdminAuditLog.resource_type == resource_type)
        count_query = count_query.where(AdminAuditLog.resource_type == resource_type)
    
    if resource_id:
        query = query.where(AdminAuditLog.resource_id == resource_id)
        count_query = count_query.where(AdminAuditLog.resource_id == resource_id)
    
    if start_date:
        query = query.where(AdminAuditLog.created_at >= start_date)
        count_query = count_query.where(AdminAuditLog.created_at >= start_date)
    
    if end_date:
        query = query.where(AdminAuditLog.created_at <= end_date)
        count_query = count_query.where(AdminAuditLog.created_at <= end_date)
    
    # Order by created_at desc (most recent first)
    query = query.order_by(AdminAuditLog.created_at.desc())
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Get admin emails for display
    admin_ids = {log.admin_id for log in logs if log.admin_id}
    admin_emails = {}
    if admin_ids:
        admin_stmt = select(AdminUser.id, AdminUser.email).where(AdminUser.id.in_(admin_ids))
        admin_result = await db.execute(admin_stmt)
        admin_emails = {row.id: row.email for row in admin_result.all()}
    
    # Map to response
    log_entries = [
        AuditLogEntry(
            id=log.id,
            admin_id=log.admin_id,
            admin_email=admin_emails.get(log.admin_id) if log.admin_id else None,
            action=log.action.value,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            details=log.details,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            created_at=log.created_at,
        )
        for log in logs
    ]
    
    total_pages = (total + page_size - 1) // page_size
    
    return AuditLogListOut(
        logs=log_entries,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/stats", response_model=AuditLogStatsOut)
async def get_audit_log_stats(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AUDIT_LOGS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get audit log statistics.
    
    Permissions required: audit_logs:view
    """
    from datetime import timedelta
    
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    
    # Total logs
    total_stmt = select(func.count(AdminAuditLog.id))
    total_result = await db.execute(total_stmt)
    total_logs = total_result.scalar() or 0
    
    # Logs today
    today_stmt = select(func.count(AdminAuditLog.id)).where(
        AdminAuditLog.created_at >= today_start
    )
    today_result = await db.execute(today_stmt)
    logs_today = today_result.scalar() or 0
    
    # Logs this week
    week_stmt = select(func.count(AdminAuditLog.id)).where(
        AdminAuditLog.created_at >= week_start
    )
    week_result = await db.execute(week_stmt)
    logs_this_week = week_result.scalar() or 0
    
    # Top actions (last 7 days)
    top_actions_stmt = (
        select(AdminAuditLog.action, func.count(AdminAuditLog.id).label("count"))
        .where(AdminAuditLog.created_at >= week_start)
        .group_by(AdminAuditLog.action)
        .order_by(func.count(AdminAuditLog.id).desc())
        .limit(10)
    )
    top_actions_result = await db.execute(top_actions_stmt)
    top_actions = {row.action.value: row.count for row in top_actions_result.all()}
    
    # Top admins (last 7 days)
    top_admins_stmt = (
        select(AdminUser.email, func.count(AdminAuditLog.id).label("count"))
        .join(AdminUser, AdminUser.id == AdminAuditLog.admin_id)
        .where(AdminAuditLog.created_at >= week_start)
        .group_by(AdminUser.email)
        .order_by(func.count(AdminAuditLog.id).desc())
        .limit(10)
    )
    top_admins_result = await db.execute(top_admins_stmt)
    top_admins = {row.email: row.count for row in top_admins_result.all()}
    
    return AuditLogStatsOut(
        total_logs=total_logs,
        logs_today=logs_today,
        logs_this_week=logs_this_week,
        top_actions=top_actions,
        top_admins=top_admins,
    )
