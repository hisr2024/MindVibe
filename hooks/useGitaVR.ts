/**
 * useGitaVR — Convenience hook combining the Gita VR store and service.
 *
 * Provides a unified API for components that need both state and actions.
 */

import { useCallback } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'
import { gitaVRService } from '@/services/gitaVRService'

export function useGitaVR() {
  const store = useGitaVRStore()

  const askKrishna = useCallback(
    async (question: string) => {
      store.setIsLoading(true)
      store.setKrishnaState('listening')
      store.setArjunaState('listening')
      store.addUserMessage(question)

      try {
        const response = await gitaVRService.askKrishna({
          question,
          chapter_context: store.currentChapter,
          language: 'en',
        })

        store.setKrishnaState('speaking')
        store.setSubtitleText(response.answer)
        store.addKrishnaResponse(response)

        return response
      } catch (error) {
        store.setKrishnaState('idle')
        store.setArjunaState('idle')
        store.setIsLoading(false)
        throw error
      }
    },
    [store]
  )

  const loadChapter = useCallback(
    async (chapter: number) => {
      store.setChapter(chapter)
      try {
        const intro = await gitaVRService.getChapterIntro(chapter)
        store.setSubtitleText(intro.intro_text)
        store.setKrishnaState('speaking')
      } catch {
        store.setSubtitleText(`Welcome to Chapter ${chapter} of the Bhagavad Gita.`)
      }
    },
    [store]
  )

  return {
    ...store,
    askKrishna,
    loadChapter,
  }
}
