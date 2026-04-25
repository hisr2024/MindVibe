/**
 * useArrivalStatus — tracks whether the user has seen the Sacred Arrival
 * ceremony (the 7-act splash + 5-page darshan) on this device.
 *
 * Stored in AsyncStorage as a simple boolean flag. Multiple components
 * subscribe to the same module-level state so writes from any caller are
 * observed immediately by every other hook instance — without this, the
 * AuthGate in the root layout would keep re-routing the user back to
 * /arrival after the ceremony marks itself complete.
 *
 * Persists independently from authStore.isOnboarded (which tracks the
 * post-login preferences capture) because the arrival ceremony is device-
 * level, not account-level — a returning user on a new device still
 * deserves the darshan.
 */
import { useCallback, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kiaanverse/has-seen-arrival';

// ---------------------------------------------------------------------------
// Module-level state + subscription set. A single AsyncStorage read is
// triggered lazily on first hook mount; every subsequent mount sees the
// cached value immediately.
//
// Why useSyncExternalStore (not useState + forceRender):
//   The previous implementation called listeners synchronously from inside
//   the AsyncStorage `.then` microtask. When that microtask resolved while
//   React was still committing the initial mount (which is the normal cold-
//   start sequence — RootLayout commits, then microtasks flush), the
//   forceRender setState raced React's commit phase and threw the scheduler
//   invariant "Should not already be working" (React error #327), which
//   expo-updates' error-recovery thread then escalated to a fatal crash on
//   first launch. useSyncExternalStore is the React 18 API explicitly built
//   to subscribe a component to external mutable state without that race —
//   it batches notifications correctly against the commit phase.
// ---------------------------------------------------------------------------

let cachedValue: boolean | null = null;
let loadPromise: Promise<void> | null = null;
const subscribers = new Set<() => void>();

function notify(): void {
  subscribers.forEach((listener) => listener());
}

function ensureLoaded(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((value) => {
      // If a concurrent writeFlag() landed before the read resolved, respect
      // its write — it represents an explicit user action (completing the
      // ceremony) and must not be clobbered by a stale storage snapshot.
      if (cachedValue !== null) return;
      cachedValue = value === 'true';
      notify();
    })
    .catch(() => {
      // Storage unavailable — fail open so the app is usable. The ceremony
      // is a delight, not a gate.
      if (cachedValue !== null) return;
      cachedValue = true;
      notify();
    });
  return loadPromise;
}

async function writeFlag(seen: boolean): Promise<void> {
  cachedValue = seen;
  notify();
  try {
    if (seen) {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Non-critical — the next cold start will recompute from whatever
    // persisted state exists (or re-play the ceremony, which is acceptable).
  }
}

function subscribe(listener: () => void): () => void {
  subscribers.add(listener);
  // Kick off the lazy read on first subscription. Safe to call repeatedly —
  // ensureLoaded() deduplicates on loadPromise.
  void ensureLoaded();
  return () => {
    subscribers.delete(listener);
  };
}

function getSnapshot(): boolean | null {
  return cachedValue;
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

export interface ArrivalStatus {
  /** True once the persisted flag has been read. */
  readonly isLoaded: boolean;
  /** True when the ceremony has already played on this device. */
  readonly hasSeenArrival: boolean;
  /** Mark the ceremony complete — persists immediately, updates every subscriber. */
  readonly markArrivalSeen: () => Promise<void>;
  /** Clear the flag — used by developer "replay the darshan" affordances. */
  readonly resetArrivalStatus: () => Promise<void>;
}

export function useArrivalStatus(): ArrivalStatus {
  // Same snapshot fn for client + server: this app has no SSR, and a stable
  // identity-equal snapshot keeps useSyncExternalStore from re-subscribing.
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const markArrivalSeen = useCallback((): Promise<void> => {
    return writeFlag(true);
  }, []);
  const resetArrivalStatus = useCallback((): Promise<void> => {
    return writeFlag(false);
  }, []);

  return {
    isLoaded: value !== null,
    hasSeenArrival: value === true,
    markArrivalSeen,
    resetArrivalStatus,
  };
}
