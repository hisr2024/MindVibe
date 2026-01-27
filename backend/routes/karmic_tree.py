from __future__ import annotations

import datetime
import logging
from typing import Iterable

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user_flexible

logger = logging.getLogger(__name__)
from backend.models import (
    Achievement,
    AchievementCategory,
    AchievementRarity,
    ChatMessage,
    EncryptedBlob,
    Mood,
    Unlockable,
    UnlockableType,
    UserAchievement,
    UserProgress,
    UserUnlockable,
)
from backend.schemas import (
    AchievementProgress,
    ActivityCounts,
    ProgressResponse,
    TreeNotification,
    UnlockRequest,
    UnlockableOut,
)

router = APIRouter(prefix="/karmic-tree", tags=["karmic-tree"])

DEFAULT_ACHIEVEMENTS: list[dict] = [
    {
        "key": "first_journal",
        "name": "Reflection Seed",
        "description": "Write your first private journal entry to plant your tree.",
        "category": AchievementCategory.JOURNAL,
        "target_value": 1,
        "rarity": AchievementRarity.COMMON,
        "badge_icon": "📝",
        "reward_hint": "Unlocks the Dawnlight badge",
    },
    {
        "key": "journal_10",
        "name": "Roots of Reflection",
        "description": "Complete 10 journal entries to deepen your roots.",
        "category": AchievementCategory.JOURNAL,
        "target_value": 10,
        "rarity": AchievementRarity.RARE,
        "badge_icon": "🌱",
        "reward_hint": "Unlocks the Amber Grove theme",
    },
    {
        "key": "mood_week",
        "name": "Mood Streak",
        "description": "Log your mood seven days in a row.",
        "category": AchievementCategory.STREAK,
        "target_value": 7,
        "rarity": AchievementRarity.RARE,
        "badge_icon": "🔥",
        "reward_hint": "Earn the streak flame badge",
    },
    {
        "key": "chat_explorer",
        "name": "KIAAN Explorer",
        "description": "Complete 10 guided chats with KIAAN.",
        "category": AchievementCategory.CHAT,
        "target_value": 10,
        "rarity": AchievementRarity.COMMON,
        "badge_icon": "💬",
        "reward_hint": "Unlocks a prompt booster",
    },
    {
        "key": "mood_checkins",
        "name": "Feelings Cartographer",
        "description": "Log 25 moods to map your feelings.",
        "category": AchievementCategory.MOOD,
        "target_value": 25,
        "rarity": AchievementRarity.EPIC,
        "badge_icon": "📍",
        "reward_hint": "Unlocks the Aurora canopy",
    },
]

DEFAULT_UNLOCKABLES: list[dict] = [
    {
        "key": "dawnlight_badge",
        "name": "Dawnlight Badge",
        "description": "A soft sunrise badge for your first reflection.",
        "kind": UnlockableType.BADGE,
        "rarity": AchievementRarity.COMMON,
        "required_key": "first_journal",
        "reward_data": {"color": "#f97316"},
    },
    {
        "key": "amber_grove_theme",
        "name": "Amber Grove Theme",
        "description": "A warm theme inspired by mindful journaling.",
        "kind": UnlockableType.THEME,
        "rarity": AchievementRarity.RARE,
        "required_key": "journal_10",
        "reward_data": {"gradient": "from-orange-400 via-amber-300 to-amber-500"},
    },
    {
        "key": "streak_flame",
        "name": "Streak Flame",
        "description": "Celebrate your seven day streak with a glowing leaf.",
        "kind": UnlockableType.BADGE,
        "rarity": AchievementRarity.RARE,
        "required_key": "mood_week",
        "reward_data": {"accent": "#fb923c"},
    },
]


def _stage_from_level(level: int) -> str:
    if level >= 10:
        return "canopy"
    if level >= 6:
        return "branching"
    if level >= 3:
        return "sapling"
    return "seedling"


def _xp_from_activity(counts: ActivityCounts) -> int:
    return int(
        (counts.moods * 5)
        + (counts.journals * 12)
        + (counts.chats * 7)
        + (counts.streak * 8)
    )


def _progress_value_for_category(category: AchievementCategory, counts: ActivityCounts) -> int:
    match category:
        case AchievementCategory.MOOD:
            return counts.moods
        case AchievementCategory.JOURNAL:
            return counts.journals
        case AchievementCategory.CHAT:
            return counts.chats
        case AchievementCategory.STREAK:
            return counts.streak
        case _:
            return counts.moods + counts.journals


async def ensure_seed_data(db: AsyncSession) -> dict[str, Achievement]:
    """
    Ensure default achievements and unlockables are seeded in the database.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary mapping achievement keys to Achievement objects
        
    Raises:
        HTTPException: If there's an error with enum values or database operations
    """
    try:
        existing = await db.execute(
            select(Achievement).where(Achievement.deleted_at.is_(None))
        )
        achievement_map = {ach.key: ach for ach in existing.scalars().all()}

        for payload in DEFAULT_ACHIEVEMENTS:
            if payload["key"] in achievement_map:
                continue
            try:
                achievement = Achievement(**payload)
                db.add(achievement)
                achievement_map[payload["key"]] = achievement
            except (ValueError, LookupError) as e:
                logger.error(
                    f"Error creating achievement '{payload['key']}': {str(e)}. "
                    f"Category: {payload.get('category')}, Rarity: {payload.get('rarity')}"
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Achievement enum error: {str(e)}. Please check database enum definitions."
                )

        await db.flush()
        # Refresh with IDs for unlockable wiring
        refreshed = await db.execute(
            select(Achievement).where(Achievement.deleted_at.is_(None))
        )
        achievement_map = {ach.key: ach for ach in refreshed.scalars().all()}

        for unlock_payload in DEFAULT_UNLOCKABLES:
            exists = await db.scalar(
                select(Unlockable).where(
                    Unlockable.key == unlock_payload["key"],
                    Unlockable.deleted_at.is_(None)
                )
            )
            if exists:
                continue
            payload = unlock_payload.copy()
            requirement_key = payload.pop("required_key", None)
            required_achievement_id = None
            if requirement_key and requirement_key in achievement_map:
                required_achievement_id = achievement_map[requirement_key].id
            try:
                unlockable = Unlockable(
                    **payload, required_achievement_id=required_achievement_id
                )
                db.add(unlockable)
            except (ValueError, LookupError) as e:
                logger.error(
                    f"Error creating unlockable '{unlock_payload['key']}': {str(e)}. "
                    f"Kind: {payload.get('kind')}, Rarity: {payload.get('rarity')}"
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Unlockable enum error: {str(e)}. Please check database enum definitions."
                )

        await db.flush()
        return achievement_map
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error in ensure_seed_data: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Database error while seeding achievement data: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in ensure_seed_data: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error in achievement system: {str(e)}"
        )


async def get_activity_counts(db: AsyncSession, user_id: str) -> ActivityCounts:
    mood_count = await db.scalar(
        select(func.count(Mood.id)).where(Mood.user_id == user_id, Mood.deleted_at.is_(None))
    )
    journal_count = await db.scalar(
        select(func.count(EncryptedBlob.id)).where(
            EncryptedBlob.user_id == user_id, EncryptedBlob.deleted_at.is_(None)
        )
    )
    chat_count = await db.scalar(
        select(func.count(ChatMessage.id)).where(
            ChatMessage.user_id == user_id, ChatMessage.created_at.isnot(None)
        )
    )

    return ActivityCounts(
        moods=int(mood_count or 0),
        journals=int(journal_count or 0),
        chats=int(chat_count or 0),
        streak=0,
    )


async def sync_user_progress(
    db: AsyncSession, user_id: str, counts: ActivityCounts
) -> UserProgress:
    progress = await db.get(UserProgress, user_id)
    if not progress:
        progress = UserProgress(user_id=user_id)
        db.add(progress)

    progress.total_mood_entries = counts.moods
    progress.total_journals = counts.journals
    progress.total_chat_sessions = counts.chats

    progress.xp = _xp_from_activity(counts)
    progress.level = max(1, (progress.xp // 120) + 1)
    progress.current_stage = _stage_from_level(progress.level)
    progress.last_awarded_at = datetime.datetime.now(datetime.UTC)
    return progress


async def update_user_achievements(
    db: AsyncSession,
    user_id: str,
    achievements: Iterable[Achievement],
    counts: ActivityCounts,
) -> list[TreeNotification]:
    notifications: list[TreeNotification] = []
    existing = await db.execute(
        select(UserAchievement).where(
            UserAchievement.user_id == user_id,
            UserAchievement.deleted_at.is_(None)
        )
    )
    achievement_map = {ua.achievement_id: ua for ua in existing.scalars().all()}

    for achievement in achievements:
        progress_value = _progress_value_for_category(achievement.category, counts)
        user_progress = achievement_map.get(achievement.id)
        if not user_progress:
            user_progress = UserAchievement(
                user_id=user_id, achievement_id=achievement.id, progress=progress_value
            )
            db.add(user_progress)
            achievement_map[achievement.id] = user_progress
        else:
            user_progress.progress = progress_value

        if not user_progress.unlocked and progress_value >= achievement.target_value:
            user_progress.unlocked = True
            user_progress.unlocked_at = datetime.datetime.now(datetime.UTC)
            notifications.append(
                TreeNotification(
                    message=f"Unlocked {achievement.name}!",
                    tone="success",
                )
            )

    return notifications


async def sync_unlockables(
    db: AsyncSession, user_id: str, achievement_map: dict[int, UserAchievement]
) -> list[UnlockableOut]:
    unlockables = (await db.execute(
        select(Unlockable).where(Unlockable.deleted_at.is_(None))
    )).scalars().all()
    user_unlocks = await db.execute(
        select(UserUnlockable).where(
            UserUnlockable.user_id == user_id,
            UserUnlockable.deleted_at.is_(None)
        )
    )
    user_unlock_map = {u.unlockable_id: u for u in user_unlocks.scalars().all()}

    payloads: list[UnlockableOut] = []
    for unlockable in unlockables:
        unlocked = False
        unlocked_at: datetime.datetime | None = None
        required = (
            achievement_map.get(unlockable.required_achievement_id)
            if unlockable.required_achievement_id
            else None
        )
        eligible = not required or required.unlocked

        user_unlock = user_unlock_map.get(unlockable.id)
        if user_unlock:
            unlocked = user_unlock.unlocked
            unlocked_at = user_unlock.unlocked_at
        elif eligible:
            user_unlock = UserUnlockable(
                user_id=user_id,
                unlockable_id=unlockable.id,
                unlocked=True,
                unlocked_at=datetime.datetime.now(datetime.UTC),
                source="achievement",
            )
            db.add(user_unlock)
            unlocked = True
            unlocked_at = user_unlock.unlocked_at

        payloads.append(
            UnlockableOut(
                key=unlockable.key,
                name=unlockable.name,
                description=unlockable.description,
                kind=unlockable.kind.value,
                rarity=unlockable.rarity.value,
                unlocked=unlocked,
                unlocked_at=unlocked_at,
                reward_data=unlockable.reward_data,
            )
        )

    return payloads


async def _build_achievement_payload(
    achievements: list[Achievement],
    progress_map: dict[int, UserAchievement],
    counts: ActivityCounts,
) -> list[AchievementProgress]:
    payloads: list[AchievementProgress] = []
    for achievement in achievements:
        user_progress = progress_map.get(achievement.id)
        progress_value = user_progress.progress if user_progress else _progress_value_for_category(
            achievement.category, counts
        )
        payloads.append(
            AchievementProgress(
                key=achievement.key,
                name=achievement.name,
                description=achievement.description,
                rarity=achievement.rarity.value,
                badge_icon=achievement.badge_icon,
                target_value=achievement.target_value,
                progress=progress_value,
                unlocked=user_progress.unlocked if user_progress else False,
                unlocked_at=user_progress.unlocked_at if user_progress else None,
                reward_hint=achievement.reward_hint,
            )
        )
    return payloads


@router.get("/progress", response_model=ProgressResponse)
async def get_progress(
    db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_flexible)
) -> ProgressResponse:
    """
    Get user's karmic tree progress, achievements, and unlockables.
    
    Includes comprehensive error handling for enum mismatches and database errors.
    """
    try:
        achievements_map = await ensure_seed_data(db)
        counts = await get_activity_counts(db, user_id)

        progress = await sync_user_progress(db, user_id, counts)

        achievement_rows = list(achievements_map.values())
        notifications = await update_user_achievements(db, user_id, achievement_rows, counts)

        user_progress_rows = await db.execute(
            select(UserAchievement).where(
                UserAchievement.user_id == user_id,
                UserAchievement.deleted_at.is_(None)
            )
        )
        user_progress_map = {ua.achievement_id: ua for ua in user_progress_rows.scalars().all()}
        unlockables = await sync_unlockables(db, user_id, user_progress_map)

        next_level_xp = (progress.level + 1) * 120
        progress_percent = min(100.0, (progress.xp / next_level_xp) * 100)

        achievement_payloads = await _build_achievement_payload(
            achievement_rows, user_progress_map, counts
        )
        await db.commit()

        return ProgressResponse(
            level=progress.level,
            xp=progress.xp,
            next_level_xp=next_level_xp,
            progress_percent=round(progress_percent, 2),
            tree_stage=progress.current_stage or _stage_from_level(progress.level),
            activity=counts,
            achievements=achievement_payloads,
            unlockables=unlockables,
            notifications=notifications,
        )
    except HTTPException:
        await db.rollback()
        raise
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error in get_progress for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Database error while fetching progress data"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error in get_progress for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching progress"
        )


@router.get("/achievements", response_model=list[AchievementProgress])
async def list_achievements(
    db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_flexible)
) -> list[AchievementProgress]:
    """
    List all achievements and user progress.
    
    Includes comprehensive error handling for enum mismatches and database errors.
    """
    try:
        achievements_map = await ensure_seed_data(db)
        counts = await get_activity_counts(db, user_id)
        user_progress_rows = await db.execute(
            select(UserAchievement).where(
                UserAchievement.user_id == user_id,
                UserAchievement.deleted_at.is_(None)
            )
        )
        user_progress_map = {ua.achievement_id: ua for ua in user_progress_rows.scalars().all()}
        payloads = await _build_achievement_payload(
            list(achievements_map.values()), user_progress_map, counts
        )
        await db.commit()
        return payloads
    except HTTPException:
        await db.rollback()
        raise
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error in list_achievements for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Database error while fetching achievements"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error in list_achievements for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching achievements"
        )


@router.post("/unlock", response_model=UnlockableOut)
async def unlock_reward(
    request: UnlockRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> UnlockableOut:
    unlockable = await db.scalar(
        select(Unlockable).where(
            Unlockable.key == request.unlockable_key,
            Unlockable.deleted_at.is_(None)
        )
    )
    if not unlockable:
        raise HTTPException(status_code=404, detail="Unlockable not found")

    if unlockable.required_achievement_id:
        achievement_progress = await db.scalar(
            select(UserAchievement).where(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == unlockable.required_achievement_id,
                UserAchievement.deleted_at.is_(None),
            )
        )
        if not achievement_progress or not achievement_progress.unlocked:
            raise HTTPException(
                status_code=400, detail="Achievement requirement not satisfied"
            )

    user_unlock = await db.scalar(
        select(UserUnlockable).where(
            UserUnlockable.user_id == user_id,
            UserUnlockable.unlockable_id == unlockable.id,
            UserUnlockable.deleted_at.is_(None),
        )
    )
    if not user_unlock:
        user_unlock = UserUnlockable(
            user_id=user_id,
            unlockable_id=unlockable.id,
            unlocked=True,
            unlocked_at=datetime.datetime.now(datetime.UTC),
            source=request.source or "manual",
        )
        db.add(user_unlock)
    elif not user_unlock.unlocked:
        user_unlock.unlocked = True
        user_unlock.unlocked_at = datetime.datetime.now(datetime.UTC)
        user_unlock.source = request.source or user_unlock.source

    await db.commit()

    return UnlockableOut(
        key=unlockable.key,
        name=unlockable.name,
        description=unlockable.description,
        kind=unlockable.kind.value,
        rarity=unlockable.rarity.value,
        unlocked=True,
        unlocked_at=user_unlock.unlocked_at,
        reward_data=unlockable.reward_data,
    )
