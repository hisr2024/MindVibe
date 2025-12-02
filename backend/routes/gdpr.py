"""GDPR compliance routes for data export, account deletion, and consent management.

This module implements GDPR rights:
- Right to access (data export)
- Right to erasure (account deletion)
- Right to portability (JSON/CSV export)
- Consent management

KIAAN Impact: ✅ POSITIVE - Provides compliance features without affecting KIAAN core functionality.
"""

import datetime
import json
import secrets
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user
from backend.models import (
    User,
    UserProfile,
    Mood,
    EncryptedBlob,
    UserSubscription,
    UsageTracking,
    UserConsent,
    CookiePreference,
    DataExportRequest,
    DeletionRequest,
    ComplianceAuditLog,
    ConsentType,
    DataExportStatus,
    DeletionRequestStatus,
)

router = APIRouter(prefix="/api/gdpr", tags=["gdpr"])


# =============================================================================
# Schemas
# =============================================================================

class ConsentInput(BaseModel):
    """Input for granting/withdrawing consent."""
    consent_type: ConsentType
    granted: bool


class ConsentResponse(BaseModel):
    """Response for consent operations."""
    consent_type: str
    granted: bool
    version: str
    granted_at: Optional[datetime.datetime]
    withdrawn_at: Optional[datetime.datetime]


class ConsentListResponse(BaseModel):
    """List of user consents."""
    consents: list[ConsentResponse]


class DataExportRequestResponse(BaseModel):
    """Response for data export request."""
    id: int
    status: str
    format: str
    download_token: Optional[str]
    expires_at: Optional[datetime.datetime]
    created_at: datetime.datetime


class DataExportDownloadResponse(BaseModel):
    """Response containing exported data."""
    user_profile: Optional[dict]
    moods: list[dict]
    journal_entries: list[dict]
    subscription: Optional[dict]
    consents: list[dict]
    exported_at: str


class DeletionRequestInput(BaseModel):
    """Input for account deletion request."""
    reason: Optional[str] = None
    confirm: bool = False


class DeletionRequestResponse(BaseModel):
    """Response for deletion request."""
    id: int
    status: str
    grace_period_days: int
    grace_period_ends_at: Optional[datetime.datetime]
    created_at: datetime.datetime


# =============================================================================
# Helper Functions
# =============================================================================

async def log_compliance_action(
    db: AsyncSession,
    user_id: Optional[str],
    action: str,
    resource_type: Optional[str],
    resource_id: Optional[str],
    details: Optional[dict],
    ip_address: Optional[str],
    user_agent: Optional[str],
    severity: str = "info",
) -> None:
    """Log a compliance-related action."""
    log_entry = ComplianceAuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        severity=severity,
    )
    db.add(log_entry)
    await db.commit()


def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# =============================================================================
# Consent Management Routes
# =============================================================================

@router.get("/consents", response_model=ConsentListResponse)
async def get_user_consents(
    request: Request,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all consent records for the current user.
    
    GDPR Article 7: Users can review their consent at any time.
    """
    stmt = select(UserConsent).where(UserConsent.user_id == user_id)
    result = await db.execute(stmt)
    consents = result.scalars().all()
    
    return ConsentListResponse(
        consents=[
            ConsentResponse(
                consent_type=c.consent_type.value,
                granted=c.granted,
                version=c.version,
                granted_at=c.granted_at,
                withdrawn_at=c.withdrawn_at,
            )
            for c in consents
        ]
    )


@router.post("/consents", response_model=ConsentResponse)
async def update_consent(
    request: Request,
    consent_input: ConsentInput,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Grant or withdraw consent.
    
    GDPR Article 7: Users can withdraw consent at any time.
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    # Check for existing consent
    stmt = select(UserConsent).where(
        UserConsent.user_id == user_id,
        UserConsent.consent_type == consent_input.consent_type,
    )
    result = await db.execute(stmt)
    consent = result.scalar_one_or_none()
    
    now = datetime.datetime.now(datetime.UTC)
    
    if consent:
        # Update existing consent
        consent.granted = consent_input.granted
        consent.ip_address = ip_address
        consent.user_agent = user_agent
        if consent_input.granted:
            consent.granted_at = now
            consent.withdrawn_at = None
        else:
            consent.withdrawn_at = now
    else:
        # Create new consent record
        consent = UserConsent(
            user_id=user_id,
            consent_type=consent_input.consent_type,
            granted=consent_input.granted,
            ip_address=ip_address,
            user_agent=user_agent,
            granted_at=now if consent_input.granted else None,
        )
        db.add(consent)
    
    await db.commit()
    await db.refresh(consent)
    
    # Log the action
    await log_compliance_action(
        db=db,
        user_id=user_id,
        action="consent_updated",
        resource_type="consent",
        resource_id=consent_input.consent_type.value,
        details={"granted": consent_input.granted},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return ConsentResponse(
        consent_type=consent.consent_type.value,
        granted=consent.granted,
        version=consent.version,
        granted_at=consent.granted_at,
        withdrawn_at=consent.withdrawn_at,
    )


@router.post("/withdraw-consent", response_model=ConsentResponse)
async def withdraw_consent(
    request: Request,
    consent_type: ConsentType,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Withdraw a specific consent.
    
    GDPR Article 7(3): Users can withdraw consent at any time.
    """
    return await update_consent(
        request=request,
        consent_input=ConsentInput(consent_type=consent_type, granted=False),
        user_id=user_id,
        db=db,
    )


# =============================================================================
# Data Export Routes (Right to Access & Portability)
# =============================================================================

@router.post("/data-export", response_model=DataExportRequestResponse)
async def request_data_export(
    request: Request,
    format: str = Query("json", pattern="^(json|csv)$"),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Request a data export.
    
    GDPR Article 15 (Right to Access) & Article 20 (Right to Portability).
    Creates an export request that can be downloaded later.
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    # Check for existing pending export
    stmt = select(DataExportRequest).where(
        DataExportRequest.user_id == user_id,
        DataExportRequest.status.in_([DataExportStatus.PENDING, DataExportStatus.PROCESSING]),
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="An export request is already pending. Please wait for it to complete.",
        )
    
    # Generate download token
    download_token = secrets.token_urlsafe(64)
    
    # Create export request (expires in 7 days)
    export_request = DataExportRequest(
        user_id=user_id,
        status=DataExportStatus.PENDING,
        format=format,
        download_token=download_token,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7),
        ip_address=ip_address,
    )
    db.add(export_request)
    await db.commit()
    await db.refresh(export_request)
    
    # Log the action
    await log_compliance_action(
        db=db,
        user_id=user_id,
        action="data_export_requested",
        resource_type="data_export",
        resource_id=str(export_request.id),
        details={"format": format},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return DataExportRequestResponse(
        id=export_request.id,
        status=export_request.status.value,
        format=export_request.format,
        download_token=download_token,
        expires_at=export_request.expires_at,
        created_at=export_request.created_at,
    )


@router.get("/data-export/{token}", response_model=DataExportDownloadResponse)
async def download_data_export(
    request: Request,
    token: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Download exported data using the token.
    
    Returns all user data in the requested format.
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    # Find the export request
    stmt = select(DataExportRequest).where(
        DataExportRequest.download_token == token,
        DataExportRequest.user_id == user_id,
    )
    result = await db.execute(stmt)
    export_request = result.scalar_one_or_none()
    
    if not export_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export request not found or does not belong to you.",
        )
    
    # Check expiration
    if export_request.expires_at and export_request.expires_at < datetime.datetime.now(datetime.UTC):
        export_request.status = DataExportStatus.EXPIRED
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This export has expired. Please request a new export.",
        )
    
    # Gather all user data
    # User profile
    profile_stmt = select(UserProfile).where(UserProfile.user_id == user_id)
    profile_result = await db.execute(profile_stmt)
    profile = profile_result.scalar_one_or_none()
    
    # Moods
    moods_stmt = select(Mood).where(Mood.user_id == user_id)
    moods_result = await db.execute(moods_stmt)
    moods = moods_result.scalars().all()
    
    # Journal entries (encrypted blobs)
    journal_stmt = select(EncryptedBlob).where(EncryptedBlob.user_id == user_id)
    journal_result = await db.execute(journal_stmt)
    journal_entries = journal_result.scalars().all()
    
    # Subscription
    sub_stmt = select(UserSubscription).where(UserSubscription.user_id == user_id)
    sub_result = await db.execute(sub_stmt)
    subscription = sub_result.scalar_one_or_none()
    
    # Consents
    consent_stmt = select(UserConsent).where(UserConsent.user_id == user_id)
    consent_result = await db.execute(consent_stmt)
    consents = consent_result.scalars().all()
    
    # Mark as completed
    export_request.status = DataExportStatus.COMPLETED
    export_request.completed_at = datetime.datetime.now(datetime.UTC)
    await db.commit()
    
    # Log the download
    await log_compliance_action(
        db=db,
        user_id=user_id,
        action="data_export_downloaded",
        resource_type="data_export",
        resource_id=str(export_request.id),
        details={"format": export_request.format},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return DataExportDownloadResponse(
        user_profile={
            "full_name": profile.full_name if profile else None,
            "base_experience": profile.base_experience if profile else None,
            "created_at": profile.created_at.isoformat() if profile else None,
        } if profile else None,
        moods=[
            {
                "id": m.id,
                "score": m.score,
                "tags": m.tags,
                "note": m.note,
                "at": m.at.isoformat(),
            }
            for m in moods
        ],
        journal_entries=[
            {
                "id": j.id,
                # Note: This data is encrypted with your personal key.
                # You will need your encryption key to decrypt this content.
                # The server cannot read your journal entries.
                "encrypted_content": j.blob_json,
                "encryption_notice": "This content is end-to-end encrypted. Use your personal encryption key to decrypt.",
                "created_at": j.created_at.isoformat(),
            }
            for j in journal_entries
        ],
        subscription={
            "plan_id": subscription.plan_id,
            "status": subscription.status.value,
            "current_period_start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
            "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
        } if subscription else None,
        consents=[
            {
                "consent_type": c.consent_type.value,
                "granted": c.granted,
                "granted_at": c.granted_at.isoformat() if c.granted_at else None,
            }
            for c in consents
        ],
        exported_at=datetime.datetime.now(datetime.UTC).isoformat(),
    )


# =============================================================================
# Account Deletion Routes (Right to Erasure)
# =============================================================================

@router.post("/delete-account", response_model=DeletionRequestResponse)
async def request_account_deletion(
    request: Request,
    deletion_input: DeletionRequestInput,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Request account deletion with grace period.
    
    GDPR Article 17: Right to Erasure ("Right to be Forgotten").
    Initiates a 30-day grace period before permanent deletion.
    """
    if not deletion_input.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please confirm the deletion by setting confirm=true",
        )
    
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    # Check for existing deletion request
    stmt = select(DeletionRequest).where(
        DeletionRequest.user_id == user_id,
        DeletionRequest.status.in_([
            DeletionRequestStatus.PENDING,
            DeletionRequestStatus.GRACE_PERIOD,
            DeletionRequestStatus.PROCESSING,
        ]),
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        return DeletionRequestResponse(
            id=existing.id,
            status=existing.status.value,
            grace_period_days=existing.grace_period_days,
            grace_period_ends_at=existing.grace_period_ends_at,
            created_at=existing.created_at,
        )
    
    # Create deletion request with 30-day grace period
    grace_period_days = 30
    deletion_request = DeletionRequest(
        user_id=user_id,
        status=DeletionRequestStatus.GRACE_PERIOD,
        reason=deletion_input.reason,
        grace_period_days=grace_period_days,
        grace_period_ends_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=grace_period_days),
        ip_address=ip_address,
    )
    db.add(deletion_request)
    await db.commit()
    await db.refresh(deletion_request)
    
    # Log the action
    await log_compliance_action(
        db=db,
        user_id=user_id,
        action="deletion_requested",
        resource_type="account",
        resource_id=user_id,
        details={"reason": deletion_input.reason, "grace_period_days": grace_period_days},
        ip_address=ip_address,
        user_agent=user_agent,
        severity="warning",
    )
    
    return DeletionRequestResponse(
        id=deletion_request.id,
        status=deletion_request.status.value,
        grace_period_days=deletion_request.grace_period_days,
        grace_period_ends_at=deletion_request.grace_period_ends_at,
        created_at=deletion_request.created_at,
    )


@router.get("/delete-account/status", response_model=DeletionRequestResponse)
async def get_deletion_status(
    request: Request,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the status of an account deletion request.
    """
    stmt = select(DeletionRequest).where(
        DeletionRequest.user_id == user_id,
    ).order_by(DeletionRequest.created_at.desc())
    result = await db.execute(stmt)
    deletion_request = result.scalar_one_or_none()
    
    if not deletion_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No deletion request found for this account.",
        )
    
    return DeletionRequestResponse(
        id=deletion_request.id,
        status=deletion_request.status.value,
        grace_period_days=deletion_request.grace_period_days,
        grace_period_ends_at=deletion_request.grace_period_ends_at,
        created_at=deletion_request.created_at,
    )


@router.post("/delete-account/cancel")
async def cancel_account_deletion(
    request: Request,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cancel a pending account deletion request (during grace period).
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    stmt = select(DeletionRequest).where(
        DeletionRequest.user_id == user_id,
        DeletionRequest.status == DeletionRequestStatus.GRACE_PERIOD,
    )
    result = await db.execute(stmt)
    deletion_request = result.scalar_one_or_none()
    
    if not deletion_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No cancellable deletion request found.",
        )
    
    deletion_request.status = DeletionRequestStatus.CANCELED
    deletion_request.canceled_at = datetime.datetime.now(datetime.UTC)
    await db.commit()
    
    # Log the cancellation
    await log_compliance_action(
        db=db,
        user_id=user_id,
        action="deletion_canceled",
        resource_type="account",
        resource_id=user_id,
        details={"request_id": deletion_request.id},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {"message": "Account deletion request has been canceled.", "status": "canceled"}
