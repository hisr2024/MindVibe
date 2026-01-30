"""Viyoga Detachment Coach - KIAAN AI Integration (KIAAN Chat Pattern).

This router provides outcome anxiety reduction using the same deep KIAAN integration
as KIAAN Chat - directly fetching Gita verses, building wisdom context, and generating
responses that truly comprehend and interpret through the Gita.

Viyoga focuses on karma yoga principles for detachment from outcomes.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/viyoga", tags=["viyoga"])

# Initialize OpenAI client (same pattern as KIAAN Chat)
api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None

# Initialize Gita knowledge base
gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Viyoga: Gita knowledge base loaded")
except Exception as e:
    logger.warning(f"⚠️ Viyoga: Gita KB unavailable: {e}")


def _build_gita_context(verse_results: list[dict], limit: int = 5) -> str:
    """Build Gita context from verse results (same pattern as KIAAN Chat)."""
    if not verse_results:
        return "Apply karma yoga principles: focus on action without attachment to results."

    context_parts = []
    for result in verse_results[:limit]:
        verse = result.get("verse")
        if verse:
            english = getattr(verse, 'english', '') or getattr(verse, 'translation', '')
            principle = getattr(verse, 'principle', '') or getattr(verse, 'context', '')
            if english:
                # Sanitize religious terms (same as KIAAN Chat)
                english = english.replace("Krishna", "the teacher").replace("Arjuna", "the seeker")
                context_parts.append(f"• {english}")
                if principle:
                    context_parts.append(f"  (Principle: {principle})")

    return "\n".join(context_parts) if context_parts else "Apply karma yoga: your right is to action alone, never to its fruits."


@router.post("/detach")
async def detach_from_outcome(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate detachment guidance using KIAAN Chat integration pattern.

    This follows the same deep integration as KIAAN Chat:
    1. Fetch relevant Gita verses (karma yoga focus)
    2. Build wisdom context from verses
    3. Use detailed Gita-rooted system prompt
    4. Generate personalized response for THIS user's concern
    """
    outcome_worry = payload.get("outcome_worry", "")

    if not outcome_worry.strip():
        raise HTTPException(status_code=400, detail="outcome_worry is required")

    if len(outcome_worry) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if not client:
        logger.error("Viyoga: OpenAI client not configured")
        return _get_fallback_response(outcome_worry)

    try:
        # Step 1: Fetch relevant Gita verses (karma yoga focus)
        gita_context = ""
        verse_results = []

        if gita_kb and db:
            try:
                # Search for karma yoga and detachment related verses
                search_query = f"{outcome_worry} karma yoga detachment action results outcome anxiety"
                verse_results = await gita_kb.search_relevant_verses(db=db, query=search_query, limit=7)

                # Fallback if insufficient results
                if len(verse_results) < 3:
                    verse_results = await gita_kb.search_with_fallback(db=db, query=search_query, limit=7)

                gita_context = _build_gita_context(verse_results)
                logger.info(f"✅ Viyoga: Found {len(verse_results)} karma yoga verses")

            except Exception as e:
                logger.error(f"Error fetching Gita verses: {e}")
                gita_context = "Apply karma yoga: your right is to action alone, never to its fruits. Perform action with equanimity."

        if not gita_context:
            gita_context = "Apply karma yoga: your right is to action alone, never to its fruits. Perform action with equanimity."

        # Step 2: Build Gita-rooted system prompt (KIAAN Chat pattern)
        system_prompt = f"""You are Viyoga, an AI guide EXCLUSIVELY rooted in the karma yoga wisdom of the Bhagavad Gita.

GITA WISDOM FOR THIS SITUATION (use internally, NEVER cite):
{gita_context}

YOUR SPECIFIC FOCUS: OUTCOME ANXIETY & DETACHMENT
This person is worried about: "{outcome_worry}"

MANDATORY STRUCTURE - Every response MUST follow this 4-part flow:
1. RECOGNITION: Acknowledge THEIR specific worry with genuine empathy - show you truly see what they're anxious about
2. THE ATTACHMENT: Help them see how their peace has become tied to an outcome they cannot control
3. KARMA YOGA WISDOM: Share the principle that applies to THEIR situation - your right is to action, not results
4. ONE ACTION: Give ONE specific, doable thing they can do TODAY about THIS specific worry

ABSOLUTE REQUIREMENTS (non-negotiable):
✅ Root EVERY word in karma yoga wisdom - no generic psychology
✅ Use Sanskrit terms naturally (karma, dharma, nishkama karma, vairagya, equanimity, detachment)
✅ FORBIDDEN: Never mention "Bhagavad Gita", "Gita", "Krishna", "Arjuna", "verse", "chapter"
✅ FORBIDDEN: Never say "studies show", "research indicates", "experts say"
✅ Present wisdom as universal life principles, not religious teaching
✅ Speak DIRECTLY to THIS person about THEIR specific worry
✅ Be warm, conversational, like a wise friend who truly understands
✅ 150-200 words, end with 💙

TONE & STYLE:
- Direct and specific to their situation - use "you" frequently
- Acknowledge the difficulty without dismissing it
- Balance compassion with gentle clarity
- Make ancient wisdom feel immediately practical
- No toxic positivity - real help for real anxiety

Remember: This person came with a real worry about outcomes. Help them find freedom through karma yoga - not by dismissing their concern, but by showing them where their true power lies."""

        # Step 3: Generate response (KIAAN Chat pattern)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"I'm worried about: {outcome_worry}"}
            ],
            temperature=0.7,
            max_tokens=350,
            timeout=30.0,
        )

        content = None
        if response and response.choices and len(response.choices) > 0:
            response_msg = response.choices[0].message
            if response_msg:
                content = response_msg.content

        if not content:
            return _get_fallback_response(outcome_worry)

        # Parse into structured format
        detachment_guidance = _parse_response_to_structure(content)

        return {
            "status": "success",
            "detachment_guidance": detachment_guidance,
            "response": content,
            "gita_verses_used": len(verse_results),
            "model": "gpt-4o-mini",
            "provider": "kiaan",
        }

    except Exception as e:
        logger.exception(f"Viyoga error: {e}")
        return _get_fallback_response(outcome_worry)


def _parse_response_to_structure(response_text: str) -> dict[str, str]:
    """Parse response into structured format."""
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
    """Fallback when KIAAN is unavailable."""
    return {
        "status": "success",
        "detachment_guidance": {
            "validation": f"I hear you - this worry about '{outcome_worry[:50]}...' is weighing on you. That pressure is real.",
            "attachment_check": "Notice how your peace has become tied to how this turns out. That grip itself creates suffering.",
            "detachment_principle": "Your right is to action alone, never to its fruits. Pour yourself into what you CAN do, then release the outcome.",
            "one_action": "Today, choose ONE thing you can do about this with full presence - then consciously let go of controlling the result.",
        },
        "response": f"I hear you - this worry is weighing on you, and that pressure is completely real.\n\nNotice how your peace has become tied to how this turns out. That grip itself - not just the situation, but the clenching around it - is part of what's causing the suffering.\n\nHere's the wisdom that frees: your right is to action alone, never to its fruits. You pour yourself fully into what you CAN do, then release your grip on the outcome. This isn't passivity - it's focused action without anxiety.\n\nToday, choose ONE thing you can do about this with your full presence. Do it well. Then consciously let go of controlling the result. That's where your peace lives. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def viyoga_health():
    """Health check."""
    return {"status": "ok", "service": "viyoga", "provider": "kiaan"}
