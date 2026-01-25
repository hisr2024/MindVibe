"""
Seed Journey Templates - Ṣaḍ-Ripu (Six Inner Enemies)

This script populates the journey_templates and journey_template_steps tables
with predefined wisdom journeys for overcoming the six inner enemies.

Usage:
    python scripts/seed_journey_templates.py
"""

import asyncio
import os
import sys
import uuid

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


# =============================================================================
# JOURNEY TEMPLATES DATA
# =============================================================================

JOURNEY_TEMPLATES = [
    {
        "slug": "transform-anger-krodha",
        "title": "Transform Anger (Krodha)",
        "description": "A 14-day journey to understand, manage, and transform anger into patient strength. Learn to respond rather than react, finding peace even in challenging situations.",
        "primary_enemy_tags": ["krodha"],
        "duration_days": 14,
        "difficulty": 3,
        "is_featured": True,
        "icon_name": "flame",
        "color_theme": "red",
    },
    {
        "slug": "clarity-over-attachment-moha",
        "title": "Clarity Over Attachment (Moha)",
        "description": "A 21-day journey through the mist of delusion to clarity and discernment. Learn to see reality as it is and make decisions from wisdom rather than confusion.",
        "primary_enemy_tags": ["moha"],
        "duration_days": 21,
        "difficulty": 4,
        "is_featured": True,
        "icon_name": "cloud",
        "color_theme": "purple",
    },
    {
        "slug": "humility-over-ego-mada",
        "title": "Humility Over Ego (Mada)",
        "description": "A 14-day path to transform pride into humble confidence. Discover the strength in service and the wisdom in acknowledging our interconnectedness.",
        "primary_enemy_tags": ["mada"],
        "duration_days": 14,
        "difficulty": 3,
        "is_featured": True,
        "icon_name": "crown",
        "color_theme": "orange",
    },
    {
        "slug": "mastering-desire-kama",
        "title": "Mastering Desire (Kama)",
        "description": "A 21-day journey to understand and channel desire constructively. Learn the art of contentment and restraint without suppression.",
        "primary_enemy_tags": ["kama"],
        "duration_days": 21,
        "difficulty": 4,
        "is_featured": False,
        "icon_name": "heart",
        "color_theme": "rose",
    },
    {
        "slug": "contentment-over-greed-lobha",
        "title": "Contentment Over Greed (Lobha)",
        "description": "A 14-day exploration of true wealth and satisfaction. Discover the freedom that comes from wanting less and appreciating more.",
        "primary_enemy_tags": ["lobha"],
        "duration_days": 14,
        "difficulty": 3,
        "is_featured": False,
        "icon_name": "coins",
        "color_theme": "amber",
    },
    {
        "slug": "joy-over-envy-matsarya",
        "title": "Joy Over Envy (Matsarya)",
        "description": "A 14-day path to transform jealousy into appreciation and mudita (joy in others' success). Learn to celebrate others and find your own unique path.",
        "primary_enemy_tags": ["matsarya"],
        "duration_days": 14,
        "difficulty": 3,
        "is_featured": False,
        "icon_name": "eye",
        "color_theme": "emerald",
    },
    {
        "slug": "complete-inner-transformation",
        "title": "Complete Inner Transformation",
        "description": "A comprehensive 30-day journey addressing all six inner enemies. For those ready for deep, holistic transformation.",
        "primary_enemy_tags": ["kama", "krodha", "lobha", "moha", "mada", "matsarya"],
        "duration_days": 30,
        "difficulty": 5,
        "is_featured": True,
        "icon_name": "sparkles",
        "color_theme": "indigo",
    },
]

# Template step skeletons (first 3 days for each enemy focus)
TEMPLATE_STEPS = {
    "krodha": [
        {
            "day_index": 1,
            "step_title": "Understanding Your Anger",
            "teaching_hint": "Explore what anger truly is - its origins, triggers, and the underlying needs it represents.",
            "reflection_prompt": "When did anger last arise in you? What was the trigger beneath the trigger?",
            "practice_prompt": "The Pause Practice: When you feel anger arising, take 3 deep breaths before responding.",
            "verse_selector": {"tags": ["krodha", "anger", "patience"], "max_verses": 2},
            "static_verse_refs": [{"chapter": 2, "verse": 63}],
        },
        {
            "day_index": 2,
            "step_title": "The Chain of Destruction",
            "teaching_hint": "Study the chain: desire → anger → delusion → memory loss → discrimination loss → destruction.",
            "reflection_prompt": "Have you witnessed this chain in your own life? What was the cost?",
            "practice_prompt": "Anger Journaling: Write about a recent anger incident without judgment.",
            "verse_selector": {"tags": ["krodha", "desire", "delusion"], "max_verses": 2},
            "static_verse_refs": [{"chapter": 2, "verse": 62}, {"chapter": 2, "verse": 63}],
        },
        {
            "day_index": 3,
            "step_title": "The Gift of Patience",
            "teaching_hint": "Patience (kshama) is not weakness but strength. It's the ability to hold space for transformation.",
            "reflection_prompt": "Where in your life does patience feel most difficult? What makes it so?",
            "practice_prompt": "5-minute patience meditation: Sit and notice any urge to move. Simply observe.",
            "verse_selector": {"tags": ["patience", "peace", "equanimity"], "max_verses": 2},
        },
    ],
    "moha": [
        {
            "day_index": 1,
            "step_title": "The Nature of Delusion",
            "teaching_hint": "Moha is not seeing reality clearly - it's the fog that obscures our true nature.",
            "reflection_prompt": "What beliefs do you hold that you've never questioned?",
            "practice_prompt": "Reality Check: Write down 3 beliefs you hold. For each, ask: 'How do I know this is true?'",
            "verse_selector": {"tags": ["moha", "clarity", "wisdom", "viveka"], "max_verses": 2},
        },
        {
            "day_index": 2,
            "step_title": "Attachment and Identity",
            "teaching_hint": "We confuse who we are with what we have, what we do, and what others think of us.",
            "reflection_prompt": "If you lost your role, possessions, or reputation, who would remain?",
            "practice_prompt": "Identity Inventory: List 5 things you identify with. Imagine life without each.",
            "verse_selector": {"tags": ["attachment", "identity", "self"], "max_verses": 2},
        },
        {
            "day_index": 3,
            "step_title": "The Light of Discrimination",
            "teaching_hint": "Viveka (discrimination) is the ability to discern the real from the unreal.",
            "reflection_prompt": "What helps you see more clearly in moments of confusion?",
            "practice_prompt": "Morning clarity ritual: Start each day asking 'What is most true today?'",
            "verse_selector": {"tags": ["viveka", "wisdom", "knowledge"], "max_verses": 2},
        },
    ],
    "mada": [
        {
            "day_index": 1,
            "step_title": "The Weight of Pride",
            "teaching_hint": "Pride is a burden we carry that separates us from genuine connection and learning.",
            "reflection_prompt": "When has your pride prevented you from learning or connecting?",
            "practice_prompt": "Humility experiment: Genuinely ask for help with something today.",
            "verse_selector": {"tags": ["pride", "humility", "service"], "max_verses": 2},
        },
        {
            "day_index": 2,
            "step_title": "The Illusion of Separation",
            "teaching_hint": "Ego creates the illusion that we are separate and superior. In truth, we are interconnected.",
            "reflection_prompt": "Who have you been comparing yourself to? Why?",
            "practice_prompt": "Connection practice: Notice 5 ways you're connected to others today.",
            "verse_selector": {"tags": ["unity", "oneness", "connection"], "max_verses": 2},
        },
        {
            "day_index": 3,
            "step_title": "Strength in Service",
            "teaching_hint": "True strength is not dominance but the ability to serve and uplift others.",
            "reflection_prompt": "How might serving others enrich your life?",
            "practice_prompt": "Secret service: Do something helpful for someone without seeking recognition.",
            "verse_selector": {"tags": ["service", "karma", "selflessness"], "max_verses": 2},
        },
    ],
    "kama": [
        {
            "day_index": 1,
            "step_title": "Understanding Desire",
            "teaching_hint": "Desire itself is not the enemy - it's unconscious, compulsive desire that causes suffering.",
            "reflection_prompt": "What are the desires that feel most compelling in your life right now?",
            "practice_prompt": "Desire mapping: List your top 5 desires. What need does each represent?",
            "verse_selector": {"tags": ["kama", "desire", "senses"], "max_verses": 2},
        },
        {
            "day_index": 2,
            "step_title": "The Senses and the Self",
            "teaching_hint": "The senses are instruments - we must learn to use them wisely rather than be used by them.",
            "reflection_prompt": "Which sense dominates your experience? How does it influence your choices?",
            "practice_prompt": "Sensory fasting: Choose one sense pleasure to abstain from for 24 hours.",
            "verse_selector": {"tags": ["senses", "control", "restraint"], "max_verses": 2},
        },
        {
            "day_index": 3,
            "step_title": "The Art of Contentment",
            "teaching_hint": "Santosha (contentment) is not resignation but a deep appreciation of the present moment.",
            "reflection_prompt": "What would you need to feel truly content? Is it really about having more?",
            "practice_prompt": "Gratitude inventory: List 10 things you have that you once wished for.",
            "verse_selector": {"tags": ["contentment", "satisfaction", "peace"], "max_verses": 2},
        },
    ],
    "lobha": [
        {
            "day_index": 1,
            "step_title": "The Nature of Greed",
            "teaching_hint": "Greed is the fear of scarcity dressed as ambition. It can never be satisfied.",
            "reflection_prompt": "What are you accumulating that you don't truly need?",
            "practice_prompt": "Release practice: Give away one thing you've been holding onto unnecessarily.",
            "verse_selector": {"tags": ["lobha", "greed", "contentment"], "max_verses": 2},
        },
        {
            "day_index": 2,
            "step_title": "Enough is Enough",
            "teaching_hint": "There is a point of 'enough' - recognizing it is the beginning of freedom.",
            "reflection_prompt": "What does 'enough' look like for you in different areas of life?",
            "practice_prompt": "Enough audit: Review one area of your life and define what 'enough' means.",
            "verse_selector": {"tags": ["contentment", "satisfaction", "wealth"], "max_verses": 2},
        },
        {
            "day_index": 3,
            "step_title": "The Joy of Generosity",
            "teaching_hint": "Generosity is the antidote to greed. It opens the heart and creates abundance.",
            "reflection_prompt": "When have you experienced the joy of giving freely?",
            "practice_prompt": "Generosity practice: Give something valuable (time, resources, attention) today.",
            "verse_selector": {"tags": ["charity", "giving", "generosity"], "max_verses": 2},
        },
    ],
    "matsarya": [
        {
            "day_index": 1,
            "step_title": "The Poison of Comparison",
            "teaching_hint": "Envy compares our insides to others' outsides. It's a race we can never win.",
            "reflection_prompt": "Whose success or possessions trigger envy in you? What does that reveal?",
            "practice_prompt": "Comparison fast: Avoid social media for 24 hours. Notice how you feel.",
            "verse_selector": {"tags": ["matsarya", "envy", "contentment"], "max_verses": 2},
        },
        {
            "day_index": 2,
            "step_title": "Your Unique Path",
            "teaching_hint": "Everyone has their own dharma. Comparing paths leads us away from our own.",
            "reflection_prompt": "What is unique about your path that no one else can walk?",
            "practice_prompt": "Path reflection: Write about your unique gifts and circumstances.",
            "verse_selector": {"tags": ["dharma", "purpose", "path"], "max_verses": 2},
        },
        {
            "day_index": 3,
            "step_title": "Mudita - Joy in Others' Success",
            "teaching_hint": "Mudita is the practice of finding joy in others' happiness and success.",
            "reflection_prompt": "Can you genuinely celebrate someone's success that you previously envied?",
            "practice_prompt": "Mudita practice: Congratulate someone today on something you wish you had.",
            "verse_selector": {"tags": ["compassion", "joy", "celebration"], "max_verses": 2},
        },
    ],
    "mixed": [
        {
            "day_index": 1,
            "step_title": "The Six Gates of Suffering",
            "teaching_hint": "Introduction to the six inner enemies and how they interrelate.",
            "reflection_prompt": "Which of the six enemies feels most present in your life right now?",
            "practice_prompt": "Self-assessment: Rate each enemy's influence in your life (1-10).",
            "verse_selector": {"tags": ["wisdom", "self-knowledge"], "max_verses": 2},
        },
        {
            "day_index": 2,
            "step_title": "The Observer Within",
            "teaching_hint": "Before we can transform, we must observe. The witness consciousness is key.",
            "reflection_prompt": "Can you watch your thoughts without becoming them?",
            "practice_prompt": "10-minute observer meditation: Simply watch thoughts arise and pass.",
            "verse_selector": {"tags": ["meditation", "witness", "consciousness"], "max_verses": 2},
        },
        {
            "day_index": 3,
            "step_title": "The Power of Awareness",
            "teaching_hint": "Awareness is curative. What we can see, we can transform.",
            "reflection_prompt": "What pattern became clear to you when you observed without judgment?",
            "practice_prompt": "Awareness journal: Note when each enemy arises today without changing anything.",
            "verse_selector": {"tags": ["awareness", "knowledge", "wisdom"], "max_verses": 2},
        },
    ],
}


async def seed_journey_templates():
    """Seed journey templates and their steps."""
    engine = create_async_engine(DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        # Create templates
        for template in JOURNEY_TEMPLATES:
            template_id = str(uuid.uuid4())

            # Insert template
            await conn.execute(
                text("""
                    INSERT INTO journey_templates (
                        id, slug, title, description, primary_enemy_tags,
                        duration_days, difficulty, is_active, is_featured,
                        icon_name, color_theme, created_at, updated_at
                    )
                    VALUES (
                        :id, :slug, :title, :description, :primary_enemy_tags::jsonb,
                        :duration_days, :difficulty, true, :is_featured,
                        :icon_name, :color_theme, NOW(), NOW()
                    )
                    ON CONFLICT (slug) DO UPDATE SET
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        primary_enemy_tags = EXCLUDED.primary_enemy_tags,
                        duration_days = EXCLUDED.duration_days,
                        difficulty = EXCLUDED.difficulty,
                        is_featured = EXCLUDED.is_featured,
                        icon_name = EXCLUDED.icon_name,
                        color_theme = EXCLUDED.color_theme,
                        updated_at = NOW()
                    RETURNING id
                """),
                {
                    "id": template_id,
                    "slug": template["slug"],
                    "title": template["title"],
                    "description": template["description"],
                    "primary_enemy_tags": str(template["primary_enemy_tags"]).replace("'", '"'),
                    "duration_days": template["duration_days"],
                    "difficulty": template["difficulty"],
                    "is_featured": template["is_featured"],
                    "icon_name": template.get("icon_name"),
                    "color_theme": template.get("color_theme"),
                },
            )

            result = await conn.execute(
                text("SELECT id FROM journey_templates WHERE slug = :slug"),
                {"slug": template["slug"]},
            )
            row = result.fetchone()
            actual_template_id = row[0] if row else template_id

            print(f"Created template: {template['title']} ({actual_template_id})")

            # Get steps for this template's primary enemy
            primary_enemy = template["primary_enemy_tags"][0]
            steps = TEMPLATE_STEPS.get(primary_enemy, TEMPLATE_STEPS["mixed"])

            for step in steps:
                step_id = str(uuid.uuid4())

                await conn.execute(
                    text("""
                        INSERT INTO journey_template_steps (
                            id, journey_template_id, day_index,
                            step_title, teaching_hint, reflection_prompt, practice_prompt,
                            verse_selector, static_verse_refs, safety_notes,
                            created_at, updated_at
                        )
                        VALUES (
                            :id, :journey_template_id, :day_index,
                            :step_title, :teaching_hint, :reflection_prompt, :practice_prompt,
                            :verse_selector::jsonb, :static_verse_refs::jsonb, :safety_notes,
                            NOW(), NOW()
                        )
                        ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
                            step_title = EXCLUDED.step_title,
                            teaching_hint = EXCLUDED.teaching_hint,
                            reflection_prompt = EXCLUDED.reflection_prompt,
                            practice_prompt = EXCLUDED.practice_prompt,
                            verse_selector = EXCLUDED.verse_selector,
                            static_verse_refs = EXCLUDED.static_verse_refs,
                            updated_at = NOW()
                    """),
                    {
                        "id": step_id,
                        "journey_template_id": actual_template_id,
                        "day_index": step["day_index"],
                        "step_title": step.get("step_title"),
                        "teaching_hint": step.get("teaching_hint"),
                        "reflection_prompt": step.get("reflection_prompt"),
                        "practice_prompt": step.get("practice_prompt"),
                        "verse_selector": str(step.get("verse_selector", {})).replace("'", '"'),
                        "static_verse_refs": str(step.get("static_verse_refs")).replace("'", '"') if step.get("static_verse_refs") else None,
                        "safety_notes": step.get("safety_notes"),
                    },
                )

                print(f"  - Created step: Day {step['day_index']}")

    await engine.dispose()
    print("\nSeeding complete!")


def validate_data():
    """Validate seed data structure (dry-run mode)."""
    print("=" * 60)
    print("Validating Journey Templates Data (Dry Run)")
    print("=" * 60)

    print(f"\n[Templates] Found {len(JOURNEY_TEMPLATES)} journey templates:")
    for t in JOURNEY_TEMPLATES:
        enemies = ", ".join(t["primary_enemy_tags"])
        print(f"  - {t['title']} ({t['duration_days']} days, focus: {enemies})")

    print(f"\n[Steps] Found {len(TEMPLATE_STEPS)} enemy step sets:")
    for enemy, steps in TEMPLATE_STEPS.items():
        print(f"  - {enemy}: {len(steps)} days defined")

    # Validate structure
    errors = []
    for t in JOURNEY_TEMPLATES:
        required = ["slug", "title", "description", "primary_enemy_tags", "duration_days", "difficulty"]
        for field in required:
            if field not in t:
                errors.append(f"Template '{t.get('slug', 'unknown')}' missing field: {field}")

    for enemy, steps in TEMPLATE_STEPS.items():
        for step in steps:
            required = ["day_index", "step_title"]
            for field in required:
                if field not in step:
                    errors.append(f"Step in '{enemy}' day {step.get('day_index', '?')} missing field: {field}")

    if errors:
        print(f"\n[ERRORS] Found {len(errors)} validation errors:")
        for e in errors:
            print(f"  - {e}")
        return False
    else:
        print("\n[SUCCESS] All data structures are valid!")
        print("\nTo seed the database, run with a PostgreSQL DATABASE_URL:")
        print("  DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db python scripts/seed_journey_templates.py --seed")
        return True


if __name__ == "__main__":
    import sys

    if "--dry-run" in sys.argv or len(sys.argv) == 1:
        # Default to dry-run mode (validation only)
        success = validate_data()
        sys.exit(0 if success else 1)
    elif "--seed" in sys.argv:
        # Actual seeding requires database
        asyncio.run(seed_journey_templates())
    else:
        print("Usage:")
        print("  python scripts/seed_journey_templates.py           # Validate data (dry-run)")
        print("  python scripts/seed_journey_templates.py --dry-run # Validate data (dry-run)")
        print("  python scripts/seed_journey_templates.py --seed    # Seed database")
        sys.exit(1)
