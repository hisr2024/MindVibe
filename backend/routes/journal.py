from datetime import UTC, datetime
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.models import JournalEntry
from backend.schemas import JournalEntryIn, JournalEntryOut, JournalExport
from backend.security.encryption import EncryptionManager
from backend.security.rate_limiter import rate_limit
from backend.services.background_jobs import enqueue_journal_summary

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.post("/entries", response_model=JournalEntryOut, dependencies=[Depends(rate_limit(10, 60))])
async def create_entry(payload: JournalEntryIn, db: AsyncSession = Depends(get_db)):
    user_id = get_user_id()
    manager = EncryptionManager()
    title_cipher, key_id = manager.encrypt(payload.title)
    content_cipher, _ = manager.encrypt(payload.content)
    entry = JournalEntry(
        entry_uuid=secrets.token_hex(8),
        user_id=user_id,
        title_ciphertext=title_cipher,
        content_ciphertext=content_cipher,
        encryption_key_id=key_id,
        mood_score=payload.mood_score,
        tags=payload.tags,
        attachments=payload.attachments,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    await enqueue_journal_summary(entry.id, user_id)
    return JournalEntryOut(
        id=entry.id,
        entry_uuid=entry.entry_uuid,
        title=payload.title,
        content=payload.content,
        mood_score=payload.mood_score,
        tags=payload.tags,
        attachments=payload.attachments,
        created_at=entry.created_at.isoformat(),
        updated_at=None,
    )


@router.get("/entries", response_model=list[JournalEntryOut])
async def list_entries(db: AsyncSession = Depends(get_db)):
    user_id = get_user_id()
    stmt = select(JournalEntry).where(
        JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None)
    ).order_by(JournalEntry.created_at.desc())
    entries = (await db.execute(stmt)).scalars().all()
    manager = EncryptionManager()
    response: list[JournalEntryOut] = []
    for entry in entries:
        response.append(
            JournalEntryOut(
                id=entry.id,
                entry_uuid=entry.entry_uuid,
                title=manager.decrypt(entry.title_ciphertext),
                content=manager.decrypt(entry.content_ciphertext),
                mood_score=entry.mood_score,
                tags=entry.tags,
                attachments=entry.attachments,
                created_at=entry.created_at.isoformat(),
                updated_at=entry.updated_at.isoformat() if entry.updated_at else None,
            )
        )
    return response


@router.delete("/entries/{entry_uuid}")
async def delete_entry(entry_uuid: str, db: AsyncSession = Depends(get_db)):
    user_id = get_user_id()
    stmt = (
        update(JournalEntry)
        .where(JournalEntry.entry_uuid == entry_uuid, JournalEntry.user_id == user_id)
        .values(deleted_at=datetime.now(UTC))
    )
    result = await db.execute(stmt)
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"entry_uuid": entry_uuid, "deleted": True}


@router.get("/export", response_model=JournalExport)
async def export_entries(db: AsyncSession = Depends(get_db)):
    user_id = get_user_id()
    manager = EncryptionManager()
    stmt = select(JournalEntry).where(
        JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None)
    )
    entries = (await db.execute(stmt)).scalars().all()
    payload = [
        JournalEntryOut(
            id=entry.id,
            entry_uuid=entry.entry_uuid,
            title=manager.decrypt(entry.title_ciphertext),
            content=manager.decrypt(entry.content_ciphertext),
            mood_score=entry.mood_score,
            tags=entry.tags,
            attachments=entry.attachments,
            created_at=entry.created_at.isoformat(),
            updated_at=entry.updated_at.isoformat() if entry.updated_at else None,
        )
        for entry in entries
    ]
    return JournalExport(entries=payload)
