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
    """Structured analysis of a relationship conflict grounded in Gita psychology."""

    # Primary emotional state (Gita psychology terms)
    primary_emotion: str = ""
    secondary_emotions: list[str] = field(default_factory=list)
    emotional_intensity: str = "moderate"  # low, moderate, high, overwhelming

    # Shad Ripu (Six Inner Enemies) diagnosis
    active_shad_ripu: str = ""  # kama, krodha, lobha, moha, mada, matsarya

    # Guna analysis
    guna_analysis: str = ""  # sattva/rajas/tamas dominant state

    # Inner patterns (Raga-Dvesha framework, not Western attachment theory)
    attachment_style: str = ""  # raga-dominant, dvesha-dominant, raga-dvesha-oscillation, sthitaprajna
    attachment_indicators: list[str] = field(default_factory=list)
    attachment_triggers: list[str] = field(default_factory=list)

    # Communication patterns (Vak-tapas framework)
    communication_style: str = ""  # sattvic, rajasic, tamasic
    problematic_patterns: list[str] = field(default_factory=list)
    communication_needs: list[str] = field(default_factory=list)

    # Relationship dharma dynamics
    power_dynamic: str = ""
    core_unmet_needs: list[str] = field(default_factory=list)
    underlying_fears: list[str] = field(default_factory=list)

    # Gita wisdom prescription (STRICT - must use actual verses)
    gita_concepts: list[str] = field(default_factory=list)
    recommended_teachings: list[str] = field(default_factory=list)
    primary_yoga_path: str = ""  # Karma/Bhakti/Jnana/Dhyana/Raja Yoga
    healing_verse: str = ""  # Single most applicable verse

    # Analysis metadata
    confidence: float = 0.0
    analysis_depth: str = "standard"
    raw_analysis: dict[str, Any] = field(default_factory=dict)


# Core Gita wisdom for relationship analysis - grounded in the 701-verse repository + dynamic wisdom
GITA_EMOTION_MAPPING = """
═══════════════════════════════════════════════════════════════
GITA CORE WISDOM FRAMEWORK FOR RELATIONSHIP ANALYSIS
(from MindVibe's 701-verse static repository + dynamic learned wisdom)
═══════════════════════════════════════════════════════════════

STRICT RULE: ALL analysis MUST use Gita psychology exclusively.
Do NOT use Western psychology terms as primary identifiers.
Every emotional state MUST be mapped to its Gita equivalent with specific verse citations.

SHAD RIPU (SIX INNER ENEMIES) - Primary Diagnostic Framework:
These six enemies of the mind are the ROOT CAUSES of all relationship suffering.
Always identify which Shad Ripu is active:
1. Kama (desire/lust) - BG 3.37, 3.39-41: "It is desire, it is anger, born of Rajo-guna"
2. Krodha (anger/wrath) - BG 2.62-63, 16.21: One of three gates to self-destruction
3. Lobha (greed/possessiveness) - BG 16.21, 14.17: Arises from Rajo-guna
4. Moha (delusion/confusion) - BG 2.63, 7.27: Destroys Buddhi (discrimination)
5. Mada (pride/arrogance) - BG 16.4, 18.58: Ahamkara-driven blindness
6. Matsarya (envy/jealousy) - BG 12.13, 3.35: Cure is Svadharma

EMOTIONS → GITA CONCEPT MAPPING (with mandatory verse citations):
- Hurt → Raga (attachment) to unmet expectations; Dukha (suffering) from unfulfilled desires (BG 2.14, 2.56, 5.21)
- Anger → Krodha (wrath) - one of three gates to hell (BG 16.21); chain: Kama→Krodha→Moha (BG 2.62-63); cure: Kshama + Dama (BG 16.1-3)
- Fear → Bhaya (fear); opposite is Abhaya (fearlessness) from Atma-jnana (BG 2.20, 4.10, 16.1); root: forgetting one's eternal nature
- Confusion → Moha (delusion) clouding Buddhi (discriminative wisdom); Arjuna's state in BG 1.28-46; cure: Buddhi Yoga (BG 2.49)
- Guilt → Karma-bandha (bondage of past action); each moment offers new choice (BG 18.66, 9.30-31); cure: Sharanagati (surrender)
- Loneliness → Separation from Atman (self), not from others; divine dwells in every heart as Paramatma (BG 18.61, 6.29, 13.17)
- Jealousy → Matsarya (envy); comparing dharma paths (BG 3.35); cure: Svadharma + Santosha (contentment) (BG 12.17)
- Betrayal → Expecting permanence from Prakriti (nature); beings act from Gunas (BG 18.17, 3.27-28); cure: Vairagya (dispassion)
- Resentment → Dvesha (aversion) disguised as righteousness; Kshama (forgiveness) liberates self (BG 16.2-3, 12.13-14)
- Grief → Shoka (sorrow); Krishna's entire teaching in Ch. 2 addresses Arjuna's grief (BG 2.11-30); cure: Atma-jnana
- Shame → Ahamkara (ego-identification) with actions rather than Atman; cure: Sakshi Bhava (BG 13.31-32)
- Helplessness → Vishada (despair) as in BG 1.47; cure: recognizing one's Svadharma and acting (BG 2.31-33)

ATTACHMENT DYNAMICS → GITA WISDOM (not Western attachment theory):
- Clingy/needy pattern → Raga (excessive attachment) + absence of Atma-tripti (self-contentment) BG 2.55; needs: Sthitaprajna (steady wisdom) BG 2.55-72
- Avoidant/distancing pattern → Dvesha (aversion) to vulnerability + absence of Sangha (sacred connection) BG 3.10-11; needs: Bhakti (devotion/connection) BG 12.1-7
- Push-pull pattern → Raga-Dvesha oscillation (BG 7.27); needs: Yoga (integration) through Sakshi Bhava (witness consciousness) BG 6.19-20
- Balanced/secure pattern → Sthitaprajna (steady in wisdom) + Purnatva (inner fullness) BG 5.21; embodies: Samatvam (equanimity) BG 2.48

COMMUNICATION PATTERNS → GITA ALTERNATIVES (with verse citations):
- Criticism/attacking → Practice Vak-tapas: Satya with Priya (truth with kindness) BG 17.15; speech that is "truthful, pleasing, beneficial, non-agitating"
- Contempt/superiority → Cultivate Sama-darshana (equal vision) BG 6.32; see Atman in all BG 6.29
- Defensiveness/reactivity → Practice Shravana (deep listening) + Titiksha (forbearance) BG 2.14; receive feedback without Ahamkara
- Withdrawal/silence → Intentional Mauna (silence for clarity) vs. Tamas (inertia); practice Dhyana (meditation) then return BG 6.10-15
- Passive-aggression → Recognize Dambha (hypocrisy) BG 16.4; practice Arjavam (straightforwardness) BG 13.7

RELATIONSHIP TYPES → GITA DHARMA FOCUS:
- Romantic → Sama-darshana (equal vision) BG 6.32, Nishkama Prema (desireless love), Stri-dharma/Pati-dharma (sacred partnership) BG 12.13-14
- Family → Svadharma (one's sacred duty) BG 3.35, Kula-dharma (family righteousness) BG 1.40-43, Shraddha (faith/reverence) BG 17.2-3
- Friendship → Maitri (unconditional friendship), Suhrit (well-wisher to all) BG 6.9, Karuna (compassion) BG 12.13
- Workplace → Karma Yoga (selfless action) BG 2.47, Yogah Karmasu Kaushalam (excellence in action) BG 2.50, Nishkama Karma BG 3.19
- Self → Atma-jnana (self-knowledge) BG 6.5-6, Svadhyaya (self-study), Dhyana (meditation) BG 6.10-15
- Community → Lokasangraha (welfare of world) BG 3.20-25, Sarva-bhuta-hite (good of all beings) BG 12.4, Ahimsa BG 16.2

KEY GITA VERSES FOR RELATIONSHIPS (always cite these when relevant):
- BG 2.47: "Your right is to action alone, never to its fruits" (Nishkama Karma - detachment from outcome)
- BG 2.55-56: Definition of Sthitaprajna - one of steady wisdom, undisturbed by joy or sorrow
- BG 2.62-63: Chain of destruction: dwelling→attachment→desire→anger→delusion→memory loss→intelligence lost→destruction
- BG 3.35: "Better is one's own dharma imperfectly performed than another's dharma perfectly" (Svadharma)
- BG 6.5-6: "One must elevate oneself by one's own mind, not degrade oneself" (Atma-seva)
- BG 6.29: "One who sees Me everywhere and sees everything in Me" (universal vision)
- BG 6.32: "One who sees equality everywhere, seeing their own pleasure/pain in all" (Sama-darshana)
- BG 12.13-14: "One free from malice, a kind friend to all, free from ego, equal in suffering and joy"
- BG 13.31-32: The Atman is untouched by any action or quality (Sakshi - witness)
- BG 16.1-3: Divine qualities: Abhaya, Sattva-samshuddhi, Satya, Akrodha, Tyaga, Shanti, Daya, Kshama
- BG 16.21: Three gates to self-destruction: Kama, Krodha, Lobha
- BG 17.15: Vak-tapas - "Speech that is truthful, pleasant, beneficial, and non-agitating"
- BG 18.17: "One who is free from ego-notion, whose intelligence is unentangled" (Nirahamkara)
- BG 18.61: "The Supreme Lord dwells in the hearts of all beings" (Paramatma in all)
- BG 18.66: "Surrender all dharmas unto Me; I shall liberate you from all sin" (Sharanagati)
"""

# System prompt for conflict analysis - STRICT GITA-GROUNDED
CONFLICT_ANALYSIS_PROMPT = f"""You are a relationship analysis intelligence operating EXCLUSIVELY within Bhagavad Gita psychology.

═══════════════════════════════════════════════════════════════
STRICT GITA-ONLY ANALYSIS PROTOCOL
═══════════════════════════════════════════════════════════════

{GITA_EMOTION_MAPPING}

MANDATORY RULES:
1. ALL emotional analysis MUST use Gita psychology terms (Sanskrit with English meaning).
2. ALL recommended_teachings MUST cite minimum 3 specific BG verses in "BG chapter:verse" format.
3. ALL gita_concepts MUST use Sanskrit terms from the Shad Ripu and emotion mapping above.
4. ALWAYS identify which Shad Ripu (Kama/Krodha/Lobha/Moha/Mada/Matsarya) is active.
5. NEVER use Western psychology terms as primary labels. Map everything to Gita equivalents.
6. emotional_triggers MUST describe the Raga-Dvesha dynamics and which Guna (Sattva/Rajas/Tamas) dominates.

Analyze the user's relationship conflict using this STRICT Gita wisdom framework.
Provide a structured JSON response.

Your analysis must include:

1. EMOTIONAL ANALYSIS (Gita psychology ONLY)
   - primary_emotion: The dominant emotion using Gita term first: e.g., "krodha (anger)", "shoka (grief)"
   - secondary_emotions: Other emotions using Gita terms (array)
   - emotional_intensity: low | moderate | high | overwhelming
   - emotional_triggers: What Raga (attachment) or Dvesha (aversion) is activated; which Guna dominates (Sattva/Rajas/Tamas)
   - active_shad_ripu: Which of the six inner enemies (kama/krodha/lobha/moha/mada/matsarya) is most active

2. INNER PATTERN ANALYSIS (Gita framework - NOT Western attachment theory)
   - attachment_style: raga-dominant (clingy) | dvesha-dominant (avoidant) | raga-dvesha-oscillation (push-pull) | sthitaprajna (balanced)
   - attachment_indicators: Specific phrases/behaviors showing Raga or Dvesha patterns
   - attachment_triggers: What Gita principle is needed (e.g., "Atma-tripti for self-completeness BG 2.55")
   - guna_analysis: Which Guna (Sattva/Rajas/Tamas) dominates their current state (BG 14.5-18)

3. COMMUNICATION ANALYSIS (Vak-tapas framework - BG 17.15)
   - communication_style: sattvic (truthful+kind) | rajasic (aggressive/reactive) | tamasic (withdrawn/passive)
   - problematic_patterns: Array of patterns (criticism, contempt, defensiveness, stonewalling) with Gita equivalent
   - communication_needs: Specific Gita practices needed with verse citations (e.g., "Vak-tapas BG 17.15", "Shravana")

4. RELATIONSHIP DHARMA DYNAMICS
   - power_dynamic: dharmic-balance | kartritva-abhimana (doership domination) | raga-binding | tamas-disengagement
   - core_unmet_needs: Needs framed in Gita terms (Abhaya/safety, Maitri/connection, Atma-tripti/self-worth, Svadharma/purpose)
   - underlying_fears: Fears in Gita terms with verse refs (e.g., "Bhaya from forgetting Atma-svarupa BG 2.20")

5. GITA WISDOM PRESCRIPTION (CRITICAL - minimum 3 verses MANDATORY)
   - gita_concepts: Minimum 4 relevant Sanskrit terms from Shad Ripu + emotion mapping above
   - recommended_teachings: Minimum 3 specific verses in "BG chapter:verse on [topic]" format
   - primary_yoga_path: Which Yoga path is most needed (Karma/Bhakti/Jnana/Dhyana/Raja) with BG reference
   - healing_verse: The single most applicable verse for this person's situation

6. CONFIDENCE & DEPTH
   - confidence: 0.0-1.0 how confident you are in this analysis
   - analysis_notes: Key observation using ONLY Gita terminology

Respond ONLY with valid JSON. No markdown, no explanation outside JSON.

Example output format:
{{
  "primary_emotion": "krodha (anger)",
  "secondary_emotions": ["bhaya (fear)", "shoka (grief)"],
  "emotional_intensity": "high",
  "emotional_triggers": ["Raga to unmet expectations activating Krodha chain (BG 2.62-63)", "Rajasic guna dominating Buddhi"],
  "active_shad_ripu": "krodha",
  "attachment_style": "raga-dominant",
  "attachment_indicators": ["seeking reassurance (Raga for validation)", "fear language (absence of Abhaya)"],
  "attachment_triggers": ["need for Atma-tripti (self-contentment) BG 2.55", "Sthitaprajna stability BG 2.56"],
  "guna_analysis": "Rajas dominant with Tamas undertone - agitation masking inertia",
  "communication_style": "rajasic",
  "problematic_patterns": ["criticism (absence of Vak-tapas)", "defensiveness (Ahamkara protecting self-image)"],
  "communication_needs": ["Vak-tapas (austerity of speech) BG 17.15", "Shravana (deep listening)", "Arjavam (straightforwardness) BG 13.7"],
  "power_dynamic": "kartritva-abhimana",
  "core_unmet_needs": ["Maitri (genuine connection) BG 12.13", "Abhaya (safety/fearlessness) BG 16.1", "Atma-tripti (self-worth) BG 2.55"],
  "underlying_fears": ["Bhaya from forgetting Atma-svarupa BG 2.20", "Moha about self-worth depending on others BG 2.55"],
  "gita_concepts": ["krodha", "raga", "moha", "kshama", "atma-tripti", "vak-tapas", "sthitaprajna"],
  "recommended_teachings": ["BG 2.62-63 on Krodha chain from Kama to destruction", "BG 6.32 on Sama-darshana (equal vision in all)", "BG 12.13-14 on Maitri (divine friendship qualities)", "BG 17.15 on Vak-tapas (sacred speech)"],
  "primary_yoga_path": "Karma Yoga with Bhakti elements (BG 12.6-7)",
  "healing_verse": "BG 6.5 - Elevate yourself by your own mind; do not degrade yourself",
  "confidence": 0.85,
  "analysis_notes": "Raga-dominant pattern with Krodha activation; Rajasic guna dominating; needs Sthitaprajna cultivation through Karma Yoga with Vak-tapas practice"
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
            active_shad_ripu=analysis_data.get("active_shad_ripu", ""),
            guna_analysis=analysis_data.get("guna_analysis", ""),
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
            primary_yoga_path=analysis_data.get("primary_yoga_path", ""),
            healing_verse=analysis_data.get("healing_verse", ""),
            confidence=float(analysis_data.get("confidence", 0.7)),
            analysis_depth="ai_enhanced",
            raw_analysis=analysis_data,
        )

        logger.info(
            f"✅ AI conflict analysis complete: "
            f"emotion={analysis.primary_emotion}, "
            f"shad_ripu={analysis.active_shad_ripu}, "
            f"attachment={analysis.attachment_style}, "
            f"yoga_path={analysis.primary_yoga_path}, "
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
                        active_shad_ripu=analysis_data.get("active_shad_ripu", ""),
                        guna_analysis=analysis_data.get("guna_analysis", ""),
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
                        primary_yoga_path=analysis_data.get("primary_yoga_path", ""),
                        healing_verse=analysis_data.get("healing_verse", ""),
                        confidence=float(analysis_data.get("confidence", 0.7)),
                        analysis_depth="ai_enhanced",
                        raw_analysis=analysis_data,
                    )

                    logger.info(
                        f"✅ AI conflict analysis (async): "
                        f"emotion={analysis.primary_emotion}, "
                        f"shad_ripu={analysis.active_shad_ripu}, "
                        f"attachment={analysis.attachment_style}, "
                        f"yoga_path={analysis.primary_yoga_path}, "
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

    # Map emotions to Gita concepts, Shad Ripu, and recommended teachings (STRICT)
    gita_concept_mapping = {
        "anger": (["krodha", "dvesha", "rajas"], "krodha", ["BG 2.62-63 on Krodha chain from Kama to destruction", "BG 16.21 on three gates to self-destruction", "BG 16.1-3 on Kshama and Dama as cure"]),
        "hurt": (["raga", "dukha", "vairagya"], "kama", ["BG 2.14 on Titiksha (endurance of pain/pleasure)", "BG 2.56 on Sthitaprajna undisturbed by sorrow", "BG 5.21 on Atma-sukha (happiness from within)"]),
        "fear": (["bhaya", "abhaya", "atma-jnana"], "moha", ["BG 2.20 on eternal Atman nature", "BG 4.10 on Abhaya through Jnana", "BG 16.1 on Abhaya as first divine quality"]),
        "confusion": (["moha", "avidya", "buddhi-yoga"], "moha", ["BG 2.7 on Arjuna's Moha and plea for guidance", "BG 2.49 on Buddhi Yoga as cure for confusion", "BG 18.72 on clarity restored"]),
        "betrayal": (["kshama", "tyaga", "vairagya"], "moha", ["BG 18.17 on Nirahamkara (non-ego)", "BG 16.2 on Kshama as divine quality", "BG 3.27-28 on beings acting from Gunas"]),
        "resentment": (["kshama", "dvesha", "tyaga"], "krodha", ["BG 12.13-14 on freedom from malice (Adveshta)", "BG 16.2-3 on Kshama and Ahimsa", "BG 2.56 on one undisturbed by misery"]),
        "jealousy": (["matsarya", "santosha", "svadharma"], "matsarya", ["BG 3.35 on Svadharma (own dharma)", "BG 12.17 on non-envy (Anapeksha)", "BG 14.22-25 on Gunatita transcending envy"]),
        "guilt": (["karma-bandha", "sharanagati", "svadharma"], "moha", ["BG 18.66 on Sharanagati (complete surrender)", "BG 3.35 on following own dharma", "BG 9.30-31 on even the most sinful being liberated"]),
        "sadness": (["shoka", "dukha", "atma-jnana"], "moha", ["BG 2.11 on grieving for what shouldn't be grieved", "BG 2.27 on impermanence", "BG 2.20 on eternal unchanging Atman"]),
        "shame": (["ahamkara", "sakshi-bhava"], "mada", ["BG 13.31-32 on Atman untouched by action", "BG 6.5-6 on self as friend not enemy", "BG 2.55 on Atma-tripti"]),
        "helplessness": (["vishada", "svadharma", "karma-yoga"], "moha", ["BG 2.31-33 on Kshatriya-dharma (duty to act)", "BG 2.47 on right to action", "BG 6.5 on elevating oneself"]),
    }

    gita_concepts = []
    recommended_teachings = []
    active_shad_ripu = ""
    for emotion in [detected_emotion] + secondary_emotions:
        if emotion in gita_concept_mapping:
            concepts, ripu, teachings = gita_concept_mapping[emotion]
            gita_concepts.extend(concepts)
            recommended_teachings.extend(teachings)
            if not active_shad_ripu:
                active_shad_ripu = ripu
    gita_concepts = list(set(gita_concepts))  # Remove duplicates
    recommended_teachings = list(set(recommended_teachings))[:5]  # Limit to 5

    # Determine Guna analysis from intensity and emotion
    guna_mapping = {
        "overwhelming": "Rajas dominant with Tamas undertone",
        "high": "Rajas dominant - agitation and reactivity",
        "moderate": "Rajas-Tamas mix - restlessness with inertia",
        "low": "Tamas dominant with suppressed Rajas",
    }
    guna_analysis = guna_mapping.get(emotional_intensity, "Rajas-Tamas mix")

    # Determine primary yoga path
    yoga_path_mapping = {
        "anger": "Karma Yoga (selfless action) BG 2.47 + Dhyana (meditation) BG 6.10",
        "hurt": "Bhakti Yoga (devotion/connection) BG 12.6-7 + Jnana (self-knowledge) BG 2.11",
        "fear": "Jnana Yoga (self-knowledge) BG 2.20 + Bhakti (surrender) BG 18.66",
        "confusion": "Buddhi Yoga (discrimination) BG 2.49 + Jnana (wisdom) BG 4.38",
        "betrayal": "Karma Yoga (detached action) BG 2.47 + Kshama (forgiveness) BG 16.2",
        "resentment": "Bhakti Yoga (compassion/devotion) BG 12.13-14 + Kshama BG 16.2",
        "jealousy": "Karma Yoga (focus on own dharma) BG 3.35 + Santosha (contentment)",
        "guilt": "Bhakti Yoga (surrender) BG 18.66 + Karma Yoga (new action) BG 2.47",
        "sadness": "Jnana Yoga (knowledge of Atman) BG 2.11-30 + Bhakti (connection) BG 12.6",
    }
    primary_yoga_path = yoga_path_mapping.get(detected_emotion, "Karma Yoga (selfless action) BG 2.47")

    # Determine healing verse
    healing_verse_mapping = {
        "anger": "BG 2.62-63 - Understanding Krodha chain breaks its power",
        "hurt": "BG 2.14 - Pleasures and pains come and go; learn to bear them",
        "fear": "BG 2.20 - The Atman is never born and never dies",
        "confusion": "BG 2.7 - Seek guidance with humility as Arjuna did",
        "betrayal": "BG 18.17 - One free from ego-notion sees clearly",
        "resentment": "BG 12.13-14 - One free from malice, a friend to all",
        "jealousy": "BG 3.35 - Better is own dharma imperfectly than another's perfectly",
        "guilt": "BG 18.66 - Surrender all and be free from sin",
        "sadness": "BG 2.11 - The wise grieve neither for the living nor the dead",
    }
    healing_verse = healing_verse_mapping.get(detected_emotion, "BG 6.5 - Elevate yourself by your own mind")

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
        active_shad_ripu=active_shad_ripu or "moha",
        guna_analysis=guna_analysis,
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
        primary_yoga_path=primary_yoga_path,
        healing_verse=healing_verse,
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
        "active_shad_ripu": analysis.active_shad_ripu,
        "guna_analysis": analysis.guna_analysis,
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
        "primary_yoga_path": analysis.primary_yoga_path,
        "healing_verse": analysis.healing_verse,
        "confidence": analysis.confidence,
        "analysis_depth": analysis.analysis_depth,
    }
