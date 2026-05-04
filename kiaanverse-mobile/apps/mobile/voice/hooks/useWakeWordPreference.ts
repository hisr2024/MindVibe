/**
 * useWakeWordPreference — persisted opt-in for "Hey Sakha" ambient
 * wake-word listening.
 *
 * Why opt-in (not opt-out):
 *   • RECORD_AUDIO is the most-sensitive runtime permission on
 *     Android — defaulting to "always listening" without explicit
 *     user consent is hostile, and Play Console flags it.
 *   • Battery cost is non-zero (~3-4% / hour with the recognizer
 *     warm). Users on Tier C/D devices feel this immediately.
 *   • The spec calls for "ambient presence", not "ambient
 *     surveillance" — the user invites Sakha in, doesn't get
 *     ambushed by it.
 *
 * Persistence: AsyncStorage. We keep it as a plain boolean rather
 * than threading it through the voice store because:
 *   • the preference outlives the voice store's session lifecycle,
 *   • it must be readable BEFORE the voice store hydrates (the
 *     ambient mount checks it on first render),
 *   • zustand-persist would couple wake-word lifecycle to voice
 *     store rehydration timing.
 *
 * Storage key is namespaced under `kiaan.voice.` so it's obvious in
 * any AsyncStorage dump and won't collide with future flags.
 *
 * Default: false. The user must visit the wake-word toggle (Settings
 * or the FAB long-press menu) to turn it on the first time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'kiaan.voice.wakeWordEnabled';

export interface WakeWordPreferenceAPI {
  /** True iff the user has explicitly opted in. */
  enabled: boolean;
  /** True once we've finished reading AsyncStorage. UI should not
   *  flip the wake-word on/off until this is true to avoid a flash
   *  of "enabled" state on cold start. */
  hydrated: boolean;
  /** Persist a new preference. Returns once the write completes. */
  setEnabled: (next: boolean) => Promise<void>;
}

export function useWakeWordPreference(): WakeWordPreferenceAPI {
  const [enabled, setEnabledState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Guard against late writes after unmount (cold-start race where
  // the AsyncStorage read resolves after the component already
  // unmounted because the user signed out mid-hydration).
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!aliveRef.current) return;
        setEnabledState(raw === 'true');
        setHydrated(true);
      })
      .catch(() => {
        // AsyncStorage failures are non-fatal — fall through to the
        // default (off). Hydrated still flips so callers don't wait
        // forever.
        if (!aliveRef.current) return;
        setHydrated(true);
      });
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const setEnabled = useCallback(async (next: boolean): Promise<void> => {
    setEnabledState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
    } catch {
      // If the write fails, the in-memory state still reflects the
      // user's intent for the rest of the session. Worst case: their
      // preference resets on next cold start.
    }
  }, []);

  return { enabled, hydrated, setEnabled };
}
