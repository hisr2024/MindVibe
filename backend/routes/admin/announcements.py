"""Admin announcements routes."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
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
    Announcement,
    AnnouncementType,
)
from backend.services.admin_auth_service import create_audit_log


router = APIRouter(prefix="/api/admin/announcements", tags=["admin-announcements"])


# =============================================================================
# Schemas
# =============================================================================

class AnnouncementSummary(BaseModel):
    """Announcement summary."""
    id: int
    title: str
    content: str
    type: str
    target_tiers: Optional[list[str]]
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    is_active: bool
    created_at: datetime


class AnnouncementListOut(BaseModel):
    """Announcement list response."""
    announcements: list[AnnouncementSummary]
    total: int
    active_count: int


class CreateAnnouncementIn(BaseModel):
    """Create announcement request."""
    title: str = Field(..., min_length=1, max_length=256)
    content: str = Field(..., min_length=1)
    type: str = Field("banner", pattern=r"^(banner|modal|toast|email)$")
    target_tiers: Optional[list[str]] = None
    target_user_ids: Optional[list[str]] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: bool = True


class UpdateAnnouncementIn(BaseModel):
    """Update announcement request."""
    title: Optional[str] = Field(None, min_length=1, max_length=256)
    content: Optional[str] = Field(None, min_length=1)
    type: Optional[str] = Field(None, pattern=r"^(banner|modal|toast|email)$")
    target_tiers: Optional[list[str]] = None
    target_user_ids: Optional[list[str]] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class AnnouncementOut(BaseModel):
    """Announcement response."""
    id: int
    title: str
    content: str
    type: str
    target_tiers: Optional[list[str]]
    target_user_ids: Optional[list[str]]
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    is_active: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class DeleteAnnouncementOut(BaseModel):
    """Delete announcement response."""
    announcement_id: int
    deleted: bool


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

@router.get("", response_model=AnnouncementListOut)
async def list_announcements(
    request: Request,
    active_only: bool = False,
    type_filter: Optional[str] = Query(None, alias="type"),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.ANNOUNCEMENTS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    List all announcements.
    
    Permissions required: announcements:view
    """
    # Build query
    query = select(Announcement).where(Announcement.deleted_at.is_(None))
    
    if active_only:
        query = query.where(Announcement.is_active == True)
    
    if type_filter:
        type_enum = AnnouncementType(type_filter)
        query = query.where(Announcement.type == type_enum)
    
    query = query.order_by(Announcement.created_at.desc())
    
    # Execute
    result = await db.execute(query)
    announcements = result.scalars().all()
    
    # Get active count
    active_stmt = select(func.count(Announcement.id)).where(
        Announcement.is_active == True,
        Announcement.deleted_at.is_(None),
    )
    active_result = await db.execute(active_stmt)
    active_count = active_result.scalar() or 0
    
    # Map to response
    announcement_summaries = [
        AnnouncementSummary(
            id=a.id,
            title=a.title,
            content=a.content,
            type=a.type.value,
            target_tiers=a.target_tiers,
            starts_at=a.starts_at,
            ends_at=a.ends_at,
            is_active=a.is_active,
            created_at=a.created_at,
        )
        for a in announcements
    ]
    
    return AnnouncementListOut(
        announcements=announcement_summaries,
        total=len(announcement_summaries),
        active_count=active_count,
    )


@router.get("/{announcement_id}", response_model=AnnouncementOut)
async def get_announcement(
    request: Request,
    announcement_id: int,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.ANNOUNCEMENTS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific announcement.
    
    Permissions required: announcements:view
    """
    stmt = select(Announcement).where(
        Announcement.id == announcement_id,
        Announcement.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    announcement = result.scalars().first()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )
    
    return AnnouncementOut(
        id=announcement.id,
        title=announcement.title,
        content=announcement.content,
        type=announcement.type.value,
        target_tiers=announcement.target_tiers,
        target_user_ids=announcement.target_user_ids,
        starts_at=announcement.starts_at,
        ends_at=announcement.ends_at,
        is_active=announcement.is_active,
        created_by=announcement.created_by,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at,
    )


@router.post("", response_model=AnnouncementOut, status_code=201)
async def create_announcement(
    request: Request,
    payload: CreateAnnouncementIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.ANNOUNCEMENTS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new announcement.
    
    Permissions required: announcements:manage
    """
    # Validate schedule
    if payload.starts_at and payload.ends_at:
        if payload.ends_at <= payload.starts_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date",
            )
    
    # Create announcement
    announcement = Announcement(
        title=payload.title,
        content=payload.content,
        type=AnnouncementType(payload.type),
        target_tiers=payload.target_tiers,
        target_user_ids=payload.target_user_ids,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        is_active=payload.is_active,
        created_by=admin.admin.id,
    )
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.ANNOUNCEMENT_CREATED,
        resource_type="announcement",
        resource_id=str(announcement.id),
        details={
            "title": announcement.title,
            "type": announcement.type.value,
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return AnnouncementOut(
        id=announcement.id,
        title=announcement.title,
        content=announcement.content,
        type=announcement.type.value,
        target_tiers=announcement.target_tiers,
        target_user_ids=announcement.target_user_ids,
        starts_at=announcement.starts_at,
        ends_at=announcement.ends_at,
        is_active=announcement.is_active,
        created_by=announcement.created_by,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at,
    )


@router.put("/{announcement_id}", response_model=AnnouncementOut)
async def update_announcement(
    request: Request,
    announcement_id: int,
    payload: UpdateAnnouncementIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.ANNOUNCEMENTS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an announcement.
    
    Permissions required: announcements:manage
    """
    # Get announcement
    stmt = select(Announcement).where(
        Announcement.id == announcement_id,
        Announcement.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    announcement = result.scalars().first()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )
    
    # Track changes for audit
    changes = {}
    
    # Update fields
    if payload.title is not None:
        changes["title"] = {"old": announcement.title, "new": payload.title}
        announcement.title = payload.title
    if payload.content is not None:
        announcement.content = payload.content
    if payload.type is not None:
        changes["type"] = {"old": announcement.type.value, "new": payload.type}
        announcement.type = AnnouncementType(payload.type)
    if payload.target_tiers is not None:
        announcement.target_tiers = payload.target_tiers
    if payload.target_user_ids is not None:
        announcement.target_user_ids = payload.target_user_ids
    if payload.starts_at is not None:
        announcement.starts_at = payload.starts_at
    if payload.ends_at is not None:
        announcement.ends_at = payload.ends_at
    if payload.is_active is not None:
        changes["is_active"] = {"old": announcement.is_active, "new": payload.is_active}
        announcement.is_active = payload.is_active
    
    await db.commit()
    await db.refresh(announcement)
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.ANNOUNCEMENT_UPDATED,
        resource_type="announcement",
        resource_id=str(announcement_id),
        details={"changes": changes},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return AnnouncementOut(
        id=announcement.id,
        title=announcement.title,
        content=announcement.content,
        type=announcement.type.value,
        target_tiers=announcement.target_tiers,
        target_user_ids=announcement.target_user_ids,
        starts_at=announcement.starts_at,
        ends_at=announcement.ends_at,
        is_active=announcement.is_active,
        created_by=announcement.created_by,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at,
    )


@router.delete("/{announcement_id}", response_model=DeleteAnnouncementOut)
async def delete_announcement(
    request: Request,
    announcement_id: int,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.ANNOUNCEMENTS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an announcement (soft delete).
    
    Permissions required: announcements:manage
    """
    # Get announcement
    stmt = select(Announcement).where(
        Announcement.id == announcement_id,
        Announcement.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    announcement = result.scalars().first()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )
    
    # Soft delete
    announcement.soft_delete()
    await db.commit()
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.ANNOUNCEMENT_DELETED,
        resource_type="announcement",
        resource_id=str(announcement_id),
        details={"title": announcement.title},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return DeleteAnnouncementOut(
        announcement_id=announcement_id,
        deleted=True,
    )
