"""Rate limiting middleware using slowapi — IP + user-based, Redis-backed for multi-instance.

This module provides rate limiting for API endpoints to prevent abuse:
- Auth endpoints: 15 requests/minute (strict - prevents brute force)
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

Multi-Instance Support (v3.0):
- When REDIS_ENABLED=true, rate limits are stored in Redis so all instances
  share a single counter per key. Falls back to in-memory if Redis is unavailable.
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

    # Try Authorization header — use a hash of the raw token as a rate-limit key.
    # SECURITY: We intentionally do NOT decode JWT claims here because the rate
    # limiter runs BEFORE auth middleware.  Trusting unverified claims would let
    # an attacker forge a JWT with any "sub" to (a) evade their own rate limits
    # by rotating user_ids, or (b) exhaust another user's rate-limit bucket (DoS).
    # Hashing the raw token produces a deterministic, per-token key that is safe
    # against both attacks while still giving each real token its own bucket.
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        import hashlib
        token = auth_header[7:]
        if token:
            token_hash = hashlib.sha256(token.encode()).hexdigest()[:32]
            return f"token:{token_hash}"

    # Try session cookie
    session_token = request.cookies.get("session_token")
    if session_token:
        return f"session:{session_token[:16]}"

    # Fallback: IP address — prefer X-Forwarded-For from proxy so each real
    # client gets its own rate-limit bucket.  Without this, ALL users behind
    # the Vercel/Next.js proxy share a single bucket (the proxy server IP),
    # meaning 5 login attempts total per minute across ALL users globally.
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For may contain multiple IPs; the leftmost is the client
        client_ip = forwarded_for.split(",")[0].strip()
        if client_ip:
            return client_ip

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    return get_remote_address(request)


def _get_storage_uri() -> str | None:
    """Return Redis URL for distributed rate limiting, or None for in-memory.

    When Redis is enabled, slowapi uses Redis as its storage backend so that
    rate limit counters are shared across all API instances. This prevents
    users from bypassing limits by hitting different instances.
    """
    if settings.REDIS_ENABLED:
        try:
            # Verify Redis URL is set and usable
            redis_url = settings.REDIS_URL
            if redis_url and redis_url.startswith("redis"):
                logger.info("Rate limiter using Redis storage for distributed limiting")
                return redis_url
        except Exception as e:
            logger.warning("Failed to configure Redis storage for rate limiter: %s", e)
    logger.info("Rate limiter using in-memory storage (single-instance only)")
    return None


# Initialize the rate limiter with user-aware key function and Redis storage
limiter = Limiter(
    key_func=_get_rate_limit_key,
    enabled=settings.RATE_LIMIT_ENABLED,
    default_limits=["100/minute"],
    storage_uri=_get_storage_uri(),
)

# Rate limit constants for different endpoint categories
# These limits are INDEPENDENT - a user can hit each endpoint up to its limit
AUTH_RATE_LIMIT = "15/minute"     # Per-IP limit; generous enough for proxy scenarios
                                  # while still preventing brute force (lockout at 5 failed attempts)
CHAT_RATE_LIMIT = "30/minute"     # Moderate: allows active conversation
WISDOM_RATE_LIMIT = "60/minute"   # Relaxed: read-heavy, low cost operations
