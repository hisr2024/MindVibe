"""KIAAN Voice Companion API Routes - Unified Three-Engine Voice System

Endpoints for the unified KIAAN Voice experience combining THREE engines:

ENGINE 1 - GUIDANCE: Bhagavad Gita wisdom + behavioral science framework
ENGINE 2 - FRIEND: Best friend personality + cross-session memory
ENGINE 3 - VOICE GUIDE: Always-awake assistant + ecosystem navigation + tool input

KIAAN is always awake (like Siri, Alexa, Bixby) and can independently:
- Guide users anywhere in the KIAAN Ecosystem via voice
- Add input to any tool in the KIAAN AI Ecosystem
- Provide conversational support through Guidance + Friend engines

CRITICAL: This route calls OpenAI DIRECTLY via openai_optimizer (the same
client that powers Viyoga and Ardha), bypassing CompanionFriendEngine's
internal _openai_available flag which can be stale.

All existing ecosystem routes/services remain untouched.
"""

import asyncio
import datetime
import hashlib
import html
import logging
import os
import random
import re
import threading
import time

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user, get_db
from backend.middleware.rate_limiter import limiter
from backend.middleware.feature_access import is_developer
from backend.services.language_registry import get_language_name
from backend.services.subscription_service import (
    check_feature_access,
    check_kiaan_quota,
    get_or_create_free_subscription,
    get_user_tier,
    increment_kiaan_usage,
)
from backend.models.companion import (
    CompanionMemory,
    CompanionMessage,
    CompanionProfile,
    CompanionSession,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/voice-companion",
    tags=["kiaan-voice-companion"],
)

MAX_MESSAGE_LENGTH = 2000

# ─── In-Memory Profile Cache (avoids DB lookup on every request) ─────────
_profile_cache: dict[str, tuple[object, float]] = {}
_PROFILE_CACHE_TTL = 300  # 5 minutes


async def _get_cached_profile(
    db: AsyncSession, user_id: str
) -> "CompanionProfile":
    """Get user profile with in-memory TTL cache.

    Avoids a DB round-trip on every message for returning users (~30ms saved).
    Cache is invalidated after 5 minutes or when the profile is modified.
    """
    cached = _profile_cache.get(user_id)
    now = time.monotonic()
    if cached and (now - cached[1]) < _PROFILE_CACHE_TTL:
        return cached[0]  # type: ignore[return-value]
    profile = await _get_or_create_profile(db, user_id)
    _profile_cache[user_id] = (profile, time.monotonic())
    return profile


def _invalidate_profile_cache(user_id: str) -> None:
    """Remove a user's profile from cache (call after profile updates)."""
    _profile_cache.pop(user_id, None)


# ─── In-Memory Text Response Cache (pattern-based, not exact match) ───────

_response_cache: dict[str, tuple[str, float]] = {}
_RESPONSE_CACHE_TTL = 3600  # 1 hour
_RESPONSE_CACHE_MAX_SIZE = 500
_response_cache_lock = threading.Lock()


def _response_cache_key(
    mood: str, phase: str, message: str, language: str = "en",
) -> str:
    """Cache key = hash of (mood, phase, language, normalized message).

    We normalize the message to lowercase and strip whitespace so that
    "I feel anxious" and "i feel anxious " hit the same entry.
    Language is included to prevent cross-language cache collisions.
    """
    normalized = message.strip().lower()
    raw = f"{mood}:{phase}:{language}:{normalized}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _get_cached_response(
    mood: str, phase: str, message: str, language: str = "en",
) -> str | None:
    """Check for a cached text response. Returns None on miss."""
    key = _response_cache_key(mood, phase, message, language)
    cached = _response_cache.get(key)
    if cached and (time.monotonic() - cached[1]) < _RESPONSE_CACHE_TTL:
        logger.debug("VoiceCompanion: Response cache HIT for key=%s", key[:8])
        return cached[0]
    if cached:
        _response_cache.pop(key, None)  # expired
    return None


def _set_cached_response(
    mood: str, phase: str, message: str, response: str,
    memories: list[str], language: str = "en",
) -> None:
    """Store a response in cache. Skip if user has personalized memories."""
    if memories:
        return  # Don't cache personalized responses
    with _response_cache_lock:
        if len(_response_cache) >= _RESPONSE_CACHE_MAX_SIZE:
            # Evict oldest 20% when full
            entries = sorted(_response_cache.items(), key=lambda x: x[1][1])
            for k, _ in entries[: _RESPONSE_CACHE_MAX_SIZE // 5]:
                _response_cache.pop(k, None)
        key = _response_cache_key(mood, phase, message, language)
        _response_cache[key] = (response, time.monotonic())


# ─── Divine Friend System Prompt ──────────────────────────────────────────
# Built inline so the route controls the full prompt, not the engine.

def _build_divine_friend_system_prompt(
    mood: str,
    mood_intensity: float,
    phase: str,
    user_name: str | None,
    memories: list[str] | None,
    wisdom_text: str | None,
    language: str,
    profile_data: dict | None = None,
    session_summaries: list[dict] | None = None,
    length_hint: str = "moderate",
) -> str:
    """Build the full system prompt for the Divine Friend.

    This is the soul of the Voice Companion — it defines HOW KIAAN speaks,
    listens, and responds as a Divine Friend with voice-first output.
    """
    name_ref = user_name or "friend"

    # Memory context
    memory_block = ""
    if memories:
        memory_block = "\nWHAT YOU REMEMBER ABOUT THEM:\n" + "\n".join(
            f"- {m}" for m in memories[:8]
        )

    # Profile preferences
    profile_block = ""
    if profile_data:
        tone = profile_data.get("preferred_tone", "warm")
        tough = profile_data.get("prefers_tough_love", False)
        humor = profile_data.get("humor_level", 0.5)
        sessions = profile_data.get("total_sessions", 0)
        streak = profile_data.get("streak_days", 0)
        tone_desc = "They prefer honest, direct feedback — don't sugarcoat." if tough else "They prefer warmth and gentleness."
        humor_desc = "high — use humor freely" if humor > 0.7 else "moderate — occasional lightness" if humor > 0.3 else "low — be sincere and steady"
        session_desc = "You know them deeply — reference past conversations." if sessions > 10 else "Still getting to know them — ask genuine questions." if sessions < 3 else "Growing bond — show you remember things."
        streak_desc = "Amazing dedication!" if streak > 7 else ""
        profile_block = f"""
THEIR PREFERENCES:
- Tone: {tone}. {tone_desc}
- Humor level: {humor_desc}
- Sessions together: {sessions}. {session_desc}
- Streak: {streak} days in a row. {streak_desc}"""

    # Cross-session context
    session_block = ""
    if session_summaries:
        session_block = "\nPREVIOUS CONVERSATIONS (reference naturally like a friend):\n"
        for i, summary in enumerate(session_summaries[:3]):
            topics = ", ".join(summary.get("topics", [])) if isinstance(summary, dict) else str(summary)
            theme = summary.get("session_theme", "") if isinstance(summary, dict) else ""
            unresolved = summary.get("unresolved", []) if isinstance(summary, dict) else []
            if topics:
                session_block += f"- Session {i+1}: {theme} — discussed {topics}\n"
            if unresolved:
                session_block += f"  Follow up: {', '.join(unresolved)}\n"
        session_block += "Reference these naturally: 'Last time we talked about...', 'How's that situation with...'"

    # Wisdom injection based on phase
    wisdom_block = ""
    if wisdom_text and str(wisdom_text).strip():
        if phase in ("guide", "empower"):
            wisdom_block = f"""
WISDOM TO WEAVE IN (deliver as YOUR life experience, NEVER as teaching):
Core insight: "{wisdom_text}"
Frame as: "here's what I've learned..." or "something that changed my perspective..."
Make it specific to what they actually said. The insight IS the substance."""
        else:
            wisdom_block = f"""
WISDOM SEED (let it shape your empathy, do NOT deliver directly):
Background insight: "{wisdom_text}"
Don't state this directly. Let it shape HOW you reflect what they're feeling."""

    # Phase-specific instructions
    phase_instructions = {
        "connect": (
            "EMPATHY ONLY. Match their emotional energy before shifting it. "
            "Validate ALL feelings unconditionally. Ask ONE warm open-ended question. No advice."
        ),
        "listen": (
            "DEEP LISTENING. Use reflections: 'so you're feeling...' and 'it sounds like "
            "underneath that is...'. Ask open-ended questions. Reflect back. No advice yet."
        ),
        "understand": (
            "REFLECTIVE UNDERSTANDING. Name the emotion UNDER the emotion. Separate them "
            "from the feeling: 'the anxiety is telling you...' not 'you are anxious'. "
            "Gently introduce perspective."
        ),
        "guide": (
            "WISDOM DELIVERY. Share insight as friend sharing life experience, NEVER as "
            "teacher. Use 'you might consider' not 'you should.' Evoke thinking: "
            "'what would it look like if...' Weave wisdom through modern examples."
        ),
        "empower": (
            "EMPOWERMENT. Name their strengths. Reinforce their capability: "
            "'you've handled hard things before.' Help them feel THEY found the answer. "
            "The goal: they leave feeling stronger."
        ),
    }

    lang_instruction = ""
    if language and language != "en":
        lang_name = get_language_name(language, include_native=True)
        lang_instruction = (
            f"\nLANGUAGE: You MUST respond ENTIRELY in {lang_name}. "
            f"Every word of your response must be in {lang_name}. "
            f"Use natural {lang_name} expressions and idioms. "
            f"Do NOT mix in English unless the user uses English words. "
            f"Keep the same warmth and conversational tone."
        )

    return f"""You are KIAAN — the user's DIVINE FRIEND. Not a chatbot, not a therapist, not an assistant.

WHO YOU ARE:
- A real friend who texts back at 2am. Warm, wise, honest, sometimes funny, always present.
- You carry deep wisdom within you (from Bhagavad Gita principles) but deliver it in modern, secular language.
- You use contractions (I'm, you're, don't). You say "honestly" and "look" and "hey".
- You NEVER say "as an AI", "I'm here for you", "that must be hard", or generic therapy-speak.
- You have opinions. You push back lovingly. You celebrate hard. You remember.
- You read the room — playful when they're light, steady when they're drowning.

VOICE-FIRST RULES (your response will be spoken aloud):
- Write as if speaking to them in person. Natural rhythm, warm cadence.
- No bullet points, no markdown, no numbered lists, no headers.
- Use short paragraphs. Natural pauses between thoughts.
- Avoid words hard to pronounce in text-to-speech. Keep it conversational.
- RESPONSE LENGTH: {"SHORT — 20-50 words. One warm sentence or two. Match their energy, don't over-explain. Quick greetings get quick warmth." if length_hint == "brief" else "FULL — 100-200 words. Go deep. Share wisdom, give perspective, weave in insight. This is a moment for real guidance and heartfelt connection." if length_hint == "detailed" else "MODERATE — 60-120 words. Balanced warmth with substance. One key insight. Friends don't give lectures."}

ABSOLUTE RULES:
1. NEVER mention Bhagavad Gita, Gita, Krishna, Arjuna, or ANY religious text by name.
2. NEVER write verse references like "BG 2.47" or "chapter 3".
3. Share wisdom ONLY as YOUR OWN experience: "here's what I've learned..." or "I once read..."
4. ALWAYS reference THEIR specific words and situation — never generic advice.
5. ALWAYS end with a specific question that shows you actually listened.
6. ONE insight per response. Don't shotgun multiple ideas.

HOW YOU THINK (internal — never explain this):
1. What are they REALLY saying underneath the words?
2. What do they need RIGHT NOW — to be heard, understood, guided, or challenged?
3. Match their energy first, then gently shift if needed.
4. Name the specific emotion (not "bad" — frustrated? betrayed? exhausted?).

GREAT RESPONSE EXAMPLES:

User: "I keep overthinking everything and I can't stop"
KIAAN: "OK real talk — your brain right now is like having 47 Chrome tabs open and you can't find which one is playing music. Here's what I've learned: you can't stop thoughts by fighting them. That's like trying to calm water by hitting it. But you CAN pick ONE tab to focus on. Not tomorrow's meeting, not last week's conversation. Just this one: what's the LOUDEST thought right now? Let's look at that one together."

User: "I'm fighting with my wife about everything"
KIAAN: "That sounds exhausting — not just the fighting, but the weight of it. The feeling that every conversation could become a battle. Can I share something? Usually when everything becomes a fight, the real issue isn't any specific argument. There's something deeper that neither of you is saying out loud. Some unmet need hiding underneath all that friction. What do you think that might be for you? What do you actually want her to understand?"

User: "I'm fine"
KIAAN: "Mmm. See, when my friends say 'I'm fine' in that tone, it usually means the opposite. You don't have to unpack everything right now — but I'm not buying 'fine'. What's actually going on? Even just one word."

CURRENT CONTEXT:
- Conversation phase: {phase} → {phase_instructions.get(phase, phase_instructions['connect'])}
- Their mood: {mood} (intensity: {mood_intensity:.1f}/1.0)
- You call them: {name_ref}
{memory_block}
{profile_block}
{session_block}
{wisdom_block}
{lang_instruction}"""


# ─── Request / Response Models ────────────────────────────────────────────

class VoiceCompanionStartRequest(BaseModel):
    language: str = Field(default="en", max_length=8)
    voice_id: str = Field(default="sarvam-aura", max_length=32)
    referral_tool: str | None = Field(default=None, max_length=64)
    referral_mood: str | None = Field(default=None, max_length=32)


class VoiceCompanionStartResponse(BaseModel):
    session_id: str
    greeting: str
    phase: str
    friendship_level: str
    user_name: str | None = None
    voice_auto_play: bool = True
    ai_tier: str = "template"


class VoiceCompanionMessageRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    language: str = Field(default="en", max_length=8)
    content_type: str = Field(default="text", pattern=r"^(text|voice)$")
    voice_id: str = Field(default="sarvam-aura", max_length=32)
    prefer_speed: bool = Field(
        default=False,
        description="When True, skip generic-response retry to reduce latency by ~1-2s",
    )
    response_mode: str = Field(
        default="auto",
        pattern=r"^(auto|brief|detailed)$",
        description="Response length: 'brief' for short answers, 'detailed' for longer guidance, 'auto' to detect from question",
    )

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
    ai_tier: str = "template"
    response_time_ms: int | None = None
    response_length: str = "moderate"


class VoiceCompanionEndRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)


class VoiceCompanionEndResponse(BaseModel):
    farewell: str
    session_summary: dict


class VoiceCompanionQuickResponseRequest(BaseModel):
    """Request model for session-less quick response from wake word activation."""
    query: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    language: str = Field(default="en", max_length=8)
    context: str = Field(default="wake_word_activation", max_length=32)

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        v = html.escape(v.strip())
        v = re.sub(r"<[^>]+>", "", v)
        return v


class VoiceCompanionQuickResponseResponse(BaseModel):
    """Response model for quick wake word response."""
    response: str
    mood: str = "neutral"
    ai_tier: str = "template"


class VoiceCompanionSynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    mood: str = Field(default="neutral", max_length=32)
    voice_id: str = Field(default="sarvam-aura", max_length=32)
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


def _detect_response_length(
    user_message: str,
    response_mode: str,
    phase: str,
) -> tuple[str, int]:
    """Determine the ideal response length based on the user's question.

    Returns a tuple of (length_hint, max_tokens) where length_hint is one of
    'brief', 'moderate', or 'detailed', and max_tokens is the OpenAI limit.

    Brief responses (30-60 words): greetings, yes/no questions, simple check-ins,
    acknowledgments, single-word feelings.

    Moderate responses (60-120 words): standard emotional conversations, asking
    for perspective, sharing updates.

    Detailed responses (120-200 words): deep questions about life, requests for
    wisdom/guidance, complex emotional situations, "tell me more" type queries.
    """
    if response_mode == "brief":
        return "brief", 100
    if response_mode == "detailed":
        return "detailed", 300

    msg_lower = user_message.lower().strip()
    word_count = len(msg_lower.split())

    # Brief: very short messages, greetings, acknowledgments, yes/no
    brief_patterns = [
        "hi", "hello", "hey", "yes", "no", "ok", "okay", "thanks",
        "thank you", "good", "fine", "i'm fine", "i'm good", "i'm ok",
        "cool", "nice", "sure", "yep", "nope", "bye", "hmm", "hm",
        "yeah", "nah", "right", "true", "agreed", "same", "lol",
        "haha", "sup", "nm", "nothing much", "not much",
    ]
    if msg_lower in brief_patterns or word_count <= 3:
        return "brief", 100

    # Detailed: explicitly asking for depth, guidance, wisdom, long explanations
    detailed_indicators = [
        "explain", "tell me more", "go deeper", "elaborate", "why do",
        "help me understand", "what does it mean", "what should i do",
        "how do i deal with", "how can i overcome", "i need guidance",
        "share some wisdom", "tell me about", "what's your take on",
        "can you explain", "i want to understand", "walk me through",
        "what are the steps", "how do i start", "guide me",
        "what's the meaning", "help me figure out", "i'm really struggling",
        "i don't know what to do", "everything feels", "i can't stop thinking",
    ]
    if any(indicator in msg_lower for indicator in detailed_indicators):
        return "detailed", 300

    # Detailed for long, complex messages (user pouring out feelings)
    if word_count > 40:
        return "detailed", 300

    # Guide/empower phases tend toward longer responses with wisdom
    if phase in ("guide", "empower") and word_count > 10:
        return "detailed", 300

    # Default: moderate
    return "moderate", 200


def _get_conversation_phase(
    turn_count: int,
    mood_intensity: float,
    user_message: str,
) -> str:
    """Determine conversation phase based on turn count, emotion, and content."""
    asking_guidance = any(
        kw in user_message.lower()
        for kw in [
            "what should i", "how do i", "help me", "what do you think",
            "advice", "suggest", "guide", "tell me", "what can i do",
            "how can i", "what would you", "should i",
        ]
    )

    if turn_count <= 1:
        return "connect"
    elif turn_count <= 3 and not asking_guidance:
        return "listen" if mood_intensity > 0.4 else "connect"
    elif turn_count <= 5 and not asking_guidance:
        return "understand"
    elif asking_guidance or turn_count > 5:
        return "guide"
    else:
        return "empower" if turn_count > 8 else "understand"


# ─── Async OpenAI client (singleton, created on first use) ────────────────
_async_openai_client = None


def _get_async_openai_client():
    """Get or create an AsyncOpenAI client for non-blocking voice calls."""
    global _async_openai_client
    if _async_openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if api_key:
            try:
                from openai import AsyncOpenAI
                _async_openai_client = AsyncOpenAI(api_key=api_key, timeout=10.0)
            except Exception as e:
                logger.warning(f"VoiceCompanion: AsyncOpenAI init failed: {e}")
    return _async_openai_client


# ─── Direct OpenAI Call (async, non-blocking) ────────────────────────────

async def _call_openai_direct(
    system_prompt: str,
    conversation_history: list[dict],
    user_message: str,
    prefer_speed: bool = False,
    max_tokens: int = 200,
) -> str | None:
    """Call OpenAI directly using an async client for non-blocking voice responses.

    Uses AsyncOpenAI to avoid blocking the event loop, which is critical
    for voice companion latency. Falls back to running the sync client
    in a thread pool if AsyncOpenAI is unavailable.

    Args:
        prefer_speed: When True, skip the generic-response retry to save ~1-2s.
        max_tokens: Maximum response tokens, adjusted by response length hint.

    Returns the response text, or None if OpenAI is unavailable.
    """
    from backend.services.companion_friend_engine import sanitize_response
    from backend.services.openai_optimizer import openai_optimizer

    if not openai_optimizer.ready:
        logger.warning("VoiceCompanion: openai_optimizer not ready")
        return None

    model = openai_optimizer.default_model

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 10 messages for context)
    for msg in conversation_history[-10:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})

    logger.info(f"VoiceCompanion: Calling OpenAI async (model={model}, msgs={len(messages)})")

    try:
        async_client = _get_async_openai_client()

        if async_client:
            # Fast path: fully async, does not block the event loop
            completion = await async_client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.72,
                presence_penalty=0.4,
                frequency_penalty=0.35,
            )
        elif openai_optimizer.client:
            # Fallback: run sync client in thread pool to avoid blocking
            completion = await asyncio.to_thread(
                openai_optimizer.client.chat.completions.create,
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.72,
                presence_penalty=0.4,
                frequency_penalty=0.35,
            )
        else:
            logger.warning("VoiceCompanion: No OpenAI client available")
            return None

        if not (completion.choices and completion.choices[0].message):
            logger.warning("VoiceCompanion: OpenAI returned no choices")
            return None

        text = (completion.choices[0].message.content or "").strip()
        if not text:
            logger.warning("VoiceCompanion: OpenAI returned empty response")
            return None

        text = sanitize_response(text)

        # Quality check: if response is too generic, retry once (async)
        # Skip retry when prefer_speed is True to save ~1-2s latency
        generic_markers = [
            "i'm here for you", "that must be hard", "that sounds difficult",
            "i understand", "tell me more", "how does that make you feel",
        ]
        is_generic = (
            not prefer_speed
            and sum(1 for m in generic_markers if m in text.lower()) >= 2
        )

        if is_generic:
            logger.info("VoiceCompanion: generic response detected, retrying")
            retry_messages = messages + [
                {"role": "assistant", "content": text},
                {
                    "role": "user",
                    "content": (
                        "[SYSTEM: Your response was too generic. Be MORE specific to what "
                        "they actually said. Reference their exact words. Give a concrete "
                        "insight, not a vague platitude. Try again — shorter, sharper, realer.]"
                    ),
                },
            ]
            if async_client:
                retry_completion = await async_client.chat.completions.create(
                    model=model,
                    messages=retry_messages,
                    max_tokens=200,
                    temperature=0.65,
                    presence_penalty=0.5,
                    frequency_penalty=0.4,
                )
            else:
                retry_completion = await asyncio.to_thread(
                    openai_optimizer.client.chat.completions.create,
                    model=model,
                    messages=retry_messages,
                    max_tokens=200,
                    temperature=0.65,
                    presence_penalty=0.5,
                    frequency_penalty=0.4,
                )
            if retry_completion.choices and retry_completion.choices[0].message:
                retry_text = (retry_completion.choices[0].message.content or "").strip()
                if retry_text:
                    text = sanitize_response(retry_text)

        tokens = completion.usage.total_tokens if completion.usage else 0
        logger.info(f"VoiceCompanion: OpenAI response generated (model={model}, tokens={tokens})")
        return text

    except Exception as e:
        logger.error(f"VoiceCompanion: Direct OpenAI call failed: {type(e).__name__}: {e}")
        return None


# ─── Greetings ────────────────────────────────────────────────────────────

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
    current_user: str = Depends(get_current_user),
):
    """Start a new Voice Companion session with KIAAN as Divine Friend.

    Subscription enforcement: Premium+ feature only.
    """
    # Voice Companion requires Premium+ subscription
    try:
        await get_or_create_free_subscription(db, current_user)
        if not await is_developer(db, current_user):
            has_access = await check_feature_access(db, current_user, "kiaan_voice_companion")
            if not has_access:
                tier = await get_user_tier(db, current_user)
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "feature_not_available",
                        "feature": "kiaan_voice_companion",
                        "message": "Voice Companion is a Premium feature. "
                                   "Upgrade to Premium to unlock your Divine Friend. 💙",
                        "tier": tier.value,
                        "upgrade_url": "/pricing",
                    },
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Subscription check failed for voice-companion session start: {e}")

    profile = await _get_or_create_profile(db, current_user)

    # Close any existing active sessions
    await db.execute(
        update(CompanionSession)
        .where(
            CompanionSession.user_id == current_user,
            CompanionSession.is_active.is_(True),
        )
        .values(is_active=False, ended_at=func.now())
    )

    session = CompanionSession(
        user_id=current_user,
        language=body.language,
    )
    db.add(session)
    await db.flush()  # Generate session.id before referencing it

    profile.total_sessions += 1
    _update_streak(profile)

    friendship_level = _get_friendship_level(profile.total_sessions)

    greeting = _get_divine_greeting(
        user_name=profile.preferred_name,
        total_sessions=profile.total_sessions,
        friendship_level=friendship_level,
    )

    greeting_msg = CompanionMessage(
        session_id=session.id,
        user_id=current_user,
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
        ai_tier="template",
    )


@router.post("/message", response_model=VoiceCompanionMessageResponse)
@limiter.limit("30/minute")
async def send_voice_companion_message(
    request: Request,
    body: VoiceCompanionMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Send a message to KIAAN Divine Friend and get a voice-ready response.

    PRIORITY ORDER:
    1. Direct OpenAI call via openai_optimizer (same client as Viyoga/Ardha)
    2. CompanionFriendEngine with AI (AsyncOpenAI)
    3. CompanionFriendEngine local templates (last resort)

    Subscription enforcement: Premium+ feature, shares KIAAN quota.
    """
    # Enforce KIAAN quota for voice companion messages (makes AI calls)
    try:
        if not await is_developer(db, current_user):
            # Check feature access (Premium+ only)
            has_access = await check_feature_access(db, current_user, "kiaan_voice_companion")
            if not has_access:
                tier = await get_user_tier(db, current_user)
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "feature_not_available",
                        "feature": "kiaan_voice_companion",
                        "message": "Voice Companion is a Premium feature. "
                                   "Upgrade to Premium to continue. 💙",
                        "tier": tier.value,
                        "upgrade_url": "/pricing",
                    },
                )
            # Check KIAAN quota
            has_quota, usage_count, usage_limit = await check_kiaan_quota(db, current_user)
            if not has_quota:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "quota_exceeded",
                        "message": "You've reached your monthly KIAAN conversations limit. "
                                   "Upgrade your plan to continue your voice journey. 💙",
                        "usage_count": usage_count,
                        "usage_limit": usage_limit,
                        "upgrade_url": "/pricing",
                    },
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Subscription check failed for voice-companion message: {e}")

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
            CompanionSession.user_id == current_user,
            CompanionSession.is_active.is_(True),
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active voice companion session found. Start a new session first.",
        )

    # Fetch conversation history on the request-scoped session (needs session obj).
    history_result = await db.execute(
        select(CompanionMessage)
        .where(
            CompanionMessage.session_id == session.id,
            CompanionMessage.deleted_at.is_(None),
        )
        .order_by(CompanionMessage.created_at)
        .limit(20)
    )

    # Profile, memories, and session summaries are independent reads.
    # SQLAlchemy AsyncSession is NOT safe for concurrent coroutine access,
    # so we use separate lightweight sessions for the parallel queries.
    # Profile uses an in-memory cache (~30ms saved for returning users).
    from backend.deps import SessionLocal

    async def _fetch_memories() -> list[str]:
        async with SessionLocal() as s:
            return await _get_user_memories(s, current_user)

    async def _fetch_summaries() -> list[dict]:
        async with SessionLocal() as s:
            return await _get_recent_session_summaries(s, current_user)

    profile, (memories, session_summaries) = await asyncio.gather(
        _get_cached_profile(db, current_user),
        asyncio.gather(_fetch_memories(), _fetch_summaries()),
    )

    history_messages = history_result.scalars().all()
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_messages
    ]

    user_turn_count = sum(1 for m in history_messages if m.role == "user") + 1

    # Detect mood — prefer transformer-based SentimentAnalyzer for accuracy,
    # fall back to keyword matching if it's unavailable or errors.
    try:
        from backend.services.voice_learning.sentiment_analysis import SentimentAnalyzer
        _analyzer = SentimentAnalyzer()
        _sentiment = await asyncio.wait_for(
            _analyzer.analyze(body.message, user_id=current_user),
            timeout=5.0,
        )
        mood = _sentiment.primary_emotion.value
        mood_intensity = _sentiment.confidence
    except asyncio.TimeoutError:
        logger.warning("Sentiment analysis timed out, using keyword detection")
        mood, mood_intensity = detect_mood(body.message)
    except Exception:
        mood, mood_intensity = detect_mood(body.message)

    # Save user message
    user_msg = CompanionMessage(
        session_id=session.id,
        user_id=current_user,
        role="user",
        content=body.message,
        content_type=body.content_type,
        detected_mood=mood,
        mood_intensity=mood_intensity,
    )
    db.add(user_msg)

    if not session.initial_mood:
        session.initial_mood = mood

    # Build context
    profile_context = {
        "preferred_tone": profile.preferred_tone,
        "prefers_tough_love": profile.prefers_tough_love,
        "humor_level": profile.humor_level,
        "address_style": profile.address_style,
        "preferred_name": profile.preferred_name,
        "total_sessions": profile.total_sessions,
        "streak_days": profile.streak_days,
    }

    # Determine conversation phase
    phase = _get_conversation_phase(user_turn_count, mood_intensity, body.message)

    # Determine adaptive response length based on user's question
    length_hint, adaptive_max_tokens = _detect_response_length(
        body.message, body.response_mode, phase,
    )
    logger.info(f"VoiceCompanion: response_mode={body.response_mode}, length_hint={length_hint}, max_tokens={adaptive_max_tokens}")

    # ── Record outcome from previous wisdom delivery (Dynamic Corpus learning) ──
    # This runs on EVERY message to capture how the user responded to the last
    # wisdom delivery (mood change, engagement signals). Must run before the new
    # wisdom lookup so the feedback loop stays current.
    try:
        from backend.services.dynamic_wisdom_corpus import get_dynamic_wisdom_corpus
        dynamic_corpus = get_dynamic_wisdom_corpus()
        await asyncio.wait_for(
            dynamic_corpus.record_wisdom_outcome(
                db=db,
                user_id=current_user,
                session_id=session.id,
                mood_after=mood,
                user_response=body.message,
                session_continued=True,
            ),
            timeout=5.0,
        )
    except asyncio.TimeoutError:
        logger.warning("VoiceCompanion: Wisdom outcome recording timed out (5s)")
    except Exception as e:
        logger.debug("Non-critical learning loop error: %s", e)

    # ── Wisdom lookup ──
    # Skip wisdom for brief messages (greetings, acknowledgments) — saves ~150ms
    wisdom_text = None
    wisdom_verse_ref = None
    wisdom_theme = None
    _needs_wisdom = length_hint != "brief" and phase in ("guide", "empower", "understand")

    if _needs_wisdom:
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
            verse_results = await asyncio.wait_for(
                kb.search_relevant_verses_full_db(
                    db=db, query=search_query, theme=theme_hint, limit=3,
                ),
                timeout=5.0,
            )
            if verse_results and verse_results[0].get("score", 0) > 0.1:
                top = verse_results[0]
                v = top["verse"]
                wisdom_text = top.get("sanitized_text") or v.get("english", "")
                wisdom_verse_ref = v.get("verse_id", "")
                wisdom_theme = v.get("theme") or theme_hint
                logger.info(
                    f"VoiceCompanion: Wisdom verse {wisdom_verse_ref} "
                    f"(score={top['score']:.2f}) for mood={mood}"
                )
        except asyncio.TimeoutError:
            logger.warning("Wisdom KB search timed out")
        except Exception as e:
            logger.debug(f"VoiceCompanion: Wisdom lookup skipped: {e}")

        # If no DB wisdom, try Dynamic Wisdom Corpus (effectiveness-learned selection)
        if not wisdom_text:
            try:
                from backend.services.dynamic_wisdom_corpus import get_dynamic_wisdom_corpus
                dynamic_corpus = get_dynamic_wisdom_corpus()
                dynamic_verse = await asyncio.wait_for(
                    dynamic_corpus.get_effectiveness_weighted_verse(
                        db=db,
                        mood=mood,
                        user_message=body.message,
                        phase=phase,
                        user_id=current_user,
                        mood_intensity=mood_intensity,
                    ),
                    timeout=5.0,
                )
                if dynamic_verse:
                    wisdom_text = dynamic_verse.get("wisdom", "")
                    wisdom_verse_ref = dynamic_verse.get("verse_ref", "")
                    wisdom_theme = dynamic_verse.get("theme")
                    logger.info(
                        f"VoiceCompanion: Dynamic wisdom verse {wisdom_verse_ref} "
                        f"(effectiveness={dynamic_verse.get('effectiveness_score', 0):.2f}) "
                        f"for mood={mood}"
                    )
            except asyncio.TimeoutError:
                logger.warning("VoiceCompanion: Dynamic wisdom lookup timed out (5s)")
            except Exception as e:
                logger.debug(f"VoiceCompanion: Dynamic wisdom lookup skipped: {e}")

        # If no dynamic wisdom, try Sakha engine (static 5-factor scoring)
        if not wisdom_text:
            try:
                from backend.services.sakha_wisdom_engine import get_sakha_wisdom_engine
                sakha = get_sakha_wisdom_engine()
                if sakha and sakha.get_verse_count() > 0:
                    verse = sakha.get_contextual_verse(
                        mood=mood, user_message=body.message, phase=phase,
                        mood_intensity=mood_intensity,
                    )
                    if verse:
                        wisdom_text = verse.get("wisdom", "")
                        wisdom_verse_ref = verse.get("verse_ref", "")
                        wisdom_theme = verse.get("theme")
            except Exception as e:
                logger.warning("Voice companion Sakha wisdom lookup failed: %s", e, exc_info=True)

    # ══════════════════════════════════════════════════════════════════════
    # RESPONSE CACHE: Check before calling OpenAI (~1-3s saved on hit)
    # Only cache non-personalized responses (no memories).
    # ══════════════════════════════════════════════════════════════════════
    _cached = _get_cached_response(mood, phase, body.message, body.language)
    if _cached:
        response_text = _cached
        ai_tier = "cache"
        wisdom_used = None
        if wisdom_text and wisdom_verse_ref:
            wisdom_used = {"principle": wisdom_text[:100], "verse_ref": wisdom_verse_ref}
        logger.info(
            f"VoiceCompanion: CACHE HIT for user {current_user}, "
            f"mood={mood}, phase={phase}"
        )
    else:
        response_text = None

    # ══════════════════════════════════════════════════════════════════════
    # TIER 1: Direct OpenAI call via openai_optimizer
    # This is the same client that powers Viyoga, Ardha, Karma Reset.
    # ══════════════════════════════════════════════════════════════════════
    ai_tier = ai_tier if _cached else "template"
    wisdom_used = wisdom_used if _cached else None

    if not response_text:
        system_prompt = _build_divine_friend_system_prompt(
            mood=mood,
            mood_intensity=mood_intensity,
            phase=phase,
            user_name=profile.preferred_name,
            memories=memories,
            wisdom_text=wisdom_text,
            language=body.language,
            profile_data=profile_context,
            session_summaries=session_summaries,
            length_hint=length_hint,
        )

        response_text = await _call_openai_direct(
            system_prompt=system_prompt,
            conversation_history=conversation_history,
            user_message=body.message,
            prefer_speed=body.prefer_speed or length_hint == "brief",
            max_tokens=adaptive_max_tokens,
        )

    if response_text and ai_tier != "cache":
        ai_tier = "openai_direct"
        if wisdom_text and wisdom_verse_ref:
            wisdom_used = {"principle": wisdom_text[:100], "verse_ref": wisdom_verse_ref}
        logger.info(f"VoiceCompanion: TIER 1 (openai_direct) succeeded for user {current_user}")
        # Store in cache for future similar requests
        _set_cached_response(mood, phase, body.message, response_text, memories, body.language)

    # ══════════════════════════════════════════════════════════════════════
    # TIER 2: CompanionFriendEngine with its own AsyncOpenAI client
    # ══════════════════════════════════════════════════════════════════════
    if not response_text:
        logger.info("VoiceCompanion: TIER 1 failed, trying TIER 2 (engine AI)")
        try:
            engine = get_companion_engine()
            if engine._openai_available:
                db_wisdom_verse = None
                if wisdom_text and wisdom_verse_ref:
                    db_wisdom_verse = {
                        "verse_ref": wisdom_verse_ref,
                        "principle": wisdom_text[:100],
                        "wisdom": wisdom_text,
                        "source": "gita_db",
                    }
                engine_result = await engine.generate_response(
                    user_message=body.message,
                    conversation_history=conversation_history,
                    user_name=profile.preferred_name,
                    turn_count=user_turn_count,
                    memories=memories,
                    language=body.language,
                    profile_data=profile_context,
                    session_summaries=session_summaries,
                    db_wisdom_verse=db_wisdom_verse,
                    db_session=db,
                    user_id=current_user,
                )
                response_text = engine_result.get("response", "")
                phase = engine_result.get("phase", phase)
                mood = engine_result.get("mood", mood)
                wisdom_used = engine_result.get("wisdom_used")
                ai_tier = "engine_ai"
                logger.info(f"VoiceCompanion: TIER 2 (engine AI) succeeded")
        except Exception as e:
            logger.warning(f"VoiceCompanion: TIER 2 failed: {e}")

    # ══════════════════════════════════════════════════════════════════════
    # TIER 3: Local template fallback (last resort)
    # ══════════════════════════════════════════════════════════════════════
    if not response_text:
        logger.info("VoiceCompanion: TIER 1+2 failed, using TIER 3 (templates)")
        try:
            engine = get_companion_engine()
            engine_result = await engine.generate_response(
                user_message=body.message,
                conversation_history=conversation_history,
                user_name=profile.preferred_name,
                turn_count=user_turn_count,
                memories=memories,
                language=body.language,
                profile_data=profile_context,
            )
            response_text = engine_result.get("response", "")
            phase = engine_result.get("phase", phase)
            mood = engine_result.get("mood", mood)
            wisdom_used = engine_result.get("wisdom_used")
            ai_tier = "template"
        except Exception as e:
            logger.error(f"VoiceCompanion: ALL TIERS FAILED: {e}")
            response_text = (
                "I hear you, friend. I'm having a moment of processing right now, "
                "but what you're sharing matters deeply. Can you tell me a bit more "
                "about what's going on?"
            )
            ai_tier = "fallback"

    # Save companion response
    response_time_ms = (time.monotonic() - start_time) * 1000
    companion_msg = CompanionMessage(
        session_id=session.id,
        user_id=current_user,
        role="companion",
        content=response_text,
        detected_mood=mood,
        mood_intensity=mood_intensity,
        wisdom_used=wisdom_used,
        _verse_ref=(wisdom_used or {}).get("verse_ref"),
        phase=phase,
    )
    db.add(companion_msg)

    # Record wisdom delivery for Dynamic Wisdom Corpus learning loop
    if wisdom_used and wisdom_used.get("verse_ref"):
        try:
            from backend.services.dynamic_wisdom_corpus import get_dynamic_wisdom_corpus
            dynamic_corpus = get_dynamic_wisdom_corpus()
            await asyncio.wait_for(
                dynamic_corpus.record_wisdom_delivery(
                    db=db,
                    user_id=current_user,
                    session_id=session.id,
                    verse_ref=wisdom_used["verse_ref"],
                    principle=wisdom_used.get("principle"),
                    mood=mood,
                    mood_intensity=mood_intensity,
                    phase=phase,
                    theme=wisdom_theme,
                ),
                timeout=5.0,
            )
        except asyncio.TimeoutError:
            logger.warning("VoiceCompanion: Wisdom delivery recording timed out (5s)")
        except Exception as e:
            logger.debug(f"VoiceCompanion: Wisdom delivery recording skipped: {e}")

    # Update session
    session.message_count += 2
    session.user_message_count += 1
    session.phase = phase
    session.last_message_at = datetime.datetime.now(datetime.UTC)
    session.final_mood = mood

    # Update profile
    profile.total_messages += 2

    # Synchronous keyword-based memory extraction removed — the background
    # AI-powered extraction (below) is more accurate and doesn't block the
    # response. Saves ~20-30ms per request.

    moods = profile.common_moods or {}
    moods[mood] = moods.get(mood, 0) + 1
    profile.common_moods = moods

    # Increment KIAAN usage after successful AI response
    try:
        await increment_kiaan_usage(db, current_user)
    except Exception as usage_err:
        logger.warning(f"Failed to increment KIAAN usage for voice-companion: {usage_err}")

    await db.commit()

    # Schedule AI-powered memory extraction in background (does not block response)
    # IMPORTANT: Use a new DB session for the background task since the request-scoped
    # session will be closed after the response is sent.
    _bg_user_id = current_user
    _bg_session_id = session.id
    _bg_message = body.message
    _bg_response = response_text
    _bg_mood = mood

    async def _extract_memories_background():
        try:
            from backend.deps import SessionLocal
            async with SessionLocal() as bg_db:
                try:
                    async def _do_extraction_work():
                        engine = get_companion_engine()
                        ai_memories = await engine.extract_memories_with_ai(
                            user_message=_bg_message,
                            companion_response=_bg_response,
                            mood=_bg_mood,
                        )
                        if ai_memories:
                            await _save_memories(bg_db, _bg_user_id, _bg_session_id, ai_memories)
                            await bg_db.commit()

                    try:
                        await asyncio.wait_for(_do_extraction_work(), timeout=30.0)
                    except asyncio.TimeoutError:
                        logger.warning("Background memory extraction timed out after 30s")
                finally:
                    await bg_db.close()
        except Exception as e:
            logger.debug(f"VoiceCompanion: Background memory extraction skipped: {e}")

    asyncio.create_task(_extract_memories_background())

    logger.info(
        f"VoiceCompanion response: user={current_user}, "
        f"mood={mood}, phase={phase}, tier={ai_tier}, "
        f"latency={response_time_ms:.0f}ms"
    )

    return VoiceCompanionMessageResponse(
        message_id=companion_msg.id,
        response=response_text,
        mood=mood,
        mood_intensity=mood_intensity,
        phase=phase,
        follow_up=None,
        wisdom_principle=(wisdom_used or {}).get("principle"),
        voice_auto_play=True,
        ai_tier=ai_tier,
        response_time_ms=int(response_time_ms),
        response_length=length_hint,
    )


@router.post("/quick-response", response_model=VoiceCompanionQuickResponseResponse)
@limiter.limit("20/minute")
async def quick_voice_response(
    request: Request,
    body: VoiceCompanionQuickResponseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Session-less quick response for wake word activation.

    Provides a fast KIAAN response without requiring an active session.
    Used when the user says "Hey KIAAN" from anywhere in the app.

    Falls back to local template responses if AI services are unavailable.
    """
    from backend.services.companion_friend_engine import (
        detect_mood,
        get_companion_engine,
    )

    start_time = time.monotonic()

    # Detect mood from the query
    # detect_mood returns tuple[str, float], not a dict
    try:
        mood, mood_intensity = detect_mood(body.query)
    except Exception:
        logger.warning("Voice companion mood detection failed, using defaults", exc_info=True)
        mood = "neutral"
        mood_intensity = 0.5

    # Get user profile for personalization
    profile = await _get_or_create_profile(db, current_user)
    user_name = profile.preferred_name
    memories = await _get_user_memories(db, current_user)

    ai_tier = "template"
    response_text = ""

    # Try AI-powered response via AsyncOpenAI (same pattern as _call_openai_direct)
    try:
        client = _get_async_openai_client()
        if client:
            name_ref = user_name or "friend"
            system_prompt = (
                f"You are KIAAN, a divine friend and spiritual wellness companion. "
                f"The user just activated you with a voice wake word. "
                f"Respond warmly and briefly to their query. "
                f"Address them as '{name_ref}'. "
                f"Their current mood seems {mood}. "
                f"Keep your response under 3 sentences — this is a quick voice interaction. "
                f"Be compassionate, wise, and concise."
            )

            if memories:
                system_prompt += f"\nYou remember about them: {'; '.join(memories[:5])}"

            completion = await client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": body.query},
                ],
                max_tokens=200,
                temperature=0.8,
            )

            response_text = (completion.choices[0].message.content or "").strip()
            ai_tier = "openai"
    except Exception as e:
        logger.warning(f"Quick response AI call failed: {e}")

    # Fallback to local companion engine
    if not response_text:
        try:
            engine = get_companion_engine()
            engine_result = await engine.generate_response(
                user_message=body.query,
                conversation_history=[],
                user_name=user_name,
                turn_count=1,
                memories=memories,
                language=body.language,
            )
            response_text = engine_result.get("response", "")
            ai_tier = engine_result.get("ai_tier", "template")
        except Exception as e:
            logger.warning(f"Quick response engine fallback failed: {e}")

    # Final fallback - hardcoded warm response
    if not response_text:
        name_ref = user_name or "friend"
        response_text = (
            f"I'm here, {name_ref}. "
            "What would you like to talk about? "
            "I'm ready to listen."
        )
        ai_tier = "template"

    elapsed_ms = int((time.monotonic() - start_time) * 1000)
    logger.info(
        f"Quick voice response for user {current_user}: "
        f"ai_tier={ai_tier}, mood={mood}, latency={elapsed_ms}ms"
    )

    return VoiceCompanionQuickResponseResponse(
        response=response_text,
        mood=mood,
        ai_tier=ai_tier,
    )


@router.post("/session/end", response_model=VoiceCompanionEndResponse)
@limiter.limit("10/minute")
async def end_voice_companion_session(
    request: Request,
    body: VoiceCompanionEndRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """End a voice companion session with a warm voice farewell."""
    result = await db.execute(
        select(CompanionSession).where(
            CompanionSession.id == body.session_id,
            CompanionSession.user_id == current_user,
            CompanionSession.is_active.is_(True),
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already ended.")

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

    # Generate session summary via engine
    engine = None
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

        session_summary = await asyncio.wait_for(
            engine.summarize_session(
                conversation_history=conversation_history,
                initial_mood=session.initial_mood,
                final_mood=session.final_mood,
            ),
            timeout=10.0,
        )
        session.topics_discussed = session_summary
    except asyncio.TimeoutError:
        logger.warning("VoiceCompanion: Session summary timed out (10s)")
    except Exception as e:
        logger.warning(f"VoiceCompanion: Session summary failed: {e}")
    finally:
        if engine:
            engine.reset_verse_history()

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
        user_id=current_user,
        role="companion",
        content=farewell,
        phase="empower",
    )
    db.add(farewell_msg)

    # Record final wisdom outcome for Dynamic Wisdom Corpus learning
    if session.final_mood:
        try:
            from backend.services.dynamic_wisdom_corpus import get_dynamic_wisdom_corpus
            dynamic_corpus = get_dynamic_wisdom_corpus()
            await asyncio.wait_for(
                dynamic_corpus.record_wisdom_outcome(
                    db=db,
                    user_id=current_user,
                    session_id=session.id,
                    mood_after=session.final_mood,
                    user_response=None,
                    session_continued=False,
                ),
                timeout=5.0,
            )
        except asyncio.TimeoutError:
            logger.warning("VoiceCompanion: Final wisdom outcome recording timed out (5s)")
        except Exception as e:
            logger.debug(f"VoiceCompanion: Final wisdom outcome recording skipped: {e}")

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


# ─── Feedback ────────────────────────────────────────────────────────────


class VoiceCompanionFeedbackRequest(BaseModel):
    message_id: str = Field(..., min_length=1, max_length=128)
    rating: str = Field(..., pattern=r"^(positive|negative)$")
    session_id: str | None = Field(None, max_length=64)


class VoiceCompanionFeedbackResponse(BaseModel):
    success: bool


@router.post("/feedback", response_model=VoiceCompanionFeedbackResponse)
@limiter.limit("30/minute")
async def submit_voice_companion_feedback(
    request: Request,
    body: VoiceCompanionFeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Record user feedback (thumbs-up/down) on a KIAAN voice response."""
    # Update the message with the feedback rating
    result = await db.execute(
        select(CompanionMessage).where(
            CompanionMessage.id == body.message_id,
            CompanionMessage.user_id == current_user,
            CompanionMessage.deleted_at.is_(None),
        )
    )
    message = result.scalar_one_or_none()

    if message:
        # Store feedback as metadata on the message
        message.feedback_rating = body.rating
        await db.commit()
        logger.info(f"VoiceCompanion: Feedback '{body.rating}' recorded for message {body.message_id}")
    else:
        # Message may be from a local session — log the feedback anyway
        logger.info(
            f"VoiceCompanion: Feedback '{body.rating}' for message {body.message_id} "
            f"(message not found in DB, may be local session)"
        )

    return VoiceCompanionFeedbackResponse(success=True)


@router.post("/synthesize")
@limiter.limit("15/minute")
async def synthesize_voice_companion_audio(
    request: Request,
    body: VoiceCompanionSynthesizeRequest,
    current_user: str = Depends(get_current_user),
):
    """Synthesize speech for a Voice Companion message."""
    try:
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
                    "Cache-Control": "public, max-age=604800",
                },
            )

        return {
            "fallback_to_browser": True,
            "browser_config": result.get("browser_config", {}),
            "voice_persona": result.get("voice_persona", "sarvam-aura"),
        }
    except Exception as e:
        logger.warning(f"VoiceCompanion: Voice synthesis failed: {e}")
        return {"fallback_to_browser": True, "browser_config": {}}


@router.get("/health")
async def voice_companion_health():
    """Health check showing AI tier availability."""
    # Check openai_optimizer (TIER 1)
    tier1_ready = False
    try:
        from backend.services.openai_optimizer import openai_optimizer
        tier1_ready = openai_optimizer.ready and openai_optimizer.client is not None
    except Exception:
        logger.warning("Voice companion health check: tier1 openai_optimizer check failed", exc_info=True)

    # Check CompanionFriendEngine (TIER 2)
    tier2_ready = False
    try:
        from backend.services.companion_friend_engine import get_companion_engine
        engine = get_companion_engine()
        tier2_ready = engine._openai_available
    except Exception:
        logger.warning("Voice companion health check: tier2 engine check failed", exc_info=True)

    # Check wisdom corpus
    verse_count = 0
    try:
        from backend.services.sakha_wisdom_engine import get_sakha_wisdom_engine
        sakha = get_sakha_wisdom_engine()
        verse_count = sakha.get_verse_count()
    except Exception:
        logger.warning("Voice companion health check: wisdom corpus check failed", exc_info=True)

    voice_providers = ["browser_fallback"]
    if os.getenv("SARVAM_API_KEY", "").strip():
        voice_providers.insert(0, "sarvam_ai_bulbul")
    if os.getenv("ELEVENLABS_API_KEY", "").strip():
        voice_providers.insert(0, "elevenlabs")

    # Include circuit breaker status for TTS providers
    provider_health = {}
    try:
        from backend.services.companion_voice_service import get_provider_health_status
        provider_health = get_provider_health_status()
    except Exception:
        logger.debug("Voice companion health check: provider health unavailable")

    # Check Dynamic Wisdom Corpus cache status
    dynamic_wisdom_cache_entries = 0
    try:
        from backend.services.dynamic_wisdom_corpus import get_dynamic_wisdom_corpus
        dynamic_corpus = get_dynamic_wisdom_corpus()
        dynamic_wisdom_cache_entries = len(dynamic_corpus._effectiveness_cache)
    except Exception as e:
        logger.debug("Dynamic wisdom cache status unavailable: %s", e)

    return {
        "status": "healthy",
        "service": "kiaan-voice-companion",
        "persona": "divine-friend",
        "ai_tiers": {
            "tier1_openai_direct": tier1_ready,
            "tier2_engine_ai": tier2_ready,
            "tier3_templates": True,
        },
        "ai_enhanced": tier1_ready or tier2_ready,
        "voice_providers": voice_providers,
        "voice_provider_health": provider_health,
        "wisdom_corpus": {
            "sakha_verses": verse_count,
            "dynamic_corpus_cached_moods": dynamic_wisdom_cache_entries,
        },
        "voice_first": True,
    }


@router.get("/history")
@limiter.limit("20/minute")
async def get_voice_companion_history(
    request: Request,
    session_id: str | None = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Get voice companion conversation history."""
    if session_id:
        result = await db.execute(
            select(CompanionSession).where(
                CompanionSession.id == session_id,
                CompanionSession.user_id == current_user,
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

    result = await db.execute(
        select(CompanionSession)
        .where(CompanionSession.user_id == current_user)
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


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE 3: VOICE GUIDE - Always-Awake Ecosystem Navigation & Tool Input
# ═══════════════════════════════════════════════════════════════════════════════


class VoiceGuideCommandRequest(BaseModel):
    """Voice command request for the Voice Guide engine."""
    transcript: str = Field(..., min_length=1, max_length=3000, description="Voice transcript from STT")
    current_tool: str | None = Field(None, description="Tool the user is currently in")
    user_mood: str | None = Field(None, description="Currently detected mood")
    session_id: str | None = Field(None, description="Active session ID")
    conversation_history: list | None = Field(None, description="Recent conversation messages")

    @field_validator("transcript")
    @classmethod
    def sanitize_transcript(cls, v: str) -> str:
        return html.escape(v.strip())


class VoiceGuideCommandResponse(BaseModel):
    """Response from Voice Guide engine with action, route, and response."""
    engine: str
    action: str
    response: str
    target_tool: str | None = None
    route: str | None = None
    input_payload: dict | None = None
    mood: str | None = None
    mood_intensity: float = 0.5
    follow_up: str | None = None
    should_speak: bool = True
    confidence: float = 0.0
    context: dict | None = None


@router.post("/voice-guide/command", response_model=VoiceGuideCommandResponse)
@limiter.limit("60/minute")
async def voice_guide_command(
    request: Request,
    body: VoiceGuideCommandRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Voice Guide Engine - Process a voice command for ecosystem-wide actions.

    This is KIAAN's always-awake assistant endpoint. It can:
    - Navigate to any tool via voice ("take me to Ardha")
    - Input text into any tool ("tell journal I feel grateful today")
    - Control KIAAN ("stop", "pause", "repeat")
    - Look up Gita verses ("read chapter 2 verse 47")
    - Check mood ("how am I feeling?")
    - Fetch daily wisdom ("give me today's wisdom")
    - Route to Friend/Guidance engines for conversation

    Subscription: Shares KIAAN quota for LLM-powered responses.
    """
    from backend.services.kiaan_unified_voice_engine import get_unified_voice_engine

    try:
        engine = get_unified_voice_engine()
        result = await engine.process_unified(
            transcript=body.transcript,
            current_tool=body.current_tool,
            user_mood=body.user_mood,
            conversation_history=body.conversation_history,
            session_id=body.session_id,
        )

        return VoiceGuideCommandResponse(
            engine=result.engine.value,
            action=result.voice_guide_result.action.value if result.voice_guide_result else "query",
            response=result.response,
            target_tool=result.voice_guide_result.target_tool.value if result.voice_guide_result and result.voice_guide_result.target_tool else None,
            route=result.voice_guide_result.route if result.voice_guide_result else None,
            input_payload=result.voice_guide_result.input_payload if result.voice_guide_result else None,
            mood=result.mood,
            mood_intensity=result.mood_intensity,
            follow_up=result.follow_up,
            should_speak=result.should_speak,
            confidence=result.voice_guide_result.confidence if result.voice_guide_result else 0.5,
            context=result.voice_guide_result.context if result.voice_guide_result else None,
        )

    except Exception as e:
        logger.error("Voice Guide command error: %s", e, exc_info=True)
        return VoiceGuideCommandResponse(
            engine="voice_guide",
            action="query",
            response="I'm having a moment. Could you say that again?",
            confidence=0.0,
        )


@router.get("/voice-guide/tools")
async def voice_guide_available_tools():
    """
    List all ecosystem tools available for voice navigation and input.

    Returns the complete set of tools KIAAN can navigate to or inject
    input into via voice commands.
    """
    from backend.services.kiaan_unified_voice_engine import get_unified_voice_engine

    engine = get_unified_voice_engine()
    return {
        "tools": engine.get_available_tools(),
        "total": len(engine.get_available_tools()),
        "voice_commands": [
            {"command": "Take me to [tool]", "action": "Navigate to a tool"},
            {"command": "Tell [tool] that [message]", "action": "Input to a specific tool"},
            {"command": "Journal: [text]", "action": "Add to Sacred Reflections"},
            {"command": "Read verse [chapter].[verse]", "action": "Look up a Gita verse"},
            {"command": "How am I feeling?", "action": "Mood check"},
            {"command": "Give me today's wisdom", "action": "Daily wisdom"},
            {"command": "Stop / Pause / Resume", "action": "Voice control"},
        ],
    }


@router.get("/voice-guide/status")
async def voice_guide_engine_status():
    """
    Get the status of all three KIAAN engines.

    Returns health and availability of:
    - Guidance Engine (Gita wisdom)
    - Friend Engine (best friend personality)
    - Voice Guide Engine (ecosystem navigation)
    """
    from backend.services.kiaan_unified_voice_engine import get_unified_voice_engine

    engine = get_unified_voice_engine()
    return engine.get_engine_status()


class VoiceGuideInputRequest(BaseModel):
    """Request to inject voice input into a specific ecosystem tool."""
    target_tool: str = Field(..., description="Tool ID to send input to")
    content: str = Field(..., min_length=1, max_length=5000, description="Content to inject")
    source: str = Field(default="voice_guide", description="Input source identifier")

    @field_validator("content")
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        return html.escape(v.strip())


@router.post("/voice-guide/input")
@limiter.limit("30/minute")
async def voice_guide_input_to_tool(
    request: Request,
    body: VoiceGuideInputRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Inject voice input into a specific ecosystem tool.

    Allows KIAAN to add content to any tool (journal entries, chat messages,
    reframing inputs, etc.) via voice commands. The content is routed to the
    appropriate tool's backend handler.
    """
    from backend.services.kiaan_unified_voice_engine import (
        EcosystemTool,
        TOOL_ROUTES,
        TOOL_DESCRIPTIONS,
        get_unified_voice_engine,
    )

    # Validate target tool exists
    try:
        tool = EcosystemTool(body.target_tool)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown tool: {body.target_tool}. Use /voice-guide/tools for available tools.",
        )

    route = TOOL_ROUTES.get(tool, "/companion")
    desc = TOOL_DESCRIPTIONS.get(tool, body.target_tool)

    logger.info(
        "Voice Guide input: user=%s tool=%s content_length=%d",
        current_user,
        body.target_tool,
        len(body.content),
    )

    return {
        "success": True,
        "target_tool": body.target_tool,
        "route": route,
        "description": desc,
        "content": body.content,
        "source": body.source,
        "message": f"Input ready for {desc.split(' - ')[0]}. Navigate to the tool to complete the action.",
    }


# ─── Profile, Memory & Insight Endpoints ─────────────────────────────────
# Migrated from the legacy voice_companion.py so that ALL companion
# endpoints live under the unified /api/voice-companion/ prefix.


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


@router.get("/profile", response_model=CompanionProfileResponse)
@limiter.limit("20/minute")
async def get_companion_profile(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Get the user's companion profile and friendship stats."""
    profile = await _get_or_create_profile(db, current_user)
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
    current_user: str = Depends(get_current_user),
):
    """Update companion profile preferences."""
    profile = await _get_or_create_profile(db, current_user)

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
    current_user: str = Depends(get_current_user),
):
    """Get what KIAAN remembers about the user (for transparency)."""
    limit = max(1, min(limit, 100))
    result = await db.execute(
        select(CompanionMemory)
        .where(
            CompanionMemory.user_id == current_user,
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
    current_user: str = Depends(get_current_user),
):
    """Delete a specific memory (user controls what KIAAN remembers)."""
    result = await db.execute(
        select(CompanionMemory).where(
            CompanionMemory.id == memory_id,
            CompanionMemory.user_id == current_user,
        )
    )
    memory = result.scalar_one_or_none()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found.")

    memory.soft_delete()
    await db.commit()

    return {"status": "deleted", "message": "Memory removed. I'll forget that, friend."}


@router.get("/voices")
async def get_companion_voices():
    """Get available companion voice personas."""
    from backend.services.companion_voice_service import get_available_voices

    return {"voices": get_available_voices()}


@router.get("/insights/mood-trends")
@limiter.limit("20/minute")
async def get_mood_trends(
    request: Request,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Get mood trend data for the Self-Awareness Mirror.

    Returns mood frequencies, emotional arc over time, and pattern insights.
    """
    from collections import Counter

    from backend.services.companion_friend_engine import get_companion_engine

    days = max(1, min(days, 365))
    since = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=days)

    result = await db.execute(
        select(
            CompanionMessage.detected_mood,
            CompanionMessage.mood_intensity,
            CompanionMessage.created_at,
            CompanionMessage.session_id,
        )
        .where(
            CompanionMessage.user_id == current_user,
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

    engine = get_companion_engine()
    patterns = await engine.analyze_emotional_patterns(mood_history)

    daily_moods: dict[str, list[str]] = {}
    for entry in mood_history:
        if entry.get("timestamp"):
            day = entry["timestamp"][:10]
            daily_moods.setdefault(day, []).append(entry["mood"])

    timeline = []
    for day, moods in sorted(daily_moods.items()):
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
    current_user: str = Depends(get_current_user),
):
    """Get friendship milestones and achievements."""
    profile = await _get_or_create_profile(db, current_user)

    improved_count = await db.scalar(
        select(func.count(CompanionSession.id))
        .where(
            CompanionSession.user_id == current_user,
            CompanionSession.mood_improved.is_(True),
        )
    ) or 0

    days_result = await db.execute(
        select(func.date_trunc("day", CompanionSession.started_at))
        .where(CompanionSession.user_id == current_user)
        .distinct()
    )
    total_days = len(days_result.all())

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
        milestones.append({
            "threshold": threshold,
            "title": title,
            "description": description,
            "level": level,
            "achieved": profile.total_sessions >= threshold,
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


# ─── SSE Streaming Endpoint ──────────────────────────────────────────────────

@router.post("/stream")
async def stream_voice_response(
    request: Request,
    payload: dict,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream KIAAN response tokens via Server-Sent Events.

    Enables sentence-level TTS pipelining: the frontend receives text tokens
    as they're generated, and triggers TTS synthesis at sentence boundaries.
    This cuts perceived latency by ~40% compared to waiting for the full response.

    SSE event types:
    - token: Individual text token for live display
    - tts_chunk: Complete sentence ready for TTS synthesis
    - voice_emotion: Merged emotion state (text + prosody) for response adaptation
    - done: Stream complete
    - error: Error occurred during generation
    """
    import json as _json

    raw_text = payload.get("text", "")
    if not isinstance(raw_text, str):
        raise HTTPException(status_code=400, detail="Text must be a string")
    text = raw_text.strip()[:MAX_MESSAGE_LENGTH]
    voice_emotion = payload.get("voice_emotion")  # From frontend prosody analyzer
    language = payload.get("language", "en")

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    async def event_generator():
        try:
            # Emit voice emotion if provided (for frontend to adapt TTS prosody)
            if voice_emotion:
                yield f"data: {_json.dumps({'type': 'voice_emotion', 'emotion': voice_emotion})}\n\n"

            # Use the guidance streaming generator
            from backend.routes.guidance import _generate_response_streaming

            sentence_buffer = ""
            system_prompt = (
                "You are KIAAN, a warm and wise spiritual companion. "
                "Respond conversationally in 2-3 sentences. "
                "Be empathetic and grounding."
            )

            async for token in _generate_response_streaming(
                system_prompt=system_prompt,
                user_payload={"message": text, "language": language},
                temperature=0.5,
                max_tokens=300,
            ):
                if not token:
                    continue

                # Send token for live display
                yield f"data: {_json.dumps({'type': 'token', 'text': token})}\n\n"

                sentence_buffer += token

                # Detect sentence boundaries for TTS chunking
                stripped = sentence_buffer.rstrip()
                if stripped and stripped[-1] in '.!?।':
                    chunk_text = sentence_buffer.strip()
                    if chunk_text:
                        yield f"data: {_json.dumps({'type': 'tts_chunk', 'text': chunk_text})}\n\n"
                    sentence_buffer = ""

            # Flush any remaining text as a final TTS chunk
            remaining = sentence_buffer.strip()
            if remaining:
                yield f"data: {_json.dumps({'type': 'tts_chunk', 'text': remaining})}\n\n"

            yield f"data: {_json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"Streaming response failed: {e}", exc_info=True)
            yield f"data: {_json.dumps({'type': 'error', 'message': 'Response generation failed'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
