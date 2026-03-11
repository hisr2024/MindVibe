/**
 * QuestionInput — Text input for asking Krishna questions.
 *
 * Fixed at the bottom of the screen. Sends the question to the
 * backend via the store, which triggers Krishna's response flow.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'
import { gitaVRService } from '@/services/gitaVRService'

export default function QuestionInput() {
  const [text, setText] = useState('')
  const isLoading = useGitaVRStore((s) => s.isLoading)
  const currentChapter = useGitaVRStore((s) => s.currentChapter)
  const addUserMessage = useGitaVRStore((s) => s.addUserMessage)
  const addKrishnaResponse = useGitaVRStore((s) => s.addKrishnaResponse)
  const setIsLoading = useGitaVRStore((s) => s.setIsLoading)
  const setKrishnaState = useGitaVRStore((s) => s.setKrishnaState)
  const setArjunaState = useGitaVRStore((s) => s.setArjunaState)
  const setSubtitleText = useGitaVRStore((s) => s.setSubtitleText)

  /* Track idle-reset timer so we can clear it on unmount or rapid resubmit */
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [])

  const handleSubmit = async () => {
    const question = text.trim()
    if (!question || isLoading) return

    /* Clear any pending idle timer from a previous question */
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }

    setText('')
    addUserMessage(question)
    setIsLoading(true)
    setArjunaState('listening')
    setKrishnaState('listening')

    try {
      const response = await gitaVRService.askKrishna({
        question,
        chapter_context: currentChapter,
        language: 'en',
      })

      setKrishnaState('speaking')
      setSubtitleText(response.answer)
      addKrishnaResponse(response)

      /* Return to idle after display time (timer is tracked for cleanup) */
      const readTime = Math.max(4000, response.answer.length * 30)
      idleTimerRef.current = setTimeout(() => {
        setKrishnaState('idle')
        setArjunaState('idle')
        idleTimerRef.current = null
      }, readTime)
    } catch {
      setKrishnaState('idle')
      setArjunaState('idle')
      setIsLoading(false)
      setSubtitleText('My dear friend, my words could not reach you just now. Please ask again.')
    }
  }

  return (
    <div className="absolute bottom-4 left-1/2 z-50 w-[92%] max-w-xl -translate-x-1/2">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-black/40 px-4 py-2 backdrop-blur-lg"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Krishna a question..."
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm text-amber-50/90 placeholder-amber-200/40 outline-none md:text-base"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 transition-colors hover:bg-amber-500/30 disabled:opacity-30"
          aria-label="Send question"
        >
          {isLoading ? (
            <motion.div
              className="h-4 w-4 rounded-full border-2 border-amber-300/50 border-t-amber-300"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}
