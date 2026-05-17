/**
 * `useNativeOrFallbackDictation` — single STT hook the rest of the
 * app calls. Routes to the native Android bridge when registered,
 * otherwise to the REST fallback. Documented in
 * IMPROVEMENT_ROADMAP.md P2 §12.
 *
 * The REST fallback transport is supplied by the caller as
 * `restFallback` so this package stays decoupled from
 * `@kiaanverse/api` (the mobile-only HTTP client) — web and mobile
 * pass their own implementations.
 *
 * Design rule: this hook NEVER touches `react-native` or `expo-av`
 * directly. It speaks only the `SpeechRecognizerBridge` contract +
 * a caller-supplied REST transport. That keeps the package
 * Node-testable (the suite under `__tests__/` runs in plain jest
 * without React Native).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { detectSpeechRecognizerBridge } from '../bridge';
import type {
  BridgeDetectOptions,
} from '../bridge';
import type {
  DictationErrorCode,
  DictationResult,
  DictationState,
  SpeechRecognizerBridge,
  VoiceLifecycleEvent,
} from '../types';

export interface UseDictationOptions {
  /** BCP-47 language tag passed to the recogniser. */
  languageTag?: string;

  /** REST fallback. Called when the native bridge is absent or fails
   * with a recoverable error (NETWORK / TIMEOUT / UNKNOWN). Caller
   * supplies because the HTTP client differs between web and mobile.
   * Return shape mirrors {@link DictationResult}. */
  restFallback?: (languageTag: string) => Promise<DictationResult>;

  /** Inject a fake bridge in tests; production callers omit. */
  bridgeDetectOptions?: BridgeDetectOptions;

  /** Lifecycle event tap (telemetry, analytics). Hook stays
   * functional whether or not this is provided. */
  onEvent?: (event: VoiceLifecycleEvent) => void;
}

export interface UseDictationApi {
  state: DictationState;
  /** Start one dictation turn. Resolves with the final transcript
   * (or rejects through `state.errorCode`). Safe to call only when
   * `state.tag === 'idle'`. */
  start: () => Promise<DictationResult | null>;
  /** Cancel an in-flight turn. No-op when idle. */
  cancel: () => Promise<void>;
  /** Whether the native bridge served the last turn — useful for
   * the UI to render "on-device" vs "cloud" badges. */
  lastSource: DictationResult['source'] | null;
}

export function useNativeOrFallbackDictation(
  options: UseDictationOptions = {},
): UseDictationApi {
  const {
    languageTag = 'en-IN',
    restFallback,
    bridgeDetectOptions,
    onEvent,
  } = options;

  const [state, setState] = useState<DictationState>({ tag: 'idle' });
  const [lastSource, setLastSource] = useState<
    DictationResult['source'] | null
  >(null);

  // Resolve the bridge once per mount. Re-detect on remount so a
  // hot reload that newly registers the module picks it up.
  const bridgeRef = useRef<SpeechRecognizerBridge | null>(null);
  useEffect(() => {
    bridgeRef.current = detectSpeechRecognizerBridge(bridgeDetectOptions);
    // No cleanup needed — the bridge has no subscriptions of its own.
  }, [bridgeDetectOptions]);

  const start = useCallback(async (): Promise<DictationResult | null> => {
    if (state.tag !== 'idle') {
      return null;
    }
    const started = performance.now();
    setState({ tag: 'starting' });

    const bridge = bridgeRef.current;
    if (bridge) {
      onEvent?.({
        kind: 'started',
        languageTag,
        source: 'native_android',
      });
      try {
        setState({ tag: 'listening' });
        const result = await bridge.dictateOnce(languageTag);
        const enriched: DictationResult = {
          transcript: result.transcript ?? '',
          language: result.language ?? null,
          source: 'native_android',
          latencyMs: Math.round(performance.now() - started),
        };
        setLastSource('native_android');
        setState({ tag: 'idle' });
        onEvent?.({ kind: 'resolved', result: enriched });
        return enriched;
      } catch (err) {
        const code = (err as { code?: DictationErrorCode })?.code ?? 'UNKNOWN';
        const message =
          (err as Error)?.message ?? 'native dictation failed';
        // BRIDGE_UNAVAILABLE / NETWORK / TIMEOUT / UNKNOWN are
        // recoverable through the REST fallback. PERMISSION_DENIED
        // and NO_MATCH are user-facing terminal states.
        const recoverable = (
          ['NETWORK', 'TIMEOUT', 'UNKNOWN', 'BRIDGE_UNAVAILABLE'] as const
        ).includes(code as never);
        if (recoverable && restFallback) {
          onEvent?.({
            kind: 'started',
            languageTag,
            source: 'rest_fallback',
          });
          try {
            const restResult = await restFallback(languageTag);
            const enriched: DictationResult = {
              transcript: restResult.transcript ?? '',
              language: restResult.language ?? null,
              source: 'rest_fallback',
              latencyMs: Math.round(performance.now() - started),
            };
            setLastSource('rest_fallback');
            setState({ tag: 'idle' });
            onEvent?.({ kind: 'resolved', result: enriched });
            return enriched;
          } catch (restErr) {
            const restCode =
              (restErr as { code?: DictationErrorCode })?.code ?? 'UNKNOWN';
            const restMessage =
              (restErr as Error)?.message ?? 'rest fallback failed';
            setState({
              tag: 'error',
              errorCode: restCode,
              errorMessage: restMessage,
            });
            onEvent?.({ kind: 'error', code: restCode, message: restMessage });
            return null;
          }
        }
        setState({ tag: 'error', errorCode: code, errorMessage: message });
        onEvent?.({ kind: 'error', code, message });
        return null;
      }
    }

    // No bridge. Fall straight to REST.
    if (!restFallback) {
      const code: DictationErrorCode = 'BRIDGE_UNAVAILABLE';
      const message =
        'native speech bridge unavailable and no restFallback provided';
      setState({ tag: 'error', errorCode: code, errorMessage: message });
      onEvent?.({ kind: 'error', code, message });
      return null;
    }
    onEvent?.({
      kind: 'started',
      languageTag,
      source: 'rest_fallback',
    });
    try {
      setState({ tag: 'listening' });
      const result = await restFallback(languageTag);
      const enriched: DictationResult = {
        transcript: result.transcript ?? '',
        language: result.language ?? null,
        source: 'rest_fallback',
        latencyMs: Math.round(performance.now() - started),
      };
      setLastSource('rest_fallback');
      setState({ tag: 'idle' });
      onEvent?.({ kind: 'resolved', result: enriched });
      return enriched;
    } catch (err) {
      const code =
        (err as { code?: DictationErrorCode })?.code ?? 'UNKNOWN';
      const message = (err as Error)?.message ?? 'rest fallback failed';
      setState({ tag: 'error', errorCode: code, errorMessage: message });
      onEvent?.({ kind: 'error', code, message });
      return null;
    }
  }, [state.tag, languageTag, restFallback, onEvent]);

  const cancel = useCallback(async (): Promise<void> => {
    const bridge = bridgeRef.current;
    if (bridge) {
      try {
        await bridge.cancel();
      } catch {
        // Cancel is best-effort.
      }
    }
    if (state.tag !== 'idle') {
      setState({ tag: 'idle' });
      onEvent?.({ kind: 'cancelled' });
    }
  }, [state.tag, onEvent]);

  return { state, start, cancel, lastSource };
}
