/**
 * SubtitleOverlay — Displays Krishna's spoken words as elegant subtitles.
 *
 * Shows the latest Krishna response with a gentle fade-in animation.
 * Positioned at the bottom-center of the scene, above the question input.
 * Text appears letter-by-letter for a typewriter feel.
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function SubtitleOverlay() {
  const subtitleText = useGitaVRStore((s) => s.subtitleText)
  const [displayed, setDisplayed] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* Typewriter effect */
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
    }, 28)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [subtitleText])

  return (
    <AnimatePresence>
      {displayed && (
        <motion.div
          className="pointer-events-none absolute bottom-28 left-1/2 z-40 w-[90%] max-w-2xl -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-xl bg-black/50 px-6 py-4 backdrop-blur-md">
            <p className="text-center font-serif text-base leading-relaxed text-amber-50/90 md:text-lg">
              &ldquo;{displayed}&rdquo;
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
