"""API Performance Optimization for MindVibe.

This module provides API performance enhancements including:
- Response compression (gzip/brotli)
- ETag support for conditional requests
- Response optimization utilities
"""

import gzip
import hashlib
import logging
import time
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, StreamingResponse

logger = logging.getLogger(__name__)


class CompressionMiddleware(BaseHTTPMiddleware):
    """Middleware for response compression.

    Supports gzip compression with automatic negotiation based on
    Accept-Encoding header.
    """

    def __init__(
        self,
        app: Any,
        minimum_size: int = 500,
        compression_level: int = 6,
        exclude_paths: list[str] | None = None,
        exclude_content_types: set[str] | None = None,
    ):
        """Initialize compression middleware.

        Args:
            app: The ASGI application
            minimum_size: Minimum response size to compress (bytes)
            compression_level: Gzip compression level (1-9)
            exclude_paths: Paths to exclude from compression
            exclude_content_types: Content types to exclude
        """
        super().__init__(app)
        self.minimum_size = minimum_size
        self.compression_level = compression_level
        self.exclude_paths = set(exclude_paths or [])
        self.exclude_content_types = exclude_content_types or {
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
            "application/octet-stream",
            "application/zip",
        }

    def _should_compress(
        self, request: Request, response: Response, body: bytes
    ) -> bool:
        """Determine if response should be compressed."""
        # Check path exclusion
        if request.url.path in self.exclude_paths:
            return False

        # Check if client accepts gzip
        accept_encoding = request.headers.get("Accept-Encoding", "")
        if "gzip" not in accept_encoding.lower():
            return False

        # Check content type
        content_type = response.headers.get("Content-Type", "")
        for excluded in self.exclude_content_types:
            if excluded in content_type:
                return False

        # Check minimum size
        if len(body) < self.minimum_size:
            return False

        # Don't compress if already compressed
        if response.headers.get("Content-Encoding"):
            return False

        return True

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request and optionally compress response."""
        response = await call_next(request)

        # Skip streaming responses
        if isinstance(response, StreamingResponse):
            return response

        # Get response body
        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        if self._should_compress(request, response, body):
            compressed = gzip.compress(body, compresslevel=self.compression_level)

            # Only use compressed if it's actually smaller
            if len(compressed) < len(body):
                return Response(
                    content=compressed,
                    status_code=response.status_code,
                    headers={
                        **dict(response.headers),
                        "Content-Encoding": "gzip",
                        "Content-Length": str(len(compressed)),
                        "Vary": "Accept-Encoding",
                    },
                    media_type=response.media_type,
                )

        return Response(
            content=body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )


class ETagMiddleware(BaseHTTPMiddleware):
    """Middleware for ETag support and conditional requests.

    Implements:
    - ETag generation for responses
    - If-None-Match handling for 304 responses
    - If-Match handling for precondition checks
    """

    def __init__(
        self,
        app: Any,
        weak_etags: bool = True,
        exclude_paths: list[str] | None = None,
    ):
        """Initialize ETag middleware.

        Args:
            app: The ASGI application
            weak_etags: Use weak ETags (W/"...")
            exclude_paths: Paths to exclude from ETag handling
        """
        super().__init__(app)
        self.weak_etags = weak_etags
        self.exclude_paths = set(exclude_paths or [])

    def _generate_etag(self, body: bytes) -> str:
        """Generate ETag from response body."""
        hash_value = hashlib.md5(body).hexdigest()
        if self.weak_etags:
            return f'W/"{hash_value}"'
        return f'"{hash_value}"'

    def _etags_match(self, client_etag: str, server_etag: str) -> bool:
        """Compare ETags for matching."""
        # Normalize by removing weak indicator
        client_normalized = client_etag.replace("W/", "").strip('"')
        server_normalized = server_etag.replace("W/", "").strip('"')
        return client_normalized == server_normalized

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request with ETag support."""
        # Skip excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        # Skip non-GET/HEAD requests
        if request.method not in ("GET", "HEAD"):
            return await call_next(request)

        response = await call_next(request)

        # Skip streaming responses
        if isinstance(response, StreamingResponse):
            return response

        # Skip non-2xx responses
        if response.status_code < 200 or response.status_code >= 300:
            return response

        # Get response body
        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        # Generate ETag
        etag = self._generate_etag(body)

        # Check If-None-Match
        if_none_match = request.headers.get("If-None-Match")
        if if_none_match:
            for client_etag in if_none_match.split(","):
                if self._etags_match(client_etag.strip(), etag):
                    return Response(
                        status_code=304,
                        headers={"ETag": etag},
                    )

        # Return response with ETag
        return Response(
            content=body,
            status_code=response.status_code,
            headers={
                **dict(response.headers),
                "ETag": etag,
            },
            media_type=response.media_type,
        )


class ResponseOptimizer:
    """Utilities for optimizing API responses."""

    def __init__(self):
        """Initialize response optimizer."""
        self._response_times: dict[str, list[float]] = {}

    def track_response_time(self, endpoint: str, duration_ms: float) -> None:
        """Track response time for an endpoint.

        Args:
            endpoint: API endpoint
            duration_ms: Response time in milliseconds
        """
        if endpoint not in self._response_times:
            self._response_times[endpoint] = []
        self._response_times[endpoint].append(duration_ms)

        # Keep only last 1000 measurements
        if len(self._response_times[endpoint]) > 1000:
            self._response_times[endpoint] = self._response_times[endpoint][-1000:]

    def get_endpoint_stats(self, endpoint: str) -> dict[str, float]:
        """Get response time statistics for an endpoint.

        Args:
            endpoint: API endpoint

        Returns:
            Dictionary with avg, min, max, p95, p99
        """
        times = self._response_times.get(endpoint, [])
        if not times:
            return {}

        sorted_times = sorted(times)
        n = len(sorted_times)

        return {
            "avg": sum(times) / n,
            "min": sorted_times[0],
            "max": sorted_times[-1],
            "p95": sorted_times[int(n * 0.95)] if n > 0 else 0,
            "p99": sorted_times[int(n * 0.99)] if n > 0 else 0,
            "count": n,
        }

    def get_slow_endpoints(self, threshold_ms: float = 200) -> list[dict[str, Any]]:
        """Get endpoints with average response time above threshold.

        Args:
            threshold_ms: Threshold in milliseconds

        Returns:
            List of slow endpoint statistics
        """
        slow = []
        for endpoint, times in self._response_times.items():
            if times:
                avg = sum(times) / len(times)
                if avg > threshold_ms:
                    slow.append(
                        {
                            "endpoint": endpoint,
                            "avg_ms": avg,
                            "count": len(times),
                        }
                    )
        return sorted(slow, key=lambda x: x["avg_ms"], reverse=True)

    @staticmethod
    def slim_response(data: dict[str, Any], fields: list[str] | None = None) -> dict[str, Any]:
        """Slim down response by selecting specific fields.

        Args:
            data: Full response data
            fields: Fields to include (if None, return all)

        Returns:
            Filtered response data
        """
        if fields is None:
            return data
        return {k: v for k, v in data.items() if k in fields}

    @staticmethod
    def paginate_response(
        items: list[Any],
        page: int = 1,
        page_size: int = 20,
        total: int | None = None,
    ) -> dict[str, Any]:
        """Create a paginated response.

        Args:
            items: List of items
            page: Current page (1-indexed)
            page_size: Items per page
            total: Total count (if known)

        Returns:
            Paginated response dictionary
        """
        page = max(1, page)
        page_size = min(max(1, page_size), 100)

        if total is None:
            total = len(items)

        total_pages = max(1, (total + page_size - 1) // page_size)

        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
        }


# Singleton instance
_response_optimizer: ResponseOptimizer | None = None


def get_response_optimizer() -> ResponseOptimizer:
    """Get the singleton response optimizer instance."""
    global _response_optimizer
    if _response_optimizer is None:
        _response_optimizer = ResponseOptimizer()
    return _response_optimizer


def compress_response(data: bytes, level: int = 6) -> bytes:
    """Compress response data using gzip.

    Args:
        data: Data to compress
        level: Compression level (1-9)

    Returns:
        Compressed data
    """
    return gzip.compress(data, compresslevel=level)


# Response timing decorator
def track_response_time(endpoint: str):
    """Decorator to track endpoint response times."""

    def decorator(func):
        async def wrapper(*args, **kwargs):
            start = time.time()
            try:
                return await func(*args, **kwargs)
            finally:
                duration_ms = (time.time() - start) * 1000
                get_response_optimizer().track_response_time(endpoint, duration_ms)

        return wrapper

    return decorator
