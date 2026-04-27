"""Voice companion subpackage — Sakha WSS pipeline modules.

Modules:
  • wss_frames        — Pydantic frame protocol (kiaan-voice-v1)
  • stt_router        — Server-side STT routing (Sarvam / Deepgram / Mock)
  • tts_router        — Server-side TTS routing + audio cache
  • orchestrator      — Per-turn voice orchestrator
  • mock_providers    — Deterministic mock STT/TTS for tests + dev
"""
