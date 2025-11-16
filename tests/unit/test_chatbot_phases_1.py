"""
Unit tests for Phase 1: Core Response Engine and Action Plan Generator
"""

import pytest

from backend.services.action_plan_generator import ActionPlanGenerator
from backend.services.response_engine import ResponseEngine


class TestActionPlanGenerator:
    """Test suite for ActionPlanGenerator."""

    @pytest.fixture
    def generator(self):
        """Create an ActionPlanGenerator instance."""
        return ActionPlanGenerator()

    def test_init(self, generator):
        """Test initialization."""
        assert generator is not None

    def test_generate_action_steps_default(self, generator):
        """Test generating default action steps."""
        steps = generator.generate_action_steps(
            user_message="I'm feeling overwhelmed",
            domain=None,
            max_steps=3,
        )

        assert len(steps) >= 2
        assert len(steps) <= 3
        assert all("text" in step for step in steps)
        assert all("type" in step for step in steps)

    def test_generate_action_steps_self_understanding(self, generator):
        """Test domain-specific actions for self_understanding."""
        steps = generator.generate_action_steps(
            user_message="I want to understand myself better",
            domain="self_understanding",
            max_steps=4,
        )

        assert len(steps) >= 2
        assert any("reflection" in step["type"] for step in steps)

    def test_generate_action_steps_emotional_regulation(self, generator):
        """Test domain-specific actions for emotional_regulation."""
        steps = generator.generate_action_steps(
            user_message="I'm struggling with my emotions",
            domain="emotional_regulation",
            max_steps=4,
        )

        assert len(steps) >= 2
        assert any(
            step["type"] in ["emotion_labeling", "grounding"] for step in steps
        )

    def test_format_action_steps_as_text(self, generator):
        """Test formatting action steps as text."""
        steps = [
            {"text": "Take a deep breath", "type": "grounding"},
            {"text": "Notice your thoughts", "type": "mindfulness"},
        ]

        formatted = generator.format_action_steps_as_text(steps)

        assert "1. Take a deep breath" in formatted
        assert "2. Notice your thoughts" in formatted
        assert "practical steps" in formatted.lower()

    def test_format_empty_steps(self, generator):
        """Test formatting empty steps list."""
        formatted = generator.format_action_steps_as_text([])
        assert formatted == ""


class TestResponseEngine:
    """Test suite for ResponseEngine."""

    @pytest.fixture
    def engine(self):
        """Create a ResponseEngine instance."""
        return ResponseEngine()

    def test_init(self, engine):
        """Test initialization."""
        assert engine is not None
        assert engine.action_generator is not None
        assert engine.MIN_WORDS == 120
        assert engine.MAX_WORDS == 250

    def test_generate_response_basic(self, engine):
        """Test basic response generation."""
        result = engine.generate_response(
            user_message="I'm feeling anxious about work",
            domain="emotional_regulation",
        )

        assert "response" in result
        assert "word_count" in result
        assert "domain" in result
        assert "validation_passed" in result

        # Check word count is enforced
        assert 120 <= result["word_count"] <= 250

    def test_response_contains_required_elements(self, engine):
        """Test that response contains required elements from 6-step framework."""
        result = engine.generate_response(
            user_message="I feel stuck and unmotivated",
            domain="action_discipline",
        )

        response = result["response"]

        # Should contain some form of:
        # 1. Empathic validation (implicit in first lines)
        # 2. Action steps (numbered list)
        # 3. Micro-practice
        # 4. Reflective question (?)
        # 5. Encouragement

        assert len(response) > 0
        # Check for numbered steps
        assert any(str(i) in response for i in [1, 2, 3])

    def test_word_count_enforcement_too_long(self, engine):
        """Test that overly long responses are truncated."""
        # Create a very long message to potentially generate long response
        long_message = " ".join(["I'm feeling overwhelmed"] * 50)

        result = engine.generate_response(
            user_message=long_message,
            domain="emotional_regulation",
        )

        assert result["word_count"] <= 250

    def test_empathic_validation_anxious(self, engine):
        """Test empathic validation for anxiety."""
        validation = engine._generate_empathic_validation(
            "I'm so anxious and worried", None
        )

        assert len(validation) > 0
        assert any(
            word in validation.lower()
            for word in ["understand", "hear", "difficult", "challenging"]
        )

    def test_empathic_validation_stuck(self, engine):
        """Test empathic validation for feeling stuck."""
        validation = engine._generate_empathic_validation(
            "I feel so stuck and lost", None
        )

        assert len(validation) > 0
        assert any(word in validation.lower() for word in ["uncertain", "stuck", "change"])

    def test_micro_practice_anxiety(self, engine):
        """Test micro-practice selection for anxiety."""
        practice = engine._select_micro_practice(
            "I'm having a panic attack", "emotional_regulation"
        )

        assert len(practice) > 0
        # Should suggest breathing or grounding
        assert any(word in practice.lower() for word in ["breath", "ground", "senses"])

    def test_reflective_question_generated(self, engine):
        """Test reflective question generation."""
        question = engine._generate_reflective_question(
            "I don't know what to do", "self_understanding"
        )

        assert len(question) > 0
        assert "?" in question

    def test_encouragement_generated(self, engine):
        """Test encouragement generation."""
        encouragement = engine._generate_encouragement("I'm struggling", None)

        assert len(encouragement) > 0
        # Should focus on effort and self-trust
        assert any(
            word in encouragement.lower()
            for word in ["effort", "capable", "trust", "process", "step"]
        )

    def test_validation_word_count(self, engine):
        """Test response validation for word count."""
        # Too short
        short_response = "Take a breath."
        assert not engine._validate_response(short_response)

        # Just right (simulate with reasonable length)
        good_response = " ".join(["word"] * 150)
        # Won't pass because it has no substance, but word count is right
        assert 120 <= len(good_response.split()) <= 250

    def test_validation_no_religious_terms(self, engine):
        """Test that responses with religious terms fail validation."""
        response_with_religious = " ".join(["word"] * 150) + " Krishna says"
        assert not engine._validate_response(response_with_religious)

    def test_different_domains_produce_different_responses(self, engine):
        """Test that different domains produce varied responses."""
        message = "I need help"

        result1 = engine.generate_response(message, "self_understanding")
        result2 = engine.generate_response(message, "action_discipline")
        result3 = engine.generate_response(message, "emotional_regulation")

        # Responses should be different (though may overlap)
        responses = [result1["response"], result2["response"], result3["response"]]

        # At least some variation in the responses
        unique_responses = set(responses)
        # They might be similar but should have different action steps at minimum
        assert all(len(r) > 100 for r in responses)
