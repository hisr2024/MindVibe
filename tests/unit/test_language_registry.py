"""Tests for the unified language registry — single source of truth for 29 languages."""
import pytest

from backend.services.language_registry import (
    LANGUAGE_REGISTRY,
    normalize_language_code,
    get_language_name,
    get_supported_codes,
    is_indian_language,
    get_tts_provider_chain,
    validate_language,
    get_language_info,
    get_greeting,
)

ALL_CODES = {
    "en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "sa",
    "es", "fr", "de", "pt", "it", "nl", "pl", "sv", "ru",
    "ja", "zh", "ko", "th", "vi", "id", "ar", "tr", "sw",
}

INDIAN_CODES = {"hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "sa"}


class TestLanguageRegistry:
    def test_registry_has_29_languages(self):
        assert len(LANGUAGE_REGISTRY) == 29

    def test_all_expected_codes_present(self):
        assert set(LANGUAGE_REGISTRY.keys()) == ALL_CODES

    def test_every_language_has_name_and_native_name(self):
        for code, info in LANGUAGE_REGISTRY.items():
            assert info.name, f"{code} missing name"
            assert info.native_name, f"{code} missing native_name"

    def test_arabic_is_rtl(self):
        assert LANGUAGE_REGISTRY["ar"].direction == "rtl"

    def test_non_arabic_languages_are_ltr(self):
        for code, info in LANGUAGE_REGISTRY.items():
            if code != "ar":
                assert info.direction == "ltr", f"{code} should be ltr"

    def test_every_language_has_tts_providers(self):
        for code, info in LANGUAGE_REGISTRY.items():
            assert len(info.tts_providers) >= 1, f"{code} has no TTS providers"


class TestNormalizeLanguageCode:
    def test_passthrough_valid_codes(self):
        for code in ["en", "hi", "ja", "zh", "ar"]:
            assert normalize_language_code(code) == code

    def test_zh_cn_normalizes_to_zh(self):
        assert normalize_language_code("zh-CN") == "zh"
        assert normalize_language_code("zh-cn") == "zh"

    def test_en_in_normalizes_to_en(self):
        assert normalize_language_code("en-IN") == "en"
        assert normalize_language_code("en-US") == "en"

    def test_unknown_code_returns_as_is(self):
        assert normalize_language_code("xx") == "xx"


class TestGetLanguageName:
    def test_returns_name_for_valid_code(self):
        assert "Hindi" in get_language_name("hi")
        assert "English" in get_language_name("en")

    def test_returns_fallback_for_unknown(self):
        result = get_language_name("xx")
        assert isinstance(result, str)


class TestIsIndianLanguage:
    def test_indian_languages(self):
        for code in INDIAN_CODES:
            assert is_indian_language(code), f"{code} should be Indian"

    def test_non_indian_languages(self):
        for code in ["es", "fr", "ja", "zh", "ar", "sw", "en"]:
            assert not is_indian_language(code), f"{code} should not be Indian"


class TestGetTtsProviderChain:
    def test_indian_languages_have_sarvam(self):
        chain = get_tts_provider_chain("hi")
        assert "sarvam" in chain

    def test_all_languages_have_edge(self):
        for code in get_supported_codes():
            chain = get_tts_provider_chain(code)
            assert "edge" in chain, f"{code} missing edge TTS"


class TestValidateLanguage:
    def test_valid_language_does_not_raise(self):
        validate_language("en")

    def test_invalid_language_raises(self):
        with pytest.raises(ValueError):
            validate_language("xx")


class TestGetGreeting:
    def test_all_languages_have_greeting(self):
        for code in get_supported_codes():
            greeting = get_greeting(code)
            assert greeting and len(greeting) > 0, f"{code} missing greeting"


class TestGetLanguageInfo:
    def test_valid_code_returns_info(self):
        info = get_language_info("hi")
        assert info is not None
        assert info.code == "hi"
        assert info.name == "Hindi"

    def test_invalid_code_returns_none(self):
        info = get_language_info("xx")
        assert info is None


class TestGetSupportedCodes:
    def test_returns_29_codes(self):
        codes = get_supported_codes()
        assert len(codes) == 29

    def test_returns_all_expected_codes(self):
        codes = set(get_supported_codes())
        assert codes == ALL_CODES
