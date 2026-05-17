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
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any, Literal

from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.ai_provider import call_kiaan_ai, call_kiaan_ai_stream

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
    # "Assistant" (the fourth engine, exposed by IMPROVEMENT_ROADMAP.md
    # P1 §9) intentionally maps to GENERAL as well — practical/task
    # responses still benefit from Gita grounding but have no rubric
    # of their own yet.
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
    locale: str = "en",
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
        user_id: Required for the Dynamic Wisdom effectiveness pick AND
            for the response cache scope (privacy floor). When omitted,
            retrieval degrades to Static-only AND the response cache is
            bypassed entirely — same-message asks always hit the LLM.
        tool_name: One of the six sacred tool names. Routes the
            post-filter to the right rubric, keeps telemetry sharp, and
            shards the response cache so the same message under different
            tools does not collide.
        conversation_history: Forwarded to ``call_kiaan_ai``. Trimmed to
            ``AI_HISTORY_WINDOW`` upstream. **Not** part of the cache
            key — caching is intentionally per-message, not per-thread,
            so a user asking the same question twice in two different
            conversations still gets the cached answer.
        gita_verse: Optional pre-selected verse from the client (e.g. the
            mobile app surfacing the verse of the day). Combined with —
            not replaced by — Wisdom Core retrieval. Bypasses the cache
            on writes (the verse changes the response semantics enough
            that a cached reply would feel stale).
        system_override: Escape hatch. When provided, skips both Wisdom
            Core composition AND the response cache. Still applies the
            post-LLM filter unless ``apply_filter=False``. Used by
            surfaces that already curate their own prompt (REST Voice
            Companion's ``_build_divine_friend_system_prompt``).
        apply_filter: Default True. Set False only when the caller is
            wrapping a streamed response that applies its own
            :class:`StreamingGitaFilter` (the WSS voice path). When
            False the cache is bypassed too — streaming responses
            should not be served from a cache that was built from
            final-text snapshots.
        locale: ``en`` / ``hi`` / ``sa`` — shards the cache so a Hindi
            ask and an English ask do not collide on the same key.

    Returns:
        :class:`GroundedResponse`.

    Raises:
        AIProviderNotConfigured: Provider credentials missing.
        AIProviderError: Upstream call failed or returned empty content.
        ValueError: Empty ``message``.
    """
    if not message or not message.strip():
        raise ValueError("message must be a non-empty string")

    # Per-turn telemetry envelope. Times the whole turn and emits the
    # end-to-end metric in the ``finally`` block so even error paths
    # land in Grafana. See IMPROVEMENT_ROADMAP.md P2 §14.
    import time as _time

    from backend.services.kiaan_telemetry import (
        record_grounded_turn as _record_turn,
    )
    from backend.services.kiaan_telemetry import (
        trace_stage as _trace_stage,
    )

    _turn_started = _time.monotonic()
    _turn_outcome = "ok"
    _turn_cache_hit = False
    _turn_provider: str | None = None
    _turn_model: str | None = None

    # ── 0. RESPONSE CACHE LOOKUP ──────────────────────────────────────
    # See IMPROVEMENT_ROADMAP.md P0 §2. The cache is bypassed when:
    #   * the caller supplied their own system_override (the cache key
    #     does not capture that variance);
    #   * streaming (apply_filter=False) — final-text cache is wrong
    #     shape for streamed deliveries;
    #   * a per-call gita_verse was supplied — pinning the response to
    #     a specific verse changes the semantics enough that we treat
    #     it as a one-off, not cacheable;
    #   * user_id is None — privacy floor.
    cache_eligible = (
        user_id is not None
        and apply_filter
        and not (system_override and system_override.strip())
        and gita_verse is None
    )
    response_cache = None
    if cache_eligible:
        try:
            from backend.services.kiaan_response_cache import (
                get_response_cache,
                rehydrate,
            )

            response_cache = get_response_cache()
            cached_payload = await response_cache.get(
                user_id=user_id,
                tool_name=tool_name,
                message=message,
                locale=locale,
            )
            if cached_payload is not None:
                _turn_cache_hit = True
                rehydrated = rehydrate(cached_payload)
                _record_turn(
                    tool_name=tool_name,
                    elapsed_seconds=_time.monotonic() - _turn_started,
                    cache_hit=True,
                    outcome="ok",
                    is_gita_grounded=rehydrated.is_gita_grounded,
                    wisdom_score_value=rehydrated.wisdom_score,
                    filter_applied=rehydrated.filter_applied,
                    provider=None,
                    model=None,
                    prompt_tokens=0,
                    completion_tokens=0,
                )
                return rehydrated
        except Exception as exc:
            # Cache failures must never block the user. Continue to LLM.
            logger.warning(
                "kiaan_grounded_ai: response cache GET failed (tool=%s): %s",
                tool_name,
                exc,
            )
            response_cache = None  # disable WRITE too if READ broke

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

            async with _trace_stage("compose"):
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
    # Stage timer: separates LLM latency from compose/filter on the
    # Grafana dashboard.
    async with _trace_stage("llm"):
        raw_text = await call_kiaan_ai(
            message=message,
            conversation_history=conversation_history,
            gita_verse=gita_verse,
            tool_name=tool_name,
            system_override=effective_override,
        )
    # call_kiaan_ai logs the provider/model itself; surface them here
    # for the cost counter at end-of-turn.
    from backend.services.ai_provider import AI_MODEL, AI_PROVIDER

    _turn_provider = AI_PROVIDER
    _turn_model = AI_MODEL

    # ── 3. POST-LLM: Gita wisdom filter ───────────────────────────────
    if not apply_filter:
        _record_turn(
            tool_name=tool_name,
            elapsed_seconds=_time.monotonic() - _turn_started,
            cache_hit=False,
            outcome="ok",
            is_gita_grounded=True,
            wisdom_score_value=1.0,
            filter_applied=False,
            provider=_turn_provider,
            model=_turn_model,
            prompt_tokens=0,
            completion_tokens=0,
        )
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
        async with _trace_stage("filter"):
            filter_result = await gita_filter.filter_response(
                content=raw_text,
                tool_type=filter_tool,
                user_context=message,
                enhance_if_needed=True,
            )

        result = GroundedResponse(
            text=filter_result.content or raw_text,
            verses=verses,
            is_gita_grounded=filter_result.is_gita_grounded,
            wisdom_score=float(filter_result.wisdom_score),
            enhancement_applied=filter_result.enhancement_applied,
            filter_applied=True,
        )

        # ── 4. RESPONSE CACHE WRITE (happy path only) ─────────────────
        # Skipped for degraded responses (filter exception below) so a
        # broken filter cannot poison the cache with un-grounded text.
        if response_cache is not None:
            try:
                async with _trace_stage("cache_set"):
                    await response_cache.set(
                        user_id=user_id,
                        tool_name=tool_name,
                        message=message,
                        response=result,
                        locale=locale,
                    )
            except Exception as cache_exc:
                logger.warning(
                    "kiaan_grounded_ai: response cache SET failed (tool=%s): %s",
                    tool_name,
                    cache_exc,
                )

        _record_turn(
            tool_name=tool_name,
            elapsed_seconds=_time.monotonic() - _turn_started,
            cache_hit=False,
            outcome="ok",
            is_gita_grounded=result.is_gita_grounded,
            wisdom_score_value=result.wisdom_score,
            filter_applied=True,
            provider=_turn_provider,
            model=_turn_model,
            # OpenAI token counts are logged by call_kiaan_ai but not
            # plumbed up to this layer yet. Cost counter will read 0
            # for this turn — a follow-up wires usage through the
            # provider response. Filed under P2 #15 (cost-aware
            # routing); for now the dashboard's cost line is best-
            # effort and uses provider/model labels for visibility.
            prompt_tokens=0,
            completion_tokens=0,
        )

        return result
    except Exception as exc:
        # Filter failure must NOT block the user response. The pre-LLM
        # Wisdom Core composition has already grounded the prompt; the
        # post-filter is defence in depth.
        logger.warning(
            "kiaan_grounded_ai: Gita filter failed (tool=%s): %s",
            tool_name,
            exc,
        )
        _record_turn(
            tool_name=tool_name,
            elapsed_seconds=_time.monotonic() - _turn_started,
            cache_hit=False,
            outcome="filter_error",
            is_gita_grounded=False,
            wisdom_score_value=0.0,
            filter_applied=False,
            provider=_turn_provider,
            model=_turn_model,
            prompt_tokens=0,
            completion_tokens=0,
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


# ── STREAMING ENTRY POINT (P1 §5) ────────────────────────────────────────


@dataclass(frozen=True)
class GroundedStreamEvent:
    """One event in a Wisdom-Core-gated streaming response.

    Three event kinds form the wire protocol:

    * ``"verses"`` — emitted once after the pre-LLM Wisdom Core
      composition. ``data`` is ``list[dict]`` (the same verse shape
      :class:`GroundedResponse.verses` carries). Lets the client paint
      verse-ref chips before the first token arrives.
    * ``"token"`` — emitted per PASS sentence from
      :class:`StreamingGitaFilter`. ``data`` is the sentence text plus a
      single space — concatenating all ``token`` events reconstructs
      the final user-facing response losslessly. Note: HOLD sentences
      are not emitted until the filter promotes them to PASS or the
      stream ends; FAIL truncates the stream and triggers a fallback.
    * ``"done"`` — emitted exactly once at the end. ``data`` is the
      filter telemetry dict — ``is_gita_grounded``, ``wisdom_score``,
      ``enhancement_applied``, ``filter_applied``, ``cache_hit``,
      ``failure_reason`` (when the streaming filter failed and a
      fallback was emitted).
    """

    kind: Literal["verses", "token", "done"]
    data: Any


async def call_kiaan_ai_grounded_stream(
    *,
    message: str,
    db: AsyncSession | None = None,
    user_id: str | None = None,
    tool_name: str | None = None,
    conversation_history: list[dict[str, Any]] | None = None,
    gita_verse: dict[str, Any] | None = None,
    system_override: str | None = None,
    locale: str = "en",
) -> AsyncIterator[GroundedStreamEvent]:
    """Wisdom-Core-gated streaming entry point.

    Same three-stage contract as :func:`call_kiaan_ai_grounded` —
    pre-LLM Wisdom Core composition, LLM call, post-LLM Gita gating —
    but the LLM step yields token deltas and the filter runs
    sentence-by-sentence via :class:`StreamingGitaFilter` instead of
    the unary ``filter_response``. Same filter the WSS voice path uses
    (``backend/services/voice/orchestrator.py``).

    Cache integration: the read path is honoured (a HIT short-circuits
    compose + LLM and emits the cached payload as a single ``verses``
    event + one ``token`` event + ``done``). The write path is
    skipped — partial-stream responses are not safe to cache, and the
    unary path already populates the cache for the next unary call.

    Args mirror :func:`call_kiaan_ai_grounded`.

    Yields :class:`GroundedStreamEvent` in this order:

      verses → token? → token? → ... → done

    Raises the same :class:`AIProviderError` / :class:`AIProviderNotConfigured`
    hierarchy as the unary path. The SSE route maps them to 503 / 502.
    """
    if not message or not message.strip():
        raise ValueError("message must be a non-empty string")

    # ── 0. Cache read (same eligibility rules as unary) ───────────────
    cache_eligible = (
        user_id is not None
        and not (system_override and system_override.strip())
        and gita_verse is None
    )
    if cache_eligible:
        try:
            from backend.services.kiaan_response_cache import (
                get_response_cache,
            )

            cache = get_response_cache()
            cached_payload = await cache.get(
                user_id=user_id,
                tool_name=tool_name,
                message=message,
                locale=locale,
            )
            if cached_payload is not None:
                # HIT: emit the same protocol as a fresh stream so the
                # client never has to special-case it.
                yield GroundedStreamEvent(
                    kind="verses",
                    data=list(cached_payload.get("verses") or []),
                )
                cached_text = cached_payload.get("text") or ""
                if cached_text:
                    yield GroundedStreamEvent(kind="token", data=cached_text)
                yield GroundedStreamEvent(
                    kind="done",
                    data={
                        "is_gita_grounded": bool(
                            cached_payload.get("is_gita_grounded", True)
                        ),
                        "wisdom_score": float(
                            cached_payload.get("wisdom_score", 1.0)
                        ),
                        "enhancement_applied": bool(
                            cached_payload.get("enhancement_applied", False)
                        ),
                        "filter_applied": bool(
                            cached_payload.get("filter_applied", True)
                        ),
                        "cache_hit": True,
                    },
                )
                return
        except Exception as exc:
            logger.warning(
                "grounded_stream: cache GET failed (tool=%s): %s",
                tool_name,
                exc,
            )

    # ── 1. Pre-LLM compose ───────────────────────────────────────────
    verses: list[dict[str, Any]] = []
    effective_override = system_override
    if db is not None and not (system_override and system_override.strip()):
        try:
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
            logger.warning(
                "grounded_stream: Wisdom Core compose failed "
                "(tool=%s user=%s): %s",
                tool_name,
                user_id,
                exc,
            )

    # Emit the verses immediately so the client can render chips while
    # the LLM is still thinking. Empty list is fine — the client just
    # renders nothing.
    yield GroundedStreamEvent(kind="verses", data=verses)

    # ── 2. + 3. Stream tokens through the streaming Gita filter ──────
    verse_refs: list[str] = []
    for v in verses:
        ref = v.get("verse_ref")
        if ref:
            # The streaming filter wants the "BG <chapter>.<verse>" form
            # to match its citation rules (mirrors voice/orchestrator).
            verse_refs.append(ref if ref.startswith("BG ") else f"BG {ref}")

    from backend.services.gita_wisdom_filter import (
        StreamingFilterVerdict,
        StreamingGitaFilter,
        WisdomTool,
    )

    filter_tool = WisdomTool.GENERAL
    if tool_name:
        mapped = _TOOL_NAME_TO_FILTER_TOOL.get(tool_name)
        if mapped:
            with contextlib.suppress(ValueError):
                filter_tool = WisdomTool(mapped)

    streaming_filter = StreamingGitaFilter(
        tool_type=filter_tool,
        retrieved_verses=verse_refs,
    )

    failure_reason: str | None = None
    fallback_tier: str | None = None

    try:
        async for delta in call_kiaan_ai_stream(
            message=message,
            conversation_history=conversation_history,
            gita_verse=gita_verse,
            tool_name=tool_name,
            system_override=effective_override,
        ):
            result = streaming_filter.feed(delta)
            if result.verdict == StreamingFilterVerdict.FAIL:
                failure_reason = result.failure_reason
                fallback_tier = result.fallback_tier
                break
            for sentence in result.completed_sentences:
                if sentence.strip():
                    yield GroundedStreamEvent(
                        kind="token",
                        data=sentence + " ",
                    )
        # Drain any HOLD sentences remaining in the buffer at stream end.
        if not streaming_filter.is_failed:
            final = streaming_filter.finalize()
            if final.verdict == StreamingFilterVerdict.FAIL:
                failure_reason = final.failure_reason
                fallback_tier = final.fallback_tier
            else:
                for sentence in final.completed_sentences:
                    if sentence.strip():
                        yield GroundedStreamEvent(
                            kind="token",
                            data=sentence + " ",
                        )
    except Exception as exc:
        # Mirror the unary path: filter / streaming errors degrade the
        # response but never block. The SSE route logs the exception.
        # The ``done`` event below reports filter_applied=False so the
        # client can decide how to display the partial response.
        logger.warning(
            "grounded_stream: streaming filter pipeline failed "
            "(tool=%s): %s",
            tool_name,
            exc,
        )
        failure_reason = failure_reason or str(exc)[:200]

    # ── 4. Done ──────────────────────────────────────────────────────
    yield GroundedStreamEvent(
        kind="done",
        data={
            "is_gita_grounded": not streaming_filter.is_failed,
            "wisdom_score": float(streaming_filter.cumulative_score),
            "enhancement_applied": False,  # streaming uses filter, not enhance
            "filter_applied": True,
            "cache_hit": False,
            "failure_reason": failure_reason,
            "fallback_tier": fallback_tier,
        },
    )


__all__ = [
    "GroundedResponse",
    "GroundedStreamEvent",
    "call_kiaan_ai_grounded",
    "call_kiaan_ai_grounded_stream",
    "filter_voice_response",
]
