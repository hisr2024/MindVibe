from fastapi import APIRouter, Depends
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.models import Mood
from backend.schemas import MoodIn, MoodOut
from backend.security.encryption import get_field_encryptor

router = APIRouter(prefix="/moods", tags=["moods"])


@router.post("", response_model=MoodOut)
async def create_mood(
    payload: MoodIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> dict:
    encryptor = get_field_encryptor()
    encrypted_tags = (
        {"ciphertext": encryptor.encrypt_json(payload.tags)} if payload.tags else None
    )
    encrypted_note = encryptor.encrypt_text(payload.note)
    res = await db.execute(
        insert(Mood)
        .values(
            user_id=user_id,
            score=payload.score,
            tags=encrypted_tags,
            note=encrypted_note,
        )
        .returning(Mood.id, Mood.score, Mood.tags, Mood.note, Mood.at)
    )
    row = res.first()
    await db.commit()
    if not row:
        raise Exception("Failed to create mood")
    return {
        "id": row.id,
        "score": row.score,
        "tags": encryptor.decrypt_json((row.tags or {}).get("ciphertext")),
        "note": encryptor.decrypt_text(row.note),
        "at": row.at.isoformat(),
    }
