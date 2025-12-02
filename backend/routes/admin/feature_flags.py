"""Admin feature flags routes."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
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
    FeatureFlag,
)
from backend.services.admin_auth_service import create_audit_log


router = APIRouter(prefix="/api/admin/feature-flags", tags=["admin-feature-flags"])


# =============================================================================
# Schemas
# =============================================================================

class FeatureFlagSummary(BaseModel):
    """Feature flag summary."""
    id: int
    key: str
    name: str
    description: Optional[str]
    enabled: bool
    rollout_percentage: int
    target_tiers: Optional[list[str]]
    target_user_ids: Optional[list[str]]
    created_at: datetime
    updated_at: Optional[datetime]


class FeatureFlagListOut(BaseModel):
    """Feature flag list response."""
    flags: list[FeatureFlagSummary]
    total: int


class CreateFeatureFlagIn(BaseModel):
    """Create feature flag request."""
    key: str = Field(..., min_length=1, max_length=128, pattern=r"^[a-z0-9_-]+$")
    name: str = Field(..., min_length=1, max_length=256)
    description: Optional[str] = None
    enabled: bool = False
    rollout_percentage: int = Field(100, ge=0, le=100)
    target_tiers: Optional[list[str]] = None
    target_user_ids: Optional[list[str]] = None


class UpdateFeatureFlagIn(BaseModel):
    """Update feature flag request."""
    name: Optional[str] = Field(None, min_length=1, max_length=256)
    description: Optional[str] = None
    enabled: Optional[bool] = None
    rollout_percentage: Optional[int] = Field(None, ge=0, le=100)
    target_tiers: Optional[list[str]] = None
    target_user_ids: Optional[list[str]] = None


class FeatureFlagOut(BaseModel):
    """Feature flag response."""
    id: int
    key: str
    name: str
    description: Optional[str]
    enabled: bool
    rollout_percentage: int
    target_tiers: Optional[list[str]]
    target_user_ids: Optional[list[str]]
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class DeleteFeatureFlagOut(BaseModel):
    """Delete feature flag response."""
    flag_id: int
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

@router.get("", response_model=FeatureFlagListOut)
async def list_feature_flags(
    request: Request,
    enabled_only: bool = False,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.FEATURE_FLAGS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    List all feature flags.
    
    Permissions required: feature_flags:view
    """
    # Build query
    query = select(FeatureFlag).where(FeatureFlag.deleted_at.is_(None))
    
    if enabled_only:
        query = query.where(FeatureFlag.enabled == True)
    
    query = query.order_by(FeatureFlag.key.asc())
    
    # Execute
    result = await db.execute(query)
    flags = result.scalars().all()
    
    # Map to response
    flag_summaries = [
        FeatureFlagSummary(
            id=f.id,
            key=f.key,
            name=f.name,
            description=f.description,
            enabled=f.enabled,
            rollout_percentage=f.rollout_percentage,
            target_tiers=f.target_tiers,
            target_user_ids=f.target_user_ids,
            created_at=f.created_at,
            updated_at=f.updated_at,
        )
        for f in flags
    ]
    
    return FeatureFlagListOut(
        flags=flag_summaries,
        total=len(flag_summaries),
    )


@router.get("/{flag_id}", response_model=FeatureFlagOut)
async def get_feature_flag(
    request: Request,
    flag_id: int,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.FEATURE_FLAGS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific feature flag.
    
    Permissions required: feature_flags:view
    """
    stmt = select(FeatureFlag).where(
        FeatureFlag.id == flag_id,
        FeatureFlag.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    flag = result.scalars().first()
    
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found",
        )
    
    return FeatureFlagOut(
        id=flag.id,
        key=flag.key,
        name=flag.name,
        description=flag.description,
        enabled=flag.enabled,
        rollout_percentage=flag.rollout_percentage,
        target_tiers=flag.target_tiers,
        target_user_ids=flag.target_user_ids,
        created_by=flag.created_by,
        created_at=flag.created_at,
        updated_at=flag.updated_at,
    )


@router.post("", response_model=FeatureFlagOut, status_code=201)
async def create_feature_flag(
    request: Request,
    payload: CreateFeatureFlagIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.FEATURE_FLAGS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new feature flag.
    
    Permissions required: feature_flags:manage
    """
    # Check for duplicate key
    existing_stmt = select(FeatureFlag).where(
        FeatureFlag.key == payload.key,
        FeatureFlag.deleted_at.is_(None),
    )
    existing_result = await db.execute(existing_stmt)
    if existing_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Feature flag with key '{payload.key}' already exists",
        )
    
    # Create flag
    flag = FeatureFlag(
        key=payload.key,
        name=payload.name,
        description=payload.description,
        enabled=payload.enabled,
        rollout_percentage=payload.rollout_percentage,
        target_tiers=payload.target_tiers,
        target_user_ids=payload.target_user_ids,
        created_by=admin.admin.id,
    )
    db.add(flag)
    await db.commit()
    await db.refresh(flag)
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.FEATURE_FLAG_CREATED,
        resource_type="feature_flag",
        resource_id=str(flag.id),
        details={
            "key": flag.key,
            "name": flag.name,
            "enabled": flag.enabled,
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return FeatureFlagOut(
        id=flag.id,
        key=flag.key,
        name=flag.name,
        description=flag.description,
        enabled=flag.enabled,
        rollout_percentage=flag.rollout_percentage,
        target_tiers=flag.target_tiers,
        target_user_ids=flag.target_user_ids,
        created_by=flag.created_by,
        created_at=flag.created_at,
        updated_at=flag.updated_at,
    )


@router.put("/{flag_id}", response_model=FeatureFlagOut)
async def update_feature_flag(
    request: Request,
    flag_id: int,
    payload: UpdateFeatureFlagIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.FEATURE_FLAGS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a feature flag.
    
    Permissions required: feature_flags:manage
    """
    # Get flag
    stmt = select(FeatureFlag).where(
        FeatureFlag.id == flag_id,
        FeatureFlag.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    flag = result.scalars().first()
    
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found",
        )
    
    # Track changes for audit
    changes = {}
    
    # Update fields
    if payload.name is not None:
        changes["name"] = {"old": flag.name, "new": payload.name}
        flag.name = payload.name
    if payload.description is not None:
        flag.description = payload.description
    if payload.enabled is not None:
        changes["enabled"] = {"old": flag.enabled, "new": payload.enabled}
        flag.enabled = payload.enabled
    if payload.rollout_percentage is not None:
        changes["rollout_percentage"] = {
            "old": flag.rollout_percentage,
            "new": payload.rollout_percentage,
        }
        flag.rollout_percentage = payload.rollout_percentage
    if payload.target_tiers is not None:
        flag.target_tiers = payload.target_tiers
    if payload.target_user_ids is not None:
        flag.target_user_ids = payload.target_user_ids
    
    await db.commit()
    await db.refresh(flag)
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.FEATURE_FLAG_UPDATED,
        resource_type="feature_flag",
        resource_id=str(flag_id),
        details={"changes": changes, "key": flag.key},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return FeatureFlagOut(
        id=flag.id,
        key=flag.key,
        name=flag.name,
        description=flag.description,
        enabled=flag.enabled,
        rollout_percentage=flag.rollout_percentage,
        target_tiers=flag.target_tiers,
        target_user_ids=flag.target_user_ids,
        created_by=flag.created_by,
        created_at=flag.created_at,
        updated_at=flag.updated_at,
    )


@router.delete("/{flag_id}", response_model=DeleteFeatureFlagOut)
async def delete_feature_flag(
    request: Request,
    flag_id: int,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.FEATURE_FLAGS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a feature flag (soft delete).
    
    Permissions required: feature_flags:manage
    """
    # Get flag
    stmt = select(FeatureFlag).where(
        FeatureFlag.id == flag_id,
        FeatureFlag.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    flag = result.scalars().first()
    
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found",
        )
    
    # Soft delete
    flag.soft_delete()
    await db.commit()
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.FEATURE_FLAG_DELETED,
        resource_type="feature_flag",
        resource_id=str(flag_id),
        details={"key": flag.key},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return DeleteFeatureFlagOut(
        flag_id=flag_id,
        deleted=True,
    )
