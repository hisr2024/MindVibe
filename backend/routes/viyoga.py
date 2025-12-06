"""Viyoga Detachment Coach with complete Bhagavad Gita wisdom integration.

This router provides outcome anxiety reduction assistance powered by all 700 verses
of the Bhagavad Gita, focusing on karma yoga and detachment principles.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from openai import APIError, AuthenticationError, BadRequestError, OpenAI, RateLimitError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.wisdom_kb import WisdomKnowledgeBase

logger = logging.getLogger(__name__)

api_key = os.getenv("OPENAI_API_KEY", "").strip()
model_name = os.getenv("GUIDANCE_MODEL", "gpt-4o-mini")
client = OpenAI(api_key=api_key) if api_key else None

router = APIRouter(prefix="/api/viyoga", tags=["viyoga"])


async def _generate_response(
    *,
    system_prompt: str,
    user_payload: Dict[str, Any],
    expect_json: bool,
    temperature: float = 0.4,
    max_tokens: int = 500,
) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Generate OpenAI response with error handling."""
    if not client:
        logger.error("Viyoga engine unavailable: missing OpenAI API key")
        raise HTTPException(status_code=503, detail="Viyoga engine is not configured")

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
        logger.exception("Authentication error for Viyoga engine")
        raise HTTPException(status_code=401, detail="Authentication with OpenAI failed") from exc
    except RateLimitError as exc:
        logger.warning("Rate limit reached for Viyoga engine")
        raise HTTPException(status_code=429, detail="Rate limited by model provider") from exc
    except BadRequestError as exc:
        logger.exception("Bad request sent to OpenAI for Viyoga engine")
        raise HTTPException(status_code=400, detail="Invalid payload for Viyoga engine") from exc
    except APIError as exc:
        logger.exception("OpenAI API error for Viyoga engine")
        raise HTTPException(status_code=502, detail="Model provider error") from exc
    except Exception as exc:  # pragma: no cover - defensive catch-all
        logger.exception("Unexpected error while generating Viyoga response")
        raise HTTPException(status_code=500, detail="Unexpected error generating response") from exc

    raw_text = completion.choices[0].message.content if completion.choices else None
    parsed: Optional[Dict[str, Any]] = None

    if expect_json and raw_text:
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            logger.warning("Viyoga response was not valid JSON; returning raw text")

    return parsed, raw_text


@router.post("/detach")
async def detach_from_outcome(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Generate detachment guidance rooted in Bhagavad Gita karma yoga principles.
    
    Expects payload with:
    - outcome_worry: The outcome anxiety or result-focused concern
    
    Returns structured JSON with:
    - validation: Recognition of the anxiety
    - attachment_check: Identification of attachment to results
    - detachment_principle: Clear principle from karma yoga
    - one_action: One small, controllable action step
    - gita_verses_used: Count of verses used for context
    """
    outcome_worry = payload.get("outcome_worry", "")
    
    if not outcome_worry.strip():
        raise HTTPException(status_code=400, detail="outcome_worry is required")
    
    # Search query focusing on nishkama karma, detachment, and equanimity
    search_query = f"{outcome_worry} karma yoga nishkama karma detachment equanimity action duty results"
    
    # Search relevant Gita verses
    gita_kb = WisdomKnowledgeBase()
    verse_results = []
    gita_context = ""
    
    try:
        verse_results = await gita_kb.search_relevant_verses(
            db=db,
            query=search_query,
            limit=5
        )
        
        # Build Gita context for the prompt (internal use only)
        if verse_results:
            for v in verse_results:
                verse_obj = v.get("verse")
                if verse_obj:
                    # Handle both verse_number (WisdomVerse, _GitaVerseWrapper) and verse (GitaVerse) attributes
                    verse_num = getattr(verse_obj, 'verse_number', None) or getattr(verse_obj, 'verse', None)
                    gita_context += f"\nChapter {verse_obj.chapter}, Verse {verse_num}:\n{verse_obj.english}\n"
                    # Use principle if available, otherwise use context
                    principle = getattr(verse_obj, 'principle', None) or getattr(verse_obj, 'context', '')
                    if principle:
                        gita_context += f"Principle: {principle}\n"
        
        logger.info(f"Viyoga - Found {len(verse_results)} Gita verses for outcome detachment")
        logger.debug(f"Gita context built: {gita_context[:200]}...")
    except Exception as e:
        logger.error(f"Error fetching Gita verses for Viyoga: {e}")
        gita_context = ""
    
    # Use default principles if no Gita context was built
    if not gita_context:
        gita_context = "Apply universal principles of nishkama karma (actionless action), vairagya (detachment), and samatva (equanimity in success and failure)."
    
    # System prompt with Gita wisdom integration
    VIYOGA_WITH_GITA_PROMPT = f"""
VIYOGA DETACHMENT COACH - Powered by Bhagavad Gita Karma Yoga

You are Viyoga, a calm guide helping shift from outcome anxiety to grounded action.
Your guidance is rooted in the timeless principles of karma yoga from 700 verses.

GITA WISDOM FOR THIS SITUATION (use internally, NEVER cite verse numbers):
{gita_context}

CRITICAL RULES:
- Apply karma yoga wisdom naturally as universal life principles
- NEVER mention "Bhagavad Gita", "Chapter X.Y", "verse numbers", "Krishna", or "Arjuna"
- Use Gita terminology naturally: karma (action), dharma (duty), nishkama karma (desireless action),
  vairagya (detachment), samatva (equanimity), buddhi (discernment), kartavya (what must be done)
- NO citations like "studies show" or "research indicates"
- Keep tone calm, grounded, validating, and action-focused
- Be concise - 1-2 sentences per field

OUTPUT FORMAT - Return ONLY this JSON structure:
{{
  "validation": "<Acknowledge the outcome anxiety without judgment, 1-2 sentences>",
  "attachment_check": "<Identify the attachment to results creating pressure, 1-2 sentences>",
  "detachment_principle": "<Clear karma yoga principle about action without attachment, 1-2 sentences>",
  "one_action": "<One small, controllable action they can take now, 1 sentence>"
}}

EXAMPLES:
{{
  "validation": "The pressure to get this right is weighing heavily on you. Outcome anxiety is real and exhausting.",
  "attachment_check": "You're tying your worth to how this turns out, which creates fear before action even begins.",
  "detachment_principle": "Your responsibility is to the action itself, not to control the result. Do your duty with full effort, then release the outcome.",
  "one_action": "Choose one step you can take today with full focus, letting go of how it will be received."
}}

{{
  "validation": "Worrying about what others will think is consuming your energy. That fear is understandable.",
  "attachment_check": "Your mind is focused on judgment and approval rather than the work itself.",
  "detachment_principle": "Act from your inner clarity and duty, not from fear of opinion. Results come from effort, not anxiety.",
  "one_action": "Before starting, set one clear intention for your work, independent of others' reactions."
}}

{{
  "validation": "The stakes feel high, and the fear of failing is paralyzing. This weight is very real.",
  "attachment_check": "You're holding tightly to a specific outcome, which makes every step feel fragile.",
  "detachment_principle": "Success and failure are temporary. What matters is showing up with integrity and doing what must be done.",
  "one_action": "Take the next small step without trying to predict or control what comes after."
}}

BOUNDARIES:
- NOT a therapist, NOT crisis support
- If severe distress appears, include: "Please reach out to a trusted person or professional for support."
- Do NOT encourage passivity or fate-based thinking - emphasize action with detachment
- Stay separate from KIAAN - do not interfere with its purpose
"""

    # Normalize the payload for the model
    normalized_payload = {
        "outcome_worry": outcome_worry,
        "guidance_focus": "Shift from outcome anxiety to grounded, detached action"
    }

    parsed, raw_text = await _generate_response(
        system_prompt=VIYOGA_WITH_GITA_PROMPT,
        user_payload=normalized_payload,
        expect_json=True,
        temperature=0.4,
        max_tokens=500,
    )

    # Extract fields from response
    response_data: Optional[Dict[str, str]] = None
    if parsed:
        validation = parsed.get("validation", "")
        attachment_check = parsed.get("attachment_check", "")
        detachment_principle = parsed.get("detachment_principle", "")
        one_action = parsed.get("one_action", "")
        
        response_data = {
            "validation": validation,
            "attachment_check": attachment_check,
            "detachment_principle": detachment_principle,
            "one_action": one_action,
        }
    
    return {
        "status": "success" if parsed else "partial_success",
        "detachment_guidance": response_data,
        "gita_verses_used": len(verse_results),
        "raw_text": raw_text,
        "model": model_name,
        "provider": "viyoga",
    }
