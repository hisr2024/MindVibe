"""VoiceCompanionOrchestrator — per-turn data types.

The orchestrator runs one Sakha turn from STT-final to ServerDoneFrame.
It receives a VoiceTurnContext describing the session/turn, runs the
pipeline, and yields ServerFrame objects to the caller (the WSS handler
in backend/api/voice_companion.py).

Splitting these dataclasses out of the orchestrator file keeps the
contract auditable on its own — the WSS handler imports only types from
here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


@dataclass(frozen=True)
class VoiceTurnContext:
    """All inputs the orchestrator needs to run one Sakha turn.

    Built by the WSS handler from the ClientStartFrame + the STT final
    transcript. Immutable so the orchestrator can't accidentally mutate
    session state — a fresh context is built per turn.
    """

    session_id: str
    user_id: str
    conversation_id: str
    user_latest: str                    # the STT final transcript
    lang_hint: str = "en"               # "en" | "hi" | "hi-en" | …
    render_mode: Literal["voice", "text"] = "voice"
    delivery_channel: Literal[
        "voice_android", "voice_web", "voice_ios"
    ] = "voice_android"
    user_region: str = "GLOBAL"
    persona_version: str = "1.0.0"
    history: list[dict] = field(default_factory=list)
    session_summaries: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class VoiceTurnResult:
    """Summary of what happened in one turn.

    Returned by the orchestrator after the frame stream ends. The WSS
    handler uses this to write the dynamic_wisdom_corpus delivery +
    outcome records (delivery_channel=voice_android, voice_specific_outcomes).
    """

    conversation_id: str
    completed: bool                     # True if a Done frame was emitted
    crisis_triggered: bool              # True if the turn ended via crisis routing
    interrupted: bool                   # True if the user barge-in'd mid-turn
    cache_hit: bool                     # True if the audio cache served the response
    tier_used: Literal[
        "openai", "local_llm", "template", "verse_only"
    ] = "openai"
    persona_version: str = "1.0.0"
    engine_selected: str = "FRIEND"
    mood_label: str = "neutral"
    mood_intensity: float = 0.5
    mood_trend: str = "steady"
    verse_refs: list[str] = field(default_factory=list)
    first_audio_byte_ms: int | None = None
    total_ms: int = 0
    sentences_emitted: int = 0
    audio_chunks_emitted: int = 0
    filter_pass_rate: float = 1.0       # 0..1 — fraction of sentences that passed filter
    barge_in_at_token_index: int | None = None

    def to_voice_specific_outcomes(self, *, completed_listening: bool) -> dict:
        """Project this result into the voice_specific_outcomes JSON shape
        accepted by dynamic_wisdom_corpus.record_wisdom_outcome().

        The WSS handler typically computes completed_listening from the
        turn (True if no interrupt + no crisis + cache hit OR full chunks
        delivered)."""
        return {
            "completed_listening": completed_listening,
            "session_continued": self.completed and not self.crisis_triggered,
            "barge_in_at_token_index": self.barge_in_at_token_index,
            "filter_pass_rate": self.filter_pass_rate,
            "first_audio_byte_ms": self.first_audio_byte_ms or 0,
            "tier_used": self.tier_used,
            "cache_hit": self.cache_hit,
        }


__all__ = ["VoiceTurnContext", "VoiceTurnResult"]
