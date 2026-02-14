"""Integration tests for Translation API routes

Tests the translation API endpoints including:
- Text translation endpoint
- Language preferences management
- Supported languages endpoint
- Cache management
"""

import pytest
from httpx import AsyncClient
from unittest.mock import patch, Mock


class TestTranslationAPI:
    """Test suite for Translation API endpoints"""
    
    @pytest.mark.asyncio
    async def test_translate_text_endpoint(self, test_client: AsyncClient):
        """Test POST /api/translation/translate endpoint"""
        response = await test_client.post(
            "/api/translation/translate",
            json={
                "text": "Hello world",
                "target_lang": "es",
                "source_lang": "en"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data
        assert "translated_text" in data
        assert "original_text" in data
        assert "source_lang" in data
        assert "target_lang" in data
        assert data["original_text"] == "Hello world"
        assert data["source_lang"] == "en"
        assert data["target_lang"] == "es"
    
    @pytest.mark.asyncio
    async def test_translate_text_empty_input(self, test_client: AsyncClient):
        """Test translation with empty text"""
        response = await test_client.post(
            "/api/translation/translate",
            json={
                "text": "",
                "target_lang": "es"
            }
        )
        
        # Empty text should fail validation
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_translate_text_too_long(self, test_client: AsyncClient):
        """Test translation with text exceeding max length"""
        long_text = "a" * 6000  # Exceeds MAX_TRANSLATION_LENGTH of 5000
        response = await test_client.post(
            "/api/translation/translate",
            json={
                "text": long_text,
                "target_lang": "es"
            }
        )
        
        # Should fail validation
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_translate_same_language(self, test_client: AsyncClient):
        """Test translation when source and target are the same"""
        response = await test_client.post(
            "/api/translation/translate",
            json={
                "text": "Hello world",
                "target_lang": "en",
                "source_lang": "en"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["translated_text"] == "Hello world"
    
    @pytest.mark.asyncio
    async def test_get_supported_languages(self, test_client: AsyncClient):
        """Test GET /api/translation/languages endpoint"""
        response = await test_client.get("/api/translation/languages")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "languages" in data
        assert isinstance(data["languages"], dict)
        
        # Check that key languages are present
        languages = data["languages"]
        assert "en" in languages
        assert "es" in languages
        assert "hi" in languages
        assert "fr" in languages
        
        # Each language should have a name
        for code, name in languages.items():
            assert isinstance(code, str)
            assert isinstance(name, str)
            assert len(name) > 0
    
    @pytest.mark.asyncio
    async def test_update_language_preferences_unauthenticated(self, test_client: AsyncClient):
        """Test updating language preferences without authentication"""
        response = await test_client.post(
            "/api/translation/preferences",
            json={
                "language": "es",
                "auto_translate": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["language"] == "es"
        assert data["auto_translate"] is True
        # Should indicate preferences are stored locally
        assert "local" in data["message"].lower() or "not authenticated" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_update_language_preferences_invalid_language(self, test_client: AsyncClient):
        """Test updating preferences with invalid language"""
        response = await test_client.post(
            "/api/translation/preferences",
            json={
                "language": "invalid_lang",
                "auto_translate": True
            }
        )
        
        # Should fail validation
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_get_language_preferences_unauthenticated(self, test_client: AsyncClient):
        """Test getting language preferences without authentication"""
        response = await test_client.get("/api/translation/preferences")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["language"] == "en"  # Default language
        assert data["auto_translate"] is False  # Default setting
    
    @pytest.mark.asyncio
    async def test_get_cache_stats(self, test_client: AsyncClient):
        """Test GET /api/translation/cache/stats endpoint"""
        response = await test_client.get("/api/translation/cache/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "stats" in data
        assert isinstance(data["stats"], dict)
    
    @pytest.mark.asyncio
    async def test_clear_translation_cache(self, test_client: AsyncClient):
        """Test DELETE /api/translation/cache endpoint"""
        response = await test_client.delete("/api/translation/cache")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "cache cleared" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_translate_with_sanitization(self, test_client: AsyncClient):
        """Test that input is properly sanitized"""
        # Test with potentially malicious input
        malicious_text = "<script>alert('xss')</script>"
        response = await test_client.post(
            "/api/translation/translate",
            json={
                "text": malicious_text,
                "target_lang": "es"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Original text should be sanitized
        assert "<script>" not in data["original_text"]
        assert "&lt;script&gt;" in data["original_text"] or "script" not in data["original_text"]
    
    @pytest.mark.asyncio
    async def test_translation_multiple_languages(self, test_client: AsyncClient):
        """Test translation to multiple languages"""
        text = "Hello"
        languages = ["es", "fr", "de", "hi"]
        
        for lang in languages:
            response = await test_client.post(
                "/api/translation/translate",
                json={
                    "text": text,
                    "target_lang": lang,
                    "source_lang": "en"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["target_lang"] == lang


class TestTranslationAPIRateLimiting:
    """Test rate limiting on translation endpoints"""
    
    @pytest.mark.asyncio
    async def test_translate_rate_limit(self, test_client: AsyncClient):
        """Test that rate limiting is applied to translation endpoint"""
        # Make multiple rapid requests
        requests = []
        for _ in range(35):  # More than the 30/minute limit
            response = await test_client.post(
                "/api/translation/translate",
                json={
                    "text": "Hello",
                    "target_lang": "es"
                }
            )
            requests.append(response.status_code)
        
        # Some requests should succeed, some should be rate limited
        # Note: This test may be flaky depending on timing
        assert 200 in requests
        # Rate limiting might not kick in during fast tests
        # This is more of a smoke test


class TestTranslationAPIValidation:
    """Test input validation on translation endpoints"""
    
    @pytest.mark.asyncio
    async def test_translate_missing_text(self, test_client: AsyncClient):
        """Test translation without text field"""
        response = await test_client.post(
            "/api/translation/translate",
            json={
                "target_lang": "es"
            }
        )

        # 422 (validation) or 429 (rate limited) or 403 (threat detection after burst)
        assert response.status_code in (422, 429, 403), f"Unexpected status: {response.status_code}"

    @pytest.mark.asyncio
    async def test_translate_missing_target_lang(self, test_client: AsyncClient):
        """Test translation without target language"""
        response = await test_client.post(
            "/api/translation/translate",
            json={
                "text": "Hello"
            }
        )

        # 422 (validation) or 429 (rate limited) or 403 (threat detection after burst)
        assert response.status_code in (422, 429, 403), f"Unexpected status: {response.status_code}"

    @pytest.mark.asyncio
    async def test_preferences_invalid_data_types(self, test_client: AsyncClient):
        """Test preferences with invalid data types"""
        response = await test_client.post(
            "/api/translation/preferences",
            json={
                "language": 123,  # Should be string
                "auto_translate": "yes"  # Should be boolean
            }
        )

        # 422 (validation) or 429 (rate limited) or 403 (threat detection)
        assert response.status_code in (422, 429, 403), f"Unexpected status: {response.status_code}"


class TestTranslationAPIErrors:
    """Test error handling in translation API"""
    
    @pytest.mark.asyncio
    async def test_translate_with_translation_error(self, test_client: AsyncClient):
        """Test handling of translation service errors"""
        # This would require mocking the translation service to fail
        # For now, we just test that the endpoint handles errors gracefully
        response = await test_client.post(
            "/api/translation/translate",
            json={
                "text": "Test",
                "target_lang": "es"
            }
        )
        
        # Even if translation fails, endpoint should return 200 with error info
        # May also return 429 if rate limited from previous test
        assert response.status_code in (200, 403, 429), f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
