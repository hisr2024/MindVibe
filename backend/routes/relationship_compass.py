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
            "witnessing_pain": f"Dear friend, I truly feel the weight you're carrying. This situation - '{conflict_snippet}' - touches one of the deepest sources of human pain: our relationships with those we care about. Your heart is hurting, and that pain is completely valid. I want you to know: you are not alone in this struggle, and seeking clarity is itself an act of courage.",
            "your_perspective": "Let's gently explore what's happening within you. Beneath the hurt, what do you really need here? To be seen? Heard? Respected? Valued? Our conflicts often mask deeper longings. And what fears might be present? The fear of losing this connection? Of not being enough? Of being taken for granted? Understanding our own depths is the first step toward clarity.",
            "other_perspective": "Now, with compassion (not excuse-making), let's consider the other person. They too are a soul navigating their own fears and wounds. What might they be experiencing that you cannot see? What unmet needs might be driving their behavior? 'Hurt people hurt people' - this doesn't excuse harm, but it helps us see that their actions may come from their own suffering, not malice toward you.",
            "dharma_path": "Ancient wisdom teaches us dharma - the path of righteous action. In relationships, dharma is not about winning or being right. It's about acting from your highest self, even when the other doesn't. The formula is satya (truth) + ahimsa (non-harm) = speaking your truth without cruelty. Ask yourself: 'What would my wisest, most loving self do here - not my wounded self, not my ego?'",
            "ego_illumination": "Here is a gentle truth: our ego often disguises itself as righteous hurt. The ego asks: 'How can I be right?' The soul asks: 'How can I be at peace?' True strength is not dominance - it's the courage to be vulnerable, to seek understanding before demanding to be understood. Releasing the need to 'win' is not weakness - it is liberation.",
            "practical_action": "When you're ready, try this approach: 'I feel [your emotion] when [the situation] because [what you need]. What I'm hoping for is [your specific request].' This opens doors instead of closing them. And in moments when emotions surge, pause, take a breath, and ask: 'What would love do here?' You can only control your own actions - let that be enough.",
            "forgiveness_wisdom": "If forgiveness is relevant here, know this: kshama (forgiveness) is not saying what happened was okay. It is releasing the poison you drink hoping the other person suffers. Forgiveness is a gift to yourself - freedom from carrying the burden. It doesn't require them to apologize or change. Sometimes letting go is the bravest act of love - for yourself.",
            "eternal_anchor": "Carry this truth with you: Your peace is not dependent on another person's behavior. You are complete within yourself, even as you navigate connection with another. Whatever happens in this relationship, your worth remains unchanged. The goal is not to be right - it is to find your own center, your own peace, your own highest path.",
        },
        "response": f"Dear friend, I truly feel the weight you're carrying. Relationship pain touches one of the deepest sources of human suffering. Your heart is hurting, and that pain is completely valid. You are not alone.\n\nLet's gently explore what's beneath this. What do you really need here? To be seen? Heard? Respected? Our conflicts often mask deeper longings. And what fears are present? Understanding our own depths is the first step toward clarity.\n\nNow, with compassion, consider the other person. They too are navigating their own fears and wounds. What might they be experiencing? 'Hurt people hurt people' - this doesn't excuse harm, but helps us see that their actions may come from their own suffering.\n\nAncient wisdom teaches dharma - acting from your highest self, even when the other doesn't. The formula: speak truth without cruelty. Ask yourself: 'What would my wisest, most loving self do here?'\n\nA gentle truth: our ego often disguises itself as righteous hurt. The ego asks: 'How can I be right?' The soul asks: 'How can I be at peace?' Releasing the need to 'win' is not weakness - it is liberation.\n\nWhen ready, try: 'I feel [emotion] when [situation] because [need]. What I'm hoping for is [request].' And in emotional moments, pause and ask: 'What would love do here?'\n\nIf forgiveness is relevant: kshama is not saying what happened was okay. It is releasing the poison you drink hoping the other suffers. Forgiveness is a gift to yourself.\n\nCarry this truth: Your peace is not dependent on another's behavior. You are complete within yourself. Whatever happens, your worth remains unchanged. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def relationship_compass_health():
    """Health check."""
    return {"status": "ok", "service": "relationship-compass", "provider": "kiaan"}
