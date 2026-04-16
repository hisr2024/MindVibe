"""Privacy endpoints (v1) — GDPR rights at ``/api/v1/privacy/*``.

Endpoints
---------
- **POST /api/v1/privacy/export** — queue a data export job
  (GDPR Art. 20 — Right to Portability).
- **GET  /api/v1/privacy/export** — poll export status / fetch the
  signed download URL.
- **POST /api/v1/privacy/delete** — initiate account deletion with a
  30-day grace period (GDPR Art. 17 — Right to Erasure).
- **POST /api/v1/privacy/delete/cancel** — cancel a pending deletion
  during the grace period.

Design
------
* Requests are authenticated via :func:`get_current_user_object` so
  the full ``User`` row (email, profile) is available to handlers.
* Export is produced by a FastAPI background task — handlers return
  immediately with ``status="pending"``.
* Exports are rate-limited to **1 per 24 hours per user** via
  :class:`RateLimiter`; failures fail **open** so GDPR rights are
  never blocked by operational issues.
* IP addresses are SHA-256 hashed before they reach the audit trail.

KIAAN Impact: ✅ NEUTRAL — compliance surface, no KIAAN coupling.
"""

from __future__ import annotations

import hashlib
import logging
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_object, get_db
from backend.models import PrivacyRequest, User
from backend.services.privacy_service import PrivacyService
from backend.services.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/privacy", tags=["privacy"])

EXPORT_RATE_LIMIT = 1
EXPORT_WINDOW_SECONDS = 24 * 60 * 60


def _ip_hash(request: Request) -> str:
    """Return a short, non-reversible hash of the caller's IP.

    Prefers ``X-Forwarded-For`` when behind a proxy.  Truncated to 16
    hex chars — plenty to correlate requests in an audit log without
    preserving the raw address.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    elif request.client and request.client.host:
        ip = request.client.host
    else:
        ip = "unknown"
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()[:16]


def _display_name(user: User) -> str:
    """Pick a user-facing name for email copy, never blank."""
    full_name = getattr(user, "full_name", None)
    if full_name:
        return full_name
    if user.email and "@" in user.email:
        local = user.email.split("@", 1)[0]
        return local.replace(".", " ").title() or "Seeker"
    return "Seeker"


def _iso(dt) -> str | None:
    return dt.isoformat() if dt else None


# ─────────────────────────────────────────────
# POST /api/v1/privacy/export
# ─────────────────────────────────────────────
@router.post("/export")
async def request_export(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_object),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Queue a data export job.  Rate-limited to 1 per user per 24 h."""
    service = PrivacyService(db)
    ip_hash = _ip_hash(request)

    # Collapse duplicate in-flight requests.
    existing = await service.get_active_export_request(current_user.id)
    if existing:
        return {
            "status": existing.status,
            "message": "An export is already in progress.",
            "request_id": str(existing.id),
            "created_at": _iso(existing.created_at),
        }

    limiter = RateLimiter()
    allowed = await limiter.check(
        f"privacy:export:{current_user.id}",
        limit=EXPORT_RATE_LIMIT,
        window_seconds=EXPORT_WINDOW_SECONDS,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "You can request one data export per 24 hours. "
                "Please try again later."
            ),
        )

    privacy_request = await service.create_privacy_request(
        user_id=current_user.id,
        request_type="export",
        ip_hash=ip_hash,
    )

    background_tasks.add_task(
        PrivacyService(db).export_user_data,
        user_id=current_user.id,
        request_id=str(privacy_request.id),
        user_email=current_user.email,
    )

    return {
        "status": "pending",
        "message": (
            "Your data export has been queued. You will receive an email "
            "when it is ready (usually within 10 minutes)."
        ),
        "request_id": str(privacy_request.id),
        "created_at": _iso(privacy_request.created_at),
    }


# ─────────────────────────────────────────────
# GET /api/v1/privacy/export
# ─────────────────────────────────────────────
@router.get("/export")
async def get_export_status(
    current_user: User = Depends(get_current_user_object),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Poll the latest export request and return its status."""
    service = PrivacyService(db)
    latest: PrivacyRequest | None = await service.get_latest_export_request(
        current_user.id
    )
    if latest is None:
        return {"status": "none", "message": "No export requests found."}

    response: dict[str, Any] = {
        "status": latest.status,
        "request_id": str(latest.id),
        "created_at": _iso(latest.created_at),
    }

    if latest.status == "ready" and latest.download_url:
        response["download_url"] = latest.download_url
        response["expires_at"] = _iso(latest.url_expires_at)
        response["message"] = (
            "Your export is ready. The download link expires in 7 days."
        )
    elif latest.status == "processing":
        response["message"] = (
            "Your export is being prepared. This usually takes a few minutes."
        )
    elif latest.status == "pending":
        response["message"] = (
            "Your export is queued and will begin shortly."
        )
    elif latest.status == "failed":
        response["message"] = (
            "Your export failed. Please contact privacy@kiaanverse.com."
        )

    return response


# ─────────────────────────────────────────────
# POST /api/v1/privacy/delete
# ─────────────────────────────────────────────
@router.post("/delete")
async def request_deletion(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_object),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Initiate account deletion with a 30-day grace period."""
    service = PrivacyService(db)
    ip_hash = _ip_hash(request)

    existing = await service.get_active_deletion_request(current_user.id)
    if existing:
        return {
            "status": existing.status,
            "message": "A deletion request is already pending.",
            "scheduled_deletion_at": _iso(existing.scheduled_deletion_at),
            "request_id": str(existing.id),
        }

    privacy_request = await service.create_privacy_request(
        user_id=current_user.id,
        request_type="delete",
        ip_hash=ip_hash,
    )

    scheduled_at = await service.initiate_soft_delete(
        user_id=current_user.id,
        request_id=str(privacy_request.id),
    )

    background_tasks.add_task(
        service.send_deletion_initiated_email,
        user_email=current_user.email,
        user_name=_display_name(current_user),
        scheduled_deletion_at=scheduled_at,
    )

    return {
        "status": "pending_deletion",
        "message": (
            "Your account has been scheduled for deletion in 30 days. "
            "You can cancel this at any time before then."
        ),
        "scheduled_deletion_at": scheduled_at.isoformat(),
        "request_id": str(privacy_request.id),
        "cancel_url": "/settings/privacy?cancel_deletion=true",
    }


# ─────────────────────────────────────────────
# POST /api/v1/privacy/delete/cancel
# ─────────────────────────────────────────────
@router.post("/delete/cancel")
async def cancel_deletion(
    current_user: User = Depends(get_current_user_object),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Cancel an in-progress deletion during the grace period."""
    service = PrivacyService(db)
    cancelled = await service.cancel_soft_delete(current_user.id)

    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending deletion request found for your account.",
        )

    return {
        "status": "active",
        "message": (
            "Your deletion request has been cancelled. "
            "Your account is fully restored."
        ),
    }
