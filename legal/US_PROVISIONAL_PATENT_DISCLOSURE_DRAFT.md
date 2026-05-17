# US Provisional Patent Disclosure — Draft

**Status:** Draft for user review. Not yet filed.
**Target filing window:** Within 30–45 days of first public commit (2026-04-19).
**Estimated cost:** ~$120 USPTO filing fee (micro-entity) + $1.5–3k attorney drafting fee.

> ⚠️ **This is an engineering-side disclosure draft, NOT a legal document.**
> A registered US patent attorney must (1) re-draft this into formal
> provisional patent application language, (2) advise on whether a
> provisional is the right vehicle vs. a non-provisional or PCT,
> (3) execute the freedom-to-operate search, and (4) file. The goal of
> this document is to give counsel a comprehensive technical disclosure
> they can build from in a single sitting.

---

## 1. Inventor

| Field | Value |
|---|---|
| Inventor | (Founder name — confirm legal name with counsel) |
| Address | (Confirm with counsel) |
| Entity status | Likely **micro-entity** (solo founder, no prior co-inventors with > $20k previous applications) — cuts USPTO fee ~75% |
| Assignee | Kiaanverse / MindVibe (LLC or corp — confirm registration status with counsel) |

---

## 2. Title (working — counsel will refine)

> "System and Method for Multi-Modal Spiritual Wellness Coaching Anchored
> in a Public-Domain Religious Corpus, with Dharmic-Tag Semantic Retrieval
> and Provider-Agnostic AI Companion Orchestration"

Counsel will likely shorten to something like:
> "Method and System for Dharmic-Tagged Wisdom Retrieval and Multi-Modal
> Spiritual Companion Orchestration"

---

## 3. Field of the invention

The invention relates to (a) software systems for spiritual wellness
coaching that combine an ancient public-domain religious corpus with
modern AI-assisted conversation, (b) semantic retrieval methods that
map user emotional states to dharmic-tagged source verses, and (c)
multi-provider AI orchestration with graceful degradation across
upstream language model and text-to-speech providers.

---

## 4. Background

Existing spiritual / wellness apps fall into roughly three categories:

1. **Static-content apps** (Insight Timer, Calm) — pre-recorded
   meditations with no contextual responsiveness.
2. **Generic AI chatbots** (Replika, Pi) — emotionally responsive but
   not anchored in any specific wisdom tradition; produce drift / made-up
   "wisdom".
3. **Religious-text browsers** (vedabase, IIIT Sanskrit corpus tools) —
   show source text without practical companion-style engagement.

None of these provide the specific innovation claimed here: **dharmic-
tag-anchored semantic retrieval from a public-domain corpus, with a
multi-provider AI companion orchestration that grounds every response
in a specific verse without producing translation-derived output**.

Prior art the user (and counsel) should consider:
- US 10,xxx,xxx (placeholder — search for "AI-generated affirmation"
  patents in CPC G06N20/00, G16H80/00 ranges)
- US 11,xxx,xxx (biometric→mood-state→intervention chains)
- US 11,xxx,xxx (verse-of-the-day personalization)

Counsel should run a **freedom-to-operate (FTO) search** as the first
substantive step. Budget for $2–4k of attorney time on this; it's the
most important defensive step.

---

## 5. Summary of the invention

The invention is a software system comprising:

1. A **public-domain religious-text corpus** (in the present
   embodiment: the Bhagavad Gita, 700 verses) where each verse is
   pre-tagged with a structured *dharmic-tag schema* that includes
   per-verse fields for `theme`, `principle`, and a list of
   `mental_health_applications` (e.g. `inner_peace`, `letting_go`,
   `resilience`, `purpose_and_meaning`).
2. A **mood→dharmic-tag mapping layer** (`MOOD_THEME_MAP`) that takes a
   detected user mood and returns the ordered list of dharmic tags
   most relevant to that mood, biasing tag selection toward those
   shown to move users from the detected mood toward a more peaceful
   or hopeful state.
3. An **effectiveness-learning corpus selector** that records
   per-(user, mood, verse) outcomes after delivery, computes a
   confidence-weighted effectiveness score, and uses it to bias future
   selections toward verses with the highest demonstrated mood-shift
   effect for that user's specific context.
4. A **provider-agnostic AI companion orchestrator** (single
   `call_kiaan_ai` interface) that routes requests across multiple
   upstream LLM providers (Anthropic, OpenAI, local fine-tuned models)
   with bounded conversation memory and a fallback chain that
   prevents companion unavailability under any single-provider outage.
5. A **multi-modal output pipeline** that delivers wisdom as text,
   synthesized voice (via tier-cascading TTS providers — ElevenLabs,
   Sarvam, Edge, browser fallback), and visualized dharmic concepts.
6. A **verse-of-the-day selector** that uses a deterministic
   per-calendar-day seed to give every user the same daily verse
   while still personalizing the long-form contextual selections.
7. A **dharmic-tag-grouped theme curation** that exposes the same
   corpus through six experience surfaces (Inner Peace, Courage,
   Wisdom, Devotion, Right Action, Letting Go), generated by a
   deterministic pipeline from the per-verse tag set.

The technical advantage claimed is: **a spiritual companion experience
that is both AI-driven AND anchored in a verifiable public-domain
source corpus, with measurable mood-shift outcomes per verse and
provider-failure resilience.**

---

## 6. Detailed description (component-level)

### 6.1 The dharmic-tag schema

Each verse is represented as:

```json
{
  "chapter": int,
  "verse": int,
  "sanskrit": str,        // original ancient text (public domain)
  "transliteration": str, // IAST scholarly convention (public domain)
  "english": str,         // public-domain translation (Besant 1905+)
  "chapter_name": str,
  "theme": str,                          // single primary theme tag
  "principle": str,                      // short principle string
  "mental_health_applications": [str]    // list of tags
}
```

The schema is implemented at
`data/gita/gita_verses_complete.json` and the indexing layer at
`backend/services/sakha_wisdom_engine.py:_load_verses`.

### 6.2 The mood→theme mapping layer

`MOOD_THEME_MAP` (backend/services/sakha_wisdom_engine.py:28) is a
12×N mapping from emotional state to dharmic tag set. The set is
ordered: tags earlier in the list are weighted higher during retrieval.

### 6.3 The effectiveness-learning corpus selector

Implemented in `backend/services/dynamic_wisdom_corpus.py`. Records:

- Verse delivered
- User mood at delivery time
- Mood ~5 min after delivery (the "mood shift")
- Engagement signals (response_length, session_continued, etc.)

Computes a confidence-weighted effectiveness score per verse-mood pair
using ~20 hyperparameters defined at the top of the file. Future
deliveries select verses by the score multiplied by a sample-size
confidence factor.

### 6.4 The provider-agnostic AI orchestrator

`backend/services/ai_provider.py:call_kiaan_ai` — single entry point
that accepts the prompt context and dispatches based on
`AI_PROVIDER` + `AI_MODEL` env vars. Includes:

- Bounded conversation memory (last N turns)
- Hard timeout
- Privacy-safe logging (provider + model + latency only, never content)
- Fallback chain at `kiaan_sovereign_mind.py:IntelligenceFallbackChain`

### 6.5 The multi-modal output pipeline

Voice synthesis cascade (mobile + web):
- Tier 1: ElevenLabs (highest quality)
- Tier 2: Sarvam AI (Indian-language quality)
- Tier 3: Microsoft Edge TTS (free, broad coverage)
- Tier 4: OpenAI TTS
- Tier 5: Browser SpeechSynthesis (always works)

Each tier has independent timeout + cache; cache key includes
(text, voice, tempo) so re-plays are instant.

### 6.6 The theme curation pipeline

`scripts/generate_gita_themes.py` consumes the corpus and produces a
`themes.json` mapping `{theme_id: [verse_ref, ...]}` based on
dharmic-tag overlap. The output is bundled into the mobile app via
Metro at build time so the experience works offline.

---

## 7. Claims (outline — counsel will draft formal claims)

The user should aim for ~15–20 claims, structured as ~3 independent
+ ~15 dependent. Suggested top-level claim language:

**Claim 1 (system):** A spiritual-wellness coaching system comprising
a non-transitory computer-readable medium storing a public-domain
religious-text corpus, wherein each entry in said corpus is associated
with a set of structured dharmic-tags including at least a theme and a
list of mental-health applications, AND processor-executable code that:
  (a) detects an emotional state of a user;
  (b) maps said state to a subset of said dharmic-tags via a stored
      mood-to-tag mapping;
  (c) selects from said corpus an entry whose dharmic-tags overlap
      said subset, biased by a learned effectiveness score for the
      user;
  (d) routes a synthesized response request to one of a plurality of
      language model providers via a provider-agnostic interface; AND
  (e) delivers said response through one or more output modalities
      including text, synthesized voice, and visual representation.

**Claim 2 (method):** A method [...] comprising the operations of
claim 1, performed in real time over a network ...

**Claim 3 (medium):** A non-transitory computer-readable medium ...

Dependent claims should narrow on:
- The specific dharmic-tag set
- The specific mood-to-tag mapping
- The effectiveness-learning algorithm
- The provider-failover cascade
- The deterministic-per-day verse-of-day selector
- The theme curation pipeline
- The voice synthesis tier cascade
- The offline-first bundling

---

## 8. Why this is patentable

- **Novelty:** No existing patent (so far as the founder can confirm)
  combines (a) PD religious-text corpus + (b) structured dharmic-tag
  schema + (c) effectiveness-learning per-verse-per-mood +
  (d) multi-provider AI orchestration into a single system.
- **Non-obviousness:** Each of (a)-(d) alone is not novel; the specific
  *combination* and the *dharmic-tag schema design* are.
- **Utility:** Demonstrable user outcomes (mood-shift telemetry from
  the dynamic_wisdom_corpus learning loop).
- **Eligibility (Alice/Mayo):** This is not abstract — the dharmic-tag
  schema is a specific technical structure, and the effectiveness-
  learning is a concrete improvement in user experience routing.

---

## 9. Why a provisional now (not a non-provisional)

- Provisional preserves a **priority date** (today) at low cost ($120)
- 12-month window to refine the technology before non-provisional
- During that 12 months, public commits, App Store launch, and any
  publication will not affect novelty *as of the provisional date*
- After ~6–9 months of operating the live system, the founder will
  have additional learning-loop data to strengthen claims (4) in the
  non-provisional

The downside: a provisional that is **never followed by a non-provisional
within 12 months** is automatically abandoned and gives no protection.
Calendar the deadline.

---

## 10. Action checklist for the user

- [ ] Email 3 US patent attorneys (we recommend boutique software-IP
      firms with India practice, since the founder is in India):
  - Cooley LLP — Palo Alto / Boston
  - Fenwick & West — South Bay
  - Goodwin Procter — Boston
  Ask each for: (a) flat-fee provisional drafting estimate,
  (b) FTO search estimate, (c) timeline to file
- [ ] Confirm entity status — micro-entity status saves ~75% on USPTO
      fees. Eligibility: gross income < ~$220k/yr and < 4 prior US
      applications, OR university-/government-affiliated
- [ ] Provide counsel with:
  - This disclosure draft
  - Read access to `backend/services/sakha_wisdom_engine.py`,
    `dynamic_wisdom_corpus.py`, `ai_provider.py`, `scripts/generate_gita_themes.py`
  - The PROVENANCE.md + OPEN_SOURCE_LICENSES.md ledger (proves corpus
    is PD, not derivative)
- [ ] File within 30–45 days of first public commit (2026-04-19) →
      target file date: 2026-05-19 to 2026-06-03
- [ ] After filing, mark every public-facing description ("Patent
      pending") — DO NOT mark before the filing receipt arrives
- [ ] Calendar a hard deadline 11 months out for the non-provisional
      filing decision
