"""
Emotional Pattern Extraction API Routes

Provides endpoints for extracting structured emotional signals from recent
user interactions. Returns privacy-preserving, abstract pattern summaries
that never quote users or store identifying details.
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.services.emotional_pattern_extraction import emotional_pattern_extractor

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/kiaan/emotional-patterns",
    tags=["kiaan", "emotional-patterns"],
)


class EmotionalPatternResponse(BaseModel):
    """Response model for emotional pattern extraction."""

    user_id: str
    extraction_window_days: int
    data_points_analyzed: int
    recurring_themes: list[dict[str, Any]]
    attachment_signals: list[dict[str, Any]]
    reactivity_triggers: list[dict[str, Any]]
    growth_signals: list[dict[str, Any]]
    awareness_indicators: list[str]
    dominant_quadrant: str
    guna_distribution: dict[str, float]
    emotional_variability: str
    extracted_at: str


@router.get("/extract", response_model=EmotionalPatternResponse)
async def extract_emotional_patterns(
    days: int = Query(
        default=30,
        ge=1,
        le=90,
        description="Number of days of history to analyze (1-90)",
    ),
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> EmotionalPatternResponse:
    """Extract structured emotional patterns from recent user interactions.

    Returns a privacy-preserving summary of emotional signals including
    recurring themes, attachment patterns, reactivity triggers, growth
    signals, and signs of increasing awareness.

    All data is abstracted — no user quotes, personal details, or
    identifying information is included in the response.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for emotional pattern extraction",
        )

    try:
        report = await emotional_pattern_extractor.extract(
            db=db,
            user_id=user_id,
            lookback_days=days,
        )
        return EmotionalPatternResponse(**report.to_dict())
    except Exception as e:
        logger.error(f"Emotional pattern extraction failed for user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to extract emotional patterns at this time",
        )
