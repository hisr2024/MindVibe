# backend/routers/kiaan.py
# All KIAAN AI endpoints — 7 total
# Uses ai_provider.py — provider is transparent to these endpoints

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from backend.services.ai_provider import call_kiaan_ai
from backend.deps import get_current_user   # existing auth dependency (returns user_id: str)

router = APIRouter(prefix="/api/kiaan", tags=["kiaan"])


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Message] = []
    tool_name: Optional[str] = None
    gita_verse: Optional[dict] = None


class ToolRequest(BaseModel):
    inputs: dict
    gita_verse: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None


# ── 1. Sakha Chat ──────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def sakha_chat(req: ChatRequest, user_id: str = Depends(get_current_user)):
    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty")
    try:
        history = [{"role": m.role, "content": m.content}
                   for m in req.conversation_history]
        text = await call_kiaan_ai(
            message=req.message,
            conversation_history=history,
            gita_verse=req.gita_verse,
            tool_name=req.tool_name,
        )
        return ChatResponse(response=text, conversation_id=str(user_id))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ── 2. Emotional Reset ────────────────────────────────────────────────────
@router.post("/tools/emotional-reset", response_model=ChatResponse)
async def emotional_reset(req: ToolRequest, user_id: str = Depends(get_current_user)):
    msg = (
        f"I am experiencing {req.inputs.get('emotion','overwhelmed')} "
        f"with intensity {req.inputs.get('intensity','5')}/10. "
        f"What happened: {req.inputs.get('situation','')}. "
        f"Please guide me through an emotional reset using Gita wisdom."
    )
    try:
        text = await call_kiaan_ai(msg, gita_verse=req.gita_verse,
                                   tool_name="Emotional Reset")
        return ChatResponse(response=text)
    except Exception as e:
        raise HTTPException(500, str(e))


# ── 3. Ardha (Cognitive Reframing) ────────────────────────────────────────
@router.post("/tools/ardha", response_model=ChatResponse)
async def ardha(req: ToolRequest, user_id: str = Depends(get_current_user)):
    msg = (
        f"I need cognitive reframing. "
        f"My situation: {req.inputs.get('situation','')}. "
        f"Limiting belief: {req.inputs.get('limiting_belief','')}. "
        f"My fear: {req.inputs.get('fear','')}. "
        f"Please reframe this through Gita philosophy."
    )
    try:
        text = await call_kiaan_ai(msg, gita_verse=req.gita_verse, tool_name="Ardha")
        return ChatResponse(response=text)
    except Exception as e:
        raise HTTPException(500, str(e))


# ── 4. Viyoga (Sacred Detachment) ────────────────────────────────────────
@router.post("/tools/viyoga", response_model=ChatResponse)
async def viyoga(req: ToolRequest, user_id: str = Depends(get_current_user)):
    msg = (
        f"I am struggling to let go of: {req.inputs.get('attachment','')}. "
        f"This is an attachment to: {req.inputs.get('attachment_type','')}. "
        f"Freedom would feel like: {req.inputs.get('freedom_vision','')}. "
        f"Guide me through Viyoga — the sacred art of non-attachment."
    )
    try:
        text = await call_kiaan_ai(msg, gita_verse=req.gita_verse, tool_name="Viyoga")
        return ChatResponse(response=text)
    except Exception as e:
        raise HTTPException(500, str(e))


# ── 5. Karma Reset ────────────────────────────────────────────────────────
@router.post("/tools/karma-reset", response_model=ChatResponse)
async def karma_reset(req: ToolRequest, user_id: str = Depends(get_current_user)):
    msg = (
        f"Karmic pattern I want to examine: {req.inputs.get('pattern','')}. "
        f"This involves: {req.inputs.get('dimension','')}. "
        f"Dharmic action I feel called to: {req.inputs.get('dharmic_action','')}. "
        f"Guide me through a Karma Reset using Gita wisdom."
    )
    try:
        text = await call_kiaan_ai(msg, gita_verse=req.gita_verse,
                                   tool_name="Karma Reset")
        return ChatResponse(response=text)
    except Exception as e:
        raise HTTPException(500, str(e))


# ── 6. Relationship Compass ───────────────────────────────────────────────
@router.post("/tools/relationship-compass", response_model=ChatResponse)
async def relationship_compass(req: ToolRequest, user_id: str = Depends(get_current_user)):
    msg = (
        f"Relationship challenge: {req.inputs.get('challenge','')}. "
        f"This is with: {req.inputs.get('relationship_type','')}. "
        f"Core difficulty: {req.inputs.get('core_difficulty','')}. "
        f"Guide me through the Relationship Compass using Gita wisdom."
    )
    try:
        text = await call_kiaan_ai(msg, gita_verse=req.gita_verse,
                                   tool_name="Relationship Compass")
        return ChatResponse(response=text)
    except Exception as e:
        raise HTTPException(500, str(e))


# ── 7. KarmaLytix Weekly Analysis ────────────────────────────────────────
@router.post("/tools/karmalytix", response_model=ChatResponse)
async def karmalytix(req: ToolRequest, user_id: str = Depends(get_current_user)):
    msg = (
        f"Generate a weekly Sacred Mirror — metadata only, journal content is encrypted. "
        f"Mood pattern: {req.inputs.get('mood_pattern','')}. "
        f"Tags: {req.inputs.get('tags','')}. "
        f"Days journaled: {req.inputs.get('journaling_days','0')}/7. "
        f"Dharmic challenge: {req.inputs.get('dharmic_challenge','')}. "
        f"Pattern noticed: {req.inputs.get('pattern_noticed','')}. "
        f"Sankalpa: {req.inputs.get('sankalpa','')}. "
        f"Karma scores: {req.inputs.get('karma_dimensions','')}. "
        f"Generate: Mirror, Pattern, Gita Echo, Growth Edge, Blessing."
    )
    try:
        text = await call_kiaan_ai(msg, gita_verse=req.gita_verse,
                                   tool_name="KarmaLytix")
        return ChatResponse(response=text)
    except Exception as e:
        raise HTTPException(500, str(e))
