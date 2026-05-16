"""Tests for the user-scoped response cache and its integration into
the Wisdom-Core-gated AI entry point.

Coverage:

* Cache module unit tests — key normalisation, per-user isolation,
  hits / misses, in-memory eviction, env kill-switch, graceful
  degradation when Redis errors, invalidation.
* End-to-end tests through ``call_kiaan_ai_grounded`` — HIT
  short-circuits both pre-LLM compose and LLM call; cache write
  happens on the happy path only; system_override / apply_filter=False
  / gita_verse / no-user_id all bypass.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.kiaan_grounded_ai import (
    GroundedResponse,
    call_kiaan_ai_grounded,
)
from backend.services.kiaan_response_cache import (
    KiaanResponseCache,
    get_response_cache,
    rehydrate,
)

# ─── helpers ──────────────────────────────────────────────────────────


@dataclass
class _FakeFilterResult:
    content: str
    is_gita_grounded: bool = True
    wisdom_score: float = 0.85
    verses_referenced: list[str] = None  # type: ignore[assignment]
    gita_concepts_found: list[str] = None  # type: ignore[assignment]
    enhancement_applied: bool = False
    filter_metadata: dict[str, Any] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.verses_referenced is None:
            self.verses_referenced = []
        if self.gita_concepts_found is None:
            self.gita_concepts_found = []
        if self.filter_metadata is None:
            self.filter_metadata = {}


def _patch_filter(filter_result: _FakeFilterResult) -> Any:
    fake = MagicMock()
    fake.filter_response = AsyncMock(return_value=filter_result)
    return patch(
        "backend.services.gita_wisdom_filter.get_gita_wisdom_filter",
        return_value=fake,
    )


def _patch_compose(prompt: str, verses: list[dict[str, Any]]) -> Any:
    return patch(
        "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
        new=AsyncMock(return_value=(prompt, verses)),
    )


def _patch_llm(response_text: str) -> Any:
    return patch(
        "backend.services.kiaan_grounded_ai.call_kiaan_ai",
        new=AsyncMock(return_value=response_text),
    )


# Disable Redis lookup so the in-memory tier is exercised deterministically.
@pytest.fixture(autouse=True)
def _force_memory_backend() -> Any:
    with patch.object(
        KiaanResponseCache,
        "_redis_client",
        new=AsyncMock(return_value=None),
    ):
        yield


@pytest.fixture
def fresh_cache() -> KiaanResponseCache:
    """A clean cache instance per test."""
    return KiaanResponseCache()


# ─── unit: normalisation + key ─────────────────────────────────────────


def test_normalize_collapses_case_and_whitespace() -> None:
    n = KiaanResponseCache.normalize_message
    assert n("I feel anxious") == n("i feel anxious")
    assert n("I feel anxious") == n("  I FEEL ANXIOUS  ")
    assert n("I  feel\tanxious") == "i feel anxious"


def test_normalize_handles_unicode_nfkc() -> None:
    n = KiaanResponseCache.normalize_message
    # Ligature "ﬁ" -> "fi" under NFKC.
    assert n("ﬁnd peace") == n("find peace")
    # Full-width digit "①" -> "1".
    assert n("step ①") == n("step 1")


def test_normalize_preserves_punctuation() -> None:
    """Punctuation differences are NOT collapsed — left for the future
    semantic-similarity layer."""
    n = KiaanResponseCache.normalize_message
    assert n("I feel anxious!") != n("I feel anxious")
    assert n("I feel anxious.") != n("I feel anxious")


def test_normalize_empty() -> None:
    assert KiaanResponseCache.normalize_message("") == ""
    assert KiaanResponseCache.normalize_message("   ") == ""


def test_cache_key_changes_with_each_dimension() -> None:
    k = KiaanResponseCache.cache_key
    base = k(user_id="u1", tool_name="Ardha", locale="en", message="hello")
    assert base != k(user_id="u2", tool_name="Ardha", locale="en", message="hello")
    assert base != k(user_id="u1", tool_name="Viyoga", locale="en", message="hello")
    assert base != k(user_id="u1", tool_name="Ardha", locale="hi", message="hello")
    assert base != k(user_id="u1", tool_name="Ardha", locale="en", message="goodbye")


def test_cache_key_is_user_isolated() -> None:
    """User A and user B cannot share a cache entry even on identical text."""
    k = KiaanResponseCache.cache_key
    assert k(
        user_id="alice", tool_name=None, locale="en", message="I feel anxious"
    ) != k(
        user_id="bob", tool_name=None, locale="en", message="I feel anxious"
    )


# ─── unit: get / set / invalidate ─────────────────────────────────────


@pytest.mark.asyncio
async def test_set_then_get_returns_payload(fresh_cache: KiaanResponseCache) -> None:
    response = GroundedResponse(
        text="cached reply",
        verses=[{"verse_ref": "2.47"}],
        wisdom_score=0.9,
    )
    await fresh_cache.set(
        user_id="user-1",
        tool_name="Ardha",
        message="I feel anxious",
        response=response,
    )
    payload = await fresh_cache.get(
        user_id="user-1", tool_name="Ardha", message="I feel anxious"
    )
    assert payload is not None
    assert payload["text"] == "cached reply"
    assert payload["wisdom_score"] == 0.9
    assert payload["verses"] == [{"verse_ref": "2.47"}]


@pytest.mark.asyncio
async def test_get_after_normalisation_hits(fresh_cache: KiaanResponseCache) -> None:
    """Whitespace + case variants must hit the same cache entry."""
    response = GroundedResponse(text="cached reply")
    await fresh_cache.set(
        user_id="u", tool_name=None, message="I feel anxious", response=response
    )
    payload = await fresh_cache.get(
        user_id="u", tool_name=None, message="  i FEEL  anxious "
    )
    assert payload is not None
    assert payload["text"] == "cached reply"


@pytest.mark.asyncio
async def test_user_isolation_is_enforced(fresh_cache: KiaanResponseCache) -> None:
    response = GroundedResponse(text="alice's reply")
    await fresh_cache.set(
        user_id="alice", tool_name=None, message="hi", response=response
    )
    bob_lookup = await fresh_cache.get(user_id="bob", tool_name=None, message="hi")
    assert bob_lookup is None


@pytest.mark.asyncio
async def test_no_user_id_bypasses_cache(fresh_cache: KiaanResponseCache) -> None:
    """user_id=None must produce neither read nor write."""
    response = GroundedResponse(text="x")
    await fresh_cache.set(
        user_id=None, tool_name=None, message="hi", response=response
    )
    assert await fresh_cache.get(user_id=None, tool_name=None, message="hi") is None
    # Memory should be empty — nothing was stored.
    assert fresh_cache.stats()["memory_size"] == 0


@pytest.mark.asyncio
async def test_empty_response_not_cached(fresh_cache: KiaanResponseCache) -> None:
    """Empty / whitespace-only responses must never enter the cache."""
    await fresh_cache.set(
        user_id="u",
        tool_name=None,
        message="hi",
        response=GroundedResponse(text=""),
    )
    await fresh_cache.set(
        user_id="u",
        tool_name=None,
        message="hi",
        response=GroundedResponse(text="   "),
    )
    assert fresh_cache.stats()["memory_size"] == 0


@pytest.mark.asyncio
async def test_targeted_invalidate(fresh_cache: KiaanResponseCache) -> None:
    await fresh_cache.set(
        user_id="u", tool_name=None, message="hi", response=GroundedResponse(text="x")
    )
    removed = await fresh_cache.invalidate(user_id="u", message="hi")
    assert removed == 1
    assert await fresh_cache.get(user_id="u", tool_name=None, message="hi") is None


@pytest.mark.asyncio
async def test_kill_switch_disables_cache(
    fresh_cache: KiaanResponseCache, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "false")
    await fresh_cache.set(
        user_id="u", tool_name=None, message="hi", response=GroundedResponse(text="x")
    )
    # With the kill switch on, set is a no-op AND get returns None.
    assert await fresh_cache.get(user_id="u", tool_name=None, message="hi") is None
    assert fresh_cache.stats()["memory_size"] == 0


@pytest.mark.asyncio
async def test_in_memory_lru_eviction(
    fresh_cache: KiaanResponseCache, monkeypatch: pytest.MonkeyPatch
) -> None:
    """When over capacity the oldest entry is evicted."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_MAX_ENTRIES", "3")
    for i in range(5):
        await fresh_cache.set(
            user_id="u",
            tool_name=None,
            message=f"msg-{i}",
            response=GroundedResponse(text=f"r-{i}"),
        )
    # Oldest two should be gone.
    assert await fresh_cache.get(user_id="u", tool_name=None, message="msg-0") is None
    assert await fresh_cache.get(user_id="u", tool_name=None, message="msg-1") is None
    # Newest three are still there.
    assert await fresh_cache.get(user_id="u", tool_name=None, message="msg-4") is not None


@pytest.mark.asyncio
async def test_rehydrate_round_trip(fresh_cache: KiaanResponseCache) -> None:
    original = GroundedResponse(
        text="rich reply",
        verses=[{"verse_ref": "2.47"}, {"verse_ref": "12.13"}],
        is_gita_grounded=True,
        wisdom_score=0.83,
        enhancement_applied=True,
        filter_applied=True,
    )
    await fresh_cache.set(
        user_id="u", tool_name="Karma Reset", message="how to act", response=original
    )
    payload = await fresh_cache.get(
        user_id="u", tool_name="Karma Reset", message="how to act"
    )
    assert payload is not None
    rebuilt = rehydrate(payload)
    assert rebuilt.text == original.text
    assert rebuilt.verses == original.verses
    assert rebuilt.wisdom_score == original.wisdom_score
    assert rebuilt.enhancement_applied is True


@pytest.mark.asyncio
async def test_redis_error_falls_back_to_memory() -> None:
    """A Redis SET failure must not raise; the in-memory tier still serves."""
    cache = KiaanResponseCache()
    broken_redis = MagicMock()
    broken_redis.is_connected = True
    broken_redis.set = AsyncMock(side_effect=RuntimeError("redis down"))
    broken_redis.get = AsyncMock(side_effect=RuntimeError("redis down"))

    with patch.object(
        KiaanResponseCache,
        "_redis_client",
        new=AsyncMock(return_value=broken_redis),
    ):
        # SET should not raise, even though redis.set errors.
        await cache.set(
            user_id="u",
            tool_name=None,
            message="hi",
            response=GroundedResponse(text="x"),
        )
        # In-memory fallback should serve.
        with patch.object(
            KiaanResponseCache,
            "_redis_client",
            new=AsyncMock(return_value=None),
        ):
            payload = await cache.get(user_id="u", tool_name=None, message="hi")
            assert payload is not None
            assert payload["text"] == "x"
    assert cache.stats()["errors"] >= 1


# ─── singleton ─────────────────────────────────────────────────────────


def test_get_response_cache_returns_singleton() -> None:
    assert get_response_cache() is get_response_cache()


# ─── integration with call_kiaan_ai_grounded ──────────────────────────


@pytest.mark.asyncio
async def test_grounded_cache_hit_skips_compose_and_llm(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Second identical call hits the cache; compose + LLM are not called."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")
    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton", fresh, raising=False
    )

    fake_db = MagicMock()
    compose_mock = AsyncMock(
        return_value=("PROMPT", [{"verse_ref": "2.47", "source": "gita_corpus"}])
    )
    llm_mock = AsyncMock(return_value="raw response")

    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=compose_mock,
        ),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai", new=llm_mock
        ),
        _patch_filter(_FakeFilterResult(content="grounded response")),
    ):
        first = await call_kiaan_ai_grounded(
            message="I feel anxious",
            db=fake_db,
            user_id="user-1",
            tool_name="Ardha",
        )
        second = await call_kiaan_ai_grounded(
            message="I feel anxious",
            db=fake_db,
            user_id="user-1",
            tool_name="Ardha",
        )

    assert first.text == "grounded response"
    assert second.text == "grounded response"
    # Compose + LLM ran exactly once — second call served from cache.
    assert compose_mock.await_count == 1
    assert llm_mock.await_count == 1
    # Verses preserved across cache round trip.
    assert second.verses == [{"verse_ref": "2.47", "source": "gita_corpus"}]


@pytest.mark.asyncio
async def test_grounded_cache_isolates_by_user(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """User A's cached response must NOT be served to user B."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")
    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton", fresh, raising=False
    )

    fake_db = MagicMock()
    llm_responses = ["alice response", "bob response"]
    llm_mock = AsyncMock(side_effect=llm_responses)

    with (
        _patch_compose("PROMPT", []),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai", new=llm_mock
        ),
        _patch_filter(_FakeFilterResult(content="filtered-fake")),
    ):
        # The filter rewrites all output to "filtered-fake" so we
        # cannot distinguish responses by text alone. What we CAN
        # assert is that the LLM was called for both users.
        await call_kiaan_ai_grounded(
            message="same question", db=fake_db, user_id="alice"
        )
        await call_kiaan_ai_grounded(
            message="same question", db=fake_db, user_id="bob"
        )

    assert llm_mock.await_count == 2  # cache did NOT serve user B.


@pytest.mark.asyncio
async def test_grounded_system_override_bypasses_cache(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A bespoke system_override means the cache key would be wrong → bypass."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")
    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton", fresh, raising=False
    )

    llm_mock = AsyncMock(return_value="raw")
    with (
        _patch_compose("UNUSED", []),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai", new=llm_mock
        ),
        _patch_filter(_FakeFilterResult(content="filtered")),
    ):
        await call_kiaan_ai_grounded(
            message="hello",
            db=MagicMock(),
            user_id="u",
            system_override="MY_OWN_PROMPT",
        )
        await call_kiaan_ai_grounded(
            message="hello",
            db=MagicMock(),
            user_id="u",
            system_override="MY_OWN_PROMPT",
        )
    # Both calls hit the LLM. No caching with system_override.
    assert llm_mock.await_count == 2


@pytest.mark.asyncio
async def test_grounded_apply_filter_false_bypasses_cache(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Streaming callers (apply_filter=False) never read from the cache."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")
    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton", fresh, raising=False
    )

    llm_mock = AsyncMock(return_value="streamed")
    with (
        _patch_compose("PROMPT", []),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai", new=llm_mock
        ),
    ):
        await call_kiaan_ai_grounded(
            message="hello", db=MagicMock(), user_id="u", apply_filter=False
        )
        await call_kiaan_ai_grounded(
            message="hello", db=MagicMock(), user_id="u", apply_filter=False
        )
    assert llm_mock.await_count == 2


@pytest.mark.asyncio
async def test_grounded_no_user_id_bypasses_cache(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """user_id=None must read no cache and write no cache."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")
    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton", fresh, raising=False
    )

    llm_mock = AsyncMock(return_value="raw")
    with (
        _patch_compose("PROMPT", []),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai", new=llm_mock
        ),
        _patch_filter(_FakeFilterResult(content="filtered")),
    ):
        await call_kiaan_ai_grounded(message="hello", db=MagicMock(), user_id=None)
        await call_kiaan_ai_grounded(message="hello", db=MagicMock(), user_id=None)
    assert llm_mock.await_count == 2
    assert fresh.stats()["memory_size"] == 0


@pytest.mark.asyncio
async def test_grounded_does_not_cache_filter_failures(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A response that escaped via the filter-failure path must NOT be cached."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")
    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton", fresh, raising=False
    )

    fake_filter = MagicMock()
    fake_filter.filter_response = AsyncMock(side_effect=RuntimeError("filter bug"))

    llm_mock = AsyncMock(return_value="raw response")
    with (
        _patch_compose("PROMPT", []),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai", new=llm_mock
        ),
        patch(
            "backend.services.gita_wisdom_filter.get_gita_wisdom_filter",
            return_value=fake_filter,
        ),
    ):
        result = await call_kiaan_ai_grounded(
            message="hello", db=MagicMock(), user_id="u"
        )
        assert result.filter_applied is False  # degraded path
        # No cache write happened.
        assert fresh.stats()["memory_size"] == 0
        assert fresh.stats()["sets"] == 0


@pytest.mark.asyncio
async def test_grounded_gita_verse_pin_bypasses_cache(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A caller-supplied gita_verse pin is treated as a one-off."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")
    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton", fresh, raising=False
    )

    llm_mock = AsyncMock(return_value="raw")
    with (
        _patch_compose("PROMPT", []),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai", new=llm_mock
        ),
        _patch_filter(_FakeFilterResult(content="filtered")),
    ):
        await call_kiaan_ai_grounded(
            message="hello",
            db=MagicMock(),
            user_id="u",
            gita_verse={"chapter": 2, "verse": 47, "sanskrit": "..."},
        )
        await call_kiaan_ai_grounded(
            message="hello",
            db=MagicMock(),
            user_id="u",
            gita_verse={"chapter": 2, "verse": 47, "sanskrit": "..."},
        )
    assert llm_mock.await_count == 2


@pytest.mark.asyncio
async def test_grounded_locale_shards_cache(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Different locales must not collide on the same key."""
    monkeypatch.setenv("KIAAN_RESPONSE_CACHE_ENABLED", "true")
    fresh = KiaanResponseCache()
    monkeypatch.setattr(
        "backend.services.kiaan_response_cache._singleton", fresh, raising=False
    )

    llm_mock = AsyncMock(return_value="raw")
    with (
        _patch_compose("PROMPT", []),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai", new=llm_mock
        ),
        _patch_filter(_FakeFilterResult(content="filtered")),
    ):
        # First call in English populates cache.
        await call_kiaan_ai_grounded(
            message="hello", db=MagicMock(), user_id="u", locale="en"
        )
        # Same user, same message, different locale → cache MISS, LLM hit.
        await call_kiaan_ai_grounded(
            message="hello", db=MagicMock(), user_id="u", locale="hi"
        )
    assert llm_mock.await_count == 2
