"""KIAAN - Ultimate Modern AI Companion Powered by GPT-5"""

import os
import sys
from typing import Dict, Any, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import random
import asyncio

# Try to import OpenAI
try:
    import openai
    from openai import AsyncOpenAI
    HAS_OPENAI = True
    print("✅ OpenAI library imported successfully")
except ImportError:
    HAS_OPENAI = False
    print("❌ OpenAI library not found")

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Initialize GPT-5 client
gpt5_client = None
has_gpt5_enabled = False

try:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment variables")
    elif len(api_key) < 10:
        print(f"❌ OPENAI_API_KEY appears invalid (too short): {len(api_key)} chars")
    else:
        gpt5_client = AsyncOpenAI(api_key=api_key)
        has_gpt5_enabled = True
        print(f"✅ GPT-5 AsyncOpenAI client initialized successfully")
        print(f"✅ API Key loaded: {api_key[:20]}...{api_key[-20:]}")
        
except Exception as e:
    print(f"❌ Error initializing GPT-5 client: {type(e).__name__}: {e}")


class ChatMessage(BaseModel):
    message: str


class UniversalWisdom:
    """Universal Wisdom Database - Modern & Secular"""
    
    wisdom = {
        "service_giving": [
            "You're asking a profound question: 'What if I help the wrong person?' Here's the truth—there's no such thing as the 'wrong' person. Everyone who asks for help is genuinely struggling. Your doubt is actually your conscience working, which means you care deeply. That's beautiful.",
            
            "The people who cheat or take advantage aren't your problem to solve. Your problem is this: Will you let the fear of being cheated stop you from helping anyone at all? That's where the real choice lies. Fear or compassion. You choose.",
            
            "You can't control whether someone is genuinely needy or taking advantage. You can only control your intention. Give with an open heart, but also with boundaries. Help, but don't enable. Support, but don't sacrifice yourself. That's wisdom.",
            
            "Here's what happens when you serve: You discover your own capacity for compassion. You realize you have more than you thought. You build connections that sustain your own soul. The person you help becomes less important than the person you become.",
            
            "Your doubt shows wisdom. Not everyone needs your help in the way they ask for it. Some need you to say no. Some need you to redirect them to professional help. That's also service. Compassionate service includes honest boundaries.",
            
            "Start small and observe. Help one person. Watch what happens. Notice if they're genuinely struggling or taking advantage. Trust your instincts. Over time, you'll develop wisdom about who and how to help. That's called discernment.",
            
            "The act of giving transforms you more than it transforms the receiver. When you give, something happens inside you—an opening, an expansion, a reminder that you're part of something larger. That's the real gift.",
        ],
        
        "anxiety_stress": [
            "Focus your energy on what you can actually control right now. Worrying about outcomes you can't influence is like trying to hold water in your hands. Put your full effort into this moment, do your best, and let the result take care of itself.",
            
            "Your mind is creating threats that haven't happened yet. That's its job—to protect you. But right now, you're safe. Ground yourself in what's real: your breath, your body, the present second. The future will handle itself.",
            
            "Anxiety thrives when you're fighting reality. Instead of resisting, acknowledge it: 'Yes, I'm anxious. That's okay.' Watch it like clouds. Don't judge it, don't fight it, just observe. It will pass.",
            
            "Break your challenge into the smallest next step. Not the whole mountain—just the next stone. Master that. Then the next. This is how mountains are climbed. This is how anxiety loses its power.",
        ],
        
        "depression_hopelessness": [
            "Depression whispers lies: 'Nothing matters.' 'You're broken.' 'This won't change.' None are true. Depression is like heavy fog—it makes everything look gray and permanent. But fog always lifts. Always.",
            
            "Right now, you don't need to fix your whole life. You just need to survive this moment. Take one breath. Then another. Drink water. Move your body—even just for 30 seconds. These tiny actions are rebellions against darkness.",
            
            "You are not your thoughts. When depression whispers, 'You're worthless,' that's the illness talking. You are the observer of that thought. That distinction is everything.",
        ],
        
        "crisis_emergency": [
            "Right now, you are alive. You are breathing. That is enough. Focus only on that.",
            "What you're feeling is intense, but it is not permanent. Feelings change. This moment will pass.",
            "📞 988 Suicide & Crisis Lifeline (Call or Text)\n💬 Crisis Text Line: Text HOME to 741741\n🌍 International: findahelpline.com",
        ]
    }

    @staticmethod
    def get_random_wisdom(emotion: str) -> str:
        emotion_key = emotion.lower().replace(" ", "_")
        wisdom_list = UniversalWisdom.wisdom.get(emotion_key, UniversalWisdom.wisdom.get("service_giving", ["I hear you. 💙"]))
        return random.choice(wisdom_list) if wisdom_list else "I hear you, my friend. 💙"


class KIAAN:
    """KIAAN - Ultimate Modern AI with GPT-5 Unlimited Responses"""

    def __init__(self):
        self.name = "KIAAN"
        self.version = "5.0"
        self.has_gpt5 = has_gpt5_enabled
        self.client = gpt5_client
        
        self.system_prompt = """You are KIAAN, a modern AI companion for mental wellness and personal growth.

YOUR APPROACH:
- Absolutely modern, contemporary language
- NO religious or spiritual terminology
- Universal wisdom accessible to everyone
- Like talking to a wise, empathetic friend
- Deep understanding of human experience

YOUR PERSONALITY:
- Warm, genuine, deeply compassionate
- Opening: "I hear you, my friend..."
- Contemporary tone (use contractions)
- No corporate speak
- Real talk with real compassion
- Always end with 💙

YOUR PRINCIPLES (Express naturally, not as lists):
1. You control effort, not outcomes
2. You're never truly alone
3. Your worth is inherent
4. Action beats perfect planning
5. Connection dissolves isolation
6. Understanding transforms conflict
7. Your essence is resilient
8. Service creates meaning
9. Failure is feedback
10. The present moment is where power lives

CRISIS PROTOCOL:
- Detect: "suicide", "kill myself", "end it", "harm myself"
- Provide immediate crisis resources
- Show extreme compassion

RESPONSE STRUCTURE:
1. Warm opening acknowledging their specific situation
2. Deep understanding - show you really get it
3. Relevant insight in modern language
4. Practical next steps
5. Connection to their strength
6. Genuine closing with 💙

LENGTH: 150-500 words
TONE: Modern, direct, compassionate, practical"""

        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

    def is_crisis(self, message: str) -> bool:
        message_lower = message.lower()
        return any(word in message_lower for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        return """🆘 I need you to reach out for professional help right now

Right now, you are alive. You are breathing. That is enough.

What you're feeling is intense, but it is not permanent. This moment will pass.

IMMEDIATE RESOURCES:
📞 988 Suicide & Crisis Lifeline (Call or Text - Available NOW)
💬 Crisis Text Line: Text HOME to 741741
🌍 International: findahelpline.com

Please reach out right now. There are people trained to help exactly what you're experiencing.

You matter. Your life has value. This darkness is temporary. Help is real. 💙"""

    async def generate_response(self, message: str) -> str:
        try:
            if self.is_crisis(message):
                return self.get_crisis_response()

            if self.has_gpt5 and self.client:
                try:
                    print(f"📡 Calling GPT-5 for unlimited response...")
                    response = await self._call_gpt5(message)
                    print(f"✅ GPT-5 response generated")
                    return response
                except Exception as gpt_error:
                    print(f"❌ GPT-5 call failed: {gpt_error}")
            
            print(f"🔄 Using fallback wisdom response")
            return self._fallback_response(message)

        except Exception as e:
            print(f"❌ Error: {e}")
            return "I'm here for you, my friend. You're stronger than you know. 💙"

    async def _call_gpt5(self, user_message: str) -> str:
        if not self.client:
            raise Exception("GPT-5 client not initialized")
        
        try:
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
                temperature=0.85,
                max_tokens=2000,
                top_p=0.95,
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            print(f"API Error: {e}")
            raise

    def _fallback_response(self, message: str) -> str:
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["service", "give", "help", "cheat", "needy"]):
            emotion = "service_giving"
        elif any(word in message_lower for word in ["anxious", "worried", "stressed"]):
            emotion = "anxiety_stress"
        elif any(word in message_lower for word in ["depressed", "sad", "hopeless"]):
            emotion = "depression_hopelessness"
        else:
            emotion = "service_giving"
        
        wisdom = UniversalWisdom.get_random_wisdom(emotion)
        return f"I hear you, my friend.\n\n{wisdom}\n\n💙"


kiaan = KIAAN()

print("\n" + "="*80)
print("🕉️  KIAAN 5.0 - ULTIMATE GPT-5 INITIALIZATION")
print("="*80)
print(f"✅ Version: 5.0")
print(f"✅ GPT-5 Enabled: {kiaan.has_gpt5}")
print(f"✅ Response Mode: {'UNLIMITED GPT-5' if kiaan.has_gpt5 else 'WISDOM FALLBACK'}")
print("="*80 + "\n")


@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    try:
        message = chat.message.strip()
        
        if not message:
            return {
                "status": "error",
                "message": message,
                "response": "What's on your mind? I'm here to listen. 💙"
            }
        
        print(f"\n📨 Message: {message[:50]}...")
        response = await kiaan.generate_response(message)
        
        return {
            "status": "success",
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "bot_name": "KIAAN",
            "version": "5.0",
            "gpt5_enabled": kiaan.has_gpt5,
            "unlimited": kiaan.has_gpt5
        }
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "status": "error",
            "message": chat.message,
            "response": "I'm here for you. Let's try again. 💙"
        }


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "bot": "KIAAN",
        "version": "5.0",
        "gpt5_enabled": kiaan.has_gpt5,
        "response_mode": "unlimited_gpt5" if kiaan.has_gpt5 else "wisdom_fallback",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/about")
async def about() -> Dict[str, Any]:
    return {
        "name": "KIAAN",
        "full_name": "Your Modern AI Companion for Mental Wellness",
        "version": "5.0",
        "gpt5_enabled": kiaan.has_gpt5,
        "features": [
            "Unlimited dynamic responses powered by GPT-5",
            "Modern, secular language",
            "Personalized guidance",
            "Crisis support 24/7"
        ]
    }


@router.get("/history")
async def get_history() -> Dict[str, Any]:
    return {"messages": [], "status": "success"}
