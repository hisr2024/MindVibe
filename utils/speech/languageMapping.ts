/**
 * Maps MindVibe locale codes to browser Speech API language codes
 */

export type SupportedLocale = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'sa' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh-CN'

export const SPEECH_LANGUAGE_MAP: Record<SupportedLocale, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  sa: 'hi-IN', // Sanskrit falls back to Hindi for speech
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
  ja: 'ja-JP',
  'zh-CN': 'zh-CN',
}

/**
 * Gets the Speech API language code for a given locale
 */
export function getSpeechLanguage(locale: string): string {
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
