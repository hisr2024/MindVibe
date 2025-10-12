from __future__ import annotations

import datetime
from typing import Optional

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Text, JSON, TIMESTAMP, func, ForeignKey


# ---- Soft Delete Mixin -------------------------------------------------------
class SoftDeleteMixin:
    """Adds soft-delete support via a nullable deleted_at timestamp."""
    deleted_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
        default=None,
    )

    def soft_delete(self) -> None:
        """Mark as soft-deleted (kept in DB, excluded from active queries)."""
        self.deleted_at = datetime.datetime.now(datetime.timezone.utc)

    def restore(self) -> None:
        """Undo soft delete."""
        self.deleted_at = None

    @classmethod
    def not_deleted(cls, query):
        """Filter helper: returns only non-deleted rows for this model."""
        return query.filter(cls.deleted_at.is_(None))


# ---- Base --------------------------------------------------------------------
class Base(DeclarativeBase):
    pass


# ---- Models ------------------------------------------------------------------
class User(SoftDeleteMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    auth_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    locale: Mapped[str] = mapped_column(String(8), default="en")
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
    )


class Mood(SoftDeleteMixin, Base):
    __tablename__ = "moods"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    score: Mapped[int] = mapped_column(Integer)
    tags: Mapped[dict | None] = mapped_column(JSON)
    note: Mapped[str | None] = mapped_column(Text)
    at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
    )


class EncryptedBlob(SoftDeleteMixin, Base):
    __tablename__ = "journal_blobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    blob_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
    )


class ContentPack(SoftDeleteMixin, Base):
    __tablename__ = "content_packs"

    id: Mapped[int] = mapped_column(primary_key=True)
    locale: Mapped[str] = mapped_column(String(8), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
    )


class WisdomVerse(SoftDeleteMixin, Base):
    __tablename__ = "wisdom_verses"

    id: Mapped[int] = mapped_column(primary_key=True)
    verse_id: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    chapter: Mapped[int] = mapped_column(Integer)
    verse_number: Mapped[int] = mapped_column(Integer)
    theme: Mapped[str] = mapped_column(String(128))
    english: Mapped[str] = mapped_column(Text)
    hindi: Mapped[str] = mapped_column(Text)
    sanskrit: Mapped[str] = mapped_column(Text)
    context: Mapped[str] = mapped_column(Text)
    mental_health_applications: Mapped[dict] = mapped_column(JSON)
    embedding: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
    )


class GitaVerse(Base):
    __tablename__ = "gita_verses"

    id: Mapped[int] = mapped_column(primary_key=True)
    chapter: Mapped[int] = mapped_column(Integer)
    verse: Mapped[int] = mapped_column(Integer)
    sanskrit: Mapped[str] = mapped_column(Text)
    hindi: Mapped[str] = mapped_column(Text)
    english: Mapped[str] = mapped_column(Text)
    principle: Mapped[str] = mapped_column(String(64))
    theme: Mapped[str] = mapped_column(String(256))
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
    )
