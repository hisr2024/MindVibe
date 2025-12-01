"""Webhook ingestion with signature verification and caching."""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request, status

from backend.core.settings import settings
from backend.middleware.feature_gates import require_feature
from backend.services.cache import cache_get, cache_set
from backend.services.task_queue import dispatch_async_task

logger = logging.getLogger("mindvibe.webhooks")

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


async def _verify_signature(request: Request, secret: str) -> Dict[str, Any]:
    payload_bytes = await request.body()
    timestamp = request.headers.get("X-MindVibe-Timestamp")
    signature = request.headers.get("X-MindVibe-Signature")

    if not signature or not timestamp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing signature headers")

    if abs(time.time() - float(timestamp)) > settings.WEBHOOK_TOLERANCE_SECONDS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signature timestamp is stale")

    signed_payload = f"{timestamp}.".encode() + payload_bytes
    expected = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid signature")

    try:
        return json.loads(payload_bytes.decode("utf-8"))
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive programming
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload") from exc


@router.post("/events")
@require_feature("webhooks", minimum_plan="pro")
async def ingest_event(request: Request):
    """Receive webhook events with signature verification and idempotency cache."""
    if not settings.WEBHOOK_SIGNING_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhook signing is not configured")

    body = await _verify_signature(request, settings.WEBHOOK_SIGNING_SECRET)
    event_id = body.get("id") or body.get("event_id")
    event_type = body.get("type", "unknown")

    if event_id:
        cache_key = f"webhook:event:{event_id}"
        try:
            if await cache_get(cache_key):
                return {"status": "ignored", "reason": "duplicate"}
            await cache_set(cache_key, "processed", ttl_seconds=86400)
        except Exception as exc:  # pragma: no cover - cache connectivity guard
            logger.warning("webhook_cache_unavailable", extra={"error": str(exc)})

    dispatch_async_task("webhook_event", {"type": event_type, "payload": body})

    logger.info("webhook_received", extra={"event_type": event_type, "event_id": event_id})
    return {"status": "accepted", "event_type": event_type, "cached": bool(event_id)}


@router.get("/health", tags=["health"])
async def webhook_health():
    return {"status": "ok", "feature": "webhooks"}

