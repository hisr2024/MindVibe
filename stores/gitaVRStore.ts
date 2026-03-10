/**
 * Bhagavad Gita VR Experience - Zustand State Store
 *
 * Manages all state for the immersive 3D VR experience including
 * scene state, character states, audio, UI, and KIAAN AI responses.
 */

import { create } from 'zustand'
import type { GitaVRState, GitaVRActions } from '@/types/gitaVR.types'

const initialState: GitaVRState = {
  currentChapter: 1,
  currentVerse: 1,
  vrMode: 'desktop',
  sceneState: 'loading',
  krishnaState: 'idle',
  arjunaState: 'idle',
  interactionMode: 'text',
  audioPlaying: false,
  subtitleText: '',
  currentVerse_sanskrit: '',
  userQuestion: '',
  isProcessingQuestion: false,
  krishnaResponse: null,
  showChapterSelector: false,
  showVerseDisplay: false,
  subtitlesEnabled: true,
  volume: 0.8,
  assetsLoaded: false,
  loadingProgress: 0,
}

export const useGitaVRStore = create<GitaVRState & GitaVRActions>((set) => ({
  ...initialState,

  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  setCurrentVerse: (verse) => set({ currentVerse: verse }),
  setVRMode: (mode) => set({ vrMode: mode }),
  setSceneState: (state) => set({ sceneState: state }),
  setKrishnaState: (state) => set({ krishnaState: state }),
  setArjunaState: (state) => set({ arjunaState: state }),
  setInteractionMode: (mode) => set({ interactionMode: mode }),
  setAudioPlaying: (playing) => set({ audioPlaying: playing }),
  setSubtitleText: (text) => set({ subtitleText: text }),
  setUserQuestion: (question) => set({ userQuestion: question }),
  setIsProcessingQuestion: (processing) => set({ isProcessingQuestion: processing }),
  setKrishnaResponse: (response) => set({ krishnaResponse: response }),
  setShowChapterSelector: (show) => set({ showChapterSelector: show }),
  setShowVerseDisplay: (show) => set({ showVerseDisplay: show }),
  setSubtitlesEnabled: (enabled) => set({ subtitlesEnabled: enabled }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setAssetsLoaded: (loaded) => set({ assetsLoaded: loaded }),
  setLoadingProgress: (progress) => set({ loadingProgress: Math.max(0, Math.min(100, progress)) }),
  reset: () => set(initialState),
}))
