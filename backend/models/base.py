from __future__ import annotations

import datetime
import enum
import uuid
from decimal import Decimal

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, validates


class SubscriptionTier(str, enum.Enum):
    """Subscription tier levels."""

    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    """Status of a user's subscription."""

    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    EXPIRED = "expired"
    TRIALING = "trialing"


class PaymentStatus(str, enum.Enum):
    """Status of a payment."""

    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"


class AchievementCategory(str, enum.Enum):
    """Activity category that drives achievement progress."""

    MOOD = "MOOD"
    JOURNAL = "JOURNAL"
    CHAT = "CHAT"
    STREAK = "STREAK"
    WELLNESS = "WELLNESS"


class AchievementRarity(str, enum.Enum):
    """Rarity tiers for badges and unlockables."""

    COMMON = "COMMON"
    RARE = "RARE"
    EPIC = "EPIC"
    LEGENDARY = "LEGENDARY"


class UnlockableType(str, enum.Enum):
    """Unlockable reward types available in the Karmic Tree."""

    THEME = "THEME"
    PROMPT = "PROMPT"
    BADGE = "BADGE"
    BOOST = "BOOST"


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


class Achievement(SoftDeleteMixin, Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(256))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[AchievementCategory] = mapped_column(
        Enum(
            AchievementCategory,
            name="achievementcategory",
            native_enum=True,
            create_constraint=False,
        )
    )
    target_value: Mapped[int] = mapped_column(Integer, default=1)
    rarity: Mapped[AchievementRarity] = mapped_column(
        Enum(
            AchievementRarity,
            name="achievementrarity",
            native_enum=True,
            create_constraint=False,
        ),
        default=AchievementRarity.COMMON,
    )
    badge_icon: Mapped[str | None] = mapped_column(String(32), nullable=True)
    reward_hint: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class UserAchievement(SoftDeleteMixin, Base):
    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    achievement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("achievements.id", ondelete="CASCADE"), index=True
    )
    progress: Mapped[int] = mapped_column(Integer, default=0)
    unlocked: Mapped[bool] = mapped_column(Boolean, default=False)
    unlocked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class Unlockable(SoftDeleteMixin, Base):
    __tablename__ = "unlockables"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(256))
    description: Mapped[str] = mapped_column(Text)
    kind: Mapped[UnlockableType] = mapped_column(
        Enum(
            UnlockableType,
            name="unlockabletype",
            native_enum=True,
            create_constraint=False,
        )
    )
    rarity: Mapped[AchievementRarity] = mapped_column(
        Enum(
            AchievementRarity,
            name="achievementrarity",
            native_enum=True,
            create_constraint=False,
        ),
        default=AchievementRarity.COMMON,
    )
    required_achievement_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("achievements.id", ondelete="SET NULL"),
        nullable=True,
    )
    reward_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class UserUnlockable(SoftDeleteMixin, Base):
    __tablename__ = "user_unlockables"
    __table_args__ = (
        UniqueConstraint("user_id", "unlockable_id", name="uq_user_unlockable"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    unlockable_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("unlockables.id", ondelete="CASCADE"), index=True
    )
    unlocked: Mapped[bool] = mapped_column(Boolean, default=False)
    unlocked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    source: Mapped[str | None] = mapped_column(String(128), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
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


class Mood(SoftDeleteMixin, Base):
    __tablename__ = "moods"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[int] = mapped_column(Integer)
    tags: Mapped[dict | None] = mapped_column(JSON)
    note: Mapped[str | None] = mapped_column(Text)
    at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


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


# =============================================================================
# KIAAN Learning System - Daemon Knowledge Storage
# =============================================================================


class ContentSourceType(str, enum.Enum):
    """Type of content source for learned wisdom."""

    YOUTUBE = "youtube"
    AUDIO = "audio"
    WEB = "web"
    PODCAST = "podcast"
    BOOK = "book"
    MANUAL = "manual"


class ValidationStatus(str, enum.Enum):
    """Validation status for learned wisdom."""

    PENDING = "pending"
    VALIDATED = "validated"
    REJECTED = "rejected"


class LearnedWisdom(SoftDeleteMixin, Base):
    """
    Wisdom learned by KIAAN's 24/7 daemon from various sources.

    This table stores Gita-related content fetched from YouTube, audio platforms,
    web sources, etc. It connects the daemon's output to the Wisdom Core,
    allowing KIAAN to use learned content in journey generation.
    """

    __tablename__ = "learned_wisdom"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )  # SHA-256 hash for deduplication

    # Source information
    source_type: Mapped[ContentSourceType] = mapped_column(
        Enum(ContentSourceType), nullable=False, index=True
    )
    source_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    source_name: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    source_author: Mapped[str | None] = mapped_column(String(256), nullable=True)

    # Language
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en", index=True)

    # Gita references
    chapter_refs: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    verse_refs: Mapped[list[list[int]]] = mapped_column(JSON, nullable=False, default=list)

    # Categorization
    themes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    shad_ripu_tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    # Mental health mapping (similar to GitaVerse)
    primary_domain: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    secondary_domains: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    mental_health_applications: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Quality & validation
    quality_score: Mapped[float] = mapped_column(
        Numeric(3, 2), nullable=False, default=0.0
    )  # 0.00 - 1.00
    validation_status: Mapped[ValidationStatus] = mapped_column(
        Enum(ValidationStatus), nullable=False, default=ValidationStatus.PENDING, index=True
    )
    validated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    validated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Embeddings for semantic search
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)

    # Usage tracking
    usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_used_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Extra metadata (named extra_metadata because 'metadata' is reserved by SQLAlchemy)
    extra_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Timestamps
    learned_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserQueryPattern(SoftDeleteMixin, Base):
    """
    Patterns learned from user queries to improve KIAAN's responses.

    Tracks common query patterns, their intent, and successful response mappings
    to enable better offline/template-based responses.
    """

    __tablename__ = "user_query_patterns"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Pattern definition
    query_template: Mapped[str] = mapped_column(Text, nullable=False)
    query_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )  # For deduplication
    intent: Mapped[str] = mapped_column(String(128), nullable=False, index=True)

    # Gita mappings
    related_chapters: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    related_verses: Mapped[list[list[int]]] = mapped_column(JSON, nullable=False, default=list)
    related_themes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    # Response template (for AI-free responses)
    response_template: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Statistics
    frequency: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    successful_responses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Timestamps
    first_seen_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    last_seen_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class ContentSourceRegistry(SoftDeleteMixin, Base):
    """
    Registry of content sources used by the KIAAN learning daemon.

    Tracks source health, fetch history, and configuration.
    """

    __tablename__ = "content_source_registry"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Source identification
    name: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
    source_type: Mapped[ContentSourceType] = mapped_column(
        Enum(ContentSourceType), nullable=False, index=True
    )
    url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # Configuration
    fetch_interval_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, default=3600
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Health tracking
    last_fetch_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_success_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    consecutive_failures: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_items_fetched: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Credibility
    credibility_rating: Mapped[int] = mapped_column(
        Integer, nullable=False, default=5
    )  # 1-10 scale

    # Extra metadata (named extra_metadata because 'metadata' is reserved by SQLAlchemy)
    extra_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class Session(Base):
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
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
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
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


# =============================================================================
# Subscription System Models
# =============================================================================


class SubscriptionPlan(Base):
    """Defines available subscription plans/tiers."""

    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tier: Mapped[SubscriptionTier] = mapped_column(
        Enum(SubscriptionTier, native_enum=False, length=32), unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(64))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_monthly: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    price_yearly: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    stripe_price_id_monthly: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )
    stripe_price_id_yearly: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )
    features: Mapped[dict] = mapped_column(JSON, default=dict)
    kiaan_questions_monthly: Mapped[int] = mapped_column(Integer, default=10)
    encrypted_journal: Mapped[bool] = mapped_column(Boolean, default=False)
    data_retention_days: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserSubscription(SoftDeleteMixin, Base):
    """Tracks a user's active subscription."""

    __tablename__ = "user_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    plan_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subscription_plans.id", ondelete="RESTRICT"), index=True
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, native_enum=False, length=32),
        default=SubscriptionStatus.ACTIVE,
        index=True,
    )
    stripe_customer_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    current_period_start: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    current_period_end: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    canceled_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    plan: Mapped[SubscriptionPlan] = relationship("SubscriptionPlan", lazy="joined")


class UsageTracking(Base):
    """Tracks feature usage (e.g., KIAAN questions) per user per month."""

    __tablename__ = "usage_tracking"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    feature: Mapped[str] = mapped_column(
        String(64), index=True
    )  # e.g., "kiaan_questions"
    period_start: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), index=True
    )
    period_end: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(timezone=True))
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    usage_limit: Mapped[int] = mapped_column(Integer, default=10)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class Payment(SoftDeleteMixin, Base):
    """Records payment transactions."""

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    subscription_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("user_subscriptions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True, index=True
    )
    stripe_invoice_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(3), default="usd")
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False, length=32),
        default=PaymentStatus.PENDING,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


# =============================================================================
# Enterprise Admin System Models
# =============================================================================


class AdminRole(str, enum.Enum):
    """Admin role levels with hierarchical permissions."""

    SUPER_ADMIN = "super_admin"  # Full system access
    ADMIN = "admin"  # Most admin capabilities
    MODERATOR = "moderator"  # Content moderation
    SUPPORT = "support"  # User support
    ANALYST = "analyst"  # Read-only analytics


class AdminPermission(str, enum.Enum):
    """Granular permissions for RBAC."""

    # User Management
    USERS_VIEW = "users:view"
    USERS_EDIT = "users:edit"
    USERS_SUSPEND = "users:suspend"
    USERS_DELETE = "users:delete"
    # Subscription Management
    SUBSCRIPTIONS_VIEW = "subscriptions:view"
    SUBSCRIPTIONS_MODIFY = "subscriptions:modify"
    PAYMENTS_REFUND = "payments:refund"
    # Content Moderation
    MODERATION_VIEW = "moderation:view"
    MODERATION_ACTION = "moderation:action"
    # Feature Flags
    FEATURE_FLAGS_VIEW = "feature_flags:view"
    FEATURE_FLAGS_MANAGE = "feature_flags:manage"
    # Announcements
    ANNOUNCEMENTS_VIEW = "announcements:view"
    ANNOUNCEMENTS_MANAGE = "announcements:manage"
    # A/B Tests
    AB_TESTS_VIEW = "ab_tests:view"
    AB_TESTS_MANAGE = "ab_tests:manage"
    # Audit Logs
    AUDIT_LOGS_VIEW = "audit_logs:view"
    # Data Export
    DATA_EXPORT = "data:export"
    # Admin Management
    ADMIN_MANAGE = "admin:manage"
    # KIAAN (Read-only)
    KIAAN_ANALYTICS_VIEW = "kiaan:analytics_view"


# Role to permission mapping
ROLE_PERMISSIONS: dict[AdminRole, list[AdminPermission]] = {
    AdminRole.SUPER_ADMIN: list(AdminPermission),  # All permissions
    AdminRole.ADMIN: [
        AdminPermission.USERS_VIEW,
        AdminPermission.USERS_EDIT,
        AdminPermission.USERS_SUSPEND,
        AdminPermission.SUBSCRIPTIONS_VIEW,
        AdminPermission.SUBSCRIPTIONS_MODIFY,
        AdminPermission.PAYMENTS_REFUND,
        AdminPermission.MODERATION_VIEW,
        AdminPermission.MODERATION_ACTION,
        AdminPermission.FEATURE_FLAGS_VIEW,
        AdminPermission.FEATURE_FLAGS_MANAGE,
        AdminPermission.ANNOUNCEMENTS_VIEW,
        AdminPermission.ANNOUNCEMENTS_MANAGE,
        AdminPermission.AB_TESTS_VIEW,
        AdminPermission.AB_TESTS_MANAGE,
        AdminPermission.AUDIT_LOGS_VIEW,
        AdminPermission.DATA_EXPORT,
        AdminPermission.KIAAN_ANALYTICS_VIEW,
    ],
    AdminRole.MODERATOR: [
        AdminPermission.USERS_VIEW,
        AdminPermission.MODERATION_VIEW,
        AdminPermission.MODERATION_ACTION,
        AdminPermission.ANNOUNCEMENTS_VIEW,
        AdminPermission.ANNOUNCEMENTS_MANAGE,
        AdminPermission.KIAAN_ANALYTICS_VIEW,
    ],
    AdminRole.SUPPORT: [
        AdminPermission.USERS_VIEW,
        AdminPermission.USERS_EDIT,
        AdminPermission.SUBSCRIPTIONS_VIEW,
        AdminPermission.MODERATION_VIEW,
        AdminPermission.KIAAN_ANALYTICS_VIEW,
    ],
    AdminRole.ANALYST: [
        AdminPermission.USERS_VIEW,
        AdminPermission.SUBSCRIPTIONS_VIEW,
        AdminPermission.AB_TESTS_VIEW,
        AdminPermission.AUDIT_LOGS_VIEW,
        AdminPermission.KIAAN_ANALYTICS_VIEW,
    ],
}


class AdminAuditAction(str, enum.Enum):
    """Types of admin audit log actions."""

    # Authentication
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"
    # User Management
    USER_VIEWED = "user_viewed"
    USER_SUSPENDED = "user_suspended"
    USER_REACTIVATED = "user_reactivated"
    USER_DELETED = "user_deleted"
    # Subscription Management
    SUBSCRIPTION_VIEWED = "subscription_viewed"
    SUBSCRIPTION_MODIFIED = "subscription_modified"
    PAYMENT_REFUNDED = "payment_refunded"
    # Moderation
    CONTENT_FLAGGED = "content_flagged"
    CONTENT_APPROVED = "content_approved"
    CONTENT_REJECTED = "content_rejected"
    # Feature Flags
    FEATURE_FLAG_CREATED = "feature_flag_created"
    FEATURE_FLAG_UPDATED = "feature_flag_updated"
    FEATURE_FLAG_DELETED = "feature_flag_deleted"
    # Announcements
    ANNOUNCEMENT_CREATED = "announcement_created"
    ANNOUNCEMENT_UPDATED = "announcement_updated"
    ANNOUNCEMENT_DELETED = "announcement_deleted"
    # A/B Tests
    AB_TEST_CREATED = "ab_test_created"
    AB_TEST_UPDATED = "ab_test_updated"
    AB_TEST_DELETED = "ab_test_deleted"
    # Data Export
    DATA_EXPORTED = "data_exported"
    # Admin Management
    ADMIN_CREATED = "admin_created"
    ADMIN_UPDATED = "admin_updated"
    ADMIN_DELETED = "admin_deleted"


class ModerationStatus(str, enum.Enum):
    """Status of flagged content moderation."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AnnouncementType(str, enum.Enum):
    """Type of announcement display."""

    BANNER = "banner"
    MODAL = "modal"
    TOAST = "toast"
    EMAIL = "email"


class ABTestStatus(str, enum.Enum):
    """Status of an A/B test."""

    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class AdminUser(SoftDeleteMixin, Base):
    """Admin users with MFA and role-based access."""

    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(256))
    full_name: Mapped[str] = mapped_column(String(256))
    role: Mapped[AdminRole] = mapped_column(
        Enum(AdminRole, native_enum=False, length=32),
        default=AdminRole.SUPPORT,
        index=True,
    )
    # MFA - Required for admin login
    mfa_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_backup_codes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # IP Whitelisting
    ip_whitelist: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_login_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class AdminPermissionAssignment(Base):
    """Additional permission assignments beyond role defaults."""

    __tablename__ = "admin_permission_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="CASCADE"), index=True
    )
    permission: Mapped[AdminPermission] = mapped_column(
        Enum(AdminPermission, native_enum=False, length=64)
    )
    granted: Mapped[bool] = mapped_column(
        Boolean, default=True
    )  # True=grant, False=revoke
    granted_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class AdminSession(Base):
    """Admin session tracking with expiration."""

    __tablename__ = "admin_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    admin_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="CASCADE"), index=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_activity_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(timezone=True))
    revoked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )


class AdminAuditLog(Base):
    """Immutable audit log for all admin actions."""

    __tablename__ = "admin_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("admin_users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[AdminAuditAction] = mapped_column(
        Enum(AdminAuditAction, native_enum=False, length=64), index=True
    )
    resource_type: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    resource_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


class FeatureFlag(SoftDeleteMixin, Base):
    """Feature flags for gradual rollout and targeting."""

    __tablename__ = "feature_flags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Toggle state
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    # Gradual rollout (0-100%)
    rollout_percentage: Mapped[int] = mapped_column(Integer, default=100)
    # Targeting rules
    target_tiers: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    target_user_ids: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Metadata
    created_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class Announcement(SoftDeleteMixin, Base):
    """System announcements with targeting and scheduling."""

    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(256))
    content: Mapped[str] = mapped_column(Text)
    type: Mapped[AnnouncementType] = mapped_column(
        Enum(AnnouncementType, native_enum=False, length=32),
        default=AnnouncementType.BANNER,
    )
    # Targeting
    target_tiers: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    target_user_ids: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Scheduling
    starts_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    ends_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Metadata
    created_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class ABTest(SoftDeleteMixin, Base):
    """A/B testing experiments."""

    __tablename__ = "ab_tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Variants configuration
    variants: Mapped[list[dict]] = mapped_column(JSON)  # [{name, weight}, ...]
    # Traffic allocation (0-100%)
    traffic_percentage: Mapped[int] = mapped_column(Integer, default=100)
    # Status
    status: Mapped[ABTestStatus] = mapped_column(
        Enum(ABTestStatus, native_enum=False, length=32),
        default=ABTestStatus.DRAFT,
        index=True,
    )
    # Targeting
    target_tiers: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Schedule
    starts_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    ends_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    # Metadata
    created_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class ABTestAssignment(Base):
    """Tracks user assignments to A/B test variants."""

    __tablename__ = "ab_test_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ab_tests.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    variant: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class ABTestConversion(Base):
    """Tracks conversion events for A/B tests."""

    __tablename__ = "ab_test_conversions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ab_tests.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    variant: Mapped[str] = mapped_column(String(64))
    event_name: Mapped[str] = mapped_column(String(128), index=True)
    event_value: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class FlaggedContent(SoftDeleteMixin, Base):
    """Content moderation queue."""

    __tablename__ = "flagged_content"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    content_type: Mapped[str] = mapped_column(
        String(64), index=True
    )  # journal, feedback, etc.
    content_id: Mapped[str] = mapped_column(String(255), index=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    reason: Mapped[str] = mapped_column(String(256))
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Moderation
    status: Mapped[ModerationStatus] = mapped_column(
        Enum(ModerationStatus, native_enum=False, length=32),
        default=ModerationStatus.PENDING,
        index=True,
    )
    moderated_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    moderated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    moderation_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Metadata
    flagged_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class KiaanUsageAnalytics(Base):
    """Aggregated KIAAN usage analytics (read-only for admin)."""

    __tablename__ = "kiaan_usage_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), index=True
    )
    # Aggregated counts (no personal data)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    unique_users: Mapped[int] = mapped_column(Integer, default=0)
    # Topic trends (aggregated, anonymized)
    topic_distribution: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Tier breakdown
    questions_by_tier: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Response metrics
    avg_response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    satisfaction_avg: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


# =============================================================================
# Compliance & GDPR Models
# =============================================================================


class ConsentType(str, enum.Enum):
    """Types of consent."""

    PRIVACY_POLICY = "privacy_policy"
    TERMS_OF_SERVICE = "terms_of_service"
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    FUNCTIONAL_COOKIES = "functional_cookies"
    DATA_PROCESSING = "data_processing"


class DataExportStatus(str, enum.Enum):
    """Status of a data export request."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class DeletionRequestStatus(str, enum.Enum):
    """Status of an account deletion request."""

    PENDING = "pending"
    GRACE_PERIOD = "grace_period"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELED = "canceled"


class UserConsent(Base):
    """Tracks user consent preferences for GDPR compliance."""

    __tablename__ = "user_consents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    consent_type: Mapped[ConsentType] = mapped_column(
        Enum(ConsentType, native_enum=False, length=64), index=True
    )
    granted: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[str] = mapped_column(String(32), default="1.0")
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    granted_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    withdrawn_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class CookiePreference(Base):
    """Stores user cookie preferences."""

    __tablename__ = "cookie_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # For anonymous users
    anonymous_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    # Cookie categories
    necessary: Mapped[bool] = mapped_column(Boolean, default=True)  # Always required
    analytics: Mapped[bool] = mapped_column(Boolean, default=False)
    marketing: Mapped[bool] = mapped_column(Boolean, default=False)
    functional: Mapped[bool] = mapped_column(Boolean, default=False)
    # Metadata
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class DataExportRequest(Base):
    """Tracks GDPR data export requests."""

    __tablename__ = "data_export_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[DataExportStatus] = mapped_column(
        Enum(DataExportStatus, native_enum=False, length=32),
        default=DataExportStatus.PENDING,
        index=True,
    )
    format: Mapped[str] = mapped_column(String(16), default="json")  # json, csv, zip
    download_token: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True
    )
    download_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expires_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class DeletionRequest(Base):
    """Tracks account deletion requests with grace period."""

    __tablename__ = "deletion_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    status: Mapped[DeletionRequestStatus] = mapped_column(
        Enum(DeletionRequestStatus, native_enum=False, length=32),
        default=DeletionRequestStatus.PENDING,
        index=True,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Grace period (default 30 days)
    grace_period_days: Mapped[int] = mapped_column(Integer, default=30)
    grace_period_ends_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    # Notifications
    notification_sent_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    reminder_sent_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    # Completion
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    canceled_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )


class ComplianceAuditLog(Base):
    """Audit log for compliance-related actions (separate from admin audit logs)."""

    __tablename__ = "compliance_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(64), index=True)
    resource_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    severity: Mapped[str] = mapped_column(
        String(16), default="info"
    )  # info, warning, critical
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


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


class EmotionalResetSession(SoftDeleteMixin, Base):
    """Tracks user emotional reset sessions with the 7-step guided flow.

    Supports both authenticated and anonymous users:
    - Authenticated users: user_id is their actual user ID from users table
    - Anonymous users: user_id follows pattern "anon-{12-char-hex}"

    Note: Foreign key constraint removed to support anonymous users.
    For authenticated users, application-level validation is performed via
    get_current_user() dependency which verifies the user exists.
    """

    __tablename__ = "emotional_reset_sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255),
        index=True,
        # Note: No FK constraint - supports anonymous users (anon-{uuid})
        # Authenticated user IDs are validated at the application layer
    )
    session_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    current_step: Mapped[int] = mapped_column(Integer, default=1)
    emotions_input: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessment_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    wisdom_verses: Mapped[list | None] = mapped_column(JSON, nullable=True)
    affirmations: Mapped[list | None] = mapped_column(JSON, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    journal_entry_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("journal_entries.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserEmotionalLog(Base):
    """Daily emotional check-ins and logs for users."""

    __tablename__ = "user_emotional_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    log_date: Mapped[datetime.date] = mapped_column(
        Date, server_default=func.current_date(), index=True
    )
    emotional_state: Mapped[str] = mapped_column(String(50), index=True)
    intensity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    triggers: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    verse_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserDailyAnalysis(Base):
    """Automated daily mental health analysis and insights."""

    __tablename__ = "user_daily_analysis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    analysis_date: Mapped[datetime.date] = mapped_column(
        Date, server_default=func.current_date(), index=True
    )
    emotional_summary: Mapped[str] = mapped_column(Text)
    recommended_verses: Mapped[list] = mapped_column(JSON)
    insights: Mapped[list] = mapped_column(JSON)
    action_items: Mapped[list | None] = mapped_column(JSON, nullable=True)
    overall_mood_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "analysis_date", name="uq_user_daily_analysis"),
    )


class UserWeeklyReflection(Base):
    """Weekly sacred reflections and deep-dive assessments."""

    __tablename__ = "user_weekly_reflections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    week_start_date: Mapped[datetime.date] = mapped_column(Date, index=True)
    week_end_date: Mapped[datetime.date] = mapped_column(Date)
    reflection_type: Mapped[str] = mapped_column(
        String(50), default="sacred_reflection"
    )
    emotional_journey_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_insights: Mapped[list | None] = mapped_column(JSON, nullable=True)
    verses_explored: Mapped[list | None] = mapped_column(JSON, nullable=True)
    milestones_achieved: Mapped[list | None] = mapped_column(JSON, nullable=True)
    areas_for_growth: Mapped[list | None] = mapped_column(JSON, nullable=True)
    gratitude_items: Mapped[list | None] = mapped_column(JSON, nullable=True)
    overall_wellbeing_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "week_start_date", name="uq_user_weekly_reflection"
        ),
    )


class UserAssessment(Base):
    """Structured weekly mental health assessments with Gita wisdom."""

    __tablename__ = "user_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    assessment_date: Mapped[datetime.date] = mapped_column(
        Date, server_default=func.current_date(), index=True
    )
    assessment_type: Mapped[str] = mapped_column(
        String(50), default="weekly", index=True
    )
    questions_responses: Mapped[dict] = mapped_column(JSON)
    calculated_scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    recommended_focus_areas: Mapped[list | None] = mapped_column(JSON, nullable=True)
    personalized_verses: Mapped[list | None] = mapped_column(JSON, nullable=True)
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class UserVerseBookmark(Base):
    """User-saved Gita verses with personal notes."""

    __tablename__ = "user_verses_bookmarked"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    verse_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("gita_verses.id", ondelete="CASCADE"), index=True
    )
    bookmark_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    personal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "verse_id", name="uq_user_verse_bookmark"),
    )


class UserJourneyProgress(Base):
    """Track user progress through KIAAN modules and journeys."""

    __tablename__ = "user_journey_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    module_name: Mapped[str] = mapped_column(String(100), index=True)
    module_type: Mapped[str] = mapped_column(String(50))
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    steps_completed: Mapped[list | None] = mapped_column(JSON, nullable=True)
    total_steps: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_activity_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="in_progress", index=True)
    achievements: Mapped[list | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "module_name", name="uq_user_journey_progress"),
    )


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


# =============================================================================
# Wisdom Journey System Models
# =============================================================================


class JourneyStatus(str, enum.Enum):
    """Status of a wisdom journey."""

    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class WisdomJourney(SoftDeleteMixin, Base):
    """AI-powered personalized wisdom journey with dynamic verse sequences."""

    __tablename__ = "wisdom_journeys"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Journey configuration
    total_steps: Mapped[int] = mapped_column(Integer, default=7)
    current_step: Mapped[int] = mapped_column(Integer, default=0)

    # Status and progress
    status: Mapped[JourneyStatus] = mapped_column(
        Enum(JourneyStatus, native_enum=False, length=32),
        default=JourneyStatus.ACTIVE,
        index=True,
    )
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)

    # Personalization metadata
    recommended_by: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # "ai", "mood_based", "journal_based", "manual"
    recommendation_score: Mapped[float | None] = mapped_column(
        Numeric(5, 4), nullable=True
    )  # 0.0-1.0
    recommendation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Source data for personalization (privacy-preserving)
    source_mood_scores: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )  # Last 7 days mood averages
    source_themes: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )  # Extracted journal themes

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    paused_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )


class JourneyStep(SoftDeleteMixin, Base):
    """Individual step in a wisdom journey with associated verse and reflections."""

    __tablename__ = "journey_steps"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    journey_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("wisdom_journeys.id", ondelete="CASCADE"), index=True
    )
    step_number: Mapped[int] = mapped_column(Integer)

    # Verse association
    verse_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("gita_verses.id", ondelete="SET NULL"), nullable=True
    )

    # Step content
    reflection_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_insight: Mapped[str | None] = mapped_column(Text, nullable=True)

    # User progress
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    time_spent_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # User reflection (encrypted)
    user_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_rating: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )  # 1-5 stars

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("journey_id", "step_number", name="uq_journey_step"),
    )


class JourneyRecommendation(Base):
    """Tracks journey recommendations for continuous ML improvement."""

    __tablename__ = "journey_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Recommendation details
    journey_template: Mapped[str] = mapped_column(String(128))
    relevance_score: Mapped[float] = mapped_column(Numeric(5, 4))  # 0.0-1.0
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # User interaction
    accepted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    journey_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("wisdom_journeys.id", ondelete="SET NULL"), nullable=True
    )

    # ML features (for retraining)
    features_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
    accepted_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )


# =============================================================================
# KIAAN Voice System Models
# =============================================================================


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


# ==================== INDIAN WELLNESS CONTENT MODELS ====================


class IndianDataSourceType(str, enum.Enum):
    """Types of authentic Indian data sources."""

    NHP = "national_health_portal"
    AYUSH = "ministry_ayush"
    ICMR = "icmr"
    NIMHANS = "nimhans"
    YOGA_INSTITUTE = "yoga_institute"
    AYURVEDA = "ayurveda"
    MEDITATION = "meditation"
    PRANAYAMA = "pranayama"
    WELLNESS_INDIA = "wellness_india"
    TRADITIONAL_MEDICINE = "traditional_medicine"


class IndianContentCategory(str, enum.Enum):
    """Categories of Indian wellness content."""

    MENTAL_HEALTH = "mental_health"
    STRESS_MANAGEMENT = "stress_management"
    ANXIETY_RELIEF = "anxiety_relief"
    DEPRESSION_SUPPORT = "depression_support"
    YOGA_PRACTICES = "yoga_practices"
    MEDITATION_TECHNIQUES = "meditation_techniques"
    PRANAYAMA = "pranayama"
    AYURVEDIC_WELLNESS = "ayurvedic_wellness"
    SLEEP_HEALTH = "sleep_health"
    EMOTIONAL_BALANCE = "emotional_balance"
    MINDFULNESS = "mindfulness"
    LIFESTYLE_WELLNESS = "lifestyle_wellness"


class IndianWisdomContent(SoftDeleteMixin, Base):
    """
    Authentic Indian wellness content from government and institutional sources.

    Stores curated content from NHP, AYUSH, ICMR, NIMHANS, and recognized
    yoga/wellness institutions for integration with KIAAN.
    """

    __tablename__ = "indian_wisdom_content"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source: Mapped[IndianDataSourceType] = mapped_column(
        Enum(
            IndianDataSourceType,
            name="indiandatasourcetype",
            native_enum=True,
            create_constraint=False,
        ),
        index=True,
    )
    category: Mapped[IndianContentCategory] = mapped_column(
        Enum(
            IndianContentCategory,
            name="indiancontentcategory",
            native_enum=True,
            create_constraint=False,
        ),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(512))
    content: Mapped[str] = mapped_column(Text)
    hindi_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    sanskrit_terms: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(64)), nullable=True
    )
    keywords: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(64)), nullable=True
    )
    practices: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(128)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    source_organization: Mapped[str | None] = mapped_column(String(256), nullable=True)
    last_fetched_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class YogaAsanaDB(SoftDeleteMixin, Base):
    """
    Authentic yoga asanas with Sanskrit terminology and mental health benefits.

    Based on teachings from The Yoga Institute, Ministry of AYUSH, and
    traditional yoga texts.
    """

    __tablename__ = "yoga_asanas"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sanskrit_name: Mapped[str] = mapped_column(String(128), index=True)
    english_name: Mapped[str] = mapped_column(String(128), index=True)
    hindi_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category: Mapped[str] = mapped_column(
        String(32), index=True
    )  # standing, seated, supine, prone, inversion
    difficulty: Mapped[str] = mapped_column(
        String(16), default="beginner"
    )  # beginner, intermediate, advanced
    description: Mapped[str] = mapped_column(Text)
    instructions: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(512)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    mental_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    contraindications: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    duration_seconds: Mapped[int] = mapped_column(Integer, default=30)
    breath_pattern: Mapped[str | None] = mapped_column(String(256), nullable=True)
    chakra_association: Mapped[str | None] = mapped_column(String(64), nullable=True)
    dosha_balance: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(16)), nullable=True
    )  # vata, pitta, kapha
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class PranayamaTechniqueDB(SoftDeleteMixin, Base):
    """
    Authentic pranayama breathing techniques from Indian traditions.

    Based on Hatha Yoga Pradipika, Ministry of AYUSH guidelines,
    and traditional yoga teachings.
    """

    __tablename__ = "pranayama_techniques"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sanskrit_name: Mapped[str] = mapped_column(String(128), index=True)
    english_name: Mapped[str] = mapped_column(String(128), index=True)
    hindi_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    instructions: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(512)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    mental_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    contraindications: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    duration_minutes: Mapped[int] = mapped_column(Integer, default=5)
    breath_ratio: Mapped[str | None] = mapped_column(
        String(32), nullable=True
    )  # e.g., "4:4:8"
    best_time: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # morning, evening, anytime
    difficulty: Mapped[str] = mapped_column(String(16), default="beginner")
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class MeditationPracticeDB(SoftDeleteMixin, Base):
    """
    Indian meditation traditions and practices.

    Based on Vedic traditions, Yoga Sutras of Patanjali,
    Buddhist traditions (Indian origin), and traditional guru lineages.
    """

    __tablename__ = "meditation_practices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sanskrit_name: Mapped[str] = mapped_column(String(128), index=True)
    english_name: Mapped[str] = mapped_column(String(128), index=True)
    hindi_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tradition: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # Vedic, Buddhist, Jain, Tantric
    description: Mapped[str] = mapped_column(Text)
    instructions: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(512)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    mental_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    duration_minutes: Mapped[int] = mapped_column(Integer, default=15)
    posture: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # seated, lying, walking
    focus_point: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )  # breath, mantra, visualization
    mantra: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class AyurvedicPracticeDB(SoftDeleteMixin, Base):
    """
    Authentic Ayurvedic wellness practices.

    Based on Charaka Samhita, Ashtanga Hridayam,
    and Ministry of AYUSH guidelines.
    """

    __tablename__ = "ayurvedic_practices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sanskrit_name: Mapped[str] = mapped_column(String(128), index=True)
    english_name: Mapped[str] = mapped_column(String(128), index=True)
    hindi_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # dinacharya, ritucharya, therapy, body_care
    instructions: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(512)), nullable=True
    )
    benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    mental_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(256)), nullable=True
    )
    dosha_effects: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # {"vata": "...", "pitta": "...", "kapha": "..."}
    best_time: Mapped[str | None] = mapped_column(String(64), nullable=True)
    duration: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class IndianSourceFetchLog(Base):
    """
    Log of data fetches from Indian government and institutional sources.

    Tracks API calls, success/failure, and data freshness.
    """

    __tablename__ = "indian_source_fetch_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[IndianDataSourceType] = mapped_column(
        Enum(
            IndianDataSourceType,
            name="indiandatasourcetype",
            native_enum=True,
            create_constraint=False,
        ),
        index=True,
    )
    endpoint: Mapped[str] = mapped_column(String(512))
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    items_fetched: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fetched_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


# =============================================================================
# Enhanced Wisdom Journeys System - Ṣaḍ-Ripu (Six Inner Enemies)
# =============================================================================


class EnemyTag(str, enum.Enum):
    """The six inner enemies (Ṣaḍ-Ripu) from Bhagavad Gita philosophy."""

    KAMA = "kama"  # Desire/Lust
    KRODHA = "krodha"  # Anger
    LOBHA = "lobha"  # Greed
    MOHA = "moha"  # Delusion/Attachment
    MADA = "mada"  # Ego/Pride
    MATSARYA = "matsarya"  # Envy/Jealousy
    MIXED = "mixed"  # Combined journey
    GENERAL = "general"  # General wisdom


class UserJourneyStatus(str, enum.Enum):
    """Status of a user's journey instance."""

    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class JourneyPace(str, enum.Enum):
    """Pace preference for journey steps."""

    DAILY = "daily"
    EVERY_OTHER_DAY = "every_other_day"
    WEEKLY = "weekly"


class JourneyTone(str, enum.Enum):
    """Tone preference for KIAAN responses."""

    GENTLE = "gentle"
    DIRECT = "direct"
    INSPIRING = "inspiring"


class JourneyTemplate(SoftDeleteMixin, Base):
    """
    Admin-defined journey blueprints for the six inner enemies (Ṣaḍ-Ripu).

    Each template defines a multi-day journey focused on overcoming
    specific inner enemies through Gita wisdom.
    """

    __tablename__ = "journey_templates"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Primary focus area (which inner enemy this journey addresses)
    primary_enemy_tags: Mapped[list] = mapped_column(
        JSON, default=list
    )  # ["krodha", "moha"]

    # Journey configuration
    duration_days: Mapped[int] = mapped_column(Integer, default=14)
    difficulty: Mapped[int] = mapped_column(Integer, default=3)  # 1-5 scale

    # Status flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_free: Mapped[bool] = mapped_column(Boolean, default=False, index=True)  # Free access for all users

    # UI metadata
    icon_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    color_theme: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    steps: Mapped[list["JourneyTemplateStep"]] = relationship(
        "JourneyTemplateStep", back_populates="template", cascade="all, delete-orphan"
    )


class JourneyTemplateStep(SoftDeleteMixin, Base):
    """
    Day-by-day skeleton for journey templates.

    Contains hints for AI generation and verse selection configuration.
    """

    __tablename__ = "journey_template_steps"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    journey_template_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("journey_templates.id", ondelete="CASCADE"), index=True
    )
    day_index: Mapped[int] = mapped_column(Integer)  # 1-indexed

    # Step content hints (for AI generation)
    step_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    teaching_hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    reflection_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    practice_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Verse selection configuration
    verse_selector: Mapped[dict | None] = mapped_column(
        JSON, default=lambda: {"tags": [], "max_verses": 3, "avoid_recent": 20}
    )
    # Optional: fixed verses like [{"chapter": 2, "verse": 63}]
    static_verse_refs: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Safety notes for sensitive content
    safety_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    template: Mapped["JourneyTemplate"] = relationship(
        "JourneyTemplate", back_populates="steps"
    )

    __table_args__ = (
        UniqueConstraint("journey_template_id", "day_index", name="uq_template_step"),
    )


class UserJourney(SoftDeleteMixin, Base):
    """
    User instances of journey templates with personalization settings.

    Supports multiple active journeys per user.
    """

    __tablename__ = "user_journeys"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    journey_template_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("journey_templates.id", ondelete="SET NULL"), nullable=True
    )

    # Legacy reference for backward compatibility
    legacy_journey_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("wisdom_journeys.id", ondelete="SET NULL"), nullable=True
    )

    # Status
    status: Mapped[UserJourneyStatus] = mapped_column(
        Enum(
            UserJourneyStatus,
            native_enum=False,
            length=32,
            values_callable=lambda e: [x.value for x in e],
        ),
        default=UserJourneyStatus.ACTIVE,
        index=True,
    )

    # Progress tracking
    current_day_index: Mapped[int] = mapped_column(Integer, default=1)
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    paused_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Personalization settings
    personalization: Mapped[dict | None] = mapped_column(
        JSON, default=lambda: {}
    )
    # Schema: {
    #   "pace": "daily" | "every_other_day" | "weekly",
    #   "time_budget_minutes": 10,
    #   "focus_tags": ["krodha", "moha"],
    #   "preferred_tone": "gentle" | "direct" | "inspiring",
    #   "provider_preference": "auto" | "openai" | "sarvam" | "oai_compat"
    # }

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    template: Mapped["JourneyTemplate | None"] = relationship("JourneyTemplate")
    step_states: Mapped[list["UserJourneyStepState"]] = relationship(
        "UserJourneyStepState", back_populates="user_journey", cascade="all, delete-orphan"
    )

    @validates("status")
    def _normalize_status(self, _key: str, value: UserJourneyStatus | str) -> str:
        if isinstance(value, UserJourneyStatus):
            return value.value
        if isinstance(value, str):
            return value.lower()
        return value


class UserJourneyStepState(SoftDeleteMixin, Base):
    """
    AI-generated step content and user progress for each day.

    Stores KIAAN-generated content, verse refs, and user check-ins.
    Includes soft delete support for data recovery.
    """

    __tablename__ = "user_journey_step_state"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_journey_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("user_journeys.id", ondelete="CASCADE"), index=True
    )
    day_index: Mapped[int] = mapped_column(Integer)

    # Delivery tracking
    delivered_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Verse references (from corpus, not full text)
    verse_refs: Mapped[list] = mapped_column(JSON, default=list)
    # Schema: [{"chapter": 2, "verse": 47}, {"chapter": 2, "verse": 48}]

    # AI-generated step content (strict JSON from KIAAN)
    kiaan_step_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Schema: {
    #   "step_title": "...",
    #   "today_focus": "kama|krodha|...",
    #   "verse_refs": [...],
    #   "teaching": "...",
    #   "guided_reflection": ["...", "...", "..."],
    #   "practice": {"name": "...", "instructions": [...], "duration_minutes": 5},
    #   "micro_commitment": "...",
    #   "check_in_prompt": {"scale": "0-10", "label": "..."},
    #   "safety_note": "..." (optional)
    # }

    # User reflection storage
    # DEPRECATED: reflection_reference is no longer used - use reflection_encrypted instead
    # Kept for backward compatibility; will be removed in future migration
    reflection_reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Encrypted reflection content (primary storage for user reflections)
    reflection_encrypted: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Check-in data
    check_in: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Schema: {"intensity": 7, "label": "...", "timestamp": "..."}

    # Provider tracking
    provider_used: Mapped[str | None] = mapped_column(String(64), nullable=True)
    model_used: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Additional step metadata (named step_metadata to avoid SQLAlchemy conflict)
    step_metadata: Mapped[dict | None] = mapped_column(JSON, default=lambda: {})

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    user_journey: Mapped["UserJourney"] = relationship(
        "UserJourney", back_populates="step_states"
    )

    __table_args__ = (
        UniqueConstraint("user_journey_id", "day_index", name="uq_journey_step_state"),
    )


class AIProviderConfig(Base):
    """
    Configuration for multi-provider LLM support.

    Tracks health status, rate limits, and priority for fallback.
    """

    __tablename__ = "ai_provider_configs"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    provider_name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(128))

    # Configuration
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[int] = mapped_column(Integer, default=100)

    # Health status
    last_health_check: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    health_status: Mapped[str | None] = mapped_column(String(32), default="unknown")
    avg_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Rate limiting
    rate_limit_per_minute: Mapped[int] = mapped_column(Integer, default=60)
    rate_limit_per_hour: Mapped[int] = mapped_column(Integer, default=1000)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


class KiaanChatMessage(SoftDeleteMixin, Base):
    """
    Persistent storage for KIAAN chat conversations.

    Stores both user messages and KIAAN responses with metadata
    for conversation history, analytics, and learning.
    """

    __tablename__ = "kiaan_chat_messages"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True
    )
    session_id: Mapped[str] = mapped_column(String(64), index=True)

    # Message content
    user_message: Mapped[str] = mapped_column(Text)
    kiaan_response: Mapped[str] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Context and metadata
    context: Mapped[str | None] = mapped_column(String(64), nullable=True)
    detected_emotion: Mapped[str | None] = mapped_column(String(32), nullable=True)
    mood_at_time: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Gita wisdom integration
    verses_used: Mapped[list | None] = mapped_column(JSON, nullable=True)
    validation_score: Mapped[float | None] = mapped_column(Numeric(4, 3), nullable=True)
    gita_terms_found: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Language and translation
    language: Mapped[str] = mapped_column(String(8), default="en")
    translation: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Model information
    model_used: Mapped[str | None] = mapped_column(String(64), nullable=True)
    provider_used: Mapped[str | None] = mapped_column(String(32), nullable=True)
    was_cached: Mapped[bool] = mapped_column(Boolean, default=False)
    was_streaming: Mapped[bool] = mapped_column(Boolean, default=False)

    # Performance metrics
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # User feedback
    user_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    was_helpful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    saved_to_journal: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )


class KiaanChatSession(Base):
    """
    Tracks KIAAN chat sessions for conversation continuity.

    Groups messages into sessions for context and analytics.
    """

    __tablename__ = "kiaan_chat_sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True
    )

    # Session metadata
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    ended_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    message_count: Mapped[int] = mapped_column(Integer, default=0)

    # Context
    initial_mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    initial_context: Mapped[str | None] = mapped_column(String(64), nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="en")

    # Session summary (generated on close)
    session_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    dominant_emotion: Mapped[str | None] = mapped_column(String(32), nullable=True)
    verses_explored: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Analytics
    avg_response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    was_helpful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)


# =============================================================================
# Personal Journeys - Simple CRUD Feature
# =============================================================================


class PersonalJourneyStatus(str, enum.Enum):
    """Status of a personal journey."""

    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class PersonalJourney(SoftDeleteMixin, Base):
    """
    User's personal journey for tracking goals and progress.

    A simple CRUD entity that users can create, update, and manage.
    """

    __tablename__ = "personal_journeys"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    owner_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Core fields
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[PersonalJourneyStatus] = mapped_column(
        Enum(PersonalJourneyStatus, native_enum=False, length=32),
        default=PersonalJourneyStatus.DRAFT,
        index=True,
    )

    # Optional fields
    cover_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    __table_args__ = (
        # Index for efficient list queries by owner
        {"extend_existing": True},
    )
