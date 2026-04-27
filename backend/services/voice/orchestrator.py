"""VoiceCompanionOrchestrator — per-turn coordinator for the WSS endpoint.

This module orchestrates one Sakha voice turn from STT-final to ServerDoneFrame.
The WSS handler in backend/api/voice_companion.py owns the WebSocket; the
orchestrator owns the *logic* of one turn.

The pipeline (happy path):

  1. Build VoiceTurnContext from ClientStartFrame + STT final transcript
  2. Detect mood + route engine + retrieve verses (in parallel where possible)
  3. Emit `engine`, `mood`, `verse` frames so the UI can update before audio
  4. Cache lookup on (verse_refs + mood + render_mode + lang + voice_id +
     persona_version). HIT → stream cached audio frames + done. MISS → step 5.
  5. Stream LLM deltas through StreamingGitaFilter sentence by sentence.
     For each PASS sentence, hand to TTS and emit `text.delta` + `audio.chunk`
     frames. Track first_audio_byte_ms for telemetry.
  6. Emit `done` frame with telemetry summary.

This file holds only the happy path; 5d.5 adds crisis/filter-fail/interrupt
branching.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from collections.abc import AsyncIterator
from typing import Any

from backend.services.crisis_partial_scanner import (
    CrisisPartialScanner,
    get_scanner_for_session,
)
from backend.services.gita_wisdom_filter import (
    StreamingFilterVerdict,
    StreamingGitaFilter,
)
from backend.services.kiaan_engine_router import EngineType, get_engine_router
from backend.services.voice.llm_provider import LLMRouter, get_llm_router
from backend.services.voice.orchestrator_types import (
    VoiceTurnContext,
    VoiceTurnResult,
)
from backend.services.voice.retrieval_and_fallback import (
    RetrievedVerse,
    retrieve_verses_for_turn,
    tier_3_template,
    tier_4_verse_only,
)
from backend.services.voice.tts_router import (
    TTSChunk,
    TTSRouter,
    get_tts_router,
)
from backend.services.voice.wss_frames import (
    HelplineEntry,
    ServerAudioChunkFrame,
    ServerCrisisFrame,
    ServerDoneFrame,
    ServerEngineFrame,
    ServerErrorFrame,
    ServerFilterFailedFrame,
    ServerFrame,
    ServerMoodFrame,
    ServerTextDeltaFrame,
    ServerVerseFrame,
)

logger = logging.getLogger(__name__)


# ─── Mood detection (lightweight — uses the existing engine router signal) ─


def _detect_mood(user_message: str) -> tuple[str, float, str]:
    """Quick mood detection.

    The existing engine router already runs sentiment/keyword analysis; we
    re-use its emotion taxonomy and add an intensity heuristic. Returns
    (label, intensity, trend). Trend is "rising" by default in voice mode
    because we lack history; the WSS handler can override with the
    profile's mood-trend feed in production.
    """
    router = get_engine_router()
    decision = router.route(user_message)
    label = decision.detected_emotion or "neutral"
    # Intensity: high if crisis/strong emotion words, mid otherwise
    msg_lower = user_message.lower()
    strong = any(w in msg_lower for w in (
        "really", "very", "so ", "extremely", "can't", "cannot",
    ))
    intensity = 0.75 if strong else (0.55 if decision.detected_emotion else 0.35)
    trend = "rising" if intensity > 0.6 else "steady"
    return label, intensity, trend


# ─── Engine routing for voice mode ────────────────────────────────────────


def _route_engine(user_message: str) -> str:
    """Pick the engine in voice mode. Wraps EngineRouter.route(voice_mode=True)
    and returns just the engine name string for prompt + frame use."""
    router = get_engine_router()
    decision = router.route(user_message, voice_mode=True)
    primary: EngineType = decision.primary_engine
    return primary.value.upper()


# ─── Orchestrator ─────────────────────────────────────────────────────────


class VoiceCompanionOrchestrator:
    """Per-WSS-handler orchestrator. Stateless across turns — each call to
    run_turn() is fully self-contained so the same orchestrator can serve
    multiple turns in a session."""

    def __init__(
        self,
        *,
        tts_router: TTSRouter | None = None,
        llm_router: LLMRouter | None = None,
    ) -> None:
        self._tts = tts_router or get_tts_router()
        self._llm = llm_router or get_llm_router()

    # ─── Crisis scanning (WSS handler calls this on every partial) ────
    @staticmethod
    def build_crisis_scanner(
        ctx: VoiceTurnContext,
    ) -> CrisisPartialScanner:
        """Construct a fresh scanner for a session. The WSS handler holds
        the scanner across partials and calls scan() on each one."""
        return get_scanner_for_session(
            ctx.session_id, region=ctx.user_region, language=ctx.lang_hint,
        )

    @staticmethod
    def crisis_frame_from_hit(hit) -> ServerCrisisFrame:
        """Build the WSS crisis frame from a CrisisHit. Used by the WSS
        handler to short-circuit the pipeline when a partial transcript
        triggers the scanner."""
        return ServerCrisisFrame(
            incident_id=hit.incident_id,
            helpline=[HelplineEntry(**h) for h in hit.helplines],
            audio_url=hit.audio_url,
            region=hit.region,
            language=hit.language,
        )

    async def run_turn(
        self,
        ctx: VoiceTurnContext,
        *,
        system_prompt: str,
        db: Any | None = None,
        cancel_event: asyncio.Event | None = None,
    ) -> AsyncIterator[ServerFrame | VoiceTurnResult]:
        """Run one Sakha turn. Yields ServerFrame objects to send out the
        WSS, then a final VoiceTurnResult (NOT a frame — the handler uses
        it to record telemetry).

        Args:
            cancel_event: optional asyncio.Event the WSS handler sets when
                the user barge-ins. The orchestrator polls this between
                sentences and exits cleanly (interrupted=True in result)
                without leaking the in-flight LLM/TTS streams.
        """
        turn_started = time.monotonic()
        if cancel_event is None:
            cancel_event = asyncio.Event()

        try:
            mood_label, mood_intensity, mood_trend = _detect_mood(ctx.user_latest)
            engine = _route_engine(ctx.user_latest)

            verses: list[RetrievedVerse] = await retrieve_verses_for_turn(
                mood_label=mood_label,
                engine=engine,
                user_message=ctx.user_latest,
                user_id=ctx.user_id,
                db=db,
            )

            yield ServerEngineFrame(selected=engine)  # type: ignore[arg-type]
            yield ServerMoodFrame(
                label=mood_label,
                intensity=mood_intensity,
                trend=mood_trend,
            )
            for v in verses:
                yield ServerVerseFrame(
                    chapter=v.chapter,
                    verse=v.verse,
                    text_sa=v.sanskrit,
                    text_en=v.english,
                    text_hi=v.hindi,
                    citation=v.ref,
                )

            verse_refs = [v.ref for v in verses]

            # Cache lookup before LLM call. Hit ⇒ stream cached audio,
            # skip LLM + filter + TTS synth entirely.
            cached_chunks, cache_hit, tts_decision = await self._tts.synthesize_with_cache(
                text="",  # placeholder; only used on miss path below
                lang_hint=ctx.lang_hint,
                verse_refs=verse_refs,
                mood_label=mood_label,
                render_mode=ctx.render_mode,
                persona_version=ctx.persona_version,
            ) if False else (None, False, self._tts.decide(ctx.lang_hint))
            # We can't use synthesize_with_cache without a text yet — manually
            # check the cache, then either stream cached chunks OR run the
            # LLM and synthesize fresh.
            from backend.services.voice.tts_router import AudioCache
            cache_key = AudioCache.build_key(
                verse_refs=verse_refs,
                mood_label=mood_label,
                render_mode=ctx.render_mode,
                lang_hint=ctx.lang_hint,
                voice_id=tts_decision.voice_id,
                persona_version=ctx.persona_version,
            )
            cached_chunks = self._tts.cache.get(cache_key)

            first_byte_ms: int | None = None
            sentences_emitted = 0
            audio_chunks_emitted = 0
            tier_used = "openai"
            filter_pass_rate = 1.0
            interrupted = False

            if cached_chunks is not None:
                # ── Cache hit: stream cached chunks immediately ──
                cache_hit = True
                logger.info(
                    "voice.orchestrator cache HIT key=%s chunks=%d",
                    cache_key[:12], len(cached_chunks),
                )
                for chunk in cached_chunks:
                    if first_byte_ms is None:
                        first_byte_ms = int(
                            (time.monotonic() - turn_started) * 1000
                        )
                    yield ServerAudioChunkFrame(
                        seq=chunk.seq,
                        mime=chunk.mime,  # type: ignore[arg-type]
                        data=base64.b64encode(chunk.data).decode("ascii"),
                    )
                    audio_chunks_emitted += 1
            else:
                # ── Cache miss: LLM stream → filter → TTS sentence by sentence ──
                user_payload = json.dumps({
                    "persona_version": ctx.persona_version,
                    "render_mode": ctx.render_mode,
                    "delivery_channel": ctx.delivery_channel,
                    "lang_hint": ctx.lang_hint,
                    "user_latest": ctx.user_latest,
                    "history": ctx.history,
                    "mood": {
                        "label": mood_label,
                        "intensity": mood_intensity,
                        "trend": mood_trend,
                    },
                    "engine": engine,
                    "voice_target_duration_sec": (
                        45 if engine == "GUIDANCE" else 30
                    ),
                    "retrieved_verses": [v.to_prompt_dict() for v in verses],
                }, ensure_ascii=False)

                provider, _ = self._llm.build_provider()
                streaming_filter = StreamingGitaFilter(
                    retrieved_verses=verse_refs
                )
                full_response_text: list[str] = []
                accumulated_chunks: list[TTSChunk] = []

                fallback_tier: str | None = None
                fail_reason: str | None = None

                async for delta in provider.stream(
                    system_prompt=system_prompt,
                    user_payload_json=user_payload,
                    model="gpt-4o-mini",
                ):
                    # Check for barge-in between deltas — exit cleanly
                    if cancel_event.is_set():
                        interrupted = True
                        break

                    if not delta.is_final:
                        full_response_text.append(delta.content)
                        result = streaming_filter.feed(delta.content)
                    else:
                        result = streaming_filter.finalize()

                    if result.verdict == StreamingFilterVerdict.FAIL:
                        # Filter rejected — mark for fallback path below.
                        # Don't yield ServerErrorFrame here; the user
                        # should never see "filter failed" as a hard error
                        # — they should hear the fallback audio seamlessly.
                        fallback_tier = result.fallback_tier or "verse_only"
                        fail_reason = result.failure_reason or "filter rejected"
                        filter_pass_rate = 0.0
                        break

                    # PASS or HOLD: stream completed sentences
                    for sentence in result.completed_sentences:
                        if cancel_event.is_set():
                            interrupted = True
                            break

                        # 1. Emit the text delta
                        yield ServerTextDeltaFrame(content=sentence)
                        sentences_emitted += 1

                        # 2. Synthesize that sentence
                        tts_provider, _ = self._tts.build_provider(ctx.lang_hint)
                        async for chunk in tts_provider.synthesize_streaming(
                            text=sentence,
                            voice_id=tts_decision.voice_id,
                            lang_hint=ctx.lang_hint,
                        ):
                            if first_byte_ms is None:
                                first_byte_ms = int(
                                    (time.monotonic() - turn_started) * 1000
                                )
                            accumulated_chunks.append(chunk)
                            yield ServerAudioChunkFrame(
                                seq=audio_chunks_emitted,
                                mime=chunk.mime,  # type: ignore[arg-type]
                                data=base64.b64encode(chunk.data).decode("ascii"),
                            )
                            audio_chunks_emitted += 1
                    if interrupted:
                        break

                # ── Filter rejected? Fall back to Tier-3 or Tier-4 ──
                if fallback_tier is not None and not interrupted and verses:
                    yield ServerFilterFailedFrame(
                        reason=fail_reason or "filter rejected",
                        falling_back_to=fallback_tier,  # type: ignore[arg-type]
                    )
                    fallback_text = (
                        tier_3_template(
                            engine=engine,
                            mood_label=mood_label,
                            verse=verses[0],
                        )
                        if fallback_tier == "template"
                        else tier_4_verse_only(verse=verses[0])
                    )
                    tier_used = fallback_tier  # noqa: F841 — assigned for telemetry below
                    yield ServerTextDeltaFrame(content=fallback_text)
                    sentences_emitted += 1
                    fb_tts_provider, _ = self._tts.build_provider(ctx.lang_hint)
                    accumulated_chunks = []  # don't cache failed-LLM audio
                    async for chunk in fb_tts_provider.synthesize_streaming(
                        text=fallback_text,
                        voice_id=tts_decision.voice_id,
                        lang_hint=ctx.lang_hint,
                    ):
                        if first_byte_ms is None:
                            first_byte_ms = int(
                                (time.monotonic() - turn_started) * 1000
                            )
                        yield ServerAudioChunkFrame(
                            seq=audio_chunks_emitted,
                            mime=chunk.mime,  # type: ignore[arg-type]
                            data=base64.b64encode(chunk.data).decode("ascii"),
                        )
                        audio_chunks_emitted += 1
                    tier_used = fallback_tier
                elif fallback_tier is not None:
                    # Filter failed AND interrupted — just propagate
                    tier_used = fallback_tier

                # If filter passed, cache the synthesized audio so future
                # turns with the same (verses, mood, lang, voice, persona)
                # short-circuit straight to cache hit.
                if (
                    streaming_filter.cumulative_score
                    >= StreamingGitaFilter.PASS_THRESHOLD
                    and accumulated_chunks
                    and tier_used == "openai"
                ):
                    self._tts.cache.put(
                        cache_key,
                        accumulated_chunks,
                        persona_version=ctx.persona_version,
                    )

            total_ms = int((time.monotonic() - turn_started) * 1000)

            # Don't emit a Done frame on interrupt — the WSS handler will
            # send its own ack frame in response to ClientInterruptFrame so
            # the client doesn't treat the turn as completed.
            if not interrupted:
                yield ServerDoneFrame(
                    conversation_id=ctx.conversation_id,
                    total_ms=total_ms,
                    cache_hit=cache_hit,
                    persona_version=ctx.persona_version,
                    tier_used=tier_used,  # type: ignore[arg-type]
                    first_audio_byte_ms=first_byte_ms,
                )

            # Final: yield the result so the WSS handler can record telemetry.
            yield VoiceTurnResult(
                conversation_id=ctx.conversation_id,
                completed=not interrupted,
                crisis_triggered=False,
                interrupted=interrupted,
                cache_hit=cache_hit,
                tier_used=tier_used,  # type: ignore[arg-type]
                persona_version=ctx.persona_version,
                engine_selected=engine,
                mood_label=mood_label,
                mood_intensity=mood_intensity,
                mood_trend=mood_trend,
                verse_refs=verse_refs,
                first_audio_byte_ms=first_byte_ms,
                total_ms=total_ms,
                sentences_emitted=sentences_emitted,
                audio_chunks_emitted=audio_chunks_emitted,
                filter_pass_rate=filter_pass_rate,
                barge_in_at_token_index=audio_chunks_emitted if interrupted else None,
            )

        except asyncio.CancelledError:
            # WSS handler cancelled the turn (e.g. socket closed). Re-raise.
            raise
        except Exception as e:
            logger.exception("voice.orchestrator unexpected error: %s", e)
            yield ServerErrorFrame(
                code="ORCHESTRATOR_ERROR",
                message=str(e)[:200],
                recoverable=False,
            )


__all__ = ["VoiceCompanionOrchestrator"]
