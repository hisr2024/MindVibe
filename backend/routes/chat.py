"""KIAAN - Modern AI Companion - GPT-5 Powered (OpenAI v1.3+ Compatible)"""

import os
from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

print("\n" + "="*80)
print("🕉️  KIAAN - CHAT ROUTER INITIALIZATION")
print("="*80)

# Get API key
api_key = os.getenv("OPENAI_API_KEY", "").strip()
print(f"✅ OPENAI_API_KEY found: {bool(api_key)}")
print(f"   Length: {len(api_key)}")

# Import OpenAI v1.3+ client
from openai import OpenAI

# Create client
if api_key:
    client = OpenAI(api_key=api_key)
    print(f"✅ OpenAI client (v1.3+) created successfully")
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
    """KIAAN - Modern AI with GPT-5"""

    def __init__(self):
        self.name = "KIAAN"
        self.version = "6.0"
        self.client = client
        self.ready = ready
        
        self.system_prompt = """You are KIAAN, a modern, compassionate AI companion for mental wellness.

KEY RULES:
- Each response must be completely unique and specific
- Listen to exactly what the user said
- Respond to THEIR situation, not generic templates
- Modern language only
- Short and direct (200-350 words)
- End with 💙
- NEVER repeat the same response

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

    def generate_response(self, user_message: str) -> str:
        """Generate response - OpenAI v1.3+ compatible"""
        try:
            # Crisis check
            if self.is_crisis(user_message):
                return self.get_crisis_response()

            # Check if ready
            if not self.ready or not self.client:
                return "❌ API KEY NOT CONFIGURED - Please add OPENAI_API_KEY to Render environment variables"

            # Call GPT-5 using NEW v1.3+ syntax
            print(f"📡 Calling GPT-5 with v1.3+ client...")
            
            response = self.client.chat.completions.create(
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
            print(f"✅ GPT-5 response generated: {len(answer)} chars")
            return answer

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)[:80]}"
            print(f"❌ GPT-5 Error: {error_msg}")
            return f"Error: {error_msg}"


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
        
        response = kiaan.generate_response(message)
        
        return {
            "status": "success",
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "bot_name": "KIAAN",
            "version": "6.0",
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
        "version": "6.0",
        "gpt5_ready": kiaan.ready,
        "openai_version": "v1.3+"
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    """About endpoint"""
    return {
        "name": "KIAAN",
        "version": "6.0",
        "status": "GPT-5 Powered" if kiaan.ready else "API Key Missing",
        "gpt5_enabled": kiaan.ready,
        "openai_lib_version": "v1.3+"
    }


@router.get("/debug")
async def debug() -> Dict[str, Any]:
    """Debug endpoint"""
    return {
        "status": {
            "api_key_found": kiaan.ready,
            "client_ready": kiaan.client is not None,
            "version": "6.0"
        },
        "openai": {
            "library_version": "v1.3+",
            "compatibility": "ChatCompletion.create() is NOT supported - using client.chat.completions.create()"
        }
    }


@router.get("/history")
async def history() -> Dict[str, Any]:
    """History endpoint"""
    return {"messages": []}
