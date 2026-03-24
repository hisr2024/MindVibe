"""
Unit tests for KarmaResetEngine and module-level fallback functions.

Tests the AI orchestration layer including prompt building, JSON parsing,
fallback guidance generation, and the engine's generate pipeline.
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from backend.services.karma_reset_engine import (
    KarmaResetEngine,
    get_deep_fallback_guidance,
    get_legacy_fallback_guidance,
    FALLBACK_GUIDANCE,
    _CATEGORY_GITA_CONTEXT,
    _BREATH_CONTEXT_TEMPLATE,
    _SHAD_RIPU_NAMES,
    _PHASE_KEYS,
    _LEGACY_KEYS,
)
from backend.services.gita_karma_wisdom import KARMIC_PATHS, SEVEN_PHASES


# ==================== Legacy Fallback Tests ====================


class TestLegacyFallbackGuidance:
    """Test get_legacy_fallback_guidance function."""

    def test_returns_apology_fallback(self):
        result = get_legacy_fallback_guidance("apology")
        assert "breathingLine" in result
        assert "rippleSummary" in result
        assert "repairAction" in result
        assert "forwardIntention" in result

    def test_returns_clarification_fallback(self):
        result = get_legacy_fallback_guidance("clarification")
        assert "clarity" in result["forwardIntention"].lower() or "clarif" in result["breathingLine"].lower()

    def test_returns_calm_followup_fallback(self):
        result = get_legacy_fallback_guidance("calm_followup")
        # calm_followup gets converted to calm-followup which partial-matches calm_followup key
        assert "breathingLine" in result
        assert "repairAction" in result

    def test_self_forgive_fallback(self):
        result = get_legacy_fallback_guidance("self-forgive")
        assert "self-compassion" in result["breathingLine"].lower() or "self" in result["breathingLine"].lower()

    def test_partial_match_key(self):
        """Test that partial key matching works (e.g. 'calm' matches 'calm_followup')."""
        result = get_legacy_fallback_guidance("calm")
        # Should find calm_followup via partial match
        assert result is not None
        assert "breathingLine" in result

    def test_unknown_type_defaults_to_apology(self):
        result = get_legacy_fallback_guidance("nonexistent_type")
        assert result == FALLBACK_GUIDANCE["apology"]

    def test_handles_underscores_and_dashes(self):
        result = get_legacy_fallback_guidance("calm_followup")
        assert result is not None
        assert "breathingLine" in result


# ==================== Deep Fallback Tests ====================


class TestDeepFallbackGuidance:
    """Test get_deep_fallback_guidance function."""

    def test_returns_7_phases(self):
        path = KARMIC_PATHS["kshama"]
        result = get_deep_fallback_guidance(path)
        assert "phases" in result
        assert len(result["phases"]) == 7

    def test_returns_sadhana(self):
        path = KARMIC_PATHS["kshama"]
        result = get_deep_fallback_guidance(path)
        assert "sadhana" in result

    def test_phases_have_required_keys(self):
        path = KARMIC_PATHS["satya"]
        result = get_deep_fallback_guidance(path)
        for phase in result["phases"]:
            assert "phase" in phase
            assert "name" in phase
            assert "sanskrit_name" in phase
            assert "english_name" in phase
            assert "icon" in phase
            assert "guidance" in phase
            assert len(phase["guidance"]) > 50

    def test_situation_injected_into_phases(self):
        path = KARMIC_PATHS["kshama"]
        result = get_deep_fallback_guidance(
            path, situation="I yelled at my friend", feeling="my friend"
        )
        # Situation should appear in guidance text
        phase1_text = result["phases"][0]["guidance"]
        assert "I yelled at my friend" in phase1_text

    def test_shad_ripu_krodha_customizes_guidance(self):
        path = KARMIC_PATHS["shanti"]
        result = get_deep_fallback_guidance(
            path, situation="anger episode", feeling="partner", shad_ripu="krodha"
        )
        phase2 = result["phases"][1]["guidance"]
        assert "anger" in phase2.lower() or "krodha" in phase2.lower()

    def test_shad_ripu_moha_customizes_guidance(self):
        path = KARMIC_PATHS["kshama"]
        result = get_deep_fallback_guidance(
            path, situation="confused about career", feeling="family", shad_ripu="moha"
        )
        phase2 = result["phases"][1]["guidance"]
        assert "moha" in phase2.lower() or "delusion" in phase2.lower()

    def test_problem_category_adds_context(self):
        path = KARMIC_PATHS["kshama"]
        result = get_deep_fallback_guidance(
            path, situation="hurt partner", problem_category="relationship_conflict"
        )
        phase1 = result["phases"][0]["guidance"]
        assert "relationship" in phase1.lower() or "karma" in phase1.lower()

    def test_healing_insight_in_phase5(self):
        path = KARMIC_PATHS["kshama"]
        result = get_deep_fallback_guidance(
            path,
            situation="test",
            healing_insight="Forgiveness liberates the forgiver first",
        )
        phase5 = result["phases"][4]["guidance"]
        assert "Forgiveness liberates" in phase5

    def test_all_10_paths_produce_valid_fallback(self):
        for path_key, path in KARMIC_PATHS.items():
            result = get_deep_fallback_guidance(
                path, situation=f"test for {path_key}", feeling="someone"
            )
            assert len(result["phases"]) == 7, f"Failed for path {path_key}"

    def test_empty_situation_uses_default(self):
        path = KARMIC_PATHS["kshama"]
        result = get_deep_fallback_guidance(path, situation="", feeling="")
        phase1 = result["phases"][0]["guidance"]
        assert "this karmic moment" in phase1

    def test_breath_phase_uses_shad_ripu_template(self):
        """Phase 3 should use the shad-ripu specific breath template."""
        path = KARMIC_PATHS["kshama"]
        result = get_deep_fallback_guidance(
            path, situation="angry outburst", feeling="colleague", shad_ripu="krodha"
        )
        phase3 = result["phases"][2]["guidance"]
        assert "fire" in phase3.lower() or "anger" in phase3.lower()

    def test_breath_phase_uses_default_template(self):
        """Phase 3 should use default breath template when shad_ripu not recognized."""
        path = KARMIC_PATHS["kshama"]
        result = get_deep_fallback_guidance(
            path, situation="general problem", feeling="friend"
        )
        phase3 = result["phases"][2]["guidance"]
        assert "breath" in phase3.lower() or "prana" in phase3.lower()

    def test_all_new_categories_have_context(self):
        """All 16 problem categories should have Gita context."""
        expected = [
            "relationship_conflict", "work_career", "self_worth",
            "family_tensions", "anxiety_health", "loss_grief",
            "betrayal_injustice", "spiritual_crisis", "addiction",
            "financial_stress", "loneliness", "parenting",
            "academic_pressure", "social_anxiety", "decision_paralysis",
            "chronic_illness",
        ]
        for cat in expected:
            assert cat in _CATEGORY_GITA_CONTEXT, f"Missing category: {cat}"
            assert len(_CATEGORY_GITA_CONTEXT[cat]) > 50

    def test_all_shad_ripu_have_breath_template(self):
        """All 6 shad ripus + default should have breath templates."""
        for key in ["krodha", "moha", "kama", "lobha", "mada", "matsarya", "default"]:
            assert key in _BREATH_CONTEXT_TEMPLATE, f"Missing breath template: {key}"


# ==================== Engine Unit Tests ====================


class TestKarmaResetEngine:
    """Test KarmaResetEngine methods."""

    def setup_method(self):
        """Create engine with mocked OpenAI."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": ""}):
            self.engine = KarmaResetEngine()

    def test_engine_not_ready_without_key(self):
        """Engine should not be ready without OPENAI_API_KEY."""
        assert self.engine.ready is False

    def test_service_property_returns_service(self):
        """Engine.service should return a KarmaResetService instance."""
        svc = self.engine.service
        assert svc is not None
        assert hasattr(svc, "resolve_karmic_path")

    @pytest.mark.asyncio
    async def test_generate_uses_fallback_when_not_ready(self):
        """When AI is unavailable, generate should use fallback guidance."""
        mock_db = AsyncMock()

        with patch.object(
            self.engine._service,
            "generate_deep_reset",
            new_callable=AsyncMock,
            return_value={
                "karmic_path": KARMIC_PATHS["kshama"],
                "core_verse": KARMIC_PATHS["kshama"]["core_verse"],
                "supporting_verses": [],
                "sadhana": KARMIC_PATHS["kshama"]["sadhana"],
                "seven_phases": SEVEN_PHASES,
                "verse_display": [],
                "wisdom_context": "test context",
                "verse_results_count": 0,
            },
        ), patch.object(
            self.engine._service,
            "validate_reset_guidance",
            new_callable=AsyncMock,
            return_value={"valid": True, "score": 0.8, "five_pillar_score": 0.7},
        ):
            result = await self.engine.generate(
                db=mock_db,
                path_key="kshama",
                situation="I was rude to my sister",
                feeling="my sister",
            )

        assert result["model_used"] == "fallback"
        assert "karmic_path" in result
        assert "deep_guidance" in result
        assert "reset_guidance" in result
        assert "kiaan_metadata" in result
        assert len(result["deep_guidance"]["phases"]) == 7

    @pytest.mark.asyncio
    async def test_generate_handles_prepare_data_error(self):
        """When _prepare_deep_data fails, fallback data should be used."""
        mock_db = AsyncMock()

        with patch.object(
            self.engine._service,
            "generate_deep_reset",
            new_callable=AsyncMock,
            side_effect=Exception("DB connection failed"),
        ), patch.object(
            self.engine._service,
            "validate_reset_guidance",
            new_callable=AsyncMock,
            return_value={"valid": False, "score": 0.0},
        ):
            result = await self.engine.generate(
                db=mock_db,
                path_key="kshama",
                situation="test situation",
                feeling="test feeling",
            )

        # Should still produce a result via fallback
        assert result is not None
        assert result["model_used"] == "fallback"
        assert len(result["deep_guidance"]["phases"]) == 7

    def test_parse_phase_guidance(self):
        """Test _parse_phase_guidance builds correct structure."""
        ai_data = {}
        for key in _PHASE_KEYS:
            ai_data[key] = f"Guidance for {key}"

        deep_data = {"sadhana": [{"practice": "meditation"}]}
        result = self.engine._parse_phase_guidance(ai_data, deep_data)

        assert "phases" in result
        assert len(result["phases"]) == 7
        assert result["phases"][0]["phase"] == 1
        assert result["phases"][0]["name"] == SEVEN_PHASES[0]["name"]
        assert result["phases"][0]["guidance"] == "Guidance for phase_1_witness_awareness"
        assert result["sadhana"] == [{"practice": "meditation"}]

    def test_parse_phase_guidance_missing_keys_uses_defaults(self):
        """When AI data is missing keys, phase definitions should be used."""
        ai_data = {}  # empty response
        deep_data = {"sadhana": []}
        result = self.engine._parse_phase_guidance(ai_data, deep_data)

        assert len(result["phases"]) == 7
        # Should fall back to phase_def description
        for i, phase in enumerate(result["phases"]):
            assert phase["guidance"] == SEVEN_PHASES[i]["description"]

    def test_build_system_prompt(self):
        """Test _build_system_prompt includes key elements."""
        deep_data = {"wisdom_context": "Some Gita wisdom about forgiveness"}
        resolved_path = KARMIC_PATHS["kshama"]

        prompt = self.engine._build_system_prompt(
            deep_data=deep_data,
            resolved_path=resolved_path,
            situation="I hurt my friend",
            feeling="my friend",
            problem_category="relationship_conflict",
            shad_ripu="krodha",
            healing_insight="Forgiveness heals both parties",
        )

        assert "I hurt my friend" in prompt
        assert "my friend" in prompt
        assert "Kshama" in prompt
        assert "LIFE AREA" in prompt
        assert "Krodha" in prompt
        assert "Forgiveness heals both parties" in prompt
        assert "Some Gita wisdom" in prompt

    def test_build_system_prompt_without_problem_context(self):
        """Test prompt without problem_category/shad_ripu/healing_insight."""
        deep_data = {"wisdom_context": ""}
        resolved_path = KARMIC_PATHS["satya"]

        prompt = self.engine._build_system_prompt(
            deep_data=deep_data,
            resolved_path=resolved_path,
            situation="misunderstanding",
            feeling="colleague",
            problem_category="",
            shad_ripu="",
            healing_insight="",
        )

        assert "misunderstanding" in prompt
        assert "PROBLEM ANALYSIS" not in prompt

    def test_build_result(self):
        """Test _build_result assembles correct response structure."""
        deep_data = {
            "karmic_path": {"key": "kshama", "name": "Kshama"},
            "core_verse": {"chapter": 18, "verse": 66},
            "supporting_verses": [],
            "sadhana": [{"practice": "meditation"}],
            "verse_display": [
                {
                    "verse_id": "v1",
                    "chapter": 2,
                    "verse_number": 47,
                    "sanskrit": "test",
                    "transliteration": "test",
                    "english": "test",
                    "hindi": "test",
                    "theme": "karma",
                    "score": 0.9,
                }
            ],
            "wisdom_context": "context text",
            "verse_results_count": 1,
        }
        ai_guidance = {
            "phases": [{"phase": i + 1, "guidance": f"phase {i+1}"} for i in range(7)],
            "sadhana": [],
        }
        legacy_guidance = {
            "breathingLine": "breathe",
            "rippleSummary": "ripple",
            "repairAction": "repair",
            "forwardIntention": "forward",
        }
        validation_result = {
            "valid": True,
            "score": 0.85,
            "five_pillar_score": 0.9,
            "compliance_level": "high",
            "pillars_met": 4,
            "gita_terms_found": ["dharma", "karma"],
        }

        result = self.engine._build_result(
            deep_data=deep_data,
            ai_guidance=ai_guidance,
            legacy_guidance=legacy_guidance,
            validation_result=validation_result,
            path_key="kshama",
            model_used="gpt-4",
        )

        assert result["karmic_path"]["key"] == "kshama"
        assert len(result["deep_guidance"]["phases"]) == 7
        assert result["reset_guidance"] == legacy_guidance
        assert result["kiaan_metadata"]["verses_used"] == 1
        assert result["kiaan_metadata"]["validation_passed"] is True
        assert result["kiaan_metadata"]["five_pillar_score"] == 0.9
        assert result["model_used"] == "gpt-4"
        assert len(result["kiaan_metadata"]["verses"]) == 1

    @pytest.mark.asyncio
    async def test_validate_guidance(self):
        """Test _validate_guidance delegates to service."""
        ai_guidance = {
            "phases": [
                {"phase": i + 1, "guidance": f"Phase {i+1} guidance text here"}
                for i in range(7)
            ]
        }
        deep_data = {"wisdom_context": "context"}

        with patch.object(
            self.engine._service,
            "validate_reset_guidance",
            new_callable=AsyncMock,
            return_value={"valid": True, "score": 0.9},
        ) as mock_validate:
            result = await self.engine._validate_guidance(ai_guidance, deep_data)

        assert result["valid"] is True
        mock_validate.assert_called_once()
        call_kwargs = mock_validate.call_args
        assert "phase_1" in call_kwargs.kwargs.get("guidance", call_kwargs.args[0] if call_kwargs.args else {})

    @pytest.mark.asyncio
    async def test_generate_ai_guidance_returns_none_when_not_ready(self):
        """When engine is not ready, _generate_ai_guidance returns None tuple."""
        result = await self.engine._generate_ai_guidance(
            deep_data={},
            resolved_path=KARMIC_PATHS["kshama"],
            situation="test",
            feeling="test",
            problem_category="",
            shad_ripu="",
            healing_insight="",
        )

        assert result == (None, None, "fallback")
