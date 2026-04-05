"""KarmaLytix API routes: Sacred Reflections Analysis endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.schemas.karmalytix import (
    GenerateInsightRequest,
    KarmaDashboardResponse,
    KarmaPatternResponse,
    KarmaReportResponse,
    KarmaScoreResponse,
)
from backend.services.karmalytix_service import karmalytix_service

router = APIRouter(prefix="/api/karmalytix", tags=["karmalytix"])


def _require_user(user_id: str | None) -> str:
    """Validate authenticated user and return user_id."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id


@router.get("/dashboard", response_model=KarmaDashboardResponse)
async def get_dashboard(
    user_id: str | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> KarmaDashboardResponse:
    """Get complete KarmaLytix dashboard with score, patterns, and reports."""
    uid = _require_user(user_id)
    data = await karmalytix_service.get_dashboard_data(db, uid)
    return KarmaDashboardResponse(**data)


@router.get("/karma-score", response_model=KarmaScoreResponse)
async def get_score(
    user_id: str | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> KarmaScoreResponse:
    """Get current karma score across 5 dimensions."""
    uid = _require_user(user_id)
    score = await karmalytix_service.calculate_karma_score(db, uid)
    return KarmaScoreResponse.model_validate(score)


@router.get("/weekly-report", response_model=KarmaReportResponse)
async def get_weekly_report(
    user_id: str | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> KarmaReportResponse:
    """Generate or retrieve the weekly karma report."""
    uid = _require_user(user_id)
    report = await karmalytix_service.generate_weekly_report(db, uid)
    return KarmaReportResponse.model_validate(report)


@router.get("/history", response_model=list[KarmaReportResponse])
async def get_history(
    limit: int = 8,
    user_id: str | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> list[KarmaReportResponse]:
    """Get karma report history."""
    uid = _require_user(user_id)
    reports = await karmalytix_service._get_report_history(db, uid, limit=min(limit, 24))
    return [KarmaReportResponse.model_validate(r) for r in reports]


@router.post("/generate-insight")
async def generate_insight(
    request: GenerateInsightRequest,
    user_id: str | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Generate a new KIAAN karma insight."""
    uid = _require_user(user_id)
    report = await karmalytix_service.generate_weekly_report(
        db, uid, force_regenerate=request.force_regenerate
    )
    return {"insight": report.kiaan_insight, "report_id": report.id}


@router.get("/patterns", response_model=list[KarmaPatternResponse])
async def get_patterns(
    user_id: str | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> list[KarmaPatternResponse]:
    """Get detected karma patterns."""
    uid = _require_user(user_id)
    patterns = await karmalytix_service.detect_patterns(db, uid)
    return [KarmaPatternResponse.model_validate(p) for p in patterns]
