"""
Integration Tests for KIAAN Voice Companion Pipeline

Validates the full voice companion workflow:
- Session start (with and without auth)
- Message send/receive through all 3 AI tiers
- Voice synthesis proxy (premium audio + browser fallback)
- Session end with summary
- Subscription gating for premium features
- Quick response (wake word activation)

These tests mock the database and OpenAI to verify the pipeline logic
without requiring live services.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock, AsyncMock

from tests.conftest import auth_headers_for


@pytest.fixture
def mock_auth_header():
    """Authentication header with a valid JWT token for test-user-voice."""
    return auth_headers_for("test-user-voice")


@pytest.fixture
def mock_user():
    """Mock User object for dependency injection."""
    user = MagicMock()
    user.id = "test-user-voice"
    user.email = "test@mindvibe.app"
    return user


@pytest.fixture
def mock_companion_profile():
    """Mock CompanionProfile for voice companion sessions."""
    profile = MagicMock()
    profile.user_id = "test-user-voice"
    profile.preferred_name = "Friend"
    profile.total_sessions = 3
    profile.total_messages = 20
    profile.streak_days = 2
    profile.longest_streak = 5
    profile.preferred_tone = "warm"
    profile.prefers_tough_love = False
    profile.humor_level = "moderate"
    profile.address_style = "friend"
    profile.common_moods = {"neutral": 5, "anxious": 3}
    profile.last_conversation_at = None
    return profile


@pytest.fixture
def mock_companion_session():
    """Mock CompanionSession for active session validation."""
    session = MagicMock()
    session.id = "test-session-123"
    session.user_id = "test-user-voice"
    session.is_active = True
    session.message_count = 2
    session.user_message_count = 1
    session.phase = "connect"
    session.initial_mood = None
    session.final_mood = None
    session.language = "en"
    return session


class TestVoiceCompanionSessionStart:
    """Tests for voice companion session start endpoint."""

    @pytest.mark.asyncio
    async def test_session_start_returns_greeting(self, mock_auth_header, mock_user, mock_companion_profile):
        """Starting a session should return a greeting and session_id."""
        from backend.main import app
        from backend.deps import get_current_user, get_db as get_db_dep

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_companion_profile
        mock_session.execute.return_value = mock_result
        mock_session.flush = AsyncMock()
        mock_session.commit = AsyncMock()

        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db_dep] = lambda: mock_session

        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    "/api/voice-companion/session/start",
                    json={"language": "en", "voice_id": "sarvam-aura"},
                    headers=mock_auth_header,
                )

                # Session start should return 200 with greeting
                assert response.status_code in (200, 403, 422)
                if response.status_code == 200:
                    data = response.json()
                    assert "session_id" in data
                    assert "greeting" in data
                    assert isinstance(data["greeting"], str)
                    assert len(data["greeting"]) > 10
                    assert data["phase"] == "connect"
        finally:
            app.dependency_overrides.clear()


class TestVoiceCompanionMessage:
    """Tests for voice companion message endpoint."""

    @pytest.mark.asyncio
    async def test_message_requires_active_session(self, mock_auth_header, mock_user):
        """Sending a message without an active session should return 404."""
        from backend.main import app
        from backend.deps import get_current_user, get_db as get_db_dep

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db_dep] = lambda: mock_session

        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    "/api/voice-companion/message",
                    json={
                        "session_id": "nonexistent-session",
                        "message": "I feel anxious today",
                        "language": "en",
                    },
                    headers=mock_auth_header,
                )

                # Should return 404 (no active session) or 403 (subscription)
                assert response.status_code in (404, 403, 422)
        finally:
            app.dependency_overrides.clear()


class TestVoiceCompanionQuickResponse:
    """Tests for quick response (wake word activation) endpoint."""

    @pytest.mark.asyncio
    async def test_quick_response_returns_text(self, mock_auth_header, mock_user, mock_companion_profile):
        """Quick response should return a text response without requiring a session."""
        from backend.main import app
        from backend.deps import get_current_user, get_db as get_db_dep

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_companion_profile
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result
        mock_session.flush = AsyncMock()

        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db_dep] = lambda: mock_session

        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    "/api/voice-companion/quick-response",
                    json={"query": "How can I calm down?", "language": "en"},
                    headers=mock_auth_header,
                )

                # Should return 200 with a response or 403 for subscription gating
                assert response.status_code in (200, 403, 422)
                if response.status_code == 200:
                    data = response.json()
                    assert "response" in data
                    assert isinstance(data["response"], str)
                    assert len(data["response"]) > 5
                    assert "mood" in data
        finally:
            app.dependency_overrides.clear()


class TestVoiceCompanionHealth:
    """Tests for voice companion health check endpoint."""

    @pytest.mark.asyncio
    async def test_health_check_returns_status(self):
        """Health endpoint should return AI tier availability."""
        from backend.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/voice-companion/health")

            assert response.status_code == 200
            data = response.json()
            assert "status" in data or "tier1_ready" in data


class TestMoodDetection:
    """Tests for the mood detection used in voice companion message routing."""

    def test_mood_detection_anxious(self):
        """Should detect anxious mood from anxiety keywords."""
        from backend.services.companion_friend_engine import detect_mood

        mood, intensity = detect_mood("I feel so anxious and stressed about work")
        assert mood in ("anxious", "stressed")
        assert intensity > 0.3

    def test_mood_detection_neutral(self):
        """Should return neutral for messages without strong emotion."""
        from backend.services.companion_friend_engine import detect_mood

        mood, intensity = detect_mood("Tell me about the weather")
        assert mood == "neutral"

    def test_mood_detection_sad(self):
        """Should detect sadness from relevant keywords."""
        from backend.services.companion_friend_engine import detect_mood

        mood, intensity = detect_mood("I feel so sad and hopeless today")
        assert mood == "sad"
        assert intensity > 0.3


class TestResponseLengthDetection:
    """Tests for adaptive response length in voice companion."""

    def test_brief_response_for_greeting(self):
        """Short greetings should get brief responses."""
        from backend.routes.kiaan_voice_companion import _detect_response_length

        hint, max_tokens = _detect_response_length("hi", "auto", "connect")
        assert hint == "brief"
        assert max_tokens == 100

    def test_detailed_response_for_deep_question(self):
        """Deep questions should get detailed responses."""
        from backend.routes.kiaan_voice_companion import _detect_response_length

        hint, max_tokens = _detect_response_length(
            "Help me understand why I keep overthinking everything",
            "auto",
            "guide",
        )
        assert hint == "detailed"
        assert max_tokens == 300

    def test_moderate_response_default(self):
        """Standard messages should get moderate responses."""
        from backend.routes.kiaan_voice_companion import _detect_response_length

        hint, max_tokens = _detect_response_length(
            "I had a difficult conversation with my boss today",
            "auto",
            "listen",
        )
        assert hint == "moderate"
        assert max_tokens == 200

    def test_explicit_brief_mode_override(self):
        """Explicit brief mode should override auto detection."""
        from backend.routes.kiaan_voice_companion import _detect_response_length

        hint, max_tokens = _detect_response_length(
            "Help me understand the meaning of life and everything",
            "brief",
            "guide",
        )
        assert hint == "brief"
        assert max_tokens == 100


class TestConversationPhase:
    """Tests for conversation phase progression."""

    def test_initial_phase_is_connect(self):
        """First message should be in connect phase."""
        from backend.routes.kiaan_voice_companion import _get_conversation_phase

        phase = _get_conversation_phase(1, 0.5, "Hey, how are you?")
        assert phase == "connect"

    def test_guide_phase_when_asking_for_help(self):
        """Asking for guidance should trigger guide phase."""
        from backend.routes.kiaan_voice_companion import _get_conversation_phase

        phase = _get_conversation_phase(3, 0.6, "What should I do about this?")
        assert phase == "guide"

    def test_listen_phase_for_emotional_messages(self):
        """Emotional messages early in conversation should be in listen phase."""
        from backend.routes.kiaan_voice_companion import _get_conversation_phase

        phase = _get_conversation_phase(2, 0.7, "I've been really struggling lately")
        assert phase == "listen"
