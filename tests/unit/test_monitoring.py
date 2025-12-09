"""Tests for monitoring and observability endpoints."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime
from backend.monitoring.health import detailed_health, get_metrics


@pytest.mark.asyncio
async def test_detailed_health_endpoint():
    """Test detailed health check endpoint."""
    # Mock database session
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar.return_value = 1
    mock_db.execute = AsyncMock(return_value=mock_result)
    
    # Call the endpoint
    result = await detailed_health(db=mock_db)
    
    # Check basic structure
    assert "status" in result
    assert "timestamp" in result
    assert "checks" in result
    
    # Check that database check exists
    assert "database" in result["checks"]
    assert result["checks"]["database"]["status"] in ["up", "down"]
    
    # Check that OpenAI check exists
    assert "openai" in result["checks"]
    assert result["checks"]["openai"]["status"] in ["configured", "missing"]
    
    # Check that system check exists
    assert "system" in result["checks"]
    assert "cpu_percent" in result["checks"]["system"]
    assert "memory_percent" in result["checks"]["system"]
    assert "disk_percent" in result["checks"]["system"]


@pytest.mark.asyncio
async def test_metrics_endpoint():
    """Test application metrics endpoint."""
    # Mock database session
    mock_db = AsyncMock()
    
    # Setup mock results for different queries
    mock_users = MagicMock()
    mock_users.scalar.return_value = 100
    
    mock_active = MagicMock()
    mock_active.scalar.return_value = 25
    
    mock_messages = MagicMock()
    mock_messages.scalar.return_value = 150
    
    mock_moods = MagicMock()
    mock_moods.scalar.return_value = 30
    
    # Setup execute to return different results based on query
    mock_db.execute = AsyncMock(side_effect=[
        mock_users,
        mock_active,
        mock_messages,
        mock_moods
    ])
    
    # Call the endpoint
    result = await get_metrics(db=mock_db)
    
    # Check basic structure
    assert "timestamp" in result
    assert "users" in result
    assert "messages" in result
    assert "moods" in result
    
    # Check users metrics
    assert "total" in result["users"]
    assert "active_24h" in result["users"]
    assert result["users"]["total"] == 100
    assert result["users"]["active_24h"] == 25
    
    # Check messages metrics
    assert "total_24h" in result["messages"]
    assert "avg_per_user" in result["messages"]
    assert result["messages"]["total_24h"] == 150
    
    # Check moods metrics
    assert "total_24h" in result["moods"]
    assert result["moods"]["total_24h"] == 30


@pytest.mark.asyncio
async def test_health_database_latency():
    """Test that health check measures database latency."""
    # Mock database session
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar.return_value = 1
    mock_db.execute = AsyncMock(return_value=mock_result)
    
    # Call the endpoint
    result = await detailed_health(db=mock_db)
    
    # Database should be up and have latency measurement
    assert result["checks"]["database"]["status"] == "up"
    assert "latency_ms" in result["checks"]["database"]
    assert isinstance(result["checks"]["database"]["latency_ms"], (int, float))
    assert result["checks"]["database"]["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_metrics_with_no_active_users():
    """Test that metrics endpoint handles division by zero when no active users."""
    # Mock database session
    mock_db = AsyncMock()
    
    # Setup mock results with no active users
    mock_users = MagicMock()
    mock_users.scalar.return_value = 100
    
    mock_active = MagicMock()
    mock_active.scalar.return_value = 0  # No active users
    
    mock_messages = MagicMock()
    mock_messages.scalar.return_value = 0
    
    mock_moods = MagicMock()
    mock_moods.scalar.return_value = 0
    
    mock_db.execute = AsyncMock(side_effect=[
        mock_users,
        mock_active,
        mock_messages,
        mock_moods
    ])
    
    # Call the endpoint - should not raise division by zero error
    result = await get_metrics(db=mock_db)
    
    # Check that avg_per_user is 0 when no active users
    assert result["messages"]["avg_per_user"] == 0.0
