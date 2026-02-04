"""CSRF Protection middleware for state-changing requests.

This middleware implements CSRF protection using the Synchronizer Token Pattern:
- Generates a CSRF token for each session
- Validates the token on state-changing requests (POST, PUT, PATCH, DELETE)
- Exempt paths can be configured for webhook endpoints

KIAAN Impact: ✅ POSITIVE - Adds security without affecting KIAAN response quality.
"""

import secrets
import hmac
import hashlib
from typing import Awaitable, Callable, Set

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse


# Paths that are exempt from CSRF protection (webhooks, server-to-server APIs, etc.)
# Note: Chat endpoints are called server-to-server from Next.js API routes,
# which are trusted internal calls. CSRF protection is for browser-based attacks.
#
# Auth endpoints are exempt because:
# 1. Login/signup don't have an existing session to protect
# 2. Rate limiting protects against brute force attacks
# 3. CSRF is for protecting authenticated sessions, not login forms
# 4. Cross-origin proxy setups (Vercel->Render) can't share CSRF cookies
CSRF_EXEMPT_PATHS: Set[str] = {
    "/api/webhooks/stripe",
    "/api/webhooks/payment",
    "/health",
    "/",
    "/api/health",
    # Auth endpoints - exempt because no session exists yet to protect
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/logout",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    # KIAAN Chat endpoints - called from Next.js server-side API routes
    "/api/chat/message",
    "/api/chat/message/stream",
    "/api/chat/start",
    # Journey endpoints - need to work with cross-origin proxy
    "/api/journeys/access",
    "/api/journeys/catalog",
    "/api/journeys/start",
    "/api/journeys/active",
    "/api/journeys/today",
    # Wisdom journey endpoints - only exempt safe read operations
    # State-changing operations (POST/PUT/DELETE) on specific paths still need CSRF
    # but the base path is exempt for GET catalog/recommendations
    "/api/wisdom-journey/catalog",
    "/api/wisdom-journey/recommendations",
    "/api/wisdom-journey/active",
    # Journey Engine - cross-origin API, uses Bearer token auth
    "/api/journey-engine/templates",
    "/api/journey-engine/journeys",
    "/api/journey-engine/dashboard",
    "/api/journey-engine/enemies",
    "/api/journey-engine/examples",
    "/api/journey-engine/fix-stuck-journeys",
    "/api/journey-engine/debug",
}

# Methods that require CSRF protection
CSRF_PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# CSRF Token header name
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_COOKIE_NAME = "csrf_token"


def generate_csrf_token() -> str:
    """Generate a secure CSRF token."""
    return secrets.token_urlsafe(32)


def validate_csrf_token(token: str, expected: str) -> bool:
    """Validate CSRF token using constant-time comparison."""
    if not token or not expected:
        return False
    return hmac.compare_digest(token, expected)


class CSRFMiddleware(BaseHTTPMiddleware):
    """Middleware to protect against CSRF attacks.

    How it works:
    1. On GET requests, sets a CSRF token cookie if not present
    2. On state-changing requests (POST, PUT, PATCH, DELETE):
       - Validates the X-CSRF-Token header matches the cookie
       - Returns 403 if validation fails
    3. Exempt paths skip CSRF validation (webhooks, health checks)

    Frontend integration:
    - Read the csrf_token cookie
    - Include it in the X-CSRF-Token header for all state-changing requests

    Args:
        app: The ASGI application to wrap
        cookie_secure: Whether to set the Secure flag on the cookie (HTTPS only)
        cookie_samesite: The SameSite policy for the cookie ("strict", "lax", or "none")
    """

    def __init__(
        self,
        app,
        cookie_secure: bool = True,
        cookie_samesite: str = "strict",
    ):
        super().__init__(app)
        self.cookie_secure = cookie_secure
        self.cookie_samesite = cookie_samesite

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request with CSRF protection."""
        path = request.url.path
        method = request.method.upper()
        
        # Skip CSRF for OPTIONS requests (CORS preflight)
        if method == "OPTIONS":
            return await call_next(request)
        
        # Check if path is exempt
        is_exempt = any(
            path == exempt_path or path.startswith(exempt_path + "/")
            for exempt_path in CSRF_EXEMPT_PATHS
        )
        
        # Get existing CSRF token from cookie
        existing_token = request.cookies.get(CSRF_COOKIE_NAME)
        
        # For GET/HEAD requests, set token if not present
        if method in {"GET", "HEAD"}:
            response = await call_next(request)
            
            # Set CSRF token cookie if not present
            if not existing_token:
                new_token = generate_csrf_token()
                response.set_cookie(
                    key=CSRF_COOKIE_NAME,
                    value=new_token,
                    # httponly=False is required for CSRF tokens so JavaScript can read them
                    # and include them in request headers. This is safe because:
                    # 1. SameSite policy prevents cross-site cookie sending
                    # 2. The token must match what's in the cookie for validation
                    # 3. XSS attacks are mitigated by CSP headers
                    httponly=False,
                    samesite=self.cookie_samesite,
                    secure=self.cookie_secure,
                    max_age=86400,  # 24 hours
                )
            
            return response
        
        # For state-changing methods, validate CSRF token (unless exempt)
        if method in CSRF_PROTECTED_METHODS and not is_exempt:
            # Skip CSRF when no auth cookies are present (token/header auth or anonymous)
            if not request.cookies.get("access_token") and not request.cookies.get(CSRF_COOKIE_NAME):
                return await call_next(request)

            # Skip CSRF for token-based or header-authenticated API calls
            if request.headers.get("Authorization") or request.headers.get("X-Auth-UID"):
                return await call_next(request)

            # Get token from header
            header_token = request.headers.get(CSRF_HEADER_NAME)
            
            # Also check form data for compatibility
            if not header_token:
                content_type = request.headers.get("Content-Type", "")
                if "application/x-www-form-urlencoded" in content_type:
                    try:
                        form = await request.form()
                        header_token = form.get("csrf_token")
                    except Exception:
                        pass
            
            # Validate token
            if not existing_token:
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": "CSRF token missing. Please refresh the page and try again.",
                        "error": "csrf_token_missing",
                    },
                )
            
            if not validate_csrf_token(str(header_token or ""), existing_token):
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": "CSRF token validation failed. Please refresh the page and try again.",
                        "error": "csrf_token_invalid",
                    },
                )
        
        return await call_next(request)
