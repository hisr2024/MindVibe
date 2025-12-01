"""Secret manager client with minimal logging of sensitive identifiers."""
from __future__ import annotations

import base64
import logging
import os
from dataclasses import dataclass
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger("mindvibe.secret_manager")


def _redact_secret_id(secret_id: str) -> str:
    """Return a redacted version of a secret identifier for logging.

    The redaction keeps only a small prefix and suffix when available so
    operators can correlate to the original value without exposing the full
    identifier in logs.
    """

    if not secret_id:
        return ""
    if len(secret_id) <= 8:
        return "***"
    return f"{secret_id[:2]}***{secret_id[-4:]}"


@dataclass
class SecretManagerConfig:
    provider: str
    region: Optional[str]
    namespace: str

    @classmethod
    def from_env(cls) -> "SecretManagerConfig":
        provider = os.getenv("SECRET_MANAGER_PROVIDER", "aws").lower()
        region = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION"))
        namespace = os.getenv("SECRET_MANAGER_NAMESPACE", "")
        return cls(provider=provider, region=region, namespace=namespace)


class SecretManager:
    def __init__(self, config: SecretManagerConfig | None = None):
        self.config = config or SecretManagerConfig.from_env()
        self.namespace = self.config.namespace
        self._client = None
        if self.config.provider == "aws":
            if not self.config.region:
                logger.warning(
                    "secret_manager_disabled_missing_region",
                    extra={"provider": self.config.provider},
                )
                return
            self._client = boto3.client("secretsmanager", region_name=self.config.region)

    @property
    def enabled(self) -> bool:
        return bool(self._client)

    def _secret_id(self, key: str) -> str:
        return f"{self.namespace}{key}" if not key.startswith(self.namespace) else key

    def get_secret(self, key: str) -> Optional[str]:
        if not self.enabled:
            return None

        secret_id = self._secret_id(key)
        try:
            result = self._client.get_secret_value(SecretId=secret_id)
        except (ClientError, BotoCoreError) as exc:
            logger.warning(
                "secret_manager_request_failed",
                extra={"secret_id": _redact_secret_id(secret_id), "error": str(exc)},
            )
            return None

        secret_string = result.get("SecretString")
        if secret_string:
            return secret_string
        secret_binary = result.get("SecretBinary")
        if secret_binary:
            try:
                return base64.b64decode(secret_binary).decode()
            except Exception:
                logger.warning(
                    "secret_manager_decode_failed",
                    extra={"secret_id": _redact_secret_id(secret_id)},
                )
                return None
        return None


_singleton: SecretManager | None = None


def secret_manager() -> SecretManager:
    """Return a singleton SecretManager instance."""

    global _singleton
    if _singleton is None:
        _singleton = SecretManager()
    return _singleton


def get(key: str, default: Optional[str] = None) -> Optional[str]:
    """Retrieve a secret with an environment variable fallback."""

    value = secret_manager().get_secret(key)
    if value is None:
        return os.getenv(key, default)
    return value
