"""
Reset journal migration state so it can be re-run with the fixed version.
Run this once before deploying the fixed migration.
"""

import os
import sys
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncpg
from scripts.db_utils import get_asyncpg_ssl_context


async def reset_migration_state():
    """Remove journal migration from schema_migrations table."""

    database_url = os.getenv("DATABASE_URL", "")

    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        sys.exit(1)

    # Convert postgres:// to postgresql:// for asyncpg
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    try:
        print(f"🔌 Connecting to database...")
        ssl_ctx = get_asyncpg_ssl_context(database_url)
        conn = await asyncpg.connect(database_url, ssl=ssl_ctx)
        
        # Delete old journal migration records
        deleted = await conn.execute("""
            DELETE FROM schema_migrations 
            WHERE filename LIKE '%journal%'
        """)
        
        print(f"✅ Removed journal migration records from schema_migrations")
        print(f"   {deleted} rows affected")
        print("\n📝 The migration will run again on next deployment")
        
        await conn.close()
        print("✅ Done!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(reset_migration_state())
