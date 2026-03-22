/**
 * Gita Verse Cache — AsyncStorage-backed cache with TTL.
 *
 * Caches the last 50 viewed verses with a 7-day TTL.
 * Verses are immutable content so long TTLs are safe.
 * Cache is read-first: if a cached verse exists and is fresh, the API call is skipped.
 *
 * Storage key: 'kiaanverse-gita-cache'
 * Format: { entries: { [key]: { data, expiresAt } }, accessOrder: string[] }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CACHE_STORAGE_KEY = 'kiaanverse-gita-cache';
const MAX_CACHED_VERSES = 50;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

interface CacheStore {
  entries: Record<string, CacheEntry>;
  /** LRU access order — most recently accessed at the end */
  accessOrder: string[];
}

// ---------------------------------------------------------------------------
// In-Memory Mirror
// ---------------------------------------------------------------------------

let memoryCache: CacheStore | null = null;

async function loadCache(): Promise<CacheStore> {
  if (memoryCache) return memoryCache;

  try {
    const raw = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw) as CacheStore;
    }
  } catch {
    // Corrupted cache — start fresh
  }

  if (!memoryCache) {
    memoryCache = { entries: {}, accessOrder: [] };
  }

  return memoryCache;
}

async function persistCache(): Promise<void> {
  if (!memoryCache) return;
  try {
    await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(memoryCache));
  } catch {
    // Storage full or unavailable — cache is best-effort
  }
}

// ---------------------------------------------------------------------------
// LRU Eviction
// ---------------------------------------------------------------------------

function evictIfNeeded(cache: CacheStore): void {
  while (cache.accessOrder.length > MAX_CACHED_VERSES) {
    const oldest = cache.accessOrder.shift();
    if (oldest) {
      delete cache.entries[oldest];
    }
  }
}

function touchAccessOrder(cache: CacheStore, key: string): void {
  cache.accessOrder = cache.accessOrder.filter((k) => k !== key);
  cache.accessOrder.push(key);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Store a verse in the cache with TTL.
 *
 * @param key   Cache key (e.g. "verse:2:47" or "chapter:2")
 * @param data  Data to cache (must be JSON-serializable)
 * @param ttl   Time-to-live in milliseconds (default: 7 days)
 */
export async function setVerse<T>(key: string, data: T, ttl: number = DEFAULT_TTL_MS): Promise<void> {
  const cache = await loadCache();

  cache.entries[key] = {
    data,
    expiresAt: Date.now() + ttl,
  };

  touchAccessOrder(cache, key);
  evictIfNeeded(cache);

  await persistCache();
}

/**
 * Retrieve a cached verse. Returns null if not found or expired.
 *
 * @param key  Cache key
 * @returns    Cached data or null
 */
export async function getVerse<T>(key: string): Promise<T | null> {
  const cache = await loadCache();
  const entry = cache.entries[key];

  if (!entry) return null;

  // Check TTL
  if (Date.now() > entry.expiresAt) {
    delete cache.entries[key];
    cache.accessOrder = cache.accessOrder.filter((k) => k !== key);
    await persistCache();
    return null;
  }

  // Bump to most-recently-used
  touchAccessOrder(cache, key);

  return entry.data as T;
}

/**
 * Clear the entire Gita cache.
 */
export async function clearGitaCache(): Promise<void> {
  memoryCache = { entries: {}, accessOrder: [] };
  await AsyncStorage.removeItem(CACHE_STORAGE_KEY);
}

/**
 * Get the number of cached entries (for diagnostics).
 */
export async function getCacheSize(): Promise<number> {
  const cache = await loadCache();
  return cache.accessOrder.length;
}

export const gitaCache = {
  setVerse,
  getVerse,
  clear: clearGitaCache,
  size: getCacheSize,
} as const;
