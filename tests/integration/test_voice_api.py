"""
Integration Tests for KIAAN Voice API

Tests the complete voice API endpoints including:
- Voice settings CRUD
- Voice query processing
- Conversation history
- Enhancement sessions
- Wake word events
- Daily check-ins
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import date, datetime
import json

from tests.conftest import auth_headers_for


@pytest.fixture
def mock_auth_header():
    """Authentication header with a valid JWT token for test-user-123."""
    return auth_headers_for("test-user-123")


@pytest.fixture
def mock_user_id():
    """Mock user ID returned by auth dependency."""
    return "test-user-123"


class TestVoiceSettingsAPI:
    """Tests for voice settings endpoints."""

    @pytest.mark.asyncio
    async def test_get_default_voice_settings(self, mock_auth_header, mock_user_id):
        """Test getting default voice settings for new user."""
        from backend.main import app
        from backend.deps import get_current_user_flexible, get_db as get_db_dep

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        app.dependency_overrides[get_db_dep] = lambda: mock_session
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get(
                    "/api/voice/settings",
                    headers=mock_auth_header
                )

                # Should return 200 with default settings
                assert response.status_code == 200
                data = response.json()
                assert "settings" in data
                assert "supported_languages" in data
                assert data["settings"]["enabled"] == True
                assert data["settings"]["speed"] == 0.9
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_enhanced_voice_settings(self, mock_auth_header, mock_user_id):
        """Test getting enhanced voice settings."""
        from backend.main import app
        from backend.deps import get_current_user_flexible, get_db as get_db_dep

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        app.dependency_overrides[get_db_dep] = lambda: mock_session
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get(
                    "/api/voice/settings/enhanced",
                    headers=mock_auth_header
                )

                assert response.status_code == 200
                data = response.json()
                assert "settings" in data
                assert "voice_types" in data
                assert "audio_qualities" in data
                assert "binaural_frequencies" in data
                assert "ambient_sounds" in data
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_update_voice_settings(self, mock_auth_header, mock_user_id):
        """Test updating voice settings."""
        from backend.main import app
        from backend.deps import get_current_user_flexible, get_db as get_db_dep

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result
        mock_session.add = MagicMock()
        mock_session.commit = AsyncMock()

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        app.dependency_overrides[get_db_dep] = lambda: mock_session
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.put(
                    "/api/voice/settings",
                    headers=mock_auth_header,
                    json={
                        "enabled": True,
                        "auto_play": True,
                        "speed": 0.85,
                        "voice_gender": "male",
                        "offline_download": True,
                        "download_quality": "high"
                    }
                )

                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "success"
        finally:
            app.dependency_overrides.clear()


class TestVoiceQueryAPI:
    """Tests for voice query processing."""

    @pytest.mark.asyncio
    async def test_voice_query_request_validation(self, mock_auth_header, mock_user_id):
        """Test voice query request validation."""
        from backend.main import app
        from backend.deps import get_current_user_flexible

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                # Test empty query
                response = await client.post(
                    "/api/voice/query",
                    headers=mock_auth_header,
                    json={
                        "query": "",
                        "language": "en",
                        "history": []
                    }
                )

                # Should fail validation
                assert response.status_code == 422
        finally:
            app.dependency_overrides.pop(get_current_user_flexible, None)

    @pytest.mark.asyncio
    async def test_voice_query_too_long(self, mock_auth_header, mock_user_id):
        """Test voice query max length validation."""
        from backend.main import app
        from backend.deps import get_current_user_flexible

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                # Test query exceeding max length
                response = await client.post(
                    "/api/voice/query",
                    headers=mock_auth_header,
                    json={
                        "query": "x" * 2001,  # Exceeds 2000 char limit
                        "language": "en",
                        "history": []
                    }
                )

                assert response.status_code == 422
        finally:
            app.dependency_overrides.pop(get_current_user_flexible, None)

    @pytest.mark.asyncio
    async def test_enhanced_voice_query(self, mock_auth_header, mock_user_id):
        """Test enhanced voice query with analytics logging."""
        from backend.main import app
        from backend.deps import get_current_user_flexible

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                # Mock KIAAN Core and analytics service
                with patch("backend.routes.voice.get_db") as mock_db:
                    mock_session = AsyncMock()
                    mock_db.return_value = mock_session

                    with patch("backend.services.kiaan_core.KIAANCore") as mock_kiaan:
                        mock_kiaan_instance = MagicMock()
                        mock_kiaan_instance.get_kiaan_response = AsyncMock(return_value={
                            "response": "Test response from KIAAN",
                            "verses_used": [],
                            "context": "general",
                            "validation": {"valid": True}
                        })
                        mock_kiaan.return_value = mock_kiaan_instance

                        with patch("backend.services.voice_analytics_service.get_voice_analytics_service") as mock_analytics:
                            mock_analytics_instance = MagicMock()
                            mock_conversation = MagicMock()
                            mock_conversation.id = "test-conv-id"
                            mock_analytics_instance.log_voice_conversation = AsyncMock(return_value=mock_conversation)
                            mock_analytics.return_value = mock_analytics_instance

                            response = await client.post(
                                "/api/voice/query/enhanced",
                                headers=mock_auth_header,
                                json={
                                    "query": "How do I find peace?",
                                    "language": "en",
                                    "history": [],
                                    "session_id": "test-session"
                                }
                            )

                            assert response.status_code == 200
                            data = response.json()
                            assert "conversation_id" in data
                            assert "response" in data
                            assert "metrics" in data
        finally:
            app.dependency_overrides.pop(get_current_user_flexible, None)


class TestVoiceHistoryAPI:
    """Tests for conversation history endpoints."""

    @pytest.mark.asyncio
    async def test_get_voice_history(self, mock_auth_header, mock_user_id):
        """Test getting voice conversation history."""
        from backend.main import app
        from backend.deps import get_current_user_flexible

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                with patch("backend.routes.voice.get_db") as mock_db:
                    mock_session = AsyncMock()
                    mock_db.return_value = mock_session

                    with patch("backend.services.voice_analytics_service.get_voice_analytics_service") as mock_analytics:
                        mock_analytics_instance = MagicMock()
                        mock_analytics_instance.get_conversation_history = AsyncMock(return_value=[
                            {
                                "id": "conv-1",
                                "query": "Test query",
                                "response": "Test response",
                                "created_at": "2026-01-23T10:00:00"
                            }
                        ])
                        mock_analytics.return_value = mock_analytics_instance

                        response = await client.get(
                            "/api/voice/history?limit=50&offset=0",
                            headers=mock_auth_header
                        )

                        assert response.status_code == 200
                        data = response.json()
                        assert "conversations" in data
                        assert "count" in data
        finally:
            app.dependency_overrides.pop(get_current_user_flexible, None)

    @pytest.mark.asyncio
    async def test_submit_conversation_feedback(self, mock_auth_header, mock_user_id):
        """Test submitting feedback for a conversation."""
        from backend.main import app
        from backend.deps import get_current_user_flexible

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                with patch("backend.routes.voice.get_db") as mock_db:
                    mock_session = AsyncMock()
                    mock_db.return_value = mock_session

                    with patch("backend.services.voice_analytics_service.get_voice_analytics_service") as mock_analytics:
                        mock_analytics_instance = MagicMock()
                        mock_conversation = MagicMock()
                        mock_analytics_instance.update_conversation_feedback = AsyncMock(return_value=mock_conversation)
                        mock_analytics.return_value = mock_analytics_instance

                        response = await client.post(
                            "/api/voice/history/test-conv-id/feedback?rating=5&was_helpful=true",
                            headers=mock_auth_header
                        )

                        assert response.status_code == 200
                        data = response.json()
                        assert data["status"] == "success"
        finally:
            app.dependency_overrides.pop(get_current_user_flexible, None)


class TestVoiceEnhancementAPI:
    """Tests for voice enhancement session endpoints."""

    @pytest.mark.asyncio
    async def test_start_enhancement_session(self, mock_auth_header, mock_user_id):
        """Test starting an enhancement session."""
        from backend.main import app
        from backend.deps import get_current_user_flexible

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                with patch("backend.routes.voice.get_db") as mock_db:
                    mock_session = AsyncMock()
                    mock_db.return_value = mock_session

                    with patch("backend.services.voice_analytics_service.get_voice_analytics_service") as mock_analytics:
                        mock_analytics_instance = MagicMock()
                        mock_enhancement = MagicMock()
                        mock_enhancement.id = "session-123"
                        mock_enhancement.session_type = "binaural"
                        mock_enhancement.started_at = datetime.now()
                        mock_analytics_instance.start_enhancement_session = AsyncMock(return_value=mock_enhancement)
                        mock_analytics.return_value = mock_analytics_instance

                        response = await client.post(
                            "/api/voice/enhancement/start",
                            headers=mock_auth_header,
                            json={
                                "session_type": "binaural",
                                "config": {"frequency": "alpha"},
                                "binaural_frequency": "alpha"
                            }
                        )

                        assert response.status_code == 200
                        data = response.json()
                        assert "session_id" in data
                        assert data["session_type"] == "binaural"
        finally:
            app.dependency_overrides.pop(get_current_user_flexible, None)

    @pytest.mark.asyncio
    async def test_end_enhancement_session(self, mock_auth_header, mock_user_id):
        """Test ending an enhancement session."""
        from backend.main import app
        from backend.deps import get_current_user_flexible

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                with patch("backend.routes.voice.get_db") as mock_db:
                    mock_session = AsyncMock()
                    mock_db.return_value = mock_session

                    with patch("backend.services.voice_analytics_service.get_voice_analytics_service") as mock_analytics:
                        mock_analytics_instance = MagicMock()
                        mock_enhancement = MagicMock()
                        mock_enhancement.id = "session-123"
                        mock_enhancement.duration_seconds = 300
                        mock_enhancement.completed = True
                        mock_analytics_instance.end_enhancement_session = AsyncMock(return_value=mock_enhancement)
                        mock_analytics.return_value = mock_analytics_instance

                        response = await client.post(
                            "/api/voice/enhancement/session-123/end?duration_seconds=300&completed=true",
                            headers=mock_auth_header
                        )

                        assert response.status_code == 200
                        data = response.json()
                        assert data["status"] == "success"
                        assert data["duration_seconds"] == 300
        finally:
            app.dependency_overrides.pop(get_current_user_flexible, None)


class TestVoiceCheckinAPI:
    """Tests for daily check-in endpoints."""

    @pytest.mark.asyncio
    async def test_submit_daily_checkin(self, mock_auth_header, mock_user_id):
        """Test submitting a daily voice check-in."""
        from backend.main import app
        from backend.deps import get_current_user_flexible

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                with patch("backend.routes.voice.get_db") as mock_db:
                    mock_session = AsyncMock()
                    mock_db.return_value = mock_session

                    with patch("backend.services.voice_analytics_service.get_voice_analytics_service") as mock_analytics:
                        mock_analytics_instance = MagicMock()
                        mock_checkin = MagicMock()
                        mock_checkin.checkin_date = date.today()
                        mock_analytics_instance.log_daily_checkin = AsyncMock(return_value=mock_checkin)
                        mock_analytics.return_value = mock_analytics_instance

                        response = await client.post(
                            "/api/voice/checkin",
                            headers=mock_auth_header,
                            json={
                                "is_morning": True,
                                "mood": "peaceful",
                                "energy_level": 7,
                                "stress_level": 3
                            }
                        )

                        assert response.status_code == 200
                        data = response.json()
                        assert data["status"] == "success"
                        assert data["type"] == "morning"
        finally:
            app.dependency_overrides.pop(get_current_user_flexible, None)


class TestWakeWordAPI:
    """Tests for wake word event endpoints."""

    @pytest.mark.asyncio
    async def test_log_wake_word_event(self, mock_auth_header, mock_user_id):
        """Test logging a wake word event."""
        from backend.main import app
        from backend.deps import get_current_user_flexible

        app.dependency_overrides[get_current_user_flexible] = lambda: mock_user_id
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                with patch("backend.routes.voice.get_db") as mock_db:
                    mock_session = AsyncMock()
                    mock_db.return_value = mock_session

                    with patch("backend.services.voice_analytics_service.get_voice_analytics_service") as mock_analytics:
                        mock_analytics_instance = MagicMock()
                        mock_event = MagicMock()
                        mock_event.id = 1
                        mock_analytics_instance.log_wake_word_event = AsyncMock(return_value=mock_event)
                        mock_analytics.return_value = mock_analytics_instance

                        response = await client.post(
                            "/api/voice/wake-word/event",
                            headers=mock_auth_header,
                            json={
                                "wake_word_detected": "Hey KIAAN",
                                "detection_confidence": 0.95,
                                "is_valid_activation": True,
                                "device_type": "mobile"
                            }
                        )

                        assert response.status_code == 200
                        data = response.json()
                        assert data["status"] == "success"
        finally:
            app.dependency_overrides.pop(get_current_user_flexible, None)


class TestSupportedLanguagesAPI:
    """Tests for supported languages endpoint."""

    @pytest.mark.asyncio
    async def test_get_supported_languages(self, mock_auth_header):
        """Test getting list of supported languages."""
        from backend.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/voice/supported-languages",
                headers=mock_auth_header
            )

            assert response.status_code == 200
            data = response.json()
            assert "count" in data
            assert "languages" in data
            assert data["count"] >= 17  # At least 17 supported languages

            # Check essential languages are present
            language_codes = [lang["code"] for lang in data["languages"]]
            assert "en" in language_codes
            assert "hi" in language_codes
            assert "ta" in language_codes


class TestTranscribeAPIContract:
    """Tests for the /api/kiaan/transcribe endpoint contract.

    Verifies that the endpoint accepts both multipart/form-data (audio file)
    and application/json (base64-encoded audio) payloads.
    """

    @pytest.mark.asyncio
    async def test_transcribe_json_base64_audio_field(self, mock_auth_header, mock_user_id):
        """JSON body with 'audio' field (base64) should be accepted."""
        import base64
        from backend.main import app
        from backend.deps import get_current_user

        app.dependency_overrides[get_current_user] = lambda: mock_user_id
        try:
            fake_audio_b64 = base64.b64encode(b"\x00" * 100).decode()
            with patch("backend.services.whisper_transcription.transcribe_audio", new_callable=AsyncMock) as mock_transcribe:
                mock_transcribe.return_value = {
                    "text": "Hello world",
                    "language": "en",
                    "confidence": 0.95,
                    "duration": 1.5,
                }
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    resp = await client.post(
                        "/api/kiaan/transcribe",
                        json={"audio": fake_audio_b64, "language": "en"},
                        headers=mock_auth_header,
                    )
                assert resp.status_code == 200
                data = resp.json()
                assert data["text"] == "Hello world"
                assert data["confidence"] == 0.95
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    @pytest.mark.asyncio
    async def test_transcribe_json_audio_base64_field(self, mock_auth_header, mock_user_id):
        """JSON body with 'audio_base64' field should also be accepted."""
        import base64
        from backend.main import app
        from backend.deps import get_current_user

        app.dependency_overrides[get_current_user] = lambda: mock_user_id
        try:
            fake_audio_b64 = base64.b64encode(b"\x00" * 100).decode()
            with patch("backend.services.whisper_transcription.transcribe_audio", new_callable=AsyncMock) as mock_transcribe:
                mock_transcribe.return_value = {
                    "text": "Namaste",
                    "language": "hi",
                    "confidence": 0.88,
                    "duration": 2.0,
                }
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    resp = await client.post(
                        "/api/kiaan/transcribe",
                        json={"audio_base64": fake_audio_b64, "language": "hi"},
                        headers=mock_auth_header,
                    )
                assert resp.status_code == 200
                data = resp.json()
                assert data["text"] == "Namaste"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    @pytest.mark.asyncio
    async def test_transcribe_multipart_upload(self, mock_auth_header, mock_user_id):
        """Multipart form-data with audio file should be accepted."""
        from backend.main import app
        from backend.deps import get_current_user

        app.dependency_overrides[get_current_user] = lambda: mock_user_id
        try:
            with patch("backend.services.whisper_transcription.transcribe_audio", new_callable=AsyncMock) as mock_transcribe:
                mock_transcribe.return_value = {
                    "text": "Om shanti",
                    "language": "sa",
                    "confidence": 0.75,
                    "duration": 3.0,
                    "is_sanskrit": True,
                }
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    resp = await client.post(
                        "/api/kiaan/transcribe",
                        files={"audio": ("test.webm", b"\x00" * 200, "audio/webm")},
                        data={"language": "sa"},
                        headers=mock_auth_header,
                    )
                assert resp.status_code == 200
                data = resp.json()
                assert data["text"] == "Om shanti"
                assert data["is_sanskrit"] is True
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    @pytest.mark.asyncio
    async def test_transcribe_json_missing_audio_returns_400(self, mock_auth_header, mock_user_id):
        """JSON body without audio field should return 400."""
        from backend.main import app
        from backend.deps import get_current_user

        app.dependency_overrides[get_current_user] = lambda: mock_user_id
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/api/kiaan/transcribe",
                    json={"language": "en"},
                    headers=mock_auth_header,
                )
            assert resp.status_code == 400
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    @pytest.mark.asyncio
    async def test_transcribe_multipart_empty_file_returns_400(self, mock_auth_header, mock_user_id):
        """Multipart upload with empty audio file should return 400."""
        from backend.main import app
        from backend.deps import get_current_user

        app.dependency_overrides[get_current_user] = lambda: mock_user_id
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/api/kiaan/transcribe",
                    files={"audio": ("empty.webm", b"", "audio/webm")},
                    data={"language": "en"},
                    headers=mock_auth_header,
                )
            assert resp.status_code == 400
        finally:
            app.dependency_overrides.pop(get_current_user, None)
