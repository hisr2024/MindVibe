/**
 * Voice Catalog - Premium Named Speakers
 *
 * ElevenLabs-inspired voice catalog with named speakers, each with distinct
 * personality, language support, and TTS characteristics. Maps to both
 * backend (Sarvam AI / Google Neural2) and browser SpeechSynthesis fallback.
 */

import type { VoiceGender } from '@/utils/speech/synthesis'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceLanguage =
  | 'en' | 'hi' | 'en-IN' | 'sa'
  | 'es' | 'fr' | 'de' | 'ja' | 'pt' | 'ar' | 'zh'

export type VoiceCategory = 'conversational' | 'meditation' | 'narration' | 'sacred' | 'energetic'

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
}

export interface VoiceLanguageInfo {
  code: VoiceLanguage
  name: string
  nativeName: string
  flag: string
}

// ─── Supported Languages ──────────────────────────────────────────────────────

export const VOICE_LANGUAGES: VoiceLanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'en-IN', name: 'Indian English', nativeName: 'Indian English', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🕉️' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
]

// ─── Voice Speakers Catalog ───────────────────────────────────────────────────

export const VOICE_SPEAKERS: VoiceSpeaker[] = [
  // ─── English Voices ───────────────────────────────────────
  {
    id: 'priya',
    name: 'Priya',
    description: 'Warm and nurturing. Like a wise older sister who always knows what to say.',
    gender: 'female',
    languages: ['en', 'en-IN', 'hi'],
    primaryLanguage: 'en-IN',
    category: 'conversational',
    tags: ['default', 'warm', 'natural', 'indian'],
    previewText: 'Hey friend, I am so glad you are here. Let us take a moment together, just you and me. Whatever is on your mind, I am listening.',
    backendConfig: { voiceType: 'friendly', speed: 0.95, language: 'en' },
    browserConfig: {
      voicePatterns: [/Neerja/i, /Heera/i, /Google.*English/i, /Jenny/i, /Samantha/i],
      rate: 0.94,
      pitch: 1.05,
    },
    premium: false,
    accent: 'Indian English',
    warmth: 0.95,
    clarity: 0.9,
  },
  {
    id: 'ananya',
    name: 'Ananya',
    description: 'Gentle and ethereal. A meditation guide whose voice melts away tension.',
    gender: 'female',
    languages: ['en', 'en-IN', 'hi', 'sa'],
    primaryLanguage: 'en',
    category: 'meditation',
    tags: ['calm', 'soothing', 'meditation', 'spiritual'],
    previewText: 'Close your eyes gently. Feel the breath flowing in, and flowing out. In this moment, you are exactly where you need to be.',
    backendConfig: { voiceType: 'calm', speed: 0.85, language: 'en' },
    browserConfig: {
      voicePatterns: [/Samantha/i, /Moira/i, /Karen/i, /Google.*Female/i],
      rate: 0.82,
      pitch: 0.95,
    },
    premium: true,
    accent: 'Soft, neutral',
    warmth: 1.0,
    clarity: 0.85,
  },
  {
    id: 'arjun',
    name: 'Arjun',
    description: 'Deep and resonant. A wise elder sharing ancient truths with quiet authority.',
    gender: 'male',
    languages: ['en', 'en-IN', 'hi', 'sa'],
    primaryLanguage: 'en-IN',
    category: 'narration',
    tags: ['deep', 'wise', 'authoritative', 'divine'],
    previewText: 'Dear one, the greatest warrior who ever lived once sat down and said he could not go on. Courage is not the absence of doubt. It is moving forward despite it.',
    backendConfig: { voiceType: 'divine', speed: 0.88, language: 'en' },
    browserConfig: {
      voicePatterns: [/Ravi/i, /Prabhat/i, /Daniel/i, /Guy/i, /Google.*Male/i],
      rate: 0.88,
      pitch: 0.85,
    },
    premium: true,
    accent: 'Indian English',
    warmth: 0.85,
    clarity: 0.95,
  },
  {
    id: 'devi',
    name: 'Devi',
    description: 'Strong and inspiring. A powerful voice that lifts you up and ignites courage.',
    gender: 'female',
    languages: ['en', 'en-IN'],
    primaryLanguage: 'en',
    category: 'energetic',
    tags: ['powerful', 'inspiring', 'confident', 'motivational'],
    previewText: 'You are stronger than you think. The fire inside you has never gone out, it has only been waiting for you to believe in it again. Rise, dear friend.',
    backendConfig: { voiceType: 'wisdom', speed: 0.95, language: 'en' },
    browserConfig: {
      voicePatterns: [/Aria/i, /Jenny/i, /Zira/i, /Google.*English/i],
      rate: 0.96,
      pitch: 1.1,
    },
    premium: false,
    accent: 'Clear, international',
    warmth: 0.8,
    clarity: 0.95,
  },
  {
    id: 'ravi',
    name: 'Ravi',
    description: 'Calm and scholarly. A patient teacher who explains even the deepest truths simply.',
    gender: 'male',
    languages: ['en', 'en-IN', 'hi'],
    primaryLanguage: 'en',
    category: 'narration',
    tags: ['calm', 'scholarly', 'patient', 'teacher'],
    previewText: 'Let me share something beautiful with you. In the ancient wisdom, it is said that the soul can never be destroyed. Not by fire, not by water. You are eternal, my friend.',
    backendConfig: { voiceType: 'wisdom', speed: 0.9, language: 'en' },
    browserConfig: {
      voicePatterns: [/David/i, /Mark/i, /Ryan/i, /Google.*Male/i, /Daniel/i],
      rate: 0.9,
      pitch: 0.95,
    },
    premium: false,
    accent: 'Neutral English',
    warmth: 0.85,
    clarity: 0.92,
  },
  {
    id: 'maya',
    name: 'Maya',
    description: 'Bright and playful. A spirited friend who makes wisdom feel fun and approachable.',
    gender: 'female',
    languages: ['en'],
    primaryLanguage: 'en',
    category: 'conversational',
    tags: ['bright', 'playful', 'energetic', 'friendly'],
    previewText: 'Oh hey! You know what? The fact that you showed up today says so much about you. Let us make today count. What is on your mind?',
    backendConfig: { voiceType: 'friendly', speed: 1.0, language: 'en' },
    browserConfig: {
      voicePatterns: [/Jenny/i, /Libby/i, /Emily/i, /Google.*English/i, /Samantha/i],
      rate: 1.0,
      pitch: 1.12,
    },
    premium: false,
    accent: 'American English',
    warmth: 0.88,
    clarity: 0.9,
  },

  // ─── Hindi Voices ─────────────────────────────────────────
  {
    id: 'kavya',
    name: 'Kavya',
    description: 'Pure Hindi with melodic warmth. Like hearing wisdom from your own mother.',
    gender: 'female',
    languages: ['hi', 'en-IN', 'sa'],
    primaryLanguage: 'hi',
    category: 'conversational',
    tags: ['hindi', 'warm', 'melodic', 'natural'],
    previewText: 'Mere pyaare dost, aap yahan aaye, yahi sabse bada kadam hai. Chaliye, saath mein ek nayi shuruaat karte hain.',
    backendConfig: { voiceType: 'friendly', speed: 0.92, language: 'hi' },
    browserConfig: {
      voicePatterns: [/Heera/i, /Neerja/i, /Google.*Hindi/i, /Hindi.*Female/i],
      rate: 0.92,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Shudh Hindi',
    warmth: 0.95,
    clarity: 0.88,
  },
  {
    id: 'vikram',
    name: 'Vikram',
    description: 'Rich Hindi baritone. A storyteller with the gravitas of ancient reciters.',
    gender: 'male',
    languages: ['hi', 'en-IN', 'sa'],
    primaryLanguage: 'hi',
    category: 'narration',
    tags: ['hindi', 'deep', 'storyteller', 'rich'],
    previewText: 'Suniye dost, Geeta mein ek bahut sundar shlok hai. Jab jab dharm ki haani hoti hai, tab tab bhagwan aate hain. Aap akele nahin hain.',
    backendConfig: { voiceType: 'divine', speed: 0.88, language: 'hi' },
    browserConfig: {
      voicePatterns: [/Prabhat/i, /Ravi/i, /Google.*Hindi/i, /Hindi.*Male/i],
      rate: 0.88,
      pitch: 0.88,
    },
    premium: true,
    accent: 'Shudh Hindi',
    warmth: 0.85,
    clarity: 0.9,
  },

  // ─── Indian English Voices ────────────────────────────────
  {
    id: 'meera',
    name: 'Meera',
    description: 'Warm Indian accent with natural grace. Wisdom feels like home in her voice.',
    gender: 'female',
    languages: ['en-IN', 'en', 'hi'],
    primaryLanguage: 'en-IN',
    category: 'conversational',
    tags: ['indian-english', 'warm', 'natural', 'graceful'],
    previewText: 'You know, dear friend, there is this beautiful idea in our tradition. Every challenge is just the universe preparing you for something greater.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'en' },
    browserConfig: {
      voicePatterns: [/Neerja/i, /Heera/i, /Google.*English.*India/i, /Google.*English/i],
      rate: 0.93,
      pitch: 1.06,
    },
    premium: false,
    accent: 'Indian English',
    warmth: 0.93,
    clarity: 0.88,
  },
  {
    id: 'rohan',
    name: 'Rohan',
    description: 'Confident and articulate. A modern voice bridging ancient wisdom and today.',
    gender: 'male',
    languages: ['en-IN', 'en', 'hi'],
    primaryLanguage: 'en-IN',
    category: 'narration',
    tags: ['indian-english', 'confident', 'modern', 'articulate'],
    previewText: 'Look, here is the thing. The Gita is not just philosophy. It is a conversation between two friends during the most difficult moment of their lives. That is exactly what we are doing now.',
    backendConfig: { voiceType: 'wisdom', speed: 0.92, language: 'en' },
    browserConfig: {
      voicePatterns: [/Ravi/i, /Prabhat/i, /Google.*Male/i, /Daniel/i],
      rate: 0.92,
      pitch: 0.92,
    },
    premium: false,
    accent: 'Indian English',
    warmth: 0.82,
    clarity: 0.93,
  },

  // ─── Sacred Voice ─────────────────────────────────────────
  {
    id: 'krishna',
    name: 'Krishna',
    description: 'Sacred chanting voice. For Sanskrit verses, shlokas, and divine recitation.',
    gender: 'male',
    languages: ['sa', 'hi', 'en-IN'],
    primaryLanguage: 'sa',
    category: 'sacred',
    tags: ['sanskrit', 'chanting', 'sacred', 'divine', 'shloka'],
    previewText: 'Karmanye vadhikaraste, Ma phaleshu kadachana. Ma karma phala hetur bhur, Ma te sangostvakarmani.',
    backendConfig: { voiceType: 'chanting', speed: 0.82, language: 'hi' },
    browserConfig: {
      voicePatterns: [/Prabhat/i, /Ravi/i, /Google.*Hindi/i, /Daniel/i],
      rate: 0.78,
      pitch: 0.8,
    },
    premium: true,
    accent: 'Vedic Sanskrit',
    warmth: 0.9,
    clarity: 0.95,
  },

  // ─── International Voices ─────────────────────────────────
  {
    id: 'sophia',
    name: 'Sophia',
    description: 'Crystal-clear international voice. Precise, empathetic, and universally understood.',
    gender: 'female',
    languages: ['en', 'es', 'fr', 'de', 'pt'],
    primaryLanguage: 'en',
    category: 'conversational',
    tags: ['international', 'clear', 'multilingual', 'precise'],
    previewText: 'Welcome, dear friend. Wherever you are in the world, wisdom speaks one language, and that is the language of the heart.',
    backendConfig: { voiceType: 'friendly', speed: 0.95, language: 'en' },
    browserConfig: {
      voicePatterns: [/Google.*English/i, /Jenny/i, /Aria/i, /Samantha/i],
      rate: 0.95,
      pitch: 1.05,
    },
    premium: false,
    accent: 'Neutral international',
    warmth: 0.85,
    clarity: 0.98,
  },
]

// ─── Default voice ────────────────────────────────────────────────────────────

export const DEFAULT_VOICE_ID = 'priya'

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'mindvibe_selected_voice'
const LANGUAGE_KEY = 'mindvibe_voice_language'

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
