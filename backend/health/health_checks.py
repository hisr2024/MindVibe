"""Health Check System for MindVibe.

This module provides comprehensive health checking including:
- Database connectivity checks
- External service checks
- Readiness probes
- Liveness probes
"""

import asyncio
import logging
import time
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

from fastapi import APIRouter, Response, status

logger = logging.getLogger(__name__)


class HealthStatus(str, Enum):
    """Health check status."""

    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    DEGRADED = "degraded"
    UNKNOWN = "unknown"


@dataclass
class HealthCheckResult:
    """Result of a health check."""

    name: str
    status: HealthStatus
    latency_ms: float
    message: str | None = None
    details: dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "status": self.status.value,
            "latency_ms": round(self.latency_ms, 2),
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class HealthCheck:
    """Health check definition."""

    name: str
    check_func: Callable[[], Coroutine[Any, Any, HealthCheckResult]]
    critical: bool = True
    timeout_seconds: float = 5.0
    description: str = ""

    async def execute(self) -> HealthCheckResult:
        """Execute the health check with timeout."""
        start_time = time.time()
        try:
            result = await asyncio.wait_for(
                self.check_func(), timeout=self.timeout_seconds
            )
            return result
        except TimeoutError:
            latency = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNHEALTHY,
                latency_ms=latency,
                message=f"Health check timed out after {self.timeout_seconds}s",
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNHEALTHY,
                latency_ms=latency,
                message=f"Health check failed: {str(e)}",
            )


class HealthCheckRegistry:
    """Registry for health checks."""

    def __init__(self):
        """Initialize health check registry."""
        self._checks: dict[str, HealthCheck] = {}
        self._last_results: dict[str, HealthCheckResult] = {}

    def register(
        self,
        name: str,
        check_func: Callable[[], Coroutine[Any, Any, HealthCheckResult]],
        critical: bool = True,
        timeout_seconds: float = 5.0,
        description: str = "",
    ) -> None:
        """Register a health check.

        Args:
            name: Unique name for the check
            check_func: Async function that performs the check
            critical: Whether this check is critical for overall health
            timeout_seconds: Timeout for the check
            description: Description of what the check does
        """
        self._checks[name] = HealthCheck(
            name=name,
            check_func=check_func,
            critical=critical,
            timeout_seconds=timeout_seconds,
            description=description,
        )

    def unregister(self, name: str) -> None:
        """Unregister a health check.

        Args:
            name: Name of the check to remove
        """
        if name in self._checks:
            del self._checks[name]
        if name in self._last_results:
            del self._last_results[name]

    async def run_all(self) -> dict[str, HealthCheckResult]:
        """Run all registered health checks.

        Returns:
            Dictionary mapping check name to result
        """
        tasks = [check.execute() for check in self._checks.values()]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        result_dict = {}
        for check, result in zip(self._checks.values(), results):
            if isinstance(result, Exception):
                result = HealthCheckResult(
                    name=check.name,
                    status=HealthStatus.UNHEALTHY,
                    latency_ms=0,
                    message=f"Check failed with exception: {str(result)}",
                )
            result_dict[check.name] = result
            self._last_results[check.name] = result

        return result_dict

    async def run_check(self, name: str) -> HealthCheckResult | None:
        """Run a specific health check.

        Args:
            name: Name of the check to run

        Returns:
            Health check result or None if check not found
        """
        if name not in self._checks:
            return None
        result = await self._checks[name].execute()
        self._last_results[name] = result
        return result

    def get_overall_status(
        self, results: dict[str, HealthCheckResult]
    ) -> HealthStatus:
        """Determine overall health status from check results.

        Args:
            results: Dictionary of check results

        Returns:
            Overall health status
        """
        if not results:
            return HealthStatus.UNKNOWN

        has_unhealthy_critical = False
        has_unhealthy = False
        has_degraded = False

        for name, result in results.items():
            check = self._checks.get(name)
            is_critical = check.critical if check else True

            if result.status == HealthStatus.UNHEALTHY:
                if is_critical:
                    has_unhealthy_critical = True
                else:
                    has_unhealthy = True
            elif result.status == HealthStatus.DEGRADED:
                has_degraded = True

        if has_unhealthy_critical:
            return HealthStatus.UNHEALTHY
        if has_unhealthy or has_degraded:
            return HealthStatus.DEGRADED
        return HealthStatus.HEALTHY

    def get_registered_checks(self) -> list[dict[str, Any]]:
        """Get list of registered health checks.

        Returns:
            List of check information
        """
        return [
            {
                "name": check.name,
                "critical": check.critical,
                "timeout_seconds": check.timeout_seconds,
                "description": check.description,
            }
            for check in self._checks.values()
        ]


# Singleton instance
health_registry = HealthCheckRegistry()


# Built-in health checks
async def check_self() -> HealthCheckResult:
    """Basic self-check that always passes."""
    start = time.time()
    return HealthCheckResult(
        name="self",
        status=HealthStatus.HEALTHY,
        latency_ms=(time.time() - start) * 1000,
        message="Service is running",
    )


async def check_database(engine: Any) -> HealthCheckResult:
    """Check database connectivity.

    Args:
        engine: SQLAlchemy async engine

    Returns:
        Health check result
    """
    start = time.time()
    try:
        from sqlalchemy import text

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency = (time.time() - start) * 1000
        return HealthCheckResult(
            name="database",
            status=HealthStatus.HEALTHY,
            latency_ms=latency,
            message="Database connection successful",
        )
    except Exception as e:
        latency = (time.time() - start) * 1000
        return HealthCheckResult(
            name="database",
            status=HealthStatus.UNHEALTHY,
            latency_ms=latency,
            message=f"Database connection failed: {str(e)}",
        )


async def check_redis(redis_client: Any) -> HealthCheckResult:
    """Check Redis connectivity.

    Args:
        redis_client: Redis client

    Returns:
        Health check result
    """
    start = time.time()
    try:
        await redis_client.ping()
        latency = (time.time() - start) * 1000
        return HealthCheckResult(
            name="redis",
            status=HealthStatus.HEALTHY,
            latency_ms=latency,
            message="Redis connection successful",
        )
    except Exception as e:
        latency = (time.time() - start) * 1000
        return HealthCheckResult(
            name="redis",
            status=HealthStatus.UNHEALTHY,
            latency_ms=latency,
            message=f"Redis connection failed: {str(e)}",
        )


def create_health_router(registry: HealthCheckRegistry | None = None) -> APIRouter:
    """Create a FastAPI router with health check endpoints.

    Args:
        registry: Health check registry to use

    Returns:
        FastAPI router with health endpoints
    """
    router = APIRouter(prefix="/health", tags=["Health"])
    reg = registry or health_registry

    @router.get("/live")
    async def liveness():
        """Liveness probe - is the service alive?"""
        return {"status": "alive"}

    @router.get("/ready")
    async def readiness(response: Response):
        """Readiness probe - is the service ready to accept traffic?"""
        results = await reg.run_all()
        overall_status = reg.get_overall_status(results)

        if overall_status == HealthStatus.UNHEALTHY:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

        return {
            "status": overall_status.value,
            "checks": {name: result.to_dict() for name, result in results.items()},
        }

    @router.get("/")
    async def health_check(response: Response):
        """Comprehensive health check."""
        results = await reg.run_all()
        overall_status = reg.get_overall_status(results)

        if overall_status == HealthStatus.UNHEALTHY:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        elif overall_status == HealthStatus.DEGRADED:
            response.status_code = status.HTTP_200_OK

        return {
            "status": overall_status.value,
            "timestamp": datetime.now(UTC).isoformat(),
            "checks": {name: result.to_dict() for name, result in results.items()},
        }

    @router.get("/checks")
    async def list_checks():
        """List all registered health checks."""
        return {
            "checks": reg.get_registered_checks(),
        }

    @router.get("/checks/{name}")
    async def run_check(name: str, response: Response):
        """Run a specific health check."""
        result = await reg.run_check(name)
        if result is None:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"error": f"Health check '{name}' not found"}

        if result.status == HealthStatus.UNHEALTHY:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

        return result.to_dict()

    return router


# Register self check by default
health_registry.register(
    name="self",
    check_func=check_self,
    critical=False,
    description="Basic self-check",
)
