from __future__ import annotations

import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# ensure project root on path for backend module imports
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from backend.models import Base  # noqa: E402

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _normalize_database_url(raw_url: str | None) -> str:
    if not raw_url or raw_url.startswith("${"):
        raise RuntimeError("DATABASE_URL must be set for Alembic migrations.")
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("postgresql://") and "+asyncpg" not in raw_url:
        return raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return raw_url


def _get_database_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    config_url = config.get_main_option("sqlalchemy.url")
    normalized = _normalize_database_url(env_url or config_url)
    config.set_main_option("sqlalchemy.url", normalized)
    return normalized


target_metadata = Base.metadata


def _is_async_url(url: str) -> bool:
    return "+asyncpg" in url or "+aiosqlite" in url or url.startswith("sqlite+aiosqlite")


def run_migrations_offline() -> None:
    url = _get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    database_url = _get_database_url()

    if _is_async_url(database_url):
        connectable = async_engine_from_config(
            {"sqlalchemy.url": database_url}, prefix="sqlalchemy.", poolclass=pool.NullPool
        )

        async def _run_async_migrations() -> None:
            async with connectable.connect() as connection:
                await connection.run_sync(do_run_migrations)
            await connectable.dispose()

        asyncio.run(_run_async_migrations())
    else:
        connectable = engine_from_config(
            {"sqlalchemy.url": database_url}, prefix="sqlalchemy.", poolclass=pool.NullPool
        )

        with connectable.connect() as connection:
            do_run_migrations(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
