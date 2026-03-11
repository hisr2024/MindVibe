/**
 * SubtitleOverlay — Displays divine words as elegant floating text.
 *
 * Typewriter effect for immersive narration feel.
 * Positioned above the question input at bottom-center.
 * Ultra-refined glassmorphism treatment.
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'

export default function SubtitleOverlay() {
  const subtitleText = useKiaanverseStore((s) => s.subtitleText)
  const [displayed, setDisplayed] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplayed('')

    if (!subtitleText) return

    let idx = 0
    intervalRef.current = setInterval(() => {
      idx++
      setDisplayed(subtitleText.slice(0, idx))
      if (idx >= subtitleText.length && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 22)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [subtitleText])

  return (
    <AnimatePresence>
      {displayed && (
        <motion.div
          className="pointer-events-none absolute bottom-28 left-1/2 z-40 w-[88%] max-w-2xl -translate-x-1/2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.6 }}
        >
          <div className="rounded-2xl border border-white/[0.04] bg-black/40 px-7 py-5 backdrop-blur-2xl">
            <p className="text-center font-serif text-base font-light leading-relaxed tracking-wide text-amber-50/85 md:text-lg">
              &ldquo;{displayed}&rdquo;
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
