/**
 * TranslationCache - LRU Cache Manager for Translation Results
 * 
 * Manages translation caches using an in-memory LRU cache with
 * persistent storage support (localStorage for web, AsyncStorage for mobile).
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  persistKey?: string; // Key for persistent storage
  enablePersistence?: boolean;
}

export class TranslationCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private options: CacheOptions;
  private accessOrder: string[]; // Track access order for LRU

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxSize: options.maxSize || 1000,
      ttl: options.ttl || 24 * 60 * 60 * 1000, // Default 24 hours
      persistKey: options.persistKey || 'translation_cache',
      enablePersistence: options.enablePersistence !== false
    };

    this.cache = new Map();
    this.accessOrder = [];

    // Load from persistent storage if enabled
    if (this.options.enablePersistence) {
      this.loadFromStorage();
    }
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    // Update access tracking for LRU
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    // Move to end of access order (most recently used)
    this.updateAccessOrder(key);

    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T): void {
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);

    // Persist if enabled
    if (this.options.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    
    // Remove from access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    if (result && this.options.enablePersistence) {
      this.saveToStorage();
    }

    return result;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];

    if (this.options.enablePersistence) {
      this.clearStorage();
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let totalAccesses = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    this.cache.forEach(entry => {
      totalAccesses += entry.accessCount;
      
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      
      if (newestTimestamp === null || entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    });

    const avgAccessCount = this.cache.size > 0 ? totalAccesses / this.cache.size : 0;

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: avgAccessCount,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp
    };
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    let pruned = 0;
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
          this.accessOrder.splice(index, 1);
        }
        
        pruned++;
      }
    });

    if (pruned > 0 && this.options.enablePersistence) {
      this.saveToStorage();
    }

    return pruned;
  }

  /**
   * Private helper methods
   */

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.options.ttl;
  }

  private updateAccessOrder(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    // Remove least recently used (first in access order)
    const lruKey = this.accessOrder[0];
    this.cache.delete(lruKey);
    this.accessOrder.shift();
  }

  /**
   * Persistent storage methods
   */

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.options.persistKey!);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      // Restore cache entries
      if (data.cache) {
        Object.entries(data.cache).forEach(([key, entry]) => {
          this.cache.set(key, entry as CacheEntry<T>);
        });
      }

      // Restore access order
      if (data.accessOrder) {
        this.accessOrder = data.accessOrder;
      }

      // Prune expired entries after loading
      this.prune();
    } catch (error) {
      console.error('Failed to load translation cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        cache: Object.fromEntries(this.cache.entries()),
        accessOrder: this.accessOrder,
        savedAt: Date.now()
      };

      localStorage.setItem(this.options.persistKey!, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save translation cache to storage:', error);
      
      // If storage is full, try to clear old entries and retry
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.evictLRU();
        try {
          const data = {
            cache: Object.fromEntries(this.cache.entries()),
            accessOrder: this.accessOrder,
            savedAt: Date.now()
          };
          localStorage.setItem(this.options.persistKey!, JSON.stringify(data));
        } catch (retryError) {
          console.error('Failed to save cache even after eviction:', retryError);
        }
      }
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.options.persistKey!);
    } catch (error) {
      console.error('Failed to clear translation cache from storage:', error);
    }
  }

  /**
   * Export/Import methods for debugging and backup
   */

  export(): string {
    const data = {
      cache: Object.fromEntries(this.cache.entries()),
      accessOrder: this.accessOrder,
      options: this.options,
      exportedAt: Date.now()
    };
    return JSON.stringify(data);
  }

  import(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      this.cache.clear();
      this.accessOrder = [];

      if (data.cache) {
        Object.entries(data.cache).forEach(([key, entry]) => {
          this.cache.set(key, entry as CacheEntry<T>);
        });
      }

      if (data.accessOrder) {
        this.accessOrder = data.accessOrder;
      }

      this.prune();
      
      if (this.options.enablePersistence) {
        this.saveToStorage();
      }

      return true;
    } catch (error) {
      console.error('Failed to import cache data:', error);
      return false;
    }
  }
}

// Export singleton instance for translation cache
export const translationCache = new TranslationCache({
  maxSize: 1000,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  persistKey: 'mindvibe_translation_cache',
  enablePersistence: true
});

export default TranslationCache;
