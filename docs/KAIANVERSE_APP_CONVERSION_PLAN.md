# KaianVerse (MindVibe) — Web-to-Mobile App Conversion Plan

**Version:** 1.0
**Date:** 2026-03-08
**Status:** Strategic Plan — Awaiting Confirmation on Key Decisions

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Tech Stack Recommendation](#3-tech-stack-recommendation)
4. [Architecture & Repository Layout](#4-architecture--repository-layout)
5. [Strategic Plan with Milestones](#5-strategic-plan-with-milestones)
6. [Screen Mapping: Web → Mobile](#6-screen-mapping-web--mobile)
7. [API & Performance Considerations](#7-api--performance-considerations)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Data Synchronization & Offline Support](#9-data-synchronization--offline-support)
10. [CI/CD & Deployment Plan](#10-cicd--deployment-plan)
11. [Risk Assessment & Fallback Plan](#11-risk-assessment--fallback-plan)
12. [Decisions Requiring Confirmation](#12-decisions-requiring-confirmation)

---

## 1. Executive Summary

This plan converts the existing **MindVibe / KaianVerse** web platform into native Android and iOS applications. The project already has a **React Native scaffold** (`mobile/react-native/`) with navigation, a Vibe Player, and Zustand state management, plus a **native Android Kotlin module** (`mobile/android/`) for Divine Consciousness. The recommendation is to build on this existing React Native foundation.

**Key facts from the codebase:**
- **Web Frontend:** Next.js 16 (App Router), React 18, Tailwind CSS, Zustand, Framer Motion
- **Backend:** Python FastAPI with 60+ API route modules, deployed on Render/Fly.io
- **Existing Mobile Scaffold:** React Native 0.76 with React Navigation 7, TanStack Query, WatermelonDB, MMKV, Firebase Messaging, react-native-track-player
- **Existing Native Modules:** Android Kotlin (DivineConsciousnessService), native ML directory
- **Total Web Routes:** ~45 pages/features
- **Backend Services:** 80+ service modules (KIAAN AI, Gita wisdom, journeys, voice, etc.)

---

## 2. Current Architecture Analysis

### 2.1 Web Frontend (Next.js)

| Layer | Technology | Mobile Equivalent |
|-------|-----------|-------------------|
| Framework | Next.js 16 (App Router) | React Native 0.76 (already scaffolded) |
| UI | Tailwind CSS, Radix UI, Framer Motion | React Native StyleSheet, Moti (already in deps) |
| State | Zustand 5 | Zustand 5 (shared, already in deps) |
| Data Fetching | Axios, OpenAI SDK | TanStack Query + Axios (already in deps) |
| Offline | IndexedDB (`idb`), Service Worker | WatermelonDB + MMKV (already in deps) |
| Auth | Custom (bcryptjs, sessions) | react-native-keychain (already in deps) |
| Voice | Web Speech API, custom hooks | Native speech modules (to build) |
| i18n | next-intl | react-native-localize (to add) |
| Charts | Recharts | react-native-svg + victory-native (to add) |

### 2.2 Backend (FastAPI)

The backend exposes 60+ route modules covering:

| Domain | Route Modules |
|--------|---------------|
| **Core AI (KIAAN)** | chat, kiaan_divine, kiaan_friend_mode, kiaan_learning, kiaan_voice_companion, divine_consciousness |
| **Journeys** | journeys, karma_marg, beginner_curriculum |
| **Gita Wisdom** | gita_api, gita_ai_analysis, gita_social_ingestion, indian_gita_sources |
| **Wellness Tools** | ardha, emotional_reset, viyoga, meditation, weekly_assessment |
| **Voice** | voice, voice_companion, voice_learning, multilingual_voice |
| **Analytics** | analytics, analytics_dashboard, emotional_patterns, moods, karma_footprint |
| **Auth/User** | auth, profile, two_factor_auth, webauthn |
| **Social** | community, chat_rooms, teams, sacred_reflections |
| **Payments** | subscriptions (Razorpay, Stripe) |
| **Admin** | admin routes, compliance, gdpr |

**The backend requires zero changes for MVP.** Mobile apps will consume the same REST API. Later phases add mobile-specific endpoints (push notification registration, device tokens, batch sync).

### 2.3 Existing Mobile Scaffold

The `mobile/react-native/` directory already contains:

```
mobile/react-native/
├── App.tsx              # Entry point with navigation, QueryClient, VibePlayer
├── src/
│   ├── components/      # UI components (6 subdirs)
│   ├── screens/         # Screen placeholders
│   ├── services/        # API service layer
│   ├── state/           # Zustand stores
│   ├── hooks/           # Custom hooks
│   ├── theme/           # Design tokens
│   ├── types/           # TypeScript types
│   ├── config/          # App configuration
│   └── utils/           # Utilities
├── package.json         # Dependencies configured
├── babel.config.js      # Babel with module-resolver
└── tsconfig.json        # TypeScript config
```

**Already configured:**
- React Navigation 7 (native stack + bottom tabs)
- 5 main tabs: Home, Journeys, Vibe, Sakha (KIAAN), Profile
- Auth + Onboarding flow in root stack
- TanStack Query with 5-min stale time
- Zustand for state management
- WatermelonDB for offline-first database
- MMKV for fast key-value storage
- react-native-keychain for secure credential storage
- Firebase Messaging for push notifications
- react-native-track-player for audio (Vibe Player)
- Moti for animations
- Lucide icons (same as web)

---

## 3. Tech Stack Recommendation

### 3.1 Framework Decision: React Native (Confirmed by Existing Scaffold)

**Recommendation: React Native** — The project already has a scaffolded React Native app with carefully chosen dependencies. This is the optimal choice because:

| Factor | React Native | Flutter | Native (Kotlin/Swift) |
|--------|-------------|---------|----------------------|
| Code reuse with web | **High** (shared TS types, Zustand stores, business logic) | Low (Dart vs TS) | None |
| Existing scaffold | **Already built** | Would start over | Partial (Android Kotlin module) |
| Team knowledge | **React/TS** (web codebase is React) | New language (Dart) | Two separate stacks |
| Library ecosystem | **Rich** (all deps already chosen) | Good but different | Platform-specific |
| AI/Voice integration | Good + native modules | Good + platform channels | Best |
| Development speed | **Fastest** given existing work | Medium | Slowest |

### 3.2 Recommended Mobile Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE APP STACK                       │
├─────────────────────────────────────────────────────────┤
│ Framework:        React Native 0.76 (New Architecture)   │
│ Navigation:       React Navigation 7                     │
│ State:            Zustand 5 (shared with web)            │
│ Data Fetching:    TanStack Query 5 + Axios               │
│ Offline DB:       WatermelonDB (SQLite-based)            │
│ Fast Storage:     react-native-mmkv                      │
│ Secure Storage:   react-native-keychain                  │
│ Push:             Firebase Cloud Messaging                │
│ Audio:            react-native-track-player              │
│ Animations:       Moti + react-native-reanimated 3       │
│ Icons:            lucide-react-native                    │
│ Charts:           victory-native (to add)                │
│ i18n:             react-native-localize + i18next        │
│ Voice Input:      @react-native-voice/voice              │
│ Voice Output:     react-native-tts                       │
│ Biometrics:       react-native-biometrics                │
│ Payments:         react-native-razorpay + Stripe SDK     │
│ Error Tracking:   @sentry/react-native                   │
│ Testing:          Jest + React Native Testing Library     │
│ Native Modules:   Kotlin (Android) + Swift (iOS)         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Authentication Strategy

The web app uses custom session-based auth (bcryptjs). For mobile:

```
┌──────────────────────────────────────────────────────────┐
│                MOBILE AUTH FLOW                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Email/Password Login                                 │
│     └─ POST /api/auth/login → JWT access + refresh token │
│                                                          │
│  2. Token Storage                                        │
│     └─ react-native-keychain (hardware-backed keystore)  │
│                                                          │
│  3. Token Refresh                                        │
│     └─ Axios interceptor: auto-refresh on 401            │
│                                                          │
│  4. Biometric Unlock                                     │
│     └─ react-native-biometrics → decrypt stored JWT      │
│                                                          │
│  5. 2FA (existing backend support)                       │
│     └─ TOTP + SMS verification                           │
│                                                          │
│  6. Social Login (Phase 2)                               │
│     └─ Google Sign-In, Apple Sign-In                     │
│                                                          │
│  Backend Change Required:                                │
│     └─ Add JWT token endpoint alongside session auth     │
│     └─ Add /api/auth/refresh endpoint                    │
│     └─ Add /api/auth/device-register endpoint            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Architecture & Repository Layout

### 4.1 Strategy: Monorepo (Current Structure)

The MindVibe repository already follows a monorepo pattern with `mobile/` alongside the web app. Maintain this structure:

```
MindVibe/
├── app/                        # Next.js web app (unchanged)
├── components/                 # Web React components (unchanged)
├── lib/                        # Web libraries (unchanged)
├── backend/                    # FastAPI backend (minor additions)
│   └── routes/
│       ├── mobile_auth.py      # NEW: JWT auth for mobile
│       ├── push_notifications.py # NEW: FCM token registration
│       └── mobile_sync.py      # NEW: Batch sync endpoint
│
├── mobile/                     # Mobile apps
│   ├── react-native/           # React Native codebase (primary)
│   │   ├── App.tsx
│   │   ├── src/
│   │   │   ├── screens/        # All mobile screens
│   │   │   │   ├── auth/
│   │   │   │   ├── onboarding/
│   │   │   │   ├── home/
│   │   │   │   ├── journeys/
│   │   │   │   ├── vibe/
│   │   │   │   ├── sakha/      # KIAAN chat
│   │   │   │   ├── profile/
│   │   │   │   ├── gita/
│   │   │   │   ├── tools/      # Ardha, Viyog, etc.
│   │   │   │   └── settings/
│   │   │   ├── components/
│   │   │   │   ├── ui/         # Button, Card, Input, etc.
│   │   │   │   ├── chat/       # Chat bubbles, input
│   │   │   │   ├── journey/    # Journey cards, progress
│   │   │   │   ├── vibe-player/# Audio player
│   │   │   │   ├── voice/      # Voice input/output
│   │   │   │   └── navigation/ # Tab bar, headers
│   │   │   ├── services/
│   │   │   │   ├── api.ts      # Axios instance + interceptors
│   │   │   │   ├── auth.ts     # Login, register, token refresh
│   │   │   │   ├── journeys.ts # Journey CRUD
│   │   │   │   ├── kiaan.ts    # KIAAN chat API
│   │   │   │   ├── gita.ts     # Gita verse API
│   │   │   │   ├── sync.ts     # Offline sync service
│   │   │   │   └── push.ts     # Push notification service
│   │   │   ├── state/
│   │   │   │   └── stores/     # Zustand stores
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── theme/          # Design tokens, colors, spacing
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   ├── config/         # Environment config
│   │   │   └── utils/          # Utility functions
│   │   ├── android/            # Android project (generated by RN)
│   │   ├── ios/                # iOS project (generated by RN)
│   │   ├── __tests__/          # Test suites
│   │   ├── package.json
│   │   ├── babel.config.js
│   │   ├── metro.config.js
│   │   ├── tsconfig.json
│   │   ├── app.json
│   │   └── Gemfile             # iOS CocoaPods
│   │
│   ├── android/                # Native Android modules (Kotlin)
│   │   └── app/
│   │       └── DivineConsciousnessService.kt
│   │
│   ├── ios/                    # Native iOS modules (Swift)
│   │
│   └── shared/                 # Shared code between web and mobile
│       ├── types/              # TypeScript types (symlinked or copied)
│       ├── constants/          # Shared constants
│       ├── validators/         # Input validation (Zod schemas)
│       └── services/           # Platform-agnostic business logic
│
├── native/                     # Native ML/Voice modules
│   ├── ml/                     # TFLite models for on-device inference
│   ├── android/                # Android-specific native code
│   ├── ios/                    # iOS-specific native code
│   └── shared/                 # Shared native interfaces
│
└── brand/                      # Shared design assets
    ├── icons/
    ├── fonts/
    └── design-tokens.json
```

### 4.2 Branching Strategy

```
main (production)
├── develop (integration)
│   ├── feature/mobile-auth
│   ├── feature/mobile-home-screen
│   ├── feature/mobile-kiaan-chat
│   ├── feature/mobile-journeys
│   ├── feature/mobile-vibe-player
│   └── feature/mobile-offline-sync
├── release/mobile-v1.0.0 (MVP release)
├── release/mobile-v1.1.0 (Phase 2)
└── hotfix/mobile-*
```

### 4.3 Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Screens | PascalCase + "Screen" suffix | `HomeScreen.tsx` |
| Components | PascalCase | `JourneyCard.tsx` |
| Hooks | camelCase + "use" prefix | `useJourneyProgress.ts` |
| Services | camelCase | `journeyService.ts` |
| Stores | camelCase + "Store" suffix | `journeyStore.ts` |
| Types | PascalCase + "Type"/"Props" suffix | `JourneyType.ts` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Test files | `*.test.tsx` / `*.test.ts` | `HomeScreen.test.tsx` |

---

## 5. Strategic Plan with Milestones

### Phase 0: Foundation (Weeks 1–2)

**Goal:** Complete project bootstrap, dev environment, CI/CD skeleton

| Task | Deliverable | Priority |
|------|------------|----------|
| Initialize RN project properly | Working `npx react-native run-android` and `run-ios` | P0 |
| Configure Metro bundler | `metro.config.js` with path aliases | P0 |
| Set up design system | Theme tokens matching web (colors, spacing, typography) | P0 |
| Build shared UI primitives | Button, Card, Input, Text, Avatar, Badge, Modal | P0 |
| Configure Axios + interceptors | Auto token refresh, error handling, base URL config | P0 |
| Set up Sentry for mobile | Crash reporting + performance monitoring | P1 |
| Configure GitHub Actions CI | Build check on PR, lint, typecheck, test | P1 |
| Add backend JWT auth endpoint | `POST /api/auth/mobile/login` returning JWT | P0 |
| Add token refresh endpoint | `POST /api/auth/mobile/refresh` | P0 |

**Exit Criteria:** App builds on both platforms, connects to backend, CI passes.

---

### Phase 1: MVP (Weeks 3–8)

**Goal:** Core user journey — Auth → Home → KIAAN Chat → Journeys → Gita → Profile

#### Sprint 1 (Weeks 3–4): Auth + Home + Navigation

| Screen | Web Route | Mobile Screen | Priority |
|--------|-----------|---------------|----------|
| Auth (Login/Register) | `/auth` | `AuthScreen` | P0 |
| Onboarding | `/onboarding` | `OnboardingScreen` | P0 |
| Home Dashboard | `/dashboard` | `HomeScreen` | P0 |
| Bottom Tab Navigation | N/A | `BottomTabBar` (exists) | P0 |

**Deliverables:**
- Working auth flow (login, register, forgot password)
- JWT token storage in Keychain
- Biometric unlock (fingerprint/Face ID)
- Home dashboard with user greeting, daily verse, journey progress
- Push notification setup (FCM token registration)

#### Sprint 2 (Weeks 5–6): KIAAN Chat + Gita

| Screen | Web Route | Mobile Screen | Priority |
|--------|-----------|---------------|----------|
| KIAAN Chat | `/kiaan` | `SakhaScreen` | P0 |
| KIAAN Voice | `/companion` | `VoiceCompanionScreen` | P1 |
| Gita Explorer | `/gita-explorer` (component) | `GitaScreen` | P0 |
| Verse Detail | Component-level | `VerseDetailScreen` | P0 |

**Deliverables:**
- Chat UI with streaming text (SSE or WebSocket)
- Voice input (speech-to-text)
- Voice output (text-to-speech via backend)
- Gita chapter/verse browser
- Verse sharing (native share sheet)

#### Sprint 3 (Weeks 7–8): Journeys + Profile

| Screen | Web Route | Mobile Screen | Priority |
|--------|-----------|---------------|----------|
| Journey Catalog | `/journeys` | `JourneysScreen` | P0 |
| Journey Detail | `/journeys/[id]` | `JourneyDetailScreen` | P0 |
| Journey Step | `/karma-marg` | `JourneyStepScreen` | P0 |
| Profile | `/profile` | `ProfileScreen` | P0 |
| Settings | `/settings` | `SettingsScreen` | P1 |

**Deliverables:**
- Journey catalog with categories and search
- Journey progress tracking with step completion
- Profile management (avatar, preferences)
- Settings (notifications, language, theme)
- Basic offline caching (journey content cached in WatermelonDB)

**MVP Exit Criteria:**
- User can register, login, chat with KIAAN, browse Gita, start journeys, manage profile
- Works on Android 8+ and iOS 15+
- P95 API latency < 500ms
- Crash-free rate > 99%
- App size < 50MB

---

### Phase 2: Enhancement (Weeks 9–14)

**Goal:** Wellness tools, Vibe Player, offline mode, analytics

| Feature | Screens | Priority |
|---------|---------|----------|
| **Vibe Player** (audio) | Full-screen player, mini player (already scaffolded) | P0 |
| **Ardha** (reframing) | `ArdhaScreen`, `ArdhaSessionScreen` | P1 |
| **Viyog** (detachment) | `ViyogScreen`, `ViyogAnalysisScreen` | P1 |
| **Emotional Reset** | `EmotionalResetScreen` | P1 |
| **Karma Footprint** | `KarmaFootprintScreen` | P2 |
| **Deep Insights** | `DeepInsightsScreen` | P2 |
| **Offline Mode** | Background sync, queue management | P0 |
| **Push Notifications** | Notification handling, deep linking | P0 |
| **Analytics Dashboard** | `AnalyticsScreen` with charts | P2 |
| **i18n** | Multi-language support | P1 |

**Deliverables:**
- Full Vibe Player with background audio, lock screen controls, playlist support
- Offline-first architecture (WatermelonDB sync with backend)
- Push notification deep linking
- Wellness tool screens
- In-app analytics with victory-native charts

---

### Phase 3: Polish & Launch (Weeks 15–18)

**Goal:** App store readiness, performance optimization, beta testing

| Task | Deliverable |
|------|------------|
| Performance optimization | < 2s cold start, < 100ms navigation, < 50MB app size |
| Accessibility audit | WCAG 2.1 AA, screen reader support, dynamic type |
| Security audit | Penetration testing, data encryption verification |
| App Store assets | Screenshots, descriptions, keywords (ASO) |
| TestFlight / Internal Testing | Beta distribution to 50+ testers |
| Play Store / App Store submission | Published apps |
| Monitoring dashboards | Sentry, Firebase Analytics, custom dashboards |
| Payments integration | Razorpay (India), Stripe (international) |

**Launch Criteria:**
- Crash-free rate > 99.5%
- App Store rating target > 4.5
- < 3s cold start on mid-range devices
- All critical user flows working offline
- GDPR/privacy compliance verified

---

### Phase 4: Post-Launch (Weeks 19+)

| Feature | Description |
|---------|-------------|
| Social features | Community, wisdom rooms, sacred reflections |
| Widgets | Home screen widgets (daily verse, streak) |
| Apple Watch / Wear OS | Companion apps for meditation timer |
| AR features | Immersive Gita visualization |
| ML on-device | Emotion detection, personalized recommendations |
| Subscription management | In-app purchases for premium tiers |

---

## 6. Screen Mapping: Web → Mobile

### 6.1 Complete Route Mapping

| Web Route | Mobile Screen | Tab | Phase |
|-----------|--------------|-----|-------|
| `/` (landing) | `HomeScreen` | Home | MVP |
| `/dashboard` | `HomeScreen` | Home | MVP |
| `/auth` | `AuthScreen` | Auth Stack | MVP |
| `/onboarding` | `OnboardingScreen` | Auth Stack | MVP |
| `/kiaan` | `SakhaScreen` | Sakha | MVP |
| `/companion` | `VoiceCompanionScreen` | Sakha | MVP |
| `/kiaan-vibe` | `VibeScreen` | Vibe | Phase 2 |
| `/journeys` | `JourneysScreen` | Journeys | MVP |
| `/karma-marg` | `JourneyStepScreen` | Journeys | MVP |
| `/profile` | `ProfileScreen` | Profile | MVP |
| `/settings` | `SettingsScreen` | Profile | MVP |
| `/account` | `AccountScreen` | Profile | MVP |
| `/gita-explorer` (component) | `GitaScreen` | Home/Modal | MVP |
| `/ardha` | `ArdhaScreen` | Tools | Phase 2 |
| `/viyog` | `ViyogScreen` | Tools | Phase 2 |
| `/emotional-reset` | `EmotionalResetScreen` | Tools | Phase 2 |
| `/karma-footprint` | `KarmaFootprintScreen` | Tools | Phase 2 |
| `/karmic-tree` | `KarmicTreeScreen` | Tools | Phase 2 |
| `/deep-insights` | `DeepInsightsScreen` | Tools | Phase 2 |
| `/sacred-reflections` | `SacredReflectionsScreen` | Social | Phase 4 |
| `/community` | `CommunityScreen` | Social | Phase 4 |
| `/wisdom-rooms` | `WisdomRoomsScreen` | Social | Phase 4 |
| `/companion` | `CompanionScreen` | Sakha | Phase 2 |
| `/analytics` | `AnalyticsScreen` | Profile | Phase 2 |
| `/subscription` | `SubscriptionScreen` | Profile | Phase 3 |
| `/pricing` | `PricingScreen` | Profile | Phase 3 |
| `/sambandh-dharma` | `SambandhDharmaScreen` | Tools | Phase 2 |
| `/tools` | `ToolsScreen` | Home/Modal | Phase 2 |
| `/offline` | N/A (always available) | — | Phase 2 |

### 6.2 Navigation Architecture

```
RootStack (Native Stack)
├── Auth (no tabs)
│   ├── LoginScreen
│   ├── RegisterScreen
│   ├── ForgotPasswordScreen
│   └── TwoFactorScreen
│
├── Onboarding (no tabs)
│   ├── WelcomeStep
│   ├── GoalSelectionStep
│   ├── EmotionAssessmentStep
│   └── CompletionStep
│
└── Main (Bottom Tabs)
    ├── HomeTab (Stack)
    │   ├── HomeScreen (dashboard)
    │   ├── DailyVerseScreen
    │   ├── GitaScreen
    │   ├── VerseDetailScreen
    │   └── ToolsScreen
    │
    ├── JourneysTab (Stack)
    │   ├── JourneyCatalogScreen
    │   ├── JourneyDetailScreen
    │   └── JourneyStepScreen
    │
    ├── VibeTab (Stack)
    │   ├── VibeHomeScreen
    │   └── VibePlayerFullScreen
    │
    ├── SakhaTab (Stack)
    │   ├── SakhaScreen (KIAAN chat)
    │   ├── VoiceCompanionScreen
    │   └── CompanionScreen
    │
    └── ProfileTab (Stack)
        ├── ProfileScreen
        ├── SettingsScreen
        ├── AccountScreen
        ├── AnalyticsScreen
        ├── SubscriptionScreen
        └── LanguageScreen
```

---

## 7. API & Performance Considerations

### 7.1 Mobile-Friendly API Modifications

The existing FastAPI backend serves the web app well, but mobile clients have different constraints:

#### Required Backend Changes

```python
# 1. JWT Authentication Endpoint (NEW)
# backend/routes/mobile_auth.py

@router.post("/api/auth/mobile/login")
async def mobile_login(credentials: MobileLoginRequest) -> MobileAuthResponse:
    """
    Returns JWT access token (15 min) + refresh token (30 days).
    Stores device_id for push notification targeting.
    """
    ...

@router.post("/api/auth/mobile/refresh")
async def refresh_token(refresh: RefreshRequest) -> TokenResponse:
    """
    Exchange refresh token for new access + refresh tokens.
    Invalidates old refresh token (rotation).
    """
    ...

# 2. Push Notification Registration (NEW)
# backend/routes/push_notifications.py

@router.post("/api/mobile/push/register")
async def register_device(device: DeviceRegistration):
    """
    Register FCM token for push notifications.
    Tracks device_id, platform (android/ios), app_version.
    """
    ...

# 3. Batch Sync Endpoint (NEW)
# backend/routes/mobile_sync.py

@router.post("/api/mobile/sync")
async def batch_sync(sync_request: SyncRequest) -> SyncResponse:
    """
    Accepts queued offline actions (journey completions, journal entries)
    and returns server-side changes since last_sync_timestamp.

    Handles conflict resolution: server wins for journey data,
    client wins for journal entries (user-authored content).
    """
    ...

# 4. Paginated Endpoints (MODIFY existing)
# Add cursor-based pagination to list endpoints

@router.get("/api/journeys")
async def list_journeys(
    cursor: Optional[str] = None,
    limit: int = Query(default=20, le=50),
) -> PaginatedResponse[Journey]:
    ...
```

#### API Response Optimization

```
Mobile-specific headers:
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1709913600
  X-Request-Id: req_abc123
  ETag: "v1-hash"
  Cache-Control: max-age=300

Response compression:
  Accept-Encoding: gzip, br
  Content-Encoding: br (Brotli preferred, ~20% smaller than gzip)

Payload optimization:
  - Use sparse fieldsets: ?fields=id,title,progress,thumbnail
  - Use cursor pagination (not offset): ?cursor=eyJpZCI6MTAwfQ
  - Batch requests: POST /api/batch with multiple operations
  - ETag-based caching: If-None-Match → 304 Not Modified
```

### 7.2 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold start | < 2s | Time from tap to interactive home screen |
| Warm start | < 500ms | Time from background to foreground |
| Screen navigation | < 100ms | Time from tap to screen render |
| API response (cached) | < 50ms | MMKV/WatermelonDB read |
| API response (network) | < 500ms P95 | Backend round trip |
| KIAAN chat response | < 3s | First token streaming time |
| Image loading | < 1s | With progressive loading |
| App size (Android) | < 40MB | APK size |
| App size (iOS) | < 50MB | IPA size |
| Memory usage | < 200MB | During normal usage |
| Battery drain | < 5%/hour | Active usage |
| Offline availability | 100% | Core features work offline |

### 7.3 Caching Strategy

```
┌───────────────────────────────────────────────────────┐
│                   CACHING LAYERS                       │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Layer 1: In-Memory (TanStack Query)                  │
│  ├── staleTime: 5 minutes                             │
│  ├── cacheTime: 30 minutes                            │
│  └── Use: API response caching per session            │
│                                                       │
│  Layer 2: MMKV (Fast Key-Value)                       │
│  ├── User preferences, auth tokens, feature flags     │
│  ├── Last sync timestamp                              │
│  └── Use: Settings, config (< 1ms reads)              │
│                                                       │
│  Layer 3: WatermelonDB (SQLite)                       │
│  ├── Journey data, Gita verses, chat history          │
│  ├── Offline queue (pending sync actions)             │
│  └── Use: Structured data, relationships, queries     │
│                                                       │
│  Layer 4: File System                                 │
│  ├── Downloaded audio files (Vibe tracks)             │
│  ├── Cached images                                    │
│  └── Use: Large binary assets                         │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 8. Authentication & Authorization

### 8.1 Auth Flow

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE AUTH FLOW                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  FIRST LAUNCH:                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ Splash   │───▶│Onboarding│───▶│ Register │          │
│  │ Screen   │    │ (3 steps)│    │ / Login  │          │
│  └──────────┘    └──────────┘    └────┬─────┘          │
│                                       │                 │
│                                       ▼                 │
│                              ┌──────────────┐           │
│                              │ POST /login  │           │
│                              │ → JWT access │           │
│                              │ → JWT refresh│           │
│                              └──────┬───────┘           │
│                                     │                   │
│                                     ▼                   │
│                              ┌──────────────┐           │
│                              │ Store in     │           │
│                              │ Keychain     │           │
│                              │ (encrypted)  │           │
│                              └──────┬───────┘           │
│                                     │                   │
│                                     ▼                   │
│                              ┌──────────────┐           │
│                              │ Register FCM │           │
│                              │ Token        │           │
│                              └──────┬───────┘           │
│                                     │                   │
│                                     ▼                   │
│                              ┌──────────────┐           │
│                              │  Home Screen │           │
│                              └──────────────┘           │
│                                                         │
│  RETURNING USER:                                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ Splash   │───▶│ Biometric│───▶│  Home    │          │
│  │ Screen   │    │ Unlock   │    │  Screen  │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                         │
│  TOKEN EXPIRED (401):                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ API call │───▶│ Intercept│───▶│ Refresh  │          │
│  │ fails    │    │  401     │    │ Token    │          │
│  └──────────┘    └──────────┘    └────┬─────┘          │
│                                       │                 │
│                              ┌────────┴────────┐        │
│                              ▼                 ▼        │
│                        ┌──────────┐    ┌──────────┐     │
│                        │ Success: │    │ Fail:    │     │
│                        │ Retry    │    │ Logout   │     │
│                        │ original │    │ → Login  │     │
│                        └──────────┘    └──────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Secure Storage Implementation

```typescript
// services/auth.ts — Token management

import * as Keychain from 'react-native-keychain';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function storeTokens(tokens: TokenPair): Promise<void> {
  await Keychain.setGenericPassword(
    'mindvibe_auth',
    JSON.stringify(tokens),
    {
      service: 'com.mindvibe.auth',
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  );
}

export async function getTokens(): Promise<TokenPair | null> {
  const result = await Keychain.getGenericPassword({
    service: 'com.mindvibe.auth',
  });
  if (!result) return null;
  return JSON.parse(result.password);
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: 'com.mindvibe.auth' });
}
```

---

## 9. Data Synchronization & Offline Support

### 9.1 Offline Architecture

```
┌────────────────────────────────────────────────────────┐
│              OFFLINE-FIRST ARCHITECTURE                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────┐     ┌──────────────┐     ┌─────────┐     │
│  │ Screen  │────▶│ TanStack     │────▶│ Network │     │
│  │ (UI)    │     │ Query        │     │ (Axios) │     │
│  └─────────┘     └──────┬───────┘     └────┬────┘     │
│                         │                   │          │
│                         ▼                   ▼          │
│                  ┌──────────────┐    ┌──────────────┐  │
│                  │ WatermelonDB │    │ Backend API  │  │
│                  │ (local)      │◀──▶│ (remote)     │  │
│                  └──────────────┘    └──────────────┘  │
│                         │                              │
│                         │ Sync Engine                  │
│                         ▼                              │
│                  ┌──────────────┐                      │
│                  │ Offline      │                      │
│                  │ Queue        │                      │
│                  │ (MMKV)       │                      │
│                  └──────────────┘                      │
│                                                        │
│  SYNC STRATEGY:                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ 1. Read: WatermelonDB first → API if stale    │    │
│  │ 2. Write: Queue in WatermelonDB + MMKV        │    │
│  │ 3. Sync: On connectivity → batch POST /sync   │    │
│  │ 4. Conflict: Server wins (journey data)       │    │
│  │           Client wins (journal entries)        │    │
│  │ 5. Retry: Exponential backoff (2s, 4s, 8s)    │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 9.2 What Works Offline

| Feature | Offline Capability | Sync Strategy |
|---------|-------------------|---------------|
| Gita Verses | Full (pre-cached) | Download all 700 verses on first launch (~2MB) |
| Journey Progress | Read + Write | Queue completions, sync on reconnect |
| KIAAN Chat | Read history only | Cannot send new messages (requires AI backend) |
| Vibe Player | Downloaded tracks | Pre-download option for playlists |
| Journal/Reflections | Full read + write | Sync on reconnect, client wins conflicts |
| Profile | Read cached | Sync on reconnect |
| Tools (Ardha, Viyog) | Limited (no AI) | Show cached results, queue new requests |
| Analytics | Read cached | Fetch fresh on reconnect |

### 9.3 Push Notifications

```
NOTIFICATION TYPES:
┌─────────────────────────────────────────┐
│ Type            │ Trigger               │
├─────────────────┼───────────────────────┤
│ Daily Verse     │ Scheduled (8 AM local)│
│ Journey Reminder│ If step not done today│
│ KIAAN Check-in  │ Weekly wellness check │
│ Streak Alert    │ About to lose streak  │
│ New Feature     │ App update available  │
│ Community       │ Wisdom room activity  │
└─────────────────┴───────────────────────┘

DEEP LINKING:
  mindvibe://journeys/journey-123/step/5
  mindvibe://kiaan?prompt=How+am+I+feeling
  mindvibe://gita/chapter/2/verse/47
  mindvibe://vibe/track/peaceful-morning
```

---

## 10. CI/CD & Deployment Plan

### 10.1 GitHub Actions Workflows

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI

on:
  pull_request:
    paths: ['mobile/**']
  push:
    branches: [develop, main]
    paths: ['mobile/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd mobile/react-native && npm ci
      - run: cd mobile/react-native && npm run lint
      - run: cd mobile/react-native && npm run typecheck
      - run: cd mobile/react-native && npm test -- --coverage

  build-android:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - run: cd mobile/react-native && npm ci
      - run: cd mobile/react-native/android && ./gradlew assembleRelease
      - uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: mobile/react-native/android/app/build/outputs/apk/release/

  build-ios:
    needs: lint-and-test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd mobile/react-native && npm ci
      - run: cd mobile/react-native/ios && pod install
      - run: |
          xcodebuild -workspace mobile/react-native/ios/MindVibe.xcworkspace \
            -scheme MindVibe -configuration Release \
            -sdk iphoneos -archivePath build/MindVibe.xcarchive archive
```

### 10.2 Release Pipeline

```
Development → PR → CI (lint + test + build) → Review → Merge to develop
                                                            │
develop ────────────────────────────────────────────────────▶│
                                                            │
                                                     ┌──────▼──────┐
                                                     │  Staging     │
                                                     │  TestFlight  │
                                                     │  Internal    │
                                                     │  Testing     │
                                                     └──────┬───────┘
                                                            │
                                                     ┌──────▼──────┐
                                                     │  Release     │
                                                     │  Branch      │
                                                     │  v1.0.0      │
                                                     └──────┬───────┘
                                                            │
                                              ┌─────────────┼─────────────┐
                                              ▼                           ▼
                                       ┌──────────────┐           ┌──────────────┐
                                       │ Google Play  │           │ App Store    │
                                       │ Console      │           │ Connect      │
                                       │              │           │              │
                                       │ Internal →   │           │ TestFlight → │
                                       │ Alpha →      │           │ Beta →       │
                                       │ Beta →       │           │ Review →     │
                                       │ Production   │           │ Release      │
                                       └──────────────┘           └──────────────┘
```

### 10.3 App Store Requirements

**Google Play Store:**
- Target API level: 34+ (Android 14)
- Minimum API level: 26 (Android 8.0)
- AAB format (not APK) for Play Store
- App signing by Google Play
- Privacy policy URL
- Data safety form
- Content rating questionnaire

**Apple App Store:**
- Minimum iOS: 15.0
- Xcode 15+, Swift 5.9+
- App Store Connect metadata
- Privacy nutrition labels
- App Review guidelines compliance
- In-app purchase configuration (if applicable)
- Universal app (iPhone + iPad)

### 10.4 Code Signing

```
ANDROID:
  - Debug: auto-generated debug keystore
  - Release: upload key → Google manages signing key
  - Store keystore in GitHub Secrets (ANDROID_KEYSTORE_BASE64)

iOS:
  - Development: Apple Development certificate
  - Distribution: Apple Distribution certificate
  - Provisioning profiles: managed by Xcode Cloud or Fastlane Match
  - Store in GitHub Secrets or use Fastlane Match with private repo
```

---

## 11. Risk Assessment & Fallback Plan

### 11.1 Risk Matrix

| Risk | Probability | Impact | Mitigation | Fallback |
|------|------------|--------|------------|----------|
| **React Native performance issues** (complex animations, large lists) | Medium | High | Use Reanimated 3, FlatList virtualization, native modules for bottlenecks | Write critical screens as native modules (Kotlin/Swift) |
| **Voice feature platform differences** | High | Medium | Abstract voice behind platform-agnostic interface | Use backend-only voice processing (existing Whisper + TTS endpoints) |
| **Offline sync conflicts** | Medium | High | Last-write-wins with user-authored content priority | Show conflict resolution UI, let user choose |
| **App store rejection** | Medium | High | Follow review guidelines strictly, test on all target devices | Address rejection feedback, resubmit within 48h |
| **Backend API changes breaking mobile** | Low | High | API versioning (v1, v2), backward compatibility | Mobile app graceful degradation, force update mechanism |
| **Third-party library deprecation** | Low | Medium | Pin versions, monitor deprecation notices | Fork critical libraries, maintain internally |
| **Large app size** | Medium | Medium | Code splitting, lazy loading, ProGuard/R8 for Android | Remove unused dependencies, optimize assets |
| **Authentication token security** | Low | Critical | Hardware-backed keystore, biometrics, token rotation | Session-based fallback, forced re-login |
| **Push notification delivery** | Medium | Low | FCM + APNs with retry logic, in-app notification center | In-app polling fallback |
| **Payment integration complexity** | Medium | High | Use existing Razorpay/Stripe web integration via WebView initially | WebView-based payments, native SDK in Phase 3 |

### 11.2 Fallback Strategies

**If React Native Performance Unacceptable:**
- Identify bottleneck screens (profile with animation/metrics first)
- Convert those specific screens to native modules (Kotlin/Swift)
- Existing `mobile/android/` Kotlin code shows this pattern is already anticipated
- Use TurboModules for high-performance native bridge calls

**If Offline Sync Too Complex:**
- Phase 1: Read-only offline (cache API responses in WatermelonDB)
- Phase 2: Add write-through caching for journey progress only
- Phase 3: Full offline sync with conflict resolution

**If App Store Rejection:**
- Common rejection reasons: incomplete features, crashes, privacy issues
- Maintain a "rejection response" document with pre-written appeals
- Budget 2 weeks for review cycles in launch timeline

### 11.3 Force Update Mechanism

```typescript
// On app launch, check minimum required version
const checkAppVersion = async () => {
  const { minimumVersion, recommendedVersion } = await api.get('/api/mobile/version');
  const currentVersion = DeviceInfo.getVersion();

  if (semver.lt(currentVersion, minimumVersion)) {
    // Force update — block app usage
    showForceUpdateModal();
  } else if (semver.lt(currentVersion, recommendedVersion)) {
    // Soft update — suggest but allow skip
    showUpdateSuggestion();
  }
};
```

---

## 12. Decisions Requiring Confirmation

Before proceeding with implementation, the following decisions need stakeholder input:

### Decision 1: Mobile Framework
**Recommendation:** React Native (based on existing scaffold)
- [ ] Confirm React Native, or consider Flutter / pure native?
- Impact: Entire project timeline and team requirements

### Decision 2: Target OS Versions
**Recommendation:** Android 8.0+ (API 26), iOS 15.0+
- [ ] Confirm minimum OS versions
- [ ] Any specific device requirements? (tablets, foldables)
- Impact: Feature availability, testing matrix

### Decision 3: Shared Code Strategy
**Recommendation:** Share TypeScript types, Zustand store interfaces, and validation schemas between web and mobile via `mobile/shared/`
- [ ] Confirm shared code approach
- [ ] Should we use a workspace setup (npm/yarn workspaces)?
- Impact: Code reuse, maintenance overhead

### Decision 4: Authentication
**Recommendation:** JWT with refresh tokens (new backend endpoint)
- [ ] Confirm JWT approach vs. extending session-based auth
- [ ] Require social login (Google, Apple) in MVP or Phase 2?
- [ ] Require biometric unlock in MVP or Phase 2?
- Impact: Backend changes, security architecture

### Decision 5: Payments
**Recommendation:** WebView-based payments in MVP, native SDK in Phase 3
- [ ] Confirm payment approach
- [ ] Which markets? India-only (Razorpay) or international (Stripe)?
- Impact: Revenue timeline, compliance requirements

### Decision 6: Accessibility & Regulatory
- [ ] WCAG 2.1 AA compliance level required?
- [ ] GDPR compliance already handled in backend?
- [ ] Any specific Indian regulatory requirements (RBI for payments)?
- [ ] Support for RTL languages?
- Impact: Development effort, launch markets

### Decision 7: Analytics & Monitoring
**Recommendation:** Sentry (crash reporting) + Firebase Analytics (usage) + custom backend analytics
- [ ] Confirm analytics stack
- [ ] Any specific KPIs to track from day 1?
- Impact: SDK integration, data pipeline

---

## Appendix A: Step-by-Step Implementation Guide (MVP)

### Step 1: Project Bootstrap

```bash
# 1. Navigate to existing mobile directory
cd mobile/react-native

# 2. Install dependencies
npm install

# 3. Initialize native projects (if not already done)
npx react-native init MindVibe --template react-native-template-typescript --skip-install
# Or if using existing scaffold, just run:
cd ios && pod install && cd ..

# 4. Configure Metro bundler
# metro.config.js — add path aliases matching babel.config.js

# 5. Configure environment variables
# .env.development
API_BASE_URL=http://localhost:8000
SENTRY_DSN=...
FIREBASE_PROJECT_ID=...

# .env.staging
API_BASE_URL=https://staging-api.mindvibe.com

# .env.production
API_BASE_URL=https://api.mindvibe.com

# 6. Verify builds
npx react-native run-android
npx react-native run-ios
```

### Step 2: Design System Setup

```typescript
// theme/tokens.ts — match web design tokens
export const darkTheme = {
  // Colors from web globals.css / tailwind.config.ts
  background: '#0a0a0f',
  surface: '#1a1a2e',
  surfaceElevated: '#252540',
  primary: '#8b5cf6',        // Purple (spiritual)
  secondary: '#f59e0b',      // Amber (warmth)
  accent: '#06b6d4',         // Cyan (clarity)
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',

  // Typography
  fontSizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
  fontWeights: { normal: '400', medium: '500', semibold: '600', bold: '700' },

  // Spacing (4px base)
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },

  // Border radius
  radii: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },

  // Shadows
  shadow: { color: '#000', offset: { width: 0, height: 2 }, opacity: 0.25, radius: 4 },

  statusBarStyle: 'light-content' as const,
};
```

### Step 3: API Service Layer

```typescript
// services/api.ts
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from './auth';
import { Config } from '../config';

const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use(async (config) => {
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = await getTokens();
      if (tokens?.refreshToken) {
        const { data } = await axios.post(
          `${Config.API_BASE_URL}/api/auth/mobile/refresh`,
          { refresh_token: tokens.refreshToken }
        );
        await storeTokens(data);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      }
      await clearTokens();
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 4: Key Data Flows

```
USER OPENS APP:
  App.tsx bootstrap()
  → Check Keychain for tokens
  → If tokens exist && not expired → navigate to Main
  → If tokens exist && expired → try refresh → success? Main : Auth
  → If no tokens → check onboarding flag → Onboarding or Auth

USER SENDS KIAAN MESSAGE:
  SakhaScreen
  → Input captured → POST /api/chat (streaming SSE)
  → Display response tokens as they arrive
  → Save to WatermelonDB (chat history)
  → If offline → show "KIAAN unavailable offline" message

USER COMPLETES JOURNEY STEP:
  JourneyStepScreen
  → Step content displayed (from cache or API)
  → User taps "Complete"
  → POST /api/journeys/{id}/complete-step (or queue if offline)
  → Update WatermelonDB + Zustand store
  → Animate progress bar
  → If journey complete → show celebration modal

USER GOES OFFLINE:
  NetInfo detects disconnect
  → Set offlineMode flag in Zustand
  → All writes queue to MMKV offline queue
  → All reads serve from WatermelonDB cache
  → Show subtle "Offline" indicator in status bar
  → On reconnect → drain queue via POST /api/mobile/sync
```

---

## Appendix B: Estimated Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| Phase 0: Foundation | 2 weeks | Project setup, CI/CD, design system, auth endpoints |
| Phase 1: MVP | 6 weeks | Auth, Home, KIAAN Chat, Gita, Journeys, Profile |
| Phase 2: Enhancement | 6 weeks | Vibe Player, Wellness Tools, Offline, Push, i18n |
| Phase 3: Launch | 4 weeks | Polish, Security Audit, Beta Testing, Store Submission |
| **Total to Launch** | **18 weeks** | **Production apps on both stores** |
| Phase 4: Post-Launch | Ongoing | Social features, widgets, wearables, ML |

---

## Appendix C: Team Requirements

| Role | Count | Responsibility |
|------|-------|---------------|
| React Native Engineer | 2 | Screen development, state management, API integration |
| Backend Engineer | 1 (part-time) | JWT auth, sync endpoints, push notification service |
| Native Module Engineer | 1 (as needed) | Kotlin/Swift for voice, ML, biometrics |
| UI/UX Designer | 1 | Mobile design system, screen layouts, animations |
| QA Engineer | 1 | Manual + automated testing, device lab |
| DevOps | 1 (part-time) | CI/CD, code signing, store management |

---

*This document serves as the master plan for the KaianVerse web-to-mobile conversion. All decisions in Section 12 should be confirmed before implementation begins.*
