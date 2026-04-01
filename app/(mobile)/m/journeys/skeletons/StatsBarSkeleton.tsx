/**
 * StatsBarSkeleton — 4 pulsing stat card placeholders in a horizontal scroll row.
 */

'use client'

import { motion } from 'framer-motion'

export function StatsBarSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1 }}
          className="flex-shrink-0 w-[80px] h-[90px] rounded-2xl border border-white/[0.07] bg-white/[0.03]"
        >
          <div className="flex flex-col items-center justify-center h-full gap-2 px-2">
            <div className="w-10 h-8 rounded-lg bg-white/[0.06]" />
            <div className="w-12 h-2 rounded bg-white/[0.06]" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
