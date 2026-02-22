"""Feedback routes: submit ratings and retrieve analytics.

Ratings are persisted in the feedback_ratings table. Analytics are
computed live (with a lightweight cache layer via feedback_summary_cache).
"""

import logging
from datetime import UTC, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.middleware.rate_limiter import limiter
from backend.models.feedback import FeedbackRating, FeedbackSummaryCache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["feedback"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RatingSubmission(BaseModel):
    """Schema for rating submission."""

    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5 stars")
    feature: Optional[str] = Field(
        None, max_length=100, description="Feature being rated (e.g. 'kiaan', 'journal')"
    )
    comment: Optional[str] = Field(
        None, max_length=1000, description="Optional feedback comment"
    )
    page_url: Optional[str] = Field(
        None, max_length=500, description="Page the user submitted feedback from"
    )


class RatingResponse(BaseModel):
    """Response after submitting a rating."""

    status: str
    rating: int
    feedback_id: str
    message: str


class FeedbackAnalytics(BaseModel):
    """Response schema for feedback analytics."""

    status: str
    total_feedback: int
    average_rating: Optional[float] = None
    distribution: dict[str, int] = {}


class RecentFeedbackItem(BaseModel):
    """A single feedback entry (for admin / self-service views)."""

    feedback_id: str
    rating: int
    feature: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime


class RecentFeedbackResponse(BaseModel):
    """Paginated list of recent feedback."""

    status: str
    items: list[RecentFeedbackItem]
    total: int


# ---------------------------------------------------------------------------
# POST /feedback/rate — persist the rating
# ---------------------------------------------------------------------------

@router.post("/rate", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def submit_rating(
    request: Request,
    submission: RatingSubmission,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> RatingResponse:
    """Submit a rating for the application or a specific feature.

    Persists the rating in the database. Supports both authenticated
    and anonymous users.
    """
    user_agent = request.headers.get("User-Agent")

    rating_row = FeedbackRating(
        user_id=user_id,
        rating=submission.rating,
        feature=submission.feature,
        comment=submission.comment,
        page_url=submission.page_url,
        user_agent=user_agent,
    )
    db.add(rating_row)
    await db.commit()
    await db.refresh(rating_row)

    logger.info(
        "Feedback submitted: id=%s rating=%d feature=%s user=%s",
        rating_row.id,
        submission.rating,
        submission.feature or "general",
        user_id or "anonymous",
    )

    return RatingResponse(
        status="saved",
        rating=submission.rating,
        feedback_id=rating_row.id,
        message="Thank you for your feedback! Your voice matters to us.",
    )


# ---------------------------------------------------------------------------
# GET /feedback/analytics — live-computed analytics
# ---------------------------------------------------------------------------

@router.get("/analytics", response_model=FeedbackAnalytics)
async def get_feedback_analytics(
    request: Request,
    feature: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> FeedbackAnalytics:
    """Get feedback analytics summary.

    Computes total count, average rating, and per-star distribution.
    Optionally filter by feature.
    """
    base = select(FeedbackRating).where(FeedbackRating.deleted_at.is_(None))
    if feature:
        base = base.where(FeedbackRating.feature == feature)

    # Aggregate query: count, average, per-star distribution
    stmt = select(
        func.count(FeedbackRating.id).label("total"),
        func.avg(FeedbackRating.rating).label("avg_rating"),
        func.sum(case((FeedbackRating.rating == 1, 1), else_=0)).label("r1"),
        func.sum(case((FeedbackRating.rating == 2, 1), else_=0)).label("r2"),
        func.sum(case((FeedbackRating.rating == 3, 1), else_=0)).label("r3"),
        func.sum(case((FeedbackRating.rating == 4, 1), else_=0)).label("r4"),
        func.sum(case((FeedbackRating.rating == 5, 1), else_=0)).label("r5"),
    ).where(FeedbackRating.deleted_at.is_(None))

    if feature:
        stmt = stmt.where(FeedbackRating.feature == feature)

    result = (await db.execute(stmt)).one()

    total = result.total or 0
    avg = round(float(result.avg_rating), 2) if result.avg_rating else None

    return FeedbackAnalytics(
        status="success",
        total_feedback=total,
        average_rating=avg,
        distribution={
            "1_star": result.r1 or 0,
            "2_star": result.r2 or 0,
            "3_star": result.r3 or 0,
            "4_star": result.r4 or 0,
            "5_star": result.r5 or 0,
        },
    )


# ---------------------------------------------------------------------------
# GET /feedback/recent — paginated recent feedback
# ---------------------------------------------------------------------------

@router.get("/recent", response_model=RecentFeedbackResponse)
async def get_recent_feedback(
    request: Request,
    feature: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> RecentFeedbackResponse:
    """Get recent feedback entries (most recent first).

    Useful for admin dashboards and user self-service views.
    """
    limit = min(limit, 100)  # Cap at 100

    base_filter = FeedbackRating.deleted_at.is_(None)
    conditions = [base_filter]
    if feature:
        conditions.append(FeedbackRating.feature == feature)

    # Count total
    count_stmt = select(func.count(FeedbackRating.id)).where(*conditions)
    total = (await db.execute(count_stmt)).scalar() or 0

    # Fetch page
    stmt = (
        select(FeedbackRating)
        .where(*conditions)
        .order_by(FeedbackRating.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()

    items = [
        RecentFeedbackItem(
            feedback_id=r.id,
            rating=r.rating,
            feature=r.feature,
            comment=r.comment,
            created_at=r.created_at,
        )
        for r in rows
    ]

    return RecentFeedbackResponse(status="success", items=items, total=total)
