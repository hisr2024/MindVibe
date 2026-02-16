"""Companion Premium Voice Service - Best Natural Human Voices

World-class voice synthesis for KIAAN best friend companion.
Uses only the best AI voice providers.

Voice Provider Chain (highest quality first):
┌──────────────────────────────────────────────────────────────┐
│  1. ElevenLabs (10/10) - Most human-like voices ever         │
│     → Requires ELEVENLABS_API_KEY                            │
│     → Dedicated service: elevenlabs_tts_service.py           │
│  2. Sarvam AI Bulbul (9.5/10) - Best Indian language voices  │
│     → Uses SARVAM_API_KEY, activated for Indian languages    │
│     → Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, etc. │
│  3. Bhashini AI (9/10) - Government of India, 22 languages   │
│     → Uses BHASHINI_USER_ID and BHASHINI_API_KEY             │
│     → Native pronunciation for all scheduled Indian langs    │
│  4. Browser SpeechSynthesis (5/10) - ultimate fallback       │
│                                                              │
│  Pronunciation Engine:                                       │
│  - Sanskrit/spiritual term IPA phoneme dictionary            │
│  - Language-specific pronunciation correction                │
│  - Verse pause pattern insertion                             │
│  - Provider-specific formatting (SSML, respelling, hints)    │
│                                                              │
│  Emotion-Adaptive Prosody:                                   │
│  - Speed/pitch modulation per detected mood                  │
│  - Natural pauses, breathing simulation via SSML             │
│  - Emphasis on emotional key words                           │
│  - Voice persona auto-selection by mood                      │
│  - Sarvam AI native Indian prosody for Indian languages      │
└──────────────────────────────────────────────────────────────┘
"""

import logging
import os
import re
from typing import Any

logger = logging.getLogger(__name__)

# Import pronunciation engine for correct Sanskrit/spiritual term handling
try:
    from backend.services.pronunciation_engine import (
        PronunciationEngine,
        correct_pronunciation,
    )
    PRONUNCIATION_ENGINE_AVAILABLE = True
except ImportError:
    PRONUNCIATION_ENGINE_AVAILABLE = False
    logger.debug("Pronunciation engine not available (optional)")

# Import dedicated ElevenLabs service for premium voice synthesis
try:
    from backend.services.elevenlabs_tts_service import (
        is_elevenlabs_available as _el_available,
        synthesize_elevenlabs_tts,
        get_elevenlabs_health_status,
    )
    ELEVENLABS_SERVICE_AVAILABLE = True
except ImportError:
    ELEVENLABS_SERVICE_AVAILABLE = False
    logger.debug("ElevenLabs dedicated service not available (optional)")

# Import Bhashini AI service for Indian language voice synthesis
try:
    from backend.services.bhashini_tts_service import (
        is_bhashini_available as _bh_available,
        synthesize_bhashini_tts,
        get_bhashini_health_status,
        is_bhashini_supported_language,
    )
    BHASHINI_SERVICE_AVAILABLE = True
except ImportError:
    BHASHINI_SERVICE_AVAILABLE = False
    logger.debug("Bhashini AI service not available (optional)")


# ─── Emotion-to-Prosody Mapping ──────────────────────────────────────────

EMOTION_VOICE_PROFILES: dict[str, dict[str, Any]] = {
    "anxious": {
        "rate": "slow",
        "rate_value": 0.85,
        "pitch": "-1.5st",
        "volume": "soft",
        "pause_multiplier": 1.4,
        "breathing": True,
        "warmth": "high",
        "description": "Slow, soft, grounding - like a warm blanket for anxiety",
    },
    "sad": {
        "rate": "slow",
        "rate_value": 0.88,
        "pitch": "-1.0st",
        "volume": "soft",
        "pause_multiplier": 1.3,
        "breathing": False,
        "warmth": "very_high",
        "description": "Gentle, warm, tender - sitting with you in the dark",
    },
    "angry": {
        "rate": "medium",
        "rate_value": 0.92,
        "pitch": "-2.0st",
        "volume": "medium",
        "pause_multiplier": 1.2,
        "breathing": False,
        "warmth": "medium",
        "description": "Measured, deep, steady - an anchor in the storm",
    },
    "confused": {
        "rate": "medium",
        "rate_value": 0.93,
        "pitch": "+0.5st",
        "volume": "medium",
        "pause_multiplier": 1.1,
        "breathing": False,
        "warmth": "medium",
        "description": "Clear, encouraging, patient - untangling with you",
    },
    "lonely": {
        "rate": "slow",
        "rate_value": 0.87,
        "pitch": "-0.5st",
        "volume": "soft",
        "pause_multiplier": 1.3,
        "breathing": False,
        "warmth": "very_high",
        "description": "Intimate, close, present - I'm right here",
    },
    "hopeful": {
        "rate": "medium",
        "rate_value": 0.97,
        "pitch": "+1.0st",
        "volume": "medium",
        "pause_multiplier": 1.0,
        "breathing": False,
        "warmth": "high",
        "description": "Bright, uplifting, energized - celebrating with you",
    },
    "peaceful": {
        "rate": "slow",
        "rate_value": 0.85,
        "pitch": "-0.5st",
        "volume": "soft",
        "pause_multiplier": 1.5,
        "breathing": True,
        "warmth": "very_high",
        "description": "Whisper-soft, serene, spacious - basking together",
    },
    "grateful": {
        "rate": "medium",
        "rate_value": 0.93,
        "pitch": "+0.5st",
        "volume": "medium",
        "pause_multiplier": 1.1,
        "breathing": False,
        "warmth": "high",
        "description": "Warm, genuine, heartfelt - sharing your joy",
    },
    "overwhelmed": {
        "rate": "x-slow",
        "rate_value": 0.82,
        "pitch": "-1.5st",
        "volume": "soft",
        "pause_multiplier": 1.6,
        "breathing": True,
        "warmth": "very_high",
        "description": "Ultra-slow, spacious, grounding - one breath at a time",
    },
    "excited": {
        "rate": "medium",
        "rate_value": 1.0,
        "pitch": "+1.5st",
        "volume": "medium",
        "pause_multiplier": 0.9,
        "breathing": False,
        "warmth": "high",
        "description": "Energetic, bright, matching your enthusiasm",
    },
    "neutral": {
        "rate": "medium",
        "rate_value": 0.93,
        "pitch": "+0st",
        "volume": "medium",
        "pause_multiplier": 1.0,
        "breathing": False,
        "warmth": "medium",
        "description": "Natural, conversational, warm default",
    },
    # ─── New mood profiles (Phase 1 mood expansion) ──────────────
    "hurt": {
        "rate": "slow",
        "rate_value": 0.86,
        "pitch": "-1.0st",
        "volume": "soft",
        "pause_multiplier": 1.4,
        "breathing": False,
        "warmth": "very_high",
        "description": "Tender, gentle, protective — wrapping you in care",
    },
    "jealous": {
        "rate": "medium",
        "rate_value": 0.90,
        "pitch": "-0.5st",
        "volume": "medium",
        "pause_multiplier": 1.1,
        "breathing": False,
        "warmth": "medium",
        "description": "Understanding, non-judgmental — sitting with the discomfort",
    },
    "guilty": {
        "rate": "slow",
        "rate_value": 0.88,
        "pitch": "-0.5st",
        "volume": "soft",
        "pause_multiplier": 1.3,
        "breathing": False,
        "warmth": "high",
        "description": "Compassionate, forgiving — guilt is heavy, let me help carry it",
    },
    "fearful": {
        "rate": "slow",
        "rate_value": 0.84,
        "pitch": "-1.5st",
        "volume": "soft",
        "pause_multiplier": 1.5,
        "breathing": True,
        "warmth": "very_high",
        "description": "Safe, grounding, steady — I am your anchor in the storm",
    },
    "frustrated": {
        "rate": "medium",
        "rate_value": 0.91,
        "pitch": "-1.0st",
        "volume": "medium",
        "pause_multiplier": 1.2,
        "breathing": False,
        "warmth": "medium",
        "description": "Patient, validating, steady — I hear you, this is real",
    },
    "stressed": {
        "rate": "x-slow",
        "rate_value": 0.83,
        "pitch": "-1.5st",
        "volume": "soft",
        "pause_multiplier": 1.5,
        "breathing": True,
        "warmth": "very_high",
        "description": "Ultra-calm, spacious, decompressing — let the pressure go",
    },
    # ─── Divine / Sacred emotion profiles ────────────────────────────
    "devotional": {
        "rate": "slow",
        "rate_value": 0.82,
        "pitch": "-2.0st",
        "volume": "soft",
        "pause_multiplier": 1.8,
        "breathing": True,
        "warmth": "very_high",
        "description": "Reverent, sacred, transcendent — the voice of the divine within",
    },
    "transcendent": {
        "rate": "x-slow",
        "rate_value": 0.78,
        "pitch": "-2.5st",
        "volume": "soft",
        "pause_multiplier": 2.0,
        "breathing": True,
        "warmth": "very_high",
        "description": "Ethereal, vast, limitless — beyond time and space",
    },
    "blissful": {
        "rate": "slow",
        "rate_value": 0.86,
        "pitch": "+0.5st",
        "volume": "medium",
        "pause_multiplier": 1.5,
        "breathing": True,
        "warmth": "very_high",
        "description": "Radiant, joyous, divine — the ecstasy of inner awakening",
    },
    "sacred": {
        "rate": "x-slow",
        "rate_value": 0.80,
        "pitch": "-3.0st",
        "volume": "soft",
        "pause_multiplier": 2.2,
        "breathing": True,
        "warmth": "very_high",
        "description": "Ancient, primordial, chanting — the sound of Om itself",
    },
    "compassionate": {
        "rate": "slow",
        "rate_value": 0.85,
        "pitch": "-0.5st",
        "volume": "soft",
        "pause_multiplier": 1.6,
        "breathing": True,
        "warmth": "very_high",
        "description": "Boundless karuna, divine mother energy — all-embracing love",
    },
    "meditative": {
        "rate": "x-slow",
        "rate_value": 0.76,
        "pitch": "-2.0st",
        "volume": "x-soft",
        "pause_multiplier": 2.5,
        "breathing": True,
        "warmth": "very_high",
        "description": "Deep stillness, dhyana — the silence between breaths",
    },
}


# ─── Voice Persona Profiles ──────────────────────────────────────────────
# Each persona maps to the BEST voice across all providers.

COMPANION_VOICES: dict[str, dict[str, Any]] = {
    "sarvam-aura": {
        "name": "Aura",
        "gender": "female",
        "style": "nurturing",
        "elevenlabs_voice_id": "EXAVITQu4vr4xnSDxMaL",  # Sarah
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "meera",
        "description": "Primary Sarvam AI companion voice tuned for emotionally warm Indian conversations.",
        "default_speed": 0.94,
        "default_pitch": 0.5,
        "warmth_boost": 0.1,
    },
    "sarvam-rishi": {
        "name": "Rishi",
        "gender": "male",
        "style": "sacred",
        "elevenlabs_voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "arvind",
        "description": "Grounded Sarvam AI narration voice for Sanskrit, Gita guidance, and deep reflective sessions.",
        "default_speed": 0.88,
        "default_pitch": -0.6,
        "warmth_boost": 0.06,
    },
    "elevenlabs-nova": {
        "name": "Nova",
        "gender": "female",
        "style": "conversational",
        "elevenlabs_voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "pavithra",
        "description": "Ultra-natural ElevenLabs-inspired global companion voice for fluent daily support.",
        "default_speed": 0.95,
        "default_pitch": 0.3,
        "warmth_boost": 0.05,
    },
    "elevenlabs-orion": {
        "name": "Orion",
        "gender": "male",
        "style": "narration",
        "elevenlabs_voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "arvind",
        "description": "Studio-grade ElevenLabs-inspired mentor voice for storytelling and high-clarity guidance.",
        "default_speed": 0.92,
        "default_pitch": -1.0,
        "warmth_boost": 0.08,
    },
    "bhashini-devi": {
        "name": "Devi",
        "gender": "female",
        "style": "warm",
        "elevenlabs_voice_id": None,
        "elevenlabs_model": None,
        "sarvam_speaker": None,
        "description": "Warm, nurturing voice from India's Bhashini AI platform. Authentic pronunciation across 22 Indian languages.",
        "default_speed": 0.93,
        "default_pitch": 0.3,
        "warmth_boost": 0.1,
    },
    "bhashini-arya": {
        "name": "Arya",
        "gender": "male",
        "style": "deep",
        "elevenlabs_voice_id": None,
        "elevenlabs_model": None,
        "sarvam_speaker": None,
        "description": "Deep, resonant male voice from Bhashini AI. Authority and wisdom with authentic Indian intonation.",
        "default_speed": 0.88,
        "default_pitch": -0.8,
        "warmth_boost": 0.06,
    },
    # ─── Divine Voice Personas ──────────────────────────────────────
    # Sacred voices tuned for maximum divine resonance
    "divine-krishna": {
        "name": "Krishna",
        "gender": "male",
        "style": "divine",
        "elevenlabs_voice_id": "2EiwWnXFnvU5JabPnv8n",  # Clyde (storyteller)
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "arvind",
        "description": "The divine flute-like voice of Lord Krishna — warm, playful, "
                       "infinitely wise. Speaks with the love of the universe.",
        "default_speed": 0.84,
        "default_pitch": -1.5,
        "warmth_boost": 0.15,
    },
    "divine-saraswati": {
        "name": "Saraswati",
        "gender": "female",
        "style": "divine",
        "elevenlabs_voice_id": "ThT5KcBeYPX3keUQqHPh",  # Dorothy (ethereal)
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "maitreyi",
        "description": "The celestial voice of Goddess Saraswati — crystalline, "
                       "flowing like sacred rivers, carrying ancient knowledge.",
        "default_speed": 0.82,
        "default_pitch": 0.8,
        "warmth_boost": 0.12,
    },
    "divine-ganga": {
        "name": "Ganga",
        "gender": "female",
        "style": "divine",
        "elevenlabs_voice_id": "EXAVITQu4vr4xnSDxMaL",  # Sarah (warm)
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "meera",
        "description": "The purifying voice of Mother Ganga — flowing, nurturing, "
                       "washing away sorrow with divine compassion.",
        "default_speed": 0.80,
        "default_pitch": 0.3,
        "warmth_boost": 0.18,
    },
    "divine-shiva": {
        "name": "Shiva",
        "gender": "male",
        "style": "divine",
        "elevenlabs_voice_id": "VR6AewLTigWG4xSOukaG",  # Arnold (commanding)
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "arvind",
        "description": "The cosmic voice of Lord Shiva — deep as the ocean, "
                       "resonant as Damru, the destroyer of inner darkness.",
        "default_speed": 0.78,
        "default_pitch": -3.0,
        "warmth_boost": 0.10,
    },
    "divine-hanuman": {
        "name": "Hanuman",
        "gender": "male",
        "style": "divine",
        "elevenlabs_voice_id": "TxGEqnHWrfWFTfGW9XjX",  # Josh (warm)
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "karthik",
        "description": "The devoted voice of Lord Hanuman — powerful yet humble, "
                       "filled with boundless courage and Ram bhakti.",
        "default_speed": 0.88,
        "default_pitch": -1.0,
        "warmth_boost": 0.14,
    },
    "divine-radha": {
        "name": "Radha",
        "gender": "female",
        "style": "divine",
        "elevenlabs_voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel (calm)
        "elevenlabs_model": "eleven_multilingual_v2",
        "sarvam_speaker": "pavithra",
        "description": "The divine beloved Radha — pure devotion embodied in voice, "
                       "tender as a lotus, deep as eternal love.",
        "default_speed": 0.83,
        "default_pitch": 0.5,
        "warmth_boost": 0.16,
    },
}


# ─── Natural Speech Patterns ────────────────────────────────────────────

NATURAL_PAUSE_PATTERNS = [
    (r"\.{3,}", '<break time="700ms"/>'),
    (r"\.\s+", '<break time="400ms"/> '),
    (r"\?\s+", '<break time="350ms"/> '),
    (r"!\s+", '<break time="300ms"/> '),
    (r",\s+", '<break time="180ms"/> '),
    (r"—", '<break time="250ms"/>'),
    (r"\s+-\s+", '<break time="200ms"/> '),
]

EMPHASIS_WORDS = {
    "you": "moderate",
    "really": "strong",
    "truly": "strong",
    "deeply": "strong",
    "always": "moderate",
    "never": "moderate",
    "friend": "moderate",
    "love": "strong",
    "strength": "strong",
    "courage": "moderate",
    "believe": "strong",
    "trust": "moderate",
    "beautiful": "moderate",
    "powerful": "strong",
    "together": "moderate",
}

BREATH_INSERTIONS = [
    (r"\b(You know what)\b", r'<break time="200ms"/>\1'),
    (r"\b(Here's the thing)\b", r'<break time="250ms"/>\1'),
    (r"\b(Listen)\b", r'<break time="200ms"/>\1'),
    (r"\b(And honestly)\b", r'<break time="200ms"/>\1'),
    (r"\b(But here's what)\b", r'<break time="250ms"/>\1'),
]

# Sacred emphasis words for divine voice personas
SACRED_EMPHASIS_WORDS = {
    "om": "strong",
    "shanti": "strong",
    "namaste": "moderate",
    "dharma": "strong",
    "karma": "strong",
    "atman": "strong",
    "brahman": "strong",
    "moksha": "strong",
    "bhakti": "strong",
    "prana": "moderate",
    "yoga": "moderate",
    "mantra": "moderate",
    "shakti": "strong",
    "guru": "moderate",
    "deva": "moderate",
    "divine": "strong",
    "sacred": "strong",
    "eternal": "strong",
    "infinite": "strong",
    "soul": "strong",
    "spirit": "moderate",
    "wisdom": "strong",
    "truth": "strong",
    "peace": "strong",
    "light": "moderate",
    "consciousness": "strong",
    "awakening": "strong",
    "liberation": "strong",
    "devotion": "strong",
    "surrender": "strong",
}

# Sacred pause patterns for divine speech (longer, more reverential)
SACRED_PAUSE_PATTERNS = [
    (r"\.{3,}", '<break time="1200ms"/>'),
    (r"\.\s+", '<break time="700ms"/> '),
    (r"\?\s+", '<break time="600ms"/> '),
    (r"!\s+", '<break time="500ms"/> '),
    (r",\s+", '<break time="300ms"/> '),
    (r"—", '<break time="500ms"/>'),
    (r"\s+-\s+", '<break time="400ms"/> '),
    # Sacred text markers
    (r"\|\|", '<break time="800ms"/>'),  # Verse boundary marker
    (r"॥", '<break time="800ms"/>'),     # Devanagari verse end
    (r"।", '<break time="500ms"/>'),     # Devanagari danda
]

# Sacred breath patterns for divine voice
SACRED_BREATH_INSERTIONS = [
    (r"\b(Om)\b", r'<break time="500ms"/>\1<break time="500ms"/>'),
    (r"\b(Shanti)\b", r'<break time="300ms"/>\1<break time="400ms"/>'),
    (r"\b(Namaste)\b", r'<break time="300ms"/>\1<break time="300ms"/>'),
    (r"\b(Hari Om)\b", r'<break time="400ms"/>\1<break time="500ms"/>'),
    (r"\b(Om Namah Shivaya)\b", r'<break time="500ms"/>\1<break time="600ms"/>'),
    (r"\b(Om Shanti)\b", r'<break time="500ms"/>\1<break time="600ms"/>'),
]




def _is_divine_voice(voice_id: str) -> bool:
    """Check if the voice persona is a divine/sacred voice."""
    return voice_id.startswith("divine-")


def build_companion_ssml(
    text: str,
    mood: str = "neutral",
    voice_id: str = "sarvam-aura",
    language: str = "en",
) -> dict[str, Any]:
    """Build SSML for companion voice synthesis with emotion-adaptive prosody.

    When a divine voice persona is selected, applies sacred pause patterns,
    mantric breathing, and reverential emphasis for a transcendent quality.
    """
    profile = EMOTION_VOICE_PROFILES.get(mood, EMOTION_VOICE_PROFILES["neutral"])
    voice = COMPANION_VOICES.get(voice_id, COMPANION_VOICES["sarvam-aura"])
    is_divine = _is_divine_voice(voice_id)

    speed = profile["rate_value"] * voice["default_speed"]
    pitch = float(profile["pitch"].replace("st", "")) + voice["default_pitch"]
    pause_mult = profile["pause_multiplier"]

    # Divine voices get extra warmth boost applied to speed (slower = warmer)
    if is_divine:
        warmth_boost = voice.get("warmth_boost", 0.1)
        speed = speed * (1.0 - warmth_boost)
        pause_mult = pause_mult * 1.3  # Longer sacred pauses

    ssml_text = _escape_ssml(text)

    # Select pause patterns based on voice type
    pause_patterns = SACRED_PAUSE_PATTERNS if is_divine else NATURAL_PAUSE_PATTERNS

    for pattern, replacement in pause_patterns:
        if "time=" in replacement:
            import re as re_mod

            def scale_pause(match: re_mod.Match) -> str:
                base_ms = int(re_mod.search(r'(\d+)ms', replacement).group(1))
                scaled_ms = int(base_ms * pause_mult)
                return replacement.replace(f'{base_ms}ms', f'{scaled_ms}ms')
            ssml_text = re.sub(pattern, scale_pause, ssml_text)
        else:
            ssml_text = re.sub(pattern, replacement, ssml_text)

    # Apply breath insertions (sacred for divine, natural for regular)
    breath_patterns = SACRED_BREATH_INSERTIONS if is_divine else BREATH_INSERTIONS
    for pattern, replacement in breath_patterns:
        ssml_text = re.sub(pattern, replacement, ssml_text, flags=re.IGNORECASE)

    # Apply emphasis words (sacred + regular for divine, regular only for others)
    emphasis_words = {**EMPHASIS_WORDS, **SACRED_EMPHASIS_WORDS} if is_divine else EMPHASIS_WORDS
    for word, level in emphasis_words.items():
        pattern = rf"\b({word})\b"
        replacement = f'<emphasis level="{level}">\\1</emphasis>'
        ssml_text = re.sub(pattern, replacement, ssml_text, flags=re.IGNORECASE, count=2)

    if profile.get("breathing"):
        breath_time = "1200ms" if is_divine else "800ms"
        ssml_text = ssml_text.replace(
            "\n\n",
            f'\n<break time="{breath_time}"/><mark name="breath"/>\n'
        )

    rate_pct = int((speed - 1.0) * 100)
    rate_str = f"{rate_pct:+d}%" if rate_pct != 0 else "0%"
    pitch_str = f"{pitch:+.1f}st"

    ssml = f"""<speak>
<prosody rate="{rate_str}" pitch="{pitch_str}" volume="{profile['volume']}">
{ssml_text}
</prosody>
</speak>"""

    return {
        "ssml": ssml,
        "elevenlabs_voice_id": voice.get("elevenlabs_voice_id"),
        "elevenlabs_model": voice.get("elevenlabs_model"),
        "sarvam_speaker": voice.get("sarvam_speaker"),
        "speed": speed,
        "pitch": pitch,
        "mood_profile": profile,
        "voice_persona": voice["name"],
        "voice_id": voice_id,
        "language": language,
        "gender": voice.get("gender", "female"),
        "is_divine": is_divine,
    }


def _escape_ssml(text: str) -> str:
    """Escape special XML characters for SSML."""
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    text = text.replace('"', "&quot;")
    text = text.replace("'", "&apos;")
    return text


async def synthesize_companion_voice(
    text: str,
    mood: str = "neutral",
    voice_id: str = "sarvam-aura",
    language: str = "en",
) -> dict[str, Any]:
    """Synthesize speech using the best available natural voice provider.

    Provider chain (tries in order, falls through on failure):
    1. ElevenLabs (dedicated service) - Most human-like voices
    2. Sarvam AI Bulbul - Best Indian language voices
    3. Bhashini AI - Government of India, 22 Indian languages
    4. Browser fallback - Returns config for frontend SpeechSynthesis

    Pronunciation Pipeline:
    - Sanskrit/spiritual terms receive IPA phoneme correction
    - Verse text gets natural pause markers
    - Provider-specific formatting applied
    """
    ssml_data = build_companion_ssml(text, mood, voice_id, language)
    plain_text = _strip_ssml_tags(ssml_data["ssml"])

    # Apply pronunciation corrections for accurate spiritual term pronunciation
    pronunciation_corrected_text = plain_text
    if PRONUNCIATION_ENGINE_AVAILABLE:
        try:
            engine = PronunciationEngine(language=language)
            pronunciation_corrected_text = engine.correct_text(
                plain_text, provider="generic"
            )
        except Exception as e:
            logger.warning(f"Pronunciation correction failed: {e}")
            pronunciation_corrected_text = plain_text

    # 1. Try ElevenLabs via dedicated service (most natural, most human-like)
    if ELEVENLABS_SERVICE_AVAILABLE and _el_available():
        try:
            el_pronunciation_text = plain_text
            if PRONUNCIATION_ENGINE_AVAILABLE:
                el_engine = PronunciationEngine(language=language)
                el_pronunciation_text = el_engine.correct_text(
                    plain_text, provider="elevenlabs"
                )

            audio = await synthesize_elevenlabs_tts(
                text=plain_text,
                language=language,
                voice_id=voice_id,
                mood=mood,
                pronunciation_text=el_pronunciation_text,
            )
            if audio:
                return {
                    "audio": audio,
                    "content_type": "audio/mpeg",
                    "ssml": ssml_data["ssml"],
                    "provider": "elevenlabs",
                    "voice_persona": ssml_data["voice_persona"],
                    "quality_score": 10.0,
                    "fallback_to_browser": False,
                }
        except Exception as e:
            logger.warning(f"ElevenLabs dedicated service failed: {e}")

    # 1b. Fallback: Try ElevenLabs via inline implementation
    audio = await _try_elevenlabs_tts(pronunciation_corrected_text, ssml_data)
    if audio:
        return {
            "audio": audio,
            "content_type": "audio/mpeg",
            "ssml": ssml_data["ssml"],
            "provider": "elevenlabs",
            "voice_persona": ssml_data["voice_persona"],
            "quality_score": 10.0,
            "fallback_to_browser": False,
        }

    # 2. Try Sarvam AI Bulbul (best Indian language voices)
    audio = await _try_sarvam_tts(plain_text, ssml_data, mood, voice_id)
    if audio:
        return {
            "audio": audio,
            "content_type": "audio/wav",
            "ssml": ssml_data["ssml"],
            "provider": "sarvam_ai_bulbul",
            "voice_persona": ssml_data["voice_persona"],
            "quality_score": 9.5,
            "fallback_to_browser": False,
        }

    # 3. Try Bhashini AI (Government of India, 22 Indian languages)
    audio = await _try_bhashini_tts(plain_text, ssml_data, mood, voice_id)
    if audio:
        return {
            "audio": audio,
            "content_type": "audio/wav",
            "ssml": ssml_data["ssml"],
            "provider": "bhashini_ai",
            "voice_persona": ssml_data["voice_persona"],
            "quality_score": 9.0,
            "fallback_to_browser": False,
        }

    # 4. Return config for browser-side synthesis
    return {
        "audio": None,
        "content_type": None,
        "ssml": ssml_data["ssml"],
        "provider": "browser_fallback",
        "voice_persona": ssml_data["voice_persona"],
        "quality_score": 5.0,
        "fallback_to_browser": True,
        "browser_config": {
            "rate": ssml_data["speed"],
            "pitch": ssml_data["pitch"],
            "voice_id": voice_id,
        },
    }


async def _try_elevenlabs_tts(text: str, ssml_data: dict) -> bytes | None:
    """Attempt synthesis via ElevenLabs - the most natural human voice API.

    ElevenLabs produces the most realistic, human-like speech available.
    Supports emotion, pacing, and natural inflection natively.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not api_key:
        return None

    voice_id = ssml_data.get("elevenlabs_voice_id")
    if not voice_id:
        return None

    try:
        import httpx

        model_id = ssml_data.get("elevenlabs_model", "eleven_multilingual_v2")
        # Divine voice quality: tune stability/similarity per emotion
        mood_profile = ssml_data.get("mood_profile", {})
        warmth = mood_profile.get("warmth", "medium")

        # Stability: lower = more expressive/emotional, higher = more consistent
        # For divine friend voice: slightly lower stability for natural emotion
        stability = 0.45 if warmth in ("very_high", "high") else 0.55
        # Similarity boost: higher = more faithful to voice character
        similarity = 0.80
        # Style: emotional expressiveness (0 = neutral, 1 = very expressive)
        style_value = 0.65 if warmth == "very_high" else 0.50 if warmth == "high" else 0.35

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": text,
                    "model_id": model_id,
                    "voice_settings": {
                        "stability": stability,
                        "similarity_boost": similarity,
                        "style": style_value,
                        "use_speaker_boost": True,
                    },
                },
            )

            if response.status_code == 200 and len(response.content) > 100:
                logger.info(
                    f"ElevenLabs TTS success: voice_id={voice_id}, "
                    f"persona={ssml_data['voice_persona']}, "
                    f"size={len(response.content)} bytes"
                )
                return response.content

            logger.warning(f"ElevenLabs TTS failed: status={response.status_code}")
    except ImportError:
        logger.info("ElevenLabs TTS: httpx not available")
    except Exception as e:
        logger.warning(f"ElevenLabs TTS failed: {e}")
    return None


async def _try_sarvam_tts(
    text: str, ssml_data: dict, mood: str, voice_id: str
) -> bytes | None:
    """Attempt synthesis via Sarvam AI Bulbul - best Indian language voices.

    Sarvam AI produces the most natural Indian language voices available.
    Only activated when the target language is an Indian language where
    Sarvam's quality surpasses OpenAI and Google for native pronunciation.

    Supports: Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, Marathi,
    Gujarati, Punjabi, Odia, Sanskrit (via Hindi), and Indian English.
    """
    language = ssml_data.get("language", "en")

    try:
        from backend.services.sarvam_tts_service import (
            is_sarvam_available,
            is_sarvam_priority_language,
            synthesize_sarvam_tts,
        )

        if not is_sarvam_available():
            return None

        if not is_sarvam_priority_language(language):
            logger.debug(f"Sarvam TTS: Skipping for non-Indian language '{language}'")
            return None

        sarvam_speaker = ssml_data.get("sarvam_speaker")

        audio = await synthesize_sarvam_tts(
            text=text,
            language=language,
            voice_id=voice_id,
            mood=mood,
            speaker_override=sarvam_speaker,
        )

        if audio and len(audio) > 100:
            logger.info(
                f"Sarvam TTS success: speaker={sarvam_speaker}, "
                f"lang={language}, persona={ssml_data['voice_persona']}, "
                f"size={len(audio)} bytes"
            )
            return audio

    except ImportError:
        logger.debug("Sarvam TTS: sarvam_tts_service not available")
    except Exception as e:
        logger.warning(f"Sarvam TTS failed: {e}")

    return None


async def _try_bhashini_tts(
    text: str, ssml_data: dict, mood: str, voice_id: str
) -> bytes | None:
    """Attempt synthesis via Bhashini AI - Government of India platform.

    Bhashini provides high-quality TTS for all 22 scheduled Indian languages
    with authentic native pronunciation. Free and open API.
    """
    if not BHASHINI_SERVICE_AVAILABLE:
        return None

    language = ssml_data.get("language", "en")

    try:
        if not _bh_available():
            return None

        if not is_bhashini_supported_language(language):
            logger.debug(f"Bhashini TTS: Skipping for unsupported language '{language}'")
            return None

        audio = await synthesize_bhashini_tts(
            text=text,
            language=language,
            voice_id=voice_id,
            mood=mood,
        )

        if audio and len(audio) > 100:
            logger.info(
                f"Bhashini TTS success: lang={language}, "
                f"persona={ssml_data['voice_persona']}, "
                f"size={len(audio)} bytes"
            )
            return audio

    except Exception as e:
        logger.warning(f"Bhashini TTS failed: {e}")

    return None


def _strip_ssml_tags(ssml: str) -> str:
    """Strip SSML tags to get plain text for providers that don't support SSML."""
    text = re.sub(r"<[^>]+>", "", ssml)
    text = text.replace("&amp;", "&")
    text = text.replace("&lt;", "<")
    text = text.replace("&gt;", ">")
    text = text.replace("&quot;", '"')
    text = text.replace("&apos;", "'")
    return text.strip()


def get_available_voices() -> list[dict[str, Any]]:
    """Return catalog of available companion voices for frontend display."""
    return [
        {
            "id": vid,
            "name": v["name"],
            "gender": v["gender"],
            "style": v["style"],
            "description": v["description"],
        }
        for vid, v in COMPANION_VOICES.items()
    ]


def get_voice_for_mood(mood: str, prefer_divine: bool = False) -> str:
    """Select the best voice persona for a given mood.

    When prefer_divine is True, sacred/divine moods use divine voice personas.
    """
    if prefer_divine:
        divine_mood_to_voice = {
            "devotional": "divine-radha",
            "transcendent": "divine-shiva",
            "blissful": "divine-krishna",
            "sacred": "divine-shiva",
            "compassionate": "divine-ganga",
            "meditative": "divine-saraswati",
            "peaceful": "divine-saraswati",
            "grateful": "divine-krishna",
            "hopeful": "divine-hanuman",
            "anxious": "divine-ganga",
            "sad": "divine-ganga",
            "fearful": "divine-hanuman",
            "lonely": "divine-radha",
            "overwhelmed": "divine-shiva",
            "neutral": "divine-krishna",
        }
        result = divine_mood_to_voice.get(mood)
        if result:
            return result

    mood_to_voice = {
        "anxious": "sarvam-aura",
        "sad": "sarvam-aura",
        "angry": "elevenlabs-orion",
        "confused": "elevenlabs-nova",
        "lonely": "sarvam-aura",
        "hopeful": "elevenlabs-nova",
        "peaceful": "sarvam-rishi",
        "grateful": "elevenlabs-nova",
        "overwhelmed": "sarvam-rishi",
        "excited": "elevenlabs-nova",
        "neutral": "elevenlabs-nova",
        "hurt": "sarvam-aura",
        "fearful": "sarvam-aura",
        "frustrated": "elevenlabs-orion",
        "stressed": "sarvam-rishi",
        "guilty": "elevenlabs-nova",
        "jealous": "elevenlabs-nova",
        # Divine moods fallback to appropriate non-divine voices
        "devotional": "sarvam-rishi",
        "transcendent": "sarvam-rishi",
        "blissful": "elevenlabs-nova",
        "sacred": "sarvam-rishi",
        "compassionate": "sarvam-aura",
        "meditative": "sarvam-rishi",
    }
    return mood_to_voice.get(mood, "elevenlabs-nova")


def get_sarvam_voice_status() -> dict[str, Any]:
    """Get Sarvam AI TTS integration status for health checks."""
    try:
        from backend.services.sarvam_tts_service import get_sarvam_health_status
        return get_sarvam_health_status()
    except ImportError:
        return {"provider": "sarvam_ai_bulbul", "available": False}


def get_elevenlabs_voice_status() -> dict[str, Any]:
    """Get ElevenLabs TTS integration status for health checks."""
    if ELEVENLABS_SERVICE_AVAILABLE:
        try:
            return get_elevenlabs_health_status()
        except Exception:
            pass
    return {"provider": "elevenlabs", "available": False}


def get_bhashini_voice_status() -> dict[str, Any]:
    """Get Bhashini AI TTS integration status for health checks."""
    if BHASHINI_SERVICE_AVAILABLE:
        try:
            return get_bhashini_health_status()
        except Exception:
            pass
    return {"provider": "bhashini_ai", "available": False}


def get_all_voice_providers_status() -> dict[str, Any]:
    """Get combined health status for all voice providers."""
    return {
        "elevenlabs": get_elevenlabs_voice_status(),
        "sarvam_ai": get_sarvam_voice_status(),
        "bhashini_ai": get_bhashini_voice_status(),
        "pronunciation_engine": {
            "available": PRONUNCIATION_ENGINE_AVAILABLE,
            "features": [
                "Sanskrit/spiritual term IPA phonemes",
                "Language-specific pronunciation fixes",
                "Verse pause pattern insertion",
                "Provider-specific formatting",
            ] if PRONUNCIATION_ENGINE_AVAILABLE else [],
        },
    }
