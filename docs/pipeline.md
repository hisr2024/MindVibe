# Context Transformation Pipeline

## Overview

The Context Transformation Pipeline is a modern, extensible system for processing Bhagavad Gita verses into structured, searchable content suitable for universal mental health applications. It transforms raw verse data through multiple stages of validation, sanitization, and enrichment to create content that is:

- **Universal**: Religious references replaced with neutral language
- **Structured**: Consistent format for all verses
- **Searchable**: Enhanced with keywords, themes, and metadata
- **Extensible**: Easy to add new languages and features

## Architecture

The pipeline consists of four main stages:

```
Raw Verse Data
      ↓
[1. Validation] ─→ Ensures completeness and correctness
      ↓
[2. Normalization] ─→ Standardizes format and structure
      ↓
[3. Sanitization] ─→ Removes religious references
      ↓
[4. Enrichment] ─→ Adds metadata and search optimization
      ↓
Transformed Verse Data
```

### Pipeline Stages

#### 1. Validation
- Checks for required fields (chapter, verse_number, theme, english)
- Validates data types and formats
- Ensures chapter numbers are between 1-18
- Verifies mental health applications format

#### 2. Normalization
- Creates standardized verse IDs (e.g., "2.47")
- Converts themes to snake_case
- Normalizes mental health applications format
- Standardizes whitespace and punctuation

#### 3. Sanitization
- Replaces religious person references (Krishna → "the teacher", Arjuna → "the student")
- Converts deity references to universal terms (God → "inner wisdom", Lord → "the wise one")
- Removes location-specific references (Kurukshetra → "the battlefield")
- Preserves Sanskrit text as-is while sanitizing translations

#### 4. Enrichment
- Extracts philosophical principles from content
- Generates keywords for search optimization
- Suggests additional mental health applications
- Adds chapter-level context
- Creates combined searchable text
- Calculates metadata richness score

## Installation

The pipeline is part of the MindVibe services package. No additional installation is required beyond the main project dependencies.

```bash
# Install MindVibe dependencies
pip install -r requirements.txt
```

## Quick Start

### Basic Usage

```python
from backend.services.pipeline import ContextTransformationPipeline

# Create a full pipeline
pipeline = ContextTransformationPipeline.create_full_pipeline()

# Raw verse data
raw_verse = {
    "chapter": 2,
    "verse_number": 47,
    "theme": "action_without_attachment",
    "english": "You have the right to perform your duties...",
    "hindi": "तुम्हारा अधिकार केवल कर्म करने में है...",
    "sanskrit": "कर्मण्येवाधिकारस्ते...",
    "context": "Krishna teaches about duty...",
    "mental_health_applications": ["anxiety_management", "stress_reduction"]
}

# Transform the verse
transformed = pipeline.transform(raw_verse)

print(f"Verse ID: {transformed['verse_id']}")
print(f"Principles: {transformed['principles']}")
print(f"Metadata Score: {transformed['metadata_score']}")
```

### Batch Processing

```python
# Process multiple verses
verses = [verse1, verse2, verse3]
transformed_verses = pipeline.transform_batch(verses)

# Get statistics
stats = pipeline.get_statistics()
print(f"Processed: {stats['processed']}")
print(f"Errors: {stats['errors']}")
```

### Validation Only

```python
# Validate without transformation
report = pipeline.validate_only(verse_data)

if report['is_valid']:
    print("Verse is valid!")
    print(f"Completeness: {report['completeness']['completeness_score']}%")
else:
    print(f"Validation errors: {report['errors']}")
```

## Configuration Options

### Pipeline Modes

```python
# Full pipeline (recommended for production)
pipeline = ContextTransformationPipeline.create_full_pipeline(strict=True)

# Minimal pipeline (validation only)
pipeline = ContextTransformationPipeline.create_minimal_pipeline()

# Custom configuration
pipeline = ContextTransformationPipeline(
    enable_validation=True,
    enable_sanitization=True,
    enable_enrichment=False,
    strict_mode=False
)
```

### Configuration Parameters

- **enable_validation**: Validate verse data structure (default: True)
- **enable_sanitization**: Sanitize religious references (default: True)
- **enable_enrichment**: Add metadata and keywords (default: True)
- **strict_mode**: Raise exceptions on errors (default: False)

## Input Data Format

### Required Fields

```json
{
  "chapter": 2,
  "verse_number": 47,
  "theme": "action_without_attachment",
  "english": "English translation text"
}
```

### Recommended Fields

```json
{
  "hindi": "Hindi translation",
  "sanskrit": "Sanskrit original",
  "context": "Contextual explanation",
  "mental_health_applications": ["anxiety_management", "stress_reduction"]
}
```

### Mental Health Applications Format

The pipeline accepts two formats:

```json
// Old format (array)
"mental_health_applications": ["anxiety", "stress"]

// New format (object) - recommended
"mental_health_applications": {
  "applications": ["anxiety", "stress"]
}
```

Both formats are automatically normalized to the new format.

## Output Data Format

The pipeline adds the following fields to each verse:

### Core Fields (from input)
- `verse_id`: Standardized ID (e.g., "2.47")
- `chapter`: Chapter number
- `verse_number`: Verse number within chapter
- `theme`: Verse theme (normalized to snake_case)
- `english`: English translation (sanitized)
- `hindi`: Hindi translation
- `sanskrit`: Sanskrit original (preserved)
- `context`: Contextual explanation (sanitized)

### Enrichment Fields (added by pipeline)
- `principles`: List of philosophical principles
- `keywords`: Important keywords for search
- `suggested_applications`: Additional mental health applications
- `searchable_text`: Combined text for search indexing
- `chapter_theme`: Overall theme of the chapter
- `metadata_score`: Richness score (0.0 to 1.0)

### Example Output

```json
{
  "verse_id": "2.47",
  "chapter": 2,
  "verse_number": 47,
  "theme": "action_without_attachment",
  "english": "You have the right to perform your duties...",
  "context": "the wise one teaches the student about performing duty...",
  "mental_health_applications": {
    "applications": ["anxiety_management", "stress_reduction"]
  },
  "principles": ["action", "detachment", "duty"],
  "keywords": ["perform", "duties", "actions", "attachment"],
  "chapter_theme": "wisdom_and_knowledge",
  "metadata_score": 0.85
}
```

## Component Documentation

### TextSanitizer

Sanitizes religious terminology and standardizes text.

```python
from backend.services.pipeline import TextSanitizer

# Sanitize text
sanitized = TextSanitizer.sanitize("Krishna taught Arjuna")
# Result: "the teacher taught the student"

# Sanitize entire verse
sanitized_verse = TextSanitizer.sanitize_verse_data(verse_data)

# Normalize whitespace
normalized = TextSanitizer.normalize_whitespace("  text   with   spaces  ")

# Standardize punctuation
standardized = TextSanitizer.standardize_punctuation("text without period")
```

### VerseValidator

Validates verse data structure and content.

```python
from backend.services.pipeline import VerseValidator, ValidationError

# Validate verse (raises ValidationError if invalid)
try:
    validated = VerseValidator.validate(verse_data)
except ValidationError as e:
    print(f"Validation failed: {e}")

# Check errors without raising exception
errors = VerseValidator.check_errors(verse_data)

# Check completeness
report = VerseValidator.check_completeness(verse_data)
print(f"Completeness: {report['completeness_score']}%")

# Validate and normalize in one step
normalized = VerseValidator.validate_and_normalize(verse_data)
```

### MetadataEnricher

Enriches verses with additional metadata.

```python
from backend.services.pipeline import MetadataEnricher

# Enrich verse with metadata
enriched = MetadataEnricher.enrich(verse_data)

# Extract principles
principles = MetadataEnricher.extract_principles(verse_data)

# Extract keywords
keywords = MetadataEnricher.extract_keywords(verse_data)

# Suggest applications
suggestions = MetadataEnricher.suggest_applications(verse_data)

# Add chapter context
with_context = MetadataEnricher.add_chapter_context(verse_data)

# Calculate metadata score
score = MetadataEnricher.calculate_metadata_score(verse_data)
```

## Design Rationale

### Why Sanitize Religious References?

The goal is to make ancient wisdom universally accessible:
- **Inclusivity**: People of all backgrounds can benefit
- **Focus on Principles**: Emphasizes timeless wisdom over specific traditions
- **Mental Health Context**: Easier to apply in therapeutic settings
- **Reduced Barriers**: Removes potential resistance to religious terminology

### Sanitization Mappings

| Original | Universal Replacement |
|----------|----------------------|
| Krishna | the teacher |
| Arjuna | the student |
| Lord/God | the wise one / inner wisdom |
| Divine | universal |
| Soul | true self |
| Kurukshetra | the battlefield |

### Why Preserve Sanskrit?

- **Cultural Heritage**: Maintains connection to original text
- **Scholarly Reference**: Enables academic study
- **Language Learning**: Supports those interested in Sanskrit
- **Authenticity**: Provides source verification

### Extensibility Design

The pipeline is designed for easy extension:

1. **Custom Stages**: Add new transformation stages
2. **Language Support**: Add new translation fields
3. **New Applications**: Extend mental health categories
4. **Custom Principles**: Add domain-specific principles

```python
# Example: Add custom stage
def custom_stage(verse_data):
    # Custom transformation logic
    verse_data['custom_field'] = process(verse_data)
    return verse_data

pipeline.add_custom_stage('custom_processing', custom_stage)
transformed = pipeline.transform_with_custom_stages(verse_data)
```

## Testing

The pipeline includes comprehensive unit tests:

```bash
# Run all pipeline tests
python -m pytest tests/unit/test_pipeline.py -v

# Run specific test class
python -m pytest tests/unit/test_pipeline.py::TestTextSanitizer -v

# Run with coverage
python -m pytest tests/unit/test_pipeline.py --cov=backend.services.pipeline
```

## Examples

See the `/examples/pipeline/` directory for:

- `raw_input.json` - Example input data
- `transformed_output.json` - Example output data
- `example_usage.py` - Comprehensive usage examples

Run the examples:

```bash
cd examples/pipeline
python example_usage.py
```

## Performance Considerations

- **Batch Processing**: Use `transform_batch()` for multiple verses
- **Lazy Enrichment**: Disable enrichment if not needed
- **Caching**: Consider caching transformed verses
- **Async Processing**: Can be wrapped in async functions for concurrent processing

## Error Handling

The pipeline provides flexible error handling:

```python
# Strict mode: Raises exceptions
pipeline = ContextTransformationPipeline(strict_mode=True)
try:
    result = pipeline.transform(invalid_data)
except PipelineError as e:
    print(f"Pipeline error: {e}")

# Non-strict mode: Returns original data on error
pipeline = ContextTransformationPipeline(strict_mode=False)
result = pipeline.transform(invalid_data)  # Returns original if error

# Batch processing with error continuation
results = pipeline.transform_batch(verses, continue_on_error=True)
```

## Future Enhancements

Potential future additions:

1. **Embedding Generation**: Add vector embeddings for semantic search
2. **Language Detection**: Auto-detect input language
3. **Translation Quality**: Score translation accuracy
4. **Audio Support**: Process audio pronunciations
5. **Multi-version Support**: Handle multiple translation versions
6. **Citation Tracking**: Track translation sources

## Contributing

To contribute to the pipeline:

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure backward compatibility
5. Follow Python best practices (PEP 8)

## License

Part of the MindVibe project. See main project LICENSE for details.

## Support

For questions or issues:
- Open an issue on GitHub
- See main project documentation
- Check example files in `/examples/pipeline/`
