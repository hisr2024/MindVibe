"""
Karma Reset KIAAN Integration API - Deep Karmic Transformation.

This module provides the API endpoints for deep karma reset, strictly
grounded in Bhagavad Gita wisdom. It replaces the superficial 4-step
guidance with a comprehensive 7-phase karmic transformation powered by
10 Gita-aligned karmic paths.

Endpoints:
- POST /api/karma-reset/kiaan/generate    - Deep karma reset generation
- GET  /api/karma-reset/kiaan/health      - Health check
- GET  /api/karma-reset/kiaan/paths       - Available karmic paths
- POST /api/karma-reset/kiaan/journey-reset - Reset user journey data

The Gita teaches (BG 18.66): "Abandon all dharmas and take refuge in Me alone.
I shall liberate you from all sins; do not grieve."
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user_optional
from backend.services.karma_reset_engine import (
    KarmaResetEngine,
    get_deep_fallback_guidance,  # noqa: F401 — re-exported for backward compat
    get_legacy_fallback_guidance,  # noqa: F401 — re-exported for backward compat
)
from backend.services.gita_karma_wisdom import (
    KARMIC_PATHS,
    SEVEN_PHASES,
)

# Configure logging
logger = logging.getLogger(__name__)

# Create router with KIAAN-specific prefix
router = APIRouter(
    prefix="/api/karma-reset/kiaan",
    tags=["karma-reset", "kiaan-ecosystem"]
)

# ==================== REQUEST/RESPONSE MODELS ====================

class KarmaResetKiaanRequest(BaseModel):
    """Request model for deep KIAAN karma reset."""
    model_config = {"populate_by_name": True}

    situation: str = Field(
        default="",
        max_length=2000,
        description="What happened that needs karma reset"
    )
    feeling: str = Field(
        default="",
        max_length=500,
        description="Who felt the ripple effect"
    )
    repair_type: str = Field(
        default="kshama",
        max_length=100,
        description="Karmic path key (e.g., kshama, satya, shanti) or legacy type (apology, clarification)"
    )
    # Problem analysis context — enriches the 7-phase guidance
    problem_category: str = Field(
        default="",
        max_length=100,
        description="Life problem category (e.g., relationship_conflict, anxiety_health)"
    )
    problem_id: str = Field(
        default="",
        max_length=100,
        description="Specific problem template ID (e.g., hurt_partner)"
    )
    shad_ripu: str = Field(
        default="",
        max_length=32,
        description="Identified inner enemy (kama, krodha, lobha, moha, mada, matsarya)"
    )
    healing_insight: str = Field(
        default="",
        max_length=1000,
        description="Gita-grounded healing insight for this problem"
    )


class CoreVerseData(BaseModel):
    """Core Gita verse with full Sanskrit and translation."""

    chapter: int = Field(description="Gita chapter number")
    verse: int = Field(description="Verse number within chapter")
    sanskrit: str = Field(description="Original Sanskrit (Devanagari)")
    transliteration: str = Field(default="", description="IAST transliteration")
    english: str = Field(description="English translation")
    hindi: str = Field(default="", description="Hindi translation")


class KarmicPathData(BaseModel):
    """Resolved karmic path information."""

    key: str = Field(description="Path identifier key")
    name: str = Field(description="Full path name with Sanskrit")
    sanskrit_name: str = Field(description="Sanskrit name in Devanagari")
    description: str = Field(description="Path description")
    gita_principle: str = Field(description="Core Gita principle behind this path")
    karmic_teaching: str = Field(description="Deep karmic teaching explaining the wisdom")
    guna_analysis: str = Field(description="Analysis of which guna drives the harmful action")
    themes: list[str] = Field(default_factory=list, description="Thematic keywords")


class PhaseGuidance(BaseModel):
    """Guidance for a single phase of the 7-phase karma reset."""

    phase: int = Field(description="Phase number (1-7)")
    name: str = Field(description="Sanskrit phase name")
    sanskrit_name: str = Field(description="Sanskrit name in Devanagari")
    english_name: str = Field(description="English phase name")
    icon: str = Field(description="Icon identifier")
    guidance: str = Field(description="Personalized guidance for this phase")


class DeepResetGuidance(BaseModel):
    """Complete 7-phase deep karma reset guidance."""

    phases: list[PhaseGuidance] = Field(description="7-phase personalized guidance")
    sadhana: list[str] = Field(description="Daily practices for sustained karmic repair")
    core_verse: CoreVerseData = Field(description="Primary Gita verse for this path")
    supporting_verses: list[dict] = Field(
        default_factory=list,
        description="Supporting verses with key teachings"
    )


class KiaanMetadata(BaseModel):
    """KIAAN ecosystem metadata with Five Pillar compliance."""

    verses_used: int = Field(description="Number of Gita verses used")
    verses: list[dict] = Field(description="Verse information for display")
    validation_passed: bool = Field(description="Whether validation passed")
    validation_score: float = Field(description="Overall validation score (0.0 to 1.0)")
    five_pillar_score: float = Field(default=0.0, description="Five Pillar compliance score")
    compliance_level: str = Field(default="", description="Compliance level (e.g., '8/10')")
    pillars_met: int = Field(default=0, description="Number of pillars met (out of 5)")
    gita_terms_found: list[str] = Field(
        default_factory=list, description="Gita terms found in response"
    )
    wisdom_context: str = Field(default="", description="Wisdom context summary")


class KarmaResetKiaanResponse(BaseModel):
    """Response model for deep KIAAN karma reset."""

    karmic_path: KarmicPathData = Field(description="Resolved karmic path data")
    deep_guidance: DeepResetGuidance = Field(description="7-phase deep guidance")
    reset_guidance: dict = Field(description="Legacy 4-part guidance for backward compat")
    kiaan_metadata: KiaanMetadata = Field(description="KIAAN ecosystem metadata")
    meta: Optional[dict] = Field(None, description="Request metadata")



# ==================== ENGINE + SERVICE ====================

karma_engine = KarmaResetEngine()

# Expose ready/client for the journey-reset endpoint and backward compat
ready = karma_engine.ready
client = karma_engine._client  # noqa: SLF001 — needed for journey-reset endpoint
karma_reset_service = karma_engine.service


# ==================== ENDPOINTS ====================

@router.post("/generate", response_model=KarmaResetKiaanResponse)
async def generate_kiaan_karma_reset(
    request: Request,
    body: KarmaResetKiaanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str | None = Depends(get_current_user_optional)
) -> KarmaResetKiaanResponse:
    """
    Generate deep karma reset guidance with KIAAN ecosystem integration.

    This endpoint provides a comprehensive 7-phase karmic transformation
    grounded in Bhagavad Gita wisdom through 10 Gita-aligned karmic paths.

    The response includes:
    - Resolved karmic path with full Gita teachings
    - 7-phase personalized guidance (AI-generated when available)
    - Core and supporting Gita verses with full Sanskrit
    - Daily sadhana (spiritual practices) for sustained transformation
    - Five Pillar compliance scoring
    - Legacy 4-part guidance for backward compatibility
    """
    request_id = str(uuid.uuid4())[:8]
    start_time = datetime.now()

    # Extract and normalize request data
    situation = body.situation or "A moment that created a karmic ripple"
    feeling = body.feeling or "Someone I care about"
    path_key = body.repair_type or "kshama"

    # Problem analysis context
    problem_category = body.problem_category or ""
    problem_id = body.problem_id or ""
    shad_ripu = body.shad_ripu or ""
    healing_insight = body.healing_insight or ""

    logger.info(
        f"[{request_id}] Deep KIAAN Karma Reset request",
        extra={
            "request_id": request_id,
            "situation_length": len(situation),
            "karmic_path": path_key,
            "problem_category": problem_category,
            "shad_ripu": shad_ripu,
        }
    )

    # Delegate full pipeline to the Karma Reset Engine
    engine_result = await karma_engine.generate(
        db=db,
        path_key=path_key,
        situation=situation,
        feeling=feeling,
        problem_category=problem_category,
        problem_id=problem_id,
        shad_ripu=shad_ripu,
        healing_insight=healing_insight,
    )

    # Build typed Pydantic response from engine result
    karmic_path_data = KarmicPathData(
        key=engine_result["karmic_path"].get("key", path_key),
        name=engine_result["karmic_path"].get("name", ""),
        sanskrit_name=engine_result["karmic_path"].get("sanskrit_name", ""),
        description=engine_result["karmic_path"].get("description", ""),
        gita_principle=engine_result["karmic_path"].get("gita_principle", ""),
        karmic_teaching=engine_result["karmic_path"].get("karmic_teaching", ""),
        guna_analysis=engine_result["karmic_path"].get("guna_analysis", ""),
        themes=engine_result["karmic_path"].get("themes", []),
    )

    dg = engine_result["deep_guidance"]
    core_verse = dg.get("core_verse", {})
    deep_guidance = DeepResetGuidance(
        phases=[PhaseGuidance(**p) for p in dg.get("phases", [])],
        sadhana=dg.get("sadhana", []),
        core_verse=CoreVerseData(
            chapter=core_verse.get("chapter", 0),
            verse=core_verse.get("verse", 0),
            sanskrit=core_verse.get("sanskrit", ""),
            transliteration=core_verse.get("transliteration", ""),
            english=core_verse.get("english", ""),
            hindi=core_verse.get("hindi", ""),
        ),
        supporting_verses=dg.get("supporting_verses", []),
    )

    km = engine_result["kiaan_metadata"]
    kiaan_metadata = KiaanMetadata(
        verses_used=km.get("verses_used", 0),
        verses=km.get("verses", []),
        validation_passed=km.get("validation_passed", False),
        validation_score=km.get("validation_score", 0.0),
        five_pillar_score=km.get("five_pillar_score", 0.0),
        compliance_level=km.get("compliance_level", ""),
        pillars_met=km.get("pillars_met", 0),
        gita_terms_found=km.get("gita_terms_found", []),
        wisdom_context=km.get("wisdom_context", ""),
    )

    elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)

    logger.info(
        f"[{request_id}] Deep KIAAN Karma Reset completed in {elapsed_ms}ms",
        extra={
            "verses_used": km.get("verses_used", 0),
            "karmic_path": path_key,
            "five_pillar_score": km.get("five_pillar_score", 0.0),
            "validation_passed": km.get("validation_passed", False),
        }
    )

    return KarmaResetKiaanResponse(
        karmic_path=karmic_path_data,
        deep_guidance=deep_guidance,
        reset_guidance=engine_result["reset_guidance"],
        kiaan_metadata=kiaan_metadata,
        meta={
            "request_id": request_id,
            "processing_time_ms": elapsed_ms,
            "model_used": engine_result.get("model_used", "fallback"),
            "kiaan_enhanced": True,
            "deep_reset_version": "2.0",
            "phases_count": 7,
            "karmic_paths_available": len(KARMIC_PATHS),
        }
    )


@router.get("/paths")
async def get_karmic_paths():
    """
    Get all available karmic paths for frontend display.

    Returns the 10 Gita-aligned karmic repair paths with their
    names, Sanskrit names, descriptions, and key identifiers.
    """
    paths = karma_reset_service.get_available_paths()
    return {
        "paths": paths,
        "total": len(paths),
        "phases": karma_reset_service.get_phase_definitions(),
        "phases_count": len(SEVEN_PHASES),
    }


@router.get("/health")
async def kiaan_health_check():
    """Health check endpoint for KIAAN karma reset integration."""
    return {
        "status": "healthy",
        "service": "karma-reset-kiaan",
        "openai_ready": ready,
        "version": "2.0.0",
        "features": {
            "deep_reset": True,
            "karmic_paths": len(KARMIC_PATHS),
            "seven_phases": True,
            "five_pillar_compliance": True,
            "gita_core_wisdom": True,
        }
    }


# ==================== JOURNEY RESET ENDPOINT ====================

class JourneyResetRequest(BaseModel):
    """Request model for journey reset with KIAAN guidance."""

    confirm: bool = Field(description="Confirmation to proceed with reset")
    reason: str = Field(
        default="Fresh start",
        max_length=500,
        description="Reason for journey reset"
    )


class JourneyResetResponse(BaseModel):
    """Response model for journey reset."""

    success: bool = Field(description="Whether reset was successful")
    message: str = Field(description="Human-readable message")
    kiaan_wisdom: dict = Field(description="KIAAN wisdom for fresh start")
    details: dict = Field(description="What was reset")
    timestamp: str = Field(description="When reset occurred")


@router.post("/journey-reset", response_model=JourneyResetResponse)
async def reset_user_journey(
    request: JourneyResetRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_optional)
) -> JourneyResetResponse:
    """
    Reset user's KIAAN journey data with wisdom-based fresh start guidance.

    This endpoint resets:
    - User emotional logs
    - Daily analysis records
    - Weekly reflections
    - Assessments
    - Journey progress tracking
    """
    request_id = str(uuid.uuid4())[:8]
    start_time = datetime.now()

    logger.info(
        f"[{request_id}] Journey reset requested by user {user_id}",
        extra={"user_id": user_id, "reason": request.reason}
    )

    if not request.confirm:
        raise HTTPException(
            status_code=400,
            detail="Journey reset confirmation required. Set 'confirm' to true."
        )

    reset_details = {
        "emotional_logs_deleted": 0,
        "daily_analyses_deleted": 0,
        "weekly_reflections_deleted": 0,
        "assessments_deleted": 0,
        "journey_progress_deleted": 0,
        "verses_bookmarked_deleted": 0
    }

    try:
        logger.info(f"[{request_id}] Deleting user journey data...")

        result = await db.execute(
            text("DELETE FROM user_emotional_logs WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["emotional_logs_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_daily_analysis WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["daily_analyses_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_weekly_reflections WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["weekly_reflections_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_assessments WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["assessments_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_journey_progress WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["journey_progress_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_verses_bookmarked WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["verses_bookmarked_deleted"] = result.rowcount

        await db.commit()

        logger.info(
            f"[{request_id}] Journey data deleted successfully",
            extra=reset_details
        )

        # Generate KIAAN wisdom for fresh start using Gita's teaching on new beginnings
        kiaan_wisdom = {}

        if ready and client:
            try:
                verse_results = await karma_reset_service.get_reset_verses(
                    db=db,
                    repair_type="tyaga",
                    situation="Beginning anew with fresh perspective and surrender",
                    limit=3
                )

                wisdom_context = karma_reset_service.build_gita_context(
                    verse_results=verse_results,
                    repair_type="tyaga"
                )

                prompt = f"""You are KIAAN, a sacred wisdom guide. A seeker has reset their journey to begin anew.

Reason: "{request.reason}"

{wisdom_context}

Provide deep Gita-grounded wisdom for their fresh start in JSON format:
{{
  "breathingLine": "1-2 sentences for centering, referencing pranayama",
  "acknowledgment": "2-3 sentences acknowledging their courage, referencing BG 6.5 (self-upliftment)",
  "wisdom": "3-4 sentences of ancient Gita wisdom for new beginnings, referencing tyaga and nishkama karma",
  "intention": "2-3 sentences for forward-looking sankalpa (sacred intention)"
}}

Tone: warm, encouraging, deeply wise, grounded in Gita. Not generic self-help.
"""

                response = await client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": "Generate fresh start wisdom in JSON."}
                    ],
                    temperature=0.8,
                    max_tokens=500,
                    response_format={"type": "json_object"}
                )

                wisdom_text = "{}"
                if response and response.choices and len(response.choices) > 0:
                    response_msg = response.choices[0].message
                    if response_msg and response_msg.content:
                        wisdom_text = response_msg.content
                kiaan_wisdom = json.loads(wisdom_text)

            except Exception as e:
                logger.error(f"[{request_id}] Error generating KIAAN wisdom: {str(e)}")
                kiaan_wisdom = _get_fresh_start_fallback()
        else:
            kiaan_wisdom = _get_fresh_start_fallback()

        elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        logger.info(
            f"[{request_id}] Journey reset completed in {elapsed_ms}ms",
            extra={"total_deleted": sum(reset_details.values())}
        )

        return JourneyResetResponse(
            success=True,
            message="Your journey has been reset. Begin anew with KIAAN's wisdom.",
            kiaan_wisdom=kiaan_wisdom,
            details=reset_details,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        await db.rollback()
        logger.error(
            f"[{request_id}] Journey reset failed: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Journey reset failed. Please try again later."
        )


def _get_fresh_start_fallback() -> dict:
    """Fallback wisdom for fresh start, grounded in Gita teachings."""
    return {
        "breathingLine": "Take a deep, purifying breath. As the Gita teaches, pranayama calms the agitated mind and prepares it for fresh perception. This breath marks the beginning of a new chapter.",
        "acknowledgment": "You have chosen to begin anew — and the Gita honors this courage. BG 6.5 teaches: 'Let one lift oneself by one's own Self; let not one degrade oneself.' By choosing renewal, you are lifting yourself toward your highest nature.",
        "wisdom": "The Gita teaches that true renunciation (tyaga) is not giving up action, but giving up attachment to results. Your past journey produced fruits — some sweet, some bitter. Release them all. The wisdom gained remains; the attachment dissolves. As the eternal atman, you are untouched by what has passed. Every moment offers a fresh beginning to one who has the eyes to see it.",
        "intention": "Set your sankalpa: 'I begin this journey with nishkama bhava — without attachment to outcomes, but with full dedication to the path. Each step is my offering. Each insight is grace.' Walk forward with the steady wisdom of the sthitaprajna."
    }
