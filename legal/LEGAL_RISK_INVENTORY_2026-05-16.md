# Legal-Risk Surface Inventory — MindVibe / Kiaanverse

**Date:** 2026-05-16
**Scope:** Complete repository scan — patent, copyright, LLM/AI, trademark, privacy, compliance.
**Audience:** US patent attorney + digital-platform / SaaS lawyer.
**Not legal advice.** This is a factual inventory produced by static repo analysis. Counsel must validate every finding before acting on it.

---

## Executive summary

**71 findings. 40 open. 14 mitigated. 14 resolved. 2 unknown — needs counsel.**

### Six items that block public launch

| # | Item | Deadline / Severity |
|---|---|---|
| 1 | **US provisional patent filing** | **~11 days** (2026-06-03) before public-commit priority window closes |
| 2 | Private key committed to git (EdDSA, JWT forgery risk) | P0 — rotate this week |
| 3 | CSP `unsafe-inline` / `unsafe-eval` | P0 — XSS defeat |
| 4 | Gita English + Hindi translation source confirmation | P0 — PROVENANCE.md blocks release until confirmed |
| 5 | Anthropic + OpenAI DPAs with "no-training" clauses | P0 — currently claimed in PRIVACY.md without proof |
| 6 | `MINDVIBE_REFLECTION_KEY` not enforced in production | P0 — reflection data stored plaintext if key missing |

### Direct answer to "Can Anthropic sue me?"

**Not for patent or copyright infringement.** Anthropic doesn't hold a patent on "use my API to power your features," and copyright in Claude's *output* vests in the customer per their Commercial Terms. They can't IP-sue you for calling the API.

**They CAN bring contract claims under Anthropic Commercial Terms §3 (anti-reselling)** if subscription tiers look like metered resale of API access. Phase 1O already shipped mitigation copy (`backend/config/feature_config.py:11-34` "LEGAL POSTURE" block; `components/modals/QuotaExceededModal.tsx` rewording). The framing is now "fair-use limit on a feature bundle" not "per-call resale". **Open item: founder-side outreach to `partners@anthropic.com`** to formalize the relationship, and obtain a signed DPA confirming the "no training on customer data" clause currently *claimed* in `PRIVACY.md §4` without documented proof.

**They can also kill-switch your API key under AUP violations.** That's not a lawsuit, it's a shutdown.

---

## Category 1 — Anthropic / Claude API

6 findings, 4 open, 2 mitigated.

- **`backend/config/feature_config.py:11-34`** — LEGAL POSTURE block frames the quota as fair-use, not metered resale. Counsel must ratify language before launch. **[open]**
- **`backend/services/ai_provider.py:302-322`** — `_call_anthropic()` scaffolded but inactive (OpenAI is default per `AI_PROVIDER=openai`). DPA not on file. **[mitigated, owner-action-needed]**
- **`backend/services/karmalytix_reflection.py:159-230`** — `_call_claude()` calls `https://api.anthropic.com/v1/messages` with `claude-opus-4-5`. Only metadata sent, not raw journal content. Same DPA gap. **[mitigated, owner-action-needed]**
- **`backend/services/kiaan_model_provider.py:182-221`** — Three Claude models configured (3.5-sonnet, 3-opus, 3-haiku). None active in production. **[open]**
- **`components/modals/QuotaExceededModal.tsx:42-49`** — Post-Phase-1O copy explicitly disclaims metering. Defensible. **[mitigated]**
- **`PRIVACY.md:94-122`** — Claims Anthropic is GDPR Processor with no-training clause, but no DPA signature date or reference. **[mitigated, owner-action-needed]**

## Category 2 — Other LLM / AI

10 findings, 7 open, 1 resolved, 2 unknown.

- **OpenAI** (`ai_provider.py:268-297`) — Default provider. No DPA reference on file. **[open]**
- **Sarvam AI** (`bhashini_tts_service.py:1-160`) — Indic TTS. PROVENANCE.md marks license `TBD`. **[open]**
- **ElevenLabs** (`companion_voice_service.py:142-155`, voice IDs at 403-530) — Stock voices only, but commercial-tier DPA unconfirmed. **[open]**
- **Microsoft Edge TTS** — Free tier. Commercial-use clause unverified. **[open]**
- **Whisper (OpenAI STT)** — Listed in PROVENANCE.md:121 as MIT. Unclear if running on-device or via API. **[open]**
- **Silero VAD v3** — MIT (permissive). CI guard blocks v4+. **[resolved]**
- **Llama 3** — CI guard `Llama 3 references removed` enforces purge. **[resolved]**
- **`kiaan_sovereign_mind.py:558-679`** — `ModelFineTuner` class scaffolded with LoRA/PEFT/OpenAI fine-tuning. Could violate "no training on customer data" clauses with OpenAI / Anthropic if activated. **[unknown — needs counsel]**
- **`gpu_layer.py:159`** — `SACRED_VOICE = "kiaan-sacred-voice" # Custom fine-tuned for KIAAN`. Origin of base model unclear. **[unknown — needs counsel]**
- **Embedding model** — Not explicitly named in PROVENANCE.md §5. **[open]**

## Category 3 — Bhagavad Gita corpus

11 findings, 5 open, 4 mitigated, 2 resolved. **Two are public-release blockers.**

- **English translation source** (`data/gita/en.json`) — `OPEN_SOURCE_LICENSES.md:22-31` claims Annie Besant 1905 + Telang 1882 (both PD globally). `PROVENANCE.md:48-54` marks as **TBD pending counsel confirmation**. **[open, blocks public release]**
- **Hindi translation source** (`data/gita/hi.json`) — Entirely TBD in PROVENANCE.md:56-60. No translator, no edition, no license identified. **[open, blocks public release]**
- **CI guard — forbidden URLs** (`.github/workflows/ip-hygiene.yml:24-70`) — Blocks `vedabase.io`, `asitis.com`, `holy-bhagavad-gita.org`, `iskcondesiretree.com`, `iskcon.org`, `sivanandaonline.org`, `gitapress.org`. **[resolved]**
- **CI guard — signature phrases** (`ip-hygiene.yml:72-116`) — Blocks Prabhupada / ISKCON-derived phrases ("Supreme Personality of Godhead", "scion of Bharata", "abandon all varieties of dharma", etc.). **[resolved]**
- **CI guard — embedded translation strings** (`ip-hygiene.yml:118-155`) — Blocks long Latin-script strings on `translation:` / `english:` fields. **[resolved]**
- **External ingestion gates** (`ip-hygiene.yml:157-188`) — 6 services gated by `MINDVIBE_EXTERNAL_INGESTION_ENABLED`. **[resolved]**
- **Gita seed-script gates** (`ip-hygiene.yml:190-223`) — 10 seed scripts gated by `MINDVIBE_GITA_SEED_ENABLED`. **[resolved]**
- **Provisional patent claims OVER the Gita corpus** — see Category 4.
- **Gita language support mismatch** (`lib/kiaan-vibe/gita.ts:40-118`) — 11 languages declared, only 3 data files exist. Silent failures for Tamil/Bengali/Telugu etc. **[open]**

## Category 4 — Patent

3 findings, all open. **#1 is the most time-critical item in the entire inventory.**

- **`legal/US_PROVISIONAL_PATENT_DISCLOSURE_DRAFT.md`** — Draft for review. **Not yet filed.** Target window: 30–45 days from first public commit (2026-04-19), giving **~11 days remaining (deadline 2026-06-03)**.
  - Claim 1 (system) + Claim 2 (method) + Claim 3 (medium) over: dharmic-tag semantic retrieval + mood-to-tag mapping + per-verse effectiveness learning + multi-provider AI orchestration.
  - Inventor name TBD. Micro-entity status TBD. FTO search **not done** ($2–4k counsel cost).
  - Cost: $120 USPTO filing fee + $1.5–3k attorney drafting.
  - **[open — URGENT]**
- **Prior-art landscape unverified** — RAG patterns, mood→content mapping, multi-provider fallback are all known techniques. Novelty depends on the specific dharmic-tag schema. Counsel must validate. **[unknown — needs counsel]**
- **Third-party patent grants** — Apache-2.0 deps grant patent license; MIT does not. No GPL/AGPL in production. SBOM still TODO per PROVENANCE.md §8. **[open]**

## Category 5 — Code / vendor copyright

6 findings, 5 resolved, 1 open.

- **`LICENSE`** — MIT, copyright © 2025 hisr2024. **[resolved]**
- **`OPEN_SOURCE_LICENSES.md`** — Comprehensive (151 lines). All deps MIT / Apache-2.0 / ISC / OFL-1.1 / BSD. libvips LGPL-3.0 dynamically loaded (compliant). **[resolved, with note: SBOM-in-CI still TODO]**
- **`FONT_LICENSES.md`** — All 4 fonts OFL-1.1 (Outfit, Crimson Text, Cormorant Garamond, Noto Sans Devanagari). **[resolved]**
- **`vendor/bcryptjs/`** — MIT, not version-tracked per AUDIT_REPORT.md. Consider replacing with npm package. **[resolved with audit note]**
- **`brand/` assets** — Logos proprietary; Shankha Mandala proprietary; Pixabay audio CC0 (Sounova Gayatri #493174, Kals Om Hanumate #447279). **[mitigated]**
- **`brand/ai-prompts/`** — DALL-E + Midjourney prompts exist as planning docs; no AI-generated images currently deployed in `public/`. **[open]**

## Category 6 — Privacy / GDPR / CCPA / HIPAA

8 findings, 5 open, 3 mitigated.

- **`PRIVACY.md`** (376+ lines) — Comprehensive. Kiaanverse data controller in Germany. DPO mailbox `hisr2024@gmail.com` (no external DPO appointed). GDPR Art. 6/9 lawful bases enumerated. 30-day SLA. **[mitigated, owner-action-needed]**
- **`backend/services/chat_data_encryption.py`** — Fernet (AES-128-CBC + HMAC-SHA256). Lazy-init from `MINDVIBE_REFLECTION_KEY`. **AUDIT_REPORT.md S-13: key NOT mandatory in production — silently stores plaintext if unset.** **[open, P0]**
- **Data export / deletion** (`backend/services/privacy_service.py:260-360`) — `generate_gdpr_export()` produces JSON with encrypted journal entries. Hard-delete worker scheduled (`backend/main.py:863`) but status untested. **[mitigated]**
- **Analytics** — Only Sentry. No PostHog/Mixpanel/Amplitude/Datadog/Segment. PII filtering claimed but not test-verified. **[mitigated]**
- **Sub-processor list** (`PRIVACY.md:188-220`) — Anthropic, OpenAI, Sarvam, ElevenLabs, Microsoft, Stripe, Expo, Sentry, Firebase. **PRIVACY.md §4 claim "we do not share KIAAN conversations with any party other than Anthropic" CONTRADICTS reality** (OpenAI is primary provider). **[open — copy correction needed]**
- **COPPA / GDPR-K** — 13+ minimum age documented, no code-level enforcement, no parental-consent flow. **[mitigated]**
- **Medical disclaimer** (`TERMS.md:9-29`) — Explicit non-medical framing. HIPAA does not apply. **[resolved]**
- **HIPAA-grade encryption claim in CLAUDE.md** — Aspirational, not current state. Encryption gap (S-13) contradicts the claim. **[open]**

## Category 7 — Trademark

3 findings, 2 open, 1 partially executed.

- **PR #1739 (Phase-1P-Brand)** — Executed renames: Mood Ring → Bhava Mirror (Mood Ring); Relationship Compass → Sambandh Dharma (Relationship Compass); Journey Engine → Karma Marg (Karma Journey). **[executed]**
- **TM filings for the 3 Sanskrit marks** — NICE 9 + 41 + 42, ~$2.5k total. **Not filed.** **[open]**
- **Brand-rename Item #4** — MindVibe vs Kiaanverse parent/product split. Deferred. App Store + TM-counsel decision needed. **[open]**
- **Other distinctive marks** (Kiaan, Sakha, Sadhana, Karmalytix, Ardha, Viyoga) — `OPEN_SOURCE_LICENSES.md:141-142` claims them as "distinctive Sanskrit-derived neologisms" but no TM applications filed. **[open]**

## Category 8 — Music / audio / voice

3 findings, 2 resolved, 1 open.

- **Bundled audio** — Pixabay licenses on Gayatri + Om Hanumate, CC0-equivalent commercial use. **[resolved]**
- **Voice cloning** — None. All ElevenLabs voices are stock; all Sarvam speakers are vendor-provided. No real-person voice impersonation. **[resolved]**
- **Pixabay license currency** — Was active 2025-Q4; need to verify still active. **[open]**

## Category 9 — Images / icons

4 findings, 1 resolved, 1 mitigated, 2 open.

- **Logos + SVGs** (`public/`, `brand/logos/`) — Original design, proprietary. **[open: verify against stock-photo derivatives]**
- **AI-generated imagery** — Prompts exist; no actual generated images deployed. **[open: if deployed, document model + license]**
- **Hindu deity imagery** — No deity images detected (abstract mandala / Shankha branding only). **[mitigated]**
- **Stock imagery** — None bundled per PROVENANCE.md §7. **[resolved]**

## Category 10 — Compliance / standards

7 findings, 4 open, 2 mitigated, 1 resolved.

- **WCAG accessibility** — Mentioned as "Fix color contrast" in WEBSITE_CRITIQUE_REVIEW.md; AUDIT_REPORT.md F-10 flags missing ARIA. **[open]**
- **COPPA** — 13+ documented, no enforcement code. **[mitigated]**
- **GDPR** — DPO not formally appointed. Hard-delete job status untested. **[mitigated]**
- **CCPA** — Documented; opt-out mechanism not implemented separately. **[mitigated]**
- **India DPDP Act (2023) + IT Rules 2021** — **No documentation found.** If founder/company is India-based, this applies and is non-optional. **[unknown — needs counsel]**
- **Apple Data & Privacy + Google Play Data Safety forms** — `components/legal/PrivacySectionBadge.tsx` shows compliance badges but actual form submission status unverified. **[open]**
- **HIPAA** — Explicitly non-applicable (TERMS.md medical disclaimer). **[resolved]**

## Category 11 — Audit / TODO trail

2 findings, both open.

- **`PROVENANCE.md` §10 TBDs (lines 202-217)** — 12 items, 6 marked "block public release": English translation, Hindi translation, other-language renderings, vendor no-training confirmations, translator work-for-hire signatures, SBOM-in-CI. **[open]**
- **`AUDIT_REPORT.md`** — 142 issues total: 19 CRITICAL, 44 HIGH, 47 MEDIUM, 32 LOW. Production readiness 5.5/10. Remediation in progress across Phases 1A–1Q. **[open, in remediation]**

## Category 12 — Recent IP / legal commits

Pattern shows deliberate compliance track:
- Phase 0 (66a8358): baseline IP hygiene
- Phase 1C (23a3fde): strip embedded derivative translations
- Phase 1D (506652a): gate 10 Gita seed scripts
- Phase 1E (57d4aa6): revise store listings
- Phase 1F+ (b0ab024): remove Llama 3 references
- Phase 1G+1H+1I+1J (e1190ca): permanent CI guards
- Phase 1K (eb3c566): replace Mukundananda-derived BG 2.47/18.66 quotes
- Phase 1N (2e28dd8): deep IP audit remediation across AI ToS, persona prompts, attribution
- Phase 1O (05f45a1): Anthropic-resale mitigation, US provisional patent draft, brand-rename brief
- Phase 1P-Brand (8c6c1b3, merged PR #1739): execute the 3 brand renames
- Phase 1P-Security (980727f): dependency CVE remediation
- Phase 1Q (736bf6c): N+1 query patterns + composite-index gap

## Category 13 — Other

5 findings, 3 open, 1 resolved, 1 mitigated.

- **DMCA agent registration** — Not registered with US Copyright Office. TERMS.md has no DMCA section. **[open]**
- **Acceptable-use language** — In `feature_config.py:11-34`, defensible. **[mitigated]**
- **Rate-limit T&C** — No public docs. Backend has limits but no user-facing description. **[open]**
- **Affiliate / monetization disclosures** — Subscription-only, no affiliates. **[resolved]**
- **Voice consent flow** — User must consent to voice transmission to ElevenLabs/Sarvam/etc. No explicit consent checkbox in code. **[open]**

---

## Top 20 ranked priority items

| Rank | Item | Severity | Counsel action |
|---|---|---|---|
| 1 | US provisional patent — 2026-06-03 deadline | **P0 / 11 days** | Engage patent attorney inside 48h. FTO + draft + file. |
| 2 | Private key committed to git (AUDIT S-01) | **P0 CRITICAL** | Rotate key, `git filter-branch` history, invalidate all JWTs. |
| 3 | Anthropic DPA + signed no-training clause | **P0** | Sign DPA. Record date in PROVENANCE.md §5. |
| 4 | OpenAI DPA + signed no-training clause | **P0** | Same. Also confirm enterprise tier covers fine-tuning prohibition. |
| 5 | Gita English translation PD confirmation | **P0** | Verify Besant 1905 PD chain. Update PROVENANCE.md. |
| 6 | Gita Hindi translation source identification | **P0** | Identify translator + license. PROVENANCE.md update. |
| 7 | `MINDVIBE_REFLECTION_KEY` fail-hard in prod (AUDIT S-13) | **P0** | Make mandatory. Document key rotation. |
| 8 | CSP `unsafe-inline` removal (AUDIT S-02) | **P0** | Nonce-based CSP. |
| 9 | Sub-processor DPAs (Sarvam / ElevenLabs / Edge / Sentry / Firebase / Stripe / Expo) | **P1** | Sign all. Record dates. |
| 10 | Translator work-for-hire (17 languages) | **P1** | Get signed assignments. |
| 11 | TM filings — Bhava Mirror / Sambandh Dharma / Karma Marg | **P1** | NICE 9+41+42. ~$2.5k. |
| 12 | India DPDP Act (2023) compliance | **P1** | If India-based — engage India counsel. |
| 13 | GDPR DPO appointment | **P1** | External or formal internal. |
| 14 | App Store + Google Play Data Safety forms | **P1** | Submit and verify before showing compliance badges. |
| 15 | SBOM + license scan in CI | **P1** | CycloneDX, block AGPL. |
| 16 | ElevenLabs voice-cloning verification | **P1** | Confirm all voices are stock. |
| 17 | `kiaan-sacred-voice` model origin | **P1** | Document base model + training consent. |
| 18 | Whisper STT — on-device vs API | **P1** | Confirm deployment mode. |
| 19 | DMCA agent registration | **P1** | $6 USPTO form. |
| 20 | PRIVACY.md §4 contradiction (claims only Anthropic sees conversations) | **P1** | Fix copy to include OpenAI + others. |

---

## What this inventory is NOT

- **Not legal advice.** Hand it to qualified US patent + SaaS counsel.
- **Not a verification of facts.** Findings are static-analysis observations; counsel must validate each.
- **Not exhaustive.** Possible blind spots: jurisdictional issues in non-US/EU/India markets, financial-services regulation if subscriptions touch certain jurisdictions, export-control if AI tech reaches sanctioned countries, accessibility-discrimination claims under ADA Title III.
