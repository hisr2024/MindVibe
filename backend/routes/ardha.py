"""Ardha Reframing Assistant - KIAAN AI Integration (WellnessModel Pattern).

This router provides cognitive reframing using the unified WellnessModel:
Question → Understanding → Bhagavad Gita-grounded Answer

Ardha focuses on sthitaprajna (steady wisdom) principles for thought transformation.

ANALYSIS MODES:
- standard: Quick 4-section reframe (recognition, insight, reframe, action step)
- deep_dive: Comprehensive problem analysis with root cause exploration and multi-perspective reframing
- quantum_dive: Multi-dimensional analysis across emotional, cognitive, relational, physical, and spiritual dimensions
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.wellness_model import (
    AnalysisMode,
    WellnessModel,
    WellnessTool,
    get_wellness_model,
)

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

    1. Receive user's negative thought/problem
    2. Determine analysis mode (standard, deep_dive, or quantum_dive)
    3. Fetch relevant Gita verses (sthitaprajna focus)
    4. Generate warm, friendly, Gita-rooted response with appropriate depth

    Request body:
        negative_thought: str - The thought or situation to reframe
        analysis_mode: str - One of "standard", "deep_dive", or "quantum_dive" (default: "standard")

    Returns:
        - standard mode: 4 sections (recognition, deep_insight, reframe, small_action_step)
        - deep_dive mode: 6 sections (acknowledgment, root_cause_analysis, multi_perspective,
                                       comprehensive_reframe, solution_pathways, empowering_closure)
        - quantum_dive mode: 6 sections (sacred_witnessing, five_dimensional_analysis,
                                          root_pattern_archaeology, quantum_reframing,
                                          transformation_blueprint, life_purpose_integration)
    """
    negative_thought = payload.get("negative_thought", "")
    analysis_mode_str = payload.get("analysis_mode", "standard")

    if not negative_thought.strip():
        raise HTTPException(status_code=400, detail="negative_thought is required")

    if len(negative_thought) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    # Parse analysis mode
    try:
        analysis_mode = AnalysisMode(analysis_mode_str.lower())
    except ValueError:
        logger.warning(f"Invalid analysis_mode '{analysis_mode_str}', using standard")
        analysis_mode = AnalysisMode.STANDARD

    if not wellness_model:
        logger.error("Ardha: WellnessModel not initialized")
        return _get_fallback_response(negative_thought, analysis_mode)

    try:
        # Use the unified WellnessModel with analysis mode
        result = await wellness_model.generate_response(
            tool=WellnessTool.ARDHA,
            user_input=negative_thought,
            db=db,
            analysis_mode=analysis_mode,
        )

        return {
            "status": "success",
            "reframe_guidance": result.sections,
            "raw_text": result.content,
            "gita_verses_used": result.gita_verses_used,
            "model": result.model,
            "provider": result.provider,
            "analysis_mode": result.analysis_mode,
        }

    except Exception as e:
        logger.exception(f"Ardha error: {e}")
        return _get_fallback_response(negative_thought, analysis_mode)


def _get_fallback_response(
    negative_thought: str,
    analysis_mode: AnalysisMode = AnalysisMode.STANDARD
) -> dict[str, Any]:
    """Fallback when WellnessModel is unavailable.

    Provides mode-appropriate fallback responses for standard, deep_dive, and quantum_dive.
    """
    thought_snippet = negative_thought[:50] + "..." if len(negative_thought) > 50 else negative_thought
    thought_full = negative_thought[:100] + "..." if len(negative_thought) > 100 else negative_thought

    if analysis_mode == AnalysisMode.QUANTUM_DIVE:
        sections = {
            "sacred_witnessing": f"I bow to the depth of what you're bringing forward. This situation - \"{thought_snippet}\" - deserves to be truly seen and honored. The fact that you're willing to explore this so deeply shows remarkable self-awareness and courage.",
            "five_dimensional_analysis": "This challenge touches multiple dimensions of your life. EMOTIONAL: What feelings lie beneath - fear, grief, longing? COGNITIVE: What thought patterns repeat? RELATIONAL: How are you treating yourself through this? PHYSICAL: Where does this live in your body? SPIRITUAL: What might life be teaching you through this experience?",
            "root_pattern_archaeology": "This moment connects to deeper patterns. \"Samskara\" - the impressions that shape our reactions - formed long ago. When did you first learn to respond this way? The pattern once protected you. Now it may be ready to be released.",
            "quantum_reframing": "THE QUANTUM SHIFT: From \"I am this problem\" to \"I am the awareness witnessing this challenge.\" Your essence - \"atman\" - remains untouched by any circumstance. What if this thought were a cloud, and you were the vast sky?",
            "transformation_blueprint": f"PRACTICE: When \"{thought_snippet}\" arises, say: \"I notice I am having the thought that... I am the awareness noticing this thought. In this awareness, I am already at peace.\" Morning: Set intention to respond from wisdom. Evening: Reflect on one moment you responded from your new understanding.",
            "life_purpose_integration": "Every challenge, fully integrated, becomes a source of wisdom. \"Tapas\" - the fire of difficulty - is forging you into something stronger. You are not here to escape this challenge but to be transformed by engaging with it fully. You are held. You are whole.",
        }
        raw_text = "I bow to the depth of what you're bringing forward. This is sacred ground.\n\nThis challenge touches multiple dimensions - emotional, cognitive, relational, physical, and spiritual. Each dimension offers insight.\n\nThis pattern connects to deeper roots. Understanding the origin begins to dissolve the grip.\n\nTHE QUANTUM SHIFT: You are not this problem. You are the vast, unchanging awareness that witnesses all experience.\n\nPRACTICE: \"I notice I am having the thought that... I am the awareness noticing this thought.\"\n\nYou are held. You are whole. You are the infinite sky through which all weather passes. 💙"
    elif analysis_mode == AnalysisMode.DEEP_DIVE:
        sections = {
            "acknowledgment": f"I hear you completely. What you're experiencing - \"{thought_full}\" - is real and valid. The weight you're carrying deserves to be acknowledged. You're not alone in this struggle.",
            "root_cause_analysis": "Beneath the surface thought, there's often something deeper: core beliefs, unmet needs, old wounds being touched. The mind evolved for survival, not truth - it broadcasts worst-case scenarios. But thoughts are \"chitta-vritti\" - mental modifications, not facts.",
            "multi_perspective": "Your current view is valid, but what might a wise elder see? What would your healed future self say? What if there were evidence contradicting the harsh interpretation? Most suffering comes from seeing only one perspective.",
            "comprehensive_reframe": "THE REFRAME: You are not this thought - you are the awareness that notices it. \"Sakshi bhava\" - witness consciousness. The very fact that you can observe this thought proves you are separate from it. You are the vast sky; this thought is a passing cloud.",
            "solution_pathways": "PRACTICE: When this thought arises, say \"I notice I'm having the thought that...\" Take three slow breaths. Ask what you'd say to a friend with this same thought. You deserve that same gentleness.",
            "empowering_closure": "You are already whole. This challenge does not diminish your essential nature. \"Kutastha\" - like an anvil struck countless times, your true self remains unchanged. The clouds will pass. The sky remains.",
        }
        raw_text = "I hear you completely. What you're experiencing is real and valid.\n\nBeneath the surface, there's often something deeper: core beliefs, unmet needs, old wounds. The mind evolved for survival, not truth.\n\nMULTIPLE PERSPECTIVES: Your view is valid, but what might a wise elder see? What would your future self say?\n\nTHE REFRAME: You are not this thought - you are the awareness that notices it.\n\nPRACTICE: \"I notice I'm having the thought that...\" Take three slow breaths.\n\nYou are already whole. 💙"
    else:
        # Standard mode
        sections = {
            "recognition": f"I hear you. This thought - '{thought_snippet}' - it's heavy. And it's okay that you're struggling with it.",
            "deep_insight": "Thoughts feel like facts, especially the painful ones. But they're not. They're just your mind trying to make sense of things.",
            "reframe": "You're not your thoughts - you're the one noticing them. Like clouds passing through a big sky, this thought will pass.",
            "small_action_step": "Take one slow breath. Then ask yourself: what would you say to a friend with this same thought?",
        }
        raw_text = "I hear you. This thought you're carrying - it's heavy. And it makes sense that it's getting to you.\n\nHere's something that might help: thoughts feel like absolute truth, especially the painful ones. But thoughts aren't facts.\n\nTry this perspective: you're not your thoughts. You're the one noticing them. Like clouds drifting across a big sky - the clouds come and go, but the sky is always there, always okay. That sky is you.\n\nTake one slow breath. Then ask yourself: what would you say to a friend with this same thought? We often have gentler words for others than we give ourselves. 💙"

    return {
        "status": "success",
        "reframe_guidance": sections,
        "raw_text": raw_text,
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
        "analysis_mode": analysis_mode.value,
    }


@router.get("/health")
async def ardha_health():
    """Health check."""
    return {"status": "ok", "service": "ardha", "provider": "kiaan"}
