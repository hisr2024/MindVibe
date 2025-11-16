"""KIAAN - Ultimate GPT-5 + Mental Wellness Companion (v12.0)"""

import os
from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from openai import OpenAI

api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None
ready = bool(api_key)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


class KIAAN:
    def __init__(self):
        self.name = "KIAAN"
        self.version = "12.0"
        self.client = client
        self.ready = ready
        self.crisis_keywords = ["suicide", "kill myself", "end it", "harm myself", "want to die"]

    def is_crisis(self, message: str) -> bool:
        return any(word in message.lower() for word in self.crisis_keywords)

    def get_crisis_response(self) -> str:
        return "🆘 Please reach out for help RIGHT NOW\n\n📞 988 - Suicide & Crisis Lifeline (24/7)\n💬 Crisis Text: Text HOME to 741741\n🌍 findahelpline.com\n\nYou matter. Help is real. 💙"

    def generate_response(self, user_message: str) -> str:
        try:
            if self.is_crisis(user_message):
                return self.get_crisis_response()

            if not self.ready or not self.client:
                return "❌ API Key not configured"

            response = self.client.chat.completions.create(
                model="gpt-5",
                messages=[
                    {"role": "system", "content": "You are KIAAN, a modern AI companion for mental wellness. Be warm, direct, contemporary. 200-400 words. Respond to their specific situation. End with 💙"},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.9,
                top_p=0.98,
            )
            
            content = response.choices[0].message.content
            return content if content is not None else "I'm here for you. Let's try again. 💙"
        except Exception as e:
            return "I'm here for you. Let's try again. 💙"


kiaan = KIAAN()


@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    try:
        message = chat.message.strip()
        if not message:
            return {"status": "error", "response": "What's on your mind? 💙"}
        
        response = kiaan.generate_response(message)
        return {
            "status": "success",
            "response": response,
            "bot": "KIAAN",
            "version": "12.0",
            "model": "GPT-5",
        }
    except Exception as e:
        return {"status": "error", "response": str(e)}


@router.get("/health")
async def health() -> Dict[str, Any]:
    return {"status": "healthy" if ready else "error", "bot": "KIAAN", "version": "12.0"}


@router.get("/about")
async def about() -> Dict[str, Any]:
    return {"name": "KIAAN", "version": "12.0", "model": "gpt-5", "status": "Operational" if ready else "Error"}


@router.get("/debug")
async def debug() -> Dict[str, Any]:
    return {"api_ready": ready, "version": "12.0", "model": "gpt-5"}


@router.get("/history")
async def history() -> Dict[str, Any]:
    return {"messages": []}