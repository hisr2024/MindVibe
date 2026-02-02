"""Translation Service for Multi-Language Support

This service provides translation capabilities for chatbot responses using
Google Translate API with caching and fallback mechanisms.

If googletrans is not installed, the service will operate in fallback mode
returning original text with a warning.
"""

import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Try to import googletrans, fall back gracefully if not available
try:
    from googletrans import Translator
    GOOGLETRANS_AVAILABLE = True
except ImportError:
    GOOGLETRANS_AVAILABLE = False
    Translator = None
    logger.warning(
        "googletrans not installed. Translation service will operate in fallback mode. "
        "Install with: pip install googletrans==4.0.0-rc1"
    )

# Language codes supported by the application
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'sa': 'Sanskrit',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'ja': 'Japanese',
    'zh-CN': 'Chinese (Simplified)',
}


class TranslationService:
    """
    Translation service for chatbot responses.

    Provides real-time translation of chat responses with caching,
    error handling, and fallback mechanisms.
    """

    def __init__(self):
        """Initialize translation service."""
        self.translator: Optional[Any] = None
        self.cache: dict[str, Any] = {}
        self.enabled = True
        self.googletrans_available = GOOGLETRANS_AVAILABLE

        # Check if translation is enabled
        translation_enabled = os.getenv('TRANSLATION_ENABLED', 'true').lower()
        self.enabled = translation_enabled == 'true'

        # Only initialize translator if googletrans is available
        if GOOGLETRANS_AVAILABLE and self.enabled:
            try:
                self.translator = Translator()
                logger.info("✅ Translation service initialized with googletrans")
            except Exception as e:
                logger.warning(f"⚠️ Failed to initialize googletrans: {e}")
                self.translator = None
                self.googletrans_available = False
        elif not GOOGLETRANS_AVAILABLE:
            logger.warning("⚠️ Translation service running in fallback mode (googletrans not installed)")
        else:
            logger.warning("⚠️ Translation service disabled by configuration")
    
    def is_supported_language(self, lang_code: str) -> bool:
        """Check if language is supported."""
        return lang_code in SUPPORTED_LANGUAGES
    
    async def translate_text(
        self,
        text: str,
        target_lang: str,
        source_lang: str = 'en'
    ) -> dict[str, Any]:
        """
        Translate text to target language.
        
        Args:
            text: Text to translate
            target_lang: Target language code (e.g., 'es', 'fr')
            source_lang: Source language code (default: 'en')
        
        Returns:
            Dictionary with:
                - translated_text: Translated text
                - original_text: Original text
                - source_lang: Source language code
                - target_lang: Target language code
                - success: Translation success status
                - error: Error message if failed
        """
        # Validate input
        if not text or not text.strip():
            return {
                'translated_text': text,
                'original_text': text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'success': False,
                'error': 'Empty text provided'
            }
        
        # If target language is same as source, return original
        if target_lang == source_lang:
            return {
                'translated_text': text,
                'original_text': text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'success': True,
                'error': None
            }
        
        # Check if language is supported
        if not self.is_supported_language(target_lang):
            logger.warning(f"Unsupported language: {target_lang}")
            return {
                'translated_text': text,
                'original_text': text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'success': False,
                'error': f'Unsupported language: {target_lang}'
            }
        
        # Check if translation is disabled or unavailable
        if not self.enabled or not self.googletrans_available or self.translator is None:
            reason = 'Translation service disabled' if not self.enabled else 'googletrans not installed'
            logger.info(f"Translation unavailable ({reason}), returning original text")
            return {
                'translated_text': text,
                'original_text': text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'success': False,
                'error': reason,
                'provider': 'fallback'
            }

        # Check cache
        cache_key = f"{source_lang}:{target_lang}:{text[:100]}"
        if cache_key in self.cache:
            logger.info(f"Cache hit for translation: {target_lang}")
            return self.cache[cache_key]

        try:
            # Translate using Google Translate
            # Note: googletrans 4.0.0-rc1 uses synchronous calls
            import asyncio
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.translator.translate(text, src=source_lang, dest=target_lang)
            )

            translation_result = {
                'translated_text': result.text,
                'original_text': text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'success': True,
                'error': None,
                'provider': 'googletrans'
            }

            # Cache the result
            self.cache[cache_key] = translation_result

            logger.info(f"✅ Translation successful: {source_lang} -> {target_lang}")
            return translation_result

        except Exception as e:
            logger.error(f"Translation error: {type(e).__name__}: {e}")
            return {
                'translated_text': text,
                'original_text': text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'success': False,
                'error': str(e),
                'provider': 'fallback'
            }
    
    async def translate_chat_response(
        self,
        response: str,
        target_lang: str
    ) -> dict[str, Any]:
        """
        Translate a chat response to target language.
        
        Convenience method specifically for chat responses.
        
        Args:
            response: Chat response text
            target_lang: Target language code
        
        Returns:
            Translation result dictionary
        """
        return await self.translate_text(
            text=response,
            target_lang=target_lang,
            source_lang='en'
        )
    
    def clear_cache(self):
        """Clear translation cache."""
        self.cache.clear()
        logger.info("Translation cache cleared")
    
    def get_cache_stats(self) -> dict[str, Any]:
        """Get cache statistics."""
        return {
            'cache_size': len(self.cache),
            'enabled': self.enabled,
            'googletrans_available': self.googletrans_available,
            'translator_initialized': self.translator is not None
        }


# Global translation service instance
translation_service = TranslationService()
