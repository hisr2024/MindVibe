/**
 * EnemyCard — Single enemy card with gradient, sacred symbol, and mastery bar.
 * Shows Devanagari name, mastery level, and current status.
 */

'use client'

import { motion } from 'framer-motion'
import type { EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO, getMasteryDescription } from '@/types/journeyEngine.types'
import { EnemySacredSymbol } from '@/components/journey/EnemySacredSymbol'

interface EnemyCardProps {
  enemy: EnemyType
  mastery: number
  isSelected?: boolean
  onTap: () => void
  index?: number
}

export function EnemyCard({ enemy, mastery, isSelected, onTap, index = 0 }: EnemyCardProps) {
  const info = ENEMY_INFO[enemy]

  return (
    <motion.button
      onClick={onTap}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileTap={{ scale: 0.95 }}
      className="relative w-full h-[140px] rounded-2xl overflow-hidden text-left"
      style={{
        border: isSelected
          ? `2px solid ${info.color}`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isSelected ? `0 0 24px rgba(${info.colorRGB},0.35)` : 'none',
        transform: isSelected ? 'scale(1.03)' : undefined,
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, rgba(${info.colorRGB},0.2), rgba(5,7,20,0.95))`,
        }}
      />

      {/* Sacred symbol (background, bottom-right) */}
      <div className="absolute bottom-2 right-2">
        <EnemySacredSymbol enemy={enemy} size={56} opacity={isSelected ? 0.25 : 0.12} />
      </div>

      <div className="relative p-3 flex flex-col justify-between h-full">
        <div>
          <div
            className="text-[22px] leading-none mb-0.5"
            style={{
              fontFamily: '"Noto Sans Devanagari", sans-serif',
              color: `rgba(${info.colorRGB},0.85)`,
            }}
          >
            {info.devanagari}
          </div>
          <div className="text-[11px] font-ui text-[#EDE8DC]">
            {info.name}
          </div>
        </div>

        <div>
          {/* Mastery progress bar */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: info.color }}
              initial={{ width: 0 }}
              animate={{ width: `${mastery}%` }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[9px] text-white/50 font-ui">
              {getMasteryDescription(mastery)}
            </span>
            <span className="text-[9px] font-ui" style={{ color: info.color }}>
              {mastery}%
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
