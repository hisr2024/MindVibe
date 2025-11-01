"""
Integration tests for Chat API endpoints

Tests the full chatbot API including message handling, session management,
and conversation history.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from main import app
from models import WisdomVerse


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
        "mental_health_applications": {"applications": ["anxiety_management", "stress_reduction"]},
        "embedding": None
    }


@pytest.mark.asyncio
class TestChatEndpoints:
    """Test suite for chat API endpoints."""
    
    async def test_start_new_session(self):
        """Test starting a new chat session."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/chat/start")
            
            assert response.status_code == 200
            data = response.json()
            assert "session_id" in data
            assert "message" in data
            assert len(data["session_id"]) > 0
    
    async def test_send_message_new_session(self, sample_verse_data):
        """Test sending a message without a session ID (creates new session)."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Mock the database query and OpenAI
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="I understand your concern about anxiety..."):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    response = await client.post(
                        "/api/chat/message",
                        json={
                            "message": "I'm feeling anxious about work"
                        }
                    )
            
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert "session_id" in data
            assert "verses" in data
            assert "conversation_length" in data
            assert data["conversation_length"] >= 2
    
    async def test_send_message_with_session_id(self, sample_verse_data):
        """Test sending a message with an existing session ID."""
        session_id = "test-session-123"
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    response = await client.post(
                        "/api/chat/message",
                        json={
                            "message": "First message",
                            "session_id": session_id
                        }
                    )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert data["session_id"] == session_id
    
    async def test_send_message_empty(self):
        """Test sending an empty message (should fail)."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/chat/message",
                json={
                    "message": ""
                }
            )
            
            assert response.status_code == 422
            assert "message" in response.json()["detail"][0]["loc"]
    
    async def test_send_message_invalid_language(self):
        """Test sending a message with invalid language."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/chat/message",
                json={
                    "message": "Test",
                    "language": "invalid_language"
                }
            )
            
            assert response.status_code == 400
            assert "language" in response.json()["detail"].lower()
    
    async def test_send_message_hindi(self):
        """Test sending a message with Hindi language preference."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    response = await client.post(
                        "/api/chat/message",
                        json={
                            "message": "मुझे चिंता हो रही है",
                            "language": "hindi"
                        }
                    )
            
            assert response.status_code == 200
            data = response.json()
            assert data["language"] == "hindi"
    
    async def test_send_message_with_sanskrit(self):
        """Test sending a message with Sanskrit included."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    response = await client.post(
                        "/api/chat/message",
                        json={
                            "message": "Test",
                            "include_sanskrit": True
                        }
                    )
            
            assert response.status_code == 200
    
    async def test_get_conversation_history(self):
        """Test retrieving conversation history."""
        session_id = "test-session-history"
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # First, send a message to create history
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    await client.post(
                        "/api/chat/message",
                        json={
                            "message": "Hello",
                            "session_id": session_id
                        }
                    )
            
            # Then retrieve history
            response = await client.get(f"/api/chat/history/{session_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert "session_id" in data
            assert "messages" in data
            assert "total_messages" in data
            assert data["session_id"] == session_id
            assert len(data["messages"]) >= 2  # User + assistant
    
    async def test_get_conversation_history_not_found(self):
        """Test retrieving non-existent conversation history."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/chat/history/non-existent-session")
            
            assert response.status_code == 404
    
    async def test_clear_conversation(self):
        """Test clearing conversation history."""
        session_id = "test-session-clear"
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Create a conversation
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    await client.post(
                        "/api/chat/message",
                        json={
                            "message": "Test",
                            "session_id": session_id
                        }
                    )
            
            # Clear the conversation
            response = await client.delete(f"/api/chat/history/{session_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["session_id"] == session_id
            
            # Verify it's cleared
            history_response = await client.get(f"/api/chat/history/{session_id}")
            assert history_response.status_code == 404
    
    async def test_clear_conversation_not_found(self):
        """Test clearing non-existent conversation."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete("/api/chat/history/non-existent-session")
            
            assert response.status_code == 404
    
    async def test_list_active_sessions(self):
        """Test listing active sessions."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Create a few sessions
            session_ids = ["session-1", "session-2"]
            
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    for sid in session_ids:
                        await client.post(
                            "/api/chat/message",
                            json={
                                "message": "Test",
                                "session_id": sid
                            }
                        )
            
            # List sessions
            response = await client.get("/api/chat/sessions")
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            # Should include our sessions
            session_ids_in_response = [s["session_id"] for s in data]
            for sid in session_ids:
                assert sid in session_ids_in_response
    
    async def test_health_check(self):
        """Test chatbot health check endpoint."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/chat/health")
            
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
            assert "openai_enabled" in data
            assert "fallback_mode" in data
            assert "active_sessions" in data
            assert "supported_languages" in data
            assert data["status"] == "healthy"
            assert "english" in data["supported_languages"]
    
    async def test_multi_turn_conversation(self):
        """Test a multi-turn conversation."""
        session_id = "test-multi-turn"
        messages = [
            "I'm feeling stressed",
            "What can I do about it?",
            "How do I stay calm?"
        ]
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    for i, msg in enumerate(messages):
                        response = await client.post(
                            "/api/chat/message",
                            json={
                                "message": msg,
                                "session_id": session_id
                            }
                        )
                        
                        assert response.status_code == 200
                        data = response.json()
                        # Conversation length should increase
                        expected_length = (i + 1) * 2  # Each turn has user + assistant
                        assert data["conversation_length"] == expected_length
    
    async def test_concurrent_sessions(self):
        """Test that multiple sessions can coexist."""
        session1 = "concurrent-session-1"
        session2 = "concurrent-session-2"
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    # Send messages to both sessions
                    response1 = await client.post(
                        "/api/chat/message",
                        json={
                            "message": "Session 1 message",
                            "session_id": session1
                        }
                    )
                    
                    response2 = await client.post(
                        "/api/chat/message",
                        json={
                            "message": "Session 2 message",
                            "session_id": session2
                        }
                    )
                    
                    assert response1.status_code == 200
                    assert response2.status_code == 200
                    
                    # Verify histories are separate
                    hist1 = await client.get(f"/api/chat/history/{session1}")
                    hist2 = await client.get(f"/api/chat/history/{session2}")
                    
                    assert hist1.json()["messages"][0]["content"] == "Session 1 message"
                    assert hist2.json()["messages"][0]["content"] == "Session 2 message"


@pytest.mark.asyncio
class TestChatErrorHandling:
    """Test error handling in chat API."""
    
    async def test_invalid_json(self):
        """Test sending invalid JSON."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/chat/message",
                content="invalid json",
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 422  # Unprocessable Entity
    
    async def test_missing_required_field(self):
        """Test sending request without required message field."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/chat/message",
                json={
                    "language": "english"
                }
            )
            
            assert response.status_code == 422
    
    async def test_database_error(self):
        """Test handling database errors gracefully."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                      side_effect=Exception("Database error")):
                response = await client.post(
                    "/api/chat/message",
                    json={
                        "message": "Test"
                    }
                )
                
                # Should return 500 with error message
                assert response.status_code == 500
                assert "error" in response.json()["detail"].lower()


@pytest.mark.asyncio
class TestChatValidation:
    """Test input validation for chat endpoints."""
    
    @pytest.mark.parametrize("language", ["english", "hindi", "sanskrit"])
    async def test_valid_languages(self, language):
        """Test that all valid languages are accepted."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    response = await client.post(
                        "/api/chat/message",
                        json={
                            "message": "Test",
                            "language": language
                        }
                    )
                    
                    assert response.status_code == 200
    
    @pytest.mark.parametrize("include_sanskrit", [True, False])
    async def test_include_sanskrit_options(self, include_sanskrit):
        """Test both options for include_sanskrit parameter."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            with patch('services.chatbot.ChatbotService._generate_chat_response',
                      return_value="Response"):
                with patch('services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
                          return_value=[]):
                    response = await client.post(
                        "/api/chat/message",
                        json={
                            "message": "Test",
                            "include_sanskrit": include_sanskrit
                        }
                    )
                    
                    assert response.status_code == 200
