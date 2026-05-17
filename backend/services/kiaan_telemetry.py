"""Per-stage telemetry for the Wisdom-Core-gated pipeline.

Implements ``IMPROVEMENT_ROADMAP.md`` P2 §14. Surfaces what
``_record_turn_telemetry`` already captures for voice (first-audio-byte
ms, tier_used, filter_pass_rate, cache_hit) PLUS the same shape for
chat / sacred tools / streaming, so a single Grafana dashboard answers:

  * Is cache_hit_ratio holding above the alert threshold?
  * Is filter_pass_rate above 90 %?
  * Is p95 end-to-end latency under target?
  * What is cost-per-turn rolling average?

Public surface
--------------
:func:`trace_stage`  — async context manager that times a code block
                       and emits a histogram + a success/error counter
                       under the stage name. Use one per logical stage:
                       ``compose``, ``llm``, ``filter``, ``cache_get``,
                       ``cache_set``, ``end_to_end``.

:func:`record_grounded_turn` — call once per ``call_kiaan_ai_grounded``
                       invocation to record the end-to-end histogram +
                       a cache_hit gauge + a cost counter projected
                       from provider / model token usage.

:func:`render_prometheus` — serialise the default Prometheus registry
                       into the text format. Injects live gauges from
                       ``kiaan_response_cache.get_response_cache().stats()``
                       at scrape time so the cache hit ratio is always
                       current.

Graceful degradation
--------------------
Every metric primitive is wrapped so a missing ``prometheus_client`` or
a misconfigured registry never raises into the user request path.
:func:`trace_stage` still times the block and yields control even when
metrics are no-ops — important because the same context manager is on
the hot path of every grounded call.
"""

from __future__ import annotations

import contextlib
import logging
import os
import time
from collections.abc import AsyncIterator
from typing import Any

logger = logging.getLogger(__name__)


# ── prometheus_client (optional dependency, fail open) ────────────────
try:
    from prometheus_client import (  # type: ignore[import-untyped]
        CONTENT_TYPE_LATEST,
        REGISTRY,
        CollectorRegistry,
        Counter,
        Gauge,
        Histogram,
        generate_latest,
    )

    _PROM_AVAILABLE = True
except Exception as _exc:  # pragma: no cover - defensive
    logger.warning(
        "kiaan_telemetry: prometheus_client unavailable (%s); metrics "
        "become no-ops",
        _exc,
    )
    _PROM_AVAILABLE = False
    REGISTRY = None  # type: ignore[assignment]
    CONTENT_TYPE_LATEST = "text/plain; version=0.0.4"

    class CollectorRegistry:  # type: ignore[no-redef]
        ...

    def generate_latest(_registry: Any = None) -> bytes:  # type: ignore[misc]
        return b""

    class _NoOpMetric:
        def __init__(self, *_args: Any, **_kwargs: Any) -> None:
            pass

        def labels(self, *_args: Any, **_kwargs: Any) -> _NoOpMetric:
            return self

        def observe(self, *_: Any, **__: Any) -> None:
            pass

        def inc(self, *_: Any, **__: Any) -> None:
            pass

        def set(self, *_: Any, **__: Any) -> None:
            pass

        def time(self) -> Any:
            class _Ctx:
                def __enter__(self_inner) -> _Ctx:
                    return self_inner

                def __exit__(self_inner, *args: Any) -> None:
                    pass

            return _Ctx()

    Counter = _NoOpMetric  # type: ignore[assignment,misc]
    Histogram = _NoOpMetric  # type: ignore[assignment,misc]
    Gauge = _NoOpMetric  # type: ignore[assignment,misc]


# ── Metric definitions ───────────────────────────────────────────────
# Buckets tuned for the grounded pipeline:
#   compose / cache:   0.005 - 0.5 s
#   llm:               0.05  - 30  s
#   filter:            0.001 - 0.5 s
#   end_to_end:        0.05  - 30  s
_LATENCY_BUCKETS = (
    0.005, 0.010, 0.025, 0.050, 0.100, 0.250, 0.500,
    1.0, 2.5, 5.0, 10.0, 30.0,
)


def _make_metric(factory: Any, name: str, *args: Any, **kwargs: Any) -> Any:
    """Construct a metric, swallowing duplicate-registration errors so
    importing this module twice (tests, reloads) is not fatal."""
    try:
        return factory(name, *args, **kwargs)
    except ValueError:
        # Already registered. Return the existing collector.
        try:
            from prometheus_client import REGISTRY as _R  # type: ignore[import-untyped]

            for collector in _R._collector_to_names:  # type: ignore[attr-defined]
                if getattr(collector, "_name", None) == name:
                    return collector
        except Exception:
            pass
        # Fallback: hand back a no-op so callers don't crash.
        return _NoOpMetric()  # type: ignore[name-defined]
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("kiaan_telemetry: metric %s init failed: %s", name, exc)
        return _NoOpMetric()  # type: ignore[name-defined]


# Per-stage latency histogram. Labels keep the cardinality bounded:
#   stage   : compose / cache_get / cache_set / llm / filter / end_to_end
#   outcome : ok / error
stage_latency_seconds = _make_metric(
    Histogram,
    "kiaan_stage_latency_seconds",
    "Latency of each grounded-pipeline stage.",
    ["stage", "outcome"],
    buckets=_LATENCY_BUCKETS,
)

# Per-stage call counter (for error-rate calculations).
stage_calls_total = _make_metric(
    Counter,
    "kiaan_stage_calls_total",
    "Calls into each grounded-pipeline stage.",
    ["stage", "outcome"],
)

# End-to-end grounded-call histogram with richer labels.
grounded_turn_latency_seconds = _make_metric(
    Histogram,
    "kiaan_grounded_turn_latency_seconds",
    "End-to-end latency of call_kiaan_ai_grounded.",
    ["tool", "cache_hit", "outcome"],
    buckets=_LATENCY_BUCKETS,
)

# Cache hit / miss counter. Mirrors get_response_cache().stats() but
# exposes it as a counter so rate() works in PromQL.
cache_outcome_total = _make_metric(
    Counter,
    "kiaan_response_cache_outcomes_total",
    "Response-cache outcomes (hit / miss / write / error).",
    ["outcome"],
)

# Filter pass / fail counter — used to compute filter_pass_rate.
filter_outcome_total = _make_metric(
    Counter,
    "kiaan_gita_filter_outcomes_total",
    "Gita Wisdom filter outcomes per grounded call.",
    ["outcome"],  # pass / fail / skipped
)

# Cost in USD micro-units (1e-6 USD), summed per provider / model.
# rate(kiaan_cost_micro_usd_total[5m]) gives $ per second.
cost_micro_usd_total = _make_metric(
    Counter,
    "kiaan_cost_micro_usd_total",
    "Cumulative LLM cost in micro-USD (1e-6 USD).",
    ["provider", "model"],
)

# Wisdom score histogram — the filter's confidence per turn.
wisdom_score = _make_metric(
    Histogram,
    "kiaan_wisdom_score",
    "Wisdom score from the post-LLM Gita filter.",
    [],
    buckets=(0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0),
)


# ── Cost model ────────────────────────────────────────────────────────
# Per-1K-token cost in USD. Update when providers change pricing.
# Two entries per model: ("in" -> input tokens, "out" -> output tokens).
_COST_PER_1K_TOKENS_USD: dict[tuple[str, str], dict[str, float]] = {
    ("openai", "gpt-4o-mini"):  {"in": 0.00015, "out": 0.00060},
    ("openai", "gpt-4o"):       {"in": 0.00250, "out": 0.01000},
    ("openai", "gpt-4-turbo"):  {"in": 0.01000, "out": 0.03000},
    ("anthropic", "claude-haiku-4-5"):  {"in": 0.00080, "out": 0.00400},
    ("anthropic", "claude-sonnet-4-5"): {"in": 0.00300, "out": 0.01500},
    ("sarvam", "sarvam-2b"):    {"in": 0.00050, "out": 0.00150},
    # Local llama runs on owned hardware — flat $0 per token.
    ("local_llama", "local-llama"): {"in": 0.0, "out": 0.0},
}


def _estimate_cost_micro_usd(
    provider: str, model: str, prompt_tokens: int, completion_tokens: int
) -> int:
    """Return integer micro-USD (1e-6) for the given usage. Unknown
    (provider, model) pairs default to zero — callers can still see
    *which* unknown pair appeared because the counter is labelled."""
    rates = _COST_PER_1K_TOKENS_USD.get((provider, model))
    if not rates:
        return 0
    usd = (prompt_tokens / 1000.0) * rates["in"] + (
        completion_tokens / 1000.0
    ) * rates["out"]
    return max(0, int(round(usd * 1_000_000)))


# ── Context managers ──────────────────────────────────────────────────


@contextlib.asynccontextmanager
async def trace_stage(stage: str) -> AsyncIterator[dict[str, Any]]:
    """Time a logical stage and emit a histogram + counter.

    Usage::

        async with trace_stage("compose") as ctx:
            verses = await compose_kiaan_system_prompt(...)
            ctx["verses_count"] = len(verses)  # optional metadata

    On exception, records outcome="error" before re-raising. Caller's
    exception is never swallowed.

    The yielded dict is a free-form scratch space for the caller —
    nothing in it is auto-emitted (callers that want labelled metrics
    should call the named metric directly). Kept for forward-compat
    with a future "auto-emit selected keys" enhancement.
    """
    started = time.monotonic()
    ctx: dict[str, Any] = {}
    outcome = "ok"
    try:
        yield ctx
    except Exception:
        outcome = "error"
        raise
    finally:
        elapsed = time.monotonic() - started
        try:
            stage_latency_seconds.labels(stage=stage, outcome=outcome).observe(elapsed)
            stage_calls_total.labels(stage=stage, outcome=outcome).inc()
        except Exception as metric_exc:  # pragma: no cover - defensive
            logger.debug(
                "kiaan_telemetry: stage metric emit failed (%s/%s): %s",
                stage,
                outcome,
                metric_exc,
            )


def record_grounded_turn(
    *,
    tool_name: str | None,
    elapsed_seconds: float,
    cache_hit: bool,
    outcome: str,
    is_gita_grounded: bool,
    wisdom_score_value: float,
    filter_applied: bool,
    provider: str | None,
    model: str | None,
    prompt_tokens: int,
    completion_tokens: int,
) -> None:
    """Emit the end-of-turn metrics for one ``call_kiaan_ai_grounded``.

    Never raises — metric emission failures are logged at debug and
    swallowed so a Prometheus hiccup never breaks a user response.
    """
    tool_label = tool_name or "chat"
    cache_label = "true" if cache_hit else "false"
    try:
        grounded_turn_latency_seconds.labels(
            tool=tool_label, cache_hit=cache_label, outcome=outcome
        ).observe(elapsed_seconds)

        # Cache outcome counter — distinct from cache_outcome_total
        # increments inside the cache module itself; both shapes are
        # useful for the dashboard.
        cache_outcome_total.labels(
            outcome="hit" if cache_hit else "miss"
        ).inc()

        if filter_applied:
            wisdom_score.observe(float(wisdom_score_value))
            filter_outcome_total.labels(
                outcome="pass" if is_gita_grounded else "fail"
            ).inc()
        else:
            filter_outcome_total.labels(outcome="skipped").inc()

        if provider and model and (prompt_tokens or completion_tokens):
            micro = _estimate_cost_micro_usd(
                provider, model, prompt_tokens, completion_tokens
            )
            if micro:
                cost_micro_usd_total.labels(
                    provider=provider, model=model
                ).inc(micro)
    except Exception as exc:  # pragma: no cover - defensive
        logger.debug(
            "kiaan_telemetry: grounded-turn emit failed: %s", exc
        )


# ── Prometheus rendering ──────────────────────────────────────────────


# Gauges that we update inline before serialising so the scrape always
# sees fresh values.
_cache_size_gauge = _make_metric(
    Gauge,
    "kiaan_response_cache_memory_size",
    "Number of entries in the in-memory response-cache tier.",
)
_cache_enabled_gauge = _make_metric(
    Gauge,
    "kiaan_response_cache_enabled",
    "Whether the response cache is enabled (1/0).",
)


def _refresh_cache_gauges() -> None:
    """Pull live values from get_response_cache().stats() into gauges.

    Called at scrape time so the dashboard sees the current memory
    size and enabled state without us emitting on every cache
    operation.
    """
    try:
        from backend.services.kiaan_response_cache import get_response_cache

        stats = get_response_cache().stats()
        _cache_size_gauge.set(int(stats.get("memory_size") or 0))
        _cache_enabled_gauge.set(1 if stats.get("enabled") else 0)
    except Exception as exc:  # pragma: no cover - defensive
        logger.debug("kiaan_telemetry: cache gauge refresh failed: %s", exc)


def render_prometheus() -> tuple[bytes, str]:
    """Serialise the Prometheus registry.

    Returns ``(body, content_type)`` ready to hand to a FastAPI
    Response. Refreshes inline gauges (cache size, enabled flag)
    before serialising so the scrape sees current values.
    """
    _refresh_cache_gauges()
    if not _PROM_AVAILABLE:
        return b"# prometheus_client not installed\n", CONTENT_TYPE_LATEST
    try:
        body = generate_latest(REGISTRY)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("kiaan_telemetry: render failed: %s", exc)
        body = (
            f"# prometheus render failed: {type(exc).__name__}\n".encode()
        )
    return body, CONTENT_TYPE_LATEST


# Env switch — set to "false" to short-circuit telemetry entirely.
def telemetry_enabled() -> bool:
    raw = os.getenv("KIAAN_TELEMETRY_ENABLED", "").strip().lower()
    return raw not in ("false", "0", "no", "off")


__all__ = [
    "cache_outcome_total",
    "cost_micro_usd_total",
    "filter_outcome_total",
    "grounded_turn_latency_seconds",
    "record_grounded_turn",
    "render_prometheus",
    "stage_calls_total",
    "stage_latency_seconds",
    "telemetry_enabled",
    "trace_stage",
    "wisdom_score",
]
