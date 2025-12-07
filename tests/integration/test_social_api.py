"""
Integration tests for the Social Features API endpoints.

Tests friend connections, group meditations, and wisdom sharing.
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User
from backend.social.main import app as social_app
from backend import deps


class TestSocialEndpoints:
    """Test the /social endpoints."""

    @pytest.mark.asyncio
    async def test_social_health(self):
        """Test the social health endpoint."""
        async with AsyncClient(
            transport=ASGITransport(app=social_app), base_url="http://test"
        ) as client:
            response = await client.get("/social/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["service"] == "social"
            assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_send_friend_request(self, test_db: AsyncSession):
        """Test sending a friend request."""
        # Create test users
        user1 = User(
            id=1,
            auth_uid="test-user-1",
            email="user1@example.com",
            username="user1",
            hashed_password="hashed_password",
            locale="en"
        )
        user2 = User(
            id=2,
            auth_uid="test-user-2",
            email="user2@example.com",
            username="user2",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user1)
        test_db.add(user2)
        await test_db.commit()

        # Override get_db dependency
        async def override_get_db():
            yield test_db

        social_app.dependency_overrides[deps.get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=social_app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/social/v1/connections?current_user_id=1",
                json={"friend_id": 2}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "request_sent"
            assert "connection_id" in data

        social_app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_connections(self, test_db: AsyncSession):
        """Test getting user connections."""
        from sqlalchemy import text

        # Create test users
        user1 = User(
            id=1,
            auth_uid="test-user-1",
            email="user1@example.com",
            username="user1",
            hashed_password="hashed_password",
            locale="en"
        )
        user2 = User(
            id=2,
            auth_uid="test-user-2",
            email="user2@example.com",
            username="user2",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user1)
        test_db.add(user2)
        await test_db.commit()

        # Create a connection
        insert = text("""
            INSERT INTO user_connections (user_id, friend_id, status, created_at)
            VALUES (1, 2, 'accepted', NOW())
        """)
        await test_db.execute(insert)
        await test_db.commit()

        # Override get_db dependency
        async def override_get_db():
            yield test_db

        social_app.dependency_overrides[deps.get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=social_app), base_url="http://test"
        ) as client:
            response = await client.get(
                "/social/v1/connections?current_user_id=1&status=accepted"
            )
            assert response.status_code == 200
            data = response.json()
            assert "connections" in data
            assert len(data["connections"]) == 1
            assert data["connections"][0]["friend_id"] == 2

        social_app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_create_group_meditation(self, test_db: AsyncSession):
        """Test creating a group meditation."""
        # Create test user
        user = User(
            id=1,
            auth_uid="test-user-1",
            email="user1@example.com",
            username="user1",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()

        # Override get_db dependency
        async def override_get_db():
            yield test_db

        social_app.dependency_overrides[deps.get_db] = override_get_db

        scheduled_time = (datetime.now() + timedelta(days=1)).isoformat()

        async with AsyncClient(
            transport=ASGITransport(app=social_app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/social/v1/groups?current_user_id=1",
                json={
                    "name": "Morning Meditation",
                    "description": "Start the day with mindfulness",
                    "scheduled_at": scheduled_time
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "created"
            assert "group_id" in data

        social_app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_groups(self, test_db: AsyncSession):
        """Test getting user's group meditations."""
        from sqlalchemy import text

        # Create test user
        user = User(
            id=1,
            auth_uid="test-user-1",
            email="user1@example.com",
            username="user1",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()

        # Create a group
        scheduled_time = datetime.now() + timedelta(days=1)
        insert_group = text("""
            INSERT INTO group_meditations (name, description, created_by, scheduled_at, created_at)
            VALUES ('Morning Meditation', 'Start the day', 1, :scheduled_at, NOW())
            RETURNING id
        """)
        result = await test_db.execute(insert_group, {"scheduled_at": scheduled_time})
        group_id = result.scalar()
        await test_db.commit()

        # Add participant
        insert_participant = text("""
            INSERT INTO group_participants (group_id, user_id, joined_at)
            VALUES (:group_id, 1, NOW())
        """)
        await test_db.execute(insert_participant, {"group_id": group_id})
        await test_db.commit()

        # Override get_db dependency
        async def override_get_db():
            yield test_db

        social_app.dependency_overrides[deps.get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=social_app), base_url="http://test"
        ) as client:
            response = await client.get(
                "/social/v1/groups?current_user_id=1"
            )
            assert response.status_code == 200
            data = response.json()
            assert "groups" in data
            assert len(data["groups"]) == 1
            assert data["groups"][0]["name"] == "Morning Meditation"

        social_app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_share_wisdom(self, test_db: AsyncSession):
        """Test sharing Gita verse."""
        from sqlalchemy import text

        # Create test user
        user = User(
            id=1,
            auth_uid="test-user-1",
            email="user1@example.com",
            username="user1",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user)
        await test_db.commit()

        # Create a test Gita verse
        insert_verse = text("""
            INSERT INTO gita_verses (chapter, verse_number, verse_text, translation, commentary)
            VALUES (2, 47, 'Sanskrit text', 'English translation', 'Commentary')
            RETURNING id
        """)
        result = await test_db.execute(insert_verse)
        verse_id = result.scalar()
        await test_db.commit()

        # Override get_db dependency
        async def override_get_db():
            yield test_db

        social_app.dependency_overrides[deps.get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=social_app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/social/v1/wisdom-share?current_user_id=1",
                json={
                    "gita_verse_id": verse_id,
                    "share_text": "This verse helped me today",
                    "visibility": "friends"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "shared"
            assert "share_id" in data

        social_app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_wisdom_feed(self, test_db: AsyncSession):
        """Test getting wisdom feed."""
        from sqlalchemy import text

        # Create test users
        user1 = User(
            id=1,
            auth_uid="test-user-1",
            email="user1@example.com",
            username="user1",
            hashed_password="hashed_password",
            locale="en"
        )
        user2 = User(
            id=2,
            auth_uid="test-user-2",
            email="user2@example.com",
            username="user2",
            hashed_password="hashed_password",
            locale="en"
        )
        test_db.add(user1)
        test_db.add(user2)
        await test_db.commit()

        # Create a test Gita verse
        insert_verse = text("""
            INSERT INTO gita_verses (chapter, verse_number, verse_text, translation, commentary)
            VALUES (2, 47, 'Sanskrit text', 'English translation', 'Commentary')
            RETURNING id
        """)
        result = await test_db.execute(insert_verse)
        verse_id = result.scalar()
        await test_db.commit()

        # Create a wisdom share
        insert_share = text("""
            INSERT INTO wisdom_shares (user_id, gita_verse_id, share_text, visibility, created_at)
            VALUES (2, :verse_id, 'This is inspiring', 'public', NOW())
        """)
        await test_db.execute(insert_share, {"verse_id": verse_id})
        await test_db.commit()

        # Override get_db dependency
        async def override_get_db():
            yield test_db

        social_app.dependency_overrides[deps.get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=social_app), base_url="http://test"
        ) as client:
            response = await client.get(
                "/social/v1/wisdom-feed?current_user_id=1&limit=20"
            )
            assert response.status_code == 200
            data = response.json()
            assert "wisdom_feed" in data
            assert len(data["wisdom_feed"]) == 1
            assert data["wisdom_feed"][0]["username"] == "user2"

        social_app.dependency_overrides.clear()
