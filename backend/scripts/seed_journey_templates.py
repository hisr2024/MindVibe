"""Seed script for the six core Sad-Ripu journey templates.

Without these rows, GET /api/journey-engine/templates returns an empty list
and POST /api/journey-engine/journeys 404s with TEMPLATE_NOT_FOUND. The
mobile catalog therefore looks broken even when the backend is healthy.

Run: python -m backend.scripts.seed_journey_templates
Idempotent: safe to call repeatedly (UPSERT by slug).
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker

from backend.models import Base
from backend.models.journeys import JourneyTemplate

# IDs / slugs intentionally match the frontend FALLBACK_TEMPLATES in
# app/(mobile)/m/journeys/hooks/useMobileJourneys.ts so a journey started
# from the offline catalog still resolves once the backend is reachable.
TEMPLATES: list[dict] = [
    {
        "id": "krodha-beginner-14",
        "slug": "krodha-beginner-14",
        "title": "Cooling the Fire",
        "description": "A 14-day practice to transform anger into clarity through Gita wisdom.",
        "primary_enemy_tags": ["krodha"],
        "duration_days": 14,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "flame",
        "color_theme": "#E63946",
    },
    {
        "id": "kama-beginner-21",
        "slug": "kama-beginner-21",
        "title": "Taming Desire",
        "description": "A 21-day journey to understand and release the wanting mind.",
        "primary_enemy_tags": ["kama"],
        "duration_days": 21,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "heart",
        "color_theme": "#F77F00",
    },
    {
        "id": "lobha-beginner-14",
        "slug": "lobha-beginner-14",
        "title": "The Open Hand",
        "description": "A 14-day practice of sacred abundance and generous giving.",
        "primary_enemy_tags": ["lobha"],
        "duration_days": 14,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "hand",
        "color_theme": "#FCBF49",
    },
    {
        "id": "moha-intermediate-21",
        "slug": "moha-intermediate-21",
        "title": "Lifting the Veil",
        "description": "A 21-day journey through the fog of illusion toward clarity.",
        "primary_enemy_tags": ["moha"],
        "duration_days": 21,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "eye",
        "color_theme": "#9D4EDD",
    },
    {
        "id": "mada-beginner-14",
        "slug": "mada-beginner-14",
        "title": "The Humble Warrior",
        "description": "A 14-day practice of dissolving ego through sacred humility.",
        "primary_enemy_tags": ["mada"],
        "duration_days": 14,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "crown",
        "color_theme": "#06A77D",
    },
    {
        "id": "matsara-beginner-14",
        "slug": "matsara-beginner-14",
        "title": "Celebrating Others",
        "description": "A 14-day journey from comparison and envy toward sympathetic joy.",
        "primary_enemy_tags": ["matsarya"],
        "duration_days": 14,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "sparkles",
        "color_theme": "#1D8FE1",
    },
]


async def seed_journey_templates(existing_engine: AsyncEngine) -> None:
    """Idempotently upsert the six core journey templates by slug."""
    session_maker = async_sessionmaker(existing_engine, expire_on_commit=False)

    # Ensure tables exist (no-op when migrations already ran).
    async with existing_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_maker() as db:
        created = 0
        updated = 0
        for data in TEMPLATES:
            stmt = select(JourneyTemplate).where(
                JourneyTemplate.slug == data["slug"]
            )
            existing = (await db.execute(stmt)).scalars().first()

            if existing:
                existing.title = data["title"]
                existing.description = data["description"]
                existing.primary_enemy_tags = data["primary_enemy_tags"]
                existing.duration_days = data["duration_days"]
                existing.difficulty = data["difficulty"]
                existing.is_active = data["is_active"]
                existing.is_featured = data["is_featured"]
                existing.is_free = data["is_free"]
                existing.icon_name = data["icon_name"]
                existing.color_theme = data["color_theme"]
                updated += 1
            else:
                db.add(JourneyTemplate(**data))
                created += 1

        await db.commit()
        print(
            f"✅ Journey templates seeded: created={created}, updated={updated}"
        )


if __name__ == "__main__":
    import os
    import ssl as _ssl
    from sqlalchemy.ext.asyncio import create_async_engine

    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and "asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    connect_args: dict = {}
    if "postgresql" in db_url:
        ctx = _ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = _ssl.CERT_NONE
        connect_args = {"ssl": ctx}

    engine = create_async_engine(db_url, echo=False, connect_args=connect_args)
    try:
        asyncio.run(seed_journey_templates(engine))
    finally:
        asyncio.run(engine.dispose())
