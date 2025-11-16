"""Core pipeline orchestration module."""

from backend.services.pipeline.enricher import MetadataEnricher
from backend.services.pipeline.sanitizer import TextSanitizer
from backend.services.pipeline.validator import ValidationError, VerseValidator


class PipelineError(Exception):
    """Raised when pipeline processing fails."""
    pass


class ContextTransformationPipeline:
    """
    Main pipeline for transforming raw verse data into processed, searchable content.
    
    Pipeline stages:
    1. Sanitization - Clean and normalize text
    2. Validation - Ensure data meets requirements
    3. Enrichment - Add metadata and searchable content
    """

    def __init__(
        self,
        sanitize: bool = True,
        validate: bool = True,
        enrich: bool = True,
    ):
        """
        Initialize pipeline with configuration.
        
        Args:
            sanitize: Whether to run sanitization stage
            validate: Whether to run validation stage
            enrich: Whether to run enrichment stage
        """
        self.sanitize = sanitize
        self.validate = validate
        self.enrich = enrich

    @classmethod
    def create_full_pipeline(cls) -> "ContextTransformationPipeline":
        """
        Create a pipeline with all stages enabled.
        
        Returns:
            ContextTransformationPipeline instance
        """
        return cls(sanitize=True, validate=True, enrich=True)

    @classmethod
    def create_validation_only(cls) -> "ContextTransformationPipeline":
        """
        Create a pipeline with only validation enabled.
        
        Returns:
            ContextTransformationPipeline instance
        """
        return cls(sanitize=False, validate=True, enrich=False)

    def transform(self, verse: dict) -> dict:
        """
        Transform a verse through the pipeline.
        
        Args:
            verse: Raw verse dictionary
            
        Returns:
            Transformed verse dictionary
            
        Raises:
            PipelineError: If transformation fails
        """
        try:
            result = verse.copy()

            # Stage 1: Sanitization
            if self.sanitize:
                result = TextSanitizer.sanitize_verse_data(result)

            # Stage 2: Validation
            if self.validate:
                result = VerseValidator.validate_and_normalize(result)

            # Stage 3: Enrichment
            if self.enrich:
                result = MetadataEnricher.enrich(result)

            return result

        except ValidationError as e:
            raise PipelineError(f"Validation failed: {e}") from e
        except Exception as e:
            raise PipelineError(f"Pipeline transformation failed: {e}") from e

    def transform_batch(self, verses: list[dict]) -> list[dict]:
        """
        Transform multiple verses through the pipeline.
        
        Args:
            verses: List of raw verse dictionaries
            
        Returns:
            List of transformed verse dictionaries
            
        Raises:
            PipelineError: If transformation of any verse fails
        """
        results = []
        for i, verse in enumerate(verses):
            try:
                transformed = self.transform(verse)
                results.append(transformed)
            except PipelineError as e:
                raise PipelineError(f"Failed to transform verse at index {i}: {e}") from e

        return results

    def validate_batch(self, verses: list[dict]) -> tuple[list[dict], list[tuple[int, str]]]:
        """
        Validate a batch of verses and return valid ones plus errors.
        
        Args:
            verses: List of verse dictionaries to validate
            
        Returns:
            Tuple of (valid_verses, errors) where errors is list of (index, error_msg)
        """
        valid_verses = []
        errors = []

        for i, verse in enumerate(verses):
            try:
                if self.validate:
                    VerseValidator.validate(verse)
                valid_verses.append(verse)
            except ValidationError as e:
                errors.append((i, str(e)))

        return valid_verses, errors
