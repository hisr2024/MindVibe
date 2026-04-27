"""WSS frame protocol for /voice-companion/converse (subprotocol kiaan-voice-v1).

Spec: every WebSocket frame between the Sakha mobile client and the backend
is a JSON object with a "type" discriminator. Binary frames carry Opus audio
data with a JSON envelope around the base64 payload — never raw bytes —
because the WSS transport is `subprotocol=kiaan-voice-v1` which is
explicitly text-based.

This module provides:

  • Pydantic v2 models for every client→server and server→client frame
  • A discriminated union per direction so .model_validate() picks the
    right shape automatically
  • Helpers to round-trip frames as JSON strings (the wire format)
  • Constants for the subprotocol name + frame type literals so other
    modules don't drift on string keys

The frame catalogue mirrors the spec in CLAUDE.md verbatim.

USAGE (server-side):

    from backend.services.voice.wss_frames import (
        parse_client_frame, ClientStartFrame, ServerCrisisFrame,
        SUBPROTOCOL,
    )

    raw = await ws.receive_text()
    frame = parse_client_frame(raw)
    if isinstance(frame, ClientStartFrame):
        ...

USAGE (mobile-side via TS contract — see apps/sakha-mobile/lib/wss-types.ts
which mirrors this file 1:1; the integration test in Part 5f asserts they
stay in sync).
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

# ─── Subprotocol & version ────────────────────────────────────────────────

SUBPROTOCOL = "kiaan-voice-v1"
SCHEMA_VERSION = "1.0.0"


# ─── Shared sub-models ────────────────────────────────────────────────────


class _StrictBase(BaseModel):
    """Base for every frame — forbids extra fields so a typo on the wire
    raises ValidationError instead of being silently dropped. The cost of
    a strict schema at the trust boundary is far less than a silent bug."""

    model_config = ConfigDict(extra="forbid", frozen=True)


class HelplineEntry(_StrictBase):
    name: str
    number: str
    region: str
    language: str = "en"
    is_24x7: bool = True


class MoodSnapshot(_StrictBase):
    label: str
    intensity: float = Field(ge=0.0, le=1.0)
    trend: str  # "rising" | "falling" | "steady"


class VerseSnapshot(_StrictBase):
    chapter: int = Field(ge=1, le=18)
    verse: int = Field(ge=1, le=78)
    text_sa: str
    text_en: str
    text_hi: str | None = None
    citation: str  # "BG 2.47"


class SuggestedNextItem(_StrictBase):
    label: str
    action: str  # "open_journey:transform-anger" | "open_tool:emotional_reset" | …


# ─── Client → Server frames ───────────────────────────────────────────────


class ClientStartFrame(_StrictBase):
    type: Literal["start"] = "start"
    session_id: str = Field(min_length=1, max_length=128)
    lang_hint: str = Field(default="en", max_length=8)
    persona_version: str
    render_mode: Literal["voice", "text"] = "voice"
    delivery_channel: Literal["voice_android", "voice_web", "voice_ios"] = "voice_android"
    user_region: str | None = Field(default=None, max_length=8)
    schema_version: str = SCHEMA_VERSION


class ClientAudioChunkFrame(_StrictBase):
    type: Literal["audio.chunk"] = "audio.chunk"
    seq: int = Field(ge=0)
    data: str  # base64-encoded Opus frame


class ClientEndOfSpeechFrame(_StrictBase):
    type: Literal["end_of_speech"] = "end_of_speech"


class ClientInterruptFrame(_StrictBase):
    type: Literal["interrupt"] = "interrupt"


class ClientHeartbeatFrame(_StrictBase):
    type: Literal["heartbeat"] = "heartbeat"


ClientFrame = Annotated[
    ClientStartFrame | ClientAudioChunkFrame | ClientEndOfSpeechFrame | ClientInterruptFrame | ClientHeartbeatFrame,
    Field(discriminator="type"),
]


# ─── Server → Client frames ───────────────────────────────────────────────


class ServerTranscriptPartialFrame(_StrictBase):
    type: Literal["transcript.partial"] = "transcript.partial"
    text: str
    is_final: bool = False
    seq: int = Field(default=0, ge=0)


class ServerCrisisFrame(_StrictBase):
    type: Literal["crisis"] = "crisis"
    incident_id: str
    helpline: list[HelplineEntry]
    audio_url: str
    region: str
    language: str


class ServerEngineFrame(_StrictBase):
    type: Literal["engine"] = "engine"
    selected: Literal["GUIDANCE", "FRIEND", "ASSISTANT", "VOICE_GUIDE"]


class ServerMoodFrame(_StrictBase):
    type: Literal["mood"] = "mood"
    label: str
    intensity: float = Field(ge=0.0, le=1.0)
    trend: str


class ServerVerseFrame(_StrictBase):
    type: Literal["verse"] = "verse"
    chapter: int = Field(ge=1, le=18)
    verse: int = Field(ge=1, le=78)
    text_sa: str
    text_en: str
    text_hi: str | None = None
    citation: str


class ServerTextDeltaFrame(_StrictBase):
    type: Literal["text.delta"] = "text.delta"
    content: str


class ServerAudioChunkFrame(_StrictBase):
    type: Literal["audio.chunk"] = "audio.chunk"
    seq: int = Field(ge=0)
    mime: Literal["audio/opus", "audio/mpeg", "audio/wav"] = "audio/opus"
    data: str  # base64-encoded


class ServerFilterFailedFrame(_StrictBase):
    type: Literal["filter_failed"] = "filter_failed"
    reason: str
    falling_back_to: Literal["template", "verse_only"]


class ServerToolInvocationFrame(_StrictBase):
    type: Literal["tool_invocation"] = "tool_invocation"
    tool: str
    action: Literal["NAVIGATE", "INPUT_TO_TOOL"]
    input_payload: dict | None = None
    carry_id: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)


class ServerSuggestedNextFrame(_StrictBase):
    type: Literal["suggested_next"] = "suggested_next"
    items: list[SuggestedNextItem]


class ServerDoneFrame(_StrictBase):
    type: Literal["done"] = "done"
    conversation_id: str
    total_ms: int = Field(ge=0)
    cache_hit: bool = False
    persona_version: str
    tier_used: Literal["openai", "local_llm", "template", "verse_only"] = "openai"
    first_audio_byte_ms: int | None = Field(default=None, ge=0)


class ServerErrorFrame(_StrictBase):
    type: Literal["error"] = "error"
    code: str
    message: str
    recoverable: bool = True


class ServerHeartbeatAckFrame(_StrictBase):
    """Server acks a client heartbeat. Lets the client measure RTT and
    detect a stuck WSS without a separate ping/pong layer."""

    type: Literal["heartbeat.ack"] = "heartbeat.ack"


ServerFrame = Annotated[
    ServerTranscriptPartialFrame | ServerCrisisFrame | ServerEngineFrame | ServerMoodFrame | ServerVerseFrame | ServerTextDeltaFrame | ServerAudioChunkFrame | ServerFilterFailedFrame | ServerToolInvocationFrame | ServerSuggestedNextFrame | ServerDoneFrame | ServerErrorFrame | ServerHeartbeatAckFrame,
    Field(discriminator="type"),
]


# ─── Wire helpers ─────────────────────────────────────────────────────────


class _ClientFrameWrapper(BaseModel):
    model_config = ConfigDict(extra="forbid")
    frame: ClientFrame


class _ServerFrameWrapper(BaseModel):
    model_config = ConfigDict(extra="forbid")
    frame: ServerFrame


def parse_client_frame(raw: str) -> ClientFrame:
    """Parse a client-side WSS frame from its JSON wire form.

    Raises:
        ValidationError if the frame doesn't match any known type, has
        extra fields, or has invalid value ranges. The caller (the WSS
        handler) is expected to convert this to a ServerErrorFrame and
        close the socket cleanly.
    """
    return _ClientFrameWrapper.model_validate_json(
        b'{"frame":' + raw.encode() + b'}'
    ).frame


def parse_server_frame(raw: str) -> ServerFrame:
    """Parse a server-side WSS frame (used by the test-side mock client)."""
    return _ServerFrameWrapper.model_validate_json(
        b'{"frame":' + raw.encode() + b'}'
    ).frame


def serialize_frame(frame: BaseModel) -> str:
    """Serialize any frame to its JSON wire form.

    Pydantic emits compact JSON by default — no spaces, no trailing
    newlines. The WSS layer can stream this directly via send_text().
    """
    return frame.model_dump_json(exclude_none=True)


__all__ = [
    "SUBPROTOCOL",
    "SCHEMA_VERSION",
    # Shared
    "HelplineEntry",
    "MoodSnapshot",
    "VerseSnapshot",
    "SuggestedNextItem",
    # Client frames
    "ClientStartFrame",
    "ClientAudioChunkFrame",
    "ClientEndOfSpeechFrame",
    "ClientInterruptFrame",
    "ClientHeartbeatFrame",
    "ClientFrame",
    # Server frames
    "ServerTranscriptPartialFrame",
    "ServerCrisisFrame",
    "ServerEngineFrame",
    "ServerMoodFrame",
    "ServerVerseFrame",
    "ServerTextDeltaFrame",
    "ServerAudioChunkFrame",
    "ServerFilterFailedFrame",
    "ServerToolInvocationFrame",
    "ServerSuggestedNextFrame",
    "ServerDoneFrame",
    "ServerErrorFrame",
    "ServerHeartbeatAckFrame",
    "ServerFrame",
    # Helpers
    "parse_client_frame",
    "parse_server_frame",
    "serialize_frame",
    "ValidationError",
]
