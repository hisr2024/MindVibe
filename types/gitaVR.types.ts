/**
 * Bhagavad Gita VR Experience - Type Definitions
 *
 * Types for the immersive 3D Kurukshetra battlefield experience
 * where Krishna delivers Gita teachings to Arjuna, powered by KIAAN AI.
 */

// ─── Scene & State Types ──────────────────────────────────────────────────────

export type VRMode = 'desktop' | 'mobile' | 'vr-headset'

export type SceneState = 'loading' | 'intro' | 'teaching' | 'question' | 'vishwaroop'

export type KrishnaState = 'idle' | 'speaking' | 'listening' | 'blessing'

export type ArjunaState = 'idle' | 'distressed' | 'listening' | 'enlightened'

export type InteractionMode = 'voice' | 'text'

export type GestureType =
  | 'blessing'
  | 'pointing_up'
  | 'open_palms'
  | 'touching_heart'
  | 'namaste'
  | 'beckoning'
  | 'idle'

export type KrishnaEmotion =
  | 'compassionate'
  | 'wise'
  | 'playful'
  | 'serene'
  | 'powerful'
  | 'loving'

// ─── API Types ────────────────────────────────────────────────────────────────

export interface KrishnaRequest {
  question: string
  chapter_context: number
  language: string
}

export interface VerseReference {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  translation: string
}

export interface GestureCue {
  type: GestureType
  timestamp_ms: number
  duration_ms: number
}

export interface KrishnaResponse {
  answer: string
  verse_reference: VerseReference | null
  audio_url: string | null
  gestures: GestureCue[]
  emotion: KrishnaEmotion
}

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

export interface ChapterIntro {
  chapter: number
  name: string
  sanskrit_name: string
  intro_text: string
  audio_url: string | null
  key_themes: string[]
  total_verses: number
}

// ─── VR Store State ───────────────────────────────────────────────────────────

export interface GitaVRState {
  currentChapter: number
  currentVerse: number
  vrMode: VRMode
  sceneState: SceneState
  krishnaState: KrishnaState
  arjunaState: ArjunaState
  interactionMode: InteractionMode
  audioPlaying: boolean
  subtitleText: string
  currentVerse_sanskrit: string
  userQuestion: string
  isProcessingQuestion: boolean
  krishnaResponse: KrishnaResponse | null
  showChapterSelector: boolean
  showVerseDisplay: boolean
  subtitlesEnabled: boolean
  volume: number
  assetsLoaded: boolean
  loadingProgress: number
}

export interface GitaVRActions {
  setCurrentChapter: (chapter: number) => void
  setCurrentVerse: (verse: number) => void
  setVRMode: (mode: VRMode) => void
  setSceneState: (state: SceneState) => void
  setKrishnaState: (state: KrishnaState) => void
  setArjunaState: (state: ArjunaState) => void
  setInteractionMode: (mode: InteractionMode) => void
  setAudioPlaying: (playing: boolean) => void
  setSubtitleText: (text: string) => void
  setUserQuestion: (question: string) => void
  setIsProcessingQuestion: (processing: boolean) => void
  setKrishnaResponse: (response: KrishnaResponse | null) => void
  setShowChapterSelector: (show: boolean) => void
  setShowVerseDisplay: (show: boolean) => void
  setSubtitlesEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
  setAssetsLoaded: (loaded: boolean) => void
  setLoadingProgress: (progress: number) => void
  reset: () => void
}
