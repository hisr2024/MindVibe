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
    """Comprehensive fallback when WellnessModel is unavailable - Ancient Wisdom style."""
    worry_snippet = outcome_worry[:50] + "..." if len(outcome_worry) > 50 else outcome_worry
    return {
        "status": "success",
        "detachment_guidance": {
            "honoring_pain": f"Dear friend, I truly see you in this moment. This worry about '{worry_snippet}' - it weighs on your heart like a stone. Your anxiety is not weakness; it reveals how deeply you care about the outcome. In acknowledging this weight, you have already taken the first step on the path of wisdom. You are not alone.",
            "understanding_attachment": "Ancient wisdom teaches us that suffering arises not from outcomes themselves, but from our attachment to them. Your mind has become entangled with a future that hasn't yet unfolded - this is what the sages call 'phala-sakti' (attachment to fruits). While this attachment is profoundly human, it is also the very root of your unease. When we bind our peace to things we cannot control, we create our own suffering.",
            "karma_yoga_liberation": "The timeless wisdom of Karma Yoga offers profound liberation: 'Karmanye vadhikaraste, ma phaleshu kadachana' - You have the right to your actions alone, never to their fruits. This is not passive resignation, but active surrender. Imagine an archer who draws the bow with complete focus, aims with full presence, and releases the arrow with perfect technique. Once released, the arrow's path is no longer the archer's to control. The archer's dharma was in the drawing, the aiming, the releasing - not in where the arrow lands.",
            "deeper_truth": "Here is the profound truth that ancient wisdom reveals: You are not your achievements. You are not your failures. Your essential worth was never meant to be measured by outcomes - it is eternal, unchanging, and already complete. The universe responds not to your ability to control what was never yours to control, but to the purity of your intention (sankalpa) and the sincerity of your effort (prayatna). When you act from this place, success and failure become equal - both teachers, both blessings.",
            "practical_wisdom": "Today, try this sacred practice: Before taking any action related to this worry, pause. Place your hand on your heart. Take three slow breaths. Then say to yourself: 'I offer my best effort as an act of devotion. The result belongs to the universe.' Now act with complete presence, as if the action itself is the reward. This is nishkama karma - desireless action - the highest form of spiritual practice in daily life.",
            "witness_consciousness": "Ancient wisdom teaches us to cultivate 'sakshi bhava' - witness consciousness. Step back from this worry and observe: 'I am having thoughts about outcomes.' Notice how the worry rises, stays for a moment, and dissolves. You are not the worry; you are the awareness that witnesses it. This unchanging awareness is your true nature - vast, peaceful, and untouched by any outcome.",
            "eternal_anchor": "Carry this eternal truth with you: You are already complete, exactly as you are, regardless of any outcome. The anxious mind will return with its questions about the future - and when it does, remind yourself: 'I cannot lose what I truly am.' Your inner light cannot be dimmed by success or failure. You are the sky; outcomes are merely clouds passing through. 💙",
        },
        "response": f"Dear friend, I truly see you in this moment. This worry about '{worry_snippet}' weighs on your heart like a stone. Your anxiety is not weakness; it reveals how deeply you care. You are not alone.\n\nAncient wisdom teaches us that suffering arises not from outcomes themselves, but from our attachment to them. Your mind has become entangled with a future that hasn't yet unfolded - this is what the sages call 'phala-sakti' (attachment to fruits). While profoundly human, this attachment is the root of your unease.\n\nThe timeless wisdom of Karma Yoga offers profound liberation: 'Karmanye vadhikaraste, ma phaleshu kadachana' - You have the right to your actions alone, never to their fruits. Imagine an archer who draws the bow with complete focus and releases with perfect technique. Once released, the arrow's path is no longer the archer's to control. The archer's dharma was in the action itself.\n\nHere is the profound truth: You are not your achievements or failures. Your essential worth is eternal and already complete. The universe responds to the purity of your intention and the sincerity of your effort - not to your ability to control outcomes.\n\nToday, try this sacred practice: Before acting, pause. Take three breaths. Say: 'I offer my best effort as devotion. The result belongs to the universe.' Then act with complete presence, as if the action itself is the reward. This is nishkama karma - desireless action.\n\nAncient wisdom also teaches 'sakshi bhava' - witness consciousness. Observe your worry from a distance: 'I am having thoughts about outcomes.' You are not the worry; you are the awareness witnessing it.\n\nCarry this eternal truth: You are already complete, regardless of any outcome. Your inner light cannot be dimmed. You are the sky; outcomes are merely clouds passing through. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def viyoga_health():
    """Health check."""
    return {"status": "ok", "service": "viyoga", "provider": "kiaan"}
