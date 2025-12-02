"""Tests for Two-Factor Authentication (2FA) functionality.

These tests verify:
- 2FA secret generation
- TOTP code verification
- Backup code generation and verification
"""

import pytest
from backend.security.two_factor import (
    generate_2fa_secret,
    generate_backup_codes,
    verify_totp_code,
    verify_backup_code,
    get_totp_uri,
    get_current_totp_code,
    TwoFactorAuth,
)


class TestTwoFactorSecretGeneration:
    """Tests for 2FA secret generation."""

    def test_generate_secret_length(self):
        """Test that generated secrets have correct length."""
        secret = generate_2fa_secret()
        
        # pyotp.random_base32() generates a 32-character secret by default
        assert len(secret) == 32
        assert secret.isalnum()

    def test_generate_unique_secrets(self):
        """Test that each secret is unique."""
        secrets = [generate_2fa_secret() for _ in range(10)]
        
        # All secrets should be unique
        assert len(set(secrets)) == 10


class TestBackupCodes:
    """Tests for backup code generation and verification."""

    def test_generate_backup_codes_count(self):
        """Test that correct number of backup codes are generated."""
        codes = generate_backup_codes(count=8)
        
        assert len(codes) == 8

    def test_generate_backup_codes_format(self):
        """Test that backup codes have correct format."""
        codes = generate_backup_codes()
        
        for code in codes:
            # Format should be XXXX-XXXX-XXXX
            parts = code.split("-")
            assert len(parts) == 3
            for part in parts:
                assert len(part) == 4
                assert part.isalnum()

    def test_backup_codes_unique(self):
        """Test that all backup codes are unique."""
        codes = generate_backup_codes(count=8)
        
        assert len(set(codes)) == 8

    def test_verify_backup_code_valid(self):
        """Test that valid backup codes are verified correctly."""
        stored_codes = ["ABCD-1234-EFGH", "IJKL-5678-MNOP"]
        
        # Should find the code at index 0
        result = verify_backup_code("ABCD-1234-EFGH", stored_codes)
        assert result == 0
        
        # Should find the code at index 1
        result = verify_backup_code("IJKL-5678-MNOP", stored_codes)
        assert result == 1

    def test_verify_backup_code_case_insensitive(self):
        """Test that backup code verification is case-insensitive."""
        stored_codes = ["ABCD-1234-EFGH"]
        
        # Lowercase should work
        result = verify_backup_code("abcd-1234-efgh", stored_codes)
        assert result == 0

    def test_verify_backup_code_invalid(self):
        """Test that invalid backup codes return None."""
        stored_codes = ["ABCD-1234-EFGH"]
        
        result = verify_backup_code("INVALID-CODE-HERE", stored_codes)
        assert result is None


class TestTOTPVerification:
    """Tests for TOTP code verification."""

    def test_verify_valid_code(self):
        """Test that current TOTP code is verified correctly."""
        secret = generate_2fa_secret()
        
        # Get the current code
        current_code = get_current_totp_code(secret)
        
        # Verify it
        assert verify_totp_code(secret, current_code) is True

    def test_verify_invalid_code(self):
        """Test that invalid TOTP code is rejected."""
        secret = generate_2fa_secret()
        
        # Try an obviously wrong code
        assert verify_totp_code(secret, "000000") is False

    def test_verify_code_wrong_length(self):
        """Test that codes with wrong length are rejected."""
        secret = generate_2fa_secret()
        
        # Too short
        assert verify_totp_code(secret, "12345") is False
        
        # Too long
        assert verify_totp_code(secret, "1234567") is False

    def test_verify_code_non_numeric(self):
        """Test that non-numeric codes are rejected."""
        secret = generate_2fa_secret()
        
        assert verify_totp_code(secret, "abcdef") is False

    def test_verify_code_with_spaces(self):
        """Test that codes with spaces are handled correctly."""
        secret = generate_2fa_secret()
        current_code = get_current_totp_code(secret)
        
        # Add spaces - should still work
        spaced_code = f"{current_code[:3]} {current_code[3:]}"
        assert verify_totp_code(secret, spaced_code) is True

    def test_verify_empty_secret(self):
        """Test that empty secret returns False."""
        assert verify_totp_code("", "123456") is False

    def test_verify_empty_code(self):
        """Test that empty code returns False."""
        secret = generate_2fa_secret()
        assert verify_totp_code(secret, "") is False


class TestTOTPUri:
    """Tests for TOTP URI generation."""

    def test_uri_format(self):
        """Test that TOTP URI has correct format."""
        secret = generate_2fa_secret()
        uri = get_totp_uri(secret, "user@example.com", "MindVibe")
        
        assert uri.startswith("otpauth://totp/")
        assert "MindVibe" in uri
        assert "user%40example.com" in uri or "user@example.com" in uri
        assert f"secret={secret}" in uri

    def test_uri_with_special_characters(self):
        """Test URI generation with special characters in email."""
        secret = generate_2fa_secret()
        uri = get_totp_uri(secret, "user+test@example.com", "Mind Vibe App")
        
        assert uri.startswith("otpauth://totp/")
        assert secret in uri


class TestTwoFactorAuthClass:
    """Tests for the TwoFactorAuth high-level class."""

    def test_setup_2fa(self):
        """Test 2FA setup returns all required data."""
        tfa = TwoFactorAuth(issuer="TestApp")
        setup_data = tfa.setup_2fa("user@example.com")
        
        # Check all required keys are present
        assert "secret" in setup_data
        assert "uri" in setup_data
        assert "qr_code" in setup_data  # May be empty if qrcode not installed
        assert "backup_codes" in setup_data
        
        # Verify data types
        assert isinstance(setup_data["secret"], str)
        assert isinstance(setup_data["uri"], str)
        assert isinstance(setup_data["backup_codes"], list)
        assert len(setup_data["backup_codes"]) == 8

    def test_verify_code_method(self):
        """Test the verify_code method."""
        tfa = TwoFactorAuth()
        setup_data = tfa.setup_2fa("user@example.com")
        
        # Get current code and verify
        current_code = get_current_totp_code(setup_data["secret"])
        assert tfa.verify_code(setup_data["secret"], current_code) is True

    def test_verify_backup_method(self):
        """Test the verify_backup method."""
        tfa = TwoFactorAuth()
        setup_data = tfa.setup_2fa("user@example.com")
        
        # Verify backup code
        result = tfa.verify_backup(
            setup_data["backup_codes"][0],
            setup_data["backup_codes"]
        )
        assert result == 0
