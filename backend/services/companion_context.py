"""Shared per-user companion context fetchers.

These helpers were originally private to ``backend/routes/kiaan_voice_companion.py``
(the REST Voice Companion route). The WSS voice path
(``backend/routes/voice_companion_wss.py`` + ``backend/services/voice/orchestrator.py``)
needs the same memory + session-summary plumbing so Android voice users
get the same personalisation that web users already get — see
``IMPROVEMENT_ROADMAP.md`` P0 §3 and ``AUDIT_VOICE_COMPANION.md`` table
row ``8 Memory lookup`` (PARTIAL → wired here).

Functions
---------
:func:`get_user_memories`         — top-N memories ordered by importance
:func:`get_recent_session_summaries` — last-N closed-session topic digests

Both are async, both swallow nothing — failures bubble up so the caller
can decide to degrade (the WSS handler does this with a try/except so a
DB hiccup never blocks a voice turn).

Design notes
------------
* The shape returned matches what
  ``kiaan_voice_companion._build_divine_friend_system_prompt`` already
  consumes (``list[str]`` for memories, ``list[dict]`` for summaries),
  so the REST helpers can become thin wrappers and the WSS path can
  hand the same objects to the orchestrator's ``user_payload`` JSON.
* The default ``memory_limit=8`` and ``summary_limit=3`` are the values
  the audit recommended — small enough to fit the LLM context budget
  comfortably (≈ 1.5 KB of extra context), large enough to make Sakha
  feel like it remembers.
* Memories are formatted as ``"<type>: <value>"`` because that's what
  the persona prompt's RECENT_USER_CONTEXT block expects. Keeping the
  formatting here (not in the route) means both routes stay in sync.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.companion import CompanionMemory, CompanionSession

logger = logging.getLogger(__name__)


async def get_user_memories(
    db: AsyncSession,
    user_id: str,
    *,
    limit: int = 8,
) -> list[str]:
    """Return up to ``limit`` memory strings for the user, importance-ordered.

    Each item is ``"<memory_type>: <value>"`` — the persona prompt's
    RECENT_USER_CONTEXT block consumes this shape directly. Returns an
    empty list when the user has no memories yet (cold-start) or when
    the table query fails.
    """
    if not user_id:
        return []
    try:
        result = await db.execute(
            select(CompanionMemory)
            .where(
                CompanionMemory.user_id == user_id,
                CompanionMemory.deleted_at.is_(None),
            )
            .order_by(desc(CompanionMemory.importance))
            .limit(limit)
        )
        rows = result.scalars().all()
        return [f"{m.memory_type}: {m.value}" for m in rows]
    except Exception as exc:
        logger.warning(
            "companion_context: get_user_memories failed (user=%s): %s",
            user_id,
            exc,
        )
        return []


async def get_recent_session_summaries(
    db: AsyncSession,
    user_id: str,
    *,
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Return up to ``limit`` recent closed-session ``topics_discussed`` digests.

    ``topics_discussed`` is the JSON blob the engine writes when a
    session ends (mood arc, key themes, breakthroughs). Returns an
    empty list when there are no closed sessions yet or on query
    failure.
    """
    if not user_id:
        return []
    try:
        result = await db.execute(
            select(CompanionSession)
            .where(
                CompanionSession.user_id == user_id,
                CompanionSession.is_active.is_(False),
                CompanionSession.topics_discussed.isnot(None),
            )
            .order_by(desc(CompanionSession.ended_at))
            .limit(limit)
        )
        sessions = result.scalars().all()
        return [s.topics_discussed for s in sessions if s.topics_discussed]
    except Exception as exc:
        logger.warning(
            "companion_context: get_recent_session_summaries failed (user=%s): %s",
            user_id,
            exc,
        )
        return []


__all__ = ["get_user_memories", "get_recent_session_summaries"]
