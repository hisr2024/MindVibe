from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ActivityCounts(BaseModel):
    moods: int = Field(default=0, description="Total mood check-ins")
    journals: int = Field(default=0, description="Total journal entries")
    chats: int = Field(default=0, description="Total guided chats")
    streak: int = Field(default=0, description="Current streak in days")


class AchievementProgress(BaseModel):
    key: str
    name: str
    description: str
    rarity: str
    badge_icon: str | None = None
    target_value: int
    progress: int
    unlocked: bool
    unlocked_at: datetime | None = None
    reward_hint: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UnlockableOut(BaseModel):
    key: str
    name: str
    description: str
    kind: str
    rarity: str
    unlocked: bool
    unlocked_at: datetime | None = None
    reward_data: dict | None = None

    model_config = ConfigDict(from_attributes=True)


class TreeNotification(BaseModel):
    message: str
    tone: Literal["success", "info", "warning"] = "info"


class ProgressResponse(BaseModel):
    level: int
    xp: int
    next_level_xp: int
    progress_percent: float
    tree_stage: str
    activity: ActivityCounts
    achievements: list[AchievementProgress]
    unlockables: list[UnlockableOut]
    notifications: list[TreeNotification] = []


class UnlockRequest(BaseModel):
    unlockable_key: str
    source: str | None = None
