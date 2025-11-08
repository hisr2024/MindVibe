from fastapi import APIRouter, Depends
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.models import Mood
from backend.schemas import MoodIn, MoodOut

router = APIRouter(prefix="/moods", tags=["moods"])


@router.post("", response_model=MoodOut)
async def create_mood(
    payload: MoodIn,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id),
):
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
    return {
        "id": row.id,
        "score": row.score,
        "tags": (row.tags or {}).get("tags"),
        "note": row.note,
        "at": row.at.isoformat(),
    }
