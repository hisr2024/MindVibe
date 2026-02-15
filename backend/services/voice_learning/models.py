"""
Voice Learning Database Models - Complete Schema for Self-Improvement

This module provides SQLAlchemy models for persisting all voice learning data:
- Sentiment analysis history and trajectories
- Voice fingerprints and profiles
- A/B experiments and results
- User preference signals and learned values
- Real-time adaptation configurations
- Intelligent cache metadata
- Cross-session memories
- Feedback signals and reward models

These models enable KIAAN to learn and improve continuously like Siri/Alexa.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, JSON, Enum as SQLEnum, Index, UniqueConstraint,
    Numeric, BigInteger, CheckConstraint, LargeBinary
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

# Import base from main models
try:
    from backend.models import Base
except ImportError:
    from sqlalchemy.orm import declarative_base
    Base = declarative_base()


# =============================================================================
# ENUMS FOR DATABASE
# =============================================================================

class EmotionCategoryEnum(str, Enum):
    """Emotion categories for sentiment analysis."""
    JOY = "joy"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    ANXIETY = "anxiety"
    PEACE = "peace"
    HOPE = "hope"
    LOVE = "love"
    GRATITUDE = "gratitude"
    COMPASSION = "compassion"
    CONFUSION = "confusion"
    LONELINESS = "loneliness"
    NEUTRAL = "neutral"


class VoiceProviderEnum(str, Enum):
    """Voice provider types."""
    SARVAM = "sarvam"
    BHASHINI = "bhashini"
    ELEVENLABS = "elevenlabs"


class ExperimentStatusEnum(str, Enum):
    """A/B experiment status."""
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class FeedbackTypeEnum(str, Enum):
    """Types of feedback signals."""
    RATING = "rating"
    THUMBS = "thumbs"
    TEXT = "text"
    COMPLETION = "completion"
    SKIP = "skip"
    REPLAY = "replay"
    FOLLOW_UP = "follow_up"
    ENGAGEMENT = "engagement"
    RETURN = "return"


class MemoryTypeEnum(str, Enum):
    """Types of user memories."""
    EMOTIONAL_STATE = "emotional_state"
    TOPIC = "topic"
    PREFERENCE = "preference"
    MILESTONE = "milestone"
    CONCERN = "concern"
    PROGRESS = "progress"
    RELATIONSHIP = "relationship"
    INSIGHT = "insight"


class MemoryPriorityEnum(str, Enum):
    """Memory priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class PreferenceCategoryEnum(str, Enum):
    """User preference categories."""
    VOICE = "voice"
    RESPONSE_STYLE = "response_style"
    CONTENT = "content"
    TIMING = "timing"
    INTERACTION = "interaction"


# =============================================================================
# SENTIMENT ANALYSIS MODELS
# =============================================================================

class SentimentAnalysisRecord(Base):
    """Records individual sentiment analysis results."""
    __tablename__ = "voice_sentiment_records"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    session_id: Mapped[Optional[str]] = mapped_column(String(64), index=True)

    # Analysis results
    text_analyzed: Mapped[str] = mapped_column(Text, nullable=False)
    text_hash: Mapped[str] = mapped_column(String(32), index=True)  # For dedup
    primary_emotion: Mapped[str] = mapped_column(
        SQLEnum(EmotionCategoryEnum), default=EmotionCategoryEnum.NEUTRAL
    )
    confidence: Mapped[float] = mapped_column(
        Numeric(4, 3), nullable=False,
        info={"check": CheckConstraint("confidence >= 0 AND confidence <= 1")}
    )
    polarity: Mapped[float] = mapped_column(
        Numeric(4, 3), nullable=False,
        info={"check": CheckConstraint("polarity >= -1 AND polarity <= 1")}
    )
    intensity: Mapped[float] = mapped_column(
        Numeric(4, 3), nullable=False,
        info={"check": CheckConstraint("intensity >= 0 AND intensity <= 1")}
    )

    # Secondary emotions (JSON list)
    secondary_emotions: Mapped[Optional[Dict]] = mapped_column(JSON)

    # Model info
    model_type: Mapped[str] = mapped_column(String(50), default="transformer")
    processing_time_ms: Mapped[Optional[int]] = mapped_column(Integer)

    # Context
    context_type: Mapped[str] = mapped_column(String(50), default="general")
    language: Mapped[str] = mapped_column(String(10), default="en")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_sentiment_user_session", "user_id", "session_id"),
        Index("idx_sentiment_emotion", "primary_emotion"),
        Index("idx_sentiment_created", "created_at"),
    )


class EmotionTrajectoryRecord(Base):
    """Tracks emotional trajectories across conversations."""
    __tablename__ = "voice_emotion_trajectories"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    session_id: Mapped[str] = mapped_column(String(64), index=True)

    # Trajectory metrics
    trend: Mapped[float] = mapped_column(Numeric(4, 3), default=0.0)
    volatility: Mapped[float] = mapped_column(Numeric(4, 3), default=0.0)
    dominant_emotion: Mapped[str] = mapped_column(
        SQLEnum(EmotionCategoryEnum), default=EmotionCategoryEnum.NEUTRAL
    )
    reading_count: Mapped[int] = mapped_column(Integer, default=0)

    # Crisis detection
    crisis_indicators: Mapped[bool] = mapped_column(Boolean, default=False)
    crisis_severity: Mapped[Optional[float]] = mapped_column(Numeric(3, 2))

    # Polarity progression
    start_polarity: Mapped[Optional[float]] = mapped_column(Numeric(4, 3))
    end_polarity: Mapped[Optional[float]] = mapped_column(Numeric(4, 3))
    avg_intensity: Mapped[Optional[float]] = mapped_column(Numeric(4, 3))

    # Timestamps
    session_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    session_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("idx_trajectory_user_crisis", "user_id", "crisis_indicators"),
    )


# =============================================================================
# VOICE FINGERPRINT MODELS
# =============================================================================

class VoiceFingerprint(Base):
    """Stores unique voice configurations per user."""
    __tablename__ = "voice_fingerprints"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    fingerprint_hash: Mapped[str] = mapped_column(String(32), unique=True, index=True)

    # Voice configuration
    provider: Mapped[str] = mapped_column(
        SQLEnum(VoiceProviderEnum), default=VoiceProviderEnum.GOOGLE_NEURAL2
    )
    voice_name: Mapped[str] = mapped_column(String(100), nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en")
    voice_type: Mapped[str] = mapped_column(String(20), default="friendly")

    # Prosody settings
    speaking_rate: Mapped[float] = mapped_column(
        Numeric(3, 2), default=0.95,
        info={"check": CheckConstraint("speaking_rate >= 0.5 AND speaking_rate <= 2.0")}
    )
    pitch: Mapped[float] = mapped_column(
        Numeric(4, 2), default=0.0,
        info={"check": CheckConstraint("pitch >= -20 AND pitch <= 20")}
    )
    volume: Mapped[float] = mapped_column(Numeric(3, 2), default=1.0)

    # Emotion settings
    emotion_adaptation_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    emotion_intensity_multiplier: Mapped[float] = mapped_column(Numeric(3, 2), default=1.0)

    # Quality metrics
    quality_score: Mapped[float] = mapped_column(Numeric(3, 2), default=1.0)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)

    # Fallback configuration (JSON array)
    fallback_voices: Mapped[Optional[List]] = mapped_column(JSON)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_used: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_fingerprint_user_language", "user_id", "language"),
        Index("idx_fingerprint_provider", "provider"),
    )


class VoiceInteractionLog(Base):
    """Logs voice interactions for preference learning."""
    __tablename__ = "voice_interaction_logs"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    fingerprint_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("voice_fingerprints.id", ondelete="SET NULL"),
        nullable=True, index=True
    )

    # Interaction details
    interaction_type: Mapped[str] = mapped_column(
        String(20), nullable=False  # rating, skip, replay, complete
    )
    value: Mapped[Optional[float]] = mapped_column(Numeric(3, 2))

    # Context
    context_type: Mapped[str] = mapped_column(String(50), default="general")
    content_length: Mapped[Optional[int]] = mapped_column(Integer)
    playback_duration_ms: Mapped[Optional[int]] = mapped_column(Integer)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_interaction_user_type", "user_id", "interaction_type"),
        Index("idx_interaction_created", "created_at"),
    )


# =============================================================================
# A/B TESTING MODELS
# =============================================================================

class ABExperiment(Base):
    """Stores A/B experiment configurations."""
    __tablename__ = "voice_ab_experiments"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    experiment_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Status
    status: Mapped[str] = mapped_column(
        SQLEnum(ExperimentStatusEnum), default=ExperimentStatusEnum.DRAFT
    )

    # Targeting
    user_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=100.0)
    target_contexts: Mapped[Optional[List]] = mapped_column(JSON)
    target_languages: Mapped[Optional[List]] = mapped_column(JSON)

    # Statistical settings
    min_sample_size: Mapped[int] = mapped_column(Integer, default=100)
    confidence_level: Mapped[float] = mapped_column(Numeric(3, 2), default=0.95)

    # Results
    winner_variant_id: Mapped[Optional[str]] = mapped_column(String(64))
    is_significant: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    variants = relationship("ABExperimentVariant", back_populates="experiment", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_experiment_status", "status"),
        Index("idx_experiment_type", "experiment_type"),
    )


class ABExperimentVariant(Base):
    """Stores experiment variants."""
    __tablename__ = "voice_ab_variants"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    experiment_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("voice_ab_experiments.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Configuration
    config: Mapped[Dict] = mapped_column(JSON, nullable=False)
    weight: Mapped[float] = mapped_column(Numeric(3, 2), default=0.5)

    # Metrics
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)
    total_rating: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationship
    experiment = relationship("ABExperiment", back_populates="variants")

    __table_args__ = (
        Index("idx_variant_experiment", "experiment_id"),
    )


class ABExperimentAssignment(Base):
    """Tracks user assignments to experiment variants."""
    __tablename__ = "voice_ab_assignments"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    experiment_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("voice_ab_experiments.id", ondelete="CASCADE"), index=True
    )
    variant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("voice_ab_variants.id", ondelete="CASCADE"), index=True
    )

    # Assignment timestamp
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "experiment_id", name="uq_user_experiment"),
        Index("idx_assignment_user", "user_id"),
    )


# =============================================================================
# USER PREFERENCE LEARNING MODELS
# =============================================================================

class PreferenceSignalRecord(Base):
    """Records preference signals from user behavior."""
    __tablename__ = "voice_preference_signals"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Signal details
    signal_type: Mapped[str] = mapped_column(SQLEnum(FeedbackTypeEnum), nullable=False)
    category: Mapped[str] = mapped_column(
        SQLEnum(PreferenceCategoryEnum), default=PreferenceCategoryEnum.VOICE
    )
    value: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)

    # Context
    context: Mapped[Optional[Dict]] = mapped_column(JSON)
    session_id: Mapped[Optional[str]] = mapped_column(String(64))

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_signal_user_type", "user_id", "signal_type"),
        Index("idx_signal_category", "category"),
        Index("idx_signal_created", "created_at"),
    )


class LearnedPreferenceRecord(Base):
    """Stores learned preferences per user."""
    __tablename__ = "voice_learned_preferences"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Preference details
    preference_key: Mapped[str] = mapped_column(String(100), nullable=False)
    preferred_value: Mapped[Dict] = mapped_column(JSON, nullable=False)  # Can store any type
    confidence: Mapped[float] = mapped_column(Numeric(4, 3), default=0.0)
    signal_count: Mapped[int] = mapped_column(Integer, default=0)

    # Decay settings
    decay_rate: Mapped[float] = mapped_column(Numeric(4, 3), default=0.95)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "preference_key", name="uq_user_preference"),
        Index("idx_preference_user_key", "user_id", "preference_key"),
    )


# =============================================================================
# REAL-TIME ADAPTATION MODELS
# =============================================================================

class AdaptationConfigRecord(Base):
    """Stores real-time adaptation configurations."""
    __tablename__ = "voice_adaptation_configs"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Configuration
    config_name: Mapped[str] = mapped_column(String(100), nullable=False)
    emotion: Mapped[str] = mapped_column(SQLEnum(EmotionCategoryEnum), nullable=False)

    # Prosody settings
    speaking_rate: Mapped[float] = mapped_column(Numeric(3, 2), default=0.95)
    pitch: Mapped[float] = mapped_column(Numeric(4, 2), default=0.0)
    volume: Mapped[float] = mapped_column(Numeric(3, 2), default=1.0)
    emphasis: Mapped[str] = mapped_column(String(20), default="none")
    pause_before_ms: Mapped[int] = mapped_column(Integer, default=0)
    pause_after_ms: Mapped[int] = mapped_column(Integer, default=0)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("idx_adaptation_user_emotion", "user_id", "emotion"),
    )


class AdaptationHistoryRecord(Base):
    """Logs real-time adaptation events for learning."""
    __tablename__ = "voice_adaptation_history"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    session_id: Mapped[str] = mapped_column(String(64), index=True)

    # Adaptation details
    response_text_hash: Mapped[str] = mapped_column(String(32))
    sentence_count: Mapped[int] = mapped_column(Integer)
    transition_count: Mapped[int] = mapped_column(Integer)
    arc_type: Mapped[str] = mapped_column(String(20))  # ascending, descending, stable, volatile

    # Emotions detected
    emotions_detected: Mapped[List] = mapped_column(JSON)

    # User feedback
    feedback_score: Mapped[Optional[float]] = mapped_column(Numeric(3, 2))

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_adaptation_history_user", "user_id", "created_at"),
    )


# =============================================================================
# INTELLIGENT CACHE MODELS
# =============================================================================

class CacheEntryRecord(Base):
    """Stores intelligent cache metadata."""
    __tablename__ = "voice_cache_entries"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    cache_key: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    content_hash: Mapped[str] = mapped_column(String(32), index=True)

    # Content metadata
    content_type: Mapped[str] = mapped_column(String(20), default="audio")
    language: Mapped[str] = mapped_column(String(10), default="en")
    voice_type: Mapped[str] = mapped_column(String(20), default="friendly")
    context: Mapped[str] = mapped_column(String(50), default="general")

    # Size and location
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    storage_path: Mapped[Optional[str]] = mapped_column(String(500))

    # Importance metrics
    frequency: Mapped[int] = mapped_column(Integer, default=1)
    priority_score: Mapped[float] = mapped_column(Numeric(6, 2), default=0.0)

    # Flags
    is_core_response: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verse: Mapped[bool] = mapped_column(Boolean, default=False)
    is_meditation: Mapped[bool] = mapped_column(Boolean, default=False)
    is_evictable: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_accessed: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_cache_priority", "priority_score"),
        Index("idx_cache_last_accessed", "last_accessed"),
        Index("idx_cache_evictable", "is_evictable"),
    )


class CachePredictionRecord(Base):
    """Stores cache predictions for analysis."""
    __tablename__ = "voice_cache_predictions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Prediction details
    prediction_key: Mapped[str] = mapped_column(String(100), nullable=False)
    probability: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    reason: Mapped[str] = mapped_column(String(200))
    context: Mapped[Optional[Dict]] = mapped_column(JSON)

    # Outcome
    was_hit: Mapped[Optional[bool]] = mapped_column(Boolean)
    hit_within_ms: Mapped[Optional[int]] = mapped_column(Integer)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_prediction_created", "created_at"),
    )


# =============================================================================
# CROSS-SESSION CONTEXT MODELS
# =============================================================================

class UserMemoryRecord(Base):
    """Stores user memories for cross-session context."""
    __tablename__ = "voice_user_memories"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Memory details
    memory_type: Mapped[str] = mapped_column(SQLEnum(MemoryTypeEnum), nullable=False)
    priority: Mapped[str] = mapped_column(
        SQLEnum(MemoryPriorityEnum), default=MemoryPriorityEnum.MEDIUM
    )
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[Optional[Dict]] = mapped_column(JSON)

    # Confidence and decay
    confidence: Mapped[float] = mapped_column(Numeric(4, 3), default=1.0)
    decay_rate: Mapped[float] = mapped_column(Numeric(4, 3), default=0.98)
    access_count: Mapped[int] = mapped_column(Integer, default=0)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_accessed: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_memory_user_type", "user_id", "memory_type"),
        Index("idx_memory_user_key", "user_id", "key"),
        Index("idx_memory_priority", "priority"),
    )


class SessionContextRecord(Base):
    """Stores session context for analysis."""
    __tablename__ = "voice_session_contexts"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    session_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)

    # Session state
    current_mood: Mapped[str] = mapped_column(String(20), default="neutral")
    current_topic: Mapped[str] = mapped_column(String(50), default="general")
    current_intensity: Mapped[float] = mapped_column(Numeric(3, 2), default=0.5)
    messages_count: Mapped[int] = mapped_column(Integer, default=0)

    # Memories accessed
    active_memory_ids: Mapped[Optional[List]] = mapped_column(JSON)
    proactive_prompts: Mapped[Optional[List]] = mapped_column(JSON)

    # Timestamps
    session_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    session_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("idx_session_user", "user_id"),
        Index("idx_session_start", "session_start"),
    )


# =============================================================================
# FEEDBACK AND LEARNING MODELS
# =============================================================================

class FeedbackSignalRecord(Base):
    """Stores feedback signals for RLHF."""
    __tablename__ = "voice_feedback_signals"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Feedback details
    feedback_type: Mapped[str] = mapped_column(SQLEnum(FeedbackTypeEnum), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)

    # Response context
    response_hash: Mapped[Optional[str]] = mapped_column(String(32), index=True)
    query_hash: Mapped[Optional[str]] = mapped_column(String(32))
    context_type: Mapped[str] = mapped_column(String(50), default="general")
    language: Mapped[str] = mapped_column(String(10), default="en")

    # Metadata
    voice_settings: Mapped[Optional[Dict]] = mapped_column(JSON)
    response_length: Mapped[int] = mapped_column(Integer, default=0)
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_feedback_user_type", "user_id", "feedback_type"),
        Index("idx_feedback_response", "response_hash"),
        Index("idx_feedback_created", "created_at"),
    )


class RewardModelRecord(Base):
    """Stores reward model parameters."""
    __tablename__ = "voice_reward_models"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    model_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    context_type: Mapped[Optional[str]] = mapped_column(String(50))  # None = global

    # Model parameters
    weights: Mapped[Dict] = mapped_column(JSON, default=dict)
    baseline_scores: Mapped[Dict] = mapped_column(JSON, default=dict)
    training_samples: Mapped[int] = mapped_column(Integer, default=0)

    # Version info
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("idx_reward_model_context", "context_type"),
    )


class ImprovementActionRecord(Base):
    """Tracks improvement actions taken."""
    __tablename__ = "voice_improvement_actions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Action details
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[float] = mapped_column(Numeric(4, 3), default=0.5)
    evidence: Mapped[str] = mapped_column(Text)

    # Impact
    affected_users: Mapped[int] = mapped_column(Integer, default=0)
    potential_impact: Mapped[float] = mapped_column(Numeric(4, 3), default=0.0)
    actual_impact: Mapped[Optional[float]] = mapped_column(Numeric(4, 3))

    # Configuration change
    config_change: Mapped[Optional[Dict]] = mapped_column(JSON)

    # Status
    status: Mapped[str] = mapped_column(String(20), default="proposed")  # proposed, applied, reverted

    # Timestamps
    proposed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    measured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index("idx_improvement_category", "category"),
        Index("idx_improvement_status", "status"),
    )


# =============================================================================
# AGGREGATED ANALYTICS MODELS
# =============================================================================

class VoiceLearningDailyStats(Base):
    """Daily aggregated statistics for voice learning."""
    __tablename__ = "voice_learning_daily_stats"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    stats_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), unique=True, index=True)

    # Sentiment stats
    total_sentiment_analyses: Mapped[int] = mapped_column(Integer, default=0)
    avg_polarity: Mapped[Optional[float]] = mapped_column(Numeric(4, 3))
    crisis_incidents: Mapped[int] = mapped_column(Integer, default=0)

    # Fingerprint stats
    new_fingerprints: Mapped[int] = mapped_column(Integer, default=0)
    active_fingerprints: Mapped[int] = mapped_column(Integer, default=0)

    # Experiment stats
    active_experiments: Mapped[int] = mapped_column(Integer, default=0)
    experiment_impressions: Mapped[int] = mapped_column(Integer, default=0)

    # Preference stats
    preference_signals: Mapped[int] = mapped_column(Integer, default=0)
    preferences_learned: Mapped[int] = mapped_column(Integer, default=0)

    # Adaptation stats
    adaptations_performed: Mapped[int] = mapped_column(Integer, default=0)
    avg_adaptation_score: Mapped[Optional[float]] = mapped_column(Numeric(4, 3))

    # Cache stats
    cache_hits: Mapped[int] = mapped_column(Integer, default=0)
    cache_misses: Mapped[int] = mapped_column(Integer, default=0)
    prediction_accuracy: Mapped[Optional[float]] = mapped_column(Numeric(4, 3))

    # Memory stats
    memories_created: Mapped[int] = mapped_column(Integer, default=0)
    memories_accessed: Mapped[int] = mapped_column(Integer, default=0)

    # Feedback stats
    feedback_signals: Mapped[int] = mapped_column(Integer, default=0)
    avg_feedback_score: Mapped[Optional[float]] = mapped_column(Numeric(4, 3))
    improvements_applied: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("idx_learning_stats_date", "stats_date"),
    )


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Enums
    "EmotionCategoryEnum",
    "VoiceProviderEnum",
    "ExperimentStatusEnum",
    "FeedbackTypeEnum",
    "MemoryTypeEnum",
    "MemoryPriorityEnum",
    "PreferenceCategoryEnum",
    # Sentiment Analysis
    "SentimentAnalysisRecord",
    "EmotionTrajectoryRecord",
    # Voice Fingerprint
    "VoiceFingerprint",
    "VoiceInteractionLog",
    # A/B Testing
    "ABExperiment",
    "ABExperimentVariant",
    "ABExperimentAssignment",
    # Preference Learning
    "PreferenceSignalRecord",
    "LearnedPreferenceRecord",
    # Real-Time Adaptation
    "AdaptationConfigRecord",
    "AdaptationHistoryRecord",
    # Intelligent Cache
    "CacheEntryRecord",
    "CachePredictionRecord",
    # Cross-Session Context
    "UserMemoryRecord",
    "SessionContextRecord",
    # Feedback and Learning
    "FeedbackSignalRecord",
    "RewardModelRecord",
    "ImprovementActionRecord",
    # Analytics
    "VoiceLearningDailyStats",
]
