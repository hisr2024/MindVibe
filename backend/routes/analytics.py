"""Analytics ingestion endpoints for in-product behavioral metrics."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class AnalyticsEventPayload(BaseModel):
    event: str = Field(..., description="Human-readable event name")
    user_id: Optional[str] = Field(None, description="Distinct user identifier or anonymous key")
    session_id: Optional[str] = Field(None, description="Client session identifier")
    source: str = Field("client", description="Source context for the event")
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)


@router.post("/events")
async def ingest_event(payload: AnalyticsEventPayload, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Capture a single analytics event, persist it, and forward to providers."""

    result = await analytics_service.record_event(
        db,
        event=payload.event,
        user_id=payload.user_id,
        session_id=payload.session_id,
        source=payload.source,
        properties=payload.properties,
    )
    return {"status": "ok", "result": result}


@router.get("/events/recent")
async def recent_events(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Return the most recent stored analytics events and any buffered deliveries."""

    events = await analytics_service.recent_events(db)
    return {
        "events": [
            {
                "id": event.id,
                "event": event.event_name,
                "user_id": event.user_id,
                "source": event.source,
                "properties": event.properties or {},
                "created_at": event.created_at.isoformat() if event.created_at else None,
            }
            for event in events
        ],
        "buffer": analytics_service.buffered_events(),
    }
