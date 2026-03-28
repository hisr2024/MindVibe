import logging
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.models import RefreshToken
from backend.services.session_service import (
    get_session,
    revoke_session,
    session_is_active,
)

logger = logging.getLogger(__name__)

# Separator between token_id and raw secret in the composite cookie value.
# Safe because secrets.token_urlsafe() only produces [A-Za-z0-9_-].
_TOKEN_SEP = "."

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
    parent: RefreshToken | None = None,
) -> tuple[RefreshToken, str]:
    """Create a new refresh token row and return (row, composite_token).

    The composite token has the format ``{token_id}.{raw_secret}`` so that
    ``get_refresh_token_by_raw`` can look up the row by primary key in O(1)
    instead of scanning every active token with bcrypt.
    """
    import secrets as sec
    raw = generate_refresh_token_value()
    hashed = _hash_token(raw)
    expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    token_id = sec.token_urlsafe(32)

    row = RefreshToken(
        id=token_id,
        user_id=user_id,
        session_id=session_id,
        token_hash=hashed,
        expires_at=expires_at,
        parent_id=parent.id if parent else None,
    )
    db.add(row)
    await db.commit()
    # No db.refresh() — all fields (id, token_hash, expires_at, etc.) are set
    # locally. Refresh risks crashing if DB connection drops after commit.

    # Return composite token: "{token_id}.{raw_secret}" for O(1) lookup
    composite = f"{token_id}{_TOKEN_SEP}{raw}"
    return row, composite


async def get_refresh_token_by_raw(db: AsyncSession, raw: str) -> RefreshToken | None:
    """Look up a refresh token from a raw (or composite) cookie value.

    New tokens use the composite format ``{token_id}.{raw_secret}`` which
    allows O(1) primary-key lookup + a single bcrypt verification.

    Legacy tokens (plain raw secret without separator) fall back to scanning
    all non-revoked rows — these are replaced on the next successful refresh.
    """
    # Fast path: composite token with embedded token_id
    if _TOKEN_SEP in raw:
        token_id, raw_secret = raw.split(_TOKEN_SEP, 1)
        stmt = select(RefreshToken).where(RefreshToken.id == token_id)
        row = (await db.execute(stmt)).scalar_one_or_none()
        if row and _verify_token(raw_secret, row.token_hash):
            return row
        # token_id not found or bcrypt mismatch — don't fall through to scan
        # (the composite format is authoritative)
        return None

    # Legacy path: plain raw token without token_id prefix.
    # Scan active tokens and bcrypt-compare each one.
    logger.warning("Legacy refresh token format detected (no token_id prefix) — falling back to full scan")
    stmt = select(RefreshToken).where(RefreshToken.revoked_at.is_(None))
    rows = (await db.execute(stmt)).scalars().all()
    for row in rows:
        if _verify_token(raw, row.token_hash):
            return row
    return None


def is_expired(token: RefreshToken) -> bool:
    """Check if a token is expired. Handles both timezone-aware and naive datetimes."""
    now = datetime.now(UTC)
    expires_at = token.expires_at
    # Handle SQLite test environment which may return naive datetimes
    if expires_at.tzinfo is None:
        # Treat naive datetime as UTC
        expires_at = expires_at.replace(tzinfo=UTC)
    return bool(expires_at < now)


async def mark_rotated(db: AsyncSession, token: RefreshToken) -> None:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == token.id)
        .values(rotated_at=datetime.now(UTC))
    )
    await db.commit()


async def mark_revoked(
    db: AsyncSession, token: RefreshToken, reuse: bool = False
) -> None:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == token.id)
        .values(
            revoked_at=datetime.now(UTC),
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
        .values(revoked_at=datetime.now(UTC))
    )
    await db.commit()


async def rotate_refresh_token(
    db: AsyncSession, token: RefreshToken
) -> tuple[RefreshToken, str]:
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
