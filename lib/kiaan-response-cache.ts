/**
 * KIAAN Response Cache — LRU Cache for Instant Responses
 *
 * Caches orchestrator results for common interaction patterns:
 * - Greetings → instant response (<5ms)
 * - Frequently asked emotional expressions → cached wisdom
 * - Navigation intents → cached routing
 *
 * LRU eviction: 200 entries max, 24-hour TTL.
 * All in-memory — no IndexedDB overhead for hot path.
 */

import type { OrchestratorResult } from '@/lib/kiaan-engine-orchestrator'

interface CacheEntry {
  result: Omit<OrchestratorResult, 'processingTimeMs' | 'powerMode'>
  timestamp: number
  hitCount: number
}

const MAX_ENTRIES = 200
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

class ResponseCache {
  private cache = new Map<string, CacheEntry>()

  /**
   * Get a cached response, or null if not found/expired
   */
  get(input: string): Omit<OrchestratorResult, 'processingTimeMs' | 'powerMode'> | null {
    const key = this.normalizeKey(input)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check TTL
    if (Date.now() - entry.timestamp > TTL_MS) {
      this.cache.delete(key)
      return null
    }

    // Move to end (most recently used)
    this.cache.delete(key)
    entry.hitCount++
    this.cache.set(key, entry)

    return entry.result
  }

  /**
   * Cache an orchestrator result
   */
  set(input: string, result: OrchestratorResult): void {
    const key = this.normalizeKey(input)

    // Don't cache crisis responses or very personal content
    if (result.friendResponse.response.includes('helpline') ||
        result.friendResponse.response.includes('crisis')) {
      return
    }

    // Evict oldest if at capacity
    if (this.cache.size >= MAX_ENTRIES) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    const { processingTimeMs: _pt, powerMode: _pm, ...cacheable } = result

    this.cache.set(key, {
      result: cacheable,
      timestamp: Date.now(),
      hitCount: 0,
    })
  }

  /**
   * Clear all cached responses
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; maxSize: number; hitRate: number } {
    let totalHits = 0
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount
    }
    return {
      size: this.cache.size,
      maxSize: MAX_ENTRIES,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
    }
  }

  // ─── Private ─────────────────────────────────────────────────────

  /**
   * Normalize input for cache key matching.
   * Lowercases, trims, removes punctuation for better hit rate.
   */
  private normalizeKey(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:'"]+/g, '')
      .replace(/\s+/g, ' ')
  }
}

// Singleton
export const responseCache = new ResponseCache()
