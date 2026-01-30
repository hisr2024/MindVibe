"""Relationship Compass - KIAAN AI Integration (KIAAN Chat Pattern).

This router provides relationship conflict navigation using the same deep KIAAN integration
as KIAAN Chat - directly fetching Gita verses, building wisdom context, and generating
responses that truly comprehend and interpret through the Gita.

Relationship Compass focuses on dharma (right action) and daya (compassion) principles.
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

router = APIRouter(prefix="/api/relationship-compass", tags=["relationship-compass"])

# Initialize OpenAI client (same pattern as KIAAN Chat)
api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None

# Initialize Gita knowledge base
gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Relationship Compass: Gita knowledge base loaded")
except Exception as e:
    logger.warning(f"⚠️ Relationship Compass: Gita KB unavailable: {e}")


def _build_gita_context(verse_results: list[dict], limit: int = 5) -> str:
    """Build Gita context from verse results (same pattern as KIAAN Chat)."""
    if not verse_results:
        return "Apply dharma principles: right action rooted in truth, compassion, and non-harm."

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

    return "\n".join(context_parts) if context_parts else "Apply dharma: act with truth and compassion, free from ego."


@router.post("/guide")
async def get_relationship_guidance(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate relationship guidance using KIAAN Chat integration pattern.

    This follows the same deep integration as KIAAN Chat:
    1. Fetch relevant Gita verses (dharma/compassion focus)
    2. Build wisdom context from verses
    3. Use detailed Gita-rooted system prompt
    4. Generate personalized response for THIS user's conflict
    """
    conflict = payload.get("conflict", "")

    if not conflict.strip():
        raise HTTPException(status_code=400, detail="conflict is required")

    if len(conflict) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if not client:
        logger.error("Relationship Compass: OpenAI client not configured")
        return _get_fallback_response(conflict)

    try:
        # Step 1: Fetch relevant Gita verses (dharma/compassion focus)
        gita_context = ""
        verse_results = []

        if gita_kb and db:
            try:
                # Search for relationship and conflict-related verses
                search_query = f"{conflict} dharma compassion forgiveness relationships conflict ego peace"
                verse_results = await gita_kb.search_relevant_verses(db=db, query=search_query, limit=7)

                # Fallback if insufficient results
                if len(verse_results) < 3:
                    verse_results = await gita_kb.search_with_fallback(db=db, query=search_query, limit=7)

                gita_context = _build_gita_context(verse_results)
                logger.info(f"✅ Relationship Compass: Found {len(verse_results)} dharma verses")

            except Exception as e:
                logger.error(f"Error fetching Gita verses: {e}")
                gita_context = "Apply dharma: act with truth and compassion, free from ego and the need to win."

        if not gita_context:
            gita_context = "Apply dharma: act with truth and compassion, free from ego and the need to win."

        # Step 2: Build Gita-rooted system prompt (KIAAN Chat pattern)
        system_prompt = f"""You are Relationship Compass, an AI guide EXCLUSIVELY rooted in the dharma (right action) and daya (compassion) teachings of the Bhagavad Gita.

GITA WISDOM FOR THIS SITUATION (use internally, NEVER cite):
{gita_context}

YOUR SPECIFIC FOCUS: RELATIONSHIP CONFLICT NAVIGATION
This person is dealing with: "{conflict}"

MANDATORY STRUCTURE - Every response MUST follow this 5-part flow:
1. ACKNOWLEDGMENT: Show you truly see THEIR specific conflict and its emotional weight
2. THE UNDERNEATH: Help them see what's really happening - what needs are unmet, what ego is at play
3. DHARMA CLARITY: What does right action look like in THEIR specific situation - honest, kind, boundaried
4. THE PATH: Give ONE specific thing they can do or say differently
5. THE ANCHOR: Something to remember when emotions run high

ABSOLUTE REQUIREMENTS (non-negotiable):
✅ Root EVERY word in dharma and compassion wisdom - no generic relationship advice
✅ Use Sanskrit terms naturally (dharma, daya, ahimsa, satya, shanti, equanimity)
✅ FORBIDDEN: Never mention "Bhagavad Gita", "Gita", "Krishna", "Arjuna", "verse", "chapter"
✅ FORBIDDEN: Never say "studies show", "communication experts", "therapists recommend"
✅ Present wisdom as universal life principles, not therapy or religious teaching
✅ Speak DIRECTLY to THIS person about THEIR specific conflict
✅ Never take sides or tell them to leave/stay
✅ Be warm, conversational, like a wise friend who sees both perspectives
✅ 180-220 words, end with 💙

TONE & STYLE:
- Direct and specific to their conflict - use "you" frequently
- Acknowledge the difficulty without taking sides
- Help them see beyond "winning" to what actually matters
- Balance compassion with honest clarity
- If safety is a concern, suggest professional support

Remember: This person is in pain about a relationship that matters. Help them find clarity through dharma - not victory, but understanding and right action."""

        # Step 3: Generate response (KIAAN Chat pattern)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"I'm struggling with this relationship situation: {conflict}"}
            ],
            temperature=0.7,
            max_tokens=400,
            timeout=30.0,
        )

        content = None
        if response and response.choices and len(response.choices) > 0:
            response_msg = response.choices[0].message
            if response_msg:
                content = response_msg.content

        if not content:
            return _get_fallback_response(conflict)

        # Parse into structured format
        compass_guidance = _parse_response_to_structure(content)

        return {
            "status": "success",
            "compass_guidance": compass_guidance,
            "response": content,
            "gita_verses_used": len(verse_results),
            "model": "gpt-4o-mini",
            "provider": "kiaan",
        }

    except Exception as e:
        logger.exception(f"Relationship Compass error: {e}")
        return _get_fallback_response(conflict)


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
    """Fallback when KIAAN is unavailable."""
    conflict_snippet = conflict[:50] + "..." if len(conflict) > 50 else conflict
    return {
        "status": "success",
        "compass_guidance": {
            "acknowledgment": f"I see you're navigating something difficult - '{conflict_snippet}'. That weight is real.",
            "underneath": "Beneath most conflicts are unmet needs - to be heard, respected, understood. What do YOU most need here?",
            "clarity": "Dharma in relationships means being honest while remaining kind. Not winning, but understanding.",
            "path_forward": "Try: 'I feel [emotion] when [situation] because [need]. What I'm hoping for is [request].'",
            "reminder": "The goal isn't to be right. It's to be understood - and to understand. That's where peace lives.",
        },
        "response": f"I see you're navigating something difficult here, and that weight is real.\n\nBeneath most conflicts are unmet needs - to be heard, to be respected, to be understood. Take a moment: what do YOU most need here? Not what you want them to do, but what you truly need.\n\nDharma in relationships means being honest while remaining kind. It's not about winning - it's about acting from your highest self, even when it's hard.\n\nHere's something to try: 'I feel [your emotion] when [the situation] because [your need]. What I'm hoping for is [your request].' This invites dialogue rather than defense.\n\nRemember: the goal isn't to be right. It's to be understood - and to understand. That's where peace lives. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def relationship_compass_health():
    """Health check."""
    return {"status": "ok", "service": "relationship-compass", "provider": "kiaan"}
