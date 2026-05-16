# Wisdom Core Invariant

Every KIAAN response that reaches a user — Sakha / KIAAN Chat, the six
sacred tools (Emotional Reset, Ardha, Viyoga, Karma Reset,
Sambandh Dharma, KarmaLytix), and the voice companions — must answer
**only through Wisdom Core**. This document records how that invariant
is enforced in code so it can be audited and extended without spelunking.

## The three-stage contract

Every provider call goes through this pipeline:

```
                ┌──────────────────────────────────────┐
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
                └──────────────────────────────────────┘
```

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
| WSS Voice Companion | `WS /voice-companion/converse` | ✅ both | Streaming `StreamingGitaFilter` + `voice/retrieval_and_fallback` already in place; tracked separately for streaming semantics |

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

## Invariant tests

`tests/test_kiaan_grounded_ai.py` pins these behaviours:

* When `db` is provided and no `system_override`, the pre-LLM composer
  runs and its output is passed to the provider.
* When `system_override` is provided, the composer is skipped but the
  post-LLM filter still runs.
* When `apply_filter=False`, the filter is skipped (used by streaming).
* A broken filter does **not** 500 the user — raw text + telemetry is
  returned with `filter_applied=False`.
* Empty `message` raises `ValueError` before any provider is called.
* `tool_name="Ardha"` routes the post-filter to `WisdomTool.ARDHA`.

Run with: `pytest tests/test_kiaan_grounded_ai.py`.
