"""Voice quota service — tier matrix + daily-minutes tracker.

Per spec, the WSS endpoint must NEVER cut a user off mid-utterance for
quota reasons. The mobile client is required to call GET /api/voice/quota
BEFORE opening the WSS, and we honor whatever this service returns there.

Tier matrix (from CLAUDE.md spec, FINAL.1):

  free    →  0 min/day; "upgrade to hear Sakha" pre-rendered audio
  bhakta  →  30 min/day; FRIEND + VOICE_GUIDE engines (no GUIDANCE deep mode)
  sadhak  →  unlimited; all engines + offline pre-cache top 100 verses
  siddha  →  unlimited + priority Sarvam queue + custom voice option

This module exposes:

  • VoiceQuotaService.evaluate(user_id, tier) → dict the route hands to
    the Pydantic VoiceQuotaResponse builder
  • VoiceQuotaService.record_minutes(user_id, minutes) → called by the
    WSS handler after each turn ends to add to the daily counter
  • VoiceQuotaService.reset_for_user_for_tests(user_id) → test-only

Storage today: in-process per-user counter keyed on (user_id, YYYY-MM-DD).
Production swap: replace the dict backend with redis.incrby("voice:user:
<uid>:<date>", minutes) — same key shape, same expiry semantics.

The counter expires at midnight UTC. We don't try to be clever about
midnight-spanning sessions — the counter just rolls over the next day.
"""

from __future__ import annotations

import datetime
import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)


# ─── Tier matrix (single source of truth in code) ─────────────────────────


VoiceTier = str  # one of: "free", "bhakta", "sadhak", "siddha"


@dataclass(frozen=True)
class TierConfig:
    name: VoiceTier
    minutes_per_day: int | None  # None = unlimited
    engines: tuple[str, ...]
    notes: str = ""


TIER_MATRIX: dict[VoiceTier, TierConfig] = {
    "free": TierConfig(
        name="free",
        minutes_per_day=0,
        engines=(),
        notes="Voice mode is locked. Tap to upgrade and hear Sakha aloud.",
    ),
    "bhakta": TierConfig(
        name="bhakta",
        minutes_per_day=30,
        engines=("FRIEND", "VOICE_GUIDE"),
        notes="30 minutes/day; FRIEND + Voice Guide engines.",
    ),
    "sadhak": TierConfig(
        name="sadhak",
        minutes_per_day=None,
        engines=("FRIEND", "GUIDANCE", "VOICE_GUIDE", "ASSISTANT"),
        notes="Unlimited. Offline pre-cache of top 100 verses.",
    ),
    "siddha": TierConfig(
        name="siddha",
        minutes_per_day=None,
        engines=("FRIEND", "GUIDANCE", "VOICE_GUIDE", "ASSISTANT"),
        notes="Unlimited + priority TTS queue + custom voice option.",
    ),
}


def normalize_tier(raw: str | None) -> VoiceTier:
    """Coerce arbitrary tier strings to one of the four canonical names.

    Unknown / missing → 'free' (the safe default — never grants access
    we shouldn't grant)."""
    if not raw:
        return "free"
    norm = raw.lower().strip()
    return norm if norm in TIER_MATRIX else "free"


# ─── Storage backend ──────────────────────────────────────────────────────


class _DailyCounter:
    """In-memory daily-minutes counter. (user_id, YYYY-MM-DD UTC) → minutes.

    Production target: swap for Redis with key 'voice:user:<uid>:<date>'
    and a TTL of 36h to handle midnight-spanning queries cleanly.
    Interface preserved so the swap is local to this class.
    """

    def __init__(self) -> None:
        self._counts: dict[tuple[str, str], int] = {}

    @staticmethod
    def _today_utc() -> str:
        return datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d")

    def get(self, user_id: str) -> int:
        return self._counts.get((user_id, self._today_utc()), 0)

    def add(self, user_id: str, minutes: int) -> int:
        if minutes <= 0:
            return self.get(user_id)
        key = (user_id, self._today_utc())
        self._counts[key] = self._counts.get(key, 0) + minutes
        return self._counts[key]

    def reset(self, user_id: str) -> None:
        # Drop every (uid, date) entry for this user — reset across days
        # too so tests don't leak.
        keys = [k for k in self._counts if k[0] == user_id]
        for k in keys:
            del self._counts[k]


# ─── Service ──────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class QuotaEvaluation:
    """Decision plus the metadata the route needs to build the response."""

    tier: VoiceTier
    cap_minutes_per_day: int | None
    minutes_used_today: int
    minutes_remaining_today: int | None
    can_start_session: bool
    reason: str


class VoiceQuotaService:
    """Per-process quota service. Exposed via singleton get_voice_quota_service().

    Methods are sync — the underlying counter is in-memory. When Redis is
    wired, async-ify the methods that touch the counter. The route layer
    is async-ready already.
    """

    def __init__(self) -> None:
        self._counter = _DailyCounter()

    def evaluate(self, *, user_id: str, tier: str | None) -> QuotaEvaluation:
        """Decide whether `user_id` (currently on `tier`) may open a WSS.

        Returns a QuotaEvaluation. The caller (route) projects this into
        the VoiceQuotaResponse Pydantic shape."""
        canonical = normalize_tier(tier)
        cfg = TIER_MATRIX[canonical]
        used = self._counter.get(user_id)

        if cfg.minutes_per_day is None:
            return QuotaEvaluation(
                tier=canonical,
                cap_minutes_per_day=None,
                minutes_used_today=used,
                minutes_remaining_today=None,
                can_start_session=True,
                reason="Unlimited voice access on this tier.",
            )

        if cfg.minutes_per_day <= 0:
            return QuotaEvaluation(
                tier=canonical,
                cap_minutes_per_day=0,
                minutes_used_today=used,
                minutes_remaining_today=0,
                can_start_session=False,
                reason=cfg.notes,
            )

        remaining = max(cfg.minutes_per_day - used, 0)
        return QuotaEvaluation(
            tier=canonical,
            cap_minutes_per_day=cfg.minutes_per_day,
            minutes_used_today=used,
            minutes_remaining_today=remaining,
            can_start_session=remaining > 0,
            reason=(
                f"{remaining} minute(s) remaining today on {canonical} tier."
                if remaining > 0
                else f"Daily voice quota reached on {canonical} tier "
                "(resets at midnight UTC)."
            ),
        )

    def record_minutes(self, *, user_id: str, minutes: int) -> int:
        """Add minutes to the user's daily counter. Returns the new total.

        Called by the WSS handler after each turn ends. We deliberately
        round UP to the nearest whole minute so a 5-second turn still
        counts — voice minutes are coarse-grained billing, not exact
        runtime."""
        whole = max(int(minutes + 0.999), 0)
        new_total = self._counter.add(user_id, whole)
        logger.info(
            "voice.quota record user=%s +%d min total=%d",
            user_id[:8] + "…" if len(user_id) > 8 else user_id,
            whole, new_total,
        )
        return new_total

    def reset_for_user_for_tests(self, user_id: str) -> None:
        """Test-only counter reset. Refuses to run in non-test environments
        so a misuse in production cannot quietly grant unlimited minutes."""
        if os.environ.get("KIAAN_VOICE_QUOTA_TEST") != "1":
            raise RuntimeError(
                "reset_for_user_for_tests called outside test env. "
                "Set KIAAN_VOICE_QUOTA_TEST=1 if intentional."
            )
        self._counter.reset(user_id)


# ─── Singleton ────────────────────────────────────────────────────────────


_service_instance: VoiceQuotaService | None = None


def get_voice_quota_service() -> VoiceQuotaService:
    global _service_instance
    if _service_instance is None:
        _service_instance = VoiceQuotaService()
    return _service_instance


__all__ = [
    "TIER_MATRIX",
    "TierConfig",
    "VoiceTier",
    "QuotaEvaluation",
    "VoiceQuotaService",
    "normalize_tier",
    "get_voice_quota_service",
]
