"""Admin content moderation routes."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select, update
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
    FlaggedContent,
    ModerationStatus,
)
from backend.services.admin_auth_service import create_audit_log


router = APIRouter(prefix="/api/admin/moderation", tags=["admin-moderation"])


# =============================================================================
# Schemas
# =============================================================================

class FlaggedContentSummary(BaseModel):
    """Flagged content summary."""
    id: int
    content_type: str
    content_id: str
    user_id: str
    reason: str
    details: Optional[str]
    status: str
    flagged_at: datetime
    moderated_by: Optional[str]
    moderated_at: Optional[datetime]


class FlaggedContentListOut(BaseModel):
    """Paginated flagged content list response."""
    items: list[FlaggedContentSummary]
    total: int
    page: int
    page_size: int
    pending_count: int


class ModerateContentIn(BaseModel):
    """Moderate content request."""
    action: str  # "approve" or "reject"
    note: Optional[str] = None


class ModerateContentOut(BaseModel):
    """Moderate content response."""
    content_id: int
    action: str
    moderated: bool


class ModerationStatsOut(BaseModel):
    """Moderation statistics."""
    total_pending: int
    total_approved: int
    total_rejected: int
    items_moderated_today: int


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

@router.get("/flagged", response_model=FlaggedContentListOut)
async def list_flagged_content(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    content_type: Optional[str] = None,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.MODERATION_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    List flagged content with filtering and pagination.
    
    Permissions required: moderation:view
    """
    # Build query
    query = select(FlaggedContent).where(FlaggedContent.deleted_at.is_(None))
    count_query = select(func.count(FlaggedContent.id)).where(
        FlaggedContent.deleted_at.is_(None)
    )
    
    # Status filter
    if status_filter:
        status_enum = ModerationStatus(status_filter)
        query = query.where(FlaggedContent.status == status_enum)
        count_query = count_query.where(FlaggedContent.status == status_enum)
    
    # Content type filter
    if content_type:
        query = query.where(FlaggedContent.content_type == content_type)
        count_query = count_query.where(FlaggedContent.content_type == content_type)
    
    # Order by flagged_at desc (most recent first)
    query = query.order_by(FlaggedContent.flagged_at.desc())
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get pending count
    pending_count_query = select(func.count(FlaggedContent.id)).where(
        FlaggedContent.status == ModerationStatus.PENDING,
        FlaggedContent.deleted_at.is_(None),
    )
    pending_result = await db.execute(pending_count_query)
    pending_count = pending_result.scalar() or 0
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    items = result.scalars().all()
    
    # Map to response
    content_summaries = [
        FlaggedContentSummary(
            id=item.id,
            content_type=item.content_type,
            content_id=item.content_id,
            user_id=item.user_id,
            reason=item.reason,
            details=item.details,
            status=item.status.value,
            flagged_at=item.flagged_at,
            moderated_by=item.moderated_by,
            moderated_at=item.moderated_at,
        )
        for item in items
    ]
    
    return FlaggedContentListOut(
        items=content_summaries,
        total=total,
        page=page,
        page_size=page_size,
        pending_count=pending_count,
    )


@router.get("/stats", response_model=ModerationStatsOut)
async def get_moderation_stats(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.MODERATION_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get moderation statistics.
    
    Permissions required: moderation:view
    """
    # Pending count
    pending_stmt = select(func.count(FlaggedContent.id)).where(
        FlaggedContent.status == ModerationStatus.PENDING,
        FlaggedContent.deleted_at.is_(None),
    )
    pending_result = await db.execute(pending_stmt)
    total_pending = pending_result.scalar() or 0
    
    # Approved count
    approved_stmt = select(func.count(FlaggedContent.id)).where(
        FlaggedContent.status == ModerationStatus.APPROVED,
        FlaggedContent.deleted_at.is_(None),
    )
    approved_result = await db.execute(approved_stmt)
    total_approved = approved_result.scalar() or 0
    
    # Rejected count
    rejected_stmt = select(func.count(FlaggedContent.id)).where(
        FlaggedContent.status == ModerationStatus.REJECTED,
        FlaggedContent.deleted_at.is_(None),
    )
    rejected_result = await db.execute(rejected_stmt)
    total_rejected = rejected_result.scalar() or 0
    
    # Moderated today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_stmt = select(func.count(FlaggedContent.id)).where(
        FlaggedContent.moderated_at >= today_start,
        FlaggedContent.deleted_at.is_(None),
    )
    today_result = await db.execute(today_stmt)
    items_moderated_today = today_result.scalar() or 0
    
    return ModerationStatsOut(
        total_pending=total_pending,
        total_approved=total_approved,
        total_rejected=total_rejected,
        items_moderated_today=items_moderated_today,
    )


@router.post("/{content_id}/moderate", response_model=ModerateContentOut)
async def moderate_content(
    request: Request,
    content_id: int,
    payload: ModerateContentIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.MODERATION_ACTION)),
    db: AsyncSession = Depends(get_db),
):
    """
    Approve or reject flagged content.
    
    Permissions required: moderation:action
    """
    # Validate action
    if payload.action not in ["approve", "reject"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be 'approve' or 'reject'",
        )
    
    # Get flagged content
    stmt = select(FlaggedContent).where(
        FlaggedContent.id == content_id,
        FlaggedContent.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    content = result.scalars().first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flagged content not found",
        )
    
    if content.status != ModerationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content has already been moderated",
        )
    
    # Update moderation status
    new_status = (
        ModerationStatus.APPROVED
        if payload.action == "approve"
        else ModerationStatus.REJECTED
    )
    
    await db.execute(
        update(FlaggedContent)
        .where(FlaggedContent.id == content_id)
        .values(
            status=new_status,
            moderated_by=admin.admin.id,
            moderated_at=datetime.now(),
            moderation_note=payload.note,
        )
    )
    await db.commit()
    
    # Determine audit action
    audit_action = (
        AdminAuditAction.CONTENT_APPROVED
        if payload.action == "approve"
        else AdminAuditAction.CONTENT_REJECTED
    )
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=audit_action,
        resource_type="flagged_content",
        resource_id=str(content_id),
        details={
            "content_type": content.content_type,
            "original_content_id": content.content_id,
            "note": payload.note,
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return ModerateContentOut(
        content_id=content_id,
        action=payload.action,
        moderated=True,
    )
