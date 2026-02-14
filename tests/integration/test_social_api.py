"""
Integration tests for the Social Features API endpoints.

Tests friend connections, group meditations, and wisdom sharing.
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient, ASGITransport

from backend.main import app


class TestSocialEndpoints:
    """Test the /social endpoints (community features in main app)."""

    @pytest.mark.asyncio
    async def test_social_health(self):
        """Test the community health endpoint via main app."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/community/circles")
            # The community endpoint exists in the main app
            assert response.status_code in (200, 401, 403)
