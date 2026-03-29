'use client'

/**
 * SacredLoadingCycle — Sacred loading state with SakhaMandala and cycling messages
 *
 * Displays the mandala avatar with a rotating set of contemplative messages
 * that fade in/out on a configurable interval.
 */

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SakhaMandala } from '@/components/sacred/SakhaMandala'

interface SacredLoadingCycleProps {
  messages: string[]
  interval?: number
}

export function SacredLoadingCycle({
  messages,
  interval = 3000,
}: SacredLoadingCycleProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (messages.length <= 1) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length)
    }, interval)
    return () => clearInterval(timer)
  }, [messages.length, interval])

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <SakhaMandala size={64} animated glowIntensity="high" />

      <div className="h-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            className="font-sacred italic text-[13px] text-[#B8AE98] text-center"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4 }}
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SacredLoadingCycle
