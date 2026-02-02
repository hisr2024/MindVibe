#!/usr/bin/env python3
"""
Verse Cache Warming Script.

Pre-loads all 700+ Gita verses into WisdomKnowledgeBase cache on startup.
This improves initial search performance by avoiding cold database queries.

Usage:
    DATABASE_URL=<your-db-url> python scripts/warm_verse_cache.py
"""

import asyncio
import os
import sys
import time
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import async_sessionmaker

from backend.models import Base
from backend.services.wisdom_kb import WisdomKnowledgeBase
from scripts.db_utils import create_ssl_engine, normalize_database_url


async def warm_verse_cache() -> None:
    """Pre-load all verses into WisdomKnowledgeBase cache."""
    # Database URL - use environment variable or default
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://navi:navi@db:5432/navi",
    )

    # Normalize URL for asyncpg
    database_url = normalize_database_url(database_url)

    print("=" * 70)
    print("🕉️  KIAAN VERSE CACHE WARMING")
    print("=" * 70)
    print(f"📍 Database: {database_url[:60]}...")

    # Create async engine with SSL support
    engine = create_ssl_engine(database_url)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    # Ensure tables exist
    print("\n🔧 Checking database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables verified")

    # Warm the cache
    print("\n📥 Loading verses into cache...")
    start_time = time.time()

    kb = WisdomKnowledgeBase()

    async with async_session() as session:
        verses = await kb.get_all_verses(session)
        elapsed_ms = (time.time() - start_time) * 1000

    await engine.dispose()

    # Display results
    print("\n" + "=" * 70)
    print("📊 CACHE WARMING RESULTS")
    print("=" * 70)
    print(f"  ✅ Verses loaded: {len(verses)}")
    print(f"  ⏱️  Load time: {elapsed_ms:.2f}ms")

    if verses:
        # Show chapter distribution
        chapters = {v.get("chapter", 0) for v in verses}
        print(f"  📖 Chapters covered: {len(chapters)}")

        # Show sample of verses
        print("\n  Sample verses loaded:")
        for verse in verses[:3]:
            print(f"    - {verse.get('verse_id')}: {verse.get('theme')}")
        if len(verses) > 3:
            print(f"    ... and {len(verses) - 3} more")

    print("=" * 70)

    if len(verses) >= 700:
        print("\n✅ Full Gita database loaded successfully!")
        print("   KIAAN wisdom engine is ready with 700+ verses.")
    elif len(verses) > 0:
        print(f"\n⚠️  Partial database loaded: {len(verses)} verses")
        print("   Consider running seed_complete_gita.py to load all 700 verses.")
    else:
        print("\n❌ No verses found in database!")
        print("   Run seed_complete_gita.py first to populate the Gita database.")


def main() -> None:
    """Main entry point."""
    try:
        asyncio.run(warm_verse_cache())
    except KeyboardInterrupt:
        print("\nCache warming interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"Cache warming failed with error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
