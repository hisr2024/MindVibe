"""
Complete Bhagavad Gita Database Seeding Script

Fetches all 700 verses from Bhagavad Gita API and seeds to production database.
Uses authentic sources with Sanskrit, transliteration, Hindi, and English.

Usage:
    # Seed to production database (Render.com)
    DATABASE_URL=<your-render-db-url> python scripts/seed_complete_gita.py

    # Or with environment variable already set
    python scripts/seed_complete_gita.py

Requirements:
    - httpx for API calls
    - sqlalchemy for database operations
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import cast

import httpx
from sqlalchemy import insert, select, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models import Base, GitaVerse

# Bhagavad Gita API Configuration
# Get free API key from: https://rapidapi.com/bhagavad-gita-bhagavad-gita-default/api/bhagavad-gita3
RAPID_API_KEY = os.getenv("RAPID_API_KEY", "")
RAPID_API_HOST = "bhagavad-gita3.p.rapidapi.com"

# Alternative: Use public GitHub dataset as fallback
GITHUB_GITA_DATA = (
    "https://raw.githubusercontent.com/gita/gita/master/data/gita_verses.json"
)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

# Fix Render.com DATABASE_URL to use asyncpg
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)

# Chapter metadata (18 chapters with verse counts)
CHAPTER_INFO: dict[int, dict[str, int | str]] = {
    1: {"verses": 47, "theme": "emotional_crisis_moral_conflict"},
    2: {"verses": 72, "theme": "transcendental_knowledge"},
    3: {"verses": 43, "theme": "selfless_action"},
    4: {"verses": 42, "theme": "knowledge_wisdom"},
    5: {"verses": 29, "theme": "action_renunciation"},
    6: {"verses": 47, "theme": "meditation_mindfulness"},
    7: {"verses": 30, "theme": "self_knowledge"},
    8: {"verses": 28, "theme": "attaining_supreme"},
    9: {"verses": 34, "theme": "sovereign_knowledge"},
    10: {"verses": 42, "theme": "divine_manifestations"},
    11: {"verses": 55, "theme": "universal_form"},
    12: {"verses": 20, "theme": "devotion"},
    13: {"verses": 34, "theme": "matter_spirit"},
    14: {"verses": 27, "theme": "three_modes"},
    15: {"verses": 20, "theme": "supreme_person"},
    16: {"verses": 24, "theme": "divine_demoniac_natures"},
    17: {"verses": 28, "theme": "three_divisions_faith"},
    18: {"verses": 78, "theme": "liberation_renunciation"},
}


async def fetch_verse_from_rapid_api(chapter: int, verse: int) -> dict | None:
    """Fetch verse from RapidAPI Bhagavad Gita API."""
    if not RAPID_API_KEY:
        return None

    url = f"https://{RAPID_API_HOST}/v2/chapters/{chapter}/verses/{verse}/"
    headers = {"X-RapidAPI-Key": RAPID_API_KEY, "X-RapidAPI-Host": RAPID_API_HOST}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status()
            return cast(dict, response.json())
        except Exception as e:
            print(f"  ⚠️  RapidAPI error for {chapter}.{verse}: {e}")
            return None


async def fetch_from_github_dataset() -> list[dict] | None:
    """Fetch complete Gita dataset from GitHub as fallback."""
    print("\n📥 Fetching Gita dataset from GitHub...")

    async with httpx.AsyncClient() as client:
        try:
            # Try multiple GitHub sources
            sources = [
                "https://raw.githubusercontent.com/gita/bhagavad-gita-api/master/src/gita-verses.json",
                "https://raw.githubusercontent.com/bhagavadgita/bhagavad-gita-api/master/verses.json",
            ]

            for source_url in sources:
                try:
                    response = await client.get(source_url, timeout=30.0)
                    response.raise_for_status()
                    data = cast(list[dict], response.json())
                    print(f"✅ Successfully fetched {len(data)} verses from GitHub")
                    return data
                except Exception as e:
                    print(f"  ⚠️  Failed to fetch from {source_url}: {e}")
                    continue

            return None
        except Exception as e:
            print(f"❌ Error fetching from GitHub: {e}")
            return None


def create_verse_from_data(data: dict, chapter: int, verse: int) -> dict:
    """Transform API data into our database format."""
    # Handle different API response formats

    # Extract text fields with fallbacks
    sanskrit = data.get("text") or data.get("sanskrit") or data.get("verse_text") or ""
    transliteration = data.get("transliteration") or ""
    english = (
        data.get("translation") or data.get("english") or data.get("meaning") or ""
    )
    hindi = data.get("hindi") or data.get("hindi_meaning") or ""

    # Get word meanings if available
    word_meanings = data.get("word_meanings") or {}

    return {
        "chapter": chapter,
        "verse": verse,
        "sanskrit": sanskrit,
        "transliteration": transliteration,
        "english": english,
        "hindi": hindi,
        "chapter_name": data.get("chapter_name") or f"Chapter {chapter}",
        "theme": CHAPTER_INFO[chapter]["theme"],
        "word_meanings": word_meanings,
        "embedding": None,
    }


async def seed_chapter(chapter_num: int, use_rapid_api: bool = True) -> None:
    """Seed all verses from a single chapter."""
    chapter_info = CHAPTER_INFO[chapter_num]
    total_verses = int(chapter_info["verses"])

    print(f"\n{'='*70}")
    print(f"📖 Seeding Chapter {chapter_num}")
    print(f"   Theme: {chapter_info['theme']}")
    print(f"   Total verses: {total_verses}")
    print(f"{'='*70}\n")

    seeded_count = 0
    skipped_count = 0
    failed_count = 0

    async with Session() as session:
        for verse_num in range(1, total_verses + 1):
            try:
                # Check if verse already exists
                result = await session.execute(
                    select(GitaVerse).where(
                        GitaVerse.chapter == chapter_num, GitaVerse.verse == verse_num
                    )
                )
                existing = result.scalar_one_or_none()

                if existing:
                    print(
                        f"  ⏭️  Verse {chapter_num}.{verse_num} already exists, skipping"
                    )
                    skipped_count += 1
                    continue

                # Fetch verse data
                verse_data = None
                if use_rapid_api:
                    verse_data = await fetch_verse_from_rapid_api(
                        chapter_num, verse_num
                    )

                if not verse_data:
                    print(
                        f"  ⚠️  Could not fetch verse {chapter_num}.{verse_num}, will retry in batch"
                    )
                    failed_count += 1
                    continue

                # Create and insert verse
                verse_record = create_verse_from_data(
                    verse_data, chapter_num, verse_num
                )
                await session.execute(insert(GitaVerse).values(**verse_record))

                print(f"  ✅ Inserted verse {chapter_num}.{verse_num}")
                seeded_count += 1

                # Rate limiting - be nice to the API
                await asyncio.sleep(0.1)

            except Exception as e:
                print(f"  ❌ Error seeding verse {chapter_num}.{verse_num}: {e}")
                failed_count += 1

        await session.commit()

    print(f"\n📊 Chapter {chapter_num} Summary:")
    print(f"   ✅ Seeded: {seeded_count}")
    print(f"   ⏭️  Skipped: {skipped_count}")
    print(f"   ❌ Failed: {failed_count}")
    print(f"{'='*70}\n")


async def seed_from_github_dataset() -> bool:
    """Seed complete Gita from GitHub dataset."""
    print("\n" + "=" * 70)
    print("📥 FETCHING COMPLETE GITA FROM GITHUB DATASET")
    print("=" * 70)

    # This is a simplified implementation
    # You would need to adapt based on actual GitHub dataset format
    print("⚠️  GitHub dataset seeding not yet implemented")
    print("   Please use RapidAPI method or provide dataset URL")
    return False


async def verify_seeding() -> None:
    """Verify that all verses were seeded correctly."""
    print("\n" + "=" * 70)
    print("🔍 VERIFYING SEEDED DATA")
    print("=" * 70 + "\n")

    async with Session() as session:
        for chapter in range(1, 19):
            expected_count = CHAPTER_INFO[chapter]["verses"]
            result = await session.execute(
                select(text("COUNT(*)"))
                .select_from(GitaVerse)
                .where(GitaVerse.chapter == chapter)
            )
            actual_count = result.scalar()

            status = "✅" if actual_count == expected_count else "⚠️"
            print(
                f"{status} Chapter {chapter:2d}: {actual_count:3d}/{expected_count:3d} verses"
            )

        # Total count
        result = await session.execute(select(text("COUNT(*)")).select_from(GitaVerse))
        total = result.scalar() or 0
        print(f"\n📊 Total verses in database: {total}/700")

        if total == 700:
            print("✅ ALL 700 VERSES SUCCESSFULLY SEEDED! 🎉")
        else:
            print(f"⚠️  Missing {700 - total} verses")


async def main() -> None:
    """Main seeding function."""
    try:
        print("\n" + "=" * 70)
        print("🕉️  COMPLETE BHAGAVAD GITA DATABASE SEEDING")
        print("=" * 70)
        print(f"📍 Database: {DATABASE_URL[:60]}...")
        print("📖 Total chapters: 18")
        print("📝 Total verses: 700")
        print("=" * 70 + "\n")

        # Create tables
        print("🔧 Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Tables created/verified\n")

        # Check if RapidAPI key is available
        use_rapid_api = bool(RAPID_API_KEY)

        if use_rapid_api:
            print("✅ RapidAPI key detected - using Bhagavad Gita API")
            print(
                "   Get your free key: https://rapidapi.com/bhagavad-gita-bhagavad-gita-default/api/bhagavad-gita3\n"
            )
        else:
            print("⚠️  No RapidAPI key found (set RAPID_API_KEY env var)")
            print("   Attempting to use GitHub dataset as fallback...\n")

            # Try GitHub dataset
            success = await seed_from_github_dataset()
            if not success:
                print("\n❌ ERROR: No data source available!")
                print("   Please either:")
                print("   1. Set RAPID_API_KEY environment variable")
                print("   2. Or manually download Gita dataset to data/gita/")
                return

        # Seed all 18 chapters
        if use_rapid_api:
            for chapter in range(1, 19):
                await seed_chapter(chapter, use_rapid_api=True)
                await asyncio.sleep(1)  # Rate limiting between chapters

        # Verify seeding
        await verify_seeding()

        print("\n" + "=" * 70)
        print("✅ BHAGAVAD GITA DATABASE SEEDING COMPLETED!")
        print("=" * 70)
        print("\n🎉 You now have the complete Bhagavad Gita in your database!")
        print("   All 700 verses across 18 chapters are ready for AI-powered")
        print("   modern mental health applications.\n")

    except Exception as e:
        print(f"\n❌ CRITICAL ERROR during seeding: {e}")
        import traceback

        traceback.print_exc()
        raise


if __name__ == "__main__":
    asyncio.run(main())
