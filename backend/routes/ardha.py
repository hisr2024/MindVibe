"""Ardha Reframing Assistant - OpenAI-powered Gita reframing.

Ardha is a witnessed reframing tool rooted in Bhagavad Gita core wisdom.
This router provides strictly Gita-bound reframing with repository-only context.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.ardha_prompts import ARDHA_SYSTEM_PROMPT
from backend.services.openai_optimizer import openai_optimizer
from backend.services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ardha", tags=["ardha"])

SESSION_MEMORY: dict[str, list[dict[str, str]]] = {}
MAX_SESSION_TURNS = 10
LOW_CONFIDENCE_THRESHOLD = 0.55

SECTION_HEADINGS = [
    "Sacred Witnessing",
    "Anatomy of the Thought",
    "Gita Core Reframe",
    "Stabilizing Awareness",
    "One Grounded Reframe",
    "One Small Action",
    "One Question",
]


@router.post("/reframe")
async def reframe_thought(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate Ardha reframing from repository-only Gita wisdom."""
    thought = (payload.get("thought") or "").strip()
    depth = (payload.get("depth") or "quick").strip().lower()
    session_id = (payload.get("sessionId") or "anonymous").strip() or "anonymous"

    if not thought:
        raise HTTPException(status_code=400, detail="thought is required")

    if len(thought) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if depth not in {"quick", "deep", "quantum"}:
        depth = "quick"

    verses = await rag_service.hybrid_search(db, thought, limit=8)
    max_score = max((verse.get("similarity_score", 0.0) for verse in verses), default=0.0)

    if not verses or max_score < LOW_CONFIDENCE_THRESHOLD:
        verses = await rag_service.hybrid_search(db, thought, limit=12)
        max_score = max((verse.get("similarity_score", 0.0) for verse in verses), default=0.0)

    if not verses or max_score < LOW_CONFIDENCE_THRESHOLD:
        response = _missing_context_response()
        return {"response": response, "sources": []}

    gita_context, sources = _build_gita_context(verses)
    session_memory = _get_session_memory(session_id)

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

    response_text = await _generate_reframe(messages)
    response_text = _sanitize_response(response_text)

    _store_session_memory(session_id, thought, response_text)

    logger.info(
        "✅ Ardha reframe generated with %s verses (depth=%s, session=%s)",
        len(verses),
        depth,
        session_id,
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


async def _generate_reframe(messages: list[dict[str, str]]) -> str:
    if not openai_optimizer.ready or not openai_optimizer.client:
        logger.warning("Ardha: OpenAI not configured, using fallback response")
        return _missing_context_response()

    try:
        openai_optimizer.validate_token_limits(messages)
        completion = openai_optimizer.client.chat.completions.create(
            model=openai_optimizer.default_model,
            messages=messages,
            temperature=0.3,
            max_tokens=600,
        )
        if completion.choices and completion.choices[0].message:
            return completion.choices[0].message.content or ""
        return ""
    except Exception as exc:
        logger.error("Ardha: OpenAI request failed: %s", exc)
        return _missing_context_response()


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
    """Health check."""
    return {"status": "ok", "service": "ardha", "provider": "kiaan"}
