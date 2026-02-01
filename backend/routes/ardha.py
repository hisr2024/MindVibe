"""Ardha Reframing Assistant - OpenAI-powered Gita reframing.

Ardha is a witnessed reframing tool rooted in Bhagavad Gita core wisdom.
This router provides Gita-inspired reframing with OpenAI integration.

Key Features:
- Direct OpenAI integration for reliable response generation
- Optional RAG enhancement when verses are available
- Graceful fallback to core Gita principles when RAG unavailable
- Session memory for contextual conversations
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.ardha_prompts import ARDHA_SYSTEM_PROMPT
from backend.services.openai_optimizer import openai_optimizer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ardha", tags=["ardha"])

SESSION_MEMORY: dict[str, list[dict[str, str]]] = {}
MAX_SESSION_TURNS = 10
LOW_CONFIDENCE_THRESHOLD = 0.35  # Lowered to allow more verse matches

SECTION_HEADINGS = [
    "Sacred Witnessing",
    "Anatomy of the Thought",
    "Gita Core Reframe",
    "Stabilizing Awareness",
    "One Grounded Reframe",
    "One Small Action",
    "One Question",
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

    # Try to get RAG-enhanced context if available
    gita_context = CORE_GITA_WISDOM
    sources: list[dict[str, str]] = []

    try:
        from backend.services.rag_service import rag_service
        if rag_service.ready:
            verses = await rag_service.hybrid_search(db, thought, limit=8)
            if verses:
                max_score = max((v.get("similarity_score", 0.0) for v in verses), default=0.0)
                if max_score >= LOW_CONFIDENCE_THRESHOLD:
                    gita_context, sources = _build_gita_context(verses)
                    logger.info(f"Ardha: Using RAG context with {len(verses)} verses (max_score={max_score:.2f})")
                else:
                    logger.info(f"Ardha: RAG scores too low ({max_score:.2f}), using core wisdom")
            else:
                logger.info("Ardha: No RAG results, using core wisdom")
        else:
            logger.info("Ardha: RAG service not ready, using core wisdom")
    except Exception as rag_error:
        logger.warning(f"Ardha: RAG search failed ({rag_error}), using core wisdom fallback")

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

    # Generate response using OpenAI
    response_text = await _generate_reframe(messages, max_tokens=max_tokens)
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
            "Sacred Witnessing",
            "I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "Anatomy of the Thought",
            "I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "Gita Core Reframe",
            "I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "Stabilizing Awareness",
            "I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "One Grounded Reframe",
            "I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.",
            "One Small Action",
            "Take one slow breath and wait for the Gita context to load.",
            "One Question",
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


async def _generate_reframe(messages: list[dict[str, str]], max_tokens: int = 600) -> str:
    """Generate reframe using OpenAI.

    Args:
        messages: Chat messages for OpenAI
        max_tokens: Maximum tokens for response (varies by depth)

    Returns:
        Generated reframe response

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
                return content

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
    """Health check with OpenAI status."""
    openai_ready = openai_optimizer.ready and openai_optimizer.client is not None

    # Try to check RAG status
    rag_ready = False
    try:
        from backend.services.rag_service import rag_service
        rag_ready = rag_service.ready
    except Exception:
        pass

    return {
        "status": "ok" if openai_ready else "degraded",
        "service": "ardha",
        "openai_ready": openai_ready,
        "rag_ready": rag_ready,
        "model": openai_optimizer.default_model if openai_ready else None,
    }
