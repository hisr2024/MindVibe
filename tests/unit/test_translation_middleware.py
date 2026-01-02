"""Integration tests for Translation Middleware

Tests the translation middleware functionality including:
- Translation of chat responses
- Database storage of translations
- Caching from database
- Error handling
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.ext.asyncio import AsyncSession
from backend.middleware.translation import TranslationMiddleware
from backend.models import ChatTranslation


class TestTranslationMiddleware:
    """Test suite for TranslationMiddleware"""
    
    @pytest.fixture
    def middleware(self):
        """Create a translation middleware instance"""
        return TranslationMiddleware()
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database session"""
        db = AsyncMock(spec=AsyncSession)
        db.execute = AsyncMock()
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        db.add = Mock()
        return db
    
    @pytest.mark.asyncio
    async def test_translate_response_english(self, middleware, mock_db):
        """Test translation when target language is English"""
        response = "Hello, how can I help you today?"
        
        result = await middleware.translate_response(
            response=response,
            target_lang='en',
            db=mock_db
        )
        
        assert result['success'] is True
        assert result['translated_text'] == response
        assert result['original_text'] == response
        assert result['target_language'] == 'en'
        assert 'message_id' in result
    
    @pytest.mark.asyncio
    async def test_translate_response_with_service(self, middleware, mock_db):
        """Test translation using the translation service"""
        response = "Hello, how can I help you today?"
        target_lang = 'es'
        expected_translation = "Hola, ¿cómo puedo ayudarte hoy?"
        
        # Mock the translation service
        mock_service_result = {
            'translated_text': expected_translation,
            'original_text': response,
            'source_lang': 'en',
            'target_lang': target_lang,
            'success': True,
            'error': None
        }
        
        with patch.object(
            middleware.service,
            'translate_chat_response',
            return_value=mock_service_result
        ):
            result = await middleware.translate_response(
                response=response,
                target_lang=target_lang,
                db=mock_db
            )
        
        assert result['success'] is True
        assert result['translated_text'] == expected_translation
        assert result['original_text'] == response
        assert result['target_language'] == target_lang
        assert result['cached'] is False
    
    @pytest.mark.asyncio
    async def test_translate_response_with_user_session(self, middleware, mock_db):
        """Test translation with user ID and session ID"""
        response = "How are you feeling today?"
        user_id = "user123"
        session_id = "session456"
        
        # Mock the translation service
        mock_service_result = {
            'translated_text': "¿Cómo te sientes hoy?",
            'original_text': response,
            'source_lang': 'en',
            'target_lang': 'es',
            'success': True,
            'error': None
        }
        
        with patch.object(
            middleware.service,
            'translate_chat_response',
            return_value=mock_service_result
        ):
            result = await middleware.translate_response(
                response=response,
                target_lang='es',
                db=mock_db,
                user_id=user_id,
                session_id=session_id
            )
        
        assert result['success'] is True
        # Verify the database add was called
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_translate_response_with_message_id(self, middleware, mock_db):
        """Test translation with provided message ID"""
        response = "I'm here to support you."
        message_id = "msg-123"
        
        # Mock the translation service
        mock_service_result = {
            'translated_text': "Estoy aquí para apoyarte.",
            'original_text': response,
            'source_lang': 'en',
            'target_lang': 'es',
            'success': True,
            'error': None
        }
        
        with patch.object(
            middleware.service,
            'translate_chat_response',
            return_value=mock_service_result
        ):
            result = await middleware.translate_response(
                response=response,
                target_lang='es',
                db=mock_db,
                message_id=message_id
            )
        
        assert result['success'] is True
        assert result['message_id'] == message_id
    
    @pytest.mark.asyncio
    async def test_translate_response_caching(self, middleware, mock_db):
        """Test that translation uses database cache"""
        response = "Welcome to MindVibe"
        cached_translation = "Bienvenido a MindVibe"
        
        # Mock database query to return cached translation
        mock_translation = Mock(spec=ChatTranslation)
        mock_translation.translated_text = cached_translation
        
        mock_result = Mock()
        mock_result.scalar_one_or_none = Mock(return_value=mock_translation)
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        result = await middleware.translate_response(
            response=response,
            target_lang='es',
            db=mock_db
        )
        
        assert result['success'] is True
        assert result['translated_text'] == cached_translation
        assert result['cached'] is True
    
    @pytest.mark.asyncio
    async def test_translate_response_error_handling(self, middleware, mock_db):
        """Test error handling when translation fails"""
        response = "Hello"
        
        # Mock the translation service to fail
        mock_service_result = {
            'translated_text': response,
            'original_text': response,
            'source_lang': 'en',
            'target_lang': 'es',
            'success': False,
            'error': 'Translation API error'
        }
        
        with patch.object(
            middleware.service,
            'translate_chat_response',
            return_value=mock_service_result
        ):
            result = await middleware.translate_response(
                response=response,
                target_lang='es',
                db=mock_db
            )
        
        assert result['success'] is False
        assert result['error'] == 'Translation API error'
        assert result['translated_text'] == response  # Returns original on error
    
    @pytest.mark.asyncio
    async def test_store_translation_error_handling(self, middleware, mock_db):
        """Test error handling when storing translation fails"""
        response = "Test message"
        
        # Mock database commit to fail
        mock_db.commit = AsyncMock(side_effect=Exception("Database error"))
        
        # Mock the translation service
        mock_service_result = {
            'translated_text': "Mensaje de prueba",
            'original_text': response,
            'source_lang': 'en',
            'target_lang': 'es',
            'success': True,
            'error': None
        }
        
        with patch.object(
            middleware.service,
            'translate_chat_response',
            return_value=mock_service_result
        ):
            # Should not raise exception even if storage fails
            result = await middleware.translate_response(
                response=response,
                target_lang='es',
                db=mock_db
            )
        
        # Translation should still succeed even if storage fails
        assert result['success'] is True
        # Rollback should be called on error
        mock_db.rollback.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_cached_translation_not_found(self, middleware, mock_db):
        """Test getting cached translation when not found"""
        # Mock database query to return None
        mock_result = Mock()
        mock_result.scalar_one_or_none = Mock(return_value=None)
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        cached = await middleware._get_cached_translation(
            db=mock_db,
            original_text="Test",
            target_lang='es'
        )
        
        assert cached is None
    
    @pytest.mark.asyncio
    async def test_get_cached_translation_error(self, middleware, mock_db):
        """Test error handling when getting cached translation"""
        # Mock database query to raise exception
        mock_db.execute = AsyncMock(side_effect=Exception("Database error"))
        
        cached = await middleware._get_cached_translation(
            db=mock_db,
            original_text="Test",
            target_lang='es'
        )
        
        # Should return None on error, not raise exception
        assert cached is None


class TestTranslationIntegration:
    """Integration tests for translation workflow"""
    
    @pytest.mark.asyncio
    async def test_full_translation_workflow(self):
        """Test complete translation workflow from request to storage"""
        middleware = TranslationMiddleware()
        mock_db = AsyncMock(spec=AsyncSession)
        mock_db.execute = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.add = Mock()
        
        response = "I understand how you're feeling."
        expected_translation = "Entiendo cómo te sientes."
        
        # Mock the translation service
        mock_service_result = {
            'translated_text': expected_translation,
            'original_text': response,
            'source_lang': 'en',
            'target_lang': 'es',
            'success': True,
            'error': None
        }
        
        with patch.object(
            middleware.service,
            'translate_chat_response',
            return_value=mock_service_result
        ):
            result = await middleware.translate_response(
                response=response,
                target_lang='es',
                db=mock_db,
                user_id='user123',
                session_id='session456'
            )
        
        # Verify translation was successful
        assert result['success'] is True
        assert result['translated_text'] == expected_translation
        
        # Verify database operations were called
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
