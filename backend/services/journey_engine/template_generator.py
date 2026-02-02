"""
AI Template Generator - Generate Journey Templates with Fixed Token Budgets.

This module provides AI-powered generation of journey templates with:
1. Fixed token limits per template and step
2. Structured JSON output
3. Six Enemies (Shadripu) focused content
4. Gita verse integration

Token Budget Guidelines:
- Template metadata: ~300 tokens
- Step content: ~400 tokens per step
- Total for 14-day journey: ~6000 tokens

Usage:
    from backend.services.journey_engine import JourneyTemplateGenerator

    generator = JourneyTemplateGenerator()
    template = await generator.generate_template(
        enemy="krodha",
        duration_days=14,
        difficulty=3,
        max_tokens=6000
    )
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================


class EnemyType(str, Enum):
    """The six inner enemies (Ṣaḍ-Ripu)."""

    KAMA = "kama"
    KRODHA = "krodha"
    LOBHA = "lobha"
    MOHA = "moha"
    MADA = "mada"
    MATSARYA = "matsarya"


# Enemy metadata with Gita references and themes
ENEMY_METADATA = {
    EnemyType.KAMA: {
        "sanskrit": "काम",
        "english": "Desire / Lust",
        "description": "Uncontrolled craving for pleasure that clouds judgment",
        "key_verse": {"chapter": 3, "verse": 37},
        "themes": ["desire", "craving", "attachment", "restraint", "detachment", "moderation"],
        "antidotes": ["vairagya", "brahmacharya", "santosha", "viveka"],
        "modern_contexts": ["career ambition", "social media addiction", "relationship attachment", "material desires"],
    },
    EnemyType.KRODHA: {
        "sanskrit": "क्रोध",
        "english": "Anger",
        "description": "Arises when desire is frustrated; clouds judgment and destroys discrimination",
        "key_verse": {"chapter": 2, "verse": 63},
        "themes": ["anger", "wrath", "peace", "calm", "equanimity", "patience", "forgiveness"],
        "antidotes": ["kshama", "shanti", "daya", "karuna"],
        "modern_contexts": ["road rage", "workplace conflict", "family disputes", "online arguments"],
    },
    EnemyType.LOBHA: {
        "sanskrit": "लोभ",
        "english": "Greed",
        "description": "Insatiable wanting—never satisfied, always wanting more",
        "key_verse": {"chapter": 14, "verse": 17},
        "themes": ["greed", "avarice", "contentment", "generosity", "charity", "sharing"],
        "antidotes": ["santosha", "dana", "tyaga", "aparigraha"],
        "modern_contexts": ["financial anxiety", "consumerism", "hoarding", "comparing wealth"],
    },
    EnemyType.MOHA: {
        "sanskrit": "मोह",
        "english": "Attachment / Delusion",
        "description": "Emotional obsession that causes loss of clarity and discrimination",
        "key_verse": {"chapter": 2, "verse": 52},
        "themes": ["delusion", "confusion", "clarity", "wisdom", "knowledge", "discernment"],
        "antidotes": ["viveka", "jnana", "prajna", "buddhi"],
        "modern_contexts": ["toxic relationships", "career confusion", "identity crisis", "false beliefs"],
    },
    EnemyType.MADA: {
        "sanskrit": "मद",
        "english": "Pride / Ego / Arrogance",
        "description": "Inflated sense of self that blocks humility and learning",
        "key_verse": {"chapter": 16, "verse": 4},
        "themes": ["pride", "ego", "arrogance", "humility", "surrender", "service", "modesty"],
        "antidotes": ["namrata", "vinaya", "seva", "bhakti"],
        "modern_contexts": ["workplace ego", "social comparison", "achievement obsession", "status anxiety"],
    },
    EnemyType.MATSARYA: {
        "sanskrit": "मात्सर्य",
        "english": "Jealousy / Envy",
        "description": "Resentment toward others' success or happiness",
        "key_verse": {"chapter": 12, "verse": 13},
        "themes": ["envy", "jealousy", "resentment", "joy", "compassion", "empathy", "celebration"],
        "antidotes": ["mudita", "karuna", "maitri", "ananda"],
        "modern_contexts": ["colleague success", "sibling comparison", "social media envy", "relationship jealousy"],
    },
}


@dataclass
class TemplateGenerationConfig:
    """Configuration for template generation."""

    # Token budgets
    template_metadata_tokens: int = 300
    step_tokens: int = 400
    max_total_tokens: int = 8000

    # Model settings
    model: str = "gpt-4o-mini"
    temperature: float = 0.7

    # Generation settings
    include_examples: bool = True
    include_safety_notes: bool = True
    language: str = "en"


@dataclass
class GeneratedStep:
    """A generated journey step."""

    day_index: int
    step_title: str
    teaching_hint: str
    reflection_prompt: str
    practice_prompt: str
    verse_selector: dict[str, Any]
    static_verse_refs: list[dict[str, int]] | None = None
    safety_notes: str | None = None
    modern_example: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for database storage."""
        return {
            "day_index": self.day_index,
            "step_title": self.step_title,
            "teaching_hint": self.teaching_hint,
            "reflection_prompt": self.reflection_prompt,
            "practice_prompt": self.practice_prompt,
            "verse_selector": self.verse_selector,
            "static_verse_refs": self.static_verse_refs,
            "safety_notes": self.safety_notes,
            "modern_example": self.modern_example,
        }


@dataclass
class GeneratedTemplate:
    """A complete generated journey template."""

    slug: str
    title: str
    description: str
    primary_enemy_tags: list[str]
    duration_days: int
    difficulty: int
    icon_name: str
    color_theme: str
    steps: list[GeneratedStep]

    # Generation metadata
    tokens_used: int = 0
    generated_at: datetime = field(default_factory=datetime.utcnow)
    model_used: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for database storage."""
        return {
            "slug": self.slug,
            "title": self.title,
            "description": self.description,
            "primary_enemy_tags": self.primary_enemy_tags,
            "duration_days": self.duration_days,
            "difficulty": self.difficulty,
            "icon_name": self.icon_name,
            "color_theme": self.color_theme,
            "steps": [step.to_dict() for step in self.steps],
        }


# =============================================================================
# TEMPLATE GENERATOR
# =============================================================================


class JourneyTemplateGenerator:
    """
    AI-powered journey template generator with fixed token budgets.

    Generates complete journey templates including:
    - Template metadata (title, description, etc.)
    - Daily step skeletons with content hints
    - Verse selection configuration
    - Modern examples and safety notes
    """

    def __init__(self, config: TemplateGenerationConfig | None = None):
        """Initialize the generator with optional config."""
        self.config = config or TemplateGenerationConfig()
        self._client = None

    async def _get_client(self):
        """Get or create OpenAI client."""
        if self._client is None:
            try:
                from openai import AsyncOpenAI
                api_key = os.getenv("OPENAI_API_KEY")
                if not api_key:
                    raise ValueError("OPENAI_API_KEY not set")
                self._client = AsyncOpenAI(api_key=api_key)
            except ImportError:
                raise ImportError("OpenAI library not installed")
        return self._client

    async def generate_template(
        self,
        enemy: str | EnemyType,
        duration_days: int = 14,
        difficulty: int = 3,
        title_override: str | None = None,
        max_tokens: int | None = None,
    ) -> GeneratedTemplate:
        """
        Generate a complete journey template for the specified enemy.

        Args:
            enemy: The inner enemy to target (e.g., "krodha")
            duration_days: Number of days for the journey (7, 14, 21, 28)
            difficulty: Difficulty level (1-5)
            title_override: Optional custom title
            max_tokens: Override max total tokens

        Returns:
            GeneratedTemplate with all steps
        """
        # Normalize enemy type
        if isinstance(enemy, str):
            enemy = EnemyType(enemy.lower())

        enemy_meta = ENEMY_METADATA[enemy]
        max_tokens = max_tokens or self.config.max_total_tokens

        # Calculate token budget
        step_budget = min(
            self.config.step_tokens,
            (max_tokens - self.config.template_metadata_tokens) // duration_days
        )

        logger.info(
            f"Generating template for {enemy.value} ({duration_days} days, "
            f"~{step_budget} tokens/step, max {max_tokens} total)"
        )

        # Generate template metadata
        metadata = await self._generate_template_metadata(
            enemy=enemy,
            enemy_meta=enemy_meta,
            duration_days=duration_days,
            difficulty=difficulty,
            title_override=title_override,
        )

        # Generate steps
        steps = await self._generate_steps(
            enemy=enemy,
            enemy_meta=enemy_meta,
            duration_days=duration_days,
            step_budget=step_budget,
        )

        # Calculate total tokens used
        total_tokens = metadata.get("tokens_used", 0) + sum(
            s.get("tokens_used", 0) for s in steps
        )

        return GeneratedTemplate(
            slug=metadata["slug"],
            title=metadata["title"],
            description=metadata["description"],
            primary_enemy_tags=[enemy.value],
            duration_days=duration_days,
            difficulty=difficulty,
            icon_name=metadata["icon_name"],
            color_theme=metadata["color_theme"],
            steps=[
                GeneratedStep(
                    day_index=s["day_index"],
                    step_title=s["step_title"],
                    teaching_hint=s["teaching_hint"],
                    reflection_prompt=s["reflection_prompt"],
                    practice_prompt=s["practice_prompt"],
                    verse_selector=s["verse_selector"],
                    static_verse_refs=s.get("static_verse_refs"),
                    safety_notes=s.get("safety_notes"),
                    modern_example=s.get("modern_example"),
                )
                for s in steps
            ],
            tokens_used=total_tokens,
            generated_at=datetime.utcnow(),
            model_used=self.config.model,
        )

    async def _generate_template_metadata(
        self,
        enemy: EnemyType,
        enemy_meta: dict,
        duration_days: int,
        difficulty: int,
        title_override: str | None = None,
    ) -> dict[str, Any]:
        """Generate template metadata with token budget."""
        client = await self._get_client()

        system_prompt = """You are a Bhagavad Gita wisdom expert creating journey templates.
Generate JSON metadata for a transformational journey targeting an inner enemy (Shadripu).
Be concise but inspiring. Output ONLY valid JSON."""

        user_prompt = f"""Create metadata for a {duration_days}-day journey to overcome {enemy_meta['english']} ({enemy.value}).

Enemy details:
- Sanskrit: {enemy_meta['sanskrit']}
- Description: {enemy_meta['description']}
- Key themes: {', '.join(enemy_meta['themes'])}
- Antidotes: {', '.join(enemy_meta['antidotes'])}

Generate JSON with:
{{
  "slug": "transform-{enemy.value}-{duration_days}d",
  "title": "Inspiring journey title (max 60 chars)",
  "description": "2-3 sentence description emphasizing transformation through Gita wisdom",
  "icon_name": "appropriate icon name (e.g., flame, lotus, peace)",
  "color_theme": "hex color that represents this journey"
}}"""

        if title_override:
            user_prompt += f"\n\nUse this title: {title_override}"

        response = await client.chat.completions.create(
            model=self.config.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=self.config.temperature,
            max_tokens=self.config.template_metadata_tokens,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        metadata = json.loads(content)
        metadata["tokens_used"] = response.usage.total_tokens if response.usage else 0

        return metadata

    async def _generate_steps(
        self,
        enemy: EnemyType,
        enemy_meta: dict,
        duration_days: int,
        step_budget: int,
    ) -> list[dict[str, Any]]:
        """Generate all journey steps with token budget."""
        client = await self._get_client()

        # Generate steps in batches to optimize API calls
        batch_size = 7
        all_steps = []

        for batch_start in range(1, duration_days + 1, batch_size):
            batch_end = min(batch_start + batch_size - 1, duration_days)
            batch_steps = await self._generate_step_batch(
                client=client,
                enemy=enemy,
                enemy_meta=enemy_meta,
                start_day=batch_start,
                end_day=batch_end,
                total_days=duration_days,
                step_budget=step_budget * (batch_end - batch_start + 1),
            )
            all_steps.extend(batch_steps)

        return all_steps

    async def _generate_step_batch(
        self,
        client,
        enemy: EnemyType,
        enemy_meta: dict,
        start_day: int,
        end_day: int,
        total_days: int,
        step_budget: int,
    ) -> list[dict[str, Any]]:
        """Generate a batch of journey steps."""
        num_steps = end_day - start_day + 1

        system_prompt = f"""You are a Bhagavad Gita wisdom expert creating daily journey steps.
Each step should guide the user through understanding and overcoming {enemy_meta['english']} ({enemy.value}).
Output ONLY valid JSON array. Be concise but meaningful."""

        # Create journey arc description based on position
        arc_description = self._get_arc_description(start_day, end_day, total_days)

        user_prompt = f"""Generate {num_steps} journey steps (days {start_day}-{end_day}) for a {total_days}-day journey to overcome {enemy_meta['english']}.

Enemy: {enemy.value} ({enemy_meta['sanskrit']})
Key themes: {', '.join(enemy_meta['themes'])}
Antidotes: {', '.join(enemy_meta['antidotes'])}
Modern contexts: {', '.join(enemy_meta['modern_contexts'])}

Journey arc for these days: {arc_description}

Generate JSON array:
[
  {{
    "day_index": {start_day},
    "step_title": "Short title (max 50 chars)",
    "teaching_hint": "1-2 sentences guiding the teaching focus",
    "reflection_prompt": "Question for self-reflection",
    "practice_prompt": "5-minute practical exercise",
    "verse_selector": {{
      "tags": ["relevant", "theme", "tags"],
      "max_verses": 2,
      "avoid_recent": 10
    }},
    "modern_example": "Brief real-life scenario (1 sentence)",
    "safety_notes": "Optional safety note if sensitive content"
  }},
  ...
]

Focus on progressive transformation. Each day builds on previous."""

        response = await client.chat.completions.create(
            model=self.config.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=self.config.temperature,
            max_tokens=step_budget,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content

        # Parse response - handle both array and object wrapper
        try:
            parsed = json.loads(content)
            if isinstance(parsed, list):
                steps = parsed
            elif isinstance(parsed, dict) and "steps" in parsed:
                steps = parsed["steps"]
            else:
                # Try to extract array from the object
                for key in parsed:
                    if isinstance(parsed[key], list):
                        steps = parsed[key]
                        break
                else:
                    steps = [parsed]
        except json.JSONDecodeError:
            logger.error(f"Failed to parse step batch: {content[:200]}")
            steps = []

        # Add tokens used to each step
        tokens_per_step = (response.usage.total_tokens if response.usage else 0) // max(len(steps), 1)
        for step in steps:
            step["tokens_used"] = tokens_per_step

        return steps

    def _get_arc_description(self, start_day: int, end_day: int, total_days: int) -> str:
        """Get narrative arc description for the step batch."""
        progress = start_day / total_days

        if progress < 0.15:
            return "AWAKENING - Recognizing the enemy within, understanding its nature and impact"
        elif progress < 0.35:
            return "UNDERSTANDING - Exploring root causes, patterns, and triggers through Gita wisdom"
        elif progress < 0.55:
            return "PRACTICE - Active engagement with antidotes, developing new habits"
        elif progress < 0.75:
            return "INTEGRATION - Deepening practice, handling setbacks, building resilience"
        elif progress < 0.90:
            return "MASTERY - Strengthening transformation, celebrating progress"
        else:
            return "COMPLETION - Integrating learnings, preparing for continued growth"

    async def generate_combined_template(
        self,
        duration_days: int = 42,
        max_tokens: int = 20000,
    ) -> GeneratedTemplate:
        """
        Generate a combined journey covering all six enemies.

        This creates a comprehensive 42-day journey (7 days per enemy)
        that cycles through all six Shadripu.
        """
        enemies = list(EnemyType)
        days_per_enemy = duration_days // len(enemies)

        all_steps = []
        total_tokens = 0

        for i, enemy in enumerate(enemies):
            enemy_meta = ENEMY_METADATA[enemy]
            start_day = i * days_per_enemy + 1
            end_day = start_day + days_per_enemy - 1

            steps = await self._generate_step_batch(
                client=await self._get_client(),
                enemy=enemy,
                enemy_meta=enemy_meta,
                start_day=start_day,
                end_day=end_day,
                total_days=duration_days,
                step_budget=(max_tokens - 500) // len(enemies),
            )

            all_steps.extend(steps)
            total_tokens += sum(s.get("tokens_used", 0) for s in steps)

        return GeneratedTemplate(
            slug="conquer-all-six-enemies",
            title="Conquer All Six Enemies - The Complete Transformation",
            description="A comprehensive 42-day journey through all six inner enemies (Shadripu). "
                       "Master desire, anger, greed, delusion, pride, and envy through ancient Gita wisdom.",
            primary_enemy_tags=[e.value for e in enemies],
            duration_days=duration_days,
            difficulty=5,
            icon_name="crown",
            color_theme="#8B5CF6",
            steps=[
                GeneratedStep(
                    day_index=s["day_index"],
                    step_title=s["step_title"],
                    teaching_hint=s["teaching_hint"],
                    reflection_prompt=s["reflection_prompt"],
                    practice_prompt=s["practice_prompt"],
                    verse_selector=s["verse_selector"],
                    static_verse_refs=s.get("static_verse_refs"),
                    safety_notes=s.get("safety_notes"),
                    modern_example=s.get("modern_example"),
                )
                for s in all_steps
            ],
            tokens_used=total_tokens,
            generated_at=datetime.utcnow(),
            model_used=self.config.model,
        )


# =============================================================================
# TEMPLATE DEFINITIONS (Pre-defined for quick seeding)
# =============================================================================


# Pre-defined template configurations for each enemy
PREDEFINED_TEMPLATES = [
    # KAMA (Desire)
    {
        "enemy": EnemyType.KAMA,
        "title": "Master Your Desires - Finding True Contentment",
        "duration_days": 14,
        "difficulty": 3,
    },
    {
        "enemy": EnemyType.KAMA,
        "title": "Beyond Craving - The Path to Inner Peace",
        "duration_days": 21,
        "difficulty": 4,
    },
    # KRODHA (Anger)
    {
        "enemy": EnemyType.KRODHA,
        "title": "Transform Your Anger - Cultivating Peace",
        "duration_days": 14,
        "difficulty": 3,
    },
    {
        "enemy": EnemyType.KRODHA,
        "title": "The Patient Heart - 7 Days to Calm",
        "duration_days": 7,
        "difficulty": 2,
    },
    # LOBHA (Greed)
    {
        "enemy": EnemyType.LOBHA,
        "title": "From Greed to Generosity - The Giving Path",
        "duration_days": 14,
        "difficulty": 3,
    },
    {
        "enemy": EnemyType.LOBHA,
        "title": "Cultivating Contentment - Enough is Abundance",
        "duration_days": 21,
        "difficulty": 4,
    },
    # MOHA (Delusion)
    {
        "enemy": EnemyType.MOHA,
        "title": "Clarity Through Wisdom - Dispelling Illusion",
        "duration_days": 14,
        "difficulty": 3,
    },
    {
        "enemy": EnemyType.MOHA,
        "title": "Breaking Free from Illusion - The Awakening",
        "duration_days": 28,
        "difficulty": 5,
    },
    # MADA (Pride/Ego)
    {
        "enemy": EnemyType.MADA,
        "title": "The Humble Path - Releasing Ego",
        "duration_days": 14,
        "difficulty": 3,
    },
    {
        "enemy": EnemyType.MADA,
        "title": "From Ego to Service - The Selfless Way",
        "duration_days": 21,
        "difficulty": 4,
    },
    # MATSARYA (Jealousy)
    {
        "enemy": EnemyType.MATSARYA,
        "title": "Celebrating Others' Joy - Beyond Envy",
        "duration_days": 14,
        "difficulty": 3,
    },
    {
        "enemy": EnemyType.MATSARYA,
        "title": "From Envy to Empathy - The Compassionate Heart",
        "duration_days": 7,
        "difficulty": 2,
    },
]


def get_predefined_template_configs() -> list[dict]:
    """Get all predefined template configurations."""
    return PREDEFINED_TEMPLATES
