"""
Multilingual Voice API Routes

Provides endpoints for the world-class voice system:
- Language discovery and speaker catalog
- Speaker selection and preview
- Emotion-adaptive synthesis with speaker profiles
- User voice preference management
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

from backend.deps import get_current_user_flexible
from backend.middleware.rate_limiter import limiter
from backend.services.multilingual_voice_engine import (
    get_multilingual_voice_engine,
    SUPPORTED_LANGUAGES,
)

router = APIRouter(prefix="/voice/multilingual", tags=["multilingual-voice"])
logger = logging.getLogger(__name__)

VOICE_RATE_LIMIT = "30/minute"


# ===== Pydantic Models =====

class SpeakerSynthesizeRequest(BaseModel):
    """Request to synthesize with a specific speaker and emotion."""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to synthesize")
    speaker_id: str = Field(..., description="Speaker profile ID (e.g., 'en_priya')")
    emotion: str = Field("neutral", description="Emotional tone for delivery")
    style: Optional[str] = Field(None, description="Voice style override")
    preferred_provider: Optional[str] = Field(None, description="Preferred TTS provider")


class LanguageFilter(BaseModel):
    """Optional filters for language listing."""
    has_tts: Optional[bool] = None
    has_stt: Optional[bool] = None
    gita_available: Optional[bool] = None


# ===== API Endpoints =====

@router.get("/languages")
async def get_supported_languages():
    """
    Get all supported languages with metadata.

    Returns language codes, native names, script info, TTS/STT availability,
    and speaker counts for each language.
    """
    engine = get_multilingual_voice_engine()
    languages = engine.get_supported_languages()
    return {
        "languages": languages,
        "total_count": len(languages),
        "default_language": "en",
    }


@router.get("/speakers")
async def get_all_speakers():
    """
    Get all speakers grouped by language.

    Returns the complete speaker catalog with profiles, descriptions,
    quality scores, and personality information.
    """
    engine = get_multilingual_voice_engine()
    speakers = engine.get_all_speakers()
    total = sum(len(v) for v in speakers.values())
    return {
        "speakers": speakers,
        "total_count": total,
        "languages_with_speakers": len(speakers),
    }


@router.get("/speakers/{language}")
async def get_speakers_for_language(language: str):
    """
    Get available speakers for a specific language.

    Returns speaker profiles with voice characteristics, personality
    descriptions, and quality scores.
    """
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Language '{language}' not supported. Use /languages for available options."
        )

    engine = get_multilingual_voice_engine()
    speakers = engine.get_speakers_for_language(language)
    return {
        "language": language,
        "language_info": {
            "name": SUPPORTED_LANGUAGES[language].name,
            "native_name": SUPPORTED_LANGUAGES[language].native_name,
        },
        "speakers": speakers,
        "count": len(speakers),
    }


@router.get("/speaker/{speaker_id}")
async def get_speaker_details(speaker_id: str):
    """
    Get detailed information about a specific speaker.

    Returns complete profile including voice characteristics, personality,
    best-for tags, and preview text.
    """
    engine = get_multilingual_voice_engine()
    speaker = engine.get_speaker_dict(speaker_id)
    if not speaker:
        raise HTTPException(status_code=404, detail=f"Speaker '{speaker_id}' not found")

    return {"speaker": speaker}


@router.get("/speaker/{speaker_id}/preview")
async def get_speaker_preview(speaker_id: str):
    """
    Get preview configuration for a speaker.

    Returns the preview text and synthesis parameters to demo the voice.
    Frontend uses this to play a sample of the speaker's voice.
    """
    engine = get_multilingual_voice_engine()
    preview = engine.get_speaker_preview(speaker_id)
    if "error" in preview:
        raise HTTPException(status_code=404, detail=preview["error"])

    return preview


@router.post("/synthesize")
@limiter.limit(VOICE_RATE_LIMIT)
async def synthesize_with_speaker(
    request: Request,
    body: SpeakerSynthesizeRequest,
    current_user=Depends(get_current_user_flexible),
):
    """
    Synthesize speech with a specific speaker and emotion.

    Resolves the best available TTS provider for the speaker,
    applies emotion-adaptive prosody, and returns synthesis parameters.
    The actual audio generation is delegated to the main voice/synthesize endpoint.
    """
    engine = get_multilingual_voice_engine()
    synthesis_request = engine.build_synthesis_request(
        text=body.text,
        speaker_id=body.speaker_id,
        emotion=body.emotion,
        style=body.style,
        preferred_provider=body.preferred_provider,
    )

    return {
        "synthesis": synthesis_request,
        "message": "Use /api/voice/synthesize with these parameters for audio generation",
    }


@router.get("/recommend")
async def recommend_speaker(
    language: str = "en",
    gender: Optional[str] = None,
    style: Optional[str] = None,
):
    """
    Get the best recommended speaker for given preferences.

    Considers language, gender preference, and style to find the
    highest quality matching speaker.
    """
    engine = get_multilingual_voice_engine()
    speaker = engine.find_best_speaker(language, gender, style)
    if not speaker:
        raise HTTPException(
            status_code=404,
            detail=f"No speaker found for language '{language}' with given criteria"
        )

    return {
        "recommended_speaker": engine._speaker_to_dict(speaker),
        "criteria": {"language": language, "gender": gender, "style": style},
    }
