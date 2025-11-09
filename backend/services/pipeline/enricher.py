"""Metadata enrichment component for verse data."""

import re
from typing import Any


class MetadataEnricher:
    """Enriches verse data with additional metadata and searchable content."""

    CHAPTER_THEMES = {
        1: "emotional_crisis_moral_conflict",
        2: "wisdom_and_knowledge",
        3: "selfless_action",
        4: "knowledge_wisdom",
        5: "action_renunciation",
        6: "meditation_mindfulness",
        7: "self_knowledge",
        8: "attaining_supreme",
        9: "sovereign_knowledge",
        10: "divine_manifestations",
        11: "universal_form",
        12: "devotion",
        13: "matter_spirit",
        14: "three_modes",
        15: "supreme_person",
        16: "divine_demoniac_natures",
        17: "three_divisions_faith",
        18: "liberation_renunciation",
    }

    MENTAL_HEALTH_KEYWORDS = {
        "anxiety_management": ["anxiety", "worry", "fear", "anxious"],
        "stress_reduction": ["stress", "tension", "pressure", "overwhelm"],
        "stress_management": ["stress", "calm", "peace", "relaxation"],
        "emotional_resilience": ["resilience", "strength", "endurance"],
        "mindfulness": ["mindfulness", "awareness", "present", "attention"],
        "meditation": ["meditation", "contemplation", "reflection"],
    }

    @classmethod
    def extract_principles(cls, verse: dict[str, Any]) -> list[str]:
        """Extract key principles from verse content."""
        principles = []

        # Extract from theme
        if "theme" in verse:
            theme = verse["theme"].lower()
            principles.extend(theme.split("_"))

        # Extract from context
        if "context" in verse:
            context = verse["context"].lower()
            # Simple keyword extraction
            for word in ["action", "knowledge", "detachment", "wisdom", "peace"]:
                if word in context:
                    principles.append(word)

        return list(set(principles))[:5]  # Limit to top 5 unique

    @classmethod
    def extract_keywords(cls, verse: dict[str, Any]) -> list[str]:
        """Extract keywords from verse text."""
        keywords = []

        # Extract from english text
        if "english" in verse:
            text = verse["english"].lower()
            # Simple word extraction (remove common words)
            words = re.findall(r"\b\w+\b", text)
            common_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "is", "are", "was", "were"}
            keywords = [w for w in words if w not in common_words and len(w) > 3]

        return keywords[:10]  # Limit to top 10

    @classmethod
    def suggest_applications(cls, verse: dict[str, Any]) -> list[str]:
        """Suggest mental health applications based on content."""
        suggestions = []

        # Check existing applications
        existing_apps = set()
        if "mental_health_applications" in verse:
            apps = verse["mental_health_applications"]
            if isinstance(apps, dict) and "applications" in apps:
                existing_apps = set(apps["applications"])
            elif isinstance(apps, list):
                existing_apps = set(apps)

        # Search for keywords in text
        text = ""
        if "english" in verse:
            text += verse["english"].lower() + " "
        if "context" in verse:
            text += verse["context"].lower() + " "

        for app_name, keywords in cls.MENTAL_HEALTH_KEYWORDS.items():
            if app_name not in existing_apps:
                if any(keyword in text for keyword in keywords):
                    suggestions.append(app_name)

        return suggestions

    @classmethod
    def create_searchable_text(cls, verse: dict[str, Any]) -> str:
        """Create searchable text combining all relevant fields."""
        parts = []

        for field in ["english", "hindi", "context"]:
            if field in verse and verse[field]:
                parts.append(str(verse[field]))

        # Add theme
        if "theme" in verse:
            parts.append(verse["theme"])

        # Add applications
        if "mental_health_applications" in verse:
            apps = verse["mental_health_applications"]
            if isinstance(apps, dict) and "applications" in apps:
                parts.extend(apps["applications"])
            elif isinstance(apps, list):
                parts.extend(apps)

        return " ".join(parts)

    @classmethod
    def add_chapter_context(cls, verse: dict[str, Any]) -> dict[str, Any]:
        """Add chapter-level context."""
        result = verse.copy()

        if "chapter" in verse:
            chapter_num = verse["chapter"]
            if chapter_num in cls.CHAPTER_THEMES:
                result["chapter_theme"] = cls.CHAPTER_THEMES[chapter_num]

        return result

    @classmethod
    def calculate_metadata_score(cls, verse: dict[str, Any]) -> float:
        """Calculate metadata completeness score."""
        score = 0.0
        max_score = 10.0

        # Check for various fields
        if verse.get("english"):
            score += 1.0
        if verse.get("hindi"):
            score += 1.0
        if verse.get("sanskrit"):
            score += 1.0
        if verse.get("context"):
            score += 1.0
        if verse.get("theme"):
            score += 1.0

        # Check enriched fields
        if verse.get("mental_health_applications"):
            apps = verse["mental_health_applications"]
            app_list = apps.get("applications", []) if isinstance(apps, dict) else apps
            score += min(len(app_list) * 0.5, 2.0)

        if verse.get("principles"):
            score += min(len(verse["principles"]) * 0.2, 1.0)

        if verse.get("keywords"):
            score += min(len(verse["keywords"]) * 0.1, 1.0)

        if verse.get("chapter_theme"):
            score += 1.0

        return min(score / max_score, 1.0)

    @classmethod
    def enrich(cls, verse: dict[str, Any]) -> dict[str, Any]:
        """Enrich verse with additional metadata."""
        result = verse.copy()

        # Extract principles
        result["principles"] = cls.extract_principles(result)

        # Extract keywords
        result["keywords"] = cls.extract_keywords(result)

        # Suggest applications
        result["suggested_applications"] = cls.suggest_applications(result)

        # Create searchable text
        result["searchable_text"] = cls.create_searchable_text(result)

        # Add chapter context
        result = cls.add_chapter_context(result)

        # Calculate metadata score
        result["metadata_score"] = cls.calculate_metadata_score(result)

        return result
