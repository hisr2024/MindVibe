"""
KIAAN Emotional Reset API Routes

Provides endpoints for the 7-step emotional reset guided flow:
- POST /api/emotional-reset/start - Initialize new session
- POST /api/emotional-reset/step - Process and advance to next step
- GET /api/emotional-reset/session/{session_id} - Get session state
- POST /api/emotional-reset/complete - Finalize session
"""

import logging
import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.middleware.rate_limiter import limiter
from backend.services.emotional_reset_service import EmotionalResetService

logger = logging.getLogger(__name__)

# Feature flag
EMOTIONAL_RESET_ENABLED = os.getenv("EMOTIONAL_RESET_ENABLED", "true").lower() in {
    "1", "true", "yes", "on"
}

# Rate limit for emotional reset endpoints
EMOTIONAL_RESET_RATE_LIMIT = "30/minute"

router = APIRouter(prefix="/api/emotional-reset", tags=["emotional-reset"])

# Initialize service
emotional_reset_service = EmotionalResetService()


class StepInput(BaseModel):
    """Input for processing a step."""
    session_id: str = Field(..., min_length=1, max_length=64)
    current_step: int = Field(..., ge=1, le=7)
    user_input: str | None = Field(None, max_length=200)

    @field_validator('user_input')
    @classmethod
    def validate_user_input(cls, v: str | None) -> str | None:
        """Validate and sanitize user input."""
        if v is not None:
            v = v.strip()
            if len(v) > 200:
                raise ValueError("Input must be 200 characters or less")
        return v


class SessionRequest(BaseModel):
    """Request for session operations."""
    session_id: str = Field(..., min_length=1, max_length=64)


def _check_feature_enabled() -> None:
    """Check if emotional reset feature is enabled."""
    if not EMOTIONAL_RESET_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Emotional Reset feature is currently disabled.",
        )


@router.post("/start")
@limiter.limit(EMOTIONAL_RESET_RATE_LIMIT)
async def start_session(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> dict[str, Any]:
    """
    Start a new emotional reset session.

    Returns session_id, step 1 content, and progress indicator.
    Rate limited to prevent abuse (max 10 sessions per user per day).
    """
    _check_feature_enabled()

    try:
        result = await emotional_reset_service.start_session(db, user_id)

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
                if result.get("error") == "rate_limit_exceeded"
                else status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to start session"),
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting emotional reset session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start emotional reset session. Please try again. 💙",
        ) from None


@router.post("/step")
@limiter.limit(EMOTIONAL_RESET_RATE_LIMIT)
async def process_step(
    request: Request,
    step_input: StepInput,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> dict[str, Any]:
    """
    Process current step and advance to next.

    Input: session_id, current_step, user_input (optional, max 200 chars for step 1)
    Returns: next step content, progress, insights/data for the step
    """
    _check_feature_enabled()

    try:
        result = await emotional_reset_service.process_step(
            db=db,
            session_id=step_input.session_id,
            user_id=user_id,
            current_step=step_input.current_step,
            user_input=step_input.user_input,
        )

        if not result.get("success"):
            error = result.get("error", "unknown")

            # Handle crisis detection specially
            if error == "crisis_detected":
                return {
                    "success": False,
                    "crisis_detected": True,
                    "crisis_response": result.get("crisis_response"),
                    "pause_session": True,
                    "message": "Your safety is our priority. Please reach out for support. 💙",
                }

            status_code = {
                "session_not_found": status.HTTP_404_NOT_FOUND,
                "session_completed": status.HTTP_400_BAD_REQUEST,
                "input_too_long": status.HTTP_400_BAD_REQUEST,
                "invalid_step": status.HTTP_400_BAD_REQUEST,
            }.get(error, status.HTTP_400_BAD_REQUEST)

            raise HTTPException(
                status_code=status_code,
                detail=result.get("message", "Failed to process step"),
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing emotional reset step: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process step. Please try again. 💙",
        ) from None


@router.get("/session/{session_id}")
@limiter.limit(EMOTIONAL_RESET_RATE_LIMIT)
async def get_session(
    request: Request,
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> dict[str, Any]:
    """
    Retrieve current session state.

    Returns: current step, progress, session data
    Supports resume functionality for interrupted sessions.
    """
    _check_feature_enabled()

    try:
        result = await emotional_reset_service.get_session(db, session_id, user_id)

        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found. 💙",
            )

        if not result.get("success"):
            error = result.get("error", "unknown")
            if error == "session_expired":
                raise HTTPException(
                    status_code=status.HTTP_410_GONE,
                    detail=result.get("message", "Session has expired."),
                )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving emotional reset session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve session. Please try again. 💙",
        ) from None


@router.post("/complete")
@limiter.limit(EMOTIONAL_RESET_RATE_LIMIT)
async def complete_session(
    request: Request,
    session_request: SessionRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> dict[str, Any]:
    """
    Finalize session and create journal entry.

    Auto-creates a journal entry with session summary.
    Returns: summary, journal_id (if created), affirmations
    """
    _check_feature_enabled()

    try:
        result = await emotional_reset_service.complete_session(
            db=db,
            session_id=session_request.session_id,
            user_id=user_id,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND
                if result.get("error") == "session_not_found"
                else status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to complete session"),
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing emotional reset session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete session. Please try again. 💙",
        ) from None


@router.get("/health")
async def health() -> dict[str, Any]:
    """Health check for emotional reset service."""
    return {
        "status": "healthy" if EMOTIONAL_RESET_ENABLED else "disabled",
        "feature": "emotional_reset",
        "version": "1.0.0",
    }
