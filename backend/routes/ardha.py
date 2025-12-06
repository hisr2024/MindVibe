"""Ardha (Cognitive Reframe) API - Dedicated endpoint for thought reframing"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import os
from openai import OpenAI

router = APIRouter(prefix="/api/ardha", tags=["ardha"])

class ArdhaRequest(BaseModel):
    thought: str = Field(..., max_length=2000)

class ArdhaResponse(BaseModel):
    reframe: str

client = None
ready = False
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key and openai_key != "your-api-key-here":
    try:
        client = OpenAI(api_key=openai_key)
        ready = True
    except Exception:
        pass

@router.post("/reframe", response_model=ArdhaResponse)
async def reframe_thought(request: ArdhaRequest) -> ArdhaResponse:
    """Cognitive reframing for self-critical thoughts."""
    
    if not ready or not client:
        raise HTTPException(status_code=503, detail="Ardha unavailable")
    
    system_prompt = """You are Ardha: gentle cognitive reframe assistant.

Pillars:
1. Acknowledge the thought without dismissing
2. Shift from absolute to balanced thinking
3. Evidence-based reframe
4. Compassionate self-talk

Tone: Kind, validating, brief (under 200 words)."""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.thought}
            ],
            temperature=0.7,
            max_tokens=400
        )
        
        return ArdhaResponse(reframe=response.choices[0].message.content or "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Check if Ardha service is available."""
    return {
        "status": "healthy" if ready else "degraded",
        "service": "Ardha",
        "openai_configured": ready
    }
