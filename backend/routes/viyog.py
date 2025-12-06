"""Viyog (Detachment Coach) API - Dedicated endpoint for outcome anxiety reduction"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import os
from openai import OpenAI

router = APIRouter(prefix="/api/viyog", tags=["viyog"])

class ViyogRequest(BaseModel):
    concern: str = Field(..., max_length=2000)

class ViyogResponse(BaseModel):
    response: str

client = None
ready = False
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key and openai_key != "your-api-key-here":
    try:
        client = OpenAI(api_key=openai_key)
        ready = True
    except Exception:
        pass

@router.post("/detach", response_model=ViyogResponse)
async def generate_detachment(request: ViyogRequest) -> ViyogResponse:
    """Generate detachment guidance for outcome anxiety."""
    
    if not ready or not client:
        raise HTTPException(status_code=503, detail="Viyog unavailable")
    
    system_prompt = """You are Viyog, the Detachment Coach.
Role: Help users reduce outcome anxiety by shifting from result-focus to action-focus.
Tone: Calm, concise, secular, validating.

Format (always):
1. Validate the anxiety
2. Acknowledge attachment to results
3. Detachment principle (secular)
4. One clear, controllable action

Keep it under 250 words."""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.concern}
            ],
            temperature=0.7,
            max_tokens=400
        )
        
        return ViyogResponse(response=response.choices[0].message.content or "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Check if Viyog service is available."""
    return {
        "status": "healthy" if ready else "degraded",
        "service": "Viyog",
        "openai_configured": ready
    }
