/**
 * Native bridge detection — IMPROVEMENT_ROADMAP.md P2 §12.
 *
 * The Kotlin SpeechRecognizer module is wired through React Native's
 * `NativeModules.SakhaVoice` surface (see `KiaanVoicePackage.kt`).
 * It is **Android-only**, **registered by `withKiaanSakhaVoicePackages`
 * config-plugin at app startup**, and surfaced as an empty stub on
 * iOS / Expo Go / web.
 *
 * This module exposes a single pure function — `detectSpeechRecognizerBridge`
 * — that returns a strongly-typed `SpeechRecognizerBridge` when the
 * native module is registered with the expected method set, otherwise
 * `null`. The voice hooks call this once at construction and fall back
 * to the REST transcribe endpoint when it returns `null`.
 *
 * Why a feature-detect instead of a `Platform.OS === 'android'` check
 * ----------------------------------------------------------------
 * `NativeModules.SakhaVoice` exists as an empty proxy on iOS / Expo
 * Go even when no native code is linked — accessing any method on it
 * raises `RNCallNotImplemented` at call time. Probing for the
 * `dictateOnce` callable on the proxy is the only reliable way to
 * distinguish "I'm on Android with the module linked" from "I'm on
 * Android in Expo Go" from "I'm on iOS".
 *
 * Test ergonomics
 * ---------------
 * The function takes its `NativeModules` source as an optional
 * argument so tests can inject a fake registry without monkey-patching
 * the global `react-native` module. Production callers always pass
 * the real `NativeModules`; tests pass a `{ SakhaVoice: { dictateOnce: ... } }`
 * dict.
 */

import type { SpeechRecognizerBridge } from './types';

/** Shape we need to see at runtime for the bridge to be considered
 * registered. We require all three methods rather than gambling that
 * only some were registered — partial bridges are a Kotlin-side bug. */
const REQUIRED_METHODS = ['dictateOnce', 'cancel', 'isAvailable'] as const;

export interface NativeModulesLike {
  // Index signature so tests can hand us a literal object.
  [moduleName: string]: unknown;
}

export interface BridgeDetectOptions {
  /** Override the source registry. Production callers omit. */
  nativeModules?: NativeModulesLike;
  /** Override the OS check for tests. */
  platformOS?: string;
}

/** Return the registered bridge, or `null` when not available. */
export function detectSpeechRecognizerBridge(
  opts: BridgeDetectOptions = {},
): SpeechRecognizerBridge | null {
  const { nativeModules = (globalThis as { __NATIVE_MODULES__?: NativeModulesLike }).__NATIVE_MODULES__, platformOS } = opts;
  if (!nativeModules) {
    return null;
  }
  const candidate = nativeModules['SakhaVoice'] as
    | Partial<SpeechRecognizerBridge>
    | undefined;
  if (!candidate) {
    return null;
  }
  for (const m of REQUIRED_METHODS) {
    if (typeof (candidate as Record<string, unknown>)[m] !== 'function') {
      return null;
    }
  }
  // OS gate is advisory — we already proved by feature-detect that
  // every method is a real function. But if the caller told us we're
  // not on Android, respect it (lets iOS tests force the fallback).
  if (platformOS && platformOS !== 'android') {
    return null;
  }
  return candidate as SpeechRecognizerBridge;
}
