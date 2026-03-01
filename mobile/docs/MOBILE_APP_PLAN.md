# MindVibe Mobile App — Comprehensive Plan

## Document Version: 1.0 | Date: 2026-03-01

---

## 1. Target Platform & Tech Stack

### Platform: iOS + Android (Dual-Native via React Native)

### Primary Framework: React Native 0.76+ with New Architecture

**Justification:**

| Criterion | React Native | Native (Kotlin/Swift) | Flutter |
|-----------|-------------|----------------------|---------|
| **Codebase reuse** | ~85% shared TS/React code with existing web app | 0% — two separate codebases | 0% — Dart rewrite required |
| **KIAAN ecosystem** | Direct import of existing TS types, hooks, services | Requires full reimplementation | Requires full reimplementation |
| **Team velocity** | Single team ships both platforms | Requires iOS + Android specialists | Learning curve for existing team |
| **Native performance** | New Architecture (JSI/Fabric) + native modules for audio | Best possible | Near-native via Skia |
| **Voice/Audio** | Native modules wrap existing Kotlin/Swift voice managers | Direct access | Platform channels required |
| **Offline storage** | WatermelonDB / MMKV (fast native-backed) | Room / Core Data | Hive / Isar |
| **Existing infra** | `native/shared/` already has RN-compatible TS interfaces | `mobile/android/` scaffold exists | Nothing exists |

**Decision: React Native with Native Modules**

This hybrid approach:
- Reuses the existing TypeScript ecosystem (types, hooks, services, design tokens)
- Wraps the already-built Kotlin `KiaanVoiceManager` and Swift `KiaanVoiceManager` as native modules
- Shares 85%+ code between iOS and Android
- Delivers native performance for audio/voice via JSI bridge
- Preserves the **entire KIAAN AI Ecosystem without mutation**

### Supporting Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React Native 0.76+ (New Architecture) | Cross-platform UI |
| **Navigation** | React Navigation 7 | Tab + stack + modal navigation |
| **State** | Zustand 5 (matches web) | Lightweight global state |
| **Async State** | TanStack Query 5 | Server state, caching, offline |
| **Audio** | react-native-track-player 4 | Background audio, lock screen controls |
| **Offline DB** | WatermelonDB | SQLite-backed reactive database |
| **Secure Storage** | react-native-keychain | Keystore/Keychain encryption |
| **Animations** | Reanimated 3 + Moti | 60fps gesture-driven animations |
| **Gestures** | React Native Gesture Handler 2 | Native gesture recognition |
| **i18n** | react-native-intl (shared locales) | 17-language support |
| **Push** | Firebase Cloud Messaging | Cross-platform push notifications |
| **Feature Flags** | Custom (see section 6) | Controlled feature rollout |
| **Testing** | Jest + React Native Testing Library + Detox | Unit, component, E2E |
| **CI/CD** | Fastlane + GitHub Actions | Automated builds and deploys |

---

## 2. Key Features & User Flows

### 2.1 KIAAN Vibe Player (Core Missing Tool)

The Vibe Player is the persistent audio experience layer — always accessible, never intrusive.

**Features:**
- Background audio playback with lock-screen controls
- Playlist management (Gita verses, guided meditations, KIAAN voice insights)
- Offline caching with configurable storage limits (100MB default)
- Gesture controls: swipe-up to expand, swipe-down to minimize, long-press for queue
- Waveform visualization synced to audio
- Sleep timer with gentle fade-out
- Playback speed control (0.5x – 2.0x)
- Cross-fade between tracks
- Accessibility: VoiceOver/TalkBack labels, reduced-motion support

**User Flow:**
```
Home → Tap "Daily Verse" card
  → Mini Player appears at bottom (above nav)
  → Plays Sanskrit recitation + translation
  → User swipes up → Full Player expands
    → Waveform + verse text + translation scroll
    → Queue sidebar (swipe right)
    → Speed / timer / repeat controls
  → User navigates away → Mini Player persists
  → Lock screen shows controls + verse title
  → Offline: cached tracks play seamlessly
```

### 2.2 Sakha Spiritual Companion (Distinguishing Feature)

Sakha ("Divine Friend") is the heart of MindVibe's mobile experience — a proactive, emotion-aware spiritual companion.

**Onboarding Flow:**
```
Install → Welcome screen (warm golden animation)
  → "I'm Sakha, your spiritual companion"
  → Emotion check: "How are you feeling right now?"
    → User taps emotion (wheel UI with haptics)
  → Sakha responds with personalized Gita wisdom
  → "What matters most to you?" (select 3 intentions)
    → Inner peace / Relationships / Purpose / Strength / ...
  → Privacy controls explained (toggle: local-only vs cloud sync)
  → "Your journey begins. I'm always here."
  → Home screen with personalized layout
```

**Discovery Flow:**
```
Home → Sakha greeting card (time-aware: "Good morning, seeker")
  → Daily insight based on mood + journey progress
  → Tap → Sakha conversation opens
    → Voice or text input
    → KIAAN processes with Gita wisdom engine
    → Response includes verse reference + practical guidance
    → User can "save to journal" or "play as audio"
```

**Personalized Insights:**
- Mood-correlated verse recommendations
- Journey progress nudges ("You're 3 days into conquering Krodha")
- Time-of-day appropriate wisdom (dawn mantras, evening reflections)
- Pattern detection ("I notice you often feel anxious on Mondays")

**Privacy Controls:**
- Toggle: "Keep conversations on-device only"
- Toggle: "Share anonymized patterns for better insights"
- Data export (JSON/PDF) at any time
- Full account deletion with confirmation
- Biometric lock for Sakha conversations

### 2.3 Additional Must-Have Features

**Authentication:**
- Biometric (Face ID / fingerprint) as primary
- Email + password fallback
- JWT with secure refresh token rotation
- Session management (view active sessions, remote logout)

**Push Notifications:**
- Daily wisdom reminder (configurable time)
- Journey step reminders
- Mood check-in prompts (2x daily, configurable)
- Community wisdom room alerts
- Silent push for background data sync

**Offline Mode:**
- Full Gita verse database cached locally (WatermelonDB)
- Journal entries saved offline, synced when connected
- Vibe Player cached tracks (configurable storage limit)
- Mood tracking works fully offline
- Sakha basic responses via on-device model (distilled)
- Sync indicator in nav bar

**Theming:**
- Golden Black (default dark) — divine void + gold accents
- Warm Light — cream + sunrise tones
- System-follows (auto dark/light)
- Emotion-adaptive subtle tinting (anxious → calming blue overlay)

**Accessibility (WCAG 2.1 AA):**
- Dynamic type support (respects system font size)
- VoiceOver / TalkBack full screen reader support
- Minimum 4.5:1 contrast ratios
- Haptic feedback for all interactions
- Reduced motion mode
- Screen reader announcements for state changes
- Focus management in modals and sheets

---

## 3. UI/UX Design Principles & Layout

### 3.1 Navigation Structure

```
┌─────────────────────────────────────────┐
│            Status Bar (safe area)        │
├─────────────────────────────────────────┤
│                                         │
│           Screen Content                │
│         (stack navigator per tab)       │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │   Mini Vibe Player (floating)   │    │ ← Persistent when audio playing
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  🏠 Home  🧘 Journeys  🎵 Vibe  💬 Sakha  👤 You  │ ← Bottom tabs
└─────────────────────────────────────────┘
```

**Tab Structure:**

| Tab | Icon | Primary Screen | Stack Screens |
|-----|------|---------------|---------------|
| **Home** | 🏠 | Dashboard | Verse detail, Mood log, Insights |
| **Journeys** | 🧘 | Journey catalog | Journey detail, Day step, Completion |
| **Vibe** | 🎵 | Vibe Player (full) | Playlist, Queue, Downloads |
| **Sakha** | 💬 | Companion chat | Voice mode, History, Insights |
| **You** | 👤 | Profile | Journal, Analytics, Settings, Privacy |

### 3.2 Primary Screens

**Home Dashboard:**
```
┌────────────────────────────┐
│  Good morning, [Name] 🙏    │  ← Time-aware greeting
├────────────────────────────┤
│  ┌──────────────────────┐  │
│  │ 🌅 Today's Verse      │  │  ← Daily Gita verse card
│  │ BG 2.47 — Karma Yoga │  │
│  │ ▶ Listen  📖 Read     │  │
│  └──────────────────────┘  │
│                            │
│  How are you feeling? 😌    │  ← Quick mood entry
│  [😊] [😰] [😢] [😤] [🙏]   │
│                            │
│  ┌──────────────────────┐  │
│  │ Journey Progress      │  │  ← Active journey card
│  │ ████████░░ 57% Day 8  │  │
│  │ Conquering Krodha     │  │
│  └──────────────────────┘  │
│                            │
│  Sakha's Insight 💡         │  ← Personalized AI nudge
│  "Your evening reflections  │
│   show growing equanimity"  │
└────────────────────────────┘
```

**Vibe Player (Full Screen):**
```
┌────────────────────────────┐
│  ← Queue          ⋮ More   │
├────────────────────────────┤
│                            │
│      ┌──────────────┐     │
│      │              │     │
│      │   Album Art  │     │  ← Verse visual or journey art
│      │   / Mandala  │     │
│      │              │     │
│      └──────────────┘     │
│                            │
│  ════════════════════════  │  ← Waveform visualization
│                            │
│  Bhagavad Gita 2.47        │  ← Track title
│  Karma Yoga — Sanskrit     │  ← Subtitle
│                            │
│  1:23 ━━━━━━━●━━━━ 3:45   │  ← Progress scrubber
│                            │
│     ⏪    ▶    ⏩           │  ← Playback controls
│                            │
│  🔀  🔁  ⏱ Sleep  1.0x     │  ← Shuffle, repeat, timer, speed
│                            │
│  ─── Verse Text ───        │
│  कर्मण्येवाधिकारस्ते       │  ← Sanskrit text
│  "You have the right to    │  ← Translation (scrollable)
│   work, but never to its   │
│   fruits."                 │
└────────────────────────────┘
```

### 3.3 Visual Language

**Color Palette (from existing design tokens):**

| Token | Value | Usage |
|-------|-------|-------|
| `divine.void` | `#0a0a12` | Primary background (dark) |
| `divine.surface` | `#0f0f18` | Card backgrounds |
| `gold.500` | `#d4a44c` | Primary accent, CTA |
| `gold.400` | `#e8b54a` | Highlights, active states |
| `gold.100` | `#f5e6c8` | Text on dark backgrounds |
| `divine.cream` | `#f5f0e8` | Light mode background |
| `mv.ocean` | `#17b1a7` | Inner peace mode |
| `mv.aurora` | `#ff8fb4` | Self-kindness mode |
| `modes.mindControl` | `#1e3a8a` | Focus mode |

**Typography (React Native):**

| Style | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `h1` | System (SF Pro / Roboto) | 28sp | Bold | Screen titles |
| `h2` | System | 22sp | SemiBold | Section headers |
| `h3` | System | 18sp | SemiBold | Card titles |
| `body` | System | 16sp | Regular | Body text |
| `caption` | System | 13sp | Regular | Secondary text |
| `sacred` | Crimson Text | 20sp | Regular | Gita verses (Sanskrit) |
| `label` | System | 14sp | Medium | Buttons, labels |

**Iconography:**
- Lucide icons (consistent with web app)
- Custom sacred icons for spiritual features (lotus, om, chakra)
- Filled style for active tab, outline for inactive
- 24×24dp touch target minimum

**Motion Guidelines:**
- Spring animations for sheet transitions: `damping: 20, stiffness: 200`
- 250ms for micro-interactions (button press, toggle)
- 350ms for screen transitions (shared element where possible)
- Respect `prefers-reduced-motion` — disable springs, use simple fades
- Haptic feedback: light for taps, medium for confirmations, heavy for destructive actions

### 3.4 Accessibility Targets (WCAG 2.1 AA)

| Criterion | Target | Implementation |
|-----------|--------|----------------|
| Text contrast | 4.5:1 minimum | Gold on void = 7.2:1 ✓ |
| Touch targets | 44×44pt minimum | All interactive elements |
| Focus indicators | Visible on all elements | 2dp gold border ring |
| Screen reader | 100% coverage | `accessibilityLabel` on all elements |
| Dynamic type | Supports 200% scaling | `allowFontScaling` + layout flex |
| Motion | Respects system setting | `useReducedMotion()` hook |
| Announcements | State changes announced | `AccessibilityInfo.announceForAccessibility` |

---

## 4. Architecture & Components

### 4.1 High-Level Component Map

```
App
├── NavigationContainer
│   ├── AuthStack (unauthenticated)
│   │   ├── WelcomeScreen
│   │   ├── LoginScreen
│   │   ├── SignupScreen
│   │   └── OnboardingFlow
│   │       ├── EmotionCheckScreen
│   │       ├── IntentionPickerScreen
│   │       └── PrivacySetupScreen
│   │
│   └── MainTabs (authenticated)
│       ├── HomeStack
│       │   ├── HomeScreen (Dashboard)
│       │   ├── VerseDetailScreen
│       │   ├── MoodLogScreen
│       │   └── InsightsScreen
│       │
│       ├── JourneyStack
│       │   ├── JourneyCatalogScreen
│       │   ├── JourneyDetailScreen
│       │   ├── JourneyDayScreen
│       │   └── JourneyCompletionScreen
│       │
│       ├── VibeStack
│       │   ├── VibePlayerScreen (full player)
│       │   ├── PlaylistScreen
│       │   ├── QueueScreen
│       │   └── DownloadsScreen
│       │
│       ├── SakhaStack
│       │   ├── SakhaCompanionScreen (chat)
│       │   ├── SakhaVoiceScreen
│       │   ├── SakhaHistoryScreen
│       │   └── SakhaInsightsScreen
│       │
│       └── ProfileStack
│           ├── ProfileScreen
│           ├── JournalScreen
│           ├── AnalyticsScreen
│           ├── SettingsScreen
│           └── PrivacyScreen
│
├── GlobalProviders
│   ├── AuthProvider (JWT + biometric)
│   ├── ThemeProvider (dark/light/emotion)
│   ├── VibePlayerProvider (audio state)
│   ├── SakhaProvider (companion context)
│   ├── OfflineProvider (sync state)
│   ├── NotificationProvider (push + local)
│   └── FeatureFlagProvider (rollout gates)
│
└── Persistent Overlays
    ├── MiniVibePlayer (floating above tabs)
    ├── OfflineIndicator (top banner)
    └── SakhaQuickAction (floating action button)
```

### 4.2 Reusable Components

```
components/
├── common/
│   ├── Button.tsx            — Primary, secondary, ghost variants
│   ├── Card.tsx              — Glassmorphic card with glow
│   ├── Text.tsx              — Typography system wrapper
│   ├── Icon.tsx              — Lucide icon wrapper
│   ├── Avatar.tsx            — User avatar with fallback
│   ├── Badge.tsx             — Status badge (gold, ocean, aurora)
│   ├── ProgressBar.tsx       — Animated progress with gold gradient
│   ├── Skeleton.tsx          — Loading skeleton with shimmer
│   ├── Toast.tsx             — Notification toast
│   ├── BottomSheet.tsx       — Reanimated bottom sheet
│   ├── EmotionWheel.tsx      — Circular emotion selector
│   └── SafeAreaView.tsx      — Safe area wrapper
│
├── vibe-player/
│   ├── MiniPlayer.tsx        — Collapsed persistent player
│   ├── FullPlayer.tsx        — Expanded player with controls
│   ├── Waveform.tsx          — Audio waveform visualization
│   ├── QueueList.tsx         — Draggable queue
│   ├── PlaybackControls.tsx  — Play/pause/skip/scrub
│   ├── SleepTimer.tsx        — Sleep timer picker
│   ├── SpeedControl.tsx      — Playback speed selector
│   └── TrackInfo.tsx         — Title, subtitle, verse text
│
├── sakha-companion/
│   ├── ChatBubble.tsx        — Message bubble (user/sakha)
│   ├── VoiceOrb.tsx          — Animated voice indicator
│   ├── InsightCard.tsx       — AI insight display card
│   ├── EmotionResponse.tsx   — Emotion-aware response
│   ├── VerseReference.tsx    — Inline Gita verse reference
│   ├── PrivacyToggle.tsx     — On-device/cloud toggle
│   └── GreetingCard.tsx      — Time-aware greeting
│
└── navigation/
    ├── BottomTabBar.tsx       — Custom tab bar with glow
    ├── StackHeader.tsx        — Custom stack header
    └── TabIcon.tsx            — Animated tab icon
```

### 4.3 State Management

```
state/
├── stores/
│   ├── authStore.ts          — Auth state (Zustand)
│   │   └── { user, token, isAuthenticated, login, logout, refresh }
│   │
│   ├── vibePlayerStore.ts    — Audio player state (Zustand)
│   │   └── { currentTrack, queue, isPlaying, progress, volume,
│   │          repeatMode, speed, sleepTimer, addToQueue, skip, seek }
│   │
│   ├── sakhaStore.ts         — Companion state (Zustand)
│   │   └── { messages, isListening, mood, dailyInsight,
│   │          sendMessage, startVoice, stopVoice }
│   │
│   ├── offlineStore.ts       — Offline/sync state (Zustand)
│   │   └── { isOnline, pendingSync, lastSynced, syncNow }
│   │
│   ├── themeStore.ts         — Theme state (Zustand)
│   │   └── { mode, emotionTint, setMode, setEmotionTint }
│   │
│   └── featureFlagStore.ts   — Feature flag state (Zustand)
│       └── { flags, isEnabled, refresh }
│
└── queries/
    ├── useVerses.ts          — TanStack Query for Gita verses
    ├── useJourneys.ts        — TanStack Query for journeys
    ├── useMoods.ts           — TanStack Query for mood data
    ├── useProfile.ts         — TanStack Query for user profile
    └── useAnalytics.ts       — TanStack Query for analytics
```

### 4.4 Data Flow

```
User Action
    │
    ▼
React Component (UI event)
    │
    ├─ Local state? ──→ Zustand store ──→ Re-render
    │
    ├─ Server data? ──→ TanStack Query
    │                      │
    │                      ├─ Cache hit? ──→ Return cached
    │                      │
    │                      └─ Cache miss? ──→ API call
    │                                           │
    │                                           ├─ Online? ──→ Backend API ──→ Update cache ──→ Re-render
    │                                           │
    │                                           └─ Offline? ──→ WatermelonDB ──→ Queue sync ──→ Re-render
    │
    └─ Audio action? ──→ react-native-track-player (native)
                            │
                            └─ Lock screen + notification controls updated
```

### 4.5 Offline Strategy

| Data | Offline Storage | Sync Strategy |
|------|----------------|---------------|
| Gita verses (700) | WatermelonDB (pre-seeded) | Full sync on first load, delta updates |
| Journal entries | WatermelonDB (encrypted) | Queue-and-sync when online |
| Mood entries | WatermelonDB | Queue-and-sync when online |
| Audio tracks | File system (cached) | LRU eviction, configurable limit |
| Journey progress | WatermelonDB | Optimistic update, sync on reconnect |
| Sakha conversations | WatermelonDB (encrypted) | Optional cloud sync (user toggle) |
| User preferences | MMKV (fast key-value) | Sync on app foreground |
| Feature flags | MMKV | Refresh every 15 minutes |

### 4.6 API/SDK Integration Points

| Integration | SDK/Method | Notes |
|------------|-----------|-------|
| Backend API | Axios + TanStack Query | JWT auth, retry with backoff |
| KIAAN Voice (Android) | Native Module wrapping `KiaanVoiceManager.kt` | Existing code, no mutation |
| KIAAN Voice (iOS) | Native Module wrapping `KiaanVoiceManager.swift` | Existing code, no mutation |
| Audio Playback | react-native-track-player | Lock screen, background |
| Push Notifications | @react-native-firebase/messaging | FCM for both platforms |
| Biometric Auth | react-native-keychain | Face ID / fingerprint |
| Offline DB | @nozbe/watermelondb | SQLite-backed, reactive |
| Secure Storage | react-native-keychain | Keystore / Keychain |
| Analytics | Custom (reuse analyticsService.ts) | Privacy-first |

---

## 5. MVP Plan & Phased Roadmap

### Phase 1: MVP (Weeks 1–8)

**Scope:**
- Authentication (email + biometric)
- Home dashboard with daily verse + mood entry
- KIAAN Vibe Player (full + mini, offline cache)
- Sakha Companion (text chat, basic voice)
- Gita verse browser (all 700 verses, offline)
- Basic journey progress view
- Push notifications (daily reminder)
- Golden Black theme
- English + Hindi languages

**Success Criteria:**
- App launches in < 2s cold start
- Audio playback works in background + lock screen
- Offline mode: verses, mood, journal work without network
- Sakha responds with contextual Gita wisdom in < 3s
- 90% crash-free sessions
- WCAG 2.1 AA accessibility audit pass

**Deliverables:**
- TestFlight (iOS) + Internal Testing (Android) builds
- Core component library
- API integration layer
- Offline sync engine

### Phase 2: Companion Intelligence (Weeks 9–14)

**Additions:**
- Full Sakha onboarding flow (emotion check, intentions, privacy)
- Voice companion mode (wake word: "Hey KIAAN")
- Emotion-aware theming
- Journey system (start, track, complete)
- Journal with encryption
- Mood analytics dashboard
- Sleep timer + playback speed
- 5 additional languages (Tamil, Telugu, Bengali, Marathi, Gujarati)

**Success Criteria:**
- Voice recognition accuracy > 95% on-device
- Journey completion rate > 40%
- Daily active retention (Day 7) > 30%

### Phase 3: Social & Scale (Weeks 15–20)

**Additions:**
- Wisdom Rooms (group discussions)
- Community features
- Subscription management (Stripe + Razorpay)
- All 17 languages
- Widgets (iOS + Android)
- Apple Watch / Wear OS companion (mood + breathing)
- Performance optimization (< 1s cold start)
- App Store submission

**Success Criteria:**
- App Store approval on first submission
- < 50MB initial download size
- 4.5+ star rating target

---

## 6. Deliverables

### 6.1 Information Architecture

```
MindVibe Mobile
│
├── Unauthenticated
│   ├── Welcome / Splash
│   ├── Login
│   ├── Sign Up
│   └── Onboarding
│       ├── Emotion Check
│       ├── Intention Picker
│       └── Privacy Setup
│
├── Authenticated (Tab Navigation)
│   ├── Home
│   │   ├── Daily Verse Card
│   │   ├── Mood Quick Entry
│   │   ├── Journey Progress
│   │   └── Sakha Insight
│   │
│   ├── Journeys
│   │   ├── Catalog (browse/search)
│   │   ├── Journey Detail (overview, days)
│   │   ├── Day Step (content, reflection)
│   │   └── Completion (celebration)
│   │
│   ├── Vibe Player
│   │   ├── Now Playing (full view)
│   │   ├── Playlists
│   │   ├── Queue
│   │   └── Downloads
│   │
│   ├── Sakha Companion
│   │   ├── Chat (text + voice)
│   │   ├── Voice Mode (full screen orb)
│   │   ├── Conversation History
│   │   └── Insights & Patterns
│   │
│   └── Profile
│       ├── Sacred Reflections (Journal)
│       ├── Analytics Dashboard
│       ├── Settings
│       │   ├── Theme
│       │   ├── Language
│       │   ├── Notifications
│       │   ├── Audio Quality
│       │   └── Storage
│       └── Privacy
│           ├── Data Controls
│           ├── Export
│           └── Delete Account
│
└── Global Overlays
    ├── Mini Vibe Player
    ├── Offline Indicator
    └── Sakha Quick Action FAB
```

### 6.2 Design System Outline

See `mobile/react-native/src/theme/tokens.ts` for the full token system.

### 6.3 Starter Project Scaffold

See `mobile/react-native/` for the full project scaffold with:
- Folder structure matching the architecture above
- TypeScript configuration
- Package.json with all dependencies
- Theme tokens
- Sample components for Vibe Player, Sakha Companion, Feature Flags
- Navigation configuration
- State management stores
- API client setup

### 6.4 Sample Code Snippets

See the following files:
- `mobile/react-native/src/components/vibe-player/VibePlayer.tsx` — Media playback integration
- `mobile/react-native/src/components/sakha-companion/SakhaCompanion.tsx` — Companion interaction
- `mobile/react-native/src/config/featureFlags.ts` — Feature flagging system

---

## 7. Constraints & Assumptions

### Performance Targets

| Metric | Target |
|--------|--------|
| Cold start | < 2s |
| Screen transition | < 300ms |
| Audio playback start | < 500ms (cached), < 2s (network) |
| Sakha response (text) | < 3s |
| Sakha response (voice) | < 5s |
| Offline verse lookup | < 50ms |
| Memory usage | < 200MB active |
| Battery drain (background audio) | < 5%/hour |
| APK size | < 50MB |
| IPA size | < 60MB |

### Platform Requirements

| Platform | Minimum | Target |
|----------|---------|--------|
| Android | API 26 (Android 8.0) | API 34 (Android 14) |
| iOS | iOS 16.0 | iOS 17.0 |
| React Native | 0.76+ (New Architecture) | Latest stable |

### Accessibility

- WCAG 2.1 AA compliance (minimum)
- Full VoiceOver (iOS) and TalkBack (Android) support
- Dynamic Type / font scaling up to 200%
- Minimum touch target: 44×44pt
- Color contrast: 4.5:1 minimum for normal text, 3:1 for large text
- No information conveyed by color alone

### Security

- All network calls over HTTPS (TLS 1.3)
- JWT tokens stored in platform Keychain/Keystore (not AsyncStorage)
- Journal entries encrypted client-side before storage (AES-256-GCM)
- Biometric authentication for sensitive screens
- Certificate pinning for API calls
- No PII in logs or analytics
- GDPR/CCPA compliant data handling

### Assumptions

1. Backend API (FastAPI) is stable and available at documented endpoints
2. KIAAN AI ecosystem services remain unchanged (read-only integration)
3. Existing native voice managers (`KiaanVoiceManager.kt` / `.swift`) are wrapped as-is
4. Firebase project exists for push notifications
5. App Store / Play Store developer accounts are active
6. Design assets (logos, animations) from `brand/` directory are mobile-ready
7. Translation files from `locales/` can be converted to mobile format
