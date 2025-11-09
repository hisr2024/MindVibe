"""Chat routes with contextual AI responses"""

from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from backend.deps import get_db, get_user_id

router = APIRouter(prefix="/api/chat", tags=["chat"])


def generate_response(message: str) -> str:
    """Generate contextual response based on message"""
    
    message_lower = message.lower()
    
    # Anxiety/worry
    if any(w in message_lower for w in ["anxious", "anxiety", "nervous", "worried", "stressed", "overwhelmed", "panic"]):
        return """I hear you're feeling anxious. That's valid and real.

**Quick relief techniques:**
- 5-4-3-2-1 grounding: Notice 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste
- Box breathing: Inhale 4 counts, hold 4, exhale 4, hold 4
- Move your body - even a short walk helps

**Why anxiety happens:**
Your mind tries to protect you from uncertainty, but it's not always accurate.

**Remember:** You've survived 100% of your difficult days. This will pass. 💙"""
    
    # Depression/sadness
    elif any(w in message_lower for w in ["depressed", "depression", "sad", "hopeless", "empty", "nothing matters", "tired"]):
        return """I'm sorry you're feeling this way. Depression makes everything feel heavy.

**Small steps:**
- Do ONE tiny thing today (make tea, step outside, one message)
- Gentle movement: 10 minutes outside helps
- Reach out to someone, even briefly

**Know this:**
Depression LIES. It tells you you're alone, nothing matters, this is permanent. None are true.

**Get help:**
- Talk to a doctor or therapist
- Crisis: 988 (US) or findahelpline.com
- You reached out today - that's strength. 💙"""
    
    # Loneliness
    elif any(w in message_lower for w in ["alone", "lonely", "isolation", "nobody understands", "isolated"]):
        return """Loneliness hurts deeply - it touches our core need for connection.

**What helps:**
- Reach out to one person (scary but powerful)
- Do things YOU enjoy (you deserve your own company)
- Find communities with shared interests
- Talk to a therapist or counselor

**Truth:**
Loneliness can be healed through connection. Sometimes we need to create it or find new people.

You're not alone in feeling alone. Let's find ways to connect. 💙"""
    
    # Self-worth
    elif any(w in message_lower for w in ["not good enough", "failure", "worthless", "shame", "useless", "stupid", "ugly", "loser"]):
        return """That inner critic is harsh, but it's lying about you.

**Truth:**
- You're having a difficult moment, not being a difficult person
- One mistake ≠ your whole worth
- You deserve the compassion you'd give a friend

**Your value:**
It's not earned through achievement. You matter simply because you exist.

**Try:**
- Write 3 things you did well today (any size counts)
- Do something kind for yourself
- Speak to yourself like you love yourself

You are worthy. You are enough. 💙"""
    
    # Crisis
    elif any(w in message_lower for w in ["suicide", "kill myself", "end it", "harm myself", "cut", "overdose", "better off dead", "no reason to live"]):
        return """🆘 YOUR SAFETY IS CRITICAL. PLEASE GET HELP NOW:

**IMMEDIATE CRISIS SUPPORT:**
🚨 National Suicide Prevention: 988 (US)
🚨 Crisis Text Line: Text HOME to 741741
🚨 International: https://www.iasp.info/resources/Crisis_Centres/

**YOUR LIFE HAS VALUE:**
Even if you can't see it now, this pain is temporary. Help is real and available.

**Take action NOW:**
1. Call 988 or text 741741
2. Go to nearest emergency room
3. Tell someone you trust

You are not alone. Professional help is available 24/7. 💙"""
    
    # General support
    else:
        return """Hello! I'm MindVibe, your compassionate mental wellness companion.

I'm here to:
- Listen without judgment
- Offer emotional support and validation
- Share practical coping strategies
- Provide spiritual wisdom when relevant
- Guide you toward professional help if needed

**How can I support you today?**
- Share what's on your mind
- Tell me how you're feeling
- Ask for specific help

I'm here whenever you need to talk. Your wellbeing matters. 💙"""


@router.post("/message")
async def chat_message(
    message: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Handle chat messages"""
    
    try:
        response = generate_response(message)
        
        return {
            "status": "success",
            "message": message,
            "response": response,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": message,
            "response": "I apologize, I'm having trouble right now. Please try again.",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/history")
async def chat_history(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get chat history"""
    return {
        "user_id": user_id,
        "messages": [],
        "status": "success"
    }
