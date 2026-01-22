/**
 * Vector-Based Conversation Memory System
 *
 * World-class semantic memory for KIAAN VOICE:
 * - Vector embeddings for semantic search
 * - Long-term conversation memory
 * - Contextual recall of past discussions
 * - Topic clustering and trend analysis
 * - Efficient similarity search
 *
 * Features:
 * - Semantic understanding of conversation context
 * - Retrieve relevant past conversations
 * - Track emotional journey over time
 * - Persistent storage with IndexedDB
 */

// Memory entry
export interface MemoryEntry {
  id: string
  timestamp: number
  type: 'user' | 'assistant' | 'system'
  content: string
  embedding: Float32Array
  metadata: MemoryMetadata
}

// Entry metadata
export interface MemoryMetadata {
  concern?: string
  emotion?: string
  verseIds?: string[]
  topic?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  importance?: number      // 0-1, higher = more important
  sessionId?: string
}

// Search result
export interface MemorySearchResult {
  entry: MemoryEntry
  similarity: number
  relevance: number
}

// Memory summary
export interface MemorySummary {
  totalEntries: number
  topicCounts: Record<string, number>
  emotionTrend: 'improving' | 'stable' | 'declining'
  mostDiscussedTopics: string[]
  recentConcerns: string[]
  timespan: { earliest: number; latest: number }
}

// Configuration
export interface VectorMemoryConfig {
  maxEntries?: number
  embeddingDimension?: number
  similarityThreshold?: number
  autoCleanupEnabled?: boolean
  persistenceEnabled?: boolean
  onMemoryUpdated?: (summary: MemorySummary) => void
  onError?: (error: string) => void
}

/**
 * Simple text embedding (TF-IDF style)
 * In production, use a proper embedding model
 */
class SimpleEmbedder {
  private vocabulary: Map<string, number> = new Map()
  private idfScores: Map<string, number> = new Map()
  private dimension: number

  constructor(dimension: number = 256) {
    this.dimension = dimension
    this.initializeVocabulary()
  }

  private initializeVocabulary(): void {
    // Common words and domain-specific terms
    const words = [
      // Emotions
      'happy', 'sad', 'angry', 'anxious', 'calm', 'peaceful', 'stressed', 'worried',
      'frustrated', 'hopeful', 'grateful', 'confused', 'overwhelmed', 'content',

      // Gita concepts
      'dharma', 'karma', 'yoga', 'meditation', 'peace', 'wisdom', 'truth', 'soul',
      'mind', 'consciousness', 'detachment', 'devotion', 'surrender', 'equanimity',
      'action', 'duty', 'purpose', 'balance', 'harmony', 'liberation',

      // Life topics
      'work', 'family', 'relationship', 'health', 'career', 'money', 'success',
      'failure', 'loss', 'grief', 'love', 'fear', 'anger', 'anxiety', 'depression',
      'stress', 'sleep', 'eating', 'exercise', 'meditation', 'prayer',

      // Questions
      'why', 'how', 'what', 'when', 'where', 'who', 'help', 'understand',
      'explain', 'guide', 'teach', 'show', 'tell', 'advice', 'suggestion',

      // Actions
      'feel', 'think', 'believe', 'want', 'need', 'hope', 'wish', 'try',
      'struggle', 'cope', 'manage', 'overcome', 'accept', 'change', 'grow',

      // Descriptors
      'always', 'never', 'sometimes', 'often', 'rarely', 'very', 'really',
      'difficult', 'easy', 'hard', 'simple', 'complex', 'important', 'meaningful'
    ]

    words.forEach((word, index) => {
      this.vocabulary.set(word.toLowerCase(), index)
      this.idfScores.set(word.toLowerCase(), 1.0) // Simplified IDF
    })
  }

  /**
   * Generate embedding for text
   */
  embed(text: string): Float32Array {
    const embedding = new Float32Array(this.dimension).fill(0)
    const words = text.toLowerCase().split(/\s+/)
    const wordCounts: Map<string, number> = new Map()

    // Count words
    for (const word of words) {
      const clean = word.replace(/[^a-z]/g, '')
      if (clean.length > 2) {
        wordCounts.set(clean, (wordCounts.get(clean) || 0) + 1)
      }
    }

    // Generate embedding
    let magnitude = 0
    for (const [word, count] of wordCounts) {
      const vocabIndex = this.vocabulary.get(word)
      if (vocabIndex !== undefined) {
        // TF-IDF style weighting
        const tf = count / words.length
        const idf = this.idfScores.get(word) || 1.0
        const weight = tf * idf

        // Add to embedding (hash to multiple dimensions)
        for (let i = 0; i < 4; i++) {
          const dim = (vocabIndex * 4 + i) % this.dimension
          embedding[dim] += weight * (i % 2 === 0 ? 1 : -1)
        }
      }

      // Add character n-gram features
      for (let i = 0; i < word.length - 2; i++) {
        const ngram = word.substring(i, i + 3)
        const hash = this.hashString(ngram) % this.dimension
        embedding[hash] += 0.1 / words.length
      }

      magnitude += count * count
    }

    // Normalize
    magnitude = Math.sqrt(magnitude) || 1
    for (let i = 0; i < this.dimension; i++) {
      embedding[i] /= magnitude
    }

    return embedding
  }

  /**
   * Simple string hash
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }
}

/**
 * Vector Conversation Memory Class
 */
export class VectorConversationMemory {
  private config: Required<VectorMemoryConfig>
  private embedder: SimpleEmbedder
  private entries: Map<string, MemoryEntry> = new Map()
  private indexedDB: IDBDatabase | null = null

  // Indexes for efficient search
  private topicIndex: Map<string, Set<string>> = new Map()
  private emotionIndex: Map<string, Set<string>> = new Map()
  private timeIndex: string[] = [] // Sorted by timestamp

  constructor(config: VectorMemoryConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 10000,
      embeddingDimension: config.embeddingDimension ?? 256,
      similarityThreshold: config.similarityThreshold ?? 0.3,
      autoCleanupEnabled: config.autoCleanupEnabled ?? true,
      persistenceEnabled: config.persistenceEnabled ?? true,
      onMemoryUpdated: config.onMemoryUpdated ?? (() => {}),
      onError: config.onError ?? (() => {})
    }

    this.embedder = new SimpleEmbedder(this.config.embeddingDimension)
  }

  /**
   * Initialize the memory system
   */
  async initialize(): Promise<void> {
    if (this.config.persistenceEnabled) {
      await this.openDatabase()
      await this.loadFromStorage()
    }
    console.log(`✅ Vector memory initialized with ${this.entries.size} entries`)
  }

  /**
   * Open IndexedDB database
   */
  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('kiaan-voice-memory', 1)

      request.onerror = () => {
        this.config.onError('Failed to open memory database')
        reject(request.error)
      }

      request.onsuccess = () => {
        this.indexedDB = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create stores
        if (!db.objectStoreNames.contains('memories')) {
          const store = db.createObjectStore('memories', { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('topic', 'metadata.topic', { unique: false })
          store.createIndex('emotion', 'metadata.emotion', { unique: false })
        }
      }
    })
  }

  /**
   * Load entries from storage
   */
  private async loadFromStorage(): Promise<void> {
    if (!this.indexedDB) return

    return new Promise((resolve) => {
      const transaction = this.indexedDB!.transaction('memories', 'readonly')
      const store = transaction.objectStore('memories')
      const request = store.getAll()

      request.onsuccess = () => {
        const entries = request.result as (MemoryEntry & { embedding: number[] })[]

        for (const entry of entries) {
          // Convert embedding back to Float32Array
          const memoryEntry: MemoryEntry = {
            ...entry,
            embedding: new Float32Array(entry.embedding)
          }

          this.entries.set(entry.id, memoryEntry)
          this.updateIndexes(memoryEntry)
        }

        // Sort time index
        this.timeIndex.sort((a, b) => {
          const entryA = this.entries.get(a)
          const entryB = this.entries.get(b)
          return (entryA?.timestamp || 0) - (entryB?.timestamp || 0)
        })

        resolve()
      }

      request.onerror = () => resolve()
    })
  }

  /**
   * Add a memory entry
   */
  async addMemory(
    content: string,
    type: 'user' | 'assistant' | 'system',
    metadata: Partial<MemoryMetadata> = {}
  ): Promise<string> {
    // Generate embedding
    const embedding = this.embedder.embed(content)

    // Detect topic if not provided
    const topic = metadata.topic || this.detectTopic(content)

    // Detect sentiment if not provided
    const sentiment = metadata.sentiment || this.detectSentiment(content)

    // Calculate importance
    const importance = metadata.importance ?? this.calculateImportance(content, type)

    const entry: MemoryEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      content,
      embedding,
      metadata: {
        ...metadata,
        topic,
        sentiment,
        importance
      }
    }

    // Store entry
    this.entries.set(entry.id, entry)
    this.updateIndexes(entry)
    this.timeIndex.push(entry.id)

    // Persist if enabled
    if (this.config.persistenceEnabled && this.indexedDB) {
      await this.persistEntry(entry)
    }

    // Cleanup if needed
    if (this.config.autoCleanupEnabled && this.entries.size > this.config.maxEntries) {
      await this.cleanup()
    }

    // Notify
    this.config.onMemoryUpdated(this.getSummary())

    return entry.id
  }

  /**
   * Persist entry to IndexedDB
   */
  private async persistEntry(entry: MemoryEntry): Promise<void> {
    if (!this.indexedDB) return

    return new Promise((resolve) => {
      const transaction = this.indexedDB!.transaction('memories', 'readwrite')
      const store = transaction.objectStore('memories')

      // Convert Float32Array to regular array for storage
      const storageEntry = {
        ...entry,
        embedding: Array.from(entry.embedding)
      }

      const request = store.put(storageEntry)
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
    })
  }

  /**
   * Update indexes for an entry
   */
  private updateIndexes(entry: MemoryEntry): void {
    // Topic index
    if (entry.metadata.topic) {
      if (!this.topicIndex.has(entry.metadata.topic)) {
        this.topicIndex.set(entry.metadata.topic, new Set())
      }
      this.topicIndex.get(entry.metadata.topic)!.add(entry.id)
    }

    // Emotion index
    if (entry.metadata.emotion) {
      if (!this.emotionIndex.has(entry.metadata.emotion)) {
        this.emotionIndex.set(entry.metadata.emotion, new Set())
      }
      this.emotionIndex.get(entry.metadata.emotion)!.add(entry.id)
    }
  }

  /**
   * Search for similar memories
   */
  searchSimilar(query: string, limit: number = 10): MemorySearchResult[] {
    const queryEmbedding = this.embedder.embed(query)
    const results: MemorySearchResult[] = []

    for (const entry of this.entries.values()) {
      const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding)

      if (similarity >= this.config.similarityThreshold) {
        // Calculate relevance (combine similarity with recency and importance)
        const recency = 1 - (Date.now() - entry.timestamp) / (30 * 24 * 60 * 60 * 1000) // 30 days
        const importance = entry.metadata.importance || 0.5
        const relevance = similarity * 0.5 + Math.max(0, recency) * 0.3 + importance * 0.2

        results.push({
          entry,
          similarity,
          relevance
        })
      }
    }

    // Sort by relevance and limit
    results.sort((a, b) => b.relevance - a.relevance)
    return results.slice(0, limit)
  }

  /**
   * Search by topic
   */
  searchByTopic(topic: string, limit: number = 20): MemoryEntry[] {
    const entryIds = this.topicIndex.get(topic)
    if (!entryIds) return []

    const entries: MemoryEntry[] = []
    for (const id of entryIds) {
      const entry = this.entries.get(id)
      if (entry) entries.push(entry)
    }

    // Sort by timestamp (most recent first)
    entries.sort((a, b) => b.timestamp - a.timestamp)
    return entries.slice(0, limit)
  }

  /**
   * Search by emotion
   */
  searchByEmotion(emotion: string, limit: number = 20): MemoryEntry[] {
    const entryIds = this.emotionIndex.get(emotion)
    if (!entryIds) return []

    const entries: MemoryEntry[] = []
    for (const id of entryIds) {
      const entry = this.entries.get(id)
      if (entry) entries.push(entry)
    }

    entries.sort((a, b) => b.timestamp - a.timestamp)
    return entries.slice(0, limit)
  }

  /**
   * Get recent memories
   */
  getRecent(limit: number = 20): MemoryEntry[] {
    const recentIds = this.timeIndex.slice(-limit).reverse()
    return recentIds.map(id => this.entries.get(id)!).filter(Boolean)
  }

  /**
   * Get context for conversation
   */
  getContext(currentMessage: string, maxTokens: number = 2000): string {
    const similar = this.searchSimilar(currentMessage, 5)

    let context = ''
    let tokenCount = 0
    const approxTokensPerChar = 0.25

    for (const result of similar) {
      const entryText = `[${result.entry.type}]: ${result.entry.content}\n`
      const entryTokens = entryText.length * approxTokensPerChar

      if (tokenCount + entryTokens > maxTokens) break

      context += entryText
      tokenCount += entryTokens
    }

    return context
  }

  /**
   * Calculate cosine similarity
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude > 0 ? dotProduct / magnitude : 0
  }

  /**
   * Detect topic from content
   */
  private detectTopic(content: string): string {
    const lower = content.toLowerCase()

    const topicKeywords: Record<string, string[]> = {
      anxiety: ['anxious', 'anxiety', 'worried', 'worry', 'nervous', 'panic'],
      stress: ['stress', 'stressed', 'pressure', 'overwhelmed', 'burden'],
      depression: ['depressed', 'depression', 'hopeless', 'empty', 'numb'],
      anger: ['angry', 'anger', 'frustrated', 'irritated', 'mad', 'furious'],
      fear: ['afraid', 'fear', 'scared', 'terrified', 'frightened'],
      grief: ['grief', 'loss', 'mourning', 'death', 'passed away', 'miss'],
      relationship: ['relationship', 'partner', 'spouse', 'friend', 'family'],
      work: ['work', 'job', 'career', 'boss', 'colleague', 'office'],
      purpose: ['purpose', 'meaning', 'life', 'direction', 'goal', 'future'],
      spiritual: ['spiritual', 'soul', 'dharma', 'karma', 'meditation', 'gita']
    }

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return topic
      }
    }

    return 'general'
  }

  /**
   * Detect sentiment
   */
  private detectSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const lower = content.toLowerCase()

    const positive = ['happy', 'good', 'great', 'better', 'wonderful', 'grateful', 'thankful', 'peaceful', 'calm']
    const negative = ['sad', 'bad', 'terrible', 'worse', 'awful', 'hate', 'angry', 'depressed', 'anxious']

    let score = 0
    for (const word of positive) {
      if (lower.includes(word)) score++
    }
    for (const word of negative) {
      if (lower.includes(word)) score--
    }

    if (score > 0) return 'positive'
    if (score < 0) return 'negative'
    return 'neutral'
  }

  /**
   * Calculate importance
   */
  private calculateImportance(content: string, type: 'user' | 'assistant' | 'system'): number {
    let importance = 0.5

    // User messages slightly more important
    if (type === 'user') importance += 0.1

    // Longer messages might be more important
    if (content.length > 200) importance += 0.1

    // Questions are important
    if (content.includes('?')) importance += 0.1

    // Emotional content is important
    const emotionalWords = ['feel', 'feeling', 'struggling', 'help', 'scared', 'worried', 'happy', 'grateful']
    if (emotionalWords.some(w => content.toLowerCase().includes(w))) {
      importance += 0.1
    }

    return Math.min(1, importance)
  }

  /**
   * Get memory summary
   */
  getSummary(): MemorySummary {
    const topicCounts: Record<string, number> = {}
    let earliest = Infinity
    let latest = 0
    const recentConcerns: string[] = []
    const emotionScores: number[] = []

    // Get recent entries for trend analysis
    const recentEntries = this.getRecent(50)

    for (const entry of this.entries.values()) {
      // Topic counts
      if (entry.metadata.topic) {
        topicCounts[entry.metadata.topic] = (topicCounts[entry.metadata.topic] || 0) + 1
      }

      // Time range
      if (entry.timestamp < earliest) earliest = entry.timestamp
      if (entry.timestamp > latest) latest = entry.timestamp
    }

    // Recent concerns
    for (const entry of recentEntries.slice(0, 10)) {
      if (entry.metadata.concern && !recentConcerns.includes(entry.metadata.concern)) {
        recentConcerns.push(entry.metadata.concern)
      }
    }

    // Emotion trend
    for (const entry of recentEntries) {
      const score = entry.metadata.sentiment === 'positive' ? 1 :
                   entry.metadata.sentiment === 'negative' ? -1 : 0
      emotionScores.push(score)
    }

    let emotionTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (emotionScores.length >= 10) {
      const firstHalf = emotionScores.slice(0, emotionScores.length / 2)
      const secondHalf = emotionScores.slice(emotionScores.length / 2)
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      if (secondAvg - firstAvg > 0.2) emotionTrend = 'improving'
      else if (firstAvg - secondAvg > 0.2) emotionTrend = 'declining'
    }

    // Most discussed topics
    const mostDiscussedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic)

    return {
      totalEntries: this.entries.size,
      topicCounts,
      emotionTrend,
      mostDiscussedTopics,
      recentConcerns,
      timespan: {
        earliest: earliest === Infinity ? Date.now() : earliest,
        latest: latest === 0 ? Date.now() : latest
      }
    }
  }

  /**
   * Cleanup old/low-importance entries
   */
  private async cleanup(): Promise<void> {
    const entries = Array.from(this.entries.values())

    // Sort by importance and recency
    entries.sort((a, b) => {
      const importanceA = a.metadata.importance || 0.5
      const importanceB = b.metadata.importance || 0.5
      const recencyA = a.timestamp
      const recencyB = b.timestamp

      // Combined score (importance + recency)
      const scoreA = importanceA + recencyA / Date.now()
      const scoreB = importanceB + recencyB / Date.now()

      return scoreA - scoreB // Lowest scores first (to remove)
    })

    // Remove oldest/least important entries
    const toRemove = entries.slice(0, Math.floor(this.entries.size * 0.1))

    for (const entry of toRemove) {
      this.entries.delete(entry.id)

      // Remove from indexes
      if (entry.metadata.topic) {
        this.topicIndex.get(entry.metadata.topic)?.delete(entry.id)
      }
      if (entry.metadata.emotion) {
        this.emotionIndex.get(entry.metadata.emotion)?.delete(entry.id)
      }

      // Remove from storage
      if (this.indexedDB) {
        const transaction = this.indexedDB.transaction('memories', 'readwrite')
        transaction.objectStore('memories').delete(entry.id)
      }
    }

    // Rebuild time index
    this.timeIndex = Array.from(this.entries.keys())
    this.timeIndex.sort((a, b) => {
      const entryA = this.entries.get(a)
      const entryB = this.entries.get(b)
      return (entryA?.timestamp || 0) - (entryB?.timestamp || 0)
    })

    console.log(`Cleaned up ${toRemove.length} memory entries`)
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clear all memories
   */
  async clearAll(): Promise<void> {
    this.entries.clear()
    this.topicIndex.clear()
    this.emotionIndex.clear()
    this.timeIndex = []

    if (this.indexedDB) {
      const transaction = this.indexedDB.transaction('memories', 'readwrite')
      transaction.objectStore('memories').clear()
    }

    console.log('All memories cleared')
  }

  /**
   * Export memories
   */
  exportMemories(): string {
    const data = Array.from(this.entries.values()).map(entry => ({
      ...entry,
      embedding: Array.from(entry.embedding)
    }))

    return JSON.stringify({
      version: 1,
      exported: new Date().toISOString(),
      entries: data
    }, null, 2)
  }

  /**
   * Get entry count
   */
  getEntryCount(): number {
    return this.entries.size
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.indexedDB) {
      this.indexedDB.close()
      this.indexedDB = null
    }
    this.entries.clear()
    this.topicIndex.clear()
    this.emotionIndex.clear()
    this.timeIndex = []
  }
}

// Export factory function
export function createVectorConversationMemory(config?: VectorMemoryConfig): VectorConversationMemory {
  return new VectorConversationMemory(config)
}
