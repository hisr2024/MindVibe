# MindVibe — Visual Framework & IP Filing Map

**Everything as flowcharts: architecture, engines, request lifecycle, and the exact offices where each MindVibe IP asset can be filed.**

> Renders best on GitHub (Mermaid native). All diagrams have ASCII fallbacks where useful.

## Contents

1. [System Architecture (End-to-End)](#1-system-architecture-end-to-end)
2. [Request Lifecycle](#2-request-lifecycle)
3. [Per-Engine Flowcharts](#3-per-engine-flowcharts)
4. [IP Type Decision Tree](#4-ip-type-decision-tree--what-protection-fits-which-asset)
5. [Where to Apply for IP Rights (Offices & Routes)](#5-where-to-apply-for-ip-rights)
6. [Patent Filing Flowchart](#6-patent-filing-flowchart)
7. [Trademark Filing Flowchart](#7-trademark-filing-flowchart)
8. [Copyright Registration Flowchart](#8-copyright-registration-flowchart)
9. [Trade Secret Protection Flowchart](#9-trade-secret-protection-flowchart)
10. [Database Right Flowchart](#10-database-right-flowchart)
11. [Defensive Publication Flowchart](#11-defensive-publication-flowchart)
12. [Pre-Merge IP Gating](#12-pre-merge-ip-gating)
13. [Master IP Map: Asset → Office Quick Reference](#13-master-ip-map-asset--office-quick-reference)

---

## 1. System Architecture (End-to-End)

```mermaid
flowchart TB
  subgraph Clients["CLIENTS"]
    Web["Next.js 14 Web<br/>App Router"]
    iOS["iOS<br/>Swift / SwiftUI"]
    Android["Android<br/>Kotlin / Compose"]
    SW["Service Worker<br/>+ IndexedDB<br/>(offline)"]
  end

  subgraph Edge["EDGE / API GATEWAY"]
    Proxy["Next.js API routes<br/>proxy.ts"]
    Auth["Auth: JWT EdDSA<br/>+ HS256 + WebAuthn"]
    Sec["CSP · CORS · Rate-limit<br/>Prompt-Injection Detector<br/>PII Redactor"]
  end

  subgraph App["APPLICATION (FastAPI)"]
    Routes["60+ Routes<br/>backend/routes/"]
    Mid["Middleware<br/>backend/middleware/"]
  end

  subgraph Engines["ENGINES (services/)"]
    KIAAN["KIAAN Orchestrator"]
    Wisdom["Wisdom Engine"]
    Karma["Karmalytix +<br/>Karma Footprint +<br/>Karma Reset"]
    Journey["Journey Engine"]
    Ardha["Ardha Reframe"]
    Compass["Relationship<br/>Compass"]
    Voice["Voice Stack"]
  end

  subgraph AI["AI / VOICE PROVIDERS"]
    LLM["LLM chain:<br/>OpenAI → Anthropic<br/>→ on-device → degraded"]
    TTS["TTS chain:<br/>Sarvam → Bhashini<br/>→ ElevenLabs → Edge"]
    STT["STT:<br/>Whisper / Sarvam / Bhashini"]
  end

  subgraph Data["DATA"]
    PG[("PostgreSQL<br/>SQLAlchemy")]
    Redis[("Redis<br/>cache + queue")]
    Vec[("Vector store<br/>Gita corpus")]
    Blob[("Encrypted blobs<br/>Fernet / AES-256-GCM")]
    Obj[("Object storage<br/>audio")]
  end

  Web & iOS & Android --> SW
  SW --> Proxy
  Proxy --> Auth --> Sec --> Routes
  Routes --> Mid --> Engines
  KIAAN --> Wisdom
  KIAAN --> Voice
  Wisdom --> Vec
  Engines --> LLM
  Voice --> TTS
  Voice --> STT
  Engines --> PG
  Engines --> Redis
  Engines --> Blob
  Voice --> Obj
```

---

## 2. Request Lifecycle

A user message → the response. Every box is a real file or directory.

```mermaid
flowchart TD
  U["User<br/>(text or voice)"] --> SWQ{"Online?"}
  SWQ -- "no" --> IDB["IndexedDB queue"] --> SWQ
  SWQ -- "yes" --> Proxy["Next.js proxy.ts<br/>auth + CSP + rate-limit"]
  Proxy --> FastAPI["FastAPI router<br/>backend/routes/kiaan.py"]
  FastAPI --> PI["prompt_injection_detector.py"]
  PI -- "malicious" --> Reject["Reject + log"]
  PI -- "ok" --> PII["pii_redactor.py<br/>(reversible map)"]
  PII --> Mem["kiaan_deep_memory.py<br/>load context"]
  Mem --> Router["kiaan_engine_router.py<br/>pick mode"]
  Router --> RAG["WisdomKB<br/>gita_wisdom_retrieval.py"]
  RAG --> Rank["gita_validator.py<br/>+ wisdom_filter.py"]
  Rank --> Comp["kiaan_response_composer.py"]
  Comp --> Prov["kiaan_model_provider.py<br/>LLM chain"]
  Prov -- "primary fail" --> Fall["Fallback LLM"]
  Fall -- "all fail" --> Sov["kiaan_self_sufficiency.py<br/>degraded template"]
  Prov --> Safe["safety_validator.py<br/>+ crisis_partial_scanner.py"]
  Safe -- "crisis" --> Crisis["Crisis branch<br/>helpline routing"]
  Safe -- "ok" --> VoiceQ{"voice?"}
  VoiceQ -- "yes" --> TTSPolicy["voice_compute_policy.py<br/>provider routing"]
  TTSPolicy --> TTS["Sarvam → Bhashini<br/>→ ElevenLabs → Edge"]
  VoiceQ -- "no" --> Audit
  TTS --> Audit["kiaan_audit.py<br/>(no PII)"]
  Audit --> Resp["JSON / SSE / WSS<br/>+ citations + latency_ms"]
  Resp --> U
```

---

## 3. Per-Engine Flowcharts

### 3.1 KIAAN — Conversational Wisdom Companion

```mermaid
flowchart LR
  In["utterance"] --> Mode{"mode?"}
  Mode -- friend --> Friend["companion_friend_engine.py"]
  Mode -- divine --> Divine["kiaan_divine_intelligence.py"]
  Mode -- learning --> Learn["kiaan_learning_engine.py"]
  Mode -- sovereign --> Sov["kiaan_sovereign_mind.py"]
  Friend & Divine & Learn & Sov --> RAG["WisdomKB"]
  RAG --> Comp["response composer"]
  Comp --> Out["reply + citations"]
```

### 3.2 Wisdom Engine

```mermaid
flowchart LR
  Q["query<br/>(emotion + intent)"] --> Vec["vector search<br/>top-k=20"]
  Vec --> Val["gita_validator.py<br/>confidence filter"]
  Val --> Filt["gita_wisdom_filter.py<br/>domain + age"]
  Filt --> San["sanitizer<br/>religious → universal"]
  San --> RC["gita_response_composer.py<br/>1-3 verses + cite"]
  RC --> Out["payload"]
```

### 3.3 Karmalytix

```mermaid
flowchart LR
  R["reflection +<br/>mood + tags"] --> Themes["theme extractor"]
  Themes --> Affect["affect vector"]
  Affect --> Drift["drift_score<br/>wellness_score_service.py"]
  Drift --> Insight["insight_generator_service.py<br/>+ karmalytix_prompts.py"]
  Insight --> Action["recommended_action"]
```

### 3.4 Karma Footprint Engine (isolated from KIAAN)

```mermaid
flowchart LR
  D["day's logged actions"] --> Cls["intention classifier"]
  Cls --> Score["per-action intention_score"]
  Score --> Delta["plant_growth_delta /<br/>shadow_delta"]
  Delta --> JSON["JSON contract<br/>(plant vs shadow viz)"]
  Iso["⚠ never intercepts KIAAN"] -.-> Cls
```

### 3.5 Karma Reset / Emotional Reset

```mermaid
stateDiagram-v2
  [*] --> Breath
  Breath --> Witness: pre-affect captured
  Witness --> Release
  Release --> Reframe: verse anchor
  Reframe --> Commit
  Commit --> [*]: post-affect → delta
```

### 3.6 Journey Engine

```mermaid
flowchart TD
  Start["start journey"] --> Steps["N daily steps"]
  Steps --> Comp{"complete day i?"}
  Comp --> Lock["row-level lock<br/>(idempotent)"]
  Lock --> Already{"already done?"}
  Already -- yes --> Same["return same result"]
  Already -- no --> Mark["mark complete_at = now"]
  Mark --> Prog["progress = COUNT(completed) / total"]
  Prog --> Status{"all done?"}
  Status -- yes --> Done["status = completed"]
  Status -- no --> Active["status = active"]
  Done --> Rec["next-journey recommendation"]
```

> **Critical invariant (ADR-001):** progress derives from *completed-step count*, never from `current_day_index`. Preserve under all changes.

### 3.7 Ardha Reframing

```mermaid
flowchart LR
  T["thought / utterance"] --> Det["distortion detector"]
  Det --> Map["distortion → verse map"]
  Map --> Re["reframe template"]
  Re --> Out["compassionate reframe"]
```

### 3.8 Relationship Compass

```mermaid
flowchart LR
  Dyad["dyadic prompt<br/>(parent/partner/colleague)"] --> RAG["private RAG<br/>relationship shards"]
  RAG --> Synth["4-axis synthesizer"]
  Synth --> Vec4["compass vector<br/>(Tamas, Rajas, Sattva,<br/>+ relational axis)"]
  Vec4 --> Narr["narrative + verse"]
```

### 3.9 Voice Stack

```mermaid
flowchart TD
  Mic["mic"] --> VAD["VAD<br/>@ricky0123/vad-web"]
  VAD --> STT{"language?"}
  STT -- Indic --> Sarvam["Sarvam STT"]
  STT -- Indic-fallback --> Bhash["Bhashini STT"]
  STT -- other --> Whisper["Whisper"]
  Sarvam & Bhash & Whisper --> KIAAN["KIAAN reasoning"]
  KIAAN --> Policy["voice_compute_policy.py"]
  Policy --> TTS{"tier × language × cost"}
  TTS --> Sar2["Sarvam TTS"]
  TTS --> Bha2["Bhashini TTS"]
  TTS --> El["ElevenLabs"]
  TTS --> Edge["Edge TTS"]
  TTS --> Local["on-device fallback"]
  Sar2 & Bha2 & El & Edge & Local --> WS["WSS audio frame"]
```

---

## 4. IP Type Decision Tree — what protection fits which asset

For every invention, idea, mark, or asset, run this tree.

```mermaid
flowchart TD
  Asset["new asset / idea<br/>created"] --> Q1{"Is it a<br/>technical method<br/>or system?"}
  Q1 -- yes --> Q2{"Novel +<br/>non-obvious +<br/>useful?"}
  Q2 -- yes --> Q3{"Can we live<br/>with public<br/>disclosure?"}
  Q3 -- yes --> PAT["📜 PATENT<br/>(file before public use)"]
  Q3 -- no --> TS["🔒 TRADE SECRET<br/>(keep confidential)"]
  Q2 -- no --> Q4{"Worth blocking<br/>others from<br/>patenting?"}
  Q4 -- yes --> DEF["📰 DEFENSIVE<br/>PUBLICATION"]
  Q4 -- no --> NONE1["no action"]
  Q1 -- no --> Q5{"Source code,<br/>UI, copy,<br/>music, art?"}
  Q5 -- yes --> COPY["©️ COPYRIGHT<br/>(auto + register)"]
  Q5 -- no --> Q6{"Brand name,<br/>logo, slogan,<br/>persona voice?"}
  Q6 -- yes --> TM["™️ TRADEMARK<br/>(file ITU)"]
  Q6 -- no --> Q7{"Curated dataset<br/>with substantial<br/>investment?"}
  Q7 -- yes --> DB["🗄 DATABASE RIGHT<br/>(EU sui generis)<br/>+ contract terms"]
  Q7 -- no --> Q8{"Industrial<br/>design /<br/>UI shape?"}
  Q8 -- yes --> DES["🎨 DESIGN<br/>REGISTRATION"]
  Q8 -- no --> NONE2["no IP action"]
```

**Rule of thumb for MindVibe:**

| Asset class | Default protection |
|---|---|
| Engine algorithms (P-1…P-12) | Patent **or** trade secret (decide per-invention via tree above) |
| System prompts, ranker weights | Trade secret |
| Source code, docs, designs | Copyright (auto) + register |
| Brand names, logos, persona voice | Trademark + voice/sound mark |
| Curated Gita corpus + tag layer | Database right (EU) + contract + copyright on editorial layer |
| UI/UX visual + motion design | Copyright + design registration in key markets |

---

## 5. Where to Apply for IP Rights

> **You do NOT need to file in every country.** File in (a) your home market, (b) where your customers are, (c) where competitors operate, (d) where infringement is likely. For most software companies that's: **US, EU, UK, India, Japan, China, plus PCT/Madrid for "everywhere else."**

### 5.1 Major IP offices (one-stop reference)

| Office | Country / Region | What you file there |
|---|---|---|
| **USPTO** — uspto.gov | United States | Utility patents, design patents, trademarks |
| **U.S. Copyright Office** — copyright.gov | United States | Copyright registration (statutory damages) |
| **EPO** — epo.org | Europe (38 states) | European patent (validate per country after grant) |
| **EUIPO** — euipo.europa.eu | EU 27 | EU trademark (single filing covers all 27) + Registered Community Design |
| **UKIPO** — gov.uk/ipo | United Kingdom | UK patents, trademarks, designs (post-Brexit, separate from EU) |
| **IP India** — ipindia.gov.in | India | Patents, trademarks, designs, copyrights |
| **JPO** — jpo.go.jp | Japan | Patents, trademarks, designs |
| **CNIPA** — cnipa.gov.cn | China | Patents, trademarks, designs (first-to-file — file early) |
| **KIPO** — kipo.go.kr | South Korea | Patents, trademarks, designs |
| **CIPO** — cipo.ic.gc.ca | Canada | Patents, trademarks, designs, copyrights |
| **IP Australia** — ipaustralia.gov.au | Australia | Patents, trademarks, designs |
| **WIPO** — wipo.int | International | **PCT** (international patent), **Madrid** (international trademark), **Hague** (international design), DAS, ePCT |

### 5.2 IP type → office mapping (file order)

```mermaid
flowchart TD
  Choose["choose IP type"] --> P{"PATENT?"}
  P -- yes --> Pflow["1. US: USPTO (provisional)<br/>2. PCT via WIPO (within 12mo)<br/>3. National phase (within 30mo):<br/>   EPO, IP India, JPO, CNIPA,<br/>   KIPO, IP Australia, UKIPO"]
  Choose --> T{"TRADEMARK?"}
  T -- yes --> Tflow["1. Home: USPTO (TEAS) or<br/>   IP India (e-filing)<br/>2. EUIPO for EU 27<br/>3. UKIPO for UK<br/>4. Madrid via WIPO for<br/>   global (designate countries)"]
  Choose --> C{"COPYRIGHT?"}
  C -- yes --> Cflow["Auto-protected on creation.<br/>Register for statutory damages:<br/>1. US Copyright Office (eCO)<br/>2. IP India (copyright office)<br/>3. Berne Convention covers<br/>   most countries automatically"]
  Choose --> D{"DESIGN?"}
  D -- yes --> Dflow["1. Hague via WIPO for<br/>   multi-country in one filing<br/>2. Or per-office: USPTO,<br/>   EUIPO (Community Design),<br/>   UKIPO, IP India"]
  Choose --> S{"TRADE SECRET?"}
  S -- yes --> Sflow["No registration anywhere.<br/>Protected by: NDAs, CLAs,<br/>access control, marking,<br/>+ DTSA (US) /<br/>EU Trade Secrets Directive /<br/>India common law"]
  Choose --> DB2{"DATABASE?"}
  DB2 -- yes --> DBflow["No registration.<br/>EU sui generis right<br/>arises automatically if<br/>'substantial investment'<br/>shown. Document in<br/>docs/PROVENANCE.md"]
```

### 5.3 Jurisdiction × IP type — MindVibe priority matrix

| Jurisdiction | Patents | Trademarks | Copyright reg. | Designs | Why |
|---|---|---|---|---|---|
| **US** | ★★★ | ★★★ | ★★★ | ★★ | Largest market, statutory damages require US Copyright reg. |
| **India** | ★★★ | ★★★ | ★★ | ★★ | Home market, Sanskrit/Indic content, Bhashini partner ecosystem |
| **EU (EUIPO + EPO)** | ★★ | ★★★ | ★ (Berne) | ★★ | Single-filing efficiency; sui generis DB right is EU-only |
| **UK (UKIPO)** | ★★ | ★★★ | ★ (auto) | ★★ | Post-Brexit separate filings; English-language market |
| **Japan** | ★★ | ★★ | ★ (Berne) | ★ | Wellness/spirituality market, premium tier |
| **China (CNIPA)** | ★★ | ★★★ | — | ★ | **First-to-file** — file TM defensively before launch |
| **Canada / Australia** | ★ | ★★ | ★ | ★ | Madrid + PCT designations |
| **Rest of world** | via PCT | via Madrid | Berne auto | via Hague | Designate strategically |

★★★ = file day-one · ★★ = file at launch · ★ = file when revenue justifies

### 5.4 The "international" routes (one filing → many countries)

```mermaid
flowchart LR
  PCT["PCT via WIPO<br/>1 filing, 157 states"] --> Nat["national phase<br/>≤ 30 months"]
  Madrid["Madrid via WIPO<br/>1 filing, 130+ states"] --> Desig["designate target<br/>members"]
  Hague["Hague via WIPO<br/>1 filing for designs"] --> HDesig["designate members"]
```

PCT and Madrid are **the** filings to learn. They postpone the cost-explosion of multi-country filings while preserving priority dates.

---

## 6. Patent Filing Flowchart

```mermaid
flowchart TD
  Inv["invention disclosure form<br/>(named inventors,<br/>first-commit date,<br/>file references)"] --> Eval{"FTO + novelty<br/>search clean?"}
  Eval -- no --> Pivot["redesign or<br/>defensive publish"]
  Eval -- yes --> Decide{"trade secret<br/>or patent?"}
  Decide -- TS --> TSflow["lock down<br/>(see §9)"]
  Decide -- patent --> Prov["US provisional at USPTO<br/>(uspto.gov)<br/>locks priority date"]
  Prov --> NDA["any disclosure under NDA only<br/>until non-provisional filed"]
  NDA --> NP["within 12 months:<br/>file PCT at WIPO<br/>+ US non-provisional"]
  NP --> ISR["WIPO international<br/>search report"]
  ISR --> Pub["publication at 18 months"]
  Pub --> Nat["≤ 30 months:<br/>national phase entries"]
  Nat --> EPO["EPO<br/>(epo.org)"]
  Nat --> India["IP India<br/>(ipindia.gov.in)"]
  Nat --> JP["JPO<br/>(jpo.go.jp)"]
  Nat --> CN["CNIPA<br/>(cnipa.gov.cn)"]
  Nat --> KR["KIPO<br/>(kipo.go.kr)"]
  Nat --> AU["IP Australia<br/>(ipaustralia.gov.au)"]
  Nat --> UK["UKIPO<br/>(gov.uk/ipo)"]
  Nat --> CA["CIPO<br/>(cipo.ic.gc.ca)"]
  EPO & India & JP & CN & KR & AU & UK & CA --> Pros["prosecution +<br/>office actions"]
  Pros --> Grant["grants in each office"]
  Grant --> Maint["maintenance fees<br/>(annually)"]
```

**MindVibe candidate inventions to take through this flow** (from `docs/FRAMEWORK.md` §4.1): P-1 through P-12. Top priorities for the first US provisionals: **P-1** (sanitization pipeline), **P-2** (RAG ranker), **P-4** (voice routing policy), **P-5** (Karma Footprint classifier), **P-7** (idempotent journey progress), **P-12** (streaming crisis classifier).

---

## 7. Trademark Filing Flowchart

```mermaid
flowchart TD
  Mark["candidate mark<br/>(MindVibe, KIAAN,<br/>Karmalytix, Karma Footprint,<br/>Karmic Tree, Ardha, Sakha)"] --> Search{"clearance search<br/>USPTO TESS,<br/>EUIPO eSearch+,<br/>IP India, WIPO Global"}
  Search -- conflict --> Pivot["pick alternative<br/>or coexist agreement"]
  Search -- clear --> Class["Nice classes:<br/>9 (software),<br/>41 (education/wellness),<br/>42 (SaaS),<br/>44 (health/wellness)"]
  Class --> Home{"home filing"}
  Home --> US["USPTO TEAS<br/>uspto.gov<br/>(intent-to-use 1B basis)"]
  Home --> IN["IP India e-filing<br/>ipindia.gov.in"]
  US & IN --> Madrid["Madrid via WIPO<br/>wipo.int<br/>designate: EU, UK, JP, CN,<br/>KR, AU, CA, CH, others"]
  Madrid --> Examine["each designated office<br/>examines under local law"]
  Examine --> Reg["registration"]
  Reg --> Watch["TM watch service<br/>quarterly"]
  Watch --> Renew["renew every 10 years"]
```

**MindVibe TM priority list:**

1. **MindVibe** (word + logo) — classes 9, 41, 42, 44
2. **KIAAN** + **KIAANverse** (word + logo + sound mark for the persona voice) — classes 9, 41, 42
3. **Karmalytix** — classes 9, 42
4. **Karma Footprint** + **Karmic Tree** (figurative for plant/shadow viz) — classes 9, 42
5. **Karma Reset** + **Emotional Reset** — classes 9, 41, 44
6. **Ardha** (in product context) — classes 9, 42
7. **Sakha** — verify prior use first; classes 9, 41

Sound marks (KIAAN voice signature) are filed separately as **non-conventional trademarks** (USPTO accepts; EUIPO accepts; CNIPA limited).

---

## 8. Copyright Registration Flowchart

```mermaid
flowchart LR
  Create["work created<br/>(code, design, doc,<br/>copy, music)"] --> Auto["©️ automatic<br/>protection<br/>(Berne Convention)"]
  Auto --> Need{"need statutory<br/>damages or<br/>customs enforcement?"}
  Need -- no --> Done["done<br/>(Berne covers most<br/>countries automatically)"]
  Need -- yes --> Reg{"register where?"}
  Reg --> USCO["US Copyright Office<br/>copyright.gov<br/>eCO online filing<br/>(required for US lawsuits)"]
  Reg --> InC["Indian Copyright Office<br/>copyright.gov.in"]
  Reg --> Other["most countries: optional;<br/>Berne treats unregistered<br/>works as protected"]
  USCO & InC & Other --> Mark["mark works:<br/>© 2026 MindVibe<br/>+ source headers"]
```

**What MindVibe should register:**

| Work | Where | Why |
|---|---|---|
| Backend source code (snapshots) | USCO + IP India | Statutory damages for code theft |
| Frontend source code (snapshots) | USCO + IP India | Same |
| Brand assets (logos, motion spec, storyboards) | USCO + IP India | Visual infringement |
| Documentation (FRAMEWORK.md, marketing copy) | USCO | Editorial + selling-document infringement |
| Original translations (per language) | IP India | Translator-assignment chain proof |
| Sakha persona scripts | USCO | Voice/character protection (alongside TM) |

> Code is registered as a **snapshot** (deposit a redacted copy — trade-secret portions can be blocked out per USCO rules). Re-register on major versions.

---

## 9. Trade Secret Protection Flowchart

```mermaid
flowchart TD
  Item["asset designated<br/>trade secret<br/>(see §4.2 of FRAMEWORK.md)"] --> Mark["mark file<br/># CONFIDENTIAL — TRADE SECRET<br/>+ directory NOTICE"]
  Mark --> Acc["access control<br/>(repo permissions,<br/>need-to-know)"]
  Acc --> CLA["all contributors<br/>sign CLA + NDA"]
  CLA --> Vendor["vendor DPAs +<br/>no-training clauses"]
  Vendor --> Train["onboarding training<br/>(annual refresher)"]
  Train --> Audit["quarterly audit:<br/>where has it been logged,<br/>shipped, leaked?"]
  Audit -- leak found --> IR["incident response<br/>(SECURITY.md)"]
  Audit -- clean --> Continue["continue protection"]
  IR --> Legal["DTSA / EU TS Directive /<br/>India common law claim"]
```

**No filing office for trade secrets.** Protection is purely operational. Statutes that *enforce* trade-secret rights:

| Jurisdiction | Statute |
|---|---|
| United States | Defend Trade Secrets Act (DTSA, 18 USC §1836) + state UTSA |
| EU | Trade Secrets Directive 2016/943 + national implementations |
| United Kingdom | Common law breach of confidence + post-2018 Trade Secrets Regs |
| India | Common law (no codified statute as of 2026) — rely on contract |
| Japan | Unfair Competition Prevention Act |
| China | Anti-Unfair Competition Law (revised) |

The marking + NOTICE + access control work in this branch's commit `60d134b` is **the** prerequisite for any of these claims to succeed.

---

## 10. Database Right Flowchart

```mermaid
flowchart LR
  Corpus["curated corpus<br/>(Gita verses + tags +<br/>rel. shards + golden sets)"] --> Inv{"substantial<br/>investment in<br/>collection / verification /<br/>presentation?"}
  Inv -- yes --> Doc["document investment<br/>in docs/PROVENANCE.md"]
  Inv -- no --> NoDB["no DB right<br/>(rely on copyright<br/>of editorial layer)"]
  Doc --> Auto["EU sui generis right<br/>arises automatically<br/>(15 yr, renewable on<br/>substantial change)"]
  Auto --> UK["UK retained equivalent<br/>(post-Brexit)"]
  Auto --> Contract["reinforce with<br/>licensing terms +<br/>API rate limits"]
  Contract --> Watch["monitor scrapers /<br/>extractors"]
```

**No registration office.** EU sui generis is automatic. Outside EU/UK, rely on copyright of the editorial / tagging layer + licensing terms in `TERMS.md`.

---

## 11. Defensive Publication Flowchart

When you have an invention you've decided **not** to patent, but you want to block competitors from patenting it against you:

```mermaid
flowchart LR
  Inv["invention<br/>(not filing patent)"] --> Choice{"public OK?"}
  Choice -- no --> TS["trade secret<br/>(see §9)"]
  Choice -- yes --> Where{"publish where?"}
  Where --> IPcom["IP.com / Research Disclosure<br/>(timestamped, indexed)"]
  Where --> ArXiv["arXiv preprint"]
  Where --> Blog["MindVibe engineering blog<br/>(timestamped, archived)"]
  IPcom & ArXiv & Blog --> Prior["becomes prior art<br/>worldwide"]
  Prior --> Block["blocks others from<br/>patenting same invention"]
```

Defensive publication is **cheap insurance** for inventions you don't want to keep secret but don't want to patent. Especially good for narrow improvements around your core patents.

---

## 12. Pre-Merge IP Gating

Run this on every PR. Embed as CI check.

```mermaid
flowchart TD
  PR["PR opened"] --> Q1{"changes files in<br/>backend/services/CONFIDENTIAL.md<br/>list?"}
  Q1 -- yes --> CLA{"author signed CLA?"}
  CLA -- no --> Block1["block: require CLA"]
  CLA -- yes --> Q2
  Q1 -- no --> Q2{"adds new corpus,<br/>dataset, font, image,<br/>translation, vendor?"}
  Q2 -- yes --> Prov{"docs/PROVENANCE.md<br/>updated?"}
  Prov -- no --> Block2["block: add provenance row"]
  Prov -- yes --> Q3
  Q2 -- no --> Q3{"adds an algorithm<br/>resembling P-1…P-12?"}
  Q3 -- yes --> Disc["require invention<br/>disclosure form<br/>before merge"]
  Disc --> Q4
  Q3 -- no --> Q4{"adds a new<br/>brand mark or<br/>persona name?"}
  Q4 -- yes --> TM["TM clearance check<br/>before public use"]
  TM --> Q5
  Q4 -- no --> Q5{"removes a<br/>CONFIDENTIAL marker?"}
  Q5 -- yes --> Block3["block: requires<br/>IP-owner approval"]
  Q5 -- no --> Pass["✅ IP gate passed"]
```

---

## 13. Master IP Map: Asset → Office Quick Reference

This is the **one table** to print and pin.

| MindVibe asset | IP type | File at |
|---|---|---|
| **P-1** Religious-to-universal sanitization pipeline | Patent | USPTO → PCT → EPO, IP India, JPO, CNIPA |
| **P-2** Emotion+intent RAG ranker | Patent | Same as P-1 |
| **P-3** Mode-routing companion | Patent | Same |
| **P-4** Cost/privacy-aware voice routing | Patent | Same |
| **P-5** Karma Footprint dual-axis classifier | Patent | Same |
| **P-6** Emotional reset state machine | Patent | Same |
| **P-7** Idempotent journey progress | Patent | Same |
| **P-8** Drift score | Patent | Same |
| **P-9** 4-axis dyadic compass | Patent | Same |
| **P-10** Injection + reversible-PII co-pipeline | Patent | Same |
| **P-11** Sovereign degraded mode | Patent | Same |
| **P-12** Streaming crisis classifier | Patent | Same |
| System prompts (`prompts/`) | Trade secret | (no filing — operational protection) |
| Ranker weights, thresholds | Trade secret | (no filing) |
| Routing tables (cost × latency × language) | Trade secret | (no filing) |
| Source code (full repo snapshot) | Copyright | USCO (copyright.gov), IP India |
| Documentation, FRAMEWORK.md, marketing | Copyright | USCO |
| Sakha persona scripts | Copyright + TM (sound) | USCO + USPTO + EUIPO |
| Original translations (17 langs) | Copyright | IP India + USCO (work-for-hire chain) |
| **MindVibe** (word + logo) | Trademark | USPTO + IP India + EUIPO + UKIPO + Madrid (WIPO) |
| **KIAAN** / **KIAANverse** | Trademark + sound mark | Same |
| **Karmalytix** | Trademark | Same |
| **Karma Footprint** / **Karmic Tree** | Trademark + figurative | Same |
| **Karma Reset** / **Emotional Reset** | Trademark | Same |
| **Ardha** (product context) | Trademark | Same |
| Logo, icon set | Copyright + design | USCO + Hague (WIPO) |
| UI/UX screen designs | Design registration | EUIPO Community Design + USPTO design patent + Hague |
| Motion spec, storyboards | Copyright | USCO |
| Curated Gita corpus + tag layer | Database right (EU) + copyright (editorial) | EU automatic + USCO for editorial layer |
| Relationship-wisdom shards | Database right + copyright | Same |
| Golden eval datasets | Trade secret + copyright | (no filing for TS) + USCO |
| Brand fonts (if original) | Copyright | USCO |
| Background music / breath cues | Copyright | USCO |

---

## Action checklist for the next 90 days

- [ ] Run §4 decision tree on each of P-1…P-12; mark patent vs trade secret in the inventor register
- [ ] File US provisionals at **uspto.gov** for the top 3 patent picks (P-1, P-5, P-7 recommended) — locks priority for 12 months at low cost
- [ ] File trademarks (intent-to-use, 1B basis) at **uspto.gov** + **ipindia.gov.in** for MindVibe, KIAAN, Karmalytix, Karma Footprint
- [ ] Set up Madrid international application via **wipo.int** designating EU, UK, JP, CN, KR, AU, CA
- [ ] Register a code-snapshot at **copyright.gov** for the current `main` branch
- [ ] Confirm "no-training" addenda with OpenAI, Anthropic, ElevenLabs (close TBDs in `docs/PROVENANCE.md` §5)
- [ ] Add CI check implementing §12 pre-merge IP gate
- [ ] Defensive-publish two narrow improvements you decided not to patent, on IP.com or arXiv
- [ ] Schedule annual IP review (Q1 each year) with counsel

---

> **Disclaimer.** This document maps engineering reality to IP filing options. It is not legal advice. Every filing decision should be confirmed with a registered patent attorney / trademark agent in the relevant jurisdiction. URLs reference official IP offices as of writing — verify before filing.

🙏
