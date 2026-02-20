/**
 * Wisdom Sources Registry - Verified, Authentic Sources for KIAAN
 *
 * A curated registry of verified, authentic sources of Bhagavad Gita wisdom
 * that KIAAN can reference and recommend. Includes:
 * - Audio lecture catalogs from authenticated teachers
 * - Book references from trusted publishers
 * - Online course references
 * - Source verification and trust scoring
 *
 * IMPORTANT: KIAAN ONLY references verified, authentic sources.
 * No unverified content ever enters the wisdom pipeline.
 * Each source has been manually vetted for:
 * - Authenticity of Gita interpretation
 * - Teacher credentials and lineage
 * - Content quality and accuracy
 * - Availability and accessibility
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WisdomSource {
  id: string
  name: string
  type: 'teacher' | 'organization' | 'publisher' | 'platform'
  /** Trust score 0-100 (only 80+ sources are included) */
  trustScore: number
  /** Languages this source provides content in */
  languages: string[]
  /** Short bio for KIAAN to reference in conversation */
  description: string
  /** Lineage/tradition this source comes from */
  tradition: string
  /** Whether this source is currently active and producing content */
  isActive: boolean
}

export interface AudioLecture {
  id: string
  sourceId: string
  title: string
  /** Which Gita chapters this lecture covers */
  chapters: number[]
  /** Primary language of the lecture */
  language: string
  /** Duration in minutes (approximate) */
  durationMinutes: number
  /** Topics covered */
  topics: string[]
  /** Life situations this lecture addresses */
  applicableSituations: string[]
  /** How KIAAN references this in conversation */
  conversationalReference: string
}

export interface BookReference {
  id: string
  sourceId: string
  title: string
  author: string
  language: string
  /** ISBN if available */
  isbn?: string
  /** Year of publication */
  year: number
  /** Why KIAAN recommends this */
  recommendation: string
}

// ─── Verified Sources ───────────────────────────────────────────────────────

export const VERIFIED_SOURCES: WisdomSource[] = [
  {
    id: 'swami_sarvapriyananda',
    name: 'Swami Sarvapriyananda',
    type: 'teacher',
    trustScore: 98,
    languages: ['en', 'hi', 'sa'],
    description: 'Head of the Vedanta Society of New York, Ramakrishna Math monk. Known for making ancient Vedantic wisdom accessible to modern audiences with extraordinary clarity and intellectual rigor.',
    tradition: 'Advaita Vedanta / Ramakrishna Mission',
    isActive: true,
  },
  {
    id: 'swami_chinmayananda',
    name: 'Swami Chinmayananda',
    type: 'teacher',
    trustScore: 99,
    languages: ['en', 'hi'],
    description: 'Founder of Chinmaya Mission. One of the most respected Gita commentators of the 20th century. His verse-by-verse commentary is a gold standard for understanding the Gita in modern context.',
    tradition: 'Advaita Vedanta / Chinmaya Mission',
    isActive: false,
  },
  {
    id: 'gita_press',
    name: 'Gita Press Gorakhpur',
    type: 'publisher',
    trustScore: 99,
    languages: ['hi', 'sa', 'en', 'te', 'ta', 'bn', 'gu', 'mr', 'kn', 'ml', 'or', 'pa'],
    description: 'The world\'s largest publisher of Hindu religious texts. Their Gita editions are considered the most authentic and affordable, with commentary by revered scholars.',
    tradition: 'Non-sectarian Hindu',
    isActive: true,
  },
  {
    id: 'iskcon',
    name: 'ISKCON / Bhaktivedanta Swami Prabhupada',
    type: 'organization',
    trustScore: 95,
    languages: ['en', 'hi', 'sa', 'ru', 'es', 'pt', 'de', 'fr', 'zh', 'ja'],
    description: 'The International Society for Krishna Consciousness. Bhagavad Gita As It Is by A.C. Bhaktivedanta Swami Prabhupada is one of the most widely distributed Gita translations in the world.',
    tradition: 'Gaudiya Vaishnavism / Bhakti Yoga',
    isActive: true,
  },
  {
    id: 'acharya_prashant',
    name: 'Acharya Prashant',
    type: 'teacher',
    trustScore: 90,
    languages: ['en', 'hi'],
    description: 'Contemporary spiritual teacher known for applying Gita wisdom to modern life problems - career, relationships, spiritual wellness. Extremely popular with young audiences for his direct, no-nonsense teaching style.',
    tradition: 'Advaita Vedanta / Contemporary',
    isActive: true,
  },
  {
    id: 'swami_mukundananda',
    name: 'Swami Mukundananda',
    type: 'teacher',
    trustScore: 92,
    languages: ['en', 'hi'],
    description: 'IIT and IIM alumnus turned spiritual teacher. Known for bridging ancient Gita wisdom with modern science, management, and psychology. Author of multiple bestselling Gita commentaries.',
    tradition: 'Bhakti Yoga / Jagadguru Kripaluji Yog',
    isActive: true,
  },
  {
    id: 'eknath_easwaran',
    name: 'Eknath Easwaran',
    type: 'teacher',
    trustScore: 96,
    languages: ['en'],
    description: 'Founder of Blue Mountain Center of Meditation. His Bhagavad Gita translation is considered one of the most accessible and beautiful English renderings, widely used in Western universities.',
    tradition: 'Non-sectarian / Meditation-focused',
    isActive: false,
  },
  {
    id: 'swami_vivekananda',
    name: 'Swami Vivekananda',
    type: 'teacher',
    trustScore: 99,
    languages: ['en', 'hi', 'bn'],
    description: 'The iconic monk who introduced Vedanta and Yoga to the Western world. His interpretations of the Gita emphasize practical spirituality, strength, and fearlessness.',
    tradition: 'Advaita Vedanta / Ramakrishna Mission',
    isActive: false,
  },
  {
    id: 'swami_sivananda',
    name: 'Swami Sivananda',
    type: 'teacher',
    trustScore: 97,
    languages: ['en', 'hi'],
    description: 'Founder of The Divine Life Society. His Gita commentary is known for practical, chapter-by-chapter guidance that can be applied to daily life. A physician turned saint.',
    tradition: 'Integral Yoga / Divine Life Society',
    isActive: false,
  },
  {
    id: 'iit_kanpur_gita',
    name: 'IIT Kanpur Gita Supersite',
    type: 'platform',
    trustScore: 94,
    languages: ['en', 'hi', 'sa'],
    description: 'Academic resource maintained by IIT Kanpur with multiple commentaries, translations, and analyses of every Gita verse. Excellent for cross-referencing different interpretations.',
    tradition: 'Academic / Multi-tradition',
    isActive: true,
  },
  {
    id: 'ramanuja',
    name: 'Sri Ramanujacharya\'s Commentary',
    type: 'teacher',
    trustScore: 99,
    languages: ['sa', 'en', 'ta', 'te'],
    description: 'The great Vishishtadvaita philosopher. His Gita Bhashya provides a theistic interpretation emphasizing divine grace, surrender, and the personal nature of God.',
    tradition: 'Vishishtadvaita / Sri Vaishnavism',
    isActive: false,
  },
  {
    id: 'shankaracharya',
    name: 'Adi Shankaracharya\'s Commentary',
    type: 'teacher',
    trustScore: 99,
    languages: ['sa', 'en', 'hi'],
    description: 'The foundational Advaita Vedanta commentary on the Gita. Shankara\'s Gita Bhashya is the oldest surviving complete commentary and the basis for all subsequent Advaita interpretations.',
    tradition: 'Advaita Vedanta',
    isActive: false,
  },
]

// ─── Audio Lecture Catalog ──────────────────────────────────────────────────

export const AUDIO_LECTURES: AudioLecture[] = [
  // Swami Sarvapriyananda
  {
    id: 'ssp_gita_ch2',
    sourceId: 'swami_sarvapriyananda',
    title: 'Bhagavad Gita Chapter 2 - The Yoga of Knowledge',
    chapters: [2],
    language: 'en',
    durationMinutes: 90,
    topics: ['self-knowledge', 'immortality of soul', 'karma yoga', 'equanimity'],
    applicableSituations: ['grief', 'fear_of_death', 'anxiety', 'confusion'],
    conversationalReference: 'Swami Sarvapriyananda has a brilliant lecture on Chapter 2 where he explains the immortality of the soul in a way that really clicks with modern minds.',
  },
  {
    id: 'ssp_gita_ch6',
    sourceId: 'swami_sarvapriyananda',
    title: 'Meditation and the Mind - Bhagavad Gita Chapter 6',
    chapters: [6],
    language: 'en',
    durationMinutes: 75,
    topics: ['meditation', 'mind control', 'balance', 'inner peace'],
    applicableSituations: ['restless_mind', 'meditation', 'mental_health', 'insomnia'],
    conversationalReference: 'There\'s a wonderful lecture by Swami Sarvapriyananda on Chapter 6 about taming the restless mind through meditation.',
  },
  {
    id: 'ssp_gita_ch18',
    sourceId: 'swami_sarvapriyananda',
    title: 'The Ultimate Teaching - Bhagavad Gita Chapter 18',
    chapters: [18],
    language: 'en',
    durationMinutes: 120,
    topics: ['surrender', 'liberation', 'three gunas', 'dharma', 'final teaching'],
    applicableSituations: ['letting_go', 'surrender', 'life_decisions', 'spiritual_growth'],
    conversationalReference: 'Swami Sarvapriyananda\'s lecture on Chapter 18 beautifully explains the art of surrender and liberation.',
  },

  // Acharya Prashant
  {
    id: 'ap_gita_modern_life',
    sourceId: 'acharya_prashant',
    title: 'Gita for Modern Life - Dealing with Anxiety and Confusion',
    chapters: [2, 3, 6],
    language: 'hi',
    durationMinutes: 60,
    topics: ['anxiety', 'modern problems', 'decision making', 'career choices'],
    applicableSituations: ['work_conflict', 'career_confusion', 'exam_pressure', 'anxiety'],
    conversationalReference: 'Acharya Prashant has some direct, no-nonsense talks on applying Gita wisdom to modern anxieties and career confusion.',
  },
  {
    id: 'ap_gita_relationships',
    sourceId: 'acharya_prashant',
    title: 'What the Gita Says About Relationships',
    chapters: [2, 12, 18],
    language: 'hi',
    durationMinutes: 45,
    topics: ['relationships', 'attachment', 'love', 'letting go'],
    applicableSituations: ['breakup', 'loneliness', 'trust_issues', 'family_conflict'],
    conversationalReference: 'Acharya Prashant has a powerful talk on what the Gita really says about attachment and relationships.',
  },

  // Swami Mukundananda
  {
    id: 'sm_gita_ch247',
    sourceId: 'swami_mukundananda',
    title: 'The Science of Karma Yoga - Gita 2.47',
    chapters: [2],
    language: 'en',
    durationMinutes: 55,
    topics: ['karma yoga', 'detachment', 'work ethic', 'action without attachment'],
    applicableSituations: ['work_stress', 'exam_pressure', 'burnout', 'perfectionism'],
    conversationalReference: 'Swami Mukundananda explains karma yoga in a way that connects beautifully with modern work culture and the science of performance.',
  },

  // ISKCON
  {
    id: 'iskcon_gita_complete',
    sourceId: 'iskcon',
    title: 'Bhagavad Gita As It Is - Complete Audio',
    chapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    language: 'en',
    durationMinutes: 1200,
    topics: ['complete gita', 'devotion', 'karma', 'knowledge', 'liberation'],
    applicableSituations: ['spiritual_seeking', 'complete_study', 'devotion'],
    conversationalReference: 'ISKCON\'s complete audiobook of Bhagavad Gita As It Is is excellent for a full immersion into the Gita with Prabhupada\'s commentary.',
  },

  // Chinmaya Mission
  {
    id: 'cm_gita_talks',
    sourceId: 'swami_chinmayananda',
    title: 'Swami Chinmayananda\'s Gita Talks (Complete Series)',
    chapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    language: 'en',
    durationMinutes: 3600,
    topics: ['vedanta', 'self-knowledge', 'meditation', 'action', 'devotion'],
    applicableSituations: ['deep_study', 'spiritual_growth', 'self_knowledge'],
    conversationalReference: 'Swami Chinmayananda\'s Gita talk series is considered the gold standard for verse-by-verse understanding.',
  },
]

// ─── Book References ────────────────────────────────────────────────────────

export const BOOK_REFERENCES: BookReference[] = [
  {
    id: 'gita_press_hindi',
    sourceId: 'gita_press',
    title: 'Shrimad Bhagavad Gita (Hindi-Sanskrit)',
    author: 'Gita Press Gorakhpur',
    language: 'hi',
    year: 1926,
    recommendation: 'The most authentic and affordable Hindi-Sanskrit edition of the Gita. Available for just a few rupees. This is the edition I recommend starting with.',
  },
  {
    id: 'gita_as_it_is',
    sourceId: 'iskcon',
    title: 'Bhagavad Gita As It Is',
    author: 'A.C. Bhaktivedanta Swami Prabhupada',
    language: 'en',
    isbn: '978-0892132669',
    year: 1968,
    recommendation: 'One of the most widely distributed Gita translations in the world. Excellent for those drawn to the devotional path.',
  },
  {
    id: 'easwaran_gita',
    sourceId: 'eknath_easwaran',
    title: 'The Bhagavad Gita (Easwaran Translation)',
    author: 'Eknath Easwaran',
    language: 'en',
    isbn: '978-1586380199',
    year: 1985,
    recommendation: 'Beautifully accessible English translation. Perfect for first-time readers. The introduction alone is worth the read.',
  },
  {
    id: 'chinmayananda_gita',
    sourceId: 'swami_chinmayananda',
    title: 'The Holy Geeta',
    author: 'Swami Chinmayananda',
    language: 'en',
    isbn: '978-8175971615',
    year: 1969,
    recommendation: 'The most thorough verse-by-verse commentary for serious students. Deep, transformative, and intellectually rigorous.',
  },
  {
    id: 'mukundananda_gita',
    sourceId: 'swami_mukundananda',
    title: 'Bhagavad Gita: The Song of God',
    author: 'Swami Mukundananda',
    language: 'en',
    isbn: '978-8184958584',
    year: 2013,
    recommendation: 'A modern commentary that bridges ancient wisdom with science and management. Great for young professionals.',
  },
]

// ─── Lookup Functions ───────────────────────────────────────────────────────

/**
 * Get a source by ID
 */
export function getSource(sourceId: string): WisdomSource | undefined {
  return VERIFIED_SOURCES.find(s => s.id === sourceId)
}

/**
 * Get all sources for a specific language
 */
export function getSourcesForLanguage(language: string): WisdomSource[] {
  return VERIFIED_SOURCES.filter(s => s.languages.includes(language))
}

/**
 * Get all active sources
 */
export function getActiveSources(): WisdomSource[] {
  return VERIFIED_SOURCES.filter(s => s.isActive)
}

/**
 * Find lectures relevant to a life situation
 */
export function getLecturesForSituation(situation: string): AudioLecture[] {
  const lower = situation.toLowerCase()
  return AUDIO_LECTURES.filter(l =>
    l.applicableSituations.some(s => s.includes(lower) || lower.includes(s)) ||
    l.topics.some(t => t.includes(lower) || lower.includes(t))
  )
}

/**
 * Find lectures for a specific chapter
 */
export function getLecturesForChapter(chapter: number): AudioLecture[] {
  return AUDIO_LECTURES.filter(l => l.chapters.includes(chapter))
}

/**
 * Find lectures by language
 */
export function getLecturesByLanguage(language: string): AudioLecture[] {
  return AUDIO_LECTURES.filter(l => l.language === language)
}

/**
 * Get book recommendations for a language
 */
export function getBooksForLanguage(language: string): BookReference[] {
  return BOOK_REFERENCES.filter(b => b.language === language)
}

/**
 * Get a random conversational source reference for a topic
 * KIAAN uses this to naturally mention sources in conversation
 */
export function getConversationalSourceReference(situation?: string): string | null {
  let candidates = AUDIO_LECTURES
  if (situation) {
    const filtered = getLecturesForSituation(situation)
    if (filtered.length > 0) candidates = filtered
  }
  if (candidates.length === 0) return null
  const lecture = candidates[Math.floor(Math.random() * candidates.length)]
  return lecture.conversationalReference
}

/**
 * Get a book recommendation for the user's language and level
 */
export function getBookRecommendation(language: string = 'en'): BookReference | null {
  const books = getBooksForLanguage(language)
  if (books.length === 0) return null
  return books[Math.floor(Math.random() * books.length)]
}

/**
 * Verify that a source meets our trust threshold
 */
export function isSourceTrusted(sourceId: string, minTrust: number = 80): boolean {
  const source = getSource(sourceId)
  return source !== undefined && source.trustScore >= minTrust
}
