# MindVibe — KIAAN Voice Companion Framework: Architecture & Implementation Status

**Audit date:** 2026-05-16
**Branch:** `claude/audit-cache-framework-CpSVN`
**Scope:** End-to-end voice pipeline — server + web + mobile.

---

## 1. Executive verdict

The Voice Companion is **two parallel pipelines**, not one:

| Pipeline | Transport | Where it lives | Used by | Status |
|---|---|---|---|---|
| **A. Sakha Voice WSS** (`/voice-companion/converse`, subprotocol `kiaan-voice-v1`) | WebSocket, streaming | `backend/routes/voice_companion_wss.py` + `backend/services/voice/orchestrator.py` | **Android native app** | **Production-wired**, full streaming |
| **B. REST Voice Companion** (`/api/voice-companion/*`) | POST request/response, unary | `backend/routes/kiaan_voice_companion.py` (1551+ lines) | **Web** (Next.js mobile shell) + lightweight clients | **Production-wired**, no streaming |

**Overall framework completeness ≈ 65–70 %.** The hot-path stages (capture → STT → orchestrator → WisdomCore retrieval → safety filter → LLM → TTS → audio stream → telemetry) are wired end-to-end on the WSS pipeline. The REST pipeline implements its own simpler variant. The remaining ~30 % is genuine optionality (offline / on-device, mobile-native STT, memory recall in the WSS turn, persona-voice UX) that is **scaffolded but not in the live path**.

---

## 2. Flowchart — Pipeline A: Sakha Voice WSS (Android)

```
ANDROID CLIENT
  │
  │  WebSocket connect, subprotocol = "kiaan-voice-v1"
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ① SESSION BOOTSTRAP                                                  │
│   voice_companion_wss.py:410  voice_companion_converse()             │
│   • subprotocol validation                                           │
│   • ClientStartFrame received (user_id, language, voice persona)     │
│   • _Session created (voice_companion_wss.py:94)                     │
└──────────────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ② AUDIO INTAKE LOOP (asyncio task)                                   │
│   voice_companion_wss.py:223  _audio_intake_loop()                   │
│   • Receives ClientAudioChunk frames (base64 Opus, sequenced)        │
│   • Feeds STT provider as bytes arrive                               │
└──────────────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ③ STT PROVIDER  (Sarvam Saarika default; MockSTT in dev)             │
│   backend/services/voice/stt_router.py                               │
│   • build_provider() picks engine from env / language hint           │
│   • feed_audio_chunk → STTResult (partial + final)                   │
│   • STTResult.detected_language populated                            │
└──────────────────────────────────────────────────────────────────────┘
  │
  ├──── (every partial) ─────────────────────────────────────┐
  │                                                          ▼
  │                              ┌──────────────────────────────────────┐
  │                              │ ④ CRISIS PARTIAL SCANNER             │
  │                              │  voice/crisis_partial_scanner.py     │
  │                              │  • <5 ms latency                     │
  │                              │  • 8-language phrase lexicon         │
  │                              │  • First match latches               │
  │                              │  • Region-aware helpline routing     │
  │                              └──────────────────────────────────────┘
  │                                                          │
  │                                            ServerCrisisFrame
  │                                            (interrupts pipeline)
  │
  ▼ (final transcript)
┌──────────────────────────────────────────────────────────────────────┐
│ ⑤ ORCHESTRATOR TURN                                                  │
│   voice_companion_wss.py:358  _run_orchestrator_turn()               │
│   backend/services/voice/orchestrator.py:run_turn()                  │
│                                                                      │
│   builds VoiceTurnContext (orchestrator_types.py:20):                │
│     ├─ history             (conversation memory)                     │
│     ├─ mood                (detected via _detect_mood)               │
│     ├─ phase               (engine route)                            │
│     ├─ language            (from STT)                                │
│     └─ user_state          (immutable frozen dataclass)              │
└──────────────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ⑥ WISDOMCORE RETRIEVAL                                               │
│   backend/services/voice/retrieval_and_fallback.py                   │
│     retrieve_verses_for_turn()                                       │
│   • Async DB query against gita_verses (STATIC)                      │
│   • Effectiveness-weighted via dynamic_wisdom_corpus (DYNAMIC)       │
│   • Mock catalogue fallback for CI                                   │
└──────────────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ⑦ AUDIO CACHE LOOKUP                                                 │
│   orchestrator.py:235                                                │
│   key = sha256(verse_refs + mood + lang + voice_id + persona)        │
│   • 7-day TTL, never includes raw user text                          │
│   • HIT  → skip LLM + filter + TTS, stream cached opus               │
│   • MISS → proceed                                                   │
└──────────────────────────────────────────────────────────────────────┘
  │ (miss)
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ⑧ PERSONA + PROMPT COMPOSITION                                       │
│   voice_companion_wss.py:382  get_prompt_text()                      │
│   • Loads prompts/sakha.voice.openai.md  (voice persona v1.2.0)      │
│   • Composes with retrieved verses block                             │
│   • Voice-optimised: shorter sentences, no markdown                  │
└──────────────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ⑨ LLM STREAM                                                         │
│   backend/services/voice/llm_provider.py                             │
│   • OpenAI gpt-4o-mini, streaming JSON deltas                        │
│   • Mock provider for dev / CI                                       │
│   • ⚠ No fallback to Anthropic / Sarvam from this path               │
└──────────────────────────────────────────────────────────────────────┘
  │ (token deltas)
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ⑩ STREAMING GITA FILTER (post-LLM gate)                              │
│   orchestrator.py:289  StreamingGitaFilter                           │
│   • Sentence-by-sentence verdict: PASS / HOLD / FAIL                 │
│   • PASS: emit sentence                                              │
│   • HOLD: buffer until finalize()                                    │
│   • FAIL: tier-3 / tier-4 template fallback                          │
└──────────────────────────────────────────────────────────────────────┘
  │ (per-sentence text)
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ⑪ TTS ROUTER                                                         │
│   backend/services/voice/tts_router.py                               │
│   • Sarvam → indic languages                                         │
│   • ElevenLabs → English                                             │
│   • Edge / Mock fallback                                             │
│   • Voice IDs locked per (language, persona)                         │
└──────────────────────────────────────────────────────────────────────┘
  │ (opus chunks)
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ⑫ AUDIO STREAM BACK                                                  │
│   orchestrator.py:346  ServerAudioChunkFrame                         │
│   • base64 Opus, seq numbered, is_final flag                         │
│   • Client buffers via MSE / KiaanAudioPlayer (Android)              │
└──────────────────────────────────────────────────────────────────────┘
  │
  ├──── (ClientInterruptFrame arrives mid-stream) ───────────┐
  │                                                          ▼
  │                              ┌──────────────────────────────────────┐
  │                              │ ⑬ BARGE-IN                           │
  │                              │  orchestrator.py:304, 326            │
  │                              │  • interrupt_event → cancel_event    │
  │                              │  • Polled between deltas             │
  │                              │  • Clean break + return              │
  │                              └──────────────────────────────────────┘
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ ⑭ END-OF-TURN + TELEMETRY                                            │
│   ServerDoneFrame  (orchestrator.py:350+)                            │
│   voice_companion_wss.py:142  _record_turn_telemetry()               │
│   • first_audio_byte_ms, tier_used, filter_pass_rate,                │
│     cache_hit, barge_in_token_idx                                    │
│   • dynamic_wisdom_corpus.record_wisdom_delivery + outcome           │
└──────────────────────────────────────────────────────────────────────┘
  │
  └─→ loop for next turn, or close
```

---

## 3. Flowchart — Pipeline B: REST Voice Companion (Web)

```
WEB / NEXT.JS CLIENT
  │
  ▼
POST /api/voice-companion/session/start
  backend/routes/kiaan_voice_companion.py:828
  • Creates CompanionProfile (cached at :70)
  • Returns greeting (_get_divine_greeting at :801)
  • Updates streak (:513)
  │
  ▼
POST /api/voice-companion/message            ← per-turn
  backend/routes/kiaan_voice_companion.py:916
  │
  ├──► _get_or_create_profile (:420)
  ├──► _get_user_memories     (:434)         ← memory IS used here
  ├──► _get_recent_session_summaries (:496)
  ├──► _detect_response_length (:529)
  ├──► _get_conversation_phase (:593)
  ├──► _build_divine_friend_system_prompt (:148)
  │       └─ embeds: mood + phase + persona + memories
  │
  ├──► EXACT-MATCH CACHE LOOKUP (in-memory LRU)
  │       _response_cache_key (:100)  → sha256(mood|phase|lang|msg)
  │       _get_cached_response (:114)
  │       (skipped if memories non-empty — privacy guard)
  │
  ├──► _call_openai_direct (:640)            ← bypasses ai_provider.py
  │       (raw OpenAI, no WisdomCore composition on this path)
  │
  └──► _set_cached_response (:128)  → return text
       (No TTS on this route — client uses Web Speech SpeechSynthesis)

POST /api/voice-companion/quick-response   (:1439) — same shape, shorter
POST /api/voice-companion/session/end      (:1551) — closes session
```

> **Important asymmetry:** Pipeline B's `/message` route does *not* go through `compose_kiaan_system_prompt`. It builds its own prompt at `:148` with mood/phase/memories embedded directly and calls OpenAI through `_call_openai_direct` (`:640`), not through `ai_provider.call_kiaan_ai`. So the WisdomCore gating finding from Part 3/Part 4 of `AUDIT_CACHE_FRAMEWORK.md` (re: chat routes going through Wisdom Core) does **not** transfer to the REST voice route — this one is a separate, narrower implementation.

---

## 4. Stage-by-stage implementation table

| # | Stage | Pipeline A (WSS) | Pipeline B (REST) | % |
|---|---|---|---|---|
| 1 | Session bootstrap + auth | ✅ `voice_companion_wss.py:410` | ✅ `kiaan_voice_companion.py:828` | 100 |
| 2 | Client audio capture | ✅ `hooks/useVoiceInput.ts` (web), Expo Audio (mobile) | ✅ Web Speech API | 100 |
| 3 | Real-time transport | ✅ WebSocket, `voice/wss_frames.py` | N/A (REST) | 100 (where used) |
| 4 | VAD / endpointing | ⚠ `hooks/useVoiceActivityDetection.ts` defined, **not imported in live flow** | ⚠ Browser-native only | **50** |
| 5 | STT routing | ✅ `voice/stt_router.py` (Sarvam Saarika default) | ✅ Browser Web Speech | 100 |
| 6 | Language detection | ⚠ Sarvam returns `detected_language`; **routing uses lang_hint, not detected** (`stt_router.py:60`) | ⚠ Browser-only | **75** |
| 7 | Context assembly | ✅ `VoiceTurnContext` `orchestrator_types.py:20` | ✅ inline in `:916` handler | 100 |
| 8 | Memory lookup | ❌ `CompanionMemory.lookup()` not called from orchestrator | ✅ `kiaan_voice_companion.py:434, 496` | **40** |
| 9 | WisdomCore retrieval (Static + Dynamic) | ✅ `voice/retrieval_and_fallback.py` | ❌ Not called on this path | **70** (A only) |
| 10 | Persona / system-prompt composition | ⚠ `prompts/sakha.voice.openai.md` is OSS placeholder; proprietary content via env | ✅ `_build_divine_friend_system_prompt :148` (but bypasses Wisdom Core) | **50** |
| 11 | LLM call | ✅ OpenAI streaming via `voice/llm_provider.py`; no Anthropic/Sarvam fallback | ✅ `_call_openai_direct :640` | 100 / 70 |
| 12 | Safety filter | ✅ `StreamingGitaFilter` (`orchestrator.py:289`) + `CrisisPartialScanner` on partials | ❌ No Gita filter on REST path | **65** |
| 13 | Response chunking for TTS | ✅ Sentence-boundary, `orchestrator.py:325` | N/A | 100 (A) |
| 14 | TTS routing | ✅ `voice/tts_router.py` (Sarvam / ElevenLabs / Edge / Mock) | ❌ Client-side `SpeechSynthesis` | **75** |
| 15 | Audio stream back | ✅ `ServerAudioChunkFrame`, Opus chunked | N/A | 100 (A) |
| 16 | Barge-in | ✅ `cancel_event` polled (`orchestrator.py:304, 326`) | ❌ | 100 (A) / 0 (B) |
| 17 | End-of-turn / dialog state | ✅ `ServerDoneFrame` | ✅ HTTP 200 closes | 100 |
| 18 | Caching | ✅ Audio cache, sha256 of verse_refs+mood+lang+voice (`tts_router.py`) | ✅ In-memory LRU exact-match (`:100, 114, 128`) | 100 |
| 19 | Telemetry | ✅ `_record_turn_telemetry :142` → `dynamic_wisdom_corpus` | ⚠ Limited | **80** |
| 20 | Offline / on-device fallback | ❌ Zero — no Silero VAD, no on-device LLM, no Piper TTS | ❌ | **0** |
| 21 | Persona voice (gender/accent) | ⚠ `sakha_voice_persona.py` defines fields; not exposed in UI | ❌ | **60** |
| 22 | Mobile native module | ⚠ `KiaanAudioPlayer` TurboModule (Kotlin) implemented for **playback**; mic capture uses Expo Audio (WebM, not native SpeechRecognizer) | N/A | **70** |
| 23 | Error recovery / reconnect | ⚠ `ServerErrorFrame.recoverable` flag (`voice_companion_wss.py:213`); no exponential backoff, no state-machine reset | ⚠ HTTP retry only | **60** |

**Weighted overall: ≈ 68 %.**

---

## 5. Original KIAAN code vs delegated services

| Layer | Original (KIAAN) | Delegated |
|---|---|---|
| Orchestration | `voice/orchestrator.py`, `orchestrator_types.py` ~500 LOC | — |
| Crisis scanning | `voice/crisis_partial_scanner.py` ~300 LOC, 8-language lexicon | — |
| Streaming Gita filter | `services/gita_wisdom_filter.py` ~400 LOC | — |
| Verse retrieval | `voice/retrieval_and_fallback.py` ~300 LOC | — |
| Provider routers + mocks | `stt_router.py`, `tts_router.py`, `llm_provider.py` ~1500 LOC | — |
| WSS frame protocol | `voice/wss_frames.py` ~200 LOC | — |
| Telemetry | dynamic_wisdom_corpus callbacks | — |
| Web hooks | `useVoiceInput`, `useVoiceOutput`, `useWakeWord`, `useHandsFreeMode` ~700 LOC | — |
| **STT inference** | — | Sarvam Saarika (cloud) |
| **TTS inference** | — | Sarvam (indic), ElevenLabs (EN) |
| **LLM inference** | — | OpenAI gpt-4o-mini |
| Audio capture | — | Browser Web Speech / Expo Audio |

Ratio: **~70 % original code, ~30 % delegated to cloud APIs.** The "Independent AI" gap from Part 2 narrows on the voice side because the orchestration, retrieval, filtering, and frame protocol are all KIAAN-native.

---

## 6. Dead code / dormant infrastructure

These exist in-tree but are not in the live path:

| File | Status |
|---|---|
| `hooks/useVoiceActivityDetection.ts` | Defined, never imported |
| `kiaanverse-mobile/.../hooks/useVoiceSession.ts` | Marked DEPRECATED 2025-11; replaced by chat-stack |
| `kiaanverse-mobile/.../hooks/useRecorder.ts`, `useStreamingPlayer.ts`, `useBargeIn.ts`, `useCrisisHandler.ts`, `useWebSocket.ts`, `useShankhaAnimation.ts`, `useVAD.ts`, `useVoicePrefill.ts` | Dormant, cross-linked to deprecated session hook |
| `kiaanverse-mobile/.../native/android/.../voice/*.kt` (22 Kotlin modules) | Untouched; FGS plugin disabled in `app.config.ts` |
| `backend/routes/voice_learning.py`, `voice_learning_advanced.py` | Registered in `main.py`, no callers from orchestrator/WSS |
| `backend/services/voice_compute_policy.py`, `kiaan_divine_voice.py`, `advanced_voice_synthesis.py` | Policy files, no active wiring |

Preserve-for-future is the apparent intent (premium voice tier), not bit-rot — but it inflates the surface area and obscures what's truly live.

---

## 7. Top 5 gaps to close (impact-ordered)

1. **Memory recall in the WSS turn** — `CompanionMemory.lookup()` is wired for Pipeline B but not for Pipeline A. The voice user gets a stateless response while the web user gets a personalised one. *Fix:* call `_get_user_memories` (or its WSS equivalent) inside `_run_orchestrator_turn` (`voice_companion_wss.py:358`). Cost: ≤ 1 day. *(Stage 8, +60 pp)*
2. **WisdomCore on the REST path** — Pipeline B's `_call_openai_direct` (`kiaan_voice_companion.py:640`) bypasses `compose_kiaan_system_prompt` and the post-filter. Wire it in (or route through `_run_ai` from `routes/kiaan.py:118`) so the REST web user gets the same Gita grounding as the WSS Android user. *(Stages 9 + 12, +30 pp each)*
3. **Offline / on-device fallback** — Zero today. Bundle Silero VAD client-side; ship a Piper voice for English/Hindi TTS; add a llama.cpp tiny model behind the existing `kiaan_model_provider` for STT→LLM→TTS to survive network loss. Largest single uplift in real-world reliability (rural India, flights). *(Stage 20, +100 pp on a 0-base)*
4. **Native Android STT** — Today mic uses Expo Audio WebM, which costs 200–500 ms in re-encode latency. Use Android's native `SpeechRecognizer` (or Sarvam streaming via OkHttp) directly. *(Stage 22, +30 pp)*
5. **Language code-switching** — Sarvam returns `detected_language` (`stt_router.py:60`) but routing still uses the client's `lang_hint`. Honour `detected_language` and switch TTS voice mid-turn when Hindi→English code-switching is detected. *(Stage 6, +25 pp)*

---

## 8. Top 3 strengths (preserve at all costs)

1. **Crisis Partial Scanner.** Sub-5 ms latency, 8-language lexicon, latches on first match, region-aware helpline routing, anonymised audit log. This is the right hierarchy: safety on partials, not after the LLM. (`voice/crisis_partial_scanner.py`)
2. **Streaming sentence-by-sentence TTS with deterministic cache.** Cache key is `sha256(verse_refs+mood+lang+voice_id+persona)` — never raw user text — which both prevents prompt-injection cache poisoning and gives first-audio-byte ≤ 1.2 s on hit and ≤ 300 ms on miss. (`voice/tts_router.py`, `orchestrator.py:205–267`)
3. **Submodular provider routing with mock fallback.** STT, LLM, and TTS all share the same shape: real provider + deterministic mock + lazy env gate. CI runs without keys; adding a provider is a registry entry. (`voice/stt_router.py:90–194`, `llm_provider.py:79–150`, `tts_router.py:125–172`)

---

## 9. Summary

The Voice Companion Framework is real, dual-tracked (WSS for Android + REST for web), and **~68 % complete**. The hot path on Pipeline A (Android WSS) is production-grade end-to-end: capture → Sarvam STT → crisis scan → WisdomCore retrieval → persona-composed prompt → OpenAI streaming → Gita filter → Sarvam/ElevenLabs TTS → Opus chunked back → telemetry → barge-in. Pipeline B (web REST) is functional but narrower — it has its own memory and cache but **does not** use the WisdomCore composer or the Gita post-filter; closing that asymmetry is the highest-leverage cleanup. The remaining ~30 % gap is offline mode, native-Android STT, persona-voice UX, and memory wiring on the WSS turn — all *additive* improvements that do not require architectural changes.
