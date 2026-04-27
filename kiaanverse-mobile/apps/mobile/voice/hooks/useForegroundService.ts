/**
 * useForegroundService — start/stop the SakhaForegroundService that
 * keeps the WSS audio session alive when the user backgrounds the app.
 *
 * Bridges to the Kotlin `SakhaForegroundService` static start()/stop()
 * helpers via a tiny native module. Falls back to a no-op when the
 * native module isn't loaded (e.g. running in a stripped dev build).
 */

import { useCallback, useEffect, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';

interface SakhaForegroundServiceNativeSpec {
  start(): Promise<void>;
  stop(): Promise<void>;
}

const Native: SakhaForegroundServiceNativeSpec | null =
  Platform.OS === 'android'
    ? (NativeModules.SakhaForegroundService as SakhaForegroundServiceNativeSpec | null) ?? null
    : null;

export interface ForegroundServiceAPI {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isRunning: () => boolean;
}

export function useForegroundService(): ForegroundServiceAPI {
  const runningRef = useRef<boolean>(false);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    if (!Native) {
      // Dev/iOS path — service does not exist. Mark running so the
      // hook's contract is unchanged from the caller's perspective.
      runningRef.current = true;
      return;
    }
    try {
      await Native.start();
      runningRef.current = true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[useForegroundService] start failed', e);
    }
  }, []);

  const stop = useCallback(async () => {
    if (!runningRef.current) return;
    runningRef.current = false;
    if (!Native) return;
    try {
      await Native.stop();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[useForegroundService] stop failed', e);
    }
  }, []);

  // Always release on unmount — leaving a foreground service running
  // after the user navigates away is the worst-case battery scenario.
  useEffect(() => {
    return () => {
      if (runningRef.current && Native) {
        Native.stop().catch(() => {});
        runningRef.current = false;
      }
    };
  }, []);

  return { start, stop, isRunning: () => runningRef.current };
}
