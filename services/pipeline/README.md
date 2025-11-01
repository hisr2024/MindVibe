# Context Transformation Pipeline

A modern, extensible pipeline for transforming Bhagavad Gita verses into structured, searchable content for universal mental health applications.

## Features

✨ **Universal Language** - Replaces religious references with neutral terminology
📊 **Rich Metadata** - Extracts principles, keywords, and applications
🔍 **Search Optimized** - Creates searchable text for semantic search
✅ **Validated** - Ensures data completeness and correctness
🧩 **Extensible** - Easy to add new languages and custom stages
🧪 **Well Tested** - Comprehensive unit test coverage

## Quick Start

```python
from services.pipeline import ContextTransformationPipeline

# Create pipeline
pipeline = ContextTransformationPipeline.create_full_pipeline()

# Transform a verse
raw_verse = {
    "chapter": 2,
    "verse_number": 47,
    "theme": "action_without_attachment",
    "english": "You have the right to perform your duties...",
    "mental_health_applications": ["anxiety_management"]
}

transformed = pipeline.transform(raw_verse)
```

## Pipeline Stages

1. **Validation** - Ensures data completeness
2. **Normalization** - Standardizes format
3. **Sanitization** - Removes religious references
4. **Enrichment** - Adds metadata and keywords

## Components

- **TextSanitizer** - Sanitizes religious terminology
- **VerseValidator** - Validates data structure
- **MetadataEnricher** - Adds metadata and keywords
- **ContextTransformationPipeline** - Main orchestrator

## Documentation

See `/docs/pipeline.md` for complete documentation including:
- Architecture details
- API reference
- Configuration options
- Example code
- Design rationale

## Examples

See `/examples/pipeline/` for:
- Input/output examples
- Usage demonstrations
- Sample code

## Testing

```bash
# Run all tests
python -m pytest tests/unit/test_pipeline.py -v

# Run with coverage
python -m pytest tests/unit/test_pipeline.py --cov=services.pipeline
```

## License

Part of the MindVibe project.
