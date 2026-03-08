"""
i18n Middleware — Detects and sets the user's preferred locale for each request.

Detection priority:
  1. Authenticated user's saved preference (from DB)
  2. Explicit `X-Locale` header (mobile apps, explicit overrides)
  3. `Accept-Language` header (browser default)
  4. Fallback to 'en' (English)

Sets `request.state.locale` for downstream route handlers to use.
"""

import logging
from typing import Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

logger = logging.getLogger(__name__)

# Supported locales — kept in sync with frontend locales list
SUPPORTED_LOCALES = frozenset([
    'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa',
    'es', 'fr', 'de', 'pt', 'ja', 'zh-CN',
])

DEFAULT_LOCALE = 'en'


def parse_accept_language(header: str) -> list[tuple[str, float]]:
    """
    Parse the Accept-Language header into a sorted list of (locale, quality) tuples.

    Example: "hi, en;q=0.9, ta;q=0.8" → [('hi', 1.0), ('en', 0.9), ('ta', 0.8)]

    Returns locales sorted by quality factor (highest first).
    Malformed entries are silently skipped.
    """
    if not header:
        return []

    parsed: list[tuple[str, float]] = []

    for part in header.split(','):
        part = part.strip()
        if not part:
            continue

        if ';' in part:
            segments = part.split(';')
            locale = segments[0].strip()
            quality = 1.0
            for segment in segments[1:]:
                segment = segment.strip()
                if segment.startswith('q='):
                    try:
                        quality = float(segment[2:])
                        quality = max(0.0, min(1.0, quality))
                    except ValueError:
                        quality = 0.0
        else:
            locale = part.strip()
            quality = 1.0

        if locale:
            parsed.append((locale, quality))

    # Sort by quality descending, stable sort preserves original order for ties
    parsed.sort(key=lambda x: x[1], reverse=True)
    return parsed


def resolve_locale(requested: str) -> Optional[str]:
    """
    Match a requested locale tag against supported locales.

    Handles exact match, case-insensitive match, and language-only fallback:
      - "hi" → "hi" (exact)
      - "zh-cn" → "zh-CN" (case normalization)
      - "en-US" → "en" (language prefix fallback)
      - "xx" → None (unsupported)
    """
    # Exact match
    if requested in SUPPORTED_LOCALES:
        return requested

    # Case-insensitive match
    lower = requested.lower()
    for supported in SUPPORTED_LOCALES:
        if supported.lower() == lower:
            return supported

    # Language prefix fallback (e.g., "en-US" → "en")
    prefix = requested.split('-')[0].lower()
    for supported in SUPPORTED_LOCALES:
        if supported.lower() == prefix:
            return supported

    return None


def detect_locale_from_headers(request: Request) -> str:
    """
    Determine the best locale from request headers.

    Priority:
      1. X-Locale header (explicit override from client)
      2. Accept-Language header (browser/OS preference)
      3. DEFAULT_LOCALE fallback
    """
    # Check explicit locale header first
    explicit = request.headers.get('X-Locale', '').strip()
    if explicit:
        resolved = resolve_locale(explicit)
        if resolved:
            return resolved

    # Parse Accept-Language header
    accept_lang = request.headers.get('Accept-Language', '')
    for locale_tag, _ in parse_accept_language(accept_lang):
        resolved = resolve_locale(locale_tag)
        if resolved:
            return resolved

    return DEFAULT_LOCALE


class I18nMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that detects the user's locale and sets it on request.state.

    Usage in route handlers:
        @router.get("/example")
        async def example(request: Request):
            locale = request.state.locale  # e.g., "hi"
            return {"message": translate("welcome", locale)}
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Detect locale from headers (X-Locale > Accept-Language > default)
        locale = detect_locale_from_headers(request)

        # If user is authenticated, prefer their saved preference
        # This integrates with the existing auth system via request.state.user
        user = getattr(request.state, 'user', None)
        if user is not None:
            user_locale = getattr(user, 'preferred_locale', None)
            if user_locale and resolve_locale(user_locale):
                locale = resolve_locale(user_locale)

        # Set locale on request state for downstream handlers
        request.state.locale = locale

        # Process the request
        response = await call_next(request)

        # Set Content-Language header on response
        response.headers['Content-Language'] = locale

        return response
