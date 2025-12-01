from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.services.mood_analytics import compute_daily_mood_summary
from backend.services.semantic_insights import SemanticInsightsService

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/semantic-wisdom")
async def semantic_wisdom(
    q: str = Query(..., description="User question or reflection"),
    limit: int = Query(5, ge=1, le=10),
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    service = SemanticInsightsService()
    await service.bootstrap(db, user_id=user_id)
    results = service.semantic_wisdom(q, top_k=limit)
    return {"query": q, "matches": results}


@router.get("/mood-summary")
async def mood_summary(
    hours: int = Query(24, ge=1, le=168, description="Window of time to summarize"),
    db: AsyncSession = Depends(get_db),
):
    summary = await compute_daily_mood_summary(db, window_hours=hours)
    return summary
