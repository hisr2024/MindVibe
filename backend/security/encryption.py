"""Utilities for encrypting and decrypting sensitive fields."""
from __future__ import annotations

import base64
import json
import os
from functools import lru_cache
from typing import Any

from cryptography.fernet import Fernet, InvalidToken


class FieldEncryptor:
    """Encrypts and decrypts structured payloads using Fernet."""

    def __init__(self, key: bytes):
        self._fernet = Fernet(key)

    def encrypt_text(self, value: str | None) -> str | None:
        if value is None:
            return None
        token = self._fernet.encrypt(value.encode("utf-8"))
        return token.decode("utf-8")

    def decrypt_text(self, token: str | None) -> str | None:
        if token is None:
            return None
        try:
            decrypted = self._fernet.decrypt(token.encode("utf-8"))
            return decrypted.decode("utf-8")
        except InvalidToken:
            return None

    def encrypt_json(self, value: Any) -> str:
        serialized = json.dumps(value, separators=(",", ":"))
        return self.encrypt_text(serialized) or ""

    def decrypt_json(self, token: str | None) -> Any:
        plaintext = self.decrypt_text(token)
        if plaintext is None:
            return None
        try:
            return json.loads(plaintext)
        except json.JSONDecodeError:
            return None


def _derive_key_from_env() -> bytes:
    raw_key = os.getenv("DATA_ENCRYPTION_KEY")
    if raw_key:
        padded = raw_key.encode("utf-8")
        if len(padded) == 32:
            return base64.urlsafe_b64encode(padded)
        try:
            base64.urlsafe_b64decode(raw_key)
            return raw_key.encode("utf-8")
        except Exception:
            pass
    generated = Fernet.generate_key()
    return generated


@lru_cache(maxsize=1)
def get_field_encryptor() -> FieldEncryptor:
    """Return a cached encryptor instance."""

    key = _derive_key_from_env()
    return FieldEncryptor(key)
