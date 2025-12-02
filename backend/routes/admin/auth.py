"""Admin authentication routes with MFA support."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.deps import get_db
from backend.middleware.rate_limiter import limiter
from backend.middleware.rbac import get_current_admin, AdminContext
from backend.models import AdminAuditAction
from backend.services.admin_auth_service import (
    verify_admin_credentials,
    verify_mfa_code,
    verify_backup_code,
    create_admin_session,
    revoke_admin_session,
    setup_mfa,
    enable_mfa,
    disable_mfa,
    create_admin_access_token,
    create_audit_log,
    ADMIN_SESSION_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/api/admin/auth", tags=["admin-auth"])


# Rate limit for admin auth endpoints (stricter than regular auth)
ADMIN_AUTH_RATE_LIMIT = "5/minute"


# =============================================================================
# Schemas
# =============================================================================

class AdminLoginIn(BaseModel):
    """Admin login request."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    mfa_code: Optional[str] = Field(None, min_length=6, max_length=8)


class AdminLoginOut(BaseModel):
    """Admin login response."""
    access_token: str
    token_type: str
    session_id: str
    expires_in: int
    admin_id: str
    email: str
    full_name: str
    role: str
    mfa_required: bool = False


class MfaSetupOut(BaseModel):
    """MFA setup response."""
    secret: str
    otpauth_url: str
    qr_code_url: str  # URL for QR code generation


class MfaVerifyIn(BaseModel):
    """MFA verification request."""
    code: str = Field(..., min_length=6, max_length=8)


class MfaVerifyOut(BaseModel):
    """MFA verification response."""
    enabled: bool
    backup_codes: Optional[list[str]] = None


class MfaStatusOut(BaseModel):
    """MFA status response."""
    enabled: bool
    configured: bool


class AdminMeOut(BaseModel):
    """Current admin user info."""
    admin_id: str
    email: str
    full_name: str
    role: str
    mfa_enabled: bool
    permissions: list[str]
    session_id: str
    session_expires_at: datetime


class LogoutOut(BaseModel):
    """Logout response."""
    revoked: bool
    session_id: str


# =============================================================================
# Helper Functions
# =============================================================================

def get_client_ip(request: Request) -> str | None:
    """Extract client IP from request headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def get_user_agent(request: Request) -> str | None:
    """Get user agent from request."""
    return request.headers.get("User-Agent")


# =============================================================================
# Routes
# =============================================================================

@router.post("/login", response_model=AdminLoginOut)
@limiter.limit(ADMIN_AUTH_RATE_LIMIT)
async def admin_login(
    request: Request,
    payload: AdminLoginIn,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Admin login endpoint with MFA support.
    
    If MFA is enabled and no code is provided, returns mfa_required=True.
    Client should prompt for MFA code and retry with the code.
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # Verify credentials
    admin, error = await verify_admin_credentials(
        db=db,
        email=payload.email,
        password=payload.password,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error,
        )
    
    # Check MFA requirement
    if admin.mfa_enabled:
        if not payload.mfa_code:
            # Return indicator that MFA is required
            return AdminLoginOut(
                access_token="",
                token_type="bearer",
                session_id="",
                expires_in=0,
                admin_id=admin.id,
                email=admin.email,
                full_name=admin.full_name,
                role=admin.role.value,
                mfa_required=True,
            )
        
        # Verify MFA code
        if not await verify_mfa_code(admin, payload.mfa_code):
            # Try backup code
            if not await verify_backup_code(db, admin, payload.mfa_code):
                await create_audit_log(
                    db=db,
                    admin_id=admin.id,
                    action=AdminAuditAction.LOGIN_FAILED,
                    details={"reason": "invalid_mfa_code"},
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid MFA code",
                )
    
    # Create session
    session = await create_admin_session(
        db=db,
        admin_id=admin.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    # Create access token
    access_token = create_admin_access_token(
        admin_id=admin.id,
        session_id=session.id,
    )
    
    # Log successful login
    await create_audit_log(
        db=db,
        admin_id=admin.id,
        action=AdminAuditAction.LOGIN,
        details={"session_id": session.id},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    expires_in = ADMIN_SESSION_EXPIRE_MINUTES * 60
    
    return AdminLoginOut(
        access_token=access_token,
        token_type="bearer",
        session_id=session.id,
        expires_in=expires_in,
        admin_id=admin.id,
        email=admin.email,
        full_name=admin.full_name,
        role=admin.role.value,
        mfa_required=False,
    )


@router.post("/logout", response_model=LogoutOut)
async def admin_logout(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Logout and revoke the current admin session."""
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    await revoke_admin_session(db, admin.session)
    
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.LOGOUT,
        details={"session_id": admin.session.id},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return LogoutOut(revoked=True, session_id=admin.session.id)


@router.get("/me", response_model=AdminMeOut)
async def admin_me(
    admin: AdminContext = Depends(get_current_admin),
):
    """Get current admin user information."""
    return AdminMeOut(
        admin_id=admin.admin.id,
        email=admin.admin.email,
        full_name=admin.admin.full_name,
        role=admin.admin.role.value,
        mfa_enabled=admin.admin.mfa_enabled,
        permissions=[p.value for p in admin.permissions],
        session_id=admin.session.id,
        session_expires_at=admin.session.expires_at,
    )


@router.get("/mfa/status", response_model=MfaStatusOut)
async def mfa_status(
    admin: AdminContext = Depends(get_current_admin),
):
    """Get MFA status for current admin."""
    return MfaStatusOut(
        enabled=admin.admin.mfa_enabled,
        configured=admin.admin.mfa_secret is not None,
    )


@router.post("/mfa/setup", response_model=MfaSetupOut)
async def mfa_setup(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Set up MFA for the current admin (generates secret and QR code)."""
    if admin.admin.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="MFA is already enabled",
        )
    
    secret, otpauth_url = await setup_mfa(db, admin.admin)
    
    # Generate QR code URL (using Google Charts API for simplicity)
    import urllib.parse
    qr_code_url = f"https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl={urllib.parse.quote(otpauth_url)}"
    
    return MfaSetupOut(
        secret=secret,
        otpauth_url=otpauth_url,
        qr_code_url=qr_code_url,
    )


@router.post("/mfa/verify", response_model=MfaVerifyOut)
async def mfa_verify(
    request: Request,
    payload: MfaVerifyIn,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Verify MFA code and enable MFA if valid."""
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    if admin.admin.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="MFA is already enabled",
        )
    
    success, backup_codes = await enable_mfa(db, admin.admin, payload.code)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA code",
        )
    
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.MFA_ENABLED,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return MfaVerifyOut(enabled=True, backup_codes=backup_codes)


@router.post("/mfa/disable")
async def mfa_disable(
    request: Request,
    payload: MfaVerifyIn,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Disable MFA (requires current MFA code for verification)."""
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    if not admin.admin.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled",
        )
    
    # Verify current MFA code before disabling
    if not await verify_mfa_code(admin.admin, payload.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA code",
        )
    
    await disable_mfa(db, admin.admin)
    
    await create_audit_log(
        db=db,
        admin_id=admin.admin.id,
        action=AdminAuditAction.MFA_DISABLED,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {"disabled": True}
