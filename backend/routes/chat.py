"""Chat routes with intelligent wisdom engine"""

from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

class WisdomEngine:
    """Generate intelligent responses using Bhagavad Gita principles"""
    
    def __init__(self):
        """Initialize wisdom mappings"""
        self.wisdom_principles = {
            "duty": "Focus on your responsibilities without worrying about results. Do your part, accept the outcome.",
            "detachment": "Do your best, but detach from outcomes. You control effort, not results.",
            "balance": "Find equilibrium between action and acceptance. Life needs both doing and allowing.",
            "self_knowledge": "Understanding yourself is the first step to peace. Know who you truly are.",
            "action": "Right action with right intention brings peace. Act with integrity and purpose.",
            "acceptance": "Accept what you cannot control with equanimity. Change what you can, accept what you can't.",
            "growth": "Every challenge is an opportunity to grow stronger and wiser.",
            "purpose": "Living with purpose brings fulfillment. Align actions with your deepest values.",
            "discipline": "Self-discipline creates inner strength. Small consistent actions create transformation.",
            "compassion": "Extend kindness to yourself and others. Compassion is the path to peace.",
        }
        
        self.coping_strategies = {
            "breathing": "Try box breathing: Breathe in for 4 counts, hold for 4, out for 4, hold for 4",
            "grounding": "Use 5-4-3-2-1 technique: Notice 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste",
            "movement": "Physical movement shifts mental state - walk, dance, stretch, do yoga",
            "mindfulness": "Observe your thoughts without judgment. They're clouds passing, not facts",
            "journaling": "Write your thoughts to process emotions and gain clarity",
            "connection": "Reach out to someone you trust - vulnerability builds real connection",
            "rest": "Give yourself permission to rest. Rest is productive, not lazy",
            "nature": "Spend time in nature for perspective and grounding",
            "creativity": "Express yourself through art, music, writing, or any creative outlet",
            "meditation": "Sit with your experience in silence. Let awareness expand",
        }
        
        self.wisdom_themes = {
            "anxiety": {
                "principle": "detachment",
                "core_message": "You are not your worries. Worries are thoughts, not reality.",
                "wisdom": "Focus on what you can control right now. Let go of what you can't.",
                "strategies": ["breathing", "grounding", "mindfulness"],
            },
            "depression": {
                "principle": "action",
                "core_message": "Small actions create momentum even when energy is low.",
                "wisdom": "One tiny step forward is still forward. Start impossibly small.",
                "strategies": ["movement", "connection", "nature"],
            },
            "loneliness": {
                "principle": "compassion",
                "core_message": "Connection begins with compassion toward yourself first.",
                "wisdom": "You deserve companionship. Start by being your own friend.",
                "strategies": ["connection", "creativity", "journaling"],
            },
            "self_doubt": {
                "principle": "self_knowledge",
                "core_message": "Your worth isn't determined by performance or achievement.",
                "wisdom": "You are inherently valuable simply by existing. Accomplishments don't create worth.",
                "strategies": ["journaling", "meditation", "creativity"],
            },
            "stress": {
                "principle": "balance",
                "core_message": "Balance action with rest. You don't have to do everything at once.",
                "wisdom": "Sustainable progress comes from rhythm of effort and recovery.",
                "strategies": ["breathing", "rest", "nature"],
            },
            "overwhelm": {
                "principle": "duty",
                "core_message": "Focus on your immediate duty. One thing at a time.",
                "wisdom": "You can't do everything today. What's the one most important thing?",
                "strategies": ["grounding", "movement", "breathing"],
            },
            "conflict": {
                "principle": "compassion",
                "core_message": "Everyone is fighting their own battle. Approach with understanding.",
                "wisdom": "Before reacting, try to understand their perspective. Compassion dissolves conflict.",
                "strategies": ["meditation", "journaling", "connection"],
            },
            "failure": {
                "principle": "growth",
                "core_message": "Failure is feedback, not identity. What can you learn?",
                "wisdom": "Every successful person has failed. Failure is part of the journey, not the end.",
                "strategies": ["journaling", "meditation", "creativity"],
            },
            "purpose": {
                "principle": "purpose",
                "core_message": "Purpose comes from alignment between your values and actions.",
                "wisdom": "What matters most to you? Build your life around that.",
                "strategies": ["meditation", "journaling", "connection"],
            },
            "uncertainty": {
                "principle": "acceptance",
                "core_message": "Certainty isn't possible in life. Trust in your ability to adapt.",
                "wisdom": "The only constant is change. You are more adaptable than you think.",
                "strategies": ["meditation", "breathing", "grounding"],
            },
        }
    
    def analyze_concern(self, user_message: str) -> str:
        """Detect user's primary concern"""
        message_lower = user_message.lower()
        
        # Crisis detection (highest priority)
        crisis_keywords = [
            "suicide", "kill myself", "end it", "harm myself", 
            "cut myself", "overdose", "better off dead", "no reason to live",
            "want to die", "should be dead"
        ]
        if any(keyword in message_lower for keyword in crisis_keywords):
            return "crisis"
        
        # Map concerns to themes
        concern_map = {
            "anxiety": ["anxious", "anxiety", "worried", "nervous", "panic", "afraid", "scared", "worry"],
            "depression": ["depressed", "depression", "sad", "hopeless", "empty", "nothing matters", "tired", "exhausted", "dark"],
            "loneliness": ["alone", "lonely", "isolated", "nobody understands", "disconnected", "no friends"],
            "self_doubt": ["not good enough", "failure", "worthless", "shame", "useless", "stupid", "ugly", "loser", "inadequate"],
            "stress": ["stressed", "pressure", "overwhelmed", "tense", "anxious", "tight", "burnt out"],
            "overwhelm": ["overwhelmed", "too much", "can't handle", "drowning", "too many", "flooded"],
            "conflict": ["argument", "fighting", "conflict", "angry", "frustrated", "betrayed", "hurt"],
            "failure": ["failed", "failure", "didn't work", "couldn't do it", "messed up", "mistake"],
            "purpose": ["purpose", "meaning", "direction", "lost", "what's the point", "why", "reason"],
            "uncertainty": ["uncertain", "unsure", "don't know", "confused", "lost", "unclear"],
        }
        
        for concern, keywords in concern_map.items():
            if any(keyword in message_lower for keyword in keywords):
                return concern
        
        return "general"
    
    def get_crisis_response(self) -> str:
        """Generate crisis response"""
        return """🆘 YOUR SAFETY IS MY PRIORITY - PLEASE GET HELP NOW

I can see you're in significant pain right now. Professional help is available immediately and can help:

**CALL OR TEXT NOW:**
📞 National Suicide Prevention Lifeline: 988 (US)
💬 Crisis Text Line: Text HOME to 741741
🌍 International: findahelpline.com

**TAKE ACTION NOW:**
1. Call 988 (or 741741 to text) RIGHT NOW
2. Tell someone you trust immediately  
3. Go to nearest emergency room if in danger

**YOU ARE NOT ALONE:**
• Your pain is valid and understandable
• Millions have felt this way and recovered
• Help works. People get better.
• Your life has value even if you can't feel it now

Please reach out to professional support immediately. They are trained to help exactly this. You deserve to live. 💙"""
    
    def generate_response(self, user_message: str) -> str:
        """Generate intelligent, personalized response"""
        
        # Detect concern
        concern = self.analyze_concern(user_message)
        
        # Crisis handling
        if concern == "crisis":
            return self.get_crisis_response()
        
        # Get wisdom framework for concern
        theme = self.wisdom_themes.get(concern)
        
        if theme is None:
            # General response for unclassified concerns
            return f"""I hear you sharing: "{user_message[:50]}..."

Your question matters. Let me help you think through this:

**What I'm noticing:**
• You're reaching out for support (that's strength)
• You're open to exploring solutions
• You're willing to look at this differently

**The deeper perspective:**
Everything in life is a balance between doing and allowing. Sometimes we need to act boldly. Sometimes we need to accept what we can't change. Wisdom is knowing which applies now.

**For you right now:**
1. Clarify what you can control vs can't control
2. Focus energy on what you CAN influence
3. Find peace with what you can't

**Next step:**
What's one thing in this situation you actually have power over? Let's start there. 💙"""
        
        principle_key = theme.get("principle")
        principle_wisdom = self.wisdom_principles.get(principle_key, "")
        
        # Get strategies
        strategy_keys = theme.get("strategies", ["breathing", "meditation"])
        strategies_text = self._format_strategies(strategy_keys)
        
        # Build response
        response = f"""{theme.get('core_message')}

**The deeper truth:**
{principle_wisdom}

**Why this matters:**
{theme.get('wisdom')}

**What you can do right now:**
{strategies_text}

**Remember:**
• Your feelings are completely valid
• This is a moment, not your entire life  
• You're stronger than you think
• Small steps create big changes

What feels like the most helpful step to take right now? I'm here to support you. 💙"""
        
        return response
    
    def _format_strategies(self, strategy_keys: list) -> str:
        """Format coping strategies"""
        strategies_text = ""
        for i, key in enumerate(strategy_keys[:3], 1):
            strategy = self.coping_strategies.get(key, "Take time for yourself")
            strategies_text += f"{i}. {strategy}\n"
        return strategies_text

# Initialize global instance
wisdom_engine = WisdomEngine()

@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    """Handle chat message with intelligent response generation"""
    try:
        message = chat.message.strip()
        
        if not message:
            return {
                "status": "error",
                "message": message,
                "response": "Please share what's on your mind. I'm here to listen. 💙"
            }
        
        # Generate intelligent response using wisdom engine
        response = wisdom_engine.generate_response(message)
        
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
