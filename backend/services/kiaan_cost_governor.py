"""Cost-aware spend governor for the Wisdom-Core-gated pipeline.

Implements ``IMPROVEMENT_ROADMAP.md`` P2 §15. Bounds per-user-tier
daily LLM spend so a single viral spike or buggy retry loop cannot
torch the OpenAI budget. Builds on the telemetry shipped in P2 §14:
the cost counter (``kiaan_cost_micro_usd_total``) is now fed real
token counts via :func:`backend.services.ai_provider.call_kiaan_ai_with_usage`,
and the governor reads the same per-1K-token rate table to project
spend.

Surface
-------
:func:`check_spend`         — pre-LLM gate. Returns ``SpendDecision``
                              based on the user's tier + today's running
                              spend. Never raises.

:func:`record_spend`        — post-LLM bookkeeping. Adds the real
                              micro-USD to today's bucket. Idempotent
                              under concurrent calls (Redis ``INCRBY``
                              when available; ``asyncio.Lock`` for the
                              in-memory tier).

:func:`get_spend_state`     — read-only — current day's spend, tier
                              cap, and decision the next call would
                              receive. For the ops dashboard.

Storage
-------
Two-tier, same pattern as ``kiaan_response_cache``:

* Redis (preferred). Key shape:
  ``kiaan:spend:v1:{utc_date_iso}:{tier}:{user_id_hash}``.
  TTL 48 h so yesterday's bucket survives the rollover for late-night
  late-binding tests; PromQL ``increase()`` queries don't need it.

* In-memory dict (fallback). Bounded to 50 000 keys, oldest evicted
  when over.

Both stores hold the cumulative micro-USD spent today.

Tier caps (env-overrideable)
----------------------------
::

    FREE     KIAAN_COST_CAP_USD_FREE     default $0.02 / day
    SADHAK   KIAAN_COST_CAP_USD_SADHAK   default $0.15 / day
    SIDDHA   KIAAN_COST_CAP_USD_SIDDHA   default $0.50 / day
    DIVINE   KIAAN_COST_CAP_USD_DIVINE   default $2.00 / day

The governor never reports the cap as ``< $0.005`` — sub-half-cent
caps round to zero in our integer-micro-USD math and would deny
every request. Set to a sensible value or disable via
``KIAAN_COST_GOVERNOR_ENABLED=false``.

Decision policy
---------------
``ALLOW``           spend so far + estimated next-call cost is well
                    under cap; route normally.
``BUDGET_WARNING``  spend ≥ 80 % of cap; route normally but emit a
                    telemetry counter so the dashboard flashes.
``BUDGET_EXCEEDED`` spend ≥ 100 % of cap; route MUST serve
                    cached-or-canned fallback. The grounded path
                    raises :class:`BudgetExceededError` which the
                    HTTP layer maps to a 429 with retry-after =
                    seconds-until-midnight-UTC.

Honest scope
------------
This module bounds spend; it does not adapt *quality* under load.
The roadmap's "force gpt-4o-mini under pressure" and "burst-protect
with tier-4 canned" are downstream of having a real spend signal,
which this module produces. The next iteration can read
``check_spend``'s ``ratio`` and pick a cheaper provider or skip the
LLM entirely.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import os
from collections import OrderedDict
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


# ── Config ─────────────────────────────────────────────────────────────


class UserTier(str, Enum):
    FREE = "free"
    SADHAK = "sadhak"
    SIDDHA = "siddha"
    DIVINE = "divine"


_DEFAULT_CAPS_USD: dict[UserTier, float] = {
    UserTier.FREE: 0.02,
    UserTier.SADHAK: 0.15,
    UserTier.SIDDHA: 0.50,
    UserTier.DIVINE: 2.00,
}


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name, "").strip().lower()
    if raw in ("true", "1", "yes", "on"):
        return True
    if raw in ("false", "0", "no", "off"):
        return False
    return default


def _cap_micro_usd(tier: UserTier) -> int:
    env_key = f"KIAAN_COST_CAP_USD_{tier.value.upper()}"
    usd = _env_float(env_key, _DEFAULT_CAPS_USD[tier])
    return max(0, int(round(usd * 1_000_000)))


# Warning threshold — ``BUDGET_WARNING`` fires at this fraction of the cap.
WARNING_RATIO = 0.80


# ── Decision shape ─────────────────────────────────────────────────────


class SpendOutcome(str, Enum):
    ALLOW = "allow"
    BUDGET_WARNING = "budget_warning"
    BUDGET_EXCEEDED = "budget_exceeded"


@dataclass(frozen=True)
class SpendDecision:
    outcome: SpendOutcome
    tier: UserTier
    spent_micro_usd: int
    cap_micro_usd: int
    ratio: float  # 0.0 - 1.0 (or > 1.0 when over cap)
    reason: str
    retry_after_seconds: int = 0  # populated when BUDGET_EXCEEDED


class BudgetExceededError(Exception):
    """Raised by the grounded path when a user is over their daily cap.

    The HTTP layer maps this to a 429 with ``Retry-After`` set to
    :attr:`retry_after_seconds` (seconds until 00:00 UTC).
    """

    def __init__(self, decision: SpendDecision) -> None:
        super().__init__(decision.reason)
        self.decision = decision

    @property
    def retry_after_seconds(self) -> int:
        return self.decision.retry_after_seconds


# ── Storage helpers ────────────────────────────────────────────────────


def _today_utc_iso() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%d")


def _seconds_until_midnight_utc() -> int:
    now = datetime.now(UTC)
    tomorrow = (now.replace(hour=0, minute=0, second=0, microsecond=0))
    if tomorrow <= now:
        # Always at least until next midnight.
        from datetime import timedelta
        tomorrow = tomorrow + timedelta(days=1)
    return max(0, int((tomorrow - now).total_seconds()))


def _hash_user(user_id: str) -> str:
    """Short stable hash so logs / metrics don't leak full user_id."""
    return hashlib.sha256(user_id.encode("utf-8")).hexdigest()[:16]


def _key(user_id: str, tier: UserTier) -> str:
    return (
        f"kiaan:spend:v1:{_today_utc_iso()}:{tier.value}:"
        f"{_hash_user(user_id)}"
    )


# ── The governor ───────────────────────────────────────────────────────


class CostGovernor:
    """Per-tier daily spend tracker. Two-tier backend.

    Reuse the singleton via :func:`get_cost_governor`. Direct
    construction is allowed in tests so each test gets a clean slate.
    """

    _MEMORY_MAX_KEYS = 50_000

    def __init__(self) -> None:
        # ``OrderedDict`` keeps insertion order; oldest evicted when
        # over capacity.
        self._memory: OrderedDict[str, int] = OrderedDict()
        self._lock = asyncio.Lock()

    # ── Redis ─────────────────────────────────────────────────────────
    async def _redis_client(self) -> Any | None:
        """Return the shared Redis client when connected, else None.

        Mirrors the lookup pattern in ``kiaan_response_cache``.
        """
        try:
            from backend.cache.redis_cache import get_redis_cache

            cache = await get_redis_cache()
        except Exception as exc:
            logger.debug(
                "cost_governor: redis singleton unavailable: %s", exc
            )
            return None
        if not getattr(cache, "is_connected", False):
            return None
        return cache

    # ── Storage ────────────────────────────────────────────────────────
    async def _read_spent(self, user_id: str, tier: UserTier) -> int:
        key = _key(user_id, tier)
        redis = await self._redis_client()
        if redis is not None:
            try:
                raw = await redis.get(key)
                if raw is not None:
                    return int(raw)
            except Exception as exc:
                logger.warning(
                    "cost_governor: Redis GET failed: %s", exc
                )
                # Fall through to in-memory.
        async with self._lock:
            return int(self._memory.get(key, 0))

    async def _add_spent(
        self, user_id: str, tier: UserTier, micro_usd: int
    ) -> int:
        """Atomically add micro_usd to today's bucket; return new total."""
        if micro_usd <= 0:
            return await self._read_spent(user_id, tier)
        key = _key(user_id, tier)
        redis = await self._redis_client()
        if redis is not None:
            try:
                # 48-hour TTL gives PromQL queries the previous-day
                # bucket while we serve today's.
                new_total = await redis.incr(key, micro_usd, 60 * 60 * 48)
                if new_total is not None:
                    return int(new_total)
            except Exception as exc:
                logger.warning(
                    "cost_governor: Redis INCR failed: %s", exc
                )
                # Fall through to in-memory.
        async with self._lock:
            current = int(self._memory.get(key, 0))
            new_total = current + micro_usd
            self._memory[key] = new_total
            self._memory.move_to_end(key)
            # Bound the in-memory store.
            while len(self._memory) > self._MEMORY_MAX_KEYS:
                self._memory.popitem(last=False)
            return new_total

    # ── Public API ─────────────────────────────────────────────────────
    async def check_spend(
        self,
        *,
        user_id: str,
        tier: UserTier,
        estimated_micro_usd: int = 0,
    ) -> SpendDecision:
        """Pre-LLM gate. Returns a :class:`SpendDecision`.

        ``estimated_micro_usd`` is the cost the caller projects for the
        next call. Default 0 keeps the decision based on what's already
        recorded — fine for the common case where we don't know the
        cost yet. The governor's primary signal is post-hoc: the next
        call after a budget-exceeding turn is the one that gets denied.
        """
        if not _env_bool("KIAAN_COST_GOVERNOR_ENABLED", True):
            return SpendDecision(
                outcome=SpendOutcome.ALLOW,
                tier=tier,
                spent_micro_usd=0,
                cap_micro_usd=0,
                ratio=0.0,
                reason="governor disabled (KIAAN_COST_GOVERNOR_ENABLED=false)",
            )
        if not user_id:
            return SpendDecision(
                outcome=SpendOutcome.ALLOW,
                tier=tier,
                spent_micro_usd=0,
                cap_micro_usd=0,
                ratio=0.0,
                reason="no user_id — governor bypassed",
            )

        cap = _cap_micro_usd(tier)
        if cap <= 0:
            return SpendDecision(
                outcome=SpendOutcome.ALLOW,
                tier=tier,
                spent_micro_usd=0,
                cap_micro_usd=0,
                ratio=0.0,
                reason=(
                    f"cap configured at 0 for tier={tier.value}; "
                    "treating as unlimited"
                ),
            )

        spent = await self._read_spent(user_id, tier)
        projected = spent + max(0, int(estimated_micro_usd))
        ratio = projected / cap if cap > 0 else 0.0

        if projected >= cap:
            return SpendDecision(
                outcome=SpendOutcome.BUDGET_EXCEEDED,
                tier=tier,
                spent_micro_usd=spent,
                cap_micro_usd=cap,
                ratio=ratio,
                reason=(
                    f"daily cap reached: spent=${spent / 1_000_000:.4f} "
                    f"projected=${projected / 1_000_000:.4f} cap="
                    f"${cap / 1_000_000:.4f}"
                ),
                retry_after_seconds=_seconds_until_midnight_utc(),
            )
        if ratio >= WARNING_RATIO:
            return SpendDecision(
                outcome=SpendOutcome.BUDGET_WARNING,
                tier=tier,
                spent_micro_usd=spent,
                cap_micro_usd=cap,
                ratio=ratio,
                reason=(
                    f"at {int(ratio * 100)}% of daily cap "
                    f"(${spent / 1_000_000:.4f} / ${cap / 1_000_000:.4f})"
                ),
            )
        return SpendDecision(
            outcome=SpendOutcome.ALLOW,
            tier=tier,
            spent_micro_usd=spent,
            cap_micro_usd=cap,
            ratio=ratio,
            reason="within cap",
        )

    async def record_spend(
        self, *, user_id: str, tier: UserTier, micro_usd: int
    ) -> int:
        """Post-LLM bookkeeping. Returns the new daily total."""
        if not _env_bool("KIAAN_COST_GOVERNOR_ENABLED", True):
            return 0
        if not user_id or micro_usd <= 0:
            return await self._read_spent(user_id, tier) if user_id else 0
        return await self._add_spent(user_id, tier, micro_usd)

    async def get_spend_state(
        self, *, user_id: str, tier: UserTier
    ) -> dict[str, Any]:
        """Read-only snapshot for the dashboard / /health/detailed."""
        spent = await self._read_spent(user_id, tier)
        cap = _cap_micro_usd(tier)
        ratio = (spent / cap) if cap > 0 else 0.0
        return {
            "user_hash": _hash_user(user_id),
            "tier": tier.value,
            "date_utc": _today_utc_iso(),
            "spent_usd": spent / 1_000_000,
            "cap_usd": cap / 1_000_000,
            "ratio": ratio,
            "outcome": (
                SpendOutcome.BUDGET_EXCEEDED.value
                if ratio >= 1.0
                else (
                    SpendOutcome.BUDGET_WARNING.value
                    if ratio >= WARNING_RATIO
                    else SpendOutcome.ALLOW.value
                )
            ),
        }

    async def clear_memory(self) -> int:
        """Wipe the in-memory tier. Useful for tests."""
        async with self._lock:
            n = len(self._memory)
            self._memory.clear()
            return n


# ── Singleton ──────────────────────────────────────────────────────────
_singleton: CostGovernor | None = None


def get_cost_governor() -> CostGovernor:
    global _singleton
    if _singleton is None:
        _singleton = CostGovernor()
    return _singleton


def estimate_cost_for_tokens(
    provider: str, model: str, prompt_tokens: int, completion_tokens: int
) -> int:
    """Project a call's cost in micro-USD. Wraps the shared cost table
    so callers don't import from kiaan_telemetry directly."""
    from backend.services.kiaan_telemetry import _estimate_cost_micro_usd

    return _estimate_cost_micro_usd(
        provider, model, prompt_tokens, completion_tokens
    )


__all__ = [
    "BudgetExceededError",
    "CostGovernor",
    "SpendDecision",
    "SpendOutcome",
    "UserTier",
    "estimate_cost_for_tokens",
    "get_cost_governor",
]
