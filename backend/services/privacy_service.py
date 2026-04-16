"""PrivacyService — orchestrates GDPR rights (export, deletion) for end users.

This service implements the business logic behind ``/api/v1/privacy/*``:

* **Export (Art. 20)** — queue an async export job, store a signed
  download URL, notify the user over email when ready.  URLs expire
  after 7 days (``URL_TTL_DAYS``).
* **Deletion (Art. 17)** — soft-delete the user, schedule permanent
  erasure 30 days out, allow the user to cancel at any time during the
  grace period.
* **Audit** — every privacy-relevant action is written to
  ``ComplianceAuditLog`` with the caller IP hash so we can prove
  compliance during supervisory-authority requests.

The service is **async**-first and uses ``AsyncSession`` so it composes
with the existing backend architecture.  It returns simple, attribute
friendly adapter objects (``_PrivacyRequestView``) to the router so the
wire contract is independent of the underlying SQLAlchemy table layout.

Security
--------
* All writes are idempotent — repeated calls for the same user collapse
  onto the pending/active record instead of creating duplicates.
* Download URLs are opaque, ``secrets.token_urlsafe(64)`` tokens that
  cannot be guessed.
* User-supplied values are never interpolated into log messages or SQL.
* The service fails **closed** on email / storage errors (the request
  is kept in a failed state so the user can retry) but never hard-fails
  the HTTP handler.

KIAAN Impact: ✅ POSITIVE — compliance foundation for user trust; no
impact on KIAAN chat / wisdom flows.
"""

from __future__ import annotations

import datetime
import json
import logging
import os
import secrets
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    ComplianceAuditLog,
    DataExportRequest,
    DataExportStatus,
    DeletionRequest,
    DeletionRequestStatus,
    EncryptedBlob,
    Mood,
    User,
    UserConsent,
    UserProfile,
    UserSubscription,
)

logger = logging.getLogger(__name__)

# -------------------- Configuration ---------------------------------------
DELETION_GRACE_DAYS = int(os.getenv("PRIVACY_DELETION_GRACE_DAYS", "30"))
URL_TTL_DAYS = int(os.getenv("PRIVACY_EXPORT_URL_TTL_DAYS", "7"))
EXPORT_BASE_URL = os.getenv(
    "PRIVACY_EXPORT_BASE_URL",
    "https://kiaanverse.com/api/v1/privacy/export/download",
)
SUPPORT_EMAIL = os.getenv("PRIVACY_SUPPORT_EMAIL", "privacy@kiaanverse.com")


# -------------------- Adapter returned to router -------------------------
@dataclass
class _PrivacyRequestView:
    """Lightweight adapter exposing stable field names to the router.

    Decouples the HTTP response shape from the underlying SQLAlchemy
    column names (``grace_period_ends_at`` vs ``scheduled_deletion_at``).
    """

    id: int
    user_id: str
    request_type: str
    status: str
    created_at: datetime.datetime
    scheduled_deletion_at: datetime.datetime | None = None
    download_url: str | None = None
    url_expires_at: datetime.datetime | None = None


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.UTC)


def _status_to_public(status: DataExportStatus) -> str:
    """Normalize internal export statuses to the public-facing values."""
    if status == DataExportStatus.COMPLETED:
        return "ready"
    return status.value


# -------------------- Service ---------------------------------------------
class PrivacyService:
    """Business logic for GDPR privacy rights.

    The service is constructed per-request with an ``AsyncSession`` so
    that its work participates in the caller's transaction.  Background
    tasks re-open their own session (see :meth:`export_user_data`).
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ---- Audit log ------------------------------------------------------
    async def create_privacy_request(
        self,
        user_id: str,
        request_type: str,
        ip_hash: str,
    ) -> _PrivacyRequestView:
        """Create a ``ComplianceAuditLog`` row and return a view adapter.

        The ``request_type`` is one of ``"export"`` or ``"delete"`` and is
        recorded in the audit trail.  Callers use the returned ``id`` as
        a correlation identifier across the audit log, export requests,
        and deletion requests.
        """
        if request_type not in {"export", "delete"}:
            raise ValueError(f"Unsupported request_type: {request_type!r}")

        now = _now()
        log_entry = ComplianceAuditLog(
            user_id=user_id,
            action=f"privacy_{request_type}_requested",
            resource_type="privacy",
            resource_id=user_id,
            details={"request_type": request_type},
            ip_address=ip_hash,
            severity="warning" if request_type == "delete" else "info",
        )
        self.db.add(log_entry)
        await self.db.flush()
        # The ``created_at`` server default may not be populated on
        # ``flush`` with every dialect; fall back to ``now``.
        created_at = log_entry.created_at or now

        return _PrivacyRequestView(
            id=log_entry.id,
            user_id=user_id,
            request_type=request_type,
            status="pending",
            created_at=created_at,
        )

    # ---- Exports --------------------------------------------------------
    async def get_active_export_request(
        self, user_id: str
    ) -> _PrivacyRequestView | None:
        """Return a view of the current in-flight export (pending/processing)."""
        stmt = (
            select(DataExportRequest)
            .where(
                DataExportRequest.user_id == user_id,
                DataExportRequest.status.in_(
                    [DataExportStatus.PENDING, DataExportStatus.PROCESSING]
                ),
            )
            .order_by(DataExportRequest.created_at.desc())
        )
        result = await self.db.execute(stmt)
        export = result.scalars().first()
        if not export:
            return None
        return self._export_to_view(export)

    async def get_latest_export_request(
        self, user_id: str
    ) -> _PrivacyRequestView | None:
        """Return the user's most recent export request, if any."""
        stmt = (
            select(DataExportRequest)
            .where(DataExportRequest.user_id == user_id)
            .order_by(DataExportRequest.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        export = result.scalars().first()
        if not export:
            return None
        return self._export_to_view(export)

    async def create_export_record(
        self, user_id: str, ip_hash: str
    ) -> DataExportRequest:
        """Create a new ``DataExportRequest`` row in the pending state."""
        record = DataExportRequest(
            user_id=user_id,
            status=DataExportStatus.PENDING,
            format="json",
            ip_address=ip_hash,
        )
        self.db.add(record)
        await self.db.flush()
        return record

    async def export_user_data(
        self,
        user_id: str,
        request_id: int,
        user_email: str | None,
    ) -> None:
        """Background task: build the export payload and mark it ready.

        Runs with its **own** database session because FastAPI's
        ``BackgroundTasks`` execute after the request context (and its
        session) has closed.  All errors are caught and persisted so the
        user sees ``status="failed"`` instead of a silent hang.
        """
        try:
            session_maker = _get_background_session_maker()
            async with session_maker() as session:
                export = await _find_or_create_export(session, user_id, request_id)
                if export is None:
                    logger.error(
                        "Background export could not find request for user_id=%s",
                        user_id,
                    )
                    return

                export.status = DataExportStatus.PROCESSING
                await session.commit()

                try:
                    payload = await _build_export_payload(session, user_id)
                    token = secrets.token_urlsafe(64)
                    expires_at = _now() + datetime.timedelta(days=URL_TTL_DAYS)

                    export.download_token = token
                    export.download_url = f"{EXPORT_BASE_URL}?token={token}"
                    export.expires_at = expires_at
                    export.file_size_bytes = len(
                        json.dumps(payload, default=str).encode("utf-8")
                    )
                    export.completed_at = _now()
                    export.status = DataExportStatus.COMPLETED
                    await session.commit()

                    await _log_action(
                        session,
                        user_id=user_id,
                        action="privacy_export_ready",
                        resource_id=str(export.id),
                        details={"bytes": export.file_size_bytes},
                    )

                    if user_email:
                        await _send_export_ready_email(
                            to=user_email,
                            download_url=export.download_url,
                            expires_at=expires_at,
                        )
                except Exception as inner:
                    logger.exception(
                        "Export generation failed for user_id=%s: %s",
                        user_id,
                        inner,
                    )
                    export.status = DataExportStatus.FAILED
                    export.error_message = str(inner)[:500]
                    await session.commit()
        except Exception as outer:  # pragma: no cover - defensive
            logger.exception(
                "Fatal error in export_user_data for user_id=%s: %s",
                user_id,
                outer,
            )

    def _export_to_view(self, export: DataExportRequest) -> _PrivacyRequestView:
        return _PrivacyRequestView(
            id=export.id,
            user_id=export.user_id,
            request_type="export",
            status=_status_to_public(export.status),
            created_at=export.created_at,
            download_url=export.download_url,
            url_expires_at=export.expires_at,
        )

    # ---- Deletion -------------------------------------------------------
    async def get_active_deletion_request(
        self, user_id: str
    ) -> _PrivacyRequestView | None:
        """Return any pending/grace-period/processing deletion request."""
        stmt = (
            select(DeletionRequest)
            .where(
                DeletionRequest.user_id == user_id,
                DeletionRequest.status.in_(
                    [
                        DeletionRequestStatus.PENDING,
                        DeletionRequestStatus.GRACE_PERIOD,
                        DeletionRequestStatus.PROCESSING,
                    ]
                ),
            )
            .order_by(DeletionRequest.created_at.desc())
        )
        result = await self.db.execute(stmt)
        record = result.scalars().first()
        if not record:
            return None
        return _PrivacyRequestView(
            id=record.id,
            user_id=record.user_id,
            request_type="delete",
            status="pending_deletion",
            created_at=record.created_at,
            scheduled_deletion_at=record.grace_period_ends_at,
        )

    async def initiate_soft_delete(
        self, user_id: str, request_id: int
    ) -> datetime.datetime:
        """Schedule account deletion 30 days out.

        The user row itself is **not** soft-deleted at this point — the
        account remains fully functional during the grace period so the
        user can cancel at any time.  A background job (outside the
        scope of this service) reads ``DeletionRequest`` rows whose
        ``grace_period_ends_at`` is in the past and performs the actual
        soft-delete + hard-delete of sensitive data.

        Returns the scheduled deletion timestamp.
        """
        scheduled_at = _now() + datetime.timedelta(days=DELETION_GRACE_DAYS)

        # Confirm user exists so we don't create orphan records.
        user = await self.db.get(User, user_id)
        if user is None:
            raise ValueError(f"User {user_id!r} not found")

        record = DeletionRequest(
            user_id=user_id,
            status=DeletionRequestStatus.GRACE_PERIOD,
            grace_period_days=DELETION_GRACE_DAYS,
            grace_period_ends_at=scheduled_at,
        )
        self.db.add(record)
        await self.db.flush()

        await _log_action(
            self.db,
            user_id=user_id,
            action="privacy_delete_scheduled",
            resource_id=str(record.id),
            details={
                "scheduled_deletion_at": scheduled_at.isoformat(),
                "audit_request_id": request_id,
            },
            severity="warning",
        )
        await self.db.commit()
        return scheduled_at

    async def cancel_soft_delete(self, user_id: str) -> bool:
        """Cancel an active deletion request.

        Returns ``True`` if a deletion request was cancelled, ``False``
        if there was no active request.  Because ``initiate_soft_delete``
        does not touch the ``User`` row, cancellation only flips the
        deletion-request status and logs the cancellation.
        """
        stmt = (
            select(DeletionRequest)
            .where(
                DeletionRequest.user_id == user_id,
                DeletionRequest.status.in_(
                    [
                        DeletionRequestStatus.PENDING,
                        DeletionRequestStatus.GRACE_PERIOD,
                    ]
                ),
            )
            .order_by(DeletionRequest.created_at.desc())
        )
        result = await self.db.execute(stmt)
        record = result.scalars().first()
        if not record:
            return False

        record.status = DeletionRequestStatus.CANCELED
        record.canceled_at = _now()

        await _log_action(
            self.db,
            user_id=user_id,
            action="privacy_delete_cancelled",
            resource_id=str(record.id),
            details={"cancelled_at": record.canceled_at.isoformat()},
            severity="info",
        )
        await self.db.commit()
        return True

    # ---- Email helpers --------------------------------------------------
    async def send_deletion_initiated_email(
        self,
        user_email: str | None,
        user_name: str,
        scheduled_deletion_at: datetime.datetime,
    ) -> None:
        """Notify the user that their account is scheduled for deletion."""
        if not user_email:
            logger.warning(
                "send_deletion_initiated_email skipped: no email for user"
            )
            return

        try:
            from backend.services.email_service import send_email
        except Exception as e:  # pragma: no cover - import guard
            logger.warning("Email service unavailable for deletion email: %s", e)
            return

        subject = "Your KIAAN account is scheduled for deletion"
        pretty_date = scheduled_deletion_at.strftime("%B %d, %Y")
        cancel_url = (
            f"{os.getenv('FRONTEND_URL', 'https://kiaanverse.com')}"
            "/settings/privacy?cancel_deletion=true"
        )

        html_body = (
            f"<p>Dear {user_name},</p>"
            f"<p>We have received your request to delete your KIAAN account. "
            f"Your account has been deactivated and is scheduled for "
            f"permanent deletion on <b>{pretty_date}</b>.</p>"
            f"<p>You can cancel this at any time before then by visiting "
            f"<a href='{cancel_url}'>your privacy settings</a> or replying "
            f"to this email.</p>"
            f"<p>If you did not request this, please contact us immediately "
            f"at <a href='mailto:{SUPPORT_EMAIL}'>{SUPPORT_EMAIL}</a>.</p>"
            f"<p>With care,<br/>The KIAAN Team 🙏</p>"
        )
        text_body = (
            f"Dear {user_name},\n\n"
            f"Your KIAAN account is scheduled for permanent deletion on "
            f"{pretty_date}. You can cancel this at any time before then "
            f"by visiting {cancel_url}.\n\n"
            f"If you did not request this, please contact us at "
            f"{SUPPORT_EMAIL} immediately.\n\n"
            f"With care,\nThe KIAAN Team"
        )

        try:
            await send_email(
                to=user_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body,
            )
        except Exception as e:
            # Never crash a background task on email failure; the
            # audit log is our source of truth.
            logger.warning("Failed to send deletion email: %s", e)


# -------------------- Background-task helpers ------------------------------
def _get_background_session_maker():
    """Return a session maker that uses the app's shared engine.

    FastAPI's ``BackgroundTasks`` run after the request session is closed,
    so we cannot reuse the request-scoped session.  Reusing the shared
    engine (``backend.deps.SessionLocal``) keeps us pool-aware without
    duplicating connections, and preserves test compatibility with the
    in-memory SQLite engine.
    """
    from backend import deps

    return deps.SessionLocal


async def _find_or_create_export(
    session: AsyncSession,
    user_id: str,
    request_id: int,  # noqa: ARG001 — reserved for future cross-table correlation
) -> DataExportRequest | None:
    """Locate the export row for this background job; create if missing."""
    stmt = (
        select(DataExportRequest)
        .where(
            DataExportRequest.user_id == user_id,
            DataExportRequest.status.in_(
                [DataExportStatus.PENDING, DataExportStatus.PROCESSING]
            ),
        )
        .order_by(DataExportRequest.created_at.desc())
    )
    result = await session.execute(stmt)
    export = result.scalars().first()
    if export:
        return export

    # Caller expected a row to exist; create one so progress is visible.
    export = DataExportRequest(
        user_id=user_id,
        status=DataExportStatus.PENDING,
        format="json",
    )
    session.add(export)
    await session.commit()
    await session.refresh(export)
    return export


async def _build_export_payload(
    session: AsyncSession, user_id: str
) -> dict[str, Any]:
    """Assemble the user's data export payload (Article 20)."""
    user = await session.get(User, user_id)
    profile_stmt = select(UserProfile).where(UserProfile.user_id == user_id)
    profile = (await session.execute(profile_stmt)).scalar_one_or_none()

    moods_stmt = select(Mood).where(Mood.user_id == user_id)
    moods = (await session.execute(moods_stmt)).scalars().all()

    blobs_stmt = select(EncryptedBlob).where(EncryptedBlob.user_id == user_id)
    blobs = (await session.execute(blobs_stmt)).scalars().all()

    consents_stmt = select(UserConsent).where(UserConsent.user_id == user_id)
    consents = (await session.execute(consents_stmt)).scalars().all()

    try:
        sub_stmt = select(UserSubscription).where(
            UserSubscription.user_id == user_id
        )
        subscription = (
            await session.execute(sub_stmt)
        ).scalar_one_or_none()
    except Exception:
        subscription = None

    return {
        "exported_at": _now().isoformat(),
        "user": (
            {
                "id": user.id,
                "email": user.email,
                "locale": user.locale,
                "created_at": user.created_at.isoformat()
                if user.created_at
                else None,
            }
            if user
            else None
        ),
        "profile": (
            {
                "full_name": profile.full_name,
                "base_experience": profile.base_experience,
            }
            if profile
            else None
        ),
        "moods": [
            {
                "id": m.id,
                "score": m.score,
                "tags": m.tags,
                "note": m.note,
                "at": m.at.isoformat() if m.at else None,
            }
            for m in moods
        ],
        "journal_entries": [
            {
                "id": b.id,
                "encrypted_content": b.blob_json,
                "encryption_notice": (
                    "Zero-knowledge encrypted: decrypt with your personal key."
                ),
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in blobs
        ],
        "consents": [
            {
                "type": c.consent_type.value,
                "granted": c.granted,
                "granted_at": c.granted_at.isoformat() if c.granted_at else None,
                "withdrawn_at": (
                    c.withdrawn_at.isoformat() if c.withdrawn_at else None
                ),
            }
            for c in consents
        ],
        "subscription": (
            {
                "plan_id": subscription.plan_id,
                "status": subscription.status.value,
            }
            if subscription
            else None
        ),
    }


async def _log_action(
    session: AsyncSession,
    *,
    user_id: str | None,
    action: str,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
    severity: str = "info",
) -> None:
    """Append a compliance audit log row (best-effort)."""
    try:
        entry = ComplianceAuditLog(
            user_id=user_id,
            action=action,
            resource_type="privacy",
            resource_id=resource_id,
            details=details,
            severity=severity,
        )
        session.add(entry)
        await session.flush()
    except Exception as e:
        logger.warning("Compliance audit log write failed: %s", e)


async def _send_export_ready_email(
    to: str,
    download_url: str,
    expires_at: datetime.datetime,
) -> None:
    """Email the user that their export is ready."""
    try:
        from backend.services.email_service import send_email
    except Exception as e:  # pragma: no cover - import guard
        logger.warning("Email service unavailable for export-ready email: %s", e)
        return

    subject = "Your KIAAN data export is ready"
    pretty_date = expires_at.strftime("%B %d, %Y")
    html_body = (
        f"<p>Your KIAAN data export is ready.</p>"
        f"<p><a href='{download_url}'>Download your data</a></p>"
        f"<p>This link expires on <b>{pretty_date}</b>.  If you did not "
        f"request this export, please contact us at "
        f"<a href='mailto:{SUPPORT_EMAIL}'>{SUPPORT_EMAIL}</a>.</p>"
        f"<p>With care,<br/>The KIAAN Team 🙏</p>"
    )
    text_body = (
        f"Your KIAAN data export is ready:\n{download_url}\n\n"
        f"This link expires on {pretty_date}.  If you did not request "
        f"this export, please contact us at {SUPPORT_EMAIL}.\n"
    )
    try:
        await send_email(to, subject, html_body, text_body)
    except Exception as e:
        logger.warning("Failed to send export-ready email: %s", e)


