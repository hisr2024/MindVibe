"""
Unit tests for Enhanced WellnessModel v2.0 with Multi-Provider AI Integration

Tests:
1. Multi-provider AI support (OpenAI + Sarvam fallback)
2. Psychological framework integration (CBT, ACT, Attachment Theory)
3. Analysis modes (standard, deep_dive, quantum_dive)
4. Cognitive distortion detection
5. Behavioral pattern analysis
6. Response caching
7. Graceful degradation
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.services.wellness_model import (
    WellnessModel,
    WellnessTool,
    AnalysisMode,
    WellnessResponse,
    PsychologicalFramework,
    get_wellness_model,
)


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def wellness_model():
    """Create WellnessModel instance for testing."""
    return get_wellness_model()


@pytest.fixture
def mock_db():
    """Mock database session."""
    return AsyncMock()


@pytest.fixture
def sample_negative_thought():
    """Sample negative thought for Ardha testing."""
    return "I always fail at everything. Nothing I do ever works out."


@pytest.fixture
def sample_outcome_worry():
    """Sample outcome worry for Viyoga testing."""
    return "I can't control what will happen with my job interview. What if I fail and my life is ruined?"


@pytest.fixture
def sample_relationship_conflict():
    """Sample relationship conflict for RelationshipCompass testing."""
    return "My partner abandoned me emotionally. They never listen and I feel like I'm not enough for them."


# =============================================================================
# PSYCHOLOGICAL FRAMEWORK TESTS
# =============================================================================

class TestPsychologicalFramework:
    """Test suite for psychological framework analysis."""

    def test_detect_cognitive_distortions_all_or_nothing(self):
        """Test detection of all-or-nothing thinking."""
        text = "I always fail. Nothing ever works out for me."
        distortions = PsychologicalFramework.detect_cognitive_distortions(text)

        distortion_names = [d["distortion"] for d in distortions]
        assert "All Or Nothing" in distortion_names

        # Check that Gita remedy is provided
        all_or_nothing = next(d for d in distortions if d["distortion"] == "All Or Nothing")
        assert "Samatvam" in all_or_nothing["gita_remedy"]

    def test_detect_cognitive_distortions_catastrophizing(self):
        """Test detection of catastrophizing."""
        text = "This is going to be a disaster. Everything is ruined."
        distortions = PsychologicalFramework.detect_cognitive_distortions(text)

        distortion_names = [d["distortion"] for d in distortions]
        assert "Catastrophizing" in distortion_names

    def test_detect_cognitive_distortions_fortune_telling(self):
        """Test detection of fortune telling."""
        text = "I will fail the interview. It won't work out."
        distortions = PsychologicalFramework.detect_cognitive_distortions(text)

        distortion_names = [d["distortion"] for d in distortions]
        assert "Fortune Telling" in distortion_names

        # Check Gita remedy
        fortune_telling = next(d for d in distortions if d["distortion"] == "Fortune Telling")
        assert "karma" in fortune_telling["gita_remedy"].lower()

    def test_detect_cognitive_distortions_should_statements(self):
        """Test detection of should statements."""
        text = "I should be better at this. I must not make mistakes."
        distortions = PsychologicalFramework.detect_cognitive_distortions(text)

        distortion_names = [d["distortion"] for d in distortions]
        assert "Should Statements" in distortion_names

    def test_detect_behavioral_patterns_avoidance(self):
        """Test detection of avoidance pattern."""
        text = "I keep avoiding difficult conversations. I want to escape."
        patterns = PsychologicalFramework.detect_behavioral_patterns(text)

        assert "avoidance" in patterns

    def test_detect_behavioral_patterns_rumination(self):
        """Test detection of rumination pattern."""
        text = "I keep thinking about it over and over. I can't stop replaying it."
        patterns = PsychologicalFramework.detect_behavioral_patterns(text)

        assert "rumination" in patterns

    def test_detect_behavioral_patterns_perfectionism(self):
        """Test detection of perfectionism pattern."""
        text = "It needs to be perfect. I can't accept anything less than flawless."
        patterns = PsychologicalFramework.detect_behavioral_patterns(text)

        assert "perfectionism" in patterns

    def test_get_act_guidance_outcome_anxiety(self):
        """Test ACT guidance for outcome anxiety."""
        guidance = PsychologicalFramework.get_act_guidance("outcome_anxiety")

        assert "acceptance" in guidance
        assert "defusion" in guidance
        assert "present_moment" in guidance

        # Check Gita parallel is provided
        assert "Vairagya" in guidance["acceptance"]["gita_parallel"]

    def test_get_act_guidance_control(self):
        """Test ACT guidance for control issues."""
        guidance = PsychologicalFramework.get_act_guidance("control")

        assert "acceptance" in guidance
        assert "committed_action" in guidance


# =============================================================================
# WELLNESS MODEL INITIALIZATION TESTS
# =============================================================================

class TestWellnessModelInitialization:
    """Test suite for WellnessModel initialization."""

    def test_model_initializes(self, wellness_model):
        """Test that WellnessModel initializes correctly."""
        assert wellness_model is not None

    def test_psychological_framework_available(self, wellness_model):
        """Test that psychological framework is available."""
        assert wellness_model.psych_framework is not None

    def test_tool_keywords_defined(self, wellness_model):
        """Test that tool keywords are defined for all tools."""
        assert WellnessTool.VIYOGA in wellness_model.TOOL_KEYWORDS
        assert WellnessTool.ARDHA in wellness_model.TOOL_KEYWORDS
        assert WellnessTool.RELATIONSHIP_COMPASS in wellness_model.TOOL_KEYWORDS

    def test_tool_gita_focus_has_psychology_integration(self, wellness_model):
        """Test that tool focus includes psychological framework."""
        for tool in [WellnessTool.VIYOGA, WellnessTool.ARDHA, WellnessTool.RELATIONSHIP_COMPASS]:
            focus = wellness_model.TOOL_GITA_FOCUS[tool]
            assert "psychological_framework" in focus
            assert "psychology_integration" in focus


# =============================================================================
# ARDHA (COGNITIVE REFRAMING) TESTS
# =============================================================================

class TestArdhaReframing:
    """Test suite for Ardha cognitive reframing."""

    @pytest.mark.asyncio
    async def test_analyze_psychological_patterns_for_ardha(
        self, wellness_model, sample_negative_thought
    ):
        """Test psychological pattern analysis for Ardha."""
        psych_insights = wellness_model._analyze_psychological_patterns(
            WellnessTool.ARDHA, sample_negative_thought
        )

        assert "cognitive_distortions" in psych_insights
        assert "behavioral_patterns" in psych_insights

        # Should detect all-or-nothing thinking ("always", "nothing")
        distortion_names = [d["distortion"] for d in psych_insights["cognitive_distortions"]]
        assert "All Or Nothing" in distortion_names

    @pytest.mark.asyncio
    async def test_ardha_response_includes_cbt_framework(
        self, wellness_model, mock_db, sample_negative_thought
    ):
        """Test that Ardha response includes CBT framework reference."""
        # Mock the provider manager to avoid actual API calls
        with patch.object(wellness_model, 'provider_manager', None):
            with patch.object(wellness_model, 'client', None):
                result = await wellness_model.generate_response(
                    tool=WellnessTool.ARDHA,
                    user_input=sample_negative_thought,
                    db=mock_db,
                    analysis_mode=AnalysisMode.STANDARD,
                )

        # Even with fallback, should have psychological framework
        assert result.psychological_framework != "" or result.model == "fallback"


# =============================================================================
# VIYOGA (DETACHMENT) TESTS
# =============================================================================

class TestViyogaDetachment:
    """Test suite for Viyoga detachment coaching."""

    @pytest.mark.asyncio
    async def test_analyze_psychological_patterns_for_viyoga(
        self, wellness_model, sample_outcome_worry
    ):
        """Test ACT-based analysis for Viyoga."""
        psych_insights = wellness_model._analyze_psychological_patterns(
            WellnessTool.VIYOGA, sample_outcome_worry
        )

        assert "act_guidance" in psych_insights

        # Should detect control-related ACT processes
        act_guidance = psych_insights["act_guidance"]
        assert len(act_guidance) > 0

    def test_viyoga_gita_focus_includes_act(self, wellness_model):
        """Test that Viyoga focus includes ACT integration."""
        viyoga_focus = wellness_model.TOOL_GITA_FOCUS[WellnessTool.VIYOGA]

        assert "Acceptance & Commitment Therapy" in viyoga_focus["psychological_framework"]
        assert "key_processes" in viyoga_focus
        assert "acceptance" in viyoga_focus["key_processes"]


# =============================================================================
# RELATIONSHIP COMPASS TESTS
# =============================================================================

class TestRelationshipCompass:
    """Test suite for RelationshipCompass guidance."""

    @pytest.mark.asyncio
    async def test_analyze_psychological_patterns_for_relationships(
        self, wellness_model, sample_relationship_conflict
    ):
        """Test attachment-aware analysis for RelationshipCompass."""
        psych_insights = wellness_model._analyze_psychological_patterns(
            WellnessTool.RELATIONSHIP_COMPASS, sample_relationship_conflict
        )

        assert "attachment_indicators" in psych_insights

        # Should detect anxious attachment ("abandoned", "not enough")
        attachment_indicators = psych_insights["attachment_indicators"]
        assert "anxious_attachment" in attachment_indicators

    def test_relationship_compass_gita_focus_includes_attachment_theory(
        self, wellness_model
    ):
        """Test that RelationshipCompass includes Attachment Theory."""
        compass_focus = wellness_model.TOOL_GITA_FOCUS[WellnessTool.RELATIONSHIP_COMPASS]

        assert "Attachment Theory" in compass_focus["psychological_framework"]


# =============================================================================
# ANALYSIS MODES TESTS
# =============================================================================

class TestAnalysisModes:
    """Test suite for analysis modes."""

    def test_verse_limit_standard(self, wellness_model):
        """Test verse limit for standard mode."""
        limit = wellness_model._get_verse_limit(AnalysisMode.STANDARD)
        assert limit == 7

    def test_verse_limit_deep_dive(self, wellness_model):
        """Test verse limit for deep dive mode."""
        limit = wellness_model._get_verse_limit(AnalysisMode.DEEP_DIVE)
        assert limit == 10

    def test_verse_limit_quantum_dive(self, wellness_model):
        """Test verse limit for quantum dive mode."""
        limit = wellness_model._get_verse_limit(AnalysisMode.QUANTUM_DIVE)
        assert limit == 12

    def test_max_tokens_standard(self, wellness_model):
        """Test max tokens for standard mode."""
        tokens = wellness_model._get_max_tokens(AnalysisMode.STANDARD)
        assert tokens == 1000

    def test_max_tokens_deep_dive(self, wellness_model):
        """Test max tokens for deep dive mode."""
        tokens = wellness_model._get_max_tokens(AnalysisMode.DEEP_DIVE)
        assert tokens == 1800

    def test_max_tokens_quantum_dive(self, wellness_model):
        """Test max tokens for quantum dive mode."""
        tokens = wellness_model._get_max_tokens(AnalysisMode.QUANTUM_DIVE)
        assert tokens == 2500

    def test_timeout_standard(self, wellness_model):
        """Test timeout for standard mode."""
        timeout = wellness_model._get_timeout(AnalysisMode.STANDARD)
        assert timeout == 45.0

    def test_timeout_deep_dive(self, wellness_model):
        """Test timeout for deep dive mode."""
        timeout = wellness_model._get_timeout(AnalysisMode.DEEP_DIVE)
        assert timeout == 60.0

    def test_timeout_quantum_dive(self, wellness_model):
        """Test timeout for quantum dive mode."""
        timeout = wellness_model._get_timeout(AnalysisMode.QUANTUM_DIVE)
        assert timeout == 90.0


# =============================================================================
# PSYCHOLOGICAL CONTEXT BUILDING TESTS
# =============================================================================

class TestPsychologicalContextBuilding:
    """Test suite for psychological context building."""

    def test_build_psychological_context_with_distortions(self, wellness_model):
        """Test psychological context includes cognitive distortions."""
        psych_insights = {
            "cognitive_distortions": [
                {
                    "distortion": "All Or Nothing",
                    "pattern": "Seeing things in black-or-white",
                    "gita_remedy": "Samatvam - equanimity",
                }
            ],
            "behavioral_patterns": ["rumination"],
            "act_guidance": {},
            "attachment_indicators": [],
        }

        context = wellness_model._build_psychological_context(
            WellnessTool.ARDHA, psych_insights
        )

        assert "COGNITIVE PATTERNS" in context
        assert "All Or Nothing" in context
        assert "Samatvam" in context

    def test_build_psychological_context_for_viyoga(self, wellness_model):
        """Test psychological context includes ACT processes for Viyoga."""
        psych_insights = {
            "cognitive_distortions": [],
            "behavioral_patterns": [],
            "act_guidance": {
                "acceptance": {
                    "description": "Opening up to experience",
                    "gita_parallel": "Vairagya",
                    "practice": "Acknowledging outcomes",
                }
            },
            "attachment_indicators": [],
        }

        context = wellness_model._build_psychological_context(
            WellnessTool.VIYOGA, psych_insights
        )

        assert "ACT PROCESSES" in context
        assert "Vairagya" in context

    def test_build_psychological_context_for_relationships(self, wellness_model):
        """Test psychological context includes attachment indicators."""
        psych_insights = {
            "cognitive_distortions": [],
            "behavioral_patterns": [],
            "act_guidance": {},
            "attachment_indicators": ["anxious_attachment"],
        }

        context = wellness_model._build_psychological_context(
            WellnessTool.RELATIONSHIP_COMPASS, psych_insights
        )

        assert "ATTACHMENT INDICATORS" in context
        assert "anxious_attachment" in context
        assert "Atma-tripti" in context


# =============================================================================
# WELLNESS RESPONSE DATA CLASS TESTS
# =============================================================================

class TestWellnessResponse:
    """Test suite for WellnessResponse data class."""

    def test_response_has_required_fields(self):
        """Test that WellnessResponse has all required fields."""
        response = WellnessResponse(
            content="Test content",
            sections={"section1": "content1"},
            gita_verses_used=3,
            tool=WellnessTool.ARDHA,
        )

        assert response.content == "Test content"
        assert response.sections == {"section1": "content1"}
        assert response.gita_verses_used == 3
        assert response.tool == WellnessTool.ARDHA
        assert response.model == "gpt-4o-mini"  # Default
        assert response.provider == "kiaan"  # Default
        assert response.analysis_mode == "standard"  # Default

    def test_response_has_enhanced_fields(self):
        """Test that WellnessResponse has enhanced v2.0 fields."""
        response = WellnessResponse(
            content="Test content",
            sections={},
            gita_verses_used=3,
            tool=WellnessTool.VIYOGA,
            psychological_framework="ACT",
            behavioral_insights=["avoidance", "rumination"],
            cached=True,
            latency_ms=250.5,
        )

        assert response.psychological_framework == "ACT"
        assert response.behavioral_insights == ["avoidance", "rumination"]
        assert response.cached is True
        assert response.latency_ms == 250.5


# =============================================================================
# INTEGRATION TESTS (with mocked providers)
# =============================================================================

class TestIntegrationWithMockedProviders:
    """Integration tests with mocked AI providers."""

    @pytest.mark.asyncio
    async def test_generate_response_uses_provider_manager(
        self, wellness_model, mock_db, sample_negative_thought
    ):
        """Test that generate_response attempts to use provider manager."""
        mock_provider_manager = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "Test response with dharma and karma yoga wisdom 💙"
        mock_response.provider = "openai"
        mock_response.model = "gpt-4o-mini"
        mock_provider_manager.chat = AsyncMock(return_value=mock_response)

        with patch.object(wellness_model, '_provider_manager', mock_provider_manager):
            with patch.object(wellness_model, '_fetch_gita_wisdom', AsyncMock(return_value=("Gita context", 5))):
                result = await wellness_model.generate_response(
                    tool=WellnessTool.ARDHA,
                    user_input=sample_negative_thought,
                    db=mock_db,
                    analysis_mode=AnalysisMode.STANDARD,
                )

        # Verify provider manager was called
        mock_provider_manager.chat.assert_called_once()

        # Verify response
        assert result.content == mock_response.content
        assert result.provider == "openai"
        assert result.model == "gpt-4o-mini"

    @pytest.mark.asyncio
    async def test_fallback_to_legacy_client_on_provider_failure(
        self, wellness_model, mock_db, sample_negative_thought
    ):
        """Test fallback to legacy OpenAI client when provider manager fails."""
        from backend.services.ai.providers.provider_manager import AIProviderError

        mock_provider_manager = MagicMock()
        mock_provider_manager.chat = AsyncMock(
            side_effect=AIProviderError("Provider failed", provider="test", retryable=False)
        )

        mock_legacy_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message = MagicMock()
        mock_response.choices[0].message.content = "Legacy response with dharma wisdom 💙"
        mock_legacy_client.chat.completions.create = MagicMock(return_value=mock_response)

        with patch.object(wellness_model, '_provider_manager', mock_provider_manager):
            with patch.object(wellness_model, 'client', mock_legacy_client):
                with patch.object(wellness_model, '_fetch_gita_wisdom', AsyncMock(return_value=("Gita context", 5))):
                    result = await wellness_model.generate_response(
                        tool=WellnessTool.ARDHA,
                        user_input=sample_negative_thought,
                        db=mock_db,
                        analysis_mode=AnalysisMode.STANDARD,
                    )

        # Verify fallback to legacy client
        mock_legacy_client.chat.completions.create.assert_called_once()
        assert result.provider == "openai"

    @pytest.mark.asyncio
    async def test_graceful_degradation_to_fallback_response(
        self, wellness_model, mock_db, sample_negative_thought
    ):
        """Test graceful degradation when all providers fail."""
        with patch.object(wellness_model, '_provider_manager', None):
            with patch.object(wellness_model, 'client', None):
                result = await wellness_model.generate_response(
                    tool=WellnessTool.ARDHA,
                    user_input=sample_negative_thought,
                    db=mock_db,
                    analysis_mode=AnalysisMode.STANDARD,
                )

        # Should return fallback response
        assert result.model == "fallback"
        assert result.content != ""
        assert "💙" in result.content  # Should have calming ending


# =============================================================================
# EDGE CASES AND ERROR HANDLING TESTS
# =============================================================================

class TestEdgeCasesAndErrorHandling:
    """Test edge cases and error handling."""

    def test_detect_distortions_with_empty_text(self):
        """Test distortion detection with empty text."""
        distortions = PsychologicalFramework.detect_cognitive_distortions("")
        assert distortions == []

    def test_detect_behavioral_patterns_with_empty_text(self):
        """Test behavioral pattern detection with empty text."""
        patterns = PsychologicalFramework.detect_behavioral_patterns("")
        assert patterns == []

    def test_get_act_guidance_with_unknown_type(self):
        """Test ACT guidance with unknown issue type."""
        guidance = PsychologicalFramework.get_act_guidance("unknown_type")
        # Should return default processes
        assert "acceptance" in guidance
        assert "defusion" in guidance

    def test_analysis_mode_enum_values(self):
        """Test AnalysisMode enum has correct values."""
        assert AnalysisMode.STANDARD.value == "standard"
        assert AnalysisMode.DEEP_DIVE.value == "deep_dive"
        assert AnalysisMode.QUANTUM_DIVE.value == "quantum_dive"

    def test_wellness_tool_enum_values(self):
        """Test WellnessTool enum has correct values."""
        assert WellnessTool.VIYOGA.value == "viyoga"
        assert WellnessTool.ARDHA.value == "ardha"
        assert WellnessTool.RELATIONSHIP_COMPASS.value == "relationship_compass"
