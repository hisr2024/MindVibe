"""
MindVibe Voice API Routes

Provides endpoints for text-to-speech synthesis across 17 languages
with caching, voice preferences, and batch operations.

Quantum Coherence: Voice transcends language barriers, making wisdom
accessible through sound vibrations that resonate with all beings.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
import logging
import re

from backend.deps import get_db, get_current_user_flexible
from backend.middleware.rate_limiter import limiter
from backend.services.tts_service import (
    get_tts_service,
    get_tts_health_status,
    get_tts_provider_quality_info,
    VoiceType
)

# Rate limit for voice synthesis (resource-intensive)
VOICE_RATE_LIMIT = "10/minute"

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger(__name__)


def _sanitize_filename(value: str) -> str:
    """Sanitize a string for use in Content-Disposition filename.

    Removes/replaces characters that could cause header injection or path traversal.
    """
    # Remove newlines and carriage returns (CRLF injection prevention)
    value = value.replace("\r", "").replace("\n", "")
    # Remove path separators
    value = value.replace("/", "_").replace("\\", "_")
    # Remove quotes and semicolons that could break headers
    value = value.replace('"', "").replace("'", "").replace(";", "_")
    # Only allow alphanumeric, underscore, hyphen, and dot
    value = re.sub(r"[^a-zA-Z0-9_\-.]", "_", value)
    # Limit length
    return value[:100]


# ===== Pydantic Models =====

class SynthesizeRequest(BaseModel):
    """Request to synthesize text to speech with ULTRA-NATURAL voice settings"""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to synthesize")
    language: str = Field("en", description="Language code (en, hi, ta, etc.)")
    voice_type: VoiceType = Field("friendly", description="Voice persona (calm, wisdom, friendly)")
    # Speed defaults match VOICE_TYPE_SETTINGS in tts_service.py:
    # calm=0.92, wisdom=0.94, friendly=0.97
    # Using None as default so backend applies voice type-specific defaults
    speed: Optional[float] = Field(None, ge=0.5, le=2.0, description="Speaking rate (defaults to voice type optimal)")
    pitch: Optional[float] = Field(None, ge=-20.0, le=20.0, description="Voice pitch (defaults to voice type optimal)")


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
@limiter.limit(VOICE_RATE_LIMIT)
async def synthesize_speech(
    request: Request,
    payload: SynthesizeRequest,
    user_id: str = Depends(get_current_user_flexible)
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
@limiter.limit(VOICE_RATE_LIMIT)
async def synthesize_verse(
    request: Request,
    verse_id: str,
    language: str = "en",
    include_commentary: bool = False,
    user_id: str = Depends(get_current_user_flexible),
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

    # Sanitize filename to prevent header injection
    safe_verse_id = _sanitize_filename(verse_id)
    safe_language = _sanitize_filename(language)
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f"inline; filename={safe_verse_id}_{safe_language}.mp3",
            "Cache-Control": "public, max-age=2592000"  # Cache for 30 days (verses don't change)
        }
    )


@router.post("/message")
async def synthesize_message(
    payload: SynthesizeRequest,
    user_id: str = Depends(get_current_user_flexible)
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
    user_id: str = Depends(get_current_user_flexible)
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
    user_id: str = Depends(get_current_user_flexible),
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
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> VoiceSettingsResponse:
    """
    Get user's voice settings

    Returns current voice preferences and supported languages.
    """
    from sqlalchemy import select
    from backend.models import UserVoicePreferences

    tts_service = get_tts_service()

    # Load from database
    result = await db.execute(
        select(UserVoicePreferences).where(UserVoicePreferences.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()

    if prefs:
        return VoiceSettingsResponse(
            settings=VoiceSettings(
                enabled=prefs.voice_enabled,
                auto_play=prefs.auto_play_enabled,
                speed=float(prefs.speaking_rate),
                voice_gender=prefs.preferred_voice_gender,
                offline_download=prefs.offline_enabled,
                download_quality=prefs.audio_quality
            ),
            supported_languages=tts_service.get_supported_languages()
        )

    # Return defaults if no preferences exist
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
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Update user's voice settings

    Stores preferences for future sessions.
    """
    from sqlalchemy import select
    from backend.models import UserVoicePreferences
    from datetime import datetime

    logger.info(f"Updating voice settings for user {user_id}")

    # Check if preferences exist
    result = await db.execute(
        select(UserVoicePreferences).where(UserVoicePreferences.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()

    if prefs:
        # Update existing preferences
        prefs.voice_enabled = payload.enabled
        prefs.auto_play_enabled = payload.auto_play
        prefs.speaking_rate = payload.speed
        prefs.preferred_voice_gender = payload.voice_gender
        prefs.offline_enabled = payload.offline_download
        prefs.audio_quality = payload.download_quality
        prefs.updated_at = datetime.utcnow()
    else:
        # Create new preferences
        prefs = UserVoicePreferences(
            user_id=user_id,
            voice_enabled=payload.enabled,
            auto_play_enabled=payload.auto_play,
            speaking_rate=payload.speed,
            preferred_voice_gender=payload.voice_gender,
            offline_enabled=payload.offline_download,
            audio_quality=payload.download_quality,
        )
        db.add(prefs)

    await db.commit()

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
    user_id: str = Depends(get_current_user_flexible)
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


@router.get("/health")
async def get_voice_health() -> dict:
    """
    Get voice system health status.

    Returns:
        - Overall health status (healthy/degraded/limited/unavailable)
        - Active TTS provider and quality tier
        - Available features (emotion detection, SSML, offline support)

    This endpoint helps the frontend:
    1. Display voice quality indicators to users
    2. Show appropriate messages during fallback scenarios
    3. Decide whether to enable/disable voice features
    """
    return get_tts_health_status()


@router.get("/quality")
async def get_voice_quality_info() -> dict:
    """
    Get detailed voice quality information.

    Returns quality scores and feature availability for each TTS provider.
    Useful for debugging and displaying quality indicators.
    """
    return get_tts_provider_quality_info()


# ===== Elite Voice Query Endpoint =====

class VoiceQueryRequest(BaseModel):
    """Request for voice-based KIAAN query"""
    query: str = Field(..., min_length=1, max_length=2000, description="User's voice query")
    language: str = Field("en", description="Language code")
    history: List[dict] = Field(default_factory=list, description="Recent conversation history")


class VoiceQueryResponse(BaseModel):
    """Response for voice query"""
    response: str = Field(..., description="KIAAN's response")
    verses: List[dict] = Field(default_factory=list, description="Related Gita verses")
    concern: str = Field("general", description="Detected concern")
    confidence: float = Field(0.0, description="Concern detection confidence")


@router.post("/query", response_model=VoiceQueryResponse)
async def process_voice_query(
    payload: VoiceQueryRequest,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> VoiceQueryResponse:
    """
    Process a voice query and return KIAAN's response

    Elite voice AI endpoint that:
    - Detects user concerns (anxiety, stress, etc.)
    - Finds relevant Gita verses
    - Generates compassionate, wisdom-based response
    - Optimized for voice interaction (<300ms target)

    Used by the KIAAN Voice UI for real-time conversations.
    """
    import time
    start_time = time.time()

    logger.info(f"Voice query from user {user_id}: {payload.query[:50]}...")

    try:
        # Import KIAAN Core service for response generation
        from backend.services.kiaan_core import KIAANCore

        # Initialize KIAAN Core
        kiaan = KIAANCore()

        # Build conversation history context
        history_context = ""
        if payload.history:
            for msg in payload.history[-4:]:  # Last 4 messages for context
                role = msg.get("role", "user")
                content = msg.get("content", "")
                history_context += f"{role.capitalize()}: {content}\n"

        # Combine query with history context
        full_message = payload.query
        if history_context:
            full_message = f"Previous conversation:\n{history_context}\n\nCurrent question: {payload.query}"

        # Get KIAAN response with verse references
        kiaan_result = await kiaan.get_kiaan_response(
            message=full_message,
            user_id=user_id,
            db=db,
            context="voice_assistant",
            stream=False,
            language=payload.language
        )

        response_time = time.time() - start_time
        logger.info(f"Voice query processed in {response_time:.3f}s")

        # Extract verses used for response
        verses_used = kiaan_result.get("verses_used", [])
        verses_data = [
            {
                "id": v.get("id", ""),
                "chapter": v.get("chapter", 0),
                "verse": v.get("verse", 0),
                "text": v.get("text", "")
            }
            for v in verses_used
        ] if verses_used else []

        return VoiceQueryResponse(
            response=kiaan_result.get("response", "I'm here for you. How can I help?"),
            verses=verses_data,
            concern=kiaan_result.get("context", "general"),
            confidence=0.8 if kiaan_result.get("validation", {}).get("valid", False) else 0.5
        )

    except Exception as e:
        logger.error(f"Voice query error: {e}")

        # Fallback response
        return VoiceQueryResponse(
            response="I'm here with you. Could you try asking that again? I want to understand and support you better.",
            verses=[],
            concern="general",
            confidence=0.0
        )


# ===== Enhanced Voice Settings Endpoints =====

class EnhancedVoiceSettings(BaseModel):
    """Enhanced voice settings with all options"""
    # Core settings
    enabled: bool = True
    auto_play: bool = False
    speed: float = Field(0.9, ge=0.5, le=2.0)
    pitch: float = Field(0.0, ge=-20.0, le=20.0)
    voice_gender: Literal["male", "female", "neutral"] = "female"
    voice_type: Literal["calm", "wisdom", "friendly"] = "friendly"

    # Language
    preferred_language: str = "en"
    secondary_language: Optional[str] = None
    auto_detect_language: bool = True

    # Wake word
    wake_word_enabled: bool = True
    custom_wake_word: str = "Hey KIAAN"

    # Quality
    audio_quality: Literal["low", "medium", "high", "ultra"] = "high"

    # Offline
    offline_enabled: bool = False

    # Enhancements
    binaural_beats_enabled: bool = False
    binaural_frequency: str = "alpha"
    spatial_audio_enabled: bool = False
    breathing_sync_enabled: bool = False
    ambient_sounds_enabled: bool = False
    ambient_sound_type: str = "nature"

    # Accessibility
    haptic_feedback: bool = True


@router.get("/settings/enhanced")
async def get_enhanced_voice_settings(
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Get complete voice settings with all enhancements."""
    from sqlalchemy import select
    from backend.models import UserVoicePreferences

    result = await db.execute(
        select(UserVoicePreferences).where(UserVoicePreferences.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()

    tts_service = get_tts_service()

    if prefs:
        return {
            "settings": {
                "enabled": prefs.voice_enabled,
                "auto_play": prefs.auto_play_enabled,
                "speed": float(prefs.speaking_rate),
                "pitch": float(prefs.voice_pitch),
                "voice_gender": prefs.preferred_voice_gender,
                "voice_type": prefs.preferred_voice_type,
                "preferred_language": prefs.preferred_language,
                "secondary_language": prefs.secondary_language,
                "auto_detect_language": prefs.auto_detect_language,
                "wake_word_enabled": prefs.wake_word_enabled,
                "custom_wake_word": prefs.custom_wake_word,
                "audio_quality": prefs.audio_quality,
                "offline_enabled": prefs.offline_enabled,
                "offline_verses_downloaded": prefs.offline_verses_downloaded,
                "binaural_beats_enabled": prefs.binaural_beats_enabled,
                "binaural_frequency": prefs.binaural_frequency,
                "spatial_audio_enabled": prefs.spatial_audio_enabled,
                "breathing_sync_enabled": prefs.breathing_sync_enabled,
                "ambient_sounds_enabled": prefs.ambient_sounds_enabled,
                "ambient_sound_type": prefs.ambient_sound_type,
                "haptic_feedback": prefs.haptic_feedback,
            },
            "supported_languages": tts_service.get_supported_languages(),
            "voice_types": ["calm", "wisdom", "friendly"],
            "audio_qualities": ["low", "medium", "high", "ultra"],
            "binaural_frequencies": ["delta", "theta", "alpha", "beta", "gamma"],
            "ambient_sounds": ["nature", "rain", "ocean", "forest", "fire", "wind"],
        }

    # Return defaults
    return {
        "settings": EnhancedVoiceSettings().dict(),
        "supported_languages": tts_service.get_supported_languages(),
        "voice_types": ["calm", "wisdom", "friendly"],
        "audio_qualities": ["low", "medium", "high", "ultra"],
        "binaural_frequencies": ["delta", "theta", "alpha", "beta", "gamma"],
        "ambient_sounds": ["nature", "rain", "ocean", "forest", "fire", "wind"],
    }


@router.put("/settings/enhanced")
async def update_enhanced_voice_settings(
    payload: EnhancedVoiceSettings,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Update complete voice settings with all enhancements."""
    from sqlalchemy import select
    from backend.models import UserVoicePreferences
    from datetime import datetime

    logger.info(f"Updating enhanced voice settings for user {user_id}")

    result = await db.execute(
        select(UserVoicePreferences).where(UserVoicePreferences.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()

    if prefs:
        # Update all fields
        prefs.voice_enabled = payload.enabled
        prefs.auto_play_enabled = payload.auto_play
        prefs.speaking_rate = payload.speed
        prefs.voice_pitch = payload.pitch
        prefs.preferred_voice_gender = payload.voice_gender
        prefs.preferred_voice_type = payload.voice_type
        prefs.preferred_language = payload.preferred_language
        prefs.secondary_language = payload.secondary_language
        prefs.auto_detect_language = payload.auto_detect_language
        prefs.wake_word_enabled = payload.wake_word_enabled
        prefs.custom_wake_word = payload.custom_wake_word
        prefs.audio_quality = payload.audio_quality
        prefs.offline_enabled = payload.offline_enabled
        prefs.binaural_beats_enabled = payload.binaural_beats_enabled
        prefs.binaural_frequency = payload.binaural_frequency
        prefs.spatial_audio_enabled = payload.spatial_audio_enabled
        prefs.breathing_sync_enabled = payload.breathing_sync_enabled
        prefs.ambient_sounds_enabled = payload.ambient_sounds_enabled
        prefs.ambient_sound_type = payload.ambient_sound_type
        prefs.haptic_feedback = payload.haptic_feedback
        prefs.updated_at = datetime.utcnow()
    else:
        prefs = UserVoicePreferences(
            user_id=user_id,
            voice_enabled=payload.enabled,
            auto_play_enabled=payload.auto_play,
            speaking_rate=payload.speed,
            voice_pitch=payload.pitch,
            preferred_voice_gender=payload.voice_gender,
            preferred_voice_type=payload.voice_type,
            preferred_language=payload.preferred_language,
            secondary_language=payload.secondary_language,
            auto_detect_language=payload.auto_detect_language,
            wake_word_enabled=payload.wake_word_enabled,
            custom_wake_word=payload.custom_wake_word,
            audio_quality=payload.audio_quality,
            offline_enabled=payload.offline_enabled,
            binaural_beats_enabled=payload.binaural_beats_enabled,
            binaural_frequency=payload.binaural_frequency,
            spatial_audio_enabled=payload.spatial_audio_enabled,
            breathing_sync_enabled=payload.breathing_sync_enabled,
            ambient_sounds_enabled=payload.ambient_sounds_enabled,
            ambient_sound_type=payload.ambient_sound_type,
            haptic_feedback=payload.haptic_feedback,
        )
        db.add(prefs)

    await db.commit()

    return {
        "status": "success",
        "message": "Enhanced voice settings updated",
    }


# ===== Voice Conversation History =====

@router.get("/history")
async def get_voice_history(
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Get user's voice conversation history."""
    from backend.services.voice_analytics_service import get_voice_analytics_service

    analytics_service = get_voice_analytics_service(db)
    history = await analytics_service.get_conversation_history(
        user_id=user_id,
        limit=limit,
        offset=offset
    )

    return {
        "conversations": history,
        "count": len(history),
        "limit": limit,
        "offset": offset
    }


@router.post("/history/{conversation_id}/feedback")
async def submit_conversation_feedback(
    conversation_id: str,
    rating: Optional[int] = None,
    feedback: Optional[str] = None,
    was_helpful: Optional[bool] = None,
    verses_helpful: Optional[bool] = None,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Submit feedback for a voice conversation."""
    from backend.services.voice_analytics_service import get_voice_analytics_service

    analytics_service = get_voice_analytics_service(db)
    conversation = await analytics_service.update_conversation_feedback(
        conversation_id=conversation_id,
        user_rating=rating,
        user_feedback=feedback,
        was_helpful=was_helpful,
        verses_helpful=verses_helpful
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {
        "status": "success",
        "message": "Feedback submitted"
    }


# ===== Voice Enhancement Sessions =====

class EnhancementSessionRequest(BaseModel):
    """Request to start an enhancement session."""
    session_type: Literal["binaural", "spatial", "breathing", "ambient", "sleep", "meditation"]
    config: dict = Field(default_factory=dict)
    binaural_frequency: Optional[str] = None
    breathing_pattern: Optional[str] = None
    ambient_type: Optional[str] = None
    ambient_volume: Optional[float] = None


@router.post("/enhancement/start")
async def start_enhancement_session(
    payload: EnhancementSessionRequest,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Start a voice enhancement session."""
    from backend.services.voice_analytics_service import get_voice_analytics_service

    analytics_service = get_voice_analytics_service(db)
    session = await analytics_service.start_enhancement_session(
        user_id=user_id,
        session_type=payload.session_type,
        enhancement_config=payload.config,
        binaural_frequency=payload.binaural_frequency,
        breathing_pattern=payload.breathing_pattern,
        ambient_type=payload.ambient_type,
        ambient_volume=payload.ambient_volume,
    )

    return {
        "session_id": session.id,
        "session_type": session.session_type,
        "started_at": session.started_at.isoformat()
    }


@router.post("/enhancement/{session_id}/end")
async def end_enhancement_session(
    session_id: str,
    duration_seconds: int,
    completed: bool = True,
    effectiveness_rating: Optional[int] = None,
    breath_count: Optional[int] = None,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """End a voice enhancement session."""
    from backend.services.voice_analytics_service import get_voice_analytics_service

    analytics_service = get_voice_analytics_service(db)
    session = await analytics_service.end_enhancement_session(
        session_id=session_id,
        duration_seconds=duration_seconds,
        completed=completed,
        effectiveness_rating=effectiveness_rating,
        breath_count=breath_count
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "status": "success",
        "session_id": session.id,
        "duration_seconds": session.duration_seconds,
        "completed": session.completed
    }


# ===== Daily Check-in =====

class DailyCheckinRequest(BaseModel):
    """Daily voice check-in request."""
    is_morning: bool = True
    mood: Optional[str] = None
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    detected_emotions: Optional[dict] = None
    voice_sentiment_score: Optional[float] = None
    affirmation_played: Optional[str] = None
    affirmation_resonated: Optional[bool] = None


@router.post("/checkin")
async def submit_daily_checkin(
    payload: DailyCheckinRequest,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Submit a daily voice check-in."""
    from backend.services.voice_analytics_service import get_voice_analytics_service

    analytics_service = get_voice_analytics_service(db)
    checkin = await analytics_service.log_daily_checkin(
        user_id=user_id,
        is_morning=payload.is_morning,
        mood=payload.mood,
        energy_level=payload.energy_level,
        stress_level=payload.stress_level,
        detected_emotions=payload.detected_emotions,
        voice_sentiment_score=payload.voice_sentiment_score,
        affirmation_played=payload.affirmation_played,
        affirmation_resonated=payload.affirmation_resonated,
    )

    return {
        "status": "success",
        "checkin_date": str(checkin.checkin_date),
        "type": "morning" if payload.is_morning else "evening"
    }


# ===== Wake Word Events =====

class WakeWordEventRequest(BaseModel):
    """Wake word detection event."""
    wake_word_detected: str
    session_id: Optional[str] = None
    detection_confidence: Optional[float] = None
    is_valid_activation: bool = True
    ambient_noise_level: Optional[float] = None
    device_type: Optional[str] = None
    browser_type: Optional[str] = None


@router.post("/wake-word/event")
async def log_wake_word_event(
    payload: WakeWordEventRequest,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Log a wake word detection event."""
    from backend.services.voice_analytics_service import get_voice_analytics_service

    analytics_service = get_voice_analytics_service(db)
    event = await analytics_service.log_wake_word_event(
        wake_word_detected=payload.wake_word_detected,
        user_id=user_id,
        session_id=payload.session_id,
        detection_confidence=payload.detection_confidence,
        is_valid_activation=payload.is_valid_activation,
        ambient_noise_level=payload.ambient_noise_level,
        device_type=payload.device_type,
        browser_type=payload.browser_type,
    )

    return {
        "status": "success",
        "event_id": event.id
    }


# ===== Enhanced Voice Query with Logging =====

class EnhancedVoiceQueryRequest(BaseModel):
    """Enhanced voice query with full metrics."""
    query: str = Field(..., min_length=1, max_length=2000)
    language: str = "en"
    history: List[dict] = Field(default_factory=list)
    session_id: Optional[str] = None
    mood_at_time: Optional[str] = None
    speech_to_text_ms: Optional[int] = None
    user_audio_duration_ms: Optional[int] = None


@router.post("/query/enhanced")
async def process_enhanced_voice_query(
    payload: EnhancedVoiceQueryRequest,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Process voice query with full analytics logging.

    This enhanced endpoint logs all metrics for analytics.
    """
    import time
    import uuid
    start_time = time.time()

    session_id = payload.session_id or str(uuid.uuid4())

    logger.info(f"Enhanced voice query from user {user_id}: {payload.query[:50]}...")

    try:
        from backend.services.kiaan_core import KIAANCore
        from backend.services.voice_analytics_service import get_voice_analytics_service

        kiaan = KIAANCore()
        analytics_service = get_voice_analytics_service(db)

        # Build conversation context
        history_context = ""
        if payload.history:
            for msg in payload.history[-4:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                history_context += f"{role.capitalize()}: {content}\n"

        full_message = payload.query
        if history_context:
            full_message = f"Previous conversation:\n{history_context}\n\nCurrent question: {payload.query}"

        # Get KIAAN response
        ai_start = time.time()
        kiaan_result = await kiaan.get_kiaan_response(
            message=full_message,
            user_id=user_id,
            db=db,
            context="voice_assistant",
            stream=False,
            language=payload.language
        )
        ai_processing_ms = int((time.time() - ai_start) * 1000)

        response_text = kiaan_result.get("response", "I'm here for you. How can I help?")

        # Calculate TTS time estimate (actual synthesis happens on frontend)
        tts_estimate_ms = len(response_text) * 2  # ~2ms per character estimate

        total_latency = int((time.time() - start_time) * 1000)

        # Extract verse data
        verses_used = kiaan_result.get("verses_used", [])
        verse_ids = [v.get("id") for v in verses_used if v.get("id")]

        # Log conversation
        conversation = await analytics_service.log_voice_conversation(
            user_id=user_id,
            session_id=session_id,
            user_query=payload.query,
            kiaan_response=response_text,
            detected_intent=kiaan_result.get("intent"),
            detected_emotion=kiaan_result.get("emotion"),
            confidence_score=0.8 if kiaan_result.get("validation", {}).get("valid") else 0.5,
            concern_category=kiaan_result.get("context", "general"),
            mood_at_time=payload.mood_at_time,
            verse_ids=verse_ids,
            speech_to_text_ms=payload.speech_to_text_ms,
            ai_processing_ms=ai_processing_ms,
            text_to_speech_ms=tts_estimate_ms,
            user_audio_duration_ms=payload.user_audio_duration_ms,
            language_used=payload.language,
            voice_type_used="friendly",
        )

        logger.info(f"Voice query processed in {total_latency}ms")

        return {
            "conversation_id": conversation.id,
            "response": response_text,
            "verses": [
                {
                    "id": v.get("id", ""),
                    "chapter": v.get("chapter", 0),
                    "verse": v.get("verse", 0),
                    "text": v.get("text", "")
                }
                for v in verses_used
            ],
            "concern": kiaan_result.get("context", "general"),
            "confidence": 0.8 if kiaan_result.get("validation", {}).get("valid") else 0.5,
            "metrics": {
                "ai_processing_ms": ai_processing_ms,
                "total_latency_ms": total_latency,
            }
        }

    except Exception as e:
        logger.error(f"Enhanced voice query error: {e}")

        return {
            "conversation_id": None,
            "response": "I'm here with you. Could you try asking that again?",
            "verses": [],
            "concern": "general",
            "confidence": 0.0,
            "metrics": {
                "error": str(e)
            }
        }
