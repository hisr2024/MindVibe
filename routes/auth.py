from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.user import User
from security.password_policy import policy
from security.password_hash import hash_password, verify_password
from security.jwt import create_access_token
from services.session_service import create_session
from core.settings import settings
from main import SessionLocal

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ----------------------
# Input / Output Schemas
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
    expires_in: int  # seconds until access token expiry
    user_id: str
    email: EmailStr

# ----------------------
# DB Dependency
# ----------------------
async def get_db():
    async with SessionLocal() as session:
        yield session

# ----------------------
# Signup Endpoint
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
# Login Endpoint
# ----------------------
@router.post("/login", response_model=LoginOut)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)):
    # Normalize email
    email_norm = payload.email.lower()

    stmt = select(User).where(User.email == email_norm)
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        # Intentionally generic to avoid user enumeration detail
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create a session row
    # (IP / UA capture left for future middleware; placeholders None for now)
    session = await create_session(db, user_id=user.id, ip=None, ua=None)

    # Create access token bound to session
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
