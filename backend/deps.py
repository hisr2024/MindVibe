from collections.abc import AsyncIterator

from fastapi import Depends, Header
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.main import SessionLocal
from backend.models import User


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as s:
        yield s


async def get_user_id(
    x_auth_uid: str | None = Header(default=None), db: AsyncSession = Depends(get_db)
) -> str:
    if not x_auth_uid:
        x_auth_uid = "dev-anon"
    res = await db.execute(select(User).where(User.auth_uid == x_auth_uid))
    row = res.scalar_one_or_none()
    if row:
        return str(row.id)
    ins = await db.execute(
        insert(User).values(auth_uid=x_auth_uid, locale="en").returning(User.id)
    )
    await db.commit()
    user_id = ins.scalar_one()
    return str(user_id)
