from datetime import datetime, timedelta

from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI(title="MindVibe Analytics", version="1.0.0")

from backend.deps import get_db


@app.get("/analytics/health")
async def health():
    return {"status": "healthy", "service": "analytics", "timestamp": datetime.now().isoformat()}

@app.get("/analytics/v1/mood-trends")
async def get_mood_trends(user_id: str, days: int = 30, db: AsyncSession = Depends(get_db)):
    """Read-only mood trend analysis"""
    query = text("""
        SELECT
            DATE(at) as date,
            AVG(score) as avg_mood,
            COUNT(*) as entries,
            STDDEV(score) as volatility
        FROM moods
        WHERE user_id = :user_id
        AND at >= :start_date
        AND deleted_at IS NULL
        GROUP BY DATE(at)
        ORDER BY date DESC
    """)

    result = await db.execute(query, {
        "user_id": user_id,
        "start_date": datetime.now() - timedelta(days=days)
    })

    trends = []
    for r in result:
        trends.append({
            "date": str(r.date),
            "avg_mood": float(r.avg_mood),
            "entries": r.entries,
            "volatility": float(r.volatility or 0)
        })

    return {"trends": trends, "period_days": days}

@app.get("/analytics/v1/usage-stats")
async def get_usage_stats(user_id: str, db: AsyncSession = Depends(get_db)):
    """Read-only usage statistics"""
    queries = {
        "total_moods": text("SELECT COUNT(*) FROM moods WHERE user_id = :user_id AND deleted_at IS NULL"),
        "total_journals": text("SELECT COUNT(*) FROM journal_entries WHERE user_id = :user_id AND deleted_at IS NULL"),
        "total_chats": text("SELECT COUNT(*) FROM chat_messages WHERE user_id = :user_id"),
        "streak_days": text("""
            SELECT COUNT(DISTINCT DATE(at))
            FROM moods
            WHERE user_id = :user_id
            AND at >= :thirty_days_ago
            AND deleted_at IS NULL
        """)
    }

    stats = {}
    for key, query in queries.items():
        result = await db.execute(query, {"user_id": user_id, "thirty_days_ago": datetime.now() - timedelta(days=30)})
        stats[key] = result.scalar()

    return {"user_id": user_id, "statistics": stats, "generated_at": datetime.now().isoformat()}

@app.get("/analytics/v1/insights")
async def get_insights(user_id: str, db: AsyncSession = Depends(get_db)):
    """AI-powered insights from user data"""
    # Aggregate data from multiple sources (read-only)
    mood_query = text("SELECT AVG(score) as avg, COUNT(*) as cnt FROM moods WHERE user_id = :user_id AND at >= :week_ago AND deleted_at IS NULL")
    mood_result = await db.execute(mood_query, {"user_id": user_id, "week_ago": datetime.now() - timedelta(days=7)})
    mood_data = mood_result.first()

    journal_query = text("SELECT COUNT(*) FROM journal_entries WHERE user_id = :user_id AND created_at >= :week_ago AND deleted_at IS NULL")
    journal_result = await db.execute(journal_query, {"user_id": user_id, "week_ago": datetime.now() - timedelta(days=7)})
    journal_count = journal_result.scalar()

    # Generate insights
    insights = []
    if mood_data.avg:
        if mood_data.avg < 5:
            insights.append({"type": "mood_low", "message": "Your mood has been lower than usual this week. Consider talking to KIAAN.", "severity": "medium"})
        elif mood_data.avg > 8:
            insights.append({"type": "mood_high", "message": "You're doing great! Your mood is consistently positive.", "severity": "positive"})

    if journal_count < 2:
        insights.append({"type": "journaling", "message": "Try journaling more regularly. It helps process emotions.", "severity": "low"})

    return {"insights": insights, "generated_at": datetime.now().isoformat()}
