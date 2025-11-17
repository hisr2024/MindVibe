"""Integration tests for Auth API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User
from backend.security.password_hash import hash_password


@pytest.fixture
async def test_user(test_db: AsyncSession):
    """Create a test user."""
    user = User(
        auth_uid="test-auth-uid-123",
        email="test@example.com",
        hashed_password=hash_password("Test1234"),
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.mark.asyncio
class TestSignup:
    """Test suite for /api/auth/signup endpoint."""

    async def test_signup_success(self, test_client: AsyncClient):
        """Test successful signup."""
        response = await test_client.post(
            "/api/auth/signup",
            json={"email": "newuser@example.com", "password": "NewPass123"},
        )

        assert response.status_code == 201
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "newuser@example.com"
        assert data["policy_passed"] is True

    async def test_signup_duplicate_email(self, test_client: AsyncClient, test_user):
        """Test signup with duplicate email."""
        response = await test_client.post(
            "/api/auth/signup",
            json={"email": "test@example.com", "password": "Test1234"},
        )

        assert response.status_code == 409

    async def test_signup_weak_password(self, test_client: AsyncClient):
        """Test signup with weak password."""
        response = await test_client.post(
            "/api/auth/signup",
            json={"email": "weak@example.com", "password": "weak"},
        )

        assert response.status_code == 422

    async def test_signup_invalid_email(self, test_client: AsyncClient):
        """Test signup with invalid email."""
        response = await test_client.post(
            "/api/auth/signup",
            json={"email": "not-an-email", "password": "Test1234"},
        )

        assert response.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    """Test suite for /api/auth/login endpoint."""

    async def test_login_success(self, test_client: AsyncClient, test_user):
        """Test successful login."""
        response = await test_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "Test1234"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "session_id" in data
        assert "expires_in" in data
        assert data["user_id"] == test_user.id
        assert data["email"] == test_user.email
        
        # Check that refresh token cookie was set
        assert "refresh_token" in response.cookies

    async def test_login_wrong_password(self, test_client: AsyncClient, test_user):
        """Test login with wrong password."""
        response = await test_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "WrongPass123"},
        )

        assert response.status_code == 401

    async def test_login_nonexistent_user(self, test_client: AsyncClient):
        """Test login with nonexistent user."""
        response = await test_client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "Test1234"},
        )

        assert response.status_code == 401

    async def test_login_case_insensitive_email(self, test_client: AsyncClient, test_user):
        """Test login with different case email."""
        response = await test_client.post(
            "/api/auth/login",
            json={"email": "TEST@EXAMPLE.COM", "password": "Test1234"},
        )

        assert response.status_code == 200


@pytest.mark.asyncio
class TestMe:
    """Test suite for /api/auth/me endpoint."""

    async def test_me_success(self, test_client: AsyncClient, test_user):
        """Test getting current user info."""
        # First login to get token
        login_response = await test_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "Test1234"},
        )
        token = login_response.json()["access_token"]

        # Get user info
        response = await test_client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["session_active"] is True
        assert "session_id" in data
        assert "session_expires_at" in data

    async def test_me_no_token(self, test_client: AsyncClient):
        """Test me endpoint without token."""
        response = await test_client.get("/api/auth/me")

        assert response.status_code == 401

    async def test_me_invalid_token(self, test_client: AsyncClient):
        """Test me endpoint with invalid token."""
        response = await test_client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )

        assert response.status_code == 401


@pytest.mark.asyncio
class TestLogout:
    """Test suite for /api/auth/logout endpoint."""

    async def test_logout_success(self, test_client: AsyncClient, test_user):
        """Test successful logout."""
        # Login first
        login_response = await test_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "Test1234"},
        )
        token = login_response.json()["access_token"]

        # Logout
        response = await test_client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["revoked"] is True
        assert "session_id" in data

    async def test_logout_no_token(self, test_client: AsyncClient):
        """Test logout without token."""
        response = await test_client.post("/api/auth/logout")

        assert response.status_code == 401


@pytest.mark.asyncio
class TestRefresh:
    """Test suite for /api/auth/refresh endpoint."""

    async def test_refresh_with_cookie(self, test_client: AsyncClient, test_user):
        """Test refreshing token with cookie."""
        # Login to get refresh token
        login_response = await test_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "Test1234"},
        )
        
        # Extract refresh token from cookies
        refresh_token = login_response.cookies.get("refresh_token")
        assert refresh_token is not None

        # Refresh
        response = await test_client.post(
            "/api/auth/refresh",
            json={},
            cookies={"refresh_token": refresh_token},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data

    async def test_refresh_missing_token(self, test_client: AsyncClient):
        """Test refresh without token."""
        response = await test_client.post("/api/auth/refresh", json={})

        assert response.status_code == 400

    async def test_refresh_invalid_token(self, test_client: AsyncClient):
        """Test refresh with invalid token."""
        response = await test_client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid-token"},
        )

        assert response.status_code == 401


@pytest.mark.asyncio
class TestSessions:
    """Test suite for session management endpoints."""

    async def test_list_sessions(self, test_client: AsyncClient, test_user):
        """Test listing user sessions."""
        # Login to create a session
        login_response = await test_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "Test1234"},
        )
        token = login_response.json()["access_token"]

        # List sessions
        response = await test_client.get(
            "/api/auth/sessions",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert len(data["sessions"]) > 0
        assert data["sessions"][0]["active"] is True

    async def test_revoke_session(self, test_client: AsyncClient, test_user):
        """Test revoking a specific session."""
        # Login to create a session
        login_response = await test_client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "Test1234"},
        )
        token = login_response.json()["access_token"]
        session_id = login_response.json()["session_id"]

        # Revoke the session
        response = await test_client.post(
            f"/api/auth/sessions/{session_id}/revoke",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["revoked"] is True
