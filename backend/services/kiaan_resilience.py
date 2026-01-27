"""
KIAAN Resilience Module - Retry Logic and Response Caching

This module provides KIAAN with resilience capabilities:
1. Retry Logic - Exponential backoff with jitter
2. Circuit Breaker - Prevent cascade failures
3. Response Caching - Cache expensive operations
4. Rate Limiting - Protect against overload
5. Timeout Management - Consistent timeout handling
"""

import asyncio
import functools
import hashlib
import json
import logging
import os
import random
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Callable, Optional, TypeVar, Generic
from collections import OrderedDict

# Optional Redis support
try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

T = TypeVar('T')


class CircuitState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if recovered


@dataclass
class RetryConfig:
    """Configuration for retry behavior."""
    max_attempts: int = 3
    base_delay_seconds: float = 1.0
    max_delay_seconds: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True
    retryable_exceptions: tuple = (Exception,)
    non_retryable_exceptions: tuple = ()


@dataclass
class CacheConfig:
    """Configuration for caching."""
    ttl_seconds: int = 300  # 5 minutes
    max_size: int = 1000
    use_redis: bool = True
    namespace: str = "kiaan_cache"


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""
    failure_threshold: int = 5  # Failures before opening
    success_threshold: int = 3  # Successes before closing
    timeout_seconds: float = 30.0  # How long to stay open
    half_open_max_calls: int = 3  # Max calls in half-open state


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    burst_size: int = 10


class RetryHandler:
    """
    Handles retry logic with exponential backoff.

    Features:
    - Exponential backoff with configurable base
    - Random jitter to prevent thundering herd
    - Configurable retryable/non-retryable exceptions
    - Maximum delay cap
    """

    def __init__(self, config: Optional[RetryConfig] = None):
        self.config = config or RetryConfig()

    async def execute(
        self,
        func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """
        Execute a function with retry logic.

        Args:
            func: Async function to execute
            *args: Positional arguments
            **kwargs: Keyword arguments

        Returns:
            Function result

        Raises:
            Exception: If all retries exhausted
        """
        last_exception = None

        for attempt in range(1, self.config.max_attempts + 1):
            try:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)

            except self.config.non_retryable_exceptions as e:
                # Don't retry these
                logger.error(f"Non-retryable error: {e}")
                raise

            except self.config.retryable_exceptions as e:
                last_exception = e

                if attempt == self.config.max_attempts:
                    logger.error(f"All {self.config.max_attempts} attempts failed: {e}")
                    raise

                # Calculate delay
                delay = self._calculate_delay(attempt)
                logger.warning(
                    f"Attempt {attempt}/{self.config.max_attempts} failed: {e}. "
                    f"Retrying in {delay:.2f}s"
                )

                await asyncio.sleep(delay)

        raise last_exception

    def _calculate_delay(self, attempt: int) -> float:
        """Calculate delay with exponential backoff and jitter."""
        # Exponential backoff
        delay = self.config.base_delay_seconds * (
            self.config.exponential_base ** (attempt - 1)
        )

        # Cap at max delay
        delay = min(delay, self.config.max_delay_seconds)

        # Add jitter (±25%)
        if self.config.jitter:
            jitter = delay * 0.25 * (2 * random.random() - 1)
            delay += jitter

        return max(0, delay)


def with_retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    retryable_exceptions: tuple = (Exception,)
):
    """
    Decorator for adding retry logic to async functions.

    Usage:
        @with_retry(max_attempts=3, base_delay=1.0)
        async def my_function():
            ...
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            handler = RetryHandler(RetryConfig(
                max_attempts=max_attempts,
                base_delay_seconds=base_delay,
                max_delay_seconds=max_delay,
                retryable_exceptions=retryable_exceptions
            ))
            return await handler.execute(func, *args, **kwargs)
        return wrapper
    return decorator


class CircuitBreaker:
    """
    Circuit breaker pattern implementation.

    Prevents cascade failures by:
    - Opening circuit after threshold failures
    - Rejecting requests while open
    - Testing recovery in half-open state
    """

    def __init__(self, name: str, config: Optional[CircuitBreakerConfig] = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.half_open_calls = 0

        self._lock = asyncio.Lock()

    async def execute(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function through the circuit breaker.

        Args:
            func: Async function to execute
            *args: Positional arguments
            **kwargs: Keyword arguments

        Returns:
            Function result

        Raises:
            CircuitBreakerOpen: If circuit is open
        """
        async with self._lock:
            # Check if we should transition states
            await self._check_state_transition()

            if self.state == CircuitState.OPEN:
                raise CircuitBreakerOpen(
                    f"Circuit breaker '{self.name}' is open"
                )

            if self.state == CircuitState.HALF_OPEN:
                if self.half_open_calls >= self.config.half_open_max_calls:
                    raise CircuitBreakerOpen(
                        f"Circuit breaker '{self.name}' is in half-open state (max calls reached)"
                    )
                self.half_open_calls += 1

        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)

            await self._on_success()
            return result

        except Exception as e:
            await self._on_failure()
            raise

    async def _check_state_transition(self) -> None:
        """Check if state should transition."""
        if self.state == CircuitState.OPEN:
            # Check if timeout has passed
            if self.last_failure_time:
                elapsed = (datetime.now(timezone.utc) - self.last_failure_time).total_seconds()
                if elapsed >= self.config.timeout_seconds:
                    logger.info(f"Circuit breaker '{self.name}' transitioning to half-open")
                    self.state = CircuitState.HALF_OPEN
                    self.half_open_calls = 0

    async def _on_success(self) -> None:
        """Handle successful call."""
        async with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.config.success_threshold:
                    logger.info(f"Circuit breaker '{self.name}' closing")
                    self.state = CircuitState.CLOSED
                    self.failure_count = 0
                    self.success_count = 0
            elif self.state == CircuitState.CLOSED:
                # Reset failure count on success
                self.failure_count = 0

    async def _on_failure(self) -> None:
        """Handle failed call."""
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = datetime.now(timezone.utc)

            if self.state == CircuitState.HALF_OPEN:
                logger.warning(f"Circuit breaker '{self.name}' reopening")
                self.state = CircuitState.OPEN
                self.success_count = 0

            elif self.state == CircuitState.CLOSED:
                if self.failure_count >= self.config.failure_threshold:
                    logger.warning(f"Circuit breaker '{self.name}' opening")
                    self.state = CircuitState.OPEN

    def get_state(self) -> dict:
        """Get current circuit breaker state."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure": self.last_failure_time.isoformat() if self.last_failure_time else None
        }


class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open."""
    pass


class LRUCache(Generic[T]):
    """
    Thread-safe LRU cache with TTL support.

    Features:
    - Configurable max size
    - TTL-based expiration
    - Thread-safe operations
    """

    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._cache: OrderedDict[str, tuple[T, float]] = OrderedDict()
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[T]:
        """Get a value from cache."""
        async with self._lock:
            if key not in self._cache:
                return None

            value, timestamp = self._cache[key]

            # Check TTL
            if time.time() - timestamp > self.ttl_seconds:
                del self._cache[key]
                return None

            # Move to end (most recently used)
            self._cache.move_to_end(key)
            return value

    async def set(self, key: str, value: T) -> None:
        """Set a value in cache."""
        async with self._lock:
            # Remove oldest if at capacity
            while len(self._cache) >= self.max_size:
                self._cache.popitem(last=False)

            self._cache[key] = (value, time.time())

    async def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    async def clear(self) -> None:
        """Clear all entries."""
        async with self._lock:
            self._cache.clear()

    async def cleanup_expired(self) -> int:
        """Remove expired entries."""
        async with self._lock:
            now = time.time()
            expired = [
                k for k, (_, ts) in self._cache.items()
                if now - ts > self.ttl_seconds
            ]
            for k in expired:
                del self._cache[k]
            return len(expired)

    def size(self) -> int:
        """Get current cache size."""
        return len(self._cache)


class ResponseCache:
    """
    Multi-tier response cache for KIAAN.

    Features:
    - In-memory LRU cache (fast)
    - Optional Redis backend (distributed)
    - Automatic cache key generation
    - TTL-based expiration
    """

    def __init__(self, config: Optional[CacheConfig] = None):
        self.config = config or CacheConfig()
        self.local_cache: LRUCache[Any] = LRUCache(
            max_size=self.config.max_size,
            ttl_seconds=self.config.ttl_seconds
        )
        self.redis_client: Optional[Any] = None

    async def initialize(self) -> None:
        """Initialize Redis connection if configured."""
        if self.config.use_redis and REDIS_AVAILABLE:
            redis_url = os.getenv("REDIS_URL")
            if redis_url:
                try:
                    self.redis_client = await aioredis.from_url(redis_url)
                    logger.info("Response cache: Redis connected")
                except Exception as e:
                    logger.warning(f"Response cache: Redis connection failed: {e}")

    def _generate_key(self, *args, **kwargs) -> str:
        """Generate cache key from arguments."""
        key_data = json.dumps({
            "args": [str(a)[:500] for a in args],
            "kwargs": {k: str(v)[:500] for k, v in sorted(kwargs.items())}
        }, sort_keys=True)

        # SECURITY: Use sha256 instead of md5 to avoid collision risk
        key_hash = hashlib.sha256(key_data.encode()).hexdigest()
        return f"{self.config.namespace}:{key_hash}"

    async def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache.

        Checks local cache first, then Redis.
        """
        # Check local cache
        value = await self.local_cache.get(key)
        if value is not None:
            return value

        # Check Redis
        if self.redis_client:
            try:
                data = await self.redis_client.get(key)
                if data:
                    value = json.loads(data)
                    # Populate local cache
                    await self.local_cache.set(key, value)
                    return value
            except Exception as e:
                logger.warning(f"Redis cache get failed: {e}")

        return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: Optional[int] = None
    ) -> None:
        """
        Set a value in cache.

        Writes to both local and Redis cache.
        """
        ttl = ttl_seconds or self.config.ttl_seconds

        # Set in local cache
        await self.local_cache.set(key, value)

        # Set in Redis
        if self.redis_client:
            try:
                await self.redis_client.setex(
                    key,
                    ttl,
                    json.dumps(value, default=str)
                )
            except Exception as e:
                logger.warning(f"Redis cache set failed: {e}")

    async def delete(self, key: str) -> None:
        """Delete a key from both caches."""
        await self.local_cache.delete(key)

        if self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception as e:
                logger.warning(f"Redis cache delete failed: {e}")

    async def get_or_compute(
        self,
        key: str,
        compute_func: Callable,
        *args,
        ttl_seconds: Optional[int] = None,
        **kwargs
    ) -> Any:
        """
        Get value from cache or compute it.

        Args:
            key: Cache key
            compute_func: Async function to compute value if not cached
            *args: Arguments for compute_func
            ttl_seconds: Optional custom TTL
            **kwargs: Keyword arguments for compute_func

        Returns:
            Cached or computed value
        """
        # Try cache first
        cached = await self.get(key)
        if cached is not None:
            return cached

        # Compute value
        if asyncio.iscoroutinefunction(compute_func):
            value = await compute_func(*args, **kwargs)
        else:
            value = compute_func(*args, **kwargs)

        # Cache result
        await self.set(key, value, ttl_seconds)

        return value

    def get_stats(self) -> dict:
        """Get cache statistics."""
        return {
            "local_size": self.local_cache.size(),
            "max_size": self.config.max_size,
            "ttl_seconds": self.config.ttl_seconds,
            "redis_connected": self.redis_client is not None
        }


def cached(
    ttl_seconds: int = 300,
    namespace: str = "kiaan_cache"
):
    """
    Decorator for caching async function results.

    Usage:
        @cached(ttl_seconds=300)
        async def expensive_operation(arg1, arg2):
            ...
    """
    cache = ResponseCache(CacheConfig(
        ttl_seconds=ttl_seconds,
        namespace=namespace
    ))

    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            key = cache._generate_key(func.__name__, *args, **kwargs)
            return await cache.get_or_compute(key, func, *args, **kwargs)
        return wrapper
    return decorator


class RateLimiter:
    """
    Token bucket rate limiter.

    Features:
    - Configurable rates (per minute, per hour)
    - Burst allowance
    - Per-user or global limiting
    """

    def __init__(self, config: Optional[RateLimitConfig] = None):
        self.config = config or RateLimitConfig()
        self._buckets: dict[str, dict] = {}
        self._lock = asyncio.Lock()

    async def is_allowed(self, key: str = "global") -> bool:
        """
        Check if request is allowed.

        Args:
            key: Identifier for rate limit bucket (user_id, ip, etc.)

        Returns:
            True if allowed, False if rate limited
        """
        async with self._lock:
            now = time.time()

            if key not in self._buckets:
                self._buckets[key] = {
                    "tokens": self.config.burst_size,
                    "last_update": now,
                    "minute_count": 0,
                    "minute_start": now,
                    "hour_count": 0,
                    "hour_start": now
                }

            bucket = self._buckets[key]

            # Refill tokens based on time passed
            elapsed = now - bucket["last_update"]
            tokens_to_add = elapsed * (self.config.requests_per_minute / 60)
            bucket["tokens"] = min(
                self.config.burst_size,
                bucket["tokens"] + tokens_to_add
            )
            bucket["last_update"] = now

            # Reset minute counter
            if now - bucket["minute_start"] > 60:
                bucket["minute_count"] = 0
                bucket["minute_start"] = now

            # Reset hour counter
            if now - bucket["hour_start"] > 3600:
                bucket["hour_count"] = 0
                bucket["hour_start"] = now

            # Check limits
            if bucket["tokens"] < 1:
                return False

            if bucket["minute_count"] >= self.config.requests_per_minute:
                return False

            if bucket["hour_count"] >= self.config.requests_per_hour:
                return False

            # Consume token
            bucket["tokens"] -= 1
            bucket["minute_count"] += 1
            bucket["hour_count"] += 1

            return True

    async def wait_for_token(
        self,
        key: str = "global",
        timeout: float = 30.0
    ) -> bool:
        """
        Wait for a token to become available.

        Args:
            key: Identifier for rate limit bucket
            timeout: Maximum time to wait

        Returns:
            True if token acquired, False if timeout
        """
        start = time.time()

        while time.time() - start < timeout:
            if await self.is_allowed(key):
                return True

            await asyncio.sleep(0.1)

        return False

    def get_limits(self, key: str = "global") -> dict:
        """Get current limit status."""
        if key not in self._buckets:
            return {
                "tokens_available": self.config.burst_size,
                "minute_remaining": self.config.requests_per_minute,
                "hour_remaining": self.config.requests_per_hour
            }

        bucket = self._buckets[key]
        return {
            "tokens_available": int(bucket["tokens"]),
            "minute_remaining": self.config.requests_per_minute - bucket["minute_count"],
            "hour_remaining": self.config.requests_per_hour - bucket["hour_count"]
        }


class TimeoutManager:
    """
    Centralized timeout management.

    Features:
    - Configurable timeouts per operation type
    - Deadline propagation
    - Timeout tracking
    """

    DEFAULT_TIMEOUTS = {
        "default": 30.0,
        "api_call": 60.0,
        "tool_execution": 120.0,
        "code_execution": 30.0,
        "web_search": 45.0,
        "database_query": 30.0,
        "file_operation": 15.0
    }

    def __init__(self, custom_timeouts: Optional[dict] = None):
        self.timeouts = {**self.DEFAULT_TIMEOUTS, **(custom_timeouts or {})}

    def get_timeout(self, operation: str) -> float:
        """Get timeout for an operation."""
        return self.timeouts.get(operation, self.timeouts["default"])

    async def with_timeout(
        self,
        func: Callable,
        operation: str,
        *args,
        timeout_override: Optional[float] = None,
        **kwargs
    ) -> Any:
        """
        Execute a function with timeout.

        Args:
            func: Async function to execute
            operation: Operation type for timeout lookup
            *args: Positional arguments
            timeout_override: Override default timeout
            **kwargs: Keyword arguments

        Returns:
            Function result

        Raises:
            asyncio.TimeoutError: If timeout exceeded
        """
        timeout = timeout_override or self.get_timeout(operation)

        try:
            return await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            logger.warning(f"Operation '{operation}' timed out after {timeout}s")
            raise


# Singleton instances
response_cache = ResponseCache()
rate_limiter = RateLimiter()
timeout_manager = TimeoutManager()


# Export
__all__ = [
    "RetryHandler",
    "RetryConfig",
    "with_retry",
    "CircuitBreaker",
    "CircuitBreakerConfig",
    "CircuitBreakerOpen",
    "CircuitState",
    "LRUCache",
    "ResponseCache",
    "CacheConfig",
    "cached",
    "RateLimiter",
    "RateLimitConfig",
    "TimeoutManager",
    "response_cache",
    "rate_limiter",
    "timeout_manager"
]
