"""Shared helpers for building database connection settings."""

from __future__ import annotations

import os
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

DEFAULT_DATABASE_URL = "postgresql+asyncpg://navi:navi@db:5432/navi"


def build_database_url() -> str:
    """Normalize the DATABASE_URL and apply optional TLS parameters.

    The function:
    - Normalizes legacy postgres schemes to asyncpg-compatible URLs.
    - Appends TLS-related query params based on DB_* environment variables so
      managed databases that require SSL can be configured without changing the
      base URL.
    """

    raw_url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif raw_url.startswith("postgresql://"):
        raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    parsed = urlparse(raw_url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))

    tls_overrides = {
        "sslmode": os.getenv("DB_SSLMODE"),
        "sslrootcert": os.getenv("DB_SSLROOTCERT"),
    }

    for key, value in tls_overrides.items():
        if value:
            query[key] = value

    normalized_query = urlencode(query)
    return urlunparse(parsed._replace(query=normalized_query))


__all__ = ["build_database_url", "DEFAULT_DATABASE_URL"]
