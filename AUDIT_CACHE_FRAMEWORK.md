# MindVibe — Proof-Reader Audit: Response Cache + KIAAN Framework Independence

**Audit date:** 2026-05-16
**Branch:** `claude/audit-cache-framework-CpSVN`
**Scope:** Three targeted questions
1. Is a response cache present and serving identical-question replies across **all** sacred tools, KIAAN Chat, Sakha Chat, and Voice Companion?
2. As an *Independent AI Framework*, how much of KIAAN is present and functional?
3. Do OpenAI / Sarvam / Anthropic answer **only** through WisdomCore (Static + Dynamic wisdom)?

Method: full-tree scan (server `backend/`, web `app/` + `lib/` + `components/`, mobile `kiaanverse-mobile/`, service workers in `public/`, tests, prompts, data).

---

## PART 1 — RESPONSE CACHE FOR IDENTICAL QUESTIONS

### Verdict

**PARTIALLY TRUE.** Three cache implementations exist in the codebase, but only **one surface (Voice Companion)** actually serves cached replies in production. KIAAN Chat, Sakha Chat, and every sacred tool route bypass the cache entirely and hit the upstream LLM on every request. There is **no semantic similarity** layer — only exact-text hashing — so "100% similar" is true only for byte-identical (after `lower().strip()`) inputs.

### Coverage matrix

| Surface | Route | Cache present? | Cache wired? | Evidence | Status |
|---|---|---|---|---|---|
| **KIAAN Chat** | `POST /api/kiaan/chat` | Redis layer defined | ❌ **NOT wired** | `backend/routes/kiaan.py:215` → `_handle_sakha_chat` → `_run_ai` → `call_kiaan_ai` (`backend/services/ai_provider.py:135`) — no cache lookup on the path | DEAD CODE |
| **Sakha Chat** | `POST /api/sakha/chat` | Redis layer defined | ❌ **NOT wired** | Same path as KIAAN Chat (`backend/routes/kiaan.py:227`) | DEAD CODE |
| **Voice Companion** | `POST /api/voice-companion/message` | In-memory LRU | ✅ **Wired** | `backend/routes/kiaan_voice_companion.py:1198` (get), `:1247` (set) | **ACTIVE** |
| **Emotional Reset** | `POST /api/kiaan/tools/emotional-reset` | — | ❌ | `backend/routes/kiaan.py:240` → `_run_ai` (no cache) | NOT WIRED |
| **Ardha** (reframing) | `POST /api/kiaan/tools/ardha` | — | ❌ | `backend/routes/kiaan.py:272` | NOT WIRED |
| **Viyoga** (detachment) | `POST /api/kiaan/tools/viyoga` | — | ❌ | `backend/routes/kiaan.py:306` | NOT WIRED |
| **Karma Reset** | `POST /api/kiaan/tools/karma-reset` | — | ❌ | `backend/routes/kiaan.py:339` | NOT WIRED |
| **Sambandh Dharma** | `POST /api/kiaan/tools/sambandh-dharma` | — | ❌ | `backend/routes/kiaan.py:372` | NOT WIRED |
| **KarmaLytix** | `POST /api/kiaan/tools/karmalytix` | — | ❌ | `backend/routes/kiaan.py:405` | NOT WIRED |
| **Summary Generator** (offline) | internal | Redis | ✅ Wired | `backend/services/summary_generator.py:75, 116` | ACTIVE (back-office only) |
| **Sacred Reflections** | via KiaanCore | Redis (enhanced) | ✅ Wired | `backend/services/kiaan_core.py:872, 1079` | ACTIVE (limited reach) |
| **Client-side / IndexedDB** | offline cache | — | ❌ | `lib/offline/indexedDB.ts:346` — `getCachedResponse()` defined, never imported for chat | ORPHANED |

**Score: 1 of 9 user-facing chat/tool surfaces actually serves cached replies.**

### How the (wired) cache key is built

Voice Companion — the only path that actually hits the cache:

```
backend/routes/kiaan_voice_companion.py:109–111
   key = sha256(f"{mood}|{phase}|{lang}|{message.strip().lower()}").hexdigest()[:32]
```

- Normalization: `strip()` + `lower()`.
- Components: mood + phase + language + message.
- Hash: SHA-256, 32-char prefix.
- Storage: module-level `dict` `_response_cache` (`:94–97`), TTL 3600 s, max 500 entries, LRU eviction, `threading.Lock`.

Same shape (lower+strip+sha256) is defined for Redis in `backend/cache/redis_cache.py:580–625` and `backend/services/redis_cache_enhanced.py:339–375` — but the producers (`call_kiaan_ai`, the tool routes) never call them.

### Similarity matching

**Exact-text only.** Confirmed by:

- No `embedding`, `cosine`, `faiss`, `pgvector`, `ann`, or `similarity_threshold` call sites on the chat/cache path.
- The only embeddings code (`backend/services/rag_service.py`) is for verse retrieval, not for cache key collapse.

Consequence: `"I feel anxious"` and `"i'm feeling anxious"` are **cache misses** against each other. The "100% similar" claim is technically satisfied (exact-after-normalization = 100% match), but the colloquial reading ("similar enough") is **not**.

### Backend, TTL, scope, privacy

| Property | Voice Companion (in-mem) | Redis KIAAN | Redis Enhanced |
|---|---|---|---|
| Backend | Python `dict` | Redis | Redis |
| TTL | 3600 s | 3600 s | 3600 s |
| Eviction | LRU @ 500 | Redis policy | Redis policy |
| Per-user scoping | ❌ Global | ❌ Global | ❌ Global |
| Personalization guard | ✅ Skips when `memories` non-empty (`kiaan_voice_companion.py:134`) | ❌ None | ❌ None |
| Process scope | Single-process only | Multi-process | Multi-process |

> **Privacy finding (medium):** the wired in-memory cache is *global, not per-user*. With personalization guarded out it is acceptable in practice, but the unwired Redis layers, if turned on as-is, would let user B retrieve user A's response to an identical prompt. Recommend prefixing the cache key with `user_id` (or a coarse-grained `user_segment`) before enabling them on KIAAN/Sakha/tool routes.

### Configuration-vs-reality mismatch

- `.env.example` and `backend/core/settings.py` expose `REDIS_ENABLED=true`, `CACHE_KIAAN_RESPONSES=true`. Both default ON. Reading the env, an operator would expect KIAAN/Sakha chat to be cached — but the code path doesn't honour it. The settings are **silent no-ops** for the main chat surfaces.

### What's needed to fulfil the claim

1. In `backend/services/ai_provider.py:135` (`call_kiaan_ai`), wrap the OpenAI/Sarvam call with `redis_cache.get_cached_kiaan_response()` / `cache_kiaan_response()`.
2. Apply the same wrapper to each of the six tool routes in `backend/routes/kiaan.py:240–454`.
3. Prefix cache keys with `user_id` (or `user_id|locale|mood`) for privacy.
4. Add an embedding-based near-duplicate check (1–2 ms cost) before the LLM call to actually deliver "100% similar" in the colloquial sense.
5. Wire `lib/offline/indexedDB.ts` `getCachedResponse()` into the web client's chat send path so repeat questions return instantly offline.

---

## PART 2 — KIAAN AS AN INDEPENDENT AI FRAMEWORK

### Verdict

**Independence ≈ 35–40 %.** KIAAN ships substantial original infrastructure (Gita corpus, prompt library, memory, safety filter, voice pipeline, caching scaffolds, evaluation tests), but **all reasoning is delegated to OpenAI / Sarvam / Anthropic**. The provider abstraction supports a local-LLM fallback (Ollama / llama.cpp) but it is **not wired into the production code path** and no model is bundled. Without cloud keys, KIAAN can serve verses, templates, and memory — it cannot reason, reframe, or synthesise.

### Original vs. delegated stack

| Layer | Original (KIAAN) | Delegated (3rd-party) |
|---|---|---|
| Core reasoning / generation | — | OpenAI gpt-4o-mini (primary), Sarvam, Anthropic |
| Embeddings | — | OpenAI `text-embedding-3-small` |
| Gita corpus (701 verses) | ✅ `data/gita/gita_verses_complete.json` | — |
| Prompt library (Sakha persona + 6 tool prompts) | ✅ `backend/services/ai_provider.py:46–94` | — |
| Memory (session + long-term) | ✅ `backend/services/kiaan_memory.py:45+` (SQLite + Redis) | — |
| Safety / Gita-grounding filter | ✅ `backend/services/gita_wisdom_filter.py`, `safety_validator.py`, `moderation_service.py` | — |
| Voice STT routing | ✅ `backend/services/voice/stt_router.py` (Whisper, Silero, Vosk, Bhashini) | Inference engines (some local, some remote) |
| Voice TTS routing | ✅ `backend/services/voice/tts_router.py` | All inference (ElevenLabs, Sarvam, Piper…) |
| Caching | ✅ Redis + in-mem + SQLite offline cache | — |
| Cost / token metrics | ✅ Prometheus in `backend/services/openai_optimizer.py:63–80` | — |

Rough composition: **~25 % original code, ~75 % delegated to commercial LLMs.**

### Component matrix

| # | Component | Status | Wired? | Evidence |
|---|---|---|---|---|
| 1 | **Provider abstraction / fallback** | PRESENT | ✅ | `backend/services/ai/providers/provider_manager.py:55–100` — OpenAI → Sarvam → OpenAI-compatible. **No local-LLM branch in the fallback chain.** |
| 2 | **Prompt management** | PRESENT | ✅ | `ai_provider.py:46–94`; `_TOOL_CONTEXTS` with 6 tool prompts |
| 3 | **RAG over Gita corpus** | **PARTIAL** | ❌ Not in main chat | `backend/services/rag_service.py:24–150` (pgvector + OpenAI embeddings) is only called from `backend/routes/wisdom_guide.py`. `call_kiaan_ai` uses keyword lookup (`gita_wisdom_retrieval.py:97–150`), not RAG. |
| 4 | **Memory (short + long term)** | PRESENT | ✅ partial | `kiaan_memory.py` — session memory wired in `routes/chat.py`; long-term learning engine (`kiaan_learning_engine.py`) is scaffolding only |
| 5 | **Tool / function calling** | **PARTIAL** | ⚠️ scaffolding only | `kiaan_agent_tools.py:45–100` defines 6 tools with `.get_schema()` — but no route invokes `execute_tool()`; KIAAN chat is single-turn |
| 6 | **Agent orchestration** | **PARTIAL** | ❌ | `kiaan_agent_orchestrator.py:55–100` defines `AgentMode`, `ExecutionPlan`, iterative refinement — but `routes/kiaan.py` never calls the orchestrator |
| 7 | **Caching (exact + offline)** | PRESENT | ✅ in `KiaanCore`, Voice Companion; not on chat/tool routes | See Part 1 |
| 8 | **Guardrails / safety / Gita grounding** | PRESENT | ✅ | `gita_wisdom_filter.py`, `safety_validator.py:17–80`, crisis detection in `routes/chat.py` |
| 9 | **Evaluation harness** | **PARTIAL** | ✅ unit tests; ❌ golden-trace regression | `tests/unit/test_kiaan_core.py`, `tests/test_gita_adherence.py`, `tests/test_ardha_reframing_engine.py`; no recorded golden answers in repo |
| 10 | **Streaming, token & cost accounting** | PRESENT | ✅ | `openai_optimizer.py:63–80` Prometheus metrics; `kiaan_core.py:520–630` `get_kiaan_response_streaming` |
| 11 | **Voice pipeline (STT→LLM→TTS)** | PRESENT | ✅ | `kiaan_unified_voice_engine.py:41–150` end-to-end; routed by `routes/voice.py` |
| 12 | **Personalization (state / history / journey)** | **PARTIAL** | ✅ context-injection only | User context concatenated into prompt; no KIAAN-side adaptive reasoning — OpenAI does the adaptation |

### Independence test — disable all cloud LLM keys

What still works:

- ✅ Auth, profile, mood logging
- ✅ Gita verse retrieval (all 701 verses, chapter/theme/keyword)
- ✅ Keyword Gita search for Viyoga, Sambandh Dharma, Emotional Reset
- ✅ Pre-cached / template fallback responses (`kiaan_core.py:591–592`)
- ✅ Session + long-term memory (SQLite)
- ✅ Voice STT — local engines (Silero, Vosk) are genuinely offline-capable

What breaks:

- ❌ Reasoning, reframing, synthesis — every "thinking" step
- ❌ Semantic verse search (depends on OpenAI embeddings)
- ❌ Voice TTS — every wired provider is remote (Sarvam, ElevenLabs); Piper exists in router but no model bundled
- ❌ Tool execution / agent orchestration — needs an LLM for planning
- ⚠️ Local-LLM path: `kiaan_model_provider.py` references `LLAMA_CPP_AVAILABLE` and `complete_offline()` (around L611) — but no model is downloaded by setup, the path is gated by `local_models.has_any_model()` which returns False by default, and CI never exercises it

**Practical offline functionality ≈ 40 %.**

### Test / health surface

- Health endpoints exist: `GET /api/kiaan/health`, `/api/chat/health`, `/api/voice-companion/health`, `/api/monitoring/health/detailed`.
- Unit tests run; coverage gate is 49 % (README L454) — low for a "framework".
- No golden-answer regression set, no recorded traces, no load-test artefacts in repo.

### Top 5 gaps preventing true framework independence

1. **No local-LLM fallback wired.** `kiaan_model_provider.complete_offline()` exists but `ProviderManager` never tries it. Bundle a small Ollama/llama-cpp model (e.g. Phi-3-mini, Qwen-2.5-1.5B) and add it as the last hop in the fallback chain.
2. **RAG is built but bypassed.** `rag_service.semantic_search()` must replace the keyword lookup inside `call_kiaan_ai` for verse grounding.
3. **Agent orchestrator is dead code.** Wire `kiaan_agent_orchestrator` into `/api/kiaan/chat` so the framework can actually do multi-step reasoning; otherwise the "framework" tag is aspirational.
4. **Personalisation is prompt-injection only.** Adaptive system-prompt construction based on user mood trend, journey day, and prior memories needs to live in KIAAN before delegation, not after.
5. **No offline TTS.** Ship a Piper ONNX voice in `vendor/` or `public/` so the voice loop closes without network.

### Top 3 strengths already in place

1. **Authentic Gita corpus + spiritual safety stack** — 701 verses with Sanskrit + IAST + translations, crisis detection, Gita-grounding filter, religious sanitization. This is the genuinely original heart of KIAAN.
2. **Full voice pipeline** — modular STT and TTS routers with multi-provider fan-out; multilingual; already powering web + mobile.
3. **Memory + caching scaffolding** — `kiaan_memory.py`, `kiaan_core.py` offline wisdom cache, `redis_cache_enhanced.py` are production-quality components ready to be wired more broadly.

---

---

## PART 3 — DO OPENAI / SARVAM / ANTHROPIC ANSWER ONLY THROUGH WISDOMCORE?

### Claim

> "OpenAI, Sarvam, Anthropic — they answer only through WisdomCore, which contains Dynamic wisdom and Static wisdom."

### Verdict

**PARTIALLY TRUE — architecturally real, route-by-route enforced, not globally gated.** WisdomCore exists as actual code (not marketing). Static and Dynamic wisdom are named, distinct, persisted modules. The Gita Wisdom Filter is wired into several routes as a post-LLM gate. **However**, the two highest-traffic surfaces — `/api/kiaan/chat` and `/api/sakha/chat` — go through `backend/services/ai_provider.py` which calls the providers **raw**, with no WisdomCore composition and no post-filter. So the claim holds for the *engineered sacred tools* (Ardha, Viyoga, Karma Reset, Sambandh Dharma, Emotional Reset) but **not for the main KIAAN/Sakha chat path** nor for KarmaLytix's direct Anthropic call.

### WisdomCore is real — the modules

| File | Role |
|---|---|
| `backend/services/wisdom_core.py` | `WisdomCore` class — composes **Static** (gita_verses table, 700+ verses) **+ Dynamic** (`learned_wisdom` table, populated by the 24/7 daemon). Provides `.search()`, `.get_by_domain()`, `.get_by_theme()`. |
| `backend/services/dynamic_wisdom_corpus.py` | Dynamic wisdom orchestrator — the runtime/learned layer. |
| `backend/services/relationship_wisdom_core.py:1173` | Domain-specific wrapper (relationship); lazy-loads `WisdomCore`. |
| `backend/services/gita_wisdom_filter.py:418` | `filter_response()` — **post-LLM gate** that validates Gita grounding and enhances if missing. |
| `backend/services/karmalytix_reflection.py:32` | `STATIC_WISDOM_CORE` dict — 16 curated verses (static fallback). |
| `backend/services/emotional_reset_service.py:173` | Explicit doc: "Tier 0: WisdomCore (full 700-verse Gita corpus + dynamic learned wisdom)". |

So **Static and Dynamic are not marketing terms** — they correspond to:
- **Static** → `gita_verses` table (immutable corpus) + `STATIC_WISDOM_CORE` constants.
- **Dynamic** → `learned_wisdom` table + `dynamic_wisdom_corpus.py` (daemon-populated, runtime-evolving).

### Per-provider gating (verified by grep)

| Provider | Static-wisdom inject pre-LLM | Dynamic-wisdom inject pre-LLM | `filter_response()` post-LLM | Production status |
|---|---|---|---|---|
| **OpenAI** | ✅ on engineered tools | ✅ on engineered tools | ✅ wired in `provider_manager.py:279`, `openai_optimizer.py:489`, `emotional_reset_service.py:392`, `routes/ardha.py:591`, `routes/viyoga.py:799`, `routes/karma_reset.py:244`, `routes/sambandh_dharma_engine.py:547` | **Gated on those routes** |
| **Sarvam** | ✅ via `RelationshipWisdomCore` on Sambandh Dharma | ✅ same | ✅ same routes when Sarvam selected | **Gated on Sambandh Dharma**, untested elsewhere |
| **Anthropic** | ❌ none in `ai_provider._call_anthropic()` (`ai_provider.py:301–340`) | ❌ none | ❌ no `filter_response()` on this path | **Not gated**. KarmaLytix calls Anthropic directly (`karmalytix_reflection.py:164` → POST to `api.anthropic.com`) with **only** the `STATIC_WISDOM_CORE` constant — **no dynamic layer**. |

Confirmed by `grep -n "filter_response" backend/services/ai_provider.py` → **zero matches**. The main provider router does not gate at all.

### Routes that DO honour the claim (WisdomCore + filter applied)

- `routes/ardha.py:591` — `gita_filter.filter_response(...)` after LLM.
- `routes/viyoga.py:799` — same.
- `routes/karma_reset.py:244` — same.
- `routes/sambandh_dharma_engine.py:547` — `wisdom_filter.filter_response(...)` after LLM; pre-LLM uses `RelationshipWisdomCore`.
- `services/emotional_reset_service.py:392` — same.
- `services/provider_manager.py:279` — newer abstract pipeline applies it for every provider that routes through it.

### Routes that BYPASS the claim (raw LLM, no WisdomCore)

| Route | File:line | Evidence |
|---|---|---|
| `/api/kiaan/chat` (KIAAN Chat) | `backend/routes/kiaan.py:215` → `ai_provider.call_kiaan_ai` | No `wisdom_core` / `filter_response` reference anywhere in `ai_provider.py` |
| `/api/sakha/chat` (Sakha Chat) | `backend/routes/kiaan.py:227` | Same path |
| `/api/kiaan/voice-companion/message` | `backend/routes/kiaan_voice_companion.py` | Streams provider response, no post-filter |
| `/api/guidance/*` | `backend/routes/guidance.py` | Direct OpenAI, no filter |
| `/api/chat/messages` (legacy) | `backend/routes/chat.py` | Raw provider |
| `/api/karmalytix/reflect` (Anthropic) | `backend/services/karmalytix_reflection.py:164` | Direct POST to `api.anthropic.com/v1/messages` with only `STATIC_WISDOM_CORE` (no dynamic layer, no filter) |

### Anthropic specifically

- Wiring exists (`ai_provider.py:301–340`, `karmalytix_reflection.py`), but:
  - `ai_provider._call_anthropic` is only reached when `AI_PROVIDER=anthropic` env is set — described in code comment as "(future)" (`ai_provider.py:11`).
  - When invoked, it is **un-gated**: no WisdomCore pre-compose, no `filter_response()` post.
  - `karmalytix_reflection.py` calls Anthropic directly with **static-only** wisdom; no dynamic learned-wisdom lookup on that path.
- Net: of the three providers, Anthropic is the **least** WisdomCore-gated — closer to **0–10 % compliance** with the claim.

### Static vs Dynamic — real or marketing?

**Real.** Both layers are named, persisted, and code-referenced:

- Static: `gita_verses` (SQL table), `STATIC_WISDOM_CORE` constant (`karmalytix_reflection.py:32`), `GitaWisdomCore` (`gita_ai_analyzer.py:210`).
- Dynamic: `learned_wisdom` (SQL table), `dynamic_wisdom_corpus.py`, the 24/7 daemon referenced in `wisdom_core.py:20`.

The composition step lives in `WisdomCore.search()` (`backend/services/wisdom_core.py`), which is the de-facto router between the two layers.

### Compliance summary

| Provider | Routes that obey "only through WisdomCore" | Routes that bypass | Approximate compliance |
|---|---|---|---|
| OpenAI | Ardha, Viyoga, Karma Reset, Sambandh Dharma, Emotional Reset, anything via `provider_manager` | KIAAN Chat, Sakha Chat, Voice Companion, Guidance, legacy Chat | **~60–70 %** |
| Sarvam | Sambandh Dharma (full), provider_manager-routed calls | Voice TTS pipeline does not filter text either way | **~50–60 %** (limited surface area, but compliant where used) |
| Anthropic | ~none in production | KarmaLytix (static-only), `AI_PROVIDER=anthropic` future path | **~5–10 %** |

### To make the claim fully true

1. Move the `filter_response()` + WisdomCore-compose step **inside** `ai_provider.call_kiaan_ai()` (`backend/services/ai_provider.py:135`) so every consumer inherits gating — not per-route.
2. Add the same wrapper to `_call_anthropic` and to `karmalytix_reflection.py` (Anthropic's direct call).
3. Wire `dynamic_wisdom_corpus` into the Anthropic path; today only `STATIC_WISDOM_CORE` flows into it.
4. Add a CI test that asserts every provider call site is preceded by a WisdomCore lookup and followed by `filter_response()` — currently this contract is enforced by convention, not by code.

---

## PART 4 — CORRECTION TO PART 3 (KIAAN Chat & Sakha Chat ARE WisdomCore-gated)

> The user pointed out that KIAAN Chat and Sakha Chat have always used WisdomCore, with a modern-secular layer on top. Re-tracing the call chain confirms they are correct, and Part 3's finding was wrong on this specific point. This addendum records the correct flow with file:line evidence.

### Where my earlier trace stopped too soon

In Part 3 I grepped for `wisdom_core` and `filter_response` inside `backend/services/ai_provider.py` and, finding none, concluded the chat path was "raw / un-gated". That was an error of scope. The WisdomCore composition happens **one layer up**, inside the route handler, *before* `call_kiaan_ai` is invoked — exactly where the user said it would be.

### The actual call chain for `/api/kiaan/chat` and `/api/sakha/chat`

```
POST /api/kiaan/chat   (backend/routes/kiaan.py:215)
POST /api/sakha/chat   (backend/routes/kiaan.py:227)   ← alias, identical handler
        │
        ▼
_handle_sakha_chat()   (backend/routes/kiaan.py:189)
        │
        ▼
_run_ai()   (backend/routes/kiaan.py:118)
        │
        ▼
compose_kiaan_system_prompt(db, query, tool_name, user_id)
        (backend/routes/kiaan.py:150 → backend/services/kiaan_wisdom_helper.py)
        │
        │  ┌─────────────────────────────────────────────────────────────┐
        │  │  WISDOMCORE COMPOSITION (pre-LLM gating)                    │
        │  │                                                             │
        │  │  • Persona v1.2.0 — "modern-secular text persona"           │
        │  │    file: prompts/sakha.text.openai.md                       │
        │  │    loaded at kiaan_wisdom_helper.py:101                     │
        │  │                                                             │
        │  │  • DYNAMIC wisdom (Tier 1)                                  │
        │  │    DynamicWisdomCorpus.get_effectiveness_weighted_verse()   │
        │  │    kiaan_wisdom_helper.py:219                               │
        │  │    Effectiveness-weighted Gita verse from                   │
        │  │    `wisdom_effectiveness` outcome table                     │
        │  │                                                             │
        │  │  • STATIC wisdom (Tier 2, always runs)                      │
        │  │    WisdomCore.search(include_learned=False)                 │
        │  │    kiaan_wisdom_helper.py:252                               │
        │  │    Strictly the 700+ verses in `gita_verses` table          │
        │  │    — `learned_wisdom` (non-Gita) excluded                   │
        │  │                                                             │
        │  │  • MODERN-IMPLEMENTATION enrichment (Tier 3)                │
        │  │    `gita_practical_wisdom` table                            │
        │  │    kiaan_wisdom_helper.py:298                               │
        │  │    principle_in_action / micro_practice / action_steps /    │
        │  │    modern_scenario / reflection_prompt / counter_pattern    │
        │  │    — THIS IS THE "MODERN & SECULAR" IMPLEMENTATION LAYER    │
        │  └─────────────────────────────────────────────────────────────┘
        │
        ▼  returns (composed_system_prompt, verses)
        │
        ▼
call_kiaan_ai(message, history, gita_verse, tool_name,
              system_override=composed_system_prompt)
        (backend/services/ai_provider.py:135)
        │
        ▼
_build_system_prompt() honours system_override
        (backend/services/ai_provider.py:216)
        `base = system_override if system_override and system_override.strip()
                else KIAAN_SYSTEM_PROMPT`
        │
        ▼
Provider call (OpenAI / Sarvam / Anthropic) — receives
the WisdomCore-composed system prompt
```

The route docstring states this explicitly (`backend/routes/kiaan.py:128–136`):

> "Call the AI provider grounded in Wisdom Core, modern-secular framing. ... composes a system prompt = persona-version 1.2.0 (modern-secular text persona) + retrieved verses block from `backend.services.wisdom_core.WisdomCore` (static + dynamic corpus, effectiveness-weighted). That replaces the legacy Krishna-flavoured constant in `backend.services.ai_provider` for every chat + tool request routed here."

### The "modern and secular layer" the user named — it is real

Two distinct artefacts give Sakha its modern-secular framing:

1. **The persona file** — `prompts/sakha.text.openai.md` (persona v1.2.0), described in code as "the modern-secular text persona". Loaded once at module import (`kiaan_wisdom_helper.py:101`).
2. **The `gita_practical_wisdom` table** — a separate corpus that attaches modern-world implementation (`modern_scenario`, `micro_practice`, `action_steps`, `counter_pattern`) to each Gita verse. This is what makes the response read as secular guidance, not scripture quotation.

The persona's 4-Part Structure (Ancient Wisdom Principle → Modern Application → Practical Steps → Deeper Understanding) consumes precisely the `RETRIEVED_VERSES` block produced by `compose_kiaan_system_prompt`.

### What is also true (and the part of Part 3 that still stands)

WisdomCore is wired as a **pre-LLM** gate (system-prompt composition), not as a **post-LLM** gate. The post-response validator `gita_wisdom_filter.filter_response()` is NOT applied on the `/api/kiaan/chat` and `/api/sakha/chat` path — confirmed by `grep -n "filter_response" backend/services/ai_provider.py backend/routes/kiaan.py backend/services/kiaan_wisdom_helper.py` returning zero matches. The other tool routes (Ardha, Viyoga, Karma Reset, Sambandh Dharma, Emotional Reset) apply both: pre-LLM via `compose_kiaan_system_prompt` AND post-LLM via `filter_response`.

So the corrected picture is:

| Path | Pre-LLM WisdomCore (Static + Dynamic + Modern-Secular) | Post-LLM `filter_response()` |
|---|---|---|
| `/api/kiaan/chat`, `/api/sakha/chat` | ✅ via `_run_ai` → `compose_kiaan_system_prompt` | ❌ not applied |
| `/api/kiaan/tools/emotional-reset` | ✅ same | ✅ at `emotional_reset_service.py:392` |
| `/api/kiaan/tools/ardha` | ✅ same | ✅ at `routes/ardha.py:591` |
| `/api/kiaan/tools/viyoga` | ✅ same | ✅ at `routes/viyoga.py:799` |
| `/api/kiaan/tools/karma-reset` | ✅ same | ✅ at `routes/karma_reset.py:244` |
| `/api/kiaan/tools/sambandh-dharma` | ✅ same | ✅ at `routes/sambandh_dharma_engine.py:547` |
| `/api/kiaan/tools/karmalytix` | ✅ same (for the kiaan.py route variant) | ⚠️ KarmaLytix's *direct Anthropic* call (`karmalytix_reflection.py:164`) is a separate code path — that one is static-only, no dynamic, no post-filter |
| `/api/kiaan/voice-companion/message` | ❌ no `compose_kiaan_system_prompt` call on this path | ❌ |
| `/api/guidance/*` | ❌ | ❌ |
| Legacy `/api/chat/messages` | ❌ | ❌ |

### Compliance numbers, revised

| Provider | Routes that obey "only through WisdomCore" | Approximate compliance |
|---|---|---|
| OpenAI | KIAAN Chat, Sakha Chat, **all six sacred tools**, plus engineered tool routes via `provider_manager` | **~85–90 %** (Voice Companion + legacy Chat + Guidance are the remaining holes) |
| Sarvam | Same set of routes when Sarvam is selected as `AI_PROVIDER` | **~85–90 %** |
| Anthropic | KIAAN/Sakha/tool routes when `AI_PROVIDER=anthropic`; KarmaLytix's direct call is the exception | **~70 %** (the KarmaLytix direct-Anthropic path remains static-only) |

The earlier "OpenAI 60–70 %, Sarvam 50–60 %, Anthropic 5–10 %" numbers underestimated coverage because they did not credit pre-LLM gating via `compose_kiaan_system_prompt`.

### Acknowledgement

The user's framing is accurate: KIAAN and Sakha Chat are not "raw" provider calls. They go through `compose_kiaan_system_prompt`, which assembles WisdomCore's Static layer (700+ verse `gita_verses` corpus), Dynamic layer (effectiveness-weighted picks from `dynamic_wisdom_corpus`), and the modern-secular framing (persona v1.2.0 + `gita_practical_wisdom` modern-application rows) before any byte reaches OpenAI / Sarvam / Anthropic. The earlier audit's "bypassed" label for these two routes was wrong and has been retracted here.

### Remaining genuine bypasses (unchanged from earlier finding)

- `/api/kiaan/voice-companion/message` — uses its own pipeline, does not call `compose_kiaan_system_prompt`.
- `/api/guidance/*` and legacy `/api/chat/messages` — raw provider calls.
- `karmalytix_reflection.py:164` — direct POST to `api.anthropic.com` using only `STATIC_WISDOM_CORE` constant (no dynamic layer, no post-filter).
- Post-LLM `filter_response()` is not applied on `/api/kiaan/chat` and `/api/sakha/chat` even though pre-LLM WisdomCore gating is. Whether that matters depends on policy — pre-LLM grounding is usually sufficient when the persona is strong.

---

## Summary for the three questions

1. **Cache for identical questions across all sacred tools, KIAAN Chat, Sakha Chat, Voice Companion?**
   Only Voice Companion. KIAAN Chat, Sakha Chat, and the six sacred-tool routes do **not** consult any cache. The Redis layer is defined but not invoked on those paths. Matching is exact-text (lower + strip + SHA-256), not semantic. Cache is global, not per-user. Coverage of the claim: **~11 % of the named surfaces.**

2. **KIAAN as an Independent AI Framework — how present, how functional?**
   Present: provider router, prompt library, Gita corpus + retrieval, memory, safety/Gita-grounding filter, voice pipeline, caching, metrics, unit tests, health endpoints. Functional in production: chat (via OpenAI), tools (via OpenAI), voice (STT local-capable, TTS remote), memory, safety. Functional **without external LLMs**: ~40 % — verses, templates, memory, local STT. The "Independent AI" label is **aspirational**; today KIAAN is a richly opinionated, spiritually-grounded wrapper around commercial LLMs.

3. **Do OpenAI / Sarvam / Anthropic answer only through WisdomCore (Static + Dynamic)?**
   *Revised after Part 4 correction.* WisdomCore exists as real code (`backend/services/wisdom_core.py`), and Static (`gita_verses` table) vs Dynamic (`dynamic_wisdom_corpus.py` + `wisdom_effectiveness` table) is a genuine architectural separation, not marketing. **KIAAN Chat and Sakha Chat DO route through WisdomCore** — gating happens at the prompt-composition layer (`backend/routes/kiaan.py:150` → `kiaan_wisdom_helper.compose_kiaan_system_prompt`), which assembles persona v1.2.0 (the modern-secular text persona at `prompts/sakha.text.openai.md`) + Static Gita corpus + Dynamic effectiveness-weighted verse + `gita_practical_wisdom` modern-implementation enrichment, then passes the whole bundle to OpenAI / Sarvam / Anthropic as `system_override`. The same `_run_ai` helper feeds all six sacred tools. Revised compliance: **OpenAI ~85–90 %, Sarvam ~85–90 %, Anthropic ~70 %**. The genuine remaining holes are `/api/kiaan/voice-companion/message`, `/api/guidance/*`, the legacy `/api/chat/messages`, and KarmaLytix's direct `api.anthropic.com` call (static-only, no dynamic layer). A post-LLM `gita_wisdom_filter.filter_response()` is applied on the engineered sacred tools but **not** on the main KIAAN/Sakha chat path — by design or oversight is a product decision.
