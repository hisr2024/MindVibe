"""Versioned recommendation endpoints for mobile clients."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.recommendations import RecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

engine = RecommendationEngine()


@router.get("/{user_id}")
async def fetch_recommendations(
    user_id: str,
    context: str | None = Query(None, description="Optional mobile context (home, coach, journey)"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    suggestions = await engine.recommend(db, user_id=user_id, context=context)
    return {
        "user_id": user_id,
        "count": len(suggestions),
        "recommendations": [s.__dict__ for s in suggestions],
    }
