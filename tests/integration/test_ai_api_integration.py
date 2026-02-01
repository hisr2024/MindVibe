"""
Comprehensive Integration Tests for AI API Integration
Testing Viyoga, Ardha, and Relationship Compass with OpenAI/Sarvam AI fallback

These tests verify:
1. OpenAI API integration for all three wellness tools
2. Sarvam AI API integration as fallback
3. Gita Core Wisdom fallback when all providers fail
4. Response quality and structure validation
5. Psychological framework integration (ACT, CBT, Attachment Theory)
6. Multi-language support
7. Analysis modes (standard, deep_dive, quantum_dive)
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient
from fastapi.testclient import TestClient

from backend.services.wellness_model import (
    WellnessModel,
    WellnessTool,
    AnalysisMode,
    WellnessResponse,
    PsychologicalFramework,
    get_wellness_model,
)
from backend.services.ai.providers.base import ProviderResponse, AIProviderError
from backend.services.ai.providers.provider_manager import ProviderManager


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def client():
    """Create test client."""
    from backend.main import app
    return TestClient(app)


@pytest.fixture
def wellness_model():
    """Create WellnessModel instance for testing."""
    return get_wellness_model()


@pytest.fixture
def mock_db():
    """Mock database session."""
    return AsyncMock()


@pytest.fixture
def mock_openai_response():
    """Mock successful OpenAI response."""
    return ProviderResponse(
        content="""Dear friend, I bow to the courage it takes to name your fear. This worry you carry weighs on your heart.

Ancient wisdom teaches us that suffering arises not from outcomes themselves, but from our attachment to them - what the sages call "phala-sakti" (attachment to fruits).

The timeless teaching of Karma Yoga offers profound liberation: "Karmanye vadhikaraste, ma phaleshu kadachana" - You have the right to your actions alone, never to their fruits.

Ancient wisdom also reveals: You are not your anxiety - you are the awareness watching it. This is "sakshi bhava" - witness consciousness.

Here is your sacred practice: Before taking any action, pause. Take three slow breaths. Say: "I offer my best effort as sacred service. The outcome belongs to the universe."

Carry this eternal truth: You are already complete, exactly as you are, regardless of any outcome. You are the infinite sky; outcomes are merely clouds passing through. 💙""",
        provider="openai",
        model="gpt-4o-mini",
        prompt_tokens=500,
        completion_tokens=300,
        total_tokens=800,
        latency_ms=1500,
    )


@pytest.fixture
def mock_sarvam_response():
    """Mock successful Sarvam AI response."""
    return ProviderResponse(
        content="""Dear friend, I truly see your struggle. This situation touches the deepest chambers of your being.

Ancient wisdom from the Bhagavad Gita teaches us about dharma - right action aligned with your highest self. The Gita says: "Satyam bruyat priyam bruyat" - speak truth that is pleasant and beneficial.

With "daya" (compassion), consider that all beings suffer. "Sama-darshana" means seeing the same consciousness in all.

The goal is not to be RIGHT - it is to be at PEACE. Victory over reactive patterns is eternal liberation.

Practice this: "When [situation]... I feel [emotion]... Because I need [underlying need]... What I'm hoping for is [request]..."

"Atma-tripti" - you are ALREADY complete within yourself. Your peace does NOT depend on another's behavior. 💙""",
        provider="sarvam",
        model="sarvam-m",
        prompt_tokens=450,
        completion_tokens=280,
        total_tokens=730,
        latency_ms=2000,
    )


# =============================================================================
# VIYOGA API INTEGRATION TESTS
# =============================================================================

class TestViyogaAIIntegration:
    """Test Viyoga (Detachment Coach) AI API integration."""

    def test_viyoga_endpoint_returns_structured_response(self, client):
        """Test that Viyoga endpoint returns properly structured response."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I can't control what happens with my job interview. What if I fail?"
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Check required fields
        assert data["status"] == "success"
        assert "detachment_guidance" in data
        assert "act_insights" in data
        assert "attachment_analysis" in data
        assert "psychological_framework" in data
        assert "model" in data
        assert "provider" in data

    def test_viyoga_response_contains_gita_wisdom(self, client):
        """Test that Viyoga response contains Gita wisdom elements."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I need to control the outcome of my project. I'm anxious about failure."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Response should contain Gita-related content (either AI or fallback)
        response_content = data.get("response", "") or str(data.get("detachment_guidance", {}))

        # Should contain some Gita-related terms
        gita_terms = [
            "karma", "yoga", "phala", "sakti", "nishkama", "vairagya",
            "action", "outcome", "attachment", "witness", "sakshi",
            "dharma", "ancient wisdom", "liberation", "peace"
        ]

        found_terms = [term for term in gita_terms if term.lower() in response_content.lower()]
        assert len(found_terms) >= 2, f"Expected Gita wisdom terms, found: {found_terms}"

    def test_viyoga_act_integration(self, client):
        """Test that Viyoga integrates ACT (Acceptance & Commitment Therapy)."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I keep worrying about what will happen in the future."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Should have ACT-related insights
        assert "act_insights" in data
        assert data["psychological_framework"] == "Acceptance & Commitment Therapy (ACT)"

        # Check ACT processes are provided
        if "relevant_processes" in data["act_insights"]:
            processes = data["act_insights"]["relevant_processes"]
            if processes:
                # Each process should have Gita parallel
                for process in processes:
                    assert "gita_parallel" in process

    def test_viyoga_attachment_type_detection(self, client):
        """Test that Viyoga detects attachment patterns."""
        test_cases = [
            ("I need to control every aspect of this situation", "control"),
            ("What if something terrible happens in the future?", "future_worry"),
            ("I can't live without getting this outcome", "outcome_dependency"),
            ("It needs to be perfect or I've failed", "perfectionism"),
            ("What will people think of me?", "approval_seeking"),
        ]

        for worry, expected_type in test_cases:
            response = client.post(
                "/api/viyoga/detach",
                json={"outcome_worry": worry}
            )

            assert response.status_code == 200
            data = response.json()

            # Check attachment analysis
            assert "attachment_analysis" in data
            assert data["attachment_analysis"]["type"] == expected_type

    @pytest.mark.asyncio
    async def test_viyoga_uses_multi_provider_fallback(self, wellness_model, mock_db):
        """Test that Viyoga uses multi-provider fallback correctly."""
        # Mock provider manager to fail, then fall back
        mock_provider_manager = MagicMock()
        mock_provider_manager.chat = AsyncMock(side_effect=AIProviderError(
            "Primary provider failed",
            provider="openai",
            retryable=False
        ))

        # Test fallback behavior
        with patch.object(wellness_model, '_provider_manager', mock_provider_manager):
            with patch.object(wellness_model, 'client', None):
                result = await wellness_model.generate_response(
                    tool=WellnessTool.VIYOGA,
                    user_input="I'm anxious about the outcome",
                    db=mock_db,
                    analysis_mode=AnalysisMode.STANDARD,
                )

        # Should get fallback response with Gita wisdom
        assert result.model == "fallback"
        assert "💙" in result.content
        assert "karma" in result.content.lower() or "action" in result.content.lower()


# =============================================================================
# ARDHA API INTEGRATION TESTS
# =============================================================================

class TestArdhaAIIntegration:
    """Test Ardha (Cognitive Reframing) AI API integration."""

    def test_ardha_endpoint_returns_structured_response(self, client):
        """Test that Ardha endpoint returns properly structured response."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I always fail at everything. Nothing ever works out for me."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Check required fields
        assert data["status"] == "success"
        assert "reframe_guidance" in data
        assert "cognitive_insights" in data
        assert "behavioral_patterns" in data
        assert "psychological_framework" in data

    def test_ardha_response_contains_gita_wisdom(self, client):
        """Test that Ardha response contains Gita wisdom elements."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I'm worthless and nothing I do matters."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Get response content
        response_content = data.get("raw_text", "") or str(data.get("reframe_guidance", {}))

        # Should contain Gita-related terms
        gita_terms = [
            "witness", "sakshi", "thoughts", "chitta", "vritti",
            "sthitaprajna", "steady", "wisdom", "consciousness",
            "sky", "clouds", "awareness", "kutastha", "observer"
        ]

        found_terms = [term for term in gita_terms if term.lower() in response_content.lower()]
        assert len(found_terms) >= 1, f"Expected Gita wisdom terms, found: {found_terms}"

    def test_ardha_cbt_integration(self, client):
        """Test that Ardha integrates CBT (Cognitive Behavioral Therapy)."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I will never succeed. This is going to be a total disaster."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Should have CBT framework
        assert data["psychological_framework"] == "Cognitive Behavioral Therapy (CBT)"

        # Should detect cognitive distortions
        assert "cognitive_insights" in data
        distortions = data["cognitive_insights"]["distortions_detected"]
        assert len(distortions) >= 1

        # Distortions should have Gita remedies
        for distortion in distortions:
            assert "gita_remedy" in distortion

    def test_ardha_analysis_modes(self, client):
        """Test Ardha supports all analysis modes."""
        thought = "I feel like I'm not good enough."

        for mode in ["standard", "deep_dive", "quantum_dive"]:
            response = client.post(
                "/api/ardha/reframe",
                json={
                    "negative_thought": thought,
                    "analysis_mode": mode,
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["analysis_mode"] == mode

            # Check that appropriate sections exist
            if mode == "quantum_dive":
                sections = data["reframe_guidance"]
                # Quantum dive should have more comprehensive sections
                assert any(key in sections for key in [
                    "sacred_witnessing", "five_dimensional_analysis",
                    "quantum_reframing", "transformation_blueprint"
                ])

    @pytest.mark.asyncio
    async def test_ardha_openai_integration(self, wellness_model, mock_db, mock_openai_response):
        """Test Ardha with mocked OpenAI provider."""
        mock_provider_manager = MagicMock()
        mock_provider_manager.chat = AsyncMock(return_value=mock_openai_response)

        with patch.object(wellness_model, '_provider_manager', mock_provider_manager):
            with patch.object(wellness_model, '_fetch_gita_wisdom', AsyncMock(return_value=("Gita context", 5))):
                result = await wellness_model.generate_response(
                    tool=WellnessTool.ARDHA,
                    user_input="I always fail",
                    db=mock_db,
                    analysis_mode=AnalysisMode.STANDARD,
                )

        assert result.provider == "openai"
        assert result.model == "gpt-4o-mini"
        assert result.gita_verses_used == 5


# =============================================================================
# RELATIONSHIP COMPASS API INTEGRATION TESTS
# =============================================================================

class TestRelationshipCompassAIIntegration:
    """Test Relationship Compass AI API integration."""

    def test_compass_endpoint_returns_structured_response(self, client):
        """Test that Relationship Compass endpoint returns properly structured response."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "My partner and I keep having the same arguments. I feel unheard and frustrated.",
                "relationship_type": "romantic",
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Check required fields
        assert data["status"] == "success"
        assert "compass_guidance" in data
        assert "attachment_insights" in data
        assert "communication_patterns" in data
        assert "psychological_framework" in data

    def test_compass_response_contains_gita_wisdom(self, client):
        """Test that Relationship Compass response contains Gita wisdom elements."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "My parent doesn't respect my boundaries. I feel hurt and angry.",
                "relationship_type": "family",
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Get response content
        response_content = data.get("response", "") or str(data.get("compass_guidance", {}))

        # Should contain Gita-related terms
        gita_terms = [
            "dharma", "daya", "compassion", "kshama", "forgiveness",
            "sama-darshana", "ahamkara", "ego", "satya", "truth",
            "atma-tripti", "complete", "peace", "wisdom", "sacred"
        ]

        found_terms = [term for term in gita_terms if term.lower() in response_content.lower()]
        assert len(found_terms) >= 2, f"Expected Gita wisdom terms, found: {found_terms}"

    def test_compass_attachment_theory_integration(self, client):
        """Test that Relationship Compass integrates Attachment Theory."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "I feel abandoned when my partner needs space. I worry they'll leave me.",
                "relationship_type": "romantic",
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Should have Attachment Theory framework
        assert "Attachment Theory" in data["psychological_framework"]

        # Should detect attachment patterns
        assert "attachment_insights" in data
        insights = data["attachment_insights"]
        if insights:
            # Should detect anxious attachment
            styles = [i["style"] for i in insights]
            assert "anxious" in styles

            # Should include Gita wisdom for healing
            for insight in insights:
                assert "gita_wisdom" in insight
                assert "healing_focus" in insight

    def test_compass_communication_pattern_detection(self, client):
        """Test that Relationship Compass detects communication patterns."""
        test_cases = [
            ("You always do this, you never listen to me", "criticism"),
            ("But you're the one who started it, not my fault", "defensiveness"),
        ]

        for conflict, expected_pattern in test_cases:
            response = client.post(
                "/api/relationship-compass/guide",
                json={
                    "conflict": conflict,
                    "relationship_type": "romantic",
                }
            )

            assert response.status_code == 200
            data = response.json()

            # Check communication patterns
            patterns = data.get("communication_patterns", [])
            if patterns:
                pattern_names = [p["pattern"] for p in patterns]
                assert expected_pattern in pattern_names

                # Each pattern should have Gita alternative
                for pattern in patterns:
                    assert "gita_alternative" in pattern

    def test_compass_all_relationship_types(self, client):
        """Test all relationship types with Gita wisdom."""
        relationship_types = [
            "romantic", "family", "friendship",
            "workplace", "self", "community"
        ]

        for rel_type in relationship_types:
            response = client.post(
                "/api/relationship-compass/guide",
                json={
                    "conflict": "I'm having difficulty in this relationship.",
                    "relationship_type": rel_type,
                }
            )

            assert response.status_code == 200
            data = response.json()

            assert data["relationship_type"] == rel_type
            assert "relationship_teachings" in data
            assert "core_principles" in data["relationship_teachings"]

    @pytest.mark.asyncio
    async def test_compass_sarvam_integration(self, wellness_model, mock_db, mock_sarvam_response):
        """Test Relationship Compass with mocked Sarvam AI provider."""
        mock_provider_manager = MagicMock()
        mock_provider_manager.chat = AsyncMock(return_value=mock_sarvam_response)

        with patch.object(wellness_model, '_provider_manager', mock_provider_manager):
            with patch.object(wellness_model, '_fetch_gita_wisdom', AsyncMock(return_value=("Gita context", 7))):
                result = await wellness_model.generate_response(
                    tool=WellnessTool.RELATIONSHIP_COMPASS,
                    user_input="My friend betrayed my trust",
                    db=mock_db,
                    analysis_mode=AnalysisMode.STANDARD,
                )

        assert result.provider == "sarvam"
        assert result.model == "sarvam-m"
        assert result.gita_verses_used == 7


# =============================================================================
# PROVIDER FALLBACK TESTS
# =============================================================================

class TestProviderFallback:
    """Test provider fallback mechanism."""

    @pytest.mark.asyncio
    async def test_fallback_from_openai_to_sarvam(self, wellness_model, mock_db, mock_sarvam_response):
        """Test fallback from OpenAI to Sarvam when OpenAI fails."""
        call_count = 0

        async def mock_chat(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise AIProviderError("OpenAI failed", provider="openai", retryable=False)
            return mock_sarvam_response

        mock_provider_manager = MagicMock()
        mock_provider_manager.chat = AsyncMock(side_effect=mock_chat)

        with patch.object(wellness_model, '_provider_manager', mock_provider_manager):
            with patch.object(wellness_model, '_fetch_gita_wisdom', AsyncMock(return_value=("Gita context", 5))):
                result = await wellness_model.generate_response(
                    tool=WellnessTool.VIYOGA,
                    user_input="I'm worried about outcomes",
                    db=mock_db,
                )

        # Should have received Sarvam response
        assert result.provider == "sarvam"

    @pytest.mark.asyncio
    async def test_fallback_to_gita_wisdom_when_all_fail(self, wellness_model, mock_db):
        """Test fallback to Gita Core Wisdom when all AI providers fail."""
        with patch.object(wellness_model, '_provider_manager', None):
            with patch.object(wellness_model, 'client', None):
                for tool in [WellnessTool.VIYOGA, WellnessTool.ARDHA, WellnessTool.RELATIONSHIP_COMPASS]:
                    result = await wellness_model.generate_response(
                        tool=tool,
                        user_input="Test input",
                        db=mock_db,
                    )

                    # Should get fallback response
                    assert result.model == "fallback"
                    assert "💙" in result.content
                    assert len(result.content) > 100  # Should be comprehensive

    @pytest.mark.asyncio
    async def test_fallback_response_is_comprehensive(self, wellness_model, mock_db):
        """Test that fallback responses are comprehensive and contain Gita wisdom."""
        with patch.object(wellness_model, '_provider_manager', None):
            with patch.object(wellness_model, 'client', None):
                # Test Viyoga fallback
                viyoga_result = await wellness_model.generate_response(
                    tool=WellnessTool.VIYOGA,
                    user_input="I'm anxious about my job interview",
                    db=mock_db,
                )

                assert "karma" in viyoga_result.content.lower() or "action" in viyoga_result.content.lower()
                assert "sakshi" in viyoga_result.content.lower() or "witness" in viyoga_result.content.lower()

                # Test Ardha fallback
                ardha_result = await wellness_model.generate_response(
                    tool=WellnessTool.ARDHA,
                    user_input="I always fail at everything",
                    db=mock_db,
                )

                assert "thoughts" in ardha_result.content.lower() or "thought" in ardha_result.content.lower()
                assert "sky" in ardha_result.content.lower() or "clouds" in ardha_result.content.lower()

                # Test Relationship Compass fallback
                compass_result = await wellness_model.generate_response(
                    tool=WellnessTool.RELATIONSHIP_COMPASS,
                    user_input="My partner doesn't listen to me",
                    db=mock_db,
                )

                assert "dharma" in compass_result.content.lower() or "compassion" in compass_result.content.lower()
                assert "peace" in compass_result.content.lower()


# =============================================================================
# MULTI-LANGUAGE SUPPORT TESTS
# =============================================================================

class TestMultiLanguageSupport:
    """Test multi-language support for all tools."""

    def test_viyoga_with_hindi(self, client):
        """Test Viyoga with Hindi language."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I'm worried about my exam results",
                "language": "hi",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_ardha_with_tamil(self, client):
        """Test Ardha with Tamil language."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I'm not good enough",
                "language": "ta",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_compass_with_telugu(self, client):
        """Test Relationship Compass with Telugu language."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "My friend betrayed my trust",
                "relationship_type": "friendship",
                "language": "te",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"


# =============================================================================
# RESPONSE QUALITY TESTS
# =============================================================================

class TestResponseQuality:
    """Test response quality and structure."""

    def test_response_includes_empathy(self, client):
        """Test that responses include empathetic acknowledgment."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I feel completely lost and hopeless."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Get response content
        content = data.get("raw_text", "") or str(data.get("reframe_guidance", {}))

        # Should contain empathetic language
        empathy_indicators = [
            "hear", "understand", "feel", "valid", "courage",
            "struggling", "weight", "acknowledge", "compassion", "friend"
        ]

        found = any(ind.lower() in content.lower() for ind in empathy_indicators)
        assert found, "Response should contain empathetic acknowledgment"

    def test_response_includes_practical_guidance(self, client):
        """Test that responses include practical guidance."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I'm anxious about my presentation tomorrow"
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Get response content
        content = data.get("response", "") or str(data.get("detachment_guidance", {}))

        # Should contain practical guidance
        practice_indicators = [
            "practice", "try", "breath", "moment", "step",
            "today", "action", "when", "before", "pause"
        ]

        found = any(ind.lower() in content.lower() for ind in practice_indicators)
        assert found, "Response should contain practical guidance"

    def test_response_ends_with_encouragement(self, client):
        """Test that responses end with encouragement."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "My sibling and I haven't spoken in months.",
                "relationship_type": "family",
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Get response content
        content = data.get("response", "") or str(data.get("compass_guidance", {}))

        # Should end with 💙 or contain encouraging closure
        assert "💙" in content or any(
            word in content.lower() for word in ["whole", "complete", "peace", "wisdom"]
        )


# =============================================================================
# LATENCY AND CACHING TESTS
# =============================================================================

class TestLatencyAndCaching:
    """Test latency tracking and caching behavior."""

    def test_response_includes_latency_metrics(self, client):
        """Test that responses include latency metrics."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I'm feeling anxious today."
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "latency_ms" in data
        assert "cached" in data
        assert isinstance(data["latency_ms"], (int, float))
        assert isinstance(data["cached"], bool)

    def test_response_includes_provider_info(self, client):
        """Test that responses include provider information."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I'm worried about the future."
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "model" in data
        assert "provider" in data
        assert data["provider"] in ["openai", "sarvam", "oai_compat", "kiaan", "fallback"]


# =============================================================================
# EDGE CASE TESTS
# =============================================================================

class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_handles_empty_input(self, client):
        """Test handling of empty input."""
        response = client.post(
            "/api/ardha/reframe",
            json={"negative_thought": ""}
        )

        assert response.status_code == 400

    def test_handles_very_long_input(self, client):
        """Test handling of very long input."""
        long_input = "I feel anxious. " * 200  # ~3000 chars

        response = client.post(
            "/api/ardha/reframe",
            json={"negative_thought": long_input}
        )

        # Should reject inputs over 2000 chars
        assert response.status_code == 400

    def test_handles_special_characters(self, client):
        """Test handling of special characters in input."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I'm worried about 'success' & \"failure\" <test>"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_handles_unicode_input(self, client):
        """Test handling of Unicode input."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "मेरे पार्टनर और मेरे बीच झगड़ा हो गया। 我很担心。",
                "relationship_type": "romantic",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"


# =============================================================================
# PSYCHOLOGICAL FRAMEWORK INTEGRATION TESTS
# =============================================================================

class TestPsychologicalFrameworkIntegration:
    """Test psychological framework integration with Gita wisdom."""

    def test_cbt_distortions_have_gita_remedies(self):
        """Test that CBT distortions include Gita remedies."""
        distortion_types = [
            "all_or_nothing",
            "catastrophizing",
            "mind_reading",
            "emotional_reasoning",
            "should_statements",
            "personalization",
            "fortune_telling",
            "labeling",
        ]

        for distortion_type in distortion_types:
            info = PsychologicalFramework.COGNITIVE_DISTORTIONS.get(distortion_type)
            assert info is not None
            assert "gita_remedy" in info
            assert len(info["gita_remedy"]) > 0

    def test_act_processes_have_gita_parallels(self):
        """Test that ACT processes include Gita parallels."""
        act_processes = [
            "acceptance",
            "defusion",
            "present_moment",
            "self_as_context",
            "values",
            "committed_action",
        ]

        for process in act_processes:
            info = PsychologicalFramework.ACT_PROCESSES.get(process)
            assert info is not None
            assert "gita_parallel" in info
            assert len(info["gita_parallel"]) > 0

    def test_attachment_patterns_have_gita_wisdom(self):
        """Test that attachment patterns include Gita wisdom."""
        attachment_styles = ["anxious", "avoidant", "disorganized", "secure"]

        for style in attachment_styles:
            info = PsychologicalFramework.ATTACHMENT_PATTERNS.get(style)
            assert info is not None
            assert "gita_wisdom" in info
            assert "healing_focus" in info
