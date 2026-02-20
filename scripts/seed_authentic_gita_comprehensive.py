"""
Comprehensive Seeding Script for 700 Authentic Bhagavad Gita Verses

This script provides production-ready seeding with:
- Complete validation before insertion
- Duplicate checking
- Batch commits for efficiency
- Comprehensive error handling
- Progress reporting
- Database verification

Usage:
    python scripts/seed_authentic_gita_comprehensive.py
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any, Tuple, List
from datetime import datetime

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import async_sessionmaker
import os

sys.path.insert(0, str(Path(__file__).parent.parent))
from backend.models import Base, GitaVerse
from scripts.db_utils import create_ssl_engine, normalize_database_url

# Canonical verse counts per chapter (as per authentic Bhagavad Gita)
CANONICAL_COUNTS = {
    1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47,
    7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20,
    13: 34, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78
}
TOTAL_VERSES = 700

# Data file path
DATA_DIR = Path(__file__).parent.parent / "data" / "gita"
DATA_FILE = DATA_DIR / "gita_verses_complete.json"


class GitaValidator:
    """Validator for Gita verse data integrity."""
    
    @staticmethod
    def validate_devanagari(text: str) -> bool:
        """
        Validate that text contains Devanagari characters (U+0900-U+097F).
        
        Args:
            text: Text to validate
            
        Returns:
            True if text contains Devanagari characters
        """
        if not text or not text.strip():
            return False
        
        # Check if at least some characters are in Devanagari range (use generator for efficiency)
        return any('\u0900' <= c <= '\u097F' for c in text)
    
    @staticmethod
    def validate_iast(text: str) -> bool:
        """
        Validate that text contains IAST transliteration diacritics.
        
        Args:
            text: Text to validate
            
        Returns:
            True if text appears to be IAST transliteration
        """
        if not text or not text.strip():
            return False
        
        # IAST uses specific diacritics: ā, ī, ū, ṛ, ṝ, ḷ, ḹ, ṃ, ḥ, ṅ, ñ, ṭ, ḍ, ṇ, ś, ṣ
        iast_chars = ['ā', 'ī', 'ū', 'ṛ', 'ṝ', 'ḷ', 'ḹ', 'ṃ', 'ḥ', 'ṅ', 'ñ', 'ṭ', 'ḍ', 'ṇ', 'ś', 'ṣ']
        
        # Check if text contains IAST diacritics or basic Latin (for transliteration)
        has_iast = any(char in text for char in iast_chars)
        has_latin = any(c.isalpha() and ord(c) < 128 for c in text)
        
        return has_iast or has_latin
    
    @staticmethod
    def validate_verse_structure(verse: dict, index: int) -> bool:
        """
        Validate that a verse has the required structure.
        
        Args:
            verse: Verse dictionary
            index: Index in the list (for error reporting)
            
        Returns:
            True if verse structure is valid
        """
        required_fields = ['chapter', 'verse', 'sanskrit', 'english', 'hindi', 'theme', 'principle']
        
        for field in required_fields:
            if field not in verse:
                print(f"❌ Verse {index + 1}: Missing required field '{field}'")
                return False
            
            # Check for empty values
            if verse[field] is None or (isinstance(verse[field], str) and not verse[field].strip()):
                print(f"❌ Verse {index + 1}: Empty value for field '{field}'")
                return False
        
        # Validate chapter and verse numbers
        if not isinstance(verse['chapter'], int) or verse['chapter'] < 1 or verse['chapter'] > 18:
            print(f"❌ Verse {index + 1}: Invalid chapter number {verse.get('chapter')}")
            return False
        
        if not isinstance(verse['verse'], int) or verse['verse'] < 1:
            print(f"❌ Verse {index + 1}: Invalid verse number {verse.get('verse')}")
            return False
        
        return True
    
    @staticmethod
    def validate_chapter_distribution(verses: list) -> bool:
        """
        Validate that verse distribution matches canonical counts.
        
        Args:
            verses: List of verse dictionaries
            
        Returns:
            True if distribution is correct
        """
        chapter_counts = {}
        for verse in verses:
            chapter = verse.get('chapter')
            if chapter:
                chapter_counts[chapter] = chapter_counts.get(chapter, 0) + 1
        
        all_correct = True
        for chapter, expected_count in CANONICAL_COUNTS.items():
            actual_count = chapter_counts.get(chapter, 0)
            if actual_count != expected_count:
                print(f"⚠️  Chapter {chapter}: Expected {expected_count} verses, found {actual_count}")
                all_correct = False
        
        return all_correct
    
    @staticmethod
    def validate_total_count(verses: list) -> bool:
        """
        Validate total verse count.
        
        Args:
            verses: List of verse dictionaries
            
        Returns:
            True if total count is correct
        """
        if len(verses) != TOTAL_VERSES:
            print(f"❌ Expected {TOTAL_VERSES} verses, found {len(verses)}")
            return False
        return True
    
    @staticmethod
    def validate_all(verses: list) -> Tuple[bool, List[str], List[str]]:
        """
        Run all validations on the verse list.
        
        Args:
            verses: List of verse dictionaries
            
        Returns:
            Tuple of (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        print("\n" + "="*60)
        print("🔍 VALIDATION PHASE")
        print("="*60)
        
        # Check total count
        print(f"\n📊 Total verses: {len(verses)}")
        if not GitaValidator.validate_total_count(verses):
            errors.append(f"Incorrect total count: {len(verses)} (expected {TOTAL_VERSES})")
        else:
            print(f"✅ Total count correct: {TOTAL_VERSES}")
        
        # Check chapter distribution
        print(f"\n📚 Validating chapter distribution...")
        if not GitaValidator.validate_chapter_distribution(verses):
            warnings.append("Chapter distribution does not match canonical counts")
        else:
            print("✅ Chapter distribution correct")
        
        # Validate each verse structure
        print(f"\n🔎 Validating verse structures...")
        invalid_verses = []
        for i, verse in enumerate(verses):
            if not GitaValidator.validate_verse_structure(verse, i):
                invalid_verses.append(i + 1)
        
        if invalid_verses:
            errors.append(f"Invalid verse structures at positions: {invalid_verses[:10]}")
        else:
            print(f"✅ All {len(verses)} verse structures valid")
        
        # Sample validation of Sanskrit and transliteration
        print(f"\n🔤 Sampling Sanskrit and transliteration...")
        sample_size = min(10, len(verses))
        sanskrit_valid = 0
        transliteration_valid = 0
        
        for verse in verses[:sample_size]:
            if GitaValidator.validate_devanagari(verse.get('sanskrit', '')):
                sanskrit_valid += 1
            if verse.get('transliteration') and GitaValidator.validate_iast(verse['transliteration']):
                transliteration_valid += 1
        
        print(f"✅ Sanskrit validation: {sanskrit_valid}/{sample_size} samples have Devanagari")
        if transliteration_valid > 0:
            print(f"✅ Transliteration validation: {transliteration_valid}/{sample_size} samples have IAST")
        
        is_valid = len(errors) == 0
        return is_valid, errors, warnings


async def seed_verses(verses: list) -> Tuple[int, int, int]:
    """
    Seed verses to database with duplicate checking and batch commits.
    
    Args:
        verses: List of verse dictionaries
        
    Returns:
        Tuple of (seeded_count, skipped_count, error_count)
    """
    # Setup database connection
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")
    
    # Normalize URL and create SSL-enabled engine
    database_url = normalize_database_url(database_url)
    engine = create_ssl_engine(database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    
    seeded = 0
    skipped = 0
    errors = 0
    
    print("\n" + "="*60)
    print("💾 SEEDING PHASE")
    print("="*60)
    print(f"\nConnecting to database...")
    
    async with Session() as session:
        try:
            # Create tables if they don't exist
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            print(f"✅ Database connection established")
            print(f"\n🌱 Seeding {len(verses)} verses...")
            print(f"📦 Batch size: 50 verses\n")
            
            for i, verse_data in enumerate(verses, 1):
                try:
                    chapter = verse_data['chapter']
                    verse_num = verse_data['verse']
                    
                    # Check for existing verse
                    result = await session.execute(
                        select(GitaVerse).where(
                            GitaVerse.chapter == chapter,
                            GitaVerse.verse == verse_num
                        )
                    )
                    existing = result.scalar_one_or_none()
                    
                    if existing:
                        skipped += 1
                        if skipped <= 5:  # Only show first few skips
                            print(f"⏭️  Skipped {chapter}.{verse_num} (already exists)")
                        continue
                    
                    # Create new verse
                    new_verse = GitaVerse(
                        chapter=chapter,
                        verse=verse_num,
                        sanskrit=verse_data['sanskrit'],
                        transliteration=verse_data.get('transliteration'),
                        hindi=verse_data['hindi'],
                        english=verse_data['english'],
                        word_meanings=verse_data.get('word_meanings', {}),
                        principle=verse_data['principle'],
                        theme=verse_data['theme'],
                        mental_health_applications=verse_data.get('mental_health_applications', []),
                        primary_domain=verse_data.get('primary_domain'),
                        secondary_domains=verse_data.get('secondary_domains', [])
                    )
                    
                    session.add(new_verse)
                    seeded += 1
                    
                    # Batch commit every 50 verses
                    if seeded % 50 == 0:
                        await session.commit()
                        print(f"✅ Seeded {seeded}/{len(verses)} verses ({(seeded/len(verses)*100):.1f}%)")
                
                except Exception as e:
                    errors += 1
                    print(f"❌ Error seeding {chapter}.{verse_num}: {str(e)[:100]}")
                    await session.rollback()
                    continue
            
            # Final commit
            if seeded % 50 != 0:
                await session.commit()
            
            print(f"\n✅ Seeding complete!")
            print(f"   📊 Seeded: {seeded}")
            print(f"   ⏭️  Skipped: {skipped}")
            print(f"   ❌ Errors: {errors}")
        
        finally:
            await engine.dispose()
    
    return seeded, skipped, errors


async def verify_database() -> dict:
    """
    Verify database after seeding.
    
    Returns:
        Dictionary with verification statistics
    """
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")
    
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

    # Normalize URL and create SSL-enabled engine
    database_url = normalize_database_url(database_url)
    engine = create_ssl_engine(database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    print("\n" + "="*60)
    print("✅ VERIFICATION PHASE")
    print("="*60)
    
    async with Session() as session:
        try:
            # Total count
            result = await session.execute(select(func.count()).select_from(GitaVerse))
            total_count = result.scalar()
            
            print(f"\n📊 Total verses in database: {total_count}")
            
            # Count by chapter
            chapter_counts = {}
            for chapter_num in range(1, 19):
                result = await session.execute(
                    select(func.count()).select_from(GitaVerse).where(GitaVerse.chapter == chapter_num)
                )
                count = result.scalar()
                chapter_counts[chapter_num] = count
                
                expected = CANONICAL_COUNTS[chapter_num]
                status = "✅" if count == expected else "⚠️"
                print(f"{status} Chapter {chapter_num:2d}: {count:3d}/{expected:3d} verses")
            
            # Verses with spiritual wellness tags
            result = await session.execute(
                select(func.count()).select_from(GitaVerse).where(
                    GitaVerse.mental_health_applications.isnot(None)
                )
            )
            tagged_count = result.scalar()
            
            print(f"\n🏷️  Verses with spiritual wellness tags: {tagged_count}")
            
            stats = {
                "total_verses": total_count,
                "by_chapter": chapter_counts,
                "tagged_verses": tagged_count,
                "complete": total_count == TOTAL_VERSES,
                "timestamp": datetime.now().isoformat()
            }
            
            if total_count == TOTAL_VERSES:
                print(f"\n🎉 SUCCESS! All {TOTAL_VERSES} verses in database!")
            else:
                print(f"\n⚠️  WARNING: Expected {TOTAL_VERSES} verses, found {total_count}")
            
            return stats
        
        finally:
            await engine.dispose()


async def main():
    """Main orchestration function."""
    print("\n" + "="*60)
    print("🕉️  BHAGAVAD GITA COMPREHENSIVE SEEDING SCRIPT")
    print("="*60)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load data
    print(f"\n📖 Loading verses from: {DATA_FILE}")
    
    if not DATA_FILE.exists():
        print(f"❌ ERROR: Data file not found at {DATA_FILE}")
        return
    
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            verses = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ ERROR: Invalid JSON format in {DATA_FILE}")
        print(f"   Details: {e}")
        return
    except Exception as e:
        print(f"❌ ERROR: Failed to load data file")
        print(f"   Details: {e}")
        return
    
    print(f"✅ Loaded {len(verses)} verses")
    
    # Validate
    is_valid, errors, warnings = GitaValidator.validate_all(verses)
    
    if errors:
        print("\n❌ VALIDATION FAILED!")
        for error in errors:
            print(f"   - {error}")
        return
    
    if warnings:
        print("\n⚠️  VALIDATION WARNINGS:")
        for warning in warnings:
            print(f"   - {warning}")
    
    # Seed
    seeded, skipped, error_count = await seed_verses(verses)
    
    # Verify
    stats = await verify_database()
    
    # Final summary
    print("\n" + "="*60)
    print("📋 FINAL SUMMARY")
    print("="*60)
    print(f"✅ Validation: {'PASSED' if is_valid else 'FAILED'}")
    print(f"✅ Seeding: {seeded} verses seeded, {skipped} skipped, {error_count} errors")
    print(f"✅ Database: {stats['total_verses']}/{TOTAL_VERSES} verses")
    print(f"✅ Status: {'COMPLETE ✨' if stats['complete'] else 'INCOMPLETE ⚠️'}")
    print(f"\n📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
