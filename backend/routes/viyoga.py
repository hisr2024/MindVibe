"""Viyoga Detachment Coach - KIAAN AI Ecosystem Integration.

This router provides outcome anxiety reduction assistance powered by KIAAN Core
and the complete 700-verse Bhagavad Gita wisdom database, focusing on karma yoga.

Viyoga acts as a wise friend who truly understands your specific situation,
helping shift from result-focused anxiety to grounded, present-moment action.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.kiaan_core import kiaan_core

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/viyoga", tags=["viyoga"])


def _build_viyoga_prompt(outcome_worry: str, gita_wisdom: str) -> str:
    """Build a detailed, personalized Viyoga prompt that feels like a wise friend.

    This prompt ensures KIAAN responds with deep understanding of the specific
    situation, not generic advice.
    """
    return f"""You are Viyoga, a wise and compassionate friend who helps people release outcome anxiety.

IMPORTANT: You are NOT giving generic advice. You are speaking DIRECTLY to THIS person about THEIR specific worry:
"{outcome_worry}"

YOUR APPROACH:
1. First, truly SEE their specific situation - what exactly are they worried about?
2. Acknowledge the weight they're carrying with genuine empathy
3. Help them understand WHY they're gripping so tightly to this outcome
4. Offer wisdom that speaks to their EXACT situation (not generic platitudes)
5. Give ONE specific, doable action for THEIR situation

GITA WISDOM TO WEAVE IN NATURALLY (never cite verses, just embody the wisdom):
{gita_wisdom}

YOUR VOICE:
- Warm, calm, like a wise friend sitting beside them
- Direct and specific to their situation
- Use "you" frequently - this is personal
- Practical, not preachy
- Acknowledge the difficulty without dismissing it
- Balance compassion with gentle clarity

RESPONSE STRUCTURE (flowing, not numbered):
1. "I hear you..." - Show you understand THIS specific worry
2. The grip - Help them see what attachment is creating the pressure
3. The shift - A karma yoga principle that applies to THEIR situation
4. The action - ONE thing they can do TODAY about THIS specific concern

BOUNDARIES:
- No therapy, medical, legal, or financial advice
- No promises about outcomes
- No passive acceptance - always empower action
- Keep response 150-200 words, warm and conversational

Remember: This person came to you with a real worry. Speak to THEM, not to a hypothetical person."""


@router.post("/detach")
async def detach_from_outcome(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate personalized detachment guidance through KIAAN AI.

    Uses KIAAN Core for Gita wisdom while maintaining the warm, friend-like
    approach that addresses the user's SPECIFIC concern.
    """
    outcome_worry = payload.get("outcome_worry", "")

    if not outcome_worry.strip():
        raise HTTPException(status_code=400, detail="outcome_worry is required")

    if len(outcome_worry) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    try:
        # Get relevant Gita wisdom from KIAAN's knowledge base
        # We use the viyoga_detachment context to get karma yoga verses
        gita_wisdom = await _get_gita_wisdom_for_detachment(db, outcome_worry)

        # Build the personalized prompt
        full_prompt = _build_viyoga_prompt(outcome_worry, gita_wisdom)

        # Use KIAAN Core with our detailed prompt
        kiaan_response = await kiaan_core.get_kiaan_response(
            message=full_prompt,
            user_id=None,
            db=db,
            context="viyoga_detachment",
            stream=False,
            language=None,
        )

        response_text = kiaan_response.get("response", "")
        verses_used = kiaan_response.get("verses_used", [])
        model = kiaan_response.get("model", "gpt-4o-mini")

        # Parse into structured format while keeping the full response
        detachment_guidance = _parse_response_to_structure(response_text)

        logger.info(f"Viyoga - personalized response generated, {len(verses_used)} verses")

        return {
            "status": "success",
            "detachment_guidance": detachment_guidance,
            "response": response_text,  # Full conversational response
            "gita_verses_used": len(verses_used),
            "model": model,
            "provider": "kiaan",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Viyoga error: {e}")
        return _get_fallback_response(outcome_worry)


async def _get_gita_wisdom_for_detachment(db: AsyncSession, concern: str) -> str:
    """Get relevant Gita wisdom for the user's specific concern."""
    try:
        from backend.services.wisdom_kb import WisdomKnowledgeBase
        from backend.services.gita_service import GitaService

        kb = WisdomKnowledgeBase()

        # Key karma yoga verses
        key_verses = [
            (2, 47),   # You have the right to action, not the fruits
            (2, 48),   # Perform action with equanimity
            (3, 19),   # Perform duty without attachment
            (6, 1),    # True renunciate performs duty
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

        return """- Your right is to action alone, never to its fruits
- Perform action with equanimity, abandoning attachment to success or failure
- One who performs their duty without attachment reaches the highest"""

    except Exception as e:
        logger.warning(f"Could not fetch Gita wisdom: {e}")
        return """- Your right is to action alone, never to its fruits
- Perform action with equanimity, abandoning attachment to success or failure
- One who performs their duty without attachment reaches the highest"""


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
            "validation": sections[0],
            "attachment_check": sections[1],
            "detachment_principle": sections[2],
            "one_action": sections[3],
        }
    elif len(sections) >= 2:
        return {
            "validation": sections[0],
            "attachment_check": "",
            "detachment_principle": sections[1] if len(sections) > 1 else "",
            "one_action": sections[-1] if len(sections) > 2 else "",
        }
    else:
        return {
            "validation": response_text,
            "attachment_check": "",
            "detachment_principle": "",
            "one_action": "",
        }


def _get_fallback_response(outcome_worry: str) -> dict[str, Any]:
    """Return a warm fallback response when KIAAN is unavailable."""
    return {
        "status": "success",
        "detachment_guidance": {
            "validation": f"I hear you - worrying about '{outcome_worry[:50]}...' is weighing on you. That pressure is real.",
            "attachment_check": "Notice how tightly you're holding onto a specific outcome. That grip itself creates suffering.",
            "detachment_principle": "Your power lies in what you do, not in controlling what happens after. The action is yours; the result never was.",
            "one_action": "Right now, choose ONE thing you can do today with full presence - then consciously release your grip on how it turns out.",
        },
        "response": f"I hear you - this worry about the outcome is weighing heavily on you, and that pressure is completely understandable.\n\nNotice how tightly you're holding onto how this needs to turn out. That grip itself is part of what's causing the suffering - not just the situation, but the clenching around it.\n\nHere's what I want you to remember: your power lies in what you DO, not in controlling what happens after. The action is yours; the result never was.\n\nSo here's what I'd suggest: choose ONE thing you can do today about this - just one step, with your full presence. Do it well. Then consciously release your grip on how it turns out. That's where your peace lives.",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def viyoga_health():
    """Health check for Viyoga service."""
    return {
        "status": "ok",
        "service": "viyoga-detach",
        "provider": "kiaan",
        "ecosystem": "KIAAN AI",
    }
