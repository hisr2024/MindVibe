"""AI Chatbot API Routes

Provides endpoints for conversational mental health guidance
based on Bhagavad Gita teachings presented universally.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid

from backend.deps import get_db
from backend.services.chatbot import ChatbotService

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

# Global chatbot service instance (in production, this could be redis-backed)
chatbot_service = ChatbotService()


# Request/Response Models
class ChatMessage(BaseModel):
    """Request model for chat messages."""

    message: str = Field(..., min_length=1, description="User's message or question")
    session_id: Optional[str] = Field(
        None, description="Session ID for conversation tracking"
    )
    language: str = Field(
        default="english", description="Preferred language: english, hindi, or sanskrit"
    )
    include_sanskrit: bool = Field(
        default=False, description="Include Sanskrit verses in response"
    )


class VerseReference(BaseModel):
    """A referenced wisdom verse."""

    verse_id: str
    theme: str
    text: str
    context: str
    language: str
    sanskrit: Optional[str] = None
    applications: List[str]


class ChatResponse(BaseModel):
    """Response model for chat messages."""

    response: str = Field(..., description="AI-generated conversational response")
    verses: List[VerseReference] = Field(..., description="Referenced wisdom verses")
    session_id: str = Field(..., description="Session ID for this conversation")
    language: str
    conversation_length: int = Field(
        ..., description="Number of messages in this conversation"
    )


class ConversationHistory(BaseModel):
    """Conversation history for a session."""

    session_id: str
    messages: List[Dict[str, Any]]
    total_messages: int


class SessionInfo(BaseModel):
    """Information about a chat session."""

    session_id: str
    message_count: int


@router.post("/message", response_model=ChatResponse)
async def send_message(chat_msg: ChatMessage, db: AsyncSession = Depends(get_db)):
    """
    Send a message to the AI chatbot and receive guidance.

    The chatbot maintains conversation context and provides mental health
    guidance based on universal wisdom principles from the Bhagavad Gita.

    If no session_id is provided, a new conversation session is created.
    """
    # Validate inputs
    if not chat_msg.message or len(chat_msg.message.strip()) < 1:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    valid_languages = ["english", "hindi", "sanskrit"]
    if chat_msg.language not in valid_languages:
        raise HTTPException(
            status_code=400,
            detail=f"Language must be one of: {', '.join(valid_languages)}",
        )

    # Generate session ID if not provided
    session_id = chat_msg.session_id or str(uuid.uuid4())

    try:
        # Process the chat message
        result = await chatbot_service.chat(
            message=chat_msg.message,
            session_id=session_id,
            db=db,
            language=chat_msg.language,
            include_sanskrit=chat_msg.include_sanskrit,
        )

        # Convert verses to response models
        verse_refs = [VerseReference(**v) for v in result["verses"]]

        return ChatResponse(
            response=result["response"],
            verses=verse_refs,
            session_id=result["session_id"],
            language=result["language"],
            conversation_length=result["conversation_length"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing chat message: {str(e)}"
        )


@router.get("/history/{session_id}", response_model=ConversationHistory)
async def get_conversation_history(session_id: str):
    """
    Retrieve the conversation history for a specific session.
    """
    history = chatbot_service.get_conversation_history(session_id)

    if not history:
        raise HTTPException(
            status_code=404,
            detail=f"No conversation history found for session {session_id}",
        )

    return ConversationHistory(
        session_id=session_id, messages=history, total_messages=len(history)
    )


@router.delete("/history/{session_id}")
async def clear_conversation(session_id: str):
    """
    Clear the conversation history for a specific session.
    """
    success = chatbot_service.clear_conversation(session_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"No conversation history found for session {session_id}",
        )

    return {
        "message": f"Conversation history cleared for session {session_id}",
        "session_id": session_id,
    }


@router.get("/sessions", response_model=List[SessionInfo])
async def list_active_sessions():
    """
    List all active chat sessions.

    Note: In production, this should be user-specific and authenticated.
    """
    sessions = chatbot_service.get_active_sessions()

    return [
        SessionInfo(
            session_id=session_id,
            message_count=len(chatbot_service.get_conversation_history(session_id)),
        )
        for session_id in sessions
    ]


@router.post("/start")
async def start_new_session():
    """
    Start a new chat session and get a session ID.
    """
    session_id = str(uuid.uuid4())

    return {
        "session_id": session_id,
        "message": "New chat session started. Use this session_id in your /message requests.",
        "expires": "Session will persist until cleared or server restart",
    }


@router.get("/health")
async def chatbot_health():
    """
    Check chatbot service health and configuration.
    """
    import os

    openai_configured = bool(
        os.getenv("OPENAI_API_KEY")
        and os.getenv("OPENAI_API_KEY") != "your-api-key-here"
    )

    return {
        "status": "healthy",
        "openai_enabled": openai_configured,
        "fallback_mode": "template-based" if not openai_configured else "ai-powered",
        "active_sessions": len(chatbot_service.get_active_sessions()),
        "supported_languages": ["english", "hindi", "sanskrit"],
    }
