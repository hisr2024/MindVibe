"""
Journey API Routes - RESTful API for Wisdom Journeys.

Provides endpoints for:
- GET /api/journeys/catalog - Get all available journey templates
- GET /api/journeys/active - Get user's active journeys
- POST /api/journeys/start - Start a new journey
- GET /api/journeys/{id} - Get journey details
- POST /api/journeys/{id}/pause - Pause a journey
- POST /api/journeys/{id}/resume - Resume a journey
- POST /api/journeys/{id}/abandon - Abandon a journey
- GET /api/journeys/{id}/today - Get today's step
- POST /api/journeys/{id}/steps/{day}/complete - Complete a step
- GET /api/journeys/today - Get today's agenda (all journeys)
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user_flexible
from backend.services.journey_service import (
    JourneyService,
    JourneyServiceError,
    JourneyNotFoundError,
    TemplateNotFoundError,
    JourneyLimitExceededError,
    JourneyAlreadyStartedError,
    StepAlreadyCompletedError,
)
from backend.config.feature_config import get_wisdom_journeys_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/journeys", tags=["journeys"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class StartJourneyRequest(BaseModel):
    """Request to start a new journey."""
    template_slug: str = Field(..., description="The slug of the journey template to start")
    personalization: dict[str, Any] | None = Field(
        default=None,
        description="Optional personalization settings"
    )


class CompleteStepRequest(BaseModel):
    """Request to complete a journey step."""
    reflection: str | None = Field(
        default=None,
        max_length=5000,
        description="Optional reflection text"
    )
    check_in: dict[str, Any] | None = Field(
        default=None,
        description="Optional check-in data (mood scale, etc.)"
    )


class JourneyResponse(BaseModel):
    """Standard journey response."""
    success: bool = True
    data: dict[str, Any] | None = None
    error: str | None = None
    error_code: str | None = None


class CatalogResponse(BaseModel):
    """Response for journey catalog."""
    success: bool = True
    data: list[dict[str, Any]]
    count: int


class ActiveJourneysResponse(BaseModel):
    """Response for active journeys list."""
    success: bool = True
    data: list[dict[str, Any]]
    count: int


class TodayAgendaResponse(BaseModel):
    """Response for today's agenda."""
    success: bool = True
    data: list[dict[str, Any]]
    count: int


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def handle_service_error(error: JourneyServiceError) -> HTTPException:
    """Convert service errors to HTTP exceptions."""
    status_map = {
        "JOURNEY_NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "TEMPLATE_NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "JOURNEY_LIMIT_EXCEEDED": status.HTTP_403_FORBIDDEN,
        "JOURNEY_ALREADY_STARTED": status.HTTP_409_CONFLICT,
        "STEP_ALREADY_COMPLETED": status.HTTP_409_CONFLICT,
        "INVALID_JOURNEY_STATE": status.HTTP_400_BAD_REQUEST,
        "JOURNEY_NOT_ACTIVE": status.HTTP_400_BAD_REQUEST,
        "INVALID_DAY_INDEX": status.HTTP_400_BAD_REQUEST,
    }

    status_code = status_map.get(error.code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    return HTTPException(
        status_code=status_code,
        detail={
            "error": error.code,
            "message": error.message
        }
    )


# =============================================================================
# CATALOG ENDPOINTS
# =============================================================================


@router.get("/catalog", response_model=CatalogResponse)
async def get_catalog(
    db: AsyncSession = Depends(get_db)
) -> CatalogResponse:
    """
    Get all available journey templates.

    Returns the catalog of journey templates that users can start.
    No authentication required - this is public data.
    """
    try:
        service = JourneyService(db)
        templates = await service.get_catalog()

        return CatalogResponse(
            success=True,
            data=templates,
            count=len(templates)
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error fetching catalog: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "CATALOG_ERROR", "message": "Failed to fetch journey catalog"}
        )


# =============================================================================
# USER JOURNEY ENDPOINTS
# =============================================================================


@router.get("/active", response_model=ActiveJourneysResponse)
async def get_active_journeys(
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> ActiveJourneysResponse:
    """
    Get all active journeys for the current user.

    Returns a list of all journeys that are currently in progress.
    """
    try:
        service = JourneyService(db)
        journeys = await service.get_active_journeys(user_id)

        return ActiveJourneysResponse(
            success=True,
            data=journeys,
            count=len(journeys)
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error fetching active journeys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "FETCH_ERROR", "message": "Failed to fetch active journeys"}
        )


@router.post("/start", response_model=JourneyResponse)
async def start_journey(
    request: StartJourneyRequest,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> JourneyResponse:
    """
    Start a new journey.

    Creates a new journey instance for the user based on the specified template.
    """
    try:
        # Get user's journey limit from their subscription tier
        # For now, use default limit - will integrate with subscription service
        journey_limit = 5  # Default to generous limit

        service = JourneyService(db)
        journey = await service.start_journey(
            user_id=user_id,
            template_slug=request.template_slug,
            personalization=request.personalization,
            journey_limit=journey_limit
        )

        return JourneyResponse(
            success=True,
            data=journey
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error starting journey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "START_ERROR", "message": "Failed to start journey"}
        )


@router.get("/{journey_id}", response_model=JourneyResponse)
async def get_journey(
    journey_id: str,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> JourneyResponse:
    """
    Get details of a specific journey.

    Returns full journey details including all completed steps.
    """
    try:
        service = JourneyService(db)
        journey = await service.get_journey(journey_id, user_id)

        return JourneyResponse(
            success=True,
            data=journey
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error fetching journey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "FETCH_ERROR", "message": "Failed to fetch journey"}
        )


@router.post("/{journey_id}/pause", response_model=JourneyResponse)
async def pause_journey(
    journey_id: str,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> JourneyResponse:
    """
    Pause a journey.

    Pauses an active journey so it can be resumed later.
    """
    try:
        service = JourneyService(db)
        journey = await service.pause_journey(journey_id, user_id)

        return JourneyResponse(
            success=True,
            data=journey
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error pausing journey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "PAUSE_ERROR", "message": "Failed to pause journey"}
        )


@router.post("/{journey_id}/resume", response_model=JourneyResponse)
async def resume_journey(
    journey_id: str,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> JourneyResponse:
    """
    Resume a paused journey.

    Resumes a previously paused journey.
    """
    try:
        service = JourneyService(db)
        journey = await service.resume_journey(journey_id, user_id)

        return JourneyResponse(
            success=True,
            data=journey
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error resuming journey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "RESUME_ERROR", "message": "Failed to resume journey"}
        )


@router.post("/{journey_id}/abandon", response_model=JourneyResponse)
async def abandon_journey(
    journey_id: str,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> JourneyResponse:
    """
    Abandon a journey.

    Marks a journey as abandoned. This cannot be undone.
    """
    try:
        service = JourneyService(db)
        journey = await service.abandon_journey(journey_id, user_id)

        return JourneyResponse(
            success=True,
            data=journey
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error abandoning journey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "ABANDON_ERROR", "message": "Failed to abandon journey"}
        )


# =============================================================================
# STEP ENDPOINTS
# =============================================================================


@router.get("/{journey_id}/today", response_model=JourneyResponse)
async def get_today_step(
    journey_id: str,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> JourneyResponse:
    """
    Get today's step for a journey.

    Returns the current day's step content including teaching, reflection prompts,
    and practice instructions.
    """
    try:
        service = JourneyService(db)
        step = await service.get_today_step(journey_id, user_id)

        return JourneyResponse(
            success=True,
            data=step
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error fetching today's step: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "FETCH_ERROR", "message": "Failed to fetch today's step"}
        )


@router.post("/{journey_id}/steps/{day_index}/complete", response_model=JourneyResponse)
async def complete_step(
    journey_id: str,
    day_index: int,
    request: CompleteStepRequest,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> JourneyResponse:
    """
    Complete a journey step.

    Marks the specified day as complete and optionally stores reflection and check-in data.
    """
    try:
        service = JourneyService(db)
        journey = await service.complete_step(
            journey_id=journey_id,
            user_id=user_id,
            day_index=day_index,
            reflection=request.reflection,
            check_in_data=request.check_in
        )

        return JourneyResponse(
            success=True,
            data=journey
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error completing step: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "COMPLETE_ERROR", "message": "Failed to complete step"}
        )


# =============================================================================
# AGENDA ENDPOINT
# =============================================================================


@router.get("/today", response_model=TodayAgendaResponse)
async def get_today_agenda(
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> TodayAgendaResponse:
    """
    Get today's agenda for all active journeys.

    Returns a list of today's steps across all active journeys.
    Useful for the main dashboard view.
    """
    try:
        service = JourneyService(db)
        agenda = await service.get_today_agenda(user_id)

        return TodayAgendaResponse(
            success=True,
            data=agenda,
            count=len(agenda)
        )

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error fetching today's agenda: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "FETCH_ERROR", "message": "Failed to fetch today's agenda"}
        )


# =============================================================================
# ACCESS CHECK ENDPOINT
# =============================================================================


@router.get("/access", response_model=JourneyResponse)
async def check_journey_access(
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db)
) -> JourneyResponse:
    """
    Check user's journey access and limits.

    Returns information about the user's journey access level and remaining slots.
    """
    try:
        service = JourneyService(db)
        active_journeys = await service.get_active_journeys(user_id)
        active_count = len(active_journeys)

        # Default limit - in production, get from subscription tier
        limit = 5

        return JourneyResponse(
            success=True,
            data={
                "has_access": True,
                "active_count": active_count,
                "limit": limit,
                "remaining_slots": max(0, limit - active_count),
                "is_trial": False
            }
        )

    except Exception as e:
        logger.error(f"Error checking journey access: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "ACCESS_CHECK_ERROR", "message": "Failed to check journey access"}
        )
