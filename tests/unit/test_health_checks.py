"""Tests for health check module."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from backend.health.health_checks import (
    HealthStatus,
    HealthCheckResult,
    HealthCheck,
    HealthCheckRegistry,
    check_self,
)


class TestHealthStatus:
    """Tests for HealthStatus enum."""

    def test_status_values(self):
        """Test health status values."""
        assert HealthStatus.HEALTHY.value == "healthy"
        assert HealthStatus.UNHEALTHY.value == "unhealthy"
        assert HealthStatus.DEGRADED.value == "degraded"
        assert HealthStatus.UNKNOWN.value == "unknown"


class TestHealthCheckResult:
    """Tests for HealthCheckResult."""

    def test_to_dict(self):
        """Test conversion to dictionary."""
        result = HealthCheckResult(
            name="test",
            status=HealthStatus.HEALTHY,
            latency_ms=5.5,
            message="OK",
        )
        data = result.to_dict()

        assert data["name"] == "test"
        assert data["status"] == "healthy"
        assert data["latency_ms"] == 5.5
        assert data["message"] == "OK"
        assert "timestamp" in data


class TestHealthCheck:
    """Tests for HealthCheck."""

    @pytest.mark.asyncio
    async def test_execute_success(self):
        """Test successful health check execution."""

        async def check_func():
            return HealthCheckResult(
                name="test",
                status=HealthStatus.HEALTHY,
                latency_ms=1.0,
            )

        check = HealthCheck(
            name="test",
            check_func=check_func,
        )
        result = await check.execute()

        assert result.status == HealthStatus.HEALTHY

    @pytest.mark.asyncio
    async def test_execute_timeout(self):
        """Test health check timeout."""
        import asyncio

        async def slow_check():
            await asyncio.sleep(10)
            return HealthCheckResult(
                name="test",
                status=HealthStatus.HEALTHY,
                latency_ms=1.0,
            )

        check = HealthCheck(
            name="test",
            check_func=slow_check,
            timeout_seconds=0.1,
        )
        result = await check.execute()

        assert result.status == HealthStatus.UNHEALTHY
        assert "timed out" in result.message.lower()

    @pytest.mark.asyncio
    async def test_execute_exception(self):
        """Test health check exception handling."""

        async def failing_check():
            raise Exception("Test error")

        check = HealthCheck(
            name="test",
            check_func=failing_check,
        )
        result = await check.execute()

        assert result.status == HealthStatus.UNHEALTHY
        assert "failed" in result.message.lower()


class TestHealthCheckRegistry:
    """Tests for HealthCheckRegistry."""

    @pytest.fixture
    def registry(self):
        return HealthCheckRegistry()

    @pytest.mark.asyncio
    async def test_register_and_run(self, registry):
        """Test registering and running a health check."""

        async def check_func():
            return HealthCheckResult(
                name="test",
                status=HealthStatus.HEALTHY,
                latency_ms=1.0,
            )

        registry.register("test", check_func)
        results = await registry.run_all()

        assert "test" in results
        assert results["test"].status == HealthStatus.HEALTHY

    def test_unregister(self, registry):
        """Test unregistering a health check."""

        async def check_func():
            return HealthCheckResult(
                name="test",
                status=HealthStatus.HEALTHY,
                latency_ms=1.0,
            )

        registry.register("test", check_func)
        registry.unregister("test")

        checks = registry.get_registered_checks()
        assert not any(c["name"] == "test" for c in checks)

    @pytest.mark.asyncio
    async def test_run_check(self, registry):
        """Test running a specific health check."""

        async def check_func():
            return HealthCheckResult(
                name="test",
                status=HealthStatus.HEALTHY,
                latency_ms=1.0,
            )

        registry.register("test", check_func)
        result = await registry.run_check("test")

        assert result is not None
        assert result.status == HealthStatus.HEALTHY

    @pytest.mark.asyncio
    async def test_run_check_not_found(self, registry):
        """Test running a nonexistent health check."""
        result = await registry.run_check("nonexistent")
        assert result is None

    def test_get_overall_status_healthy(self, registry):
        """Test overall status when all checks are healthy."""
        results = {
            "check1": HealthCheckResult(
                name="check1", status=HealthStatus.HEALTHY, latency_ms=1.0
            ),
            "check2": HealthCheckResult(
                name="check2", status=HealthStatus.HEALTHY, latency_ms=1.0
            ),
        }

        async def healthy_check():
            return HealthCheckResult(
                name="test", status=HealthStatus.HEALTHY, latency_ms=1.0
            )

        registry.register("check1", healthy_check, critical=True)
        registry.register("check2", healthy_check, critical=True)

        status = registry.get_overall_status(results)
        assert status == HealthStatus.HEALTHY

    def test_get_overall_status_unhealthy_critical(self, registry):
        """Test overall status when a critical check fails."""
        results = {
            "check1": HealthCheckResult(
                name="check1", status=HealthStatus.UNHEALTHY, latency_ms=1.0
            ),
            "check2": HealthCheckResult(
                name="check2", status=HealthStatus.HEALTHY, latency_ms=1.0
            ),
        }

        async def check():
            return HealthCheckResult(
                name="test", status=HealthStatus.HEALTHY, latency_ms=1.0
            )

        registry.register("check1", check, critical=True)
        registry.register("check2", check, critical=False)

        status = registry.get_overall_status(results)
        assert status == HealthStatus.UNHEALTHY

    def test_get_overall_status_degraded(self, registry):
        """Test overall status when a non-critical check fails."""
        results = {
            "check1": HealthCheckResult(
                name="check1", status=HealthStatus.HEALTHY, latency_ms=1.0
            ),
            "check2": HealthCheckResult(
                name="check2", status=HealthStatus.UNHEALTHY, latency_ms=1.0
            ),
        }

        async def check():
            return HealthCheckResult(
                name="test", status=HealthStatus.HEALTHY, latency_ms=1.0
            )

        registry.register("check1", check, critical=True)
        registry.register("check2", check, critical=False)

        status = registry.get_overall_status(results)
        assert status == HealthStatus.DEGRADED

    def test_get_registered_checks(self, registry):
        """Test getting list of registered checks."""

        async def check():
            return HealthCheckResult(
                name="test", status=HealthStatus.HEALTHY, latency_ms=1.0
            )

        registry.register("test", check, description="Test check")
        checks = registry.get_registered_checks()

        assert len(checks) == 1
        assert checks[0]["name"] == "test"
        assert checks[0]["description"] == "Test check"


class TestBuiltInChecks:
    """Tests for built-in health checks."""

    @pytest.mark.asyncio
    async def test_check_self(self):
        """Test self health check."""
        result = await check_self()

        assert result.status == HealthStatus.HEALTHY
        assert result.name == "self"
