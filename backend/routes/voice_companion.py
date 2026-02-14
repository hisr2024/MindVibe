"""Voice Companion API Routes - KIAAN Best Friend

Endpoints for the voice companion chat experience where KIAAN acts as
the user's best friend. Handles conversation sessions, message exchange,
emotional tracking, memory persistence, and companion profile management.

All wisdom is delivered in modern, secular language - no religious references.
"""

import datetime
import html
import logging
import os
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
    CompanionMood,
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
    referral_tool: str | None = Field(default=None, max_length=64)
    referral_mood: str | None = Field(default=None, max_length=32)


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


class WisdomUsed(BaseModel):
    principle: str | None = None
    verse_ref: str | None = None


class SendMessageResponse(BaseModel):
    message_id: str
    response: str
    mood: str
    mood_intensity: float
    phase: str
    follow_up: str | None = None
    wisdom_principle: str | None = None
    wisdom_used: WisdomUsed | None = None


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


class SynthesizeVoiceRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    mood: str = Field(default="neutral", max_length=32)
    voice_id: str = Field(default="sarvam-aura", max_length=32)
    language: str = Field(default="en", max_length=8)


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


async def _get_recent_session_summaries(
    db: AsyncSession, user_id: str, limit: int = 3
) -> list[dict]:
    """Retrieve summaries from recent past sessions for cross-session context."""
    result = await db.execute(
        select(CompanionSession)
        .where(
            CompanionSession.user_id == user_id,
            CompanionSession.is_active.is_(False),
            CompanionSession.topics_discussed.isnot(None),
        )
        .order_by(desc(CompanionSession.ended_at))
        .limit(limit)
    )
    sessions = result.scalars().all()
    return [s.topics_discussed for s in sessions if s.topics_discussed]


async def _update_mood_profile(
    profile: CompanionProfile, mood: str
) -> None:
    """Update the user's common_moods profile field with new mood data."""
    moods = profile.common_moods or {}
    moods[mood] = moods.get(mood, 0) + 1
    profile.common_moods = moods


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

    # Get user memories and cross-session context
    profile = await _get_or_create_profile(db, current_user.id)
    memories = await _get_user_memories(db, current_user.id)
    session_summaries = await _get_recent_session_summaries(db, current_user.id)

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

    # Query Guidance Engine's Gita DB for a contextual verse (richer than JSON corpus)
    db_wisdom_verse = None
    try:
        from backend.services.wisdom_kb import WisdomKnowledgeBase
        kb = WisdomKnowledgeBase()
        # Build search query from user message + mood for semantic matching
        search_query = f"{body.message} {mood}"
        # Map mood to theme for better filtering
        mood_theme_hints = {
            "anxious": "equanimity", "sad": "resilience", "angry": "self_mastery",
            "confused": "clarity", "lonely": "connection", "hopeful": "purpose",
            "peaceful": "meditation", "overwhelmed": "detachment", "fearful": "courage",
            "frustrated": "patience", "stressed": "inner_peace", "guilty": "forgiveness",
            "hurt": "acceptance", "jealous": "contentment",
        }
        theme_hint = mood_theme_hints.get(mood)
        verse_results = await kb.search_relevant_verses_full_db(
            db=db, query=search_query, theme=theme_hint, limit=3,
        )
        if verse_results and verse_results[0].get("score", 0) > 0.1:
            top = verse_results[0]
            v = top["verse"]
            db_wisdom_verse = {
                "verse_ref": v.get("verse_id", ""),
                "principle": v.get("context", v.get("theme", "wisdom")),
                "wisdom": top.get("sanitized_text") or v.get("english", ""),
                "theme": v.get("theme", ""),
                "mental_health_applications": v.get("mental_health_applications", []),
                "primary_domain": v.get("primary_domain", ""),
                "source": "gita_db",
            }
            logger.info(
                f"GuidanceDB: Selected verse {db_wisdom_verse['verse_ref']} "
                f"(score={top['score']:.2f}) for mood={mood}"
            )
    except Exception as e:
        logger.debug(f"Guidance DB verse lookup skipped: {e}")

    # Generate response (with cross-session context for deep memory)
    engine = get_companion_engine()
    response_data = await engine.generate_response(
        user_message=body.message,
        conversation_history=conversation_history,
        user_name=profile.preferred_name,
        turn_count=user_turn_count,
        memories=memories,
        language=body.language,
        profile_data=profile_context,
        session_summaries=session_summaries,
        db_wisdom_verse=db_wisdom_verse,
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
        _verse_ref=(response_data.get("wisdom_used") or {}).get("verse_ref"),
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

    # Phase 1: Deep Memory — AI-powered memory extraction + profile population
    try:
        memory_entries = await engine.extract_memories_with_ai(
            user_message=body.message,
            companion_response=response_data["response"],
            mood=mood,
        )
    except Exception as e:
        logger.warning(f"AI memory extraction failed, using pattern fallback: {e}")
        memory_entries = extract_memories_from_message(body.message, mood)

    if memory_entries:
        await _save_memories(db, current_user.id, session.id, memory_entries)

    # Update mood profile (Phase 1: populate common_moods)
    await _update_mood_profile(profile, mood)

    await db.commit()

    logger.info(
        f"Companion response for user {current_user.id}: "
        f"mood={mood}, phase={response_data['phase']}, "
        f"latency={response_time_ms:.0f}ms"
    )

    # Extract wisdom metadata for response
    wisdom_data = response_data.get("wisdom_used") or {}
    wisdom_principle = wisdom_data.get("principle") if wisdom_data else None
    wisdom_used_obj = WisdomUsed(
        principle=wisdom_data.get("principle"),
        verse_ref=wisdom_data.get("verse_ref"),
    ) if wisdom_data.get("principle") else None

    return SendMessageResponse(
        message_id=companion_msg.id,
        response=response_data["response"],
        mood=response_data["mood"],
        mood_intensity=response_data.get("mood_intensity", 0.5),
        phase=response_data["phase"],
        follow_up=response_data.get("follow_up"),
        wisdom_principle=wisdom_principle,
        wisdom_used=wisdom_used_obj,
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

    # Phase 1: Generate AI session summary and store for cross-session context
    try:
        from backend.services.companion_friend_engine import get_companion_engine
        engine = get_companion_engine()

        # Get conversation history for summarization
        history_result = await db.execute(
            select(CompanionMessage)
            .where(
                CompanionMessage.session_id == session.id,
                CompanionMessage.deleted_at.is_(None),
            )
            .order_by(CompanionMessage.created_at)
            .limit(30)
        )
        history_msgs = history_result.scalars().all()
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in history_msgs
        ]

        session_summary = await engine.summarize_session(
            conversation_history=conversation_history,
            initial_mood=session.initial_mood,
            final_mood=session.final_mood,
        )
        session.topics_discussed = session_summary
    except Exception as e:
        logger.warning(f"Session summary generation failed: {e}")
    finally:
        engine.reset_verse_history()

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
    body: SynthesizeVoiceRequest,
    current_user: User = Depends(get_current_user),
):
    """Synthesize speech for a companion message with emotion-adaptive voice.

    Uses the premium voice pipeline: Google Neural2 → Edge TTS → browser fallback.
    Voice automatically adapts to the user's detected mood.
    """
    from backend.services.companion_voice_service import (
        synthesize_companion_voice as synth,
    )
    from fastapi.responses import Response

    text = body.text
    mood = body.mood
    voice_id = body.voice_id
    language = body.language

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
        "voice_persona": result.get("voice_persona", "sarvam-aura"),
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
    voice_providers = []
    if os.getenv("ELEVENLABS_API_KEY", "").strip():
        voice_providers.append("elevenlabs")
    if os.getenv("OPENAI_API_KEY", "").strip():
        voice_providers.append("openai_tts_hd")
    voice_providers.extend(["google_neural2", "edge_tts", "browser_fallback"])

    # Phase 2: Report verse corpus status
    try:
        from backend.services.sakha_wisdom_engine import get_sakha_wisdom_engine
        sakha = get_sakha_wisdom_engine()
        verse_count = sakha.get_verse_count()
    except Exception:
        verse_count = 0

    return {
        "status": "healthy",
        "ai_enhanced": engine._openai_available,
        "service": "kiaan-companion",
        "voice_providers": voice_providers,
        "wisdom_corpus": verse_count,
    }


# ─── Phase 4: Self-Awareness Mirror Endpoints ───────────────────────────


@router.get("/insights/mood-trends")
@limiter.limit("20/minute")
async def get_mood_trends(
    request: Request,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get mood trend data for the Self-Awareness Mirror.

    Returns mood frequencies, emotional arc over time, and pattern insights.
    """
    from backend.services.companion_friend_engine import get_companion_engine

    since = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=days)

    # Get all mood data from messages within timeframe
    result = await db.execute(
        select(
            CompanionMessage.detected_mood,
            CompanionMessage.mood_intensity,
            CompanionMessage.created_at,
            CompanionMessage.session_id,
        )
        .where(
            CompanionMessage.user_id == current_user.id,
            CompanionMessage.role == "user",
            CompanionMessage.detected_mood.isnot(None),
            CompanionMessage.created_at >= since,
            CompanionMessage.deleted_at.is_(None),
        )
        .order_by(CompanionMessage.created_at)
    )
    rows = result.all()

    mood_history = [
        {
            "mood": row.detected_mood,
            "intensity": row.mood_intensity or 0.5,
            "timestamp": row.created_at.isoformat() if row.created_at else None,
            "session_id": row.session_id,
        }
        for row in rows
    ]

    # Use engine for pattern analysis
    engine = get_companion_engine()
    patterns = await engine.analyze_emotional_patterns(mood_history)

    # Add timeline data (mood per day for charting)
    daily_moods: dict[str, list[str]] = {}
    for entry in mood_history:
        if entry.get("timestamp"):
            day = entry["timestamp"][:10]
            daily_moods.setdefault(day, []).append(entry["mood"])

    timeline = []
    for day, moods in sorted(daily_moods.items()):
        # Most common mood that day
        from collections import Counter
        most_common = Counter(moods).most_common(1)[0][0] if moods else "neutral"
        timeline.append({
            "date": day,
            "primary_mood": most_common,
            "mood_count": len(moods),
        })

    return {
        **patterns,
        "timeline": timeline,
        "period_days": days,
    }


@router.get("/insights/milestones")
@limiter.limit("20/minute")
async def get_friendship_milestones(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get friendship milestones and achievements.

    Tracks the user's journey with KIAAN: sessions, streaks, growth.
    """
    profile = await _get_or_create_profile(db, current_user.id)

    # Count sessions with mood improvement
    improved_count = await db.scalar(
        select(func.count(CompanionSession.id))
        .where(
            CompanionSession.user_id == current_user.id,
            CompanionSession.mood_improved.is_(True),
        )
    ) or 0

    # Count total unique days of conversation
    days_result = await db.execute(
        select(func.date_trunc("day", CompanionSession.started_at))
        .where(CompanionSession.user_id == current_user.id)
        .distinct()
    )
    total_days = len(days_result.all())

    # Define milestones
    milestones = []
    milestone_defs = [
        (1, "First Conversation", "Started your journey with KIAAN", "new_friend"),
        (5, "Getting Closer", "5 conversations deep", "familiar"),
        (10, "True Friend", "10 heartfelt conversations", "close"),
        (25, "Soul Connection", "25 sessions of growth together", "deep"),
        (50, "Divine Bond", "50 sessions — a Sakha bond", "divine"),
        (100, "Eternal Companion", "100 sessions — friends for life", "eternal"),
    ]

    for threshold, title, description, level in milestone_defs:
        achieved = profile.total_sessions >= threshold
        milestones.append({
            "threshold": threshold,
            "title": title,
            "description": description,
            "level": level,
            "achieved": achieved,
            "achieved_at": None,  # Could track with dates in future
        })

    streak_milestones = [
        (3, "3-Day Streak", "Showed up 3 days in a row"),
        (7, "Week Warrior", "7 consecutive days of self-care"),
        (14, "Fortnight of Growth", "14 days of consistent inner work"),
        (30, "Monthly Master", "30-day streak — incredible discipline"),
    ]
    for threshold, title, description in streak_milestones:
        milestones.append({
            "threshold": threshold,
            "title": title,
            "description": description,
            "level": "streak",
            "achieved": profile.longest_streak >= threshold,
        })

    return {
        "total_sessions": profile.total_sessions,
        "total_messages": profile.total_messages,
        "current_streak": profile.streak_days,
        "longest_streak": profile.longest_streak,
        "sessions_with_improvement": improved_count,
        "total_days_active": total_days,
        "friendship_level": _get_friendship_level(profile.total_sessions),
        "milestones": milestones,
    }
