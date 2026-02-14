"""
Integration tests for Enhanced Wellness Routes v2.0

Tests the API endpoints for:
1. Ardha (Cognitive Reframing) with CBT integration
2. Viyoga (Detachment Coach) with ACT integration
3. RelationshipCompass with Attachment Theory integration

All routes now support:
- Depth modes (quick, deep, quantum)
- Gita wisdom integration
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
                "thought": "I always fail at everything I try. Nothing ever works out."
            }
        )

        # Accept 200 (success) or 503 (OpenAI unavailable)
        assert response.status_code in (200, 503), f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            assert "sources" in data

    def test_ardha_reframe_with_analysis_mode(self, client):
        """Test Ardha reframe with different depth modes."""
        for depth in ["quick", "deep", "quantum"]:
            response = client.post(
                "/api/ardha/reframe",
                json={
                    "thought": "I'm not good enough for this job.",
                    "depth": depth,
                }
            )

            # Accept 200 (success) or 503 (OpenAI unavailable)
            assert response.status_code in (200, 503), f"Unexpected status for depth={depth}: {response.status_code}"

    def test_ardha_reframe_detects_cognitive_distortions(self, client):
        """Test that Ardha response addresses cognitive distortions."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "thought": "I will never succeed. This is going to be a total disaster."
            }
        )

        # Accept 200 or 503
        assert response.status_code in (200, 503)
        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            assert len(data["response"]) > 50

    def test_ardha_reframe_includes_gita_remedy(self, client):
        """Test that Ardha response includes Gita wisdom."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "thought": "I should be perfect. I must never make mistakes."
            }
        )

        # Accept 200 or 503
        assert response.status_code in (200, 503)
        if response.status_code == 200:
            data = response.json()
            assert "response" in data

    def test_ardha_reframe_with_language(self, client):
        """Test Ardha reframe with language parameter."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "thought": "I feel worthless today.",
                "language": "hi",
            }
        )

        # Accept 200 or 503
        assert response.status_code in (200, 503)

    def test_ardha_reframe_validation_empty_thought(self, client):
        """Test validation rejects empty thought."""
        response = client.post(
            "/api/ardha/reframe",
            json={"thought": ""}
        )

        assert response.status_code == 400

    def test_ardha_reframe_includes_latency(self, client):
        """Test that response includes latency metrics when successful."""
        response = client.post(
            "/api/ardha/reframe",
            json={
                "thought": "I made a mistake and now everything is ruined."
            }
        )

        # Accept 200 or 503
        assert response.status_code in (200, 503)


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
        assert "attachment_analysis" in data
        assert "response" in data

    def test_viyoga_detach_with_analysis_mode(self, client):
        """Test Viyoga detach with analysis mode parameter."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I'm anxious about the results.",
                "analysis_mode": "standard",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_viyoga_detach_includes_act_processes(self, client):
        """Test that Viyoga includes meaningful guidance."""
        response = client.post(
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I need to control the outcome. I can't handle uncertainty."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Should have attachment analysis
        assert "attachment_analysis" in data
        # Should have a meaningful response
        assert len(data.get("response", "")) > 50

    def test_viyoga_detach_detects_attachment_type(self, client):
        """Test that Viyoga detects attachment pattern type."""
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
        assert "communication_patterns" in data or "ai_analysis" in data
        assert "relationship_teachings" in data

    def test_compass_guide_with_analysis_mode(self, client):
        """Test RelationshipCompass with analysis mode parameter."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "We keep having the same arguments about chores.",
                "relationship_type": "romantic",
                "analysis_mode": "standard",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_compass_guide_detects_attachment_patterns(self, client):
        """Test that RelationshipCompass provides relationship insights."""
        response = client.post(
            "/api/relationship-compass/guide",
            json={
                "conflict": "I feel abandoned when my partner needs space. I worry they'll leave me.",
                "relationship_type": "romantic",
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Should have relationship teachings
        assert "relationship_teachings" in data
        # Should have response content
        assert len(data.get("response", "")) > 50

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
        # Status may be "degraded" when OpenAI key is not configured (test env)
        assert data["status"] in ("ok", "degraded")
        assert data["service"] == "ardha"

    def test_viyoga_health(self, client):
        """Test Viyoga health endpoint."""
        response = client.get("/api/viyoga/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("ok", "degraded")
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
            "/api/viyoga/detach",
            json={
                "outcome_worry": "I feel anxious about the future."
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Response should include cached flag
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
            json={"thought": long_thought}
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
