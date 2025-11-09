"""Metadata enrichment component for Context Transformation Pipeline."""

import re


class MetadataEnricher:
    """Enriches verse data with additional metadata."""

    # Chapter themes
    CHAPTER_THEMES = {
        1: "grief_and_yoga",
        2: "wisdom_and_knowledge",
        3: "action_and_duty",
        4: "knowledge_and_wisdom",
        5: "renunciation_and_action",
        6: "meditation_and_self_control",
        7: "knowledge_and_realization",
        8: "the_imperishable_absolute",
        9: "sovereign_knowledge",
        10: "divine_manifestations",
        11: "universal_form",
        12: "devotion",
        13: "field_and_knower",
        14: "three_modes",
        15: "supreme_person",
        16: "divine_and_demonic",
        17: "three_types_of_faith",
        18: "liberation",
    }

    @classmethod
    def extract_principles(cls, verse_data: dict) -> list[str]:
        """Extract key principles from verse content."""
        principles = []

        # Extract from theme
        if "theme" in verse_data:
            theme = verse_data["theme"]
            principles.append(theme.replace("_", " "))

        # Extract from context
        if "context" in verse_data:
            context = verse_data["context"].lower()
            if "action" in context or "duty" in context:
                principles.append("action")
            if "detach" in context:
                principles.append("detachment")
            if "peace" in context:
                principles.append("peace")

        return principles

    @classmethod
    def extract_keywords(cls, verse_data: dict) -> list[str]:
        """Extract keywords from verse text."""
        keywords = []

        # Combine text fields
        text = ""
        for field in ["english", "context"]:
            if field in verse_data:
                text += " " + verse_data[field]

        # Extract meaningful words (3+ characters)
        words = re.findall(r"\b\w{3,}\b", text.lower())

        # Filter out common stop words
        stop_words = {
            "the",
            "and",
            "for",
            "that",
            "with",
            "this",
            "from",
            "you",
            "your",
            "are",
            "not",
        }
        keywords = [w for w in words if w not in stop_words]

        # Remove duplicates while preserving order
        seen = set()
        unique_keywords = []
        for kw in keywords:
            if kw not in seen:
                seen.add(kw)
                unique_keywords.append(kw)

        return unique_keywords[:10]  # Limit to top 10

    @classmethod
    def suggest_applications(cls, verse_data: dict) -> list[str]:
        """Suggest mental health applications based on content."""
        suggestions = []

        # Get existing applications
        existing = verse_data.get("mental_health_applications", {})
        if isinstance(existing, dict):
            existing_apps = existing.get("applications", [])
        else:
            existing_apps = existing if isinstance(existing, list) else []

        # Check content for application hints
        text = ""
        for field in ["english", "context"]:
            if field in verse_data:
                text += " " + verse_data[field].lower()

        # Suggest based on keywords
        if "anxiety" in text or "worry" in text or "fear" in text:
            suggestions.append("anxiety_management")
        if "stress" in text or "calm" in text:
            suggestions.append("stress_reduction")
        if "peace" in text:
            suggestions.append("inner_peace")
        if "confidence" in text or "self" in text:
            suggestions.append("self_confidence")

        # Combine with existing, avoiding duplicates
        all_apps = list(set(existing_apps + suggestions))
        return all_apps

    @classmethod
    def create_searchable_text(cls, verse_data: dict) -> str:
        """Create searchable text combining all relevant fields."""
        parts = []

        # Add text fields
        for field in ["english", "hindi", "context"]:
            if field in verse_data and verse_data[field]:
                parts.append(verse_data[field])

        # Add theme
        if "theme" in verse_data:
            parts.append(verse_data["theme"])

        # Add applications
        apps = verse_data.get("mental_health_applications", {})
        if isinstance(apps, dict):
            apps_list = apps.get("applications", [])
        else:
            apps_list = apps if isinstance(apps, list) else []
        parts.extend(apps_list)

        return " ".join(parts)

    @classmethod
    def add_chapter_context(cls, verse_data: dict) -> dict:
        """Add chapter-level context to verse."""
        chapter = verse_data.get("chapter")
        if chapter:
            verse_data["chapter_theme"] = cls.CHAPTER_THEMES.get(
                chapter, "unknown_theme"
            )
        return verse_data

    @classmethod
    def calculate_metadata_score(cls, verse_data: dict) -> float:
        """Calculate metadata completeness score."""
        score = 0.0
        weights = {
            "english": 0.15,
            "hindi": 0.10,
            "sanskrit": 0.10,
            "context": 0.15,
            "theme": 0.10,
            "mental_health_applications": 0.15,
            "principles": 0.10,
            "keywords": 0.10,
            "chapter_theme": 0.05,
        }

        for field, weight in weights.items():
            if field in verse_data:
                value = verse_data[field]
                if value:
                    if isinstance(value, (list, dict)):
                        if len(value) > 0:
                            score += weight
                    else:
                        score += weight

        return min(1.0, score)

    @classmethod
    def enrich(cls, verse_data: dict) -> dict:
        """Enrich verse data with all metadata."""
        enriched = verse_data.copy()

        # Add extracted data
        enriched["principles"] = cls.extract_principles(verse_data)
        enriched["keywords"] = cls.extract_keywords(verse_data)
        enriched["suggested_applications"] = cls.suggest_applications(verse_data)
        enriched["searchable_text"] = cls.create_searchable_text(verse_data)

        # Add chapter context
        enriched = cls.add_chapter_context(enriched)

        # Add metadata score
        enriched["metadata_score"] = cls.calculate_metadata_score(enriched)

        return enriched
