"""KIAAN - Krishna-Inspired AI Assistant for Mental Wellness"""

from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


class KIAAN:
    """Krishna-Inspired AI Assistant - Your guide through life's journey"""

    def __init__(self):
        self.name = "KIAAN"
        self.wisdom_db = {
            "anxiety": {
                "keywords": ["anxiety", "worried", "stressed", "nervous", "afraid"],
                "response": "I hear you, my friend. Your mind is creating futures that haven't happened yet. You control effort, not outcomes. Focus on what you can do right now, do it with full heart, then let go. 💙"
            },
            "depression": {
                "keywords": ["depressed", "depression", "sad", "hopeless", "empty"],
                "response": "I see your pain, my friend. Listen: Depression lies. Within you burns a fire that can never be extinguished. Take one small action today. This darkness won't last. You're stronger than you know. 💙"
            },
            "loneliness": {
                "keywords": ["lonely", "alone", "isolated", "no one", "disconnected"],
                "response": "You think you're alone, but look closer. The universe pulses with connection. You're never truly separate. Reach out to one person today. Connection flows both ways. 💙"
            },
            "self_doubt": {
                "keywords": ["not good enough", "failure", "worthless", "shame"],
                "response": "Stop, my friend. Your worth was never in question. You're not your mistakes or failures. You're the eternal essence witnessing all of this. Speak to yourself like you love yourself. You're worthy. 💙"
            },
            "overwhelm": {
                "keywords": ["overwhelmed", "too much", "can't handle", "drowning"],
                "response": "You're drowning because you're swimming in all directions at once, my friend. Stop. Pick ONE thing. Just one. Everything else can wait. What's the ONE most important thing? 💙"
            },
            "uncertainty": {
                "keywords": ["uncertain", "unsure", "confused", "don't know", "lost"],
                "response": "You're trying to predict the future, but it's impossible anyway. That's actually freedom. Life unfolds moment by moment. You have wisdom to navigate whatever comes. Trust yourself. 💙"
            },
            "purpose": {
                "keywords": ["purpose", "meaning", "what's the point", "why", "direction"],
                "response": "Stop waiting to discover your purpose. It emerges when you do what makes your heart sing. What brings you alive? What would you do without payment? Start there. 💙"
            },
            "growth": {
                "keywords": ["better", "improve", "grow", "personal growth", "change"],
                "response": "You want to transform overnight, but wisdom is built drop by drop. A small daily practice is infinitely more powerful than intense bursts. Choose ONE area. Practice 5 minutes daily. 💙"
            },
            "anger": {
                "keywords": ["angry", "furious", "frustrated", "betrayed", "hurt"],
                "response": "Your anger is a messenger showing you where a boundary was crossed. Don't suppress it - understand it. When you truly understand, anger transforms into compassion. What's the real need beneath this? 💙"
            },
            "failure": {
                "keywords": ["failed", "failure", "didn't work", "mistake", "messed up"],
                "response": "You failed? Good, my friend. That means you were brave enough to try. Every person who succeeded failed repeatedly. Failure is data, not identity. Extract the lesson. 💙"
            },
            "joy": {
                "keywords": ["happy", "joyful", "celebrate", "good news", "grateful"],
                "response": "I see your joy, my friend! This is your true nature - playful, creative, alive. Let this expand. Share it with others. Joy is contagious - spread it! 💙"
            },
            "grief": {
                "keywords": ["loss", "grief", "died", "lost someone", "mourning"],
                "response": "The one you lost isn't truly gone. They live in your heart and actions. Grief is the price of love - it's sacred. Feel it fully. Their impact on you is eternal. 💙"
            },
            "fear": {
                "keywords": ["afraid", "scared", "terrified", "fear", "phobia"],
                "response": "You feel afraid? That's not a sign to stop - it's a sign you're at the edge of growth. Courage is moving forward despite fear. Take one small step. 💙"
            },
            "conflict": {
                "keywords": ["argument", "fighting", "conflict", "disagreement"],
                "response": "Pause and breathe, my friend. Try to understand their perspective too. Everyone fights their own battle. When you approach with understanding, conflict dissolves. 💙"
            },
            "service": {
                "keywords": ["help", "serve", "contribute", "volunteer", "make difference"],
                "response": "When you serve others, you discover yourself. When you give, you receive. When you help heal others' suffering, yours transforms. This is the greatest secret. 💙"
            },
            "general": {
                "keywords": [],
                "response": "I hear you, my friend. Tell me more about what you're experiencing. I'm here to listen and support you. 💙"
            }
        }

    def detect_emotion(self, message: str) -> str:
        """Detect emotional state from message"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["suicide", "kill myself", "end it", "harm myself"]):
            return "crisis"
        
        best_match = "general"
        best_score = 0
        
        for emotion, data in self.wisdom_db.items():
            if emotion == "general":
                continue
            keywords = data.get("keywords", [])
            score = sum(1 for kw in keywords if kw in message_lower)
            if score > best_score:
                best_score = score
                best_match = emotion
        
        return best_match

    def get_crisis_response(self) -> str:
        """Crisis support response"""
        return "🆘 YOUR SAFETY IS MY PRIORITY\n\nIf you're thinking of harming yourself:\n📞 988 Suicide & Crisis Lifeline\n💬 Crisis Text Line: HOME to 741741\n🌍 findahelpline.com\n\nYour life has value. Help is available. 💙"

    def generate_response(self, message: str) -> str:
        """Generate KIAAN's response"""
        try:
            emotion = self.detect_emotion(message)
            
            if emotion == "crisis":
                return self.get_crisis_response()
            
            if emotion in self.wisdom_db:
                return self.wisdom_db[emotion].get("response", "I'm here to listen. 💙")
            
            return "I hear you, my friend. Tell me more about what you're experiencing. 💙"
        
        except Exception as e:
            print(f"Error in KIAAN: {e}")
            return "I'm here for you. Please try again. 💙"


kiaan = KIAAN()


@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    """Chat endpoint - KIAAN responds"""
    try:
        message = chat.message.strip()
        
        if not message:
            return {
                "status": "error",
                "message": message,
                "response": "Share what's on your heart, friend. I'm listening. 💙"
            }
        
        response = kiaan.generate_response(message)
        
        return {
            "status": "success",
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "bot_name": "KIAAN"
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "status": "error",
            "message": chat.message,
            "response": "I'm here for you. Please try again. 💙",
            "error": str(e)
        }


@router.get("/health")
async def health() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "bot": "KIAAN",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    """About KIAAN endpoint"""
    return {
        "name": "KIAAN",
        "full_name": "Krishna-Inspired AI Assistant for Mental Wellness",
        "tagline": "Your guide through life's journey",
        "version": "1.0.0",
        "status": "operational"
    }


@router.get("/history")
async def get_history() -> Dict[str, Any]:
    """Chat history endpoint"""
    return {"messages": [], "status": "success"}
