# Journey Mobile Feature Feasibility & Voice Synthesis Roadmap

## KIAAN Ecosystem — Mobile Product Assessment

**Date:** 2026-03-01
**Status:** Planning / Pre-Implementation
**Author:** Architecture Review

---

## Table of Contents

1. [Feasibility Assessment](#1-feasibility-assessment)
2. [Voice Synthesis Roadmap](#2-voice-synthesis-roadmap)
3. [Implementation Plan](#3-implementation-plan)
4. [Deliverables](#4-deliverables)

---

## 1. Feasibility Assessment

### 1.1 Verdict: Fully Feasible

The Journey feature on mobile is **fully feasible** and well-positioned for implementation. The existing codebase already provides:

- A mature backend with Journey models, templates, step states, and KIAAN AI generation (`backend/models/journeys.py`, `backend/services/journey_engine/`)
- A RESTful API layer (`backend/routes/journeys.py`, `backend/routes/journey_engine.py`)
- A React Native scaffold with navigation, state management, and theming (`mobile/react-native/`)
- An Android Kotlin native shell (`mobile/android/`)
- Shared services architecture (`mobile/shared/services/`)
- 17 locale directories for i18n (`locales/`)

### 1.2 Core Components Required

| Component | Exists Today | Mobile Adaptation Needed |
|-----------|-------------|-------------------------|
| **Journey Templates** | Yes — `JourneyTemplate` + `JourneyTemplateStep` models with Sad-Ripu tags, difficulty, duration | Fetch & cache template catalog; render cards with icons, color themes |
| **User Journey Instance** | Yes — `UserJourney` model with personalization JSON (pace, tone, focus tags, provider) | Start/pause/resume flows; sync `current_day_index` optimistically |
| **Step State & KIAAN Content** | Yes — `UserJourneyStepState` stores `kiaan_step_json` with teaching, reflection prompts, practice, check-in | Render structured step content; support offline-first reads |
| **Progress Tracking** | Yes — `UserJourneyProgress` + `progress_percentage` on `WisdomJourney` | Animated progress rings; streak indicators; push-notification reminders |
| **Verse Integration** | Yes — `verse_refs` in step state, `gita_verses` table | Verse card with Sanskrit + translation + audio playback |
| **Voice Companion** | Yes — ElevenLabs, Sarvam, Bhashini TTS services; `VoiceConversation` model | Native audio playback via `react-native-track-player`; background audio |
| **Authentication** | Yes — JWT + refresh tokens, WebAuthn, 2FA | Secure token storage via `react-native-keychain`; biometric unlock |
| **Offline Support** | Partial — web uses IndexedDB + Service Worker | WatermelonDB for local journey/step cache; background sync |

### 1.3 Platform Constraints

| Constraint | iOS | Android | Mitigation |
|-----------|-----|---------|------------|
| **Background audio** | AVAudioSession required; interruption handling | AudioFocus with `AUDIOFOCUS_GAIN` | `react-native-track-player` abstracts both platforms |
| **Push notifications** | APNs (requires Apple Developer cert) | FCM (already configured via `@react-native-firebase/messaging`) | Unified via Firebase; local notifications for offline reminders |
| **Offline storage** | 50 MB default, requestable up to ~1 GB | No hard limit, but battery-saver throttles sync | WatermelonDB with selective sync (active journey only) |
| **Background sync** | BGTaskScheduler (15-30 min minimum interval) | WorkManager (15 min minimum) | Sync on app-foreground; opportunistic background fetch |
| **Biometric auth** | Face ID / Touch ID | Fingerprint / Face Unlock | `react-native-keychain` supports both |
| **TTS latency** | Network-dependent; no native Indic TTS | Network-dependent; limited offline TTS | Pre-cache today's step audio on Wi-Fi; stream on cellular |
| **Bundle size** | App Store 200 MB OTA limit | Play Store 150 MB AAB limit | Code splitting; on-demand asset downloads |

### 1.4 API Dependencies

```
Mobile App
  │
  ├── GET  /api/journeys/catalog           → Template list (cacheable 5 min)
  ├── POST /api/journeys/start             → Create UserJourney
  ├── GET  /api/journeys/active            → Active journeys for user
  ├── GET  /api/journeys/{id}/today        → Today's step (KIAAN-generated)
  ├── POST /api/journeys/{id}/steps/{day}/complete  → Mark step done
  ├── POST /api/journeys/{id}/steps/{day}/check-in  → Submit check-in
  │
  ├── GET  /api/voice/synthesize           → TTS audio (ElevenLabs/Sarvam/Bhashini)
  ├── GET  /api/gita/verses/{chapter}/{verse}  → Verse content
  │
  └── Auth: /api/auth/login, /api/auth/refresh, /api/auth/webauthn
```

### 1.5 Trade-offs

| Decision | Option A | Option B | Recommendation |
|---------|----------|----------|---------------|
| **Offline depth** | Cache active journey only (lighter) | Cache full catalog + 3 journeys (richer) | **Option A** — keep initial storage footprint small; expand later |
| **Audio pre-caching** | Stream all TTS on-demand | Pre-download today's step audio on Wi-Fi | **Option B** — pre-cache on Wi-Fi for instant playback |
| **State sync** | Optimistic UI with server reconciliation | Wait for server confirmation | **Optimistic** — mark complete locally, sync in background, reconcile conflicts server-side |
| **AI step generation** | Generate on-device (needs local LLM) | Generate server-side (current approach) | **Server-side** — KIAAN content requires Gita corpus + safety validation; local LLMs cannot meet quality bar yet |
| **Notification strategy** | Push only | Push + local scheduled | **Push + local** — local reminders work offline; push for re-engagement |

---

## 2. Voice Synthesis Roadmap

### 2.1 Current Voice Infrastructure

MindVibe already has a **production-grade, multi-provider voice pipeline**:

```
Provider Priority Chain (Indian languages):
  1. ElevenLabs Multilingual v2  → Quality: 10/10, 29+ languages
  2. Sarvam AI Bulbul v1         → Quality: 9.5/10, 11 Indian languages
  3. Bhashini AI (Gov. India)    → Quality: 8/10, 22 scheduled languages
  4. Browser Web Speech API      → Quality: 6/10, always available

Provider Priority Chain (non-Indian languages):
  1. ElevenLabs                  → Premium multilingual
  2. OpenAI TTS                  → High quality, low latency
  3. Google Cloud TTS            → Wide coverage
  4. Browser fallback            → Universal
```

### 2.2 Target Languages & Voice Quality

#### Tier 1 — Launch Languages (MVP)

| Language | Code | Provider | Speaker | Quality Target | Status |
|----------|------|----------|---------|---------------|--------|
| **English (Indian)** | en-IN | ElevenLabs | Sarah (warm), Daniel (calm) | MOS ≥ 4.5 | Ready |
| **Hindi** | hi-IN | Sarvam AI | Meera (warm), Arjun (wisdom) | MOS ≥ 4.3 | Ready |
| **Sanskrit** (verse chanting) | sa | Sarvam AI / Bhashini | Maitreyi (meditative) | MOS ≥ 4.0 | Ready |

#### Tier 2 — Phase 2 Languages

| Language | Code | Provider | Quality Target |
|----------|------|----------|---------------|
| **Tamil** | ta-IN | Sarvam AI / Bhashini | MOS ≥ 4.0 |
| **Telugu** | te-IN | Sarvam AI / Bhashini | MOS ≥ 4.0 |
| **Bengali** | bn-IN | Sarvam AI / Bhashini | MOS ≥ 4.0 |
| **Kannada** | kn-IN | Sarvam AI / Bhashini | MOS ≥ 4.0 |
| **Marathi** | mr-IN | Sarvam AI / Bhashini | MOS ≥ 4.0 |
| **Gujarati** | gu-IN | Sarvam AI / Bhashini | MOS ≥ 4.0 |
| **Spanish** | es | ElevenLabs | MOS ≥ 4.3 |

#### Tier 3 — Phase 3 Languages

| Language | Code | Provider |
|----------|------|----------|
| Malayalam | ml-IN | Sarvam AI / Bhashini |
| Punjabi | pa-IN | Sarvam AI / Bhashini |
| Odia | od-IN | Bhashini |
| Japanese | ja | ElevenLabs |
| Portuguese | pt | ElevenLabs |
| French | fr | ElevenLabs |
| Chinese (Mandarin) | zh-CN | ElevenLabs |
| German | de | ElevenLabs |

### 2.3 Voice Qualities & Realism Metrics

#### Voice Personas (already defined in `multilingual_voice_engine.py`)

| Persona | Tone | Pitch | Speed | Use Case |
|---------|------|-------|-------|----------|
| **Calm** | Soft, even | Mid-low | 0.85-0.95x | Meditation, reflection prompts |
| **Wisdom** | Authoritative, warm | Mid | 0.90-1.0x | Teaching, verse explanation |
| **Friendly** | Bright, encouraging | Mid-high | 1.0-1.05x | Daily check-ins, celebrations |
| **Divine** | Reverent, ethereal | Low-mid | 0.80-0.90x | Sanskrit chanting, sacred text |
| **Chanting** | Rhythmic, resonant | Variable | 0.75-0.85x | Verse recitation |

#### Realism Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **MOS (Mean Opinion Score)** | ≥ 4.3 / 5.0 | User surveys (N=100+) |
| **Naturalness Rating** | ≥ 85% | A/B test vs. human reader |
| **Pronunciation Accuracy** | ≥ 95% | Sanskrit/Hindi expert review |
| **Emotional Appropriateness** | ≥ 90% | Context-matching survey |
| **Latency (time-to-first-byte)** | ≤ 500ms | P95 server-side measurement |
| **Latency (full audio ready)** | ≤ 2s | P95 for 200-word passage |

### 2.4 Technical Approach

#### Cloud vs. On-Device

| Approach | Pros | Cons | Recommendation |
|----------|------|------|---------------|
| **Cloud TTS** (current) | Highest quality; multi-provider fallback; no device storage | Requires network; latency; per-request cost | **Primary** — use for all real-time synthesis |
| **On-Device TTS** | Instant playback; works offline; no API cost | Lower quality for Indic languages; large model size (200-500 MB) | **Supplementary** — use platform default TTS as emergency fallback only |
| **Pre-cached Audio** | Instant playback; high quality; works offline | Storage cost; stale if content changes | **Strategic** — pre-cache today's journey step audio + common verses on Wi-Fi |

#### Audio Pipeline for Mobile

```
User opens Journey Step
  │
  ├── [Cache hit?] → Play from local storage (instant)
  │
  └── [Cache miss] → Request from backend
        │
        ├── Backend selects provider:
        │     1. Check ElevenLabs quota → use if available
        │     2. Check language → route to Sarvam for Indian languages
        │     3. Fallback → Bhashini or OpenAI
        │
        ├── Stream audio chunks to mobile via HTTP chunked transfer
        │
        ├── Mobile plays via react-native-track-player
        │     - Background audio support
        │     - Lock screen controls
        │     - Notification media controls
        │
        └── Cache audio locally for offline replay
              - Key: hash(text + language + speaker + emotion)
              - TTL: 7 days
              - Max cache: 100 MB (configurable)
```

#### Privacy Considerations

| Concern | Mitigation |
|---------|-----------|
| Voice data sent to cloud | Text-only sent to TTS providers; no user audio recorded on server |
| User reflections in TTS | Reflections are never sent to TTS; only curated KIAAN content |
| Provider data retention | ElevenLabs: no training on API data; Sarvam: Indian data sovereignty; Bhashini: government-controlled |
| Audio cache on device | Encrypted at rest via device filesystem encryption; cleared on logout |
| Speech-to-text privacy | On-device STT preferred (Web Speech API / native); server STT only if user opts in |

### 2.5 Minimum Viable Voice Capabilities

| Capability | MVP Requirement |
|-----------|----------------|
| **Languages** | 3 (English-Indian, Hindi, Sanskrit for verses) |
| **Voice personas** | 2 (Calm for meditation/reflection, Friendly for check-ins) |
| **Audio use cases** | 4: verse recitation, teaching narration, reflection prompt, check-in greeting |
| **Playback controls** | Play / pause / speed (0.75x-1.5x) / seek |
| **Offline audio** | Pre-cached current step audio |
| **Background playback** | Yes, with lock-screen controls |
| **Latency target** | ≤ 2s time-to-play (P95) |

---

## 3. Implementation Plan

### 3.1 Tech Stack Recommendation

**React Native (cross-platform)** — already scaffolded in `mobile/react-native/`

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | React Native 0.76 + New Architecture | Single codebase for iOS & Android; existing scaffold; shared Zustand stores with web |
| **Navigation** | React Navigation 7 | Already configured; native stack + bottom tabs |
| **State** | Zustand 5 + React Query 5 | Zustand for client state; React Query for server cache/sync |
| **Local DB** | WatermelonDB 0.27 | Fast SQLite-backed offline-first database; lazy loading; sync primitives |
| **Secure Storage** | react-native-keychain | JWT + refresh token storage; biometric gate |
| **Audio** | react-native-track-player 4.1 | Background audio; lock screen controls; queue management |
| **Animations** | Moti 0.29 (Reanimated 3) | 60fps animations; shared element transitions |
| **Push** | Firebase Messaging 21 | Already in package.json; cross-platform |
| **Fast KV** | react-native-mmkv 3.1 | Feature flags; user preferences; analytics cache |
| **Network** | Axios + React Query | Existing API client pattern; automatic retry; cache |
| **Testing** | Jest + React Native Testing Library | Already configured in package.json |
| **Icons** | Lucide React Native | Consistent with web app |

**Why not native iOS/Android or Flutter?**
- React Native scaffold already exists with navigation, theming, and state management
- Shared business logic with the Next.js web app (Zustand stores, API client, types)
- Team familiarity with TypeScript/React ecosystem
- React Native 0.76 New Architecture provides near-native performance
- WatermelonDB + react-native-track-player cover the two hardest mobile requirements (offline DB + background audio)

### 3.2 Phased Plan

#### Phase 1 — MVP (Weeks 1-6)

**Goal:** User can browse journeys, start one, complete daily steps with voice, and track progress.

| Week | Deliverable | Details |
|------|------------|---------|
| **1-2** | **Journey Catalog Screen** | Fetch `GET /api/journeys/catalog`; render template cards with enemy tags, difficulty, duration; search/filter by Sad-Ripu category; cache with React Query (stale-while-revalidate 5 min) |
| **2-3** | **Journey Start & Active View** | Start flow: select pace/tone → `POST /api/journeys/start`; active journey list from `GET /api/journeys/active`; progress ring animation with Moti |
| **3-4** | **Daily Step Screen** | Fetch today's step from `GET /api/journeys/{id}/today`; render `kiaan_step_json`: teaching, verse card, reflection prompts, practice, micro-commitment; complete step via `POST .../complete`; check-in submission |
| **4-5** | **Voice Playback Integration** | Integrate `react-native-track-player`; fetch TTS audio from `/api/voice/synthesize`; play teaching narration and verse recitation; playback controls (play/pause/speed); lock-screen + notification controls |
| **5-6** | **Offline Foundation & Auth** | Token storage in keychain with biometric unlock; WatermelonDB schema for journeys + steps; cache active journey data on fetch; offline read of cached steps; queue completions for sync |

#### Phase 2 — Enhancement (Weeks 7-12)

| Week | Deliverable | Details |
|------|------------|---------|
| **7-8** | **Push Notifications & Reminders** | Firebase push for re-engagement; local scheduled notifications for daily practice reminder; deep-link into today's step |
| **8-9** | **Audio Pre-caching & Offline Voice** | Background download today's step audio on Wi-Fi; cache verse audio for active journey; 100 MB LRU audio cache; platform fallback TTS for emergency |
| **9-10** | **Multilingual Expansion (Tier 2)** | Add Tamil, Telugu, Bengali, Kannada, Marathi, Gujarati voice support; language selector in journey settings; RTL support for Urdu |
| **10-11** | **Progress Analytics & Streaks** | Streak counter with fire animation; weekly progress chart (Recharts or Victory Native); journey completion celebration with confetti; share milestone card |
| **11-12** | **Accessibility & Polish** | WCAG 2.1 AA compliance; VoiceOver/TalkBack full coverage; dynamic font scaling; reduced motion support; high contrast mode |

#### Phase 3 — Advanced (Weeks 13-18)

| Week | Deliverable | Details |
|------|------------|---------|
| **13-14** | **KIAAN Voice Companion (conversational)** | Speech-to-text input; real-time KIAAN conversation about journey content; "Hey KIAAN" wake word (on-device keyword spotting) |
| **14-15** | **Personalized Journey Recommendations** | ML-based journey suggestions from mood + journal data; recommendation cards on home screen; A/B test recommendation algorithms |
| **15-16** | **Meditation & Audio Enhancements** | Binaural beats overlay during meditation practice; spatial audio for immersive verse recitation; breathing sync audio guide |
| **16-17** | **Tier 3 Languages & Voice Cloning Prep** | Add remaining languages; prepare voice cloning pipeline for custom KIAAN voices; regional accent variants |
| **17-18** | **Performance Hardening & App Store Prep** | Bundle optimization (< 30 MB initial); startup time < 2s; Hermes engine tuning; App Store / Play Store submission |

### 3.3 Success Criteria

#### Functional

| Metric | Target |
|--------|--------|
| Journey start-to-completion rate | ≥ 30% (14-day journeys) |
| Daily step completion rate | ≥ 60% on active journeys |
| Voice playback usage rate | ≥ 40% of step views include audio play |
| Offline step access success | 100% for cached active journey |
| Push notification opt-in | ≥ 70% |

#### Technical

| Metric | Target |
|--------|--------|
| App startup time (cold) | ≤ 2s on mid-range device |
| Step screen render | ≤ 300ms after data ready |
| Voice time-to-play | ≤ 2s (P95, online); instant (cached) |
| Crash-free sessions | ≥ 99.5% |
| API error rate | ≤ 0.5% |
| Offline sync success | ≥ 99% (eventual consistency within 5 min) |
| Bundle size (download) | ≤ 30 MB (initial); ≤ 80 MB (with all assets) |
| Battery drain | ≤ 5% per 30-min session |

#### User Experience

| Metric | Target |
|--------|--------|
| App Store rating | ≥ 4.5 stars |
| NPS (Net Promoter Score) | ≥ 50 |
| Session duration | ≥ 5 min average |
| 7-day retention | ≥ 40% |
| 30-day retention | ≥ 25% |

### 3.4 Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **TTS provider outage** | Medium | High | 4-level fallback chain (ElevenLabs → Sarvam → Bhashini → Browser); pre-cached audio as buffer |
| **High TTS cost at scale** | Medium | Medium | Aggressive caching (7-day TTL); Sarvam/Bhashini for Indian languages (lower cost); batch synthesis during off-peak |
| **Poor Indic TTS quality** | Low | High | Sarvam AI Bulbul rated 9.5/10 for Indian languages; Bhashini as secondary; user quality feedback loop |
| **Offline sync conflicts** | Medium | Medium | Server-side last-write-wins with timestamp; idempotent step completion; conflict resolution UI for reflections |
| **Large bundle size** | Medium | Medium | Hermes engine; code splitting; on-demand asset download; no inline audio assets |
| **React Native performance** | Low | Medium | New Architecture (Fabric + TurboModules); Reanimated for animations; WatermelonDB (not AsyncStorage) |
| **App Store rejection** | Low | High | Follow Apple/Google review guidelines; no misleading claims; proper privacy disclosures; accessibility compliance |
| **KIAAN AI content quality** | Low | High | Existing safety validation + JSON schema enforcement; Gita corpus grounding; human review of templates |

---

## 4. Deliverables

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Mobile App (React Native)                         │
│                                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Journey  │  │ Daily Step   │  │ Voice      │  │ Profile &        │  │
│  │ Catalog  │  │ View         │  │ Player     │  │ Settings         │  │
│  │ Screen   │  │              │  │            │  │                  │  │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘  └────────┬─────────┘  │
│       │               │               │                   │             │
│  ┌────┴───────────────┴───────────────┴───────────────────┴──────────┐  │
│  │                     State Layer (Zustand + React Query)            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │ journeyStore│  │ voiceStore   │  │ authStore                │  │  │
│  │  └──────┬──────┘  └──────┬───────┘  └────────────┬─────────────┘  │  │
│  └─────────┼────────────────┼───────────────────────┼────────────────┘  │
│            │                │                       │                    │
│  ┌─────────┴────────────────┴───────────────────────┴────────────────┐  │
│  │                     Data Layer                                     │  │
│  │  ┌────────────────┐  ┌──────────────┐  ┌────────────────────────┐ │  │
│  │  │ WatermelonDB   │  │ Audio Cache  │  │ Keychain               │ │  │
│  │  │ (offline DB)   │  │ (LRU 100MB)  │  │ (tokens + biometric)   │ │  │
│  │  └────────────────┘  └──────────────┘  └────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     API Client (Axios)                             │  │
│  │  - JWT auto-attach from keychain                                   │  │
│  │  - Token refresh interceptor                                       │  │
│  │  - Retry with exponential backoff                                  │  │
│  │  - Offline queue for mutations                                     │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend (existing)                         │
│                                                                          │
│  ┌───────────────────┐  ┌────────────────────┐  ┌────────────────────┐  │
│  │ Journey API       │  │ Voice API          │  │ Auth API           │  │
│  │ /api/journeys/*   │  │ /api/voice/*       │  │ /api/auth/*        │  │
│  └────────┬──────────┘  └────────┬───────────┘  └────────┬───────────┘  │
│           │                      │                       │               │
│  ┌────────┴──────────────────────┴───────────────────────┴───────────┐  │
│  │                     Service Layer                                  │  │
│  │  Journey Engine │ KIAAN Core │ Multilingual Voice │ Gita Service   │  │
│  └────────┬──────────────────────┬───────────────────────────────────┘  │
│           │                      │                                       │
│  ┌────────┴──────────┐  ┌───────┴────────────────────────────────────┐  │
│  │ PostgreSQL        │  │ TTS Providers                               │  │
│  │ + Redis Cache     │  │ ElevenLabs │ Sarvam AI │ Bhashini │ OpenAI │  │
│  └───────────────────┘  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flows

#### Journey Step Completion Flow

```
User taps "Complete Step"
  │
  ├── [1] Optimistic UI update
  │     - Mark step complete locally in WatermelonDB
  │     - Animate progress ring
  │     - Show celebration micro-interaction
  │
  ├── [2] API call (background)
  │     POST /api/journeys/{id}/steps/{day}/complete
  │     Body: { check_in: { intensity: 7, label: "feeling calm" } }
  │
  ├── [3a] Success
  │     - Confirm local state
  │     - Pre-fetch tomorrow's step
  │     - Pre-cache tomorrow's audio (if Wi-Fi)
  │     - Update streak counter
  │
  └── [3b] Failure
        ├── Network error → Queue for retry (exponential backoff)
        ├── 409 Conflict → Step already completed (reconcile)
        └── 500 Server error → Keep local state; retry in 60s
```

#### Voice Playback Flow

```
User taps "Play" on teaching narration
  │
  ├── [1] Check audio cache
  │     Key: sha256(text + "hi-IN" + "meera" + "wisdom")
  │
  ├── [2a] Cache hit → Play immediately via TrackPlayer
  │
  └── [2b] Cache miss
        │
        ├── [3] Show loading shimmer on play button
        │
        ├── [4] Request audio
        │     GET /api/voice/synthesize?text=...&lang=hi-IN&speaker=meera
        │     Accept: audio/mpeg
        │     (Streamed response)
        │
        ├── [5] Begin playback as first chunks arrive
        │     - TrackPlayer supports progressive download
        │
        ├── [6] Cache complete audio file
        │     - Filesystem cache with LRU eviction at 100 MB
        │
        └── [7] Track analytics
              - voice_play event with latency, provider, language
```

### 4.3 Test Plan

#### Unit Tests

| Area | Test Cases | Framework |
|------|-----------|-----------|
| Journey store | Create/update/complete journey state; progress calculation; streak logic | Jest + Zustand |
| API client | Request formatting; token attachment; error handling; retry logic | Jest + MSW (Mock Service Worker) |
| Voice player | Play/pause/seek state machine; cache hit/miss logic; queue management | Jest |
| Offline sync | Queue mutations; dequeue on reconnect; conflict resolution | Jest + WatermelonDB mock |
| Accessibility | Screen reader labels; focus order; touch targets ≥ 44x44pt | React Native Testing Library |

#### Integration Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Journey happy path | Browse catalog → start journey → view step → play audio → complete → check progress | Progress updates; audio plays; step marked complete |
| Offline journey | Go offline → open cached step → complete step → go online → verify sync | Step accessible offline; completion synced on reconnect |
| Voice fallback | Block ElevenLabs → request Hindi TTS | Sarvam AI used; audio plays; latency ≤ 3s |
| Auth expiry | Let token expire → attempt API call → token refreshed → call succeeds | Seamless re-auth without user intervention |
| Push deep-link | Receive push → tap notification → app opens to today's step | Correct step displayed with correct journey context |

#### Performance Tests

| Metric | Test | Tool |
|--------|------|------|
| Startup time | Cold launch to interactive | Flipper / Android Profiler |
| Step render | Time from API response to full render | React DevTools + Reanimated profiler |
| Audio latency | Time from tap to first audio output | Custom instrumentation |
| Memory usage | 30-min session memory profile | Xcode Instruments / Android Profiler |
| Battery drain | 30-min active session battery impact | Device battery stats |

#### Accessibility Tests

| Check | Standard | Tool |
|-------|----------|------|
| Screen reader | All interactive elements labeled | VoiceOver (iOS) / TalkBack (Android) manual test |
| Touch targets | ≥ 44x44pt | Automated layout inspection |
| Color contrast | ≥ 4.5:1 (AA) | Automated contrast checker |
| Font scaling | Supports 200% text size | Manual test at max font size |
| Reduced motion | Animations respect `prefers-reduced-motion` | Device accessibility settings |

### 4.4 Non-Functional Requirements

#### Accessibility

| Requirement | Standard | Implementation |
|------------|----------|---------------|
| Screen reader | WCAG 2.1 AA | `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` on all elements (utility exists at `src/utils/accessibility.ts`) |
| Dynamic type | iOS Dynamic Type / Android sp | `allowFontScaling`; relative sizing; no fixed pixel heights for text containers |
| Color contrast | 4.5:1 minimum | Theme tokens (`src/theme/tokens.ts`) enforce contrast ratios |
| Touch targets | 44x44pt minimum | Button component (`src/components/common/Button.tsx`) enforces minimums |
| Reduced motion | `prefers-reduced-motion` | Moti/Reanimated conditionally disable animations |
| Voice control | Full app navigation via voice | All screens navigable via VoiceOver/TalkBack |

#### Localization

| Requirement | Implementation |
|------------|---------------|
| 17 locales supported | Existing `locales/` directory (bn, de, en, es, fr, gu, hi, ja, kn, ml, mr, pa, pt, sa, ta, te, zh-CN) |
| RTL support | React Native `I18nManager.forceRTL()` for Urdu/Arabic |
| Date/time formatting | `date-fns` locale-aware formatting |
| Number formatting | `Intl.NumberFormat` with locale |
| Transliteration | Sanskrit verse rendering with Devanagari + Roman transliteration |
| Content length flexibility | UI designs accommodate 40% text expansion for German/French |

#### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold start | ≤ 2s | Hermes engine; lazy screens; minimal initial bundle |
| Warm start | ≤ 500ms | In-memory state preserved |
| Screen transition | ≤ 300ms | Native stack navigator; Reanimated shared transitions |
| API response (P95) | ≤ 500ms | React Query with stale-while-revalidate |
| Audio time-to-play | ≤ 2s (online) | Streaming playback + pre-caching |
| Frame rate | 60fps sustained | Reanimated worklets on UI thread |
| Memory footprint | ≤ 150 MB active | WatermelonDB lazy loading; image recycling |
| Bundle size | ≤ 30 MB download | Hermes bytecode; ProGuard; tree-shaking |
| Audio cache | ≤ 100 MB | LRU eviction; configurable in settings |
| Battery (30 min) | ≤ 5% drain | Efficient network batching; no polling |

---

## Questions for Stakeholder Confirmation

Before implementation begins, confirm:

1. **Preferred languages for MVP** — proposed: English (Indian), Hindi, Sanskrit. Add others?
2. **Target platforms** — proposed: iOS 15+ and Android 8+ (API 26+). Acceptable minimums?
3. **Budget constraints** — ElevenLabs costs ~$0.30/1K chars; Sarvam/Bhashini significantly cheaper. Acceptable monthly TTS budget?
4. **Data privacy jurisdiction** — India-first (data residency in India)? GDPR compliance needed for EU users?
5. **On-device storage limit** — proposed: 100 MB audio cache + WatermelonDB. Acceptable?
6. **Voice persona preference** — 2 personas for MVP (Calm + Friendly). Sufficient?
7. **Timeline** — 18-week phased plan. Acceptable, or compress to tighter deadline?
