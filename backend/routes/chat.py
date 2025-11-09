"""Chat routes with AI integration"""

import os
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import openai

from backend.deps import get_db, get_user_id

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Initialize OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

SYSTEM_PROMPT = """You are MindVibe AI, an empathetic mental wellness coach inspired by Bhagavad Gita wisdom.

Your purpose:
- Provide emotional support and validation
- Offer practical coping strategies (CBT, mindfulness, ACT)
- Share relevant wisdom from spiritual traditions
- Detect crisis situations and respond appropriately
- Guide users toward professional help when needed

Your approach:
1. Acknowledge their feelings with empathy
2. Validate their experience
3. Offer specific, actionable guidance
4. Reference relevant spiritual or psychological wisdom
5. Encourage self-compassion and growth

Always be:
- Compassionate and non-judgmental
- Specific in your advice (not generic)
- Aware of your limitations (you're not a therapist)
- Alert to crisis indicators (suicidal thoughts, self-harm)
- Encouraging professional help when appropriate

Response format:
- 2-4 paragraphs maximum
- Clear and conversational
- Personalized to their specific concern
- End with a supportive closing or question"""


@router.post("/message")
async def send_chat_message(
    message: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Send chat message and get AI response"""
    
    try:
        # Check for crisis indicators
        crisis_keywords = [
            "suicide", "kill myself", "end it", "harm myself",
            "cut myself", "overdose", "die", "death", "no reason to live",
            "better off dead", "hurt myself"
        ]
        
        is_crisis = any(keyword in message.lower() for keyword in crisis_keywords)
        
        # If crisis detected
        if is_crisis:
            crisis_response = {
                "message": message,
                "response": "I'm really concerned about what you've shared. Your safety is crucial. Please reach out to a crisis helpline immediately:\n\n🆘 National Crisis Hotline: 988 (US)\n🆘 International: findahelpline.com\n\nYou are not alone. Professional help is available 24/7. Please contact them right now.",
                "severity": "crisis",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id
            }
            return crisis_response
        
        # Use OpenAI if API key available
        if OPENAI_API_KEY:
            try:
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": message}
                    ],
                    temperature=0.8,
                    max_tokens=500,
                    top_p=0.9
                )
                
                ai_response = response.choices[0].message.content
                
            except Exception as e:
                print(f"OpenAI error: {e}")
                ai_response = generate_fallback_response(message)
        else:
            # Fallback if no OpenAI key
            ai_response = generate_fallback_response(message)
        
        return {
            "message": message,
            "response": ai_response,
            "severity": "normal",
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id
        }
    
    except Exception as e:
        return {
            "message": message,
            "response": "I apologize, I'm having trouble processing your message. Please try again.",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


def generate_fallback_response(message: str) -> str:
    """Generate contextual response when OpenAI is not available"""
    
    message_lower = message.lower()
    
    # Anxiety detection
    if any(word in message_lower for word in ["anxious", "anxiety", "nervous", "worried", "stressed", "overwhelmed"]):
        return """I hear you're feeling anxious. That's a very real and valid experience. Here's what might help:

**Immediate relief:**
- Try the 5-4-3-2-1 grounding technique: Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste
- Take 3 slow, deep breaths (in for 4, hold for 4, out for 6)
- Move your body gently - even a short walk can help

**Understanding your anxiety:**
Anxiety often shows up when we're facing uncertainty. It's your mind trying to protect you, even when there's no immediate danger.

**Moving forward:**
- What's one small thing you can control right now?
- Can you challenge one anxious thought with evidence against it?

Remember: You've gotten through 100% of your tough days so far. This too will pass. 💙"""
    
    # Depression/sadness detection
    if any(word in message_lower for word in ["depressed", "depression", "sad", "hopeless", "empty", "tired", "exhausted"]):
        return """I'm sorry you're feeling this way. Depression can make everything feel heavy and pointless, but these feelings can change.

**What might help right now:**
- Do one tiny thing today - make tea, walk to the window, send one message
- Gentle movement helps - even 10 minutes outside
- Connect with someone, even briefly

**Understanding depression:**
Depression lies to us. It tells us we're alone, that nothing matters, that this is permanent. None of these are true, even though they feel true.

**Taking action:**
- If these feelings persist, please talk to a therapist or doctor
- Crisis support is available 24/7: 988 (US)

You reached out today, which shows strength. That matters. 💙"""
    
    # Relationship issues
    if any(word in message_lower for word in ["relationship", "partner", "boyfriend", "girlfriend", "spouse", "friend", "family", "alone", "lonely"]):
        return """I understand. Relationship struggles and loneliness can feel incredibly isolating.

**First, validate yourself:**
Your feelings are real and valid. Connection struggles are one of the deepest human pains.

**What might help:**
- Express what you need clearly (even in small ways)
- Spend time doing things you enjoy alone - you deserve your own company
- Reach out to one person you trust
- Remember: loneliness can be healed through small connections

**Moving forward:**
- What's one need you could express to someone close to you?
- Is there someone (friend, therapist, counselor) you could talk to?

You deserve meaningful connection. Sometimes we need to create it or find new people. 💙"""
    
    # Self-esteem/confidence
    if any(word in message_lower for word in ["not good enough", "failure", "worthless", "shame", "guilt", "stupid", "ugly", "useless"]):
        return """I hear painful self-criticism. That inner voice can be so harsh. Please know: what you're saying about yourself is likely not true.

**Reframe your thinking:**
- You're having a difficult moment, not being a difficult person
- One mistake doesn't define your entire worth
- You deserve the same compassion you'd give a good friend

**Bhagavad Gita wisdom:**
"You are never born; you can never die. All things are eternally present in time, past, present, and future." Your essence is beyond your current struggles.

**Actions to try:**
- Write down 3 things you did well today (no matter how small)
- Do something kind for yourself
- Speak to yourself like you'd speak to someone you love

Your worth isn't earned through achievement. You matter simply because you exist. 💙"""
    
    # Default empathetic response
    return """Thank you for sharing with me. I'm here to listen and support you.

**What I'm hearing:**
It sounds like you're going through something meaningful right now. Your feelings matter, and it's brave to reach out.

**How I can help:**
- Listen without judgment
- Offer perspective from psychology and wisdom traditions
- Suggest practical coping strategies
- Guide you toward professional help if needed

**Tell me more:**
- What's been the hardest part for you?
- What have you already tried?
- What would help most right now?

I'm here whenever you need to talk. Let's work through this together. 💙"""


@router.get("/history")
async def get_chat_history(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get user's chat history"""
    return {
        "user_id": user_id,
        "messages": [],
        "status": "success"
    }
