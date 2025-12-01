"""Lightweight recommendation engine for personalized wisdom suggestions."""
from __future__ import annotations

import statistics
from collections import Counter
from dataclasses import dataclass
from typing import Iterable, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import JournalEntry, Mood, WisdomVerse


@dataclass
class Recommendation:
    title: str
    rationale: str
    payload: dict


class RecommendationEngine:
    """Derive simple recommendations from journal and mood patterns."""

    def __init__(self, recent_limit: int = 20) -> None:
        self.recent_limit = recent_limit

    async def _fetch_recent_moods(self, session: AsyncSession, user_id: str) -> list[Mood]:
        result = await session.execute(
            select(Mood)
            .where(Mood.user_id == user_id)
            .order_by(Mood.at.desc())
            .limit(self.recent_limit)
        )
        return list(result.scalars().all())

    async def _fetch_recent_journals(
        self, session: AsyncSession, user_id: str
    ) -> list[JournalEntry]:
        result = await session.execute(
            select(JournalEntry)
            .where(JournalEntry.user_id == user_id)
            .order_by(JournalEntry.created_at.desc())
            .limit(self.recent_limit)
        )
        return list(result.scalars().all())

    async def _fetch_relevant_wisdom(
        self, session: AsyncSession, themes: Sequence[str]
    ) -> list[WisdomVerse]:
        if not themes:
            return []
        result = await session.execute(
            select(WisdomVerse)
            .where(WisdomVerse.theme.in_(themes))
            .limit(5)
        )
        return list(result.scalars().all())

    def _top_tags(self, entries: Iterable[JournalEntry]) -> list[str]:
        tag_counter: Counter[str] = Counter()
        for entry in entries:
            if entry.tags:
                tag_counter.update(tag.lower() for tag in entry.tags)
        return [tag for tag, _count in tag_counter.most_common(3)]

    def _average_mood(self, moods: Iterable[Mood]) -> float | None:
        scores = [m.score for m in moods if m.score is not None]
        if not scores:
            return None
        return statistics.fmean(scores)

    async def recommend(
        self, session: AsyncSession, user_id: str, context: str | None = None
    ) -> list[Recommendation]:
        moods = await self._fetch_recent_moods(session, user_id)
        journals = await self._fetch_recent_journals(session, user_id)

        mood_average = self._average_mood(moods)
        top_tags = self._top_tags(journals)
        themes = top_tags or ["resilience", "focus"]
        verses = await self._fetch_relevant_wisdom(session, themes)

        recommendations: list[Recommendation] = []

        if mood_average is not None:
            mood_summary = "up" if mood_average >= 7 else "steady" if mood_average >= 4 else "down"
            recommendations.append(
                Recommendation(
                    title="Mood trajectory",
                    rationale=(
                        f"Recent average mood is {mood_average:.1f} ({mood_summary}). "
                        "We will keep nudging toward balance with gentle prompts."
                    ),
                    payload={"average_mood": mood_average, "trend": mood_summary},
                )
            )

        if top_tags:
            recommendations.append(
                Recommendation(
                    title="Journal focus",
                    rationale=f"You have been writing about {', '.join(top_tags)}. "
                    "We will surface coping strategies that reinforce these themes.",
                    payload={"top_tags": top_tags},
                )
            )

        if verses:
            recommendations.append(
                Recommendation(
                    title="Wisdom picks",
                    rationale="Curated verses aligned to your recent themes for mindful reflection.",
                    payload={
                        "verses": [
                            {
                                "id": verse.verse_id,
                                "theme": verse.theme,
                                "english": verse.english[:240],
                            }
                            for verse in verses
                        ]
                    },
                )
            )

        if context:
            recommendations.append(
                Recommendation(
                    title="Context-aware guidance",
                    rationale="Considering your current intent, we will adapt journaling prompts accordingly.",
                    payload={"context": context},
                )
            )

        if not recommendations:
            recommendations.append(
                Recommendation(
                    title="Welcome aboard",
                    rationale="Start journaling and mood check-ins to unlock personalized recommendations.",
                    payload={"next_actions": ["add_mood", "create_journal"]},
                )
            )

        return recommendations
