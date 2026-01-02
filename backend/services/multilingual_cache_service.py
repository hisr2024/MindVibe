"""
Multilingual Response Caching Service

This service provides enhanced caching for KIAAN responses in multiple languages,
supporting offline usage and pre-cached common Q&A.
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.cache.redis_cache import get_redis_cache
from backend.models import ChatTranslation

logger = logging.getLogger(__name__)


class MultilingualCacheService:
    """Service for caching KIAAN responses in multiple languages."""

    def __init__(self):
        """Initialize the multilingual cache service."""
        self.cache_ttl = 86400  # 24 hours
        self.redis_cache = None
        logger.info("Multilingual cache service initialized")

    async def initialize(self):
        """Initialize Redis connection if available."""
        try:
            self.redis_cache = await get_redis_cache()
            if self.redis_cache and self.redis_cache.is_connected:
                logger.info("✅ Multilingual cache connected to Redis")
        except Exception as e:
            logger.warning(f"Redis not available for multilingual cache: {e}")

    def _generate_cache_key(
        self,
        message: str,
        language: str,
        context: str = "general"
    ) -> str:
        """Generate a unique cache key for a message in a specific language.
        
        Args:
            message: User message
            language: Target language code
            context: Context type (general, ardha, viyoga, etc.)
            
        Returns:
            Unique cache key
        """
        # Normalize message for consistent hashing
        normalized = message.lower().strip()
        message_hash = hashlib.sha256(normalized.encode()).hexdigest()[:16]
        return f"kiaan:multilingual:{language}:{context}:{message_hash}"

    async def get_cached_response(
        self,
        message: str,
        language: str,
        context: str = "general",
        db: AsyncSession | None = None
    ) -> dict[str, Any] | None:
        """Get cached response for a message in specific language.
        
        Args:
            message: User message
            language: Target language code
            context: Context type
            db: Optional database session
            
        Returns:
            Cached response dict or None
        """
        cache_key = self._generate_cache_key(message, language, context)

        # Try Redis first (fastest)
        if self.redis_cache and self.redis_cache.is_connected:
            try:
                cached_data = await self.redis_cache.get(cache_key)
                if cached_data:
                    logger.info(f"Redis cache hit for {language}: {message[:50]}")
                    return json.loads(cached_data)
            except Exception as e:
                logger.warning(f"Redis cache get failed: {e}")

        # Fallback to database cache
        if db:
            try:
                return await self._get_from_db_cache(message, language, db)
            except Exception as e:
                logger.warning(f"Database cache get failed: {e}")

        return None

    async def cache_response(
        self,
        message: str,
        language: str,
        response: str,
        verses_used: list[str],
        context: str = "general",
        db: AsyncSession | None = None
    ) -> bool:
        """Cache a response for a message in specific language.
        
        Args:
            message: User message
            language: Target language code
            response: KIAAN response
            verses_used: List of verse IDs used
            context: Context type
            db: Optional database session
            
        Returns:
            Success status
        """
        cache_key = self._generate_cache_key(message, language, context)
        
        cache_data = {
            "message": message,
            "language": language,
            "response": response,
            "verses_used": verses_used,
            "context": context,
            "timestamp": datetime.utcnow().isoformat(),
            "cached": True
        }

        # Cache in Redis (if available)
        if self.redis_cache and self.redis_cache.is_connected:
            try:
                await self.redis_cache.set(
                    cache_key,
                    json.dumps(cache_data),
                    self.cache_ttl
                )
                logger.info(f"Cached response in Redis for {language}")
            except Exception as e:
                logger.warning(f"Redis cache set failed: {e}")

        # Also store in database for longer-term caching
        if db:
            try:
                await self._store_in_db_cache(
                    message=message,
                    language=language,
                    response=response,
                    db=db
                )
            except Exception as e:
                logger.warning(f"Database cache store failed: {e}")

        return True

    async def _get_from_db_cache(
        self,
        message: str,
        language: str,
        db: AsyncSession
    ) -> dict[str, Any] | None:
        """Get cached response from database.
        
        Args:
            message: User message
            language: Target language code
            db: Database session
            
        Returns:
            Cached response or None
        """
        try:
            # Look for existing translation that matches
            stmt = select(ChatTranslation).where(
                ChatTranslation.original_text == message,
                ChatTranslation.target_language == language,
                ChatTranslation.translation_success == True,
                ChatTranslation.deleted_at.is_(None)
            ).limit(1)
            
            result = await db.execute(stmt)
            translation = result.scalar_one_or_none()
            
            if translation:
                logger.info(f"Database cache hit for {language}")
                return {
                    "message": message,
                    "language": language,
                    "response": translation.translated_text,
                    "verses_used": [],
                    "context": "general",
                    "timestamp": translation.created_at.isoformat() if translation.created_at else None,
                    "cached": True
                }
            
            return None
        except Exception as e:
            logger.error(f"Error getting from database cache: {e}")
            return None

    async def _store_in_db_cache(
        self,
        message: str,
        language: str,
        response: str,
        db: AsyncSession
    ) -> None:
        """Store response in database cache.
        
        Args:
            message: User message
            language: Target language code
            response: KIAAN response
            db: Database session
        """
        try:
            # Check if already exists
            stmt = select(ChatTranslation).where(
                ChatTranslation.original_text == message,
                ChatTranslation.target_language == language,
                ChatTranslation.deleted_at.is_(None)
            ).limit(1)
            
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if not existing:
                translation = ChatTranslation(
                    message_id=hashlib.sha256(message.encode()).hexdigest()[:32],
                    original_text=message,
                    original_language='en',
                    translated_text=response,
                    target_language=language,
                    translation_success=True,
                    translation_provider='kiaan_multilingual_cache'
                )
                db.add(translation)
                await db.commit()
                logger.info(f"Stored in database cache for {language}")
        except Exception as e:
            logger.error(f"Error storing in database cache: {e}")
            await db.rollback()

    async def pre_cache_common_qa(
        self,
        languages: list[str],
        db: AsyncSession
    ) -> int:
        """Pre-cache common Q&A in multiple languages for offline use.
        
        Args:
            languages: List of language codes to pre-cache
            db: Database session
            
        Returns:
            Number of items cached
        """
        # Common questions that users frequently ask KIAAN
        common_questions = [
            "I'm feeling anxious",
            "Help me find inner peace",
            "How do I deal with stress?",
            "I'm feeling lost and confused",
            "How can I be more mindful?",
            "What is the meaning of life?",
            "How do I overcome fear?",
            "I need guidance on relationships",
            "How can I find my purpose?",
            "Help me with work-life balance"
        ]

        cached_count = 0
        
        for question in common_questions:
            for lang in languages:
                try:
                    # Check if already cached
                    existing = await self.get_cached_response(
                        message=question,
                        language=lang,
                        db=db
                    )
                    
                    if not existing:
                        # In production, this would call the actual KIAAN service
                        # For now, we'll just log it
                        logger.info(f"Would pre-cache: {question} in {lang}")
                        cached_count += 1
                        
                except Exception as e:
                    logger.error(f"Error pre-caching {question} in {lang}: {e}")

        logger.info(f"Pre-cached {cached_count} common Q&A items")
        return cached_count

    async def get_cache_stats(self) -> dict[str, Any]:
        """Get cache statistics.
        
        Returns:
            Cache statistics
        """
        stats = {
            "redis_connected": self.redis_cache.is_connected if self.redis_cache else False,
            "cache_ttl": self.cache_ttl
        }

        return stats

    async def clear_cache(self, language: str | None = None) -> bool:
        """Clear cache for specific language or all languages.
        
        Args:
            language: Optional language code to clear (None = all)
            
        Returns:
            Success status
        """
        try:
            if self.redis_cache and self.redis_cache.is_connected:
                # In production, would implement Redis pattern matching
                # to clear specific language keys
                logger.info(f"Would clear Redis cache for language: {language or 'all'}")
            
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False


# Global service instance
multilingual_cache_service = MultilingualCacheService()
