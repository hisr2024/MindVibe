'use client'

/**
 * MobileReflectionPhase — Sacred journal textarea with voice input.
 * AI-generated reflection prompt with guiding question,
 * word count encouragement, and voice-to-text support.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import type { ReflectionPrompt } from '@/types/sadhana.types'

interface MobileReflectionPhaseProps {
  prompt: ReflectionPrompt
  reflectionText: string
  onReflectionChange: (text: string) => void
  onComplete: () => void
}

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getEncouragement(wordCount: number): string | null {
  if (wordCount >= 100) return 'Your heart speaks clearly...'
  if (wordCount >= 50) return 'The truth is flowing...'
  return null
}

export function MobileReflectionPhase({
  prompt,
  reflectionText,
  onReflectionChange,
  onComplete,
}: MobileReflectionPhaseProps) {
  const [showGuiding, setShowGuiding] = useState(false)
  const [timerElapsed, setTimerElapsed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { triggerHaptic } = useHapticFeedback()

  const wordCount = getWordCount(reflectionText)
  const encouragement = getEncouragement(wordCount)
  const canContinue = wordCount >= 3 || timerElapsed

  // Show guiding question after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowGuiding(true), 600)
    return () => clearTimeout(timer)
  }, [])

  // Enable continue after 30s timeout
  useEffect(() => {
    const timer = setTimeout(() => setTimerElapsed(true), 30000)
    return () => clearTimeout(timer)
  }, [])

  // Auto-resize textarea
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onReflectionChange(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(Math.max(textareaRef.current.scrollHeight, 140), 280) + 'px'
    }
  }, [onReflectionChange])

  const handleContinue = useCallback(() => {
    triggerHaptic('medium')
    onComplete()
  }, [triggerHaptic, onComplete])

  return (
    <div className="relative min-h-[100dvh] flex flex-col px-5 pt-8 pb-20">
      {/* KIAAN Insight label */}
      <motion.p
        className="text-[9px] text-[#D4A017] tracking-[0.15em] uppercase mb-3 font-[family-name:var(--font-ui)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        ✦ REFLECTION
      </motion.p>

      {/* Primary reflection prompt */}
      <motion.p
        className="font-[family-name:var(--font-divine)] italic text-xl text-[#EDE8DC] leading-[1.7] mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {prompt.prompt}
      </motion.p>

      {/* Guiding question */}
      <motion.p
        className="font-[family-name:var(--font-scripture)] italic text-[15px] text-[#B8AE98] leading-[1.6] mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: showGuiding ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {prompt.guidingQuestion}
      </motion.p>

      {/* Sacred textarea */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <textarea
          ref={textareaRef}
          value={reflectionText ?? ''}
          onChange={handleChange}
          placeholder="What stirs in you after this verse?"
          aria-label="Write your reflection"
          className="w-full rounded-[20px] px-[18px] py-4 text-base leading-[1.75] resize-none transition-all duration-300 font-[family-name:var(--font-scripture)]"
          style={{
            minHeight: 140,
            maxHeight: 280,
            backgroundColor: 'rgba(22,26,66,0.5)',
            border: '1px solid rgba(212,160,23,0.15)',
            color: '#EDE8DC',
            outline: 'none',
          }}
          onFocus={(e) => {
            (e.target as HTMLTextAreaElement).style.border = '1px solid rgba(212,160,23,0.5)'
            ;(e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(212,160,23,0.08)'
          }}
          onBlur={(e) => {
            (e.target as HTMLTextAreaElement).style.border = '1px solid rgba(212,160,23,0.15)'
            ;(e.target as HTMLTextAreaElement).style.boxShadow = 'none'
          }}
        />

        {/* Word count and encouragement */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div>
            {encouragement && (
              <motion.span
                className="text-[10px] text-[#D4A017]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {encouragement}
              </motion.span>
            )}
          </div>
          <span className="text-[10px] text-[#6B6355]">
            ✦ {wordCount} words offered
          </span>
        </div>
      </motion.div>

      {/* Continue CTA */}
      <motion.div
        className="mt-auto pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: canContinue ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {canContinue && (
          <button
            onClick={handleContinue}
            className="w-full h-14 rounded-[28px] text-[15px] font-[family-name:var(--font-ui)] text-white transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #1B4FBB, #0E7490)',
              border: '1px solid rgba(212,160,23,0.4)',
              fontWeight: 500,
            }}
          >
            Continue to Intention →
          </button>
        )}
      </motion.div>
    </div>
  )
}
