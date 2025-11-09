from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import ContentPack

router = APIRouter(prefix="/content", tags=["content"])


@router.get("/{locale}")
async def get_pack(locale: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    res = await db.execute(select(ContentPack).where(ContentPack.locale == locale))
    row = res.scalar_one_or_none()
    if row:
        return dict(row.data) if row.data else {}
    res2 = await db.execute(select(ContentPack).where(ContentPack.locale == "en"))
    row2 = res2.scalar_one_or_none()
    return dict(row2.data) if row2 and row2.data else {"packs": []}
