"""
Seed script for content packs.

Loads content packs for different locales and populates the database.

Can be run as:
    python -m scripts.seed_content
    OR
    python scripts/seed_content.py
"""

import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models import Base, ContentPack

DATA_EN = {
    "version": 1,
    "locale": "en",
    "packs": [
        {
            "principle": "stable_center",
            "cards": [
                {
                    "title": "Anchor in Breath",
                    "copy": "Feel one full inhale and exhale. Let attention rest where breath touches the nose.",
                    "cta": "Try 5 cycles",
                    "exercise_ref": "focus_breath_60",
                },
                {
                    "title": "Name the Weather",
                    "copy": "Say: 'Anxious is here.' You’re the sky, not the cloud.",
                    "cta": "Say it softly",
                    "exercise_ref": "witness_label_45",
                },
                {
                    "title": "One Point",
                    "copy": "Choose a single point in your visual field. Hold attention there for 20 seconds.",
                    "cta": "Hold gently",
                    "exercise_ref": "single_point_20",
                },
            ],
        }
    ],
}
DATA_DE = {
    "version": 1,
    "locale": "de",
    "packs": [
        {
            "principle": "stable_center",
            "cards": [
                {
                    "title": "Anker im Atem",
                    "copy": "Spüre eine volle Ein‑ und Ausatmung. Ruhe dort, wo die Luft die Nase berührt.",
                    "cta": "5 Zyklen",
                    "exercise_ref": "focus_breath_60",
                }
            ],
        }
    ],
}
DATA_HI = {
    "version": 1,
    "locale": "hi",
    "packs": [
        {
            "principle": "stable_center",
            "cards": [
                {
                    "title": "सांस में टिकना",
                    "copy": "एक पूरा श्वास‑प्रश्वास महसूस करो। ध्यान नाक के पास ठहराओ।",
                    "cta": "5 चक्र",
                    "exercise_ref": "focus_breath_60",
                }
            ],
        }
    ],
}

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://mindvibe:password@db:5432/mindvibe"
)
engine = create_async_engine(DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)


async def main():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with Session() as s:
            for locale, data in (("en", DATA_EN), ("de", DATA_DE), ("hi", DATA_HI)):
                res = await s.execute(
                    select(ContentPack).where(ContentPack.locale == locale)
                )
                if not res.scalar_one_or_none():
                    await s.execute(
                        insert(ContentPack).values(locale=locale, data=data)
                    )
                    print(f"Inserted content pack for locale: {locale}")
                else:
                    print(
                        f"Content pack for locale '{locale}' already exists, skipping"
                    )
            await s.commit()
        print("Content seeding completed successfully!")
    except Exception as e:
        print(f"Error during content seeding: {e}")
        import traceback

        traceback.print_exc()
        raise


if __name__ == "__main__":
    asyncio.run(main())
