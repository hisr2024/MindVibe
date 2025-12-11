"""
Karma Reset KIAAN Integration API.

New endpoint for karma reset with enhanced KIAAN ecosystem integration.
This endpoint coexists with the original /api/karma-reset/generate and
provides additional KIAAN metadata and verse information.

**IMPORTANT**: This does NOT replace the existing karma reset endpoint.
Both endpoints work independently for maximum backward compatibility.
"""

import json
import logging
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.services.karma_reset_service import KarmaResetService

# Configure logging
logger = logging.getLogger(__name__)

# Create router with KIAAN-specific prefix
router = APIRouter(
    prefix="/api/karma-reset/kiaan",
    tags=["karma-reset", "kiaan-ecosystem"]
)

# ==================== REQUEST/RESPONSE MODELS ====================

class KarmaResetKiaanRequest(BaseModel):
    """Request model for KIAAN-enhanced karma reset."""
    
    situation: str = Field(
        default="",
        max_length=2000,
        description="What happened that needs karma reset"
    )
    feeling: str = Field(
        default="",
        max_length=500,
        description="Who felt the ripple effect"
    )
    repair_type: str = Field(
        default="apology",
        max_length=100,
        description="Type of repair action to take"
    )
    
    class Config:
        populate_by_name = True


class KiaanMetadata(BaseModel):
    """KIAAN ecosystem metadata."""
    
    verses_used: int = Field(description="Number of Gita verses used")
    verses: list[dict] = Field(description="Verse information")
    validation_passed: bool = Field(description="Whether validation passed")
    validation_score: float = Field(description="Validation score (0.0 to 1.0)")
    gita_terms_found: list[str] = Field(default_factory=list, description="Gita terms in response")
    wisdom_context: str = Field(default="", description="Wisdom context used")


class KarmaResetKiaanResponse(BaseModel):
    """Response model for KIAAN-enhanced karma reset."""
    
    reset_guidance: dict = Field(description="4-part reset guidance")
    kiaan_metadata: KiaanMetadata = Field(description="KIAAN ecosystem metadata")
    meta: Optional[dict] = Field(None, description="Request metadata")


# ==================== FALLBACK RESPONSES ====================

FALLBACK_GUIDANCE = {
    "apology": {
        "breathingLine": "Take four slow breaths. Let each exhale soften the moment.",
        "rippleSummary": "You experienced a moment that affected someone you care about.",
        "repairAction": "Offer a sincere apology that acknowledges the moment with genuine care.",
        "forwardIntention": "Move forward with intention to communicate with kindness."
    },
    "clarification": {
        "breathingLine": "Breathe deeply. Clear communication begins with inner calm.",
        "rippleSummary": "A misunderstanding created distance between you and another.",
        "repairAction": "Gently clarify your intention and invite understanding.",
        "forwardIntention": "Speak with clarity and compassion in future interactions."
    },
    "calm_followup": {
        "breathingLine": "Take a centering breath. Calm begins within.",
        "rippleSummary": "A tense moment left residue in your connection.",
        "repairAction": "Return with warmth and re-center the conversation.",
        "forwardIntention": "Practice responding with patience and presence."
    },
    "self-forgive": {
        "breathingLine": "Breathe in self-compassion. Breathe out self-judgment.",
        "rippleSummary": "You are holding yourself to impossible standards.",
        "repairAction": "Release self-blame and choose kindness toward yourself.",
        "forwardIntention": "Practice self-compassion as you would show others."
    }
}


def get_fallback_guidance(repair_type: str) -> dict:
    """Get fallback guidance for a repair type."""
    repair = repair_type.lower().replace("_", "-").replace(" ", "-")
    
    # Try exact match first
    if repair in FALLBACK_GUIDANCE:
        return FALLBACK_GUIDANCE[repair]
    
    # Try partial matches
    for key in FALLBACK_GUIDANCE.keys():
        if key in repair or repair in key:
            return FALLBACK_GUIDANCE[key]
    
    # Default to apology
    return FALLBACK_GUIDANCE["apology"]


# ==================== OPENAI CLIENT ====================

client = None
ready = False
openai_key = os.getenv("OPENAI_API_KEY")

if openai_key and openai_key != "your-api-key-here":
    try:
        client = OpenAI(api_key=openai_key)
        ready = True
        logger.info("Karma Reset KIAAN: OpenAI client initialized")
    except Exception as e:
        logger.error(f"Karma Reset KIAAN: Failed to initialize OpenAI: {str(e)}")
        ready = False
else:
    logger.warning("Karma Reset KIAAN: OPENAI_API_KEY not configured")


# ==================== KIAAN SERVICE ====================

karma_reset_service = KarmaResetService()


# ==================== ENDPOINTS ====================

@router.post("/generate", response_model=KarmaResetKiaanResponse)
async def generate_kiaan_karma_reset(
    request: KarmaResetKiaanRequest,
    db: AsyncSession = Depends(get_db)
) -> KarmaResetKiaanResponse:
    """
    Generate karma reset guidance with KIAAN ecosystem integration.
    
    This endpoint enhances karma reset with:
    - Relevant Bhagavad Gita verses
    - Wisdom-based validation
    - KIAAN ecosystem metadata
    
    **Note**: This is a new endpoint that coexists with /api/karma-reset/generate.
    The original endpoint continues to work unchanged.
    """
    request_id = str(uuid.uuid4())[:8]
    start_time = datetime.now()
    
    # Extract and normalize request data
    situation = request.situation or "A brief misstep"
    feeling = request.feeling or "Someone I care about"
    repair_type = request.repair_type or "apology"
    
    logger.info(
        f"[{request_id}] KIAAN Karma Reset request",
        extra={
            "request_id": request_id,
            "situation_length": len(situation),
            "repair_type": repair_type
        }
    )
    
    # Step 1: Get relevant Gita verses (read-only)
    try:
        verse_results = await karma_reset_service.get_reset_verses(
            db=db,
            repair_type=repair_type,
            situation=situation,
            limit=5
        )
        verses_used = len(verse_results)
        
        # Build wisdom context from verses
        wisdom_context = karma_reset_service.build_gita_context(
            verse_results=verse_results,
            repair_type=repair_type
        )
        
        logger.info(f"[{request_id}] Retrieved {verses_used} verses")
        
    except Exception as e:
        logger.error(f"[{request_id}] Error retrieving verses: {str(e)}")
        verse_results = []
        verses_used = 0
        wisdom_context = ""
    
    # Step 2: Generate guidance with OpenAI
    guidance_data = None
    
    if ready and client:
        try:
            # Build enhanced prompt with wisdom context
            system_prompt = f"""You are Karma Reset, a compassionate guide for healing relational harm, powered by KIAAN - an ancient wisdom engine.

User situation: "{situation}"
Who felt impact: "{feeling}"
Repair choice: "{repair_type}"

{wisdom_context}

Provide a 4-part karma reset ritual response in JSON format with these exact keys:
- breathingLine: 1-2 sentences for centering breath (20-40 seconds)
- rippleSummary: 1-2 sentences acknowledging the impact
- repairAction: 1-2 sentences guiding the {repair_type.lower()} action
- forwardIntention: 1-2 sentences for future intention

Tone: warm, grounded, secular, wisdom-based, non-judgmental. No therapy/medical advice.
Incorporate wisdom from the verses above naturally, without religious terminology.

Example format:
{{
  "breathingLine": "Take four slow breaths...",
  "rippleSummary": "Your words affected...",
  "repairAction": "Consider reaching out...",
  "forwardIntention": "Move forward with..."
}}
"""
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": "Generate the karma reset guidance in JSON format."
                    }
                ],
                temperature=0.7,
                max_tokens=600,
                response_format={"type": "json_object"}
            )
            
            guidance_text = response.choices[0].message.content or "{}"
            
            # Parse JSON response with specific error handling
            try:
                guidance_data = json.loads(guidance_text)
            except json.JSONDecodeError as parse_error:
                logger.error(f"[{request_id}] JSON parse error: {str(parse_error)}")
                guidance_data = None
            except ValueError as value_error:
                logger.error(f"[{request_id}] Invalid JSON value: {str(value_error)}")
                guidance_data = None
            
            # Validate required keys if parsing succeeded
            if guidance_data is not None:
                required_keys = [
                    "breathingLine",
                    "rippleSummary",
                    "repairAction",
                    "forwardIntention"
                ]
                if not all(key in guidance_data for key in required_keys):
                    logger.warning(f"[{request_id}] Missing keys, using fallback")
                    guidance_data = None
            
        except Exception as e:
            logger.error(f"[{request_id}] OpenAI error: {str(e)}")
            guidance_data = None
    
    # Use fallback if needed
    if guidance_data is None:
        logger.info(f"[{request_id}] Using fallback guidance")
        guidance_data = get_fallback_guidance(repair_type)
    
    # Step 3: Validate guidance against Gita wisdom
    validation_result = await karma_reset_service.validate_reset_guidance(
        guidance=guidance_data,
        verse_context=wisdom_context
    )
    
    # Step 4: Build KIAAN metadata
    verse_metadata = []
    for result in verse_results[:3]:  # Include top 3 verses
        verse = result.get("verse", {})
        verse_metadata.append({
            "verse_id": verse.get("verse_id", ""),
            "score": result.get("score", 0.0),
            "theme": verse.get("theme", ""),
            "sanitized_text": result.get("sanitized_text", "")[:100]  # Truncate
        })
    
    kiaan_metadata = KiaanMetadata(
        verses_used=verses_used,
        verses=verse_metadata,
        validation_passed=validation_result.get("valid", False),
        validation_score=validation_result.get("score", 0.0),
        gita_terms_found=validation_result.get("gita_terms_found", [])[:5],  # Top 5
        wisdom_context=wisdom_context[:200] if wisdom_context else ""  # Truncate
    )
    
    # Calculate elapsed time
    elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)
    
    logger.info(
        f"[{request_id}] KIAAN Karma Reset completed in {elapsed_ms}ms",
        extra={
            "verses_used": verses_used,
            "validation_passed": validation_result.get("valid", False)
        }
    )
    
    return KarmaResetKiaanResponse(
        reset_guidance=guidance_data,
        kiaan_metadata=kiaan_metadata,
        meta={
            "request_id": request_id,
            "processing_time_ms": elapsed_ms,
            "model_used": "gpt-4" if ready else "fallback",
            "kiaan_enhanced": True
        }
    )


@router.get("/health")
async def kiaan_health_check():
    """Health check endpoint for KIAAN karma reset integration."""
    return {
        "status": "healthy",
        "service": "karma-reset-kiaan",
        "openai_ready": ready,
        "version": "1.0.0"
    }


# ==================== JOURNEY RESET ENDPOINT ====================

class JourneyResetRequest(BaseModel):
    """Request model for journey reset with KIAAN guidance."""
    
    confirm: bool = Field(description="Confirmation to proceed with reset")
    reason: str = Field(
        default="Fresh start",
        max_length=500,
        description="Reason for journey reset"
    )


class JourneyResetResponse(BaseModel):
    """Response model for journey reset."""
    
    success: bool = Field(description="Whether reset was successful")
    message: str = Field(description="Human-readable message")
    kiaan_wisdom: dict = Field(description="KIAAN wisdom for fresh start")
    details: dict = Field(description="What was reset")
    timestamp: str = Field(description="When reset occurred")


@router.post("/journey-reset", response_model=JourneyResetResponse)
async def reset_user_journey(
    request: JourneyResetRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id)
) -> JourneyResetResponse:
    """
    Reset user's KIAAN journey data with wisdom-based fresh start guidance.
    
    This endpoint resets:
    - User emotional logs
    - Daily analysis records
    - Weekly reflections
    - Assessments
    - Journey progress tracking
    
    And generates KIAAN wisdom for a fresh start.
    
    Args:
        request: Reset confirmation and reason
        db: Database session
        user_id: Current user ID from auth
        
    Returns:
        JourneyResetResponse with KIAAN wisdom and reset details
        
    Raises:
        HTTPException: If reset fails or confirmation not provided
    """
    from sqlalchemy import delete, func, select, text
    from datetime import datetime
    
    request_id = str(uuid.uuid4())[:8]
    start_time = datetime.now()
    
    logger.info(
        f"[{request_id}] Journey reset requested by user {user_id}",
        extra={"user_id": user_id, "reason": request.reason}
    )
    
    # Require explicit confirmation
    if not request.confirm:
        raise HTTPException(
            status_code=400,
            detail="Journey reset confirmation required. Set 'confirm' to true."
        )
    
    reset_details = {
        "emotional_logs_deleted": 0,
        "daily_analyses_deleted": 0,
        "weekly_reflections_deleted": 0,
        "assessments_deleted": 0,
        "journey_progress_deleted": 0,
        "verses_bookmarked_deleted": 0
    }
    
    try:
        # Step 1: Count and delete records
        # Note: Using raw SQL with parametrized queries for tables not in ORM models
        # These tables are defined only in migrations, not in models.py
        # Parametrized queries (:user_id) prevent SQL injection
        logger.info(f"[{request_id}] Deleting user journey data...")
        
        # Delete emotional logs
        result = await db.execute(
            text("DELETE FROM user_emotional_logs WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["emotional_logs_deleted"] = result.rowcount
        
        # Delete daily analysis
        result = await db.execute(
            text("DELETE FROM user_daily_analysis WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["daily_analyses_deleted"] = result.rowcount
        
        # Delete weekly reflections
        result = await db.execute(
            text("DELETE FROM user_weekly_reflections WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["weekly_reflections_deleted"] = result.rowcount
        
        # Delete assessments
        result = await db.execute(
            text("DELETE FROM user_assessments WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["assessments_deleted"] = result.rowcount
        
        # Delete journey progress
        result = await db.execute(
            text("DELETE FROM user_journey_progress WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["journey_progress_deleted"] = result.rowcount
        
        # Delete bookmarked verses
        result = await db.execute(
            text("DELETE FROM user_verses_bookmarked WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["verses_bookmarked_deleted"] = result.rowcount
        
        # Commit deletions
        await db.commit()
        
        logger.info(
            f"[{request_id}] Journey data deleted successfully",
            extra=reset_details
        )
        
        # Step 2: Generate KIAAN wisdom for fresh start
        kiaan_wisdom = {}
        
        if ready and client:
            try:
                # Get verses about new beginnings
                verse_results = await karma_reset_service.get_reset_verses(
                    db=db,
                    repair_type="self-forgive",  # Self-compassion for fresh start
                    situation="Beginning anew with fresh perspective",
                    limit=3
                )
                
                wisdom_context = karma_reset_service.build_gita_context(
                    verse_results=verse_results,
                    repair_type="fresh_start"
                )
                
                # Generate fresh start wisdom
                prompt = f"""You are KIAAN, an ancient wisdom guide. A user has reset their journey to begin anew.

Reason: "{request.reason}"

{wisdom_context}

Provide encouraging wisdom for their fresh start in JSON format with these keys:
- breathingLine: 1-2 sentences for centering
- acknowledgment: Acknowledge their courage to begin anew
- wisdom: Ancient wisdom for new beginnings
- intention: Forward-looking intention setting

Tone: warm, encouraging, wisdom-based, non-judgmental.
"""
                
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": "Generate fresh start wisdom in JSON."}
                    ],
                    temperature=0.8,
                    max_tokens=500,
                    response_format={"type": "json_object"}
                )
                
                wisdom_text = response.choices[0].message.content or "{}"
                kiaan_wisdom = json.loads(wisdom_text)
                
            except Exception as e:
                logger.error(f"[{request_id}] Error generating KIAAN wisdom: {str(e)}")
                # Fallback wisdom
                kiaan_wisdom = {
                    "breathingLine": "Take a deep breath. This moment marks a fresh beginning.",
                    "acknowledgment": "You've chosen to begin anew. This takes courage and self-awareness.",
                    "wisdom": "Every ending holds the seed of a new beginning. Your journey continues with renewed clarity.",
                    "intention": "Move forward with openness, ready to embrace each moment with fresh eyes."
                }
        else:
            # Fallback when OpenAI not available
            kiaan_wisdom = {
                "breathingLine": "Take a deep breath. This moment marks a fresh beginning.",
                "acknowledgment": "You've chosen to begin anew. This takes courage and self-awareness.",
                "wisdom": "Every ending holds the seed of a new beginning. Your journey continues with renewed clarity.",
                "intention": "Move forward with openness, ready to embrace each moment with fresh eyes."
            }
        
        elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        logger.info(
            f"[{request_id}] Journey reset completed in {elapsed_ms}ms",
            extra={"total_deleted": sum(reset_details.values())}
        )
        
        return JourneyResetResponse(
            success=True,
            message="Your journey has been reset. Begin anew with KIAAN's wisdom.",
            kiaan_wisdom=kiaan_wisdom,
            details=reset_details,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        # Rollback on error
        await db.rollback()
        logger.error(
            f"[{request_id}] Journey reset failed: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Journey reset failed: {str(e)}"
        )
