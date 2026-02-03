"""Karma Reset API - Production-ready endpoint with comprehensive error handling.

ENHANCED VERSION v2.0 - Integrated with KIAAN AI Gita Core Wisdom Filter

ALL RESPONSES PASS THROUGH GITA CORE WISDOM:
Every response from this endpoint is filtered through the GitaWisdomFilter
to ensure guidance is grounded in Bhagavad Gita teachings on karma and healing.

Gita Principles Applied:
- Karma (action and its consequences)
- Kshama (forgiveness as liberation)
- Pratyavekshanam (self-reflection)
- Dharma (righteous action)
- Prayaschitta (atonement/repair)
"""

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

# Gita Wisdom Filter for ensuring responses are grounded in Gita teachings
_gita_filter = None


def _get_gita_filter():
    """Lazy import of Gita wisdom filter."""
    global _gita_filter
    if _gita_filter is None:
        try:
            from backend.services.gita_wisdom_filter import get_gita_wisdom_filter
            _gita_filter = get_gita_wisdom_filter()
            logger.info("Karma Reset: Gita Wisdom Filter integrated")
        except Exception as e:
            logger.warning(f"Karma Reset: Gita Wisdom Filter unavailable: {e}")
            _gita_filter = False
    return _gita_filter if _gita_filter else None

router = APIRouter(prefix="/api/karma-reset", tags=["karma-reset"])

# ==================== REQUEST/RESPONSE MODELS ====================

class KarmaResetRequest(BaseModel):
    """Request model for Karma Reset guidance."""
    model_config = {"populate_by_name": True}

    # Support both naming conventions from frontend
    situation: str = Field(default="", max_length=2000, description="What happened")
    feeling: str = Field(default="", max_length=500, description="Who felt the ripple")
    repair: str = Field(default="", max_length=100, description="Repair choice")

    # Alternative field names (frontend sends both)
    whatHappened: str = Field(default="", max_length=2000, alias="what_happened")
    whoFeltRipple: str = Field(default="", max_length=500, alias="who_felt_it")
    repairType: str = Field(default="", max_length=100, alias="repair_type")

class KarmaResetResponse(BaseModel):
    reset_guidance: dict
    _meta: Optional[dict] = None

# ==================== GITA-GROUNDED FALLBACK RESPONSES ====================

# Fallback responses grounded in Bhagavad Gita wisdom on karma and healing
FALLBACK_GUIDANCE = {
    "apologize": {
        "breathingLine": "Take four slow breaths. As BG 6.35 teaches, the restless mind can be calmed through practice. Let each exhale soften the moment.",
        "rippleSummary": "You experienced a moment that affected someone you care about. The Gita reminds us that our actions create ripples - this awareness itself is the beginning of wisdom.",
        "repairAction": "Offer a sincere apology that acknowledges the moment with genuine care. As the Gita teaches about dharma, speak with truth (satya) and compassion (daya).",
        "forwardIntention": "Move forward with intention to communicate with kindness. Let your future actions reflect the wisdom gained from this experience.",
        "gitaWisdom": "BG 18.66 teaches us to release the burden of past actions while committing to dharmic action going forward."
    },
    "clarify": {
        "breathingLine": "Breathe deeply. Clear communication begins with inner calm. As BG 2.48 teaches, equanimity is the foundation of wise action.",
        "rippleSummary": "A misunderstanding created distance between you and another. The Gita teaches that moha (confusion) clouds our buddhi (wisdom), but clarity is always accessible.",
        "repairAction": "Gently clarify your intention and invite understanding. Speak with priya vachana (kind speech) as the Gita recommends - truth delivered with compassion.",
        "forwardIntention": "Speak with clarity and compassion in future interactions. Let sama-darshana (equal vision) guide how you see yourself and others.",
        "gitaWisdom": "BG 17.15 teaches: Speech should be truthful, pleasing, beneficial, and not agitating to others."
    },
    "self-forgive": {
        "breathingLine": "Breathe in self-compassion. Breathe out self-judgment. As BG 6.5 teaches, you can be your own greatest ally - choose to befriend yourself.",
        "rippleSummary": "You are holding yourself to impossible standards. The Gita teaches kshama (forgiveness) - including forgiveness toward yourself. This is not weakness but wisdom.",
        "repairAction": "Release self-blame and choose kindness toward yourself. The Gita reminds us that the atman (true self) remains untouched by past actions - you can always begin anew.",
        "forwardIntention": "Practice self-compassion as you would show others. Let your inner peace radiate into your actions, as the sthitaprajna (person of steady wisdom) does.",
        "gitaWisdom": "BG 4.36-37 teaches: Even if you are the most sinful of all sinners, you will cross over all misfortune by the boat of knowledge."
    }
}


def get_fallback_guidance(repair_type: str) -> dict:
    """Return Gita-grounded fallback guidance if OpenAI fails."""
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
    
    # Build prompt for OpenAI with Gita Wisdom Context
    system_prompt = f"""You are Karma Reset, a compassionate guide for healing relational harm, grounded in Bhagavad Gita wisdom.

GITA WISDOM CONTEXT:
The Bhagavad Gita teaches profound principles about karma (action), kshama (forgiveness), and dharma (righteous conduct):
- BG 18.66: "Abandon all varieties of dharmas and surrender unto Me alone. I shall deliver you from all sinful reactions. Do not fear."
- BG 4.36-37: "Even if you are the most sinful of all sinners, you will cross over all misfortune by the boat of knowledge."
- BG 6.5: "One must elevate, not degrade oneself by one's own mind. The mind is the friend of the conditioned soul, and his enemy as well."
- BG 17.15: "Speech should be truthful, pleasing, beneficial, and not agitating to others."
- BG 2.48: "Perform action, O Arjuna, being steadfast in yoga, abandoning attachment and balanced in success and failure."

User situation: "{situation}"
Who felt impact: "{feeling}"
Repair choice: "{repair}"

Provide a 4-part karma reset ritual response in JSON format with these exact keys:
- breathingLine: 1-2 sentences for centering breath, subtly infused with Gita wisdom (20-40 seconds)
- rippleSummary: 1-2 sentences acknowledging the impact through the lens of karma and awareness
- repairAction: 1-2 sentences guiding the {repair.lower()} action with dharmic principles
- forwardIntention: 1-2 sentences for future intention grounded in Gita wisdom

Tone: warm, grounded, secular-friendly (use Gita concepts naturally without heavy religious language), non-judgmental. No therapy/medical advice.

Example format:
{{
  "breathingLine": "Take four slow breaths. As ancient wisdom teaches, the restless mind finds peace through practice...",
  "rippleSummary": "Your words created a ripple that affected someone you care about...",
  "repairAction": "Consider reaching out with truth and compassion...",
  "forwardIntention": "Move forward with intention to act from your highest self..."
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
        
        # Safe null check for OpenAI response
        guidance_text = "{}"
        if response and response.choices and len(response.choices) > 0:
            response_msg = response.choices[0].message
            if response_msg and response_msg.content:
                guidance_text = response_msg.content

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

        # GITA WISDOM FILTER: Apply filter to each text field
        gita_filter = _get_gita_filter()
        gita_filter_applied = False
        gita_wisdom_score = 0.0

        if gita_filter:
            try:
                import asyncio

                # Filter each text field through Gita wisdom
                for key in ["breathingLine", "rippleSummary", "repairAction", "forwardIntention"]:
                    if key in guidance_data and guidance_data[key]:
                        filter_result = await gita_filter.filter_response(
                            content=guidance_data[key],
                            tool_type="karma_reset",
                            user_context=situation,
                            enhance_if_needed=True,
                        )
                        guidance_data[key] = filter_result.content
                        gita_wisdom_score = max(gita_wisdom_score, filter_result.wisdom_score)

                gita_filter_applied = True
                logger.info(f"[{request_id}] Gita filter applied, wisdom_score={gita_wisdom_score:.2f}")

            except Exception as filter_error:
                logger.warning(f"[{request_id}] Gita filter error (continuing): {filter_error}")

        elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        logger.info(f"[{request_id}] Karma Reset completed successfully in {elapsed_ms}ms")

        return KarmaResetResponse(
            reset_guidance=guidance_data,
            _meta={
                "request_id": request_id,
                "processing_time_ms": elapsed_ms,
                "model_used": "gpt-4",
                "gita_filter_applied": gita_filter_applied,
                "gita_wisdom_score": gita_wisdom_score,
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
