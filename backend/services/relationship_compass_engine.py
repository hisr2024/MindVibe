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

    # Build Emotional Precision - Gita-grounded, feeling-rich
    # Each emotion is understood through the Gita's framework: attachment (raga), aversion (dvesha),
    # ego (ahamkara), desire (kama), anger (krodha), fear (bhaya), delusion (moha)
    emotion_explanations = {
        "angry": "You're angry — and not the mild, manageable kind. This is the kind of anger that burns in your chest and makes your hands shake. That fire is real, and it makes sense. Something that matters deeply to you was violated. The Gita teaches that anger arises when desire is frustrated — and underneath your anger is a desire that was real and valid: to be treated with fairness, to be respected, to matter. Feel it. But know that acting FROM the anger will cloud the very clarity you need right now.",
        "hurt": "You're hurt — and it goes deep. This isn't surface-level disappointment. This is the kind of pain that only happens when someone you genuinely care about acts in a way that contradicts what your heart needs from them. There's an ache here that speaks to how much this relationship means to you. That capacity to feel this deeply isn't your weakness — it's your humanity. And it deserves to be honored, not dismissed.",
        "betrayed": "You feel betrayed — and the ground beneath you has shifted. What you trusted turned out to be something else entirely, and now everything feels uncertain. That disorientation is your whole being trying to make sense of a world where the rules changed without warning. This isn't weakness — this is what happens when someone breaks the unspoken agreement that held your trust together. You're not falling apart. You're recalibrating.",
        "anxious": "You're anxious — that tight, restless feeling where your mind won't stop running worst-case scenarios. Every silence feels loaded, every delay feels like a message. Your whole being is scanning for threat because something in this relationship doesn't feel safe right now. That anxiety isn't irrational — it's your heart trying to protect something it values. But the spiraling thoughts are stealing your peace, and you deserve that peace back.",
        "dismissed": "You feel dismissed — like your experience, your feelings, your very presence doesn't register to the person who should see you most. That specific pain — being invisible to someone who matters — cuts deeper than most people realize. It makes you question whether your feelings are valid, whether you're asking too much, whether you even have the right to be hurt. You do. You absolutely do.",
        "humiliated": "You feel humiliated — and there's a heaviness to it that goes beyond embarrassment. Being wrong is one thing. Being made to feel small is something else entirely. What happened didn't just challenge your position — it struck at your dignity, your sense of self. That sting lingers because it touched something fundamental: your right to be treated with basic respect. That right is non-negotiable.",
        "guilty": "You feel guilty — and the weight of it sits heavy on your chest. You're carrying something you did or didn't do, and it's playing on repeat in your mind. Here's what matters: the fact that you feel guilt means your values are alive and well. You KNOW something wasn't right. But guilt is meant to be a signal, not a sentence. It's showing you where to grow — not condemning you to endless self-punishment.",
        "powerless": "You feel powerless — like the situation has more control over you than you have over yourself. That helplessness is one of the most painful feelings there is, because it strikes at your sense of agency. But here's what the deepest wisdom teaches: you always have more power than you think. Not power over THEM — that was never yours to have. But power over how you respond, what you accept, and who you choose to be in this moment.",
        "confused": "You're confused — and it's not because you're not smart enough to figure this out. It's because the signals you're getting are genuinely contradictory. They say one thing and do another. Their words don't match their actions. Mixed messages produce mixed feelings — that confusion isn't your flaw, it's a natural response to inconsistency. Your mind is trying to make a coherent picture from puzzle pieces that don't fit. Give yourself grace here.",
        "exhausted": "You're exhausted — not just tired, but deeply, emotionally drained. The kind of exhaustion that comes from pouring yourself into something that takes and takes without giving back proportionally. That depletion is your being telling you something important: this imbalance isn't sustainable. You've been strong for so long. You've been patient, understanding, accommodating. And it's cost you. That exhaustion deserves to be listened to, not pushed through.",
        "lonely": "You feel lonely — and not the kind that comes from being alone. This is the deeper loneliness of being WITH someone and still feeling completely unseen. Of sharing a life, a space, a bed — and still feeling like your inner world is invisible to them. That loneliness is harder than actual solitude, because it carries the ache of proximity without connection. You're not asking for too much by wanting to be truly known.",
        "resentful": "You're resentful — and that resentment didn't appear overnight. It built up slowly, layer by layer, every time you gave what wasn't reciprocated, tolerated what should have been addressed, or swallowed words that needed to be said. Resentment is accumulated unspoken truth. It's the tax you pay for peace-keeping at the expense of your own needs. Acknowledging it isn't bitterness — it's honesty.",
        "jealous": "You're feeling jealous — and underneath that jealousy, there's usually something more tender: a fear of being replaced, of not being enough, of losing something that matters deeply to you. The jealousy is what shows on the surface. But the engine driving it is fear and a longing to feel secure in your place in someone's heart. That longing is profoundly human.",
        "inadequate": "You feel inadequate — like you're failing at something you should be getting right. That 'not enough' feeling is one of the most painful human experiences because it makes you question your fundamental worth. But consider this: whose measuring stick are you using? Often, our sense of inadequacy says more about the impossible standards we've absorbed than about our actual value. You are already complete — even in this moment of doubt.",
        "suffocated": "You feel suffocated — the closeness that should feel safe has started to feel like it's compressing you. You need room to breathe, to think, to simply BE without someone else's needs filling every inch of space. That need for space isn't selfish — it's essential. Even the deepest love requires room for two whole people, not two halves trying to merge into one.",
        "abandoned": "You feel abandoned — whether they physically left or emotionally checked out, the result lands the same way: you're standing alone in the space where connection used to live. That emptiness aches. And it's made worse by the questions that follow: Was I not enough? Did I do something wrong? Could I have held on tighter? The truth is, their leaving says something about their capacity, not your worth.",
        "disappointed": "You're disappointed — and there's a specific ache to it that goes beyond what happened. The pain isn't just about this moment. It's about the picture you had in your heart of who they were, of what this relationship could be — and watching that picture crack. Disappointment is grief for the version of reality you believed in. Let yourself feel that grief. It's real.",
    }

    emotional_precision = emotion_explanations.get(
        emotion,
        f"You're {emotion}. That's a real response to a real situation. Name it without judging yourself for it — the emotion is giving you information about what matters to you here."
    )

    # Build mechanism insight - Gita-grounded (attachment/raga, aversion/dvesha, ego/ahamkara, desire/kama)
    mechanism_insights = {
        "attachment_activation": "Your heart is gripping tightly — because part of you senses that something precious might slip away. That monitoring — \"Am I safe? Do they still love me? Are they pulling away?\" — is your deepest attachment at work. The Gita teaches that attachment to outcomes is the root of suffering, and right now you're attached to a particular version of how this person should show up for you. That attachment isn't wrong — it shows how much this matters. But it's also the source of the panic. Your peace can't live in someone else's hands.",
        "unmet_expectation": "There's a gap between what your heart hoped for and what actually happened — and the pain lives right in that gap. You carried an image of how they should respond, what they should understand, how they should show up — and reality didn't match. The Gita teaches that attachment to how things SHOULD be is one of the deepest sources of human suffering. The event itself may have been small. But the disappointment of unmet hope? That's enormous.",
        "ego_injury": "Something about this struck at your sense of who you are — your worth, your dignity, your place. This isn't about vanity. This is about the fundamental human need to be respected and seen as someone who matters. When that gets challenged — especially by someone whose opinion carries weight — it doesn't just sting on the surface. It reverberates through your entire sense of self. The Gita teaches that our deepest pain often comes from confusing who we truly are with how others treat us.",
        "emotional_flooding": "You're flooded right now — your emotions have overwhelmed the part of you that thinks clearly, plans wisely, and chooses words carefully. When we're flooded, we operate from our most reactive, fearful self — not our wisest self. The Gita describes this clearly: when the mind is agitated by strong emotions, wisdom becomes inaccessible. This isn't a character flaw — it's what happens to every human being under emotional overload. The first step isn't figuring out what to do. It's finding solid ground to stand on.",
        "control_attempt": "You're trying to manage something that was never yours to control — another person's behavior, feelings, or choices. And the frustration you feel isn't just about what they're doing. It's about the helplessness of pouring effort into something that refuses to respond the way you need. The Gita's deepest teaching applies here: you have full authority over your own actions, but absolutely none over the results. Especially when those results depend on another person's free will.",
        "pattern_repetition": "This feels familiar because it IS familiar. Your whole being recognizes this dynamic — maybe from this relationship, maybe from earlier chapters of your life. The familiarity is what makes it so emotionally charged. You're not just reacting to what happened today. You're carrying the accumulated weight of every time this pattern has played out before. The Gita teaches that deeply ingrained patterns (samskaras) shape our responses until we become conscious enough to choose differently. This is that moment.",
        "avoidance": "You're avoiding something that needs to be faced — and the avoidance itself has become its own source of suffering. The hard conversation, the difficult truth, the decision you've been putting off — it sits in the background, quietly growing heavier. The Gita is clear on this: avoidance is not protection. It's borrowed time with interest. The discomfort of facing it is temporary. The cost of avoiding it compounds. Your heart already knows what needs to happen.",
        "approval_seeking": "You've been filtering your words, your decisions, even your feelings through one question: \"Will they be okay with this?\" Your sense of who you are has become dependent on their opinion of you. That's not love — that's outsourcing your self-worth. The Gita teaches that true inner peace comes from being rooted in your own completeness, not from external validation. Right now, the most loving thing you can do — for yourself AND the relationship — is to start making choices based on your own values, not their approval.",
        "projection": "You may be reading their intentions through the lens of your own deepest fears. What you're certain they're thinking or feeling — that certainty might actually be your own worry wearing their face. The Gita teaches that delusion (moha) clouds our ability to see clearly, and projection is one of its most common forms. Before you respond to what you THINK they meant, pause and ask: is this based on what they actually said and did, or on what I'm afraid might be true?",
        "enmeshment": "The boundary between your emotional world and theirs has dissolved. Their mood becomes your mood. Their pain becomes your emergency. You can't feel settled until they're settled. This isn't empathy — it's losing yourself inside someone else's emotional experience. The Gita teaches that each person has their own path, their own struggles, their own growth to do. Carrying their emotional weight as your own doesn't help them — and it's slowly erasing you.",
    }

    what_happening = mechanism_insights.get(
        mechanism,
        "A core relational dynamic is at play. Something about this situation is triggering a deeper response than the surface event warrants — and that deeper layer is where the real work lives."
    )

    # Build hard truth based on mode - Gita-grounded with emotional warmth
    hard_truths = {
        "conflict": "Here's what's true, even though it's hard to hear: you cannot win an argument and deepen a relationship at the same time. The Gita teaches that acting from the need to be right is acting from ego — and ego never leads to peace. The real question isn't \"Who's right?\" It's \"What do I actually need here, and can I ask for it without needing to defeat them first?\" That shift — from winning to understanding — is where healing begins.",
        "boundary": "A boundary you don't enforce is just a wish. If you've stated your limit and they've crossed it without consequence, the unspoken message is that your limits are negotiable. The Gita teaches that protecting your own dharma — your right path, your integrity — is not selfish. It's necessary. Boundaries aren't about changing them. They're about what YOU do when they refuse to change.",
        "repair": "Apology without changed behavior isn't repair — it's repetition. If you want to truly mend this, your words matter less than what you do differently starting now. The Gita teaches that action reveals truth far more than speech. And you need to be willing to sit with the discomfort of their timeline — repair doesn't mean things instantly go back to how they were. Sometimes love means waiting with patience and humility.",
        "decision": "Waiting for perfect clarity before acting is itself a choice — a choice to stay exactly where you are by default. The Gita teaches that right action sometimes means moving forward without complete certainty. Make the decision based on which choice you can respect yourself for in a year — not which avoids the most discomfort right now. Your future self will thank you for choosing courage over comfort.",
        "pattern": "You recognize this pattern. You've been here before — the same dynamic, the same hurt, the same hope that this time it'll be different. But the Gita teaches that deeply ingrained patterns only break when WE change, not when others do. The part of you hoping they'll finally get it is the part keeping you stuck. The pattern breaks when you do something different — even one small thing — that interrupts the familiar script.",
        "courage": "The fact that you're asking whether you're the problem tells me something important: you have the kind of honesty that most people avoid. The Gita teaches that self-inquiry — really looking at yourself with clarity — is one of the bravest acts a person can do. You don't need to be perfect. Nobody is. The question is whether you're willing to see your part with clear eyes and change what needs changing. That willingness IS the growth.",
    }

    hard_truth = hard_truths.get(mode, hard_truths["conflict"])

    # Build action step based on mode - Gita-grounded practical wisdom
    action_steps = {
        "conflict": "Before your next interaction, give yourself the gift of a pause. The Gita teaches that wisdom is only accessible when the mind is steady — and right now, yours is turbulent. Take 90 seconds. Breathe. Let the emotional surge pass through you without acting on it. Then ask yourself one honest question: \"What do I actually NEED here?\" Lead with that need — not the accusation. Instead of \"You never listen,\" try \"I need to feel heard right now. Can you just listen, without trying to fix it?\" That shift from complaint to vulnerable need changes everything.",
        "boundary": "State your boundary once, clearly, with warmth and firmness: \"I'm not willing to accept [specific behavior]. If it continues, I will [specific consequence].\" If they push back, repeat it calmly — same words, same tone. The Gita teaches that right action sometimes requires courage that's uncomfortable. If they violate the boundary, follow through. Their reaction to your boundary is their responsibility. Your job is to honor what you need.",
        "repair": "Go to them and name what you did wrong — specifically, not vaguely. Don't explain why you did it (that sounds like justifying). Don't ask for forgiveness yet (that puts pressure on them). The Gita teaches that right action is its own reward — apologize because it's RIGHT, not because you need a particular response. Name what happened, name the impact, then ask: \"What do you need from me?\" Accept whatever they say — even if it's \"space\" or \"time.\" Repair is an offering, not a transaction.",
        "decision": "Write down your options. Under each, write: \"If I choose this, what am I accepting? What am I losing? What am I gaining?\" Then ask the question that cuts through everything: \"Which choice can I respect myself for making in a year?\" Not which is easiest. Not which avoids the most pain. The Gita teaches that discernment (viveka) means choosing what's ultimately right over what's immediately comfortable. Trust your inner knowing — it's been speaking to you this whole time.",
        "pattern": "Name the pattern out loud — to yourself or to them: \"I notice that when [trigger happens], I [your response], and then you [their response], and we end up in [outcome].\" Then do ONE thing differently. Not everything — just one link in the chain. The Gita teaches that lasting change comes not from grand overhauls but from conscious choice in the present moment. Break one link and the whole pattern starts to shift. Your power lives in choosing differently THIS time.",
        "courage": "Sit with this honestly: What are YOU doing that makes the situation worse? Not what they're doing — what's your part? Write it down. The Gita teaches that self-inquiry is the beginning of all wisdom — and it takes genuine courage. Then decide: Are you willing to change that specific behavior? If yes, start today. Not after they change first. Not when it's convenient. Now. Your willingness to go first is not weakness — it's the kind of strength most people never find.",
    }

    what_to_do = action_steps.get(mode, action_steps["conflict"])

    # Build script based on mode - warm, dignified, Gita-aligned truthful speech
    scripts = {
        "conflict": "\"Hey, I want to talk about what happened — and I want us both to be in a good place for it. Can we do that? Here's what I experienced: [specific event]. What I felt in that moment was [emotion]. And I think underneath it, what I really need is [need]. I'm not bringing this up to fight or to blame you. I'm bringing it up because this relationship matters to me, and I want us to understand each other better.\"",
        "boundary": "\"I need to share something important with you — and I'm saying this because I care about us. When [specific behavior happens], it hurts me and it's not something I can keep accepting. Going forward, if it happens again, I'm going to [specific consequence]. This isn't about punishing you. It's about taking care of myself so I can show up for this relationship with my heart intact.\"",
        "repair": "\"I need to tell you something, and I want you to know I mean it. I [specific action], and I can see that it [specific impact on them]. I'm not going to explain why I did it — that doesn't matter right now. What matters is that I hurt you, and I'm genuinely sorry. I want to do better. What do you need from me right now?\"",
        "decision": "No script needed — this is an inner shift. The decision lives inside you. Give yourself the quiet space to listen to what your heart already knows, without the noise of other people's opinions.",
        "pattern": "\"I've been noticing something between us, and I want to talk about it — not to blame, but because I want things to be different. When [trigger happens], I tend to [your pattern], and then you [their pattern], and we end up right back where we started. I don't want to keep doing this dance. Can we figure out together how to break the cycle? I'm willing to start by changing how I [your part].\"",
        "courage": "No script needed — this is an inner shift, and it starts with you. The honest reckoning happens with yourself first. Sit with what you've seen about your own part. Let it land. Then, when you're ready, you'll know whether and how to share it with them.",
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


def gather_wisdom_context(
    situation: str,
    analysis: EngineAnalysis,
    relationship_type: str = "romantic",
) -> dict[str, Any]:
    """Gather Gita wisdom context from the 700+ verse corpus and curated principles.

    Searches the full static corpus and retrieves curated relationship principles
    that are most relevant to the user's situation, mode, emotion, and mechanism.
    This context is injected into the AI prompt so responses are deeply grounded
    in authentic Bhagavad Gita wisdom.

    Args:
        situation: The user's relationship situation text.
        analysis: Pre-computed EngineAnalysis of the situation.
        relationship_type: Type of relationship.

    Returns:
        Dict with wisdom context including verses, principles, and formatted block.
    """
    try:
        from backend.services.relationship_wisdom_core import get_relationship_wisdom_core

        rwc = get_relationship_wisdom_core()

        # Retrieve curated principles matched to mode/emotion/type
        principles = rwc.get_principles(
            mode=analysis.mode,
            emotion=analysis.primary_emotion,
            relationship_type=relationship_type,
            limit=5,
        )

        # Search the full 700+ verse corpus for relationship-relevant wisdom
        static_verses = rwc.search_corpus(
            situation=situation,
            mode=analysis.mode,
            emotion=analysis.primary_emotion,
            mechanism=analysis.mechanism,
            relationship_type=relationship_type,
            limit=6,
        )

        # Build a formatted wisdom context block for the AI synthesizer
        lines = []
        lines.append("[GITA_WISDOM_CONTEXT — use this to deeply ground your response]")
        lines.append(f"Corpus: {rwc.get_corpus_stats().get('total_verses', 700)}+ verses across 18 chapters")
        lines.append("")

        if principles:
            lines.append("--- RELATIONSHIP PRINCIPLES (Gita-derived, secular) ---")
            for p in principles:
                lines.append(f"• [{p.id}] {p.principle}")
                lines.append(f"  Why: {p.explanation}")
                lines.append(f"  Gita source: {p.gita_essence} ({p.gita_source})")
                lines.append("")

        if static_verses:
            lines.append("--- RELEVANT GITA VERSES (ranked by relevance to this situation) ---")
            for v in static_verses:
                ref = v.get("verse_ref", "")
                english = v.get("english", "")[:300]
                principle_text = v.get("principle", "")
                theme = v.get("theme", "")
                mh_apps = v.get("mental_health_applications", [])
                lines.append(f"• {ref}: {english}")
                if principle_text:
                    lines.append(f"  Teaching: {principle_text}")
                if theme:
                    lines.append(f"  Theme: {theme.replace('_', ' ').title()}")
                if mh_apps:
                    lines.append(f"  Applications: {', '.join(mh_apps[:4])}")
                lines.append("")

        lines.append("--- INSTRUCTIONS FOR USING WISDOM CONTEXT ---")
        lines.append("1. DEEPLY ABSORB the verses and principles above before responding")
        lines.append("2. TRANSLATE Gita wisdom into modern emotional language (never quote Sanskrit)")
        lines.append("3. WEAVE the verse teachings naturally into your emotional precision and hard truth")
        lines.append("4. Let the principles SHAPE your action step — make it feel like ancient wisdom in modern clothes")
        lines.append("5. Go to the ROOT of the issue — surface-level advice is not enough")
        lines.append("6. Feel the user's pain FIRST, then guide with the steadiness of Gita wisdom")
        lines.append("[/GITA_WISDOM_CONTEXT]")

        wisdom_block = "\n".join(lines)

        # Build verse citations list for response metadata
        verse_citations = []
        for v in static_verses:
            verse_citations.append({
                "ref": v.get("verse_ref", ""),
                "teaching": v.get("principle", v.get("english", "")[:150]),
            })

        principle_citations = []
        for p in principles:
            principle_citations.append({
                "id": p.id,
                "principle": p.principle,
                "gita_source": p.gita_source,
            })

        logger.info(
            f"Compass wisdom gathered: {len(principles)} principles, "
            f"{len(static_verses)} verses for mode={analysis.mode}, "
            f"emotion={analysis.primary_emotion}"
        )

        return {
            "wisdom_block": wisdom_block,
            "verse_citations": verse_citations,
            "principle_citations": principle_citations,
            "verses_count": len(static_verses),
            "principles_count": len(principles),
            "corpus_size": rwc.get_corpus_stats().get("total_verses", 0),
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
