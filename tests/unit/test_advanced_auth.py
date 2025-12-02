"""Tests for advanced authentication module."""

import pytest
import time
from unittest.mock import patch

from backend.security.advanced_auth import (
    TOTPManager,
    AccountLockoutManager,
    SecureTokenManager,
    DeviceFingerprintManager,
    SessionManager,
    validate_password_strength,
    generate_secure_password_reset_token,
    generate_email_verification_token,
)


class TestTOTPManager:
    """Tests for TOTPManager."""

    @pytest.fixture
    def totp_manager(self):
        return TOTPManager(issuer="TestApp")

    def test_generate_secret(self, totp_manager):
        """Test TOTP secret generation."""
        secret = totp_manager.generate_secret()
        assert len(secret) == 32
        assert secret.isalnum()

    def test_generate_secret_uniqueness(self, totp_manager):
        """Test that generated secrets are unique."""
        secrets = [totp_manager.generate_secret() for _ in range(100)]
        assert len(set(secrets)) == 100

    def test_get_provisioning_uri(self, totp_manager):
        """Test provisioning URI generation."""
        secret = totp_manager.generate_secret()
        uri = totp_manager.get_provisioning_uri(secret, "test@example.com")

        assert uri.startswith("otpauth://totp/")
        assert "TestApp" in uri
        assert secret in uri
        assert "test%40example.com" in uri or "test@example.com" in uri

    def test_verify_code_valid(self, totp_manager):
        """Test TOTP code verification with valid code."""
        secret = totp_manager.generate_secret()
        current_code = totp_manager.get_current_code(secret)

        assert totp_manager.verify_code(secret, current_code) is True

    def test_verify_code_invalid(self, totp_manager):
        """Test TOTP code verification with invalid code."""
        secret = totp_manager.generate_secret()

        assert totp_manager.verify_code(secret, "000000") is False
        assert totp_manager.verify_code(secret, "invalid") is False

    def test_get_current_code_format(self, totp_manager):
        """Test that current code has correct format."""
        secret = totp_manager.generate_secret()
        code = totp_manager.get_current_code(secret)

        assert len(code) == 6
        assert code.isdigit()


class TestAccountLockoutManager:
    """Tests for AccountLockoutManager."""

    @pytest.fixture
    def lockout_manager(self):
        return AccountLockoutManager(
            max_attempts=3,
            lockout_duration=1,  # 1 minute for testing
            attempt_window=1,
        )

    def test_record_failed_attempt(self, lockout_manager):
        """Test recording failed attempts."""
        is_locked, remaining = lockout_manager.record_failed_attempt("user1")
        assert is_locked is False
        assert remaining == 2

    def test_account_lockout_after_max_attempts(self, lockout_manager):
        """Test account lockout after max attempts."""
        for i in range(3):
            is_locked, remaining = lockout_manager.record_failed_attempt("user2")

        assert is_locked is True
        assert remaining == 0

    def test_is_locked(self, lockout_manager):
        """Test checking if account is locked."""
        # Record max attempts to trigger lockout
        for _ in range(3):
            lockout_manager.record_failed_attempt("user3")

        is_locked, seconds = lockout_manager.is_locked("user3")
        assert is_locked is True
        assert seconds > 0

    def test_clear_failed_attempts(self, lockout_manager):
        """Test clearing failed attempts."""
        lockout_manager.record_failed_attempt("user4")
        lockout_manager.record_failed_attempt("user4")
        lockout_manager.clear_failed_attempts("user4")

        remaining = lockout_manager.get_attempts_remaining("user4")
        assert remaining == 3

    def test_get_attempts_remaining(self, lockout_manager):
        """Test getting remaining attempts."""
        assert lockout_manager.get_attempts_remaining("user5") == 3

        lockout_manager.record_failed_attempt("user5")
        assert lockout_manager.get_attempts_remaining("user5") == 2


class TestSecureTokenManager:
    """Tests for SecureTokenManager."""

    @pytest.fixture
    def token_manager(self):
        return SecureTokenManager(token_bytes=32)

    def test_generate_token(self, token_manager):
        """Test token generation."""
        token = token_manager.generate_token()
        assert len(token) > 0
        # URL-safe base64 should only contain specific characters
        assert all(c.isalnum() or c in "-_=" for c in token)

    def test_generate_token_uniqueness(self, token_manager):
        """Test that generated tokens are unique."""
        tokens = [token_manager.generate_token() for _ in range(100)]
        assert len(set(tokens)) == 100

    def test_hash_token(self, token_manager):
        """Test token hashing."""
        token = token_manager.generate_token()
        hash1 = token_manager.hash_token(token)
        hash2 = token_manager.hash_token(token)

        # Same token should produce same hash
        assert hash1 == hash2
        # Hash should be 64 characters (SHA-256 hex)
        assert len(hash1) == 64

    def test_generate_token_with_hash(self, token_manager):
        """Test generating token with its hash."""
        token, hashed = token_manager.generate_token_with_hash()

        assert len(token) > 0
        assert len(hashed) == 64
        assert token_manager.hash_token(token) == hashed

    def test_verify_token(self, token_manager):
        """Test token verification."""
        token, hashed = token_manager.generate_token_with_hash()

        assert token_manager.verify_token(token, hashed) is True
        assert token_manager.verify_token("wrong_token", hashed) is False


class TestDeviceFingerprintManager:
    """Tests for DeviceFingerprintManager."""

    @pytest.fixture
    def fingerprint_manager(self):
        return DeviceFingerprintManager()

    def test_generate_fingerprint(self, fingerprint_manager):
        """Test device fingerprint generation."""
        fingerprint = fingerprint_manager.generate_fingerprint(
            user_agent="Mozilla/5.0",
            ip_address="192.168.1.1",
            accept_language="en-US",
        )

        assert len(fingerprint) == 64  # SHA-256 hex

    def test_fingerprint_consistency(self, fingerprint_manager):
        """Test that same inputs produce same fingerprint."""
        fp1 = fingerprint_manager.generate_fingerprint(
            user_agent="Mozilla/5.0",
            ip_address="192.168.1.1",
            accept_language="en-US",
        )
        fp2 = fingerprint_manager.generate_fingerprint(
            user_agent="Mozilla/5.0",
            ip_address="192.168.1.1",
            accept_language="en-US",
        )

        assert fp1 == fp2

    def test_generate_ip_hash(self, fingerprint_manager):
        """Test IP hash generation."""
        ip_hash = fingerprint_manager.generate_ip_hash("192.168.1.1")
        assert len(ip_hash) == 16  # First 16 chars of SHA-256


class TestSessionManager:
    """Tests for SessionManager."""

    @pytest.fixture
    def session_manager(self):
        return SessionManager(session_duration_hours=24)

    def test_create_session_id(self, session_manager):
        """Test session ID creation."""
        session_id = session_manager.create_session_id()
        assert len(session_id) > 0

    def test_session_id_uniqueness(self, session_manager):
        """Test that session IDs are unique."""
        ids = [session_manager.create_session_id() for _ in range(100)]
        assert len(set(ids)) == 100

    def test_calculate_expiration(self, session_manager):
        """Test expiration calculation."""
        from datetime import datetime, UTC, timedelta

        expiration = session_manager.calculate_expiration()
        now = datetime.now(UTC)

        # Should be approximately 24 hours from now
        delta = expiration - now
        assert 23 <= delta.total_seconds() / 3600 <= 25

    def test_is_session_expired(self, session_manager):
        """Test session expiration check."""
        from datetime import datetime, UTC, timedelta

        future = datetime.now(UTC) + timedelta(hours=1)
        past = datetime.now(UTC) - timedelta(hours=1)

        assert session_manager.is_session_expired(future) is False
        assert session_manager.is_session_expired(past) is True


class TestPasswordValidation:
    """Tests for password validation."""

    def test_validate_weak_password(self):
        """Test validation of weak passwords."""
        result = validate_password_strength("abc")
        assert result["valid"] is False
        assert result["strength"] == "weak"
        assert len(result["errors"]) > 0

    def test_validate_medium_password(self):
        """Test validation of medium strength passwords."""
        result = validate_password_strength("Secure1234!")
        assert result["valid"] is True
        assert result["strength"] in ["medium", "strong"]

    def test_validate_strong_password(self):
        """Test validation of strong passwords."""
        result = validate_password_strength("P@ssw0rd!234")
        assert result["valid"] is True
        assert result["strength"] == "strong"

    def test_common_pattern_detection(self):
        """Test detection of common patterns."""
        result = validate_password_strength("password123")
        assert result["valid"] is False
        # Should detect "password" as common pattern


class TestTokenGeneratorFunctions:
    """Tests for token generator utility functions."""

    def test_generate_password_reset_token(self):
        """Test password reset token generation."""
        token, hashed, expires = generate_secure_password_reset_token()

        assert len(token) > 0
        assert len(hashed) == 64
        # Expiration should be in the future
        from datetime import datetime, UTC

        assert expires > datetime.now(UTC)

    def test_generate_email_verification_token(self):
        """Test email verification token generation."""
        token, hashed, expires = generate_email_verification_token()

        assert len(token) > 0
        assert len(hashed) == 64
        # Expiration should be in the future
        from datetime import datetime, UTC

        assert expires > datetime.now(UTC)
