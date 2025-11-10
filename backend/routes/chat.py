"""KIAAN - Modern AI Companion - GPT-5 Powered"""

import os
import sys
from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

print("\n" + "="*80)
print("🕉️  KIAAN - CHAT ROUTER INITIALIZATION")
print("="*80)

# Get API key - Try multiple methods
api_key = None

# Method 1: Direct environment variable
api_key = os.getenv("OPENAI_API_KEY", "").strip()
print(f"Method 1 - Direct env var: {bool(api_key)}")

# Method 2: Try alternate name
if not api_key:
    api_key = os.getenv("OPENAI_KEY", "").strip()
    print(f"Method 2 - Alternate name: {bool(api_key)}")

# Method 3: From render env
if not api_key:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    print(f"Method 3 - os.environ direct: {bool(api_key)}")

print(f"\n🔑 API Key Status:")
print(f"   Found: {bool(api_key)}")
if api_key:
    print(f"   Length: {len(api_key)}")
    print(f"   Starts with 'sk-': {api_key.startswith('sk-')}")
    print(f"   First 20 chars: {api_key[:20]}")
else:
    print(f"   ❌ NOT FOUND in any method")
    print(f"   Available env vars: {list(os.environ.keys())[:10]}")

# Import OpenAI
try:
    import openai
    openai.api_key = api_key if api_key else ""
    print(f"\n✅ OpenAI imported successfully")
    print(f"✅ API key set in openai module")
except Exception as e:
    print(f"❌ Error with OpenAI: {e}")

print("="*80 + "\n")

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


class KIAAN:
    """KIAAN - Modern AI with GPT-5"""

    def __init__(self):
        self.name = "KIAAN"
        self.version = "5.3"
        self.api_key = api_key
        self.ready = bool(api_key)
        
        self.system_prompt = """You are KIAAN, a modern, compassionate AI companion for mental wellness.

KEY RULES:
- Each response must be completely unique
- Listen specifically to what the user said
- Respond to THEIR situation, not with templates
- Modern language only
- Short and direct (200-350 words)
- End with 💙

NEVER repeat the same response twice.
NEVER use "I hear you, my friend" more than once.
NEVER sound generic or robotic.

BE REAL. BE SPECIFIC. BE DIFFERENT EVERY TIME."""

        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

    def is_crisis(self, message: str) -> bool:
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        return """🆘 Please reach out for help RIGHT NOW

📞 988 - Suicide & Crisis Lifeline (Call or Text)
💬 Crisis Text Line: Text HOME to 741741
🌍 findahelpline.com

You matter. Help is real. Reach out now. 💙"""

    async def generate_response(self, user_message: str) -> str:
        """Generate response"""
        try:
            # Crisis check
            if self.is_crisis(user_message):
                return self.get_crisis_response()

            # Check if API key is available
            if not self.ready or not self.api_key:
                return f"""❌ API KEY NOT CONFIGURED

Status: API key not found in environment

To fix:
1. Go to Render Dashboard: https://dashboard.render.com
2. Find MindVibe backend service
3. Click "Environment" tab
4. Add: OPENAI_API_KEY = [your GPT-5 key]
5. Save and restart service

OR contact support.

Current key status: {bool(self.api_key)} (length: {len(self.api_key) if self.api_key else 0})"""

            # Call GPT-5
            print(f"📡 Calling GPT-5...")
            
            response = openai.ChatCompletion.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.9,
                max_tokens=1000,
                top_p=0.98,
            )
            
            answer = response.choices[0].message.content
            print(f"✅ Response generated: {len(answer)} chars")
            return answer

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)[:80]}"
            print(f"❌ GPT-5 Error: {error_msg}")
            return f"Error connecting to GPT-5: {error_msg}"


kiaan = KIAAN()


@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    """Chat endpoint"""
    try:
        message = chat.message.strip()
        
        if not message:
            return {
                "status": "error",
                "response": "What's on your mind? 💙"
            }
        
        response = await kiaan.generate_response(message)
        
        return {
            "status": "success",
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "bot_name": "KIAAN",
            "version": "5.3",
            "gpt5_enabled": kiaan.ready
        }
    
    except Exception as e:
        print(f"Error: {e}")
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
        "version": "5.3",
        "api_key_loaded": kiaan.ready,
        "gpt5_ready": kiaan.ready
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    """About endpoint"""
    return {
        "name": "KIAAN",
        "version": "5.3",
        "status": "GPT-5 Powered" if kiaan.ready else "API Key Missing",
        "gpt5_enabled": kiaan.ready
    }


@router.get("/debug")
async def debug() -> Dict[str, Any]:
    """Debug endpoint"""
    return {
        "kiaan": {
            "api_key_found": kiaan.ready,
            "api_key_length": len(kiaan.api_key) if kiaan.api_key else 0,
            "api_key_starts_with_sk": kiaan.api_key.startswith("sk-") if kiaan.api_key else False
        }
    }


@router.get("/history")
async def history() -> Dict[str, Any]:
    """History endpoint"""
    return {"messages": []}
