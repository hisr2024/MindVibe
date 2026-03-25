import logging
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.deps import get_db
from backend.middleware.rate_limiter import limiter, AUTH_RATE_LIMIT
from backend.models import Session, User
from backend.models.auth import EmailVerificationToken, PasswordResetToken
from backend.security.jwt import create_access_token, decode_access_token
from backend.security.password_hash import hash_password, verify_password
from backend.security.password_policy import policy
from backend.services.email_service import (
    send_email_verification,
    send_password_reset_email,
)
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
from backend.services.subscription_service import (
    get_or_create_free_subscription,
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
    subscription_tier: str = "free"
    email_verification_sent: bool = False


class LoginIn(BaseModel):
    email: EmailStr
    password: str
class AuthUser(BaseModel):
    """Nested user object in auth responses — standardized for mobile clients."""
    id: str
    email: str
    name: str | None = None
    avatar_url: str | None = None
    is_onboarded: bool = False


class LoginOut(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int = 900
    user: AuthUser
    # Legacy flat fields kept for backward compatibility
    session_id: str | None = None
    subscription_tier: str = "free"
    subscription_status: str = "active"
    is_developer: bool = False


class MeOut(BaseModel):
    user_id: str
    email: EmailStr
    email_verified: bool = False
    session_id: str | None
    session_active: bool
    session_expires_at: datetime | None
    session_last_used_at: datetime | None
    access_token_expires_in: int | None
    subscription_tier: str = "free"
    subscription_status: str = "active"
    is_developer: bool = False


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
    if not user or user.deleted_at is not None:
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
        raise HTTPException(
            status_code=422,
            detail={"detail": "; ".join(result.errors), "code": "VALIDATION_ERROR", "field": "password"},
        )

    stmt = select(User).where(User.email == payload.email.lower())
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail={"detail": "Unable to create account with this email", "code": "EMAIL_EXISTS", "field": "email"},
        )

    # Generate a unique auth_uid
    auth_uid = secrets.token_urlsafe(16)
    
    user = User(
        auth_uid=auth_uid,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Database commit failed during signup: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "DATABASE_ERROR", "message": "Operation failed. Please try again."})
    await db.refresh(user)

    # Auto-create free subscription for new user
    try:
        await get_or_create_free_subscription(db, user.id)
    except Exception as sub_err:
        logger.warning(f"Failed to create free subscription for new user {user.id}: {sub_err}")

    # Send email verification token.
    # If email delivery is not configured, auto-verify the user so they
    # are not locked out of their account.
    verification_sent = False
    try:
        from backend.services.email_service import can_send_email

        if can_send_email():
            raw_token = secrets.token_urlsafe(32)
            token_hash_val = hash_password(raw_token)
            verification_row = EmailVerificationToken(
                id=str(uuid.uuid4()),
                user_id=user.id,
                token_hash=token_hash_val,
                expires_at=datetime.now(UTC) + timedelta(hours=24),
                ip_address=request.client.host if request.client else None,
            )
            db.add(verification_row)
            await db.commit()
            verification_sent = await send_email_verification(user.email, raw_token)
            if not verification_sent:
                logger.warning(
                    "Verification email failed to send for user %s — "
                    "auto-verifying to prevent lockout",
                    user.id,
                )
                # Auto-verify so the user can still log in
                user.email_verified = True
                user.email_verified_at = datetime.now(UTC)
                await db.commit()
        else:
            # Email provider not configured — auto-verify immediately
            logger.info(
                "Email delivery not configured (EMAIL_PROVIDER != smtp) — "
                "auto-verifying user %s",
                user.id,
            )
            user.email_verified = True
            user.email_verified_at = datetime.now(UTC)
            await db.commit()
    except Exception as ver_err:
        logger.warning(f"Failed to create verification token for user {user.id}: {ver_err}")
        # On any error, auto-verify to prevent lockout
        try:
            user.email_verified = True
            user.email_verified_at = datetime.now(UTC)
            await db.commit()
        except Exception:
            await db.rollback()

    return SignupOut(
        user_id=user.id,
        email=user.email,
        policy_passed=True,
        subscription_tier="free",
        email_verification_sent=verification_sent,
    )


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
        logger.warning("Login blocked: account locked user_id=%s until=%s", user.id, user.locked_until.isoformat())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Invalid credentials", "code": "INVALID_CREDENTIALS"},
        )

    # Validate credentials - split checks for targeted server-side logging
    if not user:
        logger.info("Login failed: no account found for email=%s", email_norm)
        raise HTTPException(
            status_code=401,
            detail={"detail": "Invalid credentials", "code": "INVALID_CREDENTIALS"},
        )

    if not verify_password(payload.password, user.hashed_password):
        # Track failed attempts
        new_attempts = (user.failed_login_attempts or 0) + 1
        update_values: dict = {"failed_login_attempts": new_attempts}

        # Lock account after max failed attempts
        if new_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            update_values["locked_until"] = datetime.now(UTC) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)

        try:
            await db.execute(
                update(User).where(User.id == user.id).values(**update_values)
            )
            await db.commit()
        except Exception as e:
            try:
                await db.rollback()
            except Exception:
                pass
            logger.error(f"Database commit failed during login attempt tracking: {e}", exc_info=True)

        logger.info("Login failed: wrong password user_id=%s attempts=%d", user.id, new_attempts)
        raise HTTPException(
            status_code=401,
            detail={"detail": "Invalid credentials", "code": "INVALID_CREDENTIALS"},
        )

    # Block login if email is not verified (only when enforcement is enabled
    # AND email delivery is actually configured — otherwise users have no way
    # to verify and would be permanently locked out)
    if settings.REQUIRE_EMAIL_VERIFICATION and not user.email_verified:
        from backend.services.email_service import can_send_email

        if can_send_email():
            logger.warning("Login blocked: email not verified user_id=%s email=%s", user.id, email_norm)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "detail": (
                        "Please verify your email before logging in. "
                        "Check your inbox (and spam folder) for a verification link, "
                        "or request a new one via the resend verification option."
                    ),
                    "code": "EMAIL_NOT_VERIFIED",
                    "field": "email",
                },
            )
        else:
            # Email provider not configured — auto-verify and allow login
            logger.warning(
                "Email verification required but email delivery not configured — "
                "auto-verifying user %s to prevent lockout",
                user.id,
            )
            try:
                user.email_verified = True
                user.email_verified_at = datetime.now(UTC)
                await db.commit()
                await db.refresh(user)
            except Exception as e:
                logger.error("Failed to auto-verify user %s: %s", user.id, e)
                try:
                    await db.rollback()
                except Exception:
                    pass

    # Reset failed attempts on successful login
    if user.failed_login_attempts and user.failed_login_attempts > 0:
        try:
            await db.execute(
                update(User).where(User.id == user.id).values(
                    failed_login_attempts=0,
                    locked_until=None,
                )
            )
            await db.commit()
        except Exception as e:
            try:
                await db.rollback()
            except Exception:
                pass
            logger.error(f"Database commit failed during login attempt reset: {e}", exc_info=True)

    # Capture user fields before any DB operations that might invalidate the session.
    # After commit/rollback cycles the ORM object may become detached; reading
    # attributes here guarantees we have the values for the response.
    user_id = user.id
    user_email = user.email
    user_avatar = getattr(user, "avatar_url", None)
    user_onboarded = getattr(user, "is_onboarded", False)

    # Bind session to client IP and User-Agent for security auditing
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    # Truncate user-agent to prevent DB column overflow (VARCHAR 512)
    if user_agent and len(user_agent) > 512:
        user_agent = user_agent[:512]

    try:
        session = await create_session(db, user_id=user_id, ip=client_ip, ua=user_agent)
    except Exception as e:
        logger.error("Session creation failed for user_id=%s: %s", user_id, e, exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail={"detail": "Login failed due to a server error. Please try again.", "code": "SESSION_ERROR"},
        )

    access_token = create_access_token(user_id=user_id, session_id=session.id)
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    # Create refresh token + set cookie
    try:
        _, raw_refresh = await create_refresh_token(
            db, user_id=user_id, session_id=session.id
        )
    except Exception as e:
        logger.error("Refresh token creation failed for user_id=%s: %s", user_id, e, exc_info=True)
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail={"detail": "Login failed due to a server error. Please try again.", "code": "TOKEN_ERROR"},
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

    # Fetch subscription info for the logged-in user
    sub_tier = "free"
    sub_status = "active"
    try:
        subscription = await get_or_create_free_subscription(db, user_id)
        if subscription and subscription.plan:
            sub_tier = subscription.plan.tier.value if hasattr(subscription.plan.tier, 'value') else str(subscription.plan.tier)
            sub_status = subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status)
    except Exception as sub_err:
        logger.warning(f"Failed to fetch subscription for user {user_id}: {sub_err}")
        # Ensure DB session is usable for subsequent queries
        try:
            await db.rollback()
        except Exception:
            pass

    # Check developer status
    from backend.middleware.feature_access import is_developer as check_is_developer
    is_dev = False
    try:
        is_dev = await check_is_developer(db, user_id)
    except Exception:
        pass

    # Fetch user profile for name
    profile_name: str | None = None
    try:
        from backend.models.user import UserProfile
        profile_stmt = select(UserProfile).where(UserProfile.user_id == user_id)
        profile = (await db.execute(profile_stmt)).scalars().first()
        if profile:
            profile_name = profile.full_name
    except Exception:
        pass

    # Return refresh token in body for mobile clients (cookie is also set above)
    refresh_body = raw_refresh if settings.REFRESH_TOKEN_ENABLE_BODY_RETURN else None

    logger.info("Login successful: user_id=%s session_id=%s", user_id, session.id)

    return LoginOut(
        access_token=access_token,
        refresh_token=refresh_body,
        token_type="bearer",  # nosec B106
        expires_in=expires_in_seconds,
        user=AuthUser(
            id=user_id,
            email=user_email,
            name=profile_name,
            avatar_url=user_avatar,
            is_onboarded=user_onboarded,
        ),
        session_id=str(session.id),
        subscription_tier="siddha" if is_dev else sub_tier,
        subscription_status=sub_status,
        is_developer=is_dev,
    )


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

    # Fetch subscription info
    sub_tier = "free"
    sub_status = "active"
    try:
        subscription = await get_or_create_free_subscription(db, user.id)
        if subscription and subscription.plan:
            sub_tier = subscription.plan.tier.value if hasattr(subscription.plan.tier, 'value') else str(subscription.plan.tier)
            sub_status = subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status)
    except Exception as sub_err:
        logger.warning(f"Failed to fetch subscription for user {user.id}: {sub_err}")

    # Check developer status
    from backend.middleware.feature_access import is_developer as check_is_developer
    is_dev = False
    try:
        is_dev = await check_is_developer(db, user.id)
    except Exception:
        pass

    return MeOut(
        user_id=user.id,
        email=user.email,
        email_verified=bool(user.email_verified),
        session_id=str(session_row.id),
        session_active=True,
        session_expires_at=session_row.expires_at,
        session_last_used_at=session_row.last_used_at,
        access_token_expires_in=access_token_expires_in,
        subscription_tier="siddha" if is_dev else sub_tier,
        subscription_status=sub_status,
        is_developer=is_dev,
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
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Database commit failed during session revocation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "DATABASE_ERROR", "message": "Operation failed. Please try again."})

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

    # Set new access_token cookie — without this, the browser keeps sending
    # the old expired access_token on subsequent requests, causing 401 errors.
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.SECURE_COOKIE,
        samesite="lax",
        path="/",
        max_age=expires_in_seconds,
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
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Database commit failed during password reset token creation: {e}", exc_info=True)
        # Return generic response to prevent account enumeration
        return generic_response

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

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Database commit failed during password reset: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "DATABASE_ERROR", "message": "Operation failed. Please try again."})

    logger.info("Password reset completed for user %s", matched_token.user_id)

    return ResetPasswordOut(
        message="Password has been reset successfully. Please log in with your new password."
    )


# ----------------------
# Email Verification
# ----------------------
VERIFICATION_TOKEN_EXPIRE_HOURS = 24


class VerifyEmailIn(BaseModel):
    token: str


class VerifyEmailOut(BaseModel):
    verified: bool
    message: str


class ResendVerificationOut(BaseModel):
    message: str
    sent: bool


@router.post("/verify-email", response_model=VerifyEmailOut)
@limiter.limit("10/minute")
async def verify_email(
    request: Request, payload: VerifyEmailIn, db: AsyncSession = Depends(get_db)
):
    """Verify a user's email address using the token from the verification link.

    The token is single-use and expires after 24 hours.
    On success, the user's email_verified flag is set to True.
    """
    # Find all non-expired, unused verification tokens
    stmt = select(EmailVerificationToken).where(
        EmailVerificationToken.used_at.is_(None),
        EmailVerificationToken.expires_at > datetime.now(UTC),
    )
    candidates = (await db.execute(stmt)).scalars().all()

    # Verify token against hashed candidates
    matched_token = None
    for candidate in candidates:
        if verify_password(payload.token, candidate.token_hash):
            matched_token = candidate
            break

    if not matched_token:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification token. Please request a new one.",
        )

    # Mark token as used
    matched_token.used_at = datetime.now(UTC)

    # Mark user email as verified
    now = datetime.now(UTC)
    await db.execute(
        update(User)
        .where(User.id == matched_token.user_id)
        .values(email_verified=True, email_verified_at=now)
    )

    # Invalidate any other unused verification tokens for this user
    await db.execute(
        update(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == matched_token.user_id,
            EmailVerificationToken.id != matched_token.id,
            EmailVerificationToken.used_at.is_(None),
        )
        .values(used_at=now)
    )

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Database commit failed during email verification: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "DATABASE_ERROR", "message": "Operation failed. Please try again."})

    logger.info("Email verified for user %s", matched_token.user_id)

    return VerifyEmailOut(
        verified=True,
        message="Email verified successfully. You can now log in.",
    )


@router.post("/resend-verification", response_model=ResendVerificationOut)
@limiter.limit("3/minute")
async def resend_verification(
    request: Request, payload: ForgotPasswordIn, db: AsyncSession = Depends(get_db)
):
    """Resend email verification link.

    Always returns success to prevent account enumeration.
    Rate limited to 3 per minute to prevent abuse.
    """
    email_norm = payload.email.lower()

    generic_response = ResendVerificationOut(
        message="If an account with that email exists and is unverified, a verification link has been sent.",
        sent=False,  # Updated after actual send attempt
    )

    stmt = select(User).where(User.email == email_norm, User.deleted_at.is_(None))
    user = (await db.execute(stmt)).scalars().first()

    if not user:
        return generic_response

    if user.email_verified:
        return generic_response

    # Invalidate existing unused verification tokens
    await db.execute(
        update(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used_at.is_(None),
        )
        .values(used_at=datetime.now(UTC))
    )

    # Generate new verification token
    raw_token = secrets.token_urlsafe(32)
    token_hash_val = hash_password(raw_token)

    verification_row = EmailVerificationToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=token_hash_val,
        expires_at=datetime.now(UTC) + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS),
        ip_address=request.client.host if request.client else None,
    )
    db.add(verification_row)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Database commit failed during resend verification: {e}", exc_info=True)
        return generic_response

    sent = await send_email_verification(user.email, raw_token)
    if sent:
        logger.info("Verification email resent for user %s", user.id)
        generic_response.sent = True
    else:
        logger.warning("Failed to send verification email to user %s", user.id)

    return generic_response


# ----------------------
# Developer Status Check
# ----------------------
class DeveloperStatusOut(BaseModel):
    is_developer: bool
    email: str | None = None
    effective_tier: str = "free"
    features_unlocked: bool = False
    subscription_tier: str = "free"
    subscription_status: str = "active"


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

    # Fetch subscription info
    sub_tier = "free"
    sub_status = "active"
    try:
        subscription = await get_or_create_free_subscription(db, user.id)
        if subscription and subscription.plan:
            sub_tier = subscription.plan.tier.value if hasattr(subscription.plan.tier, 'value') else str(subscription.plan.tier)
            sub_status = subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status)
    except Exception:
        pass

    return DeveloperStatusOut(
        is_developer=is_dev,
        email=user.email,
        effective_tier="siddha" if is_dev else sub_tier,
        features_unlocked=is_dev,
        subscription_tier="siddha" if is_dev else sub_tier,
        subscription_status=sub_status,
    )
