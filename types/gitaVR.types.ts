/**
 * Type definitions for the Bhagavad Gita VR Experience.
 *
 * Covers API request/response shapes, character states,
 * scene states, and verse data structures.
 */

/* ── Character & Scene States ── */

export type KrishnaState = 'idle' | 'speaking' | 'listening' | 'blessing'
export type ArjunaState = 'idle' | 'distressed' | 'listening' | 'enlightened'
export type ScenePhase = 'loading' | 'intro' | 'active' | 'vishwaroop'

/* ── Verse Data ── */

export interface VerseReference {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  translation: string
}

/* ── Gesture Cues ── */

export interface GestureCue {
  type: 'blessing' | 'namaste' | 'open_palms' | 'touching_heart' | 'pointing_up' | 'beckoning'
  timestamp_ms: number
  duration_ms: number
}

/* ── API: Ask Krishna ── */

export interface AskKrishnaRequest {
  question: string
  chapter_context: number
  language: string
}

export interface AskKrishnaResponse {
  answer: string
  verse_reference: VerseReference | null
  audio_url: string | null
  gestures: GestureCue[]
  emotion: 'compassionate' | 'wise' | 'playful' | 'serene' | 'powerful' | 'loving'
}

/* ── API: Verse Teaching ── */

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
