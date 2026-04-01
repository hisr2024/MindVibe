/**
 * MicroPracticeCard — Day's micro practice from JOURNEY_DAY_META.
 */

'use client'

import { motion } from 'framer-motion'
import type { JourneyDayMeta } from '@/lib/journey/dayMeta'

interface MicroPracticeCardProps {
  dayMeta: JourneyDayMeta
}

export function MicroPracticeCard({ dayMeta }: MicroPracticeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border-l-[3px] border border-white/[0.07]"
      style={{
        borderLeftColor: '#F97316',
        background: 'linear-gradient(145deg, rgba(120,53,15,0.15), rgba(17,20,53,0.98))',
      }}
    >
      <div className="p-4">
        <p className="text-[9px] uppercase tracking-[0.15em] text-[#F97316] font-ui mb-2">
          Micro Practice
        </p>
        <h3 className="font-display text-lg italic text-[#EDE8DC] leading-snug">
          {dayMeta.theme}
        </h3>
        <p className="mt-1 text-[10px] text-[#B8AE98] font-ui">
          {dayMeta.focus}
        </p>
        <p className="mt-3 text-sm text-[#B8AE98] font-sacred leading-relaxed">
          {dayMeta.microPractice}
        </p>
      </div>
    </motion.div>
  )
}
