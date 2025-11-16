"""Gita API Routes

Provides RESTful endpoints for Bhagavad Gita wisdom access including
AI-powered guidance, verse lookup, semantic search, and theme browsing.
"""

import os

from fastapi import APIRouter, Depends, HTTPException
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

        system_prompt = """You are a Bhagavad Gita wisdom guide helping people with life challenges.
You MUST base ALL responses ONLY on the Bhagavad Gita verses provided to you.

CRITICAL REQUIREMENTS:
- ONLY provide guidance based on the specific Gita verses provided
- EVERY response MUST explicitly reference which Gita principle/verse it uses
- FORBID any advice not grounded in the provided Gita wisdom
- MANDATORY structured response format (see below)
- Quote or paraphrase the Gita verses provided
- Draw ONLY from provided verses - no generic advice

MANDATORY RESPONSE STRUCTURE:
**Ancient Wisdom Principle:** [Specific Gita concept from the verses provided - cite chapter.verse]
**Modern Application:** [How this Gita teaching applies to the user's situation]
**Practical Steps:** [Action items based ONLY on Gita guidance from the verses]
**Deeper Understanding:** [Philosophical insight from the Gita verses provided]

ABSOLUTE RULES:
- Every piece of advice must trace back to a provided verse
- No generic advice without clear Gita foundation
- Reference specific verses (chapter.verse format)
- Be compassionate while staying true to Gita principles
"""

        user_prompt = f"""User's Question: {query}

Bhagavad Gita Verses Provided:
{verse_context}

MANDATORY REQUIREMENTS:
1. Use ONLY the Gita verses provided above - no other sources
2. Follow the MANDATORY RESPONSE STRUCTURE exactly:
   **Ancient Wisdom Principle:** [Extract specific concept from verses with chapter.verse]
   **Modern Application:** [Apply to user's situation]
   **Practical Steps:** [Based on Gita guidance only]
   **Deeper Understanding:** [Philosophical insight from verses]
3. Quote or reference the specific verses provided
4. Every suggestion must trace to a provided verse
5. Be compassionate while staying true to Gita wisdom

Response (following the structure above):"""

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
    """Generate template-based Gita response when OpenAI is unavailable.

    All responses are 100% derived from Bhagavad Gita principles with structured format.
    """
    if not verses:
        return """**Ancient Wisdom Principle:** The Bhagavad Gita teaches in Chapter 2, Verse 47 that we have the right to perform our duties, but not to the fruits of our actions.

**Modern Application:** When facing challenges without specific guidance, the Gita's fundamental teaching applies: focus on right action with detachment from outcomes.

**Practical Steps:**
1. Identify your immediate duty (Svadharma) in this situation
2. Perform it with full dedication without worrying about results
3. Practice daily meditation to cultivate inner steadiness (Sthita-prajna)
4. Study Gita teachings regularly for deeper understanding

**Deeper Understanding:** The Gita reveals that suffering comes from attachment to outcomes. By focusing on righteous action (Dharma) and releasing attachment to fruits, you find both peace and effectiveness."""

    top_verse = verses[0]
    verse_ref = f"{top_verse.chapter}.{top_verse.verse}"
    verse_preview = top_verse.english[:150] if len(top_verse.english) > 150 else top_verse.english

    # 100% Gita-derived structured responses
    theme_responses = {
        "action_without_attachment": f"""**Ancient Wisdom Principle:** Bhagavad Gita {verse_ref} teaches Nishkama Karma - action without attachment to fruits. The verse states: "{verse_preview}..."

**Modern Application:** Your concern relates directly to this cornerstone Gita teaching. Anxiety and dissatisfaction arise from attachment to outcomes rather than dedication to duty itself.

**Practical Steps:**
1. Perform your responsibilities (Karma) with excellence as an offering
2. Release mental attachment to specific results - they are not in your control
3. Find fulfillment in the quality and righteousness of your action, not in outcomes
4. Practice viewing both success and failure as teachers on your spiritual path

**Deeper Understanding:** The Gita teaches (2.47) that attachment to fruits of action is the root cause of anxiety. By performing duty without desire for reward, you achieve Karma Yoga - action that purifies the mind and leads to liberation.""",

        "equanimity": f"""**Ancient Wisdom Principle:** Bhagavad Gita {verse_ref} teaches Samatvam (equanimity) - mental equilibrium in all circumstances. The verse teaches: "{verse_preview}..."

**Modern Application:** The Gita's teaching of Samatvam addresses your situation directly. True stability comes from inner balance, not controlling external circumstances.

**Practical Steps:**
1. Practice Samatvam: witness success and failure with equal mind (Gita 2.48)
2. Recognize the temporary nature of all external conditions (Anitya)
3. Cultivate the observer perspective - you are the witness, not the circumstances
4. Daily meditation to establish yourself in your unchanging true nature (Atman)

**Deeper Understanding:** Gita 2.48 defines Yoga itself as Samatvam - equanimity. This balanced mind is not indifference but wisdom that sees beyond dualities to the unchanging Self within all change.""",

        "self_knowledge": f"""**Ancient Wisdom Principle:** Bhagavad Gita {verse_ref} teaches Atma-Jnana (Self-knowledge) as the path to liberation. The verse reveals: "{verse_preview}..."

**Modern Application:** The Gita's teaching on knowing your true Self applies to your situation. You are experiencing life through identification with what changes; the Gita points to what never changes.

**Practical Steps:**
1. Practice self-inquiry (Atma-Vichara): distinguish between the Self and non-Self
2. Study Gita Chapter 13 on the Field and Knower of the Field
3. Meditate daily to experience yourself as the witness of thoughts/emotions
4. Recognize: "I am not this body, mind, or circumstances - I am the eternal Atman"

**Deeper Understanding:** Gita 13.1-2 teaches discrimination between Kshetra (field of body-mind) and Kshetrajna (the knower/Self). This Self-knowledge is the supreme wisdom that liberates from all suffering.""",

        "mind_control": f"""**Ancient Wisdom Principle:** Bhagavad Gita {verse_ref} teaches that the mind is restless (Chanchal) but can be controlled through Abhyasa (practice) and Vairagya (detachment). The verse states: "{verse_preview}..."

**Modern Application:** The Gita acknowledges your experience - mind control is difficult but achievable through the specific methods taught by Krishna.

**Practical Steps:**
1. Abhyasa: Practice regular meditation daily, even if briefly at first
2. Vairagya: Cultivate detachment by observing thoughts without following them
3. Use the breath or a mantra as an anchor when mind wanders (Gita 6.26)
4. Be patient - Gita 6.35 promises mastery through persistent practice

**Deeper Understanding:** Gita 6.5-6 teaches the mind can be your best friend or worst enemy. Through Abhyasa and Vairagya, you transform the mind from obstacle to ally on the path to Self-realization.""",

        "duty": f"""**Ancient Wisdom Principle:** Bhagavad Gita {verse_ref} teaches Svadharma - performing one's own duty, even imperfectly, is better than another's duty well performed. The verse teaches: "{verse_preview}..."

**Modern Application:** The Gita's teaching on duty (Dharma) addresses your situation. Confusion about responsibilities is resolved by understanding and performing your Svadharma.

**Practical Steps:**
1. Identify your Svadharma based on your nature, abilities, and life situation
2. Perform it wholeheartedly, even if imperfectly (Gita 18.47-48)
3. Don't abandon your duty out of fear or difficulty
4. Offer your actions as service, transforming duty into spiritual practice

**Deeper Understanding:** Gita 3.35 and 18.47 teach that one's own duty, though lesser, is preferable to another's. Performing Svadharma without attachment purifies the mind and leads to liberation.""",

        "perseverance": f"""**Ancient Wisdom Principle:** Bhagavad Gita {verse_ref} teaches about persistent practice (Abhyasa) and not giving up on the spiritual path. The verse reveals: "{verse_preview}..."

**Modern Application:** The Gita directly addresses challenges in sustaining effort. Progress requires Abhyasa - dedicated, continuous practice over time.

**Practical Steps:**
1. Commit to daily practice, however small (consistency matters more than intensity)
2. When you fall, rise immediately without self-condemnation (Gita 6.24)
3. Remember Gita 2.40: no effort on this path is ever wasted
4. Trust the process - results come through sustained practice, not perfection

**Deeper Understanding:** Gita 6.23-24 teaches perseverance (Asanshayam) in yoga practice. Chapter 2.40 promises that no sincere effort toward Self-realization is lost - it protects you from the greatest fear.""",

        "detachment": f"""**Ancient Wisdom Principle:** Bhagavad Gita {verse_ref} teaches Vairagya (detachment) - freedom from compulsive desire and aversion. The verse states: "{verse_preview}..."

**Modern Application:** The Gita's teaching on detachment applies to your situation. True freedom comes not from having what you want but from releasing compulsive grasping.

**Practical Steps:**
1. Practice discrimination (Viveka) between what is eternal and temporary
2. Observe your desires and aversions without acting on them compulsively
3. Enjoy experiences that come naturally without chasing or clinging (Gita 3.34)
4. Cultivate contentment (Santosha) with what you have while performing duty

**Deeper Understanding:** Gita 2.62-63 describes how attachment leads to desire, then anger, delusion, and destruction. Vairagya breaks this chain, establishing you in wisdom and peace.""",
    }

    return theme_responses.get(
        top_verse.theme,
        f"""**Ancient Wisdom Principle:** Bhagavad Gita {verse_ref} offers timeless wisdom: "{verse_preview}..."

**Modern Application:** This Gita teaching applies to your situation by revealing eternal principles that transcend time and circumstance.

**Practical Steps:**
1. Study the Gita verse relevant to your concern in depth
2. Practice meditation (Dhyana) to internalize the teaching
3. Apply the principle in your daily life consistently
4. Seek guidance from those learned in Gita wisdom for deeper understanding

**Deeper Understanding:** The Bhagavad Gita addresses all human challenges through eternal wisdom about the Self, duty, devotion, and knowledge. Your situation is an opportunity to apply these sacred teachings and discover your true nature.""",
    )
