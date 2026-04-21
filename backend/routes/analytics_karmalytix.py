"""KarmaLytix analytics routes mounted at /api/analytics.

This complements the legacy /api/karmalytix/* surface with the three
endpoints the mobile KarmaLytix screen (PROMPT 4) expects:

- GET  /api/analytics/weekly-report  → latest structured Sacred Mirror
- POST /api/analytics/generate       → force-generate a fresh report
- GET  /api/analytics/history        → last N weekly reports (default 12)

The heavy lifting lives in ``karmalytix_service`` — this module only
handles auth, parameter validation, and the "insufficient data" response
when the user has fewer than three journal entries for the period.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.models.journal import JournalEntry
from backend.models.karmalytix import KarmaLytixReport
from backend.schemas.karmalytix import (
    AnalyticsGenerateRequest,
    AnalyticsWeeklyReportResponse,
    JournalMetadataSummary,
)
from backend.services.karmalytix_service import karmalytix_service

router = APIRouter(prefix="/api/analytics", tags=["analytics-karmalytix"])

# How many past reports /history returns by default. The mobile screen
# shows a 12-week trend so that is the ceiling; callers can ask for fewer.
DEFAULT_HISTORY_LIMIT = 12
MAX_HISTORY_LIMIT = 52  # one year of weekly reports, hard cap

# The "insufficient data" threshold echoes the mobile composer requirement.
MIN_ENTRIES_FOR_REPORT = 3


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_user(user_id: Optional[str]) -> str:
    """Reject unauthenticated requests with 401."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id


def _current_week_bounds(today: date | None = None) -> tuple[date, date]:
    """Return ISO-Monday..Sunday bounds containing ``today``."""
    anchor = today or date.today()
    week_start = anchor - timedelta(days=anchor.weekday())
    return week_start, week_start + timedelta(days=6)


async def _count_entries_in_period(
    db: AsyncSession, user_id: str, start: date, end: date
) -> int:
    """Cheap count query — never SELECTs the encrypted_content column."""
    start_dt = datetime.combine(start, time.min)
    end_dt = datetime.combine(end, time.max)
    stmt = select(func.count(JournalEntry.id)).where(
        and_(
            JournalEntry.user_id == user_id,
            JournalEntry.created_at >= start_dt,
            JournalEntry.created_at <= end_dt,
            JournalEntry.deleted_at.is_(None),
        )
    )
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)


def _report_to_response(
    report: KarmaLytixReport,
) -> AnalyticsWeeklyReportResponse:
    """Convert an ORM row into the analytics response shape."""
    metadata = report.journal_metadata_summary or {}
    return AnalyticsWeeklyReportResponse(
        id=report.id,
        report_date=report.report_date,
        report_type=report.report_type,
        period_start=report.period_start,
        period_end=report.period_end,
        karma_dimensions=report.karma_dimensions or {},
        overall_karma_score=report.overall_karma_score or 0,
        journal_metadata_summary=JournalMetadataSummary(**metadata),
        kiaan_insight=report.kiaan_insight,
        recommended_verses=report.recommended_verses or [],
        patterns_detected=report.patterns_detected or {},
        comparison_to_previous=report.comparison_to_previous or {},
        insufficient_data=False,
        entries_needed=0,
        message=None,
    )


def _insufficient_data_response(
    entry_count: int, week_start: date, week_end: date
) -> AnalyticsWeeklyReportResponse:
    """Response shown when the user hasn't journaled enough this week yet."""
    needed = max(0, MIN_ENTRIES_FOR_REPORT - entry_count)
    return AnalyticsWeeklyReportResponse(
        id=None,
        report_date=None,
        report_type="weekly",
        period_start=week_start,
        period_end=week_end,
        insufficient_data=True,
        entries_needed=needed,
        message=(
            "Your reflection deepens with each entry. Write at least "
            f"{MIN_ENTRIES_FOR_REPORT} reflections this week to generate your sacred mirror."
        ),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/weekly-report", response_model=AnalyticsWeeklyReportResponse)
async def get_weekly_report(
    user_id: Optional[str] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsWeeklyReportResponse:
    """Return the latest KarmaLytix Sacred Mirror for the authenticated user.

    If the user has fewer than 3 journal entries this week and no cached
    report exists, responds with ``insufficient_data=True`` so the client
    can render its "write more reflections" empty state without a 404.
    """
    uid = _require_user(user_id)
    week_start, week_end = _current_week_bounds()

    entry_count = await _count_entries_in_period(db, uid, week_start, week_end)

    # Reuse a cached report if one exists for this week; otherwise generate.
    if entry_count < MIN_ENTRIES_FOR_REPORT:
        existing = await karmalytix_service._get_existing_report(  # noqa: SLF001
            db, uid, week_start, "weekly"
        )
        if existing:
            return _report_to_response(existing)
        return _insufficient_data_response(entry_count, week_start, week_end)

    report = await karmalytix_service.generate_weekly_report(db, uid)
    return _report_to_response(report)


@router.post("/generate", response_model=AnalyticsWeeklyReportResponse)
async def generate_report(
    request: AnalyticsGenerateRequest,
    user_id: Optional[str] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsWeeklyReportResponse:
    """Force-generate a fresh Sacred Mirror for the current week.

    When ``force_regenerate`` is false and a report already exists for the
    current week, the existing report is returned unchanged (this keeps
    the Claude API spend per user bounded).
    """
    uid = _require_user(user_id)
    week_start, week_end = _current_week_bounds()

    entry_count = await _count_entries_in_period(db, uid, week_start, week_end)
    if entry_count < MIN_ENTRIES_FOR_REPORT:
        return _insufficient_data_response(entry_count, week_start, week_end)

    report = await karmalytix_service.generate_weekly_report(
        db, uid, force_regenerate=request.force_regenerate
    )
    return _report_to_response(report)


@router.get("/history", response_model=list[AnalyticsWeeklyReportResponse])
async def get_history(
    limit: int = Query(default=DEFAULT_HISTORY_LIMIT, ge=1, le=MAX_HISTORY_LIMIT),
    user_id: Optional[str] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> list[AnalyticsWeeklyReportResponse]:
    """Return past KarmaLytix reports, newest first.

    Default is 12 weeks (one quarter) to match the mobile history view;
    callers can request up to 52 weeks via ``?limit=``.
    """
    uid = _require_user(user_id)
    stmt = (
        select(KarmaLytixReport)
        .where(KarmaLytixReport.user_id == uid)
        .order_by(desc(KarmaLytixReport.report_date))
        .limit(limit)
    )
    result = await db.execute(stmt)
    reports = list(result.scalars().all())
    return [_report_to_response(r) for r in reports]
