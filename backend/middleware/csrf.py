"""CSRF Protection middleware for state-changing requests.

This middleware implements CSRF protection using the Synchronizer Token Pattern:
- Generates a CSRF token for each session
- Validates the token on state-changing requests (POST, PUT, PATCH, DELETE)
- Exempt paths are strictly limited to webhooks and pre-authentication endpoints
"""

import logging
import secrets
import hmac
from typing import Awaitable, Callable, Set

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

logger = logging.getLogger(__name__)


# Paths exempt from CSRF protection.
# SECURITY: Keep this list minimal. Only exempt endpoints that:
# 1. Have no existing session to protect (login/signup)
# 2. Use their own signature verification (webhooks)
# 3. Are read-only health checks
CSRF_EXEMPT_PATHS: Set[str] = {
    # Webhook endpoints - use their own signature verification (e.g., Stripe signatures)
    "/api/webhooks/stripe",
    "/api/webhooks/payment",
    # Health check endpoints - read-only, no state changes
    "/health",
    "/",
    "/api/health",
    # Auth endpoints - no session exists yet to protect against CSRF
    # Rate limiting protects against brute force on these endpoints
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    # Admin login - no session exists yet
    "/api/admin/auth/login",
    # WebAuthn authentication - no session exists yet (biometric login)
    # Rate limiting protects against brute force
    "/api/auth/webauthn/authenticate/options",
    "/api/auth/webauthn/authenticate/verify",
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
    3. Exempt paths skip CSRF validation (webhooks, health checks, pre-auth)

    SECURITY: CSRF validation is enforced regardless of whether an Authorization
    header is present. When using httpOnly cookies for auth, CSRF protection is
    essential because browsers automatically attach cookies to cross-origin requests.

    Frontend integration:
    - Read the csrf_token cookie (not httpOnly, readable by JS)
    - Include it in the X-CSRF-Token header for all state-changing requests
    """

    def __init__(
        self,
        app,
        cookie_secure: bool = True,
        cookie_samesite: str = "lax",
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

        # Check if path is exempt (exact match only - no prefix matching for security)
        is_exempt = path in CSRF_EXEMPT_PATHS

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
                    httponly=False,  # Must be readable by JS to include in headers
                    samesite=self.cookie_samesite,
                    secure=self.cookie_secure,
                    max_age=86400,  # 24 hours
                )

            return response

        # For state-changing methods, validate CSRF token (unless exempt)
        if method in CSRF_PROTECTED_METHODS and not is_exempt:
            # Only skip CSRF if there are absolutely no auth cookies present
            # (i.e., this is a purely stateless API call with no browser session)
            has_auth_cookies = (
                request.cookies.get("access_token")
                or request.cookies.get(CSRF_COOKIE_NAME)
                or request.cookies.get("refresh_token")
            )

            if not has_auth_cookies:
                # No cookies at all - this is a non-browser API client
                # CSRF attacks rely on browsers auto-sending cookies,
                # so CSRF protection is not needed for cookieless requests
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
                        logger.warning("CSRF token parsing failed", exc_info=True)

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
