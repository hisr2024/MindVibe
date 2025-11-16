"""Gita API Routes

Provides RESTful endpoints for Bhagavad Gita wisdom access including
AI-powered guidance, verse lookup, semantic search, and theme browsing.
"""

import os

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import GitaVerse

router = APIRouter(prefix="/api/gita", tags=["gita"])


# Request/Response Schemas
class WisdomQueryRequest(BaseModel):
    """Request model for AI-powered wisdom guidance."""

    query: str = Field(..., min_length=3, max_length=500, description="User's question")
    language: str = Field(
        default="english",
        pattern="^(english|hindi|sanskrit)$",
        description="Preferred language",
    )
    context_type: str | None = Field(
        default=None, description="Optional context type"
    )


class VerseReference(BaseModel):
    """A referenced Gita verse in wisdom response."""

    chapter: int
    verse: int
    verse_id: str
    text: str
    translation: str | None = None
    sanskrit: str | None = None
    theme: str


class WisdomQueryResponse(BaseModel):
    """Response model for wisdom queries."""

    query: str
    guidance: str
    verses: list[VerseReference] = Field(default_factory=list)
    modern_context: str | None = None
    language: str


class VerseDetail(BaseModel):
    """Detailed verse information with all translations."""

    chapter: int
    verse: int
    verse_id: str
    sanskrit: str
    english: str
    hindi: str
    theme: str
    principle: str | None = None


class VerseResponse(BaseModel):
    """Response model for single verse lookup."""

    verse: VerseDetail
    related_verses: list[VerseReference] = Field(default_factory=list)


class VerseSummary(BaseModel):
    """Summary information for a verse in lists."""

    chapter: int
    verse: int
    verse_id: str
    theme: str
    preview: str


class ChapterResponse(BaseModel):
    """Response model for chapter information and verses."""

    chapter: int
    name: str
    summary: str
    verse_count: int
    verses: list[VerseSummary] = Field(default_factory=list)
    themes: list[str] = Field(default_factory=list)


class SearchResult(BaseModel):
    """A single search result with relevance score."""

    verse: VerseDetail
    relevance_score: float
    match_context: str | None = None


class SearchResponse(BaseModel):
    """Response model for semantic search."""

    query: str
    results: list[SearchResult] = Field(default_factory=list)
    total_results: int
    page: int = 1
    page_size: int = 10
    has_more: bool
    filters_applied: dict[str, str | list[str]] = Field(default_factory=dict)


class ThemeInfo(BaseModel):
    """Information about a specific theme."""

    theme_id: str
    name: str
    description: str
    verse_count: int
    example_verses: list[VerseSummary] = Field(default_factory=list)


class ThemeResponse(BaseModel):
    """Response model for theme browsing."""

@router.get("/chapters", response_model=list[ChapterInfo])
async def browse_chapters(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """
    Get chapter information with verse listing.

    Returns detailed information about a specific chapter including its
    verses, themes, and summary.

    **Example:** `/api/gita/chapters/2`
    """
    if chapter_id not in CHAPTER_METADATA:
        raise HTTPException(status_code=404, detail=f"Chapter {chapter_id} not found")

    metadata = CHAPTER_METADATA[chapter_id]

    # Get verses for this chapter
    query = select(GitaVerse).where(GitaVerse.chapter == chapter_id).order_by(GitaVerse.verse)
    result = await db.execute(query)
    verses = list(result.scalars().all())

    # Format verse summaries
    verse_summaries = [
        VerseSummary(
            chapter=v.chapter,
            verse=v.verse,
            verse_id=f"{v.chapter}.{v.verse}",
            theme=v.theme,
            preview=v.english[:100] + "..." if len(v.english) > 100 else v.english,
        )
        for v in verses
    ]

    # Get unique themes in this chapter
    themes_query = select(distinct(GitaVerse.theme)).where(GitaVerse.chapter == chapter_id)
    themes_result = await db.execute(themes_query)
    themes = [row[0] for row in themes_result.all()]

    return ChapterResponse(
        chapter=chapter_id,
        name=metadata["name"],
        summary=metadata["summary"],
        verse_count=len(verses) if verses else metadata["verse_count"],
        verses=verse_summaries,
        themes=themes,
    )


@router.get("/verses/{chapter}/{verse}", response_model=VerseResponse)
async def get_verse(
    chapter: int,
    verse: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get a specific verse with all translations.

    Returns complete verse information including Sanskrit, English, and Hindi
    translations, along with theme and principle.

    **Example:** `/api/gita/verses/2/47`
    """
    # Query for the specific verse
    query = select(GitaVerse).where(
        GitaVerse.chapter == chapter,
        GitaVerse.verse == verse,
    )
    result = await db.execute(query)
    verse_obj = result.scalar_one_or_none()

    if not verse_obj:
        raise HTTPException(
            status_code=404,
            detail=f"Verse {chapter}.{verse} not found",
        )

    # Get related verses (same theme, different chapter/verse)
    related_query = (
        select(GitaVerse)
        .where(
            GitaVerse.theme == verse_obj.theme,
            or_(
                GitaVerse.chapter != chapter,
                GitaVerse.verse != verse,
            ),
        )
        .limit(3)
    )
    related_result = await db.execute(related_query)
    related_verses = list(related_result.scalars().all())

    # Format verse detail
    verse_detail = VerseDetail(
        chapter=verse_obj.chapter,
        verse=verse_obj.verse,
        verse_id=f"{verse_obj.chapter}.{verse_obj.verse}",
        sanskrit=verse_obj.sanskrit,
        english=verse_obj.english,
        hindi=verse_obj.hindi,
        theme=verse_obj.theme,
        principle=verse_obj.principle,
    )

    # Format related verses
    related_refs = [
        {
            "chapter": v.chapter,
            "verse": v.verse,
            "verse_id": f"{v.chapter}.{v.verse}",
            "text": v.english,
            "translation": None,
            "sanskrit": None,
            "theme": v.theme,
        }
        for v in related_verses
    ]

    return VerseResponse(verse=verse_detail, related_verses=related_refs)

@router.post("/search")
async def semantic_search(
    query: WisdomRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Semantic search across all verses.

    Search Gita verses by keywords with optional theme filtering.
    Supports pagination and multi-language search.

    **Example:** `/api/gita/search?keyword=peace&theme=inner_peace&page=1`
    """
    # Build search query
    lang_field = getattr(GitaVerse, language)
    search_conditions = [lang_field.ilike(f"%{keyword}%")]

    if theme:
        search_conditions.append(GitaVerse.theme == theme)

    # Count total results
    count_query = select(func.count()).select_from(GitaVerse).where(*search_conditions)
    count_result = await db.execute(count_query)
    total_results = count_result.scalar() or 0

    # Get paginated results
    offset = (page - 1) * page_size
    search_query = (
        select(GitaVerse)
        .where(*search_conditions)
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(search_query)
    verses = list(result.scalars().all())

    # Format results
    search_results = [
        SearchResult(
            verse=VerseDetail(
                chapter=v.chapter,
                verse=v.verse,
                verse_id=f"{v.chapter}.{v.verse}",
                sanskrit=v.sanskrit,
                english=v.english,
                hindi=v.hindi,
                theme=v.theme,
                principle=v.principle,
            ),
            relevance_score=0.8,  # Placeholder score (semantic search would calculate this)
            match_context=f"Matched keyword '{keyword}' in {language} text",
        )
        for v in verses
    ]

    filters_applied = {"language": language}
    if theme:
        filters_applied["theme"] = theme

    return SearchResponse(
        query=keyword,
        results=search_results,
        total_results=total_results,
        page=page,
        page_size=page_size,
        has_more=(offset + page_size) < total_results,
        filters_applied=filters_applied,
    )


@router.get("/themes", response_model=ThemeResponse)
async def browse_themes(
    db: AsyncSession = Depends(get_db),
):
    """
    Browse verses by principle or life theme.

    Returns all available themes with verse counts and example verses.
    Useful for exploring Gita teachings by topic.

    **Example:** `/api/gita/themes`
    """
    # Get all distinct themes with counts
    theme_query = select(
        GitaVerse.theme,
        func.count(GitaVerse.id).label("count"),
    ).group_by(GitaVerse.theme)

    result = await db.execute(theme_query)
    theme_rows = result.all()

    themes_info = []
    for theme_id, count in theme_rows:
        # Get example verses for this theme
        example_query = (
            select(GitaVerse)
            .where(GitaVerse.theme == theme_id)
            .limit(3)
        )
        example_result = await db.execute(example_query)
        examples = list(example_result.scalars().all())

        example_verses = [
            VerseSummary(
                chapter=v.chapter,
                verse=v.verse,
                verse_id=f"{v.chapter}.{v.verse}",
                theme=v.theme,
                preview=v.english[:100] + "..." if len(v.english) > 100 else v.english,
            )
            for v in examples
        ]

        themes_info.append(
            ThemeInfo(
                theme_id=theme_id,
                name=theme_id.replace("_", " ").title(),
                description=f"Verses related to {theme_id.replace('_', ' ')}",
                verse_count=count,
                example_verses=example_verses,
            )
        )

    return ThemeResponse(
        themes=sorted(themes_info, key=lambda x: x.verse_count, reverse=True),
        total_themes=len(themes_info),
    )


@router.get("/translations/{verse_id}", response_model=TranslationSet)
async def get_translations(
    verse_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all translations for a specific verse.

    Returns all available language translations (Sanskrit, English, Hindi)
    for the specified verse.

    **Example:** `/api/gita/translations/2.47`
    """
    # Parse verse_id
    try:
        chapter, verse = map(int, verse_id.split("."))
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail="Invalid verse_id format. Use 'chapter.verse' (e.g., '2.47')",
        ) from e

    # Query for the verse
    query = select(GitaVerse).where(
        GitaVerse.chapter == chapter,
        GitaVerse.verse == verse,
    )
    result = await db.execute(query)
    verse_obj = result.scalar_one_or_none()

    if not verse_obj:
        raise HTTPException(
            status_code=404,
            detail=f"Verse {verse_id} not found",
        )

    return TranslationSet(
        verse_id=verse_id,
        chapter=verse_obj.chapter,
        verse=verse_obj.verse,
        translations={
            "sanskrit": verse_obj.sanskrit,
            "english": verse_obj.english,
            "hindi": verse_obj.hindi,
        },
        theme=verse_obj.theme,
        principle=verse_obj.principle,
    )


@router.get("/languages")
async def get_languages() -> dict:
    """
    Get list of supported languages for Gita content.

    Returns available language options for verse translations.
    """
    return {
        "languages": [
            {"code": "english", "name": "English"},
            {"code": "hindi", "name": "Hindi"},
            {"code": "sanskrit", "name": "Sanskrit"},
        ]
    }


@router.post("/wisdom")
async def wisdom_consultation(
    query: WisdomRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """
    AI-powered Gita wisdom consultation.

    Args:
        query: User's question
        verses: Relevant Gita verses
        language: Response language

    Returns:
        AI-generated guidance text
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key or openai_key == "your-api-key-here":
        return generate_template_gita_response(query, verses, language)

    try:
        import openai

        openai.api_key = openai_key
        verse_context = "\n\n".join(
            [
                f"Verse {v.chapter}.{v.verse}:\n{v.english}\n\nTheme: {v.theme}"
                for v in verses
            ]
        )

        system_prompt = """You are a Gita wisdom guide helping people with life challenges.
Provide practical, compassionate guidance based on Gita teachings in accessible modern language.

IMPORTANT:
- Be respectful and inclusive
- Focus on universal principles
- Provide actionable advice
- Keep responses concise (2-3 paragraphs)
"""

        user_prompt = f"""User's Question: {query}

Relevant Gita Verses:
{verse_context}

Provide guidance that:
1. Addresses their concern directly
2. Explains relevant Gita principles
3. Offers practical steps
4. Is encouraging and supportive

Response:"""

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=400,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        return generate_template_gita_response(query, verses, language)


def generate_template_gita_response(
    query: str, verses: list[GitaVerse], language: str
) -> str:
    """Generate template-based response when OpenAI is unavailable."""
    if not verses:
        return "The Gita teaches us to remain steady in the face of challenges. Focus on your duty, act with wisdom, and trust in the process of growth."

    top_verse = verses[0]
    theme_responses = {
        "action_without_attachment": "The Gita teaches the principle of performing your duties without attachment to outcomes. Focus on giving your best effort while releasing anxiety about results. This mental freedom allows you to work with clarity and peace.",
        "equanimity": "Maintaining mental balance is key to inner peace. The Gita guides us to remain steady through life's ups and downs, treating success and failure equally. This equanimity comes from inner strength, not external circumstances.",
        "self_knowledge": "Understanding your true nature is essential for peace. The Gita teaches that you are more than your circumstances, thoughts, or emotions. Connect with this deeper awareness through reflection and mindfulness.",
    }

    return theme_responses.get(
        top_verse.theme,
        f"The Gita's wisdom on {top_verse.theme.replace('_', ' ')} offers guidance for your situation. Focus on steady practice, self-awareness, and balanced action. Remember that growth is a gradual process - be patient with yourself.",
    )
