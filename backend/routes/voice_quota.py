"""REST endpoints for the Sakha Voice Companion preflight.

  GET /api/voice/quota             — daily quota + tier matrix
  GET /api/voice/persona-version   — pinned persona/schema/subprotocol

The mobile client calls BOTH of these BEFORE opening the WSS at
/voice-companion/converse so we never start audio recording on a tier
that has no voice access or against a server with a mismatched persona.

Auth: in production these endpoints sit behind the existing FastAPI JWT
dependency (backend.deps.get_current_user). For Part 6 we take an explicit
`user_id` and `tier` query param so the routes are independently testable
and the mobile integration test in Part 12 can drive them. The wiring
into main.py with the JWT dependency is a one-line swap of `Query` for
`Depends(get_current_user)`.
"""

from __future__ import annotations

import datetime
import logging

from fastapi import APIRouter, HTTPException, Query, status

from backend.services.prompt_loader import (
    PromptLoaderError,
    get_persona,
    get_persona_version,
)
from backend.services.voice.quota_service import (
    TIER_MATRIX,
    get_voice_quota_service,
)
from backend.services.voice.schemas import (
    VoicePersonaVersionResponse,
    VoiceQuotaResponse,
    VoiceQuotaTierMatrixEntry,
)
from backend.services.voice.wss_frames import SCHEMA_VERSION, SUBPROTOCOL

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice-preflight"])


def _tier_matrix_for_response() -> list[VoiceQuotaTierMatrixEntry]:
    """Project TIER_MATRIX into the response shape."""
    return [
        VoiceQuotaTierMatrixEntry(
            tier=cfg.name,  # type: ignore[arg-type]
            minutes_per_day=cfg.minutes_per_day,
            engines=list(cfg.engines),
            notes=cfg.notes,
        )
        for cfg in TIER_MATRIX.values()
    ]


@router.get("/quota", response_model=VoiceQuotaResponse)
async def get_voice_quota(
    user_id: str = Query(..., min_length=1, max_length=128),
    tier: str = Query(default="free", min_length=1, max_length=16),
) -> VoiceQuotaResponse:
    """Pre-flight quota check for the Sakha voice WSS.

    The response tells the mobile client three things:
      1. Whether to even open the WSS (`can_start_session`)
      2. How many minutes remain today (`minutes_remaining_today`)
      3. The full tier matrix so the upgrade sheet can render concrete numbers

    No DB call. No third-party API call. Designed to be sub-50ms on a
    healthy server so the mobile app feels snappy.
    """
    service = get_voice_quota_service()
    evaluation = service.evaluate(user_id=user_id, tier=tier)

    try:
        persona_version = get_persona_version()
    except PromptLoaderError as e:
        logger.error("voice.quota persona-version load failed: %s", e)
        # We can still answer the quota question even if persona load fails —
        # but the mobile client wouldn't be able to open WSS anyway, so we
        # surface the failure as a 500.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"persona-version unavailable: {e}",
        ) from e

    return VoiceQuotaResponse(
        user_id=user_id,
        tier=evaluation.tier,  # type: ignore[arg-type]
        minutes_used_today=evaluation.minutes_used_today,
        cap_minutes_per_day=evaluation.cap_minutes_per_day,
        minutes_remaining_today=evaluation.minutes_remaining_today,
        can_start_session=evaluation.can_start_session,
        reason=evaluation.reason,
        persona_version=persona_version,
        tier_matrix=_tier_matrix_for_response(),
    )


@router.get("/persona-version", response_model=VoicePersonaVersionResponse)
async def get_voice_persona_version() -> VoicePersonaVersionResponse:
    """Pre-flight persona/schema/subprotocol check.

    Mobile client compares persona_version to its cached value. On
    mismatch the client refuses to open WSS — better to surface "update
    the app" before the connection than after."""
    try:
        persona = get_persona("voice")
    except PromptLoaderError as e:
        logger.error("voice.persona-version load failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"persona unavailable: {e}",
        ) from e

    return VoicePersonaVersionResponse(
        persona_version=persona.persona_version,
        schema_version=SCHEMA_VERSION,
        subprotocol=SUBPROTOCOL,
        server_loaded_at_iso=persona.loaded_at_wall_iso
        or datetime.datetime.now(datetime.UTC).isoformat(),
    )


__all__ = ["router"]
