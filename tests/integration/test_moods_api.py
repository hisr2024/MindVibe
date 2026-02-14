"""
Integration tests for the Moods API endpoints.

Tests the mood tracking functionality including creating moods.
All tests use JWT Bearer tokens for authentication (X-Auth-UID was removed).
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User
from tests.conftest import auth_headers_for


class TestMoodsEndpoints:
    """Test the /moods endpoints."""

    @pytest.mark.asyncio
    async def test_create_mood_success(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test successfully creating a mood entry."""
        # Create a user first
        user = User(
            auth_uid="test-mood-user",
            email="mood@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create a mood using JWT Bearer token
        response = await test_client.post(
            "/api/moods",
            json={
                "score": 2,
                "tags": ["happy", "energetic"],
                "note": "Great day today!",
            },
            headers=auth_headers_for(user.id),
        )

        assert response.status_code in (200, 201)
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
        user = User(
            auth_uid="test-mood-user-2",
            email="mood2@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        response = await test_client.post(
            "/api/moods", json={"score": -1}, headers=auth_headers_for(user.id)
        )

        assert response.status_code in (200, 201)
        data = response.json()
        assert data["score"] == -1
        assert data["tags"] is None
        assert data["note"] is None

    @pytest.mark.asyncio
    async def test_create_mood_invalid_score(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test creating a mood with an invalid score."""
        user = User(
            auth_uid="test-mood-user-3",
            email="mood3@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Score too high
        response = await test_client.post(
            "/api/moods", json={"score": 5}, headers=auth_headers_for(user.id)
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_mood_requires_auth(self, test_client: AsyncClient):
        """Test that creating a mood without authentication returns 401."""
        response = await test_client.post(
            "/api/moods",
            json={"score": 1, "tags": ["calm"]},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_mood_without_auth_header(self, test_client: AsyncClient):
        """Test creating a mood without authentication header returns 401.

        Previously this used dev-anon auto-creation which has been removed
        for security (shared anonymous account across all unauthenticated requests).
        """
        response = await test_client.post("/api/moods", json={"score": 0})

        # Should fail - authentication is now required
        assert response.status_code == 401
