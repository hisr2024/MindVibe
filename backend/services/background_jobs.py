"""Lightweight background job runner for async journal insights and analytics."""
from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.ext.asyncio import async_sessionmaker

from backend.services.mood_analytics import (
    compute_daily_mood_summary,
    persist_summary_report,
)
from backend.services.backup import run_backup
from backend.services.data_retention import enforce_journal_retention, retention_interval_seconds

from backend.core.settings import settings
from backend.services.task_queue import dispatch_async_task

logger = logging.getLogger("mindvibe.jobs")

SUMMARY_INTERVAL_SECONDS = int(os.getenv("MOOD_SUMMARY_INTERVAL_SECONDS", "86400"))
BACKUP_INTERVAL_SECONDS = int(os.getenv("BACKUP_INTERVAL_SECONDS", "86400"))
AUTOMATED_BACKUPS_ENABLED = os.getenv("ENABLE_AUTOMATED_BACKUPS", "true").lower() in (
    "1",
    "true",
    "yes",
)


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


class BackgroundOrchestrator:
    def __init__(self) -> None:
        self.summary_task: asyncio.Task | None = None
        self.backup_task: asyncio.Task | None = None
        self.retention_task: asyncio.Task | None = None

    async def start(self, session_factory: Optional[async_sessionmaker] = None) -> None:
        if session_factory:
            await self._start_summary_loop(session_factory)
            await self._start_retention_loop(session_factory)
        await self._start_backup_loop()

    async def _start_summary_loop(self, session_factory: async_sessionmaker) -> None:
        if self.summary_task:
            return

        async def _runner() -> None:
            while True:
                try:
                    summary = await compute_daily_mood_summary(session_factory)
                    await persist_summary_report(summary)
                    logger.info(
                        "daily_mood_summary",
                        extra={"count": summary.get("count", 0)},
                    )
                except Exception as exc:  # pragma: no cover - defensive
                    logger.exception("summary_generation_failed", exc_info=exc)
                await asyncio.sleep(SUMMARY_INTERVAL_SECONDS)

        self.summary_task = asyncio.create_task(_runner())

    async def _start_backup_loop(self) -> None:
        if self.backup_task or not AUTOMATED_BACKUPS_ENABLED:
            return

        async def _runner() -> None:
            while True:
                try:
                    await asyncio.to_thread(run_backup)
                    logger.info("backup_completed")
                except Exception as exc:  # pragma: no cover - defensive
                    logger.exception("backup_failed", exc_info=exc)
                await asyncio.sleep(BACKUP_INTERVAL_SECONDS)

        self.backup_task = asyncio.create_task(_runner())

    async def _start_retention_loop(self, session_factory: async_sessionmaker) -> None:
        if self.retention_task:
            return

        interval = retention_interval_seconds()

        async def _runner() -> None:
            while True:
                try:
                    purged = await enforce_journal_retention(session_factory)
                    logger.info(
                        "retention_enforced",
                        extra={"purged": purged, "interval_seconds": interval},
                    )
                except Exception as exc:  # pragma: no cover - defensive
                    logger.exception("retention_enforcement_failed", exc_info=exc)
                await asyncio.sleep(interval)

        self.retention_task = asyncio.create_task(_runner())


orchestrator = BackgroundOrchestrator()


async def ensure_jobs_started(session_factory: Optional[async_sessionmaker] = None) -> None:
    await job_queue.start()
    await orchestrator.start(session_factory)


async def enqueue_journal_summary(entry_id: int, user_id: int) -> None:
    payload = {"entry_id": entry_id, "user_id": user_id}
    if settings.USE_CELERY:
        dispatch_async_task("journal_summary", payload)
        return
    await job_queue.enqueue("journal_summary", payload)
