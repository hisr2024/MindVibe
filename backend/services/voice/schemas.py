"""Voice REST endpoint schemas.

These are the exact shapes returned by:
  • GET /api/voice/quota
  • GET /api/voice/persona-version
  • GET /api/admin/wisdom-telemetry/voice  (admin only)

The mobile client calls /quota and /persona-version pre-flight, BEFORE
opening the WSS, so no audio recording starts on a tier or persona
mismatch. Schemas frozen by Pydantic so a forgotten field gets a clear
type error rather than a silent KeyError on the client.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ─── Tier / quota ─────────────────────────────────────────────────────────


class VoiceQuotaTierMatrixEntry(BaseModel):
    """A single row in the tier matrix (Free / Bhakta / Sadhak / Siddha).

    Returned alongside the user's own quota so the mobile UI can render
    the upgrade sheet with concrete numbers."""

    model_config = ConfigDict(extra="forbid")
    tier: Literal["free", "bhakta", "sadhak", "siddha"]
    minutes_per_day: int | None = None  # None means unlimited
    engines: list[str] = Field(default_factory=list)
    notes: str = ""


class VoiceQuotaResponse(BaseModel):
    """Result of GET /api/voice/quota.

    Mobile client behavior per spec:
      • minutes_remaining_today == 0  → block WSS connect, show upgrade sheet
      • minutes_remaining_today > 0   → open WSS
      • cap_minutes_per_day is None   → unlimited (Sadhak / Siddha)
    """

    model_config = ConfigDict(extra="forbid")

    user_id: str
    tier: Literal["free", "bhakta", "sadhak", "siddha"]
    minutes_used_today: int = Field(ge=0)
    cap_minutes_per_day: int | None = None  # None == unlimited
    minutes_remaining_today: int | None = None  # None == unlimited
    can_start_session: bool
    reason: str  # human-readable, used by mobile for the upgrade sheet copy
    persona_version: str
    tier_matrix: list[VoiceQuotaTierMatrixEntry]


# ─── Persona version ──────────────────────────────────────────────────────


class VoicePersonaVersionResponse(BaseModel):
    """Result of GET /api/voice/persona-version.

    Client compares this to its own cached value. If they differ, the
    client refuses to open the WSS (and surfaces an "update the app"
    upgrade prompt) rather than letting the WSS handler reject with
    PERSONA_VERSION_MISMATCH after the connection is up.
    """

    model_config = ConfigDict(extra="forbid")

    persona_version: str  # "1.0.0"
    schema_version: str   # "1.0.0" — WSS frame protocol version
    subprotocol: str      # "kiaan-voice-v1"
    server_loaded_at_iso: str  # when the server cached the persona file


# ─── Admin telemetry ──────────────────────────────────────────────────────


class VoiceTelemetryAdminResponse(BaseModel):
    """Result of GET /api/admin/wisdom-telemetry/voice.

    Surfaces the voice-channel rollup the dashboard renders: deliveries,
    completion rate, barge-in rate, filter pass rate, tier-fallback rate,
    cache hit rate, first-byte latency average. Counts are cumulative
    since process start (paired with a delivery_channel='voice_*' filter
    on the wisdom_effectiveness table for historical per-day analysis)."""

    model_config = ConfigDict(extra="forbid")

    deliveries_total: int
    outcomes_total: int
    completed_listening_count: int
    barge_in_count: int
    tier_fallback_count: int
    first_byte_ms_avg: float | None
    completed_listening_rate: float | None
    barge_in_rate: float | None
    filter_pass_rate: float | None
    tier_fallback_rate: float | None
    cache_hit_rate: float | None


__all__ = [
    "VoiceQuotaResponse",
    "VoiceQuotaTierMatrixEntry",
    "VoicePersonaVersionResponse",
    "VoiceTelemetryAdminResponse",
]
