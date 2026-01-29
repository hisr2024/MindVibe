"""
Wisdom Journey API Routes.

Provides endpoints for creating, managing, and progressing through AI-powered
personalized wisdom journeys based on Bhagavad Gita verses.

.. deprecated::
    These routes are DEPRECATED. Use /api/journeys/* endpoints instead.

    MIGRATION:
    ----------
    Old endpoint               -> New endpoint
    /api/wisdom-journey/       -> /api/journeys/
    /api/wisdom-journey/generate -> /api/journeys/start
    /api/wisdom-journey/{id}/progress -> /api/journeys/{id}/steps/{day}/complete

    See backend/routes/journeys_enhanced.py for the new API.
    Frontend should use services/journeysEnhancedService.ts
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from backend.deps import get_current_user_flexible, get_db
from backend.middleware.rate_limiter import limiter
from backend.middleware.feature_access import (
    require_wisdom_journeys,
    require_wisdom_journeys_with_limit,
)
from backend.models import JourneyStatus, GitaVerse
from backend.services.wisdom_journey_service import WisdomJourneyService

logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION CONSTANTS
# =============================================================================

# Number of recommendations to return by default
DEFAULT_RECOMMENDATIONS_LIMIT = 3

# Default fallback recommendations when API fails
DEFAULT_JOURNEY_RECOMMENDATIONS = [
    {
        "template": "inner_peace",
        "title": "Journey to Inner Peace",
        "description": "A 7-day exploration of tranquility through timeless Bhagavad Gita wisdom.",
        "score": 0.85,
        "reason": "Perfect for beginning your wisdom journey.",
    },
    {
        "template": "self_discovery",
        "title": "Path of Self-Discovery",
        "description": "Explore your true nature and purpose through reflective wisdom.",
        "score": 0.78,
        "reason": "Discover deeper insights about yourself.",
    },
    {
        "template": "balanced_action",
        "title": "Wisdom of Balanced Action",
        "description": "Learn to act without attachment, finding harmony between effort and surrender.",
        "score": 0.72,
        "reason": "A versatile path for navigating daily life.",
    },
]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def build_step_response(
    step,
    verse_data: dict | None = None,
) -> "JourneyStepResponse":
    """
    Build a JourneyStepResponse from a step object.

    Args:
        step: JourneyStep model instance
        verse_data: Optional dict with verse_text, verse_translation, verse_chapter, verse_number

    Returns:
        JourneyStepResponse instance
    """
    return JourneyStepResponse(
        id=step.id,
        step_number=step.step_number,
        verse_id=step.verse_id,
        **(verse_data or {}),
        reflection_prompt=step.reflection_prompt,
        ai_insight=step.ai_insight,
        completed=step.completed,
        completed_at=step.completed_at.isoformat() if step.completed_at else None,
        time_spent_seconds=step.time_spent_seconds,
        user_notes=step.user_notes,
        user_rating=step.user_rating,
    )


def build_journey_response(
    journey,
    steps_responses: list["JourneyStepResponse"],
) -> "JourneyResponse":
    """
    Build a JourneyResponse from a journey object and step responses.

    Args:
        journey: WisdomJourney model instance
        steps_responses: List of JourneyStepResponse instances

    Returns:
        JourneyResponse instance
    """
    return JourneyResponse(
        id=journey.id,
        user_id=journey.user_id,
        title=journey.title,
        description=journey.description,
        total_steps=journey.total_steps,
        current_step=journey.current_step,
        status=journey.status.value,
        progress_percentage=journey.progress_percentage,
        recommended_by=journey.recommended_by,
        recommendation_score=float(journey.recommendation_score) if journey.recommendation_score else None,
        recommendation_reason=journey.recommendation_reason,
        created_at=journey.created_at.isoformat(),
        updated_at=journey.updated_at.isoformat() if journey.updated_at else None,
        completed_at=journey.completed_at.isoformat() if journey.completed_at else None,
        steps=steps_responses,
    )


async def batch_fetch_verses(db: AsyncSession, verse_ids: list[int]) -> dict[int, GitaVerse]:
    """
    Batch fetch multiple verses in a single query.

    This prevents the N+1 query problem when loading steps with verses.

    Args:
        db: Database session
        verse_ids: List of verse IDs to fetch

    Returns:
        Dictionary mapping verse_id to GitaVerse object
    """
    if not verse_ids:
        return {}

    # Remove None values and duplicates
    valid_ids = list(set(v for v in verse_ids if v is not None))
    if not valid_ids:
        return {}

    try:
        stmt = select(GitaVerse).where(GitaVerse.id.in_(valid_ids))
        result = await db.execute(stmt)
        verses = result.scalars().all()
        return {v.id: v for v in verses}
    except Exception as e:
        logger.warning(f"Failed to batch fetch verses: {e}")
        return {}

router = APIRouter(prefix="/api/wisdom-journey", tags=["wisdom-journey"])


# Request/Response Models
class GenerateJourneyRequest(BaseModel):
    """Request to generate a new wisdom journey."""

    duration_days: int = Field(default=7, ge=3, le=30, description="Journey duration in days")
    custom_title: str | None = Field(default=None, max_length=255, description="Optional custom title")


class MarkStepCompleteRequest(BaseModel):
    """Request to mark a journey step as complete."""

    step_number: int = Field(..., ge=1, description="Step number to complete")
    time_spent_seconds: int | None = Field(default=None, ge=0, description="Time spent on step in seconds")
    user_notes: str | None = Field(default=None, max_length=5000, description="User reflection notes")
    user_rating: int | None = Field(default=None, ge=1, le=5, description="User rating (1-5 stars)")


class JourneyStepResponse(BaseModel):
    """Response model for a journey step."""

    id: str
    step_number: int
    verse_id: int | None
    verse_text: str | None = None
    verse_translation: str | None = None
    verse_chapter: int | None = None
    verse_number: int | None = None
    reflection_prompt: str | None
    ai_insight: str | None
    completed: bool
    completed_at: str | None
    time_spent_seconds: int | None
    user_notes: str | None
    user_rating: int | None


class JourneyResponse(BaseModel):
    """Response model for a wisdom journey."""

    id: str
    user_id: str
    title: str
    description: str | None
    total_steps: int
    current_step: int
    status: str
    progress_percentage: int
    recommended_by: str | None
    recommendation_score: float | None
    recommendation_reason: str | None
    created_at: str
    updated_at: str | None
    completed_at: str | None
    steps: list[JourneyStepResponse] = []


class RecommendationResponse(BaseModel):
    """Response model for journey recommendation."""

    template: str
    title: str
    description: str
    score: float
    reason: str


# Endpoints


@router.post("/generate", response_model=JourneyResponse)
@limiter.limit("5/hour")  # Limit journey generation
async def generate_journey(
    request: Request,
    body: GenerateJourneyRequest,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys_with_limit(1)),
) -> JourneyResponse:
    """
    Generate a personalized wisdom journey based on user mood and journal patterns.

    Rate limited to 5 journeys per hour per user.
    Requires Wisdom Journeys subscription access.
    """
    user_id, active_count, journey_limit = access
    logger.info(f"Generating journey for user {user_id}, duration: {body.duration_days} days")

    try:
        service = WisdomJourneyService()
        journey = await service.generate_personalized_journey(
            db=db,
            user_id=user_id,
            duration_days=body.duration_days,
            custom_title=body.custom_title,
        )

        # Get steps
        steps = await service.get_journey_steps(db, journey.id)

        # Format response using helper functions
        step_responses = [build_step_response(step) for step in steps]
        return build_journey_response(journey, step_responses)

    except Exception as e:
        logger.error(f"Error generating journey for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate journey") from e


@router.get("/active", response_model=JourneyResponse | None)
async def get_active_journey(
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> JourneyResponse | None:
    """Get the user's currently active wisdom journey, if any.

    Requires Wisdom Journeys subscription access.
    """
    user_id, _, _ = access

    try:
        service = WisdomJourneyService()
        journey = await service.get_active_journey(db, user_id)

        if not journey:
            return None

        # Get steps
        steps = await service.get_journey_steps(db, journey.id)

        # Batch fetch all verses in one query (N+1 prevention)
        verse_ids = [step.verse_id for step in steps if step.verse_id]
        verses_map = await batch_fetch_verses(db, verse_ids)

        # Build step responses with verse data
        steps_with_verses = []
        for step in steps:
            verse_data = None
            if step.verse_id and step.verse_id in verses_map:
                verse = verses_map[step.verse_id]
                verse_data = {
                    "verse_text": verse.english,
                    "verse_translation": verse.transliteration,
                    "verse_chapter": verse.chapter,
                    "verse_number": verse.verse,
                }
            steps_with_verses.append(build_step_response(step, verse_data))

        return build_journey_response(journey, steps_with_verses)

    except Exception as e:
        logger.error(f"Error fetching active journey for user {user_id}: {e}", exc_info=True)
        # Return None instead of 500 for active journey endpoint (allows graceful fallback)
        return None


# IMPORTANT: This route MUST be defined BEFORE /{journey_id} routes to avoid
# FastAPI matching "recommendations" as a journey_id
@router.get("/recommendations/list", response_model=list[RecommendationResponse])
async def get_journey_recommendations(
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> list[RecommendationResponse]:
    """Get personalized journey recommendations based on user mood and activity.

    Requires Wisdom Journeys subscription access.
    """
    user_id, _, _ = access

    try:
        service = WisdomJourneyService()
        recommendations = await service.get_journey_recommendations(
            db, user_id, limit=DEFAULT_RECOMMENDATIONS_LIMIT
        )

        return [
            RecommendationResponse(
                template=rec["template"],
                title=rec["title"],
                description=rec["description"],
                score=rec["score"],
                reason=rec["reason"],
            )
            for rec in recommendations
        ]

    except Exception as e:
        logger.error(f"Error fetching recommendations for user {user_id}: {e}", exc_info=True)
        # Return default recommendations on error
        return [RecommendationResponse(**rec) for rec in DEFAULT_JOURNEY_RECOMMENDATIONS]


@router.get("/{journey_id}", response_model=JourneyResponse)
async def get_journey(
    journey_id: str,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> JourneyResponse:
    """Get a specific wisdom journey by ID.

    Requires Wisdom Journeys subscription access.
    """
    user_id, _, _ = access

    try:
        service = WisdomJourneyService()
        journey = await service.get_journey(db, journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        # Verify ownership
        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this journey")

        # Get steps with verse details
        steps = await service.get_journey_steps(db, journey.id)

        # Batch fetch all verses in one query (N+1 prevention)
        verse_ids = [step.verse_id for step in steps if step.verse_id]
        verses_map = await batch_fetch_verses(db, verse_ids)

        # Build step responses with verse data
        steps_with_verses = []
        for step in steps:
            verse_data = None
            if step.verse_id and step.verse_id in verses_map:
                verse = verses_map[step.verse_id]
                verse_data = {
                    "verse_text": verse.english,
                    "verse_translation": verse.transliteration,
                    "verse_chapter": verse.chapter,
                    "verse_number": verse.verse,
                }
            steps_with_verses.append(build_step_response(step, verse_data))

        return build_journey_response(journey, steps_with_verses)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching journey {journey_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch journey") from e


@router.post("/{journey_id}/progress", response_model=JourneyStepResponse)
@limiter.limit("100/hour")  # Allow frequent progress updates
async def mark_step_complete(
    request: Request,
    journey_id: str,
    body: MarkStepCompleteRequest,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> JourneyStepResponse:
    """Mark a journey step as complete and update progress.

    Requires Wisdom Journeys subscription access.
    """
    user_id, _, _ = access

    try:
        service = WisdomJourneyService()

        # Verify journey ownership
        journey = await service.get_journey(db, journey_id)
        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this journey")

        # Mark step complete
        step = await service.mark_step_complete(
            db=db,
            journey_id=journey_id,
            step_number=body.step_number,
            time_spent_seconds=body.time_spent_seconds,
            user_notes=body.user_notes,
            user_rating=body.user_rating,
        )

        if not step:
            raise HTTPException(status_code=404, detail="Journey step not found")

        return build_step_response(step)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking step complete for journey {journey_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update progress") from e


@router.put("/{journey_id}/pause", response_model=JourneyResponse)
async def pause_journey(
    journey_id: str,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> JourneyResponse:
    """Pause an active wisdom journey.

    Requires Wisdom Journeys subscription access.
    """
    user_id, _, _ = access

    try:
        service = WisdomJourneyService()

        # Verify ownership
        journey = await service.get_journey(db, journey_id)
        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to pause this journey")

        # Pause journey
        journey = await service.pause_journey(db, journey_id)
        if not journey:
            raise HTTPException(status_code=500, detail="Failed to pause journey")

        steps = await service.get_journey_steps(db, journey.id)
        step_responses = [build_step_response(step) for step in steps]
        return build_journey_response(journey, step_responses)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pausing journey {journey_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to pause journey") from e


@router.put("/{journey_id}/resume", response_model=JourneyResponse)
async def resume_journey(
    journey_id: str,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> JourneyResponse:
    """Resume a paused wisdom journey.

    Requires Wisdom Journeys subscription access.
    """
    user_id, _, _ = access

    try:
        service = WisdomJourneyService()

        # Verify ownership
        journey = await service.get_journey(db, journey_id)
        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to resume this journey")

        # Resume journey
        journey = await service.resume_journey(db, journey_id)
        if not journey:
            raise HTTPException(status_code=400, detail="Journey cannot be resumed (not paused)")

        steps = await service.get_journey_steps(db, journey.id)
        step_responses = [build_step_response(step) for step in steps]
        return build_journey_response(journey, step_responses)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resuming journey {journey_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to resume journey") from e


@router.delete("/{journey_id}")
async def delete_journey(
    journey_id: str,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> dict[str, str]:
    """Soft delete a wisdom journey.

    Requires Wisdom Journeys subscription access.
    """
    user_id, _, _ = access

    try:
        service = WisdomJourneyService()

        # Verify ownership
        journey = await service.get_journey(db, journey_id)
        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this journey")

        # Delete journey
        success = await service.delete_journey(db, journey_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete journey")

        return {"message": "Journey deleted successfully", "journey_id": journey_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting journey {journey_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete journey") from e
