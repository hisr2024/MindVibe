/**
 * KIAAN Verse Memorization System
 *
 * Implements spaced repetition algorithm (SM-2 variant) for memorizing
 * Bhagavad Gita verses. Adapts intervals based on recall quality.
 *
 * Features:
 * - SM-2 spaced repetition algorithm
 * - Difficulty-based scheduling
 * - Progress visualization
 * - Verse chunking for easier memorization
 * - Audio cue support
 */

export type RecallQuality = 0 | 1 | 2 | 3 | 4 | 5
// 0 - Complete blackout, no recall
// 1 - Incorrect, but remembered upon seeing answer
// 2 - Incorrect, but answer seemed easy to recall
// 3 - Correct with serious difficulty
// 4 - Correct with some hesitation
// 5 - Perfect recall

export interface MemorizationCard {
  verseId: string
  reference: string
  sanskrit: string
  transliteration: string
  translation: string
  chunks: VerseChunk[]
  audioUrl?: string
}

export interface VerseChunk {
  id: string
  sanskrit: string
  transliteration: string
  meaning: string
  position: number
}

export interface MemorizationProgress {
  verseId: string
  chunkId?: string // If tracking chunk-level progress
  easeFactor: number // Starting at 2.5
  interval: number // Days until next review
  repetitions: number
  nextReviewDate: Date
  lastReviewDate: Date
  lastQuality: RecallQuality
  totalReviews: number
  averageQuality: number
  mastered: boolean // Quality >= 4 for 3 consecutive reviews
  consecutiveCorrect: number
}

export interface MemorizationSession {
  versesToReview: MemorizationCard[]
  newVerses: MemorizationCard[]
  totalCards: number
  estimatedMinutes: number
}

export interface MemorizationStats {
  totalVersesLearning: number
  totalVersesMastered: number
  averageEaseFactor: number
  currentStreak: number
  longestStreak: number
  reviewsDueToday: number
  reviewsDueTomorrow: number
  totalReviewsCompleted: number
}

// Verses available for memorization
const MEMORIZATION_VERSES: MemorizationCard[] = [
  {
    verseId: 'bg-2-47',
    reference: 'Bhagavad Gita 2.47',
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन । मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana | mā karma-phala-hetur bhūr mā te saṅgo \'stv akarmaṇi ||',
    translation: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results, and never be attached to not doing your duty.',
    chunks: [
      {
        id: 'bg-2-47-1',
        sanskrit: 'कर्मण्येवाधिकारस्ते',
        transliteration: 'karmaṇy evādhikāras te',
        meaning: 'Your right is to work only',
        position: 1
      },
      {
        id: 'bg-2-47-2',
        sanskrit: 'मा फलेषु कदाचन',
        transliteration: 'mā phaleṣu kadācana',
        meaning: 'Never to its fruits',
        position: 2
      },
      {
        id: 'bg-2-47-3',
        sanskrit: 'मा कर्मफलहेतुर्भूः',
        transliteration: 'mā karma-phala-hetur bhūḥ',
        meaning: 'Do not be the cause of results',
        position: 3
      },
      {
        id: 'bg-2-47-4',
        sanskrit: 'मा ते सङ्गोऽस्त्वकर्मणि',
        transliteration: 'mā te saṅgo \'stv akarmaṇi',
        meaning: 'Do not be attached to inaction',
        position: 4
      }
    ]
  },
  {
    verseId: 'bg-2-14',
    reference: 'Bhagavad Gita 2.14',
    sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः । आगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत ॥',
    transliteration: 'mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ | āgamāpāyino \'nityās tāṁs titikṣasva bhārata ||',
    translation: 'O son of Kunti, the contact of the senses with their objects gives rise to cold and heat, pleasure and pain. They come and go, being impermanent. Bear them patiently, O Bharata.',
    chunks: [
      {
        id: 'bg-2-14-1',
        sanskrit: 'मात्रास्पर्शास्तु कौन्तेय',
        transliteration: 'mātrā-sparśās tu kaunteya',
        meaning: 'O Kaunteya, sense contacts',
        position: 1
      },
      {
        id: 'bg-2-14-2',
        sanskrit: 'शीतोष्णसुखदुःखदाः',
        transliteration: 'śītoṣṇa-sukha-duḥkha-dāḥ',
        meaning: 'Give cold, heat, pleasure, pain',
        position: 2
      },
      {
        id: 'bg-2-14-3',
        sanskrit: 'आगमापायिनोऽनित्याः',
        transliteration: 'āgamāpāyino \'nityāḥ',
        meaning: 'They come and go, impermanent',
        position: 3
      },
      {
        id: 'bg-2-14-4',
        sanskrit: 'तांस्तितिक्षस्व भारत',
        transliteration: 'tāṁs titikṣasva bhārata',
        meaning: 'Bear them patiently, O Bharata',
        position: 4
      }
    ]
  },
  {
    verseId: 'bg-2-20',
    reference: 'Bhagavad Gita 2.20',
    sanskrit: 'न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः । अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥',
    transliteration: 'na jāyate mriyate vā kadācin nāyaṁ bhūtvā bhavitā vā na bhūyaḥ | ajo nityaḥ śāśvato \'yaṁ purāṇo na hanyate hanyamāne śarīre ||',
    translation: 'The soul is never born nor does it ever die; having come to be, it will never cease to be. It is unborn, eternal, ever-existing, undying, and primeval. It is not slain when the body is slain.',
    chunks: [
      {
        id: 'bg-2-20-1',
        sanskrit: 'न जायते म्रियते वा कदाचित्',
        transliteration: 'na jāyate mriyate vā kadācit',
        meaning: 'It is never born, nor does it die',
        position: 1
      },
      {
        id: 'bg-2-20-2',
        sanskrit: 'नायं भूत्वा भविता वा न भूयः',
        transliteration: 'nāyaṁ bhūtvā bhavitā vā na bhūyaḥ',
        meaning: 'Having been, it will never cease to be',
        position: 2
      },
      {
        id: 'bg-2-20-3',
        sanskrit: 'अजो नित्यः शाश्वतोऽयं पुराणः',
        transliteration: 'ajo nityaḥ śāśvato \'yaṁ purāṇaḥ',
        meaning: 'Unborn, eternal, ever-existing, primeval',
        position: 3
      },
      {
        id: 'bg-2-20-4',
        sanskrit: 'न हन्यते हन्यमाने शरीरे',
        transliteration: 'na hanyate hanyamāne śarīre',
        meaning: 'Not slain when body is slain',
        position: 4
      }
    ]
  },
  {
    verseId: 'bg-4-7',
    reference: 'Bhagavad Gita 4.7',
    sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत । अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥',
    transliteration: 'yadā yadā hi dharmasya glānir bhavati bhārata | abhyutthānam adharmasya tadātmānaṁ sṛjāmy aham ||',
    translation: 'Whenever there is a decline in righteousness and an increase in unrighteousness, O Arjuna, at that time I manifest Myself.',
    chunks: [
      {
        id: 'bg-4-7-1',
        sanskrit: 'यदा यदा हि धर्मस्य',
        transliteration: 'yadā yadā hi dharmasya',
        meaning: 'Whenever there is, of dharma',
        position: 1
      },
      {
        id: 'bg-4-7-2',
        sanskrit: 'ग्लानिर्भवति भारत',
        transliteration: 'glānir bhavati bhārata',
        meaning: 'A decline, O Bharata',
        position: 2
      },
      {
        id: 'bg-4-7-3',
        sanskrit: 'अभ्युत्थानमधर्मस्य',
        transliteration: 'abhyutthānam adharmasya',
        meaning: 'And rise of adharma',
        position: 3
      },
      {
        id: 'bg-4-7-4',
        sanskrit: 'तदात्मानं सृजाम्यहम्',
        transliteration: 'tadātmānaṁ sṛjāmy aham',
        meaning: 'Then I manifest Myself',
        position: 4
      }
    ]
  },
  {
    verseId: 'bg-4-8',
    reference: 'Bhagavad Gita 4.8',
    sanskrit: 'परित्राणाय साधूनां विनाशाय च दुष्कृताम् । धर्मसंस्थापनार्थाय सम्भवामि युगे युगे ॥',
    transliteration: 'paritrāṇāya sādhūnāṁ vināśāya ca duṣkṛtām | dharma-saṁsthāpanārthāya sambhavāmi yuge yuge ||',
    translation: 'To protect the righteous, to annihilate the wicked, and to establish dharma, I appear millennium after millennium.',
    chunks: [
      {
        id: 'bg-4-8-1',
        sanskrit: 'परित्राणाय साधूनां',
        transliteration: 'paritrāṇāya sādhūnāṁ',
        meaning: 'For protection of the righteous',
        position: 1
      },
      {
        id: 'bg-4-8-2',
        sanskrit: 'विनाशाय च दुष्कृताम्',
        transliteration: 'vināśāya ca duṣkṛtām',
        meaning: 'For destruction of the wicked',
        position: 2
      },
      {
        id: 'bg-4-8-3',
        sanskrit: 'धर्मसंस्थापनार्थाय',
        transliteration: 'dharma-saṁsthāpanārthāya',
        meaning: 'For establishing dharma',
        position: 3
      },
      {
        id: 'bg-4-8-4',
        sanskrit: 'सम्भवामि युगे युगे',
        transliteration: 'sambhavāmi yuge yuge',
        meaning: 'I appear age after age',
        position: 4
      }
    ]
  },
  {
    verseId: 'bg-6-5',
    reference: 'Bhagavad Gita 6.5',
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् । आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥',
    transliteration: 'uddhared ātmanātmānaṁ nātmānam avasādayet | ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ ||',
    translation: 'One must elevate, not degrade, oneself with one\'s own mind. The mind is the friend of the soul, and the mind is also the enemy of the soul.',
    chunks: [
      {
        id: 'bg-6-5-1',
        sanskrit: 'उद्धरेदात्मनात्मानं',
        transliteration: 'uddhared ātmanātmānaṁ',
        meaning: 'One should elevate oneself by oneself',
        position: 1
      },
      {
        id: 'bg-6-5-2',
        sanskrit: 'नात्मानमवसादयेत्',
        transliteration: 'nātmānam avasādayet',
        meaning: 'One should not degrade oneself',
        position: 2
      },
      {
        id: 'bg-6-5-3',
        sanskrit: 'आत्मैव ह्यात्मनो बन्धुः',
        transliteration: 'ātmaiva hy ātmano bandhuḥ',
        meaning: 'The self is the friend of the self',
        position: 3
      },
      {
        id: 'bg-6-5-4',
        sanskrit: 'आत्मैव रिपुरात्मनः',
        transliteration: 'ātmaiva ripur ātmanaḥ',
        meaning: 'The self is the enemy of the self',
        position: 4
      }
    ]
  },
  {
    verseId: 'bg-9-22',
    reference: 'Bhagavad Gita 9.22',
    sanskrit: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते । तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम् ॥',
    transliteration: 'ananyāś cintayanto māṁ ye janāḥ paryupāsate | teṣāṁ nityābhiyuktānāṁ yoga-kṣemaṁ vahāmy aham ||',
    translation: 'To those who worship Me alone, thinking of no other, to those ever-devoted, I carry what they lack and preserve what they have.',
    chunks: [
      {
        id: 'bg-9-22-1',
        sanskrit: 'अनन्याश्चिन्तयन्तो मां',
        transliteration: 'ananyāś cintayanto māṁ',
        meaning: 'Thinking of Me with no other thought',
        position: 1
      },
      {
        id: 'bg-9-22-2',
        sanskrit: 'ये जनाः पर्युपासते',
        transliteration: 'ye janāḥ paryupāsate',
        meaning: 'Those who worship exclusively',
        position: 2
      },
      {
        id: 'bg-9-22-3',
        sanskrit: 'तेषां नित्याभियुक्तानां',
        transliteration: 'teṣāṁ nityābhiyuktānāṁ',
        meaning: 'To those ever-devoted',
        position: 3
      },
      {
        id: 'bg-9-22-4',
        sanskrit: 'योगक्षेमं वहाम्यहम्',
        transliteration: 'yoga-kṣemaṁ vahāmy aham',
        meaning: 'I carry their welfare',
        position: 4
      }
    ]
  },
  {
    verseId: 'bg-18-66',
    reference: 'Bhagavad Gita 18.66',
    sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज । अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः ॥',
    transliteration: 'sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja | ahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ ||',
    translation: 'Abandon all varieties of dharma and surrender unto Me alone. I shall deliver you from all sinful reactions. Do not fear.',
    chunks: [
      {
        id: 'bg-18-66-1',
        sanskrit: 'सर्वधर्मान्परित्यज्य',
        transliteration: 'sarva-dharmān parityajya',
        meaning: 'Abandoning all dharmas',
        position: 1
      },
      {
        id: 'bg-18-66-2',
        sanskrit: 'मामेकं शरणं व्रज',
        transliteration: 'mām ekaṁ śaraṇaṁ vraja',
        meaning: 'Surrender unto Me alone',
        position: 2
      },
      {
        id: 'bg-18-66-3',
        sanskrit: 'अहं त्वां सर्वपापेभ्यः',
        transliteration: 'ahaṁ tvāṁ sarva-pāpebhyaḥ',
        meaning: 'I shall liberate you from all sins',
        position: 3
      },
      {
        id: 'bg-18-66-4',
        sanskrit: 'मोक्षयिष्यामि मा शुचः',
        transliteration: 'mokṣayiṣyāmi mā śucaḥ',
        meaning: 'Do not fear',
        position: 4
      }
    ]
  }
]

// SM-2 Algorithm constants
const MIN_EASE_FACTOR = 1.3
const DEFAULT_EASE_FACTOR = 2.5
const _INITIAL_INTERVAL = 1 // 1 day - kept for SM-2 reference

/**
 * Calculate next review using SM-2 algorithm
 */
export function calculateNextReview(
  currentProgress: MemorizationProgress | null,
  quality: RecallQuality
): MemorizationProgress {
  const now = new Date()

  if (!currentProgress) {
    // New card - first review
    const interval = quality >= 3 ? 1 : 0 // Review again today if quality < 3
    return {
      verseId: '',
      easeFactor: DEFAULT_EASE_FACTOR,
      interval,
      repetitions: 1,
      nextReviewDate: addDays(now, interval),
      lastReviewDate: now,
      lastQuality: quality,
      totalReviews: 1,
      averageQuality: quality,
      mastered: false,
      consecutiveCorrect: quality >= 4 ? 1 : 0
    }
  }

  // Calculate new ease factor
  let newEaseFactor = currentProgress.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor)

  let newInterval: number
  let newRepetitions: number

  if (quality < 3) {
    // Failed recall - reset
    newInterval = 0 // Review again today
    newRepetitions = 0
  } else if (currentProgress.repetitions === 0) {
    newInterval = 1
    newRepetitions = 1
  } else if (currentProgress.repetitions === 1) {
    newInterval = 6
    newRepetitions = 2
  } else {
    newInterval = Math.round(currentProgress.interval * newEaseFactor)
    newRepetitions = currentProgress.repetitions + 1
  }

  // Update consecutive correct count
  const consecutiveCorrect = quality >= 4
    ? currentProgress.consecutiveCorrect + 1
    : 0

  // Check if mastered (quality >= 4 for 3 consecutive reviews)
  const mastered = consecutiveCorrect >= 3

  // Calculate new average
  const newTotalReviews = currentProgress.totalReviews + 1
  const newAverageQuality = ((currentProgress.averageQuality * currentProgress.totalReviews) + quality) / newTotalReviews

  return {
    verseId: currentProgress.verseId,
    chunkId: currentProgress.chunkId,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate: addDays(now, newInterval),
    lastReviewDate: now,
    lastQuality: quality,
    totalReviews: newTotalReviews,
    averageQuality: newAverageQuality,
    mastered,
    consecutiveCorrect
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get cards due for review today
 */
export function getDueCards(): { verses: MemorizationCard[]; chunks: { verse: MemorizationCard; chunk: VerseChunk }[] } {
  const allProgress = getAllProgress()
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const dueVerses: MemorizationCard[] = []
  const dueChunks: { verse: MemorizationCard; chunk: VerseChunk }[] = []

  for (const progress of allProgress) {
    const reviewDate = new Date(progress.nextReviewDate)
    reviewDate.setHours(0, 0, 0, 0)

    if (reviewDate <= now) {
      if (progress.chunkId) {
        // Chunk-level progress
        const verse = MEMORIZATION_VERSES.find(v => v.verseId === progress.verseId)
        const chunk = verse?.chunks.find(c => c.id === progress.chunkId)
        if (verse && chunk) {
          dueChunks.push({ verse, chunk })
        }
      } else {
        // Verse-level progress
        const verse = MEMORIZATION_VERSES.find(v => v.verseId === progress.verseId)
        if (verse) {
          dueVerses.push(verse)
        }
      }
    }
  }

  return { verses: dueVerses, chunks: dueChunks }
}

/**
 * Get verses not yet started
 */
export function getNewVerses(): MemorizationCard[] {
  const allProgress = getAllProgress()
  const startedVerseIds = new Set(allProgress.map(p => p.verseId))

  return MEMORIZATION_VERSES.filter(v => !startedVerseIds.has(v.verseId))
}

/**
 * Get a memorization session for today
 */
export function getMemorizationSession(maxNewVerses: number = 1): MemorizationSession {
  const { verses: dueVerses } = getDueCards()
  const newVerses = getNewVerses().slice(0, maxNewVerses)

  const totalCards = dueVerses.length + newVerses.length
  // Estimate ~3 minutes per verse for review, ~5 for new
  const estimatedMinutes = (dueVerses.length * 3) + (newVerses.length * 5)

  return {
    versesToReview: dueVerses,
    newVerses,
    totalCards,
    estimatedMinutes
  }
}

/**
 * Get all available verses for memorization
 */
export function getAllMemorizationVerses(): MemorizationCard[] {
  return MEMORIZATION_VERSES
}

/**
 * Get a specific verse
 */
export function getMemorizationVerse(verseId: string): MemorizationCard | null {
  return MEMORIZATION_VERSES.find(v => v.verseId === verseId) || null
}

/**
 * Start learning a new verse
 */
export function startLearningVerse(verseId: string): void {
  const verse = MEMORIZATION_VERSES.find(v => v.verseId === verseId)
  if (!verse) return

  const now = new Date()

  // Create progress for the verse
  const verseProgress: MemorizationProgress = {
    verseId,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReviewDate: now, // Review today
    lastReviewDate: now,
    lastQuality: 0,
    totalReviews: 0,
    averageQuality: 0,
    mastered: false,
    consecutiveCorrect: 0
  }

  saveProgress(verseProgress)

  // Create progress for each chunk
  for (const chunk of verse.chunks) {
    const chunkProgress: MemorizationProgress = {
      verseId,
      chunkId: chunk.id,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      nextReviewDate: now,
      lastReviewDate: now,
      lastQuality: 0,
      totalReviews: 0,
      averageQuality: 0,
      mastered: false,
      consecutiveCorrect: 0
    }
    saveProgress(chunkProgress)
  }
}

/**
 * Record review result
 */
export function recordReview(
  verseId: string,
  quality: RecallQuality,
  chunkId?: string
): MemorizationProgress {
  const currentProgress = getProgress(verseId, chunkId)

  const newProgress = calculateNextReview(currentProgress, quality)
  newProgress.verseId = verseId
  newProgress.chunkId = chunkId

  saveProgress(newProgress)

  // Update streak
  updateStreak()

  return newProgress
}

/**
 * Generate memorization practice speech
 */
export function generateMemorizationPractice(verseId: string): string[] {
  const verse = MEMORIZATION_VERSES.find(v => v.verseId === verseId)
  if (!verse) return ['Verse not found.']

  const speech: string[] = []
  const progress = getProgress(verseId)

  if (!progress || progress.totalReviews === 0) {
    // New verse - introduction
    speech.push(`Let us learn a new verse from ${verse.reference}.`)
    speech.push(`First, listen to the complete verse.`)
    speech.push(verse.sanskrit)
    speech.push(`The transliteration is: ${verse.transliteration}`)
    speech.push(`This verse means: ${verse.translation}`)
    speech.push(`Now let us break it into smaller parts for easier memorization.`)

    for (const chunk of verse.chunks) {
      speech.push(`Part ${chunk.position}: ${chunk.transliteration}`)
      speech.push(`Meaning: ${chunk.meaning}`)
      speech.push(`Repeat after me: ${chunk.transliteration}`)
      speech.push(`Again: ${chunk.transliteration}`)
    }

    speech.push(`Now let us try the complete verse together.`)
    speech.push(verse.transliteration)

  } else {
    // Review
    speech.push(`Time to review ${verse.reference}.`)
    speech.push(`Can you recall this verse? I will give you the meaning.`)
    speech.push(verse.translation)
    speech.push(`Take a moment to recall the Sanskrit.`)
    speech.push(`Three... two... one...`)
    speech.push(`The verse is: ${verse.transliteration}`)
    speech.push(`How well did you recall it?`)
    speech.push(`Rate yourself from 0 to 5, where 0 is no recall and 5 is perfect.`)
  }

  return speech
}

/**
 * Get quality description for user
 */
export function getQualityDescription(quality: RecallQuality): string {
  const descriptions: Record<RecallQuality, string> = {
    0: 'Complete blackout - could not recall anything',
    1: 'Incorrect - but remembered when shown the answer',
    2: 'Incorrect - but the answer seemed familiar',
    3: 'Correct - but with serious difficulty',
    4: 'Correct - with some hesitation',
    5: 'Perfect - instant and effortless recall'
  }
  return descriptions[quality]
}

/**
 * Get memorization statistics
 */
export function getMemorizationStats(): MemorizationStats {
  const allProgress = getAllProgress()
  const verseProgress = allProgress.filter(p => !p.chunkId)

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const tomorrow = addDays(now, 1)

  let reviewsDueToday = 0
  let reviewsDueTomorrow = 0
  let totalVersesMastered = 0
  let totalEaseFactor = 0
  let totalReviews = 0

  for (const progress of verseProgress) {
    const reviewDate = new Date(progress.nextReviewDate)
    reviewDate.setHours(0, 0, 0, 0)

    if (reviewDate <= now) reviewsDueToday++
    if (reviewDate <= tomorrow && reviewDate > now) reviewsDueTomorrow++
    if (progress.mastered) totalVersesMastered++
    totalEaseFactor += progress.easeFactor
    totalReviews += progress.totalReviews
  }

  const streak = getStreak()

  return {
    totalVersesLearning: verseProgress.length,
    totalVersesMastered,
    averageEaseFactor: verseProgress.length > 0 ? totalEaseFactor / verseProgress.length : DEFAULT_EASE_FACTOR,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    reviewsDueToday,
    reviewsDueTomorrow,
    totalReviewsCompleted: totalReviews
  }
}

// Storage helpers
const PROGRESS_KEY = 'kiaan_memorization_progress'
const STREAK_KEY = 'kiaan_memorization_streak'

function saveProgress(progress: MemorizationProgress): void {
  try {
    const key = progress.chunkId || progress.verseId
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
    allProgress[key] = {
      ...progress,
      nextReviewDate: progress.nextReviewDate.toISOString(),
      lastReviewDate: progress.lastReviewDate.toISOString()
    }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress))
  } catch (e) {
    console.warn('Failed to save memorization progress:', e)
  }
}

function getProgress(verseId: string, chunkId?: string): MemorizationProgress | null {
  try {
    const key = chunkId || verseId
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
    const progress = allProgress[key]
    if (progress) {
      return {
        ...progress,
        nextReviewDate: new Date(progress.nextReviewDate),
        lastReviewDate: new Date(progress.lastReviewDate)
      }
    }
    return null
  } catch {
    return null
  }
}

function getAllProgress(): MemorizationProgress[] {
  try {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
    return Object.values(allProgress).map((p: any) => ({
      ...p,
      nextReviewDate: new Date(p.nextReviewDate),
      lastReviewDate: new Date(p.lastReviewDate)
    }))
  } catch {
    return []
  }
}

function updateStreak(): void {
  try {
    const streak = getStreak()
    const today = new Date().toISOString().split('T')[0]

    if (streak.lastPracticeDate === today) {
      // Already practiced today
      return
    }

    const yesterday = addDays(new Date(), -1).toISOString().split('T')[0]

    if (streak.lastPracticeDate === yesterday) {
      // Continuing streak
      streak.current++
      streak.longest = Math.max(streak.longest, streak.current)
    } else {
      // Streak broken
      streak.current = 1
    }

    streak.lastPracticeDate = today
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak))
  } catch (e) {
    console.warn('Failed to update streak:', e)
  }
}

function getStreak(): { current: number; longest: number; lastPracticeDate: string } {
  try {
    const streak = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}')
    return {
      current: streak.current || 0,
      longest: streak.longest || 0,
      lastPracticeDate: streak.lastPracticeDate || ''
    }
  } catch {
    return { current: 0, longest: 0, lastPracticeDate: '' }
  }
}

/**
 * Export progress for backup
 */
export function exportProgress(): string {
  const progress = localStorage.getItem(PROGRESS_KEY) || '{}'
  const streak = localStorage.getItem(STREAK_KEY) || '{}'
  return JSON.stringify({ progress: JSON.parse(progress), streak: JSON.parse(streak) })
}

/**
 * Import progress from backup
 */
export function importProgress(data: string): boolean {
  try {
    const parsed = JSON.parse(data)
    if (parsed.progress) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(parsed.progress))
    }
    if (parsed.streak) {
      localStorage.setItem(STREAK_KEY, JSON.stringify(parsed.streak))
    }
    return true
  } catch {
    return false
  }
}
