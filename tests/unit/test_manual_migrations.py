"""Unit tests for manual_migrations module."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.core.manual_migrations import (
    _get_column_type,
    _table_exists,
    align_journal_entries_schema,
    enable_pg_trgm_extension,
    run_manual_migrations,
)


class TestEnablePgTrgmExtension:
    """Tests for enable_pg_trgm_extension function."""

    @pytest.mark.asyncio
    async def test_skips_on_non_postgresql(self) -> None:
        """Should skip and return True for non-PostgreSQL databases."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "sqlite"

        result = await enable_pg_trgm_extension(engine)

        assert result is True
        # Should not try to execute anything
        engine.begin.assert_not_called()

    @pytest.mark.asyncio
    async def test_enables_extension_on_postgresql(self) -> None:
        """Should execute CREATE EXTENSION on PostgreSQL."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        mock_conn = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.begin.return_value = mock_context

        result = await enable_pg_trgm_extension(engine)

        assert result is True
        mock_conn.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_extension_error_gracefully(self) -> None:
        """Should return False but not raise on extension creation error."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        mock_conn = AsyncMock()
        mock_conn.execute.side_effect = Exception("Permission denied")
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.begin.return_value = mock_context

        result = await enable_pg_trgm_extension(engine)

        assert result is False


class TestTableExists:
    """Tests for _table_exists helper function."""

    @pytest.mark.asyncio
    async def test_sqlite_table_exists(self) -> None:
        """Should detect existing table in SQLite."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "sqlite"

        mock_result = MagicMock()
        mock_result.fetchone.return_value = ("journal_entries",)

        mock_conn = AsyncMock()
        mock_conn.execute.return_value = mock_result

        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.connect.return_value = mock_context

        result = await _table_exists(engine, "journal_entries")

        assert result is True

    @pytest.mark.asyncio
    async def test_sqlite_table_not_exists(self) -> None:
        """Should return False for non-existing table in SQLite."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "sqlite"

        mock_result = MagicMock()
        mock_result.fetchone.return_value = None

        mock_conn = AsyncMock()
        mock_conn.execute.return_value = mock_result

        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.connect.return_value = mock_context

        result = await _table_exists(engine, "nonexistent_table")

        assert result is False

    @pytest.mark.asyncio
    async def test_postgresql_table_exists(self) -> None:
        """Should detect existing table in PostgreSQL."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        mock_result = MagicMock()
        mock_result.fetchone.return_value = (True,)

        mock_conn = AsyncMock()
        mock_conn.execute.return_value = mock_result

        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.connect.return_value = mock_context

        result = await _table_exists(engine, "journal_entries")

        assert result is True


class TestGetColumnType:
    """Tests for _get_column_type helper function."""

    @pytest.mark.asyncio
    async def test_rejects_invalid_table_name(self) -> None:
        """Should reject table names with invalid characters."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "sqlite"

        with pytest.raises(ValueError, match="Invalid table name"):
            await _get_column_type(engine, "table; DROP TABLE users;--", "id")

    @pytest.mark.asyncio
    async def test_rejects_invalid_column_name(self) -> None:
        """Should reject column names with invalid characters."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "sqlite"

        with pytest.raises(ValueError, match="Invalid column name"):
            await _get_column_type(engine, "journal_entries", "id; DROP TABLE users;--")

    @pytest.mark.asyncio
    async def test_sqlite_returns_column_type(self) -> None:
        """Should return column type from SQLite PRAGMA."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "sqlite"

        # PRAGMA table_info returns rows: (cid, name, type, notnull, dflt_value, pk)
        mock_result = MagicMock()
        mock_result.fetchall.return_value = [
            (0, "id", "VARCHAR(64)", 0, None, 1),
            (1, "user_id", "VARCHAR(255)", 0, None, 0),
        ]

        mock_conn = AsyncMock()
        mock_conn.execute.return_value = mock_result

        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.connect.return_value = mock_context

        result = await _get_column_type(engine, "journal_entries", "id")

        assert result == "varchar(64)"

    @pytest.mark.asyncio
    async def test_sqlite_returns_none_for_missing_column(self) -> None:
        """Should return None for non-existing column in SQLite."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "sqlite"

        mock_result = MagicMock()
        mock_result.fetchall.return_value = [
            (0, "id", "VARCHAR(64)", 0, None, 1),
        ]

        mock_conn = AsyncMock()
        mock_conn.execute.return_value = mock_result

        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.connect.return_value = mock_context

        result = await _get_column_type(engine, "journal_entries", "nonexistent")

        assert result is None

    @pytest.mark.asyncio
    async def test_postgresql_returns_column_type(self) -> None:
        """Should return column type from PostgreSQL information_schema."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        mock_result = MagicMock()
        mock_result.fetchone.return_value = ("character varying",)

        mock_conn = AsyncMock()
        mock_conn.execute.return_value = mock_result

        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.connect.return_value = mock_context

        result = await _get_column_type(engine, "journal_entries", "id")

        assert result == "character varying"


class TestAlignJournalEntriesSchema:
    """Tests for align_journal_entries_schema function."""

    @pytest.mark.asyncio
    async def test_skips_when_table_not_exists(self) -> None:
        """Should skip when journal_entries table doesn't exist."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        with patch(
            "backend.core.manual_migrations._table_exists",
            new_callable=AsyncMock,
            return_value=False,
        ):
            result = await align_journal_entries_schema(engine)

        assert result["status"] == "skipped"
        assert "does not exist" in result["message"]

    @pytest.mark.asyncio
    async def test_skips_when_column_not_exists(self) -> None:
        """Should skip when id column doesn't exist."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        with patch(
            "backend.core.manual_migrations._table_exists",
            new_callable=AsyncMock,
            return_value=True,
        ), patch(
            "backend.core.manual_migrations._get_column_type",
            new_callable=AsyncMock,
            return_value=None,
        ):
            result = await align_journal_entries_schema(engine)

        assert result["status"] == "skipped"
        assert "not found" in result["message"]

    @pytest.mark.asyncio
    async def test_skips_when_already_varchar(self) -> None:
        """Should skip when id is already VARCHAR type."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        with patch(
            "backend.core.manual_migrations._table_exists",
            new_callable=AsyncMock,
            return_value=True,
        ), patch(
            "backend.core.manual_migrations._get_column_type",
            new_callable=AsyncMock,
            return_value="character varying",
        ):
            result = await align_journal_entries_schema(engine)

        assert result["status"] == "skipped"
        assert "already" in result["message"]
        assert result["previous_type"] == "character varying"

    @pytest.mark.asyncio
    async def test_skips_when_already_varchar_with_length(self) -> None:
        """Should skip when id is already VARCHAR(64) type (parameterized)."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        with patch(
            "backend.core.manual_migrations._table_exists",
            new_callable=AsyncMock,
            return_value=True,
        ), patch(
            "backend.core.manual_migrations._get_column_type",
            new_callable=AsyncMock,
            return_value="varchar(64)",
        ):
            result = await align_journal_entries_schema(engine)

        assert result["status"] == "skipped"
        assert "already" in result["message"]
        assert result["previous_type"] == "varchar(64)"

    @pytest.mark.asyncio
    async def test_skips_on_non_postgresql(self) -> None:
        """Should skip alignment on non-PostgreSQL databases."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "sqlite"

        with patch(
            "backend.core.manual_migrations._table_exists",
            new_callable=AsyncMock,
            return_value=True,
        ), patch(
            "backend.core.manual_migrations._get_column_type",
            new_callable=AsyncMock,
            return_value="integer",
        ):
            result = await align_journal_entries_schema(engine)

        assert result["status"] == "skipped"
        assert "sqlite" in result["message"].lower()

    @pytest.mark.asyncio
    async def test_aligns_integer_to_varchar(self) -> None:
        """Should migrate id from INTEGER to VARCHAR on PostgreSQL."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        mock_conn = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.begin.return_value = mock_context

        with patch(
            "backend.core.manual_migrations._table_exists",
            new_callable=AsyncMock,
            return_value=True,
        ), patch(
            "backend.core.manual_migrations._get_column_type",
            new_callable=AsyncMock,
            return_value="integer",
        ):
            result = await align_journal_entries_schema(engine)

        assert result["status"] == "aligned"
        assert "Successfully" in result["message"]
        assert result["previous_type"] == "integer"
        mock_conn.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_migration_error(self) -> None:
        """Should return error status on migration failure."""
        engine = MagicMock()
        engine.url.get_backend_name.return_value = "postgresql"

        mock_conn = AsyncMock()
        mock_conn.execute.side_effect = Exception("Column referenced by FK")
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_conn
        engine.begin.return_value = mock_context

        with patch(
            "backend.core.manual_migrations._table_exists",
            new_callable=AsyncMock,
            return_value=True,
        ), patch(
            "backend.core.manual_migrations._get_column_type",
            new_callable=AsyncMock,
            return_value="integer",
        ):
            result = await align_journal_entries_schema(engine)

        assert result["status"] == "error"
        assert "Failed" in result["message"]


class TestRunManualMigrations:
    """Tests for run_manual_migrations orchestrator function."""

    @pytest.mark.asyncio
    async def test_runs_all_migrations(self) -> None:
        """Should run pg_trgm and journal alignment migrations."""
        engine = MagicMock()

        with patch(
            "backend.core.manual_migrations.enable_pg_trgm_extension",
            new_callable=AsyncMock,
            return_value=True,
        ) as mock_pg_trgm, patch(
            "backend.core.manual_migrations.align_journal_entries_schema",
            new_callable=AsyncMock,
            return_value={"status": "skipped", "message": "No action needed"},
        ) as mock_align:
            results = await run_manual_migrations(engine)

        assert results["pg_trgm"] is True
        assert results["journal_alignment"]["status"] == "skipped"
        mock_pg_trgm.assert_called_once_with(engine)
        mock_align.assert_called_once_with(engine)

    @pytest.mark.asyncio
    async def test_returns_combined_results(self) -> None:
        """Should return combined results from all migrations."""
        engine = MagicMock()

        alignment_result = {
            "status": "aligned",
            "message": "Successfully migrated",
            "previous_type": "integer",
        }

        with patch(
            "backend.core.manual_migrations.enable_pg_trgm_extension",
            new_callable=AsyncMock,
            return_value=False,
        ), patch(
            "backend.core.manual_migrations.align_journal_entries_schema",
            new_callable=AsyncMock,
            return_value=alignment_result,
        ):
            results = await run_manual_migrations(engine)

        assert results["pg_trgm"] is False
        assert results["journal_alignment"] == alignment_result
