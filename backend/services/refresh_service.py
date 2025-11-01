import secrets
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from backend.core.settings import settings
from backend.models.refresh_token import RefreshToken
from backend.services.session_service import (
    get_session,
    revoke_session,
    session_is_active,
)

# ------------------------------------------------------------------------------
# Refresh Token Service
# ------------------------------------------------------------------------------

def generate_refresh_token_value() -> str:
    """Generate a URL-safe random token."""
    return secrets.token_urlsafe(settings.REFRESH_TOKEN_LENGTH)

def _hash_token(raw: str) -> str:
    return bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def _verify_token(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(raw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

async def create_refresh_token(
    db: AsyncSession,
    user_id: str,
    session_id: str,
    parent: Optional[RefreshToken] = None,
) -> Tuple[RefreshToken, str]:
    """Create a new refresh token row and return (row, raw_token)."""
    raw = generate_refresh_token_value()
    hashed = _hash_token(raw)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    row = RefreshToken(
        user_id=user_id,
        session_id=session_id,
        token_hash=hashed,
        expires_at=expires_at,
        parent_id=parent.id if parent else None,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row, raw

async def get_refresh_token_by_raw(db: AsyncSession, raw: str) -> Optional[RefreshToken]:
    """Naive lookup: scan active (non-revoked) tokens and bcrypt-compare."""
    stmt = select(RefreshToken).where(RefreshToken.revoked_at.is_(None))
    rows = (await db.execute(stmt)).scalars().all()
    for row in rows:
        if _verify_token(raw, row.token_hash):
            return row
    return None

def is_expired(token: RefreshToken) -> bool:
    return token.expires_at < datetime.now(timezone.utc)

async def mark_rotated(db: AsyncSession, token: RefreshToken) -> None:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == token.id)
        .values(rotated_at=datetime.now(timezone.utc))
    )
    await db.commit()

async def mark_revoked(db: AsyncSession, token: RefreshToken, reuse: bool = False) -> None:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == token.id)
        .values(
            revoked_at=datetime.now(timezone.utc),
            reuse_detected=True if reuse else token.reuse_detected,
        )
    )
    await db.commit()

async def revoke_all_for_session(db: AsyncSession, session_id: str) -> None:
    await db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.session_id == session_id,
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(timezone.utc))
    )
    await db.commit()

async def rotate_refresh_token(db: AsyncSession, token: RefreshToken) -> Tuple[RefreshToken, str]:
    """Mark the existing token as rotated, then issue a new child token."""
    await mark_rotated(db, token)
    new_rt, raw = await create_refresh_token(
        db,
        user_id=str(token.user_id),
        session_id=str(token.session_id),
        parent=token,
    )
    return new_rt, raw

async def handle_reuse_attack(db: AsyncSession, token: RefreshToken) -> None:
    """When a rotated/revoked token is presented again, mark it reused and revoke all tokens."""
    await mark_revoked(db, token, reuse=True)
    await revoke_all_for_session(db, str(token.session_id))
    session_row = await get_session(db, str(token.session_id))
    if session_row and session_row.revoked_at is None:
        await revoke_session(db, session_row)

async def validate_and_prepare_rotation(db: AsyncSession, raw_refresh: str):
    """Validate a raw refresh token before rotation."""
    token_row = await get_refresh_token_by_raw(db, raw_refresh)
    if not token_row:
        raise ValueError("invalid_refresh_token")

    if token_row.rotated_at is not None:
        await handle_reuse_attack(db, token_row)
        raise ValueError("reuse_detected")

    if token_row.revoked_at is not None:
        await handle_reuse_attack(db, token_row)
        raise ValueError("revoked_token")

    if is_expired(token_row):
        await mark_revoked(db, token_row)
        raise ValueError("expired_token")

    session_row = await get_session(db, str(token_row.session_id))
    if not session_row or not session_is_active(session_row):
        await mark_revoked(db, token_row)
        raise ValueError("inactive_session")

    return token_row, session_row
