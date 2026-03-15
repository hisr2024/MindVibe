/**
 * Voice Catalog - Premium Named Speakers
 *
 * Premium voice catalog with named speakers powered by the best AI voice
 * providers. Each speaker has distinct personality, language support,
 * and TTS characteristics.
 *
 * Provider Quality Chain:
 * 1. ElevenLabs (10/10) - Most human-like international voices
 * 2. Sarvam AI Bulbul v2 (9.7/10) - Best Indian language voices
 * 3. Edge TTS (8.8/10) - Free Microsoft Neural voices
 *
 * Fallback:
 * Indian Languages: Sarvam AI -> ElevenLabs -> Edge TTS
 * International: ElevenLabs -> Sarvam AI -> Edge TTS
 */

import type { VoiceGender } from '@/utils/speech/synthesis'

const STORAGE_KEY = 'mindvibe_selected_voice'
const LANGUAGE_KEY = 'mindvibe_selected_voice_language'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceLanguage =
  | 'en' | 'hi' | 'en-IN' | 'sa'
  | 'ta' | 'te' | 'bn' | 'kn' | 'ml' | 'mr' | 'gu' | 'pa'
  | 'es' | 'fr' | 'de' | 'ja' | 'pt' | 'ar' | 'zh'
  | 'ko' | 'it' | 'ru' | 'tr' | 'th' | 'vi' | 'id'
  | 'nl' | 'pl' | 'sv' | 'sw'

export type VoiceCategory = 'conversational' | 'meditation' | 'narration' | 'sacred' | 'energetic'

/** TTS provider that powers this voice */
export type VoiceProvider = 'elevenlabs' | 'sarvam' | 'edge_tts'

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
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
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
    backendConfig: { voiceType: 'wisdom', speed: 0.84, language: 'sa', sarvamSpeaker: 'abhilash', voiceId: 'divine-krishna' },
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
  // ─── Multilingual Natural Voices ──────────────────────────────────
  // Inspired by the most natural voices across Siri, Alexa, Google
  // Each voice tuned for maximum naturalness in its primary languages
  {
    id: 'elevenlabs-aria',
    name: 'Aria',
    description: 'Warm, natural European voice. Fluent across Italian, Dutch, Swedish, Polish — like a caring friend from the heart of Europe.',
    gender: 'female',
    languages: ['en', 'it', 'nl', 'sv', 'pl', 'de', 'fr'],
    primaryLanguage: 'it',
    category: 'conversational',
    tags: ['natural', 'european', 'multilingual', 'warm', 'italian'],
    previewText: 'Every moment of stillness is a gift you give yourself. Let me be here with you as you find your center.',
    backendConfig: { voiceType: 'friendly', speed: 0.95, language: 'it', voiceId: 'elevenlabs-aria' },
    browserConfig: {
      voicePatterns: [/Google.*Italian/i, /Federica/i, /Alice/i, /Jenny/i],
      rate: 0.95,
      pitch: 1.04,
    },
    premium: true,
    accent: 'European',
    warmth: 0.94,
    clarity: 0.96,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'elevenlabs-matilda',
    name: 'Matilda',
    description: 'Gentle, reassuring voice with exceptional clarity. Native quality across Korean, Japanese, Thai — the voice of East Asian calm.',
    gender: 'female',
    languages: ['en', 'ko', 'ja', 'th', 'vi', 'zh'],
    primaryLanguage: 'ko',
    category: 'meditation',
    tags: ['natural', 'asian', 'multilingual', 'gentle', 'korean'],
    previewText: 'Close your eyes gently. The peace you are searching for has been waiting inside you all along.',
    backendConfig: { voiceType: 'calm', speed: 0.92, language: 'ko', voiceId: 'elevenlabs-matilda' },
    browserConfig: {
      voicePatterns: [/Google.*Korean/i, /Google.*Japanese/i, /Yuna/i, /Samantha/i],
      rate: 0.92,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Neutral Asian',
    warmth: 0.95,
    clarity: 0.98,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'elevenlabs-fin',
    name: 'Fin',
    description: 'Thoughtful, poetic voice with natural warmth. Excellent across Russian, Turkish, and Slavic languages — wisdom with depth.',
    gender: 'male',
    languages: ['en', 'ru', 'tr', 'pl', 'sv', 'nl'],
    primaryLanguage: 'ru',
    category: 'narration',
    tags: ['natural', 'slavic', 'multilingual', 'thoughtful', 'russian'],
    previewText: 'Strength is not found in force. It is found in the stillness that comes from knowing who you truly are.',
    backendConfig: { voiceType: 'wisdom', speed: 0.92, language: 'ru', voiceId: 'elevenlabs-fin' },
    browserConfig: {
      voicePatterns: [/Google.*Russian/i, /Google.*Turkish/i, /Dmitry/i, /Daniel/i],
      rate: 0.92,
      pitch: 0.92,
    },
    premium: true,
    accent: 'European',
    warmth: 0.88,
    clarity: 0.96,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'elevenlabs-charlotte',
    name: 'Charlotte',
    description: 'Serene Scandinavian voice — naturally calm, clear as Nordic waters. The most soothing voice for sleep and deep meditation.',
    gender: 'female',
    languages: ['en', 'sv', 'nl', 'de', 'fr', 'it'],
    primaryLanguage: 'sv',
    category: 'meditation',
    tags: ['natural', 'scandinavian', 'serene', 'sleep', 'swedish'],
    previewText: 'Breathe in deeply. Feel the warmth filling your chest. You are safe. You are held. Let everything else fall away.',
    backendConfig: { voiceType: 'soothing', speed: 0.88, language: 'sv', voiceId: 'elevenlabs-charlotte' },
    browserConfig: {
      voicePatterns: [/Google.*Swedish/i, /Alva/i, /Samantha/i, /Jenny/i],
      rate: 0.88,
      pitch: 1.02,
    },
    premium: true,
    accent: 'Scandinavian',
    warmth: 0.97,
    clarity: 0.95,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'elevenlabs-liam',
    name: 'Liam',
    description: 'Grounded, reliable voice with fluid multilingual delivery. Natural across Indonesian, Vietnamese, Swahili — a global companion.',
    gender: 'male',
    languages: ['en', 'id', 'vi', 'sw', 'th', 'ko', 'tr'],
    primaryLanguage: 'id',
    category: 'conversational',
    tags: ['natural', 'global', 'multilingual', 'grounded', 'indonesian'],
    previewText: 'No matter where you are, you carry within you everything you need. Let me walk beside you on this journey.',
    backendConfig: { voiceType: 'friendly', speed: 0.95, language: 'id', voiceId: 'elevenlabs-liam' },
    browserConfig: {
      voicePatterns: [/Google.*Indonesian/i, /Google.*Vietnamese/i, /Guy/i, /Daniel/i],
      rate: 0.95,
      pitch: 0.95,
    },
    premium: true,
    accent: 'Neutral global',
    warmth: 0.90,
    clarity: 0.94,
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
  try {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (savedId) {
      const found = getVoiceById(savedId)
      if (found) return found
    }
  } catch {
    // localStorage unavailable (private browsing, SecurityError)
  }
  return VOICE_SPEAKERS[0]
}

/** Save voice selection to localStorage */
export function saveVoiceSelection(voiceId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, voiceId)
  } catch {
    // localStorage unavailable (private browsing, QuotaExceeded)
  }
}

/** Get the saved language preference */
export function getSavedLanguage(): VoiceLanguage {
  if (typeof window === 'undefined') return 'en'
  try {
    return (localStorage.getItem(LANGUAGE_KEY) as VoiceLanguage) || 'en'
  } catch {
    return 'en'
  }
}

/** Save language preference */
export function saveLanguagePreference(lang: VoiceLanguage): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LANGUAGE_KEY, lang)
  } catch {
    // localStorage unavailable (private browsing, QuotaExceeded)
  }
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
    case 'ko': return 'ko-KR'
    case 'it': return 'it-IT'
    case 'ru': return 'ru-RU'
    case 'tr': return 'tr-TR'
    case 'th': return 'th-TH'
    case 'vi': return 'vi-VN'
    case 'id': return 'id-ID'
    case 'nl': return 'nl-NL'
    case 'pl': return 'pl-PL'
    case 'sv': return 'sv-SE'
    case 'sw': return 'sw-KE'
    default: return 'en-US'
  }
}

/** Get voices powered by ElevenLabs for premium international quality */
export function getElevenLabsVoices(): VoiceSpeaker[] {
  return VOICE_SPEAKERS.filter(v => v.poweredBy === 'elevenlabs')
}

/** ElevenLabs priority languages (best quality from ElevenLabs) */
export const ELEVENLABS_PRIORITY_LANGUAGES: VoiceLanguage[] = [
  'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'sv', 'ru',
  'ja', 'zh', 'ko', 'th', 'vi', 'id', 'ar', 'tr', 'sw',
]

export function isElevenLabsPriorityLanguage(lang: VoiceLanguage): boolean {
  return ELEVENLABS_PRIORITY_LANGUAGES.includes(lang)
}

/** Get the best voice for a given language (considers provider priority) */
export function getBestVoiceForLanguage(lang: VoiceLanguage): VoiceSpeaker {
  const voicesForLang = getVoicesForLanguage(lang)

  if (voicesForLang.length === 0) return VOICE_SPEAKERS[0]

  // For Sarvam priority languages (Indian), prefer Sarvam -> ElevenLabs -> Edge TTS
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
      return { label: 'Sarvam AI v2', color: 'text-emerald-400', quality: '9.7/10' }
    case 'edge_tts':
      return { label: 'Edge TTS', color: 'text-sky-400', quality: '8.8/10' }
    default:
      return { label: 'Voice', color: 'text-white/70', quality: '' }
  }
}

/** Get the count of voices available for a specific language */
export function getVoiceCountForLanguage(lang: VoiceLanguage): number {
  return getVoicesForLanguage(lang).length
}
