/**
 * useDictation — one-shot voice-to-text dictation for tool text fields.
 *
 * Wraps the native SakhaVoice.dictateOnce(languageTag) bridge method
 * (implemented in SakhaVoiceModule.kt + SakhaDictation.kt). Returns a
 * tuple of [start, state] where state encodes: idle / listening /
 * resolving / error.
 *
 * This hook is the JS half of the Shankha voice-input feature on every
 * tool screen (Ardha, Viyoga, Relationship Compass, Karma Reset,
 * Emotional Reset, Sakha Chat). It is intentionally simpler than
 * useVoiceSession — no WSS, no Sakha persona, no Gita filter, no
 * streaming TTS. Just: capture one utterance, return the transcript,
 * exit.
 *
 * Why a separate hook from useVoiceSession:
 *   • useVoiceSession opens a stateful WSS session and runs through
 *     the Sakha pipeline (router, retrieval, LLM, TTS). Latency budget
 *     is ~1.2s for first-audio-byte. Overkill for "type 'I am angry
 *     at my father' into a TextInput".
 *   • useDictation calls Android SpeechRecognizer directly. ~200ms
 *     setup, returns whenever the user pauses, no backend call.
 *
 * Permission: caller is responsible for ensuring RECORD_AUDIO is
 * granted before invoking start(). The hook surfaces the
 * PERMISSION_DENIED error if it isn't, but doesn't trigger the
 * permission flow itself — that belongs to the screen-level
 * permission gate (existing flow in app/_layout.tsx).
 */

import { useCallback, useRef, useState } from 'react';
import { NativeModules, Platform } from 'react-native';

type DictationStateTag = 'idle' | 'listening' | 'resolving' | 'error';

export interface DictationState {
  tag: DictationStateTag;
  errorCode?: string;
  errorMessage?: string;
}

interface SakhaVoiceModuleShape {
  dictateOnce: (languageTag: string) => Promise<{
    transcript: string;
    language: string;
  }>;
}

const SakhaVoice: SakhaVoiceModuleShape | undefined =
  Platform.OS === 'android' ? (NativeModules.SakhaVoice as SakhaVoiceModuleShape) : undefined;

export interface UseDictationOptions {
  /**
   * BCP-47 language tag — e.g. "en-IN", "hi-IN", "en-US". Defaults
   * to "en-IN" because the KIAANverse audience is primarily Indian
   * English; Hindi-leading users can pass "hi-IN" to match.
   */
  language?: string;
  /**
   * Called when dictation succeeds, with the captured transcript.
   * The screen typically appends/replaces the current TextInput
   * value with this string.
   */
  onTranscript: (transcript: string) => void;
  /** Optional error sink. */
  onError?: (code: string, message: string) => void;
}

export function useDictation(opts: UseDictationOptions): {
  start: () => Promise<void>;
  state: DictationState;
} {
  const { language = 'en-IN', onTranscript, onError } = opts;
  const [state, setState] = useState<DictationState>({ tag: 'idle' });
  // Guard against double-start if the user taps the Shankha twice quickly.
  const inFlight = useRef(false);

  const start = useCallback(async (): Promise<void> => {
    if (inFlight.current) return;
    if (!SakhaVoice) {
      const code = 'UNSUPPORTED_PLATFORM';
      const message = 'Voice dictation is Android-only';
      setState({ tag: 'error', errorCode: code, errorMessage: message });
      onError?.(code, message);
      return;
    }
    inFlight.current = true;
    setState({ tag: 'listening' });
    try {
      const result = await SakhaVoice.dictateOnce(language);
      setState({ tag: 'resolving' });
      onTranscript(result.transcript);
      // Brief settle so the Shankha has time to fade its waves before
      // returning to idle. The component's animation reads `state.tag`
      // and a hard transition from listening→idle would visually pop.
      setTimeout(() => setState({ tag: 'idle' }), 120);
    } catch (err) {
      const code =
        (err as { code?: string })?.code ?? 'DICTATION_FAILED';
      const message =
        (err as { message?: string })?.message ?? 'Dictation failed';
      setState({ tag: 'error', errorCode: code, errorMessage: message });
      onError?.(code, message);
    } finally {
      inFlight.current = false;
    }
  }, [language, onTranscript, onError]);

  return { start, state };
}
