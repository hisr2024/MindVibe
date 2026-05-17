/**
 * Shared voice contracts. These types pin the wire shapes between:
 *
 *   - JS/TS hooks (web + mobile)
 *   - the native Android Kotlin bridge
 *     (`apps/mobile/native/android/.../KiaanVoiceManager.kt`)
 *   - the server's `/api/kiaan/transcribe` fallback endpoint
 *
 * If any field name or semantics changes, it changes here first so
 * the platforms can be type-checked against the same source.
 */

/** Result of one dictation turn — same shape native + REST return. */
export interface DictationResult {
  /** Recognised utterance, trimmed. Empty string is valid (user
   * tapped stop before speaking). */
  transcript: string;
  /** BCP-47 language tag the recogniser believes was spoken
   * (`en-IN`, `hi-IN`, etc.). `null` when unknown. */
  language: string | null;
  /** Engine that produced the transcript. */
  source: 'native_android' | 'rest_fallback' | 'mock';
  /** Wallclock ms from `start()` to result resolution. */
  latencyMs: number;
}

/** Stable shape every voice hook reports through its `state.tag`. */
export type DictationStateTag =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'resolving'
  | 'error';

/** Hook state envelope shared by native + fallback. */
export interface DictationState {
  tag: DictationStateTag;
  errorCode?: DictationErrorCode;
  errorMessage?: string;
}

/** Error codes the JS hooks raise. Mirrors what the Kotlin bridge
 * emits via `KiaanVoiceManager.SpeechErrorCode`. Pinning the union
 * here means a future Kotlin enum extension is a deliberate cross-
 * platform contract change. */
export type DictationErrorCode =
  | 'PERMISSION_DENIED'
  | 'NETWORK'
  | 'NO_MATCH'
  | 'BUSY'
  | 'BRIDGE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN';

/** Contract every native speech bridge must satisfy.
 *
 * The Android implementation lives at
 * `apps/mobile/native/android/src/main/java/com/mindvibe/kiaan/voice/KiaanVoiceManager.kt`
 * (~814 LOC; uses `android.speech.SpeechRecognizer`). iOS has no
 * native implementation today — `detectSpeechRecognizerBridge`
 * returns `null` on iOS and the JS hook falls back to the REST
 * transcribe endpoint.
 */
export interface SpeechRecognizerBridge {
  /** Run one dictation turn end-to-end. Resolves with the result or
   * rejects with an `Error` whose `.code` matches
   * `DictationErrorCode`. Native impl typically calls
   * `SpeechRecognizer.startListening` and resolves on
   * `onResults` / `onError`. */
  dictateOnce(languageTag: string): Promise<DictationResult>;

  /** Cancel an in-flight dictation. Resolves once the recogniser has
   * stopped (≤200 ms on Pixel). Safe to call when idle. */
  cancel(): Promise<void>;

  /** Whether the bridge is registered AND the device supports the
   * on-device recogniser. Cheap — does not start any audio capture. */
  isAvailable(): Promise<boolean>;
}

/** Lifecycle events a hook may emit upstream (telemetry, analytics).
 * Kept structural so a future React-Native event emitter can fan
 * the events into the JS layer without churning the type. */
export type VoiceLifecycleEvent =
  | { kind: 'started'; languageTag: string; source: 'native_android' | 'rest_fallback' }
  | { kind: 'first_audio'; latencyMs: number }
  | { kind: 'resolved'; result: DictationResult }
  | { kind: 'error'; code: DictationErrorCode; message: string }
  | { kind: 'cancelled' };
