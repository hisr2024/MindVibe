from __future__ import annotations

import datetime

from sqlalchemy import JSON, TIMESTAMP, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class SoftDeleteMixin:
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, default=None
    )

    def soft_delete(self) -> None:
        self.deleted_at = datetime.datetime.now(datetime.UTC)

    def restore(self) -> None:
        self.deleted_at = None

    @classmethod
    def not_deleted(cls, query):
        return query.filter(cls.deleted_at.is_(None))


class Base(DeclarativeBase):
    pass


class User(SoftDeleteMixin, Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    auth_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(256))
    locale: Mapped[str] = mapped_column(String(8), default="en")
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class Mood(SoftDeleteMixin, Base):
    __tablename__ = "moods"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[int] = mapped_column(Integer)
    tags: Mapped[dict | None] = mapped_column(JSON)
    note: Mapped[str | None] = mapped_column(Text)
    at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class EncryptedBlob(SoftDeleteMixin, Base):
    __tablename__ = "journal_blobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    blob_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class ContentPack(SoftDeleteMixin, Base):
    __tablename__ = "content_packs"
    id: Mapped[int] = mapped_column(primary_key=True)
    locale: Mapped[str] = mapped_column(String(8), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
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
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class GitaChapter(Base):
    """Bhagavad Gita chapter metadata with Sanskrit and English names."""

    __tablename__ = "gita_chapters"

    id: Mapped[int] = mapped_column(primary_key=True)
    chapter_number: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    sanskrit_name: Mapped[str] = mapped_column(String(256))
    english_name: Mapped[str] = mapped_column(String(256))
    verse_count: Mapped[int] = mapped_column(Integer)
    themes: Mapped[list[str]] = mapped_column(JSON)
    mental_health_relevance: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class GitaSource(Base):
    """Authentic sources for Gita verses (Gita Press, ISKCON, etc.)."""

    __tablename__ = "gita_sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    credibility_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class GitaVerse(Base):
    """Bhagavad Gita verses with comprehensive translations and metadata."""

    __tablename__ = "gita_verses"

    id: Mapped[int] = mapped_column(primary_key=True)
    chapter: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_chapters.chapter_number", ondelete="CASCADE"), index=True
    )
    verse: Mapped[int] = mapped_column(Integer, index=True)
    sanskrit: Mapped[str] = mapped_column(Text)
    transliteration: Mapped[str | None] = mapped_column(Text, nullable=True)
    hindi: Mapped[str] = mapped_column(Text)
    english: Mapped[str] = mapped_column(Text)
    word_meanings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    principle: Mapped[str] = mapped_column(String(256))
    theme: Mapped[str] = mapped_column(String(256), index=True)
    source_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("gita_sources.id", ondelete="SET NULL"), nullable=True, index=True
    )
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class GitaModernContext(Base):
    """Modern applications and contemporary relevance of Gita verses."""

    __tablename__ = "gita_modern_contexts"

    id: Mapped[int] = mapped_column(primary_key=True)
    verse_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_verses.id", ondelete="CASCADE"), index=True
    )
    application_area: Mapped[str] = mapped_column(String(256), index=True)
    description: Mapped[str] = mapped_column(Text)
    examples: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    mental_health_benefits: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class GitaKeyword(Base):
    """Keywords and themes for Gita verse categorization and search."""

    __tablename__ = "gita_keywords"

    id: Mapped[int] = mapped_column(primary_key=True)
    keyword: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class GitaVerseKeyword(Base):
    """Many-to-many relationship between verses and keywords."""

    __tablename__ = "gita_verse_keywords"

    id: Mapped[int] = mapped_column(primary_key=True)
    verse_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_verses.id", ondelete="CASCADE"), index=True
    )
    keyword_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_keywords.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class Session(Base):
    """User session model for authentication."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_used_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)


class RefreshToken(Base):
    """Refresh token model for token rotation."""

    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    session_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("sessions.id", ondelete="CASCADE"), index=True
    )
    token_hash: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(timezone=True))
    rotated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    rotated_to_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
