"""Core pipeline orchestration module."""

from typing import Callable, Any

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
        enable_sanitization: bool = True,
        enable_validation: bool = True,
        enable_enrichment: bool = True,
        strict_mode: bool = False,
    ):
        """
        Initialize pipeline with configuration.

        Args:
            enable_sanitization: Whether to run sanitization stage
            enable_validation: Whether to run validation stage
            enable_enrichment: Whether to run enrichment stage
            strict_mode: Whether to raise errors or return original on failure
        """
        self.enable_sanitization = enable_sanitization
        self.enable_validation = enable_validation
        self.enable_enrichment = enable_enrichment
        self.strict_mode = strict_mode
        self._statistics = {
            "processed": 0,
            "validated": 0,
            "sanitized": 0,
            "enriched": 0,
            "successful": 0,
            "failed": 0,
            "validation_errors": 0,
            "sanitization_errors": 0,
            "enrichment_errors": 0,
        }
        self._custom_stages: dict[str, Callable[[Any], Any]] = {}

    @classmethod
    def create_full_pipeline(
        cls, strict: bool = False
    ) -> "ContextTransformationPipeline":
        """
        Create a pipeline with all stages enabled.

        Args:
            strict: Whether to raise errors on failures

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
        Create a pipeline with only validation enabled.

        Returns:
            ContextTransformationPipeline instance
        """
        return cls(
            enable_sanitization=False, enable_validation=True, enable_enrichment=False
        )

    @classmethod
    def create_validation_only(cls) -> "ContextTransformationPipeline":
        """
        Create a pipeline with only validation enabled.

        Returns:
            ContextTransformationPipeline instance
        """
        return cls(
            enable_sanitization=False, enable_validation=True, enable_enrichment=False
        )

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
        self._statistics["processed"] += 1

        try:
            result = verse.copy()
            validation_failed = False

            # Stage 1: Sanitization
            if self.enable_sanitization:
                try:
                    result = TextSanitizer.sanitize_verse_data(result)
                    self._statistics["sanitized"] += 1
                except Exception:
                    self._statistics["sanitization_errors"] += 1
                    if self.strict_mode:
                        raise
                    # In non-strict mode, continue with original

            # Stage 2: Validation
            if self.enable_validation:
                try:
                    result = VerseValidator.validate_and_normalize(result)
                    self._statistics["validated"] += 1
                except ValidationError:
                    self._statistics["validation_errors"] += 1
                    validation_failed = True
                    if self.strict_mode:
                        raise
                    # In non-strict mode, return original
                    self._statistics["failed"] += 1
                    return verse
                except Exception:
                    self._statistics["validation_errors"] += 1
                    validation_failed = True
                    if self.strict_mode:
                        raise
                    # In non-strict mode, return original
                    self._statistics["failed"] += 1
                    return verse

            # Stage 3: Enrichment (only if validation passed or was skipped)
            if self.enable_enrichment and not validation_failed:
                try:
                    result = MetadataEnricher.enrich(result)
                    # Add metadata score
                    result["metadata_score"] = (
                        MetadataEnricher.calculate_metadata_score(result)
                    )
                    self._statistics["enriched"] += 1
                except Exception:
                    self._statistics["enrichment_errors"] += 1
                    if self.strict_mode:
                        raise
                    # In non-strict mode, continue without enrichment

            self._statistics["successful"] += 1
            return result

        except Exception as e:
            self._statistics["failed"] += 1
            if self.strict_mode:
                raise PipelineError(f"Pipeline transformation failed: {e}") from e
            return verse  # Return original on failure in non-strict mode

    def transform_with_custom_stages(self, verse: dict) -> dict:
        """
        Transform a verse through the pipeline including custom stages.

        Args:
            verse: Raw verse dictionary

        Returns:
            Transformed verse dictionary

        Raises:
            PipelineError: If transformation fails
        """
        # First run normal transformation
        result = self.transform(verse)

        # Then apply custom stages
        for stage_name, stage_func in self._custom_stages.items():
            try:
                result = stage_func(result)
            except Exception as e:
                if self.strict_mode:
                    raise PipelineError(
                        f"Custom stage '{stage_name}' failed: {e}"
                    ) from e
                # In non-strict mode, continue

        return result

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
                if self.strict_mode:
                    raise PipelineError(
                        f"Failed to transform verse at index {i}: {e}"
                    ) from e
                # In non-strict mode, skip failed verses
                continue

        return results

    def validate_batch(
        self, verses: list[dict]
    ) -> tuple[list[dict], list[tuple[int, str]]]:
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
                if self.enable_validation:
                    VerseValidator.validate(verse)
                valid_verses.append(verse)
            except ValidationError as e:
                errors.append((i, str(e)))

        return valid_verses, errors

    def validate_only(self, verse: dict) -> dict:
        """
        Validate a single verse and return validation report.

        Args:
            verse: Verse dictionary to validate

        Returns:
            Dictionary with validation results
        """
        report = {"is_valid": True, "errors": [], "completeness": 0.0}

        try:
            VerseValidator.validate(verse)
            # Check completeness
            completeness = VerseValidator.check_completeness(verse)
            report["completeness"] = completeness
        except ValidationError:
            report["is_valid"] = False
            report["errors"] = VerseValidator.check_errors(verse)
            report["completeness"] = VerseValidator.check_completeness(verse)

        return report

    def get_statistics(self) -> dict:
        """
        Get pipeline statistics.

        Returns:
            Dictionary of statistics
        """
        return self._statistics.copy()

    def reset_statistics(self) -> None:
        """Reset pipeline statistics."""
        self._statistics = {
            "processed": 0,
            "validated": 0,
            "sanitized": 0,
            "enriched": 0,
            "successful": 0,
            "failed": 0,
            "validation_errors": 0,
            "sanitization_errors": 0,
            "enrichment_errors": 0,
        }

    def export_configuration(self) -> dict:
        """
        Export pipeline configuration.

        Returns:
            Dictionary of configuration settings
        """
        return {
            "enable_validation": self.enable_validation,
            "enable_sanitization": self.enable_sanitization,
            "enable_enrichment": self.enable_enrichment,
            "strict_mode": self.strict_mode,
        }

    def add_custom_stage(self, stage_name: str, stage_func) -> None:
        """
        Add a custom transformation stage to the pipeline.

        Args:
            stage_name: Name identifier for the stage
            stage_func: Function that takes a verse dict and returns a transformed verse dict
        """
        self._custom_stages[stage_name] = stage_func
