/**
 * Conversation History - IndexedDB-backed persistent conversation storage
 *
 * Provides durable conversation storage that survives browser restarts,
 * with search, filtering, and export capabilities.
 *
 * Features:
 * - Full conversation persistence in IndexedDB
 * - Search by keyword across all messages
 * - Filter by date range, emotion, or message type
 * - Export conversations as text or JSON
 * - Bookmarking important messages
 * - Session-based grouping
 */

export interface StoredMessage {
  id: string
  sessionId: string
  role: 'user' | 'kiaan' | 'system'
  content: string
  timestamp: number         // Unix timestamp for indexing
  emotion?: string
  verse?: { chapter: number; verse: number; text: string }
  bookmarked?: boolean
  type?: string
}

export interface ConversationSession {
  id: string
  startTime: number
  endTime?: number
  messageCount: number
  dominantEmotion?: string
  summary?: string
}

export interface SearchResult {
  message: StoredMessage
  matchContext: string       // Surrounding text around match
}

const DB_NAME = 'kiaan_history'
const DB_VERSION = 1

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains('messages')) {
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' })
        messageStore.createIndex('sessionId', 'sessionId', { unique: false })
        messageStore.createIndex('timestamp', 'timestamp', { unique: false })
        messageStore.createIndex('emotion', 'emotion', { unique: false })
        messageStore.createIndex('bookmarked', 'bookmarked', { unique: false })
        messageStore.createIndex('role', 'role', { unique: false })
      }

      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
        sessionStore.createIndex('startTime', 'startTime', { unique: false })
      }
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onerror = () => reject(request.error)
  })
}

// ─── Session Management ─────────────────────────────────────────────────────

let currentSessionId: string | null = null

/**
 * Start a new conversation session
 */
export async function startHistorySession(): Promise<string> {
  const db = await openDB()
  const sessionId = `session_${Date.now()}`
  currentSessionId = sessionId

  const session: ConversationSession = {
    id: sessionId,
    startTime: Date.now(),
    messageCount: 0,
  }

  const tx = db.transaction('sessions', 'readwrite')
  tx.objectStore('sessions').put(session)

  return sessionId
}

/**
 * End the current session
 */
export async function endHistorySession(summary?: string): Promise<void> {
  if (!currentSessionId) return

  try {
    const db = await openDB()
    const tx = db.transaction('sessions', 'readwrite')
    const store = tx.objectStore('sessions')

    const request = store.get(currentSessionId)
    request.onsuccess = () => {
      const session = request.result as ConversationSession | undefined
      if (session && session.id) {
        session.endTime = Date.now()
        if (summary) session.summary = summary
        store.put(session)
      }
    }
  } catch {
    // Non-fatal
  }

  currentSessionId = null
}

// ─── Message Storage ─────────────────────────────────────────────────────────

/**
 * Store a message in the conversation history
 */
export async function storeMessage(message: Omit<StoredMessage, 'sessionId'>): Promise<void> {
  try {
    const db = await openDB()
    const sessionId = currentSessionId || `untracked_${new Date().toDateString()}`

    const storedMessage: StoredMessage = {
      ...message,
      sessionId,
      timestamp: typeof message.timestamp === 'number' ? message.timestamp : Date.now(),
    }

    const tx = db.transaction(['messages', 'sessions'], 'readwrite')
    tx.objectStore('messages').put(storedMessage)

    // Update session message count
    if (currentSessionId) {
      const sessionStore = tx.objectStore('sessions')
      const req = sessionStore.get(currentSessionId)
      req.onsuccess = () => {
        const session = req.result as ConversationSession | undefined
        if (session && session.id) {
          session.messageCount++
          if (message.emotion) session.dominantEmotion = message.emotion
          sessionStore.put(session)
        }
      }
    }
  } catch {
    // Non-fatal - don't break the conversation
  }
}

/**
 * Toggle bookmark on a message
 */
export async function toggleBookmark(messageId: string): Promise<boolean> {
  try {
    const db = await openDB()
    const tx = db.transaction('messages', 'readwrite')
    const store = tx.objectStore('messages')

    return new Promise((resolve) => {
      const request = store.get(messageId)
      request.onsuccess = () => {
        const msg = request.result as StoredMessage | undefined
        if (msg && msg.id) {
          msg.bookmarked = !msg.bookmarked
          store.put(msg)
          resolve(msg.bookmarked)
        } else {
          resolve(false)
        }
      }
      request.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

// ─── Retrieval & Search ─────────────────────────────────────────────────────

/**
 * Get recent messages (paginated)
 */
export async function getRecentMessages(limit: number = 50, offset: number = 0): Promise<StoredMessage[]> {
  try {
    const db = await openDB()
    const tx = db.transaction('messages', 'readonly')
    const index = tx.objectStore('messages').index('timestamp')

    return new Promise((resolve) => {
      const messages: StoredMessage[] = []
      let skipped = 0

      const request = index.openCursor(null, 'prev')  // Newest first
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor || messages.length >= limit) {
          resolve(messages)
          return
        }

        if (skipped < offset) {
          skipped++
          cursor.continue()
          return
        }

        messages.push(cursor.value)
        cursor.continue()
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

/**
 * Get all bookmarked messages
 */
export async function getBookmarkedMessages(): Promise<StoredMessage[]> {
  try {
    const db = await openDB()
    const tx = db.transaction('messages', 'readonly')
    const store = tx.objectStore('messages')

    return new Promise((resolve) => {
      const results: StoredMessage[] = []
      const request = store.openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) { resolve(results); return }
        if ((cursor.value as StoredMessage).bookmarked) results.push(cursor.value)
        cursor.continue()
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

/**
 * Search messages by keyword
 */
export async function searchMessages(keyword: string, limit: number = 20): Promise<SearchResult[]> {
  try {
    const db = await openDB()
    const tx = db.transaction('messages', 'readonly')
    const store = tx.objectStore('messages')

    return new Promise((resolve) => {
      const results: SearchResult[] = []
      const lower = keyword.toLowerCase()

      const request = store.openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor || results.length >= limit) {
          resolve(results)
          return
        }

        const msg = cursor.value as StoredMessage
        const contentLower = msg.content.toLowerCase()
        const matchIndex = contentLower.indexOf(lower)

        if (matchIndex !== -1) {
          // Extract context around the match
          const start = Math.max(0, matchIndex - 40)
          const end = Math.min(msg.content.length, matchIndex + keyword.length + 40)
          const matchContext = (start > 0 ? '...' : '') +
            msg.content.slice(start, end) +
            (end < msg.content.length ? '...' : '')

          results.push({ message: msg, matchContext })
        }

        cursor.continue()
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

/**
 * Get messages filtered by emotion
 */
export async function getMessagesByEmotion(emotion: string, limit: number = 30): Promise<StoredMessage[]> {
  try {
    const db = await openDB()
    const tx = db.transaction('messages', 'readonly')
    const index = tx.objectStore('messages').index('emotion')

    return new Promise((resolve) => {
      const request = index.getAll(emotion)
      request.onsuccess = () => {
        const results = request.result || []
        resolve(results.slice(-limit))  // Most recent N
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

/**
 * Get all conversation sessions
 */
export async function getSessions(limit: number = 20): Promise<ConversationSession[]> {
  try {
    const db = await openDB()
    const tx = db.transaction('sessions', 'readonly')
    const index = tx.objectStore('sessions').index('startTime')

    return new Promise((resolve) => {
      const sessions: ConversationSession[] = []
      const request = index.openCursor(null, 'prev')  // Newest first

      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor || sessions.length >= limit) {
          resolve(sessions)
          return
        }
        sessions.push(cursor.value)
        cursor.continue()
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

/**
 * Export conversation history as plain text
 */
export async function exportAsText(): Promise<string> {
  const messages = await getRecentMessages(500)  // Last 500 messages
  const reversed = messages.reverse()  // Chronological order

  let text = 'KIAAN Conversation History\n'
  text += `Exported: ${new Date().toLocaleString()}\n`
  text += '━'.repeat(50) + '\n\n'

  let currentDate = ''
  for (const msg of reversed) {
    const date = new Date(msg.timestamp).toLocaleDateString()
    if (date !== currentDate) {
      currentDate = date
      text += `\n── ${date} ──\n\n`
    }

    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const role = msg.role === 'user' ? 'You' : msg.role === 'kiaan' ? 'KIAAN' : 'System'
    text += `[${time}] ${role}: ${msg.content}\n`

    if (msg.verse) {
      text += `  📖 BG ${msg.verse.chapter}.${msg.verse.verse}: ${msg.verse.text}\n`
    }
    if (msg.bookmarked) {
      text += `  ⭐ Bookmarked\n`
    }
    text += '\n'
  }

  return text
}

/**
 * Export conversation history as JSON
 */
export async function exportAsJSON(): Promise<string> {
  const messages = await getRecentMessages(500)
  const sessions = await getSessions(50)

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    sessions,
    messages: messages.reverse(),
  }, null, 2)
}

/**
 * Get total message count
 */
export async function getMessageCount(): Promise<number> {
  try {
    const db = await openDB()
    const tx = db.transaction('messages', 'readonly')
    const store = tx.objectStore('messages')

    return new Promise((resolve) => {
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(0)
    })
  } catch {
    return 0
  }
}
