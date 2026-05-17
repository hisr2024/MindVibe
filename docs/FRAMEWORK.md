# MindVibe — Master Framework

**A privacy-first, AI-powered spiritual wellness platform combining timeless wisdom (Bhagavad Gita corpus) with modern emotional-intelligence engines.**

This document is the canonical reference for MindVibe's framework. It covers:

1. Executive overview and product mission
2. Architectural **skeleton** (layers, repo map, data flow)
3. **Detailed framework** for each subsystem
4. **Intellectual Property (IP) surface** — where, how, and what can be protected, licensed, or commercialized
5. Cross-cutting concerns (security, performance, scale, observability, compliance)
6. Roadmap and extension points

> Audience: engineers, architects, legal/IP counsel, partners, investors.

---

## Table of Contents

- [1. Executive Overview](#1-executive-overview)
- [2. The Skeleton](#2-the-skeleton)
  - [2.1 Layered Architecture](#21-layered-architecture)
  - [2.2 Repository Map](#22-repository-map)
  - [2.3 Request Lifecycle](#23-request-lifecycle)
- [3. Detailed Framework](#3-detailed-framework)
  - [3.1 KIAAN — Conversational Wisdom Companion](#31-kiaan--conversational-wisdom-companion)
  - [3.2 Wisdom Engine & Gita Corpus](#32-wisdom-engine--gita-corpus)
  - [3.3 Karmalytix — Reflection & Analytics Engine](#33-karmalytix--reflection--analytics-engine)
  - [3.4 Karma Footprint Engine](#34-karma-footprint-engine)
  - [3.5 Karma Reset & Emotional Reset](#35-karma-reset--emotional-reset)
  - [3.6 Journey Engine](#36-journey-engine)
  - [3.7 Ardha — Reframing Engine](#37-ardha--reframing-engine)
  - [3.8 Relationship Compass](#38-relationship-compass)
  - [3.9 Multilingual Voice Stack](#39-multilingual-voice-stack)
  - [3.10 Mood, Journal, Notifications, Identity](#310-mood-journal-notifications-identity)
- [4. Where IP Can Be Used (IP Surface)](#4-where-ip-can-be-used-ip-surface)
  - [4.1 Patentable Inventions](#41-patentable-inventions)
  - [4.2 Trade Secrets](#42-trade-secrets)
  - [4.3 Copyrightable Works](#43-copyrightable-works)
  - [4.4 Trademarks & Brand Marks](#44-trademarks--brand-marks)
  - [4.5 Database Rights & Curated Corpora](#45-database-rights--curated-corpora)
  - [4.6 Licensable Components & Commercial Surfaces](#46-licensable-components--commercial-surfaces)
  - [4.7 IP Hygiene Rules](#47-ip-hygiene-rules)
- [5. Cross-Cutting Concerns](#5-cross-cutting-concerns)
- [6. Roadmap & Extension Points](#6-roadmap--extension-points)

---

## 1. Executive Overview

**MindVibe** is a multi-platform (web + native iOS/Android) spiritual wellness system that operationalizes timeless wisdom (Bhagavad Gita and adjacent corpora) into measurable, personalized emotional-health interventions.

The product is composed of **independent but composable engines**:

| Engine | One-line purpose |
|---|---|
| **KIAAN** | Conversational AI companion (multilingual, voice + text) grounded in a verified wisdom corpus |
| **Wisdom Engine** | Retrieval, sanitization (religious → universal), and contextualization of 700+ verses |
| **Karmalytix** | Reflection-driven longitudinal analytics with emotional pattern extraction |
| **Karma Footprint** | Intention-aware daily action classifier producing a "plant vs shadow" visualization payload |
| **Karma Reset** | Guided ritual flow for emotional release and re-orientation |
| **Journey Engine** | Multi-day curricula (e.g., "Transform Anger / Krodha") with progress, recommendations, and idempotent step completion |
| **Ardha** | Cognitive reframing engine for thought-distortion repair |
| **Relationship Compass** | Dyadic relational analysis using a private RAG over relationship-wisdom shards |
| **Voice Stack** | Multilingual STT → reasoning → TTS pipeline with provider fallback (Sarvam, Bhashini, ElevenLabs, Edge, OpenAI) |

The platform is opinionated about three non-negotiables: **privacy** (E2E encryption for reflections), **provenance** (every wisdom citation traces to a verified verse), and **compassion** (errors heal, never frighten).

---

## 2. The Skeleton

### 2.1 Layered Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                              │
│  Next.js 14 (App Router) · iOS (Swift/SwiftUI) · Android (Kotlin/Compose)│
│  Service Worker · IndexedDB offline cache · WebRTC voice                 │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │  HTTPS / WSS  (mTLS optional)
┌──────────────────────────────────▼───────────────────────────────────────┐
│                         EDGE / API GATEWAY                               │
│  Next.js API routes · proxy.ts · rate-limit · auth (JWT EdDSA + HS256)   │
│  CSP · CORS · prompt-injection detector · pii-redactor                   │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────────┐
│                           APPLICATION LAYER                              │
│                          FastAPI (backend/main.py)                       │
│  Routes  →  Services  →  Models  →  DB / Cache / Vector / TTS / STT      │
└─────┬─────────────┬──────────────┬─────────────┬─────────────┬───────────┘
      │             │              │             │             │
   ENGINES     RAG / WISDOM    AI PROVIDERS  VOICE STACK   ANALYTICS
   (KIAAN,     (WisdomKB,      (OpenAI,      (Sarvam,      (Karmalytix,
   Karmalytix, Gita corpus,    Anthropic,    Bhashini,     wellness_score,
   Karma,      RAG service,    fallback      ElevenLabs,   ML services)
   Journey,    Pinecone-       chain)        Edge, Whisper)
   Ardha,      compatible)
   Compass)
      │
┌─────▼────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                    │
│  PostgreSQL (SQLAlchemy) · Redis (cache+queue) · Vector store ·          │
│  Object storage (audio) · Encrypted journal blobs (Fernet/AES-256-GCM)   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Repository Map

```
MindVibe/
├── app/                       # Next.js App Router (web frontend)
│   ├── (app)/ (marketing)/    # Route groups
│   ├── kiaan/ kiaan-vibe/     # Chat companion UIs
│   ├── kiaan-voice-companion/ # Voice UI
│   ├── journey-engine/ journeys/
│   ├── karma-footprint/ karmic-tree/
│   ├── ardha/ emotional-reset/ deep-insights/
│   └── api/                   # Next.js BFF / proxy routes
├── backend/                   # FastAPI service
│   ├── main.py                # App factory, router wiring
│   ├── routes/                # 60+ HTTP/WS endpoints (kiaan, gita, journeys, …)
│   ├── services/              # Engine implementations + AI providers
│   │   ├── kiaan_*.py         # KIAAN orchestrator, memory, learning, voice
│   │   ├── gita_*.py          # Wisdom retrieval, validator, enrichment
│   │   ├── karmalytix_*.py    # Reflection + analytics
│   │   ├── karma_*.py         # Footprint, reset, problem resolver
│   │   ├── relationship_compass_*.py
│   │   ├── ardha_*.py         # Reframing engine
│   │   ├── *_tts_service.py   # Sarvam, Bhashini, ElevenLabs, Edge
│   │   ├── pii_redactor.py prompt_injection_detector.py
│   │   └── pipeline/ voice/ ai/ journey_engine/
│   ├── models/                # SQLAlchemy models (per domain)
│   ├── schemas/               # Pydantic contracts
│   ├── security/ middleware/  # Auth, rate-limit, headers, CSRF
│   ├── analytics/ monitoring/ # Metrics, dashboards
│   └── migrations/            # Alembic
├── components/                # Shared React components (UI kit + domain)
├── lib/                       # Frontend domain logic
│   ├── kiaan-friend-engine.ts kiaan-vibe/ kiaan-voice/
│   ├── journey/ payments/ subscription/
│   ├── crypto/ consent/ feature-flags.ts
│   └── i18n/ navigation/ offline/
├── content/ data/             # Wisdom JSON, verse mappings, content packs
├── locales/ (17 langs)        # UI translations
├── kiaanverse-mobile/         # React Native shell
├── native/                    # iOS (Swift) + Android (Kotlin) source
├── prompts/                   # System prompts (KIAAN, Karmalytix, Ardha, …)
├── docs/                      # 60+ architecture & feature docs (this file)
├── tests/ backend/tests/      # Vitest, Pytest, Playwright
└── scripts/ migrations/       # DevOps, key gen, content build
```

### 2.3 Request Lifecycle

```
User
  │  (UI action, voice utterance, journal save, etc.)
  ▼
Next.js client ── Service Worker (offline queue) ──▶ IndexedDB
  │
  ▼  fetch / WS
Next.js API route (proxy.ts) ── auth check, CSP, rate-limit
  │
  ▼  HTTPS
FastAPI router (backend/routes/*.py)
  │
  ├─▶ middleware: auth → prompt-injection → pii-redactor → rate-limit
  │
  ▼
Service layer (engine orchestrator, e.g. kiaan_agent_orchestrator.py)
  │
  ├─▶ Wisdom Engine (RAG over verified Gita corpus)
  ├─▶ AI Provider chain (primary → fallback → cached degraded)
  ├─▶ Voice Stack (STT/TTS provider routing)
  └─▶ Persistence (SQLAlchemy + Redis + encrypted blob)
  │
  ▼
Response composer (sakha_voice_persona, response_engine)
  │
  ▼  JSON / SSE / WSS frame
Client renders + caches + emits analytics event
```

---

## 3. Detailed Framework

Each engine below follows the same shape: **purpose → contract → internal flow → key files → failure & fallback → IP notes**.

---

### 3.1 KIAAN — Conversational Wisdom Companion

**Purpose.** A multilingual, voice-first AI companion that responds with emotionally-attuned, Gita-grounded guidance — never preachy, always compassionate.

**Contract (simplified).**
```
POST /api/kiaan/chat
  in : { user_id, message, language, mode: "friend"|"divine"|"learning",
         session_id, voice?: bool, modality: "text"|"audio" }
  out: { reply: string, citations: [{verse_id, chapter, shloka}],
         emotion_tag, audio_url?, latency_ms, provider, degraded?: bool }
```

**Internal flow.**
```
incoming utterance
   ▼
prompt_injection_detector  ──▶ reject / neutralize
   ▼
pii_redactor               ──▶ scrub names, emails, phones (reversible map)
   ▼
kiaan_engine_router        ──▶ pick mode (friend / divine / learning / sovereign)
   ▼
kiaan_deep_memory          ──▶ retrieve user context (window + long-term)
   ▼
WisdomKB (RAG)             ──▶ top-k verses (verified, sanitized)
   ▼
kiaan_response_composer    ──▶ persona + tone + reframe
   ▼
kiaan_model_provider       ──▶ primary LLM → fallback LLM → degraded template
   ▼
safety_validator           ──▶ block crisis / unsafe outputs
   ▼
voice synthesis (optional) ──▶ Sarvam → Bhashini → ElevenLabs → Edge
   ▼
kiaan_audit                ──▶ append-only audit trail (no PII)
```

**Key files.**
- `backend/services/kiaan_agent_orchestrator.py` (top-level)
- `backend/services/kiaan_engine_router.py` (mode selection)
- `backend/services/kiaan_response_composer.py`
- `backend/services/kiaan_deep_memory.py` (memory ranks: episodic, semantic, value)
- `backend/services/kiaan_self_sufficiency.py` (offline-degraded mode)
- `prompts/` (system prompts per mode)

**Failure & fallback.**
- Provider down → fallback chain (`kiaan_model_provider.py`).
- Wisdom corpus stale → cached top-k from Redis.
- Voice synth fail → degrade to text (`degraded: true` in response).
- Crisis detected → safety branch with helpline routing (`crisis_partial_scanner.py`).

**IP notes.** See §4.1 (mode-routing patent), §4.2 (composer prompts trade-secret), §4.3 (UI).

---

### 3.2 Wisdom Engine & Gita Corpus

**Purpose.** Make 700+ verses queryable by *emotion + intent + context*, while sanitizing religious framing into universal language for a global audience.

**Internal flow.**
```
query (emotion + situation tags)
   ▼
gita_wisdom_retrieval ── vector search (k=20)
   ▼
gita_validator        ── reject low-confidence, dedup
   ▼
gita_wisdom_filter    ── domain & age-appropriateness
   ▼
text sanitizer        ── religious → universal phrasing
   ▼
gita_response_composer ── pick 1-3 verses, format with citation
```

**Key files.** `gita_service.py`, `gita_wisdom_retrieval.py`, `gita_validator.py`, `gita_response_composer.py`, `gita_emotional_wisdom.py`, `gita_karma_wisdom.py`, `dynamic_wisdom_corpus.py`, `gita_wisdom_auto_enricher.py`.

**Data.** Curated under `content/` and `data/` with provenance metadata (source, translator, license).

**IP notes.** See §4.5 (curated DB right), §4.1 (sanitization pipeline patent), §4.2 (ranking weights).

---

### 3.3 Karmalytix — Reflection & Analytics Engine

**Purpose.** Convert daily reflections + mood data into longitudinal emotional analytics (patterns, drift, recovery time, NPS-like wellness score).

**Contract.**
```
POST /api/karmalytix/reflect
  in : { user_id, reflection_text, mood, context_tags[] }
  out: { themes[], affect_vector, drift_score,
         insight: string, recommended_action }
```

**Internal flow.** `karmalytix_reflection.py` → `emotional_pattern_extraction.py` → `mood_analytics_engine.py` → `wellness_score_service.py` → `insight_generator_service.py`.

**IP notes.** §4.1 (drift-score algorithm), §4.2 (prompt library), §4.3 (dashboard UX).

---

### 3.4 Karma Footprint Engine

**Purpose.** Classify a day's logged actions by **intention quality**, output a JSON contract that drives a "plant vs shadow" visualization. Strictly secular, neutral, non-judgmental, and *isolated* from KIAAN.

**Public contract** (verbatim spec in `docs/karma_footprint_engine.md`):
```json
{
  "summary": "...",
  "plant_growth_delta": 0.0,
  "shadow_delta": 0.0,
  "actions": [
    { "label": "...", "category": "...", "intention_score": 0.0,
      "impact": "+light"|"-shadow"|"neutral" }
  ]
}
```

**Isolation invariant.** This engine **must not** intercept KIAAN traffic. Enforced in `kiaan_engine_router.py` and validated in tests.

**Key files.** `backend/routes/karma_footprint.py`, `backend/services/karma_*.py`, `app/karma-footprint/`, `app/karmic-tree/`.

**IP notes.** §4.1 (intention-classification + footprint-delta method), §4.4 ("Karma Footprint", "Karmic Tree" marks).

---

### 3.5 Karma Reset & Emotional Reset

**Purpose.** A guided multi-step ritual flow (breath → witness → release → reframe → commit) that produces a measurable emotional delta and a Gita-grounded affirmation.

**Key files.** `backend/services/karma_reset_engine.py`, `karma_reset_service.py`, `karma_reset_kiaan.py`, `emotional_reset_service.py`, `app/emotional-reset/`.

**IP notes.** §4.1 (multi-stage ritual state machine), §4.3 (motion/animation spec — `docs/motion-spec.mdx`).

---

### 3.6 Journey Engine

**Purpose.** Multi-day structured curricula (e.g., "Transform Anger / Krodha — 14 days") with progress, recommendations, and **race-safe idempotent step completion**.

**Critical correctness rule.** Progress is computed from `COUNT(completed_steps) / total_days`, **not** from `current_day_index` — this is enshrined as ADR-001 in `CLAUDE.md` and must be preserved.

**Contract.**
```
POST /api/journeys/{journey_id}/steps/{day_index}/complete
  → idempotent; concurrent calls → exactly one "completed" winner
```

**Key files.** `backend/services/journey_engine/`, `journey_service.py`, `backend/routes/journey_engine.py`, `app/journey-engine/`, `app/journeys/`, `lib/journey/`.

**IP notes.** §4.1 (recommendation algorithm conditioned on completion-shape, not raw days).

---

### 3.7 Ardha — Reframing Engine

**Purpose.** Detect cognitive distortions in user input and offer Gita-anchored reframes.

**Key files.** `backend/services/ardha_reframing_engine.py`, `ardha_prompts.py`, `backend/routes/ardha.py`, `app/ardha/`, `lib/ardha-knowledge.ts`.

**IP notes.** §4.2 (reframe prompt library), §4.1 (distortion → verse mapping).

---

### 3.8 Relationship Compass

**Purpose.** Dyadic relational analysis (parent–child, partner, colleague) using a private RAG over relationship-wisdom shards, returning a "compass" (4-axis vector + narrative).

**Key files.** `relationship_compass_engine.py`, `relationship_compass_rag.py`, `relationship_compass_storage.py`, `relationship_compass_synthesizer.py`, `relationship_wisdom_core.py`.

**IP notes.** §4.1 (4-axis dyadic model), §4.5 (relationship corpus).

---

### 3.9 Multilingual Voice Stack

**Purpose.** Bidirectional voice in 17 languages with provider routing, cost-aware fallback, and a sovereign on-device path for privacy mode.

```
mic ──▶ VAD (@ricky0123/vad-web)
     ──▶ STT: whisper_transcription / Sarvam / Bhashini
     ──▶ KIAAN reasoning
     ──▶ TTS routing (voice_compute_policy.py):
           Sarvam (Indic) → Bhashini → ElevenLabs (premium) →
           Edge (free) → on-device fallback
     ──▶ WebRTC / WSS audio frame
```

**Key files.** `backend/services/*_tts_service.py`, `kiaan_unified_voice_engine.py`, `kiaan_divine_voice.py`, `multilingual_voice_engine.py`, `backend/routes/voice_companion_wss.py`, `lib/kiaan-voice/`.

**IP notes.** §4.1 (cost-aware multi-provider routing policy), §4.4 ("KIAAN Voice").

---

### 3.10 Mood, Journal, Notifications, Identity

| Module | Notes |
|---|---|
| **Mood** | `routes/moods.py`, `services/calming_mood_analytics.py`, offline-first on mobile |
| **Journal** | Client-side AES-256-GCM + Fernet at rest; server cannot decrypt |
| **Notifications** | `notification_dispatcher.py`, Expo + APNs/FCM, `divineNotifications.ts` |
| **Identity** | JWT EdDSA + HS256; WebAuthn (`webauthn.py`); Firebase optional |
| **Compliance** | GDPR/DPDP — `routes/gdpr.py`, `services/data_retention.py`, `compliance.py` |

---

## 4. Where IP Can Be Used (IP Surface)

> **Note for counsel:** this section is an inventory, not legal advice. Treat as a starting point for filing strategy. All numbered items below should be reviewed with a registered patent attorney before disclosure.

### 4.1 Patentable Inventions

Candidate inventions where MindVibe contributes non-obvious technical methods:

| # | Invention | Where in code | Claim shape |
|---|---|---|---|
| **P-1** | **Religious-to-universal corpus sanitization pipeline** with provenance preservation | `gita_service.py`, `dynamic_wisdom_corpus.py`, sanitizer in `WisdomKB` | Method for transforming religiously-framed text into universal phrasing while retaining a verifiable cite-back path |
| **P-2** | **Emotion + intent + context retrieval ranker** over a verified verse corpus | `gita_wisdom_retrieval.py`, `gita_emotional_wisdom.py` | Multi-signal RAG ranker conditioned on affect vector + situational tag |
| **P-3** | **Mode-routing for a wisdom companion** (friend/divine/learning/sovereign) based on user state and consent | `kiaan_engine_router.py`, `kiaan_agent_orchestrator.py` | State-machine routing with privacy-tier gating |
| **P-4** | **Cost-aware, privacy-aware multi-provider voice routing** (Sarvam→Bhashini→ElevenLabs→Edge→on-device) | `voice_compute_policy.py`, `kiaan_unified_voice_engine.py` | Policy that selects TTS/STT provider per utterance based on cost, latency, language coverage, and user privacy tier |
| **P-5** | **Intention-aware Karma Footprint classifier** producing dual-axis (plant growth / shadow) deltas | `karma_footprint.py`, `karmalytix_*` | Method for classifying user-logged actions by intention quality and emitting bounded dual-axis deltas |
| **P-6** | **Multi-stage emotional reset state machine** with measurable pre/post delta and verse anchoring | `karma_reset_engine.py`, `emotional_reset_service.py` | Guided ritual state machine with verifiable affect delta |
| **P-7** | **Idempotent journey-step completion with race-safe progress derived from completion shape** (not day index) | `journey_engine/`, ADR-001 | Concurrency-safe progress computation immune to skipped days and double-completion |
| **P-8** | **Drift-score for longitudinal emotional state** combining reflection text, mood, and journey adherence | `wellness_score_service.py`, `analytics_ml_service.py` | Composite score with explainable factor decomposition |
| **P-9** | **4-axis dyadic relationship compass** with private RAG over relationship-wisdom shards | `relationship_compass_*` | Method for producing a 4-vector relational diagnosis from a private corpus |
| **P-10** | **Prompt-injection + PII redaction co-pipeline** with reversible PII map for personalization without leakage | `prompt_injection_detector.py`, `pii_redactor.py` | Combined defense + reversible-personalization technique |
| **P-11** | **Sovereign / self-sufficient mode**: deterministic degraded responses when LLM providers are unavailable | `kiaan_self_sufficiency.py`, `kiaan_sovereign_mind.py` | Offline-graceful AI companion with template-graph fallback |
| **P-12** | **Crisis-safety branching** with partial-utterance scanning for self-harm signals during streaming voice | `crisis_partial_scanner.py`, `safety_validator.py` | Streaming-time crisis detection on partial ASR output |

For each: keep an **invention disclosure form** with first-commit date, public-disclosure log, and named inventors. Many are eligible under recent US §101 / EPO guidance because they are concrete pipelines tied to measurable system behavior, not abstract ideas.

### 4.2 Trade Secrets

These should **never** appear in public artifacts (open-source, blog posts, app stores, review tooling):

- The full text of system prompts in `prompts/` (KIAAN modes, Ardha, Karmalytix, Karma Footprint, Compass).
- Ranking weights, thresholds, and tie-breakers in the wisdom retrieval ranker.
- The provider-routing policy table (latency × cost × language × privacy tier).
- The reflection → drift-score factor weights.
- The crisis-classifier feature set and thresholds.
- The intention-classifier label taxonomy (Karma Footprint).
- Internal evaluation datasets (golden sets) under `tests/` fixtures.

**Hygiene.** Mark these files with a header (`# CONFIDENTIAL — TRADE SECRET — DO NOT DISTRIBUTE`), gate them behind access controls, and exclude from public OSS releases.

### 4.3 Copyrightable Works

Auto-protected on creation; should also be **registered** in primary jurisdictions for statutory damages:

- Source code across `backend/`, `app/`, `components/`, `lib/`, `native/`.
- UI/UX design system: `brand/`, `styles/`, `components/`, `tailwind.config.ts`, `docs/motion-spec.mdx`, `docs/storyboards.mdx`.
- Documentation under `docs/` (this file included).
- Marketing copy under `app/(marketing)/` and `store-listings/`.
- Original translations in `locales/` (each translator should sign a work-for-hire / assignment).
- Voice persona scripts (`sakha_voice_persona.py`, response templates).
- Original verse commentaries and "universal" rewrites generated under MindVibe's editorial process (the rewrites are derivative — verify source license per verse; the *editorial layer* is yours).

### 4.4 Trademarks & Brand Marks

Candidate marks (verify availability before filing in target classes — typically Nice 9, 41, 42, 44):

- **MindVibe** (word + logo)
- **KIAAN** and **KIAANverse** (word + logo + voice/audio mark for the persona)
- **Karmalytix**
- **Karma Footprint** / **Karmic Tree** (figurative mark for the plant/shadow visualization)
- **Ardha** (in product context)
- **Karma Reset**, **Emotional Reset**
- **Sakha** (used internally in `package.json` `"name": "sakha"`) — investigate prior use
- **Wisdom Journeys** / **Journey Engine** (likely descriptive — pursue as figurative only)
- Tagline candidates ("wisdom for universal well-being") — only if used consistently as a source identifier.

File **intent-to-use** in priority markets (US, EU, IN, GB, JP) and watch for squatters in adjacent classes.

### 4.5 Database Rights & Curated Corpora

Especially relevant under the EU sui generis database right and the UK/IN equivalents:

- The **curated, sanitized, indexed Gita corpus** in `content/` + `data/` with emotion/intent tags.
- The **relationship-wisdom shards** corpus.
- The **golden evaluation datasets** under `tests/`.
- Aggregated, **de-identified** mood/journey trend data (subject to consent + DPDP/GDPR — see `services/anonymization_service.py`).

**Source license discipline.** For each external corpus (translations, public-domain editions, Sarvam/Bhashini outputs), record license + attribution in `data/<corpus>/LICENSE.md`. The *substantial investment* required for the sui generis right lives in your sanitization, tagging, and indexing layer — document it.

### 4.6 Licensable Components & Commercial Surfaces

Where MindVibe IP can be **packaged and licensed** to third parties:

| Surface | Customer | Bundle |
|---|---|---|
| **KIAAN-as-a-Service** API | Wellness apps, telehealth, EAP vendors | Auth + chat + voice + safety; SLAs |
| **Wisdom Engine SDK** | Edtech, content platforms | RAG-over-corpus with provenance |
| **Karma Footprint widget** | Habit/journaling apps | Embeddable JSON contract + UI kit |
| **Voice Stack adapter** | Indic-language SaaS | Multi-provider TTS/STT routing |
| **Compliance bundle** | Health/wellness startups | PII-redactor + prompt-injection detector + audit |
| **White-label mobile shell** | Faith-neutral wellness brands | `kiaanverse-mobile/` + theming |
| **Enterprise on-prem** | Hospitals, BPOs (employee wellness) | Sovereign mode + self-hosted models |

Pricing model candidates: per-API-call, per-MAU, per-seat (B2B2E), revenue-share for white-label.

### 4.7 IP Hygiene Rules

Adopt and enforce:

1. **CLAs / contributor agreements** — every external contributor signs a CLA (assignment + patent grant).
2. **Provenance log** — `docs/PROVENANCE.md` (to be created) listing every external corpus, its license, and the date of import.
3. **No-AI-training clause** in `TERMS.md` for user data unless explicit opt-in (already partially present — verify).
4. **Public vs private split** — anything under `prompts/` and ranking-weights stays in a private submodule before any open-source release.
5. **Patent-watch** — quarterly FTO scan in classes G06N, G06F, G10L (speech), A61B (well-being devices).
6. **Inventor logs** — first-commit date + named inventors per P-1…P-12 captured in a private register.
7. **License headers** — every source file gets the standard MindVibe header (LICENSE-aware: MIT for OSS portions, proprietary for engine cores).
8. **Trade-secret marking** — `# CONFIDENTIAL — TRADE SECRET` on protected files; CI lint to prevent accidental publication.
9. **DPDP/GDPR isolation** — IP-relevant analytics derived only from de-identified data (`anonymization_service.py`).
10. **Defensive publication** — for inventions you choose **not** to patent, publish a timestamped technical disclosure to block competitors from patenting them against you.

---

## 5. Cross-Cutting Concerns

### 5.1 Security

- JWT EdDSA + HS256, WebAuthn, rotating keys (`keyset_eddsa/`), strict CSP, CORS, CSRF.
- E2E encryption for journal entries (client-side key, server-blind).
- Rate-limit per IP and per user; tighter on auth endpoints.
- `prompt_injection_detector.py` + `pii_redactor.py` on every LLM call.
- See `docs/SECURITY_ARCH.md`, `SECURITY.md`, `docs/BACKEND_SECURITY_HARDENING.md`.

### 5.2 Performance Targets

- P50 API < 100 ms; P95 < 500 ms; P99 < 2 s.
- Frontend FCP < 1 s; LCP < 2.5 s; bundle < 150 KB gz.
- Cache layers: in-memory → Redis → CDN → Service Worker.
- N+1 prevention: `selectinload` everywhere journeys/steps relations are touched.

### 5.3 Scale

0–1K users (single instance) → 1K–10K (LB + read replica) → 10K–100K (autoscale + sharding) → 100K–1M (microservices + multi-region). See `docs/CAPACITY_LIMITS_REPORT.md`.

### 5.4 Observability

Sentry (`sentry.*.config.ts`), Prometheus-style metrics in `backend/monitoring/`, business KPI dashboards (active users, journeys started/completed, NPS, KIAAN insight latency, provider mix, cost per insight). PII never logged.

### 5.5 Compliance

- **GDPR / DPDP**: export, erasure, retention via `routes/gdpr.py`, `services/data_retention.py`.
- **HIPAA-grade tier** for journal/reflection (encryption, access logs, BAAs with vendors).
- **Accessibility**: WCAG 2.1 AA target.
- **Children**: 13+ minimum; age-gate.

---

## 6. Roadmap & Extension Points

| Phase | Focus | Deliverables |
|---|---|---|
| **Now** | Hardening | P-7 (idempotent journeys), P-10 (injection+PII co-pipeline), test coverage > 80% |
| **Next** | IP filings | Disclose P-1, P-2, P-4, P-5; trademark MindVibe + KIAAN in priority markets |
| **+90d** | Licensable SDKs | KIAAN-as-a-Service API, Wisdom Engine SDK, Karma Footprint widget |
| **+180d** | Sovereign mode | On-device LLM + on-device TTS for privacy tier; defensive publication for non-filed inventions |
| **+365d** | Enterprise | White-label mobile shell, B2B2E billing, on-prem package |

**Extension points** (stable interfaces for partners/contributors):

- `services/ai_provider.py` — add a new LLM backend.
- `services/*_tts_service.py` — add a new TTS provider.
- `services/journey_engine/` — add a new curriculum.
- `prompts/` — versioned prompt registry (semver).
- `content/` — add a new corpus shard with provenance metadata.
- `lib/feature-flags.ts` — gate new modules behind flags.

---

**Maintainer.** Engineering + Legal jointly own this document. Update on every major architectural or IP-relevant change. Cross-link from `README.md`, `CONTRIBUTING.md`, and the legal IP register.

🙏
