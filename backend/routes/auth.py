from datetime import UTC, datetime

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.deps import get_db
from backend.middleware.rate_limiter import limiter, AUTH_RATE_LIMIT
from backend.models import Session, User
from backend.security.jwt import create_access_token, decode_access_token
from backend.security.password_hash import hash_password, verify_password
from backend.security.password_policy import policy
from backend.services.refresh_service import (
    create_refresh_token,
    get_refresh_token_by_raw,
    handle_reuse_attack,
    is_expired,
    mark_revoked,
    revoke_all_for_session,
    rotate_refresh_token,
)
from backend.services.session_service import (
    create_session,
    get_session,
    revoke_session,
    session_is_active,
    touch_session,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ----------------------
# Schemas
# ----------------------
class SignupIn(BaseModel):
    email: EmailStr
    password: str


class SignupOut(BaseModel):
    user_id: int
    email: EmailStr
    policy_passed: bool


class LoginIn(BaseModel):
    email: EmailStr
    password: str
    two_factor_code: str | None = None


class LoginOut(BaseModel):
    access_token: str
    token_type: str
    session_id: str
    expires_in: int
    user_id: str
    email: EmailStr


class TwoFactorSetupOut(BaseModel):
    secret: str
    otpauth_url: str


class TwoFactorVerifyIn(BaseModel):
    code: str


class TwoFactorStatusOut(BaseModel):
    enabled: bool
    configured: bool


class MeOut(BaseModel):
    user_id: str
    email: EmailStr
    session_id: str | None
    session_active: bool
    session_expires_at: datetime | None
    session_last_used_at: datetime | None
    access_token_expires_in: int | None


class LogoutOut(BaseModel):
    revoked: bool
    session_id: str | None


class SessionItem(BaseModel):
    session_id: str
    active: bool
    created_at: datetime
    last_used_at: datetime | None
    expires_at: datetime | None
    revoked_at: datetime | None
    current: bool


class SessionListOut(BaseModel):
    sessions: list[SessionItem]


class RevokeSessionOut(BaseModel):
    session_id: str
    revoked: bool
    already_revoked: bool
    reason: str | None = None


# Refresh token schemas
class RefreshIn(BaseModel):
    refresh_token: str | None = None  # fallback if cookie not supplied


class RefreshOut(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    session_id: str
    refresh_token: (
        str | None
    )  # only present if REFRESH_TOKEN_ENABLE_BODY_RETURN is True


# ----------------------
# Internal helpers
# ----------------------
async def _extract_auth_context(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        ) from err
    user_id = payload.get("sub")
    session_id = payload.get("sid")
    exp = payload.get("exp")
    if not user_id or not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token structure"
        )
    return payload, user_id, session_id, exp


async def _get_user_or_401(db: AsyncSession, user_id: str) -> User:
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user


async def _get_user_and_active_session(
    request: Request, db: AsyncSession
) -> tuple[dict, User, Session, int | None]:
    payload, user_id, session_id, exp = await _extract_auth_context(request)
    user = await _get_user_or_401(db, user_id)

    session_row = await get_session(db, session_id)
    if not session_row or not session_is_active(session_row):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session inactive"
        )

    return payload, user, session_row, exp


# ----------------------
# Signup
# ----------------------
@router.post("/signup", response_model=SignupOut, status_code=201)
@limiter.limit(AUTH_RATE_LIMIT)
async def signup(request: Request, payload: SignupIn, db: AsyncSession = Depends(get_db)):
    result = policy.validate(payload.password)
    if not result.ok:
        raise HTTPException(status_code=422, detail=result.errors)

    stmt = select(User).where(User.email == payload.email.lower())
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Generate a unique auth_uid
    import secrets
    auth_uid = secrets.token_urlsafe(16)
    
    user = User(
        auth_uid=auth_uid,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return SignupOut(user_id=user.id, email=user.email, policy_passed=True)


# ----------------------
# Login (issues refresh cookie)
# ----------------------
@router.post("/login", response_model=LoginOut)
@limiter.limit(AUTH_RATE_LIMIT)
async def login(
    request: Request, payload: LoginIn, response: Response, db: AsyncSession = Depends(get_db)
):
    email_norm = payload.email.lower()
    stmt = select(User).where(User.email == email_norm)
    user = (await db.execute(stmt)).scalars().first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.two_factor_enabled:
        if not payload.two_factor_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Two-factor code required",
            )

        code = payload.two_factor_code.strip().replace(" ", "")
        if not user.two_factor_secret:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Two-factor secret missing",
            )

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(code, valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid two-factor code",
            )

    session = await create_session(db, user_id=user.id, ip=None, ua=None)
    access_token = create_access_token(user_id=user.id, session_id=session.id)
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    # Create refresh token + set cookie
    _, raw_refresh = await create_refresh_token(
        db, user_id=user.id, session_id=session.id
    )
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=settings.SECURE_COOKIE,
        samesite="strict",
        path="/api/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    return LoginOut(
        access_token=access_token,
        token_type="bearer",  # nosec B106
        session_id=str(session.id),
        expires_in=expires_in_seconds,
        user_id=user.id,
        email=user.email,
    )


# ----------------------
# Two Factor Authentication
# ----------------------
@router.get("/2fa/status", response_model=TwoFactorStatusOut)
async def two_factor_status(request: Request, db: AsyncSession = Depends(get_db)):
    _, user, session_row, _ = await _get_user_and_active_session(request, db)
    await touch_session(db, session_row)
    return TwoFactorStatusOut(
        enabled=bool(user.two_factor_enabled),
        configured=bool(user.two_factor_secret),
    )


@router.post("/2fa/setup", response_model=TwoFactorSetupOut)
async def initiate_two_factor(request: Request, db: AsyncSession = Depends(get_db)):
    _, user, session_row, _ = await _get_user_and_active_session(request, db)

    if user.two_factor_enabled:
        raise HTTPException(status_code=409, detail="Two-factor already enabled")

    secret = user.two_factor_secret or pyotp.random_base32()
    await db.execute(
        update(User).where(User.id == user.id).values(two_factor_secret=secret)
    )
    await db.commit()

    await touch_session(db, session_row)
    totp = pyotp.TOTP(secret)
    account_name = user.email or user.auth_uid
    otpauth_url = totp.provisioning_uri(name=account_name, issuer_name="MindVibe")

    return TwoFactorSetupOut(secret=secret, otpauth_url=otpauth_url)


@router.post("/2fa/verify", response_model=TwoFactorStatusOut)
async def verify_two_factor(
    payload: TwoFactorVerifyIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    _, user, session_row, _ = await _get_user_and_active_session(request, db)

    if not user.two_factor_secret:
        raise HTTPException(status_code=400, detail="Two-factor setup not initiated")

    code = payload.code.strip().replace(" ", "")
    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid two-factor code",
        )

    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(two_factor_enabled=True)
    )
    await db.commit()

    await touch_session(db, session_row)

    return TwoFactorStatusOut(enabled=True, configured=True)


# ----------------------
# Me
# ----------------------
@router.get("/me", response_model=MeOut)
async def me(request: Request, db: AsyncSession = Depends(get_db)):
    payload, user, session_row, exp = await _get_user_and_active_session(
        request, db
    )

    await touch_session(db, session_row)

    access_token_expires_in = None
    if exp:
        try:
            now_ts = datetime.now(UTC).timestamp()
            access_token_expires_in = max(0, int(exp - now_ts))
        except Exception:
            access_token_expires_in = None

    return MeOut(
        user_id=user.id,
        email=user.email,
        session_id=str(session_row.id),
        session_active=True,
        session_expires_at=session_row.expires_at,
        session_last_used_at=session_row.last_used_at,
        access_token_expires_in=access_token_expires_in,
    )


# ----------------------
# Logout (revokes session & refresh tokens)
# ----------------------
@router.post("/logout", response_model=LogoutOut)
async def logout(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except Exception:
        response.delete_cookie("refresh_token", path="/api/auth")
        return LogoutOut(revoked=False, session_id=None)

    session_id = payload.get("sid")
    if not session_id:
        response.delete_cookie("refresh_token", path="/api/auth")
        return LogoutOut(revoked=False, session_id=None)

    session_row = await get_session(db, session_id)
    if not session_row:
        response.delete_cookie("refresh_token", path="/api/auth")
        return LogoutOut(revoked=False, session_id=session_id)

    if session_row.revoked_at is None:
        await revoke_session(db, session_row)
        await revoke_all_for_session(db, session_id)
        response.delete_cookie("refresh_token", path="/api/auth")
        return LogoutOut(revoked=True, session_id=session_id)

    response.delete_cookie("refresh_token", path="/api/auth")
    return LogoutOut(revoked=False, session_id=session_id)


# ----------------------
# List Sessions
# ----------------------
@router.get("/sessions", response_model=SessionListOut)
async def list_sessions(request: Request, db: AsyncSession = Depends(get_db)):
    _, user_id, current_session_id, _ = await _extract_auth_context(request)
    stmt = (
        select(Session)
        .where(Session.user_id == user_id)
        .order_by(Session.created_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()

    items: list[SessionItem] = []
    for s in rows:
        active = session_is_active(s)
        items.append(
            SessionItem(
                session_id=str(s.id),
                active=active,
                created_at=s.created_at,
                last_used_at=s.last_used_at,
                expires_at=s.expires_at,
                revoked_at=s.revoked_at,
                current=str(s.id) == str(current_session_id),
            )
        )
    return SessionListOut(sessions=items)


# ----------------------
# Revoke Specific Session
# ----------------------
@router.post("/sessions/{session_id}/revoke", response_model=RevokeSessionOut)
async def revoke_specific_session(
    session_id: str, request: Request, db: AsyncSession = Depends(get_db)
):
    _, user_id, _, _ = await _extract_auth_context(request)
    stmt = select(Session).where(Session.id == session_id, Session.user_id == user_id)
    target = (await db.execute(stmt)).scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="Session not found")

    if target.revoked_at is not None:
        return RevokeSessionOut(
            session_id=session_id,
            revoked=False,
            already_revoked=True,
            reason="already_revoked",
        )

    now = datetime.now(UTC)
    await db.execute(
        update(Session).where(Session.id == session_id).values(revoked_at=now)
    )
    await db.commit()

    return RevokeSessionOut(
        session_id=session_id,
        revoked=True,
        already_revoked=False,
        reason=None,
    )


# ----------------------
# Refresh (rotate refresh token & issue new access token)
# ----------------------
@router.post("/refresh", response_model=RefreshOut)
async def refresh_tokens(
    payload: RefreshIn,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    raw_refresh = request.cookies.get("refresh_token") or payload.refresh_token
    if not raw_refresh:
        raise HTTPException(status_code=400, detail="Missing refresh token")

    token_row = await get_refresh_token_by_raw(db, raw_refresh)
    if not token_row:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Reuse detection
    if token_row.rotated_at is not None or token_row.revoked_at is not None:
        await handle_reuse_attack(db, token_row)
        raise HTTPException(status_code=401, detail="Refresh token reuse detected")

    if is_expired(token_row):
        await mark_revoked(db, token_row)
        raise HTTPException(status_code=401, detail="Refresh token expired")

    session_row = await get_session(db, token_row.session_id)
    if not session_row or not session_is_active(session_row):
        await mark_revoked(db, token_row)
        raise HTTPException(status_code=401, detail="Session inactive")

    # Rotate
    new_rt, new_raw = await rotate_refresh_token(db, token_row)

    # New access token
    access_token = create_access_token(
        user_id=token_row.user_id, session_id=token_row.session_id
    )
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    response.set_cookie(
        key="refresh_token",
        value=new_raw,
        httponly=True,
        secure=settings.SECURE_COOKIE,
        samesite="strict",
        path="/api/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    return RefreshOut(
        access_token=access_token,
        token_type="bearer",  # nosec B106
        expires_in=expires_in_seconds,
        session_id=str(session_row.id),
        refresh_token=new_raw if settings.REFRESH_TOKEN_ENABLE_BODY_RETURN else None,
    )
