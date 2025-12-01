"""Semantic insights pipeline for wisdom verses and mood entries."""
from __future__ import annotations

from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import Mood, WisdomVerse
from backend.services.vector_store import VectorStore, VectorDocument


class SemanticInsightsService:
    def __init__(self) -> None:
        self.store = VectorStore()

    async def bootstrap(self, session: AsyncSession, user_id: str | None = None) -> None:
        await self._index_wisdom(session)
        if user_id is not None:
            await self._index_recent_moods(session, user_id)

    async def _index_wisdom(self, session: AsyncSession) -> None:
        result = await session.execute(select(WisdomVerse).where(WisdomVerse.deleted_at.is_(None)))
        verses = result.scalars().all()
        for verse in verses:
            content = f"{verse.english}\n{verse.context}"
            self.store.add(
                f"wisdom-{verse.verse_id}",
                content,
                metadata={
                    "verse_id": verse.verse_id,
                    "theme": verse.theme,
                    "primary_domain": verse.primary_domain,
                },
            )

    async def _index_recent_moods(self, session: AsyncSession, user_id: str) -> None:
        result = await session.execute(
            select(Mood)
            .where(Mood.user_id == user_id, Mood.deleted_at.is_(None))
            .order_by(Mood.at.desc())
            .limit(50)
        )
        moods = result.scalars().all()
        for mood in moods:
            text = mood.note or ""
            tags = ",".join(mood.tags.keys()) if mood.tags else ""
            payload = f"mood score {mood.score} {tags} {text}"
            self.store.add(
                f"mood-{mood.id}",
                payload,
                metadata={"score": mood.score, "tags": mood.tags},
            )

    def semantic_wisdom(self, query: str, top_k: int = 5) -> List[dict]:
        return self.store.search(query, k=top_k)

    def mood_context(self, query: str, top_k: int = 3) -> List[dict]:
        return self.store.search(query, k=top_k)
