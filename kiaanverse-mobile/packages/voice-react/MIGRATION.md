# Migration to `@kiaanverse/voice-react`

Implements `IMPROVEMENT_ROADMAP.md` P2 §13. This package is the
target consolidation surface for the voice hooks scattered across
`hooks/` (web) and `kiaanverse-mobile/apps/mobile/voice/hooks/` (mobile).

## Honest scope at v0.1.0

This package ships:

- **Type contracts** (`src/types.ts`) — `DictationResult`,
  `SpeechRecognizerBridge`, `VoiceLifecycleEvent`,
  `DictationErrorCode`. Single source of truth that survives
  Kotlin / TypeScript / Python (server transcribe endpoint) edits.
- **Bridge detection** (`src/bridge.ts`) —
  `detectSpeechRecognizerBridge` feature-detects the native
  `SakhaVoice` module. Pure function; runs in plain jest with no
  React Native shim.
- **Unified dictation hook** (`src/hooks/useNativeOrFallbackDictation.ts`)
  — routes through native when registered, REST fallback otherwise,
  pinned by 9 tests.
- **Inventory** (`src/inventory.ts`) — typed list of every voice hook
  in the repo with status (`canonical`, `dormant_deprecated`,
  `platform_specific`, `replaced_by_shared`).

This package does **NOT** yet:

- Hold the React-Native-specific hook bodies (`useRecorder`,
  `useStreamingPlayer`, `useBargeIn`, etc.). Those import
  `react-native` and `expo-av` which only resolve inside
  `apps/mobile/`. Moving them here is a build-system task — see
  "Phase 3" below.
- Hold the web-specific `useVoiceInput` / `useVoiceOutput` /
  `useWakeWord`. Those import `navigator.*` APIs that need a
  `window` and an SSR-aware mounting check — also Phase 3.

## Why ship type contracts first

The audit (`AUDIT_VOICE_COMPANION.md` table 8) flagged the dual
hook ecosystem as the biggest mobile-team coordination tax. The
fastest way to stop the drift is to **pin the wire shape** — the
contract that says "every dictation result has `transcript`,
`language`, `source`, `latencyMs`". Once both platforms import
from the same `types.ts`, every cross-platform edit is a deliberate
contract change rather than an accidental field rename.

The two `useNative…` adapters that DO ship here (bridge + hook)
prove the contract round-trips through a JS adapter without
needing React Native.

## Phase 2 — wire the package into mobile

```bash
# 1. Add as a workspace dependency.
cd kiaanverse-mobile/apps/mobile
pnpm add @kiaanverse/voice-react@workspace:*

# 2. Replace the existing useDictation with a re-export so all
#    call sites work unchanged:
cat > voice/hooks/useDictation.ts <<'TS'
export {
  useNativeOrFallbackDictation as useDictation,
} from '@kiaanverse/voice-react';
TS

# 3. Provide the REST fallback at the call site:
#
#    const dictation = useDictation({
#      languageTag: 'hi-IN',
#      restFallback: async (lang) => {
#        const result = await api.transcribe.upload(/* … */);
#        return {
#          transcript: result.text,
#          language: result.detected_language,
#          source: 'rest_fallback',
#          latencyMs: 0,
#        };
#      },
#    });
```

## Phase 3 — physically move the platform hooks

This is a build-system change that needs to land on a branch tested
against EAS Build. The risk is high — the workspace.yaml comment
in this repo documents 13+ broken builds caused by autolinker /
hoisting interactions when mobile packages were rearranged.

Recommended sequencing:

1. Move one hook (`useRecorder` — already mobile-only and
   self-contained) to `packages/voice-react/src/native/useRecorder.ts`.
2. Add `react-native` and `expo-av` as peer dependencies in this
   package's `package.json`.
3. Run a full EAS Build on a branch named
   `voice-react-migration-phase3-recorder` to verify the
   autolinker still finds the native code.
4. If green: move the next hook. If red: revert and document.

Until ops has bandwidth for that sequence, leave the platform hooks
where they are. The type-contract + adapter consolidation in v0.1.0
is enough to stop the drift on the JS layer.

## What stays where

| Hook | Status | Lives in |
|---|---|---|
| `useNativeOrFallbackDictation` | canonical, shared | this package |
| `useVoiceInput` (web) | canonical, web-only | `hooks/` |
| `useVoiceOutput` (web) | canonical, web-only | `hooks/` |
| `useWakeWord` (web) | canonical, web-only | `hooks/` |
| `useHandsFreeMode` (web) | canonical, web-only | `hooks/` |
| `useVoiceActivityDetection` (web) | dormant — delete or wire | `hooks/` |
| `useDictation` (mobile) | replaced — re-export from this pkg after Phase 2 | `apps/mobile/voice/hooks/` |
| `useRecorder` (mobile) | canonical, mobile-only | `apps/mobile/voice/hooks/` |
| `useStreamingPlayer` (mobile) | canonical, mobile-only | `apps/mobile/voice/hooks/` |
| `useBargeIn` (mobile) | canonical, mobile-only | `apps/mobile/voice/hooks/` |
| `useCrisisHandler` (mobile) | canonical, mobile-only | `apps/mobile/voice/hooks/` |
| `useSakhaWakeWord` (mobile) | canonical, mobile-only | `apps/mobile/voice/hooks/` |
| `useForegroundService` (mobile) | canonical, mobile-only | `apps/mobile/voice/hooks/` |
| `useAudioFocus` (mobile) | canonical, mobile-only | `apps/mobile/voice/hooks/` |
| `useToolInvocation` (mobile) | canonical, mobile-only | `apps/mobile/voice/hooks/` |
| `useShankhaAnimation` (mobile) | canonical, mobile-only | `apps/mobile/voice/hooks/` |
| `useVoiceSession` (mobile) | dormant — delete | `apps/mobile/voice/hooks/` |
| `useVoicePrefill` (mobile) | dormant — delete | `apps/mobile/voice/hooks/` |
| `useVoiceRecorder` (shared UI) | canonical | `packages/ui/src/hooks/` |

The same table is available as a typed import:

```ts
import { HOOK_INVENTORY } from '@kiaanverse/voice-react';
```
