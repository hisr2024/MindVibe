"""
Translation API Routes for Multi-Language Support

Provides endpoints for:
- Translating specific messages
- Managing user language preferences
- Auto-translation on message creation
"""

import html
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.middleware.rate_limiter import limiter
from backend.services.translation_service import translation_service, SUPPORTED_LANGUAGES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/translation", tags=["translation"])

# Maximum text length for translation
MAX_TRANSLATION_LENGTH = 5000


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS attacks."""
    return html.escape(text).strip()


class TranslateRequest(BaseModel):
    """Request model for translation."""
    text: str = Field(..., min_length=1, max_length=MAX_TRANSLATION_LENGTH)
    target_lang: str = Field(..., min_length=2, max_length=10)
    source_lang: str = Field(default='en', min_length=2, max_length=10)

    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Validate and sanitize text."""
        if not v or not v.strip():
            raise ValueError('Text cannot be empty')
        return sanitize_input(v)

    @field_validator('target_lang', 'source_lang')
    @classmethod
    def validate_language(cls, v: str) -> str:
        """Validate language code."""
        if not v or not v.strip():
            raise ValueError('Language code cannot be empty')
        return v.lower().strip()


class TranslateResponse(BaseModel):
    """Response model for translation."""
    success: bool
    translated_text: str
    original_text: str
    source_lang: str
    target_lang: str
    provider: str | None = None
    error: str | None = None


class LanguagePreferencesRequest(BaseModel):
    """Request model for updating language preferences."""
    language: str = Field(..., min_length=2, max_length=10)
    auto_translate: bool = Field(default=False)

    @field_validator('language')
    @classmethod
    def validate_language(cls, v: str) -> str:
        """Validate language code."""
        lang = v.lower().strip()
        if lang not in SUPPORTED_LANGUAGES:
            raise ValueError(f'Unsupported language: {lang}')
        return lang


class LanguagePreferencesResponse(BaseModel):
    """Response model for language preferences."""
    success: bool
    language: str
    auto_translate: bool
    message: str | None = None


class SupportedLanguagesResponse(BaseModel):
    """Response model for supported languages."""
    languages: dict[str, str]


@router.post("/translate", response_model=TranslateResponse)
@limiter.limit("30/minute")
async def translate_text(
    request: Request,
    translate_req: TranslateRequest,
    db: AsyncSession = Depends(get_db)
) -> TranslateResponse:
    """
    Translate text from source language to target language.
    
    This endpoint provides translation services with:
    - Input validation and sanitization
    - Rate limiting (30 requests per minute)
    - Caching for improved performance
    - Error handling with fallback
    
    Args:
        request: FastAPI request object (for rate limiting)
        translate_req: Translation request with text and language codes
        db: Database session
    
    Returns:
        TranslateResponse with translated text or error
    """
    try:
        # Use the translation service
        result = await translation_service.translate_text(
            text=translate_req.text,
            target_lang=translate_req.target_lang,
            source_lang=translate_req.source_lang
        )
        
        return TranslateResponse(**result)
        
    except Exception as e:
        logger.error(f"Translation error: {type(e).__name__}: {e}")
        return TranslateResponse(
            success=False,
            translated_text=translate_req.text,
            original_text=translate_req.text,
            source_lang=translate_req.source_lang,
            target_lang=translate_req.target_lang,
            error=str(e)
        )


@router.post("/preferences", response_model=LanguagePreferencesResponse)
@limiter.limit("10/minute")
async def update_language_preferences(
    request: Request,
    preferences: LanguagePreferencesRequest,
    db: AsyncSession = Depends(get_db)
) -> LanguagePreferencesResponse:
    """
    Update user language preferences.
    
    Updates the user's preferred language and auto-translation settings.
    If user is not authenticated, returns success with a message indicating
    preferences are stored locally only.
    
    Args:
        request: FastAPI request object (for rate limiting and user info)
        preferences: Language preferences to update
        db: Database session
    
    Returns:
        LanguagePreferencesResponse with success status
    """
    try:
        # Try to get user_id from request (if authenticated)
        user_id = getattr(request.state, 'user_id', None)
        
        if user_id:
            # Update database for authenticated users
            from backend.models import User
            
            stmt = (
                update(User)
                .where(User.id == user_id)
                .values(
                    locale=preferences.language,
                    auto_translate=preferences.auto_translate
                )
            )
            
            await db.execute(stmt)
            await db.commit()
            
            logger.info(f"Updated language preferences for user {user_id}")
            message = "Preferences saved successfully"
        else:
            # For unauthenticated users, just return success
            # Frontend will handle local storage
            message = "Preferences saved locally (user not authenticated)"
            logger.info("Language preferences update for unauthenticated user")
        
        return LanguagePreferencesResponse(
            success=True,
            language=preferences.language,
            auto_translate=preferences.auto_translate,
            message=message
        )
        
    except Exception as e:
        logger.error(f"Error updating language preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update preferences: {str(e)}"
        )


@router.get("/preferences", response_model=LanguagePreferencesResponse)
@limiter.limit("30/minute")
async def get_language_preferences(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> LanguagePreferencesResponse:
    """
    Get user language preferences.
    
    Returns the user's preferred language and auto-translation settings.
    If user is not authenticated, returns default preferences.
    
    Args:
        request: FastAPI request object
        db: Database session
    
    Returns:
        LanguagePreferencesResponse with user preferences
    """
    try:
        # Try to get user_id from request (if authenticated)
        user_id = getattr(request.state, 'user_id', None)
        
        if user_id:
            # Query database for authenticated users
            from backend.models import User
            
            stmt = select(User).where(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user:
                return LanguagePreferencesResponse(
                    success=True,
                    language=user.locale or 'en',
                    auto_translate=getattr(user, 'auto_translate', False),
                    message="Preferences retrieved successfully"
                )
        
        # Return default preferences for unauthenticated users
        return LanguagePreferencesResponse(
            success=True,
            language='en',
            auto_translate=False,
            message="Default preferences (user not authenticated)"
        )
        
    except Exception as e:
        logger.error(f"Error retrieving language preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve preferences: {str(e)}"
        )


@router.get("/languages", response_model=SupportedLanguagesResponse)
@limiter.limit("60/minute")
async def get_supported_languages(request: Request) -> SupportedLanguagesResponse:
    """
    Get list of supported languages.
    
    Returns a dictionary of language codes and their names.
    
    Args:
        request: FastAPI request object (for rate limiting)
    
    Returns:
        SupportedLanguagesResponse with language codes and names
    """
    return SupportedLanguagesResponse(languages=SUPPORTED_LANGUAGES)


@router.delete("/cache")
@limiter.limit("5/minute")
async def clear_translation_cache(request: Request) -> dict[str, Any]:
    """
    Clear the translation cache.
    
    This endpoint allows clearing the translation cache.
    Can be useful for testing or troubleshooting.
    
    Args:
        request: FastAPI request object (for rate limiting)
    
    Returns:
        Success message
    """
    try:
        translation_service.clear_cache()
        return {
            "success": True,
            "message": "Translation cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get("/cache/stats")
@limiter.limit("30/minute")
async def get_cache_stats(request: Request) -> dict[str, Any]:
    """
    Get translation cache statistics.
    
    Returns information about the current cache state.
    
    Args:
        request: FastAPI request object (for rate limiting)
    
    Returns:
        Cache statistics
    """
    try:
        stats = translation_service.get_cache_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Error retrieving cache stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve cache stats: {str(e)}"
        )
