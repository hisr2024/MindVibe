from fastapi import APIRouter, Depends
from sqlalchemy import desc, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.models import EncryptedBlob
from backend.schemas import BlobIn, BlobOut
from backend.security.encryption import get_field_encryptor

router = APIRouter(prefix="/journal", tags=["journal"])


@router.post("/blob", response_model=BlobOut)
async def upload_blob(
    payload: BlobIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> dict:
    encryptor = get_field_encryptor()
    encrypted_payload = encryptor.encrypt_json(payload.blob_json)
    res = await db.execute(
        insert(EncryptedBlob)
        .values(user_id=user_id, blob_json=encrypted_payload)
        .returning(EncryptedBlob.id, EncryptedBlob.created_at, EncryptedBlob.blob_json)
    )
    row = res.first()
    await db.commit()
    if not row:
        raise Exception("Failed to create blob")
    return {
        "id": row.id,
        "created_at": row.created_at.isoformat(),
        "blob_json": payload.blob_json,
    }


@router.get("/blob/latest", response_model=BlobOut | dict)
async def latest_blob(
    db: AsyncSession = Depends(get_db), user_id: str = Depends(get_user_id)
) -> dict:
    res = await db.execute(
        select(EncryptedBlob)
        .where(EncryptedBlob.user_id == user_id)
        .order_by(desc(EncryptedBlob.created_at))
        .limit(1)
    )
    row = res.scalar_one_or_none()
    if not row:
        return {}
    encryptor = get_field_encryptor()
    decrypted_blob = encryptor.decrypt_json(row.blob_json)
    return {
        "id": row.id,
        "created_at": row.created_at.isoformat(),
        "blob_json": decrypted_blob or "",
    }
