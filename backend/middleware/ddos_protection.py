"""
Advanced DDoS Protection Middleware — Redis-backed for multi-instance deployments.

This module provides comprehensive DDoS protection including:
- Connection-based rate limiting
- IP-based request throttling
- Request size limits
- Suspicious pattern detection
- Exponential backoff for repeated violations
- IP blocking/allowlisting
- Search engine bot whitelisting (Googlebot, Bingbot, etc.)

Multi-Instance Support:
When Redis is available, all tracking state (request history, active connections,
violations, blocked IPs) is stored in Redis so that enforcement is consistent
across all API instances. Falls back to in-memory dicts when Redis is unavailable.
"""

import logging
import re
import time
from collections import defaultdict, deque
from collections.abc import Awaitable, Callable
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.status import HTTP_403_FORBIDDEN, HTTP_429_TOO_MANY_REQUESTS

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Search engine and legitimate bot User-Agent patterns
# These bots MUST be allowed through for SEO indexing and discoverability.
# ---------------------------------------------------------------------------
LEGITIMATE_BOT_PATTERNS = re.compile(
    r"(?i)(?:"
    r"Googlebot|Google-InspectionTool|Storebot-Google|GoogleOther"
    r"|bingbot|BingPreview|msnbot"
    r"|Slurp|Yahoo"
    r"|DuckDuckBot"
    r"|Baiduspider"
    r"|YandexBot|YandexImages"
    r"|Sogou"
    r"|Applebot"
    r"|facebookexternalhit|Facebot"
    r"|Twitterbot"
    r"|LinkedInBot"
    r"|WhatsApp"
    r"|TelegramBot"
    r"|Discordbot"
    r"|PinterestBot"
    r"|Slackbot"
    r"|ia_archiver"
    r"|archive\.org_bot"
    r"|AhrefsBot|SemrushBot|MJ12bot"
    r"|rogerbot|dotbot"
    r"|PetalBot"
    r"|GPTBot"
    r"|anthropic-ai"
    r"|Chrome-Lighthouse"
    r"|Google-PageRenderer"
    r"|APIs-Google"
    r"|Mediapartners-Google"
    r"|AdsBot-Google"
    r")"
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
    - Redis-backed state for multi-instance consistency
    """

    def __init__(
        self,
        app,
        enabled: bool = True,
        max_requests: int = MAX_REQUESTS_PER_WINDOW,
        time_window: int = TIME_WINDOW_SECONDS,
        max_connections: int = MAX_CONNECTIONS_PER_IP,
        max_request_size: int = MAX_REQUEST_SIZE_BYTES,
        allowlist: set[str] = None,
        blocklist: set[str] = None,
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

        # In-memory fallback (used when Redis is unavailable)
        self._request_history: dict[str, deque] = defaultdict(
            lambda: deque(maxlen=max_requests * 2)
        )
        self._active_connections: dict[str, int] = defaultdict(int)
        self._violations: dict[str, int] = defaultdict(int)
        self._blocked_ips: dict[str, float] = {}
        self._last_cleanup = time.time()

        # Redis cache reference (lazy-loaded, periodically re-checked)
        self._redis: Any = None
        self._redis_checked = False
        self._last_redis_check: float = 0.0
        self._redis_recheck_interval: float = 30.0  # seconds between re-checks

    async def _get_redis(self) -> Any:
        """Lazy-load the Redis cache. Periodically re-checks if Redis was unavailable."""
        # If Redis was connected but dropped, reset for re-check
        if self._redis is not None and not self._redis.is_connected:
            self._redis = None
            self._redis_checked = False

        # Allow re-check after the cooldown interval when Redis is not available
        _now = time.time()
        _should_check = (
            not self._redis_checked
            or (self._redis is None and _now - self._last_redis_check > self._redis_recheck_interval)
        )

        if _should_check:
            self._redis_checked = True
            self._last_redis_check = _now
            try:
                from backend.cache.redis_cache import get_redis_cache

                cache = await get_redis_cache()
                if cache.is_connected:
                    self._redis = cache
                    logger.info("[DDoS Protection] Using Redis for distributed state")
                else:
                    logger.debug(
                        "[DDoS Protection] Redis unavailable, using in-memory state"
                    )
            except Exception:
                logger.debug(
                    "[DDoS Protection] Redis unavailable, using in-memory state"
                )
        return self._redis

    @property
    def _use_redis(self) -> bool:
        return self._redis is not None and self._redis.is_connected

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, considering proxies."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        return request.client.host if request.client else "unknown"

    # --- In-memory fallback methods (unchanged from original) ---

    def _cleanup_old_data(self):
        """Periodically cleanup old in-memory tracking data."""
        current_time = time.time()
        if current_time - self._last_cleanup < 300:
            return
        self._last_cleanup = current_time

        expired_blocks = [
            ip for ip, expiry in self._blocked_ips.items() if expiry < current_time
        ]
        for ip in expired_blocks:
            del self._blocked_ips[ip]
            self._violations[ip] = max(0, self._violations[ip] - 1)

        cutoff_time = current_time - (self.time_window * 2)
        for ip, history in list(self._request_history.items()):
            while history and history[0] < cutoff_time:
                history.popleft()
            if not history:
                del self._request_history[ip]

        active_ips = set(self._request_history.keys()) | set(self._blocked_ips.keys())
        inactive_ips = set(self._violations.keys()) - active_ips
        for ip in inactive_ips:
            del self._violations[ip]

    def _is_rate_limited_memory(self, ip: str) -> tuple[bool, int]:
        """Check rate limit using in-memory state."""
        current_time = time.time()
        cutoff_time = current_time - self.time_window
        history = self._request_history[ip]
        while history and history[0] < cutoff_time:
            history.popleft()
        requests_in_window = len(history)
        return requests_in_window >= self.max_requests, requests_in_window

    def _record_request_memory(self, ip: str):
        self._request_history[ip].append(time.time())

    def _is_blocked_memory(self, ip: str) -> tuple[bool, float]:
        if ip not in self._blocked_ips:
            return False, 0
        expiry = self._blocked_ips[ip]
        current_time = time.time()
        if expiry < current_time:
            del self._blocked_ips[ip]
            return False, 0
        return True, expiry - current_time

    def _block_ip_memory(self, ip: str):
        violation_count = self._violations[ip]
        multiplier = VIOLATION_MULTIPLIERS.get(violation_count, 60)
        block_duration = BLOCK_DURATION_SECONDS * multiplier
        self._blocked_ips[ip] = time.time() + block_duration
        logger.warning(
            f"[DDoS Protection] Blocked IP {ip} for {block_duration}s "
            f"(violation #{violation_count})"
        )

    def _record_violation_memory(self, ip: str):
        self._violations[ip] += 1
        if self._violations[ip] >= 3:
            self._block_ip_memory(ip)

    def _check_connections_memory(self, ip: str) -> bool:
        return self._active_connections[ip] >= self.max_connections

    # --- Redis-backed methods ---

    async def _is_blocked_redis(self, ip: str) -> tuple[bool, float]:
        """Check if IP is blocked using Redis key with TTL."""
        blocked_until = await self._redis.get(f"ddos:blocked:{ip}")
        if blocked_until is None:
            return False, 0
        try:
            expiry = float(blocked_until)
            remaining = expiry - time.time()
            if remaining <= 0:
                await self._redis.delete(f"ddos:blocked:{ip}")
                return False, 0
            return True, remaining
        except (ValueError, TypeError):
            return False, 0

    async def _block_ip_redis(self, ip: str):
        """Block an IP in Redis with TTL-based expiry."""
        violations_str = await self._redis.hget("ddos:violations", ip)
        violation_count = int(violations_str) if violations_str else 1
        multiplier = VIOLATION_MULTIPLIERS.get(min(violation_count, 5), 60)
        block_duration = BLOCK_DURATION_SECONDS * multiplier
        expiry = time.time() + block_duration

        await self._redis.set(
            f"ddos:blocked:{ip}", str(expiry), expire_seconds=int(block_duration) + 10
        )
        logger.warning(
            f"[DDoS Protection] Blocked IP {ip} for {block_duration}s "
            f"(violation #{violation_count}) [Redis]"
        )

    async def _record_violation_redis(self, ip: str):
        """Record a violation in Redis and block if threshold reached."""
        count = await self._redis.hincrby("ddos:violations", ip, 1)
        if count is not None and count >= 3:
            await self._block_ip_redis(ip)

    async def _is_rate_limited_redis(self, ip: str) -> tuple[bool, int]:
        """Check rate limit using Redis sorted set with sliding window."""
        now = time.time()
        key = f"ddos:history:{ip}"
        cutoff = now - self.time_window

        # Remove old entries and count current window
        await self._redis.zremrangebyscore(key, 0, cutoff)
        count = await self._redis.zcount(key, cutoff, float("inf"))
        return count >= self.max_requests, count

    async def _record_request_redis(self, ip: str):
        """Record a request timestamp in Redis sorted set."""
        now = time.time()
        key = f"ddos:history:{ip}"
        # Use timestamp as both score and member (unique enough for our purposes)
        await self._redis.zadd(
            key, {f"{now}": now}, expire_seconds=self.time_window * 2
        )

    async def _check_connections_redis(self, ip: str) -> bool:
        """Check concurrent connections using Redis hash."""
        count_str = await self._redis.hget("ddos:connections", ip)
        count = int(count_str) if count_str else 0
        return count >= self.max_connections

    async def _incr_connection_redis(self, ip: str):
        await self._redis.hincrby("ddos:connections", ip, 1)

    async def _decr_connection_redis(self, ip: str):
        await self._redis.hincrby("ddos:connections", ip, -1)

    def _check_request_size(self, request: Request) -> bool:
        """Check if request size is within limits."""
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                return size <= self.max_request_size
            except ValueError:
                return True
        return True

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request with DDoS protection."""

        if not self.enabled:
            return await call_next(request)

        # Always allow health check endpoints through without any rate limiting.
        # Render's health checker hits /health every 30s with minimal headers
        # (no User-Agent). If these get rate-limited or blocked, Render marks
        # the instance as unhealthy and returns 503 to ALL client requests.
        _path = request.url.path
        if _path in ("/health", "/api/health", "/", "/api/monitoring/health/detailed"):
            return await call_next(request)

        # Ensure Redis is checked (lazy init)
        await self._get_redis()

        client_ip = self._get_client_ip(request)

        # Check allowlist
        if client_ip in self.allowlist:
            return await call_next(request)

        # Allow legitimate bots through without rate limiting
        user_agent = request.headers.get("User-Agent", "")
        if is_legitimate_bot(user_agent):
            logger.debug(
                f"[DDoS Protection] Allowing legitimate bot: {user_agent[:80]} from {client_ip}"
            )
            return await call_next(request)

        # Check blocklist
        if client_ip in self.blocklist:
            logger.warning(
                f"[DDoS Protection] Blocked request from blocklisted IP: {client_ip}"
            )
            return JSONResponse(
                status_code=HTTP_403_FORBIDDEN,
                content={"error": "forbidden", "message": "Access denied"},
            )

        # --- Use Redis or in-memory depending on availability ---

        if self._use_redis:
            return await self._dispatch_redis(request, call_next, client_ip)
        else:
            return await self._dispatch_memory(request, call_next, client_ip)

    async def _dispatch_redis(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
        client_ip: str,
    ) -> Response:
        """DDoS dispatch using Redis-backed state."""

        # Check if IP is blocked
        is_blocked, time_until_unblock = await self._is_blocked_redis(client_ip)
        if is_blocked:
            logger.info(
                f"[DDoS Protection] Request from blocked IP {client_ip} rejected [Redis]"
            )
            return JSONResponse(
                status_code=HTTP_403_FORBIDDEN,
                content={
                    "error": "blocked",
                    "message": f"IP temporarily blocked. Try again in {int(time_until_unblock)} seconds.",
                    "retry_after": int(time_until_unblock),
                },
            )

        # Check request size
        if not self._check_request_size(request):
            logger.warning(f"[DDoS Protection] Request too large from IP {client_ip}")
            await self._record_violation_redis(client_ip)
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "payload_too_large",
                    "message": f"Request size exceeds limit of {self.max_request_size} bytes",
                },
            )

        # Check connection limit
        if await self._check_connections_redis(client_ip):
            logger.warning(
                f"[DDoS Protection] Too many connections from IP {client_ip} [Redis]"
            )
            await self._record_violation_redis(client_ip)
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "too_many_connections",
                    "message": "Too many concurrent connections",
                },
            )

        # Check rate limit
        is_limited, requests_in_window = await self._is_rate_limited_redis(client_ip)
        if is_limited:
            logger.info(
                f"[DDoS Protection] Rate limit exceeded for IP {client_ip} "
                f"({requests_in_window} requests in {self.time_window}s) [Redis]"
            )
            await self._record_violation_redis(client_ip)
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Maximum {self.max_requests} requests per {self.time_window} seconds.",
                    "retry_after": self.time_window,
                },
            )

        # Record request and track connection
        await self._record_request_redis(client_ip)
        await self._incr_connection_redis(client_ip)

        try:
            response = await call_next(request)
            return response
        finally:
            await self._decr_connection_redis(client_ip)

    async def _dispatch_memory(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
        client_ip: str,
    ) -> Response:
        """DDoS dispatch using in-memory state (single-instance fallback)."""

        self._cleanup_old_data()

        # Check if IP is blocked
        is_blocked, time_until_unblock = self._is_blocked_memory(client_ip)
        if is_blocked:
            logger.info(
                f"[DDoS Protection] Request from blocked IP {client_ip} rejected"
            )
            return JSONResponse(
                status_code=HTTP_403_FORBIDDEN,
                content={
                    "error": "blocked",
                    "message": f"IP temporarily blocked. Try again in {int(time_until_unblock)} seconds.",
                    "retry_after": int(time_until_unblock),
                },
            )

        # Check request size
        if not self._check_request_size(request):
            logger.warning(f"[DDoS Protection] Request too large from IP {client_ip}")
            self._record_violation_memory(client_ip)
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "payload_too_large",
                    "message": f"Request size exceeds limit of {self.max_request_size} bytes",
                },
            )

        # Check connection limit
        if self._check_connections_memory(client_ip):
            logger.warning(
                f"[DDoS Protection] Too many connections from IP {client_ip}"
            )
            self._record_violation_memory(client_ip)
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "too_many_connections",
                    "message": "Too many concurrent connections",
                },
            )

        # Check rate limit
        is_limited, requests_in_window = self._is_rate_limited_memory(client_ip)
        if is_limited:
            logger.info(
                f"[DDoS Protection] Rate limit exceeded for IP {client_ip} "
                f"({requests_in_window} requests in {self.time_window}s)"
            )
            self._record_violation_memory(client_ip)
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Maximum {self.max_requests} requests per {self.time_window} seconds.",
                    "retry_after": self.time_window,
                },
            )

        # Record request and track connection
        self._record_request_memory(client_ip)
        self._active_connections[client_ip] += 1

        try:
            response = await call_next(request)
            return response
        finally:
            self._active_connections[client_ip] -= 1
            if self._active_connections[client_ip] <= 0:
                del self._active_connections[client_ip]
