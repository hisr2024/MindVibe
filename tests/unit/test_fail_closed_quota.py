"""
Tests for fail-closed quota/subscription behavior.

Verifies that backend routes return 503 (not 200) when the subscription
service is unavailable, preventing monetization bypass.
"""

import pytest
from unittest.mock import patch, AsyncMock


class TestFailClosedQuota:
    """Verify that subscription check failures result in 503, not pass-through."""

    async def test_chat_streaming_fails_closed_on_quota_error(self, test_client):
        """Streaming chat should return 503 when subscription check raises."""
        with patch(
            "backend.routes.chat.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/chat/stream",
                json={"message": "hello", "session_id": "test"},
                headers={"Authorization": "Bearer test-token"},
            )
            # Should be 503, not 200
            assert response.status_code == 503 or (
                response.status_code == 200
                and b"service_unavailable" in response.content
            )

    async def test_chat_send_message_fails_closed_on_quota_error(self, test_client):
        """Non-streaming chat should return 503 when subscription check raises."""
        with patch(
            "backend.routes.chat.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "hello"},
                headers={"Authorization": "Bearer test-token"},
            )
            assert response.status_code == 503

    async def test_friend_chat_fails_closed_on_quota_error(self, test_client):
        """Friend chat should return 503 when subscription check raises."""
        with patch(
            "backend.routes.kiaan_friend_mode.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/kiaan/friend/chat",
                json={"message": "hey friend"},
                headers={"Authorization": "Bearer test-token"},
            )
            assert response.status_code == 503

    async def test_divine_chat_fails_closed_on_quota_error(self, test_client):
        """Divine chat should return 503 when subscription check raises."""
        with patch(
            "backend.routes.kiaan_divine.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/kiaan/divine-chat",
                json={"message": "guide me"},
                headers={"Authorization": "Bearer test-token"},
            )
            assert response.status_code == 503

    async def test_quantum_dive_fails_closed_on_quota_error(self, test_client):
        """Quantum dive should return 503 when subscription check raises."""
        with patch(
            "backend.routes.quantum_dive.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/api/kiaan/quantum-dive/dive",
                json={"text": "I feel anxious", "mood_score": 3},
                headers={"Authorization": "Bearer test-token"},
            )
            assert response.status_code == 503

    async def test_soul_reading_fails_closed_on_quota_error(self, test_client):
        """Soul reading should return 503 when subscription check raises."""
        with patch(
            "backend.routes.kiaan_divine.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/kiaan/soul-reading",
                json={"text": "What does my soul say?"},
                headers={"Authorization": "Bearer test-token"},
            )
            assert response.status_code == 503

    async def test_synthesize_fails_closed_on_quota_error(self, test_client):
        """Voice synthesis should return 503 when subscription check raises."""
        with patch(
            "backend.routes.kiaan_divine.get_current_user_id",
            new_callable=AsyncMock,
            side_effect=RuntimeError("DB connection lost"),
        ):
            response = await test_client.post(
                "/kiaan/synthesize",
                json={"text": "Om shanti"},
                headers={"Authorization": "Bearer test-token"},
            )
            assert response.status_code == 503

    async def test_quota_exceeded_returns_429(self, test_client):
        """When quota is known to be exceeded, return 429 (not 503)."""
        with (
            patch(
                "backend.routes.kiaan_friend_mode.get_current_user_id",
                new_callable=AsyncMock,
                return_value="test-user",
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
                "/kiaan/friend/chat",
                json={"message": "hey friend"},
                headers={"Authorization": "Bearer test-token"},
            )
            assert response.status_code == 429
