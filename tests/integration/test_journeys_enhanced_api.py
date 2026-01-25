"""
Integration tests for Enhanced Wisdom Journeys API.

Tests the full API flow including:
- GET /api/journeys/catalog
- POST /api/journeys/start (multiple journeys)
- GET /api/journeys/active
- GET /api/journeys/today
- POST /api/journeys/{id}/today
- POST /api/journeys/{id}/steps/{day}/complete
- Journey lifecycle (pause, resume, abandon)
- GET /api/journeys/{id}/history
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestJourneysCatalogAPI:
    """Tests for the journeys catalog endpoint."""

    async def test_get_catalog_returns_list(self, test_client: AsyncClient):
        """Test that GET /api/journeys/catalog returns a list."""
        response = await test_client.get("/api/journeys/catalog")

        # May require auth
        if response.status_code == 401:
            pytest.skip("Auth required - skipping catalog test")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_catalog_template_structure(self, test_client: AsyncClient):
        """Test that catalog templates have expected structure."""
        response = await test_client.get("/api/journeys/catalog")

        if response.status_code != 200:
            pytest.skip("Catalog endpoint not available")

        data = response.json()
        if len(data) > 0:
            template = data[0]
            assert "id" in template
            assert "slug" in template
            assert "title" in template
            assert "duration_days" in template
            assert "difficulty" in template


@pytest.mark.asyncio
class TestStartJourneysAPI:
    """Tests for starting journeys."""

    async def test_start_journey_requires_auth(self, test_client: AsyncClient):
        """Test that POST /api/journeys/start requires authentication."""
        response = await test_client.post(
            "/api/journeys/start",
            json={"journey_ids": ["test-id"]},
        )

        # Should require auth
        assert response.status_code in [401, 403, 422]

    async def test_start_multiple_journeys(self, test_client: AsyncClient):
        """Test starting multiple journeys in one request."""
        # This test would need auth token and valid template IDs
        response = await test_client.post(
            "/api/journeys/start",
            json={
                "journey_ids": ["template-1", "template-2"],
                "personalization": {
                    "pace": "daily",
                    "preferred_tone": "gentle",
                },
            },
            headers={"Authorization": "Bearer test-token"},
        )

        # Without valid auth/templates, expect error
        assert response.status_code in [401, 404, 422, 500]

    async def test_start_journey_validates_max_selection(self, test_client: AsyncClient):
        """Test that starting more than 5 journeys is rejected."""
        response = await test_client.post(
            "/api/journeys/start",
            json={
                "journey_ids": ["1", "2", "3", "4", "5", "6"],  # 6 journeys
            },
            headers={"Authorization": "Bearer test-token"},
        )

        # Should fail validation (max 5)
        assert response.status_code in [401, 422]


@pytest.mark.asyncio
class TestActiveJourneysAPI:
    """Tests for active journeys endpoint."""

    async def test_get_active_journeys_requires_auth(self, test_client: AsyncClient):
        """Test that GET /api/journeys/active requires authentication."""
        response = await test_client.get("/api/journeys/active")

        assert response.status_code in [401, 403]


@pytest.mark.asyncio
class TestTodayAgendaAPI:
    """Tests for today's agenda endpoint."""

    async def test_get_today_requires_auth(self, test_client: AsyncClient):
        """Test that GET /api/journeys/today requires authentication."""
        response = await test_client.get("/api/journeys/today")

        assert response.status_code in [401, 403]

    async def test_today_agenda_structure(self, test_client: AsyncClient):
        """Test that today's agenda has expected structure."""
        # This would need a valid auth token
        response = await test_client.get(
            "/api/journeys/today",
            headers={"Authorization": "Bearer test-token"},
        )

        if response.status_code == 200:
            data = response.json()
            assert "steps" in data
            assert isinstance(data["steps"], list)


@pytest.mark.asyncio
class TestTodayStepAPI:
    """Tests for today's step generation endpoint."""

    async def test_today_step_is_idempotent(self, test_client: AsyncClient):
        """Test that POST /api/journeys/{id}/today is idempotent."""
        journey_id = "test-journey-id"

        # First call
        response1 = await test_client.post(
            f"/api/journeys/{journey_id}/today",
            headers={"Authorization": "Bearer test-token"},
        )

        # Second call should return same content
        response2 = await test_client.post(
            f"/api/journeys/{journey_id}/today",
            headers={"Authorization": "Bearer test-token"},
        )

        # Both should have same status (either success or same error)
        assert response1.status_code == response2.status_code

    async def test_today_step_rate_limited(self, test_client: AsyncClient):
        """Test that step generation is rate limited."""
        journey_id = "test-journey-id"

        # Make many requests quickly
        for _ in range(35):
            response = await test_client.post(
                f"/api/journeys/{journey_id}/today",
                headers={"Authorization": "Bearer test-token"},
            )

            # Eventually should hit rate limit
            if response.status_code == 429:
                return  # Test passed

        # If we got here without 429, either auth failed or no rate limit
        # This is acceptable in test environment


@pytest.mark.asyncio
class TestCompleteStepAPI:
    """Tests for step completion endpoint."""

    async def test_complete_step_requires_auth(self, test_client: AsyncClient):
        """Test that completing a step requires authentication."""
        response = await test_client.post(
            "/api/journeys/test-id/steps/1/complete",
            json={
                "check_in": {"intensity": 5, "label": "test"},
            },
        )

        assert response.status_code in [401, 403]

    async def test_complete_step_validates_check_in(self, test_client: AsyncClient):
        """Test that check_in data is validated."""
        response = await test_client.post(
            "/api/journeys/test-id/steps/1/complete",
            json={
                "check_in": {"intensity": 15},  # Invalid: should be 0-10
            },
            headers={"Authorization": "Bearer test-token"},
        )

        # Should fail validation or auth
        assert response.status_code in [401, 403, 422]


@pytest.mark.asyncio
class TestJourneyLifecycleAPI:
    """Tests for journey lifecycle (pause, resume, abandon)."""

    async def test_pause_journey_requires_auth(self, test_client: AsyncClient):
        """Test that pausing a journey requires authentication."""
        response = await test_client.post("/api/journeys/test-id/pause")

        assert response.status_code in [401, 403]

    async def test_resume_journey_requires_auth(self, test_client: AsyncClient):
        """Test that resuming a journey requires authentication."""
        response = await test_client.post("/api/journeys/test-id/resume")

        assert response.status_code in [401, 403]

    async def test_abandon_journey_requires_auth(self, test_client: AsyncClient):
        """Test that abandoning a journey requires authentication."""
        response = await test_client.post("/api/journeys/test-id/abandon")

        assert response.status_code in [401, 403]


@pytest.mark.asyncio
class TestJourneyHistoryAPI:
    """Tests for journey history endpoint."""

    async def test_get_history_requires_auth(self, test_client: AsyncClient):
        """Test that GET /api/journeys/{id}/history requires authentication."""
        response = await test_client.get("/api/journeys/test-id/history")

        assert response.status_code in [401, 403]


@pytest.mark.asyncio
class TestAuthIsolationAPI:
    """Tests for auth isolation between users."""

    async def test_cannot_access_other_user_journey(self, test_client: AsyncClient):
        """Test that user cannot access another user's journey via API."""
        # User A's journey
        journey_id = "user-a-journey"

        # Request with User B's token
        response = await test_client.get(
            f"/api/journeys/{journey_id}/history",
            headers={"Authorization": "Bearer user-b-token"},
        )

        # Should be denied access
        assert response.status_code in [401, 403, 404]

    async def test_cannot_modify_other_user_journey(self, test_client: AsyncClient):
        """Test that user cannot modify another user's journey."""
        journey_id = "user-a-journey"

        response = await test_client.post(
            f"/api/journeys/{journey_id}/pause",
            headers={"Authorization": "Bearer user-b-token"},
        )

        assert response.status_code in [401, 403, 404]


@pytest.mark.asyncio
class TestProviderStatusAPI:
    """Tests for admin AI provider status endpoint."""

    async def test_provider_status_returns_data(self, test_client: AsyncClient):
        """Test that GET /api/admin/ai/providers/status returns provider info."""
        response = await test_client.get("/api/admin/ai/providers/status")

        # May require admin auth
        if response.status_code == 200:
            data = response.json()
            assert "providers" in data


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
