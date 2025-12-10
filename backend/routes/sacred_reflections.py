"""
KIAAN Sacred Reflections API Routes

Provides weekly deep-dive assessments and sacred reflections
that integrate multiple Gita teachings for holistic guidance.
"""

import logging
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.models import UserWeeklyReflection, UserDailyAnalysis, GitaVerse
from backend.services.gita_service import GitaService
from backend.services.kiaan_core import KIAANCore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kiaan/sacred-reflections", tags=["kiaan", "sacred-reflections"])

kiaan_core = KIAANCore()


class SacredReflectionResponse(BaseModel):
    """Response model for sacred reflection."""
    week_start_date: date
    week_end_date: date
    emotional_journey_summary: str
    key_insights: list[str]
    verses_explored: list[dict[str, Any]]
    milestones_achieved: list[str]
    areas_for_growth: list[str]
    gratitude_items: list[str]
    overall_wellbeing_score: int | None
    created_at: datetime


class ReflectionRequest(BaseModel):
    """Request model for generating sacred reflection."""
    week_start_date: date | None = Field(
        default=None, description="Start of week (defaults to current week)"
    )
    gratitude_items: list[str] = Field(
        default_factory=list, max_items=5, description="Items of gratitude"
    )


@router.get("/current-week")
async def get_current_week_reflection(
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> SacredReflectionResponse:
    """
    Get sacred reflection for the current week.
    
    If reflection doesn't exist, generates it automatically based on
    daily analyses and emotional logs from the week.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for sacred reflections",
        )
    
    # Get current week start (Monday)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    
    # Check if reflection exists for current week
    result = await db.execute(
        select(UserWeeklyReflection)
        .where(
            UserWeeklyReflection.user_id == user_id,
            UserWeeklyReflection.week_start_date == week_start
        )
    )
    reflection = result.scalar_one_or_none()
    
    if not reflection:
        # Generate new reflection
        reflection = await _generate_sacred_reflection(
            db, user_id, week_start, week_end
        )
    
    # Fetch full verse details
    verse_details = await _fetch_verse_details(db, reflection.verses_explored or [])
    
    return SacredReflectionResponse(
        week_start_date=reflection.week_start_date,
        week_end_date=reflection.week_end_date,
        emotional_journey_summary=reflection.emotional_journey_summary or "",
        key_insights=reflection.key_insights or [],
        verses_explored=verse_details,
        milestones_achieved=reflection.milestones_achieved or [],
        areas_for_growth=reflection.areas_for_growth or [],
        gratitude_items=reflection.gratitude_items or [],
        overall_wellbeing_score=reflection.overall_wellbeing_score,
        created_at=reflection.created_at,
    )


@router.get("/history")
async def get_reflection_history(
    weeks: int = Field(default=4, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> list[SacredReflectionResponse]:
    """
    Get sacred reflection history for the past N weeks.
    
    Args:
        weeks: Number of weeks to retrieve (1-12, default 4)
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for reflection history",
        )
    
    cutoff_date = date.today() - timedelta(weeks=weeks)
    
    result = await db.execute(
        select(UserWeeklyReflection)
        .where(
            UserWeeklyReflection.user_id == user_id,
            UserWeeklyReflection.week_start_date >= cutoff_date
        )
        .order_by(UserWeeklyReflection.week_start_date.desc())
    )
    reflections = result.scalars().all()
    
    response_list = []
    for reflection in reflections:
        verse_details = await _fetch_verse_details(db, reflection.verses_explored or [])
        response_list.append(
            SacredReflectionResponse(
                week_start_date=reflection.week_start_date,
                week_end_date=reflection.week_end_date,
                emotional_journey_summary=reflection.emotional_journey_summary or "",
                key_insights=reflection.key_insights or [],
                verses_explored=verse_details,
                milestones_achieved=reflection.milestones_achieved or [],
                areas_for_growth=reflection.areas_for_growth or [],
                gratitude_items=reflection.gratitude_items or [],
                overall_wellbeing_score=reflection.overall_wellbeing_score,
                created_at=reflection.created_at,
            )
        )
    
    return response_list


@router.post("/generate")
async def generate_reflection(
    request: ReflectionRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> SacredReflectionResponse:
    """
    Generate sacred reflection for a specific week.
    
    This endpoint allows creating reflection for the current week
    or regenerating for past weeks.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to generate reflection",
        )
    
    # Determine week dates
    if request.week_start_date:
        week_start = request.week_start_date
    else:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
    
    week_end = week_start + timedelta(days=6)
    
    # Check if reflection already exists
    result = await db.execute(
        select(UserWeeklyReflection)
        .where(
            UserWeeklyReflection.user_id == user_id,
            UserWeeklyReflection.week_start_date == week_start
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Reflection already exists for week starting {week_start}",
        )
    
    # Generate new reflection
    reflection = await _generate_sacred_reflection(
        db, user_id, week_start, week_end, request.gratitude_items
    )
    
    verse_details = await _fetch_verse_details(db, reflection.verses_explored or [])
    
    return SacredReflectionResponse(
        week_start_date=reflection.week_start_date,
        week_end_date=reflection.week_end_date,
        emotional_journey_summary=reflection.emotional_journey_summary or "",
        key_insights=reflection.key_insights or [],
        verses_explored=verse_details,
        milestones_achieved=reflection.milestones_achieved or [],
        areas_for_growth=reflection.areas_for_growth or [],
        gratitude_items=reflection.gratitude_items or [],
        overall_wellbeing_score=reflection.overall_wellbeing_score,
        created_at=reflection.created_at,
    )


async def _generate_sacred_reflection(
    db: AsyncSession,
    user_id: str,
    week_start: date,
    week_end: date,
    gratitude_items: list[str] | None = None,
) -> UserWeeklyReflection:
    """
    Internal function to generate sacred reflection based on weekly data.
    
    Args:
        db: Database session
        user_id: User ID
        week_start: Week start date
        week_end: Week end date
        gratitude_items: Optional gratitude items from user
        
    Returns:
        UserWeeklyReflection object
    """
    # Get daily analyses for the week
    result = await db.execute(
        select(UserDailyAnalysis)
        .where(
            UserDailyAnalysis.user_id == user_id,
            UserDailyAnalysis.analysis_date >= week_start,
            UserDailyAnalysis.analysis_date <= week_end
        )
        .order_by(UserDailyAnalysis.analysis_date)
    )
    daily_analyses = result.scalars().all()
    
    # Calculate overall wellbeing score
    if daily_analyses:
        scores = [a.overall_mood_score for a in daily_analyses if a.overall_mood_score]
        overall_wellbeing_score = round(sum(scores) / len(scores)) if scores else None
    else:
        overall_wellbeing_score = None
    
    # Build emotional journey summary
    if daily_analyses:
        emotional_journey_summary = (
            f"This week, you experienced a range of emotions. "
            f"You recorded {len(daily_analyses)} days of self-reflection, "
            f"showing commitment to your mental wellbeing journey."
        )
    else:
        emotional_journey_summary = (
            "This week offers an opportunity for deeper self-reflection. "
            "Consider starting daily emotional check-ins to track your journey."
        )
    
    # Collect unique verses from daily analyses
    verse_refs = set()
    for analysis in daily_analyses:
        for verse in analysis.recommended_verses or []:
            if isinstance(verse, dict) and 'chapter' in verse and 'verse' in verse:
                verse_refs.add((verse['chapter'], verse['verse']))
    
    verses_explored = [
        {'chapter': ch, 'verse': v} for ch, v in sorted(verse_refs)
    ][:5]  # Limit to 5 most relevant
    
    # Generate key insights using KIAAN
    context_message = f"Weekly reflection for {week_start} to {week_end}. {emotional_journey_summary}"
    
    try:
        kiaan_response = await kiaan_core.get_kiaan_response(
            message=context_message,
            user_id=user_id,
            db=db,
            context="sacred_reflection"
        )
        
        key_insights = [
            kiaan_response.get("response", ""),
            "Your consistent engagement with self-reflection is a powerful practice.",
            "Each moment of awareness contributes to your long-term wellbeing.",
        ]
    except Exception as e:
        logger.error(f"Error getting KIAAN insights for sacred reflection: {e}")
        key_insights = [
            "This week was an opportunity for growth and self-discovery.",
            "Continue to cultivate awareness and compassion for yourself.",
        ]
    
    # Define milestones and growth areas
    milestones_achieved = []
    if len(daily_analyses) >= 3:
        milestones_achieved.append("Maintained consistent emotional awareness this week")
    if overall_wellbeing_score and overall_wellbeing_score >= 7:
        milestones_achieved.append("Achieved positive overall wellbeing score")
    
    areas_for_growth = [
        "Deepen your mindfulness practice",
        "Explore more Gita verses relevant to your situation",
        "Practice self-compassion daily",
    ]
    
    # Create reflection record
    reflection = UserWeeklyReflection(
        user_id=user_id,
        week_start_date=week_start,
        week_end_date=week_end,
        emotional_journey_summary=emotional_journey_summary,
        key_insights=key_insights,
        verses_explored=verses_explored,
        milestones_achieved=milestones_achieved,
        areas_for_growth=areas_for_growth,
        gratitude_items=gratitude_items or [],
        overall_wellbeing_score=overall_wellbeing_score,
    )
    
    db.add(reflection)
    await db.commit()
    await db.refresh(reflection)
    
    return reflection


async def _fetch_verse_details(
    db: AsyncSession,
    verse_refs: list[dict[str, int]]
) -> list[dict[str, Any]]:
    """Fetch full details for verse references."""
    verse_details = []
    for verse_ref in verse_refs:
        if isinstance(verse_ref, dict) and 'chapter' in verse_ref and 'verse' in verse_ref:
            verse = await GitaService.get_verse_by_reference(
                db, verse_ref['chapter'], verse_ref['verse']
            )
            if verse:
                verse_details.append({
                    'chapter': verse.chapter,
                    'verse': verse.verse,
                    'english': verse.english,
                    'sanskrit': verse.sanskrit,
                    'theme': verse.theme,
                    'principle': verse.principle,
                })
    return verse_details
