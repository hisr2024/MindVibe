"""Compatibility wrapper for pipeline module.

This module provides backward compatibility for imports from services.pipeline
by redirecting to backend.services.pipeline.
"""

from backend.services.pipeline import (
    ContextTransformationPipeline,
    MetadataEnricher,
    PipelineError,
    TextSanitizer,
    ValidationError,
    VerseValidator,
)

__all__ = [
    "ContextTransformationPipeline",
    "PipelineError",
    "TextSanitizer",
    "VerseValidator",
    "ValidationError",
    "MetadataEnricher",
]
