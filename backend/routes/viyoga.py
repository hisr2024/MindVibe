"""Viyoga Detachment Coach - Gita-Grounded Karma Yoga Guidance v4.0.

ENHANCED VERSION with AI-Powered Concern Analysis + Direct OpenAI Response Generation

This router provides outcome anxiety reduction using Bhagavad Gita wisdom
from the 700+ verse repository. ALL responses are grounded in actual verses.

v4.0 PIPELINE (like Ardha and Relationship Compass):
1. AI-POWERED CONCERN ANALYSIS - Deep understanding of user's specific situation
2. ENHANCED VERSE RETRIEVAL - AI-informed search queries for better Gita matches
3. ANALYSIS-AWARE PROMPT - Deep situational context injected into prompts
4. DIRECT OPENAI CALL - Custom prompts with analysis context (not WellnessModel)
5. GITA WISDOM FILTER - All responses filtered through Gita Core Wisdom
6. GRACEFUL FALLBACK - WellnessModel backup, then verse-based fallback

Viyoga focuses on Karma Yoga principles from the Gita:
- Karmanye vadhikaraste (right to action, not fruits)
- Nishkama Karma (desireless action)
- Samatva (equanimity in success and failure)
- Phala-sakti awareness (attachment to fruits)
"""

from __future__ import annotations

import logging
import time
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
    build_enhanced_viyoga_prompt,
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
from backend.services.viyoga_analysis import (
    analyze_concern_with_ai_async,
    build_enhanced_search_query,
    build_analysis_context_for_prompt,
    analysis_to_dict,
    ConcernAnalysis,
)
from backend.services.openai_optimizer import openai_optimizer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/viyoga", tags=["viyoga"])

# Gita Wisdom Filter - lazy import to avoid circular dependencies
_gita_filter = None


def _get_gita_filter():
    """Lazy import of Gita wisdom filter."""
    global _gita_filter
    if _gita_filter is None:
        try:
            from backend.services.gita_wisdom_filter import get_gita_wisdom_filter
            _gita_filter = get_gita_wisdom_filter()
            logger.info("Viyoga v4.0: Gita Wisdom Filter integrated")
        except Exception as e:
            logger.warning(f"Viyoga: Gita Wisdom Filter unavailable: {e}")
            _gita_filter = False
    return _gita_filter if _gita_filter else None


# Session memory for conversation continuity
SESSION_MEMORY: dict[str, list[dict[str, str]]] = {}
MAX_SESSION_TURNS = 10

# Initialize WellnessModel (fallback)
wellness_model: WellnessModel | None = None
try:
    wellness_model = get_wellness_model()
    logger.info("Viyoga v4.0: WellnessModel initialized (fallback)")
except Exception as e:
    logger.warning(f"Viyoga: WellnessModel unavailable: {e}")

# Initialize AI-powered Gita analyzer (legacy, kept for /detach endpoint)
gita_ai_analyzer = None
try:
    gita_ai_analyzer = get_gita_ai_analyzer()
    logger.info("Viyoga v4.0: AI-powered Gita analyzer initialized")
except Exception as e:
    logger.warning(f"Viyoga: AI analyzer unavailable, using fallback: {e}")

# Log Gita verses availability
if gita_ready():
    logger.info(f"Viyoga v4.0: {get_verses_count()} Gita verses available for retrieval")
else:
    logger.warning("Viyoga: Gita verses not loaded - using core wisdom fallback")


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
        # Generate response using WellnessModel
        # OpenAI reasons independently about each user's specific concern
        # Gita wisdom is provided as the guiding framework, not as content to parrot
        if secular_mode:
            # Secular mode: Gita wisdom guides reasoning internally
            ai_input = (
                f"{outcome_worry}\n\n"
                f"[Internal guidance — use these principles to inform your reasoning, "
                f"present insights in modern language, never quote or reference directly]\n"
                f"{gita_context}"
            )
        else:
            ai_input = f"{outcome_worry}\n\n{gita_context}"

        result = await wellness_model.generate_response(
            tool=WellnessTool.VIYOGA,
            user_input=ai_input,
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

    # Build secular response sections (v5.0 - deeper identity-level insight)
    sections = {
        "i_get_it": f"I can hear the weight in what you're sharing. This matters to you — and the anxiety makes sense because some part of you feels that YOU are at stake here, not just the outcome. That's worth looking at.",
        "whats_really_going_on": secular_info["insight"] + " But here's the deeper pattern: the worry isn't really about the outcome itself. It's about what you think the outcome says about YOU — your worth, your competence, your identity. The outcome and the person watching the outcome are two entirely different things.",
        "a_different_way_to_see_this": secular_info["shift"] + " Consider this: the person who did the work, who showed up, who gave their best — that person doesn't change regardless of the result. The outcome belongs to circumstances, timing, and factors you don't control. But the person observing all of this? That person remains the same whether it goes perfectly or falls apart.",
        "try_this_right_now": "Pause for 30 seconds. Notice the worry as something you are WATCHING — not something you ARE. You are the one aware of the anxiety; you are not the anxiety itself. Now imagine both outcomes: success and failure. Can you sit with both equally? The person who remains steady in either case — that is who you actually are.",
        "one_thing_you_can_do": "Pick one small action within your control and do it today. Not as a strategy for winning — but as a contribution. The action is complete in itself, regardless of what follows. You've done your part. Now let the situation unfold.",
        "something_to_consider": "If this goes exactly the way you fear — who are you then? The same person? Then what exactly are you afraid of losing?",
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
    """Chat endpoint for Viyoga Detachment Coach - Enhanced v4.0.

    v4.0 PIPELINE (same quality as Ardha and Relationship Compass):
    1. AI-POWERED CONCERN ANALYSIS - Deep understanding of specific situation
    2. ENHANCED VERSE RETRIEVAL - AI-informed search for better Gita matches
    3. ANALYSIS-AWARE PROMPT - Situational context injected into system prompt
    4. DIRECT OPENAI CALL - Custom prompt (not WellnessModel's internal prompt)
    5. GITA WISDOM FILTER - Response filtered through Gita Core Wisdom
    6. GRACEFUL FALLBACK - WellnessModel backup, then verse-based fallback

    Request body:
        message: str - The user's message/worry
        sessionId: str - Session identifier for conversation continuity
        mode: str - Response mode ('full' for comprehensive response)
        secularMode: bool - If True (default), uses modern friendly language

    Returns:
        - assistant: Deeply personalized response with Gita wisdom
        - sections: Structured guidance sections
        - citations: Actual Gita verse citations used
        - concern_analysis: AI-powered understanding of their specific situation
    """
    start_time = time.time()

    message = payload.get("message", "")
    session_id = payload.get("sessionId", "")
    mode = payload.get("mode", "full")
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

    # Determine analysis mode
    analysis_mode = AnalysisMode.STANDARD
    if mode == "full" or mode == "deep":
        analysis_mode = AnalysisMode.DEEP_DIVE

    depth_map = {
        AnalysisMode.STANDARD: "standard",
        AnalysisMode.DEEP_DIVE: "deep_dive",
        AnalysisMode.QUANTUM_DIVE: "quantum_dive",
    }
    depth = depth_map.get(analysis_mode, "standard")

    # Get session history for continuity
    session_history = _get_session_history(session_id)

    # Build session context string for analysis
    session_context = None
    if session_history:
        recent = session_history[-4:]
        session_context = "\n".join(
            f"{m['role']}: {m['content'][:200]}" for m in recent
        )

    # =========================================================================
    # STEP 1: AI-POWERED CONCERN ANALYSIS (the key enhancement)
    # This is what makes Viyoga understand your SPECIFIC situation deeply
    # =========================================================================
    concern_analysis = await analyze_concern_with_ai_async(
        concern=message,
        session_context=session_context,
    )

    logger.info(
        f"Viyoga v4.0 Analysis: "
        f"worry='{concern_analysis.specific_worry[:40]}...', "
        f"attachment={concern_analysis.attachment_type}, "
        f"emotion={concern_analysis.primary_emotion}, "
        f"confidence={concern_analysis.confidence:.2f}, "
        f"depth={concern_analysis.analysis_depth}"
    )

    # =========================================================================
    # STEP 2: ENHANCED VERSE RETRIEVAL using analysis insights
    # =========================================================================
    if concern_analysis.analysis_depth == "ai_enhanced" and concern_analysis.confidence >= 0.4:
        enhanced_query = build_enhanced_search_query(message, concern_analysis)
        gita_verses = search_gita_verses(
            query=enhanced_query,
            tool="viyoga",
            limit=8,
            depth=depth,
        )
        logger.info("Viyoga v4.0: Using AI-enhanced query for verse retrieval")
    else:
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

    # Build citations from actual verses
    citations = [
        {
            "source_file": "gita_verses_complete.json",
            "reference_if_any": f"BG {v.get('chapter', 0)}.{v.get('verse', 0)}",
            "chunk_id": f"ch{v.get('chapter', 0)}_v{v.get('verse', 0)}",
        }
        for v in gita_verses[:5]
    ]

    # Build analysis context for prompt injection
    analysis_context = build_analysis_context_for_prompt(concern_analysis)

    # Also build a simple attachment_analysis dict for backward compatibility
    attachment_analysis = {
        "type": concern_analysis.attachment_type or "outcome_anxiety",
        "description": concern_analysis.specific_worry,
        "primary_emotion": concern_analysis.primary_emotion,
        "confidence": concern_analysis.confidence,
        "ai_powered": concern_analysis.analysis_depth == "ai_enhanced",
    }

    # =========================================================================
    # STEP 3: DIRECT OPENAI CALL with analysis-enriched prompt
    # This is the same approach Ardha uses - direct OpenAI with custom prompts
    # =========================================================================
    response_text = None
    model_used = "unknown"
    provider_used = "unknown"

    if openai_optimizer.ready and openai_optimizer.client:
        try:
            # Build enhanced messages with concern analysis context
            messages = build_enhanced_viyoga_prompt(
                concern=message,
                analysis_context=analysis_context,
                gita_context=gita_context,
                secular_mode=secular_mode,
                session_history=session_history,
            )

            # Determine max tokens based on mode
            max_tokens_map = {"standard": 600, "deep_dive": 900, "quantum_dive": 1200}
            max_tokens = max_tokens_map.get(depth, 600)

            # Validate token limits before calling
            openai_optimizer.validate_token_limits(messages, max_tokens)

            completion = openai_optimizer.client.chat.completions.create(
                model=openai_optimizer.default_model,
                messages=messages,
                temperature=0.4,
                max_tokens=max_tokens,
            )

            if completion.choices and completion.choices[0].message:
                content = completion.choices[0].message.content or ""
                if content.strip():
                    # Apply Gita Wisdom Filter (like Ardha does)
                    response_text = await _apply_gita_filter(content, message)
                    model_used = openai_optimizer.default_model
                    provider_used = "openai_direct"

                    logger.info(
                        f"Viyoga v4.0: Direct OpenAI response generated, "
                        f"model={model_used}, tokens={completion.usage.total_tokens if completion.usage else 'unknown'}"
                    )

        except Exception as e:
            logger.warning(f"Viyoga v4.0: Direct OpenAI failed ({e}), trying fallback")

    # =========================================================================
    # STEP 4: FALLBACK to WellnessModel if direct call failed
    # =========================================================================
    if not response_text and wellness_model:
        try:
            if secular_mode:
                ai_input = (
                    f"{message}\n\n"
                    f"{analysis_context}\n\n"
                    f"[Internal guidance — use these principles to inform your reasoning, "
                    f"present insights in modern language, never quote or reference directly]\n"
                    f"{gita_context}"
                )
            else:
                ai_input = f"{message}\n\n{analysis_context}\n\n{gita_context}"

            result = await wellness_model.generate_response(
                tool=WellnessTool.VIYOGA,
                user_input=ai_input,
                db=db,
                analysis_mode=analysis_mode,
                secular_mode=secular_mode,
            )

            response_text = result.content
            model_used = result.model
            provider_used = "wellness_model"

            logger.info("Viyoga v4.0: WellnessModel fallback used")

        except Exception as e:
            logger.warning(f"Viyoga v4.0: WellnessModel also failed: {e}")

    # =========================================================================
    # STEP 5: FINAL FALLBACK to verse-based response
    # =========================================================================
    if not response_text:
        logger.warning("Viyoga v4.0: All AI providers failed, using Gita fallback")
        fallback = _get_gita_grounded_fallback(
            message, gita_verses, attachment_analysis, analysis_mode, secular_mode
        )
        return {
            "assistant": fallback.get("response", ""),
            "sections": fallback.get("detachment_guidance", {}),
            "citations": citations,
            "secularMode": secular_mode,
            "attachment_analysis": attachment_analysis,
            "concern_analysis": analysis_to_dict(concern_analysis),
            "karma_yoga_insight": fallback.get("karma_yoga_insight", {}),
            "fallback": True,
        }

    # Clean response
    response_text = _sanitize_response(response_text)

    # Parse sections from the response
    if secular_mode:
        sections = _extract_sections(response_text, VIYOGA_HEADINGS_SECULAR)
    else:
        sections = _extract_sections(response_text, VIYOGA_HEADINGS_GITA)

    # Store in session memory
    _store_session_history(session_id, message, response_text)

    # Get Gita teaching for attachment type
    gita_teaching = ATTACHMENT_TO_GITA.get(
        attachment_analysis.get("type", "outcome_anxiety"),
        ATTACHMENT_TO_GITA["outcome_anxiety"]
    )

    # Five Pillar compliance scoring (v5.0)
    pillar_compliance = _score_five_pillar_compliance(response_text, secular_mode)

    latency_ms = (time.time() - start_time) * 1000

    logger.info(
        f"Viyoga v5.0 chat: session={session_id[:8] if session_id else 'none'}..., "
        f"attachment={attachment_analysis.get('type', 'unknown')}, "
        f"emotion={concern_analysis.primary_emotion}, "
        f"pillars={pillar_compliance.get('compliance_level', 'N/A')}, "
        f"verses={len(gita_verses)}, "
        f"provider={provider_used}, "
        f"secular={secular_mode}, "
        f"latency={latency_ms:.0f}ms"
    )

    return {
        "assistant": response_text,
        "sections": sections,
        "citations": citations,
        "secularMode": secular_mode,
        "attachment_analysis": attachment_analysis,
        "concern_analysis": analysis_to_dict(concern_analysis),
        "karma_yoga_insight": {
            "teaching": gita_teaching.get("teaching", ""),
            "verse": gita_teaching.get("verse", "BG 2.47"),
            "remedy": gita_teaching.get("remedy", ""),
            "pillars": gita_teaching.get("pillars", []),
        },
        "five_pillar_compliance": pillar_compliance,
        "model": model_used,
        "provider": provider_used,
        "gita_verses_used": len(gita_verses),
        "latency_ms": latency_ms,
    }


# =============================================================================
# HELPER FUNCTIONS for v5.0 Enhanced Pipeline with Five Pillar Compliance
# =============================================================================

# Lazy-initialized Gita validator for Five Pillar scoring
_gita_validator = None


def _get_gita_validator():
    """Lazy import of Gita validator."""
    global _gita_validator
    if _gita_validator is None:
        try:
            from backend.services.gita_validator import GitaValidator
            _gita_validator = GitaValidator()
            logger.info("Viyoga v5.0: GitaValidator with Five Pillar scoring integrated")
        except Exception as e:
            logger.warning(f"Viyoga: GitaValidator unavailable: {e}")
            _gita_validator = False
    return _gita_validator if _gita_validator else None


def _score_five_pillar_compliance(
    response_text: str, secular_mode: bool = True
) -> dict:
    """Score response against the Five Pillars of deep Gita compliance."""
    validator = _get_gita_validator()
    if validator and response_text:
        try:
            return validator.score_five_pillar_compliance(
                response_text, secular_mode=secular_mode
            )
        except Exception as e:
            logger.warning(f"Five Pillar scoring error (continuing): {e}")
    return {"overall_score": 0.0, "compliance_level": "N/A", "error": "scoring_unavailable"}


async def _apply_gita_filter(content: str, user_context: str = "") -> str:
    """Apply Gita wisdom filter to AI-generated content."""
    gita_filter = _get_gita_filter()
    if gita_filter and content:
        try:
            filter_result = await gita_filter.filter_response(
                content=content,
                tool_type="viyoga",
                user_context=user_context,
                enhance_if_needed=True,
            )
            logger.debug(f"Viyoga Gita filter: score={filter_result.wisdom_score:.2f}")
            return filter_result.content
        except Exception as e:
            logger.warning(f"Viyoga Gita filter error (continuing): {e}")
    return content


def _get_session_history(session_id: str) -> list[dict[str, str]]:
    """Get session history for conversation continuity."""
    if not session_id:
        return []
    return SESSION_MEMORY.get(session_id, [])


def _store_session_history(session_id: str, user_message: str, assistant_response: str) -> None:
    """Store conversation turn in session memory."""
    if not session_id:
        return
    entries = SESSION_MEMORY.get(session_id, [])
    entries.append({"role": "user", "content": user_message})
    entries.append({"role": "assistant", "content": assistant_response})
    SESSION_MEMORY[session_id] = entries[-(MAX_SESSION_TURNS * 2):]


def _extract_sections(response_text: str, headings: list[str]) -> dict[str, str]:
    """Extract structured sections from the response text.

    Parses response text looking for section headings (with or without ** markers)
    and extracts the content between them.
    """
    sections: dict[str, str] = {}
    if not response_text or not headings:
        return sections

    # Normalize heading patterns for matching
    text = response_text

    for i, heading in enumerate(headings):
        # Create a key from the heading (lowercase, underscored)
        key = heading.lower().replace(" ", "_").replace("'", "")

        # Try multiple heading formats
        patterns = [
            f"**{heading}**",
            f"*{heading}*",
            heading,
        ]

        start_idx = -1
        heading_len = 0
        for pattern in patterns:
            idx = text.find(pattern)
            if idx >= 0:
                start_idx = idx
                heading_len = len(pattern)
                break

        if start_idx < 0:
            continue

        # Find where content starts (after heading + optional newlines)
        content_start = start_idx + heading_len
        while content_start < len(text) and text[content_start] in ("\n", "\r", " "):
            content_start += 1

        # Find where content ends (next heading or end of text)
        content_end = len(text)
        for next_heading in headings[i + 1:]:
            for pattern in [f"**{next_heading}**", f"*{next_heading}*", next_heading]:
                idx = text.find(pattern, content_start)
                if idx >= 0:
                    content_end = min(content_end, idx)
                    break

        content = text[content_start:content_end].strip()
        if content:
            sections[key] = content

    return sections


def _sanitize_response(response: str) -> str:
    """Remove emojis and clean up the response text."""
    cleaned = response.strip()
    return "".join(char for char in cleaned if not _is_emoji(char))


def _is_emoji(char: str) -> bool:
    """Check if a character is an emoji."""
    return (
        "\U0001F300" <= char <= "\U0001FAFF"
        or "\U00002700" <= char <= "\U000027BF"
        or "\U0001F000" <= char <= "\U0001F02F"
    )


@router.get("/health")
async def viyoga_health():
    """Health check with Gita wisdom, AI analysis, and direct OpenAI status."""
    import os
    gita_verses_loaded = get_verses_count()
    wellness_ready = wellness_model is not None
    ai_analyzer_ready = gita_ai_analyzer is not None
    openai_ready = openai_optimizer.ready and openai_optimizer.client is not None

    return {
        "status": "ok" if (openai_ready or wellness_ready) else "degraded",
        "service": "viyoga",
        "version": "4.0",
        "provider": "gita_repository",
        "pipeline": {
            "concern_analysis": openai_ready,
            "enhanced_retrieval": openai_ready,
            "direct_openai": openai_ready,
            "gita_filter": _get_gita_filter() is not None,
            "wellness_fallback": wellness_ready,
            "verse_fallback": gita_verses_loaded > 0,
        },
        "gita_grounding": {
            "verses_loaded": gita_verses_loaded,
            "repository_ready": gita_ready(),
            "fallback_available": True,
        },
        "ai_analysis": {
            "concern_analysis_model": os.getenv("VIYOGA_ANALYSIS_MODEL", "gpt-4o-mini"),
            "response_model": openai_optimizer.default_model if openai_ready else None,
            "ai_analyzer_ready": ai_analyzer_ready,
            "features": [
                "deep_concern_analysis",
                "attachment_pattern_detection",
                "emotion_recognition",
                "control_analysis",
                "enhanced_verse_retrieval",
                "analysis_aware_prompts",
                "gita_wisdom_filter",
                "session_memory",
            ] if openai_ready else ["keyword_matching_fallback"],
        },
        "wellness_model_ready": wellness_ready,
    }
