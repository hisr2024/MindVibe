"""
Unit tests for Phase 4: Evidence-Based Psychology Integration
"""

import pytest

from backend.services.psychology_patterns import PsychologyPatterns


class TestPsychologyPatterns:
    """Test suite for PsychologyPatterns."""

    @pytest.fixture
    def patterns(self):
        """Create a PsychologyPatterns instance."""
        return PsychologyPatterns()

    def test_init(self, patterns):
        """Test initialization."""
        assert patterns is not None

    # ==================== CBT Patterns ====================

    def test_get_cognitive_restructuring_pattern(self, patterns):
        """Test cognitive restructuring pattern."""
        pattern = patterns.get_cognitive_restructuring_pattern("I'm worried")

        assert len(pattern) > 0
        assert any(
            word in pattern.lower()
            for word in ["thought", "evidence", "challenge", "perspective"]
        )

    def test_get_thought_labeling_technique(self, patterns):
        """Test thought labeling technique."""
        technique = patterns.get_thought_labeling_technique("anxiety")

        assert len(technique) > 0
        assert "labeling" in technique.lower()
        assert "thought" in technique.lower()

    def test_get_behavioral_experiment_pattern(self, patterns):
        """Test behavioral experiment pattern."""
        experiment = patterns.get_behavioral_experiment_pattern("fear")

        assert len(experiment) > 0
        assert any(word in experiment.lower() for word in ["experiment", "test", "try"])

    # ==================== ACT Patterns ====================

    def test_get_values_clarification_exercise(self, patterns):
        """Test values clarification exercise."""
        exercise = patterns.get_values_clarification_exercise()

        assert "instruction" in exercise
        assert "questions" in exercise
        assert "reflection" in exercise
        assert len(exercise["questions"]) > 0
        assert all("?" in q for q in exercise["questions"])

    def test_get_acceptance_based_coping(self, patterns):
        """Test acceptance-based coping."""
        coping = patterns.get_acceptance_based_coping("difficult emotions")

        assert len(coping) > 0
        assert any(
            word in coping.lower()
            for word in ["accept", "room", "make space", "notice", "observe"]
        )

    def test_get_committed_action_step(self, patterns):
        """Test committed action step."""
        action = patterns.get_committed_action_step()

        assert len(action) > 0
        assert any(word in action.lower() for word in ["action", "value", "care", "matter"])

    # ==================== Mindfulness Patterns ====================

    def test_get_breathing_exercise_4_2_6(self, patterns):
        """Test 4-2-6 breathing exercise."""
        exercise = patterns.get_breathing_exercise("4-2-6")

        assert exercise["name"] == "4-2-6 Breathing"
        assert "instruction" in exercise
        assert "4" in exercise["instruction"]
        assert "2" in exercise["instruction"]
        assert "6" in exercise["instruction"]
        assert "benefit" in exercise

    def test_get_breathing_exercise_box(self, patterns):
        """Test box breathing exercise."""
        exercise = patterns.get_breathing_exercise("box")

        assert exercise["name"] == "Box Breathing"
        assert "4" in exercise["instruction"]

    def test_get_breathing_exercise_default(self, patterns):
        """Test default breathing exercise."""
        exercise = patterns.get_breathing_exercise("unknown")

        # Should return 4-2-6 as default
        assert "4-2-6" in exercise["name"]

    def test_get_grounding_technique_5_4_3_2_1(self, patterns):
        """Test 5-4-3-2-1 grounding technique."""
        technique = patterns.get_grounding_technique("5-4-3-2-1")

        assert technique["name"] == "5-4-3-2-1 Grounding"
        assert "instruction" in technique
        assert "5" in technique["instruction"]
        assert "senses" in technique["instruction"].lower() or "see" in technique["instruction"].lower()
        assert "purpose" in technique

    def test_get_grounding_technique_body_scan(self, patterns):
        """Test body scan grounding."""
        technique = patterns.get_grounding_technique("body_scan")

        assert "Body Scan" in technique["name"]
        assert "body" in technique["instruction"].lower()

    def test_get_grounding_technique_physical(self, patterns):
        """Test physical grounding."""
        technique = patterns.get_grounding_technique("physical_grounding")

        assert "Physical" in technique["name"]
        assert any(word in technique["instruction"].lower() for word in ["feet", "floor", "hands"])

    def test_get_observation_without_judgment(self, patterns):
        """Test observation without judgment."""
        observation = patterns.get_observation_without_judgment()

        assert len(observation) > 0
        assert any(word in observation.lower() for word in ["observe", "notice", "judgment"])

    # ==================== Behavioral Activation ====================

    def test_get_small_action_step(self, patterns):
        """Test small action step generation."""
        action = patterns.get_small_action_step("feeling stuck")

        assert "action" in action
        assert "examples" in action
        assert "tracking" in action
        assert len(action["examples"]) > 0

    def test_get_habit_structuring_guidance(self, patterns):
        """Test habit structuring guidance."""
        guidance = patterns.get_habit_structuring_guidance()

        assert "principle" in guidance
        assert "steps" in guidance
        assert "example" in guidance
        assert len(guidance["steps"]) > 0

    def test_get_progress_tracking_suggestion(self, patterns):
        """Test progress tracking suggestion."""
        suggestion = patterns.get_progress_tracking_suggestion()

        assert len(suggestion) > 0
        assert any(word in suggestion.lower() for word in ["track", "effort", "progress"])

    # ==================== Values Clarification ====================

    def test_get_values_identification_prompts(self, patterns):
        """Test values identification prompts."""
        prompts = patterns.get_values_identification_prompts()

        assert len(prompts) > 0
        assert all("?" in prompt for prompt in prompts)
        assert any("value" in prompt.lower() for prompt in prompts)

    def test_connect_action_to_values(self, patterns):
        """Test connecting action to values."""
        connection = patterns.connect_action_to_values(
            action="help a friend",
            value="compassion",
        )

        assert len(connection) > 0
        assert "help a friend" in connection
        assert "compassion" in connection
        assert any(word in connection.lower() for word in ["value", "align", "matter"])

    def test_get_service_altruism_suggestion(self, patterns):
        """Test service/altruism suggestion."""
        suggestion = patterns.get_service_altruism_suggestion()

        assert "principle" in suggestion
        assert "small_acts" in suggestion
        assert "reflection" in suggestion
        assert len(suggestion["small_acts"]) > 0

    # ==================== Pattern Selection ====================

    def test_select_pattern_for_thoughts(self, patterns):
        """Test pattern selection for thought-related message."""
        result = patterns.select_pattern_for_context(
            "I keep having negative thoughts about myself"
        )

        assert result["type"] == "CBT"
        assert result["pattern"] == "cognitive_restructuring"
        assert "content" in result

    def test_select_pattern_for_anxiety(self, patterns):
        """Test pattern selection for anxiety."""
        result = patterns.select_pattern_for_context(
            "I'm feeling anxious and panicky"
        )

        assert result["type"] == "Mindfulness"
        assert result["pattern"] == "breathing_exercise"
        assert "content" in result

    def test_select_pattern_for_stuck(self, patterns):
        """Test pattern selection for feeling stuck."""
        result = patterns.select_pattern_for_context(
            "I feel stuck and unmotivated"
        )

        assert result["type"] == "Behavioral Activation"
        assert result["pattern"] == "small_action"
        assert "content" in result

    def test_select_pattern_for_meaning(self, patterns):
        """Test pattern selection for meaning/purpose."""
        result = patterns.select_pattern_for_context(
            "I'm searching for meaning and purpose"
        )

        assert result["type"] == "ACT"
        assert result["pattern"] == "values_clarification"
        assert "content" in result

    def test_select_pattern_default(self, patterns):
        """Test default pattern selection."""
        result = patterns.select_pattern_for_context(
            "I need some help"
        )

        assert result["type"] == "Mindfulness"
        assert result["pattern"] == "observation"
        assert "content" in result

    # ==================== Integration Tests ====================

    def test_all_cbt_patterns_accessible(self, patterns):
        """Test that all CBT patterns are accessible."""
        # Should not raise any exceptions
        patterns.get_cognitive_restructuring_pattern("test")
        patterns.get_thought_labeling_technique("test")
        patterns.get_behavioral_experiment_pattern("test")

    def test_all_act_patterns_accessible(self, patterns):
        """Test that all ACT patterns are accessible."""
        patterns.get_values_clarification_exercise()
        patterns.get_acceptance_based_coping("test")
        patterns.get_committed_action_step()

    def test_all_mindfulness_patterns_accessible(self, patterns):
        """Test that all mindfulness patterns are accessible."""
        patterns.get_breathing_exercise()
        patterns.get_grounding_technique()
        patterns.get_observation_without_judgment()

    def test_all_behavioral_activation_patterns_accessible(self, patterns):
        """Test that all behavioral activation patterns are accessible."""
        patterns.get_small_action_step("test")
        patterns.get_habit_structuring_guidance()
        patterns.get_progress_tracking_suggestion()

    def test_all_values_patterns_accessible(self, patterns):
        """Test that all values patterns are accessible."""
        patterns.get_values_identification_prompts()
        patterns.connect_action_to_values("action", "value")
        patterns.get_service_altruism_suggestion()

    def test_breathing_exercises_have_consistent_structure(self, patterns):
        """Test that all breathing exercises have consistent structure."""
        techniques = ["4-2-6", "box", "5-5"]

        for technique in techniques:
            exercise = patterns.get_breathing_exercise(technique)
            assert "name" in exercise
            assert "instruction" in exercise
            assert "benefit" in exercise

    def test_grounding_techniques_have_consistent_structure(self, patterns):
        """Test that all grounding techniques have consistent structure."""
        techniques = ["5-4-3-2-1", "body_scan", "physical_grounding"]

        for technique in techniques:
            grounding = patterns.get_grounding_technique(technique)
            assert "name" in grounding
            assert "instruction" in grounding
            assert "purpose" in grounding
