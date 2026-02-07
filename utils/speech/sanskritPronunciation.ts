/**
 * Sanskrit Pronunciation Dictionary for Browser TTS
 *
 * Maps Sanskrit/Hindi terms to phonetic spellings that browser TTS engines
 * pronounce correctly. Without this, "dharma" becomes "DHAR-muh" instead of
 * the correct "dhar-mah", and "Arjuna" becomes "AR-joo-nuh" instead of "Ar-jun".
 *
 * Also handles SSML-like preprocessing: adds pauses between Sanskrit and English,
 * emphasis on key spiritual terms, and breathing pauses for verse recitation.
 *
 * Covers Items #1 (SSML), #7 (Pronunciation), #104 (Sanskrit engine) from improvements.
 */

// ─── Pronunciation Map ──────────────────────────────────────────────────────

const PRONUNCIATION_MAP: Record<string, string> = {
  // Divine Names
  'krishna': 'Krish-nah',
  'arjuna': 'Ar-jun',
  'bhagavad': 'Bhug-uh-vud',
  'gita': 'Gee-tah',
  'mahabharata': 'Muh-hah-BHAH-ruh-tuh',
  'draupadi': 'Drow-puh-dee',
  'duryodhana': 'Door-YO-dhun',
  'bhishma': 'BHEESH-muh',
  'karna': 'KAR-nuh',
  'yudhishthira': 'Yoo-DHISH-teer',
  'bhima': 'BHEE-muh',
  'nakula': 'NUH-kool',
  'sahadeva': 'Suh-huh-DAY-vuh',
  'sanjaya': 'Sun-JAY',
  'dhritarashtra': 'Dhrit-uh-RASH-truh',
  'vyasa': 'Vyah-suh',
  'hanuman': 'HUN-oo-mahn',
  'rama': 'Rah-mah',
  'sita': 'See-tah',
  'vishnu': 'VISH-noo',
  'shiva': 'SHEE-vah',
  'brahma': 'Bruh-mah',
  'lakshmi': 'LUCK-shmee',
  'saraswati': 'Suh-RUS-wuh-tee',
  'ganesh': 'Guh-NAYSH',
  'parvati': 'PAR-vuh-tee',

  // Philosophical Concepts
  'dharma': 'dhar-mah',
  'karma': 'kar-mah',
  'yoga': 'yo-gah',
  'moksha': 'mok-shuh',
  'samsara': 'sum-SAH-rah',
  'atman': 'AHT-mun',
  'brahman': 'BRUH-mun',
  'maya': 'MAH-yah',
  'ahimsa': 'uh-HIM-sah',
  'satya': 'SUT-yah',
  'tapas': 'TUH-pus',
  'sattva': 'SUT-vah',
  'rajas': 'RAH-jus',
  'tamas': 'TUH-mus',
  'guna': 'GOO-nuh',
  'gunas': 'GOO-nuhs',
  'prakriti': 'PRUH-kree-tee',
  'purusha': 'POO-roo-shuh',
  'samadhi': 'suh-MAH-dee',
  'nirvana': 'neer-VAH-nuh',
  'mantra': 'MUN-truh',
  'sutra': 'SOO-truh',
  'tantra': 'TUN-truh',
  'veda': 'VAY-duh',
  'vedas': 'VAY-duhs',
  'upanishad': 'oo-PUN-ee-shud',
  'upanishads': 'oo-PUN-ee-shudz',
  'rishi': 'REE-shee',
  'guru': 'GOO-roo',
  'acharya': 'AH-char-yah',
  'swami': 'SWAH-mee',
  'ashram': 'AHSH-rum',
  'deva': 'DAY-vuh',

  // Yoga Types
  'bhakti': 'BHUK-tee',
  'jnana': 'GYAH-nuh',
  'sankhya': 'SAHN-khyuh',
  'pranayama': 'prah-nah-YAH-muh',
  'asana': 'AH-suh-nuh',
  'dhyana': 'DHYAH-nuh',
  'dharana': 'DHAH-ruh-nah',
  'pratyahara': 'prut-yah-HAH-ruh',

  // Key Terms from Gita
  'shloka': 'SHLO-kuh',
  'namaste': 'nuh-MUS-tay',
  'om': 'ohm',
  'aum': 'ah-oo-m',
  'shanti': 'SHAHN-tee',
  'chakra': 'CHUK-ruh',
  'prana': 'PRAH-nuh',
  'kundalini': 'koon-duh-LEE-nee',
  'mudra': 'MOO-druh',
  'bandha': 'BAHN-duh',
  'nadi': 'NAH-dee',
  'kosha': 'KO-shuh',
  'viveka': 'vee-VAY-kuh',
  'vairagya': 'vai-RAHG-yuh',
  'sannyasa': 'sun-NYAH-suh',
  'tyaga': 'TYAH-guh',
  'yajna': 'YUG-nyuh',
  'tapasya': 'tuh-PUS-yah',
  'sadhana': 'SAH-dhuh-nah',
  'siddhi': 'SID-dhee',
  'samskara': 'sum-SKAH-ruh',
  'vasana': 'VAH-suh-nah',
  'krodha': 'KRO-dhuh',
  'lobha': 'LO-bhuh',
  'moha': 'MO-huh',
  'mada': 'MUH-duh',
  'matsarya': 'MUT-sar-yuh',
  'ahamkara': 'uh-hum-KAH-ruh',
  'buddhi': 'BUD-dhee',
  'manas': 'MUN-us',
  'chitta': 'CHIT-tuh',

  // Gita-specific
  'kurukshetra': 'koo-rook-SHAY-truh',
  'pandava': 'PAHN-duh-vuh',
  'pandavas': 'PAHN-duh-vuhz',
  'kaurava': 'KOW-ruh-vuh',
  'kauravas': 'KOW-ruh-vuhz',
  'kshatriya': 'KSHUT-ree-yuh',
  'dvandva': 'DVUN-dvuh',

  // Common Greetings/Terms
  'kiaan': 'kee-AHN',
  'jai': 'jay',
  'hare': 'huh-RAY',
  'sat': 'suht',
  'chit': 'chit',
  'ananda': 'AH-nun-duh',
  'bhagavan': 'BHUG-uh-vahn',
  'ishvara': 'EESH-vuh-ruh',
  'jiva': 'JEE-vuh',
  'loka': 'LO-kuh',
  'yuga': 'YOO-guh',
  'avatara': 'uh-vuh-TAH-ruh',
  'avatar': 'uh-vuh-TAHR',
}

// ─── SSML-like Text Preprocessing ───────────────────────────────────────────

/**
 * Preprocess text for browser TTS to improve pronunciation and pacing.
 * - Replaces Sanskrit terms with phonetic equivalents
 * - Adds pauses (commas) between Sanskrit terms and English
 * - Adds emphasis markers (periods for pauses) before verse references
 *
 * @param text - Raw text to preprocess
 * @returns Preprocessed text optimized for browser TTS
 */
export function preprocessForTTS(text: string): string {
  let processed = text

  // Replace Sanskrit terms with phonetic pronunciations (case-insensitive)
  for (const [term, phonetic] of Object.entries(PRONUNCIATION_MAP)) {
    // Use word boundary matching to avoid partial replacements
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    processed = processed.replace(regex, phonetic)
  }

  // Add breathing pauses before verse references (Chapter X, verse Y)
  processed = processed.replace(
    /\b(Chapter|chapter)\s+(\d+)/g,
    '. $1 $2'
  )
  processed = processed.replace(
    /\b(verse|Verse)\s+(\d+)/g,
    ', $1 $2,'
  )

  // Add pause after "In the Gita" or "The Gita says"
  processed = processed.replace(
    /(In the Gee-tah|The Gee-tah says|The Gee-tah teaches)/gi,
    '$1,'
  )

  // Add emphasis pause before quoted text (verse translations)
  processed = processed.replace(/['']/g, ',')
  processed = processed.replace(/['']/g, ',')

  // Add pause between sentences for more natural pacing
  processed = processed.replace(/\.\s+/g, '. ... ')

  // Clean up multiple commas/spaces
  processed = processed.replace(/,\s*,/g, ',')
  processed = processed.replace(/\s{2,}/g, ' ')

  return processed.trim()
}

/**
 * Check if text contains Sanskrit terms that need special handling.
 */
export function containsSanskrit(text: string): boolean {
  const lower = text.toLowerCase()
  return Object.keys(PRONUNCIATION_MAP).some(term => lower.includes(term))
}

/**
 * Get the pronunciation guide for a specific term.
 */
export function getPronunciation(term: string): string | null {
  return PRONUNCIATION_MAP[term.toLowerCase()] || null
}

/**
 * Get all available pronunciation entries (for settings/display).
 */
export function getAllPronunciations(): Array<{ term: string; phonetic: string }> {
  return Object.entries(PRONUNCIATION_MAP).map(([term, phonetic]) => ({
    term,
    phonetic,
  }))
}
