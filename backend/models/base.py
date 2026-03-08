"""
Base model infrastructure for MindVibe backend.

Contains the SQLAlchemy declarative base, soft delete mixin, and
common enums shared across multiple domain model files.
"""

from __future__ import annotations

import datetime
import enum

from sqlalchemy import TIMESTAMP
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class SubscriptionTier(str, enum.Enum):
    """Subscription tier levels.

    Three-tier structure (March 2026 consolidation):
    - FREE (Seeker): Entry-level with 5 KIAAN questions/month
    - SADHAK: Mid-tier ($12.99/mo) with 300 questions and all features
    - SIDDHA: Premium ($22.99/mo) with unlimited questions and dedicated support
    """

    FREE = "free"
    SADHAK = "sadhak"
    SIDDHA = "siddha"


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
