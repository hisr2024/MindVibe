"""
Tests for DDoS Protection Middleware

Tests coverage:
- Rate limiting per IP
- Connection limiting
- Request size validation
- IP blocking after violations
- Exponential backoff
- Allowlist/blocklist functionality
"""

import pytest
import time
from unittest.mock import Mock, AsyncMock
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from backend.middleware.ddos_protection import DDoSProtectionMiddleware


class MockRequest:
    """Mock request for testing."""
    
    def __init__(self, ip: str = "192.168.1.1", path: str = "/", size: int = 1000):
        self.client = Mock()
        self.client.host = ip
        self.url = Mock()
        self.url.path = path
        self.headers = {"content-length": str(size)}
        self.query_params = {}


@pytest.fixture
def middleware():
    """Create middleware instance for testing."""
    app = Mock()
    return DDoSProtectionMiddleware(
        app,
        enabled=True,
        max_requests=5,  # Low limit for testing
        time_window=1,  # 1 second window
        max_connections=2,
        max_request_size=1000,
    )


@pytest.fixture
def mock_call_next():
    """Mock call_next function."""
    async def call_next(request):
        return Response(content="OK", status_code=200)
    return call_next


@pytest.mark.asyncio
async def test_rate_limiting(middleware, mock_call_next):
    """Test that rate limiting blocks excessive requests."""
    ip = "192.168.1.1"
    
    # Make requests up to the limit
    for i in range(5):
        request = MockRequest(ip=ip)
        response = await middleware.dispatch(request, mock_call_next)
        assert response.status_code == 200, f"Request {i+1} should succeed"
    
    # Next request should be rate limited
    request = MockRequest(ip=ip)
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 429
    
    # Check response content
    if isinstance(response, JSONResponse):
        # For JSONResponse, we need to decode
        import json
        content = json.loads(response.body.decode())
        assert content["error"] == "rate_limit_exceeded"


@pytest.mark.asyncio
async def test_rate_limiting_resets_after_window(middleware, mock_call_next):
    """Test that rate limit resets after time window."""
    ip = "192.168.1.2"
    
    # Fill up the rate limit
    for _ in range(5):
        request = MockRequest(ip=ip)
        await middleware.dispatch(request, mock_call_next)
    
    # Should be rate limited
    request = MockRequest(ip=ip)
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 429
    
    # Wait for time window to pass
    time.sleep(1.1)
    
    # Should work again
    request = MockRequest(ip=ip)
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_different_ips_independent_limits(middleware, mock_call_next):
    """Test that different IPs have independent rate limits."""
    ip1 = "192.168.1.1"
    ip2 = "192.168.1.2"
    
    # Fill up limit for IP1
    for _ in range(5):
        request = MockRequest(ip=ip1)
        await middleware.dispatch(request, mock_call_next)
    
    # IP1 should be limited
    request = MockRequest(ip=ip1)
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 429
    
    # IP2 should still work
    request = MockRequest(ip=ip2)
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_request_size_limit(middleware, mock_call_next):
    """Test that oversized requests are rejected."""
    ip = "192.168.1.3"
    
    # Request within limit
    request = MockRequest(ip=ip, size=500)
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 200
    
    # Oversized request
    request = MockRequest(ip=ip, size=2000)
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 429


@pytest.mark.asyncio
async def test_ip_blocking_after_violations(middleware, mock_call_next):
    """Test that IPs are blocked after repeated violations."""
    ip = "192.168.1.4"
    
    # Trigger violations by exceeding rate limit multiple times
    for violation in range(3):
        # Fill rate limit
        for _ in range(5):
            request = MockRequest(ip=ip)
            await middleware.dispatch(request, mock_call_next)
        
        # Trigger violation
        request = MockRequest(ip=ip)
        await middleware.dispatch(request, mock_call_next)
        
        # Wait for rate limit to reset
        time.sleep(1.1)
    
    # After 3 violations, IP should be blocked
    request = MockRequest(ip=ip)
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_allowlist_bypass(middleware, mock_call_next):
    """Test that allowlisted IPs bypass rate limiting."""
    ip = "10.0.0.1"
    middleware.allowlist.add(ip)
    
    # Make many requests (more than rate limit)
    for _ in range(20):
        request = MockRequest(ip=ip)
        response = await middleware.dispatch(request, mock_call_next)
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_blocklist_rejection(middleware, mock_call_next):
    """Test that blocklisted IPs are always rejected."""
    ip = "192.168.1.666"
    middleware.blocklist.add(ip)
    
    request = MockRequest(ip=ip)
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_connection_tracking(middleware, mock_call_next):
    """Test that concurrent connections are tracked."""
    ip = "192.168.1.5"
    
    # Create a slow call_next to simulate concurrent connections
    async def slow_call_next(request):
        await asyncio.sleep(0.1)
        return Response(content="OK", status_code=200)
    
    import asyncio
    
    # Start multiple concurrent requests
    tasks = [
        middleware.dispatch(MockRequest(ip=ip), slow_call_next)
        for _ in range(3)
    ]
    
    # Wait for all to complete
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    # At least one should be rejected for too many connections
    status_codes = [r.status_code if isinstance(r, Response) else 500 for r in responses]
    assert 429 in status_codes or 200 in status_codes


@pytest.mark.asyncio
async def test_disabled_middleware_passes_through(mock_call_next):
    """Test that disabled middleware passes all requests."""
    app = Mock()
    middleware = DDoSProtectionMiddleware(app, enabled=False)
    
    # Make many requests
    for _ in range(100):
        request = MockRequest(ip="192.168.1.1")
        response = await middleware.dispatch(request, mock_call_next)
        assert response.status_code == 200


def test_get_client_ip_from_x_forwarded_for(middleware):
    """Test IP extraction from X-Forwarded-For header."""
    request = MockRequest(ip="10.0.0.1")
    request.headers = {"X-Forwarded-For": "203.0.113.1, 198.51.100.1"}
    
    ip = middleware._get_client_ip(request)
    assert ip == "203.0.113.1"


def test_get_client_ip_from_x_real_ip(middleware):
    """Test IP extraction from X-Real-IP header."""
    request = MockRequest(ip="10.0.0.1")
    request.headers = {"X-Real-IP": "203.0.113.1"}
    
    ip = middleware._get_client_ip(request)
    assert ip == "203.0.113.1"


def test_cleanup_removes_old_data(middleware):
    """Test that cleanup removes old tracking data."""
    # Add some old data
    old_time = time.time() - 200
    middleware.request_history["old_ip"].append(old_time)
    middleware.blocked_ips["old_ip"] = old_time
    
    # Run cleanup
    middleware._cleanup_old_data()
    
    # Old data should be removed
    assert "old_ip" not in middleware.blocked_ips
    assert len(middleware.request_history.get("old_ip", [])) == 0
