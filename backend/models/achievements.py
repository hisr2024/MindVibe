"""Achievement and gamification models."""

from __future__ import annotations

import datetime
import enum

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


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
