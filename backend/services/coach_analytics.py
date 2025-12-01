"""Aggregations used by the coach/admin analytics dashboard."""
from __future__ import annotations

import datetime
from typing import Any, Dict, List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import JournalEntry, Mood, User


class CoachAnalyticsService:
    async def overview(self, session: AsyncSession) -> Dict[str, Any]:
        total_users_stmt = select(func.count(User.id))
        total_entries_stmt = select(func.count(JournalEntry.id))
        total_moods_stmt = select(func.count(Mood.id))

        total_users = await session.scalar(total_users_stmt)
        total_entries = await session.scalar(total_entries_stmt)
        total_moods = await session.scalar(total_moods_stmt)

        latest_entry_stmt = (
            select(JournalEntry.created_at)
            .order_by(JournalEntry.created_at.desc())
            .limit(1)
        )
        last_entry = await session.scalar(latest_entry_stmt)

        return {
            "users": total_users or 0,
            "journal_entries": total_entries or 0,
            "mood_check_ins": total_moods or 0,
            "last_journal_entry_at": last_entry,
        }

    async def mood_trend(self, session: AsyncSession, days: int = 7) -> List[Dict[str, Any]]:
        window_start = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        stmt = (
            select(
                func.date(Mood.at).label("day"),
                func.avg(Mood.score).label("avg_score"),
                func.count(Mood.id).label("count"),
            )
            .where(Mood.at >= window_start)
            .group_by("day")
            .order_by("day")
        )
        result = await session.execute(stmt)
        return [
            {
                "day": row.day.isoformat() if hasattr(row.day, "isoformat") else str(row.day),
                "average": float(row.avg_score) if row.avg_score is not None else None,
                "count": row.count,
            }
            for row in result.all()
        ]

    async def engagement(self, session: AsyncSession) -> Dict[str, Any]:
        recent_entries_stmt = (
            select(User.id, func.count(JournalEntry.id).label("entries"))
            .join(JournalEntry, JournalEntry.user_id == User.id)
            .group_by(User.id)
            .order_by(func.count(JournalEntry.id).desc())
            .limit(5)
        )
        result = await session.execute(recent_entries_stmt)
        top_authors = [
            {"user_id": row.id, "entries": row.entries}
            for row in result.all()
        ]

        return {"top_authors": top_authors}
