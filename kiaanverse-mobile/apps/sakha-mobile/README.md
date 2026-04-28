# Sakha Voice Companion — Mobile App

Native Android module of the Kiaanverse / Sakha App, shipped as a signed
`.aab` via Expo EAS Build. Implements the spec in `CLAUDE.md` (Kiaan
Voice Companion · FINAL.1, persona-version `1.0.0`).

> **Confidential to Kiaanverse / MindVibe — do not distribute.**

## Status

This package is the **Part 7 scaffold** — workspace, manifest, EAS
profiles, the three Android config plugins, and the WSS frame types.
The runtime pieces land in:

| Part | What |
|------|------|
| 8 | `KiaanAudioPlayer` Kotlin TurboModule (ExoPlayer + RMS metering for the Shankha sound waves) |
| 9 | 11 voice hooks (`useRecorder`, `useVAD`, `useWebSocket`, `useStreamingPlayer`, …) + Zustand store |
| 10 | 5 voice screens (Shankha center, sacred geometry, transcript overlay, crisis overlay, quota sheet, onboarding) |
| 11 | Pre-rendered safety audio bundle + Shankha asset slots + 15 `ToolVoicePrefillContract`s |
| 12 | Detox E2E for the testing matrix in `CLAUDE.md` |

## Architecture

Mobile client orchestrates one Sakha voice turn against the backend
WSS pipe `/voice-companion/converse` (subprotocol `kiaan-voice-v1`):

```
expo-av Recording (Opus 16k mono 24kbps)
    ↓
Cobra VAD (on-device, 30ms frames, threshold 0.6)
    ↓
WebSocket (JSON text frames, 18 frame types)
    ↓
backend /voice-companion/converse  ← Parts 2–6
    ↓
KiaanAudioPlayer TurboModule (ExoPlayer ConcatenatingMediaSource)
    ↓
ducking against system audio via withKiaanAudioFocus plugin
```

## Layout

```
apps/sakha-mobile/
├── app/                          (Expo Router — file-based)
│   ├── _layout.tsx               root stack, COSMIC_VOID background
│   └── index.tsx                 landing (placeholder until Part 10)
├── lib/
│   └── wss-types.ts              ← TS mirror of backend wss_frames.py;
│                                    cross-checked by validate-wss-types.mjs
├── plugins/                      Expo config plugins
│   ├── withKiaanForegroundService.js  mediaPlayback service + notification channel
│   ├── withKiaanAudioFocus.js         audio focus + BT SCO routing meta-data
│   └── withPicovoice.js               Cobra/Porcupine ABI splits + access-key
├── scripts/
│   ├── validate-plugins.mjs      load + invoke smoke for the 3 plugins
│   └── validate-wss-types.mjs    drift check vs. backend wss_frames.py
├── assets/shankha/               (icons + Lottie + raster — Part 11)
├── native/android/               (KiaanAudioPlayer Kotlin — Part 8)
├── app.config.ts                 Expo manifest (permissions, plugins, R8 keep)
├── eas.json                      EAS profiles: dev/preview (.apk), production (.aab)
├── package.json                  workspace member @kiaanverse/sakha-mobile
└── tsconfig.json                 strict TS; baseUrl=. + path aliases
```

## Building

The app is in the `kiaanverse-mobile/` pnpm workspace. From the repo root:

```bash
# Type-check + plugin sanity
pnpm --filter @kiaanverse/sakha-mobile run typecheck
pnpm --filter @kiaanverse/sakha-mobile run validate:plugins
pnpm --filter @kiaanverse/sakha-mobile run validate:wss-types

# Local Metro server (dev client required)
pnpm --filter @kiaanverse/sakha-mobile run android

# Production .aab (signed; uploaded to EAS)
pnpm --filter @kiaanverse/sakha-mobile run build:android:production
# → submit to Play Console
pnpm --filter @kiaanverse/sakha-mobile run submit:android
```

## Required EAS secrets (production)

Configure once via `eas secret:create --scope project ...`:

| Name | Used by | Notes |
|------|---------|-------|
| `EXPO_PUBLIC_API_BASE_URL` | every build | already set per profile in `eas.json` |
| `PICOVOICE_ACCESS_KEY` | `withPicovoice` | required for Cobra VAD on real builds |
| `SENTRY_DSN` | runtime | optional; off when unset |
| `EAS_PROJECT_ID` | EAS | injected automatically by `eas init` |

Backend keys (Sarvam, Deepgram, ElevenLabs, OpenAI) live on the server,
not in the mobile build.

## Persona / schema versioning

Three versions are pinned across the WSS pipe and tracked together:

| Version | Source | What it gates |
|---------|--------|---------------|
| `persona_version` | `prompts/persona-version` (server) + `app.config.ts → extra.personaVersion` (client) | Sakha's voice / tone — bumping forces a regression sweep |
| `schema_version` | `wss_frames.py SCHEMA_VERSION` + `wss-types.ts SCHEMA_VERSION` | WSS frame protocol — bumping is a breaking change |
| `subprotocol` | both sides | always `kiaan-voice-v1` |

Mismatches close the WSS with code 4001 (PERSONA_MISMATCH). Run
`validate:wss-types` in CI to catch drift before it ships.

## Plugin reference

| Plugin | Phase | What it injects |
|--------|-------|-----------------|
| `withKiaanForegroundService` | manifest + strings.xml | `<service android:foregroundServiceType="mediaPlayback">` for `com.kiaanverse.sakha.audio.SakhaForegroundService` (Kotlin class lives in Part 8) + Hindi/English notification strings |
| `withKiaanAudioFocus` | manifest meta-data | `usage`/`contentType`/`focusGain`/`routeBluetooth` so KiaanAudioPlayer reads a single source of truth |
| `withPicovoice` | manifest + build.gradle | ABI splits (arm64-v8a, armeabi-v7a, x86, x86_64), `KIAAN_PICOVOICE_ACCESS_KEY` BuildConfig field, wake-word meta-data |

All three are idempotent — running prebuild repeatedly does not duplicate
entries.

## Testing matrix (Part 12)

End-to-end coverage is in `__tests__/` (Detox) and the spec's testing
matrix in `CLAUDE.md`:

- Pixel 7 / Android 14 / WiFi: first audio byte ≤ 1.2s
- Pixel 5 / Android 13 / 4G: first audio byte ≤ 1.5s
- Cache hit (repeated mood + verse): ≤ 500ms
- Crisis keyword: audio playing ≤ 800ms
- Filter rejection: tier-3 fallback audio plays seamlessly
- Free tier voice attempt: pre-rendered upgrade message, no recording
- Bluetooth headset connect mid-turn: routing flips, no restart
- Incoming call mid-turn: pause + resume
- 30-minute session: no OOM, battery delta < 4%

## Confidentiality

This file (architecture, plugin internals, WSS frame protocol, persona
version conventions) is Kiaanverse IP. Do not share, summarize, or
reproduce outside the team. The Sakha Voice Companion spec (`CLAUDE.md`)
is governed by the same rule.

🐚 🕉️
