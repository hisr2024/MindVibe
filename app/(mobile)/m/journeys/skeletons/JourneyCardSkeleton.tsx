/**
 * JourneyCardSkeleton — Full-width pulsing placeholder for journey cards.
 */

'use client'

import { motion } from 'framer-motion'

export function JourneyCardSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
          className="w-full h-[120px] rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
        >
          <div className="flex flex-col justify-between h-full">
            <div className="space-y-2">
              <div className="w-16 h-3 rounded bg-white/[0.06]" />
              <div className="w-3/4 h-4 rounded bg-white/[0.06]" />
              <div className="w-1/2 h-3 rounded bg-white/[0.06]" />
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06]" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
