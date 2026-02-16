"""Relationship Compass - Strict Gita-Grounded Relationship Guidance v3.2.

STRICT GITA ADHERENCE VERSION with Static + Dynamic Core Wisdom Integration

This router provides relationship conflict navigation using EXCLUSIVELY Bhagavad Gita
wisdom from both static (701-verse repository) and dynamic (validated learned wisdom).
ALL responses are grounded in actual verses and verified Gita teachings.

STRICT GITA PSYCHOLOGY FRAMEWORK (v3.2):
- Shad Ripu (Six Inner Enemies) diagnostic: Kama, Krodha, Lobha, Moha, Mada, Matsarya
- Raga-Dvesha (Attachment-Aversion) dynamics instead of Western attachment theory
- Guna analysis (Sattva/Rajas/Tamas) for emotional state assessment
- Yoga path prescription (Karma/Bhakti/Jnana/Dhyana) per situation
- Vak-tapas (BG 17.15) framework for communication guidance
- Sanskrit terminology with translations for all key concepts

GITA-GROUNDED PATTERN (v3.2):
1. AI-POWERED ANALYSIS - Strict Gita psychology (Shad Ripu, Guna, Raga-Dvesha)
2. STATIC WISDOM - 701-verse repository retrieval with Sanskrit + principles
3. DYNAMIC WISDOM - Validated learned wisdom from WisdomCore
4. SVADHYAYA APPLIED - Self-study using ONLY Gita psychology
5. DHARMIC PATH ILLUMINATED - Every guidance point traces to a specific verse
6. FALLBACK USES REAL VERSES - Strictly Gita-grounded, never generic text

DUAL WISDOM SOURCES:
- Static: 701-verse JSON with Sanskrit, translations, themes, principles, mental health tags
- Dynamic: WisdomCore validated learned wisdom (LearnedWisdom table) with verse references

NEW IN v3.2 - Strict Gita Adherence:
- Shad Ripu diagnostic framework replaces generic emotion labels
- Guna analysis (Sattva/Rajas/Tamas) for emotional state
- All emotions mapped to Gita psychology (Krodha, Raga, Dvesha, Moha, etc.)
- Dynamic wisdom integration from validated learned sources
- Stricter validation requiring 3+ unique verse citations
- Sanskrit terminology mandatory in Gita mode responses
- Secular mode explicitly derives ALL advice from Gita principles
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.wellness_model import (
    AnalysisMode,
    WellnessModel,
    WellnessTool,
    get_wellness_model,
    PsychologicalFramework,
)
from backend.services.relationship_compass_prompt import (
    RELATIONSHIP_COMPASS_GITA_SYSTEM_PROMPT,
    RELATIONSHIP_COMPASS_SECULAR_PROMPT,
)
from backend.services.relationship_compass_rag import (
    HEADINGS_INSUFFICIENT,
    HEADINGS_SUFFICIENT,
    HEADINGS_SECULAR,
    HEADINGS_SECULAR_INSUFFICIENT,
    build_allowed_citations,
    build_citation_list,
    build_context_block,
    build_insufficient_response,
    build_secular_insufficient_response,
    call_openai,
    call_ai_provider,
    generate_gita_based_response,
    generate_secular_response,
    expand_and_retrieve,
    extract_sections,
    merge_chunks,
    retrieve_chunks,
    validate_response,
)
from backend.services.relationship_compass_storage import (
    CompassMessage,
    append_message,
    ensure_session,
    get_recent_messages,
)
from backend.services.gita_wisdom_retrieval import (
    search_gita_verses,
    build_gita_context,
    generate_relationship_compass_fallback,
    is_ready as gita_ready,
    get_verses_count,
)
from backend.services.relationship_compass_analysis import (
    analyze_conflict_with_ai_async,
    build_enhanced_search_query,
    analysis_to_dict,
    ConflictAnalysis,
)
from backend.services.wisdom_core import get_wisdom_core, WisdomResult
from backend.services.relationship_wisdom_core import get_relationship_wisdom_core
from backend.services.relationship_compass_synthesizer import get_wisdom_synthesizer
from backend.services.relationship_compass_engine import (
    EngineAnalysis,
    ai_analysis as engine_ai_analysis,
    extract_response_sections as engine_extract_sections,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/relationship-compass", tags=["relationship-compass"])


class RelationshipType(str, Enum):
    """Types of relationships the compass can guide."""
    ROMANTIC = "romantic"           # Partner, spouse, significant other
    FAMILY = "family"               # Parents, siblings, children, relatives
    FRIENDSHIP = "friendship"       # Close friends, acquaintances
    WORKPLACE = "workplace"         # Colleagues, boss, employees
    SELF = "self"                   # Relationship with oneself
    COMMUNITY = "community"         # Neighbors, groups, society


class RelationshipGuideRequest(BaseModel):
    """Request schema for relationship guidance."""
    conflict: str = Field(..., min_length=10, max_length=3000, description="The relationship situation or conflict")
    relationship_type: RelationshipType = Field(default=RelationshipType.ROMANTIC, description="Type of relationship")
    context: str | None = Field(None, max_length=1000, description="Additional context about the relationship history")
    primary_emotion: str | None = Field(None, max_length=100, description="Primary emotion (hurt, anger, confusion, etc.)")
    desired_outcome: str | None = Field(None, max_length=500, description="What they hope to achieve")


class GitaGuidanceRequest(BaseModel):
    """Request schema for relationship guidance."""
    model_config = ConfigDict(populate_by_name=True)
    message: str = Field(..., min_length=1, max_length=3000, description="User message")
    session_id: str = Field(..., min_length=1, max_length=128, alias="sessionId")
    relationship_type: str = Field("other", alias="relationshipType")
    # Secular mode: modern, friendly responses without spiritual language (default: True)
    secular_mode: bool = Field(True, alias="secularMode")


class UnifiedCompassRequest(BaseModel):
    """Request schema for the unified secular Relationship Compass with Wisdom Core."""
    model_config = ConfigDict(populate_by_name=True)
    message: str = Field(
        ..., min_length=10, max_length=3000,
        description="Describe your relationship situation",
    )
    session_id: str = Field(
        ..., min_length=1, max_length=128,
        alias="sessionId",
        description="Session identifier for conversation history",
    )
    relationship_type: str = Field(
        "romantic",
        alias="relationshipType",
        description="Type: romantic, family, friendship, workplace, self, community",
    )
    include_wisdom_sources: bool = Field(
        True,
        alias="includeWisdomSources",
        description="Include wisdom source metadata in response (for UI display)",
    )


# Relationship-specific Gita teachings mapping
RELATIONSHIP_GITA_TEACHINGS = {
    RelationshipType.ROMANTIC: {
        "focus_verses": "love attachment desire raga dvesa attraction bond union partner commitment trust intimacy",
        "core_principles": ["Sama-darshana (equal vision)", "Nishkama Prema (desireless love)", "Satya (truth in love)"],
        "key_teaching": "True love is 'nishkama' - without selfish attachment. The Gita teaches that genuine love flows from recognizing the divine in your partner.",
    },
    RelationshipType.FAMILY: {
        "focus_verses": "duty dharma family svadharma ancestors lineage honor respect parents children obligation",
        "core_principles": ["Svadharma (one's sacred duty)", "Shraddha (faith and respect)", "Kula-dharma (family righteousness)"],
        "key_teaching": "Family is our first field of dharma. The Gita teaches us to honor our duties while maintaining inner equanimity.",
    },
    RelationshipType.FRIENDSHIP: {
        "focus_verses": "friend companion suhrit mitra well-wisher trust loyalty companionship support bond",
        "core_principles": ["Maitri (unconditional friendship)", "Karuna (compassion)", "Mudita (joy in others' success)"],
        "key_teaching": "The wise person is 'suhrit sarva-bhutanam' - a friend to all beings. True friendship transcends expectations.",
    },
    RelationshipType.WORKPLACE: {
        "focus_verses": "work karma action duty skill excellence nishkama karma yoga service contribution",
        "core_principles": ["Karma Yoga (selfless action)", "Yogah karmasu kaushalam (excellence in action)", "Seva (service)"],
        "key_teaching": "Work itself is worship. Conflicts arise when we attach to recognition rather than the work itself.",
    },
    RelationshipType.SELF: {
        "focus_verses": "atman self soul witness consciousness mind control inner peace svadhyaya self-study",
        "core_principles": ["Atma-jnana (self-knowledge)", "Svadhyaya (self-study)", "Santosha (contentment)"],
        "key_teaching": "You are the atman - eternal, complete, unchanging. All relationship struggles begin with our relationship with ourselves.",
    },
    RelationshipType.COMMUNITY: {
        "focus_verses": "sarva-bhuta-hite service world welfare lokasangraha harmony society collective duty",
        "core_principles": ["Lokasangraha (welfare of the world)", "Ahimsa (non-harm)", "Dana (giving)"],
        "key_teaching": "We are all interconnected. The enlightened one acts for 'lokasangraha' - the good of all beings.",
    },
}

# Emotion-to-Gita mapping for deeper insight
EMOTION_GITA_MAPPING = {
    "hurt": "The pain you feel is krodha's (anger's) sibling - arising from unmet expectations. The Gita teaches that attachment (raga) to how we want others to behave creates suffering.",
    "anger": "Krodha (anger) is listed as one of the three gates to hell in Chapter 16. Yet the Gita doesn't condemn the emotion - only action from anger. Witness it, don't become it.",
    "confusion": "Moha (delusion/confusion) clouds our buddhi (discriminative wisdom). Arjuna himself was overwhelmed by moha. Clarity comes from stepping back into witness consciousness.",
    "fear": "Bhaya (fear) in relationships often masks a deeper fear of unworthiness. The Gita's 'abhaya' (fearlessness) comes from knowing your eternal nature.",
    "guilt": "Carrying guilt is carrying the past into the present. The Gita teaches that each moment is new - we can always choose dharma from this point forward.",
    "loneliness": "True loneliness is separation from self, not from others. The Gita reveals we are never alone - the divine dwells in every heart.",
    "jealousy": "Matsarya (jealousy) arises from comparing our journey to another's. The Gita teaches svadharma - your path is unique and incomparable.",
    "betrayal": "The feeling of betrayal reveals our expectations of permanence. The Gita teaches that people act from their own conditioning - their actions reflect them, not you.",
    "resentment": "Resentment is drinking poison hoping another suffers. The Gita's kshama (forgiveness) is freedom for yourself, not a gift to the other.",
    "grief": "Shoka (grief) for lost connection is natural. Yet the Gita reminds us that the love never dies - only the form changes.",
}

# Attachment Theory patterns (v2.0 enhancement)
ATTACHMENT_PATTERNS = {
    "anxious": {
        "indicators": ["abandoned", "leave me", "not enough", "clingy", "need reassurance", "worried they'll leave"],
        "characteristics": "Fear of abandonment, need for reassurance, hypervigilance to partner's cues",
        "gita_wisdom": "Atma-tripti (self-contentment) - your completeness comes from within, not from another's validation",
        "healing_focus": "Building inner security through self-connection and dharma",
    },
    "avoidant": {
        "indicators": ["space", "too close", "suffocating", "independent", "don't need anyone", "walls up"],
        "characteristics": "Discomfort with closeness, prioritizing independence over intimacy",
        "gita_wisdom": "Sangha (sacred connection) - interdependence is strength, not weakness",
        "healing_focus": "Gradual opening through small vulnerable moments with safe people",
    },
    "disorganized": {
        "indicators": ["confused", "push pull", "hot cold", "want closeness but scared", "mixed signals"],
        "characteristics": "Conflicting desires for closeness and distance, often from early trauma",
        "gita_wisdom": "Yoga (union) - integrating conflicting parts of self through witness consciousness",
        "healing_focus": "Creating safety through predictable, boundaried connection",
    },
    "secure": {
        "indicators": ["comfortable", "trust", "communicate openly", "healthy boundaries", "give space"],
        "characteristics": "Comfortable with both intimacy and independence",
        "gita_wisdom": "Purnatva (fullness) - complete in self, open to others",
        "healing_focus": "Maintaining balance and supporting partner's growth",
    },
}

# Communication patterns for analysis
COMMUNICATION_PATTERNS = {
    "criticism": {
        "indicators": ["you always", "you never", "what's wrong with you", "you're so"],
        "gita_alternative": "Satya with priya (truth with kindness) - speak specific observations, not character attacks",
    },
    "defensiveness": {
        "indicators": ["but you", "it's not my fault", "you're the one who", "that's not fair"],
        "gita_alternative": "Shravana (deep listening) - receive feedback as information, not attack",
    },
    "contempt": {
        "indicators": ["ridiculous", "pathetic", "roll my eyes", "you're such a"],
        "gita_alternative": "Sama-darshana (equal vision) - see the divine struggling in them too",
    },
    "stonewalling": {
        "indicators": ["shut down", "won't talk", "give silent treatment", "walk away"],
        "gita_alternative": "Take space with intention - 'I need time to process, I'll return'",
    },
}

# Initialize WellnessModel
wellness_model: WellnessModel | None = None
try:
    wellness_model = get_wellness_model()
    logger.info("✅ Relationship Compass v3.0: WellnessModel initialized with Gita-grounding")
except Exception as e:
    logger.warning(f"⚠️ Relationship Compass: WellnessModel unavailable: {e}")

# Log Gita verses availability
if gita_ready():
    logger.info(f"✅ Relationship Compass v3.0: {get_verses_count()} Gita verses available for retrieval")
else:
    logger.warning("⚠️ Relationship Compass: Gita verses not loaded - using RAG/fallback")


async def _fetch_dynamic_wisdom(
    db: AsyncSession,
    query: str,
    ai_analysis: ConflictAnalysis | None = None,
    limit: int = 5,
) -> list[dict]:
    """Fetch dynamic learned wisdom from WisdomCore for stricter Gita adherence.

    Retrieves validated learned wisdom that supplements the static 701-verse
    repository, providing deeper commentary and applied teachings from verified sources.
    """
    dynamic_items: list[dict] = []
    try:
        wisdom_core = get_wisdom_core()

        # Search by query text
        results = await wisdom_core.search(
            db=db,
            query=query,
            limit=limit,
            include_learned=True,
            validated_only=True,
        )

        # Also search by Shad Ripu if AI analysis identified one
        if ai_analysis and ai_analysis.active_shad_ripu:
            ripu_results = await wisdom_core.get_for_enemy(
                db=db,
                enemy=ai_analysis.active_shad_ripu,
                limit=3,
                include_learned=True,
            )
            # Merge without duplicates
            seen_ids = {r.id for r in results}
            for r in ripu_results:
                if r.id not in seen_ids:
                    results.append(r)
                    seen_ids.add(r.id)

        # Also search by mental health domain if relevant
        if ai_analysis and ai_analysis.primary_emotion:
            # Map emotion to domain
            emotion_domain_map = {
                "anger": "anger", "krodha": "anger",
                "fear": "anxiety", "bhaya": "anxiety",
                "sadness": "depression", "shoka": "depression",
                "hurt": "grief", "grief": "grief",
                "confusion": "stress", "moha": "stress",
            }
            emotion_key = ai_analysis.primary_emotion.split("(")[0].strip().lower()
            domain = emotion_domain_map.get(emotion_key)
            if domain:
                domain_results = await wisdom_core.get_by_domain(
                    db=db,
                    domain=domain,
                    limit=3,
                    include_learned=True,
                )
                for r in domain_results:
                    if r.id not in seen_ids:
                        results.append(r)
                        seen_ids.add(r.id)

        # Convert WisdomResult objects to dicts for build_context_block
        for r in results:
            if r.source.value == "learned":  # Only include dynamic/learned wisdom
                dynamic_items.append({
                    "content": r.content,
                    "source_name": r.source_name or "Verified Gita Commentary",
                    "verse_refs": [[r.chapter, r.verse]] if r.chapter and r.verse else [],
                    "themes": r.themes,
                    "shad_ripu_tags": r.shad_ripu_tags,
                    "quality_score": r.quality_score,
                })

        if dynamic_items:
            logger.info(
                f"RelationshipCompass: Retrieved {len(dynamic_items)} dynamic wisdom items "
                f"(Shad Ripu: {ai_analysis.active_shad_ripu if ai_analysis else 'N/A'})"
            )

    except Exception as e:
        logger.warning(f"Dynamic wisdom retrieval failed (non-critical): {e}")

    return dynamic_items


@router.post("/guide")
async def get_relationship_guidance(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate relationship guidance using ONLY Bhagavad Gita wisdom (v3.0).

    GITA-GROUNDED PATTERN:
    Conflict → Svadhyaya → Gita Verse Retrieval → Dharmic Guidance

    1. Receive user's relationship conflict with type and context
    2. Analyze through Gita psychology (svadhyaya - self-study)
    3. Retrieve relevant verses from 701-verse repository
    4. Generate response grounded in actual Gita verses
    5. Fallback uses real verses, not generic text

    Request body:
        conflict: str - The relationship situation or conflict
        relationship_type: str - romantic/family/friendship/workplace/self/community
        analysis_mode: str - One of "standard", "deep_dive", or "quantum_dive" (default: "standard")
        context: str - Additional context (optional)
        primary_emotion: str - Primary emotion (optional)
        desired_outcome: str - What they hope to achieve (optional)
        language: str - Optional language code (hi, ta, te, etc.)

    Returns:
        - compass_guidance: Structured sections with Gita verse citations
        - gita_context: Verses used for this response
        - relationship_teachings: Type-specific Gita teachings
        - gita_verses_used: Number of actual verses incorporated
    """
    # Extract fields with validation
    conflict = payload.get("conflict", "")
    relationship_type_str = payload.get("relationship_type", "romantic")
    analysis_mode_str = payload.get("analysis_mode", "standard")
    context = payload.get("context", "")
    primary_emotion = payload.get("primary_emotion", "")
    desired_outcome = payload.get("desired_outcome", "")
    language = payload.get("language")

    # Validate conflict
    if not conflict or not conflict.strip():
        raise HTTPException(status_code=400, detail="Please share your relationship situation - it helps me understand and guide you better")

    if len(conflict) > 3000:
        raise HTTPException(status_code=400, detail="Input too long (max 3000 characters). Please summarize the key aspects of your situation.")

    if len(conflict.strip()) < 10:
        raise HTTPException(status_code=400, detail="Please share a bit more detail so I can truly understand your situation")

    # Parse relationship type
    try:
        relationship_type = RelationshipType(relationship_type_str.lower())
    except ValueError:
        relationship_type = RelationshipType.ROMANTIC

    # Parse analysis mode
    try:
        analysis_mode = AnalysisMode(analysis_mode_str.lower())
    except ValueError:
        logger.warning(f"Invalid analysis_mode '{analysis_mode_str}', using standard")
        analysis_mode = AnalysisMode.STANDARD

    # STEP 1: AI-powered deep conflict analysis using OpenAI API
    # This provides nuanced understanding beyond simple keyword matching
    ai_analysis = await analyze_conflict_with_ai_async(
        conflict=conflict,
        relationship_type=relationship_type.value,
        context=context,
        primary_emotion=primary_emotion,
    )

    logger.info(
        f"RelationshipCompass AI Analysis: "
        f"emotion={ai_analysis.primary_emotion}, "
        f"attachment={ai_analysis.attachment_style}, "
        f"confidence={ai_analysis.confidence:.2f}, "
        f"depth={ai_analysis.analysis_depth}"
    )

    # Use AI analysis for enhanced pattern insights
    attachment_insights = _analyze_attachment_patterns(conflict)
    communication_issues = _analyze_communication_patterns(conflict)

    # Merge AI insights with rule-based analysis
    if ai_analysis.analysis_depth == "ai_enhanced":
        # Enhance attachment insights with AI analysis
        if ai_analysis.attachment_style and ai_analysis.attachment_style != "unknown":
            ai_attachment_insight = {
                "style": ai_analysis.attachment_style,
                "characteristics": ", ".join(ai_analysis.attachment_indicators[:3]),
                "gita_wisdom": ATTACHMENT_PATTERNS.get(ai_analysis.attachment_style, {}).get(
                    "gita_wisdom", ""
                ),
                "healing_focus": ATTACHMENT_PATTERNS.get(ai_analysis.attachment_style, {}).get(
                    "healing_focus", ""
                ),
                "triggers": ai_analysis.attachment_triggers,
                "source": "ai_analysis",
            }
            # Prepend AI insight for priority
            attachment_insights = [ai_attachment_insight] + [
                i for i in attachment_insights if i.get("style") != ai_analysis.attachment_style
            ]

        # Enhance communication insights with AI analysis
        if ai_analysis.problematic_patterns:
            for pattern in ai_analysis.problematic_patterns:
                if pattern in COMMUNICATION_PATTERNS:
                    ai_comm_insight = {
                        "pattern": pattern,
                        "gita_alternative": COMMUNICATION_PATTERNS[pattern]["gita_alternative"],
                        "source": "ai_analysis",
                    }
                    # Add if not already present
                    if not any(c.get("pattern") == pattern for c in communication_issues):
                        communication_issues.append(ai_comm_insight)

    # STEP 2: Retrieve Gita verses from BOTH static (701-verse) and dynamic (learned) wisdom
    depth_map = {
        AnalysisMode.STANDARD: "standard",
        AnalysisMode.DEEP_DIVE: "deep_dive",
        AnalysisMode.QUANTUM_DIVE: "quantum_dive",
    }
    depth = depth_map.get(analysis_mode, "standard")

    # Build enhanced search query using AI analysis for better verse retrieval
    if ai_analysis.analysis_depth == "ai_enhanced" and ai_analysis.confidence >= 0.5:
        search_query = build_enhanced_search_query(
            conflict=conflict,
            analysis=ai_analysis,
            relationship_type=relationship_type.value,
        )
        logger.info(f"RelationshipCompass: Using AI-enhanced search query")
    else:
        # Fallback to basic search query
        search_query = f"{conflict} {primary_emotion or ''} {relationship_type.value}"

    # Static wisdom: 701-verse repository
    gita_verses = search_gita_verses(
        query=search_query,
        tool="relationship_compass",
        limit=12,  # Increased for stricter Gita adherence
        depth=depth,
    )

    # Dynamic wisdom: Validated learned wisdom from WisdomCore
    dynamic_wisdom = await _fetch_dynamic_wisdom(
        db=db,
        query=search_query,
        ai_analysis=ai_analysis,
        limit=5,
    )

    # Build Gita context for AI (combining static + dynamic)
    if gita_verses:
        gita_context, sources = build_gita_context(gita_verses, tool="relationship_compass")
        # Append dynamic wisdom context if available
        if dynamic_wisdom:
            dynamic_context_lines = ["\n--- DYNAMIC LEARNED WISDOM (validated) ---"]
            for dw in dynamic_wisdom:
                dynamic_context_lines.append(f"- Source: {dw.get('source_name', 'Verified Commentary')}")
                if dw.get('verse_refs'):
                    refs = [f"BG {r[0]}.{r[1]}" for r in dw['verse_refs'] if len(r) >= 2]
                    dynamic_context_lines.append(f"  Related Verses: {', '.join(refs)}")
                dynamic_context_lines.append(f"  Wisdom: {dw.get('content', '')[:300]}")
                dynamic_context_lines.append("")
            gita_context += "\n".join(dynamic_context_lines)
        logger.info(
            f"RelationshipCompass: Retrieved {len(gita_verses)} static verses "
            f"+ {len(dynamic_wisdom)} dynamic wisdom items"
        )
    else:
        # Use core relationship wisdom
        gita_context = _get_core_relationship_gita_wisdom()
        sources = [{"file": "core_dharma_wisdom", "reference": "BG 6.32, 12.13-14"}]
        logger.info("RelationshipCompass: Using core relationship Gita wisdom")

    # Build enriched input with Gita context
    enriched_input = _build_enriched_input(
        conflict=conflict,
        relationship_type=relationship_type,
        context=context,
        primary_emotion=primary_emotion,
        desired_outcome=desired_outcome,
    )

    # Get relationship-specific teachings
    relationship_teachings = RELATIONSHIP_GITA_TEACHINGS.get(relationship_type, {})
    emotion_insight = EMOTION_GITA_MAPPING.get(primary_emotion.lower(), "") if primary_emotion else ""

    # If WellnessModel unavailable, use Gita-grounded fallback
    if not wellness_model:
        logger.warning("RelationshipCompass: WellnessModel unavailable, using Gita fallback")
        return _get_gita_grounded_fallback(
            conflict, gita_verses, relationship_type, primary_emotion, analysis_mode
        )

    try:
        # Generate response using WellnessModel with Gita context
        result = await wellness_model.generate_response(
            tool=WellnessTool.RELATIONSHIP_COMPASS,
            user_input=f"{enriched_input}\n\n{gita_context}",
            db=db,
            analysis_mode=analysis_mode,
            language=language,
        )

        # Build response with Gita grounding and AI analysis
        response = {
            "status": "success",
            "compass_guidance": result.sections,
            "response": result.content,
            "gita_verses_used": max(result.gita_verses_used, len(gita_verses)),
            "relationship_type": relationship_type.value,
            "analysis_mode": result.analysis_mode,
            "relationship_teachings": {
                "core_principles": relationship_teachings.get("core_principles", []),
                "key_teaching": relationship_teachings.get("key_teaching", ""),
            },
            "emotion_insight": emotion_insight,
            "model": result.model,
            "provider": result.provider,
            # Gita-grounded fields (v3.0)
            "gita_context": {
                "verses_retrieved": len(gita_verses),
                "sources": sources,
            },
            "svadhyaya_insights": attachment_insights,
            "communication_patterns": communication_issues,
            # AI Analysis fields (v3.2 - Strict Gita psychology)
            "ai_analysis": {
                "enabled": ai_analysis.analysis_depth == "ai_enhanced",
                "primary_emotion": ai_analysis.primary_emotion,
                "secondary_emotions": ai_analysis.secondary_emotions,
                "emotional_intensity": ai_analysis.emotional_intensity,
                "active_shad_ripu": ai_analysis.active_shad_ripu,
                "guna_analysis": ai_analysis.guna_analysis,
                "attachment_style": ai_analysis.attachment_style,
                "attachment_triggers": ai_analysis.attachment_triggers,
                "communication_style": ai_analysis.communication_style,
                "power_dynamic": ai_analysis.power_dynamic,
                "core_unmet_needs": ai_analysis.core_unmet_needs,
                "underlying_fears": ai_analysis.underlying_fears,
                "gita_concepts": ai_analysis.gita_concepts,
                "recommended_teachings": ai_analysis.recommended_teachings,
                "primary_yoga_path": ai_analysis.primary_yoga_path,
                "healing_verse": ai_analysis.healing_verse,
                "confidence": ai_analysis.confidence,
            },
            # Dynamic wisdom integration
            "dynamic_wisdom": {
                "items_retrieved": len(dynamic_wisdom),
                "sources": [dw.get("source_name", "") for dw in dynamic_wisdom],
            },
            "cached": result.cached,
            "latency_ms": result.latency_ms,
        }

        logger.info(
            f"✅ RelationshipCompass guidance: {analysis_mode.value} mode, "
            f"type={relationship_type.value}, "
            f"{len(gita_verses)} verses retrieved"
        )

        return response

    except Exception as e:
        logger.exception(f"Relationship Compass error: {e}")
        return _get_gita_grounded_fallback(
            conflict, gita_verses, relationship_type, primary_emotion, analysis_mode
        )


@router.post("/gita-guidance")
async def get_relationship_guidance_gita_only(
    payload: GitaGuidanceRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Relationship guidance with strict Gita adherence (static + dynamic wisdom).

    Both secular and Gita modes derive ALL guidance from the Bhagavad Gita's
    700+ verse repository (static) plus validated learned wisdom (dynamic).
    The difference is only in presentation style, not in wisdom source.
    """
    message = payload.message.strip()
    session_id = payload.session_id.strip()
    relationship_type = (payload.relationship_type or "other").strip().lower()
    secular_mode = payload.secular_mode  # Default True - modern, friendly responses

    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    if not session_id:
        raise HTTPException(status_code=400, detail="sessionId is required")

    ensure_session(session_id)
    history = get_recent_messages(session_id, 20)

    append_message(
        CompassMessage(
            session_id=session_id,
            role="user",
            content=message,
            created_at=datetime.utcnow().isoformat(),
        )
    )

    # AI-powered conflict analysis for enhanced understanding
    ai_analysis = await analyze_conflict_with_ai_async(
        conflict=message,
        relationship_type=relationship_type,
    )

    logger.info(
        f"RelationshipCompass Analysis: "
        f"emotion={ai_analysis.primary_emotion}, "
        f"attachment={ai_analysis.attachment_style}, "
        f"confidence={ai_analysis.confidence:.2f}, "
        f"secular_mode={secular_mode}"
    )

    # Build enhanced query for verse retrieval if AI analysis was successful
    if ai_analysis.analysis_depth == "ai_enhanced" and ai_analysis.confidence >= 0.5:
        enhanced_query = build_enhanced_search_query(
            conflict=message,
            analysis=ai_analysis,
            relationship_type=relationship_type,
        )
        base_result = retrieve_chunks(enhanced_query, relationship_type, k=20)
        logger.info("RelationshipCompass: Using AI-enhanced query for wisdom retrieval")
    else:
        base_result = retrieve_chunks(message, relationship_type, k=20)

    retrieval = expand_and_retrieve(message, relationship_type, base_result)
    merged_chunks = merge_chunks(retrieval, limit=22)

    # Fetch dynamic learned wisdom for stricter Gita adherence
    dynamic_wisdom = await _fetch_dynamic_wisdom(
        db=db,
        query=message,
        ai_analysis=ai_analysis,
        limit=5,
    )

    context_block = build_context_block(merged_chunks, dynamic_wisdom=dynamic_wisdom)
    context_sufficient = bool(merged_chunks) and retrieval.confidence >= 0.2

    # Log Gita wisdom retrieval for verification
    logger.info(
        f"RelationshipCompass Gita Wisdom: "
        f"retrieved={len(merged_chunks)} verses, "
        f"confidence={retrieval.confidence:.2f}, "
        f"strategy={retrieval.strategy}, "
        f"context_sufficient={context_sufficient}"
    )

    # Choose headings based on mode
    headings_sufficient = HEADINGS_SECULAR if secular_mode else HEADINGS_SUFFICIENT
    headings_insufficient = HEADINGS_SECULAR_INSUFFICIENT if secular_mode else HEADINGS_INSUFFICIENT

    # Don't return citations in secular mode (no references to show)
    citations = [] if secular_mode else build_citation_list(merged_chunks)

    if not context_sufficient:
        response_text = build_secular_insufficient_response() if secular_mode else build_insufficient_response()
        sections = extract_sections(response_text, headings_insufficient)
        append_message(
            CompassMessage(
                session_id=session_id,
                role="assistant",
                content=response_text,
                created_at=datetime.utcnow().isoformat(),
                citations=citations if not secular_mode else None,
            )
        )
        return {
            "response": response_text,
            "sections": sections,
            "citations": citations,
            "contextSufficient": False,
            "secularMode": secular_mode,
        }

    history_messages = [
        {"role": entry.get("role", "user"), "content": entry.get("content", "")}
        for entry in history
    ]

    # Choose prompt based on mode
    system_prompt = RELATIONSHIP_COMPASS_SECULAR_PROMPT if secular_mode else RELATIONSHIP_COMPASS_GITA_SYSTEM_PROMPT

    # For secular mode, don't expose the Gita context to the user-facing prompt
    if secular_mode:
        base_user_message = (
            f"Relationship type: {relationship_type}\n"
            f"User's situation: {message}\n\n"
            f"Use the following wisdom themes to inform your advice (but NEVER mention these sources, verses, or any spiritual language):\n"
            f"{context_block}"
        )
    else:
        base_user_message = (
            f"Relationship type: {relationship_type}\n"
            f"User message: {message}\n\n"
            f"{context_block}"
        )

    # Try async multi-provider first, then sync fallback
    response_text = await call_ai_provider(
        [
            {"role": "system", "content": system_prompt},
            *history_messages,
            {"role": "user", "content": base_user_message},
        ]
    )

    # Validation differs by mode
    if secular_mode:
        # For secular mode, just check we have a response with content
        is_valid = bool(response_text and len(response_text.strip()) > 100)
        errors = [] if is_valid else ["Response too short or empty"]
    else:
        allowed_citations = build_allowed_citations(merged_chunks)
        if response_text:
            is_valid, errors = validate_response(response_text, allowed_citations)
        else:
            is_valid, errors = False, ["No response from model"]

        if not is_valid and response_text:
            fix_instruction = (
                "FORMAT + CITATION FIX: Follow the exact heading order, include citations where required, "
                "and ensure all verse references appear in the provided [GITA_CORE_WISDOM_CONTEXT]. "
                "If context is insufficient, return the insufficient-context format."
            )
            response_text = await call_ai_provider(
                [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": base_user_message},
                    {"role": "user", "content": fix_instruction},
                ]
            )
            if response_text:
                is_valid, errors = validate_response(response_text, allowed_citations)

    # If AI providers failed, use fallback response
    if not response_text or not is_valid:
        logger.warning("Relationship Compass AI failed, using fallback: %s", errors)
        response_text = generate_secular_response(merged_chunks, relationship_type, message) if secular_mode else generate_gita_based_response(merged_chunks, relationship_type, message)
        sections = extract_sections(response_text, headings_sufficient)
        append_message(
            CompassMessage(
                session_id=session_id,
                role="assistant",
                content=response_text,
                created_at=datetime.utcnow().isoformat(),
                citations=citations if not secular_mode else None,
            )
        )
        return {
            "response": response_text,
            "sections": sections,
            "citations": citations,
            "contextSufficient": True,
            "fallback": True,
            "secularMode": secular_mode,
            # AI Analysis - strict Gita psychology (included even in fallback)
            "ai_analysis": {
                "enabled": ai_analysis.analysis_depth == "ai_enhanced",
                "primary_emotion": ai_analysis.primary_emotion,
                "active_shad_ripu": ai_analysis.active_shad_ripu,
                "attachment_style": ai_analysis.attachment_style,
                "primary_yoga_path": ai_analysis.primary_yoga_path,
                "healing_verse": ai_analysis.healing_verse,
                "confidence": ai_analysis.confidence,
            },
        }

    sections = extract_sections(response_text, headings_sufficient)
    append_message(
        CompassMessage(
            session_id=session_id,
            role="assistant",
            content=response_text,
            created_at=datetime.utcnow().isoformat(),
            citations=citations if not secular_mode else None,
        )
    )
    return {
        "response": response_text,
        "sections": sections,
        "citations": citations,
        "contextSufficient": True,
        "secularMode": secular_mode,
        # AI Analysis - strict Gita psychology framework
        "ai_analysis": {
            "enabled": ai_analysis.analysis_depth == "ai_enhanced",
            "primary_emotion": ai_analysis.primary_emotion,
            "secondary_emotions": ai_analysis.secondary_emotions,
            "emotional_intensity": ai_analysis.emotional_intensity,
            "active_shad_ripu": ai_analysis.active_shad_ripu,
            "guna_analysis": ai_analysis.guna_analysis,
            "attachment_style": ai_analysis.attachment_style,
            "attachment_triggers": ai_analysis.attachment_triggers,
            "communication_style": ai_analysis.communication_style,
            "problematic_patterns": ai_analysis.problematic_patterns,
            "communication_needs": ai_analysis.communication_needs,
            "power_dynamic": ai_analysis.power_dynamic,
            "core_unmet_needs": ai_analysis.core_unmet_needs,
            "underlying_fears": ai_analysis.underlying_fears,
            "gita_concepts": ai_analysis.gita_concepts,
            "recommended_teachings": ai_analysis.recommended_teachings,
            "primary_yoga_path": ai_analysis.primary_yoga_path,
            "healing_verse": ai_analysis.healing_verse,
            "confidence": ai_analysis.confidence,
        },
    }


def _analyze_attachment_patterns(conflict: str) -> list[dict[str, Any]]:
    """Analyze the conflict for attachment style indicators."""
    conflict_lower = conflict.lower()
    detected = []

    for style, info in ATTACHMENT_PATTERNS.items():
        for indicator in info["indicators"]:
            if indicator in conflict_lower:
                detected.append({
                    "style": style,
                    "characteristics": info["characteristics"],
                    "gita_wisdom": info["gita_wisdom"],
                    "healing_focus": info["healing_focus"],
                })
                break  # Only add once per style

    return detected


def _analyze_communication_patterns(conflict: str) -> list[dict[str, Any]]:
    """Analyze the conflict for problematic communication patterns."""
    conflict_lower = conflict.lower()
    detected = []

    for pattern, info in COMMUNICATION_PATTERNS.items():
        for indicator in info["indicators"]:
            if indicator in conflict_lower:
                detected.append({
                    "pattern": pattern,
                    "gita_alternative": info["gita_alternative"],
                })
                break  # Only add once per pattern

    return detected


@router.post("/analyze")
async def analyze_relationship_pattern(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Analyze relationship patterns through Gita wisdom.

    This endpoint provides pattern analysis for recurring relationship issues,
    helping users understand their tendencies through the lens of Gita psychology.
    """
    conflict = payload.get("conflict", "")
    relationship_type_str = payload.get("relationship_type", "romantic")

    if not conflict.strip():
        raise HTTPException(status_code=400, detail="Please describe the pattern you're noticing")

    try:
        relationship_type = RelationshipType(relationship_type_str.lower())
    except ValueError:
        relationship_type = RelationshipType.ROMANTIC

    # Generate pattern analysis
    analysis = _generate_pattern_analysis(conflict, relationship_type)

    return {
        "status": "success",
        "pattern_analysis": analysis,
        "relationship_type": relationship_type.value,
        "gita_framework": "samskaras (deep impressions) and vasanas (tendencies)",
    }


@router.get("/teachings/{relationship_type}")
async def get_relationship_teachings(relationship_type: str) -> dict[str, Any]:
    """Get Gita teachings specific to a relationship type.

    Returns the core principles and teachings from the Bhagavad Gita
    that apply to the specified relationship type.
    """
    try:
        rel_type = RelationshipType(relationship_type.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown relationship type. Valid types: {[t.value for t in RelationshipType]}")

    teachings = RELATIONSHIP_GITA_TEACHINGS.get(rel_type, {})

    return {
        "status": "success",
        "relationship_type": rel_type.value,
        "core_principles": teachings.get("core_principles", []),
        "key_teaching": teachings.get("key_teaching", ""),
        "focus_areas": teachings.get("focus_verses", "").split()[:5],
    }


@router.get("/emotions")
async def get_emotion_insights() -> dict[str, Any]:
    """Get Gita-based insights for different relationship emotions.

    Returns the mapping of emotions to their understanding through
    Bhagavad Gita wisdom.
    """
    return {
        "status": "success",
        "emotion_insights": EMOTION_GITA_MAPPING,
        "note": "These insights help understand emotions through the lens of Gita wisdom, not to suppress but to witness and transform them.",
    }


@router.get("/health")
async def relationship_compass_health():
    """Health check with Gita wisdom and AI analysis availability status."""
    import os
    gita_verses_loaded = get_verses_count()
    wellness_ready = wellness_model is not None
    openai_key_present = bool(os.getenv("OPENAI_API_KEY", "").strip())

    return {
        "status": "ok" if (gita_verses_loaded > 0 or wellness_ready) else "degraded",
        "service": "relationship-compass",
        "version": "3.2",
        "provider": "gita_repository",
        "gita_grounding": {
            "verses_loaded": gita_verses_loaded,
            "repository_ready": gita_ready(),
            "fallback_available": True,
        },
        # NEW in v3.1: OpenAI-powered analysis status
        "ai_analysis": {
            "enabled": openai_key_present,
            "model": os.getenv("RELATIONSHIP_COMPASS_ANALYSIS_MODEL", "gpt-4o-mini"),
            "capabilities": [
                "emotional_analysis",
                "attachment_pattern_detection",
                "communication_analysis",
                "gita_concept_mapping",
                "enhanced_verse_retrieval",
            ] if openai_key_present else ["rule_based_fallback"],
            "fallback": "rule_based_gita_grounded",
        },
        "wellness_model_ready": wellness_ready,
        "relationship_types": [t.value for t in RelationshipType],
    }


def _build_enriched_input(
    conflict: str,
    relationship_type: RelationshipType,
    context: str | None,
    primary_emotion: str | None,
    desired_outcome: str | None,
) -> str:
    """Build enriched input with relationship context for deeper analysis."""
    parts = [conflict]

    # Add relationship type context
    type_context = {
        RelationshipType.ROMANTIC: "This involves my romantic partner/spouse.",
        RelationshipType.FAMILY: "This involves a family member (parent, sibling, child, or relative).",
        RelationshipType.FRIENDSHIP: "This involves a friend.",
        RelationshipType.WORKPLACE: "This involves someone at work (colleague, boss, or employee).",
        RelationshipType.SELF: "This is about my relationship with myself - self-criticism, self-doubt, or inner conflict.",
        RelationshipType.COMMUNITY: "This involves someone in my community or a group dynamic.",
    }
    parts.append(type_context.get(relationship_type, ""))

    # Add context if provided
    if context and context.strip():
        parts.append(f"Additional context: {context.strip()}")

    # Add emotion if provided
    if primary_emotion and primary_emotion.strip():
        parts.append(f"The primary emotion I'm experiencing is: {primary_emotion.strip()}")

    # Add desired outcome if provided
    if desired_outcome and desired_outcome.strip():
        parts.append(f"What I'm hoping for: {desired_outcome.strip()}")

    return " ".join(parts)


def _generate_pattern_analysis(conflict: str, relationship_type: RelationshipType) -> dict[str, str]:
    """Generate pattern analysis through Gita lens."""
    return {
        "samskaras_insight": "Samskaras are deep impressions from past experiences that shape our reactions. Your current pattern may be a replay of earlier relationship dynamics seeking resolution.",
        "vasanas_insight": "Vasanas are tendencies that drive behavior. Notice if this pattern appears across different relationships - it may point to an inner tendency seeking integration.",
        "gita_psychology": f"In {relationship_type.value} relationships, the Gita identifies attachment (raga) and aversion (dvesha) as root causes of suffering. Your pattern likely oscillates between these two.",
        "liberation_path": "Awareness is the first step to freedom. By witnessing your patterns without judgment, you begin the process of svadhyaya (self-study) that the Gita prescribes for liberation.",
    }


def _get_fallback_response(
    conflict: str,
    relationship_type: RelationshipType,
    primary_emotion: str | None,
    analysis_mode: AnalysisMode = AnalysisMode.STANDARD,
) -> dict[str, Any]:
    """Fallback when WellnessModel is unavailable - provides Gita wisdom + Attachment insights."""
    conflict_snippet = conflict[:80] + "..." if len(conflict) > 80 else conflict

    # Get emotion insight if available
    emotion_insight = ""
    if primary_emotion:
        emotion_insight = EMOTION_GITA_MAPPING.get(primary_emotion.lower(), "")

    # Get relationship-specific teachings
    teachings = RELATIONSHIP_GITA_TEACHINGS.get(relationship_type, {})

    # Analyze attachment patterns for fallback
    attachment_insights = _analyze_attachment_patterns(conflict)
    communication_issues = _analyze_communication_patterns(conflict)

    sections = {
        "sacred_witnessing": f"""Dear friend, I bow to the tender heart that brought you here seeking clarity. This situation - '{conflict_snippet}' - touches one of the deepest sources of human experience: our connections with others. That this relationship difficulty weighs on you reveals not weakness, but the depth of your capacity to love and be affected by others. The very fact that you seek understanding rather than simply reacting shows profound courage. Every awakened soul throughout time has faced moments exactly like this one. You are not alone in this struggle.""",

        "mirror_of_relationship": f"""Ancient wisdom teaches: 'Yatha drishti, tatha srishti' - as you see, so you create. All outer conflicts are mirrors of inner ones. Let us gently explore what this situation reveals about your inner landscape. What do you truly NEED beneath the surface of this conflict? To be seen? Respected? Understood? Safe? Valued? And what fear might be awakened here? The fear of abandonment? Of unworthiness? Of being unseen? The Gita teaches svadhyaya - sacred self-study - as the first step toward clarity. Understanding yourself is the first dharmic step.""",

        "others_inner_world": f"""Now, with daya (compassion) - not excuse-making - let us consider the other person's inner world. They too are a soul navigating their own fears, wounds, and conditioning. What unmet need might drive their behavior? What fear might they be acting from? The profound teaching is 'dukha dukhi jiva' - all beings suffer. 'Hurt people hurt people' is not excuse-making but understanding that their actions reflect their suffering, not your worth. The Gita teaches sama-darshana - equal vision - seeing the same consciousness struggling in all beings.""",

        "dharmic_path": f"""Dharma in relationships is NOT about winning - it is right action aligned with your highest self. The Gita teaches: 'Satyam bruyat priyam bruyat' - speak truth that is pleasant and beneficial. Truth without cruelty, honesty without weaponizing. Ask yourself: 'What would my wisest self do here - not my wounded self, not my ego, not my fear?' The goal is not to be RIGHT - it is to be at PEACE. Victory over another is hollow and temporary. Victory over your own reactive patterns is eternal liberation. {teachings.get('key_teaching', '')}""",

        "ego_illumination": """Ancient wisdom's most liberating teaching on conflict: Ahamkara (ego) wears many disguises - it disguises itself as 'being right,' as 'righteous hurt,' as 'standing up for myself,' as 'teaching them a lesson.' The EGO asks: 'How can I be RIGHT? How can I WIN?' The SOUL asks: 'How can I be at PEACE? How can I stay loving?' Most relationship conflicts are simply ego defending ego, wound poking wound. Tyaga - sacred surrender - means letting go of the need to win, the need to be right, the need to control their perception. This is not weakness but PROFOUND STRENGTH.""",

        "sacred_communication": """When you're ready, try this dharmic communication: 'When [specific situation]... I feel [emotion]... Because I need [underlying need]... What I'm hoping for is [request, not demand]...' Before speaking, ask: 'Am I speaking from wound or from wisdom?' 'What would LOVE do here?' 'Will this bring us closer to peace or further from it?' The Gita teaches 'priya vachana' - speak pleasant truth, never harsh truth harshly. Sometimes dharma is NOT speaking - sometimes it's listening first, fully and completely.""",

        "forgiveness_teaching": """If forgiveness is relevant here, know this sacred truth: Kshama (forgiveness) is NOT saying the harm was acceptable, NOT pretending it didn't hurt, NOT allowing it to continue. Kshama IS releasing the poison YOU drink hoping THEY suffer - putting down the hot coal you've been carrying - freeing YOURSELF from the prison of resentment. 'Kshama vira bhushanam' - Forgiveness is the ornament of the brave. It is a gift to yourself, not to them. The bravest act is forgiving while holding healthy boundaries. Forgiveness unfolds when you're ready - it cannot be forced.""",

        "eternal_anchor": f"""Carry this eternal truth: 'Atma-tripti' - you are ALREADY complete within yourself. Your peace does NOT depend on another person's behavior. Another person cannot give you your worth (you already have it), cannot take away your worth (they never had that power), cannot complete you (you were never incomplete). 'Purnatva' - fullness: You are whole, even in heartbreak. You came into this life whole. You will leave this life whole. No relationship conflict - no matter how painful - changes what you truly are. Beneath the pain, the eternal witness remains untouched, unharmed, complete. 💙""",
    }

    # Build full response
    response = "\n\n".join([
        sections["sacred_witnessing"],
        sections["mirror_of_relationship"],
        sections["others_inner_world"],
        sections["dharmic_path"],
        sections["ego_illumination"],
        sections["sacred_communication"],
        sections["forgiveness_teaching"],
        sections["eternal_anchor"],
    ])

    return {
        "status": "success",
        "compass_guidance": sections,
        "response": response,
        "gita_verses_used": 0,
        "relationship_type": relationship_type.value,
        "analysis_mode": analysis_mode.value,
        "relationship_teachings": {
            "core_principles": teachings.get("core_principles", []),
            "key_teaching": teachings.get("key_teaching", ""),
        },
        "emotion_insight": emotion_insight,
        "model": "fallback",
        "provider": "kiaan",
        # Enhanced v2.0 fields for fallback
        "psychological_framework": "Attachment Theory + Communication Psychology",
        "attachment_insights": attachment_insights,
        "communication_patterns": communication_issues,
        "behavioral_patterns": [],
        "cached": False,
        "latency_ms": 0.0,
    }


def _get_core_relationship_gita_wisdom() -> str:
    """Core relationship-focused Gita wisdom for fallback when verse retrieval fails."""
    return """[GITA_CORE_WISDOM_CONTEXT]
Essential Bhagavad Gita teachings for relationships:

- BG 6.32: "One who sees equality everywhere, seeing their own pleasure and pain in all beings, is the highest yogi."
  Principle: Sama-darshana (equal vision) - see the divine struggling in others as in yourself.
  Application: In conflict, remember they too are a soul navigating fears and wounds.

- BG 12.13-14: "One who is not envious but is a kind friend to all living entities, free from false ego and attachment... is very dear to Me."
  Principle: Maitri (friendship to all), freedom from ahamkara (ego).
  Application: Release the need to win; be a friend even in disagreement.

- BG 16.1-3: "Fearlessness, purity of heart, truthfulness, freedom from anger, compassion to all beings, absence of fault-finding..."
  Principle: Daivi sampat (divine qualities) including ahimsa, satya, kshama.
  Application: Speak truth kindly, release anger, practice forgiveness.

- BG 2.57: "One who is without attachment, who neither rejoices nor hates when obtaining good or evil, is firmly fixed in perfect knowledge."
  Principle: Sthitaprajna (steady wisdom) - unmoved by praise or blame.
  Application: Your worth doesn't depend on their approval or behavior.

- BG 3.35: "It is better to perform one's own dharma imperfectly than to perform another's dharma perfectly."
  Principle: Svadharma - honor your unique path and role.
  Application: Focus on YOUR right action, not controlling their response.

- BG 17.15: "Austerity of speech consists in speaking words that are truthful, pleasing, beneficial, and not agitating to others."
  Principle: Priya vachana - pleasant truth, beneficial speech.
  Application: Before speaking, ask: Is it true? Is it kind? Is it necessary?

- BG 18.66: "Abandon all varieties of dharmas and surrender unto Me alone. I shall deliver you from all sinful reactions. Do not fear."
  Principle: Sharanagati (surrender) - release anxiety to a larger order.
  Application: When overwhelmed, surrender the outcome while doing your best.
[/GITA_CORE_WISDOM_CONTEXT]"""


def _get_gita_grounded_fallback(
    conflict: str,
    gita_verses: list[dict[str, Any]],
    relationship_type: RelationshipType,
    primary_emotion: str | None,
    analysis_mode: AnalysisMode = AnalysisMode.STANDARD
) -> dict[str, Any]:
    """Gita-grounded fallback using actual verses from the 701-verse repository.

    This ensures ALL guidance is rooted in real Gita wisdom, not generic text.
    Even when AI is unavailable, responses cite actual verses.
    """
    # Use the shared service to generate fallback
    fallback_result = generate_relationship_compass_fallback(
        user_input=conflict,
        verses=gita_verses,
        relationship_type=relationship_type.value,
    )

    # Get emotion insight if available
    emotion_insight = ""
    if primary_emotion:
        emotion_insight = EMOTION_GITA_MAPPING.get(primary_emotion.lower(), "")

    # Get relationship-specific teachings
    teachings = RELATIONSHIP_GITA_TEACHINGS.get(relationship_type, {})

    # Analyze patterns
    attachment_insights = _analyze_attachment_patterns(conflict)
    communication_issues = _analyze_communication_patterns(conflict)

    return {
        "status": "success",
        "compass_guidance": fallback_result["sections"],
        "response": fallback_result["response"],
        "gita_verses_used": fallback_result["gita_verses_used"],
        "relationship_type": relationship_type.value,
        "analysis_mode": analysis_mode.value,
        "relationship_teachings": {
            "core_principles": teachings.get("core_principles", []),
            "key_teaching": teachings.get("key_teaching", ""),
        },
        "emotion_insight": emotion_insight,
        "model": "gita_fallback",
        "provider": "gita_repository",
        # Gita-grounded fields (v3.0)
        "gita_context": {
            "verses_retrieved": len(gita_verses),
            "sources": [
                {"file": "gita_verses_complete.json", "reference": v["ref"]}
                for v in fallback_result.get("verses", [])
            ],
        },
        "svadhyaya_insights": attachment_insights,
        "communication_patterns": communication_issues,
        "fallback": True,
        "cached": False,
        "latency_ms": 0.0,
    }


# ══════════════════════════════════════════════════════════════════════════════
# UNIFIED SECULAR ENDPOINT - Wisdom Core + Engine + OpenAI Synthesis
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/unified-clarity")
async def unified_clarity(
    payload: UnifiedCompassRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Unified secular relationship clarity powered by Wisdom Core + OpenAI.

    This endpoint combines the best of both engines:
    1. Engine analysis (mode, emotion, mechanism detection)
    2. Wisdom Core retrieval (static principles + dynamic Gita verses + learned wisdom)
    3. OpenAI synthesis (generates secular, grounded guidance from wisdom context)

    Response structure:
    - mode: Detected relationship mode
    - analysis: Full emotional/mechanism analysis
    - sections: Structured guidance (6 sections including Deeper Insight)
    - wisdom_metadata: Sources used (principles, verses, learned wisdom counts)

    The response is fully secular — all wisdom is presented in modern language
    without religious references, verse citations, or spiritual terminology.
    """
    import time

    start_time = time.time()
    message = payload.message.strip()
    session_id = payload.session_id.strip()
    relationship_type = (payload.relationship_type or "romantic").strip().lower()

    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required")

    # Store user message
    ensure_session(session_id)
    history = get_recent_messages(session_id, 20)
    append_message(
        CompassMessage(
            session_id=session_id,
            role="user",
            content=message,
            created_at=datetime.utcnow().isoformat(),
        )
    )

    # Step 1: Run analysis (mode, emotion, mechanism detection)
    analysis = await engine_ai_analysis(message, relationship_type)

    logger.info(
        f"Unified Compass analysis: mode={analysis.mode}, "
        f"emotion={analysis.primary_emotion}, "
        f"mechanism={analysis.mechanism}, "
        f"safety={analysis.safety_concern}, "
        f"confidence={analysis.confidence:.2f}"
    )

    # Step 2: Gather wisdom from RelationshipWisdomCore
    rwc = get_relationship_wisdom_core()
    wisdom_context = await rwc.gather_wisdom(
        db=db,
        situation=message,
        mode=analysis.mode,
        emotion=analysis.primary_emotion,
        mechanism=analysis.mechanism,
        relationship_type=relationship_type,
        limit=6,
    )

    # Step 3: Synthesize guidance via OpenAI with wisdom context
    synthesizer = get_wisdom_synthesizer()
    result = await synthesizer.synthesize(
        message=message,
        wisdom_context=wisdom_context,
        analysis=analysis,
        session_history=history,
        relationship_type=relationship_type,
    )

    # Store assistant response
    append_message(
        CompassMessage(
            session_id=session_id,
            role="assistant",
            content=result.response_text,
            created_at=datetime.utcnow().isoformat(),
        )
    )

    latency_ms = (time.time() - start_time) * 1000

    # Build response
    response: dict[str, Any] = {
        "response": result.response_text,
        "sections": result.sections,
        "analysis": {
            "mode": analysis.mode,
            "primary_emotion": analysis.primary_emotion,
            "secondary_emotions": analysis.secondary_emotions,
            "emotional_intensity": analysis.emotional_intensity,
            "mechanism": analysis.mechanism,
            "mechanism_detail": analysis.mechanism_detail,
            "power_dynamic": analysis.power_dynamic,
            "boundary_needed": analysis.boundary_needed,
            "safety_concern": analysis.safety_concern,
            "pattern_identified": analysis.pattern_identified,
            "user_contribution": analysis.user_contribution,
            "core_need": analysis.core_need,
            "confidence": analysis.confidence,
            "analysis_depth": analysis.analysis_depth,
        },
        "provider": result.provider,
        "model": result.model,
        "latency_ms": round(latency_ms, 1),
    }

    # Wisdom metadata (if requested)
    if payload.include_wisdom_sources:
        response["wisdom_metadata"] = {
            "total_sources": wisdom_context.total_sources,
            "principles_used": len(wisdom_context.principles),
            "gita_verses_found": len(wisdom_context.gita_verses),
            "learned_wisdom_found": len(wisdom_context.learned_wisdom),
            "wisdom_confidence": wisdom_context.confidence,
            "principles": [
                {
                    "id": p.id,
                    "principle": p.principle,
                    "explanation": p.explanation,
                }
                for p in wisdom_context.principles[:4]
            ],
        }

    return response


@router.get("/unified-health")
async def unified_health() -> dict[str, Any]:
    """Health check for the unified secular Relationship Compass."""
    import os

    openai_key = bool(os.getenv("OPENAI_API_KEY", "").strip())

    # Check provider manager
    provider_available = False
    try:
        from backend.services.ai.providers.provider_manager import get_provider_manager
        pm = get_provider_manager()
        provider_available = pm is not None
    except Exception:
        pass

    # Check WisdomCore
    wisdom_core_ready = False
    try:
        rwc = get_relationship_wisdom_core()
        test_principles = rwc.get_principles(mode="conflict", limit=1)
        wisdom_core_ready = len(test_principles) > 0
    except Exception:
        pass

    return {
        "status": "ok",
        "service": "relationship-compass-unified",
        "version": "4.0",
        "ai_available": openai_key or provider_available,
        "provider_manager": provider_available,
        "wisdom_core_ready": wisdom_core_ready,
        "static_principles": len(RELATIONSHIP_PRINCIPLES) if wisdom_core_ready else 0,
        "fallback": "wisdom_enhanced_rule_based",
        "capabilities": [
            "mode_detection",
            "emotion_precision",
            "mechanism_identification",
            "safety_detection",
            "wisdom_core_integration",
            "static_principles",
            "dynamic_gita_retrieval",
            "learned_wisdom",
            "openai_synthesis",
            "secular_framing",
            "conversation_history",
        ],
    }


# Import for the health endpoint
from backend.services.relationship_wisdom_core import RELATIONSHIP_PRINCIPLES
