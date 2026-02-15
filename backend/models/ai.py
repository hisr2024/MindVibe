"""AI and KIAAN models: Learning system, chat, analytics, provider config."""

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
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


# =============================================================================
# KIAAN Learning System - Daemon Knowledge Storage
# =============================================================================


class ContentSourceType(str, enum.Enum):
    """Type of content source for learned wisdom."""

    YOUTUBE = "youtube"
    AUDIO = "audio"
    WEB = "web"
    PODCAST = "podcast"
    BOOK = "book"
    MANUAL = "manual"


class ValidationStatus(str, enum.Enum):
    """Validation status for learned wisdom."""

    PENDING = "pending"
    VALIDATED = "validated"
    REJECTED = "rejected"


class LearnedWisdom(SoftDeleteMixin, Base):
    """
    Wisdom learned by KIAAN's 24/7 daemon from various sources.

    This table stores Gita-related content fetched from YouTube, audio platforms,
    web sources, etc. It connects the daemon's output to the Wisdom Core,
    allowing KIAAN to use learned content in journey generation.
    """

    __tablename__ = "learned_wisdom"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )  # SHA-256 hash for deduplication

    # Source information
    source_type: Mapped[ContentSourceType] = mapped_column(
        Enum(ContentSourceType), nullable=False, index=True
    )
    source_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    source_name: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    source_author: Mapped[str | None] = mapped_column(String(256), nullable=True)

    # Language
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en", index=True)

    # Gita references
    chapter_refs: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    verse_refs: Mapped[list[list[int]]] = mapped_column(JSON, nullable=False, default=list)

    # Categorization
    themes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    shad_ripu_tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    # Mental health mapping (similar to GitaVerse)
    primary_domain: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    secondary_domains: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    mental_health_applications: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Quality & validation
    quality_score: Mapped[float] = mapped_column(
        Numeric(3, 2), nullable=False, default=0.0
    )  # 0.00 - 1.00
    validation_status: Mapped[ValidationStatus] = mapped_column(
        Enum(ValidationStatus), nullable=False, default=ValidationStatus.PENDING, index=True
    )
    validated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    validated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Embeddings for semantic search
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)

    # Usage tracking
    usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_used_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Extra metadata (named extra_metadata because 'metadata' is reserved by SQLAlchemy)
    # Map to the actual DB column name 'metadata' via the first positional arg
    extra_metadata: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    # Timestamps
    learned_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserQueryPattern(SoftDeleteMixin, Base):
    """
    Patterns learned from user queries to improve KIAAN's responses.

    Tracks common query patterns, their intent, and successful response mappings
    to enable better offline/template-based responses.
    """

    __tablename__ = "user_query_patterns"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Pattern definition
    query_template: Mapped[str] = mapped_column(Text, nullable=False)
    query_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )  # For deduplication
    intent: Mapped[str] = mapped_column(String(128), nullable=False, index=True)

    # Gita mappings
    related_chapters: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    related_verses: Mapped[list[list[int]]] = mapped_column(JSON, nullable=False, default=list)
    related_themes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    # Response template (for AI-free responses)
    response_template: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Statistics
    frequency: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    successful_responses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Timestamps
    first_seen_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    last_seen_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class ContentSourceRegistry(SoftDeleteMixin, Base):
    """
    Registry of content sources used by the KIAAN learning daemon.

    Tracks source health, fetch history, and configuration.
    """

    __tablename__ = "content_source_registry"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Source identification
    name: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
    source_type: Mapped[ContentSourceType] = mapped_column(
        Enum(ContentSourceType), nullable=False, index=True
    )
    url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # Configuration
    fetch_interval_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, default=3600
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Health tracking
    last_fetch_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_success_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    consecutive_failures: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_items_fetched: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Credibility
    credibility_rating: Mapped[int] = mapped_column(
        Integer, nullable=False, default=5
    )  # 1-10 scale

    # Extra metadata (named extra_metadata because 'metadata' is reserved by SQLAlchemy)
    # Map to the actual DB column name 'metadata' via the first positional arg
    extra_metadata: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class KiaanUsageAnalytics(Base):
    """Aggregated KIAAN usage analytics (read-only for admin)."""

    __tablename__ = "kiaan_usage_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), index=True
    )
    # Aggregated counts (no personal data)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    unique_users: Mapped[int] = mapped_column(Integer, default=0)
    # Topic trends (aggregated, anonymized)
    topic_distribution: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Tier breakdown
    questions_by_tier: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Response metrics
    avg_response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    satisfaction_avg: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class KiaanChatMessage(SoftDeleteMixin, Base):
    """
    Persistent storage for KIAAN chat conversations.

    Stores both user messages and KIAAN responses with metadata
    for conversation history, analytics, and learning.
    """

    __tablename__ = "kiaan_chat_messages"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True
    )
    session_id: Mapped[str] = mapped_column(String(64), index=True)

    # Message content
    user_message: Mapped[str] = mapped_column(Text)
    kiaan_response: Mapped[str] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Context and metadata
    context: Mapped[str | None] = mapped_column(String(64), nullable=True)
    detected_emotion: Mapped[str | None] = mapped_column(String(32), nullable=True)
    mood_at_time: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Gita wisdom integration
    verses_used: Mapped[list | None] = mapped_column(JSON, nullable=True)
    validation_score: Mapped[float | None] = mapped_column(Numeric(4, 3), nullable=True)
    gita_terms_found: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Language and translation
    language: Mapped[str] = mapped_column(String(8), default="en")
    translation: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Model information
    model_used: Mapped[str | None] = mapped_column(String(64), nullable=True)
    provider_used: Mapped[str | None] = mapped_column(String(32), nullable=True)
    was_cached: Mapped[bool] = mapped_column(Boolean, default=False)
    was_streaming: Mapped[bool] = mapped_column(Boolean, default=False)

    # Performance metrics
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # User feedback
    user_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    was_helpful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    saved_to_journal: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


class KiaanChatSession(Base):
    """
    Tracks KIAAN chat sessions for conversation continuity.

    Groups messages into sessions for context and analytics.
    """

    __tablename__ = "kiaan_chat_sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True
    )

    # Session metadata
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    ended_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    message_count: Mapped[int] = mapped_column(Integer, default=0)

    # Context
    initial_mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    initial_context: Mapped[str | None] = mapped_column(String(64), nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="en")

    # Session summary (generated on close)
    session_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    dominant_emotion: Mapped[str | None] = mapped_column(String(32), nullable=True)
    verses_explored: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Analytics
    avg_response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    was_helpful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)


class AIProviderConfig(Base):
    """
    Configuration for multi-provider LLM support.

    Tracks health status, rate limits, and priority for fallback.
    """

    __tablename__ = "ai_provider_configs"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    provider_name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(128))

    # Configuration
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[int] = mapped_column(Integer, default=100)

    # Health status
    last_health_check: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    health_status: Mapped[str | None] = mapped_column(String(32), default="unknown")
    avg_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Rate limiting
    rate_limit_per_minute: Mapped[int] = mapped_column(Integer, default=60)
    rate_limit_per_hour: Mapped[int] = mapped_column(Integer, default=1000)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )
