from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.deps import get_db, get_current_user
from backend.models import Mood
from backend.schemas import MoodIn, MoodOut

router = APIRouter(prefix="/moods", tags=["moods"])


# KIAAN empathetic micro-responses based on mood score
MOOD_MICRO_RESPONSES = {
    "excellent": "That's wonderful! I'm so glad you're feeling this way. 💙",
    "good": "That's wonderful! I'm so glad you're feeling this way. 💙",
    "neutral": "I'm here with you. Sometimes neutral is where we need to be. 💙",
    "low": "I see you, and I'm here. You're not alone in this. 💙",
    "very_low": "I see you, and I'm here. You're not alone in this. 💙",
}


def get_mood_category(score: int) -> str:
    """Get mood category from score (1-10 scale)."""
    if score >= 8:
        return "excellent"
    elif score >= 6:
        return "good"
    elif score >= 4:
        return "neutral"
    elif score >= 2:
        return "low"
    return "very_low"


def get_micro_response(score: int) -> str:
    """Get KIAAN's empathetic micro-response for a mood score."""
    category = get_mood_category(score)
    return MOOD_MICRO_RESPONSES.get(category, MOOD_MICRO_RESPONSES["neutral"])


@router.post("", response_model=MoodOut)
async def create_mood(
    payload: MoodIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> dict:
    """Create a new mood entry for the authenticated user."""
    try:
        res = await db.execute(
            insert(Mood)
            .values(
                user_id=user_id,
                score=payload.score,
                tags={"tags": payload.tags} if payload.tags else None,
                note=payload.note,
            )
            .returning(Mood.id, Mood.score, Mood.tags, Mood.note, Mood.at)
        )
        row = res.first()
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create mood entry. Please try again.",
        )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create mood entry. No data returned.",
        )

    # Include KIAAN micro-response in response
    micro_response = get_micro_response(row.score)

    return {
        "id": row.id,
        "score": row.score,
        "tags": (row.tags or {}).get("tags"),
        "note": row.note,
        "at": row.at.isoformat(),
        "kiaan_response": micro_response,
    }


@router.get("/micro-response")
async def get_mood_micro_response(
    score: int = Query(..., ge=1, le=10, description="Mood score on a 1-10 scale")
) -> dict:
    """Get KIAAN's empathetic micro-response for a mood score.

    Args:
        score: Mood score on a 1-10 scale (validated).

    Returns:
        dict: Contains the micro-response message.
    """
    return {
        "score": score,
        "category": get_mood_category(score),
        "response": get_micro_response(score),
    }
