"""Feedback models: FeedbackRating for persisting user ratings and comments."""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import (
    TIMESTAMP,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


class FeedbackRating(SoftDeleteMixin, Base):
    """Persists user feedback ratings and comments.

    Each row represents a single feedback submission. Supports both
    authenticated and anonymous users (user_id is nullable).
    Soft-deleted so we never lose feedback data.
    """

    __tablename__ = "feedback_ratings"

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    feature: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Client context for analytics (no PII)
    page_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class FeedbackSummaryCache(Base):
    """Materialized analytics cache for feedback summaries.

    Updated periodically to avoid expensive COUNT/AVG queries on every
    analytics request. One row per feature (or 'overall' for global).
    """

    __tablename__ = "feedback_summary_cache"

    feature: Mapped[str] = mapped_column(String(100), primary_key=True)
    total_count: Mapped[int] = mapped_column(Integer, default=0)
    average_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    rating_1_count: Mapped[int] = mapped_column(Integer, default=0)
    rating_2_count: Mapped[int] = mapped_column(Integer, default=0)
    rating_3_count: Mapped[int] = mapped_column(Integer, default=0)
    rating_4_count: Mapped[int] = mapped_column(Integer, default=0)
    rating_5_count: Mapped[int] = mapped_column(Integer, default=0)
    last_updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
