#!/usr/bin/env python3
"""
Verify all 700 Bhagavad Gita verses are loaded correctly.

This script validates the completeness and integrity of the Gita verse database,
ensuring all 700 verses across 18 chapters are properly loaded with required fields.

Usage:
    # Verify from JSON file
    python scripts/verify_700_verses.py --json

    # Verify from database
    DATABASE_URL=<your-db-url> python scripts/verify_700_verses.py --database

    # Verify both
    DATABASE_URL=<your-db-url> python scripts/verify_700_verses.py --all
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Expected verse counts per chapter (total: 700)
EXPECTED_COUNTS = {
    1: 47,
    2: 72,
    3: 43,
    4: 42,
    5: 29,
    6: 47,
    7: 30,
    8: 28,
    9: 34,
    10: 42,
    11: 55,
    12: 20,
    13: 34,
    14: 27,
    15: 20,
    16: 24,
    17: 28,
    18: 78,
}

TOTAL_EXPECTED = 700

# Key verses that must be present with proper content
KEY_VERSES = [
    (2, 47),  # Karmanye Vadhikaraste - most famous verse
    (2, 48),  # Equanimity/Samatvam
    (2, 56),  # Sthitaprajna - steady wisdom
    (6, 5),   # Self-empowerment
    (6, 35),  # Mind control through practice
    (12, 13), # Compassion verse
    (18, 66), # Surrender verse
]

# Required fields for each verse
REQUIRED_FIELDS = ["chapter", "verse", "sanskrit", "hindi", "english", "theme"]


def verify_json_file() -> tuple[bool, list[str]]:
    """Verify the complete JSON file has all 700 verses."""
    errors = []
    warnings = []

    json_path = Path(__file__).parent.parent / "data" / "gita" / "gita_verses_complete.json"

    print("\n" + "=" * 70)
    print("📂 VERIFYING JSON FILE")
    print(f"   Path: {json_path}")
    print("=" * 70 + "\n")

    if not json_path.exists():
        errors.append(f"JSON file not found: {json_path}")
        return False, errors

    try:
        with open(json_path, encoding="utf-8") as f:
            verses = json.load(f)
    except json.JSONDecodeError as e:
        errors.append(f"Invalid JSON: {e}")
        return False, errors

    # Check total count
    total = len(verses)
    if total != TOTAL_EXPECTED:
        errors.append(f"Expected {TOTAL_EXPECTED} verses, found {total}")

    print(f"📊 Total verses: {total}/{TOTAL_EXPECTED}")

    # Check each chapter
    print("\n📖 Checking verse counts per chapter:")
    chapter_counts: dict[int, int] = {}
    for verse in verses:
        chapter = verse.get("chapter", 0)
        chapter_counts[chapter] = chapter_counts.get(chapter, 0) + 1

    all_chapters_ok = True
    for chapter in range(1, 19):
        expected = EXPECTED_COUNTS[chapter]
        actual = chapter_counts.get(chapter, 0)
        status = "✅" if actual == expected else "❌"
        if actual != expected:
            all_chapters_ok = False
            errors.append(f"Chapter {chapter}: expected {expected}, found {actual}")
        print(f"   {status} Chapter {chapter:2d}: {actual:3d}/{expected:3d} verses")

    # Check required fields
    print("\n🔍 Checking required fields:")
    missing_fields_count = 0
    for verse in verses:
        for field in REQUIRED_FIELDS:
            if field not in verse or not verse[field]:
                missing_fields_count += 1
                if len(errors) < 10:  # Limit error messages
                    ch = verse.get("chapter", "?")
                    v = verse.get("verse", "?")
                    errors.append(f"Verse {ch}.{v} missing field: {field}")

    if missing_fields_count == 0:
        print("   ✅ All required fields present")
    else:
        print(f"   ❌ {missing_fields_count} missing fields")

    # Check key verses
    print("\n🔑 Checking key verses:")
    verses_by_ref = {(v["chapter"], v["verse"]): v for v in verses}

    for chapter, verse_num in KEY_VERSES:
        key = (chapter, verse_num)
        if key not in verses_by_ref:
            errors.append(f"Missing key verse: {chapter}.{verse_num}")
            print(f"   ❌ {chapter}.{verse_num} - MISSING")
        else:
            verse = verses_by_ref[key]
            english = verse.get("english", "")
            if len(english) < 20:
                warnings.append(f"Key verse {chapter}.{verse_num} has minimal content")
                print(f"   ⚠️  {chapter}.{verse_num} - Present but minimal content")
            else:
                print(f"   ✅ {chapter}.{verse_num} - Present")

    # Check mental health tags
    print("\n🏥 Checking mental health applications:")
    tagged_count = sum(
        1 for v in verses if v.get("mental_health_applications") and len(v.get("mental_health_applications", [])) > 0
    )
    tag_percentage = (tagged_count / total) * 100 if total > 0 else 0
    status = "✅" if tagged_count > 500 else "⚠️"
    print(f"   {status} Verses with mental health tags: {tagged_count}/{total} ({tag_percentage:.1f}%)")
    if tagged_count < 500:
        warnings.append(f"Only {tagged_count} verses have mental health tags (< 500)")

    # Summary
    print("\n" + "=" * 70)
    if not errors:
        print("✅ JSON VERIFICATION PASSED!")
    else:
        print(f"❌ JSON VERIFICATION FAILED - {len(errors)} error(s)")
        for error in errors[:5]:
            print(f"   • {error}")
        if len(errors) > 5:
            print(f"   ... and {len(errors) - 5} more errors")

    if warnings:
        print(f"\n⚠️  {len(warnings)} warning(s):")
        for warning in warnings[:5]:
            print(f"   • {warning}")

    print("=" * 70)

    return len(errors) == 0, errors


async def verify_database() -> tuple[bool, list[str]]:
    """Verify all 700 verses are in the database."""
    errors = []
    warnings = []

    print("\n" + "=" * 66)
    print("🕉️  DATABASE VERIFICATION - 700 BHAGAVAD GITA VERSES")
    print("=" * 66 + "\n")

    # Database configuration
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        errors.append("DATABASE_URL environment variable not set")
        print("❌ DATABASE_URL environment variable not set")
        print("=" * 66)
        return False, errors

    # Fix Render.com DATABASE_URL to use asyncpg
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://") and "asyncpg" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    print(f"Database: {database_url.split('@')[1] if '@' in database_url else database_url[:50]}...\n")

    try:
        from sqlalchemy import select, text
        from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

        from backend.models import GitaVerse

        engine = create_async_engine(database_url, echo=False)
        Session = async_sessionmaker(engine, expire_on_commit=False)

        async with Session() as session:
            # Check total count
            result = await session.execute(select(text("COUNT(*)")).select_from(GitaVerse))
            total = result.scalar()

            status = "✅" if total == TOTAL_EXPECTED else "❌"
            print(f"Total verses in database: {total}/{TOTAL_EXPECTED} {status}\n")

            if total != TOTAL_EXPECTED:
                if total == 0:
                    errors.append(f"Database is empty - no verses found")
                else:
                    errors.append(f"Expected {TOTAL_EXPECTED} verses, found {total}")

            # Check each chapter
            print("Chapter breakdown:")
            result = await session.execute(
                text("SELECT chapter, COUNT(*) as cnt FROM gita_verses GROUP BY chapter ORDER BY chapter")
            )
            chapter_data = result.fetchall()
            chapter_counts = {row[0]: row[1] for row in chapter_data}

            for chapter in range(1, 19):
                expected = EXPECTED_COUNTS[chapter]
                actual = chapter_counts.get(chapter, 0)
                status = "✅" if actual == expected else "❌"
                if actual != expected:
                    errors.append(f"Chapter {chapter}: expected {expected}, found {actual}")
                print(f"  Chapter {chapter:2d}: {actual:2d}/{expected:2d} {status}")

            # Check key verses
            print("\n🔑 Checking key verses:")
            for chapter, verse_num in KEY_VERSES:
                result = await session.execute(
                    select(GitaVerse).where(
                        GitaVerse.chapter == chapter, GitaVerse.verse == verse_num
                    )
                )
                verse = result.scalar_one_or_none()

                if verse is None:
                    errors.append(f"Missing key verse: {chapter}.{verse_num}")
                    print(f"   ❌ {chapter}.{verse_num} - MISSING")
                elif not verse.english or len(verse.english) < 20:
                    warnings.append(f"Key verse {chapter}.{verse_num} has minimal content")
                    print(f"   ⚠️  {chapter}.{verse_num} - Present but minimal content")
                else:
                    print(f"   ✅ {chapter}.{verse_num} - Present")

            # Check mental health tags
            print("\nMental health tagging:")
            result = await session.execute(
                text("SELECT COUNT(*) FROM gita_verses WHERE mental_health_applications IS NOT NULL")
            )
            tagged_count = result.scalar() or 0
            tag_percentage = (tagged_count / total) * 100 if total > 0 else 0
            status = "✅" if tagged_count >= total * 0.7 else "⚠️"
            print(f"  {tagged_count}/{total} {status}")
            if tagged_count < total * 0.7:
                warnings.append(f"Only {tagged_count} verses have mental health tags ({tag_percentage:.1f}%)")

            # Check embeddings
            print("\nEmbeddings generated:")
            result = await session.execute(
                text("SELECT COUNT(*) FROM gita_verses WHERE embedding IS NOT NULL")
            )
            embedding_count = result.scalar() or 0
            status = "✅" if embedding_count >= total * 0.9 else "⚠️"
            print(f"  {embedding_count}/{total} {status}")

        await engine.dispose()

    except ImportError as e:
        errors.append(f"Import error: {e}")
        print(f"\n❌ Import error: {e}")
        print("=" * 66)
        return False, errors
    except Exception as e:
        errors.append(f"Database error: {e}")
        print(f"\n❌ Database error: {e}")
        print("=" * 66)
        return False, errors

    # Summary
    print("\n" + "=" * 66)
    if not errors:
        print("🎉 SUCCESS! Database contains all 700 authentic Gita verses")
    else:
        print(f"❌ VERIFICATION FAILED - {len(errors)} error(s)")
        for error in errors[:5]:
            print(f"   • {error}")

    if warnings:
        print(f"\n⚠️  {len(warnings)} warning(s):")
        for warning in warnings[:5]:
            print(f"   • {warning}")

    print("=" * 66)

    return len(errors) == 0, errors


def verify_chapter_files() -> tuple[bool, list[str]]:
    """Verify individual chapter JSON files."""
    errors = []

    chapters_dir = Path(__file__).parent.parent / "data" / "gita" / "chapters"

    print("\n" + "=" * 70)
    print("📁 VERIFYING CHAPTER FILES")
    print(f"   Path: {chapters_dir}")
    print("=" * 70 + "\n")

    if not chapters_dir.exists():
        errors.append(f"Chapters directory not found: {chapters_dir}")
        return False, errors

    total_from_chapters = 0

    for chapter in range(1, 19):
        expected = EXPECTED_COUNTS[chapter]
        chapter_file = chapters_dir / f"chapter_{chapter:02d}.json"

        if not chapter_file.exists():
            errors.append(f"Missing chapter file: chapter_{chapter:02d}.json")
            print(f"   ❌ Chapter {chapter:2d}: FILE NOT FOUND")
            continue

        try:
            with open(chapter_file, encoding="utf-8") as f:
                verses = json.load(f)
            actual = len(verses)
            total_from_chapters += actual
            status = "✅" if actual == expected else "❌"
            if actual != expected:
                errors.append(f"Chapter {chapter} file: expected {expected}, found {actual}")
            print(f"   {status} Chapter {chapter:2d}: {actual:3d}/{expected:3d} verses")
        except json.JSONDecodeError as e:
            errors.append(f"Invalid JSON in chapter_{chapter:02d}.json: {e}")
            print(f"   ❌ Chapter {chapter:2d}: INVALID JSON")

    print(f"\n   📊 Total from chapter files: {total_from_chapters}/{TOTAL_EXPECTED}")

    # Summary
    print("\n" + "=" * 70)
    if not errors:
        print("✅ CHAPTER FILES VERIFICATION PASSED!")
    else:
        print(f"❌ CHAPTER FILES VERIFICATION FAILED - {len(errors)} error(s)")
        for error in errors[:5]:
            print(f"   • {error}")

    print("=" * 70)

    return len(errors) == 0, errors


async def main() -> int:
    """Main entry point for verification."""
    parser = argparse.ArgumentParser(description="Verify 700 Bhagavad Gita verses")
    parser.add_argument("--json", action="store_true", help="Verify JSON file only")
    parser.add_argument("--database", action="store_true", help="Verify database only")
    parser.add_argument("--chapters", action="store_true", help="Verify chapter files only")
    parser.add_argument("--all", action="store_true", help="Verify everything")

    args = parser.parse_args()

    # If no specific option, default to JSON verification
    if not any([args.json, args.database, args.chapters, args.all]):
        args.json = True

    print("\n" + "=" * 70)
    print("🕉️  BHAGAVAD GITA 700 VERSES VERIFICATION")
    print("=" * 70)

    all_passed = True
    all_errors = []

    if args.json or args.all:
        passed, errors = verify_json_file()
        all_passed = all_passed and passed
        all_errors.extend(errors)

    if args.chapters or args.all:
        passed, errors = verify_chapter_files()
        all_passed = all_passed and passed
        all_errors.extend(errors)

    if args.database or args.all:
        passed, errors = await verify_database()
        all_passed = all_passed and passed
        all_errors.extend(errors)

    # Final summary
    print("\n" + "=" * 70)
    print("📋 FINAL SUMMARY")
    print("=" * 70)

    if all_passed:
        print("✅ ALL VERIFICATIONS PASSED!")
        print("   All 700 verses are present and correctly formatted.")
        return 0
    else:
        print(f"❌ VERIFICATION FAILED - {len(all_errors)} total error(s)")
        print("\n   Key issues to address:")
        for error in all_errors[:10]:
            print(f"   • {error}")
        if len(all_errors) > 10:
            print(f"   ... and {len(all_errors) - 10} more errors")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\nVerification interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nVerification failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
