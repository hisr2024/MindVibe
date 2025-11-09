"""Text sanitization module for the pipeline."""

import re


class TextSanitizer:
    """Sanitizes religious and cultural references in text."""

    # Replacement mappings
    REPLACEMENTS = {
        "Krishna": "the teacher",
        "krishna": "the teacher",
        "Arjuna": "the student",
        "arjuna": "the student",
        "Lord": "the wise one",
        "lord": "the wise one",
        "God": "inner wisdom",
        "god": "inner wisdom",
        "divine": "universal",
        "Divine": "Universal",
        "soul": "essence",
        "Soul": "Essence",
    }

    @classmethod
    def sanitize(cls, text: str | None) -> str | None:
        """
        Sanitize text by replacing religious terms with universal alternatives.
        
        Args:
            text: Text to sanitize (can be None)
            
        Returns:
            Sanitized text or None if input was None
        """
        if text is None:
            return None

        if text == "":
            return ""

        result = text
        for old, new in cls.REPLACEMENTS.items():
            result = result.replace(old, new)

        return result

    @classmethod
    def sanitize_verse_data(cls, verse: dict) -> dict:
        """
        Sanitize all text fields in a verse dictionary.
        
        Args:
            verse: Verse dictionary with text fields
            
        Returns:
            New dictionary with sanitized text fields
        """
        result = verse.copy()

        # Sanitize text fields
        for field in ["english", "hindi", "context"]:
            if field in result:
                result[field] = cls.sanitize(result[field])

        # Title-case the theme
        if "theme" in result:
            result["theme"] = result["theme"].replace("_", " ").title()

        return result

    @classmethod
    def normalize_whitespace(cls, text: str) -> str:
        """
        Normalize whitespace in text.
        
        Args:
            text: Text to normalize
            
        Returns:
            Text with normalized whitespace
        """
        # Replace multiple spaces with single space and strip
        return re.sub(r'\s+', ' ', text).strip()

    @classmethod
    def standardize_punctuation(cls, text: str) -> str:
        """
        Ensure text ends with proper punctuation.
        
        Args:
            text: Text to standardize
            
        Returns:
            Text with standardized punctuation
        """
        if not text:
            return text

        # If text doesn't end with punctuation, add a period
        if text.rstrip()[-1] not in '.!?':
            return text.rstrip() + '.'

        return text
