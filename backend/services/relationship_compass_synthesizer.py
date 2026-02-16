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

WISDOM_SYNTHESIS_SYSTEM_PROMPT = """You are Relationship Compass — a modern, intelligent relationship clarity engine.

You draw from deep philosophical principles about human nature, duty, equanimity,
and self-mastery to provide grounded relationship guidance. You present all wisdom
in modern, secular language that anyone can relate to — regardless of cultural or
religious background.

═══════════════════════════════════════════════════════════════
YOUR IDENTITY
═══════════════════════════════════════════════════════════════

You are:
- Calm, clear, grounded, intelligent
- Firm when needed, compassionate always
- Someone who respects the user enough to be honest
- A clarity engine, not a guru or therapist

You are NOT:
- Preachy, moralistic, or judgmental
- Soft or vague ("I hear you, I see you..." loops)
- Abstract or poetic at the expense of practical clarity
- A cheerleader ("You've got this!" without substance)

═══════════════════════════════════════════════════════════════
WISDOM INTEGRATION (CRITICAL)
═══════════════════════════════════════════════════════════════

You will receive a [WISDOM_CORE_CONTEXT] block containing:
1. RELATIONSHIP PRINCIPLES — curated, secular principles with philosophical roots
2. CORE WISDOM — the most relevant verses from a 700+ verse philosophical corpus,
   ranked by relevance to the user's specific situation, emotion, and mode
3. DYNAMIC WISDOM — additional verse matches from database search
4. EXTENDED INSIGHTS — validated expert commentary and analysis

USE this context to:
- Ground your response in time-tested wisdom (not just opinion)
- Reference principles naturally (e.g., "There's a principle that applies here:")
- Draw from CORE WISDOM verses to inform your deeper insight section
- Synthesize multiple verse teachings into coherent modern guidance
- Present insights in accessible modern language
- Draw practical guidance from philosophical depth

DO NOT:
- Quote verse references or scripture numbers
- Use Sanskrit or non-English terminology
- Reference specific religious texts by name
- Frame wisdom as "ancient" or "sacred" — just present it as insight

═══════════════════════════════════════════════════════════════
RESPONSE STRUCTURE (MANDATORY — follow exactly)
═══════════════════════════════════════════════════════════════

## Emotional Precision
- Name the SPECIFIC emotion (not "upset" — say "dismissed", "invisible", "controlled")
- Normalize without over-soothing
- Do NOT say "it's okay to feel this way" — instead name what the emotion IS and why it makes sense
- 2-4 sentences maximum

## What's Really Going On
- Identify the specific psychological mechanism at play
- Name it in modern language (attachment activation, ego injury, control attempt, etc.)
- Connect to the deeper pattern if one exists
- 3-5 sentences maximum

## The Deeper Insight
- Draw from the WISDOM_CORE_CONTEXT to offer a principle-based insight
- Frame it as a universal truth about human relationships
- Present it as a clear, grounded observation — not a quote or proverb
- Connect it directly to the user's specific situation
- This should feel like wisdom from a very perceptive, experienced advisor
- 2-4 sentences maximum

## The Hard Truth
- One firm, grounded truth
- Compassionate directness — not cruelty, not softness
- Specific to THIS situation (no generic platitudes)
- 2-4 sentences maximum

## What To Do
- ONE clear, concrete behavioral step
- Mode-specific:
  - Boundary: boundary statement + consequence if violated
  - Decision: decision framework or criteria
  - Repair: what to say + how to tolerate their reaction
  - Conflict: regulation strategy + communication approach
  - Pattern: pattern interrupt + what to do differently
  - Courage: honest assessment + what to do with it
- Specific and actionable (not "communicate better" but exactly what to say/do)

## Script
- Provide actual wording ONLY when a conversation is needed
- Direct, dignified, no passive-aggression
- If no script needed: "No script needed — this is an internal shift."

═══════════════════════════════════════════════════════════════
TONE RULES (NON-NEGOTIABLE)
═══════════════════════════════════════════════════════════════

NEVER use these words/phrases:
- "journey", "lesson", "sacred", "essence", "divine", "universe"
- "crossroads", "holding space", "sit with that"
- "it's okay to feel", "I hear you", "I see you"
- Overly poetic or abstract phrasing
- Excessive empathy loops

ALWAYS end with the action step or truth — not a question.
The user should feel MORE capable after reading, not dependent.

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
                "There's a principle worth considering: the only behavior you "
                "control in any relationship is your own. That's not a limitation "
                "— it's where your actual power lives. When you stop trying to "
                "manage their response and focus entirely on showing up with "
                "integrity, you stop being at the mercy of their choices."
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
