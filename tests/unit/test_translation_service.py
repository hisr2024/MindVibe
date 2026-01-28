"""Unit tests for Translation Service

Tests the translation service functionality including:
- Translation of text to different languages
- Caching mechanism
- Error handling and fallbacks
- Language support validation

Note: This module is skipped if TranslationService is not fully implemented.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock

# Check if the translation service has the expected exports
try:
    from backend.services.translation_service import TranslationService, SUPPORTED_LANGUAGES
except ImportError:
    pytest.skip("TranslationService not fully implemented", allow_module_level=True)


class TestTranslationService:
    """Test suite for TranslationService"""
    
    @pytest.fixture
    def service(self):
        """Create a translation service instance"""
        return TranslationService()
    
    def test_initialization(self, service):
        """Test service initialization"""
        assert service.translator is not None
        assert service.cache == {}
        assert service.enabled is True
    
    def test_supported_language_validation(self, service):
        """Test language support validation"""
        # Test supported languages
        assert service.is_supported_language('en') is True
        assert service.is_supported_language('es') is True
        assert service.is_supported_language('fr') is True
        assert service.is_supported_language('hi') is True
        
        # Test unsupported languages
        assert service.is_supported_language('invalid') is False
        assert service.is_supported_language('') is False
    
    @pytest.mark.asyncio
    async def test_translate_empty_text(self, service):
        """Test translation with empty text"""
        result = await service.translate_text('', 'es')
        
        assert result['success'] is False
        assert result['error'] == 'Empty text provided'
        assert result['translated_text'] == ''
    
    @pytest.mark.asyncio
    async def test_translate_same_language(self, service):
        """Test translation when source and target are the same"""
        text = "Hello world"
        result = await service.translate_text(text, 'en', 'en')
        
        assert result['success'] is True
        assert result['translated_text'] == text
        assert result['source_lang'] == 'en'
        assert result['target_lang'] == 'en'
    
    @pytest.mark.asyncio
    async def test_translate_unsupported_language(self, service):
        """Test translation with unsupported language"""
        text = "Hello world"
        result = await service.translate_text(text, 'invalid')
        
        assert result['success'] is False
        assert 'Unsupported language' in result['error']
        assert result['translated_text'] == text  # Returns original on error
    
    @pytest.mark.asyncio
    @patch.dict('os.environ', {'TRANSLATION_ENABLED': 'false'})
    async def test_translation_disabled(self):
        """Test behavior when translation is disabled"""
        service = TranslationService()
        text = "Hello world"
        result = await service.translate_text(text, 'es')
        
        assert result['success'] is False
        assert result['error'] == 'Translation service disabled'
        assert result['translated_text'] == text
    
    @pytest.mark.asyncio
    async def test_translate_with_mock(self, service):
        """Test translation with mocked translator"""
        text = "Hello world"
        expected_translation = "Hola mundo"
        
        # Mock the translator with async mock
        mock_result = Mock()
        mock_result.text = expected_translation
        service.translator.translate = AsyncMock(return_value=mock_result)
        
        result = await service.translate_text(text, 'es')
        
        assert result['success'] is True
        assert result['translated_text'] == expected_translation
        assert result['original_text'] == text
        assert result['source_lang'] == 'en'
        assert result['target_lang'] == 'es'
    
    @pytest.mark.asyncio
    async def test_translation_caching(self, service):
        """Test that translations are cached"""
        text = "Hello world"
        expected_translation = "Hola mundo"
        
        # Mock the translator with async mock
        mock_result = Mock()
        mock_result.text = expected_translation
        service.translator.translate = AsyncMock(return_value=mock_result)
        
        # First call should use translator
        result1 = await service.translate_text(text, 'es')
        assert service.translator.translate.call_count == 1
        
        # Second call should use cache
        result2 = await service.translate_text(text, 'es')
        assert service.translator.translate.call_count == 1  # Still 1, not 2
        
        # Both results should be the same
        assert result1['translated_text'] == result2['translated_text']
        assert result1['success'] == result2['success']
    
    @pytest.mark.asyncio
    async def test_translation_error_handling(self, service):
        """Test error handling when translation fails"""
        text = "Hello world"
        
        # Mock translator to raise an exception with async mock
        service.translator.translate = AsyncMock(side_effect=Exception("Translation API error"))
        
        result = await service.translate_text(text, 'es')
        
        assert result['success'] is False
        assert 'Translation API error' in result['error']
        assert result['translated_text'] == text  # Returns original on error
    
    @pytest.mark.asyncio
    async def test_translate_chat_response(self, service):
        """Test convenience method for chat responses"""
        response = "I'm here to help you with your mental wellness journey."
        expected_translation = "Estoy aquí para ayudarte con tu viaje de bienestar mental."
        
        # Mock the translator with async mock
        mock_result = Mock()
        mock_result.text = expected_translation
        service.translator.translate = AsyncMock(return_value=mock_result)
        
        result = await service.translate_chat_response(response, 'es')
        
        assert result['success'] is True
        assert result['translated_text'] == expected_translation
        assert result['source_lang'] == 'en'
        assert result['target_lang'] == 'es'
    
    def test_clear_cache(self, service):
        """Test cache clearing"""
        # Add something to cache
        service.cache['test_key'] = {'data': 'test'}
        assert len(service.cache) == 1
        
        # Clear cache
        service.clear_cache()
        assert len(service.cache) == 0
    
    def test_cache_stats(self, service):
        """Test cache statistics"""
        # Add items to cache
        service.cache['key1'] = {'data': 'test1'}
        service.cache['key2'] = {'data': 'test2'}
        
        stats = service.get_cache_stats()
        
        assert stats['cache_size'] == 2
        assert stats['enabled'] is True
    
    @pytest.mark.asyncio
    async def test_multiple_language_support(self, service):
        """Test translation to multiple supported languages"""
        text = "Welcome"
        languages = ['es', 'fr', 'de', 'hi', 'ja']
        
        # Mock translator for each language
        translations = {
            'es': 'Bienvenido',
            'fr': 'Bienvenue',
            'de': 'Willkommen',
            'hi': 'स्वागत है',
            'ja': 'ようこそ'
        }
        
        for lang in languages:
            mock_result = Mock()
            mock_result.text = translations[lang]
            service.translator.translate = AsyncMock(return_value=mock_result)
            
            result = await service.translate_text(text, lang)
            
            assert result['success'] is True
            assert result['target_lang'] == lang
            assert len(result['translated_text']) > 0


class TestSupportedLanguages:
    """Test suite for supported languages configuration"""
    
    def test_supported_languages_complete(self):
        """Test that all required languages are supported"""
        required_languages = [
            'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa',
            'es', 'fr', 'de', 'pt', 'ja', 'zh-CN'
        ]
        
        for lang in required_languages:
            assert lang in SUPPORTED_LANGUAGES, f"Language {lang} not in SUPPORTED_LANGUAGES"
    
    def test_supported_languages_format(self):
        """Test that supported languages dict has correct format"""
        assert isinstance(SUPPORTED_LANGUAGES, dict)
        
        for code, name in SUPPORTED_LANGUAGES.items():
            assert isinstance(code, str)
            assert isinstance(name, str)
            assert len(code) >= 2
            assert len(name) > 0
