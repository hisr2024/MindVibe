"""Sarvam AI TTS Service - Premium Indian Language Voice Synthesis

World-class voice synthesis for Indian languages using Sarvam AI's Bulbul model.
Sarvam AI produces the most natural, authentic Indian language voices available,
with native pronunciation quality that surpasses global TTS providers for Hindi,
Tamil, Telugu, Bengali, Kannada, Malayalam, Marathi, Gujarati, Odia, and Punjabi.

Architecture inspired by ElevenLabs' quality-first approach:
┌───────────────────────────────────────────────────────────────┐
│  Sarvam AI Bulbul v1 TTS                                      │
│                                                               │
│  Strengths:                                                    │
│  - Native Indian language pronunciation (not transliterated)  │
│  - Warm, human-like voices trained on Indian speech patterns  │
│  - Proper handling of Sanskrit-origin words across languages  │
│  - Emotion-adaptive pace/pitch/loudness controls              │
│  - 11 Indian languages + Indian English                       │
│  - 22050Hz / 8000Hz sample rates                              │
│                                                               │
│  Provider Priority (Indian languages):                         │
│  ElevenLabs → Sarvam AI → OpenAI → Google → Edge → Browser   │
│                                                               │
│  Provider Priority (non-Indian languages):                     │
│  ElevenLabs → OpenAI → Google → Edge → Browser                │
└───────────────────────────────────────────────────────────────┘
"""

import base64
import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)


# ─── Sarvam AI TTS Configuration ─────────────────────────────────────────────

SARVAM_TTS_ENDPOINT = "https://api.sarvam.ai/text-to-speech"
SARVAM_TTS_MODEL = "bulbul:v1"

# ─── Sarvam Speaker Catalog ──────────────────────────────────────────────────
# Each speaker has been selected for maximum naturalness and emotional range.
# Inspired by ElevenLabs' approach: every voice has a personality, not just a name.

SARVAM_SPEAKERS: dict[str, dict[str, Any]] = {
    "meera": {
        "name": "Meera",
        "speaker_id": "meera",
        "gender": "female",
        "style": "warm",
        "languages": ["hi-IN", "en-IN", "bn-IN", "mr-IN", "gu-IN", "pa-IN"],
        "description": "Warm, nurturing female voice with natural Hindi cadence. "
                       "Perfect for emotional support and daily wisdom.",
        "best_for": ["conversation", "emotional_support", "daily_wisdom"],
        "default_pace": 1.0,
        "default_pitch": 0,
        "default_loudness": 1.5,
        "quality_score": 9.5,
    },
    "pavithra": {
        "name": "Pavithra",
        "speaker_id": "pavithra",
        "gender": "female",
        "style": "clear",
        "languages": ["hi-IN", "en-IN", "ta-IN", "te-IN", "kn-IN", "ml-IN"],
        "description": "Crystal-clear multilingual voice with precise articulation. "
                       "Ideal for verse recitation and guided meditation.",
        "best_for": ["verse_recitation", "meditation", "multilingual"],
        "default_pace": 0.95,
        "default_pitch": 0,
        "default_loudness": 1.5,
        "quality_score": 9.5,
    },
    "maitreyi": {
        "name": "Maitreyi",
        "speaker_id": "maitreyi",
        "gender": "female",
        "style": "soft",
        "languages": ["hi-IN", "en-IN", "bn-IN", "ta-IN", "te-IN", "kn-IN", "ml-IN"],
        "description": "Soft, ethereal voice with meditative quality. "
                       "Like a gentle breeze carrying ancient wisdom.",
        "best_for": ["meditation", "affirmation", "sleep", "breathing"],
        "default_pace": 0.9,
        "default_pitch": -1,
        "default_loudness": 1.2,
        "quality_score": 9.3,
    },
    "arvind": {
        "name": "Arvind",
        "speaker_id": "arvind",
        "gender": "male",
        "style": "deep",
        "languages": ["hi-IN", "en-IN", "bn-IN", "mr-IN", "ta-IN", "te-IN"],
        "description": "Deep, resonant male voice with gravitas. "
                       "Carries the weight of ancient wisdom with natural authority.",
        "best_for": ["verse_recitation", "narration", "sacred_chanting"],
        "default_pace": 0.92,
        "default_pitch": -2,
        "default_loudness": 1.5,
        "quality_score": 9.4,
    },
    "karthik": {
        "name": "Karthik",
        "speaker_id": "karthik",
        "gender": "male",
        "style": "conversational",
        "languages": ["hi-IN", "en-IN", "ta-IN", "te-IN", "kn-IN", "ml-IN"],
        "description": "Natural conversational male voice. "
                       "The friend next door who happens to know the Gita by heart.",
        "best_for": ["conversation", "emotional_support", "daily_wisdom"],
        "default_pace": 1.0,
        "default_pitch": 0,
        "default_loudness": 1.5,
        "quality_score": 9.3,
    },
}


# ─── Language Code Mapping ────────────────────────────────────────────────────
# Maps MindVibe internal language codes to Sarvam AI's expected format.

MINDVIBE_TO_SARVAM_LANG: dict[str, str] = {
    "hi": "hi-IN",
    "en": "en-IN",
    "en-IN": "en-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "pa": "pa-IN",
    "od": "od-IN",
    "sa": "hi-IN",  # Sanskrit → Hindi voice (closest match)
}

# Languages where Sarvam AI produces superior quality vs other providers.
# Includes "en" because the frontend normalizes "en-IN" to "en" via
# getBackendLanguageCode(). MINDVIBE_TO_SARVAM_LANG maps "en" → "en-IN"
# so Sarvam still receives the correct language code.
SARVAM_PRIORITY_LANGUAGES = {
    "hi", "ta", "te", "bn", "kn", "ml", "mr", "gu", "pa", "od", "sa", "en-IN", "en",
}


# ─── Emotion-to-Sarvam Prosody Mapping ───────────────────────────────────────
# Fine-tuned prosody parameters for each emotion, inspired by ElevenLabs'
# stability/similarity/style approach but mapped to Sarvam's pace/pitch/loudness.

SARVAM_EMOTION_PROFILES: dict[str, dict[str, Any]] = {
    "anxious": {
        "pace": 0.85,
        "pitch": -1,
        "loudness": 1.0,
        "description": "Slow, grounding, soft — a calming anchor",
    },
    "sad": {
        "pace": 0.88,
        "pitch": -1,
        "loudness": 1.0,
        "description": "Gentle, warm, tender — sitting with you",
    },
    "angry": {
        "pace": 0.92,
        "pitch": -2,
        "loudness": 1.3,
        "description": "Measured, steady, grounding — an anchor in the storm",
    },
    "confused": {
        "pace": 0.95,
        "pitch": 0,
        "loudness": 1.3,
        "description": "Clear, patient, encouraging — untangling together",
    },
    "lonely": {
        "pace": 0.87,
        "pitch": 0,
        "loudness": 1.0,
        "description": "Intimate, close, present — I am right here",
    },
    "hopeful": {
        "pace": 1.05,
        "pitch": 1,
        "loudness": 1.5,
        "description": "Bright, uplifting, warm — celebrating with you",
    },
    "peaceful": {
        "pace": 0.82,
        "pitch": -1,
        "loudness": 1.0,
        "description": "Whisper-soft, serene, spacious — basking together",
    },
    "grateful": {
        "pace": 0.95,
        "pitch": 1,
        "loudness": 1.3,
        "description": "Warm, genuine, heartfelt — sharing your joy",
    },
    "overwhelmed": {
        "pace": 0.80,
        "pitch": -1,
        "loudness": 1.0,
        "description": "Ultra-slow, spacious — one breath at a time",
    },
    "excited": {
        "pace": 1.1,
        "pitch": 2,
        "loudness": 1.5,
        "description": "Energetic, bright — matching your enthusiasm",
    },
    "neutral": {
        "pace": 1.0,
        "pitch": 0,
        "loudness": 1.5,
        "description": "Natural, conversational, warm default",
    },
    "hurt": {
        "pace": 0.86,
        "pitch": -1,
        "loudness": 1.0,
        "description": "Tender, gentle, protective — wrapping you in care",
    },
    "fearful": {
        "pace": 0.84,
        "pitch": -1,
        "loudness": 1.0,
        "description": "Safe, grounding, steady — I am your anchor",
    },
    "frustrated": {
        "pace": 0.91,
        "pitch": -1,
        "loudness": 1.3,
        "description": "Patient, validating, steady — I hear you",
    },
    "stressed": {
        "pace": 0.82,
        "pitch": -1,
        "loudness": 1.0,
        "description": "Ultra-calm, spacious — let the pressure go",
    },
    "guilty": {
        "pace": 0.88,
        "pitch": 0,
        "loudness": 1.0,
        "description": "Compassionate, forgiving — no judgment here",
    },
    "jealous": {
        "pace": 0.90,
        "pitch": 0,
        "loudness": 1.3,
        "description": "Understanding, non-judgmental — sitting with discomfort",
    },
    # ─── Divine / Sacred Emotion Profiles ────────────────────────────
    "devotional": {
        "pace": 0.78,
        "pitch": -2,
        "loudness": 1.0,
        "description": "Reverent, sacred — the voice of bhakti",
    },
    "transcendent": {
        "pace": 0.72,
        "pitch": -3,
        "loudness": 0.8,
        "description": "Ethereal, vast — beyond the material",
    },
    "blissful": {
        "pace": 0.82,
        "pitch": 1,
        "loudness": 1.2,
        "description": "Radiant, divine joy — ananda",
    },
    "sacred": {
        "pace": 0.70,
        "pitch": -3,
        "loudness": 0.8,
        "description": "Ancient, primordial — the eternal sound",
    },
    "compassionate": {
        "pace": 0.80,
        "pitch": -1,
        "loudness": 1.0,
        "description": "Boundless karuna — divine mother energy",
    },
    "meditative": {
        "pace": 0.68,
        "pitch": -2,
        "loudness": 0.7,
        "description": "Deep stillness — dhyana, the silence between breaths",
    },
}


# ─── Companion Voice → Sarvam Speaker Mapping ────────────────────────────────
# Maps KIAAN companion voice personas to the best Sarvam speaker for that persona.

COMPANION_TO_SARVAM_SPEAKER: dict[str, str] = {
    # Canonical companion IDs
    "sarvam-aura": "meera",
    "sarvam-rishi": "arvind",
    "elevenlabs-nova": "pavithra",
    "elevenlabs-orion": "arvind",

    # Legacy persona IDs (backward compatibility)
    "priya": "meera",       # Warm nurturing → Meera (warm female)
    "maya": "pavithra",     # Empathetic friend → Pavithra (clear female)
    "ananya": "maitreyi",   # Meditative → Maitreyi (soft ethereal)
    "arjun": "arvind",      # Wise male → Arvind (deep resonant)
    "devi": "pavithra",     # Energetic → Pavithra (clear strong)
    "kavya": "meera",       # Hindi warm → Meera (Hindi native)
    "vikram": "arvind",     # Hindi baritone → Arvind (deep male)
    "meera": "meera",       # Direct mapping
    "rohan": "karthik",     # Modern male → Karthik (conversational)
    "krishna": "arvind",    # Sacred → Arvind (deep gravitas)
    "sophia": "pavithra",   # International → Pavithra (clear multi)
    "ravi": "karthik",      # Scholarly → Karthik (natural teacher)

    # Divine voice personas → Sarvam speakers (for Indian language fallback)
    "divine-krishna": "arvind",    # Deep, wise, divine authority
    "divine-saraswati": "maitreyi",  # Ethereal, meditative
    "divine-ganga": "meera",       # Warm, flowing, nurturing
    "divine-shiva": "arvind",      # Deep, cosmic resonance
    "divine-hanuman": "karthik",   # Warm, devoted, powerful
    "divine-radha": "pavithra",    # Clear, pure, devotional
}


def is_sarvam_available() -> bool:
    """Check if Sarvam AI TTS is configured and available."""
    api_key = os.getenv("SARVAM_API_KEY", "").strip()
    return bool(api_key)


def is_sarvam_priority_language(language: str) -> bool:
    """Check if this language benefits from Sarvam AI's superior Indian voice quality."""
    return language in SARVAM_PRIORITY_LANGUAGES


def get_sarvam_language_code(language: str) -> Optional[str]:
    """Convert MindVibe language code to Sarvam AI format.

    Returns None if the language is not supported by Sarvam AI.
    """
    return MINDVIBE_TO_SARVAM_LANG.get(language)


def get_sarvam_speaker_for_companion(voice_id: str) -> str:
    """Get the best Sarvam speaker for a given companion voice persona."""
    return COMPANION_TO_SARVAM_SPEAKER.get(voice_id, "meera")


def get_sarvam_emotion_profile(mood: str) -> dict[str, Any]:
    """Get Sarvam prosody parameters for a given emotion."""
    return SARVAM_EMOTION_PROFILES.get(mood, SARVAM_EMOTION_PROFILES["neutral"])


async def synthesize_sarvam_tts(
    text: str,
    language: str = "hi",
    voice_id: str = "sarvam-aura",
    mood: str = "neutral",
    speaker_override: Optional[str] = None,
) -> Optional[bytes]:
    """Synthesize speech using Sarvam AI's Bulbul TTS model.

    Produces the highest quality Indian language voice synthesis available.
    Automatically maps companion voice personas and emotions to optimal
    Sarvam speaker configurations.

    Args:
        text: Text to synthesize (1-5000 characters)
        language: MindVibe language code (hi, ta, te, bn, en-IN, etc.)
        voice_id: KIAAN companion voice persona (e.g., sarvam-aura, elevenlabs-nova)
        mood: Detected user mood for prosody adaptation
        speaker_override: Optional direct Sarvam speaker ID override

    Returns:
        MP3 audio bytes or None if synthesis fails

    Example:
        >>> audio = await synthesize_sarvam_tts(
        ...     text="Aap bilkul akele nahin hain, mere dost.",
        ...     language="hi",
        ...     voice_id="priya",
        ...     mood="lonely",
        ... )
    """
    api_key = os.getenv("SARVAM_API_KEY", "").strip()
    if not api_key:
        logger.debug("Sarvam TTS: API key not configured, skipping")
        return None

    # Resolve language code
    sarvam_lang = get_sarvam_language_code(language)
    if not sarvam_lang:
        logger.debug(f"Sarvam TTS: Language '{language}' not supported, skipping")
        return None

    # Resolve speaker
    if speaker_override and speaker_override in SARVAM_SPEAKERS:
        speaker_id = speaker_override
    else:
        speaker_id = get_sarvam_speaker_for_companion(voice_id)

    speaker = SARVAM_SPEAKERS.get(speaker_id, SARVAM_SPEAKERS["meera"])

    # Verify speaker supports the target language
    if sarvam_lang not in speaker["languages"]:
        # Fallback to a speaker that supports this language
        for sid, sinfo in SARVAM_SPEAKERS.items():
            if sarvam_lang in sinfo["languages"]:
                speaker_id = sid
                speaker = sinfo
                logger.info(
                    f"Sarvam TTS: Speaker fallback {voice_id}→{speaker_id} "
                    f"for language {sarvam_lang}"
                )
                break

    # Get emotion-adaptive prosody
    emotion_profile = get_sarvam_emotion_profile(mood)

    # Combine speaker defaults with emotion adjustments
    pace = speaker["default_pace"] * emotion_profile["pace"]
    pitch = speaker["default_pitch"] + emotion_profile["pitch"]
    loudness = min(speaker["default_loudness"], emotion_profile["loudness"])

    # Clamp to Sarvam API limits
    pace = max(0.5, min(2.0, pace))
    pitch = max(-12, min(12, pitch))
    loudness = max(0.5, min(3.0, loudness))

    # Truncate text to Sarvam's limit
    if len(text) > 5000:
        text = text[:4997] + "..."

    try:
        import httpx

        payload = {
            "inputs": [text],
            "target_language_code": sarvam_lang,
            "speaker": speaker["speaker_id"],
            "pitch": pitch,
            "pace": pace,
            "loudness": loudness,
            "speech_sample_rate": 22050,
            "enable_preprocessing": True,
            "model": SARVAM_TTS_MODEL,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                SARVAM_TTS_ENDPOINT,
                headers={
                    "API-Subscription-Key": api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
            )

            if response.status_code == 200:
                data = response.json()
                audios = data.get("audios", [])

                if audios and audios[0]:
                    audio_bytes = base64.b64decode(audios[0])

                    if len(audio_bytes) > 100:
                        logger.info(
                            f"Sarvam TTS success: speaker={speaker_id}, "
                            f"lang={sarvam_lang}, mood={mood}, "
                            f"pace={pace:.2f}, pitch={pitch}, "
                            f"size={len(audio_bytes)} bytes"
                        )
                        return audio_bytes

                logger.warning("Sarvam TTS: Empty audio in response")
            elif response.status_code == 429:
                logger.warning("Sarvam TTS: Rate limited, falling through to next provider")
            elif response.status_code == 401 or response.status_code == 403:
                logger.error("Sarvam TTS: Authentication failed, check SARVAM_API_KEY")
            else:
                logger.warning(
                    f"Sarvam TTS failed: status={response.status_code}, "
                    f"body={response.text[:200]}"
                )

    except ImportError:
        logger.info("Sarvam TTS: httpx not available")
    except Exception as e:
        logger.warning(f"Sarvam TTS failed: {e}")

    return None


def get_sarvam_speakers_catalog() -> list[dict[str, Any]]:
    """Return the full Sarvam speaker catalog for API/frontend consumption."""
    return [
        {
            "id": sid,
            "name": info["name"],
            "gender": info["gender"],
            "style": info["style"],
            "description": info["description"],
            "languages": info["languages"],
            "best_for": info["best_for"],
            "quality_score": info["quality_score"],
        }
        for sid, info in SARVAM_SPEAKERS.items()
    ]


def get_sarvam_health_status() -> dict[str, Any]:
    """Get health status of Sarvam AI TTS service."""
    available = is_sarvam_available()
    return {
        "provider": "sarvam_ai_bulbul",
        "available": available,
        "model": SARVAM_TTS_MODEL,
        "quality_score": 9.5 if available else 0,
        "supported_languages": list(MINDVIBE_TO_SARVAM_LANG.keys()),
        "speakers_count": len(SARVAM_SPEAKERS),
        "features": [
            "Native Indian language pronunciation",
            "Emotion-adaptive prosody",
            "11 Indian languages + Indian English",
            "Sanskrit via Hindi voice",
            "22050Hz high-quality audio",
        ] if available else [],
    }
