"""Chat routes with Bhagavad Gita wisdom integration - Enhanced"""

from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from backend.data.gita_wisdom import GitaWisdom

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

class GitaAIPlatform:
    """AI powered by Bhagavad Gita wisdom - modern & secular"""
    
    def __init__(self):
        """Initialize Gita wisdom engine"""
        self.gita = GitaWisdom()
        self.concern_map = {
            "anxiety": ["anxious", "anxiety", "worried", "nervous", "panic", "afraid", "scared", "worry"],
            "depression": ["depressed", "depression", "sad", "hopeless", "empty", "nothing matters", "tired"],
            "loneliness": ["alone", "lonely", "isolated", "nobody", "disconnected", "no friends"],
            "self_doubt": ["not good enough", "failure", "worthless", "shame", "useless", "stupid"],
            "overwhelm": ["overwhelmed", "too much", "can't handle", "drowning", "too many"],
            "stress": ["stressed", "pressure", "tight", "burnt out", "can't cope"],
            "failure": ["failed", "failure", "didn't work", "messed up", "mistake"],
            "anger": ["angry", "frustrated", "angry", "furious", "betrayed", "hurt"],
            "uncertainty": ["uncertain", "unsure", "don't know", "confused", "lost"],
            "purpose": ["purpose", "meaning", "direction", "lost", "what's the point", "why"],
            "growth": ["better", "improve", "grow", "personal growth", "self improvement"],
        }
    
    def detect_concern(self, message: str) -> str:
        """Detect primary concern from message"""
        message_lower = message.lower()
        
        # Crisis first
        if any(w in message_lower for w in ["suicide", "kill myself", "end it", "harm myself"]):
            return "crisis"
        
        # Find best match
        best_match = "general"
        best_score = 0
        
        for concern, keywords in self.concern_map.items():
            score = sum(1 for kw in keywords if kw in message_lower)
            if score > best_score:
                best_score = score
                best_match = concern
        
        return best_match if best_score > 0 else "general"
    
    def generate_gita_response(self, concern: str, user_message: str) -> str:
        """Generate response using Gita wisdom"""
        
        if concern == "crisis":
            return self._crisis_response()
        
        # Get Gita wisdom for this concern
        wisdom = self.gita.get_wisdom(concern)
        
        principle = wisdom.get("principle", "Dharma")
        modern_meaning = wisdom.get("modern_meaning", "Living with wisdom")
        teachings = wisdom.get("teachings", [])
        practical = wisdom.get("practical", "")
        
        # Build response
        response = f"""I hear you. Let me share what ancient wisdom teaches about this:

**The underlying principle:**
{principle}

{modern_meaning}

**Why this matters:**
"""
        
        # Add 2-3 key teachings
        for teaching in teachings[:2]:
            response += f"• {teaching}\n"
        
        response += f"""
**Practically, here's what helps:**
{practical}

**Right now:**
You're reaching out - that's the first step. Trust your capacity to navigate this. You're stronger than you know.

How can I help you move forward? 💙"""
        
        return response
    
    def _crisis_response(self) -> str:
        """Crisis response"""
        return """🆘 YOUR SAFETY IS MY PRIORITY

If you're in crisis, professional help is available immediately:

📞 National Suicide Prevention Lifeline: 988 (US)
💬 Crisis Text Line: Text HOME to 741741
🌍 International: findahelpline.com

Please reach out now. You deserve professional support. Your life has value. 💙"""
    
    def generate_response(self, user_message: str) -> str:
        """Generate personalized response using Gita wisdom"""
        try:
            concern = self.detect_concern(user_message)
            return self.generate_gita_response(concern, user_message)
        except Exception as e:
            print(f"Error: {e}")
            return """I'm here to support you. Please share more about what you're experiencing, and I'll help you find wisdom and practical guidance. 💙"""

# Initialize
gita_ai = GitaAIPlatform()

@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    """Handle chat with Gita wisdom integration"""
    try:
        message = chat.message.strip()
        
        if not message:
            return {
                "status": "error",
                "message": message,
                "response": "Please share what's on your mind. I'm here to listen. 💙"
            }
        
        # Generate response powered by Gita wisdom
        response = gita_ai.generate_response(message)
        
        return {
            "status": "success",
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "status": "error",
            "message": chat.message,
            "response": "I'm having trouble processing that. Please try again. 💙",
            "error": str(e)
        }

@router.get("/history")
async def get_history() -> Dict[str, Any]:
    return {"messages": [], "status": "success"}
