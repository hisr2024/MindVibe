"""Dependency injection for FastAPI routes"""

import os
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from fastapi import Depends, HTTPException, Request, status

from backend.security.jwt import decode_access_token
from backend.models import User

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
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
    
    Extracts the user ID from the Authorization header (Bearer token).
    Returns the user ID if valid, raises 401 if not authenticated.
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ", 1)[1].strip()
    
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


async def get_current_user_flexible(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    Get the current authenticated user with flexible auth methods.

    Supports multiple authentication methods in order of preference:
    1. Authorization: Bearer <JWT token> - Standard JWT authentication
    2. X-Auth-UID header - User ID header (for frontend compatibility)

    This is designed for endpoints that need to work with both JWT tokens
    and direct user ID headers from the frontend.

    Returns the user ID if valid, raises 401 if not authenticated.
    """
    # First, try JWT Bearer token authentication
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()

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

    # Second, try X-Auth-UID header (frontend compatibility)
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
        detail="Not authenticated. Please provide a valid Bearer token or X-Auth-UID header.",
        headers={"WWW-Authenticate": "Bearer"},
    )
