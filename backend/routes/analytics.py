"""Analytics ingestion endpoints that forward events to PostHog or Segment."""

from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.services.event_pipeline import EventPipeline

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class AnalyticsEvent(BaseModel):
    event: str = Field(..., description="Human-readable event name")
    user_id: str = Field(..., description="Distinct user identifier")
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)


pipeline = EventPipeline()


@router.post("/events")
async def ingest_event(payload: AnalyticsEvent) -> Dict[str, Any]:
    """Capture a single analytics event and forward to configured providers."""

    result = await pipeline.capture(
        event=payload.event,
        user_id=payload.user_id,
        properties=payload.properties,
    )
    return {"status": result.get("status", "sent"), "details": result}


@router.get("/buffer")
async def buffered_events() -> Dict[str, Any]:
    """Expose buffered events when no provider keys are configured."""

    return {"buffer": pipeline.flush_buffer()}
