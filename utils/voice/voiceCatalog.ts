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
  // ─── English Voices ───────────────────────────────────────
  {
    id: 'priya',
    name: 'Priya',
    description: 'Warm and nurturing. Like a wise older sister who always knows what to say.',
    gender: 'female',
    languages: ['en', 'en-IN', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'pa', 'sa'],
    primaryLanguage: 'en-IN',
    category: 'conversational',
    tags: ['default', 'warm', 'natural', 'indian', 'sarvam'],
    previewText: 'Hey friend, I am so glad you are here. Let us take a moment together, just you and me. Whatever is on your mind, I am listening.',
    backendConfig: { voiceType: 'friendly', speed: 0.95, language: 'en', sarvamSpeaker: 'meera' },
    browserConfig: {
      voicePatterns: [/Neerja/i, /Heera/i, /Google.*English/i, /Jenny/i, /Samantha/i],
      rate: 0.94,
      pitch: 1.05,
    },
    premium: false,
    accent: 'Indian English',
    warmth: 0.95,
    clarity: 0.9,
    poweredBy: 'sarvam',
  },
  {
    id: 'ananya',
    name: 'Ananya',
    description: 'Gentle and ethereal. A meditation guide whose voice melts away tension.',
    gender: 'female',
    languages: ['en', 'en-IN', 'hi', 'sa', 'ta', 'te', 'bn', 'kn', 'ml'],
    primaryLanguage: 'en',
    category: 'meditation',
    tags: ['calm', 'soothing', 'meditation', 'spiritual', 'sarvam'],
    previewText: 'Close your eyes gently. Feel the breath flowing in, and flowing out. In this moment, you are exactly where you need to be.',
    backendConfig: { voiceType: 'calm', speed: 0.85, language: 'en', sarvamSpeaker: 'maitreyi' },
    browserConfig: {
      voicePatterns: [/Samantha/i, /Moira/i, /Karen/i, /Google.*Female/i],
      rate: 0.82,
      pitch: 0.95,
    },
    premium: true,
    accent: 'Soft, neutral',
    warmth: 1.0,
    clarity: 0.85,
    poweredBy: 'sarvam',
  },
  {
    id: 'arjun',
    name: 'Arjun',
    description: 'Deep and resonant. A wise elder sharing ancient truths with quiet authority.',
    gender: 'male',
    languages: ['en', 'en-IN', 'hi', 'sa', 'ta', 'te', 'bn', 'mr'],
    primaryLanguage: 'en-IN',
    category: 'narration',
    tags: ['deep', 'wise', 'authoritative', 'divine', 'sarvam'],
    previewText: 'Dear one, the greatest warrior who ever lived once sat down and said he could not go on. Courage is not the absence of doubt. It is moving forward despite it.',
    backendConfig: { voiceType: 'divine', speed: 0.88, language: 'en', sarvamSpeaker: 'arvind' },
    browserConfig: {
      voicePatterns: [/Ravi/i, /Prabhat/i, /Daniel/i, /Guy/i, /Google.*Male/i],
      rate: 0.88,
      pitch: 0.85,
    },
    premium: true,
    accent: 'Indian English',
    warmth: 0.85,
    clarity: 0.95,
    poweredBy: 'sarvam',
  },
  {
    id: 'devi',
    name: 'Devi',
    description: 'Strong and inspiring. A powerful voice that lifts you up and ignites courage.',
    gender: 'female',
    languages: ['en', 'en-IN', 'hi', 'ta', 'te', 'kn', 'ml'],
    primaryLanguage: 'en',
    category: 'energetic',
    tags: ['powerful', 'inspiring', 'confident', 'motivational', 'sarvam'],
    previewText: 'You are stronger than you think. The fire inside you has never gone out, it has only been waiting for you to believe in it again. Rise, dear friend.',
    backendConfig: { voiceType: 'wisdom', speed: 0.95, language: 'en', sarvamSpeaker: 'pavithra' },
    browserConfig: {
      voicePatterns: [/Aria/i, /Jenny/i, /Zira/i, /Google.*English/i],
      rate: 0.96,
      pitch: 1.1,
    },
    premium: false,
    accent: 'Clear, international',
    warmth: 0.8,
    clarity: 0.95,
    poweredBy: 'sarvam',
  },
  {
    id: 'ravi',
    name: 'Ravi',
    description: 'Calm and scholarly. A patient teacher who explains even the deepest truths simply.',
    gender: 'male',
    languages: ['en', 'en-IN', 'hi', 'ta', 'te', 'kn', 'ml'],
    primaryLanguage: 'en',
    category: 'narration',
    tags: ['calm', 'scholarly', 'patient', 'teacher', 'sarvam'],
    previewText: 'Let me share something beautiful with you. In the ancient wisdom, it is said that the soul can never be destroyed. Not by fire, not by water. You are eternal, my friend.',
    backendConfig: { voiceType: 'wisdom', speed: 0.9, language: 'en', sarvamSpeaker: 'karthik' },
    browserConfig: {
      voicePatterns: [/David/i, /Mark/i, /Ryan/i, /Google.*Male/i, /Daniel/i],
      rate: 0.9,
      pitch: 0.95,
    },
    premium: false,
    accent: 'Neutral English',
    warmth: 0.85,
    clarity: 0.92,
    poweredBy: 'sarvam',
  },
  {
    id: 'maya',
    name: 'Maya',
    description: 'Bright and playful. A spirited friend who makes wisdom feel fun and approachable.',
    gender: 'female',
    languages: ['en', 'en-IN', 'hi'],
    primaryLanguage: 'en',
    category: 'conversational',
    tags: ['bright', 'playful', 'energetic', 'friendly'],
    previewText: 'Oh hey! You know what? The fact that you showed up today says so much about you. Let us make today count. What is on your mind?',
    backendConfig: { voiceType: 'friendly', speed: 1.0, language: 'en', sarvamSpeaker: 'pavithra' },
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

  // ─── Hindi Voices (Sarvam AI Powered) ──────────────────────
  {
    id: 'kavya',
    name: 'Kavya',
    description: 'Pure Hindi with melodic warmth. Like hearing wisdom from your own mother.',
    gender: 'female',
    languages: ['hi', 'en-IN', 'sa', 'mr', 'gu', 'pa', 'bn'],
    primaryLanguage: 'hi',
    category: 'conversational',
    tags: ['hindi', 'warm', 'melodic', 'natural', 'sarvam'],
    previewText: 'Mere pyaare dost, aap yahan aaye, yahi sabse bada kadam hai. Chaliye, saath mein ek nayi shuruaat karte hain.',
    backendConfig: { voiceType: 'friendly', speed: 0.92, language: 'hi', sarvamSpeaker: 'meera' },
    browserConfig: {
      voicePatterns: [/Heera/i, /Neerja/i, /Google.*Hindi/i, /Hindi.*Female/i],
      rate: 0.92,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Shudh Hindi',
    warmth: 0.95,
    clarity: 0.88,
    poweredBy: 'sarvam',
  },
  {
    id: 'vikram',
    name: 'Vikram',
    description: 'Rich Hindi baritone. A storyteller with the gravitas of ancient reciters.',
    gender: 'male',
    languages: ['hi', 'en-IN', 'sa', 'mr', 'bn', 'ta', 'te'],
    primaryLanguage: 'hi',
    category: 'narration',
    tags: ['hindi', 'deep', 'storyteller', 'rich', 'sarvam'],
    previewText: 'Suniye dost, Geeta mein ek bahut sundar shlok hai. Jab jab dharm ki haani hoti hai, tab tab bhagwan aate hain. Aap akele nahin hain.',
    backendConfig: { voiceType: 'divine', speed: 0.88, language: 'hi', sarvamSpeaker: 'arvind' },
    browserConfig: {
      voicePatterns: [/Prabhat/i, /Ravi/i, /Google.*Hindi/i, /Hindi.*Male/i],
      rate: 0.88,
      pitch: 0.88,
    },
    premium: true,
    accent: 'Shudh Hindi',
    warmth: 0.85,
    clarity: 0.9,
    poweredBy: 'sarvam',
  },

  // ─── Indian English Voices ────────────────────────────────
  {
    id: 'meera',
    name: 'Meera',
    description: 'Warm Indian accent with natural grace. Wisdom feels like home in her voice.',
    gender: 'female',
    languages: ['en-IN', 'en', 'hi', 'mr', 'gu', 'pa', 'bn'],
    primaryLanguage: 'en-IN',
    category: 'conversational',
    tags: ['indian-english', 'warm', 'natural', 'graceful', 'sarvam'],
    previewText: 'You know, dear friend, there is this beautiful idea in our tradition. Every challenge is just the universe preparing you for something greater.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'en', sarvamSpeaker: 'meera' },
    browserConfig: {
      voicePatterns: [/Neerja/i, /Heera/i, /Google.*English.*India/i, /Google.*English/i],
      rate: 0.93,
      pitch: 1.06,
    },
    premium: false,
    accent: 'Indian English',
    warmth: 0.93,
    clarity: 0.88,
    poweredBy: 'sarvam',
  },
  {
    id: 'rohan',
    name: 'Rohan',
    description: 'Confident and articulate. A modern voice bridging ancient wisdom and today.',
    gender: 'male',
    languages: ['en-IN', 'en', 'hi', 'ta', 'te', 'kn'],
    primaryLanguage: 'en-IN',
    category: 'narration',
    tags: ['indian-english', 'confident', 'modern', 'articulate', 'sarvam'],
    previewText: 'Look, here is the thing. The Gita is not just philosophy. It is a conversation between two friends during the most difficult moment of their lives. That is exactly what we are doing now.',
    backendConfig: { voiceType: 'wisdom', speed: 0.92, language: 'en', sarvamSpeaker: 'karthik' },
    browserConfig: {
      voicePatterns: [/Ravi/i, /Prabhat/i, /Google.*Male/i, /Daniel/i],
      rate: 0.92,
      pitch: 0.92,
    },
    premium: false,
    accent: 'Indian English',
    warmth: 0.82,
    clarity: 0.93,
    poweredBy: 'sarvam',
  },

  // ─── Sarvam AI Native Voices (South Indian Languages) ─────
  {
    id: 'tara',
    name: 'Tara',
    description: 'Graceful South Indian voice. Fluent across Tamil, Telugu, Kannada, and Malayalam with native warmth.',
    gender: 'female',
    languages: ['ta', 'te', 'kn', 'ml', 'en-IN', 'hi'],
    primaryLanguage: 'ta',
    category: 'conversational',
    tags: ['south-indian', 'warm', 'multilingual', 'sarvam', 'native'],
    previewText: 'Nanbaa, nee inge vandhadhu romba mukkiyam. Oru sila nimidangal un ulle paarthu, amaidhi kaandalaam.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'ta', sarvamSpeaker: 'pavithra' },
    browserConfig: {
      voicePatterns: [/Pallavi/i, /Google.*Tamil/i, /Tamil.*Female/i],
      rate: 0.93,
      pitch: 1.05,
    },
    premium: true,
    accent: 'South Indian',
    warmth: 0.92,
    clarity: 0.9,
    poweredBy: 'sarvam',
  },
  {
    id: 'surya',
    name: 'Surya',
    description: 'Strong and grounding South Indian male voice. Ancient wisdom meets modern clarity.',
    gender: 'male',
    languages: ['ta', 'te', 'kn', 'ml', 'en-IN', 'hi'],
    primaryLanguage: 'ta',
    category: 'narration',
    tags: ['south-indian', 'deep', 'grounding', 'sarvam', 'native'],
    previewText: 'Nanba, kadavul un ulle irukkiraar. Un balam un ninaiviley irukku. Innum oru adiyai eduthu vai.',
    backendConfig: { voiceType: 'wisdom', speed: 0.90, language: 'ta', sarvamSpeaker: 'karthik' },
    browserConfig: {
      voicePatterns: [/Valluvar/i, /Google.*Tamil/i, /Tamil.*Male/i],
      rate: 0.90,
      pitch: 0.88,
    },
    premium: true,
    accent: 'South Indian',
    warmth: 0.85,
    clarity: 0.93,
    poweredBy: 'sarvam',
  },

  // ─── Sarvam AI Native Voices (Bengali) ─────────────────────
  {
    id: 'arunima',
    name: 'Arunima',
    description: 'Soft Bengali voice with poetic cadence. Like listening to Tagore come alive.',
    gender: 'female',
    languages: ['bn', 'hi', 'en-IN'],
    primaryLanguage: 'bn',
    category: 'meditation',
    tags: ['bengali', 'poetic', 'soft', 'sarvam', 'native'],
    previewText: 'Bandhu, tumi ekhane esecho, eta-i shob cheye boro kotha. Eso, amra ekshathe ektu shanti khunjee.',
    backendConfig: { voiceType: 'calm', speed: 0.90, language: 'bn', sarvamSpeaker: 'maitreyi' },
    browserConfig: {
      voicePatterns: [/Tanishaa/i, /Google.*Bengali/i, /Bengali.*Female/i],
      rate: 0.90,
      pitch: 1.0,
    },
    premium: true,
    accent: 'Shudh Bangla',
    warmth: 0.95,
    clarity: 0.87,
    poweredBy: 'sarvam',
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
    tags: ['sanskrit', 'chanting', 'sacred', 'divine', 'shloka', 'sarvam'],
    previewText: 'Karmanye vadhikaraste, Ma phaleshu kadachana. Ma karma phala hetur bhur, Ma te sangostvakarmani.',
    backendConfig: { voiceType: 'chanting', speed: 0.82, language: 'hi', sarvamSpeaker: 'arvind' },
    browserConfig: {
      voicePatterns: [/Prabhat/i, /Ravi/i, /Google.*Hindi/i, /Daniel/i],
      rate: 0.78,
      pitch: 0.8,
    },
    premium: true,
    accent: 'Vedic Sanskrit',
    warmth: 0.9,
    clarity: 0.95,
    poweredBy: 'sarvam',
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
    tags: ['international', 'clear', 'multilingual', 'precise', 'elevenlabs'],
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
    poweredBy: 'elevenlabs',
  },

  // ─── ElevenLabs Premium International Voices ────────────────

  // Spanish
  {
    id: 'lucia',
    name: 'Lucia',
    description: 'Warm and melodic Spanish voice. Native fluency with the gentle rhythm of Castilian Spanish.',
    gender: 'female',
    languages: ['es', 'en', 'pt', 'fr'],
    primaryLanguage: 'es',
    category: 'conversational',
    tags: ['spanish', 'warm', 'melodic', 'native', 'elevenlabs'],
    previewText: 'Hola querido amigo. No importa lo que estes pasando, recuerda que la sabiduria antigua nos ensena que cada desafio es una oportunidad para crecer.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'es' },
    browserConfig: {
      voicePatterns: [/Elvira/i, /Google.*Spanish/i, /Spanish.*Female/i],
      rate: 0.93,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Castilian Spanish',
    warmth: 0.92,
    clarity: 0.90,
    poweredBy: 'elevenlabs',
  },
  {
    id: 'carlos',
    name: 'Carlos',
    description: 'Deep and soulful Spanish male voice. Carries wisdom with the gravitas of a trusted mentor.',
    gender: 'male',
    languages: ['es', 'en', 'pt'],
    primaryLanguage: 'es',
    category: 'narration',
    tags: ['spanish', 'deep', 'soulful', 'mentor', 'elevenlabs'],
    previewText: 'Amigo mio, la Gita nos dice que el alma es eterna. No nace ni muere. Tu eres mas fuerte de lo que crees.',
    backendConfig: { voiceType: 'wisdom', speed: 0.90, language: 'es' },
    browserConfig: {
      voicePatterns: [/Alvaro/i, /Google.*Spanish/i, /Spanish.*Male/i],
      rate: 0.90,
      pitch: 0.88,
    },
    premium: true,
    accent: 'Spanish',
    warmth: 0.85,
    clarity: 0.92,
    poweredBy: 'elevenlabs',
  },

  // French
  {
    id: 'amelie',
    name: 'Amelie',
    description: 'Elegant and compassionate French voice. Wisdom delivered with Parisian grace and warmth.',
    gender: 'female',
    languages: ['fr', 'en', 'es'],
    primaryLanguage: 'fr',
    category: 'conversational',
    tags: ['french', 'elegant', 'warm', 'native', 'elevenlabs'],
    previewText: 'Mon cher ami, la sagesse ancienne nous enseigne que chaque moment de souffrance porte en lui la graine de la paix interieure.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'fr' },
    browserConfig: {
      voicePatterns: [/Denise/i, /Google.*French/i, /French.*Female/i],
      rate: 0.93,
      pitch: 1.05,
    },
    premium: true,
    accent: 'French',
    warmth: 0.90,
    clarity: 0.92,
    poweredBy: 'elevenlabs',
  },

  // German
  {
    id: 'lena',
    name: 'Lena',
    description: 'Clear and nurturing German voice. Delivers ancient wisdom with modern clarity and precision.',
    gender: 'female',
    languages: ['de', 'en', 'fr'],
    primaryLanguage: 'de',
    category: 'conversational',
    tags: ['german', 'clear', 'nurturing', 'native', 'elevenlabs'],
    previewText: 'Mein lieber Freund, die alte Weisheit lehrt uns, dass jede Herausforderung eine Gelegenheit zum Wachstum ist. Du bist staerker als du denkst.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'de' },
    browserConfig: {
      voicePatterns: [/Katja/i, /Google.*German/i, /German.*Female/i],
      rate: 0.93,
      pitch: 1.03,
    },
    premium: true,
    accent: 'German',
    warmth: 0.88,
    clarity: 0.95,
    poweredBy: 'elevenlabs',
  },

  // Portuguese
  {
    id: 'isabela',
    name: 'Isabela',
    description: 'Warm Brazilian Portuguese voice. The soulful rhythm of Brazil carrying timeless wisdom.',
    gender: 'female',
    languages: ['pt', 'en', 'es'],
    primaryLanguage: 'pt',
    category: 'conversational',
    tags: ['portuguese', 'brazilian', 'warm', 'soulful', 'elevenlabs'],
    previewText: 'Querido amigo, a sabedoria da Gita nos ensina que a alma e eterna. Voce e mais forte do que imagina. Estou aqui com voce.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'pt' },
    browserConfig: {
      voicePatterns: [/Francisca/i, /Google.*Portuguese/i, /Portuguese.*Female/i],
      rate: 0.93,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Brazilian Portuguese',
    warmth: 0.93,
    clarity: 0.88,
    poweredBy: 'elevenlabs',
  },

  // Japanese
  {
    id: 'yuki',
    name: 'Yuki',
    description: 'Gentle and precise Japanese voice. Ancient Eastern wisdom in its most natural expression.',
    gender: 'female',
    languages: ['ja', 'en'],
    primaryLanguage: 'ja',
    category: 'meditation',
    tags: ['japanese', 'gentle', 'precise', 'native', 'elevenlabs'],
    previewText: 'Dear friend, the Bhagavad Gita teaches us that the soul is eternal. In stillness, we find our true nature.',
    backendConfig: { voiceType: 'calm', speed: 0.90, language: 'ja' },
    browserConfig: {
      voicePatterns: [/Nanami/i, /Google.*Japanese/i, /Japanese.*Female/i],
      rate: 0.90,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Japanese',
    warmth: 0.90,
    clarity: 0.93,
    poweredBy: 'elevenlabs',
  },

  // Chinese
  {
    id: 'xiaoli',
    name: 'Xiaoli',
    description: 'Warm and articulate Mandarin voice. Bridges Eastern wisdom traditions with natural grace.',
    gender: 'female',
    languages: ['zh', 'en'],
    primaryLanguage: 'zh',
    category: 'conversational',
    tags: ['chinese', 'mandarin', 'warm', 'articulate', 'elevenlabs'],
    previewText: 'Dear friend, the ancient teachings remind us that true strength comes from within. You are never alone on this path.',
    backendConfig: { voiceType: 'friendly', speed: 0.92, language: 'zh' },
    browserConfig: {
      voicePatterns: [/Xiaoxiao/i, /Google.*Chinese/i, /Chinese.*Female/i],
      rate: 0.92,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Mandarin Chinese',
    warmth: 0.88,
    clarity: 0.92,
    poweredBy: 'elevenlabs',
  },

  // Arabic
  {
    id: 'layla',
    name: 'Layla',
    description: 'Rich and soothing Arabic voice. The warmth of ancient desert wisdom in every word.',
    gender: 'female',
    languages: ['ar', 'en'],
    primaryLanguage: 'ar',
    category: 'narration',
    tags: ['arabic', 'rich', 'soothing', 'native', 'elevenlabs'],
    previewText: 'Dear friend, the Gita speaks of the eternal soul, a truth shared across all great wisdom traditions. You carry this light within you.',
    backendConfig: { voiceType: 'wisdom', speed: 0.90, language: 'ar' },
    browserConfig: {
      voicePatterns: [/Google.*Arabic/i, /Arabic.*Female/i],
      rate: 0.90,
      pitch: 1.02,
    },
    premium: true,
    accent: 'Arabic',
    warmth: 0.90,
    clarity: 0.90,
    poweredBy: 'elevenlabs',
  },

  // ─── Sarvam AI Native Voices (Marathi) ──────────────────────
  {
    id: 'sneha',
    name: 'Sneha',
    description: 'Warm Marathi voice with native cadence. Like hearing wisdom from a loving aunty.',
    gender: 'female',
    languages: ['mr', 'hi', 'en-IN'],
    primaryLanguage: 'mr',
    category: 'conversational',
    tags: ['marathi', 'warm', 'native', 'sarvam'],
    previewText: 'Mitra, tu ithe aalas he khup chhan aahe. Chala, ekatra thoda shanti anubhavu.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'mr', sarvamSpeaker: 'meera' },
    browserConfig: {
      voicePatterns: [/Aarohi/i, /Google.*Marathi/i, /Marathi.*Female/i],
      rate: 0.93,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Shudh Marathi',
    warmth: 0.93,
    clarity: 0.88,
    poweredBy: 'sarvam',
  },

  // ─── Sarvam AI Native Voices (Gujarati) ─────────────────────
  {
    id: 'nisha',
    name: 'Nisha',
    description: 'Melodic Gujarati voice with native warmth. Wisdom shared in the sweet rhythm of Gujarat.',
    gender: 'female',
    languages: ['gu', 'hi', 'en-IN'],
    primaryLanguage: 'gu',
    category: 'conversational',
    tags: ['gujarati', 'melodic', 'warm', 'sarvam'],
    previewText: 'Dost, tu ahiya aavyo te j sabathi moti vaat che. Chaal, saath me thodi shaanti shodiye.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'gu', sarvamSpeaker: 'meera' },
    browserConfig: {
      voicePatterns: [/Dhwani/i, /Google.*Gujarati/i, /Gujarati.*Female/i],
      rate: 0.93,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Shudh Gujarati',
    warmth: 0.92,
    clarity: 0.87,
    poweredBy: 'sarvam',
  },

  // ─── Sarvam AI Native Voices (Punjabi) ──────────────────────
  {
    id: 'harleen',
    name: 'Harleen',
    description: 'Vibrant Punjabi voice full of heart. The warmth of Punjab in every word of wisdom.',
    gender: 'female',
    languages: ['pa', 'hi', 'en-IN'],
    primaryLanguage: 'pa',
    category: 'conversational',
    tags: ['punjabi', 'vibrant', 'warm', 'sarvam'],
    previewText: 'Yaara, tu ithhe aaya hai, eh bada sohna kaam hai. Chal, ikk-duje naal kuchh sukoon labhdiye.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'pa', sarvamSpeaker: 'meera' },
    browserConfig: {
      voicePatterns: [/Ojas/i, /Google.*Punjabi/i, /Punjabi.*Female/i],
      rate: 0.93,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Shudh Punjabi',
    warmth: 0.94,
    clarity: 0.86,
    poweredBy: 'sarvam',
  },

  // ─── Sarvam AI Native Voices (Kannada) ──────────────────────
  {
    id: 'divya',
    name: 'Divya',
    description: 'Melodious Kannada voice with gentle warmth. Ancient Dravidian wisdom in its native tongue.',
    gender: 'female',
    languages: ['kn', 'ta', 'te', 'en-IN'],
    primaryLanguage: 'kn',
    category: 'conversational',
    tags: ['kannada', 'melodious', 'warm', 'sarvam'],
    previewText: 'Geleya, neevu illi bandiddhu thumba vishesha. Barri, ondishtu naavu shanthi anubhavisona.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'kn', sarvamSpeaker: 'pavithra' },
    browserConfig: {
      voicePatterns: [/Sapna/i, /Google.*Kannada/i, /Kannada.*Female/i],
      rate: 0.93,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Shudh Kannada',
    warmth: 0.91,
    clarity: 0.89,
    poweredBy: 'sarvam',
  },

  // ─── Sarvam AI Native Voices (Malayalam) ─────────────────────
  {
    id: 'lakshmi',
    name: 'Lakshmi',
    description: 'Graceful Malayalam voice with poetic flow. Kerala wisdom expressed with natural beauty.',
    gender: 'female',
    languages: ['ml', 'ta', 'en-IN'],
    primaryLanguage: 'ml',
    category: 'meditation',
    tags: ['malayalam', 'graceful', 'poetic', 'sarvam'],
    previewText: 'Kuttaa, nee ividey vannathu valare pradhaanmaanam. Varikku, namukku koode onnu samaadhaanam kandethaam.',
    backendConfig: { voiceType: 'calm', speed: 0.90, language: 'ml', sarvamSpeaker: 'maitreyi' },
    browserConfig: {
      voicePatterns: [/Sobhana/i, /Google.*Malayalam/i, /Malayalam.*Female/i],
      rate: 0.90,
      pitch: 1.03,
    },
    premium: true,
    accent: 'Shudh Malayalam',
    warmth: 0.92,
    clarity: 0.88,
    poweredBy: 'sarvam',
  },

  // ─── Sarvam AI Native Voices (Telugu) ───────────────────────
  {
    id: 'padma',
    name: 'Padma',
    description: 'Sweet Telugu voice with musical quality. The language of poets carrying divine wisdom.',
    gender: 'female',
    languages: ['te', 'ta', 'kn', 'en-IN'],
    primaryLanguage: 'te',
    category: 'conversational',
    tags: ['telugu', 'sweet', 'musical', 'sarvam'],
    previewText: 'Mitramaa, nuvvu ikkadiki raavadam chaala mukhyam. Raa, kaastha shaanthiga undaam.',
    backendConfig: { voiceType: 'friendly', speed: 0.93, language: 'te', sarvamSpeaker: 'pavithra' },
    browserConfig: {
      voicePatterns: [/Shruti/i, /Google.*Telugu/i, /Telugu.*Female/i],
      rate: 0.93,
      pitch: 1.05,
    },
    premium: true,
    accent: 'Shudh Telugu',
    warmth: 0.91,
    clarity: 0.89,
    poweredBy: 'sarvam',
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
