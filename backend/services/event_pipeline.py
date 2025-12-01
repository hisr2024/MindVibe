"""Unified event pipeline that can forward events to PostHog or Segment."""

from __future__ import annotations

import asyncio
import base64
import json
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx


@dataclass
class EventPipelineConfig:
    """Runtime configuration for the analytics pipeline."""

    posthog_host: str = os.getenv("POSTHOG_HOST", "")
    posthog_api_key: str = os.getenv("POSTHOG_API_KEY", "")
    segment_write_key: str = os.getenv("SEGMENT_WRITE_KEY", "")
    timeout_seconds: float = float(os.getenv("EVENT_PIPELINE_TIMEOUT", "5"))

    @property
    def enabled(self) -> bool:
        return bool(self.posthog_api_key or self.segment_write_key)


class EventPipeline:
    """Dispatch analytics events to PostHog or Segment with graceful fallbacks."""

    def __init__(self, config: Optional[EventPipelineConfig] = None) -> None:
        self.config = config or EventPipelineConfig()
        self._buffer: list[dict[str, Any]] = []

    async def capture(
        self, event: str, user_id: str, properties: Optional[Dict[str, Any]] = None
    ) -> dict[str, Any]:
        payload = {
            "event": event,
            "user_id": user_id,
            "properties": properties or {},
        }

        if not self.config.enabled:
            self._buffer.append({**payload, "status": "buffered"})
            return {"status": "buffered", "buffer_size": len(self._buffer)}

        results: list[dict[str, Any]] = []
        errors: list[str] = []

        async with httpx.AsyncClient(timeout=self.config.timeout_seconds) as client:
            tasks = []
            if self.config.posthog_api_key:
                tasks.append(self._send_posthog(client, payload))
            if self.config.segment_write_key:
                tasks.append(self._send_segment(client, payload))

            responses = await asyncio.gather(*tasks, return_exceptions=True)
            for response in responses:
                if isinstance(response, Exception):
                    errors.append(str(response))
                else:
                    results.append(response)

        status = "partial_success" if errors and results else ("failed" if errors else "sent")
        if errors:
            self._buffer.append({**payload, "status": status, "errors": errors})
        return {"status": status, "results": results, "errors": errors, "buffer_size": len(self._buffer)}

    async def _send_posthog(self, client: httpx.AsyncClient, payload: dict[str, Any]) -> dict[str, Any]:
        data = {
            "api_key": self.config.posthog_api_key,
            "event": payload["event"],
            "properties": {**payload.get("properties", {}), "distinct_id": payload["user_id"]},
        }
        host = self.config.posthog_host.rstrip("/") or "https://app.posthog.com"
        response = await client.post(f"{host}/capture/", json=data)
        response.raise_for_status()
        return {"provider": "posthog", "status_code": response.status_code}

    async def _send_segment(self, client: httpx.AsyncClient, payload: dict[str, Any]) -> dict[str, Any]:
        auth = base64.b64encode(f"{self.config.segment_write_key}:".encode()).decode()
        data = {
            "userId": payload["user_id"],
            "event": payload["event"],
            "properties": payload.get("properties", {}),
        }
        response = await client.post(
            "https://api.segment.io/v1/track",
            headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
            content=json.dumps(data),
        )
        response.raise_for_status()
        return {"provider": "segment", "status_code": response.status_code}

    def flush_buffer(self) -> list[dict[str, Any]]:
        buffered = self._buffer.copy()
        self._buffer.clear()
        return buffered
