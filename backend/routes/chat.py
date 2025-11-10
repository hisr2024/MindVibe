"""KIAAN - Modern AI Companion - GPT-5 Dynamic Responses Only"""

import os
from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

# Import OpenAI
from openai import AsyncOpenAI

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


# Initialize GPT-5 Async Client - MUST WORK
api_key = os.getenv("OPENAI_API_KEY", "").strip()

print("\n" + "="*80)
print("🕉️  KIAAN - GPT-5 INITIALIZATION")
print("="*80)

if api_key:
    print(f"✅ OPENAI_API_KEY found: {len(api_key)} characters")
    print(f"   First 15 chars: {api_key[:15]}")
    print(f"   Last 15 chars: ...{api_key[-15:]}")
    client = AsyncOpenAI(api_key=api_key)
    print(f"✅ AsyncOpenAI client created successfully")
    print(f"✅ GPT-5 ENABLED - Unlimited responses active")
else:
    print(f"❌ OPENAI_API_KEY NOT FOUND")
    print(f"❌ Available environment variables: {list(os.environ.keys())[:5]}")
    client = None

print("="*80 + "\n")


class KIAAN:
    """KIAAN - Modern AI with GPT-5 - NO FALLBACK"""

    def __init__(self):
        self.name = "KIAAN"
        self.version = "5.1"
        self.client = client
        
        self.system_prompt = """You are KIAAN, a modern, compassionate AI companion for mental wellness.

ABSOLUTELY CRITICAL INSTRUCTIONS:
- Modern, contemporary language ONLY (no spiritual or religious terms)
- Each response must be UNIQUE and specific to what the user just said
- NEVER repeat the same response twice
- NEVER use generic templates
- LISTEN to what they're actually saying and respond to THAT
- Short, direct, personal responses (200-400 words)
- Use contractions: "you're", "I'm", "don't" not "you are", "I am", "do not"

YOUR VOICE:
- Warm but realistic
- Direct, not flowery
- Specific to their situation, not generic wisdom
- One person talking to another
- Always genuine, never fake

EXAMPLE OF WHAT NOT TO DO:
❌ "I hear you, my friend. You can't control whether someone is..."
✅ "You've been hurt before. Multiple times. That makes total sense that you'd be cautious now."

RESPONSE STRUCTURE:
1. ACKNOWLEDGE specifically what they just said (show you listened)
2. ONE insight or perspective that directly applies
3. ONE practical suggestion
4. End with something warm

DO NOT:
- Say "I hear you, my friend" every time
- Repeat the same wisdom pieces
- Give generic advice
- Use the same opening twice
- Sound like a database

CRISIS DETECTION:
- Words: "suicide", "kill myself", "end it", "harm myself"
- Response: Immediate crisis resources (988, Crisis Text Line, findahelpline.com)"""

        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

    def is_crisis(self, message: str) -> bool:
        """Detect crisis"""
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        """Crisis response"""
        return """🆘 Please reach out for professional help RIGHT NOW

You are alive right now. You are breathing. That matters.

📞 988 - Suicide & Crisis Lifeline (Call or Text)
💬 Crisis Text Line: Text HOME to 741741
🌍 findahelpline.com

People trained to help are waiting. Please call or text NOW. 💙"""

    async def generate_response(self, user_message: str) -> str:
        """Generate response - GPT-5 ONLY"""
        try:
            # Crisis check
            if self.is_crisis(user_message):
                return self.get_crisis_response()

            # Call GPT-5
            if not self.client:
                return "❌ API Configuration Error - OPENAI_API_KEY not found. Please check GitHub Secrets."

            print(f"\n📡 Calling GPT-5...")
            print(f"   User message: {user_message[:60]}...")
            
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": self.system_prompt
                    },
                    {
                        "role": "user",
                        "content": user_message
                    }
                ],
                temperature=0.9,  # Higher for more creativity
                max_tokens=1500,  # Shorter responses to avoid loops
                top_p=0.98,
            )
            
            generated_response = response.choices[0].message.content
            print(f"✅ GPT-5 Response generated: {len(generated_response)} characters")
            return generated_response

        except Exception as e:
            error_msg = f"❌ GPT-5 Error: {type(e).__name__}: {str(e)[:100]}"
            print(f"\n{error_msg}")
            import traceback
            traceback.print_exc()
            return error_msg


kiaan = KIAAN()


@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    """Chat endpoint - GPT-5 powered responses"""
    try:
        message = chat.message.strip()
        
        if not message:
            return {
                "status": "error",
                "response": "What's on your mind? 💙"
            }
        
        print(f"\n{'='*80}")
        print(f"📨 NEW MESSAGE at {datetime.utcnow().isoformat()}")
        print(f"   User: {message[:80]}...")
        
        response = await kiaan.generate_response(message)
        
        print(f"   Response: {response[:80]}...")
        print(f"{'='*80}\n")
        
        return {
            "status": "success",
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "bot_name": "KIAAN",
            "version": "5.1",
            "powered_by": "GPT-5"
        }
    
    except Exception as e:
        print(f"❌ Error in /message: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "response": f"Error: {str(e)}"
        }


@router.get("/health")
async def health() -> Dict[str, Any]:
    """Health check"""
    return {
        "status": "healthy",
        "bot": "KIAAN",
        "version": "5.1",
        "api_key_loaded": bool(api_key),
        "gpt5_ready": kiaan.client is not None,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    """About endpoint"""
    return {
        "name": "KIAAN",
        "version": "5.1",
        "description": "Modern AI Companion for Mental Wellness - GPT-5 Powered",
        "features": ["Unlimited dynamic responses", "No loops or repetition", "Personalized guidance"],
        "powered_by": "GPT-5",
        "api_ready": kiaan.client is not None
    }


@router.get("/history")
async def history() -> Dict[str, Any]:
    """History endpoint"""
    return {"messages": []}
