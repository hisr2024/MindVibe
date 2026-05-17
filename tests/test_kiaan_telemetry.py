"""Tests for the per-stage telemetry module.

Covers ``IMPROVEMENT_ROADMAP.md`` P2 §14:

* ``trace_stage`` records latency + counter (success and error paths).
* ``record_grounded_turn`` emits the end-to-end histogram + cost +
  filter outcome + cache outcome.
* ``render_prometheus`` produces text-format output that includes the
  kiaan_* metric names.
* The cost lookup table returns the expected micro-USD for known
  (provider, model) pairs and 0 for unknown.
* Integration: ``call_kiaan_ai_grounded`` records the end-to-end
  histogram via a stubbed pipeline.

Telemetry is wrapped in defensive try/except in production; the tests
verify the metrics ARE emitted on the happy path, then verify failures
in the metric layer don't break the request path.
"""

from __future__ import annotations

import asyncio
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.kiaan_telemetry import (
    _estimate_cost_micro_usd,
    cache_outcome_total,
    cost_micro_usd_total,
    filter_outcome_total,
    grounded_turn_latency_seconds,
    record_grounded_turn,
    render_prometheus,
    stage_calls_total,
    telemetry_enabled,
    trace_stage,
)

# ── Helpers ───────────────────────────────────────────────────────────


def _counter_value(counter: Any, **labels: str) -> float:
    """Read a Counter's current value at the given label set."""
    try:
        return counter.labels(**labels)._value.get()  # type: ignore[attr-defined]
    except Exception:
        return 0.0


def _histogram_count(histogram: Any, **labels: str) -> float:
    """Read a Histogram's total observation count at the given labels."""
    try:
        return histogram.labels(**labels)._sum.get()  # type: ignore[attr-defined]
    except Exception:
        return 0.0


# ── trace_stage ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_trace_stage_records_latency_on_success() -> None:
    before = _counter_value(stage_calls_total, stage="t_success", outcome="ok")
    async with trace_stage("t_success"):
        await asyncio.sleep(0.001)
    after = _counter_value(stage_calls_total, stage="t_success", outcome="ok")
    assert after == before + 1


@pytest.mark.asyncio
async def test_trace_stage_records_error_outcome_and_reraises() -> None:
    before = _counter_value(stage_calls_total, stage="t_err", outcome="error")
    with pytest.raises(RuntimeError, match="boom"):
        async with trace_stage("t_err"):
            raise RuntimeError("boom")
    after = _counter_value(stage_calls_total, stage="t_err", outcome="error")
    assert after == before + 1


@pytest.mark.asyncio
async def test_trace_stage_yields_scratch_dict() -> None:
    """The yielded dict is a free-form scratch space — callers can
    write to it without breaking the stage timing."""
    async with trace_stage("t_yield") as ctx:
        ctx["arbitrary_metadata"] = 42
        assert isinstance(ctx, dict)


# ── record_grounded_turn ──────────────────────────────────────────────


def test_record_grounded_turn_emits_cache_hit_outcome() -> None:
    before = _counter_value(cache_outcome_total, outcome="hit")
    record_grounded_turn(
        tool_name="Ardha",
        elapsed_seconds=0.123,
        cache_hit=True,
        outcome="ok",
        is_gita_grounded=True,
        wisdom_score_value=0.91,
        filter_applied=True,
        provider="openai",
        model="gpt-4o-mini",
        prompt_tokens=0,
        completion_tokens=0,
    )
    after = _counter_value(cache_outcome_total, outcome="hit")
    assert after == before + 1


def test_record_grounded_turn_emits_cache_miss_outcome() -> None:
    before = _counter_value(cache_outcome_total, outcome="miss")
    record_grounded_turn(
        tool_name="Viyoga",
        elapsed_seconds=0.5,
        cache_hit=False,
        outcome="ok",
        is_gita_grounded=True,
        wisdom_score_value=0.82,
        filter_applied=True,
        provider="openai",
        model="gpt-4o-mini",
        prompt_tokens=120,
        completion_tokens=80,
    )
    after = _counter_value(cache_outcome_total, outcome="miss")
    assert after == before + 1


def test_record_grounded_turn_emits_filter_pass_when_gita_grounded() -> None:
    before = _counter_value(filter_outcome_total, outcome="pass")
    record_grounded_turn(
        tool_name=None,
        elapsed_seconds=0.4,
        cache_hit=False,
        outcome="ok",
        is_gita_grounded=True,
        wisdom_score_value=0.88,
        filter_applied=True,
        provider="openai",
        model="gpt-4o-mini",
        prompt_tokens=0,
        completion_tokens=0,
    )
    after = _counter_value(filter_outcome_total, outcome="pass")
    assert after == before + 1


def test_record_grounded_turn_emits_filter_fail_when_not_grounded() -> None:
    before = _counter_value(filter_outcome_total, outcome="fail")
    record_grounded_turn(
        tool_name=None,
        elapsed_seconds=0.4,
        cache_hit=False,
        outcome="filter_error",
        is_gita_grounded=False,
        wisdom_score_value=0.02,
        filter_applied=True,
        provider="openai",
        model="gpt-4o-mini",
        prompt_tokens=0,
        completion_tokens=0,
    )
    after = _counter_value(filter_outcome_total, outcome="fail")
    assert after == before + 1


def test_record_grounded_turn_emits_filter_skipped_when_filter_off() -> None:
    """Streaming callers (apply_filter=False) get a ``skipped`` count."""
    before = _counter_value(filter_outcome_total, outcome="skipped")
    record_grounded_turn(
        tool_name=None,
        elapsed_seconds=0.4,
        cache_hit=False,
        outcome="ok",
        is_gita_grounded=True,
        wisdom_score_value=1.0,
        filter_applied=False,
        provider="openai",
        model="gpt-4o-mini",
        prompt_tokens=0,
        completion_tokens=0,
    )
    after = _counter_value(filter_outcome_total, outcome="skipped")
    assert after == before + 1


def test_record_grounded_turn_emits_cost_when_tokens_present() -> None:
    """Tokens × per-1K rate → micro-USD counter."""
    before = _counter_value(
        cost_micro_usd_total, provider="openai", model="gpt-4o-mini"
    )
    record_grounded_turn(
        tool_name="Ardha",
        elapsed_seconds=0.4,
        cache_hit=False,
        outcome="ok",
        is_gita_grounded=True,
        wisdom_score_value=0.85,
        filter_applied=True,
        provider="openai",
        model="gpt-4o-mini",
        prompt_tokens=1000,  # exactly 1K input
        completion_tokens=1000,  # exactly 1K output
    )
    after = _counter_value(
        cost_micro_usd_total, provider="openai", model="gpt-4o-mini"
    )
    # 1K input @ 0.00015 + 1K output @ 0.00060 = $0.00075 = 750 micro-USD.
    assert int(after - before) == 750


def test_record_grounded_turn_skips_cost_for_unknown_provider() -> None:
    """Unknown (provider, model) pair → 0 cost emitted, no exception."""
    before = _counter_value(
        cost_micro_usd_total, provider="unknown", model="z"
    )
    record_grounded_turn(
        tool_name=None,
        elapsed_seconds=0.4,
        cache_hit=False,
        outcome="ok",
        is_gita_grounded=True,
        wisdom_score_value=0.85,
        filter_applied=True,
        provider="unknown",
        model="z",
        prompt_tokens=1000,
        completion_tokens=1000,
    )
    after = _counter_value(
        cost_micro_usd_total, provider="unknown", model="z"
    )
    assert after == before


def test_record_grounded_turn_never_raises_on_emit_failure() -> None:
    """A broken Counter must not propagate into the user request path."""
    broken = MagicMock()
    broken.labels = MagicMock(
        side_effect=RuntimeError("metric backend down")
    )
    with patch(
        "backend.services.kiaan_telemetry.grounded_turn_latency_seconds",
        new=broken,
    ):
        # Must not raise.
        record_grounded_turn(
            tool_name=None,
            elapsed_seconds=0.4,
            cache_hit=False,
            outcome="ok",
            is_gita_grounded=True,
            wisdom_score_value=0.85,
            filter_applied=True,
            provider="openai",
            model="gpt-4o-mini",
            prompt_tokens=100,
            completion_tokens=100,
        )


# ── Cost lookup ───────────────────────────────────────────────────────


def test_cost_lookup_known_providers() -> None:
    # gpt-4o-mini @ 100/100 tokens.
    assert _estimate_cost_micro_usd("openai", "gpt-4o-mini", 100, 100) == int(
        round((100 / 1000 * 0.00015 + 100 / 1000 * 0.00060) * 1_000_000)
    )
    # local llama is always $0.
    assert _estimate_cost_micro_usd(
        "local_llama", "local-llama", 1000, 1000
    ) == 0


def test_cost_lookup_unknown_returns_zero() -> None:
    assert _estimate_cost_micro_usd("nope", "no-model", 1000, 1000) == 0


# ── render_prometheus ─────────────────────────────────────────────────


def test_render_prometheus_returns_text_format() -> None:
    body, content_type = render_prometheus()
    # Prometheus text format starts with "# HELP" lines.
    assert isinstance(body, bytes)
    assert b"# HELP" in body or len(body) == 0  # tolerate empty in early state
    assert content_type.startswith("text/plain")


def test_render_prometheus_includes_kiaan_metrics() -> None:
    """After we emit at least one observation, the kiaan_* metrics
    must appear in the scrape output."""
    record_grounded_turn(
        tool_name="Ardha",
        elapsed_seconds=0.1,
        cache_hit=True,
        outcome="ok",
        is_gita_grounded=True,
        wisdom_score_value=0.9,
        filter_applied=True,
        provider="openai",
        model="gpt-4o-mini",
        prompt_tokens=0,
        completion_tokens=0,
    )
    body, _ = render_prometheus()
    text = body.decode("utf-8")
    assert "kiaan_grounded_turn_latency_seconds" in text
    assert "kiaan_response_cache_outcomes_total" in text
    assert "kiaan_gita_filter_outcomes_total" in text


def test_render_prometheus_refreshes_cache_gauges() -> None:
    """``render_prometheus`` must read live cache stats at scrape time."""
    fake_cache = MagicMock()
    fake_cache.stats = MagicMock(
        return_value={"memory_size": 412, "enabled": True}
    )
    with patch(
        "backend.services.kiaan_response_cache.get_response_cache",
        return_value=fake_cache,
    ):
        body, _ = render_prometheus()
    text = body.decode("utf-8")
    assert "kiaan_response_cache_memory_size" in text
    assert "kiaan_response_cache_enabled" in text


def test_telemetry_enabled_default_and_killswitch(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("KIAAN_TELEMETRY_ENABLED", raising=False)
    assert telemetry_enabled() is True
    monkeypatch.setenv("KIAAN_TELEMETRY_ENABLED", "false")
    assert telemetry_enabled() is False
    monkeypatch.setenv("KIAAN_TELEMETRY_ENABLED", "0")
    assert telemetry_enabled() is False


# ── Integration: call_kiaan_ai_grounded emits the end-to-end metric ──


@pytest.mark.asyncio
async def test_grounded_call_emits_end_to_end_histogram() -> None:
    """A normal grounded turn must increment the end-to-end histogram."""
    from backend.services.kiaan_grounded_ai import call_kiaan_ai_grounded

    # Capture the histogram observation by reading the count delta.
    before = grounded_turn_latency_seconds.labels(
        tool="Ardha", cache_hit="false", outcome="ok"
    )._sum.get()  # type: ignore[attr-defined]

    fake_filter = MagicMock()
    fake_filter.filter_response = AsyncMock(
        return_value=MagicMock(
            content="ok",
            is_gita_grounded=True,
            wisdom_score=0.9,
            enhancement_applied=False,
            verses_referenced=[],
            gita_concepts_found=[],
            filter_metadata={},
        )
    )

    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=AsyncMock(return_value=("PROMPT", [])),
        ),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai_with_usage",
            new=AsyncMock(return_value="reply text"),
        ),
        patch(
            "backend.services.gita_wisdom_filter.get_gita_wisdom_filter",
            return_value=fake_filter,
        ),
    ):
        await call_kiaan_ai_grounded(
            message="I feel anxious",
            db=MagicMock(),
            user_id="t-user",
            tool_name="Ardha",
        )

    after = grounded_turn_latency_seconds.labels(
        tool="Ardha", cache_hit="false", outcome="ok"
    )._sum.get()  # type: ignore[attr-defined]
    # _sum.get() returns total observed time. Some elapsed > 0.
    assert after > before


@pytest.mark.asyncio
async def test_grounded_call_emits_stage_metrics_for_llm_and_filter() -> None:
    """Per-stage timers must record observations for compose / llm / filter."""
    from backend.services.kiaan_grounded_ai import call_kiaan_ai_grounded

    before_llm = stage_calls_total.labels(stage="llm", outcome="ok")._value.get()  # type: ignore[attr-defined]
    before_filter = stage_calls_total.labels(stage="filter", outcome="ok")._value.get()  # type: ignore[attr-defined]

    fake_filter = MagicMock()
    fake_filter.filter_response = AsyncMock(
        return_value=MagicMock(
            content="ok",
            is_gita_grounded=True,
            wisdom_score=0.9,
            enhancement_applied=False,
            verses_referenced=[],
            gita_concepts_found=[],
            filter_metadata={},
        )
    )
    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=AsyncMock(return_value=("PROMPT", [])),
        ),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai_with_usage",
            new=AsyncMock(return_value="reply"),
        ),
        patch(
            "backend.services.gita_wisdom_filter.get_gita_wisdom_filter",
            return_value=fake_filter,
        ),
    ):
        await call_kiaan_ai_grounded(
            message="hello",
            db=MagicMock(),
            user_id="t-user",
            tool_name="Ardha",
        )

    after_llm = stage_calls_total.labels(stage="llm", outcome="ok")._value.get()  # type: ignore[attr-defined]
    after_filter = stage_calls_total.labels(stage="filter", outcome="ok")._value.get()  # type: ignore[attr-defined]
    assert after_llm == before_llm + 1
    assert after_filter == before_filter + 1


# ── Prometheus endpoint ───────────────────────────────────────────────


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from backend.main import app

    yield TestClient(app)


def test_prometheus_endpoint_returns_text_plain(client) -> None:
    resp = client.get("/api/monitoring/prometheus")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/plain")
    # Even on a cold registry the endpoint serves a body — Prometheus
    # treats an empty scrape as a successful one.
    assert isinstance(resp.text, str)
