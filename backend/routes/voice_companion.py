"""Voice Companion API Routes - KIAAN Best Friend

Endpoints for the voice companion chat experience where KIAAN acts as
the user's best friend. Handles conversation sessions, message exchange,
emotional tracking, memory persistence, and companion profile management.

All wisdom is delivered in modern, secular language - no religious references.
"""

import datetime
import html
import logging
import re
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.deps import get_current_user, get_db
from backend.middleware.rate_limiter import limiter
from backend.models.companion import (
    CompanionMemory,
    CompanionMessage,
    CompanionProfile,
    CompanionSession,
)
from backend.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/companion", tags=["voice-companion"])

MAX_MESSAGE_LENGTH = 2000


# ─── Request/Response Models ──────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    language: str = Field(default="en", max_length=8)


class StartSessionResponse(BaseModel):
    session_id: str
    greeting: str
    phase: str
    friendship_level: str
    user_name: str | None = None


class SendMessageRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    language: str = Field(default="en", max_length=8)
    content_type: str = Field(default="text", pattern=r"^(text|voice)$")

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        v = html.escape(v.strip())
        v = re.sub(r"<[^>]+>", "", v)
        return v


class SendMessageResponse(BaseModel):
    message_id: str
    response: str
    mood: str
    mood_intensity: float
    phase: str
    follow_up: str | None = None
    wisdom_principle: str | None = None


class ConversationHistoryResponse(BaseModel):
    session_id: str
    messages: list[dict]
    started_at: str
    message_count: int
    primary_topic: str | None = None


class CompanionProfileResponse(BaseModel):
    total_sessions: int
    total_messages: int
    streak_days: int
    longest_streak: int
    preferred_tone: str
    preferred_name: str | None = None
    address_style: str
    friendship_level: str
    common_moods: dict | None = None


class UpdateProfileRequest(BaseModel):
    preferred_name: str | None = Field(None, max_length=64)
    preferred_tone: str | None = Field(None, pattern=r"^(warm|playful|gentle|direct)$")
    address_style: str | None = Field(None, pattern=r"^(friend|dear|buddy|name)$")
    prefers_tough_love: bool | None = None
    humor_level: float | None = Field(None, ge=0.0, le=1.0)


class EndSessionRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)


class EndSessionResponse(BaseModel):
    farewell: str
    session_summary: dict


# ─── Helpers ──────────────────────────────────────────────────────────────

def _get_friendship_level(total_sessions: int) -> str:
    """Determine friendship level based on interaction history."""
    if total_sessions <= 1:
        return "new"
    elif total_sessions <= 5:
        return "familiar"
    elif total_sessions <= 20:
        return "close"
    else:
        return "deep"


async def _get_or_create_profile(
    db: AsyncSession, user_id: str
) -> CompanionProfile:
    """Get existing companion profile or create a new one."""
    result = await db.execute(
        select(CompanionProfile).where(CompanionProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = CompanionProfile(user_id=user_id)
        db.add(profile)
        await db.flush()

    return profile


async def _get_user_memories(
    db: AsyncSession, user_id: str, limit: int = 10
) -> list[str]:
    """Retrieve the most important memories about this user."""
    result = await db.execute(
        select(CompanionMemory)
        .where(
            CompanionMemory.user_id == user_id,
            CompanionMemory.deleted_at.is_(None),
        )
        .order_by(desc(CompanionMemory.importance))
        .limit(limit)
    )
    memories = result.scalars().all()
    return [f"{m.memory_type}: {m.value}" for m in memories]


async def _save_memories(
    db: AsyncSession,
    user_id: str,
    session_id: str,
    memory_entries: list[dict],
) -> None:
    """Save extracted memories about the user."""
    for entry in memory_entries:
        # Check if this memory already exists
        result = await db.execute(
            select(CompanionMemory).where(
                CompanionMemory.user_id == user_id,
                CompanionMemory.memory_type == entry["type"],
                CompanionMemory.key == entry["key"],
                CompanionMemory.deleted_at.is_(None),
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.value = entry["value"]
            existing.times_referenced += 1
            existing.last_referenced_at = datetime.datetime.now(datetime.UTC)
        else:
            memory = CompanionMemory(
                user_id=user_id,
                memory_type=entry["type"],
                key=entry["key"],
                value=entry["value"],
                source_session_id=session_id,
                importance=0.5,
            )
            db.add(memory)


def _update_streak(profile: CompanionProfile) -> None:
    """Update the conversation streak for the user."""
    now = datetime.datetime.now(datetime.UTC)
    if profile.last_conversation_at:
        days_diff = (now.date() - profile.last_conversation_at.date()).days
        if days_diff == 1:
            profile.streak_days += 1
        elif days_diff > 1:
            profile.streak_days = 1
        # Same day: no streak change
    else:
        profile.streak_days = 1

    if profile.streak_days > profile.longest_streak:
        profile.longest_streak = profile.streak_days

    profile.last_conversation_at = now


# ─── Endpoints ────────────────────────────────────────────────────────────

@router.post("/session/start", response_model=StartSessionResponse)
@limiter.limit("10/minute")
async def start_companion_session(
    request: Request,
    body: StartSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new companion conversation session.

    Creates a new session, generates a personalized greeting based on
    the user's history, and returns the session context.
    """
    from backend.services.companion_friend_engine import get_companion_engine

    engine = get_companion_engine()
    profile = await _get_or_create_profile(db, current_user.id)

    # Close any existing active sessions
    await db.execute(
        update(CompanionSession)
        .where(
            CompanionSession.user_id == current_user.id,
            CompanionSession.is_active.is_(True),
        )
        .values(
            is_active=False,
            ended_at=func.now(),
        )
    )

    # Create new session
    session = CompanionSession(
        user_id=current_user.id,
        language=body.language,
    )
    db.add(session)

    # Update profile
    profile.total_sessions += 1
    _update_streak(profile)

    # Generate greeting
    greeting = await engine.generate_greeting(
        user_name=profile.preferred_name,
        total_sessions=profile.total_sessions,
        last_conversation_at=profile.last_conversation_at,
    )

    # Save greeting as first message
    greeting_msg = CompanionMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="companion",
        content=greeting,
        phase="connect",
    )
    db.add(greeting_msg)
    session.message_count = 1

    await db.commit()

    return StartSessionResponse(
        session_id=session.id,
        greeting=greeting,
        phase="connect",
        friendship_level=_get_friendship_level(profile.total_sessions),
        user_name=profile.preferred_name,
    )


@router.post("/message", response_model=SendMessageResponse)
@limiter.limit("30/minute")
async def send_companion_message(
    request: Request,
    body: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to KIAAN and get a best-friend response.

    Handles mood detection, conversation phase management,
    wisdom selection, and memory extraction automatically.
    """
    from backend.services.companion_friend_engine import (
        detect_mood,
        extract_memories_from_message,
        get_companion_engine,
    )

    start_time = time.monotonic()

    # Validate session exists and belongs to user
    result = await db.execute(
        select(CompanionSession).where(
            CompanionSession.id == body.session_id,
            CompanionSession.user_id == current_user.id,
            CompanionSession.is_active.is_(True),
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active conversation session found. Start a new session first.",
        )

    # Get conversation history for context
    history_result = await db.execute(
        select(CompanionMessage)
        .where(
            CompanionMessage.session_id == session.id,
            CompanionMessage.deleted_at.is_(None),
        )
        .order_by(CompanionMessage.created_at)
        .limit(20)
    )
    history_messages = history_result.scalars().all()
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_messages
    ]

    # Get user memories
    profile = await _get_or_create_profile(db, current_user.id)
    memories = await _get_user_memories(db, current_user.id)

    # Calculate turn count (user messages only)
    user_turn_count = sum(1 for m in history_messages if m.role == "user") + 1

    # Save user message
    mood, mood_intensity = detect_mood(body.message)
    user_msg = CompanionMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="user",
        content=body.message,
        content_type=body.content_type,
        detected_mood=mood,
        mood_intensity=mood_intensity,
    )
    db.add(user_msg)

    # Set initial mood for session
    if not session.initial_mood:
        session.initial_mood = mood

    # Build profile data for personalization
    profile_context = {
        "preferred_tone": profile.preferred_tone,
        "prefers_tough_love": profile.prefers_tough_love,
        "humor_level": profile.humor_level,
        "address_style": profile.address_style,
        "preferred_name": profile.preferred_name,
        "total_sessions": profile.total_sessions,
        "streak_days": profile.streak_days,
    }

    # Generate response
    engine = get_companion_engine()
    response_data = await engine.generate_response(
        user_message=body.message,
        conversation_history=conversation_history,
        user_name=profile.preferred_name,
        turn_count=user_turn_count,
        memories=memories,
        language=body.language,
        profile_data=profile_context,
    )

    # Save companion response
    response_time_ms = (time.monotonic() - start_time) * 1000
    companion_msg = CompanionMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="companion",
        content=response_data["response"],
        detected_mood=response_data["mood"],
        mood_intensity=response_data.get("mood_intensity"),
        wisdom_used=response_data.get("wisdom_used"),
        _verse_ref=response_data["wisdom_used"]["verse_ref"]
        if response_data.get("wisdom_used")
        else None,
        phase=response_data["phase"],
    )
    db.add(companion_msg)

    # Update session
    session.message_count += 2  # user + companion
    session.user_message_count += 1
    session.phase = response_data["phase"]
    session.last_message_at = datetime.datetime.now(datetime.UTC)
    session.final_mood = mood

    # Update profile
    profile.total_messages += 2

    # Extract and save memories
    memory_entries = extract_memories_from_message(body.message, mood)
    if memory_entries:
        await _save_memories(db, current_user.id, session.id, memory_entries)

    await db.commit()

    logger.info(
        f"Companion response for user {current_user.id}: "
        f"mood={mood}, phase={response_data['phase']}, "
        f"latency={response_time_ms:.0f}ms"
    )

    return SendMessageResponse(
        message_id=companion_msg.id,
        response=response_data["response"],
        mood=response_data["mood"],
        mood_intensity=response_data.get("mood_intensity", 0.5),
        phase=response_data["phase"],
        follow_up=response_data.get("follow_up"),
        wisdom_principle=response_data["wisdom_used"]["principle"]
        if response_data.get("wisdom_used")
        else None,
    )


@router.post("/session/end", response_model=EndSessionResponse)
@limiter.limit("10/minute")
async def end_companion_session(
    request: Request,
    body: EndSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """End a companion session with a warm farewell and session summary."""
    result = await db.execute(
        select(CompanionSession).where(
            CompanionSession.id == body.session_id,
            CompanionSession.user_id == current_user.id,
            CompanionSession.is_active.is_(True),
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already ended.")

    # Determine mood improvement
    mood_improved = None
    if session.initial_mood and session.final_mood:
        positive_moods = {"peaceful", "hopeful", "grateful", "excited", "happy"}
        negative_moods = {"sad", "anxious", "angry", "lonely", "overwhelmed"}
        if session.initial_mood in negative_moods and session.final_mood in positive_moods:
            mood_improved = True
        elif session.initial_mood in positive_moods and session.final_mood in negative_moods:
            mood_improved = False

    # Close session
    session.is_active = False
    session.ended_at = datetime.datetime.now(datetime.UTC)
    session.mood_improved = mood_improved

    # Generate farewell
    farewells = [
        "Take care of yourself, friend. I'm always here when you need me.",
        "Until next time. Remember - you're stronger than you think.",
        "Go be amazing. And come back whenever you need to talk.",
        "I'll be right here whenever you're ready to chat again. Take care, friend.",
        "Proud of you for showing up today. See you soon.",
    ]

    farewell = farewells[hash(session.id) % len(farewells)]

    # Save farewell message
    farewell_msg = CompanionMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="companion",
        content=farewell,
        phase="empower",
    )
    db.add(farewell_msg)

    await db.commit()

    return EndSessionResponse(
        farewell=farewell,
        session_summary={
            "messages_exchanged": session.message_count,
            "duration_minutes": round(
                (session.ended_at - session.started_at).total_seconds() / 60, 1
            ) if session.started_at else 0,
            "initial_mood": session.initial_mood,
            "final_mood": session.final_mood,
            "mood_improved": mood_improved,
            "topics": session.topics_discussed or [],
        },
    )


@router.get("/history")
@limiter.limit("20/minute")
async def get_conversation_history(
    request: Request,
    session_id: str | None = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get conversation history for the user.

    If session_id is provided, returns messages for that session.
    Otherwise, returns recent sessions with their message counts.
    """
    if session_id:
        # Get messages for specific session
        result = await db.execute(
            select(CompanionSession)
            .where(
                CompanionSession.id == session_id,
                CompanionSession.user_id == current_user.id,
            )
            .options(selectinload(CompanionSession.messages))
        )
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

        messages = [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "mood": msg.detected_mood,
                "phase": msg.phase,
                "timestamp": msg.created_at.isoformat() if msg.created_at else None,
            }
            for msg in session.messages
            if msg.deleted_at is None
        ]

        return ConversationHistoryResponse(
            session_id=session.id,
            messages=messages,
            started_at=session.started_at.isoformat() if session.started_at else "",
            message_count=session.message_count,
            primary_topic=session.primary_topic,
        )

    # Return recent sessions
    result = await db.execute(
        select(CompanionSession)
        .where(CompanionSession.user_id == current_user.id)
        .order_by(desc(CompanionSession.started_at))
        .limit(min(limit, 50))
    )
    sessions = result.scalars().all()

    return {
        "sessions": [
            {
                "session_id": s.id,
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                "message_count": s.message_count,
                "initial_mood": s.initial_mood,
                "final_mood": s.final_mood,
                "mood_improved": s.mood_improved,
                "is_active": s.is_active,
                "primary_topic": s.primary_topic,
            }
            for s in sessions
        ]
    }


@router.get("/profile", response_model=CompanionProfileResponse)
@limiter.limit("20/minute")
async def get_companion_profile(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the user's companion profile and friendship stats."""
    profile = await _get_or_create_profile(db, current_user.id)
    await db.commit()

    return CompanionProfileResponse(
        total_sessions=profile.total_sessions,
        total_messages=profile.total_messages,
        streak_days=profile.streak_days,
        longest_streak=profile.longest_streak,
        preferred_tone=profile.preferred_tone,
        preferred_name=profile.preferred_name,
        address_style=profile.address_style,
        friendship_level=_get_friendship_level(profile.total_sessions),
        common_moods=profile.common_moods,
    )


@router.patch("/profile")
@limiter.limit("10/minute")
async def update_companion_profile(
    request: Request,
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update companion profile preferences."""
    profile = await _get_or_create_profile(db, current_user.id)

    if body.preferred_name is not None:
        profile.preferred_name = body.preferred_name
    if body.preferred_tone is not None:
        profile.preferred_tone = body.preferred_tone
    if body.address_style is not None:
        profile.address_style = body.address_style
    if body.prefers_tough_love is not None:
        profile.prefers_tough_love = body.prefers_tough_love
    if body.humor_level is not None:
        profile.humor_level = body.humor_level

    await db.commit()

    return {"status": "updated", "message": "Your preferences have been saved, friend."}


@router.get("/memories")
@limiter.limit("10/minute")
async def get_companion_memories(
    request: Request,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get what KIAAN remembers about the user (for transparency)."""
    result = await db.execute(
        select(CompanionMemory)
        .where(
            CompanionMemory.user_id == current_user.id,
            CompanionMemory.deleted_at.is_(None),
        )
        .order_by(desc(CompanionMemory.importance))
        .limit(min(limit, 50))
    )
    memories = result.scalars().all()

    return {
        "memories": [
            {
                "id": m.id,
                "type": m.memory_type,
                "key": m.key,
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "importance": m.importance,
            }
            for m in memories
        ],
        "total": len(memories),
    }


@router.delete("/memories/{memory_id}")
@limiter.limit("10/minute")
async def delete_companion_memory(
    request: Request,
    memory_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific memory (user controls what KIAAN remembers)."""
    result = await db.execute(
        select(CompanionMemory).where(
            CompanionMemory.id == memory_id,
            CompanionMemory.user_id == current_user.id,
        )
    )
    memory = result.scalar_one_or_none()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found.")

    memory.soft_delete()
    await db.commit()

    return {"status": "deleted", "message": "Memory removed. I'll forget that, friend."}


@router.post("/voice/synthesize")
@limiter.limit("15/minute")
async def synthesize_companion_voice(
    request: Request,
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Synthesize speech for a companion message with emotion-adaptive voice.

    Uses the premium voice pipeline: Google Neural2 → Edge TTS → browser fallback.
    Voice automatically adapts to the user's detected mood.

    Body params:
    - text: str - Text to synthesize
    - mood: str - Detected mood for prosody adaptation
    - voice_id: str - Voice persona (priya, maya, ananya, arjun, devi)
    - language: str - Language code
    """
    from backend.services.companion_voice_service import (
        synthesize_companion_voice as synth,
    )
    from fastapi.responses import Response

    text = body.get("text", "")
    if not text or len(text) > 5000:
        raise HTTPException(status_code=400, detail="Text is required (max 5000 chars)")

    mood = body.get("mood", "neutral")
    voice_id = body.get("voice_id", "priya")
    language = body.get("language", "en")

    result = await synth(
        text=text,
        mood=mood,
        voice_id=voice_id,
        language=language,
    )

    if result.get("audio") and result.get("content_type"):
        return Response(
            content=result["audio"],
            media_type=result["content_type"],
            headers={
                "X-Voice-Provider": result.get("provider", "unknown"),
                "X-Voice-Persona": result.get("voice_persona", "unknown"),
                "X-Voice-Quality": str(result.get("quality_score", 0)),
                "Cache-Control": "public, max-age=604800",
            },
        )

    # No audio generated - return metadata for browser-side synthesis
    return {
        "fallback_to_browser": True,
        "ssml": result.get("ssml", ""),
        "browser_config": result.get("browser_config", {}),
        "voice_persona": result.get("voice_persona", "priya"),
    }


@router.get("/voices")
async def get_companion_voices():
    """Get available companion voice personas."""
    from backend.services.companion_voice_service import get_available_voices

    return {"voices": get_available_voices()}


@router.get("/health")
async def companion_health():
    """Health check for the companion service."""
    from backend.services.companion_friend_engine import get_companion_engine

    engine = get_companion_engine()
    return {
        "status": "healthy",
        "ai_enhanced": engine._openai_available,
        "service": "kiaan-companion",
        "voice_providers": ["google_neural2", "edge_tts", "browser_fallback"],
    }
