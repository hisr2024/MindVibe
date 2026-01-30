"""Ardha Reframing Engine - KIAAN AI Integration (KIAAN Chat Pattern).

This router provides cognitive reframing using the same deep KIAAN integration
as KIAAN Chat - directly fetching Gita verses, building wisdom context, and generating
responses that truly comprehend and interpret through the Gita.

Ardha focuses on sthitaprajna (steady wisdom) principles for thought transformation.
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

router = APIRouter(prefix="/api/ardha", tags=["ardha"])

# Initialize OpenAI client (same pattern as KIAAN Chat)
api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None

# Initialize Gita knowledge base
gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Ardha: Gita knowledge base loaded")
except Exception as e:
    logger.warning(f"⚠️ Ardha: Gita KB unavailable: {e}")


def _build_gita_context(verse_results: list[dict], limit: int = 5) -> str:
    """Build Gita context from verse results (same pattern as KIAAN Chat)."""
    if not verse_results:
        return "Apply sthitaprajna principles: steady wisdom that remains undisturbed by life's dualities."

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

    return "\n".join(context_parts) if context_parts else "Apply sthitaprajna: the mind undisturbed by adversity, free from attachment and fear."


@router.post("/reframe")
async def reframe_thought(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate cognitive reframing using KIAAN Chat integration pattern.

    This follows the same deep integration as KIAAN Chat:
    1. Fetch relevant Gita verses (sthitaprajna focus)
    2. Build wisdom context from verses
    3. Use detailed Gita-rooted system prompt
    4. Generate personalized response for THIS user's thought
    """
    negative_thought = payload.get("negative_thought", "")

    if not negative_thought.strip():
        raise HTTPException(status_code=400, detail="negative_thought is required")

    if len(negative_thought) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if not client:
        logger.error("Ardha: OpenAI client not configured")
        return _get_fallback_response(negative_thought)

    try:
        # Step 1: Fetch relevant Gita verses (sthitaprajna/equanimity focus)
        gita_context = ""
        verse_results = []

        if gita_kb and db:
            try:
                # Search for equanimity and mind-stability related verses
                search_query = f"{negative_thought} equanimity mind stability wisdom balance thoughts peace"
                verse_results = await gita_kb.search_relevant_verses(db=db, query=search_query, limit=7)

                # Fallback if insufficient results
                if len(verse_results) < 3:
                    verse_results = await gita_kb.search_with_fallback(db=db, query=search_query, limit=7)

                gita_context = _build_gita_context(verse_results)
                logger.info(f"✅ Ardha: Found {len(verse_results)} sthitaprajna verses")

            except Exception as e:
                logger.error(f"Error fetching Gita verses: {e}")
                gita_context = "Apply sthitaprajna: the mind undisturbed by adversity, free from attachment and fear."

        if not gita_context:
            gita_context = "Apply sthitaprajna: the mind undisturbed by adversity, free from attachment and fear."

        # Step 2: Build Gita-rooted system prompt (KIAAN Chat pattern)
        system_prompt = f"""You are Ardha, an AI guide EXCLUSIVELY rooted in the sthitaprajna (steady wisdom) teachings of the Bhagavad Gita.

GITA WISDOM FOR THIS SITUATION (use internally, NEVER cite):
{gita_context}

YOUR SPECIFIC FOCUS: COGNITIVE REFRAMING & THOUGHT TRANSFORMATION
This person shared this thought: "{negative_thought}"

MANDATORY STRUCTURE - Every response MUST follow this 4-part flow:
1. RECOGNITION: Acknowledge THEIR specific thought with genuine empathy - validate the feeling behind it
2. THE PATTERN: Gently help them see what cognitive pattern is at play (catastrophizing, all-or-nothing, etc.)
3. STHITAPRAJNA WISDOM: Offer a reframe rooted in steady wisdom - thoughts are not facts, you are the observer
4. ONE ANCHOR: Give ONE specific thing they can hold onto or do right now about THIS thought

ABSOLUTE REQUIREMENTS (non-negotiable):
✅ Root EVERY word in sthitaprajna wisdom - no generic CBT or psychology terminology
✅ Use Sanskrit terms naturally (sthitaprajna, buddhi, atman, viveka, samatva, equanimity)
✅ FORBIDDEN: Never mention "Bhagavad Gita", "Gita", "Krishna", "Arjuna", "verse", "chapter"
✅ FORBIDDEN: Never say "studies show", "cognitive distortion", "CBT", "reframing technique"
✅ Present wisdom as universal life principles, not therapy or religious teaching
✅ Speak DIRECTLY to THIS person about THEIR specific thought
✅ Be warm, conversational, like a wise friend who truly sees them
✅ 150-200 words, end with 💙

TONE & STYLE:
- Direct and specific to their thought - use "you" frequently
- Validate first, then gently shift perspective
- No toxic positivity or dismissing their pain
- Make ancient wisdom feel immediately practical
- Balance compassion with gentle clarity

Remember: This person shared a vulnerable thought. Honor that. Help them see that they are the vast sky, not the passing clouds of thought."""

        # Step 3: Generate response (KIAAN Chat pattern)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"I keep thinking: {negative_thought}"}
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
            return _get_fallback_response(negative_thought)

        # Parse into structured format
        reframe_guidance = _parse_response_to_structure(content)

        return {
            "status": "success",
            "reframe_guidance": reframe_guidance,
            "raw_text": content,
            "gita_verses_used": len(verse_results),
            "model": "gpt-4o-mini",
            "provider": "kiaan",
        }

    except Exception as e:
        logger.exception(f"Ardha error: {e}")
        return _get_fallback_response(negative_thought)


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
    """Fallback when KIAAN is unavailable."""
    thought_snippet = negative_thought[:50] + "..." if len(negative_thought) > 50 else negative_thought
    return {
        "status": "success",
        "reframe_guidance": {
            "recognition": f"I hear you - this thought '{thought_snippet}' is weighing on you. That's real.",
            "deep_insight": "Notice that your mind is treating this thought as absolute truth. But thoughts, even painful ones, are not facts - they're interpretations.",
            "reframe": "You are the observer of your thoughts, not the thoughts themselves. Like clouds passing through the sky, this thought will pass. The sky remains.",
            "small_action_step": "Right now, take one breath. Then ask yourself: 'What would I tell a friend who shared this same thought?'",
        },
        "raw_text": f"I hear you - this thought is weighing on you, and that's completely real. When we're struggling, our minds can be relentless.\n\nNotice something: your mind is treating this thought as absolute truth. But thoughts, even the painful ones, aren't facts - they're interpretations shaped by how you're feeling right now.\n\nHere's what I want you to remember: you are the observer of your thoughts, not the thoughts themselves. Like clouds passing through the vast sky, this thought will pass. The sky - your true self - remains unchanged, peaceful, whole.\n\nTry this: take one breath. Then ask yourself, 'What would I tell a friend who shared this same thought?' Often, we have wisdom for others that we forget to offer ourselves. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def ardha_health():
    """Health check."""
    return {"status": "ok", "service": "ardha", "provider": "kiaan"}
