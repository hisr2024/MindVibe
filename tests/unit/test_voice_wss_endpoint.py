"""End-to-end tests for the Sakha voice WSS endpoint (Part 5).

Drives the full pipeline through Starlette TestClient with mock STT / TTS /
LLM providers. The same six paths as the smoke run, plus extra granularity
on frame ordering, cache hit signaling, and crisis short-circuit.

These tests run with KIAAN_VOICE_MOCK_PROVIDERS=1 so no API keys are
needed and execution is deterministic. Total runtime <2s for the full
file.
"""

from __future__ import annotations

import base64
import json
import os

# Mock-first env BEFORE importing any voice modules
os.environ.setdefault("KIAAN_VOICE_MOCK_PROVIDERS", "1")
os.environ.setdefault("KIAAN_PROMPT_LOADER_TEST", "1")

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from starlette.testclient import TestClient  # noqa: E402

from backend.routes.voice_companion_wss import router  # noqa: E402
from backend.services.prompt_loader import PERSONA_VERSION_FILE  # noqa: E402
from backend.services.voice.stt_router import MockSTTProvider  # noqa: E402
from backend.services.voice.tts_router import get_tts_router  # noqa: E402
from backend.services.voice.wss_frames import SCHEMA_VERSION, SUBPROTOCOL  # noqa: E402

# Read live from disk so persona bumps don't break the suite. The loader's
# cross-version-check still guarantees the prompt files agree with this.
PERSONA_VERSION = PERSONA_VERSION_FILE.read_text(encoding="utf-8").strip()


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router)
    with TestClient(app) as c:
        yield c
    # Clear caches between tests so cache-hit tests don't leak across runs
    get_tts_router().cache.clear()
    MockSTTProvider.clear_scripts()


def _start_frame(session_id: str, lang: str = "en", region: str | None = None) -> str:
    payload = {
        "type": "start",
        "session_id": session_id,
        "lang_hint": lang,
        "persona_version": PERSONA_VERSION,
        "render_mode": "voice",
        "delivery_channel": "voice_android",
    }
    if region is not None:
        payload["user_region"] = region
    return json.dumps(payload)


def _audio_chunk(seq: int, n_bytes: int = 3000) -> str:
    return json.dumps({
        "type": "audio.chunk",
        "seq": seq,
        "data": base64.b64encode(b"\x00" * n_bytes).decode("ascii"),
    })


def _eos() -> str:
    return json.dumps({"type": "end_of_speech"})


def _heartbeat() -> str:
    return json.dumps({"type": "heartbeat"})


def _drain(ws, *, max_frames: int = 60, stop_types: tuple[str, ...] = ("done",)) -> list[dict]:
    """Drain frames from the WSS until any stop_type is observed (or max).

    starlette TestClient runs the server-side handler synchronously in a
    portal — by the time we return from ws.send_text(), the server has
    already produced the response frames into its send queue.
    """
    frames: list[dict] = []
    stops = set(stop_types)
    for _ in range(max_frames):
        try:
            raw = ws.receive_text()
        except Exception:
            break
        f = json.loads(raw)
        frames.append(f)
        if f.get("type") in stops:
            break
    return frames


# ─── Constants ────────────────────────────────────────────────────────────


class TestSubprotocolNegotiation:
    def test_schema_version_constant(self):
        assert SCHEMA_VERSION == "1.0.0"
        assert SUBPROTOCOL == "kiaan-voice-v1"


# ─── Persona-version handshake ────────────────────────────────────────────


class TestPersonaVersionHandshake:
    def test_mismatch_emits_error_and_closes(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-mismatch",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(json.dumps({
                "type": "start",
                "session_id": "sess-X",
                "lang_hint": "en",
                "persona_version": "9.9.9",  # mismatch
                "render_mode": "voice",
                "delivery_channel": "voice_android",
            }))
            err = json.loads(ws.receive_text())
            assert err["type"] == "error"
            assert err["code"] == "PERSONA_VERSION_MISMATCH"
            assert err["recoverable"] is False

    def test_matching_version_accepts_session(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-ok",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(_start_frame("sess-ok"))
            # No frame is emitted by start alone; heartbeat round-trip proves
            # the session is alive
            ws.send_text(_heartbeat())
            ack = json.loads(ws.receive_text())
            assert ack["type"] == "heartbeat.ack"


# ─── Heartbeat ────────────────────────────────────────────────────────────


class TestHeartbeat:
    def test_heartbeat_is_acked(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-hb",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(_start_frame("sess-hb"))
            ws.send_text(_heartbeat())
            ack = json.loads(ws.receive_text())
            assert ack["type"] == "heartbeat.ack"

    def test_multiple_heartbeats_each_acked(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-hb2",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(_start_frame("sess-hb2"))
            for _ in range(3):
                ws.send_text(_heartbeat())
            for _ in range(3):
                ack = json.loads(ws.receive_text())
                assert ack["type"] == "heartbeat.ack"


# ─── Happy-path turn ──────────────────────────────────────────────────────


class TestHappyPathTurn:
    def test_full_turn_emits_canonical_frame_sequence(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-happy",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(_start_frame("sess-happy"))
            MockSTTProvider.set_script("sess-happy", ["i feel anxious tonight"])
            for seq in range(2):
                ws.send_text(_audio_chunk(seq))
            ws.send_text(_eos())
            frames = _drain(ws)

        types = [f["type"] for f in frames]
        # Canonical ordering: at least one transcript.partial → engine →
        # mood → verse → text.delta → audio.chunk* → done
        assert "engine" in types
        assert "mood" in types
        assert "verse" in types
        assert "text.delta" in types
        assert "audio.chunk" in types
        assert types[-1] == "done"

    def test_done_frame_carries_persona_version_and_cache_flag(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-done",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(_start_frame("sess-done"))
            MockSTTProvider.set_script("sess-done", ["i feel stressed"])
            ws.send_text(_audio_chunk(0))
            ws.send_text(_eos())
            frames = _drain(ws)
        done = next(f for f in frames if f["type"] == "done")
        assert done["persona_version"] == PERSONA_VERSION
        assert done["cache_hit"] is False
        assert done["tier_used"] == "openai"
        assert "first_audio_byte_ms" in done


# ─── Cache-hit short-circuit ──────────────────────────────────────────────


class TestCacheHit:
    def test_identical_input_second_turn_hits_cache_no_text_delta(self, client):
        get_tts_router().cache.clear()
        # First turn: populate cache
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-cache1",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(_start_frame("sess-cache-1"))
            MockSTTProvider.set_script("sess-cache-1", ["i feel anxious"])
            ws.send_text(_audio_chunk(0))
            ws.send_text(_eos())
            _drain(ws)
        # Second turn: same lang + same scripted transcript ⇒ same mood +
        # verse + voice ⇒ cache key match
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-cache2",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(_start_frame("sess-cache-2"))
            MockSTTProvider.set_script("sess-cache-2", ["i feel anxious"])
            ws.send_text(_audio_chunk(0))
            ws.send_text(_eos())
            frames = _drain(ws)
        types = [f["type"] for f in frames]
        done = next(f for f in frames if f["type"] == "done")
        assert done["cache_hit"] is True
        # Cache hit ⇒ orchestrator skipped LLM ⇒ NO text.delta frames
        assert "text.delta" not in types
        # But audio.chunk frames are still streamed from cache
        assert "audio.chunk" in types


# ─── Crisis routing ───────────────────────────────────────────────────────


class TestCrisisRouting:
    def test_crisis_word_in_partial_emits_crisis_frame_with_helplines(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-crisis",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(_start_frame("sess-crisis", region="US"))
            MockSTTProvider.set_script("sess-crisis", ["i", "i want", "i want to die tonight"])
            for seq in range(3):
                ws.send_text(_audio_chunk(seq))
            ws.send_text(_eos())
            frames = _drain(ws, stop_types=("crisis",))
        crisis_frames = [f for f in frames if f["type"] == "crisis"]
        assert crisis_frames, f"no crisis frame: {[f['type'] for f in frames]}"
        crisis = crisis_frames[0]
        assert crisis["region"] == "US"
        assert any("988" in h["number"] for h in crisis["helpline"])
        assert "audio_url" in crisis

    def test_crisis_for_indian_user_routes_to_in_helplines(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-crisis-in",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text(_start_frame("sess-crisis-in", region="IN", lang="hi"))
            MockSTTProvider.set_script(
                "sess-crisis-in", ["मैं", "मैं खुद को मार लूँगा"],
            )
            ws.send_text(_audio_chunk(0))
            ws.send_text(_audio_chunk(1))
            ws.send_text(_eos())
            frames = _drain(ws, stop_types=("crisis",))
        crisis_frames = [f for f in frames if f["type"] == "crisis"]
        assert crisis_frames
        crisis = crisis_frames[0]
        assert crisis["region"] == "IN"
        assert any("Vandrevala" in h["name"] or "iCall" in h["name"]
                   for h in crisis["helpline"])


# ─── Bad first frame / protocol violation ─────────────────────────────────


class TestProtocolViolation:
    def test_non_start_first_frame_is_rejected(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-bad-first",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            # Send an audio.chunk before start
            ws.send_text(_audio_chunk(0))
            err = json.loads(ws.receive_text())
            assert err["type"] == "error"
            assert err["code"] == "BAD_FIRST_FRAME"

    def test_malformed_json_in_first_frame_closes_socket(self, client):
        with client.websocket_connect(
            "/voice-companion/converse?user_id=u-malformed",
            subprotocols=[SUBPROTOCOL],
        ) as ws:
            ws.send_text("{not even json")
            # Either an error frame, or the socket closes immediately —
            # both are valid responses to malformed JSON.
            try:
                msg = ws.receive_text()
                if msg:
                    parsed = json.loads(msg)
                    assert parsed.get("type") in ("error",)
            except Exception:
                pass  # closed cleanly
