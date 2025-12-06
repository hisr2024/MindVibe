"""Karma Reset API - Dedicated endpoint for karma reset guidance"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import os
from openai import OpenAI

from backend.deps import get_db

router = APIRouter(prefix="/api/karma-reset", tags=["karma-reset"])

class KarmaResetRequest(BaseModel):
    # Support both naming conventions from frontend
    situation: str = Field(default="", max_length=2000, description="What happened")
    feeling: str = Field(default="", max_length=500, description="Who felt the ripple")
    repair: str = Field(default="", max_length=100, description="Repair choice")
    
    # Alternative field names (frontend sends both)
    whatHappened: str = Field(default="", max_length=2000, alias="what_happened")
    whoFeltRipple: str = Field(default="", max_length=500, alias="who_felt_it")
    repairType: str = Field(default="", max_length=100, alias="repair_type")
    
    class Config:
        populate_by_name = True

class KarmaResetResponse(BaseModel):
    reset_guidance: dict

# Initialize OpenAI client
client = None
ready = False
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key and openai_key != "your-api-key-here":
    try:
        client = OpenAI(api_key=openai_key)
        ready = True
    except Exception:
        pass

@router.post("/generate", response_model=KarmaResetResponse)
async def generate_karma_reset(
    request: KarmaResetRequest
    # db: AsyncSession = Depends(get_db)  # Reserved for future database logging
) -> KarmaResetResponse:
    """Generate karma reset guidance based on situation and repair choice."""
    
    if not ready or not client:
        raise HTTPException(
            status_code=503,
            detail="Karma Reset service unavailable. API key not configured."
        )
    
    # Use whichever field was provided
    situation = request.situation or request.whatHappened or "A brief misstep"
    feeling = request.feeling or request.whoFeltRipple or "Someone I care about"
    repair = request.repair or request.repairType or "Apologize"
    
    # Build context-aware prompt
    system_prompt = f"""You are Karma Reset, a compassionate guide for healing relational harm.

User situation: "{situation}"
Who felt impact: "{feeling}"
Repair choice: "{repair}"

Your role:
- Provide a 4-part karma reset ritual (Pause, Ripple, Repair, Intention)
- Each part: 20-40 seconds of guided reflection
- Tone: warm, grounded, secular, non-judgmental
- No therapy/medical advice, just guided reflection

Repair meanings:
- Apologize: Take responsibility for tone or action
- Clarify: Address misunderstanding with honesty
- Self-Forgive: Release self-blame while learning

Format your response as:
1. **Pause** (breathe and center)
2. **Ripple** (acknowledge the impact)
3. **Repair** (guided {repair.lower()} action)
4. **Intention** (reset for future)

End with a short mantra for moving forward.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Guide me through the karma reset ritual in 4 parts: breathing, ripple, repair, and intention. Keep each part to 1-2 sentences."}
            ],
            temperature=0.7,
            max_tokens=600
        )
        
        guidance_text = response.choices[0].message.content or ""
        
        # Helper function to extract content after a header
        def extract_section_content(lines, keywords, start_markers):
            """Extract content after finding a section header."""
            for i, line in enumerate(lines):
                lower_line = line.lower()
                # Check if this line contains any of the keywords or starts with a marker
                if any(kw in lower_line for kw in keywords) or any(line.startswith(m) for m in start_markers):
                    # Return the next non-header line as content
                    next_line = lines[i+1] if i+1 < len(lines) else line
                    if not any(next_line.startswith(m) for m in ['1.', '2.', '3.', '4.', '**']):
                        return next_line
                    return line.replace('**', '').strip()
            return ""
        
        # Parse the response into structured parts
        lines = [line.strip() for line in guidance_text.split('\n') if line.strip()]
        
        breathing_line = extract_section_content(lines, ['pause', 'breathe'], ['1.'])
        ripple_summary = extract_section_content(lines, ['ripple'], ['2.'])
        repair_action = extract_section_content(lines, ['repair'], ['3.'])
        forward_intention = extract_section_content(lines, ['intention'], ['4.'])
        
        # Fallback: if parsing failed, use generic text
        if not breathing_line:
            breathing_line = "Take four slow breaths; let each exhale soften the moment."
        if not ripple_summary:
            ripple_summary = f"Acknowledge how your actions affected {feeling}."
        if not repair_action:
            repair_action = f"Consider how to {repair.lower()} with genuine intention."
        if not forward_intention:
            forward_intention = "Set an intention to move forward with awareness and care."
        
        return KarmaResetResponse(
            reset_guidance={
                "breathingLine": breathing_line,
                "rippleSummary": ripple_summary,
                "repairAction": repair_action,
                "forwardIntention": forward_intention
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate karma reset: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Check if Karma Reset service is available."""
    return {
        "status": "healthy" if ready else "degraded",
        "service": "Karma Reset",
        "openai_configured": ready
    }
