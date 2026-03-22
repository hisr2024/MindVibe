/**
 * React Query client factory and AsyncStorage persister for Kiaanverse.
 *
 * Provides a pre-configured QueryClient with:
 * - staleTime: 5 minutes
 * - gcTime (cacheTime): 10 minutes
 * - retry: 2 attempts (skips 4xx errors)
 * - Exponential backoff for retries
 * - Global onError handler with optional Sentry capture
 * - AsyncStorage persister for offline cache persistence
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isApiError } from './errors';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Sentry (optional — soft dependency, same pattern as client.ts)
// ---------------------------------------------------------------------------

interface SentryLike {
  captureException(error: unknown, context?: Record<string, unknown>): void;
}

let _sentry: SentryLike | null | undefined;

function getSentry(): SentryLike | null {
  if (_sentry !== undefined) return _sentry;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _sentry = require('@sentry/react-native') as SentryLike;
  } catch {
    _sentry = null;
  }
  return _sentry;
}

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------

function handleGlobalError(error: unknown): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.error('[QueryClient] Error:', error);
  }

  // Capture 5xx errors to Sentry
  if (isApiError(error) && error.statusCode >= 500) {
    const sentry = getSentry();
    if (sentry) {
      sentry.captureException(error, {
        extra: { statusCode: error.statusCode, code: error.code },
      } as Record<string, unknown>);
    }
  }
}

// ---------------------------------------------------------------------------
// QueryClient Factory
// ---------------------------------------------------------------------------

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleGlobalError,
    }),
    mutationCache: new MutationCache({
      onError: handleGlobalError,
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,   // 5 minutes
        gcTime: 10 * 60 * 1000,     // 10 minutes
        retry: (failureCount, error) => {
          // Max 2 retries
          if (failureCount >= 2) return false;
          // Don't retry 4xx errors (client errors are not transient)
          if (isApiError(error) && error.statusCode >= 400 && error.statusCode < 500) return false;
          return true;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// AsyncStorage Persister
// ---------------------------------------------------------------------------

export function createAppPersister() {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'kiaanverse-query-cache',
  });
}
