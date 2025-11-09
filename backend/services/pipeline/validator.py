"""Data validation component for verse data."""

from typing import Any


class ValidationError(Exception):
    """Exception raised for validation errors."""

    pass


class VerseValidator:
    """Validates and normalizes verse data."""

    REQUIRED_FIELDS = ["chapter", "verse_number", "theme", "english"]
    OPTIONAL_FIELDS = ["hindi", "sanskrit", "context", "mental_health_applications"]

    @classmethod
    def validate(cls, verse: dict[str, Any]) -> dict[str, Any]:
        """Validate a verse and raise ValidationError if invalid."""
        errors = cls.check_errors(verse)
        if errors:
            raise ValidationError(f"Validation failed: {'; '.join(errors)}")
        return verse

    @classmethod
    def check_errors(cls, verse: dict[str, Any]) -> list[str]:
        """Check for validation errors and return list of error messages."""
        errors = []

        # Check required fields
        for field in cls.REQUIRED_FIELDS:
            if field not in verse:
                errors.append(f"Missing required field: {field}")

        # Validate chapter number
        if "chapter" in verse:
            chapter = verse["chapter"]
            if not isinstance(chapter, int) or chapter < 1 or chapter > 18:
                errors.append(f"Invalid chapter number: {chapter}")

        # Validate verse number
        if "verse_number" in verse:
            verse_num = verse["verse_number"]
            if not isinstance(verse_num, int) or verse_num < 1:
                errors.append(f"Invalid verse number: {verse_num}")

        return errors

    @classmethod
    def check_completeness(cls, verse: dict[str, Any]) -> dict[str, Any]:
        """Check completeness of verse data."""
        total_fields = len(cls.REQUIRED_FIELDS) + len(cls.OPTIONAL_FIELDS)
        present_fields = sum(1 for f in cls.REQUIRED_FIELDS + cls.OPTIONAL_FIELDS if f in verse and verse[f])

        completeness_score = (present_fields / total_fields) * 100

        return {
            "completeness_score": completeness_score,
            "is_complete": completeness_score >= 80,
            "missing_required": [f for f in cls.REQUIRED_FIELDS if f not in verse or not verse[f]],
            "missing_recommended": [f for f in cls.OPTIONAL_FIELDS if f not in verse or not verse[f]],
        }

    @classmethod
    def normalize_verse_id(cls, chapter: int, verse_number: int) -> str:
        """Create normalized verse ID."""
        return f"{chapter}.{verse_number}"

    @classmethod
    def validate_and_normalize(cls, verse: dict[str, Any]) -> dict[str, Any]:
        """Validate and normalize verse data."""
        # Create a copy to avoid modifying original
        result = verse.copy()

        # Validate
        cls.validate(result)

        # Normalize verse_id
        if "chapter" in result and "verse_number" in result:
            result["verse_id"] = cls.normalize_verse_id(result["chapter"], result["verse_number"])

        # Normalize theme to snake_case
        if "theme" in result:
            theme = result["theme"]
            if isinstance(theme, str):
                # Convert to snake_case
                result["theme"] = theme.lower().replace(" ", "_").replace("-", "_")

        # Normalize mental_health_applications to dict format
        if "mental_health_applications" in result:
            apps = result["mental_health_applications"]
            if isinstance(apps, list):
                result["mental_health_applications"] = {"applications": apps}

        return result
