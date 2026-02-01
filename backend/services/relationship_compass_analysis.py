"""AI-powered conflict analysis for Relationship Compass using OpenAI API.

This module provides deep analysis of relationship conflicts using OpenAI's GPT models
to understand emotions, patterns, and dynamics that simple keyword matching cannot detect.

Key capabilities:
- Deep emotional analysis beyond simple keyword matching
- Nuanced attachment pattern detection
- Communication style assessment
- Relationship dynamics understanding
- Context-aware Gita concept mapping

The analysis results enhance verse retrieval and guidance generation by providing
richer context for the AI to work with.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from typing import Any

from openai import OpenAI

logger = logging.getLogger(__name__)

# Models for analysis
ANALYSIS_MODEL = os.getenv("RELATIONSHIP_COMPASS_ANALYSIS_MODEL", "gpt-4o-mini")


@dataclass
class ConflictAnalysis:
    """Structured analysis of a relationship conflict."""

    # Primary emotional state
    primary_emotion: str = ""
    secondary_emotions: list[str] = field(default_factory=list)
    emotional_intensity: str = "moderate"  # low, moderate, high, overwhelming

    # Attachment patterns
    attachment_style: str = ""  # anxious, avoidant, disorganized, secure
    attachment_indicators: list[str] = field(default_factory=list)
    attachment_triggers: list[str] = field(default_factory=list)

    # Communication patterns
    communication_style: str = ""
    problematic_patterns: list[str] = field(default_factory=list)
    communication_needs: list[str] = field(default_factory=list)

    # Relationship dynamics
    power_dynamic: str = ""  # balanced, pursuer-distancer, over-under, etc.
    core_unmet_needs: list[str] = field(default_factory=list)
    underlying_fears: list[str] = field(default_factory=list)

    # Gita-relevant concepts
    gita_concepts: list[str] = field(default_factory=list)
    recommended_teachings: list[str] = field(default_factory=list)

    # Analysis metadata
    confidence: float = 0.0
    analysis_depth: str = "standard"
    raw_analysis: dict[str, Any] = field(default_factory=dict)


# Core Gita wisdom for relationship analysis - grounded in the 701-verse repository
GITA_EMOTION_MAPPING = """
GITA EMOTION-TO-CONCEPT MAPPING (from MindVibe's 701-verse repository):

EMOTIONS → GITA CONCEPTS:
- Hurt → Raga (attachment) to unmet expectations; Dukha (suffering) from unfulfilled desires
- Anger → Krodha (wrath) - one of three gates to hell (BG 16.21); arises from thwarted desire (BG 2.62-63)
- Fear → Bhaya; opposite is Abhaya (fearlessness) from knowing eternal nature (BG 2.20, 4.10)
- Confusion → Moha (delusion) clouding Buddhi (discriminative wisdom); Arjuna's state in Chapter 1
- Guilt → Carrying past into present; Gita teaches each moment is new (BG 18.66 - surrender past sins)
- Loneliness → Separation from Atman (self), not from others; divine dwells in every heart (BG 18.61)
- Jealousy → Matsarya; comparing one's journey to another's; cure is Svadharma (BG 3.35)
- Betrayal → Expecting permanence; people act from conditioning (Prakriti); BG 18.17 on non-attachment
- Resentment → Drinking poison hoping another suffers; Kshama (forgiveness) liberates self (BG 16.2)
- Grief → Shoka; Krishna addresses Arjuna's grief extensively in Chapter 2

ATTACHMENT PATTERNS → GITA WISDOM:
- Anxious attachment → Needs Atma-tripti (self-contentment); completeness from within, not validation
- Avoidant attachment → Needs Sangha (sacred connection); interdependence is strength (BG 3.10-11)
- Disorganized attachment → Needs Yoga (integration) through Sakshi Bhava (witness consciousness)
- Secure attachment → Embodies Purnatva (fullness) - complete in self, open to others

COMMUNICATION PATTERNS → GITA ALTERNATIVES:
- Criticism → Satya with Priya (truth with kindness) - BG 17.15 on austerity of speech
- Contempt → Sama-darshana (equal vision) - seeing divine in all (BG 6.32)
- Defensiveness → Shravana (deep listening) - receiving feedback as information
- Stonewalling → Taking space with intention - "I need time to process, I'll return"

RELATIONSHIP TYPES → GITA FOCUS:
- Romantic → Sama-darshana, Nishkama Prema (desireless love) - BG 12, 16
- Family → Svadharma (sacred duty), Kula-dharma (family righteousness) - BG 2, 18
- Friendship → Maitri (unconditional friendship), Suhrit (well-wisher) - BG 6.9
- Workplace → Karma Yoga (selfless action), Yogah Karmasu Kaushalam (excellence) - BG 2.47, 3.19
- Self → Atma-jnana (self-knowledge), Svadhyaya (self-study) - BG 6, 13
- Community → Lokasangraha (welfare of world), Sarva-bhuta-hite (good of all) - BG 12.4

KEY GITA VERSES FOR RELATIONSHIPS:
- BG 2.47: "Your right is to action alone, never to its fruits" (detachment from outcome)
- BG 2.62-63: Chain of anger: desire → attachment → anger → delusion → memory loss → destruction
- BG 6.32: "One who sees equality everywhere, seeing pleasure/pain in all, is highest yogi"
- BG 12.13-14: "One free from malice, a kind friend to all, free from ego... is dear to Me"
- BG 16.1-3: Divine qualities: fearlessness, purity, truthfulness, freedom from anger, compassion
- BG 17.15: "Speech that causes no distress, truthful, pleasant, beneficial"
- BG 18.66: "Abandon all dharmas and surrender unto Me. I shall deliver you from all sins"
"""

# System prompt for conflict analysis - GITA-GROUNDED
CONFLICT_ANALYSIS_PROMPT = f"""You are a relationship wisdom guide deeply rooted in Bhagavad Gita teachings.
Your analysis must be grounded in the Gita's psychology of emotions, patterns, and relationships.

{GITA_EMOTION_MAPPING}

Analyze the user's relationship conflict using this Gita wisdom framework.
Provide a structured JSON response.

Your analysis must include:

1. EMOTIONAL ANALYSIS (using Gita emotion-to-concept mapping)
   - primary_emotion: The dominant emotion (hurt, anger, fear, sadness, confusion, betrayal, etc.)
   - secondary_emotions: Other present emotions (array)
   - emotional_intensity: low | moderate | high | overwhelming
   - emotional_triggers: What specifically triggered these emotions (in Gita terms: what raga/dvesha is activated)

2. ATTACHMENT PATTERN (using Gita wisdom mapping)
   - attachment_style: anxious | avoidant | disorganized | secure | mixed
   - attachment_indicators: Specific phrases/behaviors indicating this style
   - attachment_triggers: What attachment wounds are being activated (e.g., "fear of abandonment" → need for Atma-tripti)

3. COMMUNICATION ANALYSIS (using Gita alternatives)
   - communication_style: assertive | passive | aggressive | passive-aggressive | avoidant
   - problematic_patterns: Array of patterns present (criticism, contempt, defensiveness, stonewalling)
   - communication_needs: What the person needs based on Gita principles (e.g., "practice Satya with Priya")

4. RELATIONSHIP DYNAMICS
   - power_dynamic: balanced | pursuer-distancer | over-functioning/under-functioning | enmeshed | disengaged
   - core_unmet_needs: Needs not being met (safety, respect, appreciation, autonomy, connection, understanding)
   - underlying_fears: Deeper fears in Gita terms (abandonment → separation from self, rejection → seeking validation outside)

5. GITA WISDOM MAPPING (CRITICAL - must use actual verses)
   - gita_concepts: Relevant Gita concepts from the mapping above (krodha, raga, dvesha, moha, kshama, sama-darshana, svadhyaya, ahimsa, etc.)
   - recommended_teachings: Specific Gita verses that apply (e.g., "BG 2.62-63 on anger chain", "BG 6.32 on equal vision")

6. CONFIDENCE & DEPTH
   - confidence: 0.0-1.0 how confident you are in this analysis
   - analysis_notes: Key observation in Gita terms

IMPORTANT:
- ALL analysis must be grounded in Gita wisdom
- recommended_teachings MUST cite actual Gita verses (BG chapter:verse format)
- gita_concepts MUST use terms from the mapping above
- Connect modern emotional states to their Gita equivalents

Respond ONLY with valid JSON. No markdown, no explanation outside JSON.

Example output format:
{{
  "primary_emotion": "hurt",
  "secondary_emotions": ["anger", "fear"],
  "emotional_intensity": "high",
  "emotional_triggers": ["raga (attachment) to unmet expectations", "perceived dismissal triggering dvesha"],
  "attachment_style": "anxious",
  "attachment_indicators": ["seeking reassurance", "fear of abandonment language"],
  "attachment_triggers": ["need for Atma-tripti (self-contentment)", "seeking validation from outside"],
  "communication_style": "passive-aggressive",
  "problematic_patterns": ["criticism", "defensiveness"],
  "communication_needs": ["practice Satya with Priya (truth with kindness)", "Shravana (deep listening)"],
  "power_dynamic": "pursuer-distancer",
  "core_unmet_needs": ["connection", "understanding", "safety"],
  "underlying_fears": ["abandonment (separation from self)", "not being enough (forgetting Purnatva)"],
  "gita_concepts": ["raga", "krodha", "moha", "kshama", "atma-tripti"],
  "recommended_teachings": ["BG 2.62-63 on anger chain", "BG 6.32 on equal vision", "BG 12.13-14 on friendship"],
  "confidence": 0.85,
  "analysis_notes": "Anxious attachment showing need for Atma-tripti; criticism-defensiveness cycle needs Sama-darshana"
}}"""


def analyze_conflict_with_ai(
    conflict: str,
    relationship_type: str = "romantic",
    context: str | None = None,
    primary_emotion: str | None = None,
) -> ConflictAnalysis:
    """Analyze a relationship conflict using OpenAI API for deep understanding.

    This function uses GPT to:
    1. Identify nuanced emotional states beyond simple keywords
    2. Detect attachment patterns from context and language
    3. Analyze communication dynamics
    4. Map to relevant Gita concepts for guidance

    Args:
        conflict: The user's description of their relationship situation
        relationship_type: Type of relationship (romantic, family, friendship, etc.)
        context: Additional context about the relationship history
        primary_emotion: User-stated primary emotion if provided

    Returns:
        ConflictAnalysis with structured insights for enhanced guidance
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        logger.warning("OPENAI_API_KEY not set, falling back to rule-based analysis")
        return _rule_based_analysis(conflict, relationship_type, primary_emotion)

    # Build user message with all context
    user_message = f"""Relationship type: {relationship_type}

Conflict/Situation:
{conflict}"""

    if context:
        user_message += f"\n\nAdditional context: {context}"

    if primary_emotion:
        user_message += f"\n\nUser states their primary emotion is: {primary_emotion}"

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=ANALYSIS_MODEL,
            messages=[
                {"role": "system", "content": CONFLICT_ANALYSIS_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,  # Lower temperature for more consistent analysis
            max_tokens=800,
            timeout=15.0,
        )

        content = response.choices[0].message.content if response.choices else None
        if not content:
            logger.warning("Empty response from OpenAI analysis, using fallback")
            return _rule_based_analysis(conflict, relationship_type, primary_emotion)

        # Parse JSON response
        try:
            # Clean up response if needed (remove markdown code blocks)
            content = content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()

            analysis_data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse analysis JSON: {e}, using fallback")
            return _rule_based_analysis(conflict, relationship_type, primary_emotion)

        # Build ConflictAnalysis from response
        analysis = ConflictAnalysis(
            primary_emotion=analysis_data.get("primary_emotion", ""),
            secondary_emotions=analysis_data.get("secondary_emotions", []),
            emotional_intensity=analysis_data.get("emotional_intensity", "moderate"),
            attachment_style=analysis_data.get("attachment_style", ""),
            attachment_indicators=analysis_data.get("attachment_indicators", []),
            attachment_triggers=analysis_data.get("attachment_triggers", []),
            communication_style=analysis_data.get("communication_style", ""),
            problematic_patterns=analysis_data.get("problematic_patterns", []),
            communication_needs=analysis_data.get("communication_needs", []),
            power_dynamic=analysis_data.get("power_dynamic", ""),
            core_unmet_needs=analysis_data.get("core_unmet_needs", []),
            underlying_fears=analysis_data.get("underlying_fears", []),
            gita_concepts=analysis_data.get("gita_concepts", []),
            recommended_teachings=analysis_data.get("recommended_teachings", []),
            confidence=float(analysis_data.get("confidence", 0.7)),
            analysis_depth="ai_enhanced",
            raw_analysis=analysis_data,
        )

        logger.info(
            f"✅ AI conflict analysis complete: "
            f"emotion={analysis.primary_emotion}, "
            f"attachment={analysis.attachment_style}, "
            f"confidence={analysis.confidence:.2f}"
        )

        return analysis

    except Exception as e:
        logger.error(f"OpenAI analysis failed: {e}, using fallback")
        return _rule_based_analysis(conflict, relationship_type, primary_emotion)


async def analyze_conflict_with_ai_async(
    conflict: str,
    relationship_type: str = "romantic",
    context: str | None = None,
    primary_emotion: str | None = None,
) -> ConflictAnalysis:
    """Async version of conflict analysis using multi-provider support.

    Tries the AI provider manager first for multi-provider fallback,
    then falls back to synchronous OpenAI if needed.
    """
    # Try multi-provider manager first
    try:
        from backend.services.ai.providers.provider_manager import get_provider_manager
        provider_manager = get_provider_manager()

        if provider_manager:
            # Build user message
            user_message = f"""Relationship type: {relationship_type}

Conflict/Situation:
{conflict}"""

            if context:
                user_message += f"\n\nAdditional context: {context}"

            if primary_emotion:
                user_message += f"\n\nUser states their primary emotion is: {primary_emotion}"

            response = await provider_manager.chat(
                messages=[
                    {"role": "system", "content": CONFLICT_ANALYSIS_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.3,
                max_tokens=800,
            )

            if response and response.content:
                try:
                    content = response.content.strip()
                    if content.startswith("```"):
                        content = content.split("```")[1]
                        if content.startswith("json"):
                            content = content[4:]
                    content = content.strip()

                    analysis_data = json.loads(content)

                    analysis = ConflictAnalysis(
                        primary_emotion=analysis_data.get("primary_emotion", ""),
                        secondary_emotions=analysis_data.get("secondary_emotions", []),
                        emotional_intensity=analysis_data.get("emotional_intensity", "moderate"),
                        attachment_style=analysis_data.get("attachment_style", ""),
                        attachment_indicators=analysis_data.get("attachment_indicators", []),
                        attachment_triggers=analysis_data.get("attachment_triggers", []),
                        communication_style=analysis_data.get("communication_style", ""),
                        problematic_patterns=analysis_data.get("problematic_patterns", []),
                        communication_needs=analysis_data.get("communication_needs", []),
                        power_dynamic=analysis_data.get("power_dynamic", ""),
                        core_unmet_needs=analysis_data.get("core_unmet_needs", []),
                        underlying_fears=analysis_data.get("underlying_fears", []),
                        gita_concepts=analysis_data.get("gita_concepts", []),
                        recommended_teachings=analysis_data.get("recommended_teachings", []),
                        confidence=float(analysis_data.get("confidence", 0.7)),
                        analysis_depth="ai_enhanced",
                        raw_analysis=analysis_data,
                    )

                    logger.info(
                        f"✅ AI conflict analysis (async): "
                        f"emotion={analysis.primary_emotion}, "
                        f"attachment={analysis.attachment_style}, "
                        f"confidence={analysis.confidence:.2f}, "
                        f"provider={response.provider}"
                    )

                    return analysis

                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse async analysis JSON: {e}")

    except Exception as e:
        logger.warning(f"Async provider manager failed: {e}, trying sync fallback")

    # Fall back to synchronous analysis
    return analyze_conflict_with_ai(conflict, relationship_type, context, primary_emotion)


def _rule_based_analysis(
    conflict: str,
    relationship_type: str,
    primary_emotion: str | None,
) -> ConflictAnalysis:
    """Fallback rule-based analysis when AI is unavailable.

    Uses keyword matching with Gita-grounded mappings to provide basic analysis.
    All patterns map to Gita concepts from the 701-verse repository.
    """
    conflict_lower = conflict.lower()

    # Detect primary emotion from keywords - mapped to Gita concepts
    emotion_keywords = {
        "hurt": ["hurt", "wounded", "pain", "ache", "broken"],
        "anger": ["angry", "furious", "mad", "frustrated", "irritated", "rage"],
        "fear": ["scared", "afraid", "anxious", "worried", "terrified", "nervous"],
        "sadness": ["sad", "depressed", "down", "lonely", "grief", "crying"],
        "confusion": ["confused", "lost", "don't understand", "bewildered", "uncertain"],
        "betrayal": ["betrayed", "cheated", "lied", "deceived", "backstabbed"],
        "resentment": ["resent", "bitter", "grudge", "can't forgive"],
        "guilt": ["guilty", "blame myself", "my fault", "ashamed"],
        "jealousy": ["jealous", "envious", "comparing", "insecure about"],
    }

    detected_emotion = primary_emotion or ""
    secondary_emotions = []

    for emotion, keywords in emotion_keywords.items():
        for kw in keywords:
            if kw in conflict_lower:
                if not detected_emotion:
                    detected_emotion = emotion
                elif emotion != detected_emotion:
                    secondary_emotions.append(emotion)
                break

    # Detect attachment style - with Gita wisdom mapping
    attachment_keywords = {
        "anxious": ["abandoned", "leave me", "not enough", "clingy", "worried they'll leave", "need reassurance", "insecure"],
        "avoidant": ["space", "too close", "suffocating", "independent", "don't need", "walls up", "pulling away"],
        "disorganized": ["confused", "push pull", "hot cold", "mixed signals", "want closeness but scared"],
        "secure": ["communicate", "trust", "healthy boundaries", "comfortable", "open with"],
    }

    # Gita wisdom for each attachment style
    attachment_gita_mapping = {
        "anxious": "Need for Atma-tripti (self-contentment) - BG 2.55",
        "avoidant": "Need for Sangha (sacred connection) - BG 3.10-11",
        "disorganized": "Need for Yoga (integration) through Sakshi Bhava - BG 6.19",
        "secure": "Embodies Purnatva (fullness) - BG 5.21",
    }

    attachment_style = ""
    attachment_indicators = []
    attachment_triggers = []

    for style, keywords in attachment_keywords.items():
        for kw in keywords:
            if kw in conflict_lower:
                if not attachment_style:
                    attachment_style = style
                    attachment_triggers.append(attachment_gita_mapping.get(style, ""))
                attachment_indicators.append(kw)

    # Detect communication patterns - with Gita alternatives
    communication_patterns = {
        "criticism": ["you always", "you never", "what's wrong with you", "you're so", "your problem"],
        "contempt": ["ridiculous", "pathetic", "roll my eyes", "disgusted", "worthless"],
        "defensiveness": ["but you", "not my fault", "you're the one", "that's not fair", "yeah but"],
        "stonewalling": ["shut down", "won't talk", "silent treatment", "walk away", "ignore"],
    }

    # Gita-based communication alternatives
    communication_gita_needs = {
        "criticism": "Practice Satya with Priya (truth with kindness) - BG 17.15",
        "contempt": "Cultivate Sama-darshana (equal vision) - BG 6.32",
        "defensiveness": "Practice Shravana (deep listening) - receive feedback as information",
        "stonewalling": "Take space with intention, practice Dhyana (meditation) before responding",
    }

    problematic_patterns = []
    communication_needs = []
    for pattern, keywords in communication_patterns.items():
        for kw in keywords:
            if kw in conflict_lower:
                problematic_patterns.append(pattern)
                if pattern in communication_gita_needs:
                    communication_needs.append(communication_gita_needs[pattern])
                break

    # Map emotions to Gita concepts and recommended teachings
    gita_concept_mapping = {
        "anger": (["krodha", "dvesha"], ["BG 2.62-63 on anger chain", "BG 16.21 on gates to hell"]),
        "hurt": (["raga", "dukha"], ["BG 2.14 on endurance", "BG 2.57 on equanimity"]),
        "fear": (["bhaya", "moha"], ["BG 2.20 on eternal nature", "BG 4.10 on fearlessness"]),
        "confusion": (["moha", "avidya"], ["BG 2.7 Arjuna's confusion", "BG 18.72 on clarity"]),
        "betrayal": (["kshama", "tyaga"], ["BG 18.17 on non-attachment", "BG 16.2 on forgiveness"]),
        "resentment": (["kshama", "tyaga"], ["BG 12.13-14 on freedom from malice"]),
        "jealousy": (["matsarya", "santosha"], ["BG 3.35 on svadharma", "BG 12.17 on non-envy"]),
        "guilt": (["karma", "svadharma"], ["BG 18.66 on surrender", "BG 3.35 on own dharma"]),
        "sadness": (["shoka", "dukha"], ["BG 2.11 on wisdom", "BG 2.27 on impermanence"]),
    }

    gita_concepts = []
    recommended_teachings = []
    for emotion in [detected_emotion] + secondary_emotions:
        if emotion in gita_concept_mapping:
            concepts, teachings = gita_concept_mapping[emotion]
            gita_concepts.extend(concepts)
            recommended_teachings.extend(teachings)
    gita_concepts = list(set(gita_concepts))  # Remove duplicates
    recommended_teachings = list(set(recommended_teachings))[:4]  # Limit to 4

    # Map underlying fears to Gita terms
    underlying_fears = []
    fear_mapping = {
        "abandoned": "abandonment (separation from self, forgetting inner completeness)",
        "not enough": "unworthiness (forgetting Atman's inherent worth)",
        "rejected": "rejection (seeking validation outside, not within)",
        "alone": "loneliness (separation from self, not others)",
        "failure": "failure (attachment to outcomes over action)",
    }
    for keyword, fear in fear_mapping.items():
        if keyword in conflict_lower:
            underlying_fears.append(fear)

    # Determine emotional intensity
    intensity_indicators = {
        "overwhelming": ["can't stop", "unbearable", "drowning", "falling apart", "crisis"],
        "high": ["very", "extremely", "so much", "deeply", "really hurt"],
        "low": ["slightly", "a bit", "somewhat", "minor"],
    }

    emotional_intensity = "moderate"
    for intensity, keywords in intensity_indicators.items():
        for kw in keywords:
            if kw in conflict_lower:
                emotional_intensity = intensity
                break

    # Add relationship-type specific Gita concepts
    relationship_gita = {
        "romantic": ["sama-darshana", "nishkama-prema"],
        "family": ["svadharma", "kula-dharma"],
        "friendship": ["maitri", "suhrit"],
        "workplace": ["karma-yoga", "nishkama-karma"],
        "self": ["atma-jnana", "svadhyaya"],
        "community": ["lokasangraha", "sarva-bhuta-hite"],
    }
    if relationship_type in relationship_gita:
        gita_concepts.extend(relationship_gita[relationship_type])
        gita_concepts = list(set(gita_concepts))

    return ConflictAnalysis(
        primary_emotion=detected_emotion or "uncertain",
        secondary_emotions=secondary_emotions[:3],  # Limit to 3
        emotional_intensity=emotional_intensity,
        attachment_style=attachment_style or "unknown",
        attachment_indicators=attachment_indicators[:3],
        attachment_triggers=attachment_triggers,
        communication_style="unknown",
        problematic_patterns=problematic_patterns,
        communication_needs=communication_needs,
        power_dynamic="unknown",
        core_unmet_needs=[],
        underlying_fears=underlying_fears[:3],
        gita_concepts=gita_concepts,
        recommended_teachings=recommended_teachings,
        confidence=0.4,  # Lower confidence for rule-based
        analysis_depth="rule_based",
        raw_analysis={},
    )


def build_enhanced_search_query(
    conflict: str,
    analysis: ConflictAnalysis,
    relationship_type: str,
) -> str:
    """Build an enhanced search query for verse retrieval using AI analysis.

    This creates a more targeted query for RAG retrieval based on
    the deep analysis of the conflict.
    """
    query_parts = [conflict[:200]]  # First 200 chars of conflict

    # Add primary emotion and Gita concepts
    if analysis.primary_emotion:
        query_parts.append(analysis.primary_emotion)

    # Add Gita concepts for better verse matching
    if analysis.gita_concepts:
        query_parts.extend(analysis.gita_concepts[:4])

    # Add recommended teachings
    if analysis.recommended_teachings:
        # Extract chapter references
        for teaching in analysis.recommended_teachings[:2]:
            if "BG" in teaching or "." in teaching:
                query_parts.append(teaching)

    # Add core needs for matching compassion-related verses
    if analysis.core_unmet_needs:
        query_parts.extend(analysis.core_unmet_needs[:2])

    # Add attachment style keywords
    attachment_keywords = {
        "anxious": "security reassurance connection",
        "avoidant": "space boundaries independence",
        "disorganized": "safety integration healing",
        "secure": "balance growth communication",
    }
    if analysis.attachment_style in attachment_keywords:
        query_parts.append(attachment_keywords[analysis.attachment_style])

    # Add relationship type
    query_parts.append(relationship_type)

    return " ".join(query_parts)


def analysis_to_dict(analysis: ConflictAnalysis) -> dict[str, Any]:
    """Convert ConflictAnalysis to dictionary for API response."""
    return {
        "primary_emotion": analysis.primary_emotion,
        "secondary_emotions": analysis.secondary_emotions,
        "emotional_intensity": analysis.emotional_intensity,
        "attachment_style": analysis.attachment_style,
        "attachment_indicators": analysis.attachment_indicators,
        "attachment_triggers": analysis.attachment_triggers,
        "communication_style": analysis.communication_style,
        "problematic_patterns": analysis.problematic_patterns,
        "communication_needs": analysis.communication_needs,
        "power_dynamic": analysis.power_dynamic,
        "core_unmet_needs": analysis.core_unmet_needs,
        "underlying_fears": analysis.underlying_fears,
        "gita_concepts": analysis.gita_concepts,
        "recommended_teachings": analysis.recommended_teachings,
        "confidence": analysis.confidence,
        "analysis_depth": analysis.analysis_depth,
    }
