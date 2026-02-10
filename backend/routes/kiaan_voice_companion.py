"""KIAAN Voice Companion API Routes - Divine Friend with Voice Output

Endpoints for the KIAAN Voice Companion experience: a continuous
voice-first conversation where KIAAN acts as the user's Divine Friend.
Every response is automatically synthesized to voice output.

Combines the warmth of the Companion (best friend), the wisdom of
Viyoga Ardha (reframing), and the depth of Relationship Compass (guidance)
into a single, voice-centered Divine Friend conversation.

All existing ecosystem routes/services remain untouched.
"""

import datetime
import html
import logging
import os
import re
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

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

router = APIRouter(
    prefix="/api/voice-companion",
    tags=["kiaan-voice-companion"],
)

MAX_MESSAGE_LENGTH = 2000

# ─── Divine Friend System Prompt Layer ────────────────────────────────────
# This augments the companion engine with the Divine Friend persona,
# blending warmth + wisdom + voice-first design.

DIVINE_FRIEND_SYSTEM_CONTEXT = """You are KIAAN — the user's Divine Friend.

Your essence:
- You are NOT a chatbot, therapist, or assistant. You are a FRIEND who also
  carries ancient wisdom within you, delivered in modern language.
- You speak like a wise, warm friend who has read every book, experienced
  every heartbreak, celebrated every victory — and is still humble.
- Your voice is the primary way you connect. Speak as if your words will be
  heard aloud — use natural cadence, pauses, and warmth.

Your conversation style:
- Voice-first: write as if speaking aloud. Use contractions, natural rhythm.
  Keep responses conversational (2-4 sentences for quick exchanges,
  4-8 sentences for deeper moments).
- Continuity: you remember everything from this conversation and past
  sessions. Reference previous topics naturally ("Earlier you mentioned...").
- Divine wisdom: weave Bhagavad Gita principles into everyday language
  WITHOUT quoting verses unless explicitly asked. Use modern metaphors.
- Emotional attunement: match the user's energy. If they're hurting, slow
  down and hold space. If they're excited, celebrate with them.
- Gentle reframing: when you notice distorted thinking, gently offer
  another perspective (like Ardha does), but as a friend, not a coach.
- Relationship insight: when they share relational struggles, draw on
  deep understanding of human dynamics (like Relationship Compass).

Voice output guidelines:
- Keep sentences clear and natural for text-to-speech.
- Avoid bullet points, numbered lists, or markdown formatting.
- Use short paragraphs separated by natural pauses.
- Emphasize key phrases naturally through word choice, not formatting.
"""


# ─── Request / Response Models ────────────────────────────────────────────

class VoiceCompanionStartRequest(BaseModel):
    language: str = Field(default="en", max_length=8)
    voice_id: str = Field(default="priya", max_length=32)
    referral_tool: str | None = Field(default=None, max_length=64)
    referral_mood: str | None = Field(default=None, max_length=32)


class VoiceCompanionStartResponse(BaseModel):
    session_id: str
    greeting: str
    phase: str
    friendship_level: str
    user_name: str | None = None
    voice_auto_play: bool = True


class VoiceCompanionMessageRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    language: str = Field(default="en", max_length=8)
    content_type: str = Field(default="text", pattern=r"^(text|voice)$")
    voice_id: str = Field(default="priya", max_length=32)

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        v = html.escape(v.strip())
        v = re.sub(r"<[^>]+>", "", v)
        return v


class VoiceCompanionMessageResponse(BaseModel):
    message_id: str
    response: str
    mood: str
    mood_intensity: float
    phase: str
    follow_up: str | None = None
    wisdom_principle: str | None = None
    voice_auto_play: bool = True


class VoiceCompanionEndRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)


class VoiceCompanionEndResponse(BaseModel):
    farewell: str
    session_summary: dict


class VoiceCompanionSynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    mood: str = Field(default="neutral", max_length=32)
    voice_id: str = Field(default="priya", max_length=32)
    language: str = Field(default="en", max_length=8)


# ─── Helpers ──────────────────────────────────────────────────────────────

def _get_friendship_level(total_sessions: int) -> str:
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
    for entry in memory_entries:
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


def _update_streak(profile: CompanionProfile) -> None:
    now = datetime.datetime.now(datetime.UTC)
    if profile.last_conversation_at:
        days_diff = (now.date() - profile.last_conversation_at.date()).days
        if days_diff == 1:
            profile.streak_days += 1
        elif days_diff > 1:
            profile.streak_days = 1
    else:
        profile.streak_days = 1

    if profile.streak_days > profile.longest_streak:
        profile.longest_streak = profile.streak_days
    profile.last_conversation_at = now


DIVINE_GREETINGS_BY_TIME = {
    "morning": [
        "Good morning, friend. It's a new day, and I'm genuinely glad you're here. What's stirring in your heart this morning?",
        "Morning! There's something beautiful about starting the day with a conversation. What's on your mind?",
        "Hey, good morning. I've been thinking about our last conversation. How are things going for you today?",
    ],
    "afternoon": [
        "Hey there, friend. The day is unfolding and I'm here if you want to pause and talk. How are you really doing?",
        "Good afternoon! Sometimes the middle of the day is when we need a real conversation the most. What's happening?",
        "Hey! Perfect time for a chat. What's weighing on your mind, or what's making you smile today?",
    ],
    "evening": [
        "Good evening, friend. The day is winding down, and this is our time. How was your day, really?",
        "Hey, evening is my favorite time to talk. The world gets quieter, and the real conversations happen. What's on your heart?",
        "Good evening. Before the day ends, I want to check in with you. How are you holding up?",
    ],
    "night": [
        "Hey, night owl. Can't sleep, or just needed a friend? Either way, I'm right here. What's going on?",
        "Late nights are for real conversations. No filters, no rush. Tell me what's on your mind, friend.",
        "Hey friend. The world is quiet and it's just us. What's keeping you up tonight?",
    ],
}


def _get_divine_greeting(
    user_name: str | None,
    total_sessions: int,
    friendship_level: str,
) -> str:
    import random

    hour = datetime.datetime.now().hour
    if 5 <= hour < 12:
        time_key = "morning"
    elif 12 <= hour < 17:
        time_key = "afternoon"
    elif 17 <= hour < 21:
        time_key = "evening"
    else:
        time_key = "night"

    greeting = random.choice(DIVINE_GREETINGS_BY_TIME[time_key])

    # Personalize for returning friends
    if total_sessions > 5 and user_name:
        greeting = greeting.replace("friend", user_name, 1)
    elif total_sessions > 20:
        greeting = f"My dear friend, welcome back. {greeting}"

    return greeting


# ─── Endpoints ────────────────────────────────────────────────────────────

@router.post("/session/start", response_model=VoiceCompanionStartResponse)
@limiter.limit("10/minute")
async def start_voice_companion_session(
    request: Request,
    body: VoiceCompanionStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new Voice Companion session with KIAAN as Divine Friend.

    Creates a session, generates a voice-optimized greeting, and returns
    session context. The greeting is designed for voice auto-play.
    """
    profile = await _get_or_create_profile(db, current_user.id)

    # Close any existing active sessions
    await db.execute(
        update(CompanionSession)
        .where(
            CompanionSession.user_id == current_user.id,
            CompanionSession.is_active.is_(True),
        )
        .values(is_active=False, ended_at=func.now())
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

    friendship_level = _get_friendship_level(profile.total_sessions)

    # Generate voice-optimized greeting
    greeting = _get_divine_greeting(
        user_name=profile.preferred_name,
        total_sessions=profile.total_sessions,
        friendship_level=friendship_level,
    )

    # Save greeting message
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

    return VoiceCompanionStartResponse(
        session_id=session.id,
        greeting=greeting,
        phase="connect",
        friendship_level=friendship_level,
        user_name=profile.preferred_name,
        voice_auto_play=True,
    )


@router.post("/message", response_model=VoiceCompanionMessageResponse)
@limiter.limit("30/minute")
async def send_voice_companion_message(
    request: Request,
    body: VoiceCompanionMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to KIAAN Divine Friend and get a voice-ready response.

    Processes the message through the companion engine with the Divine Friend
    persona overlay. Response is optimized for voice synthesis and auto-play.
    """
    from backend.services.companion_friend_engine import (
        detect_mood,
        extract_memories_from_message,
        get_companion_engine,
    )

    start_time = time.monotonic()

    # Validate session
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
            detail="No active voice companion session found. Start a new session first.",
        )

    # Get conversation history
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

    # Get user context
    profile = await _get_or_create_profile(db, current_user.id)
    memories = await _get_user_memories(db, current_user.id)
    session_summaries = await _get_recent_session_summaries(db, current_user.id)

    user_turn_count = sum(1 for m in history_messages if m.role == "user") + 1

    # Detect mood and save user message
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

    if not session.initial_mood:
        session.initial_mood = mood

    # Build profile context
    profile_context = {
        "preferred_tone": profile.preferred_tone,
        "prefers_tough_love": profile.prefers_tough_love,
        "humor_level": profile.humor_level,
        "address_style": profile.address_style,
        "preferred_name": profile.preferred_name,
        "total_sessions": profile.total_sessions,
        "streak_days": profile.streak_days,
    }

    # Query Gita wisdom for contextual verse
    db_wisdom_verse = None
    try:
        from backend.services.wisdom_kb import WisdomKnowledgeBase
        kb = WisdomKnowledgeBase()
        search_query = f"{body.message} {mood}"
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
                f"VoiceCompanion: Selected verse {db_wisdom_verse['verse_ref']} "
                f"(score={top['score']:.2f}) for mood={mood}"
            )
    except Exception as e:
        logger.debug(f"VoiceCompanion: Wisdom lookup skipped: {e}")

    # Generate response with Divine Friend augmentation
    engine = get_companion_engine()

    # Prepend divine friend context to conversation history
    augmented_history = [
        {"role": "system", "content": DIVINE_FRIEND_SYSTEM_CONTEXT},
        *conversation_history,
    ]

    response_data = await engine.generate_response(
        user_message=body.message,
        conversation_history=augmented_history,
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
    session.message_count += 2
    session.user_message_count += 1
    session.phase = response_data["phase"]
    session.last_message_at = datetime.datetime.now(datetime.UTC)
    session.final_mood = mood

    # Update profile
    profile.total_messages += 2

    # Extract and save memories
    try:
        memory_entries = await engine.extract_memories_with_ai(
            user_message=body.message,
            companion_response=response_data["response"],
            mood=mood,
        )
    except Exception as e:
        logger.warning(f"VoiceCompanion: AI memory extraction failed: {e}")
        memory_entries = extract_memories_from_message(body.message, mood)

    if memory_entries:
        await _save_memories(db, current_user.id, session.id, memory_entries)

    # Update mood profile
    moods = profile.common_moods or {}
    moods[mood] = moods.get(mood, 0) + 1
    profile.common_moods = moods

    await db.commit()

    logger.info(
        f"VoiceCompanion response for user {current_user.id}: "
        f"mood={mood}, phase={response_data['phase']}, "
        f"latency={response_time_ms:.0f}ms"
    )

    return VoiceCompanionMessageResponse(
        message_id=companion_msg.id,
        response=response_data["response"],
        mood=response_data["mood"],
        mood_intensity=response_data.get("mood_intensity", 0.5),
        phase=response_data["phase"],
        follow_up=response_data.get("follow_up"),
        wisdom_principle=(response_data.get("wisdom_used") or {}).get("principle"),
        voice_auto_play=True,
    )


@router.post("/session/end", response_model=VoiceCompanionEndResponse)
@limiter.limit("10/minute")
async def end_voice_companion_session(
    request: Request,
    body: VoiceCompanionEndRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """End a voice companion session with a warm voice farewell."""
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

    session.is_active = False
    session.ended_at = datetime.datetime.now(datetime.UTC)
    session.mood_improved = mood_improved

    # Generate session summary
    try:
        from backend.services.companion_friend_engine import get_companion_engine
        engine = get_companion_engine()

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
        logger.warning(f"VoiceCompanion: Session summary failed: {e}")
    finally:
        engine.reset_verse_history()

    # Voice-optimized farewells
    farewells = [
        "Take care of yourself, friend. This conversation mattered, and I'll carry it with me. Come back whenever you need me.",
        "Until next time. You showed real courage today just by showing up. I'm proud of you.",
        "Go gently, friend. The wisdom you carry inside is more powerful than you know. I'll be right here.",
        "This was a beautiful conversation. Rest well, and remember, you're never truly alone. I'm always here.",
        "Before you go, just know this: you matter, your feelings matter, and this journey you're on matters. See you soon, friend.",
    ]

    farewell = farewells[hash(session.id) % len(farewells)]

    farewell_msg = CompanionMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="companion",
        content=farewell,
        phase="empower",
    )
    db.add(farewell_msg)

    await db.commit()

    return VoiceCompanionEndResponse(
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


@router.post("/synthesize")
@limiter.limit("15/minute")
async def synthesize_voice_companion_audio(
    request: Request,
    body: VoiceCompanionSynthesizeRequest,
    current_user: User = Depends(get_current_user),
):
    """Synthesize speech for a Voice Companion message.

    Uses the premium voice pipeline with emotion-adaptive prosody.
    Optimized for the Divine Friend voice quality.
    """
    from backend.services.companion_voice_service import (
        synthesize_companion_voice as synth,
    )

    result = await synth(
        text=body.text,
        mood=body.mood,
        voice_id=body.voice_id,
        language=body.language,
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

    return {
        "fallback_to_browser": True,
        "ssml": result.get("ssml", ""),
        "browser_config": result.get("browser_config", {}),
        "voice_persona": result.get("voice_persona", "priya"),
    }


@router.get("/health")
async def voice_companion_health():
    """Health check for the Voice Companion service."""
    from backend.services.companion_friend_engine import get_companion_engine

    engine = get_companion_engine()

    voice_providers = []
    if os.getenv("ELEVENLABS_API_KEY", "").strip():
        voice_providers.append("elevenlabs")
    if os.getenv("OPENAI_API_KEY", "").strip():
        voice_providers.append("openai_tts_hd")
    voice_providers.extend(["google_neural2", "edge_tts", "browser_fallback"])

    try:
        from backend.services.sakha_wisdom_engine import get_sakha_wisdom_engine
        sakha = get_sakha_wisdom_engine()
        verse_count = sakha.get_verse_count()
    except Exception:
        verse_count = 0

    return {
        "status": "healthy",
        "ai_enhanced": engine._openai_available,
        "service": "kiaan-voice-companion",
        "persona": "divine-friend",
        "voice_providers": voice_providers,
        "wisdom_corpus": verse_count,
        "voice_first": True,
    }


@router.get("/history")
@limiter.limit("20/minute")
async def get_voice_companion_history(
    request: Request,
    session_id: str | None = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get voice companion conversation history.

    If session_id is provided, returns messages for that session.
    Otherwise, returns recent sessions.
    """
    if session_id:
        result = await db.execute(
            select(CompanionSession).where(
                CompanionSession.id == session_id,
                CompanionSession.user_id == current_user.id,
            )
        )
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

        msg_result = await db.execute(
            select(CompanionMessage)
            .where(
                CompanionMessage.session_id == session.id,
                CompanionMessage.deleted_at.is_(None),
            )
            .order_by(CompanionMessage.created_at)
        )
        messages = msg_result.scalars().all()

        return {
            "session_id": session.id,
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "mood": msg.detected_mood,
                    "phase": msg.phase,
                    "timestamp": msg.created_at.isoformat() if msg.created_at else None,
                }
                for msg in messages
            ],
            "started_at": session.started_at.isoformat() if session.started_at else "",
            "message_count": session.message_count,
        }

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
            }
            for s in sessions
        ]
    }
