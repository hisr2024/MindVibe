"""Viyoga Detachment Coach - Gita-Grounded Karma Yoga Guidance v3.0.

ENHANCED VERSION with Strict Gita Wisdom Grounding

This router provides outcome anxiety reduction using ONLY Bhagavad Gita wisdom
from the 700+ verse repository. ALL responses are grounded in actual verses.

Viyoga focuses on Karma Yoga principles from the Gita:
- Karmanye vadhikaraste (right to action, not fruits)
- Nishkama Karma (desireless action)
- Samatva (equanimity in success and failure)
- Phala-sakti awareness (attachment to fruits)

ANALYSIS MODES (v3.0):
- standard: 7-section guidance with core Karma Yoga teaching
- deep_dive: Comprehensive analysis with multiple verse references
- quantum_dive: Multi-dimensional exploration across Gita chapters

ENHANCEMENTS (v3.0):
- Strict Gita-only grounding (no psychology terminology)
- Direct verse retrieval from 701-verse JSON
- System prompt enforcing repository-bound responses
- Fallback using actual Gita verses (not generic text)
- Multi-provider AI with Gita context injection
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
from backend.services.viyoga_prompts import (
    VIYOGA_SYSTEM_PROMPT,
    VIYOGA_SECULAR_PROMPT,
    VIYOGA_CORE_GITA_WISDOM,
    ATTACHMENT_TO_GITA,
    ATTACHMENT_TO_SECULAR,
    VIYOGA_HEADINGS_SECULAR,
    VIYOGA_HEADINGS_GITA,
)
from backend.services.gita_wisdom_retrieval import (
    search_gita_verses,
    build_gita_context,
    generate_viyoga_fallback,
    is_ready as gita_ready,
    get_verses_count,
)
from backend.services.gita_ai_analyzer import (
    get_gita_ai_analyzer,
    AttachmentAnalysis,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/viyoga", tags=["viyoga"])

# Initialize WellnessModel
wellness_model: WellnessModel | None = None
try:
    wellness_model = get_wellness_model()
    logger.info("✅ Viyoga v3.0: WellnessModel initialized with Gita-grounding")
except Exception as e:
    logger.warning(f"⚠️ Viyoga: WellnessModel unavailable: {e}")

# Initialize AI-powered Gita analyzer
gita_ai_analyzer = None
try:
    gita_ai_analyzer = get_gita_ai_analyzer()
    logger.info("✅ Viyoga v3.1: AI-powered Gita analyzer initialized")
except Exception as e:
    logger.warning(f"⚠️ Viyoga: AI analyzer unavailable, using fallback: {e}")

# Log Gita verses availability
if gita_ready():
    logger.info(f"✅ Viyoga v3.0: {get_verses_count()} Gita verses available for retrieval")
else:
    logger.warning("⚠️ Viyoga: Gita verses not loaded - using core wisdom fallback")


@router.post("/detach")
async def detach_from_outcome(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate detachment guidance using ONLY Bhagavad Gita wisdom (v3.0).

    GITA-GROUNDED PATTERN:
    Question → Attachment Analysis → Gita Verse Retrieval → Karma Yoga Guidance

    1. Receive user's outcome worry
    2. Identify attachment type using Gita framing (not psychology)
    3. Retrieve relevant Karma Yoga verses from 701-verse repository
    4. Generate response grounded in actual Gita verses
    5. Fallback uses real verses, not generic text

    Request body:
        outcome_worry: str - The outcome or result they're anxious about
        analysis_mode: str - One of "standard", "deep_dive", or "quantum_dive" (default: "standard")
        language: str - Optional language code (hi, ta, te, etc.)
        secularMode: bool - If True (default), uses modern friendly language without spiritual terms

    Returns:
        - detachment_guidance: Structured sections with Gita verse citations
        - gita_context: Verses used for this response
        - attachment_analysis: Type of attachment with Gita teaching
        - gita_verses_used: Number of actual verses incorporated
        - model/provider: AI model and provider used
    """
    outcome_worry = payload.get("outcome_worry", "")
    analysis_mode_str = payload.get("analysis_mode", "standard")
    language = payload.get("language")
    # Secular mode is ON by default - modern, friendly responses
    secular_mode = payload.get("secularMode", True)

    if not outcome_worry.strip():
        raise HTTPException(status_code=400, detail="outcome_worry is required")

    if len(outcome_worry) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    # Parse analysis mode
    try:
        analysis_mode = AnalysisMode(analysis_mode_str.lower())
    except ValueError:
        logger.warning(f"Invalid analysis_mode '{analysis_mode_str}', using standard")
        analysis_mode = AnalysisMode.STANDARD

    # Analyze attachment pattern using AI-powered Gita analyzer (v3.1)
    # This replaces the old regex/keyword matching with OpenAI + Core Wisdom
    if gita_ai_analyzer:
        try:
            ai_attachment = await gita_ai_analyzer.analyze_attachment_pattern(outcome_worry)
            attachment_analysis = {
                "type": ai_attachment.attachment_type,
                "description": ai_attachment.description,
                "gita_teaching": ai_attachment.gita_teaching,
                "primary_verse": ai_attachment.primary_verse,
                "verse_text": ai_attachment.verse_text,
                "remedy": ai_attachment.remedy,
                "confidence": ai_attachment.confidence,
                "secondary_patterns": ai_attachment.secondary_patterns,
                "ai_powered": True,
            }
            logger.info(f"Viyoga: AI attachment analysis: {ai_attachment.attachment_type} (confidence: {ai_attachment.confidence})")
        except Exception as e:
            logger.warning(f"AI attachment analysis failed, using fallback: {e}")
            attachment_analysis = _analyze_attachment_pattern(outcome_worry, secular_mode)
    else:
        # Fallback to keyword matching if AI analyzer unavailable
        attachment_analysis = _analyze_attachment_pattern(outcome_worry, secular_mode)

    # STEP 1: Retrieve Gita verses directly from 701-verse repository
    depth_map = {
        AnalysisMode.STANDARD: "standard",
        AnalysisMode.DEEP_DIVE: "deep_dive",
        AnalysisMode.QUANTUM_DIVE: "quantum_dive",
    }
    depth = depth_map.get(analysis_mode, "standard")

    gita_verses = search_gita_verses(
        query=outcome_worry,
        tool="viyoga",
        limit=8,
        depth=depth,
    )

    # Build Gita context for AI
    if gita_verses:
        gita_context, sources = build_gita_context(gita_verses, tool="viyoga")
        logger.info(f"Viyoga: Retrieved {len(gita_verses)} Karma Yoga verses")
    else:
        gita_context = VIYOGA_CORE_GITA_WISDOM
        sources = [{"file": "core_karma_yoga", "reference": "BG 2.47-2.50"}]
        logger.info("Viyoga: Using core Karma Yoga wisdom fallback")

    # If WellnessModel unavailable, use Gita-grounded fallback
    if not wellness_model:
        logger.warning("Viyoga: WellnessModel unavailable, using Gita-based fallback")
        return _get_gita_grounded_fallback(
            outcome_worry, gita_verses, attachment_analysis, analysis_mode, secular_mode
        )

    try:
        # Generate response using WellnessModel with Gita context
        # secular_mode uses modern, friendly language while still using Gita wisdom internally
        result = await wellness_model.generate_response(
            tool=WellnessTool.VIYOGA,
            user_input=f"{outcome_worry}\n\n{gita_context}",
            db=db,
            analysis_mode=analysis_mode,
            language=language,
            secular_mode=secular_mode,
        )

        # Get Gita teaching for attachment type
        gita_teaching = ATTACHMENT_TO_GITA.get(
            attachment_analysis["type"],
            ATTACHMENT_TO_GITA["outcome_anxiety"]
        )

        # Build enhanced response
        response = {
            "status": "success",
            "detachment_guidance": result.sections,
            "response": result.content,
            "gita_verses_used": max(result.gita_verses_used, len(gita_verses)),
            "model": result.model,
            "provider": result.provider,
            "analysis_mode": result.analysis_mode,
            "secularMode": secular_mode,
            # Gita-grounded fields (v3.0)
            "gita_context": {
                "verses_retrieved": len(gita_verses),
                "sources": sources,
                "core_teaching": gita_teaching,
            },
            "attachment_analysis": attachment_analysis,
            "karma_yoga_insight": {
                "teaching": gita_teaching.get("teaching", ""),
                "verse": gita_teaching.get("verse", "BG 2.47"),
                "remedy": gita_teaching.get("remedy", ""),
            },
            "cached": result.cached,
            "latency_ms": result.latency_ms,
        }

        logger.info(
            f"✅ Viyoga detach: {analysis_mode.value} mode, "
            f"attachment_type={attachment_analysis['type']}, "
            f"{len(gita_verses)} verses retrieved, "
            f"secular={secular_mode}"
        )

        return response

    except Exception as e:
        logger.exception(f"Viyoga error: {e}")
        return _get_gita_grounded_fallback(
            outcome_worry, gita_verses, attachment_analysis, analysis_mode, secular_mode
        )


def _analyze_attachment_pattern(outcome_worry: str, secular_mode: bool = True) -> dict[str, Any]:
    """Analyze the type of outcome attachment pattern."""
    worry_lower = outcome_worry.lower()

    # Determine attachment type
    if any(w in worry_lower for w in ["control", "manage", "guarantee", "make sure"]):
        attachment_type = "control"
    elif any(w in worry_lower for w in ["future", "what if", "might happen", "could go wrong"]):
        attachment_type = "future_worry"
    elif any(w in worry_lower for w in ["need", "must have", "can't live without", "desperate"]):
        attachment_type = "outcome_dependency"
    elif any(w in worry_lower for w in ["perfect", "flawless", "no mistakes", "exactly right"]):
        attachment_type = "perfectionism"
    elif any(w in worry_lower for w in ["approve", "think of me", "judge", "opinion"]):
        attachment_type = "approval_seeking"
    else:
        attachment_type = "outcome_anxiety"

    if secular_mode:
        # Use secular language mapping
        secular_info = ATTACHMENT_TO_SECULAR.get(attachment_type, ATTACHMENT_TO_SECULAR["outcome_anxiety"])
        return {
            "type": attachment_type,
            "description": secular_info["pattern"],
            "insight": secular_info["insight"],
            "shift": secular_info["shift"],
        }
    else:
        # Use traditional Gita language
        gita_mapping = {
            "control": ("Attachment to controlling outcomes", "Karmanye vadhikaraste - focus on action, not control of results"),
            "future_worry": ("Attachment to imagined future scenarios", "Present moment awareness - the future is not here yet"),
            "outcome_dependency": ("Identity or worth tied to specific outcome", "Atma-tripti - you are already complete within yourself"),
            "perfectionism": ("Attachment to perfect outcomes", "Samatva - equanimity in success and failure"),
            "approval_seeking": ("Attachment to others' approval", "Sthitaprajna - unmoved by praise or blame"),
            "outcome_anxiety": ("General anxiety about results", "Nishkama karma - desireless action"),
        }
        description, gita_teaching = gita_mapping.get(attachment_type, gita_mapping["outcome_anxiety"])
        return {
            "type": attachment_type,
            "description": description,
            "gita_teaching": gita_teaching,
        }


def _get_gita_grounded_fallback(
    outcome_worry: str,
    gita_verses: list[dict[str, Any]],
    attachment_analysis: dict[str, Any],
    analysis_mode: AnalysisMode = AnalysisMode.STANDARD,
    secular_mode: bool = True
) -> dict[str, Any]:
    """Gita-grounded fallback using actual verses from the 701-verse repository.

    This ensures ALL guidance is rooted in real Gita wisdom, not generic text.
    Even when AI is unavailable, responses cite actual verses.
    Secular mode presents wisdom in modern, friendly language.
    """
    if secular_mode:
        # Generate secular fallback response
        return _get_secular_fallback(outcome_worry, attachment_analysis, analysis_mode)

    # Use the shared service to generate fallback
    fallback_result = generate_viyoga_fallback(
        user_input=outcome_worry,
        verses=gita_verses,
        attachment_type=attachment_analysis.get("type", "outcome_anxiety"),
    )

    # Get Gita teaching for this attachment type
    gita_teaching = ATTACHMENT_TO_GITA.get(
        attachment_analysis.get("type", "outcome_anxiety"),
        ATTACHMENT_TO_GITA["outcome_anxiety"]
    )

    return {
        "status": "success",
        "detachment_guidance": fallback_result["sections"],
        "response": fallback_result["response"],
        "gita_verses_used": fallback_result["gita_verses_used"],
        "model": "gita_fallback",
        "provider": "gita_repository",
        "analysis_mode": analysis_mode.value,
        # Gita-grounded fields (v3.0)
        "gita_context": {
            "verses_retrieved": len(gita_verses),
            "sources": [
                {"file": "gita_verses_complete.json", "reference": v["ref"]}
                for v in fallback_result.get("verses", [])
            ],
            "core_teaching": gita_teaching,
        },
        "attachment_analysis": attachment_analysis,
        "karma_yoga_insight": {
            "teaching": gita_teaching.get("teaching", ""),
            "verse": gita_teaching.get("verse", "BG 2.47"),
            "remedy": gita_teaching.get("remedy", ""),
        },
        "fallback": True,
        "secularMode": False,
        "cached": False,
        "latency_ms": 0.0,
    }


def _get_secular_fallback(
    outcome_worry: str,
    attachment_analysis: dict[str, Any],
    analysis_mode: AnalysisMode = AnalysisMode.STANDARD
) -> dict[str, Any]:
    """Modern, friendly fallback response without spiritual terms."""
    attachment_type = attachment_analysis.get("type", "outcome_anxiety")
    secular_info = ATTACHMENT_TO_SECULAR.get(attachment_type, ATTACHMENT_TO_SECULAR["outcome_anxiety"])

    # Build secular response sections
    sections = {
        "i_get_it": f"I can hear the weight in what you're sharing. It makes total sense that you're feeling anxious about this - when something matters to us, of course we want it to work out. That's completely human.",
        "whats_really_going_on": secular_info["insight"],
        "a_different_way_to_see_this": secular_info["shift"] + " What if you shifted focus from \"will this work out?\" to \"what's the best I can do right now?\" You can't guarantee outcomes, but you CAN show up with intention and effort.",
        "try_this_right_now": "Take 3 slow breaths. Then ask yourself: \"What's ONE small thing I can do in the next 10 minutes that's completely within my control?\" Don't think about whether it will \"work\" - just identify one action you can take.",
        "one_thing_you_can_do": "Pick that one small action and do it today. Not because it guarantees success, but because it's what you can offer right now. Focus on doing it well, not on what happens after.",
        "something_to_consider": "What would change if you measured success by the quality of your effort, rather than the outcome?",
    }

    # Build full response text
    response_text = f"""**I Get It**
{sections['i_get_it']}

**What's Really Going On**
{sections['whats_really_going_on']}

**A Different Way to See This**
{sections['a_different_way_to_see_this']}

**Try This Right Now** (60 seconds)
{sections['try_this_right_now']}

**One Thing You Can Do**
{sections['one_thing_you_can_do']}

**Something to Consider**
{sections['something_to_consider']}"""

    return {
        "status": "success",
        "detachment_guidance": sections,
        "response": response_text,
        "gita_verses_used": 0,
        "model": "secular_fallback",
        "provider": "mindvibe",
        "analysis_mode": analysis_mode.value,
        "attachment_analysis": attachment_analysis,
        "fallback": True,
        "secularMode": True,
        "cached": False,
        "latency_ms": 0.0,
    }


@router.post("/chat")
async def viyoga_chat(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Chat endpoint for Viyoga Detachment Coach - Gita-grounded (v3.0).

    This endpoint is called by the ViyogClient frontend component.
    ALL responses are grounded in actual Bhagavad Gita verses.

    Request body:
        message: str - The user's message/worry
        sessionId: str - Session identifier for conversation continuity
        mode: str - Response mode ('full' for comprehensive response)
        secularMode: bool - If True (default), uses modern friendly language

    Returns:
        - assistant: The full response text with Gita citations
        - sections: Structured guidance sections
        - citations: Actual Gita verse citations used
    """
    message = payload.get("message", "")
    session_id = payload.get("sessionId", "")
    mode = payload.get("mode", "full")
    # Secular mode is ON by default - modern, friendly responses
    secular_mode = payload.get("secularMode", True)

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

    # ALWAYS retrieve Gita verses for context
    depth_map = {
        AnalysisMode.STANDARD: "standard",
        AnalysisMode.DEEP_DIVE: "deep_dive",
        AnalysisMode.QUANTUM_DIVE: "quantum_dive",
    }
    depth = depth_map.get(analysis_mode, "standard")

    gita_verses = search_gita_verses(
        query=message,
        tool="viyoga",
        limit=8,
        depth=depth,
    )

    # Build Gita context
    if gita_verses:
        gita_context, sources = build_gita_context(gita_verses, tool="viyoga")
    else:
        gita_context = VIYOGA_CORE_GITA_WISDOM
        sources = [{"file": "core_karma_yoga", "reference": "BG 2.47-2.50"}]

    # Analyze attachment pattern using AI-powered Gita analyzer (v3.1)
    if gita_ai_analyzer:
        try:
            ai_attachment = await gita_ai_analyzer.analyze_attachment_pattern(message)
            attachment_analysis = {
                "type": ai_attachment.attachment_type,
                "description": ai_attachment.description,
                "gita_teaching": ai_attachment.gita_teaching,
                "primary_verse": ai_attachment.primary_verse,
                "verse_text": ai_attachment.verse_text,
                "remedy": ai_attachment.remedy,
                "confidence": ai_attachment.confidence,
                "ai_powered": True,
            }
        except Exception as e:
            logger.warning(f"AI attachment analysis failed in chat: {e}")
            attachment_analysis = _analyze_attachment_pattern(message, secular_mode)
    else:
        attachment_analysis = _analyze_attachment_pattern(message, secular_mode)

    # Build citations from actual verses
    citations = [
        {
            "source_file": "gita_verses_complete.json",
            "reference_if_any": f"BG {v.get('chapter', 0)}.{v.get('verse', 0)}",
            "chunk_id": f"ch{v.get('chapter', 0)}_v{v.get('verse', 0)}",
        }
        for v in gita_verses[:5]
    ]

    if not wellness_model:
        logger.warning("Viyoga chat: WellnessModel unavailable, using Gita fallback")
        fallback = _get_gita_grounded_fallback(
            message, gita_verses, attachment_analysis, analysis_mode, secular_mode
        )
        return {
            "assistant": fallback.get("response", ""),
            "sections": fallback.get("detachment_guidance", {}),
            "citations": citations,
            "secularMode": secular_mode,
            "attachment_analysis": attachment_analysis,
            "karma_yoga_insight": fallback.get("karma_yoga_insight", {}),
        }

    try:
        # Generate response using WellnessModel with Gita context
        # secular_mode uses modern, friendly language while still using Gita wisdom internally
        result = await wellness_model.generate_response(
            tool=WellnessTool.VIYOGA,
            user_input=f"{message}\n\n{gita_context}",
            db=db,
            analysis_mode=analysis_mode,
            secular_mode=secular_mode,
        )

        # Get Gita teaching for attachment type
        gita_teaching = ATTACHMENT_TO_GITA.get(
            attachment_analysis["type"],
            ATTACHMENT_TO_GITA["outcome_anxiety"]
        )

        logger.info(
            f"✅ Viyoga chat: session={session_id[:8] if session_id else 'none'}..., "
            f"attachment_type={attachment_analysis['type']}, "
            f"verses={len(gita_verses)}, "
            f"secular={secular_mode}"
        )

        return {
            "assistant": result.content,
            "sections": result.sections or {},
            "citations": citations,
            "secularMode": secular_mode,
            "attachment_analysis": attachment_analysis,
            "karma_yoga_insight": {
                "teaching": gita_teaching.get("teaching", ""),
                "verse": gita_teaching.get("verse", "BG 2.47"),
                "remedy": gita_teaching.get("remedy", ""),
            },
        }

    except Exception as e:
        logger.exception(f"Viyoga chat error: {e}")
        # Return Gita-grounded fallback on error
        fallback = _get_gita_grounded_fallback(
            message, gita_verses, attachment_analysis, analysis_mode, secular_mode
        )
        return {
            "assistant": fallback.get("response", ""),
            "sections": fallback.get("detachment_guidance", {}),
            "citations": citations,
            "secularMode": secular_mode,
            "attachment_analysis": attachment_analysis,
        }


@router.get("/health")
async def viyoga_health():
    """Health check with Gita wisdom and AI analyzer availability status."""
    gita_verses_loaded = get_verses_count()
    wellness_ready = wellness_model is not None
    ai_analyzer_ready = gita_ai_analyzer is not None

    return {
        "status": "ok" if (gita_verses_loaded > 0 or wellness_ready) else "degraded",
        "service": "viyoga",
        "version": "3.1",  # Updated for AI-powered analysis
        "provider": "gita_repository",
        "gita_grounding": {
            "verses_loaded": gita_verses_loaded,
            "repository_ready": gita_ready(),
            "fallback_available": True,
        },
        "ai_analysis": {
            "ai_analyzer_ready": ai_analyzer_ready,
            "analysis_method": "openai_gita_wisdom" if ai_analyzer_ready else "keyword_fallback",
            "features": [
                "attachment_pattern_analysis",
                "emotion_recognition",
                "relationship_detection",
                "communication_analysis",
            ] if ai_analyzer_ready else ["keyword_matching_fallback"],
        },
        "wellness_model_ready": wellness_ready,
    }
