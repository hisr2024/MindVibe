"""HTTP routes for the Sakha safety audio bundle.

  GET /static/voice/safety/{filename}    — serves the .opus file.
                                           Returns 503 with header
                                           X-Sakha-Asset-Status: placeholder
                                           when only the placeholder exists.
  GET /api/voice/safety/manifest         — aggregate status across all
                                           30 slots; mobile preflight reads
                                           this so we can warn before
                                           crisis hits.

The mobile client is expected to follow this fallback chain:
   1. fetch /static/voice/safety/<file> — if 200, play it
   2. if 503 (placeholder) — fall back to wisdom_engine voice arc
      synthesized live by the WSS turn
   3. if 5xx — show CrisisOverlay copy without audio (worst case)

Filename format on the wire: <category>.<lang>.opus
                                                     ↑       ↑       ↑
                                  one of: crisis_routing, quota_upgrade,
                                          silence_hum
                                            one of the 10 supported langs
"""

from __future__ import annotations

import logging
import re

from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import FileResponse, JSONResponse

from backend.services.voice.safety_audio import (
    AssetStatus,
    manifest_summary,
    resolve,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["voice-safety-audio"])

_FILENAME_RE = re.compile(
    r"^(crisis_routing|quota_upgrade|silence_hum)\.([a-z]{2})\.opus$"
)


@router.get("/static/voice/safety/{filename}")
async def serve_safety_audio(filename: str) -> Response:
    """Serve a Sakha safety audio file by canonical filename.

    Filename must match `<category>.<lang>.opus` exactly. Anything else
    is rejected with 400 to prevent path traversal.
    """
    match = _FILENAME_RE.match(filename)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid safety audio filename: {filename!r}",
        )
    category, lang = match.group(1), match.group(2)
    res = resolve(category, lang)

    if res.status == AssetStatus.REAL and res.path is not None:
        return FileResponse(
            path=str(res.path),
            media_type="audio/opus",
            filename=filename,
            headers={
                "Cache-Control": "public, max-age=86400, immutable",
                "X-Sakha-Asset-Status": "real",
                "X-Sakha-Voice-Id": res.voice_id,
                "X-Sakha-Slot-Id": res.slot_id,
                "X-Sakha-Expected-Duration-Sec": str(res.expected_duration_sec),
                "ETag": f'"{res.sha256[:16]}"' if res.sha256 else '"unknown"',
            },
        )

    if res.status == AssetStatus.PLACEHOLDER:
        # 503 lets the mobile client distinguish "asset not yet shipped"
        # from "server is broken" — the former is a graceful fallback,
        # the latter is an outage.
        return Response(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=(
                f"Safety audio slot {res.slot_id} is a placeholder. "
                "The mobile client should fall back to the live-TTS spoken arc."
            ),
            media_type="text/plain",
            headers={
                "X-Sakha-Asset-Status": "placeholder",
                "X-Sakha-Slot-Id": res.slot_id,
                "X-Sakha-Voice-Id": res.voice_id,
            },
        )

    # MISSING — no placeholder either, which is a deployment error
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Safety audio slot missing: {res.slot_id}",
        headers={"X-Sakha-Asset-Status": "missing"},
    )


@router.get("/api/voice/safety/manifest")
async def get_safety_manifest() -> JSONResponse:
    """Aggregate status across all 30 slots. Used by:
      • mobile preflight (alongside /api/voice/quota and persona-version)
      • admin dashboard to see which clips are still placeholders
    """
    summary = manifest_summary()
    return JSONResponse(
        content=summary,
        headers={"Cache-Control": "no-store"},
    )


__all__ = ["router"]
