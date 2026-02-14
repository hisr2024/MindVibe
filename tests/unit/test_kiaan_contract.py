import asyncio
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest


def test_start_session_preserves_kiaan_identity(mock_request):
    from backend.routes.chat import start_session

    result = asyncio.run(start_session(request=mock_request))

    assert result["bot"] == "KIAAN"
    assert result["gita_powered"] is True
    assert uuid.UUID(result["session_id"])  # validates UUID format


def _make_mock_db():
    """Create a mock async database session."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    return mock_db


def test_message_endpoint_preserves_contract(mock_request, monkeypatch):
    from backend.routes.chat import ChatMessage, send_message

    mock_db = _make_mock_db()
    result = asyncio.run(send_message(request=mock_request, chat=ChatMessage(message="Hello"), db=mock_db))

    # Verify core contract elements are present
    assert result["bot"] == "KIAAN"
    assert result["version"] == "15.0"
    # Model can be GPT-4o-mini or offline-template (when API key not configured)
    assert result["model"] in ["GPT-4o-mini", "gpt-4o-mini", "offline-template"]
    # Response should either succeed or have error status
    assert result["status"] in ["success", "error"]
    # Response should contain text
    assert "response" in result
    assert isinstance(result["response"], str)
    # All KIAAN responses end with 💙
    assert "💙" in result["response"]


def test_message_endpoint_rejects_empty_input():
    """Test that empty/whitespace messages are rejected by validation."""
    from backend.routes.chat import ChatMessage
    
    # The ChatMessage validator should reject empty/whitespace messages
    with pytest.raises(ValueError):
        ChatMessage(message="   ")


def test_health_endpoint_consistent_identity():
    from backend.routes.chat import health

    result = asyncio.run(health())

    assert result["bot"] == "KIAAN"
    assert result["version"] == "15.0"
    assert result["status"] in {"healthy", "error"}  # depends on runtime API key


def test_about_endpoint_describes_kiaan():
    from backend.routes.chat import about

    result = asyncio.run(about())

    assert result["name"] == "KIAAN"
    assert result["model"] == "gpt-4o-mini"
    assert "description" in result
    assert result["status"] in {"Operational", "Error"}
