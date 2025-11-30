"""Integration test for KIAAN chat using the wisdom knowledge base."""

import pytest
from httpx import AsyncClient

from backend.models import WisdomVerse
from backend.routes import chat as chat_module
from backend.services.wisdom_kb import WisdomKnowledgeBase


@pytest.mark.asyncio
async def test_chat_message_returns_wisdom_context(test_client: AsyncClient, test_db):
    """Ensure chat endpoint returns context from the wisdom knowledge base."""

    verse = WisdomVerse(
        verse_id="10.1",
        chapter=10,
        verse_number=1,
        theme="control_of_mind",
        english="The teacher explains that calming thoughts reduces anxiety and stress.",
        hindi="शिक्षक बताते हैं कि विचारों को शांत करना चिंता और तनाव कम करता है।",
        sanskrit="",
        context="Guidance on easing anxiety by returning attention to steady action.",
        mental_health_applications={"applications": ["anxiety_management", "stress_reduction"]},
    )
    test_db.add(verse)
    await test_db.commit()

    async def fake_generate_response(user_message: str, db, theme=None, application=None):
        results = await WisdomKnowledgeBase.search_relevant_verses(
            db, user_message, theme=theme, application=application, limit=2
        )
        context = chat_module.kiaan._build_gita_context(results)
        return f"Context used:\n{context}"

    # Monkeypatch the live generate_response_with_gita to avoid external API calls
    original_generate = chat_module.kiaan.generate_response_with_gita
    chat_module.kiaan.generate_response_with_gita = fake_generate_response

    try:
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "How do I handle anxiety before exams?"},
        )
    finally:
        chat_module.kiaan.generate_response_with_gita = original_generate

    assert response.status_code == 200
    data = response.json()
    assert "context used" in data["response"].lower()
    assert "anxiety" in data["response"].lower()
    assert "wisdom:" in data["response"].lower()
