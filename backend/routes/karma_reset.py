"""Karma Reset API - Production-ready endpoint with comprehensive error handling"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, Integer, Boolean, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from typing import Optional
import os
import json
import uuid
import logging
from openai import OpenAI

from backend.deps import get_db

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/karma-reset", tags=["karma-reset"])

# ==================== REQUEST/RESPONSE MODELS ====================

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
    _meta: Optional[dict] = None

# ==================== FALLBACK RESPONSES ====================

FALLBACK_GUIDANCE = {
    "apologize": {
        "breathingLine": "Take four slow breaths. Let each exhale soften the moment.",
        "rippleSummary": "You experienced a moment that affected someone you care about.",
        "repairAction": "Offer a sincere apology that acknowledges the moment with genuine care.",
        "forwardIntention": "Move forward with intention to communicate with kindness."
    },
    "clarify": {
        "breathingLine": "Breathe deeply. Clear communication begins with inner calm.",
        "rippleSummary": "A misunderstanding created distance between you and another.",
        "repairAction": "Gently clarify your intention and invite understanding.",
        "forwardIntention": "Speak with clarity and compassion in future interactions."
    },
    "self-forgive": {
        "breathingLine": "Breathe in self-compassion. Breathe out self-judgment.",
        "rippleSummary": "You are holding yourself to impossible standards.",
        "repairAction": "Release self-blame and choose kindness toward yourself.",
        "forwardIntention": "Practice self-compassion as you would show others."
    }
}

def get_fallback_guidance(repair_type: str) -> dict:
    """Return fallback guidance if OpenAI fails"""
    repair = repair_type.lower().replace("_", "-").replace(" ", "-")
    if repair in FALLBACK_GUIDANCE:
        return FALLBACK_GUIDANCE[repair]
    return FALLBACK_GUIDANCE["apologize"]

# ==================== OPENAI CLIENT ====================

client = None
ready = False
openai_key = os.getenv("OPENAI_API_KEY")

if openai_key and openai_key != "your-api-key-here":
    try:
        client = OpenAI(api_key=openai_key)
        ready = True
        logger.info("Karma Reset: OpenAI client initialized successfully")
    except Exception as e:
        logger.error(f"Karma Reset: Failed to initialize OpenAI client: {str(e)}")
        ready = False
else:
    logger.warning("Karma Reset: OPENAI_API_KEY not configured")

# ==================== ENDPOINTS ====================

@router.post("/generate", response_model=KarmaResetResponse)
async def generate_karma_reset(
    request: KarmaResetRequest
) -> KarmaResetResponse:
    """Generate karma reset guidance based on situation and repair choice."""
    
    request_id = str(uuid.uuid4())[:8]
    start_time = datetime.now()
    
    # Extract request data
    situation = request.situation or request.whatHappened or "A brief misstep"
    feeling = request.feeling or request.whoFeltRipple or "Someone I care about"
    repair = request.repair or request.repairType or "Apologize"
    
    logger.info(f"[{request_id}] Karma Reset request started", extra={
        "request_id": request_id,
        "situation_length": len(situation),
        "repair_type": repair
    })
    
    # If OpenAI not available, use fallback immediately
    if not ready or not client:
        logger.warning(f"[{request_id}] Using fallback response (OpenAI unavailable)")
        
        elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return KarmaResetResponse(
            reset_guidance=get_fallback_guidance(repair),
            _meta={
                "request_id": request_id,
                "processing_time_ms": elapsed_ms,
                "fallback_used": True
            }
        )
    
    # Build prompt for OpenAI
    system_prompt = f"""You are Karma Reset, a compassionate guide for healing relational harm.

User situation: "{situation}"
Who felt impact: "{feeling}"
Repair choice: "{repair}"

Provide a 4-part karma reset ritual response in JSON format with these exact keys:
- breathingLine: 1-2 sentences for centering breath (20-40 seconds)
- rippleSummary: 1-2 sentences acknowledging the impact
- repairAction: 1-2 sentences guiding the {repair.lower()} action
- forwardIntention: 1-2 sentences for future intention

Tone: warm, grounded, secular, non-judgmental. No therapy/medical advice.

Example format:
{{
  "breathingLine": "Take four slow breaths...",
  "rippleSummary": "Your words affected...",
  "repairAction": "Consider reaching out...",
  "forwardIntention": "Move forward with..."
}}
"""
    
    try:
        # Call OpenAI with structured output
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate the karma reset guidance in JSON format with the 4 keys: breathingLine, rippleSummary, repairAction, forwardIntention."}
            ],
            temperature=0.7,
            max_tokens=600,
            response_format={"type": "json_object"}
        )
        
        guidance_text = response.choices[0].message.content or "{}"
        
        # Parse JSON response
        try:
            guidance_data = json.loads(guidance_text)
            
            # Validate all required keys exist
            required_keys = ["breathingLine", "rippleSummary", "repairAction", "forwardIntention"]
            if not all(key in guidance_data for key in required_keys):
                logger.warning(f"[{request_id}] Missing keys in OpenAI response, using fallback")
                guidance_data = get_fallback_guidance(repair)
            
            # Validate values are non-empty
            if not all(len(str(guidance_data.get(key, ""))) > 5 for key in required_keys):
                logger.warning(f"[{request_id}] Empty values in OpenAI response, using fallback")
                guidance_data = get_fallback_guidance(repair)
                
        except json.JSONDecodeError as parse_error:
            logger.error(f"[{request_id}] JSON parse error: {str(parse_error)}, using fallback")
            guidance_data = get_fallback_guidance(repair)
        
        elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        logger.info(f"[{request_id}] Karma Reset completed successfully in {elapsed_ms}ms")
        
        return KarmaResetResponse(
            reset_guidance=guidance_data,
            _meta={
                "request_id": request_id,
                "processing_time_ms": elapsed_ms,
                "model_used": "gpt-4"
            }
        )
        
    except Exception as e:
        elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        logger.error(f"[{request_id}] OpenAI error: {str(e)}, using fallback", exc_info=True)
        
        # Return fallback instead of failing
        return KarmaResetResponse(
            reset_guidance=get_fallback_guidance(repair),
            _meta={
                "request_id": request_id,
                "processing_time_ms": elapsed_ms,
                "fallback_used": True,
                "error": str(e)
            }
        )

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Comprehensive health check with diagnostics"""
    health = {
        "status": "healthy",
        "service": "Karma Reset",
        "checks": {
            "openai_configured": False,
            "openai_key_valid": False,
            "database_connected": False
        },
        "errors": []
    }
    
    # Check OpenAI configuration
    if openai_key and openai_key != "your-api-key-here":
        health["checks"]["openai_configured"] = True
        
        # Test API key validity
        if client:
            try:
                test_response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": "test"}],
                    max_tokens=5
                )
                health["checks"]["openai_key_valid"] = True
            except Exception as e:
                health["errors"].append(f"OpenAI API error: {str(e)}")
                health["status"] = "degraded"
        else:
            health["errors"].append("OpenAI client not initialized")
            health["status"] = "degraded"
    else:
        health["errors"].append("OPENAI_API_KEY not configured")
        health["status"] = "degraded"
    
    # Check database connectivity
    try:
        await db.execute(text("SELECT 1"))
        health["checks"]["database_connected"] = True
    except Exception as e:
        health["errors"].append(f"Database error: {str(e)}")
        health["status"] = "degraded"
    
    return health
