"""Rate limiting middleware using slowapi.

This module provides rate limiting for API endpoints to prevent abuse:
- Auth endpoints: 5 requests/minute
- Chat endpoints: 30 requests/minute  
- Wisdom API: 60 requests/minute

KIAAN Impact: ✅ POSITIVE - Prevents abuse, ensures availability for legitimate users.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.core.settings import settings

# Initialize the rate limiter with client IP as the key
limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.RATE_LIMIT_ENABLED,
    default_limits=["100/minute"],  # Default limit for unspecified endpoints
)

# Rate limit constants for different endpoint categories
AUTH_RATE_LIMIT = "5/minute"
CHAT_RATE_LIMIT = "30/minute"
WISDOM_RATE_LIMIT = "60/minute"
