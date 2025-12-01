"""Shared helpers for building database connection settings."""

from __future__ import annotations

import os
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncEngine

from backend.models import Base

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

    # SQLite URLs require a different normalization path because they do not
    # support the same query-string TLS parameters. When using an in-memory
    # database (common in tests), ensure the URL retains the triple-slash form
    # that SQLAlchemy expects.
    if raw_url.startswith("sqlite"):
        if raw_url.startswith("sqlite+aiosqlite:") and "//" not in raw_url.split(":", 1)[1]:
            return "sqlite+aiosqlite:///:memory:"
        return raw_url

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


__all__ = ["build_database_url", "DEFAULT_DATABASE_URL", "ensure_base_schema"]


async def ensure_base_schema(engine: AsyncEngine) -> None:
    """Create core tables if they are missing.

    The lightweight SQL migrations expect foundational tables like ``users`` to
    exist. In some deployment environments (e.g., preview apps or fresh
    databases) the startup hook may run before Alembic has initialized the
    schema. We defensively ensure the declarative metadata has been created so
    the SQL migrations don't fail with missing foreign key targets.
    """

    async with engine.begin() as connection:
        existing_tables = await connection.run_sync(
            lambda sync_conn: set(inspect(sync_conn).get_table_names())
        )

        # Only create tables that are missing to avoid errors when the database
        # schema is partially initialized (e.g., users exists but user_profiles does
        # not). ``create_all`` is idempotent when ``checkfirst`` is True (default),
        # so invoking it here will fill in any gaps without altering existing
        # structures.
        defined_tables = set(Base.metadata.tables.keys())
        missing_tables = defined_tables - existing_tables

        if not missing_tables:
            return

        await connection.run_sync(Base.metadata.create_all)
