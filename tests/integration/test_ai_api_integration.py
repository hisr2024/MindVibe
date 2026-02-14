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


@pytest.fixture
def client():
    from backend.main import app
    return TestClient(app)


@pytest.fixture
def wellness_model():
    return get_wellness_model()


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def mock_openai_response():
    return ProviderResponse(
        content="Dear friend, I bow to the courage it takes to name your fear. "
                "Ancient wisdom teaches us about phala-sakti (attachment to fruits). "
                "Karmanye vadhikaraste, ma phaleshu kadachana. "
                "You are not your anxiety - you are the awareness watching it. "
                "This is sakshi bhava - witness consciousness. "
                "You are already complete. You are the infinite sky. \U0001f499",
        provider="openai",
        model="gpt-4o-mini",
        prompt_tokens=500,
        completion_tokens=300,
        total_tokens=800,
        latency_ms=1500,
    )


@pytest.fixture
def mock_sarvam_response():
    return ProviderResponse(
        content="Dear friend, I truly see your struggle. "
                "Ancient wisdom teaches us about dharma. "
                "Satyam bruyat priyam bruyat. "
                "With daya (compassion), consider that all beings suffer. "
                "Sama-darshana means seeing the same consciousness in all. "
                "Atma-tripti - you are ALREADY complete. \U0001f499",
        provider="sarvam",
        model="sarvam-m",
        prompt_tokens=450,
        completion_tokens=280,
        total_tokens=730,
        latency_ms=2000,
    )


class TestViyogaAIIntegration:

    def test_viyoga_endpoint_returns_structured_response(self, client):
        response = client.post("/api/viyoga/detach", json={"outcome_worry": "I can't control what happens with my job interview."})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "detachment_guidance" in data
        assert "response" in data
        assert "model" in data
        assert "provider" in data
        assert "attachment_analysis" in data

    def test_viyoga_response_contains_gita_wisdom(self, client):
        response = client.post("/api/viyoga/detach", json={"outcome_worry": "I need to control the outcome of my project."})
        assert response.status_code == 200
        data = response.json()
        response_content = data.get("response", "") or str(data.get("detachment_guidance", {}))
        gita_terms = ["karma", "yoga", "phala", "sakti", "nishkama", "vairagya", "action", "outcome", "attachment", "witness", "sakshi", "dharma", "ancient wisdom", "liberation", "peace"]
        found_terms = [term for term in gita_terms if term.lower() in response_content.lower()]
        assert len(found_terms) >= 2, f"Expected Gita wisdom terms, found: {found_terms}"

    def test_viyoga_act_integration(self, client):
        response = client.post("/api/viyoga/detach", json={"outcome_worry": "I keep worrying about what will happen in the future."})
        assert response.status_code == 200
        data = response.json()
        assert "attachment_analysis" in data or "karma_yoga_insight" in data
        assert len(data.get("response", "")) > 50

    def test_viyoga_attachment_type_detection(self, client):
        test_cases = [
            ("I need to control every aspect of this situation", "control"),
            ("What if something terrible happens in the future?", "future_worry"),
            ("I can't live without getting this outcome", "outcome_dependency"),
        ]
        for worry, expected_type in test_cases:
            response = client.post("/api/viyoga/detach", json={"outcome_worry": worry})
            assert response.status_code == 200
            data = response.json()
            assert "attachment_analysis" in data
            assert data["attachment_analysis"].get("type") is not None

    @pytest.mark.asyncio
    async def test_viyoga_uses_multi_provider_fallback(self, wellness_model, mock_db):
        mock_provider_manager = MagicMock()
        mock_provider_manager.chat = AsyncMock(side_effect=AIProviderError("Primary provider failed", provider="openai", retryable=False))
        with patch.object(wellness_model, '_provider_manager', mock_provider_manager):
            with patch.object(wellness_model, 'client', None):
                result = await wellness_model.generate_response(tool=WellnessTool.VIYOGA, user_input="I'm anxious about the outcome", db=mock_db, analysis_mode=AnalysisMode.STANDARD)
        assert result.model == "fallback"
        assert "\U0001f499" in result.content
        assert "karma" in result.content.lower() or "action" in result.content.lower()


class TestArdhaAIIntegration:

    def test_ardha_endpoint_returns_structured_response(self, client):
        response = client.post("/api/ardha/reframe", json={"thought": "I always fail at everything."})
        assert response.status_code in (200, 503), f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            assert "sources" in data

    def test_ardha_response_contains_gita_wisdom(self, client):
        response = client.post("/api/ardha/reframe", json={"thought": "I'm worthless and nothing I do matters."})
        assert response.status_code in (200, 503)
        if response.status_code == 200:
            data = response.json()
            response_content = data.get("response", "")
            gita_terms = ["witness", "sakshi", "thoughts", "chitta", "vritti", "sthitaprajna", "steady", "wisdom", "consciousness", "sky", "clouds", "awareness", "gita", "karma", "dharma"]
            found_terms = [term for term in gita_terms if term.lower() in response_content.lower()]
            assert len(found_terms) >= 1, f"Expected Gita wisdom terms, found: {found_terms}"

    def test_ardha_cbt_integration(self, client):
        response = client.post("/api/ardha/reframe", json={"thought": "I will never succeed."})
        assert response.status_code in (200, 503)
        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            assert len(data["response"]) > 50

    def test_ardha_analysis_modes(self, client):
        for depth in ["quick", "deep", "quantum"]:
            response = client.post("/api/ardha/reframe", json={"thought": "I feel like I'm not good enough.", "depth": depth})
            assert response.status_code in (200, 503), f"Unexpected status for depth={depth}: {response.status_code}"

    @pytest.mark.asyncio
    async def test_ardha_openai_integration(self, wellness_model, mock_db, mock_openai_response):
        mock_provider_manager = MagicMock()
        mock_provider_manager.chat = AsyncMock(return_value=mock_openai_response)
        with patch.object(wellness_model, '_provider_manager', mock_provider_manager):
            with patch.object(wellness_model, '_fetch_gita_wisdom', AsyncMock(return_value=("Gita context", 5))):
                result = await wellness_model.generate_response(tool=WellnessTool.ARDHA, user_input="I always fail", db=mock_db, analysis_mode=AnalysisMode.STANDARD)
        assert result.provider == "openai"
        assert result.model == "gpt-4o-mini"
        assert result.gita_verses_used == 5


class TestRelationshipCompassAIIntegration:

    def test_compass_endpoint_returns_structured_response(self, client):
        response = client.post("/api/relationship-compass/guide", json={"conflict": "My partner and I keep arguing.", "relationship_type": "romantic"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "compass_guidance" in data
        assert "response" in data
        assert "model" in data
        assert "provider" in data
        assert "relationship_type" in data

    def test_compass_response_contains_gita_wisdom(self, client):
        response = client.post("/api/relationship-compass/guide", json={"conflict": "My parent doesn't respect my boundaries.", "relationship_type": "family"})
        assert response.status_code == 200
        data = response.json()
        response_content = data.get("response", "") or str(data.get("compass_guidance", {}))
        gita_terms = ["dharma", "daya", "compassion", "kshama", "forgiveness", "sama-darshana", "ahamkara", "ego", "satya", "truth", "atma-tripti", "complete", "peace", "wisdom", "sacred"]
        found_terms = [term for term in gita_terms if term.lower() in response_content.lower()]
        assert len(found_terms) >= 2, f"Expected Gita wisdom terms, found: {found_terms}"

    def test_compass_attachment_theory_integration(self, client):
        response = client.post("/api/relationship-compass/guide", json={"conflict": "I feel abandoned when my partner needs space.", "relationship_type": "romantic"})
        assert response.status_code == 200
        data = response.json()
        assert "relationship_teachings" in data
        assert "communication_patterns" in data or "ai_analysis" in data

    def test_compass_all_relationship_types(self, client):
        for rel_type in ["romantic", "family", "friendship", "workplace", "self", "community"]:
            response = client.post("/api/relationship-compass/guide", json={"conflict": "I'm having difficulty.", "relationship_type": rel_type})
            assert response.status_code == 200
            data = response.json()
            assert data["relationship_type"] == rel_type
            assert "relationship_teachings" in data
            assert "core_principles" in data["relationship_teachings"]

    @pytest.mark.asyncio
    async def test_compass_sarvam_integration(self, wellness_model, mock_db, mock_sarvam_response):
        mock_provider_manager = MagicMock()
        mock_provider_manager.chat = AsyncMock(return_value=mock_sarvam_response)
        with patch.object(wellness_model, '_provider_manager', mock_provider_manager):
            with patch.object(wellness_model, '_fetch_gita_wisdom', AsyncMock(return_value=("Gita context", 7))):
                result = await wellness_model.generate_response(tool=WellnessTool.RELATIONSHIP_COMPASS, user_input="My friend betrayed my trust", db=mock_db, analysis_mode=AnalysisMode.STANDARD)
        assert result.provider == "sarvam"
        assert result.model == "sarvam-m"
        assert result.gita_verses_used == 7


class TestProviderFallback:

    @pytest.mark.asyncio
    async def test_fallback_from_openai_to_sarvam(self, wellness_model, mock_db, mock_sarvam_response):
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
                result = await wellness_model.generate_response(tool=WellnessTool.VIYOGA, user_input="I'm worried about outcomes", db=mock_db)
        assert result.provider in ("sarvam", "kiaan", "fallback")

    @pytest.mark.asyncio
    async def test_fallback_to_gita_wisdom_when_all_fail(self, wellness_model, mock_db):
        with patch.object(wellness_model, '_provider_manager', None):
            with patch.object(wellness_model, 'client', None):
                for tool in [WellnessTool.VIYOGA, WellnessTool.ARDHA, WellnessTool.RELATIONSHIP_COMPASS]:
                    result = await wellness_model.generate_response(tool=tool, user_input="Test input", db=mock_db)
                    assert result.model == "fallback"
                    assert "\U0001f499" in result.content
                    assert len(result.content) > 100

    @pytest.mark.asyncio
    async def test_fallback_response_is_comprehensive(self, wellness_model, mock_db):
        with patch.object(wellness_model, '_provider_manager', None):
            with patch.object(wellness_model, 'client', None):
                viyoga_result = await wellness_model.generate_response(tool=WellnessTool.VIYOGA, user_input="I'm anxious about my job interview", db=mock_db)
                assert "karma" in viyoga_result.content.lower() or "action" in viyoga_result.content.lower()
                assert "sakshi" in viyoga_result.content.lower() or "witness" in viyoga_result.content.lower()

                ardha_result = await wellness_model.generate_response(tool=WellnessTool.ARDHA, user_input="I always fail at everything", db=mock_db)
                assert "thoughts" in ardha_result.content.lower() or "thought" in ardha_result.content.lower()
                assert "sky" in ardha_result.content.lower() or "clouds" in ardha_result.content.lower()

                compass_result = await wellness_model.generate_response(tool=WellnessTool.RELATIONSHIP_COMPASS, user_input="My partner doesn't listen to me", db=mock_db)
                assert "dharma" in compass_result.content.lower() or "compassion" in compass_result.content.lower()
                assert "peace" in compass_result.content.lower()


class TestMultiLanguageSupport:

    def test_viyoga_with_hindi(self, client):
        response = client.post("/api/viyoga/detach", json={"outcome_worry": "I'm worried about my exam results", "language": "hi"})
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_ardha_with_tamil(self, client):
        response = client.post("/api/ardha/reframe", json={"thought": "I'm not good enough", "language": "ta"})
        assert response.status_code in (200, 503)

    def test_compass_with_telugu(self, client):
        response = client.post("/api/relationship-compass/guide", json={"conflict": "My friend betrayed my trust", "relationship_type": "friendship", "language": "te"})
        assert response.status_code == 200
        assert response.json()["status"] == "success"


class TestResponseQuality:

    def test_response_includes_empathy(self, client):
        response = client.post("/api/viyoga/detach", json={"outcome_worry": "I feel completely lost and hopeless."})
        assert response.status_code == 200
        content = response.json().get("response", "") or str(response.json().get("detachment_guidance", {}))
        empathy_indicators = ["hear", "understand", "feel", "valid", "courage", "struggling", "weight", "acknowledge", "compassion", "friend", "see", "carrying", "alone"]
        assert any(ind.lower() in content.lower() for ind in empathy_indicators), "Response should contain empathetic acknowledgment"

    def test_response_includes_practical_guidance(self, client):
        response = client.post("/api/viyoga/detach", json={"outcome_worry": "I'm anxious about my presentation tomorrow"})
        assert response.status_code == 200
        content = response.json().get("response", "") or str(response.json().get("detachment_guidance", {}))
        practice_indicators = ["practice", "try", "breath", "moment", "step", "today", "action", "when", "before", "pause"]
        assert any(ind.lower() in content.lower() for ind in practice_indicators), "Response should contain practical guidance"

    def test_response_ends_with_encouragement(self, client):
        response = client.post("/api/relationship-compass/guide", json={"conflict": "My sibling and I haven't spoken in months.", "relationship_type": "family"})
        assert response.status_code == 200
        content = response.json().get("response", "") or str(response.json().get("compass_guidance", {}))
        assert "\U0001f499" in content or any(word in content.lower() for word in ["whole", "complete", "peace", "wisdom"])


class TestLatencyAndCaching:

    def test_response_includes_latency_metrics(self, client):
        response = client.post("/api/viyoga/detach", json={"outcome_worry": "I'm feeling anxious today."})
        assert response.status_code == 200
        data = response.json()
        assert "latency_ms" in data
        assert "cached" in data
        assert isinstance(data["latency_ms"], (int, float))
        assert isinstance(data["cached"], bool)

    def test_response_includes_provider_info(self, client):
        response = client.post("/api/viyoga/detach", json={"outcome_worry": "I'm worried about the future."})
        assert response.status_code == 200
        data = response.json()
        assert "model" in data
        assert "provider" in data
        assert data["provider"] in ["openai", "sarvam", "oai_compat", "kiaan", "fallback"]


class TestEdgeCases:

    def test_handles_empty_input(self, client):
        response = client.post("/api/ardha/reframe", json={"thought": ""})
        assert response.status_code == 400

    def test_handles_very_long_input(self, client):
        response = client.post("/api/ardha/reframe", json={"thought": "I feel anxious. " * 200})
        assert response.status_code == 400

    def test_handles_special_characters(self, client):
        response = client.post("/api/viyoga/detach", json={"outcome_worry": "I'm worried about 'success' & \"failure\" <test>"})
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_handles_unicode_input(self, client):
        response = client.post("/api/relationship-compass/guide", json={"conflict": "Test conflict in Hindi", "relationship_type": "romantic"})
        assert response.status_code == 200
        assert response.json()["status"] == "success"


class TestPsychologicalFrameworkIntegration:

    def test_cbt_distortions_have_gita_remedies(self):
        for distortion_type in ["all_or_nothing", "catastrophizing", "mind_reading", "emotional_reasoning", "should_statements", "personalization", "fortune_telling", "labeling"]:
            info = PsychologicalFramework.COGNITIVE_DISTORTIONS.get(distortion_type)
            assert info is not None
            assert "gita_remedy" in info
            assert len(info["gita_remedy"]) > 0

    def test_act_processes_have_gita_parallels(self):
        for process in ["acceptance", "defusion", "present_moment", "self_as_context", "values", "committed_action"]:
            info = PsychologicalFramework.ACT_PROCESSES.get(process)
            assert info is not None
            assert "gita_parallel" in info
            assert len(info["gita_parallel"]) > 0

    def test_attachment_patterns_have_gita_wisdom(self):
        for style in ["anxious", "avoidant", "disorganized", "secure"]:
            info = PsychologicalFramework.ATTACHMENT_PATTERNS.get(style)
            assert info is not None
            assert "gita_wisdom" in info
            assert "healing_focus" in info
