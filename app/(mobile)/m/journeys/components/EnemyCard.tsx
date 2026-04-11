/**
 * EnemyCard — Single enemy card with gradient, sacred symbol, and progress bar.
 *
 * When the user has an active journey for this enemy, the card renders
 * the current journey's completion % ("Day 3 · 21%") so the Battleground
 * visibly reflects the work-in-progress. When there is no active journey,
 * it falls back to the long-term mastery_level metric.
 */

'use client'

import { motion } from 'framer-motion'
import type { EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO, getMasteryDescription } from '@/types/journeyEngine.types'
import { EnemySacredSymbol } from '@/components/journey/EnemySacredSymbol'

interface EnemyCardProps {
  enemy: EnemyType
  mastery: number
  /** Active journey progress percentage (0 when no active journey). */
  activeJourneyProgress?: number
  /** Active journey current day (1-indexed). */
  activeJourneyDay?: number
  /** Active journey total duration in days. */
  activeJourneyTotalDays?: number
  isSelected?: boolean
  onTap: () => void
  index?: number
}

export function EnemyCard({
  enemy,
  mastery,
  activeJourneyProgress = 0,
  activeJourneyDay = 0,
  activeJourneyTotalDays = 0,
  isSelected,
  onTap,
  index = 0,
}: EnemyCardProps) {
  const info = ENEMY_INFO[enemy]

  // When there is an active journey, its progress takes visual priority
  // on the Battleground — that is the number the user wants to see grow.
  const hasActiveJourney = activeJourneyProgress > 0 && activeJourneyTotalDays > 0
  const displayPct = hasActiveJourney ? activeJourneyProgress : mastery
  const statusLabel = hasActiveJourney
    ? `Day ${activeJourneyDay} of ${activeJourneyTotalDays}`
    : getMasteryDescription(mastery)

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
          : hasActiveJourney
            ? `1px solid rgba(${info.colorRGB},0.4)`
            : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isSelected ? `0 0 24px rgba(${info.colorRGB},0.35)` : 'none',
        transform: isSelected ? 'scale(1.03)' : undefined,
      }}
    >
      {/* Background gradient — brighter for active journeys */}
      <div
        className="absolute inset-0"
        style={{
          background: hasActiveJourney
            ? `linear-gradient(135deg, rgba(${info.colorRGB},0.3), rgba(5,7,20,0.95))`
            : `linear-gradient(135deg, rgba(${info.colorRGB},0.2), rgba(5,7,20,0.95))`,
        }}
      />

      {/* Sacred symbol (background, bottom-right) */}
      <div className="absolute bottom-2 right-2">
        <EnemySacredSymbol enemy={enemy} size={56} opacity={isSelected ? 0.25 : 0.12} />
      </div>

      {/* Active journey badge */}
      {hasActiveJourney && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-1.5 py-[2px]"
          style={{
            background: `rgba(${info.colorRGB},0.25)`,
            border: `1px solid rgba(${info.colorRGB},0.55)`,
          }}
        >
          <span
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: info.color }}
          />
          <span
            className="text-[7px] font-ui tracking-widest uppercase"
            style={{ color: info.color }}
          >
            Active
          </span>
        </div>
      )}

      <div className="relative p-3 flex flex-col justify-between h-full">
        <div>
          <div
            className="text-[22px] leading-none mb-0.5"
            style={{
              fontFamily: '"Noto Sans Devanagari", sans-serif',
              color: `rgba(${info.colorRGB},0.85)`,
              lineHeight: 1.5,
            }}
          >
            {info.devanagari}
          </div>
          <div className="text-[11px] font-ui text-[#EDE8DC]">
            {info.name}
          </div>
        </div>

        <div>
          {/* Progress bar (journey progress if active, else mastery) */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: info.color }}
              initial={{ width: 0 }}
              animate={{ width: `${displayPct}%` }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="text-[9px] text-white/50 font-ui truncate">
              {statusLabel}
            </span>
            <span
              className="text-[9px] font-ui flex-shrink-0"
              style={{ color: info.color }}
            >
              {displayPct}%
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
