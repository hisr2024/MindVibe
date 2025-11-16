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
        enable_validation: bool = None,
        enable_sanitization: bool = None,
        enable_enrichment: bool = None,
        strict_mode: bool = False,
    ):
        """
        Initialize pipeline with configuration.
        
        Args:
            sanitize: Whether to run sanitization stage (deprecated, use enable_sanitization)
            validate: Whether to run validation stage (deprecated, use enable_validation)
            enrich: Whether to run enrichment stage (deprecated, use enable_enrichment)
            enable_validation: Whether to run validation stage
            enable_sanitization: Whether to run sanitization stage
            enable_enrichment: Whether to run enrichment stage
            strict_mode: If True, raise exceptions on errors. If False, return original on error.
        """
        # Support both old and new parameter names
        self.enable_validation = enable_validation if enable_validation is not None else validate
        self.enable_sanitization = enable_sanitization if enable_sanitization is not None else sanitize
        self.enable_enrichment = enable_enrichment if enable_enrichment is not None else enrich
        self.strict_mode = strict_mode
        
        # For backward compatibility
        self.sanitize = self.enable_sanitization
        self.validate = self.enable_validation
        self.enrich = self.enable_enrichment
        
        # Statistics tracking
        self._stats = {
            "processed": 0,
            "validated": 0,
            "sanitized": 0,
            "enriched": 0,
            "errors": 0,
        }
        
        # Custom stages
        self._custom_stages = []

    @classmethod
    def create_full_pipeline(cls, strict: bool = False) -> "ContextTransformationPipeline":
        """
        Create a pipeline with all stages enabled.
        
        Args:
            strict: If True, raise exceptions on errors
        
        Returns:
            ContextTransformationPipeline instance
        """
        return cls(
            enable_sanitization=True,
            enable_validation=True,
            enable_enrichment=True,
            strict_mode=strict,
        )

    @classmethod
    def create_minimal_pipeline(cls) -> "ContextTransformationPipeline":
        """
        Create a minimal pipeline with only validation enabled.
        
        Returns:
            ContextTransformationPipeline instance
        """
        return cls(
            enable_sanitization=False,
            enable_validation=True,
            enable_enrichment=False,
        )

    def transform(self, verse: dict) -> dict:
        """
        Transform a verse through the pipeline.
        
        Args:
            verse: Raw verse dictionary
            
        Returns:
            Transformed verse dictionary
            
        Raises:
            PipelineError: If transformation fails and strict_mode is True
        """
        try:
            result = verse.copy()
            self._stats["processed"] += 1

            # Stage 1: Sanitization
            if self.enable_sanitization:
                result = TextSanitizer.sanitize_verse_data(result)
                self._stats["sanitized"] += 1

            # Stage 2: Validation
            if self.enable_validation:
                result = VerseValidator.validate_and_normalize(result)
                self._stats["validated"] += 1

            # Stage 3: Enrichment
            if self.enable_enrichment:
                result = MetadataEnricher.enrich(result)
                self._stats["enriched"] += 1

            return result

        except ValidationError as e:
            self._stats["errors"] += 1
            if self.strict_mode:
                raise PipelineError(f"Validation failed: {e}") from e
            return verse  # Return original on error in non-strict mode
        except Exception as e:
            self._stats["errors"] += 1
            if self.strict_mode:
                raise PipelineError(f"Pipeline transformation failed: {e}") from e
            return verse  # Return original on error in non-strict mode

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

    def validate_only(self, verse: dict) -> dict:
        """
        Validate a verse and return a validation report.
        
        Args:
            verse: Verse dictionary to validate
            
        Returns:
            Validation report with is_valid, errors, and completeness fields
        """
        report = {
            "is_valid": True,
            "errors": [],
            "completeness": 0.0,
        }
        
        try:
            VerseValidator.validate(verse)
        except ValidationError as e:
            report["is_valid"] = False
            report["errors"].append(str(e))
        
        # Calculate completeness
        required_fields = ["chapter", "verse_number", "theme", "english"]
        present_fields = sum(1 for f in required_fields if verse.get(f))
        report["completeness"] = present_fields / len(required_fields)
        
        return report

    def get_statistics(self) -> dict:
        """
        Get pipeline processing statistics.
        
        Returns:
            Dictionary with statistics
        """
        return self._stats.copy()

    def reset_statistics(self):
        """Reset pipeline statistics to zero."""
        self._stats = {
            "processed": 0,
            "validated": 0,
            "sanitized": 0,
            "enriched": 0,
            "errors": 0,
        }

    def add_custom_stage(self, name: str, func):
        """
        Add a custom transformation stage.
        
        Args:
            name: Name of the custom stage
            func: Function to execute (takes verse dict, returns verse dict)
        """
        self._custom_stages.append((name, func))

    def transform_with_custom_stages(self, verse: dict) -> dict:
        """
        Transform a verse including custom stages.
        
        Args:
            verse: Verse dictionary to transform
            
        Returns:
            Transformed verse dictionary
        """
        # First run standard pipeline
        result = self.transform(verse)
        
        # Then apply custom stages
        for name, func in self._custom_stages:
            try:
                result = func(result)
            except Exception as e:
                if self.strict_mode:
                    raise PipelineError(f"Custom stage '{name}' failed: {e}") from e
        
        return result

    def export_configuration(self) -> dict:
        """
        Export pipeline configuration.
        
        Returns:
            Dictionary with configuration settings
        """
        return {
            "enable_validation": self.enable_validation,
            "enable_sanitization": self.enable_sanitization,
            "enable_enrichment": self.enable_enrichment,
            "strict_mode": self.strict_mode,
        }
