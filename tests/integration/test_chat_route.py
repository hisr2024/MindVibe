"""Integration tests for chat route validation."""

import pytest

from backend.routes import chat
from backend.services.wisdom_engine import validate_gita_response


@pytest.mark.asyncio
async def test_chat_message_enforces_gita_structure(monkeypatch, test_client):
    """Ensure /api/chat/message returns a response that passes validation."""

    # Ensure the chatbot is marked as ready and avoids external calls
    monkeypatch.setattr(chat.kiaan, "ready", True)
    monkeypatch.setattr(chat.kiaan, "client", object())
    monkeypatch.setattr(chat.kiaan, "gita_kb", None)

    responses = [
        "This is missing structure and should fail validation.",
        (
            "**Ancient Wisdom Principle:** The Bhagavad Gita teaches steady action with a calm mind, like the teacher guiding the student toward duty without clinging.\n"
            "**Modern Application:** For your situation, approach the challenge as your dharma—take mindful action while staying balanced and compassionate toward yourself.\n"
            "**Practical Steps:**\n"
            "- Take one focused action today as an offering, letting go of immediate results.\n"
            "- Pause for three mindful breaths before decisions to return to equanimity.\n"
            "- Keep a short journal noting when you acted without attachment to outcomes.\n"
            "- Treat yourself and others with the kindness the Gita calls the inner witness to embody.\n"
            "**Deeper Understanding:** Each step is karma-yoga—acting with dedication while resting in the inner steadiness the Gita describes, so your mind stays resilient and clear."
        ),
    ]

    async def fake_completion(model: str, messages: list) -> str:  # noqa: ARG001
        return responses.pop(0)

    monkeypatch.setattr(chat.kiaan, "_create_completion_with_retries", fake_completion)

    response = await test_client.post("/api/chat/message", json={"message": "I feel stuck"})

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert validate_gita_response(data["response"]) is True
