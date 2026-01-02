/**
 * Language Detection Utility
 * 
 * Provides client-side language detection for user input text
 * using character patterns and common word detection.
 */

export type DetectedLanguage = {
  code: string;
  confidence: number;
  name: string;
};

// Language patterns for detection
const LANGUAGE_PATTERNS = {
  en: {
    name: 'English',
    chars: /[a-zA-Z]/,
    commonWords: ['the', 'is', 'are', 'and', 'of', 'to', 'in', 'for', 'with', 'on']
  },
  hi: {
    name: 'Hindi',
    chars: /[\u0900-\u097F]/,
    commonWords: ['है', 'हैं', 'का', 'के', 'की', 'में', 'से', 'को', 'पर', 'ने']
  },
  ta: {
    name: 'Tamil',
    chars: /[\u0B80-\u0BFF]/,
    commonWords: ['இது', 'அது', 'இந்த', 'அந்த', 'என்ன', 'எப்படி', 'எங்கே', 'யார்']
  },
  te: {
    name: 'Telugu',
    chars: /[\u0C00-\u0C7F]/,
    commonWords: ['ఇది', 'అది', 'ఈ', 'ఆ', 'ఏమి', 'ఎలా', 'ఎక్కడ', 'ఎవరు']
  },
  bn: {
    name: 'Bengali',
    chars: /[\u0980-\u09FF]/,
    commonWords: ['এটি', 'ওটা', 'এই', 'ওই', 'কি', 'কেমন', 'কোথায়', 'কে']
  },
  mr: {
    name: 'Marathi',
    chars: /[\u0900-\u097F]/,
    commonWords: ['हे', 'ते', 'या', 'त्या', 'काय', 'कसे', 'कुठे', 'कोण']
  },
  gu: {
    name: 'Gujarati',
    chars: /[\u0A80-\u0AFF]/,
    commonWords: ['આ', 'તે', 'આ', 'તે', 'શું', 'કેમ', 'ક્યાં', 'કોણ']
  },
  kn: {
    name: 'Kannada',
    chars: /[\u0C80-\u0CFF]/,
    commonWords: ['ಇದು', 'ಅದು', 'ಈ', 'ಆ', 'ಏನು', 'ಹೇಗೆ', 'ಎಲ್ಲಿ', 'ಯಾರು']
  },
  ml: {
    name: 'Malayalam',
    chars: /[\u0D00-\u0D7F]/,
    commonWords: ['ഇത്', 'അത്', 'ഈ', 'ആ', 'എന്ത്', 'എങ്ങനെ', 'എവിടെ', 'ആര്']
  },
  pa: {
    name: 'Punjabi',
    chars: /[\u0A00-\u0A7F]/,
    commonWords: ['ਇਹ', 'ਉਹ', 'ਇਸ', 'ਉਸ', 'ਕੀ', 'ਕਿਵੇਂ', 'ਕਿੱਥੇ', 'ਕੌਣ']
  },
  es: {
    name: 'Spanish',
    chars: /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/,
    commonWords: ['el', 'la', 'de', 'que', 'y', 'es', 'en', 'por', 'un', 'para']
  },
  fr: {
    name: 'French',
    chars: /[a-zA-ZàâäæçéèêëïîôùûüÿœÀÂÄÆÇÉÈÊËÏÎÔÙÛÜŸŒ]/,
    commonWords: ['le', 'la', 'de', 'et', 'un', 'une', 'dans', 'pour', 'que', 'qui']
  },
  de: {
    name: 'German',
    chars: /[a-zA-ZäöüßÄÖÜ]/,
    commonWords: ['der', 'die', 'das', 'und', 'in', 'ist', 'von', 'den', 'zu', 'mit']
  },
  pt: {
    name: 'Portuguese',
    chars: /[a-zA-ZáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/,
    commonWords: ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para']
  },
  ja: {
    name: 'Japanese',
    chars: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
    commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し']
  },
  'zh-CN': {
    name: 'Chinese',
    chars: /[\u4E00-\u9FFF]/,
    commonWords: ['的', '是', '在', '了', '和', '有', '我', '你', '他', '她']
  }
};

/**
 * Detect the language of input text
 */
export function detectLanguage(text: string): DetectedLanguage {
  if (!text || text.trim().length === 0) {
    return { code: 'en', confidence: 0, name: 'English' };
  }

  const normalizedText = text.toLowerCase().trim();
  const scores: Record<string, number> = {};

  // Score based on character patterns
  for (const [langCode, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;
    
    // Count matching characters
    const chars = normalizedText.match(pattern.chars);
    if (chars) {
      score += (chars.length / normalizedText.length) * 50;
    }

    // Check for common words
    const words = normalizedText.split(/\s+/);
    for (const word of words) {
      if (pattern.commonWords.some(commonWord => 
        word.includes(commonWord) || commonWord.includes(word)
      )) {
        score += 10;
      }
    }

    scores[langCode] = score;
  }

  // Find language with highest score
  let maxScore = 0;
  let detectedLang = 'en';

  for (const [langCode, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = langCode;
    }
  }

  // Calculate confidence (0-1 scale)
  const confidence = Math.min(maxScore / 100, 1);

  return {
    code: detectedLang,
    confidence,
    name: LANGUAGE_PATTERNS[detectedLang as keyof typeof LANGUAGE_PATTERNS].name
  };
}

/**
 * Check if text contains mixed languages
 */
export function detectMixedLanguages(text: string): DetectedLanguage[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const detected: DetectedLanguage[] = [];
  const scores: Record<string, number> = {};

  // Score all languages
  for (const [langCode, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    const chars = text.match(pattern.chars);
    if (chars && chars.length > 0) {
      const score = (chars.length / text.length) * 100;
      if (score > 10) { // Only include if >10% presence
        scores[langCode] = score;
      }
    }
  }

  // Convert to array and sort by score
  for (const [langCode, score] of Object.entries(scores)) {
    detected.push({
      code: langCode,
      confidence: score / 100,
      name: LANGUAGE_PATTERNS[langCode as keyof typeof LANGUAGE_PATTERNS].name
    });
  }

  return detected.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get user's preferred language from browser settings
 */
export function getBrowserLanguage(): string {
  if (typeof window === 'undefined' || !navigator.languages) {
    return 'en';
  }

  // Check browser language settings
  for (const lang of navigator.languages) {
    const langCode = lang.split('-')[0];
    if (LANGUAGE_PATTERNS[langCode as keyof typeof LANGUAGE_PATTERNS]) {
      return langCode;
    }
  }

  return 'en';
}

/**
 * Validate if a language code is supported
 */
export function isSupportedLanguage(code: string): boolean {
  return code in LANGUAGE_PATTERNS;
}

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  const pattern = LANGUAGE_PATTERNS[code as keyof typeof LANGUAGE_PATTERNS];
  return pattern ? pattern.name : 'Unknown';
}
