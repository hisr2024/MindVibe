"""
KIAAN Divine API Routes - World-Class Voice & Intelligence APIs

This module provides the API endpoints for KIAAN's divine capabilities:
1. Divine Chat - Intelligent conversation with emotion understanding
2. Voice Synthesis - World-class TTS with emotion
3. Voice Transcription - Whisper-powered speech recognition
4. Soul Reading - Deep emotional/spiritual analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
import logging
import base64
import io

from backend.deps import get_db, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kiaan", tags=["KIAAN Divine"])


async def _get_optional_user(request: Request, db: AsyncSession) -> Optional[str]:
    """Try to identify user from JWT. Returns None if unauthenticated."""
    try:
        return await get_current_user(request, db)
    except Exception:
        return None


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class ChatRequest(BaseModel):
    """Request for divine chat"""
    message: str = Field(..., min_length=1, max_length=10000)
    user_id: str = Field(default="anonymous")
    session_id: Optional[str] = None
    voice_features: Optional[Dict[str, float]] = None


class ChatResponse(BaseModel):
    """Response from divine chat"""
    text: str
    voice_emotion: str
    voice_character: str
    verse: Optional[Dict[str, str]] = None
    practice: Optional[str] = None
    follow_up_questions: List[str] = []
    is_crisis: bool = False
    sanskrit_words: List[str] = []
    session_id: str


class SynthesizeRequest(BaseModel):
    """Request for voice synthesis"""
    text: str = Field(..., min_length=1, max_length=5000)
    emotion: str = Field(default="warm")
    character: str = Field(default="kiaan_divine")
    language: str = Field(default="en")
    is_sanskrit: bool = False


class TranscribeRequest(BaseModel):
    """Request for audio transcription"""
    audio: str = Field(..., description="Base64 encoded audio")
    language: str = Field(default="auto")


class TranscribeResponse(BaseModel):
    """Response from transcription"""
    text: str
    language: str
    confidence: float
    duration: float
    is_sanskrit: bool = False
    voice_features: Dict[str, float] = {}


class SoulReadingRequest(BaseModel):
    """Request for soul reading"""
    text: str = Field(..., min_length=1)
    voice_features: Optional[Dict[str, float]] = None
    user_id: Optional[str] = None


class SoulReadingResponse(BaseModel):
    """Response with complete soul reading"""
    emotion: Dict[str, Any]
    spiritual: Dict[str, Any]
    healing_needs: List[str]
    recommended_practices: List[str]
    divine_message: str
    relevant_verses: List[str]


# ============================================
# DIVINE CHAT ENDPOINT
# ============================================

@router.post("/divine-chat", response_model=ChatResponse)
async def divine_chat(
    request: ChatRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Have a divine conversation with KIAAN.

    This endpoint:
    1. Analyzes the emotional/spiritual state
    2. Generates a wise, compassionate response
    3. Selects relevant Gita verses
    4. Provides healing practices
    """
    try:
        from backend.services.divine_conversation_engine import conversation_engine

        # Use authenticated user_id if available, fall back to "anonymous"
        user_id = await _get_optional_user(http_request, db) or "anonymous"

        # Process the message
        response = await conversation_engine.process_message(
            user_message=request.message,
            user_id=user_id,
            session_id=request.session_id,
            voice_features=request.voice_features
        )

        return ChatResponse(
            text=response.text,
            voice_emotion=response.voice_emotion,
            voice_character=response.voice_character,
            verse=response.verse,
            practice=response.practice,
            follow_up_questions=response.follow_up_questions,
            is_crisis=response.is_crisis,
            sanskrit_words=response.sanskrit_words,
            session_id=request.session_id or "new"
        )

    except ImportError:
        logger.warning("Divine conversation engine not available, using fallback")
        return ChatResponse(
            text=_generate_fallback_response(request.message),
            voice_emotion="warm",
            voice_character="kiaan_divine",
            session_id=request.session_id or "fallback"
        )

    except Exception as e:
        logger.error(f"Divine chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# VOICE SYNTHESIS ENDPOINT
# ============================================

@router.post("/synthesize")
async def synthesize_voice(request: SynthesizeRequest):
    """
    Synthesize divine voice using world-class TTS.

    Returns audio as streaming response with quality headers.
    """
    try:
        # Try advanced voice engine first
        try:
            from backend.services.advanced_voice_synthesis import voice_engine, VoiceCharacter, VoiceEmotion

            # Map string to enum
            character_map = {
                "kiaan_divine": VoiceCharacter.KIAAN_DIVINE,
                "kiaan_meditative": VoiceCharacter.KIAAN_MEDITATIVE,
                "kiaan_teacher": VoiceCharacter.KIAAN_TEACHER,
                "kiaan_friend": VoiceCharacter.KIAAN_FRIEND,
                "kiaan_sanskrit": VoiceCharacter.KIAAN_SANSKRIT,
            }

            emotion_map = {
                "warm": VoiceEmotion.WARM,
                "calm": VoiceEmotion.CALM,
                "wise": VoiceEmotion.WISE,
                "gentle": VoiceEmotion.GENTLE,
                "inspiring": VoiceEmotion.INSPIRING,
                "solemn": VoiceEmotion.SOLEMN,
                "divine": VoiceEmotion.DIVINE,
                "compassionate": VoiceEmotion.COMPASSIONATE,
            }

            character = character_map.get(request.character, VoiceCharacter.KIAAN_DIVINE)
            emotion = emotion_map.get(request.emotion, VoiceEmotion.WARM)

            result = await voice_engine.synthesize(
                text=request.text,
                character=character,
                emotion=emotion,
                language=request.language,
                is_sanskrit=request.is_sanskrit
            )

            if result.success and result.audio_data:
                return Response(
                    content=result.audio_data,
                    media_type="audio/wav",
                    headers={
                        "X-Provider": result.provider,
                        "X-Quality-Score": str(result.quality_score),
                        "X-Latency-Ms": str(result.latency_ms),
                    }
                )

        except ImportError:
            logger.info("Advanced voice engine not available, trying divine orchestrator")

        # Fall back to divine voice orchestrator
        try:
            from backend.services.divine_voice_orchestrator import divine_voice, VoiceStyle

            style_map = {
                "warm": VoiceStyle.FRIENDLY,
                "calm": VoiceStyle.CALM,
                "wise": VoiceStyle.WISDOM,
                "solemn": VoiceStyle.CHANTING,
                "divine": VoiceStyle.DIVINE,
            }

            style = style_map.get(request.emotion, VoiceStyle.FRIENDLY)

            result = await divine_voice.synthesize(
                text=request.text,
                language=request.language,
                style=style,
                is_sanskrit=request.is_sanskrit
            )

            if result.success and result.audio_data:
                return Response(
                    content=result.audio_data,
                    media_type=f"audio/{result.audio_format}",
                    headers={
                        "X-Provider": result.provider_used.value,
                        "X-Quality-Score": str(result.quality_score),
                        "X-Latency-Ms": str(result.latency_ms),
                    }
                )

        except ImportError:
            logger.warning("Divine voice orchestrator not available")

        # Final fallback - return error
        raise HTTPException(
            status_code=503,
            detail="Voice synthesis services not available"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Synthesis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# VOICE TRANSCRIPTION ENDPOINT
# ============================================

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_voice(request: TranscribeRequest):
    """
    Transcribe audio using Whisper.

    Supports multiple audio formats and languages.
    """
    try:
        from backend.services.whisper_transcription import transcribe_audio

        # Decode base64 audio
        try:
            audio_data = base64.b64decode(request.audio)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 audio data")

        # Transcribe
        result = await transcribe_audio(audio_data, request.language)

        return TranscribeResponse(
            text=result.get("text", ""),
            language=result.get("language", "en"),
            confidence=result.get("confidence", 0.0),
            duration=result.get("duration", 0.0),
            is_sanskrit=result.get("is_sanskrit", False),
            voice_features=result.get("voice_features", {})
        )

    except ImportError:
        logger.warning("Whisper service not available")
        raise HTTPException(
            status_code=503,
            detail="Speech recognition service not available"
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SOUL READING ENDPOINT
# ============================================

@router.post("/soul-reading", response_model=SoulReadingResponse)
async def get_soul_reading(
    request: SoulReadingRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a complete soul reading - deep emotional and spiritual analysis.
    """
    try:
        from backend.services.kiaan_divine_intelligence import kiaan_intelligence

        # Use authenticated user_id if available
        user_id = await _get_optional_user(http_request, db)

        reading = kiaan_intelligence.get_complete_soul_reading(
            text=request.text,
            voice_features=request.voice_features,
            user_id=user_id
        )

        return SoulReadingResponse(
            emotion={
                "primary": reading.emotion_analysis.primary_emotion.value,
                "secondary": [e.value for e in reading.emotion_analysis.secondary_emotions],
                "intensity": reading.emotion_analysis.intensity,
                "valence": reading.emotion_analysis.valence,
                "arousal": reading.emotion_analysis.arousal,
                "triggers": reading.emotion_analysis.triggers,
                "underlying_needs": reading.emotion_analysis.underlying_needs,
            },
            spiritual={
                "guna_balance": reading.spiritual_analysis.guna_balance,
                "consciousness_level": reading.spiritual_analysis.consciousness_level.value,
                "primary_challenge": reading.spiritual_analysis.primary_challenge.value,
                "secondary_challenges": [c.value for c in reading.spiritual_analysis.secondary_challenges],
                "attachment_patterns": reading.spiritual_analysis.attachment_patterns,
                "ego_manifestations": reading.spiritual_analysis.ego_manifestations,
                "growth_opportunities": reading.spiritual_analysis.growth_opportunities,
            },
            healing_needs=reading.healing_needs,
            recommended_practices=reading.recommended_practices,
            divine_message=reading.divine_message,
            relevant_verses=reading.relevant_verses
        )

    except ImportError:
        logger.warning("Divine intelligence not available")
        raise HTTPException(
            status_code=503,
            detail="Soul reading service not available"
        )

    except Exception as e:
        logger.error(f"Soul reading error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# STOP ALL VOICE ENDPOINT
# ============================================

@router.post("/stop")
async def stop_all_voice():
    """Stop all voice synthesis and playback."""
    try:
        # Stop advanced voice engine
        try:
            from backend.services.advanced_voice_synthesis import voice_engine
            voice_engine.stop_all()
        except ImportError:
            pass

        # Stop divine voice orchestrator
        try:
            from backend.services.divine_voice_orchestrator import divine_voice
            divine_voice.stop_all()
        except ImportError:
            pass

        return {"status": "stopped", "message": "All voice operations stopped"}

    except Exception as e:
        logger.error(f"Stop error: {e}")
        return {"status": "error", "message": str(e)}


# ============================================
# SESSION MANAGEMENT ENDPOINTS
# ============================================

@router.get("/session/{session_id}")
async def get_session_summary(
    session_id: str,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get summary of a conversation session."""
    try:
        from backend.services.divine_conversation_engine import conversation_engine

        user_id = await _get_optional_user(http_request, db) or "anonymous"
        summary = conversation_engine.get_conversation_summary(user_id, session_id)
        return summary

    except ImportError:
        raise HTTPException(status_code=503, detail="Conversation engine not available")

    except Exception as e:
        logger.error(f"Session summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}")
async def end_session(
    session_id: str,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """End a conversation session."""
    try:
        from backend.services.divine_conversation_engine import conversation_engine

        user_id = await _get_optional_user(http_request, db) or "anonymous"
        result = conversation_engine.end_session(user_id, session_id)
        return result

    except ImportError:
        raise HTTPException(status_code=503, detail="Conversation engine not available")

    except Exception as e:
        logger.error(f"End session error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# HEALTH CHECK ENDPOINT
# ============================================

@router.get("/health")
async def health_check():
    """Check the health of KIAAN divine services."""
    status = {
        "status": "healthy",
        "services": {}
    }

    # Check divine intelligence
    try:
        from backend.services.kiaan_divine_intelligence import kiaan_intelligence
        status["services"]["divine_intelligence"] = "available"
    except ImportError:
        status["services"]["divine_intelligence"] = "unavailable"

    # Check conversation engine
    try:
        from backend.services.divine_conversation_engine import conversation_engine
        status["services"]["conversation_engine"] = "available"
    except ImportError:
        status["services"]["conversation_engine"] = "unavailable"

    # Check voice synthesis
    try:
        from backend.services.advanced_voice_synthesis import voice_engine
        status["services"]["advanced_voice"] = "available"
    except ImportError:
        try:
            from backend.services.divine_voice_orchestrator import divine_voice
            status["services"]["divine_voice"] = "available"
        except ImportError:
            status["services"]["voice_synthesis"] = "unavailable"

    # Check whisper
    try:
        from backend.services.whisper_transcription import whisper_service
        status["services"]["speech_recognition"] = "available"
    except ImportError:
        status["services"]["speech_recognition"] = "unavailable"

    return status


# ============================================
# FALLBACK RESPONSE GENERATOR
# ============================================

def _generate_fallback_response(message: str) -> str:
    """Generate a fallback response when services are unavailable."""
    message_lower = message.lower()

    if any(word in message_lower for word in ["sad", "unhappy", "depressed"]):
        return """I sense heaviness in your heart, dear one. Know that these feelings, like clouds, will pass. You are not alone in this moment.

The Gita reminds us: "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ" - sensations of cold and heat, pleasure and pain arise from contact with the senses. They are temporary, coming and going.

Would you like to share what's troubling you? Sometimes speaking our pain helps lighten it."""

    if any(word in message_lower for word in ["anxious", "worried", "scared", "fear"]):
        return """I hear the worry in your words. Anxiety often comes when we forget our true nature - that deep within, there is a place of peace that cannot be disturbed.

Krishna tells us: "duḥkheṣv anudvigna-manāḥ" - one whose mind is not disturbed by adversity finds peace.

Let's take a moment together. Place your hand on your heart. Feel its steady rhythm. You are safe in this moment. What specific worry would you like to explore?"""

    if any(word in message_lower for word in ["peace", "calm", "meditation"]):
        return """How beautiful that you seek peace. This very seeking is sacred.

The Gita describes the peaceful one: "like an ocean that remains calm though waters flow into it, one who remains undisturbed by desires attains peace."

Would you like me to guide you in a brief meditation? Or shall we explore what inner peace means to you?"""

    # Default response
    return """Namaste, dear soul. I'm here, fully present with you.

Your words carry meaning beyond their surface. Whether you seek guidance, comfort, or simply someone to listen - I am here.

What's truly on your heart today?"""
