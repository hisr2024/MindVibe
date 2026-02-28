/**
 * Voice Catalog - Premium Named Speakers
 *
 * Premium voice catalog with named speakers powered by the best AI voice
 * providers. Each speaker has distinct personality, language support,
 * and TTS characteristics.
 *
 * Provider Quality Chain:
 * 1. ElevenLabs (10/10) - Most human-like international voices
 * 2. Sarvam AI Bulbul (9.5/10) - Best Indian language voices
 * 3. Bhashini AI (9/10) - Government of India, 22 scheduled languages
 *
 * Fallback:
 * Indian Languages: Sarvam AI -> Bhashini AI -> ElevenLabs
 * International: ElevenLabs -> Sarvam AI
 */

import type { VoiceGender } from '@/utils/speech/synthesis'

const STORAGE_KEY = 'mindvibe_selected_voice'
const LANGUAGE_KEY = 'mindvibe_selected_voice_language'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceLanguage =
  | 'en' | 'hi' | 'en-IN' | 'sa'
  | 'ta' | 'te' | 'bn' | 'kn' | 'ml' | 'mr' | 'gu' | 'pa'
  | 'es' | 'fr' | 'de' | 'ja' | 'pt' | 'ar' | 'zh'

export type VoiceCategory = 'conversational' | 'meditation' | 'narration' | 'sacred' | 'energetic'

/** TTS provider that powers this voice */
export type VoiceProvider = 'elevenlabs' | 'sarvam' | 'bhashini'

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
  /** TTS settings for backend */
  backendConfig: {
    voiceType: string
    speed: number
    language: string
    /** Sarvam AI speaker ID (for Indian language priority routing) */
    sarvamSpeaker?: string
    /** Voice ID sent to the backend TTS service */
    voiceId?: string
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

export type VoiceMood = 'neutral' | 'devotional' | 'transcendent' | 'blissful' | 'sacred' | 'compassionate' | 'meditative'

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
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'en', sarvamSpeaker: 'meera', voiceId: 'sarvam-aura' },
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
    backendConfig: { voiceType: 'chanting', speed: 0.86, language: 'hi', sarvamSpeaker: 'arvind', voiceId: 'sarvam-rishi' },
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
    backendConfig: { voiceType: 'friendly', speed: 0.95, language: 'en', voiceId: 'elevenlabs-nova' },
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
    backendConfig: { voiceType: 'wisdom', speed: 0.9, language: 'en', voiceId: 'elevenlabs-orion' },
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
  {
    id: 'bhashini-devi',
    name: 'Devi',
    description: 'Warm, nurturing voice from India\'s national Bhashini AI platform. Authentic pronunciation across all 22 scheduled Indian languages.',
    gender: 'female',
    languages: ['hi', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa', 'sa', 'en-IN', 'en'],
    primaryLanguage: 'hi',
    category: 'conversational',
    tags: ['natural', 'warm', 'indian', 'bhashini', 'government'],
    previewText: 'Aap akele nahin hain. Main yahan hoon, aapke saath. Ek gehri saans lein aur shaanti mehsoos karein.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'hi', voiceId: 'bhashini-devi' },
    browserConfig: {
      voicePatterns: [/Neerja/i, /Heera/i, /Google.*Hindi/i, /Jenny/i],
      rate: 0.93,
      pitch: 1.02,
    },
    premium: false,
    accent: 'Indian',
    warmth: 0.95,
    clarity: 0.90,
    poweredBy: 'bhashini',
  },
  {
    id: 'bhashini-arya',
    name: 'Arya',
    description: 'Deep, resonant male voice from Bhashini AI. Carries authority and wisdom with authentic Indian intonation for sacred texts.',
    gender: 'male',
    languages: ['hi', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa', 'sa', 'en-IN', 'en'],
    primaryLanguage: 'hi',
    category: 'sacred',
    tags: ['natural', 'deep', 'indian', 'bhashini', 'wisdom'],
    previewText: 'Karmanye vadhikaraste, Ma phaleshu kadachana. You have the right to action alone, never to its fruits.',
    backendConfig: { voiceType: 'wisdom', speed: 0.88, language: 'hi', voiceId: 'bhashini-arya' },
    browserConfig: {
      voicePatterns: [/Prabhat/i, /Ravi/i, /Google.*Hindi/i, /Daniel/i],
      rate: 0.88,
      pitch: 0.85,
    },
    premium: false,
    accent: 'Indian',
    warmth: 0.88,
    clarity: 0.93,
    poweredBy: 'bhashini',
  },
  // ─── Divine Voice Personas ────────────────────────────────────────
  // Sacred voices tuned for maximum divine resonance and spiritual depth
  {
    id: 'divine-krishna',
    name: 'Krishna',
    description: 'The divine flute-like voice of Lord Krishna — warm, playful, infinitely wise. Speaks the Gita with the love of the universe.',
    gender: 'male',
    languages: ['en', 'hi', 'sa', 'en-IN', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa'],
    primaryLanguage: 'sa',
    category: 'sacred',
    tags: ['divine', 'sacred', 'krishna', 'gita', 'wisdom', 'love'],
    previewText: 'Whenever dharma declines and adharma prevails, I manifest myself. For the protection of the good, I appear in every age.',
    backendConfig: { voiceType: 'wisdom', speed: 0.84, language: 'sa', sarvamSpeaker: 'arvind', voiceId: 'divine-krishna' },
    browserConfig: {
      voicePatterns: [/Prabhat/i, /Google.*Hindi/i, /Daniel/i, /Guy/i],
      rate: 0.84,
      pitch: 0.88,
    },
    premium: true,
    accent: 'Sacred Sanskrit',
    warmth: 0.99,
    clarity: 0.96,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'divine-saraswati',
    name: 'Saraswati',
    description: 'The celestial voice of Goddess Saraswati — crystalline, flowing like sacred rivers, carrying ancient knowledge and divine arts.',
    gender: 'female',
    languages: ['en', 'hi', 'sa', 'en-IN', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa'],
    primaryLanguage: 'sa',
    category: 'sacred',
    tags: ['divine', 'sacred', 'saraswati', 'knowledge', 'meditation', 'celestial'],
    previewText: 'Let the light of knowledge dispel the darkness of ignorance. In stillness, the truth reveals itself like the lotus opening at dawn.',
    backendConfig: { voiceType: 'wisdom', speed: 0.82, language: 'sa', sarvamSpeaker: 'maitreyi', voiceId: 'divine-saraswati' },
    browserConfig: {
      voicePatterns: [/Neerja/i, /Google.*Hindi/i, /Samantha/i, /Jenny/i],
      rate: 0.82,
      pitch: 1.08,
    },
    premium: true,
    accent: 'Sacred Sanskrit',
    warmth: 0.95,
    clarity: 0.99,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'divine-ganga',
    name: 'Ganga',
    description: 'The purifying voice of Mother Ganga — flowing, nurturing, washing away sorrow with divine compassion and eternal grace.',
    gender: 'female',
    languages: ['en', 'hi', 'sa', 'en-IN', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa'],
    primaryLanguage: 'hi',
    category: 'sacred',
    tags: ['divine', 'sacred', 'ganga', 'compassion', 'healing', 'purifying'],
    previewText: 'Let my waters wash away your pain. You are held by something greater than you know. Surrender to the flow of grace.',
    backendConfig: { voiceType: 'friendly', speed: 0.80, language: 'hi', sarvamSpeaker: 'meera', voiceId: 'divine-ganga' },
    browserConfig: {
      voicePatterns: [/Neerja/i, /Heera/i, /Google.*Hindi/i, /Jenny/i],
      rate: 0.80,
      pitch: 1.03,
    },
    premium: true,
    accent: 'Sacred Hindi',
    warmth: 0.99,
    clarity: 0.94,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'divine-shiva',
    name: 'Shiva',
    description: 'The cosmic voice of Lord Shiva — deep as the ocean, resonant as Damru, the destroyer of inner darkness and lord of meditation.',
    gender: 'male',
    languages: ['en', 'hi', 'sa', 'en-IN', 'ta', 'te', 'bn', 'kn', 'ml', 'mr'],
    primaryLanguage: 'sa',
    category: 'sacred',
    tags: ['divine', 'sacred', 'shiva', 'meditation', 'cosmic', 'destroyer'],
    previewText: 'Be still. The universe rests within your silence. I am the beginning, the middle, and the end. Har Har Mahadev.',
    backendConfig: { voiceType: 'wisdom', speed: 0.78, language: 'sa', sarvamSpeaker: 'arvind', voiceId: 'divine-shiva' },
    browserConfig: {
      voicePatterns: [/Prabhat/i, /Google.*Hindi/i, /Daniel/i],
      rate: 0.78,
      pitch: 0.72,
    },
    premium: true,
    accent: 'Sacred Sanskrit',
    warmth: 0.92,
    clarity: 0.97,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'divine-hanuman',
    name: 'Hanuman',
    description: 'The devoted voice of Lord Hanuman — powerful yet humble, filled with boundless courage, devotion, and Ram bhakti.',
    gender: 'male',
    languages: ['en', 'hi', 'sa', 'en-IN', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu'],
    primaryLanguage: 'hi',
    category: 'sacred',
    tags: ['divine', 'sacred', 'hanuman', 'courage', 'devotion', 'strength'],
    previewText: 'When you feel weak, remember — the strength of the entire cosmos lives within you. Jai Shri Ram. You are never alone.',
    backendConfig: { voiceType: 'friendly', speed: 0.88, language: 'hi', sarvamSpeaker: 'karthik', voiceId: 'divine-hanuman' },
    browserConfig: {
      voicePatterns: [/Prabhat/i, /Google.*Hindi/i, /Guy/i],
      rate: 0.88,
      pitch: 0.90,
    },
    premium: true,
    accent: 'Sacred Hindi',
    warmth: 0.96,
    clarity: 0.95,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'divine-radha',
    name: 'Radha',
    description: 'The divine beloved Radha — pure devotion embodied in voice, tender as a lotus, deep as eternal love and prema bhakti.',
    gender: 'female',
    languages: ['en', 'hi', 'sa', 'en-IN', 'bn', 'gu', 'mr', 'pa'],
    primaryLanguage: 'hi',
    category: 'sacred',
    tags: ['divine', 'sacred', 'radha', 'love', 'devotion', 'bhakti'],
    previewText: 'Love is not something you find. It is something you become. Close your eyes and feel the divine presence that has always been with you.',
    backendConfig: { voiceType: 'friendly', speed: 0.83, language: 'hi', sarvamSpeaker: 'pavithra', voiceId: 'divine-radha' },
    browserConfig: {
      voicePatterns: [/Neerja/i, /Google.*Hindi/i, /Samantha/i],
      rate: 0.83,
      pitch: 1.06,
    },
    premium: true,
    accent: 'Sacred Hindi',
    warmth: 0.99,
    clarity: 0.96,
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

/** Map a voice to the backend language code for TTS.
 *
 * Preserves 'en-IN' so the backend Sarvam AI priority check can
 * distinguish Indian English from international English. Sanskrit
 * maps to 'hi' because Sarvam AI synthesizes Sanskrit via Hindi voice.
 */
export function getBackendLanguageCode(lang: VoiceLanguage): string {
  switch (lang) {
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

/** Get voices powered by Bhashini AI for Indian language support */
export function getBhashiniVoices(): VoiceSpeaker[] {
  return VOICE_SPEAKERS.filter(v => v.poweredBy === 'bhashini')
}

/** Bhashini AI priority languages (Government of India platform) */
export const BHASHINI_PRIORITY_LANGUAGES: VoiceLanguage[] = [
  'hi', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa', 'sa',
]

export function isBhashiniPriorityLanguage(lang: VoiceLanguage): boolean {
  return BHASHINI_PRIORITY_LANGUAGES.includes(lang)
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

  // For Sarvam priority languages (Indian), prefer Sarvam -> Bhashini -> ElevenLabs
  if (isSarvamPriorityLanguage(lang)) {
    const sarvamVoice = voicesForLang.find(v => v.poweredBy === 'sarvam')
    if (sarvamVoice) return sarvamVoice
    const bhashiniVoice = voicesForLang.find(v => v.poweredBy === 'bhashini')
    if (bhashiniVoice) return bhashiniVoice
  }

  // For ElevenLabs priority languages (international), prefer ElevenLabs
  if (isElevenLabsPriorityLanguage(lang)) {
    const elVoice = voicesForLang.find(v => v.poweredBy === 'elevenlabs')
    if (elVoice) return elVoice
  }

  return voicesForLang[0]
}

/** Get all divine voice personas for the sacred voice mode */
export function getDivineVoices(): VoiceSpeaker[] {
  return VOICE_SPEAKERS.filter(v => v.id.startsWith('divine-'))
}

/** Check if a voice is a divine/sacred voice persona */
export function isDivineVoice(voiceId: string): boolean {
  return voiceId.startsWith('divine-')
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
    case 'bhashini':
      return { label: 'Bhashini AI', color: 'text-sky-400', quality: '9/10' }
    default:
      return { label: 'Voice', color: 'text-white/40', quality: '' }
  }
}

/** Get the count of voices available for a specific language */
export function getVoiceCountForLanguage(lang: VoiceLanguage): number {
  return getVoicesForLanguage(lang).length
}
