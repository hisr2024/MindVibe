"""Validation module for the pipeline."""


class ValidationError(Exception):
    """Raised when verse validation fails."""
    pass


class VerseValidator:
    """Validates verse data structure and content."""

    REQUIRED_FIELDS = ["chapter", "verse_number", "theme", "english"]
    MAX_CHAPTER = 18

    @classmethod
    def validate(cls, verse: dict) -> dict:
        """
        Validate a verse dictionary.
        
        Args:
            verse: Verse dictionary to validate
            
        Returns:
            The verse if valid
            
        Raises:
            ValidationError: If validation fails
        """
        # Check required fields
        missing_fields = [f for f in cls.REQUIRED_FIELDS if f not in verse]
        if missing_fields:
            raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")

        # Validate chapter number
        chapter = verse.get("chapter")
        if not isinstance(chapter, int) or chapter < 1 or chapter > cls.MAX_CHAPTER:
            raise ValidationError(f"Invalid chapter number: {chapter}. Must be between 1 and {cls.MAX_CHAPTER}")

        # Validate verse number
        verse_number = verse.get("verse_number")
        if not isinstance(verse_number, int) or verse_number < 1:
            raise ValidationError(f"Invalid verse number: {verse_number}. Must be positive integer")

        return verse

    @classmethod
    def check_errors(cls, verse: dict) -> list[str]:
        """
        Check for validation errors without raising exceptions.
        
        Args:
            verse: Verse dictionary to check
            
        Returns:
            List of error messages (empty if valid)
        """
        errors = []

        # Check required fields
        for field in cls.REQUIRED_FIELDS:
            if field not in verse:
                errors.append(f"Missing required field: {field}")

        # Validate chapter if present
        if "chapter" in verse:
            chapter = verse["chapter"]
            if not isinstance(chapter, int) or chapter < 1 or chapter > cls.MAX_CHAPTER:
                errors.append(f"Invalid chapter number: {chapter}")

        # Validate verse number if present
        if "verse_number" in verse:
            verse_number = verse["verse_number"]
            if not isinstance(verse_number, int) or verse_number < 1:
                errors.append(f"Invalid verse number: {verse_number}")

        return errors

    @classmethod
    def check_completeness(cls, verse: dict) -> dict:
        """
        Check completeness of verse data.
        
        Args:
            verse: Verse dictionary to check
            
        Returns:
            Dictionary with completeness report
        """
        optional_fields = ["hindi", "sanskrit", "context", "mental_health_applications"]
        all_fields = cls.REQUIRED_FIELDS + optional_fields

        present_fields = [f for f in all_fields if f in verse and verse[f]]
        completeness_score = (len(present_fields) / len(all_fields)) * 100

        return {
            "completeness_score": completeness_score,
            "is_complete": completeness_score >= 80,
            "present_fields": present_fields,
            "missing_fields": [f for f in all_fields if f not in present_fields],
        }

    @classmethod
    def normalize_verse_id(cls, chapter: int, verse_number: int) -> str:
        """
        Create normalized verse ID.
        
        Args:
            chapter: Chapter number
            verse_number: Verse number
            
        Returns:
            Verse ID string (e.g., "2.47")
        """
        return f"{chapter}.{verse_number}"

    @classmethod
    def validate_and_normalize(cls, verse: dict) -> dict:
        """
        Validate and normalize verse data.
        
        Args:
            verse: Verse dictionary to validate and normalize
            
        Returns:
            Normalized verse dictionary
        """
        # Validate first
        cls.validate(verse)

        # Normalize
        result = verse.copy()

        # Add verse_id
        result["verse_id"] = cls.normalize_verse_id(
            verse["chapter"], verse["verse_number"]
        )

        # Normalize theme to snake_case
        if "theme" in result:
            theme = result["theme"].lower().replace(" ", "_")
            result["theme"] = theme

        # Normalize mental_health_applications to dict format
        if "mental_health_applications" in result:
            apps = result["mental_health_applications"]
            if isinstance(apps, list):
                result["mental_health_applications"] = {"applications": apps}

        return result
