"""Lightweight Prometheus metrics instrumentation for FastAPI."""
from __future__ import annotations

import time
from typing import Callable

from fastapi import APIRouter, Request
from fastapi.responses import Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    Histogram,
    generate_latest,
)

registry = CollectorRegistry()

# Core HTTP metrics
REQUEST_COUNT = Counter(
    "mindvibe_http_requests_total",
    "Total HTTP requests handled",
    labelnames=("method", "path", "status_code"),
    registry=registry,
)

REQUEST_LATENCY = Histogram(
    "mindvibe_http_request_latency_seconds",
    "Latency for HTTP requests",
    labelnames=("method", "path"),
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
    registry=registry,
)

RATE_LIMIT_REJECTIONS = Counter(
    "mindvibe_rate_limit_rejections_total",
    "Count of requests rejected due to rate limiting",
    labelnames=("path",),
    registry=registry,
)


def _normalized_path(request: Request) -> str:
    """Normalize the path to avoid high-cardinality metrics."""

    route = request.scope.get("route")
    if route and getattr(route, "path", None):
        return route.path
    return request.url.path


async def metrics_middleware(request: Request, call_next: Callable) -> Response:
    """Collect latency and request counters for each HTTP request."""

    start_time = time.perf_counter()
    response: Response = await call_next(request)
    duration = time.perf_counter() - start_time

    path = _normalized_path(request)
    REQUEST_COUNT.labels(method=request.method, path=path, status_code=str(response.status_code)).inc()
    REQUEST_LATENCY.labels(method=request.method, path=path).observe(duration)

    return response


def record_rate_limit_rejection(path: str) -> None:
    """Increment the rate limit rejection counter."""

    RATE_LIMIT_REJECTIONS.labels(path=path).inc()


def create_metrics_router() -> APIRouter:
    """Expose metrics under the /metrics endpoint."""

    router = APIRouter()

    @router.get("/metrics", include_in_schema=False)
    async def metrics_endpoint() -> Response:
        return Response(generate_latest(registry), media_type=CONTENT_TYPE_LATEST)

    return router


__all__ = [
    "REQUEST_COUNT",
    "REQUEST_LATENCY",
    "RATE_LIMIT_REJECTIONS",
    "metrics_middleware",
    "record_rate_limit_rejection",
    "create_metrics_router",
]
