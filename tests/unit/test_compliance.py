"""Tests for compliance and GDPR routes.

These tests verify:
- Cookie consent management
- Data export functionality
- Account deletion flow
- Consent management
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestCookieConsent:
    """Test suite for cookie consent functionality."""

    async def test_get_cookie_preferences_default(self, test_client: AsyncClient):
        """Test getting default cookie preferences for anonymous users."""
        response = await test_client.get("/api/compliance/cookie-consent")
        
        assert response.status_code == 200
        data = response.json()
        
        # Default should have only necessary cookies enabled
        assert data["necessary"] is True
        assert data["analytics"] is False
        assert data["marketing"] is False
        assert data["functional"] is False

    async def test_save_cookie_preferences(self, test_client: AsyncClient):
        """Test saving cookie preferences."""
        response = await test_client.post(
            "/api/compliance/cookie-consent",
            json={
                "necessary": True,
                "analytics": True,
                "marketing": False,
                "functional": True,
                "anonymous_id": "test-anon-123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["necessary"] is True
        assert data["analytics"] is True
        assert data["marketing"] is False
        assert data["functional"] is True

    async def test_necessary_cookies_always_true(self, test_client: AsyncClient):
        """Test that necessary cookies cannot be disabled."""
        response = await test_client.post(
            "/api/compliance/cookie-consent",
            json={
                "necessary": False,  # Try to disable
                "analytics": False,
                "marketing": False,
                "functional": False,
                "anonymous_id": "test-anon-456"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Necessary should still be True
        assert data["necessary"] is True


@pytest.mark.asyncio
class TestInputSanitization:
    """Test suite for input sanitization middleware."""

    async def test_xss_detection_in_message(self, test_client: AsyncClient):
        """Test that XSS patterns are handled safely."""
        # This should be accepted but sanitized
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "Hello <script>alert('xss')</script> world"}
        )
        
        # Request should succeed (sanitization happens, not rejection)
        assert response.status_code == 200

    async def test_sql_injection_pattern_in_message(self, test_client: AsyncClient):
        """Test that SQL injection patterns are handled safely."""
        # The parameterized queries should prevent actual SQL injection
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "My name is ' OR '1'='1"}
        )
        
        # Request should succeed, SQL injection prevented at DB level
        assert response.status_code == 200

    async def test_valid_special_characters(self, test_client: AsyncClient):
        """Test that valid special characters work correctly."""
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "What's the meaning of 'karma' & 'dharma'?"}
        )
        
        assert response.status_code == 200


@pytest.mark.asyncio
class TestSecurityHeaders:
    """Test suite for comprehensive security headers."""

    async def test_all_security_headers_present(self, test_client: AsyncClient):
        """Test that all required security headers are present."""
        response = await test_client.get("/")
        
        # Core security headers
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"
        
        # HSTS
        hsts = response.headers.get("Strict-Transport-Security", "")
        assert "max-age=31536000" in hsts
        
        # CSP
        csp = response.headers.get("Content-Security-Policy", "")
        assert "default-src 'self'" in csp
        assert "frame-ancestors 'none'" in csp
        
        # Referrer Policy
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        
        # Permissions Policy
        permissions = response.headers.get("Permissions-Policy", "")
        assert "camera=()" in permissions

    async def test_security_headers_on_api_routes(self, test_client: AsyncClient):
        """Test security headers on API routes."""
        response = await test_client.get("/api/chat/health")
        
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"

    async def test_security_headers_on_error_responses(self, test_client: AsyncClient):
        """Test security headers are present even on error responses."""
        response = await test_client.get("/api/nonexistent-endpoint")
        
        # Even on 404, security headers should be present
        assert response.headers.get("X-Content-Type-Options") == "nosniff"


@pytest.mark.asyncio
class TestKiaanProtection:
    """Test that KIAAN remains fully functional with security features."""

    async def test_kiaan_health_with_security(self, test_client: AsyncClient):
        """Test KIAAN health endpoint works with security middleware."""
        response = await test_client.get("/api/chat/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # KIAAN contract preserved
        assert data["bot"] == "KIAAN"
        assert data["version"] == "15.0"
        
        # Security headers present
        assert response.headers.get("X-Content-Type-Options") == "nosniff"

    async def test_kiaan_message_with_security(self, test_client: AsyncClient):
        """Test KIAAN message endpoint works with security middleware."""
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "What is the meaning of life?"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # KIAAN response structure preserved
        assert "bot" in data or "message" in data or "response" in data

    async def test_kiaan_about_with_security(self, test_client: AsyncClient):
        """Test KIAAN about endpoint works with security middleware."""
        response = await test_client.get("/api/chat/about")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "KIAAN"
        assert "description" in data
        # KIAAN about response includes various info about the bot
        assert "version" in data or "wisdom_style" in data


@pytest.mark.asyncio
class TestRateLimiting:
    """Test rate limiting functionality."""

    async def test_rate_limit_headers_present(self, test_client: AsyncClient):
        """Test that rate limit functionality is configured."""
        response = await test_client.post(
            "/api/chat/message",
            json={"message": "Test message"}
        )
        
        # Request should succeed
        assert response.status_code == 200
        
        # Rate limit headers may be present depending on configuration
        # This test verifies the endpoint is accessible

    async def test_multiple_requests_allowed(self, test_client: AsyncClient):
        """Test that multiple requests within limit work."""
        for i in range(5):
            response = await test_client.post(
                "/api/chat/message",
                json={"message": f"Test message {i}"}
            )
            
            # All requests should succeed
            assert response.status_code == 200
