"""
Universal Wisdom Guide API Routes

Provides endpoints for accessing universal wisdom and AI-powered guidance
based on ancient teachings presented in a non-religious, universally applicable way.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
import os

# Support both package and direct imports
try:
    from ..deps import get_db
    from ..services.wisdom_kb import WisdomKnowledgeBase
except ImportError:
    from deps import get_db
    from services.wisdom_kb import WisdomKnowledgeBase


router = APIRouter(prefix="/api/wisdom", tags=["wisdom"])


# Request/Response Models
class WisdomQuery(BaseModel):
    """Request model for wisdom queries."""
    query: str = Field(..., description="The user's question or concern")
    language: str = Field(default="english", description="Preferred language: english, hindi, or sanskrit")
    include_sanskrit: bool = Field(default=False, description="Include Sanskrit text in response")


class VerseReference(BaseModel):
    """A referenced wisdom verse."""
    verse_id: str
    theme: str
    text: str
    context: str
    language: str
    sanskrit: Optional[str] = None
    applications: List[str]


class WisdomResponse(BaseModel):
    """Response model for wisdom queries."""
    response: str = Field(..., description="AI-generated guidance based on universal wisdom")
    verses: List[VerseReference] = Field(..., description="Referenced wisdom verses")
    language: str


class SearchQuery(BaseModel):
    """Request model for semantic search."""
    query: str = Field(..., description="Search query or question")


@router.post("/query", response_model=WisdomResponse)
async def query_wisdom(
    query: WisdomQuery,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Query the universal wisdom guide with a question or concern.
    
    Returns AI-generated guidance along with relevant wisdom verses
    presented in a universally applicable, non-religious way.
    
    **Request Body Example:**
    ```json
    {
      "query": "I'm feeling anxious about my future",
      "language": "english",
      "include_sanskrit": false
    }
    ```
    
    **Response:** AI-generated guidance with 3 most relevant verses.
    """
    # Validate query manually to return 400 as tests expect
    if not query.query or not query.query.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="query must not be empty")
    if len(query.query.strip()) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="query too short")
    
    # Validate language (Pydantic validates min_length)
    valid_languages = ["english", "hindi", "sanskrit"]
    if query.language not in valid_languages:
        raise HTTPException(
            status_code=400, 
            detail=f"Language must be one of: {', '.join(valid_languages)}"
        )
    
    # Search for relevant verses
    kb = WisdomKnowledgeBase()
    relevant_verses = await kb.search_relevant_verses(
        db=db,
        query=query.query,
        limit=3
    )
    
    if not relevant_verses:
        raise HTTPException(
            status_code=404,
            detail="No relevant wisdom verses found. Please try a different query."
        )
    
    # Format verses for response
    verse_references = []
    for item in relevant_verses:
        verse = item["verse"]
        formatted = kb.format_verse_response(
            verse=verse,
            language=query.language,
            include_sanskrit=query.include_sanskrit
        )
        verse_references.append(VerseReference(**formatted))
    
    # Generate AI response using OpenAI (if API key is available)
    ai_response = await generate_wisdom_response(
        query=query.query,
        verses=relevant_verses,
        language=query.language
    )
    
    return WisdomResponse(
        response=ai_response,
        verses=verse_references,
        language=query.language
    )


@router.get("/themes")
async def list_themes(db: AsyncSession = Depends(get_db)):
    """
    List all available wisdom themes.
    
    **Returns:** List of all unique themes available in the wisdom database,
    useful for filtering and discovery.
    
    **Example:** `/api/wisdom/themes`
    """
    from sqlalchemy import select, distinct
    try:
        from ..models import WisdomVerse
    except ImportError:
        from models import WisdomVerse
    
    result = await db.execute(select(distinct(WisdomVerse.theme)))
    themes = [row[0] for row in result.all()]
    
    return {
        "themes": [
            {
                "id": theme,
                "name": theme.replace('_', ' ').title()
            }
            for theme in sorted(themes)
        ]
    }


@router.get("/verses/{verse_id}")
async def get_verse(
    verse_id: str,
    language: str = Query(default="english", pattern="^(english|hindi|sanskrit)$"),
    include_sanskrit: bool = Query(default=False),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific wisdom verse by ID.
    
    **Example:** `/api/wisdom/verses/2.47?language=english&include_sanskrit=true`
    
    **Returns:** A single verse with text, theme, context, and mental health applications.
    """
    kb = WisdomKnowledgeBase()
    verse = await kb.get_verse_by_id(db, verse_id)
    
    if not verse:
        raise HTTPException(status_code=404, detail=f"Verse {verse_id} not found")
    
    formatted = kb.format_verse_response(
        verse=verse,
        language=language,
        include_sanskrit=include_sanskrit
    )
    
    return formatted


@router.get("/verses")
async def list_verses(
    language: str = Query(default="english", pattern="^(english|hindi|sanskrit)$"),
    theme: Optional[str] = Query(default=None, description="Filter by theme (e.g., 'action_without_attachment')"),
    application: Optional[str] = Query(default=None, description="Filter by mental health application (e.g., 'anxiety_management')"),
    include_sanskrit: bool = Query(default=False),
    limit: int = Query(default=10, ge=1, le=100, description="Number of verses to return"),
    offset: int = Query(default=0, ge=0, description="Number of verses to skip"),
    db: AsyncSession = Depends(get_db)
):
    """
    List wisdom verses with optional filtering.
    
    **Query Parameters:**
    - `language`: Preferred language (english, hindi, or sanskrit)
    - `theme`: Filter by specific theme
    - `application`: Filter by mental health application
    - `include_sanskrit`: Include Sanskrit text in response
    - `limit`: Maximum number of results (1-100, default 10)
    - `offset`: Number of results to skip for pagination
    
    **Examples:**
    - `/api/wisdom/verses?limit=5` - Get first 5 verses
    - `/api/wisdom/verses?theme=equanimity_in_adversity` - Get verses on equanimity
    - `/api/wisdom/verses?application=anxiety_management` - Get verses for anxiety
    - `/api/wisdom/verses?language=hindi&include_sanskrit=true` - Get Hindi verses with Sanskrit
    
    **Returns:** List of verses with pagination metadata.
    """
    from sqlalchemy import select, func
    try:
        from ..models import WisdomVerse
    except ImportError:
        from models import WisdomVerse
    
    kb = WisdomKnowledgeBase()
    
    # Build query based on filters
    if theme:
        # Filter by theme with SQL-level pagination
        query = select(WisdomVerse).where(WisdomVerse.theme == theme)
        count_query = select(func.count()).select_from(WisdomVerse).where(WisdomVerse.theme == theme)
    elif application:
        # For application filter, we still need to load and filter in Python
        # because mental_health_applications is a JSON field
        verses = await kb.search_verses_by_application(db, application)
        total = len(verses)
        paginated_verses = verses[offset:offset + limit]
        
        formatted_verses = [
            kb.format_verse_response(
                verse=verse,
                language=language,
                include_sanskrit=include_sanskrit
            )
            for verse in paginated_verses
        ]
        
        return {
            "verses": formatted_verses,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total
        }
    else:
        # No filters - get all verses
        query = select(WisdomVerse)
        count_query = select(func.count()).select_from(WisdomVerse)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination at SQL level
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    verses = list(result.scalars().all())
    
    # Format responses
    formatted_verses = [
        kb.format_verse_response(
            verse=verse,
            language=language,
            include_sanskrit=include_sanskrit
        )
        for verse in verses
    ]
    
    return {
        "verses": formatted_verses,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total
    }


@router.post("/search")
async def semantic_search(
    search_query: SearchQuery,
    language: str = Query(default="english", pattern="^(english|hindi|sanskrit)$"),
    theme: Optional[str] = Query(default=None, description="Filter results by theme"),
    application: Optional[str] = Query(default=None, description="Filter results by mental health application"),
    include_sanskrit: bool = Query(default=False),
    limit: int = Query(default=5, ge=1, le=20, description="Number of results to return"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Perform semantic search over wisdom content.
    
    Uses text similarity and relevance scoring to find the most relevant verses
    for a given query. Optionally filter results by theme or application.
    
    **Request Body:**
    - `query`: Your question or search terms
    
    **Query Parameters:**
    - `language`: Preferred language for results
    - `theme`: Filter results by specific theme
    - `application`: Filter results by mental health application
    - `include_sanskrit`: Include Sanskrit text in results
    - `limit`: Maximum number of results (1-20, default 5)
    
    **Examples:**
    ```
    POST /api/wisdom/search?limit=3
    {
      "query": "how to deal with anxiety"
    }
    ```
    
    **Returns:** List of relevant verses sorted by relevance score.
    """
    query = search_query.query
    # Manual validation to return 400 as tests expect
    if not query or not query.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query cannot be empty")
    if len(query.strip()) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query too short")
    
    kb = WisdomKnowledgeBase()
    
    # Use refactored search method that handles filters
    relevant_verses = await kb.search_relevant_verses(
        db=db,
        query=query,
        limit=limit,
        theme=theme,
        application=application
    )
    
    if not relevant_verses:
        raise HTTPException(
            status_code=404,
            detail="No relevant wisdom verses found. Please try a different query."
        )
    
    # Format responses
    results = []
    for item in relevant_verses:
        formatted = kb.format_verse_response(
            verse=item["verse"],
            language=language,
            include_sanskrit=include_sanskrit
        )
        formatted["relevance_score"] = round(item["score"], 3)
        results.append(formatted)
    
    return {
        "query": query,
        "results": results,
        "total_results": len(results),
        "language": language
    }


@router.get("/applications")
async def list_applications(db: AsyncSession = Depends(get_db)):
    """
    List all available mental health applications.
    
    **Returns:** List of unique mental health applications across all verses,
    useful for filtering and discovery.
    
    **Example:** `/api/wisdom/applications`
    """
    try:
        from ..models import WisdomVerse
    except ImportError:
        from models import WisdomVerse
    
    from sqlalchemy import select
    result = await db.execute(select(WisdomVerse))
    verses = result.scalars().all()
    
    # Collect all unique applications
    applications_set = set()
    for verse in verses:
        apps = verse.mental_health_applications.get("applications", [])
        applications_set.update(apps)
    
    return {
        "applications": sorted(list(applications_set)),
        "total": len(applications_set)
    }


async def generate_wisdom_response(
    query: str,
    verses: List[dict],
    language: str
) -> str:
    """
    Generate AI-powered response using OpenAI GPT-4.
    Falls back to a template-based response if OpenAI is not available.
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if not openai_key or openai_key == "your-api-key-here":
        # Fallback response when OpenAI is not configured
        return generate_template_response(query, verses, language)
    
    try:
        # Import OpenAI only if needed
        import openai
        openai.api_key = openai_key
        
        # Prepare context from verses
        verse_context = "\n\n".join([
            f"Wisdom Teaching {i+1}:\n{item['verse'].english}\n\nContext: {item['verse'].context}"
            for i, item in enumerate(verses)
        ])
        
        # Create prompt with strict instructions to avoid religious terminology
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

        user_prompt = f"""User's Question: {query}

Relevant Universal Wisdom Teachings:
{verse_context}

Please provide a compassionate, practical response that:
1. Addresses the user's concern directly
2. Explains how the wisdom principles apply to their situation
3. Offers concrete steps they can take
4. Uses only universal, non-religious language
5. Is warm and encouraging

Response:"""

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        # Log the error and fall back to template response
        print(f"OpenAI API error: {str(e)}")
        return generate_template_response(query, verses, language)


def generate_template_response(
    query: str,
    verses: List[dict],
    language: str
) -> str:
    """
    Generate a template-based response when OpenAI is not available.
    """
    if not verses:
        return "I understand your concern. While I don't have specific guidance at this moment, remember that inner peace comes from within. Practice mindfulness, be patient with yourself, and take one step at a time."
    
    # Get the most relevant verse
    top_verse = verses[0]["verse"]
    
    # Create a contextual response
    responses = {
        "action_without_attachment": "Your concern touches on a fundamental principle of inner peace: learning to act without being attached to outcomes. This ancient wisdom teaches us to focus on our efforts and actions, which we can control, rather than results, which we cannot. By doing your best in each moment without anxiously grasping for specific outcomes, you reduce stress and find greater clarity.",
        
        "equanimity_in_adversity": "In times of difficulty, the most powerful tool you have is your ability to remain centered. This timeless wisdom reminds us that external circumstances are constantly changing, but you can cultivate an inner stability that remains undisturbed. Practice observing your emotions without being overwhelmed by them, like watching clouds pass across the sky.",
        
        "control_of_mind": "You're recognizing an important truth: our thoughts and mental patterns significantly impact our wellbeing. Ancient wisdom teaches us to observe our thought patterns and understand how they create cycles of emotion. By becoming aware of these patterns, you gain the power to interrupt harmful cycles and create healthier mental habits.",
        
        "self_empowerment": "This challenge is an opportunity for growth. Remember that you have within you the power to transform your situation. Your mind can be your greatest ally in this journey. Take responsibility for your inner state while being compassionate with yourself. Each small step forward is a victory.",
        
        "mastering_the_mind": "It's perfectly natural to find the mind difficult to control - this is a universal human experience. The key is not to fight against it, but to work with it patiently. Through consistent practice of mindfulness and self-awareness, you can gradually develop greater mental clarity and peace.",
        
        "practice_and_persistence": "Change takes time and consistent effort. This ancient teaching reminds us that mastery comes through dedicated practice, not perfection. Be patient with yourself, celebrate small progress, and maintain your commitment even when it feels difficult. Your persistence will bear fruit.",
        
        "impermanence": "What you're experiencing is temporary. All emotions, sensations, and situations have a beginning and an end. By remembering this, you can endure difficult moments with greater ease and appreciate positive moments without clinging. This awareness brings freedom and peace.",
        
        "inner_peace": "True peace comes from inner stability, not external circumstances. Like an ocean that remains calm in its depths even when waves disturb the surface, you can cultivate an inner tranquility that persists regardless of life's ups and downs. This comes from reducing attachment to fleeting desires and finding contentment within.",
        
        "self_knowledge": "Understanding yourself is key to transformation. This wisdom teaches us to recognize different aspects of our being - our body, senses, thoughts, and the deeper awareness that observes it all. By developing this self-knowledge, you gain clarity and the ability to make wiser choices.",
        
        "inner_joy": "You're learning an important lesson: lasting happiness comes from within, not from external achievements or possessions. By turning your attention inward through meditation and self-reflection, you can access a source of joy that doesn't depend on circumstances. This is true freedom."
    }
    
    theme_response = responses.get(
        top_verse.theme,
        "Your question touches on deep wisdom about human nature and wellbeing. Remember that you have inner resources to face any challenge. Practice self-compassion, stay present, and trust in your capacity for growth and healing."
    )
    
    return f"{theme_response}\n\nReflect on the wisdom teaching provided, and consider how you might apply its principles to your situation. Remember, transformation is a gradual process - be patient and kind with yourself as you grow."
