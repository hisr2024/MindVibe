"""Relationship Compass API - Dedicated endpoint for conflict guidance"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import os
from openai import OpenAI

router = APIRouter(prefix="/api/relationship-compass", tags=["relationship-compass"])

class RelationshipCompassRequest(BaseModel):
    conflict: str = Field(..., max_length=2000)

class RelationshipCompassResponse(BaseModel):
    guidance: str

client = None
ready = False
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key and openai_key != "your-api-key-here":
    try:
        client = OpenAI(api_key=openai_key)
        ready = True
    except Exception:
        pass

@router.post("/guide", response_model=RelationshipCompassResponse)
async def guide_conflict(request: RelationshipCompassRequest) -> RelationshipCompassResponse:
    """Provide neutral conflict guidance."""
    
    if not ready or not client:
        raise HTTPException(status_code=503, detail="Relationship Compass unavailable")
    
    system_prompt = """You are Relationship Compass: neutral, calm conflict guide.

8-step format:
1. Acknowledge conflict
2. Separate emotions from ego
3. Identify user's values
4. Right-action guidance
5. Ego-detachment suggestions
6. Compassion perspective
7. Non-reactive communication pattern
8. One controllable next step

Boundaries: No therapy, no side-taking, secular."""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.conflict}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return RelationshipCompassResponse(
            guidance=response.choices[0].message.content or ""
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Check if Relationship Compass service is available."""
    return {
        "status": "healthy" if ready else "degraded",
        "service": "Relationship Compass",
        "openai_configured": ready
    }
