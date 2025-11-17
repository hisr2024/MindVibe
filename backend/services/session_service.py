"""Session management service."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.models import Session


async def create_session(
    db: AsyncSession,
    user_id: str,
    ip: str | None = None,
    ua: str | None = None,
) -> Session:
    """Create a new session."""
    expires_at = datetime.now(UTC) + timedelta(days=settings.SESSION_EXPIRE_DAYS)
    session = Session(
        user_id=user_id,
        ip_address=ip,
        user_agent=ua,
        expires_at=expires_at,
        last_used_at=datetime.now(UTC),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: str) -> Session | None:
    """Get a session by ID."""
    stmt = select(Session).where(Session.id == session_id)
    result = await db.execute(stmt)
    return result.scalars().first()


def session_is_active(session: Session) -> bool:
    """Check if a session is active."""
    if session.revoked_at is not None:
        return False
    if session.expires_at and session.expires_at < datetime.now(UTC):
        return False
    return True


async def touch_session(db: AsyncSession, session: Session) -> None:
    """Update the last_used_at timestamp."""
    # Only update if enough time has passed to avoid too many DB writes
    min_interval = timedelta(minutes=settings.SESSION_TOUCH_INTERVAL_MINUTES)
    if session.last_used_at and (datetime.now(UTC) - session.last_used_at) < min_interval:
        return

    await db.execute(
        update(Session)
        .where(Session.id == session.id)
        .values(last_used_at=datetime.now(UTC))
    )
    await db.commit()


async def revoke_session(db: AsyncSession, session: Session) -> None:
    """Revoke a session."""
    await db.execute(
        update(Session)
        .where(Session.id == session.id)
        .values(revoked_at=datetime.now(UTC))
    )
    await db.commit()
