"""Celery application and dispatch helpers."""
from __future__ import annotations

import logging
from typing import Any, Dict

from celery import Celery

from backend.core.settings import settings

logger = logging.getLogger("mindvibe.queue")

celery_app = Celery(
    "mindvibe",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)
celery_app.conf.task_default_queue = settings.CELERY_DEFAULT_QUEUE
celery_app.autodiscover_tasks(["backend.services.tasks"])


def dispatch_async_task(name: str, payload: Dict[str, Any]) -> None:
    """Dispatch a task to Celery; falls back to logging when disabled."""
    if not settings.USE_CELERY:
        logger.info("celery_disabled", extra={"task": name, "payload": payload})
        return

    task_name = f"mindvibe.{name}"
    celery_app.send_task(task_name, kwargs={"payload": payload})
    logger.info("celery_task_dispatched", extra={"task": task_name})

