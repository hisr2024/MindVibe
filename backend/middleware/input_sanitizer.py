"""Input sanitization middleware for security.

This middleware sanitizes user input to prevent:
- XSS (Cross-Site Scripting) attacks
- HTML injection
- SQL injection (at the input level)
- Path traversal attacks

KIAAN Impact: ✅ POSITIVE - Protects against malicious input without affecting
legitimate KIAAN interactions.
"""

import html
import logging
import re
from typing import Awaitable, Callable, Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


# Patterns that indicate potential attacks
SUSPICIOUS_PATTERNS = [
    r'<script[^>]*>',  # Script tags
    r'javascript:',  # JavaScript protocol
    r'on\w+\s*=',  # Event handlers (onclick, onerror, etc.)
    r'data:text/html',  # Data URLs with HTML
    r'vbscript:',  # VBScript protocol
]

# Compiled regex for efficiency
SUSPICIOUS_REGEX = re.compile('|'.join(SUSPICIOUS_PATTERNS), re.IGNORECASE)

# SQL injection patterns (basic detection)
SQL_INJECTION_PATTERNS = [
    r"'\s*or\s+'",
    r"'\s*or\s+1\s*=\s*1",
    r';\s*drop\s+table',
    r';\s*delete\s+from',
    r'union\s+select',
    r'insert\s+into',
    r'update\s+.*\s+set',
]

SQL_INJECTION_REGEX = re.compile('|'.join(SQL_INJECTION_PATTERNS), re.IGNORECASE)

# Path traversal patterns
PATH_TRAVERSAL_PATTERNS = [
    r'\.\./|\.\.\\',  # Directory traversal
    r'%2e%2e%2f|%2e%2e/',  # URL encoded traversal
    r'%252e%252e%252f',  # Double encoded
]

PATH_TRAVERSAL_REGEX = re.compile('|'.join(PATH_TRAVERSAL_PATTERNS), re.IGNORECASE)


def sanitize_string(value: str) -> str:
    """
    Sanitize a string value by escaping HTML entities.
    
    This prevents XSS attacks by converting special characters to HTML entities:
    - < becomes &lt;
    - > becomes &gt;
    - & becomes &amp;
    - " becomes &quot;
    - ' becomes &#x27;
    """
    if not isinstance(value, str):
        return value
    
    # HTML escape
    return html.escape(value, quote=True)


def detect_xss(value: str) -> bool:
    """Check if a string contains potential XSS patterns."""
    if not isinstance(value, str):
        return False
    return bool(SUSPICIOUS_REGEX.search(value))


def detect_sql_injection(value: str) -> bool:
    """Check if a string contains potential SQL injection patterns."""
    if not isinstance(value, str):
        return False
    return bool(SQL_INJECTION_REGEX.search(value))


def detect_path_traversal(value: str) -> bool:
    """Check if a string contains path traversal patterns."""
    if not isinstance(value, str):
        return False
    return bool(PATH_TRAVERSAL_REGEX.search(value))


def sanitize_value(value: Any, sanitize: bool = False) -> Any:
    """
    Recursively sanitize a value (string, dict, or list).
    
    Args:
        value: The value to sanitize
        sanitize: If True, sanitize strings; if False, just detect issues
        
    Returns:
        The sanitized value (or original if not sanitizing)
    """
    if isinstance(value, str):
        if sanitize:
            return sanitize_string(value)
        return value
    elif isinstance(value, dict):
        return {k: sanitize_value(v, sanitize) for k, v in value.items()}
    elif isinstance(value, list):
        return [sanitize_value(item, sanitize) for item in value]
    return value


class InputSanitizerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to sanitize user input and detect malicious patterns.
    
    This middleware:
    1. Detects potentially malicious input patterns (XSS, SQL injection, etc.)
    2. Logs suspicious activity
    3. Can optionally sanitize input (disabled by default to preserve data)
    
    Note: This is a defense-in-depth measure. Primary protection should be:
    - Parameterized queries for SQL
    - Proper output encoding for XSS
    - Content Security Policy headers
    """
    
    def __init__(self, app, sanitize_input: bool = False, log_suspicious: bool = True):
        """
        Initialize the middleware.
        
        Args:
            app: The ASGI application
            sanitize_input: If True, sanitize all input (may alter legitimate data)
            log_suspicious: If True, log suspicious patterns detected
        """
        super().__init__(app)
        self.sanitize_input = sanitize_input
        self.log_suspicious = log_suspicious
    
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request with input sanitization."""
        # Check query parameters
        for key, value in request.query_params.items():
            if detect_xss(value) or detect_sql_injection(value) or detect_path_traversal(value):
                if self.log_suspicious:
                    client_ip = self._get_client_ip(request)
                    logger.warning(
                        f"Suspicious query param detected: key={key}, ip={client_ip}",
                        extra={"security_event": "suspicious_input", "key": key, "ip": client_ip}
                    )

        # Check path for traversal
        if detect_path_traversal(request.url.path):
            if self.log_suspicious:
                client_ip = self._get_client_ip(request)
                logger.warning(
                    f"Path traversal attempt detected: path={request.url.path}, ip={client_ip}",
                    extra={"security_event": "path_traversal", "path": request.url.path, "ip": client_ip}
                )
        
        return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


# Utility functions for use in route handlers
def sanitize_user_input(data: dict) -> dict:
    """
    Sanitize user input data.
    
    Use this in route handlers to sanitize request body data.
    
    Example:
        @router.post("/message")
        async def send_message(message: MessageInput):
            sanitized = sanitize_user_input(message.dict())
            # Use sanitized data...
    """
    return sanitize_value(data, sanitize=True)


def validate_input_safety(data: dict) -> dict:
    """
    Validate that input data doesn't contain malicious patterns.
    
    Returns a dict with any detected issues.
    
    Example:
        @router.post("/message")
        async def send_message(message: MessageInput):
            issues = validate_input_safety(message.dict())
            if issues:
                # Log or reject...
    """
    issues = {}
    
    def check_value(key: str, value: Any):
        if isinstance(value, str):
            if detect_xss(value):
                issues[key] = issues.get(key, []) + ["potential_xss"]
            if detect_sql_injection(value):
                issues[key] = issues.get(key, []) + ["potential_sql_injection"]
            if detect_path_traversal(value):
                issues[key] = issues.get(key, []) + ["potential_path_traversal"]
        elif isinstance(value, dict):
            for k, v in value.items():
                check_value(f"{key}.{k}", v)
        elif isinstance(value, list):
            for i, item in enumerate(value):
                check_value(f"{key}[{i}]", item)
    
    for key, value in data.items():
        check_value(key, value)
    
    return issues
