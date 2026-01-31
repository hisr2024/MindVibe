"""Relationship Compass - Ultra-Deep Relationship Guidance Through Bhagavad Gita Wisdom.

This router provides comprehensive relationship conflict navigation using the enhanced WellnessModel
with deep psychological analysis strictly through the lens of Bhagavad Gita's 700+ verses.

PATTERN:
1. PROBLEM ACKNOWLEDGED - Deep validation of the user's relationship pain
2. RELATIONSHIP TYPE ANALYZED - Understanding the specific dynamics (romantic, family, friendship, workplace, self)
3. PSYCHOLOGICAL LAYERS EXPLORED - 5-layer analysis through Gita lens
4. GITA VERSES SEARCHED - Find best suited verses from 700+ verse database
5. DHARMIC PATH ILLUMINATED - Solution strictly through Bhagavad Gita wisdom

Relationship Compass focuses on:
- Dharma (right action in relationships)
- Daya (compassion for self and others)
- Kshama (forgiveness as liberation)
- Ahimsa (non-violent communication)
- Sama-darshana (equal vision - seeing the divine in all)
- Svadhyaya (self-study to understand our own patterns)
"""

from __future__ import annotations

import logging
from typing import Any
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.wellness_model import WellnessModel, WellnessTool, get_wellness_model

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

# Initialize WellnessModel
wellness_model: WellnessModel | None = None
try:
    wellness_model = get_wellness_model()
    logger.info("✅ Relationship Compass: WellnessModel initialized with 700+ Gita verses")
except Exception as e:
    logger.warning(f"⚠️ Relationship Compass: WellnessModel unavailable: {e}")


@router.post("/guide")
async def get_relationship_guidance(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate ultra-deep relationship guidance using Bhagavad Gita wisdom.

    This endpoint provides comprehensive relationship analysis through the lens
    of the Gita's 700+ verses, acting as a spiritual psychologist.

    Pattern:
    1. Receive user's relationship conflict with type and context
    2. Analyze through psychological layers using Gita framework
    3. Fetch relevant Gita verses (dharma/compassion/forgiveness focus)
    4. Generate warm, wise, deeply transformative response

    Returns structured sections:
    - sacred_witnessing: Deep acknowledgment of their pain
    - mirror_of_relationship: What the conflict reveals about inner patterns
    - others_inner_world: Compassionate understanding of the other
    - dharmic_path: Right action aligned with highest self
    - ego_illumination: How ego perpetuates conflict
    - sacred_communication: Practical words to use
    - forgiveness_teaching: Liberation through kshama
    - eternal_anchor: Timeless truth for this soul
    """
    # Extract fields with validation
    conflict = payload.get("conflict", "")
    relationship_type_str = payload.get("relationship_type", "romantic")
    context = payload.get("context", "")
    primary_emotion = payload.get("primary_emotion", "")
    desired_outcome = payload.get("desired_outcome", "")

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

    # Build enriched input with context
    enriched_input = _build_enriched_input(
        conflict=conflict,
        relationship_type=relationship_type,
        context=context,
        primary_emotion=primary_emotion,
        desired_outcome=desired_outcome,
    )

    if not wellness_model:
        logger.error("Relationship Compass: WellnessModel not initialized")
        return _get_fallback_response(conflict, relationship_type, primary_emotion)

    try:
        # Use the unified WellnessModel with enriched input
        result = await wellness_model.generate_response(
            tool=WellnessTool.RELATIONSHIP_COMPASS,
            user_input=enriched_input,
            db=db,
        )

        # Get relationship-specific teachings
        relationship_teachings = RELATIONSHIP_GITA_TEACHINGS.get(relationship_type, {})
        emotion_insight = EMOTION_GITA_MAPPING.get(primary_emotion.lower(), "") if primary_emotion else ""

        return {
            "status": "success",
            "compass_guidance": result.sections,
            "response": result.content,
            "gita_verses_used": result.gita_verses_used,
            "relationship_type": relationship_type.value,
            "relationship_teachings": {
                "core_principles": relationship_teachings.get("core_principles", []),
                "key_teaching": relationship_teachings.get("key_teaching", ""),
            },
            "emotion_insight": emotion_insight,
            "model": result.model,
            "provider": result.provider,
        }

    except Exception as e:
        logger.exception(f"Relationship Compass error: {e}")
        return _get_fallback_response(conflict, relationship_type, primary_emotion)


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
    """Health check for the Relationship Compass service."""
    return {
        "status": "ok",
        "service": "relationship-compass",
        "provider": "kiaan",
        "wellness_model_available": wellness_model is not None,
        "gita_verses_available": True,
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
) -> dict[str, Any]:
    """Fallback when WellnessModel is unavailable - still provides Gita wisdom."""
    conflict_snippet = conflict[:80] + "..." if len(conflict) > 80 else conflict

    # Get emotion insight if available
    emotion_insight = ""
    if primary_emotion:
        emotion_insight = EMOTION_GITA_MAPPING.get(primary_emotion.lower(), "")

    # Get relationship-specific teachings
    teachings = RELATIONSHIP_GITA_TEACHINGS.get(relationship_type, {})

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
        "relationship_teachings": {
            "core_principles": teachings.get("core_principles", []),
            "key_teaching": teachings.get("key_teaching", ""),
        },
        "emotion_insight": emotion_insight,
        "model": "fallback",
        "provider": "kiaan",
    }
