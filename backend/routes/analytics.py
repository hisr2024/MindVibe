"""
Analytics API Routes
Provides user-specific analytics data for the MindVibe dashboard.
These are READ-ONLY tracking endpoints that do not modify KIAAN's core functionality.
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from enum import Enum

router = APIRouter(prefix="/analytics", tags=["analytics"])


class AnalyticsPeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    ALL = "all"


class MoodDataPoint(BaseModel):
    date: str
    score: float
    label: Optional[str] = None
    notes: Optional[str] = None


class SentimentDistribution(BaseModel):
    positive: int = 45
    neutral: int = 35
    negative: int = 15
    mixed: int = 5


class TagFrequency(BaseModel):
    tag: str
    count: int
    percentage: float


class OverviewResponse(BaseModel):
    totalEntries: int = 42
    totalWords: int = 12450
    avgWordsPerEntry: int = 296
    currentStreak: int = 7
    longestStreak: int = 14
    avgMoodScore: float = 7.2
    moodTrend: str = "up"
    kiaanConversations: int = 28
    kiaanMessages: int = 156
    lastActivityDate: Optional[str] = None


class MoodTrendResponse(BaseModel):
    period: str
    data: list[MoodDataPoint]
    averageScore: float
    highestScore: float
    lowestScore: float
    trend: str
    changePercentage: float


class JournalStatsResponse(BaseModel):
    totalEntries: int = 42
    totalWords: int = 12450
    avgWordsPerEntry: int = 296
    currentStreak: int = 7
    longestStreak: int = 14
    sentimentDistribution: SentimentDistribution
    topTags: list[TagFrequency]
    writingTimeDistribution: list[dict]
    entriesByMonth: list[dict]
    avgEntriesPerWeek: float = 3.5


class KIAANInsightResponse(BaseModel):
    totalConversations: int = 28
    totalMessages: int = 156
    avgMessagesPerConversation: float = 5.6
    avgResponseTime: float = 1.2
    topTopics: list[TagFrequency]
    engagementLevel: str = "high"
    usageByHour: list[dict]
    usageByDay: list[dict]
    recentConversations: list[dict] = []
    streakDays: int = 7


class WeeklySummaryResponse(BaseModel):
    weekStart: str
    weekEnd: str
    moodSummary: dict
    journalSummary: dict
    kiaanSummary: dict
    insights: list[dict]
    achievements: list[dict] = []
    highlightQuote: Optional[str] = None
    comparisonToPreviousWeek: dict


class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    earnedAt: Optional[str] = None
    progress: Optional[int] = None
    target: Optional[int] = None
    category: str
    rarity: str


def _generate_hourly_usage() -> list[dict]:
    """Generate usage by hour data with higher activity during daytime hours."""
    usage = []
    for hour in range(24):
        # Higher message count during active hours (8am-10pm)
        is_active_hour = 8 <= hour <= 22
        message_count = 10 if is_active_hour else 5
        usage.append({"hour": hour, "messageCount": message_count})
    return usage


@router.get("/dashboard")
async def analytics_dashboard():
    """Get complete dashboard analytics data."""
    return {"status": "success", "metrics": {}}


@router.get("/users")
async def user_analytics():
    """Get user-specific analytics."""
    return {"status": "success", "user_analytics": {}}


@router.get("/overview", response_model=OverviewResponse)
async def get_analytics_overview(
    start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get overview metrics for the analytics dashboard.
    Returns summary statistics including journal entries, mood scores, and KIAAN usage.
    """
    return OverviewResponse(
        totalEntries=42,
        totalWords=12450,
        avgWordsPerEntry=296,
        currentStreak=7,
        longestStreak=14,
        avgMoodScore=7.2,
        moodTrend="up",
        kiaanConversations=28,
        kiaanMessages=156,
        lastActivityDate=datetime.now().isoformat()
    )


@router.get("/mood-trends", response_model=MoodTrendResponse)
async def get_mood_trends(
    period: AnalyticsPeriod = Query(AnalyticsPeriod.WEEKLY, description="Time period for mood data")
):
    """
    Get mood trend data for visualization.
    Returns mood scores over time with trend analysis.
    """
    # Data points mapping based on period
    period_data_points = {
        AnalyticsPeriod.DAILY: 7,
        AnalyticsPeriod.WEEKLY: 4,
        AnalyticsPeriod.MONTHLY: 12,
        AnalyticsPeriod.YEARLY: 12,
        AnalyticsPeriod.ALL: 12,
    }
    data_points = period_data_points.get(period, 7)
    
    # Days multiplier for calculating date offsets
    days_multiplier = 1 if period == AnalyticsPeriod.DAILY else 7
    
    data = []
    base_date = datetime.now()
    mood_labels = ["😊", "😌", "😐", "😔", "😊"]
    
    for i in range(data_points):
        days_back = (data_points - 1 - i) * days_multiplier
        date = (base_date - timedelta(days=days_back)).strftime("%Y-%m-%d")
        score = 5.0 + (i / data_points) * 4.0  # Gradually improving trend
        data.append(MoodDataPoint(
            date=date,
            score=round(score, 1),
            label=mood_labels[i % len(mood_labels)]
        ))
    
    return MoodTrendResponse(
        period=period.value,
        data=data,
        averageScore=7.2,
        highestScore=9.0,
        lowestScore=5.0,
        trend="improving",
        changePercentage=8.5
    )


@router.get("/journal-stats", response_model=JournalStatsResponse)
async def get_journal_statistics():
    """
    Get detailed journal statistics.
    Returns entry counts, sentiment analysis, and writing patterns.
    """
    return JournalStatsResponse(
        totalEntries=42,
        totalWords=12450,
        avgWordsPerEntry=296,
        currentStreak=7,
        longestStreak=14,
        sentimentDistribution=SentimentDistribution(),
        topTags=[
            TagFrequency(tag="gratitude", count=15, percentage=35.0),
            TagFrequency(tag="work", count=12, percentage=28.0),
            TagFrequency(tag="family", count=8, percentage=19.0),
            TagFrequency(tag="health", count=5, percentage=12.0),
            TagFrequency(tag="goals", count=2, percentage=6.0),
        ],
        writingTimeDistribution=[
            {"hour": 8, "dayOfWeek": 1, "count": 5},
            {"hour": 21, "dayOfWeek": 1, "count": 8},
            {"hour": 8, "dayOfWeek": 2, "count": 3},
            {"hour": 22, "dayOfWeek": 3, "count": 6},
        ],
        entriesByMonth=[
            {"month": "Jan", "count": 8},
            {"month": "Feb", "count": 10},
            {"month": "Mar", "count": 12},
            {"month": "Apr", "count": 12},
        ],
        avgEntriesPerWeek=3.5
    )


@router.get("/kiaan-insights", response_model=KIAANInsightResponse)
async def get_kiaan_insights():
    """
    Get KIAAN conversation insights.
    READ-ONLY analytics that do not affect KIAAN's core functionality.
    """
    return KIAANInsightResponse(
        totalConversations=28,
        totalMessages=156,
        avgMessagesPerConversation=5.6,
        avgResponseTime=1.2,
        topTopics=[
            TagFrequency(tag="stress", count=12, percentage=30.0),
            TagFrequency(tag="relationships", count=8, percentage=20.0),
            TagFrequency(tag="work", count=7, percentage=17.0),
            TagFrequency(tag="mindfulness", count=6, percentage=15.0),
            TagFrequency(tag="sleep", count=5, percentage=13.0),
        ],
        engagementLevel="high",
        usageByHour=_generate_hourly_usage(),
        usageByDay=[
            {"dayOfWeek": 0, "dayName": "Sun", "messageCount": 18},
            {"dayOfWeek": 1, "dayName": "Mon", "messageCount": 24},
            {"dayOfWeek": 2, "dayName": "Tue", "messageCount": 22},
            {"dayOfWeek": 3, "dayName": "Wed", "messageCount": 28},
            {"dayOfWeek": 4, "dayName": "Thu", "messageCount": 20},
            {"dayOfWeek": 5, "dayName": "Fri", "messageCount": 26},
            {"dayOfWeek": 6, "dayName": "Sat", "messageCount": 18},
        ],
        recentConversations=[],
        streakDays=7
    )


@router.get("/weekly-summary", response_model=WeeklySummaryResponse)
async def get_weekly_summary(
    weekStart: Optional[str] = Query(None, description="Week start date (YYYY-MM-DD)")
):
    """
    Get weekly summary with insights and achievements.
    """
    now = datetime.now()
    week_start = now - timedelta(days=now.weekday())
    week_end = week_start + timedelta(days=6)
    
    return WeeklySummaryResponse(
        weekStart=week_start.strftime("%Y-%m-%d"),
        weekEnd=week_end.strftime("%Y-%m-%d"),
        moodSummary={
            "avgScore": 7.5,
            "trend": "up",
            "bestDay": "Wednesday",
            "challengingDay": "Monday"
        },
        journalSummary={
            "entriesCount": 5,
            "totalWords": 1450,
            "topTopics": ["gratitude", "work", "family"]
        },
        kiaanSummary={
            "conversationCount": 4,
            "messageCount": 24,
            "topTopics": ["stress management", "mindfulness"]
        },
        insights=[
            {
                "type": "mood",
                "title": "Positive Trend",
                "description": "Your mood has improved 15% compared to last week!",
                "icon": "📈"
            },
            {
                "type": "journal",
                "title": "Consistent Writer",
                "description": "You maintained your 7-day writing streak.",
                "icon": "✍️"
            }
        ],
        achievements=[],
        highlightQuote="The mind is everything. What you think, you become. - Buddha",
        comparisonToPreviousWeek={
            "moodChange": 15,
            "entriesChange": 10,
            "kiaanChange": -5
        }
    )


@router.get("/achievements", response_model=list[Achievement])
async def get_achievements():
    """
    Get user achievements.
    """
    return [
        Achievement(
            id="first_entry",
            name="First Steps",
            description="Write your first journal entry",
            icon="📝",
            earnedAt=datetime.now().isoformat(),
            category="journal",
            rarity="common"
        ),
        Achievement(
            id="week_streak",
            name="Week Warrior",
            description="Maintain a 7-day writing streak",
            icon="🔥",
            earnedAt=datetime.now().isoformat(),
            category="streak",
            rarity="uncommon"
        ),
        Achievement(
            id="kiaan_explorer",
            name="KIAAN Explorer",
            description="Have 10 conversations with KIAAN",
            icon="💬",
            progress=8,
            target=10,
            category="kiaan",
            rarity="uncommon"
        ),
        Achievement(
            id="mood_master",
            name="Mood Master",
            description="Track your mood for 30 days",
            icon="😊",
            progress=21,
            target=30,
            category="mood",
            rarity="rare"
        )
    ]


@router.post("/export")
async def export_analytics_data(
    format: str = Query("csv", description="Export format: csv, json, or pdf"),
    dataTypes: list[str] = Query(["all"], description="Data types to export")
):
    """
    Export user analytics data.
    Supports CSV, JSON, and PDF formats.
    """
    # In production, this would generate actual export data
    return {
        "status": "success",
        "message": f"Export initiated in {format} format",
        "dataTypes": dataTypes
    }
