"""Admin A/B testing routes."""

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
    ABTest,
    ABTestAssignment,
    ABTestConversion,
    ABTestStatus,
    AdminAuditAction,
    AdminPermission,
)
from backend.services.admin_auth_service import create_audit_log


router = APIRouter(prefix="/api/admin/ab-tests", tags=["admin-ab-tests"])


# =============================================================================
# Schemas
# =============================================================================

class ABTestVariant(BaseModel):
    """A/B test variant."""
    name: str
    weight: int = Field(..., ge=0, le=100)


class ABTestSummary(BaseModel):
    """A/B test summary."""
    id: int
    name: str
    description: Optional[str]
    variants: list[ABTestVariant]
    traffic_percentage: int
    status: str
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    created_at: datetime


class ABTestListOut(BaseModel):
    """A/B test list response."""
    tests: list[ABTestSummary]
    total: int
    running_count: int


class CreateABTestIn(BaseModel):
    """Create A/B test request."""
    name: str = Field(..., min_length=1, max_length=256)
    description: Optional[str] = None
    variants: list[ABTestVariant] = Field(..., min_length=2)
    traffic_percentage: int = Field(100, ge=0, le=100)
    target_tiers: Optional[list[str]] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class UpdateABTestIn(BaseModel):
    """Update A/B test request."""
    name: Optional[str] = Field(None, min_length=1, max_length=256)
    description: Optional[str] = None
    traffic_percentage: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = Field(None, pattern=r"^(draft|running|paused|completed)$")
    target_tiers: Optional[list[str]] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class ABTestOut(BaseModel):
    """A/B test response."""
    id: int
    name: str
    description: Optional[str]
    variants: list[ABTestVariant]
    traffic_percentage: int
    status: str
    target_tiers: Optional[list[str]]
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class VariantResult(BaseModel):
    """Results for a single variant."""
    variant: str
    participants: int
    conversions: int
    conversion_rate: float
    total_value: float


class ABTestResultsOut(BaseModel):
    """A/B test results response."""
    test_id: int
    test_name: str
    status: str
    total_participants: int
    total_conversions: int
    overall_conversion_rate: float
    variants: list[VariantResult]
    winner: Optional[str]


class DeleteABTestOut(BaseModel):
    """Delete A/B test response."""
    test_id: int
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

@router.get("", response_model=ABTestListOut)
async def list_ab_tests(
    request: Request,
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AB_TESTS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    List all A/B tests.
    
    Permissions required: ab_tests:view
    """
    # Build query
    query = select(ABTest).where(ABTest.deleted_at.is_(None))
    
    if status_filter:
        status_enum = ABTestStatus(status_filter)
        query = query.where(ABTest.status == status_enum)
    
    query = query.order_by(ABTest.created_at.desc())
    
    # Execute
    result = await db.execute(query)
    tests = result.scalars().all()
    
    # Get running count
    running_stmt = select(func.count(ABTest.id)).where(
        ABTest.status == ABTestStatus.RUNNING,
        ABTest.deleted_at.is_(None),
    )
    running_result = await db.execute(running_stmt)
    running_count = running_result.scalar() or 0
    
    # Map to response
    test_summaries = [
        ABTestSummary(
            id=t.id,
            name=t.name,
            description=t.description,
            variants=[ABTestVariant(**v) for v in t.variants] if t.variants else [],
            traffic_percentage=t.traffic_percentage,
            status=t.status.value,
            starts_at=t.starts_at,
            ends_at=t.ends_at,
            created_at=t.created_at,
        )
        for t in tests
    ]
    
    return ABTestListOut(
        tests=test_summaries,
        total=len(test_summaries),
        running_count=running_count,
    )


@router.get("/{test_id}", response_model=ABTestOut)
async def get_ab_test(
    request: Request,
    test_id: int,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AB_TESTS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific A/B test.
    
    Permissions required: ab_tests:view
    """
    stmt = select(ABTest).where(
        ABTest.id == test_id,
        ABTest.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    test = result.scalars().first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A/B test not found",
        )
    
    return ABTestOut(
        id=test.id,
        name=test.name,
        description=test.description,
        variants=[ABTestVariant(**v) for v in test.variants] if test.variants else [],
        traffic_percentage=test.traffic_percentage,
        status=test.status.value,
        target_tiers=test.target_tiers,
        starts_at=test.starts_at,
        ends_at=test.ends_at,
        created_by=test.created_by,
        created_at=test.created_at,
        updated_at=test.updated_at,
    )


@router.get("/{test_id}/results", response_model=ABTestResultsOut)
async def get_ab_test_results(
    request: Request,
    test_id: int,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AB_TESTS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get results for an A/B test.
    
    Permissions required: ab_tests:view
    """
    # Get test
    stmt = select(ABTest).where(
        ABTest.id == test_id,
        ABTest.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    test = result.scalars().first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A/B test not found",
        )
    
    # Get assignments per variant
    variant_results = []
    total_participants = 0
    total_conversions = 0
    best_variant = None
    best_rate = 0.0
    
    for variant_data in test.variants or []:
        variant_name = variant_data["name"]
        
        # Count participants
        participants_stmt = select(func.count(ABTestAssignment.id)).where(
            ABTestAssignment.test_id == test_id,
            ABTestAssignment.variant == variant_name,
        )
        participants_result = await db.execute(participants_stmt)
        participants = participants_result.scalar() or 0
        
        # Count conversions
        conversions_stmt = select(func.count(ABTestConversion.id)).where(
            ABTestConversion.test_id == test_id,
            ABTestConversion.variant == variant_name,
        )
        conversions_result = await db.execute(conversions_stmt)
        conversions = conversions_result.scalar() or 0
        
        # Sum conversion value
        value_stmt = select(func.sum(ABTestConversion.event_value)).where(
            ABTestConversion.test_id == test_id,
            ABTestConversion.variant == variant_name,
        )
        value_result = await db.execute(value_stmt)
        total_value = float(value_result.scalar() or 0)
        
        conversion_rate = (conversions / participants * 100) if participants > 0 else 0.0
        
        variant_results.append(
            VariantResult(
                variant=variant_name,
                participants=participants,
                conversions=conversions,
                conversion_rate=round(conversion_rate, 2),
                total_value=round(total_value, 2),
            )
        )
        
        total_participants += participants
        total_conversions += conversions
        
        if conversion_rate > best_rate:
            best_rate = conversion_rate
            best_variant = variant_name
    
    overall_rate = (total_conversions / total_participants * 100) if total_participants > 0 else 0.0
    
    return ABTestResultsOut(
        test_id=test_id,
        test_name=test.name,
        status=test.status.value,
        total_participants=total_participants,
        total_conversions=total_conversions,
        overall_conversion_rate=round(overall_rate, 2),
        variants=variant_results,
        winner=best_variant if len(variant_results) > 1 and total_participants > 100 else None,
    )


@router.post("", response_model=ABTestOut, status_code=201)
async def create_ab_test(
    request: Request,
    payload: CreateABTestIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AB_TESTS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new A/B test.
    
    Permissions required: ab_tests:manage
    """
    # Validate variant weights sum to 100
    total_weight = sum(v.weight for v in payload.variants)
    if total_weight != 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Variant weights must sum to 100 (got {total_weight})",
        )
    
    # Validate schedule
    if payload.starts_at and payload.ends_at:
        if payload.ends_at <= payload.starts_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date",
            )
    
    # Create test
    test = ABTest(
        name=payload.name,
        description=payload.description,
        variants=[v.model_dump() for v in payload.variants],
        traffic_percentage=payload.traffic_percentage,
        status=ABTestStatus.DRAFT,
        target_tiers=payload.target_tiers,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        created_by=admin.admin.id,
    )
    db.add(test)
    await db.commit()
    await db.refresh(test)
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.AB_TEST_CREATED,
        resource_type="ab_test",
        resource_id=str(test.id),
        details={
            "name": test.name,
            "variants": [v["name"] for v in test.variants],
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return ABTestOut(
        id=test.id,
        name=test.name,
        description=test.description,
        variants=[ABTestVariant(**v) for v in test.variants] if test.variants else [],
        traffic_percentage=test.traffic_percentage,
        status=test.status.value,
        target_tiers=test.target_tiers,
        starts_at=test.starts_at,
        ends_at=test.ends_at,
        created_by=test.created_by,
        created_at=test.created_at,
        updated_at=test.updated_at,
    )


@router.put("/{test_id}", response_model=ABTestOut)
async def update_ab_test(
    request: Request,
    test_id: int,
    payload: UpdateABTestIn,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AB_TESTS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an A/B test.
    
    Permissions required: ab_tests:manage
    """
    # Get test
    stmt = select(ABTest).where(
        ABTest.id == test_id,
        ABTest.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    test = result.scalars().first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A/B test not found",
        )
    
    # Track changes for audit
    changes = {}
    
    # Update fields
    if payload.name is not None:
        changes["name"] = {"old": test.name, "new": payload.name}
        test.name = payload.name
    if payload.description is not None:
        test.description = payload.description
    if payload.traffic_percentage is not None:
        changes["traffic_percentage"] = {
            "old": test.traffic_percentage,
            "new": payload.traffic_percentage,
        }
        test.traffic_percentage = payload.traffic_percentage
    if payload.status is not None:
        changes["status"] = {"old": test.status.value, "new": payload.status}
        test.status = ABTestStatus(payload.status)
    if payload.target_tiers is not None:
        test.target_tiers = payload.target_tiers
    if payload.starts_at is not None:
        test.starts_at = payload.starts_at
    if payload.ends_at is not None:
        test.ends_at = payload.ends_at
    
    await db.commit()
    await db.refresh(test)
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.AB_TEST_UPDATED,
        resource_type="ab_test",
        resource_id=str(test_id),
        details={"changes": changes},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return ABTestOut(
        id=test.id,
        name=test.name,
        description=test.description,
        variants=[ABTestVariant(**v) for v in test.variants] if test.variants else [],
        traffic_percentage=test.traffic_percentage,
        status=test.status.value,
        target_tiers=test.target_tiers,
        starts_at=test.starts_at,
        ends_at=test.ends_at,
        created_by=test.created_by,
        created_at=test.created_at,
        updated_at=test.updated_at,
    )


@router.delete("/{test_id}", response_model=DeleteABTestOut)
async def delete_ab_test(
    request: Request,
    test_id: int,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AB_TESTS_MANAGE)),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an A/B test (soft delete).
    
    Permissions required: ab_tests:manage
    """
    # Get test
    stmt = select(ABTest).where(
        ABTest.id == test_id,
        ABTest.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    test = result.scalars().first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A/B test not found",
        )
    
    if test.status == ABTestStatus.RUNNING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a running test. Pause it first.",
        )
    
    # Soft delete
    test.soft_delete()
    await db.commit()
    
    # Log action
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.AB_TEST_DELETED,
        resource_type="ab_test",
        resource_id=str(test_id),
        details={"name": test.name},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return DeleteABTestOut(
        test_id=test_id,
        deleted=True,
    )
