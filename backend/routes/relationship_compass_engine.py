"""Relationship Compass Engine - Deep Gita-Grounded Relationship Clarity API.

This router provides relationship guidance deeply grounded in Bhagavad Gita
wisdom from the full 700+ verse corpus. It translates Gita principles into
modern psychology and behavioral clarity, delivering calm, direct, actionable
guidance in plain modern language while ensuring every response traces back
to authentic Gita teachings.

Core features:
- Mode detection: Conflict, Boundary, Repair, Decision, Pattern, Courage
- Mechanism identification: Attachment activation, ego injury, etc.
- Deep Gita wisdom integration: 700+ verse corpus + 20 curated principles
- Gita Wisdom Filter: All AI responses validated for Gita grounding
- Structured responses: Emotional Precision, Mechanism Insight, Hard Truth, Action, Script
- Safety detection for abuse/crisis situations
- Session history for multi-turn conversations
- Multi-provider AI: OpenAI + Sarvam AI with automatic fallback

Endpoints:
    POST /api/relationship-compass-engine/clarity  - Get relationship clarity
    POST /api/relationship-compass-engine/analyze   - Analyze mode and mechanism only
    GET  /api/relationship-compass-engine/modes      - List available modes
    GET  /api/relationship-compass-engine/health     - Health check
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.relationship_compass_engine import (
    EngineAnalysis,
    RelationshipMode,
    ai_analysis,
    build_fallback_response,
    extract_response_sections,
    gather_wisdom_context,
)
from backend.services.relationship_compass_engine_prompt import (
    RELATIONSHIP_ENGINE_SYSTEM_PROMPT,
)
from backend.services.relationship_compass_storage import (
    CompassMessage,
    append_message,
    ensure_session,
    get_recent_messages,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/relationship-compass-engine",
    tags=["relationship-compass-engine"],
)


# ──────────────────────────────────────────────────────────────
# Request / Response Schemas
# ──────────────────────────────────────────────────────────────

class ClarityRequest(BaseModel):
    """Request schema for relationship clarity guidance."""
    model_config = ConfigDict(populate_by_name=True)

    message: str = Field(
        ..., min_length=10, max_length=3000,
        description="Describe your relationship situation",
    )
    session_id: str = Field(
        ..., min_length=1, max_length=128,
        alias="sessionId",
        description="Session identifier for conversation history",
    )
    relationship_type: str = Field(
        "romantic",
        alias="relationshipType",
        description="Type: romantic, family, friendship, workplace, self, community",
    )


class AnalyzeRequest(BaseModel):
    """Request schema for mode/mechanism analysis only."""
    model_config = ConfigDict(populate_by_name=True)

    message: str = Field(
        ..., min_length=10, max_length=3000,
        description="Describe your relationship situation",
    )
    relationship_type: str = Field(
        "romantic",
        alias="relationshipType",
        description="Type of relationship",
    )


# ──────────────────────────────────────────────────────────────
# Main Endpoint: Get Clarity
# ──────────────────────────────────────────────────────────────

@router.post("/clarity")
async def get_clarity(
    payload: ClarityRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Generate relationship clarity guidance.

    This endpoint:
    1. Analyzes the user's situation (mode, emotion, mechanism)
    2. Generates a structured response with emotional precision,
       mechanism insight, hard truth, practical action, and optional script
    3. Stores conversation history for multi-turn support

    Response sections:
    - mode: Detected relationship mode
    - emotional_precision: Named emotion with normalization
    - what_happening: Psychological mechanism at play
    - hard_truth: One firm, grounded truth
    - what_to_do: One clear behavioral step
    - script: Wording for conversations (when relevant)
    """
    message = payload.message.strip()
    session_id = payload.session_id.strip()
    relationship_type = (payload.relationship_type or "romantic").strip().lower()

    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required")

    # Store user message
    ensure_session(session_id)
    history = get_recent_messages(session_id, 20)
    append_message(
        CompassMessage(
            session_id=session_id,
            role="user",
            content=message,
            created_at=datetime.utcnow().isoformat(),
        )
    )

    # Step 1: Analyze the situation
    analysis = await ai_analysis(message, relationship_type)

    logger.info(
        f"Engine analysis: mode={analysis.mode}, "
        f"emotion={analysis.primary_emotion}, "
        f"mechanism={analysis.mechanism}, "
        f"safety={analysis.safety_concern}, "
        f"confidence={analysis.confidence:.2f}"
    )

    # Step 2: Gather Gita wisdom context from 700+ verse corpus + curated principles + dynamic wisdom
    wisdom = await gather_wisdom_context(
        situation=message,
        analysis=analysis,
        relationship_type=relationship_type,
        db=db,
    )

    logger.info(
        f"Wisdom context: {wisdom.get('verses_count', 0)} verses, "
        f"{wisdom.get('principles_count', 0)} principles from "
        f"{wisdom.get('corpus_size', 0)}-verse corpus"
    )

    # Step 3: Generate response with wisdom context
    response_text = None
    sections: dict[str, str] = {}
    provider_used = "fallback"
    model_used = "rule_based"

    # Try AI-powered response generation with wisdom context
    try:
        response_text, provider_used, model_used = await _generate_ai_response(
            message=message,
            analysis=analysis,
            relationship_type=relationship_type,
            history=history,
            wisdom_block=wisdom.get("wisdom_block", ""),
        )

        if response_text:
            # Step 4: Apply Gita Wisdom Filter to validate grounding
            response_text = await _apply_wisdom_filter(response_text, message)
            sections = extract_response_sections(response_text)

    except Exception as e:
        logger.warning(f"AI response generation failed: {e}")

    # Fallback to rule-based response (5-step Gita framework)
    if not response_text or len(sections) < 3:
        logger.info("Using rule-based fallback for Engine response (5-step Gita framework)")
        fallback = build_fallback_response(analysis, message, relationship_type)
        sections = {
            "Step 1: Pause Before Reacting": fallback["step1_pause"],
            "Step 2: Identify the Attachment": fallback["step2_attachment"],
            "Step 3: Regulate Before You Communicate": fallback["step3_regulate"],
            "Step 4: Speak Without Demanding an Outcome": fallback["step4_karma_yoga"],
            "Step 5: See Their Humanity": fallback["step5_equal_vision"],
            "What This Looks Like in Practice": fallback["real_message"],
            "The Real Test": fallback["real_test"],
        }
        response_text = _sections_to_text(fallback["mode"], sections)
        provider_used = "fallback"
        model_used = "rule_based"

    # Store assistant response
    append_message(
        CompassMessage(
            session_id=session_id,
            role="assistant",
            content=response_text,
            created_at=datetime.utcnow().isoformat(),
        )
    )

    return {
        "response": response_text,
        "sections": sections,
        "analysis": {
            "mode": analysis.mode,
            "primary_emotion": analysis.primary_emotion,
            "secondary_emotions": analysis.secondary_emotions,
            "emotional_intensity": analysis.emotional_intensity,
            "mechanism": analysis.mechanism,
            "mechanism_detail": analysis.mechanism_detail,
            "power_dynamic": analysis.power_dynamic,
            "boundary_needed": analysis.boundary_needed,
            "safety_concern": analysis.safety_concern,
            "pattern_identified": analysis.pattern_identified,
            "user_contribution": analysis.user_contribution,
            "core_need": analysis.core_need,
            "confidence": analysis.confidence,
            "analysis_depth": analysis.analysis_depth,
        },
        "wisdom": {
            "verse_citations": wisdom.get("verse_citations", []),
            "principle_citations": wisdom.get("principle_citations", []),
            "verses_used": wisdom.get("verses_count", 0),
            "principles_used": wisdom.get("principles_count", 0),
            "corpus_size": wisdom.get("corpus_size", 0),
            "dynamic_verses": wisdom.get("dynamic_verses_count", 0),
            "learned_wisdom": wisdom.get("learned_wisdom_count", 0),
            "total_sources": wisdom.get("total_sources", 0),
            "confidence": wisdom.get("confidence", 0.0),
            "gita_grounded": wisdom.get("verses_count", 0) > 0,
        },
        "provider": provider_used,
        "model": model_used,
    }


# ──────────────────────────────────────────────────────────────
# Analysis-Only Endpoint
# ──────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_situation(
    payload: AnalyzeRequest,
) -> dict[str, Any]:
    """Analyze mode and mechanism without generating full guidance.

    Returns the detected mode, primary emotion, mechanism, and other
    analysis dimensions. Useful for pre-analysis before requesting
    full clarity guidance.
    """
    message = payload.message.strip()
    relationship_type = (payload.relationship_type or "romantic").strip().lower()

    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    analysis = await ai_analysis(message, relationship_type)

    return {
        "mode": analysis.mode,
        "mode_description": _get_mode_description(analysis.mode),
        "primary_emotion": analysis.primary_emotion,
        "secondary_emotions": analysis.secondary_emotions,
        "emotional_intensity": analysis.emotional_intensity,
        "mechanism": analysis.mechanism,
        "mechanism_detail": analysis.mechanism_detail,
        "power_dynamic": analysis.power_dynamic,
        "boundary_needed": analysis.boundary_needed,
        "safety_concern": analysis.safety_concern,
        "pattern_identified": analysis.pattern_identified,
        "user_contribution": analysis.user_contribution,
        "core_need": analysis.core_need,
        "confidence": analysis.confidence,
        "analysis_depth": analysis.analysis_depth,
    }


# ──────────────────────────────────────────────────────────────
# Reference Endpoints
# ──────────────────────────────────────────────────────────────

@router.get("/modes")
async def list_modes() -> dict[str, Any]:
    """List all available relationship modes with descriptions."""
    return {
        "modes": [
            {
                "id": "conflict",
                "name": "Conflict",
                "description": "Active disagreement, tension, or argument with someone.",
                "indicators": "Fight, argument, disagreement, tension, hostility.",
            },
            {
                "id": "boundary",
                "name": "Boundary",
                "description": "Repeated disrespect, violation of limits, being walked over.",
                "indicators": "Patterns of disrespect, being taken advantage of, crossed lines.",
            },
            {
                "id": "repair",
                "name": "Repair",
                "description": "Needing to apologize, fix damage, or mend something broken.",
                "indicators": "Regret, wanting to make things right, broken trust.",
            },
            {
                "id": "decision",
                "name": "Decision",
                "description": "Uncertainty about what to do, weighing difficult options.",
                "indicators": "Should I stay or go, torn between choices, can't decide.",
            },
            {
                "id": "pattern",
                "name": "Pattern",
                "description": "Recurring dynamic, noticing a cycle that keeps repeating.",
                "indicators": "Keeps happening, same thing every time, stuck in a loop.",
            },
            {
                "id": "courage",
                "name": "Courage",
                "description": "Asking for honest feedback, wanting the hard truth.",
                "indicators": "Be honest with me, am I the problem, don't sugarcoat.",
            },
        ],
    }


@router.get("/health")
async def engine_health() -> dict[str, Any]:
    """Health check for the Relationship Compass Engine with wisdom integration."""
    import os
    openai_key = bool(os.getenv("OPENAI_API_KEY", "").strip())

    # Check provider manager availability
    provider_available = False
    try:
        from backend.services.ai.providers.provider_manager import get_provider_manager
        pm = get_provider_manager()
        provider_available = pm is not None
    except Exception:
        pass

    # Check wisdom core availability
    wisdom_stats: dict[str, Any] = {}
    try:
        from backend.services.relationship_wisdom_core import get_relationship_wisdom_core  # noqa: I001
        rwc = get_relationship_wisdom_core()
        wisdom_stats = rwc.get_corpus_stats()
    except Exception:
        pass

    # Check Gita wisdom filter
    wisdom_filter_ready = False
    try:
        from backend.services.gita_wisdom_filter import get_gita_wisdom_filter
        wf = get_gita_wisdom_filter()
        wisdom_filter_ready = wf is not None
    except Exception:
        pass

    return {
        "status": "ok",
        "service": "relationship-compass-engine",
        "version": "2.0",
        "ai_available": openai_key or provider_available,
        "provider_manager": provider_available,
        "fallback": "rule_based",
        "modes": [m.value for m in RelationshipMode],
        "wisdom_integration": {
            "corpus_loaded": wisdom_stats.get("corpus_loaded", False),
            "total_verses": wisdom_stats.get("total_verses", 0),
            "curated_principles": wisdom_stats.get("curated_principles", 0),
            "themes_indexed": wisdom_stats.get("themes_indexed", 0),
            "keywords_indexed": wisdom_stats.get("keywords_indexed", 0),
            "wisdom_filter_ready": wisdom_filter_ready,
        },
        "capabilities": [
            "mode_detection",
            "emotion_precision",
            "mechanism_identification",
            "safety_detection",
            "structured_guidance",
            "conversation_history",
            "gita_wisdom_700_verses",
            "curated_relationship_principles",
            "gita_wisdom_filter",
            "multi_provider_ai",
        ],
    }


# ──────────────────────────────────────────────────────────────
# Internal Helpers
# ──────────────────────────────────────────────────────────────

async def _generate_ai_response(
    message: str,
    analysis: EngineAnalysis,
    relationship_type: str,
    history: list[dict],
    wisdom_block: str = "",
) -> tuple[str | None, str, str]:
    """Generate AI-powered response using the engine system prompt with Gita wisdom.

    Injects the wisdom context from the 700+ verse corpus into the prompt,
    tries multi-provider manager first (supporting OpenAI + Sarvam AI fallback),
    then direct OpenAI, and returns the response text along with provider info.

    Args:
        message: User's input.
        analysis: Pre-computed analysis of the situation.
        relationship_type: Type of relationship.
        history: Recent conversation history.
        wisdom_block: Formatted Gita wisdom context block from RelationshipWisdomCore.

    Returns:
        Tuple of (response_text, provider_name, model_name).
    """
    # Build the user prompt with analysis context and wisdom
    analysis_context = (
        f"[ANALYSIS CONTEXT - use this to inform your response, do not expose to user]\n"
        f"Detected mode: {analysis.mode}\n"
        f"Primary emotion: {analysis.primary_emotion}\n"
        f"Mechanism: {analysis.mechanism} — {analysis.mechanism_detail}\n"
        f"Emotional intensity: {analysis.emotional_intensity}\n"
        f"Boundary needed: {analysis.boundary_needed}\n"
        f"Safety concern: {analysis.safety_concern}\n"
    )
    if analysis.pattern_identified:
        analysis_context += f"Pattern identified: {analysis.pattern_identified}\n"
    if analysis.user_contribution:
        analysis_context += f"User contribution: {analysis.user_contribution}\n"
    if analysis.core_need:
        analysis_context += f"Core unmet need: {analysis.core_need}\n"
    analysis_context += "[/ANALYSIS CONTEXT]\n\n"

    # Inject Gita wisdom context from the 700+ verse corpus
    wisdom_section = ""
    if wisdom_block:
        wisdom_section = f"{wisdom_block}\n\n"

    user_prompt = (
        f"{analysis_context}"
        f"{wisdom_section}"
        f"Relationship type: {relationship_type}\n\n"
        f"User's situation:\n{message}"
    )

    # Build message history
    history_messages = [
        {"role": entry.get("role", "user"), "content": entry.get("content", "")}
        for entry in history[-10:]  # Last 10 messages for context
    ]

    messages = [
        {"role": "system", "content": RELATIONSHIP_ENGINE_SYSTEM_PROMPT},
        *history_messages,
        {"role": "user", "content": user_prompt},
    ]

    # Try multi-provider manager (supports OpenAI + Sarvam AI with automatic fallback)
    try:
        from backend.services.ai.providers.provider_manager import get_provider_manager
        provider_manager = get_provider_manager()

        if provider_manager:
            response = await provider_manager.chat(
                messages=messages,
                temperature=0.3,
                max_tokens=1500,
                apply_gita_filter=True,
                tool_type="relationship_compass",
                user_context=message,
            )
            if response and response.content and len(response.content.strip()) > 100:
                logger.info(f"Engine response from {response.provider}/{response.model}")
                return response.content, response.provider, response.model
    except Exception as e:
        logger.warning(f"Provider manager failed for engine response: {e}")

    # Fallback: direct OpenAI
    try:
        import os  # noqa: I001
        from openai import OpenAI

        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if api_key:
            model = os.getenv("RELATIONSHIP_ENGINE_CHAT_MODEL", "gpt-4o-mini")
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.3,
                max_tokens=1500,
                timeout=30.0,
            )
            content = response.choices[0].message.content if response.choices else None
            if content and len(content.strip()) > 100:
                logger.info(f"Engine response from OpenAI/{model}")
                return content, "openai", model
    except Exception as e:
        logger.warning(f"Direct OpenAI failed for engine response: {e}")

    return None, "fallback", "rule_based"


async def _apply_wisdom_filter(response_text: str, user_context: str) -> str:
    """Apply Gita Wisdom Filter to validate and enhance response grounding.

    Passes the AI response through the central GitaWisdomFilter to ensure
    it meets minimum Gita grounding requirements. Logs the wisdom score
    for monitoring.

    Args:
        response_text: The AI-generated response.
        user_context: The original user input for contextual enhancement.

    Returns:
        Filtered response text (may be enhanced if wisdom score was low).
    """
    try:
        from backend.services.gita_wisdom_filter import get_gita_wisdom_filter

        wisdom_filter = get_gita_wisdom_filter()
        result = await wisdom_filter.filter_response(
            content=response_text,
            tool_type="relationship_compass",
            user_context=user_context,
            enhance_if_needed=True,
        )

        logger.info(
            f"Wisdom filter: score={result.wisdom_score:.2f}, "
            f"grounded={result.is_gita_grounded}, "
            f"verses={len(result.verses_referenced)}, "
            f"concepts={len(result.gita_concepts_found)}, "
            f"enhanced={result.enhancement_applied}"
        )

        return result.content

    except Exception as e:
        logger.warning(f"Wisdom filter failed (non-critical, using original): {e}")
        return response_text


def _sections_to_text(mode: str, sections: dict[str, str]) -> str:
    """Convert sections dict to formatted response text.

    Supports both the new 5-step Gita framework sections and legacy sections.

    Args:
        mode: The detected mode.
        sections: Dict of section heading to content.

    Returns:
        Formatted text with markdown headings.
    """
    lines = [f"Mode: {mode.replace('_', ' ').title()}", ""]

    # 5-step Gita framework order (preferred)
    section_order = [
        "Step 1: Pause Before Reacting",
        "Step 2: Identify the Attachment",
        "Step 3: Regulate Before You Communicate",
        "Step 4: Speak Without Demanding an Outcome",
        "Step 5: See Their Humanity",
        "What This Looks Like in Practice",
        "The Real Test",
        # Legacy fallback
        "Emotional Precision",
        "What's Actually Happening",
        "The Hard Truth",
        "What To Do",
        "Script",
    ]

    for heading in section_order:
        content = sections.get(heading, "")
        if content:
            lines.append(f"## {heading}")
            lines.append(content)
            lines.append("")

    return "\n".join(lines)


def _get_mode_description(mode: str) -> str:
    """Get human-readable description of a mode.

    Args:
        mode: The mode identifier.

    Returns:
        Description string.
    """
    descriptions = {
        "conflict": "Active disagreement or tension.",
        "boundary": "Repeated disrespect or limit violation.",
        "repair": "Post-conflict repair or apology needed.",
        "decision": "Uncertainty about what to do.",
        "pattern": "Recurring relational dynamic.",
        "courage": "Direct honesty requested.",
    }
    return descriptions.get(mode, "Relationship situation analysis.")
