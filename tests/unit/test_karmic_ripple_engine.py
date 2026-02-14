"""
Unit tests for the Karmic Ripple Engine.

Tests the core functionality of:
- Situation categorization
- Karmic chain building
- Ripple effect generation
- Repair action planning
- Visualization data generation
"""

import pytest
from backend.services.karmic_ripple_engine import (
    KarmicRippleEngine,
    KarmicChain,
    RippleEffect,
    RepairAction,
    KarmicResetPlan,
    KarmicIntent,
    ActionType,
    RippleTimeframe,
    Guna,
    RIPPLE_TEMPLATES,
    REPAIR_TYPE_GUIDANCE,
)


class TestKarmicRippleEngine:
    """Test suite for KarmicRippleEngine."""

    @pytest.fixture
    def engine(self):
        """Create a fresh engine instance for each test."""
        return KarmicRippleEngine()

    # =========================================================================
    # SITUATION CATEGORIZATION TESTS
    # =========================================================================

    def test_categorize_harsh_words(self, engine: KarmicRippleEngine):
        """Should categorize speech-related situations correctly."""
        situations = [
            "I yelled at my partner in anger",
            "I said some harsh words to my colleague",
            "I texted something mean to my friend",
        ]

        for situation in situations:
            category = engine._categorize_action(situation)
            assert category == "harsh_words"

    def test_categorize_broken_promise(self, engine: KarmicRippleEngine):
        """Should categorize promise-breaking situations correctly."""
        situations = [
            "I broke my promise to my child",
            "I said I would be there but didn't show up",
            "I forgot to do what I committed to",
        ]

        for situation in situations:
            category = engine._categorize_action(situation)
            assert category in ("broken_promise", "harsh_words", "neglecting_duty")

    def test_categorize_self_criticism(self, engine: KarmicRippleEngine):
        """Should categorize self-criticism correctly."""
        situations = [
            "I keep telling myself I'm so stupid",
            "I hate myself for what I did",
            "I'm such a failure, I can't do anything right",
        ]

        for situation in situations:
            category = engine._categorize_action(situation)
            assert category == "self_criticism"

    def test_categorize_neglecting_duty(self, engine: KarmicRippleEngine):
        """Should categorize duty neglect correctly."""
        situations = [
            "I procrastinated on my work again",
            "I didn't do what I was supposed to",
            "I avoided my responsibilities",
        ]

        for situation in situations:
            category = engine._categorize_action(situation)
            assert category in ("neglecting_duty", "broken_promise")

    def test_categorize_jealousy(self, engine: KarmicRippleEngine):
        """Should categorize jealousy correctly."""
        situations = [
            "I felt jealous of my friend's success",
            "I keep comparing myself to others",
            "It's not fair that they have what I don't",
        ]

        for situation in situations:
            category = engine._categorize_action(situation)
            assert category in ("jealousy_expressed", "self_criticism")

    # =========================================================================
    # KARMIC CHAIN BUILDING TESTS
    # =========================================================================

    def test_build_chain_includes_ripple_effects(self, engine: KarmicRippleEngine):
        """Should build chain with ripple effects."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel guilty about what I said")
        chain = engine._build_karmic_chain("I said harsh words", "harsh_words", mood)

        assert len(chain.ripple_effects) > 0
        assert all(isinstance(r, RippleEffect) for r in chain.ripple_effects)

    def test_chain_has_samskara_and_vasana(self, engine: KarmicRippleEngine):
        """Chain should include samskara and vasana patterns."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel regret")
        chain = engine._build_karmic_chain("I broke a promise", "broken_promise", mood)

        assert chain.samskara_impact != ""
        assert chain.vasana_pattern != ""

    def test_chain_has_repair_path(self, engine: KarmicRippleEngine):
        """Chain should include repair guidance."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel sorry")
        chain = engine._build_karmic_chain("I said something hurtful", "harsh_words", mood)

        assert chain.repair_path != ""
        assert chain.nishkama_alternative != ""

    def test_chain_has_karma_weight(self, engine: KarmicRippleEngine):
        """Chain should calculate karma weight."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel bad")
        chain = engine._build_karmic_chain("I hurt someone", "harsh_words", mood)

        # Negative actions should have negative karma weight
        assert -1 <= chain.total_karma_weight <= 1
        assert chain.total_karma_weight < 0  # Negative for harmful action

    def test_chain_has_reversibility_score(self, engine: KarmicRippleEngine):
        """Chain should calculate reversibility score."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I regret what I did")
        chain = engine._build_karmic_chain("I broke a promise", "broken_promise", mood)

        assert 0 <= chain.reversibility_score <= 1

    # =========================================================================
    # RIPPLE EFFECT TESTS
    # =========================================================================

    def test_ripple_effects_have_timeframes(self, engine: KarmicRippleEngine):
        """Ripple effects should span different timeframes."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel guilty")
        chain = engine._build_karmic_chain("I said harsh words", "harsh_words", mood)

        timeframes = [r.timeframe for r in chain.ripple_effects]

        # Should have at least immediate and short-term effects
        assert any(t == RippleTimeframe.IMMEDIATE for t in timeframes)
        assert any(t == RippleTimeframe.SHORT_TERM for t in timeframes)

    def test_ripple_effects_have_affected_domains(self, engine: KarmicRippleEngine):
        """Ripple effects should affect different domains."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel remorse")
        chain = engine._build_karmic_chain("I yelled at someone", "harsh_words", mood)

        domains = [r.affected_domain for r in chain.ripple_effects]

        # Should affect both self and relationships
        assert "self" in domains or "relationships" in domains

    def test_ripple_effects_have_valence(self, engine: KarmicRippleEngine):
        """Ripple effects should have positive/negative valence."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel bad")
        chain = engine._build_karmic_chain("I hurt someone", "harsh_words", mood)

        # Harmful actions should have negative valence effects
        valences = [r.valence for r in chain.ripple_effects]
        assert "negative" in valences

    # =========================================================================
    # REPAIR ACTION TESTS
    # =========================================================================

    def test_apology_repair_actions(self, engine: KarmicRippleEngine):
        """Should generate appropriate repair actions for apology."""
        plan = engine.analyze_situation(
            situation="I yelled at my partner",
            who_affected="my partner",
            repair_type="apology",
        )

        assert len(plan.repair_actions) > 0

        # Should include acknowledgment of harm
        action_texts = [a.action_description.lower() for a in plan.repair_actions]
        assert any("acknowledge" in t for t in action_texts)

    def test_clarification_repair_actions(self, engine: KarmicRippleEngine):
        """Should generate appropriate repair actions for clarification."""
        plan = engine.analyze_situation(
            situation="There was a misunderstanding with my colleague",
            who_affected="my colleague",
            repair_type="clarification",
        )

        assert len(plan.repair_actions) > 0

        # Should include listening
        action_texts = [a.action_description.lower() for a in plan.repair_actions]
        assert any("listen" in t or "request" in t for t in action_texts)

    def test_self_forgive_repair_actions(self, engine: KarmicRippleEngine):
        """Should generate appropriate repair actions for self-forgiveness."""
        plan = engine.analyze_situation(
            situation="I keep beating myself up for a mistake",
            who_affected="myself",
            repair_type="self_forgive",
        )

        assert len(plan.repair_actions) > 0

        # Should include self-compassion elements
        action_texts = [a.action_description.lower() for a in plan.repair_actions]
        assert any("compassion" in t or "friend" in t or "write" in t for t in action_texts)

    def test_repair_actions_have_gita_support(self, engine: KarmicRippleEngine):
        """Repair actions should include Gita wisdom support."""
        plan = engine.analyze_situation(
            situation="I said something hurtful",
            who_affected="my friend",
            repair_type="apology",
        )

        for action in plan.repair_actions:
            assert action.gita_support != ""
            # Should reference Bhagavad Gita
            assert "BG" in action.gita_support or "Gita" in action.gita_support.lower()

    # =========================================================================
    # COMPLETE PLAN TESTS
    # =========================================================================

    def test_plan_includes_breathing_guidance(self, engine: KarmicRippleEngine):
        """Complete plan should include breathing guidance."""
        plan = engine.analyze_situation(
            situation="I'm upset about what I did",
            who_affected="my family",
            repair_type="apology",
        )

        assert plan.breathing_guidance != ""
        assert "breath" in plan.breathing_guidance.lower()

    def test_plan_includes_ripple_acknowledgment(self, engine: KarmicRippleEngine):
        """Complete plan should acknowledge ripple effects."""
        plan = engine.analyze_situation(
            situation="I broke my promise",
            who_affected="my child",
            repair_type="apology",
        )

        assert plan.ripple_acknowledgment != ""
        assert "ripple" in plan.ripple_acknowledgment.lower()

    def test_plan_includes_forward_intention(self, engine: KarmicRippleEngine):
        """Complete plan should include forward intention."""
        plan = engine.analyze_situation(
            situation="I said harsh words",
            who_affected="my partner",
            repair_type="apology",
        )

        assert plan.forward_intention != ""
        assert "commit" in plan.forward_intention.lower()

    def test_plan_includes_mantra(self, engine: KarmicRippleEngine):
        """Complete plan should include a mantra."""
        plan = engine.analyze_situation(
            situation="I need to forgive myself",
            who_affected="myself",
            repair_type="self_forgive",
        )

        assert plan.mantra != ""

    def test_plan_includes_daily_practice(self, engine: KarmicRippleEngine):
        """Complete plan should include daily practice."""
        plan = engine.analyze_situation(
            situation="I was unkind",
            who_affected="my colleague",
            repair_type="calm_followup",
        )

        assert plan.daily_practice != ""

    # =========================================================================
    # VISUALIZATION DATA TESTS
    # =========================================================================

    def test_ripple_visualization_data(self, engine: KarmicRippleEngine):
        """Should generate visualization data for ripple effects."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel guilty")
        chain = engine._build_karmic_chain("I hurt someone", "harsh_words", mood)

        viz_data = engine.get_ripple_visualization_data(chain)

        assert "center_action" in viz_data
        assert "center_intent" in viz_data
        assert "center_guna" in viz_data
        assert "ripple_circles" in viz_data
        assert "total_karma" in viz_data
        assert "can_heal" in viz_data

    def test_ripple_circles_have_required_fields(self, engine: KarmicRippleEngine):
        """Ripple circles should have all required visualization fields."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel bad")
        chain = engine._build_karmic_chain("I broke a promise", "broken_promise", mood)

        viz_data = engine.get_ripple_visualization_data(chain)

        for circle in viz_data["ripple_circles"]:
            assert "id" in circle
            assert "radius" in circle
            assert "intensity" in circle
            assert "color" in circle
            assert "label" in circle
            assert "domain" in circle
            assert "timeframe" in circle
            assert "reversibility" in circle

    def test_can_heal_based_on_reversibility(self, engine: KarmicRippleEngine):
        """can_heal should be based on reversibility score."""
        from backend.services.mood_analytics_engine import mood_analytics

        mood = mood_analytics.analyze("I feel sorry")
        chain = engine._build_karmic_chain("I said something", "harsh_words", mood)

        viz_data = engine.get_ripple_visualization_data(chain)

        # can_heal should match reversibility > 0.5
        expected_can_heal = chain.reversibility_score > 0.5
        assert viz_data["can_heal"] == expected_can_heal


class TestRippleTemplates:
    """Test the ripple template configurations."""

    def test_all_templates_have_required_fields(self):
        """All templates should have required fields."""
        required_fields = [
            "action_type",
            "default_intent",
            "default_guna",
            "ripples",
            "samskara",
            "vasana",
            "repair_path",
            "nishkama",
        ]

        for template_name, template in RIPPLE_TEMPLATES.items():
            for field in required_fields:
                assert field in template, f"Template {template_name} missing {field}"

    def test_ripples_have_required_fields(self):
        """All ripple effects in templates should have required fields."""
        required_ripple_fields = [
            "description",
            "timeframe",
            "affected_domain",
            "intensity",
            "valence",
            "reversibility",
        ]

        for template_name, template in RIPPLE_TEMPLATES.items():
            for i, ripple in enumerate(template["ripples"]):
                for field in required_ripple_fields:
                    assert field in ripple, f"Template {template_name} ripple {i} missing {field}"


class TestRepairTypeGuidance:
    """Test the repair type guidance configurations."""

    def test_all_repair_types_have_guidance(self):
        """All repair types should have guidance defined."""
        expected_types = ["apology", "clarification", "calm_followup", "self_forgive"]

        for repair_type in expected_types:
            assert repair_type in REPAIR_TYPE_GUIDANCE

    def test_guidance_has_required_fields(self):
        """All guidance should have required fields."""
        required_fields = [
            "breathing_focus",
            "repair_principle",
            "gita_wisdom",
            "forward_intention",
            "mantra",
        ]

        for repair_type, guidance in REPAIR_TYPE_GUIDANCE.items():
            for field in required_fields:
                assert field in guidance, f"Repair type {repair_type} missing {field}"


class TestDataclassSerialization:
    """Test dataclass serialization methods."""

    def test_ripple_effect_to_dict(self):
        """RippleEffect should serialize correctly."""
        effect = RippleEffect(
            description="Test effect",
            timeframe=RippleTimeframe.IMMEDIATE,
            affected_domain="relationships",
            intensity=0.7,
            valence="negative",
            guna=Guna.RAJAS,
            reversibility=0.6,
        )

        result = effect.to_dict()

        assert result["description"] == "Test effect"
        assert result["timeframe"] == "immediate"
        assert result["intensity"] == 0.7
        assert result["guna"] == "rajas"

    def test_karmic_chain_to_dict(self):
        """KarmicChain should serialize correctly."""
        chain = KarmicChain(
            initial_action="Test action",
            action_type=ActionType.SPEECH,
            initial_intent=KarmicIntent.RAJASIC,
            guna_quality=Guna.RAJAS,
            ripple_effects=[],
            samskara_impact="Test samskara",
            vasana_pattern="Test vasana",
            repair_path="Test repair",
            gita_wisdom="Test wisdom",
            nishkama_alternative="Test alternative",
            total_karma_weight=-0.5,
            reversibility_score=0.6,
        )

        result = chain.to_dict()

        assert result["initial_action"] == "Test action"
        assert result["action_type"] == "speech"
        assert result["initial_intent"] == "rajasic"
        assert result["total_karma_weight"] == -0.5

    def test_repair_action_to_dict(self):
        """RepairAction should serialize correctly."""
        action = RepairAction(
            action_description="Apologize sincerely",
            action_type=ActionType.SPEECH,
            timing="Within 24 hours",
            difficulty=0.5,
            expected_outcome="Rebuild trust",
            gita_support="BG 17.15",
        )

        result = action.to_dict()

        assert result["action_description"] == "Apologize sincerely"
        assert result["action_type"] == "speech"
        assert result["difficulty"] == 0.5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
