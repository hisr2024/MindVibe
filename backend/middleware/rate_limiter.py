"""Rate limiting middleware using slowapi — IP + user-based.

This module provides rate limiting for API endpoints to prevent abuse:
- Auth endpoints: 5 requests/minute (strict - prevents brute force)
- Chat endpoints: 30 requests/minute (moderate - allows conversation)
- Wisdom API: 60 requests/minute (relaxed - read-heavy operations)

Architecture Decision: Per-Endpoint + User-Based Rate Limiting
--------------------------------------------------------------
Each endpoint category has its own independent rate limit rather than a
shared global limit. This is intentional because:

1. Different operations have different costs (auth is more sensitive than reads)
2. Allows legitimate usage patterns (browsing wisdom while chatting)
3. Prevents one endpoint's load from blocking another
4. Aligns with spiritual wellness app UX (don't block someone in crisis)

User-Based Limiting (v2.0):
- Authenticated requests are keyed by user_id (from JWT/session)
- Unauthenticated requests fall back to IP-based limiting
- Prevents NAT-sharing issues where multiple users share one IP
"""

import logging
from starlette.requests import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.core.settings import settings

logger = logging.getLogger(__name__)


def _get_rate_limit_key(request: Request) -> str:
    """Extract the rate-limit key: user_id for authenticated requests, IP otherwise.

    This ensures that:
    - Authenticated users get individual rate limits regardless of shared IP (NAT)
    - Unauthenticated users fall back to IP-based limits
    - The key is deterministic and consistent across requests
    """
    # Try to get user_id from request state (set by auth middleware)
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"

    # Try Authorization header (JWT token -> extract sub claim without full verification)
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            import base64
            import json
            token = auth_header[7:]
            # Decode JWT payload (middle segment) without verification — just for key extraction
            payload_b64 = token.split(".")[1]
            # Add padding
            padding = 4 - len(payload_b64) % 4
            payload_b64 += "=" * padding
            payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            sub = payload.get("sub") or payload.get("user_id")
            if sub:
                return f"user:{sub}"
        except Exception:
            pass  # Fall through to IP-based

    # Try session cookie
    session_token = request.cookies.get("session_token")
    if session_token:
        return f"session:{session_token[:16]}"

    # Fallback: IP address
    return get_remote_address(request)


# Initialize the rate limiter with user-aware key function
limiter = Limiter(
    key_func=_get_rate_limit_key,
    enabled=settings.RATE_LIMIT_ENABLED,
    default_limits=["100/minute"],  # Default limit for unspecified endpoints
)

# Rate limit constants for different endpoint categories
# These limits are INDEPENDENT - a user can hit each endpoint up to its limit
AUTH_RATE_LIMIT = "5/minute"      # Strict: prevents brute force attacks
CHAT_RATE_LIMIT = "30/minute"     # Moderate: allows active conversation
WISDOM_RATE_LIMIT = "60/minute"   # Relaxed: read-heavy, low cost operations
