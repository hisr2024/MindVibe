"""GDPR Privacy API — Art. 15/17/20 data subject rights.

Endpoints:
  POST /api/v1/privacy/export  — queue data export (1/24h rate limit)
  GET  /api/v1/privacy/export  — download ZIP via signed token
  POST /api/v1/privacy/delete  — initiate 30-day deletion grace period
  POST /api/v1/privacy/delete/cancel — cancel deletion during grace period
  GET  /api/v1/privacy/status  — current export/deletion status
"""

from __future__ import annotations

import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user, get_db
from backend.models import (
    DataExportRequest,
    DeletionRequest,
)
from backend.services.privacy_service import (
    cancel_deletion,
    check_export_rate_limit,
    export_user_data,
    get_export_zip_bytes,
    hash_ip,
    initiate_deletion,
    verify_signed_token,
    audit_privacy_action,
)

router = APIRouter(prefix="/api/v1/privacy", tags=["privacy"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ExportResponse(BaseModel):
    id: int
    status: str
    download_token: Optional[str] = None
    expires_at: Optional[datetime.datetime] = None
    file_size_bytes: Optional[int] = None
    created_at: datetime.datetime


class DeleteRequest(BaseModel):
    confirm: bool = Field(..., description="Must be true to confirm deletion")
    reason: Optional[str] = Field(None, max_length=500)


class DeleteResponse(BaseModel):
    id: int
    status: str
    grace_period_days: int
    grace_period_ends_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime


class StatusResponse(BaseModel):
    export: Optional[ExportResponse] = None
    deletion: Optional[DeleteResponse] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ---------------------------------------------------------------------------
# POST /api/v1/privacy/export — request data export
# ---------------------------------------------------------------------------

@router.post("/export", response_model=ExportResponse, status_code=status.HTTP_202_ACCEPTED)
async def request_export(
    request: Request,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Request a GDPR data export (Art. 15 + Art. 20). Rate limited to 1 per 24h."""
    ip = _get_client_ip(request)
    ip_h = hash_ip(ip)

    if await check_export_rate_limit(db, user_id):
        await audit_privacy_action(db, user_id, "export_rate_limited", ip_h)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You can request one data export every 24 hours. Please try again later.",
        )

    export_req = await export_user_data(db, user_id, ip_h)

    return ExportResponse(
        id=export_req.id,
        status=export_req.status.value,
        download_token=export_req.download_token,
        expires_at=export_req.expires_at,
        file_size_bytes=export_req.file_size_bytes,
        created_at=export_req.created_at,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/privacy/export?token=... — download the ZIP
# ---------------------------------------------------------------------------

@router.get("/export")
async def download_export(
    request: Request,
    token: str = Query(..., min_length=10),
    db: AsyncSession = Depends(get_db),
):
    """Download a data export ZIP using a signed token (expires 7 days)."""
    verified = verify_signed_token(token)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired download link. Please request a new export.",
        )

    zip_bytes = await get_export_zip_bytes(db, verified["export_id"])
    if not zip_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export file not found. It may have been cleaned up. Please request a new export.",
        )

    ip_h = hash_ip(_get_client_ip(request))
    await audit_privacy_action(db, verified["user_id"], "export_downloaded", ip_h, {
        "export_id": verified["export_id"],
    })

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="kiaanverse-data-export.zip"',
            "Cache-Control": "no-store",
        },
    )


# ---------------------------------------------------------------------------
# POST /api/v1/privacy/delete — initiate account deletion
# ---------------------------------------------------------------------------

@router.post("/delete", response_model=DeleteResponse)
async def request_deletion(
    request: Request,
    body: DeleteRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initiate account deletion with 30-day grace period (Art. 17)."""
    if not body.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Set confirm=true to proceed with account deletion.",
        )

    ip_h = hash_ip(_get_client_ip(request))
    req = await initiate_deletion(db, user_id, ip_h, body.reason)

    return DeleteResponse(
        id=req.id,
        status=req.status.value,
        grace_period_days=req.grace_period_days,
        grace_period_ends_at=req.grace_period_ends_at,
        created_at=req.created_at,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/privacy/delete/cancel — cancel deletion during grace period
# ---------------------------------------------------------------------------

@router.post("/delete/cancel")
async def cancel_deletion_request(
    request: Request,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel account deletion during the 30-day grace period."""
    ip_h = hash_ip(_get_client_ip(request))
    req = await cancel_deletion(db, user_id, ip_h)

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active deletion request found to cancel.",
        )

    return {"status": "canceled", "message": "Account deletion has been canceled. Your account is restored."}


# ---------------------------------------------------------------------------
# GET /api/v1/privacy/status — combined export + deletion status
# ---------------------------------------------------------------------------

@router.get("/status", response_model=StatusResponse)
async def get_privacy_status(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current status of export and deletion requests."""
    export_req = (await db.execute(
        select(DataExportRequest)
        .where(DataExportRequest.user_id == user_id)
        .order_by(DataExportRequest.created_at.desc())
        .limit(1)
    )).scalar_one_or_none()

    deletion_req = (await db.execute(
        select(DeletionRequest)
        .where(DeletionRequest.user_id == user_id)
        .order_by(DeletionRequest.created_at.desc())
        .limit(1)
    )).scalar_one_or_none()

    return StatusResponse(
        export=ExportResponse(
            id=export_req.id,
            status=export_req.status.value,
            download_token=export_req.download_token,
            expires_at=export_req.expires_at,
            file_size_bytes=export_req.file_size_bytes,
            created_at=export_req.created_at,
        ) if export_req else None,
        deletion=DeleteResponse(
            id=deletion_req.id,
            status=deletion_req.status.value,
            grace_period_days=deletion_req.grace_period_days,
            grace_period_ends_at=deletion_req.grace_period_ends_at,
            created_at=deletion_req.created_at,
        ) if deletion_req else None,
    )
