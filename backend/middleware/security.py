"""Security headers middleware for comprehensive HTTP security.

This middleware adds security headers to all HTTP responses to protect
against common web vulnerabilities like XSS, clickjacking, and MIME-type sniffing.
"""

import secrets
import os
from typing import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


# Backend API URL for connect-src (frontend needs to reach the API)
_FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
_API_URL = os.getenv("API_URL", os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000"))


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add comprehensive security headers to all HTTP responses.

    Security Headers Added:
    - X-Content-Type-Options: nosniff - Prevents MIME-type sniffing
    - X-Frame-Options: DENY - Prevents clickjacking
    - Strict-Transport-Security: max-age=31536000; includeSubDomains - HSTS
    - Content-Security-Policy: Restricts resource loading with nonce-based script policy
    - Referrer-Policy: strict-origin-when-cross-origin - Controls referrer info
    - Permissions-Policy: Restricts browser features
    """

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request and add security headers to response."""
        # Generate a per-request nonce for CSP
        csp_nonce = secrets.token_urlsafe(16)
        request.state.csp_nonce = csp_nonce

        response = await call_next(request)

        # X-Content-Type-Options: Prevents MIME-type sniffing attacks
        response.headers["X-Content-Type-Options"] = "nosniff"

        # X-Frame-Options: Prevents clickjacking by denying framing
        response.headers["X-Frame-Options"] = "DENY"

        # Strict-Transport-Security: Enforces HTTPS for 1 year with preload
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # Content-Security-Policy: Restricts resource loading
        # Uses nonce-based policy for scripts instead of 'unsafe-inline'
        # This ensures only scripts with the correct nonce can execute
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            f"script-src 'self' 'nonce-{csp_nonce}'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://fonts.gstatic.com; "
            f"connect-src 'self' {_API_URL} {_FRONTEND_URL}; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )

        # Referrer-Policy: Controls referrer information sent
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions-Policy: Restricts browser features
        # microphone=(self) allows KIAAN Voice to access the microphone
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(self), "
            "payment=(), "
            "usb=()"
        )

        return response
