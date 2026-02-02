#!/usr/bin/env python3
"""
Run database migrations for MindVibe.

Usage:
    python scripts/run_migrations.py

This script applies all pending SQL migrations from the migrations/ directory.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / ".env")

from backend.core.migrations import apply_sql_migrations, get_migration_status
from scripts.db_utils import create_ssl_engine, get_ssl_connect_args, normalize_database_url


async def main():
    """Run database migrations."""
    database_url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./mindvibe_dev.db")

    print(f"Database URL: {database_url[:50]}...")
    print("-" * 60)

    # Create engine with SSL support for PostgreSQL
    if "sqlite" in database_url:
        from sqlalchemy.ext.asyncio import create_async_engine
        engine = create_async_engine(
            database_url,
            echo=False,
            connect_args={"check_same_thread": False},
        )
    else:
        database_url = normalize_database_url(database_url)
        engine = create_ssl_engine(database_url)

    # Check current status
    print("\nChecking migration status...")
    status = await get_migration_status(engine)
    print(f"Applied migrations: {len(status.applied)}")
    print(f"Pending migrations: {len(status.pending)}")

    if status.pending:
        print(f"\nPending files: {status.pending}")
        print("\nApplying migrations...")

        result = await apply_sql_migrations(engine)

        if result.error:
            print(f"\n[ERROR] Migration failed: {result.error}")
            print(f"Failed file: {result.failed_file}")
            print(f"Failed statement: {result.failed_statement[:200] if result.failed_statement else 'N/A'}...")
            sys.exit(1)

        print(f"\n[SUCCESS] Applied {len(result.applied)} migrations:")
        for m in result.applied:
            print(f"  - {m}")
    else:
        print("\nNo pending migrations. Database is up to date.")

    await engine.dispose()
    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
