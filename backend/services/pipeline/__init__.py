"""
Pipeline module for data processing.

Provides classes and functions for sanitizing, validating, and enriching wisdom verse data.
"""

from backend.services.pipeline.core import ContextTransformationPipeline, PipelineError
from backend.services.pipeline.enricher import MetadataEnricher
from backend.services.pipeline.sanitizer import TextSanitizer
from backend.services.pipeline.validator import ValidationError, VerseValidator


# Backward compatibility functions
def sanitizer(data: dict) -> dict:
    """Sanitize input data (backward compatibility wrapper)."""
    if "english" in data:
        return TextSanitizer.sanitize_verse_data(data)
    return data


def validator(data: dict, schema: dict | None = None) -> tuple[bool, list[str]]:
    """Validate data (backward compatibility wrapper)."""
    try:
        VerseValidator.validate(data)
        return True, []
    except ValidationError as e:
        return False, [str(e)]


def enricher(data: dict, enrichments: dict | None = None) -> dict:
    """Enrich data (backward compatibility wrapper)."""
    enriched = data.copy()
    if enrichments:
        enriched.update(enrichments)
    return enriched


def orchestrate_pipeline(
    data: dict,
    schema: dict | None = None,
    enrichments: dict | None = None,
) -> tuple[bool, dict, list[str]]:
    """Orchestrate the full data processing pipeline."""
    # Sanitize
    sanitized = sanitizer(data)

    # Validate
    is_valid, errors = validator(sanitized, schema)
    if not is_valid:
        return False, {}, errors

    # Enrich
    enriched = enricher(sanitized, enrichments)

    return True, enriched, []


__all__ = [
    "ContextTransformationPipeline",
    "PipelineError",
    "MetadataEnricher",
    "TextSanitizer",
    "VerseValidator",
    "ValidationError",
    "sanitizer",
    "validator",
    "enricher",
    "orchestrate_pipeline",
]
