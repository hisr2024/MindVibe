"""Lightweight SQL migration runner for Render/async startup."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

MIGRATIONS_PATH = Path(__file__).resolve().parents[2] / "migrations"


async def _ensure_migrations_table(engine: AsyncEngine) -> None:
    """Create schema_migrations table if it does not exist."""
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    id SERIAL PRIMARY KEY,
                    filename TEXT UNIQUE NOT NULL,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        )


async def _fetch_applied(engine: AsyncEngine) -> set[str]:
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT filename FROM schema_migrations"))
        return {row[0] for row in result}


def _sql_files() -> Iterable[Path]:
    if not MIGRATIONS_PATH.exists():
        return []
    return sorted(p for p in MIGRATIONS_PATH.glob("*.sql") if p.is_file())


def _statements(sql_text: str) -> Iterable[str]:
    for chunk in sql_text.split(";"):
        statement = chunk.strip()
        if statement:
            yield statement


async def apply_sql_migrations(engine: AsyncEngine) -> list[str]:
    """Apply .sql migrations in order and return the list applied."""
    await _ensure_migrations_table(engine)
    applied = await _fetch_applied(engine)
    newly_applied: list[str] = []

    for path in _sql_files():
        if path.name in applied:
            continue

        sql_text = path.read_text()
        async with engine.begin() as conn:
            for statement in _statements(sql_text):
                await conn.execute(text(statement))
            await conn.execute(
                text("INSERT INTO schema_migrations (filename) VALUES (:filename)"),
                {"filename": path.name},
            )
        newly_applied.append(path.name)

    return newly_applied


__all__ = ["apply_sql_migrations"]
