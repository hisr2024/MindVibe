"""Tests for encryption module."""

import pytest
import os
from unittest.mock import patch

from backend.security.encryption import (
    FieldEncryption,
    KeyRotation,
    PIIMasker,
    GDPRCompliance,
    create_field_encryption,
    mask_pii_in_logs,
)


class TestFieldEncryption:
    """Tests for FieldEncryption."""

    @pytest.fixture
    def encryption(self):
        return FieldEncryption(key="test-secret-key-12345")

    def test_init_with_key(self, encryption):
        """Test initialization with provided key."""
        assert encryption._key is not None
        assert len(encryption._key) == 32  # SHA-256 derived key

    def test_encrypt_decrypt_roundtrip(self, encryption):
        """Test encryption and decryption roundtrip."""
        plaintext = "Hello, World!"
        encrypted = encryption.encrypt(plaintext)
        decrypted = encryption.decrypt(encrypted)

        assert decrypted == plaintext
        assert encrypted != plaintext

    def test_encrypt_produces_different_ciphertext(self, encryption):
        """Test that same plaintext produces different ciphertext (due to nonce)."""
        plaintext = "Test message"
        encrypted1 = encryption.encrypt(plaintext)
        encrypted2 = encryption.encrypt(plaintext)

        # Should produce different ciphertext due to random nonce
        assert encrypted1 != encrypted2

    def test_encrypt_empty_string(self, encryption):
        """Test encryption of empty string."""
        assert encryption.encrypt("") == ""
        assert encryption.decrypt("") == ""

    def test_encrypt_dict_field(self, encryption):
        """Test encrypting a specific field in a dictionary."""
        data = {"name": "John", "ssn": "123-45-6789"}
        result = encryption.encrypt_dict_field(data, "ssn")

        assert result["name"] == "John"
        assert result["ssn"] != "123-45-6789"

    def test_decrypt_dict_field(self, encryption):
        """Test decrypting a specific field in a dictionary."""
        data = {"name": "John", "ssn": "123-45-6789"}
        encrypted = encryption.encrypt_dict_field(data, "ssn")
        decrypted = encryption.decrypt_dict_field(encrypted, "ssn")

        assert decrypted["ssn"] == "123-45-6789"

    def test_init_without_key_uses_env(self):
        """Test that initialization uses environment variable."""
        with patch.dict(os.environ, {"SECRET_KEY": "env-secret-key"}):
            encryption = FieldEncryption()
            assert encryption._key is not None


class TestKeyRotation:
    """Tests for KeyRotation."""

    @pytest.fixture
    def key_rotation(self):
        return KeyRotation(master_key="master-secret-key")

    def test_derive_key(self, key_rotation):
        """Test key derivation."""
        key = key_rotation.derive_key("encryption", version=1)
        assert len(key) == 32

    def test_derive_key_consistency(self, key_rotation):
        """Test that same purpose/version produces same key."""
        key1 = key_rotation.derive_key("encryption", version=1)
        key2 = key_rotation.derive_key("encryption", version=1)

        assert key1 == key2

    def test_derive_key_different_versions(self, key_rotation):
        """Test that different versions produce different keys."""
        key1 = key_rotation.derive_key("encryption", version=1)
        key2 = key_rotation.derive_key("encryption", version=2)

        assert key1 != key2

    def test_get_current_key_version(self, key_rotation):
        """Test getting current key version."""
        version = key_rotation.get_current_key_version()
        assert version >= 1

    def test_create_versioned_encryption(self, key_rotation):
        """Test creating versioned encryption instance."""
        encryption = key_rotation.create_versioned_encryption("test")
        assert isinstance(encryption, FieldEncryption)


class TestPIIMasker:
    """Tests for PIIMasker."""

    @pytest.fixture
    def masker(self):
        return PIIMasker()

    def test_mask_email(self, masker):
        """Test email masking."""
        masked = masker.mask_email("john.doe@example.com")
        assert "j" in masked  # First char preserved
        assert "@" in masked
        assert ".com" in masked
        assert "john.doe" not in masked
        assert "*" in masked

    def test_mask_phone(self, masker):
        """Test phone number masking."""
        masked = masker.mask_phone("555-123-4567")
        assert "4567" in masked  # Last 4 digits preserved
        assert "555" not in masked
        assert "*" in masked

    def test_mask_credit_card(self, masker):
        """Test credit card masking."""
        masked = masker.mask_credit_card("4111-1111-1111-1111")
        assert "1111" in masked  # Last 4 digits preserved
        assert "4111-1111-1111" not in masked
        assert "*" in masked

    def test_mask_ip(self, masker):
        """Test IP address masking."""
        masked = masker.mask_ip("192.168.1.100")
        assert "100" in masked  # Last octet preserved
        assert "192" not in masked
        assert "*" in masked

    def test_mask_string(self, masker):
        """Test masking all PII in a string."""
        text = "Contact john@example.com at 555-123-4567"
        masked = masker.mask_string(text)

        assert "john@example.com" not in masked
        assert "555-123" not in masked
        assert "*" in masked

    def test_mask_dict(self, masker):
        """Test masking PII in a dictionary."""
        data = {
            "email": "test@example.com",
            "password": "secret123",
            "name": "John Doe",
        }
        masked = masker.mask_dict(data)

        assert "*" in masked["email"]
        assert masked["password"] == "********"  # Fully masked
        assert masked["name"] == "John Doe"  # Not PII, unchanged


class TestGDPRCompliance:
    """Tests for GDPRCompliance."""

    @pytest.fixture
    def gdpr(self):
        return GDPRCompliance()

    def test_prepare_data_export(self, gdpr):
        """Test data export preparation."""
        user_data = {"name": "John", "email": "john@example.com"}
        export = gdpr.prepare_data_export(user_data)

        assert "exported_at" in export
        assert "data_types" in export
        assert "user_data" in export
        assert export["user_data"] == user_data

    def test_create_deletion_record(self, gdpr):
        """Test deletion record creation."""
        record = gdpr.create_deletion_record("user123", ["profile", "messages"])

        assert "user_id_hash" in record
        assert "deleted_at" in record
        assert "data_types_deleted" in record
        assert record["deletion_reason"] == "user_request"
        # User ID should be hashed
        assert record["user_id_hash"] != "user123"

    def test_anonymize_user_data(self, gdpr):
        """Test user data anonymization."""
        user_data = {
            "email": "john@example.com",
            "name": "John Doe",
            "age": 30,
            "preferences": {"theme": "dark"},
        }
        anonymized = gdpr.anonymize_user_data(user_data)

        assert "email" not in anonymized
        assert "name" not in anonymized
        assert anonymized["age"] == 30
        assert anonymized["preferences"] == {"theme": "dark"}

    def test_create_consent_record(self, gdpr):
        """Test consent record creation."""
        record = gdpr.create_consent_record(
            user_id="user123",
            consent_type="marketing",
            granted=True,
        )

        assert record["user_id"] == "user123"
        assert record["consent_type"] == "marketing"
        assert record["granted"] is True
        assert "timestamp" in record


class TestUtilityFunctions:
    """Tests for utility functions."""

    def test_create_field_encryption(self):
        """Test factory function."""
        encryption = create_field_encryption("test-key")
        assert isinstance(encryption, FieldEncryption)

    def test_mask_pii_in_logs_string(self):
        """Test PII masking in log string."""
        log = "User john@example.com logged in"
        masked = mask_pii_in_logs(log)

        assert "john@example.com" not in masked
        assert "*" in masked

    def test_mask_pii_in_logs_dict(self):
        """Test PII masking in log dictionary."""
        log = {"user": "john@example.com", "action": "login"}
        masked = mask_pii_in_logs(log)

        assert "john@example.com" not in masked["user"]
        assert masked["action"] == "login"

    def test_mask_pii_in_logs_other(self):
        """Test PII masking with non-string/dict input."""
        assert mask_pii_in_logs(123) == 123
        assert mask_pii_in_logs(None) is None
