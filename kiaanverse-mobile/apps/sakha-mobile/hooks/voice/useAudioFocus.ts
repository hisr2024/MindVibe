/**
 * useAudioFocus — manages audio focus + Bluetooth SCO routing.
 *
 * The actual focus management is done natively by KiaanAudioPlayer (via
 * AudioAttributes set in withKiaanAudioFocus plugin meta-data). What
 * this hook does is set the Expo Audio mode at the JS layer so
 * expo-av's Recording also respects the same policy:
 *   • shouldDuckAndroid = true   — match GAIN_TRANSIENT_MAY_DUCK
 *   • allowsRecordingIOS = true  — recording stays alive on iOS dev
 *   • playsInSilentModeIOS = true — Sakha must be heard even with mute switch
 *   • staysActiveInBackground = false — handled by SakhaForegroundService instead
 */

import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export interface AudioFocusAPI {
  acquire: () => Promise<void>;
  release: () => Promise<void>;
  isHeld: () => boolean;
}

export function useAudioFocus(): AudioFocusAPI {
  const heldRef = useRef<boolean>(false);

  const acquire = useCallback(async () => {
    if (heldRef.current) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: Audio.InterruptionModeIOS.MixWithOthers,
      });
      heldRef.current = true;
    } catch {
      // Audio mode set failures are non-fatal — KiaanAudioPlayer's
      // native AudioAttributes still take effect.
    }
  }, []);

  const release = useCallback(async () => {
    if (!heldRef.current) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
    } catch {
      /* ignore */
    }
    heldRef.current = false;
  }, []);

  // Auto-release on unmount
  useEffect(() => {
    return () => {
      if (heldRef.current) {
        Audio.setAudioModeAsync({ shouldDuckAndroid: false }).catch(() => {});
        heldRef.current = false;
      }
    };
  }, []);

  return { acquire, release, isHeld: () => heldRef.current };
}
