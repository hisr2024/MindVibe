"""ARDHA Router — Atma-Reframing through Dharma and Higher Awareness.

Gita-compliant cognitive reframing through 5 pillars:
  A — Atma Distinction (Right Identity)
  R — Raga-Dvesha Diagnosis (Attachment Scan)
  D — Dharma Alignment (Right Action)
  H — Hrdaya Samatvam (Equanimity of Heart)
  A — Arpana (Offering & Surrender)

Key Features:
- ARDHA 5-pillar reframing engine with strict Gita compliance
- Direct OpenAI integration for reliable response generation
- RAG enhancement when embeddings are available (primary)
- JSON-based verse search using full 700+ Gita verses (secondary)
- ARDHA knowledge base with 25 key verses across 5 pillars
- Core wisdom fallback for edge cases
- Session memory for contextual conversations
- Gita Wisdom Filter on all responses
- 5-test Gita compliance validation on every response
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.services.ardha_prompts import ARDHA_SYSTEM_PROMPT
from backend.services.ardha_reframing_engine import (
    analyze_thought,
    build_ardha_verse_context,
    get_crisis_response,
    search_ardha_verses_in_corpus,
    validate_ardha_compliance,
)
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
            logger.info("ARDHA: Gita Wisdom Filter integrated")
        except Exception as e:
            logger.warning(f"ARDHA: Gita Wisdom Filter unavailable: {e}")
            _gita_filter = False
    return _gita_filter if _gita_filter else None


router = APIRouter(prefix="/api/ardha", tags=["ardha"])

# Load complete Gita verses from JSON (701 verses)
GITA_VERSES: list[dict[str, Any]] = []
GITA_VERSES_PATH = Path(__file__).parent.parent.parent / "data" / "gita" / "gita_verses_complete.json"

try:
    if GITA_VERSES_PATH.exists():
        with open(GITA_VERSES_PATH, encoding="utf-8") as f:
            GITA_VERSES = json.load(f)
        logger.info(f"ARDHA: Loaded {len(GITA_VERSES)} Gita verses from JSON")
    else:
        logger.warning(f"ARDHA: Gita verses file not found at {GITA_VERSES_PATH}")
except Exception as e:
    logger.error(f"ARDHA: Failed to load Gita verses: {e}")

SESSION_MEMORY: dict[str, list[dict[str, str]]] = {}
MAX_SESSION_TURNS = 10
LOW_CONFIDENCE_THRESHOLD = 0.35

# ARDHA section headings (replacing old CBT headings)
SECTION_HEADINGS = [
    "Atma Distinction",
    "Raga-Dvesha Scan",
    "Dharma Alignment",
    "Hrdaya Samatvam",
    "Arpana",
    "Gita Verse",
    "Compliance Check",
]

# Core Gita wisdom for fallback when RAG is unavailable
CORE_GITA_WISDOM = """[GITA_CORE_WISDOM_CONTEXT]
Core teachings from the Bhagavad Gita for ARDHA reframing:

- BG 2.16: "The unreal has no existence, and the real never ceases to be."
  ARDHA Pillar: Atma Distinction — The Self (sat) is permanent; mental states (asat) are impermanent.

- BG 2.20: "The soul is never born, nor does it ever die."
  ARDHA Pillar: Atma Distinction — Your essential nature is beyond birth, death, and change.

- BG 2.62-63: "From attachment springs desire, from desire comes anger, from anger arises delusion."
  ARDHA Pillar: Raga-Dvesha — Trace disturbance back to attachment. Break the chain.

- BG 3.37: "It is desire alone, born of passion, that transforms into anger."
  ARDHA Pillar: Raga-Dvesha — The real enemy is desire (kama), not the external situation.

- BG 2.47: "You have the right to perform your duty, but not to the fruits of action."
  ARDHA Pillar: Dharma — Focus on effort, release outcome. This is Karma Yoga.

- BG 3.35: "It is better to perform one's own duty imperfectly than another's perfectly."
  ARDHA Pillar: Dharma — Honor your unique path. Comparison breeds suffering.

- BG 2.48: "Perform action being steadfast in yoga, balanced in success and failure. Equanimity is Yoga."
  ARDHA Pillar: Hrdaya Samatvam — Samatvam (equanimity) IS the definition of Yoga.

- BG 2.38: "Treating alike pleasure and pain, gain and loss, victory and defeat, engage in battle."
  ARDHA Pillar: Hrdaya Samatvam — Equal vision in all dualities.

- BG 18.66: "Abandon all varieties of dharma and surrender unto Me. Do not fear."
  ARDHA Pillar: Arpana — Complete surrender completes Karma Yoga.

- BG 9.27: "Whatever you do, whatever you eat, whatever you offer — do it as an offering to Me."
  ARDHA Pillar: Arpana — Every action becomes sacred when offered.

- BG 6.5: "One must elevate, not degrade oneself by one's own mind."
  ARDHA Application: The mind can be friend or enemy. Choose wisely.

- BG 6.35: "The mind is restless, but can be controlled by practice and detachment."
  ARDHA Application: Abhyasa (practice) and vairagya (detachment) tame the mind.
[/GITA_CORE_WISDOM_CONTEXT]"""

# Spiritual wellness keywords mapped to Gita themes and chapters
MENTAL_HEALTH_KEYWORDS = {
    "anxiety": ["fear", "worry", "anxious", "nervous", "panic", "stress"],
    "fear": ["afraid", "scared", "terror", "dread", "phobia"],
    "sadness": ["sad", "depressed", "unhappy", "miserable", "grief", "sorrow", "despair"],
    "hopeless": ["hopelessness", "give up", "no hope", "pointless", "meaningless"],
    "anger": ["angry", "rage", "furious", "frustrated", "irritated", "annoyed", "mad"],
    "resentment": ["bitter", "grudge", "revenge", "hate", "hatred"],
    "attachment": ["attached", "clingy", "possessive", "losing", "loss", "let go"],
    "relationship": ["family", "friend", "partner", "spouse", "parent", "child", "love"],
    "doubt": ["self-doubt", "uncertain", "confused", "indecisive", "unsure"],
    "inadequacy": ["not good enough", "failure", "worthless", "inferior", "incompetent"],
    "work": ["job", "career", "workplace", "office", "boss", "colleague", "profession"],
    "duty": ["responsibility", "obligation", "dharma", "role", "purpose"],
    "mind": ["thoughts", "thinking", "mental", "restless", "overthinking", "rumination"],
    "control": ["discipline", "willpower", "temptation", "addiction", "habit"],
    "peace": ["calm", "serenity", "tranquility", "stillness", "quiet"],
    "balance": ["equanimity", "stable", "steady", "centered", "grounded"],
}

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


@router.post("/reframe")
async def reframe_thought(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Generate ARDHA reframing using the 5-pillar Gita-compliant framework.

    The ARDHA framework processes thoughts through:
    1. Atma Distinction — Correct identity before thought
    2. Raga-Dvesha Diagnosis — Scan for attachment/aversion
    3. Dharma Alignment — Clarify right action
    4. Hrdaya Samatvam — Establish equanimity
    5. Arpana — Offer action and surrender result

    Args:
        payload: {"thought": str, "depth": str, "sessionId": str}
        db: Database session

    Returns:
        {"response": str, "sources": list, "ardha_analysis": dict, "compliance": dict}
    """
    thought = (payload.get("thought") or "").strip()
    depth = (payload.get("depth") or "quick").strip().lower()
    session_id = (payload.get("sessionId") or "anonymous").strip() or "anonymous"

    if not thought:
        raise HTTPException(status_code=400, detail="thought is required")

    if len(thought) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if depth not in {"quick", "deep", "quantum"}:
        depth = "quick"

    # Step 1: ARDHA Analysis — detect emotions, map to pillars, check crisis
    analysis = analyze_thought(thought)

    # Crisis check — pause reframing for safety
    if analysis.crisis_detected:
        logger.warning("ARDHA: Crisis detected, pausing reframing for user safety")
        return {
            "response": get_crisis_response(),
            "sources": [],
            "ardha_analysis": {
                "primary_emotion": "crisis",
                "pillars": [],
                "crisis_detected": True,
            },
            "compliance": {"overall_compliant": False, "score": 0, "max_score": 5},
        }

    # Step 2: Check OpenAI availability
    if not openai_optimizer.ready or not openai_optimizer.client:
        logger.error("ARDHA: OpenAI not configured")
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again later.",
        )

    # Step 3: Build Gita context using multiple strategies
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
                    logger.info(f"ARDHA: Using RAG context ({len(verses)} verses, max_score={max_score:.2f})")
    except Exception as rag_error:
        logger.warning(f"ARDHA: RAG search failed ({rag_error})")

    # Strategy 2: ARDHA-specific corpus search (701 verses with pillar boosting)
    ardha_corpus_verses: list[dict[str, Any]] = []
    if GITA_VERSES:
        ardha_corpus_verses = search_ardha_verses_in_corpus(
            GITA_VERSES, thought, analysis, limit=10
        )

    # Strategy 3: JSON keyword search fallback
    if context_source == "core_wisdom" and GITA_VERSES:
        json_verses = _search_gita_json(thought, limit=8, depth=depth)
        if json_verses:
            gita_context, sources = _build_json_verse_context(json_verses)
            context_source = "json"
            logger.info(f"ARDHA: Using JSON search ({len(json_verses)} verses from 701)")

    # Step 4: Build ARDHA-specific context
    ardha_context, ardha_sources = build_ardha_verse_context(ardha_corpus_verses, analysis)
    sources.extend(ardha_sources)

    if context_source == "core_wisdom":
        logger.info("ARDHA: Using core wisdom fallback (12 essential verses)")

    # Step 5: Build messages for OpenAI
    session_memory = _get_session_memory(session_id)

    max_tokens_map = {"quick": 700, "deep": 1000, "quantum": 1400}
    max_tokens = max_tokens_map.get(depth, 700)

    messages = [
        {"role": "system", "content": ARDHA_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Depth: {depth} (quick=concise 5-pillar, deep=expanded, quantum=comprehensive)\n"
                f"Detected emotion: {analysis.primary_emotion}\n"
                f"Recommended pillars: {', '.join(p.name for p in analysis.recommended_pillars)}\n"
                f"Thought: {thought}"
            ),
        },
        {"role": "user", "content": gita_context},
        {"role": "user", "content": ardha_context},
    ]

    if session_memory:
        messages.insert(
            1,
            {
                "role": "user",
                "content": _format_session_memory(session_memory),
            },
        )

    # Step 6: Generate response using OpenAI with Gita wisdom filtering
    response_text = await _generate_reframe(messages, max_tokens=max_tokens, user_thought=thought)
    response_text = _sanitize_response(response_text)

    # Step 7: Validate ARDHA compliance
    compliance = validate_ardha_compliance(response_text)

    # Step 8: Store in session memory
    _store_session_memory(session_id, thought, response_text)

    logger.info(
        "ARDHA reframe generated (depth=%s, emotion=%s, pillars=%d, compliance=%d/5, sources=%d)",
        depth,
        analysis.primary_emotion,
        len(analysis.recommended_pillars),
        compliance["score"],
        len(sources),
    )

    return {
        "response": response_text,
        "sources": sources,
        "ardha_analysis": {
            "primary_emotion": analysis.primary_emotion,
            "detected_emotions": analysis.detected_emotions[:5],
            "pillars": [
                {
                    "code": p.code,
                    "name": p.name,
                    "sanskrit_name": p.sanskrit_name,
                    "compliance_test": p.compliance_test,
                }
                for p in analysis.recommended_pillars
            ],
            "crisis_detected": False,
        },
        "compliance": compliance,
    }


@router.get("/pillars")
async def get_ardha_pillars() -> dict[str, Any]:
    """Return the 5 ARDHA pillars with their teachings and key verses.

    This endpoint provides the complete ARDHA framework structure
    for frontend display and educational purposes.
    """
    from data.ardha_knowledge_base import ARDHA_PILLARS

    pillars_data = []
    for pillar in ARDHA_PILLARS:
        pillars_data.append({
            "code": pillar.code,
            "name": pillar.name,
            "sanskrit_name": pillar.sanskrit_name,
            "core_teaching": pillar.core_teaching,
            "description": pillar.description,
            "diagnostic_questions": pillar.diagnostic_questions,
            "reframe_template": pillar.reframe_template,
            "compliance_test": pillar.compliance_test,
            "key_verses": [
                {
                    "reference": v.reference,
                    "english": v.english,
                    "principle": v.principle,
                    "reframe_guidance": v.reframe_guidance,
                    "mental_health_tags": v.mental_health_tags,
                }
                for v in pillar.key_verses
            ],
        })

    return {
        "framework": "ARDHA",
        "full_name": "Atma-Reframing through Dharma and Higher Awareness",
        "pillars": pillars_data,
        "compliance_tests": [
            "Is identity detached from role?",
            "Is action performed without craving?",
            "Is outcome mentally released?",
            "Is equanimity maintained?",
            "Is action offered beyond ego?",
        ],
        "total_key_verses": sum(len(p.key_verses) for p in ARDHA_PILLARS),
        "corpus_verses_available": len(GITA_VERSES),
    }


def _build_gita_context(verses: list[dict[str, Any]]) -> tuple[str, list[dict[str, str]]]:
    """Build context from RAG verses."""
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


def _search_gita_json(query: str, limit: int = 8, depth: str = "quick") -> list[dict[str, Any]]:
    """Search 701 Gita verses using keyword matching and spiritual wellness relevance.

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

    expanded_keywords = set(query_words)
    for category, keywords in MENTAL_HEALTH_KEYWORDS.items():
        for keyword in keywords:
            if keyword in query_lower:
                expanded_keywords.add(category)
                expanded_keywords.update(keywords)

    scored_verses: list[tuple[float, dict[str, Any]]] = []

    for verse in GITA_VERSES:
        score = 0.0

        mh_apps = verse.get("mental_health_applications", [])
        for app in mh_apps:
            if app.lower() in expanded_keywords or any(k in app.lower() for k in expanded_keywords):
                score += 2.0

        theme = verse.get("theme", "").lower()
        if any(k in theme for k in expanded_keywords):
            score += 1.5

        english = verse.get("english", "").lower()
        for word in expanded_keywords:
            if len(word) > 3 and word in english:
                score += 0.5

        principle = verse.get("principle", "").lower()
        for word in expanded_keywords:
            if len(word) > 3 and word in principle:
                score += 0.3

        chapter = verse.get("chapter", 0)
        if chapter in [2, 6, 12, 18]:
            score *= 1.3
        elif chapter == 3:
            score *= 1.2

        if score > 0:
            scored_verses.append((score, verse))

    scored_verses.sort(key=lambda x: x[0], reverse=True)

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
        file_path = "data/gita/gita_verses_complete.json"

        english = verse.get("english", "")
        sanskrit = verse.get("sanskrit", "").split("\n")[0] if verse.get("sanskrit") else ""
        principle = verse.get("principle", "")
        mh_apps = verse.get("mental_health_applications", [])

        lines.append(f"- Reference: {reference}")
        if sanskrit:
            lines.append(f"  Sanskrit: {sanskrit[:100]}...")
        lines.append(f"  Translation: {english}")
        if principle:
            lines.append(f"  Principle: {principle}")
        if mh_apps:
            lines.append(f"  Spiritual Wellness Applications: {', '.join(mh_apps[:5])}")
        lines.append("")

        sources.append({"file": file_path, "reference": reference})

    lines.append("[/GITA_CORE_WISDOM_CONTEXT]")
    return "\n".join(lines), sources


def _get_session_memory(session_id: str) -> list[dict[str, str]]:
    """Retrieve session memory for contextual conversations."""
    return SESSION_MEMORY.get(session_id, [])


def _store_session_memory(session_id: str, thought: str, response: str) -> None:
    """Store thought-response pair in session memory."""
    entries = SESSION_MEMORY.get(session_id, [])
    entries.append({"thought": thought, "response": response})
    SESSION_MEMORY[session_id] = entries[-MAX_SESSION_TURNS:]


def _format_session_memory(memory: list[dict[str, str]]) -> str:
    """Format session memory for inclusion in AI prompt."""
    lines = ["Session memory (last 10 turns):"]
    for entry in memory[-MAX_SESSION_TURNS:]:
        lines.append(f"- User: {entry.get('thought', '')}")
        lines.append(f"- ARDHA: {entry.get('response', '')}")
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
            logger.debug(f"ARDHA Gita filter: score={filter_result.wisdom_score:.2f}")
            return filter_result.content
        except Exception as e:
            logger.warning(f"ARDHA Gita filter error (continuing): {e}")
    return content


async def _generate_reframe(
    messages: list[dict[str, str]],
    max_tokens: int = 700,
    user_thought: str = "",
) -> str:
    """Generate ARDHA reframe using OpenAI with Gita wisdom filtering.

    All responses pass through the Gita Core Wisdom Filter.

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
        logger.error("ARDHA: OpenAI not configured")
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please check configuration.",
        )

    try:
        openai_optimizer.validate_token_limits(messages, max_tokens)

        completion = openai_optimizer.client.chat.completions.create(
            model=openai_optimizer.default_model,
            messages=messages,
            temperature=0.4,
            max_tokens=max_tokens,
        )

        if completion.choices and completion.choices[0].message:
            content = completion.choices[0].message.content or ""
            if content.strip():
                filtered_content = await _apply_gita_filter(content, user_thought)
                logger.info("ARDHA: Gita filter applied to reframe response")
                return filtered_content

        logger.error("ARDHA: OpenAI returned empty response")
        raise HTTPException(
            status_code=500,
            detail="AI generated an empty response. Please try again.",
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("ARDHA: OpenAI request failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=f"AI service error: {str(exc)}",
        ) from exc


def _sanitize_response(response: str) -> str:
    """Sanitize the AI response and validate ARDHA section headings."""
    cleaned = response.strip()
    for heading in SECTION_HEADINGS:
        if heading not in cleaned:
            logger.warning("ARDHA response missing heading: %s", heading)
    return "".join(char for char in cleaned if not _is_emoji(char))


def _is_emoji(char: str) -> bool:
    """Check if a character is an emoji."""
    return (
        "\U0001F300" <= char <= "\U0001FAFF"
        or "\U00002700" <= char <= "\U000027BF"
        or "\U0001F000" <= char <= "\U0001F02F"
    )


@router.get("/health")
async def ardha_health():
    """Health check with ARDHA framework, OpenAI, and verse availability status."""
    openai_ready = openai_optimizer.ready and openai_optimizer.client is not None

    rag_ready = False
    try:
        from backend.services.rag_service import rag_service
        rag_ready = rag_service.ready
    except Exception:
        pass

    # Check ARDHA knowledge base
    ardha_kb_loaded = False
    ardha_pillar_count = 0
    ardha_verse_count = 0
    try:
        from data.ardha_knowledge_base import ARDHA_PILLARS
        ardha_kb_loaded = True
        ardha_pillar_count = len(ARDHA_PILLARS)
        ardha_verse_count = sum(len(p.key_verses) for p in ARDHA_PILLARS)
    except Exception:
        pass

    if rag_ready:
        wisdom_source = "rag_embeddings"
    elif GITA_VERSES:
        wisdom_source = "json_701_verses"
    else:
        wisdom_source = "core_12_verses"

    return {
        "status": "ok" if openai_ready else "degraded",
        "service": "ardha",
        "framework": "ARDHA (Atma-Reframing through Dharma and Higher Awareness)",
        "pillars": ["Atma Distinction", "Raga-Dvesha Diagnosis", "Dharma Alignment", "Hrdaya Samatvam", "Arpana"],
        "openai_ready": openai_ready,
        "rag_ready": rag_ready,
        "ardha_kb_loaded": ardha_kb_loaded,
        "ardha_pillar_count": ardha_pillar_count,
        "ardha_key_verses": ardha_verse_count,
        "json_verses_loaded": len(GITA_VERSES),
        "wisdom_source": wisdom_source,
        "model": openai_optimizer.default_model if openai_ready else None,
        "compliance_tests": 5,
    }
