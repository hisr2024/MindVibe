"""
Integration tests for Mobile BFF API endpoints

Tests the Mobile Backend for Frontend service which aggregates
and proxies requests to the main KIAAN API.

NOTE: The mobile_bff module has been consolidated into the main backend app.
These tests are skipped until they are rewritten to target the main app's
mobile endpoints.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Skip all tests in this module if backend.mobile_bff is not available
pytest.importorskip("backend.mobile_bff", reason="backend.mobile_bff module not available")

# Skip entire module — backend.mobile_bff was removed and consolidated into main app
pytestmark = pytest.mark.skip(reason="backend.mobile_bff module was removed; tests need rewrite for main app mobile endpoints")
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def mock_httpx_client():
    """Mock httpx.AsyncClient for testing."""
    return AsyncMock()


@pytest.fixture
def sample_chat_history():
    """Sample chat history data."""
    return {
        "messages": [
            {"id": "1", "content": "Hello", "timestamp": "2024-12-07T10:00:00"},
            {"id": "2", "content": "Hi there", "timestamp": "2024-12-07T10:01:00"},
        ]
    }


@pytest.fixture
def sample_moods():
    """Sample mood data."""
    return {
        "moods": [
            {"id": "1", "score": 8, "tags": ["happy"], "at": "2024-12-07T10:00:00"},
            {"id": "2", "score": 7, "tags": ["calm"], "at": "2024-12-07T09:00:00"},
        ]
    }


@pytest.fixture
def sample_journal():
    """Sample journal data."""
    return {
        "entries": [
            {"id": "1", "content": "Today was great", "created_at": "2024-12-07T10:00:00"},
            {"id": "2", "content": "Learning new things", "created_at": "2024-12-07T09:00:00"},
        ]
    }


@pytest.mark.asyncio
class TestMobileBFFHealthEndpoint:
    """Test suite for Mobile BFF health endpoint."""

    async def test_health_check(self):
        """Test the health check endpoint returns correct status."""
        from backend.mobile_bff.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/mobile/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["service"] == "mobile-bff"
            assert "timestamp" in data


@pytest.mark.asyncio
class TestMobileBFFChatHistory:
    """Test suite for Mobile BFF chat history endpoint."""

    async def test_chat_history_success(self, sample_chat_history):
        """Test successful chat history retrieval."""
        from backend.mobile_bff.main import app

        mock_response = MagicMock()
        mock_response.json.return_value = sample_chat_history
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.get.return_value = mock_response
            mock_client_class.return_value = mock_client

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get(
                    "/mobile/v1/chat/history",
                    headers={"Authorization": "Bearer test-token"}
                )

                assert response.status_code == 200
                data = response.json()
                assert "messages" in data
                assert "total_count" in data
                assert "has_more" in data

    async def test_chat_history_no_auth(self):
        """Test chat history without authorization."""
        from backend.mobile_bff.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/mobile/v1/chat/history")

            assert response.status_code == 401
            assert "Authorization required" in response.json()["detail"]

    async def test_chat_history_with_limit(self, sample_chat_history):
        """Test chat history with custom limit."""
        from backend.mobile_bff.main import app

        mock_response = MagicMock()
        mock_response.json.return_value = sample_chat_history
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.get.return_value = mock_response
            mock_client_class.return_value = mock_client

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get(
                    "/mobile/v1/chat/history?limit=10",
                    headers={"Authorization": "Bearer test-token"}
                )

                assert response.status_code == 200


@pytest.mark.asyncio
class TestMobileBFFDashboard:
    """Test suite for Mobile BFF dashboard endpoint."""

    async def test_dashboard_success(self, sample_moods, sample_journal):
        """Test successful dashboard data aggregation."""
        from backend.mobile_bff.main import app

        mock_moods_response = MagicMock()
        mock_moods_response.json.return_value = sample_moods
        mock_moods_response.raise_for_status = MagicMock()

        mock_journal_response = MagicMock()
        mock_journal_response.json.return_value = sample_journal
        mock_journal_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.get.side_effect = [mock_moods_response, mock_journal_response]
            mock_client_class.return_value = mock_client

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get(
                    "/mobile/v1/dashboard",
                    headers={"Authorization": "Bearer test-token"}
                )

                assert response.status_code == 200
                data = response.json()
                assert "moods" in data
                assert "journal" in data
                assert "synced_at" in data

    async def test_dashboard_no_auth(self):
        """Test dashboard without authorization."""
        from backend.mobile_bff.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/mobile/v1/dashboard")

            assert response.status_code == 401
            assert "Authorization required" in response.json()["detail"]

    async def test_dashboard_partial_failure(self):
        """Test dashboard handles partial failures gracefully."""
        from backend.mobile_bff.main import app

        mock_moods_response = MagicMock()
        mock_moods_response.json.return_value = {"moods": [{"id": "1", "score": 8}]}

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            # First call succeeds, second raises exception
            mock_client.get.side_effect = [mock_moods_response, Exception("Connection error")]
            mock_client_class.return_value = mock_client

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get(
                    "/mobile/v1/dashboard",
                    headers={"Authorization": "Bearer test-token"}
                )

                assert response.status_code == 200
                data = response.json()
                # Should have moods but empty journal
                assert len(data["moods"]) > 0
                assert data["journal"] == []


@pytest.mark.asyncio
class TestMobileBFFSendChat:
    """Test suite for Mobile BFF send chat endpoint."""

    async def test_send_chat_success(self):
        """Test successful chat message sending."""
        from backend.mobile_bff.main import app

        mock_response = MagicMock()
        mock_response.json.return_value = {"response": "Hello from KIAAN", "status": "success"}
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    "/mobile/v1/chat",
                    json={"message": "Hello KIAAN"},
                    headers={"Authorization": "Bearer test-token"}
                )

                assert response.status_code == 200
                data = response.json()
                assert "response" in data

    async def test_send_chat_no_auth(self):
        """Test send chat without authorization."""
        from backend.mobile_bff.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/mobile/v1/chat",
                json={"message": "Hello"}
            )

            assert response.status_code == 401
            assert "Authorization required" in response.json()["detail"]


@pytest.mark.asyncio
class TestMobileBFFCORS:
    """Test suite for CORS configuration."""

    async def test_cors_headers(self):
        """Test that CORS headers are properly configured."""
        from backend.mobile_bff.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Test a simple GET request to verify CORS works
            response = await client.get(
                "/mobile/health",
                headers={"Origin": "http://localhost:3000"}
            )

            # Should allow the request and return CORS headers
            assert response.status_code == 200
            # The CORS middleware should add the necessary headers
            assert "access-control-allow-origin" in response.headers or "Access-Control-Allow-Origin" in response.headers
