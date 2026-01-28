"""Tests for the real-time WebSocket server

Note: This module is skipped if backend.realtime.websocket_server is not available.
"""
import pytest
from fastapi.testclient import TestClient

# Skip entire module if the realtime websocket module doesn't exist
pytest.importorskip("backend.realtime.websocket_server", reason="backend.realtime.websocket_server module not implemented")
from backend.realtime.websocket_server import app


def test_health_endpoint():
    """Test that the health endpoint returns a valid response"""
    client = TestClient(app)
    response = client.get("/realtime/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "realtime"
    assert "active_users" in data
    assert "timestamp" in data


def test_app_creation():
    """Test that the FastAPI app is created successfully"""
    assert app is not None
    assert app.title == "MindVibe Real-Time"
    assert app.version == "1.0.0"


def test_health_endpoint_structure():
    """Test that the health endpoint returns the correct structure"""
    client = TestClient(app)
    response = client.get("/realtime/health")
    data = response.json()
    
    # Check all required fields are present
    assert "status" in data
    assert "service" in data
    assert "active_users" in data
    assert "timestamp" in data
    
    # Check data types
    assert isinstance(data["active_users"], int)
    assert isinstance(data["timestamp"], str)
