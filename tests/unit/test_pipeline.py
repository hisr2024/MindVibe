"""
Unit tests for the Context Transformation Pipeline.

Tests all components: Sanitizer, Validator, Enricher, and Core Pipeline.
"""

import pytest
from backend.services.pipeline import (
    ContextTransformationPipeline,
    TextSanitizer,
    VerseValidator,
    MetadataEnricher,
)
from backend.services.pipeline.validator import ValidationError
from backend.services.pipeline.core import PipelineError


class TestTextSanitizer:
    """Test the TextSanitizer component."""

    def test_sanitize_krishna_to_teacher(self):
        """Test that Krishna is replaced with 'the teacher'."""
        text = "Krishna taught Arjuna on the battlefield"
        result = TextSanitizer.sanitize(text)
        assert "the teacher" in result.lower()
        assert "krishna" not in result.lower()

    def test_sanitize_arjuna_to_student(self):
        """Test that Arjuna is replaced with 'the student'."""
        text = "Arjuna was confused about his duty"
        result = TextSanitizer.sanitize(text)
        assert "the student" in result.lower()
        assert "arjuna" not in result.lower()

    def test_sanitize_lord_to_wise_one(self):
        """Test that Lord is replaced with 'the wise one'."""
        text = "The Lord spoke wisdom"
        result = TextSanitizer.sanitize(text)
        assert "the wise one" in result.lower()
        assert "lord" not in result.lower()

    def test_sanitize_god_to_inner_wisdom(self):
        """Test that God is replaced with 'inner wisdom'."""
        text = "God resides within all beings"
        result = TextSanitizer.sanitize(text)
        assert "inner wisdom" in result.lower()
        assert "god" not in result.lower()

    def test_sanitize_multiple_terms(self):
        """Test sanitization of multiple terms in one text."""
        text = "Lord Krishna taught Arjuna about the divine soul"
        result = TextSanitizer.sanitize(text)
        assert "krishna" not in result.lower()
        assert "arjuna" not in result.lower()
        assert "lord" not in result.lower()
        assert "divine" not in result.lower()
        assert "soul" not in result.lower()

    def test_sanitize_empty_string(self):
        """Test sanitization of empty string."""
        assert TextSanitizer.sanitize("") == ""

    def test_sanitize_none(self):
        """Test sanitization of None."""
        assert TextSanitizer.sanitize(None) is None

    def test_sanitize_verse_data(self):
        """Test sanitizing entire verse data dictionary."""
        verse = {
            "english": "Krishna taught Arjuna",
            "context": "Lord Krishna spoke about duty",
            "theme": "action_without_attachment",
            "sanskrit": "Should not change",
        }
        result = TextSanitizer.sanitize_verse_data(verse)

        assert "krishna" not in result["english"].lower()
        assert "lord" not in result["context"].lower()
        assert result["sanskrit"] == "Should not change"
        assert result["theme"] == "Action Without Attachment"

    def test_normalize_whitespace(self):
        """Test whitespace normalization."""
        text = "  text   with    multiple   spaces  "
        result = TextSanitizer.normalize_whitespace(text)
        assert result == "text with multiple spaces"

    def test_standardize_punctuation(self):
        """Test punctuation standardization."""
        text = "text without period"
        result = TextSanitizer.standardize_punctuation(text)
        assert result.endswith(".")

    def test_standardize_punctuation_with_existing(self):
        """Test punctuation standardization with existing punctuation."""
        text = "text with period."
        result = TextSanitizer.standardize_punctuation(text)
        assert result == "text with period."


class TestVerseValidator:
    """Test the VerseValidator component."""

    def test_validate_complete_verse(self):
        """Test validation of a complete valid verse."""
        verse = {
            "chapter": 2,
            "verse_number": 47,
            "theme": "action_without_attachment",
            "english": "You have the right to work...",
            "hindi": "तुम्हारा अधिकार...",
            "sanskrit": "कर्मण्येवाधिकारस्ते...",
            "context": "About duty",
            "mental_health_applications": ["anxiety"],
        }
        result = VerseValidator.validate(verse)
        assert result == verse

    def test_validate_missing_required_field(self):
        """Test validation fails for missing required field."""
        verse = {
            "chapter": 2,
            "verse_number": 47,
            # Missing theme and english
        }
        with pytest.raises(ValidationError):
            VerseValidator.validate(verse)

    def test_validate_invalid_chapter(self):
        """Test validation fails for invalid chapter number."""
        verse = {
            "chapter": 19,  # Invalid: only 18 chapters
            "verse_number": 1,
            "theme": "test",
            "english": "test",
        }
        with pytest.raises(ValidationError):
            VerseValidator.validate(verse)

    def test_validate_invalid_verse_number(self):
        """Test validation fails for invalid verse number."""
        verse = {
            "chapter": 2,
            "verse_number": -1,  # Invalid: negative
            "theme": "test",
            "english": "test",
        }
        with pytest.raises(ValidationError):
            VerseValidator.validate(verse)

    def test_check_errors_returns_list(self):
        """Test check_errors returns list of errors."""
        verse = {
            "chapter": 2,
            # Missing required fields
        }
        errors = VerseValidator.check_errors(verse)
        assert isinstance(errors, list)
        assert len(errors) > 0

    def test_check_completeness(self):
        """Test completeness check."""
        verse = {
            "chapter": 2,
            "verse_number": 47,
            "theme": "test",
            "english": "test",
            "hindi": "test",
            "sanskrit": "test",
            "context": "test",
            "mental_health_applications": ["anxiety"],
        }
        report = VerseValidator.check_completeness(verse)

        assert "completeness_score" in report
        assert report["completeness_score"] > 80
        assert report["is_complete"] is True

    def test_normalize_verse_id(self):
        """Test verse ID normalization."""
        verse_id = VerseValidator.normalize_verse_id(2, 47)
        assert verse_id == "2.47"

    def test_validate_and_normalize(self):
        """Test validation and normalization in one step."""
        verse = {
            "chapter": 2,
            "verse_number": 47,
            "theme": "Test Theme",
            "english": "test",
            "mental_health_applications": ["anxiety"],
        }
        result = VerseValidator.validate_and_normalize(verse)

        assert result["verse_id"] == "2.47"
        assert result["theme"] == "test_theme"
        assert isinstance(result["mental_health_applications"], dict)
        assert "applications" in result["mental_health_applications"]


class TestMetadataEnricher:
    """Test the MetadataEnricher component."""

    def test_extract_principles(self):
        """Test principle extraction from verse content."""
        verse = {
            "english": "Perform your duty with detachment",
            "context": "About action without attachment",
            "theme": "action",
        }
        principles = MetadataEnricher.extract_principles(verse)

        assert isinstance(principles, list)
        assert "action" in principles or "detachment" in principles

    def test_extract_keywords(self):
        """Test keyword extraction from verse text."""
        verse = {
            "english": "Find inner peace through meditation and mindfulness",
            "context": "About achieving peace",
        }
        keywords = MetadataEnricher.extract_keywords(verse)

        assert isinstance(keywords, list)
        assert len(keywords) > 0
        assert any(word in keywords for word in ["peace", "meditation", "mindfulness"])

    def test_suggest_applications(self):
        """Test mental health application suggestions."""
        verse = {
            "english": "Stay calm in times of stress and anxiety",
            "context": "About managing worry and fear",
            "mental_health_applications": {"applications": []},
        }
        suggestions = MetadataEnricher.suggest_applications(verse)

        assert isinstance(suggestions, list)
        # Should suggest anxiety_management based on keywords
        assert "anxiety_management" in suggestions or "stress_reduction" in suggestions

    def test_create_searchable_text(self):
        """Test searchable text creation."""
        verse = {
            "english": "English text",
            "hindi": "Hindi text",
            "context": "Context text",
            "theme": "inner_peace",
            "mental_health_applications": {"applications": ["anxiety"]},
        }
        searchable = MetadataEnricher.create_searchable_text(verse)

        assert "English text" in searchable
        assert "Hindi text" in searchable
        assert "Context text" in searchable
        assert "anxiety" in searchable

    def test_add_chapter_context(self):
        """Test adding chapter context."""
        verse = {"chapter": 2, "verse_number": 47}
        result = MetadataEnricher.add_chapter_context(verse)

        assert "chapter_theme" in result
        assert result["chapter_theme"] == "wisdom_and_knowledge"

    def test_calculate_metadata_score(self):
        """Test metadata score calculation."""
        verse = {
            "english": "text",
            "hindi": "text",
            "sanskrit": "text",
            "context": "text",
            "theme": "test",
            "mental_health_applications": {"applications": ["anxiety", "stress"]},
            "principles": ["action", "wisdom"],
            "keywords": ["test"] * 10,
            "chapter_theme": "test",
        }
        score = MetadataEnricher.calculate_metadata_score(verse)

        assert 0.0 <= score <= 1.0
        assert score > 0.7  # Should have high score with all fields

    def test_enrich_verse(self):
        """Test full enrichment of a verse."""
        verse = {
            "chapter": 2,
            "verse_number": 47,
            "english": "Perform your duty without attachment",
            "context": "About action and detachment",
            "theme": "action",
            "mental_health_applications": {"applications": ["anxiety"]},
        }
        result = MetadataEnricher.enrich(verse)

        assert "principles" in result
        assert "keywords" in result
        assert "suggested_applications" in result
        assert "searchable_text" in result


class TestContextTransformationPipeline:
    """Test the main Pipeline orchestrator."""

    def test_create_full_pipeline(self):
        """Test creating a full pipeline."""
        pipeline = ContextTransformationPipeline.create_full_pipeline()

        assert pipeline.enable_validation is True
        assert pipeline.enable_sanitization is True
        assert pipeline.enable_enrichment is True

    def test_create_minimal_pipeline(self):
        """Test creating a minimal pipeline."""
        pipeline = ContextTransformationPipeline.create_minimal_pipeline()

        assert pipeline.enable_validation is True
        assert pipeline.enable_sanitization is False
        assert pipeline.enable_enrichment is False

    def test_transform_single_verse(self):
        """Test transforming a single verse."""
        pipeline = ContextTransformationPipeline.create_full_pipeline()

        verse = {
            "chapter": 2,
            "verse_number": 47,
            "theme": "action",
            "english": "Krishna taught Arjuna about duty",
            "hindi": "test",
            "sanskrit": "test",
            "context": "About duty",
            "mental_health_applications": ["anxiety"],
        }

        result = pipeline.transform(verse)

        # Should have verse_id from normalization
        assert result["verse_id"] == "2.47"

        # Should be sanitized
        assert "krishna" not in result["english"].lower()
        assert "arjuna" not in result["english"].lower()

        # Should be enriched
        assert "principles" in result
        assert "keywords" in result
        assert "metadata_score" in result

    def test_transform_batch(self):
        """Test batch transformation."""
        pipeline = ContextTransformationPipeline.create_full_pipeline()

        verses = [
            {
                "chapter": 2,
                "verse_number": 47,
                "theme": "action",
                "english": "test 1",
                "mental_health_applications": ["anxiety"],
            },
            {
                "chapter": 6,
                "verse_number": 5,
                "theme": "self_control",
                "english": "test 2",
                "mental_health_applications": ["stress"],
            },
        ]

        results = pipeline.transform_batch(verses)

        assert len(results) == 2
        assert results[0]["verse_id"] == "2.47"
        assert results[1]["verse_id"] == "6.5"

    def test_validate_only(self):
        """Test validation-only mode."""
        pipeline = ContextTransformationPipeline()

        verse = {"chapter": 2, "verse_number": 47, "theme": "action", "english": "test"}

        report = pipeline.validate_only(verse)

        assert "is_valid" in report
        assert "errors" in report
        assert "completeness" in report
        assert report["is_valid"] is True

    def test_get_statistics(self):
        """Test getting pipeline statistics."""
        pipeline = ContextTransformationPipeline.create_full_pipeline()

        verse = {
            "chapter": 2,
            "verse_number": 47,
            "theme": "action",
            "english": "test",
            "mental_health_applications": ["anxiety"],
        }

        pipeline.transform(verse)
        stats = pipeline.get_statistics()

        assert stats["processed"] == 1
        assert stats["validated"] == 1
        assert stats["sanitized"] == 1
        assert stats["enriched"] == 1

    def test_reset_statistics(self):
        """Test resetting pipeline statistics."""
        pipeline = ContextTransformationPipeline.create_full_pipeline()

        verse = {
            "chapter": 2,
            "verse_number": 47,
            "theme": "action",
            "english": "test",
            "mental_health_applications": ["anxiety"],
        }

        pipeline.transform(verse)
        pipeline.reset_statistics()
        stats = pipeline.get_statistics()

        assert stats["processed"] == 0

    def test_strict_mode_raises_on_error(self):
        """Test strict mode raises exceptions."""
        pipeline = ContextTransformationPipeline.create_full_pipeline(strict=True)

        invalid_verse = {
            "chapter": 2,
            # Missing required fields
        }

        with pytest.raises(PipelineError):
            pipeline.transform(invalid_verse)

    def test_non_strict_mode_returns_original_on_error(self):
        """Test non-strict mode returns original data on error."""
        pipeline = ContextTransformationPipeline.create_full_pipeline(strict=False)

        invalid_verse = {
            "chapter": 2,
            "verse_number": 47,
            # Missing theme and english
        }

        result = pipeline.transform(invalid_verse)
        # Should return original data without raising
        assert result == invalid_verse

    def test_export_configuration(self):
        """Test exporting pipeline configuration."""
        pipeline = ContextTransformationPipeline(
            enable_validation=True,
            enable_sanitization=True,
            enable_enrichment=False,
            strict_mode=True,
        )

        config = pipeline.export_configuration()

        assert config["enable_validation"] is True
        assert config["enable_sanitization"] is True
        assert config["enable_enrichment"] is False
        assert config["strict_mode"] is True

    def test_custom_stage(self):
        """Test adding and using custom transformation stage."""
        pipeline = ContextTransformationPipeline.create_full_pipeline()

        # Add custom stage
        def add_custom_field(verse_data):
            verse_data["custom"] = "test_value"
            return verse_data

        pipeline.add_custom_stage("custom_stage", add_custom_field)

        verse = {
            "chapter": 2,
            "verse_number": 47,
            "theme": "action",
            "english": "test",
            "mental_health_applications": ["anxiety"],
        }

        result = pipeline.transform_with_custom_stages(verse)

        assert "custom" in result
        assert result["custom"] == "test_value"

    def test_selective_stages(self):
        """Test pipeline with selective stages enabled."""
        # Only sanitization, no enrichment
        pipeline = ContextTransformationPipeline(
            enable_validation=True, enable_sanitization=True, enable_enrichment=False
        )

        verse = {
            "chapter": 2,
            "verse_number": 47,
            "theme": "action",
            "english": "Krishna taught",
            "mental_health_applications": ["anxiety"],
        }

        result = pipeline.transform(verse)

        # Should be sanitized
        assert "krishna" not in result["english"].lower()

        # Should NOT have enrichment fields
        assert "principles" not in result
        assert "keywords" not in result
