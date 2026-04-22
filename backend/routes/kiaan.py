"""KIAAN unified router — Android app → FastAPI → AI provider.

Exposes one coherent surface for the mobile client:

    POST /api/kiaan/chat                         → Sakha chat
    POST /api/kiaan/tools/emotional-reset        → Emotional Reset
    POST /api/kiaan/tools/ardha                  → Cognitive reframing
    POST /api/kiaan/tools/viyoga                 → Sacred detachment
    POST /api/kiaan/tools/karma-reset            → Karmic pattern reset
    POST /api/kiaan/tools/relationship-compass   → Relationship dharma
    POST /api/kiaan/tools/karmalytix             → Weekly Sacred Mirror

Every endpoint authenticates with the project's JWT dependency, delegates
to :func:`backend.services.ai_provider.call_kiaan_ai`, and returns a tight
``ChatResponse`` envelope the Android client already consumes.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator

from backend.deps import get_current_user
from backend.middleware.rate_limiter import CHAT_RATE_LIMIT, limiter
from backend.services.ai_provider import (
    AIProviderError,
    AIProviderNotConfigured,
    call_kiaan_ai,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kiaan", tags=["kiaan"])

MAX_MESSAGE_LENGTH = 2000
MAX_TOOL_FIELD_LENGTH = 1000
MAX_HISTORY_MESSAGES = 40


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
    history: list[dict[str, str]] | None = None,
    tool_name: str | None = None,
    gita_verse: dict[str, Any] | None = None,
) -> str:
    """Call the AI provider and translate errors into HTTP responses.

    Provider configuration problems surface as 503 (service unavailable) —
    the app should keep working; only AI features are degraded. Transient
    upstream failures surface as 502 (bad gateway). Validation errors from
    the provider layer become 400.
    """
    try:
        return await call_kiaan_ai(
            message=message,
            conversation_history=history or [],
            gita_verse=gita_verse,
            tool_name=tool_name,
        )
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
@router.post("/chat", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def sakha_chat(
    request: Request,
    payload: ChatRequest,
    current_user_id: str = Depends(get_current_user),
) -> ChatResponse:
    """Main Sakha chat endpoint consumed by the Android chat screen."""
    history = [
        {"role": m.role, "content": m.content} for m in payload.conversation_history
    ]

    response_text = await _run_ai(
        message=payload.message,
        history=history,
        tool_name=payload.tool_name,
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(response=response_text, conversation_id=current_user_id)


# ── ENDPOINT 2: Emotional Reset ──────────────────────────────────────────
@router.post("/tools/emotional-reset", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def emotional_reset(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
) -> ChatResponse:
    emotion = _tool_input(payload.inputs, "emotion", "overwhelmed")
    intensity = _tool_input(payload.inputs, "intensity", "5")
    situation = _tool_input(payload.inputs, "situation")

    message = (
        f"I am experiencing {emotion} with an intensity of {intensity}/10. "
        f"Here is what happened: {situation}. "
        "Please guide me through an emotional reset using Gita wisdom."
    )
    response_text = await _run_ai(
        message=message,
        tool_name="Emotional Reset",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(response=response_text, conversation_id=current_user_id)


# ── ENDPOINT 3: Ardha (Cognitive Reframing) ──────────────────────────────
@router.post("/tools/ardha", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def ardha(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
) -> ChatResponse:
    situation = _tool_input(payload.inputs, "situation")
    belief = _tool_input(payload.inputs, "limiting_belief")
    fear = _tool_input(payload.inputs, "fear")

    message = (
        "I need cognitive reframing through Gita wisdom. "
        f"My situation: {situation}. "
        f"The limiting belief holding me: {belief}. "
        f"What I fear most: {fear}. "
        "Please help me reframe this through Gita philosophy."
    )
    response_text = await _run_ai(
        message=message,
        tool_name="Ardha",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(response=response_text, conversation_id=current_user_id)


# ── ENDPOINT 4: Viyoga (Sacred Detachment) ───────────────────────────────
@router.post("/tools/viyoga", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def viyoga(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
) -> ChatResponse:
    attachment = _tool_input(payload.inputs, "attachment")
    attachment_type = _tool_input(payload.inputs, "attachment_type")
    freedom_vision = _tool_input(payload.inputs, "freedom_vision")

    message = (
        f"I am struggling to let go of: {attachment}. "
        f"This is an attachment to: {attachment_type}. "
        f"What freedom would feel like: {freedom_vision}. "
        "Please guide me through Viyoga — the sacred art of non-attachment."
    )
    response_text = await _run_ai(
        message=message,
        tool_name="Viyoga",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(response=response_text, conversation_id=current_user_id)


# ── ENDPOINT 5: Karma Reset ──────────────────────────────────────────────
@router.post("/tools/karma-reset", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def karma_reset(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
) -> ChatResponse:
    pattern = _tool_input(payload.inputs, "pattern")
    dimension = _tool_input(payload.inputs, "dimension")
    dharmic_action = _tool_input(payload.inputs, "dharmic_action")

    message = (
        f"I want to examine this karmic pattern: {pattern}. "
        f"This pattern involves: {dimension}. "
        f"The dharmic action I feel called to: {dharmic_action}. "
        "Please guide me through a Karma Reset using Gita wisdom."
    )
    response_text = await _run_ai(
        message=message,
        tool_name="Karma Reset",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(response=response_text, conversation_id=current_user_id)


# ── ENDPOINT 6: Relationship Compass ─────────────────────────────────────
@router.post("/tools/relationship-compass", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def relationship_compass(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
) -> ChatResponse:
    challenge = _tool_input(payload.inputs, "challenge")
    relationship_type = _tool_input(payload.inputs, "relationship_type")
    difficulty = _tool_input(payload.inputs, "core_difficulty")

    message = (
        f"I have a relationship challenge: {challenge}. "
        f"This is with: {relationship_type}. "
        f"The core difficulty is: {difficulty}. "
        "Please guide me through the Relationship Compass using Gita wisdom."
    )
    response_text = await _run_ai(
        message=message,
        tool_name="Relationship Compass",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(response=response_text, conversation_id=current_user_id)


# ── ENDPOINT 7: KarmaLytix Sacred Mirror ─────────────────────────────────
@router.post("/tools/karmalytix", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
async def karmalytix(
    request: Request,
    payload: ToolRequest,
    current_user_id: str = Depends(get_current_user),
) -> ChatResponse:
    """Generate the weekly Sacred Mirror from journal METADATA only.

    PRIVACY: This endpoint receives metadata — mood patterns, tags, self-reported
    challenges, sankalpa, karma dimension scores — never raw journal content.
    Journal entries remain encrypted on the client. Do not add journal text
    to this prompt under any circumstances.
    """
    mood_pattern = _tool_input(payload.inputs, "mood_pattern")
    tags = _tool_input(payload.inputs, "tags")
    journaling_days = _tool_input(payload.inputs, "journaling_days", "0")
    challenge = _tool_input(payload.inputs, "dharmic_challenge")
    pattern = _tool_input(payload.inputs, "pattern_noticed")
    sankalpa = _tool_input(payload.inputs, "sankalpa")
    dimensions = _tool_input(payload.inputs, "karma_dimensions")

    message = (
        "Generate a weekly Sacred Mirror for this devotee. "
        "METADATA ONLY — journal content is encrypted and never shared. "
        f"Mood pattern this week: {mood_pattern}. "
        f"Sacred themes they tagged: {tags}. "
        f"Days journaled: {journaling_days}/7. "
        f"Dharmic challenge they identified: {challenge}. "
        f"Pattern they noticed in themselves: {pattern}. "
        f"Sankalpa for next week: {sankalpa}. "
        f"Karma dimension scores: {dimensions}. "
        "Generate a warm, specific Sacred Mirror with: "
        "Mirror (what the data reveals), Pattern (recurring theme), "
        "Gita Echo (most relevant verse), Growth Edge (invitation to deepen), "
        "Blessing (acknowledgment of where they are)."
    )
    response_text = await _run_ai(
        message=message,
        tool_name="KarmaLytix",
        gita_verse=payload.gita_verse,
    )
    return ChatResponse(response=response_text, conversation_id=current_user_id)
