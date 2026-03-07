"""Tests for KIAAN Voice Provider Optimizations

Validates:
- Sarvam AI Bulbul v2 upgrade with v1 fallback
- ElevenLabs Flash v2.5 model selection
- Bhashini AI pipeline config caching
- Intelligent language-aware provider routing
- New voice personas and speaker mappings
- Provider health status integration
"""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import time


class TestSarvamV2Upgrade:
    """Tests for Sarvam AI Bulbul v2 model upgrade."""

    def test_default_model_is_v2(self):
        """Default Sarvam model should be bulbul:v2."""
        from backend.services.sarvam_tts_service import SARVAM_TTS_MODEL
        assert SARVAM_TTS_MODEL == "bulbul:v2"

    def test_fallback_model_is_v1(self):
        """Fallback Sarvam model should be bulbul:v1."""
        from backend.services.sarvam_tts_service import SARVAM_TTS_MODEL_FALLBACK
        assert SARVAM_TTS_MODEL_FALLBACK == "bulbul:v1"

    def test_new_speakers_anushka_exists(self):
        """New Anushka speaker should be in the catalog."""
        from backend.services.sarvam_tts_service import SARVAM_SPEAKERS
        assert "anushka" in SARVAM_SPEAKERS
        assert SARVAM_SPEAKERS["anushka"]["gender"] == "female"
        assert SARVAM_SPEAKERS["anushka"]["style"] == "expressive"

    def test_new_speakers_abhilash_exists(self):
        """New Abhilash speaker should be in the catalog."""
        from backend.services.sarvam_tts_service import SARVAM_SPEAKERS
        assert "abhilash" in SARVAM_SPEAKERS
        assert SARVAM_SPEAKERS["abhilash"]["gender"] == "male"
        assert SARVAM_SPEAKERS["abhilash"]["style"] == "authoritative"

    def test_v2_quality_scores_upgraded(self):
        """Quality scores should be bumped for v2."""
        from backend.services.sarvam_tts_service import SARVAM_SPEAKERS
        # Meera was 9.5 in v1, should be 9.7 in v2
        assert SARVAM_SPEAKERS["meera"]["quality_score"] >= 9.7
        assert SARVAM_SPEAKERS["pavithra"]["quality_score"] >= 9.7

    def test_all_speakers_have_required_fields(self):
        """Every speaker must have all required configuration fields."""
        from backend.services.sarvam_tts_service import SARVAM_SPEAKERS
        required_fields = [
            "name", "speaker_id", "gender", "style", "languages",
            "description", "best_for", "default_pace", "default_pitch",
            "default_loudness", "quality_score",
        ]
        for sid, speaker in SARVAM_SPEAKERS.items():
            for field in required_fields:
                assert field in speaker, f"Speaker {sid} missing field {field}"

    def test_divine_krishna_maps_to_abhilash(self):
        """divine-krishna should map to abhilash (scholarly voice) in v2."""
        from backend.services.sarvam_tts_service import COMPANION_TO_SARVAM_SPEAKER
        assert COMPANION_TO_SARVAM_SPEAKER["divine-krishna"] == "abhilash"

    def test_health_status_reflects_v2(self):
        """Health status should report both v2 and v1 models."""
        from backend.services.sarvam_tts_service import get_sarvam_health_status
        with patch.dict("os.environ", {"SARVAM_API_KEY": "test-key"}):
            status = get_sarvam_health_status()
            assert status["model"] == "bulbul:v2"
            assert status["model_fallback"] == "bulbul:v1"
            assert status["quality_score"] >= 9.7


class TestElevenLabsFlashMode:
    """Tests for ElevenLabs Flash v2.5 mode."""

    def test_flash_model_constant_exists(self):
        """Flash model constant should be defined."""
        from backend.services.elevenlabs_tts_service import ELEVENLABS_MODEL_FLASH
        assert ELEVENLABS_MODEL_FLASH == "eleven_flash_v2_5"

    def test_new_voice_nicole_exists(self):
        """Nicole voice should be in the catalog."""
        from backend.services.elevenlabs_tts_service import ELEVENLABS_VOICES
        assert "nicole" in ELEVENLABS_VOICES
        assert ELEVENLABS_VOICES["nicole"]["style"] == "soothing"
        assert ELEVENLABS_VOICES["nicole"]["quality_score"] >= 9.7

    def test_new_voice_george_exists(self):
        """George voice should be in the catalog."""
        from backend.services.elevenlabs_tts_service import ELEVENLABS_VOICES
        assert "george" in ELEVENLABS_VOICES
        assert ELEVENLABS_VOICES["george"]["style"] == "wise"

    def test_all_voices_have_voice_id(self):
        """Every ElevenLabs voice must have a voice_id."""
        from backend.services.elevenlabs_tts_service import ELEVENLABS_VOICES
        for vid, voice in ELEVENLABS_VOICES.items():
            assert voice.get("voice_id"), f"Voice {vid} missing voice_id"
            assert len(voice["voice_id"]) > 10, f"Voice {vid} has short voice_id"

    def test_all_voices_have_unique_voice_ids(self):
        """Every ElevenLabs voice must have a unique voice_id (no duplicates)."""
        from backend.services.elevenlabs_tts_service import ELEVENLABS_VOICES
        voice_ids = [v["voice_id"] for v in ELEVENLABS_VOICES.values()]
        assert len(voice_ids) == len(set(voice_ids)), (
            f"Duplicate voice_ids found: "
            f"{[vid for vid in voice_ids if voice_ids.count(vid) > 1]}"
        )

    def test_synthesis_text_assigned_before_model_selection(self):
        """synthesis_text must be assigned before it is used in model selection.

        Regression test: synthesis_text was previously referenced in
        len(synthesis_text) < 100 check BEFORE the assignment on the next line,
        causing NameError at runtime when use_turbo=False.
        """
        import inspect
        from backend.services.elevenlabs_tts_service import synthesize_elevenlabs_tts
        source = inspect.getsource(synthesize_elevenlabs_tts)
        # Find the positions of assignment and first usage
        assign_pos = source.find("synthesis_text = pronunciation_text or text")
        usage_pos = source.find("len(synthesis_text)")
        assert assign_pos > 0, "synthesis_text assignment not found"
        assert usage_pos > 0, "synthesis_text usage not found"
        assert assign_pos < usage_pos, (
            "CRITICAL: synthesis_text is used before assignment — "
            f"assignment at char {assign_pos}, usage at char {usage_pos}"
        )

    def test_health_status_includes_flash(self):
        """Health status should list flash model."""
        from backend.services.elevenlabs_tts_service import get_elevenlabs_health_status
        with patch.dict("os.environ", {"ELEVENLABS_API_KEY": "test-key"}):
            status = get_elevenlabs_health_status()
            assert "eleven_flash_v2_5" in status["models"]

    def test_voices_count_increased(self):
        """Voice catalog should have more voices after adding nicole and george."""
        from backend.services.elevenlabs_tts_service import ELEVENLABS_VOICES
        assert len(ELEVENLABS_VOICES) >= 12


class TestBhashiniPipelineCaching:
    """Tests for Bhashini AI pipeline config caching."""

    def test_cache_module_level_dict_exists(self):
        """Pipeline cache dict should exist at module level."""
        from backend.services.bhashini_tts_service import _PIPELINE_CACHE
        assert isinstance(_PIPELINE_CACHE, dict)

    def test_cache_ttl_is_reasonable(self):
        """Cache TTL should be 30 minutes (1800 seconds)."""
        from backend.services.bhashini_tts_service import _PIPELINE_CACHE_TTL_SECONDS
        assert _PIPELINE_CACHE_TTL_SECONDS == 1800

    def test_clear_cache_function_exists(self):
        """clear_bhashini_pipeline_cache function should exist."""
        from backend.services.bhashini_tts_service import clear_bhashini_pipeline_cache
        # Should not raise
        clear_bhashini_pipeline_cache()

    def test_supported_languages_includes_sanskrit(self):
        """Bhashini should support Sanskrit natively."""
        from backend.services.bhashini_tts_service import BHASHINI_SUPPORTED_LANGUAGES
        assert "sa" in BHASHINI_SUPPORTED_LANGUAGES

    def test_all_22_languages_in_mapping(self):
        """Bhashini should have mappings for major Indian languages."""
        from backend.services.bhashini_tts_service import MINDVIBE_TO_BHASHINI_LANG
        expected = ["hi", "ta", "te", "bn", "kn", "ml", "mr", "gu", "pa", "sa"]
        for lang in expected:
            assert lang in MINDVIBE_TO_BHASHINI_LANG, f"Missing Bhashini mapping for {lang}"


class TestIntelligentProviderRouting:
    """Tests for language-aware provider routing."""

    def test_hindi_routes_to_sarvam_first(self):
        """Hindi should prefer Sarvam AI."""
        from backend.services.companion_voice_service import LANGUAGE_PROVIDER_PRIORITY
        assert LANGUAGE_PROVIDER_PRIORITY["hi"][0] == "sarvam"

    def test_english_routes_to_elevenlabs_first(self):
        """English should prefer ElevenLabs."""
        from backend.services.companion_voice_service import LANGUAGE_PROVIDER_PRIORITY
        assert LANGUAGE_PROVIDER_PRIORITY["en"][0] == "elevenlabs"

    def test_tamil_routes_to_sarvam_first(self):
        """Tamil should prefer Sarvam AI."""
        from backend.services.companion_voice_service import LANGUAGE_PROVIDER_PRIORITY
        assert LANGUAGE_PROVIDER_PRIORITY["ta"][0] == "sarvam"

    def test_sanskrit_routes_to_sarvam_first(self):
        """Sanskrit should prefer Sarvam AI."""
        from backend.services.companion_voice_service import LANGUAGE_PROVIDER_PRIORITY
        assert LANGUAGE_PROVIDER_PRIORITY["sa"][0] == "sarvam"

    def test_odia_routes_to_bhashini_first(self):
        """Odia should prefer Bhashini (Government platform with best Odia support)."""
        from backend.services.companion_voice_service import LANGUAGE_PROVIDER_PRIORITY
        assert LANGUAGE_PROVIDER_PRIORITY["od"][0] == "bhashini"

    def test_spanish_routes_to_elevenlabs(self):
        """Spanish should prefer ElevenLabs."""
        from backend.services.companion_voice_service import LANGUAGE_PROVIDER_PRIORITY
        assert LANGUAGE_PROVIDER_PRIORITY["es"][0] == "elevenlabs"

    def test_indian_english_routes_to_sarvam(self):
        """Indian English should prefer Sarvam AI for authentic pronunciation."""
        from backend.services.companion_voice_service import LANGUAGE_PROVIDER_PRIORITY
        assert LANGUAGE_PROVIDER_PRIORITY["en-IN"][0] == "sarvam"

    def test_all_indian_languages_have_sarvam_or_bhashini_first(self):
        """All Indian languages should prefer Indian providers."""
        from backend.services.companion_voice_service import LANGUAGE_PROVIDER_PRIORITY
        indian_langs = ["hi", "ta", "te", "bn", "kn", "ml", "mr", "gu", "pa", "sa"]
        for lang in indian_langs:
            first = LANGUAGE_PROVIDER_PRIORITY[lang][0]
            assert first in ("sarvam", "bhashini"), (
                f"{lang} routes to {first} instead of sarvam/bhashini"
            )

    def test_get_optimal_provider_order_returns_list(self):
        """_get_optimal_provider_order should return a list of providers."""
        from backend.services.companion_voice_service import _get_optimal_provider_order
        order = _get_optimal_provider_order("hi")
        assert isinstance(order, list)
        assert len(order) > 0


class TestCompanionVoiceProviderMappings:
    """Tests for companion voice persona to provider mappings."""

    def test_sarvam_aura_maps_to_meera(self):
        """sarvam-aura should map to meera speaker."""
        from backend.services.sarvam_tts_service import get_sarvam_speaker_for_companion
        assert get_sarvam_speaker_for_companion("sarvam-aura") == "meera"

    def test_sarvam_rishi_maps_to_arvind(self):
        """sarvam-rishi should map to arvind speaker."""
        from backend.services.sarvam_tts_service import get_sarvam_speaker_for_companion
        assert get_sarvam_speaker_for_companion("sarvam-rishi") == "arvind"

    def test_elevenlabs_nova_maps_to_rachel(self):
        """elevenlabs-nova should map to Rachel voice."""
        from backend.services.elevenlabs_tts_service import get_elevenlabs_voice_for_persona
        voice = get_elevenlabs_voice_for_persona("elevenlabs-nova")
        assert voice["name"] == "Rachel"

    def test_divine_voices_have_both_mappings(self):
        """All divine voices should have both ElevenLabs and Sarvam mappings."""
        from backend.services.elevenlabs_tts_service import PERSONA_TO_ELEVENLABS
        from backend.services.sarvam_tts_service import COMPANION_TO_SARVAM_SPEAKER

        divine_voices = [
            "divine-krishna", "divine-saraswati", "divine-ganga",
            "divine-shiva", "divine-hanuman", "divine-radha",
        ]
        for voice in divine_voices:
            assert voice in PERSONA_TO_ELEVENLABS, f"{voice} missing ElevenLabs mapping"
            assert voice in COMPANION_TO_SARVAM_SPEAKER, f"{voice} missing Sarvam mapping"

    def test_legacy_persona_ids_still_work(self):
        """Legacy persona IDs should still map correctly for backward compatibility."""
        from backend.services.sarvam_tts_service import get_sarvam_speaker_for_companion
        assert get_sarvam_speaker_for_companion("priya") == "meera"
        assert get_sarvam_speaker_for_companion("arjun") == "arvind"
        assert get_sarvam_speaker_for_companion("maya") == "pavithra"

    def test_divine_krishna_sarvam_speaker_is_abhilash(self):
        """divine-krishna must map to abhilash (authoritative) not arvind.

        Regression test: frontend voiceCatalog.ts had sarvamSpeaker='arvind'
        while backend had 'abhilash', causing voice mismatch.
        """
        from backend.services.sarvam_tts_service import COMPANION_TO_SARVAM_SPEAKER
        assert COMPANION_TO_SARVAM_SPEAKER["divine-krishna"] == "abhilash"


class TestCircuitBreakerHealth:
    """Tests for provider circuit breaker and health monitoring."""

    def test_provider_health_status_structure(self):
        """Health status should have entries for all providers."""
        from backend.services.companion_voice_service import get_provider_health_status
        status = get_provider_health_status()
        assert "elevenlabs" in status
        assert "sarvam" in status
        assert "bhashini" in status

    def test_healthy_provider_returns_true(self):
        """A fresh provider should be healthy."""
        from backend.services.companion_voice_service import _provider_is_healthy
        assert _provider_is_healthy("elevenlabs") is True
        assert _provider_is_healthy("sarvam") is True
        assert _provider_is_healthy("bhashini") is True

    def test_record_success_resets_failures(self):
        """Recording a success should reset the failure counter."""
        from backend.services.companion_voice_service import (
            _record_provider_success,
            _record_provider_failure,
            _PROVIDER_FAILURE_COUNTS,
        )
        _record_provider_failure("test_provider")
        _record_provider_failure("test_provider")
        assert _PROVIDER_FAILURE_COUNTS.get("test_provider", 0) == 2
        _record_provider_success("test_provider")
        assert _PROVIDER_FAILURE_COUNTS.get("test_provider", 0) == 0


class TestVoiceCatalogFrontend:
    """Tests for frontend voice catalog consistency."""

    def test_voice_speakers_list_not_empty(self):
        """VOICE_SPEAKERS should not be empty."""
        # This is a structural test - we verify the catalog is importable
        # and has the expected divine voices
        from backend.services.companion_voice_service import COMPANION_VOICES
        assert len(COMPANION_VOICES) >= 12  # 6 regular + 6 divine

    def test_all_companion_voices_have_sarvam_speaker(self):
        """Every companion voice should have a sarvam_speaker field."""
        from backend.services.companion_voice_service import COMPANION_VOICES
        for vid, voice in COMPANION_VOICES.items():
            assert "sarvam_speaker" in voice, f"Voice {vid} missing sarvam_speaker"

    def test_all_companion_voices_have_description(self):
        """Every companion voice should have a description."""
        from backend.services.companion_voice_service import COMPANION_VOICES
        for vid, voice in COMPANION_VOICES.items():
            assert voice.get("description"), f"Voice {vid} missing description"
