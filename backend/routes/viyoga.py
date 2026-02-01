"""Viyoga Detachment Coach - KIAAN AI Integration (WellnessModel Pattern v2.0).

ENHANCED VERSION with Multi-Provider AI + ACT Framework Integration

This router provides outcome anxiety reduction using the enhanced WellnessModel:
Question → ACT Analysis → Gita Wisdom → Comprehensive Liberation

Viyoga focuses on karma yoga principles + Acceptance & Commitment Therapy (ACT).

ANALYSIS MODES (NEW in v2.0):
- standard: Quick 6-section guidance with ACT process identification
- deep_dive: Comprehensive analysis with control-attachment mapping
- quantum_dive: Multi-dimensional exploration of outcome attachment patterns

ENHANCEMENTS (v2.0):
- Multi-provider AI (OpenAI + Sarvam with automatic fallback)
- ACT (Acceptance & Commitment Therapy) process integration
- Behavioral pattern analysis
- Attachment-to-outcome mapping
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

router = APIRouter(prefix="/api/viyoga", tags=["viyoga"])

# Initialize WellnessModel
wellness_model: WellnessModel | None = None
try:
    wellness_model = get_wellness_model()
    logger.info("✅ Viyoga v2.0: WellnessModel initialized with ACT integration")
except Exception as e:
    logger.warning(f"⚠️ Viyoga: WellnessModel unavailable: {e}")


@router.post("/detach")
async def detach_from_outcome(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate detachment guidance using the enhanced WellnessModel v2.0.

    ENHANCED PATTERN:
    Question → ACT Analysis → Gita Wisdom → Liberation Path

    1. Receive user's outcome worry
    2. Identify ACT processes relevant to their attachment (acceptance, defusion, values)
    3. Determine analysis mode (standard, deep_dive, or quantum_dive)
    4. Fetch relevant Gita verses (karma yoga focus)
    5. Generate response blending ACT + Gita wisdom

    Request body:
        outcome_worry: str - The outcome or result they're anxious about
        analysis_mode: str - One of "standard", "deep_dive", or "quantum_dive" (default: "standard")
        language: str - Optional language code (hi, ta, te, etc.)

    Returns:
        - detachment_guidance: Structured sections based on analysis mode
        - act_insights: Identified ACT processes with Gita parallels
        - attachment_analysis: Type of attachment pattern detected
        - psychological_framework: ACT (Acceptance & Commitment Therapy)
        - gita_verses_used: Number of verses incorporated
        - model/provider: AI model and provider used
    """
    outcome_worry = payload.get("outcome_worry", "")
    analysis_mode_str = payload.get("analysis_mode", "standard")
    language = payload.get("language")

    if not outcome_worry.strip():
        raise HTTPException(status_code=400, detail="outcome_worry is required")

    if len(outcome_worry) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    # Parse analysis mode (v2.0)
    try:
        analysis_mode = AnalysisMode(analysis_mode_str.lower())
    except ValueError:
        logger.warning(f"Invalid analysis_mode '{analysis_mode_str}', using standard")
        analysis_mode = AnalysisMode.STANDARD

    if not wellness_model:
        logger.error("Viyoga: WellnessModel not initialized")
        return _get_fallback_response(outcome_worry, analysis_mode)

    try:
        # ACT Analysis (v2.0 enhancement)
        attachment_analysis = _analyze_attachment_pattern(outcome_worry)
        act_guidance = PsychologicalFramework.get_act_guidance(attachment_analysis["type"])
        behavioral_patterns = PsychologicalFramework.detect_behavioral_patterns(outcome_worry)

        # Use the enhanced WellnessModel with analysis mode
        result = await wellness_model.generate_response(
            tool=WellnessTool.VIYOGA,
            user_input=outcome_worry,
            db=db,
            analysis_mode=analysis_mode,
            language=language,
        )

        # Build enhanced response
        response = {
            "status": "success",
            "detachment_guidance": result.sections,
            "response": result.content,
            "gita_verses_used": result.gita_verses_used,
            "model": result.model,
            "provider": result.provider,
            "analysis_mode": result.analysis_mode,
            # Enhanced v2.0 fields
            "psychological_framework": result.psychological_framework or "Acceptance & Commitment Therapy (ACT)",
            "act_insights": {
                "relevant_processes": [
                    {
                        "process": name,
                        "description": info.get("description", ""),
                        "gita_parallel": info.get("gita_parallel", ""),
                        "practice": info.get("practice", ""),
                    }
                    for name, info in act_guidance.items()
                ],
            },
            "attachment_analysis": attachment_analysis,
            "behavioral_patterns": behavioral_patterns,
            "cached": result.cached,
            "latency_ms": result.latency_ms,
        }

        logger.info(
            f"✅ Viyoga detach: {analysis_mode.value} mode, "
            f"attachment_type={attachment_analysis['type']}, "
            f"{result.gita_verses_used} verses used"
        )

        return response

    except Exception as e:
        logger.exception(f"Viyoga error: {e}")
        return _get_fallback_response(outcome_worry, analysis_mode)


def _analyze_attachment_pattern(outcome_worry: str) -> dict[str, Any]:
    """Analyze the type of outcome attachment pattern."""
    worry_lower = outcome_worry.lower()

    # Determine attachment type
    if any(w in worry_lower for w in ["control", "manage", "guarantee", "make sure"]):
        attachment_type = "control"
        description = "Attachment to controlling outcomes"
        gita_teaching = "Karmanye vadhikaraste - focus on action, not control of results"
    elif any(w in worry_lower for w in ["future", "what if", "might happen", "could go wrong"]):
        attachment_type = "future_worry"
        description = "Attachment to imagined future scenarios"
        gita_teaching = "Present moment awareness - the future is not here yet"
    elif any(w in worry_lower for w in ["need", "must have", "can't live without", "desperate"]):
        attachment_type = "outcome_dependency"
        description = "Identity or worth tied to specific outcome"
        gita_teaching = "Atma-tripti - you are already complete within yourself"
    elif any(w in worry_lower for w in ["perfect", "flawless", "no mistakes", "exactly right"]):
        attachment_type = "perfectionism"
        description = "Attachment to perfect outcomes"
        gita_teaching = "Samatva - equanimity in success and failure"
    elif any(w in worry_lower for w in ["approve", "think of me", "judge", "opinion"]):
        attachment_type = "approval_seeking"
        description = "Attachment to others' approval"
        gita_teaching = "Sthitaprajna - unmoved by praise or blame"
    else:
        attachment_type = "outcome_anxiety"
        description = "General anxiety about results"
        gita_teaching = "Nishkama karma - desireless action"

    return {
        "type": attachment_type,
        "description": description,
        "gita_teaching": gita_teaching,
    }


def _get_fallback_response(
    outcome_worry: str,
    analysis_mode: AnalysisMode = AnalysisMode.STANDARD
) -> dict[str, Any]:
    """Comprehensive fallback when WellnessModel is unavailable - Ancient Wisdom + ACT style."""
    worry_snippet = outcome_worry[:50] + "..." if len(outcome_worry) > 50 else outcome_worry

    # Analyze attachment pattern for fallback
    attachment_analysis = _analyze_attachment_pattern(outcome_worry)

    sections = {
        "honoring_pain": f"Dear friend, I truly see you in this moment. This worry about '{worry_snippet}' - it weighs on your heart like a stone. Your anxiety is not weakness; it reveals how deeply you care about the outcome. In acknowledging this weight, you have already taken the first step on the path of wisdom. You are not alone.",
        "understanding_attachment": "Ancient wisdom teaches us that suffering arises not from outcomes themselves, but from our attachment to them. Your mind has become entangled with a future that hasn't yet unfolded - this is what the sages call 'phala-sakti' (attachment to fruits). While this attachment is profoundly human, it is also the very root of your unease. When we bind our peace to things we cannot control, we create our own suffering.",
        "karma_yoga_liberation": "The timeless wisdom of Karma Yoga offers profound liberation: 'Karmanye vadhikaraste, ma phaleshu kadachana' - You have the right to your actions alone, never to their fruits. This is not passive resignation, but active surrender. Imagine an archer who draws the bow with complete focus, aims with full presence, and releases the arrow with perfect technique. Once released, the arrow's path is no longer the archer's to control. The archer's dharma was in the drawing, the aiming, the releasing - not in where the arrow lands.",
        "deeper_truth": "Here is the profound truth that ancient wisdom reveals: You are not your achievements. You are not your failures. Your essential worth was never meant to be measured by outcomes - it is eternal, unchanging, and already complete. The universe responds not to your ability to control what was never yours to control, but to the purity of your intention (sankalpa) and the sincerity of your effort (prayatna). When you act from this place, success and failure become equal - both teachers, both blessings.",
        "practical_wisdom": "Today, try this sacred practice: Before taking any action related to this worry, pause. Place your hand on your heart. Take three slow breaths. Then say to yourself: 'I offer my best effort as an act of devotion. The result belongs to the universe.' Now act with complete presence, as if the action itself is the reward. This is nishkama karma - desireless action - the highest form of spiritual practice in daily life.",
        "witness_consciousness": "Ancient wisdom teaches us to cultivate 'sakshi bhava' - witness consciousness. Step back from this worry and observe: 'I am having thoughts about outcomes.' Notice how the worry rises, stays for a moment, and dissolves. You are not the worry; you are the awareness that witnesses it. This unchanging awareness is your true nature - vast, peaceful, and untouched by any outcome.",
        "eternal_anchor": "Carry this eternal truth with you: You are already complete, exactly as you are, regardless of any outcome. The anxious mind will return with its questions about the future - and when it does, remind yourself: 'I cannot lose what I truly am.' Your inner light cannot be dimmed by success or failure. You are the sky; outcomes are merely clouds passing through. 💙",
    }

    response_text = f"Dear friend, I truly see you in this moment. This worry about '{worry_snippet}' weighs on your heart like a stone. Your anxiety is not weakness; it reveals how deeply you care. You are not alone.\n\nAncient wisdom teaches us that suffering arises not from outcomes themselves, but from our attachment to them. Your mind has become entangled with a future that hasn't yet unfolded - this is what the sages call 'phala-sakti' (attachment to fruits). While profoundly human, this attachment is the root of your unease.\n\nThe timeless wisdom of Karma Yoga offers profound liberation: 'Karmanye vadhikaraste, ma phaleshu kadachana' - You have the right to your actions alone, never to their fruits. Imagine an archer who draws the bow with complete focus and releases with perfect technique. Once released, the arrow's path is no longer the archer's to control. The archer's dharma was in the action itself.\n\nHere is the profound truth: You are not your achievements or failures. Your essential worth is eternal and already complete. The universe responds to the purity of your intention and the sincerity of your effort - not to your ability to control outcomes.\n\nToday, try this sacred practice: Before acting, pause. Take three breaths. Say: 'I offer my best effort as devotion. The result belongs to the universe.' Then act with complete presence, as if the action itself is the reward. This is nishkama karma - desireless action.\n\nAncient wisdom also teaches 'sakshi bhava' - witness consciousness. Observe your worry from a distance: 'I am having thoughts about outcomes.' You are not the worry; you are the awareness witnessing it.\n\nCarry this eternal truth: You are already complete, regardless of any outcome. Your inner light cannot be dimmed. You are the sky; outcomes are merely clouds passing through. 💙"

    return {
        "status": "success",
        "detachment_guidance": sections,
        "response": response_text,
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
        "analysis_mode": analysis_mode.value,
        # Enhanced v2.0 fields for fallback
        "psychological_framework": "Acceptance & Commitment Therapy (ACT)",
        "act_insights": {
            "relevant_processes": [
                {
                    "process": "acceptance",
                    "description": "Opening up to experience without struggle",
                    "gita_parallel": "Vairagya - accepting what is without attachment",
                    "practice": "Acknowledging outcomes we cannot control",
                },
                {
                    "process": "defusion",
                    "description": "Seeing thoughts as mental events, not facts",
                    "gita_parallel": "Sakshi bhava - witness consciousness",
                    "practice": "Noticing 'I am having the thought that...'",
                },
            ],
        },
        "attachment_analysis": attachment_analysis,
        "behavioral_patterns": [],
        "cached": False,
        "latency_ms": 0.0,
    }


@router.post("/chat")
async def viyoga_chat(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Chat endpoint for Viyoga Detachment Coach.

    This endpoint is called by the ViyogClient frontend component.
    It wraps the detachment functionality in a chat-friendly interface.

    Request body:
        message: str - The user's message/worry
        sessionId: str - Session identifier for conversation continuity
        mode: str - Response mode ('full' for comprehensive response)

    Returns:
        - assistant: The full response text
        - sections: Structured guidance sections
        - citations: List of Gita verse citations used
    """
    message = payload.get("message", "")
    session_id = payload.get("sessionId", "")
    mode = payload.get("mode", "full")

    if not message.strip():
        logger.warning("Viyoga chat: empty message received")
        return {
            "assistant": "",
            "sections": {},
            "citations": [],
            "error": "Message is required"
        }

    if len(message) > 2000:
        logger.warning(f"Viyoga chat: message too long ({len(message)} chars)")
        return {
            "assistant": "",
            "sections": {},
            "citations": [],
            "error": "Message too long (max 2000 characters)"
        }

    # Determine analysis mode based on request mode
    analysis_mode = AnalysisMode.STANDARD
    if mode == "full" or mode == "deep":
        analysis_mode = AnalysisMode.DEEP_DIVE

    if not wellness_model:
        logger.warning("Viyoga chat: WellnessModel not initialized, using fallback")
        fallback = _get_fallback_response(message, analysis_mode)
        return {
            "assistant": fallback.get("response", ""),
            "sections": fallback.get("detachment_guidance", {}),
            "citations": [],
        }

    try:
        # Analyze attachment pattern
        attachment_analysis = _analyze_attachment_pattern(message)
        act_guidance = PsychologicalFramework.get_act_guidance(attachment_analysis["type"])

        # Generate response using WellnessModel
        result = await wellness_model.generate_response(
            tool=WellnessTool.VIYOGA,
            user_input=message,
            db=db,
            analysis_mode=analysis_mode,
        )

        # Build citations placeholder (gita_verses_used is count, not list)
        citations = []
        if result.gita_verses_used > 0:
            # Add a generic citation indicating Gita wisdom was used
            citations.append({
                "source_file": "bhagavad_gita",
                "reference_if_any": f"Karma Yoga wisdom ({result.gita_verses_used} verses integrated)",
                "chunk_id": "karma_yoga_compilation",
            })

        logger.info(
            f"✅ Viyoga chat: session={session_id[:8] if session_id else 'none'}..., "
            f"attachment_type={attachment_analysis['type']}, "
            f"verses={result.gita_verses_used}"
        )

        return {
            "assistant": result.content,
            "sections": result.sections or {},
            "citations": citations,
            "attachment_analysis": attachment_analysis,
            "act_insights": {
                "relevant_processes": [
                    {
                        "process": name,
                        "description": info.get("description", ""),
                        "gita_parallel": info.get("gita_parallel", ""),
                    }
                    for name, info in act_guidance.items()
                ],
            },
        }

    except Exception as e:
        logger.exception(f"Viyoga chat error: {e}")
        # Return fallback response on error
        fallback = _get_fallback_response(message, analysis_mode)
        return {
            "assistant": fallback.get("response", ""),
            "sections": fallback.get("detachment_guidance", {}),
            "citations": [],
        }


@router.get("/health")
async def viyoga_health():
    """Health check."""
    return {"status": "ok", "service": "viyoga", "provider": "kiaan"}
