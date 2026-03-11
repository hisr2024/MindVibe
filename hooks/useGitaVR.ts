/**
 * useGitaVR — Convenience hook combining the Gita VR store and service.
 *
 * Uses individual selectors for each store property to avoid
 * unnecessary re-renders. Provides memoized action functions.
 */

import { useCallback } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'
import { gitaVRService } from '@/services/gitaVRService'

export function useGitaVR() {
  const scenePhase = useGitaVRStore((s) => s.scenePhase)
  const currentChapter = useGitaVRStore((s) => s.currentChapter)
  const currentVerse = useGitaVRStore((s) => s.currentVerse)
  const krishnaState = useGitaVRStore((s) => s.krishnaState)
  const arjunaState = useGitaVRStore((s) => s.arjunaState)
  const conversation = useGitaVRStore((s) => s.conversation)
  const isLoading = useGitaVRStore((s) => s.isLoading)
  const activeVerse = useGitaVRStore((s) => s.activeVerse)
  const subtitleText = useGitaVRStore((s) => s.subtitleText)

  const setScenePhase = useGitaVRStore((s) => s.setScenePhase)
  const setChapter = useGitaVRStore((s) => s.setChapter)
  const setVerse = useGitaVRStore((s) => s.setVerse)
  const setKrishnaState = useGitaVRStore((s) => s.setKrishnaState)
  const setArjunaState = useGitaVRStore((s) => s.setArjunaState)
  const addUserMessage = useGitaVRStore((s) => s.addUserMessage)
  const addKrishnaResponse = useGitaVRStore((s) => s.addKrishnaResponse)
  const setIsLoading = useGitaVRStore((s) => s.setIsLoading)
  const setActiveVerse = useGitaVRStore((s) => s.setActiveVerse)
  const setSubtitleText = useGitaVRStore((s) => s.setSubtitleText)

  const askKrishna = useCallback(
    async (question: string) => {
      setIsLoading(true)
      setKrishnaState('listening')
      setArjunaState('listening')
      addUserMessage(question)

      try {
        const response = await gitaVRService.askKrishna({
          question,
          chapter_context: currentChapter,
          language: 'en',
        })

        setKrishnaState('speaking')
        setSubtitleText(response.answer)
        addKrishnaResponse(response)

        return response
      } catch (error) {
        setKrishnaState('idle')
        setArjunaState('idle')
        setIsLoading(false)
        throw error
      }
    },
    [
      currentChapter, setIsLoading, setKrishnaState, setArjunaState,
      addUserMessage, setSubtitleText, addKrishnaResponse,
    ]
  )

  const loadChapter = useCallback(
    async (chapter: number) => {
      setChapter(chapter)
      try {
        const intro = await gitaVRService.getChapterIntro(chapter)
        setSubtitleText(intro.intro_text)
        setKrishnaState('speaking')
      } catch {
        setSubtitleText(`Welcome to Chapter ${chapter} of the Bhagavad Gita.`)
      }
    },
    [setChapter, setSubtitleText, setKrishnaState]
  )

  return {
    scenePhase, currentChapter, currentVerse, krishnaState, arjunaState,
    conversation, isLoading, activeVerse, subtitleText,
    setScenePhase, setChapter, setVerse, setKrishnaState, setArjunaState,
    addUserMessage, addKrishnaResponse, setIsLoading, setActiveVerse, setSubtitleText,
    askKrishna, loadChapter,
  }
}
