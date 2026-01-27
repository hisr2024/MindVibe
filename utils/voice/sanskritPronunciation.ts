/**
 * KIAAN Sanskrit Pronunciation System
 *
 * Teaches correct pronunciation of Bhagavad Gita shlokas with:
 * - Phonetic breakdowns (IPA and simplified)
 * - Syllable-by-syllable guidance
 * - Common pronunciation mistakes and corrections
 * - Audio pacing for practice
 * - Progress tracking per verse
 */

export interface PhonemicBreakdown {
  syllable: string
  ipa: string
  simplified: string
  duration: number // milliseconds to hold
  emphasis: 'low' | 'medium' | 'high'
  tip?: string
}

export interface VersePronunciation {
  verseId: string
  reference: string
  sanskrit: string
  devanagari: string
  phonemes: PhonemicBreakdown[]
  fullPronunciationGuide: string
  commonMistakes: { mistake: string; correction: string }[]
  practiceSpeed: 'slow' | 'medium' | 'normal'
  audioHints: string[]
}

export interface PronunciationProgress {
  verseId: string
  attempts: number
  lastPracticed: Date
  confidence: number // 0-100
  masteredSyllables: string[]
  difficultSyllables: string[]
}

// Sanskrit phoneme guides
const SANSKRIT_PHONEMES: Record<string, { ipa: string; guide: string; tip: string }> = {
  'a': { ipa: 'ə', guide: 'uh (short)', tip: 'Like the "a" in "about"' },
  'ā': { ipa: 'aː', guide: 'aa (long)', tip: 'Like "a" in "father", held longer' },
  'i': { ipa: 'ɪ', guide: 'i (short)', tip: 'Like "i" in "bit"' },
  'ī': { ipa: 'iː', guide: 'ee (long)', tip: 'Like "ee" in "feet"' },
  'u': { ipa: 'ʊ', guide: 'u (short)', tip: 'Like "u" in "put"' },
  'ū': { ipa: 'uː', guide: 'oo (long)', tip: 'Like "oo" in "food"' },
  'ṛ': { ipa: 'ɾɪ', guide: 'ri', tip: 'Rolled r followed by short i' },
  'e': { ipa: 'eː', guide: 'ay', tip: 'Like "a" in "gate"' },
  'ai': { ipa: 'aɪ', guide: 'ai', tip: 'Like "i" in "bite"' },
  'o': { ipa: 'oː', guide: 'o', tip: 'Like "o" in "go"' },
  'au': { ipa: 'aʊ', guide: 'ow', tip: 'Like "ow" in "cow"' },
  'ṃ': { ipa: 'ŋ', guide: 'ng/m', tip: 'Nasal sound, lips closed' },
  'ḥ': { ipa: 'h', guide: 'h (breath)', tip: 'Soft breath after vowel' },
  'k': { ipa: 'k', guide: 'k', tip: 'Like "k" in "kite"' },
  'kh': { ipa: 'kʰ', guide: 'kh', tip: 'Aspirated k, with breath' },
  'g': { ipa: 'ɡ', guide: 'g', tip: 'Like "g" in "go"' },
  'gh': { ipa: 'ɡʱ', guide: 'gh', tip: 'Aspirated g, with breath' },
  'ṅ': { ipa: 'ŋ', guide: 'ng', tip: 'Like "ng" in "sing"' },
  'c': { ipa: 'tʃ', guide: 'ch', tip: 'Like "ch" in "church"' },
  'ch': { ipa: 'tʃʰ', guide: 'chh', tip: 'Aspirated ch' },
  'j': { ipa: 'dʒ', guide: 'j', tip: 'Like "j" in "joy"' },
  'jh': { ipa: 'dʒʱ', guide: 'jh', tip: 'Aspirated j' },
  'ñ': { ipa: 'ɲ', guide: 'ny', tip: 'Like "ny" in "canyon"' },
  'ṭ': { ipa: 'ʈ', guide: 't (retroflex)', tip: 'Tongue curled back, touches roof' },
  'ṭh': { ipa: 'ʈʰ', guide: 'th (retroflex)', tip: 'Aspirated retroflex t' },
  'ḍ': { ipa: 'ɖ', guide: 'd (retroflex)', tip: 'Tongue curled back' },
  'ḍh': { ipa: 'ɖʱ', guide: 'dh (retroflex)', tip: 'Aspirated retroflex d' },
  'ṇ': { ipa: 'ɳ', guide: 'n (retroflex)', tip: 'Tongue curled back for n' },
  't': { ipa: 't̪', guide: 't (dental)', tip: 'Tongue touches teeth' },
  'th': { ipa: 't̪ʰ', guide: 'th (dental)', tip: 'Aspirated dental t' },
  'd': { ipa: 'd̪', guide: 'd (dental)', tip: 'Tongue touches teeth' },
  'dh': { ipa: 'd̪ʱ', guide: 'dh (dental)', tip: 'Aspirated dental d' },
  'n': { ipa: 'n̪', guide: 'n', tip: 'Like "n" in "no"' },
  'p': { ipa: 'p', guide: 'p', tip: 'Like "p" in "pen"' },
  'ph': { ipa: 'pʰ', guide: 'ph', tip: 'Aspirated p (not "f")' },
  'b': { ipa: 'b', guide: 'b', tip: 'Like "b" in "boy"' },
  'bh': { ipa: 'bʱ', guide: 'bh', tip: 'Aspirated b' },
  'm': { ipa: 'm', guide: 'm', tip: 'Like "m" in "mom"' },
  'y': { ipa: 'j', guide: 'y', tip: 'Like "y" in "yes"' },
  'r': { ipa: 'ɾ', guide: 'r', tip: 'Lightly rolled r' },
  'l': { ipa: 'l', guide: 'l', tip: 'Like "l" in "love"' },
  'v': { ipa: 'ʋ', guide: 'v/w', tip: 'Between v and w' },
  'ś': { ipa: 'ʃ', guide: 'sh (palatal)', tip: 'Like "sh" in "ship"' },
  'ṣ': { ipa: 'ʂ', guide: 'sh (retroflex)', tip: 'Sh with tongue curled back' },
  's': { ipa: 's', guide: 's', tip: 'Like "s" in "sun"' },
  'h': { ipa: 'ɦ', guide: 'h', tip: 'Like "h" in "hello"' }
}

// Key verses with full pronunciation guides
const VERSE_PRONUNCIATIONS: VersePronunciation[] = [
  {
    verseId: 'bg-2-47',
    reference: 'Bhagavad Gita 2.47',
    sanskrit: 'karmaṇy evādhikāras te mā phaleṣu kadācana',
    devanagari: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
    phonemes: [
      { syllable: 'kar', ipa: 'kəɾ', simplified: 'kar', duration: 300, emphasis: 'medium' },
      { syllable: 'ma', ipa: 'mə', simplified: 'muh', duration: 200, emphasis: 'low' },
      { syllable: 'ṇy', ipa: 'ɳj', simplified: 'ny', duration: 200, emphasis: 'low', tip: 'Retroflex n into y' },
      { syllable: 'e', ipa: 'eː', simplified: 'ay', duration: 300, emphasis: 'medium' },
      { syllable: 'vā', ipa: 'ʋaː', simplified: 'vaa', duration: 400, emphasis: 'high', tip: 'Long aa sound' },
      { syllable: 'dhi', ipa: 'd̪ʱɪ', simplified: 'dhi', duration: 250, emphasis: 'medium' },
      { syllable: 'kā', ipa: 'kaː', simplified: 'kaa', duration: 350, emphasis: 'high' },
      { syllable: 'ras', ipa: 'ɾəs', simplified: 'rus', duration: 300, emphasis: 'medium' },
      { syllable: 'te', ipa: 't̪eː', simplified: 'tay', duration: 350, emphasis: 'high' },
      { syllable: 'mā', ipa: 'maː', simplified: 'maa', duration: 400, emphasis: 'high', tip: 'Emphasis - prohibition' },
      { syllable: 'pha', ipa: 'pʰə', simplified: 'phuh', duration: 250, emphasis: 'medium', tip: 'Aspirated p, not f' },
      { syllable: 'le', ipa: 'leː', simplified: 'lay', duration: 300, emphasis: 'medium' },
      { syllable: 'ṣu', ipa: 'ʂʊ', simplified: 'shu', duration: 250, emphasis: 'low', tip: 'Retroflex sh' },
      { syllable: 'ka', ipa: 'kə', simplified: 'kuh', duration: 200, emphasis: 'low' },
      { syllable: 'dā', ipa: 'd̪aː', simplified: 'daa', duration: 350, emphasis: 'medium' },
      { syllable: 'ca', ipa: 'tʃə', simplified: 'chuh', duration: 200, emphasis: 'low' },
      { syllable: 'na', ipa: 'n̪ə', simplified: 'nuh', duration: 250, emphasis: 'medium' }
    ],
    fullPronunciationGuide: 'KAR-muh-nyay VAA-dhi-KAA-rus-TAY MAA phuh-LAY-shu kuh-DAA-chuh-nuh',
    commonMistakes: [
      { mistake: 'Saying "karma" with hard r', correction: 'Use soft, slightly rolled r' },
      { mistake: 'Pronouncing ph as "f"', correction: 'ph is aspirated p, like p+h together' },
      { mistake: 'Short a in adhikāras', correction: 'Second ā is long: adhikAAras' },
      { mistake: 'Missing the retroflex in ṣu', correction: 'Curl tongue back for ṣ sound' }
    ],
    practiceSpeed: 'slow',
    audioHints: [
      'Pause slightly after "te" - it marks a thought break',
      'Emphasize "mā" - it means "never/do not"',
      'The verse has a natural rhythm: 8 + 8 syllables'
    ]
  },
  {
    verseId: 'bg-2-48',
    reference: 'Bhagavad Gita 2.48',
    sanskrit: 'yoga-sthaḥ kuru karmāṇi saṅgaṃ tyaktvā dhanañjaya',
    devanagari: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय',
    phonemes: [
      { syllable: 'yo', ipa: 'joː', simplified: 'yo', duration: 300, emphasis: 'high' },
      { syllable: 'ga', ipa: 'ɡə', simplified: 'guh', duration: 200, emphasis: 'low' },
      { syllable: 'sthaḥ', ipa: 'st̪ʰəh', simplified: 'sthuh', duration: 350, emphasis: 'medium', tip: 'th is aspirated' },
      { syllable: 'ku', ipa: 'kʊ', simplified: 'ku', duration: 200, emphasis: 'medium' },
      { syllable: 'ru', ipa: 'ɾʊ', simplified: 'ru', duration: 250, emphasis: 'medium' },
      { syllable: 'kar', ipa: 'kəɾ', simplified: 'kar', duration: 300, emphasis: 'medium' },
      { syllable: 'mā', ipa: 'maː', simplified: 'maa', duration: 350, emphasis: 'high' },
      { syllable: 'ṇi', ipa: 'ɳɪ', simplified: 'ni', duration: 200, emphasis: 'low', tip: 'Retroflex n' },
      { syllable: 'saṅ', ipa: 'səŋ', simplified: 'sung', duration: 300, emphasis: 'medium' },
      { syllable: 'gaṃ', ipa: 'ɡəŋ', simplified: 'gum', duration: 300, emphasis: 'medium', tip: 'Nasal ending' },
      { syllable: 'tyak', ipa: 't̪jək', simplified: 'tyuk', duration: 300, emphasis: 'medium' },
      { syllable: 'tvā', ipa: 't̪ʋaː', simplified: 'tvaa', duration: 350, emphasis: 'high' },
      { syllable: 'dha', ipa: 'd̪ʱə', simplified: 'dhuh', duration: 250, emphasis: 'medium' },
      { syllable: 'nañ', ipa: 'n̪əɲ', simplified: 'nun-y', duration: 300, emphasis: 'medium' },
      { syllable: 'ja', ipa: 'dʒə', simplified: 'juh', duration: 200, emphasis: 'low' },
      { syllable: 'ya', ipa: 'jə', simplified: 'yuh', duration: 250, emphasis: 'medium' }
    ],
    fullPronunciationGuide: 'YO-guh-STHUH KU-ru kar-MAA-ni SUNG-gum TYUK-tvaa dhuh-NUN-juh-yuh',
    commonMistakes: [
      { mistake: 'Missing aspiration in sthaḥ', correction: 'stha has aspirated th' },
      { mistake: 'Pronouncing saṅgaṃ without nasal', correction: 'Both ṅ and ṃ are nasal sounds' },
      { mistake: 'Hard t in tyaktvā', correction: 'Dental t, tongue touches teeth' }
    ],
    practiceSpeed: 'slow',
    audioHints: [
      'yoga-sthaḥ means "established in yoga"',
      'kuru is a command - "do/perform"',
      'Dhanañjaya is Arjuna\'s name - "winner of wealth"'
    ]
  },
  {
    verseId: 'bg-4-7',
    reference: 'Bhagavad Gita 4.7',
    sanskrit: 'yadā yadā hi dharmasya glānir bhavati bhārata',
    devanagari: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत',
    phonemes: [
      { syllable: 'ya', ipa: 'jə', simplified: 'yuh', duration: 200, emphasis: 'medium' },
      { syllable: 'dā', ipa: 'd̪aː', simplified: 'daa', duration: 350, emphasis: 'high' },
      { syllable: 'ya', ipa: 'jə', simplified: 'yuh', duration: 200, emphasis: 'medium' },
      { syllable: 'dā', ipa: 'd̪aː', simplified: 'daa', duration: 350, emphasis: 'high' },
      { syllable: 'hi', ipa: 'ɦɪ', simplified: 'hi', duration: 200, emphasis: 'low' },
      { syllable: 'dhar', ipa: 'd̪ʱəɾ', simplified: 'dhur', duration: 300, emphasis: 'high', tip: 'Aspirated dh' },
      { syllable: 'ma', ipa: 'mə', simplified: 'muh', duration: 200, emphasis: 'low' },
      { syllable: 'sya', ipa: 'sjə', simplified: 'syuh', duration: 250, emphasis: 'medium' },
      { syllable: 'glā', ipa: 'ɡlaː', simplified: 'glaa', duration: 350, emphasis: 'high' },
      { syllable: 'nir', ipa: 'n̪ɪɾ', simplified: 'nir', duration: 250, emphasis: 'medium' },
      { syllable: 'bha', ipa: 'bʱə', simplified: 'bhuh', duration: 250, emphasis: 'medium' },
      { syllable: 'va', ipa: 'ʋə', simplified: 'vuh', duration: 200, emphasis: 'low' },
      { syllable: 'ti', ipa: 't̪ɪ', simplified: 'ti', duration: 200, emphasis: 'low' },
      { syllable: 'bhā', ipa: 'bʱaː', simplified: 'bhaa', duration: 350, emphasis: 'high' },
      { syllable: 'ra', ipa: 'ɾə', simplified: 'ruh', duration: 200, emphasis: 'low' },
      { syllable: 'ta', ipa: 't̪ə', simplified: 'tuh', duration: 250, emphasis: 'medium' }
    ],
    fullPronunciationGuide: 'yuh-DAA yuh-DAA hi DHUR-muh-syuh GLAA-nir bhuh-VUH-ti BHAA-ruh-tuh',
    commonMistakes: [
      { mistake: 'Short a in yadā', correction: 'Long ā: ya-DAA' },
      { mistake: 'Missing aspiration in dharma', correction: 'dh is aspirated: DHarma' },
      { mistake: 'Pronouncing glā with short a', correction: 'Long ā: GLAA-nir' }
    ],
    practiceSpeed: 'medium',
    audioHints: [
      'yadā yadā creates a beautiful repetition - "whenever, whenever"',
      'This is Krishna\'s famous promise of divine intervention',
      'Bhārata refers to Arjuna as descendant of Bharata'
    ]
  },
  {
    verseId: 'bg-18-66',
    reference: 'Bhagavad Gita 18.66',
    sanskrit: 'sarva-dharmān parityajya mām ekaṃ śaraṇaṃ vraja',
    devanagari: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज',
    phonemes: [
      { syllable: 'sar', ipa: 'səɾ', simplified: 'sur', duration: 250, emphasis: 'medium' },
      { syllable: 'va', ipa: 'ʋə', simplified: 'vuh', duration: 200, emphasis: 'low' },
      { syllable: 'dhar', ipa: 'd̪ʱəɾ', simplified: 'dhur', duration: 300, emphasis: 'medium' },
      { syllable: 'mān', ipa: 'maːn̪', simplified: 'maan', duration: 350, emphasis: 'high' },
      { syllable: 'pa', ipa: 'pə', simplified: 'puh', duration: 200, emphasis: 'low' },
      { syllable: 'ri', ipa: 'ɾɪ', simplified: 'ri', duration: 200, emphasis: 'low' },
      { syllable: 'tyaj', ipa: 't̪jədʒ', simplified: 'tyuj', duration: 300, emphasis: 'medium' },
      { syllable: 'ya', ipa: 'jə', simplified: 'yuh', duration: 200, emphasis: 'low' },
      { syllable: 'mām', ipa: 'maːm', simplified: 'maam', duration: 400, emphasis: 'high', tip: 'Emphasis - "unto Me"' },
      { syllable: 'e', ipa: 'eː', simplified: 'ay', duration: 250, emphasis: 'medium' },
      { syllable: 'kaṃ', ipa: 'kəŋ', simplified: 'kum', duration: 300, emphasis: 'high', tip: 'Nasal ending' },
      { syllable: 'śa', ipa: 'ʃə', simplified: 'shuh', duration: 250, emphasis: 'medium' },
      { syllable: 'ra', ipa: 'ɾə', simplified: 'ruh', duration: 200, emphasis: 'low' },
      { syllable: 'ṇaṃ', ipa: 'ɳəŋ', simplified: 'num', duration: 300, emphasis: 'medium', tip: 'Retroflex n, nasal end' },
      { syllable: 'vra', ipa: 'ʋɾə', simplified: 'vruh', duration: 250, emphasis: 'medium' },
      { syllable: 'ja', ipa: 'dʒə', simplified: 'juh', duration: 250, emphasis: 'high' }
    ],
    fullPronunciationGuide: 'SUR-vuh DHUR-maan puh-ri-TYUJ-yuh MAAM ay-KUM shuh-ruh-NUM VRUH-juh',
    commonMistakes: [
      { mistake: 'Saying "dharma" instead of "dharmān"', correction: 'Long ā + n ending: dharmAAN' },
      { mistake: 'Missing retroflex in śaraṇaṃ', correction: 'ṇ is retroflex, tongue curled back' },
      { mistake: 'Short vowel in mām', correction: 'Long ā: MAAM (unto Me)' }
    ],
    practiceSpeed: 'slow',
    audioHints: [
      'This is the ultimate verse of surrender',
      'mām ekaṃ - "to Me alone" - most important phrase',
      'śaraṇaṃ vraja - "take refuge" - surrender completely'
    ]
  },
  {
    verseId: 'gayatri-mantra',
    reference: 'Gayatri Mantra',
    sanskrit: 'oṃ bhūr bhuvaḥ svaḥ tat savitur vareṇyaṃ bhargo devasya dhīmahi dhiyo yo naḥ pracodayāt',
    devanagari: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    phonemes: [
      { syllable: 'oṃ', ipa: 'oːŋ', simplified: 'om', duration: 500, emphasis: 'high', tip: 'Sacred syllable, hold long' },
      { syllable: 'bhūr', ipa: 'bʱuːɾ', simplified: 'bhoor', duration: 350, emphasis: 'high' },
      { syllable: 'bhu', ipa: 'bʱʊ', simplified: 'bhu', duration: 250, emphasis: 'medium' },
      { syllable: 'vaḥ', ipa: 'ʋəh', simplified: 'vuh', duration: 250, emphasis: 'medium' },
      { syllable: 'svaḥ', ipa: 'sʋəh', simplified: 'svuh', duration: 300, emphasis: 'high' },
      { syllable: 'tat', ipa: 't̪ət̪', simplified: 'tut', duration: 250, emphasis: 'medium' },
      { syllable: 'sa', ipa: 'sə', simplified: 'suh', duration: 200, emphasis: 'low' },
      { syllable: 'vi', ipa: 'ʋɪ', simplified: 'vi', duration: 200, emphasis: 'low' },
      { syllable: 'tur', ipa: 't̪ʊɾ', simplified: 'tur', duration: 250, emphasis: 'medium' },
      { syllable: 'va', ipa: 'ʋə', simplified: 'vuh', duration: 200, emphasis: 'low' },
      { syllable: 're', ipa: 'ɾeː', simplified: 'ray', duration: 300, emphasis: 'medium' },
      { syllable: 'ṇyaṃ', ipa: 'ɳjəŋ', simplified: 'nyum', duration: 350, emphasis: 'high' },
      { syllable: 'bhar', ipa: 'bʱəɾ', simplified: 'bhur', duration: 300, emphasis: 'medium' },
      { syllable: 'go', ipa: 'ɡoː', simplified: 'go', duration: 300, emphasis: 'high' },
      { syllable: 'de', ipa: 'd̪eː', simplified: 'day', duration: 250, emphasis: 'medium' },
      { syllable: 'va', ipa: 'ʋə', simplified: 'vuh', duration: 200, emphasis: 'low' },
      { syllable: 'sya', ipa: 'sjə', simplified: 'syuh', duration: 250, emphasis: 'medium' },
      { syllable: 'dhī', ipa: 'd̪ʱiː', simplified: 'dhee', duration: 350, emphasis: 'high' },
      { syllable: 'ma', ipa: 'mə', simplified: 'muh', duration: 200, emphasis: 'low' },
      { syllable: 'hi', ipa: 'ɦɪ', simplified: 'hi', duration: 200, emphasis: 'medium' },
      { syllable: 'dhi', ipa: 'd̪ʱɪ', simplified: 'dhi', duration: 250, emphasis: 'medium' },
      { syllable: 'yo', ipa: 'joː', simplified: 'yo', duration: 300, emphasis: 'high' },
      { syllable: 'yo', ipa: 'joː', simplified: 'yo', duration: 250, emphasis: 'medium' },
      { syllable: 'naḥ', ipa: 'n̪əh', simplified: 'nuh', duration: 250, emphasis: 'medium' },
      { syllable: 'pra', ipa: 'pɾə', simplified: 'pruh', duration: 250, emphasis: 'medium' },
      { syllable: 'co', ipa: 'tʃoː', simplified: 'cho', duration: 300, emphasis: 'medium' },
      { syllable: 'da', ipa: 'd̪ə', simplified: 'duh', duration: 200, emphasis: 'low' },
      { syllable: 'yāt', ipa: 'jaːt̪', simplified: 'yaat', duration: 400, emphasis: 'high' }
    ],
    fullPronunciationGuide: 'OM BHOOR bhu-VUH SVUH | TUT suh-vi-TUR vuh-RAY-nyum | BHUR-go DAY-vuh-syuh DHEE-muh-hi | DHI-yo YO nuh pruh-CHO-duh-YAAT',
    commonMistakes: [
      { mistake: 'Rushing through Om', correction: 'Hold Om for 2-3 seconds' },
      { mistake: 'Flat pronunciation without emphasis', correction: 'Natural rhythm with emphasis on key syllables' },
      { mistake: 'Missing aspiration in bhūr, bhargo, dhīmahi', correction: 'bh and dh are aspirated' }
    ],
    practiceSpeed: 'slow',
    audioHints: [
      'Traditional break after svaḥ (earth, atmosphere, heaven)',
      'Meditate on the meaning: "We meditate upon the divine light"',
      'pracodayāt - may it illuminate our intellect'
    ]
  }
]

/**
 * Get pronunciation guide for a specific verse
 */
export function getVersePronunciation(verseId: string): VersePronunciation | null {
  return VERSE_PRONUNCIATIONS.find(v => v.verseId === verseId) || null
}

/**
 * Get all available verses for pronunciation practice
 */
export function getAvailableVerses(): { verseId: string; reference: string; difficulty: string }[] {
  return VERSE_PRONUNCIATIONS.map(v => ({
    verseId: v.verseId,
    reference: v.reference,
    difficulty: v.practiceSpeed === 'slow' ? 'Beginner' : v.practiceSpeed === 'medium' ? 'Intermediate' : 'Advanced'
  }))
}

/**
 * Generate practice session speech for a verse
 */
export function generatePronunciationLesson(verseId: string): string[] {
  const verse = getVersePronunciation(verseId)
  if (!verse) return ['Verse not found for pronunciation practice.']

  const lesson: string[] = []

  // Introduction
  lesson.push(`Let us practice the pronunciation of ${verse.reference}.`)
  lesson.push(`First, I will recite the complete verse slowly. Listen carefully.`)
  lesson.push(`The verse in Sanskrit is: ${verse.sanskrit}`)

  // Phonetic guide
  lesson.push(`Now let me break it down phonetically: ${verse.fullPronunciationGuide}`)

  // Syllable by syllable
  lesson.push(`Let us go syllable by syllable. Repeat after me.`)

  // Group syllables into words for better practice
  let currentWord = ''
  let wordPhonemes: PhonemicBreakdown[] = []

  for (const phoneme of verse.phonemes) {
    wordPhonemes.push(phoneme)
    currentWord += phoneme.simplified + ' '

    // Add word break guidance periodically
    if (phoneme.emphasis === 'high' || wordPhonemes.length >= 4) {
      const emphasis = wordPhonemes.filter(p => p.emphasis === 'high').map(p => p.simplified).join(', ')
      if (emphasis) {
        lesson.push(`${currentWord.trim()}. Emphasize: ${emphasis}`)
      } else {
        lesson.push(currentWord.trim())
      }
      currentWord = ''
      wordPhonemes = []
    }
  }

  // Common mistakes
  lesson.push(`Now, let me share common pronunciation mistakes to avoid.`)
  for (const mistake of verse.commonMistakes) {
    lesson.push(`Avoid: ${mistake.mistake}. Instead: ${mistake.correction}`)
  }

  // Audio hints
  lesson.push(`Some helpful tips for this verse:`)
  for (const hint of verse.audioHints) {
    lesson.push(hint)
  }

  // Final practice
  lesson.push(`Now, let us recite the full verse together three times.`)
  lesson.push(`First time, slowly: ${verse.fullPronunciationGuide}`)
  lesson.push(`Second time, with natural rhythm.`)
  lesson.push(`Third time, from your heart.`)

  return lesson
}

/**
 * Get phoneme guide for a specific Sanskrit character
 */
export function getPhonemeGuide(char: string): { ipa: string; guide: string; tip: string } | null {
  return SANSKRIT_PHONEMES[char.toLowerCase()] || null
}

/**
 * Generate quick pronunciation tips for any Sanskrit text
 */
export function getQuickPronunciationTips(text: string): string[] {
  const tips: string[] = []
  const lowerText = text.toLowerCase()

  // Check for common patterns
  if (lowerText.includes('dh') || lowerText.includes('bh') || lowerText.includes('gh') || lowerText.includes('th') || lowerText.includes('ph')) {
    tips.push('Remember: dh, bh, gh, th, ph are aspirated consonants - pronounced with a breath of air, not as two separate sounds.')
  }

  if (lowerText.includes('ā') || lowerText.includes('ī') || lowerText.includes('ū')) {
    tips.push('Long vowels (ā, ī, ū) should be held approximately twice as long as short vowels.')
  }

  if (lowerText.includes('ṃ') || lowerText.includes('ṅ')) {
    tips.push('Nasal sounds (ṃ, ṅ) are pronounced with air flowing through the nose.')
  }

  if (lowerText.includes('ṭ') || lowerText.includes('ḍ') || lowerText.includes('ṇ') || lowerText.includes('ṣ')) {
    tips.push('Retroflex consonants (ṭ, ḍ, ṇ, ṣ) are pronounced with the tongue curled back to touch the roof of the mouth.')
  }

  if (lowerText.includes('ś')) {
    tips.push('ś (palatal sh) is like "sh" in "ship" - softer than the retroflex ṣ.')
  }

  return tips
}

/**
 * Save pronunciation progress
 */
export function savePronunciationProgress(progress: PronunciationProgress): void {
  const key = 'kiaan_pronunciation_progress'
  try {
    const allProgress = JSON.parse(localStorage.getItem(key) || '{}')
    allProgress[progress.verseId] = {
      ...progress,
      lastPracticed: new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify(allProgress))
  } catch (e) {
    console.warn('Failed to save pronunciation progress:', e)
  }
}

/**
 * Get pronunciation progress for a verse
 */
export function getPronunciationProgress(verseId: string): PronunciationProgress | null {
  const key = 'kiaan_pronunciation_progress'
  try {
    const allProgress = JSON.parse(localStorage.getItem(key) || '{}')
    const progress = allProgress[verseId]
    if (progress) {
      return {
        ...progress,
        lastPracticed: new Date(progress.lastPracticed)
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Get all pronunciation progress
 */
export function getAllPronunciationProgress(): PronunciationProgress[] {
  const key = 'kiaan_pronunciation_progress'
  try {
    const allProgress = JSON.parse(localStorage.getItem(key) || '{}')
    return Object.values(allProgress).map((p: any) => ({
      ...p,
      lastPracticed: new Date(p.lastPracticed)
    }))
  } catch {
    return []
  }
}
