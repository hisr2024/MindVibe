"""Ardha Reframing Assistant - KIAAN AI Integration (WellnessModel Pattern).

This router provides cognitive reframing using the unified WellnessModel:
Question → Understanding → Bhagavad Gita-grounded Answer

Ardha focuses on sthitaprajna (steady wisdom) principles for thought transformation.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.wellness_model import WellnessModel, WellnessTool, get_wellness_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ardha", tags=["ardha"])

# Initialize WellnessModel
wellness_model: WellnessModel | None = None
try:
    wellness_model = get_wellness_model()
    logger.info("✅ Ardha: WellnessModel initialized")
except Exception as e:
    logger.warning(f"⚠️ Ardha: WellnessModel unavailable: {e}")


@router.post("/reframe")
async def reframe_thought(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate cognitive reframing using the unified WellnessModel.

    Pattern: Question → Understanding → Bhagavad Gita-grounded Answer

    1. Receive user's negative thought
    2. Fetch relevant Gita verses (sthitaprajna focus)
    3. Generate warm, friendly, Gita-rooted response
    """
    negative_thought = payload.get("negative_thought", "")

    if not negative_thought.strip():
        raise HTTPException(status_code=400, detail="negative_thought is required")

    if len(negative_thought) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if not wellness_model:
        logger.error("Ardha: WellnessModel not initialized")
        return _get_fallback_response(negative_thought)

    try:
        # Use the unified WellnessModel
        result = await wellness_model.generate_response(
            tool=WellnessTool.ARDHA,
            user_input=negative_thought,
            db=db,
        )

        return {
            "status": "success",
            "reframe_guidance": result.sections,
            "raw_text": result.content,
            "gita_verses_used": result.gita_verses_used,
            "model": result.model,
            "provider": result.provider,
        }

    except Exception as e:
        logger.exception(f"Ardha error: {e}")
        return _get_fallback_response(negative_thought)


def _get_fallback_response(negative_thought: str) -> dict[str, Any]:
    """Fallback when WellnessModel is unavailable."""
    thought_snippet = negative_thought[:50] + "..." if len(negative_thought) > 50 else negative_thought
    return {
        "status": "success",
        "reframe_guidance": {
            "recognition": f"I hear you. This thought - '{thought_snippet}' - it's heavy. And it's okay that you're struggling with it.",
            "deep_insight": "Here's the thing about thoughts: they feel like absolute truth, especially the painful ones. But thoughts aren't facts. They're just your mind trying to make sense of things.",
            "reframe": "Try this: you're not your thoughts. You're the one noticing them. Like clouds drifting across a big sky - the clouds come and go, but the sky is always there, always okay.",
            "small_action_step": "Right now, take one slow breath. Then ask yourself: what would you say to a friend who told you they had this same thought?",
        },
        "raw_text": f"I hear you. This thought you're carrying - it's heavy. And it makes sense that it's getting to you.\n\nHere's something that might help: thoughts feel like absolute truth, especially the painful ones. But thoughts aren't facts. They're just your mind trying to make sense of things, often in the hardest possible way.\n\nTry this perspective: you're not your thoughts. You're the one noticing them. Like clouds drifting across a big sky - the clouds come and go, but the sky is always there, always okay. That sky is you.\n\nRight now, take one slow breath. Then ask yourself: what would you say to a friend who told you they had this same thought? We often have gentler words for others than we give ourselves. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def ardha_health():
    """Health check."""
    return {"status": "ok", "service": "ardha", "provider": "kiaan"}
