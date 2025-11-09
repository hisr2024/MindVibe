"""Core pipeline orchestrator."""

from typing import Any


class PipelineError(Exception):
    """Exception raised for pipeline errors."""

    pass


class ContextTransformationPipeline:
    """Main pipeline orchestrator for transforming wisdom verses."""

    def __init__(
        self,
        enable_validation: bool = True,
        enable_sanitization: bool = True,
        enable_enrichment: bool = True,
        strict_mode: bool = False,
    ) -> None:
        self.enable_validation = enable_validation
        self.enable_sanitization = enable_sanitization
        self.enable_enrichment = enable_enrichment
        self.strict_mode = strict_mode
        self._stats = {
            "processed": 0,
            "validated": 0,
            "sanitized": 0,
            "enriched": 0,
            "errors": 0,
        }
        self._custom_stages: dict[str, Any] = {}

    @classmethod
    def create_full_pipeline(cls, strict: bool = False) -> "ContextTransformationPipeline":
        """Create a full pipeline with all features enabled."""
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
        )

    def transform(self, verse_data: dict[str, Any]) -> dict[str, Any]:
        """Transform a single verse through the pipeline."""
        from backend.services.pipeline.sanitizer import TextSanitizer
        from backend.services.pipeline.enricher import MetadataEnricher
        from backend.services.pipeline.validator import VerseValidator

        result = verse_data.copy()
        self._stats["processed"] += 1

        try:
            if self.enable_validation:
                result = VerseValidator.validate_and_normalize(result)
                self._stats["validated"] += 1

            if self.enable_sanitization:
                result = TextSanitizer.sanitize_verse_data(result)
                self._stats["sanitized"] += 1

            if self.enable_enrichment:
                result = MetadataEnricher.enrich(result)
                self._stats["enriched"] += 1

            return result
        except Exception as e:
            self._stats["errors"] += 1
            if self.strict_mode:
                raise PipelineError(f"Pipeline error: {e}") from e
            return verse_data

    def transform_batch(
        self, verses: list[dict[str, Any]], continue_on_error: bool = True
    ) -> list[dict[str, Any]]:
        """Transform multiple verses through the pipeline."""
        results = []
        for verse in verses:
            try:
                results.append(self.transform(verse))
            except Exception:
                if not continue_on_error:
                    raise
                results.append(verse)
        return results

    def validate_only(self, verse_data: dict[str, Any]) -> dict[str, Any]:
        """Run validation only and return a report."""
        from backend.services.pipeline.validator import VerseValidator

        errors = VerseValidator.check_errors(verse_data)
        completeness = VerseValidator.check_completeness(verse_data)

        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "completeness": completeness,
        }

    def get_statistics(self) -> dict[str, int]:
        """Get pipeline statistics."""
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

    def export_configuration(self) -> dict[str, bool]:
        """Export pipeline configuration."""
        return {
            "enable_validation": self.enable_validation,
            "enable_sanitization": self.enable_sanitization,
            "enable_enrichment": self.enable_enrichment,
            "strict_mode": self.strict_mode,
        }

    def add_custom_stage(self, name: str, func: Any) -> None:
        """Add a custom transformation stage."""
        self._custom_stages[name] = func

    def transform_with_custom_stages(self, verse_data: dict[str, Any]) -> dict[str, Any]:
        """Transform with custom stages applied."""
        result = self.transform(verse_data)
        for stage_func in self._custom_stages.values():
            result = stage_func(result)
        return result
