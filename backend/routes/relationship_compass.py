"""Relationship Compass - KIAAN AI Integration (WellnessModel Pattern).

This router provides relationship conflict navigation using the unified WellnessModel:
Question → Understanding → Bhagavad Gita-grounded Answer

Relationship Compass focuses on dharma (right action) and daya (compassion) principles.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.wellness_model import WellnessModel, WellnessTool, get_wellness_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/relationship-compass", tags=["relationship-compass"])

# Initialize WellnessModel
wellness_model: WellnessModel | None = None
try:
    wellness_model = get_wellness_model()
    logger.info("✅ Relationship Compass: WellnessModel initialized")
except Exception as e:
    logger.warning(f"⚠️ Relationship Compass: WellnessModel unavailable: {e}")


@router.post("/guide")
async def get_relationship_guidance(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate relationship guidance using the unified WellnessModel.

    Pattern: Question → Understanding → Bhagavad Gita-grounded Answer

    1. Receive user's relationship conflict
    2. Fetch relevant Gita verses (dharma/compassion focus)
    3. Generate warm, friendly, Gita-rooted response
    """
    conflict = payload.get("conflict", "")

    if not conflict.strip():
        raise HTTPException(status_code=400, detail="conflict is required")

    if len(conflict) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if not wellness_model:
        logger.error("Relationship Compass: WellnessModel not initialized")
        return _get_fallback_response(conflict)

    try:
        # Use the unified WellnessModel
        result = await wellness_model.generate_response(
            tool=WellnessTool.RELATIONSHIP_COMPASS,
            user_input=conflict,
            db=db,
        )

        return {
            "status": "success",
            "compass_guidance": result.sections,
            "response": result.content,
            "gita_verses_used": result.gita_verses_used,
            "model": result.model,
            "provider": result.provider,
        }

    except Exception as e:
        logger.exception(f"Relationship Compass error: {e}")
        return _get_fallback_response(conflict)


def _get_fallback_response(conflict: str) -> dict[str, Any]:
    """Fallback when WellnessModel is unavailable."""
    conflict_snippet = conflict[:50] + "..." if len(conflict) > 50 else conflict
    return {
        "status": "success",
        "compass_guidance": {
            "acknowledgment": f"I hear you - this situation with '{conflict_snippet}' is really weighing on you. Relationship struggles hit deep.",
            "underneath": "Here's what I've noticed about conflict: underneath, there's usually an unmet need - to feel heard, respected, or understood. What do you really need here?",
            "clarity": "Doing the right thing doesn't mean winning. It means being honest AND kind - even when that's hard.",
            "path_forward": "Try this: 'I feel [emotion] when [situation] because [what I need]. What I'm hoping for is [request].' It opens doors instead of closing them.",
            "reminder": "When emotions run high, remember: the goal isn't to be right. It's to understand and be understood. That's where peace lives.",
        },
        "response": f"I hear you. This situation is weighing on you, and relationship struggles hit deep.\n\nHere's what I've noticed about conflict: underneath the arguments and hurt feelings, there's usually an unmet need - to feel heard, respected, or truly understood. Take a moment: what do you really need here? Not what you want them to do or say, but what you actually need.\n\nDoing the right thing in relationships doesn't mean winning. It means being honest AND kind - even when that's really hard.\n\nWhen you're ready, try this: 'I feel [your emotion] when [the situation] because [what you need]. What I'm hoping for is [your request].' It opens doors instead of closing them.\n\nAnd when emotions run high, remember: the goal isn't to be right. It's to understand and be understood. That's where peace lives. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def relationship_compass_health():
    """Health check."""
    return {"status": "ok", "service": "relationship-compass", "provider": "kiaan"}
