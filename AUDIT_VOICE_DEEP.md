# MindVibe — Voice Companion Deep Audit: Engines, Device Acceleration, Wisdom DB & IP Risk

**Audit date:** 2026-05-16
**Branch:** `claude/audit-cache-framework-CpSVN`
**Scope:** Three deep-dive questions the user raised after the voice-framework audit.

---

## Q1 — Does the Voice Companion have three engines (Guidance / Friendly / Navigational)?

### Verdict: **PRESENT — but it is actually a 4-engine system, with 3 of the 4 active in voice mode.**

The marketing copy says three; the code declares four; voice mode suppresses the fourth.

### The enum that settles it

`backend/services/kiaan_engine_router.py:39–43`

```python
class EngineType(str, Enum):
    GUIDANCE   = "guidance"
    FRIEND     = "friend"
    ASSISTANT  = "assistant"
    VOICE_GUIDE = "voice_guide"
```

The same file at line 136: *"ASSISTANT is suppressed unless intent is unambiguous."* So in voice mode there are exactly three active engines, which map to the user's mental model as follows:

| User's term | Code name | Module | One-line role |
|---|---|---|---|
| **Guidance** (through Wisdom Core) | `GUIDANCE` | `backend/services/kiaan_unified_voice_engine.py:54`; routing patterns at `kiaan_engine_router.py:77` | Spiritual guidance — Bhagavad-Gita wisdom + behavioural science, fed by WisdomCore (Static + Dynamic) |
| **Friendly Engine** | `FRIEND` | `backend/services/companion_friend_engine.py` (`CompanionFriendEngine` class); registered in `kiaan_unified_voice_engine.py`; lazy-loaded via `_get_companion_engine()` | Best-friend persona with cross-session memory; emotion-keyword router at `kiaan_engine_router.py:92` |
| **Navigational Engine** | `VOICE_GUIDE` | `kiaan_unified_voice_engine.py:20–24, 60–70`; patterns at `kiaan_engine_router.py:86` | "Ears and hands" — intent routing, tool navigation, media/device control. Actions: `NAVIGATE`, `INPUT_TO_TOOL`, `CONTROL`, `MOOD_CHECK`, `DAILY_WISDOM`, `VERSE_LOOKUP`, `START_SESSION`, `END_SESSION` |
| (hidden fourth) | `ASSISTANT` | `kiaan_engine_router.py:42`, `:69 ASSISTANT_PATTERNS` | Task executor; suppressed in voice mode by design |

### How they wire together at runtime

```
                  user_message arrives at orchestrator
                            │
                            ▼
              get_engine_router().route(message, voice_mode=True)
                            │       (kiaan_engine_router.py:153)
                            ▼
                  RoutingDecision {
                      primary_engine    : EngineType
                      secondary_engines : list[EngineType]
                  }
                            │
                            ▼
              voice/orchestrator.py:177  _route_engine(ctx.user_latest)
                            │
                            ▼
              ServerEngineFrame(selected = primary.value.upper())
                            │
                            ▼
              voice/orchestrator_types.py:61
                  VoiceTurnResult.engine_selected
                            │
                            ▼
                        telemetry
```

Routing priority (`kiaan_engine_router.py:131–135`):
- Casual / short queries → **FRIEND** ("warmth wins over wisdom")
- Wisdom-direct queries with guidance score ≥ 0.4 → **GUIDANCE**
- Navigation-intent queries → **VOICE_GUIDE**
- Ambiguous task intent → **ASSISTANT** (otherwise suppressed)

### Self-description in the unified engine file

`backend/services/kiaan_unified_voice_engine.py:31–33` (its own docstring):

> "Voice Guide is the 'ears and hands', Guidance Engine is the 'wisdom', Friend Engine is the 'heart', and Assistant Engine is the 'executor'."

### Where it's announced at boot

`backend/main.py` startup log:

```
✅ [SUCCESS] KIAAN Unified Voice Companion router loaded (3-Engine System)
   ENGINE 1 - GUIDANCE: Bhagavad Gita wisdom + behavioral science
   ENGINE 2 - FRIEND: Best friend personality + cross-session memory
   ENGINE 3 - VOICE GUIDE: Always-awake + ecosystem navigation + tool input
```

So the **user's three-engine framing is correct** for the voice-mode runtime. The naming difference is purely cosmetic — *VOICE_GUIDE* is what the code calls the *Navigational Engine*. KIAAN and Sakha are the same: KIAAN is the framework name, Sakha is the persona.

---

## Q2 — Does it work per device configuration and use GPU / CPU / NPU?

### Verdict: **DETECTION YES, EXECUTION MOSTLY NO.**

The plumbing to discover GPU / NPU / CPU and to *route* accordingly is real. The models that would actually use that hardware on-device are **not bundled**. So today the system is **CPU- and network-adaptive** but not **on-device-GPU/NPU-accelerated**. Server-side GPU code exists but the deployment infrastructure does not provision a GPU.

### What IS implemented (with evidence)

**Client-side device detection**

| Capability | File:line | What it does |
|---|---|---|
| WebGPU | `utils/hardware/deviceCapabilities.ts:68–126` | `navigator.gpu.requestAdapter()`, WebGL fallback for GPU tier (integrated vs discrete) |
| WebNN (NPU) | `utils/hardware/deviceCapabilities.ts:214–215`; `lib/kiaan-voice/web-engine.ts:150–168` | Checks `'ml' in navigator`; calls `navigator.ml.createContext({deviceType:'gpu'})` |
| CPU cores | `utils/hardware/deviceCapabilities.ts` | `navigator.hardwareConcurrency` |
| RAM | same | `navigator.deviceMemory` |
| Battery / thermal | `utils/hardware/deviceCapabilities.ts:251–326` | Battery API, throttling heuristics |
| Network type | same | `navigator.connection.effectiveType` |
| Tier classifier | `utils/browserSupport.ts:187–213` | Tier 1 (8 GB + WebGPU), Tier 2 (4–7 GB), Tier 3 (mobile / no WebGPU) |
| Re-detection loop | `AdaptiveComputeManager`, line 398 | Re-evaluates every 30 s, emits policy change |

**Server-side selection policy**

`backend/services/voice_compute_policy.py:107–196` — `VoiceComputePolicy.select()` switches on `DeviceInfo.{device_type, battery_level, is_thermal_throttled, network, supports_webnn, has_npu, user_tier}` and chooses provider chains:
- `_low_battery_policy()` (`:135`), `_thermal_policy()` (`:140`), `_edge_ai_policy()` (`:162`)
- Discrete GPU + WebGPU → `silero` TTS + `whisper_local` STT (`:178–185`)
- WebNN / NPU → `whisper_local` STT + `piper` TTS (`:146–152, 169–176`)

**On-device CPU compute that actually runs**

| Function | File:line | Status |
|---|---|---|
| Silero VAD via ONNX-Runtime-Web | `hooks/useVoiceActivityDetection.ts:182–200` | ✅ Active — `env.wasm.numThreads = min(hardwareConcurrency, 4)` |
| Model file | `public/vad/silero_vad_legacy.onnx` (~ ½ MB) | ✅ Bundled |
| Worklet | `public/vad/vad.worklet.bundle.min.js` | ✅ Bundled |
| Gated on tier | `:154–158` — disabled if cores < 4 or RAM < 4 GB | ✅ Wired |

**Server-side GPU code path**

`backend/services/whisper_transcription.py:148–164` detects CUDA / Apple MPS:

```python
if torch.cuda.is_available():    self.device = "cuda"
elif torch.backends.mps.is_available(): self.device = "mps"
else:                            self.device = "cpu"
self.compute_type = "float16" if self.device == "cuda" else "int8"
```

### What is NOT implemented

| Gap | Evidence |
|---|---|
| On-device STT model bundled | No Whisper.cpp / Moonshine / Whisper-ONNX in `public/` or `vendor/` — only the Silero **VAD** model |
| On-device TTS model bundled | No Piper voice (`*.onnx`), no Coqui XTTS — TTS always goes through Sarvam / ElevenLabs / Edge |
| On-device LLM | `kiaan_model_provider.py` references `LLAMA_CPP_AVAILABLE` but no `.gguf` model is in tree; the path is gated `False` by default |
| Server GPU instances | `Dockerfile` is `python:3.11-slim`, no CUDA libs; `render.yaml` plan is `standard` (no GPU); `requirements.txt` has neither `torch` nor `faster-whisper` |
| Codec / sample-rate adaptation | No branch in `useVoiceInput` / `useVoiceOutput` swaps Opus↔PCM by tier |
| Mobile-native NPU bridges | No NNAPI / Qualcomm SNPE / CoreML bundle in `kiaanverse-mobile/native/` |

### One-paragraph blunt summary

The client detects WebGPU, WebNN, CPU cores, RAM, battery, thermal state, and network type, and the server has a `VoiceComputePolicy` that routes based on that telemetry. But the *only* on-device inference that actually executes is **Silero VAD** running on CPU via ONNX-Runtime-Web. STT and TTS always go to a cloud provider; the LLM always goes to OpenAI. Server-side CUDA / MPS code paths exist in the Whisper module but the Render deployment uses a non-GPU plan and does not even install `torch`. So device-awareness is real and adaptive, but **GPU and NPU detection currently only changes which cloud provider is called, not where the model runs**.

---

## Q3 — How big is the Dynamic Wisdom DB, and any copyright / patent infringement risk?

### Verdict on size: **0 rows. The schema and 24/7 daemon are built; the table is empty in production.**

### Verdict on IP: **Copyright LOW today, MEDIUM-HIGH at launch unless Hindi translation source is resolved. Patent LOW (a defensive provisional draft is ready, deadline 2026-06-03).**

### Dynamic Wisdom — what's actually in the database

**Schema:** `backend/models/ai.py:55–136`, table `learned_wisdom`.

Fields: `id`, `content`, `source_type` (one of: `youtube | audio | web | podcast | book | manual`), `source_url`, `source_name`, `language`, `chapter_refs[]`, `verse_refs[][]`, `themes[]`, `shad_ripu_tags[]`, `keywords[]`, `quality_score` (0–1), `validation_status` (`pending | validated | rejected`), `usage_count`, `embedding[]`.

**Population mechanism:** `backend/services/kiaan_learning_daemon.py` (~1 237 LOC) — a 24/7 worker that:
1. Fetches from YouTube transcripts, audio platforms, web sources.
2. Validates each candidate against the 700-verse Gita via `GitaValidator` (`kiaan_learning_engine.py`).
3. Buffers in memory (batch flush every 60 s or 100 items).
4. Writes validated items to `learned_wisdom`.

**Live state today:**
- **Rows in `learned_wisdom`: 0** — the daemon is gated by `KIAAN_DAEMON_ENABLED` and is not running.
- The three "trusted Gita sources" in `kiaan_learning_engine.py:56–57` are explicitly **redacted** with the marker `"REMOVED-PENDING-LICENSE-REVIEW"`.
- Daemon-emitted metrics (~25 counters in `dynamic_wisdom_corpus.get_runtime_metrics()`) are dashboard-ready but show zero throughput.

**Projected size if turned on:** 1 fetch / hour × 20–40 items/cycle × 24 cycles ≈ 480–960 rows/day. At 0.5–2 KB content per row that is roughly 250 MB – 2 GB / year of `learned_wisdom`. No retention policy is visible in the model.

### Static Wisdom — for baseline

`data/gita/` inventory (verified by hand):

| File | Bytes | Verse entries | Translation populated? |
|---|---:|---:|---|
| `gita_verses_complete.json` | 616 896 | 701 chapter entries | ✅ Sanskrit complete |
| `sa.json` | 545 796 | full | ✅ Sanskrit / IAST |
| `en.json` | 408 575 | 720 verse skeletons | ❌ All `"translation": ""`; each row carries `"_translation_pending": "besant_1905_pd_backfill"` |
| `hi.json` | 408 573 | 720 verse skeletons | ❌ All empty; **no translator identified** |
| `chapter_metadata.json` | 6 876 | 18 | — |
| `themes.json` | 17 177 | — | — |

So the project ships **700 Sanskrit verses populated, with 720 English and 720 Hindi placeholder rows whose translations are deliberately blank**. The earlier agent's "3-verse stub" summary was incorrect; the rows exist, the translation strings are empty by design pending a clean licensing decision.

### Copyright risk — by surface

| Surface | Risk | Evidence |
|---|---|---|
| Sanskrit text | **LOW** | Public domain (pre-1900 ancient text) |
| English translation source | **MEDIUM** | `OPEN_SOURCE_LICENSES.md:22–31` names Annie Besant 1905 + Telang 1882 (both globally PD if dates are correct), but `PROVENANCE.md:48–54` marks the source as **"TBD pending counsel confirmation"**. `legal/LEGAL_RISK_INVENTORY_2026-05-16.md:65` flags this as **"open, blocks public release"**. |
| Hindi translation source | **HIGH** | `PROVENANCE.md:56–60` is entirely **TBD** — no translator, no edition, no license. `legal/LEGAL_RISK_INVENTORY_2026-05-16.md:66`: **"open, blocks public release"**. |
| Dynamic Wisdom corpus | **MEDIUM in theory, ZERO today** | Daemon ingests third-party content (YouTube, web) and validates only for Gita-compliance, not for copyright. Prabhupada (ISKCON) and Eknath Easwaran translations are **still under copyright** in 2026; if either appeared in a transcript and were auto-ingested, that would be direct infringement. Mitigation: daemon is **not active**; the trusted-source list is **redacted**. |
| Persona prompts | **LOW** | `prompts/sakha.text.openai.md` and `prompts/sakha.voice.openai.md` are placeholder files in the OSS distribution; the real prompts live elsewhere. No third-party copyrighted text appears in the public tree. |
| Tool prompts (Ardha, Viyoga, KarmaLytix, etc.) | **LOW** | Original; no quoted material detected. |

**CI guard rails in place** — `.github/workflows/ip-hygiene.yml` blocks ~50 forbidden source URLs (vedabase.io, asitis.com, ISKCON domains) and ~30 signature phrases like "Supreme Personality of Godhead" from ever being committed. This is a meaningful defensive control.

### Patent risk

| Item | Status |
|---|---|
| Provisional patent draft | `legal/US_PROVISIONAL_PATENT_DISCLOSURE_DRAFT.md` exists, **not yet filed** |
| Filing deadline | **2026-06-03** (~ 18 days from this audit, anchored to first public commit 2026-04-19) |
| Claims proposed | (1) System: dharmic-tag semantic retrieval + mood→tag mapping + per-verse effectiveness learning + multi-provider orchestration. (2) Method form of same. (3) Non-transitory CRM. |
| FTO (Freedom-to-Operate) search | **Not done.** `legal/LEGAL_RISK_INVENTORY_2026-05-16.md:81` notes "FTO search not done ($2–4 k counsel cost)" |
| Inventor name / micro-entity status | TBD |
| Filing cost | $120 USPTO micro-entity + ~$1.5–3 k drafting ≈ $2–3.5 k total |

**Specific infringement-risk surfaces** to FTO-search before launch:
1. **Voice barge-in with token-index tracking** (`voice/orchestrator.py`, `voice/schemas.py`) — Nuance, Amazon, SoundHound hold barge-in patents; this is the most likely prior-art collision.
2. **Effectiveness-weighted retrieval** (`dynamic_wisdom_corpus.py:50–63`, `:109–124`) — adjacent to Spotify "Daily Mix" and Netflix recommender patents; the dharmic-tag specificity is the novelty hook.
3. **Mood→content mapping with confidence-weighted sample-size ranking** — standard ML technique, low novelty; cite as "background art" rather than claim.

### What must happen before public launch (from `legal/LEGAL_RISK_INVENTORY_2026-05-16.md`)

1. **`data/gita/en.json`** — confirm Annie Besant 1905 source provenance and PD status.
2. **`data/gita/hi.json`** — identify translator, edition, license. **Currently blocks launch.**
3. **`OPEN_SOURCE_LICENSES.md:20–36`** — document exact source URLs for both translations.
4. **`legal/US_PROVISIONAL_PATENT_DISCLOSURE_DRAFT.md`** — counsel decision and filing by 2026-06-03.
5. FTO search before any patent assertion.
6. If/when the `learned_wisdom` daemon is enabled: an explicit per-source license whitelist (not just a domain whitelist) and a copyright-scrubber on transcript ingestion.

---

## Summary of the three answers

1. **Three engines?** Yes — `GUIDANCE`, `FRIEND`, and `VOICE_GUIDE` (which is the user's "Navigational Engine"). A fourth, `ASSISTANT`, exists in the enum but is suppressed in voice mode. Routing is centralised in `kiaan_engine_router.EngineRouter.route()` and emitted to the client via `ServerEngineFrame`.

2. **Device-aware GPU/CPU/NPU?** Detection is comprehensive (WebGPU, WebNN, CPU cores, RAM, battery, thermal, network); routing policy reacts to it both client- and server-side. But the only on-device inference that actually executes is Silero **VAD** on CPU via ONNX-Wasm. No Whisper / Piper / llama.cpp model is bundled, and the Render deployment uses a non-GPU plan. Net: GPU/NPU detection currently picks which *cloud* provider is called — it doesn't change *where* the model runs. The phrase "uses the device's GPU and NPU" is aspirational.

3. **Dynamic Wisdom DB & IP?** Schema is `learned_wisdom` (`backend/models/ai.py:55–136`); a 24/7 daemon (`kiaan_learning_daemon.py`, ~1 237 LOC) is built but **not running** — 0 rows today. Projected throughput if enabled: ~480–960 rows/day, ~250 MB–2 GB/year. **Copyright risk today is LOW** because the daemon is dormant and the trusted-source list is redacted; it becomes **MEDIUM–HIGH at launch** unless the Hindi-translation source (`data/gita/hi.json`) is identified and licensed (`PROVENANCE.md:56–60` is entirely TBD; this currently blocks public release per `legal/LEGAL_RISK_INVENTORY_2026-05-16.md:66`). **Patent risk is LOW**: a US provisional draft is ready (`legal/US_PROVISIONAL_PATENT_DISCLOSURE_DRAFT.md`) with a 2026-06-03 filing deadline; FTO search is the missing step.
