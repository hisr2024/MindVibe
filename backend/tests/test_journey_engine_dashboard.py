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
