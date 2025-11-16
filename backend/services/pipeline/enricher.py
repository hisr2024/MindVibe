"""Metadata enrichment module for the pipeline."""

import re


class MetadataEnricher:
    """Enriches verse data with metadata and additional information."""

    # Mental health application keywords
    APPLICATION_KEYWORDS = {
        "anxiety_management": ["anxiety", "worry", "fear", "nervous"],
        "stress_reduction": ["stress", "calm", "relax", "peace"],
        "emotional_regulation": ["emotion", "feeling", "mood", "balance"],
        "depression_support": ["depression", "sadness", "despair", "hopeless"],
        "anger_management": ["anger", "rage", "fury", "frustration"],
        "self_esteem": ["confidence", "self", "worth", "value"],
    }

    @classmethod
    def extract_principles(cls, verse: dict) -> list[str]:
        """
        Extract key principles from verse content.

        Args:
            verse: Verse dictionary

        Returns:
            List of principle keywords
        """
        text = " ".join(
            [
                verse.get("english", ""),
                verse.get("context", ""),
                verse.get("theme", ""),
            ]
        ).lower()

        # Common principle keywords
        principle_keywords = [
            "action",
            "duty",
            "detachment",
            "peace",
            "wisdom",
            "knowledge",
            "meditation",
            "discipline",
            "devotion",
            "equanimity",
            "compassion",
            "selflessness",
            "mindfulness",
        ]

        found_principles = [kw for kw in principle_keywords if kw in text]
        return found_principles

    @classmethod
    def extract_keywords(cls, verse: dict) -> list[str]:
        """
        Extract important keywords from verse text.

        Args:
            verse: Verse dictionary

        Returns:
            List of keywords
        """
        text = " ".join(
            [
                verse.get("english", ""),
                verse.get("context", ""),
            ]
        ).lower()

        # Remove punctuation and split into words
        words = re.findall(r"\b\w+\b", text)

        # Filter out common words and keep meaningful ones (> 4 chars)
        stop_words = {
            "the",
            "and",
            "that",
            "this",
            "with",
            "from",
            "your",
            "about",
            "through",
        }
        keywords = [w for w in words if len(w) > 4 and w not in stop_words]

        # Return unique keywords
        return list(set(keywords))[:10]  # Limit to top 10

    @classmethod
    def suggest_applications(cls, verse: dict) -> list[str]:
        """
        Suggest mental health applications based on content.

        Args:
            verse: Verse dictionary

        Returns:
            List of suggested application names
        """
        text = " ".join(
            [
                verse.get("english", ""),
                verse.get("context", ""),
            ]
        ).lower()

        suggestions = []
        for app_name, keywords in cls.APPLICATION_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                suggestions.append(app_name)

        return suggestions

    @classmethod
    def create_searchable_text(cls, verse: dict) -> str:
        """
        Create combined searchable text from all verse fields.

        Args:
            verse: Verse dictionary

        Returns:
            Combined searchable text
        """
        parts = []

        # Add text fields
        for field in ["english", "hindi", "context"]:
            if field in verse and verse[field]:
                parts.append(verse[field])

        # Add theme
        if "theme" in verse:
            parts.append(verse["theme"].replace("_", " "))

        # Add applications
        if "mental_health_applications" in verse:
            apps = verse["mental_health_applications"]
            if isinstance(apps, dict):
                parts.extend(apps.get("applications", []))
            elif isinstance(apps, list):
                parts.extend(apps)

        return " ".join(parts)

    @classmethod
    def add_chapter_context(cls, verse: dict) -> dict:
        """
        Add chapter context and theme to verse.

        Args:
            verse: Verse dictionary

        Returns:
            Verse with chapter context added
        """
        result = verse.copy()

        # Chapter themes mapping
        chapter_themes = {
            1: "introduction_and_grief",
            2: "wisdom_and_knowledge",
            3: "karma_yoga",
            4: "wisdom_in_action",
            5: "renunciation",
            6: "meditation",
            7: "knowledge_and_wisdom",
            8: "attaining_supreme",
            9: "sovereign_knowledge",
            10: "divine_manifestations",
            11: "cosmic_vision",
            12: "devotion",
            13: "field_and_knower",
            14: "three_modes",
            15: "supreme_person",
            16: "divine_and_demonic",
            17: "three_faiths",
            18: "liberation_and_renunciation",
        }

        chapter = verse.get("chapter")
        if chapter and chapter in chapter_themes:
            result["chapter_theme"] = chapter_themes[chapter]

        return result

    @classmethod
    def calculate_metadata_score(cls, verse: dict) -> float:
        """
        Calculate metadata completeness score for a verse.

        Args:
            verse: Verse dictionary

        Returns:
            Score between 0.0 and 1.0
        """
        score = 0.0
        max_score = 10.0

        # Core text fields (3 points total)
        if verse.get("english"):
            score += 1.0
        if verse.get("hindi"):
            score += 1.0
        if verse.get("sanskrit"):
            score += 1.0

        # Context and theme (2 points total)
        if verse.get("context"):
            score += 1.0
        if verse.get("theme"):
            score += 1.0

        # Mental health applications (1 point)
        apps = verse.get("mental_health_applications", {})
        if isinstance(apps, dict):
            app_list = apps.get("applications", [])
        elif isinstance(apps, list):
            app_list = apps
        else:
            app_list = []

        if app_list:
            score += 1.0

        # Enriched metadata (4 points total)
        if verse.get("principles"):
            score += 1.0
        if verse.get("keywords") and len(verse.get("keywords", [])) >= 5:
            score += 1.0
        if verse.get("chapter_theme"):
            score += 1.0
        if verse.get("searchable_text"):
            score += 1.0

        return score / max_score

    @classmethod
    def enrich(cls, verse: dict) -> dict:
        """
        Enrich verse with additional metadata.

        Args:
            verse: Verse dictionary to enrich

        Returns:
            Enriched verse dictionary
        """
        result = verse.copy()

        # Add chapter context
        result = cls.add_chapter_context(result)

        # Add principles
        result["principles"] = cls.extract_principles(verse)

        # Add keywords
        result["keywords"] = cls.extract_keywords(verse)

        # Add searchable text
        result["searchable_text"] = cls.create_searchable_text(verse)

        # Always add suggested applications
        suggestions = cls.suggest_applications(verse)
        result["suggested_applications"] = suggestions

        return result
