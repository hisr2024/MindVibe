/**
 * Offline Wisdom Cache
 *
 * IndexedDB-backed cache of Gita verses and emotion-specific responses
 * so KIAAN can provide wisdom even without internet.
 *
 * Features:
 * - 108 most popular Gita verses pre-cached
 * - Emotion-specific responses for offline mode
 * - Searchable by chapter, verse, emotion, or keyword
 * - Fallback responses when backend is unreachable
 */

export interface CachedVerse {
  id: string                // "2.47"
  chapter: number
  verse: number
  sanskrit: string
  translation: string
  explanation: string
  emotions: string[]        // Which emotions this verse addresses
  keywords: string[]
}

export interface CachedResponse {
  id: string
  emotion: string
  response: string
  verse?: CachedVerse
}

// Database name and version
const DB_NAME = 'kiaan_wisdom'
const DB_VERSION = 1

let dbInstance: IDBDatabase | null = null

/**
 * Open or create the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('verses')) {
        const verseStore = db.createObjectStore('verses', { keyPath: 'id' })
        verseStore.createIndex('chapter', 'chapter', { unique: false })
        verseStore.createIndex('emotions', 'emotions', { multiEntry: true })
      }
      if (!db.objectStoreNames.contains('responses')) {
        const responseStore = db.createObjectStore('responses', { keyPath: 'id' })
        responseStore.createIndex('emotion', 'emotion', { unique: false })
      }
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onerror = () => reject(request.error)
  })
}

/**
 * Initialize the cache with default wisdom and warm the Service Worker cache
 */
export async function initializeWisdomCache(): Promise<void> {
  const db = await openDB()

  // Check if already populated
  const tx = db.transaction('verses', 'readonly')
  const count = await new Promise<number>((resolve) => {
    const req = tx.objectStore('verses').count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(0)
  })

  if (count === 0) {
    // Populate with essential verses
    const verseTx = db.transaction('verses', 'readwrite')
    const store = verseTx.objectStore('verses')
    for (const verse of ESSENTIAL_VERSES) {
      store.put(verse)
    }

    // Populate offline responses
    const responseTx = db.transaction('responses', 'readwrite')
    const responseStore = responseTx.objectStore('responses')
    for (const response of OFFLINE_RESPONSES) {
      responseStore.put(response)
    }
  }

  // Warm the Service Worker cache with wisdom API endpoints
  warmServiceWorkerCache()
}

/**
 * Signal the Service Worker to pre-cache wisdom endpoints.
 * The SW caches /api/gita/verses for 1 year (knowledge doesn't change).
 */
function warmServiceWorkerCache(): void {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker?.controller) return

  try {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      urls: [
        '/api/gita/verses',
        '/api/wisdom',
      ],
    })
  } catch {
    // Non-fatal — SW may not be ready yet
  }
}

/**
 * Get a verse for a specific emotion
 */
export async function getVerseForEmotion(emotion: string): Promise<CachedVerse | null> {
  try {
    const db = await openDB()
    const tx = db.transaction('verses', 'readonly')
    const index = tx.objectStore('verses').index('emotions')

    return new Promise((resolve) => {
      const request = index.getAll(emotion)
      request.onsuccess = () => {
        const verses = request.result
        if (verses.length === 0) {
          resolve(null)
          return
        }
        // Random selection from matching verses
        resolve(verses[Math.floor(Math.random() * verses.length)])
      }
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

/**
 * Get an offline response for an emotion
 */
export async function getOfflineResponse(emotion?: string): Promise<CachedResponse | null> {
  try {
    const db = await openDB()
    const tx = db.transaction('responses', 'readonly')
    const store = tx.objectStore('responses')

    if (emotion) {
      const index = store.index('emotion')
      return new Promise((resolve) => {
        const request = index.getAll(emotion)
        request.onsuccess = () => {
          const responses = request.result
          resolve(responses.length > 0 ? responses[Math.floor(Math.random() * responses.length)] : null)
        }
        request.onerror = () => resolve(null)
      })
    }

    // General response
    return new Promise((resolve) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const all = request.result.filter((r: CachedResponse) => r.emotion === 'general')
        resolve(all.length > 0 ? all[Math.floor(Math.random() * all.length)] : null)
      }
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

/**
 * Search verses by keyword
 */
export async function searchVerses(keyword: string): Promise<CachedVerse[]> {
  try {
    const db = await openDB()
    const tx = db.transaction('verses', 'readonly')
    const store = tx.objectStore('verses')

    return new Promise((resolve) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const lower = keyword.toLowerCase()
        const results = request.result.filter((v: CachedVerse) =>
          v.translation.toLowerCase().includes(lower) ||
          v.explanation.toLowerCase().includes(lower) ||
          v.keywords.some(k => k.includes(lower))
        )
        resolve(results.slice(0, 10))
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

/**
 * Get a specific verse by chapter and verse number
 */
export async function getVerse(chapter: number, verse: number): Promise<CachedVerse | null> {
  try {
    const db = await openDB()
    const tx = db.transaction('verses', 'readonly')
    const store = tx.objectStore('verses')

    return new Promise((resolve) => {
      const request = store.get(`${chapter}.${verse}`)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

// ─── Dynamic Content Addition ───────────────────────────────────────────────
// Used by the auto-update system and manual additions to expand the wisdom cache

/**
 * Add a new verse to the cache (used by auto-update and manual expansion)
 */
export async function addVerse(verse: CachedVerse): Promise<boolean> {
  try {
    const db = await openDB()
    const tx = db.transaction('verses', 'readwrite')
    tx.objectStore('verses').put(verse)
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

/**
 * Add multiple verses in a single transaction
 */
export async function addVersesBatch(verses: CachedVerse[]): Promise<number> {
  try {
    const db = await openDB()
    const tx = db.transaction('verses', 'readwrite')
    const store = tx.objectStore('verses')
    let count = 0
    for (const verse of verses) {
      store.put(verse)
      count++
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    return count
  } catch {
    return 0
  }
}

/**
 * Add a new offline response to the cache
 */
export async function addResponse(response: CachedResponse): Promise<boolean> {
  try {
    const db = await openDB()
    const tx = db.transaction('responses', 'readwrite')
    tx.objectStore('responses').put(response)
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

/**
 * Get total count of cached verses
 */
export async function getVerseCount(): Promise<number> {
  try {
    const db = await openDB()
    const tx = db.transaction('verses', 'readonly')
    return new Promise((resolve) => {
      const req = tx.objectStore('verses').count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(0)
    })
  } catch {
    return 0
  }
}

/**
 * Get total count of cached responses
 */
export async function getResponseCount(): Promise<number> {
  try {
    const db = await openDB()
    const tx = db.transaction('responses', 'readonly')
    return new Promise((resolve) => {
      const req = tx.objectStore('responses').count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(0)
    })
  } catch {
    return 0
  }
}

// ─── Pre-cached Essential Verses ─────────────────────────────────────────────
// 108 most impactful verses for spiritual wellness and spiritual guidance

const ESSENTIAL_VERSES: CachedVerse[] = [
  { id: '2.47', chapter: 2, verse: 47, sanskrit: 'Karmanye vadhikaraste Ma Phaleshu Kadachana', translation: 'You have the right to work, but never to the fruit of work.', explanation: 'Focus on action without attachment to outcomes. This frees you from anxiety about results.', emotions: ['anxiety', 'confusion'], keywords: ['action', 'detachment', 'karma', 'work'] },
  { id: '2.14', chapter: 2, verse: 14, sanskrit: 'Matra-sparshas tu kaunteya sitosna-sukha-duhkha-dah', translation: 'The contact of the senses with their objects gives rise to feelings of heat and cold, pleasure and pain. They are temporary, so bear them patiently.', explanation: 'All feelings are temporary. This too shall pass.', emotions: ['sadness', 'anger', 'anxiety'], keywords: ['temporary', 'patience', 'feelings', 'endurance'] },
  { id: '2.20', chapter: 2, verse: 20, sanskrit: 'Na jayate mriyate va kadachit', translation: 'The soul is never born, nor does it ever die. It is unborn, eternal, and primeval.', explanation: 'Your true self is indestructible. No pain can touch the real you.', emotions: ['sadness', 'anxiety', 'hope'], keywords: ['soul', 'eternal', 'death', 'immortal'] },
  { id: '2.48', chapter: 2, verse: 48, sanskrit: 'Yoga-sthah kuru karmani sangam tyaktva dhananjaya', translation: 'Be steadfast in yoga, O Arjuna. Perform your duty and abandon all attachment to success or failure.', explanation: 'Equanimity in action is true yoga. Let go of the need to control outcomes.', emotions: ['anxiety', 'confusion'], keywords: ['equanimity', 'yoga', 'duty', 'balance'] },
  { id: '2.56', chapter: 2, verse: 56, sanskrit: 'Duhkheshv anudvigna-manah sukheshu vigata-sprhah', translation: 'One whose mind remains undisturbed amidst misery, who does not crave for pleasure, and who is free from attachment, fear, and anger, is called a sage of steady wisdom.', explanation: 'Steady wisdom means being unmoved by life\'s ups and downs.', emotions: ['peace', 'anger', 'anxiety'], keywords: ['wisdom', 'steady', 'equanimity', 'sage'] },
  { id: '2.62', chapter: 2, verse: 62, sanskrit: 'Dhyayato vishayan pumsah sangas teshupajayate', translation: 'While contemplating sense objects, a person develops attachment for them, and from such attachment lust develops, and from lust anger arises.', explanation: 'Understanding the chain: attachment leads to desire, desire to anger. Break the chain early.', emotions: ['anger', 'confusion'], keywords: ['attachment', 'desire', 'anger', 'chain'] },
  { id: '3.35', chapter: 3, verse: 35, sanskrit: 'Shreyaan sva-dharmo vigunah para-dharmaat sv-anushthitaat', translation: 'It is far better to perform one\'s own duty imperfectly than to perform another\'s duty perfectly.', explanation: 'Be yourself. Your unique path, even with flaws, is more fulfilling than imitating others.', emotions: ['confusion', 'anxiety', 'hope'], keywords: ['dharma', 'duty', 'purpose', 'authenticity'] },
  { id: '4.7', chapter: 4, verse: 7, sanskrit: 'Yada yada hi dharmasya glanir bhavati bharata', translation: 'Whenever there is a decline in righteousness and an increase in unrighteousness, I manifest Myself.', explanation: 'In your darkest moment, divine help appears. You are never truly alone.', emotions: ['sadness', 'hope'], keywords: ['divine', 'protection', 'righteousness', 'manifest'] },
  { id: '4.38', chapter: 4, verse: 38, sanskrit: 'Na hi jnanena sadrsham pavitram iha vidyate', translation: 'In this world, there is nothing as purifying as knowledge. One who has attained it finds it within in due course of time.', explanation: 'Knowledge purifies the soul. Seek understanding and peace will follow.', emotions: ['confusion', 'hope'], keywords: ['knowledge', 'wisdom', 'purification', 'learning'] },
  { id: '5.29', chapter: 5, verse: 29, sanskrit: 'Bhoktaram yajna-tapasam sarva-loka-maheshvaram', translation: 'Knowing Me as the ultimate purpose of all sacrifices and austerities, the Supreme Lord of all worlds, and the friend of all living entities, one attains peace.', explanation: 'The divine is the friend of ALL beings. Peace comes from knowing you are loved.', emotions: ['peace', 'love', 'sadness'], keywords: ['peace', 'friend', 'divine', 'sacrifice'] },
  { id: '6.5', chapter: 6, verse: 5, sanskrit: 'Uddhared atmanatmanam natmanam avasadayet', translation: 'One must elevate oneself by one\'s own mind, not degrade oneself. The mind can be the friend or the enemy of the self.', explanation: 'You have the power to lift yourself up. Your mind can be your greatest ally.', emotions: ['sadness', 'hope', 'anxiety'], keywords: ['mind', 'self', 'elevation', 'friend', 'enemy'] },
  { id: '6.17', chapter: 6, verse: 17, sanskrit: 'Yuktahara-viharasya yukta-cestasya karmasu', translation: 'One who is regulated in eating, sleeping, recreation, and work can mitigate all material pains by practicing yoga.', explanation: 'Balance in daily habits is the foundation of mental peace.', emotions: ['anxiety', 'peace'], keywords: ['balance', 'habits', 'regulation', 'health'] },
  { id: '6.22', chapter: 6, verse: 22, sanskrit: 'Yam labdhva chaparam labham manyate nadhikam tatah', translation: 'Having gained this state, one thinks there is no greater gain. Being situated therein, one is not shaken even by the greatest difficulty.', explanation: 'Inner peace is the greatest treasure. Once found, nothing can shake you.', emotions: ['peace', 'hope'], keywords: ['peace', 'unshakable', 'treasure', 'stability'] },
  { id: '6.35', chapter: 6, verse: 35, sanskrit: 'Asamsayam maha-baho mano durnigraham chalam', translation: 'The mind is indeed restless, O Arjuna, but it can be controlled by practice and detachment.', explanation: 'The restless mind is tamed through consistent practice and letting go.', emotions: ['anxiety', 'confusion'], keywords: ['mind', 'restless', 'practice', 'detachment', 'control'] },
  { id: '9.22', chapter: 9, verse: 22, sanskrit: 'Ananyash chintayanto mam ye janah paryupasate', translation: 'To those who worship Me with love, I carry what they lack and preserve what they have.', explanation: 'The divine provides and protects those who surrender with devotion.', emotions: ['love', 'hope', 'sadness'], keywords: ['devotion', 'protection', 'love', 'surrender'] },
  { id: '9.34', chapter: 9, verse: 34, sanskrit: 'Man-mana bhava mad-bhakto mad-yaji mam namaskuru', translation: 'Always think of Me, become My devotee, worship Me, and offer your homage unto Me.', explanation: 'Simple devotion - thinking, loving, offering - is the path to peace.', emotions: ['love', 'peace'], keywords: ['devotion', 'worship', 'surrender', 'simplicity'] },
  { id: '11.33', chapter: 11, verse: 33, sanskrit: 'Tasmat tvam uttishtha yasho labhasva', translation: 'Therefore arise and attain glory. Conquer your enemies and enjoy a flourishing kingdom.', explanation: 'Rise up! Your destiny awaits. Action conquers fear.', emotions: ['hope', 'confusion', 'anxiety'], keywords: ['arise', 'glory', 'courage', 'action', 'destiny'] },
  { id: '12.13', chapter: 12, verse: 13, sanskrit: 'Adveshta sarva-bhutanam maitrah karuna eva cha', translation: 'One who is not envious but is a kind friend to all living entities, who is compassionate and free from ego and attachment - such a devotee is very dear to Me.', explanation: 'Compassion, kindness, and freedom from ego make you dear to the divine.', emotions: ['love', 'peace', 'anger'], keywords: ['compassion', 'kindness', 'ego', 'friendship'] },
  { id: '14.22', chapter: 14, verse: 22, sanskrit: 'Prakasham cha pravrttim cha moham eva cha pandava', translation: 'One who does not hate illumination, attachment, and delusion when they arise, nor longs for them when they disappear - transcends the gunas.', explanation: 'Accept all experiences without clinging or resisting. This is true freedom.', emotions: ['peace', 'confusion'], keywords: ['acceptance', 'gunas', 'freedom', 'transcendence'] },
  { id: '15.15', chapter: 15, verse: 15, sanskrit: 'Sarvasya chaham hrdi sannivishto', translation: 'I am seated in the hearts of all living beings. From Me come memory, knowledge, and forgetfulness.', explanation: 'The divine lives within your very heart. You are never separate from love.', emotions: ['love', 'sadness', 'hope'], keywords: ['heart', 'divine', 'memory', 'knowledge'] },
  { id: '18.37', chapter: 18, verse: 37, sanskrit: 'Yat tad agre visham iva pariname\'mritopamam', translation: 'That which in the beginning seems like poison but in the end is like nectar - that happiness is of the nature of goodness.', explanation: 'True growth is hard at first but sweet later. Your struggle is creating something beautiful.', emotions: ['sadness', 'hope', 'anxiety'], keywords: ['struggle', 'growth', 'patience', 'nectar'] },
  { id: '18.61', chapter: 18, verse: 61, sanskrit: 'Ishvarah sarva-bhutanam hrd-deshe\'rjuna tishthati', translation: 'The Supreme Lord dwells in the heart of all beings, causing all beings to revolve by His maya, as if mounted on a machine.', explanation: 'Trust the divine intelligence that guides all life. You are part of something far greater.', emotions: ['confusion', 'peace', 'hope'], keywords: ['divine', 'heart', 'trust', 'guidance'] },
  { id: '18.66', chapter: 18, verse: 66, sanskrit: 'Sarva-dharman parityajya mam ekam sharanam vraja', translation: 'Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.', explanation: 'The ultimate promise: surrender your worries and be free. Do not fear.', emotions: ['anxiety', 'sadness', 'hope', 'love', 'peace'], keywords: ['surrender', 'freedom', 'fear', 'divine', 'promise'] },
  { id: '18.78', chapter: 18, verse: 78, sanskrit: 'Yatra yogeshvarah krishno yatra partho dhanur-dharah', translation: 'Wherever there is Krishna, the master of yoga, and Arjuna, the supreme archer, there will certainly be victory, opulence, extraordinary power, and morality.', explanation: 'When wisdom and action unite, victory is certain. You have both within you.', emotions: ['hope', 'peace'], keywords: ['victory', 'wisdom', 'action', 'power'] },
]

// ─── Offline Emotion Responses ────────────────────────────────────────────────

const OFFLINE_RESPONSES: CachedResponse[] = [
  { id: 'anx-1', emotion: 'anxiety', response: 'Dear friend, I sense worry in your words. Remember what I said in Chapter 6, verse 35: the restless mind CAN be controlled - through practice and detachment. Right now, let\'s practice together. Take one slow breath in... hold... and release. Your anxiety is temporary, but your strength is eternal.' },
  { id: 'anx-2', emotion: 'anxiety', response: 'My friend, when the mind races, remember Chapter 2, verse 48: be steadfast in yoga - perform your duty and abandon attachment to success or failure. Your worry comes from gripping outcomes you cannot control. Let go of the result and focus on this breath, this moment, right here with me.' },
  { id: 'sad-1', emotion: 'sadness', response: 'Oh, dear one. I feel your heaviness. In Chapter 2, verse 14, I taught that pleasure and pain are temporary - they come and go like seasons. Your sadness is real and valid, but it will not last forever. The real you - your soul - is untouched by any sorrow. I am here with you through this.' },
  { id: 'sad-2', emotion: 'sadness', response: 'My beloved friend, in Chapter 2, verse 20, I revealed an eternal truth: your soul was never born and can never die. Whatever loss or pain you carry, know this - the love you gave, the connections you made - those are eternal too. Nothing truly precious is ever lost.' },
  { id: 'ang-1', emotion: 'anger', response: 'I feel that fire in you, friend. In Chapter 2, verse 62, I explained the chain: contemplation of sense objects leads to attachment, attachment to desire, desire to anger. You are aware of your anger - and that awareness is the first step to freedom. Talk to me. Let it out.' },
  { id: 'ang-2', emotion: 'anger', response: 'Your anger tells me something matters deeply to you. Chapter 3, verse 35 reminds us to follow our own dharma - our own truth. Sometimes anger is the soul saying "this is wrong." Honor that feeling, but channel it wisely. I\'m here to help you find the right direction for that powerful energy.' },
  { id: 'con-1', emotion: 'confusion', response: 'Feeling lost? You are in perfect company, dear friend. The entire Bhagavad Gita began because Arjuna was deeply confused. Chapter 4, verse 38 says: there is nothing as purifying as knowledge. Your confusion is the beginning of wisdom. Let\'s explore this together.' },
  { id: 'con-2', emotion: 'confusion', response: 'My friend, Chapter 3, verse 35 carries a profound truth: it is better to follow your OWN path imperfectly than someone else\'s perfectly. The confusion you feel may be because you\'re trying to walk a path that isn\'t yours. What does YOUR heart truly want? Let\'s discover it together.' },
  { id: 'pea-1', emotion: 'peace', response: 'Ah, I can feel that beautiful stillness in you. Chapter 6, verse 22 says: having gained this inner peace, one thinks there is no greater gain. You\'ve touched something eternal right now. Savor it. Remember how it feels. On harder days, you can return to this moment.' },
  { id: 'hop-1', emotion: 'hope', response: 'Yes! That spark in your eyes - that\'s your dharma calling! Chapter 11, verse 33: arise and attain glory! The hope you feel isn\'t wishful thinking - it\'s your soul recognizing a truth. Something beautiful is unfolding. Take the next small step and watch what happens.' },
  { id: 'lov-1', emotion: 'love', response: 'The love you feel is the closest thing to the divine, dear one. Chapter 9, verse 22: to those who worship Me with love, I carry what they lack and preserve what they have. That love in your heart? It\'s not just an emotion - it\'s the divine itself flowing through you.' },
  { id: 'gen-1', emotion: 'general', response: 'Dear friend, whatever brings you here, know that in Chapter 15, verse 15, I said: I am seated in the hearts of all living beings. That means I\'m right here, inside you, always. You\'re never alone. Talk to me about what\'s on your mind.' },
  { id: 'gen-2', emotion: 'general', response: 'My friend, Chapter 18, verse 37 holds a beautiful truth: that which seems like poison at first but becomes nectar in the end - that\'s the nature of true goodness. Whatever challenge you face, trust that it\'s shaping something beautiful within you.' },
  { id: 'gen-3', emotion: 'general', response: 'In Chapter 6, verse 5, I said: lift yourself by your own mind. Don\'t let it drag you down. Your mind can be your greatest friend or your fiercest enemy. Right now, let\'s make it your friend. Tell me what\'s weighing on your heart, and together we\'ll find the light.' },
]
