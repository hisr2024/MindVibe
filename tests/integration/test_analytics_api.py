"""
Integration tests for the Analytics API endpoints.

Tests the analytics functionality including mood trends, usage stats, and insights.
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User, Mood, JournalEntry


class TestAnalyticsEndpoints:
    """Test the /analytics endpoints."""

    @pytest.mark.asyncio
    async def test_analytics_health(self, test_client: AsyncClient):
        """Test the analytics health endpoint."""
        # Import analytics app and create test client for it
        from backend.analytics.main import app as analytics_app
        from httpx import ASGITransport

        async with AsyncClient(
            transport=ASGITransport(app=analytics_app), base_url="http://test"
        ) as client:
            response = await client.get("/analytics/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["service"] == "analytics"
            assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_mood_trends(self, test_db: AsyncSession):
        """Test mood trends endpoint with sample data."""
        from backend.analytics.main import app as analytics_app
        from backend import deps
        from httpx import ASGITransport

        # Create a test user
        user = User(
            auth_uid="test-analytics-user",
            email="analytics@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create some mood entries
        for i in range(5):
            mood = Mood(
                user_id=user.id,
                score=7 + i % 3,
                tags=None,
                note=None,
                at=datetime.now() - timedelta(days=i)
            )
            test_db.add(mood)
        await test_db.commit()

        # Override the db dependency
        async def override_get_db():
            yield test_db

        analytics_app.dependency_overrides[deps.get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=analytics_app), base_url="http://test"
        ) as client:
            response = await client.get(f"/analytics/v1/mood-trends?user_id={user.id}&days=30")
            assert response.status_code == 200
            data = response.json()
            assert "trends" in data
            assert "period_days" in data
            assert data["period_days"] == 30

        analytics_app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_usage_stats(self, test_db: AsyncSession):
        """Test usage statistics endpoint."""
        from backend.analytics.main import app as analytics_app
        from backend import deps
        from httpx import ASGITransport

        # Create a test user
        user = User(
            auth_uid="test-stats-user",
            email="stats@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create some mood entries
        for i in range(3):
            mood = Mood(
                user_id=user.id,
                score=7,
                tags=None,
                note=None,
                at=datetime.now() - timedelta(days=i)
            )
            test_db.add(mood)
        await test_db.commit()

        # Override the db dependency
        async def override_get_db():
            yield test_db

        analytics_app.dependency_overrides[deps.get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=analytics_app), base_url="http://test"
        ) as client:
            response = await client.get(f"/analytics/v1/usage-stats?user_id={user.id}")
            assert response.status_code == 200
            data = response.json()
            assert "user_id" in data
            assert data["user_id"] == user.id
            assert "statistics" in data
            assert "total_moods" in data["statistics"]
            assert data["statistics"]["total_moods"] == 3

        analytics_app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_insights(self, test_db: AsyncSession):
        """Test AI-powered insights endpoint."""
        from backend.analytics.main import app as analytics_app
        from backend import deps
        from httpx import ASGITransport

        # Create a test user
        user = User(
            auth_uid="test-insights-user",
            email="insights@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create low mood entries to trigger insight
        for i in range(3):
            mood = Mood(
                user_id=user.id,
                score=3,  # Low score
                tags=None,
                note=None,
                at=datetime.now() - timedelta(days=i)
            )
            test_db.add(mood)
        await test_db.commit()

        # Override the db dependency
        async def override_get_db():
            yield test_db

        analytics_app.dependency_overrides[deps.get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=analytics_app), base_url="http://test"
        ) as client:
            response = await client.get(f"/analytics/v1/insights?user_id={user.id}")
            assert response.status_code == 200
            data = response.json()
            assert "insights" in data
            assert "generated_at" in data
            # Should have at least the journaling insight
            assert len(data["insights"]) > 0

        analytics_app.dependency_overrides.clear()
