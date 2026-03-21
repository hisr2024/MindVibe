/**
 * Unified Language Constants — Frontend Single Source of Truth
 *
 * All language-related decisions in the frontend flow through this module.
 * No other file should define its own LANGUAGE_NAMES or SUPPORTED_LANGUAGES.
 *
 * Mirrors backend/services/language_registry.py (29 languages).
 */

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE = 'en' as const

/**
 * All 29 supported language codes (canonical form).
 * Matches backend LANGUAGE_REGISTRY exactly.
 *
 * Indian (11): en, hi, ta, te, bn, mr, gu, kn, ml, pa, sa
 * European (9): es, fr, de, pt, it, nl, pl, sv, ru
 * Asian (6): ja, zh, ko, th, vi, id
 * Middle Eastern (2): ar, tr
 * African (1): sw
 */
export const SUPPORTED_LANGUAGES = [
  // Indian languages
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa',
  // European languages
  'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'sv', 'ru',
  // Asian languages
  'ja', 'zh', 'ko', 'th', 'vi', 'id',
  // Middle Eastern languages
  'ar', 'tr',
  // African languages
  'sw',
] as const

/**
 * Language type derived from SUPPORTED_LANGUAGES
 */
export type Language = typeof SUPPORTED_LANGUAGES[number]

/**
 * Human-readable language names keyed by language code.
 * Used in OpenAI prompt instructions, UI labels, and analytics.
 *
 * IMPORTANT: Import this instead of defining your own LANGUAGE_NAMES.
 */
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  sa: 'Sanskrit',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese (Simplified)',
  ko: 'Korean',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ar: 'Arabic',
  tr: 'Turkish',
  sw: 'Swahili',
}

/**
 * Native language names (displayed in the language's own script)
 */
export const LANGUAGE_NATIVE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  bn: 'বাংলা',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  sa: 'संस्कृत',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
  sv: 'Svenska',
  ru: 'Русский',
  ja: '日本語',
  zh: '简体中文',
  ko: '한국어',
  th: 'ภาษาไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  ar: 'العربية',
  tr: 'Türkçe',
  sw: 'Kiswahili',
}

/**
 * Text direction for each language
 */
export const LANGUAGE_DIRECTIONS: Record<string, 'ltr' | 'rtl'> = {
  ar: 'rtl',
}

/**
 * Check if a language code is supported
 */
export function isSupportedLanguage(lang: string): lang is Language {
  return SUPPORTED_LANGUAGES.includes(lang as Language)
}

/**
 * Check if a language requires translation (not default language)
 */
export function requiresTranslation(lang: string): boolean {
  return lang !== DEFAULT_LANGUAGE
}

/**
 * Normalize a language code to its canonical form.
 * Mirrors backend normalize_language_code().
 */
export function normalizeLanguageCode(code: string): string {
  if (!code) return 'en'
  const normalized = code.trim()
  const map: Record<string, string> = {
    'zh-CN': 'zh', 'zh-cn': 'zh', 'zh-TW': 'zh', 'zh-tw': 'zh',
    'en-IN': 'en', 'en-in': 'en', 'en-US': 'en', 'en-us': 'en',
    'pt-BR': 'pt', 'es-ES': 'es', 'fr-FR': 'fr', 'ar-SA': 'ar',
  }
  if (map[normalized]) return map[normalized]
  if (isSupportedLanguage(normalized)) return normalized
  const prefix = normalized.split('-')[0]
  if (isSupportedLanguage(prefix)) return prefix
  return normalized
}

/**
 * Get the human-readable name for a language code.
 * Falls back to 'English' for unknown codes.
 */
export function getLanguageName(code: string): string {
  const normalized = normalizeLanguageCode(code)
  return LANGUAGE_NAMES[normalized] || 'English'
}
