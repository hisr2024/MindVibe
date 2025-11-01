"""
Context Transformation Pipeline for Bhagavad Gita Verses

This package provides a modern, extensible pipeline for processing and transforming
Bhagavad Gita verses for universal mental health applications.

Key Features:
- Sanitization of religious terminology for universal appeal
- Standardization of translations across languages
- Metadata enrichment (themes, applications, principles)
- Semantic search optimization
- Extensible architecture for future languages and features

Usage:
    from services.pipeline import ContextTransformationPipeline
    
    pipeline = ContextTransformationPipeline()
    transformed_verse = pipeline.transform(raw_verse_data)
"""

from .core import ContextTransformationPipeline
from .sanitizer import TextSanitizer
from .validator import VerseValidator
from .enricher import MetadataEnricher

__all__ = [
    'ContextTransformationPipeline',
    'TextSanitizer',
    'VerseValidator',
    'MetadataEnricher',
]

__version__ = '1.0.0'
