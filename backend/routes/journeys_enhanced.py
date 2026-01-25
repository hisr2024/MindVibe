"""
Enhanced Wisdom Journeys API Routes.

Provides endpoints for the multi-journey Wisdom Journey system:
- GET  /api/journeys/catalog - Get journey templates
- POST /api/journeys/start - Start multiple journeys
- GET  /api/journeys/active - Get active journeys
- GET  /api/journeys/today - Get today's agenda
- POST /api/journeys/{id}/today - Get/generate today's step
- POST /api/journeys/{id}/steps/{day}/complete - Complete a step
- POST /api/journeys/{id}/pause - Pause journey
- POST /api/journeys/{id}/resume - Resume journey
- POST /api/journeys/{id}/abandon - Abandon journey
- GET  /api/journeys/{id}/history - Get journey history
- GET  /api/admin/ai/providers/status - Provider health (admin only)
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_flexible, get_db
from backend.middleware.rate_limiter import limiter
from backend.services.journey_engine_enhanced import (
    EnhancedJourneyEngine,
    get_journey_engine,
)
from backend.services.ai.providers import get_provider_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/journeys", tags=["journeys-enhanced"])
admin_router = APIRouter(prefix="/api/admin/ai", tags=["admin-ai"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class StartJourneysRequest(BaseModel):
    """Request to start one or more journeys."""
    journey_ids: list[str] = Field(..., min_items=1, max_items=5)
    personalization: dict[str, Any] | None = Field(
        default=None,
        description="Personalization settings: pace, time_budget_minutes, focus_tags, preferred_tone, provider_preference"
    )


class CompleteStepRequest(BaseModel):
    """Request to mark a step as complete."""
    check_in: dict[str, Any] | None = Field(
        default=None,
        description="Check-in data: {intensity: 0-10, label: string}"
    )
    reflection_response: str | None = Field(
        default=None,
        max_length=10000,
        description="User reflection text (will be encrypted)"
    )


class JourneyTemplateResponse(BaseModel):
    """Journey template response."""
    id: str
    slug: str
    title: str
    description: str | None
    primary_enemy_tags: list[str]
    duration_days: int
    difficulty: int
    is_featured: bool
    icon_name: str | None
    color_theme: str | None


class UserJourneyResponse(BaseModel):
    """User journey response."""
    id: str
    template_id: str | None
    template_title: str
    template_slug: str | None
    status: str
    current_day_index: int
    total_days: int
    progress_percentage: int
    started_at: str
    personalization: dict[str, Any] | None


class StepResponse(BaseModel):
    """Step response with KIAAN-generated content."""
    step_state_id: str
    user_journey_id: str
    day_index: int
    kiaan_step: dict[str, Any] | None
    verse_refs: list[dict[str, int]]
    verse_texts: list[dict[str, Any]] | None = None
    completed: bool
    check_in: dict[str, Any] | None
    provider_used: str | None
    model_used: str | None


class TodayAgendaResponse(BaseModel):
    """Today's agenda across all active journeys."""
    steps: list[dict[str, Any]]
    priority_step: dict[str, Any] | None
    active_journey_count: int | None = None
    message: str | None = None


class ProviderStatusResponse(BaseModel):
    """AI provider health status."""
    providers: dict[str, dict[str, Any]]


# =============================================================================
# CATALOG ENDPOINTS
# =============================================================================


@router.get("/catalog", response_model=list[JourneyTemplateResponse])
async def get_catalog(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> list[JourneyTemplateResponse]:
    """
    Get all available journey templates.

    Returns journey templates sorted by featured status and title.
    """
    engine = get_journey_engine()

    try:
        templates = await engine.get_catalog(db)
        return [JourneyTemplateResponse(**t) for t in templates]

    except Exception as e:
        logger.error(f"Error getting catalog: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get journey catalog")


# =============================================================================
# JOURNEY MANAGEMENT ENDPOINTS
# =============================================================================


@router.post("/start", response_model=list[UserJourneyResponse])
@limiter.limit("10/hour")
async def start_journeys(
    request: Request,
    body: StartJourneysRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> list[UserJourneyResponse]:
    """
    Start one or more journeys.

    Supports starting multiple journeys in a single request.
    Rate limited to 10 journey starts per hour.
    """
    engine = get_journey_engine()

    try:
        journeys = await engine.start_journeys(
            db=db,
            user_id=user_id,
            journey_template_ids=body.journey_ids,
            personalization=body.personalization,
        )

        return [
            UserJourneyResponse(
                id=j.id,
                template_id=j.journey_template_id,
                template_title=j.template.title if j.template else "Journey",
                template_slug=j.template.slug if j.template else None,
                status=j.status.value,
                current_day_index=j.current_day_index,
                total_days=j.template.duration_days if j.template else 14,
                progress_percentage=0,
                started_at=j.started_at.isoformat(),
                personalization=j.personalization,
            )
            for j in journeys
        ]

    except Exception as e:
        logger.error(f"Error starting journeys: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to start journeys")


@router.get("/active", response_model=list[UserJourneyResponse])
async def get_active_journeys(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> list[UserJourneyResponse]:
    """Get all active journeys for the current user."""
    engine = get_journey_engine()

    try:
        journeys = await engine.get_active_journeys(db, user_id)
        return [UserJourneyResponse(**j) for j in journeys]

    except Exception as e:
        logger.error(f"Error getting active journeys: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get active journeys")


# =============================================================================
# TODAY'S AGENDA ENDPOINTS
# =============================================================================


@router.get("/today", response_model=TodayAgendaResponse)
async def get_today_agenda(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> TodayAgendaResponse:
    """
    Get today's agenda across all active journeys.

    Returns steps for all active journeys and optionally recommends
    a priority step based on check-in intensity.
    """
    engine = get_journey_engine()

    try:
        agenda = await engine.get_today_steps(db, user_id)
        return TodayAgendaResponse(**agenda)

    except Exception as e:
        logger.error(f"Error getting today's agenda: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get today's agenda")


@router.post("/{user_journey_id}/today", response_model=StepResponse)
@limiter.limit("30/hour")
async def get_or_generate_today_step(
    request: Request,
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> StepResponse:
    """
    Get or generate today's step for a specific journey.

    This endpoint is idempotent - calling it multiple times returns
    the same cached step if already generated.

    Rate limited to 30 step generations per hour.
    """
    engine = get_journey_engine()

    try:
        # Verify ownership
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this journey")

        # Get step
        step = await engine.get_journey_step(db, user_journey_id)

        if not step:
            raise HTTPException(status_code=500, detail="Failed to generate step")

        return StepResponse(**step)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting step for journey {user_journey_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get journey step")


# =============================================================================
# STEP COMPLETION ENDPOINTS
# =============================================================================


@router.post("/{user_journey_id}/steps/{day_index}/complete")
@limiter.limit("100/hour")
async def complete_step(
    request: Request,
    user_journey_id: str,
    day_index: int,
    body: CompleteStepRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> dict[str, Any]:
    """
    Mark a journey step as complete with check-in and reflection.

    The reflection is stored using the existing journaling/encryption system.
    """
    engine = get_journey_engine()

    try:
        # Verify ownership
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this journey")

        result = await engine.complete_step(
            db=db,
            user_journey_id=user_journey_id,
            day_index=day_index,
            check_in=body.check_in,
            reflection_response=body.reflection_response,
        )

        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing step: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to complete step")


# =============================================================================
# JOURNEY STATUS ENDPOINTS
# =============================================================================


@router.post("/{user_journey_id}/pause")
async def pause_journey(
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> dict[str, str]:
    """Pause an active journey."""
    engine = get_journey_engine()

    try:
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        await engine.pause_journey(db, user_journey_id)
        return {"status": "paused", "journey_id": user_journey_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pausing journey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to pause journey")


@router.post("/{user_journey_id}/resume")
async def resume_journey(
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> dict[str, str]:
    """Resume a paused journey."""
    engine = get_journey_engine()

    try:
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        await engine.resume_journey(db, user_journey_id)
        return {"status": "active", "journey_id": user_journey_id}

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error resuming journey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to resume journey")


@router.post("/{user_journey_id}/abandon")
async def abandon_journey(
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> dict[str, str]:
    """Abandon a journey."""
    engine = get_journey_engine()

    try:
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        await engine.abandon_journey(db, user_journey_id)
        return {"status": "abandoned", "journey_id": user_journey_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error abandoning journey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to abandon journey")


# =============================================================================
# HISTORY ENDPOINTS
# =============================================================================


@router.get("/{user_journey_id}/history")
async def get_journey_history(
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> list[dict[str, Any]]:
    """Get complete history of a journey's steps."""
    engine = get_journey_engine()

    try:
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        return await engine.get_journey_history(db, user_journey_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting journey history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get journey history")


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================


@admin_router.get("/providers/status", response_model=ProviderStatusResponse)
async def get_provider_status(
    # Note: In production, add admin auth check here
    # admin: AdminUser = Depends(require_admin_role)
) -> ProviderStatusResponse:
    """
    Get health status of all AI providers.

    Admin-only endpoint for monitoring provider health.
    """
    manager = get_provider_manager()

    try:
        health_status = await manager.get_all_health_status()

        providers = {}
        for name, result in health_status.items():
            providers[name] = {
                "status": result.status.value,
                "latency_ms": result.latency_ms,
                "error": result.error,
                "last_check": result.timestamp.isoformat(),
            }

        return ProviderStatusResponse(providers=providers)

    except Exception as e:
        logger.error(f"Error getting provider status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get provider status")
