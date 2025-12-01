"""Lightweight background job runner for async journal insights."""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Awaitable, Callable

from backend.core.settings import settings
from backend.services.task_queue import dispatch_async_task

logger = logging.getLogger("mindvibe.jobs")


@dataclass
class TaskEnvelope:
    name: str
    payload: dict


class JobQueue:
    def __init__(self) -> None:
        self.queue: asyncio.Queue[TaskEnvelope] = asyncio.Queue()
        self._worker: asyncio.Task | None = None

    async def start(self) -> None:
        if self._worker:
            return
        self._worker = asyncio.create_task(self._run())

    async def _run(self):
        while True:
            task = await self.queue.get()
            try:
                await self._dispatch(task)
            except Exception as exc:  # pragma: no cover - defensive logging
                logger.exception("job_failed", extra={"name": task.name, "error": str(exc)})
            finally:
                self.queue.task_done()

    async def _dispatch(self, task: TaskEnvelope) -> None:
        if settings.USE_CELERY:
            dispatch_async_task(task.name, task.payload)
            return
        if task.name == "journal_summary":
            await self._generate_summary(task.payload)
        else:
            logger.warning("unknown_task", extra={"name": task.name})

    async def _generate_summary(self, payload: dict) -> None:
        # Placeholder for actual LLM-powered summarization
        logger.info("summary_generated", extra={"entry_id": payload.get("entry_id")})

    async def enqueue(self, name: str, payload: dict) -> None:
        await self.queue.put(TaskEnvelope(name=name, payload=payload))


job_queue = JobQueue()


async def ensure_jobs_started() -> None:
    if settings.USE_CELERY:
        logger.info("celery_mode_enabled")
        return
    await job_queue.start()


async def enqueue_journal_summary(entry_id: int, user_id: int) -> None:
    payload = {"entry_id": entry_id, "user_id": user_id}
    if settings.USE_CELERY:
        dispatch_async_task("journal_summary", payload)
        return
    await job_queue.enqueue("journal_summary", payload)
