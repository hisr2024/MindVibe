from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.models import AuditEvent, EncryptedBlob, Mood, UserConsent
from backend.schemas import (
    AuditEventOut,
    BlobOut,
    ConsentDecision,
    ConsentStatus,
    ExportBundle,
    MoodOut,
)
from backend.security.encryption import get_field_encryptor

router = APIRouter(prefix="/privacy", tags=["privacy"])


def _get_encryptor():
    return get_field_encryptor()


async def _record_audit(
    db: AsyncSession, user_id: str | None, action: str, metadata: dict | None = None
) -> None:
    await db.execute(
        insert(AuditEvent).values(
            user_id=user_id, action=action, event_metadata=metadata
        )
    )


@router.post("/consent", response_model=ConsentStatus, status_code=status.HTTP_201_CREATED)
async def record_consent(
    payload: ConsentDecision,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> ConsentStatus:
    res = await db.execute(
        insert(UserConsent)
        .values(user_id=user_id, consented=payload.consented, context=payload.context)
        .returning(
            UserConsent.consented, UserConsent.context, UserConsent.recorded_at
        )
    )
    row = res.first()
    await _record_audit(
        db,
        user_id,
        "consent_recorded",
        {"consented": payload.consented, "context": payload.context},
    )
    await db.commit()
    if not row:
        raise HTTPException(status_code=500, detail="Unable to persist consent")
    return ConsentStatus(
        consented=row.consented,
        context=row.context,
        recorded_at=row.recorded_at.isoformat() if row.recorded_at else None,
    )


@router.get("/consent", response_model=ConsentStatus)
async def latest_consent(
    db: AsyncSession = Depends(get_db), user_id: str = Depends(get_user_id)
) -> ConsentStatus:
    res = await db.execute(
        select(UserConsent)
        .where(UserConsent.user_id == user_id)
        .order_by(UserConsent.recorded_at.desc())
        .limit(1)
    )
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent not found")
    return ConsentStatus(
        consented=record.consented,
        context=record.context,
        recorded_at=record.recorded_at.isoformat() if record.recorded_at else None,
    )


@router.get("/export", response_model=ExportBundle)
async def export_user_data(
    db: AsyncSession = Depends(get_db), user_id: str = Depends(get_user_id)
) -> ExportBundle:
    encryptor = _get_encryptor()
    moods_result = await db.execute(
        select(Mood)
        .where(Mood.user_id == user_id, Mood.deleted_at.is_(None))
        .order_by(Mood.at.desc())
    )
    blobs_result = await db.execute(
        select(EncryptedBlob)
        .where(EncryptedBlob.user_id == user_id, EncryptedBlob.deleted_at.is_(None))
        .order_by(EncryptedBlob.created_at.desc())
    )
    moods = [
        MoodOut(
            id=record.id,
            score=record.score,
            tags=encryptor.decrypt_json((record.tags or {}).get("ciphertext")),
            note=encryptor.decrypt_text(record.note),
            at=record.at.isoformat(),
        )
        for record in moods_result.scalars().all()
    ]
    journals = [
        BlobOut(
            id=record.id,
            created_at=record.created_at.isoformat(),
            blob_json=encryptor.decrypt_json(record.blob_json) or "",
        )
        for record in blobs_result.scalars().all()
    ]
    await _record_audit(db, user_id, "data_exported", {"mood_count": len(moods), "journal_count": len(journals)})
    await db.commit()
    return ExportBundle(moods=moods, journals=journals)


@router.delete("/data", status_code=status.HTTP_202_ACCEPTED)
async def delete_user_data(
    db: AsyncSession = Depends(get_db), user_id: str = Depends(get_user_id)
) -> dict:
    now = datetime.now(UTC)
    await db.execute(
        update(Mood)
        .where(Mood.user_id == user_id, Mood.deleted_at.is_(None))
        .values(deleted_at=now)
    )
    await db.execute(
        update(EncryptedBlob)
        .where(EncryptedBlob.user_id == user_id, EncryptedBlob.deleted_at.is_(None))
        .values(deleted_at=now)
    )
    await _record_audit(db, user_id, "data_deleted", {"at": now.isoformat()})
    await db.commit()
    return {"status": "scheduled", "deleted_at": now.isoformat()}


@router.get("/audit", response_model=list[AuditEventOut])
async def audit_history(
    db: AsyncSession = Depends(get_db), user_id: str = Depends(get_user_id)
) -> list[AuditEventOut]:
    res = await db.execute(
        select(AuditEvent)
        .where(AuditEvent.user_id == user_id)
        .order_by(AuditEvent.created_at.desc())
        .limit(50)
    )
    records = res.scalars().all()
    return [
        AuditEventOut(
            action=record.action,
            created_at=record.created_at.isoformat(),
            metadata=record.event_metadata,
        )
        for record in records
    ]
