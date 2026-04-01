/**
 * JourneyTemplateCard — Template card for starting new journeys.
 */

'use client'

import { motion } from 'framer-motion'
import type { JourneyTemplate, EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO, getDifficultyLabel } from '@/types/journeyEngine.types'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

const ICON_EMOJI: Record<string, string> = {
  flame: '\uD83D\uDD25',
  zap: '\u26A1',
  coins: '\uD83D\uDCB0',
  cloud: '\u2601\uFE0F',
  crown: '\uD83D\uDC51',
  eye: '\uD83D\uDC41\uFE0F',
}

interface JourneyTemplateCardProps {
  template: JourneyTemplate
  onStart: (templateId: string) => void
  isStarting: boolean
  disabled?: boolean
  index?: number
}

export function JourneyTemplateCard({
  template,
  onStart,
  isStarting,
  disabled,
  index = 0,
}: JourneyTemplateCardProps) {
  const { triggerHaptic } = useHapticFeedback()
  const primaryEnemy = template.primary_enemy_tags[0] as EnemyType | undefined
  const info = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null
  const accentColor = info?.color ?? '#D4A017'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileTap={{ scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        border: `1px solid ${accentColor}20`,
        background: `linear-gradient(160deg, ${accentColor}12, rgba(5,7,20,0.98))`,
      }}
    >
      <div className="p-3.5">
        {/* Header: icon + free badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {info && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)`,
                }}
              >
                {ICON_EMOJI[info.icon] || '\u2728'}
              </div>
            )}
            <div>
              <div
                className="text-[10px] font-ui font-medium"
                style={{ color: accentColor }}
              >
                {info?.sanskrit ?? 'Journey'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-white/50 font-ui">
                  {template.duration_days} days
                </span>
                <span className="text-[9px] text-white/40 font-ui">
                  {getDifficultyLabel(template.difficulty)}
                </span>
              </div>
            </div>
          </div>
          {template.is_free && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-ui">
              Free
            </span>
          )}
        </div>

        {/* Title + description */}
        <h3 className="text-[13px] font-ui font-semibold text-[#EDE8DC] line-clamp-2 mb-1">
          {template.title}
        </h3>
        <p className="text-[11px] text-[#B8AE98] font-ui line-clamp-2 mb-3">
          {template.description || 'Begin your journey of inner transformation'}
        </p>

        {/* Start button */}
        <button
          onClick={() => {
            triggerHaptic('medium')
            onStart(template.id)
          }}
          disabled={isStarting || disabled}
          className="w-full rounded-lg py-2 text-[11px] font-ui font-semibold text-[#050714] transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
            boxShadow: `0 2px 8px ${accentColor}30`,
          }}
        >
          {isStarting ? 'Starting...' : 'Begin \u2192'}
        </button>
      </div>
    </motion.div>
  )
}
