"""
Advanced DDoS Protection Middleware

This module provides comprehensive DDoS protection including:
- Connection-based rate limiting
- IP-based request throttling
- Request size limits
- Suspicious pattern detection
- Exponential backoff for repeated violations
- IP blocking/allowlisting
- Search engine bot whitelisting (Googlebot, Bingbot, etc.)
"""

import re
import time
import logging
from collections import defaultdict, deque
from typing import Awaitable, Callable, Dict, Set, Tuple
from datetime import datetime, timedelta

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.status import HTTP_429_TOO_MANY_REQUESTS, HTTP_403_FORBIDDEN

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Search engine and legitimate bot User-Agent patterns
# These bots MUST be allowed through for SEO indexing and discoverability.
# ---------------------------------------------------------------------------
LEGITIMATE_BOT_PATTERNS = re.compile(
    r'(?i)(?:'
    r'Googlebot|Google-InspectionTool|Storebot-Google|GoogleOther'
    r'|bingbot|BingPreview|msnbot'
    r'|Slurp|Yahoo'
    r'|DuckDuckBot'
    r'|Baiduspider'
    r'|YandexBot|YandexImages'
    r'|Sogou'
    r'|Applebot'
    r'|facebookexternalhit|Facebot'
    r'|Twitterbot'
    r'|LinkedInBot'
    r'|WhatsApp'
    r'|TelegramBot'
    r'|Discordbot'
    r'|PinterestBot'
    r'|Slackbot'
    r'|ia_archiver'
    r'|archive\.org_bot'
    r'|AhrefsBot|SemrushBot|MJ12bot'
    r'|rogerbot|dotbot'
    r'|PetalBot'
    r'|GPTBot'
    r'|anthropic-ai'
    r'|Chrome-Lighthouse'
    r'|Google-PageRenderer'
    r'|APIs-Google'
    r'|Mediapartners-Google'
    r'|AdsBot-Google'
    r')'
)


def is_legitimate_bot(user_agent: str) -> bool:
    """Check if a User-Agent belongs to a known legitimate bot/crawler."""
    if not user_agent:
        return False
    return bool(LEGITIMATE_BOT_PATTERNS.search(user_agent))

# Configuration constants
MAX_REQUESTS_PER_WINDOW = 100  # Maximum requests per time window
TIME_WINDOW_SECONDS = 60  # Time window in seconds
MAX_CONNECTIONS_PER_IP = 10  # Maximum concurrent connections per IP
MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024  # 10MB max request size
BLOCK_DURATION_SECONDS = 300  # 5 minutes block duration
SUSPICIOUS_REQUEST_THRESHOLD = 50  # Requests per second to be considered suspicious

# Exponential backoff multipliers
VIOLATION_MULTIPLIERS = {
    1: 1,
    2: 2,
    3: 5,
    4: 10,
    5: 30,
}


class DDoSProtectionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to protect against DDoS attacks.
    
    Features:
    - Per-IP rate limiting with sliding window
    - Connection tracking and limiting
    - Request size validation
    - Automatic IP blocking for repeated violations
    - Exponential backoff for persistent attackers
    - Allowlist/blocklist support
    """

    def __init__(
        self, 
        app,
        enabled: bool = True,
        max_requests: int = MAX_REQUESTS_PER_WINDOW,
        time_window: int = TIME_WINDOW_SECONDS,
        max_connections: int = MAX_CONNECTIONS_PER_IP,
        max_request_size: int = MAX_REQUEST_SIZE_BYTES,
        allowlist: Set[str] = None,
        blocklist: Set[str] = None,
    ):
        """
        Initialize DDoS protection middleware.
        
        Args:
            app: ASGI application
            enabled: Whether protection is enabled
            max_requests: Max requests per time window
            time_window: Time window in seconds
            max_connections: Max concurrent connections per IP
            max_request_size: Max request size in bytes
            allowlist: Set of IP addresses to always allow
            blocklist: Set of IP addresses to always block
        """
        super().__init__(app)
        self.enabled = enabled
        self.max_requests = max_requests
        self.time_window = time_window
        self.max_connections = max_connections
        self.max_request_size = max_request_size
        self.allowlist = allowlist or set()
        self.blocklist = blocklist or set()

        # Request tracking - IP -> deque of timestamps
        self.request_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_requests * 2))
        
        # Connection tracking - IP -> count
        self.active_connections: Dict[str, int] = defaultdict(int)
        
        # Violation tracking - IP -> violation count
        self.violations: Dict[str, int] = defaultdict(int)
        
        # Blocked IPs - IP -> block expiry timestamp
        self.blocked_ips: Dict[str, float] = {}
        
        # Last cleanup time
        self.last_cleanup = time.time()

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, considering proxies."""
        # Check X-Forwarded-For header (from reverse proxies)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take the first IP in the chain (original client)
            return forwarded.split(",")[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fallback to direct connection IP
        return request.client.host if request.client else "unknown"

    def _cleanup_old_data(self):
        """Periodically cleanup old tracking data to prevent memory leaks."""
        current_time = time.time()
        
        # Only cleanup every 5 minutes
        if current_time - self.last_cleanup < 300:
            return
        
        self.last_cleanup = current_time
        
        # Remove expired blocks
        expired_blocks = [
            ip for ip, expiry in self.blocked_ips.items()
            if expiry < current_time
        ]
        for ip in expired_blocks:
            del self.blocked_ips[ip]
            # Reset violation count when block expires
            self.violations[ip] = max(0, self.violations[ip] - 1)
        
        # Cleanup old request history (older than 2x time window)
        cutoff_time = current_time - (self.time_window * 2)
        for ip, history in list(self.request_history.items()):
            # Remove old timestamps
            while history and history[0] < cutoff_time:
                history.popleft()
            
            # Remove empty histories
            if not history:
                del self.request_history[ip]
        
        # Cleanup violations for IPs with no recent activity
        active_ips = set(self.request_history.keys()) | set(self.blocked_ips.keys())
        inactive_ips = set(self.violations.keys()) - active_ips
        for ip in inactive_ips:
            del self.violations[ip]

    def _is_rate_limited(self, ip: str) -> Tuple[bool, int]:
        """
        Check if IP is rate limited.
        
        Returns:
            (is_limited, requests_in_window)
        """
        current_time = time.time()
        cutoff_time = current_time - self.time_window
        
        # Get request history for this IP
        history = self.request_history[ip]
        
        # Remove old requests outside the time window
        while history and history[0] < cutoff_time:
            history.popleft()
        
        # Count requests in current window
        requests_in_window = len(history)
        
        # Check if limit exceeded
        is_limited = requests_in_window >= self.max_requests
        
        return is_limited, requests_in_window

    def _record_request(self, ip: str):
        """Record a request timestamp for an IP."""
        current_time = time.time()
        self.request_history[ip].append(current_time)

    def _is_blocked(self, ip: str) -> Tuple[bool, float]:
        """
        Check if IP is blocked.
        
        Returns:
            (is_blocked, time_until_unblock)
        """
        if ip not in self.blocked_ips:
            return False, 0
        
        expiry = self.blocked_ips[ip]
        current_time = time.time()
        
        if expiry < current_time:
            # Block expired
            del self.blocked_ips[ip]
            return False, 0
        
        return True, expiry - current_time

    def _block_ip(self, ip: str):
        """Block an IP address with exponential backoff."""
        violation_count = self.violations[ip]
        multiplier = VIOLATION_MULTIPLIERS.get(violation_count, 60)
        block_duration = BLOCK_DURATION_SECONDS * multiplier
        
        self.blocked_ips[ip] = time.time() + block_duration
        
        logger.warning(
            f"[DDoS Protection] Blocked IP {ip} for {block_duration}s "
            f"(violation #{violation_count})"
        )

    def _record_violation(self, ip: str):
        """Record a violation and potentially block the IP."""
        self.violations[ip] += 1
        violation_count = self.violations[ip]
        
        # Block after 3 violations
        if violation_count >= 3:
            self._block_ip(ip)

    def _check_request_size(self, request: Request) -> bool:
        """Check if request size is within limits."""
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                return size <= self.max_request_size
            except ValueError:
                return True  # Invalid header, let it through
        return True

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request with DDoS protection."""
        
        # Skip if disabled
        if not self.enabled:
            return await call_next(request)

        # Periodic cleanup
        self._cleanup_old_data()

        # Get client IP
        client_ip = self._get_client_ip(request)

        # Check allowlist
        if client_ip in self.allowlist:
            return await call_next(request)

        # Allow legitimate search engine bots and social media crawlers
        # through without rate limiting — critical for SEO indexing
        user_agent = request.headers.get("User-Agent", "")
        if is_legitimate_bot(user_agent):
            logger.debug(
                f"[DDoS Protection] Allowing legitimate bot: {user_agent[:80]} from {client_ip}"
            )
            return await call_next(request)
        
        # Check blocklist
        if client_ip in self.blocklist:
            logger.warning(f"[DDoS Protection] Blocked request from blocklisted IP: {client_ip}")
            return JSONResponse(
                status_code=HTTP_403_FORBIDDEN,
                content={
                    "error": "forbidden",
                    "message": "Access denied",
                }
            )
        
        # Check if IP is currently blocked
        is_blocked, time_until_unblock = self._is_blocked(client_ip)
        if is_blocked:
            logger.info(f"[DDoS Protection] Request from blocked IP {client_ip} rejected")
            return JSONResponse(
                status_code=HTTP_403_FORBIDDEN,
                content={
                    "error": "blocked",
                    "message": f"IP temporarily blocked. Try again in {int(time_until_unblock)} seconds.",
                    "retry_after": int(time_until_unblock),
                }
            )
        
        # Check request size
        if not self._check_request_size(request):
            logger.warning(f"[DDoS Protection] Request too large from IP {client_ip}")
            self._record_violation(client_ip)
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "payload_too_large",
                    "message": f"Request size exceeds limit of {self.max_request_size} bytes",
                }
            )
        
        # Check connection limit
        if self.active_connections[client_ip] >= self.max_connections:
            logger.warning(f"[DDoS Protection] Too many connections from IP {client_ip}")
            self._record_violation(client_ip)
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "too_many_connections",
                    "message": "Too many concurrent connections",
                }
            )
        
        # Check rate limit
        is_limited, requests_in_window = self._is_rate_limited(client_ip)
        if is_limited:
            logger.info(
                f"[DDoS Protection] Rate limit exceeded for IP {client_ip} "
                f"({requests_in_window} requests in {self.time_window}s)"
            )
            self._record_violation(client_ip)
            
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Maximum {self.max_requests} requests per {self.time_window} seconds.",
                    "retry_after": self.time_window,
                }
            )
        
        # Record this request
        self._record_request(client_ip)
        
        # Track connection
        self.active_connections[client_ip] += 1
        
        try:
            # Process request
            response = await call_next(request)
            return response
        finally:
            # Decrement connection count
            self.active_connections[client_ip] -= 1
            if self.active_connections[client_ip] <= 0:
                del self.active_connections[client_ip]
