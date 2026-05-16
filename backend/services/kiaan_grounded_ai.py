"""Grounded KIAAN AI entry point — the single Wisdom-Core-gated call path.

Every KIAAN response that reaches a user — Sakha/KIAAN chat, the six
sacred tools (Emotional Reset, Ardha, Viyoga, Karma Reset,
Sambandh Dharma, KarmaLytix), and the voice companions — should go
through :func:`call_kiaan_ai_grounded`. It enforces three invariants the
roadmap (``IMPROVEMENT_ROADMAP.md`` P0 §1) requires every provider call
to honour:

1. **PRE-LLM grounding.** Unless the caller ships its own
   ``system_override``, the system prompt is composed by Wisdom Core:
   modern-secular persona v1.2.0 + dynamic effectiveness-weighted Gita
   verse + static Gita corpus search + ``gita_practical_wisdom`` modern
   implementation. No raw default prompt is ever sent to OpenAI / Sarvam
   / Anthropic on this path.

2. **LLM call.** Routes through :func:`backend.services.ai_provider.call_kiaan_ai`
   which honours the configured ``AI_PROVIDER`` and bounded history /
   timeouts / no-PII logging.

3. **POST-LLM filter.** Response runs through
   :meth:`backend.services.gita_wisdom_filter.GitaWisdomFilter.filter_response`
   for Gita-grounding validation. When the wisdom score is low, the
   filter enhances the content with verse + concept anchors before
   returning. The filter's verdict is surfaced to callers so the route
   layer can decide whether to surface it (e.g. telemetry, A/B).

The return value is a :class:`GroundedResponse` — never None, never
empty. Upstream failures are propagated as ``AIProviderError`` /
``AIProviderNotConfigured`` exactly as :func:`call_kiaan_ai` does today,
so existing route-layer error handling continues to work.

Imports of ``kiaan_wisdom_helper`` and ``gita_wisdom_filter`` are
deferred to call time. Both transitively touch DB models, and the
chat / tool routes import this module at process start; lazy imports
avoid a known import cycle (kiaan_wisdom_helper notes the same pattern
at module top).
"""

from __future__ import annotations

import contextlib
import logging
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.ai_provider import call_kiaan_ai

logger = logging.getLogger(__name__)


# Map the route-layer tool_name strings to the filter's WisdomTool enum.
# Kept here (not in gita_wisdom_filter) because the filter does not know
# about the human-readable tool names emitted by routes/kiaan.py.
_TOOL_NAME_TO_FILTER_TOOL: dict[str, str] = {
    "Ardha": "ardha",
    "Viyoga": "viyoga",
    "Sambandh Dharma (Relationship Compass)": "sambandh_dharma",
    "Emotional Reset": "emotional_reset",
    "Karma Reset": "karma_reset",
    # KarmaLytix has no dedicated filter tool yet → falls through to
    # WisdomTool.GENERAL, which still applies the wisdom-score check.
}


@dataclass(frozen=True)
class GroundedResponse:
    """Result of a Wisdom-Core-gated AI call.

    Attributes:
        text: User-facing response. Always non-empty. When the filter
            enhanced the content, this is the enhanced version.
        verses: Verses pulled from Wisdom Core (Static + Dynamic). May be
            empty when retrieval was skipped (no ``db``) or returned
            nothing. Each entry follows the
            ``kiaan_wisdom_helper.compose_kiaan_system_prompt`` shape
            (``verse_ref``, ``chapter``, ``verse``, ``sanskrit``,
            ``english``, ``principle``, ``theme``, ``source``).
        is_gita_grounded: True when the Gita-wisdom score met the filter's
            threshold (with or without enhancement). False when the
            filter could not be applied (then ``wisdom_score=0.0`` and
            callers should treat it as best-effort).
        wisdom_score: 0.0–1.0 score from the post-LLM filter. 0.0 when
            the filter was skipped or errored.
        enhancement_applied: True when the filter rewrote the text to
            add Gita anchors. Useful for telemetry / A/B.
        filter_applied: False only when ``apply_filter=False`` was passed
            or the filter raised. Lets callers detect bypass without
            inferring it from the other flags.
    """

    text: str
    verses: list[dict[str, Any]] = field(default_factory=list)
    is_gita_grounded: bool = True
    wisdom_score: float = 1.0
    enhancement_applied: bool = False
    filter_applied: bool = True


async def call_kiaan_ai_grounded(
    *,
    message: str,
    db: AsyncSession | None = None,
    user_id: str | None = None,
    tool_name: str | None = None,
    conversation_history: list[dict[str, Any]] | None = None,
    gita_verse: dict[str, Any] | None = None,
    system_override: str | None = None,
    apply_filter: bool = True,
) -> GroundedResponse:
    """Single Wisdom-Core-gated entry point.

    Args:
        message: User's latest message. Non-empty.
        db: Async session. When provided AND ``system_override`` is empty,
            Wisdom Core composition runs (Static + Dynamic). When None,
            ``call_kiaan_ai`` falls back to the legacy persona prompt —
            useful for unit tests and back-office scripts but **not** a
            path that should reach a real user response. Routes that
            serve users must pass ``db``.
        user_id: Required for the Dynamic Wisdom effectiveness pick. When
            omitted, retrieval degrades to Static-only and the user still
            gets a Gita-grounded response.
        tool_name: One of the six sacred tool names. Routes the
            post-filter to the right rubric and keeps telemetry sharp.
        conversation_history: Forwarded to ``call_kiaan_ai``. Trimmed to
            ``AI_HISTORY_WINDOW`` upstream.
        gita_verse: Optional pre-selected verse from the client (e.g. the
            mobile app surfacing the verse of the day). Combined with —
            not replaced by — Wisdom Core retrieval.
        system_override: Escape hatch. When provided, skips Wisdom Core
            composition. Still applies the post-LLM filter unless
            ``apply_filter=False``. Used by surfaces that already
            curate their own prompt (REST Voice Companion's
            ``_build_divine_friend_system_prompt``).
        apply_filter: Default True. Set False only when the caller is
            wrapping a streamed response that applies its own
            :class:`StreamingGitaFilter` (the WSS voice path).

    Returns:
        :class:`GroundedResponse`.

    Raises:
        AIProviderNotConfigured: Provider credentials missing.
        AIProviderError: Upstream call failed or returned empty content.
        ValueError: Empty ``message``.
    """
    if not message or not message.strip():
        raise ValueError("message must be a non-empty string")

    # ── 1. PRE-LLM: compose via Wisdom Core unless override provided ──
    verses: list[dict[str, Any]] = []
    effective_override = system_override
    if db is not None and not (system_override and system_override.strip()):
        try:
            # Lazy import: kiaan_wisdom_helper touches DB models. Keeping
            # the import here avoids a cycle and lets the test suite
            # patch the helper without bringing it into module-import.
            from backend.services.kiaan_wisdom_helper import (
                compose_kiaan_system_prompt,
            )

            composed, verses = await compose_kiaan_system_prompt(
                db=db,
                query=message,
                tool_name=tool_name,
                user_id=user_id,
            )
            if composed:
                effective_override = composed
        except Exception as exc:
            # Composition is best-effort. A DB hiccup or unmigrated
            # schema must NOT 500 the request. ``call_kiaan_ai`` will
            # fall back to its default persona prompt.
            logger.warning(
                "kiaan_grounded_ai: Wisdom Core compose failed "
                "(tool=%s user=%s): %s",
                tool_name,
                user_id,
                exc,
            )

    # ── 2. LLM call (provider routing handled by call_kiaan_ai) ───────
    raw_text = await call_kiaan_ai(
        message=message,
        conversation_history=conversation_history,
        gita_verse=gita_verse,
        tool_name=tool_name,
        system_override=effective_override,
    )

    # ── 3. POST-LLM: Gita wisdom filter ───────────────────────────────
    if not apply_filter:
        return GroundedResponse(
            text=raw_text,
            verses=verses,
            is_gita_grounded=True,
            wisdom_score=1.0,
            enhancement_applied=False,
            filter_applied=False,
        )

    try:
        from backend.services.gita_wisdom_filter import (
            WisdomTool,
            get_gita_wisdom_filter,
        )

        filter_tool = WisdomTool.GENERAL
        if tool_name:
            mapped = _TOOL_NAME_TO_FILTER_TOOL.get(tool_name)
            if mapped:
                try:
                    filter_tool = WisdomTool(mapped)
                except ValueError:
                    filter_tool = WisdomTool.GENERAL

        gita_filter = get_gita_wisdom_filter()
        filter_result = await gita_filter.filter_response(
            content=raw_text,
            tool_type=filter_tool,
            user_context=message,
            enhance_if_needed=True,
        )

        return GroundedResponse(
            text=filter_result.content or raw_text,
            verses=verses,
            is_gita_grounded=filter_result.is_gita_grounded,
            wisdom_score=float(filter_result.wisdom_score),
            enhancement_applied=filter_result.enhancement_applied,
            filter_applied=True,
        )
    except Exception as exc:
        # Filter failure must NOT block the user response. The pre-LLM
        # Wisdom Core composition has already grounded the prompt; the
        # post-filter is defence in depth.
        logger.warning(
            "kiaan_grounded_ai: Gita filter failed (tool=%s): %s",
            tool_name,
            exc,
        )
        return GroundedResponse(
            text=raw_text,
            verses=verses,
            is_gita_grounded=False,
            wisdom_score=0.0,
            enhancement_applied=False,
            filter_applied=False,
        )


async def filter_voice_response(
    *,
    raw_text: str,
    user_message: str,
    tool_name: str | None = None,
) -> tuple[str, dict[str, Any]]:
    """Post-LLM-only Gita filter for surfaces that curate their own prompt.

    The REST Voice Companion (``backend/routes/kiaan_voice_companion.py``)
    builds a bespoke "Divine Friend" system prompt and calls OpenAI
    directly. We do not want to clobber that curated persona, but we
    *do* want the post-LLM filter so the response cannot escape Gita
    grounding silently.

    This helper is intentionally narrow: it applies only Stage 3 of the
    grounded pipeline (filter), returning the filtered text plus a
    telemetry dict the route can log without depending on the filter's
    full result shape.

    Returns:
        ``(filtered_text, telemetry)`` where ``telemetry`` is
        ``{is_gita_grounded, wisdom_score, enhancement_applied,
        verses_referenced}``. On any internal failure, returns
        ``(raw_text, {"filter_applied": False, "error": "..."})``.
    """
    if not raw_text or not raw_text.strip():
        return raw_text, {"filter_applied": False, "error": "empty_input"}

    try:
        from backend.services.gita_wisdom_filter import (
            WisdomTool,
            get_gita_wisdom_filter,
        )

        filter_tool = WisdomTool.GENERAL
        if tool_name:
            mapped = _TOOL_NAME_TO_FILTER_TOOL.get(tool_name)
            if mapped:
                with contextlib.suppress(ValueError):
                    filter_tool = WisdomTool(mapped)

        gita_filter = get_gita_wisdom_filter()
        filter_result = await gita_filter.filter_response(
            content=raw_text,
            tool_type=filter_tool,
            user_context=user_message,
            enhance_if_needed=True,
        )
        return filter_result.content or raw_text, {
            "filter_applied": True,
            "is_gita_grounded": filter_result.is_gita_grounded,
            "wisdom_score": float(filter_result.wisdom_score),
            "enhancement_applied": filter_result.enhancement_applied,
            "verses_referenced": list(filter_result.verses_referenced),
        }
    except Exception as exc:
        logger.warning(
            "filter_voice_response: Gita filter failed (tool=%s): %s",
            tool_name,
            exc,
        )
        return raw_text, {"filter_applied": False, "error": str(exc)[:200]}


__all__ = [
    "GroundedResponse",
    "call_kiaan_ai_grounded",
    "filter_voice_response",
]
