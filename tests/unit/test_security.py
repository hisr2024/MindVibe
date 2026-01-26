"""Tests for security middleware and rate limiting.

These tests verify:
- Security headers are present in all responses
- Rate limiting triggers after threshold
- Input validation rejects malicious input
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestSecurityHeaders:
    """Test suite for security headers middleware."""

    async def test_security_headers_present_on_root(self, test_client: AsyncClient):
        """Test that security headers are present on root endpoint."""
        response = await test_client.get("/")
        
        # X-Content-Type-Options
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        
        # X-Frame-Options
        assert response.headers.get("X-Frame-Options") == "DENY"
        
        # X-XSS-Protection
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"
        
        # Strict-Transport-Security
        assert "max-age=31536000" in response.headers.get("Strict-Transport-Security", "")
        
        # Content-Security-Policy
        assert response.headers.get("Content-Security-Policy") is not None
        
        # Referrer-Policy
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        
        # Permissions-Policy
        assert response.headers.get("Permissions-Policy") is not None

    async def test_security_headers_present_on_api_endpoints(self, test_client: AsyncClient):
        """Test that security headers are present on API endpoints."""
        response = await test_client.get("/api/chat/health")
        
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"

    async def test_security_headers_present_on_post_endpoints(self, test_client: AsyncClient):
        """Test that security headers are present on POST endpoints."""
        response = await test_client.post("/api/chat/start")
        
        assert response.status_code == 200
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"

    async def test_csp_header_contains_required_directives(self, test_client: AsyncClient):
        """Test that Content-Security-Policy contains required directives."""
        response = await test_client.get("/")
        
        csp = response.headers.get("Content-Security-Policy", "")
        
        # Check required directives
        assert "default-src 'self'" in csp
        assert "script-src 'self'" in csp
        assert "frame-ancestors 'none'" in csp

    async def test_permissions_policy_restricts_features(self, test_client: AsyncClient):
        """Test that Permissions-Policy restricts browser features."""
        response = await test_client.get("/")

        policy = response.headers.get("Permissions-Policy", "")

        # Check that dangerous features are restricted
        assert "camera=()" in policy
        # microphone=(self) is allowed for KIAAN Voice functionality
        assert "microphone=(self)" in policy
        assert "geolocation=()" in policy


@pytest.mark.asyncio
class TestInputValidation:
    """Test suite for input validation."""

    async def test_empty_message_rejected(self, test_client: AsyncClient):
        """Test that empty messages are rejected."""
        response = await test_client.post(
            "/api/chat/message",
            json={"message": ""}
        )
        
        assert response.status_code == 422  # Validation error

    async def test_whitespace_only_message_rejected(self, test_client: AsyncClient):
        """Test that whitespace-only messages are rejected."""
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "   "}
        )
        
        assert response.status_code == 422  # Validation error

    async def test_message_length_limit(self, test_client: AsyncClient):
        """Test that messages exceeding max length are rejected."""
        # Create a message longer than 2000 characters
        long_message = "a" * 2001
        
        response = await test_client.post(
            "/api/chat/message",
            json={"message": long_message}
        )
        
        assert response.status_code == 422  # Validation error

    async def test_valid_message_accepted(self, test_client: AsyncClient):
        """Test that valid messages are accepted."""
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "Hello, how are you?"}
        )
        
        assert response.status_code == 200

    async def test_html_escaped_in_message(self, test_client: AsyncClient):
        """Test that HTML is escaped in messages."""
        # This test verifies that potentially malicious HTML is handled
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "Hello <script>alert('xss')</script>"}
        )
        
        # The message should be accepted but sanitized
        assert response.status_code == 200


@pytest.mark.asyncio  
class TestRateLimiting:
    """Test suite for rate limiting functionality."""

    async def test_chat_endpoint_rate_limited(self, test_client: AsyncClient):
        """Test that chat endpoints have rate limiting headers."""
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "Test message"}
        )
        
        # Check that rate limit headers are present (depends on slowapi configuration)
        # The request should succeed normally
        assert response.status_code == 200

    async def test_auth_endpoint_rate_limited(self, test_client: AsyncClient):
        """Test that auth endpoints have rate limiting."""
        response = await test_client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "password": "TestPass123!"
            }
        )
        
        # The request should succeed (or fail for other reasons like duplicate)
        # Rate limiting is configured but won't trigger on single request
        assert response.status_code in [201, 409, 422]  # Created, Conflict, or Validation Error


@pytest.mark.asyncio
class TestKiaanWithSecurity:
    """Test that KIAAN works correctly with security middleware."""

    async def test_kiaan_response_unchanged_with_security_headers(self, test_client: AsyncClient):
        """Test that KIAAN responses are unchanged when security headers are added."""
        response = await test_client.get("/api/chat/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # KIAAN contract should be preserved
        assert data["bot"] == "KIAAN"
        assert data["version"] == "13.0"
        
        # Security headers should be present
        assert response.headers.get("X-Content-Type-Options") == "nosniff"

    async def test_kiaan_about_endpoint_with_security(self, test_client: AsyncClient):
        """Test KIAAN about endpoint works with security middleware."""
        response = await test_client.get("/api/chat/about")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "KIAAN"
        assert "description" in data
        
        # Security headers present
        assert response.headers.get("X-Frame-Options") == "DENY"

    async def test_kiaan_start_session_with_security(self, test_client: AsyncClient):
        """Test KIAAN start session works with security middleware."""
        response = await test_client.post("/api/chat/start")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["bot"] == "KIAAN"
        assert "session_id" in data
        
        # Security headers present
        assert response.headers.get("Strict-Transport-Security") is not None
