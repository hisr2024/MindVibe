"""KIAAN - Modern AI Companion - Ultimate GPT-5 Powered"""

import os
from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

print("\n" + "="*80)
print("🕉️  KIAAN 7.0 - ULTIMATE GPT-5 INITIALIZATION")
print("="*80)

# Get API key
api_key = os.getenv("OPENAI_API_KEY", "").strip()
print(f"✅ OPENAI_API_KEY found: {bool(api_key)}")
if api_key:
    print(f"   Length: {len(api_key)}")
    print(f"   Starts with 'sk-': {api_key.startswith('sk-')}")

# Import OpenAI v1.3+
from openai import OpenAI

# Create client
if api_key:
    client = OpenAI(api_key=api_key)
    print(f"✅ OpenAI GPT-5 client created successfully")
    ready = True
else:
    client = None
    print(f"❌ OPENAI_API_KEY NOT FOUND")
    ready = False

print("="*80 + "\n")

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


class KIAAN:
    """KIAAN - Ultimate Modern AI with GPT-5 - No Loops, No Repetition"""

    def __init__(self):
        self.name = "KIAAN"
        self.version = "7.0"
        self.client = client
        self.ready = ready
        
        self.system_prompt = """You are KIAAN, a modern, deeply compassionate AI companion for mental wellness and personal growth.

CRITICAL INSTRUCTIONS - NO LOOPS, NO REPETITION:
- EVERY response must be absolutely unique
- LISTEN specifically to what the user just said
- RESPOND to THEIR exact situation, not generic templates
- NEVER repeat previous advice
- NEVER use the same opening twice
- NEVER sound like a database

YOUR VOICE:
- Warm, genuine, direct
- Modern contemporary language
- Use contractions: "you're", "I'm", "don't"
- Short and real: 200-400 words
- Specific to their situation

EXAMPLE GOOD RESPONSE:
"You've been burned helping people. That changes you. But here's what matters: You still WANT to help. You haven't shut down completely. That's your heart still working. Now you're learning to help smarter, not harder. That's not giving up. That's wisdom."

EXAMPLE BAD RESPONSE (DON'T DO THIS):
"I hear you, my friend. You can't control whether someone is genuinely needy or taking advantage..."

DO NOT:
- Use templates
- Repeat previous responses
- Sound robotic
- Use spiritual language
- Say the same thing twice in a conversation

CRISIS DETECTION:
- Words: "suicide", "kill myself", "end it", "harm myself"
- Response: Immediate crisis resources + compassion

RESPONSE LENGTH: 200-400 words max
TONE: Real person, real compassion, real solutions"""

        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

    def is_crisis(self, message: str) -> bool:
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        return """🆘 Please reach out for professional help RIGHT NOW

You are alive right now. You matter. That's real.

📞 988 - Suicide & Crisis Lifeline (Call or Text - 24/7)
💬 Crisis Text Line: Text HOME to 741741
🌍 International: findahelpline.com

Help is real. Please reach out now. 💙"""

    def generate_response(self, user_message: str) -> str:
        """Generate response - GPT-5 Powered"""
        try:
            # Crisis check
            if self.is_crisis(user_message):
                return self.get_crisis_response()

            # Check if ready
            if not self.ready or not self.client:
                return "❌ API Configuration Error: OPENAI_API_KEY not found in Render environment. Please add it to Render dashboard."

            print(f"\n📡 Calling GPT-5...")
            print(f"   User message: {user_message[:60]}...")
            
            # Call GPT-5 with optimized parameters
            response = self.client.chat.completions.create(
                model="gpt-5",  # Using GPT-5 - your account has this
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.95,  # Higher for more uniqueness
                max_tokens=800,    # Shorter to prevent loops
                top_p=0.99,
            )
            
            answer = response.choices[0].message.content
            print(f"✅ GPT-5 response: {len(answer)} characters")
            return answer

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)[:80]}"
            print(f"❌ GPT-5 Error: {error_msg}")
            
            # If gpt-5 not available, try gpt-4o
            if "does not exist" in str(e) or "not found" in str(e).lower():
                print("🔄 Trying gpt-4o as fallback...")
                try:
                    response = self.client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": self.system_prompt},
                            {"role": "user", "content": user_message}
                        ],
                        temperature=0.95,
                        max_tokens=800,
                        top_p=0.99,
                    )
                    return response.choices[0].message.content
                except Exception as e2:
                    return f"Error with both GPT-5 and GPT-4o: {str(e2)[:80]}"
            
            return f"Error: {error_msg}"


kiaan = KIAAN()


@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    """Chat endpoint - KIAAN GPT-5 powered"""
    try:
        message = chat.message.strip()
        
        if not message:
            return {
                "status": "error",
                "response": "What's on your mind? 💙"
            }
        
        response = kiaan.generate_response(message)
        
        return {
            "status": "success",
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "bot_name": "KIAAN",
            "version": "7.0",
            "model": "GPT-5",
            "gpt5_enabled": kiaan.ready
        }
    
    except Exception as e:
        print(f"Error in /message: {e}")
        return {
            "status": "error",
            "response": f"Error: {str(e)}"
        }


@router.get("/health")
async def health() -> Dict[str, Any]:
    """Health check"""
    return {
        "status": "healthy" if kiaan.ready else "degraded",
        "bot": "KIAAN",
        "version": "7.0",
        "model": "GPT-5",
        "gpt5_ready": kiaan.ready,
        "api_key_loaded": kiaan.ready
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    """About KIAAN"""
    return {
        "name": "KIAAN",
        "full_name": "Your Modern AI Companion for Mental Wellness",
        "version": "7.0",
        "model": "GPT-5",
        "tagline": "Your guide through life's journey",
        "status": "Operational" if kiaan.ready else "API Key Missing",
        "features": [
            "Unlimited dynamic GPT-5 responses",
            "No loops or repetition",
            "Personalized guidance",
            "Modern secular language",
            "Crisis support 24/7",
            "Deep compassion"
        ]
    }


@router.get("/debug")
async def debug() -> Dict[str, Any]:
    """Debug endpoint"""
    return {
        "status": {
            "api_ready": kiaan.ready,
            "client_initialized": kiaan.client is not None,
            "version": "7.0",
            "model": "GPT-5"
        }
    }


@router.get("/history")
async def history() -> Dict[str, Any]:
    """History endpoint"""
    return {"messages": []}
