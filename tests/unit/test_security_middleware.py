"""Tests for security middleware module."""

import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch

from backend.middleware.security import (
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    RequestValidationMiddleware,
    XSSProtectionMiddleware,
    sanitize_input,
    sanitize_dict,
    generate_request_id,
)


class TestRateLimitMiddleware:
    """Tests for RateLimitMiddleware."""

    @pytest.fixture
    def app_mock(self):
        return MagicMock()

    @pytest.fixture
    def middleware(self, app_mock):
        return RateLimitMiddleware(
            app_mock,
            default_limit=5,
            window_seconds=60,
        )

    def test_init(self, middleware):
        """Test middleware initialization."""
        assert middleware.default_limit == 5
        assert middleware.window_seconds == 60
        assert "/health" in middleware.exclude_paths

    def test_get_client_ip_from_header(self, middleware):
        """Test IP extraction from X-Forwarded-For."""
        request = MagicMock()
        request.headers.get.side_effect = lambda x: {
            "X-Forwarded-For": "192.168.1.1, 10.0.0.1",
            "X-Real-IP": None,
        }.get(x)
        request.client = MagicMock(host="127.0.0.1")

        ip = middleware._get_client_ip(request)
        assert ip == "192.168.1.1"

    def test_get_client_ip_from_real_ip(self, middleware):
        """Test IP extraction from X-Real-IP."""
        request = MagicMock()
        request.headers.get.side_effect = lambda x: {
            "X-Forwarded-For": None,
            "X-Real-IP": "10.0.0.1",
        }.get(x)
        request.client = MagicMock(host="127.0.0.1")

        ip = middleware._get_client_ip(request)
        assert ip == "10.0.0.1"

    def test_get_client_ip_from_client(self, middleware):
        """Test IP extraction from client."""
        request = MagicMock()
        request.headers.get.return_value = None
        request.client = MagicMock(host="192.168.1.100")

        ip = middleware._get_client_ip(request)
        assert ip == "192.168.1.100"

    def test_rate_limit_key_generation(self, middleware):
        """Test rate limit key generation."""
        key = middleware._get_rate_limit_key("192.168.1.1", "/api/test")
        assert key == "192.168.1.1:/api/test"

    def test_rate_limiting_not_exceeded(self, middleware):
        """Test that requests under limit are not rate limited."""
        key = "test-key-1"
        for _ in range(4):
            assert middleware._is_rate_limited(key, 5) is False

    def test_rate_limiting_exceeded(self, middleware):
        """Test that requests over limit are rate limited."""
        key = "test-key-2"
        for _ in range(5):
            middleware._is_rate_limited(key, 5)
        assert middleware._is_rate_limited(key, 5) is True

    def test_ip_blocking(self, middleware):
        """Test IP blocking functionality."""
        ip = "192.168.1.200"
        assert middleware._is_ip_blocked(ip) is False

        middleware._block_ip(ip, duration_seconds=1)
        assert middleware._is_ip_blocked(ip) is True

        time.sleep(1.1)
        assert middleware._is_ip_blocked(ip) is False


class TestSecurityHeadersMiddleware:
    """Tests for SecurityHeadersMiddleware."""

    @pytest.fixture
    def middleware(self):
        return SecurityHeadersMiddleware(MagicMock())

    def test_default_csp_policy(self, middleware):
        """Test default CSP policy generation."""
        policy = middleware._default_csp_policy()
        assert "default-src 'self'" in policy
        assert "script-src" in policy
        assert "frame-ancestors 'none'" in policy

    @pytest.mark.asyncio
    async def test_adds_security_headers(self, middleware):
        """Test that security headers are added."""
        request = MagicMock()
        response = MagicMock()
        response.headers = {}

        async def call_next(req):
            return response

        result = await middleware.dispatch(request, call_next)
        assert "X-Frame-Options" in result.headers
        assert result.headers["X-Frame-Options"] == "DENY"
        assert "X-Content-Type-Options" in result.headers
        assert result.headers["X-Content-Type-Options"] == "nosniff"


class TestRequestValidationMiddleware:
    """Tests for RequestValidationMiddleware."""

    @pytest.fixture
    def middleware(self):
        return RequestValidationMiddleware(
            MagicMock(),
            max_body_size=1024,
            enable_sql_detection=True,
        )

    def test_sql_injection_detection(self, middleware):
        """Test SQL injection pattern detection."""
        assert middleware._detect_sql_injection("SELECT * FROM users") is True
        assert middleware._detect_sql_injection("DROP TABLE users") is True
        assert middleware._detect_sql_injection("1' OR '1'='1") is True
        assert middleware._detect_sql_injection("hello world") is False
        assert middleware._detect_sql_injection("normal text") is False


class TestXSSProtectionMiddleware:
    """Tests for XSSProtectionMiddleware."""

    @pytest.fixture
    def middleware(self):
        return XSSProtectionMiddleware(
            MagicMock(),
            block_xss_attempts=True,
        )

    def test_xss_detection(self, middleware):
        """Test XSS pattern detection."""
        assert middleware._detect_xss("<script>alert('xss')</script>") is True
        assert middleware._detect_xss("javascript:void(0)") is True
        assert middleware._detect_xss("onclick=doEvil()") is True
        assert middleware._detect_xss("hello world") is False
        assert middleware._detect_xss("normal <b>text</b>") is False


class TestSanitizationFunctions:
    """Tests for sanitization utility functions."""

    def test_sanitize_input(self):
        """Test input sanitization."""
        assert sanitize_input("<script>") == "&lt;script&gt;"
        assert sanitize_input("hello & world") == "hello &amp; world"
        assert sanitize_input('"test"') == "&quot;test&quot;"
        assert sanitize_input("normal text") == "normal text"

    def test_sanitize_dict(self):
        """Test dictionary sanitization."""
        data = {
            "name": "<script>alert('xss')</script>",
            "description": "Hello & welcome",
            "count": 42,
            "nested": {
                "html": "<div>test</div>",
            },
        }

        sanitized = sanitize_dict(data)
        assert "&lt;script&gt;" in sanitized["name"]
        assert "&amp;" in sanitized["description"]
        assert sanitized["count"] == 42
        assert "&lt;div&gt;" in sanitized["nested"]["html"]

    def test_generate_request_id(self):
        """Test request ID generation."""
        id1 = generate_request_id()
        id2 = generate_request_id()

        assert len(id1) == 16
        assert len(id2) == 16
        assert id1 != id2  # Should be unique
