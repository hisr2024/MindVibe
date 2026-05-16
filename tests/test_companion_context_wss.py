"""Tests for the shared companion-context helpers and their wiring into
the WSS voice path.

Covers ``IMPROVEMENT_ROADMAP.md`` P0 §3 — the WSS voice turn must look
up the user's long-term memory + recent session summaries and surface
them to the LLM via the ``VoiceTurnContext`` and orchestrator
``user_payload``, closing the personalisation gap that
``AUDIT_VOICE_COMPANION.md`` flagged on the Android voice surface.

Unit tests:
* :func:`get_user_memories` returns formatted strings, respects the
  ``limit``, handles empty / no-user / DB-error gracefully.
* :func:`get_recent_session_summaries` returns list-of-dict, handles
  empty / DB-error gracefully.

Integration tests:
* ``VoiceTurnContext`` carries the new ``memories`` and
  ``session_summaries`` fields.
* The orchestrator includes both in the LLM ``user_payload`` JSON so
  the persona prompt can render them.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.services.companion_context import (
    get_recent_session_summaries,
    get_user_memories,
)
from backend.services.voice.orchestrator_types import VoiceTurnContext

# ─── helpers ──────────────────────────────────────────────────────────


def _fake_memory(memory_type: str, value: str) -> Any:
    m = MagicMock()
    m.memory_type = memory_type
    m.value = value
    return m


def _fake_session(topics: dict[str, Any] | None) -> Any:
    s = MagicMock()
    s.topics_discussed = topics
    return s


def _scalars_returning(rows: list[Any]) -> Any:
    """Mock the chain ``db.execute(...).scalars().all()`` to yield rows."""
    scalars = MagicMock()
    scalars.all = MagicMock(return_value=rows)
    result = MagicMock()
    result.scalars = MagicMock(return_value=scalars)
    return result


# ─── get_user_memories ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_user_memories_formats_as_type_colon_value() -> None:
    db = MagicMock()
    db.execute = AsyncMock(
        return_value=_scalars_returning(
            [
                _fake_memory("preference", "prefers tough love"),
                _fake_memory("life", "has two kids"),
            ]
        )
    )
    result = await get_user_memories(db, "user-1", limit=8)
    assert result == [
        "preference: prefers tough love",
        "life: has two kids",
    ]


@pytest.mark.asyncio
async def test_get_user_memories_returns_empty_for_no_user_id() -> None:
    db = MagicMock()
    # ``db.execute`` must never be called when user_id is empty.
    db.execute = AsyncMock(side_effect=AssertionError("should not query"))
    assert await get_user_memories(db, "") == []
    assert await get_user_memories(db, None) == []  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_get_user_memories_degrades_on_db_error() -> None:
    db = MagicMock()
    db.execute = AsyncMock(side_effect=RuntimeError("connection lost"))
    # Must not raise — voice turns can never be blocked by a memory hiccup.
    result = await get_user_memories(db, "user-1")
    assert result == []


@pytest.mark.asyncio
async def test_get_user_memories_empty_when_no_rows() -> None:
    db = MagicMock()
    db.execute = AsyncMock(return_value=_scalars_returning([]))
    assert await get_user_memories(db, "user-1") == []


# ─── get_recent_session_summaries ─────────────────────────────────────


@pytest.mark.asyncio
async def test_get_recent_session_summaries_returns_topics_dicts() -> None:
    db = MagicMock()
    topics_a = {"mood_arc": "anxious -> calm", "themes": ["work", "rest"]}
    topics_b = {"mood_arc": "sad -> peaceful", "themes": ["loss"]}
    db.execute = AsyncMock(
        return_value=_scalars_returning(
            [_fake_session(topics_a), _fake_session(topics_b)]
        )
    )
    result = await get_recent_session_summaries(db, "user-1", limit=3)
    assert result == [topics_a, topics_b]


@pytest.mark.asyncio
async def test_get_recent_session_summaries_skips_none_topics() -> None:
    """Sessions with ``topics_discussed=None`` must be filtered out."""
    db = MagicMock()
    db.execute = AsyncMock(
        return_value=_scalars_returning(
            [
                _fake_session({"mood_arc": "x"}),
                _fake_session(None),
                _fake_session({"mood_arc": "y"}),
            ]
        )
    )
    result = await get_recent_session_summaries(db, "user-1")
    assert result == [{"mood_arc": "x"}, {"mood_arc": "y"}]


@pytest.mark.asyncio
async def test_get_recent_session_summaries_empty_for_no_user() -> None:
    db = MagicMock()
    db.execute = AsyncMock(side_effect=AssertionError("should not query"))
    assert await get_recent_session_summaries(db, "") == []


@pytest.mark.asyncio
async def test_get_recent_session_summaries_degrades_on_db_error() -> None:
    db = MagicMock()
    db.execute = AsyncMock(side_effect=RuntimeError("connection lost"))
    assert await get_recent_session_summaries(db, "user-1") == []


# ─── VoiceTurnContext shape ───────────────────────────────────────────


def test_voice_turn_context_carries_memories_and_summaries() -> None:
    ctx = VoiceTurnContext(
        session_id="s",
        user_id="u",
        conversation_id="c",
        user_latest="hello",
        memories=["preference: short answers", "life: works as a nurse"],
        session_summaries=[{"mood_arc": "calm"}],
    )
    assert ctx.memories == [
        "preference: short answers",
        "life: works as a nurse",
    ]
    assert ctx.session_summaries == [{"mood_arc": "calm"}]


def test_voice_turn_context_defaults_to_empty_lists() -> None:
    """Cold-start users get empty lists, not None — keeps consumers branch-free."""
    ctx = VoiceTurnContext(
        session_id="s",
        user_id="u",
        conversation_id="c",
        user_latest="hello",
    )
    assert ctx.memories == []
    assert ctx.session_summaries == []


# ─── Orchestrator user_payload includes memories + summaries ──────────


@pytest.mark.asyncio
async def test_orchestrator_payload_contains_memories_and_summaries() -> None:
    """The LLM ``user_payload`` JSON must carry memories + summaries.

    This is the integration point: the persona prompt only sees what the
    orchestrator puts into the JSON dispatched to ``provider.stream``.
    """
    from backend.services.voice.orchestrator import VoiceCompanionOrchestrator
    from backend.services.voice.retrieval_and_fallback import RetrievedVerse

    captured_payload: dict[str, Any] = {}

    async def _fake_stream(**kwargs: Any) -> Any:
        # Capture the user_payload_json the orchestrator sent.
        captured_payload["json"] = kwargs.get("user_payload_json", "")
        # Yield nothing — orchestrator will exit the stream loop and
        # we can inspect the captured payload below.
        if False:  # pragma: no cover
            yield None  # type: ignore[unreachable]
        return

    fake_provider = MagicMock()
    fake_provider.stream = _fake_stream

    orchestrator = VoiceCompanionOrchestrator()
    # Replace the LLM router's build_provider so it hands back our fake.
    orchestrator._llm = MagicMock()
    orchestrator._llm.build_provider = MagicMock(
        return_value=(fake_provider, "fake-model")
    )
    # Replace the TTS decision / cache so we go down the "cache miss"
    # branch where the user_payload is actually built.
    orchestrator._tts = MagicMock()
    orchestrator._tts.decide = MagicMock(
        return_value=MagicMock(voice_id="test-voice")
    )
    orchestrator._tts.cache = MagicMock()
    orchestrator._tts.cache.get = MagicMock(return_value=None)  # miss

    # Patch verse retrieval to return one deterministic verse.
    async def _fake_retrieve(**kwargs: Any) -> list[RetrievedVerse]:
        return [
            RetrievedVerse(
                ref="BG 2.47",
                chapter=2,
                verse=47,
                sanskrit="...",
                english="...",
                hindi="...",
                principle="dispassionate action",
                theme="karma",
            )
        ]

    import backend.services.voice.orchestrator as orch_mod

    orig_retrieve = orch_mod.retrieve_verses_for_turn
    orch_mod.retrieve_verses_for_turn = _fake_retrieve  # type: ignore[assignment]
    try:
        memories = ["preference: brief", "history: lost father in 2024"]
        session_summaries = [
            {"mood_arc": "anxious -> calm", "themes": ["grief"]},
            {"mood_arc": "stressed -> peaceful", "themes": ["work"]},
        ]
        ctx = VoiceTurnContext(
            session_id="s",
            user_id="u",
            conversation_id="c",
            user_latest="I am anxious about my interview tomorrow",
            history=[{"role": "user", "content": "earlier turn"}],
            memories=memories,
            session_summaries=session_summaries,
        )
        cancel = asyncio.Event()

        # Drain the orchestrator iterator. The fake stream yields no
        # deltas so the loop exits quickly and we can inspect the
        # captured user_payload.
        async for _ in orchestrator.run_turn(
            ctx,
            system_prompt="SYSTEM",
            db=None,
            cancel_event=cancel,
        ):
            pass
    finally:
        orch_mod.retrieve_verses_for_turn = orig_retrieve  # type: ignore[assignment]

    assert "json" in captured_payload, "orchestrator never called provider.stream"
    payload = json.loads(captured_payload["json"])
    # The two new fields must be present AND carry the data we passed in.
    assert payload["memories"] == memories
    assert payload["session_summaries"] == session_summaries
    # Existing fields must continue to be present — no regressions on the
    # shape the persona prompt already consumes.
    assert payload["user_latest"] == ctx.user_latest
    assert payload["history"] == ctx.history
    assert payload["retrieved_verses"][0]["ref"] == "BG 2.47"


@pytest.mark.asyncio
async def test_orchestrator_payload_empty_lists_for_cold_start() -> None:
    """A user with no memories / no past sessions must still render valid JSON."""
    from backend.services.voice.orchestrator import VoiceCompanionOrchestrator
    from backend.services.voice.retrieval_and_fallback import RetrievedVerse

    captured_payload: dict[str, Any] = {}

    async def _fake_stream(**kwargs: Any) -> Any:
        captured_payload["json"] = kwargs.get("user_payload_json", "")
        if False:  # pragma: no cover
            yield None  # type: ignore[unreachable]
        return

    fake_provider = MagicMock()
    fake_provider.stream = _fake_stream

    orchestrator = VoiceCompanionOrchestrator()
    orchestrator._llm = MagicMock()
    orchestrator._llm.build_provider = MagicMock(
        return_value=(fake_provider, "fake-model")
    )
    orchestrator._tts = MagicMock()
    orchestrator._tts.decide = MagicMock(
        return_value=MagicMock(voice_id="test-voice")
    )
    orchestrator._tts.cache = MagicMock()
    orchestrator._tts.cache.get = MagicMock(return_value=None)

    async def _fake_retrieve(**kwargs: Any) -> list[RetrievedVerse]:
        return []

    import backend.services.voice.orchestrator as orch_mod

    orig_retrieve = orch_mod.retrieve_verses_for_turn
    orch_mod.retrieve_verses_for_turn = _fake_retrieve  # type: ignore[assignment]
    try:
        ctx = VoiceTurnContext(
            session_id="s",
            user_id="cold-start-user",
            conversation_id="c",
            user_latest="hello",
        )
        async for _ in orchestrator.run_turn(
            ctx,
            system_prompt="SYSTEM",
            db=None,
            cancel_event=asyncio.Event(),
        ):
            pass
    finally:
        orch_mod.retrieve_verses_for_turn = orig_retrieve  # type: ignore[assignment]

    payload = json.loads(captured_payload["json"])
    # Cold start: empty lists, not None, not missing.
    assert payload["memories"] == []
    assert payload["session_summaries"] == []
