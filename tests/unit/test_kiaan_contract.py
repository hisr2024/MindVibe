import asyncio
import uuid
from types import SimpleNamespace


def test_start_session_preserves_kiaan_identity():
    from backend.routes.chat import start_session

    result = asyncio.run(start_session())

    assert result["bot"] == "KIAAN"
    assert result["gita_powered"] is True
    assert uuid.UUID(result["session_id"])  # validates UUID format


def test_message_endpoint_preserves_contract(monkeypatch):
    from backend.routes import chat
    from backend.routes.chat import ChatMessage, send_message

    async def _stable_response(message: str, db):
        return "Steady response 💙"

    monkeypatch.setattr(chat, "kiaan", SimpleNamespace(generate_response_with_gita=_stable_response))

    result = asyncio.run(send_message(ChatMessage(message="Hello"), db=None))

    assert result["status"] == "success"
    assert result["bot"] == "KIAAN"
    assert result["version"] == "13.0"
    assert result["model"] == "GPT-4"
    assert result["response"] == "Steady response 💙"


def test_message_endpoint_rejects_empty_input():
    from backend.routes.chat import ChatMessage, send_message

    result = asyncio.run(send_message(ChatMessage(message="   "), db=None))

    assert result["status"] == "error"
    assert "What's on your mind?" in result["response"]


def test_health_endpoint_consistent_identity():
    from backend.routes.chat import health

    result = asyncio.run(health())

    assert result["bot"] == "KIAAN"
    assert result["version"] == "13.0"
    assert result["status"] in {"healthy", "error"}  # depends on runtime API key


def test_about_endpoint_describes_kiaan():
    from backend.routes.chat import about

    result = asyncio.run(about())

    assert result["name"] == "KIAAN"
    assert result["model"] == "gpt-4"
    assert "description" in result
    assert result["status"] in {"Operational", "Error"}
