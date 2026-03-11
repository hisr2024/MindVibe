/**
 * Kiaanverse Zustand Store — Single source of truth for VR experience state.
 *
 * Manages: scene navigation, AI mode, character states, conversation,
 * chapter/verse selection, and UI toggles.
 */

import { create } from 'zustand'
import type {
  VRScene,
  ScenePhase,
  InteractionMode,
  KrishnaState,
  KrishnaEmotion,
  ArjunaState,
  VerseReference,
  AskKrishnaResponse,
  ConversationEntry,
} from '@/types/kiaanverse.types'

interface KiaanverseState {
  /* Scene navigation */
  currentScene: VRScene
  scenePhase: ScenePhase
  setScene: (scene: VRScene) => void
  setScenePhase: (phase: ScenePhase) => void

  /* AI interaction mode */
  interactionMode: InteractionMode
  setInteractionMode: (mode: InteractionMode) => void

  /* Chapter & verse */
  currentChapter: number
  currentVerse: number
  setChapter: (ch: number) => void
  setVerse: (v: number) => void

  /* Krishna character state */
  krishnaState: KrishnaState
  krishnaEmotion: KrishnaEmotion
  setKrishnaState: (s: KrishnaState) => void
  setKrishnaEmotion: (e: KrishnaEmotion) => void

  /* Arjuna character state */
  arjunaState: ArjunaState
  setArjunaState: (s: ArjunaState) => void

  /* Conversation */
  conversation: ConversationEntry[]
  isLoading: boolean
  addUserMessage: (text: string) => void
  addKrishnaResponse: (resp: AskKrishnaResponse) => void
  setIsLoading: (v: boolean) => void
  clearConversation: () => void

  /* Active verse display */
  activeVerse: VerseReference | null
  setActiveVerse: (v: VerseReference | null) => void

  /* Subtitle display */
  subtitleText: string
  setSubtitleText: (t: string) => void

  /* UI toggles */
  showChapterNav: boolean
  showSceneSelector: boolean
  showModeSelector: boolean
  toggleChapterNav: () => void
  toggleSceneSelector: () => void
  toggleModeSelector: () => void
}

export const useKiaanverseStore = create<KiaanverseState>((set) => ({
  /* Scene navigation */
  currentScene: 'kurukshetra',
  scenePhase: 'loading',
  setScene: (scene) => set({ currentScene: scene, scenePhase: 'transitioning' }),
  setScenePhase: (phase) => set({ scenePhase: phase }),

  /* AI interaction mode */
  interactionMode: 'sakha',
  setInteractionMode: (mode) => set({ interactionMode: mode }),

  /* Chapter & verse */
  currentChapter: 1,
  currentVerse: 1,
  setChapter: (ch) => set({ currentChapter: ch, currentVerse: 1 }),
  setVerse: (v) => set({ currentVerse: v }),

  /* Krishna character */
  krishnaState: 'idle',
  krishnaEmotion: 'serene',
  setKrishnaState: (s) => set({ krishnaState: s }),
  setKrishnaEmotion: (e) => set({ krishnaEmotion: e }),

  /* Arjuna character */
  arjunaState: 'idle',
  setArjunaState: (s) => set({ arjunaState: s }),

  /* Conversation */
  conversation: [],
  isLoading: false,
  addUserMessage: (text) =>
    set((st) => ({
      conversation: [
        ...st.conversation,
        { role: 'user', text, timestamp: Date.now() },
      ],
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
  clearConversation: () => set({ conversation: [] }),

  /* Active verse */
  activeVerse: null,
  setActiveVerse: (v) => set({ activeVerse: v }),

  /* Subtitle */
  subtitleText: '',
  setSubtitleText: (t) => set({ subtitleText: t }),

  /* UI toggles */
  showChapterNav: false,
  showSceneSelector: false,
  showModeSelector: false,
  toggleChapterNav: () => set((st) => ({ showChapterNav: !st.showChapterNav, showSceneSelector: false, showModeSelector: false })),
  toggleSceneSelector: () => set((st) => ({ showSceneSelector: !st.showSceneSelector, showChapterNav: false, showModeSelector: false })),
  toggleModeSelector: () => set((st) => ({ showModeSelector: !st.showModeSelector, showChapterNav: false, showSceneSelector: false })),
}))
