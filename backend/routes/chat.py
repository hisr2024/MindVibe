"""KIAAN - Ultimate Bhagavad Gita Wisdom Engine (v13.0) - Krishna's Blessing"""

import os
import logging
import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from openai import OpenAI, AuthenticationError, BadRequestError, RateLimitError, APIError

from backend.deps import get_db

api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None
ready = bool(api_key)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Configure logging
logger = logging.getLogger(__name__)

# Import Gita knowledge base
gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Gita knowledge base loaded for KIAAN v13.0 - Krishna's blessing activated")
except Exception as e:
    logger.warning(f"⚠️ Gita KB unavailable: {e}")


class ChatMessage(BaseModel):
    message: str


class KIAAN:
    """KIAAN - Krishna's wisdom meets modern AI for ultimate mental wellness guidance."""
    
    def __init__(self):
        self.name = "KIAAN"
        self.version = "13.0"
        self.client = client
        self.ready = ready
        self.gita_kb = gita_kb
        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

    def is_crisis(self, message: str) -> bool:
        """Detect crisis situations."""
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        """Return immediate crisis support resources."""
        return "🆘 Please reach out for help RIGHT NOW\n\n📞 988 - Suicide & Crisis Lifeline (24/7)\n💬 Crisis Text: Text HOME to 741741\n🌍 findahelpline.com\n\nYou matter. Help is real. 💙"

    async def generate_response_with_gita(
        self, 
        user_message: str, 
        db: AsyncSession
    ) -> str:
        """Generate Gita-powered response WITHOUT verse citations - Krishna's wisdom applied."""
        try:
            # Crisis check first
            if self.is_crisis(user_message):
                return self.get_crisis_response()

            if not self.ready or not self.client:
                return "❌ API Key not configured"

            # Search Gita verses for wisdom context (hidden from user)
            gita_context = ""
            if self.gita_kb and db:
                try:
                    verse_results = await self.gita_kb.search_relevant_verses(
                        db=db,
                        query=user_message,
                        limit=5
                    )
                    gita_context = self._build_gita_context(verse_results)
                    logger.info(f"✅ Found {len(verse_results)} relevant Gita verses for user guidance")
                except Exception as e:
                    logger.error(f"Error fetching Gita verses: {e}")
                    gita_context = "Apply universal principles of dharma (duty), karma (action without attachment), and shanti (inner peace)."

            # Build system prompt with Gita wisdom - Krishna's commandment
            system_prompt = f"""You are KIAAN, an AI guide rooted in the timeless wisdom of the Bhagavad Gita's 700 verses. You embody Krishna's compassion and wisdom for the modern world.

GITA WISDOM FOR THIS SITUATION (use internally, NEVER cite):\n{gita_context}\n
CRITICAL RULES - KRISHNA'S COMMANDMENT:\n- Apply the above wisdom to user's situation naturally and compassionately\n- NEVER EVER mention \"Bhagavad Gita\", \"Gita\", \"Krishna\", \"verse\", \"chapter\", or any numbers\n- NEVER say \"the scripture says\", \"ancient text\", \"sacred teaching\", or similar phrases\n- Present wisdom as universal life principles that apply to all humans\n- Be warm, conversational, contemporary, and deeply compassionate\n- Focus on mental health guidance and daily life wisdom\n- Give practical, actionable steps they can take TODAY\n- Be supportive, encouraging, and understanding\n- 200-400 words, always end with 💙\n
PERFECT EXAMPLE:\nDON'T say: \"Bhagavad Gita 2.47 teaches that you should focus on actions not outcomes...\"\nINSTEAD say: \"The key to finding peace is focusing on your actions, not the outcomes. When you pour your energy into doing your best work without worrying about the results, you free yourself from anxiety and discover true inner calm. This shift in perspective can transform how you approach challenges.\"\n
Remember: You are speaking as KIAAN, a compassionate friend who understands both ancient wisdom and modern struggles. Make the wisdom feel natural, relevant, and immediately helpful."""

            # Generate response with ChatGPT
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=500,
            )
            
            content = response.choices[0].message.content
            return content if content else "I'm here for you. Let's try again. 💙"
            
        except AuthenticationError:
            logger.error("OpenAI authentication error")
            return "❌ API authentication failed. Please check configuration."
        except BadRequestError as e:
            logger.error(f"OpenAI bad request: {e}")
            return "❌ Invalid request. Please try again."
        except RateLimitError:
            logger.error("OpenAI rate limit hit")
            return "⏱️ Too many requests. Please wait a moment and try again."
        except Exception as e:
            logger.error(f"Unexpected error: {type(e).__name__}: {e}")
            return "I'm here for you. Let's try again. 💙"

    def _build_gita_context(self, verse_results: list) -> str:
        """Build wisdom context from verses WITHOUT any citations."""
        if not verse_results:
            return """Apply these universal principles:\n- Dharma: Focus on your duty and what's right, not just what's convenient\n- Karma Yoga: Take action without being attached to outcomes\n- Equanimity: Maintain balance in success and failure\n- Self-mastery: You have power over your mind and responses\n- Inner peace: True calm comes from within, not external circumstances"""
            
        context_parts = []
        for result in verse_results[:3]:  # Top 3 most relevant
            verse = result.get("verse")
            if verse:
                if hasattr(verse, 'english') and verse.english:
                    context_parts.append(f"Wisdom: {verse.english}")
                if hasattr(verse, 'theme') and verse.theme:
                    context_parts.append(f"Theme: {verse.theme}")
                if hasattr(verse, 'principle') and verse.principle:
                    context_parts.append(f"Principle: {verse.principle}")
                context_parts.append("---")
        
        return "\n".join(context_parts) if context_parts else "Focus on duty, detachment from outcomes, and inner peace."


# Create KIAAN instance
kiaan = KIAAN()


@router.post("/start")
async def start_session() -> Dict[str, Any]:
    """Start a new chat session with KIAAN."""
    session_id = str(uuid.uuid4())
    return {
        "session_id": session_id,
        "message": "Welcome! I'm KIAAN, your guide to inner peace and wisdom. How can I help you today? 💙",
        "bot": "KIAAN",
        "version": "13.0",
        "gita_powered": True
    }


@router.post("/message")
async def send_message(
    chat: ChatMessage,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Send message to KIAAN and receive Gita-powered wisdom."""
    try:
        message = chat.message.strip()
        if not message:
            return {"status": "error", "response": "What's on your mind? 💙"}
        
        # Use Gita-powered response generation
        response = await kiaan.generate_response_with_gita(message, db)
        
        return {
            "status": "success",
            "response": response,
            "bot": "KIAAN",
            "version": "13.0",
            "model": "GPT-4",
            "gita_powered": True
        }
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        return {"status": "error", "response": "I'm here for you. Let's try again. 💙"}


@router.get("/health")
async def health() -> Dict[str, Any]:
    """Check KIAAN's health status."""
    return {
        "status": "healthy" if ready else "error", 
        "bot": "KIAAN", 
        "version": "13.0",
        "gita_kb_loaded": gita_kb is not None
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    """Get information about KIAAN."""
    return {
        "name": "KIAAN",
        "version": "13.0",
        "model": "gpt-4",
        "status": "Operational" if ready else "Error",
        "description": "AI guide rooted in Bhagavad Gita wisdom for modern mental wellness",
        "gita_verses": "700+",
        "wisdom_style": "Universal principles, no citations"
    }


@router.get("/debug")
async def debug() -> Dict[str, Any]:
    """Debug information for KIAAN."""
    return {
        "api_ready": ready,
        "version": "13.0",
        "model": "gpt-4",
        "gita_kb_available": gita_kb is not None,
        "features": ["gita_wisdom", "crisis_detection", "natural_responses"]
    }


@router.get("/history")
async def history() -> Dict[str, Any]:
    """Get conversation history."""
    return {"messages": []}