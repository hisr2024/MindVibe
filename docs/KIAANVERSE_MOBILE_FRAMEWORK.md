# Kiaanverse Mobile — Skeleton & Framework

Canonical reference for the **kiaanverse.com** mobile app skeleton that lives
under `kiaanverse-mobile/`. Describes the full directory layout, workspace
graph, provider hierarchy, route tree, shared packages, and build pipeline.

---

## 1. Platform & Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Expo SDK 51 (React Native 0.74.5, React 18.2) |
| Router | `expo-router` 3.5 (file-based, typed routes) |
| Language | TypeScript 5.3, `strict` + `noUncheckedIndexedAccess` |
| Monorepo | pnpm 9.1 workspaces |
| State | Zustand 5 (immer + devtools, AsyncStorage/SecureStore persistence) |
| Server cache | TanStack Query 5 + AsyncStorage persister (24 h offline cache) |
| HTTP | Axios 1.7 (centralized `apiClient` with auth + refresh interceptors) |
| i18n | In-house `@kiaanverse/i18n` (17 locales, namespaced messages) |
| UI | `@kiaanverse/ui` design system (Skia, Reanimated 3, Lottie, SVG) |
| Audio | `expo-av`, `expo-speech`, `react-native-track-player` |
| Auth | JWT + `expo-secure-store`, biometric gate via `expo-local-authentication` |
| Payments | `react-native-iap` (Play Billing / StoreKit 2) |
| Push / BG | `expo-notifications`, `expo-task-manager`, `expo-background-fetch` |
| Error tracking | `@sentry/react-native` 5.33 |
| Build / OTA | EAS Build (dev / preview / production profiles) + EAS Update |
| App identity | iOS `com.kiaanverse.app` · Android `com.kiaanverse.app` · scheme `kiaanverse://` |
| Deep links | `applinks:kiaanverse.com` + `applinks:*.kiaanverse.com` |

---

## 2. Monorepo Layout

```
kiaanverse-mobile/
├── package.json               # workspace root (pnpm 9)
├── pnpm-workspace.yaml        # apps/* + packages/*
├── tsconfig.base.json         # strict TS base
├── .eslintrc.js               # shared ESLint config
├── SECRETS.md                 # env / credential playbook
├── patches/                   # pnpm patches (expo-modules-core@1.12.26)
├── apps/
│   └── mobile/                # the Expo app (see §3)
└── packages/
    ├── api/                   # typed backend client (see §4)
    ├── store/                 # Zustand stores (see §5)
    ├── i18n/                  # translation provider (see §6)
    └── ui/                    # design-system components (see §7)
```

---

## 3. `apps/mobile` — Expo App Skeleton

```
apps/mobile/
├── package.json               # name: kiaanverse-mobile-app, main: expo-router/entry
├── app.config.ts              # dynamic ExpoConfig (see §3.1)
├── eas.json                   # development / preview / production profiles
├── babel.config.js            # babel-preset-expo + reanimated plugin
├── metro.config.js            # monorepo-aware Metro
├── tsconfig.json              # extends tsconfig.base.json
├── jest.config.js / jest-setup.ts
├── expo-module.config.json
├── assets/                    # icon, splash, adaptive-icon, notification-icon, favicon
├── plugins/
│   └── with-expo-modules-core-patch.js
├── scripts/
│   └── patch-expo-modules-core.js
├── eas-build-pre-install.sh
├── eas-build-post-install.sh
├── hooks/                     # useNetworkStatus, useNotifications, useSubscription,
│                              # useDivineEntrance, useGoldenPulse
├── services/
│   ├── backgroundTasks.ts     # registered at module load (expo-task-manager)
│   ├── notificationService.ts # channels, scheduling, handlers
│   └── errorTracking.ts       # Sentry init
├── utils/
│   ├── permissions.ts
│   └── errorMessages.ts
├── components/
│   ├── common/                # ErrorBoundary, OfflineBanner, Toast, NotificationToast …
│   ├── chat/                  # KIAAN Sakha chat primitives
│   ├── home/
│   ├── navigation/            # tab bar + icon set
│   ├── journey/
│   ├── journal/
│   ├── sadhana/
│   ├── community/
│   ├── emotional-reset/
│   ├── karma-reset/
│   └── vibe-player/
├── __mocks__/skia.ts
├── __tests__/                 # ErrorBoundary, Toast, errorTracking, errorMessages,
│                              # subscription, app smoke
└── app/                       # ← Expo Router file-based routes (see §3.2)
```

### 3.1 `app.config.ts` highlights

- `slug: 'kiaanverse'`, `scheme: 'kiaanverse'`, `version: 1.1.0`
- EAS Update: `https://u.expo.dev/1f72d91b-2336-4b58-a641-5589317cc36c`,
  runtime version tied to `appVersion`
- **iOS** `bundleIdentifier: com.kiaanverse.app`, supportsTablet, Info.plist
  entries for microphone / Face ID / camera, background modes `fetch` +
  `remote-notification`, associated domains for universal links
- **Android** `package: com.kiaanverse.app`, `versionCode: 18`, adaptive icon,
  permissions: `INTERNET`, `VIBRATE`, `RECORD_AUDIO`, `CAMERA`,
  `USE_BIOMETRIC`, `USE_FINGERPRINT`, `RECEIVE_BOOT_COMPLETED`,
  `POST_NOTIFICATIONS`, `com.android.vending.BILLING`; deep-link intent filter
  for the `kiaanverse://` scheme (`autoVerify: true`)
- `expo-build-properties` pins `targetSdkVersion: 35` / `compileSdkVersion: 35`,
  enables ProGuard + resource shrinking in release
- Plugins: `expo-router`, `expo-splash-screen`, `expo-notifications`,
  `expo-av`, `expo-camera`, `expo-local-authentication`, `react-native-iap`
  (Play Store), local `with-expo-modules-core-patch`
- `experiments.typedRoutes: true`
- `extra.apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:8000'`,
  `extra.sentryDsn`, `extra.eas.projectId`

### 3.2 Route Tree (`apps/mobile/app/`)

```
app/
├── _layout.tsx                # providers + splash + auth gate + Stack (see §3.3)
├── subscription.tsx           # modal paywall (slide-from-bottom)
│
├── (auth)/                    # unauthenticated group
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
│
├── (tabs)/                    # bottom-tab shell for authenticated users
│   ├── _layout.tsx
│   ├── index.tsx              # Home / dashboard
│   ├── chat.tsx               # KIAAN Sakha
│   ├── journal.tsx
│   ├── profile.tsx
│   └── shlokas/               # Bhagavad Gita
│       ├── _layout.tsx
│       ├── index.tsx          # chapter list
│       └── [chapter]/
│           ├── index.tsx      # verse list for chapter
│           └── [verse].tsx    # verse detail
│
├── (app)/                     # nested profile / account screens
│   ├── _layout.tsx
│   ├── language-settings.tsx
│   ├── notifications.tsx
│   └── subscription/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── plans.tsx
│       └── success.tsx
│
├── onboarding/
│   ├── _layout.tsx
│   ├── index.tsx
│   └── steps/
│       ├── WelcomeStep.tsx
│       ├── PurposeStep.tsx
│       ├── GitaFamiliarityStep.tsx
│       ├── DailyPracticeStep.tsx
│       └── ReadyStep.tsx
│
├── wellness/
│   ├── _layout.tsx
│   ├── mood.tsx
│   └── karma.tsx
│
├── journey/                   # 14/21-day transformation paths
│   ├── _layout.tsx
│   ├── index.tsx              # catalog
│   ├── [id].tsx               # journey detail
│   └── step/[day].tsx         # daily step
│
├── tools/                     # Sacred Tools
│   ├── index.tsx
│   ├── emotional-reset/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── [step].tsx
│   ├── karma-reset/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── phases/
│   │       ├── acknowledgment.tsx
│   │       ├── understanding.tsx
│   │       ├── release.tsx
│   │       └── renewal.tsx
│   ├── ardha/index.tsx
│   ├── viyoga/index.tsx
│   └── relationship-compass/index.tsx
│
├── journal/
│   ├── _layout.tsx
│   ├── new.tsx                # encrypt client-side, enqueue to sync queue
│   └── [id].tsx
│
├── sadhana/
│   ├── _layout.tsx
│   ├── index.tsx              # today's practice
│   └── history.tsx
│
├── community/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── compose.tsx
│   └── circles/[id].tsx
│
├── wisdom-rooms/
│   ├── index.tsx
│   └── [id].tsx
│
├── karma-footprint/index.tsx
│
├── analytics/
│   ├── index.tsx
│   └── deep-insights.tsx
│
├── vibe-player/
│   ├── index.tsx
│   └── player.tsx             # full-screen modal player
│
└── settings/
    ├── index.tsx
    └── privacy.tsx
```

### 3.3 Root `_layout.tsx` — Provider Hierarchy

Outer → inner:

```
GestureHandlerRootView
└── PersistQueryClientProvider   (TanStack Query + AsyncStorage persister, gcTime 24h)
    └── ThemeProvider             (dark/light, @kiaanverse/ui tokens)
        └── I18nProvider          (17 locales; 17 namespaces pre-loaded)
            └── ErrorBoundary
                └── AppContent
                    ├── SplashScreen gate (hard 8-second fail-open)
                    ├── StatusBar
                    ├── OfflineBanner + NotificationToast + ToastContainer
                    └── AuthGate
                        └── Stack (expo-router)
```

**AuthGate logic**

| auth state | onboarded | behavior |
|---|---|---|
| `idle` / `loading` | — | hold splash, then `<LoadingMandala/>` |
| `unauthenticated` | — | redirect → `/(auth)/login` |
| `authenticated` | `false` | redirect → `/onboarding` |
| `authenticated` | `true`  | redirect → `/(tabs)` |

Navigation animation: `fade` (320 ms) for darshan screens; `slide_from_bottom`
(350 ms) for `subscription` and `vibe-player` modals.

### 3.4 Offline & Sync Skeleton

- `useNetworkStatus()` (NetInfo) drives `OfflineBanner`.
- `useSyncQueueStore` buffers mutations when offline; `startSyncOnForeground()`
  listens for `AppState → active` and the executor `executeSyncItem(item)`
  dispatches by `item.type`:
  - `mood` → `api.moods.create`
  - `journey_step` → `api.journeys.completeStep`
  - `chat_message` → `api.chat.send`
  - `journal` → `api.journal.create`
  - `sadhana` → `api.sadhana.complete`
  - `community_post` → `api.community.createPost`
  - `community_reaction` → `api.community.reactToPost`
- On reconnect: drain queue, then `queryClient.invalidateQueries()`.

### 3.5 IAP Lifecycle

- Connect `react-native-iap` only when `status === 'authenticated'`; bind
  purchases to `user.id` via `setIapAccountTag(user.id)` so replayed Play
  receipts cannot cross accounts.
- Disconnect on logout to release the native connection.

---

## 4. `@kiaanverse/api`

```
packages/api/src/
├── index.ts
├── config.ts              # EXPO_PUBLIC_API_BASE_URL resolution
├── client.ts              # axios instance: auth, refresh, retry, logging
├── endpoints.ts           # typed endpoint surface (auth, moods, journeys,
│                          #   chat, journal, sadhana, community, wisdom, gita,
│                          #   analytics) + journal packer/unpacker
├── errors.ts              # ApiError hierarchy
├── types.ts               # DTOs mirrored from backend Pydantic
├── hooks.ts               # React-Query hooks
├── queryClient.ts
├── auth/authService.ts    # login / register / refresh / logout
├── cache/gitaCache.ts     # offline verse corpus
├── subscription/
│   ├── index.ts
│   ├── iapService.ts      # initializeIAP, disconnectIAP, setIapAccountTag
│   └── constants.ts
└── __tests__/…
```

---

## 5. `@kiaanverse/store` (Zustand)

All stores use `immer` + `devtools`; persisted stores choose `SecureStore`
(secrets) or `AsyncStorage` (non-secret) via `persistence.ts` adapters.

| Store | Purpose |
|---|---|
| `authStore` | login state, JWT, biometric, `hasHydrated` |
| `themeStore` | mode (`system`/`light`/`dark`) |
| `userPreferencesStore` | locale, voice gender, units |
| `onboardingStore` | answers from 5-step onboarding |
| `sadhanaStore` | daily practice phase + completions |
| `gitaStore` | chapter / verse selection, bookmarks |
| `journeyStore` | progress across 14/21-day journeys |
| `moodStore` + `wellnessStore` | emotions, streak, karma |
| `chatStore` | KIAAN Sakha conversation |
| `journalStore` | encrypted entries metadata |
| `communityStore` | circles, posts, reactions |
| `vibePlayerStore` | track queue, repeat mode |
| `deepInsightsStore` | analytics date range + cached insights |
| `emotionalResetStore` | 7-step healing flow |
| `karmaResetStore` | 4-phase sacred ritual |
| `relationshipStore` | compass sessions |
| `subscriptionStore` | 4-tier (free / bhakta / sadhak / siddha), purchases |
| `uiStore` | modals, toasts, first-launch flag |
| `syncQueue` | mutation queue + `startSyncOnForeground()` |

---

## 6. `@kiaanverse/i18n`

```
packages/i18n/src/
├── I18nProvider.tsx     # namespace + locale provider
├── useTranslation.ts    # t(key, vars)
├── loadMessages.ts      # async import of locale bundles
├── locales.ts           # 17-locale manifest
├── types.ts
└── index.ts
```

Namespaces loaded at root: `common`, `navigation`, `errors`, `auth`, `home`,
`kiaan`, `journeys`, `tools`, `emotional-reset`, `karma-reset`, `journal`,
`sadhana`, `community`, `vibe-player`, `analytics`, `settings`.

---

## 7. `@kiaanverse/ui` — Design System

```
packages/ui/src/
├── index.ts
├── tokens/        colors, typography, spacing, radii, shadows, motion,
│                  gradients, sacred
├── theme/         ThemeProvider, dark/light resolution
├── motion/        useGoldenPulse, useDivineEntrance, useSacredPress,
│                  SacredScrollView, tokens
├── hooks/         useSpeechOutput, useAudioPlayer, useVoiceRecorder
├── background/    DivineBackground (Skia) + sacred tokens
└── components/    ≈ 40 primitives:
                   Screen, Card, SacredCard, GlowCard, Button, DivineButton,
                   GoldenButton, IconButton, Input, SacredInput, Avatar,
                   SakhaAvatar, SakhaMandala, Badge, SacredBadge, SacredChip,
                   Divider, GoldenDivider, SacredDivider,
                   LoadingMandala, OmLoader, MandalaSpin,
                   LotusProgress, GoldenProgressBar, SacredProgressRing,
                   SacredStepIndicator, SacredBottomSheet, SacredTransition,
                   BreathingOrb, EmotionOrb, MoodRing,
                   ChatBubble, ShlokaCard, KarmaTree,
                   DivineBackground, DivineGradient, DivinePresenceIndicator,
                   GoldenHeader, CompletionCelebration, ConfettiCannon
```

---

## 8. Build & Release Pipeline (`eas.json`)

| Profile | Distribution | API base URL | Notes |
|---|---|---|---|
| `development` | internal / dev-client | `http://localhost:8000` | iOS simulator on |
| `preview` | internal, channel `staging` | `https://mindvibe-api.onrender.com` | Android `.apk` |
| `production` | channel `production`, `autoIncrement` | `https://mindvibe-api.onrender.com` | App/Play submissions |

Submit config: iOS via `APPLE_ID` / `ASC_APP_ID` / `APPLE_TEAM_ID`; Android
track `internal`, release status `draft`.

Root scripts (`kiaanverse-mobile/package.json`):

```
pnpm dev         # expo start (filter kiaanverse-mobile-app)
pnpm android     # expo start --android
pnpm ios         # expo start --ios
pnpm typecheck   # tsc --noEmit across all packages
pnpm lint        # eslint across all packages
pnpm test        # jest across all packages
```

---

## 9. Security & Privacy Skeleton

- Secrets live in `.env.local` / EAS env; never committed (`SECRETS.md`).
- JWT stored in `expo-secure-store`; refresh rotation in axios interceptor.
- Biometric gate via `expo-local-authentication` (Face ID / fingerprint).
- Journal entries AES-GCM encrypted client-side (`encryptContent` in
  `journal/new.tsx`); wire payload uses `algorithm:
  'AES-GCM-v1-iv-prefixed'`, `ciphertext` carries `iv || ciphertext`
  concatenated — unpacked in `api/endpoints.ts` before hitting the backend's
  `EncryptedPayload` Pydantic schema.
- `usesCleartextTraffic` disabled in production builds.
- Sentry DSN is build-time injected; PII scrubbed before capture.

---

## 10. Status Snapshot

- **Scaffolded & wired:** workspace, providers, routing, 15+ route groups,
  all Zustand stores, API client, UI design system, IAP, notifications,
  background tasks, sync queue, error tracking, EAS profiles.
- **Ready to flesh out per-feature:** individual screen UIs inside each
  route file, end-to-end flows for Sacred Tools, analytics dashboards,
  community moderation, push-notification copy.
- **Not in scope here:** native Android Compose app (separate project at
  `mobile/android/`, documented in `mobile/android/README.md`).
