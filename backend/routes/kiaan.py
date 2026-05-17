"""KIAAN unified router — Android app → FastAPI → AI provider.

Exposes one coherent surface for the mobile client:

    POST /api/kiaan/chat                         → Sakha chat
    POST /api/kiaan/tools/emotional-reset        → Emotional Reset
    POST /api/kiaan/tools/ardha                  → Cognitive reframing
    POST /api/kiaan/tools/viyoga                 → Sacred detachment
    POST /api/kiaan/tools/karma-reset            → Karmic pattern reset
    POST /api/kiaan/tools/sambandh-dharma   → Relationship dharma
    POST /api/kiaan/tools/karmalytix             → Weekly Sacred Mirror

Every endpoint authenticates with the project's JWT dependency, delegates
to :func:`backend.services.ai_provider.call_kiaan_ai`, and returns a tight
``ChatResponse`` envelope the Android client already consumes.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user, get_db
from backend.middleware.rate_limiter import CHAT_RATE_LIMIT, limiter
from backend.services.ai_provider import (
    AIProviderError,
    AIProviderNotConfigured,
)
from backend.services.kiaan_grounded_ai import (
    call_kiaan_ai_grounded,
    call_kiaan_ai_grounded_stream,
)
from backend.services.tool_envelope import build_tool_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kiaan", tags=["kiaan"])
# Compatibility alias — some clients hit `/api/sakha/chat`. It reuses the
# same handler so behaviour is identical and there is exactly one code path.
sakha_router = APIRouter(prefix="/api/sakha", tags=["kiaan"])

MAX_MESSAGE_LENGTH = 2000
MAX_TOOL_FIELD_LENGTH = 1000
MAX_HISTORY_MESSAGES = 40
MAX_SYSTEM_CONTEXT_LENGTH = 4000


# ── REQUEST / RESPONSE MODELS ────────────────────────────────────────────
class Message(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)

    @field_validator("role")
    @classmethod
    def _role_allowed(cls, v: str) -> str:
        if v not in ("user", "assistant"):
            raise ValueError("role must be 'user' or 'assistant'")
        return v


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    conversation_history: list[Message] = Field(default_factory=list)
    tool_name: str | None = Field(default=None, max_length=64)
    gita_verse: dict[str, Any] | None = None
    # Optional extras accepted by some clients. `context` is informational
    # ("chat" vs "tool"); `system_context` replaces the default Sakha system
    # prompt wholesale when the caller ships its own curated context.
    context: str = Field(default="chat", max_length=64)
    system_context: str | None = Field(
        default=None, max_length=MAX_SYSTEM_CONTEXT_LENGTH
    )

    @field_validator("conversation_history")
    @classmethod
    def _bound_history(cls, v: list[Message]) -> list[Message]:
        if len(v) > MAX_HISTORY_MESSAGES:
            raise ValueError(
                f"conversation_history exceeds {MAX_HISTORY_MESSAGES} messages"
            )
        return v


class ChatResponse(BaseModel):
    response: str
    conversation_id: str | None = None
    # Verses surfaced from Wisdom Core (static + dynamic) that grounded
    # the response. Empty list when retrieval was skipped or returned
    # nothing — never None, so the Android client can render a flat
    # `verses?.length` check without a null-guard.
    verses: list[dict[str, Any]] = Field(default_factory=list)


class ToolRequest(BaseModel):
    inputs: dict[str, Any] = Field(default_factory=dict)
    gita_verse: dict[str, Any] | None = None

    @field_validator("inputs")
    @classmethod
    def _bound_inputs(cls, v: dict[str, Any]) -> dict[str, Any]:
        # Defensive: clamp individual string values to prevent oversized prompts.
        for key, value in list(v.items()):
            if isinstance(value, str) and len(value) > MAX_TOOL_FIELD_LENGTH:
                v[key] = value[:MAX_TOOL_FIELD_LENGTH]
        return v


# ── HELPERS ──────────────────────────────────────────────────────────────
def _tool_input(inputs: dict[str, Any], key: str, default: str = "") -> str:
    """Coerce a tool input to string, stripped. Missing or non-string → default."""
    value = inputs.get(key, default)
    if value is None:
        return default
    return str(value).strip() or default


async def _run_ai(
    *,
    message: str,
    db: AsyncSession | None = None,
    user_id: str | None = None,
    history: list[dict[str, str]] | None = None,
    tool_name: str | None = None,
    gita_verse: dict[str, Any] | None = None,
    system_override: str | None = None,
) -> tuple[str, list[dict[str, Any]]]:
    """Call the AI provider through the Wisdom-Core-gated pipeline.

    Delegates to :func:`backend.services.kiaan_grounded_ai.call_kiaan_ai_grounded`,
    which enforces the three-stage invariant the codebase commits to for
    every user-facing KIAAN response:

      * **Pre-LLM:** when ``db`` is provided and the caller has *not*
        shipped its own ``system_override``, the system prompt is composed
        by Wisdom Core — persona-version 1.2.0 (modern-secular text
        persona) + retrieved verses block from
        :class:`backend.services.wisdom_core.WisdomCore` (static + dynamic
        corpus, effectiveness-weighted) + ``gita_practical_wisdom`` modern
        implementation. That replaces the legacy Krishna-flavoured
        constant in :mod:`backend.services.ai_provider`.
      * **LLM:** routed by the configured ``AI_PROVIDER`` via
        :func:`call_kiaan_ai`.
      * **Post-LLM:** the response passes through
        :class:`backend.services.gita_wisdom_filter.GitaWisdomFilter`,
        which validates Gita grounding and enhances when the wisdom
        score is low.

    Returns ``(response_text, verses)`` so the caller can echo verse
    refs back to the client (Android already parses them from the
    streaming endpoint's done frame; this gives the unary endpoints
    parity).

    Provider configuration problems surface as 503 (service unavailable) —
    the app should keep working; only AI features are degraded. Transient
    upstream failures surface as 502 (bad gateway). Validation errors from
    the provider layer become 400.
    """
    try:
        grounded = await call_kiaan_ai_grounded(
            message=message,
            db=db,
            user_id=user_id,
            tool_name=tool_name,
            conversation_history=history or [],
            gita_verse=gita_verse,
            system_override=system_override,
        )
        return grounded.text, grounded.verses
    except AIProviderNotConfigured as exc:
        logger.error("KIAAN AI not configured: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sakha is temporarily unavailable. Please try again shortly.",
        ) from exc
    except AIProviderError as exc:
        logger.error("KIAAN AI provider error (tool=%s): %s", tool_name, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sakha could not be reached right now. Please try again.",
        ) from exc
    except ValueError as exc:
        logger.warning("KIAAN AI validation error (tool=%s): %s", tool_name, exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# ── ENDPOINT 1: Sakha Chat ────────────────────────────────────────────────
async def _handle_sakha_chat(
    payload: ChatRequest,
    current_user_id: str,
    db: AsyncSession,
) -> ChatResponse:
    """Shared implementation for the Sakha chat endpoint and its alias."""
    history = [
        {"role": m.role, "content": m.content} for m in payload.conversation_history
    ]

    response_text, verses = await _run_ai(
        message=payload.message,
        db=db,
        user_id=current_user_id,
        history=history,
        tool_name=payload.tool_name,
        gita_verse=payload.gita_verse,
        system_override=payload.system_context,
    )
    return ChatResponse(
        response=response_text,
        conversation_id=current_user_id,
        verses=verses,
    )


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def sakha_chat(
    request: Request,
    payload: ChatRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Main Sakha chat endpoint consumed by the Android chat screen."""
    return await _handle_sakha_chat(payload, current_user_id, db)


@sakha_router.post("/chat", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def sakha_chat_alias(
    request: Request,
    payload: ChatRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Compat alias at ``/api/sakha/chat`` — identical to ``/api/kiaan/chat``."""
    return await _handle_sakha_chat(payload, current_user_id, db)


# ── ENDPOINT 1b: Sakha Chat (streaming SSE variant) ──────────────────────
@router.post("/chat/stream")
@limiter.limit(CHAT_RATE_LIMIT)
async def sakha_chat_stream(
    request: Request,
    payload: ChatRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Streaming variant of the Sakha chat endpoint (P1 §5).

    Wire format: Server-Sent Events. Three event types in order:

      * ``event: verses``  → list[dict] of Wisdom Core verses
      * ``event: token``   → str delta (one PASS sentence + trailing space)
      * ``event: done``    → telemetry dict (wisdom_score,
                              is_gita_grounded, enhancement_applied,
                              filter_applied, cache_hit, failure_reason)

    Cache HITs are emitted as the same protocol so the client never has
    to special-case them: ``verses`` event + a single ``token`` event
    carrying the cached text + ``done`` with ``cache_hit: true``.

    The pre-LLM Wisdom Core composer runs identically to the unary
    endpoint (same persona, same Static + Dynamic retrieval, same
    practical-wisdom enrichment). The post-LLM filter is the streaming
    variant — sentence-by-sentence PASS / HOLD / FAIL with the same
    rules the voice WSS path applies.

    Errors:
      * Provider not configured → 503 before the stream starts.
      * Upstream transient failure → 502 before the stream starts.
      * Mid-stream filter FAIL → the stream closes cleanly with a
        ``done`` event carrying ``failure_reason`` and ``fallback_tier``.
        The client renders the partial response under a "fallback"
        affordance.
    """
    history = [
        {"role": m.role, "content": m.content} for m in payload.conversation_history
    ]

    async def _event_stream():
        try:
            async for event in call_kiaan_ai_grounded_stream(
                message=payload.message,
                db=db,
                user_id=current_user_id,
                tool_name=payload.tool_name,
                conversation_history=history,
                gita_verse=payload.gita_verse,
                system_override=payload.system_context,
            ):
                # Serialize each event as one SSE record. ``data:`` MUST
                # be valid JSON (the field is a single string, but JSON
                # is the simplest unambiguous encoding for arbitrary
                # payloads — dict, list, str all serialize cleanly).
                payload_json = json.dumps(event.data, ensure_ascii=False)
                yield (
                    f"event: {event.kind}\n"
                    f"data: {payload_json}\n\n"
                ).encode()
        except AIProviderNotConfigured as exc:
            logger.error("KIAAN AI stream not configured: %s", exc)
            # Once the StreamingResponse has started we cannot change
            # the HTTP status. Emit a done event with the failure
            # reason so the client can surface it.
            yield (
                "event: done\n"
                f'data: {{"failure_reason": "ai_not_configured", "detail": "{str(exc)[:160]}"}}\n\n'
            ).encode()
        except AIProviderError as exc:
            logger.error(
                "KIAAN AI stream provider error (tool=%s): %s",
                payload.tool_name,
                exc,
            )
            yield (
                "event: done\n"
                f'data: {{"failure_reason": "ai_provider_error", "detail": "{str(exc)[:160]}"}}\n\n'
            ).encode()
        except Exception as exc:  # noqa: BLE001
            logger.exception("KIAAN AI stream crashed: %s", exc)
            yield (
                b"event: done\n"
                b'data: {"failure_reason": "internal_error"}\n\n'
            )

    # Pre-flight: bounce the obvious config error before opening the
    # SSE so the client gets a clean 503 instead of a degraded stream.
    # We mirror the unary route's behaviour here.
    import os as _os
    if (
        _os.getenv("AI_PROVIDER", "openai").strip().lower() == "openai"
        and not _os.getenv("OPENAI_API_KEY", "").strip()
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sakha is temporarily unavailable. Please try again shortly.",
        )

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        # Disable buffering at any intermediate proxy so each SSE record
        # reaches the client immediately.
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── ENDPOINT 2: Emotional Reset ──────────────────────────────────────────
@router.post("/tools/emotional-reset", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def emotional_reset(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    # Structured envelope (IMPROVEMENT_ROADMAP.md P1.5 §10) replaces
    # the hand-rolled English narrative. Same fields the Android client
    # already sends; the LLM gets a parse-stable JSON shape inside
    # <TOOL>/<INPUTS>/<REQUEST> tags.
    message = build_tool_message("Emotional Reset", {
        "emotion": _tool_input(payload.inputs, "emotion", "overwhelmed"),
        "intensity": _tool_input(payload.inputs, "intensity", "5"),
        "situation": _tool_input(payload.inputs, "situation"),
    })
    response_text, verses = await _run_ai(
        message=message,
        db=db,
        user_id=current_user_id,
        tool_name="Emotional Reset",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(
        response=response_text,
        conversation_id=current_user_id,
        verses=verses,
    )


# ── ENDPOINT 3: Ardha (Cognitive Reframing) ──────────────────────────────
@router.post("/tools/ardha", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def ardha(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    message = build_tool_message("Ardha", {
        "situation": _tool_input(payload.inputs, "situation"),
        "limiting_belief": _tool_input(payload.inputs, "limiting_belief"),
        "fear": _tool_input(payload.inputs, "fear"),
    })
    response_text, verses = await _run_ai(
        message=message,
        db=db,
        user_id=current_user_id,
        tool_name="Ardha",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(
        response=response_text,
        conversation_id=current_user_id,
        verses=verses,
    )


# ── ENDPOINT 4: Viyoga (Sacred Detachment) ───────────────────────────────
@router.post("/tools/viyoga", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def viyoga(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    message = build_tool_message("Viyoga", {
        "attachment": _tool_input(payload.inputs, "attachment"),
        "attachment_type": _tool_input(payload.inputs, "attachment_type"),
        "freedom_vision": _tool_input(payload.inputs, "freedom_vision"),
    })
    response_text, verses = await _run_ai(
        message=message,
        db=db,
        user_id=current_user_id,
        tool_name="Viyoga",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(
        response=response_text,
        conversation_id=current_user_id,
        verses=verses,
    )


# ── ENDPOINT 5: Karma Reset ──────────────────────────────────────────────
@router.post("/tools/karma-reset", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def karma_reset(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    message = build_tool_message("Karma Reset", {
        "pattern": _tool_input(payload.inputs, "pattern"),
        "dimension": _tool_input(payload.inputs, "dimension"),
        "dharmic_action": _tool_input(payload.inputs, "dharmic_action"),
    })
    response_text, verses = await _run_ai(
        message=message,
        db=db,
        user_id=current_user_id,
        tool_name="Karma Reset",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(
        response=response_text,
        conversation_id=current_user_id,
        verses=verses,
    )


# ── ENDPOINT 6: Sambandh Dharma (Relationship Compass) ─────────────────────────────────────
@router.post("/tools/sambandh-dharma", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def sambandh_dharma(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    message = build_tool_message("Sambandh Dharma (Relationship Compass)", {
        "challenge": _tool_input(payload.inputs, "challenge"),
        "relationship_type": _tool_input(payload.inputs, "relationship_type"),
        "core_difficulty": _tool_input(payload.inputs, "core_difficulty"),
    })
    response_text, verses = await _run_ai(
        message=message,
        db=db,
        user_id=current_user_id,
        tool_name="Sambandh Dharma (Relationship Compass)",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(
        response=response_text,
        conversation_id=current_user_id,
        verses=verses,
    )


# ── ENDPOINT 7: KarmaLytix Sacred Mirror ─────────────────────────────────
@router.post("/tools/karmalytix", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def karmalytix(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Generate the weekly Sacred Mirror from journal METADATA only.

    PRIVACY: This endpoint receives metadata — mood patterns, tags, self-reported
    challenges, sankalpa, karma dimension scores — never raw journal content.
    Journal entries remain encrypted on the client. Do not add journal text
    to this prompt under any circumstances.
    """
    # The KarmaLytix tool envelope carries the PRIVACY directive in
    # its <REQUEST> tag (see backend/services/tool_envelope.py).
    # Journal content is encrypted client-side and never reaches the
    # LLM; only the metadata fields below do.
    message = build_tool_message("KarmaLytix", {
        "mood_pattern": _tool_input(payload.inputs, "mood_pattern"),
        "tags": _tool_input(payload.inputs, "tags"),
        "journaling_days": _tool_input(payload.inputs, "journaling_days", "0"),
        "dharmic_challenge": _tool_input(payload.inputs, "dharmic_challenge"),
        "pattern_noticed": _tool_input(payload.inputs, "pattern_noticed"),
        "sankalpa": _tool_input(payload.inputs, "sankalpa"),
        "karma_dimensions": _tool_input(payload.inputs, "karma_dimensions"),
    })
    response_text, verses = await _run_ai(
        message=message,
        db=db,
        user_id=current_user_id,
        tool_name="KarmaLytix",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(
        response=response_text,
        conversation_id=current_user_id,
        verses=verses,
    )
