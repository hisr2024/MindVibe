"""Simple RBAC scaffolding built on JWT role claims."""
from __future__ import annotations

from enum import Enum
from typing import Iterable

from fastapi import HTTPException, Request, status

from backend.security.jwt import decode_access_token


class Role(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"
    SUPPORT = "support"
    SYSTEM = "system"


def _normalize_roles(roles: Iterable[Role | str]) -> set[str]:
    return {role.value if isinstance(role, Role) else str(role) for role in roles}


def require_roles(*roles: Role | str):
    required = _normalize_roles(roles)

    async def dependency(request: Request):
        auth_header = request.headers.get("Authorization", "")
        token = None
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()

        payload = getattr(request.state, "auth_payload", None)
        if not payload and token:
            payload = decode_access_token(token)
        role = payload.get("role") if payload else None

        if role not in required:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "forbidden",
                    "message": "You do not have permission to access this resource",
                    "required_roles": sorted(required),
                    "role": role,
                },
            )

        request.state.auth_payload = payload
        return payload

    return dependency


__all__ = ["Role", "require_roles"]
