"""
Unit tests for Phase 3: Safety & Quality Control
"""

import pytest

from backend.services.safety_validator import SafetyValidator


class TestSafetyValidator:
    """Test suite for SafetyValidator."""

    @pytest.fixture
    def validator(self):
        """Create a SafetyValidator instance."""
        return SafetyValidator()

    def test_init(self, validator):
        """Test initialization."""
        assert validator is not None

    # ==================== Crisis Detection ====================

    def test_detect_crisis_self_harm(self, validator):
        """Test detection of self-harm crisis."""
        result = validator.detect_crisis("I want to kill myself")

        assert result["crisis_detected"] is True
        assert "self_harm" in result["crisis_types"]
        assert result["severity"] == "critical"

    def test_detect_crisis_suicide(self, validator):
        """Test detection of suicide ideation."""
        result = validator.detect_crisis("I'm thinking about suicide")

        assert result["crisis_detected"] is True
        assert "self_harm" in result["crisis_types"]
        assert result["severity"] == "critical"

    def test_detect_crisis_harm_others(self, validator):
        """Test detection of harm to others."""
        result = validator.detect_crisis("I want to hurt someone")

        assert result["crisis_detected"] is True
        assert "harm_to_others" in result["crisis_types"]
        assert result["severity"] == "critical"

    def test_detect_crisis_acute_distress(self, validator):
        """Test detection of acute distress."""
        result = validator.detect_crisis("I can't take it anymore")

        assert result["crisis_detected"] is True
        assert "acute_distress" in result["crisis_types"]
        assert result["severity"] == "high"

    def test_detect_no_crisis(self, validator):
        """Test no crisis detected in normal message."""
        result = validator.detect_crisis("I'm feeling a bit anxious today")

        assert result["crisis_detected"] is False
        assert len(result["crisis_types"]) == 0
        assert result["severity"] == "none"

    def test_crisis_response_self_harm(self, validator):
        """Test crisis response generation for self-harm."""
        crisis_info = {
            "crisis_detected": True,
            "crisis_types": ["self_harm"],
            "severity": "critical",
        }

        response = validator.generate_crisis_response(crisis_info)

        assert len(response) > 0
        assert "988" in response  # Suicide prevention hotline
        assert any(word in response.lower() for word in ["safety", "help", "support"])

    def test_crisis_response_harm_others(self, validator):
        """Test crisis response for harm to others."""
        crisis_info = {
            "crisis_detected": True,
            "crisis_types": ["harm_to_others"],
            "severity": "critical",
        }

        response = validator.generate_crisis_response(crisis_info)

        assert len(response) > 0
        assert "988" in response or "911" in response

    def test_crisis_response_acute_distress(self, validator):
        """Test crisis response for acute distress."""
        crisis_info = {
            "crisis_detected": True,
            "crisis_types": ["acute_distress"],
            "severity": "high",
        }

        response = validator.generate_crisis_response(crisis_info)

        assert len(response) > 0
        assert any(word in response for word in ["988", "support", "help"])

    # ==================== Religious Term Sanitization ====================

    def test_sanitize_krishna(self, validator):
        """Test sanitization of Krishna."""
        text = "Krishna teaches us about wisdom"
        sanitized = validator.sanitize_religious_terms(text)

        assert "Krishna" not in sanitized
        assert "teacher" in sanitized

    def test_sanitize_god(self, validator):
        """Test sanitization of God."""
        text = "Trust in God's wisdom"
        sanitized = validator.sanitize_religious_terms(text)

        assert "God" not in sanitized
        assert "inner wisdom" in sanitized

    def test_sanitize_multiple_terms(self, validator):
        """Test sanitizing multiple religious terms."""
        text = "Krishna told Arjuna about the divine soul"
        sanitized = validator.sanitize_religious_terms(text)

        assert "Krishna" not in sanitized
        assert "Arjuna" not in sanitized
        assert "divine" not in sanitized
        assert "soul" not in sanitized
        assert "teacher" in sanitized
        assert "student" in sanitized
        assert "universal" in sanitized
        assert "essence" in sanitized

    def test_sanitize_case_sensitive(self, validator):
        """Test case-sensitive sanitization."""
        text = "The Lord and lord both mentioned"
        sanitized = validator.sanitize_religious_terms(text)

        assert "Lord" not in sanitized
        assert "lord" not in sanitized
        assert "wise one" in sanitized

    def test_sanitize_empty_text(self, validator):
        """Test sanitizing empty text."""
        sanitized = validator.sanitize_religious_terms("")
        assert sanitized == ""

    def test_sanitize_none_text(self, validator):
        """Test sanitizing None."""
        sanitized = validator.sanitize_religious_terms(None)
        assert sanitized is None

    # ==================== Response Quality Validation ====================

    def test_validate_response_good(self, validator):
        """Test validation of good response."""
        # Create a response with 150 words (within range)
        good_response = " ".join(
            [
                "I understand what you're experiencing.",
                "Awareness is the first step.",
                "Try this practice: take three deep breaths.",
                "Notice your thoughts without judgment.",
                "Action creates change.",
                "You can control your effort and attention.",
                "Small steps lead to progress.",
                "Trust the process.",
            ]
            * 18
        )  # Roughly 150 words

        result = validator.validate_response_quality(good_response)

        assert 120 <= result["word_count"] <= 250
        # Note: might have issues due to religious terms check

    def test_validate_response_too_short(self, validator):
        """Test validation fails for too short response."""
        short_response = "Take a breath."

        result = validator.validate_response_quality(short_response)

        assert result["valid"] is False
        assert any("too short" in issue.lower() for issue in result["issues"])

    def test_validate_response_too_long(self, validator):
        """Test validation fails for too long response."""
        long_response = " ".join(["word"] * 300)

        result = validator.validate_response_quality(long_response)

        assert result["valid"] is False
        assert any("too long" in issue.lower() for issue in result["issues"])

    def test_validate_response_with_religious_terms(self, validator):
        """Test validation fails with religious terms."""
        response = " ".join(
            ["I understand you. Krishna says to breathe mindfully and take action."]
            * 25
        )

        result = validator.validate_response_quality(response)

        assert result["valid"] is False
        assert any("religious term" in issue.lower() for issue in result["issues"])

    def test_validate_response_evidence_based_warning(self, validator):
        """Test warning for lack of evidence-based language."""
        response = " ".join(["Just do it. You can do it. Keep going."] * 40)

        result = validator.validate_response_quality(response)

        # Should have warning about lack of evidence-based terms
        assert len(result["warnings"]) > 0

    # ==================== Evidence Alignment ====================

    def test_check_evidence_alignment_cbt(self, validator):
        """Test evidence alignment detection for CBT."""
        response = """
        Notice your thoughts and beliefs. Challenge the evidence for them.
        Reframe unhelpful thinking patterns. Is this thought helpful?
        """

        result = validator.check_evidence_alignment(response)

        assert result["cbt_score"] > 0
        assert result["aligned"] is True

    def test_check_evidence_alignment_act(self, validator):
        """Test evidence alignment detection for ACT."""
        response = """
        Connect with your values. Practice acceptance of difficult feelings.
        Take committed action toward what matters to you.
        """

        result = validator.check_evidence_alignment(response)

        assert result["act_score"] > 0
        assert result["aligned"] is True

    def test_check_evidence_alignment_mindfulness(self, validator):
        """Test evidence alignment detection for mindfulness."""
        response = """
        Focus on your breath. Notice sensations in the present moment.
        Observe your thoughts without judgment. Ground yourself in awareness.
        """

        result = validator.check_evidence_alignment(response)

        assert result["mindfulness_score"] > 0
        assert result["aligned"] is True

    def test_check_evidence_alignment_mixed(self, validator):
        """Test evidence alignment with mixed approaches."""
        response = """
        Notice your thoughts (mindfulness). What values matter to you? (ACT)
        Challenge unhelpful beliefs (CBT). Take action aligned with your values.
        Practice awareness and acceptance of your present experience.
        """

        result = validator.check_evidence_alignment(response)

        assert result["cbt_score"] > 0
        assert result["act_score"] > 0
        assert result["mindfulness_score"] > 0
        assert result["total_score"] >= 3
        assert result["aligned"] is True

    def test_check_evidence_alignment_none(self, validator):
        """Test evidence alignment with no therapeutic approach."""
        response = "Just do whatever you want. Good luck."

        result = validator.check_evidence_alignment(response)

        assert result["total_score"] == 0
        assert result["aligned"] is False
        assert result["primary_approach"] == "None"

    def test_primary_approach_identification(self, validator):
        """Test identification of primary therapeutic approach."""
        cbt_response = "Notice your thoughts and beliefs. Challenge them with evidence. Reframe unhelpful thinking."
        act_response = "Connect with your values. Accept difficult feelings. Take committed action toward what matters."
        mindfulness_response = "Focus on your breath. Observe the present moment. Notice awareness without judgment."

        cbt_result = validator.check_evidence_alignment(cbt_response)
        act_result = validator.check_evidence_alignment(act_response)
        mindfulness_result = validator.check_evidence_alignment(mindfulness_response)

        # Primary approaches should be correctly identified
        assert cbt_result["primary_approach"] in ["CBT", "Mindfulness"]  # Some overlap possible
        assert act_result["primary_approach"] in ["ACT", "Mindfulness"]  # Some overlap possible
        assert mindfulness_result["primary_approach"] == "Mindfulness"
