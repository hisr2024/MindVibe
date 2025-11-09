"""Core pipeline orchestration for Context Transformation Pipeline."""

from backend.services.pipeline.enricher import MetadataEnricher
from backend.services.pipeline.sanitizer import TextSanitizer
from backend.services.pipeline.validator import ValidationError, VerseValidator


class PipelineError(Exception):
    """Raised when pipeline processing fails."""

    pass


class ContextTransformationPipeline:
    """Orchestrates the full verse transformation pipeline."""

    def __init__(
        self,
        enable_validation: bool = True,
        enable_sanitization: bool = True,
        enable_enrichment: bool = True,
        strict_mode: bool = False,
    ):
        """Initialize the pipeline with configuration."""
        self.enable_validation = enable_validation
        self.enable_sanitization = enable_sanitization
        self.enable_enrichment = enable_enrichment
        self.strict_mode = strict_mode

        # Statistics
        self._stats = {
            "processed": 0,
            "validated": 0,
            "sanitized": 0,
            "enriched": 0,
            "errors": 0,
        }

        # Custom stages
        self._custom_stages = {}

    @classmethod
    def create_full_pipeline(
        cls, strict: bool = False
    ) -> "ContextTransformationPipeline":
        """Create a pipeline with all stages enabled."""
        return cls(
            enable_validation=True,
            enable_sanitization=True,
            enable_enrichment=True,
            strict_mode=strict,
        )

    @classmethod
    def create_minimal_pipeline(cls) -> "ContextTransformationPipeline":
        """Create a minimal pipeline with only validation."""
        return cls(
            enable_validation=True,
            enable_sanitization=False,
            enable_enrichment=False,
            strict_mode=False,
        )

    def transform(self, verse_data: dict) -> dict:
        """Transform a single verse through the pipeline."""
        try:
            result = verse_data.copy()

            # Validation stage
            if self.enable_validation:
                result = VerseValidator.validate_and_normalize(result)
                self._stats["validated"] += 1

            # Sanitization stage
            if self.enable_sanitization:
                result = TextSanitizer.sanitize_verse_data(result)
                self._stats["sanitized"] += 1

            # Enrichment stage
            if self.enable_enrichment:
                result = MetadataEnricher.enrich(result)
                self._stats["enriched"] += 1

            self._stats["processed"] += 1
            return result

        except ValidationError as e:
            self._stats["errors"] += 1
            if self.strict_mode:
                raise PipelineError(f"Pipeline validation failed: {e}") from e
            return verse_data  # Return original on error in non-strict mode

        except Exception as e:
            self._stats["errors"] += 1
            if self.strict_mode:
                raise PipelineError(f"Pipeline processing failed: {e}") from e
            return verse_data  # Return original on error

    def transform_batch(self, verses: list[dict]) -> list[dict]:
        """Transform a batch of verses."""
        return [self.transform(verse) for verse in verses]

    def validate_only(self, verse_data: dict) -> dict:
        """Run validation only and return report."""
        errors = VerseValidator.check_errors(verse_data)
        completeness = VerseValidator.check_completeness(verse_data)

        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "completeness": completeness,
        }

    def get_statistics(self) -> dict:
        """Get pipeline processing statistics."""
        return self._stats.copy()

    def reset_statistics(self) -> None:
        """Reset pipeline statistics."""
        self._stats = {
            "processed": 0,
            "validated": 0,
            "sanitized": 0,
            "enriched": 0,
            "errors": 0,
        }

    def export_configuration(self) -> dict:
        """Export current pipeline configuration."""
        return {
            "enable_validation": self.enable_validation,
            "enable_sanitization": self.enable_sanitization,
            "enable_enrichment": self.enable_enrichment,
            "strict_mode": self.strict_mode,
        }

    def add_custom_stage(self, name: str, stage_func) -> None:
        """Add a custom transformation stage."""
        self._custom_stages[name] = stage_func

    def transform_with_custom_stages(self, verse_data: dict) -> dict:
        """Transform verse with custom stages included."""
        result = self.transform(verse_data)

        # Apply custom stages
        for _name, stage_func in self._custom_stages.items():
            result = stage_func(result)

        return result
