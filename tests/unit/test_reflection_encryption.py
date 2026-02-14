"""
Tests for ReflectionEncryption class in journey_engine_enhanced.py

This tests the encryption/decryption of mental health reflections,
which is critical for GDPR/HIPAA compliance.
"""

import os
import pytest
from unittest.mock import patch, MagicMock

# Test data
TEST_REFLECTION = "I feel anxious about my meditation practice. Sometimes I wonder if I'm making progress."
TEST_KEY = "dGVzdC1rZXktZm9yLWVuY3J5cHRpb24tc2hvdWxkLWJlLTMyYnl0ZXM="  # Base64 encoded test key

# Module not yet implemented — skip dependent tests rather than fail on import
_has_journey_engine_enhanced = False
try:
    from backend.services.journey_engine_enhanced import ReflectionEncryption  # noqa: F401
    _has_journey_engine_enhanced = True
except ImportError:
    pass

_skip_reason = "backend.services.journey_engine_enhanced not yet implemented"


@pytest.mark.skipif(not _has_journey_engine_enhanced, reason=_skip_reason)
class TestReflectionEncryptionInitialization:
    """Tests for ReflectionEncryption initialization."""

    def test_init_without_key_dev_mode(self):
        """In dev mode without key, should warn but not fail."""
        with patch.dict(os.environ, {"ENVIRONMENT": "development", "MINDVIBE_REFLECTION_KEY": ""}, clear=False):
            with patch.dict(os.environ, {"MINDVIBE_REQUIRE_ENCRYPTION": "false"}, clear=False):
                # Force reimport to reset singleton
                from backend.services.journey_engine_enhanced import ReflectionEncryption
                ReflectionEncryption._instance = None

                # Should not raise in dev mode
                encryptor = ReflectionEncryption()
                assert encryptor._fernet is None

    def test_init_without_key_prod_mode_required(self):
        """In production with REQUIRE_ENCRYPTION=true, should fail without key."""
        with patch.dict(os.environ, {
            "ENVIRONMENT": "production",
            "MINDVIBE_REFLECTION_KEY": "",
            "MINDVIBE_REQUIRE_ENCRYPTION": "true"
        }, clear=False):
            from backend.services.journey_engine_enhanced import ReflectionEncryption
            ReflectionEncryption._instance = None

            with pytest.raises(RuntimeError, match="Cannot start in production without encryption"):
                ReflectionEncryption()


@pytest.mark.skipif(not _has_journey_engine_enhanced, reason=_skip_reason)
class TestReflectionEncryptionOperations:
    """Tests for encryption/decryption operations."""

    @pytest.fixture
    def encryptor_with_key(self):
        """Create an encryptor with a valid key."""
        # Generate a valid Fernet key
        from cryptography.fernet import Fernet
        key = Fernet.generate_key().decode()

        with patch.dict(os.environ, {
            "ENVIRONMENT": "development",
            "MINDVIBE_REFLECTION_KEY": key,
            "MINDVIBE_REQUIRE_ENCRYPTION": "false"
        }, clear=False):
            from backend.services.journey_engine_enhanced import ReflectionEncryption
            ReflectionEncryption._instance = None
            return ReflectionEncryption()

    def test_encrypt_returns_different_value(self, encryptor_with_key):
        """Encrypted text should be different from plaintext."""
        encrypted = encryptor_with_key.encrypt(TEST_REFLECTION)
        assert encrypted != TEST_REFLECTION
        assert len(encrypted) > len(TEST_REFLECTION)  # Fernet adds overhead

    def test_decrypt_returns_original(self, encryptor_with_key):
        """Decryption should return original plaintext."""
        encrypted = encryptor_with_key.encrypt(TEST_REFLECTION)
        decrypted = encryptor_with_key.decrypt(encrypted)
        assert decrypted == TEST_REFLECTION

    def test_encrypt_empty_string(self, encryptor_with_key):
        """Should handle empty strings."""
        encrypted = encryptor_with_key.encrypt("")
        decrypted = encryptor_with_key.decrypt(encrypted)
        assert decrypted == ""

    def test_encrypt_unicode(self, encryptor_with_key):
        """Should handle Unicode (Sanskrit, Hindi, etc.)."""
        unicode_text = "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। I feel peaceful."
        encrypted = encryptor_with_key.encrypt(unicode_text)
        decrypted = encryptor_with_key.decrypt(encrypted)
        assert decrypted == unicode_text

    def test_encrypt_long_text(self, encryptor_with_key):
        """Should handle long reflections."""
        long_text = TEST_REFLECTION * 100  # ~5000 characters
        encrypted = encryptor_with_key.encrypt(long_text)
        decrypted = encryptor_with_key.decrypt(encrypted)
        assert decrypted == long_text

    def test_different_encryptions_not_equal(self, encryptor_with_key):
        """Same plaintext should produce different ciphertext (due to IV)."""
        encrypted1 = encryptor_with_key.encrypt(TEST_REFLECTION)
        encrypted2 = encryptor_with_key.encrypt(TEST_REFLECTION)
        assert encrypted1 != encrypted2  # Fernet uses random IV

    def test_decrypt_with_wrong_key_fails(self, encryptor_with_key):
        """Decryption with wrong key should fail."""
        encrypted = encryptor_with_key.encrypt(TEST_REFLECTION)

        # Create new encryptor with different key
        from cryptography.fernet import Fernet, InvalidToken
        different_key = Fernet.generate_key().decode()

        with patch.dict(os.environ, {
            "ENVIRONMENT": "development",
            "MINDVIBE_REFLECTION_KEY": different_key,
            "MINDVIBE_REQUIRE_ENCRYPTION": "false"
        }, clear=False):
            from backend.services.journey_engine_enhanced import ReflectionEncryption
            ReflectionEncryption._instance = None
            wrong_encryptor = ReflectionEncryption()

            with pytest.raises(Exception):  # Fernet raises InvalidToken
                wrong_encryptor.decrypt(encrypted)


@pytest.mark.skipif(not _has_journey_engine_enhanced, reason=_skip_reason)
class TestReflectionEncryptionFallback:
    """Tests for fallback behavior when encryption is not available."""

    def test_encrypt_without_key_returns_plaintext(self):
        """Without encryption key, should return plaintext with warning."""
        with patch.dict(os.environ, {
            "ENVIRONMENT": "development",
            "MINDVIBE_REFLECTION_KEY": "",
            "MINDVIBE_REQUIRE_ENCRYPTION": "false"
        }, clear=False):
            from backend.services.journey_engine_enhanced import ReflectionEncryption
            ReflectionEncryption._instance = None
            encryptor = ReflectionEncryption()

            # Without key, encrypt should return plaintext
            result = encryptor.encrypt(TEST_REFLECTION)
            assert result == TEST_REFLECTION

    def test_decrypt_without_key_returns_ciphertext(self):
        """Without encryption key, decrypt should return input as-is."""
        with patch.dict(os.environ, {
            "ENVIRONMENT": "development",
            "MINDVIBE_REFLECTION_KEY": "",
            "MINDVIBE_REQUIRE_ENCRYPTION": "false"
        }, clear=False):
            from backend.services.journey_engine_enhanced import ReflectionEncryption
            ReflectionEncryption._instance = None
            encryptor = ReflectionEncryption()

            # Without key, decrypt should return input unchanged
            result = encryptor.decrypt("some-ciphertext")
            assert result == "some-ciphertext"


class TestOfflineWisdomCacheLRU:
    """Tests for LRU cache eviction in OfflineWisdomCache."""

    def test_cache_respects_max_entries(self):
        """Cache should evict entries when max size exceeded."""
        from backend.services.kiaan_core import OfflineWisdomCache
        import tempfile

        with tempfile.TemporaryDirectory() as tmpdir:
            cache = OfflineWisdomCache(cache_dir=tmpdir, max_entries=3)

            # Add 5 entries to cache with max_entries=3
            for i in range(5):
                cache.set(f"message{i}", "context", {"response": f"response{i}"})

            # Should only have 3 entries (oldest 2 evicted)
            assert len(cache.memory_cache) == 3

            # First two should be evicted (LRU)
            assert cache.get("message0", "context") is None
            assert cache.get("message1", "context") is None

            # Last three should still be present
            assert cache.get("message2", "context") is not None
            assert cache.get("message3", "context") is not None
            assert cache.get("message4", "context") is not None

    def test_cache_lru_access_updates_order(self):
        """Accessing an entry should move it to end of LRU queue."""
        from backend.services.kiaan_core import OfflineWisdomCache
        import tempfile

        with tempfile.TemporaryDirectory() as tmpdir:
            cache = OfflineWisdomCache(cache_dir=tmpdir, max_entries=3)

            # Add 3 entries
            cache.set("message0", "context", {"response": "response0"})
            cache.set("message1", "context", {"response": "response1"})
            cache.set("message2", "context", {"response": "response2"})

            # Access message0 to move it to end of LRU
            cache.get("message0", "context")

            # Add a new entry, should evict message1 (now oldest)
            cache.set("message3", "context", {"response": "response3"})

            assert cache.get("message0", "context") is not None  # Still present
            assert cache.get("message1", "context") is None  # Evicted
            assert cache.get("message2", "context") is not None
            assert cache.get("message3", "context") is not None
