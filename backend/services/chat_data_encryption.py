"""Chat data encryption service for KIAAN conversations.

Encrypts user messages and KIAAN responses before database persistence.
Uses Fernet symmetric encryption (AES-128-CBC with HMAC-SHA256).

When ENCRYPT_CHAT_DATA=true (default), all user_message and kiaan_response
fields are encrypted before INSERT and decrypted on SELECT.

If no encryption key is available in development, data is stored as plaintext
with a logged warning. In production with MINDVIBE_REQUIRE_ENCRYPTION=true,
the app refuses to start without a key.
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy-loaded Fernet cipher — initialized once on first use
_fernet = None
_initialized = False


def _get_fernet():
    """Lazy-initialize the Fernet cipher from the MINDVIBE_REFLECTION_KEY env var."""
    global _fernet, _initialized

    if _initialized:
        return _fernet

    _initialized = True
    key = os.getenv("MINDVIBE_REFLECTION_KEY", "")
    if not key:
        logger.warning("Chat data encryption disabled — no MINDVIBE_REFLECTION_KEY set")
        return None

    try:
        from cryptography.fernet import Fernet
        _fernet = Fernet(key.encode() if isinstance(key, str) else key)
        logger.info("Chat data encryption initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize chat encryption: {e}")
        _fernet = None

    return _fernet


def encrypt_chat_field(plaintext: str) -> str:
    """Encrypt a chat field (user_message or kiaan_response) for database storage.

    Args:
        plaintext: The raw text to encrypt.

    Returns:
        Encrypted ciphertext (base64-encoded) or original plaintext if encryption
        is unavailable.
    """
    if not plaintext:
        return plaintext

    encrypt_enabled = os.getenv("ENCRYPT_CHAT_DATA", "true").lower() == "true"
    if not encrypt_enabled:
        return plaintext

    fernet = _get_fernet()
    if fernet is None:
        return plaintext

    try:
        return fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")
    except Exception as e:
        logger.error(f"Encryption failed, storing plaintext: {e}")
        return plaintext


def decrypt_chat_field(ciphertext: str) -> str:
    """Decrypt a chat field from database storage.

    Gracefully handles plaintext values (pre-encryption data) by returning
    them unchanged if decryption fails.

    Args:
        ciphertext: The encrypted text from the database.

    Returns:
        Decrypted plaintext.
    """
    if not ciphertext:
        return ciphertext

    fernet = _get_fernet()
    if fernet is None:
        return ciphertext

    try:
        return fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except Exception:
        # Likely plaintext from before encryption was enabled — return as-is
        return ciphertext


def is_encryption_active() -> bool:
    """Check if chat encryption is currently active."""
    encrypt_enabled = os.getenv("ENCRYPT_CHAT_DATA", "true").lower() == "true"
    return encrypt_enabled and _get_fernet() is not None
