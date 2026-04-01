/**
 * ActiveJourneyCardMobile — Full-width journey progress card with enemy gradient.
 */

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { JourneyResponse, EnemyType } from '@/types/journeyEngine.types'
import {
  ENEMY_INFO,
  getJourneyStatusLabel,
} from '@/types/journeyEngine.types'
import { JourneyProgressRing } from './JourneyProgressRing'

interface ActiveJourneyCardMobileProps {
  journey: JourneyResponse
  index?: number
}

export function ActiveJourneyCardMobile({ journey, index = 0 }: ActiveJourneyCardMobileProps) {
  const primaryEnemy = journey.primary_enemies[0] as EnemyType | undefined
  const info = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null
  const accentColor = info?.color ?? '#D4A017'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link href={`/m/journeys/${journey.journey_id}`}>
        <div
          className="relative overflow-hidden rounded-2xl h-[160px]"
          style={{
            background: `linear-gradient(135deg, ${accentColor}25, rgba(5,7,20,0.95))`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          <div className="relative p-4 flex flex-col justify-between h-full">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                {info && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-divine text-base italic" style={{ color: accentColor }}>
                      {info.sanskrit}
                    </span>
                  </div>
                )}
                <h3 className="text-sm font-ui font-semibold text-[#EDE8DC] line-clamp-2 pr-16">
                  {journey.title}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-ui whitespace-nowrap">
                {getJourneyStatusLabel(journey.status)}
              </span>
            </div>

            {/* Progress section */}
            <div className="flex items-end justify-between">
              <div className="flex-1">
                {/* Linear progress bar */}
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: accentColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${journey.progress_percentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/50 font-ui">
                    Day {journey.current_day} of {journey.total_days}
                  </span>
                  <span className="text-[10px] font-ui font-bold" style={{ color: accentColor }}>
                    {Math.round(journey.progress_percentage)}%
                  </span>
                </div>
                {journey.streak_days > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-[#F97316]/70">
                    <span>{'\uD83D\uDD25'}</span>
                    <span>{journey.streak_days} day streak</span>
                  </div>
                )}
              </div>

              {/* Progress ring */}
              <div className="ml-3">
                <JourneyProgressRing
                  progress={journey.progress_percentage}
                  size={50}
                  strokeWidth={3}
                  color={accentColor}
                  label={`${Math.round(journey.progress_percentage)}%`}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
