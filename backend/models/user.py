"""User-related models: User, UserProfile, Work, UserProgress."""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


class User(SoftDeleteMixin, Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    auth_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str] = mapped_column(
        String(256), unique=True, index=True, nullable=True
    )
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=True)
    locale: Mapped[str] = mapped_column(String(8), default="en")
    two_factor_secret: Mapped[str | None] = mapped_column(
        String(64), nullable=True, default=None
    )
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_backup_codes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Account lockout fields for brute force protection
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, default=None
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class UserProfile(SoftDeleteMixin, Base):
    __tablename__ = "user_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    full_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    base_experience: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class Work(SoftDeleteMixin, Base):
    __tablename__ = "works"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserProgress(SoftDeleteMixin, Base):
    __tablename__ = "user_progress"

    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    total_mood_entries: Mapped[int] = mapped_column(Integer, default=0)
    total_journals: Mapped[int] = mapped_column(Integer, default=0)
    total_chat_sessions: Mapped[int] = mapped_column(Integer, default=0)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    current_stage: Mapped[str | None] = mapped_column(String(64), nullable=True)
    last_awarded_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
