/**
 * Bhagavad Gita Audio Constants & Configuration
 *
 * ॐ श्रीमद्भगवद्गीता
 *
 * Comprehensive audio library for authentic Bhagavad Gita recitation:
 * - Multi-language support (Sanskrit, Hindi, Telugu, Tamil, Malayalam, English)
 * - Chapter and verse-level organization
 * - Integration with ambient soundscapes
 * - Learning modes with meaning display
 *
 * Based on public domain and openly licensed sources:
 * - LibriVox (Public Domain)
 * - Internet Archive collections
 * - Traditional pandit recitations
 */

// ============ Types ============

/**
 * Supported languages for Gita audio
 */
export type GitaLanguage =
  | 'sanskrit'      // Original Sanskrit shlokas
  | 'hindi'         // Hindi translation/meaning
  | 'telugu'        // Telugu (Ghantasala legendary version)
  | 'tamil'         // Tamil version
  | 'malayalam'     // Malayalam version
  | 'english'       // English (LibriVox public domain)
  | 'kannada'       // Kannada version
  | 'gujarati'      // Gujarati version
  | 'bengali'       // Bengali version
  | 'marathi'       // Marathi version

/**
 * Gita chapter information
 */
export interface GitaChapter {
  number: number
  nameEnglish: string
  nameSanskrit: string
  nameHindi: string
  verseCount: number
  theme: string
  description: string
  yogaType: string
  duration: string  // Approximate duration for full chapter
  color: string     // Theme color for UI
}

/**
 * Gita verse information
 */
export interface GitaVerse {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  wordMeaning: string
  translation: string
  commentary?: string
}

/**
 * Audio source configuration
 */
export interface GitaAudioSource {
  language: GitaLanguage
  name: string
  nameNative: string
  narrator: string
  source: string
  license: 'public_domain' | 'creative_commons' | 'educational' | 'verify_before_commercial'
  quality: 'high' | 'medium' | 'standard'
  baseUrl: string
  format: 'mp3' | 'ogg' | 'wav'
  hasChapterFiles: boolean
  hasVerseFiles: boolean
  totalDuration: string
  description: string
}

/**
 * Gita + Ambient soundscape preset
 */
export interface GitaSoundscape {
  id: string
  name: string
  nameHindi: string
  description: string
  theme: 'morning' | 'learning' | 'meditation' | 'sleep' | 'focus' | 'healing'
  defaultLanguage: GitaLanguage
  ambientSounds: Array<{
    type: string
    volume: number
    pan?: number
  }>
  gitaVolume: number
  ambientVolume: number
  icon: string
  gradient: string
  recommendedTime: string
  benefits: string[]
}

/**
 * Playback mode
 */
export type GitaPlaybackMode =
  | 'continuous'    // Play all verses continuously
  | 'verse_pause'   // Pause between verses for contemplation
  | 'repeat_verse'  // Repeat current verse N times
  | 'chapter_loop'  // Loop entire chapter
  | 'learning'      // Verse + meaning + pause

/**
 * Learning mode settings
 */
export interface GitaLearningSettings {
  showTransliteration: boolean
  showMeaning: boolean
  showCommentary: boolean
  repeatCount: number
  pauseDuration: number  // seconds between verses
  playbackSpeed: number  // 0.5 to 1.5
  autoAdvance: boolean
}

// ============ Chapter Data ============

/**
 * All 18 chapters of Bhagavad Gita
 */
export const GITA_CHAPTERS: GitaChapter[] = [
  {
    number: 1,
    nameEnglish: 'Arjuna Vishada Yoga',
    nameSanskrit: 'अर्जुनविषादयोग',
    nameHindi: 'अर्जुन विषाद योग',
    verseCount: 47,
    theme: 'Arjuna\'s Dilemma',
    description: 'The yoga of Arjuna\'s dejection - setting the stage for divine wisdom',
    yogaType: 'Observation of Grief',
    duration: '25 min',
    color: 'from-slate-600 to-slate-800'
  },
  {
    number: 2,
    nameEnglish: 'Sankhya Yoga',
    nameSanskrit: 'साङ्ख्ययोग',
    nameHindi: 'सांख्य योग',
    verseCount: 72,
    theme: 'Path of Knowledge',
    description: 'The yoga of knowledge - understanding the eternal soul',
    yogaType: 'Transcendental Knowledge',
    duration: '40 min',
    color: 'from-amber-500 to-orange-600'
  },
  {
    number: 3,
    nameEnglish: 'Karma Yoga',
    nameSanskrit: 'कर्मयोग',
    nameHindi: 'कर्म योग',
    verseCount: 43,
    theme: 'Path of Action',
    description: 'The yoga of selfless action - work without attachment',
    yogaType: 'Path of Selfless Action',
    duration: '22 min',
    color: 'from-red-500 to-rose-600'
  },
  {
    number: 4,
    nameEnglish: 'Jnana Karma Sannyasa Yoga',
    nameSanskrit: 'ज्ञानकर्मसंन्यासयोग',
    nameHindi: 'ज्ञान कर्म संन्यास योग',
    verseCount: 42,
    theme: 'Knowledge & Renunciation',
    description: 'Approaching God through transcendental knowledge',
    yogaType: 'Knowledge and Renunciation',
    duration: '20 min',
    color: 'from-violet-500 to-purple-600'
  },
  {
    number: 5,
    nameEnglish: 'Karma Sannyasa Yoga',
    nameSanskrit: 'कर्मसंन्यासयोग',
    nameHindi: 'कर्म संन्यास योग',
    verseCount: 29,
    theme: 'Action & Renunciation',
    description: 'The yoga of renunciation of action',
    yogaType: 'Action in Renunciation',
    duration: '15 min',
    color: 'from-teal-500 to-cyan-600'
  },
  {
    number: 6,
    nameEnglish: 'Dhyana Yoga',
    nameSanskrit: 'ध्यानयोग',
    nameHindi: 'ध्यान योग',
    verseCount: 47,
    theme: 'Meditation',
    description: 'The yoga of meditation - controlling the mind',
    yogaType: 'Path of Meditation',
    duration: '25 min',
    color: 'from-indigo-500 to-blue-600'
  },
  {
    number: 7,
    nameEnglish: 'Jnana Vijnana Yoga',
    nameSanskrit: 'ज्ञानविज्ञानयोग',
    nameHindi: 'ज्ञान विज्ञान योग',
    verseCount: 30,
    theme: 'Knowledge & Wisdom',
    description: 'Knowledge of the absolute and the relative',
    yogaType: 'Self-Knowledge',
    duration: '15 min',
    color: 'from-emerald-500 to-green-600'
  },
  {
    number: 8,
    nameEnglish: 'Akshara Brahma Yoga',
    nameSanskrit: 'अक्षरब्रह्मयोग',
    nameHindi: 'अक्षर ब्रह्म योग',
    verseCount: 28,
    theme: 'Imperishable Absolute',
    description: 'Attaining the supreme - the path of liberation',
    yogaType: 'Attaining the Supreme',
    duration: '14 min',
    color: 'from-yellow-500 to-amber-600'
  },
  {
    number: 9,
    nameEnglish: 'Raja Vidya Raja Guhya Yoga',
    nameSanskrit: 'राजविद्याराजगुह्ययोग',
    nameHindi: 'राज विद्या राज गुह्य योग',
    verseCount: 34,
    theme: 'Royal Knowledge',
    description: 'The most confidential knowledge - devotion to the Supreme',
    yogaType: 'Confidential Knowledge',
    duration: '18 min',
    color: 'from-fuchsia-500 to-pink-600'
  },
  {
    number: 10,
    nameEnglish: 'Vibhuti Yoga',
    nameSanskrit: 'विभूतियोग',
    nameHindi: 'विभूति योग',
    verseCount: 42,
    theme: 'Divine Glories',
    description: 'The yoga of divine manifestations - opulence of the Absolute',
    yogaType: 'Divine Manifestations',
    duration: '22 min',
    color: 'from-orange-500 to-red-600'
  },
  {
    number: 11,
    nameEnglish: 'Vishwarupa Darshana Yoga',
    nameSanskrit: 'विश्वरूपदर्शनयोग',
    nameHindi: 'विश्वरूप दर्शन योग',
    verseCount: 55,
    theme: 'Universal Form',
    description: 'The yoga of the cosmic vision - the infinite form',
    yogaType: 'Vision of Universal Form',
    duration: '30 min',
    color: 'from-sky-500 to-blue-600'
  },
  {
    number: 12,
    nameEnglish: 'Bhakti Yoga',
    nameSanskrit: 'भक्तियोग',
    nameHindi: 'भक्ति योग',
    verseCount: 20,
    theme: 'Devotion',
    description: 'The yoga of devotion - love for the Supreme',
    yogaType: 'Path of Devotion',
    duration: '10 min',
    color: 'from-rose-500 to-pink-600'
  },
  {
    number: 13,
    nameEnglish: 'Kshetra Kshetrajna Vibhaga Yoga',
    nameSanskrit: 'क्षेत्रक्षेत्रज्ञविभागयोग',
    nameHindi: 'क्षेत्र क्षेत्रज्ञ विभाग योग',
    verseCount: 35,
    theme: 'Field & Knower',
    description: 'Nature, the enjoyer, and consciousness',
    yogaType: 'Field and Knower',
    duration: '18 min',
    color: 'from-lime-500 to-green-600'
  },
  {
    number: 14,
    nameEnglish: 'Gunatraya Vibhaga Yoga',
    nameSanskrit: 'गुणत्रयविभागयोग',
    nameHindi: 'गुण त्रय विभाग योग',
    verseCount: 27,
    theme: 'Three Gunas',
    description: 'The yoga of the three modes of material nature',
    yogaType: 'Three Modes of Nature',
    duration: '14 min',
    color: 'from-purple-500 to-violet-600'
  },
  {
    number: 15,
    nameEnglish: 'Purushottama Yoga',
    nameSanskrit: 'पुरुषोत्तमयोग',
    nameHindi: 'पुरुषोत्तम योग',
    verseCount: 20,
    theme: 'Supreme Person',
    description: 'The yoga of the supreme person - attaining the ultimate',
    yogaType: 'Supreme Person',
    duration: '10 min',
    color: 'from-cyan-500 to-teal-600'
  },
  {
    number: 16,
    nameEnglish: 'Daivasura Sampad Vibhaga Yoga',
    nameSanskrit: 'दैवासुरसम्पद्विभागयोग',
    nameHindi: 'दैव असुर सम्पद विभाग योग',
    verseCount: 24,
    theme: 'Divine & Demonic',
    description: 'The divine and demoniac natures',
    yogaType: 'Divine and Demonic Natures',
    duration: '12 min',
    color: 'from-zinc-500 to-slate-600'
  },
  {
    number: 17,
    nameEnglish: 'Shraddhatraya Vibhaga Yoga',
    nameSanskrit: 'श्रद्धात्रयविभागयोग',
    nameHindi: 'श्रद्धा त्रय विभाग योग',
    verseCount: 28,
    theme: 'Three Types of Faith',
    description: 'The yoga of the threefold faith',
    yogaType: 'Divisions of Faith',
    duration: '14 min',
    color: 'from-amber-500 to-yellow-600'
  },
  {
    number: 18,
    nameEnglish: 'Moksha Sannyasa Yoga',
    nameSanskrit: 'मोक्षसंन्यासयोग',
    nameHindi: 'मोक्ष संन्यास योग',
    verseCount: 78,
    theme: 'Liberation',
    description: 'The yoga of liberation through renunciation - the conclusion',
    yogaType: 'Conclusion - Liberation',
    duration: '45 min',
    color: 'from-gold-500 to-amber-600'
  }
]

// ============ Audio Sources ============

/**
 * Available audio sources by language
 */
export const GITA_AUDIO_SOURCES: GitaAudioSource[] = [
  // Sanskrit Sources
  {
    language: 'sanskrit',
    name: 'Traditional Sanskrit Chanting',
    nameNative: 'संस्कृत पाठ',
    narrator: 'T.S. Ranganathan',
    source: 'Internet Archive',
    license: 'verify_before_commercial',
    quality: 'high',
    baseUrl: '/audio/gita/sanskrit/ranganathan',
    format: 'mp3',
    hasChapterFiles: true,
    hasVerseFiles: false,
    totalDuration: '5h 30min',
    description: 'Traditional Vedic chanting with precise pronunciation'
  },
  {
    language: 'sanskrit',
    name: 'Omkarananda Chanting',
    nameNative: 'ॐकारानन्द पाठ',
    narrator: 'Omkarananda',
    source: 'Internet Archive',
    license: 'verify_before_commercial',
    quality: 'high',
    baseUrl: '/audio/gita/sanskrit/omkarananda',
    format: 'ogg',
    hasChapterFiles: true,
    hasVerseFiles: false,
    totalDuration: '4h 45min',
    description: 'Meditative chanting style for deep contemplation'
  },

  // Hindi Sources
  {
    language: 'hindi',
    name: 'Gita Press Hindi',
    nameNative: 'गीता प्रेस हिंदी',
    narrator: 'Gita Press Gorakhpur',
    source: 'Internet Archive',
    license: 'educational',
    quality: 'high',
    baseUrl: '/audio/gita/hindi/gitapress',
    format: 'mp3',
    hasChapterFiles: true,
    hasVerseFiles: true,
    totalDuration: '8h',
    description: 'Authoritative Hindi translation with meaning'
  },
  {
    language: 'hindi',
    name: 'Yatharth Geeta Hindi',
    nameNative: 'यथार्थ गीता हिंदी',
    narrator: 'Swami Adgadanand',
    source: 'Yatharth Geeta',
    license: 'educational',
    quality: 'high',
    baseUrl: '/audio/gita/hindi/yatharth',
    format: 'mp3',
    hasChapterFiles: true,
    hasVerseFiles: true,
    totalDuration: '12h',
    description: 'Verse-by-verse explanation with deep meaning'
  },

  // Telugu Source (Legendary)
  {
    language: 'telugu',
    name: 'Ghantasala Bhagavad Gita',
    nameNative: 'ఘంటసాల భగవద్గీత',
    narrator: 'Ghantasala Venkateswara Rao',
    source: 'Internet Archive',
    license: 'verify_before_commercial',
    quality: 'high',
    baseUrl: '/audio/gita/telugu/ghantasala',
    format: 'mp3',
    hasChapterFiles: false,
    hasVerseFiles: false,
    totalDuration: '1h 13min',
    description: 'Iconic legendary rendition - cultural treasure'
  },

  // Tamil Source
  {
    language: 'tamil',
    name: 'Yatharth Geeta Tamil',
    nameNative: 'யதார்த்த கீதை தமிழ்',
    narrator: 'Swami Adgadanand',
    source: 'Yatharth Geeta',
    license: 'educational',
    quality: 'high',
    baseUrl: '/audio/gita/tamil/yatharth',
    format: 'mp3',
    hasChapterFiles: true,
    hasVerseFiles: true,
    totalDuration: '10h',
    description: 'Complete Tamil version with meaning'
  },

  // Malayalam Source
  {
    language: 'malayalam',
    name: 'Yatharth Geeta Malayalam',
    nameNative: 'യഥാർത്ഥ ഗീത മലയാളം',
    narrator: 'Swami Adgadanand',
    source: 'Yatharth Geeta',
    license: 'educational',
    quality: 'high',
    baseUrl: '/audio/gita/malayalam/yatharth',
    format: 'mp3',
    hasChapterFiles: true,
    hasVerseFiles: true,
    totalDuration: '10h',
    description: 'Complete Malayalam version with meaning'
  },

  // English Source (Public Domain)
  {
    language: 'english',
    name: 'LibriVox - Edwin Arnold',
    nameNative: 'The Song Celestial',
    narrator: 'LibriVox Volunteers',
    source: 'LibriVox',
    license: 'public_domain',
    quality: 'medium',
    baseUrl: '/audio/gita/english/librivox',
    format: 'mp3',
    hasChapterFiles: true,
    hasVerseFiles: false,
    totalDuration: '3h 30min',
    description: '100% public domain - safe for all use'
  }
]

// ============ Gita Soundscapes ============

/**
 * Pre-configured Gita + Ambient soundscape presets
 */
export const GITA_SOUNDSCAPES: GitaSoundscape[] = [
  {
    id: 'gita-morning-shloka',
    name: 'Morning Shlokas',
    nameHindi: 'प्रातः श्लोक',
    description: 'Start your day with sacred Sanskrit verses and temple dawn ambience',
    theme: 'morning',
    defaultLanguage: 'sanskrit',
    ambientSounds: [
      { type: 'temple_bells', volume: 0.15 },
      { type: 'forest_birds', volume: 0.12, pan: -0.3 },
      { type: 'wind_gentle', volume: 0.08 }
    ],
    gitaVolume: 0.75,
    ambientVolume: 0.25,
    icon: 'Sun',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    recommendedTime: '5:00 AM - 7:00 AM',
    benefits: ['Spiritual awakening', 'Positive energy', 'Mental clarity']
  },
  {
    id: 'gita-deep-learning',
    name: 'Gita Deep Learning',
    nameHindi: 'गीता गहन अध्ययन',
    description: 'Verse-by-verse learning with meaning and gentle rain ambience',
    theme: 'learning',
    defaultLanguage: 'hindi',
    ambientSounds: [
      { type: 'rain_gentle', volume: 0.2 },
      { type: 'tanpura_drone', volume: 0.1 }
    ],
    gitaVolume: 0.8,
    ambientVolume: 0.2,
    icon: 'BookOpen',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    recommendedTime: 'Anytime',
    benefits: ['Deep understanding', 'Sanskrit learning', 'Wisdom absorption']
  },
  {
    id: 'gita-meditation',
    name: 'Gita Dhyana',
    nameHindi: 'गीता ध्यान',
    description: 'Meditative chanting with singing bowls for deep contemplation',
    theme: 'meditation',
    defaultLanguage: 'sanskrit',
    ambientSounds: [
      { type: 'singing_bowl', volume: 0.15 },
      { type: 'om_chanting', volume: 0.08 },
      { type: 'space_drone', volume: 0.1 }
    ],
    gitaVolume: 0.6,
    ambientVolume: 0.4,
    icon: 'Sparkles',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    recommendedTime: 'Early morning or evening',
    benefits: ['Inner peace', 'Spiritual connection', 'Mind stillness']
  },
  {
    id: 'gita-sleep-learning',
    name: 'Sleep with Gita',
    nameHindi: 'गीता के साथ नींद',
    description: 'Gentle recitation with ocean waves for restful sleep learning',
    theme: 'sleep',
    defaultLanguage: 'sanskrit',
    ambientSounds: [
      { type: 'ocean_waves', volume: 0.3 },
      { type: 'rain_gentle', volume: 0.15 },
      { type: 'wind_gentle', volume: 0.1 }
    ],
    gitaVolume: 0.45,
    ambientVolume: 0.55,
    icon: 'Moon',
    gradient: 'from-indigo-600 via-slate-600 to-purple-700',
    recommendedTime: 'Before sleep',
    benefits: ['Peaceful sleep', 'Subconscious learning', 'Spiritual dreams']
  },
  {
    id: 'gita-focus-karma',
    name: 'Karma Yoga Focus',
    nameHindi: 'कर्म योग एकाग्रता',
    description: 'Chapter 3 verses with focus-enhancing brown noise',
    theme: 'focus',
    defaultLanguage: 'hindi',
    ambientSounds: [
      { type: 'river_stream', volume: 0.2 },
      { type: 'fire_crackling', volume: 0.1, pan: 0.4 }
    ],
    gitaVolume: 0.65,
    ambientVolume: 0.35,
    icon: 'Brain',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    recommendedTime: 'Work hours',
    benefits: ['Enhanced focus', 'Selfless action', 'Work motivation']
  },
  {
    id: 'gita-healing-heart',
    name: 'Heart Healing Gita',
    nameHindi: 'हृदय उपचार गीता',
    description: 'Bhakti Yoga verses with 528Hz healing frequencies',
    theme: 'healing',
    defaultLanguage: 'sanskrit',
    ambientSounds: [
      { type: 'crystal_bowls', volume: 0.2 },
      { type: 'flute_bansuri', volume: 0.15 },
      { type: 'rain_gentle', volume: 0.1 }
    ],
    gitaVolume: 0.6,
    ambientVolume: 0.4,
    icon: 'Heart',
    gradient: 'from-rose-500 via-pink-500 to-red-500',
    recommendedTime: 'When feeling low',
    benefits: ['Emotional healing', 'Heart opening', 'Divine love']
  },
  {
    id: 'gita-telugu-classic',
    name: 'Ghantasala Classic',
    nameHindi: 'घंटसाला क्लासिक',
    description: 'Legendary Telugu rendition with temple ambience',
    theme: 'morning',
    defaultLanguage: 'telugu',
    ambientSounds: [
      { type: 'temple_bells', volume: 0.1 },
      { type: 'tanpura_drone', volume: 0.08 }
    ],
    gitaVolume: 0.85,
    ambientVolume: 0.15,
    icon: 'Music',
    gradient: 'from-yellow-500 via-amber-500 to-orange-500',
    recommendedTime: 'Anytime',
    benefits: ['Cultural connection', 'Musical experience', 'Devotion']
  },
  {
    id: 'gita-english-wisdom',
    name: 'English Wisdom',
    nameHindi: 'अंग्रेजी ज्ञान',
    description: 'LibriVox public domain English for global understanding',
    theme: 'learning',
    defaultLanguage: 'english',
    ambientSounds: [
      { type: 'rain_gentle', volume: 0.15 },
      { type: 'wind_gentle', volume: 0.1 }
    ],
    gitaVolume: 0.8,
    ambientVolume: 0.2,
    icon: 'Globe',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    recommendedTime: 'Anytime',
    benefits: ['Easy understanding', 'Global access', 'Clear meaning']
  }
]

// ============ Default Settings ============

/**
 * Default learning mode settings
 */
export const DEFAULT_LEARNING_SETTINGS: GitaLearningSettings = {
  showTransliteration: true,
  showMeaning: true,
  showCommentary: false,
  repeatCount: 1,
  pauseDuration: 3,
  playbackSpeed: 1.0,
  autoAdvance: true
}

// ============ Popular Verses ============

/**
 * Most popular/important verses for quick access
 */
export const POPULAR_GITA_VERSES = [
  { chapter: 2, verse: 47, title: 'Karma Yoga Essence', titleHindi: 'कर्मण्येवाधिकारस्ते' },
  { chapter: 2, verse: 14, title: 'Endurance', titleHindi: 'मात्रास्पर्शास्तु कौन्तेय' },
  { chapter: 2, verse: 22, title: 'Soul is Eternal', titleHindi: 'वासांसि जीर्णानि' },
  { chapter: 4, verse: 7, title: 'Divine Incarnation', titleHindi: 'यदा यदा हि धर्मस्य' },
  { chapter: 4, verse: 8, title: 'Protection Promise', titleHindi: 'परित्राणाय साधूनाम्' },
  { chapter: 6, verse: 5, title: 'Self Upliftment', titleHindi: 'उद्धरेदात्मनात्मानम्' },
  { chapter: 9, verse: 22, title: 'Divine Protection', titleHindi: 'अनन्याश्चिन्तयन्तो माम्' },
  { chapter: 11, verse: 32, title: 'Time Declaration', titleHindi: 'कालोऽस्मि' },
  { chapter: 12, verse: 13, title: 'Devotee Qualities', titleHindi: 'अद्वेष्टा सर्वभूतानाम्' },
  { chapter: 15, verse: 15, title: 'Inner Dwelling', titleHindi: 'सर्वस्य चाहं हृदि' },
  { chapter: 18, verse: 66, title: 'Ultimate Surrender', titleHindi: 'सर्वधर्मान्परित्यज्य' },
  { chapter: 18, verse: 78, title: 'Victory Declaration', titleHindi: 'यत्र योगेश्वरः कृष्णः' }
]

// ============ Chapter Recommendations ============

/**
 * Chapter recommendations based on emotional state
 */
export const CHAPTER_RECOMMENDATIONS = {
  anxious: [2, 6, 12],      // Sankhya, Dhyana, Bhakti
  depressed: [2, 9, 12],    // Knowledge, Royal Secret, Devotion
  confused: [2, 3, 18],     // Knowledge, Action, Conclusion
  angry: [2, 3, 16],        // Knowledge, Action, Divine/Demonic
  fearful: [2, 4, 11],      // Knowledge, Renunciation, Universal Form
  grieving: [2, 8, 15],     // Knowledge, Imperishable, Supreme Person
  seeking_peace: [6, 12, 15], // Meditation, Devotion, Supreme
  seeking_wisdom: [2, 4, 7, 13], // Knowledge chapters
  seeking_devotion: [9, 11, 12, 18], // Devotion chapters
  seeking_action: [3, 5, 18] // Karma Yoga chapters
}

// ============ Helper Functions ============

/**
 * Get chapter by number
 */
export function getGitaChapter(chapterNumber: number): GitaChapter | undefined {
  return GITA_CHAPTERS.find(c => c.number === chapterNumber)
}

/**
 * Get audio source for language
 */
export function getGitaAudioSource(language: GitaLanguage): GitaAudioSource | undefined {
  return GITA_AUDIO_SOURCES.find(s => s.language === language)
}

/**
 * Get soundscape by ID
 */
export function getGitaSoundscape(id: string): GitaSoundscape | undefined {
  return GITA_SOUNDSCAPES.find(s => s.id === id)
}

/**
 * Get recommended chapters for emotional state
 */
export function getRecommendedChapters(emotionalState: keyof typeof CHAPTER_RECOMMENDATIONS): number[] {
  return CHAPTER_RECOMMENDATIONS[emotionalState] || [2, 12, 18]
}

/**
 * Get total verse count
 */
export function getTotalVerseCount(): number {
  return GITA_CHAPTERS.reduce((sum, chapter) => sum + chapter.verseCount, 0)
}

/**
 * Format duration for display
 */
export function formatGitaDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

export default {
  GITA_CHAPTERS,
  GITA_AUDIO_SOURCES,
  GITA_SOUNDSCAPES,
  DEFAULT_LEARNING_SETTINGS,
  POPULAR_GITA_VERSES,
  CHAPTER_RECOMMENDATIONS
}
