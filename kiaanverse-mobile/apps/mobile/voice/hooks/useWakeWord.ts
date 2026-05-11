/**
 * useWakeWord — passive listener for "Hey Sakha" / "Sakha" wake phrase.
 *
 * Uses Android's built-in ``SpeechRecognizer`` (wrapped by
 * ``useDictation``) in a low-key continuous mode: short recognition
 * sessions back-to-back, scanning every transcript for the wake
 * phrase. On match → calls ``onWake`` (the Voice Companion screen
 * uses this to auto-start its session — no tap needed).
 *
 * Why this approach (vs Picovoice Porcupine / openWakeWord):
 *   • No native module dependency — uses the speech-recognition
 *     infrastructure already wired into useDictation
 *   • No model file to bundle (Picovoice is ~5 MB, openWakeWord
 *     ~2 MB)
 *   • Battery cost is comparable since both approaches keep the
 *     mic open
 *   • Trade-off: needs cloud Google Speech for accuracy (no
 *     fully-offline path); detection latency ~1–2s vs ~300ms for
 *     dedicated wake-word engines
 *
 * The hook is OPT-IN via the toggle on the Voice Companion screen.
 * Default OFF — wake-word listening means the mic is always live,
 * which has battery + privacy implications. User explicitly turns
 * it on when they want hands-free activation.
 *
 * Wake phrases recognised (case-insensitive, all start-of-utterance):
 *   • "hey sakha"
 *   • "hi sakha"
 *   • "sakha"
 *   • "ok sakha"
 *
 * After a wake hit, the hook stops listening for 5 seconds to give
 * the user time to talk to the now-active session without false-
 * triggering on their own speech.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useDictation } from './useDictation';

/** Substring patterns that activate the wake. Matched against the
 *  lowercased final transcript via ``startsWith`` so a sentence like
 *  "Hey Sakha, I need help with…" wakes correctly without false-
 *  matching "rakshaka" / "shakha" / etc. mid-sentence. */
const WAKE_PHRASES = ['hey sakha', 'hi sakha', 'ok sakha', 'sakha'];

/** Cooldown after a wake — keeps the hook silent while the user
 *  talks to the activated session. 5s covers a typical first
 *  utterance "I'm anxious about tomorrow". */
const POST_WAKE_COOLDOWN_MS = 5000;

interface UseWakeWordOptions {
  /** Whether to actively listen. Toggle via the Voice Companion UI
   *  switch; default behaviour is OFF (mic stays closed). */
  readonly enabled: boolean;
  /** Fired when a wake phrase is detected. Voice Companion uses this
   *  to auto-start a session as if the user tapped "Tap to begin". */
  readonly onWake: () => void;
  /** Fired on dictation hard errors (permission denied, network
   *  unavailable, etc.) so the screen can surface the issue. Soft
   *  errors (NO_MATCH, SPEECH_TIMEOUT) are auto-retried silently. */
  readonly onError?: (code: string, message: string) => void;
}

export function useWakeWord(options: UseWakeWordOptions): {
  isListening: boolean;
} {
  const { enabled, onWake, onError } = options;
  const cooldownUntilRef = useRef<number>(0);
  const enabledRef = useRef<boolean>(enabled);
  const onWakeRef = useRef(onWake);
  const onErrorRef = useRef(onError);
  // Keep refs in sync — callbacks registered with useDictation
  // capture these refs ONCE at mount, so we need to write through.
  useEffect(() => {
    enabledRef.current = enabled;
    onWakeRef.current = onWake;
    onErrorRef.current = onError;
  }, [enabled, onWake, onError]);

  // Dictation callbacks — must be stable refs to avoid re-mounting
  // the recognition session every render.
  const handleTranscript = useCallback((text: string) => {
    if (!enabledRef.current) return;
    if (Date.now() < cooldownUntilRef.current) return;
    const normalized = text.toLowerCase().trim();
    if (!normalized) return;
    const hit = WAKE_PHRASES.some((p) => normalized.startsWith(p));
    if (!hit) return;
    // Cool down before firing so the upcoming session's audio isn't
    // mistaken for another wake.
    cooldownUntilRef.current = Date.now() + POST_WAKE_COOLDOWN_MS;
    onWakeRef.current?.();
  }, []);

  const handleError = useCallback((code: string, message: string) => {
    // NO_MATCH / SPEECH_TIMEOUT are normal silence — the dictation
    // session ended without hearing anything. Restart silently below.
    if (code === 'NO_MATCH' || code === 'SPEECH_TIMEOUT') return;
    onErrorRef.current?.(code, message);
  }, []);

  const dictation = useDictation({
    language: 'en-IN',
    onTranscript: handleTranscript,
    onError: handleError,
  });

  // Auto-restart loop — keeps the recognizer alive while enabled.
  // Android's SpeechRecognizer ends after each utterance OR after
  // ~30s of silence. We restart immediately on idle so the wake
  // phrase can be caught at any time during enabled-state.
  const isListening = dictation.state.tag === 'listening';
  useEffect(() => {
    if (!enabled) return;
    // While enabled, kick off listening whenever idle. Throttled by
    // dictation's own state machine — calling start() during
    // 'listening' is a no-op.
    if (dictation.state.tag === 'idle' || dictation.state.tag === 'error') {
      void dictation.start();
    }
  }, [enabled, dictation, dictation.state.tag]);

  // Toggling enabled = false flips the ref. The auto-restart loop
  // above checks enabledRef before re-firing, so the recognizer
  // naturally winds down within one utterance (Android's
  // SpeechRecognizer doesn't expose a synchronous cancel — it
  // releases on the next NO_MATCH / SPEECH_TIMEOUT). Acceptable for
  // wake-word use; user toggling off → at most 5s of mic-on tail.

  return { isListening };
}
