"""
Chat API endpoint for Bhagavad Gita based mental health chatbot
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import os

from ..schemas import ChatMessage, ChatResponse, VerseReference
from ..deps import get_db, get_user_id
from ..services.gita_kb import GitaKnowledgeBase

router = APIRouter(prefix="/chat", tags=["chat"])

kb_service = GitaKnowledgeBase()


@router.post("/message", response_model=ChatResponse)
async def chat_message(
    message: ChatMessage,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id)
):
    """
    Process a user query and return AI response with relevant Bhagavad Gita verses
    """
    try:
        # Search for relevant verses
        verses = await kb_service.search_relevant_verses(
            db=db,
            query=message.query,
            limit=3
        )
        
        if not verses:
            raise HTTPException(
                status_code=500,
                detail="Unable to find relevant verses. Please try again."
            )
        
        # Generate AI response using OpenAI
        response_text = await generate_ai_response(
            query=message.query,
            verses=verses,
            language=message.language
        )
        
        # Convert verses to response format
        verse_refs = [
            VerseReference(
                chapter=v["chapter"],
                verse=v["verse"],
                sanskrit=v["sanskrit"],
                english=v["english"],
                hindi=v["hindi"],
                principle=v["principle"],
                theme=v["theme"],
                relevance_score=v["relevance_score"]
            )
            for v in verses
        ]
        
        return ChatResponse(
            response=response_text,
            verses=verse_refs,
            language=message.language
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat message: {str(e)}"
        )


async def generate_ai_response(
    query: str,
    verses: list,
    language: str = "en"
) -> str:
    """
    Generate AI response using OpenAI GPT based on query and relevant verses
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    if not openai_api_key:
        # Fallback response when OpenAI is not available
        return generate_fallback_response(verses, language)
    
    # Prepare context from verses
    verse_context = "\n\n".join([
        f"Verse {v['chapter']}.{v['verse']} (Theme: {v['theme']}):\n"
        f"English: {v['english']}\n"
        f"Principle: {v['principle']}"
        for v in verses
    ])
    
    # Language-specific instructions
    language_instruction = {
        "en": "Respond in English.",
        "hi": "Respond in Hindi (Devanagari script).",
        "sa": "Respond primarily in Sanskrit with English translation where helpful."
    }.get(language, "Respond in English.")
    
    system_prompt = f"""You are a compassionate mental health guide who draws wisdom from timeless teachings.

Guidelines:
1. Apply ancient wisdom to modern mental health challenges
2. Provide practical, actionable guidance
3. Be empathetic and supportive
4. Avoid direct references to specific individuals (refer to them as "the teacher" and "the student" if needed)
5. Focus on universal principles that transcend time and culture
6. {language_instruction}

Base your response on these relevant teachings:

{verse_context}

Provide a thoughtful, practical response that applies these principles to the user's situation."""

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_api_key)
        
        response = await client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return generate_fallback_response(verses, language)


def generate_fallback_response(verses: list, language: str = "en") -> str:
    """Generate a fallback response when AI is unavailable"""
    
    if language == "hi":
        intro = "इन शिक्षाओं पर विचार करें:"
        conclusion = "इन सिद्धांतों को अपने जीवन में लागू करने का प्रयास करें।"
    elif language == "sa":
        intro = "एतान् उपदेशान् विचारयतु:"
        conclusion = "एतान् सिद्धान्तान् जीवने प्रयोजयतु।"
    else:
        intro = "Consider these timeless teachings:"
        conclusion = "Try applying these principles to your situation with patience and practice."
    
    verse_summaries = []
    for v in verses[:2]:
        if language == "hi":
            verse_summaries.append(f"• {v['hindi']} (अध्याय {v['chapter']}, श्लोक {v['verse']})")
        elif language == "sa":
            verse_summaries.append(f"• {v['sanskrit']} (अध्यायः {v['chapter']}, श्लोकः {v['verse']})")
        else:
            verse_summaries.append(f"• {v['english']} (Chapter {v['chapter']}, Verse {v['verse']})")
    
    return f"{intro}\n\n" + "\n\n".join(verse_summaries) + f"\n\n{conclusion}"
