"""AI-powered concern analysis for Viyoga Detachment Coach using OpenAI API.

This module provides deep analysis of outcome anxiety and attachment patterns
using OpenAI's GPT models, going far beyond simple keyword matching.

Key capabilities:
- Deep situational understanding (what exactly are they worried about, why it matters)
- Attachment pattern detection with Gita-specific concepts (phala-sakti, raga, etc.)
- Emotional state mapping to detachment path
- Root cause identification (control, approval, identity, fear)
- Enhanced search query generation for better Gita verse retrieval
- Personalized detachment strategy based on analysis

The analysis results feed into prompt construction so Viyoga can generate
deeply personalized, situation-aware responses rather than generic fallbacks.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from typing import Any

from openai import OpenAI

logger = logging.getLogger(__name__)

ANALYSIS_MODEL = os.getenv("VIYOGA_ANALYSIS_MODEL", "gpt-4o-mini")


@dataclass
class ConcernAnalysis:
    """Structured analysis of a user's outcome anxiety or attachment concern."""

    # Situational understanding
    specific_worry: str = ""
    why_it_matters: str = ""
    what_they_fear: str = ""
    what_they_want: str = ""

    # Emotional state
    primary_emotion: str = ""
    secondary_emotions: list[str] = field(default_factory=list)
    emotional_intensity: str = "moderate"

    # Attachment pattern (Gita-grounded)
    attachment_type: str = ""
    attachment_object: str = ""
    attachment_indicators: list[str] = field(default_factory=list)
    root_cause: str = ""

    # Detachment path
    gita_concepts: list[str] = field(default_factory=list)
    recommended_teachings: list[str] = field(default_factory=list)
    detachment_approach: str = ""
    effort_redirect: str = ""

    # What's actually in their control
    in_their_control: list[str] = field(default_factory=list)
    not_in_their_control: list[str] = field(default_factory=list)

    # Analysis metadata
    confidence: float = 0.0
    analysis_depth: str = "standard"
    raw_analysis: dict[str, Any] = field(default_factory=dict)


GITA_DETACHMENT_FRAMEWORK = """
GITA DETACHMENT WISDOM FRAMEWORK (from MindVibe's 701-verse repository):

ATTACHMENT TYPES -> GITA CONCEPTS:
- Outcome Attachment (phala-sakti): Clinging to specific results; BG 2.47 "Your right is to action alone"
- Control Attachment (niyantrtva-raga): Need to control what can't be controlled; BG 18.14 on five factors of action
- Identity Attachment (ahamkara-bandha): Worth tied to results; BG 2.14 "Contacts give rise to cold/heat, pleasure/pain"
- Approval Attachment (prashansa-raga): Need for others' validation; BG 2.57 "Sthitaprajna unmoved by praise or blame"
- Perfectionism (siddhi-raga): Need for flawless outcomes; BG 2.48 "Balanced in success and failure"
- Future Anxiety (bhavishya-bhaya): Fear about what hasn't happened; BG 6.35 "Mind controlled by practice and detachment"
- Loss Anxiety (nashta-bhaya): Fear of losing what one has; BG 2.11 "Wise grieve neither for living nor dead"

ROOT CAUSES -> GITA PSYCHOLOGY:
- Fear of inadequacy -> Forgetting Atman's inherent completeness (BG 2.20)
- Need for certainty -> Resistance to the nature of change (BG 2.14, impermanence)
- Desire for validation -> Seeking outside what exists within (BG 6.20-23, Atma-tripti)
- Fear of judgment -> Giving others power over inner peace (BG 2.57, sthitaprajna)
- Catastrophizing -> Mind's tendency toward moha (delusion) (BG 2.62-63)
- Perfectionism -> Ego disguised as excellence (BG 3.35, svadharma)

DETACHMENT APPROACHES:
- Karma Yoga: Redirect energy from results to quality of effort (BG 2.47, 3.19, 18.6)
- Sakshi Bhava: Witness the anxiety without becoming it (BG 6.19, 13.22)
- Samatva: Practice equanimity regardless of outcome (BG 2.48, 5.18-20)
- Nishkama Karma: Act from dharma, not desire (BG 2.47, 3.19)
- Ishvara Pranidhana: Surrender outcomes to a larger order (BG 18.66, 12.6-7)
- Svadharma: Focus on YOUR path, YOUR duty, YOUR effort (BG 3.35, 18.47)

KEY GITA VERSES FOR DETACHMENT:
- BG 2.47: "Your right is to action alone, never to its fruits"
- BG 2.48: "Perform action, being steadfast in yoga, abandoning attachment, balanced in success and failure"
- BG 2.14: "Sense contacts give rise to pleasure and pain; they come and go, endure them"
- BG 2.57: "One without attachment, who neither rejoices nor hates, is of steady wisdom"
- BG 3.19: "Without attachment to results, one should act as a matter of duty"
- BG 5.10: "Like lotus leaf untouched by water, one who acts without attachment is unaffected"
- BG 6.5: "One must elevate, not degrade, oneself by one's own mind"
- BG 6.35: "The mind is restless, but controlled by practice and detachment"
- BG 18.6: "All activities should be performed without attachment or expectation of result"
- BG 18.66: "Abandon all dharmas and surrender unto Me alone. Do not fear."
"""

CONCERN_ANALYSIS_PROMPT = f"""You are a deeply empathetic wisdom guide who specializes in understanding
why people get anxious about outcomes. You use the Bhagavad Gita's psychology of attachment
and detachment to understand the SPECIFIC dynamics of each person's unique situation.

{GITA_DETACHMENT_FRAMEWORK}

Analyze the user's concern with DEEP SITUATIONAL UNDERSTANDING. Don't just categorize it -
truly understand what they're going through and WHY this specific outcome matters so much to them.

Your analysis must include:

1. SITUATIONAL UNDERSTANDING (the most important part)
   - specific_worry: What EXACTLY are they worried about? Be precise and specific.
   - why_it_matters: WHY does this outcome matter so much to them? What's at stake for them personally?
   - what_they_fear: What's the worst case they're imagining? What are they afraid will happen?
   - what_they_want: What outcome are they clinging to? What do they wish would happen?

2. EMOTIONAL STATE
   - primary_emotion: The dominant emotion (anxiety, fear, dread, helplessness, frustration, etc.)
   - secondary_emotions: Other emotions present
   - emotional_intensity: low | moderate | high | overwhelming

3. ATTACHMENT PATTERN (use Gita framework)
   - attachment_type: The type from the framework above (outcome, control, identity, approval, perfectionism, future_anxiety, loss_anxiety)
   - attachment_object: What SPECIFIC thing are they attached to (e.g., "getting the job", "their partner's response", "exam results")
   - attachment_indicators: Specific phrases that reveal the attachment
   - root_cause: The deeper root cause from the Gita psychology framework above

4. DETACHMENT PATH
   - gita_concepts: Relevant Gita concepts (phala-sakti, nishkama karma, samatva, etc.)
   - recommended_teachings: Specific verses that apply (BG chapter:verse format)
   - detachment_approach: Which approach from the framework fits best
   - effort_redirect: What should they redirect their energy TOWARD instead

5. CONTROL ANALYSIS (critical for helping them)
   - in_their_control: Things that ARE in their control right now (be specific to their situation)
   - not_in_their_control: Things that are NOT in their control (be specific)

6. CONFIDENCE
   - confidence: 0.0-1.0
   - analysis_notes: Key insight about their specific situation

IMPORTANT:
- Be SPECIFIC to their exact situation - don't give generic analysis
- The situational understanding section is THE MOST IMPORTANT - get this right
- in_their_control and not_in_their_control should be SPECIFIC to their situation
- Connect Gita concepts naturally to their modern concern

Respond ONLY with valid JSON. No markdown, no explanation outside JSON.

Example output:
{{
  "specific_worry": "They're worried their startup pitch to investors will fail and they'll lose their one chance at funding",
  "why_it_matters": "This pitch represents months of work and their dream of building something meaningful. Failure feels like it invalidates all their effort.",
  "what_they_fear": "Being told no, looking foolish, having to give up the dream, disappointing their co-founder",
  "what_they_want": "A yes from investors, validation that their idea is worthwhile, financial security for their startup",
  "primary_emotion": "anxiety",
  "secondary_emotions": ["fear", "self-doubt"],
  "emotional_intensity": "high",
  "attachment_type": "outcome",
  "attachment_object": "investor approval and funding",
  "attachment_indicators": ["can't stop thinking about it", "everything rides on this"],
  "root_cause": "Identity tied to the venture's success; confusing the outcome with self-worth",
  "gita_concepts": ["phala-sakti", "nishkama karma", "svadharma"],
  "recommended_teachings": ["BG 2.47 on right to action not fruits", "BG 2.48 on equanimity", "BG 3.35 on svadharma"],
  "detachment_approach": "karma_yoga",
  "effort_redirect": "Focus on delivering the best pitch they can - their preparation, clarity, and passion - rather than fixating on the investor's decision",
  "in_their_control": ["quality of their pitch deck", "how well they practice and prepare", "their energy and confidence during the presentation", "having backup plans"],
  "not_in_their_control": ["investor's decision", "market timing", "investor's personal preferences", "competition they don't know about"],
  "confidence": 0.88,
  "analysis_notes": "Classic phala-sakti - months of effort have created strong attachment to a specific outcome. Need to help them see the pitch AS the offering, not a means to an end."
}}"""


def analyze_concern_with_ai(
    concern: str,
    session_context: str | None = None,
) -> ConcernAnalysis:
    """Analyze a user's outcome anxiety using OpenAI for deep situational understanding.

    This function uses GPT to:
    1. Understand the SPECIFIC situation and why the outcome matters
    2. Identify the attachment pattern through Gita psychology
    3. Map what's in vs. out of their control
    4. Determine the best detachment approach

    Args:
        concern: The user's description of their worry/concern
        session_context: Previous conversation context if available

    Returns:
        ConcernAnalysis with structured insights for personalized guidance
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        logger.warning("OPENAI_API_KEY not set, falling back to rule-based analysis")
        return _rule_based_analysis(concern)

    user_message = f"User's concern:\n{concern}"

    if session_context:
        user_message += f"\n\nPrevious conversation context:\n{session_context}"

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=ANALYSIS_MODEL,
            messages=[
                {"role": "system", "content": CONCERN_ANALYSIS_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=1000,
            timeout=15.0,
        )

        content = response.choices[0].message.content if response.choices else None
        if not content:
            logger.warning("Empty response from OpenAI concern analysis, using fallback")
            return _rule_based_analysis(concern)

        try:
            content = content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()

            data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse concern analysis JSON: {e}, using fallback")
            return _rule_based_analysis(concern)

        analysis = ConcernAnalysis(
            specific_worry=data.get("specific_worry", ""),
            why_it_matters=data.get("why_it_matters", ""),
            what_they_fear=data.get("what_they_fear", ""),
            what_they_want=data.get("what_they_want", ""),
            primary_emotion=data.get("primary_emotion", ""),
            secondary_emotions=data.get("secondary_emotions", []),
            emotional_intensity=data.get("emotional_intensity", "moderate"),
            attachment_type=data.get("attachment_type", ""),
            attachment_object=data.get("attachment_object", ""),
            attachment_indicators=data.get("attachment_indicators", []),
            root_cause=data.get("root_cause", ""),
            gita_concepts=data.get("gita_concepts", []),
            recommended_teachings=data.get("recommended_teachings", []),
            detachment_approach=data.get("detachment_approach", ""),
            effort_redirect=data.get("effort_redirect", ""),
            in_their_control=data.get("in_their_control", []),
            not_in_their_control=data.get("not_in_their_control", []),
            confidence=float(data.get("confidence", 0.7)),
            analysis_depth="ai_enhanced",
            raw_analysis=data,
        )

        logger.info(
            f"Viyoga AI analysis: "
            f"worry='{analysis.specific_worry[:50]}...', "
            f"attachment={analysis.attachment_type}, "
            f"emotion={analysis.primary_emotion}, "
            f"confidence={analysis.confidence:.2f}"
        )

        return analysis

    except Exception as e:
        logger.error(f"OpenAI concern analysis failed: {e}, using fallback")
        return _rule_based_analysis(concern)


async def analyze_concern_with_ai_async(
    concern: str,
    session_context: str | None = None,
) -> ConcernAnalysis:
    """Async version of concern analysis using multi-provider support.

    Tries the AI provider manager first for multi-provider fallback,
    then falls back to synchronous OpenAI.
    """
    try:
        from backend.services.ai.providers.provider_manager import get_provider_manager
        provider_manager = get_provider_manager()

        if provider_manager:
            user_message = f"User's concern:\n{concern}"
            if session_context:
                user_message += f"\n\nPrevious conversation context:\n{session_context}"

            response = await provider_manager.chat(
                messages=[
                    {"role": "system", "content": CONCERN_ANALYSIS_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.3,
                max_tokens=1000,
            )

            if response and response.content:
                try:
                    content = response.content.strip()
                    if content.startswith("```"):
                        content = content.split("```")[1]
                        if content.startswith("json"):
                            content = content[4:]
                    content = content.strip()

                    data = json.loads(content)

                    analysis = ConcernAnalysis(
                        specific_worry=data.get("specific_worry", ""),
                        why_it_matters=data.get("why_it_matters", ""),
                        what_they_fear=data.get("what_they_fear", ""),
                        what_they_want=data.get("what_they_want", ""),
                        primary_emotion=data.get("primary_emotion", ""),
                        secondary_emotions=data.get("secondary_emotions", []),
                        emotional_intensity=data.get("emotional_intensity", "moderate"),
                        attachment_type=data.get("attachment_type", ""),
                        attachment_object=data.get("attachment_object", ""),
                        attachment_indicators=data.get("attachment_indicators", []),
                        root_cause=data.get("root_cause", ""),
                        gita_concepts=data.get("gita_concepts", []),
                        recommended_teachings=data.get("recommended_teachings", []),
                        detachment_approach=data.get("detachment_approach", ""),
                        effort_redirect=data.get("effort_redirect", ""),
                        in_their_control=data.get("in_their_control", []),
                        not_in_their_control=data.get("not_in_their_control", []),
                        confidence=float(data.get("confidence", 0.7)),
                        analysis_depth="ai_enhanced",
                        raw_analysis=data,
                    )

                    logger.info(
                        f"Viyoga AI analysis (async): "
                        f"attachment={analysis.attachment_type}, "
                        f"emotion={analysis.primary_emotion}, "
                        f"confidence={analysis.confidence:.2f}, "
                        f"provider={response.provider}"
                    )

                    return analysis

                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse async concern analysis JSON: {e}")

    except Exception as e:
        logger.warning(f"Async provider manager failed: {e}, trying sync fallback")

    return analyze_concern_with_ai(concern, session_context)


def _rule_based_analysis(concern: str) -> ConcernAnalysis:
    """Fallback rule-based analysis when AI is unavailable.

    Uses keyword matching mapped to Gita detachment concepts.
    """
    concern_lower = concern.lower()

    # Detect primary emotion
    emotion_keywords = {
        "anxiety": ["anxious", "anxiety", "worried", "worry", "nervous", "stress", "stressed"],
        "fear": ["scared", "afraid", "terrified", "dread", "fear", "frightened"],
        "helplessness": ["helpless", "powerless", "can't do anything", "stuck", "trapped"],
        "frustration": ["frustrated", "annoyed", "irritated", "fed up"],
        "dread": ["dread", "doom", "catastrophe", "disaster", "worst case"],
        "self-doubt": ["not good enough", "failure", "incompetent", "doubt myself", "can't do it"],
        "overwhelm": ["overwhelmed", "too much", "drowning", "falling apart", "can't handle"],
    }

    primary_emotion = "anxiety"
    secondary_emotions = []
    for emotion, keywords in emotion_keywords.items():
        for kw in keywords:
            if kw in concern_lower:
                if primary_emotion == "anxiety" and emotion != "anxiety":
                    primary_emotion = emotion
                elif emotion != primary_emotion:
                    secondary_emotions.append(emotion)
                break

    # Detect attachment type
    attachment_map = {
        "control": ["control", "manage", "guarantee", "make sure", "ensure", "force"],
        "future_anxiety": ["what if", "might happen", "could go wrong", "will be", "going to", "future"],
        "identity": ["not good enough", "failure", "worthless", "prove myself", "who I am"],
        "approval": ["think of me", "judge", "opinion", "approve", "impress", "disappoint"],
        "perfectionism": ["perfect", "flawless", "no mistakes", "exactly right", "100%"],
        "loss_anxiety": ["lose", "losing", "lost", "gone", "taken away", "slip away"],
    }

    attachment_type = "outcome"
    attachment_indicators = []
    for atype, keywords in attachment_map.items():
        for kw in keywords:
            if kw in concern_lower:
                attachment_type = atype
                attachment_indicators.append(kw)

    # Map to Gita concepts
    gita_mapping = {
        "outcome": (["phala-sakti", "nishkama-karma"], ["BG 2.47", "BG 3.19"]),
        "control": (["niyantrtva-raga", "ishvara-pranidhana"], ["BG 18.14", "BG 18.66"]),
        "future_anxiety": (["bhavishya-bhaya", "vairagya"], ["BG 6.35", "BG 2.14"]),
        "identity": (["ahamkara-bandha", "atma-jnana"], ["BG 2.20", "BG 6.5"]),
        "approval": (["prashansa-raga", "sthitaprajna"], ["BG 2.57", "BG 14.22-25"]),
        "perfectionism": (["siddhi-raga", "samatva"], ["BG 2.48", "BG 3.35"]),
        "loss_anxiety": (["nashta-bhaya", "vairagya"], ["BG 2.11", "BG 2.14"]),
    }

    concepts, teachings = gita_mapping.get(attachment_type, gita_mapping["outcome"])

    # Determine intensity
    intensity = "moderate"
    if any(w in concern_lower for w in ["can't stop", "unbearable", "drowning", "falling apart", "crisis"]):
        intensity = "overwhelming"
    elif any(w in concern_lower for w in ["very", "extremely", "so much", "deeply", "really"]):
        intensity = "high"
    elif any(w in concern_lower for w in ["slightly", "a bit", "somewhat", "minor"]):
        intensity = "low"

    return ConcernAnalysis(
        specific_worry=concern[:200],
        why_it_matters="",
        what_they_fear="",
        what_they_want="",
        primary_emotion=primary_emotion,
        secondary_emotions=secondary_emotions[:3],
        emotional_intensity=intensity,
        attachment_type=attachment_type,
        attachment_object="",
        attachment_indicators=attachment_indicators[:3],
        root_cause="",
        gita_concepts=concepts,
        recommended_teachings=teachings,
        detachment_approach="karma_yoga",
        effort_redirect="",
        in_their_control=[],
        not_in_their_control=[],
        confidence=0.35,
        analysis_depth="rule_based",
        raw_analysis={},
    )


def build_enhanced_search_query(
    concern: str,
    analysis: ConcernAnalysis,
) -> str:
    """Build an enhanced search query for verse retrieval using AI analysis.

    Creates a more targeted query based on the deep understanding of the concern.
    """
    query_parts = [concern[:200]]

    if analysis.primary_emotion:
        query_parts.append(analysis.primary_emotion)

    if analysis.gita_concepts:
        query_parts.extend(analysis.gita_concepts[:4])

    if analysis.recommended_teachings:
        for teaching in analysis.recommended_teachings[:2]:
            if "BG" in teaching or "." in teaching:
                query_parts.append(teaching)

    if analysis.root_cause:
        query_parts.append(analysis.root_cause[:50])

    if analysis.attachment_type:
        approach_keywords = {
            "outcome": "karma yoga action effort detachment fruits",
            "control": "surrender control release trust",
            "future_anxiety": "present moment practice detachment mind",
            "identity": "self atman witness consciousness worth",
            "approval": "steady wisdom unmoved praise blame",
            "perfectionism": "equanimity balanced success failure",
            "loss_anxiety": "impermanence eternal change endure",
        }
        if analysis.attachment_type in approach_keywords:
            query_parts.append(approach_keywords[analysis.attachment_type])

    return " ".join(query_parts)


def build_analysis_context_for_prompt(analysis: ConcernAnalysis) -> str:
    """Build a context block from the analysis to inject into the system prompt.

    This gives Viyoga deep understanding of the user's situation BEFORE
    generating the response, enabling truly personalized guidance.
    """
    if analysis.analysis_depth != "ai_enhanced":
        return ""

    lines = [
        "[CONCERN_ANALYSIS - Use this to deeply personalize your response]",
        f"What they're worried about: {analysis.specific_worry}",
    ]

    if analysis.why_it_matters:
        lines.append(f"Why it matters to them: {analysis.why_it_matters}")
    if analysis.what_they_fear:
        lines.append(f"What they fear: {analysis.what_they_fear}")
    if analysis.what_they_want:
        lines.append(f"What they're clinging to: {analysis.what_they_want}")

    lines.append(f"Primary emotion: {analysis.primary_emotion} ({analysis.emotional_intensity})")

    if analysis.attachment_type:
        lines.append(f"Attachment pattern: {analysis.attachment_type}")
    if analysis.attachment_object:
        lines.append(f"Attached to: {analysis.attachment_object}")
    if analysis.root_cause:
        lines.append(f"Root cause: {analysis.root_cause}")

    if analysis.in_their_control:
        lines.append(f"In their control: {', '.join(analysis.in_their_control[:4])}")
    if analysis.not_in_their_control:
        lines.append(f"Not in their control: {', '.join(analysis.not_in_their_control[:4])}")

    if analysis.effort_redirect:
        lines.append(f"Redirect energy toward: {analysis.effort_redirect}")
    if analysis.detachment_approach:
        lines.append(f"Recommended approach: {analysis.detachment_approach}")

    lines.append("[/CONCERN_ANALYSIS]")
    return "\n".join(lines)


def analysis_to_dict(analysis: ConcernAnalysis) -> dict[str, Any]:
    """Convert ConcernAnalysis to dictionary for API response."""
    return {
        "specific_worry": analysis.specific_worry,
        "why_it_matters": analysis.why_it_matters,
        "what_they_fear": analysis.what_they_fear,
        "primary_emotion": analysis.primary_emotion,
        "secondary_emotions": analysis.secondary_emotions,
        "emotional_intensity": analysis.emotional_intensity,
        "attachment_type": analysis.attachment_type,
        "attachment_object": analysis.attachment_object,
        "root_cause": analysis.root_cause,
        "gita_concepts": analysis.gita_concepts,
        "detachment_approach": analysis.detachment_approach,
        "effort_redirect": analysis.effort_redirect,
        "in_their_control": analysis.in_their_control,
        "not_in_their_control": analysis.not_in_their_control,
        "confidence": analysis.confidence,
        "analysis_depth": analysis.analysis_depth,
    }
