"""
Journeys API Routes - RESTful API for Personal Journeys CRUD.

Endpoints:
- GET    /api/journeys           - List journeys
- POST   /api/journeys           - Create journey
- GET    /api/journeys/{id}      - Get journey
- PUT    /api/journeys/{id}      - Update journey
- DELETE /api/journeys/{id}      - Delete journey
"""

from __future__ import annotations

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user_flexible
from backend.services.journey_service import (
    JourneyService,
    JourneyServiceError,
    JourneyNotFoundError,
    JourneyValidationError,
    JourneyAuthorizationError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/journeys", tags=["journeys"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class CreateJourneyRequest(BaseModel):
    """Request body for creating a new journey."""

    title: str = Field(..., min_length=1, max_length=255, description="Journey title")
    description: str | None = Field(None, max_length=5000, description="Journey description")
    status: Literal["draft", "active", "completed", "archived"] = Field(
        "draft", description="Initial status"
    )
    cover_image_url: str | None = Field(None, max_length=512, description="Cover image URL")
    tags: list[str] | None = Field(None, max_length=10, description="Tags for categorization")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        return [tag.strip()[:50] for tag in v if tag.strip()]


class UpdateJourneyRequest(BaseModel):
    """Request body for updating a journey."""

    title: str | None = Field(None, min_length=1, max_length=255, description="New title")
    description: str | None = Field(None, max_length=5000, description="New description")
    status: Literal["draft", "active", "completed", "archived"] | None = Field(
        None, description="New status"
    )
    cover_image_url: str | None = Field(None, max_length=512, description="New cover image URL")
    tags: list[str] | None = Field(None, max_length=10, description="New tags")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title cannot be empty")
        return v


class JourneyResponse(BaseModel):
    """Single journey response."""

    id: str
    owner_id: str
    title: str
    description: str | None
    status: str
    cover_image_url: str | None
    tags: list[str]
    created_at: str | None
    updated_at: str | None


class JourneyListResponse(BaseModel):
    """Paginated list of journeys."""

    items: list[JourneyResponse]
    total: int
    limit: int
    offset: int


class ErrorResponse(BaseModel):
    """Error response structure."""

    error: str
    message: str


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def handle_service_error(error: JourneyServiceError) -> HTTPException:
    """Convert service errors to HTTP exceptions."""
    return HTTPException(
        status_code=error.status_code,
        detail={"error": error.code, "message": error.message}
    )


# =============================================================================
# ENDPOINTS
# =============================================================================


@router.get(
    "",
    response_model=JourneyListResponse,
    summary="List journeys",
    description="Get a paginated list of journeys for the current user.",
)
async def list_journeys(
    status: Literal["draft", "active", "completed", "archived"] | None = Query(
        None, description="Filter by status"
    ),
    search: str | None = Query(None, max_length=100, description="Search in title"),
    sort_by: Literal["created_at", "updated_at", "title"] = Query(
        "updated_at", description="Sort field"
    ),
    sort_order: Literal["asc", "desc"] = Query("desc", description="Sort direction"),
    limit: int = Query(50, ge=1, le=100, description="Max items to return"),
    offset: int = Query(0, ge=0, description="Items to skip"),
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db),
) -> JourneyListResponse:
    """
    List all journeys for the authenticated user.

    Supports filtering by status, searching by title, and pagination.
    Results are sorted by the specified field and order.
    """
    try:
        service = JourneyService(db)
        result = await service.list_journeys(
            user_id,
            status=status,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
        )
        return JourneyListResponse(**result)

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error listing journeys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "LIST_ERROR", "message": "Failed to list journeys"}
        )


@router.post(
    "",
    response_model=JourneyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create journey",
    description="Create a new journey for the current user.",
)
async def create_journey(
    request: CreateJourneyRequest,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db),
) -> JourneyResponse:
    """
    Create a new personal journey.

    The journey will be owned by the authenticated user.
    """
    try:
        service = JourneyService(db)
        journey = await service.create_journey(
            user_id,
            title=request.title,
            description=request.description,
            status=request.status,
            cover_image_url=request.cover_image_url,
            tags=request.tags,
        )
        return JourneyResponse(**journey)

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error creating journey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "CREATE_ERROR", "message": "Failed to create journey"}
        )


@router.get(
    "/{journey_id}",
    response_model=JourneyResponse,
    summary="Get journey",
    description="Get a specific journey by ID.",
)
async def get_journey(
    journey_id: str,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db),
) -> JourneyResponse:
    """
    Get a single journey by its ID.

    Only the owner can access their journeys.
    """
    try:
        service = JourneyService(db)
        journey = await service.get_journey(journey_id, user_id)
        return JourneyResponse(**journey)

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error getting journey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "GET_ERROR", "message": "Failed to get journey"}
        )


@router.put(
    "/{journey_id}",
    response_model=JourneyResponse,
    summary="Update journey",
    description="Update an existing journey.",
)
async def update_journey(
    journey_id: str,
    request: UpdateJourneyRequest,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db),
) -> JourneyResponse:
    """
    Update an existing journey.

    Only the owner can update their journeys.
    Only provided fields will be updated.
    """
    try:
        service = JourneyService(db)
        journey = await service.update_journey(
            journey_id,
            user_id,
            title=request.title,
            description=request.description,
            status=request.status,
            cover_image_url=request.cover_image_url,
            tags=request.tags,
        )
        return JourneyResponse(**journey)

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error updating journey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "UPDATE_ERROR", "message": "Failed to update journey"}
        )


@router.delete(
    "/{journey_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete journey",
    description="Delete a journey (soft delete).",
)
async def delete_journey(
    journey_id: str,
    user_id: str = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Delete a journey.

    Only the owner can delete their journeys.
    This is a soft delete - the data can be recovered if needed.
    """
    try:
        service = JourneyService(db)
        await service.delete_journey(journey_id, user_id)

    except JourneyServiceError as e:
        raise handle_service_error(e)
    except Exception as e:
        logger.error(f"Error deleting journey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "DELETE_ERROR", "message": "Failed to delete journey"}
        )
