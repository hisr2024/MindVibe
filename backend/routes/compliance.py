"""Compliance routes for cookie consent and audit log viewing.

This module provides:
- Cookie consent management
- Compliance audit log viewing (admin only)

KIAAN Impact: ✅ POSITIVE - Compliance features that don't affect KIAAN core functionality.
"""

import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user_optional
from backend.middleware.rbac import (
    AdminContext,
    PermissionChecker,
    get_current_admin,
)
from backend.models import (
    AdminPermission,
    CookiePreference,
    ComplianceAuditLog,
)

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


# =============================================================================
# Schemas
# =============================================================================

class CookieConsentInput(BaseModel):
    """Input for cookie preferences."""
    necessary: bool = True  # Always required, cannot be changed
    analytics: bool = False
    marketing: bool = False
    functional: bool = False
    anonymous_id: Optional[str] = None  # For non-logged-in users


class CookieConsentResponse(BaseModel):
    """Response for cookie preferences."""
    necessary: bool
    analytics: bool
    marketing: bool
    functional: bool
    updated_at: Optional[datetime.datetime]


class ComplianceAuditLogEntry(BaseModel):
    """Audit log entry for compliance actions."""
    id: int
    user_id: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[dict]
    ip_address: Optional[str]
    severity: str
    created_at: datetime.datetime


class ComplianceAuditLogListResponse(BaseModel):
    """List of compliance audit logs."""
    logs: list[ComplianceAuditLogEntry]
    total: int
    page: int
    page_size: int
    total_pages: int


# =============================================================================
# Helper Functions
# =============================================================================

def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# =============================================================================
# Cookie Consent Routes
# =============================================================================

@router.post("/cookie-consent", response_model=CookieConsentResponse)
async def save_cookie_preferences(
    request: Request,
    preferences: CookieConsentInput,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_optional),
):
    """
    Save cookie preferences.
    
    Works for both authenticated users and anonymous visitors.
    GDPR Article 6 & ePrivacy Directive compliance.
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    # Force necessary cookies to True (always required)
    preferences.necessary = True
    
    # Find existing preference
    if user_id:
        stmt = select(CookiePreference).where(CookiePreference.user_id == user_id)
    elif preferences.anonymous_id:
        stmt = select(CookiePreference).where(
            CookiePreference.anonymous_id == preferences.anonymous_id
        )
    else:
        # Create new anonymous preference
        stmt = None
        stmt = None
    
    existing = None
    if stmt is not None:
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
    
    if existing:
        # Update existing preference
        existing.necessary = preferences.necessary
        existing.analytics = preferences.analytics
        existing.marketing = preferences.marketing
        existing.functional = preferences.functional
        existing.ip_address = ip_address
        existing.user_agent = user_agent
        pref = existing
    else:
        # Create new preference
        pref = CookiePreference(
            user_id=user_id,
            anonymous_id=preferences.anonymous_id,
            necessary=preferences.necessary,
            analytics=preferences.analytics,
            marketing=preferences.marketing,
            functional=preferences.functional,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(pref)
    
    await db.commit()
    await db.refresh(pref)
    
    return CookieConsentResponse(
        necessary=pref.necessary,
        analytics=pref.analytics,
        marketing=pref.marketing,
        functional=pref.functional,
        updated_at=pref.updated_at or pref.created_at,
    )


@router.get("/cookie-consent", response_model=CookieConsentResponse)
async def get_cookie_preferences(
    request: Request,
    anonymous_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_optional),
):
    """
    Get current cookie preferences.
    
    Works for both authenticated users and anonymous visitors.
    """
    # Find preference
    if user_id:
        stmt = select(CookiePreference).where(CookiePreference.user_id == user_id)
    elif anonymous_id:
        stmt = select(CookiePreference).where(
            CookiePreference.anonymous_id == anonymous_id
        )
    else:
        # Return defaults
        return CookieConsentResponse(
            necessary=True,
            analytics=False,
            marketing=False,
            functional=False,
            updated_at=None,
        )
    
    result = await db.execute(stmt)
    pref = result.scalar_one_or_none()
    
    if not pref:
        # Return defaults
        return CookieConsentResponse(
            necessary=True,
            analytics=False,
            marketing=False,
            functional=False,
            updated_at=None,
        )
    
    return CookieConsentResponse(
        necessary=pref.necessary,
        analytics=pref.analytics,
        marketing=pref.marketing,
        functional=pref.functional,
        updated_at=pref.updated_at or pref.created_at,
    )


# =============================================================================
# Compliance Audit Logs (Admin Only)
# =============================================================================

@router.get("/audit-logs", response_model=ComplianceAuditLogListResponse)
async def list_compliance_audit_logs(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    severity: Optional[str] = Query(None, pattern="^(info|warning|critical)$"),
    start_date: Optional[datetime.datetime] = None,
    end_date: Optional[datetime.datetime] = None,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AUDIT_LOGS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    List compliance audit logs.
    
    Admin only. Requires audit_logs:view permission.
    """
    # Build query
    query = select(ComplianceAuditLog)
    count_query = select(func.count(ComplianceAuditLog.id))
    
    # Filters
    if action:
        query = query.where(ComplianceAuditLog.action == action)
        count_query = count_query.where(ComplianceAuditLog.action == action)
    
    if user_id:
        query = query.where(ComplianceAuditLog.user_id == user_id)
        count_query = count_query.where(ComplianceAuditLog.user_id == user_id)
    
    if severity:
        query = query.where(ComplianceAuditLog.severity == severity)
        count_query = count_query.where(ComplianceAuditLog.severity == severity)
    
    if start_date:
        query = query.where(ComplianceAuditLog.created_at >= start_date)
        count_query = count_query.where(ComplianceAuditLog.created_at >= start_date)
    
    if end_date:
        query = query.where(ComplianceAuditLog.created_at <= end_date)
        count_query = count_query.where(ComplianceAuditLog.created_at <= end_date)
    
    # Order by created_at desc
    query = query.order_by(ComplianceAuditLog.created_at.desc())
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    logs = result.scalars().all()
    
    total_pages = (total + page_size - 1) // page_size
    
    return ComplianceAuditLogListResponse(
        logs=[
            ComplianceAuditLogEntry(
                id=log.id,
                user_id=log.user_id,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                details=log.details,
                ip_address=log.ip_address,
                severity=log.severity,
                created_at=log.created_at,
            )
            for log in logs
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
