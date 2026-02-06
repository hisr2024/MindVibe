"""Journal models: EncryptedBlob, JournalEntry, JournalTag, JournalEntryTag, JournalVersion, JournalSearchIndex."""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


class EncryptedBlob(SoftDeleteMixin, Base):
    __tablename__ = "journal_blobs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    blob_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class JournalEntry(SoftDeleteMixin, Base):
    """Encrypted journal entries stored as zero-knowledge blobs."""

    __tablename__ = "journal_entries"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    encrypted_title: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    encrypted_content: Mapped[dict] = mapped_column(JSON)
    encryption_meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    mood_labels: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    tag_labels: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    client_updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True)
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class JournalTag(SoftDeleteMixin, Base):
    """User-defined tag or mood label for journal entries."""

    __tablename__ = "journal_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(64))
    color: Mapped[str | None] = mapped_column(String(16), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class JournalEntryTag(Base):
    """Association table linking entries to tags."""

    __tablename__ = "journal_entry_tags"

    entry_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("journal_entries.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("journal_tags.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )


class JournalVersion(Base):
    """Immutable snapshots of encrypted entry revisions for conflict resolution."""

    __tablename__ = "journal_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("journal_entries.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    version: Mapped[int] = mapped_column(Integer)
    encrypted_content: Mapped[dict] = mapped_column(JSON)
    encryption_meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    client_updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True)
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class JournalSearchIndex(SoftDeleteMixin, Base):
    """Client-provided searchable token hashes for encrypted entries."""

    __tablename__ = "journal_search_index"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("journal_entries.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token_hashes: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
