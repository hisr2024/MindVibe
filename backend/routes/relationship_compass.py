"""Relationship Compass - KIAAN AI Ecosystem Integration.

This router provides relationship conflict navigation powered by KIAAN Core
and the complete 700-verse Bhagavad Gita wisdom database.

Part of the KIAAN AI Ecosystem alongside:
- Ardha (Reframing Engine)
- Viyoga (Detachment Coach)
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

router = APIRouter(prefix="/api/relationship-compass", tags=["relationship-compass"])


@router.post("/guide")
async def get_relationship_guidance(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate relationship navigation guidance through KIAAN AI with Gita wisdom.

    Uses the KIAAN Core engine with "relationship_compass" context for specialized
    conflict resolution rooted in dharma (right action) and daya (compassion).

    Expects payload with:
    - conflict: The relationship conflict or challenge description

    Returns structured JSON with:
    - status: success/error
    - compass_guidance: Structured response with 8 navigation points
    - gita_verses_used: Count of verses used for context
    - model: AI model used
    - provider: "kiaan" indicating KIAAN ecosystem integration
    """
    conflict = payload.get("conflict", "")

    if not conflict.strip():
        raise HTTPException(status_code=400, detail="conflict is required")

    # Validate input length
    if len(conflict) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    try:
        # Use KIAAN Core with relationship_compass context
        # This leverages the full KIAAN ecosystem: wisdom database, divine integration,
        # multi-provider support, offline fallback, and validated responses
        kiaan_response = await kiaan_core.get_kiaan_response(
            message=f"Help me navigate this relationship challenge with wisdom and compassion: {conflict}",
            user_id=None,
            db=db,
            context="relationship_compass",
            stream=False,
            language=None,
        )

        response_text = kiaan_response.get("response", "")
        verses_used = kiaan_response.get("verses_used", [])
        validation = kiaan_response.get("validation", {})
        model = kiaan_response.get("model", "gpt-4o-mini")

        # Parse the KIAAN response into structured Compass format
        compass_guidance = _parse_kiaan_to_compass_format(response_text)

        logger.info(f"Relationship Compass via KIAAN - {len(verses_used)} verses used, valid: {validation.get('valid', True)}")

        return {
            "status": "success",
            "compass_guidance": compass_guidance,
            "response": response_text,  # Full response for display
            "gita_verses_used": len(verses_used),
            "model": model,
            "provider": "kiaan",
            "validation": validation,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Relationship Compass error: {e}")
        # Return graceful fallback
        return {
            "status": "error",
            "compass_guidance": {
                "acknowledgment": "I sense the weight of this relationship challenge you're carrying.",
                "ego_check": "In moments of conflict, the ego seeks to win. But true strength lies in understanding.",
                "values_identification": "Consider what matters most to you: respect, honesty, peace, connection.",
                "right_action": "Right action (dharma) in relationships means being honest while remaining kind.",
                "detachment_suggestion": "Release the need to be right. Focus on being present and compassionate.",
                "compassion_perspective": "The other person is also struggling in their own way. See their humanity.",
                "communication_pattern": "Try: 'I feel... when... because... I need...' This invites dialogue, not defense.",
                "next_step": "Before responding, take three breaths and ask yourself: 'What would love do here?'",
            },
            "response": None,
            "gita_verses_used": 0,
            "model": "fallback",
            "provider": "kiaan",
            "error": str(e),
        }


def _parse_kiaan_to_compass_format(response_text: str) -> dict[str, str]:
    """Parse KIAAN's narrative response into structured Compass format.

    KIAAN produces a flowing, compassionate response. We extract the key elements
    that map to Relationship Compass's 8-part structure:
    1. Acknowledgment - Recognize the conflict's weight
    2. Ego Check - Separate emotions from ego impulses
    3. Values Identification - What the user truly wants
    4. Right Action - Dharma-based guidance
    5. Detachment Suggestion - Ego-detachment practices
    6. Compassion Perspective - Understanding the other side
    7. Communication Pattern - Non-reactive communication
    8. Next Step - One controllable action
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

    # Map sections to Compass format
    # KIAAN's response is structured but flowing - we map key elements
    if len(sections) >= 5:
        return {
            "acknowledgment": sections[0] if len(sections) > 0 else "",
            "ego_check": sections[1] if len(sections) > 1 else "",
            "values_identification": "",  # Embedded in KIAAN's wisdom
            "right_action": sections[2] if len(sections) > 2 else "",
            "detachment_suggestion": "",  # Embedded in KIAAN's wisdom
            "compassion_perspective": sections[3] if len(sections) > 3 else "",
            "communication_pattern": "",  # Embedded in KIAAN's wisdom
            "next_step": sections[4] if len(sections) > 4 else "",
        }
    elif len(sections) >= 3:
        return {
            "acknowledgment": sections[0],
            "ego_check": "",
            "values_identification": "",
            "right_action": sections[1],
            "detachment_suggestion": "",
            "compassion_perspective": "",
            "communication_pattern": "",
            "next_step": sections[2],
        }
    elif len(sections) >= 1:
        return {
            "acknowledgment": "I hear the weight of this relationship challenge.",
            "ego_check": "",
            "values_identification": "",
            "right_action": sections[0] if sections else "",
            "detachment_suggestion": "",
            "compassion_perspective": "",
            "communication_pattern": "",
            "next_step": "Take three breaths before responding, and ask yourself: 'What would love do here?'",
        }
    else:
        # Fallback for empty response
        return {
            "acknowledgment": "I sense the weight of this relationship challenge.",
            "ego_check": "In conflict, the ego seeks to win. True strength lies in understanding.",
            "values_identification": "Consider what matters most: respect, honesty, peace, connection.",
            "right_action": "Right action means being honest while remaining kind.",
            "detachment_suggestion": "Release the need to be right. Focus on being present.",
            "compassion_perspective": "The other person is also struggling. See their humanity.",
            "communication_pattern": "Try: 'I feel... when... because... I need...'",
            "next_step": "Before responding, take three breaths and ask: 'What would love do here?'",
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
