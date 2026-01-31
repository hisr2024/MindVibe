"""
Seed Journey Templates Script

Seeds the database with journey templates for the six inner enemies (Sad-Ripu).
Run this script after database migrations to populate the journey catalog.
"""

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from backend.models import JourneyTemplate, JourneyTemplateStep


# Journey template data
JOURNEY_TEMPLATES = [
    {
        "slug": "transform-anger-krodha",
        "title": "Transform Anger (Krodha)",
        "description": "A 14-day journey to understand, manage, and transform anger into patient strength. Learn techniques from the Bhagavad Gita to maintain equanimity in challenging situations.",
        "primary_enemy_tags": ["krodha"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "flame",
        "color_theme": "red",
        "steps": [
            {"day_index": 1, "step_title": "Understanding Anger", "teaching_hint": "Explore the nature of anger as described in BG 2.62-63", "reflection_prompt": "When was the last time anger controlled you?", "practice_prompt": "Notice when anger arises today without acting on it"},
            {"day_index": 2, "step_title": "The Chain Reaction", "teaching_hint": "Study how desire leads to anger (BG 2.62-63)", "reflection_prompt": "What desires often trigger your anger?", "practice_prompt": "Pause for 3 breaths before responding to frustration"},
            {"day_index": 3, "step_title": "Equanimity Practice", "teaching_hint": "Learn about sama (equanimity) from BG 2.48", "reflection_prompt": "What would your life look like with less anger?", "practice_prompt": "Practice staying calm in one mildly frustrating situation"},
            {"day_index": 4, "step_title": "The Observer Within", "teaching_hint": "Cultivate the witness consciousness (BG 2.55-58)", "reflection_prompt": "Can you observe your anger without becoming it?", "practice_prompt": "When anger arises, say 'I notice anger' instead of 'I am angry'"},
            {"day_index": 5, "step_title": "Patience as Strength", "teaching_hint": "Discover patience as a divine quality (BG 16.1-3)", "reflection_prompt": "How might patience change your relationships?", "practice_prompt": "Choose one situation to practice patience today"},
            {"day_index": 6, "step_title": "Compassion for Self", "teaching_hint": "Self-compassion in the Gita (BG 6.5-6)", "reflection_prompt": "Are you harder on yourself than others?", "practice_prompt": "Speak to yourself as you would to a dear friend"},
            {"day_index": 7, "step_title": "Week One Reflection", "teaching_hint": "Integrate the first week's learnings", "reflection_prompt": "What has shifted in your relationship with anger?", "practice_prompt": "Review your journal entries from this week"},
            {"day_index": 8, "step_title": "Triggers and Patterns", "teaching_hint": "Identify your anger triggers (BG 3.36-37)", "reflection_prompt": "What patterns do you notice in what makes you angry?", "practice_prompt": "Keep a trigger journal today"},
            {"day_index": 9, "step_title": "The Cooling Breath", "teaching_hint": "Pranayama for calming (related to BG 4.29)", "reflection_prompt": "How does your breath change when you're angry?", "practice_prompt": "Practice cooling breath (sitali) for 5 minutes"},
            {"day_index": 10, "step_title": "Responding vs Reacting", "teaching_hint": "Thoughtful action vs impulsive reaction (BG 3.7)", "reflection_prompt": "What does responding instead of reacting look like for you?", "practice_prompt": "Delay your response to something irritating by 24 hours"},
            {"day_index": 11, "step_title": "Forgiveness Practice", "teaching_hint": "Letting go of resentment (BG 11.44)", "reflection_prompt": "Who do you need to forgive?", "practice_prompt": "Write a forgiveness letter (you don't need to send it)"},
            {"day_index": 12, "step_title": "Transforming Energy", "teaching_hint": "Using anger's energy constructively (BG 3.33)", "reflection_prompt": "How might you channel anger into positive action?", "practice_prompt": "Exercise or do physical activity when anger arises"},
            {"day_index": 13, "step_title": "The Steady Mind", "teaching_hint": "Cultivating sthitaprajna (BG 2.54-58)", "reflection_prompt": "What does mental steadiness feel like?", "practice_prompt": "Practice maintaining calm through a challenging conversation"},
            {"day_index": 14, "step_title": "Integration and Continuation", "teaching_hint": "Carrying forward your transformation", "reflection_prompt": "What practices will you continue?", "practice_prompt": "Create a personal anger management plan"},
        ]
    },
    {
        "slug": "mastering-desire-kama",
        "title": "Mastering Desire (Kama)",
        "description": "A 21-day journey to understand and channel desire constructively. Learn the art of non-attachment while remaining engaged in life through Gita wisdom.",
        "primary_enemy_tags": ["kama"],
        "duration_days": 21,
        "difficulty": 4,
        "is_active": True,
        "is_featured": True,
        "is_free": False,
        "icon_name": "heart",
        "color_theme": "pink",
        "steps": [
            {"day_index": i, "step_title": f"Day {i}: Desire Exploration", "teaching_hint": "Exploring desire through Gita wisdom", "reflection_prompt": "What desires drive your actions today?", "practice_prompt": "Observe your desires without judgment"}
            for i in range(1, 22)
        ]
    },
    {
        "slug": "contentment-over-greed-lobha",
        "title": "Contentment Over Greed (Lobha)",
        "description": "A 14-day exploration of true wealth and satisfaction. Discover the freedom that comes from contentment and learn to find abundance in simplicity.",
        "primary_enemy_tags": ["lobha"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": False,
        "icon_name": "coins",
        "color_theme": "yellow",
        "steps": [
            {"day_index": i, "step_title": f"Day {i}: Finding Contentment", "teaching_hint": "Contentment teachings from the Gita", "reflection_prompt": "What do you truly need vs what do you merely want?", "practice_prompt": "Practice gratitude for what you already have"}
            for i in range(1, 15)
        ]
    },
    {
        "slug": "clarity-over-attachment-moha",
        "title": "Clarity Over Attachment (Moha)",
        "description": "A 21-day journey through the mist of delusion to clarity and discernment. Learn to see reality clearly and make wise decisions free from clouded judgment.",
        "primary_enemy_tags": ["moha"],
        "duration_days": 21,
        "difficulty": 4,
        "is_active": True,
        "is_featured": True,
        "is_free": False,
        "icon_name": "cloud",
        "color_theme": "purple",
        "steps": [
            {"day_index": i, "step_title": f"Day {i}: Clearing Delusion", "teaching_hint": "Understanding attachment and delusion", "reflection_prompt": "What attachments cloud your vision?", "practice_prompt": "Practice seeing situations from multiple perspectives"}
            for i in range(1, 22)
        ]
    },
    {
        "slug": "humility-over-ego-mada",
        "title": "Humility Over Ego (Mada)",
        "description": "A 14-day path to transform pride into humble confidence. Discover the strength in service and the freedom that comes from releasing the need for recognition.",
        "primary_enemy_tags": ["mada"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": False,
        "icon_name": "crown",
        "color_theme": "amber",
        "steps": [
            {"day_index": i, "step_title": f"Day {i}: Practicing Humility", "teaching_hint": "Humility teachings from the Gita", "reflection_prompt": "Where does ego create conflict in your life?", "practice_prompt": "Practice serving others without seeking recognition"}
            for i in range(1, 15)
        ]
    },
    {
        "slug": "joy-over-envy-matsarya",
        "title": "Joy Over Envy (Matsarya)",
        "description": "A 14-day path to transform jealousy into appreciation and mudita (joy in others' success). Learn to celebrate others and find peace in shared happiness.",
        "primary_enemy_tags": ["matsarya"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": False,
        "icon_name": "eye",
        "color_theme": "green",
        "steps": [
            {"day_index": i, "step_title": f"Day {i}: Cultivating Joy", "teaching_hint": "Finding joy in others' success", "reflection_prompt": "Who's success triggers envy in you?", "practice_prompt": "Genuinely celebrate someone else's achievement today"}
            for i in range(1, 15)
        ]
    },
    {
        "slug": "complete-inner-transformation",
        "title": "Complete Inner Transformation",
        "description": "A comprehensive 30-day journey addressing all six inner enemies. For those ready for deep, holistic transformation guided by the complete wisdom of the Bhagavad Gita.",
        "primary_enemy_tags": ["kama", "krodha", "lobha", "moha", "mada", "matsarya"],
        "duration_days": 30,
        "difficulty": 5,
        "is_active": True,
        "is_featured": True,
        "is_free": False,
        "icon_name": "lotus",
        "color_theme": "gradient",
        "steps": [
            {"day_index": i, "step_title": f"Day {i}: Holistic Transformation", "teaching_hint": "Comprehensive Gita wisdom", "reflection_prompt": "What inner enemy is most active today?", "practice_prompt": "Apply today's teaching to your strongest inner challenge"}
            for i in range(1, 31)
        ]
    },
]


async def seed_journey_templates(database_url: str) -> dict:
    """
    Seed journey templates into the database.

    Args:
        database_url: PostgreSQL connection string

    Returns:
        dict with seeding results
    """
    # Convert database URL to async format
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    results = {
        "created": [],
        "skipped": [],
        "errors": []
    }

    async with async_session() as session:
        for template_data in JOURNEY_TEMPLATES:
            try:
                # Check if template already exists
                existing = await session.execute(
                    select(JourneyTemplate).where(
                        JourneyTemplate.slug == template_data["slug"]
                    )
                )
                if existing.scalar_one_or_none():
                    results["skipped"].append(template_data["slug"])
                    continue

                # Create template
                steps_data = template_data.pop("steps")
                template = JourneyTemplate(
                    id=str(uuid.uuid4()),
                    **template_data,
                    created_at=datetime.now(timezone.utc)
                )
                session.add(template)
                await session.flush()  # Get the template ID

                # Create steps
                for step_data in steps_data:
                    step = JourneyTemplateStep(
                        id=str(uuid.uuid4()),
                        journey_template_id=template.id,
                        **step_data,
                        created_at=datetime.now(timezone.utc)
                    )
                    session.add(step)

                await session.commit()
                results["created"].append(template_data.get("slug", template.slug))

            except Exception as e:
                results["errors"].append({
                    "slug": template_data.get("slug", "unknown"),
                    "error": str(e)
                })
                await session.rollback()

    await engine.dispose()
    return results


async def main():
    """Main entry point for the seed script."""
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://navi:navi@db:5432/navi"
    )

    print("Seeding journey templates...")
    results = await seed_journey_templates(database_url)

    print(f"\nResults:")
    print(f"  Created: {len(results['created'])} templates")
    for slug in results['created']:
        print(f"    + {slug}")

    print(f"  Skipped: {len(results['skipped'])} templates (already exist)")
    for slug in results['skipped']:
        print(f"    - {slug}")

    if results['errors']:
        print(f"  Errors: {len(results['errors'])}")
        for error in results['errors']:
            print(f"    ! {error['slug']}: {error['error']}")

    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
