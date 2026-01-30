"""Viyoga Detachment Coach - KIAAN AI Ecosystem Integration.

This router provides outcome anxiety reduction assistance powered by KIAAN Core
and the complete 700-verse Bhagavad Gita wisdom database, focusing on karma yoga.

Part of the KIAAN AI Ecosystem alongside:
- Ardha (Reframing Engine)
- Relationship Compass
- Karma Reset
- Emotional Reset
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


@router.post("/detach")
async def detach_from_outcome(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate detachment guidance through KIAAN AI with Gita karma yoga wisdom.

    Uses the KIAAN Core engine with "viyoga_detachment" context for specialized
    outcome anxiety reduction rooted in nishkama karma (desireless action).

    Expects payload with:
    - outcome_worry: The outcome anxiety or result-focused concern

    Returns structured JSON with:
    - status: success/error
    - detachment_guidance: Structured response with validation, attachment check, principle, action
    - gita_verses_used: Count of verses used for context
    - model: AI model used
    - provider: "kiaan" indicating KIAAN ecosystem integration
    """
    outcome_worry = payload.get("outcome_worry", "")

    if not outcome_worry.strip():
        raise HTTPException(status_code=400, detail="outcome_worry is required")

    # Validate input length
    if len(outcome_worry) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    try:
        # Use KIAAN Core with viyoga_detachment context
        # This leverages the full KIAAN ecosystem: wisdom database, divine integration,
        # multi-provider support, offline fallback, and validated responses
        kiaan_response = await kiaan_core.get_kiaan_response(
            message=f"Help me release attachment to this outcome worry: {outcome_worry}",
            user_id=None,
            db=db,
            context="viyoga_detachment",
            stream=False,
            language=None,
        )

        response_text = kiaan_response.get("response", "")
        verses_used = kiaan_response.get("verses_used", [])
        validation = kiaan_response.get("validation", {})
        model = kiaan_response.get("model", "gpt-4o-mini")

        # Parse the KIAAN response into structured Viyoga format
        # KIAAN's viyoga_detachment context produces compassionate detachment guidance
        detachment_guidance = _parse_kiaan_to_viyoga_format(response_text)

        logger.info(f"Viyoga detach via KIAAN - {len(verses_used)} verses used, valid: {validation.get('valid', True)}")

        return {
            "status": "success",
            "detachment_guidance": detachment_guidance,
            "gita_verses_used": len(verses_used),
            "raw_text": response_text,
            "model": model,
            "provider": "kiaan",
            "validation": validation,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Viyoga detach error: {e}")
        # Return graceful fallback
        return {
            "status": "error",
            "detachment_guidance": {
                "validation": "The pressure you feel about this outcome is real and understandable.",
                "attachment_check": "You may be tying your peace to something outside your control.",
                "detachment_principle": "True freedom comes from offering your best effort as a gift, without needing a specific result in return.",
                "one_action": "Take one step today with full presence, then consciously release your grip on the outcome.",
            },
            "gita_verses_used": 0,
            "raw_text": None,
            "model": "fallback",
            "provider": "kiaan",
            "error": str(e),
        }


def _parse_kiaan_to_viyoga_format(response_text: str) -> dict[str, str]:
    """Parse KIAAN's narrative response into structured Viyoga format.

    KIAAN produces a flowing, compassionate response. We extract the key elements
    that map to Viyoga's 4-part structure:
    1. Validation - Acknowledging the anxiety
    2. Attachment Check - Identifying the attachment
    3. Detachment Principle - Karma yoga wisdom
    4. One Action - One controllable step
    """
    # Split response into sections for parsing
    lines = response_text.strip().split('\n')
    sections = []
    current_section = []

    for line in lines:
        if line.strip():
            current_section.append(line.strip())
        elif current_section:
            sections.append(' '.join(current_section))
            current_section = []

    if current_section:
        sections.append(' '.join(current_section))

    # Clean up any emoji at the end
    if sections:
        sections[-1] = sections[-1].replace('💙', '').strip()

    # Map sections to Viyoga format
    # KIAAN's sacred structure: Opening → Acknowledgment → Wisdom → Guidance → Closing
    if len(sections) >= 4:
        return {
            "validation": sections[0] if len(sections) > 0 else "",
            "attachment_check": sections[1] if len(sections) > 1 else "",
            "detachment_principle": sections[2] if len(sections) > 2 else "",
            "one_action": sections[3] if len(sections) > 3 else "",
        }
    elif len(sections) == 3:
        return {
            "validation": sections[0],
            "attachment_check": sections[1],
            "detachment_principle": sections[2],
            "one_action": "Take one mindful step today, then consciously release attachment to the result.",
        }
    elif len(sections) == 2:
        return {
            "validation": sections[0],
            "attachment_check": "",
            "detachment_principle": sections[1],
            "one_action": "Take one mindful step today, then consciously release attachment to the result.",
        }
    elif len(sections) == 1:
        # Single paragraph response
        return {
            "validation": "I hear the weight of this concern you're carrying.",
            "attachment_check": "",
            "detachment_principle": sections[0],
            "one_action": "Take one mindful step today, then consciously release attachment to the result.",
        }
    else:
        # Fallback for empty response
        return {
            "validation": "The pressure you feel about this outcome is understandable.",
            "attachment_check": "Your peace has become attached to something beyond your control.",
            "detachment_principle": "True freedom comes from offering your effort as a gift, without needing a specific result.",
            "one_action": "Take one step today with full presence, then consciously release your grip on the outcome.",
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
