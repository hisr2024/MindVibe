import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from backend.main import app
    return TestClient(app)


def test_relationship_compass_gita_guidance_returns_valid_structure(client):
    """Test that the gita-guidance endpoint returns a valid response structure."""
    response = client.post(
        "/api/relationship-compass/gita-guidance",
        json={
            "message": "We keep fighting and I need clarity.",
            "sessionId": "test-session",
            "relationshipType": "partner",
        },
    )

    assert response.status_code == 200
    data = response.json()
    # Response should have the key fields
    assert "response" in data
    assert "contextSufficient" in data
    assert isinstance(data["contextSufficient"], bool)
    # Response content should be meaningful
    assert len(data["response"]) > 50
