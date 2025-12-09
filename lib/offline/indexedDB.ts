/**
 * IndexedDB Storage System for Offline Caching
 * Stores encrypted conversations, Gita verses, and cached responses
 */

const DB_NAME = 'mindvibe_offline'
const DB_VERSION = 1

// Store names
export const STORES = {
  CONVERSATIONS: 'kiaanConversations',
  GITA_VERSES: 'gitaVerses',
  CACHED_RESPONSES: 'cachedResponses',
  JOURNAL_ENTRIES: 'userJournalEntries',
  MOOD_CHECKINS: 'moodCheckIns',
  WISDOM_CACHE: 'wisdomCache',
  OPERATION_QUEUE: 'operationQueue',
} as const

export interface ConversationEntry {
  id: string
  userId: string
  messages: string // Encrypted JSON string
  timestamp: number
  lastModified: number
}

export interface GitaVerse {
  id: string
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  translation: string
  metadata: string // JSON string with search metadata
}

export interface CachedResponse {
  id: string
  key: string
  response: string // Encrypted response
  timestamp: number
  ttl: number // Time to live in milliseconds
}

export interface JournalEntry {
  id: string
  userId: string
  content: string // Encrypted content
  timestamp: number
}

export interface MoodCheckIn {
  id: string
  userId: string
  mood: string
  timestamp: number
  notes?: string
}

export interface WisdomCache {
  id: string
  type: 'daily_wisdom' | 'reset_guidance' | 'meditation'
  content: string
  timestamp: number
  ttl: number
}

class IndexedDBManager {
  private db: IDBDatabase | null = null

  /**
   * Initialize and open the IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
          const conversationsStore = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'id' })
          conversationsStore.createIndex('userId', 'userId', { unique: false })
          conversationsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.GITA_VERSES)) {
          const versesStore = db.createObjectStore(STORES.GITA_VERSES, { keyPath: 'id' })
          versesStore.createIndex('chapter', 'chapter', { unique: false })
          versesStore.createIndex('verse', 'verse', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.CACHED_RESPONSES)) {
          const cachedStore = db.createObjectStore(STORES.CACHED_RESPONSES, { keyPath: 'id' })
          cachedStore.createIndex('key', 'key', { unique: false })
          cachedStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.JOURNAL_ENTRIES)) {
          const journalStore = db.createObjectStore(STORES.JOURNAL_ENTRIES, { keyPath: 'id' })
          journalStore.createIndex('userId', 'userId', { unique: false })
          journalStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.MOOD_CHECKINS)) {
          const moodStore = db.createObjectStore(STORES.MOOD_CHECKINS, { keyPath: 'id' })
          moodStore.createIndex('userId', 'userId', { unique: false })
          moodStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.WISDOM_CACHE)) {
          const wisdomStore = db.createObjectStore(STORES.WISDOM_CACHE, { keyPath: 'id' })
          wisdomStore.createIndex('type', 'type', { unique: false })
          wisdomStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.OPERATION_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.OPERATION_QUEUE, { keyPath: 'id' })
          queueStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * Add or update an item in a store
   */
  async put<T>(storeName: string, item: T): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(item)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get an item from a store by id
   */
  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Get all items from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Get items from a store by index
   */
  async getByIndex<T>(storeName: string, indexName: string, value: string | number): Promise<T[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Delete an item from a store
   */
  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Clear all items from a store
   */
  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get the count of items in a store
   */
  async count(storeName: string): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Clean up expired cached responses
   */
  async cleanupExpired(storeName: string): Promise<number> {
    if (!this.db) await this.init()

    const now = Date.now()
    let deletedCount = 0

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.openCursor()

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const item = cursor.value as CachedResponse | WisdomCache
          if (item.timestamp + item.ttl < now) {
            cursor.delete()
            deletedCount++
          }
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }
    })
  }

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
    if (typeof navigator === 'undefined' || !navigator.storage) {
      return null
    }

    try {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      }
    } catch (error) {
      console.error('Failed to get storage estimate:', error)
      return null
    }
  }
}

// Export singleton instance
export const indexedDBManager = new IndexedDBManager()

// Helper functions for common operations
export async function saveConversation(conversation: ConversationEntry): Promise<void> {
  await indexedDBManager.put(STORES.CONVERSATIONS, conversation)
}

export async function getConversation(id: string): Promise<ConversationEntry | undefined> {
  return indexedDBManager.get<ConversationEntry>(STORES.CONVERSATIONS, id)
}

export async function getUserConversations(userId: string): Promise<ConversationEntry[]> {
  return indexedDBManager.getByIndex<ConversationEntry>(STORES.CONVERSATIONS, 'userId', userId)
}

export async function saveGitaVerse(verse: GitaVerse): Promise<void> {
  await indexedDBManager.put(STORES.GITA_VERSES, verse)
}

export async function getGitaVerse(id: string): Promise<GitaVerse | undefined> {
  return indexedDBManager.get<GitaVerse>(STORES.GITA_VERSES, id)
}

export async function getAllGitaVerses(): Promise<GitaVerse[]> {
  return indexedDBManager.getAll<GitaVerse>(STORES.GITA_VERSES)
}

export async function saveCachedResponse(response: CachedResponse): Promise<void> {
  await indexedDBManager.put(STORES.CACHED_RESPONSES, response)
}

export async function getCachedResponse(key: string): Promise<CachedResponse | undefined> {
  const responses = await indexedDBManager.getByIndex<CachedResponse>(STORES.CACHED_RESPONSES, 'key', key)
  return responses[0]
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  await indexedDBManager.put(STORES.JOURNAL_ENTRIES, entry)
}

export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  return indexedDBManager.getByIndex<JournalEntry>(STORES.JOURNAL_ENTRIES, 'userId', userId)
}

export async function saveMoodCheckIn(mood: MoodCheckIn): Promise<void> {
  await indexedDBManager.put(STORES.MOOD_CHECKINS, mood)
}

export async function getMoodCheckIns(userId: string): Promise<MoodCheckIn[]> {
  return indexedDBManager.getByIndex<MoodCheckIn>(STORES.MOOD_CHECKINS, 'userId', userId)
}

export async function saveWisdom(wisdom: WisdomCache): Promise<void> {
  await indexedDBManager.put(STORES.WISDOM_CACHE, wisdom)
}

export async function getWisdomByType(type: WisdomCache['type']): Promise<WisdomCache[]> {
  return indexedDBManager.getByIndex<WisdomCache>(STORES.WISDOM_CACHE, 'type', type)
}
