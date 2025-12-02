"""
Karmic Tree Analytics API Routes
Provides growth analytics data for the Karmic Tree visualization.
READ-ONLY tracking endpoints that do not modify KIAAN's core functionality.
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id

router = APIRouter(prefix="/karmic-tree", tags=["karmic-tree"])


class Milestone(BaseModel):
    """Achievement milestone for the tree visualization."""
    id: str
    name: str
    description: str
    icon: str
    earned_at: Optional[str] = None
    position: dict  # { x: number, y: number }


class TreeStats(BaseModel):
    """Statistics that affect tree growth and appearance."""
    mood_score: float = 7.0
    mood_trend: str = "stable"  # up, down, stable
    journal_streak: int = 0
    kiaan_conversations: int = 0
    total_entries: int = 0
    tree_health: int = 50  # 0-100
    season: str = "spring"  # spring, summer, autumn, winter


class KarmicTreeResponse(BaseModel):
    """Full response for karmic tree visualization."""
    stats: TreeStats
    milestones: list[Milestone]
    season_description: str
    growth_tips: list[str]


def calculate_season(mood_score: float, journal_streak: int) -> str:
    """Calculate tree season based on user activity."""
    score = (mood_score * 0.6) + (journal_streak * 0.4)
    if score >= 7:
        return "summer"
    elif score >= 5:
        return "spring"
    elif score >= 3:
        return "autumn"
    return "winter"


def get_season_description(season: str) -> str:
    """Get description for the current season."""
    descriptions = {
        "summer": "Full bloom – Your mindfulness practice is thriving!",
        "spring": "Growing – Positive momentum building.",
        "autumn": "Reflection – A time for deeper introspection.",
        "winter": "Rest & renewal – Nurturing your roots.",
    }
    return descriptions.get(season, descriptions["spring"])


@router.get("", response_model=KarmicTreeResponse)
async def get_karmic_tree_data(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> KarmicTreeResponse:
    """
    Get all data needed for the Karmic Tree visualization.
    
    Returns:
        KarmicTreeResponse: Tree stats, milestones, and growth tips.
    """
    # In production, these would be calculated from actual user data
    # For now, return sample data that demonstrates the visualization
    stats = TreeStats(
        mood_score=7.2,
        mood_trend="up",
        journal_streak=7,
        kiaan_conversations=28,
        total_entries=42,
        tree_health=72,
        season=calculate_season(7.2, 7),
    )
    
    milestones = [
        Milestone(
            id="first_checkin",
            name="First Check-in",
            description="You completed your first mood check-in",
            icon="🌱",
            earned_at=datetime.now().isoformat(),
            position={"x": 20, "y": 70},
        ),
        Milestone(
            id="week_streak",
            name="7-Day Streak",
            description="You've been consistent for a week",
            icon="🔥",
            earned_at=datetime.now().isoformat(),
            position={"x": 75, "y": 65},
        ),
        Milestone(
            id="kiaan_explorer",
            name="10 KIAAN Chats",
            description="You've had 10 meaningful conversations",
            icon="💬",
            earned_at=datetime.now().isoformat(),
            position={"x": 15, "y": 40},
        ),
        Milestone(
            id="first_journal",
            name="First Journal Entry",
            description="You wrote your first reflection",
            icon="📝",
            earned_at=datetime.now().isoformat(),
            position={"x": 80, "y": 35},
        ),
        Milestone(
            id="mood_improved",
            name="Mood Improved",
            description="Your mood trend is positive",
            icon="✨",
            earned_at=datetime.now().isoformat(),
            position={"x": 50, "y": 25},
        ),
    ]
    
    growth_tips = [
        "Daily check-ins help your tree bloom",
        "Regular journaling waters your roots",
        "KIAAN conversations strengthen your growth",
    ]
    
    return KarmicTreeResponse(
        stats=stats,
        milestones=milestones,
        season_description=get_season_description(stats.season),
        growth_tips=growth_tips,
    )


@router.get("/stats", response_model=TreeStats)
async def get_tree_stats(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> TreeStats:
    """
    Get just the stats for the Karmic Tree.
    Useful for lightweight updates.
    """
    # In production, calculate from actual user data
    mood_score = 7.2
    journal_streak = 7
    kiaan_conversations = 28
    
    tree_health = min(100, int((mood_score * 5) + (journal_streak * 2) + (kiaan_conversations * 1.5)))
    
    return TreeStats(
        mood_score=mood_score,
        mood_trend="up",
        journal_streak=journal_streak,
        kiaan_conversations=kiaan_conversations,
        total_entries=42,
        tree_health=tree_health,
        season=calculate_season(mood_score, journal_streak),
    )


@router.get("/milestones", response_model=list[Milestone])
async def get_milestones(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> list[Milestone]:
    """
    Get all earned milestones for the Karmic Tree.
    """
    # In production, query from database
    return [
        Milestone(
            id="first_checkin",
            name="First Check-in",
            description="You completed your first mood check-in",
            icon="🌱",
            earned_at=datetime.now().isoformat(),
            position={"x": 20, "y": 70},
        ),
    ]
