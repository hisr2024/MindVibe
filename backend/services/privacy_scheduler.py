"""Privacy scheduler — executes deletions whose grace period has ended.

Without this worker, :meth:`PrivacyService.initiate_soft_delete` is a
no-op from a compliance standpoint: the 30-day countdown elapses but
no one ever calls :meth:`PrivacyService.hard_delete_user`, and the
user's data sits forever in the database.

Two ways to run this:

1. **In-process loop** — :class:`PrivacyScheduler`, started from
   FastAPI's ``@app.on_event("startup")`` hook alongside the
   Gita auto-enricher.  This is the zero-infrastructure option and is
   the one ``backend/main.py`` wires up by default.  It is **disabled
   by default** (``PRIVACY_SCHEDULER_ENABLED=true`` opt-in) so CI and
   local dev don't start deleting accounts during tests.

2. **One-shot CLI** — ``backend/scripts/run_privacy_hard_deletes.py``
   runs a single tick and exits.  Wire this into Render's cron / a
   systemd timer / ``kubectl create cronjob`` for deployments where
   the API process is frequently restarted (Render free tier) and an
   in-process loop would miss ticks.

Source of truth
---------------
``PrivacyRequest`` rows (``request_type='delete'``,
``status='pending_deletion'``, ``scheduled_deletion_at <= now()``).
We do **not** rely on ``users.is_soft_deleted`` / ``deletion_scheduled_at``
columns because the privacy-requests table already carries the full
lifecycle and avoids a second migration.

Safety
------
* Each user is processed in its own transaction so one failure doesn't
  block the rest of the batch.
* Every successful deletion flips the request to ``completed`` and
  stamps ``updated_at``; failures stay in ``pending_deletion`` and are
  logged, so the next tick retries them.
* A hard **batch cap** (``PRIVACY_SCHEDULER_MAX_PER_TICK``) limits blast
  radius if a bug somehow mass-schedules deletions.

KIAAN Impact: ✅ POSITIVE — completes the GDPR Art. 17 contract.
"""

from __future__ import annotations

import asyncio
import datetime
import logging
import os

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from backend.models import PrivacyRequest

logger = logging.getLogger(__name__)


SCHEDULER_ENABLED = os.getenv("PRIVACY_SCHEDULER_ENABLED", "false").lower() in (
    "true",
    "1",
    "yes",
)
# How often the in-process loop wakes up to check.  A coarser cadence
# (1 hour) is fine because deletions are only scheduled ~30 days out.
SCHEDULER_INTERVAL_SECONDS = int(
    os.getenv("PRIVACY_SCHEDULER_INTERVAL_SECONDS", str(60 * 60))
)
# Cap the number of deletions processed per tick to bound the blast
# radius of any runaway situation.
SCHEDULER_MAX_PER_TICK = int(os.getenv("PRIVACY_SCHEDULER_MAX_PER_TICK", "100"))
# Delay before the first run so we don't collide with app startup.
SCHEDULER_INITIAL_DELAY_SECONDS = int(
    os.getenv("PRIVACY_SCHEDULER_INITIAL_DELAY_SECONDS", "60")
)


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.UTC)


async def _find_due_requests(
    session: AsyncSession, limit: int
) -> list[PrivacyRequest]:
    """Return deletion requests whose grace period has elapsed."""
    stmt = (
        select(PrivacyRequest)
        .where(
            PrivacyRequest.request_type == "delete",
            PrivacyRequest.status == "pending_deletion",
            PrivacyRequest.scheduled_deletion_at.is_not(None),
            PrivacyRequest.scheduled_deletion_at <= _now(),
        )
        .order_by(PrivacyRequest.scheduled_deletion_at.asc())
        .limit(limit)
    )
    return list((await session.execute(stmt)).scalars().all())


async def run_hard_deletes_once(
    session_maker: async_sessionmaker[AsyncSession],
    max_per_tick: int = SCHEDULER_MAX_PER_TICK,
) -> dict[str, int]:
    """Process one tick of hard deletions.

    Returns a small stats dict — useful for logs and tests.  Each user
    is handled in its own session so a single failure doesn't abort
    the whole batch.
    """
    from backend.services.privacy_service import PrivacyService

    # Snapshot the due list in a lightweight read-only session first so
    # we release the connection before the per-user work begins.
    async with session_maker() as session:
        due = await _find_due_requests(session, max_per_tick)

    stats = {"found": len(due), "deleted": 0, "failed": 0}
    if not due:
        return stats

    logger.info(
        "PrivacyScheduler: processing %d due deletion(s)", len(due)
    )

    for request in due:
        user_id = request.user_id
        req_id = request.id
        try:
            async with session_maker() as session:
                service = PrivacyService(session)
                await service.hard_delete_user(user_id)

                # Mark the privacy request as completed in a separate
                # statement because ``hard_delete_user`` may have deleted
                # the row itself if ``privacy_requests`` is in the
                # cascade list.
                await _mark_completed_if_present(session, req_id)
                await session.commit()

            stats["deleted"] += 1
            logger.info(
                "PrivacyScheduler: hard-deleted user=%s (request=%s)",
                user_id,
                req_id,
            )
        except Exception as e:
            stats["failed"] += 1
            logger.exception(
                "PrivacyScheduler: hard-delete failed for user=%s: %s",
                user_id,
                e,
            )

    return stats


async def _mark_completed_if_present(
    session: AsyncSession, request_id: str
) -> None:
    """Best-effort: flip the deletion request to ``completed``.

    ``hard_delete_user`` cascades through ``privacy_requests``, so the
    row may already be gone.  If it is, we simply skip.
    """
    try:
        req = await session.get(PrivacyRequest, request_id)
        if req is not None:
            req.status = "completed"
    except Exception as e:
        logger.debug(
            "Could not mark privacy request %s completed: %s", request_id, e
        )


class PrivacyScheduler:
    """In-process async loop that runs :func:`run_hard_deletes_once`."""

    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._running = False
        self._session_maker: async_sessionmaker[AsyncSession] | None = None
        self._last_run: datetime.datetime | None = None
        self._last_stats: dict[str, int] = {}

    async def start(self) -> None:
        """Start the background loop if enabled via env."""
        if self._running:
            return
        if not SCHEDULER_ENABLED:
            logger.info(
                "PrivacyScheduler disabled — set "
                "PRIVACY_SCHEDULER_ENABLED=true to enable"
            )
            return

        # Import lazily so this module has no import-time dependency on
        # the DB engine (matters for unit tests).
        from backend import deps

        self._session_maker = deps.SessionLocal
        self._running = True
        self._task = asyncio.create_task(self._loop(), name="privacy_scheduler")
        logger.info(
            "PrivacyScheduler started (interval=%ds, max_per_tick=%d)",
            SCHEDULER_INTERVAL_SECONDS,
            SCHEDULER_MAX_PER_TICK,
        )

    async def stop(self) -> None:
        """Cancel the background loop."""
        import contextlib

        self._running = False
        if self._task is not None:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
            self._task = None
        logger.info("PrivacyScheduler stopped")

    async def _loop(self) -> None:
        """Main loop: sleep, tick, repeat."""
        await asyncio.sleep(SCHEDULER_INITIAL_DELAY_SECONDS)
        while self._running:
            try:
                assert self._session_maker is not None
                stats = await run_hard_deletes_once(
                    self._session_maker, SCHEDULER_MAX_PER_TICK
                )
                self._last_run = _now()
                self._last_stats = stats
            except asyncio.CancelledError:
                raise
            except Exception as e:  # pragma: no cover - defensive
                logger.exception(
                    "PrivacyScheduler tick crashed (will retry): %s", e
                )
            try:
                await asyncio.sleep(SCHEDULER_INTERVAL_SECONDS)
            except asyncio.CancelledError:
                raise

    @property
    def status(self) -> dict[str, object]:
        """Return a status snapshot (useful for /health / admin routes)."""
        return {
            "enabled": SCHEDULER_ENABLED,
            "running": self._running,
            "last_run": self._last_run.isoformat() if self._last_run else None,
            "last_stats": dict(self._last_stats),
            "interval_seconds": SCHEDULER_INTERVAL_SECONDS,
        }


# Module-level singleton, wired up from ``backend/main.py``.
privacy_scheduler = PrivacyScheduler()
