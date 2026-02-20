"""Emotional and analysis models: reset sessions, logs, assessments, bookmarks."""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Date,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


class EmotionalResetSession(SoftDeleteMixin, Base):
    """Tracks user emotional reset sessions with the 7-step guided flow.

    Supports both authenticated and anonymous users:
    - Authenticated users: user_id is their actual user ID from users table
    - Anonymous users: user_id follows pattern "anon-{12-char-hex}"

    Note: Foreign key constraint removed to support anonymous users.
    For authenticated users, application-level validation is performed via
    get_current_user() dependency which verifies the user exists.
    """

    __tablename__ = "emotional_reset_sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255),
        index=True,
        # Note: No FK constraint - supports anonymous users (anon-{uuid})
        # Authenticated user IDs are validated at the application layer
    )
    session_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    current_step: Mapped[int] = mapped_column(Integer, default=1)
    emotions_input: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessment_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    wisdom_verses: Mapped[list | None] = mapped_column(JSON, nullable=True)
    affirmations: Mapped[list | None] = mapped_column(JSON, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    journal_entry_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("journal_entries.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserEmotionalLog(Base):
    """Daily emotional check-ins and logs for users."""

    __tablename__ = "user_emotional_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    log_date: Mapped[datetime.date] = mapped_column(
        Date, server_default=func.current_date(), index=True
    )
    emotional_state: Mapped[str] = mapped_column(String(50), index=True)
    intensity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    triggers: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    verse_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserDailyAnalysis(Base):
    """Automated daily spiritual wellness analysis and insights."""

    __tablename__ = "user_daily_analysis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    analysis_date: Mapped[datetime.date] = mapped_column(
        Date, server_default=func.current_date(), index=True
    )
    emotional_summary: Mapped[str] = mapped_column(Text)
    recommended_verses: Mapped[list] = mapped_column(JSON)
    insights: Mapped[list] = mapped_column(JSON)
    action_items: Mapped[list | None] = mapped_column(JSON, nullable=True)
    overall_mood_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "analysis_date", name="uq_user_daily_analysis"),
    )


class UserWeeklyReflection(Base):
    """Weekly sacred reflections and deep-dive assessments."""

    __tablename__ = "user_weekly_reflections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    week_start_date: Mapped[datetime.date] = mapped_column(Date, index=True)
    week_end_date: Mapped[datetime.date] = mapped_column(Date)
    reflection_type: Mapped[str] = mapped_column(
        String(50), default="sacred_reflection"
    )
    emotional_journey_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_insights: Mapped[list | None] = mapped_column(JSON, nullable=True)
    verses_explored: Mapped[list | None] = mapped_column(JSON, nullable=True)
    milestones_achieved: Mapped[list | None] = mapped_column(JSON, nullable=True)
    areas_for_growth: Mapped[list | None] = mapped_column(JSON, nullable=True)
    gratitude_items: Mapped[list | None] = mapped_column(JSON, nullable=True)
    overall_wellbeing_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "week_start_date", name="uq_user_weekly_reflection"
        ),
    )


class UserAssessment(Base):
    """Structured weekly spiritual wellness assessments with Gita wisdom."""

    __tablename__ = "user_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    assessment_date: Mapped[datetime.date] = mapped_column(
        Date, server_default=func.current_date(), index=True
    )
    assessment_type: Mapped[str] = mapped_column(
        String(50), default="weekly", index=True
    )
    questions_responses: Mapped[dict] = mapped_column(JSON)
    # Map Python names to actual DB column names from migration
    calculated_scores: Mapped[dict | None] = mapped_column("scores", JSON, nullable=True)
    recommended_focus_areas: Mapped[list | None] = mapped_column(
        "recommended_actions", JSON, nullable=True
    )
    personalized_verses: Mapped[list | None] = mapped_column(
        "gita_verse_recommendations", JSON, nullable=True
    )
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserVerseBookmark(Base):
    """User-saved Gita verses with personal notes."""

    __tablename__ = "user_verses_bookmarked"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    # DB column is VARCHAR(100), not Integer FK
    verse_id: Mapped[str] = mapped_column(String(100), index=True)
    personal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    emotional_context: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bookmarked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=True
    )
    last_viewed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    times_revisited: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    __table_args__ = (
        UniqueConstraint("user_id", "verse_id", name="uq_user_verse_bookmark"),
    )
