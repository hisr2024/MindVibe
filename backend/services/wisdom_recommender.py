"""
Wisdom Recommender - ML-powered recommendation engine for personalized wisdom journeys.

Provides intelligent verse selection and journey template recommendations based on
user mood patterns, emotional states, and journal themes using semantic similarity
and rule-based heuristics.
"""

import logging
import random
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import GitaVerse, GitaVerseKeyword, GitaKeyword
from backend.services.gita_service import GitaService

logger = logging.getLogger(__name__)


# Journey templates with associated themes and verse selection criteria
JOURNEY_TEMPLATES = {
    "inner_peace": {
        "title": "Journey to Inner Peace",
        "description": "A 7-day exploration of tranquility, acceptance, and letting go of anxiety through timeless wisdom.",
        "themes": ["anxiety", "stress", "worry", "fear", "peace", "calm"],
        "mood_range": (1, 5),  # Low to mid-range moods
        "keywords": ["peace", "calm", "equanimity", "serenity", "stillness"],
        "chapters": [2, 6, 12],  # Chapters focused on inner peace
    },
    "resilience_strength": {
        "title": "Building Resilience and Strength",
        "description": "Discover your inner fortitude and learn to face life's challenges with courage and grace.",
        "themes": ["depression", "sadness", "grief", "loss", "strength", "courage"],
        "mood_range": (1, 4),  # Low moods
        "keywords": ["courage", "strength", "perseverance", "determination", "resilience"],
        "chapters": [2, 3, 11],  # Duty, action, strength
    },
    "joyful_living": {
        "title": "The Art of Joyful Living",
        "description": "Cultivate gratitude, contentment, and sustainable happiness in everyday life.",
        "themes": ["gratitude", "joy", "happiness", "contentment", "celebration"],
        "mood_range": (6, 10),  # Mid to high moods
        "keywords": ["joy", "happiness", "contentment", "bliss", "gratitude"],
        "chapters": [9, 12, 14],  # Devotion, wisdom, qualities
    },
    "self_discovery": {
        "title": "Path of Self-Discovery",
        "description": "Explore your true nature, purpose, and potential through reflective wisdom.",
        "themes": ["identity", "purpose", "meaning", "self", "growth"],
        "mood_range": (4, 8),  # Neutral to positive moods
        "keywords": ["self", "atman", "knowledge", "wisdom", "understanding"],
        "chapters": [4, 5, 13],  # Knowledge, renunciation, field
    },
    "balanced_action": {
        "title": "Wisdom of Balanced Action",
        "description": "Learn to act without attachment, finding harmony between effort and surrender.",
        "themes": ["work", "action", "balance", "karma", "duty"],
        "mood_range": (3, 7),  # Broad range
        "keywords": ["action", "karma", "work", "duty", "detachment"],
        "chapters": [3, 4, 5],  # Karma yoga
    },
    "relationship_harmony": {
        "title": "Harmony in Relationships",
        "description": "Cultivate compassion, understanding, and loving-kindness in all your relationships.",
        "themes": ["relationships", "love", "compassion", "family", "friends"],
        "mood_range": (4, 9),  # Generally positive
        "keywords": ["love", "compassion", "friendship", "unity", "devotion"],
        "chapters": [9, 11, 12],  # Devotion and bhakti
    },
    "letting_go": {
        "title": "The Practice of Letting Go",
        "description": "Release attachments, embrace impermanence, and find freedom in non-clinging.",
        "themes": ["attachment", "loss", "change", "impermanence", "freedom"],
        "mood_range": (2, 6),  # Lower to mid range
        "keywords": ["detachment", "renunciation", "freedom", "liberation", "vairagya"],
        "chapters": [5, 6, 18],  # Renunciation
    },
}


class WisdomRecommender:
    """ML-powered recommender for wisdom journeys and verses."""

    def __init__(self) -> None:
        """Initialize the wisdom recommender."""
        self.gita_service = GitaService()

    async def recommend_journey_template(self, user_context: dict[str, Any]) -> dict[str, Any]:
        """
        Recommend the best journey template based on user context.

        Args:
            user_context: User context with mood_average, mood_trend, themes, emotion_tags

        Returns:
            Dict with template, title, description, score, reason
        """
        mood_avg = user_context.get("mood_average", 5.0)
        themes = set(user_context.get("themes", []))
        emotion_tags = set(user_context.get("emotion_tags", []))

        best_template = None
        best_score = 0.0
        best_reason = ""

        # Score each template
        for template_key, template_config in JOURNEY_TEMPLATES.items():
            score = 0.0
            reasons = []

            # 1. Mood range match (0-40 points)
            mood_min, mood_max = template_config["mood_range"]
            if mood_min <= mood_avg <= mood_max:
                score += 40
                reasons.append("matches your current emotional state")
            elif abs(mood_avg - (mood_min + mood_max) / 2) < 2:
                score += 20  # Close match
                reasons.append("aligns with your mood")

            # 2. Theme overlap (0-40 points)
            template_themes = set(template_config["themes"])
            theme_overlap = len(themes.intersection(template_themes))
            emotion_overlap = len(emotion_tags.intersection(template_themes))

            overlap_score = min((theme_overlap + emotion_overlap) / len(template_themes), 1.0) * 40
            score += overlap_score

            if overlap_score > 0:
                reasons.append(f"addresses themes you've explored: {', '.join(list((themes | emotion_tags) & template_themes)[:2])}")

            # 3. Mood trend bonus (0-20 points)
            mood_trend = user_context.get("mood_trend", "neutral")
            if mood_trend == "declining" and template_key in ["inner_peace", "resilience_strength"]:
                score += 20
                reasons.append("provides support for challenging times")
            elif mood_trend == "improving" and template_key in ["joyful_living", "balanced_action"]:
                score += 15
                reasons.append("helps sustain your positive momentum")

            # Track best
            if score > best_score:
                best_score = score
                best_template = template_key
                best_reason = " and ".join(reasons) if reasons else "a balanced starting point"

        # Default to self_discovery if no good match
        if best_template is None:
            best_template = "self_discovery"
            best_reason = "a comprehensive exploration of wisdom"

        template_config = JOURNEY_TEMPLATES[best_template]

        logger.info(f"Recommended journey template: {best_template} (score: {best_score:.2f})")

        return {
            "template": best_template,
            "title": template_config["title"],
            "description": template_config["description"],
            "score": min(best_score / 100, 1.0),  # Normalize to 0-1
            "reason": best_reason,
        }

    async def select_journey_verses(
        self, db: AsyncSession, user_context: dict[str, Any], num_verses: int = 7
    ) -> list[int]:
        """
        Select the most relevant verses for a journey based on user context.

        Args:
            db: Database session
            user_context: User context dict
            num_verses: Number of verses to select

        Returns:
            List of GitaVerse IDs
        """
        # Get recommended template
        template = await self.recommend_journey_template(user_context)
        template_config = JOURNEY_TEMPLATES[template["template"]]

        # Extract keywords and chapters from template
        keywords = template_config["keywords"]
        chapters = template_config["chapters"]

        logger.info(f"Selecting {num_verses} verses from chapters {chapters} with keywords {keywords}")

        # Query verses from recommended chapters with keyword matches
        verse_ids: list[int] = []

        # Strategy: Get verses from each chapter proportionally
        verses_per_chapter = num_verses // len(chapters)
        remainder = num_verses % len(chapters)

        for i, chapter in enumerate(chapters):
            count = verses_per_chapter + (1 if i < remainder else 0)

            # Get verses from this chapter with keyword matches
            keyword_result = await db.execute(
                select(GitaVerseKeyword.verse_id)
                .join(GitaKeyword, GitaVerseKeyword.keyword_id == GitaKeyword.id)
                .join(GitaVerse, GitaVerseKeyword.verse_id == GitaVerse.id)
                .where(
                    and_(
                        GitaVerse.chapter == chapter,
                        GitaKeyword.keyword.in_(keywords),
                    )
                )
                .distinct()
            )
            matching_verse_ids = [row[0] for row in keyword_result.all()]

            if len(matching_verse_ids) >= count:
                # Have enough matching verses, sample them
                selected = random.sample(matching_verse_ids, count)
                verse_ids.extend(selected)
            else:
                # Not enough keyword matches, get random verses from chapter
                verse_ids.extend(matching_verse_ids)  # Add all matches

                # Fill remaining with random verses from chapter
                remaining_needed = count - len(matching_verse_ids)
                if remaining_needed > 0:
                    random_result = await db.execute(
                        select(GitaVerse.id)
                        .where(
                            and_(
                                GitaVerse.chapter == chapter,
                                GitaVerse.id.notin_(matching_verse_ids),
                            )
                        )
                        .order_by(func.random())
                        .limit(remaining_needed)
                    )
                    random_verse_ids = [row[0] for row in random_result.all()]
                    verse_ids.extend(random_verse_ids)

        # If still short (rare case), fill with any relevant verses
        if len(verse_ids) < num_verses:
            shortfall = num_verses - len(verse_ids)
            fallback_result = await db.execute(
                select(GitaVerse.id)
                .where(GitaVerse.id.notin_(verse_ids))
                .order_by(func.random())
                .limit(shortfall)
            )
            fallback_ids = [row[0] for row in fallback_result.all()]
            verse_ids.extend(fallback_ids)

        # Ensure we have exactly num_verses
        verse_ids = verse_ids[:num_verses]

        logger.info(f"Selected {len(verse_ids)} verses for journey: {verse_ids}")

        return verse_ids

    async def generate_recommendations(
        self, user_context: dict[str, Any], limit: int = 3
    ) -> list[dict[str, Any]]:
        """
        Generate multiple journey recommendations for user to choose from.

        Args:
            user_context: User context dict
            limit: Number of recommendations to return

        Returns:
            List of recommendation dicts sorted by relevance score
        """
        recommendations = []

        # Get primary recommendation
        primary = await self.recommend_journey_template(user_context)
        recommendations.append(primary)

        # Get alternative recommendations
        mood_avg = user_context.get("mood_average", 5.0)

        # Always include balanced_action as a good general choice
        if primary["template"] != "balanced_action":
            balanced_config = JOURNEY_TEMPLATES["balanced_action"]
            recommendations.append({
                "template": "balanced_action",
                "title": balanced_config["title"],
                "description": balanced_config["description"],
                "score": 0.7,
                "reason": "a versatile path for all situations",
            })

        # Add mood-appropriate alternative
        if mood_avg < 5 and primary["template"] not in ["inner_peace", "resilience_strength"]:
            # Recommend inner_peace for low moods
            peace_config = JOURNEY_TEMPLATES["inner_peace"]
            recommendations.append({
                "template": "inner_peace",
                "title": peace_config["title"],
                "description": peace_config["description"],
                "score": 0.65,
                "reason": "gentle support for challenging times",
            })
        elif mood_avg >= 7 and primary["template"] != "joyful_living":
            # Recommend joyful_living for high moods
            joy_config = JOURNEY_TEMPLATES["joyful_living"]
            recommendations.append({
                "template": "joyful_living",
                "title": joy_config["title"],
                "description": joy_config["description"],
                "score": 0.65,
                "reason": "celebrate and deepen your positive state",
            })
        else:
            # Default: self_discovery
            if primary["template"] != "self_discovery":
                discovery_config = JOURNEY_TEMPLATES["self_discovery"]
                recommendations.append({
                    "template": "self_discovery",
                    "title": discovery_config["title"],
                    "description": discovery_config["description"],
                    "score": 0.6,
                    "reason": "explore deeper questions and purpose",
                })

        # Sort by score and limit
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:limit]
