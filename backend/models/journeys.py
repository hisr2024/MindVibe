"""Journey models: Wisdom journeys, templates, user journeys, personal journeys."""

from __future__ import annotations

import datetime
import enum
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from backend.models.base import Base, SoftDeleteMixin


# =============================================================================
# Wisdom Journey System Models
# =============================================================================


class JourneyStatus(str, enum.Enum):
    """Status of a wisdom journey."""

    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


# =============================================================================
# Enhanced Wisdom Journeys System - Sad-Ripu (Six Inner Enemies)
# =============================================================================


class EnemyTag(str, enum.Enum):
    """The six inner enemies (Sad-Ripu) from Bhagavad Gita philosophy."""

    KAMA = "kama"  # Desire/Lust
    KRODHA = "krodha"  # Anger
    LOBHA = "lobha"  # Greed
    MOHA = "moha"  # Delusion/Attachment
    MADA = "mada"  # Ego/Pride
    MATSARYA = "matsarya"  # Envy/Jealousy
    MIXED = "mixed"  # Combined journey
    GENERAL = "general"  # General wisdom


class UserJourneyStatus(str, enum.Enum):
    """Status of a user's journey instance."""

    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class JourneyPace(str, enum.Enum):
    """Pace preference for journey steps."""

    DAILY = "daily"
    EVERY_OTHER_DAY = "every_other_day"
    WEEKLY = "weekly"


class JourneyTone(str, enum.Enum):
    """Tone preference for KIAAN responses."""

    GENTLE = "gentle"
    DIRECT = "direct"
    INSPIRING = "inspiring"


class PersonalJourneyStatus(str, enum.Enum):
    """Status of a personal journey."""

    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class WisdomJourney(SoftDeleteMixin, Base):
    """AI-powered personalized wisdom journey with dynamic verse sequences."""

    __tablename__ = "wisdom_journeys"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Journey configuration
    total_steps: Mapped[int] = mapped_column(Integer, default=7)
    current_step: Mapped[int] = mapped_column(Integer, default=0)

    # Status and progress
    status: Mapped[JourneyStatus] = mapped_column(
        Enum(JourneyStatus, native_enum=False, length=32),
        default=JourneyStatus.ACTIVE,
        index=True,
    )
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)

    # Personalization metadata
    recommended_by: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # "ai", "mood_based", "journal_based", "manual"
    recommendation_score: Mapped[float | None] = mapped_column(
        Numeric(5, 4), nullable=True
    )  # 0.0-1.0
    recommendation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Source data for personalization (privacy-preserving)
    source_mood_scores: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )  # Last 7 days mood averages
    source_themes: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )  # Extracted journal themes

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    paused_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )


class JourneyStep(SoftDeleteMixin, Base):
    """Individual step in a wisdom journey with associated verse and reflections."""

    __tablename__ = "journey_steps"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    journey_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("wisdom_journeys.id", ondelete="CASCADE"), index=True
    )
    step_number: Mapped[int] = mapped_column(Integer)

    # Verse association
    verse_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("gita_verses.id", ondelete="SET NULL"), nullable=True
    )

    # Step content
    reflection_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_insight: Mapped[str | None] = mapped_column(Text, nullable=True)

    # User progress
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    time_spent_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # User reflection (encrypted)
    user_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_rating: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )  # 1-5 stars

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("journey_id", "step_number", name="uq_journey_step"),
    )


class JourneyRecommendation(Base):
    """Tracks journey recommendations for continuous ML improvement."""

    __tablename__ = "journey_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Recommendation details
    journey_template: Mapped[str] = mapped_column(String(128))
    relevance_score: Mapped[float] = mapped_column(Numeric(5, 4))  # 0.0-1.0
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # User interaction
    accepted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    journey_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("wisdom_journeys.id", ondelete="SET NULL"), nullable=True
    )

    # ML features (for retraining)
    features_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
    accepted_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )


class JourneyTemplate(SoftDeleteMixin, Base):
    """
    Admin-defined journey blueprints for the six inner enemies (Sad-Ripu).

    Each template defines a multi-day journey focused on overcoming
    specific inner enemies through Gita wisdom.
    """

    __tablename__ = "journey_templates"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Primary focus area (which inner enemy this journey addresses)
    primary_enemy_tags: Mapped[list] = mapped_column(
        JSON, default=list
    )  # ["krodha", "moha"]

    # Journey configuration
    duration_days: Mapped[int] = mapped_column(Integer, default=14)
    difficulty: Mapped[int] = mapped_column(Integer, default=3)  # 1-5 scale

    # Status flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_free: Mapped[bool] = mapped_column(Boolean, default=False, index=True)  # Free access for all users

    # UI metadata
    icon_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    color_theme: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    steps: Mapped[list["JourneyTemplateStep"]] = relationship(
        "JourneyTemplateStep", back_populates="template", cascade="all, delete-orphan"
    )


class JourneyTemplateStep(SoftDeleteMixin, Base):
    """
    Day-by-day skeleton for journey templates.

    Contains hints for AI generation and verse selection configuration.
    """

    __tablename__ = "journey_template_steps"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    journey_template_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("journey_templates.id", ondelete="CASCADE"), index=True
    )
    day_index: Mapped[int] = mapped_column(Integer)  # 1-indexed

    # Step content hints (for AI generation)
    step_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    teaching_hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    reflection_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    practice_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Verse selection configuration
    verse_selector: Mapped[dict | None] = mapped_column(
        JSON, default=lambda: {"tags": [], "max_verses": 3, "avoid_recent": 20}
    )
    # Optional: fixed verses like [{"chapter": 2, "verse": 63}]
    static_verse_refs: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Safety notes for sensitive content
    safety_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    template: Mapped["JourneyTemplate"] = relationship(
        "JourneyTemplate", back_populates="steps"
    )

    __table_args__ = (
        UniqueConstraint("journey_template_id", "day_index", name="uq_template_step"),
    )


class UserJourney(SoftDeleteMixin, Base):
    """
    User instances of journey templates with personalization settings.

    Supports multiple active journeys per user.
    """

    __tablename__ = "user_journeys"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    journey_template_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("journey_templates.id", ondelete="SET NULL"), nullable=True
    )

    # Legacy reference for backward compatibility
    legacy_journey_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("wisdom_journeys.id", ondelete="SET NULL"), nullable=True
    )

    # Status
    status: Mapped[UserJourneyStatus] = mapped_column(
        Enum(
            UserJourneyStatus,
            native_enum=False,
            length=32,
            values_callable=lambda e: [x.value for x in e],
        ),
        default=UserJourneyStatus.ACTIVE,
        index=True,
    )

    # Progress tracking
    current_day_index: Mapped[int] = mapped_column(Integer, default=1)
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    paused_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Personalization settings
    personalization: Mapped[dict | None] = mapped_column(
        JSON, default=lambda: {}
    )
    # Schema: {
    #   "pace": "daily" | "every_other_day" | "weekly",
    #   "time_budget_minutes": 10,
    #   "focus_tags": ["krodha", "moha"],
    #   "preferred_tone": "gentle" | "direct" | "inspiring",
    #   "provider_preference": "auto" | "openai" | "sarvam" | "oai_compat"
    # }

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    template: Mapped["JourneyTemplate | None"] = relationship("JourneyTemplate")
    step_states: Mapped[list["UserJourneyStepState"]] = relationship(
        "UserJourneyStepState", back_populates="user_journey", cascade="all, delete-orphan"
    )

    @validates("status")
    def _normalize_status(self, _key: str, value: UserJourneyStatus | str) -> str:
        if isinstance(value, UserJourneyStatus):
            return value.value
        if isinstance(value, str):
            return value.lower()
        return value


class UserJourneyStepState(SoftDeleteMixin, Base):
    """
    AI-generated step content and user progress for each day.

    Stores KIAAN-generated content, verse refs, and user check-ins.
    Includes soft delete support for data recovery.
    """

    __tablename__ = "user_journey_step_state"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_journey_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("user_journeys.id", ondelete="CASCADE"), index=True
    )
    day_index: Mapped[int] = mapped_column(Integer)

    # Delivery tracking
    delivered_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Verse references (from corpus, not full text)
    verse_refs: Mapped[list] = mapped_column(JSON, default=list)
    # Schema: [{"chapter": 2, "verse": 47}, {"chapter": 2, "verse": 48}]

    # AI-generated step content (strict JSON from KIAAN)
    kiaan_step_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Schema: {
    #   "step_title": "...",
    #   "today_focus": "kama|krodha|...",
    #   "verse_refs": [...],
    #   "teaching": "...",
    #   "guided_reflection": ["...", "...", "..."],
    #   "practice": {"name": "...", "instructions": [...], "duration_minutes": 5},
    #   "micro_commitment": "...",
    #   "check_in_prompt": {"scale": "0-10", "label": "..."},
    #   "safety_note": "..." (optional)
    # }

    # User reflection storage
    # DEPRECATED: reflection_reference is no longer used - use reflection_encrypted instead
    # Kept for backward compatibility; will be removed in future migration
    reflection_reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Encrypted reflection content (primary storage for user reflections)
    reflection_encrypted: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Check-in data
    check_in: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Schema: {"intensity": 7, "label": "...", "timestamp": "..."}

    # Provider tracking
    provider_used: Mapped[str | None] = mapped_column(String(64), nullable=True)
    model_used: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Additional step metadata (named step_metadata to avoid SQLAlchemy conflict)
    step_metadata: Mapped[dict | None] = mapped_column(JSON, default=lambda: {})

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    user_journey: Mapped["UserJourney"] = relationship(
        "UserJourney", back_populates="step_states"
    )

    __table_args__ = (
        UniqueConstraint("user_journey_id", "day_index", name="uq_journey_step_state"),
    )


class UserJourneyProgress(Base):
    """Track user progress through KIAAN modules and journeys."""

    __tablename__ = "user_journey_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    module_name: Mapped[str] = mapped_column(String(100), index=True)
    module_type: Mapped[str] = mapped_column(String(50))
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    steps_completed: Mapped[list | None] = mapped_column(JSON, nullable=True)
    total_steps: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_activity_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="in_progress", index=True)
    achievements: Mapped[list | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "module_name", name="uq_user_journey_progress"),
    )


class PersonalJourney(SoftDeleteMixin, Base):
    """
    User's personal journey for tracking goals and progress.

    A simple CRUD entity that users can create, update, and manage.
    """

    __tablename__ = "personal_journeys"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    owner_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Core fields
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[PersonalJourneyStatus] = mapped_column(
        Enum(
            PersonalJourneyStatus,
            native_enum=False,
            length=32,
            values_callable=lambda e: [x.value for x in e],
        ),
        default=PersonalJourneyStatus.DRAFT,
        index=True,
    )

    # Optional fields
    cover_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    __table_args__ = (
        # Index for efficient list queries by owner
        {"extend_existing": True},
    )
