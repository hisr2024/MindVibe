"""Security headers middleware for comprehensive HTTP security.

This middleware adds security headers to all HTTP responses to protect
against common web vulnerabilities like XSS, clickjacking, and MIME-type sniffing.

KIAAN Impact: ✅ POSITIVE - Better protection against XSS/CSRF attacks, no response changes.
"""

from typing import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add comprehensive security headers to all HTTP responses.
    
    Security Headers Added:
    - X-Content-Type-Options: nosniff - Prevents MIME-type sniffing
    - X-Frame-Options: DENY - Prevents clickjacking
    - X-XSS-Protection: 1; mode=block - Enables browser XSS filter
    - Strict-Transport-Security: max-age=31536000; includeSubDomains - HSTS
    - Content-Security-Policy: Restricts resource loading
    - Referrer-Policy: strict-origin-when-cross-origin - Controls referrer info
    - Permissions-Policy: Restricts browser features
    """

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request and add security headers to response."""
        response = await call_next(request)
        
        # X-Content-Type-Options: Prevents MIME-type sniffing attacks
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options: Prevents clickjacking by denying framing
        response.headers["X-Frame-Options"] = "DENY"
        
        # X-XSS-Protection: Enables browser's built-in XSS filter
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Strict-Transport-Security: Enforces HTTPS for 1 year
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        
        # Content-Security-Policy: Restricts resource loading
        # Configured to allow necessary functionality while maintaining security
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        
        # Referrer-Policy: Controls referrer information sent
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions-Policy: Restricts browser features
        # Note: microphone=(self) allows microphone access for KIAAN Voice feature
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
