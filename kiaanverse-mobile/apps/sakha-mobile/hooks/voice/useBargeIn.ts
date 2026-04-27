/**
 * useBargeIn — listens to VAD voice-start events while Sakha is
 * speaking. When sustained voice is detected for ≥250ms (per spec),
 * fires:
 *   1. KiaanAudioPlayer.fadeOut(120ms)         — graceful audio cut
 *   2. ws.send({ type: "interrupt" })           — server cancels orchestrator
 *   3. store.setState("interrupted")            — UX flips to "interrupted"
 *   4. recorder.start() (handled by useVoiceSession)
 *
 * Returns a `triggerNow()` escape hatch the UI can call directly
 * (e.g. tap-to-interrupt button on the voice canvas).
 */

import { useCallback, useEffect, useRef } from 'react';
import { KiaanAudioPlayer } from '../../lib/native/KiaanAudioPlayer';
import { useVoiceStore } from '../../stores/voiceStore';
import type { VoiceWebSocket } from './useWebSocket';

const SUSTAINED_VOICE_FOR_BARGE_IN_MS = 250;
const FADE_OUT_MS = 120;

interface UseBargeInOptions {
  ws: VoiceWebSocket;
  /** Whether barge-in is currently allowed — only true when state === 'speaking'. */
  enabled: boolean;
  /** Called when a barge-in fires so useVoiceSession can resume recording. */
  onTriggered?: () => void;
}

export interface BargeInAPI {
  /** Pump VAD voice-detection signal in. The recorder calls this every
   *  30ms during the speaking state so this hook can decide. */
  feedVoiceTick: (isVoice: boolean) => void;
  /** Manual trigger — used by an explicit "tap to interrupt" button. */
  triggerNow: () => void;
  isArmed: boolean;
}

export function useBargeIn({ ws, enabled, onTriggered }: UseBargeInOptions): BargeInAPI {
  const sustainedRef = useRef<number>(0);
  const armedRef = useRef<boolean>(true);
  const setState = useVoiceStore((s) => s.setState);

  const fire = useCallback(() => {
    if (!armedRef.current) return;
    armedRef.current = false;
    sustainedRef.current = 0;
    KiaanAudioPlayer.fadeOut(FADE_OUT_MS).catch(() => {});
    ws.send({ type: 'interrupt' });
    setState('interrupted');
    onTriggered?.();
    // Re-arm after a short cool-down so a single barge-in doesn't
    // re-fire on the user's continuing speech.
    setTimeout(() => {
      armedRef.current = true;
    }, 500);
  }, [ws, setState, onTriggered]);

  const feedVoiceTick = useCallback(
    (isVoice: boolean) => {
      if (!enabled || !armedRef.current) {
        sustainedRef.current = 0;
        return;
      }
      if (isVoice) {
        sustainedRef.current += 30; // 30ms per VAD frame
        if (sustainedRef.current >= SUSTAINED_VOICE_FOR_BARGE_IN_MS) fire();
      } else {
        sustainedRef.current = 0;
      }
    },
    [enabled, fire],
  );

  // Reset the sustained counter when the speaking phase ends so a stale
  // count doesn't trigger an immediate fire on the next turn.
  useEffect(() => {
    if (!enabled) sustainedRef.current = 0;
  }, [enabled]);

  return {
    feedVoiceTick,
    triggerNow: fire,
    isArmed: armedRef.current,
  };
}
