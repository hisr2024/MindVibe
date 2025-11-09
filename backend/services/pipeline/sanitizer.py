"""Text sanitization component for removing religious references."""

import re
from typing import Any


class TextSanitizer:
    """Sanitizes text by replacing religious terms with universal equivalents."""

    # Mapping of religious terms to universal equivalents
    REPLACEMENTS = {
        r"\bKrishna\b": "the teacher",
        r"\bArjuna\b": "the student",
        r"\bLord\b": "the wise one",
        r"\bGod\b": "inner wisdom",
        r"\bdivine\b": "universal",
        r"\bsoul\b": "essence",
    }

    @classmethod
    def sanitize(cls, text: str | None) -> str | None:
        """Sanitize a text string."""
        if text is None:
            return None
        if not text:
            return text

        result = text
        for pattern, replacement in cls.REPLACEMENTS.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

        return result

    @classmethod
    def sanitize_verse_data(cls, verse: dict[str, Any]) -> dict[str, Any]:
        """Sanitize entire verse data dictionary."""
        result = verse.copy()

        # Sanitize text fields
        for field in ["english", "context", "hindi"]:
            if field in result and result[field]:
                result[field] = cls.sanitize(result[field])

        # Format theme
        if "theme" in result:
            theme = result["theme"]
            # Convert snake_case to Title Case
            result["theme"] = theme.replace("_", " ").title()

        return result

    @classmethod
    def normalize_whitespace(cls, text: str) -> str:
        """Normalize whitespace in text."""
        return re.sub(r"\s+", " ", text).strip()

    @classmethod
    def standardize_punctuation(cls, text: str) -> str:
        """Ensure text ends with proper punctuation."""
        if not text:
            return text
        if not text[-1] in ".!?":
            return text + "."
        return text
