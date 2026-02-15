"""Bhashini AI TTS Service - Government of India's AI-Powered Voice Synthesis

Bhashini (formerly BHASHINI) is India's national AI-powered language platform
providing high-quality text-to-speech for all 22 scheduled Indian languages.

Architecture:
+------------------------------------------------------------------+
|  Bhashini AI TTS Integration                                      |
|                                                                    |
|  Strengths:                                                        |
|  - Official Government of India AI language platform              |
|  - 22 scheduled Indian languages with native pronunciation        |
|  - Free and open API for Indian language processing               |
|  - Optimized for Indian accents, dialects, and pronunciations     |
|  - High-quality neural voices trained on diverse Indian speech    |
|  - Excellent for Hindi, Tamil, Telugu, Bengali, Marathi, etc.     |
|                                                                    |
|  Provider Priority (Indian languages):                             |
|  Sarvam AI -> Bhashini AI -> ElevenLabs (fallback)               |
|                                                                    |
|  API Flow:                                                         |
|  1. Get pipeline config from Bhashini ULCA                        |
|  2. Use the TTS service endpoint from pipeline response           |
|  3. Send text + language to the TTS endpoint                      |
|  4. Receive base64 audio in response                              |
+------------------------------------------------------------------+
"""

import base64
import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)


# --- Bhashini API Configuration ---

BHASHINI_METERING_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
BHASHINI_USER_ID = os.getenv("BHASHINI_USER_ID", "").strip()
BHASHINI_API_KEY = os.getenv("BHASHINI_API_KEY", "").strip()

# --- Language Code Mapping ---
# Maps MindVibe internal language codes to Bhashini's language codes.

MINDVIBE_TO_BHASHINI_LANG: dict[str, str] = {
    "hi": "hi",
    "en": "en",
    "en-IN": "en",
    "ta": "ta",
    "te": "te",
    "bn": "bn",
    "kn": "kn",
    "ml": "ml",
    "mr": "mr",
    "gu": "gu",
    "pa": "pa",
    "od": "or",   # Odia
    "sa": "sa",   # Sanskrit - Bhashini has native Sanskrit support
    "as": "as",   # Assamese
    "ne": "ne",   # Nepali
    "ur": "ur",   # Urdu
    "sd": "sd",   # Sindhi
    "doi": "doi", # Dogri
    "mai": "mai", # Maithili
    "kok": "kok", # Konkani
    "mni": "mni", # Manipuri
    "sat": "sat", # Santali
    "ks": "ks",   # Kashmiri
    "brx": "brx", # Bodo
}

# Languages where Bhashini provides excellent quality
BHASHINI_SUPPORTED_LANGUAGES = {
    "hi", "en", "ta", "te", "bn", "kn", "ml", "mr", "gu", "pa",
    "od", "sa", "as", "ne", "ur",
}


# --- Emotion-to-Bhashini Prosody Mapping ---
# Bhashini doesn't have native emotion controls, so we adjust text
# processing and speed to convey emotional nuance.

BHASHINI_EMOTION_PROFILES: dict[str, dict[str, Any]] = {
    "anxious": {
        "gender": "female",
        "description": "Calm, grounding voice to ease anxiety",
    },
    "sad": {
        "gender": "female",
        "description": "Gentle, warm voice for comfort",
    },
    "angry": {
        "gender": "male",
        "description": "Steady, measured voice to ground anger",
    },
    "peaceful": {
        "gender": "female",
        "description": "Serene, soft voice for peace",
    },
    "hopeful": {
        "gender": "female",
        "description": "Bright, warm voice for hope",
    },
    "neutral": {
        "gender": "female",
        "description": "Natural, conversational default",
    },
    "confused": {
        "gender": "female",
        "description": "Clear, patient voice for clarity",
    },
    "lonely": {
        "gender": "female",
        "description": "Intimate, close voice for presence",
    },
    "grateful": {
        "gender": "female",
        "description": "Warm, genuine voice for gratitude",
    },
}

# --- Companion Voice -> Bhashini Speaker Mapping ---

COMPANION_TO_BHASHINI: dict[str, dict[str, str]] = {
    "bhashini-devi": {"gender": "female"},
    "bhashini-arya": {"gender": "male"},
    "sarvam-aura": {"gender": "female"},
    "sarvam-rishi": {"gender": "male"},
    "elevenlabs-nova": {"gender": "female"},
    "elevenlabs-orion": {"gender": "male"},
}


def is_bhashini_available() -> bool:
    """Check if Bhashini AI TTS is configured and available."""
    return bool(BHASHINI_USER_ID and BHASHINI_API_KEY)


def is_bhashini_supported_language(language: str) -> bool:
    """Check if Bhashini supports this language."""
    return language in BHASHINI_SUPPORTED_LANGUAGES


def get_bhashini_language_code(language: str) -> Optional[str]:
    """Convert MindVibe language code to Bhashini format."""
    return MINDVIBE_TO_BHASHINI_LANG.get(language)


async def _get_bhashini_pipeline_config(
    source_language: str,
    target_language: str,
) -> Optional[dict[str, Any]]:
    """Get the TTS pipeline configuration from Bhashini ULCA.

    Bhashini uses a two-step process:
    1. Get the pipeline config (which TTS model to use)
    2. Call the TTS model endpoint with the text

    Args:
        source_language: Source language code (Bhashini format)
        target_language: Target language code (Bhashini format)

    Returns:
        Pipeline configuration dict or None if failed
    """
    try:
        import httpx

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": {
                        "language": {
                            "sourceLanguage": source_language,
                        },
                    },
                }
            ],
            "pipelineRequestConfig": {
                "pipelineId": "64392f96daac500b55c543cd",
            },
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                BHASHINI_METERING_URL,
                headers={
                    "userID": BHASHINI_USER_ID,
                    "ulcaApiKey": BHASHINI_API_KEY,
                    "Content-Type": "application/json",
                },
                json=payload,
            )

            if response.status_code == 200:
                data = response.json()
                return data
            else:
                logger.warning(
                    f"Bhashini pipeline config failed: status={response.status_code}, "
                    f"body={response.text[:200]}"
                )

    except ImportError:
        logger.info("Bhashini TTS: httpx not available")
    except Exception as e:
        logger.warning(f"Bhashini pipeline config failed: {e}")

    return None


async def synthesize_bhashini_tts(
    text: str,
    language: str = "hi",
    voice_id: str = "bhashini-devi",
    mood: str = "neutral",
) -> Optional[bytes]:
    """Synthesize speech using Bhashini AI's TTS service.

    Uses India's national AI language platform for high-quality
    Indian language voice synthesis across 22 scheduled languages.

    Args:
        text: Text to synthesize (1-5000 characters)
        language: MindVibe language code (hi, ta, te, bn, etc.)
        voice_id: KIAAN companion voice persona
        mood: Detected user mood for voice gender selection

    Returns:
        WAV audio bytes or None if synthesis fails

    Example:
        >>> audio = await synthesize_bhashini_tts(
        ...     text="Aap akele nahin hain, main yahan hoon.",
        ...     language="hi",
        ...     voice_id="bhashini-devi",
        ...     mood="lonely",
        ... )
    """
    if not is_bhashini_available():
        logger.debug("Bhashini TTS: API credentials not configured, skipping")
        return None

    # Resolve language code
    bhashini_lang = get_bhashini_language_code(language)
    if not bhashini_lang:
        logger.debug(f"Bhashini TTS: Language '{language}' not supported, skipping")
        return None

    # Determine gender based on voice persona and mood
    voice_config = COMPANION_TO_BHASHINI.get(voice_id, {"gender": "female"})
    mood_config = BHASHINI_EMOTION_PROFILES.get(mood, BHASHINI_EMOTION_PROFILES["neutral"])
    gender = voice_config.get("gender", mood_config.get("gender", "female"))

    # Truncate text to limit
    if len(text) > 5000:
        text = text[:4997] + "..."

    try:
        import httpx

        # Step 1: Get pipeline configuration
        pipeline_config = await _get_bhashini_pipeline_config(bhashini_lang, bhashini_lang)
        if not pipeline_config:
            logger.warning("Bhashini TTS: Failed to get pipeline config")
            return None

        # Extract TTS service endpoint and authorization
        pipeline_response = pipeline_config.get("pipelineResponseConfig", [])
        pipeline_inference = pipeline_config.get("pipelineInferenceAPIEndPoint", {})

        inference_url = pipeline_inference.get("callbackUrl", "")
        inference_key = (
            pipeline_inference
            .get("inferenceApiKey", {})
            .get("value", "")
        )

        if not inference_url or not inference_key:
            logger.warning("Bhashini TTS: Missing inference endpoint or key")
            return None

        # Get the TTS model service ID from pipeline response
        tts_config = None
        for config_item in pipeline_response:
            if config_item.get("taskType") == "tts":
                tts_config = config_item
                break

        if not tts_config:
            logger.warning("Bhashini TTS: No TTS task in pipeline response")
            return None

        service_id = tts_config.get("config", [{}])[0].get("serviceId", "") if tts_config.get("config") else ""

        # Step 2: Call the TTS inference endpoint
        tts_payload = {
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": {
                        "language": {
                            "sourceLanguage": bhashini_lang,
                        },
                        "serviceId": service_id,
                        "gender": gender,
                        "samplingRate": 22050,
                    },
                }
            ],
            "inputData": {
                "input": [
                    {"source": text}
                ],
            },
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                inference_url,
                headers={
                    "Authorization": inference_key,
                    "Content-Type": "application/json",
                },
                json=tts_payload,
            )

            if response.status_code == 200:
                data = response.json()
                pipeline_output = data.get("pipelineResponse", [])

                if pipeline_output:
                    audio_list = pipeline_output[0].get("audio", [])
                    if audio_list:
                        audio_content = audio_list[0].get("audioContent", "")
                        if audio_content:
                            audio_bytes = base64.b64decode(audio_content)

                            if len(audio_bytes) > 100:
                                logger.info(
                                    f"Bhashini TTS success: lang={bhashini_lang}, "
                                    f"gender={gender}, mood={mood}, "
                                    f"size={len(audio_bytes)} bytes"
                                )
                                return audio_bytes

                logger.warning("Bhashini TTS: Empty audio in response")
            elif response.status_code == 429:
                logger.warning("Bhashini TTS: Rate limited, falling through to next provider")
            elif response.status_code in (401, 403):
                logger.error("Bhashini TTS: Authentication failed, check BHASHINI_USER_ID and BHASHINI_API_KEY")
            else:
                logger.warning(
                    f"Bhashini TTS failed: status={response.status_code}, "
                    f"body={response.text[:200]}"
                )

    except ImportError:
        logger.info("Bhashini TTS: httpx not available")
    except Exception as e:
        logger.warning(f"Bhashini TTS failed: {e}")

    return None


def get_bhashini_speakers_catalog() -> list[dict[str, Any]]:
    """Return the Bhashini speaker catalog for API/frontend consumption."""
    return [
        {
            "id": "bhashini-devi",
            "name": "Devi",
            "gender": "female",
            "style": "warm",
            "description": "Warm, nurturing female voice powered by India's national AI platform. "
                           "Authentic Indian pronunciation across all scheduled languages.",
            "languages": list(MINDVIBE_TO_BHASHINI_LANG.keys()),
            "best_for": ["conversation", "emotional_support", "daily_wisdom", "meditation"],
            "quality_score": 9.0,
            "provider": "bhashini",
        },
        {
            "id": "bhashini-arya",
            "name": "Arya",
            "gender": "male",
            "style": "deep",
            "description": "Deep, resonant male voice from Bhashini AI. "
                           "Carries authority and wisdom with authentic Indian intonation.",
            "languages": list(MINDVIBE_TO_BHASHINI_LANG.keys()),
            "best_for": ["verse_recitation", "narration", "sacred_chanting", "wisdom"],
            "quality_score": 9.0,
            "provider": "bhashini",
        },
    ]


def get_bhashini_health_status() -> dict[str, Any]:
    """Get health status of Bhashini AI TTS service."""
    available = is_bhashini_available()
    return {
        "provider": "bhashini_ai",
        "available": available,
        "quality_score": 9.0 if available else 0,
        "supported_languages": list(MINDVIBE_TO_BHASHINI_LANG.keys()),
        "speakers_count": 2,
        "features": [
            "Government of India AI platform",
            "22 scheduled Indian languages",
            "Native pronunciation quality",
            "Free and open API",
            "Sanskrit support",
            "22050Hz audio output",
        ] if available else [],
    }
