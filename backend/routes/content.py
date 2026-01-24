from typing import Any
import re
import logging

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import ContentPack

router = APIRouter(prefix="/content", tags=["content"])
logger = logging.getLogger(__name__)

# Allowed locale patterns (ISO 639-1 codes with optional region)
LOCALE_PATTERN = re.compile(r'^[a-z]{2}(-[A-Z]{2})?$')

# Supported locales whitelist
SUPPORTED_LOCALES = {
    'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa',
    'es', 'fr', 'de', 'pt', 'ja', 'zh-CN'
}


@router.get("/{locale}")
async def get_pack(
    locale: str = Path(
        ...,
        min_length=2,
        max_length=5,
        description="Locale code (e.g., 'en', 'hi', 'zh-CN')"
    ),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Get content pack for a specific locale.

    Args:
        locale: The locale code to retrieve content for.
        db: Database session.

    Returns:
        Content pack data for the requested locale, or English fallback.

    Raises:
        HTTPException: If locale format is invalid or database error occurs.
    """
    # Validate locale format
    if not LOCALE_PATTERN.match(locale):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid locale format: {locale}. Expected format: 'en' or 'en-US'"
        )

    try:
        # Try to get requested locale
        res = await db.execute(
            select(ContentPack).where(ContentPack.locale == locale)
        )
        row = res.scalar_one_or_none()

        if row and row.data:
            return dict(row.data)

        # Fallback to English
        res2 = await db.execute(
            select(ContentPack).where(ContentPack.locale == "en")
        )
        row2 = res2.scalar_one_or_none()

        if row2 and row2.data:
            return dict(row2.data)

        # Return empty structure if no content found
        return {"packs": []}

    except Exception as e:
        logger.error(f"Error fetching content pack for locale {locale}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve content pack"
        )
