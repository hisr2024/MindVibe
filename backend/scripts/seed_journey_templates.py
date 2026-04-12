"""Seed script for the six core Sad-Ripu journey templates.

Without these rows, GET /api/journey-engine/templates returns an empty list
and POST /api/journey-engine/journeys 404s with TEMPLATE_NOT_FOUND. The
mobile catalog therefore looks broken even when the backend is healthy.

Run: python -m backend.scripts.seed_journey_templates
Idempotent: safe to call repeatedly (UPSERT by slug).
"""

from __future__ import annotations

import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from backend.models import Base
from backend.models.journeys import JourneyTemplate, JourneyTemplateStep

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


# ---------------------------------------------------------------------------
# Step content helpers (CE-1) — adapted from scripts/seed_journey_templates.py
# ---------------------------------------------------------------------------


def _get_journey_phase(day: int, total_days: int) -> str:
    """Return the journey phase name based on how far through the journey we are."""
    progress = day / total_days
    if progress <= 0.2:
        return "awakening"
    elif progress <= 0.4:
        return "understanding"
    elif progress <= 0.6:
        return "practice"
    elif progress <= 0.8:
        return "integration"
    else:
        return "mastery"


_ENEMY_STEP_CONTENT: dict[str, dict] = {
    "kama": {
        "titles": {
            "awakening": "Recognizing Desire's Pull",
            "understanding": "The Root of Craving",
            "practice": "Cultivating Contentment",
            "integration": "Freedom from Attachment",
            "mastery": "Living in Sufficiency",
        },
        "teachings": {
            "awakening": "Today we recognize how desire arises in the mind without judgment.",
            "understanding": "Explore what underlying needs your desires are trying to fulfill.",
            "practice": "Practice pausing between desire and action, creating space for wisdom.",
            "integration": "Notice how contentment feels different from satisfaction of desire.",
            "mastery": "Embody the teaching that true happiness comes from within, not from objects.",
        },
        "reflection": "What desires arose today? What would remain if they were fulfilled?",
        "practice": "When desire arises, take 3 breaths and ask: 'Is this a true need or a passing want?'",
        "verse_tags": ["desire", "craving", "detachment", "contentment"],
        "day1_verse": {"chapter": 3, "verse": 37},
    },
    "krodha": {
        "titles": {
            "awakening": "The Fire Within",
            "understanding": "Anger's Hidden Message",
            "practice": "The Pause Before Response",
            "integration": "Transforming Fire to Light",
            "mastery": "Equanimity in Action",
        },
        "teachings": {
            "awakening": "Today we observe anger as energy, without suppressing or acting on it.",
            "understanding": "Explore what underlying hurt or fear triggers your anger responses.",
            "practice": "Practice the sacred pause \u2014 the space between stimulus and response.",
            "integration": "Learn to express boundaries firmly but without the fire of anger.",
            "mastery": "Embody equanimity \u2014 responding wisely to all situations with clarity.",
        },
        "reflection": "When did anger arise today? What was it trying to protect?",
        "practice": "When anger arises, ground through your feet and take 5 slow breaths before speaking.",
        "verse_tags": ["anger", "peace", "patience", "equanimity"],
        "day1_verse": {"chapter": 2, "verse": 63},
        "safety_note": "If experiencing intense anger, practice grounding before reflection.",
        "safety_days": 3,
    },
    "lobha": {
        "titles": {
            "awakening": "The Hunger for More",
            "understanding": "Why Enough is Never Enough",
            "practice": "The Art of Appreciation",
            "integration": "Giving as Liberation",
            "mastery": "Abundance in Simplicity",
        },
        "teachings": {
            "awakening": "Today we observe the mind's tendency to accumulate and hold.",
            "understanding": "Explore what insecurity or fear drives the need for more.",
            "practice": "Practice gratitude for what you have before seeking what you don't.",
            "integration": "Experience the joy of giving without expectation of return.",
            "mastery": "Embody the truth that richness comes from appreciation, not accumulation.",
        },
        "reflection": "What felt like 'not enough' today? What would truly satisfy you?",
        "practice": "List 10 things you're grateful for. Give something away today without keeping score.",
        "verse_tags": ["greed", "contentment", "generosity", "giving"],
        "day1_verse": {"chapter": 14, "verse": 17},
    },
    "moha": {
        "titles": {
            "awakening": "The Fog of Confusion",
            "understanding": "What We Mistake for Truth",
            "practice": "Cultivating Discernment",
            "integration": "Seeing Clearly",
            "mastery": "Wisdom in Action",
        },
        "teachings": {
            "awakening": "Today we recognize where attachment clouds our perception.",
            "understanding": "Explore what beliefs you hold that may not serve your highest good.",
            "practice": "Practice viveka \u2014 distinguishing the real from the unreal, the eternal from the temporary.",
            "integration": "Learn to see situations clearly, free from the lens of personal desire.",
            "mastery": "Embody wisdom that sees beyond surface appearances to underlying truth.",
        },
        "reflection": "Where did confusion arise today? What clarity might you be avoiding?",
        "practice": "Before making a decision, ask: 'Am I seeing this clearly, or through the lens of attachment?'",
        "verse_tags": ["delusion", "clarity", "wisdom", "discernment"],
        "day1_verse": {"chapter": 2, "verse": 52},
        "safety_note": "This work can bring up challenging emotions. Be gentle with yourself.",
        "safety_phase": "integration",
    },
    "mada": {
        "titles": {
            "awakening": "The Shield of Pride",
            "understanding": "What Ego Protects",
            "practice": "The Strength in Humility",
            "integration": "Service as Medicine",
            "mastery": "Confident Surrender",
        },
        "teachings": {
            "awakening": "Today we observe how ego defends its sense of superiority or specialness.",
            "understanding": "Explore what vulnerability ego is protecting you from feeling.",
            "practice": "Practice asking for help and admitting 'I don't know' without shame.",
            "integration": "Discover that serving others dissolves the isolation of self-centeredness.",
            "mastery": "Embody the paradox: true confidence comes from surrender, not assertion.",
        },
        "reflection": "Where did ego show up today? What would happen if you let go of being right?",
        "practice": "Today, ask for help with something. Notice the discomfort and stay with it.",
        "verse_tags": ["pride", "ego", "humility", "surrender"],
        "day1_verse": {"chapter": 16, "verse": 4},
    },
    "matsarya": {
        "titles": {
            "awakening": "The Pain of Comparison",
            "understanding": "What Envy Reveals",
            "practice": "Mudita \u2014 Sympathetic Joy",
            "integration": "Celebrating Others",
            "mastery": "One in All",
        },
        "teachings": {
            "awakening": "Today we recognize envy as information about our own unfulfilled desires.",
            "understanding": "Explore what you truly want that you see in others' success.",
            "practice": "Practice mudita \u2014 genuinely celebrating others' joy and success.",
            "integration": "Learn that another's gain doesn't diminish your own possibilities.",
            "mastery": "Embody the understanding that we are all connected; their success is our success.",
        },
        "reflection": "Whose success triggered discomfort today? What does this teach you about your own desires?",
        "practice": "When you feel envy, say: 'Their success shows what's possible. May they flourish.'",
        "verse_tags": ["envy", "jealousy", "joy", "compassion"],
        "day1_verse": {"chapter": 12, "verse": 13},
    },
}


def _build_template_steps(
    template_id: str, enemy_tag: str, duration_days: int
) -> list[dict]:
    """Generate step dicts for every day of a template."""
    content = _ENEMY_STEP_CONTENT[enemy_tag]
    steps: list[dict] = []
    for day in range(1, duration_days + 1):
        phase = _get_journey_phase(day, duration_days)

        safety_notes = None
        if "safety_days" in content and day <= content["safety_days"]:
            safety_notes = content.get("safety_note")
        elif "safety_phase" in content and phase == content["safety_phase"]:
            safety_notes = content.get("safety_note")

        steps.append(
            {
                "journey_template_id": template_id,
                "day_index": day,
                "step_title": f"Day {day}: {content['titles'].get(phase, 'Walking the Path')}",
                "teaching_hint": content["teachings"].get(phase, "Continue your contemplation."),
                "reflection_prompt": content["reflection"],
                "practice_prompt": content["practice"],
                "verse_selector": {
                    "tags": content["verse_tags"],
                    "max_verses": 2,
                    "avoid_recent": 10,
                },
                "static_verse_refs": [content["day1_verse"]] if day == 1 else None,
                "safety_notes": safety_notes,
            }
        )
    return steps


async def seed_journey_template_steps(db: AsyncSession) -> int:
    """Idempotently upsert day-by-day step skeletons for each seeded template."""
    stmt = select(JourneyTemplate).where(JourneyTemplate.deleted_at.is_(None))
    templates = (await db.execute(stmt)).scalars().all()

    count = 0
    for template in templates:
        tags = template.primary_enemy_tags or []
        if not tags:
            continue
        enemy_tag = tags[0]
        if enemy_tag not in _ENEMY_STEP_CONTENT:
            print(f"⚠️  No step content for enemy '{enemy_tag}', skipping {template.slug}")
            continue

        steps_data = _build_template_steps(template.id, enemy_tag, template.duration_days)
        for step_data in steps_data:
            existing_step = (
                await db.execute(
                    select(JourneyTemplateStep).where(
                        JourneyTemplateStep.journey_template_id == template.id,
                        JourneyTemplateStep.day_index == step_data["day_index"],
                        JourneyTemplateStep.deleted_at.is_(None),
                    )
                )
            ).scalars().first()

            if existing_step:
                existing_step.step_title = step_data["step_title"]
                existing_step.teaching_hint = step_data["teaching_hint"]
                existing_step.reflection_prompt = step_data["reflection_prompt"]
                existing_step.practice_prompt = step_data["practice_prompt"]
                existing_step.verse_selector = step_data["verse_selector"]
                existing_step.static_verse_refs = step_data["static_verse_refs"]
                existing_step.safety_notes = step_data["safety_notes"]
            else:
                db.add(JourneyTemplateStep(id=str(uuid.uuid4()), **step_data))

            count += 1

    await db.commit()
    return count


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

    # Seed step content (CE-1)
    async with session_maker() as db:
        step_count = await seed_journey_template_steps(db)
        print(f"✅ Journey template steps seeded: {step_count} rows")


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
