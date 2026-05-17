#!/usr/bin/env python3
"""
Seed Journey Templates - Populate database with journey templates.

This script provides two modes:
1. AI Generation: Uses OpenAI to generate templates with token budgets
2. Static Seeding: Uses predefined template data for quick seeding

Usage:
    # AI-generated templates (requires OPENAI_API_KEY)
    python scripts/seed_journey_templates.py --mode ai

    # Static predefined templates
    python scripts/seed_journey_templates.py --mode static

    # Generate specific enemy
    python scripts/seed_journey_templates.py --mode ai --enemy krodha

    # Dry run (preview without saving)
    python scripts/seed_journey_templates.py --mode static --dry-run

Token Budget Guidelines:
    - Template metadata: ~300 tokens
    - Step content: ~400 tokens per step
    - 14-day journey: ~6000 tokens total
    - Combined 42-day: ~20000 tokens
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from contextlib import asynccontextmanager

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import SessionLocal


@asynccontextmanager
async def get_db_session():
    """Context manager for database sessions in scripts."""
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


from backend.models import JourneyTemplate, JourneyTemplateStep
from backend.services.journey_engine.template_generator import (
    JourneyTemplateGenerator,
    TemplateGenerationConfig,
    EnemyType,
    ENEMY_METADATA,
    PREDEFINED_TEMPLATES,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# =============================================================================
# STATIC TEMPLATE DATA
# =============================================================================


def get_static_templates() -> list[dict]:
    """
    Get comprehensive static template definitions.

    These templates have detailed step content for quick seeding
    without requiring AI generation.
    """
    templates = []

    # =========================================================================
    # KAMA (Desire) Templates
    # =========================================================================
    templates.append({
        "slug": "master-desires-14d",
        "title": "Master Your Desires - Finding True Contentment",
        "description": "A 14-day journey to understand and transform unhealthy desires "
                      "through the wisdom of the Bhagavad Gita. Learn to find lasting "
                      "contentment beyond fleeting pleasures.",
        "primary_enemy_tags": ["kama"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "flame",
        "color_theme": "#EF4444",
        "steps": _generate_kama_steps(14),
    })

    templates.append({
        "slug": "beyond-craving-21d",
        "title": "Beyond Craving - The Path to Inner Peace",
        "description": "A deeper 21-day exploration into the nature of desire. "
                      "Discover how attachment to outcomes creates suffering and "
                      "learn practices for cultivating vairagya (detachment).",
        "primary_enemy_tags": ["kama"],
        "duration_days": 21,
        "difficulty": 4,
        "is_active": True,
        "is_featured": False,
        "is_free": False,
        "icon_name": "lotus",
        "color_theme": "#DC2626",
        "steps": _generate_kama_steps(21),
    })

    # =========================================================================
    # KRODHA (Anger) Templates
    # =========================================================================
    templates.append({
        "slug": "transform-anger-14d",
        "title": "Transform Your Anger - Cultivating Peace",
        "description": "A transformative 14-day journey from reactive anger to "
                      "responsive wisdom. Learn to recognize anger's roots and "
                      "transmute it into clarity and compassion.",
        "primary_enemy_tags": ["krodha"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "peace",
        "color_theme": "#F97316",
        "steps": _generate_krodha_steps(14),
    })

    templates.append({
        "slug": "patient-heart-7d",
        "title": "The Patient Heart - 7 Days to Calm",
        "description": "A quick but powerful 7-day journey for those seeking "
                      "immediate relief from anger patterns. Build foundational "
                      "practices for emotional regulation.",
        "primary_enemy_tags": ["krodha"],
        "duration_days": 7,
        "difficulty": 2,
        "is_active": True,
        "is_featured": False,
        "is_free": True,
        "icon_name": "heart",
        "color_theme": "#EA580C",
        "steps": _generate_krodha_steps(7),
    })

    # =========================================================================
    # LOBHA (Greed) Templates
    # =========================================================================
    templates.append({
        "slug": "greed-to-generosity-14d",
        "title": "From Greed to Generosity - The Giving Path",
        "description": "Transform the energy of wanting into the joy of giving. "
                      "This 14-day journey helps you discover that true abundance "
                      "comes from sharing, not hoarding.",
        "primary_enemy_tags": ["lobha"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "gift",
        "color_theme": "#22C55E",
        "steps": _generate_lobha_steps(14),
    })

    templates.append({
        "slug": "cultivating-contentment-21d",
        "title": "Cultivating Contentment - Enough is Abundance",
        "description": "A 21-day deep dive into santosha (contentment). Learn why "
                      "the mind's 'more' never satisfies and discover the freedom "
                      "of appreciating what you already have.",
        "primary_enemy_tags": ["lobha"],
        "duration_days": 21,
        "difficulty": 4,
        "is_active": True,
        "is_featured": False,
        "is_free": False,
        "icon_name": "balance",
        "color_theme": "#16A34A",
        "steps": _generate_lobha_steps(21),
    })

    # =========================================================================
    # MOHA (Delusion) Templates
    # =========================================================================
    templates.append({
        "slug": "clarity-wisdom-14d",
        "title": "Clarity Through Wisdom - Dispelling Illusion",
        "description": "A 14-day journey from confusion to clarity. Learn to see "
                      "through the fog of attachment and make decisions from a "
                      "place of wisdom rather than emotional reactivity.",
        "primary_enemy_tags": ["moha"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "eye",
        "color_theme": "#8B5CF6",
        "steps": _generate_moha_steps(14),
    })

    templates.append({
        "slug": "breaking-free-illusion-28d",
        "title": "Breaking Free from Illusion - The Awakening",
        "description": "A comprehensive 28-day journey for those ready to examine "
                      "their deepest attachments and self-deceptions. This advanced "
                      "path requires courage and commitment.",
        "primary_enemy_tags": ["moha"],
        "duration_days": 28,
        "difficulty": 5,
        "is_active": True,
        "is_featured": False,
        "is_free": False,
        "icon_name": "sun",
        "color_theme": "#7C3AED",
        "steps": _generate_moha_steps(28),
    })

    # =========================================================================
    # MADA (Pride/Ego) Templates
    # =========================================================================
    templates.append({
        "slug": "humble-path-14d",
        "title": "The Humble Path - Releasing Ego",
        "description": "A 14-day journey into authentic humility. Learn to recognize "
                      "ego's subtle defenses and discover the strength that comes "
                      "from surrendering the need to be right.",
        "primary_enemy_tags": ["mada"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "bow",
        "color_theme": "#06B6D4",
        "steps": _generate_mada_steps(14),
    })

    templates.append({
        "slug": "ego-to-service-21d",
        "title": "From Ego to Service - The Selfless Way",
        "description": "A 21-day transformation from self-centered living to "
                      "service-oriented purpose. Discover how helping others "
                      "dissolves the suffering caused by excessive ego.",
        "primary_enemy_tags": ["mada"],
        "duration_days": 21,
        "difficulty": 4,
        "is_active": True,
        "is_featured": False,
        "is_free": False,
        "icon_name": "hands",
        "color_theme": "#0891B2",
        "steps": _generate_mada_steps(21),
    })

    # =========================================================================
    # MATSARYA (Jealousy/Envy) Templates
    # =========================================================================
    templates.append({
        "slug": "celebrating-joy-14d",
        "title": "Celebrating Others' Joy - Beyond Envy",
        "description": "A 14-day journey from comparison to celebration. Learn "
                      "the practice of mudita (sympathetic joy) and discover that "
                      "others' success doesn't diminish your own.",
        "primary_enemy_tags": ["matsarya"],
        "duration_days": 14,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "celebrate",
        "color_theme": "#EC4899",
        "steps": _generate_matsarya_steps(14),
    })

    templates.append({
        "slug": "envy-to-empathy-7d",
        "title": "From Envy to Empathy - The Compassionate Heart",
        "description": "A focused 7-day journey for quick relief from the pain "
                      "of envy. Build the foundational practices of compassion "
                      "and appreciation that transform comparison into connection.",
        "primary_enemy_tags": ["matsarya"],
        "duration_days": 7,
        "difficulty": 2,
        "is_active": True,
        "is_featured": False,
        "is_free": True,
        "icon_name": "heart-hands",
        "color_theme": "#DB2777",
        "steps": _generate_matsarya_steps(7),
    })

    # =========================================================================
    # COMBINED (All Enemies) Template
    # =========================================================================
    templates.append({
        "slug": "conquer-all-six-enemies-42d",
        "title": "Conquer All Six Enemies - The Complete Transformation",
        "description": "The ultimate 42-day journey through all six inner enemies. "
                      "Spend one week on each Shadripu, building comprehensive mastery "
                      "over desire, anger, greed, delusion, pride, and envy.",
        "primary_enemy_tags": ["kama", "krodha", "lobha", "moha", "mada", "matsarya"],
        "duration_days": 42,
        "difficulty": 5,
        "is_active": True,
        "is_featured": True,
        "is_free": False,
        "icon_name": "crown",
        "color_theme": "#6366F1",
        "steps": _generate_combined_steps(42),
    })

    return templates


def _generate_kama_steps(days: int) -> list[dict]:
    """Generate steps for Kama (Desire) journey."""
    steps = []
    for day in range(1, days + 1):
        phase = _get_journey_phase(day, days)
        steps.append({
            "day_index": day,
            "step_title": f"Day {day}: {_get_kama_title(day, phase)}",
            "teaching_hint": _get_kama_teaching(day, phase),
            "reflection_prompt": _get_kama_reflection(day, phase),
            "practice_prompt": _get_kama_practice(day, phase),
            "verse_selector": {
                "tags": ["desire", "craving", "detachment", "contentment"],
                "max_verses": 2,
                "avoid_recent": 10,
            },
            "static_verse_refs": [{"chapter": 3, "verse": 37}] if day == 1 else None,
            "safety_notes": None,
        })
    return steps


def _generate_krodha_steps(days: int) -> list[dict]:
    """Generate steps for Krodha (Anger) journey."""
    steps = []
    for day in range(1, days + 1):
        phase = _get_journey_phase(day, days)
        steps.append({
            "day_index": day,
            "step_title": f"Day {day}: {_get_krodha_title(day, phase)}",
            "teaching_hint": _get_krodha_teaching(day, phase),
            "reflection_prompt": _get_krodha_reflection(day, phase),
            "practice_prompt": _get_krodha_practice(day, phase),
            "verse_selector": {
                "tags": ["anger", "peace", "patience", "equanimity"],
                "max_verses": 2,
                "avoid_recent": 10,
            },
            "static_verse_refs": [{"chapter": 2, "verse": 63}] if day == 1 else None,
            "safety_notes": "If experiencing intense anger, practice grounding before reflection." if day <= 3 else None,
        })
    return steps


def _generate_lobha_steps(days: int) -> list[dict]:
    """Generate steps for Lobha (Greed) journey."""
    steps = []
    for day in range(1, days + 1):
        phase = _get_journey_phase(day, days)
        steps.append({
            "day_index": day,
            "step_title": f"Day {day}: {_get_lobha_title(day, phase)}",
            "teaching_hint": _get_lobha_teaching(day, phase),
            "reflection_prompt": _get_lobha_reflection(day, phase),
            "practice_prompt": _get_lobha_practice(day, phase),
            "verse_selector": {
                "tags": ["greed", "contentment", "generosity", "giving"],
                "max_verses": 2,
                "avoid_recent": 10,
            },
            "static_verse_refs": [{"chapter": 14, "verse": 17}] if day == 1 else None,
            "safety_notes": None,
        })
    return steps


def _generate_moha_steps(days: int) -> list[dict]:
    """Generate steps for Moha (Delusion) journey."""
    steps = []
    for day in range(1, days + 1):
        phase = _get_journey_phase(day, days)
        steps.append({
            "day_index": day,
            "step_title": f"Day {day}: {_get_moha_title(day, phase)}",
            "teaching_hint": _get_moha_teaching(day, phase),
            "reflection_prompt": _get_moha_reflection(day, phase),
            "practice_prompt": _get_moha_practice(day, phase),
            "verse_selector": {
                "tags": ["delusion", "clarity", "wisdom", "discernment"],
                "max_verses": 2,
                "avoid_recent": 10,
            },
            "static_verse_refs": [{"chapter": 2, "verse": 52}] if day == 1 else None,
            "safety_notes": "This work can bring up challenging emotions. Be gentle with yourself." if phase == "integration" else None,
        })
    return steps


def _generate_mada_steps(days: int) -> list[dict]:
    """Generate steps for Mada (Pride/Ego) journey."""
    steps = []
    for day in range(1, days + 1):
        phase = _get_journey_phase(day, days)
        steps.append({
            "day_index": day,
            "step_title": f"Day {day}: {_get_mada_title(day, phase)}",
            "teaching_hint": _get_mada_teaching(day, phase),
            "reflection_prompt": _get_mada_reflection(day, phase),
            "practice_prompt": _get_mada_practice(day, phase),
            "verse_selector": {
                "tags": ["pride", "ego", "humility", "surrender"],
                "max_verses": 2,
                "avoid_recent": 10,
            },
            "static_verse_refs": [{"chapter": 16, "verse": 4}] if day == 1 else None,
            "safety_notes": None,
        })
    return steps


def _generate_matsarya_steps(days: int) -> list[dict]:
    """Generate steps for Matsarya (Jealousy/Envy) journey."""
    steps = []
    for day in range(1, days + 1):
        phase = _get_journey_phase(day, days)
        steps.append({
            "day_index": day,
            "step_title": f"Day {day}: {_get_matsarya_title(day, phase)}",
            "teaching_hint": _get_matsarya_teaching(day, phase),
            "reflection_prompt": _get_matsarya_reflection(day, phase),
            "practice_prompt": _get_matsarya_practice(day, phase),
            "verse_selector": {
                "tags": ["envy", "jealousy", "joy", "compassion"],
                "max_verses": 2,
                "avoid_recent": 10,
            },
            "static_verse_refs": [{"chapter": 12, "verse": 13}] if day == 1 else None,
            "safety_notes": None,
        })
    return steps


def _generate_combined_steps(days: int) -> list[dict]:
    """Generate steps for combined all-enemies journey."""
    steps = []
    enemies = ["kama", "krodha", "lobha", "moha", "mada", "matsarya"]
    days_per_enemy = days // len(enemies)

    for i, enemy in enumerate(enemies):
        start_day = i * days_per_enemy + 1
        for day_offset in range(days_per_enemy):
            day = start_day + day_offset
            phase = _get_journey_phase(day_offset + 1, days_per_enemy)

            generator = {
                "kama": (_get_kama_title, _get_kama_teaching, _get_kama_reflection, _get_kama_practice),
                "krodha": (_get_krodha_title, _get_krodha_teaching, _get_krodha_reflection, _get_krodha_practice),
                "lobha": (_get_lobha_title, _get_lobha_teaching, _get_lobha_reflection, _get_lobha_practice),
                "moha": (_get_moha_title, _get_moha_teaching, _get_moha_reflection, _get_moha_practice),
                "mada": (_get_mada_title, _get_mada_teaching, _get_mada_reflection, _get_mada_practice),
                "matsarya": (_get_matsarya_title, _get_matsarya_teaching, _get_matsarya_reflection, _get_matsarya_practice),
            }[enemy]

            steps.append({
                "day_index": day,
                "step_title": f"Day {day} ({enemy.title()}): {generator[0](day_offset + 1, phase)}",
                "teaching_hint": generator[1](day_offset + 1, phase),
                "reflection_prompt": generator[2](day_offset + 1, phase),
                "practice_prompt": generator[3](day_offset + 1, phase),
                "verse_selector": {
                    "tags": ENEMY_METADATA[EnemyType(enemy)]["themes"][:4],
                    "max_verses": 2,
                    "avoid_recent": 10,
                },
                "static_verse_refs": [ENEMY_METADATA[EnemyType(enemy)]["key_verse"]] if day_offset == 0 else None,
                "safety_notes": None,
            })

    return steps


def _get_journey_phase(day: int, total_days: int) -> str:
    """Get journey phase based on day progress."""
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


# Content generators for each enemy (simplified - expand as needed)
def _get_kama_title(day: int, phase: str) -> str:
    titles = {
        "awakening": "Recognizing Desire's Pull",
        "understanding": "The Root of Craving",
        "practice": "Cultivating Contentment",
        "integration": "Freedom from Attachment",
        "mastery": "Living in Sufficiency",
    }
    return titles.get(phase, "Walking the Path")


def _get_kama_teaching(day: int, phase: str) -> str:
    teachings = {
        "awakening": "Today we recognize how desire arises in the mind without judgment.",
        "understanding": "Explore what underlying needs your desires are trying to fulfill.",
        "practice": "Practice pausing between desire and action, creating space for wisdom.",
        "integration": "Notice how contentment feels different from satisfaction of desire.",
        "mastery": "Embody the teaching that true happiness comes from within, not from objects.",
    }
    return teachings.get(phase, "Continue your contemplation of desire.")


def _get_kama_reflection(day: int, phase: str) -> str:
    return "What desires arose today? What would remain if they were fulfilled?"


def _get_kama_practice(day: int, phase: str) -> str:
    return "When desire arises, take 3 breaths and ask: 'Is this a true need or a passing want?'"


def _get_krodha_title(day: int, phase: str) -> str:
    titles = {
        "awakening": "The Fire Within",
        "understanding": "Anger's Hidden Message",
        "practice": "The Pause Before Response",
        "integration": "Transforming Fire to Light",
        "mastery": "Equanimity in Action",
    }
    return titles.get(phase, "Cultivating Peace")


def _get_krodha_teaching(day: int, phase: str) -> str:
    teachings = {
        "awakening": "Today we observe anger as energy, without suppressing or acting on it.",
        "understanding": "Explore what underlying hurt or fear triggers your anger responses.",
        "practice": "Practice the sacred pause—the space between stimulus and response.",
        "integration": "Learn to express boundaries firmly but without the fire of anger.",
        "mastery": "Embody equanimity—responding wisely to all situations with clarity.",
    }
    return teachings.get(phase, "Continue your contemplation of anger.")


def _get_krodha_reflection(day: int, phase: str) -> str:
    return "When did anger arise today? What was it trying to protect?"


def _get_krodha_practice(day: int, phase: str) -> str:
    return "When anger arises, ground through your feet and take 5 slow breaths before speaking."


def _get_lobha_title(day: int, phase: str) -> str:
    titles = {
        "awakening": "The Hunger for More",
        "understanding": "Why Enough is Never Enough",
        "practice": "The Art of Appreciation",
        "integration": "Giving as Liberation",
        "mastery": "Abundance in Simplicity",
    }
    return titles.get(phase, "Finding Sufficiency")


def _get_lobha_teaching(day: int, phase: str) -> str:
    teachings = {
        "awakening": "Today we observe the mind's tendency to accumulate and hold.",
        "understanding": "Explore what insecurity or fear drives the need for more.",
        "practice": "Practice gratitude for what you have before seeking what you don't.",
        "integration": "Experience the joy of giving without expectation of return.",
        "mastery": "Embody the truth that richness comes from appreciation, not accumulation.",
    }
    return teachings.get(phase, "Continue your contemplation of greed.")


def _get_lobha_reflection(day: int, phase: str) -> str:
    return "What felt like 'not enough' today? What would truly satisfy you?"


def _get_lobha_practice(day: int, phase: str) -> str:
    return "List 10 things you're grateful for. Give something away today without keeping score."


def _get_moha_title(day: int, phase: str) -> str:
    titles = {
        "awakening": "The Fog of Confusion",
        "understanding": "What We Mistake for Truth",
        "practice": "Cultivating Discernment",
        "integration": "Seeing Clearly",
        "mastery": "Wisdom in Action",
    }
    return titles.get(phase, "Seeking Clarity")


def _get_moha_teaching(day: int, phase: str) -> str:
    teachings = {
        "awakening": "Today we recognize where attachment clouds our perception.",
        "understanding": "Explore what beliefs you hold that may not serve your highest good.",
        "practice": "Practice viveka—distinguishing the real from the unreal, the eternal from the temporary.",
        "integration": "Learn to see situations clearly, free from the lens of personal desire.",
        "mastery": "Embody wisdom that sees beyond surface appearances to underlying truth.",
    }
    return teachings.get(phase, "Continue your contemplation of delusion.")


def _get_moha_reflection(day: int, phase: str) -> str:
    return "Where did confusion arise today? What clarity might you be avoiding?"


def _get_moha_practice(day: int, phase: str) -> str:
    return "Before making a decision, ask: 'Am I seeing this clearly, or through the lens of attachment?'"


def _get_mada_title(day: int, phase: str) -> str:
    titles = {
        "awakening": "The Shield of Pride",
        "understanding": "What Ego Protects",
        "practice": "The Strength in Humility",
        "integration": "Service as Medicine",
        "mastery": "Confident Surrender",
    }
    return titles.get(phase, "Walking Humbly")


def _get_mada_teaching(day: int, phase: str) -> str:
    teachings = {
        "awakening": "Today we observe how ego defends its sense of superiority or specialness.",
        "understanding": "Explore what vulnerability ego is protecting you from feeling.",
        "practice": "Practice asking for help and admitting 'I don't know' without shame.",
        "integration": "Discover that serving others dissolves the isolation of self-centeredness.",
        "mastery": "Embody the paradox: true confidence comes from surrender, not assertion.",
    }
    return teachings.get(phase, "Continue your contemplation of ego.")


def _get_mada_reflection(day: int, phase: str) -> str:
    return "Where did ego show up today? What would happen if you let go of being right?"


def _get_mada_practice(day: int, phase: str) -> str:
    return "Today, ask for help with something. Notice the discomfort and stay with it."


def _get_matsarya_title(day: int, phase: str) -> str:
    titles = {
        "awakening": "The Pain of Comparison",
        "understanding": "What Envy Reveals",
        "practice": "Mudita—Sympathetic Joy",
        "integration": "Celebrating Others",
        "mastery": "One in All",
    }
    return titles.get(phase, "Beyond Comparison")


def _get_matsarya_teaching(day: int, phase: str) -> str:
    teachings = {
        "awakening": "Today we recognize envy as information about our own unfulfilled desires.",
        "understanding": "Explore what you truly want that you see in others' success.",
        "practice": "Practice mudita—genuinely celebrating others' joy and success.",
        "integration": "Learn that another's gain doesn't diminish your own possibilities.",
        "mastery": "Embody the understanding that we are all connected; their success is our success.",
    }
    return teachings.get(phase, "Continue your contemplation of envy.")


def _get_matsarya_reflection(day: int, phase: str) -> str:
    return "Whose success triggered discomfort today? What does this teach you about your own desires?"


def _get_matsarya_practice(day: int, phase: str) -> str:
    return "When you feel envy, say: 'Their success shows what's possible. May they flourish.'"


# =============================================================================
# DATABASE OPERATIONS
# =============================================================================


async def seed_template(db: AsyncSession, template_data: dict, dry_run: bool = False) -> JourneyTemplate | None:
    """Seed a single template with its steps."""
    slug = template_data["slug"]

    # Check if template exists
    existing = await db.execute(
        select(JourneyTemplate).where(JourneyTemplate.slug == slug)
    )
    if existing.scalar_one_or_none():
        logger.info(f"Template '{slug}' already exists, skipping")
        return None

    if dry_run:
        logger.info(f"[DRY RUN] Would create template: {slug}")
        return None

    # Create template
    template = JourneyTemplate(
        id=str(uuid.uuid4()),
        slug=slug,
        title=template_data["title"],
        description=template_data["description"],
        primary_enemy_tags=template_data["primary_enemy_tags"],
        duration_days=template_data["duration_days"],
        difficulty=template_data["difficulty"],
        is_active=template_data.get("is_active", True),
        is_featured=template_data.get("is_featured", False),
        is_free=template_data.get("is_free", False),
        icon_name=template_data.get("icon_name"),
        color_theme=template_data.get("color_theme"),
    )

    db.add(template)
    await db.flush()

    # Create steps
    for step_data in template_data.get("steps", []):
        step = JourneyTemplateStep(
            id=str(uuid.uuid4()),
            journey_template_id=template.id,
            day_index=step_data["day_index"],
            step_title=step_data.get("step_title"),
            teaching_hint=step_data.get("teaching_hint"),
            reflection_prompt=step_data.get("reflection_prompt"),
            practice_prompt=step_data.get("practice_prompt"),
            verse_selector=step_data.get("verse_selector"),
            static_verse_refs=step_data.get("static_verse_refs"),
            safety_notes=step_data.get("safety_notes"),
        )
        db.add(step)

    logger.info(f"Created template: {slug} ({len(template_data.get('steps', []))} steps)")
    return template


async def seed_static_templates(db: AsyncSession, dry_run: bool = False):
    """Seed all static templates."""
    templates = get_static_templates()
    created = 0

    for template_data in templates:
        result = await seed_template(db, template_data, dry_run)
        if result:
            created += 1

    if not dry_run:
        await db.commit()

    logger.info(f"Seeding complete: {created} templates created")


async def seed_ai_templates(
    db: AsyncSession,
    enemy: str | None = None,
    max_tokens: int = 8000,
    dry_run: bool = False,
):
    """Seed templates using AI generation."""
    generator = JourneyTemplateGenerator(
        config=TemplateGenerationConfig(max_total_tokens=max_tokens)
    )

    templates_to_generate = PREDEFINED_TEMPLATES
    if enemy:
        templates_to_generate = [
            t for t in templates_to_generate
            if t["enemy"].value == enemy.lower()
        ]

    created = 0
    for template_config in templates_to_generate:
        try:
            logger.info(f"Generating template for {template_config['enemy'].value}...")

            generated = await generator.generate_template(
                enemy=template_config["enemy"],
                duration_days=template_config["duration_days"],
                difficulty=template_config["difficulty"],
                title_override=template_config["title"],
                max_tokens=max_tokens,
            )

            template_data = generated.to_dict()
            template_data["is_active"] = True
            template_data["is_featured"] = template_config["difficulty"] == 3
            template_data["is_free"] = template_config["difficulty"] <= 2

            result = await seed_template(db, template_data, dry_run)
            if result:
                created += 1

            logger.info(
                f"Generated: {generated.slug} "
                f"({generated.tokens_used} tokens, {len(generated.steps)} steps)"
            )

        except Exception as e:
            logger.error(f"Failed to generate template: {e}")
            continue

    if not dry_run:
        await db.commit()

    logger.info(f"AI seeding complete: {created} templates created")


# =============================================================================
# MAIN
# =============================================================================


async def main():
    parser = argparse.ArgumentParser(
        description="Seed journey templates into database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--mode",
        choices=["static", "ai"],
        default="static",
        help="Seeding mode: static (predefined) or ai (generated)",
    )
    parser.add_argument(
        "--enemy",
        choices=["kama", "krodha", "lobha", "moha", "mada", "matsarya"],
        help="Generate only for specific enemy (AI mode only)",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=8000,
        help="Max tokens per template (AI mode only)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview without saving to database",
    )

    args = parser.parse_args()

    logger.info(f"Starting template seeding (mode: {args.mode}, dry_run: {args.dry_run})")

    async with get_db_session() as db:
        if args.mode == "static":
            await seed_static_templates(db, dry_run=args.dry_run)
        elif args.mode == "ai":
            if not os.getenv("OPENAI_API_KEY"):
                logger.error("OPENAI_API_KEY required for AI mode")
                sys.exit(1)
            await seed_ai_templates(
                db,
                enemy=args.enemy,
                max_tokens=args.max_tokens,
                dry_run=args.dry_run,
            )


if __name__ == "__main__":
    asyncio.run(main())
