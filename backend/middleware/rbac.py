"""RBAC (Role-Based Access Control) middleware for admin routes."""

from functools import wraps
from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import (
    AdminUser,
    AdminSession,
    AdminPermission,
    AdminPermissionAssignment,
    AdminRole,
    ROLE_PERMISSIONS,
)
from backend.security.jwt import decode_access_token
from backend.services.admin_auth_service import (
    get_admin_by_id,
    get_admin_session,
    is_session_active,
    touch_admin_session,
)


class AdminContext:
    """Context object containing admin user and session information."""
    
    def __init__(
        self,
        admin: AdminUser,
        session: AdminSession,
        permissions: set[AdminPermission],
    ):
        self.admin = admin
        self.session = session
        self.permissions = permissions
    
    def has_permission(self, permission: AdminPermission) -> bool:
        """Check if admin has a specific permission."""
        return permission in self.permissions
    
    def has_any_permission(self, *permissions: AdminPermission) -> bool:
        """Check if admin has any of the specified permissions."""
        return any(p in self.permissions for p in permissions)
    
    def has_all_permissions(self, *permissions: AdminPermission) -> bool:
        """Check if admin has all of the specified permissions."""
        return all(p in self.permissions for p in permissions)


async def get_admin_permissions(
    db: AsyncSession,
    admin: AdminUser
) -> set[AdminPermission]:
    """Get all permissions for an admin user (role-based + custom assignments)."""
    # Get role-based permissions
    role_perms = set(ROLE_PERMISSIONS.get(admin.role, []))
    
    # Get custom permission assignments
    stmt = select(AdminPermissionAssignment).where(
        AdminPermissionAssignment.admin_id == admin.id
    )
    result = await db.execute(stmt)
    assignments = result.scalars().all()
    
    for assignment in assignments:
        if assignment.granted:
            role_perms.add(assignment.permission)
        else:
            role_perms.discard(assignment.permission)
    
    return role_perms


async def get_current_admin(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AdminContext:
    """
    FastAPI dependency to get the current authenticated admin.
    Validates JWT token, session, and builds admin context with permissions.
    """
    # Extract Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ", 1)[1].strip()
    
    # Decode JWT token
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify it's an admin token
    if not payload.get("admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    admin_id = payload.get("sub")
    session_id = payload.get("sid")
    
    if not admin_id or not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token structure",
        )
    
    # Get admin user
    admin = await get_admin_by_id(db, admin_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found",
        )
    
    # Check if admin is active
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is deactivated",
        )
    
    # Get and validate session
    session = await get_admin_session(db, session_id)
    if not session or not is_session_active(session):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )
    
    # Update session activity
    await touch_admin_session(db, session)
    
    # Get admin permissions
    permissions = await get_admin_permissions(db, admin)
    
    return AdminContext(admin=admin, session=session, permissions=permissions)


def require_permission(*required_permissions: AdminPermission):
    """
    Decorator to require specific permissions for an endpoint.
    
    Usage:
        @router.get("/users")
        @require_permission(AdminPermission.USERS_VIEW)
        async def list_users(admin: AdminContext = Depends(get_current_admin)):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get admin context from kwargs (set by FastAPI dependency)
            admin_ctx = kwargs.get("admin")
            if not admin_ctx:
                # Try to find it in args (less common)
                for arg in args:
                    if isinstance(arg, AdminContext):
                        admin_ctx = arg
                        break
            
            if not admin_ctx:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Admin context not found",
                )
            
            # Check permissions
            if not admin_ctx.has_all_permissions(*required_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permissions: {[p.value for p in required_permissions]}",
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(*required_permissions: AdminPermission):
    """
    Decorator to require any of the specified permissions for an endpoint.
    
    Usage:
        @router.get("/users")
        @require_any_permission(AdminPermission.USERS_VIEW, AdminPermission.USERS_EDIT)
        async def list_users(admin: AdminContext = Depends(get_current_admin)):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            admin_ctx = kwargs.get("admin")
            if not admin_ctx:
                for arg in args:
                    if isinstance(arg, AdminContext):
                        admin_ctx = arg
                        break
            
            if not admin_ctx:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Admin context not found",
                )
            
            if not admin_ctx.has_any_permission(*required_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires one of: {[p.value for p in required_permissions]}",
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(*required_roles: AdminRole):
    """
    Decorator to require specific roles for an endpoint.
    
    Usage:
        @router.delete("/admin/{id}")
        @require_role(AdminRole.SUPER_ADMIN)
        async def delete_admin(admin: AdminContext = Depends(get_current_admin)):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            admin_ctx = kwargs.get("admin")
            if not admin_ctx:
                for arg in args:
                    if isinstance(arg, AdminContext):
                        admin_ctx = arg
                        break
            
            if not admin_ctx:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Admin context not found",
                )
            
            if admin_ctx.admin.role not in required_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires role: {[r.value for r in required_roles]}",
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


class PermissionChecker:
    """
    FastAPI dependency for checking permissions inline.
    
    Usage:
        @router.get("/users")
        async def list_users(
            admin: AdminContext = Depends(get_current_admin),
            _: None = Depends(PermissionChecker(AdminPermission.USERS_VIEW)),
        ):
            ...
    """
    
    def __init__(self, *permissions: AdminPermission, require_all: bool = True):
        self.permissions = permissions
        self.require_all = require_all
    
    async def __call__(
        self,
        admin: AdminContext = Depends(get_current_admin),
    ) -> None:
        if self.require_all:
            if not admin.has_all_permissions(*self.permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permissions: {[p.value for p in self.permissions]}",
                )
        else:
            if not admin.has_any_permission(*self.permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires one of: {[p.value for p in self.permissions]}",
                )
