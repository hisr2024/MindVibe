"""Rate limiting middleware using slowapi.

This module provides rate limiting for API endpoints to prevent abuse:
- Auth endpoints: 5 requests/minute (strict - prevents brute force)
- Chat endpoints: 30 requests/minute (moderate - allows conversation)
- Wisdom API: 60 requests/minute (relaxed - read-heavy operations)

Architecture Decision: Per-Endpoint Rate Limiting
-------------------------------------------------
Each endpoint category has its own independent rate limit rather than a
shared global limit. This is intentional because:

1. Different operations have different costs (auth is more sensitive than reads)
2. Allows legitimate usage patterns (browsing wisdom while chatting)
3. Prevents one endpoint's load from blocking another
4. Aligns with spiritual wellness app UX (don't block someone in crisis)

If a shared user-level limit is needed in the future, implement a Redis-backed
counter that tracks total requests across all endpoints per user_id.

KIAAN Impact: POSITIVE - Prevents abuse, ensures availability for legitimate users.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.core.settings import settings

# Initialize the rate limiter with client IP as the key
# Note: For authenticated users, consider switching to user_id-based limiting
# to prevent rate limit sharing across users behind the same NAT
limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.RATE_LIMIT_ENABLED,
    default_limits=["100/minute"],  # Default limit for unspecified endpoints
)

# Rate limit constants for different endpoint categories
# These limits are INDEPENDENT - a user can hit each endpoint up to its limit
AUTH_RATE_LIMIT = "5/minute"      # Strict: prevents brute force attacks
CHAT_RATE_LIMIT = "30/minute"     # Moderate: allows active conversation
WISDOM_RATE_LIMIT = "60/minute"   # Relaxed: read-heavy, low cost operations
