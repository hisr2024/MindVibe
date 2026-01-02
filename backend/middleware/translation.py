"""Translation Middleware for Chat Responses

This middleware intercepts chatbot outputs and provides translation
functionality with caching and error handling.
"""

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import ChatTranslation
from backend.services.translation_service import translation_service

logger = logging.getLogger(__name__)


class TranslationMiddleware:
    """
    Middleware to handle translation of chat responses.
    
    Intercepts chat responses and translates them to the user's preferred
    language, storing both original and translated versions in the database.
    """
    
    def __init__(self):
        """Initialize translation middleware."""
        self.service = translation_service
        logger.info("Translation middleware initialized")
    
    async def translate_response(
        self,
        response: str,
        target_lang: str,
        db: AsyncSession,
        user_id: str | None = None,
        session_id: str | None = None,
        message_id: str | None = None
    ) -> dict[str, Any]:
        """
        Translate a chat response and store in database.
        
        Args:
            response: Original response text
            target_lang: Target language code
            db: Database session
            user_id: Optional user ID
            session_id: Optional session ID
            message_id: Optional message ID (auto-generated if not provided)
        
        Returns:
            Dictionary with:
                - original_text: Original response
                - translated_text: Translated response
                - target_language: Target language code
                - success: Translation success status
                - message_id: Unique message identifier
        """
        # Generate message ID if not provided
        if not message_id:
            message_id = str(uuid.uuid4())
        
        # If target language is English, no translation needed
        if target_lang == 'en':
            logger.info("Target language is English, returning original")
            
            # Still store in database for record keeping
            await self._store_translation(
                db=db,
                message_id=message_id,
                original_text=response,
                translated_text=response,
                target_lang='en',
                success=True,
                user_id=user_id,
                session_id=session_id
            )
            
            return {
                'original_text': response,
                'translated_text': response,
                'target_language': 'en',
                'success': True,
                'message_id': message_id
            }
        
        # Check if translation already exists in database
        cached_translation = await self._get_cached_translation(
            db=db,
            original_text=response,
            target_lang=target_lang
        )
        
        if cached_translation:
            logger.info(f"Using cached translation for language: {target_lang}")
            return {
                'original_text': response,
                'translated_text': cached_translation,
                'target_language': target_lang,
                'success': True,
                'message_id': message_id,
                'cached': True
            }
        
        # Translate the response
        translation_result = await self.service.translate_chat_response(
            response=response,
            target_lang=target_lang
        )
        
        # Store in database
        await self._store_translation(
            db=db,
            message_id=message_id,
            original_text=response,
            translated_text=translation_result['translated_text'],
            target_lang=target_lang,
            success=translation_result['success'],
            error=translation_result.get('error'),
            user_id=user_id,
            session_id=session_id
        )
        
        return {
            'original_text': response,
            'translated_text': translation_result['translated_text'],
            'target_language': target_lang,
            'success': translation_result['success'],
            'error': translation_result.get('error'),
            'message_id': message_id,
            'cached': False
        }
    
    async def _get_cached_translation(
        self,
        db: AsyncSession,
        original_text: str,
        target_lang: str
    ) -> str | None:
        """
        Get cached translation from database.
        
        Args:
            db: Database session
            original_text: Original text
            target_lang: Target language code
        
        Returns:
            Translated text if found, None otherwise
        """
        try:
            # Query for existing translation
            stmt = select(ChatTranslation).where(
                ChatTranslation.original_text == original_text,
                ChatTranslation.target_language == target_lang,
                ChatTranslation.translation_success == True,
                ChatTranslation.deleted_at.is_(None)
            ).limit(1)
            
            result = await db.execute(stmt)
            translation = result.scalar_one_or_none()
            
            if translation:
                return translation.translated_text
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting cached translation: {e}")
            return None
    
    async def _store_translation(
        self,
        db: AsyncSession,
        message_id: str,
        original_text: str,
        translated_text: str,
        target_lang: str,
        success: bool,
        user_id: str | None = None,
        session_id: str | None = None,
        error: str | None = None
    ) -> None:
        """
        Store translation in database.
        
        Args:
            db: Database session
            message_id: Unique message identifier
            original_text: Original text
            translated_text: Translated text
            target_lang: Target language code
            success: Translation success status
            user_id: Optional user ID
            session_id: Optional session ID
            error: Optional error message
        """
        try:
            translation = ChatTranslation(
                message_id=message_id,
                user_id=user_id,
                session_id=session_id,
                original_text=original_text,
                original_language='en',
                translated_text=translated_text,
                target_language=target_lang,
                translation_success=success,
                translation_error=error,
                translation_provider='google_translate'
            )
            
            db.add(translation)
            await db.commit()
            
            logger.info(f"Translation stored: {message_id}")
            
        except Exception as e:
            logger.error(f"Error storing translation: {e}")
            await db.rollback()


# Global middleware instance
translation_middleware = TranslationMiddleware()
