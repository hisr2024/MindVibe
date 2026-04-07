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


# =============================================================================
# PER-DAY STEP CONTENT
# =============================================================================
#
# For each of the six live templates we author: a canonical verse-ref per day
# (drawn from the Gita chapters relevant to that enemy), a teaching snippet,
# a reflection question, a concrete practice prompt, and a real-life scenario
# keyed to the enemy's modern contexts. The lists are exactly `duration_days`
# long. Days beyond the list (or fewer) are filled from the last arc phase.
#
# This content replaces the generic "Continue your journey with mindfulness"
# placeholder that was surfacing because `seed_journey_template_steps` was
# referenced but never defined, leaving `journey_template_steps` empty.

# Canonical verse rotation per enemy — all exist in the seeded GitaVerse table.
VERSE_ROTATION: dict[str, list[dict[str, int]]] = {
    "krodha": [
        {"chapter": 2, "verse": 62},
        {"chapter": 2, "verse": 63},
        {"chapter": 5, "verse": 23},
        {"chapter": 16, "verse": 21},
        {"chapter": 2, "verse": 56},
    ],
    "kama": [
        {"chapter": 3, "verse": 37},
        {"chapter": 2, "verse": 62},
        {"chapter": 2, "verse": 70},
        {"chapter": 3, "verse": 39},
        {"chapter": 5, "verse": 22},
    ],
    "lobha": [
        {"chapter": 14, "verse": 17},
        {"chapter": 16, "verse": 21},
        {"chapter": 2, "verse": 70},
        {"chapter": 3, "verse": 21},
        {"chapter": 12, "verse": 13},
    ],
    "moha": [
        {"chapter": 2, "verse": 52},
        {"chapter": 2, "verse": 13},
        {"chapter": 4, "verse": 38},
        {"chapter": 7, "verse": 13},
        {"chapter": 18, "verse": 73},
    ],
    "mada": [
        {"chapter": 16, "verse": 4},
        {"chapter": 13, "verse": 7},
        {"chapter": 16, "verse": 13},
        {"chapter": 12, "verse": 13},
        {"chapter": 9, "verse": 29},
    ],
    "matsarya": [
        {"chapter": 12, "verse": 13},
        {"chapter": 16, "verse": 19},
        {"chapter": 6, "verse": 32},
        {"chapter": 5, "verse": 18},
        {"chapter": 12, "verse": 15},
    ],
}

# Modern real-life scenarios per enemy. Picked by (day_index - 1) % len.
MODERN_EXAMPLES: dict[str, list[str]] = {
    "krodha": [
        "Someone cuts you off in traffic and your chest tightens before you even name the feeling — anger has taken the wheel.",
        "A colleague takes credit for your work in a meeting. Notice the heat rising in your face and the urge to retaliate.",
        "A family member repeats the same criticism they've made for years. Watch how old anger comes back without fresh cause.",
        "A stranger posts something online that feels personally attacking. Observe the pull toward the keyboard.",
        "A loved one forgets something important to you. Notice the wound underneath the anger.",
    ],
    "kama": [
        "You reach for your phone without remembering picking it up. Desire has moved your hand faster than awareness.",
        "A new product ad catches your eye and within seconds you're imagining owning it. Watch the story desire tells.",
        "Food, drink, or entertainment becomes the first response to any small discomfort. Notice the pattern.",
        "You promised yourself a break from something, and then find yourself rationalizing one exception.",
        "Attention to someone drifts into fantasy. See the mind build a world that does not exist.",
    ],
    "lobha": [
        "You see someone's salary or house and instantly feel smaller, even though nothing in your life has changed.",
        "You buy something you already have enough of, just to feel the brief lift of acquisition.",
        "You calculate what you'd keep if a deal went your way, and the number is never quite enough.",
        "You hold back from giving — time, money, praise — because some part of you says 'not yet, you need it more.'",
        "Scrolling a shopping app at night, you tell yourself you're 'just looking.' Notice the grip of wanting.",
    ],
    "moha": [
        "You keep returning to a relationship that repeatedly hurts you, because the story you've built is louder than the facts.",
        "You defend a belief so strongly you stop hearing the other person. Attachment has dressed itself as identity.",
        "You feel lost in a life decision, and the fog isn't lack of information — it's attachment to a specific outcome.",
        "You mistake the role you play (parent, professional, helper) for who you actually are.",
        "Someone gives you clear feedback and you spend hours explaining why it doesn't apply to you.",
    ],
    "mada": [
        "You catch yourself correcting someone just to demonstrate that you knew better.",
        "You receive praise and your posture changes. Watch how quickly the self inflates.",
        "You dismiss advice from someone you consider 'beneath' you, and miss what you most needed to hear.",
        "A younger colleague outperforms you and something in you wants them to fail — just a little.",
        "You keep a grievance alive because letting it go would mean admitting you were ordinary.",
    ],
    "matsarya": [
        "A friend shares good news and your first feeling isn't joy — it's a small, quiet subtraction.",
        "You scroll past someone's vacation photos and feel your own life dim.",
        "A peer gets the recognition you wanted. Watch how quickly the mind finds reasons they don't deserve it.",
        "A sibling is praised in front of you. Notice the old, small ache that never really healed.",
        "Someone you once competed with succeeds. Can you let their win be clean?",
    ],
}

# Six-phase arc (awakening → completion). Each phase has a short title,
# teaching stem, reflection stem, and practice stem. Per-day content is
# composed by joining the phase stems with enemy-specific antidote language.
ARC_PHASES = [
    {
        "name": "Awakening",
        "title": "Recognizing the pattern",
        "teaching": (
            "Today we simply notice how {english} arises in the body and mind. "
            "The Gita teaches that we cannot transform what we refuse to see. "
            "Observation without judgement is itself the first step of freedom."
        ),
        "reflection": "Where did {english} show up today, even in a small form?",
        "practice": (
            "When {english} arises, pause and take three slow breaths. "
            "Name what you feel — 'this is {english}' — and notice where it lives in the body."
        ),
    },
    {
        "name": "Understanding",
        "title": "Tracing the root",
        "teaching": (
            "The Gita points to a chain: attention → attachment → desire → "
            "{english}. Today we trace one instance back to its root and see "
            "that this enemy always rides in on something we were already holding."
        ),
        "reflection": "What were you holding onto just before {english} arose?",
        "practice": (
            "Pick one moment of {english} from yesterday. Write one sentence "
            "describing the trigger, one describing the thought, and one "
            "describing what you were afraid to lose."
        ),
    },
    {
        "name": "Practice",
        "title": "Applying the antidote",
        "teaching": (
            "The Gita names the antidote to {english} as {antidote}. "
            "Today we do not merely think about it — we enact it in one small, "
            "deliberate action. Wisdom becomes real only through practice."
        ),
        "reflection": "What would {antidote} actually look like in your day today?",
        "practice": (
            "Choose one situation where {english} usually arises and respond "
            "instead with {antidote}. Start with the smallest version that still counts."
        ),
    },
    {
        "name": "Integration",
        "title": "Holding it through setbacks",
        "teaching": (
            "You will slip today. The Gita reassures us that no sincere effort "
            "is ever wasted. Integration means returning to the practice every "
            "time {english} pulls you away — without self-punishment."
        ),
        "reflection": "When you slipped today, how did you treat yourself afterward?",
        "practice": (
            "When you notice you've been swept away by {english}, pause for "
            "one breath and silently say: 'Beginning again.' Then return to {antidote}."
        ),
    },
    {
        "name": "Mastery",
        "title": "Stability under pressure",
        "teaching": (
            "Mastery is not the absence of {english}. It is the widening gap "
            "between its arising and your response. The Gita calls this "
            "sthita-prajna — wisdom that is unmoved by the storm."
        ),
        "reflection": "Where today did you feel the gap widen, even by a second?",
        "practice": (
            "Deliberately place yourself near a mild trigger of {english} today. "
            "Practice {antidote} from steadiness, not from avoidance."
        ),
    },
    {
        "name": "Completion",
        "title": "Carrying it forward",
        "teaching": (
            "This journey closes, but the inner work continues. The Gita teaches "
            "that what we practice, we become. Today we name what has shifted "
            "and what we choose to carry forward."
        ),
        "reflection": "What has changed in how you relate to {english}?",
        "practice": (
            "Write a short letter to your future self describing the version "
            "of you that has befriended {english} through {antidote}."
        ),
    },
]

# Per-enemy display names and antidote phrasing used by the arc stems.
ENEMY_CONTENT: dict[str, dict[str, str]] = {
    "krodha": {
        "english": "anger",
        "antidote": "patience (kshama) and compassion (karuna)",
        "step_title_prefix": "Cooling the Fire",
    },
    "kama": {
        "english": "desire",
        "antidote": "contentment (santosha) and discernment (viveka)",
        "step_title_prefix": "Taming Desire",
    },
    "lobha": {
        "english": "greed",
        "antidote": "generosity (dana) and non-grasping (aparigraha)",
        "step_title_prefix": "The Open Hand",
    },
    "moha": {
        "english": "delusion",
        "antidote": "clear seeing (viveka) and wisdom (jnana)",
        "step_title_prefix": "Lifting the Veil",
    },
    "mada": {
        "english": "pride",
        "antidote": "humility (namrata) and service (seva)",
        "step_title_prefix": "The Humble Warrior",
    },
    "matsarya": {
        "english": "envy",
        "antidote": "sympathetic joy (mudita) and friendliness (maitri)",
        "step_title_prefix": "Celebrating Others",
    },
}


def _phase_for_day(day_index: int, total_days: int) -> dict:
    """Pick the six-phase arc bucket for this day."""
    # 6 phases spread across total_days. Use floor division to assign.
    phase_index = min(
        len(ARC_PHASES) - 1,
        (day_index - 1) * len(ARC_PHASES) // max(total_days, 1),
    )
    return ARC_PHASES[phase_index]


def _build_step_for_day(
    template_id: str,
    enemy_tag: str,
    day_index: int,
    total_days: int,
) -> dict:
    """Build a single JourneyTemplateStep row dict for (template, day)."""
    content = ENEMY_CONTENT[enemy_tag]
    phase = _phase_for_day(day_index, total_days)
    verses = VERSE_ROTATION[enemy_tag]
    verse_ref = verses[(day_index - 1) % len(verses)]
    examples = MODERN_EXAMPLES[enemy_tag]
    modern = examples[(day_index - 1) % len(examples)]

    fmt = {"english": content["english"], "antidote": content["antidote"]}

    return {
        "id": f"jts-{template_id}-{day_index:02d}",
        "journey_template_id": template_id,
        "day_index": day_index,
        "step_title": (
            f"Day {day_index}: {phase['title']} — {content['step_title_prefix']}"
        ),
        "teaching_hint": phase["teaching"].format(**fmt)
        + f" Real life: {modern}",
        "reflection_prompt": phase["reflection"].format(**fmt),
        "practice_prompt": phase["practice"].format(**fmt),
        "verse_selector": {
            "tags": [enemy_tag, phase["name"].lower()],
            "max_verses": 2,
        },
        "static_verse_refs": [verse_ref],
        "safety_notes": None,
    }


async def seed_journey_template_steps(db: AsyncSession) -> int:
    """
    Populate `journey_template_steps` for every live template.

    Idempotent: uses (journey_template_id, day_index) as the natural key and
    upserts. Safe to run on every startup. Returns the number of rows touched.
    """
    # Fetch every template seeded above so we know `duration_days` + enemy tag.
    result = await db.execute(select(JourneyTemplate))
    templates = result.scalars().all()

    touched = 0
    for template in templates:
        enemy_tags = template.primary_enemy_tags or []
        enemy_tag = (enemy_tags[0] if enemy_tags else "").lower()
        if enemy_tag not in ENEMY_CONTENT:
            continue  # unknown enemy — skip rather than seed placeholders

        for day_index in range(1, template.duration_days + 1):
            row = _build_step_for_day(
                template_id=template.id,
                enemy_tag=enemy_tag,
                day_index=day_index,
                total_days=template.duration_days,
            )

            # Upsert by (journey_template_id, day_index) unique constraint.
            existing_q = select(JourneyTemplateStep).where(
                JourneyTemplateStep.journey_template_id == template.id,
                JourneyTemplateStep.day_index == day_index,
            )
            existing = (await db.execute(existing_q)).scalars().first()

            if existing:
                existing.step_title = row["step_title"]
                existing.teaching_hint = row["teaching_hint"]
                existing.reflection_prompt = row["reflection_prompt"]
                existing.practice_prompt = row["practice_prompt"]
                existing.verse_selector = row["verse_selector"]
                existing.static_verse_refs = row["static_verse_refs"]
                existing.safety_notes = row["safety_notes"]
            else:
                db.add(JourneyTemplateStep(**row))
            touched += 1

    await db.commit()
    return touched


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
