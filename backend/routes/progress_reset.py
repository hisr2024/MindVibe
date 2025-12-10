"""
User Progress Reset Endpoint with Comprehensive Error Handling.

Provides functionality to reset user karma/achievement/progress data
while preserving KIAAN ecosystem integrity (chat history, journals, moods).
"""

from __future__ import annotations

import datetime
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.models import (
    UserAchievement,
    UserProgress,
    UserUnlockable,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/progress", tags=["progress-reset"])


class ResetProgressRequest(BaseModel):
    """Request model for progress reset."""
    confirm: bool
    reason: str | None = None


class ResetProgressResponse(BaseModel):
    """Response model for progress reset."""
    success: bool
    message: str
    details: dict[str, Any]
    timestamp: str


class ProgressResetError(Exception):
    """Custom exception for progress reset errors."""
    pass


@router.post("/reset", response_model=ResetProgressResponse)
async def reset_user_progress(
    request: ResetProgressRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> ResetProgressResponse:
    """
    Reset user's Karmic Tree progress while preserving KIAAN ecosystem data.
    
    This endpoint resets:
    - UserProgress (XP, level, activity counts)
    - UserAchievement (progress and unlock status)
    - UserUnlockable (unlock status)
    
    This endpoint PRESERVES:
    - User account
    - Chat history (ChatMessage, ChatRoom, etc.)
    - Journal entries (JournalEntry, EncryptedBlob)
    - Mood logs (Mood)
    - User preferences and settings
    
    All operations are performed in a transaction with automatic rollback on error.
    
    Args:
        request: Reset confirmation and optional reason
        db: Database session
        user_id: Current user ID from auth
        
    Returns:
        ResetProgressResponse with success status and details
        
    Raises:
        HTTPException: If reset fails or user doesn't confirm
    """
    request_id = datetime.datetime.now(datetime.UTC).strftime("%Y%m%d%H%M%S")
    logger.info(
        f"[{request_id}] Progress reset requested by user {user_id}",
        extra={"user_id": user_id, "reason": request.reason},
    )

    # Require explicit confirmation
    if not request.confirm:
        logger.warning(f"[{request_id}] Reset denied - confirmation not provided")
        raise HTTPException(
            status_code=400,
            detail="Reset confirmation required. Set 'confirm' to true to proceed.",
        )

    # Track what was reset for response
    reset_details: dict[str, Any] = {
        "achievements_reset": 0,
        "unlockables_reset": 0,
        "progress_reset": False,
        "errors": [],
    }

    try:
        # Begin transaction (async session auto-manages transactions)
        
        # Step 1: Reset UserAchievement progress and unlock status
        logger.info(f"[{request_id}] Resetting user achievements...")
        try:
            # Count achievements before reset
            achievement_count = await db.scalar(
                select(func.count(UserAchievement.id))
                .where(UserAchievement.user_id == user_id)
            )
            reset_details["achievements_reset"] = achievement_count or 0
            
            # Reset all achievements to 0 progress and locked
            result = await db.execute(
                update(UserAchievement)
                .where(UserAchievement.user_id == user_id)
                .values(
                    progress=0,
                    unlocked=False,
                    unlocked_at=None,
                )
            )
            
            logger.info(
                f"[{request_id}] Reset {result.rowcount} user achievements"
            )
        except SQLAlchemyError as e:
            logger.error(f"[{request_id}] Error resetting achievements: {str(e)}")
            raise ProgressResetError(f"Failed to reset achievements: {str(e)}")

        # Step 2: Reset UserUnlockable status
        logger.info(f"[{request_id}] Resetting user unlockables...")
        try:
            # Count unlockables before reset
            unlockable_count = await db.scalar(
                select(func.count(UserUnlockable.id))
                .where(UserUnlockable.user_id == user_id)
            )
            reset_details["unlockables_reset"] = unlockable_count or 0
            
            # Reset all unlockables to locked
            result = await db.execute(
                update(UserUnlockable)
                .where(UserUnlockable.user_id == user_id)
                .values(
                    unlocked=False,
                    unlocked_at=None,
                )
            )
            
            logger.info(
                f"[{request_id}] Reset {result.rowcount} user unlockables"
            )
        except SQLAlchemyError as e:
            logger.error(f"[{request_id}] Error resetting unlockables: {str(e)}")
            raise ProgressResetError(f"Failed to reset unlockables: {str(e)}")

        # Step 3: Reset UserProgress
        logger.info(f"[{request_id}] Resetting user progress...")
        try:
            # Check if progress record exists
            existing_progress = await db.get(UserProgress, user_id)
            
            if existing_progress:
                # Reset existing progress
                existing_progress.total_mood_entries = 0
                existing_progress.total_journals = 0
                existing_progress.total_chat_sessions = 0
                existing_progress.xp = 0
                existing_progress.level = 1
                existing_progress.current_stage = "seedling"
                existing_progress.last_awarded_at = datetime.datetime.now(datetime.UTC)
                reset_details["progress_reset"] = True
                
                logger.info(f"[{request_id}] Reset existing user progress")
            else:
                # Create new progress record at default values
                new_progress = UserProgress(
                    user_id=user_id,
                    total_mood_entries=0,
                    total_journals=0,
                    total_chat_sessions=0,
                    xp=0,
                    level=1,
                    current_stage="seedling",
                    last_awarded_at=datetime.datetime.now(datetime.UTC),
                )
                db.add(new_progress)
                reset_details["progress_reset"] = True
                
                logger.info(f"[{request_id}] Created new user progress record")
                
        except SQLAlchemyError as e:
            logger.error(f"[{request_id}] Error resetting progress: {str(e)}")
            raise ProgressResetError(f"Failed to reset progress: {str(e)}")

        # Commit all changes
        await db.commit()
        
        logger.info(
            f"[{request_id}] Progress reset completed successfully",
            extra={
                "user_id": user_id,
                "achievements_reset": reset_details["achievements_reset"],
                "unlockables_reset": reset_details["unlockables_reset"],
            },
        )

        return ResetProgressResponse(
            success=True,
            message="Your Karmic Tree progress has been reset. Chat history, journals, and moods are preserved.",
            details=reset_details,
            timestamp=datetime.datetime.now(datetime.UTC).isoformat(),
        )

    except ProgressResetError as e:
        # Rollback on our custom error
        await db.rollback()
        logger.error(
            f"[{request_id}] Progress reset failed: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Progress reset failed: {str(e)}",
        )
        
    except SQLAlchemyError as e:
        # Rollback on database error
        await db.rollback()
        logger.error(
            f"[{request_id}] Database error during progress reset: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="Database error during progress reset. All changes have been rolled back.",
        )
        
    except Exception as e:
        # Rollback on unexpected error
        await db.rollback()
        logger.error(
            f"[{request_id}] Unexpected error during progress reset: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. All changes have been rolled back.",
        )


@router.get("/reset/preview", response_model=dict)
async def preview_reset(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> dict[str, Any]:
    """
    Preview what data will be reset without actually resetting it.
    
    Useful for showing users what they're about to reset before confirmation.
    
    Returns:
        Dictionary with counts of what will be reset vs preserved
    """
    try:
        # Count achievements
        achievement_count = await db.scalar(
            select(func.count(UserAchievement.id))
            .where(UserAchievement.user_id == user_id)
        )
        
        # Count unlockables
        unlockable_count = await db.scalar(
            select(func.count(UserUnlockable.id))
            .where(UserUnlockable.user_id == user_id)
        )
        
        # Get current progress
        progress = await db.get(UserProgress, user_id)
        
        return {
            "will_reset": {
                "achievements": achievement_count or 0,
                "unlockables": unlockable_count or 0,
                "xp": progress.xp if progress else 0,
                "level": progress.level if progress else 1,
                "activity_counts": {
                    "moods": progress.total_mood_entries if progress else 0,
                    "journals": progress.total_journals if progress else 0,
                    "chats": progress.total_chat_sessions if progress else 0,
                } if progress else {},
            },
            "will_preserve": {
                "user_account": True,
                "chat_history": True,
                "journal_entries": True,
                "mood_logs": True,
                "user_preferences": True,
            },
            "warning": "This action cannot be undone. Your actual data (journals, moods, chats) will be preserved.",
        }
        
    except SQLAlchemyError as e:
        logger.error(f"Error previewing reset for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to preview reset data",
        )
    except Exception as e:
        logger.error(f"Unexpected error previewing reset: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred",
        )
