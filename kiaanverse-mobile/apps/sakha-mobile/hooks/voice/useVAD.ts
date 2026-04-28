/**
 * useVAD — Cobra (Picovoice) on-device voice activity detection.
 *
 * Used for two purposes:
 *   1. End-of-speech detection during listening — when the user goes
 *      silent for ≥700ms the recorder finalizes and an end_of_speech
 *      frame is sent over the WSS.
 *   2. Barge-in detection during speaking — when the user starts
 *      speaking again over the playback, useBargeIn fires an interrupt
 *      frame and fades the player out.
 *
 * Frame size: 30ms (Cobra's native frame size at 16kHz).
 * Voice probability threshold: 0.6 per spec.
 *
 * NOTE: @picovoice/cobra-react-native is dynamically imported because
 * the SDK requires a Picovoice access key at construction time. When
 * PICOVOICE_ACCESS_KEY is unset (CI / dev), this hook returns a stub
 * VAD that never fires — useful for unit tests of the surrounding
 * orchestration logic.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';

const VOICE_PROB_THRESHOLD = 0.6;
const SILENCE_FOR_END_OF_SPEECH_MS = 700;

type CobraInstance = {
  process: (frame: Int16Array) => Promise<number>;
  release: () => Promise<void>;
};

type CobraCtor = new (accessKey: string) => Promise<CobraInstance>;

interface UseVADOptions {
  /** When false the VAD is paused — use this to disable VAD during
   *  states where it shouldn't trigger (e.g., crisis overlay). */
  enabled: boolean;
  /** Callback fired when sustained voice has been detected for ~150ms.
   *  useBargeIn binds to this to fire WSS interrupts. */
  onVoiceStart?: () => void;
  /** Callback fired when silence has lasted ≥SILENCE_FOR_END_OF_SPEECH_MS.
   *  useVoiceSession / useRecorder bind to this to send end_of_speech. */
  onSilenceEndOfSpeech?: () => void;
}

export interface VADAPI {
  isReady: boolean;
  isVoiceActive: boolean;
  /** Push a 30ms frame of 16kHz mono Int16 audio to the VAD. The
   *  recorder is the natural producer; tests can drive this directly. */
  pushFrame: (frame: Int16Array) => Promise<void>;
  release: () => Promise<void>;
}

/** Stub VAD used when no Picovoice access key is configured. Always
 *  reports zero voice probability. */
async function makeStubCobra(): Promise<CobraInstance> {
  return {
    process: async () => 0,
    release: async () => {},
  };
}

async function loadCobraIfAvailable(accessKey: string): Promise<CobraInstance> {
  if (!accessKey) return makeStubCobra();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@picovoice/cobra-react-native') as { Cobra?: CobraCtor };
    if (!mod.Cobra) return makeStubCobra();
    return await mod.Cobra(accessKey);
  } catch {
    return makeStubCobra();
  }
}

export function useVAD({
  enabled,
  onVoiceStart,
  onSilenceEndOfSpeech,
}: UseVADOptions): VADAPI {
  const cobraRef = useRef<CobraInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const lastVoiceAtRef = useRef<number>(0);
  const sustainedVoiceMsRef = useRef<number>(0);
  const voiceStartFiredRef = useRef<boolean>(false);
  const silenceFiredRef = useRef<boolean>(false);

  const accessKey = String(
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.picovoice
      && ((Constants.expoConfig?.extra as { picovoice?: { accessKey?: string } }).picovoice?.accessKey ?? ''),
  );

  // Lazy load Cobra
  useEffect(() => {
    let cancelled = false;
    loadCobraIfAvailable(accessKey).then((inst) => {
      if (cancelled) {
        inst.release().catch(() => {});
        return;
      }
      cobraRef.current = inst;
      setIsReady(true);
    });
    return () => {
      cancelled = true;
      const c = cobraRef.current;
      cobraRef.current = null;
      c?.release().catch(() => {});
    };
  }, [accessKey]);

  const pushFrame = useCallback(
    async (frame: Int16Array): Promise<void> => {
      if (!enabled) return;
      const c = cobraRef.current;
      if (!c) return;
      try {
        const prob = await c.process(frame);
        const isVoice = prob >= VOICE_PROB_THRESHOLD;
        const now = Date.now();
        if (isVoice) {
          sustainedVoiceMsRef.current += 30;
          lastVoiceAtRef.current = now;
          silenceFiredRef.current = false;
          if (sustainedVoiceMsRef.current >= 150 && !voiceStartFiredRef.current) {
            voiceStartFiredRef.current = true;
            setIsVoiceActive(true);
            onVoiceStart?.();
          }
        } else {
          sustainedVoiceMsRef.current = 0;
          voiceStartFiredRef.current = false;
          if (isVoiceActive) setIsVoiceActive(false);
          if (
            lastVoiceAtRef.current > 0
            && now - lastVoiceAtRef.current >= SILENCE_FOR_END_OF_SPEECH_MS
            && !silenceFiredRef.current
          ) {
            silenceFiredRef.current = true;
            onSilenceEndOfSpeech?.();
          }
        }
      } catch {
        // Cobra errors are non-fatal — we just stop firing callbacks
      }
    },
    [enabled, isVoiceActive, onVoiceStart, onSilenceEndOfSpeech],
  );

  const release = useCallback(async () => {
    const c = cobraRef.current;
    cobraRef.current = null;
    setIsReady(false);
    if (c) await c.release();
  }, []);

  return { isReady, isVoiceActive, pushFrame, release };
}
