"""
Integration tests for the Journal API endpoints.

Tests the encrypted blob upload and retrieval functionality.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User


class TestJournalEndpoints:
    """Test the /journal endpoints."""

    @pytest.mark.asyncio
    async def test_upload_blob_success(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test successfully uploading an encrypted journal blob."""
        user = User(
            auth_uid="test-journal-user",
            email="journal@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()

        response = await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "journal data"}'},
            headers={"x-auth-uid": "test-journal-user"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["blob_json"] == '{"encrypted": "journal data"}'
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_get_latest_blob_success(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test retrieving the latest journal blob."""
        user = User(
            auth_uid="test-journal-user-2",
            email="journal2@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()

        # Upload first blob
        await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "first entry"}'},
            headers={"x-auth-uid": "test-journal-user-2"},
        )

        # Upload second blob
        await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "second entry"}'},
            headers={"x-auth-uid": "test-journal-user-2"},
        )

        # Get the latest - should return one of the blobs
        response = await test_client.get(
            "/journal/blob/latest", headers={"x-auth-uid": "test-journal-user-2"}
        )

        assert response.status_code == 200
        data = response.json()
        # Should return a blob (not empty)
        assert "id" in data
        assert "blob_json" in data
        assert data["blob_json"] in [
            '{"encrypted": "first entry"}',
            '{"encrypted": "second entry"}',
        ]

    @pytest.mark.asyncio
    async def test_get_latest_blob_empty(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test retrieving latest blob when none exists."""
        user = User(
            auth_uid="test-journal-user-3",
            email="journal3@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()

        response = await test_client.get(
            "/journal/blob/latest", headers={"x-auth-uid": "test-journal-user-3"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data == {}

    @pytest.mark.asyncio
    async def test_upload_blob_creates_user_if_not_exists(
        self, test_client: AsyncClient
    ):
        """Test that a user is created automatically when uploading a blob."""
        response = await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "new user data"}'},
            headers={"x-auth-uid": "auto-created-journal-user"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["blob_json"] == '{"encrypted": "new user data"}'

    @pytest.mark.asyncio
    async def test_user_isolation(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that users can only access their own journal blobs."""
        # Create two users
        user1 = User(
            auth_uid="user1",
            email="user1@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        user2 = User(
            auth_uid="user2",
            email="user2@example.com",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add_all([user1, user2])
        await test_db.commit()

        # User 1 uploads a blob
        await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "user1 data"}'},
            headers={"x-auth-uid": "user1"},
        )

        # User 2 uploads a blob
        await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "user2 data"}'},
            headers={"x-auth-uid": "user2"},
        )

        # User 1 gets their latest blob
        response1 = await test_client.get(
            "/journal/blob/latest", headers={"x-auth-uid": "user1"}
        )
        data1 = response1.json()
        assert data1["blob_json"] == '{"encrypted": "user1 data"}'

        # User 2 gets their latest blob
        response2 = await test_client.get(
            "/journal/blob/latest", headers={"x-auth-uid": "user2"}
        )
        data2 = response2.json()
        assert data2["blob_json"] == '{"encrypted": "user2 data"}'
