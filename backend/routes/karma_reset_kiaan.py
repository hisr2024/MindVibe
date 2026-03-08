"""
Karma Reset KIAAN Integration API - Deep Karmic Transformation.

This module provides the API endpoints for deep karma reset, strictly
grounded in Bhagavad Gita wisdom. It replaces the superficial 4-step
guidance with a comprehensive 7-phase karmic transformation powered by
10 Gita-aligned karmic paths.

Endpoints:
- POST /api/karma-reset/kiaan/generate    - Deep karma reset generation
- GET  /api/karma-reset/kiaan/health      - Health check
- GET  /api/karma-reset/kiaan/paths       - Available karmic paths
- POST /api/karma-reset/kiaan/journey-reset - Reset user journey data

The Gita teaches (BG 18.66): "Abandon all dharmas and take refuge in Me alone.
I shall liberate you from all sins; do not grieve."
"""

import json
import logging
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from openai import AsyncOpenAI  # noqa: F401 - used at module level
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user_optional
from backend.services.karma_reset_service import KarmaResetService
from backend.services.gita_karma_wisdom import (
    KARMIC_PATHS,
    SEVEN_PHASES,
    KARMA_RESET_CORE_VERSES,
    GUNA_ANALYSIS,
)

# Configure logging
logger = logging.getLogger(__name__)

# Create router with KIAAN-specific prefix
router = APIRouter(
    prefix="/api/karma-reset/kiaan",
    tags=["karma-reset", "kiaan-ecosystem"]
)

# ==================== REQUEST/RESPONSE MODELS ====================

class KarmaResetKiaanRequest(BaseModel):
    """Request model for deep KIAAN karma reset."""
    model_config = {"populate_by_name": True}

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
        default="kshama",
        max_length=100,
        description="Karmic path key (e.g., kshama, satya, shanti) or legacy type (apology, clarification)"
    )
    # Problem analysis context — enriches the 7-phase guidance
    problem_category: str = Field(
        default="",
        max_length=100,
        description="Life problem category (e.g., relationship_conflict, anxiety_health)"
    )
    problem_id: str = Field(
        default="",
        max_length=100,
        description="Specific problem template ID (e.g., hurt_partner)"
    )
    shad_ripu: str = Field(
        default="",
        max_length=32,
        description="Identified inner enemy (kama, krodha, lobha, moha, mada, matsarya)"
    )
    healing_insight: str = Field(
        default="",
        max_length=1000,
        description="Gita-grounded healing insight for this problem"
    )


class CoreVerseData(BaseModel):
    """Core Gita verse with full Sanskrit and translation."""

    chapter: int = Field(description="Gita chapter number")
    verse: int = Field(description="Verse number within chapter")
    sanskrit: str = Field(description="Original Sanskrit (Devanagari)")
    transliteration: str = Field(default="", description="IAST transliteration")
    english: str = Field(description="English translation")
    hindi: str = Field(default="", description="Hindi translation")


class KarmicPathData(BaseModel):
    """Resolved karmic path information."""

    key: str = Field(description="Path identifier key")
    name: str = Field(description="Full path name with Sanskrit")
    sanskrit_name: str = Field(description="Sanskrit name in Devanagari")
    description: str = Field(description="Path description")
    gita_principle: str = Field(description="Core Gita principle behind this path")
    karmic_teaching: str = Field(description="Deep karmic teaching explaining the wisdom")
    guna_analysis: str = Field(description="Analysis of which guna drives the harmful action")
    themes: list[str] = Field(default_factory=list, description="Thematic keywords")


class PhaseGuidance(BaseModel):
    """Guidance for a single phase of the 7-phase karma reset."""

    phase: int = Field(description="Phase number (1-7)")
    name: str = Field(description="Sanskrit phase name")
    sanskrit_name: str = Field(description="Sanskrit name in Devanagari")
    english_name: str = Field(description="English phase name")
    icon: str = Field(description="Icon identifier")
    guidance: str = Field(description="Personalized guidance for this phase")


class DeepResetGuidance(BaseModel):
    """Complete 7-phase deep karma reset guidance."""

    phases: list[PhaseGuidance] = Field(description="7-phase personalized guidance")
    sadhana: list[str] = Field(description="Daily practices for sustained karmic repair")
    core_verse: CoreVerseData = Field(description="Primary Gita verse for this path")
    supporting_verses: list[dict] = Field(
        default_factory=list,
        description="Supporting verses with key teachings"
    )


class KiaanMetadata(BaseModel):
    """KIAAN ecosystem metadata with Five Pillar compliance."""

    verses_used: int = Field(description="Number of Gita verses used")
    verses: list[dict] = Field(description="Verse information for display")
    validation_passed: bool = Field(description="Whether validation passed")
    validation_score: float = Field(description="Overall validation score (0.0 to 1.0)")
    five_pillar_score: float = Field(default=0.0, description="Five Pillar compliance score")
    compliance_level: str = Field(default="", description="Compliance level (e.g., '8/10')")
    pillars_met: int = Field(default=0, description="Number of pillars met (out of 5)")
    gita_terms_found: list[str] = Field(
        default_factory=list, description="Gita terms found in response"
    )
    wisdom_context: str = Field(default="", description="Wisdom context summary")


class KarmaResetKiaanResponse(BaseModel):
    """Response model for deep KIAAN karma reset."""

    karmic_path: KarmicPathData = Field(description="Resolved karmic path data")
    deep_guidance: DeepResetGuidance = Field(description="7-phase deep guidance")
    reset_guidance: dict = Field(description="Legacy 4-part guidance for backward compat")
    kiaan_metadata: KiaanMetadata = Field(description="KIAAN ecosystem metadata")
    meta: Optional[dict] = Field(None, description="Request metadata")


# ==================== DEEP FALLBACK RESPONSES ====================

def get_deep_fallback_guidance(
    karmic_path: dict,
    situation: str = "",
    feeling: str = "",
    shad_ripu: str = "",
    healing_insight: str = "",
    problem_category: str = "",
) -> dict:
    """
    Generate deep fallback guidance from static Gita wisdom when AI is unavailable.

    Uses the karmic path's pre-mapped teachings, verses, and sadhana to provide
    meaningful guidance personalized to the user's specific problem.

    Args:
        karmic_path: Full karmic path data from KARMIC_PATHS
        situation: User's description of their problem
        feeling: Who was affected
        shad_ripu: Identified inner enemy driving the problem
        healing_insight: Gita-based healing insight for the problem
        problem_category: Life problem category

    Returns:
        Complete guidance dictionary with 7 personalized phases and sadhana
    """
    path_name = karmic_path.get("name", "The Path of Wisdom")
    core_verse = karmic_path.get("core_verse", {})
    teaching = karmic_path.get("karmic_teaching", "")
    sadhana = karmic_path.get("sadhana", [])
    guna = karmic_path.get("guna_analysis", "")

    # Build situation-aware phrases
    situation_short = situation[:120] if situation else "this karmic moment"
    feeling_text = feeling if feeling else "those around you"

    # Map shad_ripu to human-readable descriptions for weaving into guidance
    shad_ripu_descriptions = {
        "kama": "desire and attachment (kama) — the craving that blinds the wise",
        "krodha": "anger (krodha) — the fire that the Gita calls the gate to self-destruction",
        "lobha": "greed and grasping (lobha) — the hunger that can never be satisfied",
        "moha": "delusion and attachment (moha) — the veil that obscures your true nature",
        "mada": "ego and pride (mada) — the false self that mistakes itself for the atman",
        "matsarya": "envy and jealousy (matsarya) — the poison of comparison that steals peace",
    }
    enemy_desc = shad_ripu_descriptions.get(shad_ripu, "the restless gunas of prakriti")
    enemy_name = shad_ripu.title() if shad_ripu else "Rajas"

    # Build 7-phase guidance from static wisdom, personalized to the problem
    phases = []
    phase_defs = SEVEN_PHASES

    # Phase 1: Sthiti Pariksha (Witness Awareness) — Name their problem
    phases.append({
        "phase": 1,
        "name": phase_defs[0]["name"],
        "sanskrit_name": phase_defs[0]["sanskrit_name"],
        "english_name": phase_defs[0]["english_name"],
        "icon": phase_defs[0]["icon"],
        "guidance": (
            f"Close your eyes and breathe. You came here carrying the weight of {situation_short}. "
            f"Step back now and become the sakshi — the witness. You are not this pain. You are not this situation. "
            f"You are the eternal awareness observing all of it. The Gita teaches (BG 13.22): the Supreme Self "
            f"in the body is the witness, the consenter, the sustainer. From this witnessing place, "
            f"your problem looks different — it becomes something you are experiencing, not something you ARE."
        ),
    })

    # Phase 2: Karma Darshan (Karmic Insight) — Diagnose the inner enemy
    phases.append({
        "phase": 2,
        "name": phase_defs[1]["name"],
        "sanskrit_name": phase_defs[1]["sanskrit_name"],
        "english_name": phase_defs[1]["english_name"],
        "icon": phase_defs[1]["icon"],
        "guidance": (
            f"Now see the karmic pattern clearly. Your situation — {situation_short} — "
            f"has its root in {enemy_desc}. {guna} "
            f"The Gita teaches (BG 3.27): all actions are performed by the gunas of prakriti — "
            f"the self, deluded by ego, thinks 'I am the doer.' {enemy_name} acted through you, "
            f"but it is not you. Seeing this clearly is the first step to freedom. "
            f"You are not the doer — but you can choose to transform the instrument."
        ),
    })

    # Phase 3: Pranayama Shuddhi (Sacred Breath) — Targeted to their emotional state
    breath_context = {
        "krodha": "With each exhale, release the fire of anger. Let the cool breath dissolve the heat that burns both you and others.",
        "moha": "With each exhale, release the fog of confusion. Let clarity flow in with each inhale, dissolving the veil of attachment.",
        "kama": "With each exhale, release the grip of craving. Let contentment fill the space where desire once consumed you.",
        "lobha": "With each exhale, release the grasping. Let your hands and heart open, trusting that what is yours will come.",
        "mada": "With each exhale, release the weight of ego. Let humility soften the hardened shell of pride.",
        "matsarya": "With each exhale, release the poison of comparison. Let gratitude for your unique path fill each inhale.",
    }
    breath_line = breath_context.get(shad_ripu, "With each exhale, release the agitated energy that clouds your vision.")
    phases.append({
        "phase": 3,
        "name": phase_defs[2]["name"],
        "sanskrit_name": phase_defs[2]["sanskrit_name"],
        "english_name": phase_defs[2]["english_name"],
        "icon": phase_defs[2]["icon"],
        "guidance": (
            f"Take seven deep breaths using the 4-7-8 pattern: inhale for 4 counts, hold for 7, exhale for 8. "
            f"{breath_line} "
            f"The Gita teaches (BG 4.29): some offer the outgoing breath into the incoming, restraining both — "
            f"this sacred breath purification calms the storm within and creates the clarity needed to face "
            f"your situation with wisdom rather than reactivity."
        ),
    })

    # Phase 4: Pashchataap (Deep Acknowledgment) — Specific to their ripple
    phases.append({
        "phase": 4,
        "name": phase_defs[3]["name"],
        "sanskrit_name": phase_defs[3]["sanskrit_name"],
        "english_name": phase_defs[3]["english_name"],
        "icon": phase_defs[3]["icon"],
        "guidance": (
            f"Now acknowledge the full reality with dharmic clarity — not guilt, which is tamasic and leads to paralysis, "
            f"but honest recognition. Your situation affected {feeling_text}. The ripple it created is real. "
            f"See it fully. Name it honestly. The Gita praises the courage of truthful self-assessment. "
            f"This is not self-punishment — this is the sacred act of seeing clearly, "
            f"which is the only foundation upon which genuine transformation can be built."
        ),
    })

    # Phase 5: Prayaschitta (Sacred Repair) — THE SOLUTION, specific to path + problem
    repair_teaching = teaching[:400] if teaching else "The path of dharmic action transforms suffering into wisdom."
    healing_line = f" {healing_insight}" if healing_insight else ""
    phases.append({
        "phase": 5,
        "name": phase_defs[4]["name"],
        "sanskrit_name": phase_defs[4]["sanskrit_name"],
        "english_name": phase_defs[4]["english_name"],
        "icon": phase_defs[4]["icon"],
        "guidance": (
            f"Here is where your transformation takes concrete form through {path_name}. "
            f"{repair_teaching}{healing_line} "
            f"The Gita teaches (BG 2.47): your right is to the action alone, never to its fruits. "
            f"Perform this repair as nishkama karma — sacred, desireless action. "
            f"Do it because it is dharma, not because you seek relief from guilt or a specific outcome. "
            f"The repair itself is the offering. Let it flow from your highest self."
        ),
    })

    # Phase 6: Sankalpa (Sacred Intention) — Transform the pattern, not just the incident
    phases.append({
        "phase": 6,
        "name": phase_defs[5]["name"],
        "sanskrit_name": phase_defs[5]["sanskrit_name"],
        "english_name": phase_defs[5]["english_name"],
        "icon": phase_defs[5]["icon"],
        "guidance": (
            f"Set your sankalpa — your sacred intention — not just for this situation, but to transform "
            f"your relationship with {enemy_desc} itself. The Gita teaches (BG 6.5): 'Let one lift oneself "
            f"by one's own Self; let not one degrade oneself.' Your sankalpa is: 'When {enemy_name} arises "
            f"in me again, I will recognize it as the guna acting, not as my true self. I choose the path of "
            f"{path_name} as my dharmic response.' Commit to the daily sadhana below — this is how you "
            f"sustain the transformation beyond today."
        ),
    })

    # Phase 7: Gita Darshan (Wisdom Integration) — The verse speaks to THEIR situation
    verse_text = core_verse.get("english", "Perform your duty without attachment to results.")
    sanskrit_text = core_verse.get("sanskrit", "")
    chapter = core_verse.get("chapter", "")
    verse_num = core_verse.get("verse", "")
    verse_ref = f"BG {chapter}.{verse_num}" if chapter and verse_num else ""
    phases.append({
        "phase": 7,
        "name": phase_defs[6]["name"],
        "sanskrit_name": phase_defs[6]["sanskrit_name"],
        "english_name": phase_defs[6]["english_name"],
        "icon": phase_defs[6]["icon"],
        "guidance": (
            f"Receive this teaching from the Gita, spoken across millennia directly to your heart"
            f"{f' ({verse_ref})' if verse_ref else ''}: "
            f"\"{verse_text}\" "
            f"{f'— {sanskrit_text}' if sanskrit_text else ''} "
            f"This verse was written for seekers exactly like you — carrying exactly what you carry. "
            f"Through the path of {path_name}, your situation transforms from suffering into wisdom, "
            f"from karma into dharma. You are not the same person who began this journey seven phases ago. "
            f"Carry this teaching as a living flame within you."
        ),
    })

    return {
        "phases": phases,
        "sadhana": sadhana,
    }


# Legacy 4-part fallback for backward compatibility
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


def get_legacy_fallback_guidance(repair_type: str) -> dict:
    """Get legacy 4-part fallback guidance for backward compatibility."""
    repair = repair_type.lower().replace("_", "-").replace(" ", "-")

    if repair in FALLBACK_GUIDANCE:
        return FALLBACK_GUIDANCE[repair]

    for key in FALLBACK_GUIDANCE:
        if key in repair or repair in key:
            return FALLBACK_GUIDANCE[key]

    return FALLBACK_GUIDANCE["apology"]


# ==================== OPENAI CLIENT ====================

client = None
ready = False
openai_key = os.getenv("OPENAI_API_KEY")

if openai_key and openai_key != "your-api-key-here":
    try:
        client = AsyncOpenAI(api_key=openai_key, timeout=30.0)
        ready = True
        logger.info("Karma Reset KIAAN: AsyncOpenAI client initialized")
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
    request: Request,
    body: KarmaResetKiaanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str | None = Depends(get_current_user_optional)
) -> KarmaResetKiaanResponse:
    """
    Generate deep karma reset guidance with KIAAN ecosystem integration.

    This endpoint provides a comprehensive 7-phase karmic transformation
    grounded in Bhagavad Gita wisdom through 10 Gita-aligned karmic paths.

    The response includes:
    - Resolved karmic path with full Gita teachings
    - 7-phase personalized guidance (AI-generated when available)
    - Core and supporting Gita verses with full Sanskrit
    - Daily sadhana (spiritual practices) for sustained transformation
    - Five Pillar compliance scoring
    - Legacy 4-part guidance for backward compatibility
    """
    request_id = str(uuid.uuid4())[:8]
    start_time = datetime.now()

    # Extract and normalize request data
    situation = body.situation or "A moment that created a karmic ripple"
    feeling = body.feeling or "Someone I care about"
    path_key = body.repair_type or "kshama"

    # Problem analysis context for personalized guidance
    problem_category = body.problem_category or ""
    problem_id = body.problem_id or ""
    shad_ripu = body.shad_ripu or ""
    healing_insight = body.healing_insight or ""

    logger.info(
        f"[{request_id}] Deep KIAAN Karma Reset request",
        extra={
            "request_id": request_id,
            "situation_length": len(situation),
            "karmic_path": path_key,
            "problem_category": problem_category,
            "shad_ripu": shad_ripu,
        }
    )

    # Step 1: Generate deep reset data (karmic path, verses, context)
    try:
        deep_data = await karma_reset_service.generate_deep_reset(
            db=db,
            path_key=path_key,
            situation=situation,
            feeling=feeling,
        )
        logger.info(f"[{request_id}] Deep reset data prepared: {deep_data['verse_results_count']} verses")
    except Exception as e:
        logger.error(f"[{request_id}] Error generating deep reset data: {str(e)}")
        # Fallback to basic karmic path
        deep_data = {
            "karmic_path": {
                "key": path_key,
                "name": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("name", ""),
                "sanskrit_name": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("sanskrit_name", ""),
                "description": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("description", ""),
                "gita_principle": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("gita_principle", ""),
                "karmic_teaching": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("karmic_teaching", ""),
                "guna_analysis": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("guna_analysis", ""),
                "themes": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("themes", []),
            },
            "core_verse": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("core_verse", {}),
            "supporting_verses": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("supporting_verses", []),
            "sadhana": KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"]).get("sadhana", []),
            "seven_phases": SEVEN_PHASES,
            "verse_display": [],
            "wisdom_context": "",
            "verse_results_count": 0,
        }

    # Resolve the full karmic path for fallback generation
    resolved_path = KARMIC_PATHS.get(path_key) or karma_reset_service.resolve_karmic_path(path_key)

    # Step 2: Generate AI-powered 7-phase guidance
    ai_guidance = None
    legacy_guidance = None

    if ready and client:
        try:
            wisdom_context = deep_data.get("wisdom_context", "")

            # Build problem-specific context block for the AI
            problem_context_block = ""
            if problem_category or shad_ripu or healing_insight:
                problem_context_block = "\nPROBLEM ANALYSIS (weave this into EVERY phase):"
                if problem_category:
                    problem_context_block += f"\n- LIFE AREA: {problem_category.replace('_', ' ').title()}"
                if shad_ripu:
                    shad_ripu_names = {
                        "kama": "Kama (desire/attachment)",
                        "krodha": "Krodha (anger/rage)",
                        "lobha": "Lobha (greed/grasping)",
                        "moha": "Moha (delusion/confusion)",
                        "mada": "Mada (ego/pride)",
                        "matsarya": "Matsarya (envy/jealousy)",
                    }
                    enemy_name = shad_ripu_names.get(shad_ripu, shad_ripu.title())
                    problem_context_block += f"\n- INNER ENEMY (Shad-Ripu): {enemy_name} — this is the root force driving their suffering. Each phase must name and address this enemy specifically."
                if healing_insight:
                    problem_context_block += f"\n- GITA HEALING INSIGHT: {healing_insight}"
                problem_context_block += "\n"

            system_prompt = f"""You are KIAAN — a sacred wisdom guide for deep karmic transformation, strictly grounded in Bhagavad Gita teachings.

A seeker comes to you with a REAL problem that is causing them suffering:
- THEIR PROBLEM: "{situation}"
- WHO IS AFFECTED: "{feeling}"
- CHOSEN KARMIC PATH: "{resolved_path.get('name', 'Kshama')}"
{problem_context_block}
{wisdom_context}

MISSION: Generate a DEEP 7-phase karmic transformation that makes this person FEEL their specific problem is being addressed and resolved through Gita wisdom. Each phase must directly reference their problem, provide a concrete solution/perspective shift, and show how the chosen karmic path transforms their specific suffering.

Respond in JSON format with these exact keys:

{{
  "phase_1_witness_awareness": "3-5 sentences. NAME their specific problem. Help them step back from it and become the sakshi (witness). Show them that they are NOT this problem — the atman is untouched. Example: 'You feel [their problem], but step back and see: you are the eternal awareness OBSERVING this pain, not the pain itself.'",
  "phase_2_karmic_insight": "3-5 sentences. DIAGNOSE the karmic root of their specific problem. Name the inner enemy ({shad_ripu or 'rajas/tamas'}) that fuels it. Show EXACTLY how this enemy created their situation. Reference the Gita's teaching on gunas. Example: 'Your [problem] arose from [shad_ripu] — the Gita teaches that this force blinds the wise. Here is how it operates in YOUR situation...'",
  "phase_3_sacred_breath": "2-3 sentences. Connect the breath practice to THEIR specific emotional state. If anxious, calm the racing mind. If angry, cool the fire. If grieving, soften the heaviness. Make the pranayama feel like medicine for THEIR pain.",
  "phase_4_deep_acknowledgment": "3-5 sentences. Help them see the FULL picture of their specific situation with dharmic clarity. Not guilt (tamasic) but honest recognition. Name the specific ripple their situation created. Show them the Gita's teaching that acknowledgment is the first step to freedom.",
  "phase_5_sacred_repair": "4-6 sentences. THIS IS THE MOST IMPORTANT PHASE. Give them a CONCRETE, ACTIONABLE solution for their specific problem through the lens of the chosen karmic path. What should they DO? What should they SAY? How should they CHANGE? Ground it in nishkama karma. Make it so specific that they can act on it TODAY.",
  "phase_6_sacred_intention": "3-4 sentences. Help them set a sankalpa that directly addresses the PATTERN behind their problem, not just this one incident. Show how the karmic path transforms not just this situation but their entire relationship with {shad_ripu or 'this pattern'}. Give them a specific daily practice.",
  "phase_7_wisdom_integration": "3-5 sentences. Deliver the core Gita verse AS IF IT WAS WRITTEN FOR THEIR EXACT SITUATION. Show them how this ancient teaching speaks DIRECTLY to what they are going through. End with hope — show them the transformation that awaits on this path.",
  "breathingLine": "1-2 sentences connecting breath to their specific emotional state",
  "rippleSummary": "1-2 sentences naming the specific impact of their situation",
  "repairAction": "1-2 sentences with the concrete repair action for their problem",
  "forwardIntention": "1-2 sentences for how their life changes after this reset"
}}

CRITICAL REQUIREMENTS:
- The seeker must feel "YES, this is speaking DIRECTLY to MY problem" — not generic guidance
- EVERY phase must reference their specific situation, not abstract concepts
- Name the inner enemy ({shad_ripu or 'the driving force'}) by name in phases 2, 5, and 6
- Phase 5 must contain ACTIONABLE steps — what to do, what to say, how to change
- Use Gita terminology naturally: karma, dharma, atman, guna, prakriti, nishkama, sakshi, samatva
- Be warm, compassionate, and non-judgmental — but also deeply wise and specific
- The teaching should feel like a sage who KNOWS their exact situation and has the answer
- Include both philosophical depth AND practical, concrete applicability
"""

            response = await client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": "Generate the deep 7-phase karma reset guidance in JSON format. Make it profound, personal, and grounded in Gita wisdom."
                    }
                ],
                temperature=0.75,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )

            # Parse response
            guidance_text = "{}"
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg and response_msg.content:
                    guidance_text = response_msg.content

            try:
                ai_data = json.loads(guidance_text)
            except (json.JSONDecodeError, ValueError) as parse_error:
                logger.error(f"[{request_id}] JSON parse error: {str(parse_error)}")
                ai_data = None

            if ai_data:
                # Build 7-phase guidance from AI response
                phase_defs = SEVEN_PHASES
                phase_keys = [
                    "phase_1_witness_awareness",
                    "phase_2_karmic_insight",
                    "phase_3_sacred_breath",
                    "phase_4_deep_acknowledgment",
                    "phase_5_sacred_repair",
                    "phase_6_sacred_intention",
                    "phase_7_wisdom_integration",
                ]

                ai_phases = []
                for i, key in enumerate(phase_keys):
                    phase_def = phase_defs[i]
                    ai_phases.append({
                        "phase": i + 1,
                        "name": phase_def["name"],
                        "sanskrit_name": phase_def["sanskrit_name"],
                        "english_name": phase_def["english_name"],
                        "icon": phase_def["icon"],
                        "guidance": ai_data.get(key, phase_def["description"]),
                    })

                ai_guidance = {
                    "phases": ai_phases,
                    "sadhana": deep_data.get("sadhana", []),
                }

                # Extract legacy 4-part guidance
                legacy_guidance = {
                    "breathingLine": ai_data.get("breathingLine", ""),
                    "rippleSummary": ai_data.get("rippleSummary", ""),
                    "repairAction": ai_data.get("repairAction", ""),
                    "forwardIntention": ai_data.get("forwardIntention", ""),
                }

                # Validate legacy keys
                required_legacy = ["breathingLine", "rippleSummary", "repairAction", "forwardIntention"]
                if not all(legacy_guidance.get(k) for k in required_legacy):
                    legacy_guidance = None

        except Exception as e:
            logger.error(f"[{request_id}] OpenAI error: {str(e)}")
            ai_guidance = None
            legacy_guidance = None

    # Use fallback if AI failed
    if ai_guidance is None:
        logger.info(f"[{request_id}] Using deep fallback guidance from static Gita wisdom")
        fallback = get_deep_fallback_guidance(
            resolved_path,
            situation=situation,
            feeling=feeling,
            shad_ripu=shad_ripu,
            healing_insight=healing_insight,
            problem_category=problem_category,
        )
        ai_guidance = fallback

    if legacy_guidance is None:
        legacy_guidance = get_legacy_fallback_guidance(
            resolved_path.get("repair_type_legacy", "apology")
        )

    # Step 3: Validate guidance against Gita wisdom with Five Pillar compliance
    all_guidance_text = {}
    if ai_guidance and ai_guidance.get("phases"):
        for phase in ai_guidance["phases"]:
            phase_key = f"phase_{phase['phase']}"
            all_guidance_text[phase_key] = phase.get("guidance", "")

    validation_result = await karma_reset_service.validate_reset_guidance(
        guidance=all_guidance_text,
        verse_context=deep_data.get("wisdom_context", "")
    )

    # Step 4: Build verse display data
    verse_display = deep_data.get("verse_display", [])
    verse_metadata = []
    for vd in verse_display[:5]:
        verse_metadata.append({
            "verse_id": vd.get("verse_id", ""),
            "chapter": vd.get("chapter", 0),
            "verse_number": vd.get("verse_number", 0),
            "sanskrit": vd.get("sanskrit", ""),
            "transliteration": vd.get("transliteration", ""),
            "english": vd.get("english", ""),
            "hindi": vd.get("hindi", ""),
            "theme": vd.get("theme", ""),
            "score": vd.get("score", 0.0),
        })

    # Step 5: Build response
    core_verse = deep_data.get("core_verse", {})
    supporting_verses = deep_data.get("supporting_verses", [])

    karmic_path_data = KarmicPathData(
        key=deep_data["karmic_path"].get("key", path_key),
        name=deep_data["karmic_path"].get("name", ""),
        sanskrit_name=deep_data["karmic_path"].get("sanskrit_name", ""),
        description=deep_data["karmic_path"].get("description", ""),
        gita_principle=deep_data["karmic_path"].get("gita_principle", ""),
        karmic_teaching=deep_data["karmic_path"].get("karmic_teaching", ""),
        guna_analysis=deep_data["karmic_path"].get("guna_analysis", ""),
        themes=deep_data["karmic_path"].get("themes", []),
    )

    deep_guidance = DeepResetGuidance(
        phases=[PhaseGuidance(**p) for p in ai_guidance.get("phases", [])],
        sadhana=ai_guidance.get("sadhana", deep_data.get("sadhana", [])),
        core_verse=CoreVerseData(
            chapter=core_verse.get("chapter", 0),
            verse=core_verse.get("verse", 0),
            sanskrit=core_verse.get("sanskrit", ""),
            transliteration=core_verse.get("transliteration", ""),
            english=core_verse.get("english", ""),
            hindi=core_verse.get("hindi", ""),
        ),
        supporting_verses=supporting_verses,
    )

    kiaan_metadata = KiaanMetadata(
        verses_used=deep_data.get("verse_results_count", 0),
        verses=verse_metadata,
        validation_passed=validation_result.get("valid", False),
        validation_score=validation_result.get("score", 0.0),
        five_pillar_score=validation_result.get("five_pillar_score", 0.0),
        compliance_level=validation_result.get("compliance_level", ""),
        pillars_met=validation_result.get("pillars_met", 0),
        gita_terms_found=validation_result.get("gita_terms_found", [])[:10],
        wisdom_context=deep_data.get("wisdom_context", "")[:300],
    )

    elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)

    logger.info(
        f"[{request_id}] Deep KIAAN Karma Reset completed in {elapsed_ms}ms",
        extra={
            "verses_used": deep_data.get("verse_results_count", 0),
            "karmic_path": path_key,
            "five_pillar_score": validation_result.get("five_pillar_score", 0.0),
            "validation_passed": validation_result.get("valid", False),
        }
    )

    return KarmaResetKiaanResponse(
        karmic_path=karmic_path_data,
        deep_guidance=deep_guidance,
        reset_guidance=legacy_guidance,
        kiaan_metadata=kiaan_metadata,
        meta={
            "request_id": request_id,
            "processing_time_ms": elapsed_ms,
            "model_used": "gpt-4" if ready else "fallback",
            "kiaan_enhanced": True,
            "deep_reset_version": "2.0",
            "phases_count": 7,
            "karmic_paths_available": len(KARMIC_PATHS),
        }
    )


@router.get("/paths")
async def get_karmic_paths():
    """
    Get all available karmic paths for frontend display.

    Returns the 10 Gita-aligned karmic repair paths with their
    names, Sanskrit names, descriptions, and key identifiers.
    """
    paths = karma_reset_service.get_available_paths()
    return {
        "paths": paths,
        "total": len(paths),
        "phases": karma_reset_service.get_phase_definitions(),
        "phases_count": len(SEVEN_PHASES),
    }


@router.get("/health")
async def kiaan_health_check():
    """Health check endpoint for KIAAN karma reset integration."""
    return {
        "status": "healthy",
        "service": "karma-reset-kiaan",
        "openai_ready": ready,
        "version": "2.0.0",
        "features": {
            "deep_reset": True,
            "karmic_paths": len(KARMIC_PATHS),
            "seven_phases": True,
            "five_pillar_compliance": True,
            "gita_core_wisdom": True,
        }
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
    user_id: str = Depends(get_current_user_optional)
) -> JourneyResetResponse:
    """
    Reset user's KIAAN journey data with wisdom-based fresh start guidance.

    This endpoint resets:
    - User emotional logs
    - Daily analysis records
    - Weekly reflections
    - Assessments
    - Journey progress tracking
    """
    request_id = str(uuid.uuid4())[:8]
    start_time = datetime.now()

    logger.info(
        f"[{request_id}] Journey reset requested by user {user_id}",
        extra={"user_id": user_id, "reason": request.reason}
    )

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
        logger.info(f"[{request_id}] Deleting user journey data...")

        result = await db.execute(
            text("DELETE FROM user_emotional_logs WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["emotional_logs_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_daily_analysis WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["daily_analyses_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_weekly_reflections WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["weekly_reflections_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_assessments WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["assessments_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_journey_progress WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["journey_progress_deleted"] = result.rowcount

        result = await db.execute(
            text("DELETE FROM user_verses_bookmarked WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        reset_details["verses_bookmarked_deleted"] = result.rowcount

        await db.commit()

        logger.info(
            f"[{request_id}] Journey data deleted successfully",
            extra=reset_details
        )

        # Generate KIAAN wisdom for fresh start using Gita's teaching on new beginnings
        kiaan_wisdom = {}

        if ready and client:
            try:
                verse_results = await karma_reset_service.get_reset_verses(
                    db=db,
                    repair_type="tyaga",
                    situation="Beginning anew with fresh perspective and surrender",
                    limit=3
                )

                wisdom_context = karma_reset_service.build_gita_context(
                    verse_results=verse_results,
                    repair_type="tyaga"
                )

                prompt = f"""You are KIAAN, a sacred wisdom guide. A seeker has reset their journey to begin anew.

Reason: "{request.reason}"

{wisdom_context}

Provide deep Gita-grounded wisdom for their fresh start in JSON format:
{{
  "breathingLine": "1-2 sentences for centering, referencing pranayama",
  "acknowledgment": "2-3 sentences acknowledging their courage, referencing BG 6.5 (self-upliftment)",
  "wisdom": "3-4 sentences of ancient Gita wisdom for new beginnings, referencing tyaga and nishkama karma",
  "intention": "2-3 sentences for forward-looking sankalpa (sacred intention)"
}}

Tone: warm, encouraging, deeply wise, grounded in Gita. Not generic self-help.
"""

                response = await client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": "Generate fresh start wisdom in JSON."}
                    ],
                    temperature=0.8,
                    max_tokens=500,
                    response_format={"type": "json_object"}
                )

                wisdom_text = "{}"
                if response and response.choices and len(response.choices) > 0:
                    response_msg = response.choices[0].message
                    if response_msg and response_msg.content:
                        wisdom_text = response_msg.content
                kiaan_wisdom = json.loads(wisdom_text)

            except Exception as e:
                logger.error(f"[{request_id}] Error generating KIAAN wisdom: {str(e)}")
                kiaan_wisdom = _get_fresh_start_fallback()
        else:
            kiaan_wisdom = _get_fresh_start_fallback()

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
        await db.rollback()
        logger.error(
            f"[{request_id}] Journey reset failed: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Journey reset failed. Please try again later."
        )


def _get_fresh_start_fallback() -> dict:
    """Fallback wisdom for fresh start, grounded in Gita teachings."""
    return {
        "breathingLine": "Take a deep, purifying breath. As the Gita teaches, pranayama calms the agitated mind and prepares it for fresh perception. This breath marks the beginning of a new chapter.",
        "acknowledgment": "You have chosen to begin anew — and the Gita honors this courage. BG 6.5 teaches: 'Let one lift oneself by one's own Self; let not one degrade oneself.' By choosing renewal, you are lifting yourself toward your highest nature.",
        "wisdom": "The Gita teaches that true renunciation (tyaga) is not giving up action, but giving up attachment to results. Your past journey produced fruits — some sweet, some bitter. Release them all. The wisdom gained remains; the attachment dissolves. As the eternal atman, you are untouched by what has passed. Every moment offers a fresh beginning to one who has the eyes to see it.",
        "intention": "Set your sankalpa: 'I begin this journey with nishkama bhava — without attachment to outcomes, but with full dedication to the path. Each step is my offering. Each insight is grace.' Walk forward with the steady wisdom of the sthitaprajna."
    }
