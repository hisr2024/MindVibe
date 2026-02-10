"""
KIAAN Friend Mode API Routes

Dual-mode endpoints for KIAAN as both Best Friend and Gita Guide.
Auto-detects whether user needs friendship or guidance and adapts.

Endpoints:
    POST /kiaan/friend/chat       - Dual-mode chat (auto-detects friend vs guide)
    GET  /kiaan/friend/daily-wisdom - Personalized daily wisdom
    POST /kiaan/friend/mood-check  - Quick mood check-in
    GET  /kiaan/friend/gita-guide/{chapter} - Modern secular interpretation
    POST /kiaan/friend/verse-insight - Deep verse insight with modern lens
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_flexible, get_db
from backend.middleware.rate_limiter import limiter
from backend.middleware.feature_access import (
    get_current_user_id,
    is_developer,
)
from backend.services.subscription_service import (
    check_kiaan_quota,
    get_or_create_free_subscription,
    increment_kiaan_usage,
)
from backend.services.kiaan_friendship_engine import (
    get_friendship_engine,
    InteractionMode,
    FriendMood,
    MODERN_CHAPTER_INSIGHTS,
)

router = APIRouter(prefix="/kiaan/friend", tags=["kiaan-friend"])
logger = logging.getLogger(__name__)


# ===== Request/Response Models =====

class FriendChatRequest(BaseModel):
    """Chat request with auto mode detection."""
    message: str = Field(..., min_length=1, max_length=3000)
    session_id: Optional[str] = None
    language: str = Field(default="en")
    force_mode: Optional[str] = Field(
        None,
        description="Force a mode: 'friend' or 'guide'. Default: auto-detect.",
    )
    user_name: Optional[str] = None
    friendship_level: str = Field(default="new")
    conversation_history: Optional[list] = Field(default=None)


class FriendChatResponse(BaseModel):
    """Response with mode-aware content."""
    response: str
    mode: str
    mood: str
    mood_intensity: float
    conversation_type: str
    follow_up: Optional[str] = None
    gita_insight: Optional[dict] = None
    daily_practice: Optional[str] = None
    suggested_chapter: Optional[int] = None


class MoodCheckRequest(BaseModel):
    """Quick mood check-in."""
    response: Optional[str] = Field(None, description="User's response to mood question")


class VerseInsightRequest(BaseModel):
    """Request for modern verse interpretation."""
    chapter: int = Field(..., ge=1, le=18)
    verse: int = Field(..., ge=1, le=78)
    user_context: Optional[str] = Field(
        None,
        description="What the user is going through, for personalized interpretation",
    )


# ===== Endpoints =====

@router.post("/chat", response_model=FriendChatResponse)
@limiter.limit("30/minute")
async def friend_chat(
    request: Request,
    body: FriendChatRequest,
    current_user=Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db),
):
    """
    Dual-mode chat endpoint. Auto-detects friend vs guide mode.

    When the user is just chatting casually, KIAAN is a best friend.
    When the user needs guidance, KIAAN becomes a modern Gita interpreter.
    Transition between modes is natural and contextual.

    Subscription enforcement: All tiers have access (shares KIAAN quota).
    """
    # Subscription quota enforcement - friend chat counts against KIAAN questions
    auth_user_id: Optional[str] = None
    try:
        auth_user_id = await get_current_user_id(request)
        await get_or_create_free_subscription(db, auth_user_id)

        if not await is_developer(db, auth_user_id):
            has_quota, usage_count, usage_limit = await check_kiaan_quota(db, auth_user_id)
            if not has_quota:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "quota_exceeded",
                        "message": "You've reached your monthly KIAAN conversations limit. "
                                   "Upgrade your plan to keep chatting with your friend. 💙",
                        "usage_count": usage_count,
                        "usage_limit": usage_limit,
                        "upgrade_url": "/pricing",
                    },
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Subscription check failed for friend-chat, allowing request: {e}")

    engine = get_friendship_engine()

    # Force mode if specified
    if body.force_mode == "friend":
        from backend.services.kiaan_friendship_engine import (
            ConversationType,
            ModeDetection,
        )
        detection = ModeDetection(
            mode=InteractionMode.BEST_FRIEND,
            conversation_type=ConversationType.CASUAL_CHAT,
            mood=FriendMood.NEUTRAL,
            mood_intensity=0.5,
            confidence=1.0,
            guidance_needed=False,
            gita_relevant=False,
        )
    elif body.force_mode == "guide":
        from backend.services.kiaan_friendship_engine import (
            ConversationType,
            ModeDetection,
        )
        detection = ModeDetection(
            mode=InteractionMode.GITA_GUIDE,
            conversation_type=ConversationType.SEEKING_WISDOM,
            mood=FriendMood.SEEKING,
            mood_intensity=0.5,
            confidence=1.0,
            guidance_needed=True,
            gita_relevant=True,
        )
    else:
        detection = engine.detect_mode(body.message, body.conversation_history)

    # Build the system prompt
    system_prompt = engine.build_prompt(
        mode=detection.mode,
        mood=detection.mood,
        conversation_type=detection.conversation_type,
        user_message=body.message,
        history=body.conversation_history,
        user_name=body.user_name,
        friendship_level=body.friendship_level,
    )

    # Get Gita insight if in guide/transition mode
    gita_insight = None
    daily_practice = None
    if detection.gita_relevant and detection.suggested_chapter:
        chapter_guide = engine.get_chapter_guide(detection.suggested_chapter)
        if chapter_guide:
            gita_insight = chapter_guide
            daily_practice = chapter_guide.get("daily_practice")

    # Generate response via existing companion infrastructure
    # The system prompt guides the LLM to respond in the right mode
    try:
        from backend.services.kiaan_model_provider import get_kiaan_provider
        provider = get_kiaan_provider()
        messages = [
            {"role": "system", "content": system_prompt},
        ]
        if body.conversation_history:
            for msg in body.conversation_history[-8:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                })
        messages.append({"role": "user", "content": body.message})

        ai_response = await provider.chat(messages)
        response_text = ai_response if isinstance(ai_response, str) else str(ai_response)
    except Exception as e:
        logger.warning("LLM provider unavailable, using friendship engine fallback: %s", e)
        # Fallback: use mood-appropriate response
        mood_response = engine.get_mood_response(detection.mood)
        if detection.gita_relevant and gita_insight:
            response_text = (
                f"{mood_response}\n\n"
                f"You know what this reminds me of? {gita_insight.get('modern_title', '')} - "
                f"{gita_insight.get('modern_lesson', '')}\n\n"
                f"Try this today: {daily_practice or 'Take a moment to breathe and be present.'}"
            )
        else:
            response_text = mood_response

    # Increment KIAAN usage after successful AI response
    if auth_user_id:
        try:
            await increment_kiaan_usage(db, auth_user_id)
        except Exception as usage_err:
            logger.warning(f"Failed to increment KIAAN usage for friend-chat: {usage_err}")

    # Generate a natural follow-up
    follow_up = _generate_follow_up(detection)

    return FriendChatResponse(
        response=response_text,
        mode=detection.mode.value,
        mood=detection.mood.value,
        mood_intensity=detection.mood_intensity,
        conversation_type=detection.conversation_type.value,
        follow_up=follow_up,
        gita_insight=gita_insight,
        daily_practice=daily_practice,
        suggested_chapter=detection.suggested_chapter,
    )


@router.get("/daily-wisdom")
async def get_daily_wisdom(
    mood: Optional[str] = None,
):
    """
    Get personalized daily wisdom.

    Returns a modern, secular interpretation of a Gita verse
    relevant to the current day, with psychology backing and
    a practical daily practice.
    """
    engine = get_friendship_engine()
    day_of_year = datetime.now().timetuple().tm_yday
    wisdom = engine.get_daily_wisdom(day_of_year, mood)
    return {"wisdom": wisdom}


@router.post("/mood-check")
@limiter.limit("20/minute")
async def mood_check(
    request: Request,
    body: Optional[MoodCheckRequest] = None,
    current_user=Depends(get_current_user_flexible),
):
    """
    Quick mood check-in.

    If no response provided, returns a mood question.
    If response provided, analyzes mood and gives empathetic response.
    """
    engine = get_friendship_engine()

    if body is None or body.response is None:
        checkin = engine.get_mood_checkin()
        return {"type": "question", **checkin}

    detection = engine.detect_mode(body.response)
    mood_response = engine.get_mood_response(detection.mood)

    # If mood is heavy, suggest relevant wisdom
    wisdom_suggestion = None
    if detection.mood in (FriendMood.SAD, FriendMood.ANXIOUS, FriendMood.ANGRY, FriendMood.LONELY):
        day = datetime.now().timetuple().tm_yday
        wisdom_suggestion = engine.get_daily_wisdom(day, detection.mood.value)

    return {
        "type": "response",
        "mood": detection.mood.value,
        "mood_intensity": detection.mood_intensity,
        "response": mood_response,
        "wisdom_suggestion": wisdom_suggestion,
        "follow_up_options": [
            "Tell me more about how you're feeling",
            "Show me wisdom for this mood",
            "Let's just chat about something else",
        ],
    }


@router.get("/gita-guide/{chapter}")
async def get_gita_modern_guide(chapter: int):
    """
    Get a modern, secular interpretation of a Gita chapter.

    No religious jargon. Pure psychology, behavioral science,
    and practical daily application.
    """
    if chapter < 1 or chapter > 18:
        raise HTTPException(status_code=404, detail="Chapters are 1-18")

    engine = get_friendship_engine()
    guide = engine.get_chapter_guide(chapter)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Chapter {chapter} guide not found")

    return {"chapter_guide": guide}


@router.get("/gita-guide")
async def get_all_chapter_guides():
    """
    Get modern guides for all 18 chapters.

    A complete modern, secular overview of the entire Bhagavad Gita
    through the lens of psychology and behavioral science.
    """
    guides = []
    for ch_num in range(1, 19):
        insight = MODERN_CHAPTER_INSIGHTS.get(ch_num)
        if insight:
            guides.append({
                "chapter": ch_num,
                "modern_title": insight["modern_title"],
                "secular_theme": insight["secular_theme"],
                "applies_to": insight["applies_to"],
            })
    return {"chapters": guides, "total": len(guides)}


@router.post("/verse-insight")
@limiter.limit("20/minute")
async def get_verse_insight(
    request: Request,
    body: VerseInsightRequest,
    current_user=Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a deep, modern insight for a specific verse.

    Connects the verse to contemporary psychology, behavioral science,
    and the user's specific life situation if provided.

    Subscription enforcement: Shares KIAAN quota when LLM enrichment is used.
    """
    # Check KIAAN quota if personalized context is requested (triggers LLM call)
    verse_user_id: Optional[str] = None
    if body.user_context:
        try:
            verse_user_id = await get_current_user_id(request)
            await get_or_create_free_subscription(db, verse_user_id)

            if not await is_developer(db, verse_user_id):
                has_quota, usage_count, usage_limit = await check_kiaan_quota(db, verse_user_id)
                if not has_quota:
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "error": "quota_exceeded",
                            "message": "You've reached your monthly KIAAN conversations limit. "
                                       "Upgrade for more personalized verse insights. 💙",
                            "usage_count": usage_count,
                            "usage_limit": usage_limit,
                            "upgrade_url": "/pricing",
                        },
                    )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Subscription check failed for verse-insight: {e}")

    engine = get_friendship_engine()
    insight = engine.get_verse_insight(body.chapter, body.verse, body.user_context)

    # Try to enrich with LLM if available
    enriched_insight = None
    if body.user_context:
        try:
            from backend.services.kiaan_model_provider import get_kiaan_provider
            provider = get_kiaan_provider()
            messages = [
                {"role": "system", "content": (
                    "You are a modern wisdom interpreter. "
                    "Interpret Bhagavad Gita verses through secular psychology and behavioral science. "
                    "No religious jargon. Be practical, warm, and specific to the user's situation. "
                    "Keep it under 200 words."
                )},
                {"role": "user", "content": insight["prompt_for_llm"]},
            ]
            result = await provider.chat(messages)
            enriched_insight = result if isinstance(result, str) else str(result)

            # Increment usage after successful LLM call
            if verse_user_id:
                try:
                    await increment_kiaan_usage(db, verse_user_id)
                except Exception as usage_err:
                    logger.warning(f"Failed to increment KIAAN usage for verse-insight: {usage_err}")
        except Exception as e:
            logger.debug("LLM enrichment unavailable: %s", e)

    response = {
        "verse_id": insight["verse_id"],
        "chapter": insight["chapter"],
        "verse": insight["verse"],
        "chapter_theme": insight["chapter_theme"],
        "secular_theme": insight["secular_theme"],
        "psychology": insight["psychology"],
        "modern_lesson": insight["modern_lesson"],
        "daily_practice": insight["daily_practice"],
    }
    if enriched_insight:
        response["personalized_insight"] = enriched_insight

    return {"insight": response}


# ===== Helpers =====

def _generate_follow_up(detection) -> Optional[str]:
    """Generate a natural follow-up based on the conversation context."""
    from backend.services.kiaan_friendship_engine import ConversationType

    follow_ups = {
        ConversationType.CASUAL_CHAT: "What else is on your mind?",
        ConversationType.DAILY_UPDATE: "Anything else happen today worth talking about?",
        ConversationType.VENTING: "Do you want to talk more about it, or would you rather shift gears?",
        ConversationType.SEEKING_ADVICE: "Does that perspective help, or should we look at it from a different angle?",
        ConversationType.SEEKING_WISDOM: "Want to explore this wisdom deeper, or does that give you enough to sit with?",
        ConversationType.EXPLORING_GITA: "Want to hear more about this chapter, or explore a different one?",
        ConversationType.MOOD_CHECKIN: "Thanks for sharing. Is there anything specific you'd like to talk about?",
        ConversationType.CELEBRATION: "I love that! What else is going well?",
        ConversationType.CRISIS: "I'm right here with you. Take your time.",
        ConversationType.PHILOSOPHICAL: "That's a deep question. What do you think?",
        ConversationType.JUST_COMPANY: None,
    }
    return follow_ups.get(detection.conversation_type)
