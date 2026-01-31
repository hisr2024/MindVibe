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
            "honoring_pain": f"Dear friend, I truly see you. This thought - '{thought_snippet}' - it sits in your mind like a heavy stone. The pain it creates is real, and I want you to know: your struggle with this thought is not weakness. It takes courage to look at our dark thoughts instead of running from them. You are not alone in this moment.",
            "nature_of_thought": "Let me share something profound: thoughts feel like absolute truth, especially the painful ones. But here is what the ancient wisdom teaches - thoughts are not facts. They are vritti, fluctuations of the mind, interpretations created by a mind that is trying to protect you. The mind, when in pain, often tells us the harshest possible story.",
            "witness_consciousness": "Here is the most liberating truth I can offer you: You are not your thoughts. You are the awareness that notices thoughts. Imagine a vast, clear sky. Thoughts are like clouds passing through - some dark and heavy, some light. But the sky itself? It remains unchanged, untouched, infinitely spacious. That sky - that unchanging witness - that is who you truly are. The clouds cannot harm the sky.",
            "balanced_perspective": "Now, let's gently examine this thought together. What if this thought is not the complete picture? What might ALSO be true? If someone you deeply loved came to you with this exact thought, what gentle words would you offer them? Those words - you deserve to hear them too.",
            "emotion_underneath": "Beneath this thought, there is a feeling - perhaps fear, shame, grief, or anger. Whatever it is, know this: emotions are visitors, not permanent residents. They arise, they stay for a while, and they pass. This too shall pass - not as empty comfort, but as truth. All phenomena arise and dissolve.",
            "practical_anchor": "When this thought returns, try this: Instead of 'I think...' say 'I notice I'm having the thought that...' This small shift moves you from inside the thought to the position of the witness. Then take three slow breaths and gently ask: 'Who is noticing this thought?' Rest in that awareness.",
            "eternal_truth": "Carry this with you: Your inner light cannot be dimmed by any thought. Thoughts are weather. You are the sky. Whatever storms pass through your mind, your essential nature remains whole, peaceful, and radiant.",
        },
        "raw_text": f"Dear friend, I truly see you. This thought sits in your mind like a heavy stone. The pain it creates is real, and I want you to know: your struggle is not weakness. It takes courage to look at our dark thoughts.\n\nLet me share something profound: thoughts feel like absolute truth, especially the painful ones. But thoughts are not facts. They are vritti - fluctuations of the mind, interpretations created by a mind trying to protect you.\n\nHere is the most liberating truth: You are not your thoughts. You are the awareness that notices thoughts. Imagine a vast, clear sky. Thoughts are like clouds passing through - some dark, some light. But the sky itself remains unchanged, untouched, infinitely spacious. That sky - that unchanging witness - that is who you truly are.\n\nLet's gently examine this thought. What might ALSO be true? If someone you loved came to you with this exact thought, what gentle words would you offer them? Those words - you deserve to hear them too.\n\nBeneath this thought is a feeling - perhaps fear, shame, grief. Know this: emotions are visitors, not permanent residents. This too shall pass.\n\nWhen this thought returns, try this: Instead of 'I think...' say 'I notice I'm having the thought that...' This small shift moves you to the position of the witness. Then breathe and ask: 'Who is noticing this thought?'\n\nYour inner light cannot be dimmed by any thought. Thoughts are weather. You are the sky. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def ardha_health():
    """Health check."""
    return {"status": "ok", "service": "ardha", "provider": "kiaan"}
