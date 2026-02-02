"""
Complete Bhagavad Gita Database Seeding Script

Seeds all 700 verses from local JSON files to production database.
Uses authentic sources with Sanskrit, transliteration, Hindi, and English.
Includes comprehensive validation and progress tracking.

Data Sources (in priority order):
1. Local complete JSON: data/gita/gita_verses_complete.json (PRIMARY)
2. Local chapter files: data/gita/chapters/chapter_*.json (FALLBACK)
3. RapidAPI Bhagavad Gita API (EXTERNAL - requires API key)

Usage:
    # Seed to production database (Render.com)
    DATABASE_URL=<your-render-db-url> python scripts/seed_complete_gita.py

    # Seed from local JSON files (default)
    python scripts/seed_complete_gita.py

    # Force use of API (requires RAPID_API_KEY)
    RAPID_API_KEY=<your-key> python scripts/seed_complete_gita.py --api

    # Use chapter-wise files
    python scripts/seed_complete_gita.py --chapters

Requirements:
    - sqlalchemy for database operations
    - httpx for API calls (only if using --api)
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import insert, select, text
from sqlalchemy.ext.asyncio import async_sessionmaker

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models import Base, GitaVerse
from scripts.db_utils import create_ssl_engine, normalize_database_url

# Data file paths
DATA_DIR = Path(__file__).parent.parent / "data" / "gita"
COMPLETE_JSON_PATH = DATA_DIR / "gita_verses_complete.json"
CHAPTERS_DIR = DATA_DIR / "chapters"

# Bhagavad Gita API Configuration (fallback if no local data)
RAPID_API_KEY = os.getenv("RAPID_API_KEY", "")
RAPID_API_HOST = "bhagavad-gita3.p.rapidapi.com"

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

# Normalize URL for asyncpg
DATABASE_URL = normalize_database_url(DATABASE_URL)

engine = create_ssl_engine(DATABASE_URL)
Session = async_sessionmaker(engine, expire_on_commit=False)

# Chapter metadata (18 chapters with verse counts)
CHAPTER_INFO: dict[int, dict[str, int | str]] = {
    1: {"verses": 47, "theme": "emotional_crisis_moral_conflict", "name": "Arjuna Vishada Yoga"},
    2: {"verses": 72, "theme": "transcendental_knowledge", "name": "Sankhya Yoga"},
    3: {"verses": 43, "theme": "selfless_action", "name": "Karma Yoga"},
    4: {"verses": 42, "theme": "knowledge_wisdom", "name": "Jnana Karma Sanyasa Yoga"},
    5: {"verses": 29, "theme": "action_renunciation", "name": "Karma Sanyasa Yoga"},
    6: {"verses": 47, "theme": "meditation_mindfulness", "name": "Dhyana Yoga"},
    7: {"verses": 30, "theme": "self_knowledge", "name": "Jnana Vijnana Yoga"},
    8: {"verses": 28, "theme": "attaining_supreme", "name": "Aksara Brahma Yoga"},
    9: {"verses": 34, "theme": "sovereign_knowledge", "name": "Raja Vidya Raja Guhya Yoga"},
    10: {"verses": 42, "theme": "divine_manifestations", "name": "Vibhuti Yoga"},
    11: {"verses": 55, "theme": "universal_form", "name": "Visvarupa Darsana Yoga"},
    12: {"verses": 20, "theme": "devotion", "name": "Bhakti Yoga"},
    13: {"verses": 34, "theme": "matter_spirit", "name": "Ksetra Ksetrajna Vibhaga Yoga"},
    14: {"verses": 27, "theme": "three_modes", "name": "Gunatraya Vibhaga Yoga"},
    15: {"verses": 20, "theme": "supreme_person", "name": "Purusottama Yoga"},
    16: {"verses": 24, "theme": "divine_demoniac_natures", "name": "Daivasura Sampad Vibhaga Yoga"},
    17: {"verses": 28, "theme": "three_divisions_faith", "name": "Sraddhatraya Vibhaga Yoga"},
    18: {"verses": 78, "theme": "liberation_renunciation", "name": "Moksha Sanyasa Yoga"},
}

TOTAL_EXPECTED = 700

# Required fields for verse validation
REQUIRED_FIELDS = ["chapter", "verse", "sanskrit", "english", "hindi", "theme"]


def validate_verse(verse_data: dict[str, Any]) -> tuple[bool, str]:
    """
    Validate verse data has all required fields.

    Args:
        verse_data: Verse dictionary to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    for field in REQUIRED_FIELDS:
        if field not in verse_data or not verse_data.get(field):
            return False, f"Missing required field: {field}"

    chapter = verse_data.get("chapter", 0)
    verse = verse_data.get("verse", 0)

    # Validate chapter range
    if not (1 <= chapter <= 18):
        return False, f"Invalid chapter: {chapter}"

    # Validate verse range for chapter
    if chapter in CHAPTER_INFO:
        max_verse = CHAPTER_INFO[chapter]["verses"]
        if not (1 <= verse <= max_verse):
            return False, f"Invalid verse {verse} for chapter {chapter} (max: {max_verse})"

    return True, ""


def load_verses_from_complete_json() -> list[dict[str, Any]]:
    """Load all verses from the complete JSON file."""
    if not COMPLETE_JSON_PATH.exists():
        print(f"   ⚠️  Complete JSON file not found: {COMPLETE_JSON_PATH}")
        return []

    try:
        with open(COMPLETE_JSON_PATH, encoding="utf-8") as f:
            verses = json.load(f)
        print(f"   ✅ Loaded {len(verses)} verses from gita_verses_complete.json")
        return verses
    except json.JSONDecodeError as e:
        print(f"   ❌ Invalid JSON in complete file: {e}")
        return []
    except Exception as e:
        print(f"   ❌ Error loading complete JSON: {e}")
        return []


def load_verses_from_chapter_files() -> list[dict[str, Any]]:
    """Load all verses from individual chapter files."""
    if not CHAPTERS_DIR.exists():
        print(f"   ⚠️  Chapters directory not found: {CHAPTERS_DIR}")
        return []

    all_verses = []
    for chapter in range(1, 19):
        chapter_file = CHAPTERS_DIR / f"chapter_{chapter:02d}.json"
        if not chapter_file.exists():
            print(f"   ⚠️  Missing chapter file: chapter_{chapter:02d}.json")
            continue

        try:
            with open(chapter_file, encoding="utf-8") as f:
                chapter_verses = json.load(f)
            all_verses.extend(chapter_verses)
        except json.JSONDecodeError as e:
            print(f"   ❌ Invalid JSON in chapter_{chapter:02d}.json: {e}")
        except Exception as e:
            print(f"   ❌ Error loading chapter_{chapter:02d}.json: {e}")

    print(f"   ✅ Loaded {len(all_verses)} verses from chapter files")
    return all_verses


async def fetch_verse_from_rapid_api(chapter: int, verse: int) -> dict[str, Any] | None:
    """Fetch verse from RapidAPI Bhagavad Gita API (external fallback)."""
    if not RAPID_API_KEY:
        return None

    import httpx

    url = f"https://{RAPID_API_HOST}/v2/chapters/{chapter}/verses/{verse}/"
    headers = {"X-RapidAPI-Key": RAPID_API_KEY, "X-RapidAPI-Host": RAPID_API_HOST}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return dict(data) if isinstance(data, dict) else None
        except Exception as e:
            print(f"  ⚠️  RapidAPI error for {chapter}.{verse}: {e}")
            return None


def transform_verse_for_db(verse_data: dict[str, Any]) -> dict[str, Any]:
    """Transform verse data into database format."""
    chapter = verse_data.get("chapter", 0)

    # Get theme from CHAPTER_INFO if not present
    theme = verse_data.get("theme") or CHAPTER_INFO.get(chapter, {}).get("theme", "")

    # Get principle or generate default
    principle = verse_data.get("principle") or f"Teaching from Chapter {chapter}"

    return {
        "chapter": chapter,
        "verse": verse_data.get("verse", 0),
        "sanskrit": verse_data.get("sanskrit", ""),
        "transliteration": verse_data.get("transliteration"),
        "english": verse_data.get("english", ""),
        "hindi": verse_data.get("hindi", ""),
        "word_meanings": verse_data.get("word_meanings"),
        "principle": principle,
        "theme": theme,
        "mental_health_applications": verse_data.get("mental_health_applications"),
        "primary_domain": None,  # Will be set by migration script
        "secondary_domains": None,  # Will be set by migration script
        "embedding": None,
    }


async def seed_from_local_json(use_chapter_files: bool = False) -> tuple[int, int, int]:
    """
    Seed verses from local JSON files.

    Args:
        use_chapter_files: If True, use individual chapter files instead of complete JSON

    Returns:
        Tuple of (seeded_count, skipped_count, failed_count)
    """
    print("\n" + "=" * 70)
    print("📥 LOADING VERSES FROM LOCAL JSON FILES")
    print("=" * 70 + "\n")

    # Load verses from appropriate source
    if use_chapter_files:
        verses = load_verses_from_chapter_files()
    else:
        verses = load_verses_from_complete_json()
        if not verses:
            print("   Falling back to chapter files...")
            verses = load_verses_from_chapter_files()

    if not verses:
        print("   ❌ No verses loaded from local files")
        return 0, 0, 0

    # Validate verses
    print(f"\n🔍 Validating {len(verses)} verses...")
    valid_verses = []
    for verse in verses:
        is_valid, error = validate_verse(verse)
        if is_valid:
            valid_verses.append(verse)
        else:
            ch = verse.get("chapter", "?")
            v = verse.get("verse", "?")
            print(f"   ⚠️  Invalid verse {ch}.{v}: {error}")

    print(f"   ✅ {len(valid_verses)} valid verses ready for seeding")

    # Seed to database
    print("\n" + "=" * 70)
    print("🌱 SEEDING VERSES TO DATABASE")
    print("=" * 70 + "\n")

    seeded_count = 0
    skipped_count = 0
    failed_count = 0

    async with Session() as session:
        for i, verse_data in enumerate(valid_verses):
            chapter = verse_data["chapter"]
            verse_num = verse_data["verse"]

            try:
                # Check if verse already exists
                result = await session.execute(
                    select(GitaVerse).where(
                        GitaVerse.chapter == chapter, GitaVerse.verse == verse_num
                    )
                )
                existing = result.scalar_one_or_none()

                if existing:
                    skipped_count += 1
                    continue

                # Transform and insert verse
                db_verse = transform_verse_for_db(verse_data)
                await session.execute(insert(GitaVerse).values(**db_verse))
                seeded_count += 1

                # Progress indicator (every 50 verses)
                if (i + 1) % 50 == 0:
                    progress = (i + 1) / len(valid_verses) * 100
                    print(f"   Progress: {i + 1}/{len(valid_verses)} ({progress:.1f}%)")

            except Exception as e:
                print(f"   ❌ Error seeding verse {chapter}.{verse_num}: {e}")
                failed_count += 1

        await session.commit()

    return seeded_count, skipped_count, failed_count


async def seed_chapter(chapter_num: int) -> tuple[int, int, int]:
    """
    Seed all verses from a single chapter using RapidAPI.

    Args:
        chapter_num: Chapter number (1-18)

    Returns:
        Tuple of (seeded_count, skipped_count, failed_count)
    """
    chapter_info = CHAPTER_INFO[chapter_num]
    total_verses = int(chapter_info["verses"])
    chapter_name = str(chapter_info["name"])
    chapter_theme = str(chapter_info["theme"])

    print(f"\n{'='*70}")
    print(f"📖 Seeding Chapter {chapter_num}: {chapter_name}")
    print(f"   Theme: {chapter_theme}")
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
                    print(f"  ⏭️  Verse {chapter_num}.{verse_num} already exists")
                    skipped_count += 1
                    continue

                # Fetch verse data from API
                verse_data = await fetch_verse_from_rapid_api(chapter_num, verse_num)

                if not verse_data:
                    print(f"  ⚠️  Could not fetch verse {chapter_num}.{verse_num}")
                    failed_count += 1
                    continue

                # Transform and insert verse
                db_verse = {
                    "chapter": chapter_num,
                    "verse": verse_num,
                    "sanskrit": verse_data.get("text") or verse_data.get("sanskrit") or "",
                    "transliteration": verse_data.get("transliteration"),
                    "english": verse_data.get("translation") or verse_data.get("english") or "",
                    "hindi": verse_data.get("hindi") or "",
                    "word_meanings": verse_data.get("word_meanings"),
                    "principle": f"Teaching from {chapter_name}",
                    "theme": chapter_theme,
                    "embedding": None,
                }
                await session.execute(insert(GitaVerse).values(**db_verse))

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

    return seeded_count, skipped_count, failed_count


async def verify_seeding() -> dict[str, Any]:
    """
    Verify that all verses were seeded correctly.

    Returns:
        Dictionary with verification results
    """
    print("\n" + "=" * 70)
    print("🔍 VERIFYING SEEDED DATA")
    print("=" * 70 + "\n")

    results = {
        "total": 0,
        "by_chapter": {},
        "coverage": "incomplete",
        "missing_chapters": [],
    }

    async with Session() as session:
        # Check each chapter
        for chapter in range(1, 19):
            expected_count = int(CHAPTER_INFO[chapter]["verses"])
            result = await session.execute(
                text(f"SELECT COUNT(*) FROM gita_verses WHERE chapter = {chapter}")
            )
            actual_count = result.scalar() or 0

            results["by_chapter"][chapter] = {
                "expected": expected_count,
                "actual": actual_count,
            }

            status = "✅" if actual_count == expected_count else "⚠️"
            if actual_count < expected_count:
                results["missing_chapters"].append(chapter)

            print(
                f"{status} Chapter {chapter:2d}: {actual_count:3d}/{expected_count:3d} verses"
            )

        # Total count
        result = await session.execute(text("SELECT COUNT(*) FROM gita_verses"))
        total = result.scalar() or 0
        results["total"] = total

        print(f"\n📊 Total verses in database: {total}/{TOTAL_EXPECTED}")

        if total == TOTAL_EXPECTED:
            results["coverage"] = "complete"
            print("✅ ALL 700 VERSES SUCCESSFULLY SEEDED! 🎉")
        elif total > 0:
            results["coverage"] = "partial"
            print(f"⚠️  Missing {TOTAL_EXPECTED - total} verses")
        else:
            results["coverage"] = "empty"
            print("❌ Database is empty")

    return results


async def get_database_stats() -> dict[str, Any]:
    """Get statistics about loaded verses."""
    async with Session() as session:
        # Total count
        result = await session.execute(text("SELECT COUNT(*) FROM gita_verses"))
        total = result.scalar()

        # By chapter
        result = await session.execute(
            text("SELECT chapter, COUNT(*) as cnt FROM gita_verses GROUP BY chapter ORDER BY chapter")
        )
        by_chapter = {row[0]: row[1] for row in result.fetchall()}

        # By theme
        result = await session.execute(
            text("SELECT theme, COUNT(*) as cnt FROM gita_verses GROUP BY theme")
        )
        by_theme = {row[0]: row[1] for row in result.fetchall()}

        # Tagged verses
        result = await session.execute(
            text("SELECT COUNT(*) FROM gita_verses WHERE mental_health_applications IS NOT NULL")
        )
        tagged = result.scalar()

        return {
            "total_verses": total,
            "by_chapter": by_chapter,
            "by_theme": by_theme,
            "tagged_verses": tagged,
            "coverage": "complete" if total == TOTAL_EXPECTED else "partial",
        }


async def main(use_api: bool = False, use_chapters: bool = False) -> int:
    """
    Main seeding function.

    Args:
        use_api: If True, use RapidAPI instead of local files
        use_chapters: If True, use chapter files instead of complete JSON

    Returns:
        Exit code (0 for success, 1 for failure)
    """
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

        # Verify database schema before seeding
        print("🔍 Verifying database schema...")
        async with engine.begin() as conn:
            # Check if transliteration column exists
            result = await conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'gita_verses'
                AND column_name = 'transliteration'
            """))
            
            if not result.fetchone():
                print("❌ Schema verification failed: missing 'transliteration' column")
                print("   Run base migration first:")
                print("   psql $DATABASE_URL < migrations/20251109_add_gita_wisdom_database.sql")
                return 1
        print("✅ Schema verification passed\n")

        total_seeded = 0
        total_skipped = 0
        total_failed = 0

        if use_api:
            # Use RapidAPI (requires API key)
            if not RAPID_API_KEY:
                print("❌ ERROR: RapidAPI key not set!")
                print("   Set RAPID_API_KEY environment variable")
                print("   Get free key: https://rapidapi.com/bhagavad-gita-bhagavad-gita-default/api/bhagavad-gita3")
                return 1

            print("🌐 Using RapidAPI Bhagavad Gita API...")
            for chapter in range(1, 19):
                seeded, skipped, failed = await seed_chapter(chapter)
                total_seeded += seeded
                total_skipped += skipped
                total_failed += failed
                await asyncio.sleep(1)  # Rate limiting between chapters
        else:
            # Use local JSON files (default)
            print("📁 Using local JSON files...")
            total_seeded, total_skipped, total_failed = await seed_from_local_json(
                use_chapter_files=use_chapters
            )

        # Print summary
        print("\n" + "=" * 70)
        print("📊 SEEDING SUMMARY")
        print("=" * 70)
        print(f"   ✅ Seeded: {total_seeded}")
        print(f"   ⏭️  Skipped: {total_skipped}")
        print(f"   ❌ Failed: {total_failed}")

        # Verify seeding
        await verify_seeding()

        # Get final stats
        stats = await get_database_stats()

        print("\n" + "=" * 70)
        if stats["coverage"] == "complete":
            print("✅ BHAGAVAD GITA DATABASE SEEDING COMPLETED!")
            print("=" * 70)
            print("\n🎉 You now have the complete Bhagavad Gita in your database!")
            print("   All 700 verses across 18 chapters are ready for AI-powered")
            print("   modern mental health applications.\n")
            print("📋 Next steps:")
            print("   1. Run: python scripts/migrate_mental_health_tags.py")
            print("   2. Run: python scripts/verify_700_verses.py --database")
            return 0
        else:
            print("⚠️  SEEDING INCOMPLETE")
            print("=" * 70)
            print(f"\n   Total verses: {stats['total_verses']}/{TOTAL_EXPECTED}")
            print("   Please check errors above and retry.\n")
            return 1

    except Exception as e:
        print(f"\n❌ CRITICAL ERROR during seeding: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Seed complete Bhagavad Gita database with 700 verses"
    )
    parser.add_argument(
        "--api",
        action="store_true",
        help="Use RapidAPI instead of local JSON files (requires RAPID_API_KEY)",
    )
    parser.add_argument(
        "--chapters",
        action="store_true",
        help="Use individual chapter files instead of complete JSON",
    )

    args = parser.parse_args()

    exit_code = asyncio.run(main(use_api=args.api, use_chapters=args.chapters))
    sys.exit(exit_code)
