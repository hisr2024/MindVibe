/**
 * useSakhaWakeWord — RN hook for the "Hey Sakha" always-on wake-word.
 *
 * Subscribes to the SakhaVoiceWakeWord native event and (optionally)
 * starts a conversational session via useVoiceSession when the user
 * says "Hey Sakha". Toggling the feature is a thin wrapper around
 * NativeModules.SakhaVoice.enableWakeWord/disableWakeWord — the
 * native side does the actual recognizer lifecycle and state-machine
 * pause/resume.
 *
 * Usage:
 *
 *   const wake = useSakhaWakeWord({
 *     onWake: () => session.start({ langHint: 'en', userRegion: 'GLOBAL' }),
 *   });
 *
 *   // Toggle from a settings switch
 *   <Switch value={wake.enabled} onValueChange={wake.setEnabled} />
 *
 * Lifecycle:
 *   - On mount: subscribes to the SakhaVoiceWakeWord event.
 *   - On unmount: removes the listener but does NOT auto-disable —
 *     the user's preference outlives the screen. Call setEnabled(false)
 *     explicitly to release the recognizer.
 *   - The native manager auto-pauses the wake recognizer while a turn
 *     is in progress, so we don't need to coordinate it client-side.
 *
 * Privacy:
 *   - The event payload's `phrase` is the normalized matched phrase
 *     ("hey sakha"), never the surrounding raw transcript.
 *   - This hook never persists the phrase; consumers should not log
 *     or display anything beyond a generic "Sakha is listening" toast.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

interface SakhaWakeWordEvent {
  phrase: string;
}

interface SakhaVoiceNative {
  enableWakeWord(): Promise<void>;
  disableWakeWord(): Promise<void>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const Native = NativeModules.SakhaVoice as SakhaVoiceNative | undefined;

export interface UseSakhaWakeWordOptions {
  /**
   * Called when the user said one of the wake phrases. The native
   * manager has ALREADY auto-activated a turn — this callback is
   * for screen-level UX (analytics, toast, scroll-to-top, etc.),
   * not for triggering session.start() since that would race with
   * the native auto-activation.
   *
   * If your app's session is JS-driven (apps/sakha-mobile via WSS,
   * not the manager-driven turn flow), call session.start() here.
   */
  onWake?: (phrase: string) => void;

  /**
   * Initial enabled state. Default false — user must opt in. The
   * hook respects this on mount; subsequent setEnabled calls override.
   */
  initialEnabled?: boolean;
}

export interface SakhaWakeWordAPI {
  enabled: boolean;
  setEnabled: (next: boolean) => Promise<void>;
  /** Imperative one-shot enable — useful from a permission-granted callback. */
  enable: () => Promise<void>;
  /** Imperative one-shot disable — useful from a logout / settings reset. */
  disable: () => Promise<void>;
  /** Whether the native module is available on this platform. iOS Phase 6 fills it in. */
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

  // Subscribe to the native wake event.
  useEffect(() => {
    if (!Native) return undefined;
    const emitter = new NativeEventEmitter(Native as never);
    const sub = emitter.addListener(
      'SakhaVoiceWakeWord',
      (event: SakhaWakeWordEvent) => {
        try {
          onWakeRef.current?.(event.phrase);
        } catch {
          // Swallow — the consumer's callback throwing must not break
          // the bridge or the next wake-word fire.
        }
      },
    );
    return () => sub.remove();
  }, []);

  // Resolve initial state once the native module is known to exist.
  useEffect(() => {
    if (!isAvailable) return;
    if (initialEnabled) {
      void enable();
    }
    // Intentionally no cleanup that toggles disable — the user's choice
    // persists across screen unmount. Settings UI is the off-switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvailable]);

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

  return { enabled, setEnabled, enable, disable, isAvailable };
}
