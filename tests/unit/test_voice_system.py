"""
Tests for Voice System - Provider Chain, Circuit Breaker, and Language Routing

Validates:
- TTS provider circuit breaker opens/closes correctly
- Sarvam AI language routing includes Indian English (en/en-IN)
- Provider fallback chain processes in correct order
- Voice persona mappings resolve to valid providers
- Emotion-adaptive prosody generates valid parameters
"""

import time
from unittest.mock import patch

import pytest


class TestProviderCircuitBreaker:
    """Tests for the TTS provider circuit breaker in companion_voice_service."""

    def setup_method(self):
        """Reset circuit breaker state before each test."""
        from backend.services.companion_voice_service import (
            _PROVIDER_DISABLED_UNTIL,
            _PROVIDER_FAILURE_COUNTS,
            _PROVIDER_LAST_SUCCESS,
        )
        _PROVIDER_FAILURE_COUNTS.clear()
        _PROVIDER_DISABLED_UNTIL.clear()
        _PROVIDER_LAST_SUCCESS.clear()

    def test_provider_starts_healthy(self):
        """All providers should be healthy with no prior failures."""
        from backend.services.companion_voice_service import _provider_is_healthy
        assert _provider_is_healthy("elevenlabs") is True
        assert _provider_is_healthy("sarvam") is True
        assert _provider_is_healthy("bhashini") is True

    def test_single_failure_does_not_trip_breaker(self):
        """A single failure should not disable the provider."""
        from backend.services.companion_voice_service import (
            _provider_is_healthy,
            _record_provider_failure,
        )
        _record_provider_failure("elevenlabs")
        assert _provider_is_healthy("elevenlabs") is True

    def test_threshold_failures_trips_breaker(self):
        """Reaching the failure threshold should disable the provider."""
        from backend.services.companion_voice_service import (
            _PROVIDER_FAILURE_THRESHOLD,
            _provider_is_healthy,
            _record_provider_failure,
        )
        for _ in range(_PROVIDER_FAILURE_THRESHOLD):
            _record_provider_failure("sarvam")
        assert _provider_is_healthy("sarvam") is False

    def test_success_resets_failure_count(self):
        """A successful call should reset the failure counter."""
        from backend.services.companion_voice_service import (
            _PROVIDER_FAILURE_COUNTS,
            _PROVIDER_FAILURE_THRESHOLD,
            _provider_is_healthy,
            _record_provider_failure,
            _record_provider_success,
        )
        # Record failures just below threshold
        for _ in range(_PROVIDER_FAILURE_THRESHOLD - 1):
            _record_provider_failure("bhashini")
        assert _PROVIDER_FAILURE_COUNTS["bhashini"] == _PROVIDER_FAILURE_THRESHOLD - 1

        # Success resets
        _record_provider_success("bhashini")
        assert _PROVIDER_FAILURE_COUNTS["bhashini"] == 0
        assert _provider_is_healthy("bhashini") is True

    def test_breaker_recovers_after_cooldown(self):
        """Provider should become healthy again after cooldown expires."""
        from backend.services.companion_voice_service import (
            _PROVIDER_DISABLED_UNTIL,
            _PROVIDER_FAILURE_THRESHOLD,
            _provider_is_healthy,
            _record_provider_failure,
        )
        for _ in range(_PROVIDER_FAILURE_THRESHOLD):
            _record_provider_failure("elevenlabs")
        assert _provider_is_healthy("elevenlabs") is False

        # Simulate cooldown expiry by setting disabled_until to the past
        _PROVIDER_DISABLED_UNTIL["elevenlabs"] = time.monotonic() - 1
        assert _provider_is_healthy("elevenlabs") is True

    def test_health_status_returns_all_providers(self):
        """get_provider_health_status should return info for all 3 providers."""
        from backend.services.companion_voice_service import get_provider_health_status
        status = get_provider_health_status()
        assert "elevenlabs" in status
        assert "sarvam" in status
        assert "bhashini" in status
        for provider_status in status.values():
            assert "healthy" in provider_status
            assert "consecutive_failures" in provider_status


class TestSarvamLanguageRouting:
    """Tests for Sarvam AI language routing and priority."""

    def test_indian_english_is_sarvam_priority(self):
        """'en-IN' should be a Sarvam priority language."""
        from backend.services.sarvam_tts_service import is_sarvam_priority_language
        assert is_sarvam_priority_language("en-IN") is True

    def test_plain_english_is_sarvam_priority(self):
        """'en' should also be a Sarvam priority language (frontend normalizes en-IN to en)."""
        from backend.services.sarvam_tts_service import is_sarvam_priority_language
        assert is_sarvam_priority_language("en") is True

    def test_hindi_is_sarvam_priority(self):
        """Hindi should be a Sarvam priority language."""
        from backend.services.sarvam_tts_service import is_sarvam_priority_language
        assert is_sarvam_priority_language("hi") is True

    def test_french_is_not_sarvam_priority(self):
        """French should NOT be a Sarvam priority language."""
        from backend.services.sarvam_tts_service import is_sarvam_priority_language
        assert is_sarvam_priority_language("fr") is False

    def test_spanish_is_not_sarvam_priority(self):
        """Spanish should NOT be a Sarvam priority language."""
        from backend.services.sarvam_tts_service import is_sarvam_priority_language
        assert is_sarvam_priority_language("es") is False

    def test_en_maps_to_en_IN_for_sarvam(self):
        """'en' should map to 'en-IN' for Sarvam API calls."""
        from backend.services.sarvam_tts_service import get_sarvam_language_code
        assert get_sarvam_language_code("en") == "en-IN"

    def test_en_IN_maps_to_en_IN_for_sarvam(self):
        """'en-IN' should map to 'en-IN' for Sarvam API calls."""
        from backend.services.sarvam_tts_service import get_sarvam_language_code
        assert get_sarvam_language_code("en-IN") == "en-IN"

    def test_sanskrit_maps_to_hindi_for_sarvam(self):
        """Sanskrit should map to Hindi for Sarvam (closest available voice)."""
        from backend.services.sarvam_tts_service import get_sarvam_language_code
        assert get_sarvam_language_code("sa") == "hi-IN"

    def test_unsupported_language_returns_none(self):
        """Unsupported languages should return None."""
        from backend.services.sarvam_tts_service import get_sarvam_language_code
        assert get_sarvam_language_code("fr") is None
        assert get_sarvam_language_code("es") is None
        assert get_sarvam_language_code("zh") is None

    def test_all_indian_languages_have_sarvam_mapping(self):
        """All 11 Indian languages should map to valid Sarvam codes."""
        from backend.services.sarvam_tts_service import get_sarvam_language_code
        indian_langs = ["hi", "ta", "te", "bn", "kn", "ml", "mr", "gu", "pa", "sa", "en-IN"]
        for lang in indian_langs:
            code = get_sarvam_language_code(lang)
            assert code is not None, f"Language '{lang}' should have a Sarvam mapping"
            assert code.endswith("-IN"), f"Sarvam code for '{lang}' should end with -IN"


class TestSarvamSpeakerMapping:
    """Tests for companion voice → Sarvam speaker resolution."""

    def test_sarvam_aura_maps_to_meera(self):
        """sarvam-aura should map to Meera speaker."""
        from backend.services.sarvam_tts_service import get_sarvam_speaker_for_companion
        assert get_sarvam_speaker_for_companion("sarvam-aura") == "meera"

    def test_sarvam_rishi_maps_to_arvind(self):
        """sarvam-rishi should map to Arvind speaker."""
        from backend.services.sarvam_tts_service import get_sarvam_speaker_for_companion
        assert get_sarvam_speaker_for_companion("sarvam-rishi") == "arvind"

    def test_divine_krishna_maps_to_arvind(self):
        """divine-krishna should fall back to Arvind for Indian languages."""
        from backend.services.sarvam_tts_service import get_sarvam_speaker_for_companion
        assert get_sarvam_speaker_for_companion("divine-krishna") == "arvind"

    def test_divine_ganga_maps_to_meera(self):
        """divine-ganga should fall back to Meera for Indian languages."""
        from backend.services.sarvam_tts_service import get_sarvam_speaker_for_companion
        assert get_sarvam_speaker_for_companion("divine-ganga") == "meera"

    def test_unknown_voice_defaults_to_meera(self):
        """Unknown voice IDs should default to Meera (warm, safe fallback)."""
        from backend.services.sarvam_tts_service import get_sarvam_speaker_for_companion
        assert get_sarvam_speaker_for_companion("unknown-voice") == "meera"

    def test_speaker_language_coverage(self):
        """Each Sarvam speaker should support at least Hindi and Indian English."""
        from backend.services.sarvam_tts_service import SARVAM_SPEAKERS
        for sid, speaker in SARVAM_SPEAKERS.items():
            langs = speaker["languages"]
            assert "hi-IN" in langs, f"Speaker '{sid}' must support Hindi"
            assert "en-IN" in langs, f"Speaker '{sid}' must support Indian English"


class TestSarvamEmotionProfiles:
    """Tests for Sarvam emotion-adaptive prosody."""

    def test_neutral_profile_is_balanced(self):
        """Neutral emotion should produce balanced prosody."""
        from backend.services.sarvam_tts_service import get_sarvam_emotion_profile
        profile = get_sarvam_emotion_profile("neutral")
        assert profile["pace"] == 1.0
        assert profile["pitch"] == 0
        assert profile["loudness"] == 1.5

    def test_anxious_profile_is_slow_and_soft(self):
        """Anxious emotion should produce slow, soft prosody for grounding."""
        from backend.services.sarvam_tts_service import get_sarvam_emotion_profile
        profile = get_sarvam_emotion_profile("anxious")
        assert profile["pace"] < 0.9  # Slower than normal
        assert profile["loudness"] <= 1.0  # Soft

    def test_excited_profile_is_fast_and_bright(self):
        """Excited emotion should produce faster, brighter prosody."""
        from backend.services.sarvam_tts_service import get_sarvam_emotion_profile
        profile = get_sarvam_emotion_profile("excited")
        assert profile["pace"] >= 1.0  # Faster than normal
        assert profile["pitch"] > 0  # Higher pitch

    def test_unknown_mood_returns_neutral(self):
        """Unknown moods should return the neutral profile."""
        from backend.services.sarvam_tts_service import get_sarvam_emotion_profile
        profile = get_sarvam_emotion_profile("some_unknown_mood")
        assert profile == get_sarvam_emotion_profile("neutral")

    def test_all_standard_moods_have_profiles(self):
        """All standard moods from CompanionVoicePlayer should have profiles."""
        from backend.services.sarvam_tts_service import SARVAM_EMOTION_PROFILES
        standard_moods = [
            "anxious", "sad", "angry", "confused", "lonely", "hopeful",
            "peaceful", "grateful", "overwhelmed", "excited", "neutral",
        ]
        for mood in standard_moods:
            assert mood in SARVAM_EMOTION_PROFILES, f"Missing Sarvam profile for mood '{mood}'"

    def test_all_divine_moods_have_profiles(self):
        """All divine moods should have Sarvam profiles."""
        from backend.services.sarvam_tts_service import SARVAM_EMOTION_PROFILES
        divine_moods = [
            "devotional", "transcendent", "blissful", "sacred",
            "compassionate", "meditative",
        ]
        for mood in divine_moods:
            assert mood in SARVAM_EMOTION_PROFILES, f"Missing Sarvam profile for divine mood '{mood}'"


class TestVoiceCatalogConsistency:
    """Tests for consistency between frontend voice catalog and backend voice configs."""

    def test_all_backend_voices_have_ssml_builder(self):
        """Every voice in COMPANION_VOICES should produce valid SSML."""
        from backend.services.companion_voice_service import (
            COMPANION_VOICES,
            build_companion_ssml,
        )
        for voice_id in COMPANION_VOICES:
            result = build_companion_ssml(
                text="Test message for voice validation.",
                mood="neutral",
                voice_id=voice_id,
                language="en",
            )
            assert "ssml" in result, f"Voice '{voice_id}' failed to produce SSML"
            assert "voice_persona" in result, f"Voice '{voice_id}' missing voice_persona"
            assert result["voice_persona"], f"Voice '{voice_id}' has empty voice_persona"

    def test_divine_voices_have_sacred_properties(self):
        """Divine voices should have special sacred prosody properties."""
        from backend.services.companion_voice_service import COMPANION_VOICES
        divine_ids = [k for k in COMPANION_VOICES if k.startswith("divine-")]
        assert len(divine_ids) == 6, "Should have exactly 6 divine voice personas"

        for vid in divine_ids:
            voice = COMPANION_VOICES[vid]
            assert voice["style"] == "divine", f"Divine voice '{vid}' should have 'divine' style"
            assert voice["elevenlabs_voice_id"], f"Divine voice '{vid}' should have ElevenLabs ID"
            assert voice["sarvam_speaker"], f"Divine voice '{vid}' should have Sarvam fallback"

    def test_mood_to_voice_mapping_returns_valid_voices(self):
        """get_voice_for_mood should return voices that exist in the catalog."""
        from backend.services.companion_voice_service import (
            COMPANION_VOICES,
            get_voice_for_mood,
        )
        moods = [
            "anxious", "sad", "angry", "confused", "lonely", "hopeful",
            "peaceful", "grateful", "overwhelmed", "excited", "neutral",
        ]
        for mood in moods:
            voice_id = get_voice_for_mood(mood)
            assert voice_id in COMPANION_VOICES, (
                f"Mood '{mood}' maps to '{voice_id}' which is not in COMPANION_VOICES"
            )

    def test_divine_mood_to_voice_mapping(self):
        """Divine mood mapping should return divine voice IDs."""
        from backend.services.companion_voice_service import get_voice_for_mood
        divine_moods = ["devotional", "transcendent", "sacred", "meditative"]
        for mood in divine_moods:
            voice_id = get_voice_for_mood(mood, prefer_divine=True)
            assert voice_id.startswith("divine-"), (
                f"Divine mood '{mood}' should map to a divine voice, got '{voice_id}'"
            )


class TestSynthesisSSMLGeneration:
    """Tests for SSML generation with emotion-adaptive prosody."""

    def test_ssml_contains_speak_tags(self):
        """Generated SSML should be wrapped in <speak> tags."""
        from backend.services.companion_voice_service import build_companion_ssml
        result = build_companion_ssml("Hello friend.", "neutral", "sarvam-aura", "en")
        assert result["ssml"].startswith("<speak")
        assert result["ssml"].endswith("</speak>")

    def test_ssml_includes_prosody(self):
        """Generated SSML should include prosody adjustments."""
        from backend.services.companion_voice_service import build_companion_ssml
        result = build_companion_ssml(
            "I understand how you feel.",
            "anxious",
            "sarvam-aura",
            "en",
        )
        assert "<prosody" in result["ssml"]

    def test_ssml_speed_varies_by_mood(self):
        """Different moods should produce different speech speeds."""
        from backend.services.companion_voice_service import build_companion_ssml
        anxious_result = build_companion_ssml("Test.", "anxious", "sarvam-aura", "en")
        excited_result = build_companion_ssml("Test.", "excited", "sarvam-aura", "en")
        # Anxious should be slower than excited
        assert anxious_result["speed"] < excited_result["speed"]

    def test_divine_voice_ssml_is_slower(self):
        """Divine voices should have slower speed than regular voices."""
        from backend.services.companion_voice_service import build_companion_ssml
        regular = build_companion_ssml("Test.", "neutral", "sarvam-aura", "en")
        divine = build_companion_ssml("Test.", "neutral", "divine-krishna", "en")
        assert divine["speed"] <= regular["speed"]
