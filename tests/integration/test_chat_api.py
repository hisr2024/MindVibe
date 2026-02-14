"""
Integration tests for Chat API endpoints

Tests the full chat API including message handling, session management,
and conversation history.
"""

from types import SimpleNamespace
from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.fixture
def sample_verse_data():
    """Sample verse data for testing."""
    return {
        "verse_id": "2.47",
        "chapter": 2,
        "verse_number": 47,
        "theme": "action_without_attachment",
        "english": "You have the right to perform your duties, but you are not entitled to the fruits of your actions.",
        "hindi": "तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं।",
        "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
        "context": "This verse teaches the principle of performing one's duties without attachment to outcomes.",
        "mental_health_applications": {
            "applications": ["anxiety_management", "stress_reduction"]
        },
        "embedding": None,
    }


def _mock_kiaan():
    """Create a mock KIAAN service for testing."""
    async def _generate(message: str, db):
        return "Test response"
    return SimpleNamespace(generate_response_with_gita=_generate)


@pytest.mark.asyncio
class TestChatEndpoints:
    """Test suite for chat API endpoints."""

    async def test_chat_smoke_contract_after_middlewares(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        """Ensure KIAAN contract stays stable after middleware/router setup."""
        from backend.routes import chat as chat_module

        async def _stable_response(message: str, db):
            return "Contract steady"

        monkeypatch.setattr(
            chat_module,
            "kiaan",
            SimpleNamespace(generate_response_with_gita=_stable_response),
        )

        response = await test_client.post(
            "/api/chat/message",
            json={"message": "Hello"},
        )

        assert response.status_code == 200
        data = response.json()
        expected_keys = {"status", "response", "bot", "version", "model", "gita_powered"}
        assert expected_keys.issubset(set(data.keys()))
        assert data["bot"] == "KIAAN"
        assert data["version"] == "15.0"
        assert data["status"] == "success"
        assert "response" in data

    async def test_chat_health_contract_after_router_init(self, test_client: AsyncClient):
        """Verify chat health retains identity fields after app middleware initialization."""
        response = await test_client.get("/api/chat/health")

        assert response.status_code == 200
        data = response.json()
        expected_keys = {"status", "bot", "version", "gita_kb_loaded"}
        assert expected_keys.issubset(set(data.keys()))
        assert data["bot"] == "KIAAN"
        assert data["version"] == "15.0"
        assert data["status"] in {"healthy", "error"}

    async def test_start_new_session(self, test_client: AsyncClient):
        """Test starting a new chat session."""
        response = await test_client.post("/api/chat/start")

        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "message" in data
        assert len(data["session_id"]) > 0

    async def test_send_message_new_session(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch, sample_verse_data):
        """Test sending a message without a session ID (creates new session)."""
        from backend.routes import chat as chat_module
        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "I'm feeling anxious about work"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success" or data.get("response")
        assert "response" in data

    async def test_send_message_with_session_id(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch, sample_verse_data):
        """Test sending a message with an existing session ID."""
        from backend.routes import chat as chat_module
        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        session_id = "test-session-123"

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "First message", "session_id": session_id},
            )

            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "success" or data.get("response")
            if "session_id" in data:
                assert data["session_id"] == session_id

    async def test_send_message_empty(self, test_client: AsyncClient):
        """Test sending an empty message (should fail)."""
        response = await test_client.post("/api/chat/message", json={"message": ""})

        assert response.status_code == 422  # Pydantic validation error
        assert "detail" in response.json()

    async def test_send_message_invalid_language(self, test_client: AsyncClient):
        """Test sending a message with unrecognized language still succeeds (no strict validation)."""
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "Test", "language": "invalid_language"},
        )

        # Backend accepts any language string and passes it through
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success" or data.get("response")

    async def test_send_message_hindi(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        """Test sending a message with Hindi language preference."""
        from backend.routes import chat as chat_module
        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "मुझे चिंता हो रही है", "language": "hindi"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "hindi"

    async def test_send_message_with_sanskrit(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        """Test sending a message with Sanskrit included."""
        from backend.routes import chat as chat_module
        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "Test", "include_sanskrit": True},
            )

        assert response.status_code == 200

    async def test_get_conversation_history(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        """Test retrieving conversation history endpoint exists and returns valid structure."""
        from backend.routes import chat as chat_module
        from tests.conftest import auth_headers_for

        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        session_id = "test-session-history"
        headers = auth_headers_for("test-user-123")

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            await test_client.post(
                "/api/chat/message",
                json={"message": "Hello", "session_id": session_id},
                headers=headers,
            )

        response = await test_client.get(
            "/api/chat/history",
            params={"session_id": session_id},
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert data.get("status") in {"success", "error"}

    async def test_get_conversation_history_not_found(self, test_client: AsyncClient):
        """Test retrieving non-existent conversation history returns empty or error."""
        from tests.conftest import auth_headers_for

        headers = auth_headers_for("test-user-123")
        response = await test_client.get(
            "/api/chat/history",
            params={"session_id": "non-existent-session"},
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert len(data["messages"]) == 0

    async def test_clear_conversation(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        """Test deleting a chat message (soft-delete)."""
        from backend.routes import chat as chat_module
        from tests.conftest import auth_headers_for

        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        headers = auth_headers_for("test-user-123")
        session_id = "test-session-clear"

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            msg_response = await test_client.post(
                "/api/chat/message",
                json={"message": "Test", "session_id": session_id},
                headers=headers,
            )

        msg_data = msg_response.json()
        message_id = msg_data.get("message_id")

        if message_id:
            response = await test_client.delete(
                f"/api/chat/history/{message_id}",
                headers=headers,
            )

            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "success"

    async def test_clear_conversation_not_found(self, test_client: AsyncClient):
        """Test deleting a non-existent message returns error status."""
        from tests.conftest import auth_headers_for

        headers = auth_headers_for("test-user-123")
        response = await test_client.delete(
            "/api/chat/history/non-existent-id",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"

    async def test_list_active_sessions(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        """Test listing active sessions."""
        from backend.routes import chat as chat_module
        from tests.conftest import auth_headers_for

        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        headers = auth_headers_for("test-user-123")
        session_ids = ["session-1", "session-2"]

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            for sid in session_ids:
                await test_client.post(
                    "/api/chat/message",
                    json={"message": "Test", "session_id": sid},
                    headers=headers,
                )

        response = await test_client.get("/api/chat/sessions", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert isinstance(data["sessions"], list)

    async def test_health_check(self, test_client: AsyncClient):
        """Test chatbot health check endpoint."""
        response = await test_client.get("/api/chat/health")

        assert response.status_code == 200
        data = response.json()
        expected_keys = {"status", "bot", "version", "gita_kb_loaded"}
        assert expected_keys.issubset(set(data.keys()))
        assert data["status"] in {"healthy", "error"}
        assert data["bot"] == "KIAAN"

    async def test_multi_turn_conversation(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        """Test a multi-turn conversation."""
        from backend.routes import chat as chat_module
        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        session_id = "test-multi-turn"
        messages = [
            "I'm feeling stressed",
            "What can I do about it?",
            "How do I stay calm?",
        ]

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            for i, msg in enumerate(messages):
                response = await test_client.post(
                    "/api/chat/message",
                    json={"message": msg, "session_id": session_id},
                )

                assert response.status_code == 200
                data = response.json()
                assert data.get("status") == "success" or data.get("response")

    async def test_concurrent_sessions(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        """Test that multiple sessions can coexist."""
        from backend.routes import chat as chat_module
        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        session1 = "concurrent-session-1"
        session2 = "concurrent-session-2"

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            response1 = await test_client.post(
                "/api/chat/message",
                json={"message": "Session 1 message", "session_id": session1},
            )

            response2 = await test_client.post(
                "/api/chat/message",
                json={"message": "Session 2 message", "session_id": session2},
            )

            assert response1.status_code == 200
            assert response2.status_code == 200

            data1 = response1.json()
            data2 = response2.json()
            assert data1.get("status") == "success" or data1.get("response")
            assert data2.get("status") == "success" or data2.get("response")


@pytest.mark.asyncio
class TestChatErrorHandling:
    """Test error handling in chat API."""

    async def test_invalid_json(self, test_client: AsyncClient):
        """Test sending invalid JSON."""
        response = await test_client.post(
            "/api/chat/message",
            content="invalid json",
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 422  # Unprocessable Entity

    async def test_missing_required_field(self, test_client: AsyncClient):
        """Test sending request without required message field."""
        response = await test_client.post(
            "/api/chat/message", json={"language": "english"}
        )

        assert response.status_code == 422

    async def test_database_error(self, test_client: AsyncClient):
        """Test handling database errors gracefully (degraded response, not 500)."""
        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            side_effect=Exception("Database error"),
        ):
            response = await test_client.post(
                "/api/chat/message", json={"message": "Test"}
            )

            # Backend handles errors gracefully and returns a response
            assert response.status_code == 200
            data = response.json()
            assert "response" in data


@pytest.mark.asyncio
class TestChatValidation:
    """Test input validation for chat endpoints."""

    @pytest.mark.parametrize("language", ["english", "hindi", "sanskrit"])
    async def test_valid_languages(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch, language):
        """Test that all valid languages are accepted."""
        from backend.routes import chat as chat_module
        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "Test", "language": language},
            )

            assert response.status_code == 200

    @pytest.mark.parametrize("include_sanskrit", [True, False])
    async def test_include_sanskrit_options(self, test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch, include_sanskrit):
        """Test both options for include_sanskrit parameter."""
        from backend.routes import chat as chat_module
        monkeypatch.setattr(chat_module, "kiaan", _mock_kiaan())

        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[],
        ):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "Test", "include_sanskrit": include_sanskrit},
            )

            assert response.status_code == 200
