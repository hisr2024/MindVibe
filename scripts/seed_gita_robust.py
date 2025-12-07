"""
Robust Gita verse seeding script with proper error handling and duplicate checking.
Safe for both fresh and existing databases.
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models import GitaVerse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def load_verses_from_json() -> list[dict]:
    """Load verses from JSON file."""
    json_path = Path(__file__).parent.parent / "data" / "gita" / "gita_verses_complete.json"
    
    if not json_path.exists():
        raise FileNotFoundError(f"Verse data not found at {json_path}")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    verses = data if isinstance(data, list) else data.get("verses", [])
    logger.info(f"Loaded {len(verses)} verses from JSON")
    return verses


async def verse_exists(session: AsyncSession, chapter: int, verse: int) -> bool:
    """Check if a verse already exists in the database."""
    result = await session.execute(
        select(GitaVerse).where(
            GitaVerse.chapter == chapter,
            GitaVerse.verse == verse
        )
    )
    return result.scalar_one_or_none() is not None


async def seed_verse(session: AsyncSession, verse_data: dict) -> tuple[bool, str]:
    """
    Seed a single verse with proper error handling.
    
    Returns:
        (success: bool, message: str)
    """
    chapter = verse_data.get("chapter")
    verse_num = verse_data.get("verse")
    
    try:
        # Check if verse already exists
        if await verse_exists(session, chapter, verse_num):
            return (True, f"Verse {chapter}.{verse_num} already exists (skipped)")
        
        # Create new verse
        new_verse = GitaVerse(
            chapter=chapter,
            verse=verse_num,
            sanskrit=verse_data.get("sanskrit", ""),
            transliteration=verse_data.get("transliteration"),
            hindi=verse_data.get("hindi", ""),
            english=verse_data.get("english", ""),
            word_meanings=verse_data.get("word_meanings"),
            principle=verse_data.get("principle", ""),
            theme=verse_data.get("theme", ""),
            mental_health_applications=verse_data.get("mental_health_applications"),
            primary_domain=verse_data.get("primary_domain"),
            secondary_domains=verse_data.get("secondary_domains"),
        )
        
        session.add(new_verse)
        await session.commit()
        
        return (True, f"✅ Seeded verse {chapter}.{verse_num}")
        
    except Exception as e:
        await session.rollback()
        error_msg = f"❌ Failed to seed verse {chapter}.{verse_num}: {str(e)}"
        logger.error(error_msg)
        return (False, error_msg)


async def seed_all_verses():
    """Seed all Gita verses with proper transaction handling."""
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    # Convert postgres:// to postgresql+asyncpg://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    
    # Create engine and session
    engine = create_async_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    print("=" * 70)
    print("🕉️  ROBUST GITA VERSE SEEDING")
    print("=" * 70)
    print(f"Database: {database_url[:50]}...")
    print()
    
    # Load verses
    verses = await load_verses_from_json()
    print(f"📖 Loaded {len(verses)} verses from JSON\n")
    
    # Seed verses one by one with individual transactions
    seeded = 0
    skipped = 0
    failed = 0
    
    print("🌱 Seeding verses...\n")
    
    async with async_session() as session:
        for i, verse_data in enumerate(verses, 1):
            chapter = verse_data.get("chapter")
            verse_num = verse_data.get("verse")
            
            success, message = await seed_verse(session, verse_data)
            
            if success:
                if "skipped" in message:
                    skipped += 1
                else:
                    seeded += 1
                    if seeded % 50 == 0:
                        print(f"   Progress: {seeded} verses seeded...")
            else:
                failed += 1
                print(f"   {message}")
            
            # Progress indicator every chapter
            if verse_num == 1 and seeded > 0:
                print(f"   ✅ Chapter {chapter-1} complete")
    
    # Final summary
    print("\n" + "=" * 70)
    print("📊 SEEDING SUMMARY")
    print("=" * 70)
    print(f"   ✅ Seeded: {seeded}")
    print(f"   ⏭️  Skipped: {skipped}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📊 Total: {seeded + skipped + failed}/{len(verses)}")
    print()
    
    # Verify final count
    async with async_session() as session:
        result = await session.execute(select(GitaVerse))
        total_in_db = len(result.scalars().all())
        print(f"✅ Total verses in database: {total_in_db}/700")
    
    if total_in_db == 700:
        print("🎉 SUCCESS! All 700 Gita verses are now in the database!\n")
    elif total_in_db > 0:
        print(f"⚠️  Partial success: {total_in_db}/700 verses in database\n")
    else:
        print("❌ FAILED: Database is still empty\n")
    
    print("=" * 70)
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_all_verses())
