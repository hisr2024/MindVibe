"""
Integration tests for the Social Features API endpoints.

Tests friend connections, group meditations, and wisdom sharing.
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient, ASGITransport

from backend.social.main import app as social_app


class TestSocialEndpoints:
    """Test the /social endpoints."""

    @pytest.mark.asyncio
    async def test_social_health(self):
        """Test the social health endpoint."""
        async with AsyncClient(
            transport=ASGITransport(app=social_app), base_url="http://test"
        ) as client:
            response = await client.get("/social/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["service"] == "social"
            assert "timestamp" in data
