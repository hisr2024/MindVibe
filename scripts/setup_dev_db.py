#!/usr/bin/env python3
"""
Set up development database for MindVibe.

Creates all tables from SQLAlchemy models in a SQLite database.
Use this for local development when PostgreSQL is not available.

Usage:
    python scripts/setup_dev_db.py
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

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Import models AFTER setting up the path
from backend import models
from scripts.db_utils import create_ssl_engine, normalize_database_url


async def main():
    """Set up development database."""
    database_url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./mindvibe_dev.db")

    print("=" * 60)
    print("MindVibe Development Database Setup")
    print("=" * 60)
    print(f"\nDatabase URL: {database_url}")

    # Create engine with SSL support for PostgreSQL
    if "sqlite" in database_url:
        engine = create_async_engine(
            database_url,
            echo=False,
            connect_args={"check_same_thread": False},
        )
    else:
        database_url = normalize_database_url(database_url)
        engine = create_ssl_engine(database_url)

    print("\nCreating tables from SQLAlchemy models...")

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

    # Count tables created
    from sqlalchemy import inspect
    async with engine.connect() as conn:
        def get_tables(connection):
            inspector = inspect(connection)
            return inspector.get_table_names()
        tables = await conn.run_sync(get_tables)

    print(f"\n[SUCCESS] Created {len(tables)} tables:")
    for table in sorted(tables):
        print(f"  - {table}")

    await engine.dispose()
    print("\nDatabase setup complete!")
    print(f"Database file: {database_url.replace('sqlite+aiosqlite:///', '')}")


if __name__ == "__main__":
    asyncio.run(main())
