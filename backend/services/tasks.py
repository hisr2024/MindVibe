"""Celery tasks for MindVibe."""
from __future__ import annotations

import logging
from typing import Any, Dict

from backend.services.task_queue import celery_app

logger = logging.getLogger("mindvibe.tasks")


@celery_app.task(name="mindvibe.webhook_event")
def process_webhook_event(payload: Dict[str, Any]):
    logger.info("processing_webhook_event", extra={"keys": list(payload.keys())})
    return {"processed": True, "event_type": payload.get("type")}


@celery_app.task(name="mindvibe.journal_summary")
def generate_journal_summary(payload: Dict[str, Any]):
    logger.info("journal_summary_requested", extra={"entry_id": payload.get("entry_id"), "user_id": payload.get("user_id")})
    return {"status": "scheduled", "entry_id": payload.get("entry_id")}

