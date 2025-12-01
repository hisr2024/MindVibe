from __future__ import annotations
import datetime
from sqlalchemy import (
    Boolean,
    JSON,
    TIMESTAMP,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
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
    email: Mapped[str] = mapped_column(String(256), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=True)
    locale: Mapped[str] = mapped_column(String(8), default="en")
    role: Mapped[str] = mapped_column(String(32), default="member", nullable=False, index=True)
    two_factor_secret: Mapped[str | None] = mapped_column(
        String(64), nullable=True, default=None
    )
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_token: Mapped[str | None] = mapped_column(String(64), nullable=True)
    verification_sent_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    magic_link_token: Mapped[str | None] = mapped_column(String(128), nullable=True)
    magic_link_expires_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class Work(SoftDeleteMixin, Base):
    __tablename__ = "works"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
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


class UserProfile(SoftDeleteMixin, Base):
    __tablename__ = "user_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    full_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    base_experience: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

class Mood(SoftDeleteMixin, Base):
    __tablename__ = "moods"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[int] = mapped_column(Integer)
    tags: Mapped[dict | None] = mapped_column(JSON)
    note: Mapped[str | None] = mapped_column(Text)
    at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class JournalEntry(SoftDeleteMixin, Base):
    __tablename__ = "journal_entries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_uuid: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title_ciphertext: Mapped[str] = mapped_column(Text)
    content_ciphertext: Mapped[str] = mapped_column(Text)
    encryption_key_id: Mapped[str] = mapped_column(String(64))
    mood_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    attachments: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class JournalTag(SoftDeleteMixin, Base):
    __tablename__ = "journal_tags"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), index=True)
    description: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    __table_args__ = (UniqueConstraint("name", name="uq_journal_tags_name"),)


class JournalEntryTag(Base):
    __tablename__ = "journal_entry_tags"
    entry_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("journal_entries.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("journal_tags.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class JournalAttachment(SoftDeleteMixin, Base):
    __tablename__ = "journal_attachments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("journal_entries.id", ondelete="CASCADE"), index=True
    )
    file_name: Mapped[str] = mapped_column(String(256))
    media_type: Mapped[str] = mapped_column(String(128))
    storage_path: Mapped[str] = mapped_column(String(512))
    encryption_key_id: Mapped[str] = mapped_column(String(64))
    # "metadata" is reserved in SQLAlchemy's Declarative API; keep the column name but
    # expose it via a safe attribute name.
    attachment_metadata: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

class EncryptedBlob(SoftDeleteMixin, Base):
    __tablename__ = "journal_blobs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    blob_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

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
    primary_domain: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
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
    mental_health_benefits: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
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

class Session(Base):
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
    parent_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("refresh_tokens.id", ondelete="SET NULL"), nullable=True
    )
    reuse_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    rotated_to_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class StripeCustomer(Base):
    __tablename__ = "stripe_customers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    customer_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    price_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="usd")
    interval: Mapped[str] = mapped_column(String(32), default="month")
    stripe_price_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class Subscription(Base):
    __tablename__ = "subscriptions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("subscription_plans.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active", index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
    current_period_end: Mapped[datetime.datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    cancel_at: Mapped[datetime.datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    subscription_metadata: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class SubscriptionEvent(Base):
    __tablename__ = "subscription_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    subscription_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    event_type: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
