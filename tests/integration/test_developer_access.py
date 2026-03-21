"""
Integration tests for developer access control.

Verifies that developer access is correctly scoped to configured emails
and does not leak to non-developer accounts.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User, Session
from tests.conftest import auth_headers_for


async def _create_user_with_session(
    db: AsyncSession, auth_uid: str, email: str | None
) -> tuple[User, str]:
    """Create a user and a matching session so /me endpoint works."""
    from datetime import datetime, timedelta, UTC
    from backend.security.jwt import create_access_token

    user = User(
        auth_uid=auth_uid,
        email=email,
        hashed_password="$2b$12$test_hashed",
        email_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create session with the ID that create_test_token uses
    session = Session(
        id="test-session",
        user_id=user.id,
        expires_at=datetime.now(UTC) + timedelta(hours=1),
        last_used_at=datetime.now(UTC),
    )
    db.add(session)
    await db.commit()

    return user, auth_headers_for(user.id)


class TestDeveloperAccessControl:
    """Verify developer status is only granted to configured developer emails."""

    @pytest.mark.asyncio
    async def test_non_developer_login_returns_is_developer_false(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """A regular user /me must return is_developer=false."""
        user, headers = await _create_user_with_session(
            test_db, "non-dev-auth-001", "regular_user@example.com"
        )

        response = await test_client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_developer"] is False
        assert data["subscription_tier"] == "free"

    @pytest.mark.asyncio
    async def test_non_developer_subscription_returns_is_developer_false(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """A regular user's subscription endpoint must return is_developer=false."""
        user = User(
            auth_uid="non-dev-auth-002",
            email="another_user@example.com",
            hashed_password="$2b$12$test_hashed",
            email_verified=True,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        headers = auth_headers_for(user.id)
        response = await test_client.get("/api/subscriptions/current", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_developer"] is False
        assert data["effective_tier"] != "siddha"

    @pytest.mark.asyncio
    async def test_is_developer_function_returns_false_for_regular_email(
        self, test_db: AsyncSession
    ):
        """The is_developer() function must return False for non-developer emails."""
        from backend.middleware.feature_access import is_developer

        user = User(
            auth_uid="non-dev-auth-003",
            email="not_a_dev@test.com",
            hashed_password="$2b$12$test_hashed",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        result = await is_developer(test_db, user.id)
        assert result is False

    @pytest.mark.asyncio
    async def test_is_developer_function_returns_false_for_user_without_email(
        self, test_db: AsyncSession
    ):
        """Users without an email must not get developer access."""
        from backend.middleware.feature_access import is_developer

        user = User(
            auth_uid="non-dev-auth-004",
            email=None,
            hashed_password="$2b$12$test_hashed",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        result = await is_developer(test_db, user.id)
        assert result is False

    @pytest.mark.asyncio
    async def test_is_developer_function_returns_false_for_nonexistent_user(
        self, test_db: AsyncSession
    ):
        """Non-existent user IDs must not get developer access."""
        from backend.middleware.feature_access import is_developer

        result = await is_developer(test_db, "nonexistent-user-id-999")
        assert result is False

    @pytest.mark.asyncio
    async def test_developer_email_gets_access(
        self, test_db: AsyncSession
    ):
        """Configured developer emails should get developer access."""
        from backend.middleware.feature_access import is_developer, DEVELOPER_EMAILS

        if not DEVELOPER_EMAILS:
            pytest.skip("No developer emails configured")

        dev_email = next(iter(DEVELOPER_EMAILS))
        user = User(
            auth_uid="dev-auth-005",
            email=dev_email,
            hashed_password="$2b$12$test_hashed",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        result = await is_developer(test_db, user.id)
        assert result is True

    @pytest.mark.asyncio
    async def test_developer_access_does_not_leak_across_users(
        self, test_db: AsyncSession
    ):
        """Creating a developer user must not affect other users' developer status."""
        from backend.middleware.feature_access import is_developer, DEVELOPER_EMAILS

        if not DEVELOPER_EMAILS:
            pytest.skip("No developer emails configured")

        # Create developer user
        dev_email = next(iter(DEVELOPER_EMAILS))
        dev_user = User(
            auth_uid="dev-auth-006",
            email=dev_email,
            hashed_password="$2b$12$test_hashed",
        )
        test_db.add(dev_user)

        # Create regular user
        regular_user = User(
            auth_uid="non-dev-auth-006",
            email="regular@example.com",
            hashed_password="$2b$12$test_hashed",
        )
        test_db.add(regular_user)
        await test_db.commit()
        await test_db.refresh(dev_user)
        await test_db.refresh(regular_user)

        # Developer user gets access
        assert await is_developer(test_db, dev_user.id) is True
        # Regular user does NOT get access
        assert await is_developer(test_db, regular_user.id) is False

    @pytest.mark.asyncio
    async def test_developer_me_endpoint_returns_siddha_tier(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Developer user /me endpoint should return siddha tier."""
        from backend.middleware.feature_access import DEVELOPER_EMAILS

        if not DEVELOPER_EMAILS:
            pytest.skip("No developer emails configured")

        dev_email = next(iter(DEVELOPER_EMAILS))
        user, headers = await _create_user_with_session(
            test_db, "dev-auth-007", dev_email
        )

        response = await test_client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_developer"] is True
        assert data["subscription_tier"] == "siddha"

    @pytest.mark.asyncio
    async def test_case_insensitive_developer_email_match(
        self, test_db: AsyncSession
    ):
        """Developer email matching should be case-insensitive."""
        from backend.middleware.feature_access import is_developer, DEVELOPER_EMAILS

        if not DEVELOPER_EMAILS:
            pytest.skip("No developer emails configured")

        dev_email = next(iter(DEVELOPER_EMAILS))
        user = User(
            auth_uid="dev-auth-008",
            email=dev_email.upper(),  # Use uppercase version
            hashed_password="$2b$12$test_hashed",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        result = await is_developer(test_db, user.id)
        assert result is True
