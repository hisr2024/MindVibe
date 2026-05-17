"""Tests for the Wisdom-Core-gated streaming entry point.

Covers ``IMPROVEMENT_ROADMAP.md`` P1 §5 — the SSE chat surface
``POST /api/kiaan/chat/stream`` and its underlying function
:func:`backend.services.kiaan_grounded_ai.call_kiaan_ai_grounded_stream`.

Buckets:

* Wire protocol: events arrive in the order
  ``verses → token* → done``.
* Filter integration: PASS sentences emit tokens; FAIL truncates and
  carries a ``failure_reason`` on the ``done`` event.
* Cache integration: a cache HIT short-circuits compose + LLM and
  emits the same protocol shape so the client never has to special
  case it.
* Bypass conditions: empty message rejected; provider errors surface
  with the same exception hierarchy as the unary path.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.kiaan_grounded_ai import (
    GroundedResponse,
    GroundedStreamEvent,
    call_kiaan_ai_grounded_stream,
)
from backend.services.kiaan_response_cache import KiaanResponseCache

# ─── helpers ──────────────────────────────────────────────────────────


@dataclass
class _FakeFilterResult:
    verdict: Any
    completed_sentences: list[str]
    buffer_remaining: str = ""
    cumulative_score: float = 0.5
    failure_reason: str | None = None
    fallback_tier: str | None = None


def _patch_compose(prompt: str, verses: list[dict[str, Any]]) -> Any:
    return patch(
        "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
        new=AsyncMock(return_value=(prompt, verses)),
    )


async def _async_iter(values: list[str]):
    for v in values:
        yield v


def _patch_stream(deltas: list[str]) -> Any:
    """Patch ``call_kiaan_ai_stream`` to yield the given deltas."""
    async def _fake_stream(**_: Any):
        for d in deltas:
            yield d
    return patch(
        "backend.services.kiaan_grounded_ai.call_kiaan_ai_stream",
        new=_fake_stream,
    )


@pytest.fixture(autouse=True)
def _force_memory_cache() -> Any:
    """Force the cache singleton into memory mode for deterministic tests."""
    with patch.object(
        KiaanResponseCache,
        "_redis_client",
        new=AsyncMock(return_value=None),
    ):
        yield


# ─── basic protocol ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_stream_rejects_empty_message() -> None:
    with pytest.raises(ValueError):
        async for _ in call_kiaan_ai_grounded_stream(message="   "):
            pass


@pytest.mark.asyncio
async def test_stream_emits_verses_then_tokens_then_done() -> None:
    """Happy path: events arrive in the documented order."""
    from backend.services.gita_wisdom_filter import (
        StreamingFilterVerdict,
        StreamingGitaFilter,
    )

    fake_filter = MagicMock(spec=StreamingGitaFilter)
    fake_filter.is_failed = False
    fake_filter.cumulative_score = 0.85
    # First feed: returns one PASS sentence.
    # Second feed: returns one more PASS sentence.
    # Third feed: nothing yet.
    fake_filter.feed = MagicMock(side_effect=[
        _FakeFilterResult(
            verdict=StreamingFilterVerdict.PASS,
            completed_sentences=["Karma yoga teaches selfless action."],
        ),
        _FakeFilterResult(
            verdict=StreamingFilterVerdict.PASS,
            completed_sentences=["Equanimity steadies the mind."],
        ),
        _FakeFilterResult(
            verdict=StreamingFilterVerdict.HOLD,
            completed_sentences=[],
        ),
    ])
    fake_filter.finalize = MagicMock(return_value=_FakeFilterResult(
        verdict=StreamingFilterVerdict.PASS,
        completed_sentences=[],
    ))

    verses = [{"verse_ref": "2.47", "chapter": 2, "verse": 47}]

    with (
        _patch_compose("PROMPT", verses),
        _patch_stream(["delta A.", " delta B.", " trailing"]),
        patch(
            "backend.services.gita_wisdom_filter.StreamingGitaFilter",
            return_value=fake_filter,
        ),
    ):
        events: list[GroundedStreamEvent] = []
        async for ev in call_kiaan_ai_grounded_stream(
            message="I am anxious",
            db=MagicMock(),
            user_id="user-1",
            tool_name="Ardha",
        ):
            events.append(ev)

    kinds = [e.kind for e in events]
    # Protocol: verses first, tokens in the middle, done last.
    assert kinds[0] == "verses"
    assert kinds[-1] == "done"
    assert "token" in kinds
    # First event carries the verses we composed.
    assert events[0].data == verses
    # Token events carry strings ending with a space (sentence boundary marker).
    token_events = [e for e in events if e.kind == "token"]
    assert all(isinstance(e.data, str) and e.data.endswith(" ") for e in token_events)
    # Final event reports successful, non-cached completion.
    done = events[-1].data
    assert done["is_gita_grounded"] is True
    assert done["cache_hit"] is False
    assert done["filter_applied"] is True
    assert done["failure_reason"] is None


@pytest.mark.asyncio
async def test_stream_fail_truncates_and_reports_reason() -> None:
    """A mid-stream FAIL closes the loop and carries failure metadata."""
    from backend.services.gita_wisdom_filter import (
        StreamingFilterVerdict,
        StreamingGitaFilter,
    )

    fake_filter = MagicMock(spec=StreamingGitaFilter)
    fake_filter.is_failed = True
    fake_filter.cumulative_score = 0.02
    fake_filter.feed = MagicMock(return_value=_FakeFilterResult(
        verdict=StreamingFilterVerdict.FAIL,
        completed_sentences=[],
        failure_reason="non_canonical_citation",
        fallback_tier="verse_only",
    ))
    fake_filter.finalize = MagicMock(return_value=_FakeFilterResult(
        verdict=StreamingFilterVerdict.FAIL,
        completed_sentences=[],
    ))

    with (
        _patch_compose("PROMPT", []),
        _patch_stream(["bad delta"]),
        patch(
            "backend.services.gita_wisdom_filter.StreamingGitaFilter",
            return_value=fake_filter,
        ),
    ):
        events = [
            ev
            async for ev in call_kiaan_ai_grounded_stream(
                message="hi",
                db=MagicMock(),
                user_id="u",
            )
        ]

    kinds = [e.kind for e in events]
    # No token events emitted on FAIL.
    assert "token" not in kinds
    done = events[-1].data
    assert done["is_gita_grounded"] is False
    assert done["failure_reason"] == "non_canonical_citation"
    assert done["fallback_tier"] == "verse_only"


# ─── cache integration ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_stream_serves_cache_hit_in_protocol_shape(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Cache HIT short-circuits compose + LLM and emits the same wire shape."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")

    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton",
        fresh,
        raising=False,
    )

    cached_response = GroundedResponse(
        text="cached wisdom about anxiety",
        verses=[{"verse_ref": "2.47", "chapter": 2, "verse": 47}],
        is_gita_grounded=True,
        wisdom_score=0.91,
        enhancement_applied=False,
        filter_applied=True,
    )
    await fresh.set(
        user_id="user-1",
        tool_name="Ardha",
        message="I am anxious",
        response=cached_response,
    )

    # If the cache HIT short-circuits correctly, neither compose nor
    # the LLM stream should be touched.
    compose_mock = AsyncMock(side_effect=AssertionError("compose must not run on cache hit"))
    async def _llm_must_not_run(**_: Any):
        raise AssertionError("LLM must not run on cache hit")
        yield  # pragma: no cover

    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=compose_mock,
        ),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai_stream",
            new=_llm_must_not_run,
        ),
    ):
        events = [
            ev
            async for ev in call_kiaan_ai_grounded_stream(
                message="I am anxious",
                db=MagicMock(),
                user_id="user-1",
                tool_name="Ardha",
            )
        ]

    kinds = [e.kind for e in events]
    assert kinds == ["verses", "token", "done"]
    assert events[0].data == cached_response.verses
    assert events[1].data == cached_response.text
    done = events[2].data
    assert done["cache_hit"] is True
    assert done["wisdom_score"] == 0.91


@pytest.mark.asyncio
async def test_stream_skips_cache_when_user_id_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No user_id → cache is bypassed (read AND write)."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")

    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton",
        fresh,
        raising=False,
    )
    # Pre-populate the cache under an "anonymous" key shouldn't matter — the
    # cache simply never gets queried when user_id is None.
    cache_get = AsyncMock(side_effect=AssertionError("cache must not be queried"))
    with (
        _patch_compose("PROMPT", []),
        _patch_stream([]),
        patch.object(KiaanResponseCache, "get", new=cache_get),
    ):
        events = [
            ev
            async for ev in call_kiaan_ai_grounded_stream(
                message="hi",
                db=MagicMock(),
                user_id=None,
            )
        ]
    # cache.get was not awaited (the assertion would have fired); the
    # stream still emits the protocol envelope.
    assert events[0].kind == "verses"
    assert events[-1].kind == "done"
    assert events[-1].data["cache_hit"] is False


# ─── bypass conditions ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_stream_skips_compose_when_system_override_provided(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A bespoke ``system_override`` short-circuits Wisdom Core compose."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "false")

    compose_mock = AsyncMock(side_effect=AssertionError("compose must not run"))
    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=compose_mock,
        ),
        _patch_stream([]),
    ):
        events = [
            ev
            async for ev in call_kiaan_ai_grounded_stream(
                message="hi",
                db=MagicMock(),
                user_id="u",
                system_override="MY_PROMPT",
            )
        ]
    assert events[0].kind == "verses"
    assert events[0].data == []  # no compose → no verses


@pytest.mark.asyncio
async def test_stream_emits_done_even_when_provider_yields_nothing() -> None:
    """Empty stream still completes with a done event (no hang)."""
    with _patch_compose("PROMPT", []), _patch_stream([]):
        events = [
            ev
            async for ev in call_kiaan_ai_grounded_stream(
                message="hello",
                db=MagicMock(),
                user_id="u",
            )
        ]
    # verses + done, no token events.
    assert [e.kind for e in events] == ["verses", "done"]


# ─── streaming-aware AI provider plumbing ─────────────────────────────


@pytest.mark.asyncio
async def test_provider_stream_rejects_empty_message() -> None:
    from backend.services.ai_provider import call_kiaan_ai_stream

    with pytest.raises(ValueError):
        async for _ in call_kiaan_ai_stream(message=""):
            pass
