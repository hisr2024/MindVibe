"""Two-Factor Authentication routes.

This module provides 2FA setup, verification, and management endpoints.

KIAAN Impact: ✅ POSITIVE - Enhanced security for user accounts.
"""

import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user
from backend.models import User, ComplianceAuditLog
from backend.security.two_factor import (
    TwoFactorAuth,
    verify_totp_code,
    verify_backup_code,
)

router = APIRouter(prefix="/api/auth/2fa", tags=["two-factor-auth"])

# Initialize 2FA helper
tfa = TwoFactorAuth(issuer="MindVibe")


# =============================================================================
# Schemas
# =============================================================================

class Setup2FAResponse(BaseModel):
    """Response for 2FA setup initialization."""
    secret: str
    uri: str
    qr_code: str
    backup_codes: list[str]


class Enable2FAInput(BaseModel):
    """Input to enable 2FA after setup."""
    code: str  # TOTP code to verify setup


class Verify2FAInput(BaseModel):
    """Input to verify a 2FA code during login."""
    code: str  # TOTP code
    use_backup: bool = False  # True to use backup code instead


class Disable2FAInput(BaseModel):
    """Input to disable 2FA."""
    code: str  # Current TOTP code to confirm
    password: str  # Current password for extra security


class RegenerateBackupCodesInput(BaseModel):
    """Input to regenerate backup codes."""
    code: str  # Current TOTP code to confirm


class TwoFactorStatusResponse(BaseModel):
    """Response for 2FA status check."""
    enabled: bool
    backup_codes_remaining: int


# =============================================================================
# Helper Functions
# =============================================================================

async def log_2fa_action(
    db: AsyncSession,
    user_id: str,
    action: str,
    details: Optional[dict],
    ip_address: str,
    user_agent: str,
) -> None:
    """Log a 2FA-related action."""
    log_entry = ComplianceAuditLog(
        user_id=user_id,
        action=action,
        resource_type="2fa",
        resource_id=user_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        severity="info" if "success" in action else "warning",
    )
    db.add(log_entry)
    await db.commit()


def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Get user by ID."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


# =============================================================================
# Routes
# =============================================================================

@router.get("/status", response_model=TwoFactorStatusResponse)
async def get_2fa_status(
    request: Request,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if 2FA is enabled for the current user.
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Count remaining backup codes (stored as JSON array)
    backup_codes = user.mfa_backup_codes or []
    
    return TwoFactorStatusResponse(
        enabled=user.two_factor_enabled,
        backup_codes_remaining=len(backup_codes) if user.two_factor_enabled else 0,
    )


@router.post("/setup", response_model=Setup2FAResponse)
async def setup_2fa(
    request: Request,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initialize 2FA setup for the current user.
    
    Returns the secret, QR code, and backup codes.
    The user must call /enable with a valid TOTP code to activate 2FA.
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled. Disable it first to set up again.",
        )
    
    # Generate 2FA setup data
    setup_data = tfa.setup_2fa(user.email or user_id)
    
    # Store the secret temporarily (not enabled yet)
    # The user must verify with a code before it's fully enabled
    user.two_factor_secret = setup_data["secret"]
    await db.commit()
    
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    await log_2fa_action(
        db=db,
        user_id=user_id,
        action="2fa_setup_initiated",
        details={"email": user.email},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return Setup2FAResponse(
        secret=setup_data["secret"],
        uri=setup_data["uri"],
        qr_code=setup_data["qr_code"],
        backup_codes=setup_data["backup_codes"],
    )


@router.post("/enable")
async def enable_2fa(
    request: Request,
    input_data: Enable2FAInput,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Enable 2FA after verifying the setup code.
    
    This confirms that the user has successfully set up their authenticator app.
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled",
        )
    
    if not user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated. Call /setup first.",
        )
    
    # Verify the code
    if not verify_totp_code(user.two_factor_secret, input_data.code):
        ip_address = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")[:512]
        
        await log_2fa_action(
            db=db,
            user_id=user_id,
            action="2fa_enable_failed",
            details={"reason": "invalid_code"},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid code. Please try again.",
        )
    
    # Enable 2FA
    user.two_factor_enabled = True
    await db.commit()
    
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    await log_2fa_action(
        db=db,
        user_id=user_id,
        action="2fa_enabled_success",
        details={"email": user.email},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {"message": "2FA has been enabled successfully", "enabled": True}


@router.post("/verify")
async def verify_2fa(
    request: Request,
    input_data: Verify2FAInput,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a 2FA code.
    
    Can be used during login or for sensitive operations.
    Supports both TOTP codes and backup codes.
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if not user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this account",
        )
    
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    if input_data.use_backup:
        # Verify backup code
        backup_codes = user.mfa_backup_codes or []
        code_index = verify_backup_code(input_data.code, backup_codes)
        
        if code_index is None:
            await log_2fa_action(
                db=db,
                user_id=user_id,
                action="2fa_verify_failed",
                details={"method": "backup_code", "reason": "invalid_code"},
                ip_address=ip_address,
                user_agent=user_agent,
            )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid backup code",
            )
        
        # Remove used backup code
        backup_codes.pop(code_index)
        user.mfa_backup_codes = backup_codes
        await db.commit()
        
        await log_2fa_action(
            db=db,
            user_id=user_id,
            action="2fa_verify_success",
            details={"method": "backup_code", "codes_remaining": len(backup_codes)},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        return {
            "verified": True,
            "method": "backup_code",
            "backup_codes_remaining": len(backup_codes),
        }
    else:
        # Verify TOTP code
        if not verify_totp_code(user.two_factor_secret, input_data.code):
            await log_2fa_action(
                db=db,
                user_id=user_id,
                action="2fa_verify_failed",
                details={"method": "totp", "reason": "invalid_code"},
                ip_address=ip_address,
                user_agent=user_agent,
            )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid code",
            )
        
        await log_2fa_action(
            db=db,
            user_id=user_id,
            action="2fa_verify_success",
            details={"method": "totp"},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        return {"verified": True, "method": "totp"}


@router.post("/disable")
async def disable_2fa(
    request: Request,
    input_data: Disable2FAInput,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Disable 2FA for the current user.
    
    Requires the current TOTP code and password for security.
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if not user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled",
        )
    
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    # Verify the TOTP code
    if not verify_totp_code(user.two_factor_secret, input_data.code):
        await log_2fa_action(
            db=db,
            user_id=user_id,
            action="2fa_disable_failed",
            details={"reason": "invalid_code"},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code",
        )
    
    # Verify password (basic check - in production use proper password verification)
    from backend.security.password_hash import verify_password
    
    if user.hashed_password and not verify_password(input_data.password, user.hashed_password):
        await log_2fa_action(
            db=db,
            user_id=user_id,
            action="2fa_disable_failed",
            details={"reason": "invalid_password"},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password",
        )
    
    # Disable 2FA
    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.mfa_backup_codes = None
    await db.commit()
    
    await log_2fa_action(
        db=db,
        user_id=user_id,
        action="2fa_disabled_success",
        details={"email": user.email},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {"message": "2FA has been disabled", "enabled": False}


@router.post("/regenerate-backup-codes")
async def regenerate_backup_codes(
    request: Request,
    input_data: RegenerateBackupCodesInput,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Regenerate backup codes for the current user.
    
    This invalidates all existing backup codes.
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if not user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled",
        )
    
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:512]
    
    # Verify the TOTP code
    if not verify_totp_code(user.two_factor_secret, input_data.code):
        await log_2fa_action(
            db=db,
            user_id=user_id,
            action="2fa_backup_regenerate_failed",
            details={"reason": "invalid_code"},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code",
        )
    
    # Generate new backup codes
    from backend.security.two_factor import generate_backup_codes
    new_codes = generate_backup_codes()
    
    # Store the new codes
    user.mfa_backup_codes = new_codes
    await db.commit()
    
    await log_2fa_action(
        db=db,
        user_id=user_id,
        action="2fa_backup_regenerated_success",
        details={"codes_count": len(new_codes)},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {
        "message": "Backup codes have been regenerated",
        "backup_codes": new_codes,
    }
