"""Mood analytics helpers for daily summaries and longitudinal insights."""
from __future__ import annotations

import json
import os
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from backend.models import Mood

REPORTS_DIR = Path(os.getenv("ANALYTICS_REPORT_DIR", "reports"))
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
REPORT_PATH = REPORTS_DIR / "daily_mood_summary.jsonl"


async def compute_daily_mood_summary(
    session_factory: async_sessionmaker | AsyncSession, window_hours: int = 24
) -> dict[str, Any]:
    """Aggregate mood entries for the past window into a compact summary."""

    since = datetime.now(timezone.utc) - timedelta(hours=window_hours)

    # Support either a session factory or an existing session
    session_ctx = session_factory if isinstance(session_factory, AsyncSession) else session_factory()

    async with session_ctx as session:  # type: ignore[assignment]
        result = await session.execute(
            select(Mood).where(Mood.deleted_at.is_(None), Mood.at >= since)
        )
        moods = list(result.scalars().all())

        tag_counter: Counter[str] = Counter()
        scores = []
        for mood in moods:
            scores.append(mood.score)
            if mood.tags:
                for tag in mood.tags.keys():
                    tag_counter[tag] += 1

        summary = {
            "since": since.isoformat(),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "count": len(moods),
            "average_score": round(sum(scores) / len(scores), 2) if scores else None,
            "min_score": min(scores) if scores else None,
            "max_score": max(scores) if scores else None,
            "top_tags": tag_counter.most_common(5),
        }

        return summary


async def persist_summary_report(summary: dict[str, Any]) -> None:
    """Append the summary to a JSONL report for offline review."""

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with REPORT_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(summary) + "\n")
