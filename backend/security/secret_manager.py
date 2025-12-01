"""Centralized secret retrieval with managed vault support."""
from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Dict, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger(__name__)


@dataclass
class SecretCacheEntry:
    value: str | None
    expires_at: float

    def is_valid(self) -> bool:
        return time.time() < self.expires_at


class ManagedSecretManager:
    """Fetch secrets from AWS Secrets Manager with env fallback."""

    def __init__(
        self,
        provider: str | None = None,
        namespace: str | None = None,
        cache_ttl_seconds: int | None = None,
    ) -> None:
        self.provider = (provider or os.getenv("SECRET_BACKEND", "env")).lower()
        self.namespace = namespace or os.getenv("SECRET_NAMESPACE", "mindvibe/")
        self.cache_ttl_seconds = cache_ttl_seconds or int(
            os.getenv("SECRET_CACHE_TTL_SECONDS", "300")
        )
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self._cache: Dict[str, SecretCacheEntry] = {}
        self._client = None

    def _client_for_provider(self):
        if self.provider != "aws":
            return None
        if self._client is None:
            self._client = boto3.client("secretsmanager", region_name=self.region)
        return self._client

    def _cache_get(self, key: str) -> Optional[str]:
        entry = self._cache.get(key)
        if entry and entry.is_valid():
            return entry.value
        if entry:
            self._cache.pop(key, None)
        return None

    def _cache_set(self, key: str, value: str | None) -> None:
        self._cache[key] = SecretCacheEntry(
            value=value, expires_at=time.time() + self.cache_ttl_seconds
        )

    def get(self, key: str, default: str | None = None) -> Optional[str]:
        cached = self._cache_get(key)
        if cached is not None:
            return cached

        value: Optional[str] = None
        if self.provider == "aws":
            value = self._get_from_aws(key)

        if value is None:
            value = os.getenv(key, default)

        self._cache_set(key, value)
        return value

    def _get_from_aws(self, key: str) -> Optional[str]:
        client = self._client_for_provider()
        if not client:
            return None
        secret_id = f"{self.namespace}{key}" if not key.startswith(self.namespace) else key
        try:
            result = client.get_secret_value(SecretId=secret_id)
        except (ClientError, BotoCoreError) as exc:
            logger.warning("secret_manager_aws_failed", extra={"secret_id": "[REDACTED]", "error": str(exc)})
            return None

        secret_string = result.get("SecretString")
        if not secret_string:
            return None

        try:
            payload = json.loads(secret_string)
            if isinstance(payload, dict) and key in payload:
                return str(payload[key])
        except json.JSONDecodeError:
            pass
        return secret_string


def secret_manager() -> ManagedSecretManager:
    # Use a singleton-style instance to share cache across imports
    global _SECRET_MANAGER_SINGLETON
    try:
        return _SECRET_MANAGER_SINGLETON
    except NameError:
        _SECRET_MANAGER_SINGLETON = ManagedSecretManager()
        return _SECRET_MANAGER_SINGLETON


__all__ = ["ManagedSecretManager", "secret_manager"]
