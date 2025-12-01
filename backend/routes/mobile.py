"""Mobile app focused, versioned endpoints reused by React Native clients."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter(prefix="/mobile", tags=["mobile-app"])


@router.get("/manifest")
async def mobile_manifest() -> Dict[str, Any]:
    return {
        "platform": "react-native",
        "version": "1.0",
        "endpoints": {
            "recommendations": "/api/v1/recommendations/{user_id}",
            "coach_analytics": {
                "overview": "/api/v1/coach/analytics/overview",
                "mood_trend": "/api/v1/coach/analytics/mood-trend",
            },
            "live_stream": "/api/v1/live/journal/{user_id}",
        },
        "notes": [
            "All endpoints are versioned under /api/v1 for safe mobile reuse.",
            "WebSocket endpoints stream journaling updates in real time.",
        ],
    }
