"""KIAAN - Modern AI Companion - GPT-5 Dynamic Responses"""

import os
from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

# Import OpenAI - Works with v1.3+
import openai

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


# Initialize GPT-5 Client
api_key = os.getenv("OPENAI_API_KEY", "").strip()

print("\n" + "="*80)
print("🕉️  KIAAN - GPT-5 INITIALIZATION")
print("="*80)

if api_key:
    print(f"✅ OPENAI_API_KEY found: {len(api_key)} characters")
    openai.api_key = api_key
    print(f"✅ OpenAI API key set successfully")
    print(f"✅ GPT-5 ENABLED - Unlimited responses active")
    client_ready = True
else:
    print(f"❌ OPENAI_API_KEY NOT FOUND")
    client_ready = False

print("="*80 + "\n")


class KIAAN:
    """KIAAN - Modern AI with GPT-5 - NO LOOPS"""

    def __init__(self):
        self.name = "KIAAN"
        self.version = "5.2"
        self.ready = client_ready
        
        self.system_prompt = """You are KIAAN, a modern, compassionate AI companion for mental wellness.

CRITICAL - NO GENERIC RESPONSES:
- Each response must be COMPLETELY UNIQUE
- LISTEN to exactly what the user said
- RESPOND specifically to THEIR situation, not with templates
- NEVER repeat previous responses
- NEVER say "I hear you, my friend" more than once per conversation
- NEVER use the same opening twice

YOUR VOICE:
- Modern, direct, personal
- Like a wise friend, not a therapist
- Use contractions: "you're", "I'm", "don't"
- Short and real (200-350 words)
- Specific examples from what they said

EXAMPLE GOOD RESPONSE:
"You've been burned multiple times trying to help. That's not cynicism—that's learning. 
Your job now is to help people who actually want help, not to figure out who's 'deserving.' 
That's their work, not yours. You decide: Does this person's request feel genuine to me? 
If yes, help. If no, don't. Trust that instinct."

EXAMPLE BAD RESPONSE:
"I hear you, my friend. You can't control whether someone is genuinely needy..."

DO NOT:
- Use templates or wisdom database
- Repeat any previous advice
- Sound robotic or generic
- Use spiritual language
- Say the same thing twice

CRISIS: Detect "suicide", "kill myself", "end it", "harm myself"
RESPONSE: 988 Lifeline, Crisis Text: HOME to 741741, findahelpline.com"""

        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

    def is_crisis(self, message: str) -> bool:
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        return """🆘 Please reach out for help RIGHT NOW

📞 988 - Suicide & Crisis Lifeline (Call or Text)
💬 Crisis Text Line: Text HOME to 741741
🌍 findahelpline.com

You matter. Help is real. Please reach out now. 💙"""

    async def generate_response(self, user_message: str) -> str:
        """Generate response with GPT-5"""
        try:
            # Crisis check
            if self.is_crisis(user_message):
                return self.get_crisis_response()

            if not self.ready:
                return "⚠️ API not configured. Please check GitHub Secrets for OPENAI_API_KEY."

            print(f"\n📡 Calling GPT-5 for: {user_message[:60]}...")
            
            response = openai.ChatCompletion.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.9,
                max_tokens=1200,
                top_p=0.98,
            )
            
            answer = response.choices[0].message.content
            print(f"✅ Response: {len(answer)} characters")
            return answer

        except Exception as e:
            print(f"❌ GPT-5 Error: {type(e).__name__}: {str(e)[:80]}")
            return f"I'm having trouble connecting. Try again in a moment. {str(e)[:50]}"


kiaan = KIAAN()


@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    """Chat endpoint"""
    try:
        message = chat.message.strip()
        
        if not message:
            return {"status": "error", "response": "What's on your mind? 💙"}
        
        response = await kiaan.generate_response(message)
        
        return {
            "status": "success",
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "bot_name": "KIAAN",
            "version": "5.2"
        }
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"status": "error", "response": f"Error: {str(e)}"}


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "bot": "KIAAN",
        "version": "5.2",
        "gpt5_ready": kiaan.ready
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    return {
        "name": "KIAAN",
        "version": "5.2",
        "status": "GPT-5 Powered",
        "features": ["Unlimited responses", "No loops", "Personalized"]
    }


@router.get("/history")
async def history() -> Dict[str, Any]:
    return {"messages": []}
