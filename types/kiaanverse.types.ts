/**
 * Kiaanverse — Bhagavad Gita VR Experience Type Definitions
 *
 * Covers all API contracts, VR scene states, AI character states,
 * interaction modes, and verse data structures for the immersive
 * WebXR spiritual experience.
 */

/* ── VR Scene Environments ── */

export type VRScene =
  | 'cosmic-ocean'
  | 'kurukshetra'
  | 'dialogue-space'
  | 'vishvarupa'
  | 'lotus-meditation'

export type ScenePhase = 'loading' | 'entering' | 'active' | 'transitioning'

/* ── AI Interaction Modes ── */

export type InteractionMode = 'recital' | 'sakha'

/* ── Krishna AI Character States ── */

export type KrishnaState =
  | 'idle'
  | 'speaking'
  | 'listening'
  | 'blessing'
  | 'reciting'
  | 'cosmic-form'

export type KrishnaEmotion =
  | 'compassionate'
  | 'wise'
  | 'playful'
  | 'serene'
  | 'powerful'
  | 'loving'

/* ── Arjuna Character States ── */

export type ArjunaState =
  | 'idle'
  | 'distressed'
  | 'listening'
  | 'enlightened'
  | 'awestruck'

/* ── Gesture Cues for 3D Animation ── */

export interface GestureCue {
  type:
    | 'blessing'
    | 'namaste'
    | 'open_palms'
    | 'touching_heart'
    | 'pointing_up'
    | 'beckoning'
    | 'flute_playing'
    | 'cosmic_reveal'
  timestamp_ms: number
  duration_ms: number
}

/* ── Verse Data ── */

export interface VerseReference {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  translation: string
}

/* ── API: Ask Krishna (Sakha Mode) ── */

export interface AskKrishnaRequest {
  question: string
  chapter_context: number
  language: string
  mode: InteractionMode
}

export interface AskKrishnaResponse {
  answer: string
  verse_reference: VerseReference | null
  audio_url: string | null
  gestures: GestureCue[]
  emotion: KrishnaEmotion
}

/* ── API: Verse Teaching (Recital Mode) ── */

export interface VerseTeaching {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  translation: string
  teaching: string
  audio_url: string | null
  themes: string[]
}

/* ── API: Chapter Intro ── */

export interface ChapterIntro {
  chapter: number
  name: string
  sanskrit_name: string
  intro_text: string
  audio_url: string | null
  key_themes: string[]
  total_verses: number
}

/* ── Conversation Entry ── */

export interface ConversationEntry {
  role: 'user' | 'krishna'
  text: string
  verse?: VerseReference | null
  emotion?: KrishnaEmotion
  timestamp: number
}

/* ── Chapter Metadata ── */

export interface ChapterMeta {
  ch: number
  name: string
  sanskritName: string
  label: string
}
