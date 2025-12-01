"""Encryption utilities for journaling content.

Provides at-rest encryption via Fernet with key rotation support. Keys are
configured via environment variables to keep sensitive material out of code.
"""
from __future__ import annotations

import base64
import os
from dataclasses import dataclass
from typing import Iterable

from cryptography.fernet import Fernet, InvalidToken, MultiFernet

from backend.security.secret_vault import get_json_secret, get_secret

DEFAULT_KEY_ENV = "JOURNAL_ENCRYPTION_KEYS"
PRIMARY_KEY_ENV = "JOURNAL_PRIMARY_KEY_ID"
SECRET_KEYSET_NAME = os.getenv("JOURNAL_KEYSET_NAME", "mindvibe/journal/keys")


@dataclass
class EncryptionConfig:
    keys: dict[str, bytes]
    primary_key_id: str

    @classmethod
    def from_env(cls) -> "EncryptionConfig":
        raw = get_secret(DEFAULT_KEY_ENV) or ""
        if not raw:
            # Prefer managed vault payloads when configured
            vault_keys = get_json_secret(SECRET_KEYSET_NAME, default={})
            if vault_keys:
                key_items = {
                    key: base64.urlsafe_b64decode(value)
                    for key, value in vault_keys.items()
                }
                primary = os.getenv(PRIMARY_KEY_ENV) or next(iter(key_items.keys()))
                return cls(keys=key_items, primary_key_id=primary)
        key_items: dict[str, bytes] = {}
        for idx, token in enumerate(filter(None, (part.strip() for part in raw.split(",")))):
            key_id = str(idx)
            try:
                key_items[key_id] = base64.urlsafe_b64decode(token)
            except Exception:
                # Allow passing already-base64 Fernet keys
                try:
                    key_items[key_id] = token.encode()
                except Exception as exc:  # pragma: no cover - defensive
                    raise ValueError("Invalid encryption key material") from exc

        if not key_items:
            # Derive a stable key from SECRET_KEY for development fallback
            secret = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production").encode()
            key_items["fallback"] = base64.urlsafe_b64encode(secret.ljust(32, b"0")[:32])

        primary = os.getenv(PRIMARY_KEY_ENV) or next(iter(key_items.keys()))
        return cls(keys=key_items, primary_key_id=primary)

    def multi_fernet(self) -> MultiFernet:
        return MultiFernet([Fernet(v) for _, v in sorted(self.keys.items(), key=lambda i: i[0] == self.primary_key_id, reverse=True)])


class EncryptionManager:
    """Helper that wraps MultiFernet with key identifiers for rotation."""

    def __init__(self, config: EncryptionConfig | None = None):
        self.config = config or EncryptionConfig.from_env()
        self._multi = self.config.multi_fernet()

    @property
    def primary_key_id(self) -> str:
        return self.config.primary_key_id

    def encrypt(self, plaintext: str) -> tuple[str, str]:
        token = self._multi.encrypt(plaintext.encode()).decode()
        return token, self.primary_key_id

    def decrypt(self, ciphertext: str) -> str:
        try:
            return self._multi.decrypt(ciphertext.encode()).decode()
        except InvalidToken as exc:
            raise ValueError("Invalid or expired encrypted payload") from exc

    def reencrypt(self, ciphertext: str) -> tuple[str, str]:
        """Rotate ciphertext to the current primary key."""
        plaintext = self.decrypt(ciphertext)
        return self.encrypt(plaintext)


def encrypt_sensitive(value: str, manager: EncryptionManager | None = None) -> tuple[str, str]:
    mgr = manager or EncryptionManager()
    return mgr.encrypt(value)


def decrypt_sensitive(ciphertext: str, manager: EncryptionManager | None = None) -> str:
    mgr = manager or EncryptionManager()
    return mgr.decrypt(ciphertext)


__all__ = [
    "EncryptionConfig",
    "EncryptionManager",
    "encrypt_sensitive",
    "decrypt_sensitive",
]
