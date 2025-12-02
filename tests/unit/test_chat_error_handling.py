"""
Unit tests for chat.py error handling

Tests the specific error handling improvements for the chat loop fix.
Validates that proper error messages are returned for different failure scenarios.
"""

import pytest
from unittest.mock import Mock, patch
from openai import AuthenticationError, BadRequestError, RateLimitError, APIError


class TestKIAANErrorHandling:
    """Test suite for KIAAN chatbot error handling."""

    @patch('backend.routes.chat.client')
    def test_authentication_error_handling(self, mock_client):
        """Test that AuthenticationError returns proper error message."""
        from backend.routes.chat import KIAAN
        
        # Mock the client to raise AuthenticationError
        mock_client.chat.completions.create.side_effect = AuthenticationError(
            "Invalid API key",
            response=Mock(status_code=401),
            body=None
        )
        
        kiaan = KIAAN()
        kiaan.client = mock_client
        kiaan.ready = True
        
        response = kiaan.generate_response("Hello")
        
        assert "❌ API authentication failed" in response
        assert "configuration" in response.lower()

    @patch('backend.routes.chat.client')
    def test_bad_request_error_handling(self, mock_client):
        """Test that BadRequestError returns proper error message."""
        from backend.routes.chat import KIAAN
        
        # Mock the client to raise BadRequestError (e.g., invalid model name)
        mock_client.chat.completions.create.side_effect = BadRequestError(
            "Invalid model",
            response=Mock(status_code=400),
            body=None
        )
        
        kiaan = KIAAN()
        kiaan.client = mock_client
        kiaan.ready = True
        
        response = kiaan.generate_response("Hello")
        
        assert "❌ Invalid request" in response
        assert "try again" in response.lower()

    @patch('backend.routes.chat.client')
    def test_rate_limit_error_handling(self, mock_client):
        """Test that RateLimitError returns proper error message."""
        from backend.routes.chat import KIAAN
        
        # Mock the client to raise RateLimitError
        mock_client.chat.completions.create.side_effect = RateLimitError(
            "Rate limit exceeded",
            response=Mock(status_code=429),
            body=None
        )
        
        kiaan = KIAAN()
        kiaan.client = mock_client
        kiaan.ready = True
        
        response = kiaan.generate_response("Hello")
        
        assert "⏱️" in response or "Too many requests" in response
        assert "wait" in response.lower()

    @patch('backend.routes.chat.client')
    def test_api_error_with_fallback(self, mock_client):
        """Test that APIError attempts fallback and returns appropriate message."""
        from backend.routes.chat import KIAAN
        
        # Mock the client to raise APIError
        mock_client.chat.completions.create.side_effect = APIError(
            "API error",
            request=Mock(),
            body=None
        )
        
        kiaan = KIAAN()
        kiaan.client = mock_client
        kiaan.ready = True
        
        response = kiaan.generate_response("Hello")
        
        assert "cloud connection" in response
        assert "💙" in response

    @patch('backend.routes.chat.client')
    def test_generic_exception_handling(self, mock_client):
        """Test that generic exceptions are handled gracefully."""
        from backend.routes.chat import KIAAN
        
        # Mock the client to raise a generic exception
        mock_client.chat.completions.create.side_effect = Exception("Unexpected error")
        
        kiaan = KIAAN()
        kiaan.client = mock_client
        kiaan.ready = True
        
        response = kiaan.generate_response("Hello")
        
        assert "cloud connection" in response
        assert "💙" in response

    def test_no_api_key_configured(self):
        """Test that missing API key returns proper error message."""
        from backend.routes.chat import KIAAN
        
        kiaan = KIAAN()
        kiaan.ready = False
        kiaan.client = None
        
        response = kiaan.generate_response("Hello")
        
        assert "cloud connection" in response
        assert "💙" in response

    def test_crisis_detection_still_works(self):
        """Test that crisis detection works regardless of API errors."""
        from backend.routes.chat import KIAAN
        
        kiaan = KIAAN()
        kiaan.ready = False  # Even without API
        
        response = kiaan.generate_response("I want to kill myself")
        
        assert "🆘" in response
        assert "988" in response
        assert "Suicide & Crisis Lifeline" in response

    @patch('backend.routes.chat.client')
    def test_successful_response_with_gpt4(self, mock_client):
        """Test that successful API call uses gpt-4 model."""
        from backend.routes.chat import KIAAN
        
        # Mock successful response
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Here to help! 💙"))]
        mock_client.chat.completions.create.return_value = mock_response
        
        kiaan = KIAAN()
        kiaan.client = mock_client
        kiaan.ready = True
        
        response = kiaan.generate_response("I'm feeling anxious")
        
        # Verify the model parameter was gpt-4
        mock_client.chat.completions.create.assert_called_once()
        call_kwargs = mock_client.chat.completions.create.call_args[1]
        assert call_kwargs['model'] == 'gpt-4'
        assert response == "Here to help! 💙"


class TestEndpointMetadata:
    """Test that endpoint metadata reflects gpt-4 model."""

    @pytest.mark.asyncio
    async def test_message_endpoint_returns_gpt4_model(self):
        """Test that /message endpoint returns GPT-4 in metadata."""
        from backend.routes.chat import send_message, ChatMessage
        
        with patch('backend.routes.chat.kiaan') as mock_kiaan:
            mock_kiaan.generate_response.return_value = "Test response 💙"
            
            result = await send_message(ChatMessage(message="Hello"))
            
            assert result["model"] == "GPT-4"
            assert result["bot"] == "KIAAN"

    @pytest.mark.asyncio
    async def test_about_endpoint_returns_gpt4_model(self):
        """Test that /about endpoint returns gpt-4 in model field."""
        from backend.routes.chat import about
        
        result = await about()
        
        assert result["model"] == "gpt-4"
        assert result["name"] == "KIAAN"

    @pytest.mark.asyncio
    async def test_debug_endpoint_includes_fallback_status(self):
        """Test that /debug endpoint includes fallback_available field."""
        from backend.routes.chat import debug
        
        result = await debug()
        
        assert "fallback_available" in result
        assert result["model"] == "gpt-4"
        assert isinstance(result["fallback_available"], bool)
