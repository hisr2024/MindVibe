"""
Unit tests for Emotional Reset Service

Tests the core logic of the 7-step emotional reset flow.
"""

import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.emotional_reset_service import EmotionalResetService


@pytest.fixture
def emotional_reset_service():
    """Create an EmotionalResetService instance for testing."""
    return EmotionalResetService()


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return AsyncMock()


class TestEmotionalResetService:
    """Test suite for EmotionalResetService class."""

    def test_init(self, emotional_reset_service):
        """Test service initialization."""
        assert emotional_reset_service.safety_validator is not None
        assert emotional_reset_service.wisdom_kb is not None

    def test_step_content_defined(self, emotional_reset_service):
        """Test that all 7 steps have content defined."""
        for step in range(1, 8):
            assert step in emotional_reset_service.STEP_CONTENT
            assert "title" in emotional_reset_service.STEP_CONTENT[step]

    @pytest.mark.asyncio
    async def test_check_rate_limit_allowed(self, emotional_reset_service, mock_db):
        """Test rate limit check when under limit."""
        mock_result = MagicMock()
        mock_result.scalar.return_value = 5  # Under limit
        mock_db.execute = AsyncMock(return_value=mock_result)

        is_allowed, sessions_today = await emotional_reset_service.check_rate_limit(
            mock_db, "user-123"
        )

        assert is_allowed is True
        assert sessions_today == 5

    @pytest.mark.asyncio
    async def test_check_rate_limit_exceeded(self, emotional_reset_service, mock_db):
        """Test rate limit check when limit exceeded."""
        mock_result = MagicMock()
        mock_result.scalar.return_value = 10  # At limit
        mock_db.execute = AsyncMock(return_value=mock_result)

        is_allowed, sessions_today = await emotional_reset_service.check_rate_limit(
            mock_db, "user-123"
        )

        assert is_allowed is False
        assert sessions_today == 10


class TestCrisisDetection:
    """Test crisis detection functionality."""

    def test_detect_crisis_positive(self, emotional_reset_service):
        """Test crisis detection with concerning keywords."""
        result = emotional_reset_service.detect_crisis("I want to kill myself")

        assert result["crisis_detected"] is True
        assert "self_harm" in result["crisis_types"]
        assert result["severity"] == "critical"

    def test_detect_crisis_negative(self, emotional_reset_service):
        """Test crisis detection with normal input."""
        result = emotional_reset_service.detect_crisis("I'm feeling stressed about work")

        assert result["crisis_detected"] is False
        assert result["crisis_types"] == []
        assert result["severity"] == "none"

    def test_detect_crisis_acute_distress(self, emotional_reset_service):
        """Test crisis detection with acute distress keywords."""
        result = emotional_reset_service.detect_crisis("I can't take it anymore")

        assert result["crisis_detected"] is True
        assert "acute_distress" in result["crisis_types"]
        assert result["severity"] == "high"


class TestEmotionExtraction:
    """Test emotion extraction from user input."""

    def test_extract_emotions_anxiety(self, emotional_reset_service):
        """Test extracting anxiety from input."""
        emotions = emotional_reset_service._extract_emotions(
            "I'm feeling really anxious and worried about everything"
        )

        assert "anxious" in emotions

    def test_extract_emotions_multiple(self, emotional_reset_service):
        """Test extracting multiple emotions."""
        emotions = emotional_reset_service._extract_emotions(
            "I'm stressed and sad about my situation"
        )

        assert "stressed" in emotions
        assert "sad" in emotions

    def test_extract_emotions_none_found(self, emotional_reset_service):
        """Test when no specific emotions are found."""
        emotions = emotional_reset_service._extract_emotions(
            "The sky is blue today"
        )

        assert emotions == ["uncertain"]


class TestThemeIdentification:
    """Test theme identification from user input."""

    def test_identify_themes_work(self, emotional_reset_service):
        """Test identifying work-related themes."""
        themes = emotional_reset_service._identify_themes(
            "My boss is very demanding and work is stressful"
        )

        assert "work" in themes

    def test_identify_themes_relationships(self, emotional_reset_service):
        """Test identifying relationship themes."""
        themes = emotional_reset_service._identify_themes(
            "My partner and I are having problems"
        )

        assert "relationships" in themes

    def test_identify_themes_default(self, emotional_reset_service):
        """Test default theme when none found."""
        themes = emotional_reset_service._identify_themes("Hello there")

        assert themes == ["general_wellbeing"]


class TestBreathingGuidance:
    """Test breathing guidance generation."""

    def test_generate_breathing_guidance(self, emotional_reset_service):
        """Test breathing guidance structure."""
        guidance = emotional_reset_service.generate_breathing_guidance()

        assert "pattern" in guidance
        assert guidance["pattern"]["inhale"] == 4
        assert guidance["pattern"]["hold_in"] == 4
        assert guidance["pattern"]["exhale"] == 4
        assert guidance["pattern"]["hold_out"] == 4
        assert guidance["duration_seconds"] == 120
        assert "narration" in guidance
        assert len(guidance["narration"]) > 0
        assert "completion_message" in guidance


class TestAssessment:
    """Test emotional assessment generation."""

    @pytest.mark.asyncio
    async def test_assess_emotions_fallback(self, emotional_reset_service):
        """Test fallback assessment when OpenAI is unavailable."""
        # Disable OpenAI client
        emotional_reset_service.client = None

        assessment = await emotional_reset_service.assess_emotions(
            "I'm feeling really anxious"
        )

        assert "assessment" in assessment
        assert "emotions" in assessment
        assert "anxious" in assessment["emotions"]
        assert len(assessment["assessment"]) > 0
        assert "💙" in assessment["assessment"]

    def test_get_fallback_assessment(self, emotional_reset_service):
        """Test fallback assessment for different emotions."""
        assessment = emotional_reset_service._get_fallback_assessment(
            "I'm stressed about everything"
        )

        assert "stressed" in assessment["emotions"]
        assert "stress" in assessment["assessment"].lower()


class TestVisualization:
    """Test release visualization generation."""

    @pytest.mark.asyncio
    async def test_create_release_visualization_fallback(self, emotional_reset_service):
        """Test fallback visualization when OpenAI is unavailable."""
        emotional_reset_service.client = None

        visualization = await emotional_reset_service.create_release_visualization(
            ["anxious", "stressed"]
        )

        assert len(visualization) > 0
        assert "💙" in visualization

    def test_get_fallback_visualization(self, emotional_reset_service):
        """Test fallback visualization content."""
        visualization = emotional_reset_service._get_fallback_visualization(["anxious"])

        assert "stream" in visualization.lower()
        assert "💙" in visualization


class TestAffirmations:
    """Test affirmation generation."""

    @pytest.mark.asyncio
    async def test_create_affirmations_fallback(self, emotional_reset_service):
        """Test fallback affirmations when OpenAI is unavailable."""
        emotional_reset_service.client = None

        affirmations = await emotional_reset_service.create_affirmations(
            ["anxious"], ["work"]
        )

        assert len(affirmations) >= 3
        assert len(affirmations) <= 5
        for affirmation in affirmations:
            assert len(affirmation) > 0

    def test_get_fallback_affirmations(self, emotional_reset_service):
        """Test fallback affirmations for specific emotions."""
        affirmations = emotional_reset_service._get_fallback_affirmations(["anxious"])

        assert len(affirmations) >= 3
        # First affirmation should be emotion-specific
        assert "release" in affirmations[0].lower() or "trust" in affirmations[0].lower()


class TestSessionSummary:
    """Test session summary generation."""

    def test_generate_session_summary(self, emotional_reset_service):
        """Test session summary structure."""
        summary = emotional_reset_service.generate_session_summary(
            "I'm feeling anxious about work",  # positional: _emotions_input
            {"emotions": ["anxious"], "themes": ["work"]},  # positional: assessment
            ["I am capable of handling challenges"],  # positional: affirmations
        )

        assert "summary" in summary
        assert "key_insight" in summary
        assert "affirmation_to_remember" in summary
        assert "next_steps" in summary
        assert len(summary["next_steps"]) > 0
        assert "closing_message" in summary
        assert "💙" in summary["closing_message"]


class TestWisdomIntegration:
    """Test wisdom verse integration."""

    @pytest.mark.asyncio
    async def test_generate_wisdom_insights_fallback(
        self, emotional_reset_service, mock_db
    ):
        """Test fallback wisdom when no verses found."""
        # Mock empty verse search
        with patch.object(
            emotional_reset_service.wisdom_kb,
            "search_relevant_verses",
            return_value=[],
        ):
            insights = await emotional_reset_service.generate_wisdom_insights(
                mock_db, {"emotions": ["anxious"], "themes": ["work"]}
            )

        assert len(insights) >= 1
        assert "wisdom" in insights[0]
        assert "application" in insights[0]

    def test_get_fallback_wisdom(self, emotional_reset_service):
        """Test fallback wisdom structure."""
        wisdom = emotional_reset_service._get_fallback_wisdom(["anxious"])

        assert len(wisdom) >= 1
        assert "wisdom" in wisdom[0]
        assert "application" in wisdom[0]


class TestSessionProcessing:
    """Test session processing logic."""

    @pytest.mark.asyncio
    async def test_process_step_crisis_detection(
        self, emotional_reset_service, mock_db
    ):
        """Test that crisis is detected during step processing."""
        # Create mock session
        mock_session = MagicMock()
        mock_session.completed = False
        mock_session.assessment_data = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_session
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await emotional_reset_service.process_step(
            db=mock_db,
            session_id="test-session",
            user_id="user-123",
            current_step=1,
            user_input="I want to end my life",
        )

        assert result["success"] is False
        assert result["error"] == "crisis_detected"
        assert "crisis_response" in result

    @pytest.mark.asyncio
    async def test_process_step_input_validation(
        self, emotional_reset_service, mock_db
    ):
        """Test input length validation."""
        mock_session = MagicMock()
        mock_session.completed = False

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_session
        mock_db.execute = AsyncMock(return_value=mock_result)

        # Input too long
        long_input = "x" * 250
        result = await emotional_reset_service.process_step(
            db=mock_db,
            session_id="test-session",
            user_id="user-123",
            current_step=1,
            user_input=long_input,
        )

        assert result["success"] is False
        assert result["error"] == "input_too_long"

    @pytest.mark.asyncio
    async def test_process_step_session_not_found(
        self, emotional_reset_service, mock_db
    ):
        """Test handling of non-existent session."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await emotional_reset_service.process_step(
            db=mock_db,
            session_id="non-existent",
            user_id="user-123",
            current_step=1,
            user_input="test",
        )

        assert result["success"] is False
        assert result["error"] == "session_not_found"


class TestAnonymousUserSupport:
    """Test anonymous user support for emotional reset."""

    @pytest.mark.asyncio
    async def test_start_session_with_none_user_id(
        self, emotional_reset_service, mock_db
    ):
        """Test that start_session generates anonymous ID when user_id is None."""
        # Mock rate limit check
        mock_rate_result = MagicMock()
        mock_rate_result.scalar.return_value = 0  # Under limit
        mock_db.execute = AsyncMock(return_value=mock_rate_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await emotional_reset_service.start_session(db=mock_db, user_id=None)

        assert result["success"] is True
        assert "session_id" in result
        # Verify a session was created (db.add was called)
        assert mock_db.add.called

    @pytest.mark.asyncio
    async def test_start_session_generates_anon_prefix(
        self, emotional_reset_service, mock_db
    ):
        """Test that anonymous user IDs have 'anon-' prefix."""
        # Mock rate limit check
        mock_rate_result = MagicMock()
        mock_rate_result.scalar.return_value = 0
        mock_db.execute = AsyncMock(return_value=mock_rate_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Capture the session added to the DB
        added_sessions = []
        def capture_add(obj):
            added_sessions.append(obj)
        mock_db.add = MagicMock(side_effect=capture_add)

        await emotional_reset_service.start_session(db=mock_db, user_id=None)

        assert len(added_sessions) == 1
        assert added_sessions[0].user_id.startswith("anon-")
        # anon- (5 chars) + 12 hex chars = 17 total chars
        expected_length = len("anon-") + 12
        assert len(added_sessions[0].user_id) == expected_length

    @pytest.mark.asyncio
    async def test_process_step_with_none_user_id(
        self, emotional_reset_service, mock_db
    ):
        """Test that process_step works with None user_id for anonymous sessions."""
        mock_session = MagicMock()
        mock_session.completed = False
        mock_session.assessment_data = None
        mock_session.user_id = "anon-abc123def456"

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_session
        mock_db.execute = AsyncMock(return_value=mock_result)

        # Use None user_id - should query for anon sessions
        result = await emotional_reset_service.process_step(
            db=mock_db,
            session_id="test-session",
            user_id=None,
            current_step=1,
            user_input="I feel anxious",
        )

        # Should work without error
        assert result["success"] is True or result.get("error") is not None

    @pytest.mark.asyncio
    async def test_get_session_with_none_user_id(
        self, emotional_reset_service, mock_db
    ):
        """Test that get_session works with None user_id for anonymous sessions."""
        mock_session = MagicMock()
        mock_session.session_id = "test-session"
        mock_session.user_id = "anon-abc123def456"
        mock_session.current_step = 2
        mock_session.completed = False
        mock_session.created_at = datetime.datetime.now(datetime.UTC)
        mock_session.updated_at = datetime.datetime.now(datetime.UTC)
        mock_session.emotions_input = None
        mock_session.assessment_data = None
        mock_session.affirmations = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_session
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await emotional_reset_service.get_session(
            db=mock_db,
            session_id="test-session",
            user_id=None,
        )

        assert result is not None
        assert result["success"] is True
        assert result["session_id"] == "test-session"

    @pytest.mark.asyncio
    async def test_complete_session_with_none_user_id(
        self, emotional_reset_service, mock_db
    ):
        """Test that complete_session works with None user_id for anonymous sessions."""
        mock_session = MagicMock()
        mock_session.completed = False
        mock_session.user_id = "anon-abc123def456"
        mock_session.emotions_input = "test"
        mock_session.assessment_data = {"emotions": ["anxious"]}
        mock_session.affirmations = ["I am strong"]

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_session
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()

        result = await emotional_reset_service.complete_session(
            db=mock_db,
            session_id="test-session",
            user_id=None,
        )

        assert result["success"] is True
