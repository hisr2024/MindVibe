"""Tests for the privacy hard-delete scheduler.

Covers:

- ``_find_due_requests`` only returns deletion requests whose
  ``scheduled_deletion_at`` has elapsed (and ignores in-grace rows
  and non-delete request types).
- ``run_hard_deletes_once`` actually calls ``hard_delete_user`` and
  records stats.
- Scheduler is opt-in via ``PRIVACY_SCHEDULER_ENABLED``.
"""

from __future__ import annotations

import datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from backend.models import PrivacyRequest, User
from backend.services.privacy_scheduler import (
    PrivacyScheduler,
    _find_due_requests,
    run_hard_deletes_once,
)

# ---------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------

async def _mk_user(db: AsyncSession, uid: str) -> User:
    user = User(
        id=uid,
        auth_uid=f"auth-{uid}",
        email=f"{uid}@example.com",
        hashed_password="xxx",
        email_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def _mk_deletion(
    db: AsyncSession,
    user_id: str,
    scheduled_offset_seconds: int,
    status: str = "pending_deletion",
) -> PrivacyRequest:
    """Create a deletion ``PrivacyRequest`` with a relative schedule."""
    req = PrivacyRequest(
        user_id=user_id,
        request_type="delete",
        status=status,
        scheduled_deletion_at=datetime.datetime.now(datetime.UTC)
        + datetime.timedelta(seconds=scheduled_offset_seconds),
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req


def _session_maker_from(db: AsyncSession) -> async_sessionmaker[AsyncSession]:
    """Return a session maker that always yields the test ``db``.

    The scheduler expects an ``async_sessionmaker`` it can call like
    ``async with session_maker() as session:`` — we wrap the single
    test-scoped session in a shim so each ``async with`` block sees
    the same underlying connection.  This mirrors how
    ``test_client`` overrides ``get_db``.
    """

    class _SharedMaker:
        def __call__(self):
            return _SharedContext(db)

    class _SharedContext:
        def __init__(self, session: AsyncSession) -> None:
            self.session = session

        async def __aenter__(self) -> AsyncSession:
            return self.session

        async def __aexit__(self, *args) -> None:
            # Don't actually close — the pytest fixture owns lifecycle.
            return None

    return _SharedMaker()  # type: ignore[return-value]


# ---------------------------------------------------------------------
# _find_due_requests
# ---------------------------------------------------------------------

@pytest.mark.asyncio
async def test_find_due_ignores_future_scheduled(test_db: AsyncSession):
    """Rows scheduled for the future are not yet due."""
    user = await _mk_user(test_db, "future-user")
    await _mk_deletion(test_db, user.id, scheduled_offset_seconds=3600)
    assert await _find_due_requests(test_db, limit=10) == []


@pytest.mark.asyncio
async def test_find_due_returns_expired_rows(test_db: AsyncSession):
    user = await _mk_user(test_db, "due-user")
    req = await _mk_deletion(test_db, user.id, scheduled_offset_seconds=-60)

    due = await _find_due_requests(test_db, limit=10)
    assert len(due) == 1
    assert due[0].id == req.id


@pytest.mark.asyncio
async def test_find_due_excludes_non_delete_requests(test_db: AsyncSession):
    """Export rows, even with a scheduled_deletion_at by mistake, are skipped."""
    user = await _mk_user(test_db, "export-user")
    bogus = PrivacyRequest(
        user_id=user.id,
        request_type="export",
        status="pending_deletion",
        scheduled_deletion_at=datetime.datetime.now(datetime.UTC)
        - datetime.timedelta(seconds=60),
    )
    test_db.add(bogus)
    await test_db.commit()

    assert await _find_due_requests(test_db, limit=10) == []


@pytest.mark.asyncio
async def test_find_due_skips_cancelled_rows(test_db: AsyncSession):
    user = await _mk_user(test_db, "cancel-user")
    await _mk_deletion(
        test_db,
        user.id,
        scheduled_offset_seconds=-60,
        status="cancelled",
    )
    assert await _find_due_requests(test_db, limit=10) == []


@pytest.mark.asyncio
async def test_find_due_respects_limit(test_db: AsyncSession):
    for i in range(3):
        user = await _mk_user(test_db, f"limit-user-{i}")
        await _mk_deletion(test_db, user.id, scheduled_offset_seconds=-60 - i)

    due = await _find_due_requests(test_db, limit=2)
    assert len(due) == 2


# ---------------------------------------------------------------------
# run_hard_deletes_once
# ---------------------------------------------------------------------

@pytest.mark.asyncio
async def test_run_hard_deletes_once_processes_due_rows(
    test_db: AsyncSession, monkeypatch
):
    user = await _mk_user(test_db, "hard-delete-user")
    req = await _mk_deletion(test_db, user.id, scheduled_offset_seconds=-60)

    # Stub ``hard_delete_user`` so the test doesn't have to set up every
    # cascaded table.  We only assert that the scheduler *called* it.
    called_with: list[str] = []

    async def _fake_hard_delete(self, user_id):  # noqa: ARG001
        called_with.append(user_id)

    monkeypatch.setattr(
        "backend.services.privacy_service.PrivacyService.hard_delete_user",
        _fake_hard_delete,
    )

    stats = await run_hard_deletes_once(
        _session_maker_from(test_db), max_per_tick=10
    )

    assert stats == {"found": 1, "deleted": 1, "failed": 0}
    assert called_with == [user.id]

    # Request should now be marked completed.
    refreshed = await test_db.get(PrivacyRequest, req.id)
    assert refreshed is not None
    assert refreshed.status == "completed"


@pytest.mark.asyncio
async def test_run_hard_deletes_once_handles_failures(
    test_db: AsyncSession, monkeypatch
):
    """A failure on one user shouldn't block the rest of the batch."""
    good = await _mk_user(test_db, "good-user")
    bad = await _mk_user(test_db, "bad-user")
    await _mk_deletion(test_db, good.id, scheduled_offset_seconds=-120)
    await _mk_deletion(test_db, bad.id, scheduled_offset_seconds=-60)

    async def _sometimes_fail(self, user_id):  # noqa: ARG001
        if user_id == bad.id:
            raise RuntimeError("boom")

    monkeypatch.setattr(
        "backend.services.privacy_service.PrivacyService.hard_delete_user",
        _sometimes_fail,
    )

    stats = await run_hard_deletes_once(
        _session_maker_from(test_db), max_per_tick=10
    )

    assert stats["found"] == 2
    assert stats["deleted"] == 1
    assert stats["failed"] == 1


@pytest.mark.asyncio
async def test_run_hard_deletes_once_with_empty_queue(test_db: AsyncSession):
    stats = await run_hard_deletes_once(
        _session_maker_from(test_db), max_per_tick=10
    )
    assert stats == {"found": 0, "deleted": 0, "failed": 0}


# ---------------------------------------------------------------------
# Scheduler lifecycle
# ---------------------------------------------------------------------

@pytest.mark.asyncio
async def test_scheduler_disabled_by_default(monkeypatch):
    """Without PRIVACY_SCHEDULER_ENABLED, ``start()`` is a no-op."""
    monkeypatch.setattr(
        "backend.services.privacy_scheduler.SCHEDULER_ENABLED", False
    )
    scheduler = PrivacyScheduler()
    await scheduler.start()
    assert scheduler.status["running"] is False
    await scheduler.stop()  # idempotent — shouldn't raise


@pytest.mark.asyncio
async def test_scheduler_status_snapshot_shape():
    scheduler = PrivacyScheduler()
    snap = scheduler.status
    assert set(snap.keys()) == {
        "enabled",
        "running",
        "last_run",
        "last_stats",
        "interval_seconds",
    }
