"""
Integration tests for the Journal API endpoints.

Tests the encrypted blob upload/retrieval and the full entries CRUD
(create, read, update, soft-delete) with encrypted content.
All tests use JWT Bearer tokens for authentication (X-Auth-UID was removed).
"""

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User
from tests.conftest import auth_headers_for


# Helper: minimal encrypted payload for tests (not real encryption)
SAMPLE_ENCRYPTED_CONTENT = {
    "ciphertext": "dGVzdCBjb250ZW50",
    "iv": "dGVzdGl2MTIzNDU2",
    "salt": "dGVzdHNhbHQxMjM0NTY3OA==",
    "algorithm": "AES-GCM",
}

SAMPLE_ENCRYPTED_TITLE = {
    "ciphertext": "dGVzdCB0aXRsZQ==",
    "iv": "dGVzdGl2MTIzNDU2",
    "salt": "dGVzdHNhbHQxMjM0NTY3OA==",
    "algorithm": "AES-GCM",
}


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
            "/api/journal/blob",
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
            "/api/journal/blob",
            json={"blob_json": '{"encrypted": "first entry"}'},
            headers=headers,
        )

        # Upload second blob
        await test_client.post(
            "/api/journal/blob",
            json={"blob_json": '{"encrypted": "second entry"}'},
            headers=headers,
        )

        # Get the latest - should return one of the blobs
        response = await test_client.get(
            "/api/journal/blob/latest", headers=headers
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
            "/api/journal/blob/latest", headers=auth_headers_for(user.id)
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
            "/api/journal/blob",
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
            "/api/journal/blob",
            json={"blob_json": '{"encrypted": "user1 data"}'},
            headers=headers1,
        )

        # User 2 uploads a blob
        await test_client.post(
            "/api/journal/blob",
            json={"blob_json": '{"encrypted": "user2 data"}'},
            headers=headers2,
        )

        # User 1 gets their latest blob
        response1 = await test_client.get(
            "/api/journal/blob/latest", headers=headers1
        )
        data1 = response1.json()
        assert data1["blob_json"] == '{"encrypted": "user1 data"}'

        # User 2 gets their latest blob
        response2 = await test_client.get(
            "/api/journal/blob/latest", headers=headers2
        )
        data2 = response2.json()
        assert data2["blob_json"] == '{"encrypted": "user2 data"}'


class TestJournalEntriesCRUD:
    """Test the /journal/entries CRUD endpoints."""

    @pytest.mark.asyncio
    async def test_create_entry(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Create a journal entry with encrypted content and verify 201."""
        user = User(
            auth_uid="entry-user-1",
            email="entry1@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        payload = {
            "content": SAMPLE_ENCRYPTED_CONTENT,
            "title": SAMPLE_ENCRYPTED_TITLE,
            "moods": ["Peaceful", "Grateful"],
            "tags": ["Reflection"],
            "client_updated_at": datetime.now(timezone.utc).isoformat(),
        }

        response = await test_client.post(
            "/api/journal/entries",
            json=payload,
            headers=auth_headers_for(user.id),
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["encrypted_content"]["ciphertext"] == SAMPLE_ENCRYPTED_CONTENT["ciphertext"]
        assert data["moods"] == ["Peaceful", "Grateful"]
        assert data["tags"] == ["Reflection"]

    @pytest.mark.asyncio
    async def test_list_entries(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Create entries and verify list endpoint returns them."""
        user = User(
            auth_uid="entry-user-list",
            email="entrylist@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        headers = auth_headers_for(user.id)

        # Create two entries
        for i in range(2):
            await test_client.post(
                "/api/journal/entries",
                json={
                    "content": SAMPLE_ENCRYPTED_CONTENT,
                    "client_updated_at": datetime.now(timezone.utc).isoformat(),
                },
                headers=headers,
            )

        response = await test_client.get(
            "/api/journal/entries", headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_get_single_entry(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Fetch a specific entry by ID."""
        user = User(
            auth_uid="entry-user-single",
            email="entrysingle@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        headers = auth_headers_for(user.id)

        create_resp = await test_client.post(
            "/api/journal/entries",
            json={
                "content": SAMPLE_ENCRYPTED_CONTENT,
                "moods": ["Happy"],
                "client_updated_at": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        entry_id = create_resp.json()["id"]

        response = await test_client.get(
            f"/api/journal/entries/{entry_id}", headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == entry_id
        assert data["moods"] == ["Happy"]

    @pytest.mark.asyncio
    async def test_get_entry_not_found(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Fetching a nonexistent entry returns 404."""
        user = User(
            auth_uid="entry-user-404",
            email="entry404@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        response = await test_client.get(
            "/api/journal/entries/nonexistent-id",
            headers=auth_headers_for(user.id),
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_entry(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Update an entry with a newer client_updated_at timestamp."""
        user = User(
            auth_uid="entry-user-update",
            email="entryupdate@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        headers = auth_headers_for(user.id)

        create_resp = await test_client.post(
            "/api/journal/entries",
            json={
                "content": SAMPLE_ENCRYPTED_CONTENT,
                "moods": ["Neutral"],
                "client_updated_at": "2026-01-01T00:00:00",
            },
            headers=headers,
        )
        entry_id = create_resp.json()["id"]

        # Update with a newer timestamp
        update_resp = await test_client.put(
            f"/api/journal/entries/{entry_id}",
            json={
                "moods": ["Peaceful", "Grateful"],
                "client_updated_at": "2026-03-21T00:00:00",
            },
            headers=headers,
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["moods"] == ["Peaceful", "Grateful"]

    @pytest.mark.asyncio
    async def test_update_entry_conflict(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Updating with an older timestamp should return 409 conflict."""
        user = User(
            auth_uid="entry-user-conflict",
            email="entryconflict@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        headers = auth_headers_for(user.id)

        create_resp = await test_client.post(
            "/api/journal/entries",
            json={
                "content": SAMPLE_ENCRYPTED_CONTENT,
                "client_updated_at": "2026-03-21T12:00:00",
            },
            headers=headers,
        )
        entry_id = create_resp.json()["id"]

        # Update with an older timestamp (conflict)
        update_resp = await test_client.put(
            f"/api/journal/entries/{entry_id}",
            json={
                "moods": ["Anxious"],
                "client_updated_at": "2026-03-21T11:00:00",
            },
            headers=headers,
        )
        assert update_resp.status_code == 409

    @pytest.mark.asyncio
    async def test_soft_delete_entry(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Delete an entry and verify it's soft-deleted (not returned in list)."""
        user = User(
            auth_uid="entry-user-delete",
            email="entrydelete@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        headers = auth_headers_for(user.id)

        create_resp = await test_client.post(
            "/api/journal/entries",
            json={
                "content": SAMPLE_ENCRYPTED_CONTENT,
                "client_updated_at": datetime.now(timezone.utc).isoformat(),
            },
            headers=headers,
        )
        entry_id = create_resp.json()["id"]

        # Delete
        del_resp = await test_client.delete(
            f"/api/journal/entries/{entry_id}", headers=headers
        )
        assert del_resp.status_code == 200
        assert del_resp.json()["status"] == "deleted"

        # Entry should no longer appear in GET by ID
        get_resp = await test_client.get(
            f"/api/journal/entries/{entry_id}", headers=headers
        )
        assert get_resp.status_code == 404

        # Entry should no longer appear in list
        list_resp = await test_client.get(
            "/api/journal/entries", headers=headers
        )
        entry_ids = [e["id"] for e in list_resp.json()]
        assert entry_id not in entry_ids

    @pytest.mark.asyncio
    async def test_create_entry_requires_auth(self, test_client: AsyncClient):
        """Creating an entry without authentication returns 401."""
        response = await test_client.post(
            "/api/journal/entries",
            json={
                "content": SAMPLE_ENCRYPTED_CONTENT,
                "client_updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_entry_user_isolation(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """User A cannot access User B's journal entries."""
        user_a = User(
            auth_uid="entry-iso-a",
            email="entry_iso_a@example.com",
            hashed_password="hashed",
            locale="en",
        )
        user_b = User(
            auth_uid="entry-iso-b",
            email="entry_iso_b@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add_all([user_a, user_b])
        await test_db.commit()
        await test_db.refresh(user_a)
        await test_db.refresh(user_b)

        # User A creates an entry
        create_resp = await test_client.post(
            "/api/journal/entries",
            json={
                "content": SAMPLE_ENCRYPTED_CONTENT,
                "client_updated_at": datetime.now(timezone.utc).isoformat(),
            },
            headers=auth_headers_for(user_a.id),
        )
        entry_id = create_resp.json()["id"]

        # User B cannot fetch User A's entry
        get_resp = await test_client.get(
            f"/api/journal/entries/{entry_id}",
            headers=auth_headers_for(user_b.id),
        )
        assert get_resp.status_code == 404

        # User B's list should be empty
        list_resp = await test_client.get(
            "/api/journal/entries",
            headers=auth_headers_for(user_b.id),
        )
        assert list_resp.json() == []
