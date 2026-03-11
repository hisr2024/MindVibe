/**
 * useKiaanverse — Convenience hook combining the Kiaanverse store and service.
 *
 * Provides memoized action functions for asking Krishna, loading chapters,
 * switching scenes, and toggling interaction modes.
 */

import { useCallback } from 'react'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'
import { kiaanverseService } from '@/services/kiaanverseService'
import type { VRScene, InteractionMode } from '@/types/kiaanverse.types'

export function useKiaanverse() {
  const currentScene = useKiaanverseStore((s) => s.currentScene)
  const scenePhase = useKiaanverseStore((s) => s.scenePhase)
  const interactionMode = useKiaanverseStore((s) => s.interactionMode)
  const currentChapter = useKiaanverseStore((s) => s.currentChapter)
  const currentVerse = useKiaanverseStore((s) => s.currentVerse)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)
  const krishnaEmotion = useKiaanverseStore((s) => s.krishnaEmotion)
  const conversation = useKiaanverseStore((s) => s.conversation)
  const isLoading = useKiaanverseStore((s) => s.isLoading)
  const activeVerse = useKiaanverseStore((s) => s.activeVerse)
  const subtitleText = useKiaanverseStore((s) => s.subtitleText)

  const setScene = useKiaanverseStore((s) => s.setScene)
  const setScenePhase = useKiaanverseStore((s) => s.setScenePhase)
  const setInteractionMode = useKiaanverseStore((s) => s.setInteractionMode)
  const setChapter = useKiaanverseStore((s) => s.setChapter)
  const setKrishnaState = useKiaanverseStore((s) => s.setKrishnaState)
  const setKrishnaEmotion = useKiaanverseStore((s) => s.setKrishnaEmotion)
  const addUserMessage = useKiaanverseStore((s) => s.addUserMessage)
  const addKrishnaResponse = useKiaanverseStore((s) => s.addKrishnaResponse)
  const setIsLoading = useKiaanverseStore((s) => s.setIsLoading)
  const setActiveVerse = useKiaanverseStore((s) => s.setActiveVerse)
  const setSubtitleText = useKiaanverseStore((s) => s.setSubtitleText)

  /** Ask Krishna a question (Sakha Mode) */
  const askKrishna = useCallback(
    async (question: string) => {
      setIsLoading(true)
      setKrishnaState('listening')
      addUserMessage(question)

      try {
        const response = await kiaanverseService.askKrishna({
          question,
          chapter_context: currentChapter,
          language: 'en',
          mode: interactionMode,
        })

        setIsLoading(false)
        setKrishnaState('speaking')
        setKrishnaEmotion(response.emotion)
        setSubtitleText(response.answer)
        addKrishnaResponse(response)

        return response
      } catch (error) {
        setKrishnaState('idle')
        setIsLoading(false)
        throw error
      }
    },
    [
      currentChapter, interactionMode, setIsLoading, setKrishnaState,
      setKrishnaEmotion, addUserMessage,
      setSubtitleText, addKrishnaResponse,
    ]
  )

  /** Load a chapter intro and switch context */
  const loadChapter = useCallback(
    async (chapter: number) => {
      setChapter(chapter)
      try {
        const intro = await kiaanverseService.getChapterIntro(chapter)
        setSubtitleText(intro.intro_text)
        setKrishnaState('speaking')
      } catch {
        setSubtitleText(`Welcome to Chapter ${chapter} of the Bhagavad Gita.`)
      }
    },
    [setChapter, setSubtitleText, setKrishnaState]
  )

  /** Navigate to a VR scene */
  const navigateScene = useCallback(
    (scene: VRScene) => {
      setScene(scene)
      setTimeout(() => setScenePhase('active'), 2000)
    },
    [setScene, setScenePhase]
  )

  /** Switch interaction mode */
  const switchMode = useCallback(
    (mode: InteractionMode) => {
      setInteractionMode(mode)
      if (mode === 'recital') {
        setKrishnaState('reciting')
        setSubtitleText('Let me recite the sacred verses for you, dear friend...')
      } else {
        setKrishnaState('idle')
        setSubtitleText('Ask me anything, dear friend. I am here as your Sakha.')
      }
    },
    [setInteractionMode, setKrishnaState, setSubtitleText]
  )

  /** Request a specific verse recitation */
  const requestVerse = useCallback(
    async (chapter: number, verse: number) => {
      setIsLoading(true)
      setKrishnaState('reciting')
      try {
        const teaching = await kiaanverseService.getVerseTeaching(chapter, verse)
        setActiveVerse({
          chapter: teaching.chapter,
          verse: teaching.verse,
          sanskrit: teaching.sanskrit,
          transliteration: teaching.transliteration,
          translation: teaching.translation,
        })
        setSubtitleText(teaching.teaching)
        setIsLoading(false)
        return teaching
      } catch {
        setKrishnaState('idle')
        setIsLoading(false)
        setSubtitleText('This verse holds deep wisdom. Let me find it for you...')
        return null
      }
    },
    [setIsLoading, setKrishnaState, setActiveVerse, setSubtitleText]
  )

  return {
    /* State */
    currentScene, scenePhase, interactionMode, currentChapter, currentVerse,
    krishnaState, krishnaEmotion, conversation, isLoading,
    activeVerse, subtitleText,
    /* Actions */
    askKrishna, loadChapter, navigateScene, switchMode, requestVerse,
    setKrishnaState, setSubtitleText, setScenePhase,
    setActiveVerse,
  }
}
