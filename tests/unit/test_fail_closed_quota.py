"""
Tests for fail-closed quota/subscription behavior.

Verifies that backend routes return 503 (not 200) when the subscription
service is unavailable, preventing monetization bypass.
"""

import pytest
from unittest.mock import patch, AsyncMock

from tests.conftest import auth_headers_for


@pytest.fixture
def auth_headers():
    """Valid auth headers for a test user."""
    return auth_headers_for("test-user-quota")


@pytest.fixture
def override_auth(test_client):
    """Override auth dependencies to bypass DB user lookup."""
    from backend import main as app_module
    from backend.deps import get_current_user_flexible, get_current_user_optional

    # Must match the original dependency signature (no *args/**kwargs)
    async def _mock_user(request=None, db=None):
        return "test-user-quota"

    app_module.app.dependency_overrides[get_current_user_flexible] = _mock_user
    app_module.app.dependency_overrides[get_current_user_optional] = _mock_user
    yield
    app_module.app.dependency_overrides.pop(get_current_user_flexible, None)
    app_module.app.dependency_overrides.pop(get_current_user_optional, None)


class TestFailClosedQuota:
    """Verify that subscription check failures result in 503, not pass-through."""

    async def test_chat_streaming_fails_closed_on_quota_error(self, test_client, auth_headers):
        """Streaming chat should return 503 when subscription check raises."""
        with patch(
            "backend.routes.chat.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/chat/message/stream",
                json={"message": "hello", "session_id": "test"},
                headers=auth_headers,
            )
            # Should be 503, or 200 with service_unavailable in the SSE body
            assert response.status_code == 503 or (
                response.status_code == 200
                and b"service_unavailable" in response.content
            )

    async def test_chat_send_message_fails_closed_on_quota_error(self, test_client, auth_headers):
        """Non-streaming chat should return 503 when subscription check raises."""
        with patch(
            "backend.routes.chat.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "hello"},
                headers=auth_headers,
            )
            assert response.status_code == 503

    async def test_friend_chat_fails_closed_on_quota_error(self, test_client, override_auth, auth_headers):
        """Friend chat should return 503 when subscription check raises."""
        with patch(
            "backend.routes.kiaan_friend_mode.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/kiaan/friend/chat",
                json={"message": "hey friend"},
                headers=auth_headers,
            )
            assert response.status_code == 503

    async def test_divine_chat_fails_closed_on_quota_error(self, test_client, override_auth, auth_headers):
        """Divine chat should return 503 when subscription check raises."""
        with patch(
            "backend.routes.kiaan_divine.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/kiaan/divine-chat",
                json={"message": "guide me"},
                headers=auth_headers,
            )
            assert response.status_code == 503

    async def test_quantum_dive_fails_closed_on_quota_error(self, test_client, override_auth, auth_headers):
        """Quantum dive should return 503 when subscription check raises."""
        with patch(
            "backend.routes.quantum_dive.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/kiaan/quantum-dive/analyze",
                json={"text": "I feel anxious", "mood_score": 3},
                headers=auth_headers,
            )
            assert response.status_code == 503

    async def test_soul_reading_fails_closed_on_quota_error(self, test_client, override_auth, auth_headers):
        """Soul reading should return 503 when subscription check raises."""
        with patch(
            "backend.routes.kiaan_divine.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/kiaan/soul-reading",
                json={"text": "What does my soul say?"},
                headers=auth_headers,
            )
            assert response.status_code == 503

    async def test_synthesize_fails_closed_on_quota_error(self, test_client, override_auth, auth_headers):
        """Voice synthesis should return 503 when subscription check raises."""
        with patch(
            "backend.routes.kiaan_divine.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/kiaan/synthesize",
                json={"text": "Om shanti"},
                headers=auth_headers,
            )
            assert response.status_code == 503

    async def test_quota_exceeded_returns_429(self, test_client, override_auth, auth_headers):
        """When quota is known to be exceeded, return 429 (not 503)."""
        with (
            patch(
                "backend.routes.kiaan_friend_mode.get_current_user_id",
                new_callable=AsyncMock,
                return_value="test-user-quota",
            ),
            patch(
                "backend.routes.kiaan_friend_mode.get_or_create_free_subscription",
                new_callable=AsyncMock,
            ),
            patch(
                "backend.routes.kiaan_friend_mode.is_developer",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch(
                "backend.routes.kiaan_friend_mode.check_kiaan_quota",
                new_callable=AsyncMock,
                return_value=(False, 50, 50),
            ),
        ):
            response = await test_client.post(
                "/api/kiaan/friend/chat",
                json={"message": "hey friend"},
                headers=auth_headers,
            )
            assert response.status_code == 429
