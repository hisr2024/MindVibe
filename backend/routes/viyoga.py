"""Viyoga Detachment Coach - KIAAN AI Integration (WellnessModel Pattern).

This router provides outcome anxiety reduction using the unified WellnessModel:
Question → Understanding → Bhagavad Gita-grounded Answer

Viyoga focuses on karma yoga principles for detachment from outcomes.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.wellness_model import WellnessModel, WellnessTool, get_wellness_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/viyoga", tags=["viyoga"])

# Initialize WellnessModel
wellness_model: WellnessModel | None = None
try:
    wellness_model = get_wellness_model()
    logger.info("✅ Viyoga: WellnessModel initialized")
except Exception as e:
    logger.warning(f"⚠️ Viyoga: WellnessModel unavailable: {e}")


@router.post("/detach")
async def detach_from_outcome(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate detachment guidance using the unified WellnessModel.

    Pattern: Question → Understanding → Bhagavad Gita-grounded Answer

    1. Receive user's outcome worry
    2. Fetch relevant Gita verses (karma yoga focus)
    3. Generate warm, friendly, Gita-rooted response
    """
    outcome_worry = payload.get("outcome_worry", "")

    if not outcome_worry.strip():
        raise HTTPException(status_code=400, detail="outcome_worry is required")

    if len(outcome_worry) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if not wellness_model:
        logger.error("Viyoga: WellnessModel not initialized")
        return _get_fallback_response(outcome_worry)

    try:
        # Use the unified WellnessModel
        result = await wellness_model.generate_response(
            tool=WellnessTool.VIYOGA,
            user_input=outcome_worry,
            db=db,
        )

        return {
            "status": "success",
            "detachment_guidance": result.sections,
            "response": result.content,
            "gita_verses_used": result.gita_verses_used,
            "model": result.model,
            "provider": result.provider,
        }

    except Exception as e:
        logger.exception(f"Viyoga error: {e}")
        return _get_fallback_response(outcome_worry)


def _get_fallback_response(outcome_worry: str) -> dict[str, Any]:
    """Fallback when KIAAN is unavailable."""
    worry_snippet = outcome_worry[:50] + "..." if len(outcome_worry) > 50 else outcome_worry
    return {
        "status": "success",
        "detachment_guidance": {
            "validation": f"I really hear you - this worry about '{worry_snippet}' is heavy. It's okay to feel this way.",
            "attachment_check": "Here's what I notice: your peace right now depends on how this turns out. And that's a tough place to be, because outcomes aren't fully in our hands.",
            "detachment_principle": "What if you could give your best effort AND feel okay regardless of what happens? You can only control what you do - not the result. That's actually freeing.",
            "one_action": "Today, pick one small thing you can do about this. Do it with your full attention. Then take a breath and remind yourself: you did what you could.",
        },
        "response": f"I really hear you - this worry is heavy, and it makes sense that you're feeling it.\n\nHere's what I notice: your peace right now depends on how this turns out. And that's a tough place to be, because outcomes aren't fully in our hands.\n\nBut here's something that might help: what if you could give your best effort AND feel okay regardless of what happens? You can only control what you do - not the result. That's actually freeing when you let it sink in.\n\nToday, pick one small thing you can do about this situation. Do it with your full attention. Then take a breath and remind yourself: you did what you could. The rest isn't yours to carry. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def viyoga_health():
    """Health check."""
    return {"status": "ok", "service": "viyoga", "provider": "kiaan"}
