# MindVibe Multilingual Cross-Platform Roadmap

> Phased, actionable plan from MVP to production-ready multilingual spiritual wellness platform across web, mobile web, and native mobile.

---

## Table of Contents

1. [Role and Context](#1-role-and-context)
2. [Scope and Requirements](#2-scope-and-requirements)
3. [Architecture Overview](#3-architecture-overview)
4. [Implementation Plan](#4-implementation-plan)
5. [Localization Approach](#5-localization-approach)
6. [Deliverables](#6-deliverables)
7. [Assumptions and Constraints](#7-assumptions-and-constraints)
8. [Phase Roadmap](#8-phase-roadmap)

---

## 1. Role and Context

### Target Platforms and Runtime Environments

| Platform | Technology | Runtime | Status |
|----------|-----------|---------|--------|
| **Web (Desktop)** | Next.js 16 + React 18 | Node.js 20 LTS / Edge Runtime | Production |
| **Mobile Web (PWA)** | Next.js App Router + responsive | Browser + Service Worker | Production |
| **Android Native** | Kotlin + Jetpack Compose | Android 8+ (API 26+) | Scaffold |
| **iOS Native** | Swift + SwiftUI | iOS 16+ | Scaffold |
| **React Native** | React Native + Expo | iOS/Android | Scaffold |

### Tech Stack Choices

**Frontend (Web)**
- Framework: Next.js 16.1.1 (App Router, RSC, Streaming)
- Language: TypeScript 5.9 (strict mode)
- i18n: `next-intl` 4.5.8 with namespace-based JSON bundles
- Styling: Tailwind CSS 3.4 + Framer Motion
- State: Zustand 5.0 (global), React Context (local)
- Offline: IndexedDB via `idb` 8.0 + Service Worker

**Backend**
- Framework: FastAPI 0.100+ (async)
- Language: Python 3.11
- Database: PostgreSQL (SQLAlchemy 2.0 async + asyncpg)
- Cache: Redis 5.0+
- Auth: JWT + Session + WebAuthn + TOTP 2FA

**Native Mobile**
- Android: Kotlin, Jetpack Compose, Material 3, Hilt DI, Room DB
- iOS: Swift, SwiftUI, Combine, Core Data / SwiftData
- Shared: React Native bridge for rapid cross-platform features

### Language Translation Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Developers  │────▸│  Extract     │────▸│  Translators │────▸│  Review &    │
│  add keys    │     │  i18n keys   │     │  translate   │     │  QA in-app   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │                     │
       ▼                    ▼                     ▼                     ▼
  Source code         JSON bundles          Translated JSON       Merged to main
  uses t('key')       pushed to repo       via PR review         deployed
```

**Who translates:**
- Phase 1 (MVP): AI-assisted translation (OpenAI/DeepL) + developer review
- Phase 2: Professional translators for Indian languages (Hindi, Tamil, Telugu, Bengali, etc.)
- Phase 3: Community translators with moderation for remaining languages
- Sacred content (Gita verses, mantras): Verified Sanskrit scholars only

**How content is updated:**
1. Developer adds `t('namespace.key')` call in code
2. English JSON updated in `/locales/en/`
3. CI pipeline flags missing translations in other locales
4. Translation PR created (AI-draft or human)
5. Native speaker reviews in-context (screenshot preview in PR)
6. Merged and deployed automatically

---

## 2. Scope and Requirements

### MVP Features (Phase 1) — Priority-Ordered

| # | Feature | Priority | Platforms |
|---|---------|----------|-----------|
| 1 | **Language selector** (globe icon, search, region groups) | P0 | All |
| 2 | **UI string localization** (navigation, buttons, labels) | P0 | All |
| 3 | **Locale-aware formatting** (dates, numbers, currency) | P0 | All |
| 4 | **User language preference** (persisted locally + synced to backend) | P0 | All |
| 5 | **Gita verse translations** (700 verses × 17 languages) | P0 | All |
| 6 | **KIAAN companion** responds in user's language | P1 | Web, PWA |
| 7 | **Journey content** localized (titles, descriptions, steps) | P1 | Web, PWA |
| 8 | **Error messages** localized with compassionate tone | P1 | All |
| 9 | **RTL layout support** (Arabic, Urdu, Hebrew) | P2 | Web, PWA |
| 10 | **Offline translation cache** (Service Worker + IndexedDB) | P2 | PWA |

### Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **Performance** | Language switch < 200ms | Lighthouse CI |
| | Locale bundle size < 30KB per language | Webpack analyzer |
| | First paint < 1s (cached locale) | Web Vitals |
| **Accessibility** | WCAG 2.1 AA minimum | axe-core automated |
| | Screen reader announces language change | Manual testing |
| | All interactive elements keyboard-navigable | Playwright e2e |
| **Offline Support** | Cached locale works offline | Service Worker test |
| | Offline-first for journal, verse reading | IndexedDB sync |
| | Graceful fallback when translation missing | Unit test |
| **Reliability** | Missing key → English fallback (never blank) | Integration test |
| | 99.9% uptime for translation API | Monitoring |

### API Considerations

**Versioning:** `/api/v1/` prefix for all endpoints. Translation endpoints:
- `GET /api/v1/translations/{locale}/{namespace}` — Fetch translation bundle
- `POST /api/v1/translation/preferences` — Save user language preference
- `GET /api/v1/verses/{verse_id}/translations` — Verse translations
- `POST /api/v1/kiaan/chat` — Accepts `Accept-Language` header

**Rate Limits:**
- Translation bundles: 60 req/min (CDN-cached, rarely hit)
- Preference updates: 10 req/min
- KIAAN chat: 30 req/min

**Security:**
- Translation bundles are public (cacheable, no auth required)
- User preferences require authentication
- No PII in translation keys or values
- Content-Security-Policy allows only trusted CDN origins

**Caching:**
- Translation bundles: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
- Service Worker caches all locale bundles on first visit
- Redis backend cache for dynamic translations (TTL: 1 hour)
- ETag-based conditional requests for bundle updates

---

## 3. Architecture Overview

### Frontend vs Backend Responsibilities

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ next-intl    │  │ Locale       │  │ Language           │  │
│  │ Provider     │  │ JSON bundles │  │ Selector UI        │  │
│  │ (SSR + CSR)  │  │ (static)     │  │ (globe icon)       │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
│         │                 │                    │              │
│  ┌──────▼─────────────────▼────────────────────▼──────────┐  │
│  │           Zustand Language Store                        │  │
│  │   { locale, setLocale, formatDate, formatNumber }      │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼─────────────────────────────────┐  │
│  │         Service Worker (offline translation cache)      │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                        BACKEND                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ i18n         │  │ Translation  │  │ Content            │  │
│  │ Middleware   │  │ Service      │  │ Localization       │  │
│  │ (detect lang)│  │ (AI + cache) │  │ Service            │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
│         │                 │                    │              │
│  ┌──────▼─────────────────▼────────────────────▼──────────┐  │
│  │              PostgreSQL + Redis                         │  │
│  │   translations table, user_preferences, verse_i18n      │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Frontend owns:**
- Static UI string translation (compile-time JSON bundles)
- Language selector UI and state
- Locale-aware date/number formatting
- Offline translation cache
- RTL/LTR layout direction switching

**Backend owns:**
- Dynamic content translation (journey descriptions, KIAAN responses)
- User language preference persistence
- Translation API (for native mobile clients)
- Sacred content translation management (verse translations with scholar review)
- AI-powered translation fallback (when human translation unavailable)

### Data Model

```sql
-- User language preference (extends existing User model)
ALTER TABLE users ADD COLUMN preferred_locale VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN auto_translate BOOLEAN DEFAULT FALSE;

-- Translation content table (for dynamic/admin-managed content)
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL,        -- 'journey_title', 'journey_desc', 'step_content'
    content_id UUID NOT NULL,                 -- FK to the source content
    locale VARCHAR(10) NOT NULL,              -- 'en', 'hi', 'ta', etc.
    field_name VARCHAR(100) NOT NULL,         -- 'title', 'description', 'body'
    translated_text TEXT NOT NULL,
    translation_source VARCHAR(20) NOT NULL,  -- 'human', 'ai', 'community'
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,      -- soft delete
    UNIQUE(content_type, content_id, locale, field_name)
);

CREATE INDEX idx_translations_lookup
    ON translations(content_type, content_id, locale)
    WHERE deleted_at IS NULL;

-- Verse translations (extends existing GitaVerse model)
CREATE TABLE verse_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verse_id UUID NOT NULL REFERENCES gita_verses(id),
    locale VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    transliteration TEXT,                     -- romanized pronunciation
    word_meanings JSONB,                     -- word-by-word breakdown
    commentary TEXT,
    translator VARCHAR(200),                 -- attribution
    verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(200),                -- scholar name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(verse_id, locale)
);

-- User locale audit log
CREATE TABLE locale_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    old_locale VARCHAR(10),
    new_locale VARCHAR(10) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(20) NOT NULL              -- 'manual', 'auto_detect', 'settings'
);
```

### Authentication and Authorization Model

No changes to existing auth — language preference is an extension:
- Language preference stored on `User` model
- Unauthenticated users: locale from `Accept-Language` header or localStorage
- Authenticated users: locale from user profile (synced on login)
- Translation management: admin-only endpoints (existing admin role system)
- Community translations: require `translator` role (new role)

### Error Handling and Retries

```
Translation Load Flow:
  1. Try: Load locale JSON from static bundle (SSR/build-time)
  2. Fallback: Load from CDN cache (stale-while-revalidate)
  3. Fallback: Load from Service Worker cache (offline)
  4. Fallback: Use English strings (never show raw keys)
  5. Log: Report missing translation to monitoring

Dynamic Translation Flow:
  1. Try: Check Redis cache for translated content
  2. Try: Query PostgreSQL translations table
  3. Fallback: Request AI translation (OpenAI/DeepL) with retry (3x, exponential backoff)
  4. Fallback: Return content in English with "translation unavailable" note
  5. Cache: Store successful translation in Redis (TTL: 1h) + PostgreSQL
```

### Deployment Strategy

```
┌─────────────────────────────────────────────┐
│  GitHub Actions CI/CD                        │
│                                              │
│  Push → Lint → Test → Build → Deploy         │
│                                              │
│  Translation checks:                         │
│  - Missing key detection (fail CI if P0 key) │
│  - Bundle size check (warn if > 30KB/locale) │
│  - Pluralization rule validation             │
└─────────────┬───────────────────────────────┘
              │
    ┌─────────▼──────────┐     ┌──────────────┐
    │  Vercel (Frontend)  │     │ Render (API)  │
    │  - Edge SSR         │     │ - Oregon      │
    │  - CDN for bundles  │     │ - Auto-scale  │
    │  - Locale routing   │     │ - 1-3 inst.   │
    └─────────────────────┘     └──────────────┘
```

---

## 4. Implementation Plan

### Module Breakdown and Data Flows

```
modules/i18n/
├── LanguageProvider.tsx        — React context wrapping next-intl
├── LanguageSelector.tsx        — Globe icon dropdown/sheet (existing, enhanced)
├── LanguageSelectorIcon.tsx    — Sleek, adaptive icon component (NEW)
├── useLocaleFormat.ts          — Hook for date/number/currency formatting
├── useTranslation.ts           — Hook wrapping useTranslations with fallback
├── TranslationGuard.tsx        — Component that warns on missing translations
├── RTLProvider.tsx             — Handles dir="rtl" and CSS logical properties
└── offlineTranslations.ts     — Service Worker + IndexedDB translation cache

backend/services/
├── translation_service.py     — Core translation logic (cache, fallback, AI)
├── locale_detection.py        — Accept-Language parsing, geo-IP hint
└── content_localization.py    — Dynamic content translation pipeline

backend/routes/
├── translation.py             — Translation API endpoints (existing, extended)
└── locale.py                  — User locale preference endpoints (NEW)

backend/models/
├── translation.py             — Translation, VerseTranslation models (NEW)
└── (user.py extended)         — preferred_locale, auto_translate fields
```

### Integration Points

| Integration | Purpose | Protocol |
|-------------|---------|----------|
| **next-intl** | Static UI translations | Build-time JSON import |
| **OpenAI API** | AI-assisted translation for dynamic content | HTTPS, retry with backoff |
| **DeepL API** | Fallback translation provider | HTTPS, API key auth |
| **Redis** | Translation cache layer | TCP, connection pool |
| **Sentry** | Missing translation alerts | SDK integration |
| **Vercel Analytics** | Language usage metrics | Client-side beacon |
| **Service Worker** | Offline translation bundles | Cache API |

### Testing Strategy

**Unit Tests:**
- Translation key completeness (all keys in `en` exist in every locale)
- Pluralization rules per locale (ICU MessageFormat)
- Date/number formatting per locale
- Fallback chain (missing key → English → key name)
- RTL direction detection

**Integration Tests:**
- Language switch persists across page navigation
- Backend returns correct locale content based on `Accept-Language`
- User preference syncs between localStorage and backend
- KIAAN responds in user's selected language

**End-to-End Tests (Playwright):**
- Full language switch flow: open selector → search → select → verify UI updates
- Offline mode: switch language while offline, verify cached translations load
- Mobile: bottom sheet language selector opens, scrolls, selects correctly
- Accessibility: keyboard navigation through language selector, screen reader announcements

**Load Tests:**
- 1000 concurrent users switching languages simultaneously
- Translation API under load (verify Redis cache hit rate > 90%)

---

## 5. Localization Approach

### i18n Framework Selection

| Platform | Framework | Rationale |
|----------|-----------|-----------|
| **Web** | `next-intl` 4.5.8 | Already integrated; supports RSC, namespaces, ICU MessageFormat |
| **Android** | Android Resources (`strings.xml`) | Native platform standard, Jetpack Compose support |
| **iOS** | `String Catalogs` (.xcstrings) | Apple's modern localization, Xcode-native |
| **React Native** | `react-i18next` | Industry standard, shared JSON format with web |

### Pluralization Rules

MindVibe supports languages with varied pluralization:

| Language | Plural Forms | Example Rule |
|----------|-------------|--------------|
| English | 2 (one, other) | `{count, plural, one {# day} other {# days}}` |
| Hindi | 2 (one, other) | `{count, plural, one {# दिन} other {# दिन}}` |
| Arabic | 6 (zero, one, two, few, many, other) | Full CLDR rules |
| Japanese | 1 (other) | No plural distinction |
| Sanskrit | 3 (one, two, other) | Dual number support |

ICU MessageFormat handles all cases:
```json
{
  "journey.daysRemaining": "{count, plural, =0 {Journey complete} one {# day remaining} other {# days remaining}}"
}
```

### Date, Number, and Currency Formatting

```typescript
// All formatting uses Intl API (browser-native, zero-bundle-cost)
const formatter = {
  date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }),
  number: new Intl.NumberFormat(locale),
  currency: new Intl.NumberFormat(locale, { style: 'currency', currency }),
  relativeTime: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
};

// Examples:
// en: "Mar 8, 2026"    |  hi: "8 मार्च 2026"   |  ja: "2026年3月8日"
// en: "1,234.56"       |  hi: "1,234.56"        |  de: "1.234,56"
// en: "$9.99"          |  hi: "₹799"            |  ja: "¥1,200"
```

### Content Workflows

```
┌─────────────────────────────────────────────────────────────┐
│                  Translation Pipeline                        │
│                                                              │
│  1. EXTRACT                                                  │
│     Dev adds t('key') → CI extracts new keys                │
│     Output: list of untranslated keys per locale             │
│                                                              │
│  2. TRANSLATE                                                │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│     │ AI Draft    │  │ Professional│  │ Community        │  │
│     │ (OpenAI)    │  │ Translator  │  │ Contributor      │  │
│     │ Fast, cheap │  │ Accurate    │  │ Scale            │  │
│     └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│            │                │                   │            │
│            ▼                ▼                   ▼            │
│     ┌─────────────────────────────────────────────────────┐  │
│     │              Review Queue                           │  │
│     │  - In-context preview (screenshot)                  │  │
│     │  - Native speaker approval required                 │  │
│     │  - Sacred content: scholar verification             │  │
│     └──────────────────────┬──────────────────────────────┘  │
│                            │                                 │
│  3. APPROVE & DEPLOY                                         │
│     Approved → merge PR → auto-deploy                        │
│     Rejected → feedback to translator → re-translate         │
└─────────────────────────────────────────────────────────────┘
```

**Content Approval Tiers:**
- **Tier 1 (Auto-approve):** UI labels, button text, navigation (AI translation + CI check)
- **Tier 2 (Single review):** Journey descriptions, error messages (native speaker review)
- **Tier 3 (Scholar review):** Gita verses, mantras, sacred terminology (Sanskrit scholar + native speaker)

---

## 6. Deliverables

### Project Structure (i18n additions highlighted)

```
MindVibe/
├── locales/                          # Translation bundles (17 languages)
│   ├── en/
│   │   ├── common.json               # Shared UI strings
│   │   ├── home.json                  # Landing page
│   │   ├── kiaan.json                 # KIAAN companion
│   │   ├── dashboard.json             # User dashboard
│   │   ├── features.json              # Feature descriptions
│   │   ├── navigation.json            # Menu/nav
│   │   ├── errors.json                # Error messages (compassionate)
│   │   └── divine.json                # Spiritual content
│   ├── hi/                            # Hindi (same structure)
│   ├── ta/                            # Tamil
│   ├── te/                            # Telugu
│   ├── ... (14 more locales)
│   └── meta.json                      # ★ NEW: Locale metadata + completion %
│
├── components/
│   ├── i18n/                          # ★ NEW: i18n component module
│   │   ├── LanguageSelectorIcon.tsx    # ★ Sleek adaptive icon
│   │   ├── RTLProvider.tsx            # ★ RTL layout wrapper
│   │   └── TranslationStatus.tsx      # ★ Dev-mode missing key indicator
│   ├── navigation/
│   │   └── LanguageSelector.tsx       # Enhanced (existing)
│   └── LanguageSettings.tsx           # Enhanced (existing)
│
├── hooks/
│   ├── useLanguage.ts                 # Language context (existing)
│   └── useLocaleFormat.ts             # ★ NEW: Intl formatting hook
│
├── backend/
│   ├── models/
│   │   └── translation.py            # ★ NEW: Translation + VerseTranslation models
│   ├── routes/
│   │   ├── translation.py            # Extended with locale endpoints
│   │   └── locale.py                 # ★ NEW: User locale preferences
│   ├── services/
│   │   ├── translation_service.py    # Enhanced with AI fallback
│   │   ├── locale_detection.py       # ★ NEW: Accept-Language + geo detection
│   │   └── content_localization.py   # ★ NEW: Dynamic content pipeline
│   └── middleware/
│       └── i18n_middleware.py         # ★ NEW: Locale detection middleware
│
├── mobile/
│   ├── android/app/src/main/res/
│   │   ├── values/strings.xml         # English (default)
│   │   ├── values-hi/strings.xml      # Hindi
│   │   ├── values-ta/strings.xml      # Tamil
│   │   └── ...
│   ├── ios/MindVibe/
│   │   └── Localizable.xcstrings      # Apple String Catalog
│   └── react-native/
│       └── src/i18n/                  # react-i18next setup
│
├── scripts/
│   ├── i18n-check.ts                  # ★ CI: check translation completeness
│   ├── i18n-extract.ts                # ★ Extract untranslated keys
│   └── i18n-ai-translate.ts           # ★ AI draft translation generator
│
├── tests/
│   ├── i18n/
│   │   ├── translation_completeness.test.ts  # All keys present
│   │   ├── pluralization.test.ts              # ICU rules
│   │   └── locale_formatting.test.ts          # Date/number formatting
│   └── e2e/
│       └── language_switch.spec.ts            # Playwright e2e
│
└── docs/
    └── MULTILINGUAL_CROSS_PLATFORM_ROADMAP.md  # This document
```

### CI/CD Pipeline Additions

```yaml
# .github/workflows/i18n-check.yml
name: i18n Translation Check
on: [push, pull_request]

jobs:
  check-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Check translation completeness
        run: npx ts-node scripts/i18n-check.ts

      - name: Check locale bundle sizes
        run: |
          for dir in locales/*/; do
            locale=$(basename "$dir")
            size=$(du -sb "$dir" | cut -f1)
            size_kb=$((size / 1024))
            echo "$locale: ${size_kb}KB"
            if [ "$size_kb" -gt 30 ]; then
              echo "::warning::Locale $locale bundle exceeds 30KB ($size_kb KB)"
            fi
          done

      - name: Validate ICU MessageFormat
        run: npx ts-node scripts/i18n-check.ts --validate-icu
```

### Starter Code Snippets

See the following files committed alongside this roadmap:
- `components/i18n/LanguageSelectorIcon.tsx` — Sleek, adaptive language icon
- `backend/middleware/i18n_middleware.py` — Backend locale detection middleware
- `hooks/useLocaleFormat.ts` — Intl-based formatting hook
- `scripts/i18n-check.ts` — CI translation completeness checker

### Run/Build Instructions

```bash
# ── Web Development ──
npm install                     # Install dependencies
npm run dev                     # Start Next.js dev server (localhost:3000)

# ── Backend Development ──
cd backend
pip install -r requirements.txt
uvicorn main:app --reload       # Start FastAPI (localhost:8000)

# ── Translation Workflow ──
npx ts-node scripts/i18n-check.ts          # Check all locales for missing keys
npx ts-node scripts/i18n-extract.ts        # Extract new untranslated keys
npx ts-node scripts/i18n-ai-translate.ts   # Generate AI draft translations

# ── Testing ──
npm test                        # Run vitest (unit + integration)
npx playwright test             # Run e2e tests
cd backend && pytest            # Run backend tests

# ── Native Mobile ──
# Android
cd mobile/android && ./gradlew assembleDebug

# iOS
cd mobile/ios && xcodebuild -scheme MindVibe -sdk iphonesimulator

# React Native
cd mobile/react-native && npx expo start
```

---

## 7. Assumptions and Constraints

### Assumptions

1. **Primary audience is Indian users** — Hindi, Tamil, Telugu, Bengali are highest-priority languages after English
2. **Sacred content requires human verification** — AI translation is acceptable for UI but not for Gita verses
3. **Users have intermittent connectivity** — Offline-first approach critical for Indian mobile users
4. **Budget allows AI translation** — OpenAI/DeepL API costs acceptable for MVP (~$50/month)
5. **17 languages is the current ceiling** — expandable but not expected to grow rapidly
6. **Next.js SSR handles most web i18n** — No need for a separate translation management platform (TMS) in MVP

### Constraints

1. **Bundle size budget:** Max 30KB gzipped per locale (prevents bloating the 150KB total target)
2. **Translation latency:** AI translation adds 1-2s for dynamic content — acceptable with loading state
3. **Sanskrit/spiritual content:** Cannot be auto-translated — requires scholar pipeline
4. **RTL support:** Arabic listed in language config but complex to implement fully — Phase 2
5. **Native apps:** Currently scaffolds only — full i18n requires platform-specific investment

### Key Trade-offs

| Decision | Choice | Trade-off |
|----------|--------|-----------|
| **i18n framework** | `next-intl` (keep existing) | Tightly coupled to Next.js but excellent RSC support; native apps need separate framework |
| **Translation storage** | JSON files in repo + PostgreSQL for dynamic | Simpler than TMS; loses real-time collaboration features |
| **AI translation** | OpenAI GPT-4 as primary | High quality but higher cost than DeepL; spiritual context understanding better |
| **Mobile strategy** | Web-first + native later | Faster to market; native i18n comes later but shares JSON format |
| **Locale routing** | Query param / cookie (not URL path) | Simpler; loses SEO benefits of `/hi/page` URL structure (acceptable for app, not content site) |
| **Language icon** | Globe icon with native name | Universally recognized; flag-based selectors are politically controversial |

---

## 8. Phase Roadmap

### Phase 1: MVP — Core Multilingual Web (Weeks 1-4)

**Goal:** Users can switch language and see UI + static content in their preferred language.

**Deliverables:**
- [x] Language selector component (globe icon, search, region groups) — **exists**
- [x] 17 locale JSON bundles (common, home, navigation, errors) — **exists**
- [x] User language preference (localStorage + Zustand) — **exists**
- [ ] Enhanced `LanguageSelectorIcon` (sleek, adaptive across platforms)
- [ ] Backend i18n middleware (Accept-Language detection, user pref sync)
- [ ] `useLocaleFormat` hook (dates, numbers, currency per locale)
- [ ] CI translation completeness check
- [ ] Missing translation fallback chain (locale → English → key name)
- [ ] Sync language preference to backend user profile
- [ ] Gita verse translations for top 5 languages (en, hi, ta, te, bn)

**Exit Criteria:**
- User switches language → all UI updates within 200ms
- Missing translation → English fallback, never blank
- CI fails if P0 key missing in any enabled locale
- Language preference persists across sessions

---

### Phase 2: Dynamic Content + KIAAN i18n (Weeks 5-8)

**Goal:** KIAAN responds in user's language; journey content is translated dynamically.

**Deliverables:**
- [ ] KIAAN chat uses `Accept-Language` for response language
- [ ] AI-assisted translation pipeline (OpenAI for draft → review queue)
- [ ] Dynamic content translation (journey titles, descriptions, step text)
- [ ] PostgreSQL `translations` table for dynamic content
- [ ] Redis cache for translated content (1h TTL)
- [ ] Translation admin panel (review/approve AI translations)
- [ ] Gita verse translations for all 17 languages
- [ ] RTL layout support (Arabic, future Urdu/Hebrew)
- [ ] Date/number formatting in all locale-sensitive components

**Exit Criteria:**
- KIAAN responds in correct language >95% of the time
- Dynamic content translation latency < 2s (with loading state)
- Redis cache hit rate > 80% for translated content
- RTL layout renders correctly for Arabic

---

### Phase 3: Offline + Mobile Native i18n (Weeks 9-12)

**Goal:** Translations work offline; native mobile apps support multiple languages.

**Deliverables:**
- [ ] Service Worker caches all locale bundles on first visit
- [ ] IndexedDB stores translations for offline access
- [ ] Offline language switch works without network
- [ ] Android `strings.xml` for top 5 languages
- [ ] iOS String Catalogs for top 5 languages
- [ ] React Native `react-i18next` setup with shared JSON format
- [ ] Mobile language selector (native UI, matches platform guidelines)
- [ ] Push notifications in user's language

**Exit Criteria:**
- Offline user can read verses, journal entries, and navigate in chosen language
- Native Android/iOS apps show localized UI for 5 languages
- Push notifications delivered in correct locale

---

### Phase 4: Community Translation + Scale (Weeks 13-16)

**Goal:** Community can contribute translations; system handles all 17 languages at scale.

**Deliverables:**
- [ ] Community translation portal (web UI for contributors)
- [ ] Translator role with review workflow
- [ ] Translation memory (reuse prior translations for consistency)
- [ ] Automated quality checks (grammar, tone, consistency)
- [ ] Translation analytics dashboard (completion %, usage by locale)
- [ ] CDN optimization for locale bundles (edge caching per region)
- [ ] A/B testing framework for translation variants
- [ ] SEO-optimized locale routing (`/hi/`, `/ta/` URL prefixes) for public pages

**Exit Criteria:**
- Community translators can submit and get reviewed within 48 hours
- All 17 languages at >90% translation completeness
- Bundle served from nearest CDN edge in < 50ms
- Translation quality score > 4.0/5.0 (user rating)

---

### Phase 5: Production Hardening (Weeks 17-20)

**Goal:** Production-grade reliability, monitoring, and performance for multilingual system.

**Deliverables:**
- [ ] Translation monitoring dashboard (missing keys, error rates, latency)
- [ ] Automated translation regression tests
- [ ] Load testing: 10K concurrent users across all locales
- [ ] Translation audit trail (who changed what, when, why)
- [ ] Locale-specific performance optimization (CJK font subsetting, etc.)
- [ ] Translation versioning (rollback bad translations)
- [ ] GDPR compliance for translation data (data export, deletion)
- [ ] Documentation: Translation contributor guide, API docs

**Exit Criteria:**
- P95 language switch latency < 200ms
- Translation-related error rate < 0.01%
- All 17 languages production-ready with monitoring
- Runbook documented for translation incidents

---

## Summary

| Phase | Timeline | Key Outcome |
|-------|----------|-------------|
| **Phase 1: MVP** | Weeks 1-4 | Users switch languages, UI fully translated, CI checks |
| **Phase 2: Dynamic** | Weeks 5-8 | KIAAN speaks user's language, journey content translated |
| **Phase 3: Offline + Mobile** | Weeks 9-12 | Works offline, native apps localized |
| **Phase 4: Community** | Weeks 13-16 | Community translations, scale to 17 languages |
| **Phase 5: Hardening** | Weeks 17-20 | Production-grade monitoring, performance, compliance |

The path from MVP to production is incremental — each phase adds capability without requiring rewrites. The existing i18n infrastructure (next-intl, 17 locale bundles, language selector) provides a strong foundation. The key gaps are: backend locale sync, dynamic content translation, offline caching, and native mobile i18n — all addressed systematically in this roadmap.
