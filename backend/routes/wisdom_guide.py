"""Universal Wisdom Guide API Routes

Provides endpoints for accessing universal wisdom and AI-powered guidance
based on ancient teachings presented in a non-religious, universally applicable way."""

import os

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import WisdomVerse
from backend.services.wisdom_kb import WisdomKnowledgeBase

router = APIRouter(prefix="/api/wisdom", tags=["wisdom"])


# Request/Response Models
class WisdomQuery(BaseModel):
    """Request model for wisdom queries."""

    query: str = Field(..., description="The user's question or concern", min_length=3)
    language: str = Field(
        default="english", description="Preferred language: english, hindi, or sanskrit"
    )
    include_sanskrit: bool = Field(
        default=False, description="Include Sanskrit text in response"
    )


class VerseReference(BaseModel):
    """A referenced wisdom verse."""

    verse_id: str
    theme: str
    text: str
    context: str
    language: str
    sanskrit: str | None = None
    applications: list[str]


class WisdomResponse(BaseModel):
    """Response model for wisdom queries."""

    response: str = Field(
        ..., description="AI-generated guidance based on universal wisdom"
    )
    verses: list[VerseReference] = Field(..., description="Referenced wisdom verses")
    language: str


class SearchQuery(BaseModel):
    """Request model for semantic search."""

    query: str = Field(..., description="Search query or question", min_length=3)


@router.post("/query", response_model=WisdomResponse)
async def query_wisdom(query: WisdomQuery, db: AsyncSession = Depends(get_db)) -> WisdomResponse:
    """Query the universal wisdom guide with a question or concern."""
    valid_languages = ["english", "hindi", "sanskrit"]
    if query.language not in valid_languages:
        raise HTTPException(
            status_code=400,
            detail=f"Language must be one of: {', '.join(valid_languages)}",
        )

    kb = WisdomKnowledgeBase()
    relevant_verses = await kb.search_relevant_verses(db=db, query=query.query, limit=3)

    if not relevant_verses:
        raise HTTPException(
            status_code=404,
            detail="No relevant wisdom verses found. Please try a different query.",
        )

    verse_references = []
    for item in relevant_verses:
        verse = item["verse"]
        formatted = kb.format_verse_response(
            verse=verse,
            language=query.language,
            include_sanskrit=query.include_sanskrit,
        )
        verse_references.append(VerseReference(**formatted))

    ai_response = await generate_wisdom_response(
        query=query.query, verses=relevant_verses, language=query.language
    )

    return WisdomResponse(
        response=ai_response, verses=verse_references, language=query.language
    )


@router.get("/themes")
async def list_themes(db: AsyncSession = Depends(get_db)) -> dict:
    """List all available wisdom themes."""
    from sqlalchemy import distinct, select

    result = await db.execute(select(distinct(WisdomVerse.theme)))
    themes = [row[0] for row in result.all()]
    return {
        "themes": [
            {"id": theme, "name": theme.replace("_", " ").title()}
            for theme in sorted(themes)
        ]
    }


@router.get("/verses/{verse_id}")
async def get_verse(
    verse_id: str,
    language: str = Query(default="english", pattern="^(english|hindi|sanskrit)$"),
    include_sanskrit: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get a specific wisdom verse by ID."""
    kb = WisdomKnowledgeBase()
    verse = await kb.get_verse_by_id(db, verse_id)
    if not verse:
        raise HTTPException(status_code=404, detail=f"Verse {verse_id} not found")
    return kb.format_verse_response(
        verse=verse, language=language, include_sanskrit=include_sanskrit
    )


@router.get("/verses")
async def list_verses(
    language: str = Query(default="english", pattern="^(english|hindi|sanskrit)$"),
    theme: str | None = Query(default=None),
    application: str | None = Query(default=None),
    include_sanskrit: bool = Query(default=False),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List wisdom verses with optional filtering."""
    from sqlalchemy import func, select

    kb = WisdomKnowledgeBase()

    if theme:
        query = select(WisdomVerse).where(WisdomVerse.theme == theme)
        count_query = (
            select(func.count())
            .select_from(WisdomVerse)
            .where(WisdomVerse.theme == theme)
        )
    elif application:
        verses = await kb.search_verses_by_application(db, application)
        total = len(verses)
        paginated_verses = verses[offset : offset + limit]
        formatted_verses = [
            kb.format_verse_response(
                verse=verse, language=language, include_sanskrit=include_sanskrit
            )
            for verse in paginated_verses
        ]
        return {
            "verses": formatted_verses,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total,
        }
    else:
        query = select(WisdomVerse)
        count_query = select(func.count()).select_from(WisdomVerse)

    total_result = await db.execute(count_query)
    total_count = total_result.scalar()
    total = total_count if total_count is not None else 0
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    verses = list(result.scalars().all())
    formatted_verses = [
        kb.format_verse_response(
            verse=verse, language=language, include_sanskrit=include_sanskrit
        )
        for verse in verses
    ]

    return {
        "verses": formatted_verses,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total,
    }


@router.post("/search")
async def semantic_search(
    search_query: SearchQuery,
    language: str = Query(default="english", pattern="^(english|hindi|sanskrit)$"),
    theme: str | None = Query(default=None),
    application: str | None = Query(default=None),
    include_sanskrit: bool = Query(default=False),
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Perform semantic search over wisdom content."""
    query = search_query.query
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    kb = WisdomKnowledgeBase()
    relevant_verses = await kb.search_relevant_verses(
        db=db, query=query, limit=limit, theme=theme, application=application
    )

    if not relevant_verses:
        raise HTTPException(
            status_code=404,
            detail="No relevant wisdom verses found. Please try a different query.",
        )

    results = []
    for item in relevant_verses:
        formatted = kb.format_verse_response(
            verse=item["verse"], language=language, include_sanskrit=include_sanskrit
        )
        formatted["relevance_score"] = round(item["score"], 3)
        results.append(formatted)

    return {
        "query": query,
        "results": results,
        "total_results": len(results),
        "language": language,
    }


@router.get("/applications")
async def list_applications(db: AsyncSession = Depends(get_db)) -> dict:
    """List all available mental health applications."""
    from sqlalchemy import select

    result = await db.execute(select(WisdomVerse))
    verses = result.scalars().all()
    applications_set = set()
    for verse in verses:
        apps = verse.mental_health_applications.get("applications", [])
        applications_set.update(apps)
    return {
        "applications": sorted(applications_set),
        "total": len(applications_set),
    }


async def generate_wisdom_response(
    query: str, verses: list[dict], language: str
) -> str:
    """Generate AI-powered response using OpenAI GPT-4."""
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key or openai_key == "your-api-key-here":
        return generate_template_response(query, verses, language)

    try:
        import openai

        openai.api_key = openai_key
        verse_context = "\n\n".join(
            [
                f"Wisdom Teaching {i+1}:\n{item['verse'].english}\n\nContext: {item['verse'].context}"
                for i, item in enumerate(verses)
            ]
        )
        system_prompt = """You are a universal wisdom guide that helps people with mental health and personal growth challenges.
You draw from timeless wisdom teachings but present them in a completely secular, universally applicable way.

CRITICAL RULES:
- NEVER mention Krishna, Arjuna, Hindu deities, or any religious figures
- NEVER use terms like "Lord", "God", "Divine", "Holy" in a religious context
- Present all wisdom as universal principles applicable to anyone
- Focus on practical mental health applications
- Use modern, accessible language
- Be compassionate and supportive

Your role is to help people find inner peace, emotional balance, and personal growth through universal wisdom principles."""
        user_prompt = f"""User's Question: {query}\n\nRelevant Universal Wisdom Teachings:\n{verse_context}\n\nPlease provide a compassionate, practical response that:\n1. Addresses the user's concern directly\n2. Explains how the wisdom principles apply to their situation\n3. Offers concrete steps they can take\n4. Uses only universal, non-religious language\n5. Is warm and encouraging\n
Response:"""
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        return generate_template_response(query, verses, language)


def generate_template_response(query: str, verses: list[dict], language: str) -> str:
    """Generate a template-based response when OpenAI is not available."""
    if not verses:
        return "I understand your concern. While I don't have specific guidance at this moment, remember that inner peace comes from within. Practice mindfulness, be patient with yourself, and take things one step at a time."
    top_verse = verses[0]["verse"]
    responses = {
        "action_without_attachment": "Your concern touches on a fundamental principle of inner peace: learning to act without being attached to outcomes. This ancient wisdom teaches us to focus on our efforts and actions, while releasing our grip on specific results. By doing this, we free ourselves from anxiety about the future and disappointment about the past.",
        "equanimity_in_adversity": "In times of difficulty, the most powerful tool you have is your ability to remain centered. This timeless wisdom reminds us that external circumstances are constantly changing, but we can cultivate an inner stability that remains unshaken. Like a tree that bends in the wind but doesn't break, you can develop resilience.",
        "control_of_mind": "You're recognizing an important truth: our thoughts and mental patterns significantly impact our wellbeing. Ancient wisdom teaches us to observe our thought patterns and recognize that we are not our thoughts - we are the awareness behind them. Through regular practice and patience, you can develop greater mental clarity.",
        "self_empowerment": "This challenge is an opportunity for growth. Remember that you have within you the power to transform your situation. Your mind can be your greatest ally in this journey. By cultivating self-awareness and taking deliberate action, you can create positive change in your life.",
        "mastering_the_mind": "It's perfectly natural to find the mind difficult to control - this is a universal human experience. The key is not to fight against it, but to work with it patiently. Like training a muscle, developing mental discipline takes time and consistent practice.",
        "practice_and_persistence": "Change takes time and consistent effort. This ancient teaching reminds us that mastery comes through dedicated practice, not perfection. Be patient with yourself, celebrate small victories, and trust in the process.",
        "impermanence": "What you're experiencing is temporary. All emotions, sensations, and situations have a beginning and an end. By remembering this, you can endure difficult moments with greater ease and appreciate positive moments more fully.",
        "inner_peace": "True peace comes from inner stability, not external circumstances. Like an ocean that remains calm in its depths even when waves disturb the surface, you can cultivate an inner tranquility that persists regardless of external conditions.",
        "self_knowledge": "Understanding yourself is key to transformation. This wisdom teaches us to recognize different aspects of our being - our body, senses, thoughts, and the deeper awareness that observes all of these. Through self-inquiry, you can discover your true nature.",
        "inner_joy": "You're learning an important lesson: lasting happiness comes from within, not from external achievements or possessions. By turning your attention inward through meditation and self-reflection, you can discover a wellspring of contentment that doesn't depend on circumstances.",
    }
    theme_response = responses.get(
        top_verse.theme,
        "Your question touches on deep wisdom about human nature and wellbeing. Remember that you have inner resources to face any challenge. Practice self-compassion, stay present, and trust in your ability to grow through this experience.",
    )
    return f"{theme_response}\n\nReflect on the wisdom teaching provided, and consider how you might apply its principles to your situation. Remember, transformation is a gradual process - be patient and kind to yourself along the way."
