"""Voice system models for KIAAN voice assistant."""

from __future__ import annotations

import datetime
import enum
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


class VoiceGender(str, enum.Enum):
    """Voice gender preference."""

    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"


class VoiceType(str, enum.Enum):
    """Voice persona type."""

    CALM = "calm"
    WISDOM = "wisdom"
    FRIENDLY = "friendly"


class AudioQuality(str, enum.Enum):
    """Audio quality level."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    ULTRA = "ultra"


class VoiceEnhancementType(str, enum.Enum):
    """Voice enhancement session types."""

    BINAURAL = "binaural"
    SPATIAL = "spatial"
    BREATHING = "breathing"
    AMBIENT = "ambient"
    SLEEP = "sleep"
    MEDITATION = "meditation"


class UserVoicePreferences(Base):
    """User voice preferences and settings for KIAAN voice assistant."""

    __tablename__ = "user_voice_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )

    # Voice settings
    voice_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_play_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    wake_word_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    custom_wake_word: Mapped[str | None] = mapped_column(
        String(64), nullable=True, default="Hey KIAAN"
    )

    # Voice characteristics
    preferred_voice_gender: Mapped[str] = mapped_column(
        String(16), default="female"
    )
    preferred_voice_type: Mapped[str] = mapped_column(
        String(32), default="friendly"
    )
    speaking_rate: Mapped[float] = mapped_column(Numeric(3, 2), default=0.90)
    voice_pitch: Mapped[float] = mapped_column(Numeric(4, 1), default=0.0)

    # Language settings
    preferred_language: Mapped[str] = mapped_column(String(8), default="en")
    secondary_language: Mapped[str | None] = mapped_column(String(8), nullable=True)
    auto_detect_language: Mapped[bool] = mapped_column(Boolean, default=True)

    # Audio quality
    audio_quality: Mapped[str] = mapped_column(String(16), default="high")

    # Offline settings
    offline_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    offline_verses_downloaded: Mapped[int] = mapped_column(Integer, default=0)
    last_offline_sync: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Enhancement settings
    binaural_beats_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    binaural_frequency: Mapped[str | None] = mapped_column(
        String(16), nullable=True, default="alpha"
    )
    spatial_audio_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    breathing_sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    ambient_sounds_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    ambient_sound_type: Mapped[str | None] = mapped_column(
        String(32), nullable=True, default="nature"
    )

    # Accessibility
    high_contrast_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    larger_text: Mapped[bool] = mapped_column(Boolean, default=False)
    haptic_feedback: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class VoiceConversation(SoftDeleteMixin, Base):
    """Complete voice conversation history with KIAAN."""

    __tablename__ = "voice_conversations"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    session_id: Mapped[str] = mapped_column(String(64), index=True)

    # Conversation details
    user_query: Mapped[str] = mapped_column(Text)
    kiaan_response: Mapped[str] = mapped_column(Text)
    detected_intent: Mapped[str | None] = mapped_column(String(64), nullable=True)
    detected_emotion: Mapped[str | None] = mapped_column(String(32), nullable=True)
    confidence_score: Mapped[float] = mapped_column(Numeric(4, 3), default=0.0)

    # Context
    concern_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mood_at_time: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Related verses
    verse_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    verses_helpful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Performance metrics
    speech_to_text_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_processing_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    text_to_speech_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Audio metadata
    user_audio_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_audio_duration_ms: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    language_used: Mapped[str] = mapped_column(String(8), default="en")
    voice_type_used: Mapped[str | None] = mapped_column(
        String(32), nullable=True, default="friendly"
    )

    # User feedback
    user_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    was_helpful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


class VoiceAnalytics(Base):
    """Daily aggregated voice analytics for admin dashboard."""

    __tablename__ = "voice_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analytics_date: Mapped[datetime.date] = mapped_column(Date, unique=True, index=True)

    # Usage metrics
    total_voice_sessions: Mapped[int] = mapped_column(Integer, default=0)
    total_voice_queries: Mapped[int] = mapped_column(Integer, default=0)
    unique_voice_users: Mapped[int] = mapped_column(Integer, default=0)

    # Performance metrics
    avg_speech_to_text_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    avg_ai_processing_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    avg_text_to_speech_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    avg_total_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    p95_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    p99_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Quality metrics
    avg_confidence_score: Mapped[float | None] = mapped_column(
        Numeric(4, 3), nullable=True
    )
    avg_user_rating: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    positive_feedback_count: Mapped[int] = mapped_column(Integer, default=0)
    negative_feedback_count: Mapped[int] = mapped_column(Integer, default=0)

    # Distribution data
    language_distribution: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    voice_type_distribution: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    concern_distribution: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    emotion_distribution: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Error metrics
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    timeout_count: Mapped[int] = mapped_column(Integer, default=0)
    fallback_response_count: Mapped[int] = mapped_column(Integer, default=0)

    # TTS usage and cost tracking
    tts_characters_synthesized: Mapped[int] = mapped_column(Integer, default=0)
    tts_audio_minutes_generated: Mapped[float] = mapped_column(
        Numeric(10, 2), default=0
    )
    tts_cache_hit_rate: Mapped[float] = mapped_column(Numeric(5, 4), default=0)
    estimated_tts_cost_usd: Mapped[float] = mapped_column(Numeric(10, 4), default=0)

    # Enhancement usage
    binaural_beats_sessions: Mapped[int] = mapped_column(Integer, default=0)
    spatial_audio_sessions: Mapped[int] = mapped_column(Integer, default=0)
    breathing_sync_sessions: Mapped[int] = mapped_column(Integer, default=0)

    # Wake word stats
    wake_word_activations: Mapped[int] = mapped_column(Integer, default=0)
    wake_word_false_positives: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class VoiceQualityMetrics(Base):
    """Per-request quality metrics for TTS and STT."""

    __tablename__ = "voice_quality_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("voice_conversations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Speech-to-text quality
    stt_provider: Mapped[str | None] = mapped_column(
        String(32), nullable=True, default="web_speech_api"
    )
    stt_confidence: Mapped[float | None] = mapped_column(Numeric(4, 3), nullable=True)
    stt_alternative_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stt_word_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stt_language_detected: Mapped[str | None] = mapped_column(String(8), nullable=True)

    # TTS quality
    tts_provider: Mapped[str | None] = mapped_column(
        String(32), nullable=True, default="google_cloud"
    )
    tts_voice_used: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tts_audio_format: Mapped[str | None] = mapped_column(
        String(16), nullable=True, default="mp3"
    )
    tts_sample_rate: Mapped[int | None] = mapped_column(
        Integer, nullable=True, default=24000
    )
    tts_bitrate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tts_character_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Audio characteristics
    audio_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    audio_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Cache status
    tts_cache_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    cache_key: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Network metrics
    request_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    download_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


class VoiceWakeWordEvent(Base):
    """Wake word detection events and accuracy tracking."""

    __tablename__ = "voice_wake_word_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Event details
    wake_word_detected: Mapped[str] = mapped_column(String(64))
    detection_confidence: Mapped[float | None] = mapped_column(
        Numeric(4, 3), nullable=True
    )
    is_valid_activation: Mapped[bool] = mapped_column(Boolean, default=True)

    # Audio context
    ambient_noise_level: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    audio_energy_level: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )

    # Device info
    device_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    browser_type: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


class VoiceEnhancementSession(SoftDeleteMixin, Base):
    """Voice enhancement sessions (binaural, spatial audio, etc.)."""

    __tablename__ = "voice_enhancement_sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Session details
    session_type: Mapped[str] = mapped_column(String(32), index=True)

    # Enhancement settings
    enhancement_config: Mapped[dict] = mapped_column(JSON)

    # Binaural specific
    binaural_frequency: Mapped[str | None] = mapped_column(String(16), nullable=True)
    binaural_base_frequency: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Breathing specific
    breathing_pattern: Mapped[str | None] = mapped_column(String(32), nullable=True)
    breath_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Ambient specific
    ambient_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ambient_volume: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)

    # Session metrics
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # User feedback
    effectiveness_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Timestamps
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
    ended_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )


class VoiceDailyCheckin(Base):
    """Voice-based daily wellness check-ins."""

    __tablename__ = "voice_daily_checkins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    checkin_date: Mapped[datetime.date] = mapped_column(
        Date, server_default=func.current_date(), index=True
    )

    # Voice check-in data
    morning_mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    evening_mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    energy_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stress_level: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Voice-detected emotions
    detected_emotions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    voice_sentiment_score: Mapped[float | None] = mapped_column(
        Numeric(4, 3), nullable=True
    )

    # Affirmations
    affirmation_played: Mapped[str | None] = mapped_column(Text, nullable=True)
    affirmation_resonated: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Timestamps
    morning_checkin_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    evening_checkin_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "checkin_date", name="uq_voice_checkin_user_date"),
    )
