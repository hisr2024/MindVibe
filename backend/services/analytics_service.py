"""Central service for capturing analytics events with persistence and delivery."""

from __future__ import annotations

import logging
from datetime import datetime
import logging
from collections import defaultdict
from datetime import datetime

class AnalyticsService:
    """Persist analytics events and forward them to downstream providers."""

    def __init__(self, pipeline: EventPipeline | None = None) -> None:
        self.pipeline = pipeline or EventPipeline()
        self.buffer_limit = settings.ANALYTICS_BUFFER_LIMIT

    async def record_event(
        self,
        db: AsyncSession,
        *,
        event: str,
        user_id: str | None,
        session_id: str | None = None,
        source: str = "client",
        properties: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Store an analytics event and relay it to configured providers."""

        payload = properties or {}

        db_event = AnalyticsEvent(
            user_id=user_id,
            session_id=session_id,
            event_name=event,
            source=source,
            properties=payload,
        )
        db.add(db_event)
        await db.commit()
        await db.refresh(db_event)

        delivery_result: dict[str, Any] | None = None
        try:
            delivery_result = await self.pipeline.capture(
                event=event,
                user_id=user_id or "anonymous",
                properties={**payload, "db_event_id": db_event.id, "source": source},
            )
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.exception("analytics_delivery_failed", extra={"event": event, "error": str(exc)})

        buffered = self.pipeline.buffer_snapshot()
        if len(buffered) > self.buffer_limit:
            self.pipeline.trim_buffer(self.buffer_limit)
            buffered = self.pipeline.buffer_snapshot()
        if buffered:
            logger.info(
                "analytics_buffer_present",
                extra={"buffer_size": len(buffered), "most_recent": buffered[-1]},
            )

        return {
            "event_id": db_event.id,
            "stored": True,
            "delivery": delivery_result or {"status": "buffered", "buffer_size": len(buffered)},
        }

    async def recent_events(self, db: AsyncSession, limit: int = 50) -> list[AnalyticsEvent]:
        stmt = select(AnalyticsEvent).order_by(AnalyticsEvent.created_at.desc()).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    def buffered_events(self) -> list[dict[str, Any]]:
        return self.pipeline.buffer_snapshot()


analytics_service = AnalyticsService()
