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
        '/api/wisdom/verses',
        '/api/kiaan/friend/daily-wisdom',
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
// 108 most impactful Gita verses covering all 18 chapters and all emotional states
// Covers: anxiety, sadness, anger, confusion, hope, peace, love, seeking

const ESSENTIAL_VERSES: CachedVerse[] = [
  // ── Chapter 1: Arjuna's Grief (anxiety, overwhelm) ──
  { id: '1.28', chapter: 1, verse: 28, sanskrit: 'Drishtvedam svajanam krishna yuyutsum samupasthitam', translation: 'Seeing my own kinsmen arrayed for battle, my limbs quail, my mouth goes dry, my body trembles.', explanation: 'Even the bravest feel overwhelmed. Acknowledging vulnerability is the first step to strength.', emotions: ['anxiety', 'sadness'], keywords: ['vulnerability', 'overwhelm', 'courage', 'honesty'] },
  { id: '1.47', chapter: 1, verse: 47, sanskrit: 'Evam uktvaarjunah sankhye rathopastha upaavishat', translation: 'Having spoken thus, Arjuna cast aside his bow and arrows and sank down on the seat of his chariot, his mind overwhelmed with grief.', explanation: 'Sometimes the bravest thing is to pause. It is okay to stop and feel before acting.', emotions: ['sadness', 'anxiety'], keywords: ['pause', 'grief', 'surrender', 'rest'] },

  // ── Chapter 2: Self-Knowledge (the backbone — 20 verses) ──
  { id: '2.3', chapter: 2, verse: 3, sanskrit: 'Klaibyam ma sma gamah partha nai tat tvayy upapadyate', translation: 'Do not yield to unmanliness. It does not become you. Shake off this petty faintheartedness and arise!', explanation: 'You are stronger than you think. Rise above the weakness of the moment.', emotions: ['sadness', 'confusion', 'hope'], keywords: ['courage', 'arise', 'strength', 'overcome'] },
  { id: '2.11', chapter: 2, verse: 11, sanskrit: 'Ashocyan anvasocas tvam prajna-vadams cha bhashase', translation: 'You grieve for those who should not be grieved for. The wise grieve neither for the living nor the dead.', explanation: 'Much of our suffering comes from misplaced grief. Wisdom helps us see beyond appearances.', emotions: ['sadness', 'confusion'], keywords: ['grief', 'wisdom', 'perspective', 'clarity'] },
  { id: '2.14', chapter: 2, verse: 14, sanskrit: 'Matra-sparshas tu kaunteya sitosna-sukha-duhkha-dah', translation: 'Sensory experiences give rise to feelings of heat and cold, pleasure and pain. They are temporary, so bear them patiently.', explanation: 'All feelings are temporary. This too shall pass.', emotions: ['sadness', 'anger', 'anxiety'], keywords: ['temporary', 'patience', 'feelings', 'endurance'] },
  { id: '2.20', chapter: 2, verse: 20, sanskrit: 'Na jayate mriyate va kadachit', translation: 'The soul is never born, nor does it ever die. It is unborn, eternal, and primeval.', explanation: 'Your true self is indestructible. No pain can touch the real you.', emotions: ['sadness', 'anxiety', 'hope'], keywords: ['soul', 'eternal', 'death', 'immortal'] },
  { id: '2.22', chapter: 2, verse: 22, sanskrit: 'Vasamsi jirnani yatha vihaya navani grhnati naro parani', translation: 'As a person puts on new garments, giving up old ones, similarly, the soul accepts new bodies, giving up old ones.', explanation: 'Change is natural. Every ending is a new beginning.', emotions: ['sadness', 'hope'], keywords: ['change', 'renewal', 'transformation', 'cycle'] },
  { id: '2.27', chapter: 2, verse: 27, sanskrit: 'Jatasya hi dhruvo mrtyur dhruvam janma mrtasya cha', translation: 'For the born, death is certain; for the dead, birth is certain. Therefore, do not grieve over what is inevitable.', explanation: 'What is destined cannot be changed. Focus your energy on what you can influence.', emotions: ['sadness', 'anxiety'], keywords: ['acceptance', 'inevitable', 'cycle', 'focus'] },
  { id: '2.38', chapter: 2, verse: 38, sanskrit: 'Sukha-duhkhe same krtva labhalabhau jayajayau', translation: 'Treating alike pleasure and pain, gain and loss, victory and defeat, engage in battle. You will incur no sin.', explanation: 'Equanimity in all outcomes frees you from suffering.', emotions: ['anxiety', 'peace'], keywords: ['equanimity', 'balance', 'detachment', 'freedom'] },
  { id: '2.47', chapter: 2, verse: 47, sanskrit: 'Karmanye vadhikaraste Ma Phaleshu Kadachana', translation: 'You have the right to work, but never to the fruit of work.', explanation: 'Focus on action without attachment to outcomes. This frees you from anxiety about results.', emotions: ['anxiety', 'confusion'], keywords: ['action', 'detachment', 'karma', 'work'] },
  { id: '2.48', chapter: 2, verse: 48, sanskrit: 'Yoga-sthah kuru karmani sangam tyaktva dhananjaya', translation: 'Be steadfast in yoga. Perform your duty and abandon all attachment to success or failure.', explanation: 'Equanimity in action is true yoga. Let go of the need to control outcomes.', emotions: ['anxiety', 'confusion'], keywords: ['equanimity', 'yoga', 'duty', 'balance'] },
  { id: '2.50', chapter: 2, verse: 50, sanskrit: 'Buddhiyukto jahatiha ubhe sukrta-duskrte', translation: 'One who is united with wisdom casts off both good and evil deeds. Therefore, strive for yoga — yoga is skill in action.', explanation: 'Wisdom in action means acting skillfully without ego attachment.', emotions: ['confusion', 'hope'], keywords: ['wisdom', 'skill', 'yoga', 'action'] },
  { id: '2.56', chapter: 2, verse: 56, sanskrit: 'Duhkheshv anudvigna-manah sukheshu vigata-sprhah', translation: 'One whose mind remains undisturbed amidst misery, who does not crave pleasure, free from attachment, fear, and anger — is called a sage.', explanation: 'Steady wisdom means being unmoved by life\'s ups and downs.', emotions: ['peace', 'anger', 'anxiety'], keywords: ['wisdom', 'steady', 'equanimity', 'sage'] },
  { id: '2.62', chapter: 2, verse: 62, sanskrit: 'Dhyayato vishayan pumsah sangas teshupajayate', translation: 'Contemplating sense objects breeds attachment; from attachment springs desire; from desire anger arises.', explanation: 'Understanding the chain: attachment leads to desire, desire to anger. Break the chain early.', emotions: ['anger', 'confusion'], keywords: ['attachment', 'desire', 'anger', 'chain'] },
  { id: '2.63', chapter: 2, verse: 63, sanskrit: 'Krodhad bhavati sammohah sammohat smriti-vibhramah', translation: 'From anger arises delusion; from delusion, confusion of memory; from confusion of memory, loss of reason; from loss of reason, one is ruined.', explanation: 'Anger clouds judgement. Pause before it cascades into regret.', emotions: ['anger'], keywords: ['anger', 'delusion', 'reason', 'ruin', 'pause'] },
  { id: '2.64', chapter: 2, verse: 64, sanskrit: 'Raga-dvesa-vimuktais tu vishayan indriyais caran', translation: 'One who moves among sense objects with senses free from attachment and aversion attains tranquility.', explanation: 'You can engage with the world without being enslaved by it.', emotions: ['peace', 'anxiety'], keywords: ['freedom', 'senses', 'tranquility', 'detachment'] },
  { id: '2.70', chapter: 2, verse: 70, sanskrit: 'Apuryamanam achala-pratishtham samudram apah pravisanti yadvat', translation: 'As the ocean remains undisturbed by the incessant flow of waters, so the person unmoved by desires attains peace.', explanation: 'Be like the ocean — vast, deep, unmoved by the waves on the surface.', emotions: ['peace', 'anxiety'], keywords: ['ocean', 'peace', 'undisturbed', 'steady'] },

  // ── Chapter 3: Action (purpose, overcoming inertia) ──
  { id: '3.8', chapter: 3, verse: 8, sanskrit: 'Niyatam kuru karma tvam karma jyayo hy akarmanah', translation: 'Perform your prescribed duty, for action is better than inaction. Even the maintenance of your body depends on action.', explanation: 'Action beats inaction. Even small steps forward matter.', emotions: ['sadness', 'confusion'], keywords: ['action', 'duty', 'inertia', 'purpose'] },
  { id: '3.19', chapter: 3, verse: 19, sanskrit: 'Tasmad asaktah satatam karyam karma samachara', translation: 'Therefore, without attachment, always perform action that should be done; for by performing action without attachment one reaches the Supreme.', explanation: 'Do what needs to be done, without clinging to results.', emotions: ['anxiety', 'confusion'], keywords: ['action', 'detachment', 'duty', 'supreme'] },
  { id: '3.27', chapter: 3, verse: 27, sanskrit: 'Prakriteh kriyamanani gunaih karmani sarvashah', translation: 'All actions are performed by the qualities of nature alone. One whose mind is deluded by ego thinks "I am the doer."', explanation: 'Let go of the ego that says "I did this." Life flows through you.', emotions: ['anxiety', 'peace'], keywords: ['ego', 'nature', 'humility', 'flow'] },
  { id: '3.35', chapter: 3, verse: 35, sanskrit: 'Shreyaan sva-dharmo vigunah para-dharmaat sv-anushthitaat', translation: 'It is far better to perform one\'s own duty imperfectly than another\'s duty perfectly.', explanation: 'Be yourself. Your unique path, even with flaws, is more fulfilling than imitating others.', emotions: ['confusion', 'anxiety', 'hope'], keywords: ['dharma', 'duty', 'purpose', 'authenticity'] },
  { id: '3.37', chapter: 3, verse: 37, sanskrit: 'Kama esha krodha esha rajo-guna-samudbhavah', translation: 'It is desire and anger, born of passion, that consume and corrupt.', explanation: 'Desire and anger are powerful forces. Awareness is the first step to mastering them.', emotions: ['anger', 'confusion'], keywords: ['desire', 'anger', 'passion', 'awareness'] },
  { id: '3.42', chapter: 3, verse: 42, sanskrit: 'Indriyani parany ahur indriyebhyah param manah', translation: 'The senses are superior to the body; the mind is superior to the senses; the intellect is superior to the mind; and the soul is superior to all.', explanation: 'You are not your body, not your thoughts. You are something far greater.', emotions: ['confusion', 'hope'], keywords: ['soul', 'mind', 'senses', 'identity'] },

  // ── Chapter 4: Knowledge (self-doubt, trust) ──
  { id: '4.7', chapter: 4, verse: 7, sanskrit: 'Yada yada hi dharmasya glanir bhavati bharata', translation: 'Whenever righteousness declines and unrighteousness rises, I manifest Myself.', explanation: 'In your darkest moment, divine help appears. You are never truly alone.', emotions: ['sadness', 'hope'], keywords: ['divine', 'protection', 'righteousness', 'manifest'] },
  { id: '4.10', chapter: 4, verse: 10, sanskrit: 'Vita-raga-bhaya-krodhah man-maya mam upashritah', translation: 'Freed from attachment, fear, and anger, absorbed in Me, taking refuge in Me — many have attained My nature.', explanation: 'Freedom from fear, anger, and attachment is possible. Many have walked this path before you.', emotions: ['anger', 'anxiety', 'hope'], keywords: ['freedom', 'fear', 'anger', 'refuge'] },
  { id: '4.18', chapter: 4, verse: 18, sanskrit: 'Karmany akarma yah pashyed akarmani cha karma yah', translation: 'One who sees inaction in action and action in inaction is wise among men.', explanation: 'True wisdom sees beyond surface appearances. Sometimes stillness is the greatest action.', emotions: ['confusion', 'peace'], keywords: ['wisdom', 'action', 'inaction', 'insight'] },
  { id: '4.33', chapter: 4, verse: 33, sanskrit: 'Shreyaan dravya-mayaad yajnaaj jnaana-yajnah parantapa', translation: 'The sacrifice of knowledge is superior to any material sacrifice.', explanation: 'Investing in understanding yourself is the highest investment you can make.', emotions: ['confusion', 'hope'], keywords: ['knowledge', 'sacrifice', 'wisdom', 'investment'] },
  { id: '4.38', chapter: 4, verse: 38, sanskrit: 'Na hi jnanena sadrsham pavitram iha vidyate', translation: 'In this world, there is nothing as purifying as knowledge.', explanation: 'Knowledge purifies the soul. Seek understanding and peace will follow.', emotions: ['confusion', 'hope'], keywords: ['knowledge', 'wisdom', 'purification', 'learning'] },
  { id: '4.39', chapter: 4, verse: 39, sanskrit: 'Shraddhaval labhate jnanam tat-parah samyatendriyah', translation: 'One who has faith, who is devoted, and who has mastery over the senses attains knowledge.', explanation: 'Faith opens the door to wisdom. Trust the process of your growth.', emotions: ['confusion', 'hope'], keywords: ['faith', 'wisdom', 'devotion', 'trust'] },

  // ── Chapter 5: Inner Peace (letting go) ──
  { id: '5.10', chapter: 5, verse: 10, sanskrit: 'Brahmany adhaya karmani sangam tyaktva karoti yah', translation: 'One who acts without attachment, offering results to the divine, is untouched by sin, as a lotus leaf by water.', explanation: 'Like a lotus in muddy water, you can stay pure amidst chaos.', emotions: ['peace', 'anxiety'], keywords: ['lotus', 'purity', 'detachment', 'untouched'] },
  { id: '5.21', chapter: 5, verse: 21, sanskrit: 'Bahya-sparshesv asaktatma vindaty atmani yat sukham', translation: 'One whose self is unattached to external contacts finds happiness within.', explanation: 'True joy is not found in external things. It is already within you.', emotions: ['peace', 'hope'], keywords: ['inner', 'happiness', 'detachment', 'self'] },
  { id: '5.29', chapter: 5, verse: 29, sanskrit: 'Bhoktaram yajna-tapasam sarva-loka-maheshvaram', translation: 'Knowing Me as the friend of all living entities, one attains peace.', explanation: 'The divine is the friend of ALL beings. Peace comes from knowing you are loved.', emotions: ['peace', 'love', 'sadness'], keywords: ['peace', 'friend', 'divine', 'sacrifice'] },

  // ── Chapter 6: Meditation & Mindfulness (12 verses) ──
  { id: '6.5', chapter: 6, verse: 5, sanskrit: 'Uddhared atmanatmanam natmanam avasadayet', translation: 'One must elevate oneself by one\'s own mind, not degrade oneself. The mind can be friend or enemy.', explanation: 'You have the power to lift yourself up. Your mind can be your greatest ally.', emotions: ['sadness', 'hope', 'anxiety'], keywords: ['mind', 'self', 'elevation', 'friend', 'enemy'] },
  { id: '6.6', chapter: 6, verse: 6, sanskrit: 'Bandhur atmatmanas tasya yenatmaivatmana jitah', translation: 'For one who has conquered the mind, the mind is the best friend; for one who has not, the mind is the greatest enemy.', explanation: 'Master your mind, and it becomes your greatest asset.', emotions: ['anxiety', 'confusion'], keywords: ['mind', 'friend', 'enemy', 'mastery'] },
  { id: '6.7', chapter: 6, verse: 7, sanskrit: 'Jitatmanah prashantasya paramatma samahitah', translation: 'For one who has conquered the mind, the Supreme Self is already reached in peace.', explanation: 'Peace is not something you find — it is what remains when the mind settles.', emotions: ['peace', 'hope'], keywords: ['peace', 'mind', 'supreme', 'self'] },
  { id: '6.17', chapter: 6, verse: 17, sanskrit: 'Yuktahara-viharasya yukta-cestasya karmasu', translation: 'One regulated in eating, sleeping, recreation, and work can mitigate all pains by practicing yoga.', explanation: 'Balance in daily habits is the foundation of mental peace.', emotions: ['anxiety', 'peace'], keywords: ['balance', 'habits', 'regulation', 'health'] },
  { id: '6.19', chapter: 6, verse: 19, sanskrit: 'Yatha dipo nivata-stho nengate sopama smrta', translation: 'As a lamp in a windless place does not flicker, so is the disciplined mind of a yogi.', explanation: 'A calm mind is like a steady flame — unwavering, bright, at peace.', emotions: ['peace', 'anxiety'], keywords: ['calm', 'steady', 'lamp', 'discipline'] },
  { id: '6.22', chapter: 6, verse: 22, sanskrit: 'Yam labdhva chaparam labham manyate nadhikam tatah', translation: 'Having gained this state, one thinks there is no greater gain. Nothing can shake one situated therein.', explanation: 'Inner peace is the greatest treasure. Once found, nothing can shake you.', emotions: ['peace', 'hope'], keywords: ['peace', 'unshakable', 'treasure', 'stability'] },
  { id: '6.23', chapter: 6, verse: 23, sanskrit: 'Tam vidyad duhkha-samyoga-viyogam yoga-samjnitam', translation: 'Know that which is called yoga to be the severance of the contact with suffering.', explanation: 'Yoga is not just poses — it is the science of disconnecting from suffering.', emotions: ['sadness', 'hope'], keywords: ['yoga', 'suffering', 'freedom', 'disconnect'] },
  { id: '6.25', chapter: 6, verse: 25, sanskrit: 'Shanaih shanair uparamed buddhya dhriti-grhitaya', translation: 'Gradually, step by step, with full conviction, one should become situated in trance by means of intelligence.', explanation: 'Progress comes gradually. Be patient with yourself — one step at a time.', emotions: ['anxiety', 'confusion'], keywords: ['patience', 'gradual', 'progress', 'step'] },
  { id: '6.26', chapter: 6, verse: 26, sanskrit: 'Yato yato nishcalati manash chanchalam asthiram', translation: 'Wherever the restless mind wanders, one should bring it back under the control of the self.', explanation: 'The mind will wander. Gently bring it back, again and again. That IS the practice.', emotions: ['anxiety', 'confusion'], keywords: ['mind', 'wander', 'practice', 'gentle'] },
  { id: '6.32', chapter: 6, verse: 32, sanskrit: 'Atmaupamyena sarvatra samam pashyati yo rjuna', translation: 'One who sees all beings as equal, feeling their joys and sorrows as one\'s own, is the greatest yogi.', explanation: 'Empathy is the highest spiritual practice. Feeling others\' joy and pain as your own.', emotions: ['love', 'peace'], keywords: ['empathy', 'equality', 'compassion', 'yogi'] },
  { id: '6.34', chapter: 6, verse: 34, sanskrit: 'Chanchalam hi manah krishna pramathi balavad drdham', translation: 'The mind is restless, turbulent, strong, and unyielding. I deem it as hard to control as the wind.', explanation: 'Even Arjuna struggled with his mind. You are not alone in this battle.', emotions: ['anxiety', 'confusion'], keywords: ['mind', 'restless', 'struggle', 'normal'] },
  { id: '6.35', chapter: 6, verse: 35, sanskrit: 'Asamsayam maha-baho mano durnigraham chalam', translation: 'The mind is restless, but it can be controlled by practice and detachment.', explanation: 'The restless mind is tamed through consistent practice and letting go.', emotions: ['anxiety', 'confusion'], keywords: ['mind', 'restless', 'practice', 'detachment', 'control'] },

  // ── Chapter 7: Divine Connection (existential questions) ──
  { id: '7.7', chapter: 7, verse: 7, sanskrit: 'Mattah parataram nanyat kinchid asti dhananjaya', translation: 'There is nothing whatsoever higher than Me. Everything rests upon Me, as pearls on a thread.', explanation: 'You are connected to something infinite. Every part of existence is threaded together.', emotions: ['confusion', 'hope', 'peace'], keywords: ['connection', 'divine', 'unity', 'thread'] },
  { id: '7.19', chapter: 7, verse: 19, sanskrit: 'Bahunam janmanam ante jnanavaan maam prapadyate', translation: 'After many births, one in true knowledge surrenders unto Me, knowing that all is the divine.', explanation: 'The search for meaning has a destination. Trust your journey.', emotions: ['confusion', 'seeking', 'hope'], keywords: ['journey', 'knowledge', 'surrender', 'meaning'] },

  // ── Chapter 8: The Eternal (death anxiety, transcendence) ──
  { id: '8.5', chapter: 8, verse: 5, sanskrit: 'Anta-kale cha mam eva smaran muktva kalevaram', translation: 'One who remembers Me at the time of death attains My nature. Of this there is no doubt.', explanation: 'What you hold in your heart at the deepest level defines your destiny.', emotions: ['anxiety', 'peace', 'hope'], keywords: ['death', 'eternal', 'remember', 'destiny'] },
  { id: '8.15', chapter: 8, verse: 15, sanskrit: 'Mam upetya punar janma duhkhalayam ashashvatam', translation: 'Having attained Me, the great souls never return to this temporary world full of miseries.', explanation: 'Liberation from suffering is real and attainable. The soul yearns for this freedom.', emotions: ['sadness', 'hope'], keywords: ['liberation', 'suffering', 'freedom', 'soul'] },

  // ── Chapter 9: Self-Worth & Acceptance ──
  { id: '9.22', chapter: 9, verse: 22, sanskrit: 'Ananyash chintayanto mam ye janah paryupasate', translation: 'To those who worship Me with love, I carry what they lack and preserve what they have.', explanation: 'The divine provides and protects those who surrender with devotion.', emotions: ['love', 'hope', 'sadness'], keywords: ['devotion', 'protection', 'love', 'surrender'] },
  { id: '9.26', chapter: 9, verse: 26, sanskrit: 'Patram pushpam phalam toyam yo me bhaktya prayacchati', translation: 'Whoever offers Me a leaf, a flower, fruit, or water with devotion — I accept that offering of love.', explanation: 'Your small sincere efforts are enough. You don\'t need grand gestures.', emotions: ['love', 'hope', 'sadness'], keywords: ['offering', 'devotion', 'simple', 'love'] },
  { id: '9.29', chapter: 9, verse: 29, sanskrit: 'Samo ham sarva-bhuteshu na me dveshyo sti na priyah', translation: 'I am equal to all beings. None is hateful or dear to Me. But those who worship Me with devotion — they are in Me, and I in them.', explanation: 'The divine does not play favorites. Everyone is equally worthy of love.', emotions: ['love', 'peace'], keywords: ['equality', 'love', 'divine', 'worthy'] },
  { id: '9.30', chapter: 9, verse: 30, sanskrit: 'Api chet su-duracharo bhajate mam ananya-bhak', translation: 'Even the most sinful person, if devoted with sincerity, shall be regarded as righteous.', explanation: 'Your past does not define you. The decision to change is what matters.', emotions: ['sadness', 'hope', 'love'], keywords: ['redemption', 'forgiveness', 'change', 'righteous'] },
  { id: '9.34', chapter: 9, verse: 34, sanskrit: 'Man-mana bhava mad-bhakto mad-yaji mam namaskuru', translation: 'Always think of Me, become My devotee, worship Me, and offer homage unto Me.', explanation: 'Simple devotion — thinking, loving, offering — is the path to peace.', emotions: ['love', 'peace'], keywords: ['devotion', 'worship', 'surrender', 'simplicity'] },

  // ── Chapter 10: Divine Qualities (low self-esteem) ──
  { id: '10.20', chapter: 10, verse: 20, sanskrit: 'Aham atma gudakesha sarva-bhutashaya-sthitah', translation: 'I am the Self seated in the hearts of all creatures. I am the beginning, the middle, and the end of all beings.', explanation: 'The divine is not distant — it lives in your own heart. You carry infinity within.', emotions: ['love', 'hope', 'peace'], keywords: ['heart', 'divine', 'self', 'infinity'] },
  { id: '10.41', chapter: 10, verse: 41, sanskrit: 'Yad yad vibhutimat sattvam shrimad urjitam eva va', translation: 'Whatever is glorious, prosperous, or powerful — know that to spring from but a spark of My splendor.', explanation: 'Every beautiful quality in you is a spark of the divine. Own your brilliance.', emotions: ['hope', 'love', 'peace'], keywords: ['glory', 'divine', 'splendor', 'brilliance'] },

  // ── Chapter 11: Cosmic Perspective (humility, awe) ──
  { id: '11.33', chapter: 11, verse: 33, sanskrit: 'Tasmat tvam uttishtha yasho labhasva', translation: 'Therefore arise and attain glory. Conquer your enemies and enjoy a flourishing kingdom.', explanation: 'Rise up! Your destiny awaits. Action conquers fear.', emotions: ['hope', 'confusion', 'anxiety'], keywords: ['arise', 'glory', 'courage', 'action', 'destiny'] },
  { id: '11.55', chapter: 11, verse: 55, sanskrit: 'Mat-karma-krt mat-paramo mad-bhaktah sanga-varjitah', translation: 'One who works for Me, who makes Me the supreme goal, who is devoted and free from attachment and enmity — comes to Me.', explanation: 'Devotion, purposeful work, and freedom from ill-will — this is the complete path.', emotions: ['peace', 'love', 'hope'], keywords: ['devotion', 'purpose', 'freedom', 'path'] },

  // ── Chapter 12: Devotion & Relationships ──
  { id: '12.7', chapter: 12, verse: 7, sanskrit: 'Tesham aham samuddharta mrtyu-samsara-sagarat', translation: 'For those who fix their minds on Me, I swiftly rescue them from the ocean of birth and death.', explanation: 'When you feel like drowning, call out. Help comes swiftly to the sincere.', emotions: ['sadness', 'anxiety', 'hope'], keywords: ['rescue', 'ocean', 'help', 'faith'] },
  { id: '12.13', chapter: 12, verse: 13, sanskrit: 'Adveshta sarva-bhutanam maitrah karuna eva cha', translation: 'One who is not envious but kind to all, compassionate and free from ego — is very dear to Me.', explanation: 'Compassion, kindness, and freedom from ego make you dear to the divine.', emotions: ['love', 'peace', 'anger'], keywords: ['compassion', 'kindness', 'ego', 'friendship'] },
  { id: '12.14', chapter: 12, verse: 14, sanskrit: 'Santushthah satatam yogi yatatma drdha-nishchayah', translation: 'One who is always satisfied, self-controlled, and firmly resolved — such a devotee is dear to Me.', explanation: 'Contentment and resolve together create an unshakable spirit.', emotions: ['peace', 'hope'], keywords: ['contentment', 'resolve', 'devotion', 'satisfaction'] },
  { id: '12.15', chapter: 12, verse: 15, sanskrit: 'Yasman nodvijate loko lokan nodvijate cha yah', translation: 'One by whom the world is not disturbed and who is not disturbed by the world — is dear to Me.', explanation: 'True peace means you do not disturb others, nor are you disturbed.', emotions: ['peace', 'anger'], keywords: ['peace', 'undisturbed', 'harmony', 'world'] },
  { id: '12.18', chapter: 12, verse: 18, sanskrit: 'Samah shatrau cha mitre cha tatha manapamanayoh', translation: 'Equal toward friend and foe, in honor and dishonor, in heat and cold, in pleasure and pain — free from attachment.', explanation: 'Equanimity toward all circumstances is the mark of true strength.', emotions: ['peace', 'anger', 'anxiety'], keywords: ['equanimity', 'equal', 'strength', 'balance'] },

  // ── Chapter 13: Identity & Self-Knowledge ──
  { id: '13.28', chapter: 13, verse: 28, sanskrit: 'Samam pashyan hi sarvatra samavasthitam ishvaram', translation: 'One who sees the divine equally present everywhere, in every living being, does not degrade the self.', explanation: 'See the sacred in everyone, including yourself. You are divine.', emotions: ['love', 'peace', 'hope'], keywords: ['divine', 'equality', 'sacred', 'self'] },
  { id: '13.34', chapter: 13, verse: 34, sanskrit: 'Yatha prakashayaty ekah krtsnam lokam imam ravih', translation: 'As the sun illuminates the entire world, so the soul illuminates the entire body.', explanation: 'Your soul is the light that animates your entire being. You are not darkness.', emotions: ['hope', 'sadness'], keywords: ['soul', 'light', 'sun', 'illuminate'] },

  // ── Chapter 14: Habits & Mood (gunas) ──
  { id: '14.22', chapter: 14, verse: 22, sanskrit: 'Prakasham cha pravrttim cha moham eva cha pandava', translation: 'One who does not hate illumination, attachment, or delusion when they arise, nor longs when they disappear — transcends the gunas.', explanation: 'Accept all experiences without clinging or resisting. This is true freedom.', emotions: ['peace', 'confusion'], keywords: ['acceptance', 'gunas', 'freedom', 'transcendence'] },
  { id: '14.26', chapter: 14, verse: 26, sanskrit: 'Mam cha yo vyabhicharena bhakti-yogena sevate', translation: 'One who serves Me with unswerving devotion transcends the three modes of nature and becomes fit for union with the divine.', explanation: 'Steady devotion lifts you above the push-pull of moods and habits.', emotions: ['peace', 'hope'], keywords: ['devotion', 'transcend', 'gunas', 'steady'] },

  // ── Chapter 15: Life Purpose ──
  { id: '15.5', chapter: 15, verse: 5, sanskrit: 'Nirmana-moha jita-sanga-doshah', translation: 'Free from pride and delusion, victorious over attachment, dwelling in the self — such persons reach the eternal goal.', explanation: 'Freedom from ego and attachment reveals your true life purpose.', emotions: ['confusion', 'hope', 'peace'], keywords: ['freedom', 'ego', 'purpose', 'eternal'] },
  { id: '15.15', chapter: 15, verse: 15, sanskrit: 'Sarvasya chaham hrdi sannivishto', translation: 'I am seated in the hearts of all living beings. From Me come memory, knowledge, and forgetfulness.', explanation: 'The divine lives within your very heart. You are never separate from love.', emotions: ['love', 'sadness', 'hope'], keywords: ['heart', 'divine', 'memory', 'knowledge'] },

  // ── Chapter 16: Character Growth (toxic traits vs virtues) ──
  { id: '16.1', chapter: 16, verse: 1, sanskrit: 'Abhayam sattva-samsuddhir jnana-yoga-vyavasthitih', translation: 'Fearlessness, purity of heart, steadfastness in knowledge and yoga — these are the divine qualities.', explanation: 'Cultivate courage, purity, and knowledge. These are your divine heritage.', emotions: ['hope', 'anxiety'], keywords: ['fearless', 'purity', 'courage', 'divine'] },
  { id: '16.2', chapter: 16, verse: 2, sanskrit: 'Ahimsa satyam akrodhas tyagah shantir apaishunam', translation: 'Non-violence, truthfulness, freedom from anger, renunciation, tranquility, aversion to fault-finding — these belong to the godly.', explanation: 'Non-violence, truth, and peace are your natural state. Return to them.', emotions: ['anger', 'peace', 'hope'], keywords: ['nonviolence', 'truth', 'anger', 'peace'] },
  { id: '16.3', chapter: 16, verse: 3, sanskrit: 'Tejah kshama dhritih shaucham adroho natimamita', translation: 'Vigor, forgiveness, fortitude, cleanliness, bearing no malice, absence of excessive pride — these are the godly.', explanation: 'Forgiveness and fortitude are signs of inner strength, not weakness.', emotions: ['anger', 'hope'], keywords: ['forgiveness', 'strength', 'fortitude', 'pride'] },
  { id: '16.21', chapter: 16, verse: 21, sanskrit: 'Tri-vidham narakasyedam dvaram nashanam atmanah', translation: 'There are three gates to self-destruction: lust, anger, and greed. One must abandon these three.', explanation: 'Lust, anger, and greed are the three destroyers. Awareness is the first defense.', emotions: ['anger', 'confusion'], keywords: ['lust', 'anger', 'greed', 'gates', 'awareness'] },

  // ── Chapter 17: Faith & Discipline ──
  { id: '17.3', chapter: 17, verse: 3, sanskrit: 'Sattvanurupa sarvasya shraddha bhavati bharata', translation: 'The faith of each is in accordance with one\'s own nature. A person is made of their faith — whatever their faith, that they are.', explanation: 'You become what you believe. Choose your beliefs wisely.', emotions: ['confusion', 'hope'], keywords: ['faith', 'belief', 'nature', 'become'] },
  { id: '17.14', chapter: 17, verse: 14, sanskrit: 'Deva-dvija-guru-prajna-pujanam shaucham arjavam', translation: 'Worship of the divine, the wise, and the teacher — purity, simplicity, non-violence — these are the austerities of the body.', explanation: 'Respect, purity, and simplicity are practices that heal the body and mind.', emotions: ['peace', 'hope'], keywords: ['respect', 'purity', 'simplicity', 'discipline'] },
  { id: '17.16', chapter: 17, verse: 16, sanskrit: 'Manah-prasadah saumyatvam maunam atma-vinigrahah', translation: 'Serenity of mind, gentleness, silence, self-control, and purity of purpose — these are the austerities of the mind.', explanation: 'A serene mind, gentle speech, and clear purpose — this is mental discipline.', emotions: ['anxiety', 'peace'], keywords: ['serenity', 'gentle', 'silence', 'discipline'] },

  // ── Chapter 18: Liberation & Integration (10 verses) ──
  { id: '18.20', chapter: 18, verse: 20, sanskrit: 'Sarva-bhuteshu yenaikam bhavam avyayam ikshate', translation: 'That knowledge by which one sees the imperishable reality in all beings — know that to be in the mode of goodness.', explanation: 'See the unchanging essence in every being. This is the highest knowledge.', emotions: ['peace', 'love', 'hope'], keywords: ['unity', 'reality', 'goodness', 'essence'] },
  { id: '18.37', chapter: 18, verse: 37, sanskrit: 'Yat tad agre visham iva pariname amritopamam', translation: 'That which seems like poison at first but becomes nectar in the end — that is happiness of goodness.', explanation: 'True growth is hard at first but sweet later. Your struggle is creating something beautiful.', emotions: ['sadness', 'hope', 'anxiety'], keywords: ['struggle', 'growth', 'patience', 'nectar'] },
  { id: '18.46', chapter: 18, verse: 46, sanskrit: 'Yatah pravrttir bhutanam yena sarvam idam tatam', translation: 'One attains perfection by worshipping through one\'s own work Him from whom all beings originate.', explanation: 'Your work, done with devotion, is itself a form of worship and spiritual growth.', emotions: ['confusion', 'hope', 'peace'], keywords: ['work', 'worship', 'perfection', 'devotion'] },
  { id: '18.47', chapter: 18, verse: 47, sanskrit: 'Shreyaan sva-dharmo vigunah para-dharmaat sv-anushthitaat', translation: 'It is better to follow your own dharma imperfectly than to follow another\'s perfectly.', explanation: 'Your unique path, even imperfect, is more authentic than copying others.', emotions: ['confusion', 'anxiety', 'hope'], keywords: ['dharma', 'authenticity', 'path', 'purpose'] },
  { id: '18.54', chapter: 18, verse: 54, sanskrit: 'Brahma-bhutah prasannatma na shochati na kankshati', translation: 'One who is self-realized is peaceful, does not grieve, does not desire, and is equal to all beings.', explanation: 'Self-realization brings a peace that needs nothing and fears nothing.', emotions: ['peace', 'hope'], keywords: ['realization', 'peace', 'equal', 'free'] },
  { id: '18.58', chapter: 18, verse: 58, sanskrit: 'Mac-chittah sarva-durgani mat-prasadaat tarishyasi', translation: 'If you become conscious of Me, you will pass over all obstacles by My grace.', explanation: 'With divine awareness, no obstacle is insurmountable. Grace carries you through.', emotions: ['anxiety', 'hope'], keywords: ['grace', 'obstacles', 'awareness', 'faith'] },
  { id: '18.61', chapter: 18, verse: 61, sanskrit: 'Ishvarah sarva-bhutanam hrd-deshe rjuna tishthati', translation: 'The Supreme Lord dwells in the heart of all beings, directing their wanderings by His maya.', explanation: 'Trust the divine intelligence that guides all life. You are part of something far greater.', emotions: ['confusion', 'peace', 'hope'], keywords: ['divine', 'heart', 'trust', 'guidance'] },
  { id: '18.65', chapter: 18, verse: 65, sanskrit: 'Man-mana bhava mad-bhakto mad-yaji mam namaskuru', translation: 'Always think of Me, be devoted to Me, worship Me, and offer obeisance to Me. You shall come to Me.', explanation: 'The simplest practice: think of the divine, love the divine, offer everything to the divine.', emotions: ['love', 'peace', 'hope'], keywords: ['devotion', 'love', 'surrender', 'practice'] },
  { id: '18.66', chapter: 18, verse: 66, sanskrit: 'Sarva-dharman parityajya mam ekam sharanam vraja', translation: 'Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you. Do not fear.', explanation: 'The ultimate promise: surrender your worries and be free. Do not fear.', emotions: ['anxiety', 'sadness', 'hope', 'love', 'peace'], keywords: ['surrender', 'freedom', 'fear', 'divine', 'promise'] },
  { id: '18.78', chapter: 18, verse: 78, sanskrit: 'Yatra yogeshvarah krishno yatra partho dhanur-dharah', translation: 'Wherever there is Krishna, the master of yoga, and Arjuna, the archer — there is victory, prosperity, and righteousness.', explanation: 'When wisdom and action unite, victory is certain. You have both within you.', emotions: ['hope', 'peace'], keywords: ['victory', 'wisdom', 'action', 'power'] },
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
