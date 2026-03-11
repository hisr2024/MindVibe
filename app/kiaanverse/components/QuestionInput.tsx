/**
 * QuestionInput — Text input for asking Krishna questions (Sakha Mode)
 * or requesting verse recitation (Recital Mode).
 *
 * Fixed at the bottom of the screen. Routes through Kiaanverse service.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'
import { kiaanverseService } from '@/services/kiaanverseService'

export default function QuestionInput() {
  const [text, setText] = useState('')
  const isLoading = useKiaanverseStore((s) => s.isLoading)
  const currentChapter = useKiaanverseStore((s) => s.currentChapter)
  const interactionMode = useKiaanverseStore((s) => s.interactionMode)
  const addUserMessage = useKiaanverseStore((s) => s.addUserMessage)
  const addKrishnaResponse = useKiaanverseStore((s) => s.addKrishnaResponse)
  const setIsLoading = useKiaanverseStore((s) => s.setIsLoading)
  const setKrishnaState = useKiaanverseStore((s) => s.setKrishnaState)
  const setKrishnaEmotion = useKiaanverseStore((s) => s.setKrishnaEmotion)
  const setArjunaState = useKiaanverseStore((s) => s.setArjunaState)
  const setSubtitleText = useKiaanverseStore((s) => s.setSubtitleText)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [])

  const handleSubmit = async () => {
    const question = text.trim()
    if (!question || isLoading) return

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
      const response = await kiaanverseService.askKrishna({
        question,
        chapter_context: currentChapter,
        language: 'en',
        mode: interactionMode,
      })

      setKrishnaState('speaking')
      setKrishnaEmotion(response.emotion)
      setSubtitleText(response.answer)
      addKrishnaResponse(response)

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
      setSubtitleText(
        'My dear friend, my words could not reach you just now. Please ask again.'
      )
    }
  }

  const placeholder =
    interactionMode === 'recital'
      ? 'Request a verse (e.g. "Recite Chapter 2, Verse 47")...'
      : 'Ask Krishna a question...'

  return (
    <div className="absolute bottom-4 left-1/2 z-50 w-[92%] max-w-xl -translate-x-1/2">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-black/50 px-4 py-2 backdrop-blur-xl"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm text-amber-50/90 placeholder-amber-200/35 outline-none md:text-base"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 transition-colors hover:bg-amber-500/30 disabled:opacity-30"
          aria-label="Send"
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
