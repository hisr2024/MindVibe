/**
 * Maps MindVibe locale codes to browser Speech API language codes
 */

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'ar' | 'zh' | 'ja' | 'pt'

export const SPEECH_LANGUAGE_MAP: Record<SupportedLocale, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  hi: 'hi-IN',
  ar: 'ar-SA',
  zh: 'zh-CN',
  ja: 'ja-JP',
  pt: 'pt-PT',
}

/**
 * Gets the Speech API language code for a given locale
 */
export function getSpeechLanguage(locale: string): string {
  // Handle zh-CN special case from useLanguage hook
  if (locale === 'zh-CN') {
    return SPEECH_LANGUAGE_MAP.zh
  }
  
  const localeKey = locale as SupportedLocale
  return SPEECH_LANGUAGE_MAP[localeKey] || SPEECH_LANGUAGE_MAP.en
}

/**
 * Checks if Speech Recognition is supported in the current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

/**
 * Checks if Speech Synthesis is supported in the current browser
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window
}

/**
 * Gets the SpeechRecognition constructor (with webkit prefix if needed)
 */
export function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null
  
  // Type assertion for webkit prefix
  const w = window as typeof window & {
    webkitSpeechRecognition?: typeof SpeechRecognition
  }
  
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}
