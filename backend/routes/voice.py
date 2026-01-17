"""
MindVibe Voice API Routes

Provides endpoints for text-to-speech synthesis across 17 languages
with caching, voice preferences, and batch operations.

Quantum Coherence: Voice transcends language barriers, making wisdom
accessible through sound vibrations that resonate with all beings.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
import logging

from backend.deps import get_db, get_user_id
from backend.services.tts_service import get_tts_service, VoiceType

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger(__name__)


# ===== Pydantic Models =====

class SynthesizeRequest(BaseModel):
    """Request to synthesize text to speech"""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to synthesize")
    language: str = Field("en", description="Language code (en, hi, ta, etc.)")
    voice_type: VoiceType = Field("friendly", description="Voice persona")
    speed: float = Field(0.9, ge=0.5, le=2.0, description="Speaking rate")
    pitch: float = Field(0.0, ge=-20.0, le=20.0, description="Voice pitch")


class VerseSynthesizeRequest(BaseModel):
    """Request to synthesize a Gita verse"""
    verse_id: str = Field(..., description="Verse ID (e.g., 'BG_2_47')")
    language: str = Field("en", description="Language code")
    include_commentary: bool = Field(False, description="Include commentary in audio")


class BatchDownloadRequest(BaseModel):
    """Request to batch download multiple audios"""
    verse_ids: List[str] = Field(..., max_items=20, description="List of verse IDs")
    language: str = Field("en", description="Language code")


class VoiceSettings(BaseModel):
    """User voice preferences"""
    enabled: bool = Field(True, description="Enable voice features")
    auto_play: bool = Field(False, description="Auto-play audio")
    speed: float = Field(0.9, ge=0.5, le=2.0, description="Default speaking rate")
    voice_gender: Literal["male", "female", "neutral"] = Field("female", description="Preferred voice gender")
    offline_download: bool = Field(False, description="Enable offline audio download")
    download_quality: Literal["low", "medium", "high"] = Field("medium", description="Audio quality for downloads")


class VoiceSettingsResponse(BaseModel):
    """Voice settings response"""
    settings: VoiceSettings
    supported_languages: List[str]


# ===== API Endpoints =====

@router.post("/synthesize")
async def synthesize_speech(
    payload: SynthesizeRequest,
    user_id: str = Depends(get_user_id)
) -> Response:
    """
    Synthesize text to speech

    Returns MP3 audio stream.
    """
    logger.info(f"TTS request from user {user_id}: {len(payload.text)} chars, lang={payload.language}")

    tts_service = get_tts_service()

    # Check if language is supported
    if payload.language not in tts_service.get_supported_languages():
        raise HTTPException(
            status_code=400,
            detail=f"Language '{payload.language}' not supported. "
                   f"Supported: {', '.join(tts_service.get_supported_languages())}"
        )

    # Generate audio
    audio_bytes = tts_service.synthesize(
        text=payload.text,
        language=payload.language,
        voice_type=payload.voice_type,
        speed=payload.speed,
        pitch=payload.pitch
    )

    if not audio_bytes:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate audio. TTS service unavailable."
        )

    # Return audio as MP3
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "inline; filename=speech.mp3",
            "Cache-Control": "public, max-age=604800"  # Cache for 1 week
        }
    )


@router.post("/verse/{verse_id}")
async def synthesize_verse(
    verse_id: str,
    language: str = "en",
    include_commentary: bool = False,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> Response:
    """
    Synthesize a Gita verse by ID

    Args:
        verse_id: Verse identifier (e.g., "BG_2_47")
        language: Language code
        include_commentary: Include commentary in audio

    Returns MP3 audio stream.
    """
    from sqlalchemy import select
    from backend.models import WisdomVerse

    logger.info(f"Verse TTS request: {verse_id}, lang={language}, user={user_id}")

    # Fetch verse from database
    result = await db.execute(
        select(WisdomVerse).where(WisdomVerse.id == verse_id)
    )
    verse = result.scalar_one_or_none()

    if not verse:
        raise HTTPException(status_code=404, detail=f"Verse {verse_id} not found")

    tts_service = get_tts_service()

    # Get text in requested language
    # Assuming verse has language-specific fields
    verse_text = getattr(verse, f"translation_{language}", verse.translation_en)
    commentary_text = getattr(verse, f"commentary_{language}", verse.commentary_en) if include_commentary else None

    # Generate audio
    audio_bytes = tts_service.synthesize_verse(
        verse_text=verse_text,
        language=language,
        include_commentary=include_commentary,
        commentary_text=commentary_text
    )

    if not audio_bytes:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate verse audio"
        )

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f"inline; filename={verse_id}_{language}.mp3",
            "Cache-Control": "public, max-age=2592000"  # Cache for 30 days (verses don't change)
        }
    )


@router.post("/message")
async def synthesize_message(
    payload: SynthesizeRequest,
    user_id: str = Depends(get_user_id)
) -> Response:
    """
    Synthesize a KIAAN message

    Optimized for conversational, friendly tone.
    """
    logger.info(f"KIAAN message TTS: {len(payload.text)} chars, user={user_id}")

    tts_service = get_tts_service()

    audio_bytes = tts_service.synthesize_kiaan_message(
        message=payload.text,
        language=payload.language
    )

    if not audio_bytes:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate message audio"
        )

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "inline; filename=kiaan_message.mp3",
            "Cache-Control": "public, max-age=3600"  # Cache for 1 hour
        }
    )


@router.post("/meditation")
async def synthesize_meditation(
    payload: SynthesizeRequest,
    user_id: str = Depends(get_user_id)
) -> Response:
    """
    Synthesize meditation guidance

    Optimized for calm, soothing tone with slower pace.
    """
    logger.info(f"Meditation TTS: {len(payload.text)} chars, user={user_id}")

    tts_service = get_tts_service()

    audio_bytes = tts_service.synthesize_meditation(
        meditation_script=payload.text,
        language=payload.language
    )

    if not audio_bytes:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate meditation audio"
        )

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "inline; filename=meditation.mp3",
            "Cache-Control": "public, max-age=86400"  # Cache for 1 day
        }
    )


@router.post("/batch-download")
async def batch_download_verses(
    payload: BatchDownloadRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Batch generate audio for multiple verses

    Returns URLs to download individual audio files.
    Used for offline caching.
    """
    from sqlalchemy import select
    from backend.models import WisdomVerse

    logger.info(f"Batch download: {len(payload.verse_ids)} verses, lang={payload.language}, user={user_id}")

    if len(payload.verse_ids) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 verses per batch")

    tts_service = get_tts_service()
    results = []

    for verse_id in payload.verse_ids:
        try:
            # Fetch verse
            result = await db.execute(
                select(WisdomVerse).where(WisdomVerse.id == verse_id)
            )
            verse = result.scalar_one_or_none()

            if not verse:
                results.append({
                    "verse_id": verse_id,
                    "status": "error",
                    "error": "Verse not found"
                })
                continue

            # Get text
            verse_text = getattr(verse, f"translation_{payload.language}", verse.translation_en)

            # Generate audio (will be cached)
            audio_bytes = tts_service.synthesize_verse(
                verse_text=verse_text,
                language=payload.language,
                include_commentary=False
            )

            if audio_bytes:
                results.append({
                    "verse_id": verse_id,
                    "status": "success",
                    "size_bytes": len(audio_bytes),
                    "url": f"/api/voice/verse/{verse_id}?language={payload.language}"
                })
            else:
                results.append({
                    "verse_id": verse_id,
                    "status": "error",
                    "error": "TTS generation failed"
                })

        except Exception as e:
            logger.error(f"Batch download error for {verse_id}: {e}")
            results.append({
                "verse_id": verse_id,
                "status": "error",
                "error": str(e)
            })

    success_count = sum(1 for r in results if r["status"] == "success")
    total_size = sum(r.get("size_bytes", 0) for r in results if r["status"] == "success")

    return {
        "total": len(payload.verse_ids),
        "success": success_count,
        "failed": len(payload.verse_ids) - success_count,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "results": results
    }


@router.get("/settings", response_model=VoiceSettingsResponse)
async def get_voice_settings(
    user_id: str = Depends(get_user_id)
) -> VoiceSettingsResponse:
    """
    Get user's voice settings

    Returns current voice preferences and supported languages.
    """
    # TODO: Load from database user_preferences table
    # For now, return defaults
    tts_service = get_tts_service()

    return VoiceSettingsResponse(
        settings=VoiceSettings(
            enabled=True,
            auto_play=False,
            speed=0.9,
            voice_gender="female",
            offline_download=False,
            download_quality="medium"
        ),
        supported_languages=tts_service.get_supported_languages()
    )


@router.put("/settings")
async def update_voice_settings(
    payload: VoiceSettings,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Update user's voice settings

    Stores preferences for future sessions.
    """
    logger.info(f"Updating voice settings for user {user_id}")

    # TODO: Store in database user_preferences table
    # For now, just acknowledge

    return {
        "status": "success",
        "message": "Voice settings updated",
        "settings": payload.dict()
    }


@router.get("/supported-languages")
async def get_supported_languages() -> dict:
    """
    Get list of supported languages for TTS

    Returns language codes and names.
    """
    tts_service = get_tts_service()

    language_names = {
        "en": "English",
        "hi": "Hindi",
        "ta": "Tamil",
        "te": "Telugu",
        "bn": "Bengali",
        "mr": "Marathi",
        "gu": "Gujarati",
        "kn": "Kannada",
        "ml": "Malayalam",
        "pa": "Punjabi",
        "sa": "Sanskrit",
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "pt": "Portuguese",
        "ja": "Japanese",
        "zh": "Chinese"
    }

    supported_codes = tts_service.get_supported_languages()

    return {
        "count": len(supported_codes),
        "languages": [
            {
                "code": code,
                "name": language_names.get(code, code)
            }
            for code in supported_codes
        ]
    }


@router.delete("/cache")
async def clear_voice_cache(
    user_id: str = Depends(get_user_id)
) -> dict:
    """
    Clear TTS cache

    Admin endpoint to clear cached audio.
    """
    logger.info(f"Clearing voice cache (requested by {user_id})")

    tts_service = get_tts_service()
    tts_service.clear_cache()

    return {
        "status": "success",
        "message": "Voice cache cleared"
    }
