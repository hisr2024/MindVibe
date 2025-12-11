"""Lightweight SQL migration runner for Render/async startup."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

# Statement preview and error display constants
STATEMENT_PREVIEW_LENGTH = 200
ERROR_STATEMENT_LENGTH = 100

MIGRATIONS_PATH = Path(__file__).resolve().parents[2] / "migrations"


@dataclass
class MigrationResult:
    """Summary of the last migration attempt."""

    applied: list[str]
    pending: list[str]
    current_revision: str | None = None
    error: str | None = None
    failed_statement: str | None = None
    failed_file: str | None = None


LATEST_MIGRATION_RESULT: MigrationResult | None = None


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


def _dialect_for_engine(engine: AsyncEngine) -> str:
    """Return the SQLAlchemy backend name (e.g., ``postgresql`` or ``sqlite``)."""

    return engine.url.get_backend_name()


def _should_skip_file(path: Path, dialect: str) -> bool:
    """Determine whether a migration should be skipped for the current dialect.

    Migrations can opt into skipping on non-PostgreSQL databases by including the
    marker comment ``-- dialect: postgres-only`` anywhere in the file. This keeps
    our SQLite-based test database from executing PostgreSQL-specific DDL while
    still recording the migration as applied.
    """

    marker = "-- dialect: postgres-only"
    return dialect != "postgresql" and marker in path.read_text().lower()


def _statements(sql_text: str) -> Iterable[str]:
    """Yield SQL statements while respecting dollar-quoted blocks."""

    statements: list[str] = []
    current: list[str] = []
    in_single_quote = False
    in_double_quote = False
    dollar_tag: str | None = None
    i = 0

    while i < len(sql_text):
        ch = sql_text[i]

        # Toggle single-quote strings
        if ch == "'" and not in_double_quote and dollar_tag is None:
            in_single_quote = not in_single_quote
            current.append(ch)
            i += 1
            continue

        # Toggle double-quote identifiers
        if ch == '"' and not in_single_quote and dollar_tag is None:
            in_double_quote = not in_double_quote
            current.append(ch)
            i += 1
            continue

        # Enter or exit a dollar-quoted block (e.g., $$ or $tag$)
        if ch == "$" and not in_single_quote and not in_double_quote:
            # detect the full tag
            end_pos = i + 1
            while end_pos < len(sql_text) and sql_text[end_pos].isalnum():
                end_pos += 1
            if end_pos < len(sql_text) and sql_text[end_pos] == "$":
                tag = sql_text[i : end_pos + 1]  # includes both '$'
                if dollar_tag is None:
                    dollar_tag = tag
                elif tag == dollar_tag:
                    dollar_tag = None
                current.append(tag)
                i = end_pos + 1
                continue

        # Statement delimiter only when not inside any quoted context
        if ch == ";" and not any([in_single_quote, in_double_quote, dollar_tag]):
            statement = "".join(current).strip()
            if statement:
                statements.append(statement)
            current = []
            i += 1
            continue

        current.append(ch)
        i += 1

    # Append any trailing statement
    trailing = "".join(current).strip()
    if trailing:
        statements.append(trailing)

    return statements


def _capture_alembic_current() -> str | None:
    """Return the output of ``alembic current`` to aid debugging."""

    try:
        result = subprocess.run(
            ["alembic", "current"], capture_output=True, text=True, check=False
        )
    except FileNotFoundError:
        return "alembic not installed"

    output = result.stdout.strip() or result.stderr.strip()
    if result.returncode != 0:
        return f"alembic current failed (code {result.returncode}): {output}" or None
    return output or None


def _record_result(result: MigrationResult) -> None:
    global LATEST_MIGRATION_RESULT
    LATEST_MIGRATION_RESULT = result


async def get_migration_status(engine: AsyncEngine) -> MigrationResult:
    """Return the migration status without mutating the database."""

    await _ensure_migrations_table(engine)
    applied_files = await _fetch_applied(engine)
    pending = [path.name for path in _sql_files() if path.name not in applied_files]

    cached_error = LATEST_MIGRATION_RESULT.error if LATEST_MIGRATION_RESULT else None
    cached_failed_statement = (
        LATEST_MIGRATION_RESULT.failed_statement if LATEST_MIGRATION_RESULT else None
    )
    cached_failed_file = (
        LATEST_MIGRATION_RESULT.failed_file if LATEST_MIGRATION_RESULT else None
    )

    status = MigrationResult(
        applied=sorted(applied_files),
        pending=pending,
        current_revision=_capture_alembic_current(),
        error=cached_error,
        failed_statement=cached_failed_statement,
        failed_file=cached_failed_file,
    )
    _record_result(status)
    return status


async def apply_sql_migrations(engine: AsyncEngine) -> MigrationResult:
    """Apply .sql migrations in order and return the result summary."""

    await _ensure_migrations_table(engine)
    applied = await _fetch_applied(engine)
    pending = [path.name for path in _sql_files() if path.name not in applied]

    result = MigrationResult(
        applied=[],
        pending=pending,
        current_revision=_capture_alembic_current(),
    )

    dialect = _dialect_for_engine(engine)

    for path in _sql_files():
        if path.name in applied:
            continue

        sql_text = path.read_text()
        async with engine.begin() as conn:
            if _should_skip_file(path, dialect):
                await conn.execute(
                    text("INSERT INTO schema_migrations (filename) VALUES (:filename)"),
                    {"filename": path.name},
                )
                result.applied.append(path.name)
                continue

            for statement in _statements(sql_text):
                try:
                    await conn.execute(text(statement))
                except Exception as exc:  # pragma: no cover - defensive logging
                    result.error = f"Failed to apply {path.name}: {exc}"
                    result.failed_statement = statement
                    result.failed_file = path.name
                    _record_result(result)
                    print("❌ [MIGRATIONS] Error executing SQL statement")
                    print(f"   File: {path.name}")
                    print(f"   Statement preview: {statement[:STATEMENT_PREVIEW_LENGTH]}...")
                    print(f"   Error type: {type(exc).__name__}")
                    print(f"   Error details: {str(exc)}")
                    print(f"   Current revision: {result.current_revision}")
                    print("\n💡 Tip: If tables already exist, ensure the migration is idempotent")
                    print("   with 'DROP TABLE IF EXISTS ... CASCADE' statements.\n")
                    raise RuntimeError(
                        f"{path.name} failed while running statement: {statement[:ERROR_STATEMENT_LENGTH]}... | Error: {str(exc)}"
                    ) from exc
            await conn.execute(
                text("INSERT INTO schema_migrations (filename) VALUES (:filename)"),
                {"filename": path.name},
            )
        result.applied.append(path.name)

    # refresh pending list after applying
    result.pending = [path.name for path in _sql_files() if path.name not in applied.union(set(result.applied))]
    _record_result(result)
    return result


__all__ = ["apply_sql_migrations", "get_migration_status", "MigrationResult"]
