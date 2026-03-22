"""
Nityam Sadhana API Routes

Provides endpoints for the personalised daily practice feature:
- POST /api/sadhana/compose  - Generate a tailored sadhana session
- POST /api/sadhana/complete - Log a completed practice and award XP
"""

import logging
import os
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.middleware.rate_limiter import limiter
from backend.services.sadhana_composer import compose_daily_sadhana

logger = logging.getLogger(__name__)

# Feature flag
SADHANA_ENABLED = os.getenv("SADHANA_ENABLED", "true").lower() in {
    "1", "true", "yes", "on"
}

# Rate limit for sadhana endpoints
SADHANA_RATE_LIMIT = "30/minute"

# XP awarded per completed practice
SADHANA_XP_REWARD = 25

router = APIRouter(prefix="/api/sadhana", tags=["sadhana"])

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

VALID_MOODS = {
    "heavy", "wounded", "sad", "anxious", "stressed",
    "radiant", "grateful", "joyful", "excited",
    "calm", "neutral", "curious", "hopeful", "reflective",
}

VALID_TIMES = {"morning", "afternoon", "evening", "night"}


class ComposeRequest(BaseModel):
    """Request body for composing a new sadhana session."""

    mood: str = Field(
        ...,
        min_length=1,
        max_length=32,
        description="User's current emotional state.",
    )
    time_of_day: str = Field(
        ...,
        min_length=1,
        max_length=16,
        description="Time of day: morning, afternoon, evening, or night.",
    )

    @field_validator("mood")
    @classmethod
    def validate_mood(cls, v: str) -> str:
        """Normalise and validate mood value."""
        v = v.strip().lower()
        if not v:
            raise ValueError("Mood must not be empty")
        if len(v) > 32:
            raise ValueError("Mood must be 32 characters or less")
        # Allow any mood string - the composer uses a default breathing
        # pattern for unrecognised moods
        return v

    @field_validator("time_of_day")
    @classmethod
    def validate_time_of_day(cls, v: str) -> str:
        """Normalise and validate time_of_day."""
        v = v.strip().lower()
        if v not in VALID_TIMES:
            raise ValueError(
                f"time_of_day must be one of: {', '.join(sorted(VALID_TIMES))}"
            )
        return v


class CompleteRequest(BaseModel):
    """Request body for logging a completed sadhana session."""

    mood: str = Field(
        ...,
        min_length=1,
        max_length=32,
        description="User's mood when completing the practice.",
    )
    reflection_text: Optional[str] = Field(
        None,
        max_length=2000,
        description="Optional reflection written during practice.",
    )
    intention_text: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional dharma intention the user committed to.",
    )
    duration_seconds: int = Field(
        ...,
        ge=1,
        le=7200,
        description="How long the practice lasted in seconds (max 2 hours).",
    )
    verse_id: str = Field(
        ...,
        min_length=1,
        max_length=16,
        description="Verse identifier shown during the session (e.g. '2.47').",
    )

    @field_validator("mood")
    @classmethod
    def validate_mood(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Mood must not be empty")
        return v

    @field_validator("reflection_text")
    @classmethod
    def validate_reflection_text(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 2000:
                raise ValueError("Reflection must be 2000 characters or less")
        return v

    @field_validator("intention_text")
    @classmethod
    def validate_intention_text(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError("Intention must be 500 characters or less")
        return v

    @field_validator("verse_id")
    @classmethod
    def validate_verse_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("verse_id must not be empty")
        return v


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _check_feature_enabled() -> None:
    """Raise 503 if the Nityam Sadhana feature is disabled."""
    if not SADHANA_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Nityam Sadhana feature is currently disabled.",
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/compose")
@limiter.limit(SADHANA_RATE_LIMIT)
async def compose_sadhana(
    request: Request,
    body: ComposeRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> dict[str, Any]:
    """
    Compose a personalised daily sadhana session.

    Takes the user's current mood and time of day, then returns a full
    practice composition including breathing pattern, Gita verse with
    personalised interpretation, reflection prompt, and dharma intention.

    Works for both authenticated and anonymous users.
    """
    _check_feature_enabled()

    try:
        logger.info(
            "Composing sadhana: user=%s, mood='%s', time='%s'",
            user_id or "anonymous",
            body.mood,
            body.time_of_day,
        )

        composition = await compose_daily_sadhana(
            mood=body.mood,
            time_of_day=body.time_of_day,
        )

        return {
            "success": True,
            "composition": composition,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error composing sadhana: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compose your daily practice. Please try again.",
        ) from None


@router.post("/complete")
@limiter.limit(SADHANA_RATE_LIMIT)
async def complete_sadhana(
    request: Request,
    body: CompleteRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> dict[str, Any]:
    """
    Log a completed sadhana session and award experience points.

    Records the user's practice completion including optional reflection
    and intention text. Awards XP and returns the updated streak count.

    Works for both authenticated and anonymous users, though streaks and
    XP are only persisted for authenticated users.
    """
    _check_feature_enabled()

    try:
        logger.info(
            "Sadhana completed: user=%s, mood='%s', verse=%s, duration=%ds",
            user_id or "anonymous",
            body.mood,
            body.verse_id,
            body.duration_seconds,
        )

        # TODO: Persist completion record to database when sadhana_completions
        # table is created. For now we log and return success so the frontend
        # can track streaks client-side.

        # Determine streak count (placeholder until DB persistence is added)
        streak_count = 1

        # Build a compassionate completion message
        duration_minutes = body.duration_seconds // 60
        if duration_minutes >= 10:
            message = (
                "Beautiful practice today. "
                f"{duration_minutes} minutes of presence is a gift to yourself."
            )
        elif duration_minutes >= 5:
            message = (
                "Well done. Even a few minutes of sincere practice "
                "creates ripples of peace through your day."
            )
        else:
            message = (
                "Every moment of awareness counts. "
                "You showed up for yourself today - that matters."
            )

        return {
            "success": True,
            "xp_awarded": SADHANA_XP_REWARD,
            "streak_count": streak_count,
            "message": message,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error completing sadhana: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record your practice. Please try again.",
        ) from None


@router.get("/health")
async def health() -> dict[str, Any]:
    """Health check for the Nityam Sadhana service."""
    return {
        "status": "healthy" if SADHANA_ENABLED else "disabled",
        "feature": "nityam_sadhana",
        "version": "1.0.0",
    }
