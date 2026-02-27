import logging
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.deps import get_db
from backend.middleware.rate_limiter import limiter, AUTH_RATE_LIMIT
from backend.models import Session, User
from backend.models.auth import PasswordResetToken
from backend.security.jwt import create_access_token, decode_access_token
from backend.security.password_hash import hash_password, verify_password
from backend.security.password_policy import policy
from backend.services.email_service import send_password_reset_email
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Brute force protection constants
MAX_FAILED_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30


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
    # Check Authorization header first (for API clients/backward compatibility)
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        # Fall back to httpOnly cookie (more secure, XSS protected)
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
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
        # Use generic message to prevent account enumeration
        raise HTTPException(status_code=409, detail="Unable to create account with this email")

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

    # Check if account is locked - use generic message to prevent account enumeration
    if user and user.locked_until and user.locked_until > datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Validate credentials
    if not user or not verify_password(payload.password, user.hashed_password):
        # Track failed attempts if user exists
        if user:
            new_attempts = (user.failed_login_attempts or 0) + 1
            update_values = {"failed_login_attempts": new_attempts}

            # Lock account after max failed attempts
            if new_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
                update_values["locked_until"] = datetime.now(UTC) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)

            await db.execute(
                update(User).where(User.id == user.id).values(**update_values)
            )
            await db.commit()

        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Reset failed attempts on successful login
    if user.failed_login_attempts and user.failed_login_attempts > 0:
        await db.execute(
            update(User).where(User.id == user.id).values(
                failed_login_attempts=0,
                locked_until=None,
            )
        )
        await db.commit()

    if user.two_factor_enabled:
        if not payload.two_factor_code:
            # Use a specific error code so frontend can show 2FA input
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="additional_verification_required",
            )

        code = payload.two_factor_code.strip().replace(" ", "")
        if not user.two_factor_secret:
            # Internal misconfiguration - don't reveal details
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(code, valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

    # Bind session to client IP and User-Agent for security auditing
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    session = await create_session(db, user_id=user.id, ip=client_ip, ua=user_agent)
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

    # Also set access token in httpOnly cookie for XSS protection
    # This is the primary auth mechanism - more secure than localStorage
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.SECURE_COOKIE,
        samesite="lax",  # lax allows top-level navigations, strict would break links
        path="/",  # Available for all paths
        max_age=expires_in_seconds,
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
# Two Factor Authentication (rate limited to prevent brute force)
# ----------------------
@router.get("/2fa/status", response_model=TwoFactorStatusOut)
@limiter.limit(AUTH_RATE_LIMIT)
async def two_factor_status(request: Request, db: AsyncSession = Depends(get_db)):
    _, user, session_row, _ = await _get_user_and_active_session(request, db)
    await touch_session(db, session_row)
    return TwoFactorStatusOut(
        enabled=bool(user.two_factor_enabled),
        configured=bool(user.two_factor_secret),
    )


@router.post("/2fa/setup", response_model=TwoFactorSetupOut)
@limiter.limit(AUTH_RATE_LIMIT)
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
@limiter.limit(AUTH_RATE_LIMIT)
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


# Alias: /2fa/enable maps to /2fa/verify for frontend compatibility
@router.post("/2fa/enable", response_model=TwoFactorStatusOut)
@limiter.limit(AUTH_RATE_LIMIT)
async def enable_two_factor(
    payload: TwoFactorVerifyIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Enable 2FA by verifying the setup code. Alias for /2fa/verify."""
    return await verify_two_factor(payload, request, db)


class TwoFactorDisableIn(BaseModel):
    code: str
    password: str


@router.post("/2fa/disable", response_model=TwoFactorStatusOut)
@limiter.limit(AUTH_RATE_LIMIT)
async def disable_two_factor(
    payload: TwoFactorDisableIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Disable 2FA. Requires current TOTP code and password for security."""
    _, user, session_row, _ = await _get_user_and_active_session(request, db)

    if not user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="Two-factor not enabled")

    # Verify password
    if not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )

    # Verify TOTP code
    code = payload.code.strip().replace(" ", "")
    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid two-factor code",
        )

    # Disable 2FA
    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(two_factor_enabled=False, two_factor_secret=None, mfa_backup_codes=None)
    )
    await db.commit()

    await touch_session(db, session_row)

    return TwoFactorStatusOut(enabled=False, configured=False)


class BackupCodesOut(BaseModel):
    backup_codes: list[str]


@router.post("/2fa/regenerate-backup-codes", response_model=BackupCodesOut)
@limiter.limit(AUTH_RATE_LIMIT)
async def regenerate_backup_codes(
    payload: TwoFactorVerifyIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Regenerate backup codes. Requires current TOTP code for security."""
    import secrets

    _, user, session_row, _ = await _get_user_and_active_session(request, db)

    if not user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="Two-factor not enabled")

    # Verify TOTP code
    code = payload.code.strip().replace(" ", "")
    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid two-factor code",
        )

    # Generate new backup codes (8 codes, each 8 characters)
    backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]

    # Store bcrypt-hashed versions of backup codes for security
    # If DB is compromised, plaintext codes won't be exposed
    from backend.security.password_hash import hash_password
    hashed_codes = [hash_password(code) for code in backup_codes]

    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(mfa_backup_codes=hashed_codes)
    )
    await db.commit()

    await touch_session(db, session_row)

    # Return plaintext codes to user (this is the only time they'll see them)
    return BackupCodesOut(backup_codes=backup_codes)


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
    # Check Authorization header first, then cookie
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        token = request.cookies.get("access_token")

    if not token:
        # Still clear cookies even if no token
        response.delete_cookie("refresh_token", path="/api/auth")
        response.delete_cookie("access_token", path="/")
        return LogoutOut(revoked=False, session_id=None)
    try:
        payload = decode_access_token(token)
    except Exception:
        response.delete_cookie("refresh_token", path="/api/auth")
        response.delete_cookie("access_token", path="/")
        return LogoutOut(revoked=False, session_id=None)

    session_id = payload.get("sid")
    if not session_id:
        response.delete_cookie("refresh_token", path="/api/auth")
        response.delete_cookie("access_token", path="/")
        return LogoutOut(revoked=False, session_id=None)

    session_row = await get_session(db, session_id)
    if not session_row:
        response.delete_cookie("refresh_token", path="/api/auth")
        response.delete_cookie("access_token", path="/")
        return LogoutOut(revoked=False, session_id=session_id)

    if session_row.revoked_at is None:
        await revoke_session(db, session_row)
        await revoke_all_for_session(db, session_id)
        response.delete_cookie("refresh_token", path="/api/auth")
        response.delete_cookie("access_token", path="/")
        return LogoutOut(revoked=True, session_id=session_id)

    response.delete_cookie("refresh_token", path="/api/auth")
    response.delete_cookie("access_token", path="/")
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


# ----------------------
# Password Reset: Forgot + Reset
# ----------------------

RESET_TOKEN_EXPIRE_HOURS = 1


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ForgotPasswordOut(BaseModel):
    message: str


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str


class ResetPasswordOut(BaseModel):
    message: str


@router.post("/forgot-password", response_model=ForgotPasswordOut)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request, payload: ForgotPasswordIn, db: AsyncSession = Depends(get_db)
):
    """Request a password reset email.

    Always returns success to prevent account enumeration.
    If the email exists, a reset link is sent. If not, nothing happens.
    """
    email_norm = payload.email.lower()

    # Always return same response to prevent account enumeration
    generic_response = ForgotPasswordOut(
        message="If an account with that email exists, a password reset link has been sent."
    )

    stmt = select(User).where(User.email == email_norm, User.deleted_at.is_(None))
    user = (await db.execute(stmt)).scalars().first()

    if not user:
        logger.info("Password reset requested for non-existent email: %s", email_norm)
        return generic_response

    # Invalidate any existing unused reset tokens for this user
    await db.execute(
        update(PasswordResetToken)
        .where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
        .values(used_at=datetime.now(UTC))
    )

    # Generate cryptographically secure token
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_password(raw_token)

    reset_row = PasswordResetToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(UTC) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS),
        ip_address=request.client.host if request.client else None,
    )
    db.add(reset_row)
    await db.commit()

    # Send email (non-blocking — failure logged but doesn't break the flow)
    sent = await send_password_reset_email(user.email, raw_token)
    if not sent:
        logger.warning("Failed to send reset email to user %s", user.id)

    logger.info("Password reset token created for user %s", user.id)
    return generic_response


@router.post("/reset-password", response_model=ResetPasswordOut)
@limiter.limit("10/minute")
async def reset_password(
    request: Request, payload: ResetPasswordIn, db: AsyncSession = Depends(get_db)
):
    """Reset password using a valid reset token.

    The token is single-use and expires after 1 hour.
    On success, all existing sessions are revoked for security.
    """
    # Validate new password against policy
    result = policy.validate(payload.new_password)
    if not result.ok:
        raise HTTPException(status_code=422, detail=result.errors)

    # Find all non-expired, unused reset tokens
    stmt = select(PasswordResetToken).where(
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > datetime.now(UTC),
    )
    candidates = (await db.execute(stmt)).scalars().all()

    # Verify token against hashed candidates (bcrypt compare)
    matched_token = None
    for candidate in candidates:
        if verify_password(payload.token, candidate.token_hash):
            matched_token = candidate
            break

    if not matched_token:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token. Please request a new one.",
        )

    # Mark token as used
    matched_token.used_at = datetime.now(UTC)

    # Update user's password
    new_hashed = hash_password(payload.new_password)
    await db.execute(
        update(User)
        .where(User.id == matched_token.user_id)
        .values(
            hashed_password=new_hashed,
            failed_login_attempts=0,
            locked_until=None,
        )
    )

    # Revoke all existing sessions for security
    await db.execute(
        update(Session)
        .where(Session.user_id == matched_token.user_id, Session.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )

    await db.commit()

    logger.info("Password reset completed for user %s", matched_token.user_id)

    return ResetPasswordOut(
        message="Password has been reset successfully. Please log in with your new password."
    )


# ----------------------
# Developer Status Check
# ----------------------
class DeveloperStatusOut(BaseModel):
    is_developer: bool
    email: str | None = None
    effective_tier: str = "free"
    features_unlocked: bool = False


@router.get("/developer-status", response_model=DeveloperStatusOut)
async def developer_status(
    request: Request, db: AsyncSession = Depends(get_db)
):
    """Check if the authenticated user has developer access.

    Developer access grants full premium features without a subscription.
    Developers are identified by their email address configured in the
    DEVELOPER_EMAILS environment variable on the backend (Render).

    Returns:
        DeveloperStatusOut: Developer status with effective tier info.
    """
    from backend.middleware.feature_access import get_current_user_id, is_developer

    try:
        user_id = await get_current_user_id(request)
    except HTTPException:
        return DeveloperStatusOut(
            is_developer=False,
            email=None,
            effective_tier="free",
            features_unlocked=False,
        )

    # Look up the user to get their email
    from sqlalchemy import or_
    result = await db.execute(
        select(User).where(or_(User.id == user_id, User.auth_uid == user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        return DeveloperStatusOut(
            is_developer=False,
            email=None,
            effective_tier="free",
            features_unlocked=False,
        )

    is_dev = await is_developer(db, user_id)

    return DeveloperStatusOut(
        is_developer=is_dev,
        email=user.email,
        effective_tier="premier" if is_dev else "free",
        features_unlocked=is_dev,
    )
