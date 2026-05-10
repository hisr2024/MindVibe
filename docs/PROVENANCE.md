# Provenance & Source Licenses

**Authoritative register of every external corpus, dataset, and content artifact ingested into MindVibe.**

This document satisfies the §4.5 (Database Rights) and §4.7 rule 2 ("Provenance log") obligations defined in [`docs/FRAMEWORK.md`](./FRAMEWORK.md). Every item ingested **must** be recorded here with: source, license, date imported, transformation summary, and the maintainer responsible.

> **Why this matters.** Database rights and the editorial copyright of derivative works (sanitized, tagged, indexed corpora) depend on demonstrating: (a) the source license permits our use, (b) we made a substantial editorial / engineering investment, and (c) we can trace any verse, line, or label back to its origin. This file is the audit trail.

---

## How to use this document

1. **Adding a corpus / dataset / model / asset:** open a PR that appends a row to the relevant section below. Fill every column. Do not merge if any field is `TBD`.
2. **Removing or replacing a source:** mark the row `RETIRED` with the date and reason; do not delete history.
3. **License changes upstream:** update the `License` and `License URL` fields and add a note in the changelog at the bottom.
4. **Annual review:** the IP owner reviews this register every 12 months and re-confirms attributions in app `About`/`Credits` screens.

Field definitions:

- **Artifact** — repo path or product surface where the source is used.
- **Source** — origin (publisher, dataset name, model name, vendor).
- **License** — SPDX identifier where possible (e.g. `CC-BY-4.0`, `Public-Domain`, `Proprietary`, `MIT`, `Apache-2.0`).
- **License URL** — link to the canonical license text.
- **Acquired** — ISO date (YYYY-MM-DD) when imported.
- **Transformation** — what we did (sanitized, tagged, embedded, transliterated, sliced).
- **Attribution** — exact attribution string surfaced to end users (or `Internal-only`).
- **Owner** — internal maintainer (team alias).

---

## 1. Bhagavad Gita Corpus

### 1.1 Sanskrit (Devanagari) text

| Artifact | Source | License | License URL | Acquired | Transformation | Attribution | Owner |
|---|---|---|---|---|---|---|---|
| `data/gita/gita_verses_complete.json` (sa field) | **Gita Press, Gorakhpur** — printed editions of the Bhagavad Gita | Public-Domain (text); editorial layout © Gita Press | TBD — verify regional terms | TBD | UTF-8 Unicode capture, schema normalization, IAST transliteration cross-check | "Sanskrit text per Gita Press, Gorakhpur tradition" | content-team |
| Validation cross-reference | **IIT Kanpur Gita Supersite** (gitasupersite.iitk.ac.in) | Academic / non-commercial reference | https://www.gitasupersite.iitk.ac.in | TBD | Used only for cross-validation of variants; not redistributed | "Cross-referenced with IIT Kanpur Gita Supersite" | content-team |

> **Status:** verses are from a public-domain composition (5,000+ years old). The *editorial layout* of any modern publisher is copyrightable; we capture only the canonical text characters (Unicode), not page layout or typesetting. Confirm with counsel before shipping any scan or facsimile.

### 1.2 IAST transliteration

| Artifact | Source | License | License URL | Acquired | Transformation | Attribution | Owner |
|---|---|---|---|---|---|---|---|
| `data/gita/gita_verses_complete.json` (`transliteration` field) | Internally generated against IAST standard | © MindVibe (original work) | — | TBD | Algorithmic + human-reviewed transliteration to IAST per `data/gita/README.md` | Internal-only | content-team |

### 1.3 English translation

| Artifact | Source | License | License URL | Acquired | Transformation | Attribution | Owner |
|---|---|---|---|---|---|---|---|
| `data/gita/en.json`, `data/gita/gita_verses_complete.json` (`en` / `translation_en`) | **TBD** — confirm whether translations are (a) public-domain editions (e.g. Edwin Arnold, Annie Besant, Swami Sivananda where out of copyright), (b) licensed, or (c) original MindVibe translation | TBD | TBD | TBD | Sanitized to "universal" framing per `WisdomKB` sanitizer; tagged with emotion/intent labels | TBD | content-team + legal |

> **ACTION REQUIRED.** The translation source must be confirmed before public release. If derivative of a copyrighted translation, secure a license or replace with a clean-room translation.

### 1.4 Hindi translation

| Artifact | Source | License | License URL | Acquired | Transformation | Attribution | Owner |
|---|---|---|---|---|---|---|---|
| `data/gita/hi.json` (`hi` / `translation_hi`) | TBD | TBD | TBD | TBD | Same as 1.3 | TBD | content-team + legal |

### 1.5 Other-language verse renderings

For every additional language file under `data/gita/` (and any future addition), add a row here with the source translator/edition and license. Do not ship a language until this row is filled.

| Language | File | Source | License | Acquired | Owner |
|---|---|---|---|---|---|
| (e.g. Tamil) | `data/gita/ta.json` (if exists) | TBD | TBD | TBD | content-team |

### 1.6 Emotion / intent tag layer

| Artifact | Source | License | License URL | Acquired | Transformation | Attribution | Owner |
|---|---|---|---|---|---|---|---|
| Tags in `data/gita/gita_verses_complete.json`, `data/gita/mental_health_tag_guide.md` | © MindVibe (original editorial work) | Proprietary — Trade Secret in part (taxonomy weights) | — | ongoing | Original tag taxonomy + per-verse labeling per `mental_health_tag_guide.md` | Internal-only | content-team |

> This is a primary substrate of MindVibe's database right (sui generis) — preserve the labeling history.

---

## 2. Wisdom Subsets & Application Graphs

| Artifact | Source | License | Acquired | Transformation | Owner |
|---|---|---|---|---|---|
| `data/wisdom/verses.json` | Subset of §1 corpus | Inherits §1 | TBD | Curated subset for fast paths | content-team |
| `data/authentic_key_verses.json` | Subset of §1 corpus | Inherits §1 | TBD | Hand-picked anchor verses | content-team |
| `data/gitaVerses.ts` | Subset of §1 corpus | Inherits §1 | TBD | TS-friendly reshaping for client | frontend-team |
| `backend/services/kiaan_verse_application_graph.py` (data within) | © MindVibe | Proprietary — Trade Secret | ongoing | Verse → application context graph | engine-team |

---

## 3. Relationship Compass Corpus

| Artifact | Source | License | Acquired | Transformation | Owner |
|---|---|---|---|---|---|
| `data/relationship_compass/gita_index.sqlite` | Derived from §1 corpus | Inherits §1 + © MindVibe (index structure) | TBD | SQLite FTS index over relationship-relevant verses | engine-team |

---

## 4. Viyoga / Ardha / Karma Knowledge

| Artifact | Source | License | Acquired | Transformation | Owner |
|---|---|---|---|---|---|
| `data/viyoga/` | © MindVibe (original) | Proprietary | ongoing | Original framework content | content-team |
| `data/ardha_knowledge_base.py` | © MindVibe (original) | Proprietary | ongoing | Cognitive-distortion → reframe mapping | engine-team |
| `data/gita_wisdom.py` | Derived from §1 + © MindVibe | Inherits §1 + Proprietary | ongoing | Engine-side wisdom helpers | engine-team |

---

## 5. AI Models & API Vendors

These are *consumed* services, not redistributed. Each appears in `.env.example` with the required key. Vendor T&Cs govern use, including any restrictions on training-data usage of our prompts and outputs.

| Vendor | Use | Plan / Tier | T&Cs URL | Data-handling addendum | Owner |
|---|---|---|---|---|---|
| **OpenAI** (`gpt-4o-mini`, embeddings) | KIAAN reasoning, embedding | TBD | https://openai.com/policies | Confirm "no-training" enterprise option | platform-team |
| **Anthropic** (Claude) | Fallback reasoning | TBD | https://www.anthropic.com/legal | Confirm DPA + zero-retention | platform-team |
| **Sarvam AI** | Indic STT / TTS | TBD | https://sarvam.ai | TBD | voice-team |
| **Bhashini** (Govt. of India) | Indic STT / TTS / translation | Per Bhashini ULCA terms | https://bhashini.gov.in | Public-good license; verify commercial-use clause | voice-team |
| **ElevenLabs** | Premium TTS | TBD | https://elevenlabs.io/terms | Verify voice-cloning consent path | voice-team |
| **Microsoft Edge TTS** | Free TTS fallback | Edge TTS terms | https://learn.microsoft.com/legal | Non-commercial clauses to confirm | voice-team |
| **Whisper** (open weights) | On-device / server STT | MIT | https://github.com/openai/whisper | — | voice-team |
| **Hugging Face Transformers** (`@huggingface/transformers`) | Client ML | Apache-2.0 | https://github.com/huggingface/transformers | — | frontend-team |
| **Sentry** | Error tracking | Commercial | https://sentry.io/terms | DPA in place | platform-team |
| **Stripe / PayPal / Razorpay** | Payments | Commercial | vendor sites | DPA + PCI scope mapped | billing-team |
| **Firebase** (optional) | Auth | Commercial | https://firebase.google.com/terms | Region pinning | platform-team |
| **Expo Push / APNs / FCM** | Notifications | Vendor terms | vendor sites | — | mobile-team |

> **No-training discipline.** For each LLM/voice vendor, confirm a "no-training on customer data" path is selected. Record the contract date and DPA reference here. Until confirmed, treat output of those vendors as if they may be retained.

---

## 6. Translations (UI Strings, 17 languages)

| Artifact | Source | License | Acquired | Transformation | Attribution | Owner |
|---|---|---|---|---|---|---|
| `locales/<lang>/*.json` | TBD per language — record translator agency, freelancer, or community contributor | Work-for-hire / assignment to MindVibe | per file | Translation of UI strings | Internal-only (credits in About screen) | i18n-team |

> **ACTION REQUIRED.** Each translator must have signed a work-for-hire or copyright-assignment agreement. Record signature date per language.

---

## 7. Brand & Visual Assets

| Artifact | Source | License | Acquired | Owner |
|---|---|---|---|---|
| `brand/` (logos, marks, motion) | Designed by / commissioned by MindVibe | Proprietary, all rights reserved | TBD | brand-team |
| Iconography (`app/icon.tsx`, `apple-icon.tsx`, OG images) | Original or licensed stock — record per file | TBD per asset | TBD | brand-team |
| Fonts | TBD | TBD (verify SIL OFL / commercial license) | TBD | brand-team |
| Stock imagery / illustration | TBD | TBD per asset | TBD | brand-team |
| Audio (background, breath cues, safety audio) | `prompts/safety_audio_manifest.json` is *generated*; underlying voice models per §5 | Proprietary recordings | ongoing | voice-team |

---

## 8. Open-Source Software Dependencies

The full machine-readable list lives in `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `requirements.txt`, and `requirements-dev.txt`. This section captures **license obligations** that need explicit handling.

| Concern | Where | Action |
|---|---|---|
| Copyleft (GPL, AGPL) | Verify none in `package.json` / `requirements.txt` | Run license scan in CI; block AGPL unless cleared |
| LGPL | Allowed if dynamically linked | Document in NOTICE |
| Apache-2.0 | Bundle NOTICE files | Generate `NOTICE` from SBOM |
| MIT / BSD / ISC | Attribution in About | Auto-generated credits page |
| Custom / dual-licensed | Manual review | Record per package below |

| Custom-license package | License | Compatibility | Owner |
|---|---|---|---|
| `vendor/bcryptjs` (vendored fork) | MIT (verify upstream) | OK | platform-team |
| `vendor/` (other vendored deps) | TBD per item | TBD | platform-team |

> **ACTION:** generate a Software Bill of Materials (SBOM, CycloneDX format) in CI and commit a license-summary file (`docs/SBOM.md`) referenced from here. Until then, this section is informational.

---

## 9. User-Generated Content (UGC)

UGC is **not** ingested into training datasets, IP corpora, or analytics models without explicit user opt-in. See `TERMS.md` and `PRIVACY.md`. Aggregated, de-identified analytics produced by `services/anonymization_service.py` are MindVibe IP.

| Surface | Stored where | Encryption | Used for |
|---|---|---|---|
| Journal entries | DB (encrypted blob) | Client-side AES-256-GCM + Fernet at rest | User retrieval only |
| Reflections | DB (encrypted) | As above | Karmalytix metadata only (mood/tag labels), never raw text |
| Voice utterances | Object storage (per retention policy) | TLS in transit, AES at rest | STT only; not retained beyond session unless opted-in |
| Mood logs | DB | Standard column-level | Personal analytics + de-identified aggregates |

---

## 10. Changelog

Track every material change to this document.

| Date | Change | PR | Reviewer |
|---|---|---|---|
| 2026-05-10 | Initial provenance register created | (this PR) | TBD |

---

## TBD audit

The fields marked `TBD` above are the open compliance items as of the date of this document. They must be resolved before the next major release or external partnership. Owners listed per row are responsible for closing them.

**Critical (block public release):**
- 1.3 English translation — confirm source license
- 1.4 Hindi translation — confirm source license
- 1.5 Other-language verse renderings — confirm per-language source
- 5. AI vendor "no-training" confirmations
- 6. Translator work-for-hire signatures
- 8. SBOM generation + license scan in CI

**Important (close within 90 days):**
- 1.1 Gita Press editorial-layout review
- 7. Font and stock-imagery license recording
- 8. Vendored-package license verification

---

> Maintained jointly by **engineering** and **legal**. Cross-linked from `README.md`, `docs/FRAMEWORK.md`, `LICENSE`, and `TERMS.md`.
