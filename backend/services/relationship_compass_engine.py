"""Relationship Compass Engine - Deep Gita-grounded relationship clarity service.

This module provides the core engine for the Relationship Compass, translating
Bhagavad Gita principles into modern psychology and behavioral clarity. It handles
mode detection, mechanism analysis, and structured response generation.

The engine now integrates deeply with the full 700+ verse Gita corpus and curated
relationship principles through RelationshipWisdomCore, ensuring every response is
grounded in authentic Bhagavad Gita wisdom while expressed in modern, secular language.

Key capabilities:
- Mode detection: Conflict, Boundary, Repair, Decision, Pattern, Courage
- Mechanism identification: Attachment activation, ego injury, control attempt, etc.
- Deep Gita wisdom integration: 700+ verse corpus search + 20 curated principles
- Gita Wisdom Filter: All AI responses validated for Gita grounding
- Structured responses: Emotional Precision, Mechanism Insight, Hard Truth, Action, Script
- Rule-based fallback when AI is unavailable
- Safety detection for abuse/crisis situations
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

logger = logging.getLogger(__name__)

ANALYSIS_MODEL = os.getenv("RELATIONSHIP_ENGINE_ANALYSIS_MODEL", "gpt-4o-mini")


class RelationshipMode(StrEnum):
    """The six modes the engine can detect from user input."""
    CONFLICT = "conflict"
    BOUNDARY = "boundary"
    REPAIR = "repair"
    DECISION = "decision"
    PATTERN = "pattern"
    COURAGE = "courage"


class Mechanism(StrEnum):
    """Psychological mechanisms the engine can identify."""
    ATTACHMENT_ACTIVATION = "attachment_activation"
    UNMET_EXPECTATION = "unmet_expectation"
    EGO_INJURY = "ego_injury"
    EMOTIONAL_FLOODING = "emotional_flooding"
    CONTROL_ATTEMPT = "control_attempt"
    PATTERN_REPETITION = "pattern_repetition"
    PROJECTION = "projection"
    ENMESHMENT = "enmeshment"
    AVOIDANCE = "avoidance"
    APPROVAL_SEEKING = "approval_seeking"


@dataclass
class EngineAnalysis:
    """Structured analysis of a relationship situation."""

    mode: str = "conflict"
    primary_emotion: str = ""
    secondary_emotions: list[str] = field(default_factory=list)
    emotional_intensity: str = "moderate"
    mechanism: str = ""
    mechanism_detail: str = ""
    power_dynamic: str = "unknown"
    boundary_needed: bool = False
    safety_concern: bool = False
    pattern_identified: str | None = None
    user_contribution: str = ""
    core_need: str = ""
    confidence: float = 0.0
    analysis_depth: str = "standard"


# ──────────────────────────────────────────────────────────────
# Mode Detection - Rule-Based
# ──────────────────────────────────────────────────────────────

MODE_INDICATORS: dict[str, list[str]] = {
    "courage": [
        "be honest", "tell me the truth", "am i the problem",
        "don't sugarcoat", "give it to me straight", "am i wrong",
        "is it me", "what am i doing wrong", "honest feedback",
        "am i being unreasonable", "hard truth", "don't hold back",
    ],
    "boundary": [
        "keeps doing", "won't stop", "disrespect", "crossed the line",
        "takes advantage", "walked over", "no respect", "doesn't listen",
        "ignores my", "violates", "repeatedly", "boundary", "boundaries",
        "tolerating", "putting up with", "enough is enough",
        "how do i make them stop", "won't take no",
    ],
    "pattern": [
        "keeps happening", "same thing", "every time", "cycle",
        "pattern", "always ends up", "we always", "never changes",
        "this again", "deja vu", "rinse and repeat", "stuck in",
        "recurring", "over and over", "history repeating",
    ],
    "repair": [
        "apologize", "fix this", "mend", "make it right",
        "i messed up", "i said something", "regret", "take back",
        "repair", "damaged", "broke trust", "rebuild", "i hurt them",
        "how do i make up", "reconcile", "i was wrong",
    ],
    "decision": [
        "should i", "what do i do", "torn between", "can't decide",
        "leave or stay", "worth it", "give up", "keep trying",
        "is it over", "do i", "wondering if", "not sure whether",
        "end it", "walk away", "hold on",
    ],
    "conflict": [
        "fight", "argument", "disagree", "yelled", "screamed",
        "blew up", "confrontation", "clash", "tension", "hostile",
        "argued", "fighting", "heated", "angry at", "furious",
    ],
}

SAFETY_INDICATORS = [
    "hit me", "hits me", "punched", "slapped", "choked",
    "threatened to kill", "afraid for my life", "physical violence",
    "sexually assaulted", "forced me", "locked me in",
    "won't let me leave", "controls everything", "isolates me",
    "threatens my children", "hurts the kids",
    "want to die", "kill myself", "suicide", "self-harm",
    "end my life", "no reason to live",
]

# Emotion keywords for precise labeling
EMOTION_INDICATORS: dict[str, list[str]] = {
    "humiliated": ["humiliated", "embarrassed", "shamed", "mortified", "made fun of"],
    "dismissed": ["dismissed", "brushed off", "ignored", "not taken seriously", "invisible"],
    "controlled": ["controlled", "manipulated", "dictated", "micromanaged", "no freedom"],
    "betrayed": ["betrayed", "cheated", "lied to", "went behind my back", "stabbed in the back"],
    "abandoned": ["abandoned", "left", "ghosted", "walked out", "disappeared"],
    "suffocated": ["suffocated", "smothered", "too clingy", "no space", "can't breathe"],
    "inadequate": ["not enough", "inadequate", "failure", "can't measure up", "never good enough"],
    "resentful": ["resentful", "bitter", "grudge", "can't let go", "still angry about"],
    "guilty": ["guilty", "blame myself", "my fault", "feel terrible", "shouldn't have"],
    "powerless": ["powerless", "helpless", "trapped", "no options", "nothing i can do"],
    "angry": ["angry", "furious", "mad", "rage", "livid", "pissed"],
    "hurt": ["hurt", "wounded", "pain", "heartbroken", "devastated"],
    "anxious": ["anxious", "worried", "nervous", "scared", "afraid", "terrified"],
    "confused": ["confused", "lost", "don't understand", "bewildered", "mixed signals"],
    "lonely": ["lonely", "alone", "isolated", "disconnected", "nobody understands"],
    "jealous": ["jealous", "envious", "insecure", "comparing", "threatened"],
    "exhausted": ["exhausted", "drained", "burned out", "tired of", "depleted"],
    "disappointed": ["disappointed", "let down", "expected more", "thought they would"],
}

MECHANISM_INDICATORS: dict[str, list[str]] = {
    "attachment_activation": [
        "afraid they'll leave", "need reassurance", "can't stop thinking about",
        "checking their phone", "anxious when apart", "afraid of losing",
        "what if they leave", "clingy", "insecure",
    ],
    "unmet_expectation": [
        "expected", "thought they would", "should have", "promised",
        "was supposed to", "let me down", "didn't follow through",
    ],
    "ego_injury": [
        "disrespected", "talked down to", "made me look", "in front of people",
        "doesn't value me", "took me for granted", "belittled",
    ],
    "emotional_flooding": [
        "can't think straight", "overwhelmed", "shut down", "go blank",
        "freeze up", "too much", "can't handle", "spiraling",
    ],
    "control_attempt": [
        "make them", "force them", "how do i get them to",
        "change them", "they need to", "won't do what i want",
    ],
    "pattern_repetition": [
        "same thing", "keeps happening", "always ends", "every relationship",
        "my parents did this", "just like my ex", "familiar feeling",
    ],
    "avoidance": [
        "avoiding", "putting off", "don't want to deal", "pretending",
        "ignoring the issue", "hoping it goes away", "not ready to",
    ],
    "approval_seeking": [
        "need their approval", "want them to be proud", "need validation",
        "do anything to make them happy", "people pleaser", "can't say no",
        "afraid to disappoint",
    ],
    "projection": [
        "they're just like", "they must think", "i know what they're thinking",
        "they obviously", "they clearly don't care",
    ],
    "enmeshment": [
        "can't tell where i end", "their mood affects mine",
        "responsible for their feelings", "can't be happy unless they are",
        "their problem is my problem", "codependent",
    ],
}


def detect_mode(text: str) -> str:
    """Detect the relationship mode from user input using keyword matching.

    Checks in priority order: safety first, then courage, boundary, pattern,
    repair, decision, and finally conflict as default.

    Args:
        text: The user's input describing their situation.

    Returns:
        The detected mode as a string.
    """
    text_lower = text.lower()

    # Courage mode takes priority when user explicitly asks for honesty
    for indicator in MODE_INDICATORS["courage"]:
        if indicator in text_lower:
            return RelationshipMode.COURAGE.value

    # Score each mode
    mode_scores: dict[str, int] = {}
    for mode, indicators in MODE_INDICATORS.items():
        score = sum(1 for ind in indicators if ind in text_lower)
        if score > 0:
            mode_scores[mode] = score

    if mode_scores:
        return max(mode_scores, key=mode_scores.get)

    return RelationshipMode.CONFLICT.value


def detect_safety_concern(text: str) -> bool:
    """Check if the input contains safety-critical indicators.

    Args:
        text: The user's input.

    Returns:
        True if safety concern detected.
    """
    text_lower = text.lower()
    return any(indicator in text_lower for indicator in SAFETY_INDICATORS)


def detect_primary_emotion(text: str) -> str:
    """Detect the most specific emotion from user input.

    Prioritizes precise emotional labels over generic ones.

    Args:
        text: The user's input.

    Returns:
        The detected emotion label.
    """
    text_lower = text.lower()
    best_emotion = ""
    best_score = 0

    for emotion, indicators in EMOTION_INDICATORS.items():
        score = sum(1 for ind in indicators if ind in text_lower)
        if score > best_score:
            best_score = score
            best_emotion = emotion

    return best_emotion or "distressed"


def detect_mechanism(text: str) -> tuple[str, str]:
    """Detect the psychological mechanism at play.

    Args:
        text: The user's input.

    Returns:
        Tuple of (mechanism_name, brief_detail).
    """
    text_lower = text.lower()
    best_mechanism = ""
    best_score = 0

    for mechanism, indicators in MECHANISM_INDICATORS.items():
        score = sum(1 for ind in indicators if ind in text_lower)
        if score > best_score:
            best_score = score
            best_mechanism = mechanism

    mechanism_details = {
        "attachment_activation": "Your attachment system is activated — the part of you that monitors connection safety is in overdrive.",
        "unmet_expectation": "There's a gap between what you expected and what actually happened. The pain is in that gap.",
        "ego_injury": "Your sense of worth or status feels threatened. This isn't vanity — it's a fundamental need for respect.",
        "emotional_flooding": "Your nervous system is overwhelmed. When flooded, the thinking brain goes offline and the survival brain takes over.",
        "control_attempt": "You're trying to manage an outcome that isn't in your control. The frustration comes from the gap between effort and result.",
        "pattern_repetition": "This dynamic is familiar — your nervous system recognizes it from before and is responding with a well-worn script.",
        "avoidance": "You're choosing short-term comfort over necessary discomfort. The issue isn't going away — it's compounding.",
        "approval_seeking": "You're calibrating your behavior to their approval rather than your own values. Your sense of self is outsourced.",
        "projection": "You may be reading their intentions through the lens of your own fears rather than their actual behavior.",
        "enmeshment": "The line between your emotional state and theirs has blurred. Their feelings have become your responsibility.",
    }

    if not best_mechanism:
        best_mechanism = "unmet_expectation"

    detail = mechanism_details.get(best_mechanism, "A core relational dynamic is at play.")
    return best_mechanism, detail


def detect_boundary_needed(text: str) -> bool:
    """Detect if boundary-setting is relevant to the situation.

    Args:
        text: The user's input.

    Returns:
        True if boundary language is detected.
    """
    text_lower = text.lower()
    boundary_signals = [
        "keeps doing", "won't stop", "doesn't respect", "takes advantage",
        "ignores", "repeatedly", "boundary", "boundaries", "how do i stop",
        "crossed the line", "enough", "tolerate",
    ]
    return any(signal in text_lower for signal in boundary_signals)


def rule_based_analysis(
    text: str,
    relationship_type: str = "romantic",  # noqa: ARG001 — kept for API contract
) -> EngineAnalysis:
    """Perform rule-based analysis when AI is unavailable.

    Uses keyword matching to classify mode, emotion, mechanism, and other
    dimensions of the relationship situation.

    Args:
        text: The user's input.
        relationship_type: Type of relationship.

    Returns:
        EngineAnalysis with rule-based insights.
    """
    mode = detect_mode(text)
    safety = detect_safety_concern(text)
    emotion = detect_primary_emotion(text)
    mechanism, mechanism_detail = detect_mechanism(text)
    boundary = detect_boundary_needed(text)

    # Detect secondary emotions
    text_lower = text.lower()
    secondary = []
    for emo, indicators in EMOTION_INDICATORS.items():
        if emo == emotion:
            continue
        if any(ind in text_lower for ind in indicators):
            secondary.append(emo)
    secondary = secondary[:3]

    # Detect intensity
    intensity_high = ["extremely", "unbearable", "can't take it", "crisis", "breaking point", "losing it"]
    intensity_low = ["slightly", "a bit", "mildly", "somewhat"]
    if any(ind in text_lower for ind in intensity_high):
        intensity = "high"
    elif any(ind in text_lower for ind in intensity_low):
        intensity = "low"
    else:
        intensity = "moderate"

    if safety:
        intensity = "overwhelming"

    return EngineAnalysis(
        mode=mode,
        primary_emotion=emotion,
        secondary_emotions=secondary,
        emotional_intensity=intensity,
        mechanism=mechanism,
        mechanism_detail=mechanism_detail,
        power_dynamic="unknown",
        boundary_needed=boundary,
        safety_concern=safety,
        pattern_identified=None,
        user_contribution="",
        core_need="",
        confidence=0.4,
        analysis_depth="rule_based",
    )


async def ai_analysis(
    text: str,
    relationship_type: str = "romantic",
) -> EngineAnalysis:
    """Perform AI-powered analysis of a relationship situation.

    Uses multi-provider AI to deeply analyze the user's input, detecting
    mode, emotion, mechanism, power dynamics, and more.

    Falls back to rule-based analysis if AI is unavailable.

    Args:
        text: The user's input.
        relationship_type: Type of relationship.

    Returns:
        EngineAnalysis with AI-enhanced insights.
    """
    from backend.services.relationship_compass_engine_prompt import (
        RELATIONSHIP_ENGINE_ANALYSIS_PROMPT,
    )

    user_message = f"Relationship type: {relationship_type}\n\nSituation:\n{text}"

    # Try multi-provider manager first
    try:
        from backend.services.ai.providers.provider_manager import get_provider_manager
        provider_manager = get_provider_manager()

        if provider_manager:
            response = await provider_manager.chat(
                messages=[
                    {"role": "system", "content": RELATIONSHIP_ENGINE_ANALYSIS_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.2,
                max_tokens=600,
            )

            if response and response.content:
                return _parse_analysis_response(response.content, text, relationship_type)

    except Exception as e:
        logger.warning(f"AI provider manager failed for engine analysis: {e}")

    # Fallback: try direct OpenAI
    try:
        from openai import OpenAI
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if api_key:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=ANALYSIS_MODEL,
                messages=[
                    {"role": "system", "content": RELATIONSHIP_ENGINE_ANALYSIS_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.2,
                max_tokens=600,
                timeout=15.0,
            )
            content = response.choices[0].message.content if response.choices else None
            if content:
                return _parse_analysis_response(content, text, relationship_type)
    except Exception as e:
        logger.warning(f"Direct OpenAI analysis failed: {e}")

    # Final fallback: rule-based
    logger.info("Using rule-based analysis for Relationship Compass Engine")
    return rule_based_analysis(text, relationship_type)


def _parse_analysis_response(
    content: str,
    original_text: str,
    relationship_type: str,
) -> EngineAnalysis:
    """Parse AI analysis response JSON into EngineAnalysis.

    Args:
        content: Raw AI response content.
        original_text: The original user input (for fallback).
        relationship_type: Type of relationship.

    Returns:
        EngineAnalysis from parsed JSON or rule-based fallback.
    """
    try:
        # Clean up response if wrapped in markdown
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        cleaned = cleaned.strip()

        data = json.loads(cleaned)

        analysis = EngineAnalysis(
            mode=data.get("mode", "conflict"),
            primary_emotion=data.get("primary_emotion", ""),
            secondary_emotions=data.get("secondary_emotions", []),
            emotional_intensity=data.get("emotional_intensity", "moderate"),
            mechanism=data.get("mechanism", ""),
            mechanism_detail=data.get("mechanism_detail", ""),
            power_dynamic=data.get("power_dynamic", "unknown"),
            boundary_needed=data.get("boundary_needed", False),
            safety_concern=data.get("safety_concern", False),
            pattern_identified=data.get("pattern_identified"),
            user_contribution=data.get("user_contribution", ""),
            core_need=data.get("core_need", ""),
            confidence=float(data.get("confidence", 0.7)),
            analysis_depth="ai_enhanced",
        )

        logger.info(
            f"Engine analysis: mode={analysis.mode}, "
            f"emotion={analysis.primary_emotion}, "
            f"mechanism={analysis.mechanism}, "
            f"confidence={analysis.confidence:.2f}"
        )

        return analysis

    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.warning(f"Failed to parse engine analysis JSON: {e}")
        return rule_based_analysis(original_text, relationship_type)


def build_fallback_response(
    analysis: EngineAnalysis,
    text: str,  # noqa: ARG001 — kept for API contract
    relationship_type: str,  # noqa: ARG001 — kept for API contract
) -> dict[str, str]:
    """Build a rule-based fallback response using the strict 5-step Gita framework.

    Generates the 5-step Gita framework sections plus Real Text Message and
    Real Test sections. Uses pre-written templates informed by Gita-translated
    principles, matching each step to a specific Gita teaching.

    Steps:
    1. Pause Before Reacting (Modern Samatvam)
    2. Identify the Attachment (Root cause analysis)
    3. Regulate Before You Communicate (Chapter 6 mastery)
    4. Speak Without Demanding an Outcome (Karma Yoga Applied)
    5. See Their Humanity (Sama-darshana / Equal Vision)
    + What This Looks Like in Practice (Real Text Message)
    + The Real Test (Aftermath guidance)

    Args:
        analysis: The EngineAnalysis result.
        text: The original user input.
        relationship_type: Type of relationship.

    Returns:
        Dict of section name -> section content.
    """
    mode = analysis.mode
    emotion = analysis.primary_emotion or "distressed"
    mechanism = analysis.mechanism or "unmet_expectation"

    # Step 1: Pause Before Reacting (Modern Samatvam)
    reactive_urges = {
        "conflict": "send a long message defending yourself, point out everything they did wrong, or call someone to vent",
        "boundary": "snap back, give an ultimatum in the heat of the moment, or shut down completely",
        "repair": "rush to apologize just to make the discomfort stop, or over-explain yourself",
        "decision": "ask ten people for their opinion, or make a hasty choice just to end the uncertainty",
        "pattern": "react the same way you always do — because the script is so familiar it runs on autopilot",
        "courage": "get defensive, or deflect by pointing out what THEY'VE done wrong",
    }

    step1_urge = reactive_urges.get(mode, reactive_urges["conflict"])

    step1 = (
        f"Right now, part of you wants to {step1_urge}. "
        f"Pause. You feel {emotion} — and that feeling is real and valid. Name it. Sit with it for a moment. "
        f"Your mind is telling you a story about what this means — about your worth, about their intentions, about what you deserve. "
        f"Notice that story. The disturbance is inside you, and recognizing that isn't weakness — it IS the practice. "
        f"That pause alone prevents 80% of the damage."
    )

    # Step 2: Identify the Attachment
    attachment_maps = {
        "attachment_activation": "You were attached to feeling secure — to knowing your place in their heart was stable. The fear of losing that safety is what's driving the intensity right now.",
        "unmet_expectation": "You were attached to a specific outcome — to how they SHOULD have responded, to what they SHOULD have understood. The pain lives in the gap between what you hoped for and what you got.",
        "ego_injury": "You were attached to being respected, to being valued, to being seen as someone who matters. When that was challenged, it struck at something deeper than the event itself.",
        "emotional_flooding": "You were attached to staying in control — and the intensity of what you're feeling has overwhelmed that. Your nervous system has taken over, and the thinking part of you has gone offline.",
        "control_attempt": "You were attached to managing their behavior — to getting them to see, understand, or change. That's an outcome you were never going to be able to guarantee.",
        "pattern_repetition": "You were attached to the hope that THIS time would be different. That hope kept you in the same cycle. The attachment isn't to them — it's to the version of them that matches what you need.",
        "avoidance": "You were attached to comfort — to not having to face the hard conversation or the painful truth. The avoidance feels like protection, but it's actually letting the problem grow.",
        "approval_seeking": "You were attached to their approval — filtering your words, your choices, even your feelings through 'Will they be okay with this?' That's not love. That's outsourcing your self-worth.",
        "projection": "You were attached to a narrative about their intentions — one that might say more about your fears than about their reality. Before you respond to what you THINK they meant, check: is this fact or fear?",
        "enmeshment": "You were attached to their emotional state as if it were your own. Their mood became your mood. Their peace became your peace. That's not empathy — it's losing yourself.",
    }

    step2 = attachment_maps.get(
        mechanism,
        "Ask yourself honestly: Were you attached to being valued? To being right? To immediate reassurance? "
        "The EVENT was what happened. The STORY your mind created is the interpretation, the fear, the meaning-making. "
        "Separate the two. The Gita teaches that anger begins when desire is frustrated — so instead of blaming, "
        "release the expectation first."
    )

    # Step 3: Regulate Before You Communicate
    regulation_steps = {
        "conflict": "Write what you want to say. Don't send it. Wait 2 hours. Reread it. Rewrite from a place of calm. Go for a short walk. Breathe slowly. Do NOT text while your chest is still tight. Respond only when your nervous system is settled — not when you've rehearsed the perfect comeback.",
        "boundary": "Feel the anger fully. Let it burn through you without acting on it. Then — and only then — state your limit from a place of clarity, not rage. A boundary spoken from anger sounds like a threat. A boundary spoken from calm sounds like truth. Take 10 minutes. Sit. Breathe. Let the reactive fire settle before you speak.",
        "repair": "Sit with the guilt. Don't rush to apologize just to escape the discomfort — that's an apology for YOUR relief, not their healing. Let the weight of what happened actually land. Breathe through it. When you feel the difference between urgency and genuine understanding, THEN you're ready to speak.",
        "decision": "Stop asking others what to do. Get quiet. Put the phone down for 30 minutes. Sit somewhere alone. Your inner knowing has been speaking this whole time — you've just been too noisy to hear it. The clarity won't come from more information. It'll come from stillness.",
        "pattern": "Notice the exact moment the familiar script starts playing — that's your intervention point. The old pattern has a trigger, a reaction, and a predictable outcome. Your job is to catch yourself at the REACTION stage and choose something different. Even pausing 30 seconds before responding breaks the automatic cycle.",
        "courage": "Before you ask for honest feedback from them, get honest with yourself first. Sit down. Write out what YOU already know about your part in this. Don't edit it. Don't soften it. What do you see? Start there. The courage to look inward is the hardest and most important kind.",
    }

    step3 = regulation_steps.get(mode, regulation_steps["conflict"])

    # Step 4: Speak Without Demanding an Outcome (Karma Yoga Applied)
    karma_yoga_speech = {
        "conflict": (
            "Instead of: \"You always do this. You don't care.\"\n\n"
            "Try: \"When [specific thing] happened, I felt [specific emotion]. I value this relationship, so I wanted to share that honestly. "
            "I'm not looking for you to fix it or defend yourself — I just need you to know where I'm at.\"\n\n"
            "Notice the difference: No accusation. No demand. No emotional manipulation. No 'you must fix this.' "
            "You are doing your duty — honesty. You release the fruit — their reaction. "
            "If they respond defensively, you remain steady. If they apologize, you remain steady. That steadiness is the practice."
        ),
        "boundary": (
            "Instead of: \"If you do that again, we're done.\"\n\n"
            "Try: \"I care about us, which is why I need to be clear: when [behavior] happens, it's not something I can keep accepting. "
            "If it continues, I will [specific consequence]. This isn't a threat — it's me taking care of what I need so I can still show up with my heart intact.\"\n\n"
            "A boundary isn't a request. It's a statement of what YOU will do. Their reaction to your boundary is their responsibility. Yours is to follow through."
        ),
        "repair": (
            "Instead of: \"I'm sorry, but you also...\"\n\n"
            "Try: \"I did [specific action], and I can see it [specific impact on them]. I'm not going to explain why — what matters is that I hurt you. "
            "I'm genuinely sorry. What do you need from me right now?\"\n\n"
            "No justification. No deflection. No asking for forgiveness yet — that puts pressure on them. "
            "Apologize because it's RIGHT, not because you need a particular response. Repair is an offering, not a transaction."
        ),
        "decision": (
            "This step isn't about speaking to someone — it's about discerning.\n\n"
            "Write your options down. Under each, write: \"If I choose this, what am I accepting? What am I losing? What am I gaining?\"\n\n"
            "Then ask the one question that cuts through everything: \"Which choice can I respect myself for in a year?\" "
            "Not which is easiest. Not which avoids the most pain. Trust that inner knowing — it's been speaking to you all along."
        ),
        "pattern": (
            "Instead of playing out the familiar script:\n\n"
            "Try: \"I've been noticing something between us. When [trigger] happens, I tend to [your pattern], "
            "and then you [their pattern], and we end up right back where we started. I don't want to keep doing this dance. "
            "I'm willing to start by changing how I [your part]. Can we figure this out together?\"\n\n"
            "Do ONE thing differently. Not everything — just one link in the chain. Break one link and the whole pattern starts to shift."
        ),
        "courage": (
            "The honest reckoning starts with you.\n\n"
            "Ask yourself: What am I doing that makes this situation worse? Not what they're doing — what's YOUR part? "
            "Write it down. Don't soften it. The Gita teaches that self-inquiry is the beginning of all wisdom.\n\n"
            "Then decide: Are you willing to change that specific behavior? If yes, start today. Not after they change first. Now. "
            "Your willingness to go first is not weakness — it's the kind of strength most people never find."
        ),
    }

    step4 = karma_yoga_speech.get(mode, karma_yoga_speech["conflict"])

    # Step 5: See Their Humanity (Equal Vision / Sama-darshana)
    equal_vision = {
        "conflict": "Instead of assuming they were trying to hurt you, consider: Maybe they're stressed. Maybe they're carrying something you can't see. Maybe they communicated badly because they were overwhelmed, not because they don't care. Equal vision doesn't mean excusing the behavior — it means you don't reduce a whole person to one moment. Hold space for their complexity while protecting your own peace.",
        "boundary": "The person crossing your boundary may not realize the weight of what they're doing. That doesn't make it acceptable — but it means your firmness can coexist with compassion. You can hold a boundary AND see their struggle. These aren't contradictory. In fact, the strongest boundaries come from people who understand both sides clearly.",
        "repair": "The person you hurt is dealing with their own pain right now. They may not be ready to hear your apology. They may be questioning things you don't know about. See THEIR experience — not just your guilt. Real repair requires seeing their world through their eyes, not just managing your own discomfort.",
        "decision": "Every option involves real people with real feelings — including you. There's no choice that avoids all pain. But there might be a choice that honors the most truth. See yourself and everyone involved as whole humans navigating something difficult — not as problems to be solved.",
        "pattern": "The other person in this pattern has their own history, their own triggers, their own fears that drive their side of the cycle. You don't need to fix their part — but seeing it clearly helps you stop taking it personally. Their pattern isn't about you. Yours isn't about them. You're both doing familiar dances learned long ago.",
        "courage": "If you've been contributing to the problem, that doesn't make you a bad person. It makes you human. And if they've been contributing too, that doesn't make them a villain. See both of you clearly — flawed, trying, sometimes missing the mark. That honest seeing is the foundation of real change.",
    }

    step5 = equal_vision.get(mode, equal_vision["conflict"])

    # Real Text Message / Practice
    real_messages = {
        "conflict": "\"Hey, I realized I reacted internally because I had expectations. I value our relationship, so I wanted to say I felt [emotion] when [event]. No blame — I just wanted to be open. I'm good, and I hope we can stay steady with each other.\"",
        "boundary": "\"I care about us, which is why I need to be honest: [specific behavior] isn't something I can keep accepting. Going forward, if it happens again, I'll [consequence]. This isn't an ultimatum — it's me being clear about what I need to stay in this with my heart intact.\"",
        "repair": "\"I owe you an honest apology. I [specific action], and I know it [impact]. I'm not going to explain why — that doesn't matter right now. What matters is I hurt you, and I'm sorry. Tell me what you need from me. I'll listen.\"",
        "decision": "Journal prompt: \"If I trusted myself completely, I would choose ____. The reason I'm hesitating is ____. The choice I can respect myself for in a year is ____.\" Sit with your answers. Don't rush. Let clarity find you.",
        "pattern": "\"I've noticed something between us, and I want to try something different. Usually when [trigger] happens, I [your pattern]. This time, I'm going to [new choice]. I'm not asking you to change first — I'm starting with me.\"",
        "courage": "Inner practice: Write down your honest answer to: \"What am I doing that makes this worse?\" Don't share it yet. Just sit with it. Let it land. When you feel ready — not defensive, not guilty, just clear — decide what you'll do differently. Start tomorrow.",
    }

    real_message = real_messages.get(mode, real_messages["conflict"])

    # The Real Test
    real_test = (
        "The real practice begins after you act. "
        "If they reply coldly — can you stay peaceful? If they don't reply at all — can you stay steady? "
        "If they misunderstand — can you resist the urge to over-explain? "
        "THAT is the real test. Modern life is constant mini Kurukshetras — group chats, work misunderstandings, "
        "social media triggers, relationship expectations. The battlefield has changed. The mind has not.\n\n"
        "The Gita's 10/10 standard: You don't suppress emotions. You don't explode emotions. You observe them. "
        "You act from clarity. You surrender the result. "
        "And most importantly — you protect your inner equilibrium more than your ego."
    )

    # Safety override
    if analysis.safety_concern:
        step1 = "What you're describing sounds like it may involve safety concerns. Your physical and emotional safety comes first — above the relationship, above keeping peace, above everything."
        step2 = "This situation has moved beyond relationship dynamics into territory that requires professional support. A relationship clarity tool is not the right resource for this."
        step3 = "If you are in danger, prioritize getting safe. Don't worry about processing emotions right now — that comes after safety is secured."
        step4 = "If you are in danger, no amount of communication strategy or self-reflection fixes that. Safety is the priority. Not the relationship. Not their feelings. Your safety."
        step5 = "This is not a situation where seeing their humanity applies. Your wellbeing is the priority."
        real_message = "Contact a professional resource. US: National Domestic Violence Hotline 1-800-799-7233. Suicide & Crisis Lifeline: 988. Tell someone you trust what is happening."
        real_test = "The only test that matters right now is: Are you safe? If not, reach out for help. You don't have to figure this out alone."

    return {
        "mode": mode,
        "step1_pause": step1,
        "step2_attachment": step2,
        "step3_regulate": step3,
        "step4_karma_yoga": step4,
        "step5_equal_vision": step5,
        "real_message": real_message,
        "real_test": real_test,
        # Legacy keys for backward compat (map to closest 5-step equivalent)
        "emotional_precision": step1,
        "what_happening": step2,
        "hard_truth": step4,
        "what_to_do": step3,
        "script": real_message,
    }


async def gather_wisdom_context(
    situation: str,
    analysis: EngineAnalysis,
    relationship_type: str = "romantic",
    db: Any = None,
) -> dict[str, Any]:
    """Gather Gita wisdom from ALL sources: static corpus + principles + dynamic DB + learned.

    Uses the full RelationshipWisdomCore.gather_wisdom() pipeline which integrates:
    1. 20 curated relationship principles (static, always available)
    2. 700+ verse Gita static corpus (in-memory, always available)
    3. Dynamic DB Gita verses (if database session provided)
    4. Learned/validated wisdom from the 24/7 daemon (if database session provided)

    The gathered wisdom is formatted into a rich context block using
    WisdomContext.to_context_block() which structures all sources for the AI prompt.

    Args:
        situation: The user's relationship situation text.
        analysis: Pre-computed EngineAnalysis of the situation.
        relationship_type: Type of relationship.
        db: Optional database session for dynamic wisdom retrieval.

    Returns:
        Dict with wisdom context including verses, principles, and formatted block.
    """
    try:
        from backend.services.relationship_wisdom_core import get_relationship_wisdom_core  # noqa: I001

        rwc = get_relationship_wisdom_core()

        # Use the full gather_wisdom() method for ALL sources (static + dynamic + learned)
        wisdom_context = await rwc.gather_wisdom(
            db=db,
            situation=situation,
            mode=analysis.mode,
            emotion=analysis.primary_emotion,
            mechanism=analysis.mechanism,
            relationship_type=relationship_type,
            limit=6,
        )

        # Use the rich WisdomContext.to_context_block() for full formatting
        # This includes: principles, static corpus, dynamic DB verses, learned wisdom
        wisdom_block = wisdom_context.to_context_block()

        # Append usage instructions to the context block
        instructions = (
            "\n--- INSTRUCTIONS FOR USING WISDOM CONTEXT ---\n"
            "1. DEEPLY ABSORB the verses and principles above before responding\n"
            "2. TRANSLATE Gita wisdom into modern emotional language (never quote Sanskrit)\n"
            "3. WEAVE the verse teachings naturally into ALL 5 steps of the Gita framework\n"
            "4. Let the principles SHAPE each step — make it feel like ancient wisdom in modern clothes\n"
            "5. Go to the ROOT of the issue — surface-level advice is not enough\n"
            "6. Feel the user's pain FIRST, then guide with the steadiness of Gita wisdom\n"
            "7. Use DYNAMIC WISDOM and EXTENDED INSIGHTS if provided — they are validated and verified\n"
        )
        wisdom_block = wisdom_block.replace("[/WISDOM_CORE_CONTEXT]", f"{instructions}[/WISDOM_CORE_CONTEXT]")

        # Build verse citations from all sources (static + dynamic)
        verse_citations = []
        for v in wisdom_context.static_verses:
            verse_citations.append({
                "ref": v.get("verse_ref", ""),
                "teaching": v.get("principle", v.get("english", "")[:150]),
            })
        for v in wisdom_context.gita_verses:
            verse_citations.append({
                "ref": v.get("verse_ref", v.get("ref", "")),
                "teaching": v.get("principle", v.get("content", "")[:150]),
                "source": "dynamic",
            })

        principle_citations = []
        for p in wisdom_context.principles:
            principle_citations.append({
                "id": p.id,
                "principle": p.principle,
                "gita_source": p.gita_source,
            })

        corpus_stats = rwc.get_corpus_stats()

        logger.info(
            f"Compass wisdom gathered (full pipeline): "
            f"{len(wisdom_context.principles)} principles, "
            f"{len(wisdom_context.static_verses)} static verses, "
            f"{len(wisdom_context.gita_verses)} dynamic verses, "
            f"{len(wisdom_context.learned_wisdom)} learned wisdom, "
            f"confidence={wisdom_context.confidence:.2f}, "
            f"mode={analysis.mode}, emotion={analysis.primary_emotion}"
        )

        return {
            "wisdom_block": wisdom_block,
            "verse_citations": verse_citations,
            "principle_citations": principle_citations,
            "verses_count": len(wisdom_context.static_verses) + len(wisdom_context.gita_verses),
            "principles_count": len(wisdom_context.principles),
            "corpus_size": corpus_stats.get("total_verses", 0),
            "dynamic_verses_count": len(wisdom_context.gita_verses),
            "learned_wisdom_count": len(wisdom_context.learned_wisdom),
            "total_sources": wisdom_context.total_sources,
            "confidence": wisdom_context.confidence,
        }

    except Exception as e:
        logger.warning(f"Wisdom context gathering failed (non-critical): {e}")
        return {
            "wisdom_block": "",
            "verse_citations": [],
            "principle_citations": [],
            "verses_count": 0,
            "principles_count": 0,
            "corpus_size": 0,
            "dynamic_verses_count": 0,
            "learned_wisdom_count": 0,
            "total_sources": 0,
            "confidence": 0.0,
        }


def extract_response_sections(text: str) -> dict[str, str]:
    """Extract structured sections from AI-generated response text.

    Handles both the new 5-step Gita framework sections and legacy section
    formats. Supports markdown heading formats (## Heading).

    The 5-step framework sections:
    - Step 1: Pause Before Reacting
    - Step 2: Identify the Attachment
    - Step 3: Regulate Before You Communicate
    - Step 4: Speak Without Demanding an Outcome
    - Step 5: See Their Humanity
    - What This Looks Like in Practice (Real Text Message)
    - The Real Test

    Args:
        text: The raw AI response text.

    Returns:
        Dict mapping section heading to content.
    """
    # Canonical section names for the 5-step Gita framework
    headings = [
        "Step 1: Pause Before Reacting",
        "Step 2: Identify the Attachment",
        "Step 3: Regulate Before You Communicate",
        "Step 4: Speak Without Demanding an Outcome",
        "Step 5: See Their Humanity",
        "What This Looks Like in Practice",
        "The Real Test",
        # Legacy sections (still recognized for backward compatibility)
        "Emotional Precision",
        "What's Actually Happening",
        "The Hard Truth",
        "What To Do",
        "Script",
    ]
    headings_lower = {h.lower(): h for h in headings}

    # Variations that map to canonical names
    variations: dict[str, str] = {
        # Step 1 variations
        "step 1": "Step 1: Pause Before Reacting",
        "pause before reacting": "Step 1: Pause Before Reacting",
        "modern samatvam": "Step 1: Pause Before Reacting",
        "step 1: pause": "Step 1: Pause Before Reacting",
        "step 1 — pause before reacting": "Step 1: Pause Before Reacting",
        "step 1 - pause before reacting": "Step 1: Pause Before Reacting",
        # Step 2 variations
        "step 2": "Step 2: Identify the Attachment",
        "identify the attachment": "Step 2: Identify the Attachment",
        "step 2: identify": "Step 2: Identify the Attachment",
        "step 2 — identify the attachment": "Step 2: Identify the Attachment",
        "step 2 - identify the attachment": "Step 2: Identify the Attachment",
        # Step 3 variations
        "step 3": "Step 3: Regulate Before You Communicate",
        "regulate before you communicate": "Step 3: Regulate Before You Communicate",
        "step 3: regulate": "Step 3: Regulate Before You Communicate",
        "step 3 — regulate before you communicate": "Step 3: Regulate Before You Communicate",
        "step 3 - regulate before you communicate": "Step 3: Regulate Before You Communicate",
        # Step 4 variations
        "step 4": "Step 4: Speak Without Demanding an Outcome",
        "speak without demanding an outcome": "Step 4: Speak Without Demanding an Outcome",
        "karma yoga applied": "Step 4: Speak Without Demanding an Outcome",
        "step 4: speak": "Step 4: Speak Without Demanding an Outcome",
        "step 4 — speak without demanding an outcome": "Step 4: Speak Without Demanding an Outcome",
        "step 4 - speak without demanding an outcome": "Step 4: Speak Without Demanding an Outcome",
        # Step 5 variations
        "step 5": "Step 5: See Their Humanity",
        "see their humanity": "Step 5: See Their Humanity",
        "equal vision": "Step 5: See Their Humanity",
        "step 5: see": "Step 5: See Their Humanity",
        "step 5 — see their humanity": "Step 5: See Their Humanity",
        "step 5 - see their humanity": "Step 5: See Their Humanity",
        # Real Text Message variations
        "what this looks like in practice": "What This Looks Like in Practice",
        "real text message": "What This Looks Like in Practice",
        "what this looks like": "What This Looks Like in Practice",
        "in practice": "What This Looks Like in Practice",
        "what to say": "What This Looks Like in Practice",
        # Real Test variations
        "the real test": "The Real Test",
        "real test": "The Real Test",
        "the test": "The Real Test",
        "aftermath": "The Real Test",
        # Legacy variations
        "what's happening": "What's Actually Happening",
        "what is actually happening": "What's Actually Happening",
        "what is happening": "What's Actually Happening",
        "whats actually happening": "What's Actually Happening",
        "hard truth": "The Hard Truth",
        "the truth": "The Hard Truth",
        "what to do": "What To Do",
        "action": "What To Do",
        "practical action": "What To Do",
        "next step": "What To Do",
        "script (if relevant)": "Script",
        "script": "Script",
        "suggested script": "Script",
    }

    section_map: dict[str, str] = {}
    current_heading: str | None = None
    buffer: list[str] = []

    def normalize(line: str) -> str | None:
        cleaned = line.strip().lstrip("#").strip().strip("*").strip().rstrip(":").strip()
        cleaned_lower = cleaned.lower()
        if cleaned_lower in headings_lower:
            return headings_lower[cleaned_lower]
        # Check variations
        for pattern, canonical in variations.items():
            if cleaned_lower == pattern or cleaned_lower.startswith(pattern):
                return canonical
        return None

    def flush() -> None:
        if current_heading is not None:
            section_map[current_heading] = "\n".join(buffer).strip()
            buffer.clear()

    # Also extract mode line
    mode_line = ""
    for line in text.splitlines():
        line_stripped = line.strip()
        if line_stripped.lower().startswith("mode:"):
            mode_line = line_stripped
            continue

        matched = normalize(line)
        if matched:
            flush()
            current_heading = matched
            continue
        if current_heading:
            buffer.append(line)

    flush()

    if mode_line:
        section_map["_mode_line"] = mode_line

    return section_map
