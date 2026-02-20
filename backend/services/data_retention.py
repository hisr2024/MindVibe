"""Data retention service for KIAAN chat messages.

Implements automatic purging of soft-deleted chat data and expiration of
old conversations based on configurable retention windows.

Policy:
- Soft-deleted messages are permanently purged after CHAT_RETENTION_DAYS (default: 90).
- Active (non-deleted) messages are preserved unless the user explicitly requests deletion.
- Purge runs as a periodic background task (called from startup or scheduler).

This satisfies GDPR Article 17 (Right to Erasure) requirements — soft-deleted
data does not persist indefinitely.
"""

import datetime
import logging
import os

from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def purge_expired_chat_messages(db: AsyncSession) -> dict:
    """Permanently delete soft-deleted chat messages older than the retention window.

    Args:
        db: Async database session.

    Returns:
        Dict with count of purged messages and sessions.
    """
    retention_days = int(os.getenv("CHAT_RETENTION_DAYS", "90"))
    cutoff = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=retention_days)

    purged_messages = 0
    purged_sessions = 0

    try:
        # Import here to avoid circular imports
        from backend.models.ai import KiaanChatMessage, KiaanChatSession

        # Purge soft-deleted messages older than retention window
        stmt = (
            delete(KiaanChatMessage)
            .where(KiaanChatMessage.deleted_at.isnot(None))
            .where(KiaanChatMessage.deleted_at < cutoff)
        )
        result = await db.execute(stmt)
        purged_messages = result.rowcount

        # Purge orphaned sessions with no remaining messages
        orphan_subquery = (
            select(KiaanChatSession.id)
            .outerjoin(
                KiaanChatMessage,
                KiaanChatSession.id == KiaanChatMessage.session_id
            )
            .where(KiaanChatMessage.id.is_(None))
            .where(KiaanChatSession.started_at < cutoff)
        )
        orphan_ids = (await db.execute(orphan_subquery)).scalars().all()

        if orphan_ids:
            await db.execute(
                delete(KiaanChatSession).where(KiaanChatSession.id.in_(orphan_ids))
            )
            purged_sessions = len(orphan_ids)

        await db.commit()

        if purged_messages or purged_sessions:
            logger.info(
                f"Data retention: purged {purged_messages} messages and "
                f"{purged_sessions} orphaned sessions (retention={retention_days}d)"
            )

    except Exception as e:
        logger.error(f"Data retention purge failed: {e}")
        await db.rollback()

    return {
        "purged_messages": purged_messages,
        "purged_sessions": purged_sessions,
        "retention_days": retention_days,
        "cutoff": cutoff.isoformat(),
    }


async def get_retention_stats(db: AsyncSession) -> dict:
    """Get statistics about data eligible for purging.

    Returns:
        Dict with counts of soft-deleted and total messages.
    """
    try:
        from backend.models.ai import KiaanChatMessage

        total_result = await db.execute(
            select(func.count(KiaanChatMessage.id))
        )
        total = total_result.scalar() or 0

        deleted_result = await db.execute(
            select(func.count(KiaanChatMessage.id))
            .where(KiaanChatMessage.deleted_at.isnot(None))
        )
        soft_deleted = deleted_result.scalar() or 0

        retention_days = int(os.getenv("CHAT_RETENTION_DAYS", "90"))
        cutoff = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=retention_days)

        eligible_result = await db.execute(
            select(func.count(KiaanChatMessage.id))
            .where(KiaanChatMessage.deleted_at.isnot(None))
            .where(KiaanChatMessage.deleted_at < cutoff)
        )
        eligible_for_purge = eligible_result.scalar() or 0

        return {
            "total_messages": total,
            "soft_deleted": soft_deleted,
            "eligible_for_purge": eligible_for_purge,
            "retention_days": retention_days,
        }

    except Exception as e:
        logger.error(f"Failed to get retention stats: {e}")
        return {"error": str(e)}
