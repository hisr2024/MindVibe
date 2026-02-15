"""Relationship Compass Engine - Modern, Secular Relationship Clarity API.

This router provides relationship guidance that translates Bhagavad Gita
principles into modern psychology and behavioral clarity. Unlike the
original Relationship Compass (which uses Sanskrit terminology and verse
citations), this engine delivers calm, direct, actionable guidance in
plain modern language.

Core features:
- Mode detection: Conflict, Boundary, Repair, Decision, Pattern, Courage
- Mechanism identification: Attachment activation, ego injury, etc.
- Structured responses: Emotional Precision, Mechanism Insight, Hard Truth, Action, Script
- Safety detection for abuse/crisis situations
- Session history for multi-turn conversations

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
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.relationship_compass_engine import (
    EngineAnalysis,
    RelationshipMode,
    ai_analysis,
    build_fallback_response,
    detect_mode,
    detect_safety_concern,
    extract_response_sections,
    rule_based_analysis,
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

    # Step 2: Generate response
    response_text = None
    sections: dict[str, str] = {}
    provider_used = "fallback"
    model_used = "rule_based"

    # Try AI-powered response generation
    try:
        response_text, provider_used, model_used = await _generate_ai_response(
            message=message,
            analysis=analysis,
            relationship_type=relationship_type,
            history=history,
        )

        if response_text:
            sections = extract_response_sections(response_text)

    except Exception as e:
        logger.warning(f"AI response generation failed: {e}")

    # Fallback to rule-based response
    if not response_text or len(sections) < 3:
        logger.info("Using rule-based fallback for Engine response")
        fallback = build_fallback_response(analysis, message, relationship_type)
        sections = {
            "Emotional Precision": fallback["emotional_precision"],
            "What's Actually Happening": fallback["what_happening"],
            "The Hard Truth": fallback["hard_truth"],
            "What To Do": fallback["what_to_do"],
            "Script": fallback["script"],
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
        "provider": provider_used,
        "model": model_used,
    }


# ──────────────────────────────────────────────────────────────
# Analysis-Only Endpoint
# ──────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_situation(
    payload: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
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
    """Health check for the Relationship Compass Engine."""
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

    return {
        "status": "ok",
        "service": "relationship-compass-engine",
        "version": "1.0",
        "ai_available": openai_key or provider_available,
        "provider_manager": provider_available,
        "fallback": "rule_based",
        "modes": [m.value for m in RelationshipMode],
        "capabilities": [
            "mode_detection",
            "emotion_precision",
            "mechanism_identification",
            "safety_detection",
            "structured_guidance",
            "conversation_history",
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
) -> tuple[str | None, str, str]:
    """Generate AI-powered response using the engine system prompt.

    Tries multi-provider manager first, then direct OpenAI, and returns
    the response text along with provider and model info.

    Args:
        message: User's input.
        analysis: Pre-computed analysis of the situation.
        relationship_type: Type of relationship.
        history: Recent conversation history.

    Returns:
        Tuple of (response_text, provider_name, model_name).
    """
    # Build the user prompt with analysis context
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

    user_prompt = (
        f"{analysis_context}"
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

    # Try multi-provider manager
    try:
        from backend.services.ai.providers.provider_manager import get_provider_manager
        provider_manager = get_provider_manager()

        if provider_manager:
            response = await provider_manager.chat(
                messages=messages,
                temperature=0.3,
                max_tokens=1200,
            )
            if response and response.content and len(response.content.strip()) > 100:
                logger.info(f"Engine response from {response.provider}/{response.model}")
                return response.content, response.provider, response.model
    except Exception as e:
        logger.warning(f"Provider manager failed for engine response: {e}")

    # Fallback: direct OpenAI
    try:
        import os
        from openai import OpenAI

        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if api_key:
            model = os.getenv("RELATIONSHIP_ENGINE_CHAT_MODEL", "gpt-4o-mini")
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.3,
                max_tokens=1200,
                timeout=30.0,
            )
            content = response.choices[0].message.content if response.choices else None
            if content and len(content.strip()) > 100:
                logger.info(f"Engine response from OpenAI/{model}")
                return content, "openai", model
    except Exception as e:
        logger.warning(f"Direct OpenAI failed for engine response: {e}")

    return None, "fallback", "rule_based"


def _sections_to_text(mode: str, sections: dict[str, str]) -> str:
    """Convert sections dict to formatted response text.

    Args:
        mode: The detected mode.
        sections: Dict of section heading to content.

    Returns:
        Formatted text with markdown headings.
    """
    lines = [f"Mode: {mode.replace('_', ' ').title()}", ""]

    section_order = [
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
