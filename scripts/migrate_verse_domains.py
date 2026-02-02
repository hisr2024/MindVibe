#!/usr/bin/env python3
"""
Migration script to tag all WisdomVerse records with psychological domains.

This script:
1. Loads all WisdomVerse records from the database
2. Uses DomainMapper to tag each verse with relevant psychological domains
3. Updates the database with domain tags
"""

import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from backend.models import WisdomVerse
from backend.services.domain_mapper import DomainMapper
from scripts.db_utils import create_ssl_engine, normalize_database_url


async def migrate_verse_domains() -> None:
    """Migrate all verses to add domain tags."""
    # Database URL - use environment variable or default
    database_url = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./mindvibe.db",
    )

    # Normalize URL and create SSL-enabled engine
    database_url = normalize_database_url(database_url)
    engine = create_ssl_engine(database_url, echo=True)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("Starting domain migration for WisdomVerse records...")
    print(f"Database URL: {database_url}")

    domain_mapper = DomainMapper()
    updated_count = 0
    error_count = 0

    async with async_session() as session:
        # Get all wisdom verses
        result = await session.execute(select(WisdomVerse))
        verses = result.scalars().all()

        total_verses = len(verses)
        print(f"Found {total_verses} wisdom verses to process")

        for i, verse in enumerate(verses, 1):
            try:
                # Tag the verse with domains
                domain_tags = domain_mapper.tag_verse_with_domains(
                    verse_theme=verse.theme,
                    verse_context=verse.context,
                    verse_english=verse.english,
                )

                # Update verse with domain information
                verse.primary_domain = domain_tags["primary_domain"]
                verse.secondary_domains = domain_tags["secondary_domains"]

                print(
                    f"[{i}/{total_verses}] Verse {verse.verse_id}: "
                    f"Primary={domain_tags['primary_domain']}, "
                    f"Secondary={domain_tags['secondary_domains']}"
                )

                updated_count += 1

            except Exception as e:
                print(f"ERROR processing verse {verse.verse_id}: {e}")
                error_count += 1
                continue

        # Commit all changes
        await session.commit()
        print(f"\nMigration complete!")
        print(f"Successfully updated: {updated_count} verses")
        print(f"Errors: {error_count}")

        # Show domain distribution statistics
        print("\n" + "=" * 60)
        print("Domain Distribution Statistics:")
        print("=" * 60)

        verses_with_domains = [
            {
                "all_domains": [verse.primary_domain]
                + (verse.secondary_domains or [])
            }
            for verse in verses
        ]

        stats = domain_mapper.get_domain_distribution_stats(verses_with_domains)

        for domain_key, count in sorted(stats.items(), key=lambda x: x[1], reverse=True):
            domain_info = domain_mapper.get_domain_by_key(domain_key)
            domain_name = domain_info["name"] if domain_info else domain_key
            percentage = (count / total_verses * 100) if total_verses > 0 else 0
            print(f"{domain_name:45s} : {count:4d} verses ({percentage:5.1f}%)")

    await engine.dispose()


def main() -> None:
    """Main entry point."""
    try:
        asyncio.run(migrate_verse_domains())
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
