/**
 * TodayPracticeCard — A today's step card with enemy color accent.
 */

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { StepResponse, EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO } from '@/types/journeyEngine.types'

interface TodayPracticeCardProps {
  step: StepResponse
  /** Primary enemy of this step's journey */
  primaryEnemy?: string
  index?: number
}

export function TodayPracticeCard({ step, primaryEnemy, index = 0 }: TodayPracticeCardProps) {
  const enemy = primaryEnemy as EnemyType | undefined
  const info = enemy ? ENEMY_INFO[enemy] : null
  const accentColor = info?.color ?? '#D4A017'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/m/journeys/${step.journey_id}`}>
        <div
          className="relative overflow-hidden rounded-2xl border backdrop-blur-sm"
          style={{
            borderColor: `${accentColor}30`,
            borderTopWidth: 2,
            borderTopColor: accentColor,
          }}
        >
          {/* Left accent strip */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: accentColor }}
          />

          <div className="p-4 pl-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-ui text-sm font-medium text-[#EDE8DC] truncate">
                  {step.step_title}
                </p>
                <p className="mt-1 text-xs text-[#B8AE98] line-clamp-2 font-sacred italic">
                  {step.teaching ? step.teaching.slice(0, 120) + (step.teaching.length > 120 ? '...' : '') : 'Daily practice awaits'}
                </p>
                <p className="mt-1.5 text-[10px] font-ui" style={{ color: accentColor }}>
                  Day {step.day_index} {info ? `\u00B7 ${info.sanskrit}` : ''}
                </p>
              </div>

              <div className="ml-3 flex-shrink-0">
                {step.is_completed ? (
                  <span className="text-xs text-emerald-400 font-medium font-ui">
                    {'\u2713'} Done
                  </span>
                ) : (
                  <span
                    className="inline-block px-3 py-1.5 text-[11px] font-medium font-ui rounded-lg text-[#050714]"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                    }}
                  >
                    Practice
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
