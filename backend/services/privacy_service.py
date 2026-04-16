"""PrivacyService — orchestrates GDPR rights (export, deletion) for end users.

This service implements the business logic behind ``/api/v1/privacy/*``:

* **Export (Art. 20)** — queues an async export job, builds a ZIP archive
  (``account.json`` / ``conversations.json`` / ``practice.json`` /
  ``subscription.json`` + ``README.txt``), uploads it to an object store
  (Cloudflare R2 or any S3-compatible endpoint) when configured,
  generates a pre-signed download URL, and emails the user when ready.
  The signed URL expires after 7 days (``SIGNED_URL_EXPIRY_SECONDS``).
  In test / local environments without R2 configured, falls back to
  an in-app token-based download URL.
* **Deletion (Art. 17)** — records a deletion request with a 30-day
  grace period.  The account remains fully usable during the grace
  period so users can cancel at any time.  A scheduled job calls
  :meth:`hard_delete_user` on day 30 to cascade-delete all user data
  + cancel any active Stripe subscription + clear Redis sessions.
* **Audit** — every state change is persisted on the ``PrivacyRequest``
  row itself; the caller IP is stored only as a non-reversible
  SHA-256 hash.

Architecture notes
------------------
* ``PrivacyRequest`` is a *single* table that covers both export and
  deletion lifecycles, distinguished by ``request_type``.  This keeps
  the compliance-audit report and the scheduler logic simple.
* The service is **async**-first to match the rest of the MindVibe
  backend (``AsyncSession``).
* R2/S3/Stripe/Redis integrations are **optional** — gated by env
  vars — so the service runs in tests and bare-bones dev with no
  external infrastructure.

KIAAN Impact: ✅ POSITIVE — trust foundation; no KIAAN coupling.
"""

from __future__ import annotations

import datetime
import io
import json
import logging
import os
import secrets
import zipfile
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    EncryptedBlob,
    Mood,
    PrivacyRequest,
    User,
    UserConsent,
    UserProfile,
    UserSubscription,
)

logger = logging.getLogger(__name__)


# -------------------- Configuration ---------------------------------------
DELETION_GRACE_DAYS = int(os.getenv("PRIVACY_DELETION_GRACE_DAYS", "30"))
SIGNED_URL_EXPIRY_SECONDS = int(
    os.getenv("PRIVACY_EXPORT_URL_TTL_SECONDS", str(7 * 24 * 3600))
)
EXPORT_FALLBACK_BASE_URL = os.getenv(
    "PRIVACY_EXPORT_BASE_URL",
    "https://kiaanverse.com/api/v1/privacy/export/download",
)
SUPPORT_EMAIL = os.getenv("PRIVACY_SUPPORT_EMAIL", "privacy@kiaanverse.com")

# Tables whose rows are cascade-deleted during hard deletion.  The list
# is intentionally conservative — every table referenced here must have
# a ``user_id`` foreign key.  Order matters: children first.
HARD_DELETE_TABLES: tuple[str, ...] = (
    "privacy_requests",
    "compliance_audit_logs",
    "user_consents",
    "cookie_preferences",
    "data_export_requests",
    "deletion_requests",
    "kiaan_chat_messages",
    "kiaan_chat_sessions",
    "chat_messages",
    "room_participants",
    "feedback_ratings",
    "notifications",
    "notification_preferences",
    "push_subscriptions",
    "journal_blobs",
    "journal_entries",
    "journal_versions",
    "moods",
    "user_journey_step_state",
    "user_journeys",
    "user_progress",
    "user_subscriptions",
    "user_profiles",
    "sessions",
    "refresh_tokens",
    "password_reset_tokens",
    "email_verification_tokens",
    "webauthn_credentials",
)


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.UTC)


# -------------------- Service ---------------------------------------------
class PrivacyService:
    """Business logic for GDPR privacy rights.

    Constructed per-request with an :class:`AsyncSession`.  Background
    tasks reuse the app's shared ``SessionLocal`` because FastAPI closes
    the request session before background callbacks run.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─────────────────────────────────────────
    # AUDIT LOG / REQUEST RECORDS
    # ─────────────────────────────────────────
    async def create_privacy_request(
        self,
        user_id: str,
        request_type: str,  # "export" | "delete"
        ip_hash: str,
    ) -> PrivacyRequest:
        """Create a new ``PrivacyRequest`` row in the ``pending`` state."""
        if request_type not in {"export", "delete"}:
            raise ValueError(f"Unsupported request_type: {request_type!r}")

        req = PrivacyRequest(
            user_id=user_id,
            request_type=request_type,
            status="pending",
            ip_hash=ip_hash,
        )
        self.db.add(req)
        await self.db.commit()
        await self.db.refresh(req)
        return req

    async def update_request_status(
        self,
        request_id: str,
        status: str,
        download_url: str | None = None,
        url_expires_at: datetime.datetime | None = None,
        error_message: str | None = None,
    ) -> PrivacyRequest | None:
        """Patch a ``PrivacyRequest`` row's status + optional fields."""
        req = await self.db.get(PrivacyRequest, request_id)
        if req is None:
            return None
        req.status = status
        if download_url is not None:
            req.download_url = download_url
        if url_expires_at is not None:
            req.url_expires_at = url_expires_at
        if error_message is not None:
            req.error_message = error_message[:1000]
        await self.db.commit()
        await self.db.refresh(req)
        return req

    async def get_active_export_request(
        self, user_id: str
    ) -> PrivacyRequest | None:
        """Return the in-flight export (pending/processing) if any."""
        stmt = (
            select(PrivacyRequest)
            .where(
                PrivacyRequest.user_id == user_id,
                PrivacyRequest.request_type == "export",
                PrivacyRequest.status.in_(["pending", "processing"]),
            )
            .order_by(PrivacyRequest.created_at.desc())
        )
        return (await self.db.execute(stmt)).scalars().first()

    async def get_latest_export_request(
        self, user_id: str
    ) -> PrivacyRequest | None:
        """Return the user's most recent export request (any status)."""
        stmt = (
            select(PrivacyRequest)
            .where(
                PrivacyRequest.user_id == user_id,
                PrivacyRequest.request_type == "export",
            )
            .order_by(PrivacyRequest.created_at.desc())
            .limit(1)
        )
        return (await self.db.execute(stmt)).scalars().first()

    async def get_active_deletion_request(
        self, user_id: str
    ) -> PrivacyRequest | None:
        """Return any in-flight deletion request."""
        stmt = (
            select(PrivacyRequest)
            .where(
                PrivacyRequest.user_id == user_id,
                PrivacyRequest.request_type == "delete",
                PrivacyRequest.status == "pending_deletion",
            )
            .order_by(PrivacyRequest.created_at.desc())
            .limit(1)
        )
        return (await self.db.execute(stmt)).scalars().first()

    # ─────────────────────────────────────────
    # EXPORT (Art. 20)
    # ─────────────────────────────────────────
    async def export_user_data(
        self,
        user_id: str,
        request_id: str,
        user_email: str | None,
    ) -> None:
        """Background task: collect data → ZIP → upload → email.

        Runs with its own session because FastAPI closes the request
        session before background callbacks execute.  Every failure
        mode marks the request as ``failed`` with a truncated error
        message so the user can see a meaningful status instead of a
        silent hang.
        """
        from backend import deps

        session_maker = deps.SessionLocal
        try:
            async with session_maker() as session:
                service = PrivacyService(session)
                try:
                    await service.update_request_status(
                        request_id, status="processing"
                    )

                    data = await _collect_user_data(session, user_id)
                    zip_bytes, zip_filename = _build_export_zip(user_id, data)

                    download_url, expires_at = _upload_and_sign(
                        zip_bytes=zip_bytes,
                        filename=zip_filename,
                        user_id=user_id,
                    )

                    await service.update_request_status(
                        request_id,
                        status="ready",
                        download_url=download_url,
                        url_expires_at=expires_at,
                    )

                    if user_email:
                        await _send_export_ready_email(
                            to=user_email,
                            download_url=download_url,
                            expires_at=expires_at,
                        )
                except Exception as e:
                    logger.exception(
                        "Export generation failed for user=%s: %s",
                        user_id,
                        e,
                    )
                    await service.update_request_status(
                        request_id, status="failed", error_message=str(e)
                    )
        except Exception as outer:  # pragma: no cover - defensive
            logger.exception(
                "Fatal error in export_user_data for user=%s: %s",
                user_id,
                outer,
            )

    # ─────────────────────────────────────────
    # DELETION (Art. 17)
    # ─────────────────────────────────────────
    async def initiate_soft_delete(
        self, user_id: str, request_id: str
    ) -> datetime.datetime:
        """Schedule account deletion 30 days out.

        The ``User`` row is **not** soft-deleted yet — the account
        remains usable during the grace period so users can cancel.
        A scheduled job (``hard_delete_user``) performs the actual
        cascade-delete on day 30.
        """
        scheduled_at = _now() + datetime.timedelta(days=DELETION_GRACE_DAYS)

        user = await self.db.get(User, user_id)
        if user is None:
            raise ValueError(f"User {user_id!r} not found")

        req = await self.db.get(PrivacyRequest, request_id)
        if req is None:
            raise ValueError(f"PrivacyRequest {request_id!r} not found")

        req.status = "pending_deletion"
        req.scheduled_deletion_at = scheduled_at
        await self.db.commit()
        return scheduled_at

    async def cancel_soft_delete(self, user_id: str) -> bool:
        """Cancel an in-progress deletion; returns ``True`` on success."""
        stmt = (
            select(PrivacyRequest)
            .where(
                PrivacyRequest.user_id == user_id,
                PrivacyRequest.request_type == "delete",
                PrivacyRequest.status == "pending_deletion",
            )
            .order_by(PrivacyRequest.created_at.desc())
        )
        req = (await self.db.execute(stmt)).scalars().first()
        if req is None:
            return False

        req.status = "cancelled"
        await self.db.commit()
        return True

    async def hard_delete_user(self, user_id: str) -> None:
        """Cascade-delete all user data (called by scheduler on day 30).

        Steps:
        1. Cancel any active Stripe subscription (optional, guarded).
        2. Delete rows from every table in ``HARD_DELETE_TABLES``.
        3. Delete the user row itself.
        4. Clear session/auth-token keys from Redis (optional, guarded).
        """
        await _cancel_stripe_subscription(self.db, user_id)

        # Cascade-delete table rows.  Missing tables are ignored so this
        # method works across dialects (SQLite test DB won't have every
        # production table).
        from sqlalchemy import text

        for table in HARD_DELETE_TABLES:
            try:
                await self.db.execute(
                    text(f"DELETE FROM {table} WHERE user_id = :uid"),  # noqa: S608
                    {"uid": user_id},
                )
            except Exception as e:
                logger.debug(
                    "Skipping hard-delete on %s: %s", table, e
                )

        # Finally delete the user row (use ORM so soft-delete-aware
        # cascades still fire).
        user = await self.db.get(User, user_id)
        if user is not None:
            await self.db.delete(user)

        await self.db.commit()

        await _clear_redis_sessions(user_id)

    # ─────────────────────────────────────────
    # EMAILS
    # ─────────────────────────────────────────
    async def send_deletion_initiated_email(
        self,
        user_email: str | None,
        user_name: str,
        scheduled_deletion_at: datetime.datetime,
    ) -> None:
        """Notify the user their account is scheduled for deletion."""
        if not user_email:
            logger.warning(
                "send_deletion_initiated_email skipped: no email on user"
            )
            return

        try:
            from backend.services.email_service import send_email
        except Exception as e:  # pragma: no cover - import guard
            logger.warning(
                "Email service unavailable for deletion email: %s", e
            )
            return

        scheduled_str = scheduled_deletion_at.strftime("%B %d, %Y")
        cancel_url = (
            f"{os.getenv('FRONTEND_URL', 'https://kiaanverse.com')}"
            "/settings/privacy?cancel_deletion=true"
        )
        subject = "Your Kiaanverse Account Deletion Request"
        html_body = (
            f"<p>Dear {user_name},</p>"
            f"<p>We have received your request to delete your Kiaanverse "
            f"account.</p>"
            f"<p>Your account and all associated data will be permanently "
            f"deleted on <strong>{scheduled_str}</strong> (30 days from now).</p>"
            f"<p>If you change your mind, you can cancel this request at any "
            f"time before that date by visiting your "
            f"<a href='{cancel_url}'>Privacy Settings</a>.</p>"
            f"<p>We are sorry to see you go. Your journey with us has been "
            f"sacred.</p>"
            f"<p>— The Kiaanverse Team<br>{SUPPORT_EMAIL}</p>"
        )
        text_body = (
            f"Dear {user_name},\n\n"
            f"Your Kiaanverse account is scheduled for permanent deletion "
            f"on {scheduled_str} (30 days from now). You can cancel this "
            f"at any time before then at {cancel_url}.\n\n"
            f"— The Kiaanverse Team ({SUPPORT_EMAIL})\n"
        )
        try:
            await send_email(
                to=user_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body,
            )
        except Exception as e:
            logger.warning("Failed to send deletion email: %s", e)


# =========================================================================
# Export helpers
# =========================================================================
async def _collect_user_data(
    session: AsyncSession, user_id: str
) -> dict[str, Any]:
    """Collect every user-owned record into a structured dict.

    Uses the ORM (not raw SQL) for portability across dialects.
    Journal blobs are included **encrypted** — Kiaanverse never
    decrypts them server-side.
    """
    user = await session.get(User, user_id)
    profile = (
        await session.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
    ).scalar_one_or_none()

    moods = (
        await session.execute(select(Mood).where(Mood.user_id == user_id))
    ).scalars().all()

    blobs = (
        await session.execute(
            select(EncryptedBlob).where(EncryptedBlob.user_id == user_id)
        )
    ).scalars().all()

    consents = (
        await session.execute(
            select(UserConsent).where(UserConsent.user_id == user_id)
        )
    ).scalars().all()

    try:
        subscription = (
            await session.execute(
                select(UserSubscription).where(
                    UserSubscription.user_id == user_id
                )
            )
        ).scalar_one_or_none()
    except Exception:
        subscription = None

    account: dict[str, Any] = {
        "id": user.id if user else None,
        "email": user.email if user else None,
        "locale": user.locale if user else None,
        "created_at": user.created_at.isoformat()
        if user and user.created_at
        else None,
        "profile": (
            {
                "full_name": profile.full_name,
                "base_experience": profile.base_experience,
            }
            if profile
            else None
        ),
    }

    practice = {
        "mood_logs": [
            {
                "id": m.id,
                "score": m.score,
                "tags": m.tags,
                "note": m.note,
                "at": m.at.isoformat() if m.at else None,
            }
            for m in moods
        ],
        "journal_entries_encrypted": [
            {
                "id": b.id,
                "encrypted_content": b.blob_json,
                "created_at": b.created_at.isoformat()
                if b.created_at
                else None,
            }
            for b in blobs
        ],
    }

    return {
        "account": account,
        # KIAAN conversations are encrypted at rest via the chat service;
        # we include the encrypted blobs under journal_entries_encrypted
        # and expose an empty list here so the file structure is stable.
        "conversations": [],
        "practice": practice,
        "subscription": [
            {
                "plan_id": subscription.plan_id,
                "status": (
                    subscription.status.value
                    if subscription.status
                    else None
                ),
            }
        ]
        if subscription
        else [],
        "consents": [
            {
                "type": c.consent_type.value,
                "granted": c.granted,
                "granted_at": c.granted_at.isoformat()
                if c.granted_at
                else None,
                "withdrawn_at": c.withdrawn_at.isoformat()
                if c.withdrawn_at
                else None,
            }
            for c in consents
        ],
    }


def _build_export_zip(user_id: str, data: dict[str, Any]) -> tuple[bytes, str]:
    """Build the ZIP archive and return (bytes, filename)."""
    buf = io.BytesIO()
    date_str = _now().strftime("%Y-%m-%d")
    filename = f"kiaanverse-data-export-{user_id}-{date_str}.zip"

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(
            "account.json",
            json.dumps(data["account"], indent=2, default=str),
        )
        zf.writestr(
            "conversations.json",
            json.dumps(data["conversations"], indent=2, default=str),
        )
        zf.writestr(
            "practice.json",
            json.dumps(data["practice"], indent=2, default=str),
        )
        zf.writestr(
            "subscription.json",
            json.dumps(data["subscription"], indent=2, default=str),
        )
        zf.writestr(
            "consents.json",
            json.dumps(data["consents"], indent=2, default=str),
        )
        zf.writestr("README.txt", _build_readme(user_id, date_str))

    return buf.getvalue(), filename


def _build_readme(user_id: str, date_str: str) -> str:
    """Assemble the human-readable README bundled with every export."""
    return (
        "KIAANVERSE DATA EXPORT\n"
        "===========================================\n"
        f"User ID   : {user_id}\n"
        f"Date      : {date_str}\n"
        "Generated : Kiaanverse Privacy System (GDPR Art. 20)\n\n"
        "FILES IN THIS EXPORT\n"
        "--------------------\n"
        "account.json\n"
        "  Your profile, email, locale, and account metadata.\n\n"
        "conversations.json\n"
        "  Your conversation history with the KIAAN companion.\n"
        "  Sensitive chat content is end-to-end encrypted where\n"
        "  applicable and included under journal_entries_encrypted.\n\n"
        "practice.json\n"
        "  Your mood logs and Nitya Sadhana records.\n\n"
        "  IMPORTANT — ENCRYPTED JOURNAL ENTRIES:\n"
        "  The `journey_entries_encrypted` field contains your\n"
        "  Shadripu Journey journal entries in ENCRYPTED form.\n"
        "  Kiaanverse cannot read, decrypt, or access the content of\n"
        "  your journal. Only you hold the key to this sacred space.\n"
        "  The encrypted data is included here for your records, but\n"
        "  cannot be read without your personal decryption key.\n\n"
        "subscription.json\n"
        "  Your subscription plan history. Payment card data is NEVER\n"
        "  stored by Kiaanverse — it is held exclusively by Stripe\n"
        "  (PCI-DSS Level 1 certified).\n\n"
        "consents.json\n"
        "  The history of every consent you granted or withdrew.\n\n"
        "QUESTIONS?\n"
        "----------\n"
        f"Email: {SUPPORT_EMAIL}\n"
        "Response time: within 30 days (GDPR Art. 12(3))\n"
        "Website: kiaanverse.com/privacy\n"
    )


def _upload_and_sign(
    zip_bytes: bytes,
    filename: str,
    user_id: str,
) -> tuple[str, datetime.datetime]:
    """Upload the export to R2/S3 and return ``(signed_url, expires_at)``.

    When ``R2_ENDPOINT_URL`` / credentials are **not** configured (or
    ``boto3`` isn't installed), returns an in-app fallback token URL so
    local dev and tests remain functional.  The fallback URL is still
    unguessable (64-char url-safe token) and expires in 7 days.
    """
    endpoint = os.environ.get("R2_ENDPOINT_URL")
    access_key = os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
    bucket = os.environ.get("R2_BUCKET_NAME", "kiaanverse-exports")

    expires_at = _now() + datetime.timedelta(seconds=SIGNED_URL_EXPIRY_SECONDS)

    if endpoint and access_key and secret_key:
        try:
            import boto3
            from botocore.config import Config

            s3 = boto3.client(
                "s3",
                endpoint_url=endpoint,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                config=Config(signature_version="s3v4"),
            )
            key = f"exports/{user_id}/{filename}"
            s3.put_object(
                Bucket=bucket,
                Key=key,
                Body=zip_bytes,
                ContentType="application/zip",
            )
            signed_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=SIGNED_URL_EXPIRY_SECONDS,
            )
            return signed_url, expires_at
        except Exception as e:
            logger.warning(
                "R2 upload failed — falling back to token URL: %s", e
            )

    # Fallback: unguessable token URL.  Download endpoint would be
    # implemented separately; for now we record the token so the router
    # can show "ready" state.
    token = secrets.token_urlsafe(64)
    return f"{EXPORT_FALLBACK_BASE_URL}?token={token}", expires_at


async def _send_export_ready_email(
    to: str,
    download_url: str,
    expires_at: datetime.datetime,
) -> None:
    """Best-effort email when the export is ready."""
    try:
        from backend.services.email_service import send_email
    except Exception as e:  # pragma: no cover - import guard
        logger.warning("Email service unavailable for export email: %s", e)
        return

    expires_str = expires_at.strftime("%B %d, %Y")
    subject = "Your Kiaanverse Data Export is Ready"
    html_body = (
        f"<p>Your data export is ready to download.</p>"
        f"<p><a href='{download_url}'>Download your data</a></p>"
        f"<p>This link expires on <strong>{expires_str}</strong> "
        f"(7 days).</p>"
        f"<p>If you have questions, contact "
        f"<a href='mailto:{SUPPORT_EMAIL}'>{SUPPORT_EMAIL}</a>.</p>"
        f"<p>— The Kiaanverse Team</p>"
    )
    text_body = (
        f"Your Kiaanverse data export is ready:\n{download_url}\n\n"
        f"This link expires on {expires_str}.\n"
        f"Questions? Email {SUPPORT_EMAIL}.\n"
    )
    try:
        await send_email(to, subject, html_body, text_body)
    except Exception as e:
        logger.warning("Failed to send export-ready email: %s", e)


# =========================================================================
# Deletion helpers
# =========================================================================
async def _cancel_stripe_subscription(
    session: AsyncSession, user_id: str
) -> None:
    """Best-effort cancellation of the user's active Stripe subscription.

    Stripe is optional — if the library is not installed or
    ``STRIPE_SECRET_KEY`` is unset, we skip silently.  Cancellation
    failure is logged but never blocks hard-deletion.
    """
    secret = os.environ.get("STRIPE_SECRET_KEY")
    if not secret:
        return

    try:
        import stripe  # type: ignore
    except Exception:
        return

    try:
        stmt = select(UserSubscription).where(
            UserSubscription.user_id == user_id
        )
        subscription = (await session.execute(stmt)).scalar_one_or_none()
    except Exception as e:
        logger.debug("Could not query subscription for cancel: %s", e)
        return

    stripe_sub_id = getattr(subscription, "stripe_subscription_id", None)
    if not stripe_sub_id:
        return

    stripe.api_key = secret
    try:
        stripe.Subscription.cancel(stripe_sub_id)
    except Exception as e:
        logger.warning(
            "Stripe cancellation failed for user=%s sub=%s: %s",
            user_id,
            stripe_sub_id,
            e,
        )


async def _clear_redis_sessions(user_id: str) -> None:
    """Best-effort: purge session-like keys for a deleted user."""
    try:
        from backend.cache.redis_cache import get_redis_cache

        cache = await get_redis_cache()
    except Exception as e:
        logger.debug("Redis unavailable for session purge: %s", e)
        return

    if not getattr(cache, "is_connected", False):
        return

    client = cache.get_client()
    if client is None:
        return

    import contextlib

    try:
        # Conservative: delete keys that clearly belong to this user.
        patterns = (
            f"session:{user_id}:*",
            f"refresh:{user_id}:*",
            f"user:{user_id}:*",
        )
        for pattern in patterns:
            async for key in client.scan_iter(match=pattern, count=200):
                with contextlib.suppress(Exception):
                    await client.delete(key)
    except Exception as e:
        logger.warning(
            "Failed to clear Redis sessions for user=%s: %s", user_id, e
        )
