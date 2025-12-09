"""Ardha Reframing Engine with complete Bhagavad Gita wisdom integration.

This router provides cognitive reframing assistance powered by all 700 verses
of the Bhagavad Gita, helping transform negative thoughts into balanced perspectives.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from openai import (
    APIError,
    AuthenticationError,
    BadRequestError,
    OpenAI,
    RateLimitError,
)
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.wisdom_kb import WisdomKnowledgeBase

logger = logging.getLogger(__name__)

api_key = os.getenv("OPENAI_API_KEY", "").strip()
model_name = os.getenv("GUIDANCE_MODEL", "gpt-4o-mini")
client = OpenAI(api_key=api_key) if api_key else None

# Default Gita principles when verse search fails
DEFAULT_GITA_PRINCIPLES = "Apply universal principles of sthitaprajna (stability of mind), viveka (discrimination), and samatva (equanimity)."

router = APIRouter(prefix="/api/ardha", tags=["ardha"])

# Sthitaprajna section constants
STHITAPRAJNA_START = 54  # Chapter 2, verse 54 - beginning of sthitaprajna (steady wisdom) teaching
STHITAPRAJNA_END = 72    # Chapter 2, verse 72 - end of sthitaprajna section


async def get_reframing_verses(db: AsyncSession, negative_thought: str, limit: int = 5) -> list[dict[str, Any]]:
    """
    Get sthitaprajna (steady wisdom) verses for cognitive reframing.
    
    Focuses on verses about equanimity, emotional regulation, and mental stability,
    particularly from Chapter 2:54-72 (sthitaprajna section).
    
    Key verses:
    - 2.56: Unaffected by adversity, free from cravings
    - 2.57: Without attachment, balanced in joy and sorrow
    - 2.62-63: Chain of desire leading to loss of wisdom
    - 6.5: Elevate yourself by your own mind
    - Others from equanimity and self-mastery themes
    
    Args:
        db: Database session
        negative_thought: The negative thought to reframe
        limit: Maximum number of verses to return (default 5)
        
    Returns:
        List of relevant verse results with scores
    """
    from backend.services.gita_service import GitaService
    
    kb = WisdomKnowledgeBase()
    
    # Priority 1: Try to get specific sthitaprajna verses (2.54-2.72)
    sthitaprajna_verses = []
    try:
        # Get verses from Chapter 2, verses 54-72 (sthitaprajna section)
        for verse_num in range(STHITAPRAJNA_START, STHITAPRAJNA_END + 1):
            verse = await GitaService.get_verse_by_reference(db, chapter=2, verse=verse_num)
            if verse:
                sthitaprajna_verses.append({
                    "verse": verse,
                    "score": 0.9,  # High priority for these specific verses
                    "sanitized_text": kb.sanitize_text(verse.english)
                })
    except Exception as e:
        logger.warning(f"Could not fetch sthitaprajna verses: {e}")
    
    # Priority 2: Get key individual verses for equanimity
    key_verses = [
        (2, 56), (2, 57), (2, 62), (2, 63),  # Sthitaprajna core
        (6, 5), (6, 6),  # Self-elevation
        (2, 14), (2, 15),  # Enduring dualities
        (12, 13), (12, 14), (12, 15),  # Devotion and equanimity
    ]
    
    key_verse_results = []
    for chapter, verse_num in key_verses:
        try:
            verse = await GitaService.get_verse_by_reference(db, chapter=chapter, verse=verse_num)
            if verse:
                key_verse_results.append({
                    "verse": verse,
                    "score": 0.85,
                    "sanitized_text": kb.sanitize_text(verse.english)
                })
        except Exception as e:
            logger.debug(f"Could not fetch verse {chapter}.{verse_num}: {e}")
    
    # Priority 3: Search by theme for additional context
    theme_search_results = []
    try:
        # Search for equanimity and mind-control themes
        search_query = f"{negative_thought} equanimity mind stability discernment balance"
        theme_search_results = await kb.search_relevant_verses_full_db(
            db=db,
            query=search_query,
            theme="equanimity",
            limit=3
        )
    except Exception as e:
        logger.debug(f"Theme search failed: {e}")
    
    # Combine all sources, prioritizing sthitaprajna verses
    all_results = sthitaprajna_verses[:3] + key_verse_results[:5] + theme_search_results
    
    # Remove duplicates (by verse_id)
    seen_ids = set()
    unique_results = []
    for result in all_results:
        verse = result.get("verse")
        if verse:
            verse_id = f"{verse.chapter}.{verse.verse}"
            if verse_id not in seen_ids:
                seen_ids.add(verse_id)
                unique_results.append(result)
    
    # Sort by score and return top N
    unique_results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return unique_results[:limit]


async def _generate_response(
    *,
    system_prompt: str,
    user_payload: dict[str, Any],
    expect_json: bool,
    temperature: float = 0.4,
    max_tokens: int = 500,
) -> tuple[dict[str, Any] | None, str | None]:
    """Generate OpenAI response with error handling."""
    if not client:
        logger.error("Ardha engine unavailable: missing OpenAI API key")
        raise HTTPException(status_code=503, detail="Ardha engine is not configured")

    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except AuthenticationError as exc:
        logger.exception("Authentication error for Ardha engine")
        raise HTTPException(status_code=401, detail="Authentication with OpenAI failed") from exc
    except RateLimitError as exc:
        logger.warning("Rate limit reached for Ardha engine")
        raise HTTPException(status_code=429, detail="Rate limited by model provider") from exc
    except BadRequestError as exc:
        logger.exception("Bad request sent to OpenAI for Ardha engine")
        raise HTTPException(status_code=400, detail="Invalid payload for Ardha engine") from exc
    except APIError as exc:
        logger.exception("OpenAI API error for Ardha engine")
        raise HTTPException(status_code=502, detail="Model provider error") from exc
    except Exception as exc:  # pragma: no cover - defensive catch-all
        logger.exception("Unexpected error while generating Ardha response")
        raise HTTPException(status_code=500, detail="Unexpected error generating response") from exc

    raw_text = completion.choices[0].message.content if completion.choices else None
    parsed: dict[str, Any] | None = None

    if expect_json and raw_text:
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            logger.warning("Ardha response was not valid JSON; returning raw text")

    return parsed, raw_text


@router.post("/reframe")
async def reframe_thought(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate cognitive reframing guidance rooted in Bhagavad Gita wisdom.

    Expects payload with:
    - negative_thought: The negative or distressing thought to reframe

    Returns structured JSON with:
    - recognition: Validation of the feeling
    - deep_insight: The wisdom principle being applied
    - reframe: The balanced, empowering perspective
    - small_action_step: One controllable action to take
    - gita_verses_used: Count of verses used for context
    """
    negative_thought = payload.get("negative_thought", "")

    if not negative_thought.strip():
        raise HTTPException(status_code=400, detail="negative_thought is required")

    # Search query focusing on equanimity, clarity, and self-mastery
    search_query = f"{negative_thought} equanimity clarity mind stability self-knowledge detachment"

    # Get sthitaprajna verses for cognitive reframing
    verse_results = []
    gita_context = ""

    try:
        # Use dedicated function for sthitaprajna verses
        verse_results = await get_reframing_verses(db, negative_thought, limit=5)

        # Build Gita context for the prompt (internal use only)
        if verse_results:
            for v in verse_results:
                verse_obj = v.get("verse")
                if verse_obj:
                    # Handle both verse_number (WisdomVerse, _GitaVerseWrapper) and verse (GitaVerse) attributes
                    # This fallback pattern matches the existing pattern in guidance.py for compatibility
                    verse_num = getattr(verse_obj, 'verse_number', None) or getattr(verse_obj, 'verse', None)
                    gita_context += f"\nChapter {verse_obj.chapter}, Verse {verse_num}:\n{verse_obj.english}\n"
                    # Use principle if available, otherwise use context
                    # This fallback ensures we get the best available explanatory text
                    principle = getattr(verse_obj, 'principle', None) or getattr(verse_obj, 'context', '')
                    if principle:
                        gita_context += f"Principle: {principle}\n"

        logger.info(f"Ardha - Found {len(verse_results)} sthitaprajna verses for thought reframing")
        logger.debug(f"Gita context built: {gita_context[:200]}...")
    except Exception as e:
        logger.error(f"Error fetching Gita verses for Ardha: {e}")
        gita_context = ""

    # Use default principles if no Gita context was built
    if not gita_context:
        gita_context = DEFAULT_GITA_PRINCIPLES

    # System prompt with Gita wisdom integration
    ARDHA_WITH_GITA_PROMPT = f"""
ARDHA REFRAMING ENGINE - Powered by Bhagavad Gita Wisdom

You are Ardha, a calm, wise voice helping transform negative thoughts into balanced perspectives.
Your guidance is rooted in the timeless wisdom of 700 verses while remaining modern and accessible.

GITA WISDOM FOR THIS SITUATION (use internally, NEVER cite verse numbers):
{gita_context}

CRITICAL RULES:
- Apply Gita wisdom naturally as universal life principles
- NEVER mention "Bhagavad Gita", "Chapter X.Y", "verse numbers", "Krishna", or "Arjuna"
- Use Gita terminology naturally: dharma (duty), karma (action), buddhi (discernment),
  viveka (discrimination), samatva (equanimity), vairagya (detachment), sthitaprajna (stability of mind)
- NO citations like "studies show" or "research indicates"
- Keep tone warm, grounded, non-preachy, and emotionally validating
- Be concise - 1-2 sentences per field

OUTPUT FORMAT - Return ONLY this JSON structure:
{{
  "recognition": "<Validate the feeling without dilution, 1-2 sentences>",
  "deep_insight": "<The wisdom principle being applied, 1-2 sentences>",
  "reframe": "<Balanced, empowering perspective rooted in Gita wisdom, 1-2 sentences>",
  "small_action_step": "<One doable action within their control, 1 sentence>"
}}

EXAMPLES:
{{
  "recognition": "You're feeling inadequate, like you're falling short. That weight is real.",
  "deep_insight": "Growth happens through steady effort, not perfection. Your worth isn't measured by outcomes alone.",
  "reframe": "Each mistake is a step toward clarity and strength. You're building resilience through action, not avoiding it.",
  "small_action_step": "Take one small action today that aligns with your values, regardless of the result."
}}

{{
  "recognition": "The fear of failure is overwhelming. You're worried you'll disappoint yourself and others.",
  "deep_insight": "True strength lies in doing your duty without attachment to how things turn out.",
  "reframe": "Focus on what you can control—your effort and intention—and let go of what you cannot.",
  "small_action_step": "Before your next task, take three deep breaths and set one clear intention."
}}

BOUNDARIES:
- NOT a therapist, NOT crisis support
- If severe distress or self-harm is evident, include: "Please reach out to a trusted person or professional for support."
- Stay separate from KIAAN - do not interfere with its purpose
"""

    # Normalize the payload for the model
    normalized_payload = {
        "negative_thought": negative_thought,
        "guidance_focus": "Transform this thought into a balanced, empowering perspective"
    }

    parsed, raw_text = await _generate_response(
        system_prompt=ARDHA_WITH_GITA_PROMPT,
        user_payload=normalized_payload,
        expect_json=True,
        temperature=0.4,
        max_tokens=500,
    )

    # Extract fields from response
    response_data: dict[str, str] | None = None
    if parsed:
        recognition = parsed.get("recognition", "")
        deep_insight = parsed.get("deep_insight", "")
        reframe = parsed.get("reframe", "")
        small_action_step = parsed.get("small_action_step", "")

        response_data = {
            "recognition": recognition,
            "deep_insight": deep_insight,
            "reframe": reframe,
            "small_action_step": small_action_step,
        }

    return {
        "status": "success" if parsed else "partial_success",
        "reframe_guidance": response_data,
        "gita_verses_used": len(verse_results),
        "raw_text": raw_text,
        "model": model_name,
        "provider": "ardha",
    }
