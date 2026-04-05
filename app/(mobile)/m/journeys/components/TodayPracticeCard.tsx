/**
 * TodayPracticeCard — Today's step card with enemy color accent,
 * Devanagari badge, teaching preview, and completion state.
 */

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { StepResponse, EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO } from '@/types/journeyEngine.types'

interface TodayPracticeCardProps {
  step: StepResponse
  primaryEnemy?: string
  index?: number
}

export function TodayPracticeCard({ step, primaryEnemy, index = 0 }: TodayPracticeCardProps) {
  const enemy = primaryEnemy as EnemyType | undefined
  const info = enemy ? ENEMY_INFO[enemy] : null
  const accentColor = info?.color ?? '#D4A017'
  const rgb = info?.colorRGB ?? '212,160,23'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.12 }}
    >
      <Link href={`/m/journeys/${step.journey_id}`}>
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            border: `1px solid rgba(${rgb},0.2)`,
            borderTopWidth: 2,
            borderTopColor: accentColor,
            background: `linear-gradient(160deg, rgba(${rgb},0.08), rgba(5,7,20,0.98))`,
          }}
        >
          {/* Left accent strip */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: accentColor }}
          />

          <div className="p-4 pl-5">
            {/* Top row: enemy badge + estimated time */}
            <div className="flex items-center justify-between mb-1">
              {info && (
                <span
                  className="text-[11px]"
                  style={{
                    fontFamily: '"Noto Sans Devanagari", sans-serif',
                    color: accentColor,
                  }}
                >
                  {info.devanagari}
                </span>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-ui text-[15px] font-medium text-[#EDE8DC] truncate">
                  {step.step_title}
                </p>
                <p className="mt-1 text-[13px] text-[#B8AE98] line-clamp-2 font-sacred italic leading-relaxed">
                  {step.teaching
                    ? step.teaching.slice(0, 120) + (step.teaching.length > 120 ? '...' : '')
                    : 'Daily practice awaits'}
                </p>
                <p className="mt-1.5 text-[10px] font-ui" style={{ color: accentColor }}>
                  Day {step.day_index}
                </p>
              </div>

              <div className="ml-3 flex-shrink-0">
                {step.is_completed ? (
                  <div className="flex flex-col items-center">
                    <span className="text-emerald-400 text-lg">{'\u2713'}</span>
                    <span className="text-[9px] text-emerald-400/70 font-ui">Done</span>
                  </div>
                ) : (
                  <span
                    className="inline-block px-3.5 py-2 text-[11px] font-medium font-ui rounded-xl text-[#050714]"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                      boxShadow: `0 2px 8px rgba(${rgb},0.25)`,
                    }}
                  >
                    Practice {'\u2192'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Completed overlay */}
          {step.is_completed && (
            <div className="absolute inset-0 bg-[#050714]/40 pointer-events-none" />
          )}
        </div>
      </Link>
    </motion.div>
  )
}
