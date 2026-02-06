"""Dependency injection for FastAPI routes"""

import os
import ssl as ssl_module
from typing import AsyncGenerator, Optional, Any, Dict
from urllib.parse import parse_qs, urlparse
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from fastapi import Depends, HTTPException, Request, status
import logging

from backend.security.jwt import decode_access_token
from backend.models import User

logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


def _get_ssl_connect_args(db_url: str) -> Dict[str, Any]:
    """Build SSL connect args for asyncpg.

    Render PostgreSQL uses self-signed certificates, so we need to
    disable certificate verification while still using SSL encryption.

    IMPORTANT: On Render, we ALWAYS disable certificate verification
    because Render uses self-signed certificates that fail verification.
    """
    parsed = urlparse(db_url)
    query_params = parse_qs(parsed.query)

    ssl_pref = (
        os.getenv("DB_SSL_MODE") or
        query_params.get("sslmode", [None])[0] or
        query_params.get("ssl", [None])[0]
    )

    # Auto-detect Render environment (Render sets RENDER=true)
    is_render = os.getenv("RENDER", "").lower() == "true"

    # CRITICAL: On Render, ALWAYS disable certificate verification
    # Render uses self-signed certificates that will fail verification
    if is_render:
        logger.info("Render environment detected - forcing SSL without certificate verification")
        ssl_context = ssl_module.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl_module.CERT_NONE
        return {"ssl": ssl_context}

    # Default to 'require' (SSL without cert verification) for compatibility
    if not ssl_pref:
        ssl_pref = "require"

    ssl_pref = ssl_pref.lower()

    # Full verification (only for non-Render environments with proper certs)
    if ssl_pref in {"verify-ca", "verify-full"}:
        return {"ssl": ssl_module.create_default_context()}

    # Require SSL but skip certificate verification (for self-signed certs)
    if ssl_pref in {"require", "required", "require-no-verify", "true", "1"}:
        ssl_context = ssl_module.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl_module.CERT_NONE
        return {"ssl": ssl_context}

    # Disable SSL
    if ssl_pref in {"disable", "false", "0"}:
        return {"ssl": False}

    # Default: SSL without verification for compatibility
    ssl_context = ssl_module.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl_module.CERT_NONE
    return {"ssl": ssl_context}


# ---------------------------------------------------------------------------
# Connection pool tuning for concurrent users.
# Defaults are safe for 50–200 simultaneous users.  Adjust via env vars
# when scaling beyond that or running multiple API instances.
# ---------------------------------------------------------------------------
_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "20"))          # base connections
_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))     # burst connections
_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))   # recycle after 1h
_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))     # wait for connection

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=_get_ssl_connect_args(DATABASE_URL),
    # Connection pool settings
    pool_size=_POOL_SIZE,
    max_overflow=_MAX_OVERFLOW,
    pool_pre_ping=True,         # verify connections are alive before use
    pool_recycle=_POOL_RECYCLE,  # recycle stale connections (seconds)
    pool_timeout=_POOL_TIMEOUT,  # seconds to wait for a free connection
)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def get_user_id() -> str:
    """Get user ID - DEPRECATED: Use get_current_user() instead.

    This function is deprecated and should not be used.
    Use get_current_user() or get_current_user_optional() for proper auth.

    Raises:
        HTTPException: Always raises 401 Unauthorized.
    """
    from fastapi import HTTPException, status
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Use proper authentication endpoint.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    Get the current authenticated user from JWT token.

    Extracts the user ID from the Authorization header (Bearer token)
    or from httpOnly access_token cookie (XSS-protected).
    Returns the user ID if valid, raises 401 if not authenticated.
    """
    # Check Authorization header first (for API clients/backward compatibility)
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        # Fall back to httpOnly cookie (more secure, XSS protected)
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )

    # Verify user exists and is not deleted
    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deleted",
        )

    return user_id


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[str]:
    """
    Get the current user if authenticated, or None if not.

    Useful for endpoints that work for both authenticated and anonymous users.
    """
    try:
        return await get_current_user(request, db)
    except HTTPException:
        return None


async def get_current_user_or_create(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> str:
    """Get current user from JWT, X-Auth-UID, or create a dev-anon user."""
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        token = request.cookies.get("access_token")

    if token:
        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub")

            if user_id:
                stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
                result = await db.execute(stmt)
                user = result.scalar_one_or_none()
                if user:
                    return str(user_id)
        except Exception:
            pass

    x_auth_uid = request.headers.get("X-Auth-UID")
    auth_uid = (x_auth_uid or "").strip()

    if auth_uid and auth_uid not in {"undefined", "null"}:
        stmt = select(User).where(User.auth_uid == auth_uid, User.deleted_at.is_(None))
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            user = User(auth_uid=auth_uid, locale="en")
            db.add(user)
            await db.commit()
            await db.refresh(user)

        return str(user.id)

    # Fallback to dev-anon user for local/dev workflows
    stmt = select(User).where(User.auth_uid == "dev-anon", User.deleted_at.is_(None))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(auth_uid="dev-anon", locale="en")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return str(user.id)

async def get_current_user_flexible(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    Get the current authenticated user with flexible auth methods.

    Supports multiple authentication methods in order of preference:
    1. Authorization: Bearer <JWT token> - Standard JWT authentication
    2. access_token httpOnly cookie - XSS-protected JWT authentication
    3. X-Auth-UID header - User ID header (for frontend compatibility)

    This is designed for endpoints that need to work with both JWT tokens
    and direct user ID headers from the frontend.

    Returns the user ID if valid, raises 401 if not authenticated.
    """
    # First, try JWT Bearer token authentication
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        # Second, try httpOnly cookie (XSS-protected)
        token = request.cookies.get("access_token")

    if token:
        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub")

            if user_id:
                # Verify user exists and is not deleted
                stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
                result = await db.execute(stmt)
                user = result.scalar_one_or_none()

                if user:
                    return str(user_id)
        except Exception:
            pass  # Fall through to try other auth methods

    # Third, try X-Auth-UID header (frontend compatibility)
    x_auth_uid = request.headers.get("X-Auth-UID")

    if x_auth_uid:
        user_id = x_auth_uid.strip()

        if user_id and user_id != "undefined" and user_id != "null":
            # Verify user exists and is not deleted
            stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()

            if user:
                return str(user_id)

            # User doesn't exist - reject the request
            # This prevents authentication bypass with arbitrary user IDs
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found. Please sign up or use a valid account.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # No valid authentication found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Please provide a valid Bearer token, access_token cookie, or X-Auth-UID header.",
        headers={"WWW-Authenticate": "Bearer"},
    )
