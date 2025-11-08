"""
Integration tests for the Moods API endpoints.

Tests the mood tracking functionality including creating moods.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User


class TestMoodsEndpoints:
    """Test the /moods endpoints."""

    @pytest.mark.asyncio
    async def test_create_mood_success(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test successfully creating a mood entry."""
        # Create a user first
        user = User(auth_uid="test-mood-user", locale="en")
        test_db.add(user)
        await test_db.commit()

        # Create a mood
        response = await test_client.post(
            "/moods",
            json={
                "score": 2,
                "tags": ["happy", "energetic"],
                "note": "Great day today!",
            },
            headers={"x-auth-uid": "test-mood-user"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 2
        assert data["tags"] == ["happy", "energetic"]
        assert data["note"] == "Great day today!"
        assert "id" in data
        assert "at" in data

    @pytest.mark.asyncio
    async def test_create_mood_without_tags_and_note(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test creating a mood with only required fields."""
        user = User(auth_uid="test-mood-user-2", locale="en")
        test_db.add(user)
        await test_db.commit()

        response = await test_client.post(
            "/moods", json={"score": -1}, headers={"x-auth-uid": "test-mood-user-2"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["score"] == -1
        assert data["tags"] is None
        assert data["note"] is None

    @pytest.mark.asyncio
    async def test_create_mood_invalid_score(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test creating a mood with an invalid score."""
        user = User(auth_uid="test-mood-user-3", locale="en")
        test_db.add(user)
        await test_db.commit()

        # Score too high
        response = await test_client.post(
            "/moods", json={"score": 5}, headers={"x-auth-uid": "test-mood-user-3"}
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_mood_creates_user_if_not_exists(
        self, test_client: AsyncClient
    ):
        """Test that a user is created automatically if they don't exist."""
        response = await test_client.post(
            "/moods",
            json={"score": 1, "tags": ["calm"]},
            headers={"x-auth-uid": "new-user-auto-created"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 1

    @pytest.mark.asyncio
    async def test_create_mood_without_auth_header(self, test_client: AsyncClient):
        """Test creating a mood without authentication header uses dev-anon."""
        response = await test_client.post("/moods", json={"score": 0})

        # Should succeed with dev-anon user
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 0
