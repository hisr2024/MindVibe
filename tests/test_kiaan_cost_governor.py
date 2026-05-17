"""Tests for the cost-aware spend governor.

Covers ``IMPROVEMENT_ROADMAP.md`` P2 §15. Pins:

* Tier caps load from env with sensible defaults.
* ``check_spend`` returns ALLOW / BUDGET_WARNING / BUDGET_EXCEEDED at
  the documented thresholds.
* ``record_spend`` accumulates per-user-per-day in memory; the same
  user across two tiers does NOT cross-contaminate buckets.
* ``BudgetExceededError`` carries the decision + retry-after seconds.
* ``user_id=None`` and ``micro_usd=0`` are short-circuited cleanly.
* Token plumbing through ``call_kiaan_ai_with_usage`` reaches the
  telemetry cost counter on the grounded path.
* Concurrency: ``record_spend`` from many coroutines aggregates
  correctly (the asyncio.Lock test).
"""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.kiaan_cost_governor import (
    BudgetExceededError,
    CostGovernor,
    SpendDecision,
    SpendOutcome,
    UserTier,
    estimate_cost_for_tokens,
    get_cost_governor,
)


@pytest.fixture(autouse=True)
def _force_memory_backend():
    """Make every test run against the in-memory tier so they're
    deterministic. Redis lookup returns None → governor uses local store."""
    with patch.object(
        CostGovernor,
        "_redis_client",
        new=AsyncMock(return_value=None),
    ):
        yield


@pytest.fixture
def fresh_governor() -> CostGovernor:
    return CostGovernor()


# ── Caps + decisions ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_default_caps_per_tier(fresh_governor) -> None:
    state_free = await fresh_governor.get_spend_state(
        user_id="u-1", tier=UserTier.FREE
    )
    state_divine = await fresh_governor.get_spend_state(
        user_id="u-1", tier=UserTier.DIVINE
    )
    assert state_free["cap_usd"] == 0.02
    assert state_divine["cap_usd"] == 2.00


@pytest.mark.asyncio
async def test_check_spend_allow_when_far_under_cap(fresh_governor) -> None:
    d = await fresh_governor.check_spend(
        user_id="u-2", tier=UserTier.FREE
    )
    assert d.outcome == SpendOutcome.ALLOW
    assert d.spent_micro_usd == 0
    assert d.ratio == 0.0


@pytest.mark.asyncio
async def test_check_spend_warning_at_80_percent(fresh_governor) -> None:
    # FREE cap = 0.02 USD = 20_000 micro. 80% = 16_000.
    await fresh_governor.record_spend(
        user_id="u-3", tier=UserTier.FREE, micro_usd=16_000
    )
    d = await fresh_governor.check_spend(user_id="u-3", tier=UserTier.FREE)
    assert d.outcome == SpendOutcome.BUDGET_WARNING
    assert d.ratio >= 0.80


@pytest.mark.asyncio
async def test_check_spend_exceeded_at_100_percent(fresh_governor) -> None:
    # FREE cap reached.
    await fresh_governor.record_spend(
        user_id="u-4", tier=UserTier.FREE, micro_usd=20_000
    )
    d = await fresh_governor.check_spend(user_id="u-4", tier=UserTier.FREE)
    assert d.outcome == SpendOutcome.BUDGET_EXCEEDED
    assert d.retry_after_seconds > 0


@pytest.mark.asyncio
async def test_check_spend_projects_estimated_cost(fresh_governor) -> None:
    """``estimated_micro_usd`` adds to the live read for the decision."""
    await fresh_governor.record_spend(
        user_id="u-5", tier=UserTier.FREE, micro_usd=15_000
    )
    # +5_000 estimated would push to cap → EXCEEDED.
    d = await fresh_governor.check_spend(
        user_id="u-5", tier=UserTier.FREE, estimated_micro_usd=5_000
    )
    assert d.outcome == SpendOutcome.BUDGET_EXCEEDED


# ── Per-user / per-tier isolation ─────────────────────────────────────


@pytest.mark.asyncio
async def test_buckets_isolate_by_user(fresh_governor) -> None:
    await fresh_governor.record_spend(
        user_id="alice", tier=UserTier.FREE, micro_usd=20_000
    )
    bob_state = await fresh_governor.get_spend_state(
        user_id="bob", tier=UserTier.FREE
    )
    assert bob_state["spent_usd"] == 0.0


@pytest.mark.asyncio
async def test_buckets_isolate_by_tier(fresh_governor) -> None:
    """Same user under two tiers gets two buckets — keeps tier upgrades
    from inheriting yesterday's spend."""
    await fresh_governor.record_spend(
        user_id="user", tier=UserTier.FREE, micro_usd=20_000
    )
    state_siddha = await fresh_governor.get_spend_state(
        user_id="user", tier=UserTier.SIDDHA
    )
    assert state_siddha["spent_usd"] == 0.0


# ── Edge cases ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_no_user_id_bypasses_check(fresh_governor) -> None:
    d = await fresh_governor.check_spend(user_id="", tier=UserTier.FREE)
    assert d.outcome == SpendOutcome.ALLOW
    assert "no user_id" in d.reason


@pytest.mark.asyncio
async def test_record_zero_micro_usd_is_noop(fresh_governor) -> None:
    new_total = await fresh_governor.record_spend(
        user_id="u", tier=UserTier.FREE, micro_usd=0
    )
    assert new_total == 0


@pytest.mark.asyncio
async def test_kill_switch_returns_allow(
    fresh_governor, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("KIAAN_COST_GOVERNOR_ENABLED", "false")
    # Even after recording a huge spend, killed governor → ALLOW.
    await fresh_governor.record_spend(
        user_id="u", tier=UserTier.FREE, micro_usd=99_999_999
    )
    d = await fresh_governor.check_spend(user_id="u", tier=UserTier.FREE)
    assert d.outcome == SpendOutcome.ALLOW
    assert "disabled" in d.reason.lower()


@pytest.mark.asyncio
async def test_env_override_changes_cap(
    fresh_governor, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("KIAAN_COST_CAP_USD_FREE", "1.00")
    state = await fresh_governor.get_spend_state(
        user_id="u", tier=UserTier.FREE
    )
    assert state["cap_usd"] == 1.00


# ── Concurrency: asyncio lock aggregates correctly ────────────────────


@pytest.mark.asyncio
async def test_concurrent_record_spend_aggregates(fresh_governor) -> None:
    async def _bump():
        await fresh_governor.record_spend(
            user_id="concurrent", tier=UserTier.FREE, micro_usd=100
        )
    await asyncio.gather(*[_bump() for _ in range(20)])
    state = await fresh_governor.get_spend_state(
        user_id="concurrent", tier=UserTier.FREE
    )
    # 20 × 100 micro = 2000 micro = 0.002 USD.
    assert state["spent_usd"] == 0.002


# ── BudgetExceededError envelope ──────────────────────────────────────


def test_budget_exceeded_error_carries_decision() -> None:
    decision = SpendDecision(
        outcome=SpendOutcome.BUDGET_EXCEEDED,
        tier=UserTier.FREE,
        spent_micro_usd=20_000,
        cap_micro_usd=20_000,
        ratio=1.0,
        reason="cap reached",
        retry_after_seconds=3600,
    )
    err = BudgetExceededError(decision)
    assert err.decision is decision
    assert err.retry_after_seconds == 3600
    assert "cap reached" in str(err)


# ── Singleton ─────────────────────────────────────────────────────────


def test_get_cost_governor_is_singleton() -> None:
    a = get_cost_governor()
    b = get_cost_governor()
    assert a is b


# ── Cost estimate helper ──────────────────────────────────────────────


def test_estimate_cost_for_tokens_known_model() -> None:
    # 1000/1000 gpt-4o-mini = $0.00015 + $0.00060 = $0.00075 = 750 micro.
    assert estimate_cost_for_tokens("openai", "gpt-4o-mini", 1000, 1000) == 750


def test_estimate_cost_for_tokens_unknown_returns_zero() -> None:
    assert estimate_cost_for_tokens("nope", "no-model", 1000, 1000) == 0


def test_estimate_cost_for_local_llama_is_zero() -> None:
    """Local model runs on owned hardware → flat 0 cost per token."""
    assert estimate_cost_for_tokens(
        "local_llama", "local-llama", 10_000, 10_000
    ) == 0


# ── Integration: grounded path records spend ──────────────────────────


@pytest.mark.asyncio
async def test_grounded_path_records_spend_via_governor(
    fresh_governor, monkeypatch: pytest.MonkeyPatch
) -> None:
    """When the grounded call returns usage tokens, the governor sees them."""
    from backend.services.kiaan_grounded_ai import call_kiaan_ai_grounded

    # Swap in our fresh governor as the singleton so we can read it back.
    monkeypatch.setattr(
        "backend.services.kiaan_cost_governor._singleton",
        fresh_governor,
        raising=False,
    )
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
            new=AsyncMock(
                return_value=(
                    "reply",
                    {"prompt_tokens": 500, "completion_tokens": 500},
                )
            ),
        ),
        patch(
            "backend.services.gita_wisdom_filter.get_gita_wisdom_filter",
            return_value=fake_filter,
        ),
    ):
        await call_kiaan_ai_grounded(
            message="hi",
            db=MagicMock(),
            user_id="integration-user",
            tool_name="Ardha",
        )

    # 500/500 gpt-4o-mini = $0.000075 + $0.00030 = $0.000375 = 375 micro.
    state = await fresh_governor.get_spend_state(
        user_id="integration-user", tier=UserTier.FREE
    )
    assert state["spent_usd"] == pytest.approx(0.000375, abs=1e-6)
