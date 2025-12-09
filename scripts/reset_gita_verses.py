"""Reset gita_verses table (use with caution)."""

import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def reset_verses():
    """Delete all verses (use for testing only)."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(database_url)
    
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
