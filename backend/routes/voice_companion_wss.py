"""WebSocket endpoint for the Sakha Voice Companion.

Route: WS /voice-companion/converse
Subprotocol: kiaan-voice-v1

Lifecycle of one session:

  1. Client opens WSS with `Sec-WebSocket-Protocol: kiaan-voice-v1`.
     If the subprotocol header is missing the handler closes with code 1002.

  2. Server expects ClientStartFrame as the FIRST message. Validates:
       • persona_version matches what the server has loaded (else error 4001)
       • render_mode == "voice" or "text"
       • lang_hint length OK
     Then constructs a CrisisPartialScanner and STT provider for the session.

  3. Loop:
       • audio.chunk      → forward to STT provider, emit transcript.partial
                            frames, run crisis scanner on each partial
       • end_of_speech    → close STT input, take the is_final transcript,
                            run VoiceCompanionOrchestrator.run_turn(); stream
                            orchestrator's frames out the socket
       • interrupt        → set cancel_event so orchestrator exits; send
                            ServerHeartbeatAckFrame so client can resume
                            recording
       • heartbeat        → emit ServerHeartbeatAckFrame
       • CrisisHit (any)  → emit ServerCrisisFrame, cancel orchestrator,
                            keep socket open for one more send then close

  4. After the turn completes, record per-turn telemetry to
     dynamic_wisdom_corpus (delivery_channel + voice_specific_outcomes).

  5. Loop accepts another turn (same WSS session) until the client closes.

The handler is intentionally thin — all "what Sakha says" lives in the
orchestrator. This file just owns the I/O lifecycle.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
from typing import Any

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from backend.services.crisis_partial_scanner import CrisisPartialScanner
from backend.services.prompt_loader import (
    PromptLoaderError,
    get_persona_version,
    get_prompt_text,
)
from backend.services.voice.orchestrator import VoiceCompanionOrchestrator
from backend.services.voice.orchestrator_types import (
    VoiceTurnContext,
    VoiceTurnResult,
)
from backend.services.voice.stt_router import STTResult, get_stt_router
from backend.services.voice.wss_frames import (
    SUBPROTOCOL,
    ClientAudioChunkFrame,
    ClientEndOfSpeechFrame,
    ClientHeartbeatFrame,
    ClientInterruptFrame,
    ClientStartFrame,
    ServerErrorFrame,
    ServerFrame,
    ServerHeartbeatAckFrame,
    ServerTranscriptPartialFrame,
    parse_client_frame,
    serialize_frame,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── WSS-level error codes ────────────────────────────────────────────────
# Application close codes live in the 4000-4999 range per RFC 6455.

WSS_CLOSE_BAD_SUBPROTOCOL = 1002        # protocol error (standard)
WSS_CLOSE_PERSONA_MISMATCH = 4001       # client's persona_version != server's
WSS_CLOSE_BAD_FIRST_FRAME = 4002        # didn't receive a start frame first
WSS_CLOSE_PROTOCOL_VIOLATION = 4003     # malformed frame mid-session
WSS_CLOSE_INTERNAL = 4500               # server-side bug surfaced to client


# ─── Per-session state ────────────────────────────────────────────────────


class _Session:
    """Holds the per-session pieces that span turns: STT provider, crisis
    scanner, conversation_id counter. Re-built per turn: orchestrator,
    cancel_event, send-queue."""

    def __init__(self, start: ClientStartFrame, user_id: str) -> None:
        self.start = start
        self.user_id = user_id
        self.session_id = start.session_id
        self.lang_hint = start.lang_hint
        self.region = start.user_region or "GLOBAL"
        self.persona_version = start.persona_version
        self.render_mode = start.render_mode
        self.delivery_channel = start.delivery_channel
        self.turn_index = 0
        # Per-session, NOT per-turn — a crisis hit at any point in the
        # session latches and short-circuits future scans.
        self.crisis_scanner: CrisisPartialScanner | None = None
        # Built lazily on first audio.chunk
        self._stt_provider: Any | None = None
        self._stt_decision: Any | None = None

    async def ensure_stt(self) -> Any:
        if self._stt_provider is None:
            router = get_stt_router()
            self._stt_provider, self._stt_decision = router.build_provider(
                self.lang_hint
            )
            await self._stt_provider.start_session(
                session_id=self.session_id, lang_hint=self.lang_hint,
            )
            logger.info(
                "voice.session stt provider=%s reason=%s",
                self._stt_decision.provider_name,
                self._stt_decision.reason,
            )
        return self._stt_provider

    async def close_stt(self) -> None:
        if self._stt_provider is not None:
            with contextlib.suppress(Exception):
                await self._stt_provider.close()
            self._stt_provider = None


# ─── Telemetry recording ──────────────────────────────────────────────────


async def _record_turn_telemetry(
    *,
    session: _Session,
    result: VoiceTurnResult,
    db: Any | None,
) -> None:
    """Call dynamic_wisdom_corpus to record this voice turn's delivery +
    outcome. Wrapped in try/except because telemetry must never crash the
    WSS handler — a stuck buffer is recoverable, a crashed socket is not.

    Skipped entirely when db is None (CI / dev without DB).
    """
    if db is None or not result.verse_refs:
        return
    try:
        from backend.services.dynamic_wisdom_corpus import (
            get_dynamic_wisdom_corpus,
        )
        corpus = get_dynamic_wisdom_corpus()
        # Record one delivery per retrieved verse the user actually heard.
        # In tier-3/tier-4 fallback we only deliver the first verse.
        verses_delivered = (
            result.verse_refs[:1]
            if result.tier_used in ("template", "verse_only")
            else result.verse_refs
        )
        for ref in verses_delivered:
            await corpus.record_wisdom_delivery(
                db=db,
                user_id=session.user_id,
                session_id=session.session_id,
                verse_ref=ref,
                principle=None,
                mood=result.mood_label,
                mood_intensity=result.mood_intensity,
                phase="voice_turn",
                theme=None,
                delivery_channel=session.delivery_channel,
            )
        # Outcome: completed_listening = True iff no interrupt and no crisis
        # and audio chunks were emitted.
        completed_listening = (
            not result.interrupted
            and not result.crisis_triggered
            and result.audio_chunks_emitted > 0
        )
        await corpus.record_wisdom_outcome(
            db=db,
            user_id=session.user_id,
            session_id=session.session_id,
            mood_after=result.mood_label,  # we lack the next-turn mood here
            user_response=None,
            session_continued=result.completed and not result.crisis_triggered,
            voice_specific_outcomes=result.to_voice_specific_outcomes(
                completed_listening=completed_listening,
            ),
        )
    except Exception as e:  # noqa: BLE001
        logger.warning("voice.telemetry record failed: %s", e)


# ─── Frame send helpers ───────────────────────────────────────────────────


async def _send_frame(ws: WebSocket, frame: ServerFrame) -> None:
    """Serialize and send a server frame. Catches WS-closed errors so a
    background task that finishes after the socket closes doesn't crash."""
    with contextlib.suppress(RuntimeError, WebSocketDisconnect):
        await ws.send_text(serialize_frame(frame))


async def _send_error(ws: WebSocket, code: str, message: str, *, recoverable: bool = True) -> None:
    await _send_frame(
        ws,
        ServerErrorFrame(code=code, message=message[:200], recoverable=recoverable),
    )


# ─── Audio intake task ────────────────────────────────────────────────────


async def _audio_intake_loop(
    ws: WebSocket,
    session: _Session,
    *,
    eos_event: asyncio.Event,
    interrupt_event: asyncio.Event,
    crisis_event: asyncio.Event,
    final_transcript_box: list[str | None],
) -> None:
    """Reads ClientAudioChunk / EndOfSpeech / Interrupt / Heartbeat frames
    until end_of_speech or interrupt or crisis.

    On every transcript.partial:
      • emit a ServerTranscriptPartialFrame
      • feed it to the crisis scanner; on hit, emit ServerCrisisFrame
        and set crisis_event so the orchestrator can be cancelled

    Final transcript text is written into final_transcript_box[0] so the
    caller can pick it up after eos_event fires.
    """
    final_transcript_box[0] = None

    while not eos_event.is_set() and not interrupt_event.is_set() and not crisis_event.is_set():
        try:
            raw = await ws.receive_text()
        except WebSocketDisconnect:
            interrupt_event.set()
            return
        except RuntimeError as e:
            # Starlette raises RuntimeError after a disconnect message is
            # consumed by an earlier receive — treat as clean disconnect.
            if "disconnect" in str(e).lower():
                interrupt_event.set()
                return
            raise
        try:
            frame = parse_client_frame(raw)
        except ValidationError as e:
            await _send_error(ws, "BAD_FRAME", f"client frame failed validation: {e.errors()[:1]}")
            continue

        if isinstance(frame, ClientHeartbeatFrame):
            await _send_frame(ws, ServerHeartbeatAckFrame())
            continue

        if isinstance(frame, ClientInterruptFrame):
            interrupt_event.set()
            return

        if isinstance(frame, ClientEndOfSpeechFrame):
            eos_event.set()
            stt = await session.ensure_stt()
            with contextlib.suppress(Exception):
                async for ev in stt.end_of_speech():
                    await _emit_partial_and_scan(
                        ws, session, ev, crisis_event=crisis_event,
                    )
                    if ev.is_final:
                        final_transcript_box[0] = ev.text
            return

        if isinstance(frame, ClientAudioChunkFrame):
            stt = await session.ensure_stt()
            with contextlib.suppress(Exception):
                async for ev in stt.feed_audio_chunk(seq=frame.seq, opus_b64=frame.data):
                    await _emit_partial_and_scan(
                        ws, session, ev, crisis_event=crisis_event,
                    )
            continue

        # ClientStartFrame mid-session → protocol violation
        await _send_error(
            ws,
            "PROTOCOL_VIOLATION",
            f"unexpected mid-session frame {type(frame).__name__}",
            recoverable=False,
        )
        return


async def _emit_partial_and_scan(
    ws: WebSocket,
    session: _Session,
    event: STTResult,
    *,
    crisis_event: asyncio.Event,
) -> None:
    """Emit the transcript.partial frame and feed text to crisis scanner."""
    await _send_frame(
        ws,
        ServerTranscriptPartialFrame(
            text=event.text, is_final=event.is_final, seq=event.seq,
        ),
    )
    if session.crisis_scanner is None:
        return
    hit = session.crisis_scanner.scan(event.text, seq=event.seq)
    if hit is not None:
        crisis_event.set()
        crisis_frame = VoiceCompanionOrchestrator.crisis_frame_from_hit(hit)
        await _send_frame(ws, crisis_frame)


# ─── Orchestrator dispatch ────────────────────────────────────────────────


async def _run_orchestrator_turn(
    ws: WebSocket,
    session: _Session,
    *,
    user_latest: str,
    cancel_event: asyncio.Event,
    db: Any | None,
) -> VoiceTurnResult | None:
    """Run one orchestrator turn, forwarding every frame to the WSS.
    Returns the VoiceTurnResult yielded at the end (None if the orchestrator
    failed catastrophically before producing one)."""
    session.turn_index += 1
    ctx = VoiceTurnContext(
        session_id=session.session_id,
        user_id=session.user_id,
        conversation_id=f"{session.session_id}:turn:{session.turn_index}",
        user_latest=user_latest,
        lang_hint=session.lang_hint,
        render_mode=session.render_mode,
        delivery_channel=session.delivery_channel,
        user_region=session.region,
        persona_version=session.persona_version,
    )
    try:
        sys_prompt = get_prompt_text(session.render_mode)
    except PromptLoaderError as e:
        await _send_error(ws, "PROMPT_LOAD_FAILED", str(e), recoverable=False)
        return None

    orchestrator = VoiceCompanionOrchestrator()
    result: VoiceTurnResult | None = None
    try:
        async for item in orchestrator.run_turn(
            ctx,
            system_prompt=sys_prompt,
            db=db,
            cancel_event=cancel_event,
        ):
            if isinstance(item, VoiceTurnResult):
                result = item
            else:
                await _send_frame(ws, item)
    except Exception as e:  # noqa: BLE001
        logger.exception("voice.orchestrator failed: %s", e)
        await _send_error(ws, "ORCHESTRATOR_ERROR", str(e), recoverable=False)
    return result


# ─── Main WSS endpoint ────────────────────────────────────────────────────


@router.websocket("/voice-companion/converse")
async def voice_companion_converse(
    ws: WebSocket,
    user_id: str = Query(default="anonymous", min_length=1, max_length=128),
) -> None:
    """Sakha voice WSS endpoint.

    Auth: the production wiring (Part 6) replaces the `user_id` query
    parameter with a JWT-extracted user_id via the existing FastAPI
    dependency injection. For now we keep it simple — the integration
    test in Part 5f drives this with explicit user_id.
    """
    # Subprotocol negotiation
    requested = ws.headers.get("sec-websocket-protocol", "")
    requested_protocols = {p.strip() for p in requested.split(",") if p.strip()}
    if SUBPROTOCOL not in requested_protocols:
        await ws.close(code=WSS_CLOSE_BAD_SUBPROTOCOL)
        return
    await ws.accept(subprotocol=SUBPROTOCOL)

    session: _Session | None = None
    try:
        # ── Step 1: receive ClientStartFrame ───────────────────────
        try:
            raw = await ws.receive_text()
            first_frame = parse_client_frame(raw)
        except (ValidationError, WebSocketDisconnect):
            await ws.close(code=WSS_CLOSE_BAD_FIRST_FRAME)
            return

        if not isinstance(first_frame, ClientStartFrame):
            await _send_error(
                ws,
                "BAD_FIRST_FRAME",
                f"expected ClientStartFrame, got {type(first_frame).__name__}",
                recoverable=False,
            )
            await ws.close(code=WSS_CLOSE_BAD_FIRST_FRAME)
            return

        # Persona-version cross-check
        try:
            server_version = get_persona_version()
        except PromptLoaderError as e:
            await _send_error(ws, "PERSONA_LOAD_FAILED", str(e), recoverable=False)
            await ws.close(code=WSS_CLOSE_INTERNAL)
            return

        if first_frame.persona_version != server_version:
            await _send_error(
                ws,
                "PERSONA_VERSION_MISMATCH",
                f"client {first_frame.persona_version!r} != server {server_version!r}; "
                f"please update the app",
                recoverable=False,
            )
            await ws.close(code=WSS_CLOSE_PERSONA_MISMATCH)
            return

        session = _Session(start=first_frame, user_id=user_id)
        session.crisis_scanner = VoiceCompanionOrchestrator.build_crisis_scanner(
            VoiceTurnContext(
                session_id=session.session_id,
                user_id=user_id,
                conversation_id=f"{session.session_id}:turn:0",
                user_latest="",
                lang_hint=session.lang_hint,
                user_region=session.region,
            )
        )
        logger.info(
            "voice.session start session_id=%s user=%s lang=%s persona=%s",
            session.session_id, user_id, session.lang_hint, session.persona_version,
        )

        # ── Step 2: turn loop ──────────────────────────────────────
        while True:
            eos_event = asyncio.Event()
            interrupt_event = asyncio.Event()
            crisis_event = asyncio.Event()
            final_transcript: list[str | None] = [None]

            # Audio intake runs until end_of_speech or interrupt or crisis
            await _audio_intake_loop(
                ws, session,
                eos_event=eos_event,
                interrupt_event=interrupt_event,
                crisis_event=crisis_event,
                final_transcript_box=final_transcript,
            )

            if crisis_event.is_set():
                # Crisis frame already sent inside _audio_intake_loop. Hold
                # the connection open briefly so the client can read the
                # frame, then close cleanly.
                await asyncio.sleep(0.1)
                break

            if interrupt_event.is_set():
                # Mid-recording interrupt before any speech ended — just ack
                # and loop back to wait for the next turn.
                await _send_frame(ws, ServerHeartbeatAckFrame())
                continue

            if not final_transcript[0]:
                # No transcript captured — likely a network blip. Send error
                # and loop.
                await _send_error(ws, "NO_TRANSCRIPT", "end_of_speech with empty transcript")
                continue

            # ── Step 3: run orchestrator turn ──────────────────────
            cancel_event = asyncio.Event()
            orch_task = asyncio.create_task(
                _run_orchestrator_turn(
                    ws, session,
                    user_latest=final_transcript[0],
                    cancel_event=cancel_event,
                    db=None,  # production wires DB via FastAPI Depends
                )
            )

            # Listen for client interrupt frames in parallel
            interrupt_listener = asyncio.create_task(
                _listen_for_interrupt(ws, cancel_event, orch_task)
            )

            try:
                result = await orch_task
            finally:
                interrupt_listener.cancel()
                with contextlib.suppress(asyncio.CancelledError, Exception):
                    await interrupt_listener

            if result is not None:
                await _record_turn_telemetry(session=session, result=result, db=None)

            # Loop back for the next turn on the same WSS session
            continue

    except WebSocketDisconnect:
        pass
    except RuntimeError as e:
        # Starlette raises RuntimeError("Cannot call 'receive' once a
        # disconnect message has been received") when the client closes
        # mid-loop. That's a normal disconnect, not an internal error.
        if "disconnect" in str(e).lower():
            logger.debug("voice.session client disconnected: %s", e)
        else:
            logger.exception("voice.session unexpected runtime error: %s", e)
            with contextlib.suppress(Exception):
                await _send_error(ws, "INTERNAL_ERROR", str(e), recoverable=False)
                await ws.close(code=WSS_CLOSE_INTERNAL)
    except Exception as e:  # noqa: BLE001
        logger.exception("voice.session unexpected error: %s", e)
        with contextlib.suppress(Exception):
            await _send_error(ws, "INTERNAL_ERROR", str(e), recoverable=False)
            await ws.close(code=WSS_CLOSE_INTERNAL)
    finally:
        if session is not None:
            await session.close_stt()
        with contextlib.suppress(Exception):
            await ws.close()
        if session is not None:
            logger.info(
                "voice.session end session_id=%s turns=%d",
                session.session_id, session.turn_index,
            )


async def _listen_for_interrupt(
    ws: WebSocket,
    cancel_event: asyncio.Event,
    orch_task: asyncio.Task,
) -> None:
    """While the orchestrator is producing output, read frames from the
    client looking for ClientInterruptFrame or ClientHeartbeatFrame.

    On interrupt: set cancel_event so the orchestrator exits cleanly.
    Heartbeats get acked. Other frames mid-orchestration are protocol
    violations but we tolerate them rather than tearing down the session.
    """
    try:
        while not orch_task.done():
            try:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=0.05)
            except TimeoutError:
                continue
            except WebSocketDisconnect:
                cancel_event.set()
                return
            try:
                frame = parse_client_frame(raw)
            except ValidationError:
                continue
            if isinstance(frame, ClientInterruptFrame):
                cancel_event.set()
                return
            if isinstance(frame, ClientHeartbeatFrame):
                await _send_frame(ws, ServerHeartbeatAckFrame())
                continue
            # audio.chunk frames during orchestrator playback are valid in
            # half-duplex mode (the client may be detecting barge-in audio
            # before sending interrupt); drop silently.
    except asyncio.CancelledError:
        pass


__all__ = ["router", "voice_companion_converse"]
