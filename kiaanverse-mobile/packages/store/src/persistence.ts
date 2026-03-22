/**
 * Persistence Adapters — Shared storage adapters for Zustand persist middleware.
 *
 * Provides:
 * - SecureStore adapter (OS keychain) for sensitive data (tokens, encrypted content)
 * - AsyncStorage adapter for general app state (preferences, bookmarks, progress)
 * - createAsyncStorage / createSecureStorage helpers for createJSONStorage
 * - hydrateAll() to rehydrate all persisted stores on app launch
 *
 * Usage:
 *   import { createAsyncStorage, createSecureStorage } from './persistence';
 *   persist(immer(...), { storage: createAsyncStorage() })
 */

import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Storage Adapters
// ---------------------------------------------------------------------------

/**
 * SecureStore adapter — stores data in the OS keychain (iOS) / keystore (Android).
 * Use for tokens, encryption keys, and other sensitive material.
 */
export const secureStoreAdapter: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

/**
 * AsyncStorage adapter — stores data in unencrypted local storage.
 * Use for preferences, bookmarks, UI state, and offline caches.
 */
export const asyncStorageAdapter: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};

// ---------------------------------------------------------------------------
// Zustand createJSONStorage Wrappers
// ---------------------------------------------------------------------------

/**
 * Creates a Zustand-compatible JSON storage backed by AsyncStorage.
 * Equivalent to `createJSONStorage(() => AsyncStorage)` but with explicit adapter.
 */
export function createAsyncStorage() {
  return createJSONStorage(() => asyncStorageAdapter);
}

/**
 * Creates a Zustand-compatible JSON storage backed by SecureStore.
 * Use for persisting sensitive state (auth tokens, encrypted data).
 */
export function createSecureStorage() {
  return createJSONStorage(() => secureStoreAdapter);
}

// ---------------------------------------------------------------------------
// Hydrate All Stores
// ---------------------------------------------------------------------------

/**
 * Rehydrate all persisted Zustand stores on app launch.
 *
 * Imports stores lazily to avoid circular dependency issues.
 * Uses Promise.allSettled so a single store failure doesn't block others.
 * Logs errors in __DEV__ but never throws — the app should still boot.
 *
 * Call from root layout useEffect:
 *   useEffect(() => { void hydrateAll(); }, []);
 */
export async function hydrateAll(): Promise<void> {
  // Lazy imports to avoid circular dependencies (stores import from persistence)
  const { useAuthStore } = await import('./authStore');
  const { useGitaStore } = await import('./gitaStore');
  const { useThemeStore } = await import('./themeStore');
  const { useUserPreferencesStore } = await import('./userPreferencesStore');
  const { useSyncQueueStore } = await import('./syncQueue');
  const { useWellnessStore } = await import('./wellnessStore');
  const { useUiStore } = await import('./uiStore');
  const { useChatStore } = await import('./chatStore');
  const { useJourneyStore } = await import('./journeyStore');

  const stores = [
    { name: 'auth', rehydrate: () => useAuthStore.persist.rehydrate() },
    { name: 'gita', rehydrate: () => useGitaStore.persist.rehydrate() },
    { name: 'theme', rehydrate: () => useThemeStore.persist.rehydrate() },
    { name: 'preferences', rehydrate: () => useUserPreferencesStore.persist.rehydrate() },
    { name: 'syncQueue', rehydrate: () => useSyncQueueStore.persist.rehydrate() },
    { name: 'wellness', rehydrate: () => useWellnessStore.persist.rehydrate() },
    { name: 'ui', rehydrate: () => useUiStore.persist.rehydrate() },
    { name: 'chat', rehydrate: () => useChatStore.persist.rehydrate() },
    { name: 'journeys', rehydrate: () => useJourneyStore.persist.rehydrate() },
  ];

  const results = await Promise.allSettled(
    stores.map(async (store) => {
      try {
        await store.rehydrate();
      } catch (err) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(`[hydrateAll] Failed to rehydrate ${store.name}:`, err);
        }
      }
    }),
  );

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`[hydrateAll] ${failed.length}/${stores.length} stores failed to rehydrate`);
    }
  }
}
