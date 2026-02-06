"""Chat models: rooms, participants, messages, translations."""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import (
    TIMESTAMP,
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base, SoftDeleteMixin


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    theme: Mapped[str] = mapped_column(String(256))
    created_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    participants: Mapped[list[RoomParticipant]] = relationship(
        "RoomParticipant", back_populates="room", cascade="all, delete-orphan"
    )
    messages: Mapped[list[ChatMessage]] = relationship(
        "ChatMessage", back_populates="room", cascade="all, delete-orphan"
    )


class RoomParticipant(Base):
    __tablename__ = "room_participants"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    room_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("chat_rooms.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    joined_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    left_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    room: Mapped[ChatRoom] = relationship("ChatRoom", back_populates="participants")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    room_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("chat_rooms.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )

    room: Mapped[ChatRoom] = relationship("ChatRoom", back_populates="messages")


class ChatTranslation(Base, SoftDeleteMixin):
    """Store original and translated chat responses with language tags."""

    __tablename__ = "chat_translations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    session_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # Message identification
    message_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    # Original message
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    original_language: Mapped[str] = mapped_column(String(10), default="en", index=True)

    # Translated message
    translated_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_language: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)

    # Metadata
    translation_success: Mapped[bool] = mapped_column(Boolean, default=False)
    translation_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    translation_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        # Index for efficient lookup by user and language
        {'extend_existing': True}
    )
