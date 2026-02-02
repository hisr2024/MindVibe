#!/usr/bin/env python3
"""
Mental Health Tags Migration Script.

Applies comprehensive mental health application tags to all 700 Gita verses.
Tags are applied based on verse chapter, content themes, and key verse mappings.

Usage:
    DATABASE_URL=<your-db-url> python scripts/migrate_mental_health_tags.py

    # Apply tags from complete JSON (default)
    python scripts/migrate_mental_health_tags.py

    # Apply comprehensive chapter-based tagging
    python scripts/migrate_mental_health_tags.py --comprehensive
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker

from backend.models import GitaVerse
from scripts.db_utils import create_ssl_engine, normalize_database_url

# Mental health categories used in the system
MENTAL_HEALTH_CATEGORIES = [
    "anxiety_management",
    "stress_reduction",
    "letting_go",
    "present_moment_focus",
    "emotional_regulation",
    "resilience",
    "mindfulness",
    "equanimity",
    "anger_management",
    "addiction_recovery",
    "impulse_control",
    "cognitive_awareness",
    "self_empowerment",
    "depression_recovery",
    "self_compassion",
    "personal_growth",
    "meditation_support",
    "purpose_and_meaning",
    "work_stress",
    "relationships",
    "forgiveness",
    "self_doubt",
]

# Primary domain mapping based on mental health applications
DOMAIN_MAPPING = {
    "anxiety_management": "anxiety",
    "stress_reduction": "stress",
    "letting_go": "attachment",
    "present_moment_focus": "mindfulness",
    "emotional_regulation": "emotional_balance",
    "resilience": "resilience",
    "mindfulness": "mindfulness",
    "equanimity": "equanimity",
    "anger_management": "anger",
    "addiction_recovery": "addiction",
    "impulse_control": "impulse",
    "cognitive_awareness": "awareness",
    "self_empowerment": "empowerment",
    "depression_recovery": "depression",
    "self_compassion": "self_compassion",
    "personal_growth": "growth",
    "meditation_support": "meditation",
    "purpose_and_meaning": "purpose",
    "work_stress": "work",
    "relationships": "relationships",
    "forgiveness": "forgiveness",
    "self_doubt": "confidence",
}

# Comprehensive mental health tag mapping for all 700 verses
# Key verses with specific applications
KEY_VERSE_TAGS: dict[tuple[int, int], list[str]] = {
    # Chapter 1 - Emotional crisis
    (1, 1): ["self_awareness", "emotional_regulation"],
    (1, 47): ["emotional_regulation", "depression_recovery", "seeking_help"],
    # Chapter 2 - Core teachings
    (2, 14): ["emotional_regulation", "resilience", "distress_tolerance"],
    (2, 47): ["anxiety_management", "stress_reduction", "letting_go", "present_moment_focus"],
    (2, 48): ["equanimity", "emotional_regulation", "stress_reduction"],
    (2, 56): ["emotional_regulation", "anger_management", "anxiety_management"],
    (2, 62): ["addiction_recovery", "impulse_control", "anger_management", "cognitive_awareness"],
    (2, 63): ["anger_management", "cognitive_awareness", "impulse_control"],
    (2, 70): ["mindfulness", "stress_reduction", "letting_go", "equanimity"],
    # Chapter 3 - Selfless action
    (3, 19): ["work_stress", "purpose_and_meaning", "letting_go"],
    (3, 35): ["self_acceptance", "self_empowerment", "self_doubt"],
    # Chapter 4 - Knowledge
    (4, 38): ["personal_growth", "cognitive_awareness", "self_empowerment"],
    # Chapter 5 - Renunciation
    (5, 21): ["stress_reduction", "letting_go", "equanimity"],
    # Chapter 6 - Meditation
    (6, 5): ["self_empowerment", "personal_growth", "depression_recovery"],
    (6, 17): ["stress_reduction", "self_care", "mindfulness"],
    (6, 35): ["anxiety_management", "mindfulness", "meditation_support"],
    # Chapter 12 - Devotion
    (12, 13): ["self_compassion", "relationships", "emotional_regulation", "forgiveness"],
    (12, 14): ["mindfulness", "self_discipline", "equanimity"],
    # Chapter 16 - Divine qualities
    (16, 1): ["personal_growth", "self_improvement"],
    (16, 2): ["anger_management", "relationships", "self_compassion"],
    (16, 3): ["resilience", "forgiveness", "personal_growth"],
    # Chapter 18 - Liberation
    (18, 45): ["purpose_and_meaning", "work_stress", "self_acceptance"],
    (18, 46): ["purpose_and_meaning", "work_stress"],
    (18, 48): ["self_acceptance", "work_stress"],
    (18, 66): ["letting_go", "anxiety_management", "depression_recovery"],
}

# Chapter-based default tags (applied to all verses in chapter)
CHAPTER_DEFAULT_TAGS: dict[int, list[str]] = {
    1: ["emotional_regulation", "self_awareness"],
    2: ["cognitive_awareness", "equanimity", "resilience"],
    3: ["stress_reduction", "purpose_and_meaning", "work_stress"],
    4: ["personal_growth", "cognitive_awareness"],
    5: ["letting_go", "stress_reduction"],
    6: ["meditation_support", "mindfulness", "anxiety_management"],
    7: ["self_awareness", "cognitive_awareness"],
    8: ["resilience", "mindfulness"],
    9: ["self_compassion", "personal_growth"],
    10: ["personal_growth", "self_awareness"],
    11: ["self_awareness", "personal_growth"],
    12: ["self_compassion", "relationships", "emotional_regulation"],
    13: ["self_awareness", "cognitive_awareness", "mindfulness"],
    14: ["emotional_regulation", "self_awareness"],
    15: ["purpose_and_meaning", "cognitive_awareness"],
    16: ["personal_growth", "self_improvement"],
    17: ["mindfulness", "personal_growth"],
    18: ["letting_go", "resilience", "depression_recovery"],
}


def get_tags_for_verse(chapter: int, verse: int) -> list[str]:
    """Get mental health tags for a specific verse."""
    # Check for specific verse tags first
    key = (chapter, verse)
    if key in KEY_VERSE_TAGS:
        return KEY_VERSE_TAGS[key]

    # Fall back to chapter defaults
    return CHAPTER_DEFAULT_TAGS.get(chapter, ["personal_growth"])


async def migrate_from_json() -> tuple[int, int, int]:
    """Migrate mental health tags from gita_verses_complete.json."""
    json_path = Path(__file__).parent.parent / "data" / "gita" / "gita_verses_complete.json"

    if not json_path.exists():
        print(f"   ⚠️  JSON file not found: {json_path}")
        return 0, 0, 0

    with open(json_path, encoding="utf-8") as f:
        verses = json.load(f)

    print(f"   ✅ Loaded {len(verses)} verses from JSON")

    # Build tag mapping from JSON
    json_tags: dict[tuple[int, int], list[str]] = {}
    for verse in verses:
        chapter = verse.get("chapter", 0)
        verse_num = verse.get("verse", 0)
        apps = verse.get("mental_health_applications", [])
        if apps:
            json_tags[(chapter, verse_num)] = apps

    return await apply_tags(json_tags)


async def migrate_comprehensive() -> tuple[int, int, int]:
    """Apply comprehensive chapter-based mental health tags to all verses."""
    print("   Applying comprehensive chapter-based tagging...")
    return await apply_tags({})  # Will use defaults


async def apply_tags(
    tag_mapping: dict[tuple[int, int], list[str]]
) -> tuple[int, int, int]:
    """
    Apply mental health tags to verses in the database.

    Args:
        tag_mapping: Optional mapping of (chapter, verse) to tags.
                    If empty, uses defaults.

    Returns:
        Tuple of (updated_count, not_found_count, error_count)
    """
    # Database URL
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://navi:navi@db:5432/navi",
    )

    # Normalize URL and create SSL-enabled engine
    database_url = normalize_database_url(database_url)
    engine = create_ssl_engine(database_url)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    updated_count = 0
    not_found_count = 0
    error_count = 0

    async with async_session() as session:
        # Get all verses from database
        result = await session.execute(select(GitaVerse))
        all_verses = list(result.scalars().all())

        print(f"   Found {len(all_verses)} verses in database")

        for gita_verse in all_verses:
            try:
                chapter = gita_verse.chapter
                verse_num = gita_verse.verse

                # Get tags from mapping or defaults
                if tag_mapping and (chapter, verse_num) in tag_mapping:
                    applications = tag_mapping[(chapter, verse_num)]
                else:
                    applications = get_tags_for_verse(chapter, verse_num)

                if not applications:
                    continue

                # Determine primary domain
                primary_app = applications[0]
                primary_domain = DOMAIN_MAPPING.get(primary_app, primary_app)

                # Secondary domains
                secondary_domains = [
                    DOMAIN_MAPPING.get(app, app) for app in applications[1:]
                ]

                # Update the verse
                await session.execute(
                    update(GitaVerse)
                    .where(GitaVerse.id == gita_verse.id)
                    .values(
                        mental_health_applications=applications,
                        primary_domain=primary_domain,
                        secondary_domains=secondary_domains if secondary_domains else None,
                    )
                )
                updated_count += 1

            except Exception as e:
                print(f"   ❌ Error updating verse {chapter}.{verse_num}: {e}")
                error_count += 1

        await session.commit()

    await engine.dispose()

    return updated_count, not_found_count, error_count


async def migrate_mental_health_tags(comprehensive: bool = False) -> None:
    """
    Main migration function.

    Args:
        comprehensive: If True, apply chapter-based defaults to all verses.
                      If False, use tags from JSON file.
    """
    # Database URL
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://navi:navi@db:5432/navi",
    )

    print("=" * 70)
    print("🕉️  MENTAL HEALTH TAGS MIGRATION")
    print("=" * 70)
    print(f"📍 Database: {database_url[:60]}...")
    print(f"   Mode: {'Comprehensive' if comprehensive else 'From JSON'}")
    print("=" * 70 + "\n")

    if comprehensive:
        updated, not_found, errors = await migrate_comprehensive()
    else:
        updated, not_found, errors = await migrate_from_json()

    print("\n" + "=" * 70)
    print("📊 MIGRATION SUMMARY")
    print("=" * 70)
    print(f"  ✅ Updated: {updated} verses")
    print(f"  ⚠️  Not found: {not_found} verses")
    print(f"  ❌ Errors: {errors}")
    print("=" * 70)

    if updated > 0:
        print("\n✅ Mental health tags migration completed successfully!")
        print(f"   {updated} verses now have mental health application tags.")
    else:
        print("\n⚠️  No verses were updated.")
        print("   Ensure gita_verses table is populated with verses first.")
        print("   Run: python scripts/seed_complete_gita.py")


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Migrate mental health tags to Gita verses"
    )
    parser.add_argument(
        "--comprehensive",
        action="store_true",
        help="Apply comprehensive chapter-based tags to all 700 verses",
    )

    args = parser.parse_args()

    try:
        asyncio.run(migrate_mental_health_tags(comprehensive=args.comprehensive))
    except KeyboardInterrupt:
        print("\nMigration interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"Migration failed with error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
