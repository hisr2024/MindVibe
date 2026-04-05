/**
 * KIAAN Vibe - Gita Library for Mobile
 *
 * All 18 chapters with mobile-optimized metadata.
 * Bridges existing constants.ts chapter data with the mobile UI's
 * richer display requirements (accent colors, yoga types, themes, durations).
 */

// Chapter metadata and helpers for the mobile Gita experience

// ── CHAPTER METADATA (mobile-enriched) ─────────────────────────────────

export type GitaYogaType = 'karma' | 'jnana' | 'bhakti' | 'raja' | 'mixed'

export interface GitaMobileChapter {
  number: number
  sanskrit: string
  transliteration: string
  english: string
  verseCount: number
  yogaType: GitaYogaType
  theme: string
  openingVerse: string
  color: string
  durationMinutes: number
}

export const GITA_MOBILE_CHAPTERS: GitaMobileChapter[] = [
  { number: 1,  sanskrit: '\u0905\u0930\u094D\u091C\u0941\u0928\u0935\u093F\u0937\u093E\u0926\u092F\u094B\u0917',         transliteration: 'Arjuna Vishada Yoga',       english: "Arjuna's Dejection",             verseCount: 47,  yogaType: 'mixed',  theme: 'The warrior faces himself on the battlefield',       openingVerse: '\u0927\u0943\u0924\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u0909\u0935\u093E\u091A',             color: '#4338CA', durationMinutes: 35 },
  { number: 2,  sanskrit: '\u0938\u093E\u0902\u0916\u094D\u092F\u092F\u094B\u0917',               transliteration: 'Sankhya Yoga',              english: 'Transcendental Knowledge',        verseCount: 72,  yogaType: 'jnana',  theme: 'The soul is eternal. Do your duty.',                 openingVerse: '\u0915\u0941\u0924\u0938\u094D\u0924\u094D\u0935\u093E \u0915\u0936\u094D\u092E\u0932\u092E\u093F\u0926\u0902',        color: '#1D4ED8', durationMinutes: 54 },
  { number: 3,  sanskrit: '\u0915\u0930\u094D\u092E\u092F\u094B\u0917',                 transliteration: 'Karma Yoga',                english: 'Path of Action',                  verseCount: 43,  yogaType: 'karma',  theme: 'Act without attachment to results',                  openingVerse: '\u091C\u094D\u092F\u093E\u092F\u0938\u0940 \u091A\u0947\u0924\u094D\u0915\u0930\u094D\u092E\u0923\u0938\u094D\u0924\u0947',      color: '#B45309', durationMinutes: 32 },
  { number: 4,  sanskrit: '\u091C\u094D\u091E\u093E\u0928\u0915\u0930\u094D\u092E\u0938\u0902\u0928\u094D\u092F\u093E\u0938\u092F\u094B\u0917',     transliteration: 'Jnana Karma Sannyas Yoga',  english: 'Knowledge & Renunciation',        verseCount: 42,  yogaType: 'jnana',  theme: 'Knowledge purifies all karma',                       openingVerse: '\u0907\u092E\u0902 \u0935\u093F\u0935\u0938\u094D\u0935\u0924\u0947 \u092F\u094B\u0917\u0902',          color: '#7C3AED', durationMinutes: 31 },
  { number: 5,  sanskrit: '\u0915\u0930\u094D\u092E\u0938\u0902\u0928\u094D\u092F\u093E\u0938\u092F\u094B\u0917',          transliteration: 'Karma Sannyas Yoga',        english: 'Renunciation of Action',          verseCount: 29,  yogaType: 'karma',  theme: 'Sannyasa and yoga lead to the same place',           openingVerse: '\u0938\u0902\u0928\u094D\u092F\u093E\u0938\u0902 \u0915\u0930\u094D\u092E\u0923\u093E\u0902 \u0915\u0943\u0937\u094D\u0923',    color: '#065F46', durationMinutes: 22 },
  { number: 6,  sanskrit: '\u0906\u0924\u094D\u092E\u0938\u0902\u092F\u092E\u092F\u094B\u0917',             transliteration: 'Atma Samyama Yoga',         english: 'Self-Mastery through Meditation', verseCount: 47,  yogaType: 'raja',   theme: 'The restless mind can be tamed by practice',         openingVerse: '\u0905\u0928\u093E\u0936\u094D\u0930\u093F\u0924\u0903 \u0915\u0930\u094D\u092E\u092B\u0932\u0902',         color: '#0E7490', durationMinutes: 35 },
  { number: 7,  sanskrit: '\u091C\u094D\u091E\u093E\u0928\u0935\u093F\u091C\u094D\u091E\u093E\u0928\u092F\u094B\u0917',         transliteration: 'Jnana Vijnana Yoga',        english: 'Knowledge of the Absolute',       verseCount: 30,  yogaType: 'jnana',  theme: 'Know God completely, in and beyond matter',          openingVerse: '\u092E\u092F\u094D\u092F\u093E\u0938\u0915\u094D\u0924\u092E\u0928\u093E\u0903 \u092A\u093E\u0930\u094D\u0925',       color: '#9D174D', durationMinutes: 22 },
  { number: 8,  sanskrit: '\u0905\u0915\u094D\u0937\u0930\u092C\u094D\u0930\u0939\u094D\u092E\u092F\u094B\u0917',          transliteration: 'Aksara Brahma Yoga',        english: 'Attaining the Supreme',           verseCount: 28,  yogaType: 'bhakti', theme: 'The imperishable Brahman and what happens at death', openingVerse: '\u0915\u093F\u0902 \u0924\u0926\u094D\u092C\u094D\u0930\u0939\u094D\u092E \u0915\u093F\u092E\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u0902',  color: '#1E40AF', durationMinutes: 21 },
  { number: 9,  sanskrit: '\u0930\u093E\u091C\u0935\u093F\u0926\u094D\u092F\u093E\u0930\u093E\u091C\u0917\u0941\u0939\u094D\u092F\u092F\u094B\u0917',    transliteration: 'Raja Vidya Raja Guhya Yoga', english: 'The Royal Knowledge',            verseCount: 34,  yogaType: 'bhakti', theme: 'The most secret knowledge \u2014 surrender',              openingVerse: '\u0907\u0926\u0902 \u0924\u0941 \u0924\u0947 \u0917\u0941\u0939\u094D\u092F\u0924\u092E\u0902',         color: '#D4A017', durationMinutes: 25 },
  { number: 10, sanskrit: '\u0935\u093F\u092D\u0942\u0924\u093F\u092F\u094B\u0917',               transliteration: 'Vibhuti Yoga',              english: 'Divine Manifestations',           verseCount: 42,  yogaType: 'jnana',  theme: "God's infinite glories are everywhere",              openingVerse: '\u092D\u0942\u092F \u090F\u0935 \u092E\u0939\u093E\u092C\u093E\u0939\u094B',             color: '#D97706', durationMinutes: 31 },
  { number: 11, sanskrit: '\u0935\u093F\u0936\u094D\u0935\u0930\u0942\u092A\u0926\u0930\u094D\u0936\u0928\u092F\u094B\u0917',        transliteration: 'Vishwarupa Darsana Yoga',   english: 'The Universal Form',              verseCount: 55,  yogaType: 'bhakti', theme: 'Arjuna sees the cosmic form of Krishna',             openingVerse: '\u092E\u0926\u0928\u0941\u0917\u094D\u0930\u0939\u093E\u092F \u092A\u0930\u092E\u0902',            color: '#06B6D4', durationMinutes: 41 },
  { number: 12, sanskrit: '\u092D\u0915\u094D\u0924\u093F\u092F\u094B\u0917',                transliteration: 'Bhakti Yoga',               english: 'Path of Devotion',                verseCount: 20,  yogaType: 'bhakti', theme: 'The qualities of a true devotee',                    openingVerse: '\u090F\u0935\u0902 \u0938\u0924\u0924\u092F\u0941\u0915\u094D\u0924\u093E \u092F\u0947',           color: '#BE185D', durationMinutes: 15 },
  { number: 13, sanskrit: '\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u091C\u094D\u091E\u0935\u093F\u092D\u093E\u0917\u092F\u094B\u0917', transliteration: 'Kshetra Yoga',              english: 'Field & Knower of Field',         verseCount: 35,  yogaType: 'jnana',  theme: 'The body, the soul, and the awareness within',       openingVerse: '\u0907\u0926\u0902 \u0936\u0930\u0940\u0930\u0902 \u0915\u094C\u0928\u094D\u0924\u0947\u092F',         color: '#4338CA', durationMinutes: 26 },
  { number: 14, sanskrit: '\u0917\u0941\u0923\u0924\u094D\u0930\u092F\u0935\u093F\u092D\u093E\u0917\u092F\u094B\u0917',         transliteration: 'Guna Traya Yoga',           english: 'The Three Modes of Nature',       verseCount: 27,  yogaType: 'jnana',  theme: 'Sattva, Rajas, and Tamas \u2014 how they bind the soul',  openingVerse: '\u092A\u0930\u0902 \u092D\u0942\u092F\u0903 \u092A\u094D\u0930\u0935\u0915\u094D\u0937\u094D\u092F\u093E\u092E\u093F',      color: '#6D28D9', durationMinutes: 20 },
  { number: 15, sanskrit: '\u092A\u0941\u0930\u0941\u0937\u094B\u0924\u094D\u0924\u092E\u092F\u094B\u0917',           transliteration: 'Purushottama Yoga',         english: 'The Supreme Person',              verseCount: 20,  yogaType: 'jnana',  theme: 'The ultimate truth about God',                       openingVerse: '\u090A\u0930\u094D\u0927\u094D\u0935\u092E\u0942\u0932\u092E\u0927\u0903\u0936\u093E\u0916\u092E\u094D',         color: '#B45309', durationMinutes: 15 },
  { number: 16, sanskrit: '\u0926\u0948\u0935\u093E\u0938\u0941\u0930\u0938\u092E\u094D\u092A\u0926\u094D\u0935\u093F\u092D\u093E\u0917\u092F\u094B\u0917',   transliteration: 'Daivasura Yoga',            english: 'Divine & Demonic Qualities',      verseCount: 24,  yogaType: 'karma',  theme: 'The divine and demonic natures within all beings',   openingVerse: '\u0905\u092D\u092F\u0902 \u0938\u0924\u094D\u0924\u094D\u0935\u0938\u0902\u0936\u0941\u0926\u094D\u0927\u093F\u0903',      color: '#B91C1C', durationMinutes: 18 },
  { number: 17, sanskrit: '\u0936\u094D\u0930\u0926\u094D\u0927\u093E\u0924\u094D\u0930\u092F\u0935\u093F\u092D\u093E\u0917\u092F\u094B\u0917',     transliteration: 'Shraddha Traya Yoga',       english: 'Three Types of Faith',            verseCount: 28,  yogaType: 'mixed',  theme: 'Faith, food, sacrifice \u2014 all shaped by the three gunas', openingVerse: '\u092F\u0947 \u0936\u093E\u0938\u094D\u0924\u094D\u0930\u0935\u093F\u0927\u093F\u092E\u0941\u0924\u094D\u0938\u0943\u091C\u094D\u092F',   color: '#065F46', durationMinutes: 21 },
  { number: 18, sanskrit: '\u092E\u094B\u0915\u094D\u0937\u0938\u0902\u0928\u094D\u092F\u093E\u0938\u092F\u094B\u0917',         transliteration: 'Moksha Sannyas Yoga',       english: 'Liberation Through Renunciation', verseCount: 78,  yogaType: 'mixed',  theme: 'The final and complete teaching \u2014 surrender',         openingVerse: '\u0938\u0902\u0928\u094D\u092F\u093E\u0938\u0938\u094D\u092F \u092E\u0939\u093E\u092C\u093E\u0939\u094B',         color: '#D4A017', durationMinutes: 58 },
]

// ── TOTAL GITA STATS ─────────────────────────────────────────────────────

export const GITA_STATS = {
  totalChapters: 18,
  totalVerses: 700,
  totalDurationMinutes: GITA_MOBILE_CHAPTERS.reduce((s, c) => s + c.durationMinutes, 0),
  voices: [
    { id: 'divine-krishna',   name: 'Krishna',   description: 'The divine voice of the Paramatma',         speed: 0.80, color: '#1B4FBB' },
    { id: 'divine-saraswati', name: 'Saraswati', description: 'The goddess of knowledge and sacred speech', speed: 0.82, color: '#9D174D' },
    { id: 'sarvam-rishi',     name: 'Rishi',     description: 'The ancient sage \u2014 masculine, grounded',     speed: 0.85, color: '#B45309' },
    { id: 'elevenlabs-nova',  name: 'Nova',      description: 'Clear and conversational \u2014 for newcomers',   speed: 0.90, color: '#0E7490' },
  ],
} as const

// ── DEVANAGARI NUMERALS ──────────────────────────────────────────────────

export const DEVANAGARI_NUMERALS = [
  '\u0966', '\u0967', '\u0968', '\u0969', '\u096A', '\u096B', '\u096C', '\u096D', '\u096E', '\u096F',
  '\u0967\u0966', '\u0967\u0967', '\u0967\u0968', '\u0967\u0969', '\u0967\u096A', '\u0967\u096B', '\u0967\u096C', '\u0967\u096D', '\u0967\u096E',
]

// ── YOGA TYPE DISPLAY HELPERS ────────────────────────────────────────────

export const YOGA_TYPE_COLORS: Record<GitaYogaType, string> = {
  karma: '#F97316',
  jnana: '#2563EB',
  bhakti: '#BE185D',
  raja: '#0E7490',
  mixed: '#D4A017',
}

export const YOGA_TYPE_LABELS: Record<GitaYogaType, string> = {
  karma: 'Karma Yoga',
  jnana: 'Jnana Yoga',
  bhakti: 'Bhakti Yoga',
  raja: 'Raja Yoga',
  mixed: 'Mixed',
}

// ── VERSE DATA TYPE (extends Track for Gita-specific display) ───────────

export interface GitaVerseData {
  chapter: number
  verse: number
  chapterName: string
  chapterSanskrit: string
  sanskrit: string
  transliteration: string
  translation: string
  kiaanInsight?: string
  yogaType: string
  shadowuEnemy?: string
}

// ── HELPER: Get chapter by number ────────────────────────────────────────

export function getGitaMobileChapter(num: number): GitaMobileChapter | undefined {
  return GITA_MOBILE_CHAPTERS.find(c => c.number === num)
}

// ── VOICE MAPPING: Map mobile voice IDs to existing voice styles ────────

export const VOICE_TO_STYLE_MAP: Record<string, string> = {
  'divine-krishna': 'divine',
  'divine-saraswati': 'calm',
  'sarvam-rishi': 'wisdom',
  'elevenlabs-nova': 'calm',
}

export const VOICE_TO_SPEED_MAP: Record<string, number> = {
  'divine-krishna': 0.80,
  'divine-saraswati': 0.82,
  'sarvam-rishi': 0.85,
  'elevenlabs-nova': 0.90,
}
