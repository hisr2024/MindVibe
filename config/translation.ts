/**
 * Translation Configuration Module
 * 
 * Centralizes translation-related configurations including:
 * - Supported languages
 * - API endpoints
 * - Rate limiting rules
 * - Cache settings
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
}

export interface TranslationConfig {
  // API Configuration
  googleTranslateApiUrl: string;
  libreTranslateApiUrl: string;
  backendApiUrl: string;
  
  // Rate Limiting
  rateLimitWindow: number; // milliseconds
  maxRequestsPerWindow: number;
  
  // Cache Settings
  cacheExpiryTime: number; // milliseconds
  maxCacheSize: number;
  
  // Retry Settings
  maxRetries: number;
  initialRetryDelay: number; // milliseconds
  retryBackoffMultiplier: number;
  
  // Translation Settings
  maxTextLength: number;
  defaultSourceLanguage: string;
  fallbackLanguage: string;
}

// Supported languages with metadata
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृत', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr' }
];

// Default translation configuration
export const TRANSLATION_CONFIG: TranslationConfig = {
  // API Configuration
  googleTranslateApiUrl: 'https://translation.googleapis.com/language/translate/v2',
  libreTranslateApiUrl: 'https://libretranslate.de/translate',
  backendApiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  
  // Rate Limiting (30 requests per minute)
  rateLimitWindow: 60000, // 1 minute
  maxRequestsPerWindow: 30,
  
  // Cache Settings (24 hour expiry, max 1000 entries)
  cacheExpiryTime: 24 * 60 * 60 * 1000, // 24 hours
  maxCacheSize: 1000,
  
  // Retry Settings (exponential backoff)
  maxRetries: 3,
  initialRetryDelay: 1000, // 1 second
  retryBackoffMultiplier: 2,
  
  // Translation Settings
  maxTextLength: 5000,
  defaultSourceLanguage: 'en',
  fallbackLanguage: 'en'
};

/**
 * Helper functions
 */

/**
 * Get language config by code
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get all language codes
 */
export function getLanguageCodes(): string[] {
  return SUPPORTED_LANGUAGES.map(lang => lang.code);
}

/**
 * Check if a language is supported
 */
export function isSupportedLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get language name by code
 */
export function getLanguageName(code: string, native: boolean = false): string {
  const config = getLanguageConfig(code);
  if (!config) return code;
  return native ? config.nativeName : config.name;
}

/**
 * Get languages grouped by region
 */
export function getLanguagesByRegion(): Record<string, LanguageConfig[]> {
  return {
    'Indian Languages': SUPPORTED_LANGUAGES.filter(lang => 
      ['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa'].includes(lang.code)
    ),
    'European Languages': SUPPORTED_LANGUAGES.filter(lang =>
      ['en', 'es', 'fr', 'de', 'pt'].includes(lang.code)
    ),
    'East Asian Languages': SUPPORTED_LANGUAGES.filter(lang =>
      ['ja', 'zh-CN'].includes(lang.code)
    )
  };
}

/**
 * Validate translation text length
 */
export function validateTextLength(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }
  
  if (text.length > TRANSLATION_CONFIG.maxTextLength) {
    return { 
      valid: false, 
      error: `Text exceeds maximum length of ${TRANSLATION_CONFIG.maxTextLength} characters` 
    };
  }
  
  return { valid: true };
}

export default TRANSLATION_CONFIG;
