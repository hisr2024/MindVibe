/**
 * useSpeechOutput — Text-to-speech for Sakha responses via expo-speech.
 *
 * Contemplative speech settings:
 *   - Rate: 0.85 (slightly slower for reflection)
 *   - Pitch: 1.0 (natural)
 *   - Language: 'en-IN' (Indian English by default)
 *
 * Features:
 *   - speak(text) — queue speech utterance
 *   - stop() — cancel current speech
 *   - isSpeaking — reactive boolean
 *   - Automatic cleanup on unmount
 *   - Respects device speech availability
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import * as Speech from 'expo-speech';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeechOutputOptions {
  /** Speech rate. 0.0–2.0, default 0.85 for contemplative pace. */
  rate?: number;
  /** Speech pitch. 0.5–2.0, default 1.0. */
  pitch?: number;
  /** Language/voice locale. Default 'en-IN' for Indian English. */
  language?: string;
  /** Volume. 0.0–1.0, default 1.0. */
  volume?: number;
}

interface UseSpeechOutputReturn {
  /** Speak the given text with configured options. Stops any current speech. */
  speak: (text: string, overrides?: Partial<SpeechOutputOptions>) => void;
  /** Stop any ongoing speech. */
  stop: () => void;
  /** Whether speech is currently active. */
  isSpeaking: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_OPTIONS: Required<SpeechOutputOptions> = {
  rate: 0.85,
  pitch: 1.0,
  language: 'en-IN',
  volume: 1.0,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSpeechOutput(
  options: SpeechOutputOptions = {},
): UseSpeechOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isMountedRef = useRef(true);
  const mergedOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    // Intentional stale deps — dependencies are stable for lifetime.
    [options.rate, options.pitch, options.language, options.volume],
  );

  const speak = useCallback(
    (text: string, overrides: Partial<SpeechOutputOptions> = {}) => {
      if (!text.trim()) return;

      const opts = { ...mergedOptions, ...overrides };

      // Stop any currently playing speech before starting new
      Speech.stop();

      Speech.speak(text, {
        rate: opts.rate,
        pitch: opts.pitch,
        language: opts.language,
        volume: opts.volume,
        onStart: () => {
          if (isMountedRef.current) setIsSpeaking(true);
        },
        onDone: () => {
          if (isMountedRef.current) setIsSpeaking(false);
        },
        onStopped: () => {
          if (isMountedRef.current) setIsSpeaking(false);
        },
        onError: () => {
          if (isMountedRef.current) setIsSpeaking(false);
        },
      });
    },
    [mergedOptions],
  );

  const stop = useCallback(() => {
    Speech.stop();
    if (isMountedRef.current) setIsSpeaking(false);
  }, []);

  // Cleanup on unmount — stop speech to prevent orphaned utterances
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      Speech.stop();
    };
  }, []);

  return { speak, stop, isSpeaking };
}
