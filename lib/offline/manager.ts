/**
 * Offline Manager
 * Handles online/offline state detection, operation queueing, and auto-sync
 *
 * Security: Uses apiFetch for synced operations so CSRF tokens and auth
 * cookies are included automatically. Validates endpoints against an
 * allowlist to prevent queuing requests to arbitrary paths.
 */

import { indexedDBManager, STORES } from './indexedDB'
import { apiFetch } from '@/lib/api'

/** Allowed endpoint prefixes for queued offline operations */
const ALLOWED_ENDPOINT_PREFIXES = [
  '/api/journal/',
  '/api/journeys/',
  '/api/moods',
  '/api/sync/',
  '/api/journey-engine/',
  '/api/companion/',
  '/api/voice-companion/',
  '/api/feedback',
  '/api/community/',
  '/api/notifications/',
  '/api/meditation/',
  '/api/emotional-reset/',
  '/api/karma-reset/',
  '/api/chat/',
]

export interface QueuedOperation {
  id: string
  type: 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  data?: unknown
  timestamp: number
  retryCount: number
}

export interface OfflineState {
  isOnline: boolean
  queuedOperations: QueuedOperation[]
  lastSyncTime: number | null
  syncInProgress: boolean
}

class OfflineManager {
  private listeners: Set<(state: OfflineState) => void> = new Set()
  private state: OfflineState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    queuedOperations: [],
    lastSyncTime: null,
    syncInProgress: false,
  }
  private maxRetries = 3

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
      this.loadQueueFromStorage()
    }
  }

  /**
   * Set up online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.state.isOnline = true
    this.notifyListeners()
    this.syncQueue()
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.state.isOnline = false
    this.notifyListeners()
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.getState())
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }

  /**
   * Get current state
   */
  getState(): OfflineState {
    return { ...this.state }
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.state.isOnline
  }

  /**
   * Queue an operation for later sync.
   * Validates endpoint against allowlist to prevent arbitrary request queuing.
   */
  async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    // Validate endpoint against allowlist
    const isAllowed = ALLOWED_ENDPOINT_PREFIXES.some(
      (prefix) => operation.endpoint.startsWith(prefix)
    )
    if (!isAllowed) {
      console.warn('Offline queue: blocked operation to non-allowed endpoint:', operation.endpoint)
      return
    }

    const queuedOp: QueuedOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now(),
      retryCount: 0,
    }

    this.state.queuedOperations.push(queuedOp)
    await this.saveQueueToStorage()
    this.notifyListeners()
  }

  /**
   * Load queued operations from IndexedDB
   */
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const operations = await indexedDBManager.getAll<QueuedOperation>(STORES.OPERATION_QUEUE)
      this.state.queuedOperations = operations
    } catch (error) {
      console.warn('Failed to load operation queue:', error)
    }
  }

  /**
   * Save queued operations to IndexedDB
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      // Clear existing queue first
      await indexedDBManager.clear(STORES.OPERATION_QUEUE)
      
      // Save all queued operations
      for (const operation of this.state.queuedOperations) {
        await indexedDBManager.put(STORES.OPERATION_QUEUE, operation)
      }
    } catch (error) {
      console.warn('Failed to save operation queue:', error)
    }
  }

  /**
   * Sync queued operations when online
   */
  async syncQueue(): Promise<void> {
    if (!this.state.isOnline || this.state.syncInProgress) {
      return
    }

    if (this.state.queuedOperations.length === 0) {
      return
    }

    this.state.syncInProgress = true
    this.notifyListeners()

    const operations = [...this.state.queuedOperations]
    const successfulOps: string[] = []

    for (const operation of operations) {
      try {
        await this.executeOperation(operation)
        successfulOps.push(operation.id)
      } catch (error) {
        console.warn('Failed to sync operation:', operation, error)
        
        // Increment retry count
        operation.retryCount++
        
        // Remove if max retries exceeded
        if (operation.retryCount >= this.maxRetries) {
          console.warn('Max retries exceeded for operation:', operation)
          successfulOps.push(operation.id) // Remove from queue
        }
      }
    }

    // Remove successful operations from queue
    this.state.queuedOperations = this.state.queuedOperations.filter(
      (op) => !successfulOps.includes(op.id)
    )

    this.state.lastSyncTime = Date.now()
    this.state.syncInProgress = false
    
    await this.saveQueueToStorage()
    this.notifyListeners()
  }

  /**
   * Execute a queued operation.
   * Uses apiFetch to include CSRF tokens and auth cookies automatically.
   * Includes a 30-second timeout to prevent indefinite hangs during sync.
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)

    try {
      const response = await apiFetch(operation.endpoint, {
        method: operation.type,
        headers: { 'Content-Type': 'application/json' },
        body: operation.data ? JSON.stringify(operation.data) : undefined,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Operation failed: ${response.status} ${response.statusText}`)
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Get offline fallback response
   */
  async getOfflineFallback(endpoint: string): Promise<unknown | null> {
    try {
      // Try to get cached response
      const responses = await indexedDBManager.getByIndex(
        STORES.CACHED_RESPONSES,
        'key',
        endpoint
      )
      
      if (responses.length > 0) {
        const cached = responses[0] as { timestamp: number; ttl: number; response: string }
        const now = Date.now()
        
        // Check if cache is still valid
        if (cached.timestamp + cached.ttl > now) {
          return JSON.parse(cached.response)
        }
      }
      
      return null
    } catch (error) {
      console.warn('Failed to get offline fallback:', error)
      return null
    }
  }

  /**
   * Cache a response for offline use
   */
  async cacheResponse(key: string, response: unknown, ttl: number = 86400000): Promise<void> {
    try {
      await indexedDBManager.put(STORES.CACHED_RESPONSES, {
        id: `cache_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        key,
        response: JSON.stringify(response),
        timestamp: Date.now(),
        ttl,
      })
    } catch (error) {
      console.warn('Failed to cache response:', error)
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache(): Promise<void> {
    try {
      await indexedDBManager.cleanupExpired(STORES.CACHED_RESPONSES)
      await indexedDBManager.cleanupExpired(STORES.WISDOM_CACHE)
    } catch (error) {
      console.warn('Failed to cleanup cache:', error)
    }
  }

  /**
   * Get queue count
   */
  getQueueCount(): number {
    return this.state.queuedOperations.length
  }

  /**
   * Clear all queued operations (use with caution!)
   */
  async clearQueue(): Promise<void> {
    this.state.queuedOperations = []
    await this.saveQueueToStorage()
    this.notifyListeners()
  }

  /**
   * Manually trigger sync
   */
  async forceSyncNow(): Promise<void> {
    if (this.state.isOnline) {
      await this.syncQueue()
    }
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager()

// Auto-cleanup cache every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    offlineManager.cleanupCache()
  }, 3600000) // 1 hour
}
