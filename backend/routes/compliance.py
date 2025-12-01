"""Data export, deletion, and retention policy endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.middleware.feature_gates import require_feature
from backend.security.rate_limiter import rate_limit
from backend.services.data_retention import (
    delete_user_bundle,
    export_user_bundle,
)
from backend.core.settings import settings

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


@router.get("/policy", dependencies=[Depends(rate_limit(10, 60))])
async def policy():
    """Expose current data retention settings for transparency."""

    return {
        "retention_days": settings.DATA_RETENTION_DAYS,
        "retention_enabled": settings.DATA_RETENTION_ENABLED,
        "export_supported": True,
        "delete_supported": True,
    }


@router.post("/export", dependencies=[Depends(rate_limit(3, 60))])
@require_feature("journal")
async def export_my_data(db: AsyncSession = Depends(get_db)):
    user_id = get_user_id()
    bundle = await export_user_bundle(user_id, db)
    return {"data": bundle}


@router.post("/delete", dependencies=[Depends(rate_limit(2, 300))])
@require_feature("journal")
async def delete_my_data(db: AsyncSession = Depends(get_db)):
    user_id = get_user_id()
    result = await delete_user_bundle(user_id, db)
    return {"status": "accepted", **result}


__all__ = ["router"]
