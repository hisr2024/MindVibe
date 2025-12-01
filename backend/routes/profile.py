from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import Session, User, UserProfile
from backend.security.jwt import decode_access_token
from backend.services.session_service import get_session, session_is_active, touch_session

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileCreateUpdateIn(BaseModel):
    full_name: str | None = Field(default=None, max_length=256)
    base_experience: str = Field(min_length=1)


class ProfileOut(BaseModel):
    profile_id: int
    user_id: str
    full_name: str | None
    base_experience: str
    created_at: datetime
    updated_at: datetime | None


async def _get_authenticated_user_and_session(
    request: Request, db: AsyncSession
) -> tuple[User, Session, int | None]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except Exception as exc:  # pragma: no cover - explicit error path
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    user_id = payload.get("sub")
    session_id = payload.get("sid")
    exp = payload.get("exp")
    if not user_id or not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token structure"
        )

    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    session_row = await get_session(db, session_id)
    if not session_row or not session_is_active(session_row):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session inactive"
        )

    await touch_session(db, session_row)
    return user, session_row, exp


@router.post("", response_model=ProfileOut, status_code=201)
async def create_or_update_profile(
    payload: ProfileCreateUpdateIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user, session_row, _ = await _get_authenticated_user_and_session(request, db)

    stmt = select(UserProfile).where(UserProfile.user_id == user.id)
    profile = (await db.execute(stmt)).scalars().first()

    now = datetime.now(UTC)
    if profile:
        profile.full_name = payload.full_name
        profile.base_experience = payload.base_experience
        profile.updated_at = now
    else:
        profile = UserProfile(
            user_id=user.id,
            full_name=payload.full_name,
            base_experience=payload.base_experience,
            created_at=now,
            updated_at=None,
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    await touch_session(db, session_row)

    return ProfileOut(
        profile_id=profile.id,
        user_id=profile.user_id,
        full_name=profile.full_name,
        base_experience=profile.base_experience,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("", response_model=ProfileOut)
async def get_profile(request: Request, db: AsyncSession = Depends(get_db)):
    user, session_row, _ = await _get_authenticated_user_and_session(request, db)

    stmt = select(UserProfile).where(UserProfile.user_id == user.id)
    profile = (await db.execute(stmt)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    await touch_session(db, session_row)

    return ProfileOut(
        profile_id=profile.id,
        user_id=profile.user_id,
        full_name=profile.full_name,
        base_experience=profile.base_experience,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
