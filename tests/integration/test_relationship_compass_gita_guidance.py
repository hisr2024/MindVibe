import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from backend.main import app
    return TestClient(app)


def test_relationship_compass_gita_guidance_insufficient_context(client):
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
    assert data["contextSufficient"] is False
    assert "Sacred Acknowledgement" in data["response"]
    assert "What I Need From the Gita Repository" in data["response"]
