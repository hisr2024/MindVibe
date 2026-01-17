/**
 * Constants for translation and internationalization
 */

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE = 'en' as const

/**
 * Supported language codes
 */
export const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 
  'gu', 'kn', 'ml', 'pa', 'sa', 'es',
  'fr', 'de', 'pt', 'ja', 'zh-CN'
] as const

/**
 * Language type
 */
export type Language = typeof SUPPORTED_LANGUAGES[number]

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
