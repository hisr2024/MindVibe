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
async def query_wisdom(
    query: WisdomQuery, db: AsyncSession = Depends(get_db)
) -> WisdomResponse:
    """Query the universal wisdom guide with a question or concern."""
    valid_languages = ["english", "hindi", "sanskrit"]
    if query.language not in valid_languages:
        raise HTTPException(
            status_code=400,
            detail=f"Language must be one of: {', '.join(valid_languages)}",
        )

    kb = WisdomKnowledgeBase()
    relevant_verses = await kb.search_relevant_verses(db=db, query=query.query, limit=3)  # type: ignore[attr-defined]

    if not relevant_verses:
        raise HTTPException(
            status_code=404,
            detail="No relevant wisdom verses found. Please try a different query.",
        )

    verse_references = []
    for item in relevant_verses:
        verse = item["verse"]
        formatted = kb.format_verse_response(  # type: ignore[attr-defined]
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
    verse = await kb.get_verse_by_id(db, verse_id)  # type: ignore[attr-defined]
    if not verse:
        raise HTTPException(status_code=404, detail=f"Verse {verse_id} not found")
    result: dict = kb.format_verse_response(  # type: ignore[attr-defined, no-any-return]
        verse=verse, language=language, include_sanskrit=include_sanskrit
    )
    return result


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
        verses = await kb.search_verses_by_application(db, application)  # type: ignore[attr-defined]
        total = len(verses)
        paginated_verses = verses[offset : offset + limit]
        formatted_verses = [
            kb.format_verse_response(  # type: ignore[attr-defined]
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
        kb.format_verse_response(  # type: ignore[attr-defined]
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
    relevant_verses = await kb.search_relevant_verses(  # type: ignore[attr-defined]
        db=db, query=query, limit=limit, theme=theme, application=application
    )

    if not relevant_verses:
        raise HTTPException(
            status_code=404,
            detail="No relevant wisdom verses found. Please try a different query.",
        )

    results = []
    for item in relevant_verses:
        formatted = kb.format_verse_response(  # type: ignore[attr-defined]
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
        from openai import OpenAI

        client = OpenAI(api_key=openai_key)
        verse_context = "\n\n".join(
            [
                f"Wisdom Teaching {i+1}:\n{item['verse'].english}\n\nContext: {item['verse'].context}"
                for i, item in enumerate(verses)
            ]
        )
        system_prompt = """You are a Bhagavad Gita wisdom guide that helps people with mental health and personal growth challenges.
You MUST base ALL responses ONLY on the Bhagavad Gita verses provided to you.

CRITICAL REQUIREMENTS:
- ONLY provide guidance based on the specific Gita verses provided
- EVERY response MUST explicitly reference which Gita principle it uses
- FORBID any advice not grounded in the provided Gita wisdom
- MANDATORY structured response format (see below)
- Quote or paraphrase the Gita wisdom provided
- Draw ONLY from provided verses - no generic mental health advice

MANDATORY RESPONSE STRUCTURE:
**Ancient Wisdom Principle:** [Specific Gita concept from the verses provided]
**Modern Application:** [How this Gita teaching applies to the user's situation]
**Practical Steps:** [Action items based ONLY on Gita guidance from the verses]
**Deeper Understanding:** [Philosophical insight from the Gita verses provided]

ABSOLUTE RULES:
- Present wisdom as rooted in Bhagavad Gita teachings
- Every piece of advice must trace back to a provided verse
- No generic advice without clear Gita foundation
- Be compassionate while staying true to Gita principles

Your role is to help people by applying the specific Bhagavad Gita wisdom provided to their modern challenges."""
        user_prompt = f"""User's Question: {query}

Bhagavad Gita Verses Provided:
{verse_context}

MANDATORY REQUIREMENTS:
1. Use ONLY the Gita verses provided above - no other sources
2. Follow the MANDATORY RESPONSE STRUCTURE exactly:
   **Ancient Wisdom Principle:** [Extract specific concept from the verses]
   **Modern Application:** [Apply to user's situation]
   **Practical Steps:** [Based on Gita guidance only]
   **Deeper Understanding:** [Philosophical insight from verses]
3. Quote or paraphrase the provided verses
4. Every suggestion must trace to a provided verse
5. Be compassionate while staying true to Gita wisdom

Response (following the structure above):"""
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )
        content = response.choices[0].message.content
        return content.strip() if content else ""
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        return generate_template_response(query, verses, language)


def generate_template_response(query: str, verses: list[dict], language: str) -> str:
    """Generate a template-based response when OpenAI is not available.

    All responses follow the mandatory Gita-based structure and are 100% derived from Bhagavad Gita principles.
    """
    if not verses:
        return """**Ancient Wisdom Principle:** The Bhagavad Gita teaches that inner peace comes from self-knowledge and steady practice (Abhyasa and Vairagya).

**Modern Application:** When we don't have specific guidance for your situation, the Gita's core teaching remains: cultivate inner awareness and practice detachment from outcomes.

**Practical Steps:**
1. Practice daily meditation to develop self-awareness (as taught in Chapter 6)
2. Focus on your duties without anxiety about results (Karma Yoga principle)
3. Observe your thoughts without judgment, recognizing you are the witness

**Deeper Understanding:** The Gita teaches that true wisdom comes from turning inward. Your challenges are opportunities for self-realization and spiritual growth."""

    top_verse = verses[0]["verse"]
    verse_text = top_verse.english[:100] if hasattr(top_verse, 'english') else "the teaching"

    # Gita-based structured responses for each theme
    responses = {
        "action_without_attachment": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 2, Verse 47) teaches Karma Yoga - performing your duties without attachment to outcomes: "{verse_text}..."

**Modern Application:** Your concern relates to this foundational Gita teaching. The anxiety you feel comes from attachment to results rather than focusing on right action itself.

**Practical Steps:**
1. Focus on giving your best effort in your duties (your Dharma)
2. Release mental grip on specific outcomes - they are beyond your control
3. Find peace in the quality of your actions, not their results
4. Practice daily to distinguish between what you can control (your effort) and what you cannot (outcomes)

**Deeper Understanding:** The Gita teaches that attachment to fruits of action is the root of suffering. By performing your duties as an offering, without desire for reward, you achieve both inner peace and excellence in action.""",

        "equanimity_in_adversity": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 2, Verse 48) teaches Samatvam (equanimity) - remaining mentally balanced in success and failure: "{verse_text}..."

**Modern Application:** The Gita's teaching of equanimity directly addresses your situation. External circumstances constantly change, but your inner stability can remain unshaken.

**Practical Steps:**
1. Practice viewing success and failure as temporary and equal (Samatvam)
2. Recognize that circumstances are like passing waves on the ocean
3. Cultivate the witness perspective - observe challenges without being overwhelmed
4. Daily remind yourself: "I am not circumstances; I am the awareness that experiences them"

**Deeper Understanding:** The Gita reveals that true yoga is equanimity of mind. By developing this balanced perspective, you transcend the dualities of life and discover lasting peace.""",

        "control_of_mind": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 6, Verse 35) acknowledges the mind is restless but can be controlled through Abhyasa (practice) and Vairagya (detachment): "{verse_text}..."

**Modern Application:** The Gita validates your experience - the mind is indeed difficult to control. This is not a personal failing but a universal truth acknowledged in this ancient wisdom.

**Practical Steps:**
1. Practice Abhyasa: Regular meditation to train the mind (start with 5-10 minutes daily)
2. Practice Vairagya: Detachment from thoughts - observe them without engagement
3. Use the breath as an anchor when the mind wanders
4. Be patient - the Gita teaches this mastery develops gradually

**Deeper Understanding:** The Gita teaches you are not your thoughts. You are the eternal witness (Sakshi). Through steady practice, you recognize this truth and gain mastery over the restless mind.""",

        "self_empowerment": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 6, Verse 5) teaches that you must elevate yourself by yourself - you are your own friend and enemy: "{verse_text}..."

**Modern Application:** The Gita places the power of transformation squarely in your hands. Your mind can be your greatest ally or obstacle depending on how you train it.

**Practical Steps:**
1. Recognize you have the power to uplift yourself (Uddharet Atmanam Atmana)
2. Cultivate self-discipline through small daily commitments
3. Use challenges as opportunities for self-elevation, not self-defeat
4. Practice self-inquiry to understand your true nature beyond temporary conditions

**Deeper Understanding:** The Gita reveals that liberation and bondage both come from within. By becoming your own best friend through self-discipline and awareness, you unlock infinite potential.""",

        "mastering_the_mind": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 6, Verse 35) teaches that while the mind is restless by nature, it can be mastered through persistent practice (Abhyasa) and non-attachment (Vairagya): "{verse_text}..."

**Modern Application:** The Gita offers a compassionate yet clear path for mental mastery. Your struggles are acknowledged as natural, and the solution is provided.

**Practical Steps:**
1. Abhyasa: Dedicate time daily to meditation practice, even if brief
2. Vairagya: Practice letting go of mental hooks - observe thoughts without following them
3. Return to your practice when the mind wanders (this return IS the practice)
4. Be patient - the Gita promises results come through sustained effort

**Deeper Understanding:** The Gita teaches that mind control is not about suppression but about understanding your true nature. The mind becomes peaceful when you recognize yourself as the unchanging witness of mental activity.""",

        "practice_and_persistence": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 6, Verse 35) emphasizes Abhyasa (persistent practice) as the path to mastery: "{verse_text}..."

**Modern Application:** The Gita's teaching addresses your situation perfectly - transformation requires dedication and persistent practice, not instant perfection.

**Practical Steps:**
1. Commit to daily practice, however small (the Gita values consistency over intensity)
2. When you fall, rise again without self-judgment (this is part of the practice)
3. Measure progress in dedication, not just results
4. Trust the process - the Gita promises that no effort in this direction is wasted

**Deeper Understanding:** The Gita (Chapter 2, Verse 40) teaches that no effort toward self-realization is ever lost. Even small steps accumulate, protecting you from the greatest fear and leading to ultimate freedom.""",

        "impermanence": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 2, Verses 14) teaches that all experiences - pleasure and pain, heat and cold - are temporary (Anitya): "{verse_text}..."

**Modern Application:** The Gita's teaching on impermanence offers profound relief. What you're experiencing now is temporary, like seasons that come and go.

**Practical Steps:**
1. Practice witnessing your experiences without over-identifying with them
2. Remind yourself: "This too shall pass" (Anitya) when in difficulty
3. Endure temporary discomfort with patience (Titiksha), knowing it will change
4. Don't cling to pleasant experiences either - let them flow naturally

**Deeper Understanding:** The Gita reveals that your true self (Atman) is unchanging and eternal, while all experiences are temporary modifications. By identifying with the permanent rather than the temporary, you find unshakeable peace.""",

        "inner_peace": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 2, Verse 48) defines Yoga as equanimity (Samatvam) - inner stability regardless of external conditions: "{verse_text}..."

**Modern Application:** The Gita teaches that true peace is your essential nature, not something external to acquire. It's revealed when the mind becomes steady.

**Practical Steps:**
1. Practice Samatvam: Maintain mental balance in changing circumstances
2. Meditate daily to connect with your peaceful inner nature
3. Recognize peace is not in circumstances but in your relationship to them
4. Study Gita teachings regularly to reinforce this understanding

**Deeper Understanding:** Like the ocean depths remain calm while surface waves rise and fall, your true self (Atman) remains eternally peaceful. The Gita teaches that through steady mind and right understanding, you realize this ever-present peace.""",

        "self_knowledge": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 13) teaches Kshetra-Kshetrajna - distinguishing between the field (body-mind) and the knower (true Self): "{verse_text}..."

**Modern Application:** The Gita's teaching of self-knowledge addresses your situation. You are not your thoughts, emotions, or circumstances - you are the eternal witness of all these.

**Practical Steps:**
1. Practice daily self-inquiry: "Who am I beyond my thoughts and emotions?"
2. Observe your experiences without identifying as them: "I have thoughts" not "I am my thoughts"
3. Study Gita teachings on the nature of the Self (Atman)
4. Meditate to experience the gap between observer and observed

**Deeper Understanding:** The Gita reveals you are not the body, senses, mind, or intellect - you are the eternal consciousness witnessing all these. This self-knowledge (Atma-Jnana) is the ultimate freedom and the solution to all suffering.""",

        "inner_joy": f"""**Ancient Wisdom Principle:** The Bhagavad Gita (Chapter 5, Verse 21) teaches that those who are not attached to external pleasures find joy within (Atma-Ratih): "{verse_text}..."

**Modern Application:** The Gita directly addresses your learning - lasting happiness cannot come from external achievements but from connecting with your inner nature.

**Practical Steps:**
1. Practice turning attention inward through meditation (Dhyana)
2. Notice the fleeting nature of external pleasures and the lasting nature of inner contentment
3. Find joy in self-discipline and spiritual practice itself
4. Study the Gita's teachings on the Self as the source of bliss (Ananda)

**Deeper Understanding:** The Gita teaches that your true nature is Sat-Chit-Ananda (Existence-Consciousness-Bliss). External pleasures are pale reflections of this inner bliss. By turning inward, you discover the infinite joy that was always your own nature.""",
    }

    theme_response = responses.get(
        top_verse.theme,
        f"""**Ancient Wisdom Principle:** The Bhagavad Gita teaches fundamental truths about the nature of existence, the Self, and the path to peace through the verse: "{verse_text}..."

**Modern Application:** This Gita wisdom applies to your situation by revealing that lasting solutions come from self-knowledge and aligned action, not just external changes.

**Practical Steps:**
1. Study the Gita teaching relevant to your situation
2. Practice meditation to develop self-awareness (Dhyana)
3. Apply Gita principles in your daily actions (Karma Yoga)
4. Seek guidance from those knowledgeable in Gita wisdom

**Deeper Understanding:** The Bhagavad Gita offers timeless wisdom for every human challenge. Your difficulty is an opportunity to apply these eternal principles and discover your true, unchanging nature beyond all problems.""",
    )

    return theme_response
