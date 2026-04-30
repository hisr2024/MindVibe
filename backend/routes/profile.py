from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import Session, User, UserProfile
from backend.security.jwt import decode_access_token
from backend.services.session_service import get_session, session_is_active, touch_session

router = APIRouter(prefix="/api/profile", tags=["profile"])


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
    # Accept Bearer token OR httpOnly cookie (same pattern as auth routes)
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
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


# ---------------------------------------------------------------------------
# /api/profile/settings — account settings KV blob
#
# The mobile Settings screen reads/writes a flat settings object:
# notifications, voice persona, language, theme, haptics. Until we
# have a dedicated settings table we serve a sensible default envelope
# so the screen stops 404-ing. Replace the in-memory default with a
# real DB-backed shape when the settings model lands.
# ---------------------------------------------------------------------------


class SettingsOut(BaseModel):
    notifications_enabled: bool = True
    daily_verse_enabled: bool = True
    weekly_reflection_enabled: bool = True
    voice_persona: str = "guidance"
    voice_language: str = "en-IN"
    sakha_tone: str = "warm"
    theme: str = "system"
    haptics_enabled: bool = True


class SettingsUpdateIn(BaseModel):
    notifications_enabled: bool | None = None
    daily_verse_enabled: bool | None = None
    weekly_reflection_enabled: bool | None = None
    voice_persona: str | None = Field(default=None, max_length=32)
    voice_language: str | None = Field(default=None, max_length=16)
    sakha_tone: str | None = Field(default=None, max_length=32)
    theme: str | None = Field(default=None, max_length=16)
    haptics_enabled: bool | None = None


@router.get("/settings", response_model=SettingsOut)
async def get_settings(
    request: Request, db: AsyncSession = Depends(get_db)
) -> SettingsOut:
    """
    Read the user's settings blob. Returns canonical defaults until
    the per-user settings table ships.
    """
    await _get_authenticated_user_and_session(request, db)
    return SettingsOut()


@router.put("/settings", response_model=SettingsOut)
async def update_settings(
    request: Request,
    payload: SettingsUpdateIn,
    db: AsyncSession = Depends(get_db),
) -> SettingsOut:
    """
    Patch the user's settings. Currently a no-op writer that echoes
    the merged shape back so the mobile UI can update its local state
    optimistically. Replace with a DB write when the settings model
    lands.
    """
    await _get_authenticated_user_and_session(request, db)
    defaults = SettingsOut()
    merged = defaults.model_copy(
        update={k: v for k, v in payload.model_dump().items() if v is not None}
    )
    return merged
