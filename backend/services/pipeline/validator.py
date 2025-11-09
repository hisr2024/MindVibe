"""Verse validation component for Context Transformation Pipeline."""


class ValidationError(Exception):
    """Raised when verse validation fails."""

    pass


class VerseValidator:
    """Validates verse data structure and content."""

    REQUIRED_FIELDS = ["chapter", "verse_number", "theme", "english"]
    MAX_CHAPTER = 18

    @classmethod
    def validate(cls, verse_data: dict) -> dict:
        """Validate verse data and raise ValidationError if invalid."""
        errors = cls.check_errors(verse_data)
        if errors:
            raise ValidationError(f"Validation failed: {', '.join(errors)}")
        return verse_data

    @classmethod
    def check_errors(cls, verse_data: dict) -> list[str]:
        """Check for validation errors and return list of error messages."""
        errors = []

        # Check required fields
        for field in cls.REQUIRED_FIELDS:
            if field not in verse_data:
                errors.append(f"Missing required field: {field}")

        # Validate chapter number
        if "chapter" in verse_data:
            chapter = verse_data["chapter"]
            if not isinstance(chapter, int) or chapter < 1 or chapter > cls.MAX_CHAPTER:
                errors.append(
                    f"Invalid chapter number: {chapter} (must be 1-{cls.MAX_CHAPTER})"
                )

        # Validate verse number
        if "verse_number" in verse_data:
            verse_num = verse_data["verse_number"]
            if not isinstance(verse_num, int) or verse_num < 1:
                errors.append(f"Invalid verse number: {verse_num} (must be >= 1)")

        return errors

    @classmethod
    def check_completeness(cls, verse_data: dict) -> dict:
        """Check completeness of verse data and return report."""
        fields = [
            "chapter",
            "verse_number",
            "theme",
            "english",
            "hindi",
            "sanskrit",
            "context",
            "mental_health_applications",
        ]

        present_count = sum(1 for field in fields if verse_data.get(field))
        total_count = len(fields)
        completeness_score = int((present_count / total_count) * 100)

        return {
            "completeness_score": completeness_score,
            "is_complete": completeness_score >= 85,
            "present_fields": present_count,
            "total_fields": total_count,
        }

    @classmethod
    def normalize_verse_id(cls, chapter: int, verse_number: int) -> str:
        """Generate normalized verse ID."""
        return f"{chapter}.{verse_number}"

    @classmethod
    def validate_and_normalize(cls, verse_data: dict) -> dict:
        """Validate and add normalized fields to verse data."""
        cls.validate(verse_data)

        # Add verse_id
        verse_data["verse_id"] = cls.normalize_verse_id(
            verse_data["chapter"], verse_data["verse_number"]
        )

        # Normalize theme (convert to snake_case)
        if "theme" in verse_data:
            theme = verse_data["theme"]
            verse_data["theme"] = theme.lower().replace(" ", "_")

        # Normalize mental_health_applications to dict format
        if "mental_health_applications" in verse_data:
            apps = verse_data["mental_health_applications"]
            if isinstance(apps, list):
                verse_data["mental_health_applications"] = {"applications": apps}

        return verse_data
