"""
Integration tests for Enhanced Wellness Routes v2.0

Tests the API endpoints for:
1. Ardha (Cognitive Reframing) with CBT integration
2. Viyoga (Detachment Coach) with ACT integration
3. RelationshipCompass with Attachment Theory integration

All routes now support:
- Analysis modes (standard, deep_dive, quantum_dive)
- Psychological framework insights
- Multi-language support
"""

import pytest
from fastapi.testclient import TestClient


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def client():
    """Create test client."""
    from backend.main import app
    return TestClient(app)


# =============================================================================
# ARDHA ROUTE TESTS
# =============================================================================

class TestArdhaEnhancedRoute:
    """Test suite for enhanced Ardha reframing endpoint."""

    def test_ardha_reframe_basic_request(self, client):
        """Test basic Ardha reframe request."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I always fail at everything I try. Nothing ever works out."
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert "reframe_guidance" in data
        assert "cognitive_insights" in data
        assert "behavioral_patterns" in data
        assert "psychological_framework" in data

    def test_ardha_reframe_with_analysis_mode(self, client):
        """Test Ardha reframe with different analysis modes."""
        for mode in ["standard", "deep_dive", "quantum_dive"]:
            response = client.post(
                "/api/ardha/reframe",
                json={
                    "negative_thought": "I'm not good enough for this job.",
                    "analysis_mode": mode,
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["analysis_mode"] == mode

    def test_ardha_reframe_detects_cognitive_distortions(self, client):
        """Test that Ardha detects cognitive distortions."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I will never succeed. This is going to be a total disaster."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Should detect distortions
        assert "cognitive_insights" in data
        distortions = data["cognitive_insights"]["distortions_detected"]

        # Should detect at least one distortion (fortune telling or catastrophizing)
        assert data["cognitive_insights"]["total_distortions"] >= 1

    def test_ardha_reframe_includes_gita_remedy(self, client):
        """Test that cognitive distortions include Gita remedies."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I should be perfect. I must never make mistakes."
            }
        )

        assert response.status_code == 200
        data = response.json()

        distortions = data["cognitive_insights"]["distortions_detected"]
        if distortions:
            # Each distortion should have a Gita remedy
            for distortion in distortions:
                assert "gita_remedy" in distortion

    def test_ardha_reframe_with_language(self, client):
        """Test Ardha reframe with language parameter."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I feel worthless today.",
                "language": "hi",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_ardha_reframe_validation_empty_thought(self, client):
        """Test validation rejects empty thought."""
        response = client.post(
            "/api/ardha/reframe",
            json={"negative_thought": ""}
        )

        assert response.status_code == 400

    def test_ardha_reframe_includes_latency(self, client):
        """Test that response includes latency metrics."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I made a mistake and now everything is ruined."
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "latency_ms" in data
        assert "cached" in data


# =============================================================================
# VIYOGA ROUTE TESTS
# =============================================================================

class TestViyogaEnhancedRoute:
    """Test suite for enhanced Viyoga detachment endpoint."""

    def test_viyoga_detach_basic_request(self, client):
        """Test basic Viyoga detach request."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I can't control what happens with my promotion. What if I don't get it?"
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert "detachment_guidance" in data
        assert "act_insights" in data
        assert "attachment_analysis" in data
        assert "psychological_framework" in data

    def test_viyoga_detach_with_analysis_mode(self, client):
        """Test Viyoga detach with different analysis modes."""
        for mode in ["standard", "deep_dive", "quantum_dive"]:
            response = client.post(
                "/api/viyoga/detach",
                json={
                    "outcome_worry": "I'm anxious about the results.",
                    "analysis_mode": mode,
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["analysis_mode"] == mode

    def test_viyoga_detach_includes_act_processes(self, client):
        """Test that Viyoga includes ACT process guidance."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I need to control the outcome. I can't handle uncertainty."
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "act_insights" in data
        assert "relevant_processes" in data["act_insights"]

        processes = data["act_insights"]["relevant_processes"]
        if processes:
            for process in processes:
                assert "process" in process
                assert "gita_parallel" in process

    def test_viyoga_detach_detects_attachment_type(self, client):
        """Test that Viyoga detects attachment pattern type."""
        # Test control attachment
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I need to control and manage every aspect of this situation."
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "attachment_analysis" in data
        assert data["attachment_analysis"]["type"] == "control"

    def test_viyoga_detach_with_language(self, client):
        """Test Viyoga detach with language parameter."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I'm worried about the future.",
                "language": "ta",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_viyoga_detach_validation_empty_worry(self, client):
        """Test validation rejects empty worry."""
        response = client.post(
            "/api/viyoga/detach",
            json={"outcome_worry": ""}
        )

        assert response.status_code == 400


# =============================================================================
# RELATIONSHIP COMPASS ROUTE TESTS
# =============================================================================

class TestRelationshipCompassEnhancedRoute:
    """Test suite for enhanced RelationshipCompass endpoint."""

    def test_compass_guide_basic_request(self, client):
        """Test basic RelationshipCompass guide request."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "My partner and I had a big argument about communication. I feel unheard and frustrated.",
                "relationship_type": "romantic",
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert "compass_guidance" in data
        assert "attachment_insights" in data
        assert "communication_patterns" in data
        assert "psychological_framework" in data

    def test_compass_guide_with_analysis_mode(self, client):
        """Test RelationshipCompass with different analysis modes."""
        for mode in ["standard", "deep_dive", "quantum_dive"]:
            response = client.post(
                "/api/relationship-compass/guide",
                json={
                    "conflict": "We keep having the same arguments.",
                    "relationship_type": "romantic",
                    "analysis_mode": mode,
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["analysis_mode"] == mode

    def test_compass_guide_detects_attachment_patterns(self, client):
        """Test that RelationshipCompass detects attachment patterns."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "I feel abandoned when my partner needs space. I worry they'll leave me.",
                "relationship_type": "romantic",
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "attachment_insights" in data
        attachment_insights = data["attachment_insights"]

        # Should detect anxious attachment
        styles = [a["style"] for a in attachment_insights]
        assert "anxious" in styles

        # Should include Gita wisdom for healing
        if attachment_insights:
            assert "gita_wisdom" in attachment_insights[0]
            assert "healing_focus" in attachment_insights[0]

    def test_compass_guide_detects_communication_patterns(self, client):
        """Test that RelationshipCompass detects communication issues."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "They always criticize me. You always do this, you never listen.",
                "relationship_type": "romantic",
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "communication_patterns" in data
        patterns = data["communication_patterns"]

        # Should detect criticism pattern
        if patterns:
            pattern_names = [p["pattern"] for p in patterns]
            assert "criticism" in pattern_names

            # Should include Gita alternative
            for pattern in patterns:
                assert "gita_alternative" in pattern

    def test_compass_guide_with_emotion_and_outcome(self, client):
        """Test RelationshipCompass with emotion and desired outcome."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "My parent doesn't respect my boundaries.",
                "relationship_type": "family",
                "primary_emotion": "hurt",
                "desired_outcome": "I want mutual respect",
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert data["relationship_type"] == "family"
        assert "emotion_insight" in data

    def test_compass_guide_with_language(self, client):
        """Test RelationshipCompass with language parameter."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "My friend betrayed my trust.",
                "relationship_type": "friendship",
                "language": "hi",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_compass_guide_validation_short_conflict(self, client):
        """Test validation rejects too short conflict."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "Hurt",
                "relationship_type": "romantic",
            }
        )

        assert response.status_code == 400

    def test_compass_guide_all_relationship_types(self, client):
        """Test all relationship types are supported."""
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


# =============================================================================
# HEALTH CHECK TESTS
# =============================================================================

class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_ardha_health(self, client):
        """Test Ardha health endpoint."""
        response = client.get("/api/ardha/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "ardha"

    def test_viyoga_health(self, client):
        """Test Viyoga health endpoint."""
        response = client.get("/api/viyoga/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "viyoga"

    def test_relationship_compass_health(self, client):
        """Test RelationshipCompass health endpoint."""
        response = client.get("/api/relationship-compass/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "relationship-compass"


# =============================================================================
# CACHING TESTS
# =============================================================================

class TestCachingBehavior:
    """Test caching behavior for wellness routes."""

    def test_cached_response_flag(self, client):
        """Test that responses include cached flag."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "negative_thought": "I feel anxious about the future."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # First request should not be cached
        assert "cached" in data


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================

class TestErrorHandling:
    """Test error handling for wellness routes."""

    def test_ardha_handles_long_input(self, client):
        """Test Ardha handles input that's too long."""
        long_thought = "x" * 2500  # Exceeds 2000 char limit

        response = client.post(
            "/api/ardha/reframe",
            json={"negative_thought": long_thought}
        )

        assert response.status_code == 400

    def test_viyoga_handles_long_input(self, client):
        """Test Viyoga handles input that's too long."""
        long_worry = "x" * 2500  # Exceeds 2000 char limit

        response = client.post(
            "/api/viyoga/detach",
            json={"outcome_worry": long_worry}
        )

        assert response.status_code == 400

    def test_compass_handles_long_input(self, client):
        """Test RelationshipCompass handles input that's too long."""
        long_conflict = "x" * 3500  # Exceeds 3000 char limit

        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": long_conflict,
                "relationship_type": "romantic",
            }
        )

        assert response.status_code == 400

    def test_compass_invalid_relationship_type(self, client):
        """Test RelationshipCompass handles invalid relationship type."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "I'm having trouble in this relationship.",
                "relationship_type": "invalid_type",
            }
        )

        # Should default to romantic
        assert response.status_code == 200
        data = response.json()
        assert data["relationship_type"] == "romantic"
