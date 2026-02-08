"""Companion Premium Voice Service - Best Natural Human Voices

World-class voice synthesis for KIAAN best friend companion.
Uses the most natural-sounding voices available in 2025.

Voice Provider Chain (highest quality → lowest):
┌──────────────────────────────────────────────────────────┐
│  1. ElevenLabs (10/10) - Most human-like voices ever     │
│     → Requires ELEVENLABS_API_KEY                        │
│  2. OpenAI TTS (9.5/10) - Nova, Shimmer, Alloy voices   │
│     → Uses existing OPENAI_API_KEY                       │
│  3. Google Cloud Neural2/Studio (9/10)                   │
│     → Requires GOOGLE_APPLICATION_CREDENTIALS            │
│  4. Edge TTS - Microsoft Neural (8.5/10)                 │
│     → Free, no API key needed                            │
│  5. Browser SpeechSynthesis (5/10) - ultimate fallback   │
│                                                          │
│  Emotion-Adaptive Prosody:                               │
│  - Speed/pitch modulation per detected mood              │
│  - Natural pauses, breathing simulation via SSML         │
│  - Emphasis on emotional key words                       │
│  - Voice persona auto-selection by mood                  │
└──────────────────────────────────────────────────────────┘
"""

import logging
import os
import re
from typing import Any

logger = logging.getLogger(__name__)


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
        "openai_speed": 0.85,
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
        "openai_speed": 0.88,
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
        "openai_speed": 0.92,
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
        "openai_speed": 0.95,
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
        "openai_speed": 0.87,
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
        "openai_speed": 1.0,
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
        "openai_speed": 0.82,
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
        "openai_speed": 0.95,
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
        "openai_speed": 0.80,
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
        "openai_speed": 1.05,
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
        "openai_speed": 0.95,
        "description": "Natural, conversational, warm default",
    },
}


# ─── Voice Persona Profiles ──────────────────────────────────────────────
# Each persona maps to the BEST voice across all providers.

COMPANION_VOICES: dict[str, dict[str, Any]] = {
    "priya": {
        "name": "Priya",
        "gender": "female",
        "style": "nurturing",
        # OpenAI: "shimmer" = warm, caring, natural female (best for nurturing)
        "openai_voice": "shimmer",
        "openai_model": "tts-1-hd",
        # ElevenLabs: warm Indian female voice
        "elevenlabs_voice_id": "EXAVITQu4vr4xnSDxMaL",  # Sarah
        "elevenlabs_model": "eleven_multilingual_v2",
        # Google Cloud
        "google_voice": "en-IN-Neural2-A",
        # Edge TTS
        "edge_voice": "en-IN-NeerjaNeural",
        "description": "Warm, nurturing - like a wise older sister who always knows what to say",
        "default_speed": 0.94,
        "default_pitch": 0.5,
        "warmth_boost": 0.1,
    },
    "maya": {
        "name": "Maya",
        "gender": "female",
        "style": "empathetic",
        # OpenAI: "nova" = most natural conversational female (best all-rounder)
        "openai_voice": "nova",
        "openai_model": "tts-1-hd",
        "elevenlabs_voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel
        "elevenlabs_model": "eleven_multilingual_v2",
        "google_voice": "en-US-Neural2-F",
        "edge_voice": "en-US-JennyNeural",
        "description": "Natural, everyday best friend voice - warm and real",
        "default_speed": 0.95,
        "default_pitch": 0.3,
        "warmth_boost": 0.05,
    },
    "ananya": {
        "name": "Ananya",
        "gender": "female",
        "style": "meditative",
        # OpenAI: "shimmer" at slow speed = deep, meditative quality
        "openai_voice": "shimmer",
        "openai_model": "tts-1-hd",
        "elevenlabs_voice_id": "ThT5KcBeYPX3keUQqHPh",  # Dorothy
        "elevenlabs_model": "eleven_multilingual_v2",
        "google_voice": "en-US-Studio-O",
        "edge_voice": "en-US-AriaNeural",
        "description": "Deep, gentle whisper - perfect for calm and meditation moments",
        "default_speed": 0.85,
        "default_pitch": -0.5,
        "warmth_boost": 0.15,
    },
    "arjun": {
        "name": "Arjun",
        "gender": "male",
        "style": "wise",
        # OpenAI: "onyx" = deep male voice, steady and grounded
        "openai_voice": "onyx",
        "openai_model": "tts-1-hd",
        "elevenlabs_voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam
        "elevenlabs_model": "eleven_multilingual_v2",
        "google_voice": "en-IN-Neural2-B",
        "edge_voice": "en-IN-PrabhatNeural",
        "description": "Calm, wise male voice - like a trusted brother",
        "default_speed": 0.92,
        "default_pitch": -1.0,
        "warmth_boost": 0.08,
    },
    "devi": {
        "name": "Devi",
        "gender": "female",
        "style": "energetic",
        # OpenAI: "alloy" = bright, energetic, versatile
        "openai_voice": "alloy",
        "openai_model": "tts-1-hd",
        "elevenlabs_voice_id": "jBpfuIE2acCO8z3wKNLl",  # Gigi
        "elevenlabs_model": "eleven_multilingual_v2",
        "google_voice": "en-US-Neural2-C",
        "edge_voice": "en-US-SaraNeural",
        "description": "Bright, motivating energy when you need a spark",
        "default_speed": 0.98,
        "default_pitch": 1.0,
        "warmth_boost": 0.0,
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


def build_companion_ssml(
    text: str,
    mood: str = "neutral",
    voice_id: str = "priya",
    language: str = "en",
) -> dict[str, Any]:
    """Build SSML for companion voice synthesis with emotion-adaptive prosody."""
    profile = EMOTION_VOICE_PROFILES.get(mood, EMOTION_VOICE_PROFILES["neutral"])
    voice = COMPANION_VOICES.get(voice_id, COMPANION_VOICES["priya"])

    speed = profile["rate_value"] * voice["default_speed"]
    pitch = float(profile["pitch"].replace("st", "")) + voice["default_pitch"]
    pause_mult = profile["pause_multiplier"]

    ssml_text = _escape_ssml(text)

    for pattern, replacement in NATURAL_PAUSE_PATTERNS:
        if "time=" in replacement:
            import re as re_mod

            def scale_pause(match: re_mod.Match) -> str:
                base_ms = int(re_mod.search(r'(\d+)ms', replacement).group(1))
                scaled_ms = int(base_ms * pause_mult)
                return replacement.replace(f'{base_ms}ms', f'{scaled_ms}ms')
            ssml_text = re.sub(pattern, scale_pause, ssml_text)
        else:
            ssml_text = re.sub(pattern, replacement, ssml_text)

    for pattern, replacement in BREATH_INSERTIONS:
        ssml_text = re.sub(pattern, replacement, ssml_text, flags=re.IGNORECASE)

    for word, level in EMPHASIS_WORDS.items():
        pattern = rf"\b({word})\b"
        replacement = f'<emphasis level="{level}">\\1</emphasis>'
        ssml_text = re.sub(pattern, replacement, ssml_text, flags=re.IGNORECASE, count=2)

    if profile.get("breathing"):
        ssml_text = ssml_text.replace(
            "\n\n",
            '\n<break time="800ms"/><mark name="breath"/>\n'
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
        "voice_name": voice["google_voice"],
        "edge_voice": voice["edge_voice"],
        "openai_voice": voice["openai_voice"],
        "openai_model": voice["openai_model"],
        "elevenlabs_voice_id": voice.get("elevenlabs_voice_id"),
        "elevenlabs_model": voice.get("elevenlabs_model"),
        "speed": speed,
        "pitch": pitch,
        "openai_speed": profile.get("openai_speed", 1.0),
        "mood_profile": profile,
        "voice_persona": voice["name"],
        "language": language,
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
    voice_id: str = "priya",
    language: str = "en",
) -> dict[str, Any]:
    """Synthesize speech using the best available natural voice provider.

    Provider chain (tries in order, falls through on failure):
    1. ElevenLabs - Most human-like voices (needs ELEVENLABS_API_KEY)
    2. OpenAI TTS HD - Extremely natural (uses existing OPENAI_API_KEY)
    3. Google Cloud Neural2 - High quality neural voices
    4. Edge TTS (Microsoft Neural) - Free, decent quality
    5. Browser fallback - Returns config for frontend SpeechSynthesis
    """
    ssml_data = build_companion_ssml(text, mood, voice_id, language)
    plain_text = _strip_ssml_tags(ssml_data["ssml"])

    # 1. Try ElevenLabs (most natural, most human-like)
    audio = await _try_elevenlabs_tts(plain_text, ssml_data)
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

    # 2. Try OpenAI TTS HD (extremely natural, already have API key)
    audio = await _try_openai_tts(plain_text, ssml_data)
    if audio:
        return {
            "audio": audio,
            "content_type": "audio/mpeg",
            "ssml": ssml_data["ssml"],
            "provider": "openai_tts_hd",
            "voice_persona": ssml_data["voice_persona"],
            "quality_score": 9.5,
            "fallback_to_browser": False,
        }

    # 3. Try Google Cloud TTS
    audio = await _try_google_tts(ssml_data)
    if audio:
        return {
            "audio": audio,
            "content_type": "audio/mpeg",
            "ssml": ssml_data["ssml"],
            "provider": "google_cloud_neural2",
            "voice_persona": ssml_data["voice_persona"],
            "quality_score": 9.0,
            "fallback_to_browser": False,
        }

    # 4. Try Edge TTS
    audio = await _try_edge_tts(ssml_data)
    if audio:
        return {
            "audio": audio,
            "content_type": "audio/mpeg",
            "ssml": ssml_data["ssml"],
            "provider": "edge_tts_neural",
            "voice_persona": ssml_data["voice_persona"],
            "quality_score": 8.5,
            "fallback_to_browser": False,
        }

    # 5. Return config for browser-side synthesis
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
        speed = ssml_data.get("openai_speed", 1.0)

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
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                        "style": min(speed * 0.5, 1.0),
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


async def _try_openai_tts(text: str, ssml_data: dict) -> bytes | None:
    """Attempt synthesis via OpenAI TTS HD - extremely natural voices.

    OpenAI TTS voices (nova, shimmer, alloy, onyx, echo, fable) are among
    the most natural-sounding synthetic voices available. Uses the existing
    OPENAI_API_KEY already configured for the chat AI.

    tts-1-hd model provides the highest quality output.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        import openai

        client = openai.AsyncOpenAI(api_key=api_key)

        voice_name = ssml_data.get("openai_voice", "nova")
        model = ssml_data.get("openai_model", "tts-1-hd")
        speed = ssml_data.get("openai_speed", 1.0)

        # Clamp speed to OpenAI's supported range (0.25 - 4.0)
        speed = max(0.25, min(4.0, speed))

        response = await client.audio.speech.create(
            model=model,
            voice=voice_name,
            input=text,
            speed=speed,
            response_format="mp3",
        )

        audio = response.content
        if audio and len(audio) > 100:
            logger.info(
                f"OpenAI TTS success: voice={voice_name}, model={model}, "
                f"speed={speed:.2f}, persona={ssml_data['voice_persona']}, "
                f"size={len(audio)} bytes"
            )
            return audio

    except ImportError:
        logger.info("OpenAI TTS: openai package not available")
    except Exception as e:
        logger.warning(f"OpenAI TTS failed: {e}")
    return None


async def _try_google_tts(ssml_data: dict) -> bytes | None:
    """Attempt synthesis via Google Cloud TTS (Neural2/Studio voices)."""
    try:
        from backend.services.tts_service import TTSService
        tts = TTSService()

        audio = await tts.synthesize_divine_ssml(
            ssml_text=ssml_data["ssml"],
            language=ssml_data["language"],
            voice_type="friendly",
            speed=ssml_data["speed"],
            pitch=ssml_data["pitch"],
        )
        if audio:
            logger.info(
                f"Google TTS success: voice={ssml_data['voice_name']}, "
                f"persona={ssml_data['voice_persona']}"
            )
            return audio
    except Exception as e:
        logger.warning(f"Google TTS failed: {e}")
    return None


async def _try_edge_tts(ssml_data: dict) -> bytes | None:
    """Attempt synthesis via Edge TTS (Microsoft Neural voices)."""
    try:
        import edge_tts

        voice_name = ssml_data["edge_voice"]
        rate_str = f"{int((ssml_data['speed'] - 1.0) * 100):+d}%"

        communicate = edge_tts.Communicate(
            text=_strip_ssml_tags(ssml_data["ssml"]),
            voice=voice_name,
            rate=rate_str,
        )

        audio_chunks = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])

        if audio_chunks:
            audio = b"".join(audio_chunks)
            logger.info(
                f"Edge TTS success: voice={voice_name}, "
                f"persona={ssml_data['voice_persona']}, "
                f"size={len(audio)} bytes"
            )
            return audio
    except Exception as e:
        logger.warning(f"Edge TTS failed: {e}")
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


def get_voice_for_mood(mood: str) -> str:
    """Select the best voice persona for a given mood."""
    mood_to_voice = {
        "anxious": "priya",
        "sad": "priya",
        "angry": "arjun",
        "confused": "maya",
        "lonely": "priya",
        "hopeful": "devi",
        "peaceful": "ananya",
        "grateful": "maya",
        "overwhelmed": "ananya",
        "excited": "devi",
        "neutral": "maya",
    }
    return mood_to_voice.get(mood, "maya")
