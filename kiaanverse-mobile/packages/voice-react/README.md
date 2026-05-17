# `@kiaanverse/voice-react`

Shared voice contracts + hooks for KIAAN. Single source of truth for
the wire shape every voice surface speaks — web, mobile, and the
native Android `SakhaVoice` bridge.

Implements `IMPROVEMENT_ROADMAP.md` P2 §12 + §13.

## Install (workspace)

This package lives under `kiaanverse-mobile/packages/voice-react/`.
Add to a consumer via pnpm workspace:

```bash
pnpm add @kiaanverse/voice-react@workspace:*
```

## Quick start

```ts
import {
  useNativeOrFallbackDictation,
  detectSpeechRecognizerBridge,
} from '@kiaanverse/voice-react';

function DictationButton() {
  const dictation = useNativeOrFallbackDictation({
    languageTag: 'hi-IN',
    restFallback: async (lang) => {
      const result = await api.transcribe.upload({ lang });
      return {
        transcript: result.text,
        language: result.detected_language,
        source: 'rest_fallback',
        latencyMs: 0,
      };
    },
    onEvent: (e) => analytics.track('voice.dictation', e),
  });

  return (
    <Button
      onPress={dictation.start}
      disabled={dictation.state.tag !== 'idle'}
    >
      {dictation.state.tag === 'listening' ? 'Listening…' : 'Tap to speak'}
    </Button>
  );
}
```

## What's in the box

- `useNativeOrFallbackDictation` — unified STT hook (native → REST).
- `detectSpeechRecognizerBridge` — feature-detect for
  `NativeModules.SakhaVoice` (Android Kotlin module).
- `HOOK_INVENTORY` — typed list of every voice hook in the repo
  with status (`canonical` / `dormant_deprecated` /
  `platform_specific` / `replaced_by_shared`).
- Type contracts: `DictationResult`, `SpeechRecognizerBridge`,
  `VoiceLifecycleEvent`, `DictationErrorCode`.

## Tests

```bash
cd kiaanverse-mobile/packages/voice-react
npx jest
```

15 tests cover bridge detection and the unified hook's routing.
All run in plain jest with no React Native shim.

## See also

- `MIGRATION.md` — how to wire this into the mobile + web consumers.
- `docs/native_android_stt_runbook.md` (repo root) — how ops
  enables the native bridge end-to-end.
- `IMPROVEMENT_ROADMAP.md` P2 §12 + §13 — the roadmap entries this
  package implements.
