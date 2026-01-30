"""Ardha Reframing Engine - KIAAN AI Ecosystem Integration.

This router provides cognitive reframing assistance powered by KIAAN Core
and the complete 700-verse Bhagavad Gita wisdom database.

Ardha acts as a wise friend who truly understands your specific thought,
helping transform negative thinking into balanced, empowering perspectives.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.kiaan_core import kiaan_core

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ardha", tags=["ardha"])


def _build_ardha_prompt(negative_thought: str, gita_wisdom: str) -> str:
    """Build a detailed, personalized Ardha prompt that feels like a wise friend.

    This prompt ensures KIAAN responds with deep understanding of the specific
    thought pattern, not generic reframing advice.
    """
    return f"""You are Ardha, a wise and compassionate friend who helps people transform negative thoughts.

IMPORTANT: You are NOT giving generic advice. You are speaking DIRECTLY to THIS person about THEIR specific thought:
"{negative_thought}"

YOUR APPROACH:
1. First, truly SEE their specific thought - what distortion or pain is underneath?
2. Validate the feeling without dismissing it - this thought exists for a reason
3. Gently illuminate what cognitive pattern might be at play
4. Offer a reframe that speaks to THEIR exact situation (not a platitude)
5. Give ONE specific thing they can do or remember right now

GITA WISDOM TO WEAVE IN NATURALLY (never cite verses, just embody the wisdom):
{gita_wisdom}

YOUR VOICE:
- Warm, calm, like a wise friend sitting beside them
- Direct and specific to their thought
- Use "you" frequently - this is personal
- Spot the distortion but don't lecture about it
- Validate first, then shift perspective
- Balance compassion with gentle clarity

RESPONSE STRUCTURE (flowing, not numbered):
1. Recognition - "I hear what you're carrying..." - validate THIS specific feeling
2. The insight - What's really happening in this thought pattern
3. The reframe - A balanced perspective for THEIR specific situation
4. The anchor - ONE thing they can hold onto or do right now

BOUNDARIES:
- No therapy, medical, legal, or financial advice
- No toxic positivity or dismissing their pain
- No "just think positive" - offer genuine perspective shifts
- Keep response 150-200 words, warm and conversational

Remember: This person shared a vulnerable thought. Honor that. Speak to THEM, not to a textbook case."""


@router.post("/reframe")
async def reframe_thought(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate personalized cognitive reframing through KIAAN AI.

    Uses KIAAN Core for Gita wisdom while maintaining the warm, friend-like
    approach that addresses the user's SPECIFIC negative thought.
    """
    negative_thought = payload.get("negative_thought", "")

    if not negative_thought.strip():
        raise HTTPException(status_code=400, detail="negative_thought is required")

    if len(negative_thought) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    try:
        # Get relevant Gita wisdom from KIAAN's knowledge base
        gita_wisdom = await _get_gita_wisdom_for_reframing(db, negative_thought)

        # Build the personalized prompt
        full_prompt = _build_ardha_prompt(negative_thought, gita_wisdom)

        # Use KIAAN Core with our detailed prompt
        kiaan_response = await kiaan_core.get_kiaan_response(
            message=full_prompt,
            user_id=None,
            db=db,
            context="ardha_reframe",
            stream=False,
            language=None,
        )

        response_text = kiaan_response.get("response", "")
        verses_used = kiaan_response.get("verses_used", [])
        model = kiaan_response.get("model", "gpt-4o-mini")

        # Parse into structured format while keeping the full response
        reframe_guidance = _parse_response_to_structure(response_text)

        logger.info(f"Ardha - personalized response generated, {len(verses_used)} verses")

        return {
            "status": "success",
            "reframe_guidance": reframe_guidance,
            "raw_text": response_text,  # Full conversational response
            "gita_verses_used": len(verses_used),
            "model": model,
            "provider": "kiaan",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Ardha error: {e}")
        return _get_fallback_response(negative_thought)


async def _get_gita_wisdom_for_reframing(db: AsyncSession, thought: str) -> str:
    """Get relevant Gita wisdom for the user's specific thought."""
    try:
        from backend.services.wisdom_kb import WisdomKnowledgeBase
        from backend.services.gita_service import GitaService

        kb = WisdomKnowledgeBase()

        # Key sthitaprajna (steady wisdom) verses
        key_verses = [
            (2, 56),   # Unaffected by adversity
            (2, 57),   # Without attachment, balanced
            (6, 5),    # Elevate yourself by your own mind
            (2, 14),   # Endure the dualities
        ]

        wisdom_parts = []
        for chapter, verse_num in key_verses[:3]:
            try:
                verse = await GitaService.get_verse_by_reference(db, chapter=chapter, verse=verse_num)
                if verse and verse.english:
                    wisdom_parts.append(f"- {kb.sanitize_text(verse.english)}")
            except Exception:
                pass

        if wisdom_parts:
            return "\n".join(wisdom_parts)

        return """- One whose mind remains undisturbed by adversity, who does not crave pleasure, free from attachment and fear
- The mind can be the soul's friend or its enemy; elevate yourself through your own effort
- Sensations of heat and cold, pleasure and pain, come and go; learn to endure them"""

    except Exception as e:
        logger.warning(f"Could not fetch Gita wisdom: {e}")
        return """- One whose mind remains undisturbed by adversity, who does not crave pleasure, free from attachment and fear
- The mind can be the soul's friend or its enemy; elevate yourself through your own effort
- Sensations of heat and cold, pleasure and pain, come and go; learn to endure them"""


def _parse_response_to_structure(response_text: str) -> dict[str, str]:
    """Parse KIAAN's conversational response into structured format."""
    lines = response_text.strip().split('\n')
    sections = []
    current = []

    for line in lines:
        if line.strip():
            current.append(line.strip())
        elif current:
            sections.append(' '.join(current))
            current = []
    if current:
        sections.append(' '.join(current))

    # Clean emoji
    if sections:
        sections[-1] = sections[-1].replace('💙', '').strip()

    if len(sections) >= 4:
        return {
            "recognition": sections[0],
            "deep_insight": sections[1],
            "reframe": sections[2],
            "small_action_step": sections[3],
        }
    elif len(sections) >= 2:
        return {
            "recognition": sections[0],
            "deep_insight": "",
            "reframe": sections[1] if len(sections) > 1 else "",
            "small_action_step": sections[-1] if len(sections) > 2 else "",
        }
    else:
        return {
            "recognition": response_text,
            "deep_insight": "",
            "reframe": "",
            "small_action_step": "",
        }


def _get_fallback_response(negative_thought: str) -> dict[str, Any]:
    """Return a warm fallback response when KIAAN is unavailable."""
    thought_snippet = negative_thought[:50] + "..." if len(negative_thought) > 50 else negative_thought
    return {
        "status": "success",
        "reframe_guidance": {
            "recognition": f"I hear you - this thought '{thought_snippet}' is weighing on you. That's real, and it makes sense you'd feel this way.",
            "deep_insight": "Notice that your mind is treating a thought as absolute truth. But thoughts, even painful ones, are not facts - they're interpretations shaped by how you feel right now.",
            "reframe": "What if this situation, as difficult as it is, contains something you haven't seen yet? Not toxic positivity - just the recognition that your current lens isn't the only one.",
            "small_action_step": "Right now, take one breath. Then ask yourself: 'What would I tell a friend who shared this same thought with me?'",
        },
        "raw_text": f"I hear you - this thought is weighing on you, and that makes complete sense. When we're struggling, our minds can be relentless.\n\nHere's what I notice: your mind is treating this thought as absolute truth. But thoughts, even the painful ones, aren't facts - they're interpretations shaped by how you're feeling right now.\n\nWhat if this situation, difficult as it is, contains something you haven't seen yet? I'm not asking you to 'think positive' - just to notice that your current lens isn't the only one available.\n\nHere's something to try: take one breath. Then ask yourself, 'What would I tell a friend who shared this same thought with me?' Often, we have wisdom for others that we forget to offer ourselves.",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def ardha_health():
    """Health check for Ardha service."""
    return {
        "status": "ok",
        "service": "ardha-reframe",
        "provider": "kiaan",
        "ecosystem": "KIAAN AI",
    }
