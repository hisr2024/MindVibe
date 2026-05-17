# Native Android STT — Enablement Runbook

Implements `IMPROVEMENT_ROADMAP.md` P2 §12. Documents how operators
flip on the existing Kotlin `SpeechRecognizer` implementation so
Android voice users stop paying the 200–500 ms Expo Audio WebM
re-encode penalty.

## What already ships

- **Kotlin native module** —
  `apps/mobile/native/android/src/main/java/com/mindvibe/kiaan/voice/KiaanVoiceManager.kt`
  (~814 LOC). Wraps `android.speech.SpeechRecognizer` with permission
  handling, on-device-vs-cloud preference, error mapping, and
  cancellation. Registered through `KiaanVoicePackage.kt`.

- **React Native bridge surface** — exposes `dictateOnce`, `cancel`,
  `isAvailable` as the `SakhaVoice` `NativeModules` entry. The
  contract is pinned by TypeScript in
  `@kiaanverse/voice-react/src/types.ts::SpeechRecognizerBridge`.

- **JS-side adapter (NEW)** —
  `@kiaanverse/voice-react/src/hooks/useNativeOrFallbackDictation.ts`
  feature-detects the bridge at construction and falls back to a
  caller-supplied REST transport when the bridge isn't registered
  (iOS / Expo Go / web).

- **Existing call site** —
  `apps/mobile/voice/hooks/useDictation.ts` already does the
  two-tier routing; after Phase 2 of the migration (see
  `kiaanverse-mobile/packages/voice-react/MIGRATION.md`) it becomes
  a one-line re-export of the shared hook.

## What's missing for end-users today

The autolinker plumbing that registers the native package is
gated by the `withKiaanSakhaVoicePackages` Expo config plugin. Per
the comments in `kiaanverse-mobile/pnpm-workspace.yaml`, getting
this plumbing right has required ≥13 EAS Build attempts in the
past. The runbook below assumes you have an EAS Build environment
or a local Android Studio + Gradle setup that can reproduce the
release build.

## Enablement steps

1. **Confirm the native module is in the source tree:**

   ```bash
   ls kiaanverse-mobile/apps/mobile/native/android/src/main/java/com/mindvibe/kiaan/voice/
   ```

   You should see `KiaanVoiceManager.kt`, `KiaanVoicePackage.kt`,
   `KiaanWakeWordDetector.kt`, etc.

2. **Verify the config plugin is registered.** In
   `apps/mobile/app.config.ts` look for:

   ```ts
   plugins: [
     // …
     './withKiaanSakhaVoicePackages',
   ];
   ```

   If absent, add it. The plugin is the SOLE registrant of the
   gradle module — without it the autolinkers won't find the Kotlin
   code (this is intentional per the workspace.yaml DEFINITIVE-FIX
   comment).

3. **Verify the AndroidManifest declares the mic permission:**

   ```xml
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   ```

4. **Run a clean EAS Build:**

   ```bash
   cd kiaanverse-mobile/apps/mobile
   eas build --profile preview --platform android --clear-cache
   ```

   Watch the gradle phase for `:kiaan-voice-native:assembleRelease`.
   If you see TWO modules (`:kiaan_voice_native` and
   `:kiaan-voice-native`) the autolinker dual-registration bug is
   back; fix per the workspace.yaml comment before proceeding.

5. **Install + test on a real Android device:**

   - Tap a dictation entry (e.g. the Emotional Reset tool's
     situation field).
   - Watch the JS console for `useDictation` lifecycle events. With
     the bridge live you should see
     `event: started, source: 'native_android'` followed by
     `event: resolved` carrying a `source: 'native_android'` result
     within ~1 s.
   - If you see `source: 'rest_fallback'` instead, the bridge isn't
     reaching the hook. Re-run the feature-detect manually:

     ```ts
     import { NativeModules } from 'react-native';
     console.log('SakhaVoice keys:', Object.keys(NativeModules.SakhaVoice ?? {}));
     ```

     The expected output is
     `['dictateOnce', 'cancel', 'isAvailable']` (plus React Native's
     `addListener` / `removeListeners`). Empty → the native module
     didn't link.

## Expected latency win

| Path | First-byte latency |
|---|---:|
| Expo Audio WebM → REST `/api/kiaan/transcribe` (today's default) | ~600–900 ms |
| Native `SakhaVoice.dictateOnce` (this runbook) | ~150–250 ms |

The win comes from skipping the WebM container re-encode and the
HTTP round-trip. On-device recognition on Pixel devices is also
free of network cost.

## Fallback semantics

The unified hook (`useNativeOrFallbackDictation`) routes back to
REST when the native bridge rejects with a recoverable error code:

| Error code | Behavior |
|---|---|
| `NETWORK`, `TIMEOUT`, `UNKNOWN`, `BRIDGE_UNAVAILABLE` | falls back to REST |
| `PERMISSION_DENIED`, `NO_MATCH`, `BUSY` | terminal — user-facing error |

This contract is pinned by
`packages/voice-react/__tests__/useNativeOrFallbackDictation.test.tsx`.

## When ops should NOT enable this yet

- iOS only deployments: the Kotlin module is Android-only by
  construction. Apple `SFSpeechRecognizer` integration is a future
  roadmap item.
- Expo Go workflow: the config plugin doesn't run inside Expo Go;
  the bridge will never appear. Use a dev client or release build.
- Devices below Android 8.0: `isOnDeviceRecognitionAvailable` may
  return false even when `isRecognitionAvailable` returns true. The
  bridge handles this internally (falls back to network
  recognition) but on data-poor devices the REST fallback is
  preferable.

## Telemetry hook

When ops imports
`@kiaanverse/voice-react/src/hooks/useNativeOrFallbackDictation.ts`
and provides an `onEvent` callback, every dictation turn emits one
of: `started`, `first_audio`, `resolved`, `error`, `cancelled`. Wire
these into the Prometheus telemetry shipped in
`backend/services/kiaan_telemetry.py` to track native-vs-fallback
share on the Grafana dashboard.
