"""Chat routes with intelligent wisdom engine"""

from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

# Import the wisdom engine
from backend.services.wisdom_engine import wisdom_engine

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

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
        return {
            "status": "error",
            "message": chat.message,
            "response": "I'm having trouble processing that. Please try again. 💙",
            "error": str(e)
        }

@router.get("/history")
async def get_history() -> Dict[str, Any]:
    return {"messages": [], "status": "success"}
