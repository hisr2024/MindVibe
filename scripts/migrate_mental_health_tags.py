#!/usr/bin/env python3
"""
Mental Health Tags Migration Script.

Migrates existing 10 verse tags from data/wisdom/verses.json to gita_verses table.
Maps verse IDs and copies mental_health_applications to the gita_verses table.

Usage:
    DATABASE_URL=<your-db-url> python scripts/migrate_mental_health_tags.py
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from backend.models import GitaVerse

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
}


async def migrate_mental_health_tags() -> None:
    """Migrate mental health tags from JSON file to gita_verses table."""
    # Database URL - use environment variable or default
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://navi:navi@db:5432/navi",
    )

    # Fix Render.com DATABASE_URL to use asyncpg
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://") and "asyncpg" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    print("=" * 70)
    print("🕉️  MENTAL HEALTH TAGS MIGRATION")
    print("=" * 70)
    print(f"📍 Database: {database_url[:60]}...")

    # Load verses from JSON file
    verses_json_path = Path(__file__).parent.parent / "data" / "wisdom" / "verses.json"
    print(f"📥 Loading verses from: {verses_json_path}")

    if not verses_json_path.exists():
        print(f"❌ ERROR: Verses JSON file not found at {verses_json_path}")
        return

    with open(verses_json_path) as f:
        wisdom_verses = json.load(f)

    print(f"✅ Loaded {len(wisdom_verses)} verses from JSON file")

    # Create async engine
    engine = create_async_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    updated_count = 0
    not_found_count = 0
    error_count = 0

    async with async_session() as session:
        for verse_data in wisdom_verses:
            verse_id = verse_data.get("verse_id", "")
            if not verse_id:
                continue

            # Parse chapter and verse number from verse_id (e.g., "2.47")
            try:
                parts = verse_id.split(".")
                chapter = int(parts[0])
                verse_num = int(parts[1])
            except (ValueError, IndexError):
                print(f"  ⚠️  Invalid verse_id format: {verse_id}")
                error_count += 1
                continue

            # Find matching verse in gita_verses table
            result = await session.execute(
                select(GitaVerse).where(
                    GitaVerse.chapter == chapter,
                    GitaVerse.verse == verse_num,
                )
            )
            gita_verse = result.scalar_one_or_none()

            if not gita_verse:
                print(f"  ⚠️  Verse {chapter}.{verse_num} not found in gita_verses table")
                not_found_count += 1
                continue

            # Extract mental health applications
            applications = verse_data.get("mental_health_applications", [])
            if not applications:
                continue

            # Determine primary domain from first application
            primary_app = applications[0] if applications else None
            primary_domain = DOMAIN_MAPPING.get(primary_app, primary_app)

            # Secondary domains from remaining applications
            secondary_domains = [
                DOMAIN_MAPPING.get(app, app) for app in applications[1:]
            ]

            # Update the gita_verse record
            await session.execute(
                update(GitaVerse)
                .where(GitaVerse.id == gita_verse.id)
                .values(
                    mental_health_applications=applications,
                    primary_domain=primary_domain,
                    secondary_domains=secondary_domains if secondary_domains else None,
                )
            )

            print(
                f"  ✅ Updated {chapter}.{verse_num}: "
                f"primary={primary_domain}, apps={len(applications)}"
            )
            updated_count += 1

        await session.commit()

    await engine.dispose()

    print("\n" + "=" * 70)
    print("📊 MIGRATION SUMMARY")
    print("=" * 70)
    print(f"  ✅ Updated: {updated_count} verses")
    print(f"  ⚠️  Not found: {not_found_count} verses")
    print(f"  ❌ Errors: {error_count}")
    print("=" * 70)

    if updated_count > 0:
        print("\n✅ Mental health tags migration completed successfully!")
    else:
        print("\n⚠️  No verses were updated. Ensure gita_verses table is populated.")


def main() -> None:
    """Main entry point."""
    try:
        asyncio.run(migrate_mental_health_tags())
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
