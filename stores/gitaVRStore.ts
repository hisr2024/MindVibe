/**
 * Zustand store for the Gita VR experience.
 *
 * Manages character states, current chapter/verse, conversation,
 * scene phase, and UI toggles. Single source of truth for
 * all VR experience state.
 */

import { create } from 'zustand'
import type {
  KrishnaState,
  ArjunaState,
  ScenePhase,
  VerseReference,
  AskKrishnaResponse,
} from '@/types/gitaVR.types'

interface ConversationEntry {
  role: 'user' | 'krishna'
  text: string
  verse?: VerseReference | null
  emotion?: string
  timestamp: number
}

interface GitaVRState {
  /* Scene */
  scenePhase: ScenePhase
  setScenePhase: (phase: ScenePhase) => void

  /* Chapter & Verse */
  currentChapter: number
  currentVerse: number
  setChapter: (ch: number) => void
  setVerse: (v: number) => void

  /* Character states */
  krishnaState: KrishnaState
  arjunaState: ArjunaState
  setKrishnaState: (s: KrishnaState) => void
  setArjunaState: (s: ArjunaState) => void

  /* Conversation */
  conversation: ConversationEntry[]
  isLoading: boolean
  addUserMessage: (text: string) => void
  addKrishnaResponse: (resp: AskKrishnaResponse) => void
  setIsLoading: (v: boolean) => void

  /* Active verse display */
  activeVerse: VerseReference | null
  setActiveVerse: (v: VerseReference | null) => void

  /* UI toggles */
  showChapterNav: boolean
  toggleChapterNav: () => void
  subtitleText: string
  setSubtitleText: (t: string) => void
}

export const useGitaVRStore = create<GitaVRState>((set) => ({
  scenePhase: 'loading',
  setScenePhase: (phase) => set({ scenePhase: phase }),

  currentChapter: 1,
  currentVerse: 1,
  setChapter: (ch) => set({ currentChapter: ch, currentVerse: 1 }),
  setVerse: (v) => set({ currentVerse: v }),

  krishnaState: 'idle',
  arjunaState: 'idle',
  setKrishnaState: (s) => set({ krishnaState: s }),
  setArjunaState: (s) => set({ arjunaState: s }),

  conversation: [],
  isLoading: false,
  addUserMessage: (text) =>
    set((st) => ({
      conversation: [...st.conversation, { role: 'user', text, timestamp: Date.now() }],
    })),
  addKrishnaResponse: (resp) =>
    set((st) => ({
      conversation: [
        ...st.conversation,
        {
          role: 'krishna',
          text: resp.answer,
          verse: resp.verse_reference,
          emotion: resp.emotion,
          timestamp: Date.now(),
        },
      ],
      activeVerse: resp.verse_reference,
      isLoading: false,
    })),
  setIsLoading: (v) => set({ isLoading: v }),

  activeVerse: null,
  setActiveVerse: (v) => set({ activeVerse: v }),

  showChapterNav: false,
  toggleChapterNav: () => set((st) => ({ showChapterNav: !st.showChapterNav })),
  subtitleText: '',
  setSubtitleText: (t) => set({ subtitleText: t }),
}))
