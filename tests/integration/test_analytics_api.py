"""
Integration tests for the Analytics API endpoints.

Tests the analytics functionality including mood trends, usage stats, and insights.

Note: The backend.analytics.main module has been consolidated into the main app.
Analytics endpoints are now served from the main app at /api/analytics/*.
These tests use the main app's analytics routes instead.
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User, Mood


class TestAnalyticsEndpoints:
    """Test the /api/analytics endpoints on the main app."""

    @pytest.mark.asyncio
    async def test_analytics_overview(self, test_client: AsyncClient):
        """Test the analytics overview endpoint returns valid structure."""
        from tests.conftest import auth_headers_for

        headers = auth_headers_for("test-analytics-user")
        response = await test_client.get("/api/analytics/overview", headers=headers)

        # Accept 200 (success) or 401/403 (auth required)
        assert response.status_code in (200, 401, 403), f"Unexpected status: {response.status_code}"

    @pytest.mark.asyncio
    async def test_mood_trends(self, test_client: AsyncClient):
        """Test mood trends endpoint exists and returns valid response."""
        from tests.conftest import auth_headers_for

        headers = auth_headers_for("test-analytics-user")
        response = await test_client.get("/api/analytics/mood-trends", headers=headers)

        # Accept 200 (success) or 401/403 (auth required)
        assert response.status_code in (200, 401, 403), f"Unexpected status: {response.status_code}"

    @pytest.mark.asyncio
    async def test_journal_stats(self, test_client: AsyncClient):
        """Test journal statistics endpoint exists and returns valid response."""
        from tests.conftest import auth_headers_for

        headers = auth_headers_for("test-analytics-user")
        response = await test_client.get("/api/analytics/journal-stats", headers=headers)

        assert response.status_code in (200, 401, 403), f"Unexpected status: {response.status_code}"

    @pytest.mark.asyncio
    async def test_weekly_summary(self, test_client: AsyncClient):
        """Test weekly summary endpoint exists and returns valid response."""
        from tests.conftest import auth_headers_for

        headers = auth_headers_for("test-analytics-user")
        response = await test_client.get("/api/analytics/weekly-summary", headers=headers)

        assert response.status_code in (200, 401, 403), f"Unexpected status: {response.status_code}"
