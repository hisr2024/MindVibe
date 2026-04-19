# 🛡️ 1:1 Parity Audit Checklist — Web (kiaanverse.com/m) ↔ Android

> **Status:** Authoritative QA guardian checklist for Kiaanverse mobile web ↔ Android parity.
> **Last updated:** 2026‑04‑19
> **Owner:** Mobile Experience Guild

---

## 0 · Purpose

Before **any** new build is merged or released, a QA engineer must walk this
checklist with the mobile web and the Android app side‑by‑side. When both
surfaces look and feel identical, users move between platforms without
friction — trust is preserved.

This document is the single source of truth for the side‑by‑side comparison.
If a box cannot be checked, open a bug and link the surface (web or Android)
plus the offending token / component / animation.

---

## 1 · Setup — side by side

Run the two surfaces literally next to each other before starting:

1. **Web surface**
   - Open Chrome → `https://kiaanverse.com/m/`
   - DevTools (⌘⌥I / Ctrl‑Shift‑I) → **Device Toolbar** → custom device set to
     **390 × 844**, DPR 3, touch emulation on.
   - Set the emulated clock to **19:00** (7 pm) via
     DevTools → **Sensors → Location / Override** so sandhya theming triggers.

2. **Android surface**
   - Boot emulator **Pixel 5, API 33, Portrait**.
   - Install the latest `app-debug.apk` from
     `kiaanverse-mobile/apps/mobile` or run `pnpm android` from
     `kiaanverse-mobile/`.
   - Set device clock to **19:00** local time.

3. **Inspection tools**
   - Web: Chrome DevTools Elements + Rendering tab (Paint Flashing, FPS
     meter).
   - Android: **Flipper Layout Inspector** + **Perfetto** (for frame
     timing) + screenshot tool.

Keep both windows visible simultaneously. **You will compare pixel‑by‑pixel.**

---

## 2 · Screen‑by‑screen checklist

Run **every** block below for **every** screen in scope:

- `/dashboard` ↔ Home tab
- `/kiaan` (chat) ↔ SAKHA tab
- `/journeys` ↔ Journeys tab
- `/journal` ↔ Journal tab
- `/settings` ↔ Settings tab
- `/onboarding/*` ↔ Onboarding flow
- `/sadhana` ↔ Sadhana tab
- Any modal / overlay on both (Tools overlay, Breathing modal, Sacred
  moments)

### 2.1 Background

- [ ] Background color: **web `#050714`** ↔ **Android `#050714`**
      *(NOT `#000000`)*
- [ ] Particle field: **108** gold / peacock particles drifting — present on
      both surfaces and moving at the same cadence
- [ ] Aurora layers: **blue**, **peacock**, **gold** visible on both
- [ ] Time‑of‑day: at 19:00 both surfaces render **sandhya** atmosphere
      (dusk gradient warms, particles lean saffron)

### 2.2 Typography

- [ ] Sanskrit text: **Noto Sans Devanagari** on both (NOT system fallback —
      verify via DevTools `Computed → font-family` on web and Flipper
      `Text → typeface` on Android)
- [ ] Sacred headers: **Cormorant Garamond Italic** on both
- [ ] Body text: **Crimson Text** on SAKHA messages — both
- [ ] UI labels: **Outfit** on both
- [ ] Font sizes: in DevTools measure each heading / body / caption, then
      compare to Flipper Layout Inspector on Android — all within **1 sp**
      tolerance

### 2.3 Colors

Sample with a color picker (Digital Color Meter on macOS, any
Chrome extension on web, Android Studio → Layout Inspector → Pixel).

- [ ] Body text: `#F0EBE1` — matches
- [ ] Gold accent: `#D4A017` — matches
- [ ] Sacred card bg: `rgba(22, 26, 66, 0.95)` — matches
- [ ] Active nav icon: `#D4A017` — matches
- [ ] Button gradient stops: `#1B4FBB → #0E7490` — matches

> ⚠️ If any hex drifts, trace back to tokens:
> **Web:** `brand/tokens/colors.json`, `styles/*.css`
> **Android / mobile:** `kiaanverse-mobile/packages/ui/src/tokens/colors.ts`
> Tokens must be the **single source** — no hardcoded hex in components.

### 2.4 Sacred components

- [ ] `SacredCard` — gold shimmer top border visible on both
- [ ] `DivineButton` — gradient background matches, press state identical
- [ ] `GoldenDivider` — same opacity and width on both
- [ ] `OmLoader` — used **instead of** a spinner on both (any default
      spinner anywhere is a bug)

### 2.5 Animations (time with a stopwatch / FPS capture)

- [ ] `VerseRevelation` — 5 words ≈ **400 ms** on web, Android matches
      **within ±50 ms**
- [ ] Screen entrance: fade + `translateY` on both *(no platform slide on
      Android)*
- [ ] `SakhaMandala` — all rings rotating on both (verify each ring
      direction and speed)
- [ ] `DivinePresenceIndicator` — **4 s** breathing cycle on both (inhale
      2 s, exhale 2 s)

### 2.6 Chat screen specifics

- [ ] User bubble gradient: **Krishna Aura** on both
- [ ] SAKHA bubble: gold left border + sacred card on both
- [ ] Typing indicator: 3 pulsing dots + OM + dharma text on both
- [ ] Input placeholder **"Ask Sakha anything…"** in italic on both

### 2.7 Navigation

- [ ] Tab bar height and position match
- [ ] Gold gradient top border on tab bar on both
- [ ] Active tab: gold icon **+** dot **ABOVE** the icon on both
- [ ] Center **KIAAN** button: elevated, breathing on both

---

## 3 · The Final Test — overlay verification

This is the pass / fail gate. Do not declare parity without it.

1. On web, navigate to `kiaanverse.com/m/dashboard` at exactly
   **390 × 844**. Take a full‑screen screenshot (DevTools →
   **Capture full‑size screenshot**).
2. On Android, open the Home screen. Take a screenshot (`Power` +
   `Volume Down`, or emulator camera button).
3. Import both PNGs into Figma (or any image editor — Photopea works).
4. Stack the Android screenshot **above** the web screenshot. Set the top
   layer opacity to **50 %**.
5. Align the two by the status‑bar baseline.

**Pass criteria**

- [ ] Structural alignment within **8 dp** tolerance for every major
      component (header, hero, cards, tab bar)
- [ ] Colors are **indistinguishable** — no perceptible hue, saturation, or
      luminance shift
- [ ] Typography baselines align within **2 px** at 390 px width

**If a visible difference exists**, identify the offending layer and
map it to the correct prompt to re‑run:

| Visible difference | Prompt to re‑run |
| --- | --- |
| Wrong background / particles / aurora | Prompt 1 — Sacred Background System |
| Typography mismatch | Prompt 2 — Typography Pipeline |
| Off‑palette colors | Prompt 3 — Color Tokens |
| Sacred component drift | Prompt 4 — Sacred Component Library |
| Animation timing / easing off | Prompt 5 — Motion Spec |
| Chat or navigation layout | Prompt 6 — Sacred Screens |
| Cross‑platform divergence **after** all above pass | Prompt 7 — **this audit**, re‑run after fixes |

---

## 4 · Perfect Android App Architecture

Visual parity is worthless if the foundation drifts. This section is the
architectural contract the Android build **must** satisfy before sign‑off.
Every control below references concrete paths in this repo so a reviewer
can verify in seconds.

### 4.1 Project shape (monorepo)

- [ ] App shell lives in `kiaanverse-mobile/apps/mobile/` — **no** domain
      logic there beyond screens and navigation
- [ ] Shared code lives in workspace packages:
      - [ ] `@kiaanverse/api` → network client, endpoints, hooks, query
            client, cache, sync queue
      - [ ] `@kiaanverse/store` → Zustand domain stores only
      - [ ] `@kiaanverse/i18n` → translations + `I18nProvider`
      - [ ] `@kiaanverse/ui` → tokens, theme, components, motion, background
- [ ] Packages are declared in `pnpm-workspace.yaml` and consumed via
      `workspace:*` — **no** relative imports across package boundaries
- [ ] `tsconfig.base.json` extended by every package; **strict mode** on
      (`strict: true`, `noUncheckedIndexedAccess: true`)
- [ ] No circular deps between packages (verify with `madge --circular`)

### 4.2 Navigation (expo-router)

- [ ] File‑based routing under `apps/mobile/app/` only; typed routes on
      (`experiments.typedRoutes: true` in `app.config.ts`)
- [ ] Route groups: `(auth)` for unauthenticated, `(tabs)` for tabbed
      shell — protected routes redirect via a single auth guard in the
      root `_layout.tsx`
- [ ] Deep links: scheme `kiaanverse://` **and** Android App Links for
      `kiaanverse.com` / `*.kiaanverse.com` (web ↔ app parity for every
      shareable URL under `/m/*`)
- [ ] Hardware back button handled everywhere it matters (modals, forms,
      nested stacks) — no accidental exits from mid‑journey flows
- [ ] Shared element / screen transitions are `fade + translateY`, never
      the platform slide (matches 2.5 above)

### 4.3 State management

- [ ] **Server state → TanStack Query only** (via
      `packages/api/src/queryClient.ts`). Never mirror server data into
      Zustand
- [ ] **Client state → Zustand** (`packages/store/src/*Store.ts`), one
      store per domain; no god store
- [ ] Persistence:
      - [ ] Non‑sensitive UI state via AsyncStorage through
            `packages/store/src/persistence.ts`
      - [ ] Query cache persisted via
            `@tanstack/query-async-storage-persister` with a version key
            so schema bumps invalidate cleanly
      - [ ] Sensitive state (tokens, encryption keys) **only** via
            `expo-secure-store` — never AsyncStorage
- [ ] Sync queue (`packages/api/src/…`/`store/syncQueue.ts`) drains on
      reconnect, idempotent, survives app kill

### 4.4 Networking & data layer

- [ ] All HTTP via the single Axios client in
      `packages/api/src/client.ts` — no ad‑hoc `fetch`
- [ ] Interceptors: auth header injection, 401 → refresh → retry once,
      5xx → exponential backoff (200 ms, 400 ms, 800 ms, cap 3)
- [ ] Endpoints strongly typed in `endpoints.ts` + `types.ts`; responses
      parsed with **zod** at the boundary
- [ ] Base URL from `expo-constants` → `extra.apiBaseUrl` → env, never a
      hardcoded string
- [ ] Offline‑first reads fall through to persisted cache; writes enqueue
      to the sync queue with optimistic updates

### 4.5 Auth & security

- [ ] Tokens in `expo-secure-store` with `keychainAccessible: WHEN_UNLOCKED`
- [ ] Biometric unlock via `expo-local-authentication` for app resume
      after N minutes (configurable; default 5)
- [ ] No secrets in `app.config.ts`, source, or logs — only
      `process.env.*` read at build time
- [ ] Android: `usesCleartextTraffic=false`, network security config
      restricts to `kiaanverse.com` + staging domains
- [ ] Certificate pinning for `api.kiaanverse.com` in release builds
- [ ] Clipboard auto‑clear after 30 s for any copied sensitive content
- [ ] Screens with journal / reflection content mark
      `FLAG_SECURE` (blocks screenshots + recent‑apps preview)

### 4.6 Observability

- [ ] Sentry wired via `@sentry/react-native`, DSN from `extra.sentryDsn`
- [ ] Global `ErrorBoundary` at the root layout; per‑screen boundaries for
      chat, journeys, journal
- [ ] Breadcrumbs for navigation, network, auth — **never** user content
- [ ] Performance monitoring on: cold start, TTI, route change, API calls
- [ ] User scope set to hashed user id; PII scrubber removes email, name,
      journal text

### 4.7 Performance budgets

| Metric | Target | Tool |
| --- | --- | --- |
| Cold start (Pixel 5) | < 2.0 s | Flipper / Perfetto |
| Warm start | < 800 ms | Perfetto |
| TTI on Home | < 1.2 s | Sentry perf |
| Route change | < 200 ms | Sentry perf |
| JS bundle (android release) | < 2.5 MB | `expo export` report |
| Janky frame ratio | < 1 % | Perfetto |
| Reanimated timeline | 60 fps on UI thread | Reanimated logger |

- [ ] **Hermes** enabled (default in Expo 51) — verify in release APK
- [ ] ProGuard + resource shrink on in release builds (set in
      `app.config.ts` via `expo-build-properties`)
- [ ] Skia / Reanimated animations run on the UI thread; no layout work
      on `useAnimatedStyle` callbacks
- [ ] `FlashList` (or `FlatList` with `getItemLayout`) for every list > 20
      rows (chat, journeys, shlokas)
- [ ] Images sized, cached, and `lazy` where off‑screen; never ship raster
      larger than needed (mipmaps for icons)

### 4.8 Background & lifecycle

- [ ] `expo-background-fetch` + `expo-task-manager` registered in
      `services/backgroundTasks.ts` only — one place to audit
- [ ] Tasks are idempotent, bounded (< 30 s), and check network +
      battery‑saver before heavy work
- [ ] Notifications: channel ids declared, icon + color set in
      `expo-notifications` plugin (icon `./assets/notification-icon.png`,
      color `#d4a44c`)
- [ ] Boot‑completed receiver rehydrates schedules
      (`RECEIVE_BOOT_COMPLETED` permission already declared)
- [ ] App state transitions handled: on background, pause audio / speech;
      on foreground, revalidate critical queries

### 4.9 Accessibility

- [ ] Every touchable has `accessibilityRole` + `accessibilityLabel`
      (English **and** localized)
- [ ] Minimum hit target **48 × 48 dp**; verify with Accessibility
      Scanner (Google Play pre‑launch report)
- [ ] Font scaling respected up to **2.0×** without clipping
- [ ] Color contrast WCAG AA on every text / background pair (including
      gold‑on‑navy — measure, don't assume)
- [ ] RTL layout flips correctly for Arabic / Urdu locales; icons mirror
      where directional
- [ ] Reduce‑motion honored — `useReducedMotion()` disables pulses /
      rotations / particle drift

### 4.10 Internationalization

- [ ] All user‑facing strings flow through `@kiaanverse/i18n`; zero
      hardcoded copy in components
- [ ] Devanagari, Tamil, Telugu, Bengali, Gurmukhi fonts bundled and
      selected per locale in `@kiaanverse/ui/theme`
- [ ] Numbers, dates, relative time via `Intl` (polyfilled for older
      Android WebViews)
- [ ] Language switch is hot — no reload required

### 4.11 Design system (single source of truth)

- [ ] Tokens live in `@kiaanverse/ui/tokens/*` — components consume only
      tokens, never hex
- [ ] Android tokens and web tokens (`brand/tokens/*.json`) are
      generated from or validated against the **same** source; CI fails
      the build if they drift (see 4.15)
- [ ] Motion tokens (`tokens/motion.ts`) align to the web motion spec
      (`docs/motion-spec.mdx`)
- [ ] Theme switching (sandhya, night, dawn) runs through
      `ThemeProvider` — no conditional hex in components

### 4.12 Offline‑first & resilience

- [ ] App boots and renders Home + last journey fully offline
- [ ] Writes (journal entry, step complete, mood check‑in) queue and
      show an "in flight" indicator; they reconcile on reconnect
- [ ] No write is ever lost on app kill — queue is persisted before UI
      confirmation
- [ ] Network banner appears **only** after 2 s offline to avoid noise

### 4.13 Testing pyramid

- [ ] **Unit** (Jest + jest‑expo): stores, utils, zod schemas — run in
      `apps/mobile` and every package. Target ≥ 80 %
- [ ] **Component** (@testing-library/react-native): every sacred
      component in `packages/ui/src/components/**`
- [ ] **Contract**: API response schemas validated against a recorded
      backend fixture; CI fails on drift
- [ ] **E2E** (Maestro flows in `kiaanverse-mobile/maestro/`): cold
      start, auth, start a journey, complete a step, chat round‑trip,
      offline → reconnect
- [ ] Pre‑launch report (Play Console) green on a matrix of Pixel 4a,
      Pixel 7, Samsung A14, low‑end 2 GB device, foldable

### 4.14 Build, release, OTA

- [ ] EAS profiles (`eas.json`): `development`, `preview`, `production`
      — each with its own API base URL and Sentry environment
- [ ] Android release: AAB only (not APK); `targetSdkVersion: 35`,
      `compileSdkVersion: 35` (already set)
- [ ] Signing via EAS‑managed keystore; keystore fingerprint recorded
      for Play App Signing
- [ ] **Proguard** + **R8 resource shrink** enabled for release (already
      set in `expo-build-properties`)
- [ ] `expo-updates` OTA: `runtimeVersion.policy: appVersion`, channel
      per EAS profile, rollback verified in staging before prod
- [ ] Version bumps: `version` in `app.config.ts`, `versionCode` auto
      via EAS; tag the release in git

### 4.15 CI / CD gates

A PR cannot merge unless **all** of the following pass:

- [ ] `pnpm -w typecheck` (mobile + every package)
- [ ] `pnpm -w lint`
- [ ] `pnpm -w test` with coverage ≥ 80 %
- [ ] `pnpm -w format:check`
- [ ] Token drift check — web `brand/tokens/*.json` vs
      `packages/ui/src/tokens/*` diffs to zero on the values listed in §2.3
- [ ] Bundle size check — `expo export` size does not regress > 5 %
- [ ] Maestro smoke flow on an emulator in CI
- [ ] EAS `preview` build succeeds on the PR branch

### 4.16 Privacy & compliance

- [ ] No PII in logs (Sentry breadcrumb filter proven by a test)
- [ ] Journal / reflection content encrypted at rest on device
      (`expo-crypto` + key in secure store)
- [ ] Data deletion path: a user can wipe local data and request server
      deletion from Settings
- [ ] Play Data Safety form matches reality — audit before every release
- [ ] GDPR / DPDP consent captured at onboarding; language, analytics
      opt‑in / opt‑out persisted

### 4.17 Device & OS matrix (smoke before release)

- [ ] Android 10, 12, 14, 15 (latest target)
- [ ] 2 GB RAM low‑end device (Moto E / Nokia C series)
- [ ] Foldable (Galaxy Z Fold) — layout adapts, no wasted panel
- [ ] Tablet (Pixel Tablet) — responsive, not letterboxed
- [ ] Battery saver on — no animation jank, background work throttled
- [ ] Data saver on — app still works, heavy assets deferred

### 4.18 Architecture fitness functions

Automate these so drift is caught by CI, not by a human at 2 am:

- [ ] Import boundary linter (e.g., `eslint-plugin-boundaries`) forbids
      cross‑package reach‑in
- [ ] "No hex literals in components" rule — only `theme.*` tokens
- [ ] "No `fetch` outside `@kiaanverse/api`" rule
- [ ] "No AsyncStorage for secrets" rule
- [ ] Dependency cruiser enforces layering:
      `app → ui + api + store + i18n`, `ui ↛ api`, `store ↛ ui`

---

## 5 · Sign‑off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| QA Engineer |  |  |  |
| Mobile Lead (Web) |  |  |  |
| Mobile Lead (Android) |  |  |  |
| Design Ops |  |  |  |

No build ships to TestFlight / Internal Track / Production until all four
roles sign and every checkbox above is green — including the Android
Architecture section (§4).

🙏 *Parity is not a feature — it is the promise we make to the seeker that
the Divine is reachable from every door.*
