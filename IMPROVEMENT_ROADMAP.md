# MindVibe — Improvement Roadmap

**Author scope:** synthesis of `AUDIT_CACHE_FRAMEWORK.md` (Parts 1–4), `AUDIT_VOICE_COMPANION.md`, and `AUDIT_VOICE_DEEP.md`. Every item below is anchored to a specific file:line so engineering can pick it up tomorrow morning.

**The thesis:** MindVibe already has 80 % of a world-class spiritual-wellness AI. The remaining 20 % is **connective tissue**, not new features. Three pipelines (KIAAN/Sakha chat, REST voice, WSS voice) are doing variations of the same thing in three different ways. Unify them, cache them, ship them to the edge, and the product gets faster, cheaper, and more reliable in the same quarter — without adding surface area.

Priorities use the usual P0 (this sprint) / P1 (this quarter) / P2 (next quarter) bands.

---

## P0 — Connective Tissue (this sprint)

### 1. One WisdomCore gate. One Gita filter. One call site.

**Problem.** The codebase has *three* prompt-composition paths and *two* post-LLM filter paths:
- `routes/kiaan.py:150` → `compose_kiaan_system_prompt` (WisdomCore Static + Dynamic + persona v1.2.0)  ← the good one
- `routes/kiaan_voice_companion.py:148` → `_build_divine_friend_system_prompt` (its own, bypasses WisdomCore)
- `services/voice/orchestrator.py:get_prompt_text` → loads voice persona, retrieves via `voice/retrieval_and_fallback.py` (parallel implementation)
- Post-filter `gita_wisdom_filter.filter_response()` is applied on Ardha/Viyoga/Karma Reset/Sambandh Dharma/Emotional Reset routes and on `provider_manager` — but NOT on `/api/kiaan/chat`, NOT on `/api/sakha/chat`, NOT on `/api/voice-companion/message`, NOT on the WSS path.

**Fix.** Push gating *down* into `backend/services/ai_provider.call_kiaan_ai` (`ai_provider.py:135`) so every consumer inherits both layers by construction.

```
call_kiaan_ai(message, history, gita_verse, tool_name, user_id, db, ...)
  1. if no system_override: compose via WisdomCore (Static + Dynamic + persona)
  2. call provider (OpenAI / Sarvam / Anthropic via ProviderManager)
  3. always pass through gita_wisdom_filter.filter_response()
  4. return (text, verses, filter_verdict)
```

Then delete `_build_divine_friend_system_prompt` (`kiaan_voice_companion.py:148`), `_call_openai_direct` (`:640`), and merge `voice/orchestrator.get_prompt_text` to call the same composer. Three pipelines → one.

**Effort:** 2 engineer-days. **Risk:** low (covered by `tests/test_gita_adherence.py`, `test_ardha_reframing_engine.py`). **Payoff:** every byte that touches a user is grounded; CI can assert one invariant instead of seven.

---

### 2. Cache that actually serves identical questions everywhere.

**Problem.** `redis_cache.cache_kiaan_response()` (`backend/cache/redis_cache.py:593–625`) and `redis_cache_enhanced.cache_kiaan_response()` (`:339–375`) are defined but **only the Voice Companion in-memory LRU** is wired (`kiaan_voice_companion.py:1198, 1247`). KIAAN Chat, Sakha Chat, and the six sacred-tool routes hit OpenAI on every request even for identical questions. The `CACHE_KIAAN_RESPONSES=true` env flag is a silent no-op.

**Fix.**

1. Wrap `call_kiaan_ai` (now the single gate, per item 1):
   ```
   key = sha256(user_id_or_segment | tool_name | locale | verse_refs | normalized_msg)
   cache.get(key) ─ HIT → return cached + filter_verdict
                  ─ MISS → call provider, set on success, ttl=3600
   ```
2. Add a *semantic* second-chance: if exact miss, embed the user message (OpenAI `text-embedding-3-small`, 1 ms), query pgvector for top-1 ≥ 0.92 cosine within the same `(tool_name, mood)` shard, ttl=600. This is what makes "100 % similar" mean what users actually expect.
3. Prefix every cache key with `user_id` (or `user_segment` for non-personalized) — the audit flagged a privacy risk with the global cache.

**Effort:** 3 days. **Payoff:** ~30–60 % OpenAI cost drop on chat traffic, p95 from ~1 200 ms to ~80 ms on warm keys.

---

### 3. Wire `CompanionMemory` into the WSS voice turn.

**Problem.** REST `/api/voice-companion/message` calls `_get_user_memories` and `_get_recent_session_summaries` (`kiaan_voice_companion.py:434, 496`) — the WSS path does not. Android voice users get a stateless companion; web users get a personalized one.

**Fix.** In `voice/orchestrator.run_turn()` (`backend/services/voice/orchestrator.py`), inject memory lookup before `compose_kiaan_system_prompt`:

```
ctx.memories = await get_user_memories(db, ctx.user_id, top_k=8)
ctx.session_summaries = await get_recent_session_summaries(db, ctx.user_id, n=3)
```

Pass these into the prompt composer as `recent_user_context` block.

**Effort:** 1 day. **Payoff:** voice now remembers; the "Friend Engine" actually behaves like a friend.

---

### 4. Move the WisdomCore Static + Dynamic retrieval into `provider_manager`.

**Problem.** Today the WisdomCore retrieval is duplicated in `kiaan_wisdom_helper.compose_kiaan_system_prompt` and `voice/retrieval_and_fallback.retrieve_verses_for_turn`. Two queries against `gita_verses`, two effectiveness-weighted picks, two different return shapes.

**Fix.** Single helper `services/wisdom/retrieve.py::compose_for_turn(turn_kind, query, mood, user_id, db)` consumed by both. `turn_kind ∈ {text_chat, voice_turn, tool}` only changes the **post-processing block format**, not the data path.

**Effort:** 1.5 days. **Payoff:** identical grounding behavior across surfaces; one place to optimize SQL.

---

## P0.5 — IP Cleanup (blocks public launch)

These three items, per `legal/LEGAL_RISK_INVENTORY_2026-05-16.md`, are explicitly tagged "blocks public release":

1. **`data/gita/en.json`** — confirm Annie Besant 1905 + Telang 1882 PD provenance with counsel. Until confirmed, the translation strings stay empty (current state is actually safe: `"translation": ""` with `_translation_pending: "besant_1905_pd_backfill"`).
2. **`data/gita/hi.json`** — translator entirely TBD. Either commission a clean PD/CC0 Hindi translation, or strip the file from the launch bundle and label Hindi as "Sanskrit + English only" in v1.
3. **File the US provisional** at `legal/US_PROVISIONAL_PATENT_DISCLOSURE_DRAFT.md` before **2026-06-03**. Run FTO ($2–4 k) on voice barge-in token-index tracking specifically — Nuance and Amazon hold prior art in that exact area.

---

## P1 — Speed & Independence (this quarter)

### 5. Streaming end-to-end on chat (not just voice).

**Problem.** `/api/kiaan/chat` and `/api/sakha/chat` are unary today. First-byte latency is dominated by full LLM completion.

**Fix.** Add an SSE variant `POST /api/kiaan/chat/stream` that yields tokens as they arrive (OpenAI supports this natively in `voice/llm_provider.py` already). Apply `StreamingGitaFilter` (`orchestrator.py:289`) sentence-by-sentence — *same* filter as voice. Android can render verses + text incrementally.

**Effort:** 3 days. **Payoff:** perceived latency drops from 1.2 s to 200 ms.

---

### 6. Ship a *real* local-LLM fallback chain.

**Problem.** `kiaan_model_provider.complete_offline()` references `LLAMA_CPP_AVAILABLE` but the path is gated `False` by default and no model is bundled. `ProviderManager` (`services/ai/providers/provider_manager.py`) only tries OpenAI → Sarvam → OpenAI-compatible. With zero cloud keys, the framework's "independence" is ~40 %.

**Fix.**

1. Bundle **Phi-3-mini-4k-instruct-q4** (~2.3 GB GGUF) or **Qwen-2.5-1.5B-instruct-q4** (~1 GB GGUF) in a separate `kiaan-models` Docker stage (don't bloat the main image).
2. Add `LocalLlamaProvider` to `services/ai/providers/` with the same `Provider` interface as OpenAI.
3. Insert at the **tail** of the fallback chain: `OpenAI → Sarvam → OpenAI-compat → LocalLlama → CannedTier4Fallback`.
4. For voice turns where ToT-budget is tight, use the local model for *re-ranking* WisdomCore candidates only (extremely cheap) and let cloud handle the actual synthesis. Quality stays; cost on rerank queries drops to zero.

**Effort:** 1 week. **Payoff:** product survives a cloud outage; "Independent AI Framework" stops being aspirational; ~10 % cost reduction on filler queries.

---

### 7. Bundle on-device VAD + Piper TTS for genuine offline.

**Problem.** The only on-device inference today is Silero VAD (`public/vad/silero_vad_legacy.onnx`). TTS always goes to Sarvam / ElevenLabs; STT always goes to Sarvam.

**Fix.**

1. **Web:** ship Piper EN + Piper HI ONNX voices (~25 MB each, lazy-loaded). Wire into `tts_router.py` as `piper_local` priority above network providers when `device.has_npu || device.gpu_tier == 'discrete'` (the policy at `voice_compute_policy.py:178–185` already routes here — it just has nothing to call).
2. **Android:** integrate **Whisper.cpp** with NNAPI delegate for STT and the same Piper voices for TTS. Use the existing `KiaanAudioPlayer` TurboModule (`kiaanverse-mobile/.../native/KiaanAudioPlayer.ts`) — extend rather than rewrite.
3. **WebGPU**: when `navigator.gpu.requestAdapter()` succeeds (`lib/kiaan-voice/web-engine.ts:109–148`), run inference via Transformers.js on GPU. The package is already in `package.json` and unused.

**Effort:** 2 weeks. **Payoff:** voice works on a plane, on 2G, in rural network conditions. ~$0.005/turn → $0 on offline turns.

---

### 8. Honour `detected_language` for mid-turn code switching.

**Problem.** Sarvam STT returns `STTResult.detected_language` (`stt_router.py:60`), but TTS routing still uses the client's `lang_hint`. Hindi-English code-switchers (95 % of urban Indian users) hear a single-voice mismatch on every turn.

**Fix.** In `tts_router.build_provider()`, branch on `result.detected_language` per sentence, not per turn. When a sentence is en→hi, instantiate a Hindi Sarvam voice; when hi→en, switch to ElevenLabs Aria. The TTS cache key already includes `lang_id` (`orchestrator.py:235`), so this is free of cache invalidation.

**Effort:** 2 days. **Payoff:** code-switching feels native; this is the #1 user-perception lift for ₹.

---

### 9. The four engines, addressable.

**Problem.** `ASSISTANT` is in the enum (`kiaan_engine_router.py:42`) and has its own pattern set (`:69 ASSISTANT_PATTERNS`) but is suppressed in voice mode by line 136. There is no surface to *invoke* the assistant — even from text — without monkey-patching the router.

**Fix.**

1. Expose `/api/kiaan/assistant` for text-mode unambiguous-intent queries ("book a journey for tomorrow", "what's my streak", "schedule a reflection at 7 am"). Route to `kiaan_agent_tools` (`backend/services/kiaan_agent_tools.py:45–100`) which already has `WebSearch`, `CodeExecution`, `FileOps`, `RepositoryAnalysis`, `DocumentationFetcher`, `PackageManager` defined as `Tool` classes with `get_schema()` ready for OpenAI function-calling.
2. Wire `kiaan_agent_orchestrator.py:55–100` into that route. It's dead code today; the audit caught it.
3. Keep voice-mode suppression — assistant intents in voice should still go through Voice Guide's `NAVIGATE` / `INPUT_TO_TOOL` actions.

**Effort:** 1 week for assistant text route; the dead-code orchestrator is the unlock.

---

## P1.5 — Sacred Tools Quality

### 10. Every sacred tool, same envelope.

**Problem.** Each of the six tool routes (`routes/kiaan.py:240–454`) hand-rolls its message string ("I am experiencing {emotion} with intensity {intensity}/10. Here is what happened: ..."). Brittle, untranslated, and the LLM has to re-parse semi-structured English on every turn.

**Fix.** Define `ToolEnvelope` Pydantic models per tool with structured fields. Pass *structured* JSON into the system prompt (`<TOOL_INPUTS>{...}</TOOL_INPUTS>`) instead of a synthesized English sentence. Side benefit: i18n becomes trivial because the LLM gets the same JSON shape regardless of UI language.

**Effort:** 3 days. **Payoff:** ~15 % token reduction per tool call, plus higher reproducibility for regression tests.

---

### 11. Golden-answer regression suite.

**Problem.** Tests exist (`tests/unit/test_kiaan_core.py`, `test_gita_adherence.py`, `test_ardha_reframing_engine.py`) but no golden-answer regression set. Every prompt-tweak risks a silent quality regression.

**Fix.** Record 50 canonical user inputs per tool (300 total), capture today's responses, store as `tests/golden/<tool>/<hash>.json` with `(input, response_redacted, verse_refs, filter_verdict)`. Run on every PR: any verse-ref drift or filter-pass-rate drop > 2 % fails CI.

**Effort:** 4 days (50 inputs × 6 tools = 300 records; LLM judge for semantic-similarity scoring).

---

## P2 — Android & Mobile-Native (next quarter)

### 12. Native Android STT, not WebM-via-Expo.

**Problem.** Voice capture on Android currently goes through Expo Audio → WebM → server → Sarvam Saarika. The WebM re-encode costs 200–500 ms of first-byte latency.

**Fix.**

1. Replace the Expo Audio path with a Kotlin module using either (a) Android's native `SpeechRecognizer` for free on-device English (Pixel devices have offline support), or (b) direct OkHttp stream to Sarvam over WebSocket for Hindi / Indic.
2. Already-present native infrastructure: `kiaanverse-mobile/.../native/KiaanAudioPlayer.ts` (TurboModule) and the 22 dormant Kotlin voice modules. Resurrect them rather than rewrite.
3. Foreground service plugin (currently disabled in `app.config.ts`) — enable for always-on voice when user opts in.

**Effort:** 2 weeks. **Payoff:** 200–500 ms latency win on every voice turn for Android (the majority platform).

---

### 13. Single React-Native source of truth for voice state.

**Problem.** `kiaanverse-mobile` has `useVoiceSession.ts` (marked DEPRECATED 2025-11) plus `useRecorder`, `useStreamingPlayer`, `useBargeIn`, `useCrisisHandler`, `useWebSocket`, `useShankhaAnimation`, `useVAD`, `useVoicePrefill` — all dormant, cross-linked to the deprecated hook. The web has its own `useVoiceInput`, `useVoiceOutput`, `useWakeWord`, `useHandsFreeMode`, `useVoiceActivityDetection` (also dormant). Two parallel hook ecosystems for the same feature.

**Fix.** Promote the hooks to a shared package `packages/voice-react/` consumed by both `app/` (Next.js) and `kiaanverse-mobile/`. Single state machine (XState or Zustand), single WebSocket client, single barge-in semantics. Delete the dormant duplicates.

**Effort:** 2 weeks. **Payoff:** the next voice bug gets fixed once, not three times.

---

## P2 — Observability & Cost

### 14. Per-stage latency telemetry, surfaced.

**Problem.** `_record_turn_telemetry()` (`voice_companion_wss.py:142`) captures `first_audio_byte_ms`, `tier_used`, `filter_pass_rate`, `cache_hit`, `barge_in_token_idx` — beautiful. But there's no dashboard, no alert, and chat-mode latency isn't even captured.

**Fix.**

1. Emit OpenTelemetry spans per stage: `vad`, `stt`, `wisdomcore_retrieve`, `prompt_compose`, `llm`, `filter`, `tts`, `audio_first_byte`. Use the existing `openai_optimizer.py:63–80` Prometheus path as the metrics backend.
2. Grafana dashboard with the four critical lines: p50/p95 per stage, cache hit ratio, filter PASS-rate, cost per turn (you already have token counts and provider; multiplication is trivial).
3. Alert on: cache_hit_ratio < 30 %, filter_pass_rate < 90 %, p95 first-byte > 1.5 s, cost-per-MAU > target.

**Effort:** 1 week. **Payoff:** you can finally answer "is voice getting faster or slower this month?"

---

### 15. Cost-aware routing.

**Problem.** Today provider selection is by capability (Indic → Sarvam, English → ElevenLabs). It ignores token cost, time-of-day pricing, and user tier.

**Fix.** Extend `voice_compute_policy.py:select()` with a cost gate:
- Free tier: capped at $0.02/MAU/day → forces gpt-4o-mini (already default) + Piper (after P1.7) + cache-only on identical queries.
- Sadhak/Siddha/Divine tiers: progressively more headroom for ElevenLabs, longer responses, multi-LLM consensus.
- Burst protection: when daily $ spend > 80 % of plan, all new requests get the canned-fallback tier-4 path.

**Effort:** 1 week. **Payoff:** product economics survive a viral spike without taking the service down.

---

## P2 — The Dynamic Wisdom Daemon (revisit when launched)

The daemon (`backend/services/kiaan_learning_daemon.py`, ~1 237 LOC) is dormant for sound legal reasons (`AUDIT_VOICE_DEEP.md` Q3). When it's time to activate:

1. **Per-source license whitelist**, not a domain whitelist. Each ingestion candidate must carry an explicit license tag (`CC-BY-SA`, `CC0`, `PD-pre-1928`, etc.) or be rejected.
2. **Two-stage filter**: copyright-scrubber *before* Gita-compliance. Phrase-similarity check against a denylist seeded from `ip-hygiene.yml` (Prabhupada, Easwaran, ISKCON characteristic phrasings).
3. **Retention policy**: TTL on `learned_wisdom` rows with `usage_count < 3` after 90 days. Otherwise the table grows ~250 MB–2 GB/year unboundedly per `AUDIT_VOICE_DEEP.md` Q3 projection.
4. **Effectiveness telemetry feedback loop**: rows with `quality_score` consistently below 0.4 → auto-`validation_status = rejected` rather than served.

---

## What NOT to do

A short list, because adding surface area is the enemy:

- Don't add a fifth pipeline. Three is already two too many.
- Don't add a new LLM provider before consolidating the existing call path through `provider_manager`.
- Don't add per-tool caching infrastructure — one cache, keyed by `(user_segment, tool_name, locale, verse_refs, normalized_msg)`, is enough.
- Don't roll a new VAD / wake-word stack. The dormant `useWakeWord.ts` works; wire it before replacing it.
- Don't add multimodal (image / video) until items 1–4 ship. The chat surface still has bypassed gating.
- Don't ship multi-language until `hi.json` is licensed. Sanskrit + English is fine for v1.

---

## Suggested sprint sequence

| Sprint | Items | Outcome |
|---|---|---|
| Sprint 1 (this) | 1, 2, 3, 4 — connective tissue | One gated call path; identical chat + voice grounding; semantic cache live |
| Sprint 2 | 5, 8, 10 — streaming + code-switching + tool envelopes | Chat feels as fast as voice; Hinglish flows; LLM gets structured tool inputs |
| Sprint 3 | 6, 11 — local LLM fallback + golden answers | "Independence" stops being marketing; quality regressions caught on PR |
| Sprint 4 | 7 — on-device VAD + Piper TTS | Offline-capable voice on web |
| Sprint 5 | 12, 13 — native Android STT + shared voice hooks | Android latency win; one hook ecosystem |
| Sprint 6 | 14, 15 — telemetry dashboards + cost-aware routing | Ops gets observability; economics are bounded |
| Q2 | 9, 16 — Assistant text route + daemon revival prep | Fourth engine becomes addressable; daemon ready when legal greenlights |

Total: **~14 engineer-weeks** for a senior pair to move MindVibe from "advanced prototype with one production-ready surface" to "single coherent stack, on-device-capable, sub-second, observable, defensible IP."

---

## The single sentence summary

**MindVibe doesn't need more AI — it needs one path. Push WisdomCore + Gita filter + cache into `call_kiaan_ai`, delete the two parallel prompt-composers, ship a small bundled local model so the framework stops lying about independence, wire memory into the voice turn, and put the existing telemetry on a Grafana dashboard. Three sprints. The rest is polish.**
