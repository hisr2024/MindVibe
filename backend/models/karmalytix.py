"""KarmaLytix models: Sacred Reflections Analysis engine for karma scoring and patterns."""

from __future__ import annotations

import datetime

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Date,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class KarmaLytixReport(Base):
    """Weekly/monthly karma analysis reports generated from journal metadata.

    Analyzes ONLY metadata (mood_labels, tag_labels, timestamps, frequency,
    verse bookmarks, assessment responses, emotional logs) — never decrypted content.
    """

    __tablename__ = "karmalytix_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    report_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    report_type: Mapped[str] = mapped_column(String(20), nullable=False, default="weekly")
    period_start: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    period_end: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    karma_dimensions: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    overall_karma_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    journal_metadata_summary: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    kiaan_insight: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommended_verses: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    patterns_detected: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    comparison_to_previous: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "report_date", "report_type", name="uq_karmalytix_report"),
        Index("idx_karmalytix_user_date", "user_id", "report_date"),
    )


class KarmaPattern(Base):
    """Detected spiritual patterns from karma score trends over time."""

    __tablename__ = "karma_patterns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    pattern_type: Mapped[str] = mapped_column(String(30), nullable=False)
    pattern_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    supporting_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    first_detected_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_seen_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    gita_verse_ref: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_karma_patterns_user_active", "user_id", "is_active"),
    )


class KarmaScore(Base):
    """Daily karma scores across 5 spiritual dimensions."""

    __tablename__ = "karma_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    score_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    emotional_balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    spiritual_growth: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    consistency: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    self_awareness: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    wisdom_integration: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "score_date", name="uq_karma_score"),
        Index("idx_karma_scores_user_date", "user_id", "score_date"),
    )
