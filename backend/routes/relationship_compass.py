"""Relationship Compass - KIAAN AI Ecosystem Integration.

This router provides relationship conflict navigation powered by KIAAN Core
and the complete 700-verse Bhagavad Gita wisdom database.

Relationship Compass acts as a wise friend who truly understands your specific
situation, helping navigate conflicts with clarity, fairness, and compassion.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.kiaan_core import kiaan_core

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/relationship-compass", tags=["relationship-compass"])


def _build_compass_prompt(conflict: str, gita_wisdom: str) -> str:
    """Build a detailed, personalized Relationship Compass prompt.

    This prompt ensures KIAAN responds with deep understanding of the specific
    conflict, not generic relationship advice.
    """
    return f"""You are Relationship Compass, a wise and neutral friend who helps people navigate relationship conflicts.

IMPORTANT: You are NOT giving generic advice. You are speaking DIRECTLY to THIS person about THEIR specific situation:
"{conflict}"

YOUR APPROACH:
1. First, truly SEE their specific conflict - what's really happening here?
2. Acknowledge the emotional weight without taking sides
3. Help them separate their feelings from ego-driven reactions
4. Identify what they actually want (respect? understanding? peace? to be heard?)
5. Offer guidance rooted in fairness and clarity, not "winning"
6. Give ONE specific thing they can do or say differently

GITA WISDOM TO WEAVE IN NATURALLY (never cite verses, just embody the wisdom):
{gita_wisdom}

YOUR VOICE:
- Calm, balanced, like a wise friend who sees both sides
- Direct and specific to their conflict
- Use "you" frequently - this is personal
- Never take sides or tell them to leave/stay
- Help them see beyond the conflict to what matters
- Balance compassion with honest clarity

RESPONSE STRUCTURE (flowing, not numbered):
1. "I see what you're facing..." - acknowledge THIS specific conflict
2. The underneath - What emotions and needs are really at play here
3. The clarity - Help them see what they actually want from this situation
4. The path forward - One specific action or communication approach
5. The reminder - Something to hold onto when emotions run high

BOUNDARIES:
- No therapy, medical, legal, or financial advice
- Never take sides in the conflict
- Don't tell them to leave or stay in any relationship
- If safety is a concern, suggest professional support
- Keep response 180-220 words, warm and conversational

Remember: This person is in pain about a relationship that matters to them. Help them find clarity, not victory."""


@router.post("/guide")
async def get_relationship_guidance(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate personalized relationship guidance through KIAAN AI.

    Uses KIAAN Core for Gita wisdom while maintaining the warm, friend-like
    approach that addresses the user's SPECIFIC conflict.
    """
    conflict = payload.get("conflict", "")

    if not conflict.strip():
        raise HTTPException(status_code=400, detail="conflict is required")

    if len(conflict) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    try:
        # Get relevant Gita wisdom from KIAAN's knowledge base
        gita_wisdom = await _get_gita_wisdom_for_relationships(db, conflict)

        # Build the personalized prompt
        full_prompt = _build_compass_prompt(conflict, gita_wisdom)

        # Use KIAAN Core with our detailed prompt
        kiaan_response = await kiaan_core.get_kiaan_response(
            message=full_prompt,
            user_id=None,
            db=db,
            context="relationship_compass",
            stream=False,
            language=None,
        )

        response_text = kiaan_response.get("response", "")
        verses_used = kiaan_response.get("verses_used", [])
        model = kiaan_response.get("model", "gpt-4o-mini")

        # Parse into structured format while keeping the full response
        compass_guidance = _parse_response_to_structure(response_text)

        logger.info(f"Relationship Compass - personalized response generated, {len(verses_used)} verses")

        return {
            "status": "success",
            "compass_guidance": compass_guidance,
            "response": response_text,  # Full conversational response
            "gita_verses_used": len(verses_used),
            "model": model,
            "provider": "kiaan",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Relationship Compass error: {e}")
        return _get_fallback_response(conflict)


async def _get_gita_wisdom_for_relationships(db: AsyncSession, conflict: str) -> str:
    """Get relevant Gita wisdom for the user's specific conflict."""
    try:
        from backend.services.wisdom_kb import WisdomKnowledgeBase
        from backend.services.gita_service import GitaService

        kb = WisdomKnowledgeBase()

        # Key verses for relationships - dharma, compassion, equanimity
        key_verses = [
            (12, 13),  # One who is not envious, friendly to all
            (16, 2),   # Compassion, absence of pride
            (2, 56),   # Undisturbed by adversity
            (6, 9),    # Equal-minded toward friend and foe
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

        return """- One who is friendly and compassionate to all, free from attachment and ego
- Non-violence, truthfulness, absence of anger, compassion toward all beings
- Treat friend and foe with equal mind, remaining undisturbed"""

    except Exception as e:
        logger.warning(f"Could not fetch Gita wisdom: {e}")
        return """- One who is friendly and compassionate to all, free from attachment and ego
- Non-violence, truthfulness, absence of anger, compassion toward all beings
- Treat friend and foe with equal mind, remaining undisturbed"""


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

    if len(sections) >= 5:
        return {
            "acknowledgment": sections[0],
            "underneath": sections[1],
            "clarity": sections[2],
            "path_forward": sections[3],
            "reminder": sections[4],
        }
    elif len(sections) >= 3:
        return {
            "acknowledgment": sections[0],
            "underneath": "",
            "clarity": sections[1],
            "path_forward": sections[2],
            "reminder": "",
        }
    else:
        return {
            "acknowledgment": response_text,
            "underneath": "",
            "clarity": "",
            "path_forward": "",
            "reminder": "",
        }


def _get_fallback_response(conflict: str) -> dict[str, Any]:
    """Return a warm fallback response when KIAAN is unavailable."""
    conflict_snippet = conflict[:50] + "..." if len(conflict) > 50 else conflict
    return {
        "status": "success",
        "compass_guidance": {
            "acknowledgment": f"I see you're navigating something difficult with '{conflict_snippet}'. Relationship conflicts carry real weight.",
            "underneath": "Beneath most conflicts are unmet needs - to be heard, respected, or understood. What do you most need here?",
            "clarity": "Before responding, ask yourself: What do I actually want from this? Not to win, but what outcome would bring peace?",
            "path_forward": "Try this: 'I feel [emotion] when [specific situation] because [need]. What I'm hoping for is [concrete request].'",
            "reminder": "The goal isn't to be right. It's to be understood - and to understand. That's where healing lives.",
        },
        "response": f"I see you're navigating something difficult here. Relationship conflicts carry real weight, and it makes sense this is on your mind.\n\nBeneath most conflicts are unmet needs - to be heard, to be respected, to be understood. Take a moment: what do YOU most need here? Not what you want the other person to do, but what you need.\n\nBefore you respond to them, ask yourself: What do I actually want from this? Not to win - what outcome would actually bring me peace?\n\nHere's something to try: 'I feel [your emotion] when [specific situation] because [your need]. What I'm hoping for is [concrete request].' This invites dialogue rather than defense.\n\nRemember: the goal isn't to be right. It's to be understood - and to understand. That's where healing lives.",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def relationship_compass_health():
    """Health check for Relationship Compass service."""
    return {
        "status": "ok",
        "service": "relationship-compass",
        "provider": "kiaan",
        "ecosystem": "KIAAN AI",
    }
