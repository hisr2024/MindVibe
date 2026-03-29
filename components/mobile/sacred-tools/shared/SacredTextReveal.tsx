'use client'

/**
 * SacredTextReveal — Line-by-line text reveal for guided meditations
 *
 * Shows only the current line, with a fade + slight vertical slide
 * transition between lines. Designed for Dhyan movement and similar
 * contemplative flows where text appears one line at a time.
 */

import { AnimatePresence, motion } from 'framer-motion'

interface SacredTextRevealProps {
  lines: string[]
  currentIndex: number
  className?: string
}

export function SacredTextReveal({
  lines,
  currentIndex,
  className = '',
}: SacredTextRevealProps) {
  const currentLine = lines[currentIndex] ?? ''

  return (
    <div
      className={`flex items-center justify-center min-h-[3em] ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          className="font-sacred italic text-[18px] leading-relaxed text-[#EDE8DC] text-center max-w-[85vw]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {currentLine}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

export default SacredTextReveal
