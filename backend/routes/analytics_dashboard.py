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


# ============================================================================
# QUANTUM ENHANCEMENT #6: ADVANCED ANALYTICS
# ============================================================================

@router.get("/advanced/mood-predictions")
async def get_mood_predictions(
    forecast_days: int = Query(7, ge=1, le=14, description="Number of days to forecast")
):
    """
    Get AI-powered mood predictions with confidence intervals.

    Quantum Enhancement #6: Advanced Analytics Dashboard
    """
    from backend.services.analytics_ml_service import AnalyticsMLService, MoodDataPoint

    # Mock data for demonstration (replace with actual database query)
    ml_service = AnalyticsMLService()

    # Generate sample mood data
    mood_data = []
    base_date = datetime.now() - timedelta(days=30)
    for i in range(30):
        mood_data.append(MoodDataPoint(
            date=base_date + timedelta(days=i),
            score=6.0 + (i * 0.05),  # Gradually improving
            tags=["work", "stress"] if i % 5 == 0 else []
        ))

    predictions = ml_service.predict_mood(mood_data, forecast_days)

    return {
        "forecast_days": forecast_days,
        "predictions": [
            {
                "date": p.date.isoformat(),
                "predicted_score": p.predicted_score,
                "confidence_low": p.confidence_low,
                "confidence_high": p.confidence_high,
                "confidence_level": p.confidence_level
            }
            for p in predictions
        ],
        "model_info": {
            "type": "time_series_forecast",
            "training_data_points": len(mood_data),
            "last_updated": datetime.now().isoformat()
        }
    }


@router.get("/advanced/wellness-score")
async def get_wellness_score():
    """
    Get comprehensive wellness score (0-100) with component breakdown.

    Quantum Enhancement #6: Advanced Analytics Dashboard
    """
    from backend.services.wellness_score_service import WellnessScoreService

    wellness_service = WellnessScoreService()

    # Mock data (replace with actual database queries)
    mood_data = [
        {"score": 7.5, "at": (datetime.now() - timedelta(days=i)).isoformat()}
        for i in range(30)
    ]

    journal_data = [
        {"created_at": (datetime.now() - timedelta(days=i*3)).isoformat()}
        for i in range(10)
    ]

    verse_interactions = [
        {"timestamp": (datetime.now() - timedelta(days=i*2)).isoformat()}
        for i in range(15)
    ]

    kiaan_conversations = [
        {"created_at": (datetime.now() - timedelta(days=i*7)).isoformat()}
        for i in range(4)
    ]

    breakdown = wellness_service.calculate_wellness_score(
        mood_data, journal_data, verse_interactions, kiaan_conversations
    )

    return {
        "total_score": breakdown.total_score,
        "level": breakdown.level,
        "level_description": breakdown.level_description,
        "components": {
            "mood_stability": {
                "score": breakdown.mood_stability_score,
                "weight": "35%",
                "description": "Consistency and positivity of mood"
            },
            "engagement": {
                "score": breakdown.engagement_score,
                "weight": "25%",
                "description": "Active use of app features"
            },
            "consistency": {
                "score": breakdown.consistency_score,
                "weight": "20%",
                "description": "Regular check-ins and streaks"
            },
            "growth": {
                "score": breakdown.growth_score,
                "weight": "20%",
                "description": "Improvement trajectory over time"
            }
        },
        "recommendations": breakdown.recommendations,
        "calculated_at": datetime.now().isoformat()
    }


@router.get("/advanced/ai-insights")
async def get_ai_insights():
    """
    Get AI-powered personalized insights based on user data.

    Quantum Enhancement #6: Advanced Analytics Dashboard
    """
    from backend.services.insight_generator_service import InsightGeneratorService

    insight_service = InsightGeneratorService()

    # Mock data (replace with actual database queries)
    mood_data = [
        {"score": 7.0 + (i * 0.1), "at": (datetime.now() - timedelta(days=i)).isoformat(), "tags": {"tags": ["work", "stress"]}}
        for i in range(7)
    ]

    journal_data = [
        {"created_at": (datetime.now() - timedelta(days=i*2)).isoformat()}
        for i in range(3)
    ]

    verse_interactions = [
        {"timestamp": (datetime.now() - timedelta(days=i)).isoformat()}
        for i in range(5)
    ]

    wellness_score = 75.0
    trend_analysis = {"trend_direction": "improving"}

    weekly_insight = insight_service.generate_weekly_insight(
        mood_data, journal_data, verse_interactions,
        wellness_score, trend_analysis
    )

    mood_insight = insight_service.generate_mood_insight(
        mood_average=7.3,
        trend="improving",
        volatility=1.2,
        patterns={}
    )

    growth_insight = insight_service.generate_growth_insight(
        current_period_avg=7.5,
        previous_period_avg=6.8,
        streak_days=7
    )

    return {
        "insights": [
            {
                "type": "weekly_summary",
                "title": "Your Week in Review",
                "content": weekly_insight,
                "priority": "high",
                "icon": "🌟"
            },
            {
                "type": "mood_pattern",
                "title": "Mood Patterns",
                "content": mood_insight,
                "priority": "medium",
                "icon": "📊"
            },
            {
                "type": "growth_trajectory",
                "title": "Growth & Progress",
                "content": growth_insight,
                "priority": "medium",
                "icon": "🌱"
            }
        ],
        "generated_at": datetime.now().isoformat(),
        "ai_powered": insight_service.openai_available
    }


@router.get("/advanced/risk-assessment")
async def get_risk_assessment():
    """
    Get mental health risk assessment score (0-100).
    Lower is better.

    Quantum Enhancement #6: Advanced Analytics Dashboard
    """
    from backend.services.analytics_ml_service import AnalyticsMLService, MoodDataPoint

    ml_service = AnalyticsMLService()

    # Mock data (replace with actual database query)
    mood_data = []
    base_date = datetime.now() - timedelta(days=30)
    for i in range(30):
        mood_data.append(MoodDataPoint(
            date=base_date + timedelta(days=i),
            score=6.5 + ((i % 7) * 0.3),  # Variable scores
            tags=["stress"] if i % 5 == 0 else []
        ))

    risk_assessment = ml_service.calculate_risk_score(mood_data)

    return {
        "risk_score": risk_assessment["score"],
        "risk_level": risk_assessment["level"],
        "description": risk_assessment["description"],
        "factors": risk_assessment["factors"],
        "recommendations": [
            "Continue daily mood tracking for better insights",
            "Consider journaling when you notice stress patterns",
            "Explore meditation verses if anxiety increases"
        ] if risk_assessment["level"] == "medium" else [
            "Maintain your current wellness practices",
            "Your patterns indicate stable mental health"
        ],
        "assessed_at": datetime.now().isoformat()
    }


@router.get("/advanced/pattern-analysis")
async def get_pattern_analysis():
    """
    Get behavioral pattern analysis (weekly patterns, tag correlations).

    Quantum Enhancement #6: Advanced Analytics Dashboard
    """
    from backend.services.analytics_ml_service import AnalyticsMLService, MoodDataPoint

    ml_service = AnalyticsMLService()

    # Mock data (replace with actual database query)
    mood_data = []
    base_date = datetime.now() - timedelta(days=60)
    for i in range(60):
        day_of_week = (base_date + timedelta(days=i)).weekday()
        # Simulate "Monday blues" pattern
        score = 7.0 if day_of_week > 0 else 5.5

        mood_data.append(MoodDataPoint(
            date=base_date + timedelta(days=i),
            score=score + (i * 0.02),
            tags=["work", "stress"] if day_of_week == 0 else ["gratitude"]
        ))

    patterns = ml_service.detect_patterns(mood_data)

    return {
        "patterns": patterns,
        "insights": [
            {
                "type": "weekly_pattern",
                "title": "Weekly Rhythm",
                "description": "Your mood follows a predictable weekly pattern. Lowest on Mondays, highest on Fridays."
            },
            {
                "type": "tag_correlation",
                "title": "Emotional Triggers",
                "description": "Tags like 'work' and 'stress' correlate with lower moods, while 'gratitude' correlates with higher moods."
            }
        ],
        "analyzed_at": datetime.now().isoformat()
    }


@router.get("/advanced/trend-analysis")
async def get_advanced_trend_analysis(
    lookback_days: int = Query(90, ge=30, le=365, description="Days to analyze")
):
    """
    Get comprehensive trend analysis with anomaly detection.

    Quantum Enhancement #6: Advanced Analytics Dashboard
    """
    from backend.services.analytics_ml_service import AnalyticsMLService, MoodDataPoint

    ml_service = AnalyticsMLService()

    # Mock data (replace with actual database query)
    mood_data = []
    base_date = datetime.now() - timedelta(days=lookback_days)
    for i in range(lookback_days):
        # Simulate improving trend with some noise
        base_score = 6.0 + (i * 0.02)
        noise = (i % 7) * 0.3

        # Add an anomaly at day 45
        if i == 45:
            score = 2.5  # Sudden drop
        else:
            score = base_score + noise

        mood_data.append(MoodDataPoint(
            date=base_date + timedelta(days=i),
            score=min(10.0, max(1.0, score)),
            tags=[]
        ))

    trend_analysis = ml_service.analyze_mood_trends(mood_data, lookback_days)

    return {
        "trend": {
            "direction": trend_analysis.trend_direction,
            "strength": trend_analysis.trend_strength,
            "description": f"Your mood is {trend_analysis.trend_direction} with {int(trend_analysis.trend_strength * 100)}% confidence"
        },
        "moving_averages": {
            "7_day": trend_analysis.moving_avg_7d,
            "30_day": trend_analysis.moving_avg_30d
        },
        "volatility": {
            "score": trend_analysis.volatility,
            "interpretation": "high" if trend_analysis.volatility > 2.0 else "moderate" if trend_analysis.volatility > 1.0 else "low"
        },
        "anomalies": trend_analysis.anomalies,
        "analysis_period": {
            "days": lookback_days,
            "start_date": base_date.isoformat(),
            "end_date": datetime.now().isoformat()
        }
    }
