# Wisdom Core Invariant

Every KIAAN response that reaches a user — Sakha / KIAAN Chat, the six
sacred tools (Emotional Reset, Ardha, Viyoga, Karma Reset,
Sambandh Dharma, KarmaLytix), and the voice companions — must answer
**only through Wisdom Core**. This document records how that invariant
is enforced in code so it can be audited and extended without spelunking.

## The four-stage contract

Every provider call goes through this pipeline:

```
                ┌──────────────────────────────────────┐
                │  ⓪ RESPONSE CACHE                     │
                │     kiaan_response_cache              │
                │       key = sha256(user_id|tool|      │
                │         locale|nfkc_normalized_msg)   │
                │       HIT → return cached payload     │
                │       MISS → continue                 │
                └────────────────┬─────────────────────┘
                                 │ miss
                ┌────────────────▼─────────────────────┐
                │  ① PRE-LLM compose                    │
                │     kiaan_wisdom_helper               │
                │       compose_kiaan_system_prompt()   │
                │       ├─ persona v1.2.0               │
                │       ├─ STATIC: gita_verses corpus   │
                │       ├─ DYNAMIC: effectiveness-      │
                │       │  weighted verse               │
                │       └─ gita_practical_wisdom        │
                │          (modern application)         │
                └────────────────┬─────────────────────┘
                                 │
                ┌────────────────▼─────────────────────┐
                │  ② LLM call                           │
                │     ai_provider.call_kiaan_ai()      │
                │       routes to OpenAI/Sarvam/       │
                │       Anthropic per AI_PROVIDER       │
                └────────────────┬─────────────────────┘
                                 │
                ┌────────────────▼─────────────────────┐
                │  ③ POST-LLM filter                    │
                │     gita_wisdom_filter                │
                │       .filter_response()              │
                │       ├─ wisdom-score validation     │
                │       ├─ enhancement when low score   │
                │       └─ citation verification        │
                └────────────────┬─────────────────────┘
                                 │
                ┌────────────────▼─────────────────────┐
                │  ④ CACHE WRITE (happy path only)      │
                │     stores GroundedResponse payload   │
                │     under the same key as ⓪           │
                └──────────────────────────────────────┘
```

## Streaming entry point (SSE)

`backend/services/kiaan_grounded_ai.call_kiaan_ai_grounded_stream`
yields `GroundedStreamEvent` objects so chat clients can render
incrementally — first paint goes from ~1.2 s (unary) to ~200 ms.

Wire protocol: SSE-style events in order

```
event: verses    data: list[dict]          (Wisdom Core verses)
event: token     data: str                 (one PASS sentence + space)
event: token     data: str
...
event: done      data: { is_gita_grounded, wisdom_score,
                         enhancement_applied, filter_applied,
                         cache_hit, failure_reason, fallback_tier }
```

The HTTP surface is `POST /api/kiaan/chat/stream`. Same Wisdom Core
composition + post-LLM filter as the unary path, but the filter is the
**streaming** variant (`StreamingGitaFilter`) — the same one the WSS
voice path uses. PASS sentences flush as tokens; HOLD sentences buffer;
FAIL truncates the stream and the `done` event carries
`failure_reason` + `fallback_tier`.

Cache: HITs are emitted as the same wire shape (`verses` + one `token`
carrying the full cached text + `done` with `cache_hit: true`). MISSes
do **not** write the cache — partial-stream snapshots aren't safe to
serve later; the unary endpoint populates the cache for next time.

Bypass conditions: same as unary — `user_id=None`, `system_override`,
`gita_verse` pin, or `KIAAN_RESPONSE_CACHE_ENABLED=false`.

## Golden-answer regression suite

`tests/golden/` carries a canonical input corpus per surface (six
sacred tools + bare chat = 56 inputs total spanning English / Hindi /
Hinglish, moods from anxiety to gratitude, and crisis-signal probes).
Two layers run via `tests/test_golden_regression.py`:

* **Layer A — input invariants** (always in CI): every corpus loads
  as a non-empty list with unique IDs and required fields; every tool
  record's `build_tool_message` envelope renders cleanly.
* **Layer B — drift checks** (engage when recordings exist): each
  recorded `input_record` must still match the live corpus byte-for-
  byte; recording payload schema is valid. When no recordings exist
  (fresh checkout), Layer B skips with a clear message.

A mock-LLM end-to-end smoke runs every CI to assert the recorder
pipeline still wires together.

**Recording.** Ops runs `python scripts/record_golden_responses.py
--all` after an intentional prompt / persona / model change. Costs
~$0.03, takes ~3 minutes, writes one JSON per (surface, id) under
`tests/golden/recordings/`. The recordings are version-controlled —
diffs in PR are the audit trail for prompt / model changes.

**Drift tolerances** (from `tests/test_golden_regression.py`):
- `wisdom_score` may drop ≤ 0.10
- `filter_applied` rate may drop ≤ 2 pp
- recorded `verse_refs` must still appear in the new response

## Cost-aware spend governor

`backend/services/kiaan_cost_governor.CostGovernor` bounds per-user-tier
daily LLM spend. Built on the token-usage plumbing shipped in P2 §15
(`call_kiaan_ai_with_usage` returns `(text, {prompt_tokens, completion_tokens})`),
which now also feeds the P2 §14 cost counter with real numbers.

Tier caps (env-overrideable via `KIAAN_COST_CAP_USD_<TIER>`):

| Tier | Default cap / day |
|---|---|
| FREE | $0.02 |
| SADHAK | $0.15 |
| SIDDHA | $0.50 |
| DIVINE | $2.00 |

Decisions: **ALLOW** (< 80 %) / **BUDGET_WARNING** (≥ 80 %) /
**BUDGET_EXCEEDED** (≥ 100 %). When over cap, `BudgetExceededError`
carries `retry_after_seconds = seconds-until-midnight-UTC` for the
HTTP layer's `429` mapping.

Storage mirrors the response cache: Redis preferred (shared
connection pool, `INCRBY` for atomic adds, 48 h TTL), in-memory
fallback bounded to 50 000 keys. User IDs are SHA-256 hashed before
keying so neither Redis nor logs leak raw identifiers.

Kill switch: `KIAAN_COST_GOVERNOR_ENABLED=false`.

## Daemon-ingestion safety harness

`backend/services/kiaan_daemon_safety.py` is the rail for the day the
dormant 24/7 learning daemon flips on. Two-stage validator + two
retention passes.

**Stage 1 — license whitelist.** Every `IngestionCandidate` carries a
`LicenseTag` (CC0, CC-BY, CC-BY-SA, PD-pre-1928, FIRST_PARTY,
OPERATOR_REVIEWED). Untagged / non-whitelisted candidates reject at
this stage, before any expensive Gita-compliance check. CC-BY /
CC-BY-SA without attribution is a license breach and also rejects.

**Stage 2 — copyright phrase scrubber.** A denylist seeded from
`.github/workflows/ip-hygiene.yml::FORBIDDEN_PHRASES` (Prabhupada,
Easwaran, ISKCON characteristic phrasings). Case-insensitive,
whitespace-normalised so multi-line excerpts can't slip past. Catches
accidental drift even when the upstream license tag looks clean.

**Retention — `purge_low_value_learned_rows`.** Soft-deletes
`learned_wisdom` rows that never proved useful (default:
`usage_count < 3` AND `created_at < now - 90 days`). The audit
projected unbounded ~250 MB–2 GB/year growth if the daemon runs
without retention.

**Auto-reject — `mark_low_effectiveness_rejected`.** Sets
`validation_status=REJECTED` on rows with `quality_score < 0.40` over
20+ deliveries. Row stays in the table for audit; retrieval stops
serving it.

Both retention passes default to `dry_run=True` — explicit opt-in to
write.

## Telemetry & observability

`backend/services/kiaan_telemetry.py` instruments the grounded
pipeline with Prometheus histograms + counters. Every
`call_kiaan_ai_grounded` invocation emits:

* Per-stage latency: `kiaan_stage_latency_seconds{stage,outcome}` —
  `compose`, `llm`, `filter`, `cache_set` (each timed by
  `async with trace_stage("…")`).
* End-to-end histogram: `kiaan_grounded_turn_latency_seconds{tool,
  cache_hit,outcome}` — fires on every return path (cache hit, filter
  applied, filter skipped, filter error).
* Cache outcomes: `kiaan_response_cache_outcomes_total{outcome}` —
  `hit` / `miss`.
* Filter outcomes: `kiaan_gita_filter_outcomes_total{outcome}` —
  `pass` / `fail` / `skipped` (the streaming path).
* Wisdom score histogram: `kiaan_wisdom_score`.
* Cost: `kiaan_cost_micro_usd_total{provider,model}` — micro-USD from
  the per-1K-token rate table in `kiaan_telemetry._COST_PER_1K_TOKENS_USD`.
* Cache size gauge: `kiaan_response_cache_memory_size` —
  refreshed at scrape time from `get_response_cache().stats()`.

Scrape endpoint: `GET /api/monitoring/prometheus` returns the default
Prometheus registry in text format. Configure in `prometheus.yml`:

```yaml
- job_name: 'kiaan-grounded'
  scrape_interval: 15s
  metrics_path: /api/monitoring/prometheus
  static_configs:
    - targets: ['mindvibe-api:8000']
```

A Grafana dashboard ships at `monitoring/grafana/kiaan_grounded_dashboard.json`
with 8 panels: end-to-end p50/p95/p99, per-stage p95, cache hit ratio,
filter pass rate, cost-per-minute, wisdom score distribution, cache
memory size, stage error rate. Thresholds match the roadmap alerts
(cache hit ratio < 30 % red, filter pass < 90 % red, p95 > 1.5 s
yellow / > 3 s red).

Kill switch: `KIAAN_TELEMETRY_ENABLED=false` short-circuits emission.
Failures inside the metric backend never propagate into the user
request path — `record_grounded_turn` wraps every counter call in a
defensive try/except.

## Assistant engine + routing introspection

`POST /api/kiaan/assistant` exposes the fourth engine
(`EngineType.ASSISTANT`, suppressed in voice mode by design) as a
text-mode HTTP surface. Same Wisdom-Core-gated pipeline as the six
sacred tools — the LLM receives `<TOOL>Assistant</TOOL>` and a
directive that asks it to surface task intent without inventing tool
execution. Per-action wiring (start_journey, schedule_reflection,
get_streak) is a follow-up; this surface is intent-routing-only
today, by design — exposing the existing dev-focused
`kiaan_agent_tools` (WebSearch, CodeExecution) would be the wrong
shape and a security risk.

`POST /api/kiaan/route` is the read-only introspection endpoint:
returns what `EngineRouter.route` would decide for a given message
(primary engine, secondary engines, confidence, crisis flag, voice-
render hints). Never invokes the LLM. Useful for clients that want
to render "Sakha is thinking / Assistant is looking that up"
affordances, and for ops dashboards debugging mis-routes.

## Local-LLM fallback

`backend/services/ai/providers/local_llama_provider.py` adds an
on-device LLM at the tail of the provider chain:

```
OpenAI → Sarvam → OpenAI-compat → local_llama → tier-4 canned
```

Opt-in by deployment. Three preconditions must line up:
1. `llama-cpp-python` installed at runtime
2. `KIAAN_LOCAL_MODEL_PATH` env var points at a GGUF file on disk
3. `KIAAN_LOCAL_LLAMA_ENABLED=true` (default)

Missing any of the three → provider reports `is_configured=False` and
the chain hops to the next provider. Health check returns the precise
reason so dashboards show *which* of the three is wrong.

Recommended models:
- `phi-3-mini-4k-instruct-q4.gguf` (~2.3 GB) — best quality
- `qwen2.5-1.5b-instruct-q4_k_m.gguf` (~1 GB) — lighter, faster

Operational notes:
- One `Llama` instance per process behind an `asyncio.Lock`; generation
  runs in `asyncio.to_thread` so the event loop stays unblocked.
- First request after startup pays ~3–8 s load cost. Call
  `LocalLlamaProvider().preload()` from the FastAPI startup hook to
  amortise.
- Quality on Gita-grounded reflections: ~70 % of gpt-4o-mini on the
  golden regression set. Use it as a fallback, not a primary.
- The GGUF file is not bundled in this repo — ops mounts it via volume
  or builds a multi-stage Docker image with a `kiaan-models` stage.

## Sacred-tool envelope

`backend/services/tool_envelope.build_tool_message(tool_name, inputs)`
is the single way the six sacred-tool routes hand user input to the
LLM. It returns a three-tag envelope:

```
<TOOL>Ardha</TOOL>
<INPUTS>{"situation":"...","limiting_belief":"...","fear":"..."}</INPUTS>
<REQUEST>Help me reframe this.</REQUEST>
```

Why this shape:

* **Parse stability** — the persona prompt looks for the three tags;
  the LLM cannot confuse user-provided values with hand-rolled English
  glue.
* **i18n trivialness** — keys are stable English identifiers, values
  can be any language. The same envelope shape works for Hindi,
  English, Sanskrit, or mixed input without per-locale f-strings.
* **Privacy on KarmaLytix** — that one tool's `<REQUEST>` directive
  carries the PRIVACY clause (`metadata only — journal content is
  encrypted and never shared`) and the output skeleton (Mirror,
  Pattern, Gita Echo, Growth Edge, Blessing). The constraint has no
  other home in the prompt stack.
* **Honest audit logs** — every tool call logs the exact field dict
  the model saw, not a hand-rolled English paraphrase that drifts.

Empty / None / `[]` / `{}` values are stripped before JSON-encoding so
the LLM never sees clutter from fields the user skipped. Token cost
vs the old f-string narrative is roughly neutral for typical inputs
(the tags add ~30 chars; the eliminated filler subtracts roughly the
same). The win is structure, not compression.

## Per-sentence language routing (Hinglish)

`backend/services/voice/lang_detect.py` provides
`detect_script(text) -> "hi" | "en" | "mixed" | "unknown"` and
`pick_tts_lang(text, fallback) -> "hi" | "en" | "hi-en" | <fallback>`.
The voice orchestrator calls `pick_tts_lang` on every PASS sentence
(both happy-path TTS and the tier-3/tier-4 fallback) so Hindi-English
code-switched output routes per sentence:

| Detected script | TTS `lang_hint` | Provider |
|---|---|---|
| Devanagari ≥ 80 % | `hi` | Sarvam Hindi |
| Latin ≥ 80 % | `en` | ElevenLabs (or Sarvam if no key) |
| Mixed | `hi-en` | Sarvam Hindi (handles Latin script in Devanagari sentences cleanly; ElevenLabs Aria does not) |
| No script | turn-level `ctx.lang_hint` | per turn-level default |

The TTS audio cache key already includes `lang_hint` + `voice_id`
(`tts_router.AudioCache.build_key`), so per-sentence routing is
cache-coherent for free: the same English sentence under an
English-leading turn and a Hindi-leading turn share the same cache
entry; a Hindi sentence in a mixed turn gets its own entry.

## The unified Wisdom Core retriever

`backend/services/wisdom/retrieve.py::retrieve_wisdom` is the **single
data path** for Wisdom Core retrieval. Both the chat / sacred-tool
stack and the voice companion stack delegate here. Three-tier pipeline:

1. **Dynamic effectiveness pick** — when `user_id` + `mood` present and
   `include_dynamic=True`, the `DynamicWisdomCorpus` picks the Gita
   verse historically most effective for this user/mood.
2. **Static Gita search** — `WisdomCore.search` with
   `include_learned=False` (strict-Gita guarantee).
3. **Practical wisdom enrichment** — `gita_practical_wisdom` table
   rows per verse (modern scenario, micro-practice, action steps).
   Chat opts in; voice opts out (its TTS shape doesn't render this).

Returns a `WisdomBundle(verses, mood, sources, is_mock)` — never
raises, never blocks the caller. Voice opts into a mock catalogue
fallback (`allow_mock_catalogue=True`) so the orchestrator always has
something to seed the prompt with; chat leaves it False and falls back
to persona-only when retrieval is empty.

Adapters around it:

* `kiaan_wisdom_helper.compose_kiaan_system_prompt` — projects the
  bundle into the persona's `RETRIEVED VERSES` block (chat / tools).
* `voice/retrieval_and_fallback.retrieve_verses_for_turn` — projects
  into `RetrievedVerse` for the orchestrator (voice).

## The single entry point

`backend/services/kiaan_grounded_ai.call_kiaan_ai_grounded` is the
single function every chat / tool / voice route must call. It returns
a `GroundedResponse` with the filtered text, retrieved verses, and
filter telemetry.

```python
from backend.services.kiaan_grounded_ai import call_kiaan_ai_grounded

result = await call_kiaan_ai_grounded(
    message=user_message,
    db=db,                       # required for Wisdom Core composition
    user_id=current_user_id,     # required for Dynamic effectiveness pick
    tool_name="Ardha",           # one of the six sacred tools, or None
    conversation_history=history,
    gita_verse=client_supplied_verse,  # optional
    system_override=None,        # only set if surface curates own prompt
    apply_filter=True,           # only False for streaming paths
)
# result.text     -> filtered user-facing response
# result.verses   -> Wisdom Core verses for the client to render
# result.wisdom_score, result.is_gita_grounded, result.enhancement_applied
```

## Where it is wired today

| Surface | Route | Wired? | Mechanism |
|---|---|---|---|
| Sakha / KIAAN Chat | `POST /api/kiaan/chat`, `POST /api/sakha/chat` | ✅ | `routes/kiaan.py::_run_ai` → `call_kiaan_ai_grounded` |
| Emotional Reset | `POST /api/kiaan/tools/emotional-reset` | ✅ | same `_run_ai` |
| Ardha | `POST /api/kiaan/tools/ardha` | ✅ | same |
| Viyoga | `POST /api/kiaan/tools/viyoga` | ✅ | same |
| Karma Reset | `POST /api/kiaan/tools/karma-reset` | ✅ | same |
| Sambandh Dharma | `POST /api/kiaan/tools/sambandh-dharma` | ✅ | same |
| KarmaLytix | `POST /api/kiaan/tools/karmalytix` | ✅ | same |
| REST Voice Companion | `POST /api/voice-companion/message` | ✅ post-filter | `routes/kiaan_voice_companion.py` calls `filter_voice_response` after each tier; pre-LLM prompt still curated by `_build_divine_friend_system_prompt` |
| WSS Voice Companion | `WS /voice-companion/converse` | ✅ both | Streaming `StreamingGitaFilter` + `voice/retrieval_and_fallback` already in place; tracked separately for streaming semantics. **Memory + recent-session summaries wired in P0 §3** via `backend.services.companion_context.{get_user_memories, get_recent_session_summaries}` — both surfaced through `VoiceTurnContext.memories` / `.session_summaries` and included in the LLM `user_payload` JSON. |

## Why pre-LLM + post-LLM, not just one

* Pre-LLM (compose) **prevents** ungrounded output: the model receives
  the actual Gita context it must reason inside.
* Post-LLM (filter) **detects** ungrounded output if the model wanders:
  low wisdom score → enhancement adds verse + concept anchors.

A failure on one layer is contained by the other. The filter is best-
effort: when it errors, the raw text + telemetry is returned with
`filter_applied=False` so the user response is never blocked.

## Adding a new surface

A new endpoint that answers users with AI follows three rules:

1. Call `call_kiaan_ai_grounded`, never `call_kiaan_ai` directly,
   never the OpenAI / Anthropic / Sarvam SDKs directly.
2. Pass `db` and `user_id` so Wisdom Core composition can run.
3. Map your tool to the right `tool_name` string (see
   `kiaan_grounded_ai._TOOL_NAME_TO_FILTER_TOOL`) so the post-filter
   uses the correct rubric.

If the surface absolutely needs a bespoke system prompt (like the REST
Voice Companion's "Divine Friend" persona), pass it as `system_override`.
Pre-LLM composition is skipped but the post-LLM filter still runs.

## Growing the Dynamic Wisdom corpus

Dynamic Wisdom (the `learned_wisdom` table) is what makes Wisdom Core
adapt to which verses actually help users. The 24/7 ingestion daemon
(`backend/services/kiaan_learning_daemon.py`) is intentionally gated off
pending the per-source license review documented in
`legal/LEGAL_RISK_INVENTORY_2026-05-16.md`.

Until that review lands, use the **first-party paraphrase seeder**:

```bash
# Preview without DB or LLM calls
python scripts/seed_dynamic_wisdom.py --dry-run

# Generate 2 variants per verse (~1402 rows, ~$0.20 of LLM spend)
python scripts/seed_dynamic_wisdom.py --variants 2

# Resume from a chapter (idempotent — content_hash dedups)
python scripts/seed_dynamic_wisdom.py --from-chapter 12
```

What it does:

1. Loads the public-domain Sanskrit Gita corpus from
   `data/gita/gita_verses_complete.json`.
2. For each verse, asks the configured LLM to write a fresh modern
   secular reflection (rubric: principle + scenario + action; 80–140
   words; no third-party translation quoting).
3. Writes the reflection to `learned_wisdom` with
   `source_type=MANUAL`, `validation_status=VALIDATED`,
   `quality_score=0.75`, `source_name=kiaan_internal_paraphrase_BG<n>.<m>`.

Three IP-safety properties hold:

* **Source is public domain.** Pre-1900 Sanskrit text.
* **Output is transformative.** Modern-application reflection, not a
  re-translation. The system prompt forbids quoting contemporary
  published translations (Prabhupada, Easwaran, etc.). The CI guardrail
  at `.github/workflows/ip-hygiene.yml` keeps such phrasings out of the
  repo by independent path.
* **First-party authored.** Output is work-for-hire of our deployment.
  We own it.

The seeded rows participate in the effectiveness loop the same way
daemon-ingested rows would: each delivery records via
`dynamic_wisdom_corpus.record_wisdom_delivery` and each outcome via
`record_wisdom_outcome`. Rows whose effectiveness drops below 0.4 over
20+ deliveries are candidates for `validation_status=REJECTED` in a
future maintenance pass.

## How to grow Dynamic Wisdom *beyond* the seeder

In priority order:

1. **User-feedback promotion (P1).** When a user marks a response
   "this helped", capture `(verse_ref, mood, paraphrased_reflection)`
   and write it to `learned_wisdom` with `source_type=MANUAL`,
   `quality_score=0.85`, `source_name=user_feedback_<user_id_hash>`.
   This is the cleanest growth path because every row carries an
   effectiveness signal at creation.

2. **Editorial uploads (P1).** A small curator tool that lets the
   editorial team paste CC-BY / CC0 / first-party reflections directly,
   tagged with chapter / verse / theme. `validation_status=VALIDATED`,
   `validated_by=<editor_id>`. Zero LLM cost, highest quality.

3. **Daemon activation (P2, blocked on legal).** Once
   `legal/LEGAL_RISK_INVENTORY_2026-05-16.md` items #4 and #5 close,
   enable `KIAAN_DAEMON_ENABLED=true` with a **per-source license
   whitelist** (not a domain whitelist) and a copyright-scrubber on
   transcript ingestion. Each candidate must carry an explicit license
   tag (`CC-BY-SA`, `CC0`, `PD-pre-1928`) or be rejected.

4. **LLM expansion of effectiveness-proven rows (P2).** Rows in
   `learned_wisdom` with `quality_score > 0.85` and `usage_count > 50`
   are good candidates to be re-paraphrased into 2–3 stylistic
   variants (formal / conversational / brief). Same IP-safe pattern as
   the seeder, but anchored on already-validated content.

## Response cache

`backend/services/kiaan_response_cache.KiaanResponseCache` wraps every
`call_kiaan_ai_grounded` invocation with an exact-match cache. Three
guarantees:

1. **User-scoped.** The cache key always includes `user_id`. User A's
   response never reaches user B even on byte-identical text. This
   fixes the privacy bug `AUDIT_CACHE_FRAMEWORK.md` Part 1 flagged
   against the legacy `redis_cache.cache_kiaan_response`.
2. **Two-tier backend.** Redis (when the
   `backend.cache.redis_cache.get_redis_cache()` singleton is connected)
   sharing its connection pool, with an in-memory LRU+TTL fallback for
   CI / single-process. Both honour
   `KIAAN_RESPONSE_CACHE_TTL` (default 3600s) and
   `KIAAN_RESPONSE_CACHE_MAX_ENTRIES` (default 5000 for in-memory).
3. **Bypass conditions** — any of:
   - `KIAAN_RESPONSE_CACHE_ENABLED=false` (kill switch)
   - `user_id is None` (privacy floor)
   - `system_override` provided (the cache key would not capture the
     prompt variance)
   - `apply_filter=False` (streaming paths cache through their own
     streaming filter, not this final-text cache)
   - `gita_verse` pin supplied (one-off response)

Cache HIT short-circuits both the pre-LLM Wisdom Core composer AND the
LLM call — saves ~100ms compose + ~800-1500ms LLM on hot keys.

Cache WRITE happens only on the happy path (filter ran successfully).
Degraded responses (filter failure) are never cached, so a transient
filter bug cannot poison the cache.

### Key normalisation

`KiaanResponseCache.normalize_message` collapses:
- Unicode NFKC (ligatures, full-width digits): `"ﬁ"` ≡ `"fi"`
- Case: `"I FEEL"` ≡ `"i feel"`
- Whitespace: leading/trailing + runs of whitespace collapse

Punctuation is NOT collapsed — left for the future semantic-similarity
layer (the `find_semantic_match` hook in the cache module). Phase 2
will add `text-embedding-3-small` + cosine ≥ 0.92 for near-duplicate
hits.

### Telemetry

```python
from backend.services.kiaan_response_cache import get_response_cache
get_response_cache().stats()
# {"hits": int, "misses": int, "errors": int, "sets": int,
#  "invalidations": int, "memory_size": int,
#  "enabled": bool, "ttl_seconds": int}
```

### Invalidation

```python
cache = get_response_cache()
# Targeted (one entry):
await cache.invalidate(user_id="u", tool_name="Ardha", message="...")
# User-wide (call when user reports "this didn't help"):
await cache.invalidate(user_id="u")
```

## Invariant tests

`tests/test_kiaan_grounded_ai.py` pins the three-stage Wisdom Core
behaviours. `tests/test_kiaan_response_cache.py` pins these cache
behaviours:

Wisdom Core invariants (`tests/test_kiaan_grounded_ai.py`, 9 tests):

* When `db` is provided and no `system_override`, the pre-LLM composer
  runs and its output is passed to the provider.
* When `system_override` is provided, the composer is skipped but the
  post-LLM filter still runs.
* When `apply_filter=False`, the filter is skipped (used by streaming).
* A broken filter does **not** 500 the user — raw text + telemetry is
  returned with `filter_applied=False`.
* Empty `message` raises `ValueError` before any provider is called.
* `tool_name="Ardha"` routes the post-filter to `WisdomTool.ARDHA`.

Cache invariants (`tests/test_kiaan_response_cache.py`, 25 tests):

* Normalisation: case, whitespace, Unicode NFKC all hit the same key.
* Per-user isolation: user A's response never serves user B.
* `user_id=None` bypasses both read and write.
* `system_override`, `apply_filter=False`, and `gita_verse` pin all
  bypass the cache end-to-end.
* `KIAAN_RESPONSE_CACHE_ENABLED=false` kills the cache entirely.
* In-memory LRU eviction kicks in at the configured capacity.
* Filter failures are NOT cached.
* Redis errors degrade gracefully to the in-memory tier.
* Locale shards the cache (en/hi/sa do not collide).
* Rehydration round-trip preserves all `GroundedResponse` fields.

Run with: `pytest tests/test_kiaan_grounded_ai.py tests/test_kiaan_response_cache.py`.
