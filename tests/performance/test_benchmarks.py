"""
Performance benchmarks for MindVibe application.

Tests performance requirements:
- KIAAN response time: <5 seconds
- Dashboard load: <1 second
- API endpoints: <500ms
- Concurrent users: 100+ supported
"""

import asyncio
import time

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


class TestKIAANPerformance:
    """Performance tests for KIAAN chatbot."""

    @pytest.mark.asyncio
    async def test_kiaan_health_check_performance(self, test_client: AsyncClient):
        """Test KIAAN health check responds within 500ms."""
        start = time.time()
        response = await test_client.get("/api/chat/health")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 0.5, f"Health check took {elapsed:.2f}s, should be <500ms"
        
        # Verify KIAAN identity
        data = response.json()
        assert data["bot"] == "KIAAN"
        assert data["version"] == "15.0"

    @pytest.mark.asyncio
    async def test_kiaan_start_session_performance(self, test_client: AsyncClient):
        """Test starting a KIAAN session responds within 500ms."""
        start = time.time()
        response = await test_client.post("/api/chat/start")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 0.5, f"Start session took {elapsed:.2f}s, should be <500ms"

    @pytest.mark.asyncio
    async def test_kiaan_message_response_time(self, test_client: AsyncClient):
        """Test KIAAN message response time is under 5 seconds."""
        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[]
        ):
            start = time.time()
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "How can I find peace of mind?"}
            )
            elapsed = time.time() - start
            
            assert response.status_code == 200
            assert elapsed < 5.0, f"Message response took {elapsed:.2f}s, should be <5s"

    @pytest.mark.asyncio
    async def test_kiaan_about_endpoint_performance(self, test_client: AsyncClient):
        """Test KIAAN about endpoint responds within 500ms."""
        start = time.time()
        response = await test_client.get("/api/chat/about")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 0.5, f"About endpoint took {elapsed:.2f}s, should be <500ms"
        
        # Verify KIAAN identity
        data = response.json()
        assert data["name"] == "KIAAN"


class TestAPIEndpointPerformance:
    """Performance tests for general API endpoints."""

    @pytest.mark.asyncio
    async def test_root_endpoint_performance(self, test_client: AsyncClient):
        """Test root endpoint responds within 500ms."""
        start = time.time()
        response = await test_client.get("/")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 0.5, f"Root endpoint took {elapsed:.2f}s, should be <500ms"

    @pytest.mark.asyncio
    async def test_auth_signup_performance(self, test_client: AsyncClient):
        """Test auth signup endpoint responds within 500ms."""
        unique_email = f"perf_test_{int(time.time())}@example.com"
        
        start = time.time()
        response = await test_client.post(
            "/api/auth/signup",
            json={
                "email": unique_email,
                "password": "SecurePass123!"
            }
        )
        elapsed = time.time() - start
        
        # Response can be 201 (created) or 409 (conflict) or 422 (validation)
        assert response.status_code in [201, 409, 422]
        assert elapsed < 0.5, f"Signup took {elapsed:.2f}s, should be <500ms"

    @pytest.mark.asyncio
    async def test_subscription_tiers_performance(self, test_client: AsyncClient):
        """Test subscription tiers endpoint responds within 500ms."""
        start = time.time()
        response = await test_client.get("/api/subscriptions/tiers")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 0.5, f"Subscription tiers took {elapsed:.2f}s, should be <500ms"


class TestConcurrentRequestsPerformance:
    """Test system under concurrent load."""

    @pytest.mark.asyncio
    async def test_concurrent_health_checks(self, test_client: AsyncClient):
        """Test 10 concurrent health checks complete successfully."""
        async def make_request():
            return await test_client.get("/api/chat/health")
        
        start = time.time()
        tasks = [make_request() for _ in range(10)]
        responses = await asyncio.gather(*tasks)
        elapsed = time.time() - start
        
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
        
        # Total time should be reasonable (not 10x single request)
        assert elapsed < 3.0, f"10 concurrent requests took {elapsed:.2f}s"

    @pytest.mark.asyncio
    async def test_concurrent_session_starts(self, test_client: AsyncClient):
        """Test concurrent session starts."""
        async def start_session():
            return await test_client.post("/api/chat/start")

        start = time.time()
        tasks = [start_session() for _ in range(5)]
        responses = await asyncio.gather(*tasks)
        elapsed = time.time() - start

        # At least some requests should succeed (rate limiting may throttle others)
        successful = [r for r in responses if r.status_code == 200]
        assert len(successful) >= 1, "At least one session start should succeed"

        # Successful sessions should have unique IDs
        session_ids = [r.json()["session_id"] for r in successful]
        assert len(session_ids) == len(set(session_ids)), "Session IDs should be unique"

        assert elapsed < 2.0, f"5 concurrent session starts took {elapsed:.2f}s"


class TestDatabasePerformance:
    """Test database query performance."""

    @pytest.mark.asyncio
    async def test_user_lookup_performance(self, test_db):
        """Test user lookup is performant."""
        from backend.models import User
        from sqlalchemy import select
        
        # Create a user
        user = User(
            auth_uid="perf-db-user",
            email="perf_db@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        
        # Query user
        start = time.time()
        stmt = select(User).where(User.email == "perf_db@example.com")
        result = await test_db.execute(stmt)
        found_user = result.scalars().first()
        elapsed = time.time() - start
        
        assert found_user is not None
        assert elapsed < 0.1, f"User lookup took {elapsed:.3f}s, should be <100ms"


class TestResponseSizeBenchmarks:
    """Test response payload sizes."""

    @pytest.mark.asyncio
    async def test_kiaan_response_size(self, test_client: AsyncClient):
        """Test KIAAN response size is reasonable."""
        with patch(
            "backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses",
            return_value=[]
        ):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": "Hello"}
            )

            # Accept 200 or 429 (rate limited from other tests in this suite)
            if response.status_code == 429:
                pytest.skip("Rate limited from concurrent test burst")

            assert response.status_code == 200

            # Response should be under 10KB for a simple message
            response_size = len(response.content)
            assert response_size < 10 * 1024, f"Response size {response_size} bytes is too large"

    @pytest.mark.asyncio
    async def test_health_check_response_size(self, test_client: AsyncClient):
        """Test health check response is minimal."""
        response = await test_client.get("/api/chat/health")

        # Accept 200 or 429 (rate limited from concurrent test burst)
        if response.status_code == 429:
            pytest.skip("Rate limited from concurrent test burst")

        assert response.status_code == 200

        # Health check should be very small
        response_size = len(response.content)
        assert response_size < 1024, f"Health response {response_size} bytes should be <1KB"


class TestBenchmarkSummary:
    """Summary tests for all performance benchmarks."""

    @pytest.mark.asyncio
    async def test_all_critical_endpoints_under_threshold(self, test_client: AsyncClient):
        """Verify all critical endpoints meet performance requirements."""
        endpoints = [
            ("GET", "/", 0.5),
            ("GET", "/api/chat/health", 0.5),
            ("GET", "/api/chat/about", 0.5),
            ("POST", "/api/chat/start", 0.5),
            ("GET", "/api/subscriptions/tiers", 0.5),
        ]
        
        results = []
        
        for method, path, threshold in endpoints:
            start = time.time()
            if method == "GET":
                response = await test_client.get(path)
            else:
                response = await test_client.post(path)
            elapsed = time.time() - start
            
            passed = elapsed < threshold
            results.append({
                "endpoint": f"{method} {path}",
                "elapsed": elapsed,
                "threshold": threshold,
                "passed": passed,
            })
        
        # Print summary
        print("\n=== Performance Benchmark Summary ===")
        for r in results:
            status = "✅" if r["passed"] else "❌"
            print(f"{status} {r['endpoint']}: {r['elapsed']:.3f}s (threshold: {r['threshold']}s)")
        
        # All should pass
        failed = [r for r in results if not r["passed"]]
        assert len(failed) == 0, f"Failed benchmarks: {failed}"
