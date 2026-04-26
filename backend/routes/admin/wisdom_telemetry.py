"""Admin Dynamic Wisdom Telemetry routes (read-only).

Powers the operator dashboard for the Dynamic Wisdom Corpus learning loop.
Surfaces:
  - Runtime counters from the in-process corpus (deliveries buffered/flushed,
    selection hit rate, cache hit rate, buffer depth)
  - Aggregate effectiveness from the wisdom_effectiveness table (totals,
    mood improvement rate, daily trend, top verses, learning coverage)
  - Live distribution histogram so operators can see whether scores are
    clustering near 0 (broken) or above 0.5 (healthy).

All endpoints require KIAAN_ANALYTICS_VIEW. No user content is exposed.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.middleware.rbac import (
    AdminContext,
    PermissionChecker,
    get_current_admin,
)
from backend.models import AdminPermission
from backend.models.wisdom import WisdomEffectiveness
from backend.services.dynamic_wisdom_corpus import (
    MIN_RECORDS_FOR_LEARNING,
    get_dynamic_wisdom_corpus,
)

router = APIRouter(
    prefix="/api/admin/wisdom-telemetry",
    tags=["admin-wisdom-telemetry"],
)


# ─── Schemas ────────────────────────────────────────────────────────────


class WisdomTelemetryOverview(BaseModel):
    """High-level health indicators for the Dynamic Wisdom Corpus."""

    total_records: int
    records_with_outcomes: int
    outcome_completion_rate: float | None
    average_effectiveness: float | None
    mood_improvement_rate: float | None
    distinct_verses_delivered: int
    distinct_moods_observed: int
    runtime: dict[str, Any]


class EffectivenessBucket(BaseModel):
    """One bucket in the effectiveness histogram."""

    range_start: float
    range_end: float
    count: int


class EffectivenessDistribution(BaseModel):
    bin_size: float
    buckets: list[EffectivenessBucket]
    total_observed: int


class MoodTrendPoint(BaseModel):
    date: str
    deliveries: int
    outcomes: int
    avg_effectiveness: float | None
    mood_improved_count: int
    mood_improvement_rate: float | None


class MoodTrendOut(BaseModel):
    days: int
    points: list[MoodTrendPoint]


class TopVerseRow(BaseModel):
    verse_ref: str
    mood: str
    sample_size: int
    avg_effectiveness: float
    mood_improvement_rate: float | None


class TopVersesOut(BaseModel):
    rows: list[TopVerseRow]
    threshold: int


class LearningCoverageRow(BaseModel):
    mood: str
    eligible_verses: int
    total_records: int
    pct_outcomes_recorded: float | None


class LearningCoverageOut(BaseModel):
    threshold: int
    rows: list[LearningCoverageRow]


# ─── Routes ─────────────────────────────────────────────────────────────


@router.get("/overview", response_model=WisdomTelemetryOverview)
async def telemetry_overview(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
) -> WisdomTelemetryOverview:
    """Snapshot of the corpus: persistent stats + in-process runtime metrics."""
    corpus = get_dynamic_wisdom_corpus()

    total_q = await db.execute(select(func.count()).select_from(WisdomEffectiveness))
    total = total_q.scalar() or 0

    with_outcomes_q = await db.execute(
        select(func.count())
        .select_from(WisdomEffectiveness)
        .where(WisdomEffectiveness.effectiveness.isnot(None))
    )
    with_outcomes = with_outcomes_q.scalar() or 0

    avg_q = await db.execute(
        select(func.avg(WisdomEffectiveness.effectiveness)).where(
            WisdomEffectiveness.effectiveness.isnot(None)
        )
    )
    avg_eff = avg_q.scalar()

    improved_q = await db.execute(
        select(func.count())
        .select_from(WisdomEffectiveness)
        .where(WisdomEffectiveness.mood_improved.is_(True))
    )
    improved = improved_q.scalar() or 0

    distinct_verses_q = await db.execute(
        select(func.count(func.distinct(WisdomEffectiveness.verse_ref)))
    )
    distinct_verses = distinct_verses_q.scalar() or 0

    distinct_moods_q = await db.execute(
        select(func.count(func.distinct(WisdomEffectiveness.mood_at_delivery)))
    )
    distinct_moods = distinct_moods_q.scalar() or 0

    completion_rate = (with_outcomes / total) if total > 0 else None
    improvement_rate = (improved / with_outcomes) if with_outcomes > 0 else None

    return WisdomTelemetryOverview(
        total_records=total,
        records_with_outcomes=with_outcomes,
        outcome_completion_rate=(
            round(completion_rate, 3) if completion_rate is not None else None
        ),
        average_effectiveness=(
            round(float(avg_eff), 3) if avg_eff is not None else None
        ),
        mood_improvement_rate=(
            round(improvement_rate, 3) if improvement_rate is not None else None
        ),
        distinct_verses_delivered=distinct_verses,
        distinct_moods_observed=distinct_moods,
        runtime=corpus.get_runtime_metrics(),
    )


@router.get("/effectiveness-distribution", response_model=EffectivenessDistribution)
async def effectiveness_distribution(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
    bin_size: float = Query(0.1, ge=0.05, le=0.5),
) -> EffectivenessDistribution:
    """Histogram of effectiveness scores so operators can spot regressions.

    Healthy systems concentrate above 0.4 with a long tail toward 1.0. A
    spike near 0 means the AI provider is producing wisdom that doesn't move
    moods — a strong signal to investigate prompts or providers.
    """
    # Pull all scored rows; we histogram in Python to avoid dialect-specific
    # width_bucket SQL. The wisdom_effectiveness table is small enough
    # (typically <1M rows) that a single scan is fine.
    rows_q = await db.execute(
        select(WisdomEffectiveness.effectiveness).where(
            WisdomEffectiveness.effectiveness.isnot(None)
        )
    )
    scores = [float(r[0]) for r in rows_q.all()]

    # Build inclusive [0, 1] buckets at the requested width
    bucket_count = max(1, int(round(1.0 / bin_size)))
    counts = [0] * bucket_count
    for s in scores:
        idx = min(bucket_count - 1, max(0, int(s / bin_size)))
        counts[idx] += 1

    buckets = [
        EffectivenessBucket(
            range_start=round(i * bin_size, 4),
            range_end=round((i + 1) * bin_size, 4),
            count=counts[i],
        )
        for i in range(bucket_count)
    ]
    return EffectivenessDistribution(
        bin_size=bin_size,
        buckets=buckets,
        total_observed=len(scores),
    )


@router.get("/mood-improvement-trend", response_model=MoodTrendOut)
async def mood_improvement_trend(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
    days: int = Query(14, ge=1, le=90),
) -> MoodTrendOut:
    """Daily trend of deliveries, outcomes, and mood improvement rate.

    The dashboard renders this as a stacked area + line chart so operators
    can see the learning loop's pulse over time.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)
    delivered_at_date = func.date(WisdomEffectiveness.delivered_at)

    has_outcome = case(
        (WisdomEffectiveness.effectiveness.isnot(None), 1), else_=0
    )
    is_improved = case(
        (WisdomEffectiveness.mood_improved.is_(True), 1), else_=0
    )
    rows_q = await db.execute(
        select(
            delivered_at_date.label("d"),
            func.count().label("deliveries"),
            func.sum(has_outcome).label("outcomes"),
            func.avg(WisdomEffectiveness.effectiveness).label("avg_eff"),
            func.sum(is_improved).label("improved"),
        )
        .where(WisdomEffectiveness.delivered_at >= since)
        .group_by(delivered_at_date)
        .order_by(delivered_at_date.asc())
    )

    points: list[MoodTrendPoint] = []
    for row in rows_q.all():
        d, deliveries, outcomes, avg_eff, improved = row
        deliveries = int(deliveries or 0)
        outcomes = int(outcomes or 0)
        improved = int(improved or 0)
        rate = improved / outcomes if outcomes > 0 else None
        points.append(
            MoodTrendPoint(
                date=str(d),
                deliveries=deliveries,
                outcomes=outcomes,
                avg_effectiveness=(
                    round(float(avg_eff), 3) if avg_eff is not None else None
                ),
                mood_improved_count=improved,
                mood_improvement_rate=(
                    round(rate, 3) if rate is not None else None
                ),
            )
        )

    return MoodTrendOut(days=days, points=points)


@router.get("/top-verses", response_model=TopVersesOut)
async def top_verses(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
    mood: str | None = Query(None, description="Filter to one mood; omit for all"),
    limit: int = Query(20, ge=1, le=100),
) -> TopVersesOut:
    """Top performing verse/mood pairs by avg effectiveness.

    Drives the "what's actually working" panel of the dashboard.
    """
    is_improved = case(
        (WisdomEffectiveness.mood_improved.is_(True), 1), else_=0
    )
    stmt = (
        select(
            WisdomEffectiveness.verse_ref,
            WisdomEffectiveness.mood_at_delivery,
            func.count().label("sample_size"),
            func.avg(WisdomEffectiveness.effectiveness).label("avg_eff"),
            func.sum(is_improved).label("improved"),
        )
        .where(WisdomEffectiveness.effectiveness.isnot(None))
        .group_by(
            WisdomEffectiveness.verse_ref,
            WisdomEffectiveness.mood_at_delivery,
        )
        .having(func.count() >= MIN_RECORDS_FOR_LEARNING)
        .order_by(func.avg(WisdomEffectiveness.effectiveness).desc())
        .limit(limit)
    )

    if mood:
        stmt = stmt.where(WisdomEffectiveness.mood_at_delivery == mood)

    result = await db.execute(stmt)
    rows: list[TopVerseRow] = []
    for verse_ref, mood_val, sample, avg_eff, improved in result.all():
        improved_int = int(improved or 0)
        rate = improved_int / int(sample) if sample else None
        rows.append(
            TopVerseRow(
                verse_ref=verse_ref,
                mood=mood_val,
                sample_size=int(sample),
                avg_effectiveness=round(float(avg_eff), 3),
                mood_improvement_rate=(
                    round(rate, 3) if rate is not None else None
                ),
            )
        )

    return TopVersesOut(rows=rows, threshold=MIN_RECORDS_FOR_LEARNING)


@router.get("/learning-coverage", response_model=LearningCoverageOut)
async def learning_coverage(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
) -> LearningCoverageOut:
    """Per-mood coverage: which moods have enough data for learned ranking.

    Lets operators quickly see "we don't have enough data for jealous yet"
    so they can route those moods through the static fallback.
    """
    # Per-mood aggregate
    has_outcome = case(
        (WisdomEffectiveness.effectiveness.isnot(None), 1), else_=0
    )
    mood_q = await db.execute(
        select(
            WisdomEffectiveness.mood_at_delivery,
            func.count().label("total"),
            func.sum(has_outcome).label("with_outcome"),
        )
        .group_by(WisdomEffectiveness.mood_at_delivery)
    )
    mood_rows = {r[0]: (int(r[1] or 0), int(r[2] or 0)) for r in mood_q.all()}

    # Per-mood eligible verse count (verses passing the threshold)
    # Subquery returns one row per (mood, verse) that has ≥ threshold outcomes.
    eligible_q = await db.execute(
        select(
            WisdomEffectiveness.mood_at_delivery,
            WisdomEffectiveness.verse_ref,
        )
        .where(WisdomEffectiveness.effectiveness.isnot(None))
        .group_by(
            WisdomEffectiveness.mood_at_delivery,
            WisdomEffectiveness.verse_ref,
        )
        .having(func.count() >= MIN_RECORDS_FOR_LEARNING)
    )
    eligible_per_mood: dict[str, int] = {}
    for mood_val, _verse in eligible_q.all():
        eligible_per_mood[mood_val] = eligible_per_mood.get(mood_val, 0) + 1

    rows: list[LearningCoverageRow] = []
    for mood_val, (total, with_outcome) in sorted(
        mood_rows.items(), key=lambda x: -x[1][0]
    ):
        pct = (with_outcome / total) if total > 0 else None
        rows.append(
            LearningCoverageRow(
                mood=mood_val,
                eligible_verses=eligible_per_mood.get(mood_val, 0),
                total_records=total,
                pct_outcomes_recorded=(
                    round(pct, 3) if pct is not None else None
                ),
            )
        )

    return LearningCoverageOut(threshold=MIN_RECORDS_FOR_LEARNING, rows=rows)


@router.post("/buffer/flush", status_code=200)
async def flush_buffer(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
) -> dict[str, Any]:
    """Operator escape hatch: force-flush the in-memory delivery buffer.

    Useful before a hot deploy if shutdown drain is somehow skipped, or
    while debugging to make a delivery instantly queryable.
    """
    corpus = get_dynamic_wisdom_corpus()
    flushed = await corpus._flush_buffer()
    return {"flushed": flushed, "runtime": corpus.get_runtime_metrics()}
