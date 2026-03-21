"""Unified Language Registry — Single Source of Truth

Every language-related decision in MindVibe flows through this module.
No other service should maintain its own SUPPORTED_LANGUAGES list.

Covers:
- 29 languages across Indian, European, Asian, Middle Eastern, African families
- Language code normalization (zh-CN → zh, en-IN → en, etc.)
- Human-readable language name lookup (for OpenAI prompt instructions)
- TTS provider routing (which provider is best for which language)
- Indian vs international language classification
- Language validation

Usage:
    from backend.services.language_registry import (
        normalize_language_code,
        get_language_name,
        get_supported_codes,
        is_indian_language,
        get_tts_provider_chain,
        validate_language,
        LANGUAGE_REGISTRY,
    )
"""

import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LanguageInfo:
    """Immutable descriptor for a supported language."""

    code: str
    name: str
    native_name: str
    direction: str = "ltr"  # "ltr" or "rtl"
    is_indian: bool = False
    sarvam_code: Optional[str] = None  # Sarvam AI language code (e.g. "hi-IN")
    stt_supported: bool = True  # Whisper supports almost all languages
    tts_providers: tuple[str, ...] = ("elevenlabs", "edge")
    intonation_profile: dict = field(default_factory=dict)


# ─── The Registry ────────────────────────────────────────────────────────────
# This is the SINGLE SOURCE OF TRUTH for all language support in MindVibe.

LANGUAGE_REGISTRY: dict[str, LanguageInfo] = {
    # ── Indian Languages (Sarvam AI primary) ─────────────────────────────
    "en": LanguageInfo(
        code="en", name="English", native_name="English",
        is_indian=False, sarvam_code="en-IN",
        tts_providers=("elevenlabs", "sarvam", "edge"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.4, "question_rise": 1.2, "emphasis_boost": 0.15},
    ),
    "hi": LanguageInfo(
        code="hi", name="Hindi", native_name="हिन्दी",
        is_indian=True, sarvam_code="hi-IN",
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.3, "question_rise": 1.0, "emphasis_boost": 0.18},
    ),
    "ta": LanguageInfo(
        code="ta", name="Tamil", native_name="தமிழ்",
        is_indian=True, sarvam_code="ta-IN",
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.4, "question_rise": 1.1, "emphasis_boost": 0.16},
    ),
    "te": LanguageInfo(
        code="te", name="Telugu", native_name="తెలుగు",
        is_indian=True, sarvam_code="te-IN",
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.4, "question_rise": 1.1, "emphasis_boost": 0.16},
    ),
    "bn": LanguageInfo(
        code="bn", name="Bengali", native_name="বাংলা",
        is_indian=True, sarvam_code="bn-IN",
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.3, "question_rise": 1.0, "emphasis_boost": 0.17},
    ),
    "mr": LanguageInfo(
        code="mr", name="Marathi", native_name="मराठी",
        is_indian=True, sarvam_code="mr-IN",
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.3, "question_rise": 1.0, "emphasis_boost": 0.17},
    ),
    "gu": LanguageInfo(
        code="gu", name="Gujarati", native_name="ગુજરાતી",
        is_indian=True, sarvam_code="gu-IN",
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.3, "question_rise": 1.0, "emphasis_boost": 0.17},
    ),
    "kn": LanguageInfo(
        code="kn", name="Kannada", native_name="ಕನ್ನಡ",
        is_indian=True, sarvam_code="kn-IN",
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.4, "question_rise": 1.1, "emphasis_boost": 0.16},
    ),
    "ml": LanguageInfo(
        code="ml", name="Malayalam", native_name="മലയാളം",
        is_indian=True, sarvam_code="ml-IN",
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.4, "question_rise": 1.1, "emphasis_boost": 0.16},
    ),
    "pa": LanguageInfo(
        code="pa", name="Punjabi", native_name="ਪੰਜਾਬੀ",
        is_indian=True, sarvam_code="pa-IN",
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.3, "question_rise": 1.0, "emphasis_boost": 0.17},
    ),
    "sa": LanguageInfo(
        code="sa", name="Sanskrit", native_name="संस्कृत",
        is_indian=True, sarvam_code="hi-IN",  # Sanskrit → Hindi voice (closest match)
        tts_providers=("sarvam", "edge", "elevenlabs"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.3, "question_rise": 0.8, "emphasis_boost": 0.22},
    ),
    # ── European Languages (ElevenLabs primary) ──────────────────────────
    "es": LanguageInfo(
        code="es", name="Spanish", native_name="Español",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.5, "sentence_fall": 0.4, "question_rise": 1.3, "emphasis_boost": 0.18},
    ),
    "fr": LanguageInfo(
        code="fr", name="French", native_name="Français",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.5, "question_rise": 1.4, "emphasis_boost": 0.16},
    ),
    "de": LanguageInfo(
        code="de", name="German", native_name="Deutsch",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.5, "question_rise": 1.1, "emphasis_boost": 0.14},
    ),
    "pt": LanguageInfo(
        code="pt", name="Portuguese", native_name="Português",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.5, "sentence_fall": 0.4, "question_rise": 1.2, "emphasis_boost": 0.18},
    ),
    "it": LanguageInfo(
        code="it", name="Italian", native_name="Italiano",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.6, "sentence_fall": 0.4, "question_rise": 1.4, "emphasis_boost": 0.20},
    ),
    "nl": LanguageInfo(
        code="nl", name="Dutch", native_name="Nederlands",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.5, "question_rise": 1.2, "emphasis_boost": 0.13},
    ),
    "pl": LanguageInfo(
        code="pl", name="Polish", native_name="Polski",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.5, "question_rise": 1.1, "emphasis_boost": 0.14},
    ),
    "sv": LanguageInfo(
        code="sv", name="Swedish", native_name="Svenska",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.5, "sentence_fall": 0.6, "question_rise": 1.3, "emphasis_boost": 0.12},
    ),
    "ru": LanguageInfo(
        code="ru", name="Russian", native_name="Русский",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.5, "question_rise": 1.0, "emphasis_boost": 0.14},
    ),
    # ── Asian Languages (ElevenLabs primary) ─────────────────────────────
    "ja": LanguageInfo(
        code="ja", name="Japanese", native_name="日本語",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.2, "sentence_fall": 0.4, "question_rise": 0.8, "emphasis_boost": 0.10},
    ),
    "zh": LanguageInfo(
        code="zh", name="Chinese (Simplified)", native_name="简体中文",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.2, "sentence_fall": 0.3, "question_rise": 0.6, "emphasis_boost": 0.08},
    ),
    "ko": LanguageInfo(
        code="ko", name="Korean", native_name="한국어",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.4, "question_rise": 0.9, "emphasis_boost": 0.12},
    ),
    "th": LanguageInfo(
        code="th", name="Thai", native_name="ภาษาไทย",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.2, "sentence_fall": 0.3, "question_rise": 0.6, "emphasis_boost": 0.10},
    ),
    "vi": LanguageInfo(
        code="vi", name="Vietnamese", native_name="Tiếng Việt",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.2, "sentence_fall": 0.3, "question_rise": 0.5, "emphasis_boost": 0.08},
    ),
    "id": LanguageInfo(
        code="id", name="Indonesian", native_name="Bahasa Indonesia",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.3, "sentence_fall": 0.4, "question_rise": 1.0, "emphasis_boost": 0.14},
    ),
    # ── Middle Eastern Languages ─────────────────────────────────────────
    "ar": LanguageInfo(
        code="ar", name="Arabic", native_name="العربية",
        direction="rtl",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.5, "question_rise": 1.1, "emphasis_boost": 0.16},
    ),
    "tr": LanguageInfo(
        code="tr", name="Turkish", native_name="Türkçe",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.4, "question_rise": 1.2, "emphasis_boost": 0.15},
    ),
    # ── African Languages ────────────────────────────────────────────────
    "sw": LanguageInfo(
        code="sw", name="Swahili", native_name="Kiswahili",
        tts_providers=("elevenlabs", "edge"),
        intonation_profile={"intonation_rise": 0.4, "sentence_fall": 0.4, "question_rise": 1.0, "emphasis_boost": 0.15},
    ),
}

# ─── Language Code Normalization Map ─────────────────────────────────────────
# Frontend, third-party APIs, and user agents send various formats.
# This map converts them all to our canonical codes.

_NORMALIZATION_MAP: dict[str, str] = {
    # Chinese variants → zh
    "zh-CN": "zh",
    "zh-cn": "zh",
    "zh-TW": "zh",
    "zh-tw": "zh",
    "zh-Hans": "zh",
    "zh-Hant": "zh",
    "cmn": "zh",
    # Indian English → en
    "en-IN": "en",
    "en-in": "en",
    "en-US": "en",
    "en-us": "en",
    "en-GB": "en",
    "en-gb": "en",
    # Regional Indian variants
    "hi-IN": "hi",
    "ta-IN": "ta",
    "te-IN": "te",
    "bn-IN": "bn",
    "mr-IN": "mr",
    "gu-IN": "gu",
    "kn-IN": "kn",
    "ml-IN": "ml",
    "pa-IN": "pa",
    # Odia variants
    "od": "od",
    "or": "od",
    "ory": "od",
    # Portuguese variants
    "pt-BR": "pt",
    "pt-PT": "pt",
    # Spanish variants
    "es-ES": "es",
    "es-MX": "es",
    "es-AR": "es",
    # French variants
    "fr-FR": "fr",
    "fr-CA": "fr",
    # Arabic variants
    "ar-SA": "ar",
    "ar-EG": "ar",
}


# ─── Multilingual Greetings ──────────────────────────────────────────────────
# Used by KIAAN Voice Companion when starting a session in the user's language.

LANGUAGE_GREETINGS: dict[str, str] = {
    "en": "Hey, how are you doing today?",
    "hi": "नमस्ते, आज आप कैसे हैं?",
    "ta": "வணக்கம், இன்று எப்படி இருக்கிறீர்கள்?",
    "te": "నమస్కారం, ఈ రోజు మీరు ఎలా ఉన్నారు?",
    "bn": "নমস্কার, আজ আপনি কেমন আছেন?",
    "mr": "नमस्कार, आज तुम्ही कसे आहात?",
    "gu": "નમસ્તે, આજે તમે કેમ છો?",
    "kn": "ನಮಸ್ಕಾರ, ಇಂದು ನೀವು ಹೇಗಿದ್ದೀರಿ?",
    "ml": "നമസ്കാരം, ഇന്ന് നിങ്ങൾ എങ്ങനെയുണ്ട്?",
    "pa": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?",
    "sa": "नमस्ते, अद्य भवान् कथम् अस्ति?",
    "es": "¡Hola! ¿Cómo estás hoy?",
    "fr": "Bonjour, comment allez-vous aujourd'hui?",
    "de": "Hallo, wie geht es dir heute?",
    "pt": "Olá, como você está hoje?",
    "it": "Ciao, come stai oggi?",
    "nl": "Hallo, hoe gaat het vandaag met je?",
    "pl": "Cześć, jak się dzisiaj czujesz?",
    "sv": "Hej, hur mår du idag?",
    "ru": "Привет, как у тебя дела сегодня?",
    "ja": "こんにちは、今日の調子はどうですか？",
    "zh": "你好，今天你怎么样？",
    "ko": "안녕하세요, 오늘 기분이 어떠세요?",
    "th": "สวัสดี วันนี้เป็นอย่างไรบ้าง?",
    "vi": "Xin chào, hôm nay bạn thế nào?",
    "id": "Halo, bagaimana kabarmu hari ini?",
    "ar": "مرحباً، كيف حالك اليوم؟",
    "tr": "Merhaba, bugün nasılsın?",
    "sw": "Habari, leo unajisikiaje?",
}


# ─── Public API ──────────────────────────────────────────────────────────────


def normalize_language_code(code: str) -> str:
    """Normalize a language code to its canonical form.

    Handles regional variants (zh-CN → zh), case variations,
    and alternate ISO codes (or → od).

    Args:
        code: Raw language code from frontend, URL param, or user preference.

    Returns:
        Canonical language code (e.g. "zh", "en", "hi").
        Returns the input unchanged if no normalization rule exists.
    """
    if not code:
        return "en"
    code_stripped = code.strip()
    # Direct lookup in normalization map
    if code_stripped in _NORMALIZATION_MAP:
        return _NORMALIZATION_MAP[code_stripped]
    # Already canonical
    if code_stripped in LANGUAGE_REGISTRY:
        return code_stripped
    # Try lowercase
    lower = code_stripped.lower()
    if lower in LANGUAGE_REGISTRY:
        return lower
    # Try prefix match (e.g. "en-AU" → "en")
    if "-" in lower:
        prefix = lower.split("-")[0]
        if prefix in LANGUAGE_REGISTRY:
            return prefix
    # Unknown — return as-is, caller should validate
    return code_stripped


def get_language_name(code: str, include_native: bool = False) -> str:
    """Get human-readable name for a language code.

    Used in OpenAI system prompts to instruct the model which language
    to respond in. Returns "English" as fallback for unknown codes.

    Args:
        code: Language code (will be normalized).
        include_native: If True, returns "Hindi (हिन्दी)" format.

    Returns:
        Human-readable language name.
    """
    normalized = normalize_language_code(code)
    info = LANGUAGE_REGISTRY.get(normalized)
    if not info:
        logger.warning(f"Unknown language code: {code!r}, falling back to English")
        return "English"
    if include_native and info.native_name != info.name:
        return f"{info.name} ({info.native_name})"
    return info.name


def get_supported_codes() -> list[str]:
    """Get all supported language codes (canonical form)."""
    return list(LANGUAGE_REGISTRY.keys())


def is_indian_language(code: str) -> bool:
    """Check if a language code corresponds to an Indian language.

    Used for TTS provider routing — Indian languages prefer Sarvam AI,
    international languages prefer ElevenLabs.
    """
    normalized = normalize_language_code(code)
    info = LANGUAGE_REGISTRY.get(normalized)
    return info.is_indian if info else False


def get_tts_provider_chain(code: str) -> list[str]:
    """Get the ordered list of TTS providers to try for a language.

    Returns providers in priority order — first provider is best quality
    for this language, subsequent ones are fallbacks.

    Args:
        code: Language code (will be normalized).

    Returns:
        List of provider names, e.g. ["sarvam", "edge", "elevenlabs"].
        Returns ["elevenlabs", "edge"] as fallback for unknown codes.
    """
    normalized = normalize_language_code(code)
    info = LANGUAGE_REGISTRY.get(normalized)
    if info:
        return list(info.tts_providers)
    return ["elevenlabs", "edge"]


def get_intonation_profile(code: str) -> dict:
    """Get language-specific intonation parameters for voice synthesis."""
    normalized = normalize_language_code(code)
    info = LANGUAGE_REGISTRY.get(normalized)
    if info and info.intonation_profile:
        return dict(info.intonation_profile)
    # Default neutral profile
    return {"intonation_rise": 0.3, "sentence_fall": 0.4, "question_rise": 1.0, "emphasis_boost": 0.14}


def get_greeting(code: str) -> str:
    """Get a native-language greeting for KIAAN Voice Companion."""
    normalized = normalize_language_code(code)
    return LANGUAGE_GREETINGS.get(normalized, LANGUAGE_GREETINGS["en"])


def get_sarvam_code(code: str) -> str | None:
    """Get the Sarvam AI language code for a MindVibe language code.

    Returns None if the language is not supported by Sarvam AI.
    """
    normalized = normalize_language_code(code)
    info = LANGUAGE_REGISTRY.get(normalized)
    return info.sarvam_code if info else None


def validate_language(code: str) -> str:
    """Validate and normalize a language code.

    Args:
        code: Raw language code.

    Returns:
        Normalized language code if valid.

    Raises:
        ValueError: If language is not supported.
    """
    normalized = normalize_language_code(code)
    if normalized not in LANGUAGE_REGISTRY:
        supported = ", ".join(sorted(LANGUAGE_REGISTRY.keys()))
        raise ValueError(
            f"Unsupported language: {code!r}. "
            f"Supported languages: {supported}"
        )
    return normalized


def get_language_info(code: str) -> LanguageInfo | None:
    """Get full language info for a code. Returns None if not supported."""
    normalized = normalize_language_code(code)
    return LANGUAGE_REGISTRY.get(normalized)
