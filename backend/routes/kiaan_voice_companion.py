"""KIAAN Voice Companion API Routes - Divine Friend with Voice Output

Endpoints for the KIAAN Voice Companion experience: a continuous
voice-first conversation where KIAAN acts as the user's Divine Friend.
Every response is automatically synthesized to voice output.

CRITICAL: This route calls OpenAI DIRECTLY via openai_optimizer (the same
client that powers Viyoga and Ardha), bypassing CompanionFriendEngine's
internal _openai_available flag which can be stale.

Combines the warmth of the Companion (best friend), the wisdom of
Viyoga Ardha (reframing), and the depth of Relationship Compass (guidance)
into a single, voice-centered Divine Friend conversation.

All existing ecosystem routes/services remain untouched.
"""

import asyncio
import datetime
import html
import logging
import os
import random
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
from backend.middleware.feature_access import is_developer
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
from backend.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/voice-companion",
    tags=["kiaan-voice-companion"],
)

MAX_MESSAGE_LENGTH = 2000


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
    if wisdom_text:
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
        lang_instruction = f"\nLANGUAGE: Respond in {language}. Keep the same warmth and conversational tone."

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
- 60-150 words max. Friends don't give lectures.

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
    ai_tier: str = "template"


class VoiceCompanionMessageRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    language: str = Field(default="en", max_length=8)
    content_type: str = Field(default="text", pattern=r"^(text|voice)$")
    voice_id: str = Field(default="priya", max_length=32)
    prefer_speed: bool = Field(
        default=False,
        description="When True, skip generic-response retry to reduce latency by ~1-2s",
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
) -> str | None:
    """Call OpenAI directly using an async client for non-blocking voice responses.

    Uses AsyncOpenAI to avoid blocking the event loop, which is critical
    for voice companion latency. Falls back to running the sync client
    in a thread pool if AsyncOpenAI is unavailable.

    Args:
        prefer_speed: When True, skip the generic-response retry to save ~1-2s.

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
                max_tokens=200,
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
                max_tokens=200,
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
    current_user: User = Depends(get_current_user),
):
    """Start a new Voice Companion session with KIAAN as Divine Friend.

    Subscription enforcement: Premium+ feature only.
    """
    # Voice Companion requires Premium+ subscription
    try:
        await get_or_create_free_subscription(db, current_user.id)
        if not await is_developer(db, current_user.id):
            has_access = await check_feature_access(db, current_user.id, "kiaan_voice_companion")
            if not has_access:
                tier = await get_user_tier(db, current_user.id)
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

    session = CompanionSession(
        user_id=current_user.id,
        language=body.language,
    )
    db.add(session)

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
        ai_tier="template",
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

    PRIORITY ORDER:
    1. Direct OpenAI call via openai_optimizer (same client as Viyoga/Ardha)
    2. CompanionFriendEngine with AI (AsyncOpenAI)
    3. CompanionFriendEngine local templates (last resort)

    Subscription enforcement: Premium+ feature, shares KIAAN quota.
    """
    # Enforce KIAAN quota for voice companion messages (makes AI calls)
    try:
        if not await is_developer(db, current_user.id):
            # Check feature access (Premium+ only)
            has_access = await check_feature_access(db, current_user.id, "kiaan_voice_companion")
            if not has_access:
                tier = await get_user_tier(db, current_user.id)
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
            has_quota, usage_count, usage_limit = await check_kiaan_quota(db, current_user.id)
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

    # Get conversation history + user context in parallel
    # Running these concurrently saves ~50-150ms vs sequential execution
    history_result, profile, memories, session_summaries = await asyncio.gather(
        db.execute(
            select(CompanionMessage)
            .where(
                CompanionMessage.session_id == session.id,
                CompanionMessage.deleted_at.is_(None),
            )
            .order_by(CompanionMessage.created_at)
            .limit(20)
        ),
        _get_or_create_profile(db, current_user.id),
        _get_user_memories(db, current_user.id),
        _get_recent_session_summaries(db, current_user.id),
    )
    history_messages = history_result.scalars().all()
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_messages
    ]

    user_turn_count = sum(1 for m in history_messages if m.role == "user") + 1

    # Detect mood
    mood, mood_intensity = detect_mood(body.message)

    # Save user message
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

    # ── Wisdom lookup ──
    wisdom_text = None
    wisdom_verse_ref = None
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
            wisdom_text = top.get("sanitized_text") or v.get("english", "")
            wisdom_verse_ref = v.get("verse_id", "")
            logger.info(
                f"VoiceCompanion: Wisdom verse {wisdom_verse_ref} "
                f"(score={top['score']:.2f}) for mood={mood}"
            )
    except Exception as e:
        logger.debug(f"VoiceCompanion: Wisdom lookup skipped: {e}")

    # If no DB wisdom, try Sakha engine
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
        except Exception:
            pass

    # ══════════════════════════════════════════════════════════════════════
    # TIER 1: Direct OpenAI call via openai_optimizer
    # This is the same client that powers Viyoga, Ardha, Karma Reset.
    # ══════════════════════════════════════════════════════════════════════
    response_text = None
    ai_tier = "template"
    wisdom_used = None

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
    )

    response_text = await _call_openai_direct(
        system_prompt=system_prompt,
        conversation_history=conversation_history,
        user_message=body.message,
        prefer_speed=body.prefer_speed,
    )

    if response_text:
        ai_tier = "openai_direct"
        if wisdom_text and wisdom_verse_ref:
            wisdom_used = {"principle": wisdom_text[:100], "verse_ref": wisdom_verse_ref}
        logger.info(f"VoiceCompanion: TIER 1 (openai_direct) succeeded for user {current_user.id}")

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
        user_id=current_user.id,
        role="companion",
        content=response_text,
        detected_mood=mood,
        mood_intensity=mood_intensity,
        wisdom_used=wisdom_used,
        _verse_ref=(wisdom_used or {}).get("verse_ref"),
        phase=phase,
    )
    db.add(companion_msg)

    # Update session
    session.message_count += 2
    session.user_message_count += 1
    session.phase = phase
    session.last_message_at = datetime.datetime.now(datetime.UTC)
    session.final_mood = mood

    # Update profile
    profile.total_messages += 2

    # Extract memories using fast local extraction (non-blocking)
    # AI-based memory extraction is deferred to avoid adding latency
    memory_entries = extract_memories_from_message(body.message, mood)
    if memory_entries:
        await _save_memories(db, current_user.id, session.id, memory_entries)

    moods = profile.common_moods or {}
    moods[mood] = moods.get(mood, 0) + 1
    profile.common_moods = moods

    # Increment KIAAN usage after successful AI response
    try:
        await increment_kiaan_usage(db, current_user.id)
    except Exception as usage_err:
        logger.warning(f"Failed to increment KIAAN usage for voice-companion: {usage_err}")

    await db.commit()

    # Schedule AI-powered memory extraction in background (does not block response)
    async def _extract_memories_background():
        try:
            engine = get_companion_engine()
            ai_memories = await engine.extract_memories_with_ai(
                user_message=body.message,
                companion_response=response_text,
                mood=mood,
            )
            if ai_memories:
                await _save_memories(db, current_user.id, session.id, ai_memories)
                await db.commit()
        except Exception as e:
            logger.debug(f"VoiceCompanion: Background memory extraction skipped: {e}")

    asyncio.create_task(_extract_memories_background())

    logger.info(
        f"VoiceCompanion response: user={current_user.id}, "
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

        session_summary = await engine.summarize_session(
            conversation_history=conversation_history,
            initial_mood=session.initial_mood,
            final_mood=session.final_mood,
        )
        session.topics_discussed = session_summary
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
            "voice_persona": result.get("voice_persona", "priya"),
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
        pass

    # Check CompanionFriendEngine (TIER 2)
    tier2_ready = False
    try:
        from backend.services.companion_friend_engine import get_companion_engine
        engine = get_companion_engine()
        tier2_ready = engine._openai_available
    except Exception:
        pass

    # Check wisdom corpus
    verse_count = 0
    try:
        from backend.services.sakha_wisdom_engine import get_sakha_wisdom_engine
        sakha = get_sakha_wisdom_engine()
        verse_count = sakha.get_verse_count()
    except Exception:
        pass

    voice_providers = ["edge_tts", "browser_fallback"]
    if os.getenv("ELEVENLABS_API_KEY", "").strip():
        voice_providers.insert(0, "elevenlabs")
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS", ""):
        voice_providers.insert(0, "google_neural2")

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
    """Get voice companion conversation history."""
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
