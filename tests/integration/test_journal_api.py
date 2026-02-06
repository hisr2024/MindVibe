"""
Integration tests for the Journal API endpoints.

Tests the encrypted blob upload and retrieval functionality.
All tests use JWT Bearer tokens for authentication (X-Auth-UID was removed).
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User
from tests.conftest import auth_headers_for


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
        await test_db.refresh(user)

        response = await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "journal data"}'},
            headers=auth_headers_for(user.id),
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
        await test_db.refresh(user)

        headers = auth_headers_for(user.id)

        # Upload first blob
        await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "first entry"}'},
            headers=headers,
        )

        # Upload second blob
        await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "second entry"}'},
            headers=headers,
        )

        # Get the latest - should return one of the blobs
        response = await test_client.get(
            "/journal/blob/latest", headers=headers
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
        await test_db.refresh(user)

        response = await test_client.get(
            "/journal/blob/latest", headers=auth_headers_for(user.id)
        )

        assert response.status_code == 200
        data = response.json()
        assert data == {}

    @pytest.mark.asyncio
    async def test_upload_blob_requires_auth(self, test_client: AsyncClient):
        """Test that uploading a blob without authentication returns 401.

        Previously this auto-created users via X-Auth-UID which has been
        removed for security.
        """
        response = await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "new user data"}'},
        )

        assert response.status_code == 401

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
        await test_db.refresh(user1)
        await test_db.refresh(user2)

        headers1 = auth_headers_for(user1.id)
        headers2 = auth_headers_for(user2.id)

        # User 1 uploads a blob
        await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "user1 data"}'},
            headers=headers1,
        )

        # User 2 uploads a blob
        await test_client.post(
            "/journal/blob",
            json={"blob_json": '{"encrypted": "user2 data"}'},
            headers=headers2,
        )

        # User 1 gets their latest blob
        response1 = await test_client.get(
            "/journal/blob/latest", headers=headers1
        )
        data1 = response1.json()
        assert data1["blob_json"] == '{"encrypted": "user1 data"}'

        # User 2 gets their latest blob
        response2 = await test_client.get(
            "/journal/blob/latest", headers=headers2
        )
        data2 = response2.json()
        assert data2["blob_json"] == '{"encrypted": "user2 data"}'
