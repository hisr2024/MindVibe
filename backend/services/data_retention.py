"""Data retention and user data compliance helpers."""
from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from backend.core.settings import settings
from backend.models import JournalEntry, User, UserProfile
from backend.security.encryption import EncryptionManager

logger = logging.getLogger("mindvibe.data_retention")


async def apply_retention_policies(session_factory: async_sessionmaker) -> None:
    """Soft-delete data older than the configured retention window."""

    if not settings.DATA_RETENTION_ENABLED:
        logger.info("data_retention_disabled")
        return

    cutoff = datetime.now(UTC) - timedelta(days=settings.DATA_RETENTION_DAYS)
    async with session_factory() as session:
        await _expire_old_journals(session, cutoff)
        await _expire_old_profiles(session, cutoff)
        await session.commit()


async def _expire_old_journals(session: AsyncSession, cutoff: datetime) -> None:
    stmt = (
        update(JournalEntry)
        .where(JournalEntry.deleted_at.is_(None), JournalEntry.created_at < cutoff)
        .values(deleted_at=datetime.now(UTC))
    )
    result = await session.execute(stmt)
    if result.rowcount:
        logger.warning("journal_entries_expired", extra={"count": result.rowcount})


async def _expire_old_profiles(session: AsyncSession, cutoff: datetime) -> None:
    stmt = (
        update(UserProfile)
        .where(UserProfile.deleted_at.is_(None), UserProfile.created_at < cutoff)
        .values(deleted_at=datetime.now(UTC))
    )
    result = await session.execute(stmt)
    if result.rowcount:
        logger.warning("user_profiles_expired", extra={"count": result.rowcount})


async def export_user_bundle(user_id: str, session: AsyncSession) -> dict:
    """Return decrypted user bundle for export."""

    manager = EncryptionManager()
    stmt = select(JournalEntry).where(
        JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None)
    )
    entries = (await session.execute(stmt)).scalars().all()
    journal_payload = [
        {
            "entry_uuid": entry.entry_uuid,
            "title": manager.decrypt(entry.title_ciphertext),
            "content": manager.decrypt(entry.content_ciphertext),
            "created_at": entry.created_at.isoformat(),
            "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
            "tags": entry.tags,
            "attachments": entry.attachments,
            "mood_score": entry.mood_score,
        }
        for entry in entries
    ]

    profile_stmt = select(UserProfile).where(UserProfile.user_id == user_id)
    profile = (await session.execute(profile_stmt)).scalars().first()

    return {
        "user_id": user_id,
        "generated_at": datetime.now(UTC).isoformat(),
        "profile": {
            "full_name": profile.full_name if profile else None,
            "base_experience": profile.base_experience if profile else None,
            "updated_at": profile.updated_at.isoformat() if profile and profile.updated_at else None,
        },
        "journal_entries": journal_payload,
    }


async def delete_user_bundle(user_id: str, session: AsyncSession) -> dict:
    """Soft-delete user and related data for privacy compliance."""

    profile_stmt = (
        update(UserProfile)
        .where(UserProfile.user_id == user_id, UserProfile.deleted_at.is_(None))
        .values(deleted_at=datetime.now(UTC))
    )
    profile_result = await session.execute(profile_stmt)

    journal_stmt = (
        update(JournalEntry)
        .where(JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None))
        .values(deleted_at=datetime.now(UTC))
    )
    journal_result = await session.execute(journal_stmt)

    user_stmt = (
        update(User)
        .where(User.id == user_id, User.deleted_at.is_(None))
        .values(deleted_at=datetime.now(UTC))
    )
    user_result = await session.execute(user_stmt)

    await session.commit()

    return {
        "profile_deleted": int(profile_result.rowcount or 0),
        "journal_entries_deleted": int(journal_result.rowcount or 0),
        "user_marked_deleted": int(user_result.rowcount or 0),
    }


__all__ = [
    "apply_retention_policies",
    "export_user_bundle",
    "delete_user_bundle",
]
