from fastapi import Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from backend.models import User
from backend.main import SessionLocal


async def get_db():
    async with SessionLocal() as s:
        yield s


async def get_user_id(
    x_auth_uid: str | None = Header(default=None), db: AsyncSession = Depends(get_db)
) -> int:
    if not x_auth_uid:
        x_auth_uid = "dev-anon"
    res = await db.execute(select(User).where(User.auth_uid == x_auth_uid))
    row = res.scalar_one_or_none()
    if row:
        return row.id
    ins = await db.execute(
        insert(User).values(auth_uid=x_auth_uid, locale="en").returning(User.id)
    )
    await db.commit()
    return ins.scalar_one()
