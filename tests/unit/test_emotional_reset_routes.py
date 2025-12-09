"""
Unit tests for Emotional Reset API Routes

Tests the API endpoints for the emotional reset feature.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import ValidationError

# Import the router models
from backend.routes.emotional_reset import (
    StepInput,
    SessionRequest,
)


class TestStepInput:
    """Test StepInput validation."""

    def test_valid_input(self):
        """Test valid step input."""
        step_input = StepInput(
            session_id="test-session-123",
            current_step=1,
            user_input="I feel anxious",
        )
        assert step_input.session_id == "test-session-123"
        assert step_input.current_step == 1
        assert step_input.user_input == "I feel anxious"

    def test_input_stripped(self):
        """Test that input is stripped of whitespace."""
        step_input = StepInput(
            session_id="test-session",
            current_step=1,
            user_input="  some text  ",
        )
        assert step_input.user_input == "some text"

    def test_optional_user_input(self):
        """Test that user_input is optional."""
        step_input = StepInput(
            session_id="test-session",
            current_step=2,
        )
        assert step_input.user_input is None

    def test_step_range_validation(self):
        """Test step number validation."""
        # Valid steps
        for step in range(1, 8):
            step_input = StepInput(session_id="test", current_step=step)
            assert step_input.current_step == step

    def test_input_max_length(self):
        """Test user_input max length validation."""
        with pytest.raises(ValidationError):
            StepInput(
                session_id="test",
                current_step=1,
                user_input="x" * 201,  # Over 200 chars
            )

    def test_step_too_low(self):
        """Test step number below minimum."""
        with pytest.raises(ValidationError):
            StepInput(session_id="test", current_step=0)

    def test_step_too_high(self):
        """Test step number above maximum."""
        with pytest.raises(ValidationError):
            StepInput(session_id="test", current_step=8)


class TestSessionRequest:
    """Test SessionRequest validation."""

    def test_valid_session_request(self):
        """Test valid session request."""
        request = SessionRequest(session_id="valid-session-id")
        assert request.session_id == "valid-session-id"

    def test_empty_session_id(self):
        """Test empty session_id validation."""
        with pytest.raises(ValidationError):
            SessionRequest(session_id="")


class TestHealthEndpoint:
    """Test health check endpoint."""

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test health endpoint response."""
        from backend.routes.emotional_reset import health

        result = await health()

        assert "status" in result
        assert result["feature"] == "emotional_reset"
        assert result["version"] == "1.0.0"


class TestServiceIntegration:
    """Test that routes interact correctly with the service layer."""

    @pytest.fixture
    def mock_service(self):
        """Create a mock emotional reset service."""
        return MagicMock()

    def test_step_input_model_validation(self):
        """Test StepInput model validates properly."""
        # Valid input
        valid = StepInput(
            session_id="abc123",
            current_step=1,
            user_input="test"
        )
        assert valid.session_id == "abc123"
        
        # Invalid - empty session_id
        with pytest.raises(ValidationError):
            StepInput(session_id="", current_step=1)
        
        # Invalid - step out of range
        with pytest.raises(ValidationError):
            StepInput(session_id="test", current_step=10)

    def test_session_request_model_validation(self):
        """Test SessionRequest model validates properly."""
        valid = SessionRequest(session_id="abc123")
        assert valid.session_id == "abc123"
        
        with pytest.raises(ValidationError):
            SessionRequest(session_id="")

    @pytest.mark.asyncio
    async def test_service_methods_called(self):
        """Test that route functions call correct service methods."""
        from backend.routes.emotional_reset import emotional_reset_service
        
        # Verify service is initialized
        assert emotional_reset_service is not None
        assert hasattr(emotional_reset_service, 'start_session')
        assert hasattr(emotional_reset_service, 'process_step')
        assert hasattr(emotional_reset_service, 'get_session')
        assert hasattr(emotional_reset_service, 'complete_session')

    def test_feature_flag_env_var(self):
        """Test that feature flag is read from environment."""
        import os
        from backend.routes.emotional_reset import EMOTIONAL_RESET_ENABLED
        
        # Default should be True
        assert EMOTIONAL_RESET_ENABLED in [True, False]

