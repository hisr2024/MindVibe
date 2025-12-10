"""
KIAAN Daily Analysis API Routes

Provides automated daily mental health assessment and insights
based on user's emotional logs and Gita wisdom.
"""

import logging
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.models import UserDailyAnalysis, UserEmotionalLog
from backend.services.gita_service import GitaService
from backend.services.kiaan_core import KIAANCore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kiaan/daily-analysis", tags=["kiaan", "daily-analysis"])

kiaan_core = KIAANCore()


class DailyAnalysisResponse(BaseModel):
    """Response model for daily analysis."""

    analysis_date: date
    emotional_summary: str
    recommended_verses: list[dict[str, Any]]
    insights: list[str]
    action_items: list[str]
    overall_mood_score: int | None
    created_at: datetime


class DailyAnalysisRequest(BaseModel):
    """Request model for generating daily analysis."""

    analysis_date: date | None = Field(
        default=None, description="Date for analysis (defaults to today)"
    )


@router.get("/today")
async def get_todays_analysis(
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> DailyAnalysisResponse:
    """
    Get today's daily analysis for the user.

    If analysis doesn't exist for today, generates it automatically.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for daily analysis",
        )

    today = date.today()

    # Check if analysis exists for today
    result = await db.execute(
        select(UserDailyAnalysis).where(
            UserDailyAnalysis.user_id == user_id,
            UserDailyAnalysis.analysis_date == today,
        )
    )
    analysis = result.scalar_one_or_none()

    if not analysis:
        # Generate new analysis
        analysis = await _generate_daily_analysis(db, user_id, today)

    # Fetch full verse details for recommended verses
    verse_details = []
    for verse_ref in analysis.recommended_verses:
        if (
            isinstance(verse_ref, dict)
            and "chapter" in verse_ref
            and "verse" in verse_ref
        ):
            verse = await GitaService.get_verse_by_reference(
                db, verse_ref["chapter"], verse_ref["verse"]
            )
            if verse:
                verse_details.append(
                    {
                        "chapter": verse.chapter,
                        "verse": verse.verse,
                        "english": verse.english,
                        "sanskrit": verse.sanskrit,
                        "theme": verse.theme,
                        "principle": verse.principle,
                    }
                )

    return DailyAnalysisResponse(
        analysis_date=analysis.analysis_date,
        emotional_summary=analysis.emotional_summary,
        recommended_verses=verse_details,
        insights=analysis.insights or [],
        action_items=analysis.action_items or [],
        overall_mood_score=analysis.overall_mood_score,
        created_at=analysis.created_at,
    )


@router.get("/history")
async def get_analysis_history(
    days: int = Field(default=7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> list[DailyAnalysisResponse]:
    """
    Get daily analysis history for the past N days.

    Args:
        days: Number of days to retrieve (1-30, default 7)
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for analysis history",
        )

    cutoff_date = date.today() - timedelta(days=days)

    result = await db.execute(
        select(UserDailyAnalysis)
        .where(
            UserDailyAnalysis.user_id == user_id,
            UserDailyAnalysis.analysis_date >= cutoff_date,
        )
        .order_by(UserDailyAnalysis.analysis_date.desc())
    )
    analyses = result.scalars().all()

    return [
        DailyAnalysisResponse(
            analysis_date=a.analysis_date,
            emotional_summary=a.emotional_summary,
            recommended_verses=a.recommended_verses or [],
            insights=a.insights or [],
            action_items=a.action_items or [],
            overall_mood_score=a.overall_mood_score,
            created_at=a.created_at,
        )
        for a in analyses
    ]


@router.post("/generate")
async def generate_analysis(
    request: DailyAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> DailyAnalysisResponse:
    """
    Generate daily analysis for a specific date.

    This endpoint allows regenerating analysis for past dates or
    creating analysis for the current day.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to generate analysis",
        )

    analysis_date = request.analysis_date or date.today()

    # Check if analysis already exists
    result = await db.execute(
        select(UserDailyAnalysis).where(
            UserDailyAnalysis.user_id == user_id,
            UserDailyAnalysis.analysis_date == analysis_date,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Analysis already exists for {analysis_date}. Use GET endpoint to retrieve it.",
        )

    # Generate new analysis
    analysis = await _generate_daily_analysis(db, user_id, analysis_date)

    # Fetch verse details
    verse_details = []
    for verse_ref in analysis.recommended_verses:
        if (
            isinstance(verse_ref, dict)
            and "chapter" in verse_ref
            and "verse" in verse_ref
        ):
            verse = await GitaService.get_verse_by_reference(
                db, verse_ref["chapter"], verse_ref["verse"]
            )
            if verse:
                verse_details.append(
                    {
                        "chapter": verse.chapter,
                        "verse": verse.verse,
                        "english": verse.english,
                        "sanskrit": verse.sanskrit,
                        "theme": verse.theme,
                        "principle": verse.principle,
                    }
                )

    return DailyAnalysisResponse(
        analysis_date=analysis.analysis_date,
        emotional_summary=analysis.emotional_summary,
        recommended_verses=verse_details,
        insights=analysis.insights or [],
        action_items=analysis.action_items or [],
        overall_mood_score=analysis.overall_mood_score,
        created_at=analysis.created_at,
    )


async def _generate_daily_analysis(
    db: AsyncSession,
    user_id: str,
    analysis_date: date,
) -> UserDailyAnalysis:
    """
    Internal function to generate daily analysis based on emotional logs.

    Args:
        db: Database session
        user_id: User ID
        analysis_date: Date to analyze

    Returns:
        UserDailyAnalysis object
    """
    # Get emotional logs for the day
    result = await db.execute(
        select(UserEmotionalLog)
        .where(
            UserEmotionalLog.user_id == user_id,
            UserEmotionalLog.log_date == analysis_date,
        )
        .order_by(UserEmotionalLog.created_at)
    )
    emotional_logs = result.scalars().all()

    # Calculate overall mood score
    if emotional_logs:
        intensities = [log.intensity for log in emotional_logs if log.intensity]
        overall_mood_score = (
            round(sum(intensities) / len(intensities)) if intensities else None
        )
    else:
        overall_mood_score = None

    # Build emotional summary
    if emotional_logs:
        states = [log.emotional_state for log in emotional_logs]
        state_summary = ", ".join(set(states))
        emotional_summary = f"Your emotional journey today included: {state_summary}."

        # Build context for KIAAN
        context_message = f"Daily emotional states: {state_summary}. "
        if emotional_logs[0].notes:
            context_message += f"Notes: {emotional_logs[0].notes[:200]}"
    else:
        emotional_summary = "No emotional logs recorded for this day."
        context_message = (
            "User has not recorded emotions today. Provide general wellness guidance."
        )

    # Get KIAAN insights
    try:
        kiaan_response = await kiaan_core.get_kiaan_response(
            message=context_message, user_id=user_id, db=db, context="daily_analysis"
        )

        insights = [
            kiaan_response.get("response", ""),
            "Reflect on your emotional patterns and how they align with your values.",
            "Consider journaling about today's experiences for deeper understanding.",
        ]

        # Extract verse references from KIAAN response
        verses_used = kiaan_response.get("verses_used", [])
        recommended_verses = []
        for verse_info in verses_used[:3]:  # Limit to top 3 verses
            if isinstance(verse_info, dict):
                recommended_verses.append(
                    {
                        "chapter": verse_info.get("chapter"),
                        "verse": verse_info.get("verse"),
                    }
                )

    except Exception as e:
        logger.error(f"Error getting KIAAN insights for daily analysis: {e}")
        insights = ["Take time today to practice mindfulness and self-compassion."]
        recommended_verses = [
            {"chapter": 2, "verse": 47},  # Karma Yoga
            {"chapter": 6, "verse": 5},  # Self-elevation
        ]

    # Generate action items
    action_items = [
        "Practice 5 minutes of mindful breathing",
        "Journal about one positive moment from today",
        "Reflect on a Gita verse that resonates with you",
    ]

    # Create analysis record
    analysis = UserDailyAnalysis(
        user_id=user_id,
        analysis_date=analysis_date,
        emotional_summary=emotional_summary,
        recommended_verses=recommended_verses,
        insights=insights,
        action_items=action_items,
        overall_mood_score=overall_mood_score,
    )

    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    return analysis
