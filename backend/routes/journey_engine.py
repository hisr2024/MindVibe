"""
Journey Engine API Routes - REST API for Journey Management.

This module provides API endpoints for:
1. Journey template discovery and browsing
2. Journey lifecycle (start, pause, resume, complete)
3. Daily step delivery and completion
4. User dashboard and progress tracking
5. Enemy progress visualization

Base URL: /api/journey-engine

Endpoints:
    Templates:
        GET  /templates              - List available templates
        GET  /templates/{id}         - Get template details
        GET  /templates/slug/{slug}  - Get template by slug

    Journeys:
        GET    /journeys             - List user's journeys
        POST   /journeys             - Start a new journey
        GET    /journeys/{id}        - Get journey details
        POST   /journeys/{id}/pause  - Pause journey
        POST   /journeys/{id}/resume - Resume journey
        DELETE /journeys/{id}        - Abandon journey

    Steps:
        GET  /journeys/{id}/steps/current   - Get current step
        GET  /journeys/{id}/steps/{day}     - Get specific step
        POST /journeys/{id}/steps/{day}/complete - Complete step

    Dashboard:
        GET  /dashboard              - Get user's journey dashboard
        GET  /enemies                - List enemies with info
        GET  /enemies/{enemy}        - Get enemy progress
        GET  /examples/{enemy}       - Get modern examples

Usage:
    Include in FastAPI app:

    from backend.routes.journey_engine import router as journey_engine_router
    app.include_router(journey_engine_router, prefix="/api/journey-engine")
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user, get_db
from backend.services.journey_engine import (
    JourneyEngineService,
    MultiJourneyManager,
    EnemyProgressTracker,
    ModernExamplesDB,
)
from backend.services.journey_engine.journey_engine_service import (
    JourneyEngineError,
    JourneyNotFoundError,
    TemplateNotFoundError,
    JourneyAlreadyCompletedError,
    StepNotAvailableError,
    MaxActiveJourneysError,
    ENEMY_LABELS,
)
from backend.services.journey_engine.template_generator import ENEMY_METADATA, EnemyType

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Journey Engine"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class PersonalizationSettings(BaseModel):
    """User personalization settings for a journey."""

    pace: str = Field(default="daily", description="Pace: daily, every_other_day, weekly")
    time_budget_minutes: int = Field(default=10, ge=5, le=60, description="Daily time budget")
    focus_tags: list[str] = Field(default_factory=list, description="Focus enemy tags")
    preferred_tone: str = Field(default="gentle", description="Tone: gentle, direct, inspiring")
    provider_preference: str = Field(default="auto", description="AI provider preference")


class StartJourneyRequest(BaseModel):
    """Request to start a new journey."""

    template_id: str = Field(..., description="Template ID to start")
    personalization: PersonalizationSettings | None = Field(
        default=None, description="Optional personalization settings"
    )


class CompleteStepRequest(BaseModel):
    """Request to complete a journey step."""

    reflection: str | None = Field(default=None, max_length=5000, description="User reflection")
    check_in: dict[str, Any] | None = Field(default=None, description="Check-in data")


class TemplateResponse(BaseModel):
    """Response model for a journey template."""

    id: str
    slug: str
    title: str
    description: str | None
    primary_enemy_tags: list[str]
    duration_days: int
    difficulty: int
    is_featured: bool
    is_free: bool
    icon_name: str | None
    color_theme: str | None


class TemplateListResponse(BaseModel):
    """Response model for template list."""

    templates: list[TemplateResponse]
    total: int
    limit: int
    offset: int


class JourneyResponse(BaseModel):
    """Response model for a user journey."""

    journey_id: str
    template_slug: str
    title: str
    status: str
    current_day: int
    total_days: int
    progress_percentage: float
    days_completed: int
    started_at: str | None
    last_activity: str | None
    primary_enemies: list[str]
    streak_days: int


class JourneyListResponse(BaseModel):
    """Response model for journey list."""

    journeys: list[JourneyResponse]
    total: int
    limit: int
    offset: int


class VerseContent(BaseModel):
    """Verse content in a step."""

    chapter: int
    verse: int
    sanskrit: str | None
    hindi: str | None
    english: str
    transliteration: str | None
    theme: str | None


class StepResponse(BaseModel):
    """Response model for a daily step."""

    step_id: str
    journey_id: str
    day_index: int
    step_title: str
    teaching: str
    guided_reflection: list[str]
    practice: dict[str, Any]
    verse_refs: list[dict[str, int]]
    verses: list[VerseContent]
    micro_commitment: str | None
    check_in_prompt: dict[str, str] | None
    safety_note: str | None
    is_completed: bool
    completed_at: str | None


class EnemyInfo(BaseModel):
    """Information about an inner enemy."""

    enemy: str
    sanskrit: str
    english: str
    description: str
    label: str
    key_verse: dict[str, int]
    themes: list[str]
    antidotes: list[str]
    modern_contexts: list[str]


class EnemyProgressResponse(BaseModel):
    """Progress against an inner enemy."""

    enemy: str
    enemy_label: str
    journeys_started: int
    journeys_completed: int
    total_days_practiced: int
    current_streak: int
    best_streak: int
    last_practice: str | None
    mastery_level: int


class DashboardResponse(BaseModel):
    """User's journey dashboard."""

    active_journeys: list[JourneyResponse]
    completed_journeys: int
    total_days_practiced: int
    current_streak: int
    enemy_progress: list[EnemyProgressResponse]
    recommended_templates: list[dict[str, Any]]
    today_steps: list[StepResponse]


class ExampleResponse(BaseModel):
    """A modern example for an enemy."""

    enemy: str
    category: str
    scenario: str
    how_enemy_manifests: str
    gita_verse_ref: dict[str, int]
    gita_wisdom: str
    practical_antidote: str
    reflection_question: str


class ExampleListResponse(BaseModel):
    """List of modern examples."""

    examples: list[ExampleResponse]
    total: int
    enemy: str


class CompletionResponse(BaseModel):
    """Response after completing a step."""

    success: bool
    day_completed: int
    journey_complete: bool
    next_day: int | None
    progress_percentage: float


# =============================================================================
# DEPENDENCY INJECTION
# =============================================================================


async def get_journey_service(
    db: AsyncSession = Depends(get_db),
) -> JourneyEngineService:
    """Get journey engine service instance."""
    return JourneyEngineService(db)


async def get_examples_db() -> ModernExamplesDB:
    """Get modern examples database instance."""
    return ModernExamplesDB()


# =============================================================================
# TEMPLATE ENDPOINTS
# =============================================================================


@router.get("/templates", response_model=TemplateListResponse)
async def list_templates(
    enemy: str | None = Query(None, description="Filter by enemy tag"),
    difficulty_max: int | None = Query(None, ge=1, le=5, description="Max difficulty"),
    free_only: bool = Query(False, description="Only free templates"),
    featured_only: bool = Query(False, description="Only featured templates"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    offset: int = Query(0, ge=0, description="Offset"),
    service: JourneyEngineService = Depends(get_journey_service),
):
    """
    List available journey templates.

    Templates can be filtered by enemy type, difficulty, and pricing.
    """
    templates, total = await service.list_templates(
        enemy_filter=enemy,
        difficulty_max=difficulty_max,
        free_only=free_only,
        featured_only=featured_only,
        limit=limit,
        offset=offset,
    )

    return TemplateListResponse(
        templates=[
            TemplateResponse(
                id=t.id,
                slug=t.slug,
                title=t.title,
                description=t.description,
                primary_enemy_tags=t.primary_enemy_tags or [],
                duration_days=t.duration_days,
                difficulty=t.difficulty,
                is_featured=t.is_featured,
                is_free=t.is_free,
                icon_name=t.icon_name,
                color_theme=t.color_theme,
            )
            for t in templates
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/templates/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
):
    """Get a specific template by ID."""
    try:
        template = await service.get_template(template_id)
        return TemplateResponse(
            id=template.id,
            slug=template.slug,
            title=template.title,
            description=template.description,
            primary_enemy_tags=template.primary_enemy_tags or [],
            duration_days=template.duration_days,
            difficulty=template.difficulty,
            is_featured=template.is_featured,
            is_free=template.is_free,
            icon_name=template.icon_name,
            color_theme=template.color_theme,
        )
    except TemplateNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/templates/slug/{slug}", response_model=TemplateResponse)
async def get_template_by_slug(
    slug: str,
    service: JourneyEngineService = Depends(get_journey_service),
):
    """Get a template by its slug."""
    try:
        template = await service.get_template_by_slug(slug)
        return TemplateResponse(
            id=template.id,
            slug=template.slug,
            title=template.title,
            description=template.description,
            primary_enemy_tags=template.primary_enemy_tags or [],
            duration_days=template.duration_days,
            difficulty=template.difficulty,
            is_featured=template.is_featured,
            is_free=template.is_free,
            icon_name=template.icon_name,
            color_theme=template.color_theme,
        )
    except TemplateNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# =============================================================================
# JOURNEY ENDPOINTS
# =============================================================================


@router.get("/journeys", response_model=JourneyListResponse)
async def list_journeys(
    status_filter: str | None = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    offset: int = Query(0, ge=0, description="Offset"),
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """
    List user's journeys.

    Returns all journeys for the authenticated user, optionally filtered by status.
    """
    user_id = current_user

    stats, total = await service.list_user_journeys(
        user_id=user_id,
        status_filter=status_filter,
        limit=limit,
        offset=offset,
    )

    return JourneyListResponse(
        journeys=[
            JourneyResponse(
                journey_id=s.journey_id,
                template_slug=s.template_slug,
                title=s.title,
                status=s.status,
                current_day=s.current_day,
                total_days=s.total_days,
                progress_percentage=s.progress_percentage,
                days_completed=s.days_completed,
                started_at=s.started_at.isoformat() if s.started_at else None,
                last_activity=s.last_activity.isoformat() if s.last_activity else None,
                primary_enemies=s.primary_enemies,
                streak_days=s.streak_days,
            )
            for s in stats
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/journeys", response_model=JourneyResponse, status_code=status.HTTP_201_CREATED)
async def start_journey(
    request: StartJourneyRequest,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new journey.

    Users can have up to 5 active journeys simultaneously.
    """
    user_id = current_user

    try:
        personalization = None
        if request.personalization:
            personalization = request.personalization.model_dump()

        journey = await service.start_journey(
            user_id=user_id,
            template_id=request.template_id,
            personalization=personalization,
        )

        await db.commit()

        # Get stats for response
        stats = await service.get_journey(user_id, journey.id)

        return JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )

    except MaxActiveJourneysError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TemplateNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error starting journey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to start journey")


@router.get("/journeys/{journey_id}", response_model=JourneyResponse)
async def get_journey(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """Get detailed information about a specific journey."""
    user_id = current_user

    try:
        stats = await service.get_journey(user_id, journey_id)

        return JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )
    except JourneyNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/journeys/{journey_id}/pause", response_model=JourneyResponse)
async def pause_journey(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pause an active journey."""
    user_id = current_user

    try:
        await service.pause_journey(user_id, journey_id)
        await db.commit()

        stats = await service.get_journey(user_id, journey_id)

        return JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )
    except JourneyNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except JourneyEngineError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/journeys/{journey_id}/resume", response_model=JourneyResponse)
async def resume_journey(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resume a paused journey."""
    user_id = current_user

    try:
        await service.resume_journey(user_id, journey_id)
        await db.commit()

        stats = await service.get_journey(user_id, journey_id)

        return JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )
    except JourneyNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except JourneyEngineError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/journeys/{journey_id}", response_model=JourneyResponse)
async def abandon_journey(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Abandon a journey (mark as abandoned, not deleted)."""
    user_id = current_user

    try:
        await service.abandon_journey(user_id, journey_id)
        await db.commit()

        stats = await service.get_journey(user_id, journey_id)

        return JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )
    except JourneyNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except JourneyAlreadyCompletedError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# STEP ENDPOINTS
# =============================================================================


@router.get("/journeys/{journey_id}/steps/current", response_model=StepResponse | None)
async def get_current_step(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """
    Get the current step for a journey.

    Returns null if journey is paused or completed.
    """
    user_id = current_user

    try:
        step = await service.get_current_step(user_id, journey_id)

        if step is None:
            return None

        return StepResponse(
            step_id=step.step_id,
            journey_id=step.journey_id,
            day_index=step.day_index,
            step_title=step.step_title,
            teaching=step.teaching,
            guided_reflection=step.guided_reflection,
            practice=step.practice,
            verse_refs=step.verse_refs,
            verses=[
                VerseContent(
                    chapter=v["chapter"],
                    verse=v["verse"],
                    sanskrit=v.get("sanskrit"),
                    hindi=v.get("hindi"),
                    english=v["english"],
                    transliteration=v.get("transliteration"),
                    theme=v.get("theme"),
                )
                for v in step.verses
            ],
            micro_commitment=step.micro_commitment,
            check_in_prompt=step.check_in_prompt,
            safety_note=step.safety_note,
            is_completed=step.is_completed,
            completed_at=step.completed_at.isoformat() if step.completed_at else None,
        )
    except JourneyNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/journeys/{journey_id}/steps/{day_index}", response_model=StepResponse)
async def get_step(
    journey_id: str,
    day_index: int,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """Get a specific step by day index."""
    user_id = current_user

    try:
        step = await service.get_step(user_id, journey_id, day_index)

        return StepResponse(
            step_id=step.step_id,
            journey_id=step.journey_id,
            day_index=step.day_index,
            step_title=step.step_title,
            teaching=step.teaching,
            guided_reflection=step.guided_reflection,
            practice=step.practice,
            verse_refs=step.verse_refs,
            verses=[
                VerseContent(
                    chapter=v["chapter"],
                    verse=v["verse"],
                    sanskrit=v.get("sanskrit"),
                    hindi=v.get("hindi"),
                    english=v["english"],
                    transliteration=v.get("transliteration"),
                    theme=v.get("theme"),
                )
                for v in step.verses
            ],
            micro_commitment=step.micro_commitment,
            check_in_prompt=step.check_in_prompt,
            safety_note=step.safety_note,
            is_completed=step.is_completed,
            completed_at=step.completed_at.isoformat() if step.completed_at else None,
        )
    except JourneyNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except StepNotAvailableError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/journeys/{journey_id}/steps/{day_index}/complete", response_model=CompletionResponse)
async def complete_step(
    journey_id: str,
    day_index: int,
    request: CompleteStepRequest,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Complete a journey step.

    Marks the step as complete and optionally saves the user's reflection.
    """
    user_id = current_user

    try:
        result = await service.complete_step(
            user_id=user_id,
            journey_id=journey_id,
            day_index=day_index,
            reflection=request.reflection,
            check_in=request.check_in,
        )

        await db.commit()

        return CompletionResponse(
            success=result["success"],
            day_completed=result["day_completed"],
            journey_complete=result["journey_complete"],
            next_day=result["next_day"],
            progress_percentage=result["progress_percentage"],
        )
    except JourneyNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except StepNotAvailableError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except JourneyEngineError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# DASHBOARD ENDPOINTS
# =============================================================================


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """
    Get user's journey dashboard.

    Includes active journeys, enemy progress, recommendations, and today's steps.
    """
    user_id = current_user

    try:
        dashboard = await service.get_dashboard(user_id)
    except Exception as e:
        logger.error(f"Dashboard error for user {user_id}: {e}", exc_info=True)
        # Return empty dashboard on error instead of 500
        return DashboardResponse(
            active_journeys=[],
            completed_journeys=0,
            total_days_practiced=0,
            current_streak=0,
            enemy_progress=[],
            recommended_templates=[],
            today_steps=[],
        )

    return DashboardResponse(
        active_journeys=[
            JourneyResponse(
                journey_id=j.journey_id,
                template_slug=j.template_slug,
                title=j.title,
                status=j.status,
                current_day=j.current_day,
                total_days=j.total_days,
                progress_percentage=j.progress_percentage,
                days_completed=j.days_completed,
                started_at=j.started_at.isoformat() if j.started_at else None,
                last_activity=j.last_activity.isoformat() if j.last_activity else None,
                primary_enemies=j.primary_enemies,
                streak_days=j.streak_days,
            )
            for j in dashboard.active_journeys
        ],
        completed_journeys=dashboard.completed_journeys,
        total_days_practiced=dashboard.total_days_practiced,
        current_streak=dashboard.current_streak,
        enemy_progress=[
            EnemyProgressResponse(
                enemy=ep.enemy,
                enemy_label=ep.enemy_label,
                journeys_started=ep.journeys_started,
                journeys_completed=ep.journeys_completed,
                total_days_practiced=ep.total_days_practiced,
                current_streak=ep.current_streak,
                best_streak=ep.best_streak,
                last_practice=ep.last_practice.isoformat() if ep.last_practice else None,
                mastery_level=ep.mastery_level,
            )
            for ep in dashboard.enemy_progress
        ],
        recommended_templates=dashboard.recommended_templates,
        today_steps=[
            StepResponse(
                step_id=s.step_id,
                journey_id=s.journey_id,
                day_index=s.day_index,
                step_title=s.step_title,
                teaching=s.teaching,
                guided_reflection=s.guided_reflection,
                practice=s.practice,
                verse_refs=s.verse_refs,
                verses=[
                    VerseContent(
                        chapter=v["chapter"],
                        verse=v["verse"],
                        sanskrit=v.get("sanskrit"),
                        hindi=v.get("hindi"),
                        english=v["english"],
                        transliteration=v.get("transliteration"),
                        theme=v.get("theme"),
                    )
                    for v in s.verses
                ],
                micro_commitment=s.micro_commitment,
                check_in_prompt=s.check_in_prompt,
                safety_note=s.safety_note,
                is_completed=s.is_completed,
                completed_at=s.completed_at.isoformat() if s.completed_at else None,
            )
            for s in dashboard.today_steps
        ],
    )


@router.get("/debug/my-journeys")
async def debug_my_journeys(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Debug endpoint to see all journeys for the current user."""
    from sqlalchemy import select, text
    from backend.models import UserJourney

    user_id = current_user

    # Raw count without deleted_at filter
    raw_count_result = await db.execute(
        text("SELECT COUNT(*) FROM user_journeys WHERE user_id = :user_id"),
        {"user_id": user_id}
    )
    raw_count = raw_count_result.scalar() or 0

    # Count with deleted_at filter
    active_count_result = await db.execute(
        text("""
            SELECT COUNT(*) FROM user_journeys
            WHERE user_id = :user_id
            AND status = 'active'
            AND (deleted_at IS NULL OR deleted_at > NOW())
        """),
        {"user_id": user_id}
    )
    active_count = active_count_result.scalar() or 0

    # Get all journeys
    journeys_result = await db.execute(
        text("""
            SELECT id, journey_template_id, status, current_day_index,
                   created_at, deleted_at
            FROM user_journeys
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 20
        """),
        {"user_id": user_id}
    )
    journeys = [
        {
            "id": row[0],
            "template_id": row[1],
            "status": row[2],
            "current_day": row[3],
            "created_at": str(row[4]) if row[4] else None,
            "deleted_at": str(row[5]) if row[5] else None,
        }
        for row in journeys_result.fetchall()
    ]

    return {
        "user_id": user_id,
        "raw_total_count": raw_count,
        "active_count": active_count,
        "journeys": journeys,
    }


@router.delete("/debug/clear-all-journeys")
async def debug_clear_all_journeys(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Debug endpoint to soft-delete all journeys for the current user."""
    from sqlalchemy import text

    user_id = current_user

    # Soft delete all journeys
    result = await db.execute(
        text("""
            UPDATE user_journeys
            SET deleted_at = NOW(), status = 'abandoned'
            WHERE user_id = :user_id AND deleted_at IS NULL
        """),
        {"user_id": user_id}
    )
    await db.commit()

    return {
        "message": "All journeys cleared",
        "user_id": user_id,
        "journeys_cleared": result.rowcount,
    }


@router.post("/fix-stuck-journeys")
async def fix_stuck_journeys(
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fix stuck journey state by clearing all orphaned and problematic journeys.

    Call this endpoint if you see "You have X active journeys" error but
    the dashboard shows 0 active journeys.
    """
    user_id = current_user

    try:
        # First try to clean orphaned journeys
        orphaned_count = await service.cleanup_orphaned_journeys(user_id)

        # If still stuck, force clear all journeys
        remaining_count = await service._count_active_journeys(user_id)

        if remaining_count >= service.MAX_ACTIVE_JOURNEYS:
            # Force clear all - user requested fix
            cleared_count = await service.force_clear_all_journeys(user_id)
            await db.commit()

            return {
                "message": "All journeys cleared to fix stuck state",
                "orphaned_cleaned": orphaned_count,
                "force_cleared": cleared_count,
                "status": "fixed",
            }

        await db.commit()

        return {
            "message": "Orphaned journeys cleaned",
            "orphaned_cleaned": orphaned_count,
            "remaining_active": remaining_count,
            "status": "cleaned",
        }

    except Exception as e:
        logger.error(f"Error fixing stuck journeys for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fix stuck journeys")


# =============================================================================
# ENEMY ENDPOINTS
# =============================================================================


@router.get("/enemies", response_model=list[EnemyInfo])
async def list_enemies():
    """
    List all six inner enemies with their information.

    Returns details about each Shadripu including Sanskrit name,
    description, key verse, themes, and modern contexts.
    """
    enemies = []
    for enemy_type in EnemyType:
        meta = ENEMY_METADATA[enemy_type]
        enemies.append(EnemyInfo(
            enemy=enemy_type.value,
            sanskrit=meta["sanskrit"],
            english=meta["english"],
            description=meta["description"],
            label=ENEMY_LABELS.get(enemy_type.value, enemy_type.value),
            key_verse=meta["key_verse"],
            themes=meta["themes"],
            antidotes=meta["antidotes"],
            modern_contexts=meta["modern_contexts"],
        ))
    return enemies


@router.get("/enemies/{enemy}", response_model=EnemyProgressResponse | None)
async def get_enemy_progress(
    enemy: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """Get user's progress against a specific inner enemy."""
    user_id = current_user

    # Validate enemy
    enemy_lower = enemy.lower()
    if enemy_lower not in ENEMY_LABELS:
        raise HTTPException(status_code=400, detail=f"Invalid enemy: {enemy}")

    tracker = EnemyProgressTracker(service.db)
    progress = await tracker.get_enemy_details(user_id, enemy_lower)

    if progress is None:
        return None

    return EnemyProgressResponse(
        enemy=progress.enemy,
        enemy_label=progress.enemy_label,
        journeys_started=progress.journeys_started,
        journeys_completed=progress.journeys_completed,
        total_days_practiced=progress.total_days_practiced,
        current_streak=progress.current_streak,
        best_streak=progress.best_streak,
        last_practice=progress.last_practice.isoformat() if progress.last_practice else None,
        mastery_level=progress.mastery_level,
    )


@router.get("/enemies/{enemy}/radar")
async def get_enemy_radar(
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
) -> dict[str, int]:
    """
    Get radar chart data for enemy mastery visualization.

    Returns mastery levels (0-100) for all six enemies.
    """
    user_id = current_user
    tracker = EnemyProgressTracker(service.db)
    return await tracker.get_radar_data(user_id)


# =============================================================================
# EXAMPLES ENDPOINTS
# =============================================================================


@router.get("/examples/{enemy}", response_model=ExampleListResponse)
async def get_examples(
    enemy: str,
    category: str | None = Query(None, description="Filter by category"),
    limit: int = Query(10, ge=1, le=50, description="Max examples"),
    examples_db: ModernExamplesDB = Depends(get_examples_db),
):
    """
    Get modern examples for a specific enemy.

    Examples connect the Six Enemies to everyday situations with
    relevant Gita wisdom and practical antidotes.
    """
    enemy_lower = enemy.lower()
    if enemy_lower not in ENEMY_LABELS:
        raise HTTPException(status_code=400, detail=f"Invalid enemy: {enemy}")

    examples = examples_db.get_examples(
        enemy=enemy_lower,
        category=category,
        limit=limit,
    )

    return ExampleListResponse(
        examples=[
            ExampleResponse(
                enemy=ex.enemy,
                category=ex.category,
                scenario=ex.scenario,
                how_enemy_manifests=ex.how_enemy_manifests,
                gita_verse_ref=ex.gita_verse_ref,
                gita_wisdom=ex.gita_wisdom,
                practical_antidote=ex.practical_antidote,
                reflection_question=ex.reflection_question,
            )
            for ex in examples
        ],
        total=len(examples),
        enemy=enemy_lower,
    )


@router.get("/examples/{enemy}/random", response_model=ExampleResponse | None)
async def get_random_example(
    enemy: str,
    examples_db: ModernExamplesDB = Depends(get_examples_db),
):
    """Get a random example for the given enemy."""
    enemy_lower = enemy.lower()
    if enemy_lower not in ENEMY_LABELS:
        raise HTTPException(status_code=400, detail=f"Invalid enemy: {enemy}")

    example = examples_db.get_random_example(enemy_lower)

    if example is None:
        return None

    return ExampleResponse(
        enemy=example.enemy,
        category=example.category,
        scenario=example.scenario,
        how_enemy_manifests=example.how_enemy_manifests,
        gita_verse_ref=example.gita_verse_ref,
        gita_wisdom=example.gita_wisdom,
        practical_antidote=example.practical_antidote,
        reflection_question=example.reflection_question,
    )
