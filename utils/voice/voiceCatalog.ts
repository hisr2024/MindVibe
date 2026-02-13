/**
 * Voice Catalog - Premium Named Speakers
 *
 * ElevenLabs-inspired voice catalog with named speakers, each with distinct
 * personality, language support, and TTS characteristics. Maps to both
 * backend (ElevenLabs / Sarvam AI Bulbul / OpenAI / Google Neural2) and
 * browser SpeechSynthesis fallback.
 *
 * Provider Quality Chain:
 * 1. ElevenLabs (10/10) - Most human-like voices
 * 2. Sarvam AI Bulbul (9.5/10) - Best Indian language voices
 * 3. OpenAI TTS HD (9.5/10) - Nova, Shimmer, Alloy
 * 4. Google Cloud Neural2 (9/10) - Premium neural voices
 * 5. Edge TTS (8.5/10) - Microsoft Neural (free)
 * 6. Browser SpeechSynthesis (5/10) - Ultimate fallback
 */

import type { VoiceGender } from '@/utils/speech/synthesis'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceLanguage =
  | 'en' | 'hi' | 'en-IN' | 'sa'
  | 'ta' | 'te' | 'bn' | 'kn' | 'ml' | 'mr' | 'gu' | 'pa'
  | 'es' | 'fr' | 'de' | 'ja' | 'pt' | 'ar' | 'zh'

export type VoiceCategory = 'conversational' | 'meditation' | 'narration' | 'sacred' | 'energetic'

/** TTS provider that powers this voice */
export type VoiceProvider = 'elevenlabs' | 'sarvam' | 'openai' | 'google' | 'edge' | 'browser'

export interface VoiceSpeaker {
  id: string
  name: string
  description: string
  gender: VoiceGender
  languages: VoiceLanguage[]
  primaryLanguage: VoiceLanguage
  category: VoiceCategory
  tags: string[]
  /** Preview text spoken when user taps preview */
  previewText: string
  /** TTS settings for backend (divine voice service) */
  backendConfig: {
    voiceType: string
    speed: number
    language: string
    /** Sarvam AI speaker ID (for Indian language priority routing) */
    sarvamSpeaker?: string
  }
  /** Browser SpeechSynthesis fallback settings */
  browserConfig: {
    /** Voice name patterns to match (tried in order) */
    voicePatterns: RegExp[]
    rate: number
    pitch: number
  }
  /** Whether this is a premium (backend-only) voice */
  premium: boolean
  /** Accent description for display */
  accent?: string
  /** Warmth 0-1 for UI visualization */
  warmth: number
  /** Clarity 0-1 for UI visualization */
  clarity: number
  /** Primary TTS provider that powers this voice at highest quality */
  poweredBy?: VoiceProvider
}

export interface VoiceLanguageInfo {
  code: VoiceLanguage
  name: string
  nativeName: string
  flag: string
  /** Whether Sarvam AI provides premium voices for this language */
  sarvamSupported?: boolean
}

// ─── Supported Languages ──────────────────────────────────────────────────────

export const VOICE_LANGUAGES: VoiceLanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'en-IN', name: 'Indian English', nativeName: 'Indian English', flag: '🇮🇳', sarvamSupported: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', sarvamSupported: true },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🕉️', sarvamSupported: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', sarvamSupported: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', sarvamSupported: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', sarvamSupported: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', sarvamSupported: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', sarvamSupported: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', sarvamSupported: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', sarvamSupported: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', sarvamSupported: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
]

// ─── Sarvam AI Priority Languages ────────────────────────────────────────────
// These languages get routed through Sarvam AI Bulbul for the best quality.

export const SARVAM_PRIORITY_LANGUAGES: VoiceLanguage[] = [
  'hi', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa', 'sa', 'en-IN',
]

export function isSarvamPriorityLanguage(lang: VoiceLanguage): boolean {
  return SARVAM_PRIORITY_LANGUAGES.includes(lang)
}

// ─── Voice Speakers Catalog ───────────────────────────────────────────────────

export const VOICE_SPEAKERS: VoiceSpeaker[] = [
  {
    id: 'sarvam-aura',
    name: 'Aura',
    description: 'Primary Sarvam AI companion voice tuned for emotionally warm Indian conversations.',
    gender: 'female',
    languages: ['en-IN', 'hi', 'sa', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa', 'en'],
    primaryLanguage: 'en-IN',
    category: 'conversational',
    tags: ['natural', 'warm', 'indian', 'sarvam', 'companion'],
    previewText: 'I am here with you. Let us slow down, breathe together, and take one clear step forward with calm confidence.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'en', sarvamSpeaker: 'meera' },
    browserConfig: {
      voicePatterns: [/Neerja/i, /Heera/i, /Google.*English.*India/i, /Google.*Hindi/i, /Jenny/i],
      rate: 0.93,
      pitch: 1.03,
    },
    premium: false,
    accent: 'Indian English',
    warmth: 0.96,
    clarity: 0.92,
    poweredBy: 'sarvam',
  },
  {
    id: 'sarvam-rishi',
    name: 'Rishi',
    description: 'Grounded Sarvam AI narration voice for Sanskrit, Gita guidance, and deep reflective sessions.',
    gender: 'male',
    languages: ['hi', 'sa', 'en-IN', 'ta', 'te', 'bn', 'mr', 'gu', 'pa', 'en'],
    primaryLanguage: 'hi',
    category: 'sacred',
    tags: ['natural', 'sacred', 'deep', 'sarvam', 'gita'],
    previewText: 'You are not alone in this journey. The wisdom you seek is already within you, waiting for a quiet moment to be heard.',
    backendConfig: { voiceType: 'chanting', speed: 0.86, language: 'hi', sarvamSpeaker: 'arvind' },
    browserConfig: {
      voicePatterns: [/Prabhat/i, /Ravi/i, /Google.*Hindi/i, /Daniel/i],
      rate: 0.86,
      pitch: 0.86,
    },
    premium: true,
    accent: 'Indian',
    warmth: 0.88,
    clarity: 0.95,
    poweredBy: 'sarvam',
  },
  {
    id: 'elevenlabs-nova',
    name: 'Nova',
    description: 'Ultra-natural ElevenLabs-inspired global companion voice for fluent daily support.',
    gender: 'female',
    languages: ['en', 'es', 'fr', 'de', 'pt', 'ja', 'ar', 'zh'],
    primaryLanguage: 'en',
    category: 'conversational',
    tags: ['natural', 'global', 'elevenlabs', 'empathetic'],
    previewText: 'Wherever you are in the world, this moment matters. We can move through it with clarity, kindness, and strength.',
    backendConfig: { voiceType: 'friendly', speed: 0.95, language: 'en' },
    browserConfig: {
      voicePatterns: [/Jenny/i, /Aria/i, /Google.*English/i, /Samantha/i],
      rate: 0.95,
      pitch: 1.04,
    },
    premium: true,
    accent: 'Neutral international',
    warmth: 0.9,
    clarity: 0.98,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'elevenlabs-orion',
    name: 'Orion',
    description: 'Studio-grade ElevenLabs-inspired mentor voice for storytelling and high-clarity guidance.',
    gender: 'male',
    languages: ['en', 'es', 'fr', 'de', 'pt', 'ja', 'ar', 'zh'],
    primaryLanguage: 'en',
    category: 'narration',
    tags: ['natural', 'mentor', 'elevenlabs', 'storytelling'],
    previewText: 'Take a steady breath. Every challenge can become direction when you respond from awareness instead of fear.',
    backendConfig: { voiceType: 'wisdom', speed: 0.9, language: 'en' },
    browserConfig: {
      voicePatterns: [/Guy/i, /Daniel/i, /Google.*Male/i, /Ravi/i],
      rate: 0.9,
      pitch: 0.9,
    },
    premium: true,
    accent: 'Neutral international',
    warmth: 0.84,
    clarity: 0.97,
    poweredBy: 'elevenlabs',
  },
]

export function getVoiceById(id: string): VoiceSpeaker | undefined {
  return VOICE_SPEAKERS.find(v => v.id === id)
}

export function getVoicesForLanguage(lang: VoiceLanguage): VoiceSpeaker[] {
  return VOICE_SPEAKERS.filter(v => v.languages.includes(lang))
}

export function getVoicesByCategory(category: VoiceCategory): VoiceSpeaker[] {
  return VOICE_SPEAKERS.filter(v => v.category === category)
}

export function getVoicesByGender(gender: VoiceGender): VoiceSpeaker[] {
  if (gender === 'auto') return VOICE_SPEAKERS
  return VOICE_SPEAKERS.filter(v => v.gender === gender)
}

/** Get voices powered by Sarvam AI for premium Indian language quality */
export function getSarvamVoices(): VoiceSpeaker[] {
  return VOICE_SPEAKERS.filter(v => v.poweredBy === 'sarvam')
}

/** Get the saved voice selection, or default */
export function getSavedVoice(): VoiceSpeaker {
  if (typeof window === 'undefined') return VOICE_SPEAKERS[0]
  const savedId = localStorage.getItem(STORAGE_KEY)
  if (savedId) {
    const found = getVoiceById(savedId)
    if (found) return found
  }
  return VOICE_SPEAKERS[0]
}

/** Save voice selection to localStorage */
export function saveVoiceSelection(voiceId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, voiceId)
}

/** Get the saved language preference */
export function getSavedLanguage(): VoiceLanguage {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem(LANGUAGE_KEY) as VoiceLanguage) || 'en'
}

/** Save language preference */
export function saveLanguagePreference(lang: VoiceLanguage): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANGUAGE_KEY, lang)
}

/** Map a voice to the backend language code for TTS */
export function getBackendLanguageCode(lang: VoiceLanguage): string {
  switch (lang) {
    case 'en-IN': return 'en'
    case 'sa': return 'hi'  // Sanskrit uses Hindi TTS (Sarvam AI)
    default: return lang
  }
}

/** Map a voice to the browser SpeechSynthesis language code */
export function getBrowserLanguageCode(lang: VoiceLanguage): string {
  switch (lang) {
    case 'en': return 'en-US'
    case 'en-IN': return 'en-IN'
    case 'hi': return 'hi-IN'
    case 'sa': return 'hi-IN'
    case 'ta': return 'ta-IN'
    case 'te': return 'te-IN'
    case 'bn': return 'bn-IN'
    case 'kn': return 'kn-IN'
    case 'ml': return 'ml-IN'
    case 'mr': return 'mr-IN'
    case 'gu': return 'gu-IN'
    case 'pa': return 'pa-IN'
    case 'es': return 'es-ES'
    case 'fr': return 'fr-FR'
    case 'de': return 'de-DE'
    case 'ja': return 'ja-JP'
    case 'pt': return 'pt-BR'
    case 'ar': return 'ar-SA'
    case 'zh': return 'zh-CN'
    default: return 'en-US'
  }
}

/** Get voices powered by ElevenLabs for premium international quality */
export function getElevenLabsVoices(): VoiceSpeaker[] {
  return VOICE_SPEAKERS.filter(v => v.poweredBy === 'elevenlabs')
}

/** ElevenLabs priority languages (best quality from ElevenLabs) */
export const ELEVENLABS_PRIORITY_LANGUAGES: VoiceLanguage[] = [
  'en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ar',
]

export function isElevenLabsPriorityLanguage(lang: VoiceLanguage): boolean {
  return ELEVENLABS_PRIORITY_LANGUAGES.includes(lang)
}

/** Get the best voice for a given language (considers provider priority) */
export function getBestVoiceForLanguage(lang: VoiceLanguage): VoiceSpeaker {
  const voicesForLang = getVoicesForLanguage(lang)

  if (voicesForLang.length === 0) return VOICE_SPEAKERS[0]

  // For Sarvam priority languages (Indian), prefer Sarvam-powered voices
  if (isSarvamPriorityLanguage(lang)) {
    const sarvamVoice = voicesForLang.find(v => v.poweredBy === 'sarvam')
    if (sarvamVoice) return sarvamVoice
  }

  // For ElevenLabs priority languages (international), prefer ElevenLabs
  if (isElevenLabsPriorityLanguage(lang)) {
    const elVoice = voicesForLang.find(v => v.poweredBy === 'elevenlabs')
    if (elVoice) return elVoice
  }

  return voicesForLang[0]
}

/** Get voice provider display info for UI badges */
export function getProviderDisplayInfo(provider?: VoiceProvider): {
  label: string
  color: string
  quality: string
} {
  switch (provider) {
    case 'elevenlabs':
      return { label: 'ElevenLabs HD', color: 'text-amber-400', quality: '10/10' }
    case 'sarvam':
      return { label: 'Sarvam AI', color: 'text-emerald-400', quality: '9.5/10' }
    case 'openai':
      return { label: 'OpenAI HD', color: 'text-sky-400', quality: '9.5/10' }
    case 'google':
      return { label: 'Google Neural', color: 'text-blue-400', quality: '9/10' }
    case 'edge':
      return { label: 'Neural', color: 'text-violet-400', quality: '8.5/10' }
    case 'browser':
      return { label: 'Local', color: 'text-gray-400', quality: '5/10' }
    default:
      return { label: 'Voice', color: 'text-white/40', quality: '' }
  }
}

/** Get the count of voices available for a specific language */
export function getVoiceCountForLanguage(lang: VoiceLanguage): number {
  return getVoicesForLanguage(lang).length
}
