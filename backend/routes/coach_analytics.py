"""Admin/coach analytics dashboard endpoints."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.coach_analytics import CoachAnalyticsService

router = APIRouter(prefix="/coach", tags=["coach-analytics"])
service = CoachAnalyticsService()


@router.get("/analytics/overview")
async def analytics_overview(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    return await service.overview(db)


@router.get("/analytics/mood-trend")
async def analytics_mood_trend(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    return {"trend": await service.mood_trend(db)}


@router.get("/analytics/engagement")
async def analytics_engagement(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    return await service.engagement(db)
