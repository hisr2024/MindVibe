"""JWT token utilities."""

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from backend.core.settings import settings


def create_access_token(user_id: str, session_id: str) -> str:
    """Create a new access token."""
    payload = {
        "sub": user_id,
        "sid": session_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an access token."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
