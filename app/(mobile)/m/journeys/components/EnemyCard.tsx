/**
 * EnemyCard — Single enemy card with gradient for BattlegroundTab.
 */

'use client'

import { motion } from 'framer-motion'
import type { EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO, getMasteryDescription } from '@/types/journeyEngine.types'

const ICON_EMOJI: Record<string, string> = {
  flame: '\uD83D\uDD25',
  zap: '\u26A1',
  coins: '\uD83D\uDCB0',
  cloud: '\u2601\uFE0F',
  crown: '\uD83D\uDC51',
  eye: '\uD83D\uDC41\uFE0F',
}

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
        boxShadow: isSelected ? `0 0 20px ${info.color}40` : 'none',
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${info.color}30, rgba(5,7,20,0.95))`,
        }}
      />

      <div className="relative p-3 flex flex-col justify-between h-full">
        <div>
          <span className="text-xl">{ICON_EMOJI[info.icon] || '\u2728'}</span>
          <div className="mt-1 font-divine text-2xl italic text-white/90">
            {info.sanskrit}
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
