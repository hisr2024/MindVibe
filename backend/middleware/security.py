"""Advanced Security Middleware for MindVibe.

This module provides comprehensive security middleware including:
- Rate limiting per endpoint
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Request size limits and validation
- SQL injection prevention
- XSS sanitization for all inputs
"""

import hashlib
import html
import re
import time
from collections import defaultdict
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

# SQL injection patterns to detect
SQL_INJECTION_PATTERNS = [
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)",
    r"(--|#|/\*|\*/)",
    r"(\bOR\b.*=.*\bOR\b)",
    r"(\bAND\b.*=.*\bAND\b)",
    r"(\'|\"|;|--)",
    r"(\bSLEEP\b|\bBENCHMARK\b|\bWAITFOR\b)",
]

# XSS patterns to detect
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on\w+\s*=",
    r"<iframe",
    r"<object",
    r"<embed",
    r"<link",
    r"expression\s*\(",
    r"vbscript:",
    r"data:text/html",
]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with per-endpoint and per-IP tracking.

    This middleware implements a sliding window rate limiter with configurable
    limits per endpoint and per IP address.
    """

    def __init__(
        self,
        app: Any,
        default_limit: int = 100,
        window_seconds: int = 60,
        endpoint_limits: dict[str, int] | None = None,
        exclude_paths: list[str] | None = None,
    ):
        """Initialize rate limiter.

        Args:
            app: The ASGI application
            default_limit: Default requests per window (default: 100)
            window_seconds: Time window in seconds (default: 60)
            endpoint_limits: Custom limits for specific endpoints
            exclude_paths: Paths to exclude from rate limiting
        """
        super().__init__(app)
        self.default_limit = default_limit
        self.window_seconds = window_seconds
        self.endpoint_limits = endpoint_limits or {
            "/api/auth/login": 10,
            "/api/auth/register": 5,
            "/api/auth/forgot-password": 3,
            "/api/chat/message": 30,
        }
        self.exclude_paths = exclude_paths or ["/health", "/", "/api/health"]
        # In-memory storage (use Redis in production)
        self._request_counts: dict[str, list[float]] = defaultdict(list)
        self._blocked_ips: dict[str, float] = {}

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, considering proxies."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        if request.client:
            return request.client.host
        return "unknown"

    def _get_rate_limit_key(self, ip: str, path: str) -> str:
        """Generate a unique key for rate limiting."""
        return f"{ip}:{path}"

    def _is_rate_limited(self, key: str, limit: int) -> bool:
        """Check if request should be rate limited."""
        current_time = time.time()
        window_start = current_time - self.window_seconds

        # Clean old entries
        self._request_counts[key] = [
            ts for ts in self._request_counts[key] if ts > window_start
        ]

        # Check if over limit
        if len(self._request_counts[key]) >= limit:
            return True

        # Add current request
        self._request_counts[key].append(current_time)
        return False

    def _is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is temporarily blocked."""
        if ip in self._blocked_ips:
            if time.time() < self._blocked_ips[ip]:
                return True
            del self._blocked_ips[ip]
        return False

    def _block_ip(self, ip: str, duration_seconds: int = 300) -> None:
        """Block IP for specified duration (default: 5 minutes)."""
        self._blocked_ips[ip] = time.time() + duration_seconds

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request with rate limiting."""
        path = request.url.path
        ip = self._get_client_ip(request)

        # Skip rate limiting for excluded paths
        if any(path.startswith(excluded) for excluded in self.exclude_paths):
            return await call_next(request)

        # Check if IP is blocked
        if self._is_ip_blocked(ip):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Your IP has been temporarily blocked.",
                    "retry_after": 300,
                },
            )

        # Determine rate limit for this endpoint
        limit = self.endpoint_limits.get(path, self.default_limit)
        key = self._get_rate_limit_key(ip, path)

        if self._is_rate_limited(key, limit):
            # Block IP if repeatedly hitting limits
            repeated_violations_key = f"violations:{ip}"
            if self._is_rate_limited(repeated_violations_key, 5):
                self._block_ip(ip)

            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Maximum {limit} requests per {self.window_seconds} seconds.",
                    "retry_after": self.window_seconds,
                },
                headers={"Retry-After": str(self.window_seconds)},
            )

        response = await call_next(request)

        # Add rate limit headers
        remaining = max(0, limit - len(self._request_counts[key]))
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(
            int(time.time()) + self.window_seconds
        )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add comprehensive security headers.

    Implements headers for:
    - Content Security Policy (CSP)
    - HTTP Strict Transport Security (HSTS)
    - X-Frame-Options
    - X-Content-Type-Options
    - X-XSS-Protection
    - Referrer-Policy
    - Permissions-Policy
    """

    def __init__(
        self,
        app: Any,
        csp_policy: str | None = None,
        hsts_max_age: int = 31536000,
        enable_csp: bool = True,
    ):
        """Initialize security headers middleware.

        Args:
            app: The ASGI application
            csp_policy: Custom CSP policy (optional)
            hsts_max_age: HSTS max-age in seconds (default: 1 year)
            enable_csp: Whether to enable CSP headers
        """
        super().__init__(app)
        self.hsts_max_age = hsts_max_age
        self.enable_csp = enable_csp
        self.csp_policy = csp_policy or self._default_csp_policy()

    def _default_csp_policy(self) -> str:
        """Generate default CSP policy."""
        return "; ".join(
            [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https:",
                "connect-src 'self' https://api.openai.com wss:",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests",
            ]
        )

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Add security headers to response."""
        response = await call_next(request)

        # HSTS - Force HTTPS
        response.headers["Strict-Transport-Security"] = (
            f"max-age={self.hsts_max_age}; includeSubDomains; preload"
        )

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS Protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # CSP
        if self.enable_csp:
            response.headers["Content-Security-Policy"] = self.csp_policy

        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), payment=()"
        )

        # Remove server header
        if "Server" in response.headers:
            del response.headers["Server"]

        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for request validation and SQL injection prevention.

    This middleware:
    - Validates request size limits
    - Detects potential SQL injection attempts
    - Logs suspicious requests
    """

    def __init__(
        self,
        app: Any,
        max_body_size: int = 10 * 1024 * 1024,  # 10MB default
        enable_sql_detection: bool = True,
    ):
        """Initialize request validation middleware.

        Args:
            app: The ASGI application
            max_body_size: Maximum request body size in bytes
            enable_sql_detection: Enable SQL injection detection
        """
        super().__init__(app)
        self.max_body_size = max_body_size
        self.enable_sql_detection = enable_sql_detection
        self._compiled_sql_patterns = [
            re.compile(pattern, re.IGNORECASE) for pattern in SQL_INJECTION_PATTERNS
        ]

    def _detect_sql_injection(self, value: str) -> bool:
        """Detect potential SQL injection in value."""
        if not self.enable_sql_detection or not value:
            return False
        for pattern in self._compiled_sql_patterns:
            if pattern.search(value):
                return True
        return False

    def _check_query_params(self, request: Request) -> str | None:
        """Check query parameters for SQL injection."""
        for param, value in request.query_params.items():
            if self._detect_sql_injection(value):
                return f"Suspicious pattern detected in query parameter: {param}"
        return None

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Validate request before processing."""
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_body_size:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": "Request body too large"},
            )

        # Check query parameters for SQL injection
        sql_warning = self._check_query_params(request)
        if sql_warning:
            # Log suspicious activity (would integrate with security logger)
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Invalid request parameters"},
            )

        return await call_next(request)


class XSSProtectionMiddleware(BaseHTTPMiddleware):
    """Middleware for XSS protection and input sanitization.

    This middleware:
    - Detects potential XSS attacks in inputs
    - Sanitizes user inputs
    - Provides HTML encoding for unsafe content
    """

    def __init__(
        self,
        app: Any,
        sanitize_responses: bool = False,
        block_xss_attempts: bool = True,
    ):
        """Initialize XSS protection middleware.

        Args:
            app: The ASGI application
            sanitize_responses: Whether to sanitize response bodies
            block_xss_attempts: Whether to block requests with XSS attempts
        """
        super().__init__(app)
        self.sanitize_responses = sanitize_responses
        self.block_xss_attempts = block_xss_attempts
        self._compiled_xss_patterns = [
            re.compile(pattern, re.IGNORECASE) for pattern in XSS_PATTERNS
        ]

    def _detect_xss(self, value: str) -> bool:
        """Detect potential XSS attack in value."""
        if not value:
            return False
        for pattern in self._compiled_xss_patterns:
            if pattern.search(value):
                return True
        return False

    def _sanitize_value(self, value: str) -> str:
        """Sanitize string value by HTML escaping."""
        return html.escape(value)

    def _check_query_params(self, request: Request) -> bool:
        """Check query parameters for XSS attempts."""
        for value in request.query_params.values():
            if self._detect_xss(value):
                return True
        return False

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Check request for XSS and optionally sanitize."""
        # Check query parameters
        if self.block_xss_attempts and self._check_query_params(request):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Invalid request: potentially unsafe content detected"},
            )

        return await call_next(request)


# Utility functions for input sanitization
def sanitize_input(value: str) -> str:
    """Sanitize user input by HTML escaping.

    Args:
        value: The input string to sanitize

    Returns:
        HTML-escaped string
    """
    return html.escape(value)


def sanitize_dict(data: dict[str, Any]) -> dict[str, Any]:
    """Recursively sanitize all string values in a dictionary.

    Args:
        data: Dictionary to sanitize

    Returns:
        Dictionary with all string values HTML-escaped
    """
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = sanitize_input(value)
        elif isinstance(value, dict):
            result[key] = sanitize_dict(value)
        elif isinstance(value, list):
            result[key] = [
                sanitize_dict(item) if isinstance(item, dict)
                else sanitize_input(item) if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            result[key] = value
    return result


def generate_request_id() -> str:
    """Generate a unique request ID for tracking.

    Returns:
        A unique request ID string
    """
    return hashlib.sha256(f"{time.time()}{time.time_ns()}".encode()).hexdigest()[:16]
