"""
Tests for JourneyEngineService.get_dashboard self-healing behaviour.

These exercise the bug where:
  - ``_count_active_journeys`` returned N (raw COUNT) but
  - ``list_user_journeys`` returned 0 because every UserJourney was
    orphaned (its JourneyTemplate had been soft-deleted)

leaving the user permanently trapped behind the MaxJourneysSheet blocker
("5 active — maximum reached") with the dashboard simultaneously showing
"0/5 active". The fix adds an orphan-cleanup + phantom-recovery pass to
``get_dashboard`` and surfaces an authoritative ``active_count`` to the
frontend so the dashboard can never disagree with the limit check.
"""

import os
import sys

import pytest
from unittest.mock import AsyncMock, MagicMock

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


def _make_service():
    """Build a JourneyEngineService with a stub AsyncSession."""
    from backend.services.journey_engine.journey_engine_service import (
        JourneyEngineService,
    )

    mock_db = AsyncMock()
    return JourneyEngineService(mock_db)


@pytest.mark.asyncio
async def test_get_dashboard_invokes_cleanup_before_listing(monkeypatch):
    """Orphan cleanup must run before list_user_journeys."""
    service = _make_service()
    call_order: list[str] = []

    async def fake_cleanup(user_id):
        call_order.append("cleanup")
        return 0

    async def fake_list(user_id, status_filter=None, limit=20, offset=0):
        call_order.append(f"list:{status_filter}")
        return [], 0

    async def fake_count(user_id):
        return 0

    async def fake_enemy(user_id):
        return []

    async def fake_recs(user_id, ep):
        return []

    async def fake_streak(user_id):
        return 0

    monkeypatch.setattr(service, "cleanup_orphaned_journeys", fake_cleanup)
    monkeypatch.setattr(service, "list_user_journeys", fake_list)
    monkeypatch.setattr(service, "_count_active_journeys", fake_count)
    monkeypatch.setattr(service, "_get_enemy_progress", fake_enemy)
    monkeypatch.setattr(service, "_get_recommendations", fake_recs)
    monkeypatch.setattr(service, "_calculate_streak", fake_streak)

    # Stub the auxiliary count + days_practiced queries
    mock_result = MagicMock()
    mock_result.scalar = MagicMock(return_value=0)
    service.db.execute = AsyncMock(return_value=mock_result)

    dashboard = await service.get_dashboard("user-1")

    assert call_order[0] == "cleanup", "cleanup must run first"
    assert "list:active" in call_order
    assert dashboard.active_count == 0
    assert dashboard.max_active == service.MAX_ACTIVE_JOURNEYS
    assert dashboard.active_journeys == []


@pytest.mark.asyncio
async def test_get_dashboard_phantom_recovery(monkeypatch):
    """When count > len(list) after cleanup, force_clear_all_journeys runs."""
    service = _make_service()

    async def noop_cleanup(user_id):
        return 0

    list_calls = {"n": 0}

    async def fake_list(user_id, status_filter=None, limit=20, offset=0):
        list_calls["n"] += 1
        # First call returns empty (phantom), second call (post-recovery) too
        return [], 0

    count_calls = {"n": 0}

    async def fake_count(user_id):
        count_calls["n"] += 1
        # First call: 5 (phantom). After force_clear: 0.
        return 5 if count_calls["n"] == 1 else 0

    force_clear_called = {"n": 0}

    async def fake_force_clear(user_id):
        force_clear_called["n"] += 1
        return 5

    async def fake_enemy(user_id):
        return []

    async def fake_recs(user_id, ep):
        return []

    async def fake_streak(user_id):
        return 0

    monkeypatch.setattr(service, "cleanup_orphaned_journeys", noop_cleanup)
    monkeypatch.setattr(service, "list_user_journeys", fake_list)
    monkeypatch.setattr(service, "_count_active_journeys", fake_count)
    monkeypatch.setattr(service, "force_clear_all_journeys", fake_force_clear)
    monkeypatch.setattr(service, "_get_enemy_progress", fake_enemy)
    monkeypatch.setattr(service, "_get_recommendations", fake_recs)
    monkeypatch.setattr(service, "_calculate_streak", fake_streak)

    mock_result = MagicMock()
    mock_result.scalar = MagicMock(return_value=0)
    service.db.execute = AsyncMock(return_value=mock_result)

    dashboard = await service.get_dashboard("user-2")

    assert force_clear_called["n"] == 1, "phantom recovery must run"
    assert dashboard.active_count == 0
    assert dashboard.active_journeys == []
    # Count must equal list length — no divergence visible to frontend.
    assert dashboard.active_count == len(dashboard.active_journeys)


@pytest.mark.asyncio
async def test_get_dashboard_happy_path(monkeypatch):
    """Two real active journeys: count == len(list), no phantom recovery."""
    from backend.services.journey_engine.journey_engine_service import JourneyStats

    service = _make_service()

    fake_journeys = [
        JourneyStats(
            journey_id="j1",
            template_slug="anger-1",
            title="Cooling the Fire",
            status="active",
            current_day=3,
            total_days=14,
            progress_percentage=21.4,
            days_completed=3,
            started_at=None,
            last_activity=None,
            primary_enemies=["krodha"],
            streak_days=2,
        ),
        JourneyStats(
            journey_id="j2",
            template_slug="greed-1",
            title="The Open Hand",
            status="active",
            current_day=7,
            total_days=14,
            progress_percentage=50.0,
            days_completed=7,
            started_at=None,
            last_activity=None,
            primary_enemies=["lobha"],
            streak_days=5,
        ),
    ]

    async def noop_cleanup(user_id):
        return 0

    async def fake_list(user_id, status_filter=None, limit=20, offset=0):
        if status_filter == "active":
            return list(fake_journeys), len(fake_journeys)
        return [], 0

    async def fake_count(user_id):
        return 2

    force_clear_called = {"n": 0}

    async def fake_force_clear(user_id):
        force_clear_called["n"] += 1
        return 0

    async def fake_enemy(user_id):
        return []

    async def fake_recs(user_id, ep):
        return []

    async def fake_streak(user_id):
        return 0

    async def fake_current_step(user_id, journey_id):
        return None

    monkeypatch.setattr(service, "cleanup_orphaned_journeys", noop_cleanup)
    monkeypatch.setattr(service, "list_user_journeys", fake_list)
    monkeypatch.setattr(service, "_count_active_journeys", fake_count)
    monkeypatch.setattr(service, "force_clear_all_journeys", fake_force_clear)
    monkeypatch.setattr(service, "_get_enemy_progress", fake_enemy)
    monkeypatch.setattr(service, "_get_recommendations", fake_recs)
    monkeypatch.setattr(service, "_calculate_streak", fake_streak)
    monkeypatch.setattr(service, "get_current_step", fake_current_step)

    mock_result = MagicMock()
    mock_result.scalar = MagicMock(return_value=0)
    service.db.execute = AsyncMock(return_value=mock_result)

    dashboard = await service.get_dashboard("user-3")

    assert dashboard.active_count == 2
    assert len(dashboard.active_journeys) == 2
    assert dashboard.active_count == len(dashboard.active_journeys)
    assert force_clear_called["n"] == 0, "phantom recovery must NOT run"
    assert dashboard.max_active == service.MAX_ACTIVE_JOURNEYS


# ============================================================================
# REGRESSION: dashboard must survive a broken peripheral helper
# ============================================================================
#
# The earlier shipped bug was that ``_get_enemy_progress`` accessed
# ``j.template`` without ``selectinload(UserJourney.template)``, raising
# MissingGreenlet in async SQLAlchemy. The exception propagated to the
# route handler, which had a bare ``except Exception`` that silently
# returned ``DashboardResponse(active_journeys=[], active_count=0, ...)``,
# hiding every started journey from the user even though the rows were
# still in the DB.
#
# These tests lock in the new contract: ``get_dashboard`` isolates each
# optional component (enemy_progress, today_steps, recommendations,
# streak) so a single broken helper degrades that field only — the
# authoritative active_journeys list and active_count are never zeroed
# by a downstream failure again.
# ============================================================================


@pytest.mark.asyncio
async def test_get_dashboard_survives_broken_enemy_progress(monkeypatch):
    """If _get_enemy_progress raises, active_journeys must still be returned.

    This is the exact shape of the MissingGreenlet regression. Previously
    this made the entire dashboard collapse to zeros in the route handler.
    """
    from backend.services.journey_engine.journey_engine_service import JourneyStats

    service = _make_service()

    fake_journey = JourneyStats(
        journey_id="j1",
        template_slug="anger-1",
        title="Cooling the Fire",
        status="active",
        current_day=3,
        total_days=14,
        progress_percentage=21.4,
        days_completed=3,
        started_at=None,
        last_activity=None,
        primary_enemies=["krodha"],
        streak_days=2,
    )

    async def noop_cleanup(user_id):
        return 0

    async def fake_list(user_id, status_filter=None, limit=20, offset=0):
        if status_filter == "active":
            return [fake_journey], 1
        return [], 0

    async def fake_count(user_id):
        return 1

    async def boom_enemy_progress(user_id):
        # Simulate the MissingGreenlet lazy-load error that the async
        # session raises when a relationship is touched without a
        # preload option.
        raise RuntimeError(
            "greenlet_spawn has not been called; can't call await_only() here"
        )

    async def fake_recs(user_id, ep):
        return []

    async def fake_streak(user_id):
        return 0

    async def fake_current_step(user_id, journey_id):
        return None

    monkeypatch.setattr(service, "cleanup_orphaned_journeys", noop_cleanup)
    monkeypatch.setattr(service, "list_user_journeys", fake_list)
    monkeypatch.setattr(service, "_count_active_journeys", fake_count)
    monkeypatch.setattr(service, "_get_enemy_progress", boom_enemy_progress)
    monkeypatch.setattr(service, "_get_recommendations", fake_recs)
    monkeypatch.setattr(service, "_calculate_streak", fake_streak)
    monkeypatch.setattr(service, "get_current_step", fake_current_step)

    mock_result = MagicMock()
    mock_result.scalar = MagicMock(return_value=0)
    service.db.execute = AsyncMock(return_value=mock_result)

    dashboard = await service.get_dashboard("user-boom-enemy")

    # The authoritative fields must survive a broken peripheral helper.
    assert dashboard.active_count == 1
    assert len(dashboard.active_journeys) == 1
    assert dashboard.active_journeys[0].journey_id == "j1"
    # The broken component degrades to empty, not the whole dashboard.
    assert dashboard.enemy_progress == []


@pytest.mark.asyncio
async def test_get_dashboard_survives_broken_today_step(monkeypatch):
    """If one today_step fetch raises, other journeys are still returned."""
    from backend.services.journey_engine.journey_engine_service import JourneyStats

    service = _make_service()

    j1 = JourneyStats(
        journey_id="j1",
        template_slug="anger-1",
        title="Cooling the Fire",
        status="active",
        current_day=3,
        total_days=14,
        progress_percentage=21.4,
        days_completed=3,
        started_at=None,
        last_activity=None,
        primary_enemies=["krodha"],
        streak_days=2,
    )
    j2 = JourneyStats(
        journey_id="j2",
        template_slug="greed-1",
        title="The Open Hand",
        status="active",
        current_day=7,
        total_days=14,
        progress_percentage=50.0,
        days_completed=7,
        started_at=None,
        last_activity=None,
        primary_enemies=["lobha"],
        streak_days=5,
    )

    async def noop_cleanup(user_id):
        return 0

    async def fake_list(user_id, status_filter=None, limit=20, offset=0):
        if status_filter == "active":
            return [j1, j2], 2
        return [], 0

    async def fake_count(user_id):
        return 2

    async def fake_enemy(user_id):
        return []

    async def fake_recs(user_id, ep):
        return []

    async def fake_streak(user_id):
        return 0

    async def flaky_current_step(user_id, journey_id):
        if journey_id == "j1":
            raise RuntimeError("step_state load failed")
        return None

    monkeypatch.setattr(service, "cleanup_orphaned_journeys", noop_cleanup)
    monkeypatch.setattr(service, "list_user_journeys", fake_list)
    monkeypatch.setattr(service, "_count_active_journeys", fake_count)
    monkeypatch.setattr(service, "_get_enemy_progress", fake_enemy)
    monkeypatch.setattr(service, "_get_recommendations", fake_recs)
    monkeypatch.setattr(service, "_calculate_streak", fake_streak)
    monkeypatch.setattr(service, "get_current_step", flaky_current_step)

    mock_result = MagicMock()
    mock_result.scalar = MagicMock(return_value=0)
    service.db.execute = AsyncMock(return_value=mock_result)

    dashboard = await service.get_dashboard("user-boom-step")

    # Both journeys still listed — a broken today_step does not hide them.
    assert dashboard.active_count == 2
    assert len(dashboard.active_journeys) == 2


@pytest.mark.asyncio
async def test_get_dashboard_survives_broken_streak_and_recs(monkeypatch):
    """Broken recommendations / streak must not zero out active journeys."""
    from backend.services.journey_engine.journey_engine_service import JourneyStats

    service = _make_service()

    fake_journey = JourneyStats(
        journey_id="j1",
        template_slug="anger-1",
        title="Cooling the Fire",
        status="active",
        current_day=1,
        total_days=14,
        progress_percentage=7.1,
        days_completed=1,
        started_at=None,
        last_activity=None,
        primary_enemies=["krodha"],
        streak_days=0,
    )

    async def noop_cleanup(user_id):
        return 0

    async def fake_list(user_id, status_filter=None, limit=20, offset=0):
        if status_filter == "active":
            return [fake_journey], 1
        return [], 0

    async def fake_count(user_id):
        return 1

    async def fake_enemy(user_id):
        return []

    async def boom_recs(user_id, ep):
        raise RuntimeError("list_templates cache miss + db down")

    async def boom_streak(user_id):
        raise RuntimeError("unexpected NULL in completed_at aggregation")

    async def fake_current_step(user_id, journey_id):
        return None

    monkeypatch.setattr(service, "cleanup_orphaned_journeys", noop_cleanup)
    monkeypatch.setattr(service, "list_user_journeys", fake_list)
    monkeypatch.setattr(service, "_count_active_journeys", fake_count)
    monkeypatch.setattr(service, "_get_enemy_progress", fake_enemy)
    monkeypatch.setattr(service, "_get_recommendations", boom_recs)
    monkeypatch.setattr(service, "_calculate_streak", boom_streak)
    monkeypatch.setattr(service, "get_current_step", fake_current_step)

    mock_result = MagicMock()
    mock_result.scalar = MagicMock(return_value=0)
    service.db.execute = AsyncMock(return_value=mock_result)

    dashboard = await service.get_dashboard("user-boom-multi")

    # Authoritative data must survive multi-helper failure.
    assert dashboard.active_count == 1
    assert len(dashboard.active_journeys) == 1
    assert dashboard.current_streak == 0  # degraded
    assert dashboard.recommended_templates == []  # degraded


@pytest.mark.asyncio
async def test_get_enemy_progress_uses_selectinload(monkeypatch):
    """Guard the source: _get_enemy_progress must not trigger lazy loads.

    Inspects the SQL query the helper builds and asserts that the
    UserJourney.template relationship is eager-loaded, so this function
    can never regress into the MissingGreenlet crash that hid started
    journeys from the dashboard.
    """
    import inspect

    from backend.services.journey_engine.journey_engine_service import (
        JourneyEngineService,
    )

    source = inspect.getsource(JourneyEngineService._get_enemy_progress)
    assert "selectinload(UserJourney.template)" in source, (
        "_get_enemy_progress must preload UserJourney.template via "
        "selectinload; otherwise j.template access below raises "
        "MissingGreenlet in the async session and the route handler "
        "silently returns an empty dashboard."
    )
