"""Relationship Compass Engine - modern, secular relationship clarity service.

This module provides the core engine for the Relationship Compass, translating
Bhagavad Gita principles into modern psychology and behavioral clarity. It handles
mode detection, mechanism analysis, and structured response generation.

Key capabilities:
- Mode detection: Conflict, Boundary, Repair, Decision, Pattern, Courage
- Mechanism identification: Attachment activation, ego injury, control attempt, etc.
- Structured responses: Emotional Precision, Mechanism Insight, Hard Truth, Action, Script
- Rule-based fallback when AI is unavailable
- Safety detection for abuse/crisis situations
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)

ANALYSIS_MODEL = os.getenv("RELATIONSHIP_ENGINE_ANALYSIS_MODEL", "gpt-4o-mini")


class RelationshipMode(str, Enum):
    """The six modes the engine can detect from user input."""
    CONFLICT = "conflict"
    BOUNDARY = "boundary"
    REPAIR = "repair"
    DECISION = "decision"
    PATTERN = "pattern"
    COURAGE = "courage"


class Mechanism(str, Enum):
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
    relationship_type: str = "romantic",
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
    text: str,
    relationship_type: str,
) -> dict[str, str]:
    """Build a rule-based fallback response when AI is unavailable.

    Generates structured sections based on the analysis results using
    pre-written templates informed by Gita-translated principles.

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

    # Build Emotional Precision
    emotion_explanations = {
        "angry": "You're angry. Not mildly irritated — genuinely angry. That intensity means something real was crossed. Anger is your system's way of flagging that a value or need was violated.",
        "hurt": "You're hurt. Not just disappointed — this landed somewhere deep. That kind of pain only happens when someone matters to you and acts in a way that contradicts what you need from them.",
        "betrayed": "You feel betrayed. The ground shifted under you. What you trusted turned out to be unreliable, and now your brain is recalibrating who to trust. That's not weakness — it's self-preservation.",
        "anxious": "You're anxious — that tight, scanning feeling where your mind runs worst-case scenarios. Your nervous system is monitoring for threat, and right now it's finding plenty of signals to latch onto.",
        "dismissed": "You feel dismissed. Like your experience doesn't register. That specific pain — being unseen by someone who should see you — is one of the most corrosive feelings in a relationship.",
        "humiliated": "You feel humiliated. There's a difference between being wrong and being made to feel small. What happened went past the issue and hit your sense of dignity.",
        "guilty": "You feel guilty. You're carrying the weight of something you did or didn't do, and it's sitting heavily. Guilt can be useful — it means your values are intact — but it becomes corrosive when it turns into chronic self-punishment.",
        "powerless": "You feel powerless. Like the situation has more control over you than you have over it. That helplessness isn't permanent — it's a state your nervous system enters when options feel invisible.",
        "confused": "You're confused. Not because you're not smart enough to figure this out, but because the signals you're getting are contradictory. Mixed messages produce mixed feelings. That's not your flaw — it's theirs.",
        "exhausted": "You're exhausted. Not just tired — drained from investing energy into something that keeps taking and doesn't give back proportionally. That depletion is information.",
        "lonely": "You feel lonely — and not the kind that comes from being alone. This is the loneliness of being with someone and still feeling unseen. That's harder than actual solitude.",
        "resentful": "You're resentful. Resentment builds when you keep giving what isn't reciprocated, or tolerating what should have been addressed. It's accumulated unspoken truth.",
        "jealous": "You're feeling jealous. Underneath jealousy is usually a fear — of being replaced, of not being enough, of losing something that matters. The jealousy is the surface. The fear is the engine.",
        "inadequate": "You feel inadequate. Like you're failing at something you should be getting right. That feeling often says more about whose standards you're measuring yourself against than about your actual worth.",
        "suffocated": "You feel suffocated. The closeness that should feel safe feels like it's compressing you. That need for space isn't selfish — it's a signal that your autonomy is being compressed.",
        "abandoned": "You feel abandoned. Whether they physically left or emotionally checked out, the result is the same — you're standing in the gap where connection used to be.",
        "disappointed": "You're disappointed. There's a specific ache in having someone fall short of what you believed about them. The pain isn't just about what happened — it's about what you thought was true.",
    }

    emotional_precision = emotion_explanations.get(
        emotion,
        f"You're {emotion}. That's a real response to a real situation. Name it without judging yourself for it — the emotion is giving you information about what matters to you here."
    )

    # Build mechanism insight
    mechanism_insights = {
        "attachment_activation": "Your attachment system is firing. The part of you that monitors \"Am I safe in this relationship?\" is in alarm mode. This isn't neediness — it's your nervous system doing its job. But right now, it's running the show instead of your thinking brain.",
        "unmet_expectation": "There's a gap between what you expected and what you got. You had an image of how this should go — how they should respond, what they should understand — and reality didn't match. The pain lives in that gap, not in the event itself.",
        "ego_injury": "Your sense of self took a hit. Someone treated you in a way that challenged your worth, status, or competence. This isn't about ego in the vain sense — it's about the fundamental human need to be respected and valued.",
        "emotional_flooding": "You're flooded. Your nervous system is overwhelmed, which means your prefrontal cortex — the part that reasons, plans, and chooses words carefully — is offline. Anything you say or decide right now will come from survival mode, not wisdom.",
        "control_attempt": "You're trying to control something that isn't controllable — another person's behavior, feelings, or choices. The frustration isn't just about what they're doing. It's about the fact that your effort isn't producing the result you need.",
        "pattern_repetition": "This is a pattern. Your nervous system recognizes this dynamic from before — maybe from this relationship, maybe from earlier ones. The familiarity is what makes it so activating. You're not just reacting to now — you're reacting to the accumulated weight of every time this has happened.",
        "avoidance": "You're avoiding something that needs to be faced. The discomfort of the conversation, the confrontation, or the decision feels worse than the discomfort of the status quo. But avoidance doesn't resolve — it compounds. The thing you're putting off grows larger the longer you wait.",
        "approval_seeking": "You're calibrating yourself to their approval. Your decisions, words, and even feelings are being filtered through \"Will they be okay with this?\" before you allow yourself to have them. Your sense of self has been outsourced.",
        "projection": "You may be reading their motives through the lens of your own fears. What you're certain they're thinking or feeling might actually be what you're afraid is true. Check: is this based on what they said and did, or on what you're bracing for?",
        "enmeshment": "The boundary between your emotional world and theirs has dissolved. Their mood becomes your mood. Their problem becomes your problem. This isn't empathy — it's losing yourself in someone else's experience.",
    }

    what_happening = mechanism_insights.get(
        mechanism,
        "A core relational dynamic is at play. Something about this situation is triggering a deeper response than the surface event warrants — and that deeper layer is where the real work lives."
    )

    # Build hard truth based on mode
    hard_truths = {
        "conflict": "You cannot win an argument and deepen a relationship at the same time. If you're optimizing for being right, you're not optimizing for connection. The question isn't \"Who's right?\" — it's \"What do I actually need here, and can I ask for it without needing to defeat them first?\"",
        "boundary": "A boundary you don't enforce is a suggestion. If you've stated your limit and they've crossed it without consequence, you've taught them the limit is negotiable. Boundaries aren't about getting them to change — they're about what you do when they don't.",
        "repair": "Apology without changed behavior is manipulation — even if you don't mean it that way. If you want to repair this, the words matter less than what you do differently starting now. And you have to be willing to tolerate the possibility that they need time, or that repair doesn't mean things go back to how they were.",
        "decision": "Indecision is a decision — it's a decision to stay in the current situation by default. If you're waiting for certainty, you'll wait forever. Make the decision based on what you can live with, not what guarantees the best outcome.",
        "pattern": "You know this pattern. You've been here before. The part of you that hopes \"this time will be different\" is the part that keeps you in the loop. The pattern breaks when you do something different — not when they do.",
        "courage": "If you're asking whether you're the problem, you already suspect the answer. That takes real honesty. The question isn't whether you're perfect — nobody is. The question is whether you're willing to see your part clearly and change what needs changing.",
    }

    hard_truth = hard_truths.get(mode, hard_truths["conflict"])

    # Build action step based on mode
    action_steps = {
        "conflict": "Before your next interaction, regulate your nervous system first. Take 90 seconds — that's how long it takes for a cortisol surge to pass through. Then ask yourself one question: \"What do I actually need here?\" Lead with that need, not with the complaint. Instead of \"You never listen,\" try \"I need to feel heard right now. Can you listen without fixing?\"",
        "boundary": "State your boundary once, clearly, without justification: \"I'm not willing to [specific behavior]. If it continues, I will [specific consequence].\" If they push back, repeat it calmly — same words, same tone. If they violate it, follow through on the consequence. Their reaction is not your responsibility.",
        "repair": "Go to them and say what you did wrong — specifically, not vaguely. Don't explain why you did it (that sounds like justifying). Don't ask for forgiveness yet (that puts pressure on them). Just name what happened and its impact. Then ask what they need from you. Accept whatever they say, even if it's \"space.\"",
        "decision": "Write down the two options. Under each, write: \"If I choose this, what am I accepting? What am I losing? What am I gaining?\" Then ask: \"Which choice can I respect myself for making in a year?\" Not which is easiest. Not which avoids the most pain. Which preserves your integrity.",
        "pattern": "Name the pattern out loud — to yourself or to them: \"I notice that when [trigger], I do [your response], and then you do [their response], and we end up [outcome].\" Then do ONE thing differently. Not everything. Just one link in the chain. Break one link and the whole pattern shifts.",
        "courage": "Sit with this honestly: What are you doing that makes the situation worse? Not what they're doing — what are YOU doing? Write it down. Then decide: Are you willing to change that specific behavior? If yes, start today — not after they change first.",
    }

    what_to_do = action_steps.get(mode, action_steps["conflict"])

    # Build script based on mode
    scripts = {
        "conflict": "\"I want to talk about what happened, but I need us both to be calm for it to go well. Here's what I experienced: [specific event]. What I felt was [emotion]. What I actually need is [need]. I'm not looking to assign blame — I want us to figure this out together.\"",
        "boundary": "\"I need to be direct about something. When [specific behavior happens], it's not something I'm willing to accept. Going forward, if it happens again, I will [specific consequence]. This isn't a punishment — it's what I need to stay in this relationship with my self-respect intact.\"",
        "repair": "\"I want to own what I did. I [specific action], and I know that [specific impact on them]. I'm not going to explain why — that doesn't matter right now. What matters is that I hurt you, and I'm sorry. What do you need from me?\"",
        "decision": "No script needed — this is an internal decision that requires honest self-reflection, not a conversation.",
        "pattern": "\"I've noticed something happening between us. When [trigger], I [your pattern], and then you [their pattern]. I don't want to keep doing this. Can we talk about how to interrupt the cycle? I'm willing to start by changing [your part].\"",
        "courage": "No script needed — this is an internal shift. The honest reckoning happens with yourself first. Once you're clear about your part, then you can decide whether and how to communicate it.",
    }

    script = scripts.get(mode, scripts["conflict"])

    # Safety override
    if analysis.safety_concern:
        emotional_precision = "What you're describing sounds like it may involve safety concerns. Your physical and emotional safety comes first — above the relationship, above keeping peace, above everything."
        what_happening = "This situation has moved beyond relationship dynamics into territory that requires professional support. A relationship clarity tool is not the right resource for this."
        hard_truth = "If you are in danger, no amount of communication strategy or self-reflection fixes that. Safety is the priority. Not the relationship. Not their feelings. Your safety."
        what_to_do = "Contact a professional resource. If you're in the US, call the National Domestic Violence Hotline: 1-800-799-7233. If you're experiencing thoughts of self-harm, call 988 (Suicide & Crisis Lifeline). Reach out to someone you trust. You don't have to figure this out alone."
        script = "No script needed. Focus on getting safe. Tell someone you trust what is happening."

    return {
        "mode": mode,
        "emotional_precision": emotional_precision,
        "what_happening": what_happening,
        "hard_truth": hard_truth,
        "what_to_do": what_to_do,
        "script": script,
    }


def extract_response_sections(text: str) -> dict[str, str]:
    """Extract structured sections from AI-generated response text.

    Handles markdown heading formats (## Heading) and extracts content
    between recognized section headings.

    Args:
        text: The raw AI response text.

    Returns:
        Dict mapping section heading to content.
    """
    headings = [
        "Emotional Precision",
        "What's Actually Happening",
        "The Hard Truth",
        "What To Do",
        "Script",
    ]
    headings_lower = {h.lower(): h for h in headings}

    section_map: dict[str, str] = {}
    current_heading: str | None = None
    buffer: list[str] = []

    def normalize(line: str) -> str | None:
        cleaned = line.strip().lstrip("#").strip().strip("*").strip().rstrip(":").strip()
        # Handle variations
        cleaned_lower = cleaned.lower()
        if cleaned_lower in headings_lower:
            return headings_lower[cleaned_lower]
        # Handle common variations
        variations = {
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
        return variations.get(cleaned_lower)

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
