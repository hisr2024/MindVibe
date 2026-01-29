"""Unit tests for refresh service."""

import pytest
from datetime import UTC, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User, Session, RefreshToken
from backend.services import refresh_service
from backend.core.settings import settings


def ensure_utc(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware UTC for SQLite test compatibility."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


@pytest.fixture
async def test_user(test_db: AsyncSession):
    """Create a test user."""
    user = User(auth_uid="test-uid-123", email="test@example.com", hashed_password="hashed")
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture
async def test_session(test_db: AsyncSession, test_user):
    """Create a test session."""
    import secrets
    session = Session(
        id=secrets.token_urlsafe(32),
        user_id=test_user.id,
        expires_at=datetime.now(UTC) + timedelta(days=7),
        last_used_at=datetime.now(UTC),
    )
    test_db.add(session)
    await test_db.commit()
    await test_db.refresh(session)
    return session


@pytest.mark.asyncio
class TestTokenGeneration:
    """Test token generation functions."""

    def test_generate_refresh_token_value(self):
        """Test generating random token values."""
        token1 = refresh_service.generate_refresh_token_value()
        token2 = refresh_service.generate_refresh_token_value()

        # Should be different
        assert token1 != token2
        # Should be URL-safe
        assert isinstance(token1, str)
        assert len(token1) > 0

    async def test_create_refresh_token(self, test_db, test_user, test_session):
        """Test creating a refresh token."""
        token_row, raw_token = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        assert token_row is not None
        assert token_row.user_id == test_user.id
        assert token_row.session_id == str(test_session.id)
        assert token_row.token_hash is not None
        assert ensure_utc(token_row.expires_at) > datetime.now(UTC)
        assert raw_token is not None
        assert isinstance(raw_token, str)


@pytest.mark.asyncio
class TestTokenRetrieval:
    """Test token retrieval and validation."""

    async def test_get_refresh_token_by_raw(self, test_db, test_user, test_session):
        """Test retrieving token by raw value."""
        # Create a token
        token_row, raw_token = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        # Retrieve it
        found = await refresh_service.get_refresh_token_by_raw(test_db, raw_token)

        assert found is not None
        assert found.id == token_row.id
        assert found.user_id == test_user.id

    async def test_get_refresh_token_invalid(self, test_db):
        """Test retrieving with invalid raw token."""
        found = await refresh_service.get_refresh_token_by_raw(test_db, "invalid-token")
        assert found is None

    async def test_get_refresh_token_revoked(self, test_db, test_user, test_session):
        """Test that revoked tokens are not returned."""
        # Create and revoke a token
        token_row, raw_token = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )
        await refresh_service.mark_revoked(test_db, token_row)

        # Should not find it
        found = await refresh_service.get_refresh_token_by_raw(test_db, raw_token)
        assert found is None


@pytest.mark.asyncio
class TestTokenExpiration:
    """Test token expiration logic."""

    async def test_is_expired_fresh_token(self, test_db, test_user, test_session):
        """Test that fresh tokens are not expired."""
        token_row, _ = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        assert not refresh_service.is_expired(token_row)

    async def test_is_expired_old_token(self, test_db, test_user, test_session):
        """Test that old tokens are expired."""
        token_row, _ = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        # Manually set expired date
        token_row.expires_at = datetime.now(UTC) - timedelta(days=1)

        assert refresh_service.is_expired(token_row)


@pytest.mark.asyncio
class TestTokenRotation:
    """Test token rotation."""

    async def test_mark_rotated(self, test_db, test_user, test_session):
        """Test marking token as rotated."""
        token_row, _ = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        await refresh_service.mark_rotated(test_db, token_row)
        await test_db.refresh(token_row)

        assert token_row.rotated_at is not None

    async def test_rotate_refresh_token(self, test_db, test_user, test_session):
        """Test rotating a refresh token."""
        old_token, old_raw = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        new_token, new_raw = await refresh_service.rotate_refresh_token(
            test_db, old_token
        )

        # Old token should be rotated
        await test_db.refresh(old_token)
        assert old_token.rotated_at is not None

        # New token should exist
        assert new_token is not None
        assert new_token.user_id == test_user.id
        assert new_token.parent_id == old_token.id
        assert new_raw != old_raw


@pytest.mark.asyncio
class TestTokenRevocation:
    """Test token revocation."""

    async def test_mark_revoked(self, test_db, test_user, test_session):
        """Test marking token as revoked."""
        token_row, _ = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        await refresh_service.mark_revoked(test_db, token_row)
        await test_db.refresh(token_row)

        assert token_row.revoked_at is not None
        assert not token_row.reuse_detected

    async def test_mark_revoked_with_reuse(self, test_db, test_user, test_session):
        """Test marking token as revoked due to reuse."""
        token_row, _ = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        await refresh_service.mark_revoked(test_db, token_row, reuse=True)
        await test_db.refresh(token_row)

        assert token_row.revoked_at is not None
        assert token_row.reuse_detected

    async def test_revoke_all_for_session(self, test_db, test_user, test_session):
        """Test revoking all tokens for a session."""
        # Create multiple tokens
        token1, _ = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )
        token2, _ = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        await refresh_service.revoke_all_for_session(test_db, str(test_session.id))

        # Both should be revoked
        await test_db.refresh(token1)
        await test_db.refresh(token2)
        assert token1.revoked_at is not None
        assert token2.revoked_at is not None


@pytest.mark.asyncio
class TestReuseDetection:
    """Test reuse attack detection."""

    async def test_handle_reuse_attack(self, test_db, test_user, test_session):
        """Test handling a reuse attack."""
        # Create and rotate a token
        old_token, old_raw = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )
        new_token, new_raw = await refresh_service.rotate_refresh_token(
            test_db, old_token
        )

        # Handle reuse attack on old token
        await refresh_service.handle_reuse_attack(test_db, old_token)

        # Old token should be marked as reused
        await test_db.refresh(old_token)
        assert old_token.reuse_detected is True
        assert old_token.revoked_at is not None

        # New token should also be revoked
        await test_db.refresh(new_token)
        assert new_token.revoked_at is not None

        # Session should be revoked
        await test_db.refresh(test_session)
        assert test_session.revoked_at is not None


@pytest.mark.asyncio
class TestValidateAndPrepareRotation:
    """Test validation before rotation."""

    async def test_validate_valid_token(self, test_db, test_user, test_session):
        """Test validating a valid token."""
        token_row, raw_token = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        result = await refresh_service.validate_and_prepare_rotation(
            test_db, raw_token
        )

        assert result is not None
        assert result[0].id == token_row.id
        assert result[1].id == test_session.id

    async def test_validate_invalid_token(self, test_db):
        """Test validating an invalid token."""
        with pytest.raises(ValueError, match="invalid_refresh_token"):
            await refresh_service.validate_and_prepare_rotation(
                test_db, "invalid-token"
            )

    async def test_validate_rotated_token(self, test_db, test_user, test_session):
        """Test validating a rotated token."""
        # Create and rotate
        old_token, old_raw = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )
        await refresh_service.rotate_refresh_token(test_db, old_token)

        # Should detect reuse
        with pytest.raises(ValueError, match="reuse_detected"):
            await refresh_service.validate_and_prepare_rotation(test_db, old_raw)

    async def test_validate_expired_token(self, test_db, test_user, test_session):
        """Test validating an expired token."""
        token_row, raw_token = await refresh_service.create_refresh_token(
            test_db, user_id=test_user.id, session_id=str(test_session.id)
        )

        # Manually expire it
        token_row.expires_at = datetime.now(UTC) - timedelta(days=1)
        await test_db.commit()

        with pytest.raises(ValueError, match="expired_token"):
            await refresh_service.validate_and_prepare_rotation(test_db, raw_token)
