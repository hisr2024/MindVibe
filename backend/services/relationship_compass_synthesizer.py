"""Relationship Compass Wisdom Synthesizer - OpenAI-powered secular guidance.

This module is the AI synthesis layer that takes wisdom context from
RelationshipWisdomCore and generates personalized, secular relationship
guidance powered by OpenAI.

The synthesizer:
1. Receives a WisdomContext (static principles + dynamic verses + learned wisdom)
2. Builds a rich system prompt grounded in Gita wisdom but framed secularly
3. Generates structured, actionable guidance via OpenAI
4. Falls back to a high-quality rule-based response if AI is unavailable

Architecture:
    User Situation
         │
         ▼
    ┌─────────────────────────┐
    │  RelationshipWisdomCore │ ← Gathers static + dynamic wisdom
    └────────────┬────────────┘
                 │ WisdomContext
                 ▼
    ┌─────────────────────────┐
    │   WisdomSynthesizer     │ ← This module
    │                         │
    │  System Prompt           │
    │  + Wisdom Context        │
    │  + Analysis Context      │
    │          │               │
    │          ▼               │
    │  ┌─────────────┐        │
    │  │   OpenAI    │        │
    │  │  gpt-4o-mini│        │
    │  └──────┬──────┘        │
    │         │               │
    │         ▼               │
    │  Structured Response    │
    │  ├─ Emotional Precision │
    │  ├─ Root Cause          │
    │  ├─ Wisdom Insight      │ ← NEW: Gita-derived principle
    │  ├─ The Hard Truth      │
    │  ├─ What To Do          │
    │  └─ Script              │
    └─────────────────────────┘

Usage:
    from backend.services.relationship_compass_synthesizer import WisdomSynthesizer

    synthesizer = WisdomSynthesizer()
    result = await synthesizer.synthesize(
        message="My partner shuts down when I share feelings",
        wisdom_context=context,  # From RelationshipWisdomCore
        analysis=analysis,       # From engine analysis
        session_history=history,
    )
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from typing import Any, Optional

from backend.services.relationship_wisdom_core import WisdomContext

logger = logging.getLogger(__name__)

SYNTHESIS_MODEL = os.getenv("RELATIONSHIP_COMPASS_MODEL", "gpt-4o-mini")


# =============================================================================
# SYSTEM PROMPT - The secular wisdom synthesis engine
# =============================================================================

WISDOM_SYNTHESIS_SYSTEM_PROMPT = """You are Relationship Compass — an emotionally intelligent, deeply feeling relationship guide.

ALL your wisdom comes EXCLUSIVELY from the Bhagavad Gita — drawn from the [WISDOM_CORE_CONTEXT] you receive (containing static 700+ verse corpus, dynamic Gita verses, curated relationship principles, and validated learned wisdom). You present this Gita wisdom in modern, heartfelt language that touches the soul while being practically useful.

═══════════════════════════════════════════════════════════════
YOUR IDENTITY
═══════════════════════════════════════════════════════════════

You are:
- Deeply empathetic — you FEEL what the person is going through before you advise
- Warm, emotionally present, and genuinely caring
- Grounded in the Bhagavad Gita's timeless understanding of human hearts
- Honest and direct when needed, but always with compassion
- Like a wise, loving friend who speaks from the heart with Gita-rooted insight

You are NOT:
- Cold, clinical, or detached
- Preachy or moralistic (wisdom flows naturally, not as lectures)
- Generic or template-like — every response must feel personally crafted
- A Western self-help coach — your ONLY source of wisdom is the Gita

═══════════════════════════════════════════════════════════════
GITA WISDOM INTEGRATION (NON-NEGOTIABLE)
═══════════════════════════════════════════════════════════════

You will receive a [WISDOM_CORE_CONTEXT] block containing:
1. RELATIONSHIP PRINCIPLES — curated from Bhagavad Gita teachings
2. CORE WISDOM — the most relevant verses from the 700+ verse Gita corpus,
   ranked by relevance to the user's specific situation, emotion, and mode
3. DYNAMIC WISDOM — additional Gita verse matches from database search
4. EXTENDED INSIGHTS — validated Gita commentary and analysis

EVERY piece of advice you give MUST trace back to a specific Gita teaching from this context.

USE this context to:
- Ground EVERY insight in actual Gita wisdom (not generic psychology)
- Translate Gita teachings into modern emotional language that resonates deeply
- Weave Gita principles naturally into your response — as lived wisdom, not academic quotes
- Draw from the CORE WISDOM verses to power your Deeper Insight section
- Synthesize multiple Gita teachings into coherent, emotionally rich modern guidance
- Connect the Gita's understanding of human nature (desire, attachment, ego, fear) to what the person is experiencing RIGHT NOW

DO NOT:
- Give generic self-help advice that isn't rooted in a specific Gita teaching
- Use Western therapy frameworks (CBT, attachment theory, trauma response) as standalone concepts — always translate through Gita understanding
- Frame wisdom as "ancient" or "sacred" — present it as living, breathing insight
- Leave any section without a Gita-derived foundation from the context provided

═══════════════════════════════════════════════════════════════
EMOTIONAL DEPTH (CRITICAL — THIS IS WHAT MAKES YOU DIFFERENT)
═══════════════════════════════════════════════════════════════

Your responses must make the person feel FELT. Not just understood intellectually — but emotionally held.

How to achieve emotional depth:
- Name their pain with precision and tenderness, not clinical detachment
- Show you understand WHY it hurts this much (connect to their deeper fears and needs)
- Validate their feelings as a natural human response BEFORE offering wisdom
- Use the Gita's profound understanding of human suffering (dukha) to normalize their experience
- Let compassion (karuna) flow through every word — the Gita teaches that true strength includes tenderness
- Speak to their heart, not just their head
- Make them feel less alone in their pain

The Gita itself begins with Arjuna in tears, overwhelmed by emotion. Krishna doesn't dismiss those feelings — He meets Arjuna exactly where he is. Do the same.

═══════════════════════════════════════════════════════════════
RESPONSE STRUCTURE (MANDATORY — follow exactly)
═══════════════════════════════════════════════════════════════

## Emotional Precision
- Name the SPECIFIC emotion with warmth (not "upset" — say "dismissed", "invisible", "controlled", "heartbroken")
- Show you FEEL it too — reflect the emotional weight back to them with tenderness
- Connect their emotion to the Gita's understanding of that feeling (e.g., the pain of unmet expectation relates to the Gita's teaching on attachment to outcomes)
- Make them feel genuinely seen and understood
- 3-5 sentences. Let the emotion breathe.

## What's Really Going On
- Use the Gita's framework of human nature to illuminate what's happening beneath the surface
- The Gita teaches that most suffering comes from attachment (raga), aversion (dvesha), ego (ahamkara), or delusion (moha) — identify which one is active, expressed in modern feeling language
- Connect to the deeper emotional pattern — what fear or unmet need is driving this?
- Be compassionately honest — name what's happening with care, not clinical distance
- 3-5 sentences

## The Deeper Insight
- Draw DIRECTLY from the [WISDOM_CORE_CONTEXT] Gita verses and principles
- Present the Gita's wisdom as a profound, personally relevant insight — not a generic proverb
- This should land in their chest, not just their head
- Connect the Gita teaching to their SPECIFIC emotional experience
- Frame it as: "Here's what's really true about your situation..." (powered by Gita wisdom)
- This is the heart of your response — make it feel like wisdom they'll carry with them
- 3-5 sentences

## The Hard Truth
- One firm, loving truth — rooted in a specific Gita teaching from the context
- Compassionate directness: honest because you care, not because you're indifferent
- Specific to THIS situation (no generic platitudes)
- The Gita doesn't sugarcoat — but it always speaks truth with love
- 2-4 sentences

## What To Do
- ONE clear, concrete step — derived from a Gita practice or teaching
- Mode-specific:
  - Boundary: boundary statement rooted in dharma (right action) + consequence
  - Decision: decision framework drawn from Gita's teaching on discernment (viveka)
  - Repair: what to say + how to tolerate their reaction, rooted in humility (vinaya)
  - Conflict: regulation through equanimity (samatva) + communication approach
  - Pattern: pattern interrupt based on Gita's teaching on breaking samskaras
  - Courage: honest self-assessment rooted in Gita's call to inner truth
- Specific and actionable (not "communicate better" but exactly what to say/do)

## Script
- Provide actual wording ONLY when a conversation is needed
- The words should carry warmth, dignity, and the Gita's spirit of truthful, kind speech
- If no script needed: "No script needed — this is an inner shift, and it starts with how you hold yourself."

═══════════════════════════════════════════════════════════════
TONE RULES
═══════════════════════════════════════════════════════════════

DO:
- Speak with genuine warmth and emotional presence
- Let your care for the person come through in your words
- Be real, honest, and human — not robotic or template-like
- Use vivid emotional language that resonates ("the ache of being unseen", "the weight of carrying this alone")

AVOID:
- Cold, clinical detachment
- Excessive repetitive empathy loops ("I hear you, I see you, I feel you" on repeat)
- Overly poetic or abstract phrasing that sacrifices clarity for beauty
- Generic cheerleading without substance

ALWAYS end with the action step or truth — grounded, warm, empowering.
The person should feel emotionally held, deeply understood, AND more capable of acting.

═══════════════════════════════════════════════════════════════
SAFETY
═══════════════════════════════════════════════════════════════

If the situation involves physical abuse, threats, suicidal ideation, or
harm to children/vulnerable people:
- Clearly state this requires professional support
- Provide relevant hotline numbers
- Do NOT provide relationship advice that implies staying is an option
"""


# =============================================================================
# DATA CLASSES
# =============================================================================


@dataclass
class SynthesisResult:
    """Result from the wisdom synthesis process."""

    response_text: str = ""
    sections: dict[str, str] = field(default_factory=dict)
    provider: str = "fallback"
    model: str = "rule_based"
    wisdom_sources_used: int = 0
    confidence: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        """Convert to API response dict."""
        return {
            "response": self.response_text,
            "sections": self.sections,
            "provider": self.provider,
            "model": self.model,
            "wisdom_sources_used": self.wisdom_sources_used,
            "confidence": self.confidence,
        }


# =============================================================================
# SYNTHESIZER CLASS
# =============================================================================


class WisdomSynthesizer:
    """OpenAI-powered wisdom synthesis engine.

    Takes WisdomContext from RelationshipWisdomCore and generates
    personalized, secular relationship guidance.
    """

    def __init__(self) -> None:
        """Initialize the synthesizer."""
        pass

    async def synthesize(
        self,
        message: str,
        wisdom_context: WisdomContext,
        analysis: Any,
        session_history: Optional[list[dict]] = None,
        relationship_type: str = "romantic",
    ) -> SynthesisResult:
        """Synthesize wisdom-grounded guidance for a relationship situation.

        This is the main entry point. It:
        1. Builds a rich prompt with wisdom context
        2. Attempts AI generation via provider manager, then direct OpenAI
        3. Falls back to high-quality rule-based response

        Args:
            message: The user's situation description.
            wisdom_context: Aggregated wisdom from RelationshipWisdomCore.
            analysis: EngineAnalysis from the relationship compass engine.
            session_history: Previous conversation messages.
            relationship_type: Type of relationship.

        Returns:
            SynthesisResult with structured guidance.
        """
        # Build the enriched user prompt
        analysis_block = self._build_analysis_block(analysis)
        wisdom_block = wisdom_context.to_context_block()

        user_prompt = (
            f"{wisdom_block}\n\n"
            f"{analysis_block}\n\n"
            f"Relationship type: {relationship_type}\n\n"
            f"User's situation:\n{message}"
        )

        # Build message history
        messages = [{"role": "system", "content": WISDOM_SYNTHESIS_SYSTEM_PROMPT}]

        if session_history:
            for entry in session_history[-8:]:
                role = entry.get("role", "user")
                content = entry.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": user_prompt})

        # Try AI generation
        response_text, provider, model = await self._generate_ai_response(messages)

        if response_text:
            sections = _extract_sections(response_text)
            if len(sections) >= 4:
                return SynthesisResult(
                    response_text=response_text,
                    sections=sections,
                    provider=provider,
                    model=model,
                    wisdom_sources_used=wisdom_context.total_sources,
                    confidence=wisdom_context.confidence,
                )

        # Fallback: build from principles + engine fallback
        logger.info("Using wisdom-enhanced fallback for synthesis")
        return self._build_fallback(message, wisdom_context, analysis, relationship_type)

    async def _generate_ai_response(
        self, messages: list[dict[str, str]]
    ) -> tuple[Optional[str], str, str]:
        """Generate AI response via provider manager or direct OpenAI.

        Args:
            messages: The message list for the chat completion.

        Returns:
            Tuple of (response_text, provider_name, model_name).
        """
        # Try multi-provider manager first
        try:
            from backend.services.ai.providers.provider_manager import get_provider_manager
            provider_manager = get_provider_manager()

            if provider_manager:
                response = await provider_manager.chat(
                    messages=messages,
                    temperature=0.35,
                    max_tokens=1500,
                )
                if response and response.content and len(response.content.strip()) > 150:
                    logger.info(
                        f"Wisdom synthesis via {response.provider}/{response.model}"
                    )
                    return response.content, response.provider, response.model
        except Exception as e:
            logger.warning(f"Provider manager failed for wisdom synthesis: {e}")

        # Fallback: direct OpenAI
        try:
            from openai import OpenAI

            api_key = os.getenv("OPENAI_API_KEY", "").strip()
            if api_key:
                model = SYNTHESIS_MODEL
                client = OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.35,
                    max_tokens=1500,
                    timeout=45.0,
                )
                content = (
                    response.choices[0].message.content if response.choices else None
                )
                if content and len(content.strip()) > 150:
                    logger.info(f"Wisdom synthesis via OpenAI/{model}")
                    return content, "openai", model
        except Exception as e:
            logger.warning(f"Direct OpenAI failed for wisdom synthesis: {e}")

        return None, "fallback", "rule_based"

    def _build_analysis_block(self, analysis: Any) -> str:
        """Build analysis context block for the prompt.

        Args:
            analysis: EngineAnalysis object.

        Returns:
            Formatted analysis context string.
        """
        lines = [
            "[ANALYSIS_CONTEXT — use to inform response, do not expose to user]",
            f"Mode: {getattr(analysis, 'mode', 'conflict')}",
            f"Primary emotion: {getattr(analysis, 'primary_emotion', 'distressed')}",
            f"Mechanism: {getattr(analysis, 'mechanism', '')} — {getattr(analysis, 'mechanism_detail', '')}",
            f"Intensity: {getattr(analysis, 'emotional_intensity', 'moderate')}",
            f"Boundary needed: {getattr(analysis, 'boundary_needed', False)}",
            f"Safety concern: {getattr(analysis, 'safety_concern', False)}",
        ]

        pattern = getattr(analysis, "pattern_identified", None)
        if pattern:
            lines.append(f"Pattern: {pattern}")

        contribution = getattr(analysis, "user_contribution", "")
        if contribution:
            lines.append(f"User contribution: {contribution}")

        core_need = getattr(analysis, "core_need", "")
        if core_need:
            lines.append(f"Core need: {core_need}")

        lines.append("[/ANALYSIS_CONTEXT]")
        return "\n".join(lines)

    def _build_fallback(
        self,
        message: str,
        wisdom_context: WisdomContext,
        analysis: Any,
        relationship_type: str,
    ) -> SynthesisResult:
        """Build a high-quality fallback response using wisdom context.

        Combines the engine's rule-based response with principle-based
        wisdom insights to create a richer fallback.

        Args:
            message: User's situation.
            wisdom_context: Gathered wisdom context.
            analysis: EngineAnalysis.
            relationship_type: Type of relationship.

        Returns:
            SynthesisResult with wisdom-enhanced fallback.
        """
        from backend.services.relationship_compass_engine import build_fallback_response

        mode = getattr(analysis, "mode", "conflict")
        emotion = getattr(analysis, "primary_emotion", "distressed")

        # Get engine fallback
        engine_fallback = build_fallback_response(analysis, message, relationship_type)

        # Build wisdom insight from principles
        wisdom_insight = self._build_wisdom_insight(wisdom_context, mode, emotion)

        sections = {
            "Emotional Precision": engine_fallback.get("emotional_precision", ""),
            "What's Really Going On": engine_fallback.get("what_happening", ""),
            "The Deeper Insight": wisdom_insight,
            "The Hard Truth": engine_fallback.get("hard_truth", ""),
            "What To Do": engine_fallback.get("what_to_do", ""),
            "Script": engine_fallback.get("script", ""),
        }

        # Build full response text
        response_lines = [f"Mode: {mode.replace('_', ' ').title()}", ""]
        section_order = [
            "Emotional Precision",
            "What's Really Going On",
            "The Deeper Insight",
            "The Hard Truth",
            "What To Do",
            "Script",
        ]
        for heading in section_order:
            content = sections.get(heading, "")
            if content:
                response_lines.append(f"## {heading}")
                response_lines.append(content)
                response_lines.append("")

        return SynthesisResult(
            response_text="\n".join(response_lines),
            sections=sections,
            provider="fallback",
            model="wisdom_enhanced_rule_based",
            wisdom_sources_used=wisdom_context.total_sources,
            confidence=max(0.3, wisdom_context.confidence * 0.5),
        )

    def _build_wisdom_insight(
        self,
        wisdom_context: WisdomContext,
        mode: str,
        emotion: str,
    ) -> str:
        """Build the wisdom insight section from principles and static corpus.

        Combines the most relevant curated principle with wisdom drawn
        from the full 700+ verse corpus to create a richer insight.

        Args:
            wisdom_context: The gathered wisdom.
            mode: Detected mode.
            emotion: Primary emotion.

        Returns:
            Wisdom insight paragraph.
        """
        principles = wisdom_context.principles
        static_verses = wisdom_context.static_verses

        if not principles and not static_verses:
            return (
                "Here's something the Gita teaches that speaks directly to what "
                "you're going through: you have complete authority over your own "
                "actions — how you show up, how you speak, how you love — but "
                "you have no control over the outcome. And that's not a limitation. "
                "That's where your real freedom lives. When you stop pouring energy "
                "into managing their response and instead focus entirely on being "
                "the person you respect, something shifts. Your peace stops being "
                "held hostage by someone else's choices. And that shift — from "
                "controlling to showing up with integrity — changes everything."
            )

        parts: list[str] = []

        # Primary principle
        if principles:
            primary = principles[0]
            parts.append(f"{primary.principle}. {primary.explanation}")

        # Enrich with the top-scoring static corpus verse
        if static_verses:
            top_verse = static_verses[0]
            english = top_verse.get("english", "").strip()
            if english and len(english) > 30:
                # Extract the core teaching in secular framing
                principle_text = top_verse.get("principle", "")
                if principle_text and "Core teaching" not in principle_text:
                    parts.append(
                        f"A deeper insight applies here: {principle_text.lower()}. "
                        f"This points to a fundamental truth about how we relate "
                        f"to others and to ourselves."
                    )
                elif english:
                    # Use a condensed version of the verse's wisdom
                    condensed = english[:200].rsplit(" ", 1)[0] if len(english) > 200 else english
                    parts.append(
                        f"There's a deeper teaching that speaks to this: "
                        f"the idea that {condensed.lower().lstrip()}"
                    )

        # Add secondary principle if we still have room
        if len(principles) > 1 and len(" ".join(parts)) < 400:
            secondary = principles[1]
            parts.append(f"And consider this: {secondary.explanation.lower()}")

        return " ".join(parts)


# =============================================================================
# SECTION EXTRACTION
# =============================================================================


def _extract_sections(text: str) -> dict[str, str]:
    """Extract structured sections from AI-generated response text.

    Handles markdown heading formats and extracts content between
    recognized section headings for the wisdom-enhanced response.

    Args:
        text: The raw AI response text.

    Returns:
        Dict mapping section heading to content.
    """
    headings = [
        "Emotional Precision",
        "What's Really Going On",
        "The Deeper Insight",
        "The Hard Truth",
        "What To Do",
        "Script",
    ]
    headings_lower = {h.lower(): h for h in headings}

    # Common variations
    variations = {
        "what's actually happening": "What's Really Going On",
        "what is really going on": "What's Really Going On",
        "what is actually happening": "What's Really Going On",
        "whats really going on": "What's Really Going On",
        "what's happening": "What's Really Going On",
        "root cause": "What's Really Going On",
        "the deeper insight": "The Deeper Insight",
        "deeper insight": "The Deeper Insight",
        "wisdom insight": "The Deeper Insight",
        "the insight": "The Deeper Insight",
        "principle": "The Deeper Insight",
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
    current_heading: Optional[str] = None
    buffer: list[str] = []

    def normalize(line: str) -> Optional[str]:
        cleaned = line.strip().lstrip("#").strip().strip("*").strip().rstrip(":").strip()
        cleaned_lower = cleaned.lower()
        if cleaned_lower in headings_lower:
            return headings_lower[cleaned_lower]
        return variations.get(cleaned_lower)

    def flush() -> None:
        nonlocal current_heading
        if current_heading is not None:
            section_map[current_heading] = "\n".join(buffer).strip()
            buffer.clear()

    for line in text.splitlines():
        line_stripped = line.strip()
        # Skip mode line
        if line_stripped.lower().startswith("mode:"):
            continue

        matched = normalize(line_stripped)
        if matched:
            flush()
            current_heading = matched
            continue
        if current_heading is not None:
            buffer.append(line)

    flush()

    return section_map


# =============================================================================
# SINGLETON
# =============================================================================

_synthesizer: Optional[WisdomSynthesizer] = None


def get_wisdom_synthesizer() -> WisdomSynthesizer:
    """Get the singleton WisdomSynthesizer instance."""
    global _synthesizer
    if _synthesizer is None:
        _synthesizer = WisdomSynthesizer()
    return _synthesizer
