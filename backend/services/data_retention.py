"""Data retention enforcement utilities."""
from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from backend.models import JournalEntry


@dataclass
class RetentionPolicy:
    days: int
    enabled: bool
    mode: str = "soft_delete"


_RETENTION_DAYS = int(os.getenv("DATA_RETENTION_DAYS", "365"))
_RETENTION_ENABLED = os.getenv("ENABLE_DATA_RETENTION", "true").lower() in {"1", "true", "yes"}
_ENFORCEMENT_INTERVAL_SECONDS = int(os.getenv("DATA_RETENTION_ENFORCE_INTERVAL_SECONDS", "86400"))


def get_retention_policy() -> RetentionPolicy:
    return RetentionPolicy(days=_RETENTION_DAYS, enabled=_RETENTION_ENABLED)


def retention_interval_seconds() -> int:
    return _ENFORCEMENT_INTERVAL_SECONDS


async def enforce_journal_retention(session_factory: async_sessionmaker) -> int:
    """Soft-delete journal entries that exceed the retention window."""

    if not _RETENTION_ENABLED:
        return 0

    cutoff = datetime.now(UTC) - timedelta(days=_RETENTION_DAYS)
    async with session_factory() as session:  # type: AsyncSession
        result = await session.execute(
            update(JournalEntry)
            .where(JournalEntry.created_at < cutoff, JournalEntry.deleted_at.is_(None))
            .values(deleted_at=datetime.now(UTC))
        )
        await session.commit()
    return result.rowcount or 0


__all__ = [
    "RetentionPolicy",
    "get_retention_policy",
    "retention_interval_seconds",
    "enforce_journal_retention",
]
