/**
 * useCrisisHandler — full-screen, non-dismissible crisis flow.
 *
 * Per spec, when a crisis frame arrives:
 *   1. Stop the player IMMEDIATELY (player.stopImmediately())
 *   2. Stop the recorder IMMEDIATELY
 *   3. Heavy haptic (so a user mid-utterance feels the shift)
 *   4. Show a full-screen overlay with the helplines + audio_url
 *      from the server. Non-dismissible without explicit ack.
 *   5. The pre-rendered safety audio (Part 11) plays from the
 *      server-provided audio_url.
 *
 * This hook owns steps 1-3 + the haptic. Step 4 is rendered by
 * CrisisOverlay (Part 10) which subscribes to `useVoiceStore.crisis`.
 * Step 5 plays via expo-av Sound directly (KiaanAudioPlayer is for
 * WSS audio chunks only).
 */

import { useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import type { Sound } from 'expo-av/build/Audio/Sound';
import { KiaanAudioPlayer } from '../lib/native/KiaanAudioPlayer';
import { useVoiceStore } from '../stores/voiceStore';

export interface CrisisHandlerAPI {
  /** Manually stop the audio AND clear the crisis state. The user
   *  taps the "I am safe" or "Call now" CTA in the overlay; the
   *  CTA calls this. */
  acknowledge: () => Promise<void>;
}

export function useCrisisHandler(): CrisisHandlerAPI {
  const crisis = useVoiceStore((s) => s.crisis);
  const acknowledgeCrisis = useVoiceStore((s) => s.acknowledgeCrisis);
  const safetySoundRef = useRef<Sound | null>(null);

  // Stop player + heavy haptic + play safety audio
  useEffect(() => {
    if (!crisis) return;
    KiaanAudioPlayer.stop().catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

    let cancelled = false;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: crisis.audioUrl },
          { shouldPlay: true, volume: 1.0 },
        );
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        safetySoundRef.current = sound;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[useCrisisHandler] safety audio play failed', e);
      }
    })();

    return () => {
      cancelled = true;
      const s = safetySoundRef.current;
      safetySoundRef.current = null;
      if (s) s.unloadAsync().catch(() => {});
    };
  }, [crisis]);

  const acknowledge = useCallback(async () => {
    const s = safetySoundRef.current;
    safetySoundRef.current = null;
    if (s) await s.unloadAsync().catch(() => {});
    acknowledgeCrisis();
  }, [acknowledgeCrisis]);

  return { acknowledge };
}
