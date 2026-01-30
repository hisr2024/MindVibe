"""Ardha Reframing Engine - KIAAN AI Ecosystem Integration.

This router provides cognitive reframing assistance powered by KIAAN Core
and the complete 700-verse Bhagavad Gita wisdom database.

Part of the KIAAN AI Ecosystem alongside:
- Viyoga (Detachment Coach)
- Relationship Compass
- Karma Reset
- Emotional Reset
"""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.kiaan_core import kiaan_core

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ardha", tags=["ardha"])


@router.post("/reframe")
async def reframe_thought(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate cognitive reframing guidance through KIAAN AI with Gita wisdom.

    Uses the KIAAN Core engine with "ardha_reframe" context for specialized
    thought transformation guidance rooted in sthitaprajna (steady wisdom).

    Expects payload with:
    - negative_thought: The negative or distressing thought to reframe

    Returns structured JSON with:
    - status: success/error
    - reframe_guidance: Structured response with recognition, insight, reframe, action
    - gita_verses_used: Count of verses used for context
    - model: AI model used
    - provider: "kiaan" indicating KIAAN ecosystem integration
    """
    negative_thought = payload.get("negative_thought", "")

    if not negative_thought.strip():
        raise HTTPException(status_code=400, detail="negative_thought is required")

    # Validate input length
    if len(negative_thought) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    try:
        # Use KIAAN Core with ardha_reframe context
        # This leverages the full KIAAN ecosystem: wisdom database, divine integration,
        # multi-provider support, offline fallback, and validated responses
        kiaan_response = await kiaan_core.get_kiaan_response(
            message=f"Help me reframe this negative thought: {negative_thought}",
            user_id=None,
            db=db,
            context="ardha_reframe",
            stream=False,
            language=None,
        )

        response_text = kiaan_response.get("response", "")
        verses_used = kiaan_response.get("verses_used", [])
        validation = kiaan_response.get("validation", {})
        model = kiaan_response.get("model", "gpt-4o-mini")

        # Parse the KIAAN response into structured Ardha format
        # KIAAN's ardha_reframe context produces a compassionate, structured response
        reframe_guidance = _parse_kiaan_to_ardha_format(response_text)

        logger.info(f"Ardha reframe via KIAAN - {len(verses_used)} verses used, valid: {validation.get('valid', True)}")

        return {
            "status": "success",
            "reframe_guidance": reframe_guidance,
            "gita_verses_used": len(verses_used),
            "raw_text": response_text,
            "model": model,
            "provider": "kiaan",
            "validation": validation,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Ardha reframe error: {e}")
        # Return graceful fallback
        return {
            "status": "error",
            "reframe_guidance": {
                "recognition": "I sense you're experiencing difficult thoughts right now. That weight is real.",
                "deep_insight": "Remember: thoughts are passing clouds in the vast sky of awareness. Your true self observes them without being defined by them.",
                "reframe": "This challenge is an invitation for growth. Each difficulty builds the inner strength that leads to lasting peace.",
                "small_action_step": "Take three deep breaths, then choose one small action that aligns with your values today.",
            },
            "gita_verses_used": 0,
            "raw_text": None,
            "model": "fallback",
            "provider": "kiaan",
            "error": str(e),
        }


def _parse_kiaan_to_ardha_format(response_text: str) -> dict[str, str]:
    """Parse KIAAN's narrative response into structured Ardha format.

    KIAAN produces a flowing, compassionate response. We extract the key elements
    that map to Ardha's 4-part structure:
    1. Recognition - Validating the feeling
    2. Deep Insight - The wisdom principle
    3. Reframe - The balanced perspective
    4. Small Action Step - One controllable action
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

    # Map sections to Ardha format
    # KIAAN's sacred structure: Opening → Acknowledgment → Wisdom → Guidance → Closing
    if len(sections) >= 4:
        return {
            "recognition": sections[0] if len(sections) > 0 else "",
            "deep_insight": sections[1] if len(sections) > 1 else "",
            "reframe": sections[2] if len(sections) > 2 else "",
            "small_action_step": sections[3] if len(sections) > 3 else "",
        }
    elif len(sections) == 3:
        return {
            "recognition": sections[0],
            "deep_insight": sections[1],
            "reframe": sections[2],
            "small_action_step": "Take a moment to breathe and let this wisdom settle into your heart.",
        }
    elif len(sections) == 2:
        return {
            "recognition": sections[0],
            "deep_insight": "",
            "reframe": sections[1],
            "small_action_step": "Take a moment to breathe and let this wisdom settle into your heart.",
        }
    elif len(sections) == 1:
        # Single paragraph response - use it as the main reframe
        return {
            "recognition": "I hear you, and I'm here with you.",
            "deep_insight": "",
            "reframe": sections[0],
            "small_action_step": "Take a moment to breathe and let this wisdom settle into your heart.",
        }
    else:
        # Fallback for empty response
        return {
            "recognition": "I sense you're experiencing difficult thoughts right now.",
            "deep_insight": "Your thoughts are clouds; your true self is the vast, unchanging sky.",
            "reframe": "This moment of difficulty is an opportunity for growth and deeper understanding.",
            "small_action_step": "Take three deep breaths and choose one small action aligned with your values.",
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
