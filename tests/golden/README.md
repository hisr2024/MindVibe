# Golden-Answer Regression Suite

Implements `IMPROVEMENT_ROADMAP.md` P1.5 §11. Guards against silent
quality regressions in `call_kiaan_ai_grounded`.

## Layout

```
tests/golden/
├── inputs/                # 7 corpora × 6–10 canonical user inputs each
│   ├── emotional_reset.json
│   ├── ardha.json
│   ├── viyoga.json
│   ├── karma_reset.json
│   ├── sambandh_dharma.json
│   ├── karmalytix.json
│   └── chat.json
├── recordings/            # populated by scripts/record_golden_responses.py
│   ├── ardha/
│   │   ├── imposter_syndrome_tech.json
│   │   └── ...
│   └── ...
└── README.md
```

## How it works

Two layers run from `tests/test_golden_regression.py`:

**Layer A — Input-corpus invariants** (always runs in CI):
- Every corpus loads as a non-empty list.
- IDs are unique within a corpus.
- Each tool record has every required input field.
- Every tool record's `build_tool_message` envelope renders without crashing.
- Bare chat records have non-empty `message` strings.

**Layer B — Drift verification** (runs when recordings exist):
- Each recorded `input_record` matches the current corpus byte-for-byte
  (catches stale recordings after corpus edits).
- Recording payload schema is valid (`schema_version: 1`).
- On a fresh checkout with no recordings: skips with a clear message.

A mock-LLM end-to-end smoke runs every CI to assert the recorder
pipeline still wires together, even when no real recordings exist yet.

## Drift thresholds

When recordings are present and the recorder is run as part of a
review process, drift is bounded by:

| Signal | Tolerance |
|---|---|
| `wisdom_score` | may drop ≤ `0.10` below the recorded value |
| `filter_applied` rate | may drop ≤ `0.02` (2 pp) below the recorded rate |
| `verse_refs` | recorded refs must still appear in the new response's verses |

These constants live in `tests/test_golden_regression.py`. Changing
them is deliberate and should arrive in the same PR as the re-record.

## Recording

Re-record after an intentional prompt, persona, retrieval, or model
change. Costs ~$0.03 (gpt-4o-mini) and takes ~3 minutes for a full sweep.

```bash
# rebuild every surface
OPENAI_API_KEY=... python scripts/record_golden_responses.py --all

# one surface only
OPENAI_API_KEY=... python scripts/record_golden_responses.py --surface ardha

# preview without writing
OPENAI_API_KEY=... python scripts/record_golden_responses.py --all --dry-run
```

The recorder uses a fixed `user_id` ("golden-test-user") so the
Dynamic Wisdom effectiveness pick stays reproducible across rebuilds.

## Authoring new inputs

1. Add the record to the right corpus JSON. Use a snake_case `id` that
   describes the scenario in a few words.
2. Required fields per surface are documented in
   `tests/test_golden_regression.py::_SURFACE_SCHEMA`. Layer A enforces
   them; a missing field fails CI immediately.
3. `expected` is a free-form dict where you can attach assertion
   metadata (`mood_label`, `min_verses`, `locale`, `script`, etc.)
   that future verifier extensions will consume. Keep it small and
   honest.
4. Cover a mood / language / topic that the rest of the corpus does
   not. The corpus's value comes from breadth, not volume.

## i18n discipline

Every corpus has at least one Hindi (Devanagari) record and at least
one Hinglish (mixed-script) record. This is intentional: the
per-sentence TTS routing (P1 §8) and the language detection
(`backend/services/voice/lang_detect.py`) depend on real Devanagari
text reaching the pipeline.

When adding a new locale, add one record per locale per corpus.

## Why corpus inputs are in version control but recordings are not

Both are in version control today, intentionally:

- **Inputs** must be reviewed in PR — they describe what we care about
  the AI being good at.
- **Recordings** must also be reviewed in PR — they describe what we
  currently claim the AI does on those inputs. Changes to the
  recordings are the audit trail for prompt/model/persona changes.

If recording diffs ever become noisy enough to dominate review, switch
to a single rolled-up `recordings/manifest.json` with `(id, hash)`
pairs and store recordings out-of-tree.
