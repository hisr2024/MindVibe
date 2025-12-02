"""Data governance helpers for DSAR-style operations."""
from __future__ import annotations

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import JournalEntry, User
from backend.security.encryption import decrypt_sensitive


async def export_user_data(db: AsyncSession, user_id: int) -> dict:
    entries_stmt = select(JournalEntry).where(
        JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None)
    )
    entries = (await db.execute(entries_stmt)).scalars().all()
    materialized = []
    for entry in entries:
        materialized.append(
            {
                "id": entry.id,
                "entry_uuid": entry.entry_uuid,
                "title": decrypt_sensitive(entry.title_ciphertext),
                "content": decrypt_sensitive(entry.content_ciphertext),
                "mood_score": entry.mood_score,
                "tags": entry.tags,
                "attachments": entry.attachments,
                "created_at": entry.created_at.isoformat(),
                "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
            }
        )
    return {"entries": materialized}


async def anonymize_user(db: AsyncSession, user_id: int) -> None:
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(email=None, hashed_password=None, verification_token=None, magic_link_token=None)
    )
    await db.commit()
