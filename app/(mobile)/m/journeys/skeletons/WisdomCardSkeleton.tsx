/**
 * WisdomCardSkeleton — Full-width placeholder for the daily wisdom verse card.
 */

'use client'

import { motion } from 'framer-motion'

export function WisdomCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity }}
      className="w-full rounded-3xl border border-[#D4A017]/20 bg-white/[0.03] p-6"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Reference badge */}
        <div className="w-20 h-3 rounded bg-[#D4A017]/10" />
        {/* Sanskrit lines */}
        <div className="w-full space-y-2 text-center">
          <div className="mx-auto w-4/5 h-6 rounded bg-[#D4A017]/8" />
          <div className="mx-auto w-3/5 h-6 rounded bg-[#D4A017]/6" />
        </div>
        {/* Divider */}
        <div className="w-16 h-px bg-[#D4A017]/15" />
        {/* Translation lines */}
        <div className="w-full space-y-2">
          <div className="w-full h-4 rounded bg-white/[0.05]" />
          <div className="w-5/6 h-4 rounded bg-white/[0.05]" />
          <div className="w-2/3 h-4 rounded bg-white/[0.05]" />
        </div>
        {/* KIAAN reflection */}
        <div className="w-full space-y-2 mt-2 pl-4 border-l-2 border-[#D4A017]/15">
          <div className="w-24 h-3 rounded bg-[#D4A017]/8" />
          <div className="w-full h-3 rounded bg-white/[0.04]" />
          <div className="w-4/5 h-3 rounded bg-white/[0.04]" />
        </div>
      </div>
    </motion.div>
  )
}
