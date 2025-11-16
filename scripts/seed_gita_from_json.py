import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.models import Base, GitaVerse

# Add parent directory to sys.path for imports
sys.path.append(str(Path(__file__).resolve().parent.parent))

# Configure DATABASE_URL from environment variable with Render.com compatibility
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://")
else:
    DATABASE_URL = "postgresql+asyncpg://navi:navi@db:5432/navi"

# Create async engine and session maker
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


async def load_verses_from_json(filepath: Path) -> Any:
    """Load verse data from JSON file."""
    try:
        with open(filepath, encoding="utf-8") as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading JSON file {filepath}: {e}")
        return []


async def seed_verses(verses_data: list) -> None:
    """Seed verses into the database."""
    seeded_count = 0
    skipped_count = 0
    failed_count = 0

    async with AsyncSessionLocal() as session:
        for verse in verses_data:
            # Check if the verse already exists
            existing_verse = await session.execute(
                select(GitaVerse).filter_by(
                    chapter=verse["chapter"], verse=verse["verse"]
                )
            )
            if existing_verse.scalars().first():
                print(f"Skipping existing verse: {verse['chapter']}:{verse['verse']}")
                skipped_count += 1
                continue

            # Insert new verse
            new_verse = GitaVerse(**verse)
            session.add(new_verse)
            seeded_count += 1

        try:
            await session.commit()
            print(
                f"Seeded {seeded_count} verses, skipped {skipped_count}, failed {failed_count}"
            )
        except Exception as e:
            print(f"Error committing session: {e}")
            await session.rollback()


async def verify_seeding() -> None:
    """Count and display verses by chapter."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(GitaVerse.chapter, func.count(GitaVerse.id)).group_by(
                GitaVerse.chapter
            )
        )
        for chapter, count in result.all():
            print(f"Chapter {chapter}: {count} verses")


async def main() -> None:
    """Main async function to seed verses."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    json_files = [
        Path("data/gita/gita_verses_starter.json"),
        Path("data/gita/gita_verses_complete.json"),
        Path("data/gita/gita_verses.json"),
    ]

    verses_data = []
    for json_file in json_files:
        if json_file.exists():
            verses_data.extend(await load_verses_from_json(json_file))

    await seed_verses(verses_data)
    await verify_seeding()


if __name__ == "__main__":
    asyncio.run(main())
