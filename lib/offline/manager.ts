/**
 * Offline Manager
 * Handles online/offline state detection, operation queueing, and auto-sync
 */

import { indexedDBManager, STORES } from './indexedDB'

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
   * Queue an operation for later sync
   */
  async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
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
      console.error('Failed to load operation queue:', error)
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
      console.error('Failed to save operation queue:', error)
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
        console.error('Failed to sync operation:', operation, error)
        
        // Increment retry count
        operation.retryCount++
        
        // Remove if max retries exceeded
        if (operation.retryCount >= this.maxRetries) {
          console.error('Max retries exceeded for operation:', operation)
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
   * Execute a queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const response = await fetch(operation.endpoint, {
      method: operation.type,
      headers: {
        'Content-Type': 'application/json',
      },
      body: operation.data ? JSON.stringify(operation.data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Operation failed: ${response.statusText}`)
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
      console.error('Failed to get offline fallback:', error)
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
      console.error('Failed to cache response:', error)
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache(): Promise<void> {
    try {
      const deletedCount = await indexedDBManager.cleanupExpired(STORES.CACHED_RESPONSES)
      console.log(`Cleaned up ${deletedCount} expired cache entries`)
      
      const wisdomDeleted = await indexedDBManager.cleanupExpired(STORES.WISDOM_CACHE)
      console.log(`Cleaned up ${wisdomDeleted} expired wisdom entries`)
    } catch (error) {
      console.error('Failed to cleanup cache:', error)
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
