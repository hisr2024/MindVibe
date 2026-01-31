"""Ardha Reframing Assistant - KIAAN AI Integration (WellnessModel Pattern v2.0).

ENHANCED VERSION with Multi-Provider AI + Psychological Analysis

This router provides cognitive reframing using the enhanced WellnessModel:
Question → Psychological Analysis → Gita Wisdom → Comprehensive Solution

Ardha focuses on sthitaprajna (steady wisdom) principles + CBT cognitive restructuring.

ANALYSIS MODES:
- standard: Quick 4-section reframe with cognitive pattern detection
- deep_dive: Comprehensive analysis with root cause exploration, CBT integration, multi-perspective reframing
- quantum_dive: Multi-dimensional analysis across emotional, cognitive, relational, physical, and spiritual dimensions

ENHANCEMENTS (v2.0):
- Multi-provider AI (OpenAI + Sarvam with automatic fallback)
- Cognitive distortion detection (CBT framework)
- Behavioral pattern analysis
- Psychological framework integration
- Multi-language support
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
    PsychologicalFramework,
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
    """Generate cognitive reframing using the enhanced WellnessModel v2.0.

    ENHANCED PATTERN:
    Question → Psychological Analysis → Gita Wisdom → Comprehensive Solution

    1. Receive user's negative thought/problem
    2. Detect cognitive distortions and behavioral patterns (CBT framework)
    3. Determine analysis mode (standard, deep_dive, or quantum_dive)
    4. Fetch relevant Gita verses (sthitaprajna focus)
    5. Generate response blending psychology + Gita wisdom

    Request body:
        negative_thought: str - The thought or situation to reframe
        analysis_mode: str - One of "standard", "deep_dive", or "quantum_dive" (default: "standard")
        language: str - Optional language code (hi, ta, te, etc.)

    Returns:
        - reframe_guidance: Structured sections based on analysis mode
        - cognitive_insights: Detected cognitive distortions and Gita remedies
        - behavioral_patterns: Identified behavioral tendencies
        - psychological_framework: CBT (Cognitive Behavioral Therapy)
        - gita_verses_used: Number of verses incorporated
        - model/provider: AI model and provider used
    """
    negative_thought = payload.get("negative_thought", "")
    analysis_mode_str = payload.get("analysis_mode", "standard")
    language = payload.get("language")

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
        # Detect cognitive distortions (v2.0 enhancement)
        cognitive_distortions = PsychologicalFramework.detect_cognitive_distortions(negative_thought)
        behavioral_patterns = PsychologicalFramework.detect_behavioral_patterns(negative_thought)

        # Use the enhanced WellnessModel with analysis mode
        result = await wellness_model.generate_response(
            tool=WellnessTool.ARDHA,
            user_input=negative_thought,
            db=db,
            analysis_mode=analysis_mode,
            language=language,
        )

        # Build enhanced response
        response = {
            "status": "success",
            "reframe_guidance": result.sections,
            "raw_text": result.content,
            "gita_verses_used": result.gita_verses_used,
            "model": result.model,
            "provider": result.provider,
            "analysis_mode": result.analysis_mode,
            # Enhanced v2.0 fields
            "psychological_framework": result.psychological_framework or "Cognitive Behavioral Therapy (CBT)",
            "cognitive_insights": {
                "distortions_detected": [
                    {
                        "name": d["distortion"],
                        "pattern": d["pattern"],
                        "gita_remedy": d["gita_remedy"],
                    }
                    for d in cognitive_distortions[:3]
                ],
                "total_distortions": len(cognitive_distortions),
            },
            "behavioral_patterns": behavioral_patterns,
            "cached": result.cached,
            "latency_ms": result.latency_ms,
        }

        logger.info(
            f"✅ Ardha reframe: {analysis_mode.value} mode, "
            f"{len(cognitive_distortions)} distortions detected, "
            f"{result.gita_verses_used} verses used"
        )

        return response

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
