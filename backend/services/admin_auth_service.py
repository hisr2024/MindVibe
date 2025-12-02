"""Admin authentication service with MFA support."""

from datetime import UTC, datetime, timedelta
import secrets

import pyotp
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.models import AdminUser, AdminSession, AdminAuditLog, AdminAuditAction
from backend.security.password_hash import hash_password, verify_password
from backend.security.jwt import create_access_token, decode_access_token


# Admin session expiration (1 hour as per requirements)
ADMIN_SESSION_EXPIRE_MINUTES = 60
# Max failed login attempts before lockout
MAX_FAILED_ATTEMPTS = 5
# Lockout duration in minutes
LOCKOUT_DURATION_MINUTES = 30


async def get_admin_by_email(db: AsyncSession, email: str) -> AdminUser | None:
    """Get admin user by email."""
    stmt = select(AdminUser).where(
        AdminUser.email == email.lower(),
        AdminUser.deleted_at.is_(None)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_admin_by_id(db: AsyncSession, admin_id: str) -> AdminUser | None:
    """Get admin user by ID."""
    stmt = select(AdminUser).where(
        AdminUser.id == admin_id,
        AdminUser.deleted_at.is_(None)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def create_admin_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str,
    role: str = "support",
    ip_whitelist: list[str] | None = None,
) -> AdminUser:
    """Create a new admin user."""
    admin = AdminUser(
        email=email.lower(),
        hashed_password=hash_password(password),
        full_name=full_name,
        role=role,
        ip_whitelist=ip_whitelist,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return admin


async def verify_admin_credentials(
    db: AsyncSession,
    email: str,
    password: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[AdminUser | None, str | None]:
    """
    Verify admin credentials and return admin user if valid.
    Returns (admin, error_message).
    """
    admin = await get_admin_by_email(db, email)
    
    if not admin:
        return None, "Invalid credentials"
    
    # Check if account is locked
    if admin.locked_until and admin.locked_until > datetime.now(UTC):
        return None, "Account is locked. Try again later."
    
    # Check if account is active
    if not admin.is_active:
        return None, "Account is deactivated"
    
    # Verify password
    if not verify_password(password, admin.hashed_password):
        # Increment failed attempts
        await db.execute(
            update(AdminUser)
            .where(AdminUser.id == admin.id)
            .values(failed_login_attempts=admin.failed_login_attempts + 1)
        )
        
        # Lock account if too many failed attempts
        if admin.failed_login_attempts + 1 >= MAX_FAILED_ATTEMPTS:
            await db.execute(
                update(AdminUser)
                .where(AdminUser.id == admin.id)
                .values(
                    locked_until=datetime.now(UTC) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                )
            )
            await db.commit()
            
            # Log failed login
            await create_audit_log(
                db=db,
                admin_id=admin.id,
                action=AdminAuditAction.LOGIN_FAILED,
                details={"reason": "account_locked", "failed_attempts": admin.failed_login_attempts + 1},
                ip_address=ip_address,
                user_agent=user_agent,
            )
            
            return None, "Account locked due to too many failed attempts"
        
        await db.commit()
        
        # Log failed login
        await create_audit_log(
            db=db,
            admin_id=admin.id,
            action=AdminAuditAction.LOGIN_FAILED,
            details={"reason": "invalid_password"},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        return None, "Invalid credentials"
    
    # Check IP whitelist if configured
    if admin.ip_whitelist and ip_address:
        if ip_address not in admin.ip_whitelist:
            await create_audit_log(
                db=db,
                admin_id=admin.id,
                action=AdminAuditAction.LOGIN_FAILED,
                details={"reason": "ip_not_whitelisted", "ip": ip_address},
                ip_address=ip_address,
                user_agent=user_agent,
            )
            return None, "Access denied from this IP address"
    
    return admin, None


async def verify_mfa_code(admin: AdminUser, code: str) -> bool:
    """Verify MFA TOTP code."""
    if not admin.mfa_secret:
        return False
    
    totp = pyotp.TOTP(admin.mfa_secret)
    return totp.verify(code.strip().replace(" ", ""), valid_window=1)


async def verify_backup_code(
    db: AsyncSession,
    admin: AdminUser,
    code: str
) -> bool:
    """Verify and consume a backup code."""
    if not admin.mfa_backup_codes:
        return False
    
    code = code.strip().upper()
    if code not in admin.mfa_backup_codes:
        return False
    
    # Remove used backup code
    updated_codes = [c for c in admin.mfa_backup_codes if c != code]
    await db.execute(
        update(AdminUser)
        .where(AdminUser.id == admin.id)
        .values(mfa_backup_codes=updated_codes)
    )
    await db.commit()
    
    return True


async def create_admin_session(
    db: AsyncSession,
    admin_id: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AdminSession:
    """Create a new admin session."""
    session_id = secrets.token_urlsafe(32)
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=ADMIN_SESSION_EXPIRE_MINUTES)
    
    session = AdminSession(
        id=session_id,
        admin_id=admin_id,
        ip_address=ip_address,
        user_agent=user_agent,
        last_activity_at=now,
        expires_at=expires_at,
    )
    db.add(session)
    
    # Update admin's last login
    await db.execute(
        update(AdminUser)
        .where(AdminUser.id == admin_id)
        .values(
            last_login_at=now,
            last_login_ip=ip_address,
            failed_login_attempts=0,
            locked_until=None,
        )
    )
    
    await db.commit()
    await db.refresh(session)
    return session


async def get_admin_session(db: AsyncSession, session_id: str) -> AdminSession | None:
    """Get admin session by ID."""
    stmt = select(AdminSession).where(AdminSession.id == session_id)
    result = await db.execute(stmt)
    return result.scalars().first()


def is_session_active(session: AdminSession) -> bool:
    """Check if admin session is active."""
    now = datetime.now(UTC)
    return (
        session.revoked_at is None
        and session.expires_at > now
    )


async def touch_admin_session(db: AsyncSession, session: AdminSession) -> None:
    """Update session last activity time."""
    await db.execute(
        update(AdminSession)
        .where(AdminSession.id == session.id)
        .values(last_activity_at=datetime.now(UTC))
    )
    await db.commit()


async def revoke_admin_session(db: AsyncSession, session: AdminSession) -> None:
    """Revoke an admin session."""
    await db.execute(
        update(AdminSession)
        .where(AdminSession.id == session.id)
        .values(revoked_at=datetime.now(UTC))
    )
    await db.commit()


async def revoke_all_admin_sessions(db: AsyncSession, admin_id: str) -> int:
    """Revoke all sessions for an admin user."""
    now = datetime.now(UTC)
    result = await db.execute(
        update(AdminSession)
        .where(
            AdminSession.admin_id == admin_id,
            AdminSession.revoked_at.is_(None)
        )
        .values(revoked_at=now)
    )
    await db.commit()
    return result.rowcount


async def setup_mfa(db: AsyncSession, admin: AdminUser) -> tuple[str, str]:
    """
    Set up MFA for an admin user.
    Returns (secret, otpauth_url).
    """
    secret = admin.mfa_secret or pyotp.random_base32()
    
    await db.execute(
        update(AdminUser)
        .where(AdminUser.id == admin.id)
        .values(mfa_secret=secret)
    )
    await db.commit()
    
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(
        name=admin.email,
        issuer_name="MindVibe Admin"
    )
    
    return secret, otpauth_url


async def enable_mfa(
    db: AsyncSession,
    admin: AdminUser,
    code: str,
) -> tuple[bool, list[str] | None]:
    """
    Enable MFA after verifying the code.
    Returns (success, backup_codes).
    """
    if not admin.mfa_secret:
        return False, None
    
    if not await verify_mfa_code(admin, code):
        return False, None
    
    # Generate backup codes
    backup_codes = [secrets.token_hex(4).upper() for _ in range(10)]
    
    await db.execute(
        update(AdminUser)
        .where(AdminUser.id == admin.id)
        .values(
            mfa_enabled=True,
            mfa_backup_codes=backup_codes,
        )
    )
    await db.commit()
    
    return True, backup_codes


async def disable_mfa(db: AsyncSession, admin: AdminUser) -> None:
    """Disable MFA for an admin user."""
    await db.execute(
        update(AdminUser)
        .where(AdminUser.id == admin.id)
        .values(
            mfa_enabled=False,
            mfa_secret=None,
            mfa_backup_codes=None,
        )
    )
    await db.commit()


def create_admin_access_token(admin_id: str, session_id: str) -> str:
    """Create JWT access token for admin."""
    return create_access_token(
        user_id=admin_id,
        session_id=session_id,
        extra_claims={"admin": True}
    )


async def create_audit_log(
    db: AsyncSession,
    admin_id: str | None,
    action: AdminAuditAction,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AdminAuditLog:
    """Create an audit log entry."""
    log = AdminAuditLog(
        admin_id=admin_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
