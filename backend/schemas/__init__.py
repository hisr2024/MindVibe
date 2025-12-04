"""Pydantic schemas for the MindVibe application."""

from typing import Annotated

from pydantic import BaseModel, Field, field_validator

from backend.schemas.subscription import (
    CheckoutSessionCreate,
    CheckoutSessionOut,
    SubscriptionPlanCreate,
    SubscriptionPlanOut,
    UsageStatsOut,
    UserSubscriptionOut,
    WebhookEvent,
)
from backend.schemas.karmic_tree import (
    ActivityCounts,
    AchievementProgress,
    UnlockableOut,
    ProgressResponse,
    UnlockRequest,
    TreeNotification,
)


class MoodIn(BaseModel):
    score: Annotated[int, Field(ge=-2, le=2)]
    tags: list[str] | None = None
    note: str | None = None


class UserAuth(BaseModel):
    username: Annotated[str, Field(max_length=150)]
    password: Annotated[str, Field(min_length=8)]

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one digit.")
        if not any(char.isalpha() for char in value):
            raise ValueError("Password must contain at least one letter.")
        return value


class JournalEntry(BaseModel):
    title: Annotated[str, Field(max_length=200)]
    content: str
    created_at: str


class ContentPack(BaseModel):
    name: Annotated[str, Field(max_length=100)]
    entries: list[JournalEntry]


class WisdomVerse(BaseModel):
    reference: Annotated[str, Field(max_length=100)]
    text: str
    theme: Annotated[str, Field(max_length=50)]


class BlobIn(BaseModel):
    blob_json: str


class BlobOut(BaseModel):
    id: int
    created_at: str
    blob_json: str


class MoodOut(BaseModel):
    id: int
    score: int
    tags: list[str] | None
    note: str | None
    at: str
    kiaan_response: str | None = None


__all__ = [
    "SubscriptionPlanOut",
    "SubscriptionPlanCreate",
    "UserSubscriptionOut",
    "UsageStatsOut",
    "CheckoutSessionCreate",
    "CheckoutSessionOut",
    "WebhookEvent",
    "ActivityCounts",
    "AchievementProgress",
    "UnlockableOut",
    "ProgressResponse",
    "UnlockRequest",
    "TreeNotification",
]
