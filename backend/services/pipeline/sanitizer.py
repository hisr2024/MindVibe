"""Text sanitization component for Context Transformation Pipeline."""

import re


class TextSanitizer:
    """Sanitizes text to remove religious references and normalize content."""

    # Mapping of religious terms to universal equivalents
    REPLACEMENTS = {
        "Krishna": "the teacher",
        "Lord Krishna": "the wise one",
        "Arjuna": "the student",
        "Lord": "the wise one",
        "God": "inner wisdom",
        "Divine": "universal",
        "Soul": "essence",
        "Holy": "sacred",
    }

    @classmethod
    def sanitize(cls, text: str | None) -> str | None:
        """Sanitize text by replacing religious terms with universal equivalents."""
        if text is None:
            return None
        if not text:
            return text

        result = text
        for term, replacement in cls.REPLACEMENTS.items():
            # Case-insensitive replacement
            result = re.sub(
                r"\b" + re.escape(term) + r"\b", replacement, result, flags=re.IGNORECASE
            )

        return result

    @classmethod
    def sanitize_verse_data(cls, verse_data: dict) -> dict:
        """Sanitize all text fields in verse data."""
        sanitized = verse_data.copy()

        # Sanitize text fields
        text_fields = ["english", "hindi", "context"]
        for field in text_fields:
            if field in sanitized and sanitized[field]:
                sanitized[field] = cls.sanitize(sanitized[field])

        # Normalize theme (capitalize words)
        if "theme" in sanitized:
            theme = sanitized["theme"]
            sanitized["theme"] = " ".join(word.capitalize() for word in theme.split("_"))

        return sanitized

    @classmethod
    def normalize_whitespace(cls, text: str) -> str:
        """Normalize whitespace in text."""
        # Replace multiple spaces with single space
        text = re.sub(r"\s+", " ", text)
        # Strip leading/trailing whitespace
        return text.strip()

    @classmethod
    def standardize_punctuation(cls, text: str) -> str:
        """Standardize punctuation in text."""
        # Add period at end if not present
        if text and not text[-1] in ".!?":
            text = text + "."
        return text
