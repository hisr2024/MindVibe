"""ARDHA Reframing Engine — Gita-Compliant 5-Pillar Cognitive Reframing.

This engine processes user thoughts through the ARDHA framework:
  A — Atma Distinction (correct identity before thought)
  R — Raga-Dvesha Diagnosis (scan for attachment/aversion)
  D — Dharma Alignment (clarify right action)
  H — Hrdaya Samatvam (establish equanimity)
  A — Arpana (offer action and surrender result)

The engine:
1. Detects the dominant emotional pattern in user input
2. Maps it to the most relevant ARDHA pillars
3. Searches the 701-verse Gita corpus for supporting verses
4. Builds ARDHA-specific context for the AI prompt
5. Validates response against the 5 Gita compliance tests
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Import ARDHA knowledge base
try:
    from data.ardha_knowledge_base import (
        ARDHA_COMPLIANCE_TESTS,
        ARDHA_EXTENDED_VERSE_REFS,
        ARDHA_KEY_VERSE_REFS,
        ARDHA_PILLARS,
        ArdhaPillar,
        ArdhaVerse,
        build_ardha_context_for_prompt,
        get_pillar_for_emotion,
    )
except ImportError:
    logger.warning("ARDHA knowledge base import failed; using fallback path")
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from data.ardha_knowledge_base import (  # noqa: F811
        ARDHA_COMPLIANCE_TESTS,
        ARDHA_EXTENDED_VERSE_REFS,
        ARDHA_KEY_VERSE_REFS,
        ARDHA_PILLARS,
        ArdhaPillar,
        ArdhaVerse,
        build_ardha_context_for_prompt,
        get_pillar_for_emotion,
    )


# ---------------------------------------------------------------------------
# Emotion detection keywords
# ---------------------------------------------------------------------------

EMOTION_KEYWORDS: dict[str, list[str]] = {
    "identity_crisis": [
        "who am i", "don't know myself", "lost myself", "not me",
        "identity", "imposter", "fake", "pretending",
    ],
    "self_doubt": [
        "not good enough", "can't do", "failure", "worthless",
        "incompetent", "stupid", "dumb", "useless", "inadequate",
    ],
    "imposter_syndrome": [
        "imposter", "fraud", "don't deserve", "found out",
        "pretending", "luck", "not qualified", "over my head",
    ],
    "anxiety": [
        "anxious", "worried", "nervous", "panic", "stress",
        "can't sleep", "racing thoughts", "what if", "scared",
    ],
    "anger": [
        "angry", "furious", "rage", "mad", "hate", "annoyed",
        "irritated", "frustrated", "resentful",
    ],
    "jealousy": [
        "jealous", "envy", "envious", "they have", "unfair",
        "why them", "comparison",
    ],
    "fear_of_failure": [
        "afraid to fail", "fear of failure", "what if i fail",
        "can't afford to fail", "too risky", "might not work",
        "terrified", "failing", "fail",
    ],
    "overwhelm": [
        "overwhelmed", "too much", "can't handle", "drowning",
        "everything at once", "no time", "impossible",
        "cant handle", "pressure", "handle",
    ],
    "perfectionism": [
        "perfect", "not enough", "never satisfied", "high standards",
        "must be", "should be", "flawless",
    ],
    "grief": [
        "lost", "death", "grief", "mourning", "gone",
        "miss", "passed away", "no more",
    ],
    "burnout": [
        "burnout", "exhausted", "tired", "drained",
        "nothing left", "done", "can't anymore",
    ],
    "comparison": [
        "they're better", "everyone else", "behind", "ahead",
        "compared to", "worse than", "less than",
        "except me", "succeed", "why does everyone",
    ],
    "rejection": [
        "rejected", "left out", "not wanted", "abandoned",
        "excluded", "ignored", "unwelcome",
    ],
    "hopelessness": [
        "hopeless", "no point", "meaningless", "why bother",
        "give up", "nothing matters", "no future",
    ],
    "frustration": [
        "frustrated", "stuck", "going nowhere", "not improving",
        "same mistakes", "spinning wheels", "plateau",
    ],
    "mood_swings": [
        "up and down", "mood swings", "unstable", "unpredictable",
        "emotional rollercoaster", "one moment happy",
    ],
    "need_for_control": [
        "control", "can't let go", "must control", "out of control",
        "uncertain", "unpredictable", "need to know",
    ],
    "possessiveness": [
        "possessive", "clingy", "can't let go", "mine",
        "losing them", "they'll leave",
    ],
    "criticism_sensitivity": [
        "criticism", "they said", "judged", "feedback hurts",
        "took it personally", "defensive",
    ],
    "career_confusion": [
        "career", "job", "wrong path", "should i quit",
        "right career", "wasting time", "calling",
    ],
    "existential_dread": [
        "existence", "meaning of life", "why exist",
        "what's the point", "existential", "nihilism",
    ],
}


@dataclass
class ArdhaAnalysis:
    """Result of ARDHA emotional analysis on user input."""
    detected_emotions: list[str]
    primary_emotion: str
    recommended_pillars: list[ArdhaPillar]
    ardha_context: str
    matched_verses: list[ArdhaVerse]
    compliance_tests: list[dict[str, str]]
    crisis_detected: bool = False


# Crisis keywords that should halt reframing
CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "want to die",
    "self-harm", "hurt myself", "cutting", "overdose",
    "no reason to live", "better off dead",
]


def detect_emotions(thought: str) -> list[tuple[str, float]]:
    """Detect emotional patterns in user input with confidence scores.

    Args:
        thought: User's raw thought/input text

    Returns:
        List of (emotion_name, confidence) tuples sorted by confidence
    """
    thought_lower = thought.lower()
    scores: dict[str, float] = {}

    for emotion, keywords in EMOTION_KEYWORDS.items():
        score = 0.0
        for keyword in keywords:
            if keyword in thought_lower:
                # Longer keyword matches get higher scores
                score += len(keyword.split()) * 0.5
        if score > 0:
            scores[emotion] = score

    # Sort by score descending
    sorted_emotions = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_emotions


def detect_crisis(thought: str) -> bool:
    """Check if user input contains crisis indicators.

    Args:
        thought: User's raw thought/input text

    Returns:
        True if crisis indicators detected
    """
    thought_lower = thought.lower()
    return any(keyword in thought_lower for keyword in CRISIS_KEYWORDS)


def analyze_thought(thought: str) -> ArdhaAnalysis:
    """Analyze a user's thought through the ARDHA framework.

    This is the core analysis function that:
    1. Detects emotional patterns
    2. Checks for crisis indicators
    3. Maps emotions to ARDHA pillars
    4. Selects relevant Gita verses
    5. Builds the ARDHA context for AI generation

    Args:
        thought: User's raw thought/input text

    Returns:
        ArdhaAnalysis with complete pillar recommendations and context
    """
    # Step 1: Crisis check
    crisis = detect_crisis(thought)
    if crisis:
        return ArdhaAnalysis(
            detected_emotions=["crisis"],
            primary_emotion="crisis",
            recommended_pillars=[],
            ardha_context="",
            matched_verses=[],
            compliance_tests=[],
            crisis_detected=True,
        )

    # Step 2: Detect emotions
    emotion_scores = detect_emotions(thought)
    detected_emotions = [e for e, _ in emotion_scores]

    # Default to general if no specific emotion detected
    primary_emotion = detected_emotions[0] if detected_emotions else "self_doubt"

    # Step 3: Map to ARDHA pillars
    recommended_pillars = get_pillar_for_emotion(primary_emotion)

    # If no specific mapping, include all pillars
    if not recommended_pillars:
        recommended_pillars = list(ARDHA_PILLARS)

    # Step 4: Collect relevant verses from recommended pillars
    matched_verses: list[ArdhaVerse] = []
    for pillar in recommended_pillars:
        matched_verses.extend(pillar.key_verses)

    # Step 5: Build ARDHA context
    ardha_context = build_ardha_context_for_prompt(recommended_pillars)

    # Step 6: Include compliance tests
    compliance_tests = ARDHA_COMPLIANCE_TESTS

    return ArdhaAnalysis(
        detected_emotions=detected_emotions,
        primary_emotion=primary_emotion,
        recommended_pillars=recommended_pillars,
        ardha_context=ardha_context,
        matched_verses=matched_verses,
        compliance_tests=compliance_tests,
        crisis_detected=False,
    )


def search_ardha_verses_in_corpus(
    gita_verses: list[dict[str, Any]],
    thought: str,
    analysis: ArdhaAnalysis,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Search the full 701-verse Gita corpus for ARDHA-relevant verses.

    Combines ARDHA pillar-specific search with emotional keyword matching
    to find the most relevant verses from the complete corpus.

    Args:
        gita_verses: The full 701-verse corpus loaded from JSON
        thought: User's raw thought for keyword matching
        analysis: The ArdhaAnalysis from analyze_thought()
        limit: Maximum verses to return

    Returns:
        List of verse dicts from the corpus, scored and sorted
    """
    if not gita_verses:
        return []

    thought_lower = thought.lower()
    thought_words = set(thought_lower.split())

    # Gather ARDHA-specific verse references for boosting
    ardha_refs = set(ARDHA_KEY_VERSE_REFS)
    extended_refs = set(ARDHA_EXTENDED_VERSE_REFS)

    # Gather mental health tags from recommended pillars
    pillar_tags: set[str] = set()
    for pillar in analysis.recommended_pillars:
        for verse in pillar.key_verses:
            pillar_tags.update(verse.mental_health_tags)

    scored_verses: list[tuple[float, dict[str, Any]]] = []

    for verse in gita_verses:
        score = 0.0
        chapter = verse.get("chapter", 0)
        verse_num = verse.get("verse", 0)
        ref = (chapter, verse_num)

        # Boost ARDHA key verses significantly
        if ref in ardha_refs:
            score += 5.0
        elif ref in extended_refs:
            score += 3.0

        # Match mental health tags from pillar recommendations
        mh_apps = verse.get("mental_health_applications", [])
        for app in mh_apps:
            if app.lower() in pillar_tags:
                score += 2.0

        # Theme matching
        theme = verse.get("theme", "").lower()
        for emotion in analysis.detected_emotions[:3]:
            if emotion.replace("_", " ") in theme or emotion.replace("_", "") in theme:
                score += 1.5

        # English text keyword matching
        english = verse.get("english", "").lower()
        for word in thought_words:
            if len(word) > 3 and word in english:
                score += 0.3

        # Principle matching
        principle = verse.get("principle", "").lower()
        for word in thought_words:
            if len(word) > 3 and word in principle:
                score += 0.2

        # Boost key chapters for spiritual wellness
        if chapter in [2, 3, 6, 12, 18]:
            score *= 1.2

        if score > 0:
            scored_verses.append((score, verse))

    scored_verses.sort(key=lambda x: x[0], reverse=True)
    return [v for _, v in scored_verses[:limit]]


def build_ardha_verse_context(
    corpus_verses: list[dict[str, Any]],
    analysis: ArdhaAnalysis,
) -> tuple[str, list[dict[str, str]]]:
    """Build the complete ARDHA context combining pillar verses and corpus search.

    Args:
        corpus_verses: Verses found in the 701-verse corpus search
        analysis: The ArdhaAnalysis from analyze_thought()

    Returns:
        Tuple of (context string for AI prompt, source references)
    """
    lines = ["[ARDHA_FRAMEWORK_CONTEXT]"]
    lines.append("ARDHA: Atma-Reframing through Dharma and Higher Awareness")
    lines.append(f"Primary emotion detected: {analysis.primary_emotion}")
    lines.append(f"Recommended pillars: {', '.join(p.name for p in analysis.recommended_pillars)}")
    lines.append("")

    sources: list[dict[str, str]] = []

    # Include pillar-specific verse context
    for pillar in analysis.recommended_pillars:
        lines.append(f"--- {pillar.code}: {pillar.name} ({pillar.sanskrit_name}) ---")
        lines.append(f"Teaching: {pillar.core_teaching}")
        lines.append(f"Reframe: {pillar.reframe_template}")
        lines.append(f"Compliance: {pillar.compliance_test}")

        for verse in pillar.key_verses[:3]:
            lines.append(f"  {verse.reference}: {verse.english[:200]}")
            lines.append(f"  Principle: {verse.principle}")
            lines.append(f"  Guidance: {verse.reframe_guidance}")
            sources.append({
                "file": "data/ardha_knowledge_base.py",
                "reference": verse.reference,
            })
        lines.append("")

    # Include corpus search results
    if corpus_verses:
        lines.append(f"--- Supporting Verses from 701-Verse Corpus ({len(corpus_verses)} found) ---")
        for verse in corpus_verses:
            chapter = verse.get("chapter", 0)
            verse_num = verse.get("verse", 0)
            ref = f"BG {chapter}.{verse_num}"
            english = verse.get("english", "")
            principle = verse.get("principle", "")
            mh_apps = verse.get("mental_health_applications", [])

            lines.append(f"  {ref}: {english[:200]}")
            if principle:
                lines.append(f"  Principle: {principle}")
            if mh_apps:
                lines.append(f"  Applications: {', '.join(mh_apps[:5])}")

            sources.append({
                "file": "data/gita/gita_verses_complete.json",
                "reference": ref,
            })
        lines.append("")

    # Include compliance tests
    lines.append("--- 5 Tests of Gita Compliance ---")
    for i, test in enumerate(ARDHA_COMPLIANCE_TESTS, 1):
        lines.append(f"  {i}. {test['test']} (Pillar {test['pillar']})")

    lines.append("[/ARDHA_FRAMEWORK_CONTEXT]")
    return "\n".join(lines), sources


def validate_ardha_compliance(response: str) -> dict[str, Any]:
    """Validate that an ARDHA response passes the 5 Gita compliance tests.

    Checks for the presence of ARDHA section headings and key concepts
    that indicate each pillar was properly addressed.

    Args:
        response: The AI-generated ARDHA response text

    Returns:
        Dict with compliance results for each of the 5 tests
    """
    response_lower = response.lower()

    results: dict[str, Any] = {
        "overall_compliant": False,
        "tests": [],
        "score": 0,
        "max_score": 5,
    }

    # Test 1: Atma Distinction (identity detachment)
    atma_indicators = [
        "atma", "witness", "self", "identity", "observer",
        "instrument", "ego", "not your", "not the",
    ]
    atma_pass = any(ind in response_lower for ind in atma_indicators)
    results["tests"].append({
        "test": "Identity detached from role",
        "pillar": "A",
        "passed": atma_pass,
    })

    # Test 2: Raga-Dvesha (action without craving)
    raga_indicators = [
        "attachment", "aversion", "raga", "dvesha", "craving",
        "desire", "fear of loss", "recognition", "validation",
    ]
    raga_pass = any(ind in response_lower for ind in raga_indicators)
    results["tests"].append({
        "test": "Action without craving",
        "pillar": "R",
        "passed": raga_pass,
    })

    # Test 3: Dharma (outcome released)
    dharma_indicators = [
        "duty", "dharma", "effort", "action", "2.47",
        "fruits", "outcome", "result", "control",
    ]
    dharma_pass = any(ind in response_lower for ind in dharma_indicators)
    results["tests"].append({
        "test": "Outcome mentally released",
        "pillar": "D",
        "passed": dharma_pass,
    })

    # Test 4: Samatvam (equanimity maintained)
    samatvam_indicators = [
        "equanimity", "steady", "balanced", "samatvam",
        "equal", "gain and loss", "success and failure",
    ]
    samatvam_pass = any(ind in response_lower for ind in samatvam_indicators)
    results["tests"].append({
        "test": "Equanimity maintained",
        "pillar": "H",
        "passed": samatvam_pass,
    })

    # Test 5: Arpana (action offered beyond ego)
    arpana_indicators = [
        "offering", "surrender", "arpana", "release",
        "let go", "larger order", "ishvara", "dedicate",
    ]
    arpana_pass = any(ind in response_lower for ind in arpana_indicators)
    results["tests"].append({
        "test": "Action offered beyond ego",
        "pillar": "A2",
        "passed": arpana_pass,
    })

    # Calculate overall compliance
    passed_count = sum(1 for t in results["tests"] if t["passed"])
    results["score"] = passed_count
    results["overall_compliant"] = passed_count >= 3  # At least 3/5 for compliance

    return results


def get_crisis_response() -> str:
    """Return a compassionate crisis response that pauses ARDHA reframing.

    Returns:
        Crisis response text that encourages seeking support
    """
    return (
        "I hear you, and what you are feeling matters deeply.\n\n"
        "Right now, ARDHA reframing is not the right tool. "
        "You deserve direct, compassionate support.\n\n"
        "Please reach out to someone you trust:\n"
        "- A trusted friend or family member\n"
        "- A mental health professional\n"
        "- Crisis helpline (India): iCall 9152987821 or Vandrevala Foundation 1860-2662-345\n"
        "- International: Crisis Text Line — text HOME to 741741\n\n"
        "The Gita teaches that every being is precious (BG 6.5): "
        "'One must elevate, not degrade, oneself by one's own mind.' "
        "Your mind may feel like an enemy right now, but support can help "
        "make it your greatest friend.\n\n"
        "You are not alone. Please reach out."
    )
