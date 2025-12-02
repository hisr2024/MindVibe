"""Security middleware package."""

from backend.middleware.security import SecurityHeadersMiddleware
from backend.middleware.rate_limiter import limiter, AUTH_RATE_LIMIT, CHAT_RATE_LIMIT, WISDOM_RATE_LIMIT
from backend.middleware.csrf import CSRFMiddleware, CSRF_HEADER_NAME, CSRF_COOKIE_NAME
from backend.middleware.input_sanitizer import (
    InputSanitizerMiddleware,
    sanitize_user_input,
    validate_input_safety,
    detect_xss,
    detect_sql_injection,
    detect_path_traversal,
)

__all__ = [
    "SecurityHeadersMiddleware",
    "limiter",
    "AUTH_RATE_LIMIT",
    "CHAT_RATE_LIMIT",
    "WISDOM_RATE_LIMIT",
    "CSRFMiddleware",
    "CSRF_HEADER_NAME",
    "CSRF_COOKIE_NAME",
    "InputSanitizerMiddleware",
    "sanitize_user_input",
    "validate_input_safety",
    "detect_xss",
    "detect_sql_injection",
    "detect_path_traversal",
]
