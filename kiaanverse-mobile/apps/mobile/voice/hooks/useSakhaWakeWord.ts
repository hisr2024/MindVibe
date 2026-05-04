/**
 * useSakhaWakeWord — RN hook for the "Hey Sakha" always-on wake-word.
 *
 * Subscribes to the SakhaVoiceWakeWord native event and (optionally)
 * fires a callback when the user says one of the configured wake
 * phrases. Toggling the feature is a thin wrapper around
 * NativeModules.SakhaVoice.enableWakeWord/disableWakeWord — the
 * native side does the actual recognizer lifecycle and state-machine
 * pause/resume.
 *
 * Usage in a screen (e.g. /voice-companion):
 *
 *   const session = useVoiceSession({ backendBaseUrl, getAccessToken });
 *   const wake = useSakhaWakeWord({
 *     onWake: () => session.activate(),
 *     initialEnabled: true,
 *   });
 *   <Switch value={wake.enabled} onValueChange={wake.setEnabled} />
 *
 * Lifecycle:
 *   - Mount: subscribes to SakhaVoiceWakeWord.
 *   - Unmount: removes the listener but does NOT auto-disable —
 *     the user's preference outlives the screen.
 *   - The native manager auto-pauses the wake recognizer while a turn
 *     is in progress, so we don't coordinate it client-side.
 *
 * Privacy:
 *   - The phrase argument is the normalized matched phrase
 *     ("hey sakha"), never the raw transcript.
 *   - This hook never persists the phrase. Consumers should not log
 *     or display anything beyond a generic "Sakha is listening" toast.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import {
  SAKHA_VOICE_EVENTS,
  type SakhaVoiceNativeModule,
  type SakhaWakeWordEvent,
} from '../../types/sakhaVoice';

const Native = NativeModules.SakhaVoice as SakhaVoiceNativeModule | undefined;

export interface UseSakhaWakeWordOptions {
  /**
   * Called when the user said one of the wake phrases. The native
   * manager has ALREADY auto-activated a turn — this callback is
   * for screen-level UX (analytics, toast, scroll-to-top, etc.).
   * If your turn flow is JS-driven, also call sakha.activate() here.
   */
  onWake?: (phrase: string) => void;

  /**
   * Initial enabled state. Default false — user must opt in.
   */
  initialEnabled?: boolean;
}

export interface SakhaWakeWordAPI {
  enabled: boolean;
  setEnabled: (next: boolean) => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  /** Whether the native module is available on this platform. */
  isAvailable: boolean;
}

export function useSakhaWakeWord(
  options: UseSakhaWakeWordOptions = {},
): SakhaWakeWordAPI {
  const { onWake, initialEnabled = false } = options;
  const [enabled, setEnabledState] = useState<boolean>(false);
  const onWakeRef = useRef<typeof onWake>(onWake);
  onWakeRef.current = onWake;

  const isAvailable = Native != null && Platform.OS === 'android';

  useEffect(() => {
    if (!Native) return undefined;
    const emitter = new NativeEventEmitter(Native as never);
    const sub = emitter.addListener(
      SAKHA_VOICE_EVENTS.WAKE_WORD,
      (event: SakhaWakeWordEvent) => {
        try {
          onWakeRef.current?.(event.phrase);
        } catch {
          // Swallow — consumer callback throwing must not break the bridge
          // or the next wake-word fire.
        }
      },
    );
    return () => sub.remove();
  }, []);

  const enable = useCallback(async (): Promise<void> => {
    if (!Native) return;
    await Native.enableWakeWord();
    setEnabledState(true);
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    if (!Native) return;
    await Native.disableWakeWord();
    setEnabledState(false);
  }, []);

  const setEnabled = useCallback(
    async (next: boolean): Promise<void> => {
      if (next) await enable();
      else await disable();
    },
    [enable, disable],
  );

  useEffect(() => {
    if (!isAvailable) return;
    if (initialEnabled) {
      void enable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvailable]);

  return { enabled, setEnabled, enable, disable, isAvailable };
}
