"""Wisdom and Gita verse models."""

from __future__ import annotations

import datetime

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


class ContentPack(SoftDeleteMixin, Base):
    __tablename__ = "content_packs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    locale: Mapped[str] = mapped_column(String(8), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class WisdomVerse(SoftDeleteMixin, Base):
    __tablename__ = "wisdom_verses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
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
    # Domain tagging for psychological categorization
    primary_domain: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    secondary_domains: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class GitaChapter(Base):
    __tablename__ = "gita_chapters"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
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
    __tablename__ = "gita_sources"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    credibility_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class GitaVerse(Base):
    __tablename__ = "gita_verses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chapter: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("gita_chapters.chapter_number", ondelete="CASCADE"),
        index=True,
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
        Integer,
        ForeignKey("gita_sources.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)
    # Mental health application tags for KIAAN wisdom engine
    mental_health_applications: Mapped[list[str] | None] = mapped_column(
        JSON, nullable=True
    )
    primary_domain: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    secondary_domains: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class GitaModernContext(Base):
    __tablename__ = "gita_modern_contexts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    verse_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_verses.id", ondelete="CASCADE"), index=True
    )
    application_area: Mapped[str] = mapped_column(String(256), index=True)
    description: Mapped[str] = mapped_column(Text)
    examples: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    mental_health_benefits: Mapped[list[str] | None] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class GitaKeyword(Base):
    __tablename__ = "gita_keywords"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    keyword: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class GitaVerseKeyword(Base):
    __tablename__ = "gita_verse_keywords"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    verse_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_verses.id", ondelete="CASCADE"), index=True
    )
    keyword_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_keywords.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class GitaVerseUsage(Base):
    """Track Gita verse usage across tools."""

    __tablename__ = "gita_verse_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    verse_id: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    tool_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    used_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    effectiveness_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
