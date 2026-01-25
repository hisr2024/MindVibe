"""
Wisdom Journey Engine - Standalone engine for personalized wisdom journeys.

This module provides a robust, independent engine for the Wisdom Journey feature
with fallback capabilities, KIAAN AI integration, and offline support.
The engine is designed to work even when database connections are unavailable.
"""

import datetime
import hashlib
import logging
import random
import uuid
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# Embedded wisdom data for fallback when database is unavailable
EMBEDDED_WISDOM_VERSES = [
    {
        "id": 1,
        "chapter": 2,
        "verse": 47,
        "text": "You have the right to work, but never to the fruit of work.",
        "translation": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
        "theme": "detachment",
        "reflection": "Focus on your efforts and let go of attachment to outcomes.",
        "keywords": ["action", "detachment", "work", "karma"],
    },
    {
        "id": 2,
        "chapter": 2,
        "verse": 48,
        "text": "Perform work in yoga, abandoning attachment, being steadfast in equanimity.",
        "translation": "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय",
        "theme": "equanimity",
        "reflection": "Practice balance in success and failure to find true peace.",
        "keywords": ["yoga", "equanimity", "balance", "peace"],
    },
    {
        "id": 3,
        "chapter": 6,
        "verse": 5,
        "text": "Elevate yourself through the power of your mind, and not degrade yourself.",
        "translation": "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्",
        "theme": "self-improvement",
        "reflection": "Your mind can be your greatest friend or enemy - choose wisely.",
        "keywords": ["mind", "self", "improvement", "upliftment"],
    },
    {
        "id": 4,
        "chapter": 6,
        "verse": 35,
        "text": "The mind is restless and difficult to restrain, but it can be controlled through practice.",
        "translation": "असंशयं महाबाहो मनो दुर्निग्रहं चलम्",
        "theme": "mind-control",
        "reflection": "With consistent practice and detachment, even the restless mind finds stillness.",
        "keywords": ["mind", "control", "practice", "peace"],
    },
    {
        "id": 5,
        "chapter": 12,
        "verse": 13,
        "text": "One who is without hatred towards all beings, friendly and compassionate, is dear to Me.",
        "translation": "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च",
        "theme": "compassion",
        "reflection": "Cultivate compassion for all beings without exception.",
        "keywords": ["compassion", "love", "kindness", "friendship"],
    },
    {
        "id": 6,
        "chapter": 2,
        "verse": 14,
        "text": "The contacts of the senses with objects give rise to feelings of cold, heat, pleasure and pain.",
        "translation": "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः",
        "theme": "impermanence",
        "reflection": "Sensations are temporary - learn to endure them with equanimity.",
        "keywords": ["impermanence", "senses", "endurance", "equanimity"],
    },
    {
        "id": 7,
        "chapter": 3,
        "verse": 19,
        "text": "Therefore, without being attached to the fruits of activities, one should act as duty.",
        "translation": "तस्मादसक्तः सततं कार्यं कर्म समाचर",
        "theme": "duty",
        "reflection": "Act from a sense of duty rather than desire for personal gain.",
        "keywords": ["duty", "action", "detachment", "karma"],
    },
    {
        "id": 8,
        "chapter": 9,
        "verse": 22,
        "text": "To those who worship Me with devotion, meditating on My transcendental form, I carry what they lack.",
        "translation": "अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते",
        "theme": "devotion",
        "reflection": "Wholehearted devotion and focus bring divine support.",
        "keywords": ["devotion", "faith", "trust", "surrender"],
    },
    {
        "id": 9,
        "chapter": 5,
        "verse": 10,
        "text": "One who acts without attachment, surrendering actions to the Supreme, is untouched by sin.",
        "translation": "ब्रह्मण्याधाय कर्माणि सङ्गं त्यक्त्वा करोति यः",
        "theme": "surrender",
        "reflection": "Dedicate your actions to a higher purpose and find freedom.",
        "keywords": ["surrender", "detachment", "freedom", "purity"],
    },
    {
        "id": 10,
        "chapter": 18,
        "verse": 66,
        "text": "Abandon all varieties of dharmas and simply surrender unto Me; I shall deliver you from all sins.",
        "translation": "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज",
        "theme": "liberation",
        "reflection": "Ultimate peace comes from complete surrender to the divine.",
        "keywords": ["surrender", "liberation", "faith", "peace"],
    },
    {
        "id": 11,
        "chapter": 4,
        "verse": 7,
        "text": "Whenever there is a decline in righteousness, I manifest Myself.",
        "translation": "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत",
        "theme": "righteousness",
        "reflection": "Divine presence supports the restoration of balance and justice.",
        "keywords": ["righteousness", "dharma", "balance", "protection"],
    },
    {
        "id": 12,
        "chapter": 11,
        "verse": 33,
        "text": "Rise up and attain glory. Conquer your enemies and enjoy a prosperous kingdom.",
        "translation": "तस्मात्त्वमुत्तिष्ठ यशो लभस्व",
        "theme": "courage",
        "reflection": "Face your challenges with courage and claim your rightful place.",
        "keywords": ["courage", "strength", "victory", "glory"],
    },
    {
        "id": 13,
        "chapter": 14,
        "verse": 22,
        "text": "One who is beyond the three gunas neither hates nor desires their presence.",
        "translation": "उदासीनवदासीनो गुणैर्यो न विचाल्यते",
        "theme": "transcendence",
        "reflection": "Rise above the fluctuations of nature to find inner stability.",
        "keywords": ["transcendence", "gunas", "stability", "wisdom"],
    },
    {
        "id": 14,
        "chapter": 13,
        "verse": 28,
        "text": "One who sees the Supreme Lord dwelling equally in all beings, truly sees.",
        "translation": "समं सर्वेषु भूतेषु तिष्ठन्तं परमेश्वरम्",
        "theme": "unity",
        "reflection": "See the divine presence in all beings and cultivate universal love.",
        "keywords": ["unity", "equality", "vision", "divine"],
    },
]

# Journey templates with fallback configurations
JOURNEY_TEMPLATES = {
    "inner_peace": {
        "title": "Journey to Inner Peace",
        "description": "A transformative exploration of tranquility, acceptance, and letting go of anxiety through timeless wisdom.",
        "themes": ["peace", "calm", "equanimity", "acceptance"],
        "mood_range": (1, 5),
        "verse_indices": [0, 1, 3, 5, 8, 9, 12],
    },
    "self_discovery": {
        "title": "Path of Self-Discovery",
        "description": "Explore your true nature, purpose, and potential through reflective wisdom.",
        "themes": ["self", "identity", "purpose", "growth"],
        "mood_range": (4, 8),
        "verse_indices": [2, 3, 6, 10, 12, 13, 0],
    },
    "balanced_action": {
        "title": "Wisdom of Balanced Action",
        "description": "Learn to act without attachment, finding harmony between effort and surrender.",
        "themes": ["action", "karma", "balance", "duty"],
        "mood_range": (3, 7),
        "verse_indices": [0, 1, 6, 8, 10, 11, 2],
    },
    "resilience_strength": {
        "title": "Building Resilience and Strength",
        "description": "Discover your inner fortitude and learn to face life's challenges with courage.",
        "themes": ["courage", "strength", "resilience", "endurance"],
        "mood_range": (1, 4),
        "verse_indices": [2, 5, 11, 3, 6, 10, 0],
    },
    "joyful_living": {
        "title": "The Art of Joyful Living",
        "description": "Cultivate gratitude, contentment, and sustainable happiness in everyday life.",
        "themes": ["joy", "gratitude", "contentment", "happiness"],
        "mood_range": (6, 10),
        "verse_indices": [4, 7, 9, 13, 1, 8, 12],
    },
    "letting_go": {
        "title": "The Practice of Letting Go",
        "description": "Release attachments, embrace impermanence, and find freedom in non-clinging.",
        "themes": ["detachment", "freedom", "impermanence", "release"],
        "mood_range": (2, 6),
        "verse_indices": [0, 5, 8, 9, 1, 6, 12],
    },
    "relationship_harmony": {
        "title": "Harmony in Relationships",
        "description": "Cultivate compassion, understanding, and loving-kindness in all your relationships.",
        "themes": ["compassion", "love", "harmony", "kindness"],
        "mood_range": (4, 9),
        "verse_indices": [4, 7, 13, 9, 1, 8, 0],
    },
}


class WisdomJourneyEngine:
    """
    Standalone Wisdom Journey Engine with fallback capabilities.

    This engine can operate independently of the database using embedded wisdom data,
    making it resilient to database connection issues while still providing value to users.
    """

    def __init__(self) -> None:
        """Initialize the Wisdom Journey Engine."""
        self._use_fallback = False
        self._cache: dict[str, Any] = {}
        logger.info("WisdomJourneyEngine initialized")

    def _generate_deterministic_id(self, seed: str) -> str:
        """Generate a deterministic ID based on a seed string."""
        return hashlib.sha256(seed.encode()).hexdigest()[:32]

    async def check_database_health(self, db: AsyncSession | None) -> bool:
        """
        Check if database connection is healthy.

        Args:
            db: Database session or None

        Returns:
            True if database is healthy, False otherwise
        """
        if db is None:
            return False

        try:
            from backend.models import GitaVerse
            result = await db.execute(select(func.count()).select_from(GitaVerse))
            count = result.scalar()
            return count is not None and count > 0
        except Exception as e:
            logger.warning(f"Database health check failed: {e}")
            return False

    async def get_recommendations(
        self,
        db: AsyncSession | None,
        user_id: str,
        user_context: dict[str, Any] | None = None,
        limit: int = 3,
    ) -> list[dict[str, Any]]:
        """
        Get personalized journey recommendations with fallback support.

        Args:
            db: Database session (can be None for fallback mode)
            user_id: User ID
            user_context: Optional user context with mood data
            limit: Number of recommendations to return

        Returns:
            List of recommendation dictionaries
        """
        # Try database-backed recommendations first
        if db and await self.check_database_health(db):
            try:
                from backend.services.wisdom_journey_service import WisdomJourneyService
                service = WisdomJourneyService()
                return await service.get_journey_recommendations(db, user_id, limit)
            except Exception as e:
                logger.warning(f"Database recommendation failed, using fallback: {e}")

        # Fallback to embedded recommendations
        return self._get_fallback_recommendations(user_context, limit)

    def _get_fallback_recommendations(
        self,
        user_context: dict[str, Any] | None,
        limit: int = 3,
    ) -> list[dict[str, Any]]:
        """
        Generate recommendations using embedded data when database is unavailable.

        Args:
            user_context: Optional user context
            limit: Number of recommendations

        Returns:
            List of recommendation dictionaries
        """
        mood_avg = 5.0  # Default neutral mood
        if user_context:
            mood_avg = user_context.get("mood_average", 5.0)

        recommendations = []
        scored_templates = []

        for template_key, template_config in JOURNEY_TEMPLATES.items():
            score = 0.5  # Base score
            reason = "a balanced starting point"

            # Score based on mood range
            mood_min, mood_max = template_config["mood_range"]
            if mood_min <= mood_avg <= mood_max:
                score += 0.3
                reason = "matches your current emotional state"
            elif abs(mood_avg - (mood_min + mood_max) / 2) < 2:
                score += 0.15
                reason = "aligns with your mood"

            scored_templates.append({
                "template": template_key,
                "title": template_config["title"],
                "description": template_config["description"],
                "score": min(score, 1.0),
                "reason": reason,
            })

        # Sort by score and return top recommendations
        scored_templates.sort(key=lambda x: x["score"], reverse=True)
        return scored_templates[:limit]

    async def generate_journey(
        self,
        db: AsyncSession | None,
        user_id: str,
        template: str = "inner_peace",
        duration_days: int = 7,
        custom_title: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate a personalized wisdom journey with fallback support.

        Args:
            db: Database session (can be None for fallback mode)
            user_id: User ID
            template: Journey template key
            duration_days: Number of days/steps
            custom_title: Optional custom title

        Returns:
            Journey dictionary with steps
        """
        # Try database-backed generation first
        if db and await self.check_database_health(db):
            try:
                from backend.services.wisdom_journey_service import WisdomJourneyService
                service = WisdomJourneyService()
                journey = await service.generate_personalized_journey(
                    db=db,
                    user_id=user_id,
                    duration_days=duration_days,
                    custom_title=custom_title,
                )
                steps = await service.get_journey_steps(db, journey.id)

                return {
                    "id": journey.id,
                    "user_id": journey.user_id,
                    "title": journey.title,
                    "description": journey.description,
                    "total_steps": journey.total_steps,
                    "current_step": journey.current_step,
                    "status": journey.status.value,
                    "progress_percentage": journey.progress_percentage,
                    "created_at": journey.created_at.isoformat(),
                    "steps": [
                        {
                            "id": step.id,
                            "step_number": step.step_number,
                            "verse_id": step.verse_id,
                            "reflection_prompt": step.reflection_prompt,
                            "ai_insight": step.ai_insight,
                            "completed": step.completed,
                        }
                        for step in steps
                    ],
                    "source": "database",
                }
            except Exception as e:
                logger.warning(f"Database journey generation failed, using fallback: {e}")

        # Fallback to embedded journey
        return self._generate_fallback_journey(user_id, template, duration_days, custom_title)

    def _generate_fallback_journey(
        self,
        user_id: str,
        template: str = "inner_peace",
        duration_days: int = 7,
        custom_title: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate a journey using embedded wisdom data.

        Args:
            user_id: User ID
            template: Journey template key
            duration_days: Number of steps
            custom_title: Optional custom title

        Returns:
            Journey dictionary with steps
        """
        if template not in JOURNEY_TEMPLATES:
            template = "inner_peace"

        template_config = JOURNEY_TEMPLATES[template]
        journey_id = str(uuid.uuid4())

        title = custom_title or template_config["title"]
        description = template_config["description"]

        # Get verses for this journey
        verse_indices = template_config["verse_indices"]
        selected_verses = []

        for i in range(min(duration_days, len(verse_indices))):
            idx = verse_indices[i % len(verse_indices)]
            if idx < len(EMBEDDED_WISDOM_VERSES):
                selected_verses.append(EMBEDDED_WISDOM_VERSES[idx])

        # Fill remaining steps if needed
        while len(selected_verses) < duration_days:
            random_verse = random.choice(EMBEDDED_WISDOM_VERSES)
            if random_verse not in selected_verses:
                selected_verses.append(random_verse)

        # Generate steps
        steps = []
        for i, verse in enumerate(selected_verses[:duration_days], start=1):
            step_id = str(uuid.uuid4())
            steps.append({
                "id": step_id,
                "step_number": i,
                "verse_id": verse["id"],
                "verse_text": verse["text"],
                "verse_translation": verse["translation"],
                "verse_chapter": verse["chapter"],
                "verse_number": verse["verse"],
                "reflection_prompt": verse.get("reflection", "Reflect on how this wisdom applies to your life today."),
                "ai_insight": f"This verse from Chapter {verse['chapter']}, Verse {verse['verse']} offers guidance on {verse['theme']}.",
                "completed": False,
                "completed_at": None,
            })

        now = datetime.datetime.now(datetime.UTC).isoformat()

        return {
            "id": journey_id,
            "user_id": user_id,
            "title": title,
            "description": description,
            "total_steps": len(steps),
            "current_step": 0,
            "status": "active",
            "progress_percentage": 0,
            "recommended_by": "engine",
            "recommendation_score": 0.8,
            "recommendation_reason": "Based on embedded wisdom patterns",
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
            "steps": steps,
            "source": "fallback",
        }

    async def get_active_journey(
        self,
        db: AsyncSession | None,
        user_id: str,
    ) -> dict[str, Any] | None:
        """
        Get user's active journey with fallback support.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Journey dictionary or None
        """
        # Check cache first
        cache_key = f"active_journey_{user_id}"
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            if cached.get("status") == "active":
                return cached

        # Try database
        if db and await self.check_database_health(db):
            try:
                from backend.services.wisdom_journey_service import WisdomJourneyService
                from backend.models import GitaVerse

                service = WisdomJourneyService()
                journey = await service.get_active_journey(db, user_id)

                if not journey:
                    return None

                steps = await service.get_journey_steps(db, journey.id)

                steps_with_verses = []
                for step in steps:
                    verse_data = {}
                    if step.verse_id:
                        verse = await db.get(GitaVerse, step.verse_id)
                        if verse:
                            verse_data = {
                                "verse_text": verse.text,
                                "verse_translation": verse.transliteration,
                                "verse_chapter": verse.chapter,
                                "verse_number": verse.verse,
                            }

                    steps_with_verses.append({
                        "id": step.id,
                        "step_number": step.step_number,
                        "verse_id": step.verse_id,
                        **verse_data,
                        "reflection_prompt": step.reflection_prompt,
                        "ai_insight": step.ai_insight,
                        "completed": step.completed,
                        "completed_at": step.completed_at.isoformat() if step.completed_at else None,
                    })

                result = {
                    "id": journey.id,
                    "user_id": journey.user_id,
                    "title": journey.title,
                    "description": journey.description,
                    "total_steps": journey.total_steps,
                    "current_step": journey.current_step,
                    "status": journey.status.value,
                    "progress_percentage": journey.progress_percentage,
                    "created_at": journey.created_at.isoformat(),
                    "steps": steps_with_verses,
                    "source": "database",
                }

                self._cache[cache_key] = result
                return result

            except Exception as e:
                logger.warning(f"Database active journey fetch failed: {e}")

        # Check for cached fallback journey
        if cache_key in self._cache:
            return self._cache[cache_key]

        return None

    def cache_journey(self, user_id: str, journey: dict[str, Any]) -> None:
        """
        Cache a journey for the user (useful for fallback mode).

        Args:
            user_id: User ID
            journey: Journey dictionary
        """
        cache_key = f"active_journey_{user_id}"
        self._cache[cache_key] = journey

    def clear_cache(self, user_id: str | None = None) -> None:
        """
        Clear journey cache.

        Args:
            user_id: Optional user ID to clear specific cache, None clears all
        """
        if user_id:
            cache_key = f"active_journey_{user_id}"
            self._cache.pop(cache_key, None)
        else:
            self._cache.clear()

    def get_verse_for_step(self, step_number: int, template: str = "inner_peace") -> dict[str, Any]:
        """
        Get verse data for a specific step using embedded data.

        Args:
            step_number: Step number (1-indexed)
            template: Journey template

        Returns:
            Verse dictionary
        """
        if template not in JOURNEY_TEMPLATES:
            template = "inner_peace"

        template_config = JOURNEY_TEMPLATES[template]
        verse_indices = template_config["verse_indices"]

        idx = (step_number - 1) % len(verse_indices)
        verse_idx = verse_indices[idx]

        if verse_idx < len(EMBEDDED_WISDOM_VERSES):
            return EMBEDDED_WISDOM_VERSES[verse_idx].copy()

        return EMBEDDED_WISDOM_VERSES[0].copy()

    def generate_kiaan_insight(
        self,
        verse: dict[str, Any],
        user_context: dict[str, Any] | None = None,
    ) -> str:
        """
        Generate a KIAAN-style insight for a verse.

        Args:
            verse: Verse dictionary
            user_context: Optional user context

        Returns:
            AI insight string
        """
        theme = verse.get("theme", "wisdom")
        chapter = verse.get("chapter", 0)
        verse_num = verse.get("verse", 0)

        insights = [
            f"This sacred teaching from Chapter {chapter}, Verse {verse_num} illuminates the path of {theme}. As you contemplate these words, allow them to resonate with your inner self.",
            f"Lord Krishna's wisdom on {theme} reminds us that true peace comes from within. Take a moment to breathe and let this verse guide your meditation.",
            f"In this profound verse, we discover the timeless truth about {theme}. Consider how this wisdom applies to your current life journey.",
            f"The Bhagavad Gita teaches us about {theme} in this beautiful verse. Reflect on how you can embody this teaching today.",
        ]

        return random.choice(insights)


# Singleton instance for global access
_engine_instance: WisdomJourneyEngine | None = None


def get_wisdom_journey_engine() -> WisdomJourneyEngine:
    """
    Get the singleton Wisdom Journey Engine instance.

    Returns:
        WisdomJourneyEngine instance
    """
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = WisdomJourneyEngine()
    return _engine_instance
