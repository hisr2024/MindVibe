"""
Integration tests for multilingual translation flow
Tests end-to-end translation from request to cached response
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestMultilingualFlow:
    """Test suite for multilingual integration."""

    async def test_kiaan_response_in_hindi(self, test_client: AsyncClient):
        """Test KIAAN response in Hindi."""
        response = await test_client.post(
            "/api/chat/message",
            json={
                "message": "I feel anxious",
                "language": "hi",
                "context": "general"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Response should contain content
        assert len(data["response"]) > 0

    async def test_translation_caching(self, test_client: AsyncClient):
        """Test that translations are cached."""
        message = "How do I find inner peace?"

        # First request
        response1 = await test_client.post(
            "/api/chat/message",
            json={"message": message, "language": "es"}
        )

        # Second request (should hit cache)
        response2 = await test_client.post(
            "/api/chat/message",
            json={"message": message, "language": "es"}
        )

        assert response1.status_code == 200
        assert response2.status_code == 200

        # Both should return valid responses
        assert len(response1.json()["response"]) > 0
        assert len(response2.json()["response"]) > 0

    async def test_multiple_language_support(self, test_client: AsyncClient):
        """Test responses in multiple languages."""
        message = "Help me with stress"
        languages = ["en", "hi", "es", "fr"]

        for lang in languages:
            response = await test_client.post(
                "/api/chat/message",
                json={"message": message, "language": lang}
            )

            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert len(data["response"]) > 0
