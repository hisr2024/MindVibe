"""
Unit Tests for KIAAN Voice Services

Tests cover:
- TTS Service with emotion-aware synthesis
- Voice Analytics Service
- Voice Settings persistence
- SSML generation and prosody
"""

import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid

# TTS Service Tests


class TestTTSService:
    """Tests for the TTS Service."""

    def test_natural_pauses_ssml_generation(self):
        """Test that natural pauses are correctly added to SSML."""
        from backend.services.tts_service import TTSService

        service = TTSService()

        # Test basic text with punctuation
        text = "Hello, world. How are you?"
        result = service._add_natural_pauses(text)

        assert "<speak>" in result
        assert "</speak>" in result
        assert '<break time="200ms"/>' in result  # Comma pause
        assert '<break time="450ms"/>' in result  # Period pause

    def test_ellipsis_dramatic_pause(self):
        """Test ellipsis creates longer dramatic pause."""
        from backend.services.tts_service import TTSService

        service = TTSService()

        text = "Let me think... about that."
        result = service._add_natural_pauses(text)

        assert '<break time="800ms"/>' in result

    def test_spiritual_term_emphasis(self):
        """Test spiritual terms get proper emphasis."""
        from backend.services.tts_service import TTSService

        service = TTSService()

        # Test with spiritual term
        text = "The concept of dharma is central to the Gita."
        ssml = service._add_natural_pauses(text)
        result = service._add_emphasis_to_spiritual_terms(ssml)

        assert '<emphasis level="moderate">dharma</emphasis>' in result.lower() or \
               '<emphasis level="moderate">Dharma</emphasis>' in result

    def test_emotion_detection_anxiety(self):
        """Test emotion detection for anxiety-related text."""
        from backend.services.tts_service import TTSService

        service = TTSService()

        text = "I'm feeling so anxious and worried about everything."
        emotion = service._detect_emotion_from_text(text)

        assert emotion == "anxiety"

    def test_emotion_detection_joy(self):
        """Test emotion detection for joy-related text."""
        from backend.services.tts_service import TTSService

        service = TTSService()

        text = "I'm so happy and grateful for everything in my life!"
        emotion = service._detect_emotion_from_text(text)

        assert emotion in ["joy", "gratitude"]

    def test_emotion_detection_peace(self):
        """Test emotion detection for peaceful text."""
        from backend.services.tts_service import TTSService

        service = TTSService()

        text = "I feel calm and peaceful today."
        emotion = service._detect_emotion_from_text(text)

        assert emotion == "peace"

    def test_emotion_detection_neutral(self):
        """Test emotion detection defaults to neutral."""
        from backend.services.tts_service import TTSService

        service = TTSService()

        text = "The weather is nice today."
        emotion = service._detect_emotion_from_text(text)

        assert emotion == "neutral"

    def test_emotion_prosody_application(self):
        """Test emotion prosody is correctly applied."""
        from backend.services.tts_service import TTSService

        service = TTSService()

        ssml = "<speak>Test text.</speak>"
        result = service._apply_emotion_prosody(ssml, "joy", 0.9, 0.0)

        assert "<prosody" in result
        assert "rate=" in result
        assert "pitch=" in result

    def test_cache_key_generation(self):
        """Test cache key is unique for different inputs."""
        from backend.services.tts_service import TTSService

        service = TTSService()

        key1 = service._generate_cache_key("Hello", "en", "friendly", 0.9)
        key2 = service._generate_cache_key("Hello", "en", "calm", 0.9)
        key3 = service._generate_cache_key("Hello", "hi", "friendly", 0.9)
        key4 = service._generate_cache_key("Goodbye", "en", "friendly", 0.9)

        assert key1 != key2  # Different voice type
        assert key1 != key3  # Different language
        assert key1 != key4  # Different text

    def test_voice_type_settings(self):
        """Test voice type settings are correct."""
        from backend.services.tts_service import VOICE_TYPE_SETTINGS

        assert "calm" in VOICE_TYPE_SETTINGS
        assert "wisdom" in VOICE_TYPE_SETTINGS
        assert "friendly" in VOICE_TYPE_SETTINGS

        # Calm should be slower
        assert VOICE_TYPE_SETTINGS["calm"]["speed"] < VOICE_TYPE_SETTINGS["friendly"]["speed"]

        # Calm should have lower pitch
        assert VOICE_TYPE_SETTINGS["calm"]["pitch"] < VOICE_TYPE_SETTINGS["friendly"]["pitch"]

    def test_supported_languages(self):
        """Test all 17 languages are supported."""
        from backend.services.tts_service import LANGUAGE_VOICE_MAP

        expected_languages = [
            "en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml",
            "pa", "sa", "es", "fr", "de", "pt", "ja", "zh"
        ]

        for lang in expected_languages:
            assert lang in LANGUAGE_VOICE_MAP, f"Language {lang} not supported"
            assert "calm" in LANGUAGE_VOICE_MAP[lang]
            assert "wisdom" in LANGUAGE_VOICE_MAP[lang]
            assert "friendly" in LANGUAGE_VOICE_MAP[lang]


class TestVoiceAnalyticsService:
    """Tests for Voice Analytics Service."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        db = AsyncMock()
        return db

    @pytest.mark.asyncio
    async def test_log_voice_conversation(self, mock_db):
        """Test logging a voice conversation."""
        from backend.services.voice_analytics_service import VoiceAnalyticsService

        service = VoiceAnalyticsService(mock_db)

        # Mock the commit and refresh
        mock_db.add = Mock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        conversation = await service.log_voice_conversation(
            user_id="test-user",
            session_id="test-session",
            user_query="How do I find peace?",
            kiaan_response="The Gita teaches us that peace comes from within.",
            detected_intent="seeking_peace",
            detected_emotion="anxiety",
            confidence_score=0.85,
            concern_category="stress",
            speech_to_text_ms=150,
            ai_processing_ms=200,
            text_to_speech_ms=100,
            language_used="en",
            voice_type_used="calm",
        )

        # Verify conversation was added
        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_calculate_total_latency(self, mock_db):
        """Test total latency calculation."""
        from backend.services.voice_analytics_service import VoiceAnalyticsService

        service = VoiceAnalyticsService(mock_db)
        mock_db.add = Mock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        conversation = await service.log_voice_conversation(
            user_id="test-user",
            session_id="test-session",
            user_query="Test",
            kiaan_response="Response",
            speech_to_text_ms=100,
            ai_processing_ms=200,
            text_to_speech_ms=150,
            language_used="en",
        )

        # Check the object passed to add
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.total_latency_ms == 450  # 100 + 200 + 150

    @pytest.mark.asyncio
    async def test_log_wake_word_event(self, mock_db):
        """Test logging wake word events."""
        from backend.services.voice_analytics_service import VoiceAnalyticsService

        service = VoiceAnalyticsService(mock_db)
        mock_db.add = Mock()
        mock_db.commit = AsyncMock()

        event = await service.log_wake_word_event(
            wake_word_detected="Hey KIAAN",
            user_id="test-user",
            detection_confidence=0.95,
            is_valid_activation=True,
            device_type="mobile",
        )

        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_start_enhancement_session(self, mock_db):
        """Test starting an enhancement session."""
        from backend.services.voice_analytics_service import VoiceAnalyticsService

        service = VoiceAnalyticsService(mock_db)
        mock_db.add = Mock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        session = await service.start_enhancement_session(
            user_id="test-user",
            session_type="binaural",
            enhancement_config={"frequency": "alpha"},
            binaural_frequency="alpha",
        )

        mock_db.add.assert_called_once()
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.session_type == "binaural"


class TestVoiceModels:
    """Tests for Voice SQLAlchemy Models."""

    def test_user_voice_preferences_defaults(self):
        """Test UserVoicePreferences has correct defaults."""
        from backend.models import UserVoicePreferences

        prefs = UserVoicePreferences(user_id="test-user")

        assert prefs.voice_enabled == True
        assert prefs.auto_play_enabled == False
        assert prefs.wake_word_enabled == True
        assert prefs.preferred_voice_gender == "female"
        assert prefs.preferred_voice_type == "friendly"
        assert float(prefs.speaking_rate) == 0.90
        assert prefs.preferred_language == "en"
        assert prefs.audio_quality == "high"
        assert prefs.offline_enabled == False
        assert prefs.binaural_beats_enabled == False
        assert prefs.haptic_feedback == True

    def test_voice_conversation_creation(self):
        """Test VoiceConversation can be created."""
        from backend.models import VoiceConversation

        conv = VoiceConversation(
            id="test-id",
            user_id="test-user",
            session_id="test-session",
            user_query="Hello",
            kiaan_response="Namaste",
            language_used="en",
        )

        assert conv.user_query == "Hello"
        assert conv.kiaan_response == "Namaste"
        assert conv.language_used == "en"

    def test_voice_analytics_defaults(self):
        """Test VoiceAnalytics has correct defaults."""
        from backend.models import VoiceAnalytics

        analytics = VoiceAnalytics(analytics_date=date.today())

        assert analytics.total_voice_sessions == 0
        assert analytics.total_voice_queries == 0
        assert analytics.unique_voice_users == 0
        assert analytics.error_count == 0
        assert analytics.tts_characters_synthesized == 0

    def test_voice_enhancement_session_types(self):
        """Test VoiceEnhancementSession types."""
        from backend.models import VoiceEnhancementSession

        valid_types = ["binaural", "spatial", "breathing", "ambient", "sleep", "meditation"]

        for session_type in valid_types:
            session = VoiceEnhancementSession(
                id=str(uuid.uuid4()),
                user_id="test-user",
                session_type=session_type,
                enhancement_config={},
            )
            assert session.session_type == session_type


class TestEmotionProsodyMapping:
    """Tests for emotion-to-prosody mapping."""

    def test_all_emotions_have_prosody(self):
        """Test all emotions have prosody settings."""
        from backend.services.tts_service import EMOTION_PROSODY_MAP

        required_emotions = [
            "joy", "sadness", "anxiety", "peace", "gratitude",
            "anger", "fear", "hope", "love", "neutral"
        ]

        for emotion in required_emotions:
            assert emotion in EMOTION_PROSODY_MAP
            assert "rate" in EMOTION_PROSODY_MAP[emotion]
            assert "pitch" in EMOTION_PROSODY_MAP[emotion]
            assert "volume" in EMOTION_PROSODY_MAP[emotion]

    def test_anxiety_prosody_is_calming(self):
        """Test anxiety prosody settings are calming."""
        from backend.services.tts_service import EMOTION_PROSODY_MAP

        anxiety = EMOTION_PROSODY_MAP["anxiety"]

        # Anxiety response should be slower and softer
        assert anxiety["rate"] < 1.0
        assert anxiety["volume"] == "soft"

    def test_peace_prosody_is_serene(self):
        """Test peace prosody settings are serene."""
        from backend.services.tts_service import EMOTION_PROSODY_MAP

        peace = EMOTION_PROSODY_MAP["peace"]

        # Peace should be slow and soft
        assert peace["rate"] < 0.9
        assert peace["volume"] == "soft"


class TestSpiritualTerms:
    """Tests for spiritual term handling."""

    def test_all_spiritual_terms_present(self):
        """Test important spiritual terms are in the list."""
        from backend.services.tts_service import SPIRITUAL_TERMS

        essential_terms = [
            "dharma", "karma", "yoga", "krishna", "arjuna",
            "gita", "om", "namaste", "meditation", "wisdom"
        ]

        for term in essential_terms:
            assert term in SPIRITUAL_TERMS, f"Essential term '{term}' missing"

    def test_no_duplicate_terms(self):
        """Test no duplicate spiritual terms."""
        from backend.services.tts_service import SPIRITUAL_TERMS

        assert len(SPIRITUAL_TERMS) == len(set(SPIRITUAL_TERMS))


class TestPausePatterns:
    """Tests for pause pattern regex."""

    def test_pause_patterns_valid_regex(self):
        """Test all pause patterns are valid regex."""
        import re
        from backend.services.tts_service import PAUSE_PATTERNS

        for pattern in PAUSE_PATTERNS.keys():
            try:
                re.compile(pattern)
            except re.error as e:
                pytest.fail(f"Invalid regex pattern: {pattern} - {e}")

    def test_pause_durations_reasonable(self):
        """Test pause durations are reasonable."""
        from backend.services.tts_service import PAUSE_PATTERNS

        for pattern, replacement in PAUSE_PATTERNS.items():
            # Extract duration from break tag
            if 'time="' in replacement:
                duration_str = replacement.split('time="')[1].split('"')[0]
                # Convert to ms
                if 'ms' in duration_str:
                    duration = int(duration_str.replace('ms', ''))
                elif 's' in duration_str:
                    duration = int(duration_str.replace('s', '')) * 1000

                # Verify duration is reasonable (50ms - 3000ms)
                assert 50 <= duration <= 3000, f"Unreasonable pause duration: {duration}ms"
