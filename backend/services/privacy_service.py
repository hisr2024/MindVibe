"""GDPR Privacy Service — Art. 15 (access), Art. 17 (erasure), Art. 20 (portability).

Handles:
  - export_user_data: gathers all 8 user-data tables → JSON → ZIP → signed URL (7d)
  - initiate_deletion: soft-delete + 30-day grace period (cancelable)
  - execute_hard_delete: cascade delete across all tables + Redis + Stripe
  - send_export_ready_email / send_deletion_initiated_email via Resend
"""

from __future__ import annotations

import datetime
import hashlib
import hmac
import io
import json
import logging
import os
import zipfile
from typing import Any

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.models import (
    ComplianceAuditLog,
    DataExportRequest,
    DataExportStatus,
    DeletionRequest,
    DeletionRequestStatus,
    EncryptedBlob,
    JournalEntry,
    KiaanChatMessage,
    KiaanChatSession,
    Mood,
    Notification,
    PushSubscription,
    RefreshToken,
    Session,
    User,
    UserConsent,
    UserJourney,
    UserJourneyProgress,
    UserJourneyStepState,
    UserProfile,
    UserSubscription,
    UserProgress,
)
from backend.services.email_service import send_email

logger = logging.getLogger(__name__)

EXPORT_SIGNED_URL_EXPIRY_DAYS = 7
GRACE_PERIOD_DAYS = 30
RATE_LIMIT_HOURS = 24

_SIGNING_KEY = settings.SECRET_KEY.encode()


# ---------------------------------------------------------------------------
# URL signing (HMAC-SHA256) — download tokens verified without DB lookup
# ---------------------------------------------------------------------------

def _sign_token(export_id: int, user_id: str, expires_at: datetime.datetime) -> str:
    payload = f"{export_id}:{user_id}:{int(expires_at.timestamp())}"
    sig = hmac.new(_SIGNING_KEY, payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"


def verify_signed_token(token: str) -> dict[str, Any] | None:
    parts = token.rsplit(":", 1)
    if len(parts) != 2:
        return None
    payload, sig = parts
    expected = hmac.new(_SIGNING_KEY, payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    pieces = payload.split(":")
    if len(pieces) != 3:
        return None
    export_id, user_id, exp_ts = pieces
    if datetime.datetime.now(datetime.UTC).timestamp() > float(exp_ts):
        return None
    return {"export_id": int(export_id), "user_id": user_id}


# ---------------------------------------------------------------------------
# Rate-limit check — 1 export per 24h
# ---------------------------------------------------------------------------

async def check_export_rate_limit(db: AsyncSession, user_id: str) -> bool:
    cutoff = datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=RATE_LIMIT_HOURS)
    stmt = (
        select(DataExportRequest)
        .where(
            DataExportRequest.user_id == user_id,
            DataExportRequest.created_at >= cutoff,
        )
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


# ---------------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------------

async def _audit(
    db: AsyncSession,
    user_id: str,
    action: str,
    ip_hash: str,
    details: dict[str, Any] | None = None,
) -> None:
    db.add(ComplianceAuditLog(
        user_id=user_id,
        action=action,
        resource_type="privacy",
        resource_id=user_id,
        details=details,
        ip_address=ip_hash,
        severity="info" if "cancel" in action or "export" in action else "warning",
    ))
    await db.flush()


def hash_ip(ip: str) -> str:
    return hashlib.sha256(f"{ip}:{settings.SECRET_KEY}".encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# DATA EXPORT (Art. 15 + Art. 20)
# ---------------------------------------------------------------------------

def _serialize_dt(dt: datetime.datetime | None) -> str | None:
    return dt.isoformat() if dt else None


async def _gather_account(db: AsyncSession, user_id: str) -> dict:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    profile = (await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )).scalar_one_or_none()
    consents = (await db.execute(
        select(UserConsent).where(UserConsent.user_id == user_id)
    )).scalars().all()
    sessions = (await db.execute(
        select(Session).where(Session.user_id == user_id)
    )).scalars().all()

    return {
        "user": {
            "id": user.id if user else None,
            "email": user.email if user else None,
            "locale": user.locale if user else None,
            "email_verified": user.email_verified if user else None,
            "is_onboarded": user.is_onboarded if user else None,
            "created_at": _serialize_dt(user.created_at) if user else None,
        },
        "profile": {
            "full_name": profile.full_name if profile else None,
            "base_experience": profile.base_experience if profile else None,
            "created_at": _serialize_dt(profile.created_at) if profile else None,
        } if profile else None,
        "consents": [
            {
                "type": c.consent_type.value,
                "granted": c.granted,
                "granted_at": _serialize_dt(c.granted_at),
                "withdrawn_at": _serialize_dt(c.withdrawn_at),
            }
            for c in consents
        ],
        "sessions": [
            {
                "id": s.id,
                "created_at": _serialize_dt(s.created_at),
                "last_used_at": _serialize_dt(s.last_used_at),
                "ip_address": s.ip_address,
            }
            for s in sessions
        ],
    }


async def _gather_conversations(db: AsyncSession, user_id: str) -> dict:
    messages = (await db.execute(
        select(KiaanChatMessage)
        .where(KiaanChatMessage.user_id == user_id)
        .order_by(KiaanChatMessage.created_at)
    )).scalars().all()
    chat_sessions = (await db.execute(
        select(KiaanChatSession)
        .where(KiaanChatSession.user_id == user_id)
        .order_by(KiaanChatSession.started_at)
    )).scalars().all()

    return {
        "kiaan_sessions": [
            {
                "id": s.id,
                "started_at": _serialize_dt(s.started_at),
                "ended_at": _serialize_dt(s.ended_at),
                "message_count": s.message_count,
                "initial_mood": s.initial_mood,
                "language": s.language,
                "session_summary": s.session_summary,
            }
            for s in chat_sessions
        ],
        "kiaan_messages": [
            {
                "id": m.id,
                "session_id": m.session_id,
                "user_message": m.user_message,
                "kiaan_response": m.kiaan_response,
                "detected_emotion": m.detected_emotion,
                "verses_used": m.verses_used,
                "language": m.language,
                "created_at": _serialize_dt(m.created_at),
            }
            for m in messages
        ],
    }


async def _gather_practice(db: AsyncSession, user_id: str) -> dict:
    moods = (await db.execute(
        select(Mood).where(Mood.user_id == user_id, Mood.deleted_at.is_(None))
        .order_by(Mood.at)
    )).scalars().all()

    journeys = (await db.execute(
        select(UserJourney).where(UserJourney.user_id == user_id)
    )).scalars().all()

    journal_entries = (await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None))
        .order_by(JournalEntry.created_at)
    )).scalars().all()

    journal_blobs = (await db.execute(
        select(EncryptedBlob)
        .where(EncryptedBlob.user_id == user_id, EncryptedBlob.deleted_at.is_(None))
    )).scalars().all()

    progress = (await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )).scalar_one_or_none()

    push_subs = (await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    )).scalars().all()

    return {
        "mood_logs": [
            {
                "id": m.id,
                "score": m.score,
                "tags": m.tags,
                "note": m.note,
                "at": _serialize_dt(m.at),
            }
            for m in moods
        ],
        "journey_entries": [
            {
                "id": j.id,
                "journey_id": getattr(j, "journey_id", None),
                "status": getattr(j, "status", None),
                "started_at": _serialize_dt(getattr(j, "started_at", None)),
                "completed_at": _serialize_dt(getattr(j, "completed_at", None)),
            }
            for j in journeys
        ],
        "journal_entries_encrypted": [
            {
                "id": e.id,
                "encrypted_title": e.encrypted_title,
                "encrypted_content": e.encrypted_content,
                "encryption_meta": e.encryption_meta,
                "mood_labels": e.mood_labels,
                "tag_labels": e.tag_labels,
                "created_at": _serialize_dt(e.created_at),
                "_notice": "ENCRYPTED — use your personal encryption key to decrypt",
            }
            for e in journal_entries
        ],
        "journal_blobs_encrypted": [
            {
                "id": b.id,
                "blob_json": b.blob_json,
                "created_at": _serialize_dt(b.created_at),
                "_notice": "ENCRYPTED — use your personal encryption key to decrypt",
            }
            for b in journal_blobs
        ],
        "progress": {
            "user_id": progress.user_id if progress else None,
        } if progress else None,
        "notification_tokens": [
            {
                "id": p.id,
                "platform": p.platform,
                "device_name": p.device_name,
                "is_active": p.is_active,
                "created_at": _serialize_dt(p.created_at),
            }
            for p in push_subs
        ],
    }


async def _gather_subscription(db: AsyncSession, user_id: str) -> dict:
    sub = (await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == user_id)
    )).scalar_one_or_none()

    if not sub:
        return {"subscription": None}

    return {
        "subscription": {
            "plan_id": sub.plan_id,
            "status": sub.status.value if sub.status else None,
            "payment_provider": sub.payment_provider,
            "current_period_start": _serialize_dt(sub.current_period_start),
            "current_period_end": _serialize_dt(sub.current_period_end),
            "cancel_at_period_end": sub.cancel_at_period_end,
            "created_at": _serialize_dt(sub.created_at),
            # NO card data, NO stripe_customer_id, NO stripe_subscription_id
        },
    }


_README_CONTENT = """\
KIAANVERSE DATA EXPORT
=======================

This ZIP archive contains all personal data associated with your
Kiaanverse (Sakha / MindVibe) account, provided under:

  - GDPR Article 15 (Right of Access)
  - GDPR Article 20 (Right to Data Portability)

Files included:
  account.json       — Profile, email, sessions, consent records
  conversations.json — KIAAN chat sessions and messages
  practice.json      — Mood logs, journey progress, journal entries,
                        notification tokens
  subscription.json  — Subscription plan & billing period (NO card data)

IMPORTANT — ENCRYPTED ENTRIES
Journal entries and journal blobs are stored in encrypted form.
The server never has access to your plaintext journal content.
To read these entries, you need the encryption key stored in your
browser's local storage.  Fields marked "_notice": "ENCRYPTED" are
ciphertext and cannot be read without your key.

This export was generated on {date} and the download link expires
after 7 days.  You may request a new export once every 24 hours.

Questions?  Contact privacy@kiaanverse.com
"""


async def export_user_data(
    db: AsyncSession,
    user_id: str,
    ip_hash: str,
) -> DataExportRequest:
    """Collect all user data, build ZIP, store, and return export request."""
    account = await _gather_account(db, user_id)
    conversations = await _gather_conversations(db, user_id)
    practice = await _gather_practice(db, user_id)
    subscription = await _gather_subscription(db, user_id)

    today = datetime.date.today().isoformat()
    zip_name = f"kiaanverse-data-export-{user_id[:8]}-{today}"

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{zip_name}/account.json", json.dumps(account, indent=2, default=str))
        zf.writestr(f"{zip_name}/conversations.json", json.dumps(conversations, indent=2, default=str))
        zf.writestr(f"{zip_name}/practice.json", json.dumps(practice, indent=2, default=str))
        zf.writestr(f"{zip_name}/subscription.json", json.dumps(subscription, indent=2, default=str))
        zf.writestr(f"{zip_name}/README.txt", _README_CONTENT.format(date=today))

    zip_bytes = buf.getvalue()

    upload_dir = os.path.join(settings.UPLOAD_DIR, "privacy_exports", user_id)
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{zip_name}.zip")
    with open(file_path, "wb") as f:
        f.write(zip_bytes)

    expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
        days=EXPORT_SIGNED_URL_EXPIRY_DAYS
    )

    export_req = DataExportRequest(
        user_id=user_id,
        status=DataExportStatus.COMPLETED,
        format="zip",
        file_path=file_path,
        file_size_bytes=len(zip_bytes),
        expires_at=expires_at,
        completed_at=datetime.datetime.now(datetime.UTC),
        ip_address=ip_hash,
    )
    db.add(export_req)
    await db.flush()
    await db.refresh(export_req)

    token = _sign_token(export_req.id, user_id, expires_at)
    export_req.download_token = token
    await db.commit()
    await db.refresh(export_req)

    await _audit(db, user_id, "export_completed", ip_hash, {
        "export_id": export_req.id,
        "file_size": len(zip_bytes),
    })

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user and user.email:
        download_url = f"{settings.FRONTEND_URL}/api/privacy/export?token={token}"
        await send_export_ready_email(user.email, download_url)

    logger.info("Data export completed for user %s (%d bytes)", user_id[:8], len(zip_bytes))
    return export_req


async def get_export_zip_bytes(db: AsyncSession, export_id: int) -> bytes | None:
    export_req = (await db.execute(
        select(DataExportRequest).where(DataExportRequest.id == export_id)
    )).scalar_one_or_none()
    if not export_req or not export_req.file_path:
        return None
    if not os.path.isfile(export_req.file_path):
        return None
    with open(export_req.file_path, "rb") as f:
        return f.read()


# ---------------------------------------------------------------------------
# DELETION (Art. 17)
# ---------------------------------------------------------------------------

async def initiate_deletion(
    db: AsyncSession,
    user_id: str,
    ip_hash: str,
    reason: str | None = None,
) -> DeletionRequest:
    """Soft-delete day 0 — starts the 30-day grace period."""
    existing = (await db.execute(
        select(DeletionRequest).where(
            DeletionRequest.user_id == user_id,
            DeletionRequest.status.in_([
                DeletionRequestStatus.PENDING,
                DeletionRequestStatus.GRACE_PERIOD,
                DeletionRequestStatus.PROCESSING,
            ]),
        )
    )).scalar_one_or_none()

    if existing:
        return existing

    grace_end = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=GRACE_PERIOD_DAYS)
    req = DeletionRequest(
        user_id=user_id,
        status=DeletionRequestStatus.GRACE_PERIOD,
        reason=reason,
        grace_period_days=GRACE_PERIOD_DAYS,
        grace_period_ends_at=grace_end,
        ip_address=ip_hash,
    )
    db.add(req)

    # Soft-delete user immediately (blocks login during grace period)
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(deleted_at=datetime.datetime.now(datetime.UTC))
    )
    await db.commit()
    await db.refresh(req)

    await _audit(db, user_id, "deletion_initiated", ip_hash, {
        "grace_period_ends_at": grace_end.isoformat(),
        "reason": reason,
    })

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user and user.email:
        await send_deletion_initiated_email(user.email, grace_end)

    logger.info("Deletion initiated for user %s, grace ends %s", user_id[:8], grace_end.isoformat())
    return req


async def cancel_deletion(
    db: AsyncSession,
    user_id: str,
    ip_hash: str,
) -> DeletionRequest | None:
    req = (await db.execute(
        select(DeletionRequest).where(
            DeletionRequest.user_id == user_id,
            DeletionRequest.status == DeletionRequestStatus.GRACE_PERIOD,
        )
    )).scalar_one_or_none()

    if not req:
        return None

    req.status = DeletionRequestStatus.CANCELED
    req.canceled_at = datetime.datetime.now(datetime.UTC)

    # Restore user
    await db.execute(
        update(User).where(User.id == user_id).values(deleted_at=None)
    )
    await db.commit()
    await db.refresh(req)

    await _audit(db, user_id, "deletion_canceled", ip_hash)
    logger.info("Deletion canceled for user %s", user_id[:8])
    return req


async def execute_hard_delete(db: AsyncSession, user_id: str) -> None:
    """Day-30 hard cascade delete — called by scheduled job."""
    tables_to_purge = [
        KiaanChatMessage, KiaanChatSession,
        JournalEntry, EncryptedBlob,
        Mood,
        UserJourneyStepState, UserJourneyProgress, UserJourney,
        UserConsent, PushSubscription, Notification,
        RefreshToken, Session,
        UserProgress, UserProfile,
    ]

    # Cancel Stripe subscription
    sub = (await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == user_id)
    )).scalar_one_or_none()
    if sub and sub.stripe_subscription_id:
        try:
            from backend.services.stripe_service import cancel_subscription
            await cancel_subscription(db, user_id, cancel_immediately=True)
        except Exception as e:
            logger.error("Stripe cancel failed for user %s: %s", user_id[:8], e)

    # Delete subscription record
    await db.execute(delete(UserSubscription).where(UserSubscription.user_id == user_id))

    for model in tables_to_purge:
        await db.execute(delete(model).where(model.user_id == user_id))

    # Delete the user row itself
    await db.execute(delete(User).where(User.id == user_id))

    # Clean up export files
    export_dir = os.path.join(settings.UPLOAD_DIR, "privacy_exports", user_id)
    if os.path.isdir(export_dir):
        import shutil
        shutil.rmtree(export_dir, ignore_errors=True)

    # Invalidate Redis sessions
    try:
        from backend.cache import get_redis_cache
        cache = await get_redis_cache()
        if cache.is_connected():
            await cache.delete(f"session:{user_id}")
            await cache.delete(f"user:{user_id}")
    except Exception as e:
        logger.warning("Redis cleanup failed for user %s: %s", user_id[:8], e)

    # Mark deletion request completed
    await db.execute(
        update(DeletionRequest)
        .where(
            DeletionRequest.user_id == user_id,
            DeletionRequest.status == DeletionRequestStatus.GRACE_PERIOD,
        )
        .values(
            status=DeletionRequestStatus.COMPLETED,
            completed_at=datetime.datetime.now(datetime.UTC),
        )
    )

    await db.commit()
    logger.info("Hard delete completed for user %s", user_id[:8])


# ---------------------------------------------------------------------------
# Email helpers (Resend via shared email service)
# ---------------------------------------------------------------------------

async def send_export_ready_email(email: str, download_url: str) -> bool:
    subject = "Your Kiaanverse data export is ready"
    html = f"""\
<div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#0b0b0f;color:#f5e6d3;padding:40px;border-radius:16px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#ffb347;font-size:28px;margin:0;">Kiaanverse</h1>
    <p style="color:#f5e6d3aa;font-size:14px;margin-top:8px;">Your data export is ready</p>
  </div>
  <p style="line-height:1.7;color:#f5e6d3cc;">
    Your personal data export has been prepared. Click the button below to download your data as a ZIP file.
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="{download_url}"
       style="display:inline-block;background:#C8A84B;color:#0A0A14;padding:14px 32px;border-radius:12px;font-weight:600;text-decoration:none;font-size:16px;">
      Download My Data
    </a>
  </div>
  <p style="line-height:1.7;color:#f5e6d3aa;font-size:13px;">
    This link expires in 7 days. Journal entries are included in encrypted form —
    you need your personal encryption key to read them.
  </p>
  <hr style="border:none;border-top:1px solid #f5e6d322;margin:24px 0;">
  <p style="color:#f5e6d366;font-size:12px;text-align:center;">
    GDPR Articles 15 &amp; 20 · Kiaanverse Privacy Team · privacy@kiaanverse.com
  </p>
</div>"""
    text = f"Your Kiaanverse data export is ready. Download: {download_url} (expires in 7 days)"
    return await send_email(email, subject, html, text)


async def send_deletion_initiated_email(email: str, grace_end: datetime.datetime) -> bool:
    grace_str = grace_end.strftime("%B %d, %Y")
    cancel_url = f"{settings.FRONTEND_URL}/settings/privacy"
    subject = "Account deletion initiated — 30-day grace period"
    html = f"""\
<div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#0b0b0f;color:#f5e6d3;padding:40px;border-radius:16px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#ffb347;font-size:28px;margin:0;">Kiaanverse</h1>
    <p style="color:#f5e6d3aa;font-size:14px;margin-top:8px;">Account deletion request</p>
  </div>
  <p style="line-height:1.7;color:#f5e6d3cc;">
    We've received your request to delete your account. A <strong>30-day grace period</strong>
    has started. Your account will be permanently deleted on <strong>{grace_str}</strong>.
  </p>
  <p style="line-height:1.7;color:#f5e6d3cc;">
    During this period you can cancel the deletion and restore your account:
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="{cancel_url}"
       style="display:inline-block;background:#C8A84B;color:#0A0A14;padding:14px 32px;border-radius:12px;font-weight:600;text-decoration:none;font-size:16px;">
      Cancel Deletion
    </a>
  </div>
  <p style="line-height:1.7;color:#f5e6d3aa;font-size:13px;">
    After {grace_str}, all data across all tables will be permanently erased.
    This action cannot be undone.
  </p>
  <hr style="border:none;border-top:1px solid #f5e6d322;margin:24px 0;">
  <p style="color:#f5e6d366;font-size:12px;text-align:center;">
    GDPR Article 17 · Kiaanverse Privacy Team · privacy@kiaanverse.com
  </p>
</div>"""
    text = (
        f"Your Kiaanverse account is scheduled for deletion on {grace_str}. "
        f"Cancel at: {cancel_url}"
    )
    return await send_email(email, subject, html, text)
