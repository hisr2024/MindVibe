"""Companion conversation models for KIAAN Best Friend voice companion.

Stores persistent conversation sessions, messages, emotional state tracking,
and friendship context so KIAAN remembers the user across sessions and
truly acts as a best friend who knows your story.
"""

from __future__ import annotations

import datetime
import enum
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base, SoftDeleteMixin


class CompanionMood(str, enum.Enum):
    """Detected emotional state during conversation."""

    HAPPY = "happy"
    SAD = "sad"
    ANXIOUS = "anxious"
    ANGRY = "angry"
    CONFUSED = "confused"
    PEACEFUL = "peaceful"
    HOPEFUL = "hopeful"
    LONELY = "lonely"
    GRATEFUL = "grateful"
    NEUTRAL = "neutral"
    EXCITED = "excited"
    OVERWHELMED = "overwhelmed"


class ConversationPhase(str, enum.Enum):
    """Phase of the companion conversation flow.

    KIAAN follows a natural friendship pattern:
    CONNECT -> LISTEN -> UNDERSTAND -> GUIDE -> EMPOWER
    """

    CONNECT = "connect"
    LISTEN = "listen"
    UNDERSTAND = "understand"
    GUIDE = "guide"
    EMPOWER = "empower"


class CompanionSession(Base, SoftDeleteMixin):
    """A single conversation session between user and KIAAN companion.

    Each session tracks the emotional arc, topics discussed, and
    relationship depth so KIAAN can be a better friend over time.
    """

    __tablename__ = "companion_sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Session state
    phase: Mapped[str] = mapped_column(
        String(32), default=ConversationPhase.CONNECT.value
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Emotional tracking for the session
    initial_mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    final_mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    mood_improved: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Session context
    primary_topic: Mapped[str | None] = mapped_column(String(256), nullable=True)
    topics_discussed: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    wisdom_references: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Metrics
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    user_message_count: Mapped[int] = mapped_column(Integer, default=0)
    average_response_time_ms: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    # Language
    language: Mapped[str] = mapped_column(String(8), default="en")

    # Timestamps
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    ended_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_message_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Relationships
    messages: Mapped[list[CompanionMessage]] = relationship(
        "CompanionMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="CompanionMessage.created_at",
    )


class CompanionMessage(Base, SoftDeleteMixin):
    """A single message in a companion conversation.

    Stores both user messages and KIAAN responses with emotional
    analysis and any wisdom that was woven into the response.
    """

    __tablename__ = "companion_messages"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("companion_sessions.id", ondelete="CASCADE"),
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Message content
    role: Mapped[str] = mapped_column(String(16))  # "user" or "companion"
    content: Mapped[str] = mapped_column(Text)
    content_type: Mapped[str] = mapped_column(
        String(16), default="text"
    )  # text, voice, breathing

    # Emotional analysis
    detected_mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    mood_intensity: Mapped[float | None] = mapped_column(Float, nullable=True)
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Wisdom tracking (which principles were used, without exposing source)
    wisdom_used: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Internal reference to verse used (never exposed to user)
    _verse_ref: Mapped[str | None] = mapped_column(
        "verse_ref", String(32), nullable=True
    )

    # Voice metadata
    voice_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    voice_language: Mapped[str | None] = mapped_column(String(8), nullable=True)

    # Conversation phase when this message was sent
    phase: Mapped[str | None] = mapped_column(String(32), nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    # Relationships
    session: Mapped[CompanionSession] = relationship(
        "CompanionSession", back_populates="messages"
    )


class CompanionMemory(Base, SoftDeleteMixin):
    """Long-term memory KIAAN keeps about the user.

    This is what makes KIAAN a true best friend - remembering
    important details, life events, preferences, and emotional patterns.
    Encrypted at rest for privacy.
    """

    __tablename__ = "companion_memories"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Memory content
    memory_type: Mapped[str] = mapped_column(
        String(32)
    )  # "life_event", "preference", "emotional_pattern", "topic", "relationship"
    key: Mapped[str] = mapped_column(String(128), index=True)
    value: Mapped[str] = mapped_column(Text)

    # Context
    source_session_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    importance: Mapped[float] = mapped_column(Float, default=0.5)
    times_referenced: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_referenced_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "memory_type", "key", name="uq_companion_memory"),
    )


class CompanionProfile(Base):
    """User's companion profile - friendship state and preferences.

    Tracks the evolving relationship between user and KIAAN:
    how long they've been talking, what KIAAN has learned,
    and how to be a better friend.
    """

    __tablename__ = "companion_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )

    # Friendship metrics
    total_sessions: Mapped[int] = mapped_column(Integer, default=0)
    total_messages: Mapped[int] = mapped_column(Integer, default=0)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_conversation_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Personality preferences (how KIAAN should talk to this user)
    preferred_tone: Mapped[str] = mapped_column(
        String(32), default="warm"
    )  # warm, playful, gentle, direct
    prefers_tough_love: Mapped[bool] = mapped_column(Boolean, default=False)
    humor_level: Mapped[float] = mapped_column(Float, default=0.5)

    # Emotional baseline
    common_moods: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    emotional_triggers: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    coping_strengths: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # What KIAAN calls the user
    preferred_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    address_style: Mapped[str] = mapped_column(
        String(32), default="friend"
    )  # friend, dear, buddy, name

    # Topics the user likes to discuss
    favorite_topics: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )
