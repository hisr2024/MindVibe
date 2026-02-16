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
    """Subscription tier levels."""

    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"
    PREMIER = "premier"


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
