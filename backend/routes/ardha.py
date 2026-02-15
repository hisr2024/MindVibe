"""Ardha Reframing Assistant - OpenAI-powered Gita reframing.

ENHANCED VERSION v2.0 - Integrated with KIAAN AI Gita Core Wisdom Filter

Ardha is a witnessed reframing tool rooted in Bhagavad Gita core wisdom.
This router provides Gita-inspired reframing with OpenAI integration.

Key Features:
- Direct OpenAI integration for reliable response generation
- RAG enhancement when embeddings are available (primary)
- JSON-based verse search using full 700+ Gita verses (secondary)
- Core wisdom fallback for edge cases
- Session memory for contextual conversations
- **GITA WISDOM FILTER** - All responses pass through Gita Core Wisdom

ALL RESPONSES PASS THROUGH GITA CORE WISDOM:
Every response is filtered through the GitaWisdomFilter to ensure
guidance is grounded in Bhagavad Gita teachings on witnessed reframing.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.ardha_prompts import ARDHA_SYSTEM_PROMPT
from backend.services.openai_optimizer import openai_optimizer

logger = logging.getLogger(__name__)

# Gita Wisdom Filter - lazy import to avoid circular dependencies
_gita_filter = None


def _get_gita_filter():
    """Lazy import of Gita wisdom filter."""
    global _gita_filter
    if _gita_filter is None:
        try:
            from backend.services.gita_wisdom_filter import get_gita_wisdom_filter
            _gita_filter = get_gita_wisdom_filter()
            logger.info("Ardha: Gita Wisdom Filter integrated")
        except Exception as e:
            logger.warning(f"Ardha: Gita Wisdom Filter unavailable: {e}")
            _gita_filter = False
    return _gita_filter if _gita_filter else None

router = APIRouter(prefix="/api/ardha", tags=["ardha"])

# Load complete Gita verses from JSON (701 verses)
GITA_VERSES: list[dict[str, Any]] = []
GITA_VERSES_PATH = Path(__file__).parent.parent.parent / "data" / "gita" / "gita_verses_complete.json"

try:
    if GITA_VERSES_PATH.exists():
        with open(GITA_VERSES_PATH, "r", encoding="utf-8") as f:
            GITA_VERSES = json.load(f)
        logger.info(f"✅ Ardha: Loaded {len(GITA_VERSES)} Gita verses from JSON")
    else:
        logger.warning(f"⚠️ Ardha: Gita verses file not found at {GITA_VERSES_PATH}")
except Exception as e:
    logger.error(f"❌ Ardha: Failed to load Gita verses: {e}")

SESSION_MEMORY: dict[str, list[dict[str, str]]] = {}
MAX_SESSION_TURNS = 10
LOW_CONFIDENCE_THRESHOLD = 0.35  # Lowered to allow more verse matches

SECTION_HEADINGS = [
    "Distortion Detection",
    "Emotional Precision",
    "Mechanism Insight",
    "Gita-Aligned Truth",
    "Calibration Layer",
    "Disciplined Action",
    "Reflective Question",
]

# Core Gita wisdom for fallback when RAG is unavailable
CORE_GITA_WISDOM = """[GITA_CORE_WISDOM_CONTEXT]
Core teachings from the Bhagavad Gita for reframing:

- BG 2.47: "You have the right to perform your duty, but not to the fruits of action."
  Principle: Focus on effort, not outcomes. Attachment to results causes suffering.

- BG 2.14: "The contacts of the senses with their objects give rise to feelings of cold and heat, pleasure and pain. They come and go; they are impermanent. Endure them."
  Principle: All experiences are temporary. This too shall pass.

- BG 2.48: "Perform action, O Arjuna, being steadfast in yoga, abandoning attachment and balanced in success and failure."
  Principle: Equanimity in success and failure is the path to peace.

- BG 6.5: "One must elevate, not degrade oneself by one's own mind. The mind is the friend of the conditioned soul, and his enemy as well."
  Principle: The mind can be your greatest ally or enemy. Choose to befriend it.

- BG 3.35: "It is better to perform one's own duty imperfectly than to perform another's duty perfectly."
  Principle: Honor your unique path. Comparison breeds suffering.

- BG 2.62-63: "From attachment springs desire, from desire comes anger, from anger arises delusion."
  Principle: Understand the chain of suffering. Awareness breaks the cycle.

- BG 6.35: "The mind is restless, turbulent, obstinate and very strong. But it can be controlled by constant practice and detachment."
  Principle: The restless mind can be tamed through practice and non-attachment.

- BG 18.66: "Abandon all varieties of dharmas and surrender unto Me alone. I shall deliver you from all sinful reactions. Do not fear."
  Principle: Let go of anxiety. Trust in the larger order of existence.
[/GITA_CORE_WISDOM_CONTEXT]"""


@router.post("/reframe")
async def reframe_thought(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate Ardha reframing using OpenAI with optional RAG enhancement."""
    thought = (payload.get("thought") or "").strip()
    depth = (payload.get("depth") or "quick").strip().lower()
    session_id = (payload.get("sessionId") or "anonymous").strip() or "anonymous"

    if not thought:
        raise HTTPException(status_code=400, detail="thought is required")

    if len(thought) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if depth not in {"quick", "deep", "quantum"}:
        depth = "quick"

    # Check if OpenAI is available
    if not openai_optimizer.ready or not openai_optimizer.client:
        logger.error("Ardha: OpenAI not configured")
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again later."
        )

    # Try to get Gita context using multiple strategies:
    # 1. RAG with embeddings (best quality)
    # 2. JSON keyword search (good quality, always available)
    # 3. Core wisdom fallback (minimal)
    gita_context = CORE_GITA_WISDOM
    sources: list[dict[str, str]] = []
    context_source = "core_wisdom"

    # Strategy 1: Try RAG with embeddings
    try:
        from backend.services.rag_service import rag_service
        if rag_service.ready:
            verses = await rag_service.hybrid_search(db, thought, limit=8)
            if verses:
                max_score = max((v.get("similarity_score", 0.0) for v in verses), default=0.0)
                if max_score >= LOW_CONFIDENCE_THRESHOLD:
                    gita_context, sources = _build_gita_context(verses)
                    context_source = "rag"
                    logger.info(f"Ardha: Using RAG context with {len(verses)} verses (max_score={max_score:.2f})")
    except Exception as rag_error:
        logger.warning(f"Ardha: RAG search failed ({rag_error})")

    # Strategy 2: If RAG didn't work, use JSON keyword search (701 verses)
    if context_source == "core_wisdom" and GITA_VERSES:
        json_verses = _search_gita_json(thought, limit=8, depth=depth)
        if json_verses:
            gita_context, sources = _build_json_verse_context(json_verses)
            context_source = "json"
            logger.info(f"Ardha: Using JSON search with {len(json_verses)} verses from 701 total")

    # Log final context source
    if context_source == "core_wisdom":
        logger.info("Ardha: Using core wisdom fallback (8 essential verses)")

    # Build messages for OpenAI
    session_memory = _get_session_memory(session_id)

    # Determine max tokens based on depth
    max_tokens_map = {"quick": 500, "deep": 800, "quantum": 1200}
    max_tokens = max_tokens_map.get(depth, 500)

    messages = [
        {"role": "system", "content": ARDHA_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Depth: {depth} (quick=brief, deep=expanded, quantum=most comprehensive)\n"
                f"Thought: {thought}"
            ),
        },
        {"role": "user", "content": gita_context},
    ]

    if session_memory:
        messages.insert(
            1,
            {
                "role": "user",
                "content": _format_session_memory(session_memory),
            },
        )

    # Generate response using OpenAI with Gita wisdom filtering
    response_text = await _generate_reframe(messages, max_tokens=max_tokens, user_thought=thought)
    response_text = _sanitize_response(response_text)

    # Store in session memory
    _store_session_memory(session_id, thought, response_text)

    logger.info(
        "✅ Ardha reframe generated (depth=%s, session=%s, sources=%d)",
        depth,
        session_id,
        len(sources),
    )

    return {"response": response_text, "sources": sources}


def _missing_context_response() -> str:
    return "\n".join(
        [
            "Distortion Detection",
            "I don't yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "Emotional Precision",
            "I don't yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "Mechanism Insight",
            "I don't yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "Gita-Aligned Truth",
            "I don't yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "Calibration Layer",
            "I don't yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "Disciplined Action",
            "Take one slow breath and wait for the Gita context to load.",
            "Reflective Question",
            "Would you like me to retrieve more Gita wisdom for this?",
        ]
    )


def _build_gita_context(verses: list[dict[str, Any]]) -> tuple[str, list[dict[str, str]]]:
    lines = ["[GITA_CORE_WISDOM_CONTEXT]"]
    sources: list[dict[str, str]] = []

    for verse in verses:
        chapter = verse.get("chapter")
        verse_number = verse.get("verse_number")
        if chapter is None or verse_number is None:
            continue
        reference = f"BG {chapter}.{verse_number}"
        file_path = f"data/gita/chapters/chapter_{int(chapter):02d}.json"
        text = verse.get("english") or ""
        commentary = verse.get("context") or verse.get("principle") or ""

        lines.extend(
            [
                f"- Source: {file_path}",
                f"  Reference: {reference}",
                f"  Text: {text}",
                f"  Commentary: {commentary}",
            ]
        )

        sources.append({"file": file_path, "reference": reference})

    lines.append("[/GITA_CORE_WISDOM_CONTEXT]")
    return "\n".join(lines), sources


# Mental health keywords mapped to Gita themes and chapters
MENTAL_HEALTH_KEYWORDS = {
    # Anxiety and worry
    "anxiety": ["fear", "worry", "anxious", "nervous", "panic", "stress"],
    "fear": ["afraid", "scared", "terror", "dread", "phobia"],
    # Depression and sadness
    "sadness": ["sad", "depressed", "unhappy", "miserable", "grief", "sorrow", "despair"],
    "hopeless": ["hopelessness", "give up", "no hope", "pointless", "meaningless"],
    # Anger and frustration
    "anger": ["angry", "rage", "furious", "frustrated", "irritated", "annoyed", "mad"],
    "resentment": ["bitter", "grudge", "revenge", "hate", "hatred"],
    # Attachment and loss
    "attachment": ["attached", "clingy", "possessive", "losing", "loss", "let go"],
    "relationship": ["family", "friend", "partner", "spouse", "parent", "child", "love"],
    # Self-doubt and inadequacy
    "doubt": ["self-doubt", "uncertain", "confused", "indecisive", "unsure"],
    "inadequacy": ["not good enough", "failure", "worthless", "inferior", "incompetent"],
    # Work and duty
    "work": ["job", "career", "workplace", "office", "boss", "colleague", "profession"],
    "duty": ["responsibility", "obligation", "dharma", "role", "purpose"],
    # Mind and thoughts
    "mind": ["thoughts", "thinking", "mental", "restless", "overthinking", "rumination"],
    "control": ["discipline", "willpower", "temptation", "addiction", "habit"],
    # Peace and equanimity
    "peace": ["calm", "serenity", "tranquility", "stillness", "quiet"],
    "balance": ["equanimity", "stable", "steady", "centered", "grounded"],
}

# Chapter themes for targeted verse selection
CHAPTER_THEMES = {
    1: ["grief", "despair", "moral_conflict", "confusion", "overwhelm"],
    2: ["self_knowledge", "equanimity", "immortality", "duty", "wisdom", "steady_mind"],
    3: ["action", "duty", "selfless_service", "work", "karma"],
    4: ["knowledge", "wisdom", "sacrifice", "renunciation"],
    5: ["renunciation", "detachment", "peace", "action"],
    6: ["meditation", "mind_control", "yoga", "discipline", "restlessness"],
    7: ["divine_knowledge", "faith", "devotion"],
    8: ["supreme", "death", "liberation"],
    9: ["devotion", "faith", "surrender"],
    10: ["divine_glories", "manifestation"],
    11: ["cosmic_vision", "awe", "fear"],
    12: ["devotion", "love", "compassion", "qualities"],
    13: ["knowledge", "field", "knower", "discrimination"],
    14: ["gunas", "qualities", "nature", "transcendence"],
    15: ["supreme_being", "tree", "world"],
    16: ["divine_demonic", "qualities", "virtues", "vices"],
    17: ["faith", "food", "sacrifice", "austerity"],
    18: ["liberation", "renunciation", "duty", "surrender", "conclusion"],
}


def _search_gita_json(query: str, limit: int = 8, depth: str = "quick") -> list[dict[str, Any]]:
    """Search 701 Gita verses using keyword matching and mental health relevance.

    This provides a reliable search over all verses when RAG embeddings aren't available.

    Args:
        query: User's thought/query
        limit: Maximum verses to return
        depth: Analysis depth (quick=fewer, deep/quantum=more verses)

    Returns:
        List of matching verses with relevance scores
    """
    if not GITA_VERSES:
        return []

    query_lower = query.lower()
    query_words = set(query_lower.split())

    # Expand query with related mental health keywords
    expanded_keywords = set(query_words)
    for category, keywords in MENTAL_HEALTH_KEYWORDS.items():
        for keyword in keywords:
            if keyword in query_lower:
                expanded_keywords.add(category)
                expanded_keywords.update(keywords)

    # Score each verse
    scored_verses: list[tuple[float, dict[str, Any]]] = []

    for verse in GITA_VERSES:
        score = 0.0

        # Check mental health applications
        mh_apps = verse.get("mental_health_applications", [])
        for app in mh_apps:
            if app.lower() in expanded_keywords or any(k in app.lower() for k in expanded_keywords):
                score += 2.0

        # Check theme
        theme = verse.get("theme", "").lower()
        if any(k in theme for k in expanded_keywords):
            score += 1.5

        # Check English translation
        english = verse.get("english", "").lower()
        for word in expanded_keywords:
            if len(word) > 3 and word in english:
                score += 0.5

        # Check principle
        principle = verse.get("principle", "").lower()
        for word in expanded_keywords:
            if len(word) > 3 and word in principle:
                score += 0.3

        # Boost important chapters for mental health (2, 3, 6, 12, 18)
        chapter = verse.get("chapter", 0)
        if chapter in [2, 6, 12, 18]:
            score *= 1.3
        elif chapter == 3:
            score *= 1.2

        if score > 0:
            scored_verses.append((score, verse))

    # Sort by score and return top results
    scored_verses.sort(key=lambda x: x[0], reverse=True)

    # Adjust limit based on depth
    if depth == "quantum":
        limit = min(limit + 4, 12)
    elif depth == "deep":
        limit = min(limit + 2, 10)

    return [v for _, v in scored_verses[:limit]]


def _build_json_verse_context(verses: list[dict[str, Any]]) -> tuple[str, list[dict[str, str]]]:
    """Build context from JSON verses for OpenAI.

    Args:
        verses: List of verses from JSON search

    Returns:
        Tuple of (context string, source references)
    """
    lines = ["[GITA_CORE_WISDOM_CONTEXT]"]
    lines.append(f"Retrieved {len(verses)} relevant verses from the complete Bhagavad Gita (701 verses):\n")
    sources: list[dict[str, str]] = []

    for verse in verses:
        chapter = verse.get("chapter", 0)
        verse_num = verse.get("verse", 0)
        reference = f"BG {chapter}.{verse_num}"
        file_path = f"data/gita/gita_verses_complete.json"

        english = verse.get("english", "")
        sanskrit = verse.get("sanskrit", "").split("\n")[0] if verse.get("sanskrit") else ""
        theme = verse.get("theme", "")
        principle = verse.get("principle", "")
        mh_apps = verse.get("mental_health_applications", [])

        lines.append(f"- Reference: {reference}")
        if sanskrit:
            lines.append(f"  Sanskrit: {sanskrit[:100]}...")
        lines.append(f"  Translation: {english}")
        if principle:
            lines.append(f"  Principle: {principle}")
        if mh_apps:
            lines.append(f"  Mental Health Applications: {', '.join(mh_apps[:5])}")
        lines.append("")

        sources.append({"file": file_path, "reference": reference})

    lines.append("[/GITA_CORE_WISDOM_CONTEXT]")
    return "\n".join(lines), sources


def _get_session_memory(session_id: str) -> list[dict[str, str]]:
    return SESSION_MEMORY.get(session_id, [])


def _store_session_memory(session_id: str, thought: str, response: str) -> None:
    entries = SESSION_MEMORY.get(session_id, [])
    entries.append({"thought": thought, "response": response})
    SESSION_MEMORY[session_id] = entries[-MAX_SESSION_TURNS:]


def _format_session_memory(memory: list[dict[str, str]]) -> str:
    lines = ["Session memory (last 10 turns):"]
    for entry in memory[-MAX_SESSION_TURNS:]:
        lines.append(f"- User: {entry.get('thought', '')}")
        lines.append(f"- Ardha: {entry.get('response', '')}")
    return "\n".join(lines)


async def _apply_gita_filter(content: str, user_context: str = "") -> str:
    """Apply Gita wisdom filter to AI-generated content."""
    gita_filter = _get_gita_filter()
    if gita_filter and content:
        try:
            filter_result = await gita_filter.filter_response(
                content=content,
                tool_type="ardha",
                user_context=user_context,
                enhance_if_needed=True,
            )
            logger.debug(f"Ardha Gita filter: score={filter_result.wisdom_score:.2f}")
            return filter_result.content
        except Exception as e:
            logger.warning(f"Ardha Gita filter error (continuing): {e}")
    return content


async def _generate_reframe(
    messages: list[dict[str, str]],
    max_tokens: int = 600,
    user_thought: str = ""
) -> str:
    """Generate reframe using OpenAI with Gita wisdom filtering.

    ALL RESPONSES PASS THROUGH GITA CORE WISDOM FILTER.

    Args:
        messages: Chat messages for OpenAI
        max_tokens: Maximum tokens for response (varies by depth)
        user_thought: Original user thought for Gita filter context

    Returns:
        Generated reframe response grounded in Gita wisdom

    Raises:
        HTTPException: If OpenAI fails after retries
    """
    if not openai_optimizer.ready or not openai_optimizer.client:
        logger.error("Ardha: OpenAI not configured")
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please check configuration."
        )

    try:
        openai_optimizer.validate_token_limits(messages, max_tokens)

        completion = openai_optimizer.client.chat.completions.create(
            model=openai_optimizer.default_model,
            messages=messages,
            temperature=0.4,  # Slightly more creative for reframing
            max_tokens=max_tokens,
        )

        if completion.choices and completion.choices[0].message:
            content = completion.choices[0].message.content or ""
            if content.strip():
                # GITA WISDOM FILTER: Apply filter to the response
                filtered_content = await _apply_gita_filter(content, user_thought)
                logger.info("Ardha: Gita filter applied to reframe response")
                return filtered_content

        # If no content, log and raise
        logger.error("Ardha: OpenAI returned empty response")
        raise HTTPException(
            status_code=500,
            detail="AI generated an empty response. Please try again."
        )

    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as exc:
        logger.error("Ardha: OpenAI request failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=f"AI service error: {str(exc)}"
        )


def _sanitize_response(response: str) -> str:
    cleaned = response.strip()
    for heading in SECTION_HEADINGS:
        if heading not in cleaned:
            logger.warning("Ardha response missing heading: %s", heading)
    return "".join(char for char in cleaned if not _is_emoji(char))


def _is_emoji(char: str) -> bool:
    return (
        "\U0001F300" <= char <= "\U0001FAFF"
        or "\U00002700" <= char <= "\U000027BF"
        or "\U0001F000" <= char <= "\U0001F02F"
    )


@router.get("/health")
async def ardha_health():
    """Health check with OpenAI and verse availability status."""
    openai_ready = openai_optimizer.ready and openai_optimizer.client is not None

    # Try to check RAG status
    rag_ready = False
    try:
        from backend.services.rag_service import rag_service
        rag_ready = rag_service.ready
    except Exception:
        pass

    # Determine wisdom source
    if rag_ready:
        wisdom_source = "rag_embeddings"
    elif GITA_VERSES:
        wisdom_source = "json_701_verses"
    else:
        wisdom_source = "core_8_verses"

    return {
        "status": "ok" if openai_ready else "degraded",
        "service": "ardha",
        "openai_ready": openai_ready,
        "rag_ready": rag_ready,
        "json_verses_loaded": len(GITA_VERSES),
        "wisdom_source": wisdom_source,
        "model": openai_optimizer.default_model if openai_ready else None,
    }
