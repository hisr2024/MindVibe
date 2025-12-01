"""Managed secret vault integration with environment fallback.

This module centralizes secret retrieval to support external vaults like
AWS Secrets Manager while remaining functional in local development via
standard environment variables. Secrets are cached in-memory to avoid
excessive round-trips while keeping retrieval deterministic for testing.
"""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Callable, Optional

logger = logging.getLogger("mindvibe.secrets")


class SecretRetrievalError(RuntimeError):
    """Raised when a managed vault cannot return the requested secret."""


@dataclass
class SecretProvider:
    """Abstraction for secret sources."""

    name: str
    loader: Callable[[str], Optional[str]]

    def get(self, key: str) -> Optional[str]:
        return self.loader(key)


@lru_cache(maxsize=1)
def _aws_client():  # pragma: no cover - optional dependency
    try:
        import boto3
    except Exception as exc:  # pragma: no cover - defensive
        raise SecretRetrievalError("boto3 is required for AWS secret retrieval") from exc

    return boto3.session.Session().client("secretsmanager")


def _load_from_aws(secret_id: str) -> Optional[str]:  # pragma: no cover - network
    client = _aws_client()
    response = client.get_secret_value(SecretId=secret_id)
    if "SecretString" in response:
        return response["SecretString"]
    return None


def _load_from_env(key: str) -> Optional[str]:
    return os.getenv(key)


def _configured_provider() -> SecretProvider:
    backend = os.getenv("SECRET_BACKEND", "env").lower()
    if backend == "aws":
        secret_id = os.getenv("SECRET_VAULT_ID") or os.getenv("AWS_SECRET_ARN")
        if not secret_id:
            raise SecretRetrievalError("SECRET_VAULT_ID is required when SECRET_BACKEND=aws")
        return SecretProvider(name="aws", loader=lambda _: _load_from_aws(secret_id))
    return SecretProvider(name="env", loader=_load_from_env)


def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    """Retrieve a secret value from the configured provider.

    The provider can be an external vault (AWS Secrets Manager) or the
    local environment for development. Values are cached per-key to avoid
    repeated network calls.
    """

    provider = _configured_provider()
    cache_key = f"mindvibe.secret.{provider.name}.{key}"
    cached = os.environ.get(cache_key)
    if cached is not None:
        return cached

    try:
        value = provider.get(key)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception(
            "secret_retrieval_failed",
            extra={"provider": provider.name, "key_hint": "redacted"},
        )
        value = None

    if value is None:
        return default

    # Cache in-process only; avoid exporting to the real environment for safety
    os.environ[cache_key] = value
    return value


def get_json_secret(key: str, default: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    raw = get_secret(key)
    if raw is None:
        return default or {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SecretRetrievalError(f"Secret `{key}` is not valid JSON") from exc


__all__ = ["get_secret", "get_json_secret", "SecretRetrievalError"]
