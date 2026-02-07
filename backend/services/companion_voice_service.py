"""Companion Premium Voice Service - ElevenLabs-Inspired Voice Synthesis

World-class voice synthesis for the KIAAN best friend companion.
Inspired by ElevenLabs' quality with multi-provider resilience.

Voice Architecture:
┌─────────────────────────────────────────────────────────┐
│              COMPANION VOICE ENGINE                      │
│                                                          │
│  Provider Chain (highest quality first):                │
│  1. Google Cloud Neural2/Studio (9.5/10 quality)       │
│  2. Edge TTS - Microsoft Neural  (8.5/10 quality)      │
│  3. pyttsx3 - Offline fallback   (5.0/10 quality)      │
│                                                          │
│  Emotion-Adaptive Prosody:                              │
│  - SSML with natural pauses, breathing simulation       │
│  - Pitch/rate/volume shift per detected mood            │
│  - Emphasis on key emotional phrases                    │
│  - Warm conversational cadence (not robotic)            │
│                                                          │
│  Voice Personas (ElevenLabs-inspired):                  │
│  - Priya: Warm Indian English, nurturing sister         │
│  - Maya: Natural American, empathetic friend            │
│  - Ananya: Deep meditation, gentle whisper              │
│  - Arjun: Calm male, wise brother                       │
│  - Devi: Energetic female, motivational spark           │
│                                                          │
│  Caching: SHA256 → Redis (1 week) → Memory → Disk      │
└─────────────────────────────────────────────────────────┘
"""

import hashlib
import logging
import os
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ─── Emotion-to-Prosody Mapping (ElevenLabs-grade SSML) ──────────────────

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
}

# ─── Voice Persona Profiles (Named Characters) ──────────────────────────

COMPANION_VOICES: dict[str, dict[str, Any]] = {
    "priya": {
        "name": "Priya",
        "gender": "female",
        "style": "nurturing",
        "google_voice": "en-IN-Neural2-A",
        "edge_voice": "en-IN-NeerjaNeural",
        "description": "Warm Indian English, like a wise older sister",
        "default_speed": 0.94,
        "default_pitch": 0.5,
        "warmth_boost": 0.1,
    },
    "maya": {
        "name": "Maya",
        "gender": "female",
        "style": "empathetic",
        "google_voice": "en-US-Neural2-F",
        "edge_voice": "en-US-JennyNeural",
        "description": "Natural American, your everyday best friend",
        "default_speed": 0.95,
        "default_pitch": 0.3,
        "warmth_boost": 0.05,
    },
    "ananya": {
        "name": "Ananya",
        "gender": "female",
        "style": "meditative",
        "google_voice": "en-US-Studio-O",
        "edge_voice": "en-US-AriaNeural",
        "description": "Deep, gentle whisper for calm moments",
        "default_speed": 0.85,
        "default_pitch": -0.5,
        "warmth_boost": 0.15,
    },
    "arjun": {
        "name": "Arjun",
        "gender": "male",
        "style": "wise",
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
        "google_voice": "en-US-Neural2-C",
        "edge_voice": "en-US-SaraNeural",
        "description": "Bright, motivating energy when you need a spark",
        "default_speed": 0.98,
        "default_pitch": 1.0,
        "warmth_boost": 0.0,
    },
}

# ─── Natural Speech Patterns ────────────────────────────────────────────
# These make KIAAN's voice feel like a real person, not a robot

NATURAL_PAUSE_PATTERNS = [
    (r"\.{3,}", '<break time="700ms"/>'),       # Ellipsis - thoughtful pause
    (r"\.\s+", '<break time="400ms"/> '),        # Period - natural breath
    (r"\?\s+", '<break time="350ms"/> '),        # Question - let it land
    (r"!\s+", '<break time="300ms"/> '),          # Exclamation - energy pause
    (r",\s+", '<break time="180ms"/> '),          # Comma - micro breath
    (r"—", '<break time="250ms"/>'),              # Em dash - dramatic pause
    (r"\s+-\s+", '<break time="200ms"/> '),       # Dash - emphasis pause
]

# Words to emphasize (best friend speech patterns)
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

# Conversational filler patterns that should feel natural
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
    """Build world-class SSML for companion voice synthesis.

    Creates natural-sounding SSML with:
    - Emotion-adaptive prosody (rate, pitch, volume)
    - Natural pauses at punctuation
    - Emphasis on key emotional words
    - Breathing simulation for calm moods
    - Voice persona-specific tuning

    Returns dict with:
    - ssml: The complete SSML string
    - voice_name: Google Cloud voice name
    - edge_voice: Edge TTS voice name (fallback)
    - speed: Computed speed value
    - pitch: Computed pitch value
    - mood_profile: The emotion voice profile used
    """
    profile = EMOTION_VOICE_PROFILES.get(mood, EMOTION_VOICE_PROFILES["neutral"])
    voice = COMPANION_VOICES.get(voice_id, COMPANION_VOICES["priya"])

    # Compute final speed and pitch
    speed = profile["rate_value"] * voice["default_speed"]
    pitch = float(profile["pitch"].replace("st", "")) + voice["default_pitch"]
    pause_mult = profile["pause_multiplier"]

    # Process text into SSML
    ssml_text = _escape_ssml(text)

    # Apply natural pause patterns with mood-scaled timing
    for pattern, replacement in NATURAL_PAUSE_PATTERNS:
        if "time=" in replacement:
            # Scale pause duration by mood's pause multiplier
            import re as re_mod
            def scale_pause(match: re_mod.Match) -> str:
                base_ms = int(re_mod.search(r'(\d+)ms', replacement).group(1))
                scaled_ms = int(base_ms * pause_mult)
                return replacement.replace(f'{base_ms}ms', f'{scaled_ms}ms')
            ssml_text = re.sub(pattern, scale_pause, ssml_text)
        else:
            ssml_text = re.sub(pattern, replacement, ssml_text)

    # Apply breath insertions for natural speech feel
    for pattern, replacement in BREATH_INSERTIONS:
        ssml_text = re.sub(pattern, replacement, ssml_text, flags=re.IGNORECASE)

    # Apply emphasis on key words
    for word, level in EMPHASIS_WORDS.items():
        pattern = rf"\b({word})\b"
        replacement = f'<emphasis level="{level}">\\1</emphasis>'
        ssml_text = re.sub(pattern, replacement, ssml_text, flags=re.IGNORECASE, count=2)

    # Add breathing breaks for calm moods
    if profile.get("breathing"):
        # Insert a gentle breath at paragraph breaks
        ssml_text = ssml_text.replace(
            "\n\n",
            '\n<break time="800ms"/><mark name="breath"/>\n'
        )

    # Build rate string
    rate_pct = int((speed - 1.0) * 100)
    rate_str = f"{rate_pct:+d}%" if rate_pct != 0 else "0%"

    # Build pitch string
    pitch_str = f"{pitch:+.1f}st"

    # Wrap in SSML
    ssml = f"""<speak>
<prosody rate="{rate_str}" pitch="{pitch_str}" volume="{profile['volume']}">
{ssml_text}
</prosody>
</speak>"""

    return {
        "ssml": ssml,
        "voice_name": voice["google_voice"],
        "edge_voice": voice["edge_voice"],
        "speed": speed,
        "pitch": pitch,
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
    """Synthesize speech for the companion using the best available provider.

    Tries providers in order of quality:
    1. Google Cloud TTS (Neural2/Studio) - Premium
    2. Edge TTS (Microsoft Neural) - High quality fallback
    3. Returns SSML data for browser-side synthesis as ultimate fallback

    Returns dict with:
    - audio: bytes or None
    - content_type: "audio/mpeg" or None
    - ssml: The SSML used
    - provider: Which provider was used
    - voice_persona: Name of the voice character
    - fallback_to_browser: If True, frontend should use browser TTS
    """
    ssml_data = build_companion_ssml(text, mood, voice_id, language)

    # Try Google Cloud TTS first
    audio = await _try_google_tts(ssml_data)
    if audio:
        return {
            "audio": audio,
            "content_type": "audio/mpeg",
            "ssml": ssml_data["ssml"],
            "provider": "google_cloud_neural2",
            "voice_persona": ssml_data["voice_persona"],
            "quality_score": 9.5,
            "fallback_to_browser": False,
        }

    # Try Edge TTS
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

    # Return SSML for browser synthesis
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


async def _try_google_tts(ssml_data: dict) -> bytes | None:
    """Attempt synthesis via Google Cloud TTS."""
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
    """Attempt synthesis via Edge TTS (Microsoft Neural)."""
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
    """Select the best voice persona for a given mood.

    Calm moods get Ananya (meditation voice).
    Heavy emotions get Priya (nurturing).
    Energetic moods get Devi (motivating).
    Default is Maya (natural friend).
    """
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
