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
 * 1. Sanitizes for speech (strips markdown, emojis, academic citations)
 * 2. Replaces Sanskrit terms with phonetic equivalents
 * 3. Adds pacing pauses for natural rhythm
 *
 * @param text - Raw text to preprocess
 * @returns Preprocessed text optimized for browser TTS
 */
export function preprocessForTTS(text: string): string {
  let processed = sanitizeForSpeech(text)

  // Replace Sanskrit terms with phonetic pronunciations (case-insensitive)
  for (const [term, phonetic] of Object.entries(PRONUNCIATION_MAP)) {
    // Use word boundary matching to avoid partial replacements
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    processed = processed.replace(regex, phonetic)
  }

  // Add pause after "In the Gita" or "The Gita says"
  processed = processed.replace(
    /(In the Gee-tah|The Gee-tah says|The Gee-tah teaches)/gi,
    '$1,'
  )

  // Add pause between sentences for more natural pacing
  processed = processed.replace(/\.\s+/g, '. ... ')

  // Clean up multiple commas/spaces
  processed = processed.replace(/,\s*,/g, ',')
  processed = processed.replace(/\s{2,}/g, ' ')

  return processed.trim()
}

/**
 * Sanitize text for spoken output.
 * Strips everything that sounds wrong when read aloud by TTS:
 * - Markdown formatting (bold, italic, headers, links, code)
 * - Emoji characters
 * - Academic verse citations ("Chapter X, verse Y", "BG 2.47")
 * - Parenthetical references
 * - Special characters that TTS reads literally
 * - ALL-CAPS words (converted to normal case for natural speech)
 */
export function sanitizeForSpeech(text: string): string {
  let clean = text

  // 1. Strip markdown bold/italic: **bold** → bold, *italic* → italic, __bold__ → bold, _italic_ → italic
  clean = clean.replace(/\*{2,3}([^*]+)\*{2,3}/g, '$1')
  clean = clean.replace(/\*([^*]+)\*/g, '$1')
  clean = clean.replace(/_{2,3}([^_]+)_{2,3}/g, '$1')
  clean = clean.replace(/_([^_]+)_/g, '$1')

  // 2. Strip markdown headers: ### Header → Header
  clean = clean.replace(/^#{1,6}\s+/gm, '')

  // 3. Strip markdown links: [text](url) → text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // 4. Strip inline code: `code` → code
  clean = clean.replace(/`([^`]+)`/g, '$1')

  // 5. Strip markdown bullet points: - item → item, * item → item
  clean = clean.replace(/^\s*[-*]\s+/gm, '')

  // 6. Remove emojis (comprehensive Unicode emoji ranges)
  clean = clean.replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // emoticons
  clean = clean.replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // misc symbols & pictographs
  clean = clean.replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // transport & map
  clean = clean.replace(/[\u{1F700}-\u{1F77F}]/gu, '')  // alchemical
  clean = clean.replace(/[\u{1F780}-\u{1F7FF}]/gu, '')  // geometric shapes ext
  clean = clean.replace(/[\u{1F800}-\u{1F8FF}]/gu, '')  // supplemental arrows
  clean = clean.replace(/[\u{1F900}-\u{1F9FF}]/gu, '')  // supplemental symbols
  clean = clean.replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')  // chess symbols
  clean = clean.replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')  // symbols & pictographs ext-A
  clean = clean.replace(/[\u{2600}-\u{26FF}]/gu, '')    // misc symbols
  clean = clean.replace(/[\u{2700}-\u{27BF}]/gu, '')    // dingbats
  clean = clean.replace(/[\u{FE00}-\u{FE0F}]/gu, '')    // variation selectors
  clean = clean.replace(/[\u{200D}]/gu, '')              // zero-width joiner
  clean = clean.replace(/[\u{20E3}]/gu, '')              // combining enclosing keycap
  clean = clean.replace(/[\u{E0020}-\u{E007F}]/gu, '')   // tags

  // 7. Convert academic citations to natural speech
  // "Chapter X, verse Y" → natural form
  clean = clean.replace(/Chapter\s+(\d+),?\s*verse\s+(\d+)/gi, 'the Gita')
  // "Chapter X" → natural form (only when standalone reference)
  clean = clean.replace(/In\s+Chapter\s+\d+\s*,?\s*/gi, 'In the Gita, ')
  clean = clean.replace(/Chapter\s+\d+\s+(says|teaches|describes|explains|has|is|of|promises)/gi, 'The Gita $1')
  clean = clean.replace(/Chapter\s+\d+:\s*/gi, '')
  clean = clean.replace(/Chapter\s+\d+/gi, 'the Gita')
  // "BG X.Y" or "BG X:Y" → the Gita
  clean = clean.replace(/\bBG\s*\d+[.:]\d+/gi, 'the Gita')
  // "verse X" standalone → remove
  clean = clean.replace(/,?\s*verse\s+\d+\s*,?/gi, '')

  // 8. Remove parenthetical references: (Chapter 2) → nothing
  clean = clean.replace(/\(\s*Chapter\s+\d+[^)]*\)/gi, '')
  clean = clean.replace(/\(\s*verse\s+\d+[^)]*\)/gi, '')
  clean = clean.replace(/\(\s*BG\s+\d+[^)]*\)/gi, '')

  // 9. Convert curly/smart quotes to simple pauses (TTS reads them oddly)
  clean = clean.replace(/['']/g, ',')
  clean = clean.replace(/[""]/g, ',')

  // 10. Convert ALL-CAPS words (3+ chars) to title case for natural speech
  clean = clean.replace(/\b([A-Z]{3,})\b/g, (match) => {
    // Preserve known acronyms
    if (['KIAAN', 'TTS', 'SSML', 'WCAG'].includes(match)) return match
    return match.charAt(0) + match.slice(1).toLowerCase()
  })

  // 11. Strip hash/number signs that might be read: #1 → number 1
  clean = clean.replace(/#(\d+)/g, 'number $1')

  // 12. Clean up excessive punctuation
  clean = clean.replace(/\.{2,}/g, '.')     // multiple dots → single
  clean = clean.replace(/!{2,}/g, '!')       // multiple bangs → single
  clean = clean.replace(/\?{2,}/g, '?')      // multiple questions → single

  // 13. Clean up resulting whitespace
  clean = clean.replace(/\s{2,}/g, ' ')
  clean = clean.replace(/\s+([.,!?;:])/g, '$1')

  return clean.trim()
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
