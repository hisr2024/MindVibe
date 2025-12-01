"""JWT token utilities."""

import os
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from backend.core.settings import settings


def create_access_token(user_id: str, session_id: str, role: str = "member") -> str:
    """Create a new access token with role claims."""

    payload = {
        "sub": user_id,
        "sid": session_id,
        "role": role,
        "exp": datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an access token."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
