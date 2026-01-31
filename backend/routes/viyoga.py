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
    """Divine fallback when KIAAN is unavailable."""
    worry_snippet = outcome_worry[:50] + "..." if len(outcome_worry) > 50 else outcome_worry
    return {
        "status": "success",
        "detachment_guidance": {
            "soul_acknowledgment": f"Dear friend, I feel the weight you're carrying. This worry about '{worry_snippet}' - it sits heavy on your heart, and I want you to know: your anxiety is not weakness. It shows how deeply you care. You are not alone in this moment.",
            "root_of_suffering": "Let me share something I've learned on this path: when we bind our peace to outcomes we cannot control, we create our own suffering. Your mind has become entangled with a future that hasn't happened yet, and this attachment - while natural - is the very source of your unease.",
            "karma_yoga_wisdom": "Ancient wisdom offers us a profound liberation: 'Your right is to action alone, never to its fruits.' This is karma yoga - the sacred art of doing your absolute best while surrendering the outcome. Imagine pouring your whole heart into your effort, then releasing the result like an archer releasing an arrow. Once released, the arrow's path is no longer yours to control.",
            "spiritual_insight": "Here is the deeper truth: you are not your achievements or failures. Your worth was never meant to be measured by outcomes. The universe responds to the purity of your intention and the sincerity of your effort - not to your ability to control what was never yours to control.",
            "practical_action": "Today, try this practice: Before taking any action related to this worry, pause. Take a breath. Say to yourself: 'I offer my best effort. The result belongs to the universe.' Then act with full presence, as if the action itself is the reward.",
            "eternal_anchor": "Carry this truth with you: You are already complete, exactly as you are, regardless of any outcome. When the anxiety returns, remember - you cannot lose what you truly are.",
        },
        "response": f"Dear friend, I feel the weight you're carrying. This worry sits heavy on your heart, and I want you to know: your anxiety is not weakness. It shows how deeply you care. You are not alone in this moment.\n\nLet me share something I've learned: when we bind our peace to outcomes we cannot control, we create our own suffering. Your mind has become entangled with a future that hasn't happened yet. This attachment - while natural - is the very source of your unease.\n\nAncient wisdom offers profound liberation: 'Your right is to action alone, never to its fruits.' This is karma yoga - the sacred art of doing your absolute best while surrendering the outcome. Imagine pouring your whole heart into your effort, then releasing the result like an archer releasing an arrow.\n\nHere is the deeper truth: you are not your achievements or failures. Your worth was never meant to be measured by outcomes. The universe responds to the purity of your intention and the sincerity of your effort.\n\nToday, try this: Before acting on this worry, pause. Breathe. Say: 'I offer my best effort. The result belongs to the universe.' Then act with full presence, as if the action itself is the reward.\n\nCarry this truth: You are already complete, exactly as you are, regardless of any outcome. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def viyoga_health():
    """Health check."""
    return {"status": "ok", "service": "viyoga", "provider": "kiaan"}
