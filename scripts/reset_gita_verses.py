"""Reset gita_verses table (use with caution)."""

import asyncio
import os
import sys
from pathlib import Path
from sqlalchemy import text

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.db_utils import create_ssl_engine, normalize_database_url


async def reset_verses():
    """Delete all verses (use for testing only)."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    database_url = normalize_database_url(database_url)
    engine = create_ssl_engine(database_url)
    
    print("⚠️  WARNING: This will delete all Gita verses!")
    confirm = input("Type 'DELETE' to confirm: ")
    
    if confirm == "DELETE":
        async with engine.begin() as conn:
            await conn.execute(text("DELETE FROM gita_verses;"))
            print("✅ All verses deleted")
    else:
        print("❌ Cancelled")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(reset_verses())
