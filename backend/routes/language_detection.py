"""
Language Detection API Route

Provides language detection for user input text to enhance multilingual support.
"""

import logging
from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from backend.middleware.rate_limiter import CHAT_RATE_LIMIT, limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/language", tags=["language"])


class LanguageDetectionRequest(BaseModel):
    """Request model for language detection."""
    text: str = Field(..., min_length=1, max_length=1000, description="Text to detect language from")


class LanguageDetectionResponse(BaseModel):
    """Response model for language detection."""
    detected_language: str = Field(..., description="Detected language code (e.g., 'en', 'hi', 'es')")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    supported: bool = Field(..., description="Whether language is supported by KIAAN")
    language_name: str = Field(..., description="Full name of detected language")


# Language patterns for simple detection
LANGUAGE_PATTERNS = {
    'en': {
        'name': 'English',
        'chars': r'[a-zA-Z]',
        'sample': 'the is are and'
    },
    'hi': {
        'name': 'Hindi',
        'chars': r'[\u0900-\u097F]',
        'sample': 'है हैं का'
    },
    'ta': {
        'name': 'Tamil',
        'chars': r'[\u0B80-\u0BFF]',
        'sample': 'இது அது'
    },
    'te': {
        'name': 'Telugu',
        'chars': r'[\u0C00-\u0C7F]',
        'sample': 'ఇది అది'
    },
    'bn': {
        'name': 'Bengali',
        'chars': r'[\u0980-\u09FF]',
        'sample': 'এটি ওটা'
    },
    'mr': {
        'name': 'Marathi',
        'chars': r'[\u0900-\u097F]',
        'sample': 'हे ते'
    },
    'gu': {
        'name': 'Gujarati',
        'chars': r'[\u0A80-\u0AFF]',
        'sample': 'આ તે'
    },
    'kn': {
        'name': 'Kannada',
        'chars': r'[\u0C80-\u0CFF]',
        'sample': 'ಇದು ಅದು'
    },
    'ml': {
        'name': 'Malayalam',
        'chars': r'[\u0D00-\u0D7F]',
        'sample': 'ഇത് അത്'
    },
    'pa': {
        'name': 'Punjabi',
        'chars': r'[\u0A00-\u0A7F]',
        'sample': 'ਇਹ ਉਹ'
    },
    'es': {
        'name': 'Spanish',
        'chars': r'[a-zA-ZáéíóúñÁÉÍÓÚÑ]',
        'sample': 'el la de'
    },
    'fr': {
        'name': 'French',
        'chars': r'[a-zA-ZàâäæçéèêëïîôùûüÿœÀÂÄÆÇÉÈÊËÏÎÔÙÛÜŸŒ]',
        'sample': 'le la de'
    },
    'de': {
        'name': 'German',
        'chars': r'[a-zA-ZäöüßÄÖÜ]',
        'sample': 'der die das'
    },
    'pt': {
        'name': 'Portuguese',
        'chars': r'[a-zA-ZáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]',
        'sample': 'o a de'
    },
    'ja': {
        'name': 'Japanese',
        'chars': r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]',
        'sample': 'の に は'
    },
    'zh-CN': {
        'name': 'Chinese',
        'chars': r'[\u4E00-\u9FFF]',
        'sample': '的 是 在'
    }
}


def simple_detect_language(text: str) -> tuple[str, float]:
    """
    Simple language detection based on character patterns.
    
    Args:
        text: Text to detect language from
        
    Returns:
        Tuple of (language_code, confidence_score)
    """
    import re
    
    if not text or not text.strip():
        return ('en', 0.0)
    
    scores = {}
    
    # Score based on character presence
    for lang_code, pattern_info in LANGUAGE_PATTERNS.items():
        pattern = pattern_info['chars']
        matches = re.findall(pattern, text)
        if matches:
            score = len(matches) / len(text)
            scores[lang_code] = score
    
    if not scores:
        return ('en', 0.5)  # Default to English with medium confidence
    
    # Get language with highest score
    detected_lang = max(scores, key=scores.get)
    confidence = min(scores[detected_lang] * 2, 1.0)  # Scale to 0-1
    
    return (detected_lang, confidence)


@router.post("/detect", response_model=LanguageDetectionResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def detect_language(request: Request, data: LanguageDetectionRequest) -> dict[str, Any]:
    """
    Detect the language of input text.
    
    This endpoint provides simple language detection based on character patterns.
    For production use, consider integrating with Google Cloud Translation API
    or similar services for more accurate detection.
    
    Args:
        request: FastAPI request object
        data: Language detection request data
        
    Returns:
        Language detection result
    """
    try:
        text = data.text.strip()
        
        if not text:
            return {
                "detected_language": "en",
                "confidence": 0.0,
                "supported": True,
                "language_name": "English"
            }
        
        # Detect language
        detected_lang, confidence = simple_detect_language(text)
        
        # Check if supported
        supported = detected_lang in LANGUAGE_PATTERNS
        language_name = LANGUAGE_PATTERNS.get(detected_lang, {}).get('name', 'Unknown')
        
        logger.info(f"Language detected: {detected_lang} (confidence: {confidence:.2f})")
        
        return {
            "detected_language": detected_lang,
            "confidence": confidence,
            "supported": supported,
            "language_name": language_name
        }
        
    except Exception as e:
        logger.error(f"Language detection error: {e}")
        # Return default on error
        return {
            "detected_language": "en",
            "confidence": 0.5,
            "supported": True,
            "language_name": "English"
        }


@router.get("/supported")
async def get_supported_languages() -> dict[str, Any]:
    """
    Get list of supported languages for KIAAN.
    
    Returns:
        Dictionary of supported languages with codes and names
    """
    return {
        "supported_languages": {
            code: info['name']
            for code, info in LANGUAGE_PATTERNS.items()
        },
        "count": len(LANGUAGE_PATTERNS)
    }
