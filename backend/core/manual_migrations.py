"""Manual Python-based migrations for complex schema changes.

This module provides migration functions that can safely handle complex DDL
operations that may fail when run through SQL file-based migrations (e.g.,
Render's migration runner incorrectly splitting PL/pgSQL blocks).

All functions are idempotent - safe to run multiple times without side effects.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

logger = logging.getLogger(__name__)


async def enable_pg_trgm_extension(engine: AsyncEngine) -> bool:
    """Enable pg_trgm extension for text search.

    The pg_trgm extension provides functions and operators for determining
    similarity of text based on trigram matching. This is useful for fuzzy
    text search in journal entries and other user content.

    Args:
        engine: SQLAlchemy async engine connected to the database.

    Returns:
        True if extension was enabled (or already exists), False on error.
    """
    dialect = engine.url.get_backend_name()

    # Skip on non-PostgreSQL databases (SQLite in tests)
    if dialect != "postgresql":
        logger.info("Skipping pg_trgm extension (not PostgreSQL)")
        return True

    try:
        async with engine.begin() as conn:
            # CREATE EXTENSION IF NOT EXISTS is idempotent
            await conn.execute(
                text("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
            )
        logger.info("✅ pg_trgm extension enabled")
        return True
    except Exception as exc:
        # Extension may require superuser privileges on some setups
        # Log but don't fail - app can work without it
        logger.warning(f"⚠️ Could not enable pg_trgm extension: {exc}")
        return False


async def _get_column_type(
    engine: AsyncEngine, table_name: str, column_name: str
) -> str | None:
    """Get the data type of a column from information_schema.

    Args:
        engine: SQLAlchemy async engine connected to the database.
        table_name: Name of the table to inspect.
        column_name: Name of the column to inspect.

    Returns:
        The data_type string (e.g., 'integer', 'character varying') or None if
        the column does not exist.
    """
    dialect = engine.url.get_backend_name()

    if dialect != "postgresql":
        # For SQLite, use PRAGMA table_info
        async with engine.connect() as conn:
            result = await conn.execute(
                text(f"PRAGMA table_info({table_name})")  # noqa: S608
            )
            rows = result.fetchall()
            for row in rows:
                # row format: (cid, name, type, notnull, dflt_value, pk)
                if row[1] == column_name:
                    return row[2].lower()
        return None

    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_name = :table_name
                  AND column_name = :column_name
                """
            ),
            {"table_name": table_name, "column_name": column_name},
        )
        row = result.fetchone()
        return row[0] if row else None


async def _table_exists(engine: AsyncEngine, table_name: str) -> bool:
    """Check if a table exists in the database.

    Args:
        engine: SQLAlchemy async engine connected to the database.
        table_name: Name of the table to check.

    Returns:
        True if the table exists, False otherwise.
    """
    dialect = engine.url.get_backend_name()

    if dialect != "postgresql":
        # SQLite approach
        async with engine.connect() as conn:
            result = await conn.execute(
                text(
                    """
                    SELECT name FROM sqlite_master
                    WHERE type='table' AND name = :table_name
                    """
                ),
                {"table_name": table_name},
            )
            return result.fetchone() is not None

    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = :table_name
                )
                """
            ),
            {"table_name": table_name},
        )
        row = result.fetchone()
        return bool(row[0]) if row else False


async def align_journal_entries_schema(engine: AsyncEngine) -> dict[str, Any]:
    """Align journal_entries.id from INTEGER to VARCHAR(64) if needed.

    This migration handles the schema change for journal_entries.id from
    legacy integer IDs to VARCHAR(64) UUIDs. The function is idempotent:

    - If table doesn't exist: returns status indicating no action needed
    - If id is already VARCHAR: returns status indicating no action needed
    - If id is INTEGER: performs the migration

    Args:
        engine: SQLAlchemy async engine connected to the database.

    Returns:
        A dictionary containing migration results:
        - 'status': 'skipped', 'aligned', or 'error'
        - 'message': Human-readable description
        - 'previous_type': Original column type (if applicable)
    """
    result: dict[str, Any] = {
        "status": "skipped",
        "message": "",
        "previous_type": None,
    }

    dialect = engine.url.get_backend_name()

    # Check if table exists
    if not await _table_exists(engine, "journal_entries"):
        result["message"] = "journal_entries table does not exist"
        logger.info(f"ℹ️ {result['message']}")
        return result

    # Check current column type
    current_type = await _get_column_type(engine, "journal_entries", "id")
    result["previous_type"] = current_type

    if current_type is None:
        result["message"] = "id column not found in journal_entries"
        logger.info(f"ℹ️ {result['message']}")
        return result

    # Normalize type names for comparison
    normalized_type = current_type.lower()

    # Already VARCHAR/TEXT - no migration needed
    if normalized_type in ("character varying", "varchar", "text"):
        result["message"] = f"id column is already {current_type}, no migration needed"
        logger.info(f"ℹ️ {result['message']}")
        return result

    # For non-PostgreSQL (e.g., SQLite in tests), just skip
    if dialect != "postgresql":
        result["message"] = f"Skipping alignment on {dialect} (type={current_type})"
        logger.info(f"ℹ️ {result['message']}")
        return result

    # Need to migrate from INTEGER to VARCHAR
    if normalized_type in ("integer", "bigint", "int4", "int8"):
        try:
            async with engine.begin() as conn:
                # Alter column type - PostgreSQL allows this for integer to varchar
                await conn.execute(
                    text(
                        """
                        ALTER TABLE journal_entries
                        ALTER COLUMN id TYPE VARCHAR(64) USING id::VARCHAR(64)
                        """
                    )
                )
            result["status"] = "aligned"
            result["message"] = f"Successfully migrated id from {current_type} to VARCHAR(64)"
            logger.info(f"✅ {result['message']}")
        except Exception as exc:
            result["status"] = "error"
            result["message"] = f"Failed to migrate id column: {exc}"
            logger.error(f"❌ {result['message']}")
    else:
        result["message"] = f"Unexpected id column type: {current_type}"
        logger.warning(f"⚠️ {result['message']}")

    return result


async def run_manual_migrations(engine: AsyncEngine) -> dict[str, Any]:
    """Run all manual migrations that can't be done via SQL files.

    This function orchestrates all Python-based migrations in the correct
    order. It's safe to run multiple times (idempotent).

    Args:
        engine: SQLAlchemy async engine connected to the database.

    Returns:
        A dictionary with results from each migration:
        - 'pg_trgm': Boolean indicating extension status
        - 'journal_alignment': Dict with alignment migration results
    """
    results: dict[str, Any] = {}

    logger.info("🔧 Running manual migrations...")

    # Enable pg_trgm extension first (needed for text search indexes)
    results["pg_trgm"] = await enable_pg_trgm_extension(engine)

    # Align journal_entries schema
    results["journal_alignment"] = await align_journal_entries_schema(engine)

    logger.info("✅ Manual migrations complete")
    return results


__all__ = [
    "align_journal_entries_schema",
    "enable_pg_trgm_extension",
    "run_manual_migrations",
]
