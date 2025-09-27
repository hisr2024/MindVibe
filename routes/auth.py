from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from models.user import User
from security.password_policy import policy
from security.password_hash import hash_password, verify_password
from security.jwt import create_access_token, decode_access_token
from services.session_service import (
    create_session,
    get_session,
    revoke_session,
    session_is_active,
    touch_session,
)
from core.settings import settings
from main import SessionLocal

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ----------------------
# Schemas
# ----------------------
class SignupIn(BaseModel):
    email: EmailStr
    password: str

class SignupOut(BaseModel):
    user_id: str
    email: EmailStr
    policy_passed: bool

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class LoginOut(BaseModel):
    access_token: str
    token_type: str
    session_id: str
    expires_in: int
    user_id: str
    email: EmailStr

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

# ----------------------
# DB dependency
# ----------------------
async def get_db():
    async with SessionLocal() as session:
        yield session

# ----------------------
# Signup
# ----------------------
@router.post("/signup", response_model=SignupOut, status_code=201)
async def signup(payload: SignupIn, db: AsyncSession = Depends(get_db)):
    result = policy.validate(payload.password)
    if not result.ok:
        raise HTTPException(status_code=422, detail=result.errors)

    stmt = select(User).where(User.email == payload.email.lower())
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(email=payload.email.lower(), hashed_password=hash_password(payload.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return SignupOut(user_id=user.id, email=user.email, policy_passed=True)

# ----------------------
# Login
# ----------------------
@router.post("/login", response_model=LoginOut)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)):
    email_norm = payload.email.lower()
    stmt = select(User).where(User.email == email_norm)
    user = (await db.execute(stmt)).scalars().first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session = await create_session(db, user_id=user.id, ip=None, ua=None)
    token = create_access_token(user_id=user.id, session_id=session.id)
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return LoginOut(
        access_token=token,
        token_type="bearer",
        session_id=str(session.id),
        expires_in=expires_in_seconds,
        user_id=user.id,
        email=user.email,
    )

# ----------------------
# Me
# ----------------------
@router.get("/me", response_model=MeOut)
async def me(request: Request, db: AsyncSession = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    session_id = payload.get("sid")
    exp = payload.get("exp")
    if not user_id or not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token structure")

    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    session_row = await get_session(db, session_id)
    if not session_row or not session_is_active(session_row):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session inactive")

    await touch_session(db, session_row)

    access_token_expires_in = None
    if exp:
        try:
            now_ts = datetime.now(timezone.utc).timestamp()
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
# Logout (NEW)
# ----------------------
@router.post("/logout", response_model=LogoutOut)
async def logout(request: Request, db: AsyncSession = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except Exception:
        return LogoutOut(revoked=False, session_id=None)

    session_id = payload.get("sid")
    if not session_id:
        return LogoutOut(revoked=False, session_id=None)

    session_row = await get_session(db, session_id)
    if not session_row:
        return LogoutOut(revoked=False, session_id=session_id)

    if session_row.revoked_at is None:
        await revoke_session(db, session_row)
        return LogoutOut(revoked=True, session_id=session_id)

    return LogoutOut(revoked=False, session_id=session_id)
